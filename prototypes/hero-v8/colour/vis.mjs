// Measure how much glow each block shows on screen, per pose, by lighting one block at a time.
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
const [file, w, h, mobile, outDir] = process.argv.slice(2);
const CSP = "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'";
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: mobile === '1', hasTouch: mobile === '1' });
await ctx.route('**/*', async r => {
  const u = new URL(r.request().url());
  if (u.hostname === 'cdn.jsdelivr.net') { const p = path.join('node_modules/three', u.pathname.replace('/npm/three@0.165.0/', '')); return r.fulfill({ body: fs.readFileSync(p), headers: { 'content-type': 'text/javascript', 'access-control-allow-origin': '*' } }); }
  if (u.hostname === 'local.test') return r.fulfill({ body: fs.readFileSync(file), headers: { 'content-type': 'text/html', 'content-security-policy': CSP } });
  return r.abort();
});
const page = await ctx.newPage();
const frames = (n) => page.evaluate(n => new Promise(r => { const t0 = window.__skreedFrame | 0; const f = () => (window.__skreedFrame | 0) >= t0 + n ? r() : setTimeout(f, 40); f(); }), n);
const settle = async () => { let prev = null; for (let k = 0; k < 80; k++) { await frames(1); const st = await page.evaluate(() => window.__skreedState()); const cur = [...st.d, st.th * 10, st.ph * 10, st.mx / 10, st.my / 10]; if (prev && Math.max(...cur.map((v, i) => Math.abs(v - prev[i]))) < 2e-3) return k; prev = cur; } return -1; };
page.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
await page.goto('https://local.test/?world=spires&breath=0&push=1.1&logoIdle=0', { waitUntil: 'load' });
await frames(8);
await page.evaluate(() => { const g = document.getElementById('ghost'); if (g && /on/.test(g.textContent)) g.click(); });
const poses = (process.env.POSES || 'rest,center,left,right,top,bottom').split(',').map(n => [n, { rest: null, center: [0.5, 0.4], left: [0.42, 0.38], right: [0.58, 0.42], top: [0.5, 0.25], bottom: [0.5, 0.55] }[n]]);
for (const [name, at] of poses) {
  if (at) { for (let k = 0; k < 6; k++) { await page.mouse.move(+w * at[0] + Math.sin(k / 3) * 8, +h * at[1] + Math.cos(k / 3) * 8); await frames(1); } await page.mouse.move(+w * at[0], +h * at[1]); }
  else { await page.mouse.move(5, +h - 5); }
  console.log(name, 'settled after', await settle(), 'frames');
  await page.evaluate(() => { window.__skreedFreeze = true; }); await frames(2);
  for (let i = -2; i < 10; i++) {
    await page.evaluate(i => { if (i === -2) { window.__skreedSolo(0); } window.__skreedSolo(i === -2 ? 99 : i); }, i);
    await frames(2);
    await page.screenshot({ path: `${outDir}/${name}_${i === -2 ? 'base' : i}.png` });
  }
  await page.evaluate(() => { window.__skreedSolo(-1); window.__skreedFreeze = false; });
}
await b.close();
