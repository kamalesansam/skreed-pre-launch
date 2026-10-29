// Round 4 (docs/specs/family-page.md 22) and round 5 (section 23): "Back to main page" on the argument screen, the browser
// rows of round 4's criteria 1, 2, 4, 5 and 6 and round 5's criteria 1 to 3 (the landing's loader on the way back), 5
// (one row on phones) and 6 (the wide layout as built), which replace round 4's criterion 3. Runs on a
// PUBLIC_FAMILY_3D=on (or dev) test build served by wrangler dev, the 3D path forced past SwiftShader with
// ?render=force&tier=high (section 18, item 7); the landing's 3D rows need the hero's tier override (a test build). The
// clock is Playwright's: installed before the page loads, paused once the page is live, then run by hand, so 2,499 and
// 2,500 ms are exact. The Web Animations API runs on the document's own timeline, which the fake clock does not drive, so
// the fades are checked by their timing objects and then awaited through their finished promises (never a timed wait: a
// frame here can take 250 ms). The scroll event is the browser's own too, so toScreen waits for it. The landing's three
// ways in (criterion 1): the press, a direct load of /#families, and the browser's Back from a family page with the
// back-forward cache missed. Iteration 3 (criterion 4): the held load on the harness's fall path (the landing starts on
// hero3d and falls to the poster at about DOMContentLoaded), centred to the load event and left alone after the
// visitor's wheel, and Back to top's way home with a fall to the poster, kept at the top. Iteration 4: the poster tier
// proper (reduced motion), where the loader never ran and links.ts itself stops the browser's own scroll restoration.
// Frames (section 23, "Frames by script"):
// docs/specs/screenshots/family-r5-{360,390,844,1280}-arg-after.png (3.0 s after the argument comes on),
// family-r5-{390,1280}-return-loader.png (the landing about 3 s after the press, the wordmark filling and the count
// showing), family-r5-{390,1280}-return-gems.png (1 s after the loader has gone), and -390-landing-poster.png (after
// the cross-fade, the families centred).
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { PHONE, WIDE, watch, cspViolations, events } from './util.ts';

const SHOTS = new URL('../../../docs/specs/screenshots/', import.meta.url);
const shot = (name: string) => fileURLToPath(new URL(`family-r5-${name}.png`, SHOTS));
const ARG_ON = 5.6;                     // pose.ts SV.argOn, in screens
const DELAY = 2500, IN_MS = 400, OUT_MS = 200;   // timing.ts BACK_DELAY_MS, BACK_IN_MS, BACK_OUT_MS
const PEARL = 'rgb(247, 246, 243)';
const LAND = 14.5;                      // config/hero.ts S2T.LAND, section 2 at rest, in screens
const LOADER_END = 7.05, LOADER_MIN_LIFT_MS = 7500;   // loader.inline.js END; the lift no earlier than 7.5 s after the time origin (criterion 2)
/** --inset at a viewport width (tokens.css: clamp(16px, 3.5vw, 56px)). */
const inset = (w: number) => Math.min(56, Math.max(16, 0.035 * w));
/** The words' own box (the text node's client rect), for the baseline and the start of the words. */
const words = (p: Page, sel: string) => p.locator(sel).evaluate((el) => { const r = document.createRange(); for (const n of el.childNodes) if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) { r.selectNodeContents(n); break; } const b = r.getBoundingClientRect(); return { x: b.x, r: b.right, y: b.y, b: b.bottom }; });
const back = (p: Page) => p.locator('#famBack');
const url = (slug: string, q = '') => `/shades/${slug}/?render=force&tier=high${q}`;

/** The page on the 3D path, live: the loader lifted (html.loading gone, so the page scrolls) and the canvas on. */
async function open3d(page: Page, slug = 'blissful-blue', q = ''): Promise<void> {
  await page.goto(url(slug, q));
  const has = await page.evaluate(() => !!document.getElementById('fam-3d'));
  test.skip(!has, 'this build has no 3D island (PUBLIC_FAMILY_3D=off)');
  await expect(page.locator('html')).toHaveClass(/\bm3d\b/);
  await expect(page.locator('html')).not.toHaveClass(/\bloading\b/, { timeout: 90_000 });
  await page.waitForFunction(() => document.querySelector('#st3d canvas.on'), null, { timeout: 90_000 });
  await page.evaluate(() => document.fonts.ready);
}
/** Scrolls to the given screen (the page is seven screens of 100svh; the end is six screens) and waits for the page's own
 * scroll event, which the browser dispatches in its next rendering step, not on the fake clock: a one-shot listener added
 * before the scroll, after page.ts's own, so its onScroll has run when this returns. Returns at once when the position
 * cannot change (already there, or at the clamp). */
async function toScreen(page: Page, screens: number): Promise<void> {
  await page.evaluate((s) => new Promise<void>((done) => {
    const se = document.scrollingElement!, max = se.scrollHeight - se.clientHeight;
    const top = Math.min(max, s === Infinity ? max : Math.round(s * innerHeight));
    if (Math.abs(scrollY - top) < 1) { done(); return; }
    addEventListener('scroll', () => done(), { once: true });
    scrollTo({ top, behavior: 'instant' });
  }), screens);
}
const toEnd = (page: Page) => toScreen(page, Infinity);
/** Pauses the fake clock two seconds ahead of where it stands (it runs in real time until pauseAt lands, so the target must
 * still be ahead of it after the round trip, which a long task can hold up), so only runFor moves the control's timer,
 * which starts at the next toEnd; pauseAt fires each due timer at most once, so the margin costs no frames. */
async function hold(page: Page): Promise<void> {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 2000);
}
/** The control's running fades, awaited to their end (a cancelled one counts as ended). */
const settled = (p: Page) => back(p).evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished.then(() => undefined, () => undefined))));
const box = (p: Page, sel: string) => p.locator(sel).evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; });
const meets = (a: { x: number; y: number; r: number; b: number }, b: { x: number; y: number; r: number; b: number }) => a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
/** Events on the family page, kept across the navigation of the press (as entry.spec.ts records family_open). */
async function record(ctx: BrowserContext): Promise<{ event: string; props: Record<string, unknown> }[]> {
  const seen: { event: string; props: Record<string, unknown> }[] = [];
  await ctx.exposeBinding('__backRec', (_s, d) => { seen.push(d); });
  await ctx.addInitScript(() => {
    const w = window as unknown as { __backRec: (d: unknown) => void };
    addEventListener('skreed:track', (e) => w.__backRec((e as CustomEvent).detail));
    // the page's own listener runs first (it is on the element); this one, on window, reads what it left
    addEventListener('click', (e) => { if ((e.target as Element).closest?.('#famBack')) w.__backRec({ event: 'click', props: { defaultPrevented: e.defaultPrevented } }); });
  });
  return seen;
}

