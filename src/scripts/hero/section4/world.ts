// Section 4's world (docs/specs/section-4-world.md 2 "The ring travel", "The particle morph", "A land, at rest", 5 "The
// island", W1 to W4, W8, W12, AC3): the garden tunnel the bubble opens onto, its rings, the cloud at its far end, the
// morph onto the first land's picture and the push into it, and every land at rest. It replaces universe.ts.
// - The flight is level (W1) along -z, on igloo's own ease, cubic-bezier(0.6, 0, 0, 1) (evidence 4), from 0.71 S before
//   the first ring (igloo's approach pose: the ring fills about 116 percent of a laptop frame's height) to 0.5 S past the
//   last; the FOV opens 22 to 30 degrees (evidence 2) under the hero's portrait zoom, min(1, aspect x 1.5); the roll
//   rises to travelRoll before the first ring, is held through the passes and unwinds after the last, never faster than
//   30 degrees a second (W4). No flash at the rings (W4, WCAG 2.3.1).
// - The rings (rings.ts, W3) assemble on approach (W2): a ring's shards are thrown out beyond 1.4 S from the camera and
//   whole by 1.0 S, each on its own window of that falloff. Their faces carry the intro's triangle lattice (tTri) in the
//   next family's key shade, lit by the garden's sun behind the camera at 35 degrees. A forcefield disc fills each
//   ring's hole, of radius 0.13 S and 0.06 S ahead of it: the lattice with concentric and radial lines in the
//   shade of the arc behind, brightest at the rim, faded out as the camera passes through (additive, E-S4-glow).
// - The garden (E-S4-garden; scripts/room/garden.py renders it, its URLs and distances come in through options): a far
//   plate and three depth cards with alpha, each covering its image's field (64 degrees across by default) as seen from
//   the glide's end pose on the axis, so the four line up as rendered there and slide against each other in flight.
//   Without a garden (E-S4-garden's default if withdrawn) the rings fly over Urban Slate.
// - The cloud (cloud.ts, W8, W12) waits 2.5 S past the last ring and turns slowly; at 75 percent of the glide's time
//   (97 percent of its way) it morphs onto the first land's picture filling the frame, the picture fading in under the
//   points over the morph's last 0.6 s, then the points fade over the push's first 0.25 s.
// - A land is its picture on a displaced grid seen from its capture pose (positions from gl_VertexID, the depth fetched in
//   the vertex shader by the disparity rule), so at the capture pose it is the picture, cover-fit, pixel for pixel; the
//   push after the morph moves the camera 0.15 of the land's near distance into it, and that pose is the land's rest.
// One 8-bit target with depth, display values written by hand (toSrgb) under NoToneMapping set and restored around the
// draw, as the hall's; no output pass, and on laptops at most the screened bloom with everything else of post.ts off,
// never on a land at rest. Loading runs one step a frame (spec 5 "Loading, in phases"): the rings' generation, each
// garden image's decode and its upload in row strips, the compile with the target bound, a warm draw.
import { AdditiveBlending, BufferGeometry, Color, DataTexture, DoubleSide, Float32BufferAttribute, Group, LinearFilter, LinearMipmapLinearFilter, Mesh, NoColorSpace, NoToneMapping, NormalBlending, PerspectiveCamera, PlaneGeometry, RedFormat, RGBAFormat, Scene, ShaderMaterial, Sphere, Uint16BufferAttribute, Uint32BufferAttribute, UnsignedByteType, Vector2, Vector3, Vector4, WebGLRenderTarget, type Texture, type WebGLRenderer } from 'three';
import { ROOM_BAYS } from '../../../config/room.ts';
import { URBAN_SLATE } from '../../../config/tokens.ts';
import { fsGeo } from '../section2/background.ts';
import { easeInOutCubic } from '../util/math.ts';
import { TO_SRGB } from './assets.ts';
import { CLOUD, coverScale, createPoints, type CloudPoints, type StreamEnd } from './cloud.ts';
import { createOutputPass, type OutputPass } from './post.ts';
import { RING, generateRings, type RingArrays } from './rings.ts';

// ---------------------------------------------------------------- the numbers (for config/room.ts at integration)

/** the ring spacing S in scene units (igloo's, evidence 3); the tunnel's other lengths are multiples of it */
export const S = 2.5;

/** the glide (spec 2 "The ring travel"; seconds after the press, lengths in S) */
export const GLIDE = Object.freeze({
  start: 0.35,                       // the bubble's first frame and the glide's
  approach: 0.71, exit: 0.5,         // S before the first ring, S past the last
  ease: [0.6, 0, 0, 1] as const,     // igloo's inOut3 (evidence 4)
  fov: [22, 30] as const,            // degrees, over the glide (evidence 2), sine in-out of its time
  portrait: 1.5,                     // the zoom: min(1, aspect x 1.5)
  rollRate: 30,                      // degrees a second at most (W4)
  rollHold: 0.25,                    // s: the roll is reached this long before the first pass and held until this long after the last
  morphAt: 0.75,                     // the morph starts at this share of the glide's time (97.3 percent of its way)
  assemble: [1.0, 1.4] as const,     // S from the camera: whole at 1.0, thrown at 1.4 (W2)
  cloudBeyond: 2.5,                  // S past the last ring
  forcefield: [0.13, 0.06] as const, // S: the disc's radius, and how far ahead of its ring
  minGap: 0.4,                       // s: the floor between passes (the unit test's, W4)
});

/** the end of the entry: the push into the first land (a share of its near distance), the picture's and the points' fades (s) */
export const ENTRY = Object.freeze({ pushRest: 0.15, picFade: 0.6, pointsFade: 0.25 });
/** the still3d entry (spec 4 "Reduced motion"): the bubble's dissolve, the tunnel held still, the cross-fade to land 1 (s) */
export const REDUCED_ENTRY = Object.freeze({ dissolve: 0.6, hold: 1.0, fade: 0.3 });
/** the garden's defaults (spec 3 "The garden"): each image's field in degrees across, the plate's and the cards' distances in S beyond the last ring */
export const GARDEN = Object.freeze({ fov: 64, plate: 40, cards: [2, 4, 7] as const });

