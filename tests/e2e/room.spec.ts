// Section 4 (docs/specs/section-4-flux.md 7 for the scenes; docs/specs/section-4-no-hall.md 7 since the hall left on
// 2026-11-02; docs/specs/section-5.md 2 and section-5-picture.md 18 for the end): AC5 the track's 4.8 screens in every state and no horizontal scroll; AC2 straight in (the approach shows
// no text, the pad's focus by a visitor puts the page on scene 1 and the arrival takes that focus on to scene 1's name,
// the scenes' names, lines and alts all exposed, the pad's label the scenes'); AC3 the arrival's hold (a jump from the
// approach past the scenes is put back on scene 1 and stays there, a wheel fling's tail never steps, a finger dragged
// across scene 1 rests on it at its release, PageDown or Space held from the quiz's foot rests on scene 1); AC4 the edges
// (a backward wheel at scene 1 is the page's, right after the carrying fling too, and the section goes back to its
// approach, "Previous scene" disabled at scene 1, "Next scene" at scene 5); one
// step a gesture through the hooks (the page snapped to the scene's q when it ends, a step during a step swallowed, a
// position change re-syncing the scene); the fourth wipe onto section 5 from q 3.8 (no exit seam since 2026-11-03: a notch
// down at section 5's rest runs nothing) and no wrap from the top (2026-11-04, docs/specs/scroll-steps.md 2: a wheel burst
// up and ArrowUp at scroll 0 leave the page at the hero); section-4-flux.md AC14's states (a blocked loop route, a rejected
// play(), products.bin blocked, a lost context in the scenes); the glue at section 4's seam with a Tab into the quiz that never
// settles; Ctrl+wheel in range and a one-finger pan at visualViewport.scale 2 that never step; the still3d path under
// reduced motion; and the poster tier's column at once. The 3D path runs on SwiftShader here (?tier=hero3d), so the
// island specs drive the section by its hooks (__s4, __skreedRoom) at device pixel ratio 1, skip the intro and turn the
// glue off (?glue=0: every q is set by scrollTo) except the glue's own case.
import { test, expect, type Page } from '@playwright/test';

type Ev = { name: string; props: Record<string, string | number> };
type S4 = { state: string; under: string; scene: number; wipeOut: number; restY: number; step: number; busy: boolean; inRange: boolean; q: number; qRaw: number; hold: { y: number } | null; ready: boolean; failed: boolean; settled: boolean; products: string; video: boolean; loops: { i: number; state: string; in: boolean; refused: boolean; playing: boolean }[]; memory: number; layout: { top: number; height: number; intro: boolean } | null };
const events = (page: Page): Promise<string[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: Ev[] }).__skreedEvents ?? []).map((e) => e.name));
const s4 = (page: Page): Promise<S4> => page.evaluate(() => window.__s4!.state() as S4);
const N = 5, WIPE4_START = 3.8;
/** section 5's rest (section-5.md 2), from the director's hooks */
const restY = (page: Page) => page.evaluate(() => (window.__s4!.state() as { restY: number }).restY);

async function open3d(page: Page, baseURL: string | undefined): Promise<void> {
  await page.goto(new URL('/?tier=hero3d&glue=0&room=open', baseURL).href);
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
/** the page's own scroll to the section's q, as a scrollbar or a key moves it: no snap of the section's own */
const scrollQ = (page: Page, q: number) => page.evaluate((qq) => { const room = document.getElementById('room')!, top = room.getBoundingClientRect().top + scrollY; scrollTo({ top: top + qq * innerHeight, behavior: 'instant' }); }, q);
/** the section's own q from the page's scroll, in screens of its own height */
const pageQ = (page: Page) => page.evaluate(() => { const room = document.getElementById('room')!; return -room.getBoundingClientRect().top / innerHeight; });
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
/** a decoded line's text (the decode's visually hidden copy) */
const said = (page: Page, sel: string) => page.locator(`${sel} .sr-only`).first().textContent({ timeout: 2_000 }).catch(() => '');
const URBAN_SLATE_CSS = 'rgb(56, 63, 67)';
/** the quiz on screen, then the scenes' phases settled (scene 1 drawable or failed, products.bin in or failed) */
async function scenesIn(page: Page): Promise<void> {
  await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 600_000, polling: 500 });
}