test.describe('22. the control and its words (acceptance 1)', () => {
  test('the built HTML: one a#famBack.fam-back.ring2.press to /#families, hidden, "Back to main page", after a#toTop; the accessible name is its text', async ({ request, browser }) => {
    for (const slug of ['blissful-blue', 'frosty-white', 'roaring-red']) {
      const html = await (await request.get(`/shades/${slug}/`)).text();
      const m = html.match(/<a class="fam-back ring2 press" id="famBack" href="\/#families" hidden>Back to main page<\/a>/g);
      expect(m, slug).toHaveLength(1);
      expect(html.indexOf('id="toTop"')).toBeLessThan(html.indexOf('id="famBack"'));
    }
    const ctx = await browser.newContext(WIDE);
    const page = await ctx.newPage();
    await open3d(page);
    expect(await page.evaluate(() => document.getElementById('toTop')!.compareDocumentPosition(document.getElementById('famBack')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
    await toEnd(page);
    await page.waitForTimeout(DELAY + IN_MS + 200);
    await expect(back(page)).toBeVisible();
    await expect(back(page)).toHaveAccessibleName('Back to main page');
    await expect(page.getByRole('link', { name: 'Back to main page' })).toHaveCount(1);
    await ctx.close();
  });

  for (const [label, opts] of [['390', PHONE], ['1280', WIDE]] as const) {
    test(`shown at ${label}: Open Sans 600 at 14 px, line height 1, Pearl Whisper, no underline, no fill, no border, no shadow, 44 px tall`, async ({ browser }) => {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      await open3d(page);
      await toEnd(page);
      await page.waitForTimeout(DELAY + IN_MS + 200);
      const cs = await back(page).evaluate((el) => { const c = getComputedStyle(el); return { font: c.fontFamily, weight: c.fontWeight, size: c.fontSize, lh: c.lineHeight, color: c.color, deco: c.textDecorationLine, bg: c.backgroundColor, border: c.borderStyle, shadow: c.boxShadow, h: el.getBoundingClientRect().height, pos: c.position, z: c.zIndex }; });
      expect(cs.font).toMatch(/Open Sans/);
      expect(cs.weight).toBe('600');
      expect(cs.size).toBe('14px');
      expect(cs.lh).toBe('14px');
      expect(cs.color).toBe(PEARL);
      expect(cs.deco).toBe('none');
      expect(cs.bg).toBe('rgba(0, 0, 0, 0)');
      expect(cs.border).toBe('none');
      expect(cs.shadow).toBe('none');
      expect(cs.h).toBe(44);
      expect(cs.pos).toBe('fixed');
      expect(cs.z).toBe('4');
      await ctx.close();
    });
  }
});

test.describe('22. when it shows (acceptance 2)', () => {
  for (const [label, opts] of [['390', PHONE], ['1280', WIDE]] as const) {
    test(`at ${label}: hidden and out of the tab order until 2.5 s, then shown and at opacity 1 by 2.9 s; up at 1.0 s and down at 2.0 s shows at 4.5 s; up after it showed fades 200 ms, then hidden`, async ({ browser }) => {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      await page.clock.install();
      await open3d(page);
      await hold(page);
      await toEnd(page);
      await expect(back(page)).toBeHidden();
      await page.locator('#toTop').focus();
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.id)).not.toBe('famBack');
      await page.clock.runFor(DELAY - 1);
      await expect(back(page)).toBeHidden();
      await expect(back(page)).toHaveAttribute('hidden', '');
      await page.clock.runFor(1);
      await expect(back(page)).not.toHaveAttribute('hidden', '');
      // hidden was dropped and the fade started in the same task: the first frames are not at full opacity
      const anim = await back(page).evaluate((el) => el.getAnimations().map((a) => { const t = a.effect!.getTiming(); return { duration: t.duration, easing: t.easing }; }));
      expect(anim).toEqual([{ duration: IN_MS, easing: 'cubic-bezier(0.2, 0, 0, 1)' }]);
      await settled(page);   // the fade's own end, on the document's timeline
      expect(await back(page).evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
      expect(await back(page).evaluate((el) => el.getAnimations().length)).toBe(0);
      await expect(back(page)).toBeVisible();

      // up after it showed: the exit, then hidden; up before 2.5 s cancels the timer; the next arrival waits 2.5 s again
      await toScreen(page, 5.5);
      await settled(page);
      await expect(back(page)).toBeHidden();
      await toEnd(page);
      await page.clock.runFor(1000);
      await toScreen(page, 5.5);
      await page.clock.runFor(1000);
      await toEnd(page);
      await page.clock.runFor(DELAY - 1);
      await expect(back(page)).toBeHidden();
      await page.clock.runFor(1);
      await expect(back(page)).not.toHaveAttribute('hidden', '');
      await settled(page);
      expect(await back(page).evaluate((el) => getComputedStyle(el).opacity)).toBe('1');

      // up after it showed: the 200 ms exit on --ease-in, then hidden (its onfinish sets hidden and cancels the fade). The
      // exit is read in the scroll event itself, after page.ts's listener started it, so a slow frame cannot outlive it
      const out = await page.evaluate((s) => new Promise<{ hidden: boolean; anims: { duration: unknown; easing: string | undefined; fill: string }[] }>((done) => {
        const el = document.getElementById('famBack')!;
        addEventListener('scroll', () => done({ hidden: el.hasAttribute('hidden'), anims: el.getAnimations().map((a) => { const t = a.effect!.getTiming(); return { duration: t.duration, easing: t.easing, fill: t.fill! }; }) }), { once: true });
        scrollTo({ top: Math.round(s * innerHeight), behavior: 'instant' });
      }), 5.5);
      expect(out.hidden).toBe(false);
      expect(out.anims).toEqual([{ duration: OUT_MS, easing: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)', fill: 'forwards' }]);   // --ease-in, as the browser serialises back.ts's 'cubic-bezier(.55, .085, .68, .53)'
      await settled(page);
      await expect(back(page)).toHaveAttribute('hidden', '');
      await expect(back(page)).toBeHidden();
      expect(await back(page).evaluate((el) => el.getAnimations().length)).toBe(0);
      await ctx.close();
    });

    // The 2.4 s and 3.0 s reads are the page's own times, not the runner's waits (a round trip here can outlast 100 ms):
    // the time origin is the start of the scroll event that turns the argument on, taken by a listener installed before
    // the page's scripts (so it runs before page.ts's, which starts the 2.5 s); a MutationObserver takes the moment
    // hidden is dropped, and a sampler records every frame's hidden from the arrival on.
    test(`frames at ${label}: the argument screen 2.4 s after it comes on (no control) and at 3.0 s (the control in, family-r5-${label}-arg-after)`, async ({ browser }) => {
      type Arg = { __scrollT: number; __shownAt: number | null; __frames: { t: number; hidden: boolean }[]; __stop: boolean };
      const ctx = await browser.newContext(opts);
      await ctx.addInitScript(() => { addEventListener('scroll', () => { (window as unknown as Arg).__scrollT = performance.now(); }, { passive: true }); });
      const page = await ctx.newPage();
      await open3d(page);
      await page.evaluate(() => {
        const w = window as unknown as Arg, el = document.getElementById('famBack')!;
        w.__shownAt = null; w.__frames = []; w.__stop = false;
        new MutationObserver(() => { if (!el.hidden && w.__shownAt === null) w.__shownAt = performance.now(); }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
        const tick = () => { w.__frames.push({ t: performance.now(), hidden: el.hidden }); if (!w.__stop) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      });
      // to the end: the argument comes on in this scroll event; read after page.ts's listener has run
      const on = await page.evaluate(() => new Promise<{ t0: number; arg: boolean; hidden: boolean }>((done) => {
        const se = document.scrollingElement!, w = window as unknown as Arg;
        addEventListener('scroll', () => done({ t0: w.__scrollT, arg: document.documentElement.classList.contains('arg-on'), hidden: document.getElementById('famBack')!.hidden }), { once: true });
        scrollTo({ top: se.scrollHeight - se.clientHeight, behavior: 'instant' });
      }));
      expect(typeof on.t0, 'the time origin').toBe('number');
      expect(on.arg, 'the argument came on in that scroll event').toBe(true);
      expect(on.hidden).toBe(true);
      // the frame once the page's clock reads 3.0 s and the arrival's fade has ended
      await page.waitForFunction((t0) => performance.now() - t0 >= 3000, on.t0, { timeout: 30_000 });
      await settled(page);
      await page.screenshot({ path: shot(`${label}-arg-after`) });
      const r = await page.evaluate((t0) => { const w = window as unknown as Arg; w.__stop = true; return { shown: w.__shownAt === null ? null : w.__shownAt - t0, frames: w.__frames.filter((f) => f.t >= t0).map((f) => ({ t: f.t - t0, hidden: f.hidden })) }; }, on.t0);
      await expect(back(page)).toBeVisible();
      // 2.4 s: no control. hidden is dropped no earlier than 2.5 s after the arrival, and no frame before 2.4 s shows it
      expect(r.shown, 'hidden dropped').not.toBeNull();
      expect(r.shown!).toBeGreaterThanOrEqual(DELAY);
      const early = r.frames.filter((f) => f.t < 2400);
      expect(early.length).toBeGreaterThan(0);
      for (const f of early) expect(f.hidden, `the frame at ${f.t.toFixed(0)} ms`).toBe(true);
      // 3.0 s: the control in. hidden is dropped by 3.0 s, and the first frame at or after 3.0 s shows it
      expect(r.shown!).toBeLessThanOrEqual(3000);
      const at3 = r.frames.find((f) => f.t >= 3000);
      expect(at3, 'a frame at or after 3.0 s').toBeTruthy();
      expect(at3!.hidden).toBe(false);
      console.log(`frames ${label}: hidden dropped at ${r.shown!.toFixed(1)} ms after the argument came on; last frame before 2.4 s at ${early[early.length - 1].t.toFixed(0)} ms, first at or after 3.0 s at ${at3!.t.toFixed(0)} ms (${r.frames.length} frames)`);   // for the review log
      await ctx.close();
    });
  }
});

test.describe('23. one row on phones (criterion 5)', () => {
  // the phone layout: below 900 px wide or 600 px tall. The harness has no safe area, so the row is 14 px above the bottom
  const SIZES: [number, number][] = [[360, 780], [375, 667], [390, 844], [430, 932], [768, 1024], [780, 360], [844, 390]];
  for (const [w, h] of SIZES) {
    test(`${w}x${h}: on Back to top's row and baseline, 44 px tall, 14 px above the bottom; the words at --inset, the chevron at the width less --inset; 48 px or more apart; clear of Back to top, "All families" and the letters' box; no horizontal scroll`, async ({ browser }) => {
      const ctx = await browser.newContext({ ...PHONE, viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await open3d(page);
      await toEnd(page);
      await page.waitForTimeout(DELAY + IN_MS + 200);
      await expect(back(page)).toBeVisible();
      const b = await box(page, '#famBack'), t = await box(page, '#toTop');
      const i = inset(w);
      // one row: the same top and bottom within 0.5 px, both 44 px tall, 14 px above the layout viewport's bottom
      expect(Math.abs(b.y - t.y)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(b.b - t.b)).toBeLessThanOrEqual(0.5);
      expect(b.h).toBe(44); expect(t.h).toBe(44);
      const vh = await page.evaluate(() => document.documentElement.clientHeight);
      expect(Math.abs(vh - 14 - b.b)).toBeLessThanOrEqual(0.5);
      // the words start at --inset, where the wordmark does; Back to top's chevron ends at the width less --inset, where "All families" does
      const bw = await words(page, '#famBack'), tw = await words(page, '#toTop');
      expect(Math.abs(bw.x - i)).toBeLessThanOrEqual(1);
      const chevron = await box(page, '#toTop svg');
      expect(Math.abs(w - i - chevron.r)).toBeLessThanOrEqual(1);
      // one baseline: the same face, size and line height, centred in the same row, so the two text boxes share a bottom within 0.5 px
      expect(Math.abs(bw.b - tw.b)).toBeLessThanOrEqual(0.5);
      // the two hit boxes 48 px or more apart (77.7 px at 360 x 780, the least), and nothing met
      expect(t.x - b.r).toBeGreaterThanOrEqual(48);
      for (const sel of ['#toTop', '#famBtn', '#arg-box']) expect(meets(b, await box(page, sel)), `meets ${sel}`).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      // the plan's figures at 390 x 844 (section 23), each within 2 px (the words' widths are the browser's, with kerning)
      if (w === 390 && h === 844) {
        expect(b.y).toBe(786); expect(b.b).toBe(830);
        expect(Math.abs(b.x - 4)).toBeLessThanOrEqual(2); expect(Math.abs(b.r - 152.3)).toBeLessThanOrEqual(2);
        expect(Math.abs(t.x - 260)).toBeLessThanOrEqual(2); expect(t.r).toBe(386);
      }
      if (w === 360 || w === 844) await page.screenshot({ path: shot(`${w}-arg-after`) });
      await ctx.close();
    });
  }
});

test.describe('23. the wide layout as built (criterion 6)', () => {
  const SIZES: [number, number][] = [[900, 600], [1024, 768], [1280, 800], [1366, 768]];
  for (const [w, h] of SIZES) {
    test(`${w}x${h}: centred on the layout viewport, its bottom one --inset above the bottom edge; Back to top top right under "All families"; clear of both and the letters' box; no horizontal scroll`, async ({ browser }) => {
      const ctx = await browser.newContext({ ...WIDE, viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await open3d(page);
      await toEnd(page);
      await page.waitForTimeout(DELAY + IN_MS + 200);
      await expect(back(page)).toBeVisible();
      const b = await box(page, '#famBack'), t = await box(page, '#toTop'), a = await box(page, '#famBtn');
      const { centre, vh, vw } = await page.evaluate(() => ({ centre: document.documentElement.clientWidth / 2, vh: document.documentElement.clientHeight, vw: document.documentElement.clientWidth }));   // the layout viewport: beside a classic scrollbar it is not the window
      expect(Math.abs(b.x + b.w / 2 - centre)).toBeLessThanOrEqual(1);
      expect(b.h).toBe(44);
      expect(Math.abs(vh - inset(vw) - b.b)).toBeLessThanOrEqual(0.5);
      if (w === 1280 && h === 800) { expect(b.y).toBeCloseTo(711.2, 0); expect(b.b).toBeCloseTo(755.2, 0); expect(t.y).toBeCloseTo(91.3, 0); expect(t.b).toBeCloseTo(135.3, 0); }
      expect(t.y).toBeGreaterThanOrEqual(a.b - 0.5);   // Back to top under "All families"
      expect(t.y).toBeLessThan(vh / 2);                // at the top, not on the control's row
      for (const sel of ['#toTop', '#famBtn', '#arg-box']) expect(meets(b, await box(page, sel)), `meets ${sel}`).toBe(false);
      expect(b.x).toBeGreaterThanOrEqual(16);
      expect(w - b.r).toBeGreaterThanOrEqual(16);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await ctx.close();
    });
  }
});

test.describe('22. where it is not (acceptance 4)', () => {
  const conn = (c: Record<string, unknown>) => (ctx: BrowserContext) => ctx.addInitScript((v) => Object.defineProperty(navigator, 'connection', { value: v, configurable: true }), c);
  const ROWS: { row: string; q?: string; setup?: (ctx: BrowserContext) => Promise<void>; opts?: Record<string, unknown> }[] = [
    { row: 'data-saver', setup: conn({ saveData: true, effectiveType: '4g' }) },
    { row: '2g', setup: conn({ saveData: false, effectiveType: '2g' }) },
    { row: 'device-memory-2', setup: (ctx) => ctx.addInitScript(() => Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true })) },
    { row: 'reduced-motion', opts: { reducedMotion: 'reduce' } },
    { row: 'no-webgl2', setup: (ctx) => ctx.addInitScript(() => { delete (window as unknown as Record<string, unknown>).WebGL2RenderingContext; }) },
    { row: 'mode-grid', q: '?mode=grid' },
    { row: 'javascript-off', opts: { javaScriptEnabled: false } },
  ];
  for (const r of ROWS) {
    test(`${r.row}: #famBack keeps hidden and display none, is never focusable and is absent from the accessibility tree, 5 s after load at the page's end`, async ({ browser }) => {
      const ctx = await browser.newContext({ ...PHONE, ...(r.opts ?? {}) });
      if (r.setup) await r.setup(ctx);
      const page = await ctx.newPage();
      await page.goto(`/shades/basic-brown/${r.q ?? ''}`);
      await expect(back(page)).toHaveCount(1);
      await page.keyboard.press('End');
      await page.mouse.wheel(0, 20_000);
      await page.waitForTimeout(5000);
      await expect(back(page)).toHaveAttribute('hidden', '');
      await expect(back(page)).toBeHidden();
      expect(await back(page).evaluate((el) => getComputedStyle(el).display)).toBe('none');
      await expect(page.getByRole('link', { name: 'Back to main page' })).toHaveCount(0);
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => document.activeElement?.id)).not.toBe('famBack');
      }
      await ctx.close();
    });
  }

  test('a 3D page sent to swatch grid mode (fam:grid) while the control shows hides it at once', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
    const page = await ctx.newPage();
    await open3d(page);
    await toEnd(page);
    await page.waitForTimeout(DELAY + IN_MS + 200);
    await expect(back(page)).toBeVisible();
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('fam:grid', { detail: { reason: 'test', message: '' } })));
    await expect(page.locator('html')).toHaveClass(/\bgrid\b/);
    await expect(back(page)).toHaveAttribute('hidden', '');
    expect(await back(page).evaluate((el) => el.getAnimations().length)).toBe(0);
    await ctx.close();
  });
});

test.describe('22. the press (acceptance 5)', () => {
  test.describe.configure({ timeout: 300_000 });

  test('a plain click goes to /#families with exactly one family_back {from: argument} and no family_open; defaultPrevented is false; a modified click opens a new tab and leaves the page as it was', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
    const seen = await record(ctx);
    const page = await ctx.newPage();
    await open3d(page);
    await toEnd(page);
    await page.waitForTimeout(DELAY + IN_MS + 200);
    // the modified click first: the page stays
    const [tab] = await Promise.all([ctx.waitForEvent('page'), back(page).click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] })]);
    await tab.waitForLoadState();
    expect(new URL(tab.url()).pathname + new URL(tab.url()).hash).toBe('/#families');
    expect(new URL(page.url()).pathname).toBe('/shades/blissful-blue/');
    await expect(back(page)).toBeVisible();
    await tab.close();
    expect(seen.filter((e) => e.event === 'family_back')).toHaveLength(1);   // the modified click is a press too: it leaves for the landing in a new tab
    // the plain click
    await back(page).click();
    await page.waitForURL(/\/#families$/);
    expect(seen.filter((e) => e.event === 'family_back')).toHaveLength(2);
    for (const e of seen.filter((x) => x.event === 'family_back')) expect(e.props).toEqual({ from: 'argument' });
    expect(seen.filter((e) => e.event === 'family_open')).toHaveLength(0);
    expect(seen.filter((e) => e.event === 'click').map((e) => e.props.defaultPrevented)).toEqual([false, false]);
    await ctx.close();
  });

  test('hover lifts it 1 px and a press scales it to 0.98, with no opacity change', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
    const page = await ctx.newPage();
    await open3d(page);
    await toEnd(page);
    await expect(back(page)).not.toHaveAttribute('hidden', '', { timeout: DELAY + 15_000 });   // the arrival, 2.5 s after the argument comes on
    await settled(page);   // and its fade's end: this row is about hover and press, not timing
    const read = () => back(page).evaluate((el) => { const c = getComputedStyle(el); return { t: c.transform, o: c.opacity }; });
    expect(await read()).toEqual({ t: 'none', o: '1' });
    // the 150 ms transitions (--dur-press) start at the browser's next frame, 140 to 250 ms away here: polled to their end values
    await back(page).hover();
    await expect.poll(read, { timeout: 5000 }).toEqual({ t: 'matrix(1, 0, 0, 1, 0, -1)', o: '1' });
    await page.mouse.down();
    await expect.poll(read, { timeout: 5000 }).toEqual({ t: 'matrix(0.98, 0, 0, 0.98, 0, 0)', o: '1' });
    await page.mouse.move(5, 5);   // released off the link: no click, no navigation
    await page.mouse.up();
    expect(new URL(page.url()).pathname).toBe('/shades/blissful-blue/');
    await ctx.close();
  });

  // the landing's cross-document view transition, caught at pagereveal before any page script: resolves once the transition
  // the browser reports has finished (or was skipped, or there was none); the cross-fade is painted for a few hundred ms
  // after that, and document.activeViewTransition is still set, so the row waits for it to clear and then 1 s more before
  // the frame (iteration 4: the frames of iterations 1 and 3 were taken mid cross-fade, the family page showing through)
  type VT = { __vt?: Promise<string> };
  const catchReveal = (ctx: BrowserContext) => ctx.addInitScript(() => {
    if (location.pathname !== '/') return;
    (window as unknown as VT).__vt = new Promise<string>((done) => {
      addEventListener('pagereveal', (e) => { const v = (e as Event & { viewTransition?: { finished: Promise<void> } }).viewTransition; if (v) v.finished.then(() => done('finished'), () => done('skipped')); else done('none'); });
    });
  });
  const activeVT = () => (document as unknown as { activeViewTransition?: unknown }).activeViewTransition ?? null;

  test('the landing, the harness\'s fall path (the landing starts on hero3d and falls to the poster at about DOMContentLoaded, the loader having set manual restoration): no loader left, and nav#families centred on the layout viewport once the cross-fade has ended on screen (criterion 4)', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    await catchReveal(ctx);
    const page = await ctx.newPage();
    await open3d(page);
    await toEnd(page);
    await page.waitForTimeout(DELAY + IN_MS + 200);
    await back(page).click();
    await page.waitForURL(/\/#families$/);
    await expect(page.locator('html')).toHaveClass(/\bposter\b/);
    await expect(page.locator('#intro')).toBeHidden();
    // the root cross-fade into the landing: the transition pagereveal reported, awaited to its end; then the load event, after
    // which the browser makes no scroll of its own to the fragment, and no active view transition left on the document; then
    // 1 s more, since the cross-fade stays painted for a few hundred ms after the transition has resolved
    const vt = await page.evaluate(() => (window as unknown as VT).__vt);
    console.log(`landing poster 390: the view transition ${vt}`);   // for the review log
    await page.waitForFunction(() => document.readyState === 'complete');
    await page.waitForFunction(() => (document as unknown as { activeViewTransition?: unknown }).activeViewTransition == null);
    await page.waitForTimeout(1000);
    expect(await page.evaluate(activeVT)).toBeNull();
    await expect(page.locator('nav#families')).toBeInViewport();
    const c = await page.evaluate(() => { const r = document.getElementById('families')!.getBoundingClientRect(); const se = document.scrollingElement!; return { centre: r.y + r.height / 2, vh: document.documentElement.clientHeight, y: scrollY, max: se.scrollHeight - se.clientHeight }; });
    await page.screenshot({ path: shot('390-landing-poster') });   // the frame first, so it records the page as found either way
    console.log(`landing poster 390: nav#families centre at ${c.centre.toFixed(1)} of ${c.vh} (scrollY ${c.y}, max ${c.max})`);   // for the review log
    const atClamp = Math.abs(c.y - c.max) <= 1;   // a nav that cannot be centred because the page ends first
    expect(atClamp || Math.abs(c.centre - c.vh / 2) <= 4, `nav#families centre at ${c.centre.toFixed(1)} of ${c.vh} (scrollY ${c.y}, max ${c.max})`).toBe(true);
    await ctx.close();
  });

  // Iteration 3 (section 23, criterion 4; the round 5 review of iteration 2, items 1 and 2): links.ts holds the families
  // centred from its module to the load event against the browser's own scroll to the fragment, stops for good at the
  // visitor's first input, and never centres on Back to top's way home. A sampler installed before the landing's scripts
  // records every frame's scrollY and the nav's centre, with the times of DOMContentLoaded, the load event and every
  // change of the root's class, so the rows read the page's own clock, not the runner's waits.
  type Held = { __held: { t: number; y: number; c: number | null }[]; __heldEv: { t: number; ev: string; y: number }[]; __heldRs0: string };
  const heldSampler = (ctx: BrowserContext) => ctx.addInitScript(() => {
    if (location.pathname !== '/') return;
    const w = window as unknown as Held;
    w.__held = []; w.__heldEv = []; w.__heldRs0 = history.scrollRestoration;   // the entry's restoration mode before any page script
    const mark = (ev: string) => w.__heldEv.push({ t: performance.now(), ev, y: scrollY });
    addEventListener('DOMContentLoaded', () => mark('dcl'));
    addEventListener('load', () => mark('load'));
    addEventListener('pageshow', (e) => mark(`pageshow ${(e as PageTransitionEvent).persisted}`));
    new MutationObserver((ms) => { if (ms.some((m) => m.target === document.documentElement && m.attributeName === 'class')) mark(`class ${document.documentElement.className}`); }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
    const tick = () => { const r = document.getElementById('families')?.getBoundingClientRect(); w.__held.push({ t: performance.now(), y: scrollY, c: r ? r.y + r.height / 2 : null }); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  const heldRead = (p: Page) => p.evaluate(() => { const r = document.getElementById('families')!.getBoundingClientRect(); const w = window as unknown as Held; return { t: performance.now(), y: scrollY, centre: r.y + r.height / 2, vh: document.documentElement.clientHeight, rs: document.readyState, html: document.documentElement.className, dcl: w.__heldEv.find((e) => e.ev === 'dcl')?.t ?? null, load: w.__heldEv.find((e) => e.ev === 'load')?.t ?? null, sr0: w.__heldRs0, sr: history.scrollRestoration }; });
  const heldDump = (p: Page) => p.evaluate(() => { const w = window as unknown as Held; return { s: w.__held, ev: w.__heldEv }; });
  /** The landing's images and fonts held back, so the load event comes that much after DOMContentLoaded. Routing also turns the HTTP cache off, so the fonts are fetched again. */
  const holdLoad = (page: Page, ms: number) => page.route(/\.(avif|webp|jpe?g|png|woff2)(\?|$)/, async (route) => { await new Promise((r) => setTimeout(r, ms)); await route.continue(); });
  /** The landing served Cache-Control: no-store, so the next load of / is a fresh one, never a restore from the back-forward cache. */
  const noStore = (page: Page) => page.route((u) => u.pathname === '/', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const r = await route.fetch();
    await route.fulfill({ response: r, headers: { ...r.headers(), 'cache-control': 'no-store' } });
  });
  const HOLD_MS = 4000;

  test('the landing on the harness\'s fall path (hero3d, then the poster at about DOMContentLoaded), a direct load of /#families with the images and fonts held 4 s (criterion 4, iteration 3): nav#families centred on the layout viewport 1 s and 3 s after DOMContentLoaded, while the load still runs, and 1 s after the load event; no frame off centre from 100 ms after DOMContentLoaded to the load event', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    await heldSampler(ctx);
    const page = await ctx.newPage();
    await holdLoad(page, HOLD_MS);
    await page.goto('/#families', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveClass(/\bposter\b/);
    const since = (ms: number) => page.waitForFunction((n) => { const d = (window as unknown as Held).__heldEv.find((e) => e.ev === 'dcl'); return !!d && performance.now() - d.t >= n; }, ms, { timeout: 30_000 });
    await since(1000);
    const at1 = await heldRead(page);
    await since(3000);
    const at3 = await heldRead(page);
    await page.waitForLoadState('load');
    await page.waitForFunction(() => { const l = (window as unknown as Held).__heldEv.find((e) => e.ev === 'load'); return !!l && performance.now() - l.t >= 1000; }, null, { timeout: 30_000 });
    const after = await heldRead(page);
    const d = await heldDump(page);
    console.log(`held load 390: at 1 s centre ${at1.centre.toFixed(1)} (scrollY ${at1.y}, ${at1.rs}), at 3 s ${at3.centre.toFixed(1)} (${at3.y}, ${at3.rs}), 1 s after load ${after.centre.toFixed(1)} (${after.y}); DOMContentLoaded at ${at1.dcl!.toFixed(0)} ms, load at ${after.load!.toFixed(0)} ms; ${d.s.length} frames`);   // for the review log
    // the hold held: the load event came after both early reads, and about 4 s after DOMContentLoaded
    expect(at1.rs).toBe('interactive');
    expect(at3.rs).toBe('interactive');
    expect(after.load! - at1.dcl!).toBeGreaterThanOrEqual(HOLD_MS - 500);
    // centred at the three reads, and the page as a whole never left that place between the two events (the fragment's own
    // scroll, made when the parser ends, is re-centred in the same rendering step; the frames here never see it)
    for (const r of [at1, at3, after]) expect(Math.abs(r.centre - r.vh / 2), `centre ${r.centre.toFixed(1)} of ${r.vh} at ${r.t.toFixed(0)} ms`).toBeLessThanOrEqual(4);
    const between = d.s.filter((f) => f.t >= at1.dcl! + 100 && f.t <= after.load! && f.c !== null);
    expect(between.length).toBeGreaterThan(100);
    const off = between.filter((f) => Math.abs(f.c! - at1.vh / 2) > 4);
    expect(off, `frames off centre between DOMContentLoaded and load: ${JSON.stringify(off.slice(0, 5))}`).toEqual([]);
    expect(after.html).not.toMatch(/\bhero3d\b/);
    await ctx.close();
  });

  test('the same held load on the fall path with a 600 px wheel 1 s after DOMContentLoaded (criterion 4, iteration 3): the page moves with the wheel and stands where the visitor put it through the load event and 1 s after; links.ts never moves it again', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    await heldSampler(ctx);
    const page = await ctx.newPage();
    await holdLoad(page, HOLD_MS);
    await page.goto('/#families', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveClass(/\bposter\b/);
    await page.waitForFunction(() => { const d = (window as unknown as Held).__heldEv.find((e) => e.ev === 'dcl'); return !!d && performance.now() - d.t >= 1000; }, null, { timeout: 30_000 });
    const at1 = await heldRead(page);
    expect(at1.rs).toBe('interactive');
    expect(Math.abs(at1.centre - at1.vh / 2)).toBeLessThanOrEqual(4);
    // the visitor's wheel: six turns of 100 px (the page ends 564 px below the centred place, so the last turns clamp)
    await page.mouse.move(195, 600);
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(60); }
    await page.waitForTimeout(300);
    const moved = await heldRead(page);
    expect(moved.rs, 'the load still held when the visitor scrolled').toBe('interactive');
    expect(moved.y - at1.y).toBeGreaterThanOrEqual(400);
    await page.waitForLoadState('load');
    await page.waitForFunction(() => { const l = (window as unknown as Held).__heldEv.find((e) => e.ev === 'load'); return !!l && performance.now() - l.t >= 1000; }, null, { timeout: 30_000 });
    const after = await heldRead(page);
    const d = await heldDump(page);
    console.log(`held load 390 with a wheel: centred at ${at1.y} at 1 s, the wheel took the page to ${moved.y} by ${moved.t.toFixed(0)} ms, ${after.y} 1 s after the load event (at ${after.load!.toFixed(0)} ms)`);   // for the review log
    expect(after.y).toBe(moved.y);
    // and no frame between the wheel's settling and the end read saw any other place: nothing moved the page after the visitor
    const still = d.s.filter((f) => f.t >= moved.t && f.t <= after.t);
    expect(still.length).toBeGreaterThan(100);
    expect(still.filter((f) => f.y !== moved.y).map((f) => `${f.t.toFixed(0)} ms y=${f.y}`)).toEqual([]);
    expect(after.html).not.toMatch(/\bhero3d\b/);
    await ctx.close();
  });

  test('Back to top\'s way home on the 3D path with the cache missed and a hard fall to the poster before the load event (criterion 4, iteration 3): the page keeps the top, scrollY 0 at the load event and 1 s after (links.ts reads the flag and never centres); without the fall, the top with the loader up', async ({ browser }) => {
    test.setTimeout(600_000);
    for (const fall of [true, false]) {
      const ctx = await browser.newContext(WIDE);
      await pin(ctx);
      await heldSampler(ctx);
      const page = await ctx.newPage();
      await page.goto('/', { waitUntil: 'load' });
      await open3d(page);
      await page.waitForTimeout(500);
      await noStore(page);
      if (fall) {
        // the fonts held 6 s so the load event comes late, and the hero chunk refused so the Gate's module-error path falls to the poster first
        await page.route(/\.woff2(\?|$)/, async (route) => { await new Promise((r) => setTimeout(r, 6000)); await route.continue(); });
        await page.route(/\/_astro\/hero\.[\w-]+\.js$/, (route) => route.abort());
      }
      await page.locator('#toTop').click();
      await page.waitForURL((u) => u.pathname === '/');
      await page.waitForLoadState('load', { timeout: 60_000 });
      const nav = await page.evaluate(() => ({ type: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type, hash: location.hash, path: location.pathname, flag: (() => { try { return sessionStorage.getItem('skreed:to-top'); } catch { return 'unreadable'; } })() }));
      expect(nav).toEqual({ type: 'back_forward', hash: '', path: '/', flag: null });   // a fresh load of the landing entry, its hash dropped by the loader, the flag cleared by BackToTop's module after links.ts read it
      await page.waitForFunction(() => { const l = (window as unknown as Held).__heldEv.find((e) => e.ev === 'load'); return !!l && performance.now() - l.t >= 1000; }, null, { timeout: 30_000 });
      const after = await heldRead(page);
      const d = await heldDump(page);
      const load = d.ev.find((e) => e.ev === 'load')!;
      const toPoster = d.ev.find((e) => e.ev.startsWith('class') && /\bposter\b/.test(e.ev));
      const movedFrames = d.s.filter((f) => f.y !== 0).map((f) => `${f.t.toFixed(0)} ms y=${f.y}`);
      console.log(`Back to top's way home 1280, ${fall ? 'a fall before load' : 'no fall'}: ${toPoster ? `the poster at ${toPoster.t.toFixed(0)} ms, ` : ''}load at ${load.t.toFixed(0)} ms (scrollY ${load.y}), 1 s after it scrollY ${after.y}, html "${after.html}", ${d.s.length} frames, ${movedFrames.length} off the top`);   // for the review log
      expect(load.y).toBe(0);
      expect(after.y).toBe(0);
      expect(movedFrames).toEqual([]);
      if (fall) {
        expect(toPoster, 'the fall to the poster').toBeTruthy();
        expect(toPoster!.t).toBeLessThan(load.t);
        expect(after.html).toMatch(/\bposter\b/);
        expect(after.html).not.toMatch(/\bhero3d\b/);
      } else {
        expect(after.html).toMatch(/\bhero3d\b/);
      }
      await ctx.close();
    }
  });

  test('the poster tier proper (reduced motion), the browser\'s Back from a family page with the cache missed (criterion 4, iteration 4): the landing left 300 px below the centred families, the entry\'s restoration auto before the module; after the Back, links.ts has set it manual and the families end centred 1 s after the load event, no frame after the load event elsewhere; with the images and fonts held 3 s and without', async ({ browser }) => {
    test.setTimeout(600_000);
    for (const held of [false, true]) {
      const ctx = await browser.newContext({ ...PHONE, reducedMotion: 'reduce' });
      await heldSampler(ctx);
      const page = await ctx.newPage();
      await page.goto('/', { waitUntil: 'load' });
      const first = await page.evaluate(() => (window as unknown as Held).__heldEv.filter((e) => e.ev.startsWith('class')).map((e) => e.ev));
      expect(first[0], 'the poster tier from the first class stamp').toMatch(/\bposter\b/);
      expect(first.join(' ')).not.toMatch(/\bhero3d\b/);
      // the families brought into view, then the page left 300 px lower (the nav still in view, so the click scrolls nothing)
      const left = await page.evaluate(() => new Promise<number>((done) => {
        document.getElementById('families')!.scrollIntoView({ block: 'center', behavior: 'instant' });
        addEventListener('scroll', () => done(scrollY), { once: true });
        scrollBy({ top: 300, behavior: 'instant' });
      }));
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => scrollY)).toBe(left);
      // a family page by its link (its href carries the family's first shade; followRock leaves /#families behind), then Back
      // with the landing served no-store
      await page.locator('nav#families a[href^="/shades/blissful-blue/"]').click();
      await page.waitForURL(/\/shades\/blissful-blue\//);
      await page.waitForLoadState('load');
      await noStore(page);
      if (held) await holdLoad(page, 3000);
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 60_000 });
      await page.waitForFunction(() => { const l = (window as unknown as Held).__heldEv.find((e) => e.ev === 'load'); return !!l && performance.now() - l.t >= 1000; }, null, { timeout: 30_000 });
      const after = await heldRead(page);
      const d = await heldDump(page);
      const nav = await page.evaluate(() => ({ type: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type, hash: location.hash, path: location.pathname }));
      const load = d.ev.find((e) => e.ev === 'load')!;
      const classes = d.ev.filter((e) => e.ev.startsWith('class')).map((e) => e.ev);
      const afterLoad = d.s.filter((f) => f.t > load.t && f.c !== null);
      const off = afterLoad.filter((f) => Math.abs(f.c! - after.vh / 2) > 4).map((f) => `${f.t.toFixed(0)} ms y=${f.y} c=${f.c!.toFixed(1)}`);
      console.log(`poster tier Back 390, ${held ? 'the images and fonts held 3 s' : 'nothing held'}: left at ${left}, restoration ${after.sr0} before the module and ${after.sr} after; DOMContentLoaded at ${after.dcl!.toFixed(0)} ms, load at ${load.t.toFixed(0)} ms (scrollY ${load.y}); 1 s after it centre ${after.centre.toFixed(1)} of ${after.vh} (scrollY ${after.y}); ${d.s.length} frames, ${afterLoad.length} after the load event, ${off.length} off centre; classes ${classes.join(' | ')}`);   // for the review log
      expect(nav).toEqual({ type: 'back_forward', hash: '#families', path: '/' });
      expect(d.ev.some((e) => e.ev === 'pageshow false'), 'not restored from the back-forward cache').toBe(true);
      expect(classes[0]).toMatch(/\bposter\b/);
      expect(classes.join(' ')).not.toMatch(/\bhero3d\b/);
      expect(after.sr0, 'the entry kept the browser\'s own restoration: the loader never ran on this tier').toBe('auto');
      expect(after.sr, 'links.ts set it manual').toBe('manual');
      if (held) expect(load.t - after.dcl!).toBeGreaterThanOrEqual(2500);
      expect(Math.abs(after.centre - after.vh / 2), `centre ${after.centre.toFixed(1)} of ${after.vh}`).toBeLessThanOrEqual(4);
      expect(Math.abs(after.y - left), 'the end place is not the restored one').toBeGreaterThanOrEqual(250);
      expect(afterLoad.length).toBeGreaterThan(30);
      expect(off, 'frames after the load event off centre').toEqual([]);
      await ctx.close();
    }
  });

  // Round 5 (section 23, criteria 1 to 3): the landing's 0 to 100 wordmark loader runs on the way back as on a first visit,
  // its exit held until section 2 is at rest, and lifts onto the gems at 14.5 screens. A sampler installed before the
  // landing's scripts records, every frame from the loader's first frame to its removal, the loader's state, the fill's own
  // time (the #ldFill animation, read live in the same frame, against the frame's timestamp: the clock the fill runs on; the
  // loader's own tl is one frame behind the sampler, and performance.now() runs on while the frames the browser flushes
  // after a long task carry stale timestamps), the scroll and the wordmark's display, so the sequence is read from the
  // frames themselves, not from waits. It also wraps the loader's API as the loader defines it, counting cut, skip and ready.
  type Sample = { t: number; f: number; n: number; phase: string; tl: number; fill: number | null; loading: boolean; y: number; vh: number; w: string; pct: string; s2: { ready: boolean; failed: boolean } | null };
  type Calls = { cut: number; skip: number; ready: number };
  type Loader = { state(): { phase: string; tl: number; n: number }; cut(): void; skip(): void; ready(): void };
  type Mark = { t: number; n: number; phase: string };
  type R5 = { __r5: Sample[]; __r5marks: Mark[]; __r5calls: Calls; __r5persisted: boolean | null; __skreedLoader?: Loader; __s2?: () => { ready: boolean; failed: boolean } };
  const sampler = (ctx: BrowserContext) => ctx.addInitScript(() => {
    if (location.pathname !== '/') return;
    const w = window as unknown as R5;
    w.__r5 = []; w.__r5marks = []; w.__r5calls = { cut: 0, skip: 0, ready: 0 }; w.__r5persisted = null;
    addEventListener('pageshow', (e) => { w.__r5persisted = (e as PageTransitionEvent).persisted; });
    let L: Loader | undefined;
    Object.defineProperty(window, '__skreedLoader', { configurable: true, enumerable: true, get: () => L, set: (v: Loader) => {
      L = v;
      for (const k of ['cut', 'skip', 'ready'] as const) { const f = v[k]; v[k] = function (this: Loader) { w.__r5calls[k]++; return f.call(this); }; }
      // every change of the count, with the loader's phase at that moment: enter() sets the 100 on a 120 ms timer and the
      // lift on a 500 ms one, so a gap between frames longer than 500 ms can hide the enter phase from the frames alone
      const i = document.getElementById('intro');
      if (i) new MutationObserver(() => { const s = v.state(); w.__r5marks.push({ t: performance.now(), n: s.n, phase: s.phase }); }).observe(i, { attributes: true, attributeFilter: ['aria-valuenow'] });
    } });
    const tick = (f: number) => {
      const i = document.getElementById('intro');
      if (L && i) {
        const s = L.state(), lw = i.querySelector('.ld-w'), pc = i.querySelector('#ldPct'), fa = i.querySelector('#ldFill')?.getAnimations()[0];
        w.__r5.push({ t: performance.now(), f, n: s.n, phase: s.phase, tl: s.tl, fill: fa && fa.currentTime != null ? Number(fa.currentTime) / 1e3 : null, loading: document.documentElement.classList.contains('loading'), y: scrollY, vh: innerHeight, w: lw ? getComputedStyle(lw).display : 'gone', pct: pc ? getComputedStyle(pc).display : 'gone', s2: w.__s2 ? w.__s2() : null });
      }
      if (!L || i) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  // the landing's tier override reads ?tier=, which the way in does not carry: pin it before the Gate's own definition
  const pin = (ctx: BrowserContext) => ctx.addInitScript(() => { if (location.pathname === '/') Object.defineProperty(window, '__skreedTierOverride', { value: () => 'hero3d', writable: false, configurable: false }); });

  /** Criteria 1 to 3 on the landing, from the arrival (the loader up) to 1 s after the lift; the frames on the press only. */
  async function landing(page: Page, label: string, frames: boolean): Promise<void> {
    await expect(page.locator('html')).toHaveClass(/\bhero3d\b/);
    // criterion 1: #intro.ret, and the wordmark and the count shown (the veil is gone)
    const first = await page.evaluate(() => { const i = document.getElementById('intro'); return i ? { ret: i.classList.contains('ret'), w: getComputedStyle(i.querySelector('.ld-w')!).display, pct: getComputedStyle(i.querySelector('#ldPct')!).display } : null; });
    expect(first).not.toBeNull();
    expect(first!.ret).toBe(true);
    expect(first!.w).not.toBe('none');
    expect(first!.pct).not.toBe('none');
    if (frames) {
      // the frame about 3 s after the press: the wordmark filling and the count showing (family-r5-*-return-loader)
      await page.waitForTimeout(2500);
      await expect(page.locator('html')).toHaveClass(/\bloading\b/);
      await page.screenshot({ path: shot(`${label}-return-loader`) });
    }
    await expect(page.locator('html')).not.toHaveClass(/\bloading\b/, { timeout: 120_000 });
    const atLift = await page.evaluate(() => ({ y: scrollY, vh: innerHeight, t: performance.now() }));
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 15_000 });
    // once #intro is gone: the loader's final state, and its API calls (the sampler's own tick stops in the task that sets done)
    const end = await page.evaluate(() => { const w = window as unknown as R5; return { state: w.__skreedLoader!.state(), calls: w.__r5calls }; });
    await expect(page.locator('nav#families')).toHaveAttribute('data-placed', '', { timeout: 30_000 });
    await expect(page.locator('nav#families a')).toHaveCount(10);
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => ({ y: scrollY, vh: innerHeight }));
    if (frames) await page.screenshot({ path: shot(`${label}-return-gems`) });
    const S: Sample[] = await page.evaluate(() => (window as unknown as R5).__r5);
    const marks: Mark[] = await page.evaluate(() => (window as unknown as R5).__r5marks);
    expect(S.length).toBeGreaterThan(60);
    // criterion 1: the wordmark and the count never display: none while the loader is up
    for (const s of S.filter((x) => x.loading)) { expect(s.w).not.toBe('none'); expect(s.pct).not.toBe('none'); }
    expect(S.some((s) => s.loading && s.n >= 30)).toBe(true);
    // criterion 2: the lift no earlier than 7.5 s after the time origin; n never falls; the fill never runs faster than twice
    // the frame clock measured from any earlier frame (a long task's catch-up is allowed, a cut is not: cut() finishes the
    // fill in one frame), 20 ms of tolerance; exit, then enter; done at 100 and 7.05; no cut() or skip(), ready() once
    const lift = S.find((s) => !s.loading);
    expect(lift, 'the loader lifted').toBeTruthy();
    expect(lift!.t).toBeGreaterThanOrEqual(LOADER_MIN_LIFT_MS);
    for (let k = 1; k < S.length; k++) expect(S[k].n, `n at sample ${k}`).toBeGreaterThanOrEqual(S[k - 1].n);
    const F = S.filter((s) => s.loading && s.fill !== null);
    expect(F.length).toBeGreaterThan(40);
    let base = Infinity, worst = -Infinity;   // base: the running minimum of fill - 2 f over the earlier frames
    for (const s of F) { const v = s.fill! - 2 * s.f / 1000; worst = Math.max(worst, v - base); base = Math.min(base, v); }
    expect(worst, 'the fill ahead of twice the frame clock, in s').toBeLessThanOrEqual(0.02);
    // the phases in time order, from the frames and the count's changes together
    const phases = [...S, ...marks].sort((a, b) => a.t - b.t).map((s) => s.phase).filter((p, k, a) => k === 0 || p !== a[k - 1]);
    expect(phases.indexOf('exit')).toBeGreaterThan(-1);
    expect(phases.indexOf('enter')).toBeGreaterThan(phases.indexOf('exit'));
    expect(end.state.phase).toBe('done');
    expect(end.state.n).toBe(100);
    expect(end.state.tl).toBeCloseTo(LOADER_END, 2);
    expect(end.calls).toEqual({ cut: 0, skip: 0, ready: 1 });
    // criterion 3: section 2 ready (or failed) before the lift; 14.5 screens at the lift and 1 s after; never section 1, the pull-back or the quiz from the lift on
    const before = S.filter((s) => s.loading);
    expect(before[before.length - 1].s2 && (before[before.length - 1].s2!.ready || before[before.length - 1].s2!.failed)).toBe(true);
    expect(Math.abs(atLift.y - LAND * atLift.vh)).toBeLessThanOrEqual(2);
    expect(Math.abs(after.y - LAND * after.vh)).toBeLessThanOrEqual(2);
    for (const s of S.filter((x) => !x.loading)) expect(Math.abs(s.y - LAND * s.vh)).toBeLessThanOrEqual(2);
    // for the record: the loader's length here, and the largest one-frame rise of the count (a catch-up after a long task)
    let jump = 0; for (let k = 1; k < S.length; k++) jump = Math.max(jump, S[k].n - S[k - 1].n);
    // and the same bound read the other way, the loader's own tl against performance.now(), which is not asserted: the frames
    // flushed after a long task carry the fill's pre-block time while performance.now() has moved on
    let b2 = Infinity, w2 = -Infinity;
    for (const s of S.filter((x) => x.loading)) { const v = s.tl - 2 * s.t / 1000; w2 = Math.max(w2, v - b2); b2 = Math.min(b2, v); }
    console.log(`landing ${label}: ${S.length} samples, lift at ${(lift!.t / 1000).toFixed(2)} s, largest count rise in one frame ${jump}, fill ahead of twice the frame clock by at most ${worst.toFixed(3)} s (tl against performance.now(): ${w2.toFixed(3)} s), the enter phase in ${S.filter((x) => x.phase === 'enter').length} frames and ${marks.filter((x) => x.phase === 'enter').length} count changes, calls ${JSON.stringify(end.calls)}`);
  }

  for (const [label, opts] of [['390', PHONE], ['1280', WIDE]] as const) {
    test(`the landing at ${label}, 3D path, after the press (round 5): the first visit's loader shows (ret, the wordmark and the count from first paint to the lift, past 30), runs its own exit and lift no earlier than 7.5 s (n never falls, the fill never faster than twice the frame clock, no cut or skip, ready once, exit then enter then done at 100 and 7.05), and lands on the gems at rest (14.5 screens at the lift and 1 s after, section 2 ready before the lift, the link boxes placed)`, async ({ browser }) => {
      const ctx = await browser.newContext(opts);
      await pin(ctx);
      await sampler(ctx);
      const page = await ctx.newPage();
      await open3d(page);
      await toEnd(page);
      await page.waitForTimeout(DELAY + IN_MS + 200);
      await back(page).click();
      await page.waitForURL(/\/#families$/);
      await landing(page, label, true);
      await ctx.close();
    });

    test(`the landing at ${label}, 3D path, the other two ways in (criterion 1): a direct load of /#families, then the browser's Back from a family page with the back-forward cache missed (the landing served no-store; the navigation back_forward, pageshow not persisted, no hash): the same loader, exit, lift and gems`, async ({ browser }) => {
      const ctx = await browser.newContext(opts);
      await pin(ctx);
      await sampler(ctx);
      const page = await ctx.newPage();
      // a direct load of /#families (a bookmark, a shared link, a reload of the return path)
      await page.goto('/#families');
      await landing(page, label, false);
      // the browser's Back: the landing at / (a first visit, left for a family page as the quiz's "See it on the case" leaves it, with no
      // hash behind), then Back with the cache missed, so RET holds by the navigation type alone
      await page.goto('/');
      await page.goto(url('blissful-blue'));
      await expect(page.locator('html')).toHaveClass(/\bm3d\b/);
      await page.route((u) => u.pathname === '/', async (route) => {
        if (route.request().resourceType() !== 'document') return route.continue();
        const r = await route.fetch();
        await route.fulfill({ response: r, headers: { ...r.headers(), 'cache-control': 'no-store' } });
      });
      await page.goBack();
      const nav = await page.evaluate(() => ({ type: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type, persisted: (window as unknown as R5).__r5persisted, hash: location.hash, path: location.pathname }));
      expect(nav).toEqual({ type: 'back_forward', persisted: false, hash: '', path: '/' });
      await landing(page, label, false);
      await ctx.close();
    });
  }
});

