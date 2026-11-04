// Section 4's review frames (docs/specs/section-4-flux.md AC1; docs/specs/section-4-no-hall.md AC2), rendered from our
// own build: a hooks build (the dev server, or a test or staging build) driven through __s4 and the section's q, with
// the glue off (?glue=0) so a scrollTo lands where it is sent. The browser is the installed Chrome (Playwright's channel
// 'chrome', which decodes H.264, so the loops play) when it is present, else Playwright's own Chromium (no H.264: every
// loop is refused and the planes show the stills). Before the first snap the script waits for the section's layout to
// have been read after the intro (the hooks report it; a reading under the intro's layout lands every snap 13,784 px
// short at 390 x 844, the build record's D1). Until 2026-11-02 it also rendered the hall's poster still; that left with
// the hall. Run with a server up:
//   node scripts/room/render-stills.mjs [base=http://127.0.0.1:4322/] --frames <dir>     the frames at 390 x 844 and 1280 x 800
// The frames, each by a named hook: the approach inside the third wipe (q 0.5); scene 1 at rest on arrival (q 1); each
// other scene at rest with its four lines (__s4.scene); a mid-step frame of each class (__s4.step, shot about a third
// of the way in); the hold past scene 5; the exit seam's cover (the raw scroll across 3.8, shot during the cover-in)
// and the first frame after the jump (no wrap from the top since 2026-11-04); and the
// poster tier's column (?tier=poster: each scene on its screen). SKREED_GL=swiftshader runs WebGL on SwiftShader (the
// test harness's flags) when the GPU path is not available; on a Mac the GPU path is Metal, elsewhere the platform's own.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4322/';
const fi = args.indexOf('--frames'), framesDir = fi >= 0 ? args[fi + 1] : null;
if (!framesDir) { console.error('render-stills: --frames <dir> is required (the hall\'s still left with the hall on 2026-11-02)'); process.exit(1); }
const GPU = process.platform === 'darwin' ? ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] : ['--ignore-gpu-blocklist', '--enable-gpu'];
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : GPU;
const SETUPS = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, laptop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 } };
// the beats at the defaults (config/room.ts ROOM_PARAMS): the step 770 ms; the scenes at q 1 to 3 at a step of 0.5, the hold to 3.8, the fourth wipe to 4.8 (no exit seam since 2026-11-03)
const STEP_MS = 770, SCENES = 5, WIPE4_START = 3.8;

/** the installed Chrome when Playwright finds it, else its own Chromium */
async function launch(args) {
  try { const b = await chromium.launch({ channel: 'chrome', args }); console.log('browser: the installed Chrome (channel chrome)'); return b; }
  catch (e) { console.warn(`browser: no installed Chrome (${String(e.message ?? e).split('\n')[0]}); Playwright's Chromium, which decodes no H.264`); return chromium.launch({ args }); }
}
const browser = await launch(GL);

/** the section's layout as the director holds it, read after the intro: a snap before that lands short (D1) */
const layoutRead = () => { const s = window.__s4?.state(); return !!s && !!s.layout && !s.layout.intro && !document.documentElement.classList.contains('intro'); };
/** Astro's dev toolbar leaks into captures near the bottom edge (docs: the section 4 frame review's notes) */
const NO_TOOLBAR = 'astro-dev-toolbar { display: none !important; }';

