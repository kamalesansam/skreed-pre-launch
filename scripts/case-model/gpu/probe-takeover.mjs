// Criterion 9 (family-page.md 24.4): the frame interval during a takeover at 1280 x 800 in Chrome on this Mac's GPU, on
// both tiers (the hooks' ?tier=high and ?tier=low), as the median of the page's requestAnimationFrame deltas while a run is
// under way, against the display period measured idle just before; on the high tier within 1.25 x the period.
//   BASE_URL=http://127.0.0.1:8795/ node probe-takeover.mjs [dpr]
import { launch, openFamily, toScreen, rest, settledTypes, WIDE, BASE } from './lib.mjs';
const DPR = Number(process.argv[2] || 1);
const browser = await launch();
const out = {};
for (const tier of ['high', 'low']) {
  const ctx = await browser.newContext({ ...WIDE, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/shades/blissful-blue/?render=force&tier=${tier}`);
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading') && document.querySelector('#st3d canvas.on'), null, { timeout: 180_000, polling: 200 });
  await toScreen(page, 0.6);
  await settledTypes(page);
  const runs = [];
  for (const [a, type] of [[2.7, 'magtough'], [3.7, 'snap'], [4.7, 'armor']]) {
    await toScreen(page, a);
    await rest(page, a);
    await page.waitForTimeout(400);
    const r = await page.evaluate(([from, to, ms]) => new Promise((done) => {
      const idle = [], run = [], W = window;
      let last = performance.now(), t0 = 0, phase = 'idle-sample';
      const step = (now) => {
        const dt = now - last; last = now;
        if (phase === 'idle-sample') { idle.push(dt); if (idle.length >= 90) { phase = 'glide'; t0 = now; } }
        else {
          const t = now - t0;
          scrollTo({ top: Math.round((from + (to - from) * Math.min(1, t / ms)) * innerHeight), behavior: 'instant' });
          const s = W.__famStage.state();
          if (s.takeover.phase !== 'idle') run.push(dt);
          if (t > ms + 2200) { const med = (xs) => { const s = [...xs].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : null; }; const info = W.__famStage.info(); return done({ idleMedian: med(idle.slice(10)), runMedian: med(run), runFrames: run.length, runMax: run.length ? Math.max(...run) : null, tier: s.tier, dpr: info.dpr, canvas: info.canvas, probe: s.probe, type: s.type }); }
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), [a, a + 0.3, 300]);
    r.to = type;
    runs.push(r);
    console.log(tier, type, JSON.stringify(r));
  }
  out[tier] = runs;
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify({ dpr: DPR, out }));