test('section 4 at 390 x 844: the track, the approach, the pad, the arrival and its hold, the edges, the five scenes by five steps, the hold, no exit from section 5 (2026-11-03), no wrap from the top (2026-11-04)', async ({ browser, baseURL }) => {
  test.setTimeout(1_500_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await open3d(page, baseURL);
  const H = await page.evaluate(() => innerHeight);

  // the quiz on screen: no room_view yet (the section's top is below the viewport's); the scenes load one section ahead
  await scenesIn(page);
  expect(await events(page)).not.toContain('room_view');
  // the section is 4.8 screens in every state (section-5-picture.md 18: the stage unpins as the cut begins, section 5 rising under it)
  expect(await page.evaluate(() => document.getElementById('room')!.offsetHeight)).toBeCloseTo(4.8 * H, -1);
  // the director's cached layout is a reading taken after the intro, at the section's real top (D1: a reading under
  // html.intro, with the hero's track collapsed, is replaced when the intro ends)
  await expect.poll(async () => (await s4(page)).layout?.intro, { timeout: 10_000 }).toBe(false);
  expect((await s4(page)).layout!.top).toBeCloseTo(await page.evaluate(() => document.getElementById('room')!.getBoundingClientRect().top + scrollY), 0);

  // the approach, inside the third wipe: scene 1 under it, no line and no word of the section, the scenes inert
  await goQ(page, 0.5);
  await expect.poll(() => events(page), { timeout: 30_000 }).toContain('room_view');
  expect((await s4(page)).state).toBe('approach');
  expect((await s4(page)).scene).toBe(0);
  expect(await page.locator('.rm-scene.is-on').count()).toBe(0);
  await expect(page.locator('#rmNav')).toBeHidden();
  expect(await page.evaluate(() => document.getElementById('rmScenes')!.inert)).toBe(true);
  expect(await noHScroll(page)).toBe(true);
  expect(await page.locator('.rm-scene').count()).toBe(N);
  for (const gone of ['#rmEnter', '#rmSkip', '#rmHint', '.rm-still']) expect(await page.locator(gone).count(), `${gone} is gone with the hall`).toBe(0);
  for (const li of await page.locator('.rm-scene').all()) {
    for (const c of ['.rm-scene-name', '.rm-scene-shade', '.rm-scene-line', '.rm-scene-count', '.rm-scene-alt']) expect(await li.locator(c).count()).toBe(1);
    expect(await li.getAttribute('hidden')).toBeNull();
  }

  // the pad is the section's first tabbable element; a visitor's focus on it during the approach puts the page on scene 1,
  // and the arrival takes the focus on to scene 1's name
  await expect(page.locator('#rmPad')).toHaveAttribute('role', 'group');
  await expect(page.locator('#rmPad')).toHaveAttribute('aria-label', 'The five scenes. Use Down and Up to move between them.');
  const order = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#room button, #room [tabindex]')].filter((el) => el.tabIndex >= 0 && !el.hidden && !el.closest('[inert]')).map((el) => el.id || el.className));
  expect(order[0]).toBe('rmPad');
  // a click on the stage focuses the pad too, but moves nothing (D4: only a keyboard focus puts the page on scene 1)
  await page.mouse.click(200, 700);
  await page.waitForTimeout(600);
  expect((await s4(page)).state).toBe('approach');
  expect(await pageQ(page)).toBeCloseTo(0.5, 1);
  // a Tab from the quiz's last control onto the pad: the page to scene 1, the focus on to scene 1's name
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.focus('#qzBegin');
  for (let i = 0; i < 6 && !(await page.evaluate(() => { const a = document.activeElement; return !!a && (a.id === 'rmPad' || a.classList.contains('rm-scene-name')); })); i++) await page.keyboard.press('Tab');
  await expect.poll(async () => (await s4(page)).state, { timeout: 20_000 }).toBe('world');
  await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(1, 1);
  expect((await s4(page)).scene).toBe(0);
  await expect(page.locator('#rmName-' + (await page.locator('.rm-scene[data-i="0"]').getAttribute('data-id')))).toBeFocused({ timeout: 10_000 });
  await expect(page.locator('.rm-scene[data-i="0"]')).toHaveClass(/is-on/);
  await expect(page.locator('#room')).toHaveAttribute('data-scene', '0');
  expect(await page.evaluate(() => document.getElementById('rmScenes')!.inert)).toBe(false);
  for (const name of await page.locator('.rm-scene-name').all()) expect(await name.getAttribute('aria-describedby')).toMatch(/^rmAlt-/);
  await expect(page.locator('#rmNav')).toBeVisible();
  await expect(page.locator('#rmPrev')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#rmNext')).not.toHaveAttribute('aria-disabled', 'true');
  expect(await events(page)).toContain('room_scene');
  await expect.poll(() => said(page, '.rm-scene[data-i="0"] .rm-scene-shade'), { timeout: 10_000 }).toBe('Lilac, vivid violet');
  expect(await noHScroll(page)).toBe(true);

  // at scene 1 a backward wheel is the page's: it scrolls up into the wipe and the section goes back to its approach
  await page.mouse.move(200, 400);
  await page.waitForTimeout(400);
  await page.mouse.wheel(0, -200);
  await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeLessThan(0.95);
  await expect.poll(async () => (await s4(page)).state, { timeout: 10_000 }).toBe('approach');
  await expect(page.locator('#rmNav')).toBeHidden({ timeout: 10_000 });
  expect((await s4(page)).scene).toBe(0);

  // the arrival's hold: the page's own scroll from the approach to deep in the scenes (a scrollbar, a fling's end) is put
  // back on scene 1 and stays there
  await scrollQ(page, 0.4); await page.waitForTimeout(400);
  await scrollQ(page, 2.4);
  await expect.poll(() => pageQ(page), { timeout: 5_000 }).toBeCloseTo(1, 1);
  await page.waitForTimeout(1500);
  expect(await pageQ(page)).toBeCloseTo(1, 1);
  expect((await s4(page)).state).toBe('world');
  expect((await s4(page)).scene).toBe(0);
  expect((await s4(page)).hold).toBeNull();

  // five scenes by four steps: each one whole step (busy through it and 150 ms after), the page snapped to the scene's q, the lines decoded in
  for (let to = 1; to < N; to++) {
    await page.waitForFunction((k) => { const st = window.__s4!.state() as { loops: { i: number; in: boolean; state: string }[] }; return st.loops.some((l) => l.i === k && (l.in || l.state === 'failed')); }, to, { timeout: 120_000, polling: 250 }).catch(() => {});
    await expect.poll(() => page.evaluate(() => window.__s4!.step(1)), { timeout: 30_000 }).toBe(true);
    expect(await page.evaluate(() => window.__s4!.step(1))).toBe(false);   // swallowed during the step
    await expect.poll(async () => (await s4(page)).scene, { timeout: 30_000 }).toBe(to);
    await expect.poll(async () => (await s4(page)).busy, { timeout: 10_000 }).toBe(false);
    await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(1 + 0.5 * to, 1);
    await expect(page.locator(`.rm-scene[data-i="${to}"]`)).toHaveClass(/is-on/);
    await expect(page.locator('#room')).toHaveAttribute('data-scene', String(to));
    expect(await noHScroll(page)).toBe(true);
  }
  expect(await events(page)).toContain('room_step');
  await expect(page.locator('#rmNext')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#rmPrev')).not.toHaveAttribute('aria-disabled', 'true');
  expect(await page.evaluate(() => window.__s4!.step(1))).toBe(false);   // scene 5: a forward gesture is the page's
  // a position change without a gesture re-syncs the scene
  await goQ(page, 2);
  await expect.poll(async () => (await s4(page)).scene, { timeout: 10_000 }).toBe(2);
  await expect(page.locator('.rm-scene[data-i="2"]')).toHaveClass(/is-on/);
  // the keyboard: with the pad focused, a single Down steps once and a held repeat does not; the keyboard's focus lands on the name
  await page.focus('#rmPad');
  await page.keyboard.down('ArrowDown'); await page.keyboard.down('ArrowDown'); await page.keyboard.up('ArrowDown');
  await expect.poll(async () => (await s4(page)).scene, { timeout: 30_000 }).toBe(3);
  await page.waitForTimeout(1200);
  expect((await s4(page)).scene).toBe(3);
  await expect(page.locator('#rmName-' + (await page.locator('.rm-scene[data-i="3"]').getAttribute('data-id')))).toBeFocused({ timeout: 10_000 });

  // the hold past scene 5, then the fourth wipe onto section 5 (section-5.md 2): the cut from scene 5 over the room's q 3.8 to
  // 4.8, the logotype Urban Slate from its half, and section 5 at rest over the island's flat ground; no exit seam since
  // 2026-11-03: a notch down at section 5's rest runs nothing and the page stays there
  await page.evaluate(() => window.__s4!.scene(4));
  await expect.poll(async () => (await s4(page)).scene, { timeout: 10_000 }).toBe(4);
  await goQ(page, 3.5); await page.waitForTimeout(400);
  expect((await s4(page)).state).toBe('world');
  expect((await s4(page)).wipeOut).toBe(0);
  await expect(page.locator('.site-logo')).toHaveAttribute('data-tone', 'dark');   // dawn's own tone at rest (D5's measured pick: Pearl Whisper)
  await goQ(page, WIPE4_START + 0.8); await page.waitForTimeout(1500);
  expect((await s4(page)).wipeOut).toBeGreaterThan(0.6);
  await expect(page.locator('.site-logo')).toHaveAttribute('data-tone', 'light', { timeout: 10_000 });
  const rest0 = await restY(page);
  expect(Number.isFinite(rest0)).toBe(true);
  await page.evaluate((y) => { scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); }, rest0);
  await page.waitForTimeout(800);
  expect(await noHScroll(page)).toBe(true);
  // section 5 at rest over the island's flat ground (section5/ground.ts): the section marked, the ground the whole frame,
  // and the three follow links (D6)
  await expect(page.locator('#signup')).toHaveAttribute('data-ground', 'island');
  await expect.poll(() => page.evaluate(() => (window.__skreedGround!.state() as { mode: string }).mode)).toBe('whole');
  for (const href of ['https://www.facebook.com/skreedofficial', 'https://www.youtube.com/@skreedofficial', 'https://www.instagram.com/skreedofficial']) await expect(page.locator(`#signup a[href^="${href}"]`)).toHaveCount(1);
  expect((await s4(page)).state).toBe('world');
  // no exit seam from section 5's end since 2026-11-03 (Sam: "remove the loop"): the guard still arms at the rest, and a
  // notch down there runs nothing; the page stays at the section, the logotype Urban Slate over its cream ground
  await page.evaluate(() => { dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })); });
  await page.waitForTimeout(800);
  expect((await s4(page)).state).toBe('world');
  expect(Math.abs(await page.evaluate(() => scrollY) - await restY(page))).toBeLessThan(2);
  expect(await events(page)).not.toContain('room_loop');
  await expect(page.locator('.site-logo')).toHaveAttribute('data-tone', 'light');
  await expect(page.locator('.site-logo')).toHaveCSS('color', URBAN_SLATE_CSS);
  await expect(page.locator('#siteNav')).toHaveAttribute('data-tone', 'light');   // the section index follows the logotype, as Back to top did before Home took its place

  // no wrap from the top (2026-11-04, Sam: "i cant go to the bottom of the site from the top section, remove that trick";
  // docs/specs/scroll-steps.md 2): at scroll 0 a wheel burst up and ArrowUp leave the page at the hero
  await page.evaluate(() => { scrollTo({ top: 0, behavior: 'instant' }); window.__skreedSnap?.(0); });
  await page.waitForTimeout(500);
  await page.evaluate(() => { for (let i = 0; i < 6; i++) dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true, cancelable: true })); });
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect((await s4(page)).state).toBe('approach');
  expect(await events(page)).not.toContain('room_wrap');
  // scene 5 again by the hooks, for the walk back below
  await expect.poll(() => page.evaluate(() => window.__s4!.scene(4)), { timeout: 30_000 }).toBe(true);
  await expect.poll(async () => (await s4(page)).scene, { timeout: 10_000 }).toBe(N - 1);

  // back through the scenes to scene 1; there ArrowUp is the page's: the section goes back to its approach and a keyboard
  // user's focus waits on the pad
  for (let to = N - 2; to >= 0; to--) {
    await expect.poll(() => page.evaluate(() => window.__s4!.step(-1)), { timeout: 30_000 }).toBe(true);
    await expect.poll(async () => (await s4(page)).scene, { timeout: 30_000 }).toBe(to);
    await expect.poll(async () => (await s4(page)).busy, { timeout: 10_000 }).toBe(false);
  }
  await page.focus('#rmPad');
  for (let i = 0; i < 6 && (await s4(page)).state === 'world'; i++) { await page.keyboard.press('ArrowUp'); await page.waitForTimeout(250); }
  await expect.poll(async () => (await s4(page)).state, { timeout: 10_000 }).toBe('approach');
  expect(await pageQ(page)).toBeLessThan(1);
  await expect(page.locator('#rmNav')).toBeHidden({ timeout: 10_000 });
  await expect(page.locator('#rmPad')).toBeFocused({ timeout: 10_000 });
  expect(errors).toEqual([]);
  await ctx.close();
});

