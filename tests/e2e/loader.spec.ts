// The loader's own behaviour (hero.md AC3.10, AC3.11; AC3.2 milestones in the island's spec). These run with the island
// held before its first byte (tests/harness/island.ts), so the loader is driven only through its own API: cut() for the
// lift, fail('') for the soft poster state, abort() for the hard path's removal.
import { test, expect, type Page } from '@playwright/test';
import { holdIsland } from '../harness/island.ts';

async function inertReport(page: Page) {
  return page.evaluate(() => {
    const keep = (e: Element) => e.id === 'intro' || e.tagName === 'SCRIPT' || e.matches('svg.sprite,picture.hero-poster,canvas#stage');
    const kids = [...document.body.children];
    return {
      missing: kids.filter((e) => !keep(e) && !e.hasAttribute('inert')).map((e) => e.tagName + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '')),
      extra: kids.filter((e) => keep(e) && e.hasAttribute('inert')).map((e) => e.tagName + '#' + e.id),
      any: document.querySelectorAll('[inert]').length,
    };
  });
}

test.describe('AC3.10 behind the loader', () => {
  test.beforeEach(async ({ context }) => { await holdIsland(context); });

  test('while loading, every body child but the loader, sprite, poster, canvas and scripts is inert; Tab never reaches the logotype', async ({ page }) => {
    await page.goto('/?tier=hero3d');
    await expect(page.locator('html')).toHaveClass(/loading/);
    const r = await inertReport(page);
    expect(r.missing).toEqual([]);
    expect(r.extra).toEqual([]);
    expect(r.any).toBeGreaterThan(0);
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)).not.toBe('siteLogo');
    }
  });

  test('after the lift no element is inert and the logotype takes focus', async ({ page }) => {
    await page.goto('/?tier=hero3d');
    await page.evaluate(() => window.__skreedLoader!.cut());
    await expect(page.locator('#intro')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator('html')).not.toHaveClass(/loading/);
    expect(await page.locator('[inert]').count()).toBe(0);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('siteLogo');
  });

  test('after a soft poster (offline before ready) no element is inert', async ({ page, context }) => {
    // fail('') is the Gate's module load-error path, a hard failure once boot.ts runs (architecture 7.3); the loader's own
    // offline rule is the quick soft poster
    await page.goto('/?tier=hero3d');
    await expect(page.locator('html')).toHaveClass(/loading/);
    await context.setOffline(true);
    await expect(page.locator('html')).toHaveClass(/poster/);
    await expect(page.locator('#intro')).toHaveClass(/po/);
    expect(await page.locator('#ldSt').textContent()).toBe('You are offline. The countdown still runs.');
    expect(await page.locator('[inert]').count()).toBe(0);
    await context.setOffline(false);
  });

  test('after an abort no element is inert and the loader is gone', async ({ page }) => {
    await page.goto('/?tier=hero3d');
    await page.evaluate(() => window.__skreedLoader!.abort());
    await expect(page.locator('#intro')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/loading/);
    expect(await page.locator('[inert]').count()).toBe(0);
  });
});

test.describe('AC3.11 deep links', () => {
  test.beforeEach(async ({ context }) => {
    await holdIsland(context);
    await context.addInitScript(() => {
      const w = window as unknown as { __scrollCalls: unknown[][] };
      w.__scrollCalls = [];
      const orig = window.scrollTo.bind(window);
      window.scrollTo = ((...a: unknown[]) => { w.__scrollCalls.push(a); return (orig as (...x: unknown[]) => void)(...a); }) as typeof window.scrollTo;
    });
  });

  test('without a hash the loader scrolls to the top once', async ({ page }) => {
    await page.goto('/?tier=hero3d');
    await expect(page.locator('#intro')).toBeAttached();
    expect(await page.evaluate(() => (window as unknown as { __scrollCalls: unknown[][] }).__scrollCalls)).toEqual([[0, 0]]);
  });

  test('with a hash the loader leaves the scroll alone and the deep link keeps its position', async ({ page }) => {
    await page.goto('/?tier=hero3d#main');
    await expect(page.locator('#intro')).toBeAttached();
    expect(await page.evaluate(() => (window as unknown as { __scrollCalls: unknown[][] }).__scrollCalls)).toEqual([]);
    await page.waitForFunction(() => scrollY > 0, null, { timeout: 5_000 });
    const y = await page.evaluate(() => scrollY);
    const top = await page.evaluate(() => (document.getElementById('main') as HTMLElement).getBoundingClientRect().top + scrollY);
    expect(Math.abs(y - top)).toBeLessThan(2);
  });
});
