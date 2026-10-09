// AC7, AC8: tiers and the poster path (build step 4). The Gate's cases are complete here; the boot.ts cases
// (--disable-3d-apis, the production build's software renderer, an aborted hero chunk, a context loss) arrive with
// boot.ts in build steps 6 and 9.
import { test, expect, type BrowserContext, type Request } from '@playwright/test';
import { statSync, readdirSync } from 'node:fs';

const ISLAND = /three|hero\.|pieces|\.bin|sky\.|ground|boot/;

const GATE_CASES: Record<string, (ctx: BrowserContext) => Promise<void>> = {
  'WebGL2RenderingContext deleted': (ctx) => ctx.addInitScript(() => { delete (window as unknown as Record<string, unknown>).WebGL2RenderingContext; }),
  'DecompressionStream deleted': (ctx) => ctx.addInitScript(() => { delete (window as unknown as Record<string, unknown>).DecompressionStream; }),
  'saveData true': (ctx) => ctx.addInitScript(() => { Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' }, configurable: true }); }),
  'effectiveType 2g': (ctx) => ctx.addInitScript(() => { Object.defineProperty(navigator, 'connection', { value: { saveData: false, effectiveType: '2g' }, configurable: true }); }),
  'deviceMemory 2': (ctx) => ctx.addInitScript(() => { Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true }); }),
};

for (const [name, setup] of Object.entries(GATE_CASES)) {
  test(`AC8.1 and AC8.3 Gate: ${name} lands on the poster and requests no island bytes`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext();
    await setup(ctx);
    const reqs: string[] = [];
    ctx.on('request', (r) => reqs.push(r.url()));
    const page = await ctx.newPage();
    await page.goto(baseURL!);
    await expect(page.locator('html')).toHaveClass('js poster');
    await expect(page.locator('#posterImg')).toBeVisible();
    expect(await page.locator('#intro').evaluate((e) => getComputedStyle(e).display)).toBe('none');
    expect(reqs.filter((u) => ISLAND.test(new URL(u).pathname))).toEqual([]);
    await ctx.close();
  });
}

test('the Gate picks hero3d with WebGL2 and DecompressionStream and no data saver (headless defaults)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass('js hero3d loading');
});

test('AC7 reduced motion: poster tier, no loader, no seconds, still cue, no island bytes', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const reqs: string[] = [];
  ctx.on('request', (r) => reqs.push(r.url()));
  const page = await ctx.newPage();
  await page.goto(baseURL!);
  await expect(page.locator('html')).toHaveClass('js poster');
  expect(await page.locator('#intro').evaluate((e) => getComputedStyle(e).display)).toBe('none');
  expect(await page.locator('#count .sec').evaluate((e) => getComputedStyle(e).display)).toBe('none');
  expect(await page.locator('#cue .ball').evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  expect(reqs.filter((u) => ISLAND.test(new URL(u).pathname))).toEqual([]);
  await ctx.close();
});

test('the ?tier= override: still3d keeps the 3D path classes (test build only)', async ({ page }) => {
  await page.goto('/?tier=still3d');
  await expect(page.locator('html')).toHaveClass('js hero3d loading still3d');
});