/** the live regions in the section that have something to say: only #rmLive may speak on an arrival (AC13) */
const speaking = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#room [aria-live], #room [role="status"]')]
  .filter((el) => !el.closest('[hidden]') && (el.textContent ?? '').trim()).map((el) => el.id || el.className));

test('section 4 at 390 x 844, AC14: a blocked loop, a rejected play(), products.bin blocked, a lost context in the scenes', async ({ browser, baseURL }) => {
  test.setTimeout(1_500_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  // a refused play() (spec 5, "Video policy"): every media element's play() rejects as a blocked autoplay does
  await ctx.addInitScript(() => { HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException('play() refused (test stub)', 'NotAllowedError')); }; });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // products.bin blocked, scene 2's loop held back until released, scene 3's loop refused: the routes before the page
  // loads, because at 390 x 844 the intro's layout puts the quiz inside the viewport and the observer starts the scenes'
  // phases during the intro (section4/layout.ts), so products.bin can be fetched before the boot has finished
  await page.route(/\/_astro\/products\.[A-Za-z0-9_-]+\.bin$/, (r) => r.abort());
  let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; });
  await page.route(/\/_astro\/grove-(?:wide|portrait)\.[A-Za-z0-9_-]+\.mp4$/, async (r) => { await gate; await r.continue(); });
  await page.route(/\/_astro\/ember-(?:wide|portrait)\.[A-Za-z0-9_-]+\.mp4$/, (r) => r.abort());
  await open3d(page, baseURL);
  const tune = await page.evaluate(() => !!(window as unknown as { __skreedTune?: unknown }).__skreedTune);
  // the scenes load one section ahead: the quiz on screen, and the scenes settle with products.bin failed (the section never blocks on it)
  await scenesIn(page);
  expect((await s4(page)).products).toBe('failed');
  // scene 1 by the hook: one announcement, the hint on its own line with no live role
  await page.evaluate(() => window.__s4!.scene(0));
  await expect.poll(async () => (await s4(page)).state, { timeout: 30_000 }).toBe('world');
  await expect(page.locator('#rmSceneHint')).toBeVisible({ timeout: 20_000 });
  expect(await page.locator('#rmSceneHint').getAttribute('role')).toBeNull();
  expect(await page.locator('#rmSceneHint').getAttribute('aria-live')).toBeNull();
  const named = await page.evaluate(() => !!document.activeElement?.classList.contains('rm-scene-name'));
  const voices = await speaking(page);
  expect(voices.filter((v) => v !== 'rmLive')).toEqual([]);
  expect(voices.includes('rmLive')).toBe(!named);
  if (!named) await expect(page.locator('#rmLive')).toHaveText(/^1 of 5\. /);
  // the refused play() (spec 5 "Video policy", AC14): where the browser decodes the loops (the installed Chrome) scene 1's
  // loop is in and the pool reads its rejected play() as a refusal on the next frame, so the hooks read refused and in
  // false, the still stays, no video plays, and on a Tune build the line says so; where the browser has no H.264 (the
  // harness's Chromium) the loop never gets in and reads failed, AC14's state for a loop that failed: the still stays the
  // same way, no line
  await expect.poll(async () => { const l = (await s4(page)).loops[0]; return !!l && (l.refused || l.state === 'failed'); }, { timeout: 30_000 }).toBe(true);
  const loop0 = (await s4(page)).loops[0];
  if (loop0.state !== 'failed') { expect(loop0.state).toBe('in'); expect(loop0.refused).toBe(true); expect(loop0.in).toBe(false); expect(loop0.playing).toBe(false); }
  expect(await page.evaluate(() => [...document.querySelectorAll('video')].filter((v) => !v.paused).length)).toBe(0);
  if (tune && loop0.refused) await expect.poll(() => said(page, '.rm-scene[data-i="0"] .rm-scene-more'), { timeout: 10_000 }).toBe('Clip blocked');
  else await expect(page.locator('.rm-scene[data-i="0"] .rm-scene-more')).toBeHidden();
  // scene 2 held back: the step goes ahead on its still (the loop is optional), the loading line under its lines, Still loading at 8 s
  await expect.poll(() => page.evaluate(() => window.__s4!.step(1)), { timeout: 30_000 }).toBe(true);
  await expect.poll(async () => (await s4(page)).scene, { timeout: 30_000 }).toBe(1);
  await expect.poll(() => said(page, '.rm-scene[data-i="1"] .rm-scene-more'), { timeout: 10_000 }).toBe('Loading...');
  expect(await page.locator('.rm-scene[data-i="1"] .rm-scene-more').getAttribute('aria-hidden')).toBe('true');
  await expect.poll(() => said(page, '.rm-scene[data-i="1"] .rm-scene-more'), { timeout: 15_000 }).toBe('Still loading...');
  release();
  // where the browser decodes the loop it gets in; where it has no H.264 (the harness's Chromium) it reads failed: either way the loading line goes
  await expect.poll(async () => { const l = (await s4(page)).loops[1]; return l?.state === 'in' || l?.state === 'failed'; }, { timeout: 120_000 }).toBe(true);
  await expect(page.locator('.rm-scene[data-i="1"] .rm-scene-more')).toBeHidden({ timeout: 10_000 });
  // scene 3's loop refused by the network: its still stays, no loading line
  await expect.poll(() => page.evaluate(() => window.__s4!.step(1)), { timeout: 30_000 }).toBe(true);
  await expect.poll(async () => (await s4(page)).scene, { timeout: 30_000 }).toBe(2);
  await expect.poll(async () => (await s4(page)).loops[2]?.state, { timeout: 60_000 }).toBe('failed');
  await expect(page.locator('.rm-scene[data-i="2"] .rm-scene-more')).toBeHidden({ timeout: 10_000 });
  await expect(page.locator('.rm-scene[data-i="2"] .rm-scene-name .dc')).toBeVisible();
  expect(await page.evaluate(() => [...document.querySelectorAll('video')].filter((v) => !v.paused).length)).toBe(0);
  // the context lost in the scenes: the hero's hard poster path and the section's poster layout, the scenes in a column
  await page.evaluate(() => window.__skreedLoseContext!());
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('poster')), { timeout: 20_000 }).toBe(true);
  await expect(page.locator('#rmScenes')).toBeVisible();
  expect(await page.locator('.rm-scene:visible').count()).toBe(N);
  expect(await noHScroll(page)).toBe(true);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('section 4 at 390 x 844: the glue at section 4\'s seam settles a visitor\'s wheel run to the nearer end, and a Shift+Tab into the quiz never settles (AC4)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  // the glue on: no ?glue=0 here
  await page.goto(new URL('/?tier=hero3d&room=open', baseURL).href);
  await page.waitForFunction(() => window.__heroStarted && !!window.__skreedIntro, null, { timeout: 540_000, polling: 500 });
  await page.evaluate(() => (window.__skreedIntro as unknown as { skip(): void }).skip());
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 300_000, polling: 500 });
  await page.waitForTimeout(2500);   // the page scroll chunk is imported once the intro ends
  const span = await page.evaluate(() => { const top = document.getElementById('room')!.getBoundingClientRect().top + scrollY; return { start: top - innerHeight, end: top + innerHeight, mid: top }; });
  const y = () => page.evaluate(() => scrollY);
  // a wheel run stopping 200 px into the span (its lower half) settles to the span's start after 150 ms still and the 0.5 s settle
  await page.evaluate((t) => scrollTo({ top: t, behavior: 'instant' }), span.start - 300);
  await page.waitForTimeout(400);
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, 500);
  await expect.poll(y, { timeout: 5_000 }).toBeCloseTo(span.start, 0);
  await page.waitForTimeout(800);
  expect(await y()).toBeCloseTo(span.start, 0);
  // past the middle: to the span's end, scene 1 fully in (q 1); the hero's followers follow the page as they do today
  await page.mouse.wheel(0, span.mid - span.start + 200);
  await expect.poll(y, { timeout: 5_000 }).toBeCloseTo(span.end, 0);
  await page.waitForTimeout(800);
  expect(await y()).toBeCloseTo(span.end, 0);
  // a Shift+Tab from the section back into the quiz: the browser's own focus scroll, and no settle follows it
  await page.evaluate(() => document.getElementById('rmPad')!.focus({ preventScroll: true }));
  for (let i = 0; i < 4 && !(await page.evaluate(() => !!document.activeElement?.closest('#find'))); i++) await page.keyboard.press('Shift+Tab');
  await page.waitForTimeout(150);
  const after = await y();
  expect(await page.evaluate(() => !!document.activeElement && !!document.activeElement.closest('#find'))).toBe(true);
  await page.waitForTimeout(1000);
  expect(await y()).toBe(after);
  await ctx.close();
});

