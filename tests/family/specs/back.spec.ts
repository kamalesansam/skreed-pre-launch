// Round 4 (docs/specs/family-page.md 22): "Back to main page" on the argument screen, the browser rows of acceptance
// criteria 1 to 6. Runs on a PUBLIC_FAMILY_3D=on (or dev) test build served by wrangler dev, the 3D path forced past
// SwiftShader with ?render=force&tier=high (section 18, item 7); the landing's 3D row needs the hero's tier override
// (a test build). The clock is Playwright's: installed before the page loads, paused once the page is live, then run
// by hand, so 2,499 and 2,500 ms are exact. The Web Animations API runs on the document's own timeline, which the
// fake clock does not drive, so the fades are checked by their timing objects and after a real wait. Frames:
// docs/specs/screenshots/family-r4-{390,1280}-arg-before.png (2.4 s after the argument comes on), -arg-after.png (3.0 s),
// -landing-poster.png and -landing-3d.png after the press.
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { PHONE, WIDE, watch, cspViolations, events } from './util.ts';

const SHOTS = new URL('../../../docs/specs/screenshots/', import.meta.url);
const shot = (name: string) => fileURLToPath(new URL(`family-r4-${name}.png`, SHOTS));
const ARG_ON = 5.6;                     // pose.ts SV.argOn, in screens
const DELAY = 2500, IN_MS = 400, OUT_MS = 200;   // timing.ts BACK_DELAY_MS, BACK_IN_MS, BACK_OUT_MS
const PEARL = 'rgb(247, 246, 243)';
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
/** Scrolls to the given screen (the page is seven screens of 100svh; the end is six screens) and lets the scroll event fire. */
async function toScreen(page: Page, screens: number): Promise<void> {
  await page.evaluate((s) => scrollTo({ top: s === Infinity ? document.documentElement.scrollHeight : Math.round(s * innerHeight), behavior: 'instant' }), screens);
  await page.waitForTimeout(80);   // the scroll event is dispatched by the browser's own frame, not the fake clock
}
const toEnd = (page: Page) => toScreen(page, Infinity);
/** Pauses the fake clock where it stands, so only runFor moves the control's timer. */
async function hold(page: Page): Promise<void> {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 1);
}
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
      await page.waitForTimeout(IN_MS + 100);
      expect(await back(page).evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
      await expect(back(page)).toBeVisible();

      // up before 2.5 s cancels the timer; the next arrival waits 2.5 s again
      await toScreen(page, 5.5);
      await page.waitForTimeout(OUT_MS + 100);
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
      await page.waitForTimeout(IN_MS + 100);

      // up after it showed: the 200 ms exit on --ease-in, then hidden
      await toScreen(page, 5.5);
      const out = await back(page).evaluate((el) => ({ hidden: el.hasAttribute('hidden'), anims: el.getAnimations().map((a) => { const t = a.effect!.getTiming(); return { duration: t.duration, easing: t.easing, fill: t.fill }; }) }));
      expect(out.hidden).toBe(false);
      expect(out.anims).toEqual([{ duration: OUT_MS, easing: 'cubic-bezier(.55, .085, .68, .53)', fill: 'forwards' }]);
      await page.waitForTimeout(OUT_MS + 150);
      await expect(back(page)).toHaveAttribute('hidden', '');
      await expect(back(page)).toBeHidden();
      expect(await back(page).evaluate((el) => el.getAnimations().length)).toBe(0);
      await ctx.close();
    });

    test(`frames at ${label}: the argument screen 2.4 s after it comes on (no control) and at 3.0 s (the control in)`, async ({ browser }) => {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      await open3d(page);
      await toEnd(page);
      await page.waitForTimeout(2400);
      await expect(back(page)).toBeHidden();
      await page.screenshot({ path: shot(`${label}-arg-before`) });
      await page.waitForTimeout(600);
      await expect(back(page)).toBeVisible();
      await page.screenshot({ path: shot(`${label}-arg-after`) });
      await ctx.close();
    });
  }
});

