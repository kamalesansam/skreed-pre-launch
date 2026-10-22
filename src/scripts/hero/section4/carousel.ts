// Section 4 part three's carousel (docs/specs/section-4-flux.md 1, 4 "Motion plan", 5 "The island modules", 6, 9 X-1 to
// X-4, X-9, X-14; the rig's numbers are docs/specs/evidence/section-4-flux-reference.md 2 to 4 and 7 to 9): the five
// scenes on a ring of radius 7 round a fixed camera at (0, 0.2, minus 1) looking at (0, 0, minus 7), each a 1 x 1 plane
// billboarded to the camera and cover-fitted every frame from the current field of view and its own distance, drawing
// its loop's frames (video.ts) or its poster still as the bytes they are, scaled per pixel by the scene's light-up value
// and its luminance (carousel-math.ts lightUp and lightGain, the reference's intro-less path, X-4), with the reference's
// bottom shade in the frame (24 vh, clear to 85 percent black, so the lines over it are never boxed, AC10 and AC12). A
// step is one tween on power2.out over stepMs: the outgoing plane swings out on the arc of the stage's shape (80
// degrees wide, 22 portrait, X-1), the incoming swings in from the other side, the field of view pinches from 45 to
// fovStep and back by fovReturnAt, the front index switches at eased 0.75, the lights follow proximity, the loops play
// and reset by it (at most two at once), and the product in front (z minus 4.4, life size times its exhibit factor
// times the class scale) turns half a turn and is swapped edge-on at the half with its scale easing over 0.35 to 0.65.
// The product is a MeshStandardMaterial (MeshPhysicalMaterial for gloss, its clearcoat) in the scene's catalog shade
// under a PMREM of three's RoomEnvironment at 0.5, one DirectionalLight (the key, from above and in front, tinted per
// scene and cross-faded over keyLightMs from the front switch) and a cool fill at 0.2 of it; its colour-space chunk is
// replaced by an sRGB encode so it writes display values into the same 8-bit target the planes do (X-9), cleared to
// black under NoToneMapping set and restored around the draw, no tone curve (hero-architecture.md "Render targets and
// colour spaces"). The seams' cloud (X-3) is the reference's fbm drawn into its own target at min(DPR, 1.5),
// premultiplied, only while a seam runs. The reduced path: stills on every plane, a step is a cut with a 300 ms
// cross-fade, the fov and the lights untouched, the product swapped and the key light set at once, no look, the cloud's
// time held at 0. Nothing here captures a gesture, reads the scroll or touches the DOM: the director and scroll.ts
// call requestStep, setScene, seam and look, and read out, cloud, scene, step and busy.
import { BufferGeometry, Camera, Color, DirectionalLight, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, NoToneMapping, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, ShaderMaterial, Vector2, WebGLRenderTarget, type Object3D, type Texture, type WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Product } from './products-bin.ts';
import type { VideoPool } from './video.ts';
import { LIGHT, LOOP_ASPECT, STEP, anglesAt, cloudCover, coverFit, easeStep, fovAt, keyLight, lightUp, loopShouldPlay, loopShouldReset, productScale, productYaw, proximity, ringPlace, type LightConfig, type LoopClass } from './carousel-math.ts';

export type Finish = 'matte' | 'gloss' | 'metallic';

/** one scene (ROOM_SCENES in the wiring's config): its product, shade and finish, its key light, its still and its loop element */
export interface SceneDef {
  readonly id: string;
  /** the key light's tint over this scene, a hex string (the reference's per-scene tints) */
  readonly keyLight: string;
  /** the product's authored presentation yaw at rest, radians (face out) */
  readonly baseYaw: number;
  /** the product's name in products.bin: case, wallet, airpods or lenskin */
  readonly product: string;
  /** the product's catalog shade, a hex string */
  readonly shade: string;
  readonly finish: Finish;
  /**
   * The scene's poster still as a texture in display values (NoColorSpace, no decode on sampling), sampling as a
   * picture does (flipY true on a Texture from an image, false on a bitmap decoded upside down), a new texture on each
   * call: the carousel disposes the ones it drops. null where there is none (the plane is black then).
   */
  still: () => Promise<Texture | null>;
  /** the element in video.ts that carries this scene's loop, or null (the still alone) */
  readonly loop: number | null;
}

