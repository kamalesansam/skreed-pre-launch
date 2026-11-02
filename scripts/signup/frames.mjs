// Section 5's review frames (docs/specs/section-5-liquid.md AC1): from a hooks build (the dev server, or a test or
// staging build) driven through the hooks (__s4, __s5) with the glue off, at 390 x 844 and 1280 x 800: scene 5 at
// rest, the fourth wipe at its half (the room's q 13.3), section 5 at rest (the empty jar, the count line, the three
// rows) and the same at 0 degrees of tilt (Sam's pair), the Instagram press held by the stream's clock at 0.15 s (the
// head of the stream in the mouth), 0.55 s (the landing, the dimple under the foot, the first ring) and 1.40 s (mid-rise,
// the violet band under the stream, the pink parcels above the seam in the air), then settled; Facebook pressed on the
// half-full jar at 1.0 s (the Azure band growing over the pink); the full jar after YouTube, the same at 0 degrees; the
// page 120 px further (the jar moved with its slot, the bands with the jar); the form in view (the body's end), the exit
// seam's cover (the raw scroll across
// exitY, shot during the cover-in) and the first frame after the jump, the wrap from the top at full cover and at rest,
// and the poster tier (?tier=poster) before and after a Facebook press (the jar-f still). The frames are the ones the
// build hands the review (section-5-<W>-<name>.png in docs/specs/screenshots/), the two at rest also as section-5-390.png
// and section-5-1280.png (the build skill's names).
//   node scripts/signup/frames.mjs [base=http://127.0.0.1:4321/] [--out docs/specs/screenshots] [--only phone|laptop] [--poster]
// --poster renders the two poster frames alone (no WebGL; the 3D frames kept as they are). The browser is the installed
// Chrome when present, else Playwright's Chromium; SKREED_GL=swiftshader runs WebGL on SwiftShader.
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
/** the view from above, degrees (jars-math.ts JAR.tiltDeg); the pair at 0 is Sam's */
const TILT = 10;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(args) {
  try { const b = await chromium.launch({ channel: 'chrome', args }); console.log('browser: the installed Chrome (channel chrome)'); return b; }
  catch (e) { console.warn(`browser: no installed Chrome (${String(e.message ?? e).split('\n')[0]}); Playwright's Chromium`); return chromium.launch({ args }); }
}
const browser = await launch(GL);
mkdirSync(out, { recursive: true });

async function open(setup, query = '?tier=hero3d&glue=0&room=open') {
  const { w, ...opts } = SETUPS[setup];
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`[${setup}] page error:`, e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.warn(`[${setup}] console ${m.type()}:`, m.text().slice(0, 200)); });
  await page.goto(new URL('/' + query, base).href, { waitUntil: 'load' });
  return { ctx, page, w };
}
async function ready3d(page, setup) {
  await page.waitForFunction(() => window.__heroStarted && !document.documentElement.classList.contains('loading'), null, { timeout: 300_000 });
  await page.evaluate(() => window.__skreedIntro?.skip?.());
  await page.waitForFunction(() => !document.documentElement.classList.contains('intro'), null, { timeout: 30_000 }).catch(() => console.warn(`[${setup}] the intro class did not leave within 30 s`));
  const gl = await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const x = c?.getExtension('WEBGL_debug_renderer_info'); return x ? c.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  console.log(`[${setup}] renderer: ${gl}`);
  await page.evaluate(() => window.__s5?.load());
  await page.waitForFunction(() => !!window.__s5?.ready || !!window.__s5?.state?.()?.failed, null, { timeout: 90_000 }).catch(() => console.warn(`[${setup}] the jar did not come in within 90 s`));
  await page.waitForFunction(() => { const s = window.__s4?.state(); return !!s && !!s.layout && !s.layout.intro; }, null, { timeout: 60_000 }).catch(() => console.warn(`[${setup}] the room's layout was not read after the intro`));
}
/** the page at the room's q (its own screens), the followers snapped */
async function goQ(page, q, settle = 900) {
  await page.evaluate((qq) => { const room = document.getElementById('room'), top = room.getBoundingClientRect().top + scrollY, y = top + qq * innerHeight; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); window.__skreedRoom?.snap(qq); }, q);
  await sleep(settle);
}
/** the page at a document y, the followers snapped */
async function goY(page, y, settle = 900) {
  await page.evaluate((yy) => { scrollTo({ top: yy, behavior: 'instant' }); window.__skreedSnap?.(yy / innerHeight); }, y);
  await sleep(settle);
}
/** Astro's dev toolbar (the dev server only; a build has none) drawn out of the captures: its bar sits at the bottom
 *  centre, over the page */
