// Section 4's still and review frames (docs/specs/section-4.md 2 "poster path"; docs/specs/section-4-world.md AC1),
// rendered from our own build: a hooks build (the dev server, or a test or staging build) driven through __s4 and the
// section's q, in Playwright's Chromium. Run with a server up:
//   node scripts/room/render-stills.mjs [base=http://127.0.0.1:4322/]            the hall's still into src/assets/room/stills/
//   node scripts/room/render-stills.mjs [base] --frames <dir>                    the review frames at 390 x 844 and 1280 x 800
// The frames, each by a named hook (AC1): the hall at the station with the prompt; the entry clock held by __s4.seek at
// the bubble's 25, 50 and 90 percent, each ring pass, the morph's 30, 50 and 80 percent and the push's end; each land at
// rest with its text (__s4.land); each travel at half (__s4.travel); the true pair either side of the loop's jump (the
// fourth wipe held at 0.99, just short of the jump at 0.995, then the first frame the jump lands on, the page's frames
// held there for the shot); and the poster tier's column (?tier=poster: the still with its prompt, then each land on its
// screen after the press). A frame the build cannot show (no land in it) is reported and skipped. SKREED_GL=swiftshader runs WebGL on SwiftShader (the
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
// the entry's beats at the defaults (config/room.ts ROOM_PARAMS, world.ts GLIDE): the bubble from 0.35 s for 2 s, the
// morph from 75 percent of the 8 s glide for 1.8 s, then the 1.2 s push
const BUBBLE_AT = 0.35, BUBBLE_S = 2.0, MORPH_S = 1.8, PUSH_S = 1.2;

const browser = await chromium.launch({ args: GL });

