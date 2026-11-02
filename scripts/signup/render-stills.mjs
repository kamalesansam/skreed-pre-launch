// Section 5's poster tier stills (docs/specs/section-5-liquid.md 2 "poster path", 3 "The stills"): the one jar in each
// of the sixteen states the follows can reach (every order of the three follows, the liquid's bands in press order at
// that order's level, the surface still, the view from above), rendered from our own build by the island's jar chunk over --night (the
// hooks' __s5.still(order), a hooks build: the dev server, or a test or staging build), 320 x 400 and 160 x 200, AVIF
// with a WebP twin each, into src/assets/signup/stills/jar-<key>-<2x|1x>.<avif|webp> (the key: 0 when empty, else the
// platforms' first letters in press order). The browser is the installed Chrome when present (channel 'chrome'), else
// Playwright's Chromium; SKREED_GL=swiftshader runs WebGL on SwiftShader (the test harness's flags). Run with a server up:
//   node scripts/signup/render-stills.mjs [base=http://127.0.0.1:4321/] [--out src/assets/signup/stills]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4321/';
const oi = args.indexOf('--out'), out = oi >= 0 ? args[oi + 1] : 'src/assets/signup/stills';
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--ignore-gpu-blocklist', '--enable-gpu'];
/** every order the follows can come in: 16 (config/signup.ts's stillKey) */
const IDS = ['facebook', 'youtube', 'instagram'];
const ORDERS = [[]];
const grow = (prefix) => { for (const id of IDS) if (!prefix.includes(id)) { const next = [...prefix, id]; ORDERS.push(next); grow(next); } };
grow([]);
const keyOf = (order) => (order.length ? order.map((id) => id[0]).join('') : '0');
/** the stills' caps (section-5-liquid.md 7), bytes; a WebP over its cap steps down to quality 78 */
const CAPS = { '2x': { avif: 24 * 1024, webp: 40 * 1024 }, '1x': { avif: 10 * 1024, webp: 16 * 1024 } };

async function launch(args) {
  try { const b = await chromium.launch({ channel: 'chrome', args }); console.log('browser: the installed Chrome (channel chrome)'); return b; }
  catch (e) { console.warn(`browser: no installed Chrome (${String(e.message ?? e).split('\n')[0]}); Playwright's Chromium`); return chromium.launch({ args }); }
}
const browser = await launch(GL);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.warn('page error:', e.message));
await page.goto(new URL('/?tier=hero3d&glue=0&room=open', base).href, { waitUntil: 'load' });
await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 240_000 });
await page.evaluate(() => window.__skreedIntro?.skip?.());
await page.waitForFunction(() => !document.documentElement.classList.contains('intro'), null, { timeout: 30_000 }).catch(() => console.warn('the intro class did not leave within 30 s'));
await page.evaluate(() => window.__s5?.load());
await page.waitForFunction(() => !!window.__s5?.ready, null, { timeout: 60_000 });
console.log(`renderer: ${await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const x = c?.getExtension('WEBGL_debug_renderer_info'); return x ? c.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; })}`);
// every still is rendered first and written at the end: a file landing in src/assets/ makes the dev server reload the
// page (the stills' glob in Signup.astro and the DOM script), which would cut the next still's call short
const files = [];
for (const order of ORDERS) {
  const key = keyOf(order);
  // the pixels as base64 (a typed array does not cross the bridge whole)
  const r = await page.evaluate(async (order) => {
    const s = await window.__s5.still(order);
    if (!s) return null;
    let bin = '';
    for (let i = 0; i < s.data.length; i += 0x8000) bin += String.fromCharCode.apply(null, s.data.subarray(i, i + 0x8000));
    return { width: s.width, height: s.height, b64: btoa(bin) };
  }, order);
  if (!r) { console.warn(`${key}: no still (the chunk is not ready)`); continue; }
  // the target's rows come bottom-up: flipped here
  const img = sharp(Buffer.from(r.b64, 'base64'), { raw: { width: r.width, height: r.height, channels: 4 } }).flip().removeAlpha();
  for (const [size, w, h] of [['2x', 320, 400], ['1x', 160, 200]]) {
    const resized = img.clone().resize(w, h, { kernel: 'lanczos3' });
    const avif = await resized.clone().avif({ quality: 52, effort: 6 }).toBuffer();
    let webp = await resized.clone().webp({ quality: 84 }).toBuffer(), stepped = '';
    if (webp.length > CAPS[size].webp) { webp = await resized.clone().webp({ quality: 78 }).toBuffer(); stepped = ' (quality 78)'; }
    files.push([`jar-${key}-${size}.avif`, avif], [`jar-${key}-${size}.webp`, webp]);
    const over = (b, cap) => (b.length > cap ? ` OVER ${(cap / 1024).toFixed(0)} KB` : '');
    console.log(`jar-${key}-${size}: AVIF ${avif.length} B${over(avif, CAPS[size].avif)}, WebP ${webp.length} B${stepped}${over(webp, CAPS[size].webp)}`);
  }
}
await browser.close();
mkdirSync(out, { recursive: true });
for (const [name, buf] of files) writeFileSync(join(out, name), buf);
console.log(`${files.length} stills into ${out}`);
