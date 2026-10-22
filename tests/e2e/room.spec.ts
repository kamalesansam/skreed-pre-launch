// Section 4 (docs/specs/section-4.md 7 for the hall; docs/specs/section-4-flux.md 7 for the scenes): AC1 the track's
// 15.8 screens in every state and no horizontal scroll; AC13 the keyboard (the prompt is the section's first tabbable
// element and a focus on it snaps to the station; E does nothing without focus and enters with it; Skip takes focus at the
// press and hands it to scene 1's name; the scenes' names, lines and alts are all exposed; the pad's label follows the
// state; the pad's walk ends at the station); AC3 one step a gesture through the hooks (the page snapped to the scene's q
// when it ends, a step during a step swallowed, Next disabled at scene 5, a position change re-syncing the scene); AC6
// the exit seam when the raw scroll crosses q 12.8 (the jump to scroll 0 with the hero's followers at 0, room_loop) and
// the wrap from the top onto scene 5 (room_wrap, wrapLive); the way back at scene 1 into the hall (room_back, the prompt
// focused); AC14's states (spec 5's table): a blocked loop route (the still stays, the loading line, Still loading at 8 s),
// a rejected play() (the still stays, no line in production, clipBlocked on a Tune build), products.bin blocked (the
// scenes without a product, the press never blocked after it), and __skreedLoseContext() in the scenes (the poster
// path's column); and the poster tier's still and column. The 3D path runs on SwiftShader here (?tier=hero3d), so the
// island specs drive the section by its hooks (__s4, __skreedRoom) at device pixel ratio 1, skip the intro and turn the
// glue off (?glue=0: every q is set by scrollTo). Not run in this change (no wrangler here): kept coherent with the hooks.
import { test, expect, type Page } from '@playwright/test';

type Ev = { name: string; props: Record<string, string | number> };
type S4 = { state: string; under: string; scene: number; step: number; busy: boolean; lock: boolean; inRange: boolean; q: number; qRaw: number; arrive: number; worldReady: boolean; products: string; loops: { i: number; state: string; in: boolean; refused: boolean; playing: boolean }[]; seam: { kind: string; phase: string } | null; memory: number };
const events = (page: Page): Promise<string[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: Ev[] }).__skreedEvents ?? []).map((e) => e.name));
const s4 = (page: Page): Promise<S4> => page.evaluate(() => window.__s4!.state() as S4);
const N = 5, LOOP_START = 12.8;

