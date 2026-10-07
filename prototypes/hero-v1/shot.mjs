import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
const [w, h, mobile, out, scrollFrac, mx, my] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: mobile === '1' ? 2 : 1, isMobile: mobile === '1', hasTouch: mobile === '1' });
await ctx.route('**/*', async r => {
  const u = new URL(r.request().url());
  if (u.hostname === 'cdn.jsdelivr.net') { const p = path.join('node_modules/three', u.pathname.replace('/npm/three@0.165.0/', '')); return r.fulfill({ body: fs.readFileSync(p), headers: { 'content-type': 'text/javascript' } }); }
  if (u.hostname === 'local.test') return r.fulfill({ body: fs.readFileSync('skreed-hero-prototype.html'), headers: { 'content-type': 'text/html' } });
  return r.continue();
});
const page = await ctx.newPage(); const log = [];
page.on('console', m => log.push(m.type() + ': ' + m.text())); page.on('pageerror', e => log.push('ERR ' + e));
await page.goto('https://local.test/', { waitUntil: 'load' });
await page.waitForTimeout(4000);
if (mx) { await page.mouse.move(+mx, +my); await page.waitForTimeout(400); await page.mouse.move(+mx + 8, +my + 4, { steps: 6 }); }
if (+scrollFrac) await page.evaluate(f => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), +scrollFrac);
await page.waitForTimeout(6000);
await page.screenshot({ path: out, timeout: 120000 });
console.log(log.slice(0, 12).join('\n') || 'no console output');
await b.close();
