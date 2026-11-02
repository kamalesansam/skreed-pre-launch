// Section 5's measuring pass in a browser (docs/specs/section-5-picture.md section 16): the fit at the ten cases with
// the form on and off (items 1 to 3, read on the poster tier, where the page is the same DOM over its own ground), the
// ground, the falloff and the island at rest on the 3D path (items 7 and 8), the contrast as rendered (9), the fill's
// timing and its on-screen pop (10), data-ready (11) and the as-built record (12), from a hooks build (the dev server by
// default). The form's "off" cases take the production markup's shape in the same page: the heading and the form nodes
// removed and .su-body given su-noform, as Signup.astro renders it with PUBLIC_LEADS off. Writes measure.json and
// measure.md to the output folder.
//   node scripts/signup/measure.mjs [base=http://127.0.0.1:4321/] [--out <dir>] [--skip-3d]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4321/';
const oi = args.indexOf('--out'), out = oi >= 0 ? args[oi + 1] : 'test-results/signup-measure';
const skip3d = args.includes('--skip-3d');
// --only fit,contrast,fill,record,ground reruns those parts over an earlier measure.json in the output folder
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const want = (part) => !ONLY || ONLY.includes(part);
mkdirSync(out, { recursive: true });
const GL = ['--ignore-gpu-blocklist', '--enable-gpu'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CASES = [[1280, 800], [1366, 657], [1536, 730], [1920, 970], [768, 1024], [412, 915], [390, 844], [360, 780], [390, 664], [375, 667]];
const FORM_OFF_ONLY = new Set(['390x664', '375x667']);
const FACES = ['300 16px Inter', '400 16px Inter', '700 16px Inter', '400 16px Jost'];
const R = { cases: [], contrast: {}, fill: {}, ready: {}, ground: {}, asBuilt: {} };
if (ONLY && existsSync(join(out, 'measure.json'))) Object.assign(R, JSON.parse(readFileSync(join(out, 'measure.json'), 'utf8')));
const log = (...a) => console.log(...a);

async function launch() {
  try { const b = await chromium.launch({ channel: 'chrome', args: GL }); log('browser: the installed Chrome (channel chrome)'); return b; }
  catch (e) { log(`browser: Playwright's Chromium (${String(e.message ?? e).split('\n')[0]})`); return chromium.launch({ args: GL }); }
}
const browser = await launch();

/** a page at a viewport, section 5 open at its rest (its top at the viewport's top), the fonts in */
async function open(w, h, tier, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: extra.dpr ?? 1, isMobile: w < 720, hasTouch: w < 720, reducedMotion: extra.reduced ? 'reduce' : 'no-preference', javaScriptEnabled: extra.js !== false });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => log(`[${w}x${h} ${tier}] page error: ${e.message}`));
  await page.addInitScript(() => {
    const w = window;
    w.__su = { mount: null, ready: null, readyFonts: null, readyImgs: null, filled: [], nextShown: [] };
    const t = setInterval(() => { if (w.__skreedSignupHooks && w.__su.mount == null) { w.__su.mount = performance.now(); clearInterval(t); } }, 5);
    addEventListener('skreed:signup-filled', (e) => { w.__su.filled.push({ state: e.detail.state, t: performance.now() }); });
    new MutationObserver((ms) => {
      for (const m of ms) {
        const el = m.target;
        if (m.attributeName === 'data-ready' && el.id === 'signup' && el.dataset.ready === '1' && w.__su.ready == null) {
          w.__su.ready = performance.now();
          w.__su.readyFonts = ['300 16px Inter', '400 16px Inter', '700 16px Inter', '400 16px Jost'].map((f) => document.fonts.check(f));
          w.__su.readyImgs = [...el.querySelectorAll('img')].filter((i) => i.getAttribute('src')).map((i) => i.complete);
        }
        if (m.attributeName === 'hidden' && el.matches?.('picture.su-pic[data-layer="next"]') && !el.hidden) w.__su.nextShown.push(performance.now());
      }
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-ready', 'hidden'] });   // the document itself: its root element does not exist yet when an init script runs
  });
  await page.goto(new URL(`/?tier=${tier}&glue=0&room=open`, base).href, { waitUntil: 'load' });
  if (extra.js === false) return { ctx, page };
  await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
  if (tier === 'hero3d') {
    await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 300_000 });
    await page.evaluate(() => window.__skreedIntro?.skip?.());
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro'), null, { timeout: 30_000 }).catch(() => log(`[${w}x${h}] the intro class stayed`));
  }
  await page.waitForFunction(() => !document.getElementById('signup')?.hidden, null, { timeout: 30_000 });
  for (let pass = 0; pass < 2; pass++) {
    await page.evaluate(() => { const el = document.getElementById('signup'), y = el.getBoundingClientRect().top + scrollY; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); });
    await sleep(tier === 'hero3d' ? 900 : 300);
  }
  await page.waitForFunction(() => document.getElementById('signup')?.dataset.ready === '1' && !!window.__skreedSignupHooks, null, { timeout: 15_000 }).catch(() => log(`[${w}x${h}] section 5 not ready within 15 s`));
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__skreedSignupHooks?.reset());
  await sleep(300);
  return { ctx, page };
}

