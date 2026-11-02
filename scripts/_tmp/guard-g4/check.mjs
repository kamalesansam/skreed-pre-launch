// Throwaway: G2 (the jar resized with the window), G3 (the slot re-read on a block's change) and G4 (the exit's guard)
// on the dev server, headless, in the installed Chrome as scripts/signup/frames.mjs launches it.
//   node scripts/_tmp/guard-g4/check.mjs [g2|g3|g4|g4r|touch ...]
import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:4321/';
const only = process.argv.slice(2);
const want = (k) => !only.length || only.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const log = (k, v) => { out[k] = v; console.log(k, JSON.stringify(v)); };

const browser = await chromium.launch({ channel: 'chrome', args: ['--ignore-gpu-blocklist', '--enable-gpu'] });

async function open(opts, query = '?tier=hero3d&room=open') {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  await page.addInitScript(() => {
    window.__ev = [];
    addEventListener('skreed:room-state', (e) => window.__ev.push([Math.round(performance.now()), e.detail, Math.round(scrollY)]));
  });
  await page.goto(new URL(query, base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 300_000, polling: 250 });
  await page.evaluate(() => window.__skreedIntro?.skip?.());
  await page.waitForFunction(() => !document.documentElement.classList.contains('intro'), null, { timeout: 30_000 }).catch(() => console.warn('intro class stayed'));
  await page.evaluate(() => window.__s5?.load());
  await page.waitForFunction(() => !!window.__s5?.ready || !!window.__s5?.state?.()?.failed, null, { timeout: 120_000, polling: 250 });
  await page.waitForFunction(() => { const s = window.__s4?.state(); return !!s && !!s.layout && !s.layout.intro; }, null, { timeout: 120_000, polling: 250 });
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.style.setProperty('display', 'none', 'important'));
  return { ctx, page, errors };
}
const goQ = async (page, q, settle = 1200) => { await page.evaluate((qq) => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + qq * innerHeight; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); window.__skreedRoom?.snap(qq); }, q); await sleep(settle); };
const s4 = (page) => page.evaluate(() => { const s = window.__s4.state(); return { state: s.state, seam: s.seam, restY: s.restY, exitY: s.exitY, armed: s.exitArmed, y: scrollY, top: Math.round(document.getElementById('signup').getBoundingClientRect().top + scrollY), ih: innerHeight }; });
const ev = (page) => page.evaluate(() => window.__ev.splice(0));
/** a frame recorder: the largest scrollY past the rest and whether a seam ran, over the next ms */
const record = (page, ms) => page.evaluate((ms) => new Promise((res) => {
  const t0 = performance.now(), rest = window.__s4.state().restY; let maxPast = -Infinity, seam = false, frames = 0, holds = 0, lastY = scrollY;
  const tick = () => { frames++; const st = document.getElementById('room').dataset.state; if (st === 'seam') seam = true; maxPast = Math.max(maxPast, scrollY - rest); if (scrollY > rest + 1) holds++; lastY = scrollY; if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res({ frames, maxPast: Math.round(maxPast), seam, pastFrames: holds, endY: Math.round(lastY), rest: Math.round(rest) }); };
  requestAnimationFrame(tick);
}), ms);
const waitTop = (page, ms = 5000) => page.waitForFunction(() => scrollY < 2, null, { timeout: ms, polling: 50 }).then(() => true, () => false);

