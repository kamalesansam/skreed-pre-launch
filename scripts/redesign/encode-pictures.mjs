// The redesign's pictures, encoded (docs/specs/redesign.md, section 6): every master that
// scripts/redesign/extract-pdf.py cut from Sam's design becomes an AVIF and its WebP twin at the widths its place on
// the page asks for, never wider than the master, and src/assets/redesign/index.json records each picture's size, its
// widths and whether it carries alpha, which RdPicture.astro reads at build.
//
//   node scripts/redesign/encode-pictures.mjs [masters=assets-src/redesign] [out=src/assets/redesign]
//
// Both folders are git-ignored until Sam says the pictures may go into the public repository; a checkout without them
// runs extract-pdf.py on his PDF and then this.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = resolve(ROOT, process.argv[2] ?? 'assets-src/redesign');
const OUT = resolve(ROOT, process.argv[3] ?? 'src/assets/redesign');

/** the widths a picture is drawn at, by its role (the name's stem); the master's own width closes every list */
const WIDTHS = [
  [/^(hero|glimpse-band|match|proof)$/, [640, 1024]],
  [/^tile-/, [480]],
  [/^product-/, []],
  [/^case-/, [217]],
  // drawn at 416u of the page: 520 px on a 1280 px screen, 1040 at 2x; the master's 1560 for a phone's 86vw at 3x and
  // for 650 px at 2x at the widest
  [/^picker-/, [520, 1040]],
  // the body drawn 60 to 100 CSS px wide on 1x to 3x screens, and its box, with the clear margin, a fifth wider: 128 is
  // the frame's own pixels, and the master's 384 closes the list at 3x
  [/^swatch-/, [128, 256]],
  // drawn 101u wide: 126 px on a 1280 px screen, 158 at the widest and up to 112 on a phone, on 1x to 3x screens; the
  // master's 480 closes the list at 3x
  [/^blob-/, [160, 320]],
];
const AVIF = { quality: 50, effort: 5 };
const WEBP = { quality: 72, effort: 5 };
/** a cut-out's edge is where a low quality shows first */
const AVIF_ALPHA = { quality: 58, effort: 5 };
const WEBP_ALPHA = { quality: 80, alphaQuality: 90, effort: 5 };
/** the picker's five, the swatches and the blobs are flat colour, soft shadow and edges, nothing a low quality can hide in: at 58 the
 * bodies show the codec's blocks and the edges ring on the ground, and at these they cost little (a flat picture is small) */
const AVIF_DRAWN = { quality: 82, effort: 5 };
const WEBP_DRAWN = { quality: 90, alphaQuality: 100, smartSubsample: true, effort: 5 };
const DRAWN = /^(picker|swatch|blob)-/;
/** a blob is one flat colour under its alpha, the PDF's own fill, so only its alpha is resized and every width is that one
 * colour too: a resampler working on the colour leaves it wrong in the thin wisps and at every edge, which is where the
 * brush is, and the codec spends its bytes on that */
const FLAT = /^blob-/;

async function sized(name, m, w) {
  const file = join(SRC, m.file);
  if (!FLAT.test(name)) return sharp(file).resize({ width: w, withoutEnlargement: true });
  const { data, info } = await sharp(file).extractChannel(3).resize({ width: w, withoutEnlargement: true }).raw().toBuffer({ resolveWithObject: true });
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(m.hex.slice(i, i + 2), 16));
  return sharp({ create: { width: info.width, height: info.height, channels: 3, background: { r, g, b } } }).joinChannel(data, { raw: { width: info.width, height: info.height, channels: 1 } });
}

const masters = JSON.parse(await readFile(join(SRC, 'masters.json'), 'utf8'));
await mkdir(OUT, { recursive: true });

const index = {};
/** every encoded file, held until all are made: a dev server may be serving the folder, so nothing in it changes for
 * the minute the encoding takes, and then it changes in one pass */
const files = new Map();
let bytes = 0;
for (const [name, m] of Object.entries(masters)) {
  const rule = WIDTHS.find(([re]) => re.test(name));
  if (!rule) throw new Error(`encode-pictures: no widths for ${name}`);
  const widths = [...rule[1].filter((w) => w < m.width * 0.9), m.width];
  const sizes = {};
  for (const w of widths) {
    const img = await sized(name, m, w);
    const [a, b] = await Promise.all([
      img.clone().avif(DRAWN.test(name) ? AVIF_DRAWN : m.alpha ? AVIF_ALPHA : AVIF).toBuffer(),
      img.clone().webp(DRAWN.test(name) ? WEBP_DRAWN : m.alpha ? WEBP_ALPHA : WEBP).toBuffer(),
    ]);
    files.set(`${name}-${w}.avif`, a);
    files.set(`${name}-${w}.webp`, b);
    sizes[w] = { avif: a.length, webp: b.length };
    bytes += a.length + b.length;
  }
  index[name] = { width: m.width, height: m.height, widths, alpha: !!m.alpha, bytes: sizes, ...(m.shade ? { shade: m.shade, name: m.name, hex: m.hex } : {}), ...(m.family ? { family: m.family, source: m.source, order: m.order } : {}) };
}
// the new files first, then the index that names them, then whatever no picture names any more
await Promise.all([...files].map(([f, data]) => writeFile(join(OUT, f), data)));
await writeFile(join(OUT, 'index.json'), JSON.stringify(index, null, 1) + '\n');
for (const f of await readdir(OUT)) if (/\.(avif|webp)$/.test(f) && !files.has(f)) await rm(join(OUT, f));
console.log(`encode-pictures: ${Object.keys(index).length} pictures, ${(bytes / 1024).toFixed(0)} KB in all, in ${OUT.replace(ROOT + '/', '')}`);
for (const [n, e] of Object.entries(index)) {
  const top = e.bytes[e.width];
  console.log(`  ${n.padEnd(26)} ${String(e.width).padStart(4)} x ${String(e.height).padEnd(4)} widths ${e.widths.join(', ').padEnd(16)} top avif ${(top.avif / 1024).toFixed(1)} KB, webp ${(top.webp / 1024).toFixed(1)} KB`);
}
