// The steps', the seams', the way back's and the wrap's frames for AC5's flash check (scripts/room/loop-flash.py): each
// sequence drawn by the hooks build one 1/24 s tick at a time (the loop's clock frozen, window.__skreedTick handing it one
// frame's worth, so the sequence runs at 24 frames a second whatever the capture's own pace; the loop elements play on at
// the wall clock, so a frame's video content is whatever the loops show then), shot at device pixel ratio 1 into a folder
// per sequence, at 390 x 844 and 1280 x 800. The sequences (--seq, comma separated; the default is all of AC5's):
//   <from>-<to>   one step, 36 frames (the 0.77 s step and the lights' settling after it); AC5's five are 1-2,2-3,3-4,4-5,5-4
//   burst-<ms>    five steps back to back at stepMs <ms> (Tune's shortest is 400): 1 to 5 and back to 4, each requested on
//                 the first frame the previous one allows (the step and the 150 ms after it), then half a second of rest
//   exit          the exit seam from scene 5: the raw scroll across q 12.8 (the cover in, the jump to scroll 0, the cover
//                 out over the hero, the lock), 36 frames
//   wrap          the wrap from scroll 0 (after the exit) onto scene 5: the cover in over the hero, the landing, the cover
//                 out, the lock, 36 frames
//   back          the way back from scene 1: the circle shrinking into the hall at the station, 36 frames
// Serve a hooks build first:
//   node scripts/room/step-frames.mjs [base=http://127.0.0.1:4322/] --out <dir> [--seq 1-2,2-3,3-4,4-5,5-4,burst-400,exit,wrap,back] [--frames 36]
// The folders are step-<W>-<from>-<to>, burst-<W>-<ms>, seam-<W>-exit, seam-<W>-wrap and seam-<W>-back. The browser is the
// installed Chrome (channel chrome) when present, else Playwright's Chromium (no H.264: stills on the planes); WebGL on the
// Metal GPU, or SKREED_GL=swiftshader for the test harness's flags.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { LOOP_START, roomParams } from '../../src/config/room.ts';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4322/';
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const out = opt('--out') ?? 'step-frames';
const SEQ = (opt('--seq') ?? '1-2,2-3,3-4,4-5,5-4,burst-400,exit,wrap,back').split(',');
const N = Number(opt('--frames') ?? 36), DT = 1 / 24, FPS = 24;
const BURST = [1, 1, 1, 1, -1];   // five steps: 1 to 5, then back to 4
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(out, { recursive: true });

async function launch(a) {
  try { const b = await chromium.launch({ channel: 'chrome', args: a }); console.log('browser: the installed Chrome (channel chrome)'); return b; }
  catch (e) { console.warn(`browser: no installed Chrome (${String(e.message ?? e).split('\n')[0]}); Playwright's Chromium, which decodes no H.264`); return chromium.launch({ args: a }); }
}
const frame = (k) => `frame-${String(k).padStart(3, '0')}.png`;
const folderFor = (name) => { const f = join(out, name); mkdirSync(f, { recursive: true }); return f; };
const freeze = (page, on) => page.evaluate((v) => { window.__skreedFreeze = v; }, on);
/** one tick: one frame's worth of clock handed in, the frame's draw waited for, then its shot */
async function tick(page, file) {
  await page.evaluate((d) => new Promise((r) => { const f0 = window.__skreedFrame ?? 0; window.__skreedTick = d; const wait = () => (((window.__skreedFrame ?? 0) > f0 + 1) && !window.__skreedTick ? r() : requestAnimationFrame(wait)); requestAnimationFrame(wait); }), DT);
  await page.screenshot({ path: file });
}
const after = (page) => page.evaluate(() => { const s = window.__s4.state(); return { state: s.state, scene: s.scene, step: s.step, busy: s.busy, seam: s.seam, y: Math.round(scrollY) }; });
const loopIn = (s, k) => s.loops.some((l) => l.i === k && (l.in || l.state === 'failed' || !s.video));
/** scene i at rest with its loop in (or failed), scene j's too (the step waits on the next scene's still at least), the lines settled */
async function atScene(page, i, j = i) {
  await page.evaluate((k) => window.__s4.scene(k), i);
  await page.waitForFunction(([a, b]) => { const s = window.__s4.state(); const inn = (k) => s.loops.some((l) => l.i === k && (l.in || l.state === 'failed' || !s.video)); return s.state === 'world' && s.scene === a && !s.busy && inn(a) && inn(b); }, [i, j], { timeout: 120_000 }).catch(() => console.warn(`  scene ${i + 1}: a loop did not settle`));
  await sleep(2000);
}

