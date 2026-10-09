// AC10.3 breakpoints and AC10.4 structure and accessibility (build step 4: the poster path and the loader state).
import { test, expect } from '@playwright/test';

const SIZES = [[360, 780], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 800]] as const;

for (const tier of ['poster', 'hero3d']) {
  for (const [w, h] of SIZES) {
    test(`AC10.3 ${w} x ${h} on the ${tier} path: no horizontal scroll, gutters at least 16 px`, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.goto(new URL(`/?tier=${tier}`, baseURL).href);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      const sel = tier === 'poster' ? ['#siteLogo svg', '#cdEyebrow', '#count', '#cue'] : ['#intro .ld-w', '#ldPct'];
      for (const s of sel) {
        const r = await page.locator(s).evaluate((e) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right }; });
        expect(r.l, `${s} left`).toBeGreaterThanOrEqual(16);
        expect(w - r.r, `${s} right`).toBeGreaterThanOrEqual(16);
      }
      await ctx.close();
    });
  }
}

test('AC10.4 one h1, first in reading order; canvas and labels hidden from assistive tech; visible focus; nothing in dvh', async ({ page }) => {
  await page.goto('/?tier=poster');
  await expect(page.locator('h1')).toHaveCount(1);
  expect(await page.evaluate(() => document.body.firstElementChild?.tagName)).toBe('H1');
  const tree = await page.locator('body').ariaSnapshot();
  expect(tree.split('\n')[0]).toBe('- heading "Skreed. Tech essentials that go beyond basic." [level=1]');
  await expect(page.locator('#stage')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#labels')).toHaveAttribute('aria-hidden', 'true');
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => { const a = document.activeElement as HTMLElement; const c = getComputedStyle(a); return { id: a.id, o: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`, off: c.outlineOffset }; });
  expect(ring).toEqual({ id: 'siteLogo', o: 'solid 2px rgb(255, 153, 0)', off: '6px' });
  const css = await page.evaluate(() => Array.from(document.querySelectorAll('style')).map((s) => s.textContent).join('\n'));
  expect(css).not.toMatch(/dvh/);
});

test('AC10.4 behind the loader (3D path while loading) nothing is focusable but the page itself', async ({ page }) => {
  await page.goto('/?tier=hero3d');
  await expect(page.locator('html')).toHaveClass(/\bloading\b/);
  const inert = await page.evaluate(() => Array.from(document.body.children).filter((e) => e.hasAttribute('inert')).map((e) => e.id || e.className || e.tagName));
  expect(inert).toEqual(expect.arrayContaining(['siteLogo', 'heroCopy', 'cue', 'labels', 'track', 'main']));
  for (const keep of ['intro', 'stage']) expect(inert).not.toContain(keep);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)).not.toBe('siteLogo');
  // the loader's poster state (a soft failure) releases inert
  await page.evaluate(() => window.__skreedLoader!.fail(''));
  await expect(page.locator('html')).toHaveClass(/\bposter\b/);
  expect(await page.evaluate(() => document.querySelectorAll('[inert]').length)).toBe(0);
});
