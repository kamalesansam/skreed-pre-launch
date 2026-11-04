// The favicon set (CHECKLIST G6) from Sam's favicon picture of 2026-11-04 ("use this as the favicon for the site"): the
// Skreed mark in Urban Slate on a dark ground, outlined in a hairline of shade colours. His 2000 x 2000 picture stays
// outside the repository; the files below are cut from it. The outline is a few pixels wide in the picture, so at tab
// sizes (16 to 48 px) it falls under a tenth of a pixel and only the mark and the ground are left: icon.svg draws those
// two in vector from docs/brand/logo/skreed-logomark.svg, and favicon.ico (16, 32 and 48 px PNGs in one ICO) is cut
// from the picture at the same framing. apple-touch-icon.png (180), icon-192.png and icon-512.png are cut from the
// picture with more room round the mark, where the outline shows. Writes those five and manifest.webmanifest.
//   node scripts/site/icons.mjs "<the favicon picture>"
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const ROOT = new URL('../../', import.meta.url);
const PEARL = '#F7F6F3', SLATE = '#383F43';   // DESIGN.md tokens; Slate is the mark's fill in the picture (#393F44 read)
const TAB = 0.86, APP = 0.72;           // the mark's height as a share of the square: tab icons, then app icons

const file = process.argv[2];
if (!file) throw new Error('usage: node scripts/site/icons.mjs "<the favicon picture>"');
const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const at = (x, y) => { const i = (y * info.width + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
const ground = at(4, 4);
const GROUND = '#' + ground.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase();

// the mark's box: every pixel that differs from the ground by more than a little
let [x0, y0, x1, y1] = [info.width, info.height, -1, -1];
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
  const p = at(x, y);
  if (Math.abs(p[0] - ground[0]) + Math.abs(p[1] - ground[1]) + Math.abs(p[2] - ground[2]) <= 12) continue;
  if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
}
if (x1 < 0) throw new Error(`${file}: no mark found on the ground ${GROUND}`);
const [cx, cy, mh] = [(x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2, y1 - y0 + 1];

/** a square about the mark's centre, the mark `share` of its height, at `size` px (the ground padded in where needed) */
const cut = (share, size) => {
  const side = Math.round(mh / share), left = Math.round(cx - side / 2), top = Math.round(cy - side / 2);
  const pad = Math.max(0, -left, -top, left + side - info.width, top + side - info.height);
  return sharp(file).removeAlpha()
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: GROUND })
    .extract({ left: left + pad, top: top + pad, width: side, height: side })
    .resize(size, size, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 }).toBuffer();
};

const src = readFileSync(new URL('docs/brand/logo/skreed-logomark.svg', ROOT), 'utf8');
const paths = [...src.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
if (paths.length !== 2) throw new Error(`skreed-logomark.svg: expected 2 paths, found ${paths.length}`);
const [W, H] = [1207.63, 1312.81], S = Math.round(H / TAB);   // the mark's viewBox and the square it sits in
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" fill="${GROUND}"/>` +
  `<g transform="translate(${((S - W) / 2).toFixed(3)} ${((S - H) / 2).toFixed(3)})" fill="${SLATE}">${paths.map((d) => `<path d="${d}"/>`).join('')}</g></svg>\n`;
writeFileSync(new URL('public/icon.svg', ROOT), svg);

writeFileSync(new URL('public/apple-touch-icon.png', ROOT), await cut(APP, 180));
writeFileSync(new URL('public/icon-192.png', ROOT), await cut(APP, 192));
writeFileSync(new URL('public/icon-512.png', ROOT), await cut(APP, 512));

// ICO: a 6-byte header, one 16-byte entry per image, then the PNG payloads
const imgs = await Promise.all([16, 32, 48].map(async (s) => [s, await cut(TAB, s)]));
const head = Buffer.alloc(6 + 16 * imgs.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
let offset = head.length;
imgs.forEach(([s, buf], i) => {
  const e = 6 + 16 * i;
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += buf.length;
});
writeFileSync(new URL('public/favicon.ico', ROOT), Buffer.concat([head, ...imgs.map(([, b]) => b)]));

// the SVG leaves the manifest's list: an installed icon is drawn large, where the outline belongs, so the PNGs serve it
const manifest = {
  name: 'Skreed', short_name: 'Skreed', start_url: '/', display: 'browser', background_color: PEARL, theme_color: PEARL,
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
};
writeFileSync(new URL('public/manifest.webmanifest', ROOT), JSON.stringify(manifest, null, 2) + '\n');
console.log(`icons: ground ${GROUND}, mark ${x1 - x0 + 1} x ${mh} at (${x0}, ${y0}); icon.svg, favicon.ico (16/32/48), apple-touch-icon.png, icon-192.png, icon-512.png, manifest.webmanifest`);
