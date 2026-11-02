// Section 5's jar maths (docs/specs/section-5-liquid.md 4): pure functions with no DOM and no three, so
// tests/unit/signup.test.ts can drive them with numbers. jars.ts wires them to the renderer: the placement with the
// view from above, the liquid's body (a lathe of the jar's measured interior, clamped at the level in the vertex
// shader), the pour's schedule (the fall, the rise a quarter per 0.9 s, the tail; a switch of shade per quarter; one
// stream extended by a quick second press, later ones queued), the stream's span, the ripple's and the dimple's
// envelopes, the bands by the follows' order, and the twins of the dye model's terms. Every constant is a frozen field
// here and reaches a shader as a uniform, never as a literal (AC11).
import { SIGNUP_FOLLOWS, WORTH_TOTAL } from '../../../config/signup.ts';
import { PEARL_WHISPER } from '../../../config/tokens.ts';

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
  /** the view from a little above the jar, degrees (E-S5-tilt, pending Sam: one number; the group's rotation, the same rigid transform as a lean) */
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
 * The liquid (docs/specs/section-5-liquid.md 4), in jar heights and seconds: the fall a slow, readable one, not a real
 * jar's; the stream, the dye, the surface, the ripple and the dimple each a uniform of LIQ_VERT, LIQ_FRAG, STREAM_VERT
 * or STREAM_FRAG, or a parameter of the schedule.
 */
export const LIQ = Object.freeze({
  /** the fall: gravity (jar heights per second squared), the speed at the source, and the source on the jar's axis, jar units from the centre (0.12 above the lip at +0.5) */
  g: 6,
  v0: 0.5,
  srcY: 0.62,
  /** the level's line: seconds a quarter of worth, the quadratic ease at each end, and the tail after the last parcel lands */
  perQuarter: 0.9,
  ease: 0.15,
  tail: 0.6,
  /** the stream: its radius at the source, the rounded ends' length, the fade-in under the source, the foot's sink under the surface, the streak's power and weight, the alpha, the silhouette fade, the tube's rings and sides */
  r0: 0.03,
  tip: 0.04,
  fadeIn: 0.06,
  sink: 0.02,
  streak: Object.freeze([16, 0.55] as const),
  streamAlpha: 0.85,
  aa: 0.3,
  rings: 16,
  sides: 8,
  /** the dye: the reference chord (2 x innerR, the jar's width inside), water's index squared, the scatter's weight, the liquid's own refraction, the seam's half-width (of the fill) and the colour floor (pow never sees a zero base) */
  d0: 0.742,
  eta2: 1.77,
  scatter: 0.65,
  refract: 0.04,
  seam: 0.01,
  floor: 1e-6,
  /** the surface: the highlight's power and weight, the sheen, the reflection's weight, the fresnel's terms, the sky's ramp, the meniscus's width and tilt */
  spec: Object.freeze([64, 0.7] as const),
  sheen: 0.35,
  reflect: 0.85,
  fresnel: Object.freeze([0.04, 0.96, 5] as const),
  sky: Object.freeze([-0.25, 0.9] as const),
  meniscus: Object.freeze([0.02, 0.8] as const),
  /** the ripple: the rings' slope, their wavelength (jar heights), their speed (jar heights a second), their decay with the radius, and the weight's rise after the landing */
  rippleSlope: 0.35,
  rippleLen: 0.09,
  rippleSpeed: 0.35,
  rippleDecay: 5.5,
  rippleIn: 0.2,
  /** the dimple under the stream's foot: its depth and radius (jar heights), its rim, and the one rebound's period and decay (seconds) */
  dimpleDepth: 0.012,
  dimpleR: 0.035,
  dimpleRim: 0.6,
  reboundPeriod: 0.5,
  reboundDecay: 0.2,
});

/** display values in and out: the gamma, a render parameter (a uniform, so the shaders carry no 2.2 of their own) */
export const GAMMA = 2.2;

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

