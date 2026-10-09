// Settle and determinism helpers (hero-architecture.md 13.1).
import type { BrowserContext, Page } from '@playwright/test';

/** An init script that pins Math.random to 0.5 (pinRandom). */
export async function pinRandom(ctx: BrowserContext | Page): Promise<void> {
  await ctx.addInitScript(() => { Math.random = () => 0.5; });
}

/** Injects html, body { background: #000 } so both pages share one ground (sameBackground; D24). */
export async function sameBackground(page: Page): Promise<void> {
  await page.addStyleTag({ content: 'html,body{background:#000!important}' });
}

/** Pauses every CSS animation of the cue at time 0 (pauseCue). */
export async function pauseCue(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const a of document.getAnimations()) {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      if (t && t.closest('.cue')) { a.pause(); a.currentTime = 0; }
    }
  });
}

/** Resolves when every web font the page uses has loaded. */
export async function fontsReady(page: Page): Promise<void> {
  await page.evaluate(async () => { await document.fonts.ready; });
}

/** Installs a fake clock paused at exactly this instant; page.clock.runFor() then moves it (fixDate, AC4). */
export async function pauseClockAt(page: Page, iso: string): Promise<void> {
  const t = new Date(iso).getTime();
  await page.clock.install({ time: t - 1000 });
  await page.clock.pauseAt(t);
}

type HookWin = { __skreedLoader?: { state(): { ready: boolean } }; __skreedFrame?: number; __skreedFreeze?: boolean; __skreedState?: () => { sb: number } };

/** Sets __skreedFreeze before any script runs, so scene time stays at 0 from the first frame (AC1.2). */
export async function freezeBeforeLoad(ctx: BrowserContext | Page): Promise<void> {
  await ctx.addInitScript(() => { (window as unknown as { __skreedFreeze: boolean }).__skreedFreeze = true; });
}

/** The loader's ready and more than 3 rendered frames (waitReady). */
export async function waitReady(page: Page, timeout = 600_000): Promise<void> {
  await page.waitForFunction(() => {
    const w = window as unknown as HookWin;
    return !!w.__skreedLoader && w.__skreedLoader.state().ready && (w.__skreedFrame ?? 0) > 3;
  }, null, { timeout, polling: 500 });
}

/** Waits for n more rendered frames. */
export async function moreFrames(page: Page, n = 2, timeout = 600_000): Promise<void> {
  const f0 = await page.evaluate(() => (window as unknown as HookWin).__skreedFrame ?? 0);
  await page.waitForFunction(([a, k]) => ((window as unknown as HookWin).__skreedFrame ?? 0) > a + k, [f0, n] as const, { timeout, polling: 200 });
}

/** Sets __skreedFreeze now, then waits 2 frames (freeze). */
export async function freeze(page: Page): Promise<void> {
  await page.evaluate(() => { (window as unknown as HookWin).__skreedFreeze = true; });
  await moreFrames(page, 2);
}

/** Scrolls to a position in screens and waits until the scroll follower has settled there at 4 decimals (settleScroll). */
export async function settleScroll(page: Page, screens: number, timeout = 600_000): Promise<void> {
  await page.evaluate((s) => scrollTo(0, Math.round(s * innerHeight)), screens);
  await page.waitForFunction((s) => {
    const st = (window as unknown as HookWin).__skreedState?.();
    return !!st && Math.abs(st.sb - Math.round(s * innerHeight) / innerHeight) < 5e-5;
  }, screens, { timeout, polling: 250 });
}