/** the live Tune values (X-13), read every frame */
export interface CarouselTune { stepMs: number; sweepDeg: number; sweepDegPortrait: number; fovStep: number; fovReturnAt: number; lightStart: number; lightSoft: number; lightBoost: number; keyLightMs: number }

export interface CarouselOptions {
  readonly renderer: WebGLRenderer;
  readonly scenes: readonly SceneDef[];
  /** products.bin parsed (products-bin.ts parseProductsBin); the geometries stay the caller's */
  readonly products: readonly Product[];
  /** the loop elements, or null where loops never play (video.ts allowed() false, or the reduced path) */
  readonly video: VideoPool | null;
  /** the loop class in use, fixed for the visit (X-10): the product's class scale follows it */
  readonly cls: LoopClass;
  /** the still3d tier */
  readonly reduced: boolean;
  tune(): CarouselTune;
  /** the device pixel ratio the stage renders at (the cloud's target is capped at 1.5); window.devicePixelRatio when unset */
  readonly dpr?: number;
}

export type SeamPhase = 'in' | 'out' | null;

export interface Carousel {
  /** the carousel's frame: its 8-bit target, display values, cleared to black */
  readonly out: Texture;
  /** the cloud, premultiplied rgb and alpha at min(DPR, 1.5), only while a seam runs; null otherwise */
  readonly cloud: Texture | null;
  /** the scene at rest (the one a step has settled on; during a step still the one it left) */
  scene(): number;
  /** the front scene: the one the key light follows, switching at eased 0.75 of a step */
  front(): number;
  /** the fractional step, from plus dir times the eased t */
  step(): number;
  /** a tween runs or the 150 ms cooldown has not passed */
  busy(): boolean;
  /** one whole step: false while a tween runs, within the cooldown, past an edge, or while the next scene's still is still loading (spec 5, "Loading", phase 4) */
  requestStep(dir: 1 | -1): boolean;
  /** scene i at rest: the planes re-parked, fov 45, the lights and loops by proximity; instant snaps the lights and the key light too (the wrap, the first scene) */
  setScene(i: number, instant?: boolean): void;
  /** the seam's cloud: the phase and its 0 to 1; null ends it */
  seam(phase: SeamPhase, e: number): void;
  /** the product's look from a pressed pointer or a finger, x and y in minus 1 to 1; released, it returns to rest (never on hover, X-14) */
  look(x: number, y: number, pressed: boolean): void;
  /** one frame: t and dt in seconds, w and h the stage in device pixels; one draw into out (and the cloud's while a seam runs) */
  update(t: number, dt: number, w: number, h: number): void;
  resize(w: number, h: number): void;
  /** the director's scissor while the bubble is small (the bubble's bounding box in device pixels), or null */
  scissor(r: { x: number; y: number; w: number; h: number } | null): void;
  /** the bottom shade, for AC12's tuning: how dark at the bottom edge (0 to 1) and its height as a share of the frame */
  shade(dark: number, height?: number): void;
  /** the programs and the environment, one compile a frame with the target bound (spec 5, "Loading", phase 2); update() starts it when it has not run */
  warm(): Promise<void>;
  /** the stills of scene i and its neighbours fetched (phase 4; a step waits on the next scene's) */
  prepare(i: number): void;
  /** GPU bytes resident: the targets, the products' geometry, the stills and the playing loops' frames */
  memory(): number;
  dispose(): void;
}

