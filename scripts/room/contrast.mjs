// Section 4's contrast on the scene (docs/specs/section-4-flux.md AC12, E-S4-contrast): Pearl Whisper text straight on
// the hall, the bubble and the five loops, measured with section 3's method (scripts/quiz/contrast.mjs): each decoded
// line's box is read on the page (its glyph row, .dc), the section's text, the logotype and the Back to top control
// are hidden through the CSSOM for one shot, the scene alone is shot, and inside every box the scene's luminance gives
// the median and the lightest 5 percent, Pearl's ratio printed against each. AC12's frames: the prompt at the station;
// Skip over the bubble at 25, 50 and 90 percent with scene 1's loop playing; and every text box of each scene at rest
// (the four lines, the hint on scene 1, the loading line and the 2.2.2 control where they show, the previous and next
// words) over 10 frames 0.5 s apart of its loop, at 390 x 844 and 1280 x 800, device pixel ratio 1 (a CSS pixel is a
// pixel of the shot). Per box, the median is the median over the frames of each frame's median ratio, and the worst
// is the lowest over the frames of each frame's lightest-5-percent ratio. It also reads the GPU estimate the hooks
// report at scene 1 at 390 x 844. Serve a hooks build (build:test) first:
//   node scripts/room/contrast.mjs [base=http://127.0.0.1:4322/] [--shade d] [--shade-height h] [--shade-solid s] [--frames n] [--json <file>] [--md <file>]
// --shade, --shade-height and --shade-solid set the carousel's bottom shade live (the darkening at the bottom edge, 0
// to 1, where it clears and up to where it stays solid, shares of the frame's height; the build's own SHADE in
// carousel.ts otherwise), for AC12's tuning; --md writes the
// evidence document (docs/specs/evidence/section-4-flux-contrast.md by default when given without a path). The
// browser is the installed Chrome (channel chrome) when present, else Playwright's Chromium (no H.264: the planes show
// the stills); WebGL on the Metal GPU, or SKREED_GL=swiftshader for the test harness's flags.
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { ROOM_SCENES, productById } from '../../src/config/room.ts';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4322/';
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const jsonOut = opt('--json');
const mdOut = args.includes('--md') ? (opt('--md') && !opt('--md').startsWith('--') ? opt('--md') : 'docs/specs/evidence/section-4-flux-contrast.md') : null;
const FRAMES = Number(opt('--frames') ?? 10), GAP_MS = 500;
const shade = opt('--shade') !== undefined ? { dark: Number(opt('--shade')), height: opt('--shade-height') !== undefined ? Number(opt('--shade-height')) : undefined, solid: opt('--shade-solid') !== undefined ? Number(opt('--shade-solid')) : undefined } : null;
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'];
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const PEARL = lum(0xf7, 0xf6, 0xf3);
const ratio = (l) => (Math.max(PEARL, l) + 0.05) / (Math.min(PEARL, l) + 0.05);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
// the entry's beats at the defaults (as render-stills.mjs): the bubble from 0.35 s for 2 s
const BUBBLE_AT = 0.35, BUBBLE_S = 2.0;
const HIDE = () => { window.__c4Focus = document.activeElement; for (const el of [document.getElementById('rmStage'), document.querySelector('.site-logo'), document.getElementById('toTop')]) if (el) el.style.visibility = 'hidden'; };
const SHOW = () => { for (const el of [document.getElementById('rmStage'), document.querySelector('.site-logo'), document.getElementById('toTop')]) if (el) el.style.visibility = ''; window.__c4Focus?.focus?.({ preventScroll: true }); };

/** the installed Chrome when Playwright finds it, else its own Chromium */
async function launch(a) {
  try { const b = await chromium.launch({ channel: 'chrome', args: a }); console.log('browser: the installed Chrome (channel chrome)'); return b; }
  catch (e) { console.warn(`browser: no installed Chrome (${String(e.message ?? e).split('\n')[0]}); Playwright's Chromium, which decodes no H.264`); return chromium.launch({ args: a }); }
}
const browser = await launch(GL);
const rows = [], memory = [];
let renderer = 'unknown', shadeInForce = null;

