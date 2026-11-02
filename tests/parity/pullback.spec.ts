// AC2.1 pull-back (round 3: against the v11.4 prototype; re-paired on 2026-11-02, when the port's scroll map became the
// prototype's halved, section-2.md 14): in normal motion with no pointer and the intro skipped, the prototype is driven to
// 0, 1.25, 2.5, 3.75 and 5 screens (its level weaving pull-back) and the port to half of each, where s = ease(b / PULL) is
// the same on both pages; then inside the wipe to equal curve parameter (v = 1 + (b - PULL) / (LAND - PULL): the prototype
// at 5.475 and 5.95, the port at 2.6025 and 2.705, v 1.05 and 1.1, where the camera keeps backing away along the curve).
// Each page waits until its scroll follower has settled on its own target, and __skreedState().cam must agree at the
// hook's 4-decimal precision. The camera's position depends only on the scroll (no pointer, so no parallax), so a small
// viewport is used for speed: 360 x 400, where every target is a whole pixel (1041 and 1082 px for the port's wipe
// targets, 2190 and 2380 for the prototype's). Past the pull-back the follower waits for section 2's build on both pages
// (the hold at PULL).
import { test, expect, type Browser, type Page } from '@playwright/test';
import { launch } from '../harness/browser.ts';
import { servePrototype, PROTO11_URL } from '../harness/prototype.ts';
import { S2T } from '../../src/config/hero.ts';

/** the pinned v11.4 prototype's map (template.html: PULL 5, S2T.LAND 14.5) */
const PROTO = { PULL: 5, LAND: 14.5 };
/** [prototype position, port position], in screens */
const TARGETS: [number, number][] = [[0, 0], [1.25, 0.625], [2.5, 1.25], [3.75, 1.875], [5, 2.5], [5.475, 2.6025], [5.95, 2.705]];
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

test('AC2.1 the pull-back camera equals the v11.4 prototype at equal ease over the pull-back (the port at half the prototype\'s scroll) and at equal curve parameter inside the wipe', async ({ baseURL }, info) => {
  test.setTimeout(3_000_000);
  // the pairs really are the same point of the map: the same s over the pull-back, the same v inside the wipe
  for (const [sa, sb] of TARGETS) {
    if (sa <= PROTO.PULL) expect(sb).toBeCloseTo(sa * S2T.PULL / PROTO.PULL, 9);
    else expect((sb - S2T.PULL) / (S2T.LAND - S2T.PULL)).toBeCloseTo((sa - PROTO.PULL) / (PROTO.LAND - PROTO.PULL), 9);
    expect(Number.isInteger(sa * 400) && Number.isInteger(sb * 400), `whole pixels at 400 px tall: ${sa}, ${sb}`).toBe(true);
  }
  const [a, b] = await Promise.all([open(PROTO11_URL, true), open(new URL('/?tier=hero3d&intro=0', baseURL).href, false)]);
  const rows: string[] = [];
  for (const [sa, sb] of TARGETS) {
    const [ca, cb] = await Promise.all([camAt(a, sa), camAt(b, sb)]);
    rows.push(`${sa}/${sb}: proto ${JSON.stringify(ca)} port ${JSON.stringify(cb)}`);
    expect(cb, `cam at the prototype's ${sa} and the port's ${sb} screens`).toEqual(ca);
  }
  console.log('[AC2.1 v11.4, the map of 2026-11-02] ' + rows.join(' | '));
  info.annotations.push({ type: 'cam', description: rows.join(' | ') });
  expect(rows.length).toBe(7);
  // the level pull-back (Sam, 2026-10-10: never flying up): y stays within the 0.75 rise, z backs away
  const y = (r: string) => JSON.parse(r.split('port ')[1])[1] as number, z = (r: string) => JSON.parse(r.split('port ')[1])[2] as number;
  for (const r of rows) { expect(y(r)).toBeGreaterThanOrEqual(-2.5); expect(y(r)).toBeLessThanOrEqual(-1.75 + 1e-9); }
  expect(z(rows[4])).toBeGreaterThan(z(rows[0]));
});
