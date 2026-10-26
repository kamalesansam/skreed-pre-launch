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
// path's column); and the poster tier's still and column; AC15's further cases: the way back from a fresh press (the
// prompt visible and focused again), a cold first-visit wrap (the seam held until its lock ends, the carousel under the
// cloud, the prompt out of the Tab order), the glue at section 4's seam with a Tab into the quiz that never settles,
// Ctrl+wheel in range and a one-finger pan at visualViewport.scale 2 that never step, and the still3d path under reduced
// motion. The 3D path runs on SwiftShader here (?tier=hero3d), so the island specs drive the section by its hooks (__s4,
// __skreedRoom) at device pixel ratio 1, skip the intro and turn the glue off (?glue=0: every q is set by scrollTo)
// except the glue's own case. Run on 2026-10-23 against the hooks build served by wrangler (the build record's section 9:
// the 390 flow and the cold wrap pass; section 10: 133 of 134, AC14 failing at its refusal line). Since then AC14's
// refusal line reads the pool's refusal where the loops decode and the failed state where they do not (video.ts holds a
// rejected play() until the pool reads it); the suite has not been re-run on that change.
import { test, expect, type Page } from '@playwright/test';

type Ev = { name: string; props: Record<string, string | number> };
type S4 = { state: string; under: string; draws: string; seamDraws: string[]; scene: number; step: number; busy: boolean; lock: boolean; inRange: boolean; q: number; qRaw: number; arrive: number; worldReady: boolean; products: string; video: boolean; loops: { i: number; state: string; in: boolean; refused: boolean; playing: boolean }[]; seam: { kind: string; phase: string } | null; memory: number; layout: { top: number; height: number; intro: boolean } | null };
const events = (page: Page): Promise<string[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: Ev[] }).__skreedEvents ?? []).map((e) => e.name));
const s4 = (page: Page): Promise<S4> => page.evaluate(() => window.__s4!.state() as S4);
const N = 5, LOOP_START = 12.8;

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
/** the section's own q from the page's scroll, in screens of its own height */
const pageQ = (page: Page) => page.evaluate(() => { const room = document.getElementById('room')!; return -room.getBoundingClientRect().top / innerHeight; });
const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
/** a decoded line's text (the decode's visually hidden copy) */
const said = (page: Page, sel: string) => page.locator(`${sel} .sr-only`).first().textContent({ timeout: 2_000 }).catch(() => '');
/**
 * A seam held at full cover: a frame watcher installed first, then the seam started (the exit by the raw scroll across
 * LOOP_START, the wrap by its hook), and the frame clock frozen (__skreedFreeze, hooks builds: the loop's dt goes to 0, so
 * the seam holds where it is while frames still draw) on the first frame at which the exit has made its jump (its phase
 * out, the page at 0 under the cloud) or the wrap has landed (hold or out). The state then, or null after 30 s; release()
 * lets the clock run again.
 */
