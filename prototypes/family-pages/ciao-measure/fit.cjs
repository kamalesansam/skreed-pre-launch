// albedo fit: minimise the sRGB-encoded error of F(a x albedo + b) against the shade, albedo in [0, 1] (projected
// Gauss-Newton with a line search; starts from the clamped analytic guess and from mid grey, keeps the better)
const enc1 = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055);
function albedoFit(y, f, a, b, guess) {
  const ye = y.map(enc1), E = (al) => { const o = f(al.map((v) => v * a + b)).map(enc1); return [o, o.map((v, i) => v - ye[i])]; };
  const run = (s0) => {
    let x = s0.map((v) => Math.min(1, Math.max(0, v))), [o, r] = E(x), e = Math.hypot(...r);
    for (let it = 0; it < 50 && e > 1e-5; it++) {
      const J = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let k = 0; k < 3; k++) { const h = 1e-4, xp = x.slice(); xp[k] = x[k] + (x[k] + h > 1 ? -h : h); const [op] = E(xp), s = xp[k] - x[k]; for (let i = 0; i < 3; i++) J[i][k] = (op[i] - o[i]) / s; }
      // normal equations (J^T J + mu I) d = -J^T r
      const JT = [0, 1, 2].map((k) => [0, 1, 2].map((i) => J[i][k])), mu = 1e-6;
      const A = [0, 1, 2].map((p) => [0, 1, 2].map((q) => JT[p].reduce((s, v, i) => s + v * J[i][q], 0) + (p === q ? mu : 0)));
      const g = [0, 1, 2].map((p) => -JT[p].reduce((s, v, i) => s + v * r[i], 0));
      const [[a1, b1, c1], [d1, e1, f1], [g1, h1, i1]] = A, AA = e1 * i1 - f1 * h1, BB = f1 * g1 - d1 * i1, CC = d1 * h1 - e1 * g1, det = a1 * AA + b1 * BB + c1 * CC;
      if (Math.abs(det) < 1e-18) break;
      const inv = [[AA, c1 * h1 - b1 * i1, b1 * f1 - c1 * e1], [BB, a1 * i1 - c1 * g1, c1 * d1 - a1 * f1], [CC, b1 * g1 - a1 * h1, a1 * e1 - b1 * d1]];
      const dx = [0, 1, 2].map((p) => (inv[p][0] * g[0] + inv[p][1] * g[1] + inv[p][2] * g[2]) / det);
      let t = 1, nx, no, nr, ne;
      for (let ls = 0; ls < 25; ls++, t /= 2) { nx = x.map((v, i) => Math.min(1, Math.max(0, v + t * dx[i]))); [no, nr] = E(nx); ne = Math.hypot(...nr); if (ne < e) break; }
      if (!(ne < e)) break;
      x = nx; o = no; r = nr; e = ne;
    }
    return [x, e];
  };
  let best = null;
  for (const s0 of [guess, [0.5, 0.5, 0.5], y.map((v) => v / a), guess.map((v) => v * 0.5)]) { const R = run(s0); if (!best || R[1] < best[1]) best = R; }
  return best[0];
}
module.exports = { albedoFit };