/** the production markup's shape with the form off: the heading block and the form removed, .su-body su-noform */
const formOff = (page) => page.evaluate(() => {
  document.documentElement.style.overflowAnchor = 'none';   // removing nodes in view would otherwise let scroll anchoring move the page
  for (const e of document.querySelectorAll('#signup .su-got, #signup .su-form')) e.remove();
  document.getElementById('suBody').classList.add('su-noform');
  const el = document.getElementById('signup');
  scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' });
});

/** the boxes, the sizes, the gaps and the placement, read in the page */
const MEASURE = () => {
  const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
  const box = (e) => { const b = e.getBoundingClientRect(); return { x: +b.left.toFixed(2), y: +b.top.toFixed(2), r: +b.right.toFixed(2), b: +b.bottom.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2), cx: +((b.left + b.right) / 2).toFixed(2), cy: +((b.top + b.bottom) / 2).toFixed(2) }; };
  const body = $('#suBody'), cs = getComputedStyle(body);
  const vh = innerHeight, vw = innerWidth, top = parseFloat(cs.paddingTop), bot = parseFloat(cs.paddingBottom), inset = parseFloat(cs.paddingLeft);
  // the text column (the headline's), the jar band's column and the frame: one and the same in the single column, three on the laptop's two-column layout
  const col = box($('.su-top')), rowBox = box($('.su-row'));
  const frame = { x: box(body).x + inset, w: box(body).w - 2 * inset }; frame.cx = frame.x + frame.w / 2;
  const named = [];
  const add = (name, el) => { if (el) named.push({ name, ...box(el) }); };
  $$('.su-h > span').forEach((e, i) => add(`headline ${i + 1}`, e));
  add('sub-line', $('.su-sub')); add('label', $('.su-every'));
  $$('.su-jar').forEach((e, i) => add(`jar ${i + 1}`, e));
  $$('.su-icon').forEach((e, i) => add(`mark ${i + 1}`, e));
  $$('.su-worth').forEach((e, i) => add(`worth ${i + 1}`, e));
  $$('.su-rule').forEach((e, i) => add(`hairline ${i ? 'right' : 'left'}`, e));
  add('heading', $('.su-got-h h3')); add('grey lines', $('.su-grey')); add('form', $('.su-slotf')); add('message line', $('.su-msgrow')); add('footer', $('.su-keep'));
  const contentTop = Math.min(...named.map((n) => n.y)), contentBottom = Math.max(...named.map((n) => n.b));
  const outside = named.filter((n) => n.y < top - 0.5 || n.b > vh + 0.5 || n.x < inset - 0.5 || n.r > vw - inset + 0.5).map((n) => n.name);
  const overlaps = [];
  for (let i = 0; i < named.length; i++) for (let j = i + 1; j < named.length; j++) {
    const a = named[i], b = named[j], ox = Math.min(a.r, b.r) - Math.max(a.x, b.x), oy = Math.min(a.b, b.b) - Math.max(a.y, b.y);
    if (ox > 0.5 && oy > 0.5) overlaps.push(`${a.name} and ${b.name} (${ox.toFixed(1)} x ${oy.toFixed(1)} px)`);
  }
  const fs = (s) => { const e = $(s); return e ? +parseFloat(getComputedStyle(e).fontSize).toFixed(2) : null; };
  const type = {};
  for (const [name, sel] of [['headline', '.su-h'], ['sub-line', '.su-sub'], ['bold run', '.su-sub strong'], ['label', '.su-every'], ['worth', '.su-worth'], ['heading', '.su-got-h h3'], ['grey lines', '.su-grey'], ['field', '#suEmail'], ['button', '.su-send'], ['footer', '.su-keep']]) {
    const e = $(sel); if (!e) continue;
    const c = getComputedStyle(e), size = parseFloat(c.fontSize), ls = c.letterSpacing === 'normal' ? 0 : parseFloat(c.letterSpacing);
    type[name] = { family: c.fontFamily.split(',')[0].replace(/"/g, ''), weight: c.fontWeight, size: +size.toFixed(2), lsEm: +(ls / size).toFixed(4), lh: c.lineHeight === 'normal' ? 'normal' : +(parseFloat(c.lineHeight) / size).toFixed(3), color: c.color, opsz: c.fontOpticalSizing, transform: c.textTransform };
  }
  const by = (n) => named.find((x) => x.name === n);
  const jars = named.filter((n) => n.name.startsWith('jar ')), marks = named.filter((n) => n.name.startsWith('mark ')), worths = named.filter((n) => n.name.startsWith('worth '));
  const gapsList = [['clearance to headline', top, by('headline 1')?.y], ['headline to sub-line', by('headline 2')?.b, by('sub-line')?.y], ['sub-line to label', by('sub-line')?.b, by('label')?.y], ['label to the jars', by('label')?.b, jars[0]?.y], ['jars to marks', jars[0]?.b, marks[0]?.y], ['marks to worth labels', marks[0]?.b, worths[0]?.y], ['worth labels to heading', worths[0]?.b, by('heading')?.y], ['heading to grey lines', by('heading')?.b, by('grey lines')?.y], ['grey lines to form', by('grey lines')?.b, by('form')?.y], ['form to footer', by('form')?.b, by('footer')?.y], ['worth labels to footer', worths[0]?.b, by('footer')?.y], ['footer to the bottom padding', by('footer')?.b, vh - bot]];
  const gaps = Object.fromEntries(gapsList.filter(([, a, b]) => a != null && b != null).map(([k, a, b]) => [k, +(b - a).toFixed(1)]));
  const axes = jars.map((j) => j.cx);
  return {
    vw, vh, top: +top.toFixed(1), bot: +bot.toFixed(1), inset, column: { x: col.x, w: col.w, cx: col.cx },
    contentTop: +contentTop.toFixed(1), contentBottom: +contentBottom.toFixed(1), contentHeight: +(contentBottom - contentTop).toFixed(1), heightLeft: +(vh - top - bot).toFixed(1), free: +((vh - bot) - contentBottom).toFixed(1),
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, bodyH: +body.getBoundingClientRect().height.toFixed(1),
    outside, overlaps, type,
    sizes: { headlineLines: $$('.su-h > span').map((e) => +e.getBoundingClientRect().width.toFixed(1)), jarDiameter: jars.map((j) => j.w), jarHeight: jars.map((j) => j.h), rowWidth: +($('.su-row').getBoundingClientRect().width).toFixed(1), axes: axes.map((a) => +a.toFixed(1)), axisSpacing: axes.slice(1).map((a, i) => +(a - axes[i]).toFixed(1)), markHeight: marks.map((m) => m.h), markWidth: marks.map((m) => m.w), form: by('form') ? { w: by('form').w, h: by('form').h, pill: box($('.su-pill')).h, button: box($('.su-send')).w } : null, hairlines: named.filter((n) => n.name.startsWith('hairline')).map((n) => n.w), gaps },
    placement: { indent: +(by('sub-line').x + parseFloat(getComputedStyle($('.su-sub')).paddingLeft) - by('headline 1').x).toFixed(2), indentWanted: +(0.0255 * col.w).toFixed(2), centres: Object.fromEntries([['label', by('label'), rowBox.cx], ['jar row (mean of the axes)', { cx: axes.reduce((a, b) => a + b, 0) / axes.length }, rowBox.cx], ['heading', by('heading'), frame.cx], ['grey lines', by('grey lines'), frame.cx], ['form', by('form'), frame.cx], ['footer', by('footer'), frame.cx]].filter(([, b]) => b).map(([k, b, c]) => [k, +(b.cx - c).toFixed(2)])), twoColumns: Math.abs(rowBox.cx - col.cx) > 1, marksOffAxis: marks.map((m, i) => +(m.cx - jars[i].cx).toFixed(2)), worthsOffMark: worths.map((w, i) => +(w.cx - marks[i].cx).toFixed(2)), jarShareOfColumn: jars.map((j) => +(j.w / col.w).toFixed(4)) },
    boxes: named,
  };
};

// ---- items 1 to 3: the fit at the ten cases, the form on and off
if (want('fit')) R.cases = [];
for (const [w, h] of want('fit') ? CASES : []) {
  for (const form of FORM_OFF_ONLY.has(`${w}x${h}`) ? ['off'] : ['on', 'off']) {
    const { ctx, page } = await open(w, h, 'poster');
    if (form === 'off') { await formOff(page); await sleep(150); }
    const m = await page.evaluate(MEASURE);
    const floors = w < 720 ? { body: 13, worth: 11 } : { body: 15, worth: 13 };
    const bodyMin = Math.min(...['sub-line', 'grey lines', 'footer', 'field', 'button'].map((k) => m.type[k]?.size ?? Infinity));
    const floorsHold = bodyMin >= floors.body - 0.01 && (m.type.worth?.size ?? 99) >= floors.worth - 0.01;
    R.cases.push({ w, h, form, ...m, floors, bodyMin, floorsHold });
    log(`[${w} x ${h}, form ${form}] content ${m.contentHeight} of ${m.heightLeft} px left, free ${m.free}, outside ${m.outside.length ? m.outside.join(', ') : 'none'}, overlaps ${m.overlaps.length ? m.overlaps.join('; ') : 'none'}, overflowX ${m.overflowX}, body ${m.bodyH} of ${m.vh}, floors ${floorsHold ? 'hold' : 'BROKEN'} (body ${bodyMin}, worth ${m.type.worth?.size})`);
    await page.screenshot({ path: join(out, `fit-${w}x${h}-${form}.png`) });
    await ctx.close();
  }
}

// ---- item 9: the contrast as rendered, at 390 x 844 and 1280 x 800 (device pixel ratio 2), from the pixels
const lum = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
async function pixels(page) { const png = await page.screenshot(); const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height, px(x, y) { const i = (Math.round(y) * info.width + Math.round(x)) * 4; return [data[i], data[i + 1], data[i + 2]]; } }; }
for (const [w, h] of want('contrast') ? [[390, 844], [1280, 800]] : []) {
  const { ctx, page } = await open(w, h, 'poster', { dpr: 2 });
  // the placeholder's box is the field's left half: the black button lies over the field's right end
  const boxes = await page.evaluate(() => Object.fromEntries([['headline', '.su-h'], ['sub-line', '.su-sub'], ['label', '.su-every'], ['worth labels', '.su-worth'], ['heading', '.su-got-h h3'], ['grey lines', '.su-grey'], ['placeholder', '#suEmail'], ['button', '.su-send'], ['footer', '.su-keep']].map(([k, s]) => { const e = document.querySelector(s); if (!e) return [k, null]; const b = e.getBoundingClientRect(); return [k, { x: b.left, y: b.top, w: k === 'placeholder' ? b.width * 0.5 : b.width, h: b.height }]; })));
  const P = await pixels(page);
  const ground = lum(...P.px(2 * 4, 2 * (boxes.footer.y + boxes.footer.h + 2)));
  const rows = {};
  for (const [k, b] of Object.entries(boxes)) {
    if (!b) continue;
    let lo = 1, hi = 0;
    for (let y = Math.floor(b.y * 2); y < Math.ceil((b.y + b.h) * 2); y++) for (let x = Math.floor(b.x * 2); x < Math.ceil((b.x + b.w) * 2); x++) { const L = lum(...P.px(x, y)); if (L < lo) lo = L; if (L > hi) hi = L; }
    rows[k] = k === 'button' ? +ratio(hi, lo).toFixed(2) : +ratio(lo, ground).toFixed(2);
  }
  R.contrast[`${w}x${h}`] = { groundLuminance: +ground.toFixed(4), ratios: rows };
  log(`[${w} x ${h}] contrast as rendered: ${JSON.stringify(rows)}`);
  await ctx.close();
}

