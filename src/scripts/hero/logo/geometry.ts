// The SKRD mark as ten real blocks (prototype lines 339 to 394): a faceted, chiselled front (Delaunay facets lifted to
// different heights, edges chamfered down), straight sides, a flat back. Built block by block so the loader's count keeps
// moving; step(id) runs after each block. The Park-Miller call order (seed 11, three calls per block), the Math.sin
// hashes and the float maths are the prototype's.
import { BufferGeometry, Float32BufferAttribute, Quaternion, Vector2, Vector3 } from 'three';
import { hash2, vnoise2, parkMiller } from '../util/math.ts';
import type { Pieces } from '../data/assets.ts';

export const MAXB = 30;   // uniform array size; 10 blocks are used

export interface Block {
  c: Vector2; rand: Vector3; t1: number; t2: number; d: number; q: Quaternion; hull: Vector3[];
  /** index of the block's shade in BLOCK_SHADES (assignBlockColours) */
  shade?: number;
}

export interface LogoFrame {
  VW: number; VH: number; S: number; DEPTH: number;
  toLocal(x: number, y: number): Vector2;
}

export function logoFrame(pieces: Pieces, pose: { lw: number; z: number }): LogoFrame {
  const [VW, VH] = pieces.viewBox; const LW = pose.lw; const S = LW / VW; const DEPTH = pose.z * 2;
  return { VW, VH, S, DEPTH, toLocal: (x, y) => new Vector2((x - VW / 2) * S, -(y - VH / 2) * S) };
}

export async function buildLogoGeometry(pieces: Pieces, F: LogoFrame, step: (id: number) => Promise<void>, variant = '10'): Promise<{ geometry: BufferGeometry; blocks: Block[] }> {
  const V = pieces.variants[variant]; const rnd = parkMiller(11); const blocks: Block[] = [];
  const { toLocal, DEPTH } = F;
  const P3: number[] = [], ID: number[] = [], CEN: number[] = [], SIDE: number[] = [], HH: number[] = [], EDGE: number[] = [];
  for (let id = 0; id < V.pieces.length; id++) {
    const piece = V.pieces[id], v = piece.v.map(([x, y]) => toLocal(x, y)), nb = piece.nb;
    // relief height per vertex, in units of the Relief slider: rim chamfered down, facets up by a broken amount
    const h = v.map((p, k) => k < nb ? -0.55 - 0.35 * hash2(p.x * 9, p.y * 9)
      : 0.15 + 0.5 * vnoise2(p.x * 2.4 + 3, p.y * 2.4) + 0.55 * hash2(p.x * 13, p.y * 13));
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < nb; i++) { const p = v[i], q = v[(i + 1) % nb]; const c = p.x * q.y - q.x * p.y; a += c; cx += (p.x + q.x) * c; cy += (p.y + q.y) * c; }
    a *= 0.5; cx /= 6 * a; cy /= 6 * a; const ccw = a > 0;
    const segD = (p: Vector2, a: Vector2, b: Vector2) => { const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1e-9; const u = Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)); return Math.hypot(p.x - a.x - u * dx, p.y - a.y - u * dy); };
    const ed = v.map((p, k) => { if (k < nb) return 0; let d = Infinity; for (let i = 0; i < nb; i++) d = Math.min(d, segD(p, v[i], v[(i + 1) % nb])); return d; });
    const push = (p: Vector2, z: number, hh: number, side: number, e = 0) => { P3.push(p.x, p.y, z); ID.push(id); CEN.push(cx, cy, 0); SIDE.push(side); HH.push(hh); EDGE.push(e); };
    const t = piece.t;
    for (let k = 0; k < t.length; k += 3) {
      let [i0, i1, i2] = [t[k], t[k + 1], t[k + 2]];
      const A = v[i0], B = v[i1], C = v[i2];
      if ((B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x) < 0) [i1, i2] = [i2, i1];
      push(v[i0], DEPTH / 2, h[i0], 0, ed[i0]); push(v[i1], DEPTH / 2, h[i1], 0, ed[i1]); push(v[i2], DEPTH / 2, h[i2], 0, ed[i2]);     // front, faceted
      push(v[i0], -DEPTH / 2, 0, 0); push(v[i2], -DEPTH / 2, 0, 0); push(v[i1], -DEPTH / 2, 0, 0);            // back, flat
    }
    for (let i = 0; i < nb; i++) {
      let i0 = i, i1 = (i + 1) % nb; if (!ccw) [i0, i1] = [i1, i0];
      const A = v[i0], B = v[i1];
      push(A, -DEPTH / 2, 0, 1); push(B, -DEPTH / 2, 0, 1); push(B, DEPTH / 2, h[i1], 1);
      push(A, -DEPTH / 2, 0, 1); push(B, DEPTH / 2, h[i1], 1); push(A, DEPTH / 2, h[i0], 1);
    }
    const hull: Vector3[] = [];
    for (let i = 0; i < nb; i++) for (const z of [DEPTH / 2, -DEPTH / 2]) hull.push(new Vector3(v[i].x - cx, v[i].y - cy, z));
    blocks.push({ c: new Vector2(cx, cy), rand: new Vector3(rnd(), rnd(), rnd()), t1: 0, t2: 0, d: 0, q: new Quaternion(), hull });
    await step(id);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(P3, 3));
  g.setAttribute('aId', new Float32BufferAttribute(ID, 1));
  g.setAttribute('aCentroid', new Float32BufferAttribute(CEN, 3));
  g.setAttribute('aSide', new Float32BufferAttribute(SIDE, 1));
  g.setAttribute('aH', new Float32BufferAttribute(HH, 1));
  g.setAttribute('aEdge', new Float32BufferAttribute(EDGE, 1));
  return { geometry: g, blocks };
}