/** the entry's Tune values (to join ROOM_PARAMS at integration); the spec's defaults */
export const WORLD_DEFAULTS = Object.freeze({ bubbleMs: 2000, travelMs: 8000, ringCount: 3, travelRoll: 30, morphMs: 1800, enterPushMs: 1200, /** laptops: post.ts's screened bloom over the tunnel and the push (0 off; never on a land at rest) */ worldBloom: 0 });
export type WorldParams = { -readonly [K in keyof typeof WORLD_DEFAULTS]: number };
/** Tune's ranges: the spec's for bubbleMs, ringCount and travelRoll; the others proposed. clampEntry narrows them to what passes. */
export const WORLD_RANGES: Readonly<Record<keyof WorldParams, readonly [number, number]>> = Object.freeze({ bubbleMs: [1200, 3200], travelMs: [6000, 12000], ringCount: [2, 5], travelRoll: [0, 90], morphMs: [1000, 3000], enterPushMs: [600, 2000], worldBloom: [0, 1] });
/**
 * The ranges Tune can offer at the default 8 s glide with every combination passing as it stands (the unit test proves
 * it and that one step past each edge fails): five rings put two passes 0.28 s apart, a bubble longer than 2.19 s still
 * covers the first of four rings, and a roll past 37 degrees cannot come up before it at 30 degrees a second.
 */
export const WORLD_TUNE_SAFE = Object.freeze({ bubbleMs: [1200, 2190] as const, ringCount: [2, 4] as const, travelRoll: [0, 37] as const });

/**
 * The scene's colours by id (AC3, read back by tests/unit/room-world.test.ts): the rings' arcs, their lattice (the next
 * family's), the forcefields' lines and the cloud are the ten key shades of ROOM_BAYS; the clear colour, seen only when
 * the garden is withdrawn, is Urban Slate (E-S4-garden's default). The garden and the pictures are image content.
 */
export const SCENE_COLOURS = Object.freeze({
  rings: ROOM_BAYS.map((b) => b.shade), lattice: ROOM_BAYS.map((_, i) => ROOM_BAYS[(i + 1) % ROOM_BAYS.length].shade),
  forcefields: ROOM_BAYS.map((b) => b.shade), cloud: ROOM_BAYS.map((b) => b.shade), clear: ['urban-slate'],
});

// ---------------------------------------------------------------- the timeline (pure: the unit test runs it)

/** cubic-bezier(x1, y1, x2, y2) as CSS has it: the eased share at a time share, and the time share at an eased share */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const f = (a: number, b: number) => (s: number) => 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
  const bx = f(x1, x2), by = f(y1, y2);
  const inv = (g: (s: number) => number, v: number) => { let lo = 0, hi = 1, s = v; for (let i = 0; i < 48; i++) { const d = g(s) - v; if (Math.abs(d) < 1e-9) break; if (d < 0) lo = s; else hi = s; s = (lo + hi) / 2; } return s; };
  return { at: (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : by(inv(bx, u))), timeAt: (y: number) => (y <= 0 ? 0 : y >= 1 ? 1 : bx(inv(by, y))) };
}
export const GLIDE_EASE = cubicBezier(...GLIDE.ease);

/** ring k's plane (scene z): the camera starts at z 0 and flies toward -z */
export const ringZ = (k: number): number => -(GLIDE.approach + k) * S;

export interface EntryTimeline {
  /** seconds after the press */
  glide: readonly [number, number]; passes: readonly number[]; morph: readonly [number, number]; push: readonly [number, number]; arrive: number;
  /** the roll actually reached (degrees, at most travelRoll, held to 30 degrees a second) and its ramps */
  roll: { max: number; in: readonly [number, number]; out: readonly [number, number] };
  /** scene z: each ring, the camera's start and end, the cloud */
  rings: readonly number[]; camZ: readonly [number, number]; cloudZ: number;
}

/** the entry's beats from the Tune values (spec 2 and 4): the ring passes solve the ease for each ring's share of the way */
export function entryTimeline(p: Pick<WorldParams, 'travelMs' | 'ringCount' | 'morphMs' | 'enterPushMs' | 'travelRoll'>): EntryTimeline {
  const n = Math.max(1, Math.round(p.ringCount)), T = p.travelMs / 1000, L = GLIDE.approach + (n - 1) + GLIDE.exit;
  const rings = Array.from({ length: n }, (_, k) => ringZ(k));
  const passes = rings.map((_, k) => GLIDE.start + T * GLIDE_EASE.timeAt((GLIDE.approach + k) / L));
  const g1 = GLIDE.start + T, m0 = GLIDE.start + GLIDE.morphAt * T, m1 = m0 + p.morphMs / 1000, arrive = m1 + p.enterPushMs / 1000;
  // the roll comes up from the glide's start to just before the first pass and goes down from just after the last until
  // the picture starts to fade in over the morph (the picture is drawn upright in the frame, whatever the camera's roll)
  const settle = m1 - ENTRY.picFade, rin = [GLIDE.start, Math.max(GLIDE.start, passes[0] - GLIDE.rollHold)] as const, rout = [Math.min(settle, passes[n - 1] + GLIDE.rollHold), settle] as const;
  // a cosine ramp of d seconds peaks at pi/2 x max / d degrees a second: the max that holds 30 on the shorter ramp
  const d = Math.min(rin[1] - rin[0], rout[1] - rout[0]), cap = d > 0 ? (GLIDE.rollRate * d * 2) / Math.PI : 0;
  const max = Math.sign(p.travelRoll) * Math.min(Math.abs(p.travelRoll), cap);
  return { glide: [GLIDE.start, g1], passes, morph: [m0, m1], push: [m1, arrive], arrive, roll: { max, in: rin, out: rout }, rings, camZ: [0, -L * S], cloudZ: rings[n - 1] - GLIDE.cloudBeyond * S };
}

