// v11 under the artifact CSP: skip the intro, wait for section 2, then snap the scroll to points along the sequence and shoot.
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
const [file, w, h, mobile, outDir, list] = process.argv.slice(2);
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
  if (u.hostname === 'fonts.gstatic.com') { const f = FC + '/' + path.basename(u.pathname); return fs.existsSync(f) ? r.fulfill({ body: fs.readFileSync(f), headers: { 'content-type': 'font/woff2', 'access-control-allow-origin': '*' } }) : r.abort(); }
  if (u.hostname === 'local.test') return r.fulfill({ body: fs.readFileSync(file), headers: { 'content-type': 'text/html', 'content-security-policy': CSP } });
  return r.abort();
});
const page = await ctx.newPage(); const log = [];
await page.addInitScript(() => { const iv = setInterval(() => { const L = window.__skreedLoader, I = window.__skreedIntro; if (!L) return; if (!window.__ns) { window.__ns = 1; L.setProgress(0.6); } if (I && I.state().ready) { L.ready(); clearInterval(iv); } }, 50); });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.push(m.type() + ' ' + m.text().slice(0, 300)); });
page.on('pageerror', (e) => log.push('ERR ' + String(e.stack || e).slice(0, 600)));
await page.goto('https://local.test/?intro=0', { waitUntil: 'load' });
const t0 = Date.now(); let st = null;
while (Date.now() - t0 < 300000) { await page.waitForTimeout(2000); st = await page.evaluate(() => window.__s2 ? window.__s2() : null); if (st && (st.ready || st.failed)) break; }
for (let k = 0; k < 120; k++) { if (await page.evaluate(() => !document.documentElement.classList.contains('loading') && !document.getElementById('intro'))) break; await page.waitForTimeout(1000); }
await page.waitForTimeout(3000);
log.push('s2 ' + JSON.stringify(st) + ' after ' + Math.round((Date.now() - t0) / 1000) + ' s');
const pts = (list || '0,1.3,2.6,3.1,3.6,4.4,6,8,10,12.1,12.6,13.3').split(',').map(Number);
for (const S of pts) {
  await page.evaluate((v) => { scrollTo(0, innerHeight * v); window.__skreedSnap(v); }, S);
  const f0 = await page.evaluate(() => window.__skreedFrame | 0);
  for (let k = 0; k < 60; k++) { await page.waitForTimeout(500); const f = await page.evaluate(() => window.__skreedFrame | 0); if (f - f0 >= 3) break; }
  await page.evaluate((v) => window.__skreedSnap(v), S);
  const f1 = await page.evaluate(() => window.__skreedFrame | 0);
  for (let k = 0; k < 60; k++) { await page.waitForTimeout(500); const f = await page.evaluate(() => window.__skreedFrame | 0); if (f - f1 >= 2) break; }
  await page.screenshot({ path: `${outDir}/S${String(S).replace('.', '_').padStart(4, '0')}.png`, timeout: 180000 });
  log.push(`S ${S}: ` + JSON.stringify(await page.evaluate(() => window.__s2 && window.__s2())));
}
console.log(JSON.stringify({ secs: Math.round((Date.now() - t0) / 1000), log }, null, 1));
await b.close();
