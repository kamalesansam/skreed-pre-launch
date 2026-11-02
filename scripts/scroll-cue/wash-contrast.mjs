// The family story's words over the per-shade wash (docs/specs/scroll-cue.md D6, E-F2): Pearl Whisper's contrast, computed
// from family.css's own gradient (#tint: radial-gradient(88.85% 121.19% at 43.49% 112.49%, --tint2 4.96%, --tint1 54.38%,
// --night 93.49%), the pair from tint.ts's tintOf) for all 240 shades, as the median of the pixels behind the words' text
// box: the shipped place (two lines of the Plex capitals at the bottom right of a phone, one line on the wide layout), and
// the places considered against it (one line of the capitals there, and one line of Open Sans at either bottom corner).
// The boxes are the frames' measures (scripts/scroll-cue/frames.mjs; iteration 4's frames.log) and the CSS they follow.
//   node scripts/scroll-cue/wash-contrast.mjs            a table per place and size: worst median, shades under 4.5:1
//   node scripts/scroll-cue/wash-contrast.mjs --json     the figures as JSON (every shade)
import { readFileSync } from 'node:fs';
import { tintOf } from '../../src/scripts/family/tint.ts';

const data = JSON.parse(readFileSync(new URL('../../docs/data/shades-240.json', import.meta.url), 'utf8'));
const shades = data.families.flatMap((f) => f.shades.map((s) => ({ id: s.id, hex: s.hex })));
const NIGHT = '#050506', PEARL = '#f7f6f3';
const rgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const L_PEARL = lum(rgb(PEARL));
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
/** the gradient's colour at (x, y) in a W x H viewport: CSS interpolates the stops in sRGB */
function washAt(x, y, W, H, tint1, tint2) {
  const t = Math.hypot((x - 0.4349 * W) / (0.8885 * W), (y - 1.1249 * H) / (1.2119 * H));
  if (t <= 0.0496) return tint2;
  if (t <= 0.5438) return lerp(tint2, tint1, (t - 0.0496) / (0.5438 - 0.0496));
  if (t <= 0.9349) return lerp(tint1, rgb(NIGHT), (t - 0.5438) / (0.9349 - 0.5438));
  return rgb(NIGHT);
}
/** the median contrast of Pearl Whisper over the box [l, t, r, b] for one shade */
function median(box, W, H, hex) {
  const [dark, light] = tintOf(hex), t1 = rgb(dark), t2 = rgb(light);
  const v = [];
  for (let y = Math.floor(box[1]) + 0.5; y < box[3]; y++) for (let x = Math.floor(box[0]) + 0.5; x < box[2]; x++) v.push((L_PEARL + 0.05) / (lum(washAt(x, y, W, H, t1, t2)) + 0.05));
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
}
const ADV = 8.4, PLEX_LINE = 18 * ADV, OPEN_SANS_LINE = 121;   // the capitals' 0.6 em advance at 14 px; the Open Sans 600 line as drawn in iteration 1
const inset = (w) => Math.min(56, Math.max(16, 0.035 * w));
/** the story's bottom on a phone: --to-top-bottom 14 + --hit 44 + --s0 4 above the bottom; on the wide layout --inset */
const PLACES = {
  'two lines of Plex capitals, bottom right (shipped on phones)': (w, h) => (w >= 900 ? null : [w - inset(w) - 9 * ADV, h - 62 - 34.8, w - inset(w), h - 62]),
  'one line of Plex capitals, bottom right (the wide layout\'s; considered on phones)': (w, h) => (w >= 900 ? [w - inset(w) - PLEX_LINE, h - inset(w) - 16, w - inset(w), h - inset(w) + 2] : [w - inset(w) - PLEX_LINE, h - 62 - 14, w - inset(w), h - 62]),
  'one line of Open Sans 600, bottom right (iteration 2)': (w, h) => (w >= 900 ? null : [w - inset(w) - OPEN_SANS_LINE, h - 62 - 14, w - inset(w), h - 62]),
  'one line of Open Sans 600, bottom left (iteration 1)': (w, h) => (w >= 900 ? null : [inset(w), h - 62 - 14, inset(w) + OPEN_SANS_LINE, h - 62]),
};
const SIZES = [[360, 780], [390, 844], [430, 932], [1280, 800]];
const out = {};
for (const [place, boxOf] of Object.entries(PLACES)) {
  out[place] = {};
  for (const [w, h] of SIZES) {
    const box = boxOf(w, h);
    if (!box) continue;
    const rows = shades.map((s) => ({ id: s.id, c: median(box, w, h, s.hex) })).sort((a, b) => a.c - b.c);
    out[place][`${w}x${h}`] = { box: box.map((v) => +v.toFixed(1)), worst: rows[0], under45: rows.filter((r) => r.c < 4.5).length, named: Object.fromEntries(['frosty-white-01', 'mellow-yellow-01', 'blissful-blue-01'].map((id) => [id, +rows.find((r) => r.id === id).c.toFixed(2)])), all: process.argv.includes('--json') ? rows.map((r) => [r.id, +r.c.toFixed(2)]) : undefined };
  }
}
if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 1)); }
else {
  for (const [place, sizes] of Object.entries(out)) {
    console.log(`\n${place}`);
    for (const [size, r] of Object.entries(sizes)) console.log(`  ${size.padEnd(9)} box ${JSON.stringify(r.box).padEnd(34)} worst ${r.worst.c.toFixed(2)}:1 (${r.worst.id})  under 4.5:1: ${String(r.under45).padStart(3)} of 240  first shades: ${Object.entries(r.named).map(([k, v]) => `${k.split('-').slice(0, -1).join('-')} ${v}`).join(', ')}`);
  }
}
