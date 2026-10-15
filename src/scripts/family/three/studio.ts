// The studio and the colour calibration of the family stage (docs/specs/family-page.md 19 and 20), as the prototype
// has them: the procedural studio of 2026-10-09 at its calibrated intensity (a quilted dome and five soft panels, baked
// to a PMREM), and the albedo fit that makes the front case's back read the catalog shade through the tone map under
// ciao's spots (the sample point (0, -0.25) on the outer back has linear radiance a x albedo + b per channel; a and b
// measured with the stage's calibrate() hook, held in calibration.json).
import { BackSide, BufferAttribute, DoubleSide, MathUtils, Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, Scene, SphereGeometry, Vector3 } from 'three';

const DEG = Math.PI / 180;

export interface StudioScene extends Scene { disposeStudio(): void }
export function makeStudio(scale = 1): StudioScene {
  const scene = new Scene() as StudioScene;
  const o = { floor: 0.2, horizon: 0.9, ceiling: 1.15, floorFrom: -35, floorTo: 0, back: 0.3, backFrom: 95, backTo: 135 };
  const panels = [
    { dir: [0.95, 0.05, 0.3], w: 50, h: 60, L: 3.0, r: 40 },
    { dir: [-0.95, 0.05, 0.3], w: 50, h: 60, L: 2.6, r: 40 },
    { dir: [-0.4045, 0.5878, 0.7006], w: 30, h: 12, L: 10, r: 38 },
    { dir: [-0.4957, 0.1323, 0.8586], w: 36, h: 24, L: 0.2, r: 38 },
    { dir: [0.9, 0.15, 0.45], w: 6, h: 50, L: 6, r: 36 },
  ];
  const dome = new SphereGeometry(50, 64, 32);
  const pos = dome.attributes.position, col = new Float32Array(pos.count * 3);
  const ss = (t: number) => t * t * (3 - 2 * t);
  for (let i = 0; i < pos.count; i++) {
    const el = Math.asin(MathUtils.clamp(pos.getY(i) / 50, -1, 1)) / DEG;
    const az = Math.abs(Math.atan2(pos.getX(i), pos.getZ(i))) / DEG;
    let L = o.floor + (o.horizon - o.floor) * ss(MathUtils.clamp((el - o.floorFrom) / (o.floorTo - o.floorFrom), 0, 1)) + (o.ceiling - o.horizon) * MathUtils.clamp((el - 20) / 70, 0, 1);
    const band = MathUtils.clamp(1 - (el - 20) / 70, 0, 1) * MathUtils.clamp((el + 35) / 35, 0, 1);
    L *= 1 - ss(MathUtils.clamp((az - o.backFrom) / (o.backTo - o.backFrom), 0, 1)) * (1 - o.back) * band;
    col.set([L * scale, L * scale, L * scale], i * 3);
  }
  dome.setAttribute('color', new BufferAttribute(col, 3));
  scene.add(new Mesh(dome, new MeshBasicMaterial({ vertexColors: true, side: BackSide })));
  const plane = new PlaneGeometry(1, 1);
  for (const q of panels) {
    const d = new Vector3(q.dir[0], q.dir[1], q.dir[2]).normalize();
    const m = new Mesh(plane, new MeshLambertMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: q.L * scale, side: DoubleSide }));
    m.position.copy(d).multiplyScalar(q.r);
    m.scale.set(2 * q.r * Math.tan(q.w / 2 * DEG), 2 * q.r * Math.tan(q.h / 2 * DEG), 1);
    m.lookAt(0, 0, 0);
    scene.add(m);
  }
  scene.disposeStudio = () => { const r = new Set<{ dispose(): void }>(); scene.traverse((x) => { const mm = x as Mesh; if (mm.isMesh) { r.add(mm.geometry); r.add(mm.material as { dispose(): void }); } }); for (const x of r) x.dispose(); };
  return scene;
}

/* ---------------------------------------------------------------- colour: three's tone maps (r165), forward, inverted per shade */
export type Tone = (c: number[]) => number[];
export const TONE: { neutral: Tone; aces: Tone } = {
  neutral(c) {
    const x = Math.min(c[0], c[1], c[2]), off = x < 0.08 ? x - 6.25 * x * x : 0.04;
    let v = c.map((k) => k - off); const peak = Math.max(v[0], v[1], v[2]);
    if (peak < 0.76) return v;
    const d = 0.24, np = 1 - d * d / (peak + d - 0.76); v = v.map((k) => k * np / peak);
    const g = 1 - 1 / (0.15 * (peak - np) + 1); return v.map((k) => k + (np - k) * g);
  },
  aces(c) {
    const M = (m: number[][], u: number[]) => [0, 1, 2].map((i) => m[i][0] * u[0] + m[i][1] * u[1] + m[i][2] * u[2]);
    const u = M([[0.59719, 0.35458, 0.04823], [0.076, 0.90834, 0.01566], [0.0284, 0.13383, 0.83777]], c.map((k) => k / 0.6))
      .map((v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081));
    return M([[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]], u).map((k) => Math.min(1, Math.max(0, k)));
  },
};