test('section 4 to 5 at 390 x 844: the fourth wipe shows no box of section 5\'s own, and the glue settles a wheel run in it to the nearer end with the navbar\'s menu button focused (Sam, 2026-11-03)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  // the glue on: no ?glue=0 here
  await page.goto(new URL('/?tier=hero3d&room=open', baseURL).href);
  await page.waitForFunction(() => window.__heroStarted && !!window.__skreedIntro, null, { timeout: 540_000, polling: 500 });
  await page.evaluate(() => (window.__skreedIntro as unknown as { skip(): void }).skip());
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 300_000, polling: 500 });
  await page.waitForTimeout(2500);   // the page scroll chunk is imported once the intro ends
  await scenesIn(page);
  await page.evaluate(() => window.__s4!.scene(4));
  await expect.poll(async () => (await s4(page)).scene, { timeout: 10_000 }).toBe(4);
  await page.waitForTimeout(800);
  const span = await page.evaluate(() => { const top = document.getElementById('room')!.getBoundingClientRect().top + scrollY; return { start: top + 3.8 * innerHeight, end: top + 4.8 * innerHeight }; });
  const y = () => page.evaluate(() => scrollY);
  // mid-cut, the glue held off: the section leaves its ground to the canvas's cut and masks its lines in behind the band
  await page.evaluate(() => window.__s4!.glue(false));
  await page.evaluate((t) => scrollTo({ top: t, behavior: 'instant' }), span.start + 0.5 * (span.end - span.start));
  await page.waitForTimeout(500);
  await expect(page.locator('#signup')).toHaveAttribute('data-cut', '');
  await expect(page.locator('#signup')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('signup')!).maskImage)).toContain('linear-gradient');
  await page.evaluate((t) => scrollTo({ top: t, behavior: 'instant' }), span.start);
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__s4!.glue(true));
  // the navbar's control focused, as a tap leaves it (on a phone the menu button, which the sheet hands the focus back to;
  // fixed to the viewport, it never scrolls out of view)
  await page.locator('.snav-menu').focus();
  expect(await page.evaluate(() => document.activeElement === document.querySelector('.snav-menu'))).toBe(true);
  await page.mouse.move(200, 400);
  // a run that stops 30% into the cut settles back to its start
  await page.mouse.wheel(0, 0.3 * (span.end - span.start));
  await expect.poll(y, { timeout: 5_000 }).toBeCloseTo(span.start, 0);
  // one that stops past the middle settles on to section 5's rest, the page's last position
  await page.mouse.wheel(0, 0.7 * (span.end - span.start));
  const rest = await restY(page);
  await expect.poll(async () => Math.abs((await y()) - rest), { timeout: 5_000 }).toBeLessThan(2);
  expect(await page.evaluate(() => document.activeElement === document.querySelector('.snav-menu'))).toBe(true);
  // at rest the cut is done: the ground the island's whole frame, section 4's loops idle, no mask, the logotype Urban Slate
  await expect(page.locator('#signup')).toHaveAttribute('data-ground', 'island');
  await expect(page.locator('#signup')).not.toHaveAttribute('data-cut', '');
  expect((await s4(page)).wipeOut).toBe(1);
  expect((await s4(page)).loops.filter((l) => l.playing)).toHaveLength(0);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('signup')!).maskImage)).toBe('none');
  await expect(page.locator('.site-logo')).toHaveAttribute('data-tone', 'light');
  await ctx.close();
});