/** each product's exhibit factor over life size (section-4.md's, spec 3 "Size and pose") */
export const EXHIBIT: Readonly<Record<string, number>> = Object.freeze({ case: 1, wallet: 1.55, airpods: 1.75, lenskin: 2.2 });
/** the class scale: the life-size case's share of the view's height (wide) or width (portrait) at its distance, fov 45 */
export const CLASS_FILL = Object.freeze({ wide: 0.55, portrait: 0.62 });
/** the finishes (render-products.py's calibration; spec 5) */
export const FINISH = Object.freeze({ matte: { roughness: 0.62, metalness: 0 }, gloss: { roughness: 0.62, metalness: 0, clearcoat: 0.03 }, metallic: { roughness: 0.38, metalness: 1 } });
/** the lights: the key's intensity, the fill's share of it and its cool tint, the environment's intensity and blur */
export const LIGHTS = Object.freeze({ key: 3, fill: 0.2, fillTint: '#bcd0ff', env: 0.5, blur: 0.04 });
/** the bottom shade: 24 vh of the frame, clear to 85 percent black (the reference's caption gradient, spec 3 "Legibility") */
export const SHADE = Object.freeze({ dark: 0.85, height: 0.24 });
/** the cloud's target is capped at this DPR (reference 8.4); the cloud's two tones as display values: the reference's shadow and Pearl Whisper (E-S4-colour) */
export const CLOUD = Object.freeze({ dpr: 1.5, shadow: [0.80, 0.84, 0.93] as const, light: [0xf7 / 255, 0xf6 / 255, 0xf3 / 255] as const });
/** the case's width and height in metres where products.bin lacks it (src/data/room-products-bin.json) */
const CASE_M = [0.1047, 0.19674] as const;
/** a proximity change under this is neither rising nor falling (the reference's) */
const PROX_EPS = 5e-4;

const PLANE_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// the loop's bytes (or the still's), mixed to a second map while a still hands over to its loop or a reduced step
// cross-fades; the light-up value v shifted per pixel by boost x (v + luminance - 1), so the brightest areas come up
// first (carousel-math.ts lightGain); the bottom shade by the fragment's own place in the frame
const PLANE_FRAG = /* glsl */`
  uniform sampler2D tMap, tTo; uniform float uMix, uLight, uBoost, uFloor, uShade, uShadeH; uniform vec2 uRes;
  varying vec2 vUv;
  void main() {
    vec3 c = mix(texture2D(tMap, vUv).rgb, texture2D(tTo, vUv).rgb, uMix);
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float v = (uLight - uFloor) / (1.0 - uFloor);
    float g = mix(uFloor, 1.0, clamp(v + uBoost * (v + lum - 1.0), 0.0, 1.0));
    float sh = 1.0 - uShade * (1.0 - clamp(gl_FragCoord.y / (uRes.y * uShadeH), 0.0, 1.0));
    gl_FragColor = vec4(c * g * sh, 1.0);
  }`;
const CLOUD_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
// the reference's cloud (evidence 8.5): value noise on the lattice with the quintic fade, two 6-octave fbms rotated by
// mat2(1.6, 1.2, -1.2, 1.6), the domain zoomed out as the cover rises, the density from the noise and the cover with an
// opaque core near full cover, premultiplied out
const CLOUD_FRAG = /* glsl */`
  uniform float uTime, uProgress; uniform vec2 uRes; uniform vec3 uShadow, uLight;
  varying vec2 vUv;
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 6; k++) { v += a * noise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= 0.5; } return v; }
  void main() {
    vec2 p = vec2((vUv.x - 0.5) * (uRes.x / max(uRes.y, 1.0)), vUv.y - 0.5) * mix(1.35, 0.92, uProgress);
    float t = uTime * 0.03;
    float clouds = (fbm(p * 2.6 + vec2(t, 0.4 * t)) + 0.35 * fbm(p * 5.5 - vec2(1.3 * t, 0.7 * t))) / 1.35;
    float d = max(smoothstep(0.0, 0.55, clouds + 1.9 * uProgress - 1.0), smoothstep(0.72, 1.0, uProgress));
    gl_FragColor = vec4(mix(uShadow, uLight, d) * d, d);
  }`;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
type Rgb = [number, number, number];
const tint = (hex: string): Rgb => { const c = new Color(hex); return [c.r, c.g, c.b]; };
const texBytes = (t: Texture | null): number => { const i = t?.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number } | undefined; const w = i?.videoWidth ?? i?.width ?? 0, h = i?.videoHeight ?? i?.height ?? 0; return w * h * 4; };

