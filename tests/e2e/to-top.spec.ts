// Back to top (Sam, 2026-10-19, 2026-10-20 and 2026-11-04; src/components/shell/BackToTop.astro, src/scripts/shell/to-top.ts):
// on a family page always shown, and a press scrolls the same page to its top, the carousel of its cases, never leaving it
// (since 2026-11-04: "take the same page top section where all sahde 3d models are there"). On the landing page the section index's Home makes the jump the control made
// there (docs/specs/navbar.md, 2026-11-02): section 1 in place (no navigation, the page's state survives), keyboard focus
// on the logotype, and the landing page draws no control of its own. The harness's Chromium has the back-forward cache
// disabled, so a history step reloads here; the restore itself is checked in real Chrome by hand.
import { test, expect, type Page } from '@playwright/test';

const events = (page: Page): Promise<string[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: { name: string }[] }).__skreedEvents ?? []).map((e) => e.name));

for (const vp of [{ name: '390 x 844', width: 390, height: 844 }, { name: '1280 x 800', width: 1280, height: 800 }]) {
  test(`landing page at ${vp.name}: no control of its own; the section index's Home reaches section 1 with no reload`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(new URL('/?tier=poster', baseURL).href);
    await expect(page.locator('html')).toHaveClass('js poster');
    await expect(page.locator('#toTop')).toHaveCount(0);   // Home took its place at the top right (docs/specs/navbar.md, 2026-11-02)
    await expect(page.locator('#toTopVeil')).toHaveCount(1);   // the veil every jump on the landing page happens under stays
    await page.evaluate(() => { (window as unknown as { __alive: boolean }).__alive = true; const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
    if (vp.width < 768) await page.locator('#siteNav .snav-menu').click();
    const home = page.locator(vp.width < 768 ? '#site-sections a[data-sec="top"]' : '#siteNav .snav-list a[data-sec="top"]');
    await expect(home).toBeVisible();
    await expect(home).toHaveText('Home');
    await home.click();
    await page.waitForFunction(() => scrollY === 0, null, { timeout: 5000 });
    expect(await page.evaluate(() => (window as unknown as { __alive?: boolean }).__alive)).toBe(true);   // no reload
    expect(await events(page)).toContain('nav');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('landing page by keyboard: Enter on Home reaches section 1 and puts focus on the logotype', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await page.focus('#siteNav .snav-list a[data-sec="top"]');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => scrollY === 0, null, { timeout: 5000 });
  await expect(page.locator('#siteLogo')).toBeFocused();
});

test('family page: the control scrolls the same page to its top, the carousel, and never leaves it (2026-11-04)', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/shades/blissful-blue/', baseURL).href);
  const btn = page.locator('#toTop');
  await expect(btn).toHaveAttribute('href', '#');
  await page.evaluate(() => scrollTo({ top: 6 * innerHeight, behavior: 'instant' }));
  await expect(btn).toBeVisible();
  const box = (await btn.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(390); expect(box.y + box.height).toBeLessThanOrEqual(844);
  const before = page.url();
  await btn.click();
  await page.waitForFunction(() => scrollY === 0, null, { timeout: 10_000 });
  expect(page.url()).toBe(before);
  expect(new URL(page.url()).pathname).toBe('/shades/blissful-blue/');
  expect(await events(page)).toContain('to_top');
});

test('family page by keyboard: Enter on the control scrolls to the top and puts focus on the family\'s name', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/shades/go-green/', baseURL).href);
  await page.evaluate(() => scrollTo({ top: 3 * innerHeight, behavior: 'instant' }));
  await page.locator('#toTop').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => scrollY === 0, null, { timeout: 10_000 });
  await expect(page.locator('h1')).toBeFocused();
  expect(new URL(page.url()).pathname).toBe('/shades/go-green/');
});
