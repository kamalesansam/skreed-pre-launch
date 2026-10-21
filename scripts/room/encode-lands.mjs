// Section 4 part two: the four lands' approved masters into src/assets/room/lands/ (docs/specs/section-4-world.md 3, "The
// crops" and "Option A's depth maps"; 6, the land picture and depth map lines), through sharp:
//   node scripts/room/encode-lands.mjs [--src assets-src/room/lands] [--out src/assets/room/lands] [--decoded <dir>]
// Per land, in src/data/room-lands.json's order (ROOM_PRODUCTS' ids, the catalog's order), each master read only after its
// SHA-256 matches the one room-lands.json records (so what is encoded is what Sam approved, and nothing else):
//   land-<id>-portrait.{avif,webp}         720 x 1280, from the 1406 x 2500 portrait
//   land-<id>-wide.{avif,webp}             1920 x 1200, from the 4000 x 2500 wide (16:10)
//   land-<id>-{portrait,wide}-depth.*      a quarter of each crop's encoded size, 180 x 320 and 480 x 300, 8-bit grey
//                                          (near is light, as the depth call returned it)
// AVIF starts at q60 (4:4:4, so the products' saturated edges keep their colour; 4:2:0 saved about 6 percent) and WebP at
// q80, at the encoders' highest effort (9 and 6), and each steps its quality down by 1 until the file is inside its line
// (KB of 1024 B, as stored): portrait 80 KB AVIF and 128 KB WebP, wide 110 and 176 KB, depth 12 and 20 KB (spec 6,
// scripts/hero/budget.mjs's PIC lines). No ICC profile and no metadata are written: the island reads the bytes as display
// values (spec 5, "The pictures": untagged). A depth AVIF is grey in three channels (sharp writes no 4:0:0), its chroma
// planes flat; the island reads one. encoded.json beside the files records each one's size, dimensions, quality and the
// master it came from. --decoded writes each file decoded back to PNG with sizes.json, for lands.py sheetfinal.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SRC = arg('--src', 'assets-src/room/lands');
const OUT = arg('--out', 'src/assets/room/lands');
const DECODED = arg('--decoded', null);
const KB = 1024;
const LINES = { portrait: { avif: 80 * KB, webp: 128 * KB }, wide: { avif: 110 * KB, webp: 176 * KB }, depth: { avif: 12 * KB, webp: 20 * KB } };
const SIZE = { portrait: [720, 1280], wide: [1920, 1200] };
const START = { avif: 60, webp: 80 };

const record = JSON.parse(readFileSync('src/data/room-lands.json', 'utf8'));
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

async function fit(input, w, h, fmt, line, grey) {
  // the highest quality from START down whose file is inside the line
  for (let q = START[fmt]; q >= 1; q--) {
    let img = sharp(input).resize(w, h, { fit: 'cover', kernel: 'lanczos3' });
    if (grey) img = img.greyscale();
    const buf = await (fmt === 'avif'
      ? img.avif({ quality: q, effort: 9, chromaSubsampling: grey ? '4:2:0' : '4:4:4', bitdepth: 8 })
      : img.webp({ quality: q, effort: 6, smartSubsample: !grey })).toBuffer();
    if (buf.length <= line) return { buf, q };
  }
  throw new Error(`${input}: no ${fmt} quality fits ${line} B`);
}

mkdirSync(OUT, { recursive: true });
if (DECODED) mkdirSync(DECODED, { recursive: true });
const manifest = { about: 'scripts/room/encode-lands.mjs, from the masters src/data/room-lands.json names (assets-src/room/lands/, sums in its SHA256SUMS)', files: {} };
for (const land of record.lands) {
  for (const cls of ['portrait', 'wide']) {
    for (const [kind, key] of [['picture', cls], ['depth', `${cls}-depth`]]) {
      const c = land.classes[key];
      const master = join(SRC, c.file);
      const got = sha(master);
      if (got !== c.sha256) throw new Error(`${master}: sha256 ${got}, room-lands.json records ${c.sha256}`);
      const [w0, h0] = SIZE[cls];
      const [w, h] = kind === 'depth' ? [w0 / 4, h0 / 4] : [w0, h0];
      for (const fmt of ['avif', 'webp']) {
        const line = kind === 'depth' ? LINES.depth[fmt] : LINES[cls][fmt];
        const { buf, q } = await fit(master, w, h, fmt, line, kind === 'depth');
        const name = `land-${land.id}-${key}.${fmt}`;
        writeFileSync(join(OUT, name), buf);
        const meta = await sharp(buf).metadata();
        if (meta.width !== w || meta.height !== h) throw new Error(`${name}: ${meta.width} x ${meta.height}, want ${w} x ${h}`);
        manifest.files[name] = { bytes: buf.length, line, quality: q, width: w, height: h, from: c.file, from_sha256: c.sha256 };
        if (DECODED) await sharp(buf).png().toFile(join(DECODED, `${name}.png`));
        console.log(`${name}: ${(buf.length / KB).toFixed(1)} KB (line ${line / KB} KB), q${q}, ${w} x ${h}`);
      }
    }
  }
}
writeFileSync(join(OUT, 'encoded.json'), JSON.stringify(manifest, null, 1) + '\n');
if (DECODED) writeFileSync(join(DECODED, 'sizes.json'), JSON.stringify(manifest.files, null, 1) + '\n');
