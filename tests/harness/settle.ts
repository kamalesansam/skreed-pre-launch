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
