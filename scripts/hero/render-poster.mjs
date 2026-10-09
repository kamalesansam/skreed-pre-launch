// Renders the hero's rest frame for the posters (hero-architecture.md 6.4, spec D10): canvas only, frozen at t = 0
// (__skreedFreeze set before load), at least 3 frames after the loader's ready, overlays hidden.
//   node scripts/hero/render-poster.mjs --prototype        stage 1: the approved prototype with the locked values
//   node scripts/hero/render-poster.mjs --url <base url>   stage 2: a test build (?tier=hero3d is added)
// Writes assets-src/hero/poster/render-phone.png (390 x 844 at 1.25) and render-desktop.png (1280 x 800 at 1.5).
// SwiftShader is slow: each render takes minutes.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { launch, SETUPS } from '../../tests/harness/browser.ts';
import { servePrototype, PROTO_URL } from '../../tests/harness/prototype.ts';
import { captureStage } from '../../tests/harness/canvas.ts';

const OUT = fileURLToPath(new URL('../../assets-src/hero/poster/', import.meta.url));
const args = process.argv.slice(2);
const proto = args.includes('--prototype');
const ui = args.indexOf('--url');
const base = ui >= 0 ? args[ui + 1] : null;
const only = args.includes('--phone') ? ['phone'] : args.includes('--desktop') ? ['desktop'] : ['phone', 'desktop'];
if (!proto && !base) { console.error('usage: render-poster.mjs --prototype | --url <base url> [--phone|--desktop]'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const browser = await launch();
for (const name of only) {
  const setup = name === 'phone' ? SETUPS.phoneCanvas : SETUPS.desktop;
  const ctx = await browser.newContext({ ...setup, bypassCSP: true });   // the harness injects its hide style
  await ctx.addInitScript(() => { window.__skreedFreeze = true; });
  if (proto) await servePrototype(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  const t0 = Date.now();
  const url = proto ? PROTO_URL : new URL('?tier=hero3d', base).href;
  await page.goto(url, { waitUntil: 'load', timeout: 300_000 });
  const path = `${OUT}render-${name}.png`;
  await captureStage(page, path);
  console.log(JSON.stringify({ source: proto ? 'prototype' : base, setup: name, path, ms: Date.now() - t0, errors }));
  await ctx.close();
}
await browser.close();