test.describe('22. where it sits (acceptance 3)', () => {
  const SIZES: [number, number][] = [[360, 780], [375, 667], [390, 844], [430, 932], [768, 1024], [844, 390], [900, 600], [1280, 800]];
  for (const [w, h] of SIZES) {
    test(`${w}x${h}: centred, clear of Back to top, "All families" and the letters' box, 16 px inside the edges, no horizontal scroll`, async ({ browser }) => {
      const phone = w < 900 || h < 600;
      const ctx = await browser.newContext({ ...(phone ? PHONE : WIDE), viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await open3d(page);
      await toEnd(page);
      await page.waitForTimeout(DELAY + IN_MS + 200);
      await expect(back(page)).toBeVisible();
      const b = await box(page, '#famBack');
      expect(Math.abs(b.x + b.w / 2 - w / 2)).toBeLessThanOrEqual(1);
      expect(b.h).toBe(44);
      if (w === 1280 && h === 800) { expect(b.y).toBeCloseTo(711.2, 0); expect(b.b).toBeCloseTo(755.2, 0); }
      if (w === 390 && h === 844) { expect(b.y).toBe(734); expect(b.b).toBe(778); }
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
    await page.waitForTimeout(DELAY + IN_MS + 200);
    const read = () => back(page).evaluate((el) => { const c = getComputedStyle(el); return { t: c.transform, o: c.opacity }; });
    expect(await read()).toEqual({ t: 'none', o: '1' });
    await back(page).hover();
    await page.waitForTimeout(250);
    expect(await read()).toEqual({ t: 'matrix(1, 0, 0, 1, 0, -1)', o: '1' });
    await page.mouse.down();
    await page.waitForTimeout(250);
    expect(await read()).toEqual({ t: 'matrix(0.98, 0, 0, 0.98, 0, 0)', o: '1' });
    await page.mouse.move(5, 5);   // released off the link: no click, no navigation
    await page.mouse.up();
    expect(new URL(page.url()).pathname).toBe('/shades/blissful-blue/');
    await ctx.close();
  });

  test('the landing, poster path: nav#families in view, no loader (the harness has no hardware WebGL2, so / is the poster page)', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await open3d(page);
    await toEnd(page);
    await page.waitForTimeout(DELAY + IN_MS + 200);
    await back(page).click();
    await page.waitForURL(/\/#families$/);
    await expect(page.locator('html')).toHaveClass(/\bposter\b/);
    await expect(page.locator('nav#families')).toBeInViewport();
    await expect(page.locator('#intro')).toBeHidden();
    await page.screenshot({ path: shot('390-landing-poster') });
    await ctx.close();
  });

  test('the landing, 3D path (section 13 step 3): no wordmark loader, section 2 at rest at 14.5 screens with the gems live and the link boxes placed', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
    // the landing's tier override reads ?tier=, which the link does not carry: pin it before the Gate's own definition
    await ctx.addInitScript(() => { if (location.pathname === '/') Object.defineProperty(window, '__skreedTierOverride', { value: () => 'hero3d', writable: false, configurable: false }); });
    const page = await ctx.newPage();
    await open3d(page);
    await toEnd(page);
    await page.waitForTimeout(DELAY + IN_MS + 200);
    await back(page).click();
    await page.waitForURL(/\/#families$/);
    await expect(page.locator('html')).toHaveClass(/\bhero3d\b/);
    // the veil: the loader element with no wordmark and no percent while it loads
    const veil = await page.evaluate(() => { const i = document.getElementById('intro'); return i ? { ret: i.classList.contains('ret'), w: getComputedStyle(i.querySelector('.ld-w')!).display, pct: getComputedStyle(i.querySelector('#ldPct')!).display } : null; });
    if (veil) expect(veil).toEqual({ ret: true, w: 'none', pct: 'none' });
    await expect(page.locator('html')).not.toHaveClass(/\bloading\b/, { timeout: 120_000 });
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 15_000 });
    const at = await page.evaluate(() => ({ y: scrollY, vh: innerHeight }));
    expect(Math.abs(at.y - 14.5 * at.vh)).toBeLessThanOrEqual(2);
    await expect(page.locator('nav#families')).toHaveAttribute('data-placed', '', { timeout: 30_000 });
    await expect(page.locator('nav#families a')).toHaveCount(10);
    await page.waitForTimeout(1000);
    expect(Math.abs((await page.evaluate(() => scrollY)) - 14.5 * at.vh)).toBeLessThanOrEqual(2);
    await page.screenshot({ path: shot('1280-landing-3d') });
    await ctx.close();
  });
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

  test('reduced motion turned on after the page went 3D: there at full opacity at 2.5 s with no animation, gone at once', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
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
    await toScreen(page, 5.5);
    const off = await back(page).evaluate((el) => ({ hidden: el.hasAttribute('hidden'), anims: el.getAnimations().length }));
    expect(off).toEqual({ hidden: true, anims: 0 });
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
