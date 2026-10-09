// Canvas-only captures (hero-architecture.md 13.1): every DOM overlay and the poster hidden, then #stage alone.
import type { Page } from '@playwright/test';

export const OVERLAYS = '#intro,.site-logo,.copy,.cue,.tune,.labels,.fallback,.hero-poster';

export async function hideOverlays(page: Page): Promise<void> {
  await page.addStyleTag({ content: `${OVERLAYS}{display:none!important}` });
}

/** Waits for the loader's ready and more than 3 rendered frames (settle.waitReady), then 3 more frames after hiding. */
export async function captureStage(page: Page, path: string, timeout = 600_000): Promise<void> {
  await page.waitForFunction(() => {
    const w = window as unknown as { __skreedLoader?: { state(): { ready: boolean } }; __skreedFrame?: number };
    return !!w.__skreedLoader && w.__skreedLoader.state().ready && (w.__skreedFrame ?? 0) > 3;
  }, null, { timeout, polling: 500 });
  await hideOverlays(page);
  const f0 = await page.evaluate(() => (window as unknown as { __skreedFrame: number }).__skreedFrame);
  await page.waitForFunction((n) => (window as unknown as { __skreedFrame: number }).__skreedFrame > n + 2, f0, { timeout, polling: 200 });
  await page.locator('#stage').screenshot({ path, timeout });
}