const hideToolbar = (page) => page.evaluate(() => document.querySelector('astro-dev-toolbar')?.style.setProperty('display', 'none', 'important')).catch(() => {});
const shot = async (page, name) => { const p = join(out, `${name}.png`); await hideToolbar(page); await page.screenshot({ path: p }); console.log(`  ${p}`); return p; };
const state = (page) => page.evaluate(() => ({ s4: (({ state, scene, qRaw, wipeOut, exitY, restY, seam }) => ({ state, scene, qRaw, wipeOut, exitY, restY, seam }))(window.__s4.state()), s5: window.__s5?.state?.() }));
const s5 = (page) => page.evaluate(() => window.__s5?.state?.());
/** a press on a follow word that stays on the page (the link's new tab is not followed here) */
const press = (page, id) => page.evaluate((id) => { const a = document.querySelector(`a.su-follow[data-id="${id}"]`); a?.setAttribute('target', '_self'); a?.addEventListener('click', (e) => e.preventDefault(), { once: true }); a?.click(); }, id);
/** the running stream held at t seconds of its clock, two frames drawn */
const scrub = async (page, t) => { await page.evaluate((t) => window.__s5?.scrub(t), t); await sleep(160); };
/** the stream let run from where it stands until it has settled */
const settle = async (page, setup) => { await page.evaluate(() => window.__s5?.scrub(null)); await page.waitForFunction(() => { const s = window.__s5?.state?.(); return !!s && s.pour === null && s.queue.length === 0; }, null, { timeout: 12_000 }).catch(() => console.warn(`[${setup}] the stream did not settle within 12 s`)); await sleep(200); };
const tilt = async (page, deg) => { await page.evaluate((d) => window.__s5?.tilt(d), deg); await sleep(160); };