test('section 4 at 390 x 844: Ctrl+wheel in range is the browser\'s zoom and never steps; a one-finger pan at visualViewport.scale 2 never steps (AC3)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const page = await ctx.newPage();
  await open3d(page, baseURL);
  await scenesIn(page);
  await page.evaluate(() => window.__s4!.scene(2));
  await expect.poll(async () => (await s4(page)).scene, { timeout: 30_000 }).toBe(2);
  await expect.poll(async () => (await s4(page)).inRange, { timeout: 10_000 }).toBe(true);
  await expect.poll(async () => (await s4(page)).busy, { timeout: 10_000 }).toBe(false);
  // Ctrl+wheel (a pinch on a trackpad): never captured, so no step either way
  await page.mouse.move(200, 400);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, 120); await page.waitForTimeout(300); await page.mouse.wheel(0, -120);
  await page.keyboard.up('Control');
  await page.waitForTimeout(1200);
  expect((await s4(page)).scene).toBe(2);
  // a one-finger pan with the page zoomed to scale 2: the page's own, never a step
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
  await expect.poll(() => page.evaluate(() => visualViewport?.scale ?? 1), { timeout: 5_000 }).toBeGreaterThan(1.5);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 500 }] });
  for (const ty of [490, 470, 440, 400]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: ty }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(1200);
  expect((await s4(page)).scene).toBe(2);
  await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
  await ctx.close();
});