// ---- items 10 and 11: the fill's timing, its pop on screen, the queue, reduced motion; data-ready
if (want('fill')) {
  const { ctx, page } = await open(390, 844, 'poster', { dpr: 2 });
  const su = await page.evaluate(() => window.__su);
  R.ready['390x844'] = { mountToReady: su.ready != null && su.mount != null ? +(su.ready - su.mount).toFixed(0) : null, fontsCheckedAtReady: su.readyFonts, imagesCompleteAtReady: su.readyImgs, by: su.ready != null && su.mount != null && su.ready - su.mount < 3900 ? 'the decodes' : 'the 4 s timer' };
  const jarBox = await page.evaluate(() => { const b = document.querySelector('.su-yours .su-jar').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  const before = await pixels(page);
  const t0 = await page.evaluate(() => { const t = performance.now(); window.__skreedSignupHooks.press('facebook'); return t; });
  await page.waitForFunction(() => window.__su.nextShown.length > 0, null, { timeout: 5000 });
  const firstFrame = await pixels(page);
  const anim = await page.evaluate(() => { const a = document.getAnimations().find((x) => x.effect?.target?.matches?.('picture.su-pic')); return a ? { duration: a.effect.getTiming().duration, easing: a.effect.getTiming().easing } : null; });
  await page.waitForFunction(() => window.__su.filled.length > 0, null, { timeout: 5000 });
  const r1 = await page.evaluate(() => window.__su);
  // the pop: the largest change inside the jar's box below the old surface (the whole frame for the first press) between the rest frame and the reveal's first frame
  let pop = 0, popN = 0;
  for (let y = Math.floor(jarBox.y * 2); y < Math.ceil((jarBox.y + jarBox.h) * 2); y++) for (let x = Math.floor(jarBox.x * 2); x < Math.ceil((jarBox.x + jarBox.w) * 2); x++) { const a = before.px(x, y), b = firstFrame.px(x, y); const d = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])); if (d > pop) pop = d; if (d > 8) popN++; }
  const fb = { delayToReveal: +(r1.nextShown[0] - t0).toFixed(0), revealLength: +(r1.filled[0].t - r1.nextShown[0]).toFixed(0), pressToFilled: +(r1.filled[0].t - t0).toFixed(0), animation: anim, popMax: pop, popPixelsOver8: popN, state: r1.filled[0].state };
  // the second fill's pop: the layer swap below the old top with two lossy files of the same grains
  await sleep(300);
  const beforeY = await pixels(page);
  const t1 = await page.evaluate(() => { const t = performance.now(); window.__skreedSignupHooks.press('youtube'); return t; });
  await page.waitForFunction(() => window.__su.nextShown.length > 1, null, { timeout: 5000 });
  // the reveal's very first frame: the animation held at its start while the capture is taken, then let run
  await page.evaluate(() => { const a = document.getAnimations().find((x) => x.effect?.target?.matches?.('picture.su-pic')); if (a) { a.pause(); a.currentTime = 0; } });
  const firstY = await pixels(page);
  await page.evaluate(() => { for (const a of document.getAnimations()) if (a.playState === 'paused') a.play(); });
  const oldTop = await page.evaluate(() => { const j = document.querySelector('.su-yours .su-jar'); const p = j.querySelector('picture.su-pic[data-layer="next"]') ?? j.querySelector('picture'); const b = p.getBoundingClientRect(); return { y: b.top, h: b.height }; });
  await page.waitForFunction(() => window.__su.filled.length > 1, null, { timeout: 5000 });
  const r2 = await page.evaluate(() => window.__su);
  // the pop at the second fill's first frame: below f's seam (0.7063 of the frame) the two renders should agree within the encoders' error; the band from f's top (0.5729) to its seam holds the new grains over the old surface and should still be hidden by the clip
  const popIn = (y0, y1) => { let m = 0, n = 0; for (let y = Math.max(y0, Math.floor(jarBox.y * 2)); y < Math.min(y1, Math.ceil((jarBox.y + jarBox.h) * 2)); y++) for (let x = Math.floor(jarBox.x * 2); x < Math.ceil((jarBox.x + jarBox.w) * 2); x++) { const a = beforeY.px(x, y), b = firstY.px(x, y); const d = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])); if (d > m) m = d; if (d > 8) n++; } return { max: m, over8: n }; };
  const seamRow = Math.floor((oldTop.y + oldTop.h * 0.7063) * 2), topRow = Math.floor((oldTop.y + oldTop.h * 0.5729) * 2);
  const yt = { delayToReveal: +(r2.nextShown[1] - t1).toFixed(0), revealLength: +(r2.filled[1].t - r2.nextShown[1]).toFixed(0), popBelowOldSeam: popIn(seamRow, 1e9), popInTheBandTopToSeam: popIn(topRow, seamRow), state: r2.filled[1].state };
  // the queue: two presses at once
  await page.evaluate(() => window.__skreedSignupHooks.reset()); await sleep(300);
  const tq = await page.evaluate(() => { const t = performance.now(); window.__skreedSignupHooks.press('instagram'); window.__skreedSignupHooks.press('facebook'); window.__skreedSignupHooks.press('instagram'); return t; });
  await page.waitForFunction(() => window.__su.filled.length >= 4, null, { timeout: 8000 });
  const rq = await page.evaluate(() => window.__su);
  const queue = rq.filled.slice(2).map((f) => ({ state: f.state, t: +(f.t - tq).toFixed(0) }));
  const live = await page.evaluate(() => document.getElementById('suLive').textContent);
  const alt = await page.evaluate(() => document.getElementById('suYours').getAttribute('aria-label'));
  // a repeat press: nothing
  const rep = await page.evaluate(() => { const n = window.__su.filled.length; window.__skreedSignupHooks.press('instagram'); return new Promise((r) => setTimeout(() => r({ added: window.__su.filled.length - n, state: window.__skreedSignupHooks.state() }), 1800)); });
  R.fill = { facebook: fb, youtube: yt, queue, repeatPress: rep, liveAfterQueue: live, jarAltAfterQueue: alt };
  log(`fill: ${JSON.stringify(R.fill)}`);
  await ctx.close();
}
if (want('fill')) {
  const { ctx, page } = await open(1280, 800, 'poster');
  const su = await page.evaluate(() => window.__su);
  R.ready['1280x800'] = { mountToReady: su.ready != null && su.mount != null ? +(su.ready - su.mount).toFixed(0) : null, fontsCheckedAtReady: su.readyFonts, imagesCompleteAtReady: su.readyImgs, by: su.ready != null && su.mount != null && su.ready - su.mount < 3900 ? 'the decodes' : 'the 4 s timer' };
  await ctx.close();
}
if (want('fill')) {
  const { ctx, page } = await open(390, 844, 'poster', { reduced: true });
  const t0 = await page.evaluate(() => { const t = performance.now(); window.__skreedSignupHooks.press('facebook'); return t; });
  await page.waitForFunction(() => window.__su.filled.length > 0, null, { timeout: 5000 });
  const su = await page.evaluate(() => window.__su);
  R.fill.reducedMotion = { pressToFilled: +(su.filled[0].t - t0).toFixed(0), state: su.filled[0].state, animations: await page.evaluate(() => document.getAnimations().length) };
  log(`reduced motion: ${JSON.stringify(R.fill.reducedMotion)}`);
  await ctx.close();
}
log(`data-ready: ${JSON.stringify(R.ready)}`);

