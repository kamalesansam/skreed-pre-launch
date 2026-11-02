// AC2.1 pull-back (round 3: against the v11.4 prototype; re-paired on 2026-11-02, when the port's scroll map became the
// prototype's halved, section-2.md 14, and again on 2026-11-03, when the pull-back became half the camera's road at the
// prototype's rate with the drift after it at the prototype's rate too, section-2.md 15): in normal motion with no pointer
// and the intro skipped, both pages are driven to the same point of the road, the parameter v of camCurve: the port's
// v = CAM_TRAVEL x ease(b / PULL) over its pull-back and CAM_TRAVEL + CAM_DRIFT x (b - PULL) / (LAND - PULL) after it, the
// prototype's v = ease(b / 5) over its own pull-back, which is where every point of the port's road lies (v at most 0.742).
// Each page waits until its scroll follower has settled on its own target, and __skreedState().cam must agree: exactly at
// the two pairs whose positions are both whole pixels at the same v (0 and the port's pull-end, v 0.5, the prototype's
// 2.5 screens), and to 3 decimals at the others, whose prototype position rounds to a whole pixel within 0.004 px (a v
// error under 3e-6, a camera error under 2e-4). The camera's position depends only on the scroll (no pointer, so no
// parallax), so a small viewport is used for speed: 360 x 400. Past the pull-back the follower waits for section 2's build
// on both pages (the hold at PULL).
import { test, expect, type Browser, type Page } from '@playwright/test';
import { launch } from '../harness/browser.ts';
import { servePrototype, PROTO11_URL } from '../harness/prototype.ts';
import { CAM_DRIFT, CAM_TRAVEL, PROTO_MAP, S2T } from '../../src/config/hero.ts';

/** the pinned v11.4 prototype's map (template.html: PULL 5, S2T.LAND 14.5) */
const PROTO = { PULL: 5, LAND: 14.5 };
/** [prototype position, port position], in screens: the same v on both pages (the port's two pull-back points, its pull-end, two points inside the wipe, one in the flight) */
const TARGETS: [number, number][] = [[0, 0], [0.9525, 0.6975], [2.31, 1.975], [2.5, 2.5], [2.7075, 3.09], [2.8175, 3.4], [3.1375, 4.2775]];
/** exact pairs: both positions whole pixels at exactly the same v */
const EXACT = new Set([0, 2.5]);
const ease = (t: number) => t * t * (3 - 2 * t);
/** the road's parameter on each page (camera/rig.ts camCurve; the prototype's camCurve with v = s + u2) */
const vPort = (b: number) => b <= S2T.PULL ? CAM_TRAVEL * ease(b / S2T.PULL) : CAM_TRAVEL + CAM_DRIFT * Math.min(1, (b - S2T.PULL) / (S2T.LAND - S2T.PULL));
const vProto = (b: number) => b <= PROTO.PULL ? ease(b / PROTO.PULL) : 1 + Math.min(1, (b - PROTO.PULL) / (PROTO.LAND - PROTO.PULL));
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

test('AC2.1 the pull-back camera equals the v11.4 prototype at the same point of the road (the port\'s pull-back half the road at the prototype\'s rate, the drift after it at its rate)', async ({ baseURL }, info) => {
  test.setTimeout(3_000_000);
  // the pairs really are the same point of the road: the same v on both pages, exactly at the exact pairs and within 3e-6 at the rest; whole pixels at 400 px
  expect([PROTO_MAP.PULL, PROTO_MAP.LAND]).toEqual([PROTO.PULL, PROTO.LAND]);
  for (const [sa, sb] of TARGETS) {
    if (EXACT.has(sa)) expect(vPort(sb)).toBe(vProto(sa)); else expect(Math.abs(vPort(sb) - vProto(sa)), `v at ${sa}/${sb}`).toBeLessThan(3e-6);
    expect(Number.isInteger(Math.round(sa * 400 * 1e6) / 1e6) && Number.isInteger(Math.round(sb * 400 * 1e6) / 1e6), `whole pixels at 400 px tall: ${sa}, ${sb}`).toBe(true);
  }
  const [a, b] = await Promise.all([open(PROTO11_URL, true), open(new URL('/?tier=hero3d&intro=0', baseURL).href, false)]);
  const rows: string[] = [];
  for (const [sa, sb] of TARGETS) {
    const [ca, cb] = await Promise.all([camAt(a, sa), camAt(b, sb)]);
    rows.push(`${sa}/${sb}: proto ${JSON.stringify(ca)} port ${JSON.stringify(cb)}`);
    if (EXACT.has(sa)) expect(cb, `cam at the prototype's ${sa} and the port's ${sb} screens`).toEqual(ca);
    else { expect(cb.length).toBe(ca.length); cb.forEach((c, i) => expect(c, `cam[${i}] at the prototype's ${sa} and the port's ${sb} screens`).toBeCloseTo(ca[i], 3)); }
  }
  console.log('[AC2.1 v11.4, the map of 2026-11-03] ' + rows.join(' | '));
  info.annotations.push({ type: 'cam', description: rows.join(' | ') });
  expect(rows.length).toBe(7);
  // the level pull-back (Sam, 2026-10-10: never flying up): y stays within the 0.75 rise, z backs away
  const y = (r: string) => JSON.parse(r.split('port ')[1])[1] as number, z = (r: string) => JSON.parse(r.split('port ')[1])[2] as number;
  for (const r of rows) { expect(y(r)).toBeGreaterThanOrEqual(-2.5); expect(y(r)).toBeLessThanOrEqual(-1.75 + 1e-9); }
  expect(z(rows[4])).toBeGreaterThan(z(rows[0]));
});
