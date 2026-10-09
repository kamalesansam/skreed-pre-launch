// AC10.5: the CSP header is present (asserted before counting violations), its _headers line is at most 1900
// characters, and no securitypolicyviolation fires on the poster paths and the loader state (build step 4).
import { test, expect, type BrowserContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { watchCsp, cspViolations } from '../harness/csp.ts';

test('AC10.5 the header is on / and its line fits the _headers limit', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const csp = res.headers()['content-security-policy'];
  expect(csp, 'Content-Security-Policy header on /').toBeTruthy();
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  const line = readFileSync(new URL('../../dist/_headers', import.meta.url), 'utf8').split('\n').find((l) => /^\s+Content-Security-Policy:/.test(l))!;
  expect(line.length).toBeLessThanOrEqual(1900);
});

const CASES: Record<string, { query: string; setup?: (ctx: BrowserContext) => Promise<void>; opts?: object }> = {
  'poster tier': { query: '?tier=poster' },
  'loader (3D tier, island not built yet)': { query: '?tier=hero3d' },
  'still3d tier': { query: '?tier=still3d' },
  'reduced motion': { query: '', opts: { reducedMotion: 'reduce' } },
  'no WebGL2': { query: '', setup: (ctx) => ctx.addInitScript(() => { delete (window as unknown as Record<string, unknown>).WebGL2RenderingContext; }) },
  'phone poster': { query: '?tier=poster', opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
};

for (const [name, c] of Object.entries(CASES)) {
  test(`AC10.5 zero CSP violations: ${name}`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext(c.opts ?? {});
    await watchCsp(ctx);
    if (c.setup) await c.setup(ctx);
    const page = await ctx.newPage();
    const res = await page.goto(new URL('/' + c.query, baseURL).href);
    expect(res!.headers()['content-security-policy']).toBeTruthy();
    await page.waitForTimeout(2500);   // past the glitch intro and the loader's first passes
    if (name.startsWith('loader')) { await page.evaluate(() => window.__skreedLoader!.fail('')); await page.waitForTimeout(500); }
    await page.locator('#siteLogo').hover({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
    expect(await cspViolations(page)).toEqual([]);
    await ctx.close();
  });
}
