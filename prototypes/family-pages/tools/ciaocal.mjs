// Measure the colour calibration (a, b per channel and finish) of the front case under ciao's light, then check it:
// with CALV set, the front case's back at the sample point against the catalog hex for a few shades of one family.
import { launch, open, waitLive } from './lib.mjs';
const fam = process.argv[2] || 'blissful-blues', idx = (process.argv[3] || '7,0,23').split(',').map(Number);
const b = await launch();
const { page, log } = await open(b, { w: 1280, h: 800, hash: `#/shades/${fam}/` });
await waitLive(page, 300000);
const cal = process.env.CAL ? JSON.parse(process.env.CAL) : (await page.evaluate(() => window.__stage.calibrate())).res;
console.log('CAL ' + JSON.stringify(cal));
const idle = () => page.waitForFunction(() => { const s = window.__stage.state(); return !s.busy && !s.raf; }, null, { timeout: 120000, polling: 200 });
await page.evaluate((c) => window.__stage.setCal(c), cal);
const rows = [];
for (const i of idx) {
  await page.evaluate((k) => window.SK.select(k, 'test'), i); await idle();
  for (const f of ['matte', 'gloss']) {
    await page.evaluate((x) => { window.SK.S.finish = x; window.__stage.setFinish(x); }, f); await idle(); await page.waitForTimeout(700);
    const sm = await page.evaluate(() => window.__stage.sample());
    const t = [1, 3, 5].map((k) => parseInt(sm.hex.slice(k, k + 2), 16));
    rows.push([i, f, sm.hex, sm.rgb.join(','), Math.max(...t.map((v, k) => Math.abs(v - sm.rgb[k])))]);
  }
}
await page.evaluate(() => { window.SK.S.finish = 'matte'; window.__stage.setFinish('matte'); });
console.log('CHECK ' + JSON.stringify(rows)); console.log('LOG ' + JSON.stringify(log));
await b.close();