// ---- item 12: the as-built record
if (want('record')) {
  const { ctx, page } = await open(390, 844, 'poster');
  const rec = await page.evaluate(() => {
    const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
    const label = $('label[for="suEmail"]');
    const h = $('.su-h'), cs = getComputedStyle(h);
    return {
      linkNames: $$('a.su-follow').map((a) => a.getAttribute('aria-label')), starColumn: { role: $('.su-yours').getAttribute('role'), name: $('.su-yours').getAttribute('aria-label'), links: $('.su-yours').querySelectorAll('a, button, [tabindex]').length },
      jarAltEmpty: $('#suYours').getAttribute('aria-label'), jarRole: $('#suYours').getAttribute('role'),
      fieldName: label ? label.textContent : null, fieldFontSize: $('#suEmail') ? getComputedStyle($('#suEmail')).fontSize : null, fieldDescribedBy: $('#suEmail')?.getAttribute('aria-describedby'),
      headings: [h.tagName, $('.su-got-h h3')?.tagName ?? null], capitalsInDom: h.textContent === h.textContent.toUpperCase(), headlineTextTransform: cs.textTransform,
      tabOrder: $$('#signup a, #signup button, #signup input, #signup [tabindex]:not([tabindex="-1"])').filter((e) => !e.closest('[hidden]') && !e.hidden).map((e) => e.id || e.className.split(' ')[0] + (e.dataset.id ? ':' + e.dataset.id : '')),
      frameBridge: typeof window.__skreedSignupFrame, liveRegion: { role: $('#suLive').getAttribute('aria-live'), hidden: getComputedStyle($('#suLive')).position },
      buttonHoverRule: [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } }).flatMap((r) => (r.cssRules ? [...r.cssRules] : [r])).filter((r) => r.selectorText && /su-send:(hover|active)/.test(r.selectorText)).map((r) => r.cssText),
      noscriptLine: $('#signup noscript')?.textContent ?? null,
    };
  });
  // the request's fields and the success state's height, against a stub
  let posted = null;
  await page.route('**/api/signup', (route) => { posted = { headers: route.request().headers(), body: route.request().postData() }; route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); });
  await page.evaluate(() => window.__skreedSignupHooks.press('facebook'));
  await sleep(1800);
  const footerBefore = await page.evaluate(() => document.querySelector('.su-keep').getBoundingClientRect().top);
  await page.locator('#suEmail').fill('sam@example.com');
  await page.locator('#suSend').click();
  await page.waitForFunction(() => !document.getElementById('suDone').hidden, null, { timeout: 5000 });
  const after = await page.evaluate(() => ({ done: document.getElementById('suDone').textContent, footerTop: document.querySelector('.su-keep').getBoundingClientRect().top, focused: document.activeElement.id }));
  await page.locator('#suSend').hover().catch(() => {});
  R.asBuilt = { ...rec, request: posted ? { body: posted.body, cookie: posted.headers.cookie ?? 'none', contentType: posted.headers['content-type'] } : null, success: { doneLine: after.done, footerMoved: +(after.footerTop - footerBefore).toFixed(1), focused: after.focused } };
  log(`as built: ${JSON.stringify(R.asBuilt)}`);
  await ctx.close();
  // without JavaScript: the section stands, the links work, the noscript line shows
  const { ctx: c2, page: p2 } = await open(390, 844, 'poster', { js: false });
  R.asBuilt.noJs = await p2.evaluate(() => { const s = document.getElementById('signup'); return { display: getComputedStyle(s).display, hidden: s.hidden, locked: s.hasAttribute('data-locked'), links: s.querySelectorAll('a.su-follow').length, form: !!s.querySelector('form'), noscript: s.querySelector('noscript')?.textContent ?? null }; });
  log(`no JavaScript: ${JSON.stringify(R.asBuilt.noJs)}`);
  await c2.close();
}

