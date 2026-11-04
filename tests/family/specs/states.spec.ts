// Acceptance 9, the grid-mode rows (docs/specs/family-page.md 5 and 7; since 2026-11-04 the test builds' ?mode=grid alone,
// E-3D-only), on a PUBLIC_FAMILY_3D=dev build, where the 3D path exists and each row must turn it down: grid mode, the state line of section 3 where the spec gives one (with
// "Show in 3D" for data saver and 2G), no island request, zero CSP violations. One screenshot per row, at rest and
// unscrolled: docs/specs/screenshots/family-state-<row>-390x844.png.
import { test, expect, type BrowserContext } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { PHONE, WIDE, watch, cspViolations, shade, islandRequests } from './util.ts';

const SHOTS = new URL('../../../docs/specs/screenshots/', import.meta.url);
const conn = (c: Record<string, unknown>) => (ctx: BrowserContext) => ctx.addInitScript((v) => Object.defineProperty(navigator, 'connection', { value: v, configurable: true }), c);

type Row = { row: string; url: string; setup?: (ctx: BrowserContext) => Promise<void>; opts?: Record<string, unknown>; line: string | null; show3d: boolean; why: string };
// Since 2026-11-04 (E-3D-only, docs/specs/3d-only.md) nothing a visitor's device says turns the 3D down: swatch grid mode is
// the test builds' ?mode=grid alone, and a browser with no WebGL2 gets the site note over the grid
const ROWS: Row[] = [
  { row: 'query', url: '/shades/basic-brown/?mode=grid', line: null, show3d: false, why: 'query' },
];
const THREE_D: { row: string; setup?: (ctx: BrowserContext) => Promise<void>; opts?: Record<string, unknown> }[] = [
  { row: 'data-saver', setup: conn({ saveData: true, effectiveType: '4g' }) },
  { row: '2g', setup: conn({ saveData: false, effectiveType: '2g' }) },
  { row: 'slow-2g', setup: conn({ saveData: false, effectiveType: 'slow-2g' }) },
  { row: 'device-memory-2', setup: (ctx) => ctx.addInitScript(() => Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true })) },
  { row: 'reduced-motion', opts: { reducedMotion: 'reduce' } },
];

test.describe('9. states, grid-mode rows (PUBLIC_FAMILY_3D=dev build)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shades/basic-brown/');
    const has3d = await page.evaluate(() => JSON.parse(document.getElementById('fam-data')!.textContent!).has3d as boolean);
    expect(has3d, 'these rows need a PUBLIC_FAMILY_3D=dev build').toBe(true);
  });

  test('control: with nothing turning it down (?render=force past SwiftShader), the island is requested, so the detector works', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    const reqs: string[] = [];
    ctx.on('request', (q) => reqs.push(new URL(q.url()).pathname));
    const page = await ctx.newPage();
    await page.goto('/shades/basic-brown/?render=force');
    await expect.poll(() => islandRequests(reqs).length, { timeout: 60_000 }).toBeGreaterThan(0);
    await ctx.close();
  });

  for (const r of THREE_D) {
    test(`${r.row}: the 3D path (E-3D-only), the island requested, no grid`, async ({ browser }) => {
      const ctx = await browser.newContext({ ...PHONE, ...(r.opts ?? {}) });
      if (r.setup) await r.setup(ctx);
      const reqs: string[] = [];
      ctx.on('request', (q) => reqs.push(new URL(q.url()).pathname));
      const page = await ctx.newPage();
      await page.goto('/shades/basic-brown/');
      await expect(page.locator('html')).toHaveClass(/\bm3d\b/);
      expect(await page.locator('html').getAttribute('class')).not.toMatch(/\b(grid|still3d|nogl)\b/);
      await expect.poll(() => islandRequests(reqs).length, { timeout: 60_000 }).toBeGreaterThan(0);
      await ctx.close();
    });
  }

  test('no-webgl2: the unsupported line of the site note over the page, no island request', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    await ctx.addInitScript(() => { delete (window as unknown as Record<string, unknown>).WebGL2RenderingContext; });
    const reqs: string[] = [];
    ctx.on('request', (q) => reqs.push(new URL(q.url()).pathname));
    const page = await ctx.newPage();
    await page.goto('/shades/basic-brown/');
    await page.waitForTimeout(1500);
    await expect(page.locator('html')).toHaveClass(/\bnogl\b/);
    await expect(page.locator('html')).toHaveAttribute('data-note', 'unsupported');
    await expect(page.locator('#siteNote .sn-unsupported')).toBeVisible();
    expect(islandRequests(reqs)).toEqual([]);
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
        await expect(page.locator('#state strong:visible')).toHaveText(lead);
        await expect(page.locator('#state p:visible')).toContainText(rest);
      } else {
        await expect(page.locator('#state'), 'no line shows').toBeHidden();
      }
      await expect(page.getByRole('button', { name: /^Show in 3D/ })).toHaveCount(r.show3d ? 1 : 0);
      expect(islandRequests(reqs), r.row).toEqual([]);
      expect(await cspViolations(page)).toEqual([]);
      expect(await page.evaluate(() => scrollY), 'the screenshot is the page at rest, unscrolled').toBe(0);
      await page.screenshot({ path: fileURLToPath(new URL(`family-state-${r.row}-390x844.png`, SHOTS)) });
      await ctx.close();
    });
  }

  test('shade-999: the key shade, the URL cleaned, no message', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    await watch(ctx);
    const page = await ctx.newPage();
    await page.goto('/shades/blissful-blue/?shade=999');
    expect(await shade(page)).toBe('032');
    await expect(page).toHaveURL(/\/shades\/blissful-blue\/$/);
    await expect(page.locator('#hudName')).toHaveText('Sky');
    expect(await cspViolations(page)).toEqual([]);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL('family-state-shade-999-390x844.png', SHOTS)) });
    await ctx.close();
  });

  test('cross-family: ?shade=032 on Vivid Violet lands on Blissful Blue with Sky', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    await watch(ctx);
    const page = await ctx.newPage();
    await page.goto('/shades/vivid-violet/?shade=032&finish=gloss');
    await page.waitForURL(/\/shades\/blissful-blue\/\?shade=032&finish=gloss$/);
    await expect(page.locator('h1')).toHaveText('Blissful Blue');
    await expect(page.locator('#hudName')).toHaveText('Sky');
    await expect(page.getByRole('button', { name: 'Gloss' })).toHaveAttribute('aria-pressed', 'true');
    expect(await cspViolations(page)).toEqual([]);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL('family-state-cross-family-390x844.png', SHOTS)) });
    await ctx.close();
  });
});