/** the product's material in its shade and finish, writing display values: the output colour-space chunk replaced by an sRGB encode, no tone curve (X-9) */
function productMaterial(shade: string, finish: Finish): MeshStandardMaterial {
  const base = { color: new Color(shade), envMapIntensity: LIGHTS.env, toneMapped: false };
  const m = finish === 'gloss' ? new MeshPhysicalMaterial({ ...base, ...FINISH.gloss }) : new MeshStandardMaterial({ ...base, ...(finish === 'metallic' ? FINISH.metallic : FINISH.matte) });
  m.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace('#include <colorspace_fragment>', 'gl_FragColor = sRGBTransferOETF( gl_FragColor );'); };
  m.customProgramCacheKey = () => 'display';
  return m;
}

interface PlaneUniforms { tMap: { value: Texture | null }; tTo: { value: Texture | null }; uMix: { value: number }; uLight: { value: number } }
interface Plane {
  group: Group; mesh: Mesh<PlaneGeometry, ShaderMaterial>; U: PlaneUniforms;
  light: number; prox: number; falling: boolean;
  still: Texture | null; stillJob: Promise<void> | null; settled: boolean;
  showing: 'none' | 'still' | 'loop'; mixT0: number;
}
interface Slot { group: Group; mat: MeshStandardMaterial; exhibit: number }
interface Tween { from: number; to: number; dir: 1 | -1; t0: number; ms: number }