async function open3d(page: Page, baseURL: string | undefined): Promise<void> {
  await page.goto(new URL('/?tier=hero3d&glue=0', baseURL).href);
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
/** a decoded line's text (the decode's visually hidden copy) */
const said = (page: Page, sel: string) => page.locator(`${sel} .sr-only`).first().textContent({ timeout: 2_000 }).catch(() => '');

test('section 4 at 390 x 844: the track, the keyboard, the entry, the five scenes by five steps, the hold, the exit seam, the wrap and the way back', async ({ browser, baseURL }) => {
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

  // the hall loads one section ahead; the section is 15.8 screens in every state
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 300_000, polling: 500 });
  expect(await page.evaluate(() => document.getElementById('room')!.offsetHeight)).toBeCloseTo(15.8 * H, -1);
  await goQ(page, 0.5);
  await expect.poll(() => events(page), { timeout: 30_000 }).toContain('room_view');
  expect(await noHScroll(page)).toBe(true);
  expect(await page.locator('.rm-scene').count()).toBe(N);

  // W, S and E do nothing without focus (WCAG 2.1.4)
  await goQ(page, 4);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const y0 = await page.evaluate(() => scrollY);
  await page.keyboard.press('e'); await page.keyboard.press('s');
  expect((await s4(page)).state).toBe('hall');
  expect(await page.evaluate(() => scrollY)).toBe(y0);
  await expect(page.locator('#rmPad')).toHaveAttribute('role', 'group');
  await expect(page.locator('#rmPad')).toHaveAttribute('aria-label', 'The entrance. Use the arrow keys to walk to the door.');
  // the pad's walk ends at the station: a held W from the station never carries the page into the scenes' range
  await goQ(page, 9.5); await page.focus('#rmPad');
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowUp');
  expect(await pageQ(page)).toBeLessThan(9.6);
  expect((await s4(page)).state).toBe('hall');

  // the prompt is the section's first tabbable element: a focus on it off-station snaps the page to the station
  await goQ(page, 4);
  const order = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#room button, #room [tabindex]')].filter((el) => el.tabIndex >= 0 && !el.hidden && !el.closest('[inert]')).map((el) => el.id || el.className));
  expect(order[0]).toBe('rmEnter');
  await page.focus('#rmEnter');
  await expect.poll(async () => (await s4(page)).q, { timeout: 20_000 }).toBeGreaterThan(9);
  await expect(page.locator('#rmEnter')).toHaveClass(/is-near/, { timeout: 20_000 });
  await expect(page.locator('#rmEnter .rm-enter-text .sr-only')).toHaveText('Enter Skreed universe');
  // the scenes are inert in the hall, every one in the tree with its name, lines and alt
  expect(await page.evaluate(() => document.getElementById('rmScenes')!.inert)).toBe(true);
  for (const li of await page.locator('.rm-scene').all()) {
    for (const c of ['.rm-scene-name', '.rm-scene-shade', '.rm-scene-line', '.rm-scene-count', '.rm-scene-alt']) expect(await li.locator(c).count()).toBe(1);
    expect(await li.getAttribute('hidden')).toBeNull();
  }

  // E with focus enters (once products.bin and scene 1's loop are in); Skip shows and takes focus; the track stays 15.8 screens
  await page.waitForFunction(() => (window.__s4!.state() as { worldReady: boolean }).worldReady, null, { timeout: 600_000, polling: 500 });
  await page.keyboard.press('e');
  await expect.poll(async () => (await s4(page)).state, { timeout: 20_000 }).toBe('entering');
  await expect(page.locator('#rmSkip')).toBeVisible();
  await expect(page.locator('#rmSkip')).toBeFocused();
  expect(await page.evaluate(() => document.getElementById('room')!.offsetHeight)).toBeCloseTo(15.8 * H, -1);
  // a 5-screen scroll during the entry clock: no seam, and the clock's end puts the page at scene 1's position
  await page.mouse.wheel(0, 5 * H); await page.waitForTimeout(400);
  expect((await s4(page)).state).toBe('entering');
  const arrive = (await s4(page)).arrive;
  await page.evaluate((t) => { window.__s4!.seek(t); window.__s4!.seek(-1); }, Math.max(0, arrive - 0.3));   // near its end, then the clock runs out by itself
  await expect.poll(async () => (await s4(page)).state, { timeout: 60_000 }).toBe('world');
  await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(10, 1);
  expect((await s4(page)).scene).toBe(0);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(H);   // no jump to the hero
  await expect(page.locator('#rmSkip')).toBeHidden({ timeout: 10_000 });
  await expect(page.locator('#rmPad')).toHaveAttribute('aria-label', 'The five scenes. Use Down and Up to move between them.');
  await expect(page.locator('.rm-scene[data-i="0"]')).toHaveClass(/is-on/);
  await expect(page.locator('#room')).toHaveAttribute('data-scene', '0');
  expect(await page.evaluate(() => document.getElementById('rmScenes')!.inert)).toBe(false);
  for (const name of await page.locator('.rm-scene-name').all()) expect(await name.getAttribute('aria-describedby')).toMatch(/^rmAlt-/);
  await expect(page.locator('#rmNav')).toBeVisible();
  expect(await noHScroll(page)).toBe(true);
  expect(await events(page)).toEqual(expect.arrayContaining(['room_enter', 'room_scene']));
  await expect.poll(() => said(page, '.rm-scene[data-i="0"] .rm-scene-shade'), { timeout: 10_000 }).toBe('Lilac, vivid violet');

  // five scenes by four steps: each one whole step (busy through it and 150 ms after), the page snapped to the scene's q, the lines decoded in
  for (let to = 1; to < N; to++) {
    await page.waitForFunction((k) => { const st = window.__s4!.state() as { loops: { i: number; in: boolean; state: string }[] }; return st.loops.some((l) => l.i === k && (l.in || l.state === 'failed')); }, to, { timeout: 120_000, polling: 250 }).catch(() => {});
    await expect.poll(() => page.evaluate(() => window.__s4!.step(1)), { timeout: 30_000 }).toBe(true);
    expect(await page.evaluate(() => window.__s4!.step(1))).toBe(false);   // swallowed during the step
    await expect.poll(async () => (await s4(page)).scene, { timeout: 30_000 }).toBe(to);
    await expect.poll(async () => (await s4(page)).busy, { timeout: 10_000 }).toBe(false);
    await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(10 + 0.5 * to, 1);
    await expect(page.locator(`.rm-scene[data-i="${to}"]`)).toHaveClass(/is-on/);
    await expect(page.locator('#room')).toHaveAttribute('data-scene', String(to));
    expect(await noHScroll(page)).toBe(true);
  }
  expect(await events(page)).toContain('room_step');
  await expect(page.locator('#rmNext')).toHaveAttribute('aria-disabled', 'true');
  expect(await page.evaluate(() => window.__s4!.step(1))).toBe(false);   // scene 5: a forward gesture is the page's
  // a position change without a gesture re-syncs the scene
  await goQ(page, 11);
  await expect.poll(async () => (await s4(page)).scene, { timeout: 10_000 }).toBe(2);
  await expect(page.locator('.rm-scene[data-i="2"]')).toHaveClass(/is-on/);
  // the keyboard: with the pad focused, a single Down steps once and a held repeat does not; the keyboard's focus lands on the name
  await page.focus('#rmPad');
  await page.keyboard.down('ArrowDown'); await page.keyboard.down('ArrowDown'); await page.keyboard.up('ArrowDown');
  await expect.poll(async () => (await s4(page)).scene, { timeout: 30_000 }).toBe(3);
  await page.waitForTimeout(1200);
  expect((await s4(page)).scene).toBe(3);
  await expect(page.locator('#rmName-' + (await page.locator('.rm-scene[data-i="3"]').getAttribute('data-id')))).toBeFocused({ timeout: 10_000 });

  // the hold past scene 5, then the exit seam when the raw scroll crosses q 12.8: the jump to the top with the hero at rest, room_loop
  await page.evaluate(() => window.__s4!.scene(4));
  await expect.poll(async () => (await s4(page)).scene, { timeout: 10_000 }).toBe(4);
  await goQ(page, 12.5); await page.waitForTimeout(400);
  expect((await s4(page)).state).toBe('world');
  await page.evaluate((q) => { const room = document.getElementById('room')!, top = room.getBoundingClientRect().top + scrollY; scrollTo({ top: top + q * innerHeight, behavior: 'instant' }); }, LOOP_START + 0.1);
  await page.waitForFunction(() => scrollY < 2, null, { timeout: 120_000, polling: 250 });
  await expect.poll(() => page.evaluate(() => window.__skreedState!().sb), { timeout: 20_000 }).toBeLessThan(0.01);
  expect(await events(page)).toContain('room_loop');
  await expect.poll(async () => (await s4(page)).state, { timeout: 10_000 }).toBe('hall');

  // the wrap from the top: the reverse seam onto scene 5 with the followers snapped, room_wrap and the wrap's own line
  await page.evaluate(() => window.__s4!.wrap());
  await expect.poll(async () => (await s4(page)).state, { timeout: 30_000 }).toBe('world');
  expect((await s4(page)).scene).toBe(N - 1);
  await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(12, 1);
  await expect.poll(() => page.evaluate(() => Math.abs(window.__skreedState!().sb - scrollY / innerHeight)), { timeout: 20_000 }).toBeLessThan(0.05);
  expect(await events(page)).toContain('room_wrap');
  await expect(page.locator('.rm-scene[data-i="4"]')).toHaveClass(/is-on/);
  const named = await page.evaluate(() => !!document.activeElement?.classList.contains('rm-scene-name'));
  if (!named) await expect(page.locator('#rmLive')).toHaveText(/^Round to the five scenes\. 5 of 5\. /);

  // back through the scenes to scene 1, then the way back: the hall at the station, room_back, the prompt focused for a keyboard user
  for (let to = N - 2; to >= 0; to--) {
    await expect.poll(() => page.evaluate(() => window.__s4!.step(-1)), { timeout: 30_000 }).toBe(true);
    await expect.poll(async () => (await s4(page)).scene, { timeout: 30_000 }).toBe(to);
    await expect.poll(async () => (await s4(page)).busy, { timeout: 10_000 }).toBe(false);
  }
  await page.focus('#rmPad');
  expect(await page.evaluate(() => window.__s4!.back())).toBe(true);
  await expect.poll(async () => (await s4(page)).state, { timeout: 30_000 }).toBe('hall');
  await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(9.5, 1);
  expect(await events(page)).toContain('room_back');
  await expect(page.locator('#rmEnter')).toBeFocused({ timeout: 10_000 });
  // the next lap: press, and Skip with Enter (past its 350 ms guard) lands at scene 1 with the name focused
  await page.keyboard.press('e');
  await expect(page.locator('#rmSkip')).toBeFocused({ timeout: 20_000 });
  await page.waitForTimeout(450);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await s4(page)).state, { timeout: 30_000 }).toBe('world');
  await expect(page.locator('#rmName-' + (await page.locator('.rm-scene[data-i="0"]').getAttribute('data-id')))).toBeFocused({ timeout: 10_000 });
  expect(await events(page)).toContain('room_skip');
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
  await open3d(page, baseURL);
  const tune = await page.evaluate(() => !!(window as unknown as { __skreedTune?: unknown }).__skreedTune);
  // products.bin blocked, scene 2's loop held back until released, scene 3's loop refused
  await page.route(/\/_astro\/products\.[A-Za-z0-9_-]+\.bin$/, (r) => r.abort());
  let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; });
  await page.route(/\/_astro\/grove-(?:wide|portrait)\.[A-Za-z0-9_-]+\.mp4$/, async (r) => { await gate; await r.continue(); });
  await page.route(/\/_astro\/ember-(?:wide|portrait)\.[A-Za-z0-9_-]+\.mp4$/, (r) => r.abort());
  // the hall loads one section ahead: the quiz on screen first, then the walk to the station loads the scenes' parts
  await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 300_000, polling: 500 });
  await goQ(page, 4); await goQ(page, 9.5);
  // the press never blocks on a failed products.bin: worldReady once it has failed and scene 1's loop has settled
  await page.waitForFunction(() => (window.__s4!.state() as { worldReady: boolean }).worldReady, null, { timeout: 600_000, polling: 500 });
  expect((await s4(page)).products).toBe('failed');
  // scene 1 by the hook (the entry ended at once): one announcement, the hint on its own line with no live role
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
  // the refused play(): scene 1's loop is in but refused, its still stays, no video plays; on a Tune build the line says so
  await expect.poll(async () => (await s4(page)).loops[0]?.refused, { timeout: 30_000 }).toBe(true);
  expect(await page.evaluate(() => [...document.querySelectorAll('video')].filter((v) => !v.paused).length)).toBe(0);
  if (tune) await expect.poll(() => said(page, '.rm-scene[data-i="0"] .rm-scene-more'), { timeout: 10_000 }).toBe('Clip blocked');
  else await expect(page.locator('.rm-scene[data-i="0"] .rm-scene-more')).toBeHidden();
  // scene 2 held back: the step goes ahead on its still (the loop is optional), the loading line under its lines, Still loading at 8 s
  await expect.poll(() => page.evaluate(() => window.__s4!.step(1)), { timeout: 30_000 }).toBe(true);
  await expect.poll(async () => (await s4(page)).scene, { timeout: 30_000 }).toBe(1);
  await expect.poll(() => said(page, '.rm-scene[data-i="1"] .rm-scene-more'), { timeout: 10_000 }).toBe('Loading...');
  expect(await page.locator('.rm-scene[data-i="1"] .rm-scene-more').getAttribute('aria-hidden')).toBe('true');
  await expect.poll(() => said(page, '.rm-scene[data-i="1"] .rm-scene-more'), { timeout: 15_000 }).toBe('Still loading...');
  release();
  await expect.poll(async () => (await s4(page)).loops[1]?.state, { timeout: 120_000 }).toBe('in');
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
  await expect(page.locator('#room')).toHaveAttribute('data-state', 'world', { timeout: 10_000 });
  await expect(page.locator('#rmScenes')).toBeVisible();
  expect(await page.locator('.rm-scene:visible').count()).toBe(N);
  expect(await noHScroll(page)).toBe(true);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('section 4 on the poster tier: the still, the prompt at once, the five scenes in a column after the press, no tall track', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await expect(page.locator('html')).toHaveClass('js poster');
  const room = page.locator('#room');
  await room.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const h = await page.evaluate(() => ({ room: document.getElementById('room')!.offsetHeight, vh: innerHeight }));
  expect(h.room).toBeLessThan(4 * h.vh);
  await expect(page.locator('#rmEnter')).toBeVisible();
  await expect(page.locator('#rmScenes')).toBeHidden();
  await page.locator('#rmEnter').click();
  await expect(room).toHaveAttribute('data-state', 'world');
  await expect(page.locator('#rmScenes')).toBeVisible();
  expect(await page.locator('.rm-scene:visible').count()).toBe(N);
  await expect(page.locator('.rm-scene[data-i="0"] .rm-scene-name')).toBeFocused();
  // one per screen, each its still (AVIF with WebP, sized) over its four lines
  for (const li of await page.locator('.rm-scene').all()) {
    expect((await li.boundingBox())!.height).toBeGreaterThanOrEqual(h.vh - 1);
    expect(await li.locator('picture source[type="image/avif"]').count()).toBe(2);
    expect(await li.locator('img').getAttribute('width')).toBe('1280');
    expect(await li.locator('img').getAttribute('height')).toBe('666');
  }
  expect(await noHScroll(page)).toBe(true);
});
