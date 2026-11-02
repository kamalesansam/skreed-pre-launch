// The seam under the band (criterion 5, "nothing is see-through"): during a held takeover, how many canvas pixels are
// transparent that both cases alone cover. For each hand-over at 390 and 1280: the canvas's alpha at raw 0 (the outgoing
// case alone) and at raw 1 (the incoming alone) give the pixels both cover; at raw 0.4, 0.5 and 0.6 any of those pixels
// with alpha under 250 is a gap the split left (the camera window is transparent in both, so it never counts).
//   BASE_URL=http://127.0.0.1:8795/ node seam-count.mjs
import { launch, sharp, openFamily, toScreen, rest, settledTypes, frames, PHONE, WIDE } from './lib.mjs';
const HANDOVERS = [['tough', 'magtough', 3], ['magtough', 'snap', 4], ['snap', 'armor', 5]];
const browser = await launch();
const alpha = async (page) => {
  const url = await page.evaluate(() => window.__famStage.snapshot());
  const { data, info } = await sharp(Buffer.from(url.split(',')[1], 'base64')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = new Uint8Array(info.width * info.height);
  for (let i = 0; i < a.length; i++) a[i] = data[i * 4 + 3];
  return { a, w: info.width, h: info.height };
};
const out = {};
for (const [label, opts] of [['1280', WIDE], ['390', PHONE]]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await openFamily(page);
  await toScreen(page, 0.6);
  await settledTypes(page);
  out[label] = {};
  for (const [from, to, beat] of HANDOVERS) {
    await toScreen(page, beat);
    await rest(page, beat);
    const hold = async (raw) => { await page.evaluate(([a, b, r]) => window.__famStage.holdTakeover(a, b, r), [from, to, raw]); await frames(page, 3); await page.waitForTimeout(80); return alpha(page); };
    const A0 = await hold(0), A1 = await hold(1);
    const both = new Uint8Array(A0.a.length);
    let nBoth = 0;
    for (let i = 0; i < both.length; i++) if (A0.a[i] >= 250 && A1.a[i] >= 250) { both[i] = 1; nBoth++; }
    const row = { covered: nBoth, canvas: `${A0.w}x${A0.h}` };
    for (const raw of [0.4, 0.5, 0.6]) {
      const S = await hold(raw);
      let gaps = 0, soft = 0; const rows = new Set();
      for (let i = 0; i < both.length; i++) if (both[i]) { if (S.a[i] < 250) { soft++; if (S.a[i] === 0) { gaps++; rows.add(Math.floor(i / S.w)); } } }
      row[`raw${raw}`] = { transparent: gaps, rowsWithGaps: rows.size, underOpaque: soft };
    }
    await page.evaluate(([a, b]) => window.__famStage.holdTakeover(a, b, null), [from, to]);
    await frames(page, 2);
    out[label][`${from}>${to}`] = row;
    console.log(label, `${from}>${to}`, JSON.stringify(row));
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out));
