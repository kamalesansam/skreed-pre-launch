// Criterion 5 (family-page.md 24.4): each hand-over held at raw progress 0, 0.3, 0.4, 0.5, 0.6, 0.7 and 1 at 390 x 844 and
// 1280 x 800 on the GPU, through the hooks' holdTakeover (D10), the case cropped from the page's frame; then one sheet per
// size beside the recording's frames at the same raw progress (its first run from 1.94 s: 2.00, 2.33, 2.47, 2.60, 2.73,
// 2.87 and 3.33 s). The sheets with the recording's row go to the git-ignored licensed folder (Sam's upload of depth.fyi's
// site); a sheet of our frames alone goes beside the other review frames.
//   BASE_URL=http://127.0.0.1:8795/ node frames-takeover.mjs <framesdir> <licensed sheet dir> <public sheet dir> [gloss]
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, sharp, openFamily, st, toScreen, rest, settledTypes, frames, PHONE, WIDE } from './lib.mjs';
const [FRAMES = 'frames', LIC = 'licensed', PUB = 'public', FINISH = 'matte'] = process.argv.slice(2);
for (const d of [FRAMES, LIC, PUB]) mkdirSync(d, { recursive: true });
// the recording's frames: Sam's upload, never in the repository; extract them from the carry folder's
// depth-fyi-transition-recording-2026-10-26.mov into a folder of your own and name it in REC_FRAMES
const REC = process.env.REC_FRAMES || '';
const RAWS = [0, 0.3, 0.4, 0.5, 0.6, 0.7, 1], REC_T = ['2.00', '2.33', '2.47', '2.60', '2.73', '2.87', '3.33'];
const HANDOVERS = [['tough', 'magtough', 3], ['magtough', 'snap', 4], ['snap', 'armor', 5]];
const SIZES = [['390', PHONE], ['1280', WIDE]];
const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

/** the case's box on the page (CSS px) from the canvas's own alpha, else a box round the projected centre */
async function caseBox(page, dpr, w, h) {
  const url = await page.evaluate(() => window.__famStage.snapshot());
  const img = sharp(Buffer.from(url.split(',')[1], 'base64')).ensureAlpha().raw();
  const { data, info } = await img.toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1, n = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) { if (data[(y * info.width + x) * 4 + 3] > 24) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  const sx = w / info.width, sy = h / info.height;   // canvas px to CSS px
  if (n > 0 && n < 0.9 * info.width * info.height) return { x: x0 * sx, y: y0 * sy, w: (x1 - x0 + 1) * sx, h: (y1 - y0 + 1) * sy, from: 'alpha' };
  const c = await page.evaluate(() => { const s = window.__famStage.state(); return window.__famStage.project(Math.round(s.s)); });
  const bw = w < 900 ? 0.6 * w : 0.34 * w, bh = w < 900 ? 0.5 * h : 0.72 * h;
  return { x: c.x - bw / 2, y: c.y - bh / 2, w: bw, h: bh, from: 'projected' };
}

const browser = await launch();
const results = {};
for (const [label, opts] of SIZES) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const gpu = await openFamily(page);
  console.log(label, 'gpu', gpu);
  if (FINISH === 'gloss') { await page.getByRole('button', { name: 'Gloss' }).click(); await page.waitForTimeout(900); }
  await toScreen(page, 0.6);
  await settledTypes(page);
  console.log(label, 'types', JSON.stringify(await page.evaluate(() => window.__famStage.types())));
  const { width: w, height: h } = opts.viewport, dpr = opts.deviceScaleFactor;
  results[label] = {};
  for (const [from, to, beat] of HANDOVERS) {
    await toScreen(page, beat);
    await rest(page, beat);
    // the box of the case at rest, before any hold
    let box = await caseBox(page, dpr, w, h);
    const pad = 0.12;
    box = { x: Math.max(0, box.x - box.w * pad), y: Math.max(0, box.y - box.h * pad), w: Math.min(w, box.w * (1 + 2 * pad)), h: Math.min(h, box.h * (1 + 2 * pad)), from: box.from };
    console.log(label, `${from}>${to}`, 'box', JSON.stringify(box));
    results[label][`${from}>${to}`] = { box, raws: {} };
    for (const raw of RAWS) {
      const ok = await page.evaluate(([a, b, r]) => window.__famStage.holdTakeover(a, b, r), [from, to, raw]);
      await frames(page, 3);
      await page.waitForTimeout(120);
      const s = await st(page);
      const file = join(FRAMES, `r6-${label}-${from}-${to}-${FINISH}-raw${raw}.png`);
      const full = await page.screenshot({ type: 'png' });
      const left = Math.round(box.x * dpr), top = Math.round(box.y * dpr), cw = Math.round(box.w * dpr), ch = Math.round(box.h * dpr);
      const crop = await sharp(full).extract({ left, top, width: Math.min(cw, w * dpr - left), height: Math.min(ch, h * dpr - top) }).png().toBuffer();
      writeFileSync(file, crop);
      writeFileSync(file.replace('.png', '-full.png'), full);
      // the band's brightness against the surface beside it (D7): the brightest 1 percent of the case's pixels over the median of the rest
      const { data, info } = await sharp(crop).raw().toBuffer({ resolveWithObject: true });
      const ls = []; for (let i = 0; i < data.length; i += info.channels) ls.push(lum(data, i));
      ls.sort((a, b) => a - b);
      const top1 = ls.slice(Math.floor(ls.length * 0.99)), median = ls[Math.floor(ls.length / 2)], p90 = ls[Math.floor(ls.length * 0.9)];
      const meanTop = top1.reduce((a, b) => a + b, 0) / top1.length;
      results[label][`${from}>${to}`].raws[raw] = { ok, held: s.takeover.held, phase: s.takeover.phase, p: +s.takeover.p.toFixed(3), brightest1pc: +meanTop.toFixed(1), median: +median.toFixed(1), p90: +p90.toFixed(1) };
      console.log(label, `${from}>${to}`, raw, JSON.stringify(results[label][`${from}>${to}`].raws[raw]));
    }
    await page.evaluate(([a, b]) => window.__famStage.holdTakeover(a, b, null), [from, to]);
    await frames(page, 2);
  }
  await ctx.close();
}
await browser.close();

