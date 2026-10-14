// The loader's count against real loading: three delayed by D ms; the count is read every 100 ms until the lift.
import { launch, open } from './lib.mjs';
const D = +(process.argv[2] || 0);
const b = await launch(); const { page } = await open(b, { w: 1280, h: 800, hash: '#/shades/blissful-blue/', delayThreeMs: D });
const t0 = Date.now(); const trace = [];
while (Date.now() - t0 < 120000) {
  const s = await page.evaluate(() => { const L = window.__famLoader ? window.__famLoader.state() : null; return { n: L && L.n, ph: L && L.phase, stage: document.documentElement.dataset.stage, loading: document.documentElement.classList.contains('loading') }; });
  trace.push({ t: Date.now() - t0, ...s });
  if (s.ph === 'done' || (!s.loading && s.stage === 'live' && trace.length > 3)) break;
  await page.waitForTimeout(100);
}
const live = trace.find((x) => x.stage === 'live'), hundred = trace.find((x) => x.n === 100), lifted = trace.find((x) => !x.loading);
console.log(JSON.stringify({ delay: D, liveAt: live && live.t, hundredAt: hundred && hundred.t, liftedAt: lifted && lifted.t, countAtLive: live && live.n, samples: trace.filter((x, i) => i % 5 === 0).map((x) => [x.t, x.n, x.ph]) }));
await b.close();
