// Section 4 (docs/specs/section-4.md 7 for the hall; docs/specs/section-4-world.md 7 for the rest): AC1 the track's
// height in the hall and once entered (12 + 2N screens) and no horizontal scroll; AC6 the keyboard (the prompt is the
// section's first tabbable element and a focus on it snaps to the station; E does nothing without focus and enters with
// it; Skip takes focus at the press and hands it to land 1's name; single presses of Down and Up travel, a held repeat
// does not; the lands' names, lines and alts are all exposed; the pad's label follows the state); AC7 a 5-screen scroll
// during the entry clock ends on land 1 at its station with no travel started, a scroll to the document's end during a
// travel ends on its land with no jump, and back to top stops every clock; the loop's jump back to the top with the
// hero's followers at 0; the analytics' room_view only once the section's top reaches the viewport top; and the poster
// tier's still and column. With no land in the build (N = 0, production until Sam approves land 1) the prompt never
// shows and the hall's walk and loop are what is tested. The 3D path runs on SwiftShader here (?tier=hero3d), so the
// island specs drive the section by its hooks (__s4, __skreedRoom) at device pixel ratio 1 and skip the intro.
import { test, expect, type Page } from '@playwright/test';

type Ev = { name: string; props: Record<string, string | number> };
type S4 = { state: string; sub: string; land: number; lands: number; q: number; arrive: number; worldReady: boolean; travel: { from: number; to: number } | null };
const events = (page: Page): Promise<string[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: Ev[] }).__skreedEvents ?? []).map((e) => e.name));
const s4 = (page: Page): Promise<S4> => page.evaluate(() => window.__s4!.state() as S4);

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
/** the section's own q from the page's scroll, in screens of its own height */
const pageQ = (page: Page) => page.evaluate(() => { const room = document.getElementById('room')!; return -room.getBoundingClientRect().top / innerHeight; });
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const focusedId = (page: Page) => page.evaluate(() => document.activeElement?.id ?? '');