// ---- items 7 and 8: the ground on both tiers, the falloff, the island at rest
async function groundSamples(page, w, h) {
  const b = await page.evaluate(() => { const g = (s) => document.querySelector(s).getBoundingClientRect(); const jars = [...document.querySelectorAll('.su-jar')].map((e) => e.getBoundingClientRect()); const row = g('.su-row'), top = g('.su-top'); return { top: parseFloat(getComputedStyle(document.getElementById('suBody')).paddingTop), every: g('.su-every'), keep: g('.su-keep'), jarMid: (jars[0].top + jars[0].bottom) / 2, jarTop: jars[0].top, jarBottom: jars[0].bottom, markTop: g('.su-icon').top, worthTop: g('.su-worth').top, sub: g('.su-sub'), rowLeft: row.left, jars: jars.map((j) => ({ l: j.left, r: j.right })), twoColumns: Math.abs((row.left + row.right) / 2 - (top.left + top.right) / 2) > 1 }; });
  const P = await pixels(page);
  // the band: the whole width in the single column; on the laptop's two columns from the jar column's left edge to the screen's right edge
  const bandX = b.twoColumns ? b.rowLeft : 0, bandW = w - bandX;
  const pts = [[4, b.top + 2], [w - 4, b.top + 2], [b.twoColumns ? 4 : w - 4, b.sub.top + b.sub.height / 2], [4, b.sub.top - 6], [b.twoColumns ? 4 : w - 4, b.every.top + 2], [4, b.keep.top + 2], [w - 4, b.keep.top + 2], [w / 2, h - 2], [4, h - 2], [w - 4, h - 2]];
  const away = pts.map(([x, y]) => P.px(x, y));
  // read at the jars' mid-height in the clear: before the first jar, between the jars, after the last, and at the band's two ends
  const J = b.jars, mid = (x0, x1) => P.px((x0 + x1) / 2, b.jarMid);
  const fall = { left: P.px(bandX + 2, b.jarMid), beforeJar1: mid(bandX, J[0].l), between12: mid(J[0].r, J[1].l), between23: mid(J[1].r, J[2].l), between34: mid(J[2].r, J[3].l), afterJar4: mid(J[3].r, w), right: P.px(w - 2, b.jarMid), bandStart: b.twoColumns ? P.px(bandX + 1, b.jarMid) : null };
  // the falloff's edges are its top and bottom fades: read down the left gutter over its whole height (the first jar's frame
  // is transparent there) and down the right gutter to the jars' mid-height (below it the last jar's shadow lies in the gutter)
  let maxStep = 0;
  const xl = b.twoColumns ? Math.floor((bandX + b.jars[0].l) / 2) : 2;   // a column of the band left of the first jar
  for (let y = Math.floor(b.every.bottom) + 1; y < Math.floor(b.worthTop) - 1; y++) { const a = P.px(xl, y), c = P.px(xl, y + 1); maxStep = Math.max(maxStep, ...a.map((v, i) => Math.abs(v - c[i]))); }
  for (let y = Math.floor(b.every.bottom) + 1; y < Math.floor(b.jarMid); y++) { const a = P.px(w - 2, y), c = P.px(w - 2, y + 1); maxStep = Math.max(maxStep, ...a.map((v, i) => Math.abs(v - c[i]))); }
  // across the band's left edge on the two-column layout, above the jars: no step either
  if (b.twoColumns) for (let x = Math.floor(bandX) - 30; x < Math.floor(bandX) + 60; x++) { const a = P.px(x, b.jarTop - 12), c = P.px(x + 1, b.jarTop - 12); maxStep = Math.max(maxStep, ...a.map((v, i) => Math.abs(v - c[i]))); }
  return { away, allGround: away.every((p) => p[0] === 242 && p[1] === 234 && p[2] === 225), falloff: fall, maxNeighbourStep: maxStep };
}
for (const [w, h] of want('ground') ? [[390, 844], [1280, 800]] : []) {
  const { ctx, page } = await open(w, h, 'poster');
  R.ground[`poster ${w}x${h}`] = { dataGround: await page.evaluate(() => document.getElementById('signup').dataset.ground ?? null), ...(await groundSamples(page, w, h)) };
  log(`[poster ${w}x${h}] ground: ${JSON.stringify(R.ground[`poster ${w}x${h}`])}`);
  await ctx.close();
}
if (!skip3d && want('ground')) for (const [w, h] of [[390, 844], [1280, 800]]) {
  const { ctx, page } = await open(w, h, 'hero3d');
  const dg = await page.evaluate(() => document.getElementById('signup').dataset.ground ?? null);
  const s0 = await page.evaluate(() => window.__skreedGround?.state?.() ?? null);
  await sleep(1500);
  const s1 = await page.evaluate(() => window.__skreedGround?.state?.() ?? null);
  const samples = await groundSamples(page, w, h);
  let island = null;
  try { island = await page.evaluate(() => window.__skreedGround?.sample?.([[4, 4], [innerWidth - 4, 4], [4, innerHeight - 4], [innerWidth - 4, innerHeight - 4]])); } catch (e) { island = String(e.message); }
  R.ground[`hero3d ${w}x${h}`] = { dataGround: dg, stateBefore: s0, stateAfter1500ms: s1, ...samples, islandSample: island };
  log(`[hero3d ${w}x${h}] ground: ${JSON.stringify(R.ground[`hero3d ${w}x${h}`])}`);
  await page.screenshot({ path: join(out, `ground-hero3d-${w}x${h}.png`) });
  await ctx.close();
}

