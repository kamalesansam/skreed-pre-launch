// AC2.1 pull-back (round 3: against the v11.4 prototype, whose scroll map the port carries): in normal motion with no
// pointer and the intro skipped, scroll to 0, 1.25, 2.5, 3.75 and 5 screens (the level weaving pull-back), then 5.5 and 6
// (the wipe, where the camera keeps backing away along the curve), wait until the scroll follower has settled on the
// target, and compare __skreedState().cam with the prototype's at the hook's 4-decimal precision. The camera's position
// depends only on the scroll (no pointer, so no parallax), so a small viewport is used for speed: 360 x 400, where every
// target is a whole pixel. Past 5 screens the follower waits for section 2's build on both pages (the hold at PULL).
import { test, expect, type Browser, type Page } from '@playwright/test';
import { launch } from '../harness/browser.ts';
import { servePrototype, PROTO11_URL } from '../harness/prototype.ts';

const TARGETS = [0, 1.25, 2.5, 3.75, 5, 5.5, 6];
let gl: Browser;
test.beforeAll(async () => { gl = await launch(); });
test.afterAll(async () => { await gl?.close(); });

async function open(url: string, proto: boolean): Promise<Page> {
  const ctx = await gl.newContext({ viewport: { width: 360, height: 400 }, deviceScaleFactor: 1 });
  if (proto) await servePrototype(ctx, { version: 'v11.4' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 300_000 });
  await page.waitForFunction(() => !document.getElementById('intro') && typeof window.__skreedState === 'function', null, { timeout: 900_000, polling: 500 });
  return page;
}

async function camAt(page: Page, screens: number): Promise<number[]> {
  await page.evaluate((s) => scrollTo(0, s * innerHeight), screens);
  // settled: the second follower equals the target to 1e-9, so the camera is final at 4 decimals
  await page.waitForFunction((s) => Math.abs(window.__skreedState!().sb - s) < 1e-9, screens, { timeout: 900_000, polling: 300 });
  return page.evaluate(() => window.__skreedState!().cam);
}

test('AC2.1 the pull-back camera equals the v11.4 prototype at 0, 1.25, 2.5, 3.75, 5, 5.5 and 6 screens', async ({ baseURL }, info) => {
  test.setTimeout(3_000_000);
  const [a, b] = await Promise.all([open(PROTO11_URL, true), open(new URL('/?tier=hero3d&intro=0', baseURL).href, false)]);
  const rows: string[] = [];
  for (const s of TARGETS) {
    const [ca, cb] = await Promise.all([camAt(a, s), camAt(b, s)]);
    rows.push(`${s}: proto ${JSON.stringify(ca)} port ${JSON.stringify(cb)}`);
    expect(cb, `cam at ${s} screens`).toEqual(ca);
  }
  console.log('[AC2.1 v11.4] ' + rows.join(' | '));
  info.annotations.push({ type: 'cam', description: rows.join(' | ') });
  expect(rows.length).toBe(7);
  // the level pull-back (Sam, 2026-10-10: never flying up): y stays within the 0.75 rise, z backs away
  const y = (r: string) => JSON.parse(r.split('port ')[1])[1] as number, z = (r: string) => JSON.parse(r.split('port ')[1])[2] as number;
  for (const r of rows) { expect(y(r)).toBeGreaterThanOrEqual(-2.5); expect(y(r)).toBeLessThanOrEqual(-1.75 + 1e-9); }
  expect(z(rows[4])).toBeGreaterThan(z(rows[0]));
});
