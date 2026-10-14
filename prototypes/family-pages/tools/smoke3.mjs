import { launch, open } from './lib.mjs';
const b = await launch(); const { page, log } = await open(b, { w: 1280, h: 800, hash: '#/shades/blissful-blue/' });
const t0 = Date.now(); let st = null;
while (Date.now() - t0 < 300000) { await page.waitForTimeout(3000); st = await page.evaluate(() => ({ stage: document.documentElement.dataset.stage, cls: document.documentElement.className, ld: window.__famLoader && window.__famLoader.state(), has: !!window.__stage })); if (st.stage === 'live' || log.some((l) => l.startsWith('pageerror'))) break; }
console.log(JSON.stringify({ secs: Math.round((Date.now() - t0) / 1000), st, log, csp: await page.evaluate(() => window.__csp) }, null, 1));
await b.close();