await browser.close();
writeFileSync(join(out, 'measure.json'), JSON.stringify(R, null, 2));
// ---- Markdown
const md = [];
md.push('## 16.1 The fit table\n', '| Viewport | Form | Content height (px) | Height left (px) | Free (px) | Outside the viewport | Overlapping | Body height | Scroll width | Floors |', '|---|---|---|---|---|---|---|---|---|---|');
for (const c of R.cases) md.push(`| ${c.w} x ${c.h} | ${c.form} | ${c.contentHeight} | ${c.heightLeft} | ${c.free} | ${c.outside.join(', ') || 'none'} | ${c.overlaps.join('; ') || 'none'} | ${c.bodyH} of ${c.vh} | ${c.scrollWidth} of ${c.vw} | ${c.floorsHold ? 'hold' : 'BROKEN'} (body ${c.bodyMin}, worth ${c.type.worth?.size}) |`);
md.push('\n## 16.2 The sizes it settled on\n', '| Viewport | Form | Headline | Sub-line | Label | Worth | Heading | Grey | Field | Button | Footer | Headline lines (px) | Jar diameter x height | Row width | Axis spacing | Mark height | Form w x h | Hairlines |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const c of R.cases) md.push(`| ${c.w} x ${c.h} | ${c.form} | ${c.type.headline?.size} | ${c.type['sub-line']?.size} | ${c.type.label?.size} | ${c.type.worth?.size} | ${c.type.heading?.size ?? ''} | ${c.type['grey lines']?.size ?? ''} | ${c.type.field?.size ?? ''} | ${c.type.button?.size ?? ''} | ${c.type.footer?.size} | ${c.sizes.headlineLines.join(' / ')} | ${c.sizes.jarDiameter[0]} x ${c.sizes.jarHeight[0]} | ${c.sizes.rowWidth} | ${c.sizes.axisSpacing.join(' / ')} | ${c.sizes.markHeight[0]} | ${c.sizes.form ? `${c.sizes.form.w} x ${c.sizes.form.h} (button ${c.sizes.form.button})` : ''} | ${c.sizes.hairlines.join(' / ')} |`);
md.push('\n### The gaps between the blocks (px)\n', '| Viewport | Form | ' + Object.keys(R.cases[0].sizes.gaps).join(' | ') + ' |', '|---|---|' + Object.keys(R.cases[0].sizes.gaps).map(() => '---').join('|') + '|');
for (const c of R.cases) md.push(`| ${c.w} x ${c.h} | ${c.form} | ` + Object.keys(R.cases[0].sizes.gaps).map((k) => c.sizes.gaps[k] ?? '') .join(' | ') + ' |');
md.push('\n## 16.3 The placement\n', '| Viewport | Form | Indent (wanted) | Centred blocks, offset from the column centre | Marks off their axis | Labels off their mark | Jar / column |', '|---|---|---|---|---|---|---|');
for (const c of R.cases) md.push(`| ${c.w} x ${c.h} | ${c.form} | ${c.placement.indent} (${c.placement.indentWanted}) | ${Object.entries(c.placement.centres).map(([k, v]) => `${k} ${v}`).join(', ')} | ${c.placement.marksOffAxis.join(' / ')} | ${c.placement.worthsOffMark.join(' / ')} | ${c.placement.jarShareOfColumn.join(' / ')} |`);
md.push('\n## 16.9 Contrast as rendered\n', JSON.stringify(R.contrast, null, 2));
md.push('\n## 16.10 The fill\n', JSON.stringify(R.fill, null, 2));
md.push('\n## 16.11 data-ready\n', JSON.stringify(R.ready, null, 2));
md.push('\n## 16.12 As built\n', JSON.stringify(R.asBuilt, null, 2));
md.push('\n## 16.7 and 16.8 The ground, the falloff, the island at rest\n', JSON.stringify(R.ground, null, 2));
writeFileSync(join(out, 'measure.md'), md.join('\n'));
log(`written: ${join(out, 'measure.md')}`);
