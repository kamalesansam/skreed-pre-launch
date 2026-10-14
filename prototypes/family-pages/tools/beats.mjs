// The page's scroll after the carousel: frames at given scroll positions (screens), the lagged value snapped.
// Usage: node beats.mjs <tag> <family> <w> <h> <mobile 0|1> <list of sv>
import fs from 'node:fs'; import path from 'node:path';
import { launch, open, waitLive, fontsReady, SHOTS } from './lib.mjs';
const [tag, fam, w, h, mobile, list] = process.argv.slice(2);
const pts = (list || '0,1,1.5,2,2.5,2.85,3,3.5,4,4.5,5,5.5,6,6.15,6.5,7').split(',').map(Number);
const b = await launch(); const out = { tag, frames: [] };
const { page, log } = await open(b, { w: +w, h: +h, phone: mobile === '1', hash: `#/shades/${fam}/`, query: '?render=force&mode=3d' });
try { await waitLive(page, 300000); } catch (e) { log.push('not live ' + e.message.slice(0, 80)); }
await fontsReady(page);
fs.mkdirSync(path.join(SHOTS, 'beats'), { recursive: true });
for (const sv of pts) {
  await page.evaluate((v) => { scrollTo(0, Math.round(v * innerHeight)); }, sv);
  await page.waitForTimeout(800);
  const info = await page.evaluate((v) => { const st = window.__stage; st.snapScroll(v); const i = st.info(); return { calls: i.calls, tri: i.triangles, ms: i.renderMs, cls: document.documentElement.className, sy: scrollY }; }, sv);
  await page.waitForTimeout(400);
  const f = path.join(SHOTS, 'beats', `${tag}-${w}-${String(sv).replace('.', '_')}.png`);
  fs.writeFileSync(f, await page.screenshot({ timeout: 240000 }));
  out.frames.push({ sv, ...info, f });
}
out.log = log; out.csp = await page.evaluate(() => window.__csp);
console.log(JSON.stringify(out, null, 1)); await b.close();