test('section 4 at 390 x 844: the track, the keyboard, the entry, the lands, the travels and the loop', async ({ browser, baseURL }) => {
  test.setTimeout(1_500_000);
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
  const N = (await s4(page)).lands;
  expect(await page.locator('#room').getAttribute('data-lands')).toBe(String(N));

  // W, S and E do nothing without focus (WCAG 2.1.4)
  await goQ(page, 4);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const y0 = await page.evaluate(() => scrollY);
  await page.keyboard.press('e'); await page.keyboard.press('s');
  expect((await s4(page)).state).toBe('hall');
  expect(await page.evaluate(() => scrollY)).toBe(y0);
  // the pad has a role and its label
  await expect(page.locator('#rmPad')).toHaveAttribute('role', 'group');
  await expect(page.locator('#rmPad')).toHaveAttribute('aria-label', 'The entrance. Use the arrow keys to walk to the door.');

  if (N === 0) {
    // no land: the prompt never shows, E at the station does nothing, and the hall's loop still jumps to the top
    await expect(page.locator('#rmEnter')).toBeHidden();
    await goQ(page, 9.5); await page.focus('#rmPad'); await page.keyboard.press('e'); await page.waitForTimeout(800);
    expect((await s4(page)).state).toBe('hall');
    await expect(page.locator('#rmEnter')).toBeHidden();
    await page.evaluate(() => { const room = document.getElementById('room')!, top = room.getBoundingClientRect().top + scrollY; scrollTo({ top: top + 11.4 * innerHeight, behavior: 'instant' }); });
    await page.waitForFunction(() => scrollY < 2, null, { timeout: 120_000, polling: 250 });
    expect(errors).toEqual([]);
    await ctx.close();
    return;
  }

  // the prompt is the section's first tabbable element: a focus on it off-station snaps the page to the station
  const order = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#room button, #room [tabindex]')].filter((el) => el.tabIndex >= 0 && !el.hidden && !el.closest('[inert]')).map((el) => el.id || el.className));
  expect(order[0]).toBe('rmEnter');
  await page.focus('#rmEnter');
  await expect.poll(async () => (await s4(page)).q, { timeout: 20_000 }).toBeGreaterThan(9);
  await expect(page.locator('#rmEnter')).toHaveClass(/is-near/, { timeout: 20_000 });
  await expect(page.locator('#rmEnter .rm-enter-text .sr-only')).toHaveText('Enter Skreed universe');
  // the lands are inert in the hall, every one in the tree with its name, lines and alt
  expect(await page.evaluate(() => document.getElementById('rmLands')!.inert)).toBe(true);
  expect(await page.locator('.rm-land').count()).toBe(N);
  for (const li of await page.locator('.rm-land').all()) {
    for (const c of ['.rm-land-name', '.rm-land-family', '.rm-land-line', '.rm-land-count', '.rm-land-alt']) expect(await li.locator(c).count()).toBe(1);
    expect(await li.getAttribute('hidden')).toBeNull();
  }

  // E with focus enters (once the world and land 1 are in); Skip shows and takes focus; the track grows to 12 + 2N
  await page.waitForFunction(() => (window.__s4!.state() as { worldReady: boolean }).worldReady, null, { timeout: 600_000, polling: 500 });
  await page.keyboard.press('e');
  await expect.poll(async () => (await s4(page)).state, { timeout: 20_000 }).toBe('entering');
  await expect(page.locator('#rmSkip')).toBeVisible();
  await expect(page.locator('#rmSkip')).toBeFocused();
  expect(await page.evaluate(() => document.getElementById('room')!.offsetHeight)).toBeCloseTo((12 + 2 * N) * H, -1);
  expect(await noHScroll(page)).toBe(true);
  // a 5-screen scroll during the entry clock: the loop is held, and the clock's end puts the page at land 1's station
  await page.mouse.wheel(0, 5 * H); await page.waitForTimeout(400);
  expect((await s4(page)).state).toBe('entering');
  const arrive = (await s4(page)).arrive;
  await page.evaluate((t) => { window.__s4!.seek(t); window.__s4!.seek(-1); }, Math.max(0, arrive - 0.3));   // near its end, then the clock runs out by itself
  await expect.poll(async () => (await s4(page)).state, { timeout: 60_000 }).toBe('world');
  await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(10, 1);
  let st = await s4(page);
  expect(st.land).toBe(0);
  expect(await events(page)).not.toContain('room_travel');
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(H);   // no jump to the hero
  await expect(page.locator('#rmSkip')).toBeHidden({ timeout: 10_000 });
  await expect(page.locator('#rmPad')).toHaveAttribute('aria-label', 'The Skreed world. Use Down and Up to travel.');
  await expect(page.locator('.rm-land[data-i="0"]')).toHaveClass(/is-on/);
  expect(await page.evaluate(() => document.getElementById('rmLands')!.inert)).toBe(false);
  for (const name of await page.locator('.rm-land-name').all()) expect(await name.getAttribute('aria-describedby')).toMatch(/^rmAlt-/);
  expect(await noHScroll(page)).toBe(true);
  expect(await events(page)).toEqual(expect.arrayContaining(['room_enter', 'room_land']));

  if (N > 1) {
    // a single press of Down with the pad focused travels to land 2; the keyboard's focus lands on its name
    await page.focus('#rmPad');
    await page.keyboard.press('ArrowDown');
    await expect.poll(async () => (await s4(page)).land, { timeout: 30_000 }).toBe(1);
    await expect.poll(async () => (await s4(page)).sub, { timeout: 30_000 }).toBe('rest');
    await expect(page.locator('#rmName-' + (await page.locator('.rm-land[data-i="1"]').getAttribute('data-id')))).toBeFocused({ timeout: 10_000 });
    await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(12, 1);
    expect(await events(page)).toContain('room_travel');
    // a held key repeats nothing: one down, one repeat, and Up travels once, back to land 1
    await page.keyboard.down('ArrowUp'); await page.keyboard.down('ArrowUp'); await page.keyboard.up('ArrowUp');
    await expect.poll(async () => (await s4(page)).land, { timeout: 30_000 }).toBe(0);
    await page.waitForTimeout(1500);
    st = await s4(page); expect(st.land).toBe(0);
    await expect.poll(async () => (await s4(page)).sub, { timeout: 30_000 }).toBe('rest');
    // a scroll past land 1's trigger starts the travel to land 2 on its own clock
    await goQ(page, 10.7);
    await expect.poll(async () => (await s4(page)).land, { timeout: 30_000 }).toBe(1);
    await expect.poll(async () => (await s4(page)).sub, { timeout: 30_000 }).toBe('rest');
    // the last travel, and a scroll to the document's end during it: it ends on the last land at its station, no jump
    for (let i = 2; i < N; i++) {
      await page.focus('#rmPad');
      await page.evaluate(() => window.__skreedRoom!.travel(1));
      if (i === N - 1) { await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); }
      await expect.poll(async () => (await s4(page)).land, { timeout: 30_000 }).toBe(i);
      await expect.poll(async () => (await s4(page)).sub, { timeout: 30_000 }).toBe('rest');
    }
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(H);
    await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(10 + 2 * (N - 1), 1);
    // back to top during a travel stops every clock: section 1 in place, the hall again for the next lap
    await page.evaluate(() => window.__skreedRoom!.travel(-1));
    await page.evaluate(() => window.__skreedTop!());
    await expect.poll(async () => (await s4(page)).state, { timeout: 10_000 }).toBe('hall');
    expect((await s4(page)).travel).toBeNull();
    expect(await page.evaluate(() => scrollY)).toBeLessThan(2);
    // the next lap: walk again, press, and Skip with Enter (past its 350 ms guard) lands at land 1 with the name focused
    await goQ(page, 9.5); await page.focus('#rmEnter');
    await page.waitForFunction(() => (window.__s4!.state() as { worldReady: boolean }).worldReady, null, { timeout: 600_000, polling: 500 });
    await page.keyboard.press('e');
    await expect(page.locator('#rmSkip')).toBeFocused({ timeout: 20_000 });
    await page.waitForTimeout(450);
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await s4(page)).state, { timeout: 30_000 }).toBe('world');
    await expect(page.locator('#rmName-' + (await page.locator('.rm-land[data-i="0"]').getAttribute('data-id')))).toBeFocused({ timeout: 10_000 });
    expect(await events(page)).toContain('room_skip');
    await page.evaluate((n) => window.__s4!.land(n - 1), N);
    await expect.poll(async () => (await s4(page)).land, { timeout: 30_000 }).toBe(N - 1);
  }

  // the loop: past the last land the fourth wipe crosses the screen and the page jumps to the top with the hero at rest
  await page.evaluate((n) => { const room = document.getElementById('room')!, top = room.getBoundingClientRect().top + scrollY; scrollTo({ top: top + (9 + 2 * n + 1.4) * innerHeight, behavior: 'instant' }); }, N);
  await page.waitForFunction(() => scrollY < 2, null, { timeout: 120_000, polling: 250 });
  await expect.poll(() => page.evaluate(() => window.__skreedState!().sb), { timeout: 20_000 }).toBeLessThan(0.01);
  expect(await events(page)).toContain('room_loop');
  expect(errors).toEqual([]);
  await ctx.close();
});

