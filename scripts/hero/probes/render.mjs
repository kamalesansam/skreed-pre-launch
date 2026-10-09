// Render the hero's canvas only, frozen at t = 0 (the rest pose the loader lifts onto), DOM overlays hidden.
// node render.mjs <page.html> <three node_modules dir> <W> <H> <dsf> <out.png>
// Same request handling as prototypes/hero-v9/shot.mjs: three@0.165.0 served from local node_modules, everything else aborted.
import { createRequire } from 'node:module';
import fs from 'node:fs'; import path from 'node:path';
const { chromium } = createRequire('/opt/node-tools/node_modules/')('playwright');
const [file, threeDir, W, H, dsf, out] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: +dsf, isMobile: false, hasTouch: false });
await ctx.addInitScript(() => { window.__skreedFreeze = true; });
await ctx.route('**/*', async r => {
  const u = new URL(r.request().url());
  if (u.hostname === 'cdn.jsdelivr.net') { const p = path.join(threeDir, u.pathname.replace('/npm/three@0.165.0/', '')); return r.fulfill({ body: fs.readFileSync(p), headers: { 'content-type': 'text/javascript', 'access-control-allow-origin': '*' } }); }
  if (u.hostname === 'local.test') return r.fulfill({ body: fs.readFileSync(file), headers: { 'content-type': 'text/html' } });
  return r.abort();
});
const page = await ctx.newPage(); const log = [];
page.on('pageerror', e => log.push('ERR ' + String(e).slice(0, 160)));
const t0 = Date.now();
await page.goto('https://local.test/', { waitUntil: 'load', timeout: 300000 });
await page.waitForFunction(() => window.__skreedLoader && window.__skreedLoader.state().ready && (window.__skreedFrame | 0) > 3, null, { timeout: 600000, polling: 500 });
const st = await page.evaluate(() => window.__skreedLoader.state());
await page.addStyleTag({ content: '#intro,.site-logo,.copy,.cue,.tune,.labels,.fallback{display:none!important}' });
const f0 = await page.evaluate(() => window.__skreedFrame);
await page.waitForFunction(n => window.__skreedFrame > n + 2, f0, { timeout: 300000, polling: 200 });
await page.locator('#stage').screenshot({ path: out, timeout: 300000 });
console.log(JSON.stringify({ out, ms: Date.now() - t0, loader: { phase: st.phase, p: st.p }, frames: await page.evaluate(() => window.__skreedFrame), errors: log }));
await b.close();