/** the roll at t (degrees): up a cosine ramp, held through the passes, and down another */
export function rollAt(t: number, tl: EntryTimeline): number {
  const ramp = (a: number, b: number) => (b <= a ? (t >= b ? 1 : 0) : t <= a ? 0 : t >= b ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * (t - a)) / (b - a)));
  return tl.roll.max * (ramp(tl.roll.in[0], tl.roll.in[1]) - ramp(tl.roll.out[0], tl.roll.out[1]));
}

/** what breaks the spec's rules at these values (spec 2: every gap at least 0.4 s, the first pass after the bubble; W4's roll rate) */
export function entryProblems(p: Pick<WorldParams, 'bubbleMs' | 'travelMs' | 'ringCount' | 'morphMs' | 'enterPushMs' | 'travelRoll'>): string[] {
  const tl = entryTimeline(p), out: string[] = [];
  for (let k = 1; k < tl.passes.length; k++) { const g = tl.passes[k] - tl.passes[k - 1]; if (g < GLIDE.minGap) out.push(`gap ${k}-${k + 1} is ${g.toFixed(3)} s`); }
  if (tl.passes[0] < GLIDE.start + p.bubbleMs / 1000) out.push(`first pass ${tl.passes[0].toFixed(3)} s before the bubble clears at ${(GLIDE.start + p.bubbleMs / 1000).toFixed(3)} s`);
  if (Math.abs(tl.roll.max) < Math.abs(p.travelRoll) - 1e-9) out.push(`roll held to ${tl.roll.max.toFixed(1)} degrees (30 degrees a second)`);
  return out;
}

/**
 * The Tune values made to pass (the director applies it to Tune's live copy): rings dropped until every gap holds (the
 * glide lengthened if two still do not), the bubble shortened to clear before the first pass, the roll to its rate.
 */
export function clampEntry(p: WorldParams): WorldParams {
  const q = { ...p };
  const lim = (k: keyof WorldParams) => { const [a, b] = WORLD_RANGES[k]; q[k] = Math.min(b, Math.max(a, q[k])); };
  (Object.keys(WORLD_RANGES) as (keyof WorldParams)[]).forEach(lim);
  q.ringCount = Math.round(q.ringCount);
  const gapsOk = () => { const ps = entryTimeline(q).passes; return ps.every((t, k) => k === 0 || t - ps[k - 1] >= GLIDE.minGap); };
  while (!gapsOk() && q.ringCount > WORLD_RANGES.ringCount[0]) q.ringCount--;
  while (!gapsOk() && q.travelMs < 30000) q.travelMs += 250;
  const tl = entryTimeline(q);
  q.bubbleMs = Math.min(q.bubbleMs, Math.floor((tl.passes[0] - GLIDE.start) * 100) * 10);
  q.travelRoll = tl.roll.max;
  return q;
}

// ---------------------------------------------------------------- textures in strips (spec 5: one upload a frame)

/** an image fetched with the site's 20 s timeout and decoded off the main thread, bottom row first (uv 0 at the bottom, three's), untagged */
export async function decodeImage(url: string, signal?: AbortSignal): Promise<ImageBitmap> {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 20_000), stop = () => ac.abort();
  signal?.addEventListener('abort', stop, { once: true });
  try {
    const res = await fetch(url, { signal: ac.signal, credentials: 'same-origin' });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return await createImageBitmap(await res.blob(), { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  } finally { clearTimeout(t); signal?.removeEventListener('abort', stop); }
}

export interface StripUpload { readonly texture: DataTexture; readonly done: boolean; /** one step: the storage, then a strip of rows, then the mip chain; true once complete */ step(): boolean }

/**
 * A texture uploaded from an ImageBitmap a strip of rows at a time (about 1 MB a step): three allocates the storage once
 * (texStorage2D, every level), each step copies the next rows with UNPACK_SKIP_ROWS through three's own state cache, and
 * the last generates the mip chain. Display values in and out (NoColorSpace); red takes the first channel (depth maps).
 */
export function stripUpload(renderer: WebGLRenderer, bmp: ImageBitmap, o: { red?: boolean; mipmaps?: boolean } = {}): StripUpload {
  const w = bmp.width, h = bmp.height, red = !!o.red, mips = !!o.mipmaps;
  const texture = new DataTexture(null, w, h, red ? RedFormat : RGBAFormat, UnsignedByteType);
  texture.source.dataReady = false;   // the first upload allocates only
  texture.colorSpace = NoColorSpace; texture.flipY = false; texture.generateMipmaps = mips; texture.unpackAlignment = 1;
  texture.minFilter = mips ? LinearMipmapLinearFilter : LinearFilter; texture.magFilter = LinearFilter; texture.needsUpdate = true;
  const rows = Math.max(16, Math.floor((1 << 20) / (w * 4)));
  let y = -1, done = false;
  return {
    texture, get done() { return done; },
    step() {
      if (done) return true;
      if (y < 0) { renderer.initTexture(texture); y = 0; return false; }
      const gl = renderer.getContext() as WebGL2RenderingContext;
      renderer.state.bindTexture(gl.TEXTURE_2D, (renderer.properties.get(texture) as { __webglTexture: WebGLTexture }).__webglTexture);
      if (y < h) {
        const n = Math.min(rows, h - y);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, w, n, red ? gl.RED : gl.RGBA, gl.UNSIGNED_BYTE, bmp);
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
        y += n;
        if (y < h || mips) return false;
      } else if (mips) gl.generateMipmap(gl.TEXTURE_2D);
      bmp.close(); done = true;
      return true;
    },
  };
}

// ---------------------------------------------------------------- the API

/** one garden image (garden.json): its URL (the director picks AVIF or WebP), its distance in S beyond the last ring, its field in degrees across from the glide's end pose */
export interface GardenImage { url: string; distance: number; fov?: number; /** mip it (the cards seen small from afar); the plate is near 1:1 and goes without */ mipmaps?: boolean }
export interface GardenSpec { plate: GardenImage; cards: readonly GardenImage[] }

