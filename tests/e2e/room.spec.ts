// Section 4 (docs/specs/section-4.md 7): AC1 the track's height before and after entering and no horizontal scroll, AC5
// the keyboard (the prompt is the section's first tabbable element and a focus on it snaps to the station; E does nothing
// without focus and enters with it; Skip takes focus at the press; the products are inert until the universe, then a
// roving tabindex), the analytics' room_view only once the section's top reaches the viewport top (not on the quiz),
// AC8 the loop's jump back to the top with the hero's followers at 0, and the poster tier's stills and list. The 3D path
// runs on SwiftShader here (?tier=hero3d), so the island specs drive the section by its hooks (__s4, __skreedRoom) at
// device pixel ratio 1 and skip the intro.
import { test, expect, type Page } from '@playwright/test';

type Ev = { name: string };
const events = (page: Page): Promise<string[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: Ev[] }).__skreedEvents ?? []).map((e) => e.name));

async function open3d(page: Page, baseURL: string | undefined): Promise<void> {
  await page.goto(new URL('/?tier=hero3d', baseURL).href);
  await page.waitForFunction(() => window.__heroStarted && !!window.__skreedIntro, null, { timeout: 540_000, polling: 500 });
  await page.evaluate(() => (window.__skreedIntro as unknown as { skip(): void }).skip());
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 300_000, polling: 500 });
}

/** the section's q (screens of its own height), the hero's followers and the section's snapped there */
async function goQ(page: Page, q: number): Promise<void> {
  await page.evaluate((qq) => {
    const room = document.getElementById('room')!, top = room.getBoundingClientRect().top + scrollY, y = top + qq * innerHeight;
    scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); window.__skreedRoom?.snap(qq);
  }, q);
}

const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('section 4 at 390 x 844: the track, the keyboard, the transition, the universe and the loop', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await open3d(page, baseURL);
  const H = await page.evaluate(() => innerHeight);

  // the quiz on screen: no room_view yet (the section's top is below the viewport's)
  await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await page.waitForTimeout(1500);
  expect(await events(page)).not.toContain('room_view');

  // the hall loads one section ahead; the section is 13 screens before entering
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 300_000, polling: 500 });
  expect(await page.evaluate(() => document.getElementById('room')!.offsetHeight)).toBeCloseTo(13 * H, -1);
  await goQ(page, 0.5);
  await expect.poll(() => events(page), { timeout: 30_000 }).toContain('room_view');
  expect(await noHScroll(page)).toBe(true);

  // W, S and E do nothing without focus (WCAG 2.1.4)
  await goQ(page, 4);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const y0 = await page.evaluate(() => scrollY);
  await page.keyboard.press('e'); await page.keyboard.press('s');
  expect(await page.evaluate(() => (window.__s4!.state() as { state: string }).state)).toBe('hall');
  expect(await page.evaluate(() => scrollY)).toBe(y0);

  // the prompt is the section's first tabbable element: a focus on it off-station snaps the page to the station
  const order = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#room button, #room [tabindex]')].filter((el) => el.tabIndex >= 0 && !el.hidden && !el.closest('[inert]')).map((el) => el.id || el.className));
  expect(order[0]).toBe('rmEnter');
  await page.focus('#rmEnter');
  await expect.poll(() => page.evaluate(() => (window.__s4!.state() as { q: number }).q), { timeout: 20_000 }).toBeGreaterThan(9);
  await expect(page.locator('#rmEnter')).toHaveClass(/is-near/, { timeout: 20_000 });

  // the products are inert until the universe
  expect(await page.evaluate(() => document.getElementById('rmProducts')!.inert)).toBe(true);

  // E with focus enters (once the universe's assets are in); Skip shows and takes focus; Enter on it skips to the universe
  await page.waitForFunction(() => (window.__s4!.state() as { universe: { ready: boolean } | null }).universe?.ready, null, { timeout: 300_000, polling: 500 });
  await page.keyboard.press('e');
  await expect.poll(() => page.evaluate(() => (window.__s4!.state() as { state: string }).state), { timeout: 20_000 }).toBe('entering');
  await expect(page.locator('#rmSkipWrap')).toBeVisible();
  await expect(page.locator('#rmSkip')).toBeFocused();
  expect(await noHScroll(page)).toBe(true);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window.__s4!.state() as { state: string }).state), { timeout: 30_000 }).toBe('universe');
  expect(await page.evaluate(() => document.getElementById('room')!.offsetHeight)).toBeCloseTo(15 * H, -1);
  expect(await events(page)).toEqual(expect.arrayContaining(['room_enter', 'room_skip']));

  // the universe: the list is live, one button tabbable, the arrows move it and the pan follows
  expect(await page.evaluate(() => document.getElementById('rmProducts')!.inert)).toBe(false);
  expect(await page.locator('.rm-product[tabindex="0"]').count()).toBe(1);
  await expect(page.locator('.rm-product[data-i="0"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.rm-product[data-i="1"]')).toBeFocused();
  await expect(page.locator('.rm-product[data-i="1"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('.rm-item[data-i="1"]')).toHaveClass(/is-shown/);
  for (const b of await page.locator('.rm-product').all()) expect(await b.getAttribute('aria-describedby')).toMatch(/^rmLine-/);
  expect(await noHScroll(page)).toBe(true);

  // the loop: past the pan the fourth wipe crosses the screen and the page jumps to the top with the hero at rest
  await page.evaluate(() => { const room = document.getElementById('room')!, top = room.getBoundingClientRect().top + scrollY; scrollTo({ top: top + 13.4 * innerHeight, behavior: 'instant' }); });
  await page.waitForFunction(() => scrollY < 2, null, { timeout: 120_000, polling: 250 });
  await expect.poll(() => page.evaluate(() => window.__skreedState!().sb), { timeout: 20_000 }).toBeLessThan(0.01);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('section 4 on the poster tier: the still, the prompt at once, the list after the press, no tall track', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await expect(page.locator('html')).toHaveClass('js poster');
  const room = page.locator('#room');
  await room.scrollIntoViewIfNeeded();
  const h = await page.evaluate(() => ({ room: document.getElementById('room')!.offsetHeight, vh: innerHeight }));
  expect(h.room).toBeLessThan(4 * h.vh);
  await expect(page.locator('#rmEnter')).toBeVisible();
  await expect(page.locator('#rmProducts')).toBeHidden();
  await page.locator('#rmEnter').click();
  await expect(room).toHaveAttribute('data-state', 'universe');
  await expect(page.locator('#rmProducts')).toBeVisible();
  expect(await page.locator('.rm-item:visible').count()).toBe(4);
  expect(await noHScroll(page)).toBe(true);
});
