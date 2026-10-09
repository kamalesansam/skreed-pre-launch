// Calibration A and B and the contact sheet for the supplier case (docs/specs/case-model-class.md 10, T6, T7, T13).
//   node scripts/case-model/calibrate.mjs [--out <dir>] [--write]
// Bundles tests/case-model/harness/render.ts with esbuild, serves it with public/models on a local port, and drives it
// in Playwright's Chromium (SwiftShader). Steps:
//   1. Coefficients: linear radiance at the back-plate sample point for albedo 0 and 1 under each light, tone mapping
//      off, float target. Every material is linear in its albedo, so the grid search below is exact arithmetic.
//   2. Calibration B's search. The spec's grid (E 0.6 to 1.4 by 0.1, K 0 to 1.5 by 0.25, front case only) is run and
//      reported, and it leaves the fanned row 15 to 18 dE00 darker than its swatches: RoomEnvironment lights a back
//      turned 72 degrees about half as much as the front case's. So the search adds the even fill (an AmbientLight that
//      reaches every case alike, family-page.md 2.5 "Even light on all 24") and minimises the worst of three medians:
//      the front case and the fanned cases left and right of it. E is kept at 0.3 or more and K at 0.25 or more so the
//      cases keep their form. Guards: front median 3.0 or less and max 6.0 or less; Mahogany, Midnight and Wine at
//      dE00 6 or less; the gloss peak relative luminance is measured by a real render and reported.
//   3. Real 8-bit renders (the contact sheet): every family as a 6 x 4 grid under A and under B at the chosen pair,
//      matte and gloss, sampled at the same point; per-shade JSON, a tiled PNG with each case's CSS swatch beside it.
//   4. --write: src/scripts/family/three/calibration.json (E, K, measured errors, the model hash) and the baselines.
// Pass marks (case-model-class.md 10): A median <= 2.0, max <= 4.0, all < 5; B median <= 3.0, max <= 6.0.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { de2000, hexToRgb, neutralToSrgb8 } from './colour.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const OUT = resolve(arg('--out', join(ROOT, 'test-results', 'calibration')));
const WRITE = process.argv.includes('--write');
mkdirSync(OUT, { recursive: true });
const data = JSON.parse(readFileSync(join(ROOT, 'docs/data/shades-240.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(ROOT, 'src/data/case-model.json'), 'utf8'));
const CAL_PATH = join(ROOT, 'src/scripts/family/three/calibration.json');
const prev = JSON.parse(readFileSync(CAL_PATH, 'utf8'));
const shades = data.families.flatMap((f) => f.shades.map((s) => ({ fam: f.name, slug: f.id, name: s.name, hex: s.hex })));
const NEUTRAL = { pearl: '#F7F6F3', slate: '#383F43' };

// 1. bundle and serve
const js = (await build({ entryPoints: [join(ROOT, 'tests/case-model/harness/render.ts')], bundle: true, format: 'esm', platform: 'browser', write: false, minify: false, logLevel: 'error', define: { 'import.meta.env.PUBLIC_HERO_HOOKS': '"0"' } })).outputFiles[0].text;
const html = '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000"><script type="module" src="/harness.js"></script>';
const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://x').pathname;
  if (u === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(html); }
  if (u === '/harness.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(js); }
  if (u.startsWith('/models/') && /^\/models\/[\w.-]+\.glb$/.test(u)) { try { const b = readFileSync(join(ROOT, 'public', u)); res.writeHead(200, { 'content-type': 'model/gltf-binary' }); return res.end(b); } catch { /* 404 below */ } }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => window.H, null, { timeout: 60_000 });
const KEYPOS = prev.keyPosition ?? [-2, 3, 4];
await page.evaluate((k) => window.H.setKey(k), KEYPOS);
const dims = await page.evaluate(() => window.H.init());
console.log('model dims', JSON.stringify(dims.dims));
const coef = (cfg) => page.evaluate((c) => window.H.coefficients(c), cfg);

// predicted sRGB 8-bit for a hex at (E, K) from the coefficients: L = E (a_env x + b_env) + K (a_key x + b_key)
const lin = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
function predict(c, hex, E, K, A = 0) {
  const alb = hexToRgb(hex).map(lin);
  const term = (t, x, i) => x * (t[0][i] + (t[1][i] - t[0][i]) * alb[i]);
  const L = [0, 1, 2].map((i) => term(c.env, E, i) + term(c.key, K, i) + term(c.amb, A, i));
  return neutralToSrgb8(L);
}
const stats = (des) => { const s = [...des].sort((a, b) => a - b); const q = (p) => s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))]; return { n: s.length, median: +q(0.5).toFixed(2), p90: +q(0.9).toFixed(2), max: +s[s.length - 1].toFixed(2), under2: +(s.filter((x) => x < 2).length / s.length).toFixed(3), under5: +(s.filter((x) => x < 5).length / s.length).toFixed(3) }; };
const scoreAt = (c, E, K, A = 0) => shades.map((s) => de2000(hexToRgb(s.hex), predict(c, s.hex, E, K, A)));

