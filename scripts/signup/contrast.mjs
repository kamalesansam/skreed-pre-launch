// Section 5's contrast on the fog (docs/specs/section-5.md AC9, E-S5-contrast): Pearl Whisper text straight on section
// 2's fog, measured, not guessed, the quiz's method (scripts/quiz/contrast.mjs). At 390 x 844 and 1280 x 800 on the
// forced 3D tier it puts section 5 at rest (its top, then its end), hides the section's text for one frame, screenshots
// the fog with the jars, and for every decoded line takes the fog's luminance inside the line's box over ten frames
// 0.5 s apart: the median and the lightest 5 percent, and Pearl's contrast against each. Prints a Markdown table for
// docs/specs/evidence/section-5-contrast.md. Serve a hooks build first.
//   node scripts/signup/contrast.mjs [base=http://127.0.0.1:4321/] [--frames 10]
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4321/';
const fi = args.indexOf('--frames'), FRAMES = fi >= 0 ? Number(args[fi + 1]) : 10;
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--ignore-gpu-blocklist', '--enable-gpu'];
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const PEARL = lum(0xf7, 0xf6, 0xf3);
const ratio = (l) => (PEARL + 0.05) / (l + 0.05);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };

async function launch(args) {
  try { return await chromium.launch({ channel: 'chrome', args }); } catch { return chromium.launch({ args }); }
}
const browser = await launch(GL);
const rows = [];
for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), tool = await ctx.newPage();
  await page.bringToFront();
  await page.goto(new URL('/?tier=hero3d&glue=0&room=open', base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 300_000 });
  await page.evaluate(() => window.__skreedIntro?.skip?.());
  await page.waitForFunction(() => !document.documentElement.classList.contains('intro'), null, { timeout: 30_000 }).catch(() => {});
  await page.evaluate(() => window.__s5?.load());
  await page.waitForFunction(() => !!window.__s5?.ready, null, { timeout: 120_000 });
  // Astro's dev toolbar (the dev server only; a build has none) sits at the bottom centre, over the fog: out of the frames
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.style.setProperty('display', 'none', 'important'));
  for (const where of ['top', 'end']) {
    // the jump from the hall moves the room's layout under section 5 (its top read in the hall state is lower than at
    // rest in the world), so the place is read again once the page has settled and the scroll corrected
    for (let pass = 0; pass < 2; pass++) {
      await page.evaluate((where) => {
        const el = document.getElementById('signup'), top = el.getBoundingClientRect().top + scrollY;
        const y = where === 'top' ? top : window.__s4.state().restY;
        if (Math.abs(scrollY - y) < 1) return;
        scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight);
      }, where);
      await sleep(pass ? 1200 : 600);
    }
    const boxes = await page.evaluate(() => [...document.querySelectorAll('#signup [data-dc]')].filter((e) => e.getClientRects().length && !e.closest('[hidden]'))
      .map((e) => { const r = e.querySelector('.dc')?.getBoundingClientRect() ?? e.getBoundingClientRect(); return { cls: (e.className || e.tagName).split(' ')[0], text: (e.querySelector('.sr-only')?.textContent ?? '').slice(0, 24), x: r.x, y: r.y, w: r.width, h: r.height }; })
      .filter((b) => b.w > 0 && b.y + b.h > 0 && b.y < innerHeight));
    const samples = boxes.map(() => []);
    for (let f = 0; f < FRAMES; f++) {
      await page.evaluate(() => { for (const el of [document.getElementById('suBody'), document.querySelector('.site-logo'), document.getElementById('toTop')]) if (el) el.style.visibility = 'hidden'; });
      await sleep(60);
      const b64 = (await page.screenshot()).toString('base64');
      await page.evaluate(() => { for (const el of [document.getElementById('suBody'), document.querySelector('.site-logo'), document.getElementById('toTop')]) if (el) el.style.visibility = ''; });
      const px = await tool.evaluate(async ({ b64, boxes }) => {
        const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        return boxes.map((b) => { const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y)), w = Math.min(c.width - x, Math.ceil(b.w)), h = Math.min(c.height - y, Math.ceil(b.h)); return w > 0 && h > 0 ? [...g.getImageData(x, y, w, h).data] : []; });
      }, { b64, boxes });
      px.forEach((d, i) => { for (let k = 0; k < d.length; k += 4) samples[i].push(lum(d[k], d[k + 1], d[k + 2])); });
      await sleep(440);
    }
    boxes.forEach((b, i) => { const s = samples[i]; if (!s.length) return; let mx = 0; for (const v of s) if (v > mx) mx = v; rows.push({ vp: `${vp.width} x ${vp.height}`, where, cls: b.cls, text: b.text, median: ratio(q(s, 0.5)), light: ratio(q(s, 0.95)), worst: ratio(mx) }); });
  }
  await ctx.close();
}
await browser.close();
console.log(`| Viewport | Place | Line | Text | Median | Lightest 5 percent | Worst |\n|---|---|---|---|---|---|---|`);
for (const r of rows) console.log(`| ${r.vp} | ${r.where} | ${r.cls} | ${r.text} | ${r.median.toFixed(2)}:1 | ${r.light.toFixed(2)}:1 | ${r.worst.toFixed(2)}:1 |`);
const med = rows.map((r) => r.median);
console.log(`\n${rows.length} lines over ${FRAMES} frames each; medians from ${Math.min(...med).toFixed(2)}:1 to ${Math.max(...med).toFixed(2)}:1; ${med.filter((m) => m < 4.5).length} under 4.5:1 at the median`);
