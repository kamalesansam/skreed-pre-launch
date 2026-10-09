// AC2.1 pull-back: in normal motion with no pointer, scroll to 0, 0.375, 0.75, 1.125 and 1.5 screens, wait until the
// scroll follower has settled on the target, and compare __skreedState().cam with the prototype's at the hook's
// 4-decimal precision. The camera's position depends only on the scroll (no pointer, so no parallax), so a small
// viewport is used for speed: 360 x 400, where every target is a whole pixel (0, 150, 300, 450, 600).
import { test, expect, type Browser, type Page } from '@playwright/test';
import { launch } from '../harness/browser.ts';
import { servePrototype, PROTO_URL } from '../harness/prototype.ts';

const TARGETS = [0, 0.375, 0.75, 1.125, 1.5];
let gl: Browser;
test.beforeAll(async () => { gl = await launch(); });
test.afterAll(async () => { await gl?.close(); });

async function open(url: string, proto: boolean): Promise<Page> {
  const ctx = await gl.newContext({ viewport: { width: 360, height: 400 }, deviceScaleFactor: 1 });
  if (proto) await servePrototype(ctx);
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

test('AC2.1 the pull-back camera equals the prototype at 0, 0.375, 0.75, 1.125 and 1.5 screens', async ({ baseURL }, info) => {
  test.setTimeout(3_000_000);
  const [a, b] = await Promise.all([open(PROTO_URL, true), open(new URL('/?tier=hero3d', baseURL).href, false)]);
  const rows: string[] = [];
  for (const s of TARGETS) {
    const [ca, cb] = await Promise.all([camAt(a, s), camAt(b, s)]);
    rows.push(`${s}: proto ${JSON.stringify(ca)} port ${JSON.stringify(cb)}`);
    expect(cb, `cam at ${s} screens`).toEqual(ca);
  }
  console.log('[AC2.1] ' + rows.join(' | '));
  info.annotations.push({ type: 'cam', description: rows.join(' | ') });
  // the pull-back ends on the pulled-back pose
  expect(rows.length).toBe(5);
});
