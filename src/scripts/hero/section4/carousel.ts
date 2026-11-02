// Section 4 part three's carousel (docs/specs/section-4-flux.md 1, 3 "Size and pose" and "Materials and lights", 4
// "Motion plan", 5 "The island modules" and "Loading", 6, 9 X-1 to X-4, X-9, X-14; the rig's numbers are
// docs/specs/evidence/section-4-flux-reference.md 2 to 4 and 7 to 9, the light-up shader its 14): the five scenes on a
// ring of radius 7 round a fixed camera at (0, 0.2, minus 1) looking at (0, 0, minus 7), each a 1 x 1 plane
// billboarded to the camera and cover-fitted every frame from the current field of view and its own distance, drawing
// its loop's frames (video.ts) or its poster still: the bytes decoded to linear, scaled per pixel by the gain the
// scene's light-up value and the pixel's luminance give (carousel-math.ts lightTarget, lightUp and lightGain, the
// reference's intro-less path, X-4: the room leaving stays lit until the step's half, the room arriving comes up from
// its brightest areas), re-encoded, with the bottom shade in the frame (SHADE: 45 percent of black, solid to 0.45 of
// the height and clear by 0.72, set by the contrast check, not the reference's 24 vh at 85 percent, so the lines over
// it read 4.5:1 or better and are never boxed, AC10 and AC12). A step is one tween on power2.out over stepMs: the outgoing
// plane swings out on the arc of the stage's shape (80 degrees wide, 22 portrait, X-1), the incoming swings in from the
// other side, the field of view pinches from 45 to fovStep and back by fovReturnAt, the front index switches at eased
// 0.75, the lights follow proximity and its direction, the loops play and reset by it (at most two at once, their two
// textures resident), and the product in front (z minus 4.4, life size times its exhibit factor times the class scale,
// placed by carousel-math.ts productPlacement: on the wide class the case at most 0.55 of the view's height and 0.62
// of its width, the centre kept and the holder moved right only as far as the lines' column needs; on the portrait
// class at most 0.50 of the height, its centre raised to 0.60 of the view's height, so the four lines' block stays
// clear of it) turns half a turn and is swapped edge-on at the half with its scale easing over 0.35 to 0.65. The product is a MeshPhysicalMaterial per finish (render-products.py's
// numbers, the family page's calibration) in the scene's catalog shade, the trim dark and the logo a share of the
// shade as render-products.py roles them, under a PMREM of three's RoomEnvironment (each material's own envMap, at
// LIGHTS.env on the matte and gloss finishes and LIGHTS.metalEnv on the metallic), one DirectionalLight (the key, from
// above and in front at LIGHTS.key, white mixed 60 percent toward the scene's tint, cross-faded over keyLightMs from
// the front switch) and the cool fill at LIGHTS.fill, the three set by the product check (AC2); the output colour-space
// chunk is replaced by an sRGB encode so it writes
// display values into the same 8-bit target the planes do (X-9), cleared to black under NoToneMapping set and restored
// around the draw, no tone curve (hero-architecture.md "Render targets and colour spaces"). The seams' cloud (X-3) is
// the reference's fbm drawn into its own target at min(DPR, 1.5) (halved on degrade), premultiplied, only while a seam
// runs, and while its cover is whole the stage is not drawn (its target keeps the last frame; nothing under the cloud
// shows); its pass and target are readied at idle by warmCloud() before any seam (spec 5, "Loading", phase 0). The
// reduced path: stills on every plane, a step is a cut with a 300 ms cross-fade, the fov and the lights untouched, the
// product swapped and the key light set at once, no look, the cloud's time held at 0. Nothing here captures a gesture,
// reads the scroll or touches the DOM: the director and scroll.ts call requestStep, setScene, seam, look and motion,
// and read out, cloud, scene, step and busy.
import { BufferGeometry, Camera, Color, DirectionalLight, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshPhysicalMaterial, NoToneMapping, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget, type Object3D, type Texture, type WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Product } from './products-bin.ts';
import type { VideoPool } from './video.ts';
import { LIGHT, LOOP_ASPECT, PLACE, STEP, anglesAt, cloudCover, coverFit, easeStep, fovAt, keyLight, lightUp, loopShouldPlay, loopShouldReset, poseWeight, productPlacement, productScale, productScreenBox, productYaw, proximity, ringPlace, type Box, type LightConfig, type LoopClass, type Placement } from './carousel-math.ts';

export type Finish = 'matte' | 'gloss' | 'metallic';

/** one scene (ROOM_SCENES in the wiring's config): its product, shade and finish, its key light, its still and its loop element */
export interface SceneDef {
  readonly id: string;
  /** the key light's tint over this scene, a hex string (the reference's per-scene tints) */
  readonly keyLight: string;
  /** the product's authored presentation yaw at rest, radians (0 is face out) */
  readonly baseYaw: number;
  /** the product's authored presentation pitch at rest, radians (positive tips the top toward the camera; 0 where absent) */
  readonly basePitch?: number;
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
  /** products.bin parsed (products-bin.ts parseProductsBin), or none yet (setProducts later: a wrap-first visit, spec 5 "Loading" phase 5); the geometries stay the caller's */
  readonly products?: readonly Product[];
  /** the loop elements, or null where loops never play (video.ts allowed() false, or the reduced path) */
  readonly video: VideoPool | null;
  /** the loop class in use, fixed for the visit (X-10): the fit's fallback aspect before a frame's metadata */
  readonly cls: LoopClass;
  /** the still3d tier */
  readonly reduced: boolean;
  tune(): CarouselTune;
  /** the device pixel ratio the stage renders at (the cloud's target is capped at 1.5); window.devicePixelRatio when unset; resize() may change it */
  readonly dpr?: number;
}

