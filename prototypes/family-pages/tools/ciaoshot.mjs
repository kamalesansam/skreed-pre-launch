// The ciao look: rest frames at 1280 x 800 and 390 x 844 under the strict CSP, plus a few numbers.
// Usage: node ciaoshot.mjs [tag] [family] [query extra]
import fs from 'node:fs'; import path from 'node:path';
import { launch, open, waitLive, fontsReady, SHOTS } from './lib.mjs';
const tag = process.argv[2] || 'a', fam = process.argv[3] || 'blissful-blues', extra = process.argv[4] || '';
const b = await launch(); const out = {};
for (const [k, o] of [['desk', { w: 1280, h: 800 }], ['phone', { w: 390, h: 844, phone: true }]]) {
  const { page, log } = await open(b, { ...o, hash: `#/shades/${fam}/`, query: '?render=force&mode=3d' + extra });
  try { await waitLive(page, 300000); } catch (e) { log.push('not live: ' + e.message.slice(0, 80)); }
  await fontsReady(page); await page.waitForTimeout(1500);
  fs.writeFileSync(path.join(SHOTS, 'ciao', `${tag}-${k}.png`), await page.screenshot({ timeout: 240000 }));
  out[k] = { log, csp: await page.evaluate(() => window.__csp), info: await page.evaluate(() => { try { const i = window.__stage.info(); return { calls: i.calls, tri: i.triangles, tier: i.tier, fit: i.fit, renderMs: i.renderMs }; } catch (e) { return String(e); } }),
    front: await page.evaluate(() => { try { return window.__stage.sample(); } catch (e) { return String(e); } }) };
  await page.context().close();
}
console.log(JSON.stringify(out, null, 1)); await b.close();
