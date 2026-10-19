// Section 4's tunnel rings (docs/specs/section-4-world.md 2 "The ring travel", W2 and W3): generated at load from a
// seed, no asset and no bytes. Each ring is an annulus of the measured proportions (evidence file 8: outer radius 0.16 S,
// inner about 0.116 S, thickness 0.052 S, S the spacing between rings) cut into ten 36-degree arcs, one per family in
// catalog order clockwise from the top as the camera sees it, ring k turned 36 k degrees from the first; each arc is cut
// again at seeded angles into three to five shards with a hairline seam between them. A shard is a closed annular prism:
// the front and back faces flat, the outer and inner faces smooth along the arc, two flat end caps, 1.5 degrees a
// segment, so a ring is about 2,000 triangles. Every vertex carries what the vertex shader (world.ts) needs to throw its
// shard out and bring it home: the shard's centre (its z is the ring's, so one draw holds every ring), a random spin axis
// and angle, how far it is thrown outward and toward the camera, how much it shrinks, its own window inside the assembly
// falloff, its arc's shade index (0 to 9, ROOM_BAYS order) and a lattice coordinate per face for the intro's tTri.
// A far ring reads as igloo's broken one (evidence 5: a long C-arc of 180 to 240 degrees nearly in place, the rest
// thrown as short arcs and blocks): the shards inside one seeded stretch of that length are barely loose, the others
// fly. Plain typed arrays and no three, so tests/unit/room-world.test.ts runs it in node.

/** the ring's measured proportions in units of the spacing S, and the cut (degrees) */
export const RING = Object.freeze({
  outer: 0.16, inner: 0.116, thickness: 0.052,
  arcs: 10, arcDeg: 36, segDeg: 1.5, seamDeg: 0.15, shardsPerArc: [3, 5] as const, minShardDeg: 5,
  /** the stretch that stays nearly whole while the ring is broken, degrees (evidence 5) */
  cArc: [180, 240] as const,
  /** lattice coordinates per scene unit on the shards' faces: the intro's tTri tiles 14 jittered cells per repeat, so a cell is about 0.018 units, six or so across a ring's band */
  lattice: 4.0,
  /** and on the forcefields: a cell about 0.024 units, a thirteenth of the disc's radius (evidence 5: 1/10 to 1/16 of it, 25 to 45 px at the approach) */
  fieldLattice: 3.0,
});

/** a small seeded generator (mulberry32): the same seed gives the same rings on every device */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** the shade index (ROOM_BAYS order) of ring k at a screen angle, degrees clockwise from the top: arc j of ring k starts at 36 (j + k) */
export const arcAt = (k: number, deg: number): number => (((Math.floor((((deg % 360) + 360) % 360) / RING.arcDeg) - k) % RING.arcs) + RING.arcs) % RING.arcs;

export interface RingArrays {
  /** scene units, the rings standing across the flight path (the camera flies toward -z), ring k's centre at zs[k] */
  position: Float32Array; normal: Float32Array;
  /** the shard's centre; its z is the ring's own */
  centre: Float32Array;
  /** xyz the unit spin axis, w the spin when fully broken (radians) */
  spin: Float32Array;
  /** x thrown outward along the centre's direction, y toward the camera (scene units), z the shrink (0 to 1), w the shard's window in the falloff (0 to 1) */
  fling: Float32Array;
  /** the lattice coordinate on each face (tTri repeats every 1) */
  lattice: Float32Array;
  /** the arc's shade index, 0 to 9 */
  shade: Float32Array;
  index: Uint16Array | Uint32Array;
  /** per ring: triangles and shards; and every shard's arc in ring-major order */
  triangles: number[]; shards: number[]; arcs: number[];
}

interface Shard { k: number; a0: number; a1: number; arc: number; ro: number; ri: number; t: number; loose: number; rnd: number[] }