function holdAtCover(page: Page, kind: 'exit' | 'wrap'): Promise<S4 | null> {
  return page.evaluate(({ k, q }) => new Promise<unknown>((res) => {
    const t0 = performance.now();
    const tick = () => {
      const s = window.__s4!.state() as { seam: { kind: string; phase: string } | null };
      const full = !!s.seam && s.seam.kind === k && (k === 'exit' ? s.seam.phase === 'out' : s.seam.phase === 'hold' || s.seam.phase === 'out');
      if (full) { window.__skreedFreeze = true; res(s); return; }
      if (performance.now() - t0 > 30_000) { res(null); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    if (k === 'exit') { const room = document.getElementById('room')!, top = room.getBoundingClientRect().top + scrollY; scrollTo({ top: top + q * innerHeight, behavior: 'instant' }); }
    else window.__s4!.wrap();
  }), { k: kind, q: LOOP_START + 0.1 }) as Promise<S4 | null>;
}
const release = (page: Page) => page.evaluate(() => { window.__skreedFreeze = false; });
const URBAN_SLATE_CSS = 'rgb(56, 63, 67)';

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
  // the director's cached layout is a reading taken after the intro, at the section's real top (D1: a reading under
  // html.intro, with the hero's track collapsed, is replaced when the intro ends)
  await expect.poll(async () => (await s4(page)).layout?.intro, { timeout: 10_000 }).toBe(false);
  expect((await s4(page)).layout!.top).toBeCloseTo(await page.evaluate(() => document.getElementById('room')!.getBoundingClientRect().top + scrollY), 0);
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
  // the prompt still holds the focus it took as it decoded in at the station, so a focus on it would fire no event: let it
  // go, and let the frame clear the near state (walk.ts snaps only while the prompt is not near), then focus it
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(page.locator('#rmEnter')).not.toHaveClass(/is-near/, { timeout: 10_000 });
  await page.focus('#rmEnter');
  await expect.poll(async () => (await s4(page)).q, { timeout: 20_000 }).toBeGreaterThan(9);
  await expect(page.locator('#rmEnter')).toHaveClass(/is-near/, { timeout: 20_000 });
  await expect(page.locator('#rmEnter .rm-enter-text .sr-only')).toHaveText('Enter Skreed universe');
  await expect(page.locator('#rmEnter')).toHaveAccessibleName('Enter Skreed universe');
  const promptBox = (await page.locator('#rmEnter').boundingBox())!;
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

  // the way back from this fresh press (AC13): the circle shrinks into the hall at the station, the prompt is back (its
  // wipe at the entry undone), visible, in the Tab order and focused, the scenes inert again; then E enters once more
  await page.focus('#rmPad');
  expect(await page.evaluate(() => window.__s4!.back())).toBe(true);
  await expect.poll(async () => (await s4(page)).state, { timeout: 30_000 }).toBe('hall');
  await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(9.5, 1);
  expect(await events(page)).toContain('room_back');
  await expect(page.locator('#rmEnter')).toHaveClass(/is-near/, { timeout: 10_000 });
  await expect(page.locator('#rmEnter')).toBeVisible();
  expect(await page.evaluate(() => { const e = document.getElementById('rmEnter')!; return e.hidden || e.inert; })).toBe(false);
  await expect(page.locator('#rmEnter')).toBeFocused({ timeout: 10_000 });
  // the prompt intact (D2): its [E] and text spans in place, decoded in, the same name and the same box as on the first lap
  await expect(page.locator('#rmEnter .rm-enter-text .sr-only')).toHaveText('Enter Skreed universe');
  expect(await page.locator('#rmEnter > .rm-key').count()).toBe(1);
  expect(await page.locator('#rmEnter > .rm-enter-text').count()).toBe(1);
  await expect(page.locator('#rmEnter')).toHaveAccessibleName('Enter Skreed universe');
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#rmEnter .rm-enter-text .dc > span')].every((s) => s.style.opacity === '')), { timeout: 5_000 }).toBe(true);
  expect(Math.abs((await page.locator('#rmEnter').boundingBox())!.width - promptBox.width)).toBeLessThan(2);
  expect(await page.evaluate(() => document.getElementById('rmScenes')!.inert)).toBe(true);
  await expect(page.locator('#rmNav')).toBeHidden();
  await page.keyboard.press('e');
  await expect.poll(async () => (await s4(page)).state, { timeout: 20_000 }).toBe('entering');
  await page.evaluate((t) => { window.__s4!.seek(t); window.__s4!.seek(-1); }, Math.max(0, arrive - 0.3));
  await expect.poll(async () => (await s4(page)).state, { timeout: 60_000 }).toBe('world');
  await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(10, 1);
  expect((await s4(page)).scene).toBe(0);
  expect(await page.evaluate(() => { const e = document.getElementById('rmEnter')!; return e.hidden && e.inert; })).toBe(true);

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
  await expect(page.locator('.site-logo')).toHaveAttribute('data-tone', 'dark');   // dawn's own tone at rest (D5's measured pick: Pearl Whisper)
  // the seam held at full cover, the clock frozen on the first frame after the jump: the logotype and the Back to top
  // control read Urban Slate over the Pearl Whisper cloud (the regression the checker found in D5's first fix), the page at 0
  const exitCover = await holdAtCover(page, 'exit');
  expect(exitCover?.seam).toEqual({ kind: 'exit', phase: 'out' });
  expect(await page.evaluate(() => scrollY)).toBeLessThan(2);
  await expect(page.locator('.site-logo')).toHaveAttribute('data-tone', 'light');
  await expect(page.locator('.site-logo')).toHaveCSS('color', URBAN_SLATE_CSS);
  await expect(page.locator('#toTop')).toHaveAttribute('data-tone', 'light');
  await release(page);
  await page.waitForFunction(() => scrollY < 2, null, { timeout: 120_000, polling: 250 });
  await expect.poll(() => page.evaluate(() => window.__skreedState!().sb), { timeout: 20_000 }).toBeLessThan(0.01);
  expect(await events(page)).toContain('room_loop');
  await expect.poll(async () => (await s4(page)).state, { timeout: 10_000 }).toBe('hall');
  // the seam held the section's frame under the forming cloud: every cover-in frame drew the carousel, never the hall (X-15)
  expect((await s4(page)).seamDraws).toEqual(['scenes']);
  // the new lap: the prompt is back in the Tab order for the next walk
  expect(await page.evaluate(() => { const e = document.getElementById('rmEnter')!; return e.hidden || e.inert; })).toBe(false);

  // the wrap from the top: the reverse seam onto scene 5 with the followers snapped (the state seam until its lock ends,
  // the carousel drawn under the cloud from the landing), room_wrap and the wrap's own line, the prompt out of the Tab order
  const wrapCover = await holdAtCover(page, 'wrap');
  expect(wrapCover?.seam?.kind).toBe('wrap');
  // held at full cover over the landing: Urban Slate again, over the cloud that covers scene 5
  await expect(page.locator('.site-logo')).toHaveAttribute('data-tone', 'light');
  await expect(page.locator('.site-logo')).toHaveCSS('color', URBAN_SLATE_CSS);
  await expect.poll(async () => (await s4(page)).under, { timeout: 30_000 }).toBe('world');
  expect((await s4(page)).state).toBe('seam');
  expect((await s4(page)).draws).toBe('scenes');
  expect((await s4(page)).lock).toBe(true);
  await release(page);
  await expect.poll(async () => (await s4(page)).state, { timeout: 30_000 }).toBe('world');
  expect((await s4(page)).scene).toBe(N - 1);
  await expect(page.locator('.site-logo')).toHaveAttribute('data-tone', 'dark', { timeout: 10_000 });   // dawn's own tone again once the cloud has gone
  expect(await page.evaluate(() => { const e = document.getElementById('rmEnter')!; return e.hidden && e.inert; })).toBe(true);
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
  // the refused play() (spec 5 "Video policy", AC14; the build record's section 10): where the browser decodes the loops
  // (the installed Chrome) scene 1's loop is in and the pool reads its rejected play() as a refusal on the next frame
  // (video.ts: the carousel's per-frame play() no longer erases it), so the hooks read refused and in false, the still
  // stays, no video plays, and on a Tune build the line says so; where the browser has no H.264 (the harness's Chromium)
  // the loop never gets in and reads failed, AC14's state for a loop that failed: the still stays the same way, no line
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
  await expect(page.locator('#room')).toHaveAttribute('data-state', 'world', { timeout: 10_000 });
  await expect(page.locator('#rmScenes')).toBeVisible();
  expect(await page.locator('.rm-scene:visible').count()).toBe(N);
  expect(await noHScroll(page)).toBe(true);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('section 4 at 390 x 844: a cold first-visit wrap from the top lands on scene 5 under the cloud before the hall is in, the seam held until its lock ends, the next gesture unlocking the loops', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await open3d(page, baseURL);
  // at scroll 0 with the intro over and nothing of the section loaded: the wrap imports the director first, waits for the cloud, then runs
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => window.__s4!.wrap());
  await expect.poll(async () => (await s4(page))?.state ?? null, { timeout: 60_000 }).toBe('seam');
  // once landed the frame is the carousel at scene 5 under the cloud while the state stays seam through the hold, the cover-out and the lock
  await expect.poll(async () => (await s4(page)).under, { timeout: 60_000 }).toBe('world');
  expect((await s4(page)).state).toBe('seam');
  expect((await s4(page)).draws).toBe('scenes');
  expect((await s4(page)).lock).toBe(true);
  await expect.poll(async () => (await s4(page)).state, { timeout: 60_000 }).toBe('world');
  expect((await s4(page)).scene).toBe(N - 1);
  await expect(page.locator('#room')).toHaveAttribute('data-scene', '4');
  await expect.poll(() => pageQ(page), { timeout: 10_000 }).toBeCloseTo(12, 1);
  await expect.poll(() => page.evaluate(() => Math.abs(window.__skreedState!().sb - scrollY / innerHeight)), { timeout: 20_000 }).toBeLessThan(0.05);
  expect(await events(page)).toContain('room_wrap');
  await expect(page.locator('.rm-scene[data-i="4"]')).toHaveClass(/is-on/);
  expect(await page.evaluate(() => document.getElementById('rmScenes')!.inert)).toBe(false);
  // the prompt is out of the Tab order while the scenes stand (AC13); the hall loads behind for the way back
  expect(await page.evaluate(() => { const e = document.getElementById('rmEnter')!; return e.hidden && e.inert; })).toBe(true);
  // the next gesture after a wrap unlocks the loop elements (AC7): no error, and scene 5's loop settles in or failed
  await page.mouse.click(200, 300);
  await expect.poll(async () => (await s4(page)).loops[N - 1]?.state ?? '', { timeout: 120_000 }).toMatch(/^(in|failed)$/);
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 300_000, polling: 500 });
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
  // past the middle: to the span's end, the hall fully in (q 1); the hero's followers follow the page as they do today
  await page.mouse.wheel(0, span.mid - span.start + 200);
  await expect.poll(y, { timeout: 5_000 }).toBeCloseTo(span.end, 0);
  await page.waitForTimeout(800);
  expect(await y()).toBeCloseTo(span.end, 0);
  // a Shift+Tab from the section's prompt into the quiz: the browser's own focus scroll, and no settle follows it
  await page.evaluate((t) => scrollTo({ top: t, behavior: 'instant' }), span.start + 300);
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getElementById('rmEnter')!.focus({ preventScroll: true }));
  await page.keyboard.press('Shift+Tab');
  await page.waitForTimeout(150);
  const after = await y();
  expect(await page.evaluate(() => !!document.activeElement && !!document.activeElement.closest('#find'))).toBe(true);
  await page.waitForTimeout(1000);
  expect(await y()).toBe(after);
  await ctx.close();
});

