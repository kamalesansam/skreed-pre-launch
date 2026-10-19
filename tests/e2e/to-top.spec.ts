// Back to top (Sam, 2026-10-19; src/components/shell/BackToTop.astro, src/scripts/shell/to-top.ts): on the landing page
// hidden in the first screen and shown past it, on a family page always; on the landing page a press reaches section 1 in place (no navigation, the page's state
// survives), keyboard focus lands on the logotype; on a family page a press returns to the landing page's section 1
// (through the history when the landing page is behind it, else by the link). The harness's Chromium has the
// back-forward cache disabled, so a history step reloads here; the restore itself is checked in real Chrome by hand.
import { test, expect, type Page } from '@playwright/test';

const events = (page: Page): Promise<string[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: { name: string }[] }).__skreedEvents ?? []).map((e) => e.name));

for (const vp of [{ name: '390 x 844', width: 390, height: 844 }, { name: '1280 x 800', width: 1280, height: 800 }]) {
  test(`landing page at ${vp.name}: hidden in section 1, shown past it, a press reaches section 1 with no reload`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(new URL('/?tier=poster', baseURL).href);
    await expect(page.locator('html')).toHaveClass('js poster');
    const btn = page.locator('#toTop');
    await expect(btn).toBeHidden();
    await page.evaluate(() => { (window as unknown as { __alive: boolean }).__alive = true; const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
    await expect(btn).toBeVisible();
    const box = (await btn.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width); expect(box.y).toBeGreaterThanOrEqual(0);
    await expect(btn).toHaveAttribute('aria-label', 'Back to top');
    await btn.click();
    await page.waitForFunction(() => scrollY === 0, null, { timeout: 5000 });
    expect(await page.evaluate(() => (window as unknown as { __alive?: boolean }).__alive)).toBe(true);   // no reload
    await expect(btn).toBeHidden();
    expect(await events(page)).toContain('to_top');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('landing page by keyboard: Enter on the control reaches section 1 and puts focus on the logotype', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await expect(page.locator('#toTop')).toBeVisible();
  await page.focus('#toTop');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => scrollY === 0, null, { timeout: 5000 });
  await expect(page.locator('#siteLogo')).toBeFocused();
});

test('family page: the control returns to the landing page\'s section 1, through the history when the landing page is behind it', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.goto(new URL('/shades/blissful-blue/', baseURL).href);
  const btn = page.locator('#toTop');
  await expect(btn).toHaveAttribute('href', '/');
  await expect(btn).toBeVisible();
  const box = (await btn.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(390); expect(box.y + box.height).toBeLessThanOrEqual(844);
  await btn.click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });
  await page.waitForFunction(() => scrollY === 0, null, { timeout: 10_000 });
  expect(await page.evaluate(() => sessionStorage.getItem('skreed:to-top'))).toBeNull();
});

test('family page with nothing behind it: the control is a link to the landing page', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/shades/go-green/', baseURL).href);
  await page.locator('#toTop').click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
