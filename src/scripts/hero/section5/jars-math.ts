// Section 5's jar maths (docs/specs/section-5-sand.md 4): pure functions with no DOM and no three, so
// tests/unit/signup.test.ts can drive them with numbers. jars.ts wires them to the renderer: the placement with the
// tilt, the sand body (a lathe of the jar's measured interior, clamped at the level in the vertex shader), the pour's
// schedule (the fall, the rise a quarter per 0.9 s, the tail; one stream extended by a quick second press, later ones
// queued), the heap (a cone while the stream lands, a dome at rest), the layers by the follows' order and the grains'
// seeds. Every constant is a frozen field here and reaches a shader as a uniform, never as a literal (AC11).
import { SIGNUP_FOLLOWS, WORTH_TOTAL } from '../../../config/signup.ts';

/**
 * The jar as packed (scripts/signup/jar-bin.mjs): 1 m tall, 0.7986 m wide, its box centred on the origin, Y up. The
 * interior is measured from jar.bin's inward-facing rings (h the height from the bottom, r the radius, both as shares
 * of the height): the inside floor at h 0.068 (r 0.310) rises as a step at r 0.310 to a ledge at h 0.105 that runs out
 * to the straight wall at r 0.373 (up to 0.765), the shoulder curves in to r 0.357 at 0.802 and 0.290 at 0.857, the
 * neck's inner radius is 0.231 to 0.941 and the lip's inner edge 0.257 at 1.000. The body's profile keeps 0.002 inside.
 */
export const JAR = Object.freeze({
  /** the jar's height as a share of its slot's height (the projected box with the tilt, placeJar) */
  fill: 0.9,
  /** the jar's width over its height (the packer's box) */
  width: 0.79861,
  /** the fill's floor and shoulder, as shares of the height from the bottom: levelY(0) and levelY(1) */
  floor: 0.075,
  shoulder: 0.77,
  /** the camera: its vertical field of view in degrees and its distance from the jar's plane */
  fovDeg: 28,
  distance: 6,
  /** the refraction's strength: the uv offset at the silhouette as a share of the jar's screen height */
  refract: 0.12,
  /** the jar's lean towards the viewer, degrees (E-S5-tilt, pending Sam: one number) */
  tiltDeg: 10,
  /** the inner wall's radius the body keeps to (the measured 0.373, 0.002 inside) */
  innerR: 0.371,
  /** the body's profile, [h, r] from the floor's centre up the step and the ledge to the wall's top, 0.002 inside the measured rings */
  inner: Object.freeze([[0.07, 0], [0.07, 0.308], [0.107, 0.308], [0.107, 0.371], [0.765, 0.371]] as const),
  /** the clamp's profile, [h, r]: the interior's radius at a height, the inner profile and the shoulder's measured points kept 0.002 inside */
  profile: Object.freeze([[0.07, 0.308], [0.107, 0.308], [0.107, 0.371], [0.765, 0.371], [0.802, 0.355], [0.857, 0.229]] as const),
  /** the neck's inner radius (the unit test's bound on the stream) */
  neckR: 0.231,
});

/**
 * The pour (docs/specs/section-5-sand.md 4, "The pour"), in jar heights and seconds: a slow, readable fall, not a real
 * jar's. The grains' and the motes' numbers are uniforms of POUR_VERT; the rates and counts size the one buffer.
 */
