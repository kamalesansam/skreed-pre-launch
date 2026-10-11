// simulate the front case's sample point for every shade: albedo from the inverse, then forward; dE2000 and channel error
const { TONE, toneInverse } = require('./tone.cjs'); const { albedoFit } = require('./fit.cjs');
const d = require('/home/user/skreed-pre-launch/docs/data/shades-240.json');
const lin = (h) => [1, 3, 5].map((k) => { const c = parseInt(h.slice(k, k + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const enc = (v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
const lab = (rgb) => { const c = rgb.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  let X = (0.4124 * c[0] + 0.3576 * c[1] + 0.1805 * c[2]) / 0.95047, Y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], Z = (0.0193 * c[0] + 0.1192 * c[1] + 0.9505 * c[2]) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; };
function de00([L1, a1, b1], [L2, a2, b2]) {
  const R = Math.PI / 180, C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1, ap2 = (1 + G) * a2, Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const h = (b, a) => { const v = Math.atan2(b, a) / R; return v < 0 ? v + 360 : v; }, hp1 = h(b1, ap1), hp2 = h(b2, ap2);
  const dL = L2 - L1, dC = Cp2 - Cp1; let dh = hp2 - hp1; if (Cp1 * Cp2 === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(dh / 2 * R), Lb = (L1 + L2) / 2, Cpb = (Cp1 + Cp2) / 2;
  let hb = hp1 + hp2; if (Cp1 * Cp2 !== 0) { if (Math.abs(hp1 - hp2) > 180) hb += hp1 + hp2 < 360 ? 360 : -360; hb /= 2; }
  const T = 1 - 0.17 * Math.cos((hb - 30) * R) + 0.24 * Math.cos(2 * hb * R) + 0.32 * Math.cos((3 * hb + 6) * R) - 0.2 * Math.cos((4 * hb - 63) * R);
  const SL = 1 + 0.015 * (Lb - 50) ** 2 / Math.sqrt(20 + (Lb - 50) ** 2), SC = 1 + 0.045 * Cpb, SH = 1 + 0.015 * Cpb * T;
  const RT = -2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hb - 275) / 25) ** 2)) * R);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}
const a = +process.argv[2] || 4.3596, b = +process.argv[3] || 0.02164;
for (const [nm, f] of [['neutral', TONE.neutral], ['aces', TONE.aces]]) {
  const rows = [];
  for (const fam of d.families) for (const s of fam.shades) {
    const x = toneInverse(lin(s.hex), f), alb = albedoFit(lin(s.hex), f, a, b, x.map((v) => (v - b) / a));
    const out = f(alb.map((v) => v * a + b)).map(enc), t = [1, 3, 5].map((k) => parseInt(s.hex.slice(k, k + 2), 16));
    rows.push([de00(lab(t), lab(out)), s.name, s.hex, out.join(',')]);
  }
  rows.sort((p, q) => p[0] - q[0]); const q = (k) => rows[k][0].toFixed(2);
  console.log(nm, 'dE00 median', q(120), 'p90', q(216), 'max', q(239), '| under 2:', rows.filter((r) => r[0] < 2).length, 'of 240');
  console.log('  worst:', rows.slice(-4).map((r) => `${r[1]} ${r[2]} -> ${r[3]} (${r[0].toFixed(1)})`).join(' | '));
}
