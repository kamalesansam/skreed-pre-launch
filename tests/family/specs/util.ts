// Shared helpers for the family page specs.
import type { BrowserContext, Page } from '@playwright/test';

export const FAMILIES = ['frosty-whites', 'blissful-blues', 'playful-pinks', 'vivid-violets', 'mellow-yellows', 'earthy-browns', 'blushing-corals', 'stormy-greys', 'go-green', 'roaring-reds'] as const;
export const NAMES = ['Frosty Whites', 'Blissful Blues', 'Playful Pinks', 'Vivid Violets', 'Mellow Yellows', 'Earthy Browns', 'Blushing Corals', 'Stormy Greys', 'Go Green', 'Roaring Reds'] as const;
export const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
export const WIDE = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };

/** Records securitypolicyviolation events and skreed:track events from the first script on. */
export async function watch(ctx: BrowserContext): Promise<void> {
  await ctx.addInitScript(() => {
    const w = window as unknown as { __csp: string[]; __events: { event: string; props: Record<string, unknown> }[] };
    w.__csp = []; w.__events = [];
    document.addEventListener('securitypolicyviolation', (e) => w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    addEventListener('skreed:track', (e) => w.__events.push((e as CustomEvent).detail));
  });
}
export const cspViolations = (p: Page) => p.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
export const events = (p: Page) => p.evaluate(() => (window as unknown as { __events: { event: string; props: Record<string, unknown> }[] }).__events);
export const shade = (p: Page) => p.evaluate(() => document.documentElement.dataset.shade);

/** Requests that belong to the 3D island: any /_astro/ script outside the grid-mode set (the page module and its small
 * shared chunks, the island's boot stub), and any model file. Rollup names shared chunks after their first module (three
 * lands in a chunk named after a config module), so an allowlist is the reliable test, not a name pattern. */
export const islandRequests = (paths: string[]) => paths.filter((u) => /\.glb$/.test(u) ||
  (/^\/_astro\/.*\.js$/.test(u) && !/^\/_astro\/((FamilyPage|FamilyLinksNav|Island3D)\.astro_astro_type_script_[^/]+|(bus|motion|timing|track|preload-helper)\.[\w-]+\.js)$/.test(u)));
