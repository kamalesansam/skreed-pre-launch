// Section 3's contrast on the fog (docs/specs/quiz.md 6, E-S3-contrast): Pearl Whisper text straight on section 2's fog,
// measured, not guessed. For the intro, the first question and a result, at 390x844 and 1280x800 on the forced 3D tier,
// it hides the quiz's text for one frame, screenshots the fog alone, and for every decoded line takes the fog's
// luminance inside the line's box: the median and the lightest 5 percent. Prints Pearl's contrast against each. The
// screenshot is decoded on a blank page of the same browser (no image library; the site's CSP does not apply there).
// Serve a hooks build first (as for frames.mjs).   node scripts/quiz/contrast.mjs [baseUrl]
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8799/?tier=hero3d';
const GL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const PEARL = lum(0xf7, 0xf6, 0xf3);
const ratio = (l) => (PEARL + 0.05) / (l + 0.05);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ args: GL_ARGS });
const rows = [];
for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { Math.random = () => 0.01; });
  const page = await ctx.newPage(), tool = await ctx.newPage();
  await page.bringToFront();
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__s2 && window.__s2() && window.__s2().ready, null, { timeout: 420_000 });
  const settled = () => page.waitForFunction(() => !document.getElementById('find').hasAttribute('data-decoding'), null, { timeout: 30_000 }).then(() => sleep(200));
  async function measure(state) {
    const boxes = await page.evaluate(() => [...document.querySelectorAll('#find [data-dc]')].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]'))
      .map((e) => { const r = e.querySelector('.dc')?.getBoundingClientRect() ?? e.getBoundingClientRect(); return { cls: e.className.split(' ')[0], x: r.x, y: r.y, w: r.width, h: r.height }; })
      .filter((b) => b.w > 0 && b.y + b.h > 0 && b.y < innerHeight));
    // through the CSSOM: the site's CSP takes no injected style element
    await page.evaluate(() => { window.__qzFocus = document.activeElement; for (const el of [document.getElementById('find'), document.querySelector('.site-logo')]) if (el) el.style.visibility = 'hidden'; });
    await sleep(100);
    const b64 = (await page.screenshot()).toString('base64');
    // hiding the section blurs its focused element; the focus goes back where it was
    await page.evaluate(() => { for (const el of [document.getElementById('find'), document.querySelector('.site-logo')]) if (el) el.style.visibility = ''; window.__qzFocus?.focus?.({ preventScroll: true }); });
    const px = await tool.evaluate(async ({ b64, boxes }) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      return boxes.map((b) => { const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y)), w = Math.min(c.width - x, Math.ceil(b.w)), h = Math.min(c.height - y, Math.ceil(b.h)); return w > 0 && h > 0 ? [...g.getImageData(x, y, w, h).data] : []; });
    }, { b64, boxes });
    for (const [k, b] of boxes.entries()) {
      const d = px[k], ls = [];
      for (let i = 0; i < d.length; i += 4) ls.push(lum(d[i], d[i + 1], d[i + 2]));
      if (!ls.length) continue;
      ls.sort((a, c) => a - c);
      const med = ls[Math.floor(ls.length / 2)], hi = ls[Math.floor(ls.length * 0.95)];
      rows.push({ vp: `${vp.width}x${vp.height}`, state, el: b.cls, median: ratio(med).toFixed(2), lightest5: ratio(hi).toFixed(2) });
    }
  }
  await page.evaluate(() => { scrollTo(0, 17.2 * innerHeight); if (window.__skreedSnap) window.__skreedSnap(17.2); });
  await sleep(600); await settled();
  await measure('intro');
  await page.locator('#qzBegin').evaluate((b) => b.click());
  await page.locator('.qz-card[data-i="0"].is-top').waitFor(); await settled();
  await measure('question 1');
  for (let i = 0; i < 10; i++) { await page.locator(`.qz-card[data-i="${i}"].is-top`).waitFor(); await page.waitForFunction((k) => document.activeElement?.closest?.('.qz-card')?.getAttribute('data-i') === String(k), i); await settled(); await page.locator(`.qz-card[data-i="${i}"] .qz-opt[data-persona="curator"]`).evaluate((b) => b.click()); }
  await page.locator('.qz-result:not([hidden])').waitFor(); await settled();
  await page.evaluate(() => document.getElementById('find').scrollIntoView({ block: 'start' })); await sleep(600);
  await measure('result');
  await ctx.close();
}
await browser.close();
console.table(rows);
const all = rows.map((r) => +r.median), lo = rows.map((r) => +r.lightest5);
console.log(`Pearl Whisper on the fog under the quiz's text: median ${Math.min(...all).toFixed(2)} to ${Math.max(...all).toFixed(2)}:1; against the lightest 5% of each line's fog, down to ${Math.min(...lo).toFixed(2)}:1 (AA for this size: 4.5:1)`);
