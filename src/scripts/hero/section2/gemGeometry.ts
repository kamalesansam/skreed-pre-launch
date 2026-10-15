// Gem C's geometry (prototype v11.4 template.html, section 2 "geometry: polytope by half-space clipping"; section-2.md 4):
// one deformed faceted polytope per family, built by clipping a box with 22 to 30 seeded planes round a tall, flattened
// ellipsoid, a few deep cleaves, a narrow bevel on every edge sharper than 20 degrees, longest side 2.4 units. And the
// studio environment the gems reflect (procedural, no files). Our own code; igloo's stones were measured, never copied.
import { Box3, BufferGeometry, DataTexture, DataUtils, Euler, EquirectangularReflectionMapping, Float32BufferAttribute, HalfFloatType, LinearFilter, MathUtils, Quaternion, RGBAFormat, Vector3 as V3 } from 'three';

export function rng(seed: number): () => number { let s = (Math.imul(seed | 0, 2654435761) >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
export const smooth = (a: number, b: number, x: number): number => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** every stone's longest bounding-box side, world units (igloo's stones are 2.40 to 2.46 tall) */
export const LONG = 2.4;

type Poly = V3[];
function clipPolys(polys: Poly[], n: V3, d: number): Poly[] {
  const out: Poly[] = [], cap: V3[] = [];
  for (const poly of polys) {
    const res: V3[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = a.dot(n) - d, db = b.dot(n) - d;
      if (da <= 0) res.push(a);
      if (da * db < 0) { const p = a.clone().lerp(b, da / (da - db)); res.push(p); cap.push(p); }
    }
    if (res.length >= 3) out.push(res);
  }
  if (cap.length >= 3) {
    const c = new V3(); cap.forEach((p) => c.add(p)); c.divideScalar(cap.length);
    const u = new V3().crossVectors(n, Math.abs(n.y) < 0.9 ? new V3(0, 1, 0) : new V3(1, 0, 0)).normalize();
    const v = new V3().crossVectors(n, u);
    const uniq: V3[] = [];
    for (const p of cap) if (!uniq.some((o) => o.distanceToSquared(p) < 1e-12)) uniq.push(p);
    uniq.sort((a, b) => Math.atan2(a.clone().sub(c).dot(v), a.clone().sub(c).dot(u)) - Math.atan2(b.clone().sub(c).dot(v), b.clone().sub(c).dot(u)));
    if (uniq.length >= 3) out.push(uniq);
  }
  return out;
}
function boxPolys(s: number): Poly[] {
  const P = (x: number, y: number, z: number) => new V3(x * s, y * s, z * s);
  return [[P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)], [P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), P(-1, -1, -1)],
    [P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1)], [P(-1, -1, 1), P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1)],
    [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)], [P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1)]];
}
function polyNormal(p: Poly): V3 {
  const n = new V3();
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; n.x += (a.y - b.y) * (a.z + b.z); n.y += (a.z - b.z) * (a.x + b.x); n.z += (a.x - b.x) * (a.y + b.y); }
  return n.normalize();
}
/** make the winding outward (positive signed volume) so FrontSide and BackSide mean what they say */
function orient(g: BufferGeometry): BufferGeometry {
  const p = g.attributes.position.array as Float32Array; let vol = 0;
  for (let t = 0; t < p.length; t += 9) vol += (p[t] * (p[t + 4] * p[t + 8] - p[t + 5] * p[t + 7]) - p[t + 1] * (p[t + 3] * p[t + 8] - p[t + 5] * p[t + 6]) + p[t + 2] * (p[t + 3] * p[t + 7] - p[t + 4] * p[t + 6])) / 6;
  if (vol < 0) { for (let t = 0; t < p.length; t += 9) for (let c = 0; c < 3; c++) { const a = p[t + 3 + c]; p[t + 3 + c] = p[t + 6 + c]; p[t + 6 + c] = a; }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals(); }
  g.userData.flipped = vol < 0; return g;
}
export interface GemGeometry extends BufferGeometry { userData: { planes: number[][]; facets: number; flipped: boolean } }

