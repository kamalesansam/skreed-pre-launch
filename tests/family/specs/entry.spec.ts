// Acceptance 2 (docs/specs/family-page.md 7): entry from the landing into the ten family pages and the way back.
// Runs against a build whose landing mounts <FamilyLinks slot="riders" /> (the hero owner's section 2; spec 2.2, 13)
// with FAMILY_PAGES on (test and staging builds, or PUBLIC_FAMILY_PAGES=on).
//   Poster path: needs only the mount. The ten links are section 2's visible fallback grid.
//   3D path (?tier=hero3d, test builds): also needs the section 2 island to call installRockNav, placeLinkBoxes from
//   the frame that places the gem labels, and isReturnVisit in the loader's skip path. Until it does, these rows fail
//   at the first check with "the section 2 island does not place the link boxes".
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { FAMILIES, NAMES, PHONE, WIDE } from './util.ts';

const KEYS = ['007', '032', '062', '079', '097', '127', '148', '173', '204', '223'];
const HREFS = FAMILIES.map((f, i) => `/shades/${f}/?shade=${KEYS[i]}`);

/** family_open events, kept across navigations (an exposed binding survives them; window state does not). */
async function record(ctx: BrowserContext): Promise<{ event: string; props: Record<string, unknown> }[]> {
  const seen: { event: string; props: Record<string, unknown> }[] = [];
  await ctx.exposeBinding('__famRec', (_s, d) => { seen.push(d); });
  await ctx.addInitScript(() => addEventListener('skreed:track', (e) => (window as unknown as { __famRec: (d: unknown) => void }).__famRec((e as CustomEvent).detail)));
  return seen;
}
/** The poster path on any build: the Gate sends data saver to the poster (hero D3). */
const posterPath = (ctx: BrowserContext) => ctx.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' }, configurable: true }));
const nav = (p: Page) => p.locator('nav#families');