// Review iteration 3, item 2 (D3, H; spec 2.7 and 5 "First paint"): swatch grid mode is right at first paint on a 3D
// build. The page module is held back 1 s, so everything it does lands well after the page has rendered; the layout
// must not move when it runs. Every grid-mode row, at 390 x 844 and 1280 x 800: a frame rendered after parsing and
// before the module; at the end of the hold (the layout the visitor has been looking at) the grid is in the stage and
// the row's line (or none) is in place; the stage, HUD, scrubber and finish boxes are the same after the module; the
// layout-shift total is under 0.01. The iteration 3 build fails every row (0.26 to 0.29 wide, 0.032 on the phone's 2G
// rows); see the spec, section 17.
type Snap = { frameAt: number | null; at: number; stage: number[]; hud: number[]; scrub: number[]; finish: number[]; lines: (string | null)[]; gridInStage: boolean };
function layoutNow(): Snap {
  const box = (s: string) => { const b = document.querySelector(s)!.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.height)]; };
  return { frameAt: (window as unknown as { __frameAt?: number }).__frameAt ?? null, at: performance.now(),
    stage: box('#stage'), hud: box('#hud'), scrub: box('#scrub'), finish: box('#finish'),
    lines: [...document.querySelectorAll('#state p')].filter((p) => p.checkVisibility()).map((p) => p.textContent),
    gridInStage: !!document.querySelector('#stage > .sgrid')?.checkVisibility() };
}
test.describe('9. first paint in swatch grid mode (PUBLIC_FAMILY_3D=dev build, the page module held back 1 s)', () => {
  const MODULE = /\/_astro\/FamilyPage\.astro_astro_type_script[^/]*\.js$/;
  for (const r of ROWS) {
    for (const [label, size] of [['390x844', PHONE], ['1280x800', WIDE]] as const) {
      test(`${r.row} at ${label}: no layout shift when the page module runs`, async ({ browser }) => {
        const ctx = await browser.newContext({ ...size, ...(r.opts ?? {}) });
        if (r.setup) await r.setup(ctx);
        await ctx.addInitScript(() => {
          const w = window as unknown as { __shifts: number[]; __famAt: number; __frameAt: number };
          w.__shifts = [];
          new PerformanceObserver((l) => { for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__shifts.push(e.value); }).observe({ type: 'layout-shift', buffered: true });
          // the first frame once parsing is done (readyState "interactive" comes before module scripts run)
          document.addEventListener('readystatechange', () => { if (document.readyState === 'interactive') requestAnimationFrame(() => { w.__frameAt = performance.now(); }); });
          // the page module sets window.__fam (test builds) as its last step: note when it ran
          Object.defineProperty(window, '__fam', { configurable: true, set(v) { Object.defineProperty(window, '__fam', { value: v, writable: true, configurable: true }); w.__famAt = performance.now(); } });
        });
        let before: Snap | null = null;
        await ctx.route(MODULE, async (route) => {
          await new Promise((ok) => setTimeout(ok, 1000));
          before = await route.request().frame().evaluate(layoutNow);   // the page as it stands at the end of the hold
          await route.continue();
        });
        const page = await ctx.newPage();
        await page.goto('/shades/blissful-blue/' + r.url.slice(r.url.indexOf('?') >= 0 ? r.url.indexOf('?') : r.url.length));
        await page.waitForFunction(() => '__famAt' in window, null, { timeout: 30_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(600);
        const after = await page.evaluate(layoutNow);
        const m = await page.evaluate(() => { const w = window as unknown as { __shifts: number[]; __famAt: number }; return { shifts: w.__shifts, famAt: w.__famAt, y: scrollY }; });
        const cls = m.shifts.reduce((a, v) => a + v, 0);
        const b = before as Snap | null;
        expect(b, 'the page module went through the hold').not.toBeNull();
        expect(b!.frameAt, 'a frame rendered after parsing, before the module ran').not.toBeNull();
        expect(b!.at).toBeLessThan(m.famAt);
        expect(m.y).toBe(0);
        expect(cls, `layout-shift total ${cls.toFixed(4)} (${m.shifts.map((v) => v.toFixed(4)).join(', ')})`).toBeLessThan(0.01);
        for (const k of ['stage', 'hud', 'scrub', 'finish'] as const) expect(after[k], `${k} box (top, height) before and after the module`).toEqual(b![k]);
        expect(b!.gridInStage, 'the grid is in the stage before the module runs').toBe(true);
        // a supplier build states the download: "Show in 3D, 0.3 MB" (dev builds: "Show in 3D")
        expect(b!.lines.map((l) => l && l.replace(/Show in 3D, [\d.]+\u00a0MB$/, 'Show in 3D')), "the row's state line is there before the module runs").toEqual(r.line ? [`${r.line}Show in 3D`] : []);
        expect(after.lines, 'and the same line after it').toEqual(b!.lines);
        await ctx.close();
      });
    }
  }
});
