// Section 4's world (docs/specs/section-4-world.md 2 "The ring travel", "The particle morph", "A land, at rest", 5 "The
// island", W1 to W4, W8, W12, AC3): the garden tunnel the bubble opens onto, its rings, the cloud at its far end, the
// morph onto the first land's picture and the push into it, and every land at rest. It replaces universe.ts.
// - The flight is level (W1) along -z, on igloo's own ease, cubic-bezier(0.6, 0, 0, 1) (evidence 4), from 0.71 S before
//   the first ring (igloo's approach pose: the ring fills about 116 percent of a laptop frame's height) to 0.5 S past the
//   last; the FOV opens 22 to 30 degrees (evidence 2) under the hero's portrait zoom, min(1, aspect x 1.5), raised only
//   where a frame would reach past the garden's plate (glideZoom: windows wider than about 2.2:1); the roll
//   rises to travelRoll before the first ring, is held through the passes and unwinds after the last, never faster than
//   30 degrees a second (W4). No flash at the rings (W4, WCAG 2.3.1).
// - The rings (rings.ts, W3) assemble on approach (W2): a ring's shards are thrown out beyond 1.4 S from the camera and
//   whole by 1.0 S, each on its own window of that falloff. Their shades blend into each other round the ring in OKLab
//   (blend.ts, W13: the outer 40 percent of each arc either side), read from one ramp texture at each vertex's arc
//   coordinate, and each shard's value sits within 6 percent of it. Their faces carry the intro's triangle lattice (tTri)
//   in the next family's shade, blended the same way. They are lit as glazed lacquer by garden.json's sun, the one the
//   garden was rendered under (the spec's, straight behind the camera at 35 degrees, when there is no garden): a sky-bright
//   ambient, the sun's diffuse, soft occlusion toward each seam (gone as the ring breaks apart), and the clear coat's
//   sheen, a Blinn-Phong highlight toward the sun on the rounded normals and a Fresnel reflection of the sky at grazing
//   angles, in white light. A forcefield disc fills each ring's hole, of radius 0.13 S and 0.06 S ahead of it: the
//   lattice with concentric and radial lines in the blended shade of the arc behind, brightest at the rim, faded out as
//   the camera passes through (additive, E-S4-glow).
// - The garden (E-S4-garden; scripts/room/garden.py renders it and writes garden.json, the director hands in the URLs it
//   picked): the far plate is drawn at infinity, its position locked to the camera's and its orientation fixed to the
//   world, so it rolls on screen with the camera and scales with the FOV; only the band of its rows a frame can reach is
//   uploaded (GARDEN.band, held by glideZoom). The three depth cards stand square to the axis on their own tangent bounds
//   as seen from the render pose, the glide's end, so the four line up there and slide against each other in flight.
//   Once land 1 has arrived the garden's textures are freed, since they serve only the entry and the failed-picture
//   fallback, and they are decoded again on demand (loadGarden). Without a garden the rings fly over Urban Slate; a
//   garden.json that does not give what gardenLayout reads fails the load, so the poster column stands in.
// - The cloud (cloud.ts, W8, W12) waits 2.5 S past the last ring and turns slowly, each point the ramp's blend of the two
//   shades nearest its longitude; at 75 percent of the glide's time (97 percent of its way) it morphs onto the first
//   land's picture filling the frame, the picture fading in under the points over the morph's last 0.6 s, then the points
//   fade over the push's first 0.25 s (their layer carries the fade, pushLayers).
// - A land is its picture on a displaced grid seen from its capture pose (positions from gl_VertexID, the depth fetched in
//   the vertex shader by the disparity rule), so at the capture pose it is the picture, cover-fit, pixel for pixel; the
//   push after the morph moves the camera 0.15 of the land's near distance into it, and that pose is the land's rest.
//   The grid reads a prepared copy of the depth map (depth.ts), made once a land: the near side carried over each real
//   edge so a silhouette moves rigidly, an uncovering step spread over the background beside it, an occluding one kept
//   sharp and cut at the picture's own contour with what lies behind drawn by a second, back pass. No cell stretches
//   across a step (no seam, no staircase), and each fragment takes the picture's pixel on the capture ray through it.
// - Option A's stream (stream.ts) is drawn here as a layer handed in by option A's travel module, which alone imports it.
// One 8-bit target with depth, display values written by hand (toSrgb) under NoToneMapping set and restored around the
// draw, as the hall's; no output pass, and on laptops at most the screened bloom with everything else of post.ts off,
// never on a land at rest. Loading runs one step a frame (spec 5 "Loading, in phases") and stops at once if the world is
// disposed meanwhile: the rings' generation, each garden image decoded with at most the next one decoding ahead and
// uploaded in row strips, one compile a frame with the target bound, the laptops' bloom when it is on, a warm draw.
// The test hooks ship only in hooks builds and Tune's guard only in Tune builds (both folded away in production).
import { AdditiveBlending, BufferGeometry, Color, DataTexture, DoubleSide, Float32BufferAttribute, Group, LessDepth, LessEqualDepth, LinearFilter, LinearMipmapLinearFilter, Mesh, NoColorSpace, NoToneMapping, NormalBlending, PerspectiveCamera, PlaneGeometry, RedFormat, RepeatWrapping, RGBAFormat, Scene, ShaderMaterial, Sphere, Uint16BufferAttribute, Uint32BufferAttribute, UnsignedByteType, Vector2, Vector3, Vector4, WebGLRenderTarget, type Object3D, type Texture, type WebGLRenderer } from 'three';
import { ROOM_BAYS } from '../../../config/room.ts';
import { URBAN_SLATE } from '../../../config/tokens.ts';
import { fsGeo } from '../section2/background.ts';
import { clamp01, easeInOutCubic } from '../util/math.ts';
import { TO_SRGB } from './assets.ts';
import { BLEND, display, ringRamp } from './blend.ts';
import { CLOUD, coverScale, createPoints, type CloudPoints } from './cloud.ts';
import { createDepthPrep } from './depth.ts';
import { createOutputPass, type OutputPass } from './post.ts';
import { RING, generateRings, type RingArrays } from './rings.ts';
import type { WorldStream } from './stream.ts';

// ---------------------------------------------------------------- the numbers (for config/room.ts at integration)

/** the ring spacing S in scene units (igloo's, evidence 3); the tunnel's other lengths are multiples of it */
export const S = 2.5;

