// Section 5's review frames, as Sam's picture of 2026-11-02 (docs/specs/section-5.md): from a hooks build (the dev
// server, or a test or staging build), section 5 opened by the quiz gate's override (?room=open) with the glue off, at
// 390 x 844 and 1280 x 800, on the 3D path (?tier=hero3d: the island's flat ground under the section) and the poster
// path (?tier=poster: the page's own ground): section 5 at rest (its top at the viewport's top, the visitor's jar empty),
// after Facebook (a quarter of blue), after YouTube on top (fy) and after Instagram (fyi, full), each once its fill has
// finished ('skreed:signup-filled'), and the form's error state (an address that is not one, on blur). The presses go
// through window.__skreedSignupHooks (counted without opening a tab). The frames are section-5-<W>-<name>.png in the
// output folder (docs/specs/screenshots/ by default), the two at rest also as section-5-390.png and section-5-1280.png
// (the build skill's names); the poster path's carry -poster.
//   node scripts/signup/frames.mjs [base=http://127.0.0.1:4321/] [--out docs/specs/screenshots] [--only phone|laptop] [--poster]
// --poster renders the poster frames alone. The browser is the installed Chrome when present (CHROME_PATH or the channel),
// else Playwright's Chromium; SKREED_GL=swiftshader runs WebGL on SwiftShader.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) ?? 'http://127.0.0.1:4321/';
const oi = args.indexOf('--out'), out = oi >= 0 ? args[oi + 1] : 'docs/specs/screenshots';
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const posterOnly = args.includes('--poster');
const GL = process.env.SKREED_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--ignore-gpu-blocklist', '--enable-gpu'];
const SETUPS = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, w: 390 }, laptop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, w: 1280 } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(args) {
  if (process.env.CHROME_PATH) { const b = await chromium.launch({ executablePath: process.env.CHROME_PATH, args }); console.log(`browser: ${process.env.CHROME_PATH}`); return b; }
  try { const b = await chromium.launch({ channel: 'chrome', args }); console.log('browser: the installed Chrome (channel chrome)'); return b; }
  catch (e) { console.warn(`browser: no installed Chrome (${String(e.message ?? e).split('\n')[0]}); Playwright's Chromium`); return chromium.launch({ args }); }
}
const browser = await launch(GL);
mkdirSync(out, { recursive: true });

async function open(setup, tier) {
  const { w, ...opts } = SETUPS[setup];
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${setup}] page error:`, e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.warn(`[${setup}] console error:`, m.text().slice(0, 200)); });
  await page.addInitScript(() => { window.__filled = []; addEventListener('skreed:signup-filled', (e) => { window.__filled.push(e.detail.state); }); });
  await page.goto(new URL(`/?tier=${tier}&glue=0&room=open`, base).href, { waitUntil: 'load' });
  await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
  if (tier === 'hero3d') {
    await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 300_000 });
    await page.evaluate(() => window.__skreedIntro?.skip?.());
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro'), null, { timeout: 30_000 }).catch(() => console.warn(`[${setup}] the intro class did not leave within 30 s`));
  }
  await page.waitForFunction(() => !document.getElementById('signup')?.hidden, null, { timeout: 30_000 }).catch(() => console.warn(`[${setup}] section 5 stayed hidden`));
  return { ctx, page, w };
}
/** section 5's top at the viewport's top (read twice: the room's layout may move under it once the page settles) */
async function atSignup(page) {
  for (let pass = 0; pass < 2; pass++) {
    await page.evaluate(() => { const el = document.getElementById('signup'), y = el.getBoundingClientRect().top + scrollY; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); });
    await sleep(900);
  }
  await page.waitForFunction(() => document.getElementById('signup')?.dataset.ready === '1' && !!window.__skreedSignupHooks, null, { timeout: 15_000 }).catch(() => console.warn('section 5 not ready within 15 s'));
  await page.evaluate(() => document.fonts.ready);
}
const shot = async (page, name) => { const p = join(out, `${name}.png`); await page.screenshot({ path: p }); console.log(`  ${p}`); return p; };
/** a follow counted through the hooks, then its fill let finish */
async function press(page, id, setup) {
  const n = await page.evaluate(() => window.__filled.length);
  await page.evaluate((id) => window.__skreedSignupHooks.press(id), id);
  await page.waitForFunction((n) => window.__filled.length > n, n, { timeout: 10_000 }).catch(() => console.warn(`[${setup}] the ${id} fill did not finish within 10 s`));
  await sleep(250);
}

async function frames(setup, tier) {
  const sfx = tier === 'poster' ? '-poster' : '';
  const { ctx, page, w } = await open(setup, tier);
  await atSignup(page);
  await page.evaluate(() => window.__skreedSignupHooks?.reset());
  await sleep(400);
  console.log(`[${setup}${sfx}] at rest: state ${await page.evaluate(() => window.__skreedSignupHooks?.state())}, ground ${await page.evaluate(() => document.getElementById('signup').dataset.ground ?? 'page')}`);
  await shot(page, `section-5-${w}-rest${sfx}`);
  if (!sfx) await shot(page, `section-5-${w}`);
  await press(page, 'facebook', setup); await shot(page, `section-5-${w}-f${sfx}`);
  await press(page, 'youtube', setup); await shot(page, `section-5-${w}-fy${sfx}`);
  await press(page, 'instagram', setup); await shot(page, `section-5-${w}-fyi${sfx}`);
  console.log(`[${setup}${sfx}] fills ${JSON.stringify(await page.evaluate(() => window.__filled))}`);
  // the form's error state: an address that is not one, read on blur
  if (await page.locator('#suEmail').count()) {
    await page.locator('#suEmail').fill('not-an-address');
    await page.locator('#suEmail').blur();
    await sleep(200);
    await shot(page, `section-5-${w}-form-error${sfx}`);
  } else console.log(`[${setup}${sfx}] no form in this build (PUBLIC_LEADS off)`);
  await page.evaluate(() => window.__skreedSignupHooks?.reset());
  await ctx.close();
}

for (const setup of Object.keys(SETUPS)) {
  if (only && only !== setup) continue;
  if (!posterOnly) await frames(setup, 'hero3d');
  await frames(setup, 'poster');
}
await browser.close();
console.log('done');
