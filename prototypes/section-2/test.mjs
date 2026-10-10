// Section 2 gems page under the artifact CSP on a virtual clock: label reveal, hover sweep and decay, errors.
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
const [file, w, h, mobile, outDir, mode = 'full'] = process.argv.slice(2); const QUICK = mode === 'quick';
const SC = '/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad';
const FC = SC + '/show/s2gems/fontcache', NM = SC + '/proto/node_modules/three';
const CSP = "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:; connect-src 'none'";
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: mobile === '1' ? 2 : 1, isMobile: mobile === '1', hasTouch: mobile === '1' });
await ctx.route('**/*', async (r) => {
  const u = new URL(r.request().url());
  if (u.hostname === 'cdn.jsdelivr.net') return r.fulfill({ body: fs.readFileSync(path.join(NM, u.pathname.replace('/npm/three@0.165.0/', ''))), headers: { 'content-type': 'text/javascript', 'access-control-allow-origin': '*' } });
  if (u.hostname === 'fonts.googleapis.com') return r.fulfill({ body: fs.readFileSync(FC + '/css.txt'), headers: { 'content-type': 'text/css' } });
  if (u.hostname === 'fonts.gstatic.com') return r.fulfill({ body: fs.readFileSync(FC + '/' + path.basename(u.pathname)), headers: { 'content-type': 'font/woff2', 'access-control-allow-origin': '*' } });
  if (u.hostname === 'local.test') return r.fulfill({ body: fs.readFileSync(file), headers: { 'content-type': 'text/html', 'content-security-policy': CSP } });
  return r.abort();
});
const page = await ctx.newPage(); const log = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.push(m.type() + ' ' + m.text().slice(0, 300)); });
page.on('pageerror', (e) => log.push('ERR ' + String(e.stack || e).slice(0, 500)));
await page.goto('https://local.test/?capture&vclock', { waitUntil: 'load' });
for (let i = 0; i < 120; i++) { if (await page.evaluate(() => window.__ready || window.__error)) break; await page.waitForTimeout(1000); }
const err = await page.evaluate(() => window.__error); if (err) { console.log('BOOT ERROR', err); await b.close(); process.exit(1); }
const T = 7.0; let v = 0;
const frame = async (ms) => { v = await page.evaluate((m) => window.__tick(m), ms); await page.evaluate((t) => window.__renderAt(t), T + v / 1000); };
const shot = async (name) => page.screenshot({ path: `${outDir}/${name}.png`, timeout: 180000 });
const t0 = Date.now();
// label reveal of the first title: starts at 400 ms
for (const target of (QUICK ? [] : [430, 500, 560, 640, 760, 1150])) { await frame(target - v); await shot(`reveal-${String(target).padStart(4, '0')}`); }
while (v < 3200) await frame(100);
await shot('rest');
const slots = await page.evaluate(() => window.__stones.map((s) => ({ fam: s.fam, u: s.slot.u, v: s.slot.v, s: s.slot.s })));
const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight));
const g = slots[1], cx = g.u * +w, cy = g.v * +h, half = 0.45 * g.s;
// hover: enter, sweep across the stone at about 800 px/s, then rest the pointer outside and watch the decay
const N = 14; await page.mouse.move(cx - half - 30, cy + 0.05 * g.s);
for (let i = 0; i <= N; i++) { await page.mouse.move(cx - half + (2 * half) * i / N, cy + 0.05 * g.s + 0.12 * g.s * Math.sin(i / N * 3.1)); await frame(1000 / 60); if (i === 4 || i === 9 || i === N) await shot(`hover-${String(i).padStart(2, '0')}`); }
const st1 = await page.evaluate(() => window.__pool.map((p) => p.st ? { fam: p.st.fam, vel: +p.vel.toFixed(3), over: p.over } : null));
await page.mouse.move(cx + half + 60, cy + 0.6 * g.s);
for (const [ms, name] of (QUICK ? [[300, 'decay-0300']] : [[250, 'decay-0250'], [250, 'decay-0500'], [500, 'decay-1000'], [1000, 'decay-2000'], [2000, 'decay-4000']])) { let left = ms; while (left > 0) { const d = Math.min(100, left); await frame(d); left -= d; } await shot(name); }
// keyboard: Tab to the first link
await page.keyboard.press('Tab'); for (let i = 0; i < 6; i++) await frame(100); await shot('focus-tab1');
const links = await page.evaluate(() => [...document.querySelectorAll('.gem-link')].map((a) => ({ href: a.getAttribute('href'), label: a.getAttribute('aria-label'), w: a.getBoundingClientRect().width, h: a.getBoundingClientRect().height })));
const labs = await page.evaluate(() => window.__stones.map((s) => ({ fam: s.fam, side: s.labs.title.side, title: s.labs.title.el.textContent, w: Math.round(s.labs.title.w), h: Math.round(s.labs.title.h) })));
console.log(JSON.stringify({ secs: Math.round((Date.now() - t0) / 1000), fonts, info: await page.evaluate(() => window.__info), pool: st1, labs, links, log }, null, 1));
await b.close();
