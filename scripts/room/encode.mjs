// Section 4's lightmaps and models into src/assets/room/ (docs/specs/section-4.md 6): a bake's PNG becomes a 1024 AVIF
// (q50) with a WebP (q82) fallback through sharp, the GLB is copied as it is (the exporter's float32 attributes; 35 KB
// for the hall, under its 40 KB line, so no quantisation step yet). Run after scripts/room/hall.py or universe.py:
//   node scripts/room/encode.mjs scripts/room/out          (the hall: hall.glb, hall-lightmap.png, report.json)
//   node scripts/room/encode.mjs scripts/room/out room     (the universe: room.glb, room-lightmap.png, room-report.json)
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const src = process.argv[2] ?? 'scripts/room/out';
const which = process.argv[3] === 'room' ? 'room' : 'hall';
const dst = 'src/assets/room';
mkdirSync(dst, { recursive: true });
const png = join(src, `${which}-lightmap.png`);
const avif = await sharp(png).avif({ quality: 50, effort: 6 }).toBuffer();
const webp = await sharp(png).webp({ quality: 82, effort: 6 }).toBuffer();
writeFileSync(join(dst, `${which}-lightmap.avif`), avif);
writeFileSync(join(dst, `${which}-lightmap.webp`), webp);
copyFileSync(join(src, `${which}.glb`), join(dst, `${which}.glb`));
const report = JSON.parse(readFileSync(join(src, which === 'room' ? 'room-report.json' : 'report.json'), 'utf8'));
const meta = { scale: report.scale, faces: report.faces, samples: report.samples, bakeSize: report.size, lightmap: report.out, bakeSeconds: report.bake_s };
if (which === 'room') Object.assign(meta, { median: report.median, radius: report.radius, height: report.height, doorX: report.door_x, pedestals: report.pedestals, ceiling: report.ceiling });
writeFileSync(join(dst, `${which}.json`), JSON.stringify(meta, null, 1) + '\n');
console.log(`${which}: lightmap avif ${avif.length} B, webp ${webp.length} B; glb ${statSync(join(dst, `${which}.glb`)).size} B; exposure scale ${report.scale.toFixed(3)}`);