async function open(setup) {
  const ctx = await browser.newContext(SETUPS[setup]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${setup}] page error:`, e.message));
  await page.goto(new URL('/?tier=hero3d', base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 240_000 });
  await page.evaluate(() => window.__skreedIntro?.skip?.());
  const gl = await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const x = c?.getExtension('WEBGL_debug_renderer_info'); return x ? c.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  console.log(`[${setup}] renderer: ${gl}`);
  return { ctx, page };
}

/** puts the page at the section's q (its own screens), the followers snapped, and waits for frames to settle */
async function go(page, q, settle = 900) {
  await page.evaluate((qq) => {
    const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + qq * innerHeight;
    scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); window.__skreedRoom?.snap(qq);
  }, q);
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 120_000 });
  await page.waitForTimeout(settle);
}
const state = (page) => page.evaluate(() => window.__s4.state());
/** the entry clock held at sec seconds after the press (entering first, once the world and land 1 are in) */
async function seek(page, sec, settle = 700) {
  await page.waitForFunction(() => window.__s4?.state()?.worldReady, null, { timeout: 180_000 });
  await page.evaluate((s) => window.__s4.seek(s), sec);
  await page.waitForTimeout(settle);
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
    const lands = (await state(page)).lands;
    if (!lands) { console.warn(`[${setup}] no land in this build: the press does nothing new, so the entry's frames are skipped`); await ctx.close(); continue; }
    // the entry, held by its clock
    for (const pct of [25, 50, 90]) { await seek(page, BUBBLE_AT + (BUBBLE_S * pct) / 100); await shot(page, f(`bubble-${pct}`)); }
    const s = await state(page), passes = s.world?.passes ?? [], arrive = s.world?.arrive ?? s.arrive;
    console.log(`[${setup}] passes ${JSON.stringify(passes)}, arrive ${arrive}`);
    for (const [k, t] of passes.entries()) { await seek(page, t); await shot(page, f(`ring-${k + 1}-pass`)); }
    const m1 = arrive - PUSH_S, m0 = m1 - MORPH_S;
    for (const pct of [30, 50, 80]) { await seek(page, m0 + ((m1 - m0) * pct) / 100); await shot(page, f(`morph-${pct}`)); }
    await seek(page, arrive - 0.02); await shot(page, f('push-end'));
    // land 1 at rest, its text decoded in, the page at its station
    await seek(page, arrive + 0.1, 400);
    await page.waitForFunction(() => window.__s4.state().state === 'world', null, { timeout: 20_000 });
    await page.waitForTimeout(2600);
    await shot(page, f('land-1-rest'));
    // the other lands at rest, and each travel at half (the cross-fade until the options are built)
    for (let i = 1; i < lands; i++) {
      await page.evaluate((j) => window.__s4.land(j), i);
      await page.waitForFunction((j) => window.__s4.state().resident.some((r) => r.i === j && (r.ready || r.failed)), i, { timeout: 60_000 });
      await page.evaluate((j) => window.__s4.land(j), i);
      await page.waitForTimeout(2600); await shot(page, f(`land-${i + 1}-rest`));
    }
    for (let i = 0; i + 1 < lands; i++) {
      await page.evaluate((j) => window.__s4.land(j), i); await page.waitForTimeout(600);
      await page.waitForFunction((j) => window.__s4.state().resident.some((r) => r.i === j + 1 && (r.ready || r.failed)), i, { timeout: 60_000 });
      await page.evaluate((j) => window.__s4.travel(j, j + 1, 0.5), i); await page.waitForTimeout(500);
      await shot(page, f(`travel-${i + 1}-${i + 2}-half`));
      await page.evaluate((j) => window.__s4.travel(j, j + 1, -1), i); await page.waitForTimeout(800);
    }
    // the loop: the last land, the fourth wipe half way, then the pair either side of the jump
    await page.evaluate((j) => window.__s4.land(j), lands - 1); await page.waitForTimeout(1500);
    const loop0 = 9 + 2 * lands;
    await go(page, loop0 + 0.5, 1200); await shot(page, f('loop-half'));
    await go(page, loop0 + 0.99, 1200); await shot(page, f('loop-before-jump'));
    // the first frame after the jump: the director's frame that reports the jump stops the page's frames (its own rAF
    // callbacks are held from then on), so the shot shows that frame and no later one; then everything runs on
    await page.evaluate(() => {
      const raf = window.requestAnimationFrame.bind(window), held = [], on = window.__skreedRoomFrame;
      let hold = false;
      window.requestAnimationFrame = (cb) => (hold ? (held.push(cb), 0) : raf(cb));
      window.__skreedRoomFrame = (fr) => { on?.(fr); if (fr.jumped) hold = true; };
      window.__s4Release = () => { window.requestAnimationFrame = raf; window.__skreedRoomFrame = on; for (const cb of held.splice(0)) raf(cb); };
    });
    await page.evaluate((q) => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + q * innerHeight; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); window.__skreedRoom?.snap(q); }, loop0 + 0.999);
    await page.waitForFunction(() => scrollY < 2, null, { timeout: 20_000, polling: 50 }).catch(() => console.warn('  no jump within 20 s'));
    await page.waitForTimeout(300);
    await shot(page, f('loop-after-jump'));
    await page.evaluate(() => window.__s4Release?.());
    console.log(`[${setup}] scrollY after the loop: ${await page.evaluate(() => scrollY)}; state ${JSON.stringify(await page.evaluate(() => ({ sb: window.__skreedState?.().sb, s4: window.__s4?.state()?.state })))}`);
    await ctx.close();
    // the poster tier's column: the still with the prompt over it, then each land on its own screen after the press
    const pc = await browser.newContext(SETUPS[setup]), pp = await pc.newPage();
    await pp.goto(new URL('/?tier=poster', base).href, { waitUntil: 'load' });
    // each frame with its element's top at the viewport's top, as a visitor scrolling down reaches it
    await pp.evaluate(() => document.getElementById('room').scrollIntoView({ block: 'start', behavior: 'instant' })); await pp.waitForTimeout(1500);
    await shot(pp, f('poster-hall'));
    await pp.locator('#rmEnter').click();
    await pp.waitForFunction(() => document.getElementById('room')?.dataset.state === 'world', null, { timeout: 20_000 });
    for (const [k, li] of (await pp.locator('.rm-land').all()).entries()) {
      await li.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await pp.waitForFunction((i) => { const img = document.querySelector(`.rm-land[data-i="${i}"] img`); return !!img && img.complete && img.naturalWidth > 0; }, k, { timeout: 30_000 }).catch(() => console.warn(`  poster land ${k + 1}: its picture did not decode`));
      await pp.waitForTimeout(400);
      await shot(pp, f(`poster-land-${k + 1}`));
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
