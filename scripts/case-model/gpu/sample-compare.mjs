// Criterion 7 (family-page.md 24.4): at rest nothing moved. The front case's sample point (__famStage.sample(), the back
// plate's 3 x 3 px) on the round 6 build against the base build (the default tip 7e256a4), matte and gloss, on the GPU at
// 1280 x 800: on the carousel (where the hook's projection is the pose's own) and at beat 1 (2 screens; the hook projects
// the carousel pose there, so the beat's figure is recorded for the two builds against each other, not as the back plate).
// Also info().programs before a takeover's first frame and after its last, and the first view's model requests.
//   node sample-compare.mjs http://127.0.0.1:8795 http://127.0.0.1:8797
import { launch, WIDE, PHONE } from './lib.mjs';
const [R6 = 'http://127.0.0.1:8795', BASEB = 'http://127.0.0.1:8797'] = process.argv.slice(2);
const browser = await launch();
async function measure(base, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await page.goto(`${base}/shades/blissful-blue/?render=force&tier=high`);
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading') && document.querySelector('#st3d canvas.on') && window.__famStage?.state().detail !== 'loading', null, { timeout: 180_000, polling: 200 });
  await page.waitForFunction(() => { const s = window.__famStage.state(); return Math.abs(s.s - s.target) < 0.001 && s.G > 0.999 && !s.busy; }, null, { timeout: 120_000, polling: 200 });
  await page.waitForTimeout(400);
  const out = { base, programs: await page.evaluate(() => window.__famStage.info().programs) };
  out.carouselMatte = await page.evaluate(() => window.__famStage.sample());
  await page.getByRole('button', { name: 'Gloss' }).click();
  await page.waitForTimeout(1200);
  await page.waitForFunction(() => !window.__famStage.state().busy, null, { timeout: 30_000, polling: 100 });
  out.carouselGloss = await page.evaluate(() => window.__famStage.sample());
  await page.getByRole('button', { name: 'Matte' }).click();
  await page.waitForTimeout(1200);
  await page.evaluate(() => scrollTo({ top: Math.round(2 * innerHeight), behavior: 'instant' }));
  await page.waitForFunction(() => { const s = window.__famStage.state(); return Math.abs(s.sv - 2) < 0.005 && !s.busy; }, null, { timeout: 60_000, polling: 100 });
  await page.waitForTimeout(400);
  out.beat1Matte = await page.evaluate(() => window.__famStage.sample());
  await page.getByRole('button', { name: 'Gloss' }).click().catch(() => {});
  await page.waitForTimeout(1200);
  out.beat1Gloss = await page.evaluate(() => window.__famStage.sample());
  out.programsAfter = await page.evaluate(() => window.__famStage.info().programs);
  await ctx.close();
  return out;
}
const diff = (a, b) => a.rgb.map((v, i) => v - b.rgb[i]);
for (const [label, opts] of [['1280', WIDE], ['390', PHONE]]) {
  const r6 = await measure(R6, opts), bb = await measure(BASEB, opts);
  console.log(label, 'round 6', JSON.stringify(r6));
  console.log(label, 'base   ', JSON.stringify(bb));
  for (const k of ['carouselMatte', 'carouselGloss', 'beat1Matte', 'beat1Gloss']) console.log(label, k, 'round 6', r6[k].rgb, 'base', bb[k].rgb, 'diff', diff(r6[k], bb[k]));
}
await browser.close();
