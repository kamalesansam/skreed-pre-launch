// Section 4's blends (docs/specs/section-4-world.md 2 "Blended, never blocks", 3 "Colours", W13, E-S4-colour): wherever
// the ten key shades meet in the scene (the rings' arcs, their lattice, the forcefields' lines and the cloud) each shade
// blends softly into the next over the outer 40 percent of its 36 degrees on either side, so an arc is its own shade only
// over its middle fifth and half and half at each boundary.
// - The mix is in OKLab: the lightness straight from one shade to the next, and the colour (a, b) turned the short way
//   round at a chroma between the two ends' (OKLab's polar form), so no blend dips toward grey. A straight line in OKLab
//   would: from Amethyst to Sunbeam (hues 298 and 104 degrees) it crosses at chroma 0.025, a grey beige; turned, it
//   passes through warm pinks and corals. A blend with a neutral end (Snow, chroma 0.004; Silver, 0) has no hue to turn
//   and is OKLab's straight line, a tint or a shade of the other end.
// - The weight is a smoothstep across the boundary, 0.5 on it, so the colour never kinks there; a mix outside sRGB's
//   gamut keeps its lightness and hue and loses chroma until it fits.
// - The scene reads it as a ramp texture round the ring, ten arcs of 64 texels, display values, sampled at an arc
//   coordinate (arc j covers j to j + 1, ring k turned one arc from ring k - 1): the rings at their own arc, the lattice
//   one arc on (the next family's), the forcefields by their angle, the cloud by its longitude.
// Plain numbers and no three, so tests/unit/room-world.test.ts runs it in node.

export const BLEND = Object.freeze({
  /** the blend's reach either side of a boundary, in arcs: the outer 40 percent of each 36 degrees */
  half: 0.4,
  /** the ramp's texels per arc */
  perArc: 64,
  /** under this chroma a shade counts as neutral and takes the other end's hue */
  neutral: 0.02,
});

export type Lab = readonly [number, number, number];
type Rgb = readonly [number, number, number];

/** a hex's own numbers, 0 to 1 (display values) */
export const display = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const enc = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/** OKLab from display values (Ottosson's matrices) */
export function toOklab(rgb: Rgb): Lab {
  const [r, g, b] = rgb.map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
/** linear sRGB from OKLab, unclamped */
function linearOf(lab: Lab): Rgb {
  const [L, a, b] = lab, l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = (c: Rgb) => c.every((x) => x >= -1e-6 && x <= 1 + 1e-6);
/** display values from OKLab, the chroma reduced (lightness and hue kept) until the colour is inside sRGB */
export function fromOklab(lab: Lab): [number, number, number] {
  let c = linearOf(lab);
  if (!inGamut(c)) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) { const k = (lo + hi) / 2; if (inGamut(linearOf([lab[0], lab[1] * k, lab[2] * k]))) lo = k; else hi = k; }
    c = linearOf([lab[0], lab[1] * lo, lab[2] * lo]);
  }
  return c.map((x) => enc(Math.min(1, Math.max(0, x)))) as [number, number, number];
}
export const chroma = (lab: Lab): number => Math.hypot(lab[1], lab[2]);

/** two shades mixed at t: the lightness and chroma straight, the hue the short way round; with a neutral end, OKLab's straight line */
export function mixLab(p: Lab, q: Lab, t: number): Lab {
  const cp = chroma(p), cq = chroma(q), L = p[0] + (q[0] - p[0]) * t;
  if (Math.min(cp, cq) < BLEND.neutral) return [L, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  const hp = Math.atan2(p[2], p[1]), dh = ((((Math.atan2(q[2], q[1]) - hp + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  const h = hp + dh * t, c = cp + (cq - cp) * t;
  return [L, c * Math.cos(h), c * Math.sin(h)];
}

/** at arc coordinate a (period ten): the shade before the nearest boundary, the one after it, and the weight of the second (a smoothstep over BLEND.half either side, 0.5 on the boundary) */
export function blendAt(a: number): { i: number; j: number; t: number } {
  const b = Math.round(a), x = Math.min(1, Math.max(0, (a - b + BLEND.half) / (2 * BLEND.half)));
  return { i: (((b - 1) % 10) + 10) % 10, j: ((b % 10) + 10) % 10, t: x * x * (3 - 2 * x) };
}

/** the ring's colour at arc coordinate a, as display values: a shade's own hex on its arc's middle fifth, the OKLab blend of two neighbours elsewhere */
export function ringColour(hexes: readonly string[], a: number): [number, number, number] {
  const { i, j, t } = blendAt(a);
  if (t <= 0) return display(hexes[i]);
  if (t >= 1) return display(hexes[j]);
  return fromOklab(mixLab(toOklab(display(hexes[i])), toOklab(display(hexes[j])), t));
}

/** the ramp round the ring, RGBA8 display values, ten arcs of BLEND.perArc texels, texel n at arc coordinate (n + 0.5) / perArc */
export function ringRamp(hexes: readonly string[]): Uint8Array<ArrayBuffer> {
  const n = 10 * BLEND.perArc, out = new Uint8Array(n * 4);
  for (let k = 0; k < n; k++) { const c = ringColour(hexes, (k + 0.5) / BLEND.perArc); out.set([...c.map((x) => Math.round(x * 255)), 255], k * 4); }
  return out;
}
