// Holding pages still for loader-only specs (AC3.1, AC3.10, AC3.11).
import type { BrowserContext } from '@playwright/test';

/**
 * The port: boot.ts awaits the poster's decode() before it requests any island byte (spec D11), so a decode that never
 * settles keeps the island from starting without failing anything. The loader then runs on its own, as it does on a
 * slow network, and nothing routes to the poster.
 */
export async function holdIsland(ctx: BrowserContext): Promise<void> {
  await ctx.addInitScript(() => { HTMLImageElement.prototype.decode = () => new Promise<void>(() => {}); });
}

/**
 * The prototype with three.js aborted: its module never runs, and its noHero listener would hand the loader to its
 * poster state on the module's load error. Marking the hero as started turns noHero into a no-op.
 */
export async function holdPrototypeLoader(ctx: BrowserContext): Promise<void> {
  await ctx.addInitScript(() => { (window as unknown as { __heroStarted: boolean }).__heroStarted = true; });
}
