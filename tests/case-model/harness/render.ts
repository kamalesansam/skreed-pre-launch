// The case-model render harness (case-model-class.md 10 and 14 T6): bundled by scripts/case-model/calibrate.mjs with
// esbuild and driven by Playwright. It renders the supplier model through the page's own modules (case-glb, the finish
// materials, the pose and camera rule, Neutral tone mapping, the RoomEnvironment PMREM) and reads pixels back.
// Never in dist/: the site build does not import it.
import {
  AmbientLight, BackSide, Color, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, NeutralToneMapping, NoToneMapping, OrthographicCamera, PMREMGenerator,
  Raycaster, Scene, SphereGeometry, SRGBColorSpace, Vector3, WebGLRenderTarget, WebGLRenderer, DirectionalLight, FloatType, RGBAFormat,
  type Camera, type Material, type Texture,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadSupplierAsset, type CaseManifest } from '../../../src/scripts/family/three/case-glb.ts';
import { getAccentMaterial, getFinishMaterial, disposeFinishMaterials } from '../../../src/scripts/family/three/finish-materials.ts';
import { cameraAt, derive, lineupFor, pose, SUPPLIER_TUNING } from '../../../src/scripts/family/three/pose.ts';
import type { CaseAsset, CasePart } from '../../../src/scripts/family/three/case-asset.ts';
import MANIFEST from '../../../src/data/case-model.json' with { type: 'json' };

type Finish = 'matte' | 'gloss';
interface Cell { hex: string }
let renderer: WebGLRenderer, asset: CaseAsset, lod0: CasePart[], lod1: CasePart[];
let envRoom: Texture, envWhite: Texture;
const canvas = document.createElement('canvas');
document.body.append(canvas);

export async function init(): Promise<{ dims: CaseAsset['dims'] }> {
  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(1);
  asset = await loadSupplierAsset(MANIFEST as unknown as CaseManifest);
  lod1 = asset.lods[1];
  lod0 = await asset.loadDetail();
  const pm = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  envRoom = pm.fromScene(room, 0.04).texture;
  room.dispose();
  const white = new Scene();
  white.add(new Mesh(new SphereGeometry(50, 16, 8), new MeshBasicMaterial({ color: 0xffffff, side: BackSide })));
  envWhite = pm.fromScene(white, 0).texture;
  pm.dispose();
  return { dims: asset.dims };
}

/** A one-case scene: every part as a 1-instance InstancedMesh, the shade through instanceColor as on the page. */
function caseScene(parts: CasePart[], finish: Finish, hex: string, m: Matrix4, tier: 'high' | 'low' = 'high', albedo?: number): { scene: Scene; set(hex: string, m: Matrix4, albedo?: number): void; meshes: InstancedMesh[] } {
  const scene = new Scene();
  const meshes = parts.map((p) => {
    const mat: Material = p.followsShade ? getFinishMaterial(finish, tier, p.tint ?? 1) : getAccentMaterial();
    const im = new InstancedMesh(p.geometry, mat, 1);
    im.frustumCulled = false;
    im.userData = { part: p };
    scene.add(im);
    return im;
  });
  const c = new Color(), t = new Matrix4();
  const set = (h: string, mm: Matrix4, alb?: number) => {
    for (const im of meshes) {
      const p = im.userData.part as CasePart;
      im.setMatrixAt(0, t.copy(mm).multiply(p.base));
      im.instanceMatrix.needsUpdate = true;
      if (p.followsShade) { if (alb !== undefined) c.setRGB(alb, alb, alb); else c.setStyle(h); im.setColorAt(0, c); im.instanceColor!.needsUpdate = true; }
      im.boundingSphere = null;
    }
  };
  set(hex, m, albedo);
  return { scene, set, meshes };
}

/** The back plate's sample point (0, -0.25 h) on the outer surface, found by a ray from +Z into the body (calibration A, B). */
function samplePoint(parts: CasePart[], m: Matrix4): Vector3 {
  const body = parts.find((p) => p.name === 'body')!;
  const mesh = new Mesh(body.geometry, new MeshBasicMaterial());
  mesh.matrixAutoUpdate = false;
  mesh.matrix.copy(body.base); mesh.matrixWorld.copy(body.base);
  const rc = new Raycaster(new Vector3(0, -0.25, 5), new Vector3(0, 0, -1));
  const hit = rc.intersectObject(mesh, false)[0];
  if (!hit) throw new Error('no back plate at (0, -0.25)');
  return hit.point.clone().applyMatrix4(m);
}

