// Section 5's jar maths (docs/specs/section-5.md 3 "The beads" and 5 "The island modules"): pure functions with no DOM
// and no three, so tests/unit/signup.test.ts can drive them with numbers. jars.ts wires them to the renderer.

/** The jar as packed (scripts/signup/jar-bin.mjs): 1 m tall, 0.7986 m wide, its box centred on the origin, Y up. */
export const JAR = Object.freeze({
  /** the jar's height as a share of its slot's height */
  fill: 0.9,
  /** the jar's width over its height (the packer's box) */
  width: 0.79861,
  /** the inner radius the beads keep to, as a share of the wall's radius */
  innerR: 0.92,
  /** the beads' floor and the shoulder, as shares of the height from the bottom (the foot and the body's top, read off the profile) */
  floor: 0.075,
  shoulder: 0.77,
  /** a bead's radius as a share of the jar's height, and the band over which one scales in as the level passes it */
  beadR: 0.055,
  band: 0.04,
  /** beads a jar */
  perJar: 320,
  /** the camera: its vertical field of view in degrees and its distance from the jars' plane */
  fovDeg: 28,
  distance: 6,
  /** the refraction's strength: the uv offset at the silhouette as a share of the jar's screen height */
  refract: 0.12,
});

export interface Slot { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
export interface Placement { readonly x: number; readonly y: number; readonly scale: number; /** the jar's height on screen, px */ readonly px: number }

/** the half-height of the view at the jars' plane, in world units */
export const halfHeight = (fovDeg: number = JAR.fovDeg, distance: number = JAR.distance): number => distance * Math.tan((fovDeg * Math.PI) / 360);

/**
 * Where a jar stands so that it fills JAR.fill of its slot (a rect in CSS px of the viewport, y down) under a camera at
 * (0, 0, distance) looking down -z with the given field of view: its world x and y at z 0 from the slot's centre, its
 * scale (the packed jar is 1 m tall), and its height on screen.
 */
export function placeJar(slot: Slot, view: { readonly w: number; readonly h: number }, fovDeg: number = JAR.fovDeg, distance: number = JAR.distance, fill: number = JAR.fill): Placement {
  const hh = halfHeight(fovDeg, distance), aspect = view.w / Math.max(1, view.h);
  const cx = slot.x + slot.w / 2, cy = slot.y + slot.h / 2;
  const nx = (cx / Math.max(1, view.w)) * 2 - 1, ny = 1 - (cy / Math.max(1, view.h)) * 2;
  // the jar's height in px when its scale is s: s / (2 hh) x view.h; the slot wants fill x slot.h of it (the width is no wider than the slot at 4 : 5)
  const px = Math.min(fill * slot.h, slot.w / JAR.width);
  const scale = (px / Math.max(1, view.h)) * 2 * hh;
  return { x: nx * hh * aspect, y: ny * hh, scale, px };
}

/** mulberry32: a seeded generator, so the packing is the same on every machine (the unit test reads it) */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface Bead { readonly x: number; readonly y: number; readonly z: number; /** its height fraction, 0 at the floor and 1 at the shoulder */ readonly h: number }

/**
 * The beads' packing inside a jar of height 1 centred on the origin: layers of a jittered hexagonal grid inside the
 * inner radius from the floor up to the shoulder, lowest first, `count` of them (the layers go on until the count is
 * reached, so a full jar is always full to its shoulder and never short). A bead's h is its height fraction of the fill range.
 */
export function packBeads(count: number = JAR.perJar, seed: number = 1, jar: typeof JAR = JAR): Bead[] {
  const rnd = seeded(seed);
  const R = (jar.width / 2) * jar.innerR - jar.beadR, r = jar.beadR;
  const y0 = -0.5 + jar.floor + r, y1 = -0.5 + jar.shoulder - r, range = Math.max(1e-6, y1 - y0);
  const pitch = r * 1.9, rowPitch = pitch * 0.866, layerPitch = r * 1.62;
  const layers = Math.max(1, Math.ceil(range / layerPitch) + 1);
  const out: Bead[] = [];
  for (let L = 0; out.length < count && L < layers * 3; L++) {
    const y = y0 + Math.min(range, L * layerPitch);
    const ring: Bead[] = [];
    const rows = Math.ceil(R / rowPitch) + 1, jx = (L % 2) * pitch * 0.5;
    for (let j = -rows; j <= rows; j++) {
      const z = j * rowPitch, half = Math.sqrt(Math.max(0, R * R - z * z)), cols = Math.floor(half / pitch);
      for (let i = -cols; i <= cols; i++) {
        const x = i * pitch + (j % 2 ? pitch * 0.5 : 0) + jx;
        const jxr = (rnd() - 0.5) * r * 0.5, jzr = (rnd() - 0.5) * r * 0.5, jyr = (rnd() - 0.5) * r * 0.3;
        if (Math.hypot(x + jxr, z + jzr) > R) continue;
        ring.push({ x: x + jxr, y: y + jyr, z: z + jzr, h: Math.max(0, Math.min(1, (y + jyr - y0) / range)) });
      }
    }
    // a layer's beads in a random order, so the colours (taken in catalog order round the packing) mix across it
    for (let k = ring.length - 1; k > 0; k--) { const m = Math.floor(rnd() * (k + 1)); [ring[k], ring[m]] = [ring[m], ring[k]]; }
    out.push(...ring);
  }
  out.sort((a, b) => a.h - b.h);
  return out.slice(0, count);
}

/** the fill's curve: power2.out over FILL_MS (1 minus (1 minus t) cubed) */
export const easeFill = (t: number): number => { const u = 1 - Math.max(0, Math.min(1, t)); return 1 - u * u * u; };

/** the level during a fill from `from` to `to` that began at t0, at time now (seconds), over ms; instant under reduced motion */
export function levelAt(from: number, to: number, t0: number, now: number, ms: number, reduced: boolean): number {
  if (reduced || ms <= 0) return to;
  const t = Math.max(0, Math.min(1, ((now - t0) * 1000) / ms));
  return from + (to - from) * easeFill(t);
}

/**
 * Your jar's bands: the fill range split by worth, in the order the follows came (a follow of worth 2 takes two
 * bands of a whole of 4), each band wearing its platform's colours. Returns, for a bead's height fraction, the index
 * of the follow that owns it, or -1 above the follows so far (such beads are not shown anyway).
 */
export function bandOwner(h: number, worths: readonly number[], total: number): number {
  if (!(total > 0)) return -1;
  let acc = 0;
  for (let i = 0; i < worths.length; i++) {
    acc += worths[i] / total;
    // a band owns the heights under its top; the full jar's last band owns its top edge too (h 1 is the shoulder)
    if (h < acc - 1e-9 || (acc >= 1 - 1e-9 && h <= acc + 1e-9)) return i;
  }
  return -1;
}

/** the colour of bead k of a list of hexes: the hexes in catalog order round the packing */
export const beadHex = (k: number, hexes: readonly string[]): string => (hexes.length ? hexes[((k % hexes.length) + hexes.length) % hexes.length] : '#000000');
