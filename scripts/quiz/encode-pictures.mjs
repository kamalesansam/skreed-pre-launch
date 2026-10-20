// Section 3's answer pictures, step 2 of 2: each master in src/assets/quiz/pics/<key>.jpg (scripts/quiz/prepare-pictures.py)
// to AVIF (q50) and WebP (q72) at 640 and 1100 px wide, and index.json with each key's size, which Quiz.astro reads. The
// folder is git-ignored (the Envato licence does not allow the files to be shared, and the repository is public), so the
// pictures are built on the build machine; without them the quiz shows words only.   node scripts/quiz/encode-pictures.mjs
import sharp from 'sharp';
import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const DIR = fileURLToPath(new URL('../../src/assets/quiz/pics/', import.meta.url));
const WIDTHS = [640, 1100];
const index = {};
let bytes = 0;
for (const f of readdirSync(DIR).filter((n) => /^q\d+-[a-z]+\.jpg$/.test(n)).sort()) {
  const key = f.replace(/\.jpg$/, ''), src = join(DIR, f);
  const { width, height } = await sharp(src).metadata();
  index[key] = { width, height, widths: [] };
  for (const w of WIDTHS) {
    const ww = Math.min(w, width);
    if (index[key].widths.includes(ww)) continue;
    index[key].widths.push(ww);
    const img = sharp(src).resize({ width: ww });
    await img.clone().avif({ quality: 50, effort: 5 }).toFile(join(DIR, `${key}-${ww}.avif`));
    await img.clone().webp({ quality: 72, effort: 6 }).toFile(join(DIR, `${key}-${ww}.webp`));
    bytes += statSync(join(DIR, `${key}-${ww}.avif`)).size;
  }
  console.log(key, `${width}x${height}`, index[key].widths.join(', '));
}
writeFileSync(join(DIR, 'index.json'), `${JSON.stringify(index, null, 1)}\n`);
console.log(`${Object.keys(index).length} pictures; AVIF total ${(bytes / 1024).toFixed(0)} KB`);
