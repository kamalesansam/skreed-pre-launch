// Section 4's lightmap and model into src/assets/room/ (docs/specs/section-4.md 6): the bake's PNG becomes a 1024 AVIF
// (q50) with a WebP (q82) fallback through sharp, the GLB is copied as it is (the exporter's float32 attributes; 35 KB
// for the hall, under the 40 KB line, so no quantisation step yet). Run after scripts/room/hall.py:
//   node scripts/room/encode.mjs scripts/room/out
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const src = process.argv[2] ?? 'scripts/room/out';
const dst = 'src/assets/room';
mkdirSync(dst, { recursive: true });
const png = join(src, 'hall-lightmap.png');
const avif = await sharp(png).avif({ quality: 50, effort: 6 }).toBuffer();
const webp = await sharp(png).webp({ quality: 82, effort: 6 }).toBuffer();
writeFileSync(join(dst, 'hall-lightmap.avif'), avif);
writeFileSync(join(dst, 'hall-lightmap.webp'), webp);
copyFileSync(join(src, 'hall.glb'), join(dst, 'hall.glb'));
const report = JSON.parse(readFileSync(join(src, 'report.json'), 'utf8'));
writeFileSync(join(dst, 'hall.json'), JSON.stringify({ scale: report.scale, faces: report.faces, samples: report.samples, bakeSize: report.size, lightmap: report.out, bakeSeconds: report.bake_s }, null, 1) + '\n');
console.log(`lightmap avif ${avif.length} B, webp ${webp.length} B; glb ${statSync(join(dst, 'hall.glb')).size} B; exposure scale ${report.scale.toFixed(3)}`);
