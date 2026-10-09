// The favicon set (CHECKLIST G6) from the Skreed mark (docs/brand/logo/skreed-logomark.svg): the mark in Urban Slate,
// centred on a Pearl Whisper square. Writes public/icon.svg, favicon.ico (16, 32 and 48 px PNGs in one ICO),
// apple-touch-icon.png (180), icon-192.png, icon-512.png and manifest.webmanifest. Rasterised by Playwright's Chromium.
//   node scripts/site/icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const ROOT = new URL('../../', import.meta.url);
const PEARL = '#F7F6F3', SLATE = '#383F43';   // DESIGN.md tokens --pearl-whisper and --urban-slate
const src = readFileSync(new URL('docs/brand/logo/skreed-logomark.svg', ROOT), 'utf8');
const paths = [...src.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
if (paths.length !== 2) throw new Error(`skreed-logomark.svg: expected 2 paths, found ${paths.length}`);
const [W, H, S] = [1207.63, 1312.81, 1600];   // the mark's viewBox and the square it sits in
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" fill="${PEARL}"/>` +
  `<g transform="translate(${((S - W) / 2).toFixed(3)} ${((S - H) / 2).toFixed(3)})" fill="${SLATE}">${paths.map((d) => `<path d="${d}"/>`).join('')}</g></svg>\n`;
writeFileSync(new URL('public/icon.svg', ROOT), svg);

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage();
const png = async (size) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  return page.screenshot({ type: 'png', omitBackground: false });
};
const out = {};
for (const s of [16, 32, 48, 180, 192, 512]) out[s] = await png(s);
await browser.close();
writeFileSync(new URL('public/apple-touch-icon.png', ROOT), out[180]);
writeFileSync(new URL('public/icon-192.png', ROOT), out[192]);
writeFileSync(new URL('public/icon-512.png', ROOT), out[512]);

// ICO: a 6-byte header, one 16-byte entry per image, then the PNG payloads
const imgs = [16, 32, 48].map((s) => [s, out[s]]);
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

const manifest = {
  name: 'Skreed', short_name: 'Skreed', start_url: '/', display: 'browser', background_color: PEARL, theme_color: PEARL,
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
};
writeFileSync(new URL('public/manifest.webmanifest', ROOT), JSON.stringify(manifest, null, 2) + '\n');
console.log('icons: icon.svg, favicon.ico (16/32/48), apple-touch-icon.png, icon-192.png, icon-512.png, manifest.webmanifest');