async function open(vp) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${vp.width}] page error:`, e.message));
  await page.goto(new URL('/?tier=hero3d&glue=0&room=open', base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 240_000 });
  await page.evaluate(() => window.__skreedIntro?.skip?.());
  await page.waitForFunction(() => !document.documentElement.classList.contains('intro'), null, { timeout: 30_000 }).catch(() => {});
  renderer = await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const x = c?.getExtension('WEBGL_debug_renderer_info'); return x ? c.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  return { ctx, page };
}
async function go(page, q, settle = 900) {
  await page.evaluate((qq) => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + qq * innerHeight; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); }, q);
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 120_000 });
  await page.waitForFunction(() => { const s = window.__s4?.state(); return !!s?.layout && !s.layout.intro; }, null, { timeout: 30_000 }).catch(() => {});
  await page.evaluate((qq) => window.__skreedRoom?.snap(qq), q);
  await sleep(settle);
}
const state = (page) => page.evaluate(() => window.__s4.state());
async function seek(page, sec, settle = 900) {
  await page.waitForFunction(() => window.__s4?.state()?.worldReady, null, { timeout: 180_000 });
  await page.evaluate((s) => window.__s4.seek(s), sec);
  await sleep(settle);
}
/** the boxes of the section's decoded lines on screen, by their visible glyph row */
const boxesOf = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length && !e.hidden && !e.closest('[hidden]') && getComputedStyle(e).visibility !== 'hidden')
  .map((e) => { const row = e.querySelector(':scope > .dc') ?? e, r = row.getBoundingClientRect(); return { el: (e.id || e.className.split(' ').find((c) => c.startsWith('rm-')) || e.className), x: r.x, y: r.y, w: r.width, h: r.height }; })
  .filter((b) => b.w > 0 && b.h > 0 && b.y + b.h > 0 && b.y < innerHeight), sel);

/** one shot of the scene alone under the boxes: per box this frame's median ratio and lightest-5-percent ratio */
async function shot(page, boxes) {
  await page.evaluate(HIDE);
  await sleep(100);
  const png = await page.screenshot();
  await page.evaluate(SHOW);
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return boxes.map((b) => {
    const x0 = Math.max(0, Math.floor(b.x)), y0 = Math.max(0, Math.floor(b.y)), x1 = Math.min(info.width, Math.ceil(b.x + b.w)), y1 = Math.min(info.height, Math.ceil(b.y + b.h));
    const ls = [];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * info.width + x) * 3; ls.push(lum(data[k], data[k + 1], data[k + 2])); }
    if (!ls.length) return null;
    ls.sort((a, c) => a - c);
    return { median: ratio(ls[Math.floor(ls.length / 2)]), lightest5: ratio(ls[Math.floor(ls.length * 0.95)]) };
  });
}
/** n frames gap ms apart: per box, the median of the frames' medians and the lowest of the frames' lightest-5-percent ratios */
async function measure(page, vp, frame, boxes, n = FRAMES) {
  if (!boxes.length) { console.warn(`  [${vp.width}] ${frame}: no text on screen`); return; }
  const per = boxes.map(() => ({ med: [], low: [] }));
  for (let k = 0; k < n; k++) {
    const r = await shot(page, boxes);
    r.forEach((x, i) => { if (x) { per[i].med.push(x.median); per[i].low.push(x.lightest5); } });
    if (k + 1 < n) await sleep(GAP_MS - 100);
  }
  boxes.forEach((b, i) => { if (per[i].med.length) rows.push({ vp: `${vp.width}x${vp.height}`, frame, el: b.el, frames: per[i].med.length, median: +median(per[i].med).toFixed(2), worst: +Math.min(...per[i].low).toFixed(2) }); });
  console.log(`  [${vp.width}] ${frame}: ${boxes.length} box(es) over ${n} frame(s)`);
}

for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const { ctx, page } = await open(vp);
  await go(page, 1, 1200); await go(page, 4, 300); await go(page, 9.5, 2600);
  // the prompt at the station: the hall holds still, one frame
  await measure(page, vp, 'the prompt at the station', await boxesOf(page, '#rmEnter .rm-key, #rmEnter .rm-enter-text'), 1);
  // Skip over the bubble at 25, 50 and 90 percent, held by the entry clock while scene 1's loop plays
  await page.waitForFunction(() => window.__s4?.state()?.worldReady, null, { timeout: 180_000 });
  for (const pct of [25, 50, 90]) {
    await seek(page, BUBBLE_AT + (BUBBLE_S * pct) / 100);
    await page.waitForFunction(() => { const s = window.__s4.state(); return s.loops[0]?.playing || s.loops[0]?.state === 'failed' || !s.video; }, null, { timeout: 30_000 }).catch(() => {});
    await measure(page, vp, `Skip, the bubble at ${pct} percent`, await boxesOf(page, '#rmSkip'));
  }
  const arrive = (await state(page)).arrive;
  await seek(page, arrive + 0.1, 400);
  await page.waitForFunction(() => window.__s4.state().state === 'world', null, { timeout: 20_000 });
  if (shade) shadeInForce = await page.evaluate((s) => { window.__s4.shade(s.dark, s.height, s.solid); return s; }, shade);
  // each scene at rest with its loop playing: every text box over 10 frames
  for (const sc of ROOM_SCENES) {
    await page.evaluate((j) => window.__s4.scene(j), sc.i);
    await page.waitForFunction((j) => { const s = window.__s4.state(); return s.state === 'world' && s.scene === j && !s.busy && s.loops.some((l) => l.i === j && (l.in || l.state === 'failed' || !s.video)); }, sc.i, { timeout: 120_000 }).catch(() => console.warn(`  scene ${sc.order}: its loop did not settle`));
    await sleep(2600);
    if (sc.i === 0 && vp.width === 390) { const st = await state(page); memory.push({ vp: `${vp.width}x${vp.height}`, at: 'scene 1 at rest', ...(await page.evaluate(() => window.__skreedGpu?.() ?? null)), carousel: st.memory ?? null, loops: st.loops }); }
    const boxes = await boxesOf(page, `.rm-scene[data-i="${sc.i}"] :is(.rm-scene-name, .rm-scene-shade, .rm-scene-line, .rm-scene-count, .rm-scene-hint, .rm-scene-more), #rmPrev, #rmNext, #rmPause`);
    await measure(page, vp, `scene ${sc.order} ${sc.id} (${productById(sc.product).name}) at rest`, boxes);
  }
  await ctx.close();
}
await browser.close();

