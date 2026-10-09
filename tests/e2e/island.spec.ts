// Build step 6 exit (hero-architecture.md 17): the test build at ?tier=hero3d reaches frame2 and lifts at 390 x 844 and
// 1280 x 800 with no console error, and the 23 milestones arrive in the order of loader-weights.json (AC3.2's order part).
// SwiftShader renders the island here, so each run takes up to a few minutes.
import { test, expect } from '@playwright/test';
import WT from '../../src/config/loader-weights.json' with { type: 'json' };

const CASES = [
  { name: '390 x 844', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.25 },
  { name: '1280 x 800', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 },
];

for (const c of CASES) {
  test(`the island reaches frame2 and lifts at ${c.name}; 23 milestones in order; no console error`, async ({ browser, baseURL }) => {
    test.setTimeout(600_000);
    const ctx = await browser.newContext({ viewport: c.viewport, deviceScaleFactor: c.deviceScaleFactor });
    const page = await ctx.newPage();
    const errors: string[] = [], seen: number[] = [];
    // Zero console errors, literally: nothing is filtered (public/favicon.ico ships, so the browser's own icon request is
    // a 200). Failing page requests are also caught by status through the response listener below.
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${new URL(r.url()).pathname}`); });
    await page.goto(new URL('/?tier=hero3d', baseURL).href);
    // aria-valuenow never decreases while loading (AC3.2)
    const poll = setInterval(() => { page.evaluate(() => +(document.getElementById('intro')?.getAttribute('aria-valuenow') ?? -1)).then((v) => { if (v >= 0) seen.push(v); }, () => {}); }, 250);
    await page.waitForFunction(() => !document.getElementById('intro'), null, { timeout: 540_000, polling: 500 });
    clearInterval(poll);
    const r = await page.evaluate(() => ({ cls: document.documentElement.className, times: window.__skreedMilestoneTimes ?? {}, started: window.__heroStarted, dead: window.__skreedDead, calls: window.__skreedIntroDoneCalls }));
    expect(r.cls).toBe('js hero3d');
    expect(r.started).toBe(true);
    expect(r.dead).toBe(false);
    expect(r.calls).toBe(1);
    expect(Object.keys(r.times)).toEqual(Object.keys(WT));
    expect(Object.keys(WT)).toHaveLength(23);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
    expect(errors).toEqual([]);
    await ctx.close();
  });
}