for (const setup of Object.keys(SETUPS)) {
  if (only && only !== setup) continue;
  if (posterOnly) { await poster(setup); continue; }
  const { ctx, page, w } = await open(setup);
  await ready3d(page, setup);
  console.log(`[${setup}] section 5 at ${JSON.stringify(await state(page))}`);
  // scene 5 at rest, through the hooks (the entry, then scene 5)
  await goQ(page, 9.5, 600);
  await page.evaluate(() => window.__s4.enter());
  await page.waitForFunction(() => window.__s4.state().state === 'world', null, { timeout: 60_000 }).catch(() => console.warn(`[${setup}] the entry did not land`));
  await page.evaluate(() => window.__s4.scene(4)); await sleep(1200);
  await shot(page, `section-5-${w}-scene5`);
  // the fourth wipe at its half
  await goQ(page, 13.3, 1500);
  await shot(page, `section-5-${w}-cut`);
  console.log(`[${setup}] mid-cut ${JSON.stringify((await state(page)).s4)}`);
  // section 5 at rest: its top (the headline and the empty jar), at 0 degrees first (Sam's pair), then with the tilt
  const top = await page.evaluate(() => document.getElementById('signup').getBoundingClientRect().top + scrollY);
  await goY(page, top, 1500);
  await tilt(page, 0); await shot(page, `section-5-${w}-tilt0-rest`);
  await tilt(page, TILT); await shot(page, `section-5-${w}-rest`);
  await shot(page, `section-5-${w}`);
  console.log(`[${setup}] at rest ${JSON.stringify(await state(page))}`);
  // the Instagram press held by the stream's clock: the head in the mouth, the landing with the dimple and the first ring, mid-rise with the seam in the air; then settled
  await press(page, 'instagram'); await sleep(60);
  await scrub(page, 0.15); await shot(page, `section-5-${w}-pour-015`);
  console.log(`[${setup}] at 0.15 s ${JSON.stringify((await s5(page))?.pour)}`);
  await scrub(page, 0.55); await shot(page, `section-5-${w}-pour-055`);
  await scrub(page, 1.4); await shot(page, `section-5-${w}-pour-140`);
  await settle(page, setup); await shot(page, `section-5-${w}-poured`);
  console.log(`[${setup}] poured ${JSON.stringify((({ order, level, pour, layers, surface, tops, colours }) => ({ order, level, pour, layers, surface, tops, colours }))(await s5(page)))}`);
  // Facebook on the half-full jar, held at 1.0 s: the Azure band growing over the pink, the rings in its surface
  await press(page, 'facebook'); await sleep(60);
  await scrub(page, 1.0); await shot(page, `section-5-${w}-second`);
  await settle(page, setup);
  // the full jar after YouTube, with the tilt and at 0 degrees
  await press(page, 'youtube'); await settle(page, setup);
  await shot(page, `section-5-${w}-full`);
  console.log(`[${setup}] full ${JSON.stringify((({ order, level, layers, placed, slot }) => ({ order, level, layers, placed, slot }))(await s5(page)))}`);
  await tilt(page, 0); await shot(page, `section-5-${w}-tilt0-full`);
  await tilt(page, TILT);
  // the page 120 px further: the jar moved with its slot, the bands with the jar
  await goY(page, top + 120, 1200);
  await shot(page, `section-5-${w}-scroll`);
  // the form in view: the body's end
  const exitY = await page.evaluate(() => window.__s4.state().exitY);
  await goY(page, exitY, 1200);
  await shot(page, `section-5-${w}-form`);
  // the exit seam: the raw scroll across exitY, shot during the cover-in, then the first frame after the jump
  await goY(page, exitY + 6, 150);
  await shot(page, `section-5-${w}-exit`);
  await page.waitForFunction(() => scrollY === 0 && window.__s4.state().state === 'seam', null, { timeout: 5_000 }).catch(() => console.warn(`[${setup}] the exit did not jump`));
  await shot(page, `section-5-${w}-after-exit`);
  console.log(`[${setup}] after the exit ${JSON.stringify((await state(page)).s4)}`);
  await sleep(1200);
  // the wrap from the top: full cover, then at rest on section 5
  await page.evaluate(() => window.__s4.wrap());
  await page.waitForFunction(() => { const s = window.__s4.state().seam; return !!s && (s.phase === 'hold' || s.phase === 'out'); }, null, { timeout: 5_000 }).catch(() => console.warn(`[${setup}] the wrap did not reach full cover`));
  await shot(page, `section-5-${w}-wrap-cover`);
  await page.waitForFunction(() => window.__s4.state().state === 'world', null, { timeout: 6_000 }).catch(() => console.warn(`[${setup}] the wrap did not land`));
  await sleep(600);
  await shot(page, `section-5-${w}-wrap-rest`);
  console.log(`[${setup}] after the wrap ${JSON.stringify(await state(page))} scrollY ${await page.evaluate(() => scrollY)}`);
  await ctx.close();
  await poster(setup);
}
/** the poster tier (the gate's override opens section 5, locked otherwise): the empty jar's still, then a Facebook press
 *  (the jar-f still, the count line) */
async function poster(setup) {
  const w = SETUPS[setup].w;
  const p = await open(setup, '?tier=poster&room=open');
  await p.page.waitForFunction(() => document.documentElement.classList.contains('poster') || !document.documentElement.classList.contains('hero3d'), null, { timeout: 60_000 }).catch(() => {});
  await p.page.waitForFunction(() => !document.getElementById('signup')?.hidden, null, { timeout: 10_000 }).catch(() => console.warn(`[${setup}] section 5 stayed hidden on the poster tier`));
  await p.page.evaluate(() => { const el = document.getElementById('signup'); scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await sleep(1500);
  await shot(p.page, `section-5-${w}-poster`);
  await press(p.page, 'facebook');
  await p.page.waitForFunction(() => { const img = document.querySelector('#signup picture.su-still img'); return !img || (img.complete && /jar-f-/.test(img.currentSrc)); }, null, { timeout: 10_000 }).catch(() => console.warn(`[${setup}] the jar-f still did not load`));
  await sleep(600);
  await shot(p.page, `section-5-${w}-poster-f`);
  await p.ctx.close();
}
await browser.close();
console.log('done');