export const POUR = Object.freeze({
  /** the fall: gravity (jar heights per second squared) and the speed at the source */
  g: 6,
  v0: 0.5,
  /** the source on the jar's axis, jar units from the centre (0.12 above the lip at +0.5), the stream's radius there and its spread per second of age */
  srcY: 0.62,
  streamR: 0.025,
  spread: 0.08,
  /** a grain's radius, the depth under the surface a landed grain slides through before it is gone, the slide outward over it, and the fade-in over the first jar heights of the fall */
  grainR: 0.004,
  sink: 0.25,
  slide: 0.6,
  fadeIn: 0.06,
  /** the level's line: seconds a quarter, the quadratic ease at each end, and the tail after the last grain lands */
  perQuarter: 0.9,
  ease: 0.15,
  tail: 0.6,
  /** the heap: the cone's mean slope in degrees while the stream lands and its profile's power, the resting dome's height, the cone's rise and its settling */
  coneDeg: 12,
  conePow: 1.4,
  moundRest: 0.012,
  moundRise: 0.25,
  moundSettle: 0.6,
  /** the emission: grains a quarter of worth, motes a second (1024 over 2.7 s), and the buffer (the longest chained stream, held above the bound by the unit test) */
  streamPerQuarter: 1536,
  dustRate: 1024 / 2.7,
  stream: 6656,
  dust: 1536,
  /** the speckle's cell in device px, the layer boundary's dither in levels, and the per-grain normal tilt */
  cellPx: 2.2,
  edge: 0.015,
  tilt: 0.4,
  /** the motes' peak alpha (E-S5-dust-alpha, pending) and their size in device px (base and spread), the grains' point size clamp in device px */
  dustAlpha: 0.6,
  dustPx: Object.freeze([1.2, 0.8] as const),
  grainPx: Object.freeze([1, 6] as const),
  /** the seeds' generator */
  seed: 29,
});

/**
 * The dust's shape (the design's numbers, uniforms of POUR_VERT): a mote's radius r0 + r1 w + (r2 + r3 y) e inside
 * rMax, its rise (y0 + y1 w) e - y2 max(0, a - y3) under yMax (the lip is at 0.5), alive life0 + life1 y seconds with
 * the drag e = (1 - exp(-k a)) / k, fading in over fadeIn of its life and out from fadeOut.
 */
export const DUST = Object.freeze({
  radial: Object.freeze([0.03, 0.05, 0.05, 0.15] as const),
  rise: Object.freeze([0.1, 0.25, 0.05, 0.4] as const),
  rMax: 0.34,
  yMax: 0.45,
  fadeIn: 0.1,
  fadeOut: 0.6,
  life: Object.freeze([0.5, 0.7] as const),
  drag: 3,
});