export function createCarousel(o: CarouselOptions): Carousel {
  const { renderer, scenes, reduced } = o;
  const N = scenes.length;
  const video = reduced ? null : o.video;
  const dpr = o.dpr ?? (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
  const _cc = new Color();

  // the stage and its fixed camera
  const stage = new Scene();
  const cam = new PerspectiveCamera(STEP.fovBase, 1, 0.1, 1000);
  cam.position.set(STEP.cam.x, STEP.cam.y, STEP.cam.z); cam.lookAt(STEP.target.x, STEP.target.y, STEP.target.z); cam.updateMatrixWorld();
  let rt = new WebGLRenderTarget(8, 8, { depthBuffer: true }), W = 8, H = 8;
  let scissorRect: { x: number; y: number; w: number; h: number } | null = null;

  // the planes, one a scene, sharing the light-up and shade uniforms
  const shared: Record<'uBoost' | 'uFloor' | 'uShade' | 'uShadeH', { value: number }> & { uRes: { value: Vector2 } } = { uBoost: { value: LIGHT.boost }, uFloor: { value: LIGHT.floor }, uShade: { value: SHADE.dark }, uShadeH: { value: SHADE.height }, uRes: { value: new Vector2(8, 8) } };
  const planeGeo = new PlaneGeometry(1, 1);
  const planes: Plane[] = scenes.map(() => {
    const U: PlaneUniforms = { tMap: { value: null }, tTo: { value: null }, uMix: { value: 0 }, uLight: { value: LIGHT.floor } };
    const mesh = new Mesh(planeGeo, new ShaderMaterial({ uniforms: { ...U, ...shared }, vertexShader: PLANE_VERT, fragmentShader: PLANE_FRAG, side: DoubleSide }));
    mesh.visible = false;
    const group = new Group(); group.add(mesh); group.visible = false; stage.add(group);
    return { group, mesh, U, light: LIGHT.floor, prox: 0, falling: false, still: null, stillJob: null, settled: false, showing: 'none', mixT0: -1 };
  });

  // the products: one group a scene in the scene's shade, the parts sharing its material; the case sets the class scale
  const byName = new Map(o.products.map((p) => [p.name, p]));
  const caseP = byName.get('case'), caseW = caseP?.size[0] ?? CASE_M[0], caseH = caseP?.size[1] ?? CASE_M[1];
  const holder = new Group(); holder.position.set(0, 0, STEP.productZ); stage.add(holder);
  const slots: (Slot | null)[] = scenes.map((s) => {
    const p = byName.get(s.product);
    if (!p) return null;
    const mat = productMaterial(s.shade, s.finish), group = new Group();
    for (const part of p.parts) group.add(new Mesh(part.geometry, mat));
    group.visible = false; holder.add(group);
    return { group, mat, exhibit: EXHIBIT[s.product] ?? 1 };
  });
  let classScale = 1;

  // the lights: the key from above and in front, tinted per scene; the cool fill from the other side
  const key = new DirectionalLight(0xffffff, LIGHTS.key); key.position.set(1.2, 3.2, STEP.productZ + 2.2); key.target.position.set(0, 0, STEP.productZ);
  const fill = new DirectionalLight(LIGHTS.fillTint, LIGHTS.key * LIGHTS.fill); fill.position.set(-2.6, 0.9, STEP.productZ + 2.6); fill.target.position.set(0, 0, STEP.productZ);
  stage.add(key, key.target, fill, fill.target);
  let envTarget: WebGLRenderTarget | null = null;

  // the cloud: a clip-space triangle into its own target
  const cloudU = { uTime: { value: 0 }, uProgress: { value: 0 }, uRes: { value: new Vector2(1, 1) }, uShadow: { value: new Color().setRGB(...CLOUD.shadow) }, uLight: { value: new Color().setRGB(...CLOUD.light) } };
  const cloudGeo = new BufferGeometry(); cloudGeo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const cloudMesh = new Mesh(cloudGeo, new ShaderMaterial({ uniforms: cloudU, vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG, depthTest: false, depthWrite: false }));
  cloudMesh.frustumCulled = false;
  const cloudScene = new Scene(); cloudScene.add(cloudMesh); const cloudCam = new Camera();
  let cloudRt: WebGLRenderTarget | null = null, CW = 0, CH = 0;
  let seamPhase: SeamPhase = null, cover = 0;

  // the state
  let index = 0, frontIdx = 0, shownIdx = 0, curStep = 0, lastT = 0, cooldownUntil = -1;
  let tw: Tween | null = null;
  let keyFrom: Rgb = tint(scenes[0]?.keyLight ?? '#ffffff'), keyTo: Rgb = keyFrom, keyT0 = -1e9;
  let lookX = 0, lookY = 0, lookTX = 0, lookTY = 0;
  let warmed: Promise<void> | null = null, disposed = false;

  const place = (p: Plane, angle: number) => { const r = ringPlace(angle, STEP.radius, STEP.cam); p.group.position.set(r.x, r.y, r.z); p.group.rotation.y = r.yaw; };
  const sweepRad = () => ((H > W ? o.tune().sweepDegPortrait : o.tune().sweepDeg) * Math.PI) / 180;

  /** every plane parked: the front one at angle 0, visible; the rest at the arc's end, hidden; the fov at rest */
  function park(i: number) {
    planes.forEach((p, j) => { place(p, j === i ? 0 : sweepRad()); p.group.visible = j === i; if (j !== i) { p.U.uMix.value = 0; p.U.tTo.value = null; } });
    if (cam.fov !== STEP.fovBase) { cam.fov = STEP.fovBase; cam.updateProjectionMatrix(); }
    curStep = i; shownIdx = i;
  }

  /** the front scene: its key light tint cross-fades from the current colour over keyLightMs, or is set at once */
  function setFront(i: number, t: number, instant: boolean) {
    if (i === frontIdx && !instant) return;
    const to = tint(scenes[i].keyLight);
    if (instant || reduced) { keyFrom = to; keyTo = to; keyT0 = -1e9; }
    else { keyFrom = [key.color.r, key.color.g, key.color.b]; keyTo = to; keyT0 = t; }
    frontIdx = i;
  }

  function ensureStill(i: number) {
    const p = planes[i];
    if (!p || p.still || p.stillJob) return;
    p.stillJob = scenes[i].still().then((t) => { if (disposed) { t?.dispose(); return; } p.still = t; p.settled = true; }, () => { p.settled = true; });
  }
  /** the current and its two neighbours' stills stay; the others go (spec 5, "Loading": resident at any moment) */
  function keepAround(i: number) {
    planes.forEach((p, j) => {
      if (Math.abs(j - i) <= 1 || (tw && (j === tw.from || j === tw.to)) || !p.settled) return;
      p.still?.dispose(); p.still = null; p.stillJob = null; p.settled = false;
      if (p.showing === 'still') { p.showing = 'none'; p.U.tMap.value = null; }
    });
  }
  const resident = (i: number): boolean => { const p = planes[i], L = scenes[i]?.loop; return !!p && (p.settled || (!!video && L !== null && video.in(L))); };

  /** the plane's map this frame: its loop while in (a 300 ms hand-over from the still when it arrives), else its still; its frame aspect for the fit */
  function chooseMap(p: Plane, j: number, t: number, mixing: boolean): number {
    const L = scenes[j].loop;
    if (video && L !== null && video.in(L)) {
      const tex = video.texture(L);   // the frame's upload and the refusal clock
      if (video.in(L)) {
        if (p.showing === 'still' && p.still && !mixing) {
          if (p.mixT0 < 0) p.mixT0 = t;
          const m = clamp01((t - p.mixT0) / (STEP.fadeMs / 1000));
          p.U.tMap.value = p.still; p.U.tTo.value = tex; p.U.uMix.value = m;
          if (m >= 1) { p.showing = 'loop'; p.mixT0 = -1; p.U.tMap.value = tex; p.U.tTo.value = null; p.U.uMix.value = 0; }
        } else if (!mixing) { p.showing = 'loop'; p.mixT0 = -1; p.U.tMap.value = tex; p.U.tTo.value = null; p.U.uMix.value = 0; }
        p.mesh.visible = true;
        return video.aspect(L) || LOOP_ASPECT[o.cls];
      }
    }
    p.mixT0 = -1;
    if (p.still) {
      if (!mixing) { p.showing = 'still'; p.U.tMap.value = p.still; p.U.tTo.value = null; p.U.uMix.value = 0; }
      p.mesh.visible = true;
      const i = p.still.image as { width?: number; height?: number } | undefined;
      return i?.width && i.height ? i.width / i.height : LOOP_ASPECT[o.cls];
    }
    p.showing = 'none'; p.mesh.visible = false; ensureStill(j);
    return LOOP_ASPECT[o.cls];
  }
  const fit = (p: Plane, aspect: number) => { const f = coverFit(cam.fov, cam.position.distanceTo(p.group.position), W / H, aspect); p.mesh.scale.set(f.width, f.height, 1); };

  function allocCloud() {
    const s = Math.min(dpr, CLOUD.dpr) / dpr;
    const w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s));
    if (cloudRt && CW === w && CH === h) return;
    cloudRt?.dispose(); cloudRt = new WebGLRenderTarget(w, h, { depthBuffer: false }); CW = w; CH = h; cloudU.uRes.value.set(w, h);
  }

  function draw() {
    const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(), tm = renderer.toneMapping, ac = renderer.autoClear;
    renderer.toneMapping = NoToneMapping; renderer.autoClear = false;
    if (scissorRect) { rt.scissor.set(scissorRect.x, scissorRect.y, scissorRect.w, scissorRect.h); rt.scissorTest = true; } else rt.scissorTest = false;
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(true, true, false);
    renderer.render(stage, cam);
    if (seamPhase && cloudRt) {
      renderer.setRenderTarget(cloudRt); renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false);
      renderer.render(cloudScene, cloudCam);
    }
    renderer.setRenderTarget(null); renderer.setClearColor(pc, pa); renderer.toneMapping = tm; renderer.autoClear = ac;
  }

  const api: Carousel = {
    get out() { return rt.texture; },
    get cloud() { return seamPhase && cloudRt ? cloudRt.texture : null; },
    scene: () => index,
    front: () => frontIdx,
    step: () => curStep,
    busy: () => !!tw || lastT < cooldownUntil,
    requestStep(dir) {
      const d: 1 | -1 = dir < 0 ? -1 : 1, to = index + d;
      if (tw || lastT < cooldownUntil || to < 0 || to >= N) return false;
      if (!resident(to)) { ensureStill(to); return false; }
      tw = { from: index, to, dir: d, t0: lastT, ms: reduced ? STEP.fadeMs : o.tune().stepMs };
      planes[index].group.visible = true;
      if (reduced) { shownIdx = to; setFront(to, lastT, true); }
      else planes[to].group.visible = true;
      return true;
    },
    setScene(i, instant = false) {
      const k = Math.max(0, Math.min(N - 1, Math.round(i)));
      tw = null; index = k; park(k); keepAround(k); api.prepare(k);
      setFront(k, lastT, instant);
      if (instant) planes.forEach((p, j) => { p.prox = proximity(k, j); p.falling = false; p.light = j === k ? 1 : LIGHT.floor; p.U.uLight.value = p.light; });
      if (video) scenes.forEach((s, j) => { if (s.loop !== null && j !== k) video.reset(s.loop); });
    },
    seam(phase, e) { seamPhase = phase; cover = cloudCover(phase, e); if (phase) allocCloud(); },
    look(x, y, pressed) { if (reduced) return; lookTX = pressed ? x : 0; lookTY = pressed ? y : 0; },
    update(t, dt, w, h) {
      if (disposed) return;
      lastT = t;
      if (w !== W || h !== H) api.resize(w, h);
      if (!warmed) void api.warm();
      const T = o.tune(), cfg: LightConfig = { start: T.lightStart, soft: T.lightSoft, boost: T.lightBoost, floor: LIGHT.floor };
      shared.uBoost.value = cfg.boost;
      // the step
      let e = 0;
      if (tw) {
        const p = clamp01((t - tw.t0) / (tw.ms / 1000));
        e = reduced ? p : easeStep(p);
        if (reduced) {
          const a = planes[tw.from], b = planes[tw.to];
          a.U.tMap.value = a.still; a.U.tTo.value = b.still; a.U.uMix.value = e; a.mesh.visible = !!(a.still || b.still);
        } else {
          const a = anglesAt(e, tw.dir, sweepRad());
          place(planes[tw.from], a.out); place(planes[tw.to], a.in);
          const fov = fovAt(e, STEP.fovBase, T.fovStep, T.fovReturnAt);
          if (Math.abs(fov - cam.fov) >= 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
          curStep = tw.from + tw.dir * e;
          setFront(e >= STEP.frontAt ? tw.to : tw.from, t, false);
          shownIdx = e >= STEP.swapAt ? tw.to : tw.from;
        }
        if (p >= 1) { const { to } = tw; tw = null; index = to; cooldownUntil = t + STEP.cooldownMs / 1000; park(to); keepAround(to); api.prepare(to); }
      }
      // the lights and the loops by proximity
      planes.forEach((p, j) => {
        const prox = proximity(curStep, j);
        p.falling = prox < p.prox - PROX_EPS ? true : prox > p.prox + PROX_EPS ? false : p.falling;
        p.prox = prox;
        p.light = reduced ? (p.group.visible ? 1 : LIGHT.floor) : lightUp(p.light, prox, dt, cfg);
        p.U.uLight.value = p.light;
        const L = scenes[j].loop;
        if (video && L !== null) {
          if (loopShouldReset(prox)) video.reset(L);
          else if (loopShouldPlay(prox, p.falling) && video.in(L) && !video.playing(L)) video.play(L);
        }
      });
      // the visible planes' maps and fits
      planes.forEach((p, j) => { if (p.group.visible) fit(p, chooseMap(p, j, t, !!(reduced && tw && j === tw.from))); });
      // the product in front: the shown scene's, scaled across the step, turned with the step and the look
      const sh = slots[shownIdx];
      for (const s of slots) if (s) s.group.visible = s === sh;
      if (sh) {
        let scale = classScale * sh.exhibit;
        if (tw && !reduced) scale = productScale(e, classScale * (slots[tw.from]?.exhibit ?? sh.exhibit), classScale * (slots[tw.to]?.exhibit ?? sh.exhibit));
        sh.group.scale.setScalar(scale);
        const k = 1 - Math.pow(0.9, 60 * dt);
        lookX += (lookTX - lookX) * k; lookY += (lookTY - lookY) * k;
        sh.group.rotation.set(lookY * STEP.lookRad, productYaw(curStep, shownIdx, scenes[shownIdx].baseYaw) + lookX * STEP.lookRad, 0);
      }
      // the key light
      const c = keyLight(t - keyT0, keyFrom, keyTo, T.keyLightMs); key.color.setRGB(c[0], c[1], c[2]);
      // the cloud
      if (seamPhase) { cloudU.uTime.value = reduced ? 0 : t; cloudU.uProgress.value = cover; }
      draw();
    },
    resize(w, h) {
      W = Math.max(1, Math.round(w)); H = Math.max(1, Math.round(h));
      rt.dispose(); rt = new WebGLRenderTarget(W, H, { depthBuffer: true });
      cam.aspect = W / H; cam.updateProjectionMatrix(); shared.uRes.value.set(W, H);
      if (cloudRt) allocCloud();
      const d = Math.hypot(STEP.cam.x, STEP.cam.y, STEP.cam.z - STEP.productZ), viewH = 2 * Math.tan((STEP.fovBase * Math.PI) / 360) * d;
      classScale = o.cls === 'portrait' ? (CLASS_FILL.portrait * viewH * (W / H)) / caseW : (CLASS_FILL.wide * viewH) / caseH;
    },
    scissor(r) { scissorRect = r; },
    shade(dark, height = SHADE.height) { shared.uShade.value = clamp01(dark); shared.uShadeH.value = Math.max(1e-3, height); },
    warm() {
      return (warmed ??= (async () => {
        const frame = () => new Promise<void>((r) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => r()) : setTimeout(r, 16)));
        // one program with the target bound under NoToneMapping (three keys each program on both); hidden objects are made visible for it
        const compile = async (obj: Object3D, c: Camera, sc: Scene) => {
          const was = obj.visible, tm = renderer.toneMapping;
          obj.visible = true; renderer.toneMapping = NoToneMapping; renderer.setRenderTarget(rt);
          const done = renderer.compileAsync(obj, c, sc);
          renderer.setRenderTarget(null); renderer.toneMapping = tm; obj.visible = was;
          await done;
        };
        try {
          // the environment first: the products' programs key on it
          const env = new RoomEnvironment(), envCam = new PerspectiveCamera(90, 1, 0.1, 100);
          await renderer.compileAsync(env, envCam); await frame();
          if (disposed) { env.dispose(); return; }
          const pm = new PMREMGenerator(renderer);
          envTarget = pm.fromScene(env, LIGHTS.blur); env.dispose(); pm.dispose();
          stage.environment = envTarget.texture;
          await frame();
          const steps: Object3D[] = [];
          if (planes[0]) steps.push(planes[0].mesh);
          const seen = new Set<string>();
          for (const s of slots) if (s && !seen.has(s.mat.type)) { seen.add(s.mat.type); steps.push(s.group); }
          for (const obj of steps) { if (disposed) return; await compile(obj, cam, stage); await frame(); }
          if (!disposed) { await compile(cloudMesh, cloudCam, cloudScene); await frame(); }
        } catch (e) { if (!disposed) console.warn('section 4: the carousel did not warm up; its programs compile on first use', e); }
      })());
    },
    prepare(i) { for (const j of [i, i + 1, i - 1]) if (j >= 0 && j < N) ensureStill(j); },
    memory() {
      let b = W * H * 8 + (cloudRt ? CW * CH * 4 : 0) + (envTarget ? envTarget.width * envTarget.height * 8 : 0);
      for (const p of o.products) for (const part of p.parts) b += part.geometry.attributes.position.count * 24 + (part.geometry.index?.count ?? 0) * 2;
      for (const p of planes) b += texBytes(p.still);
      if (video) for (const s of scenes) if (s.loop !== null && video.playing(s.loop)) { const [w, h] = video.size(s.loop); b += w * h * 4; }
      return b;
    },
    dispose() {
      disposed = true; tw = null; seamPhase = null;
      rt.dispose(); cloudRt?.dispose(); cloudRt = null; envTarget?.dispose(); envTarget = null; stage.environment = null;
      planeGeo.dispose(); cloudGeo.dispose(); cloudMesh.material.dispose();
      for (const p of planes) { p.mesh.material.dispose(); p.still?.dispose(); p.still = null; p.stillJob = null; }
      for (const s of slots) s?.mat.dispose();
      key.dispose(); fill.dispose();
    },
  };
  park(0);
  return api;
}
