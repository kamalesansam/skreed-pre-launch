// Section 4's stills and review frames (docs/specs/section-4.md 2 "poster path", 6 and AC1), rendered from our own build:
// a hooks build (the dev server, or a test or staging build) driven through __s4 and the section's q, in Playwright's
// Chromium. Run with the dev server up:
//   node scripts/room/render-stills.mjs [base=http://127.0.0.1:4322/]            the four stills into src/assets/room/stills/
//   node scripts/room/render-stills.mjs [base] --frames <dir>                    the review frames at 390 x 844 and 1280 x 800
// SKREED_GL=swiftshader runs WebGL on SwiftShader (the test harness's flags) when the GPU path is not available.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4322/';
const fi = args.indexOf('--frames'), framesDir = fi >= 0 ? args[fi + 1] : null;
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'];
const SETUPS = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, laptop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 } };

const browser = await chromium.launch({ args: GL });

async function open(setup) {
  const ctx = await browser.newContext(SETUPS[setup]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${setup}] page error:`, e.message));
  await page.goto(new URL('/?tier=hero3d', base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 180_000 });
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

async function enterAndSeek(page, sec) {
  await page.waitForFunction(() => window.__s4?.state()?.universe?.ready, null, { timeout: 120_000 });
  await page.evaluate((s) => { if (window.__s4.state().state === 'hall') window.__s4.enter(); window.__s4.seek(s); }, sec);
  await page.waitForTimeout(500);
}

const shot = async (page, file) => { await page.screenshot({ path: file }); console.log('  ', file); };

if (framesDir) {
  mkdirSync(framesDir, { recursive: true });
  for (const setup of Object.keys(SETUPS)) {
    const { ctx, page } = await open(setup);
    const W = SETUPS[setup].viewport.width;
    for (const q of [0.5, 1, 4, 8.5, 9.5]) { await go(page, q, q === 0.5 ? 1500 : 900); await shot(page, join(framesDir, `s4-${W}-q${q}.png`)); }
    for (const t of [0.45, 1.0, 1.4, 1.9]) { await enterAndSeek(page, t); await shot(page, join(framesDir, `s4-${W}-t${t}.png`)); }
    await enterAndSeek(page, 2.4); await page.waitForTimeout(800);
    await shot(page, join(framesDir, `s4-${W}-universe-q10.png`));
    // the pedestals are centred at q 10, 10.67, 11.33 and 12 (config/room.ts pedestalQ); a hover on laptops floats a label
    for (const q of [10.67, 11.33, 12]) {
      await go(page, q, 1400);
      if (setup === 'laptop') { const c = SETUPS.laptop.viewport; await page.mouse.move(c.width / 2, c.height * 0.6); await page.waitForTimeout(400); }
      await shot(page, join(framesDir, `s4-${W}-universe-q${q}.png`));
    }
    // the loop: the fourth wipe half way, then the frame after the jump
    await go(page, 12.5, 1200); await shot(page, join(framesDir, `s4-${W}-loop-half.png`));
    await page.evaluate(() => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY; scrollTo({ top: top + 13.2 * innerHeight, behavior: 'instant' }); });
    await page.waitForFunction(() => scrollY < 2, null, { timeout: 20_000 }).catch(() => console.warn('  no jump within 20 s'));
    await page.waitForTimeout(600);
    await shot(page, join(framesDir, `s4-${W}-after-jump.png`));
    console.log(`[${setup}] scrollY after the loop: ${await page.evaluate(() => scrollY)}; state ${JSON.stringify(await page.evaluate(() => ({ sb: window.__skreedState?.().sb, s4: window.__s4?.state()?.state })))}`);
    await ctx.close();
  }
} else {
  // the stills: the hall from the start station and the universe from the doorway, without the section's DOM or the logotype
  const out = 'src/assets/room/stills';
  mkdirSync(out, { recursive: true });
  const hide = (page) => page.evaluate(() => { for (const el of document.querySelectorAll('#rmStage > *, .site-logo, .scrollcue, #tune, astro-dev-toolbar')) el.style.visibility = 'hidden'; });
  for (const [setup, cls] of [['phone', 'portrait'], ['laptop', 'wide']]) {
    const { ctx, page } = await open(setup);
    await go(page, 1, 1500); await hide(page);
    const hall = await page.screenshot();
    await go(page, 9.5, 1200);   // the universe loads during the walk (past q 1)
    await enterAndSeek(page, 2.4); await page.waitForTimeout(900); await go(page, 11.0, 1500); await hide(page);
    const uni = await page.screenshot();
    for (const [name, buf] of [['hall', hall], ['universe', uni]]) {
      const size = cls === 'portrait' ? { width: 720, height: 1280 } : { width: 1280, height: 800 };
      const img = sharp(buf).resize({ ...size, fit: 'cover' });
      let q = 55, avif = await img.clone().avif({ quality: q, effort: 6 }).toBuffer();
      while (avif.length > 60_000 && q > 25) { q -= 5; avif = await img.clone().avif({ quality: q, effort: 6 }).toBuffer(); }
      let wq = 72, webp = await img.clone().webp({ quality: wq }).toBuffer();
      while (webp.length > 60_000 && wq > 30) { wq -= 6; webp = await img.clone().webp({ quality: wq }).toBuffer(); }
      writeFileSync(join(out, `${name}-${cls}.avif`), avif); writeFileSync(join(out, `${name}-${cls}.webp`), webp);
      console.log(`${name}-${cls}: avif ${avif.length} B (q${q}), webp ${webp.length} B (q${wq})`);
    }
    await ctx.close();
  }
}
await browser.close();
