// Acceptance 9, the grid-mode rows (docs/specs/family-page.md 5 and 7), on a PUBLIC_FAMILY_3D=dev build, where the 3D
// path exists and each row must turn it down: grid mode, the state line of section 3 where the spec gives one (with
// "Show in 3D" for data saver and 2G), no island request, zero CSP violations. One screenshot per row, at rest and
// unscrolled: docs/specs/screenshots/family-state-<row>-390x844.png.
import { test, expect, type BrowserContext } from '@playwright/test';
import { PHONE, watch, cspViolations, shade, islandRequests } from './util.ts';

const SHOTS = new URL('../../../docs/specs/screenshots/', import.meta.url);
const conn = (c: Record<string, unknown>) => (ctx: BrowserContext) => ctx.addInitScript((v) => Object.defineProperty(navigator, 'connection', { value: v, configurable: true }), c);

type Row = { row: string; url: string; setup?: (ctx: BrowserContext) => Promise<void>; opts?: Record<string, unknown>; line: string | null; show3d: boolean; why: string };
const ROWS: Row[] = [
  { row: 'data-saver', url: '/shades/earthy-browns/', setup: conn({ saveData: true, effectiveType: '4g' }), line: 'Data saver is on. Showing the swatches.', show3d: true, why: 'savedata' },
  { row: '2g', url: '/shades/earthy-browns/', setup: conn({ saveData: false, effectiveType: '2g' }), line: 'Slow connection. Showing the swatches.', show3d: true, why: 'slow' },
  { row: 'slow-2g', url: '/shades/earthy-browns/', setup: conn({ saveData: false, effectiveType: 'slow-2g' }), line: 'Slow connection. Showing the swatches.', show3d: true, why: 'slow' },
  { row: 'device-memory-2', url: '/shades/earthy-browns/', setup: (ctx) => ctx.addInitScript(() => Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true })), line: null, show3d: false, why: 'memory' },
  { row: 'reduced-motion', url: '/shades/earthy-browns/', opts: { reducedMotion: 'reduce' }, line: null, show3d: false, why: 'reduced' },
  { row: 'no-webgl2', url: '/shades/earthy-browns/', setup: (ctx) => ctx.addInitScript(() => { delete (window as unknown as Record<string, unknown>).WebGL2RenderingContext; }), line: null, show3d: false, why: 'webgl' },
];

