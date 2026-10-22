// Section 4's still and review frames (docs/specs/section-4.md 2 "poster path"; docs/specs/section-4-flux.md AC1),
// rendered from our own build: a hooks build (the dev server, or a test or staging build) driven through __s4 and the
// section's q, with the glue off (?glue=0) so a scrollTo lands where it is sent. The browser is the installed Chrome
// (Playwright's channel 'chrome', which decodes H.264, so the loops play) when it is present, else Playwright's own
// Chromium (no H.264: every loop is refused and the planes show the stills). Before the first snap the script waits
// for the section's layout to have been read after the intro (the hooks report it; a reading under the intro's layout
// lands every snap 13,784 px short at 390 x 844, the build record's D1). Run with a server up:
//   node scripts/room/render-stills.mjs [base=http://127.0.0.1:4322/]            the hall's still into src/assets/room/stills/
//   node scripts/room/render-stills.mjs [base] --frames <dir>                    the review frames at 390 x 844 and 1280 x 800
// The frames, each by a named hook (AC1): the hall at the station with the prompt; the entry clock held by __s4.seek at
// the bubble's 25, 50 and 90 percent; each scene at rest with its four lines (__s4.scene); a mid-step frame of each class
// (__s4.step, shot about a third of the way in); the hold past scene 5; the exit seam's cover (the raw scroll across
// 12.8, shot during the cover-in) and the first frame after the jump; the wrap from the top onto scene 5 (__s4.wrap) at
// full cover and at rest; the way back from scene 1 at its half; and the poster tier's column (?tier=poster: the still
// with its prompt, then each scene on its screen after the press). SKREED_GL=swiftshader runs WebGL on SwiftShader (the
// test harness's flags) when the GPU path is not available.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4322/';
const fi = args.indexOf('--frames'), framesDir = fi >= 0 ? args[fi + 1] : null;
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'];
const SETUPS = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, laptop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 } };
// the entry's beats at the defaults (config/room.ts ROOM_PARAMS, transition.ts BUBBLE): the bubble from 0.35 s for 2 s; the
// step 770 ms; the scenes at q 10 to 12 at a step of 0.5, the hold to 12.8
const BUBBLE_AT = 0.35, BUBBLE_S = 2.0, STEP_MS = 770, SCENES = 5, LOOP_START = 12.8;

/** the installed Chrome when Playwright finds it, else its own Chromium */
async function launch(args) {
  try { const b = await chromium.launch({ channel: 'chrome', args }); console.log('browser: the installed Chrome (channel chrome)'); return b; }
  catch (e) { console.warn(`browser: no installed Chrome (${String(e.message ?? e).split('\n')[0]}); Playwright's Chromium, which decodes no H.264`); return chromium.launch({ args }); }
}
const browser = await launch(GL);

/** the section's layout as the director holds it, read after the intro: a snap before that lands short (D1) */
const layoutRead = () => { const s = window.__s4?.state(); return !!s && !!s.layout && !s.layout.intro && !document.documentElement.classList.contains('intro'); };