/** Damped Newton on the full 3 x 3 Jacobian (the highlight roll-off mixes the channels), never below 0. */
export function toneInverse(y: number[], f: Tone): number[] {
  const err = (o: number[]) => Math.hypot(y[0] - o[0], y[1] - o[1], y[2] - o[2]);
  let c = y.slice(), o = f(c), e = err(o);
  for (let it = 0; it < 60 && e > 1e-6; it++) {
    const J = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let k = 0; k < 3; k++) { const h = 1e-4 + c[k] * 1e-3, cp = c.slice(); cp[k] += h; const q = f(cp); for (let i = 0; i < 3; i++) J[i][k] = (q[i] - o[i]) / h; }
    const [[a, b, cc], [d, ee, ff], [g, hh, ii]] = J, A = ee * ii - ff * hh, B = ff * g - d * ii, C = d * hh - ee * g, det = a * A + b * B + cc * C;
    if (Math.abs(det) < 1e-12) break;
    const inv = [[A, cc * hh - b * ii, b * ff - cc * ee], [B, a * ii - cc * g, cc * d - a * ff], [C, b * g - a * hh, a * ee - b * d]];
    const r = [y[0] - o[0], y[1] - o[1], y[2] - o[2]], dx = [0, 1, 2].map((i) => (inv[i][0] * r[0] + inv[i][1] * r[1] + inv[i][2] * r[2]) / det);
    let t = 1, nc: number[] = c, no: number[] = o, ne = e;
    for (let ls = 0; ls < 20; ls++, t /= 2) { nc = c.map((v, i) => Math.max(0, Math.min(1e3, v + t * dx[i]))); no = f(nc); ne = err(no); if (ne < e) break; }
    if (!(ne < e)) break;
    c = nc; o = no; e = ne;
  }
  return c;
}

const enc1 = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055);
/**
 * The albedo fit (simulated over all 240 shades with Neutral: dE00 median 0, p90 1.4, max 4.5, 227 under 2): minimise
 * the sRGB-encoded error of F(a x albedo + b) against the shade, albedo in [0, 1] (projected Gauss-Newton with a line
 * search; starts from the clamped analytic guess and from mid grey, keeps the better).
 */
export function albedoFit(y: number[], f: Tone, a: number, b: number, guess: number[]): number[] {
  const ye = y.map(enc1), E = (al: number[]): [number[], number[]] => { const o = f(al.map((v) => v * a + b)).map(enc1); return [o, o.map((v, i) => v - ye[i])]; };
  const run = (s0: number[]): [number[], number] => {
    let x = s0.map((v) => Math.min(1, Math.max(0, v))), [o, r] = E(x), e = Math.hypot(...r);
    for (let it = 0; it < 50 && e > 1e-5; it++) {
      const J = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let k = 0; k < 3; k++) { const h = 1e-4, xp = x.slice(); xp[k] = x[k] + (x[k] + h > 1 ? -h : h); const [op] = E(xp), s = xp[k] - x[k]; for (let i = 0; i < 3; i++) J[i][k] = (op[i] - o[i]) / s; }
      const JT = [0, 1, 2].map((k) => [0, 1, 2].map((i) => J[i][k])), mu = 1e-6;
      const A = [0, 1, 2].map((p) => [0, 1, 2].map((q) => JT[p].reduce((s, v, i) => s + v * J[i][q], 0) + (p === q ? mu : 0)));
      const g = [0, 1, 2].map((p) => -JT[p].reduce((s, v, i) => s + v * r[i], 0));
      const [[a1, b1, c1], [d1, e1, f1], [g1, h1, i1]] = A, AA = e1 * i1 - f1 * h1, BB = f1 * g1 - d1 * i1, CC = d1 * h1 - e1 * g1, det = a1 * AA + b1 * BB + c1 * CC;
      if (Math.abs(det) < 1e-18) break;
      const inv = [[AA, c1 * h1 - b1 * i1, b1 * f1 - c1 * e1], [BB, a1 * i1 - c1 * g1, c1 * d1 - a1 * f1], [CC, b1 * g1 - a1 * h1, a1 * e1 - b1 * d1]];
      const dx = [0, 1, 2].map((p) => (inv[p][0] * g[0] + inv[p][1] * g[1] + inv[p][2] * g[2]) / det);
      let t = 1, nx: number[] = x, no: number[] = o, nr: number[] = r, ne = e;
      for (let ls = 0; ls < 25; ls++, t /= 2) { nx = x.map((v, i) => Math.min(1, Math.max(0, v + t * dx[i]))); [no, nr] = E(nx); ne = Math.hypot(...nr); if (ne < e) break; }
      if (!(ne < e)) break;
      x = nx; o = no; r = nr; e = ne;
    }
    return [x, e];
  };
  let best: [number[], number] | null = null;
  for (const s0 of [guess, [0.5, 0.5, 0.5], y.map((v) => v / a), guess.map((v) => v * 0.5)]) { const R = run(s0); if (!best || R[1] < best[1]) best = R; }
  return best![0];
}