async function open(setup) {
  const ctx = await browser.newContext(SETUPS[setup]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${setup}] page error:`, e.message));
  await page.goto(new URL('/?tier=hero3d&glue=0&room=open', base).href, { waitUntil: 'load' });
  await page.addStyleTag({ content: NO_TOOLBAR }).catch(() => {});
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
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 180_000 });
  await page.waitForFunction(layoutRead, null, { timeout: 30_000 }).catch(() => console.warn('  the section\'s layout was not read after the intro within 30 s; the snap may land short'));
  await page.evaluate((qq) => { window.__skreedRoom?.snap(qq); }, q);
  await page.waitForTimeout(settle);
}
const state = (page) => page.evaluate(() => window.__s4.state());
/** scene i at rest, its loop in (or failed) and its lines decoded */
async function scene(page, i) {
  await page.evaluate((j) => window.__s4.scene(j), i);
  await page.waitForFunction((j) => { const s = window.__s4.state(); return s.state === 'world' && s.scene === j && !s.busy && s.loops.some((l) => l.i === j && (l.in || l.state === 'failed' || !s.video)); }, i, { timeout: 120_000 }).catch(() => console.warn(`  scene ${i + 1}: its loop did not settle`));
  await page.waitForTimeout(2200);
}

const shot = async (page, file) => { await page.screenshot({ path: file }); console.log('  ', file); };

mkdirSync(framesDir, { recursive: true });
for (const setup of Object.keys(SETUPS)) {
  const { ctx, page } = await open(setup);
  const W = SETUPS[setup].viewport.width, f = (name) => join(framesDir, `s4-${W}-${name}.png`);
  // the approach: the third wipe half way from the fog to scene 1, no line of the section yet
  await go(page, 0.5, 1500); await shot(page, f('approach-wipe'));
  console.log(`[${setup}] at q 0.5: ${JSON.stringify(await page.evaluate(() => { const s = window.__s4.state(); return { state: s.state, scene: s.scene }; }))}`);
  // the arrival: scene 1 at rest, its loop playing, its four lines and the two words decoded in
  await go(page, 1, 400);
  await page.waitForFunction(() => window.__s4.state().state === 'world', null, { timeout: 20_000 }).catch(() => console.warn('  no arrival at scene 1'));
  await page.waitForFunction(() => { const s = window.__s4.state(); return s.loops.some((l) => l.i === 0 && (l.in || l.state === 'failed' || !s.video)); }, null, { timeout: 120_000 }).catch(() => console.warn('  scene 1: its loop did not settle'));
  await page.waitForTimeout(2600);
  await shot(page, f('scene-1-rest'));
  // the other scenes at rest, and a mid-step frame (about a third of the step in, on this class's arc)
  for (let i = 1; i < SCENES; i++) { await scene(page, i); await shot(page, f(`scene-${i + 1}-rest`)); }
  await scene(page, 1);
  await page.evaluate(() => window.__s4.step(1)); await page.waitForTimeout(STEP_MS / 3); await shot(page, f('step-2-3-mid'));
  await page.waitForTimeout(STEP_MS);
  // the hold past scene 5, then the fourth wipe onto section 5 at its half (no exit seam since 2026-11-03)
  await scene(page, SCENES - 1);
  await go(page, 3.5, 1200); await shot(page, f('hold'));
  await go(page, WIPE4_START + 0.5, 600); await shot(page, f('wipe4-half'));
  console.log(`[${setup}] state at the end: ${JSON.stringify(await state(page).then((s) => ({ state: s.state, scene: s.scene, memory: s.memory })))}`);
  await ctx.close();
  // the poster tier's column: each scene on its own screen from the section's top
  const pc = await browser.newContext(SETUPS[setup]), pp = await pc.newPage();
  await pp.goto(new URL('/?tier=poster&room=open', base).href, { waitUntil: 'load' });
  await pp.addStyleTag({ content: NO_TOOLBAR }).catch(() => {});
  // the poster page's boot holds the page at the top until its loader has gone: a scroll before that is dropped
  await pp.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 60_000 }).catch(() => {});
  await pp.evaluate(() => document.getElementById('room').scrollIntoView({ block: 'start', behavior: 'instant' })); await pp.waitForTimeout(1500);
  for (const [k, li] of (await pp.locator('.rm-scene').all()).entries()) {
    // each frame with its element's top at the viewport's top, as a visitor scrolling down reaches it
    await li.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await pp.waitForFunction((i) => { const img = document.querySelector(`.rm-scene[data-i="${i}"] img`); return !!img && img.complete && img.naturalWidth > 0; }, k, { timeout: 30_000 }).catch(() => console.warn(`  poster scene ${k + 1}: its still did not decode`));
    await pp.waitForTimeout(400);
    await shot(pp, f(`poster-scene-${k + 1}`));
  }
  await pc.close();
}
await browser.close();
