// The lit profile of the front case at each beat: the canvas's alpha box split into ten horizontal bands, the mean
// luminance (sRGB, 0 to 255) of the case's pixels in each band, top to bottom, at 1280 x 800 and 390 x 844; and the
// ratio of each band to the brightest, so the pool's fall-off up the case reads as a number. Sam, 2026-11-03: "the
// spotlight going away slowly for magtough snap and armor, it should be the same as tough case for all other case types".
//   BASE_URL=http://127.0.0.1:8795/ node beat-light.mjs [label]
import { launch, sharp, openFamily, toScreen, rest, settledTypes, PHONE, WIDE } from './lib.mjs';
const tag = process.argv[2] || '';
const browser = await launch();
const out = {};
for (const [label, opts] of [['1280', WIDE], ['390', PHONE]]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await openFamily(page);
  await toScreen(page, 0.6);
  await settledTypes(page);
  out[label] = {};
  for (const [sv, name] of [[2, 'tough'], [3, 'magtough'], [4, 'snap'], [5, 'armor']]) {
    await toScreen(page, sv);
    await rest(page, sv);
    await page.waitForTimeout(300);
    const url = await page.evaluate(() => window.__famStage.snapshot());
    const { data, info } = await sharp(Buffer.from(url.split(',')[1], 'base64')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let y0 = info.height, y1 = -1;
    const rows = [];
    for (let y = 0; y < info.height; y++) { let n = 0, s = 0; for (let x = 0; x < info.width; x++) { const i = (y * info.width + x) * 4; if (data[i + 3] > 200) { n++; s += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]; } } rows.push([n, s]); if (n > 0) { if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    const bands = [];
    for (let b = 0; b < 10; b++) { const a = y0 + Math.floor((y1 - y0 + 1) * b / 10), z = y0 + Math.floor((y1 - y0 + 1) * (b + 1) / 10); let n = 0, s = 0; for (let y = a; y < z; y++) { n += rows[y][0]; s += rows[y][1]; } bands.push(n ? s / n : 0); }
    const peak = Math.max(...bands);
    const rel = bands.map((v) => +(v / peak).toFixed(2));
    out[label][name] = { type: (await page.evaluate(() => window.__famStage.state().type)), bands: bands.map((v) => Math.round(v)), rel, top: rel[0], dimmest: Math.min(...rel) };
    console.log(label, name, out[label][name].type, 'bands', out[label][name].bands.join(' '), '| rel', rel.join(' '));
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify({ tag, out }));
