// The family page's stage (docs/specs/family-page.md 19 to 21; the prototype's module, ported): ciao's carousel with
// the case in place of the can, ciao's two spots and the procedural studio, the calibrated colour, the seven-screen
// scroll (the zoom, the four case types with the half turn and the one-case hand-over, the argument pose with its
// float), the inputs of the first screen (tap, drag, hover tilt), the tier probe, render on demand, context loss and
// disposal. One renderer, two models (the Tough case for the carousel, the second model from the first hand-over's
// edge-on frame), five to eight draw calls. No GSAP: the loop lags the scroll and the line with its own rates.
import {
  Box3, Color, DynamicDrawUsage, Euler, InstancedMesh, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, NeutralToneMapping, ACESFilmicToneMapping,
  PerspectiveCamera, PMREMGenerator, Quaternion, Raycaster, Scene, SpotLight, SRGBColorSpace, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget, FloatType,
  type BufferGeometry, type Material, type WebGLRenderTarget as RT,
} from 'three';
import type { CaseAsset, CasePart } from './case-asset.ts';
import { makeStudio, TONE, toneInverse, albedoFit } from './studio.ts';
import { CFG, DEG, beatPose, poseOf, solve, type Fit, type Fx, type Layout } from './pose.ts';
import type { Finish, Input } from '../bus.ts';
import CAL from './calibration.json' with { type: 'json' };

export type Tier = 'high' | 'low';
export class StageError extends Error {
  readonly reason: 'webgl' | 'software' | 'slow' | 'context';
  constructor(reason: StageError['reason'], msg?: string) { super(msg ?? reason); this.reason = reason; }
}

export interface StageOptions {
  host: HTMLElement; canvas: HTMLCanvasElement;
  /** the Tough case (the carousel's 24) and the second model (MagTough, Snap and Armor on the Desert stand-in), or null in a dev build */
  tough: CaseAsset; second: CaseAsset | null;
  shades: string[]; selected: number; finish: Finish;
  /** reduced motion (still3d): every move is instant, no float */
  still: boolean;
  /** test builds: SwiftShader allowed (?render=force), a forced tier, ACES (?tm=1), the rest frame held (?pose=poster) */
  force: boolean; tier?: Tier; aces?: boolean; hold?: boolean;
  layout(): Layout; fine(): boolean; coarse(): boolean;
  /** the loader's milestones: env, compile, lod0, frame2 */
  report(m: string): void;
  onPick(i: number, input: Input, dragging?: boolean): void;
  onTurn(side: 1 | -1): void;
  onLive(): void;
  onLost(): void;
}

export interface StageState { s: number; target: number; G: number; sv: number; drag: boolean; turn: boolean; raf: boolean; running: boolean; busy: boolean; renders: number; tier: Tier; detail: 'none' | 'loading' | 'loaded' | 'failed'; caseType: 'tough' | 'second'; counts: { front: number; second: number }; fov: number; probe: Probe | null }
export interface Probe { P: number; median: number; cpuMedian: number }

const nextFrame = () => new Promise<number>((r) => requestAnimationFrame(r));
const yieldMain = () => new Promise<void>((r) => setTimeout(r, 0));
/** a cubic-bezier easing for the 600 ms turn (--ease-turn) */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t, Y = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => { let lo = 0, hi = 1, t = x; for (let i = 0; i < 24; i++) { t = (lo + hi) / 2; if (X(t) < x) lo = t; else hi = t; } return Y(t); };
}
const easeTurn = bezier(0.45, 0, 0.55, 1);
const bump = (t: number) => (t < 0.5 ? easeTurn(t * 2) : easeTurn((1 - t) * 2));
const NOFLOAT = { yaw: 0, tilt: 0, y: 0 };

/** A model's draw set: one instanced mesh per part, the parts that follow the shade coloured per instance. */
interface Draw { part: CasePart; mesh: InstancedMesh }