test('section 4 at 390 x 844: Ctrl+wheel in range is the browser\'s zoom and never steps; a one-finger pan at visualViewport.scale 2 never steps (AC3)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const page = await ctx.newPage();
  await open3d(page, baseURL);
  await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 300_000, polling: 500 });
  await goQ(page, 4); await goQ(page, 9.5);
  await page.waitForFunction(() => (window.__s4!.state() as { worldReady: boolean }).worldReady, null, { timeout: 600_000, polling: 500 });
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

test('section 4 at 390 x 844 under reduced motion (still3d): no loop elements, the dissolve entry, a step as a cut, an instant exit seam and an instant wrap (AC11)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await open3d(page, baseURL);
  await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 300_000, polling: 500 });
  await goQ(page, 4); await goQ(page, 9.5);
  await page.waitForFunction(() => (window.__s4!.state() as { worldReady: boolean }).worldReady, null, { timeout: 600_000, polling: 500 });
  expect((await s4(page)).video).toBe(false);   // stills on every plane: no loop element is made
  expect((await s4(page)).arrive).toBeCloseTo(0.6, 1);   // the 600 ms dissolve
  const t0 = Date.now();
  expect(await page.evaluate(() => window.__s4!.enter())).toBe(true);
  await expect.poll(async () => (await s4(page)).state, { timeout: 10_000 }).toBe('world');
  expect(Date.now() - t0).toBeLessThan(2500);
  await expect.poll(() => pageQ(page), { timeout: 5_000 }).toBeCloseTo(10, 1);
  // a step is a cut with a 300 ms cross-fade: the next scene well within a second, the page snapped
  await expect.poll(() => page.evaluate(() => window.__s4!.step(1)), { timeout: 30_000 }).toBe(true);
  await expect.poll(async () => (await s4(page)).scene, { timeout: 2_000 }).toBe(1);
  await expect.poll(async () => (await s4(page)).busy, { timeout: 2_000 }).toBe(false);
  await expect.poll(() => pageQ(page), { timeout: 5_000 }).toBeCloseTo(10.5, 1);
  // the exit seam is a cut: the jump to the top at once, then its 400 ms lock, then the hall
  await page.evaluate(() => window.__s4!.scene(4));
  await expect.poll(async () => (await s4(page)).scene, { timeout: 10_000 }).toBe(4);
  await page.evaluate((q) => { const room = document.getElementById('room')!, top = room.getBoundingClientRect().top + scrollY; scrollTo({ top: top + q * innerHeight, behavior: 'instant' }); }, LOOP_START + 0.1);
  await page.waitForFunction(() => scrollY < 2, null, { timeout: 5_000, polling: 50 });
  expect(await events(page)).toContain('room_loop');
  await expect.poll(async () => (await s4(page)).state, { timeout: 5_000 }).toBe('hall');
  // the wrap is a cut too: world at scene 5 once its lock ends
  await page.evaluate(() => window.__s4!.wrap());
  await expect.poll(async () => (await s4(page)).state, { timeout: 5_000 }).toBe('world');
  expect((await s4(page)).scene).toBe(N - 1);
  await expect.poll(() => pageQ(page), { timeout: 5_000 }).toBeCloseTo(12, 1);
  expect(await events(page)).toContain('room_wrap');
  expect(errors).toEqual([]);
  await ctx.close();
});

test('section 4 on the poster tier: the still, the prompt at once, the five scenes in a column after the press, no tall track', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/?tier=poster&room=open', baseURL).href);
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