test.describe('2. entry from the landing, poster path', () => {
  for (const [label, opts] of [['390', PHONE], ['1280', WIDE]] as const) {
    test(`the ten links are the visible fallback grid at ${label}: catalog order, names, 44 px boxes`, async ({ browser }) => {
      const ctx = await browser.newContext(opts);
      await posterPath(ctx);
      const page = await ctx.newPage();
      await page.goto('/');
      await expect(page.locator('html')).toHaveClass(/\bposter\b/);
      await expect(nav(page), 'the landing does not mount FamilyLinks (hero owner, spec 2.2)').toHaveCount(1);
      await expect(nav(page)).toHaveAttribute('aria-label', 'Colour families');
      const links = nav(page).locator('a');
      await expect(links).toHaveCount(10);
      expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(HREFS);
      for (const [i, n] of NAMES.entries()) {
        await expect(links.nth(i)).toHaveAccessibleName(`${n}, all 24 shades`);
        await expect(links.nth(i)).toBeVisible();
        await expect(links.nth(i)).toContainText(n);
        const b = (await links.nth(i).boundingBox())!;
        expect(b.width).toBeGreaterThanOrEqual(44);
        expect(b.height).toBeGreaterThanOrEqual(44);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await ctx.close();
    });
  }

  test('Tab from the top reaches the ten links in catalog order, each with the Ember focus ring', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
    await posterPath(ctx);
    const page = await ctx.newPage();
    await page.goto('/');
    const order: string[] = [];
    for (let k = 0; k < 40 && order.length < 10; k++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        if (!a?.closest('nav#families')) return null;
        const cs = getComputedStyle(a);
        return { href: a.getAttribute('href'), ring: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` };
      });
      if (f) { order.push(f.href!); expect(f.ring).toBe('solid 2px rgb(255, 153, 0)'); }
    }
    expect(order).toEqual(HREFS);
    await ctx.close();
  });

  test('a click opens the family with its ?shade=, leaves /#families behind, logs family_open from rock_grid; Back returns there', async ({ browser }) => {
    for (const noStore of [false, true]) {
      const ctx = await browser.newContext(PHONE);
      await posterPath(ctx);
      const seen = await record(ctx);
      if (noStore) {
        // without the back-forward cache: the landing is served no-store, so Back reloads it
        await ctx.route((u) => u.pathname === '/', async (r) => { const res = await r.fetch(); await r.fulfill({ response: res, headers: { ...res.headers(), 'cache-control': 'no-store' } }); });
      }
      const page = await ctx.newPage();
      await page.goto('/');
      await nav(page).locator('a').nth(1).scrollIntoViewIfNeeded();
      await nav(page).locator('a').nth(1).click();
      await page.waitForURL(/\/shades\/blissful-blues\/\?shade=032$/);
      await expect(page.locator('#hudName')).toHaveText('Sky');
      expect(seen.filter((e) => e.event === 'family_open').at(-1)?.props).toEqual({ family: 'blissful-blues', from: 'rock_grid' });
      await page.goBack();
      await page.waitForURL(/\/#families$/);
      await expect(nav(page)).toBeInViewport();
      await expect(page.locator('#intro')).toBeHidden();
      await ctx.close();
    }
  });
});

test.describe('2. entry from the landing, 3D path (needs the section 2 island)', () => {
  test.describe.configure({ timeout: 300_000 });

  /** The landing on the 3D path, live, with the link boxes placed over the gems at section 2's rest position. */
  async function live3d(page: Page, q = ''): Promise<{ x: number; y: number; w: number; h: number }[]> {
    await page.goto(`/?tier=hero3d${q}`);
    await expect(page.locator('html')).toHaveClass(/\bhero3d\b/);
    await expect(page.locator('html')).not.toHaveClass(/\bloading\b/, { timeout: 120_000 });
    await expect(nav(page), 'the landing does not mount FamilyLinks (hero owner, spec 2.2)').toHaveCount(1);
    await nav(page).locator('a').first().focus();       // onFocusGem: section 2 to rest, gem 0 the focus gem
    await expect(nav(page), 'the section 2 island does not place the link boxes (installRockNav, placeLinkBoxes)').toHaveAttribute('data-placed', '', { timeout: 30_000 });
    await page.waitForTimeout(600);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    return nav(page).locator('a').evaluateAll((as) => as.map((a) => { const r = a.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
  }

  test('focus scrolls section 2 to rest and rings the gem; every box is 44 px or larger and sits over the canvas', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
    const page = await ctx.newPage();
    const boxes = await live3d(page);
    for (const b of boxes) { expect(b.w).toBeGreaterThanOrEqual(44); expect(b.h).toBeGreaterThanOrEqual(44); }
    expect(new Set(boxes.map((b) => `${Math.round(b.x)},${Math.round(b.y)}`)).size).toBe(10);   // never stacked
    await nav(page).locator('a').nth(3).focus();
    const ring = await nav(page).locator('a').nth(3).evaluate((a) => { const cs = getComputedStyle(a); return `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`; });
    expect(ring).toBe('solid 2px rgb(255, 153, 0)');
    await ctx.close();
  });

  for (const [label, opts, hold, q] of [['click at 1280', WIDE, 0, ''], ['a 600 ms tap at 390', PHONE, 600, ''], ['click at 1280, ?blockColors=warm', WIDE, 0, '&blockColors=warm']] as const) {
    test(`${label}: each gem opens the family of the shade it shows`, async ({ browser }) => {
      const ctx = await browser.newContext(opts);
      const seen = await record(ctx);
      const page = await ctx.newPage();
      for (let i = 0; i < 10; i++) {
        const b = (await live3d(page, q))[i];
        const x = b.x + b.w / 2, y = b.y + b.h / 2;
        expect(await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.id, [x, y])).toBe('stage');
        await page.mouse.move(x, y);
        await page.mouse.down();
        if (hold) await page.waitForTimeout(hold);
        await page.mouse.up();
        await page.waitForURL(new RegExp(`${HREFS[i].replace(/[?/]/g, '\\$&')}$`), { timeout: 30_000 });
        expect(seen.filter((e) => e.event === 'family_open').at(-1)?.props).toEqual({ family: FAMILIES[i], from: 'rock' });
      }
      await ctx.close();
    });
  }

  test('a click on a DOM control over the canvas never opens a family', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
    const page = await ctx.newPage();
    await live3d(page);
    await page.locator('#siteLogo').click();
    await page.waitForTimeout(800);
    expect(new URL(page.url()).pathname).toBe('/');
    await ctx.close();
  });

  test('rock, family page, Back: section 2 with the gems live and no loader, with and without the back-forward cache', async ({ browser }) => {
    for (const noStore of [false, true]) {
      const ctx = await browser.newContext(WIDE);
      if (noStore) await ctx.route((u) => u.pathname === '/', async (r) => { const res = await r.fetch(); await r.fulfill({ response: res, headers: { ...res.headers(), 'cache-control': 'no-store' } }); });
      const page = await ctx.newPage();
      const b = (await live3d(page))[1];
      await page.mouse.click(b.x + b.w / 2, b.y + b.h / 2);
      await page.waitForURL(/\/shades\/blissful-blues\//);
      await page.goBack();
      await page.waitForURL(/\/#families$/);
      await expect(page.locator('html')).toHaveClass(/\bhero3d\b/);
      await expect(page.locator('#intro')).toBeHidden();
      expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
      await expect(nav(page)).toHaveAttribute('data-placed', '', { timeout: 30_000 });
      await ctx.close();
    }
  });
});