test.describe('22. keyboard, assistive technology and motion (acceptance 6)', () => {
  test('shown, it is the last tabbable element: Tab from a#toTop reaches it, Tab leaves the page, Shift+Tab returns; the two-tone ring; focus stays; Escape does nothing; #live is silent; the heading precedes it', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
    const page = await ctx.newPage();
    await open3d(page);
    await toEnd(page);
    const live0 = await page.locator('#live').textContent();
    await page.waitForTimeout(DELAY + IN_MS + 200);
    await expect(back(page)).toBeVisible();
    expect(await page.evaluate(() => document.activeElement === document.body || document.activeElement === null), 'nothing moved focus to it').toBe(true);
    await page.locator('#toTop').focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('famBack');
    const ring = await back(page).evaluate((el) => { const c = getComputedStyle(el), b = getComputedStyle(el, '::before'); return { outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`, inner: `${b.borderStyle} ${b.borderWidth} ${b.borderColor}` }; });
    expect(ring.outline).toBe('solid 2px rgb(255, 153, 0)');
    expect(ring.inner).toBe('solid 2px rgb(56, 63, 67)');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('famBack');
    await expect(back(page)).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/shades/blissful-blue/');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)).not.toBe('famBack');
    expect(await page.evaluate(() => !!document.activeElement?.closest?.('a, button, [tabindex]')), 'Tab from it leaves the page').toBe(false);
    await page.locator('#famBack').focus();
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('toTop');
    expect(await page.locator('#live').textContent()).toBe(live0);
    expect(await page.evaluate(() => document.getElementById('arg-h')!.compareDocumentPosition(document.getElementById('famBack')!) & Node.DOCUMENT_POSITION_FOLLOWING), 'the arg beat\'s heading comes first').toBeTruthy();
    await ctx.close();
  });

  test('reduced motion turned on after the page went 3D: there at full opacity at 2.5 s with no animation, gone at once; animate() is never called on the control', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
    // a spy on Element.prototype.animate, installed before the page's scripts: every call on #famBack is counted
    await ctx.addInitScript(() => {
      const w = window as unknown as { __famAnim: number };
      w.__famAnim = 0;
      const orig = Element.prototype.animate;
      Element.prototype.animate = function (this: Element, ...args: Parameters<Element['animate']>) { if (this.id === 'famBack') w.__famAnim++; return orig.apply(this, args); };
    });
    const page = await ctx.newPage();
    await page.clock.install();
    await open3d(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await hold(page);
    await toEnd(page);
    await page.clock.runFor(DELAY - 1);
    await expect(back(page)).toBeHidden();
    await page.clock.runFor(1);
    const on = await back(page).evaluate((el) => ({ hidden: el.hasAttribute('hidden'), opacity: getComputedStyle(el).opacity, anims: el.getAnimations().length }));
    expect(on).toEqual({ hidden: false, opacity: '1', anims: 0 });
    await toScreen(page, 5.5);   // returns after page.ts's scroll listener has run
    await expect(back(page)).toHaveAttribute('hidden', '');
    expect(await back(page).evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __famAnim: number }).__famAnim), 'animate() calls on #famBack').toBe(0);
    await ctx.close();
  });

  // E3: the words' contrast on the smoke behind them, at 2.9 s, the median of 10 frames, for the three light families at
  // both sizes. The text pixels (near Pearl Whisper) are left out of the sample; the rest of the control's box is the ground.
  for (const [label, opts] of [['390', PHONE], ['1280', WIDE]] as const) {
    for (const slug of ['frosty-white', 'mellow-yellow', 'blissful-blue']) {
      test(`contrast at ${label}, ${slug}: Pearl Whisper on the smoke behind the words reads 4.5:1 or better (median of 10 frames at 2.9 s)`, async ({ browser }) => {
        const ctx = await browser.newContext(opts);
        const page = await ctx.newPage();
        await open3d(page, slug);
        await toEnd(page);
        await page.waitForTimeout(DELAY + IN_MS);
        const b = await box(page, '#famBack');
        const lum = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        const ratios: number[] = [];
        for (let i = 0; i < 10; i++) {
          const png = await page.screenshot({ clip: { x: b.x, y: b.y, width: b.w, height: b.h } });
          const px = await page.evaluate(async (data) => {
            const img = await createImageBitmap(new Blob([Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0))], { type: 'image/png' }));
            const c = new OffscreenCanvas(img.width, img.height), g = c.getContext('2d')!; g.drawImage(img, 0, 0);
            return Array.from(g.getImageData(0, 0, img.width, img.height).data);
          }, png.toString('base64'));
          const L: number[] = [];
          for (let k = 0; k < px.length; k += 4) {
            const [r, g, bl] = [px[k], px[k + 1], px[k + 2]];
            if (r > 200 && g > 200 && bl > 200) continue;   // the words themselves
            L.push(0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(bl));
          }
          L.sort((p, q) => p - q);
          const ground = L[L.length >> 1] ?? 0, pearl = 0.2126 * lum(247) + 0.7152 * lum(246) + 0.0722 * lum(243);
          ratios.push((pearl + 0.05) / (ground + 0.05));
          await page.waitForTimeout(100);
        }
        ratios.sort((p, q) => p - q);
        const median = ratios[5];
        console.log(`contrast ${label} ${slug}: median ${median.toFixed(2)}:1 over 10 frames (${ratios.map((r) => r.toFixed(1)).join(', ')})`);   // for the review log
        expect(median).toBeGreaterThanOrEqual(4.5);
        await ctx.close();
      });
    }
  }
});

// every row above runs with the CSP watched where it reads the page module's events
test('the 3D path with the control shown records zero CSP violations', async ({ browser }) => {
  const ctx = await browser.newContext(WIDE);
  await watch(ctx);
  const page = await ctx.newPage();
  await open3d(page);
  await toEnd(page);
  await page.waitForTimeout(DELAY + IN_MS + 200);
  await expect(back(page)).toBeVisible();
  expect(await cspViolations(page)).toEqual([]);
  expect((await events(page)).filter((e) => e.event === 'family_back')).toHaveLength(0);
  await ctx.close();
});