test('section 4 at 1280 x 800: a wheel fling from the approach rests on scene 1 and its tail never steps; a push after 0.7 s of silence is one step (section-4-no-hall.md AC3)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await open3d(page, baseURL);
  await scenesIn(page);
  // every wheel event as the page hears it (a capture listener, before the section's own), and for every step the silence
  // before the wheel event that began it: the rule is that the input carrying the page in never steps, and a wheel event
  // after 0.7 s of silence is the visitor's own (BURST.carriedMs). SwiftShader on a loaded machine can hear a fling's events
  // a second apart, so the stream's own gaps decide what the run can show: with none of 0.7 s, no step at all
  type W = { __wheels: number[]; __stepGaps: number[] };
  await page.evaluate(() => {
    const w = window as unknown as W; w.__wheels = []; w.__stepGaps = [];
    addEventListener('wheel', () => { w.__wheels.push(performance.now()); }, { capture: true, passive: true });
    addEventListener('skreed:room-step', () => { const n = w.__wheels.length; w.__stepGaps.push(n >= 2 ? w.__wheels[n - 1] - w.__wheels[n - 2] : Infinity); });
  });
  const take = () => page.evaluate(() => { const w = window as unknown as W; const ws = w.__wheels, gaps = ws.slice(1).map((t, i) => t - ws[i]), r = { maxGap: gaps.length ? Math.max(...gaps) : 0, stepGaps: w.__stepGaps }; w.__wheels = []; w.__stepGaps = []; return r; });
  const cdp = await ctx.newCDPSession(page);
  const from = async () => { await goQ(page, 0); await page.waitForTimeout(800); await goQ(page, 0.6); await page.waitForTimeout(1_500); expect((await s4(page)).state).toBe('approach'); await take(); };
  const rests = async (what: string) => {
    await expect.poll(async () => (await s4(page)).state, { timeout: 20_000 }).toBe('world');
    await page.waitForTimeout(1_500);
    await expect.poll(async () => (await s4(page)).busy, { timeout: 20_000 }).toBe(false);
    const { maxGap, stepGaps } = await take();
    // the first step ends the carried input, so it follows 0.7 s of silence; the carousel's own bursts after it are its rules
    if (stepGaps.length) expect(stepGaps[0], `${what}: the first step only after 0.7 s of silence`).toBeGreaterThanOrEqual(700);
    if (maxGap < 700) {
      expect(stepGaps, `${what}: no step (the stream's longest gap ${Math.round(maxGap)} ms)`).toEqual([]);
      expect((await s4(page)).scene, `${what}: scene 1`).toBe(0);
      expect(await pageQ(page), `${what}: on scene 1's q`).toBeCloseTo(1, 1);
    }
  };
  await page.mouse.move(640, 400);
  // a browser-generated wheel gesture (60 Hz events, its momentum included): 1,200 px at 1,600 px/s from q 0.6
  await from();
  await cdp.send('Input.synthesizeScrollGesture', { x: 640, y: 400, yDistance: -1200, speed: 1600, gestureSourceType: 'mouse', preventFling: false });
  await rests('the gesture');
  // a trackpad's momentum as discrete wheel events, 120 px decaying to 2 px, one every 16 ms, sent without waiting for each
  await from();
  const sends: Promise<unknown>[] = [];
  for (let d = 120; d >= 2; d *= 0.94) { sends.push(cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 640, y: 400, deltaX: 0, deltaY: Math.round(d) }).catch(() => undefined)); await page.waitForTimeout(16); }
  await Promise.all(sends);
  await rests('the burst');
  // 0.7 s of silence after it: a push is the visitor's own, one step on (from scene 1, where a slow run's steps are undone;
  // a step waits for the next scene's still, which a jump by the hook from a far scene loads again)
  if ((await s4(page)).scene !== 0) await page.evaluate(() => window.__s4!.scene(0));
  await expect.poll(async () => { const s = await s4(page); return s.scene === 0 && !s.busy; }, { timeout: 20_000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => { const s = window.__s4!.state() as { stills: { ok: boolean; loading: boolean }[] }; return s.stills[1].ok && !s.stills[1].loading; }), { timeout: 30_000 }).toBe(true);
  await take();
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, 100);
  await expect.poll(async () => (await s4(page)).scene, { timeout: 20_000 }).toBe(1);
  expect((await take()).stepGaps.length).toBe(1);
  await ctx.close();
});

