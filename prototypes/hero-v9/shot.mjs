// Screenshot under a strict CSP like a sandboxed artifact: scripts only inline + jsdelivr, images data:/blob:, no fetch, no wasm.
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
const [file, w, h, mobile, out, scrollScreens, hover, hx, hy] = process.argv.slice(2);
const CSP = "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:; connect-src 'none'";
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: mobile === '1' ? 2 : 1, isMobile: mobile === '1', hasTouch: mobile === '1' });
await ctx.route('**/*', async r => {
  const u = new URL(r.request().url());
  if (u.hostname === 'cdn.jsdelivr.net') { const p = path.join('node_modules/three', u.pathname.replace('/npm/three@0.165.0/', '')); return r.fulfill({ body: fs.readFileSync(p), headers: { 'content-type': p.endsWith('.wasm') ? 'application/wasm' : 'text/javascript', 'access-control-allow-origin': '*' } }); }
  if (u.hostname === 'local.test') return r.fulfill({ body: fs.readFileSync(file), headers: { 'content-type': 'text/html', 'content-security-policy': CSP } });
  return r.abort();
});
const page = await ctx.newPage(); const log = [];
page.on('console', m => { if (m.type() === 'error') log.push(m.text().slice(0, 160)); }); page.on('pageerror', e => log.push('ERR ' + String(e).slice(0, 160)));
await page.goto('https://local.test/?world=spires', { waitUntil: 'load' });
await page.waitForTimeout(5000);
if (hover === '1') { for (let k = 0; k < 40; k++) { await page.mouse.move(+w * (hx ? +hx : 0.55) + Math.sin(k / 4) * 60, +h * (hy ? +hy : 0.32) + Math.cos(k / 5) * 40); await page.waitForTimeout(120); } }
if (+scrollScreens) await page.evaluate(f => scrollTo(0, innerHeight * f), +scrollScreens);
await page.waitForTimeout(hover === '1' ? 800 : 6000);
await page.screenshot({ path: out, timeout: 120000 });
if (hover === '1') { const r = await page.evaluate(() => window.__skreedFloorCheck ? window.__skreedFloorCheck() : null); if (r) { const pushed = r.filter(x => x.d > 0.1); console.log('pushed blocks', pushed.length, 'max penetration into floor', Math.max(...r.map(x => x.penetration)).toFixed(3), 'lowest block y', Math.min(...r.map(x => x.minY)).toFixed(3)); } }
console.log([...new Set(log)].slice(0, 6).join('\n') || 'no errors');
await b.close();
