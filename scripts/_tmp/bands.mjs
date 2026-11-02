// the bands' legibility (docs/specs/section-5-liquid.md AC8): along the jar's axis in a frame (or a still), the runs of
// one colour, each run's middle sampled as a 6 x 6 CSS px patch, its mean sRGB colour in CIELAB, and delta E (CIE76)
// between adjacent runs
import sharp from 'sharp';
const [file, axisCss, y0Css, y1Css, dprArg] = process.argv.slice(2);
const dpr = Number(dprArg ?? 2), ax = Math.round(Number(axisCss) * dpr), y0 = Math.round(Number(y0Css) * dpr), y1 = Math.round(Number(y1Css) * dpr);
const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lab = ([r, g, b]) => {
  const R = lin(r), G = lin(g), B = lin(b);
  const X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047, Y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B, Z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
};
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
// the runs: rows whose colour (a 3 px wide strip on the axis) stays within 18 of the run's first row in every channel
const row = (y) => { const s = [0, 0, 0]; for (let dx = -1; dx <= 1; dx++) { const p = px(ax + dx, y); s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; } return s.map((v) => v / 3); };
const runs = []; let start = y0, ref = row(y0);
for (let y = y0 + 1; y <= y1; y++) { const c = row(y); if (y === y1 || c.some((v, k) => Math.abs(v - ref[k]) > 18)) { runs.push([start, y - 1]); start = y; ref = c; } }
const half = Math.round(3 * dpr);
const bands = runs.filter(([a, b]) => b - a + 1 >= 8 * dpr).map(([a, b]) => {
  const m = Math.round((a + b) / 2), s = [0, 0, 0]; let n = 0;
  for (let y = m - half; y < m + half; y++) for (let x = ax - half; x < ax + half; x++) { const p = px(x, y); s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; n++; }
  const c = s.map((v) => v / n);
  return { css: [(a / dpr).toFixed(1), (b / dpr).toFixed(1)], mid: (m / dpr).toFixed(1), rgb: c.map((v) => v.toFixed(1)).join(','), hex: hex(c), lab: lab(c) };
});
for (const b of bands) console.log(`run ${b.css[0]} to ${b.css[1]} CSS px, middle ${b.mid}: ${b.hex} (${b.rgb}) Lab ${b.lab.map((v) => v.toFixed(1)).join(', ')}`);
for (let i = 1; i < bands.length; i++) console.log(`  delta E between ${bands[i - 1].hex} (above) ... ${bands[i].hex}: ${dE(bands[i - 1].lab, bands[i].lab).toFixed(1)}`);
