// The takeover at real speed on the GPU: a scroll from 2.7 to 3.0 screens over 300 ms (the hand-over into the MagTough
// at 2.85), recorded as a video by the browser context, then a contact sheet of its last seconds at 12 frames a second.
//   BASE_URL=http://127.0.0.1:8795/ node video-takeover.mjs <outdir>
import { mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { launch, openFamily, toScreen, rest, settledTypes, WIDE, PHONE } from './lib.mjs';
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const browser = await launch();
for (const [label, opts, from, to] of [['1280', WIDE, 2.7, 3.0], ['390', PHONE, 2.7, 3.0], ['1280-up', WIDE, 4.2, 3.6]]) {
  const ctx = await browser.newContext({ ...opts, recordVideo: { dir: OUT, size: opts.viewport } });
  const page = await ctx.newPage();
  await openFamily(page);
  await toScreen(page, 0.6);
  await settledTypes(page);
  await toScreen(page, from);
  await rest(page, from);
  await page.waitForTimeout(600);
  const log = await page.evaluate(([a, b, ms]) => new Promise((done) => {
    const rows = [], t0 = performance.now();
    const step = (now) => {
      const t = now - t0;
      scrollTo({ top: Math.round((a + (b - a) * Math.min(1, t / ms)) * innerHeight), behavior: 'instant' });
      const s = window.__famStage.state();
      rows.push([Math.round(t), +s.sv.toFixed(3), s.takeover.phase, s.takeover.to, +s.takeover.raw.toFixed(3)]);
      if (t < ms + 2200) requestAnimationFrame(step); else done(rows);
    };
    requestAnimationFrame(step);
  }), [from, to, 300]);
  const video = page.video();
  await ctx.close();
  const src = await video.path();
  const dst = join(OUT, `takeover-${label}.webm`);
  renameSync(src, dst);
  const run = log.filter((r) => r[2] !== 'idle');
  console.log(label, dst, 'run frames', run.length, 'from', run[0]?.[0], 'ms to', run.at(-1)?.[0], 'ms; raw steps max', Math.max(0, ...run.slice(1).map((r, i) => Math.abs(r[4] - run[i][4]))).toFixed(3));
  // the last 3.2 s of the video (the glide and the run), 12 frames a second, 7 to a row
  const cols = 7, rows = 6, w = label === '390' ? 150 : 260;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-sseof', '-3.2', '-i', dst, '-vf', `fps=12,scale=${w}:-1,tile=${cols}x${rows}`, '-frames:v', '1', join(OUT, `takeover-${label}-sheet.png`)]);
  console.log('  sheet', join(OUT, `takeover-${label}-sheet.png`));
}
await browser.close();