export interface Slot { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
export interface Placement {
  readonly x: number; readonly y: number; readonly scale: number;
  /** the model's height on screen, px */
  readonly px: number;
  /** the jar's projected box on screen (CSS px of the viewport, y down): the model's box with the tilt */
  readonly box: Slot;
  /** the tilt the placement was made for, degrees */
  readonly tilt: number;
}

/** the half-height of the view at the jar's plane, in world units */
export const halfHeight = (fovDeg: number = JAR.fovDeg, distance: number = JAR.distance): number => distance * Math.tan((fovDeg * Math.PI) / 360);

/** the projected box's height over the model's at a tilt: cos t plus the depth (the width, the jar being round) times sin t */
export const tiltFactor = (tiltDeg: number, jar: typeof JAR = JAR): number => { const t = (tiltDeg * Math.PI) / 180; return Math.cos(t) + jar.width * Math.abs(Math.sin(t)); };

/**
 * Where the jar stands so that its projected box fills JAR.fill of its slot (a rect in CSS px of the viewport, y down)
 * under a camera at (0, 0, distance) looking down -z with the given field of view: its world x and y at z 0 from the
 * slot's centre, its scale (the packed jar is 1 m tall), its height on screen and its box. With a tilt the box is
 * taller than the model (tiltFactor), so the fill is divided by it: the box is 0.9 of the slot's height and inside the
 * slot at any tilt, the model 0.9 of the slot's height at 0 degrees (AC2 as the panel reworded it).
 */
export function placeJar(slot: Slot, view: { readonly w: number; readonly h: number }, tiltDeg: number = JAR.tiltDeg, fovDeg: number = JAR.fovDeg, distance: number = JAR.distance, fill: number = JAR.fill): Placement {
  const hh = halfHeight(fovDeg, distance), aspect = view.w / Math.max(1, view.h), f = tiltFactor(tiltDeg);
  const cx = slot.x + slot.w / 2, cy = slot.y + slot.h / 2;
  const nx = (cx / Math.max(1, view.w)) * 2 - 1, ny = 1 - (cy / Math.max(1, view.h)) * 2;
  // the jar's height in px when its scale is s: s / (2 hh) x view.h; the slot wants fill x slot.h for the box (the width is no wider than the slot at 4 : 5)
  const px = Math.min((fill * slot.h) / f, slot.w / JAR.width);
  const scale = (px / Math.max(1, view.h)) * 2 * hh;
  const bw = px * JAR.width, bh = px * f;
  return { x: nx * hh * aspect, y: ny * hh, scale, px, box: { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh }, tilt: tiltDeg };
}

/** mulberry32: a seeded generator, so the seeds are the same on every machine (the unit test reads it) */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** the grains' seeds: n x 4 bytes (the aSeed attribute, normalised), the same on every machine */
export function grainSeeds(n: number, seed: number = POUR.seed): Uint8Array {
  const rnd = seeded(seed), out = new Uint8Array(n * 4);
  for (let k = 0; k < out.length; k++) out[k] = Math.floor(rnd() * 256);
  return out;
}

export interface SandBody { position: Float32Array; normal: Float32Array; index: Uint16Array; /** the first vertex of the cap (rings at the profile's top, normals +y) */ capStart: number }

/**
 * The sand body: a lathe of the jar's interior (JAR.inner: a floor fan, the step, the ledge and the wall, each strip
 * with its own flat normals, outward) and a cap of rings at the profile's top with normals +y (no smoothing across the
 * wall-to-cap edge), 1 m tall and centred as the jar is. The vertex shader clamps every vertex at the level and raises
 * the cap by the heap. 48 segments: 482 vertices, 1,728 indices, 576 triangles, one draw.
 */
export function sandBody(segments: number = 48, jar: typeof JAR = JAR, capRadii: readonly number[] = [jar.innerR, 0.25, 0.125]): SandBody {
  const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
  const prof = jar.inner, top = prof[prof.length - 1][0], next = (i: number) => (i + 1) % segments;
  /** a ring of vertices at a height and radius with one flat normal (its radial and vertical parts); a radius of 0 is the one centre vertex */
  const ring = (h: number, r: number, nr: number, ny: number): number => {
    const start = pos.length / 3;
    if (!r) { pos.push(0, h - 0.5, 0); nrm.push(nr, ny, 0); return start; }
    for (let i = 0; i < segments; i++) { const a = (i / segments) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(c * r, h - 0.5, s * r); nrm.push(nr ? nr * c : 0, ny, nr ? nr * s : 0); }
    return start;
  };
  /** the triangles from ring A outward or upward to ring B (B the centre when it has one vertex), wound for the strip's own normal */
  const strip = (A: number, B: number, centre = false, up = false) => {
    for (let i = 0; i < segments; i++) {
      const j = next(i);
      if (centre) idx.push(B, A + (up ? j : i), A + (up ? i : j));
      else idx.push(A + i, B + i, A + j, A + j, B + i, B + j);
    }
  };
  // the floor fan (facing down), then the strips up the profile, each with its own rings and the segment's outward
  // normal (the tangent (dr, dh) turned to (dh, -dr))
  strip(ring(prof[1][0], prof[1][1], 0, -1), ring(prof[0][0], 0, 0, -1), true);
  for (let k = 1; k < prof.length - 1; k++) {
    const [h0, ra] = prof[k], [h1, rb] = prof[k + 1], dh = h1 - h0, dr = rb - ra, l = Math.hypot(dh, dr) || 1;
    strip(ring(h0, ra, dh / l, -dr / l), ring(h1, rb, dh / l, -dr / l));
  }
  // the cap: rings from the wall inward and a centre, all at the profile's top, normals +y, wound for +y
  const capStart = pos.length / 3, rings = capRadii.map((r) => ring(top, r, 0, 1));
  for (let k = 0; k < rings.length - 1; k++) strip(rings[k], rings[k + 1]);
  strip(rings[rings.length - 1], ring(top, 0, 0, 1), true, true);
  return { position: Float32Array.from(pos), normal: Float32Array.from(nrm), index: Uint16Array.from(idx), capStart };
}

/** the level's height in the jar's frame: the fill's floor at 0 and its shoulder at 1 */
export const levelY = (h: number, jar: typeof JAR = JAR): number => -0.5 + jar.floor + h * (jar.shoulder - jar.floor);

/** the interior's radius at a height in the jar's frame (piecewise linear over JAR.profile; 0 under the floor): the cap's clamp */
export function profileR(y: number, jar: typeof JAR = JAR): number {
  const h = y + 0.5, p = jar.profile;
  if (h < p[0][0]) return 0;
  for (let i = 1; i < p.length; i++) {
    const [h0, r0] = p[i - 1], [h1, r1] = p[i];
    if (h <= h1) return h1 > h0 ? r0 + ((h - h0) / (h1 - h0)) * (r1 - r0) : r1;
  }
  return p[p.length - 1][1];
}

/** a grain's height at age a seconds, from the source (POUR_VERT's twin) */
export const grainY = (a: number, p: typeof POUR = POUR): number => p.srcY - p.v0 * a - 0.5 * p.g * a * a;

/** the fall from the source to the surface at a level: the positive root of grainY(a) = levelY(level) + grainR */
export function fallTime(level: number, p: typeof POUR = POUR, jar: typeof JAR = JAR): number {
  const drop = Math.max(0, p.srcY - (levelY(level, jar) + p.grainR));
  return (-p.v0 + Math.sqrt(p.v0 * p.v0 + 2 * p.g * drop)) / p.g;
}

/** the cone's peak over the fill's surface, jar heights: the inner radius at the mean slope */
export const conePeak = (p: typeof POUR = POUR, jar: typeof JAR = JAR): number => jar.innerR * Math.tan((p.coneDeg * Math.PI) / 180);

/** one stream's schedule, seconds in the stream's own clock (0 at the press that started it) */
export interface Schedule {
  /** the level at the press and the level the stream reaches */
  from: number; to: number;
  /** the lead (the fall to the surface, or the rebased press), the rise's length, the emission window's end, the tail and the total */
  lead: number; pour: number; emit: number; tail: number; total: number;
  /** the owner switches (the emission times at which the grains change family) and the palette rows of each press, in order */
  switches: number[]; owners: number[];
  /** the first lead (the dust's birth origin) and the landing window's end (the level's end, where the last grain lands) */
  lead0: number; landEnd: number;
  /** the level's start ease (off once a press has rebased a moving level) */
  easeIn: boolean;
}

/** a schedule from a level to a target at a lead: the rise a quarter per perQuarter, the window's end a fall before the rise's end, the tail after it */
function schedule(from: number, to: number, lead: number, switches: number[], owners: number[], lead0: number, easeIn: boolean, p: typeof POUR, jar: typeof JAR): Schedule {
  const pour = (to - from) * WORTH_TOTAL * p.perQuarter;
  return { from, to, lead, pour, emit: lead + pour - fallTime(to, p, jar), tail: p.tail, total: lead + pour + p.tail, switches, owners, lead0, landEnd: lead + pour, easeIn };
}

/** a stream from a standstill: a press of a worth (in quarters) at a level, its grains the owner's palette row */
export function pourSchedule(worth: number, from: number, owner: number, p: typeof POUR = POUR, jar: typeof JAR = JAR): Schedule {
  const lead = fallTime(from, p, jar);
  return schedule(from, Math.min(1, from + worth / WORTH_TOTAL), lead, [], [owner], lead, true, p, jar);
}

/**
 * A press at tp while the stream is still emitting extends it: the target rises by the worth, the level is rebased so
 * it is continuous at the same pace (no start ease once it is moving; a press before the lead keeps the lead and the
 * ease, since the level has not started), the emission window's end moves out, the old window's end becomes a switch
 * (the grains emitted before it keep the old family) and the dust's window follows. Null once the window has closed
 * (tp at or past emit): the press is queued.
 */
export function extendPour(s: Schedule, worth: number, owner: number, tp: number, p: typeof POUR = POUR, jar: typeof JAR = JAR): Schedule | null {
  if (tp >= s.emit) return null;
  const lead = Math.max(tp, s.lead);
  return schedule(pourLevel(s, lead, false, p), Math.min(1, s.to + worth / WORTH_TOTAL), lead, [...s.switches, s.emit], [...s.owners, owner], s.lead0, tp <= s.lead && s.easeIn, p, jar);
}

/**
 * The level's line in time: 0 at 0 and 1 at len, a quadratic ease over `ease` seconds at each end (the start one
 * optional), linear between, so the mean pace over len is exactly 1 / len. Monotonic; 0.5 at the middle with both eases.
 */
export function ramp(a: number, len: number, ease: number, easeIn: boolean = true): number {
  if (!(len > 0)) return a >= 0 ? 1 : 0;
  if (a <= 0) return 0;
  if (a >= len) return 1;
  const e = Math.min(ease, len / 2), ein = easeIn ? e : 0, area = len - ein / 2 - e / 2;
  let d: number;
  if (easeIn && a < e) d = (a * a) / (2 * e);
  else if (a > len - e) { const u = len - a; d = area - (u * u) / (2 * e); }
  else d = a - ein / 2;
  return d / area;
}

/** the level at t seconds of a stream's clock; the target at once under reduced motion */
export const pourLevel = (s: Schedule, t: number, reduced: boolean, p: typeof POUR = POUR): number => (reduced ? s.to : s.from + (s.to - s.from) * ramp(t - s.lead, s.pour, p.ease, s.easeIn));

/** the heap's room under the shoulder: both heights scale down so the heap never rises past it at a full jar */
const headroom = (level: number, p: typeof POUR, jar: typeof JAR): number => Math.min(1, Math.max(0, (levelY(1, jar) - levelY(level, jar)) / conePeak(p, jar)));

/** the heap at rest on a level: no cone, the resting dome (none on an empty jar) */
export const restMound = (level: number, p: typeof POUR = POUR, jar: typeof JAR = JAR): { cone: number; dome: number } => ({ cone: 0, dome: level > 0 ? p.moundRest * headroom(level, p, jar) : 0 });

/**
 * The heap at t seconds of a stream: before the lead the resting dome (if there was sand); from the landing the cone
 * rises to its peak over moundRise as the dome goes; while the stream lands the cone holds; over the tail the cone
 * settles, eased, to the resting dome.
 */
export function moundAt(t: number, s: Schedule, p: typeof POUR = POUR, jar: typeof JAR = JAR): { cone: number; dome: number } {
  const peak = conePeak(p, jar), room = headroom(pourLevel(s, t, false, p), p, jar), had = s.from > 0 ? p.moundRest : 0;
  let cone = 0, dome = had;
  if (t >= s.lead && t < s.landEnd) { const u = Math.min(1, (t - s.lead) / p.moundRise); cone = peak * u; dome = had * (1 - u); }
  else if (t >= s.landEnd) { const u = Math.min(1, (t - s.landEnd) / p.moundSettle), k = 1 - (1 - u) * (1 - u); cone = peak * (1 - k); dome = p.moundRest * k; }
  return { cone: cone * room, dome: dome * room };
}

/**
 * The layers by the follows' order: the four band tops (the cumulative worth shares, padded with 1) and the four
 * owners (each the platform's index in SIGNUP_FOLLOWS, its palette row, padded with the last), two vec4 uniforms.
 */
export function layerTops(order: readonly string[], follows: typeof SIGNUP_FOLLOWS = SIGNUP_FOLLOWS): { bands: [number, number, number, number]; owners: [number, number, number, number] } {
  const total = follows.reduce((a, f) => a + f.worth, 0) || 1, bands: number[] = [], owners: number[] = [];
  let acc = 0;
  for (const id of order) {
    const k = follows.findIndex((f) => f.id === id);
    if (k < 0 || bands.length >= 4) continue;
    acc = Math.min(1, acc + follows[k].worth / total); bands.push(acc); owners.push(k);
  }
  while (bands.length < 4) { bands.push(1); owners.push(owners.length ? owners[owners.length - 1] : 0); }
  return { bands: bands as [number, number, number, number], owners: owners as [number, number, number, number] };
}

/** the owner of a height fraction of the fill (SAND_FRAG's chain in TS) */
export const layerOwner = (h: number, bands: readonly number[], owners: readonly number[]): number => (h < bands[0] ? owners[0] : h < bands[1] ? owners[1] : h < bands[2] ? owners[2] : owners[3]);

/** the owner of a grain by its emission time against the stream's switches (POUR_VERT's chain in TS) */
export function grainOwner(te: number, switches: readonly number[], owners: readonly number[]): number {
  for (let i = 0; i < switches.length; i++) if (te < switches[i]) return owners[i];
  return owners[Math.min(owners.length - 1, switches.length)];
}

/** the speckle's cells per jar height: the model's height on screen in CSS px times the island's pixel ratio over the cell's device px */
export const cells = (px: number, dpr: number, p: typeof POUR = POUR): number => (px * dpr) / p.cellPx;
