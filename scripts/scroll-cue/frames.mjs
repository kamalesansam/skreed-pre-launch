// The cue's words (docs/specs/scroll-cue.md 7): review frames and the measurements behind acceptance 2, 4, 5 and 6, from a
// hooks build (PUBLIC_FAMILY_3D=on for the family pages) or the dev server. The landing on the poster tier at the top; the
// landing on the 3D path at the top after the intro and at rest in the pin (1, 2.5, 3, 5, 6, 10, 14.8 and 15.2 screens),
// with the places that must stay clear (5.5, 15.7, 17.2), the delay from the scroll to the words' return, and the contrast
// of the drawn page behind each line (the words hidden for the read; three reads 4 s apart, since the fog's hues drift); a
// family page on the 3D path, forced past SwiftShader as the family specs force it (?render=force&tier=high), at its top,
// at rest in the zoom and the story and on the argument screen, then in swatch grid mode; and the family lines' contrast
// for frosty-white, mellow-yellow and blissful-blue at 360 x 780, 390 x 844, 430 x 932 and 1280 x 800. Writes
// docs/specs/screenshots/scroll-cue-<w>-<state>.png and prints one JSON line per state. Every state waits for the words to
// settle; a move between two shown places first waits for the island's next frame to drop the class, so a shown state
// never passes on the place before. CHROME_PATH runs the installed Chrome in place of Playwright's Chromium.
//   node scripts/scroll-cue/frames.mjs [baseUrl] [--landing-only] [--family-only] [--contrast-only] [--390-only]
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FLAGS = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const BASE = (process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://127.0.0.1:8799/').replace(/\/?$/, '/');
const OUT = fileURLToPath(new URL('../../docs/specs/screenshots', import.meta.url));
mkdirSync(OUT, { recursive: true });
const GL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const SETUPS = [
  { name: '390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 },
  { name: '1280', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
].filter((s) => !FLAGS.has('--390-only') || s.name === '390');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PEARL = [0xf7, 0xf6, 0xf3], SLATE = [0x38, 0x3f, 0x43];
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** each line's state and every box it meets while shown, in CSS px */
const probe = (page, sel) => page.evaluate((sel) => {
  const box = (b) => (b && b.width && b.height ? { l: Math.round(b.left * 10) / 10, t: Math.round(b.top * 10) / 10, r: Math.round(b.right * 10) / 10, b: Math.round(b.bottom * 10) / 10 } : null);
  const textBox = (e) => { const r = document.createRange(); r.selectNodeContents(e); return box(r.getBoundingClientRect()); };
  const hit = (a, b) => a && b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  const shown = (e) => { const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && Number(c.opacity) > 0.05; };
  const out = {};
  for (const e of document.querySelectorAll(sel)) {
    const cs = getComputedStyle(e), tb = textBox(e);
    const others = shown(e) ? [...document.querySelectorAll('#cue, #cue2, #cdEyebrow, #count .n, #count .l, #toTop, .s2lab, #famBack, .fp-scrub, .fp-ctl, .bar, .beat.on .beat-txt, .beatnav, .hud-btn, #siteLogo, #siteNav .snav-a, .allfam')]
      .filter((o) => o !== e && shown(o)).map((o) => {
        const isText = ['toTop', 'famBack'].includes(o.id) || o.classList.contains('allfam');
        return { id: o.id || o.className.toString().split(' ')[0], b: isText ? textBox(o) : box(o.getBoundingClientRect()) };
      }).filter((o) => hit(tb, o.b)).map((o) => o.id) : [];
    out[e.id || e.className] = { opacity: Math.round(Number(cs.opacity) * 100) / 100, visibility: cs.visibility, display: cs.display, on: e.classList.contains('is-on'), at: e.dataset.at || '', tone: e.dataset.tone || '', color: cs.color, box: tb, overlaps: others };
  }
  out.cue = box(document.getElementById('cue')?.getBoundingClientRect());
  out.screens = Math.round((scrollY / innerHeight) * 100) / 100;
  return out;
}, sel);
/** the line settled: shown (opacity 1) or hidden (opacity 0 and the visibility after it) */
const settle = (page, sel, want, timeout = 90_000) => page.waitForFunction(([sel, want]) => {
  const e = document.querySelector(sel); if (!e) return false;
  const c = getComputedStyle(e), o = Number(c.opacity);
  return want ? o > 0.99 && c.visibility === 'visible' : o < 0.01 || c.visibility === 'hidden' || c.display === 'none';
}, [sel, want], { timeout, polling: 100 }).then(() => true).catch(() => false);
/** a frame with the chevrons held at 1.4 s of their cycle (all three drawn) and the dev toolbar hidden */
async function frame(page, path) {
  await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
  await page.evaluate(() => { for (const a of document.getAnimations()) { const t = a.effect?.target; if (t && t.closest && t.closest('.scrollcue')) { a.pause(); a.currentTime = 1400; } } });
  await page.screenshot({ path });
  await page.evaluate(() => { for (const a of document.getAnimations()) { const t = a.effect?.target; if (t && t.closest && t.closest('.scrollcue')) a.play(); } });
}
/** the page drawn behind a line: the line hidden for one screenshot, the pixels of its text box (2 px out), the median
 *  and the darkest and lightest twentieths, against Pearl Whisper and Urban Slate (sRGB, WCAG) */
async function behind(page, sel) {
  const b = await page.evaluate((sel) => { const e = document.querySelector(sel); const r = document.createRange(); r.selectNodeContents(e); const q = r.getBoundingClientRect(); return { l: q.left - 2, t: q.top - 2, r: q.right + 2, b: q.bottom + 2, dpr: devicePixelRatio }; }, sel);
  const tag = await page.addStyleTag({ content: `${sel}{visibility:hidden!important;transition:none!important}` });
  await sleep(120);
  const png = await page.screenshot();
  await tag.evaluate((n) => n.remove());
  const img = sharp(png); const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const L = [];
  for (let y = Math.max(0, Math.round(b.t * b.dpr)); y < Math.min(info.height, Math.round(b.b * b.dpr)); y++) for (let x = Math.max(0, Math.round(b.l * b.dpr)); x < Math.min(info.width, Math.round(b.r * b.dpr)); x++) { const i = (y * info.width + x) * info.channels; L.push(lum([data[i], data[i + 1], data[i + 2]])); }
  L.sort((a, c) => a - c);
  const med = L[L.length >> 1], dark = L[Math.floor(L.length * 0.05)], light = L[Math.floor(L.length * 0.95)];
  const r2 = (v) => Math.round(v * 100) / 100;
  return { pearl: { median: r2(ratio(lum(PEARL), med)), worst: r2(ratio(lum(PEARL), light)) }, slate: { median: r2(ratio(lum(SLATE), med)), worst: r2(ratio(lum(SLATE), dark)) } };
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: GL_ARGS });
const log = (name, state, data) => console.log(JSON.stringify({ name, state, ...data }));

for (const s of SETUPS) {
  if (!FLAGS.has('--family-only') && !FLAGS.has('--contrast-only')) {
    {
      const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.deviceScaleFactor, bypassCSP: true });
      const page = await ctx.newPage();
      await page.goto(`${BASE}?tier=poster`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => { const i = document.querySelector('.hero-poster img'); return !i || (i.complete && i.naturalWidth > 0); }, null, { timeout: 60_000 }).catch(() => {});
      await sleep(1500);   // the poster fades in after it decodes
      log(s.name, 'poster-top', { settled: await settle(page, '#cueText', true), contrast: await behind(page, '#cueText'), ...(await probe(page, '#cueText')) });
      await frame(page, `${OUT}/scroll-cue-${s.name}-top-poster.png`);
      await page.evaluate(() => scrollTo(0, 9));
      log(s.name, 'poster-9px', { settled: await settle(page, '#cueText', false), ...(await probe(page, '#cueText')) });
      await ctx.close();
    }
    {
      const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.deviceScaleFactor, bypassCSP: true });
      const page = await ctx.newPage();
      await page.goto(`${BASE}?tier=hero3d`, { waitUntil: 'load' });
      const t0 = Date.now();
      const ready = await page.waitForFunction(() => window.__s2 && window.__s2() && window.__s2().ready, null, { timeout: 420_000 }).then(() => true).catch(() => false);
      console.log(s.name, 'section 2 ready:', ready, 'after', Math.round((Date.now() - t0) / 1000), 's');
      await page.evaluate(() => {
        const el = document.getElementById('cueText');
        window.__onAt = 0;
        new MutationObserver(() => { if (el.classList.contains('is-on') && !window.__onAt) window.__onAt = performance.now(); }).observe(el, { attributes: true, attributeFilter: ['class'] });
      });
      const at = (k) => page.evaluate((k) => { window.__onAt = 0; scrollTo(0, k * innerHeight); if (window.__skreedSnap) window.__skreedSnap(k); return performance.now(); }, k);
      await at(0);
      log(s.name, 'hero-top', { settled: await settle(page, '#cueText', true), contrast: await behind(page, '#cueText'), ...(await probe(page, '#cueText')) });
      await frame(page, `${OUT}/scroll-cue-${s.name}-top.png`);
      const rows = [[1, 'pull-1', true], [2.5, 'pull', true], [3, 'pull-3', true], [5, 'pull-end', true], [5.5, 'wipe1-mid', false], [6, 'wipe1-end', true],
        [10, 'cascade', true], [14.8, 'gems', true], [15.2, 'gems-glue', true], [15.7, 'wipe2-mid', false], [17.2, 'quiz', false]];
      for (const [k, state, want] of rows) {
        const sent = await at(k);
        if (want) await page.waitForFunction(() => window.__onAt > 0, null, { timeout: 90_000 }).catch(() => {});   // a class added after this move: never pass on the place before
        if (!want) { await sleep(2100); log(s.name, state, { want, settled: await settle(page, '#cueText', false), ...(await probe(page, '#cueText')) }); continue; }
        const ok = await settle(page, '#cueText', true);
        const onAt = await page.evaluate(() => window.__onAt);
        const reads = [];
        for (let n = 0; n < 3; n++) { if (n) await sleep(4000); reads.push(await behind(page, '#cueText')); }
        log(s.name, state, { want, settled: ok, showMs: Math.round(onAt - sent), contrast: reads, ...(await probe(page, '#cueText')) });
        if (['pull', 'wipe1-end', 'cascade', 'gems', 'gems-glue'].includes(state)) await frame(page, `${OUT}/scroll-cue-${s.name}-${state}.png`);
        if (state === 'gems-glue') {   // moving from a shown place: the class goes on the island's next frame and the words fade out within 0.5 s of it
          await page.evaluate(() => scrollBy(0, -40));
          const goneAt = Date.now(); const gone = await settle(page, '#cueText', false, 20_000);
          log(s.name, 'gems-moving', { settled: gone, ms: Date.now() - goneAt, ...(await probe(page, '#cueText')) });
        }
      }
      await ctx.close();
    }
  }
  if (!FLAGS.has('--landing-only') && !FLAGS.has('--contrast-only')) {
    const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.deviceScaleFactor, bypassCSP: true });
    const page = await ctx.newPage();
    await page.goto(`${BASE}shades/blissful-blue/?render=force&tier=high`, { waitUntil: 'load' });
    const lifted = await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 300_000 }).then(() => true).catch(() => false);
    console.log(s.name, 'family loader lifted:', lifted, 'classes', await page.evaluate(() => document.documentElement.className));
    log(s.name, 'family-top', { settled: await settle(page, '.cuetext.is-land', true), ...(await probe(page, '.cuetext')) });
    await frame(page, `${OUT}/scroll-cue-${s.name}-family-top.png`);
    for (const [k, state, sel, want] of [[0.3, 'family-hud-rest', '.cuetext.is-land', true], [1.2, 'family-zoom', '.cuetext.is-story', true], [2.1, 'family-story', '.cuetext.is-story', true], [6.5, 'family-argument', '.cuetext.is-story', false]]) {
      await page.evaluate((k) => scrollTo(0, k * innerHeight), k);
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-still'), null, { timeout: 10_000 }).catch(() => {});
      await sleep(k > 6 ? 3200 : 2100);
      const ok = await settle(page, sel, want);
      log(s.name, state, { want, settled: ok, ...(await probe(page, '.cuetext')) });
      if (state !== 'family-hud-rest') await frame(page, `${OUT}/scroll-cue-${s.name}-${state}.png`);
    }
    await ctx.close();
    const g = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.deviceScaleFactor, bypassCSP: true });
    const gp = await g.newPage();
    await gp.goto(`${BASE}shades/blissful-blue/?mode=grid`, { waitUntil: 'load' }); await sleep(1200);
    log(s.name, 'family-grid', { ...(await probe(gp, '.cuetext')), columns: await gp.evaluate(() => [...document.querySelectorAll('.scrollcue')].map((e) => getComputedStyle(e).visibility)) });
    await g.close();
  }
}
// the family lines' contrast on the drawn page, per family's opening shade, at four sizes
if (!FLAGS.has('--landing-only')) {
  for (const [w, h] of FLAGS.has('--390-only') ? [[390, 844]] : [[360, 780], [390, 844], [430, 932], [1280, 800]]) {
    for (const slug of ['frosty-white', 'mellow-yellow', 'blissful-blue']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, bypassCSP: true });
      const page = await ctx.newPage();
      await page.goto(`${BASE}shades/${slug}/?render=force&tier=high`, { waitUntil: 'load' });
      await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 300_000 }).catch(() => {});
      await page.waitForFunction(() => document.querySelector('#st3d canvas.on'), null, { timeout: 120_000 }).catch(() => {});
      await sleep(1200);
      const land = await settle(page, '.cuetext.is-land', true, 20_000) ? await behind(page, '.cuetext.is-land') : 'not shown';
      await page.evaluate(() => scrollTo(0, 2.1 * innerHeight));
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-still'), null, { timeout: 10_000 }).catch(() => {});
      await sleep(2100);
      const story = await settle(page, '.cuetext.is-story', true) ? await behind(page, '.cuetext.is-story') : 'not shown';
      log(`${w}x${h}`, `contrast-${slug}`, { land, story, tight: await page.evaluate(() => document.documentElement.classList.contains('cue-tight')) });
      await ctx.close();
    }
  }
}
await browser.close();