/**
 * A land as the director hands it in (it loads and owns the textures: stripUpload makes them): the picture (untagged,
 * mipmapped, uv 0 at its bottom), its depth map or null (single channel, 1 near, 0 far), the picture's aspect (width
 * over height), its capture's vertical FOV in degrees, and the disparity rule's near and far distances.
 */
export interface LandView { picture: Texture; depth: Texture | null; aspect: number; fov: number; near: number; far: number }

/** a layer of a land frame, drawn in order over the one before (the depth cleared between) */
export type WorldLayer =
  | { kind: 'land'; i: number; /** scene units into the land along its view */ push: number; alpha?: number; /** degrees of yaw and pitch (option A's slight sway) */ sway?: readonly [number, number] }
  | { kind: 'points'; alpha?: number; /** option A's stream between two resident lands; without it the points as they stand (the morph's landed points) */ stream?: { from: number; to: number; p: number; fromPush: number; toPush: number } }
  | { kind: 'garden' };

export interface EntryFrame { phase: 'glide' | 'morph' | 'push' | 'rest'; done: boolean; arrive: number; passes: readonly number[] }

export interface WorldScene {
  readonly started: boolean;
  readonly ready: boolean;
  readonly failed: boolean;
  /** the frame: display values, alpha 1 (the bubble's inside, then the whole frame) */
  readonly out: Texture | null;
  /** rings, cloud and garden, uploaded and compiled one step a frame */
  load(): Promise<void>;
  /** device pixels */
  resize(w: number, h: number): void;
  /** a land's textures and capture (null: forget it; the director keeps only the previous, current and next resident) */
  setLand(i: number, view: LandView | null): void;
  /** the entry at t seconds after the press (the bubble's inside, the glide, the morph, the push) */
  entry(t: number, params: WorldParams): EntryFrame;
  /** land i at rest */
  land(i: number): void;
  /** a frame built of layers (the travels between lands, the cross-fades) */
  layers(list: readonly WorldLayer[], bloom?: number): void;
  /** the draw clipped to a rectangle of the target (device px, origin bottom left), or the whole target */
  scissor(rect: { x: number; y: number; w: number; h: number } | null): void;
  render(): void;
  /** the rest pose's push into land i (0.15 of its near distance) */
  restPush(i: number): number;
  hooks(): Record<string, unknown>;
  dispose(): void;
}

export interface WorldOptions {
  renderer: WebGLRenderer;
  /** touch devices: 32,768 points and no bloom */
  touch: boolean;
  /** the still3d tier: no flight, no assembly, no roll; a cross-fade to land 1 */
  reduced: boolean;
  /** the canvas's pixel ratio (the points' sizes and their 24 x DPR cap) */
  dpr: number;
  /** the intro's lattice: the 512 px red-channel target (tTri), or null for none */
  tTri: Texture | null;
  /** garden.json's images, or null for the rings over Urban Slate */
  garden: GardenSpec | null;
  /** Tune's values at load (the rings are generated for its ringCount); the defaults otherwise */
  params?: WorldParams;
  seed?: number;
}

// ---------------------------------------------------------------- shaders

const LIN = /* glsl */`vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }`;

