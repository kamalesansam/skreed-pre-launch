// Where each beat's case sits on the page: the projected top and bottom of the case (local y +0.5 and -0.5 of its height 1),
// its alpha box on the canvas, and the viewport, at 1280 x 800 and 390 x 844, for beats 1 to 4 and the argument screen.
//   BASE_URL=http://127.0.0.1:8795/ node beat-fit.mjs
import { launch, sharp, openFamily, toScreen, rest, settledTypes, PHONE, WIDE } from './lib.mjs';
const browser = await launch();
for (const [label, opts] of [['1280', WIDE], ['390', PHONE]]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await openFamily(page);
  await toScreen(page, 0.6);
  await settledTypes(page);
  for (const [sv, name] of [[2, 'beat1 tough'], [3, 'beat2 magtough'], [4, 'beat3 snap'], [5, 'beat4 armor'], [6, 'argument']]) {
    await toScreen(page, sv);
    await rest(page, sv);
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const S = window.__famStage, s = S.state(), slot = Math.round(s.s);
      const top = S.project(slot, [0, 0.5, 0]), bottom = S.project(slot, [0, -0.5, 0]), left = S.project(slot, [-0.27, 0, 0]), right = S.project(slot, [0.27, 0, 0]);
      return { type: s.type, top: +top.y.toFixed(1), bottom: +bottom.y.toFixed(1), left: +left.x.toFixed(1), right: +right.x.toFixed(1), H: innerHeight, W: innerWidth };
    });
    const url = await page.evaluate(() => window.__famStage.snapshot());
    const { data, info } = await sharp(Buffer.from(url.split(',')[1], 'base64')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let y0 = info.height, y1 = -1, x0 = info.width, x1 = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 24) { if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x; }
    const sy = r.H / info.height, sx = r.W / info.width;
    console.log(label, name, JSON.stringify({ ...r, alphaBox: { top: +(y0 * sy).toFixed(0), bottom: +((y1 + 1) * sy).toFixed(0), left: +(x0 * sx).toFixed(0), right: +((x1 + 1) * sx).toFixed(0) }, cutBottom: r.bottom > r.H, cutTop: r.top < 0 }));
  }
  await ctx.close();
}
await browser.close();