export interface LiquidBody { position: Float32Array; normal: Float32Array; index: Uint16Array; /** the first vertex of the cap (rings at the profile's top, normals +y) */ capStart: number }

/**
 * The liquid's body: a lathe of the jar's interior (JAR.inner: a floor fan, the step, the ledge and the wall, each strip
 * with its own flat normals, outward) and a cap of rings at the profile's top with normals +y (no smoothing across the
 * wall-to-cap edge), 1 m tall and centred as the jar is. The vertex shader clamps every vertex at the level, so the cap
 * is the liquid's surface. 48 segments: 482 vertices, 1,728 indices, 576 triangles, one draw.
 */
export function liquidBody(segments: number = 48, jar: typeof JAR = JAR, capRadii: readonly number[] = [jar.innerR, 0.25, 0.125]): LiquidBody {
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

/**
 * The stream's tube: rings by sides, the one attribute position = (cos a, s, sin a) with s 0 at the top end and 1 at
 * the head end; STREAM_VERT forms it from the span uniforms every frame. 16 by 8: 128 vertices, 720 indices, 240
 * triangles, wound outward.
 */
export function tubeGeometry(rings: number = LIQ.rings, sides: number = LIQ.sides): { position: Float32Array; index: Uint16Array } {
  const pos: number[] = [], idx: number[] = [];
  for (let k = 0; k < rings; k++) for (let j = 0; j < sides; j++) { const a = (j / sides) * Math.PI * 2; pos.push(Math.cos(a), k / (rings - 1), Math.sin(a)); }
  for (let k = 0; k < rings - 1; k++) for (let j = 0; j < sides; j++) {
    const a = k * sides + j, b = k * sides + ((j + 1) % sides), c = a + sides, d = b + sides;
    idx.push(a, b, c, b, d, c);
  }
  return { position: Float32Array.from(pos), index: Uint16Array.from(idx) };
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

/** a parcel's height at age a seconds, from the source (STREAM_VERT's fall) */
export const fallY = (a: number, p: typeof LIQ = LIQ): number => p.srcY - p.v0 * a - 0.5 * p.g * a * a;

/** the age of a parcel at a height under the source: the inverse of fallY (STREAM_VERT's twin) */
export const fallAge = (y: number, p: typeof LIQ = LIQ): number => (-p.v0 + Math.sqrt(p.v0 * p.v0 + 2 * p.g * Math.max(0, p.srcY - y))) / p.g;

/** the fall from the source to the surface at a level: the positive root of fallY(a) = levelY(level) */
export const fallTime = (level: number, p: typeof LIQ = LIQ, jar: typeof JAR = JAR): number => fallAge(levelY(level, jar), p);

/** the stream's radius at a height by mass conservation: r0 at the source, narrowing as it speeds up (STREAM_VERT's twin) */
export const streamRadius = (y: number, p: typeof LIQ = LIQ): number => p.r0 * Math.sqrt(p.v0 / Math.sqrt(p.v0 * p.v0 + 2 * p.g * Math.max(0, p.srcY - y)));

/** one stream's schedule, seconds in the stream's own clock (0 at the press that started it) */
export interface Schedule {
  /** the level at the press and the level the stream reaches */
  from: number; to: number;
  /** the lead (the fall to the surface, or the rebased press), the rise's length, the emission's end, the tail and the total */
  lead: number; pour: number; emit: number; tail: number; total: number;
  /** the shade switches (the emission times at which the parcels change shade) and the shades poured, catalog ids one per quarter in emission order: switches.length is shades.length - 1 */
  switches: number[]; shades: string[];
  /** the first lead (where the head first met the surface) and the landing's end (the level's end, where the last parcel lands) */
  lead0: number; landEnd: number;
  /** the level's start ease (off once a press has rebased a moving level) */
  easeIn: boolean;
}

/**
 * The switches for the quarter boundaries strictly inside (lo, hi) of a line that stands at `from` at `lead` and rises
 * a quarter per perQuarter: each the emission time of the parcel that lands as the level crosses the boundary.
 */
export function quarterSwitches(from: number, to: number, lead: number, p: typeof LIQ = LIQ, jar: typeof JAR = JAR, lo: number = from): number[] {
  const out: number[] = [];
  for (let k = 1; k < WORTH_TOTAL; k++) {
    const q = k / WORTH_TOTAL;
    if (q > lo + 1e-9 && q < to - 1e-9) out.push(lead + (q - from) * WORTH_TOTAL * p.perQuarter - fallTime(q, p, jar));
  }
  return out;
}

/** a schedule from a level to a target at a lead: the rise a quarter per perQuarter, the emission's end a fall before the rise's end, the tail after it */
function schedule(from: number, to: number, lead: number, switches: number[], shades: string[], lead0: number, easeIn: boolean, p: typeof LIQ, jar: typeof JAR): Schedule {
  const pour = (to - from) * WORTH_TOTAL * p.perQuarter;
  return { from, to, lead, pour, emit: lead + pour - fallTime(to, p, jar), tail: p.tail, total: lead + pour + p.tail, switches, shades, lead0, landEnd: lead + pour, easeIn };
}

/** the shades a press pours from a level to a target: one per quarter poured, the follow's ids in order (a press clamped at full pours fewer) */
const poured = (shades: readonly string[], from: number, to: number): string[] => shades.slice(0, Math.max(1, Math.round((to - from) * WORTH_TOTAL)));

/** a stream from a standstill: a press of a worth (in quarters) at a level, its parcels the follow's shades, a switch at every quarter inside */
export function pourSchedule(worth: number, from: number, shades: readonly string[], p: typeof LIQ = LIQ, jar: typeof JAR = JAR): Schedule {
  const lead = fallTime(from, p, jar), to = Math.min(1, from + worth / WORTH_TOTAL);
  return schedule(from, to, lead, quarterSwitches(from, to, lead, p, jar), poured(shades, from, to), lead, true, p, jar);
}

/**
 * A press at tp while the stream is still emitting extends it: the target rises by the worth, the level is rebased so
 * it is continuous at the same pace (no start ease once it is moving; a press before the lead keeps the lead and the
 * ease, since the level has not started), the emission's end moves out, the old end becomes a switch (the parcels
 * emitted before it keep the old shade and land about when the level crosses the old target) and the new press's own
 * quarter switches follow. Null once the emission has ended (tp at or past emit): the press is queued.
 */
export function extendPour(s: Schedule, worth: number, shades: readonly string[], tp: number, p: typeof LIQ = LIQ, jar: typeof JAR = JAR): Schedule | null {
  if (tp >= s.emit) return null;
  const lead = Math.max(tp, s.lead), from = pourLevel(s, lead, false, p), to = Math.min(1, s.to + worth / WORTH_TOTAL);
  return schedule(from, to, lead, [...s.switches, s.emit, ...quarterSwitches(from, to, lead, p, jar, s.to)], [...s.shades, ...poured(shades, s.to, to)], s.lead0, tp <= s.lead && s.easeIn, p, jar);
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
export const pourLevel = (s: Schedule, t: number, reduced: boolean, p: typeof LIQ = LIQ): number => (reduced ? s.to : s.from + (s.to - s.from) * ramp(t - s.lead, s.pour, p.ease, s.easeIn));

/** the shade of a parcel by its emission time against the stream's switches (STREAM_VERT's chain in TS) */
export function parcelShade(te: number, switches: readonly number[], shades: readonly string[]): string {
  for (let i = 0; i < switches.length; i++) if (te < switches[i]) return shades[i];
  return shades[Math.min(shades.length - 1, switches.length)];
}

/**
 * The stream's span at t seconds of a stream: the head falls from the source and stays a sink under the surface once it
 * has landed (the body's depth hides the foot); the top stays at the source until the emission ends, then falls; each
 * end rounded over LIQ.tip while it is free (the head while it falls, the top once it has left the source). Null from
 * the landing's end, where the mesh is hidden.
 */
export function streamSpan(t: number, s: Schedule, p: typeof LIQ = LIQ, jar: typeof JAR = JAR): { top: number; head: number; topTip: number; headTip: number } | null {
  if (t < 0 || t >= s.landEnd) return null;
  const sunk = levelY(pourLevel(s, t, false, p), jar) - p.sink, fall = fallY(t, p), falling = fall > sunk;
  const head = falling ? fall : sunk, top = t < s.emit ? p.srcY : fallY(t - s.emit, p);
  if (top < head) return null;
  return { top, head, topTip: t < s.emit ? 0 : p.tip, headTip: falling ? p.tip : 0 };
}

/** GLSL's smoothstep */
export const smoothstep = (a: number, b: number, x: number): number => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** the ripple's weight at t seconds of a stream: 0 before the landing, rising over rippleIn, 1 while the stream lands, falling over the tail to exactly 0 at the total */
export function rippleWeight(t: number, s: Schedule, p: typeof LIQ = LIQ): number {
  if (t <= s.lead0 || t >= s.total) return 0;
  return smoothstep(s.lead0, s.lead0 + p.rippleIn, t) * (1 - smoothstep(s.landEnd, s.total, t));
}

/** the dimple's weight: the ripple's while the stream lands, then one rebound (a damped cosine) under the tail's envelope, exactly 0 at the total */
export function dimpleWeight(t: number, s: Schedule, p: typeof LIQ = LIQ): number {
  const w = rippleWeight(t, s, p);
  if (!w || t < s.landEnd) return w;
  const a = t - s.landEnd;
  return w * Math.exp(-a / p.reboundDecay) * Math.cos((2 * Math.PI * a) / p.reboundPeriod);
}

/** the rings' slope at a radius from the landing and a clock (LIQ_FRAG's twin, at weight 1): running out at rippleSpeed, decaying with the radius */
export function rippleSlope(rho: number, t: number, p: typeof LIQ = LIQ): number {
  const k = (2 * Math.PI) / p.rippleLen;
  return p.rippleSlope * Math.sin(k * rho - p.rippleSpeed * k * t) * Math.exp(-p.rippleDecay * rho);
}

/** the dimple's height at a radius: a well with a raised rim, h(u) = -A exp(-u^2) (1 - c u^2), u the radius over dimpleR */
export function dimpleHeight(rho: number, p: typeof LIQ = LIQ): number {
  const u = rho / p.dimpleR;
  return -p.dimpleDepth * Math.exp(-u * u) * (1 - p.dimpleRim * u * u);
}

/** the dimple's slope at a radius (LIQ_FRAG's twin, at weight 1): the well's derivative, rising outward from its bottom */
export function dimpleSlope(rho: number, p: typeof LIQ = LIQ): number {
  const u = rho / p.dimpleR, c = p.dimpleRim;
  return ((2 * p.dimpleDepth) / p.dimpleR) * u * Math.exp(-u * u) * (1 + c - c * u * u);
}

/** the meniscus's slope at a radius inside the interior's radius R at the level (LIQ_FRAG's twin): the surface climbing the glass over the outer meniscus[0] */
export const meniscusSlope = (rho: number, R: number, p: typeof LIQ = LIQ): number => (1 - smoothstep(0, p.meniscus[0], R - rho)) * p.meniscus[1];

export type Rgb = [number, number, number];
const LUM: Rgb = [0.2126, 0.7152, 0.0722];
/** Rec. 709 luminance of a linear colour */
export const lum = (c: Rgb): number => c[0] * LUM[0] + c[1] * LUM[1] + c[2] * LUM[2];
/** a hex into linear light through the display gamma, each channel held at the floor */
export const linearOf = (hex: string, gamma: number = GAMMA, floor: number = LIQ.floor): Rgb => [1, 3, 5].map((i) => Math.max(floor, Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, gamma))) as Rgb;
/** a linear colour back to a hex through the display gamma */
export const hexOf = (c: Rgb, gamma: number = GAMMA): string => '#' + c.map((x) => Math.round(Math.pow(Math.min(1, Math.max(0, x)), 1 / gamma) * 255).toString(16).padStart(2, '0')).join('');
/** the light's colour in linear light (the scatter's and the highlights') */
export const PEARL_LINEAR: Rgb = linearOf(PEARL_WHISPER);

/** the view ray's chord through the lathe at a wall fragment: twice the radius there times the normal's cosine to the view */
export const chord = (ndv: number, R: number): number => 2 * R * ndv;
/** the view ray's path under a cap fragment: the liquid's height under it over the refracted cosine, at most the reference chord */
export const capPath = (hL: number, ndv: number, p: typeof LIQ = LIQ): number => Math.min(hL / Math.sqrt(1 - (1 - ndv * ndv) / p.eta2), p.d0);
/** the transmission of a linear colour along a chord: each channel to the power d / d0, so the reference chord gives the shade itself */
export const transmit = (c: Rgb, d: number, d0: number = LIQ.d0, floor: number = LIQ.floor): Rgb => c.map((x) => Math.pow(Math.max(floor, x), d / d0)) as Rgb;
/** the scatter that gives the liquid a body: the shade, lit by what the chord took, under the light's colour */
export const scatter = (c: Rgb, T: Rgb, p: typeof LIQ = LIQ, w: Rgb = PEARL_LINEAR): Rgb => { const k = (1 - lum(T)) * p.scatter; return c.map((x, i) => x * k * w[i]) as Rgb; };
/** what a fragment shows (LIQ_FRAG's twin end to end, before the surface's terms): the background through the transmission plus the scatter, in linear light */
export function seen(bg: Rgb, c: Rgb, d: number, p: typeof LIQ = LIQ): Rgb {
  const T = transmit(c, d, p.d0, p.floor), S = scatter(c, T, p);
  return bg.map((b, i) => b * T[i] + S[i]) as Rgb;
}

/**
 * The bands by the follows' order, one per quarter of worth: the four band tops (the cumulative quarters, padded with 1)
 * and the four bands' shades (each follow's ids in order, padded with the last), the body's uB and its colours.
 */
export function layerBands(order: readonly string[], follows: typeof SIGNUP_FOLLOWS = SIGNUP_FOLLOWS): { tops: [number, number, number, number]; shades: [string, string, string, string] } {
  const total = follows.reduce((a, f) => a + f.worth, 0) || 1, tops: number[] = [], shades: string[] = [];
  let acc = 0;
  for (const id of order) {
    const f = follows.find((x) => x.id === id);
    if (!f) continue;
    for (const sh of f.shades) { if (tops.length >= 4) break; acc = Math.min(1, acc + 1 / total); tops.push(acc); shades.push(sh); }
  }
  const last = shades.length ? shades[shades.length - 1] : follows[0]?.shades[0] ?? '';
  while (tops.length < 4) { tops.push(1); shades.push(last); }
  return { tops: tops as [number, number, number, number], shades: shades as [string, string, string, string] };
}

/** the band's colour at a height fraction of the fill (LIQ_FRAG's three-mix chain in TS): exactly a band's colour away from a top, the midpoint mix at one */
export function bandColour(hf: number, tops: readonly number[], colours: readonly Rgb[], seam: number = LIQ.seam): Rgb {
  let c = colours[0];
  for (let i = 0; i < 3; i++) { const w = smoothstep(tops[i] - seam, tops[i] + seam, hf), n = colours[i + 1]; c = c.map((x, k) => x + (n[k] - x) * w) as Rgb; }
  return c;
}
