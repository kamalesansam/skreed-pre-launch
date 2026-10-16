// Section 4's Skreed universe (docs/specs/section-4.md 2 "The universe", 3, 5 and 12): a round room 11 m across under an
// emissive ceiling disc (src/assets/room/room.glb and its lightmap, scripts/room/universe.py), its wall ten bays of 36
// degrees in the families' key shades, the floor Pearl Whisper, the pedestals Urban Slate, all coloured here by position
// over the baked irradiance; on the four pedestals Sam's four products (2026-10-16): the phone case (the family pages'
// Cobalt model through loadSupplierAsset), the MagSafe wallet, the Lenskin and the AirPods case (his FBX files cleaned by
// scripts/room/products.py and packed by pack.mjs, src/data/room-products.json), each part drawn in its product's shade
// and finish, lit by a PMREM of three's RoomEnvironment (an emissive disc lights no PBR material in three). The scene
// renders linear into a half-float target and through the output pass (post.ts), which encodes sRGB for the composite.
import { Box3, Color, Group, HalfFloatType, LinearFilter, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, NoToneMapping, PerspectiveCamera, PMREMGenerator, RGBAFormat, Scene, ShaderMaterial, Texture, Vector3, WebGLRenderTarget, type Material, type Object3D, type WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import roomUrl from '../../../assets/room/room.glb?url';
import lightAvifUrl from '../../../assets/room/room-lightmap.avif?url';
import lightWebpUrl from '../../../assets/room/room-lightmap.webp?url';
import CASE from '../../../data/case-model.json';
import MODELS from '../../../data/room-products.json';
import CAL from '../../family/three/calibration.json' with { type: 'json' };
import { loadSupplierAsset, type ModelEntry } from '../../family/three/case-glb.ts';
import type { CaseAsset, CasePart } from '../../family/three/case-asset.ts';
import { fetchModel } from '../../family/three/model-fetch.ts';
import { MeshoptDecoder } from '../../family/three/vendor/meshopt-decoder-reference.js';
import { PEARL_WHISPER, URBAN_SLATE } from '../../../config/tokens.ts';
import { RENDER_COLOURS, ROOM_BAYS, ROOM_PRODUCTS, UNIVERSE, pedestalAt, roomParams, type RoomParams, type RoomProduct } from '../../../config/room.ts';
import { LIGHT_VERT, loadLightmap, loadModel } from './assets.ts';
import { createOutputPass } from './post.ts';

/** the case's height in metres (src/data/case-model.json sizeMm, 196.7 mm) */
const CASE_H = (CASE.sizeMm[1] as number) / 1000;
type Finish = RoomProduct['finish'];
/** the dark trim of the case (case-model.json's accent), used for the other products' tabs and plates too */
const TRIM_RGB = [0.073, 0.077, 0.077] as const;
/** the logo inlay's share of the shade (the case's 0.8468, case-model.json) */
const LOGO_TINT = 0.8468;

export interface UniverseScene {
  readonly started: boolean;
  readonly ready: boolean;
  readonly failed: boolean;
  readonly out: Texture | null;
  load(): Promise<void>;
  resize(w: number, h: number): void;
  /** yaw: the view's turn in degrees (left negative); look: the head's sway; hover: the hovered pedestal or -1; dolly: metres still to walk in from the doorway (the transition's last steps) */
  update(yaw: number, look: { yaw: number; pitch: number }, hover: number, dolly: number, dt: number, params: RoomParams): void;
  render(): void;
  /** each pedestal's label anchor (UNIVERSE.labelAbove over its product) in CSS pixels, null when off screen or empty */
  anchors(): ({ x: number; y: number } | null)[];
  /** the pedestal whose column (pedestal and product, at least 44 px square) holds the CSS pixel, nearest its axis, or -1 */
  pick(x: number, y: number): number;
  /** a product is drawn on pedestal i */
  shown(i: number): boolean;
  hooks(): Record<string, unknown>;
  dispose(): void;
}

export interface UniverseOptions { renderer: WebGLRenderer; avif: boolean; reduced: boolean; /** touch devices get no bloom */ touch?: boolean }

// irradiance x albedo by place: the floor Pearl Whisper, the ceiling plaster, the wall's ten bays (bay 0 centred on the
// doorway behind the camera, then clockwise seen from above: the visitor's left first), a hairline groove between bays,
// the pedestals Urban Slate. Linear out: the output pass encodes.
const ROOM_FRAG = /* glsl */`
  uniform sampler2D tLight; uniform float uExposure, uWalls, uR;
  uniform vec3 uBays[10]; uniform vec3 uFloor, uCeil, uPed, uPearl;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  void main() {
    vec3 light = texture2D(tLight, vUv).rgb * 2.0 * uExposure;   // the bake put its median at 0.5 (universe.py): 2 brings it to 1
    float rad = length(vWorld.xz);
    vec3 alb = uPed;
    if (vNormal.y > 0.9 && vWorld.y < 0.03) alb = uFloor;
    else if (vNormal.y < -0.9) alb = uCeil;
    else if (rad > uR - 0.08 && abs(vNormal.y) < 0.5) {
      float phi = mod(degrees(atan(-vWorld.z, -vWorld.x)) + 18.0, 360.0);
      float k = floor(phi / 36.0), f = fract(phi / 36.0);
      vec3 bay = uBays[0];
      for (int i = 1; i < 10; i++) if (float(i) == k) bay = uBays[i];
      alb = mix(uPearl, bay, uWalls);
      float edge = min(f, 1.0 - f) * 36.0 * 0.0174533 * uR;            // metres from the nearest bay edge
      alb *= 1.0 - 0.18 * (1.0 - smoothstep(0.006, 0.014, edge));
    }
    gl_FragColor = vec4(light * alb, 1.0);
  }`;

interface Product { group: Group; body: Group; lift: number; top: number; halfW: number; mats: Material[]; exhibit: number }

export function createUniverse(o: UniverseOptions): UniverseScene {
  const { renderer } = o;
  const D = roomParams();
  const scene = new Scene(); scene.background = new Color(...RENDER_COLOURS.hallClear);
  const cam = new PerspectiveCamera(D.fov, 1, 0.05, 30);
  const lin = (hex: string) => new Color(hex);   // the hex is sRGB; three's Color holds it linear
  const U = {
    tLight: { value: null as Texture | null }, uExposure: { value: D.roomExposure }, uWalls: { value: D.wallsColour }, uR: { value: UNIVERSE.radius },
    uBays: { value: ROOM_BAYS.map((b) => lin(b.hex)) }, uFloor: { value: lin(PEARL_WHISPER) }, uCeil: { value: new Color(...RENDER_COLOURS.roomCeiling) }, uPed: { value: lin(URBAN_SLATE) }, uPearl: { value: lin(PEARL_WHISPER) },
  };
  const roomMat = new ShaderMaterial({ uniforms: U, vertexShader: LIGHT_VERT, fragmentShader: ROOM_FRAG });
  const lampMat = new MeshBasicMaterial({ color: new Color(...RENDER_COLOURS.roomLamp) });
  const post = createOutputPass(renderer);
  let rt: WebGLRenderTarget | null = null, W = 1, H = 1, wantW = 1, wantH = 1, warming = false;
  let started = false, ready = false, failed = false, model: Object3D | null = null, lightmap: Texture | null = null, asset: CaseAsset | null = null, envTarget: WebGLRenderTarget | null = null;
  const products: Product[] = [];
  const owned: { dispose(): void }[] = [];
  const _v = new Vector3(), _cc = new Color();
  const CLEAR = new Color(...RENDER_COLOURS.hallClear);   // white: the hall's open ends, the room before it draws
  const anchorCam = new PerspectiveCamera(D.fov, 1, 0.05, 30);   // the view without the pointer's sway: the labels never chase the pointer
  let curYaw = -UNIVERSE.arcSpan, curHover = -1;

  // the products' materials (the family page's calibration, family-page.md 20): matte, gloss with its clearcoat, and the
  // Lenskin's metallic matte (a metal accent, catalog page 18); the logo inlay a share of the shade; the trim fixed
  const shadeMat = (hex: string, finish: Finish) => {
    const c = lin(hex);
    if (finish === 'gloss') return new MeshPhysicalMaterial({ color: c, metalness: 0, roughness: CAL.gloss.roughness, clearcoat: CAL.gloss.clearcoat, clearcoatRoughness: CAL.gloss.clearcoatRoughness, specularIntensity: CAL.gloss.specularIntensity });
    if (finish === 'metallic') return new MeshPhysicalMaterial({ color: c, metalness: 1, roughness: 0.38 });
    return new MeshPhysicalMaterial({ color: c, metalness: 0, roughness: CAL.matte.roughness, specularIntensity: CAL.matte.specularIntensity });
  };
  const partMats = (hex: string, finish: Finish, logoTint = LOGO_TINT) => {
    const body = shadeMat(hex, finish);
    const logo = body.clone(); logo.color = lin(hex).multiplyScalar(logoTint); logo.polygonOffset = true; logo.polygonOffsetFactor = -1; logo.polygonOffsetUnits = -1;
    const trim = new MeshStandardMaterial({ color: new Color(TRIM_RGB[0], TRIM_RGB[1], TRIM_RGB[2]), roughness: CAL.trim.roughness, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    return { body, logo, trim };
  };

  /** the case, standing on its long edge with its back to the camera, turned 20 degrees so its side reads */
  const caseMesh = (parts: readonly CasePart[], prod: RoomProduct, mats: Material[]) => {
    const m = partMats(prod.hex, prod.finish, parts.find((p) => p.name === 'logo')?.tint ?? LOGO_TINT); mats.push(m.body, m.logo, m.trim);
    const g = new Group();
    for (const p of parts) {
      const mesh = new Mesh(p.geometry, p.name === 'accent' ? m.trim : p.name === 'logo' ? m.logo : m.body);
      mesh.matrixAutoUpdate = false; mesh.matrix.copy(p.base); mesh.frustumCulled = false; g.add(mesh);
    }
    g.scale.setScalar(CASE_H); g.position.y = CASE_H * 0.5 + 0.003; g.rotation.set(-8 * Math.PI / 180, 20 * Math.PI / 180, 0);
    return { group: g, top: CASE_H };
  };

  /** one of Sam's three models (life size, standing on y = 0, the front toward +z): the shell, the wallet's edge and the AirPods case's lid in the shade, the logo a share of it, the trim fixed */
  const modelMesh = (root: Object3D, prod: RoomProduct, mats: Material[]) => {
    const m = partMats(prod.hex, prod.finish); mats.push(m.body, m.logo, m.trim);
    root.traverse((o) => {
      const mesh = o as Mesh; if (!mesh.isMesh) return;
      mesh.material = mesh.name === 'trim' ? m.trim : mesh.name === 'logo' ? m.logo : m.body;
      mesh.frustumCulled = false; owned.push(mesh.geometry);
    });
    const g = new Group(); g.add(root);
    // the flat things lean back a little so their faces catch the light and the eye; all turn 20 degrees so a side reads
    const lean = prod.model === 'lenskin' ? -14 : prod.model === 'wallet' ? -8 : 0;
    g.rotation.set(lean * Math.PI / 180, (prod.model === 'airpods' ? -25 : 20) * Math.PI / 180, 0);
    g.updateMatrixWorld(true);
    const box = new Box3().setFromObject(g);
    g.position.y = -box.min.y + 0.002;
    return { group: g, top: box.max.y - box.min.y };
  };

  /** Sam's model by its manifest entry, through our own fetch (20 s timeout, memo) and the vendored pure-JS meshopt decoder */
  const loadProduct = async (which: keyof typeof MODELS): Promise<Object3D> => {
    const buf = await fetchModel(MODELS[which].url);
    const g = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buf, '');
    return g.scene;
  };

  // the products are built at life size inside a 'body' group per pedestal whose scale is Tune's productScale times the
  // product's exhibit, so the scale changes live; top is the product's height at life size (the label anchor and the pick column scale with it)
  function buildProducts(parts: readonly CasePart[], roots: Partial<Record<RoomProduct['model'], Object3D>>) {
    ROOM_PRODUCTS.forEach((prod, i) => {
      const ped = pedestalAt(i), a = (ped.deg * Math.PI) / 180;
      const group = new Group(), body = new Group(), mats: Material[] = [];
      // face the camera: local +z (the case's back, the others' fronts) toward the doorway
      group.position.set(ped.x, ped.height, ped.z);
      group.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
      group.add(body);
      const root = roots[prod.model];
      const built = prod.model === 'cobalt' ? caseMesh(parts, prod, mats) : root ? modelMesh(root, prod, mats) : null;
      let halfW: number = UNIVERSE.pedestalRadius;
      if (built) { body.add(built.group); built.group.updateMatrixWorld(true); const b = new Box3().setFromObject(built.group); halfW = Math.max(Math.abs(b.min.x), Math.abs(b.max.x)); }
      scene.add(group);
      products.push({ group, body, lift: 0, top: built?.top ?? 0, halfW, mats, exhibit: prod.exhibit });
    });
  }

  function alloc(w: number, h: number) {
    W = w; H = h;
    rt?.dispose();
    rt = new WebGLRenderTarget(W, H, { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: true });
    post.resize(W, H);
    cam.aspect = W / H; cam.zoom = Math.min(1, cam.aspect * 1.25); cam.updateProjectionMatrix();
    anchorCam.copy(cam);
  }

  const api: UniverseScene = {
    get started() { return started; }, get ready() { return ready; }, get failed() { return failed; },
    get out() { return post.out; },
    async load() {
      if (started) return; started = true;
      try {
        const [root, tex, a, wallet, lenskin, airpods] = await Promise.all([
          loadModel(roomUrl, 'room'), loadLightmap(lightAvifUrl, lightWebpUrl, o.avif, 'room'),
          loadSupplierAsset(CASE as unknown as ModelEntry), loadProduct('wallet'), loadProduct('lenskin'), loadProduct('airpods'),
        ]);
        model = root; lightmap = tex; asset = a; U.tLight.value = tex;
        root.traverse((obj) => { const m = obj as Mesh; if (!m.isMesh) return; m.material = m.name === 'ceiling' ? lampMat : roomMat; m.frustumCulled = false; });
        scene.add(root);
        // the products' light: three's RoomEnvironment through a PMREM, once; its materials compile off the main thread first
        // (with a target bound, so the variant is the one the generator draws), and the generator runs in a later frame
        const env = new RoomEnvironment(), envCam = new PerspectiveCamera(90, 1, 0.1, 100);
        warming = true; alloc(8, 8);
        renderer.setRenderTarget(rt); const envCompile = renderer.compileAsync(env, envCam); renderer.setRenderTarget(null);
        await envCompile; await new Promise((r) => requestAnimationFrame(r));
        const pm = new PMREMGenerator(renderer);
        envTarget = pm.fromScene(env, 0.04); env.dispose(); pm.dispose();
        scene.environment = envTarget.texture; scene.environmentIntensity = D.productLight;
        buildProducts(a.lods[1], { wallet, lenskin, airpods });
        renderer.initTexture(tex);
        // the scene's programs compile with the 8 px target bound (three keys each program on the target), and a resize
        // that lands meanwhile is kept for the end
        api.update(-UNIVERSE.arcSpan, { yaw: 0, pitch: 0 }, -1, 0, 0, roomParams());
        renderer.setRenderTarget(rt); const compiling = renderer.compileAsync(scene, cam); renderer.setRenderTarget(null);
        await compiling;
        ready = true; api.render();
        warming = false; alloc(wantW, wantH);
      } catch (e) {
        failed = true;
        console.warn('section 4: the universe did not load; the stills stand in', e);
      }
    },
    resize(w, h) { wantW = Math.max(1, w); wantH = Math.max(1, h); if (!warming) alloc(wantW, wantH); },
    update(yaw, look, hover, dolly, dt, params) {
      curYaw = yaw; curHover = hover;
      if (cam.fov !== params.fov) { cam.fov = params.fov; cam.updateProjectionMatrix(); }
      const tilt = (params.roomPitch * Math.PI) / 180;
      const y = ((yaw + look.yaw) * Math.PI) / 180, p = (look.pitch * Math.PI) / 180 + tilt;
      cam.position.set(UNIVERSE.doorX - dolly, UNIVERSE.eye, 0);
      // facing +x; a negative yaw turns toward -z, the visitor's left
      _v.set(Math.cos(y) * Math.cos(p), Math.sin(p), Math.sin(y) * Math.cos(p)).add(cam.position);
      cam.lookAt(_v);
      const y0 = (yaw * Math.PI) / 180;
      anchorCam.copy(cam); anchorCam.lookAt(_v.set(Math.cos(y0) * Math.cos(tilt), Math.sin(tilt), Math.sin(y0) * Math.cos(tilt)).add(cam.position)); anchorCam.updateMatrixWorld();
      U.uExposure.value = params.roomExposure; U.uWalls.value = params.wallsColour;
      scene.environmentIntensity = params.productLight;
      const k = o.reduced ? 1 : 1 - Math.exp(-dt / 0.06);   // the 2 cm lift over about 200 ms
      products.forEach((pr, i) => {
        const sc = params.productScale * pr.exhibit;
        if (pr.body.scale.x !== sc) pr.body.scale.setScalar(sc);
        const want = i === hover && !o.reduced ? UNIVERSE.hoverLift : 0;
        pr.lift += (want - pr.lift) * k;
        pr.group.position.y = pedestalAt(i).height + pr.lift;
      });
    },
    render() {
      if (!rt || !ready && !started) return;
      const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(), tm = renderer.toneMapping;
      renderer.toneMapping = NoToneMapping;
      renderer.setRenderTarget(rt); renderer.setClearColor(CLEAR, 1); renderer.clear(); renderer.render(scene, cam);
      const P = (window.__skreedTune?.room?.params) ?? D;
      post.run(rt.texture, { boost: P.roomVignette, corners: P.roomCorners, bleach: P.roomBleach, split: P.split * 0.5, noise: o.reduced ? 0 : P.noise, encode: true, bloom: o.touch ? 0 : P.bloom }, 0);
      renderer.setRenderTarget(null); renderer.setClearColor(pc, pa); renderer.toneMapping = tm;
    },
    anchors() {
      const w = renderer.domElement.clientWidth || innerWidth, h = renderer.domElement.clientHeight || innerHeight;
      return products.map((pr, i) => {
        if (!pr.group.visible) return null;
        const ped = pedestalAt(i);
        _v.set(ped.x, ped.height + pr.lift + pr.top * pr.body.scale.x + UNIVERSE.labelAbove, ped.z).project(anchorCam);
        if (_v.z > 1 || _v.z < -1 || Math.abs(_v.x) > 1.2) return null;
        return { x: (_v.x * 0.5 + 0.5) * w, y: (-_v.y * 0.5 + 0.5) * h };
      });
    },
    pick(x, y) {
      const w = renderer.domElement.clientWidth || innerWidth, h = renderer.domElement.clientHeight || innerHeight;
      const px = (v: Vector3) => ({ x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, ok: v.z <= 1 && v.z >= -1 });
      let best = -1, bestD = Infinity;
      products.forEach((pr, i) => {
        const ped = pedestalAt(i);
        const base = px(_v.set(ped.x, 0, ped.z).project(cam)), top = px(_v.set(ped.x, ped.height + pr.lift + pr.top * pr.body.scale.x, ped.z).project(cam));
        if (!base.ok || !top.ok) return;
        // the column's half width across the view: the pedestal or the product, whichever is wider, along the group's own +x
        const ry = pr.group.rotation.y, wide = Math.max(UNIVERSE.pedestalRadius, pr.halfW * pr.body.scale.x) * 1.1;
        const side = px(_v.set(ped.x + Math.cos(ry) * wide, ped.height, ped.z - Math.sin(ry) * wide).project(cam));
        const half = Math.max(22, Math.abs(side.x - base.x)), y0 = Math.min(top.y, base.y) - 22, y1 = Math.max(top.y, base.y);
        const cx = (base.x + top.x) / 2;
        if (x < cx - half || x > cx + half || y < y0 || y > y1) return;
        const d = Math.abs(x - cx);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    },
    shown(i) { return !!products[i] && products[i].top > 0; },
    hooks() { return { started, ready, failed, yaw: +curYaw.toFixed(2), hover: curHover, products: products.length, size: [W, H] }; },
    dispose() {
      rt?.dispose(); rt = null; post.dispose(); envTarget?.dispose(); envTarget = null;
      roomMat.dispose(); lampMat.dispose(); lightmap?.dispose();
      for (const pr of products) { for (const m of pr.mats) m.dispose(); scene.remove(pr.group); }
      products.length = 0;
      for (const x of owned) x.dispose();
      model?.traverse((obj) => { const m = obj as Mesh; if (m.isMesh) m.geometry.dispose(); });
      if (model) scene.remove(model);
      asset?.dispose(); asset = null; model = null; ready = false;
    },
  };
  return api;
}