// the shards: thrown by the camera's distance to their ring (the falloff of W2), each on its own window of it, spun about
// their own axis, shrunk and pushed out along their centre and toward the camera; flat-lit by the garden's sun
const RING_VERT = /* glsl */`
  attribute vec3 aCentre; attribute vec4 aSpin, aFling; attribute vec2 aLat; attribute float aShade;
  uniform vec2 uAsm; uniform float uBreak;
  varying vec3 vN; varying vec2 vLat; varying float vShade;
  vec3 turn(vec3 v, vec3 k, float t) { return v * cos(t) + cross(k, v) * sin(t) + k * dot(k, v) * (1.0 - cos(t)); }
  void main() {
    float f = clamp((cameraPosition.z - aCentre.z - uAsm.x) / (uAsm.y - uAsm.x), 0.0, 1.0);
    float b = uBreak * smoothstep(0.4 * aFling.w, 0.6 + 0.4 * aFling.w, f), a = aSpin.w * b;
    vec3 p = aCentre + turn(position - aCentre, aSpin.xyz, a) * (1.0 - aFling.z * b);
    p.xy += normalize(aCentre.xy) * aFling.x * b; p.z += aFling.y * b;
    vN = turn(normal, aSpin.xyz, a); vLat = aLat; vShade = aShade;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const RING_FRAG = /* glsl */`
  uniform vec3 uShades[10], uSun; uniform sampler2D tTri; uniform float uTri;
  varying vec3 vN; varying vec2 vLat; varying float vShade;
  ${TO_SRGB} ${LIN}
  void main() {
    int j = int(vShade + 0.5);
    vec3 alb = mix(uShades[j], uShades[(j + 1) % 10], clamp(uTri * texture(tTri, vLat).r * 1.25, 0.0, 1.0));   // the lattice in the next family's shade
    vec3 n = normalize(gl_FrontFacing ? vN : -vN);
    float light = 0.52 + 0.5 * max(dot(n, uSun), 0.0) + 0.08 * max(n.y, 0.0);
    gl_FragColor = vec4(toSrgb(clamp(toLinear(alb) * light, 0.0, 1.0)), 1.0);
  }`;

// the forcefields: one quad a ring, the disc drawn in the fragment; its colour the arc behind it, by angle clockwise
// from the top as rings.ts cuts them; it comes up within 3 S and fades out over the last half S to the camera
const FF_VERT = /* glsl */`
  attribute vec2 aLocal; attribute float aRing; uniform float uS;
  varying vec2 vL; varying float vRing, vFade;
  void main() {
    float d = cameraPosition.z - position.z;
    vL = aLocal; vRing = aRing; vFade = smoothstep(0.02 * uS, 0.5 * uS, d) * (1.0 - smoothstep(2.0 * uS, 3.0 * uS, d));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const FF_FRAG = /* glsl */`
  uniform vec3 uShades[10]; uniform sampler2D tTri; uniform float uTri, uRad, uLat, uGain;
  varying vec2 vL; varying float vRing, vFade;
  float line(float x, float w) { float d = abs(fract(x + 0.5) - 0.5), aa = fwidth(x); return 1.0 - smoothstep(w * aa, (w + 1.0) * aa, d); }
  void main() {
    float r = length(vL);
    if (r > 1.0 || vFade <= 0.0) discard;
    float deg = mod(degrees(atan(vL.x, vL.y)) + 360.0, 360.0);
    vec3 c = uShades[int(mod(floor(deg / 36.0) - vRing + 20.0, 10.0))];
    float lat = uTri * texture(tTri, vL * uRad * uLat).r, conc = line(r * 7.0, 0.4), rad = line(deg / 12.0, 0.4) * step(0.22, r);
    float rim = smoothstep(0.15, 1.0, r); rim *= rim;
    float a = clamp((0.8 * lat + 0.3 * conc + 0.18 * rad) * rim + 0.35 * smoothstep(0.86, 0.98, r), 0.0, 1.0);
    gl_FragColor = vec4(c, a * (1.0 - smoothstep(0.97, 1.0, r)) * vFade * uGain);
  }`;

// the garden's images and the morph's picture: display values straight through
const PLATE_VERT = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const PLATE_FRAG = /* glsl */`uniform sampler2D tMap; uniform float uOpaque; varying vec2 vUv;
  void main() { vec4 c = texture(tMap, vUv); gl_FragColor = vec4(c.rgb, mix(c.a, 1.0, uOpaque)); }`;
const PIC_VERT = /* glsl */`varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const PIC_FRAG = /* glsl */`uniform sampler2D tPic; uniform vec2 uCover; uniform float uAlpha; varying vec2 vUv;
  void main() { gl_FragColor = vec4(texture(tPic, 0.5 + (vUv - 0.5) * uCover).rgb, uAlpha); }`;

// a land: a cols x rows grid of two triangles a cell from gl_VertexID alone, each vertex on the capture camera's ray
// through its uv at the depth of the disparity rule (d 1 at near, 0 at far: z = 1 / mix(1 / far, 1 / near, d))
const GRID_VERT = /* glsl */`
  uniform sampler2D tDepth; uniform vec2 uGrid; uniform vec4 uCap; uniform float uHasDepth;
  varying vec2 vUv;
  const vec2 CORNER[6] = vec2[6](vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, 1.0), vec2(1.0, 0.0), vec2(1.0, 1.0));
  void main() {
    int q = gl_VertexID / 6, cols = int(uGrid.x);
    vec2 uv = (vec2(float(q % cols), float(q / cols)) + CORNER[gl_VertexID - q * 6]) / uGrid;
    float d = uHasDepth > 0.5 ? textureLod(tDepth, uv, 0.0).r : 1.0, z = 1.0 / mix(1.0 / uCap.w, 1.0 / uCap.z, d);
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * vec4((uv * 2.0 - 1.0) * uCap.xy * z, -z, 1.0);
  }`;
const GRID_FRAG = /* glsl */`uniform sampler2D tPic; uniform float uAlpha; varying vec2 vUv;
  void main() { gl_FragColor = vec4(texture(tPic, vUv).rgb, uAlpha); }`;

// ---------------------------------------------------------------- the scene

/** a hex's own numbers as display values (the target is read as sRGB, so nothing is decoded) */
const display = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export function createWorld(o: WorldOptions): WorldScene {
  const { renderer } = o;
  const shades = new Float32Array(ROOM_BAYS.flatMap((b) => display(b.hex)));
  const CLEAR = new Color(...display(URBAN_SLATE));
  const sunEl = (35 * Math.PI) / 180, SUN = new Vector3(0, Math.sin(sunEl), Math.cos(sunEl));   // behind the camera (+z), 35 degrees up
  const lat = o.tTri ? 1 : 0;
  const tunnel = new Scene(), landScene = new Scene();
  const cam = new PerspectiveCamera(GLIDE.fov[0], 1, 0.05, 160), landCam = new PerspectiveCamera(50, 1, 0.01, 400);
  let post: OutputPass | null = null, postW = 0, postH = 0;   // the laptops' optional bloom, made on first use
  let rt: WebGLRenderTarget | null = null, W = 1, H = 1, wantW = 1, wantH = 1, warming = false;
  let started = false, ready = false, failed = false, usedBloom = false;

  // the rings: one mesh for all of them, regenerated when Tune's ringCount changes
  const ringU = { uShades: { value: shades }, uSun: { value: SUN }, tTri: { value: o.tTri }, uTri: { value: lat }, uAsm: { value: new Vector2(GLIDE.assemble[0] * S, GLIDE.assemble[1] * S) }, uBreak: { value: o.reduced ? 0 : 1 } };
  const ringMat = new ShaderMaterial({ uniforms: ringU, vertexShader: RING_VERT, fragmentShader: RING_FRAG });
  const ffU = { uShades: { value: shades }, tTri: { value: o.tTri }, uTri: { value: lat }, uRad: { value: GLIDE.forcefield[0] * S }, uLat: { value: RING.fieldLattice }, uGain: { value: 0.5 }, uS: { value: S } };
  const ffMat = new ShaderMaterial({ uniforms: ffU, vertexShader: FF_VERT, fragmentShader: FF_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending });
  let rings: Mesh | null = null, fields: Mesh | null = null, ringData: RingArrays | null = null, nRings = 0;
  function buildRings(n: number) {
    if (rings) { tunnel.remove(rings); rings.geometry.dispose(); }
    if (fields) { tunnel.remove(fields); fields.geometry.dispose(); }
    const zs = Array.from({ length: n }, (_, k) => ringZ(k));
    const r = (ringData = generateRings(o.seed ?? 20261020, zs, S));
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(r.position, 3)); g.setAttribute('normal', new Float32BufferAttribute(r.normal, 3));
    g.setAttribute('aCentre', new Float32BufferAttribute(r.centre, 3)); g.setAttribute('aSpin', new Float32BufferAttribute(r.spin, 4));
    g.setAttribute('aFling', new Float32BufferAttribute(r.fling, 4)); g.setAttribute('aLat', new Float32BufferAttribute(r.lattice, 2)); g.setAttribute('aShade', new Float32BufferAttribute(r.shade, 1));
    g.setIndex(r.index instanceof Uint32Array ? new Uint32BufferAttribute(r.index, 1) : new Uint16BufferAttribute(r.index, 1));
    rings = new Mesh(g, ringMat); rings.frustumCulled = false; tunnel.add(rings);
    // the forcefields: a quad a ring, 0.06 S ahead of it (toward the camera)
    const R = GLIDE.forcefield[0] * S, pos: number[] = [], loc: number[] = [], ring: number[] = [], idx: number[] = [];
    zs.forEach((z, k) => {
      const zf = z + GLIDE.forcefield[1] * S, b = k * 4;
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x * R, y * R, zf); loc.push(x, y); ring.push(k); }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const fg = new BufferGeometry();
    fg.setAttribute('position', new Float32BufferAttribute(pos, 3)); fg.setAttribute('aLocal', new Float32BufferAttribute(loc, 2)); fg.setAttribute('aRing', new Float32BufferAttribute(ring, 1)); fg.setIndex(idx);
    fields = new Mesh(fg, ffMat); fields.frustumCulled = false; fields.renderOrder = 100; tunnel.add(fields);
    nRings = n;
    place(n);
  }

  // the cloud, 2.5 S past the last ring, turning about its vertical axis
  const cloudHolder = new Group();
  const points: CloudPoints = createPoints({ shades, count: o.touch ? CLOUD.touchCount : CLOUD.count, dpr: o.dpr, radius: CLOUD.radius * S });
  cloudHolder.add(points.object); tunnel.add(cloudHolder);

  // the morph's picture under the points, filling the frame (cover-fit)
  const picU = { tPic: { value: null as Texture | null }, uCover: { value: new Vector2(1, 1) }, uAlpha: { value: 0 } };
  const picMesh = new Mesh(fsGeo, new ShaderMaterial({ uniforms: picU, vertexShader: PIC_VERT, fragmentShader: PIC_FRAG, transparent: true, depthTest: false, depthWrite: false }));
  picMesh.frustumCulled = false; picMesh.renderOrder = 200; picMesh.visible = false; tunnel.add(picMesh);

  // the garden: the plate and the cards, built once each image is in
  interface Card { mesh: Mesh; mat: ShaderMaterial; tex: DataTexture; spec: GardenImage }
  const garden: Card[] = [];
  let cloudOrder = 0;
  function gardenQuad(spec: GardenImage, tex: DataTexture, plate: boolean): Card {
    const mat = new ShaderMaterial({ uniforms: { tMap: { value: tex }, uOpaque: { value: plate ? 1 : 0 } }, vertexShader: PLATE_VERT, fragmentShader: PLATE_FRAG, transparent: !plate, depthWrite: false, blending: NormalBlending });
    const mesh = new Mesh(new PlaneGeometry(1, 1), mat); mesh.frustumCulled = false;
    tunnel.add(mesh);
    return { mesh, mat, tex, spec };
  }
  // the images and the cloud placed for n rings, the cards and the cloud drawn far to near (the cloud sits between the first two cards)
  function place(n: number) {
    const last = ringZ(n - 1), end = -(GLIDE.approach + n - 1 + GLIDE.exit) * S;
    cloudHolder.position.set(0, 0, last - GLIDE.cloudBeyond * S);
    const order: { obj: { renderOrder: number }; d: number }[] = [{ obj: points.object, d: GLIDE.cloudBeyond }];
    for (const c of garden) {
      const z = last - c.spec.distance * S, w = 2 * (end - z) * Math.tan(((c.spec.fov ?? GARDEN.fov) * Math.PI) / 360), img = c.tex.image as { width: number; height: number };
      c.mesh.position.set(0, 0, z); c.mesh.scale.set(w, (w * img.height) / img.width, 1);
      order.push({ obj: c.mesh, d: c.spec.distance });
    }
    order.sort((a, b) => b.d - a.d).forEach((e, i) => { e.obj.renderOrder = i; });
    cloudOrder = points.object.renderOrder;
  }

  // the lands: one grid material, its uniforms set per layer; the grid follows the depth map's size (two texels a cell)
  const lands = new Map<number, LandView>();
  const gridU = { tPic: { value: null as Texture | null }, tDepth: { value: null as Texture | null }, uGrid: { value: new Vector2(8, 8) }, uCap: { value: new Vector4(1, 1, 1, 10) }, uHasDepth: { value: 0 }, uAlpha: { value: 1 } };
  const gridMat = new ShaderMaterial({ uniforms: gridU, vertexShader: GRID_VERT, fragmentShader: GRID_FRAG, side: DoubleSide, transparent: true });
  const gridGeo = new BufferGeometry(); gridGeo.boundingSphere = new Sphere(new Vector3(), 1e4);
  const grid = new Mesh(gridGeo, gridMat); grid.frustumCulled = false; landScene.add(grid);
  /** set the grid and the land camera for land v at push (scene units along its view), cover-fit to the target */
  function aimLand(v: LandView, push: number, alpha: number, sway?: readonly [number, number]) {
    const a = W / H, ty = Math.tan((v.fov * Math.PI) / 360), tyS = a < v.aspect ? ty : (ty * v.aspect) / a;
    landCam.fov = (2 * Math.atan(tyS) * 180) / Math.PI; landCam.aspect = a; landCam.zoom = 1; landCam.updateProjectionMatrix();
    landCam.position.set(0, 0, -push); landCam.rotation.set(((sway?.[1] ?? 0) * Math.PI) / 180, ((sway?.[0] ?? 0) * Math.PI) / 180, 0);
    const img = v.depth?.image as { width?: number; height?: number } | undefined;
    const cols = img?.width ? Math.min(256, Math.max(16, Math.round(img.width / 2))) : 8, rows = img?.height ? Math.min(256, Math.max(16, Math.round(img.height / 2))) : 8;
    gridU.uGrid.value.set(cols, rows); gridGeo.setDrawRange(0, cols * rows * 6);
    gridU.tPic.value = v.picture; gridU.tDepth.value = v.depth; gridU.uHasDepth.value = v.depth ? 1 : 0;
    gridU.uCap.value.set(ty * v.aspect, ty, v.near, v.far); gridU.uAlpha.value = alpha;
    gridMat.transparent = alpha < 1; gridMat.depthWrite = true;
  }
  const streamEnd = (i: number, push: number): StreamEnd | null => { const v = lands.get(i); return v ? { texture: v.picture, aspect: v.aspect, depth: v.depth, fov: v.fov, near: v.near, far: v.far, push } : null; };

  // the frame's plan, set by entry, land or layers and drawn by render
  type Plan = { kind: 'tunnel'; cross: number } | { kind: 'layers'; list: readonly WorldLayer[] };
  let plan: Plan = { kind: 'tunnel', cross: 0 }, bloom = 0, curT = 0, curPhase: EntryFrame['phase'] = 'glide';
  let scissorRect: { x: number; y: number; w: number; h: number } | null = null;
  let tlKey = '', tl: EntryTimeline = entryTimeline(WORLD_DEFAULTS);
  const _cc = new Color();

  function alloc(w: number, h: number) {
    W = w; H = h;
    rt?.dispose();
    rt = new WebGLRenderTarget(W, H, { depthBuffer: true });
    cam.aspect = W / H; cam.zoom = Math.min(1, cam.aspect * GLIDE.portrait); cam.updateProjectionMatrix();
  }

  /** the tunnel camera and the scene at t on the glide (the still3d tier: the start pose, whole, level) */
  function glideTo(t: number) {
    const T = tl.glide[1] - tl.glide[0], u = o.reduced ? 0 : clamp01((t - tl.glide[0]) / T);
    cam.position.set(0, 0, tl.camZ[0] + (tl.camZ[1] - tl.camZ[0]) * GLIDE_EASE.at(u));
    cam.fov = GLIDE.fov[0] + (GLIDE.fov[1] - GLIDE.fov[0]) * (0.5 - 0.5 * Math.cos(Math.PI * u)); cam.updateProjectionMatrix();
    cam.rotation.set(0, 0, o.reduced ? 0 : (rollAt(t, tl) * Math.PI) / 180);
    cam.updateMatrixWorld();
    cloudHolder.rotation.y = o.reduced ? 0 : CLOUD.spin * t;
  }

  const api: WorldScene = {
    get started() { return started; }, get ready() { return ready; }, get failed() { return failed; },
    get out() { return usedBloom && post ? post.out : rt ? rt.texture : null; },
    async load() {
      if (started) return; started = true;
      try {
        buildRings(Math.round((o.params ?? WORLD_DEFAULTS).ringCount)); await frame();
        // the garden: each image decoded off the main thread, then uploaded a strip a frame
        if (o.garden) {
          const specs = [o.garden.plate, ...o.garden.cards];
          const bitmaps = specs.map((s) => decodeImage(s.url));
          for (let i = 0; i < specs.length; i++) {
            const up = stripUpload(renderer, await bitmaps[i], { mipmaps: specs[i].mipmaps ?? i > 0 });
            while (!up.step()) await frame();
            garden.push(gardenQuad(specs[i], up.texture, i === 0));
            await frame();
          }
          place(nRings);
        }
        // compile with an 8 px target bound and NoToneMapping (three keys each program on both), then a warm draw that
        // uploads the rings' buffers; a resize that lands meanwhile is kept for the end
        warming = true; alloc(8, 8);
        picMesh.visible = true;
        const tm = renderer.toneMapping; renderer.toneMapping = NoToneMapping;
        renderer.setRenderTarget(rt);
        const compiling = Promise.all([renderer.compileAsync(tunnel, cam), renderer.compileAsync(landScene, landCam)]);
        renderer.setRenderTarget(null); renderer.toneMapping = tm;
        await compiling;
        picMesh.visible = false;
        glideTo(0); ready = true; api.render(); await frame();
        warming = false; alloc(wantW, wantH);
      } catch (e) {
        failed = true;
        console.warn('section 4: the world did not load; the poster column stands in', e);
      }
    },
    resize(w, h) { wantW = Math.max(1, w); wantH = Math.max(1, h); if (!warming) alloc(wantW, wantH); },
    setLand(i, v) { if (v) lands.set(i, v); else lands.delete(i); },
    restPush(i) { return ENTRY.pushRest * (lands.get(i)?.near ?? 0); },
    entry(t, p) {
      curT = t;
      const key = `${p.travelMs}|${p.ringCount}|${p.morphMs}|${p.enterPushMs}|${p.travelRoll}`;
      if (key !== tlKey) { tlKey = key; tl = entryTimeline(p); }
      if (ready && Math.round(p.ringCount) !== nRings) buildRings(Math.round(p.ringCount));
      bloom = o.touch ? 0 : p.worldBloom;
      const land0 = lands.get(0);
      glideTo(t);
      picMesh.visible = false; points.alpha(1);
      if (o.reduced) {
        // still3d: the start pose held, then a cross-fade to land 1 at rest
        const t0 = REDUCED_ENTRY.dissolve + REDUCED_ENTRY.hold, a = land0 ? clamp01((t - t0) / REDUCED_ENTRY.fade) : 0, arrive = t0 + REDUCED_ENTRY.fade;
        points.cloud(); points.object.renderOrder = cloudOrder;
        if (a >= 1 && land0) { plan = { kind: 'layers', list: [{ kind: 'land', i: 0, push: api.restPush(0) }] }; bloom = 0; }
        else plan = { kind: 'tunnel', cross: a };
        curPhase = t >= arrive ? 'rest' : 'glide';
        return { phase: curPhase, done: t >= arrive, arrive, passes: [] };
      }
      const [m0, m1] = tl.morph, pushT = clamp01((t - m1) / Math.max(1e-3, tl.push[1] - tl.push[0]));
      if (!land0 || t < m0) {
        // the glide (and, with no first picture, the garden held at the end pose: that land's text stands on it)
        points.cloud(); points.object.renderOrder = cloudOrder; plan = { kind: 'tunnel', cross: 0 };
        curPhase = t < m0 ? 'glide' : t < tl.arrive ? 'push' : 'rest';
      } else if (t < m1) {
        // the morph: the cloud onto the picture, the picture fading in under the points over the last 0.6 s
        points.morph((t - m0) / (m1 - m0), { texture: land0.picture, aspect: land0.aspect }, W, H);
        picU.tPic.value = land0.picture; picU.uAlpha.value = clamp01((t - (m1 - ENTRY.picFade)) / ENTRY.picFade);
        const cv = coverScale(W / H, land0.aspect); picU.uCover.value.set(cv[0], cv[1]); picMesh.visible = picU.uAlpha.value > 0;
        points.object.renderOrder = 300;
        plan = { kind: 'tunnel', cross: 0 }; curPhase = 'morph';
      } else {
        // the push into the picture through its depth map; the landed points fade over its first 0.25 s
        const pa = 1 - clamp01((t - m1) / ENTRY.pointsFade);
        points.morph(1, { texture: land0.picture, aspect: land0.aspect }, W, H); points.alpha(pa);
        const list: WorldLayer[] = [{ kind: 'land', i: 0, push: api.restPush(0) * easeInOutCubic(pushT) }];
        plan = { kind: 'layers', list: pa > 0 ? [...list, { kind: 'points' }] : list };
        if (t >= tl.arrive) bloom = 0;
        curPhase = t < tl.arrive ? 'push' : 'rest';
      }
      return { phase: curPhase, done: t >= tl.arrive, arrive: tl.arrive, passes: tl.passes };
    },
    land(i) { plan = { kind: 'layers', list: [{ kind: 'land', i, push: api.restPush(i) }] }; bloom = 0; curPhase = 'rest'; },
    layers(list, b = 0) { plan = { kind: 'layers', list }; bloom = o.touch ? 0 : b; },
    scissor(r) { scissorRect = r; },
    render() {
      if (!rt || !ready) return;
      const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(), tm = renderer.toneMapping, ac = renderer.autoClear;
      renderer.toneMapping = NoToneMapping; renderer.autoClear = false;
      if (scissorRect) { rt.scissor.set(scissorRect.x, scissorRect.y, scissorRect.w, scissorRect.h); rt.scissorTest = true; } else rt.scissorTest = false;
      renderer.setRenderTarget(rt); renderer.setClearColor(CLEAR, 1); renderer.clear(true, true, false);
      if (plan.kind === 'tunnel') {
        if (points.object.parent !== cloudHolder) cloudHolder.add(points.object);
        if (plan.cross < 1) renderer.render(tunnel, cam);
        const v = lands.get(0);
        if (plan.cross > 0 && v) { renderer.clearDepth(); aimLand(v, api.restPush(0), plan.cross); renderer.render(landScene, landCam); }
      } else {
        for (const l of plan.list) {
          renderer.clearDepth();
          if (l.kind === 'garden') { if (points.object.parent !== cloudHolder) cloudHolder.add(points.object); glideTo(tl.arrive); points.cloud(); points.object.renderOrder = cloudOrder; points.alpha(1); renderer.render(tunnel, cam); continue; }
          if (l.kind === 'land') { const v = lands.get(l.i); if (!v) continue; aimLand(v, l.push, l.alpha ?? 1, l.sway); grid.visible = true; renderer.render(landScene, landCam); continue; }
          // points over the land: the morph's landed points as they stand, or option A's stream between two resident lands
          grid.visible = false;
          if (l.stream) { const st = l.stream, f = streamEnd(st.from, st.fromPush), to = streamEnd(st.to, st.toPush); if (!f || !to) { grid.visible = true; continue; } points.stream(st.p, f, to, W, H); points.alpha(l.alpha ?? 1); }
          landScene.add(points.object); renderer.render(landScene, landCam); grid.visible = true;
        }
        if (points.object.parent === landScene) cloudHolder.add(points.object);
      }
      usedBloom = bloom > 0 && !o.touch;
      if (usedBloom) {
        post ??= createOutputPass(renderer);
        if (postW !== W || postH !== H) { post.resize(W, H); postW = W; postH = H; }
        post.run(rt.texture, { boost: 1, corners: 1, bleach: 0, split: 0, noise: 0, bloom }, 0);
      }
      renderer.setRenderTarget(null); renderer.setClearColor(pc, pa); renderer.toneMapping = tm; renderer.autoClear = ac;
    },
    hooks() {
      const b = (z: number) => { const f = clamp01((cam.position.z - z - GLIDE.assemble[0] * S) / ((GLIDE.assemble[1] - GLIDE.assemble[0]) * S)); return +(o.reduced ? 0 : f).toFixed(3); };
      return {
        started, ready, failed, phase: curPhase, t: +curT.toFixed(3), plan: plan.kind,
        cam: { z: +cam.position.z.toFixed(3), fov: +cam.fov.toFixed(2), zoom: +cam.zoom.toFixed(3), roll: +((cam.rotation.z * 180) / Math.PI).toFixed(2) },
        rings: nRings, triangles: ringData?.triangles ?? [], shards: ringData?.shards ?? [], broken: tl.rings.map(b),
        points: points.count, garden: garden.length, lands: [...lands.keys()], passes: tl.passes.map((x) => +x.toFixed(3)), arrive: +tl.arrive.toFixed(3), size: [W, H],
      };
    },
    dispose() {
      rt?.dispose(); rt = null; post?.dispose();
      if (rings) rings.geometry.dispose();
      if (fields) fields.geometry.dispose();
      ringMat.dispose(); ffMat.dispose(); points.dispose(); (picMesh.material as ShaderMaterial).dispose();
      for (const c of garden) { c.mesh.geometry.dispose(); c.mat.dispose(); c.tex.dispose(); }
      garden.length = 0; gridMat.dispose(); gridGeo.dispose(); lands.clear(); ready = false;
    },
  };
  return api;
}