test('section 4 on the poster tier: the still, the prompt at once, the lands in a column after the press, no tall track', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await expect(page.locator('html')).toHaveClass('js poster');
  const room = page.locator('#room');
  await room.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const N = Number(await room.getAttribute('data-lands'));
  const h = await page.evaluate(() => ({ room: document.getElementById('room')!.offsetHeight, vh: innerHeight }));
  expect(h.room).toBeLessThan(4 * h.vh);
  await expect(page.locator('#rmLands')).toHaveCount(N ? 1 : 0);
  if (!N) { await expect(page.locator('#rmEnter')).toBeHidden(); return; }
  await expect(page.locator('#rmEnter')).toBeVisible();
  await expect(page.locator('#rmLands')).toBeHidden();
  await page.locator('#rmEnter').click();
  await expect(room).toHaveAttribute('data-state', 'world');
  await expect(page.locator('#rmLands')).toBeVisible();
  expect(await page.locator('.rm-land:visible').count()).toBe(N);
  await expect(page.locator('.rm-land[data-i="0"] .rm-land-name')).toBeFocused();
  // one per screen, each its picture (AVIF with WebP, sized) over its text
  for (const li of await page.locator('.rm-land').all()) {
    expect((await li.boundingBox())!.height).toBeGreaterThanOrEqual(h.vh - 1);
    expect(await li.locator('picture source[type="image/avif"]').count()).toBe(2);
    expect(await li.locator('img').getAttribute('width')).toBe('1920');
  }
  expect(await noHScroll(page)).toBe(true);
});
