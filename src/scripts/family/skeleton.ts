// The stage's loading skeleton (docs/specs/family-page.md 5 "First paint", rule 41): the 24 cases' silhouettes at the
// poster pose, drawn at build from the same pose function and camera rule as the lineup, as polygons for an inline SVG
// filled with --skeleton. Each silhouette is the convex hull of the case box's eight projected corners.
import { Matrix4, Vector3 } from 'three';
import { cameraAt, derive, lineupFor, pose, solveFraming, type Layout, type LineupParams } from './three/pose.ts';

function hull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [], up: [number, number][] = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/** Polygon point lists (CSS px in a W x H stage) for the 24 cases at frame 0 (s 11.5, G 0). */
export function skeleton(dims: { w: number; d: number }, layout: Layout, W: number, H: number, tuning: Partial<LineupParams> = {}): string[] {
  const P = lineupFor(dims, layout, tuning), K = derive(P);
  const f = solveFraming(W, H, layout, P);
  const cam = cameraAt(W, H, f.D, P);
  const m = new Matrix4(), v = new Vector3();
  const out: string[] = [];
  for (let i = 0; i < 24; i++) {
    pose(i, 11.5, 0, P, K, m);
    const pts: [number, number][] = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      v.set(sx * P.w / 2, sy * 0.5, sz * P.d / 2).applyMatrix4(m).project(cam);
      pts.push([Math.round((v.x + 1) / 2 * W), Math.round((1 - v.y) / 2 * H + f.shiftY)]);
    }
    const h = hull(pts);
    if (h.every(([x]) => x < 0) || h.every(([x]) => x > W)) continue;   // wholly outside the stage
    out.push(h.map(([x, y]) => `${x},${y}`).join(' '));
  }
  return out;
}