export type SeamPhase = 'in' | 'out' | null;
/** the lights as set (spec 3 "Materials and lights"; LIGHTS holds the defaults): the environment's intensity on the matte and gloss finishes (env) and on the metallic one, which reflects it rather than gathering it, on the wide class (metalEnv) and on the portrait class (metalEnvPortrait) */
export interface LightSetting { key: number; env: number; metalEnv: number; metalEnvPortrait: number; fill: number; tint: boolean; bodyOnly: boolean }

export interface Carousel {
  /** the carousel's frame: its 8-bit target, display values, cleared to black */
  readonly out: Texture;
  /** the cloud, premultiplied rgb and alpha at min(DPR, 1.5), only while a seam runs; null otherwise */
  readonly cloud: Texture | null;
  /** the scene at rest (the one a step has settled on; during a step still the one it left) */
  scene(): number;
  /** the front scene: the one the key light follows, switching at eased 0.75 of a step */
  front(): number;
  /** the fractional step, from plus dir times the eased t (the reduced cut is at its end from its start) */
  step(): number;
  /** a tween runs or the 150 ms cooldown has not passed */
  busy(): boolean;
  /** one whole step: false while a tween runs, within the cooldown, past an edge, or while the next scene's still is still loading (spec 5, "Loading", phase 4) */
  requestStep(dir: 1 | -1): boolean;
  /** scene i at rest: the planes re-parked, fov 45, the lights snapped by proximity (no mount ramp) and the loops by it; instant sets the key tint too (the wrap, the first scene) */
  setScene(i: number, instant?: boolean): void;
  /** the seam's cloud: the phase and its 0 to 1; null ends it */
  seam(phase: SeamPhase, e: number): void;
  /**
   * The product's look, the reference's cursor tilt (X-14 as amended, E-S4-hover): x and y in minus 1 to 1 (x right, y
   * down, the pointer's place in the viewport), each adding 0.3 rad to the yaw and the pitch, eased by 1 minus 0.9 to the
   * power of 60 dt a frame; a mouse by hovering, a finger while it presses; active false returns it to rest.
   */
  look(x: number, y: number, active: boolean): void;
  /** the loops and the cloud's time run (true) or hold (false): the "Pause motion" control, E-S4-loops; steps, seams and the glue still work */
  motion(on: boolean): void;
  /** one frame: t and dt in seconds, w and h the stage in device pixels; one draw into out (and the cloud's while a seam runs) */
  update(t: number, dt: number, w: number, h: number): void;
  /** the stage in device pixels, and its device pixel ratio when it changed (the cloud's size follows it) */
  resize(w: number, h: number, dpr?: number): void;
  /** the degrade path (spec 6): the cloud at half its resolution while on */
  degrade(cloudHalf: boolean): void;
  /** the director's scissor while the bubble is small (the bubble's bounding box in device pixels), or null */
  scissor(r: { x: number; y: number; w: number; h: number } | null): void;
  /** the bottom shade, for AC12's tuning: how dark at the bottom edge (0 to 1), where it clears (a share of the frame's height) and up to where it stays solid */
  shade(dark: number, height?: number, solid?: number): void;
  /** the product's placement at the stage's CSS size, and the shown product's box on the stage (shares, x from the left, y from the top), or null with no product */
  place(): Placement & { box: Box | null };
  /**
   * The lights set live (the review's product check, AC2; hooks builds call it): the key's, the environment's and the
   * fill's intensity, the key's tint on or off (off: a white key), and bodyOnly, which hides the planes, the logo and
   * the trim so the body alone is drawn on black. Returns the values in force.
   */
  lights(o: Partial<LightSetting>): LightSetting;
  /** products.bin arrived (or changed): the slots rebuilt in each scene's shade, the class scale from the case; their programs compiled one a frame if the rest has warmed */
  setProducts(products: readonly Product[]): void;
  /** the cloud's pass and target, one compile with the target bound (spec 5, "Loading", phase 0: readied at idle, before any seam); warm() starts with it */
  warmCloud(): Promise<void>;
  /** the programs and the environment, one compile a frame with the target bound (phase 2); update() starts it when it has not run */
  warm(): Promise<void>;
  /** the stills of scene i and its neighbours fetched (phase 4; a step waits on the next scene's) */
  prepare(i: number): void;
  /** GPU bytes resident: the targets, the products' geometry, the stills and every loop texture on the GPU */
  memory(): number;
  dispose(): void;
}