function project(p: Vector3, cam: Camera, x0: number, y0: number, w: number, h: number, H: number): [number, number] {
  const v = p.clone().project(cam);
  return [Math.round(x0 + (v.x + 1) / 2 * w), Math.round(H - (y0 + (v.y + 1) / 2 * h))];   // canvas pixel (top-left origin)
}

/** The page's front-case rest pose and camera (calibration B) for a cell of w x h. */
function frontPose(layout: 'wide' | 'phone'): { m: Matrix4; cam: (w: number, h: number) => Camera } {
  const P = lineupFor(asset.dims, layout, SUPPLIER_TUNING), K = derive(P), m = new Matrix4();
  pose(11, 11, 1, P, K, m);
  // the case fills about 80% of the cell height: pxu = 0.8 h / S, D from pxu as in pose.ts
  return { m, cam: (w, h) => cameraAt(w, h, (h / 2) / ((0.8 * h / P.S) * Math.tan(P.fov / 2 * Math.PI / 180)), P) };
}
/** A fanned row case (slot offset x = +-1 or +-3) in the live lineup, for the row-colour report. */
function rowPose(x: number, layout: 'wide' | 'phone'): Matrix4 {
  const P = lineupFor(asset.dims, layout, SUPPLIER_TUNING), K = derive(P), m = new Matrix4();
  pose(11 + x, 11, 1, P, K, m);
  m.setPosition(0, 0, 0);
  return m;
}

/**
 * Linear radiance at the sample point for albedo 0 and 1, per light (environment at E 1, key at K 1), tone mapping off,
 * into a float target. Every material here is linear in its albedo, so any shade at any (E, K) follows exactly.
 */
export function coefficients(cfg: { kind: 'A' | 'B' | 'row'; finish: Finish; x?: number; layout?: 'wide' | 'phone'; tier?: 'high' | 'low' }): { env: number[][]; key: number[][]; amb: number[][] } {
  const W = 256, H = 384;
  const isA = cfg.kind === 'A';
  const m = isA ? new Matrix4() : cfg.kind === 'B' ? frontPose(cfg.layout ?? 'wide').m : rowPose(cfg.x ?? 1, cfg.layout ?? 'wide');
  const parts = cfg.kind === 'row' ? lod1 : lod0;
  const cam: Camera = isA ? new OrthographicCamera(-0.4, 0.4, 0.6, -0.6, 0.01, 10) : frontPose(cfg.layout ?? 'wide').cam(W, H);
  if (isA) { cam.position.set(0, 0, 3); cam.lookAt(0, 0, 0); (cam as OrthographicCamera).updateProjectionMatrix(); cam.updateMatrixWorld(); }
  const sp = samplePoint(parts, m);
  const [px, py] = project(sp, cam, 0, 0, W, H, H);
  const rt = new WebGLRenderTarget(W, H, { type: FloatType, format: RGBAFormat, samples: 0 });
  const cs = caseScene(parts, cfg.finish, '#ffffff', m, cfg.tier ?? 'high');
  const key = new DirectionalLight(0xffffff, 1);
  key.position.set(...(KEYPOS as [number, number, number]));
  const read = () => { const buf = new Float32Array(9 * 4); renderer.readRenderTargetPixels(rt, px - 1, H - py - 2, 3, 3, buf); const s = [0, 0, 0]; for (let i = 0; i < 9; i++) for (let c = 0; c < 3; c++) s[c] += buf[i * 4 + c] / 9; return s; };
  const amb = new AmbientLight(0xffffff, 1);
  const out = { env: [] as number[][], key: [] as number[][], amb: [] as number[][] };
  renderer.toneMapping = NoToneMapping;
  renderer.setRenderTarget(rt);
  for (const light of ['env', 'key', 'amb'] as const) {
    cs.scene.environment = light === 'env' ? (isA ? envWhite : envRoom) : null;
    cs.scene.environmentIntensity = 1;
    if (light === 'key') cs.scene.add(key); else cs.scene.remove(key);
    if (light === 'amb') cs.scene.add(amb); else cs.scene.remove(amb);
    for (const alb of [0, 1]) {
      cs.set('#000', m, alb);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(cs.scene, cam);
      out[light].push(read());
    }
  }
  renderer.setRenderTarget(null);
  rt.dispose();
  cs.meshes.forEach((im) => im.dispose());
  return out;
}
let KEYPOS = [-2, 3, 4];
export function setKey(p: number[]): void { KEYPOS = p; }

/**
 * Real 8-bit renders of a 6 x 4 family grid (the contact sheet, T6): A (white environment, orthographic, flat backs) or
 * B (page lighting at E, K; each cell the front-case rest pose through the page camera, scissored). Returns the sampled
 * sRGB of every cell and the grid as a PNG data URL.
 */