test.describe('9. states, grid-mode rows (PUBLIC_FAMILY_3D=dev build)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shades/earthy-browns/');
    const has3d = await page.evaluate(() => JSON.parse(document.getElementById('fam-data')!.textContent!).has3d as boolean);
    expect(has3d, 'these rows need a PUBLIC_FAMILY_3D=dev build').toBe(true);
  });

  test('control: with nothing turning it down (?render=force past SwiftShader), the island is requested, so the detector works', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    const reqs: string[] = [];
    ctx.on('request', (q) => reqs.push(new URL(q.url()).pathname));
    const page = await ctx.newPage();
    await page.goto('/shades/earthy-browns/?render=force');
    await expect.poll(() => islandRequests(reqs).length, { timeout: 60_000 }).toBeGreaterThan(0);
    await ctx.close();
  });

  for (const r of ROWS) {
    test(`${r.row}: swatch grid mode${r.line ? `, "${r.line}"` : ', no message'}${r.show3d ? ' and "Show in 3D"' : ''}, no island request`, async ({ browser }) => {
      const ctx = await browser.newContext({ ...PHONE, ...(r.opts ?? {}) });
      await watch(ctx);
      if (r.setup) await r.setup(ctx);
      const reqs: string[] = [];
      ctx.on('request', (q) => reqs.push(new URL(q.url()).pathname));
      const page = await ctx.newPage();
      await page.goto(r.url);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500);   // the island would be requested after load and idle; give it the chance
      await expect(page.locator('html')).toHaveClass(/\bgrid\b/);
      await expect(page.locator('html')).toHaveAttribute('data-why', r.why);
      await expect(page.locator('#stage .sgrid')).toBeVisible();
      if (r.line) {
        const [lead, rest] = [r.line.slice(0, r.line.indexOf('.') + 1), r.line.slice(r.line.indexOf('.') + 2)];
        await expect(page.locator('#state strong')).toHaveText(lead);
        await expect(page.locator('#state p')).toContainText(rest);
      } else {
        await expect(page.locator('#state')).toBeEmpty();
      }
      await expect(page.getByRole('button', { name: /^Show in 3D/ })).toHaveCount(r.show3d ? 1 : 0);
      expect(islandRequests(reqs), r.row).toEqual([]);
      expect(await cspViolations(page)).toEqual([]);
      expect(await page.evaluate(() => scrollY), 'the screenshot is the page at rest, unscrolled').toBe(0);
      await page.screenshot({ path: new URL(`family-state-${r.row}-390x844.png`, SHOTS).pathname });
      await ctx.close();
    });
  }

  // Review iteration 2, item 2 (spec 3: the line sits under the HUD; 2.3: the controls stay above the sticky bar). At rest,
  // unscrolled: the line is between the HUD and the scrubber, its box ends above the bar's top, "Show in 3D" is the
  // element under its own centre, and the grid circles stay 44 px or larger. The scrubber and the finish stay above the
  // bar too, except at 375 x 667, where 2.3 already lets the finish row scroll under it.
  for (const r of ROWS.filter((x) => x.line)) {
    for (const [w, h] of [[360, 780], [390, 844], [430, 932], [375, 667]] as const) {
      test(`${r.row} at ${w}x${h}: the state line sits under the HUD and above the sticky bar at rest`, async ({ browser }) => {
        const ctx = await browser.newContext({ ...PHONE, viewport: { width: w, height: h } });
        if (r.setup) await r.setup(ctx);
        const page = await ctx.newPage();
        await page.goto(r.url);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.getByRole('button', { name: /^Show in 3D/ })).toBeVisible();
        const m = await page.evaluate(() => {
          const box = (s: string) => { const b = document.querySelector(s)!.getBoundingClientRect(); return { top: b.top, bottom: b.bottom }; };
          const btn = document.querySelector('#state button')!, b = btn.getBoundingClientRect();
          const dots = [...document.querySelectorAll('#stage .sgrid .dot')].map((d) => d.getBoundingClientRect().width);
          return { y: scrollY, hud: box('#hud'), state: box('#state'), scrub: box('#scrub'), finish: box('#finish'), bar: box('.bar'),
            onTop: document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) === btn, minDot: Math.min(...dots) };
        });
        expect(m.y).toBe(0);
        expect(m.state.top, 'the line is under the HUD').toBeGreaterThanOrEqual(m.hud.bottom - 0.5);
        expect(m.state.bottom, 'the line is above the scrubber').toBeLessThanOrEqual(m.scrub.top + 0.5);
        expect(m.state.bottom, "the line's box ends above the sticky bar").toBeLessThanOrEqual(m.bar.top + 0.5);
        expect(m.onTop, '"Show in 3D" is not covered').toBe(true);
        expect(m.minDot, 'grid circles').toBeGreaterThanOrEqual(44);
        if (h > 667) expect(m.finish.bottom, 'the finish stays above the sticky bar (2.3)').toBeLessThanOrEqual(m.bar.top + 0.5);
        await ctx.close();
      });
    }
  }

  test('data-saver at 1280x800: the state line takes the row under the HUD, above the scrubber (wide layout)', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await ROWS[0].setup!(ctx);
    const page = await ctx.newPage();
    await page.goto('/shades/earthy-browns/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('button', { name: /^Show in 3D/ })).toBeVisible();
    const m = await page.evaluate(() => { const box = (s: string) => document.querySelector(s)!.getBoundingClientRect().toJSON(); return { hud: box('#hud'), state: box('#state'), scrub: box('#scrub') }; });
    expect(m.state.top).toBeGreaterThanOrEqual(m.hud.bottom - 0.5);
    expect(m.state.bottom).toBeLessThanOrEqual(m.scrub.top + 0.5);
    expect(Math.abs((m.state.left + m.state.right) / 2 - (m.hud.left + m.hud.right) / 2), 'centred with the HUD').toBeLessThan(1);
    await ctx.close();
  });

  test('shade-999: the key shade, the URL cleaned, no message', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    await watch(ctx);
    const page = await ctx.newPage();
    await page.goto('/shades/blissful-blues/?shade=999');
    expect(await shade(page)).toBe('032');
    await expect(page).toHaveURL(/\/shades\/blissful-blues\/$/);
    await expect(page.locator('#hudName')).toHaveText('Sky');
    expect(await cspViolations(page)).toEqual([]);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: new URL('family-state-shade-999-390x844.png', SHOTS).pathname });
    await ctx.close();
  });

  test('cross-family: ?shade=032 on Vivid Violets lands on Blissful Blues with Sky', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    await watch(ctx);
    const page = await ctx.newPage();
    await page.goto('/shades/vivid-violets/?shade=032&finish=gloss');
    await page.waitForURL(/\/shades\/blissful-blues\/\?shade=032&finish=gloss$/);
    await expect(page.locator('h1')).toHaveText('Blissful Blues');
    await expect(page.locator('#hudName')).toHaveText('Sky');
    await expect(page.getByRole('button', { name: 'Gloss' })).toHaveAttribute('aria-pressed', 'true');
    expect(await cspViolations(page)).toEqual([]);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: new URL('family-state-cross-family-390x844.png', SHOTS).pathname });
    await ctx.close();
  });
});