test('section 4 at 390 x 844: a finger dragged from the approach across scene 1 keeps scene 1 while it is down and rests on scene 1 at its release (section-4-no-hall.md AC3)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await open3d(page, baseURL);
  await scenesIn(page);
  await goQ(page, 0.8);
  await page.waitForTimeout(1_500);
  expect((await s4(page)).state).toBe('approach');
  const cdp = await ctx.newCDPSession(page);
  const at = (y: number) => [{ x: 195, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(760) });
  for (let i = 1; i <= 30; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(760 - i * 16) }); await page.waitForTimeout(16); }
  expect(await pageQ(page), 'the drag carried the page past scene 1').toBeGreaterThan(1.05);
  expect((await s4(page)).scene, 'scene 1 kept while the finger is down').toBe(0);
  await page.waitForTimeout(300);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(1, 1);
  const s = await s4(page);
  expect(s.state).toBe('world');
  expect(s.scene).toBe(0);
  await ctx.close();
});

test('section 4 at 390 x 844 under reduced motion (still3d): no loop elements, the arrival at once, a step as a cut, no exit from section 5 (AC11)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await open3d(page, baseURL);
  await scenesIn(page);
  expect((await s4(page)).video).toBe(false);   // stills on every plane: no loop element is made
  // the arrival: the page at scene 1, the scenes at once (no bubble, no dissolve: the hall's entry left with it)
  const t0 = Date.now();
  await goQ(page, 1);
  await expect.poll(async () => (await s4(page)).state, { timeout: 10_000 }).toBe('world');
  expect(Date.now() - t0).toBeLessThan(2500);
  await expect.poll(() => pageQ(page), { timeout: 5_000 }).toBeCloseTo(1, 1);
  // a step is a cut with a 300 ms cross-fade: the next scene well within a second, the page snapped
  await expect.poll(() => page.evaluate(() => window.__s4!.step(1)), { timeout: 30_000 }).toBe(true);
  await expect.poll(async () => (await s4(page)).scene, { timeout: 2_000 }).toBe(1);
  await expect.poll(async () => (await s4(page)).busy, { timeout: 2_000 }).toBe(false);
  await expect.poll(() => pageQ(page), { timeout: 5_000 }).toBeCloseTo(1.5, 1);
  // no exit seam from section 5's end (2026-11-03): at section 5's rest a notch down runs nothing, under reduced motion too
  await page.evaluate(() => window.__s4!.scene(4));
  await expect.poll(async () => (await s4(page)).scene, { timeout: 10_000 }).toBe(4);
  await page.evaluate(() => { const y = (window.__s4!.state() as { restY: number }).restY; scrollTo({ top: y, behavior: 'instant' }); });
  await page.waitForTimeout(600);
  await page.evaluate(() => { dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })); });
  await page.waitForTimeout(600);
  expect(await events(page)).not.toContain('room_loop');
  expect((await s4(page)).state).toBe('world');
  expect(errors).toEqual([]);
  await ctx.close();
});

test('section 4 on the poster tier: the five scenes in a column at once, no hall still, no prompt, no tall track', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/?tier=poster&room=open', baseURL).href);
  await expect(page.locator('html')).toHaveClass('js poster');
  const room = page.locator('#room');
  await room.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const h = await page.evaluate(() => ({ vh: innerHeight }));
  for (const gone of ['#rmEnter', '.rm-still']) expect(await page.locator(gone).count(), `${gone} is gone with the hall`).toBe(0);
  await expect(page.locator('#rmScenes')).toBeVisible();
  expect(await page.locator('.rm-scene:visible').count()).toBe(N);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('rmStage')!).position), 'no pinned stage, no tall track').toBe('relative');
  // one per screen from the section's top, each its still (AVIF with WebP, sized) over its four lines
  const first = (await page.locator('.rm-scene[data-i="0"]').boundingBox())!, top = (await room.boundingBox())!;
  expect(Math.abs(first.y - top.y)).toBeLessThan(2);
  for (const li of await page.locator('.rm-scene').all()) {
    expect((await li.boundingBox())!.height).toBeGreaterThanOrEqual(h.vh - 1);
    expect(await li.locator('picture source[type="image/avif"]').count()).toBe(2);
    expect(await li.locator('img').getAttribute('width')).toBe('1280');
    expect(await li.locator('img').getAttribute('height')).toBe('666');
  }
  expect(await noHScroll(page)).toBe(true);
});

