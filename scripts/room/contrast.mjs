// Section 4's contrast on the scene (docs/specs/section-4-world.md AC12, E-S4-contrast): Pearl Whisper text straight
// on the hall, the bubble, the tunnel, the morph, the lands and the travels, measured with section 3's method
// (scripts/quiz/contrast.mjs): each decoded line's box is read on the page, the section's text and the logotype are
// hidden for one frame, the scene alone is shot, and inside every box the scene's luminance gives the median and the
// lightest 5 percent, Pearl's ratio printed against each. The frames are AC12's: the prompt; Skip over the bubble at 25,
// 50 and 90 percent, each ring pass and the morph at 30 and 80 percent; each land's text at rest; each travel at half
// (the arriving land's text boxes over the travel's frame, the text itself being wiped out then); and the failed-picture
// case (a land whose pictures are refused, its text on the garden). It also reads the renderer's resident geometries,
// textures and programs (window.__skreedGpu) at land 1 at rest. Serve a hooks build (build:test) first:
//   node scripts/room/contrast.mjs [base=http://127.0.0.1:4322/] [--json <file>]
// at 390 x 844 and 1280 x 800, device pixel ratio 1 (a CSS pixel is a pixel of the shot), WebGL on the Metal GPU
// (SKREED_GL=swiftshader for the test harness's flags).
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4322/';
const ji = args.indexOf('--json'), jsonOut = ji >= 0 ? args[ji + 1] : null;
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'];
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const PEARL = lum(0xf7, 0xf6, 0xf3);
const ratio = (l) => (Math.max(PEARL, l) + 0.05) / (Math.min(PEARL, l) + 0.05);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// the entry's beats at the defaults (as render-stills.mjs): the bubble from 0.35 s for 2 s, the morph 1.8 s, the push 1.2 s
const BUBBLE_AT = 0.35, BUBBLE_S = 2.0, MORPH_S = 1.8, PUSH_S = 1.2;

const browser = await chromium.launch({ args: GL });
const rows = [], memory = [];

