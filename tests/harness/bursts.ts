// Records every logotype glitch burst from the first frame on: start and end in performance.now() time, read from
// whether .logo-tiles is displayed (the glitch shows it only during a burst).
import type { BrowserContext, Page } from '@playwright/test';

export interface Burst { start: number; end?: number }

export async function recordBursts(ctx: BrowserContext | Page): Promise<void> {
  await ctx.addInitScript(() => {
    const w = window as unknown as { __bursts: { start: number; end?: number }[] };
    w.__bursts = [];
    let on = false;
    const loop = (t: number) => {
      const g = document.querySelector('.site-logo .logo-tiles');
      const vis = !!g && !g.hasAttribute('display');
      if (vis && !on) w.__bursts.push({ start: t });
      if (!vis && on) w.__bursts[w.__bursts.length - 1].end = t;
      on = vis;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

export function bursts(page: Page): Promise<Burst[]> {
  return page.evaluate(() => (window as unknown as { __bursts: { start: number; end?: number }[] }).__bursts);
}

/** domContentLoadedEventStart: module scripts (the glitch install) run just before it. */
export function dclStart(page: Page): Promise<number> {
  return page.evaluate(() => (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).domContentLoadedEventStart);
}