test('section 4 at 1280 x 800: PageDown or Space held from the quiz\'s foot lands on scene 1 at q 1 and stays there: a held key\'s repeat is the key that carried the page in, not a new one, so the arrival\'s hold outlasts the smooth scroll its presses started (section-4-no-hall.md AC3)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await open3d(page, baseURL);
  await scenesIn(page);
  // every scene announced and every seam event, as the page hears them
  type W = { __said: string[] };
  await page.evaluate(() => {
    const w = window as unknown as W; w.__said = [];
    addEventListener('skreed:room-scene', (e) => { w.__said.push(`scene ${(e as CustomEvent<{ i: number }>).detail.i}`); });
    addEventListener('skreed:room-state', (e) => { w.__said.push(`state ${(e as CustomEvent<string>).detail}`); });
  });
  const said = () => page.evaluate(() => { const w = window as unknown as W; const s = w.__said; w.__said = []; return s; });
  // the OS repeat as Playwright sends it: a second keyboard.down of a key already down carries repeat true
  for (const [key, firstMs, everyMs] of [['PageDown', 375, 90], ['Space', 375, 90], ['PageDown', 225, 30], ['Space', 500, 33]] as const) {
    const what = `${key} held, repeats after ${firstMs} ms then every ${everyMs} ms`;
    await goQ(page, 0); await page.waitForTimeout(800);
    await scrollQ(page, -0.5); await page.waitForTimeout(1_500);                         // the quiz's foot, by the page's own scroll
    expect((await s4(page)).state, `${what}: the approach first`).toBe('approach');
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
    await said();
    await page.keyboard.down(key);
    await page.waitForTimeout(firstMs);
    for (let i = 0; i < 20; i++) { await page.keyboard.down(key); await page.waitForTimeout(everyMs); }
    await page.keyboard.up(key);
    await expect.poll(async () => (await s4(page)).state, { timeout: 20_000 }).toBe('world');
    await page.waitForTimeout(1_800);                                                      // the hold's cap and its still, the smooth scroll long over
    const s = await s4(page), q = await pageQ(page), ev = await said();
    expect(s.state, `${what}: still in world`).toBe('world');
    expect(s.scene, `${what}: scene 1`).toBe(0);
    expect(q, `${what}: on scene 1's q (q ${q.toFixed(3)})`).toBeCloseTo(1, 1);
    expect(ev.filter((e) => e !== 'scene 0'), `${what}: no other scene, no seam (${ev.join(', ')})`).toEqual([]);
  }
  await ctx.close();
});

test('section 4 at 1280 x 800: a backward wheel at scene 1 right after the fling that carried the page in is the page\'s, not the fling\'s tail: it scrolls up into the wipe and the section leaves world (section-4-no-hall.md AC4)', async ({ browser, baseURL }) => {
  test.setTimeout(600_000);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await open3d(page, baseURL);
  await scenesIn(page);
  const cdp = await ctx.newCDPSession(page);
  await page.mouse.move(640, 400);
  // every upward wheel event as the page hears it after the section's own listener: 1 where the section prevented it
  type W = { __up: number[] };
  await page.evaluate(() => { const w = window as unknown as W; w.__up = []; addEventListener('wheel', (e) => { if (e.deltaY < 0) w.__up.push(e.defaultPrevented ? 1 : 0); }, { passive: true }); });
  for (const gapMs of [60, 150]) {
    const what = `a wheel up ${gapMs} ms after the fling`;
    await goQ(page, 0); await page.waitForTimeout(800); await goQ(page, 0.6); await page.waitForTimeout(1_500);
    expect((await s4(page)).state, `${what}: the approach first`).toBe('approach');
    await page.evaluate(() => { (window as unknown as W).__up = []; });
    // the fling: 120 px decaying to 2 px, one event every 16 ms, carries the page in and the hold rests it on scene 1
    const sends: Promise<unknown>[] = [];
    for (let d = 120; d >= 2; d *= 0.94) { sends.push(cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 640, y: 400, deltaX: 0, deltaY: Math.round(d) }).catch(() => undefined)); await page.waitForTimeout(16); }
    await Promise.all(sends);
    await expect.poll(async () => (await s4(page)).state, { timeout: 20_000 }).toBe('world');
    expect((await s4(page)).scene, `${what}: scene 1 after the fling`).toBe(0);
    // gapMs after the fling's last event: -30 px (a quarter of the fling's peak) every 16 ms, the page's from the first
    await page.waitForTimeout(gapMs);
    const ups: Promise<unknown>[] = [];
    for (let i = 0; i < 20; i++) { ups.push(cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 640, y: 400, deltaX: 0, deltaY: -30 }).catch(() => undefined)); await page.waitForTimeout(16); }
    await Promise.all(ups);
    await expect.poll(async () => (await s4(page)).state, { timeout: 10_000 }).toBe('approach');
    const up = await page.evaluate(() => (window as unknown as W).__up);
    expect(up.length, `${what}: the events arrived`).toBeGreaterThan(0);
    expect(up[0], `${what}: the first backward event is the page's`).toBe(0);
    expect(await pageQ(page), `${what}: above scene 1`).toBeLessThan(1);
  }
  await ctx.close();
});