async function open(vp, refuse = null) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${vp.width}] page error:`, e.message));
  if (refuse) await page.route(new RegExp(`/_astro/land-${refuse}-`), (r) => r.abort());
  await page.goto(new URL('/?tier=hero3d', base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 240_000 });
  await page.evaluate(() => window.__skreedIntro?.skip?.());
  return { ctx, page };
}
async function go(page, q, settle = 900) {
  await page.evaluate((qq) => {
    const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + qq * innerHeight;
    scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); window.__skreedRoom?.snap(qq);
  }, q);
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 120_000 });
  await sleep(settle);
}
const state = (page) => page.evaluate(() => window.__s4.state());
async function seek(page, sec, settle = 900) {
  await page.waitForFunction(() => window.__s4?.state()?.worldReady, null, { timeout: 180_000 });
  await page.evaluate((s) => window.__s4.seek(s), sec);
  await sleep(settle);
}
/** the boxes of the section's decoded lines on screen, by their visible glyph row */
const boxesOf = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length && !e.closest('[hidden]') && getComputedStyle(e).visibility !== 'hidden')
  .map((e) => { const row = e.querySelector(':scope > .dc') ?? e, r = row.getBoundingClientRect(); return { el: (e.id || e.className.split(' ')[0]), x: r.x, y: r.y, w: r.width, h: r.height }; })
  .filter((b) => b.w > 0 && b.h > 0 && b.y + b.h > 0 && b.y < innerHeight), sel);

/** the scene alone (the section's text and the logotype hidden through the CSSOM for one shot) under the given boxes */
async function measure(page, vp, frame, boxes) {
  if (!boxes.length) { console.warn(`  [${vp.width}] ${frame}: no text on screen`); return; }
  await page.evaluate(() => { window.__c4Focus = document.activeElement; for (const el of [document.getElementById('rmStage'), document.querySelector('.site-logo')]) if (el) el.style.visibility = 'hidden'; });
  await sleep(120);
  const png = await page.screenshot();
  await page.evaluate(() => { for (const el of [document.getElementById('rmStage'), document.querySelector('.site-logo')]) if (el) el.style.visibility = ''; window.__c4Focus?.focus?.({ preventScroll: true }); });
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const b of boxes) {
    const x0 = Math.max(0, Math.floor(b.x)), y0 = Math.max(0, Math.floor(b.y)), x1 = Math.min(info.width, Math.ceil(b.x + b.w)), y1 = Math.min(info.height, Math.ceil(b.y + b.h));
    const ls = [];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * info.width + x) * 3; ls.push(lum(data[k], data[k + 1], data[k + 2])); }
    if (!ls.length) continue;
    ls.sort((a, c) => a - c);
    const med = ls[Math.floor(ls.length / 2)], hi = ls[Math.floor(ls.length * 0.95)];
    rows.push({ vp: `${vp.width}x${vp.height}`, frame, el: b.el, median: +ratio(med).toFixed(2), lightest5: +ratio(hi).toFixed(2) });
  }
  console.log(`  [${vp.width}] ${frame}: ${boxes.length} line(s)`);
}

for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const { ctx, page } = await open(vp);
  // the prompt at the station
  await go(page, 4, 300); await go(page, 9.5, 2600);
  await measure(page, vp, 'the prompt', await boxesOf(page, '#rmEnter .rm-key, #rmEnter .rm-enter-text'));
  const N = (await state(page)).lands;
  if (!N) { console.warn(`[${vp.width}] no land in this build`); await ctx.close(); continue; }
  // Skip over the entry, held by its clock
  const skip = () => boxesOf(page, '#rmSkip');
  for (const pct of [25, 50, 90]) { await seek(page, BUBBLE_AT + (BUBBLE_S * pct) / 100); await measure(page, vp, `Skip, the bubble at ${pct} %`, await skip()); }
  const s = await state(page), passes = s.world?.passes ?? [], arrive = s.world?.arrive ?? s.arrive;
  for (const [k, t] of passes.entries()) { await seek(page, t); await measure(page, vp, `Skip, ring ${k + 1}'s pass`, await skip()); }
  const m1 = arrive - PUSH_S, m0 = m1 - MORPH_S;
  for (const pct of [30, 80]) { await seek(page, m0 + ((m1 - m0) * pct) / 100); await measure(page, vp, `Skip, the morph at ${pct} %`, await skip()); }
  // each land's text at rest, its boxes kept for the travel into it
  await seek(page, arrive + 0.1, 400);
  await page.waitForFunction(() => window.__s4.state().state === 'world', null, { timeout: 20_000 });
  const landBoxes = [];
  for (let i = 0; i < N; i++) {
    await page.evaluate((j) => window.__s4.land(j), i);
    await page.waitForFunction((j) => window.__s4.state().resident.some((r) => r.i === j && (r.ready || r.failed)), i, { timeout: 60_000 });
    await page.evaluate((j) => window.__s4.land(j), i);
    await sleep(3200);
    if (i === 0 && vp.width === 390) memory.push({ vp: `${vp.width}x${vp.height}`, at: 'land 1 at rest', ...(await page.evaluate(() => window.__skreedGpu?.() ?? null)), resident: (await state(page)).resident });
    landBoxes[i] = await boxesOf(page, `.rm-land[data-i="${i}"] :is(.rm-land-name, .rm-land-family, .rm-land-line, .rm-land-count, .rm-land-hint)`);
    await measure(page, vp, `land ${i + 1} at rest`, landBoxes[i]);
  }
  // each travel at half: the arriving land's text area over the travel's frame
  for (let i = 0; i + 1 < N; i++) {
    await page.evaluate((j) => window.__s4.land(j), i); await sleep(600);
    await page.waitForFunction((j) => window.__s4.state().resident.some((r) => r.i === j + 1 && (r.ready || r.failed)), i, { timeout: 60_000 });
    await page.evaluate((j) => window.__s4.travel(j, j + 1, 0.5), i); await sleep(600);
    await measure(page, vp, `travel ${i + 1} to ${i + 2} at half (land ${i + 2}'s text area)`, landBoxes[i + 1].map((b) => ({ ...b, el: `${b.el} (land ${i + 2})` })));
    await page.evaluate((j) => window.__s4.travel(j, j + 1, -1), i); await sleep(800);
  }
  await ctx.close();

  // the failed-picture case: land 2's pictures refused, its text on the garden
  const failId = 'wallet';
  const f = await open(vp, failId);
  await go(f.page, 4, 300); await go(f.page, 9.5, 1500);
  await f.page.waitForFunction(() => window.__s4?.state()?.worldReady, null, { timeout: 180_000 });
  await f.page.evaluate(() => window.__s4.land(0)); await sleep(1500);
  await f.page.evaluate(() => window.__s4.land(1));
  await f.page.waitForFunction(() => window.__s4.state().resident.some((r) => r.i === 1 && r.failed), null, { timeout: 60_000 });
  await f.page.evaluate(() => window.__s4.land(1)); await sleep(3200);
  await measure(f.page, vp, `the failed-picture case (land 2, ${failId}, refused: its text on the garden)`, await boxesOf(f.page, '.rm-land[data-i="1"] :is(.rm-land-name, .rm-land-family, .rm-land-line, .rm-land-count)'));
  await f.ctx.close();
}
await browser.close();

console.table(rows);
const byFrame = new Map();
for (const r of rows) { const k = `${r.vp} | ${r.frame}`; byFrame.set(k, [...(byFrame.get(k) ?? []), r]); }
console.log('\nper frame: the lowest median and the lowest lightest-5% ratio across its lines (AA for this size: 4.5:1)');
for (const [k, rs] of byFrame) console.log(`  ${k}: median ${Math.min(...rs.map((r) => r.median)).toFixed(2)}, worst ${Math.min(...rs.map((r) => r.lightest5)).toFixed(2)}`);
console.log('\nGPU at land 1:', JSON.stringify(memory));
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ base, rows, memory }, null, 1) + '\n');