/**
 * The rings for one entry: count rings at zs (scene z of each ring's plane), spacing S scene units. Deterministic in
 * seed and count; ring k's shards draw from a stream seeded by seed and k, so adding a ring never changes the others.
 */
export function generateRings(seed: number, zs: readonly number[], S: number): RingArrays {
  const shards: Shard[] = [];
  zs.forEach((_, k) => {
    const r = mulberry32((seed ^ Math.imul(k + 1, 0x9e3779b1)) >>> 0);
    // the stretch that stays nearly whole: a seeded start and a length of 180 to 240 degrees
    const cStart = r() * 360, cLen = RING.cArc[0] + r() * (RING.cArc[1] - RING.cArc[0]);
    const inC = (deg: number) => ((deg - cStart) % 360 + 360) % 360 < cLen;
    for (let j = 0; j < RING.arcs; j++) {
      const from = (j + k) * RING.arcDeg, n = RING.shardsPerArc[0] + Math.floor(r() * (RING.shardsPerArc[1] - RING.shardsPerArc[0] + 1));
      // n - 1 seeded cuts inside the arc, each shard at least minShardDeg wide
      const free = RING.arcDeg - n * RING.minShardDeg, w = Array.from({ length: n }, () => r()), sum = w.reduce((a, b) => a + b, 0);
      let a = from;
      for (let s = 0; s < n; s++) {
        const span = RING.minShardDeg + (free * w[s]) / sum, mid = a + span / 2;
        const loose = inC(mid) ? 0.04 + 0.12 * r() : 0.45 + 0.55 * r();
        shards.push({
          k, a0: a + RING.seamDeg, a1: a + span - RING.seamDeg, arc: j,
          // chunky, not machined: the outer edge and the thickness vary a little shard to shard
          ro: RING.outer * S * (0.975 + 0.05 * r()), ri: RING.inner * S * (0.99 + 0.02 * r()), t: RING.thickness * S * (0.88 + 0.24 * r()),
          loose, rnd: [r(), r(), r(), r(), r(), r(), r(), r()],
        });
        a += span;
      }
    }
  });
  // sizes: per shard, m segments; the four long faces share their vertices along the arc, the caps have their own
  const segs = shards.map((s) => Math.max(2, Math.ceil((s.a1 - s.a0) / RING.segDeg)));
  const nv = segs.reduce((acc, m) => acc + 8 * (m + 1) + 8, 0), nt = segs.reduce((acc, m) => acc + 8 * m + 4, 0);
  const position = new Float32Array(nv * 3), normal = new Float32Array(nv * 3), centre = new Float32Array(nv * 3);
  const spin = new Float32Array(nv * 4), fling = new Float32Array(nv * 4), lattice = new Float32Array(nv * 2), shade = new Float32Array(nv);
  const index = nv > 65535 ? new Uint32Array(nt * 3) : new Uint16Array(nt * 3);
  const triangles = zs.map(() => 0), counts = zs.map(() => 0), arcs: number[] = [];
  let v = 0, ii = 0;
  const D = Math.PI / 180;
  shards.forEach((s, si) => {
    const m = segs[si], z0 = zs[s.k], rm = (s.ro + s.ri) / 2, am = ((s.a0 + s.a1) / 2) * D;
    const cx = rm * Math.sin(am), cy = rm * Math.cos(am);
    // the spin: a uniform random axis and up to about three radians; the throw: outward 0.5 to 1.4 radii and toward the camera up to one radius; the shrink up to two thirds
    const [r0, r1, r2, r3, r4, r5, r6] = s.rnd;
    const uz = 2 * r0 - 1, ph = 2 * Math.PI * r1, q = Math.sqrt(1 - uz * uz);
    const ax = q * Math.cos(ph), ay = q * Math.sin(ph), az = uz, ang = s.loose * (1.2 + 2.0 * r2);
    const out = s.loose * (0.5 + 0.9 * r3) * s.ro, toCam = s.loose * (0.15 + 0.85 * r4) * s.ro, shrink = s.loose * (0.25 + 0.4 * r5), win = r6;
    const put = (x: number, y: number, z: number, nx: number, ny: number, nz: number, lu: number, lv: number) => {
      position[v * 3] = x; position[v * 3 + 1] = y; position[v * 3 + 2] = z0 + z;
      normal[v * 3] = nx; normal[v * 3 + 1] = ny; normal[v * 3 + 2] = nz;
      centre[v * 3] = cx; centre[v * 3 + 1] = cy; centre[v * 3 + 2] = z0;
      spin[v * 4] = ax; spin[v * 4 + 1] = ay; spin[v * 4 + 2] = az; spin[v * 4 + 3] = ang;
      fling[v * 4] = out; fling[v * 4 + 1] = toCam; fling[v * 4 + 2] = shrink; fling[v * 4 + 3] = win;
      lattice[v * 2] = lu * RING.lattice; lattice[v * 2 + 1] = lv * RING.lattice; shade[v] = s.arc;
      return v++;
    };
    const quad = (a: number, b: number, c: number, d: number) => { index[ii++] = a; index[ii++] = b; index[ii++] = c; index[ii++] = a; index[ii++] = c; index[ii++] = d; };
    const h = s.t / 2;
    // the four long faces: front (+z, toward the camera), back, outer and inner, each a strip of m quads
    const strip = (face: 0 | 1 | 2 | 3) => {
      const base = v;
      for (let i = 0; i <= m; i++) {
        const a = (s.a0 + ((s.a1 - s.a0) * i) / m) * D, sx = Math.sin(a), sy = Math.cos(a);
        if (face < 2) {   // front and back: flat, the lattice in the ring's own plane
          const z = face === 0 ? h : -h, nz = face === 0 ? 1 : -1;
          put(s.ri * sx, s.ri * sy, z, 0, 0, nz, s.ri * sx, s.ri * sy);
          put(s.ro * sx, s.ro * sy, z, 0, 0, nz, s.ro * sx, s.ro * sy);
        } else {           // outer and inner: smooth along the arc, the lattice unrolled (arc length, depth)
          const r = face === 2 ? s.ro : s.ri, sg = face === 2 ? 1 : -1;
          put(r * sx, r * sy, h, sg * sx, sg * sy, 0, a * r, h);
          put(r * sx, r * sy, -h, sg * sx, sg * sy, 0, a * r, -h);
        }
      }
      // winding: counter-clockwise seen from outside the face (the angle runs clockwise seen from the camera)
      for (let i = 0; i < m; i++) {
        const a0 = base + i * 2, a1 = a0 + 1, b0 = a0 + 2, b1 = a0 + 3;
        if (face === 0 || face === 2) quad(a0, b0, b1, a1); else quad(a0, a1, b1, b0);
      }
    };
    strip(0); strip(1); strip(2); strip(3);
    // the end caps: flat, facing along the arc, the lattice on (radius, depth)
    for (const end of [0, 1] as const) {
      const a = (end === 0 ? s.a0 : s.a1) * D, sx = Math.sin(a), sy = Math.cos(a), tx = end === 0 ? -sy : sy, ty = end === 0 ? sx : -sx;
      const b = v;
      put(s.ri * sx, s.ri * sy, h, tx, ty, 0, s.ri, h); put(s.ro * sx, s.ro * sy, h, tx, ty, 0, s.ro, h);
      put(s.ro * sx, s.ro * sy, -h, tx, ty, 0, s.ro, -h); put(s.ri * sx, s.ri * sy, -h, tx, ty, 0, s.ri, -h);
      if (end === 0) quad(b, b + 1, b + 2, b + 3); else quad(b, b + 3, b + 2, b + 1);
    }
    triangles[s.k] += 8 * m + 4; counts[s.k]++; arcs.push(s.arc);
  });
  return { position, normal, centre, spin, fling, lattice, shade, index, triangles, shards: counts, arcs };
}