/** the glide (spec 2 "The ring travel"; seconds after the press, lengths in S) */
export const GLIDE = Object.freeze({
  start: 0.35,                       // the bubble's first frame and the glide's
  approach: 0.71, exit: 0.5,         // S before the first ring, S past the last (garden.json's render pose)
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
/**
 * The garden's drawing (garden.json places the images): the plate's rows kept at upload, as the band's half height in
 * tangent units about the axis (at the 30-degree roll a 390 x 844 frame reaches 0.41 up, a 9:21 phone 0.44, a landscape
 * phone or a 21:9 window 0.47); the share of the plate's edge and band a frame may reach before glideZoom raises the
 * zoom (a hair inside, for the filtering at the edge: a landscape phone reaches 0.616 of the plate's 0.625 across); and
 * the distance the plate is drawn ahead of the camera (it is at infinity: only its direction matters, inside the far plane).
 */
export const GARDEN = Object.freeze({ band: 0.49, edge: 0.99, far: 100 });
/** the sun without a garden: behind the camera (+z), 35 degrees up (spec 3 "The garden") */
const SUN_BEHIND = [0, Math.sin((35 * Math.PI) / 180), Math.cos((35 * Math.PI) / 180)] as const;
/** the lands' clip planes, shared by the grid's camera and the stream's two (so their depths compare) */
export const LAND_CLIP = Object.freeze([0.01, 400] as const);

/** the entry's Tune values (to join ROOM_PARAMS at integration); the spec's defaults */
export const WORLD_DEFAULTS = Object.freeze({ bubbleMs: 2000, travelMs: 8000, ringCount: 3, travelRoll: 30, morphMs: 1800, enterPushMs: 1200, /** laptops: post.ts's screened bloom over the tunnel and the push (0 off; never on a land at rest) */ worldBloom: 0 });
export type WorldParams = { -readonly [K in keyof typeof WORLD_DEFAULTS]: number };
/**
 * Tune's ranges and steps, [min, max, step], for the "Section 4" group at integration: inside them every combination
 * passes the spec's rules as it stands (spec 2: every gap at least 0.4 s, the first pass after the bubble; W4's roll
 * rate), which tests/unit/room-world.test.ts walks step by step, so nothing is clamped live. Past them: a glide under
 * 8 s puts four rings' passes under 0.4 s apart or the first before a 2.19 s bubble clears, five rings fail at any
 * glide here, and a roll over 33 degrees cannot come up before the first of four rings at 30 degrees a second on the
 * shortest glide and morph. bubbleMs is the bubble's own
 * (transition.ts), narrowed from revision 2's 1200 to 3200 to what the first pass allows; spec 2 gives these ranges.
 */
export const WORLD_RANGES: Readonly<Record<keyof WorldParams, readonly [number, number, number]>> = /* @__PURE__ */ Object.freeze({ bubbleMs: [1200, 2190, 10], travelMs: [8000, 12000, 100], ringCount: [2, 4, 1], travelRoll: [0, 33, 1], morphMs: [1000, 3000, 100], enterPushMs: [600, 2000, 100], worldBloom: [0, 1, 0.05] });

/**
 * The scene's colours by id (AC3, read back by tests/unit/room-world.test.ts): the rings' arcs, their lattice (the next
 * family's), the forcefields' lines and the cloud are the ten key shades of ROOM_BAYS, each blending into its neighbours
 * in OKLab (blend.ts, E-S4-colour); the clear colour, seen only when the garden is withdrawn, is Urban Slate (E-S4-garden's
 * default). The garden and the pictures are image content. Marked pure, as WORLD_RANGES is, so a build that never reads
 * them (production) drops them.
 */
export const SCENE_COLOURS = /* @__PURE__ */ Object.freeze({
  rings: /* @__PURE__ */ ROOM_BAYS.map((b) => b.shade), lattice: /* @__PURE__ */ ROOM_BAYS.map((_, i) => ROOM_BAYS[(i + 1) % ROOM_BAYS.length].shade),
  forcefields: /* @__PURE__ */ ROOM_BAYS.map((b) => b.shade), cloud: /* @__PURE__ */ ROOM_BAYS.map((b) => b.shade), clear: ['urban-slate'],
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

/** the vertical FOV at t (degrees): 22 to 30 on a sine in-out of the glide's time, held at 30 after it */
export const fovAt = (t: number, tl: EntryTimeline): number => GLIDE.fov[0] + (GLIDE.fov[1] - GLIDE.fov[0]) * (0.5 - 0.5 * Math.cos(Math.PI * clamp01((t - tl.glide[0]) / (tl.glide[1] - tl.glide[0]))));

/**
 * The push's layers at t, from the morph's end: land 1 pushed in along its view on a cubic in-out, and over it the landed
 * points, their fade over the push's first 0.25 s carried by their layer (render sets each layer's alpha as it draws it).
 */
export function pushLayers(t: number, tl: EntryTimeline, rest: number): WorldLayer[] {
  const m1 = tl.morph[1], u = clamp01((t - m1) / Math.max(1e-3, tl.push[1] - tl.push[0])), alpha = 1 - clamp01((t - m1) / ENTRY.pointsFade);
  const land: WorldLayer = { kind: 'land', i: 0, push: rest * easeInOutCubic(u) };
  return alpha > 0 ? [land, { kind: 'points', alpha }] : [land];
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
 * Tune's guard (Tune builds only, applied by entry): its live values held inside WORLD_RANGES with ringCount whole, and a
 * warning should any combination still break a rule. It never drops a ring or shortens the bubble, so the scene is what
 * Tune shows; inside the ranges nothing breaks (the unit test proves it).
 */
export function clampEntry(p: WorldParams): WorldParams {
  const q = { ...p };
  for (const k of Object.keys(WORLD_RANGES) as (keyof WorldParams)[]) { const [a, b] = WORLD_RANGES[k]; q[k] = Math.min(b, Math.max(a, q[k])); }
  q.ringCount = Math.round(q.ringCount);
  const probs = entryProblems(q);
  if (probs.length) console.warn('section 4: these entry values break the spec', q, probs);
  return q;
}

/** the frame's reach in tangent units of the world's frame (the plate's), across and up: its half extents at a vertical FOV and zoom, turned by the roll */
export function frameReach(aspect: number, fovDeg: number, zoom: number, rollDeg: number): [number, number] {
  const ty = Math.tan((fovDeg * Math.PI) / 360) / zoom, tx = ty * aspect, r = (rollDeg * Math.PI) / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  return [tx * c + ty * s, tx * s + ty * c];
}

/**
 * The glide's zoom for a frame's aspect: the portrait zoom, min(1, aspect x 1.5), raised just enough that the frame
 * never reaches past `reach` (the plate's edge and band, less a hair) at any moment from the glide's start to the
 * picture's arrival, roll included: windows wider than about 2.2:1 (garden check 5), and frames taller than any phone's.
 * One zoom for the whole entry, so the lens never pumps; null reach (no garden), the portrait zoom.
 */
export function glideZoom(aspect: number, tl: EntryTimeline, reach: readonly [number, number] | null): number {
  const z = Math.min(1, aspect * GLIDE.portrait);
  if (!reach) return z;
  const t0 = tl.glide[0], t1 = Math.max(tl.glide[1], tl.morph[1]);
  let need = 0;
  for (let i = 0; i <= 256; i++) { const t = t0 + ((t1 - t0) * i) / 256, [x, y] = frameReach(aspect, fovAt(t, tl), 1, rollAt(t, tl)); need = Math.max(need, x / reach[0], y / reach[1]); }
  return Math.max(z, need * 1.002);   // the sampling's slack
}

// ---------------------------------------------------------------- the garden (pure: the unit test reads garden.json through it)

/** garden.json as world.ts reads it (scripts/room/garden.py and encode.mjs write it): the spacing, the render pose, the sun, the plate's field and each card's tangent bounds */
export interface GardenJson {
  S: number;
  camera: { pastLastRingS: number };
  sun: { direction: readonly number[] };
  plate: { width: number; height: number; fovDeg: number; /** [left, right, bottom, top] at unit distance; else centred on the axis from fovDeg (across) and the image's aspect */ tan?: readonly number[] };
  cards: readonly { id?: string; distance: number; tan: readonly number[] }[];
}
/** the garden as the director hands it in: garden.json and the URLs it picked (AVIF or WebP), the cards in garden.json's order */
export interface GardenSpec { json: GardenJson; plate: string; cards: readonly string[] }

export interface GardenLayout {
  /** the plate's band kept at upload, [first, end) as shares of its height counted from the bottom (it is decoded bottom row first); bandRows makes them rows of the decoded image, so a scaled encode keeps the same band */
  plateBand: readonly [number, number];
  /** the whole plate's tangent bounds [left, right, bottom, top] at unit distance */
  plateTan: readonly [number, number, number, number];
  /** how far a frame may reach across and up, in tangent units (the kept plate less GARDEN.edge's margin): glideZoom's bound */
  reach: readonly [number, number];
  /** each card's centre and size in scene units with the last ring at z 0, square to the axis at its distance from the render pose */
  cards: readonly { x: number; y: number; z: number; w: number; h: number }[];
  /** the unit direction toward the sun, island frame */
  sun: readonly [number, number, number];
}

/**
 * The garden placed from garden.json (the format scripts/room/garden.py writes): each card at (cx d, cy d, pose - d),
 * (r - l) d by (t - b) d, from its tangent bounds and distance; the plate's band; the sun. A file that does not give these
 * numbers throws here, rather than placing the camera and the plate at NaN.
 */
export function gardenLayout(g: GardenJson, band = GARDEN.band): GardenLayout {
  const hx = Math.tan((g.plate.fovDeg * Math.PI) / 360), hy = (hx * g.plate.height) / g.plate.width;
  const [l, r, b, t] = g.plate.tan ?? [-hx, hx, -hy, hy];
  const f0 = Math.max(0, (-band - b) / (t - b)), f1 = Math.min(1, (band - b) / (t - b)), tb = b + (t - b) * f0, tt = b + (t - b) * f1, pose = -g.camera.pastLastRingS * g.S;
  const cards = g.cards.map((c) => { const [cl, cr, cb, ct] = c.tan, d = c.distance; return { x: ((cl + cr) / 2) * d, y: ((cb + ct) / 2) * d, z: pose - d, w: (cr - cl) * d, h: (ct - cb) * d }; });
  const s = g.sun.direction, n = Math.hypot(s[0], s[1], s[2]);
  const out: GardenLayout = { plateBand: [f0, f1], plateTan: [l, r, b, t], reach: [Math.min(r, -l) * GARDEN.edge, Math.min(tt, -tb) * GARDEN.edge], cards, sun: [s[0] / n, s[1] / n, s[2] / n] };
  const sizes = [r - l, t - b, f1 - f0, ...out.reach, n, ...cards.flatMap((c) => [c.w, c.h])];
  if (![...sizes, ...out.plateTan, ...out.sun, ...cards.flatMap((c) => [c.x, c.y, c.z])].every(Number.isFinite) || sizes.some((x) => x <= 0)) throw new Error('section 4: garden.json does not give the plate, the cards and the sun as world.ts reads them');
  return out;
}

/** the plate's band in an image h rows tall (the decoded bitmap's own height): its rows [first, end), widened to whole rows, and the tangent bounds [bottom, top] those rows cover */
export function bandRows(g: GardenLayout, h: number): { rows: [number, number]; tan: [number, number] } {
  const [, , b, t] = g.plateTan, y0 = Math.max(0, Math.floor(g.plateBand[0] * h)), y1 = Math.min(h, Math.ceil(g.plateBand[1] * h));
  return { rows: [y0, y1], tan: [b + ((t - b) * y0) / h, b + ((t - b) * y1) / h] };
}

// ---------------------------------------------------------------- textures in strips (spec 5: one upload a frame)

/** an image fetched with the site's 20 s timeout and decoded off the main thread, bottom row first (uv 0 at the bottom, three's), untagged */
export async function decodeImage(url: string, signal?: AbortSignal): Promise<ImageBitmap> {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 20_000), stop = () => ac.abort();
  if (signal?.aborted) ac.abort();
  signal?.addEventListener('abort', stop, { once: true });
  try {
    const res = await fetch(url, { signal: ac.signal, credentials: 'same-origin' });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const bmp = await createImageBitmap(await res.blob(), { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    if (ac.signal.aborted) { bmp.close(); throw new Error(`${url}: aborted`); }
    return bmp;
  } finally { clearTimeout(t); signal?.removeEventListener('abort', stop); }
}

export interface StripUpload { readonly texture: DataTexture; readonly done: boolean; /** one step: the storage, then a strip of rows, then the mip chain; true once complete (the bitmap is closed then) */ step(): boolean }

/**
 * A texture uploaded from an ImageBitmap a strip of rows at a time (about 1 MB a step): three allocates the storage once
 * (texStorage2D, every level), each step copies the next rows with UNPACK_SKIP_ROWS through three's own state cache, and
 * the last generates the mip chain. Display values in and out (NoColorSpace); red takes the first channel (depth maps);
 * rows keeps only [first, end) of the bitmap's rows (the plate's band), the texture that many rows tall.
 */
export function stripUpload(renderer: WebGLRenderer, bmp: ImageBitmap, o: { red?: boolean; mipmaps?: boolean; rows?: readonly [number, number] } = {}): StripUpload {
  const w = bmp.width, [r0, r1] = o.rows ?? [0, bmp.height], h = r1 - r0, red = !!o.red, mips = !!o.mipmaps;
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
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, r0 + y);
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

/**
 * A land as the director hands it in (it loads and owns the textures: stripUpload makes them): the picture (untagged,
 * mipmapped, uv 0 at its bottom), its depth map or null (single channel, 1 near, 0 far), the picture's aspect (width
 * over height), its capture's vertical FOV in degrees, and the disparity rule's near and far distances.
 */
export interface LandView { picture: Texture; depth: Texture | null; aspect: number; fov: number; near: number; far: number }
/** a land as the grid draws it: depth the prepared copy (depth.ts: red the front depth, green the cut, blue the back depth), raw the source */
type GridView = LandView & { raw?: Texture | null };

/** a layer of a land frame, drawn in order over the one before (the depth cleared between) */
export type WorldLayer =
  | { kind: 'land'; i: number; /** scene units into the land along its view */ push: number; alpha?: number; /** degrees of yaw and pitch (option A's slight sway) */ sway?: readonly [number, number] }
  | { kind: 'points'; alpha?: number }   // the morph's landed points as they stand (the push's first 0.25 s)
  | { kind: 'stream'; /** option A's (stream.ts) */ stream: WorldStream; from: number; to: number; p: number; fromPush: number; toPush: number; fromSway?: readonly [number, number]; alpha?: number }
  | { kind: 'garden' }   // the tunnel at the glide's end pose (a failed picture's fallback; the garden is decoded again if it was freed)
  | { kind: 'draw'; /** an option's own scene (option B's park): drawn by the option into the bound target, display values, with its own camera framed for the target's w x h device px; opaque (a land layer over it fades) */ draw(renderer: WebGLRenderer, w: number, h: number): void };

export interface EntryFrame { phase: 'glide' | 'morph' | 'push' | 'rest'; done: boolean; arrive: number; passes: readonly number[] }

export interface WorldScene {
  readonly started: boolean;
  readonly ready: boolean;
  readonly failed: boolean;
  /** the frame: display values, alpha 1 (the bubble's inside, then the whole frame) */
  readonly out: Texture | null;
  /** the garden's textures are resident (they are freed once land 1 has arrived) */
  readonly gardenReady: boolean;
  /** rings, cloud and garden, uploaded and compiled one step a frame */
  load(): Promise<void>;
  /** the garden decoded and uploaded again after it was freed (a later lap's walk, before the press; one step a frame) */
  loadGarden(): Promise<void>;
  /** free the garden's textures (done by itself once land 1 has arrived) */
  releaseGarden(): void;
  /** one object compiled for the lands' scene with the target bound (option A's stream: one step, before its first travel) */
  warm(object: Object3D): Promise<void>;
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
  /** hooks builds only (PUBLIC_HERO_HOOKS): the state, the camera, the rings and the GPU memory held, colour plus depth */
  hooks?: () => Record<string, unknown>;
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
  /** garden.json and its images' URLs, or null for the rings over Urban Slate */
  garden: GardenSpec | null;
  /** Tune's values at load (the rings are generated for its ringCount, the bloom made if on); the defaults otherwise */
  params?: WorldParams;
  seed?: number;
}

/** the land camera for land v cover-fit on a frame of this aspect, pushed into it along its view and swayed (yaw and pitch, degrees): the grid's, and each end of the stream's */
export function landCamera(c: PerspectiveCamera, v: Pick<LandView, 'fov' | 'aspect'>, aspect: number, push: number, sway?: readonly [number, number]): PerspectiveCamera {
  const ty = Math.tan((v.fov * Math.PI) / 360), tyS = aspect < v.aspect ? ty : (ty * v.aspect) / aspect;
  c.fov = (2 * Math.atan(tyS) * 180) / Math.PI; c.aspect = aspect; c.zoom = 1; c.updateProjectionMatrix();
  c.position.set(0, 0, -push); c.rotation.set(((sway?.[1] ?? 0) * Math.PI) / 180, ((sway?.[0] ?? 0) * Math.PI) / 180, 0);
  c.updateMatrixWorld();
  return c;
}

// ---------------------------------------------------------------- shaders

const LIN = /* glsl */`vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }`;

// the shards: thrown by the camera's distance to their ring (the falloff of W2), each on its own window of it, spun about
// their own axis, shrunk and pushed out along their centre and toward the camera. Their colour is the ramp's at their arc
// coordinate (the shades blended round the ring, blend.ts) times their own value, the lattice the ramp's one arc on (the
// next family's); lit as glazed lacquer under the garden's sun: a fill from the garden's own light (hemi, tHemi: its sky
// and treetops above, its lawn below, at unit brightness and a quarter of their colour, tint) that never falls under
// 0.42, so a face turned from the sun reads as its shade darker, never grey; the sun's diffuse wrapped a quarter past
// the terminator; the seams' occlusion (half, over uSeam, fading as the shard is thrown); a sharp and a broad highlight
// toward the sun; and the clear coat's Fresnel reflection of the garden in the reflected direction, in its colours
// carried most of the way to the shade's own hue, so a grazing face keeps its colour
const RING_VERT = /* glsl */`
  attribute vec3 aCentre, aTone; attribute vec4 aSpin, aFling; attribute vec2 aLat;
  uniform vec2 uAsm; uniform float uBreak;
  varying vec3 vN, vW, vTone; varying vec2 vLat; varying float vB;
  vec3 turn(vec3 v, vec3 k, float t) { return v * cos(t) + cross(k, v) * sin(t) + k * dot(k, v) * (1.0 - cos(t)); }
  void main() {
    float f = clamp((cameraPosition.z - aCentre.z - uAsm.x) / (uAsm.y - uAsm.x), 0.0, 1.0);
    float b = uBreak * smoothstep(0.4 * aFling.w, 0.6 + 0.4 * aFling.w, f), a = aSpin.w * b;
    vec3 p = aCentre + turn(position - aCentre, aSpin.xyz, a) * (1.0 - aFling.z * b);
    p.xy += normalize(aCentre.xy) * aFling.x * b; p.z += aFling.y * b;
    vN = turn(normal, aSpin.xyz, a); vW = (modelMatrix * vec4(p, 1.0)).xyz; vLat = aLat; vTone = aTone; vB = b;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const RING_FRAG = /* glsl */`
  uniform sampler2D tRamp, tTri, tHemi; uniform vec3 uSun; uniform float uTri, uSeam;
  varying vec3 vN, vW, vTone; varying vec2 vLat; varying float vB;
  ${TO_SRGB} ${LIN}
  vec3 ramp(float a) { return texture(tRamp, vec2(a * 0.1, 0.5)).rgb; }
  vec3 hemi(float y) { return toLinear(mix(texture(tHemi, vec2(0.75, 0.5)).rgb, texture(tHemi, vec2(0.25, 0.5)).rgb, 0.5 + 0.5 * y)); }
  vec3 tint(vec3 c, float k) { return mix(vec3(1.0), c / max(0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b, 1e-3), k); }
  void main() {
    vec3 alb = toLinear(mix(ramp(vTone.x), ramp(vTone.x + 1.0), clamp(uTri * texture(tTri, vLat).r * 1.25, 0.0, 1.0)) * (1.0 + vTone.z));
    vec3 n = normalize(gl_FrontFacing ? vN : -vN), v = normalize(cameraPosition - vW), h = hemi(n.y);
    float nh = max(dot(n, normalize(uSun + v)), 0.0), fr = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
    float ao = 1.0 - 0.55 * (1.0 - vB) * (1.0 - smoothstep(0.0, uSeam, vTone.y));
    vec3 c = alb * (0.42 * tint(h, 0.25) + 0.62 * max(dot(n, uSun) + 0.25, 0.0) / 1.25) * ao;
    c += ao * (0.7 * pow(nh, 220.0) + 0.035 * pow(nh, 16.0) + 0.15 * fr * hemi(reflect(-v, n).y) * tint(alb, 0.6));
    gl_FragColor = vec4(toSrgb(clamp(c, 0.0, 1.0)), 1.0);
  }`;

// the garden's light (hemi): the plate's mean colour, averaged as light, above the horizon (texel 0) and below it
// (texel 1), skipping a sixth of each side next to the horizon; without a plate, uNone (Urban Slate) for both
const HEMI_FRAG = /* glsl */`
  uniform sampler2D tPlate; uniform float uHas, uHorizon; uniform vec3 uNone;
  ${TO_SRGB} ${LIN}
  void main() {
    if (uHas < 0.5) { gl_FragColor = vec4(uNone, 1.0); return; }
    vec2 band = gl_FragCoord.x < 1.0 ? vec2(uHorizon + (1.0 - uHorizon) / 6.0, 1.0) : vec2(0.0, uHorizon * 5.0 / 6.0);
    vec3 c = vec3(0.0);
    for (int j = 0; j < 8; j++) for (int i = 0; i < 12; i++) c += toLinear(textureLod(tPlate, vec2((float(i) + 0.5) / 12.0, mix(band.x, band.y, (float(j) + 0.5) / 8.0)), 0.0).rgb);
    gl_FragColor = vec4(toSrgb(c / 96.0), 1.0);
  }`;

// the forcefields: one quad a ring, the disc drawn in the fragment; its colour the ramp's at the arc behind it, by angle
// clockwise from the top as rings.ts cuts them, so its lines blend round the disc as the arcs do; it comes up within 3 S
// and fades out over the last half S to the camera
const FF_VERT = /* glsl */`
  attribute vec2 aLocal; attribute float aRing; uniform float uS;
  varying vec2 vL; varying float vRing, vFade;
  void main() {
    float d = cameraPosition.z - position.z;
    vL = aLocal; vRing = aRing; vFade = smoothstep(0.02 * uS, 0.5 * uS, d) * (1.0 - smoothstep(2.0 * uS, 3.0 * uS, d));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const FF_FRAG = /* glsl */`
  uniform sampler2D tRamp, tTri; uniform float uTri, uRad, uLat, uGain;
  varying vec2 vL; varying float vRing, vFade;
  float line(float x, float w) { float d = abs(fract(x + 0.5) - 0.5), aa = fwidth(x); return 1.0 - smoothstep(w * aa, (w + 1.0) * aa, d); }
  void main() {
    float r = length(vL);
    if (r > 1.0 || vFade <= 0.0) discard;
    float deg = mod(degrees(atan(vL.x, vL.y)) + 360.0, 360.0);
    vec3 c = texture(tRamp, vec2((deg / 36.0 - vRing) * 0.1, 0.5)).rgb;
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
// through its uv at the depth of the disparity rule (d 1 at near, 0 at far: z = 1 / mix(1 / far, 1 / near, d)), each
// fragment the picture's pixel on the capture camera's ray through its own point (so the capture pose shows the picture
// pixel for pixel, whatever the cells' depths). The depth is the prepared copy's (depth.ts): the front pass at its red
// (the near side carried over each real edge, an uncovering step spread toward the centre), dropping a fragment drawn
// above an occluding edge's cut (green) whose own pixel's source depth, filtered over about a texel, lies below it (the
// margin's sliver of what is behind); then the back pass at its blue (the far side's own depth there), drawn only where
// nothing as near was, so what lies behind the silhouette shows where the front pass cut
const GRID_VERT = /* glsl */`
  uniform sampler2D tDepth; uniform vec2 uGrid; uniform vec4 uCap; uniform float uHasDepth, uBack;
  varying vec3 vP; varying float vD;
  const vec2 CORNER[6] = vec2[6](vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, 1.0), vec2(1.0, 0.0), vec2(1.0, 1.0));
  void main() {
    int q = gl_VertexID / 6, cols = int(uGrid.x);
    vec2 uv = (vec2(float(q % cols), float(q / cols)) + CORNER[gl_VertexID - q * 6]) / uGrid;
    vec3 t = textureLod(tDepth, uv, 0.0).rgb;
    float d = uHasDepth > 0.5 ? (uBack > 0.5 ? t.b : t.r) : 1.0, z = 1.0 / mix(1.0 / uCap.w, 1.0 / uCap.z, d);
    vP = vec3((uv * 2.0 - 1.0) * uCap.xy * z, -z); vD = d;
    gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.0);
  }`;
const GRID_FRAG = /* glsl */`uniform sampler2D tPic, tDepth, tRaw; uniform vec4 uCap; uniform float uAlpha, uHasDepth, uBack; varying vec3 vP; varying float vD;
  void main() {
    vec2 uv = 0.5 + 0.5 * vP.xy / (-vP.z * uCap.xy);
    float cut = uHasDepth > 0.5 && uBack < 0.5 ? texture(tDepth, uv).g : 0.0;
    vec2 e = 0.75 / vec2(textureSize(tRaw, 0));
    float raw = 0.25 * (texture(tRaw, uv + e).r + texture(tRaw, uv - e).r + texture(tRaw, uv + vec2(e.x, -e.y)).r + texture(tRaw, uv - vec2(e.x, -e.y)).r);
    if (vD > cut && raw < cut) discard;
    gl_FragColor = vec4(texture(tPic, uv).rgb, uAlpha);
  }`;

// ---------------------------------------------------------------- the scene

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
/** thrown at the next await once dispose has run (its abort ends a fetch in flight too): the load stops there and allocates nothing more */
const GONE = new Error('section 4: the world was disposed');

export function createWorld(o: WorldOptions): WorldScene {
  const { renderer } = o;
  const par = () => o.params ?? WORLD_DEFAULTS;
  // the ten key shades blended round the ring (blend.ts), display values (the target is read as sRGB, so nothing is
  // decoded); ten arcs, repeating, read at an arc coordinate by the rings, the forcefields and the cloud
  const ramp = new DataTexture(ringRamp(ROOM_BAYS.map((b) => b.hex)), 10 * BLEND.perArc, 1, RGBAFormat, UnsignedByteType);
  ramp.colorSpace = NoColorSpace; ramp.wrapS = RepeatWrapping; ramp.minFilter = ramp.magFilter = LinearFilter; ramp.needsUpdate = true;
  const CLEAR = new Color(...display(URBAN_SLATE));
  let L: GardenLayout | null = null, gardenError: unknown = null;
  if (o.garden) try { L = gardenLayout(o.garden.json); } catch (e) { gardenError = e; }   // load() fails on it: the poster column stands in
  const SUN = new Vector3(...(L?.sun ?? SUN_BEHIND));
  const lat = o.tTri ? 1 : 0;
  const tunnel = new Scene(), landScene = new Scene();
  const cam = new PerspectiveCamera(GLIDE.fov[0], 1, 0.05, 160), landCam = new PerspectiveCamera(50, 1, LAND_CLIP[0], LAND_CLIP[1]);
  let post: OutputPass | null = null, postW = 0, postH = 0;   // the laptops' optional bloom, made in load() when it is on
  let rt: WebGLRenderTarget | null = null, W = 1, H = 1, wantW = 1, wantH = 1, warming = false;
  let started = false, ready = false, failed = false, usedBloom = false, disposed = false, loading: Promise<void> | null = null;
  const ac = new AbortController();
  const alive = () => { if (disposed) throw GONE; };

  // the rings: one mesh for all of them, regenerated when Tune's ringCount changes
  // the garden's light (HEMI_FRAG), made again whenever the plate is uploaded, before the next frame binds its target
  const hemi = new WebGLRenderTarget(2, 1, { depthBuffer: false }), hemiScene = new Scene();
  const hemiU = { tPlate: { value: null as Texture | null }, uHas: { value: 0 }, uHorizon: { value: 0.5 }, uNone: { value: new Vector3(...display(URBAN_SLATE)) } };
  const hemiMesh = new Mesh(fsGeo, new ShaderMaterial({ uniforms: hemiU, vertexShader: PIC_VERT, fragmentShader: HEMI_FRAG, depthTest: false, depthWrite: false, toneMapped: false }));
  hemiMesh.frustumCulled = false; hemiScene.add(hemiMesh); hemi.texture.colorSpace = NoColorSpace;
  let hemiDirty = true;
  const ringU = { tRamp: { value: ramp }, tHemi: { value: hemi.texture }, uSun: { value: SUN }, uSeam: { value: RING.seamAo * S }, tTri: { value: o.tTri }, uTri: { value: lat }, uAsm: { value: new Vector2(GLIDE.assemble[0] * S, GLIDE.assemble[1] * S) }, uBreak: { value: o.reduced ? 0 : 1 } };
  const ringMat = new ShaderMaterial({ uniforms: ringU, vertexShader: RING_VERT, fragmentShader: RING_FRAG });
  const ffU = { tRamp: { value: ramp }, tTri: { value: o.tTri }, uTri: { value: lat }, uRad: { value: GLIDE.forcefield[0] * S }, uLat: { value: RING.fieldLattice }, uGain: { value: 0.5 }, uS: { value: S } };
  const ffMat = new ShaderMaterial({ uniforms: ffU, vertexShader: FF_VERT, fragmentShader: FF_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const rings = new Mesh(new BufferGeometry(), ringMat), fields = new Mesh(new BufferGeometry(), ffMat);
  rings.frustumCulled = false; fields.frustumCulled = false; fields.renderOrder = 100; tunnel.add(rings, fields);
  let ringData: RingArrays | null = null, nRings = 0;
  function buildRings(n: number) {
    rings.geometry.dispose(); fields.geometry.dispose();
    const zs = Array.from({ length: n }, (_, k) => ringZ(k));
    const r = (ringData = generateRings(o.seed ?? 20261020, zs, S));
    const g = (rings.geometry = new BufferGeometry());
    g.setAttribute('position', new Float32BufferAttribute(r.position, 3)); g.setAttribute('normal', new Float32BufferAttribute(r.normal, 3));
    g.setAttribute('aCentre', new Float32BufferAttribute(r.centre, 3)); g.setAttribute('aSpin', new Float32BufferAttribute(r.spin, 4));
    g.setAttribute('aFling', new Float32BufferAttribute(r.fling, 4)); g.setAttribute('aLat', new Float32BufferAttribute(r.lattice, 2)); g.setAttribute('aTone', new Float32BufferAttribute(r.tone, 3));
    g.setIndex(r.index instanceof Uint32Array ? new Uint32BufferAttribute(r.index, 1) : new Uint16BufferAttribute(r.index, 1));
    // the forcefields: a quad a ring, 0.06 S ahead of it (toward the camera)
    const R = GLIDE.forcefield[0] * S, pos: number[] = [], loc: number[] = [], ring: number[] = [], idx: number[] = [];
    zs.forEach((z, k) => {
      const zf = z + GLIDE.forcefield[1] * S, b = k * 4;
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x * R, y * R, zf); loc.push(x, y); ring.push(k); }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const fg = (fields.geometry = new BufferGeometry());
    fg.setAttribute('position', new Float32BufferAttribute(pos, 3)); fg.setAttribute('aLocal', new Float32BufferAttribute(loc, 2)); fg.setAttribute('aRing', new Float32BufferAttribute(ring, 1)); fg.setIndex(idx);
    nRings = n;
    place(n);
  }

  // the cloud, 2.5 S past the last ring, turning about its vertical axis
  const cloudHolder = new Group();
  const points: CloudPoints = createPoints({ ramp, count: o.touch ? CLOUD.touchCount : CLOUD.count, dpr: o.dpr, radius: CLOUD.radius * S });
  cloudHolder.add(points.object); tunnel.add(cloudHolder);

  // the morph's picture under the points, filling the frame (cover-fit)
  const picU = { tPic: { value: null as Texture | null }, uCover: { value: new Vector2(1, 1) }, uAlpha: { value: 0 } };
  const picMesh = new Mesh(fsGeo, new ShaderMaterial({ uniforms: picU, vertexShader: PIC_VERT, fragmentShader: PIC_FRAG, transparent: true, depthTest: false, depthWrite: false }));
  picMesh.frustumCulled = false; picMesh.renderOrder = 200; picMesh.visible = false; tunnel.add(picMesh);

  // the garden: the plate (drawn first, at infinity) then garden.json's cards, each a unit quad shown once its texture is in
  interface Card { mesh: Mesh; mat: ShaderMaterial; tex: DataTexture | null }
  const unit = new PlaneGeometry(1, 1), cards: Card[] = [];
  const gardenQuad = (plate: boolean): Card => {
    const mat = new ShaderMaterial({ uniforms: { tMap: { value: null as Texture | null }, uOpaque: { value: plate ? 1 : 0 } }, vertexShader: PLATE_VERT, fragmentShader: PLATE_FRAG, transparent: !plate, depthTest: !plate, depthWrite: false, blending: NormalBlending });
    const mesh = new Mesh(unit, mat); mesh.frustumCulled = false; mesh.visible = false; tunnel.add(mesh);
    return { mesh, mat, tex: null };
  };
  const plateAt: [number, number] = [0, 0];
  if (L) { const plate = gardenQuad(true); plate.mesh.renderOrder = -1; cards.push(plate, ...L.cards.map(() => gardenQuad(false))); }
  /** the plate's quad over the tangent bounds of the rows its texture kept, at GARDEN.far; glideTo keeps it at the camera */
  const placePlate = (tb: number, tt: number) => { const [l, r] = L!.plateTan; cards[0].mesh.scale.set((r - l) * GARDEN.far, (tt - tb) * GARDEN.far, 1); plateAt[0] = (l + r) / 2; plateAt[1] = (tb + tt) / 2; hemiU.uHorizon.value = clamp01(-tb / (tt - tb)); };
  let cloudOrder = 0;
  // the cards and the cloud placed for n rings and drawn far to near (the cloud sits between the first two cards)
  function place(n: number) {
    const last = ringZ(n - 1);
    cloudHolder.position.set(0, 0, last - GLIDE.cloudBeyond * S);
    const order: { obj: Object3D; z: number }[] = [{ obj: points.object, z: cloudHolder.position.z }];
    L?.cards.forEach((c, k) => { const m = cards[k + 1].mesh; m.position.set(c.x, c.y, last + c.z); m.scale.set(c.w, c.h, 1); order.push({ obj: m, z: last + c.z }); });
    order.sort((a, b) => a.z - b.z).forEach((e, i) => { e.obj.renderOrder = i; });
    cloudOrder = points.object.renderOrder;
  }
  let gardenJob: Promise<void> | null = null;
  const gardenIn = () => cards.length > 0 && cards.every((c) => c.tex);
  /** the garden's images decoded and uploaded, one step a frame, at most the next image decoding meanwhile */
  function loadGarden(): Promise<void> {
    if (!o.garden || !L || gardenIn()) return Promise.resolve();
    if (gardenJob) return gardenJob;
    const urls = [o.garden.plate, ...o.garden.cards];
    const decode = (i: number) => { const d = decodeImage(urls[i], ac.signal); d.catch(() => {}); return d; };
    return (gardenJob = (async () => {
      let next: Promise<ImageBitmap> | null = decode(0), bmp: ImageBitmap | null = null, up: StripUpload | null = null;
      try {
        for (let i = 0; i < urls.length; i++) {
          bmp = await next!; next = null; alive();
          if (i + 1 < urls.length) next = decode(i + 1);
          const band = i === 0 ? bandRows(L, bmp.height) : null;   // the plate: the band's rows of the image as decoded
          up = stripUpload(renderer, bmp, band ? { rows: band.rows } : { mipmaps: true });
          while (!up.step()) { await frame(); alive(); }
          if (band) placePlate(...band.tan);
          const c = cards[i]; c.tex?.dispose(); c.tex = up.texture; c.mat.uniforms.tMap.value = up.texture; c.mesh.visible = true;
          if (i === 0) { hemiU.tPlate.value = up.texture; hemiU.uHas.value = 1; hemiDirty = true; }
          up = null; bmp = null;
          await frame(); alive();
        }
      } catch (e) { up?.texture.dispose(); throw e; }
      finally { bmp?.close(); void next?.then((b) => b.close(), () => {}); gardenJob = null; }
    })());
  }
  function releaseGarden() {
    if (gardenJob) return;   // a load in flight finishes first; the next arrival frees it
    for (const c of cards) { c.tex?.dispose(); c.tex = null; c.mat.uniforms.tMap.value = null; c.mesh.visible = false; }
  }
  const askGarden = () => { if (L && !gardenIn() && !gardenJob && ready) loadGarden().catch((e) => { if (!disposed) console.warn('section 4: the garden did not load again', e); }); };

  // the lands: one grid material, its uniforms set per layer; the grid follows the depth map's size (two texels a cell).
  // Always transparent and single-pass, so one program serves every alpha (three keys an opaque material apart).
  // Each land's depth map is drawn through its prepared copy (depth.ts), made on its first frame and kept with it; the
  // grid and option A's stream both read its front depth, so the stream's points land where the grid draws.
  const lands = new Map<number, LandView>(), depthPrep = createDepthPrep(renderer);
  const prepared = new Map<number, { base: LandView; rt: WebGLRenderTarget; view: GridView }>();
  const forget = (i: number) => { prepared.get(i)?.rt.dispose(); prepared.delete(i); };
  /** land i's view with its prepared depth, made the first time it is asked for (render asks before it binds its target) */
  function landView(i: number): GridView | undefined {
    const v = lands.get(i), p = prepared.get(i);
    if (!v?.depth) return v;
    if (p?.base === v) return p.view;
    if (p?.base.depth === v.depth) { p.base = v; p.view = { ...v, depth: p.rt.texture, raw: v.depth }; return p.view; }
    forget(i);
    const img = v.depth.image as { width: number; height: number }, rt = depthPrep.run(v.depth, img.width, img.height, cam);
    prepared.set(i, { base: v, rt, view: { ...v, depth: rt.texture, raw: v.depth } });
    return prepared.get(i)!.view;
  }
  const gridU = { tPic: { value: null as Texture | null }, tDepth: { value: null as Texture | null }, tRaw: { value: null as Texture | null }, uGrid: { value: new Vector2(8, 8) }, uCap: { value: new Vector4(1, 1, 1, 10) }, uHasDepth: { value: 0 }, uBack: { value: 0 }, uAlpha: { value: 1 } };
  const gridMat = new ShaderMaterial({ uniforms: gridU, vertexShader: GRID_VERT, fragmentShader: GRID_FRAG, side: DoubleSide, transparent: true, forceSinglePass: true });
  const gridGeo = new BufferGeometry(); gridGeo.boundingSphere = new Sphere(new Vector3(), 1e4);
  const grid = new Mesh(gridGeo, gridMat); grid.frustumCulled = false; landScene.add(grid);
  /** land v drawn at push (scene units along its view), cover-fit to the target: the front pass, then (with a depth map) the back */
  function drawLand(v: GridView, push: number, alpha: number, sway?: readonly [number, number]) {
    aimLand(v, push, alpha, sway);
    gridU.uBack.value = 0; gridMat.depthFunc = LessEqualDepth; renderer.render(landScene, landCam);
    if (gridU.uHasDepth.value) { gridU.uBack.value = 1; gridMat.depthFunc = LessDepth; renderer.render(landScene, landCam); gridU.uBack.value = 0; gridMat.depthFunc = LessEqualDepth; }
  }
  /** set the grid and the land camera for land v at push (scene units along its view), cover-fit to the target */
  function aimLand(v: GridView, push: number, alpha: number, sway?: readonly [number, number]) {
    landCamera(landCam, v, W / H, push, sway);
    const img = v.depth?.image as { width?: number; height?: number } | undefined, ty = Math.tan((v.fov * Math.PI) / 360);
    const cols = img?.width ? Math.min(256, Math.max(16, Math.round(img.width / 2))) : 8, rows = img?.height ? Math.min(256, Math.max(16, Math.round(img.height / 2))) : 8;
    gridU.uGrid.value.set(cols, rows); gridGeo.setDrawRange(0, cols * rows * 6);
    gridU.tPic.value = v.picture; gridU.tDepth.value = v.depth; gridU.tRaw.value = v.raw ?? null; gridU.uHasDepth.value = v.depth && v.raw ? 1 : 0;
    gridU.uCap.value.set(ty * v.aspect, ty, v.near, v.far); gridU.uAlpha.value = alpha;
  }

  // the frame's plan, set by entry, land or layers and drawn by render
  type Plan = { kind: 'tunnel'; cross: number } | { kind: 'layers'; list: readonly WorldLayer[] };
  let plan: Plan = { kind: 'tunnel', cross: 0 }, bloom = 0, curT = 0, curPhase: EntryFrame['phase'] = 'glide';
  let scissorRect: { x: number; y: number; w: number; h: number } | null = null;
  let tlKey = '', tl: EntryTimeline = entryTimeline(WORLD_DEFAULTS), zoomKey = '';
  let guardKey = '', guarded: WorldParams = WORLD_DEFAULTS;
  const _cc = new Color();

  function alloc(w: number, h: number) {
    W = w; H = h;
    rt?.dispose();
    rt = new WebGLRenderTarget(W, H, { depthBuffer: true });
    cam.aspect = W / H;
  }

  /** the tunnel camera and the scene at t on the glide (the still3d tier: the start pose, whole, level); the plate follows the camera */
  function glideTo(t: number) {
    const u = o.reduced ? 0 : clamp01((t - tl.glide[0]) / (tl.glide[1] - tl.glide[0])), zk = `${W}x${H}|${tlKey}`;
    if (zk !== zoomKey) { zoomKey = zk; cam.zoom = glideZoom(W / H, tl, L?.reach ?? null); }
    cam.position.set(0, 0, tl.camZ[0] + (tl.camZ[1] - tl.camZ[0]) * GLIDE_EASE.at(u));
    cam.fov = fovAt(o.reduced ? 0 : t, tl); cam.updateProjectionMatrix();
    cam.rotation.set(0, 0, o.reduced ? 0 : (rollAt(t, tl) * Math.PI) / 180);
    cam.updateMatrixWorld();
    cards[0]?.mesh.position.set(cam.position.x + plateAt[0] * GARDEN.far, cam.position.y + plateAt[1] * GARDEN.far, cam.position.z - GARDEN.far);
    cloudHolder.rotation.y = o.reduced ? 0 : CLOUD.spin * t;
  }

  /** one object's program, compiled with the target bound under NoToneMapping (three keys each program on both) */
  async function compile(obj: Object3D, c: PerspectiveCamera, sc: Scene) {
    const tm = renderer.toneMapping; renderer.toneMapping = NoToneMapping; renderer.setRenderTarget(rt);
    const done = renderer.compileAsync(obj, c, sc);
    renderer.setRenderTarget(null); renderer.toneMapping = tm;
    await done;
  }
  const bloomLook = (b: number) => ({ boost: 1, corners: 1, bleach: 0, split: 0, noise: 0, bloom: b });

  const api: WorldScene = {
    get started() { return started; }, get ready() { return ready; }, get failed() { return failed; },
    get out() { return usedBloom && post ? post.out : rt ? rt.texture : null; },
    get gardenReady() { return gardenIn(); },
    load() {
      return (loading ??= (async () => {
        started = true;
        try {
          if (gardenError) throw gardenError;
          buildRings(Math.round(par().ringCount)); await frame(); alive();
          await loadGarden();
          // one program a frame, with an 8 px target bound; the cards share one program, the points one across both scenes
          warming = true; alloc(8, 8);
          const steps: [Object3D, PerspectiveCamera, Scene][] = [[rings, cam, tunnel], [fields, cam, tunnel], [points.object, cam, tunnel], [picMesh, cam, tunnel], [grid, landCam, landScene], ...depthPrep.steps.map((s): [Object3D, PerspectiveCamera, Scene] => [s.mesh, cam, s.scene]), [hemiMesh, cam, hemiScene]];
          if (cards.length > 1) steps.push([cards[0].mesh, cam, tunnel], [cards[1].mesh, cam, tunnel]);
          for (const [obj, c, sc] of steps) { await compile(obj, c, sc); await frame(); alive(); }
          // the laptops' bloom, when it is on at load, compiled by a first run (Tune turning it on later compiles it then)
          if (!o.touch && par().worldBloom > 0) { post = createOutputPass(renderer); post.resize(8, 8); postW = postH = 8; post.run(rt!.texture, bloomLook(par().worldBloom), 0); await frame(); alive(); }
          glideTo(0); ready = true; api.render(); await frame(); alive();
          warming = false; alloc(wantW, wantH);
        } catch (e) {
          ready = false;
          if (!disposed) { failed = true; console.warn('section 4: the world did not load; the poster column stands in', e); }   // a dispose's abort is no failure
        }
      })());
    },
    loadGarden,
    releaseGarden,
    async warm(obj) { if (rt && !disposed) await compile(obj, landCam, landScene); },
    resize(w, h) { wantW = Math.max(1, w); wantH = Math.max(1, h); if (!warming && !disposed) alloc(wantW, wantH); },
    setLand(i, v) { if (v) lands.set(i, v); else { lands.delete(i); forget(i); } },
    restPush(i) { return ENTRY.pushRest * (lands.get(i)?.near ?? 0); },
    entry(t, params) {
      let p = params;
      if (import.meta.env.PUBLIC_TUNE === '1') { const k = Object.values(p).join('|'); if (k !== guardKey) { guardKey = k; guarded = clampEntry(p); } p = guarded; }
      curT = t;
      const key = `${p.travelMs}|${p.ringCount}|${p.morphMs}|${p.enterPushMs}|${p.travelRoll}`;
      if (key !== tlKey) { tlKey = key; tl = entryTimeline(p); }
      if (ready && Math.round(p.ringCount) !== nRings) buildRings(Math.round(p.ringCount));
      if (t < (o.reduced ? REDUCED_ENTRY.dissolve : tl.morph[0])) askGarden();   // a later lap's entry, should the director not have reloaded it
      bloom = o.touch ? 0 : p.worldBloom;
      const land0 = lands.get(0);
      glideTo(t);
      picMesh.visible = false; points.alpha(1);
      if (o.reduced) {
        // still3d: the start pose held, then a cross-fade to land 1 at rest
        const t0 = REDUCED_ENTRY.dissolve + REDUCED_ENTRY.hold, a = land0 ? clamp01((t - t0) / REDUCED_ENTRY.fade) : 0, arrive = t0 + REDUCED_ENTRY.fade;
        points.cloud(); points.object.renderOrder = cloudOrder;
        if (a >= 1 && land0) { plan = { kind: 'layers', list: [{ kind: 'land', i: 0, push: api.restPush(0) }] }; bloom = 0; releaseGarden(); }
        else plan = { kind: 'tunnel', cross: a };
        curPhase = t >= arrive ? 'rest' : 'glide';
        return { phase: curPhase, done: t >= arrive, arrive, passes: [] };
      }
      const [m0, m1] = tl.morph;
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
        // the push into the picture through its depth map; the landed points fade over its first 0.25 s, the fade on their layer
        points.morph(1, { texture: land0.picture, aspect: land0.aspect }, W, H);
        plan = { kind: 'layers', list: pushLayers(t, tl, api.restPush(0)) };
        if (t >= tl.arrive) { bloom = 0; releaseGarden(); }
        curPhase = t < tl.arrive ? 'push' : 'rest';
      }
      return { phase: curPhase, done: t >= tl.arrive, arrive: tl.arrive, passes: tl.passes };
    },
    land(i) { plan = { kind: 'layers', list: [{ kind: 'land', i, push: api.restPush(i) }] }; bloom = 0; curPhase = 'rest'; releaseGarden(); },
    layers(list, b = 0) { plan = { kind: 'layers', list }; bloom = o.touch ? 0 : b; if (list.some((l) => l.kind === 'garden')) askGarden(); },
    scissor(r) { scissorRect = r; },
    render() {
      if (!rt || !ready) return;
      for (const i of lands.keys()) landView(i);   // a new land's prepared depth, made before the target is bound
      if (hemiDirty) { hemiDirty = false; renderer.setRenderTarget(hemi); renderer.render(hemiScene, cam); renderer.setRenderTarget(null); }
      const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(), tm = renderer.toneMapping, ac = renderer.autoClear;
      renderer.toneMapping = NoToneMapping; renderer.autoClear = false;
      if (scissorRect) { rt.scissor.set(scissorRect.x, scissorRect.y, scissorRect.w, scissorRect.h); rt.scissorTest = true; } else rt.scissorTest = false;
      renderer.setRenderTarget(rt); renderer.setClearColor(CLEAR, 1); renderer.clear(true, true, false);
      if (plan.kind === 'tunnel') {
        if (points.object.parent !== cloudHolder) cloudHolder.add(points.object);
        if (plan.cross < 1) renderer.render(tunnel, cam);
        const v = landView(0);
        if (plan.cross > 0 && v) { renderer.clearDepth(); drawLand(v, api.restPush(0), plan.cross); }
      } else {
        for (const l of plan.list) {
          renderer.clearDepth();
          if (l.kind === 'garden') { if (points.object.parent !== cloudHolder) cloudHolder.add(points.object); glideTo(tl.arrive); points.cloud(); points.object.renderOrder = cloudOrder; points.alpha(1); renderer.render(tunnel, cam); continue; }
          if (l.kind === 'land') { const v = landView(l.i); if (v) drawLand(v, l.push, l.alpha ?? 1, l.sway); continue; }
          if (l.kind === 'draw') { l.draw(renderer, W, H); continue; }
          // points over the land, drawn through the land camera the land layer before set: the morph's landed points as
          // they stand, or option A's stream between two resident lands (its shader projects each end with its own camera)
          let obj: Object3D = points.object;
          if (l.kind === 'stream') {
            const a = landView(l.from), b = landView(l.to);
            if (!a || !b) continue;
            l.stream.update(l.p, { view: a, push: l.fromPush, sway: l.fromSway }, { view: b, push: l.toPush }, W, H); l.stream.alpha(l.alpha ?? 1);
            obj = l.stream.object;
          } else points.alpha(l.alpha ?? 1);
          grid.visible = false; landScene.add(obj); renderer.render(landScene, landCam); landScene.remove(obj); grid.visible = true;
        }
        if (points.object.parent !== cloudHolder) cloudHolder.add(points.object);
      }
      usedBloom = bloom > 0 && !o.touch;
      if (usedBloom) {
        post ??= createOutputPass(renderer);
        if (postW !== W || postH !== H) { post.resize(W, H); postW = W; postH = H; }
        post.run(rt.texture, bloomLook(bloom), 0);
      }
      renderer.setRenderTarget(null); renderer.setClearColor(pc, pa); renderer.toneMapping = tm; renderer.autoClear = ac;
    },
    dispose() {
      disposed = true; ac.abort(); ready = false;
      rt?.dispose(); rt = null; post?.dispose(); post = null;
      rings.geometry.dispose(); fields.geometry.dispose();
      ringMat.dispose(); ffMat.dispose(); points.dispose(); (picMesh.material as ShaderMaterial).dispose();
      for (const c of cards) { c.tex?.dispose(); c.tex = null; c.mat.dispose(); }
      unit.dispose(); gridMat.dispose(); gridGeo.dispose(); ramp.dispose(); lands.clear();
      for (const i of [...prepared.keys()]) forget(i);
      depthPrep.dispose(); hemi.dispose(); (hemiMesh.material as ShaderMaterial).dispose();
    },
  };

  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') {
    // GPU bytes: the target's colour (RGBA8) and depth (24 bits, stored in 4 bytes), each texture with its mip chain, each
    // land's depth map five times over (the source, one byte a texel, and its prepared copy, four)
    const bytes = (t: Texture | null | undefined) => { const i = t?.image as { width?: number; height?: number } | undefined; return i?.width && i.height ? i.width * i.height * ((t as DataTexture).format === RedFormat ? 1 : 4) * (t!.generateMipmaps ? 4 / 3 : 1) : 0; };
    api.hooks = () => {
      const b = (z: number) => { const f = clamp01((cam.position.z - z - GLIDE.assemble[0] * S) / ((GLIDE.assemble[1] - GLIDE.assemble[0]) * S)); return +(o.reduced ? 0 : f).toFixed(3); };
      return {
        started, ready, failed, phase: curPhase, t: +curT.toFixed(3), plan: plan.kind,
        cam: { z: +cam.position.z.toFixed(3), fov: +cam.fov.toFixed(2), zoom: +cam.zoom.toFixed(3), roll: +((cam.rotation.z * 180) / Math.PI).toFixed(2) },
        rings: nRings, triangles: ringData?.triangles ?? [], shards: ringData?.shards ?? [], broken: tl.rings.map(b),
        points: points.count, garden: cards.filter((c) => c.tex).length, lands: [...lands.keys()], passes: tl.passes.map((x) => +x.toFixed(3)), arrive: +tl.arrive.toFixed(3), size: [W, H],
        memory: { target: rt ? W * H * 8 : 0, garden: Math.round(cards.reduce((s, c) => s + bytes(c.tex), 0)), lands: Math.round([...lands.values()].reduce((s, v) => s + bytes(v.picture) + 5 * bytes(v.depth), 0)), bloom: usedBloom || post ? postW * postH * 4 : 0 },
      };
    };
  }
  return api;
}