async function open(setup) {
  const ctx = await browser.newContext(SETUPS[setup]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${setup}] page error:`, e.message));
  await page.goto(new URL('/?tier=hero3d&glue=0', base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 240_000 });
  await page.evaluate(() => window.__skreedIntro?.skip?.());
  await page.waitForFunction(() => !document.documentElement.classList.contains('intro'), null, { timeout: 30_000 }).catch(() => console.warn(`[${setup}] the intro class did not leave within 30 s`));
  const gl = await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const x = c?.getExtension('WEBGL_debug_renderer_info'); return x ? c.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  console.log(`[${setup}] renderer: ${gl}`);
  return { ctx, page };
}

/** puts the page at the section's q (its own screens), the followers snapped, and waits for frames to settle */
async function go(page, q, settle = 900) {
  // the director's own reading of the layout, taken after the intro, before its snap is trusted (the director is made at
  // idle after the intro or when the quiz nears, so the page is scrolled to the section first, by the live rect)
  await page.evaluate((qq) => {
    const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + qq * innerHeight;
    scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight);
  }, q);
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 120_000 });
  await page.waitForFunction(layoutRead, null, { timeout: 30_000 }).catch(() => console.warn('  the section\'s layout was not read after the intro within 30 s; the snap may land short'));
  await page.evaluate((qq) => { window.__skreedRoom?.snap(qq); }, q);
  await page.waitForTimeout(settle);
}
const state = (page) => page.evaluate(() => window.__s4.state());
/** the entry clock held at sec seconds after the press (entering first, once products.bin and scene 1's loop are in) */
async function seek(page, sec, settle = 700) {
  await page.waitForFunction(() => window.__s4?.state()?.worldReady, null, { timeout: 180_000 });
  await page.evaluate((s) => window.__s4.seek(s), sec);
  await page.waitForTimeout(settle);
}
/** scene i at rest, its loop in (or failed) and its lines decoded */
async function scene(page, i) {
  await page.evaluate((j) => window.__s4.scene(j), i);
  await page.waitForFunction((j) => { const s = window.__s4.state(); return s.state === 'world' && s.scene === j && !s.busy && s.loops.some((l) => l.i === j && (l.in || l.state === 'failed' || !s.video)); }, i, { timeout: 120_000 }).catch(() => console.warn(`  scene ${i + 1}: its loop did not settle`));
  await page.waitForTimeout(2200);
}

const shot = async (page, file) => { await page.screenshot({ path: file }); console.log('  ', file); };

if (framesDir) {
  mkdirSync(framesDir, { recursive: true });
  for (const setup of Object.keys(SETUPS)) {
    const { ctx, page } = await open(setup);
    const W = SETUPS[setup].viewport.width, f = (name) => join(framesDir, `s4-${W}-${name}.png`);
    // the hall: the start, and the station with the prompt decoded in
    await go(page, 1, 1500); await shot(page, f('hall-start'));
    await go(page, 4, 300); await go(page, 9.5, 2200); await shot(page, f('hall-station-prompt'));
    // the entry, held by its clock: the bubble over scene 1 with its loop playing
    for (const pct of [25, 50, 90]) { await seek(page, BUBBLE_AT + (BUBBLE_S * pct) / 100); await shot(page, f(`bubble-${pct}`)); }
    const arrive = (await state(page)).arrive;
    await seek(page, arrive + 0.1, 400);
    await page.waitForFunction(() => window.__s4.state().state === 'world', null, { timeout: 20_000 });
    await page.waitForTimeout(2600);
    await shot(page, f('scene-1-rest'));
    // the other scenes at rest, and a mid-step frame (about a third of the step in, on this class's arc)
    for (let i = 1; i < SCENES; i++) { await scene(page, i); await shot(page, f(`scene-${i + 1}-rest`)); }
    await scene(page, 1);
    await page.evaluate(() => window.__s4.step(1)); await page.waitForTimeout(STEP_MS / 3); await shot(page, f('step-2-3-mid'));
    await page.waitForTimeout(STEP_MS);
    // the hold past scene 5, then the exit seam: the cover a tenth of a second in, and the first frame after the jump
    await scene(page, SCENES - 1);
    await go(page, 12.5, 1200); await shot(page, f('hold'));
    await page.evaluate((q) => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY; scrollTo({ top: top + q * innerHeight, behavior: 'instant' }); window.__skreedSnap?.((top + q * innerHeight) / innerHeight); }, LOOP_START + 0.05);
    await page.waitForTimeout(100); await shot(page, f('exit-cover-in'));
    await page.waitForFunction(() => scrollY < 2, null, { timeout: 20_000, polling: 50 }).catch(() => console.warn('  no jump within 20 s'));
    await page.waitForTimeout(120); await shot(page, f('exit-after-jump'));
    await page.waitForTimeout(1200);
    console.log(`[${setup}] scrollY after the exit: ${await page.evaluate(() => scrollY)}; state ${JSON.stringify(await page.evaluate(() => ({ sb: window.__skreedState?.().sb, s4: window.__s4?.state()?.state })))}`);
    // the wrap from the top: full cover over the hero, then scene 5 at rest with the wrap's line
    await page.evaluate(() => window.__s4.wrap());
    await page.waitForFunction(() => { const s = window.__s4.state(); return s.seam && (s.seam.phase === 'hold' || s.seam.phase === 'out'); }, null, { timeout: 10_000 }).catch(() => console.warn('  the wrap did not reach full cover'));
    await shot(page, f('wrap-cover'));
    await page.waitForFunction(() => window.__s4.state().state === 'world', null, { timeout: 20_000 }).catch(() => console.warn('  the wrap did not land'));
    await page.waitForTimeout(2600); await shot(page, f('wrap-scene-5'));
    // the way back from scene 1: the circle at its half, then the hall at the station
    await scene(page, 0);
    await page.evaluate(() => window.__s4.back()); await page.waitForTimeout(500); await shot(page, f('back-half'));
    await page.waitForFunction(() => window.__s4.state().state === 'hall', null, { timeout: 20_000 }).catch(() => console.warn('  the way back did not end'));
    await page.waitForTimeout(1500); await shot(page, f('back-hall'));
    await ctx.close();
    // the poster tier's column: the still with the prompt over it, then each scene on its own screen after the press
    const pc = await browser.newContext(SETUPS[setup]), pp = await pc.newPage();
    await pp.goto(new URL('/?tier=poster', base).href, { waitUntil: 'load' });
    // each frame with its element's top at the viewport's top, as a visitor scrolling down reaches it
    await pp.evaluate(() => document.getElementById('room').scrollIntoView({ block: 'start', behavior: 'instant' })); await pp.waitForTimeout(1500);
    await shot(pp, f('poster-hall'));
    await pp.locator('#rmEnter').click();
    await pp.waitForFunction(() => document.getElementById('room')?.dataset.state === 'world', null, { timeout: 20_000 });
    for (const [k, li] of (await pp.locator('.rm-scene').all()).entries()) {
      await li.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await pp.waitForFunction((i) => { const img = document.querySelector(`.rm-scene[data-i="${i}"] img`); return !!img && img.complete && img.naturalWidth > 0; }, k, { timeout: 30_000 }).catch(() => console.warn(`  poster scene ${k + 1}: its still did not decode`));
      await pp.waitForTimeout(400);
      await shot(pp, f(`poster-scene-${k + 1}`));
    }
    await pc.close();
  }
} else {
  // the hall's still, from the start station, without the section's DOM or the logotype
  const out = 'src/assets/room/stills';
  mkdirSync(out, { recursive: true });
  const hide = (page) => page.evaluate(() => { for (const el of document.querySelectorAll('#rmStage > *, .site-logo, .scrollcue, #tune, astro-dev-toolbar')) el.style.visibility = 'hidden'; });
  for (const [setup, cls] of [['phone', 'portrait'], ['laptop', 'wide']]) {
    const { ctx, page } = await open(setup);
    await go(page, 1, 1500); await hide(page);
    const buf = await page.screenshot();
    const size = cls === 'portrait' ? { width: 720, height: 1280 } : { width: 1280, height: 800 };
    const img = sharp(buf).resize({ ...size, fit: 'cover' });
    let q = 55, avif = await img.clone().avif({ quality: q, effort: 6 }).toBuffer();
    while (avif.length > 60_000 && q > 25) { q -= 5; avif = await img.clone().avif({ quality: q, effort: 6 }).toBuffer(); }
    let wq = 72, webp = await img.clone().webp({ quality: wq }).toBuffer();
    while (webp.length > 60_000 && wq > 30) { wq -= 6; webp = await img.clone().webp({ quality: wq }).toBuffer(); }
    writeFileSync(join(out, `hall-${cls}.avif`), avif); writeFileSync(join(out, `hall-${cls}.webp`), webp);
    console.log(`hall-${cls}: avif ${avif.length} B (q${q}), webp ${webp.length} B (q${wq})`);
    await ctx.close();
  }
}
await browser.close();
