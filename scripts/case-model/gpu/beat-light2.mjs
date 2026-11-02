// The light up the back of the case at each beat, read at the same places on every type: the case's own points
// (x 0.14 of its height off the centre line, clear of the MagSafe ring and the logo, z 0; y from -0.40 to +0.30),
// projected by the stage's hook, each a 5 x 5 px mean of the canvas (sRGB luminance, 0 to 255; only where the case
// covers the pixel). The Tough's column is the reference: Sam, 2026-11-03, "it should be the same as tough case for all
// other case types".   BASE_URL=http://127.0.0.1:8795/ node beat-light2.mjs [label]
import { launch, sharp, openFamily, toScreen, rest, settledTypes, PHONE, WIDE } from './lib.mjs';
const tag = process.argv[2] || '';
const YS = [-0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
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
    const pts = await page.evaluate((ys) => {
      const S = window.__famStage, slot = Math.round(S.state().s), r = document.querySelector('#st3d canvas').getBoundingClientRect();
      return { r: { x: r.left, y: r.top, w: r.width, h: r.height }, type: S.state().type, p: ys.map((y) => S.project(slot, [0.14, y, 0])) };
    }, YS);
    const url = await page.evaluate(() => window.__famStage.snapshot());
    const { data, info } = await sharp(Buffer.from(url.split(',')[1], 'base64')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const lum = pts.p.map((q) => {
      const cx = Math.round((q.x - pts.r.x) / pts.r.w * info.width), cy = Math.round((q.y - pts.r.y) / pts.r.h * info.height);
      let n = 0, s = 0;
      for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
        if (x < 0 || y < 0 || x >= info.width || y >= info.height) continue;
        const i = (y * info.width + x) * 4; if (data[i + 3] < 200) continue;
        n++; s += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      }
      return n ? Math.round(s / n) : null;
    });
    out[label][name] = { type: pts.type, lum };
    console.log(label, name.padEnd(8), pts.type.padEnd(8), 'y -0.4..0.3:', lum.map((v) => String(v).padStart(4)).join(''));
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify({ tag, YS, out }));