console.table(rows);
const byFrame = new Map();
for (const r of rows) { const k = `${r.vp} | ${r.frame}`; byFrame.set(k, [...(byFrame.get(k) ?? []), r]); }
console.log('\nper frame: the lowest median and the lowest worst across its boxes (AA for this size: 4.5:1)');
for (const [k, rs] of byFrame) console.log(`  ${k}: median ${Math.min(...rs.map((r) => r.median)).toFixed(2)}, worst ${Math.min(...rs.map((r) => r.worst)).toFixed(2)}`);
const under = rows.filter((r) => r.median < 4.5);
console.log(`\nmedians under 4.5:1: ${under.length ? under.map((r) => `${r.vp} ${r.frame} ${r.el} ${r.median}`).join('; ') : 'none'}`);
console.log('GPU at scene 1:', JSON.stringify(memory));
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ base, renderer, shade: shadeInForce, rows, memory }, null, 1) + '\n');
if (mdOut) {
  const date = new Date().toISOString().slice(0, 10);
  const cell = (vp, frame, el) => rows.find((r) => r.vp === vp && r.frame === frame && r.el === el);
  const fmt = (r) => (r ? `${r.median < 4.5 ? `**${r.median.toFixed(2)}**` : r.median.toFixed(2)} / ${r.worst < 4.5 ? `**${r.worst.toFixed(2)}**` : r.worst.toFixed(2)}` : 'not shown');
  const frames = [...new Set(rows.map((r) => r.frame))];
  const els = (frame) => [...new Set(rows.filter((r) => r.frame === frame).map((r) => r.el))];
  const lines = [
    `# Section 4, part three: Pearl Whisper's contrast on the scene (AC12, E-S4-contrast)`, '',
    `Measured ${date} by \`scripts/room/contrast.mjs\` on the served hooks build (\`build:test\`) at ${base}, in ${renderer.includes('Metal') ? 'the installed Chrome on the Metal GPU' : renderer}, at 390 x 844 and 1280 x 800, device pixel ratio 1, so a CSS pixel is a pixel of the shot. The bottom shade: ${shadeInForce ? `set live to ${shadeInForce.dark} of black at the bottom edge, solid up to ${shadeInForce.solid ?? 'its own'} of the frame's height and clear by ${shadeInForce.height ?? 'its own'}` : 'the build\'s own (SHADE in carousel.ts)'}.`, '',
    `**Method (AC12).** Each decoded line's box is read from its glyph row (\`.dc\`); the section's text, the logotype and the Back to top control are hidden through the CSSOM for one shot and the scene alone is shot; inside each box the scene's relative luminance gives the median and the lightest 5 percent, and Pearl Whisper's (#F7F6F3) ratio is taken against each. The prompt is one frame over the hall, which holds still; Skip over the bubble at 25, 50 and 90 percent and every text box of each scene at rest are ${FRAMES} frames ${GAP_MS} ms apart with the loop playing: the **median** is the median over the frames of each frame's median ratio, the **worst** the lowest over the frames of each frame's lightest-5-percent ratio. Ratios under 4.5:1 are in bold. AC12 says the bottom shade is darkened until every median is 4.5:1 or better and anything under is flagged to Sam, never boxed.`, '',
    `## Every box, median / worst`, '',
    `| Frame | Box | 390 x 844 | 1280 x 800 |`, `|---|---|---|---|`,
  ];
  for (const f of frames) for (const el of els(f)) lines.push(`| ${f} | ${el} | ${fmt(cell('390x844', f, el))} | ${fmt(cell('1280x800', f, el))} |`);
  lines.push('', `## Per frame, the lowest median and the lowest worst across its boxes`, '', `| Frame | 390 x 844: median | worst | 1280 x 800: median | worst |`, `|---|---|---|---|---|`);
  for (const f of frames) {
    const a = rows.filter((r) => r.vp === '390x844' && r.frame === f), b = rows.filter((r) => r.vp === '1280x800' && r.frame === f);
    const m = (rs) => (rs.length ? Math.min(...rs.map((r) => r.median)) : NaN), w = (rs) => (rs.length ? Math.min(...rs.map((r) => r.worst)) : NaN);
    const b4 = (v) => (Number.isNaN(v) ? 'not shown' : v < 4.5 ? `**${v.toFixed(2)}**` : v.toFixed(2));
    lines.push(`| ${f} | ${b4(m(a))} | ${b4(w(a))} | ${b4(m(b))} | ${b4(w(b))} |`);
  }
  lines.push('', `## Medians under 4.5:1`, '', under.length ? under.map((r) => `- ${r.vp}, ${r.frame}, ${r.el}: ${r.median.toFixed(2)} (worst ${r.worst.toFixed(2)})`).join('\n') : 'None.', '');
  lines.push(`## Not shown in these frames`, '', `- The loading line (\`.rm-scene-more\`): every loop was in before its scene was measured, so it never showed.`, `- The 2.2.2 control (\`#rmPause\`): hidden while E-S4-loops is pending (the director sets data-pause only once Sam declines it).`, `- The scene hint shows on scene 1 only (its first visit).`, '');
  lines.push(`## GPU at scene 1 at rest, 390 x 844`, '', '```json', JSON.stringify(memory, null, 1), '```', '');
  writeFileSync(mdOut, lines.join('\n'));
  console.log(`written: ${mdOut}`);
}
