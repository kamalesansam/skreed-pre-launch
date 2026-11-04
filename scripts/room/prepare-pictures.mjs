// Section 4's pictures, the scenes' backgrounds of the new version (Sam, 2026-11-04: "i want another version of the
// product pages, where we will be replacing the backround, everything else looks the same ... these are the new
// backrounds for each product, they're 2d only"; docs/specs/section-4-pictures.md). His five 3840 x 2160 PNGs, one per
// product, encoded for the carousel's planes and the poster column as each scene's still in both classes: the wide
// 1920 x 1000 (the loops' aspect, carousel-math.ts LOOP_ASPECT, so the planes' cover fit is unchanged) and the portrait
// 1080 x 1920, each cover-cropped about the centre, AVIF and WebP, at the highest quality inside the lines below (smooth
// studio gradients band at low quality, so the floors sit high). His uploads never go into the public repository: the
// outputs land in src/assets/room/pictures/, which is git-ignored, and a build without them draws the loops (the old
// version, config/room.ts). Run on every machine that builds the site:
//   node scripts/room/prepare-pictures.mjs "<the unzipped backgrounds folder>" [--out src/assets/room/pictures]
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

/** our scene ids by his file names (the product each picture is for, ROOM_SCENES' products) */
const NAMES = Object.freeze({
  'for lilac phonecase': 'cove',      // the phone case, Lilac
  'for airpod case': 'grove',         // the AirPods case, Sage
  'for magsafe wallet': 'ember',      // the MagSafe wallet, Desert
  'for lenskin': 'palace',            // the Lenskin, Ballerina
  'for airpod max': 'dawn',           // the AirPods Max case, Pastel
});
const SIZE = { wide: [1920, 1000], portrait: [1080, 1920] };
const KB = 1000;
const LINES = { wide: { avif: 220 * KB, webp: 320 * KB }, portrait: { avif: 200 * KB, webp: 300 * KB } };
const START = { avif: 80, webp: 92 }, FLOOR = { avif: 62, webp: 80 };

const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out');
const oi = args.indexOf('--out');
const root = new URL('../../', import.meta.url).pathname;
const out = oi >= 0 ? args[oi + 1] : join(root, 'src/assets/room/pictures');
if (!src || !existsSync(src)) { console.error('usage: node scripts/room/prepare-pictures.mjs "<folder holding the five PNGs>" [--out <dir>]'); process.exit(1); }

const found = {};
for (const f of readdirSync(src)) {
  if (!f.toLowerCase().endsWith('.png')) continue;
  const id = NAMES[f.slice(0, -4).toLowerCase().trim()];
  if (id) found[id] = join(src, f);
}
const missing = Object.values(NAMES).filter((id) => !found[id]);
if (missing.length) { console.error(`pictures: no PNG for ${missing.join(', ')} in ${src} (the names: ${Object.keys(NAMES).join(', ')})`); process.exit(1); }

mkdirSync(out, { recursive: true });
const record = {};
for (const id of Object.values(NAMES)) {
  record[id] = {};
  for (const [cls, [w, h]] of Object.entries(SIZE)) {
    for (const fmt of ['avif', 'webp']) {
      let q = START[fmt], buf;
      for (;;) {
        const img = sharp(found[id]).resize(w, h, { fit: 'cover', position: 'centre', kernel: 'lanczos3' });
        buf = await (fmt === 'avif'
          ? img.avif({ quality: q, effort: 9, chromaSubsampling: '4:4:4', bitdepth: 8 })
          : img.webp({ quality: q, effort: 6, smartSubsample: true })).toBuffer();
        if (buf.length <= LINES[cls][fmt] || q <= FLOOR[fmt]) break;
        q -= 2;
      }
      const name = `${id}-${cls}.${fmt}`;
      writeFileSync(join(out, name), buf);
      record[id][`${cls}.${fmt}`] = { bytes: buf.length, quality: q, line: LINES[cls][fmt] };
      console.log(`${name}: ${(buf.length / KB).toFixed(1)} KB at quality ${q}${buf.length > LINES[cls][fmt] ? ' (over the line at the floor)' : ''}`);
    }
  }
}
writeFileSync(join(out, 'pictures.json'), JSON.stringify({ size: SIZE, lines: LINES, start: START, floor: FLOOR, files: record }, null, 1) + '\n');
console.log(`pictures: five scenes into ${out}`);