const cA = await coef({ kind: 'A', finish: 'matte' });
const cB = await coef({ kind: 'B', finish: 'matte', layout: 'wide' });
const cBp = await coef({ kind: 'B', finish: 'matte', layout: 'phone' });
const cBg = await coef({ kind: 'B', finish: 'gloss', layout: 'wide' });
const rows = {};
for (const x of [-3, -1, 1, 3]) rows[x] = await coef({ kind: 'row', finish: 'matte', x, layout: 'wide' });
console.log('coefficients (linear radiance at the sample point, albedo 0 and 1):', JSON.stringify({ A: cA, B: cB }));

// 2. calibration A (prediction) and B's grid search
const predA = stats(scoreAt(cA, 1, 0));
const GUARD = ['Mahogany', 'Midnight', 'Wine'];
const median = (a) => { const t = [...a].sort((x, y) => x - y); return t[t.length >> 1]; };
const guardOf = (des) => Math.max(...shades.map((s, i) => [s, des[i]]).filter(([s]) => GUARD.includes(s.name)).map(([, d]) => d));
// the spec's grid, front case only (reported)
const specGrid = [];
for (let E = 0.6; E <= 1.4001; E += 0.1) for (let K = 0; K <= 1.5001; K += 0.25) {
  const des = scoreAt(cB, E, K);
  specGrid.push({ E: +E.toFixed(2), K: +K.toFixed(2), ...stats(des), guardMax: +guardOf(des).toFixed(2), rowLeft: +median(scoreAt(rows[-1], E, K)).toFixed(2), rowRight: +median(scoreAt(rows[1], E, K)).toFixed(2) });
}
const specBest = specGrid.filter((g) => g.guardMax <= 6).sort((a, b) => a.median - b.median)[0];
console.log('spec grid (front only), best:', JSON.stringify(specBest));
// the even-light search
const cand = [];
for (let E = 0.3; E <= 1.2001; E += 0.05) for (let K = 0.25; K <= 1.5001; K += 0.125) for (let A = 0; A <= 3.0001; A += 0.1) {
  const f = scoreAt(cB, E, K, A); const fm = median(f), fx = Math.max(...f);
  if (fm > 3 || fx > 6 || guardOf(f) > 6) continue;
  const l = median(scoreAt(rows[-1], E, K, A)), r = median(scoreAt(rows[1], E, K, A));
  cand.push({ E: +E.toFixed(2), K: +K.toFixed(3), A: +A.toFixed(2), front: +fm.toFixed(2), frontMax: +fx.toFixed(2), rowLeft: +l.toFixed(2), rowRight: +r.toFixed(2), score: Math.max(fm, l, r) });
}
cand.sort((a, b) => a.score - b.score || a.front - b.front);
const choice = cand[0];
choice.glossPeak = +(await page.evaluate((c) => window.H.peak(c), { hex: '#08bcf4', E: choice.E, K: choice.K, A: choice.A, finish: 'gloss' })).toFixed(3);
console.log('calibration A (predicted):', JSON.stringify(predA));
console.log('even-light search, best 5:', JSON.stringify(cand.slice(0, 5)));
console.log('chosen:', JSON.stringify(choice));
const { E, K, A: AMB } = choice;
const rowReport = Object.fromEntries(Object.entries(rows).map(([x, c]) => [x, stats(scoreAt(c, E, K, AMB))]));
const phoneB = stats(scoreAt(cBp, E, K, AMB));
const glossB = stats(scoreAt(cBg, E, K, AMB));
console.log('B matte at the phone scale:', JSON.stringify(phoneB), 'B gloss:', JSON.stringify(glossB));
console.log('fanned row cases (matte, predicted at the chosen lights), by slot offset:', JSON.stringify(rowReport));