export function grid(cfg: { kind: 'A' | 'B'; finish: Finish; hexes: string[]; E: number; K: number; A?: number; cellW?: number; cellH?: number; neutral?: string; x?: number }): { rgb: number[][]; png: string } {
  const cw = cfg.cellW ?? 120, ch = cfg.cellH ?? 180, W = cw * 6, H = ch * 4;
  renderer.setSize(W, H, false);
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setScissorTest(true);
  const isA = cfg.kind === 'A';
  const fp = isA ? null : frontPose('wide');
  const m = isA ? new Matrix4() : cfg.x ? rowPose(cfg.x, 'wide') : fp!.m;
  const parts = cfg.x ? lod1 : lod0;
  const cam: Camera = isA ? new OrthographicCamera(-0.4, 0.4, 0.6, -0.6, 0.01, 10) : fp!.cam(cw, ch);
  if (isA) { cam.position.set(0, 0, 3); cam.lookAt(0, 0, 0); (cam as OrthographicCamera).updateProjectionMatrix(); cam.updateMatrixWorld(); }
  const cs = caseScene(parts, cfg.finish, cfg.hexes[0], m);
  if (!isA && cfg.A) cs.scene.add(new AmbientLight(0xffffff, cfg.A));
  cs.scene.environment = isA ? envWhite : envRoom;
  cs.scene.environmentIntensity = isA ? 1 : cfg.E;
  if (!isA) { const key = new DirectionalLight(0xffffff, cfg.K); key.position.set(...(KEYPOS as [number, number, number])); cs.scene.add(key); }
  const bg = new Color(cfg.neutral ?? '#000000');
  renderer.setClearColor(bg, cfg.neutral ? 1 : 0);
  renderer.setScissor(0, 0, W, H); renderer.setViewport(0, 0, W, H); renderer.clear();
  const sp = samplePoint(parts, m);
  const pts: [number, number][] = [];
  cfg.hexes.forEach((hex, i) => {
    const cx = (i % 6) * cw, cy = H - (Math.floor(i / 6) + 1) * ch;   // GL viewport origin bottom-left
    renderer.setViewport(cx, cy, cw, ch); renderer.setScissor(cx, cy, cw, ch);
    cs.set(hex, m);
    renderer.render(cs.scene, cam);
    pts.push(project(sp, cam, cx, cy, cw, ch, H));
  });
  renderer.setScissorTest(false);
  const gl = renderer.getContext();
  const px = new Uint8Array(4 * 9);
  const rgb = pts.map(([x, y]) => { gl.readPixels(x - 1, H - y - 2, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, px); const s = [0, 0, 0]; for (let i = 0; i < 9; i++) for (let c = 0; c < 3; c++) s[c] += px[i * 4 + c] / 9; return s.map((v) => Math.round(v)); });
  const png = canvas.toDataURL('image/png');
  cs.meshes.forEach((im) => im.dispose());
  return { rgb, png };
}

/** The gloss guard of calibration B: the peak relative luminance over the front case's pixels at (E, K). */
export function peak(cfg: { hex: string; E: number; K: number; A?: number; finish: Finish }): number {
  const W = 256, H = 384;
  renderer.setSize(W, H, false);
  renderer.setViewport(0, 0, W, H);
  renderer.toneMapping = NeutralToneMapping;
  const fp = frontPose('wide');
  const cs = caseScene(lod0, cfg.finish, cfg.hex, fp.m);
  cs.scene.environment = envRoom; cs.scene.environmentIntensity = cfg.E;
  const key = new DirectionalLight(0xffffff, cfg.K); key.position.set(...(KEYPOS as [number, number, number])); cs.scene.add(key);
  if (cfg.A) cs.scene.add(new AmbientLight(0xffffff, cfg.A));
  renderer.setClearColor(0x000000, 0); renderer.clear();
  renderer.render(cs.scene, fp.cam(W, H));
  const gl = renderer.getContext(), px = new Uint8Array(W * H * 4);
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const lin = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  let best = 0;
  for (let i = 0; i < W * H; i++) if (px[i * 4 + 3] > 250) best = Math.max(best, 0.2126 * lin(px[i * 4]) + 0.7152 * lin(px[i * 4 + 1]) + 0.0722 * lin(px[i * 4 + 2]));
  cs.meshes.forEach((im) => im.dispose());
  return best;
}

export function dispose(): void { asset.dispose(); disposeFinishMaterials(); envRoom.dispose(); envWhite.dispose(); renderer.dispose(); }

(window as unknown as { H: unknown }).H = { init, coefficients, grid, peak, setKey, dispose };