const browser = await launch(GL);
for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const W = vp.width;
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${W}] page error:`, e.message));
  await page.goto(new URL('/?tier=hero3d&glue=0&room=open', base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 240_000 });
  await page.evaluate(() => window.__skreedIntro?.skip?.());
  await page.waitForFunction(() => !document.documentElement.classList.contains('intro'), null, { timeout: 30_000 }).catch(() => {});
  const go = async (q, settle = 900) => {
    await page.evaluate((qq) => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + qq * innerHeight; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); }, q);
    await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 120_000 });
    await page.waitForFunction(() => { const s = window.__s4?.state(); return !!s?.layout && !s.layout.intro; }, null, { timeout: 30_000 }).catch(() => {});
    await page.evaluate((qq) => window.__skreedRoom?.snap(qq), q);
    await sleep(settle);
  };
  await go(1, 1200); await go(4, 300); await go(9.5, 1500);
  await page.waitForFunction(() => window.__s4?.state()?.worldReady, null, { timeout: 180_000 });
  for (const seq of SEQ) {
    if (/^\d+-\d+$/.test(seq)) {
      const [from, to] = seq.split('-').map(Number), dir = to > from ? 1 : -1;
      await atScene(page, from - 1, to - 1);
      const folder = folderFor(`step-${W}-${from}-${to}`);
      // the clock frozen, the step started, then one tick a frame
      await freeze(page, true); await sleep(100);
      const started = await page.evaluate((d) => window.__s4.step(d), dir);
      if (!started) { console.warn(`  step ${from} to ${to}: refused`); await freeze(page, false); continue; }
      for (let k = 0; k < N; k++) await tick(page, join(folder, frame(k)));
      console.log(`[${W}] step ${from} to ${to}: ${N} frames at 1/24 s into ${folder}; after: ${JSON.stringify(await after(page))}`);
      await freeze(page, false); await sleep(1200);
    } else if (/^burst-\d+$/.test(seq)) {
      const ms = Number(seq.slice(6));
      await atScene(page, 0);
      await page.waitForFunction(() => { const s = window.__s4.state(); return s.loops.every((l) => l.in || l.state === 'failed' || !s.video); }, null, { timeout: 180_000 }).catch(() => console.warn('  burst: a loop did not settle'));
      // Tune's live copy of the parameters with the short step (liveRoomParams reads it in every build), then the clock frozen
      await page.evaluate((p) => { window.__skreedTune = { room: { params: p } }; }, { ...roomParams(), stepMs: ms });
      const folder = folderFor(`burst-${W}-${ms}`);
      await freeze(page, true); await sleep(100);
      const frames = Math.ceil(((ms + 150) * BURST.length / 1000) * FPS) + FPS / 2, at = [];
      let next = 0;
      for (let k = 0; k < frames; k++) {
        if (next < BURST.length && await page.evaluate((d) => window.__s4.step(d), BURST[next])) { at.push(k); next++; }
        await tick(page, join(folder, frame(k)));
      }
      console.log(`[${W}] burst at stepMs ${ms}: ${frames} frames at 1/24 s into ${folder}; the five steps requested at frames ${at.join(', ')}; after: ${JSON.stringify(await after(page))}`);
      await freeze(page, false);
      await page.evaluate(() => { window.__skreedTune = undefined; });
      await sleep(1200);
    } else if (seq === 'exit') {
      await atScene(page, 4);
      await go(12.5, 1200);
      const folder = folderFor(`seam-${W}-exit`);
      await freeze(page, true); await sleep(100);
      await page.evaluate((q) => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + q * innerHeight; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); }, LOOP_START + 0.05);
      for (let k = 0; k < N; k++) await tick(page, join(folder, frame(k)));
      console.log(`[${W}] the exit seam: ${N} frames at 1/24 s into ${folder}; after: ${JSON.stringify(await after(page))}`);
      await freeze(page, false); await sleep(1200);
    } else if (seq === 'wrap') {
      // from scroll 0: the page is there after the exit; else the back-to-top hook takes it there
      await page.evaluate(() => { if (scrollY > 0) window.__skreedTop?.(); });
      await page.waitForFunction(() => scrollY < 2 && window.__s4.state().state !== 'seam', null, { timeout: 20_000 }).catch(() => console.warn('  wrap: the page is not at the top'));
      await sleep(1500);
      const folder = folderFor(`seam-${W}-wrap`);
      await freeze(page, true); await sleep(100);
      await page.evaluate(() => window.__s4.wrap());
      for (let k = 0; k < N; k++) await tick(page, join(folder, frame(k)));
      console.log(`[${W}] the wrap: ${N} frames at 1/24 s into ${folder}; after: ${JSON.stringify(await after(page))}`);
      await freeze(page, false);
      await page.waitForFunction(() => window.__s4.state().state === 'world', null, { timeout: 20_000 }).catch(() => console.warn('  the wrap did not land'));
      await sleep(1500);
    } else if (seq === 'back') {
      await atScene(page, 0);
      const folder = folderFor(`seam-${W}-back`);
      await freeze(page, true); await sleep(100);
      const started = await page.evaluate(() => window.__s4.back());
      if (!started) { console.warn('  the way back: refused'); await freeze(page, false); continue; }
      for (let k = 0; k < N; k++) await tick(page, join(folder, frame(k)));
      console.log(`[${W}] the way back: ${N} frames at 1/24 s into ${folder}; after: ${JSON.stringify(await after(page))}`);
      await freeze(page, false); await sleep(1500);
    } else console.warn(`  unknown sequence ${seq}`);
  }
  await ctx.close();
}
await browser.close();
