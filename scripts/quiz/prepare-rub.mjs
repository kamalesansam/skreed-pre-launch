// The quiz result's paint swatch (Sam, 2026-11-02: "the paint rub on the page should look exactly how it looks on the
// image"; docs/specs/quiz.md, "The result screen"). Sam's reference is a Canva design and the swatch a Canva element, so
// it stays out of the public repository (src/assets/quiz/rub/ is git-ignored) until he confirms Canva's licence covers
// the site; a build without it draws our own stroke (Smear.astro). This script takes the swatch from his image and
// writes a recolourable copy: its outline as alpha (the dark ground keyed out, the inside filled, the edge feathered)
// and its relief as grey (0.5 where the paint is its own colour, darker in the rim's shadow and the thin tip, lighter in
// the highlights), which the page sets over a fill of the drawn shade with `mix-blend-mode: hard-light`.
//   node scripts/quiz/prepare-rub.mjs <reference image> [x y w h]   (default: the swatch's box in his 2000 x 1125 image)
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [src, ...box] = process.argv.slice(2);
if (!src) { console.error('usage: node scripts/quiz/prepare-rub.mjs <reference image> [x y w h]'); process.exit(1); }
const [X, Y, W, H] = box.length === 4 ? box.map(Number) : [787, 62, 256, 624];
const OUT = fileURLToPath(new URL('../../src/assets/quiz/rub/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const { data, info } = await sharp(src).extract({ left: X, top: Y, width: W, height: H }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const N = W * H, px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
// the ground the swatch sits on, from the crop's corners
const corners = [0, W - 1, (H - 1) * W, N - 1].map(px);
const G = [0, 1, 2].map((k) => corners.reduce((s, c) => s + c[k], 0) / 4);
const dist = (c) => Math.hypot(c[0] - G[0], c[1] - G[1], c[2] - G[2]);
// 1. the outline: paint is whatever stands clear of the ground; everything the ground cannot reach from the border is inside
const paint = new Uint8Array(N);
for (let i = 0; i < N; i++) paint[i] = dist(px(i)) > 30 ? 1 : 0;
const outside = new Uint8Array(N), stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) { const i = stack.pop(); if (outside[i] || paint[i]) continue; outside[i] = 1; const x = i % W, y = (i / W) | 0; if (x > 0) stack.push(i - 1); if (x < W - 1) stack.push(i + 1); if (y > 0) stack.push(i - W); if (y < H - 1) stack.push(i + W); }
// 2. the edge: an anti-aliased pixel is part ground, part paint; its share of paint is how far it stands from the ground
// against the paint's own distance there (the median paint), so the edge keeps the image's softness
const inside = [];
for (let i = 0; i < N; i++) if (!outside[i]) inside.push(i);
const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
const sorted = inside.map((i) => lum(px(i))).sort((a, b) => a - b);
const Yb = sorted[(sorted.length / 2) | 0];
const medD = inside.map((i) => dist(px(i))).sort((a, b) => a - b)[(inside.length / 2) | 0];
const alpha = new Float32Array(N);
for (let i = 0; i < N; i++) {
  if (outside[i]) { alpha[i] = Math.min(1, Math.max(0, (dist(px(i)) - 6) / (medD * 0.55))); continue; }
  const x = i % W, y = (i / W) | 0;
  const nearOut = [i - 1, i + 1, i - W, i + W].some((j) => j >= 0 && j < N && outside[j] && Math.abs((j % W) - x) <= 1 && Math.abs(((j / W) | 0) - y) <= 1);
  alpha[i] = nearOut ? Math.min(1, Math.max(0, dist(px(i)) / (medD * 0.55))) : 1;
}
// 3. the relief, as hard-light grey: under the median paint's lightness it multiplies (s = 0.5 Y / Yb), over it it
// screens (s = 0.5 + 0.5 (Y - Yb) / (1 - Yb)); an edge pixel is read with the ground taken out first
const out = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const a = alpha[i];
  let c = px(i);
  if (a > 0.02 && a < 0.98) c = c.map((v, k) => Math.min(255, Math.max(0, (v - (1 - a) * G[k]) / a)));
  const Yp = lum(c);
  const s = Yp <= Yb ? 0.5 * (Yp / Yb) : 0.5 + 0.5 * ((Yp - Yb) / (1 - Yb));
  const g = Math.round(Math.min(1, Math.max(0, s)) * 255);
  out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = g; out[i * 4 + 3] = Math.round(a * 255);
}
const img = sharp(out, { raw: { width: W, height: H, channels: 4 } });
await img.clone().webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(OUT + 'rub.webp');
await img.clone().png({ compressionLevel: 9 }).toFile(OUT + 'rub.png');
writeFileSync(OUT + 'index.json', JSON.stringify({ width: W, height: H, ground: G.map((v) => Math.round(v)), medianLightness: +Yb.toFixed(4), source: 'Sam\'s reference of 2026-11-02 (a Canva element)', box: [X, Y, W, H] }, null, 2) + '\n');
console.log(`rub: ${W} x ${H}, ground ${G.map((v) => Math.round(v))}, median paint lightness ${Yb.toFixed(3)}, inside ${inside.length} px -> ${OUT}`);