// the recording's own figures, the form cropped
const recStats = {};
for (let i = 0; REC && i < RAWS.length; i++) {
  const crop = await sharp(join(REC, `rec-${REC_T[i]}.png`)).extract({ left: 60, top: 20, width: 740, height: 810 }).png().toBuffer();
  writeFileSync(join(FRAMES, `rec-raw${RAWS[i]}.png`), crop);
  const { data, info } = await sharp(crop).raw().toBuffer({ resolveWithObject: true });
  const ls = []; for (let k = 0; k < data.length; k += info.channels) ls.push(lum(data, k));
  ls.sort((a, b) => a - b);
  const top1 = ls.slice(Math.floor(ls.length * 0.99));
  recStats[RAWS[i]] = { brightest1pc: +(top1.reduce((a, b) => a + b, 0) / top1.length).toFixed(1), median: +ls[Math.floor(ls.length / 2)].toFixed(1), p90: +ls[Math.floor(ls.length * 0.9)].toFixed(1) };
}
results.recording = recStats;
writeFileSync(join(FRAMES, `takeover-${FINISH}.json`), JSON.stringify(results, null, 2));

// the sheets: one row per hand-over (and the recording's row first in the licensed sheet), one column per raw progress
const TILE = 230, LABEL = 22;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (s, x, y, w) => Buffer.from(`<svg width="${w}" height="${LABEL}"><text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#F7F6F3">${esc(s)}</text></svg>`);
async function sheet(label, rows, file) {
  const W = TILE * RAWS.length + LABEL * 2, H = (TILE + LABEL) * rows.length + LABEL;
  const tiles = [];
  for (let c = 0; c < RAWS.length; c++) tiles.push({ input: text(`raw ${RAWS[c]}  (rec ${REC_T[c]} s)`, 4, 15, TILE), left: LABEL * 2 + c * TILE, top: 0 });
  for (let r = 0; r < rows.length; r++) {
    const [name, files] = rows[r];
    const top = LABEL + r * (TILE + LABEL);
    tiles.push({ input: text(name, 4, 15, TILE * RAWS.length), left: LABEL * 2, top });
    for (let c = 0; c < files.length; c++) {
      const t = await sharp(files[c]).resize(TILE, TILE, { fit: 'contain', background: '#383F43' }).png().toBuffer();
      tiles.push({ input: t, left: LABEL * 2 + c * TILE, top: top + LABEL });
    }
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: '#383F43' } }).composite(tiles).png().toFile(file);
  console.log('sheet', file);
}
for (const [label] of SIZES) {
  const ours = HANDOVERS.map(([a, b]) => [`${a} > ${b}, ${label} px, ${FINISH}`, RAWS.map((r) => join(FRAMES, `r6-${label}-${a}-${b}-${FINISH}-raw${r}.png`))]);
  const rec = ['the recording (depth.fyi, Sam\'s upload): the form, first run', RAWS.map((r) => join(FRAMES, `rec-raw${r}.png`))];
  if (REC) await sheet(label, [rec, ...ours], join(LIC, `family-r6-takeover-sheet-${label}-${FINISH}.png`));
  await sheet(label, ours, join(PUB, `family-r6-takeover-${label}${FINISH === 'gloss' ? '-gloss' : ''}.png`));
}
console.log(JSON.stringify(results, null, 1));