export async function createStage(o: StageOptions) {
  const { host, canvas } = o;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default', failIfMajorPerformanceCaveat: !o.force });
  } catch (e) { throw new StageError('webgl', String(e)); }
  const undo: (() => void)[] = [() => { renderer.dispose(); renderer.forceContextLoss(); }];
  try {
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = o.aces ? ACESFilmicToneMapping : NeutralToneMapping;   // Neutral: the one departure from ciao's ACES (section 19)
    renderer.toneMappingExposure = 1;
    const gl = renderer.getContext();
    const compile = (sc: Scene, c: PerspectiveCamera) => (renderer.extensions.has('KHR_parallel_shader_compile') ? renderer.compileAsync(sc, c) : Promise.resolve(renderer.compile(sc, c)));
    await yieldMain();

    const dims = o.tough.dims;
    const scene = new Scene();
    // the studio: a PMREM of the procedural studio, turned -40 degrees about y (section 20), disposed with the generator
    let envTarget: RT | null = null;
    const makeEnv = (keepOld: boolean) => {
      const pm = new PMREMGenerator(renderer);
      const st = makeStudio(1); st.rotation.y = CFG.envRot * DEG; st.updateMatrixWorld(true);
      const t = pm.fromScene(st, 0.04); st.disposeStudio(); pm.dispose();
      if (!keepOld) envTarget?.dispose();
      envTarget = t;
      scene.environment = t.texture;
      for (const m of [M.gloss, M.logoGloss]) if (m) m.envMap = t.texture;
    };
    undo.push(() => { envTarget?.dispose(); scene.environment = null; });
    scene.environmentIntensity = CAL.environmentIntensity;
    // ciao's two spotlights, white, 50 cd, 8 units, a 45 degree cone with full penumbra, decay 0.1; the top one 1.5 units
    // in front of ciao's place (section 20: at ciao's it skims the flat back and the clearcoat reflects it as a sheen)
    const spots = [[[0, 3.5, 1.5], [0, 0, 1]], [[0, -3, 2], [0, 0, 1.8]]].map(([p, t]) => {
      const l = new SpotLight(0xffffff, CFG.spot, 8, Math.PI / 4, 1, 0.1);
      l.position.set(p[0], p[1], p[2]); l.target.position.set(t[0], t[1], t[2]); scene.add(l, l.target); return l;
    });
    // ciao's profile light: one spot from above the zoomed case (its spotY 2.2 and its target 2.5 below, scaled by 1.2),
    // a 22.5 degree cone with full penumbra in place of its soft mask, 35 cd, range 15
    const gobo = new SpotLight(0xffffff, 0, 15, Math.PI / 8, 1, 0.1);
    gobo.position.set(0, 2.64, 2); gobo.target.position.set(0, -0.36, 0); scene.add(gobo, gobo.target);

    // materials: the previous finish under ciao's light (section 20); the base specular a fifth of a plastic's
    let tier: Tier = o.tier ?? 'high';
    const lod1 = o.tough.lods[1];
    const accentColor = lod1.find((p) => p.name === 'accent')?.color ?? [0.073, 0.077, 0.077];
    const logoTint = lod1.find((p) => p.name === 'logo')?.tint ?? 1;
    const M: { matte: MeshPhysicalMaterial; trim: MeshStandardMaterial; logoMatte: MeshPhysicalMaterial; gloss: MeshPhysicalMaterial | null; logoGloss: MeshPhysicalMaterial | null } = {
      matte: new MeshPhysicalMaterial({ color: 0xffffff, roughness: CAL.matte.roughness, metalness: 0, specularIntensity: CAL.matte.specularIntensity }),
      // the liner's faces coincide with the shell's along the outline and the button cut-outs; pushed back a hair so the shell wins there
      trim: new MeshStandardMaterial({ color: new Color(accentColor[0], accentColor[1], accentColor[2]), roughness: CAL.trim.roughness, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
      logoMatte: new MeshPhysicalMaterial({ color: new Color(logoTint, logoTint, logoTint), roughness: CAL.matte.roughness, metalness: 0, specularIntensity: CAL.matte.specularIntensity, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
      gloss: null, logoGloss: null,
    };
    undo.push(() => { for (const m of Object.values(M)) m?.dispose(); });
    makeEnv(false);
    o.report('env');
    await yieldMain();
    const glossFor = (t: Tier) => {
      const m = t === 'high'
        ? new MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: CAL.gloss.roughness, clearcoat: CAL.gloss.clearcoat, clearcoatRoughness: CAL.gloss.clearcoatRoughness, specularIntensity: CAL.gloss.specularIntensity })
        : new MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: CAL.glossLow.roughness, specularIntensity: CAL.glossLow.specularIntensity });
      m.envMap = envTarget!.texture; m.envMapIntensity = scene.environmentIntensity;
      return m;
    };
    const materialFor = (part: CasePart, finish: Finish): Material => {
      if (part.name === 'accent') return M.trim;
      const g = finish === 'gloss' && M.gloss;
      if (part.name === 'logo') return g ? M.logoGloss! : M.logoMatte;
      return g ? M.gloss! : M.matte;
    };

    // meshes: the Tough case's row (LOD1, 24, drawn for the slots that are not in front), its front pair (LOD0, 2) and
    // its logo (24); the second model's parts (1 each), drawn from the first hand-over's edge-on frame. The case only
    // (Sam, 2026-10-09): no phone, glass or lenses, so the camera window shows the page through.
    const IM = (geo: BufferGeometry, mat: Material, n: number, name: string) => { const m = new InstancedMesh(geo, mat, n); m.name = name; m.frustumCulled = false; m.instanceMatrix.setUsage(DynamicDrawUsage); scene.add(m); return m; };
    let finish: Finish = o.finish;
    const row: Draw[] = lod1.filter((p) => p.name !== 'logo').map((p) => ({ part: p, mesh: IM(p.geometry, materialFor(p, finish), 24, `${p.name}.row`) }));
    const front: Draw[] = lod1.filter((p) => p.name !== 'logo').map((p) => ({ part: p, mesh: IM(p.geometry, materialFor(p, finish), 2, `${p.name}.front`) }));
    const logoPart = lod1.find((p) => p.name === 'logo');
    const logo: Draw | null = logoPart ? { part: logoPart, mesh: IM(logoPart.geometry, materialFor(logoPart, finish), 24, 'logo') } : null;
    const second: Draw[] = (o.second ? o.second.lods[1] : []).map((p) => { const m = IM(p.geometry, materialFor(p, finish), 1, `${p.name}.second`); m.count = 0; return { part: p, mesh: m }; });
    const all = () => [...row, ...front, ...(logo ? [logo] : []), ...second].map((d) => d.mesh);
    undo.push(() => { for (const m of all()) { m.dispose(); scene.remove(m); } });

    // colour (section 19): the albedo that makes the sample point read the catalog shade through the tone map
    const col = new Color();
    let hexes = o.shades.slice();
    const invCache = new Map<string, number[]>();
    const albedo = (hex: string): Color => {
      col.setStyle(hex);
      const k = finish === 'gloss' ? CAL.gloss : CAL.matte;
      const key = (o.aces ? 'a' : 'n') + hex + (finish === 'gloss' ? 'g' : 'm');
      let x = invCache.get(key);
      if (!x) {
        const f = o.aces ? TONE.aces : TONE.neutral, y = [col.r, col.g, col.b];
        x = albedoFit(y, f, k.a, k.b, toneInverse(y, f).map((v) => (v - k.b) / k.a)); invCache.set(key, x);
      }
      return col.setRGB(x[0], x[1], x[2]);
    };
    let frontSlots: number[] = [], order = [...Array(24).keys()];
    const colourRow = () => { for (const d of row) if (d.part.followsShade) { for (let k = 0; k < 24; k++) d.mesh.setColorAt(k, albedo(hexes[order[k]])); d.mesh.instanceColor!.needsUpdate = true; } };
    const colourFront = () => {
      for (const d of front) if (d.part.followsShade) { for (let j = 0; j < 2; j++) d.mesh.setColorAt(j, albedo(hexes[frontSlots[j] ?? 0])); d.mesh.instanceColor!.needsUpdate = true; }
      for (const d of second) if (d.part.followsShade) { d.mesh.setColorAt(0, albedo(hexes[frontSlots[0] ?? 0])); d.mesh.instanceColor!.needsUpdate = true; }
    };
    const colourAll = () => {
      colourRow();
      if (logo) { for (let i = 0; i < 24; i++) logo.mesh.setColorAt(i, albedo(hexes[i])); logo.mesh.instanceColor!.needsUpdate = true; }
      colourFront();
    };
    colourAll();

    // poses
    const mTmp = new Matrix4(), mTmp2 = new Matrix4(), poseM = Array.from({ length: 24 }, () => new Matrix4());
    const qv = new Quaternion(), eu = new Euler(), vp = new Vector3(), vs = new Vector3(), qs = new Quaternion(), YAX = new Vector3(0, 1, 0);
    let W = 0, H = 0, fit: Fit | null = null;
    const poseMatrix = (i: number, s: number, fx: Fx | null, out: Matrix4) => {
      const p = poseOf(i, s, W || 1280, fx);
      eu.set(p.rx, p.ry, p.rz, 'XYZ');
      qv.setFromEuler(eu).multiply(qs.setFromAxisAngle(YAX, p.spin));
      return out.compose(vp.set(p.X, p.Y, p.Z), qv, vs.set(p.sc, p.sc, p.sc));
    };
    // the selected case's matrix after the carousel: its carousel pose blended to ciao's profile pose by B.k, the turn,
    // then the argument pose by B.A; f carries the float (the pointer's yaw and tilt in degrees, the bob in units)
    const zoomMatrix = (i: number, s: number, B: ReturnType<typeof beatPose>, f: { yaw: number; tilt: number; y: number }, out: Matrix4) => {
      const p = poseOf(i, s, W || 1280, null), k = B.k, A = B.A;
      const X = p.X * (1 - k), Y = p.Y * (1 - k) + B.cy * k + f.y, Z = p.Z * (1 - k) - 0.5 * A, sc = p.sc * (1 - k / 6);
      eu.set(p.rx * (1 - k) + (-0.3491 + f.tilt * DEG) * A, p.ry * (1 - k) + (-0.2618) * k * (1 - A) + f.yaw * DEG + B.yaw, p.rz * (1 - k) + (-0.0873) * A, 'XYZ');
      qv.setFromEuler(eu).multiply(qs.setFromAxisAngle(YAX, p.spin * (1 - k)));
      return out.compose(vp.set(X, Y, Z), qv, vs.set(sc, sc, sc));
    };
    let last = { A: 0, yaw: 0, second: false, k: 0 };
    // ciao's camera (z 29, FOV 20, unrotated); on phones a view offset lifts the carousel (pose.ts solve) and, after it,
    // the camera stands further back and the case is held in the band above the text (section 21, D8)
    const cam = new PerspectiveCamera(CFG.fov, 1, 4, 75);
    cam.position.set(0, 0, CFG.camZ);
    const phone = () => o.layout() === 'phone';
    const update = (s: number, G: number, fx: Fx | null, now: number | null) => {
      const a = Math.max(0, Math.min(23, Math.round(s))), nf = [a];
      if (Math.abs(s - a) > 1e-4) { const b = s > a ? a + 1 : a - 1; if (b >= 0 && b < 24) nf.push(b); }
      if (nf.join() !== frontSlots.join()) {
        frontSlots = nf;
        order = [];
        for (let i = 0; i < 24; i++) if (!frontSlots.includes(i)) order.push(i);
        order.push(...frontSlots);
        for (const d of row) d.mesh.count = 24 - frontSlots.length;
        colourRow(); colourFront();
      }
      for (let i = 0; i < 24; i++) poseMatrix(i, s, fx, poseM[i]);
      const B = beatPose(st.sv), fs = Math.round(s);
      const useSecond = second.length > 0 && B.k > 0 && B.second;   // one case type per frame (D3)
      if (B.k > 0) {
        const sp = 1 + 2.5 * B.k;   // the neighbours slide out as ciao's do (its spacing 1 to 3.5)
        for (let i = 0; i < 24; i++) if (i !== fs) poseM[i].elements[12] *= sp;
        let f = NOFLOAT;
        if (B.A > 0) {
          f = { yaw: fx ? fx.yaw * B.A : 0, tilt: fx ? fx.tilt * B.A : 0, y: 0 };
          if (now != null && !o.still) { f.y = 0.05 * Math.sin(now / 5600 * 2 * Math.PI) * B.A; f.yaw += 1.5 * Math.sin(now / 8300 * 2 * Math.PI + 1) * B.A; }
        }
        zoomMatrix(fs, s, B, f, poseM[fs]);
      }
      last = { A: B.A, yaw: B.yaw, second: useSecond, k: B.k };
      // ciao's entrance: the light comes up; the zoom hands over to the one spot; the argument brings the two spots back (45 of 50)
      for (const l of spots) l.intensity = CFG.spot * G * (1 - B.k + 0.9 * B.k * B.A);
      gobo.intensity = 35 * B.k * (1 - B.A) * G;
      scene.environmentIntensity = CAL.environmentIntensity * (1 - 0.8 * B.k * (1 - B.A));
      for (const m of [M.gloss, M.logoGloss]) if (m) m.envMapIntensity = scene.environmentIntensity;
      const back = phone() ? 1 + (CFG.phoneBack - 1) * B.k : 1;
      cam.position.set(0, -2.4 * B.k * (1 - B.A) * back, CFG.camZ - 17 * B.k - 4 * B.k * B.A + (12 * back - 12) * B.k * (1 - B.A) + (8 * back - 8) * B.k * B.A);
      cam.rotation.set(0.1745 * B.k * (1 - B.A), 0, B.rz * B.k);
      const fov = CFG.fov + 25 * B.k * B.A;
      if (Math.abs(fov - cam.fov) > 1e-6) { cam.fov = fov; cam.updateProjectionMatrix(); }
      place(B.k);
      for (const d of second) { d.mesh.count = useSecond ? 1 : 0; if (useSecond) d.mesh.setMatrixAt(0, mTmp2.multiplyMatrices(poseM[fs], d.part.base)); }
      for (const d of row) for (let k = 0; k < d.mesh.count; k++) d.mesh.setMatrixAt(k, mTmp.multiplyMatrices(poseM[order[k]], d.part.base));
      // the Tough case's parts at the selected slot are away while the second model shows there
      if (logo) for (let i = 0; i < 24; i++) logo.mesh.setMatrixAt(i, useSecond && i === fs ? mTmp.makeScale(0, 0, 0) : mTmp.multiplyMatrices(poseM[i], logo.part.base));
      for (const d of front) {
        frontSlots.forEach((slot, j) => d.mesh.setMatrixAt(j, useSecond && slot === fs ? mTmp.makeScale(0, 0, 0) : mTmp.multiplyMatrices(poseM[slot], d.part.base)));
        d.mesh.count = useSecond && frontSlots.length === 1 ? 0 : frontSlots.length;
      }
      for (const m of all()) { m.instanceMatrix.needsUpdate = true; m.boundingSphere = null; }
    };
    // the view offset: the carousel's lift on phones, blended to the band above the text after it
    const place = (k = last.k) => {
      if (!fit) return;
      cam.aspect = W / H;
      // the view offset moves the view window down by its y: a positive offset lifts the scene (the carousel's shiftY is negative)
      let shift = -fit.shiftY;
      if (phone() && k > 0) {
        cam.setViewOffset(W, H, 0, 0, W, H); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
        const c = vp.setFromMatrixPosition(poseM[Math.round(st.s)]).project(cam);
        const want = CFG.phoneCentre * H, at = (1 - c.y) / 2 * H;
        shift = -fit.shiftY * (1 - k) + (at - want) * k;
      }
      cam.setViewOffset(W, H, 0, shift, W, H);
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
    };
    const dprFor = () => (tier === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, phone() || o.coarse() ? 2 : 1.5));
    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return false;
      W = w; H = h;
      renderer.setPixelRatio(dprFor());
      renderer.setSize(W, H, false);
      fit = solve(W, H, o.layout(), dims);
      place();
      return true;
    };
    resize();

    // the motion state (one store; the page's HUD follows round(target))
    const st = { sv: 0, svT: 0, s: 0, target: 0, G: 0, Gt: 1, tilt: { yaw: 0, pitch: 0 }, tiltT: { yaw: 0, pitch: 0 }, turn: null as null | { t0: number; side: 1 | -1 }, drag: null as null | { s0: number; x0: number }, input: 'deeplink' as Input, lastFollow: 0, followT: 0 };
    let running = false, visible = true, raf = 0, lastT = 0, tail = 0, live = false, losses = 0, disposed = false, dirty = 0, renders = 0;
    let detail: StageState['detail'] = 'none';
    const frameMs: number[] = [];
    const instant = () => o.still;
    const renderNow = () => { const t0 = performance.now(); renderer.render(scene, cam); return performance.now() - t0; };
    const animating = () => (!st.drag && st.s !== st.target) || st.G !== st.Gt || !!st.turn || Math.abs(st.sv - st.svT) > 1e-3 || Math.abs(st.tilt.yaw - st.tiltT.yaw) > 0.01 || Math.abs(st.tilt.pitch - st.tiltT.pitch) > 0.01;
    const busy = () => !!st.drag || animating();
    let lastSig = '';
    function frame(now: number) {
      raf = 0;
      if (!running || disposed) return;
      const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 1 / 60;
      lastT = now;
      const k = 1 - Math.exp(-CFG.rate * dt), kG = 1 - Math.exp(-CFG.rate * CFG.gRate * dt);
      if (instant()) { if (!st.drag) st.s = st.target; st.G = st.Gt; st.tilt.yaw = st.tiltT.yaw = 0; st.tilt.pitch = st.tiltT.pitch = 0; st.turn = null; }
      else {
        if (!st.drag) st.s += (st.target - st.s) * k;
        st.G += (st.Gt - st.G) * kG;
        st.tilt.yaw += (st.tiltT.yaw - st.tilt.yaw) * k;
        st.tilt.pitch += (st.tiltT.pitch - st.tilt.pitch) * k;
      }
      st.sv += (st.svT - st.sv) * (instant() ? 1 : 1 - Math.exp(-10 * dt)); if (Math.abs(st.svT - st.sv) < 1e-3) st.sv = st.svT;
      if (!st.drag && Math.abs(st.target - st.s) < 0.0005) st.s = st.target;
      if (Math.abs(st.Gt - st.G) < 0.0005) st.G = st.Gt;
      let turnYaw = 0;
      if (st.turn) { const t = (now - st.turn.t0) / 600; if (t >= 1) st.turn = null; else turnYaw = st.turn.side * CFG.turn * bump(Math.max(0, t)); }
      const floating = st.sv > 5.2 && !instant() && visible;   // the argument screen's bob keeps the loop alive
      const sig = [st.s, st.G, st.tilt.yaw + turnYaw, st.tilt.pitch, st.sv, floating ? now : 0].join();
      if (sig !== lastSig || dirty) {
        lastSig = sig; dirty = 0;
        update(st.s, st.G, { yaw: st.tilt.yaw + turnYaw, tilt: st.tilt.pitch }, now);
        frameMs.push(renderNow()); if (frameMs.length > 120) frameMs.shift();
        renders++;
      }
      // while a finger drags, the page's HUD follows at most every 150 ms
      if (st.drag) {
        const r = Math.max(0, Math.min(23, Math.round(st.target)));
        if (now - st.lastFollow > 150) { st.lastFollow = now; clearTimeout(st.followT); st.followT = 0; o.onPick(r, 'drag', true); }
        else if (!st.followT) st.followT = window.setTimeout(() => { st.followT = 0; if (!st.drag || disposed) return; st.lastFollow = performance.now(); o.onPick(Math.max(0, Math.min(23, Math.round(st.target))), 'drag', true); }, Math.max(0, 150 - (now - st.lastFollow)));
      }
      if (animating() || floating) { tail = 2; kick(true); } else if (tail-- > 0) kick(true);
    }
    function kick(fromFrame = false) {
      if (!fromFrame) dirty++;
      if (raf || !running || !visible || disposed) return;
      if (!fromFrame) lastT = 0;
      raf = requestAnimationFrame(frame);
    }
    undo.push(() => { disposed = true; running = false; cancelAnimationFrame(raf); });
    const goTo = (i: number, input: Input, snap = false) => {
      i = Math.max(0, Math.min(23, i));
      st.target = i; st.input = input; st.drag = null;
      if (snap || instant()) st.s = i;
      kick();
    };

    // picking: the front pair wins over the row (the row does not draw the front slots)
    const ray = new Raycaster(), ndc = new Vector2();
    const pickAt = (cx: number, cy: number): number | null => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam);
      const hits = ray.intersectObjects(all(), false);
      for (const h of hits) {
        const m = h.object as InstancedMesh, id = h.instanceId ?? 0;
        if (front.some((d) => d.mesh === m)) return frontSlots[id];
        if (row.some((d) => d.mesh === m)) return order[id];
        if (second.some((d) => d.mesh === m)) return frontSlots[0] ?? null;
        return id;   // the logo: instance i is slot i
      }
      return null;
    };
    // inputs (the first screen only): tap (10 px or less of travel), drag with axis lock and fling, hover cursor, pointer tilt
    let down: null | { id: number; x: number; y: number; lock: 'x' | 'y' | null; moved: number; samples: { t: number; x: number }[] } = null, dragEnd = 0, lastMoved = 0, hoverRaf = 0, hoverPt: PointerEvent | null = null;
    const stripPx = () => fit?.stripPx ?? CFG.slotPx;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (st.svT > 0.5) return;
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, lock: null, moved: 0, samples: [{ t: e.timeStamp, x: e.clientX }] };
      lastMoved = 0;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (down && e.pointerId === down.id) {
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        down.moved = Math.max(down.moved, Math.hypot(dx, dy));
        if (!down.lock && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
          down.lock = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
          if (down.lock === 'x') {
            try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
            st.drag = { s0: st.s, x0: e.clientX };
            st.turn = null;
            canvas.style.cursor = 'grabbing';
          }
        }
        if (down.lock === 'x' && st.drag) {
          let raw = st.drag.s0 - (e.clientX - st.drag.x0) / stripPx();
          if (!instant()) { if (raw < 0) raw *= 0.35; else if (raw > 23) raw = 23 + (raw - 23) * 0.35; } else raw = Math.max(0, Math.min(23, raw));
          st.s = st.target = raw;
          st.input = 'drag';
          down.samples.push({ t: e.timeStamp, x: e.clientX });
          while (down.samples.length > 2 && e.timeStamp - down.samples[0].t > 100) down.samples.shift();
          kick();
        }
        return;
      }
      if (e.pointerType === 'mouse') { hoverPt = e; if (!hoverRaf) hoverRaf = requestAnimationFrame(hover); }
    });
    const endDrag = (e: PointerEvent, cancelled: boolean) => {
      if (!down || e.pointerId !== down.id) return;
      lastMoved = Math.max(down.moved, Math.hypot(e.clientX - down.x, e.clientY - down.y));
      if (st.drag) {
        let v = 0;
        const sm = down.samples.filter((p) => e.timeStamp - p.t <= 80);
        if (!cancelled && sm.length >= 2) { const a = sm[0], b = sm[sm.length - 1]; if (b.t > a.t) v = (b.x - a.x) / (b.t - a.t) * 1000; }
        const fling = instant() || cancelled ? 0 : v * 0.2 / stripPx();
        const t = Math.max(0, Math.min(23, Math.round(st.s - fling)));
        st.drag = null; clearTimeout(st.followT); st.followT = 0;
        dragEnd = performance.now();
        canvas.style.cursor = '';
        st.target = t; st.input = 'drag';
        o.onPick(t, 'drag', false);
        kick();
      }
      down = null;
    };
    canvas.addEventListener('pointerup', (e) => endDrag(e, false));
    canvas.addEventListener('pointercancel', (e) => endDrag(e, true));
    canvas.addEventListener('click', (e) => {
      if (e.target !== canvas || performance.now() - dragEnd < 100 || lastMoved > 10 || st.svT > 0.5) return;
      const slot = pickAt(e.clientX, e.clientY);
      if (slot == null) return;
      const frontSlot = Math.round(st.s);
      if (slot === frontSlot && slot === st.target) {
        if (instant()) return;
        const v = new Vector3(0, 0, 0).applyMatrix4(poseMatrix(slot, st.s, null, mTmp)).project(cam);
        const r = canvas.getBoundingClientRect();
        const side: 1 | -1 = e.clientX >= r.left + (v.x + 1) / 2 * r.width ? 1 : -1;
        st.turn = { t0: performance.now(), side };
        o.onTurn(side);
        kick();
      } else o.onPick(slot, 'tap');
    });
    function hover() {
      hoverRaf = 0;
      if (!hoverPt || st.drag) return;
      const e = hoverPt;
      const slot = st.svT > 0.5 ? null : pickAt(e.clientX, e.clientY);
      canvas.style.cursor = slot == null ? '' : 'pointer';
      if (o.fine() && !instant()) {
        const r = host.getBoundingClientRect();
        const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
        const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
        st.tiltT.yaw = CFG.tiltYaw * nx;
        st.tiltT.pitch = CFG.tiltPitch * ny;
        kick();
      }
    }
    canvas.addEventListener('pointerleave', () => { hoverPt = null; st.tiltT.yaw = st.tiltT.pitch = 0; if (!st.drag) canvas.style.cursor = ''; kick(); });

    // lifecycle: resize, pixel-ratio change, visibility, context loss
    const onResize = () => { if (resize()) { if (live) { update(st.s, st.G, null, null); renderNow(); } kick(); } };
    const ro = new ResizeObserver(onResize);
    ro.observe(host);
    let mqDpr: MediaQueryList | null = null;
    const onDpr = () => { watchDpr(); onResize(); };
    const watchDpr = () => { mqDpr?.removeEventListener('change', onDpr); mqDpr = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`); mqDpr.addEventListener('change', onDpr); };
    watchDpr();
    const io = new IntersectionObserver((en) => { visible = en[en.length - 1].isIntersecting; if (visible) kick(); });
    io.observe(host);
    const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else kick(); };
    document.addEventListener('visibilitychange', onVis);
    const unlisten = () => { ro.disconnect(); io.disconnect(); mqDpr?.removeEventListener('change', onDpr); document.removeEventListener('visibilitychange', onVis); };
    undo.push(unlisten);
    canvas.addEventListener('webglcontextlost', (e) => {
      losses++;
      running = false; cancelAnimationFrame(raf); raf = 0;
      canvas.classList.remove('on');
      if (losses >= 2) { o.onLost(); return; }   // a second loss in the session: grid mode (spec 5)
      e.preventDefault();
    });
    canvas.addEventListener('webglcontextrestored', () => {
      if (disposed) return;
      makeEnv(true);   // the old target's GL objects died with the context
      for (const m of all()) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
      running = true;
      update(st.s, st.G, null, null); renderNow();
      canvas.classList.add('on');
      kick();
    });

    // the tier probe (family-page.md 2.5): the display period from 10 frames, then 20 forced renders
    st.s = st.target = Math.max(0, Math.min(23, o.selected));
    update(st.s, 1, null, null);
    await compile(scene, cam);
    o.report('compile');
    const probe = async (): Promise<Probe> => {
      let lastF = await nextFrame(); const iv: number[] = [];
      for (let i = 0; i < 10; i++) { const t = await nextFrame(); iv.push(t - lastF); lastF = t; }
      const ok = iv.filter((v) => v >= 4); const P = ok.length ? Math.min(...ok) : 16.67;
      const rt: number[] = [], cpu: number[] = [];
      lastF = await nextFrame();
      for (let i = 0; i < 20; i++) { cpu.push(renderNow()); const t = await nextFrame(); rt.push(t - lastF); lastF = t; }
      rt.sort((a, b) => a - b); cpu.sort((a, b) => a - b);
      return { P: +P.toFixed(2), median: +((rt[9] + rt[10]) / 2).toFixed(2), cpuMedian: +((cpu[9] + cpu[10]) / 2).toFixed(2) };
    };
    let probeResult: Probe | null = null;
    if (!o.tier) {
      probeResult = await probe();
      if (probeResult.median > 1.25 * probeResult.P) {
        tier = 'low';
        resize();
        const p2 = await probe();
        if (p2.median > 3 * p2.P && !o.force) throw new StageError('slow', 'the low tier is still too slow');
      }
    }
    M.gloss = glossFor(tier);
    M.logoGloss = glossFor(tier); M.logoGloss.color.setScalar(logoTint); M.logoGloss.polygonOffset = true; M.logoGloss.polygonOffsetFactor = -1; M.logoGloss.polygonOffsetUnits = -1;
    const applyFinish = (f: Finish) => {
      finish = f;
      for (const d of [...row, ...front, ...(logo ? [logo] : []), ...second]) d.mesh.material = materialFor(d.part, f);
      colourAll();   // the calibrated albedo depends on the finish
    };
    applyFinish(finish);

    // the back-plate sample point (calibration: (0, -0.25) on the outer back)
    const sampleZ = (() => {
      const body = lod1.find((p) => p.name === 'body')!;
      const mesh = new Mesh(body.geometry); mesh.matrixAutoUpdate = false; mesh.matrix.copy(body.base); mesh.matrixWorld.copy(body.base);
      const h = new Raycaster(new Vector3(0, CAL.sampleY, 10), new Vector3(0, 0, -1)).intersectObject(mesh)[0];
      return h ? h.point.z : dims.d / 2;
    })();

    /** LOD0 for the front pair (the Tough case's close-up) and the second model, after a high verdict. */
    const setDetail = (which: 'tough' | 'second', parts: CasePart[]) => {
      if (disposed) return;
      const set = which === 'tough' ? front : second;
      for (const d of set) { const p = parts.find((q) => q.name === d.part.name); if (p) { d.mesh.geometry = p.geometry; (d as { part: CasePart }).part = p; } }
      dirty++; kick();
    };

    const api = {
      renderer, canvas, tier: () => tier, probe: () => probeResult,
      live: () => live && running,
      goTo,
      setTarget: (i: number, instantMove: boolean) => goTo(i, 'key', instantMove),
      scroll(v: number) { st.svT = Math.max(0, v); kick(); },
      snapScroll(v: number) { st.sv = st.svT = Math.max(0, v); dirty++; update(st.s, st.G, null, null); renderNow(); },
      setFinish(f: Finish) { applyFinish(f); if (!instant()) st.turn = { t0: performance.now(), side: 1 }; kick(); },
      setDetail,
      setDetailState(d: StageState['detail']) { detail = d; },
      pause() { running = false; cancelAnimationFrame(raf); raf = 0; },
      resume() { if (disposed) return; running = true; resize(); update(st.s, st.G, null, null); renderNow(); kick(); },
      kick: () => kick(),
      render: () => { update(st.s, st.G, null, null); renderNow(); },
      dispose() {
        unlisten();
        disposed = true; running = false; cancelAnimationFrame(raf);
        for (const m of all()) { m.dispose(); scene.remove(m); }
        for (const m of Object.values(M)) m?.dispose();
        envTarget?.dispose(); scene.environment = null;
        renderer.dispose(); if (!gl.isContextLost()) renderer.forceContextLoss(); canvas.remove();
      },
      info() {
        update(st.s, st.G, null, null);
        const ms = renderNow();
        const i = renderer.info;
        const fm = [...frameMs].sort((a, b) => a - b);
        return { calls: i.render.calls, triangles: i.render.triangles, frame: i.render.frame, programs: i.programs?.length ?? 0, geometries: i.memory.geometries, textures: i.memory.textures,
          tier, probe: probeResult, dpr: renderer.getPixelRatio(), canvas: [canvas.width, canvas.height], size: [W, H], fit, renderMs: +ms.toFixed(2),
          frameMsMedian: fm.length ? +fm[Math.floor(fm.length / 2)].toFixed(2) : null, s: st.s, target: st.target, G: st.G, front: frontSlots, rowCount: row[0]?.mesh.count ?? 0,
          sv: st.sv, beat: last, counts: { front: front[0]?.mesh.count ?? 0, second: second[0]?.mesh.count ?? -1 }, fov: cam.fov, caseType: last.second ? 'second' : 'tough' };
      },
      state: (): StageState => ({ s: st.s, target: st.target, G: st.G, sv: st.sv, drag: !!st.drag, turn: !!st.turn, raf: !!raf, running, busy: busy(), renders, tier, detail, caseType: last.second ? 'second' : 'tough', counts: { front: front[0]?.mesh.count ?? 0, second: second[0]?.mesh.count ?? -1 }, fov: cam.fov, probe: probeResult }),
      /** a slot's centre on the page (CSS px), at the current pose */
      project(slot: number, local: [number, number, number] = [0, 0, 0]): { x: number; y: number } {
        const B = beatPose(st.sv);
        const m = B.k > 0 && slot === Math.round(st.s) ? zoomMatrix(slot, st.s, B, NOFLOAT, new Matrix4()) : poseMatrix(slot, st.s, null, new Matrix4());
        const v = new Vector3(local[0], local[1], local[2]).applyMatrix4(m).project(cam);
        const r = canvas.getBoundingClientRect();
        return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
      },
      /** the selected case's screen box (CSS px, page) from its eight corners, at the current pose */
      caseBox(): { x0: number; x1: number; y0: number; y1: number } {
        const slot = Math.round(st.s), B = beatPose(st.sv), m = B.k > 0 ? zoomMatrix(slot, st.s, B, NOFLOAT, new Matrix4()) : poseMatrix(slot, st.s, null, new Matrix4());
        const r = canvas.getBoundingClientRect(), b = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
        for (const a of [-1, 1]) for (const bb of [-1, 1]) for (const c of [-1, 1]) {
          const v = new Vector3(a * dims.w / 2, bb * 0.5, c * dims.d / 2).applyMatrix4(m).project(cam);
          const x = r.left + (v.x + 1) / 2 * r.width, y = r.top + (1 - v.y) / 2 * r.height;
          b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y);
        }
        return b;
      },
      pickAt,
      /** the canvas as a PNG data URL, read in the same task as its render */
      snapshot() { update(st.s, st.G, null, null); renderNow(); return canvas.toDataURL('image/png'); },
      lose: () => gl.getExtension('WEBGL_lose_context'),
      // verification: a case's back plate (3 x 3 px at the sample point) right after a render
      sample(slot?: number, local?: [number, number, number]) {
        slot = slot ?? Math.round(st.s);
        const l = local ?? [0, CAL.sampleY, sampleZ];
        update(st.s, st.G, null, null); renderNow();
        const v = new Vector3(l[0], l[1], l[2]).applyMatrix4(poseMatrix(slot, st.s, null, new Matrix4())).project(cam);
        const dpr = renderer.getPixelRatio();
        const px = Math.round((v.x + 1) / 2 * W * dpr), py = Math.round((v.y + 1) / 2 * H * dpr);
        const buf = new Uint8Array(36);
        gl.readPixels(px - 1, py - 1, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        const rgb = [0, 1, 2].map((c) => { let s = 0; for (let j = 0; j < 9; j++) s += buf[j * 4 + c]; return Math.round(s / 9); });
        return { rgb, px: [px / dpr, H - py / dpr], hex: hexes[slot] };
      },
      // verification: a and b of the colour calibration, read in linear light (a float target, no tone mapping)
      calibrate(ly = CAL.sampleY) {
        const rt = new WebGLRenderTarget(canvas.width, canvas.height, { type: FloatType });
        const slot = Math.round(st.s), dpr = renderer.getPixelRatio();
        update(st.s, 1, null, null);
        const v = new Vector3(0, ly, sampleZ).applyMatrix4(poseMatrix(slot, st.s, null, new Matrix4())).project(cam);
        const px = Math.round((v.x + 1) / 2 * W * dpr), py = Math.round((v.y + 1) / 2 * H * dpr), j = frontSlots.indexOf(slot), res: Record<string, { a: number[]; b: number[] }> = {};
        const body = front.find((d) => d.part.name === 'body')!.mesh;
        const read = (a: number) => {
          body.setColorAt(j, col.setRGB(a, a, a)); body.instanceColor!.needsUpdate = true;
          renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null);
          const buf = new Float32Array(36); renderer.readRenderTargetPixels(rt, px - 1, py - 1, 3, 3, buf);
          return [0, 1, 2].map((c) => { let t = 0; for (let k = 0; k < 9; k++) t += buf[k * 4 + c]; return t / 9; });
        };
        const keep = finish;
        for (const f of ['matte', 'gloss'] as const) { applyFinish(f); const w = read(1), k0 = read(0); res[f] = { a: w.map((x, c) => +(x - k0[c]).toFixed(5)), b: k0.map((x) => +x.toFixed(5)) }; }
        applyFinish(keep); rt.dispose();
        update(st.s, st.G, null, null); renderNow();
        return { tier, px: [px, py], ly, res };
      },
      start() {
        // go live: the family, the shade and the finish may have changed while the stage booted (the page is the truth)
        st.target = Math.max(0, Math.min(23, o.selected)); st.s = st.target; st.G = instant() || o.hold ? 1 : 0; st.Gt = 1; st.turn = null;
        running = true;
        update(st.s, st.G, null, null);
        renderNow();
        live = true;
        canvas.classList.add('on');
        o.report('frame2');
        o.onLive();
        kick();
      },
    };
    return api;
  } catch (err) {
    while (undo.length) { try { undo.pop()!(); } catch { /* keep undoing */ } }
    throw err;
  }
}
export type StageApi = Awaited<ReturnType<typeof createStage>>;