/** each product's exhibit factor over life size (section-4.md's, spec 3 "Size and pose") */
export const EXHIBIT: Readonly<Record<string, number>> = Object.freeze({ case: 1, wallet: 1.55, airpods: 1.75, lenskin: 2.2, 'airpods-max': 0.62 });   // the AirPods Max is 174 mm wide, 1.67 times the case; 0.62 draws it 108 by 116 mm, between the AirPods case's and the wallet's exhibit sizes and inside the portrait width rule
/** the class scale's rule on the wide class (spec 3; carousel-math.ts PLACE carries both classes): the life-size case at most this share of the view's height and of its width at its distance, fov 45, whichever bites first */
export const CLASS_FILL = PLACE.wide;
/** the finishes, MeshPhysicalMaterial each (render-products.py's numbers, the family page's calibration; spec 3 "Materials and lights") */
export const FINISH = Object.freeze({
  matte: { roughness: 0.62, metalness: 0, specularIntensity: 0.2 },
  gloss: { roughness: 0.62, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 0.2 },
  metallic: { roughness: 0.38, metalness: 1 },
});
/**
 * The lights (spec 3): the key's intensity, where it shines from (toward the product) and how far white mixes toward
 * the scene's tint; the fill's tint, place and intensity; the environment's intensity on the matte and gloss finishes
 * and on the metallic one, and its blur. The intensities are the spec's 1.6, 0.575 and 0.2 scaled by 0.83, set by
 * scripts/room/product-check.mjs (AC2) on 2026-10-23 so that under a white key the matte lit face lands on its
 * catalog hex (the environment gives 1.5 times the albedo per unit, the key 0.19, the fill 0.2; the spec's numbers
 * sum to 1.21 and the lit faces clipped, the build record's D4); the metallic finish reflects the environment rather
 * than gathering it and takes it per class: 1.0 on the wide class (the Lenskin within dE00 4 with 4 percent of its face
 * at 255 at 1280 x 800; at 0.8 it reads dE00 8.06) and 0.6 on the portrait class, where the raised placement shows the
 * face from lower down and it mirrors the environment's bright ceiling (at 1.0 the face clipped, 96 percent at 255 at
 * 390 x 844; at 0.6 dE00 4.44 with 2.2 percent).
 */
export const LIGHTS = Object.freeze({ key: 1.33, keyMix: 0.6, keyFrom: [0.1, 0.8, 0.6] as const, fill: 0.17, fillTint: '#dfe6ea', fillFrom: [-0.6, 0.2, 0.8] as const, env: 0.48, metalEnv: 1.0, metalEnvPortrait: 0.6, blur: 0.04 });
/**
 * The trim's fixed dark (linear) and its roughness, the logo's share of the shade, and the device a case holds (Apple's
 * light plastic and aluminium, and its dark cloth, cushions and grilles), render-products.py's numbers: render colours,
 * not palette colours (E-A2b's reading), for the parts products-full.py roles "device" and "device-dark" (E-S4-device).
 */
export const PARTS = Object.freeze({ trim: [0.073, 0.077, 0.077] as const, trimRoughness: 0.55, logoTint: 0.8468, device: [0.80, 0.80, 0.79] as const, deviceRoughness: 0.22, deviceDark: [0.02, 0.02, 0.022] as const, deviceDarkRoughness: 0.5 });
/** a part's role from its name in products.bin, with the one correction: the AirPods case's "trim" is its Skreed S (68 triangles, the same inlay as the phone case's and the wallet's logo parts), which products.py roled trim on 2026-10-16; Sam, 2026-10-26: "even in the case the logo is not visible" */
export type PartRole = 'body' | 'logo' | 'trim' | 'device' | 'device-dark';
export const partRole = (product: string, part: string): PartRole => (product === 'airpods' && part === 'trim') || part === 'logo' ? 'logo' : part === 'trim' ? 'trim' : part === 'device' ? 'device' : part === 'device-dark' ? 'device-dark' : 'body';
/** the frame target's multisample count (WebGL2 MSAA), for the products' edges */
export const MSAA = 4;
/**
 * The bottom shade in the frame (the reference's caption gradient, spec 3 "Legibility"; AC12): dark at the bottom edge
 * (the share of black), solid up to `solid` of the frame's height, then clearing linearly by `height`. The reference's
 * is 24 vh, clear to 85 percent black (dark 0.85, solid 0, height 0.24); the four lines' block reaches 0.30 of the
 * height at 390 x 844 and 0.45 at 1280 x 800 (the name at 40 px, the catalog line wrapping in 520 px), so a ramp that
 * clears by 0.24 left dawn's name at 2.2:1 and palace's at 3.4. Set by scripts/room/contrast.mjs (--shade,
 * --shade-solid, --shade-height, live) on 2026-10-23 to the lightest shade at which every text box's median reads
 * 4.5:1 or better over 10 frames of every loop at both viewports: 45 percent of black, solid to 0.45 of the height,
 * clear by 0.72 (every scene box's median 6.0:1 or better, the worst 4.7). docs/specs/evidence/section-4-flux-contrast.md
 * has the readings.
 */
export const SHADE = Object.freeze({ dark: 0.45, solid: 0.45, height: 0.72 });
/** the cloud's target is capped at this DPR (reference 8.4); the cloud's two tones as display values: the reference's shadow and Pearl Whisper (E-S4-colour) */
export const CLOUD = Object.freeze({ dpr: 1.5, shadow: [0.80, 0.84, 0.93] as const, light: [0xf7 / 255, 0xf6 / 255, 0xf3 / 255] as const });
/** the case's width, height and depth in metres where products.bin lacks it (src/data/room-products-bin.json) */
const CASE_M = [0.1047, 0.19674, 0.02656] as const;
/** a proximity change under this is neither rising nor falling (the reference's) */
const PROX_EPS = 5e-4;