// ---- G2: the jar's view follows the window
if (want('g2')) {
  const { ctx, page, errors } = await open({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
  const r = await page.evaluate(() => window.__s4.state().restY);
  await page.evaluate((y) => { scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); }, r);
  await sleep(1500);
  const read = () => page.evaluate(() => { const s = window.__s5.state(), d = document.querySelector('.su-slot[data-slot="yours"]').getBoundingClientRect(); return { iw: innerWidth, ih: innerHeight, view: s.view, slot: s.slot, dom: { x: d.left, y: d.top, w: d.width, h: d.height }, box: s.placed?.box, y: scrollY, rest: window.__s4.state().restY }; });
  const before = await read();
  await page.screenshot({ path: 'scripts/_tmp/guard-g4/g2-1280.png' });
  await page.setViewportSize({ width: 1536, height: 730 });
  await sleep(1200);
  const after = await read();
  // the page at the new rest (the track's height follows the viewport, so the section's top moved)
  const r2 = await page.evaluate(() => window.__s4.state().restY);
  await page.evaluate((y) => { scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); }, r2);
  await sleep(1500);
  const atRest = await read();
  await page.screenshot({ path: 'scripts/_tmp/guard-g4/g2-1536-after-resize.png' });
  const drawn = (st) => st.box && st.view ? { cx: +((st.box.x + st.box.w / 2) * st.iw / st.view.w).toFixed(1), cy: +((st.box.y + st.box.h / 2) * st.ih / st.view.h).toFixed(1), slotCx: +(st.dom.x + st.dom.w / 2).toFixed(1), slotCy: +(st.dom.y + st.dom.h / 2).toFixed(1) } : null;
  const inside = (b, s) => !!b && !!s && b.x >= s.x - 1 && b.y >= s.y - 1 && b.x + b.w <= s.x + s.w + 1 && b.y + b.h <= s.y + s.h + 1;
  const sum = (st) => ({ ...st, drawn: drawn(st), inside: inside(st.box, st.dom), slotVsDom: st.slot && { dx: +(st.slot.x - st.dom.x).toFixed(2), dy: +(st.slot.y - st.dom.y).toFixed(2), dw: +(st.slot.w - st.dom.w).toFixed(2), dh: +(st.slot.h - st.dom.h).toFixed(2) } });
  log('g2', { before: sum(before), afterResize: sum(after), atNewRest: sum(atRest), errors });
  await ctx.close();
}