export function gemGeometry(seed: number): GemGeometry {
  const r = rng(seed * 7 + 3);
  const ax = [0.60 + 0.24 * r(), 1.0, 0.50 + 0.22 * r()];                 // tall, flattened front to back, each different
  const tq = new Quaternion().setFromEuler(new Euler((r() - 0.5) * 0.6, (r() - 0.5) * 0.9, (r() - 0.5) * 0.6));
  const tqi = tq.clone().invert();
  let polys = boxPolys(3);
  const planes: [V3, number][] = [[new V3(1, 0, 0), 3], [new V3(-1, 0, 0), 3], [new V3(0, 1, 0), 3], [new V3(0, -1, 0), 3], [new V3(0, 0, 1), 3], [new V3(0, 0, -1), 3]];
  const K = 22 + Math.floor(r() * 9);
  for (let k = 0; k < K; k++) {
    const t = (k + 0.5) / K, inc = Math.acos(1 - 2 * t), az = Math.PI * (1 + Math.sqrt(5)) * k + r() * 0.6;
    const n = new V3(Math.sin(inc) * Math.cos(az), Math.cos(inc), Math.sin(inc) * Math.sin(az));
    n.x += (r() - 0.5) * 0.5; n.y += (r() - 0.5) * 0.5; n.z += (r() - 0.5) * 0.5; n.normalize();
    const nl = n.clone().applyQuaternion(tqi);
    const h = Math.hypot(ax[0] * nl.x, ax[1] * nl.y, ax[2] * nl.z);
    let d = h * (0.84 + 0.16 * r()); if (r() < 0.2) d *= 0.8;               // a few deep cleaves: the deformation
    polys = clipPolys(polys, n, d); planes.push([n, d]);
  }
  // slight bevels: one narrow facet along every edge sharper than 20 deg
  const key = (p: V3) => `${Math.round(p.x * 1e4)},${Math.round(p.y * 1e4)},${Math.round(p.z * 1e4)}`;
  const edges = new Map<string, number[]>(); const norms = polys.map(polyNormal);
  polys.forEach((p, i) => { for (let k = 0; k < p.length; k++) { const a = key(p[k]), b = key(p[(k + 1) % p.length]); const e = a < b ? a + '|' + b : b + '|' + a; if (!edges.has(e)) edges.set(e, []); edges.get(e)!.push(i); } });
  const allV = polys.flat();
  const bevel: [V3, number][] = [];
  for (const [, f] of edges) {
    if (f.length !== 2) continue;
    const n1 = norms[f[0]], n2 = norms[f[1]]; if (n1.dot(n2) > Math.cos(MathUtils.degToRad(20))) continue;
    const nb = n1.clone().add(n2).normalize(); let hb = -1e9; for (const v of allV) hb = Math.max(hb, v.dot(nb));
    bevel.push([nb, hb - 0.012]);
  }
  for (const [n, d] of bevel) polys = clipPolys(polys, n, d);
  // centre and scale to LONG
  const bb = new Box3(); polys.forEach((p) => p.forEach((v) => bb.expandByPoint(v)));
  const C = bb.getCenter(new V3()), sz = bb.getSize(new V3()), S = LONG / Math.max(sz.x, sz.y, sz.z);
  const pos: number[] = [];
  for (const p of polys) {
    const n = polyNormal(p), pc = new V3(); p.forEach((v) => pc.add(v)); pc.divideScalar(p.length);
    const ring = n.dot(pc.clone().sub(C)) < 0 ? [...p].reverse() : p;
    for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length];
      for (const v of [pc, a, b]) pos.push((v.x - C.x) * S, (v.y - C.y) * S, (v.z - C.z) * S); }
  }
  const g = new BufferGeometry() as GemGeometry; g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  g.computeBoundingBox(); g.computeBoundingSphere();
  // the main cut planes in the final frame (for look C's internal trace); bevels are thin and left out
  g.userData.planes = planes.map(([n, d]) => [n.x, n.y, n.z, S * (d - n.dot(C))]).filter((p) => p[3] < 3 * S);
  g.userData.facets = polys.length;
  return orient(g) as GemGeometry;
}

// ---------------------------------------------------------------- environments (procedural, no files)
export function equirect(Wd: number, Hd: number, fn: (x: number, y: number, W: number, H: number) => number[]): DataTexture {
  const data = new Uint16Array(Wd * Hd * 4); const toH = DataUtils.toHalfFloat;
  for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) {
    const c = fn(x, y, Wd, Hd), o = (y * Wd + x) * 4; data[o] = toH(c[0]); data[o + 1] = toH(c[1]); data[o + 2] = toH(c[2]); data[o + 3] = toH(1);
  }
  const t = new DataTexture(data, Wd, Hd, RGBAFormat, HalfFloatType);
  t.mapping = EquirectangularReflectionMapping; t.magFilter = t.minFilter = LinearFilter; t.needsUpdate = true; return t;
}
// D: overcast sky over a frozen lake, hazy sun at lon -11.5, lat 28.7 with 10.45 percent of the energy (fit in data/env-fit.json)
export function studioFn(x: number, y: number, Wd: number, Hd: number): number[] {
  const lon = ((x + 0.5) / Wd - 0.5) * 2 * Math.PI, lat = ((y + 0.5) / Hd - 0.5) * Math.PI;
  const d = new V3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
  let c = d.y > 0 ? 0.30 + 0.30 * Math.pow(d.y, 0.6) : 0.30 - 0.27 * Math.pow(-d.y, 0.45);
  const box = (axis: V3, sw: number, sh: number, e: number) => {
    const a = axis.clone().normalize(), z = d.dot(a); if (z <= 0) return 0;
    const u = new V3().crossVectors(a, new V3(0, 1, 0.001)).normalize(), v = new V3().crossVectors(u, a);
    const px = d.dot(u) / z, py = d.dot(v) / z;
    return e * (1 - smooth(sw * 0.9, sw, Math.abs(px))) * (1 - smooth(sh * 0.9, sh, Math.abs(py)));
  };
  c += box(new V3(-0.55, 0.62, 0.70), 0.32, 0.16, 16);
  c += box(new V3(0.80, 0.18, 0.55), 0.06, 0.40, 9);
  c += box(new V3(0.10, 0.95, 0.20), 0.25, 0.25, 6);
  c += box(new V3(0.25, 0.35, -0.90), 0.45, 0.10, 4);
  const pins = [[-0.2, 0.75, 0.62], [0.55, 0.55, 0.62], [-0.75, 0.30, 0.58], [0.30, 0.85, -0.42], [-0.45, 0.20, -0.87], [0.85, 0.45, -0.25]];
  for (const p of pins) { const a = new V3(p[0], p[1], p[2]).normalize(); const th = Math.acos(Math.min(1, d.dot(a))); c += 60 * Math.exp(-th * th / (2 * 0.009 * 0.009)); }
  return [c * 0.96, c * 0.99, c * 1.04];
}