const PLANE_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// the loop's bytes (or the still's), each decoded to linear and mixed to a second map while a still hands over to its
// loop or a reduced step cross-fades; the reference's reveal from the light-up value and the pixel's luminance
// (carousel-math.ts lightGain), the floor; re-encoded, then the bottom shade by the fragment's own place in the frame
const PLANE_FRAG = /* glsl */`
  uniform sampler2D tMap, tTo; uniform float uMix, uLight, uSoft, uBoost, uFloor, uShade, uShadeH, uShadeSolid; uniform vec2 uRes;
  varying vec2 vUv;
  vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
  vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
  void main() {
    vec3 c = mix(toLinear(texture2D(tMap, vUv).rgb), toLinear(texture2D(tTo, vUv).rgb), uMix);
    float lum = sqrt(clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0));
    float edge = (1.0 + uSoft) * (1.0 - uLight);
    float reveal = smoothstep(edge, edge + uSoft, lum);
    float ambient = smoothstep(0.4, 1.0, uLight) * uLight;
    float g = max(max(reveal, ambient) * (1.0 + uBoost * reveal * (1.0 - uLight)), uFloor);
    float sh = 1.0 - uShade * (1.0 - clamp((gl_FragCoord.y / uRes.y - uShadeSolid) / max(uShadeH - uShadeSolid, 1e-3), 0.0, 1.0));
    gl_FragColor = vec4(toSrgb(clamp(c * g, 0.0, 1.0)) * sh, 1.0);
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
/** the key's colour over a scene: white mixed keyMix toward the scene's tint (spec 3) */
const keyTint = (hex: string): Rgb => { const c = new Color(hex); return [1 + (c.r - 1) * LIGHTS.keyMix, 1 + (c.g - 1) * LIGHTS.keyMix, 1 + (c.b - 1) * LIGHTS.keyMix]; };
const texBytes = (t: Texture | null): number => { const i = t?.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number } | undefined; const w = i?.videoWidth ?? i?.width ?? 0, h = i?.videoHeight ?? i?.height ?? 0; return w * h * 4; };

/**
 * A product part's material in a colour and finish, writing display values: the output colour-space chunk replaced by
 * an sRGB encode, no tone curve (X-9); offset pulls the logo forward and the trim back where they share a surface. Both
 * sides are drawn: Sam's AirPods case is one open sheet for its shell and for its lid (products.py keeps the FBX's
 * surfaces), and the open lid shows the camera its inside, the sheet's back face, which a front-side material culled
 * (the lid vanished from the front, 2026-10-26); three flips the normal on a back face, so the inside lights as a surface.
 */
function partMaterial(color: Color, finish: Finish | 'trim' | 'device' | 'device-dark', offset = 0): MeshPhysicalMaterial {
  const look = finish === 'trim' ? { roughness: PARTS.trimRoughness, metalness: 0 } : finish === 'device' ? { roughness: PARTS.deviceRoughness, metalness: 0 } : finish === 'device-dark' ? { roughness: PARTS.deviceDarkRoughness, metalness: 0 } : FINISH[finish];
  const m = new MeshPhysicalMaterial({ color, envMapIntensity: LIGHTS.env, toneMapped: false, side: DoubleSide, ...look, polygonOffset: offset !== 0, polygonOffsetFactor: offset, polygonOffsetUnits: offset });
  m.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace('#include <colorspace_fragment>', 'gl_FragColor = sRGBTransferOETF( gl_FragColor );'); };
  m.customProgramCacheKey = () => 'display';
  return m;
}
/** the program a material compiles to, for the warm-up: the clearcoat is the one define among the finishes */
const programKey = (m: MeshPhysicalMaterial): string => (m.clearcoat > 0 ? 'coat' : 'plain');

interface PlaneUniforms { tMap: { value: Texture | null }; tTo: { value: Texture | null }; uMix: { value: number }; uLight: { value: number } }
interface Plane {
  group: Group; mesh: Mesh<PlaneGeometry, ShaderMaterial>; U: PlaneUniforms;
  light: number; prox: number; falling: boolean;
  still: Texture | null; stillJob: Promise<void> | null; settled: boolean;
  showing: 'none' | 'still' | 'loop'; mixT0: number;
}
interface Slot { group: Group; mats: MeshPhysicalMaterial[]; parts: { mesh: Mesh; body: boolean }[]; exhibit: number; /** the product's life size times its exhibit factor, metres */ size: readonly [number, number, number] }
interface Tween { from: number; to: number; dir: 1 | -1; t0: number; ms: number }

export function createCarousel(o: CarouselOptions): Carousel {
  const { renderer, scenes, reduced } = o;
  const N = scenes.length;
  const video = reduced ? null : o.video;
  let dpr = o.dpr ?? (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1), cloudHalf = false;
  const _cc = new Color();

  // the stage and its fixed camera
  const stage = new Scene();
  const cam = new PerspectiveCamera(STEP.fovBase, 1, 0.1, 1000);
  cam.position.set(STEP.cam.x, STEP.cam.y, STEP.cam.z); cam.lookAt(STEP.target.x, STEP.target.y, STEP.target.z); cam.updateMatrixWorld();
  // the frame target, multisampled: without MSAA every product silhouette and hole rim came out stair-stepped against
  // the loops (seen 2026-10-26 against Sam's Cycles renders); the planes and the cloud are full-screen quads, so the
  // samples cost edges alone, and three resolves the samples when the texture is read (the hero's composite)
  let rt = new WebGLRenderTarget(8, 8, { depthBuffer: true, samples: MSAA }), W = 8, H = 8;
  let scissorRect: { x: number; y: number; w: number; h: number } | null = null;

  // the planes, one a scene, sharing the light-up and shade uniforms
  const shared: Record<'uSoft' | 'uBoost' | 'uFloor' | 'uShade' | 'uShadeH' | 'uShadeSolid', { value: number }> & { uRes: { value: Vector2 } } = { uSoft: { value: LIGHT.soft }, uBoost: { value: LIGHT.boost }, uFloor: { value: LIGHT.floor }, uShade: { value: SHADE.dark }, uShadeH: { value: SHADE.height }, uShadeSolid: { value: SHADE.solid }, uRes: { value: new Vector2(8, 8) } };
  const planeGeo = new PlaneGeometry(1, 1);
  const planes: Plane[] = scenes.map(() => {
    const U: PlaneUniforms = { tMap: { value: null }, tTo: { value: null }, uMix: { value: 0 }, uLight: { value: 0 } };
    const mesh = new Mesh(planeGeo, new ShaderMaterial({ uniforms: { ...U, ...shared }, vertexShader: PLANE_VERT, fragmentShader: PLANE_FRAG, side: DoubleSide }));
    mesh.visible = false;
    const group = new Group(); group.add(mesh); group.visible = false; stage.add(group);
    return { group, mesh, U, light: 0, prox: 0, falling: false, still: null, stillJob: null, settled: false, showing: 'none', mixT0: -1 };
  });

  // the products: one group a scene in the scene's shade (the trim dark, the logo a share of the shade); the case sets the class scale
  const holder = new Group(); holder.position.set(0, 0, STEP.productZ); stage.add(holder);
  let products: readonly Product[] = o.products ?? [];
  let slots: (Slot | null)[] = scenes.map(() => null);
  let caseW: number = CASE_M[0], caseH: number = CASE_M[1], classScale = 1;
  let placement: Placement = { cls: o.cls, scale: 1, x: 0, y: 0 };
  const setting: LightSetting = { key: LIGHTS.key, env: LIGHTS.env, metalEnv: LIGHTS.metalEnv, metalEnvPortrait: LIGHTS.metalEnvPortrait, fill: LIGHTS.fill, tint: true, bodyOnly: false };
  /** the environment's intensity on a material: the metallic finish's by the placement's class (the portrait placement shows the face from lower down) */
  const envOf = (m: MeshPhysicalMaterial) => (m.metalness > 0.5 ? (placement.cls === 'portrait' ? setting.metalEnvPortrait : setting.metalEnv) : setting.env);
  /**
   * Each material carries the environment as its own envMap once the PMREM is in: with the scene's environment alone
   * three (0.165, WebGLRenderer setProgram) sets the uniform from scene.environmentIntensity and ignores the material's
   * envMapIntensity, so the environment stood at 1 whatever LIGHTS.env said (the build record's D4). The family page's
   * stage.ts does the same for its gloss materials.
   */
  const applyEnv = (m: MeshPhysicalMaterial) => { if (envTarget) m.envMap = envTarget.texture; m.envMapIntensity = envOf(m); };
  const compiledPrograms = new Set<string>();
  function buildSlots() {
    for (const s of slots) if (s) { holder.remove(s.group); for (const m of s.mats) m.dispose(); }
    const byName = new Map(products.map((p) => [p.name, p]));
    const caseP = byName.get('case'); caseW = caseP?.size[0] ?? CASE_M[0]; caseH = caseP?.size[1] ?? CASE_M[1];
    slots = scenes.map((s) => {
      const p = byName.get(s.product);
      if (!p) return null;
      const shade = new Color(s.shade), group = new Group();
      // the parts by role (partRole; render-products.py's roles): the trim in its fixed dark at roughness 0.55, the logo a share of the body's shade, the device the case holds in its fixed light and dark greys, everything else the body in the scene's shade and finish
      const body = partMaterial(shade, s.finish), logo = partMaterial(shade.clone().multiplyScalar(PARTS.logoTint), s.finish, -1), trim = partMaterial(new Color(...PARTS.trim), 'trim', 1);
      const device = partMaterial(new Color(...PARTS.device), 'device'), deviceDark = partMaterial(new Color(...PARTS.deviceDark), 'device-dark');
      const byRole: Record<PartRole, MeshPhysicalMaterial> = { body, logo, trim, device, 'device-dark': deviceDark };
      for (const m of Object.values(byRole)) applyEnv(m);
      const parts: Slot['parts'] = [];
      for (const part of p.parts) {
        const role = partRole(p.name, part.name), isBody = role === 'body';
        const mesh = new Mesh(part.geometry, byRole[role]);
        mesh.frustumCulled = false; mesh.visible = isBody || !setting.bodyOnly; group.add(mesh); parts.push({ mesh, body: isBody });
      }
      group.visible = false; holder.add(group);
      const e = EXHIBIT[s.product] ?? 1;
      return { group, mats: Object.values(byRole), parts, exhibit: e, size: [p.size[0] * e, p.size[1] * e, p.size[2] * e] as const };
    });
    measure();
  }
  /** the class scale and the holder's place from the stage's shape and size in CSS px (spec 3, "Size and pose"; carousel-math.ts productPlacement) */
  function measure() {
    const sizes = slots.filter((s): s is Slot => !!s).map((s) => s.size);
    const was = placement.cls;
    placement = productPlacement(W / dpr, H / dpr, caseW, caseH, sizes.length ? sizes : [[caseW, caseH, CASE_M[2]]]);
    classScale = placement.scale;
    holder.position.set(placement.x, placement.y, STEP.productZ);
    if (placement.cls !== was) for (const s of slots) if (s) for (const m of s.mats) applyEnv(m);   // the metallic finish's environment follows the class
  }

  // the lights: the key from above and in front, tinted per scene; the cool fill from the other side (spec 3)
  const keyDir = new Vector3(...LIGHTS.keyFrom).normalize(), fillDir = new Vector3(...LIGHTS.fillFrom).normalize();
  const key = new DirectionalLight(0xffffff, LIGHTS.key); key.position.set(keyDir.x * 4, keyDir.y * 4, STEP.productZ + keyDir.z * 4); key.target.position.set(0, 0, STEP.productZ);
  const fill = new DirectionalLight(LIGHTS.fillTint, LIGHTS.fill); fill.position.set(fillDir.x * 4, fillDir.y * 4, STEP.productZ + fillDir.z * 4); fill.target.position.set(0, 0, STEP.productZ);
  stage.add(key, key.target, fill, fill.target);
  let envTarget: WebGLRenderTarget | null = null;

  // the cloud: a clip-space triangle into its own target
  const cloudU = { uTime: { value: 0 }, uProgress: { value: 0 }, uRes: { value: new Vector2(1, 1) }, uShadow: { value: new Color().setRGB(...CLOUD.shadow) }, uLight: { value: new Color().setRGB(...CLOUD.light) } };
  const cloudGeo = new BufferGeometry(); cloudGeo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const cloudMesh = new Mesh(cloudGeo, new ShaderMaterial({ uniforms: cloudU, vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG, depthTest: false, depthWrite: false }));
  cloudMesh.frustumCulled = false;
  const cloudScene = new Scene(); cloudScene.add(cloudMesh); const cloudCam = new Camera();
  let cloudRt: WebGLRenderTarget | null = null, CW = 0, CH = 0;
  let seamPhase: SeamPhase = null, cover = 0, cloudTime = 0;

  // the state
  let index = 0, frontIdx = 0, shownIdx = 0, curStep = 0, lastT = 0, cooldownUntil = -1, motionOn = true;
  let tw: Tween | null = null;
  let keyFrom: Rgb = keyTint(scenes[0]?.keyLight ?? '#ffffff'), keyTo: Rgb = keyFrom, keyT0 = -1e9;
  let lookX = 0, lookY = 0, lookTX = 0, lookTY = 0;
  let cloudWarmed: Promise<void> | null = null, warmed: Promise<void> | null = null, disposed = false;

  const place = (p: Plane, angle: number) => { const r = ringPlace(angle, STEP.radius, STEP.cam); p.group.position.set(r.x, r.y, r.z); p.group.rotation.y = r.yaw; };
  const sweepRad = () => ((H > W ? o.tune().sweepDegPortrait : o.tune().sweepDeg) * Math.PI) / 180;

  /** every plane parked: the front one at angle 0, visible; the rest at the arc's end, hidden, their loop textures released; the fov at rest */
  function park(i: number) {
    planes.forEach((p, j) => {
      place(p, j === i ? 0 : sweepRad()); p.group.visible = j === i;
      if (j !== i) { p.U.uMix.value = 0; p.U.tTo.value = null; const L = scenes[j].loop; if (video && L !== null) video.release(L); }
    });
    if (cam.fov !== STEP.fovBase) { cam.fov = STEP.fovBase; cam.updateProjectionMatrix(); }
    curStep = i; shownIdx = i;
  }
  /** the lights at rest on scene k, at once: no mount ramp (spec 4, "Proximity") */
  const snapLights = (k: number) => planes.forEach((p, j) => { p.prox = proximity(k, j); p.falling = false; p.light = j === k ? 1 : 0; p.U.uLight.value = p.light; });

  /** the front scene: its key light colour cross-fades from the current colour over keyLightMs, or is set at once */
  function setFront(i: number, t: number, instant: boolean) {
    if (i === frontIdx && !instant) return;
    const to = keyTint(scenes[i].keyLight);
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
      const tex = video.texture(L);   // the texture (made now if the plane was parked), the frame's upload and the refusal clock
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

  /** the cloud's target at min(DPR, 1.5) of the stage, halved on degrade, from the stage's current DPR */
  function allocCloud() {
    const s = (Math.min(dpr, CLOUD.dpr) / dpr) * (cloudHalf ? 0.5 : 1);
    const w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s));
    if (cloudRt && CW === w && CH === h) return;
    cloudRt?.dispose(); cloudRt = new WebGLRenderTarget(w, h, { depthBuffer: false }); CW = w; CH = h; cloudU.uRes.value.set(w, h);
  }

  /**
   * The frame's draws: the stage into its target, then the cloud into its own while a seam runs. Under a seam's full
   * cover the stage is not drawn and its target keeps the last frame: the cloud is opaque there, so nothing under it
   * shows, and a seam over the hall or over the hero after the exit's jump steps the carousel for the cloud alone (the
   * build record's section 10, the cost reading of the seams over the hero). The wrap's hold and the frames at either
   * end of a cover-in and a cover-out are the frames at cover 1.
   */
  function draw() {
    const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(), tm = renderer.toneMapping, ac = renderer.autoClear;
    renderer.toneMapping = NoToneMapping; renderer.autoClear = false;
    if (!(seamPhase && cover >= 1)) {
      if (scissorRect) { rt.scissor.set(scissorRect.x, scissorRect.y, scissorRect.w, scissorRect.h); rt.scissorTest = true; } else rt.scissorTest = false;
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(true, true, false);
      renderer.render(stage, cam);
    }
    if (seamPhase && cloudRt) {
      renderer.setRenderTarget(cloudRt); renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false);
      renderer.render(cloudScene, cloudCam);
    }
    renderer.setRenderTarget(null); renderer.setClearColor(pc, pa); renderer.toneMapping = tm; renderer.autoClear = ac;
  }

  const frame = () => new Promise<void>((r) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => r()) : setTimeout(r, 16)));
  /** one compile with a target bound under NoToneMapping (three keys each program on both; with none bound it would build the canvas's variants) */
  const compile = async (obj: Object3D, c: Camera, sc: Scene, target: WebGLRenderTarget) => {
    const tm = renderer.toneMapping;
    renderer.toneMapping = NoToneMapping; renderer.setRenderTarget(target);
    const done = renderer.compileAsync(obj, c, sc);
    renderer.setRenderTarget(null); renderer.toneMapping = tm;
    await done;
  };
  /** the products' programs, one a frame: one mesh per program among the slots (matte and metallic and the trim share one, the gloss and its logo the other) */
  async function warmProducts() {
    const todo = new Map<string, Mesh>();
    for (const s of slots) if (s) for (const m of s.group.children) { const mat = (m as Mesh).material as MeshPhysicalMaterial, k = programKey(mat); if (!compiledPrograms.has(k) && !todo.has(k)) todo.set(k, m as Mesh); }
    for (const [k, mesh] of todo) { if (disposed) return; await compile(mesh, cam, stage, rt); compiledPrograms.add(k); await frame(); }
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
      // the reduced cut: the product swapped and the key light set at once, the step at its end so the product faces out (no half turn)
      if (reduced) { shownIdx = to; curStep = to; setFront(to, lastT, true); }
      else planes[to].group.visible = true;
      return true;
    },
    setScene(i, instant = false) {
      const k = Math.max(0, Math.min(N - 1, Math.round(i)));
      tw = null; index = k; park(k); keepAround(k); api.prepare(k);
      setFront(k, lastT, instant);
      snapLights(k);
      if (video) scenes.forEach((s, j) => { if (s.loop !== null && j !== k) video.reset(s.loop); });
    },
    seam(phase, e) { seamPhase = phase; cover = cloudCover(phase, e); if (phase) allocCloud(); },
    look(x, y, active) { if (reduced) return; lookTX = active ? x : 0; lookTY = active ? y : 0; },
    motion(on) {
      motionOn = on;
      if (!on && video) for (const s of scenes) if (s.loop !== null) video.pause(s.loop);
    },
    update(t, dt, w, h) {
      if (disposed) return;
      lastT = t;
      if (w !== W || h !== H) api.resize(w, h);
      if (!warmed) void api.warm();
      const T = o.tune(), cfg: LightConfig = { start: T.lightStart, soft: T.lightSoft, boost: T.lightBoost, floor: LIGHT.floor };
      shared.uSoft.value = cfg.soft; shared.uBoost.value = cfg.boost;
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
      // the lights and the loops by proximity and its direction
      planes.forEach((p, j) => {
        const prox = proximity(curStep, j);
        p.falling = prox < p.prox - PROX_EPS ? true : prox > p.prox + PROX_EPS ? false : p.falling;
        p.prox = prox;
        p.light = reduced ? (p.group.visible ? 1 : 0) : lightUp(p.light, prox, !p.falling, dt, cfg);
        p.U.uLight.value = p.light;
        const L = scenes[j].loop;
        if (video && L !== null) {
          if (loopShouldReset(prox)) video.reset(L);
          else if (motionOn && loopShouldPlay(prox, p.falling) && video.in(L) && !video.playing(L)) video.play(L);
        }
      });
      // the visible planes' maps and fits (none drawn while the product check wants the body alone on black)
      planes.forEach((p, j) => { if (p.group.visible) fit(p, chooseMap(p, j, t, !!(reduced && tw && j === tw.from))); if (setting.bodyOnly) p.mesh.visible = false; });
      // the product in front: the shown scene's, scaled across the step, turned with the step and the look
      const sh = slots[shownIdx];
      for (const s of slots) if (s) s.group.visible = s === sh;
      if (sh) {
        let scale = classScale * sh.exhibit;
        if (tw && !reduced) scale = productScale(e, classScale * (slots[tw.from]?.exhibit ?? sh.exhibit), classScale * (slots[tw.to]?.exhibit ?? sh.exhibit), shownIdx === tw.to);
        sh.group.scale.setScalar(scale);
        const k = 1 - Math.pow(0.9, 60 * dt);
        lookX += (lookTX - lookX) * k; lookY += (lookTY - lookY) * k;
        // the authored rest pose, all of it at rest and none at the edge-on half step (poseWeight), under the look
        const pw = reduced ? 1 : poseWeight(curStep, shownIdx), sc = scenes[shownIdx];
        sh.group.rotation.set((sc.basePitch ?? 0) * pw + lookY * STEP.lookRad, productYaw(curStep, shownIdx, sc.baseYaw * pw) + lookX * STEP.lookRad, 0);
      }
      // the key light (white while the product check has its tint off)
      const c = keyLight(t - keyT0, keyFrom, keyTo, T.keyLightMs); if (setting.tint) key.color.setRGB(c[0], c[1], c[2]); else key.color.setRGB(1, 1, 1);
      // the cloud: its clock runs while motion does (held at 0 under reduced motion)
      if (motionOn && !reduced) cloudTime += Math.max(0, dt);
      if (seamPhase) { cloudU.uTime.value = cloudTime; cloudU.uProgress.value = cover; }
      draw();
    },
    resize(w, h, ratio) {
      W = Math.max(1, Math.round(w)); H = Math.max(1, Math.round(h));
      if (ratio && ratio > 0) dpr = ratio;
      rt.dispose(); rt = new WebGLRenderTarget(W, H, { depthBuffer: true, samples: MSAA });
      cam.aspect = W / H; cam.updateProjectionMatrix(); shared.uRes.value.set(W, H);
      if (cloudRt) allocCloud();
      measure();
    },
    degrade(half) { cloudHalf = half; if (cloudRt) allocCloud(); },
    scissor(r) { scissorRect = r; },
    shade(dark, height = SHADE.height, solid = SHADE.solid) { shared.uShade.value = clamp01(dark); shared.uShadeH.value = Math.max(1e-3, height); shared.uShadeSolid.value = Math.min(clamp01(solid), shared.uShadeH.value); },
    place() { const sh = slots[shownIdx]; return { ...placement, box: sh ? productScreenBox(placement, sh.size, W / dpr, H / dpr) : null }; },
    lights(o) {
      Object.assign(setting, o);
      key.intensity = setting.key; fill.intensity = setting.fill;
      stage.environmentIntensity = setting.env;
      for (const s of slots) if (s) { for (const m of s.mats) applyEnv(m); for (const p of s.parts) p.mesh.visible = p.body || !setting.bodyOnly; }
      return { ...setting };
    },
    setProducts(list) {
      if (disposed) return;
      products = list; buildSlots();
      if (warmed) void warmProducts().catch(() => {});
    },
    warmCloud() {
      return (cloudWarmed ??= (async () => {
        try { allocCloud(); if (cloudRt) await compile(cloudMesh, cloudCam, cloudScene, cloudRt); }
        catch (e) { if (!disposed) console.warn('section 4: the cloud pass did not warm up; it compiles on first use', e); }
      })());
    },
    warm() {
      return (warmed ??= (async () => {
        try {
          await api.warmCloud(); await frame();
          if (disposed) return;
          // the environment first: the products' programs key on it; compiled with the target bound, as the planes are
          const env = new RoomEnvironment(), envCam = new PerspectiveCamera(90, 1, 0.1, 100);
          await compile(env, envCam, env, rt); await frame();
          if (disposed) { env.dispose(); return; }
          const pm = new PMREMGenerator(renderer);
          envTarget = pm.fromScene(env, LIGHTS.blur); env.dispose(); pm.dispose();
          stage.environment = envTarget.texture; stage.environmentIntensity = setting.env;
          for (const s of slots) if (s) for (const m of s.mats) applyEnv(m);
          await frame();
          if (disposed) return;
          if (planes[0]) { await compile(planes[0].mesh, cam, stage, rt); await frame(); }
          await warmProducts();
        } catch (e) { if (!disposed) console.warn('section 4: the carousel did not warm up; its programs compile on first use', e); }
      })());
    },
    prepare(i) { for (const j of [i, i + 1, i - 1]) if (j >= 0 && j < N) ensureStill(j); },
    memory() {
      // the frame target: its colour and depth renderbuffers at MSAA samples, and the texture the samples resolve into
      let b = W * H * (8 * MSAA + 4) + (cloudRt ? CW * CH * 4 : 0) + (envTarget ? envTarget.width * envTarget.height * 8 : 0);
      for (const p of products) for (const part of p.parts) b += part.geometry.attributes.position.count * 24 + (part.geometry.index?.count ?? 0) * 2;
      for (const p of planes) b += texBytes(p.still);
      if (video) for (const s of scenes) if (s.loop !== null && video.resident(s.loop)) { const [w, h] = video.size(s.loop); b += w * h * 4; }
      return b;
    },
    dispose() {
      disposed = true; tw = null; seamPhase = null;
      rt.dispose(); cloudRt?.dispose(); cloudRt = null; envTarget?.dispose(); envTarget = null; stage.environment = null;
      planeGeo.dispose(); cloudGeo.dispose(); cloudMesh.material.dispose();
      for (const p of planes) { p.mesh.material.dispose(); p.still?.dispose(); p.still = null; p.stillJob = null; }
      for (const s of slots) if (s) for (const m of s.mats) m.dispose();
      if (video) for (const s of scenes) if (s.loop !== null) video.release(s.loop);
      key.dispose(); fill.dispose();
    },
  };
  buildSlots();
  park(0); snapLights(0);
  return api;
}
