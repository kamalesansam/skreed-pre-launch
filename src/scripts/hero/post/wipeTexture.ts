// The wipe's data texture (prototype lines 944 to 986), generated here (igloo ships an authored 1024 px PNG; ours is
// procedural). R: grungy ice-crack threshold, G: hard-edged tech blocks, B: slow wobble of the diagonal.
// fill(j0, j1) fills rows j0 to j1, so the work spreads over the ten block builds. The integer hash is the prototype's
// exactly: never Math.imul, because the double rounding of the 1274126177 product is part of the texture; x * 999 | 0
// keeps its precedence (tests/unit/wipe.test.ts compares the texture with the prototype function's).
import { DataTexture, LinearFilter, RGBAFormat, RepeatWrapping } from 'three';

export interface ScrollTexture { tex: DataTexture; fill(j0: number, j1: number): void }

export function makeScrollTexture(N = 512): ScrollTexture {
  const data = new Uint8Array(N * N * 4);
  const hash = (x: number, y: number, s: number) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const vn = (x: number, y: number, per: number, s: number) => { // periodic value noise
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const g = (a: number, b: number) => hash(((a % per) + per) % per, ((b % per) + per) % per, s);
    return (g(xi, yi) * (1 - u) + g(xi + 1, yi) * u) * (1 - v) + (g(xi, yi + 1) * (1 - u) + g(xi + 1, yi + 1) * u) * v;
  };
  const fbm = (x: number, y: number, base: number, s: number) => { let a = 0, w = 0.5, f = base; for (let o = 0; o < 5; o++) { a += w * vn(x * f, y * f, f, s + o); w *= 0.5; f *= 2; } return a; };
  // cells for cracks
  const CELLS = 7, pts: [number, number][] = [];
  for (let j = 0; j < CELLS; j++) for (let i = 0; i < CELLS; i++) pts.push([(i + hash(i, j, 5)) / CELLS, (j + hash(i, j, 6)) / CELLS]);
  // tech blocks: recursive rectangle split
  const blocksG: [number, number, number, number, number][] = [];
  (function split(x: number, y: number, w: number, h: number, d: number) {
    if (d > 5 || (d > 2 && hash(x * 999 | 0, y * 999 | 0, d) < 0.3)) { blocksG.push([x, y, w, h, hash(x * 777 | 0, y * 555 | 0, 9)]); return; }
    if (w > h) { const k = 0.3 + 0.4 * hash(x * 100 | 0, d, 1); split(x, y, w * k, h, d + 1); split(x + w * k, y, w * (1 - k), h, d + 1); }
    else { const k = 0.3 + 0.4 * hash(y * 100 | 0, d, 2); split(x, y, w, h * k, d + 1); split(x, y + h * k, w, h * (1 - k), d + 1); }
  })(0, 0, 1, 1, 0);
  const G = new Float32Array(N * N);
  for (const [x, y, w, h, val] of blocksG) for (let j = Math.floor(y * N); j < Math.floor((y + h) * N); j++) for (let i = Math.floor(x * N); i < Math.floor((x + w) * N); i++) G[j * N + i] = val;
  const fill = (j0: number, j1: number) => { for (let j = j0; j < Math.min(N, j1); j++) for (let i = 0; i < N; i++) {
    const x = i / N, y = j / N;
    // shards: each Voronoi cell (warped a little) gets its own arrival time; cracks along the cell edges arrive first
    const wx = x + (fbm(x, y, 4, 11) - 0.5) * 0.06, wy = y + (fbm(x, y, 4, 12) - 0.5) * 0.06;
    let d1 = 9, d2 = 9, id = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) for (let k = 0; k < pts.length; k++) {
      const ex = pts[k][0] + dx - wx, ey = pts[k][1] + dy - wy; if (Math.abs(ex) > 0.3 || Math.abs(ey) > 0.3) continue;
      const d = ex * ex + ey * ey; if (d < d1) { d2 = d1; d1 = d; id = k; } else if (d < d2) d2 = d;
    }
    const edge = Math.min(1, (Math.sqrt(d2) - Math.sqrt(d1)) * 40);
    const grunge = fbm(x, y, 8, 1);
    const r = Math.min(1, Math.max(0, 0.08 + 0.62 * hash(id, 3, 8) + 0.22 * grunge * edge + (vn(x * 96, y * 96, 96, 3) - 0.5) * 0.08));
    const b = fbm(x, y, 2, 7);
    const o = (j * N + i) * 4;
    data[o] = r * 255; data[o + 1] = G[j * N + i] * 255; data[o + 2] = b * 255; data[o + 3] = 255;
  } };
  const t = new DataTexture(data, N, N, RGBAFormat);
  t.wrapS = t.wrapT = RepeatWrapping; t.magFilter = LinearFilter; t.minFilter = LinearFilter; t.needsUpdate = true;
  return { tex: t, fill };
}
