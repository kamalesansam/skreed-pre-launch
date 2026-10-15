// Build step 6 exit (hero-architecture.md 17): the test build at ?tier=hero3d reaches frame2 and lifts at 390 x 844 and
// 1280 x 800 with no console error, and the 27 milestones arrive in the order of loader-weights.json (AC3.2's order part).
// Round 3: the island then runs the intro (8.2 s of scene time) and drops its page lock and UI classes at its end.
// SwiftShader renders the island here, so each run takes up to a few minutes.
import { test, expect } from '@playwright/test';
import WT from '../../src/config/loader-weights.json' with { type: 'json' };

const CASES = [
  { name: '390 x 844', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.25 },
  { name: '1280 x 800', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 },
];

for (const c of CASES) {
  test(`the island reaches frame2 and lifts at ${c.name}; 27 milestones in order; the intro ends; no console error`, async ({ browser, baseURL }) => {
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
    // the intro's end: html is back to the plain 3D classes (no intro, uh1..uh4), the scene is live. SwiftShader draws the
    // shot at a frame or two a second on the 1920 x 1200 buffer, so the shot is pinned near its end (the hook of
    // hero-architecture.md 10) and played out from there; the lift itself ran the shot's first seconds above.
    await page.waitForFunction(() => !!window.__skreedIntro && window.__skreedIntro.state().t > 0.2, null, { timeout: 300_000, polling: 500 });
    await page.evaluate(() => { window.__skreedIntro!.seek(8.0); window.__skreedIntro!.play(); });
    await page.waitForFunction(() => document.documentElement.className === 'js hero3d', null, { timeout: 600_000, polling: 500 });
    const r = await page.evaluate(() => ({ cls: document.documentElement.className, times: window.__skreedMilestoneTimes ?? {}, started: window.__heroStarted, dead: window.__skreedDead, calls: window.__skreedIntroDoneCalls }));
    expect(r.cls).toBe('js hero3d');
    expect(r.started).toBe(true);
    expect(r.dead).toBe(false);
    expect(r.calls).toBe(1);
    expect(Object.keys(r.times)).toEqual(Object.keys(WT));
    expect(Object.keys(WT)).toHaveLength(27);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
    expect(errors).toEqual([]);
    await ctx.close();
  });
}