// 3. real renders: the contact sheets
async function sheet(kind, finish, x = 0) {
  const per = [];
  const tiles = [];
  for (const [fi, fam] of data.families.entries()) {
    const hexes = fam.shades.map((s) => s.hex);
    // B cells on the family's stage neutral (catalog order alternates Slate, Pearl); the sample point is on the case
    const r = await page.evaluate((c) => window.H.grid(c), { kind, finish, hexes, E, K, A: AMB, x, neutral: kind === 'B' ? (fi % 2 ? NEUTRAL.pearl : NEUTRAL.slate) : undefined });
    fam.shades.forEach((s, i) => { const de = de2000(hexToRgb(s.hex), r.rgb[i]); per.push({ id: s.id, family: fam.name, name: s.name, hex: s.hex, rgb: r.rgb[i], dE00: +de.toFixed(2) }); });
    tiles.push({ fam, png: Buffer.from(r.png.split(',')[1], 'base64') });
  }
  // tile 2 x 5 families; each case gets its CSS swatch (a 24 px square) at its top left
  const cw = 120, ch = 180, gw = cw * 6, gh = ch * 4, pad = 12;
  const comp = [];
  tiles.forEach((t, k) => {
    const ox = (k % 2) * (gw + pad), oy = Math.floor(k / 2) * (gh + pad);
    comp.push({ input: t.png, left: ox, top: oy });
    t.fam.shades.forEach((s, i) => comp.push({ input: { create: { width: 22, height: 22, channels: 3, background: s.hex } }, left: ox + (i % 6) * cw + 4, top: oy + Math.floor(i / 6) * ch + 4 }));
  });
  const png = await sharp({ create: { width: gw * 2 + pad, height: gh * 5 + pad * 4, channels: 3, background: kind === 'A' ? '#000000' : NEUTRAL.pearl } }).composite(comp).png().toBuffer();
  const s = stats(per.map((p) => p.dE00));
  const worst = [...per].sort((a, b) => b.dE00 - a.dE00).slice(0, 10).map((p) => [`${p.family}/${p.name}`, p.hex, p.rgb, p.dE00]);
  return { per, png, stats: s, worst };
}
const A = await sheet('A', 'matte');
const B = await sheet('B', 'matte');
const Bg = await sheet('B', 'gloss');
const Rl = await sheet('B', 'matte', -1);
const Rr = await sheet('B', 'matte', 1);
console.log('contact sheet, fanned row left / right (measured):', JSON.stringify(Rl.stats), JSON.stringify(Rr.stats));
const royal = B.per.filter((p) => p.family === 'Vivid Violets' && (p.name === 'Royal' || p.name === 'Midnight'));
console.log('contact sheet A (measured):', JSON.stringify(A.stats), 'worst', JSON.stringify(A.worst.slice(0, 5)));
console.log('contact sheet B matte (measured):', JSON.stringify(B.stats), 'worst', JSON.stringify(B.worst.slice(0, 5)));
console.log('contact sheet B gloss (measured):', JSON.stringify(Bg.stats));
console.log('T13 Royal and Midnight:', JSON.stringify(royal.map((p) => [p.name, p.rgb])));
writeFileSync(join(OUT, 'contact-sheet-A.png'), A.png);
writeFileSync(join(OUT, 'contact-sheet-B.png'), B.png);
writeFileSync(join(OUT, 'contact-sheet-B-gloss.png'), Bg.png);
writeFileSync(join(OUT, 'contact-sheet-row-left.png'), Rl.png);
writeFileSync(join(OUT, 'contact-sheet-A.json'), JSON.stringify({ stats: A.stats, worst: A.worst, shades: A.per }, null, 1));
writeFileSync(join(OUT, 'contact-sheet-B.json'), JSON.stringify({ E, K, A: AMB, stats: B.stats, worst: B.worst, gloss: Bg.stats, rowLeft: Rl.stats, rowRight: Rr.stats, shades: B.per }, null, 1));
const passA = A.stats.median <= 2 && A.stats.max <= 4 && A.stats.under5 === 1;
const passB = B.stats.median <= 3 && B.stats.max <= 6;
console.log(`T6: A ${passA ? 'PASS' : 'FAIL'} (median ${A.stats.median}, max ${A.stats.max}); B ${passB ? 'PASS' : 'FAIL'} (median ${B.stats.median}, max ${B.stats.max})`);

if (WRITE) {
  const cal = {
    about: 'Written by scripts/case-model/calibrate.mjs (case-model-class.md 10), never by hand. E, K and the even fill (ambientIntensity) from calibration B on the supplier model, searched so the front case and the fanned row both read at their swatch colours; frozen with the model hash; any change to lighting, materials or model must pass again.',
    model: manifest.sha256,
    three: '0.165.0',
    environmentIntensity: E,
    keyIntensity: K,
    ambientIntensity: AMB,
    keyPosition: KEYPOS,
    matte: prev.matte,
    glossLow: prev.glossLow,
    glossHigh: prev.glossHigh,
    measured: {
      date: new Date().toISOString().slice(0, 10), renderer: 'Chromium SwiftShader (Playwright 1.56.1)',
      A: A.stats, B: B.stats, Bgloss: Bg.stats, Bphone: phoneB, rowLeft: Rl.stats, rowRight: Rr.stats, glossPeak: choice.glossPeak,
      rowPredicted: rowReport, search: cand.slice(0, 5), specGridBest: specBest,
    },
  };
  writeFileSync(CAL_PATH, JSON.stringify(cal, null, 2) + '\n');
  const base = join(ROOT, 'tests/case-model/baseline');
  writeFileSync(join(base, 'contact-sheet-A-supplier.json'), JSON.stringify({ stats: A.stats, shades: A.per.map(({ id, hex, rgb, dE00 }) => ({ id, hex, rgb, dE00 })) }));
  writeFileSync(join(base, 'contact-sheet-B-supplier.json'), JSON.stringify({ E, K, A: AMB, stats: B.stats, gloss: Bg.stats, rowLeft: Rl.stats, rowRight: Rr.stats, shades: B.per.map(({ id, hex, rgb, dE00 }) => ({ id, hex, rgb, dE00 })) }));
  console.log('wrote', CAL_PATH, 'and the supplier baselines');
}
await browser.close();
server.close();
process.exit(passA && passB ? 0 : 1);
