// The steps' frames for AC5's flash check (scripts/room/loop-flash.py): each step drawn by the hooks build one 1/24 s
// tick at a time (the loop's clock frozen, window.__skreedTick handing it one frame's worth, so the sequence is the
// step at 24 frames a second whatever the capture's own pace; the loop elements play on at the wall clock, so a frame's
// video content is whatever the loops show then), shot at device pixel ratio 1 into a folder per step. The five steps
// of the check: the four forward steps and the step back from scene 5 (--steps lists them as from-to pairs), at 390 x
// 844 and 1280 x 800, 36 frames each (the 0.77 s step and the lights' settling after it). Serve a hooks build first:
//   node scripts/room/step-frames.mjs [base=http://127.0.0.1:4322/] --out <dir> [--steps 1-2,2-3,3-4,4-5,5-4] [--frames 36]
// The browser is the installed Chrome (channel chrome) when present, else Playwright's Chromium (no H.264: stills on
// the planes); WebGL on the Metal GPU, or SKREED_GL=swiftshader for the test harness's flags.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4322/';
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const out = opt('--out') ?? 'step-frames';
const STEPS = (opt('--steps') ?? '1-2,2-3,3-4,4-5,5-4').split(',').map((s) => s.split('-').map(Number));
const N = Number(opt('--frames') ?? 36), DT = 1 / 24;
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(out, { recursive: true });

async function launch(a) {
  try { const b = await chromium.launch({ channel: 'chrome', args: a }); console.log('browser: the installed Chrome (channel chrome)'); return b; }
  catch (e) { console.warn(`browser: no installed Chrome (${String(e.message ?? e).split('\n')[0]}); Playwright's Chromium, which decodes no H.264`); return chromium.launch({ args: a }); }
}
const browser = await launch(GL);
for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${vp.width}] page error:`, e.message));
  await page.goto(new URL('/?tier=hero3d&glue=0', base).href, { waitUntil: 'load' });
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
  for (const [from, to] of STEPS) {
    const dir = to > from ? 1 : -1;
    await page.evaluate((j) => window.__s4.scene(j), from - 1);
    // both loops in (the step waits on the next scene's still at least), the lines settled
    await page.waitForFunction(([a, b]) => { const s = window.__s4.state(); const inn = (k) => s.loops.some((l) => l.i === k && (l.in || l.state === 'failed' || !s.video)); return s.state === 'world' && s.scene === a && !s.busy && inn(a) && inn(b); }, [from - 1, to - 1], { timeout: 120_000 }).catch(() => console.warn(`  step ${from} to ${to}: a loop did not settle`));
    await sleep(2000);
    const folder = join(out, `step-${vp.width}-${from}-${to}`);
    mkdirSync(folder, { recursive: true });
    // the clock frozen, the step started, then one tick a frame: each frame's draw waited for before its shot
    await page.evaluate(() => { window.__skreedFreeze = true; });
    await sleep(100);
    const started = await page.evaluate((d) => window.__s4.step(d), dir);
    if (!started) { console.warn(`  step ${from} to ${to}: refused`); await page.evaluate(() => { window.__skreedFreeze = false; }); continue; }
    for (let k = 0; k < N; k++) {
      await page.evaluate((d) => new Promise((r) => { const f0 = window.__skreedFrame ?? 0; window.__skreedTick = d; const wait = () => (((window.__skreedFrame ?? 0) > f0 + 1) && !window.__skreedTick ? r() : requestAnimationFrame(wait)); requestAnimationFrame(wait); }), DT);
      await page.screenshot({ path: join(folder, `frame-${String(k).padStart(3, '0')}.png`) });
    }
    const st = await page.evaluate(() => { const s = window.__s4.state(); return { scene: s.scene, step: s.step, busy: s.busy }; });
    console.log(`[${vp.width}] step ${from} to ${to}: ${N} frames at 1/24 s into ${folder}; after: ${JSON.stringify(st)}`);
    await page.evaluate(() => { window.__skreedFreeze = false; });
    await sleep(1200);
  }
  await ctx.close();
}
await browser.close();
