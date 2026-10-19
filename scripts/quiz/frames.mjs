// Section 3's review frames (docs/specs/quiz.md 7), at 390x844 and 1280x800, from a served build on the forced 3D tier,
// with Math.random pinned (the shade draw then gives each group's first shade, Sam's recommendation): the hand-off at
// 15.7, 16.2 and 16.7 screens; the intro (17.2), visible at rest; card 1 mid-decode and settled; an answer taken
// (the rest of its question wiped out); card 4; card 3 after Back; the result (The Quiet Curator, Porcelain with its
// hairline); the gift, its validation state, the network error, the duplicate, the offline queue and
// the done state; then two more results (The Spark, The Calm Strategist). Writes docs/specs/screenshots/quiz-<w>x<h>-<state>.png.
// Serve a hooks build first (PUBLIC_HERO_HOOKS=1 astro build --outDir dist-s3, then wrangler dev --assets dist-s3 --port 8799).
//   node scripts/quiz/frames.mjs [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://127.0.0.1:8799/?tier=hero3d';
const OUT = fileURLToPath(new URL('../../docs/specs/screenshots', import.meta.url));
mkdirSync(OUT, { recursive: true });
const GL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const SETUPS = [
  { name: '390x844', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 },
  { name: '1280x800', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ args: GL_ARGS });
for (const s of SETUPS) {
  const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.deviceScaleFactor });
  await ctx.addInitScript(() => { Math.random = () => 0.01; });
  const page = await ctx.newPage();
  let status = 500, offline = false;   // a routed request is answered even with the context offline, so the route fails it while offline
  const shot = (state) => page.screenshot({ path: `${OUT}/quiz-${s.name}-${state}.png` });
  await page.route('**/api/quiz-lead', (route) => (offline ? route.abort('internetdisconnected') : route.fulfill({ status, contentType: 'application/json', body: '{}' })));
  await page.goto(BASE, { waitUntil: 'load' });
  const t0 = Date.now();
  const ready = await page.waitForFunction(() => window.__s2 && window.__s2() && window.__s2().ready, null, { timeout: 420_000 }).then(() => true).catch(() => false);
  console.log(s.name, 'section 2 ready:', ready, 'after', Math.round((Date.now() - t0) / 1000), 's');
  // the decode: data-decoding is on #find while any text moves; settled() waits for it to go
  const settled = () => page.waitForFunction(() => !document.getElementById('find').hasAttribute('data-decoding'), null, { timeout: 30_000 }).then(() => sleep(150));
  const at = async (k) => { await page.evaluate((k) => { scrollTo(0, k * innerHeight); if (window.__skreedSnap) window.__skreedSnap(k); }, k); await sleep(900); };
  for (const k of [15.7, 16.2, 16.7]) { await at(k); await shot(`handoff-${k}`); }
  await at(17.2);
  await shot('intro');
  // each tap waits for its card to be on top and focused (the island keeps the main thread busy under SwiftShader, so a fixed pause can land on the card still leaving)
  const answer = async (personas, from = 0) => { for (const [k, p] of personas.entries()) { const card = page.locator(`.qz-card[data-i="${from + k}"].is-top`); await card.waitFor(); await page.waitForFunction((i) => document.activeElement?.closest?.('.qz-card')?.getAttribute('data-i') === String(i), from + k); await settled(); await card.locator(`.qz-opt[data-persona="${p}"]`).evaluate((b) => b.click()); } await settled(); };   // page-level clicks, as a tap behaves (Playwright's click may scroll to reach a button); each waits for its question to settle, as a press within 350 ms of a question appearing is dropped (deck.ts GUARD)
  await page.locator('#qzBegin').evaluate((b) => b.click());
  await page.locator('.qz-card[data-i="0"].is-top').waitFor();
  await sleep(300);
  await shot('card-decoding');
  await settled();
  await shot('card');
  // an answer taken: the rest of the question has wiped out and the answer holds its beat
  await page.locator('.qz-card[data-i="0"] .qz-opt[data-persona="curator"]').evaluate((b) => b.click());
  await sleep(230);
  await shot('card-answer');
  await page.locator('.qz-card[data-i="0"]').waitFor({ state: 'hidden' });
  await settled();
  await page.locator('.qz-card[data-i="1"] .qz-back').evaluate((b) => b.click());
  await page.locator('.qz-card[data-i="0"].is-top').waitFor();
  await settled();
  await answer(['curator', 'curator', 'curator']);
  await page.locator('.qz-card[data-i="3"].is-top').waitFor();
  await settled();
  await shot('card4');
  await page.locator('.qz-card[data-i="3"] .qz-back').evaluate((b) => b.click());
  await page.locator('.qz-card[data-i="2"].is-top').waitFor();
  await settled();
  await shot('back');
  await answer(Array(8).fill('curator'), 2);
  await settled();
  await shot('result');
  await page.evaluate(() => document.getElementById('qzGift').scrollIntoView({ block: 'end' }));
  await sleep(400);
  await shot('gift');
  await page.click('#qzSend');
  await sleep(500);
  await shot('gift-validation');
  await page.fill('#qzEmail', 'sam@example.com');
  await page.locator('.qz-check').click();
  await page.click('#qzSend');
  await sleep(600);
  await shot('gift-error');
  status = 409;
  await page.click('#qzSend');
  await sleep(600);
  await shot('gift-duplicate');
  await page.click('.qz-notyou');
  await page.fill('#qzEmail', 'sam@example.com');
  await page.locator('.qz-check').click();
  offline = true; await ctx.setOffline(true);
  await page.click('#qzSend');
  await sleep(600);
  await shot('gift-offline');
  status = 200;
  offline = false; await ctx.setOffline(false);
  await sleep(900);
  await shot('gift-done');
  for (const [name, persona] of [['result-spark', 'spark'], ['result-strategist', 'strategist']]) {
    await page.locator('.qz-result:not([hidden]) .qz-retry').evaluate((b) => b.click());
    await page.locator('.qz-card[data-i="0"].is-top').waitFor();
    await settled();
    await answer(Array(10).fill(persona), 0);
    await settled();
    await page.evaluate(() => document.getElementById('find').scrollIntoView({ block: 'start' }));
    await sleep(300);
    await shot(name);
  }
  console.log(s.name, 'done', await page.evaluate(() => ({ persona: document.querySelector('.qz-result:not([hidden])')?.dataset.persona, shade: document.querySelector('.qz-result:not([hidden]) .qz-big')?.dataset.shade, scrollW: document.scrollingElement.scrollWidth })));
  await ctx.close();
}
await browser.close();