// ---- G3: a block inside the body changes and the slot moves with the body's size unchanged: the reading follows
if (want('g3')) {
  const { ctx, page, errors } = await open({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
  const r = await page.evaluate(() => window.__s4.state().restY);
  await page.evaluate((y) => { scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); }, r);
  await sleep(1200);
  const read = () => page.evaluate(() => { const s = window.__s5.state(), d = document.querySelector('.su-slot[data-slot="yours"]').getBoundingClientRect(), b = document.getElementById('suBody').getBoundingClientRect(); return { slot: s.slot, dom: { x: +d.left.toFixed(2), y: +d.top.toFixed(2), w: +d.width.toFixed(2), h: +d.height.toFixed(2) }, body: { top: +(b.top + scrollY).toFixed(1), h: +b.height.toFixed(1) } }; });
  const a = await read();
  // grow the first block of the body by 40 px (a late font or a wrap would do the same); the body's height pinned so only its blocks move
  await page.evaluate(() => { const body = document.getElementById('suBody'), first = body.firstElementChild; body.style.height = body.getBoundingClientRect().height + 'px'; body.style.minHeight = '0'; first.style.minHeight = (first.getBoundingClientRect().height + 40) + 'px'; });
  await sleep(500);
  const b = await read();
  log('g3', { before: a, after: b, slotMoved: +(b.dom.y - a.dom.y).toFixed(2), readingFollows: !!b.slot && Math.abs(b.slot.y - b.dom.y) < 0.6 && Math.abs(b.slot.x - b.dom.x) < 0.6, bodyHeightSame: a.body.h === b.body.h, errors });
  await ctx.close();
}

// ---- G4: the exit's guard by wheel, the wrap, and PageDown, at 1280 x 800 (the glue on, as the dev server has it)
async function g4(reduced) {
  const { ctx, page, errors } = await open({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const key = reduced ? 'g4r' : 'g4';
  await page.mouse.move(640, 400);
  const cdp = await ctx.newCDPSession(page);
  // (a) a wheel burst from the fourth wipe's half (the room's q 13.3) through section 5's top: a synthesized mouse-wheel
  // gesture of 2200 px at 4000 px/s (a continuous stream of wheel events), recorded for 4 s
  await goQ(page, 13.3, 1500);
  const s0 = await s4(page); await ev(page);
  const rec = record(page, 4000);
  const g0 = Date.now();
  await cdp.send('Input.synthesizeScrollGesture', { x: 640, y: 400, yDistance: -2200, speed: 4000, gestureSourceType: 'mouse' });
  const gestureMs = Date.now() - g0;
  const a = await rec;
  const a1 = await s4(page);
  log(`${key} a: wheel gesture from q 13.3`, { gestureMs, start: { y: Math.round(s0.y), rest: s0.restY, exitY: s0.exitY, top: s0.top, ih: s0.ih }, during: a, after: a1, events: await ev(page) });
  // (a2) the same with 22 wheel events of 100 px fired at once (not awaited one by one)
  await goQ(page, 13.3, 1500); await ev(page);
  const rec2a = record(page, 4000);
  await Promise.all(Array.from({ length: 22 }, () => page.mouse.wheel(0, 100)));
  const a2 = await rec2a;
  log(`${key} a2: 22 notches at once from q 13.3`, { during: a2, after: await s4(page), events: await ev(page) });
  // (b) after a 400 ms rest one notch down runs the exit to the hero
  await sleep(400);
  const b0 = await s4(page);
  await page.mouse.wheel(0, 100);
  const bTop = await waitTop(page, 5000);
  await sleep(1500);
  log(`${key} b: one notch after the rest`, { armedBefore: b0.armed, yBefore: Math.round(b0.y), reachedTop: bTop, after: await s4(page), events: await ev(page) });
  // (c) the wrap from the top lands at section 5; the next notch after a rest exits
  await sleep(600);
  await page.mouse.wheel(0, -100);
  const landed = await page.waitForFunction(() => window.__s4.state().state === 'world' && scrollY > 1000, null, { timeout: 15_000, polling: 50 }).then(() => true, () => false);
  const c0 = await s4(page);
  await sleep(450);
  const c1 = await s4(page);
  await page.mouse.wheel(0, 100);
  const cTop = await waitTop(page, 5000);
  await sleep(1500);
  log(`${key} c: the wrap, then a notch after a rest`, { landed, atLanding: { y: Math.round(c0.y), rest: c0.restY, armed: c0.armed }, afterRest: { armed: c1.armed, y: Math.round(c1.y) }, exited: cTop, events: await ev(page) });
  // (d) PageDown twice quickly from the wipe holds at section 5; a third after a rest exits
  await goQ(page, 13.3, 1500); await ev(page);
  const rec2 = record(page, 1800);
  await page.keyboard.press('PageDown'); await sleep(100); await page.keyboard.press('PageDown');
  const d = await rec2;
  const d1 = await s4(page);
  await sleep(400);
  const d2 = await s4(page);
  await page.keyboard.press('PageDown');
  const dTop = await waitTop(page, 5000);
  log(`${key} d: PageDown twice, then a third after a rest`, { during: d, after: { y: Math.round(d1.y), rest: d1.restY, state: d1.state, armed: d1.armed }, armedBeforeThird: d2.armed, exited: dTop, events: await ev(page) });
  log(`${key} errors`, errors);
  await ctx.close();
}
if (want('g4')) await g4(false);
if (want('g4r')) await g4(true);

// ---- a touch fling on a phone (390 x 844): held at section 5, then a short swipe after a rest exits
if (want('touch')) {
  const { ctx, page, errors } = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const cdp = await ctx.newCDPSession(page);
  await goQ(page, 13.3, 1500); await ev(page);
  const s0 = await s4(page);
  const rec = record(page, 3500);
  await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 700, yDistance: -1400, speed: 4000, gestureSourceType: 'touch', preventFling: false });
  const a = await rec;
  await sleep(300);
  const a1 = await s4(page);
  await sleep(400);
  const a2 = await s4(page);
  await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -200, speed: 800, gestureSourceType: 'touch' });
  const top = await waitTop(page, 5000);
  log('touch', { start: { y: Math.round(s0.y), rest: s0.restY, top: s0.top }, during: a, after: { y: Math.round(a1.y), state: a1.state, armed: a1.armed }, armedAfterRest: a2.armed, exitedBySwipe: top, events: await ev(page), errors });
  await ctx.close();
}

await browser.close();
console.log('done');