for (const vp of [{ name: '390 x 844', viewport: { width: 390, height: 844 }, cls: 'portrait' }, { name: '1280 x 800', viewport: { width: 1280, height: 800 }, cls: 'wide' }]) {
  test(`AC8.2 and AC8.4 the poster path at ${vp.name}: layout, scroll-away, one poster request (${vp.cls} AVIF)`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: vp.viewport });
    const images: Request[] = [];
    ctx.on('request', (r) => { if (/\.(avif|webp)$/.test(new URL(r.url()).pathname)) images.push(r); });
    const page = await ctx.newPage();
    const logs: string[] = [];
    page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`pageerror: ${e}`));
    await page.goto(new URL('/?tier=poster', baseURL).href, { waitUntil: 'networkidle' });
    const H = vp.viewport.height, W = vp.viewport.width;
    // one request, the class's AVIF (Chromium supports AVIF)
    expect(images.map((r) => new URL(r.url()).pathname.replace(/\.[^.]+\.(avif|webp)$/, '.$1').replace('/_astro/', ''))).toEqual([`${vp.cls}.avif`]);
    expect(await page.evaluate(() => (document.getElementById('posterImg') as HTMLImageElement).currentSrc)).toMatch(new RegExp(`/_astro/${vp.cls}\\.[\\w-]+\\.avif$`));
    // layout: poster in the first screen, track 100svh, countdown not fixed
    const img = (await page.locator('#posterImg').boundingBox())!;
    expect([img.x, img.y, img.width, img.height]).toEqual([0, 0, W, H]);
    expect(await page.locator('#posterImg').evaluate((e) => getComputedStyle(e).position)).toBe('absolute');
    expect(await page.locator('#track').evaluate((e) => e.getBoundingClientRect().height)).toBe(H);
    expect(await page.locator('#heroCopy').evaluate((e) => getComputedStyle(e).position)).toBe('absolute');
    expect(await page.locator('#stage').evaluate((e) => getComputedStyle(e).display)).toBe('none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // the cue shows while there is content below and the page has not moved
    await expect(page.locator('#cue')).not.toHaveClass(/is-off/);
    await page.evaluate(() => scrollTo(0, 9));
    await expect(page.locator('#cue')).toHaveClass(/is-off/);
    // the poster and the countdown scroll away with the first screen
    await page.evaluate((h) => scrollTo(0, h), H);
    expect(await page.locator('#posterImg').evaluate((e) => e.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
    expect(await page.locator('#count').evaluate((e) => e.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
    // the countdown and the logotype still work
    expect(await page.locator('#count').getAttribute('data-ready')).toBe('');
    await page.locator('#siteLogo').click();
    await page.waitForFunction(() => scrollY === 0);
    // without anything below the hero (production), the cue is hidden
    await page.evaluate(() => { document.getElementById('main')?.remove(); dispatchEvent(new Event('resize')); });
    await expect(page.locator('#cue')).toHaveClass(/is-off/);
    expect(logs).toEqual([]);
    await ctx.close();
  });
}

test('AC8.4 poster markup: one <picture>, four sources split at aspect 0.9, one <img>, two AVIF preloads', async ({ page }) => {
  await page.goto('/?tier=poster');
  const pics = await page.locator('picture').count();
  expect(pics).toBe(1);
  const sources = await page.locator('picture.hero-poster source').evaluateAll((els) => els.map((e) => ({
    type: e.getAttribute('type'), media: e.getAttribute('media'), srcset: e.getAttribute('srcset'), width: e.getAttribute('width'), height: e.getAttribute('height'),
  })));
  const wide = '(min-aspect-ratio: 9/10)', portrait = 'not all and (min-aspect-ratio: 9/10)';
  expect(sources.map((s) => [s.type, s.media, s.width, s.height])).toEqual([
    ['image/avif', wide, '1920', '1200'], ['image/webp', wide, '1920', '1200'],
    ['image/avif', portrait, '488', '1056'], ['image/webp', portrait, '488', '1056'],
  ]);
  for (const s of sources) expect(s.srcset).toMatch(/^\/_astro\/(wide|portrait)\.[\w-]+\.(avif|webp)$/);
  const img = page.locator('picture.hero-poster img');
  await expect(img).toHaveCount(1);
  await expect(img).toHaveAttribute('id', 'posterImg');
  await expect(img).toHaveAttribute('width', '488');
  await expect(img).toHaveAttribute('height', '1056');
  await expect(img).toHaveAttribute('alt', 'The Skreed mark in ten black blocks on a moonlit snowfield.');
  await expect(img).toHaveAttribute('fetchpriority', 'high');
  await expect(img).toHaveAttribute('decoding', 'async');
  expect(await img.getAttribute('loading')).toBeNull();
  const preloads = await page.locator('link[rel="preload"][as="image"]').evaluateAll((els) => els.map((e) => [e.getAttribute('type'), e.getAttribute('media'), e.getAttribute('href'), e.getAttribute('fetchpriority')]));
  expect(preloads).toEqual([
    ['image/avif', wide, sources[0].srcset, 'high'],
    ['image/avif', portrait, sources[2].srcset, 'high'],
  ]);
});

test('AC8.4 each poster file is at most 120 KB', () => {
  const dir = new URL('../../src/assets/hero/poster/', import.meta.url);
  const files = readdirSync(dir);
  expect(files.sort()).toEqual(['portrait.avif', 'portrait.webp', 'wide.avif', 'wide.webp']);
  for (const f of files) expect(statSync(new URL(f, dir)).size, f).toBeLessThanOrEqual(120_000);
});

test('without JavaScript the page is the poster layout', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(baseURL!);
  expect(await page.evaluate(() => document.documentElement.className)).toBe('');
  await expect(page.locator('#posterImg')).toBeVisible();
  expect(await page.locator('#intro').evaluate((e) => getComputedStyle(e).display)).toBe('none');
  expect(await page.locator('#track').evaluate((e) => e.getBoundingClientRect().height)).toBe(844);
  await ctx.close();
});
