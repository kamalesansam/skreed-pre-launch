// AC1.1: the test build's runtime params carry Sam's 13 locked values (hero.md section 0; docs/specs/evidence/
// LOCKED_VALUES.md) and logoIdle 0 (D20). Read from the running island through __skreedParams().
import { test, expect } from '@playwright/test';

const LOCKED = {
  fog: 1, fogBright: 0.4, fogSpeed: 0.15, fogSize: 1, fogHug: 1.6,
  gExp: 0.2, gGamma: 0.87, gNear: 0.54, gToe: 0.02, crumb: 0.53, crumbSize: 0.07, mist: 0.2, mistSpeed: 0.55,
};

test('AC1.1 the running hero carries the 13 locked values and logoIdle 0', async ({ page }) => {
  test.setTimeout(600_000);
  await page.goto('/?tier=hero3d');
  await page.waitForFunction(() => typeof window.__skreedParams === 'function', null, { timeout: 540_000, polling: 500 });
  const p = await page.evaluate(() => window.__skreedParams!());
  for (const [k, v] of Object.entries(LOCKED)) expect(p[k], k).toBe(v);
  expect(Object.keys(LOCKED)).toHaveLength(13);
  expect(p.logoIdle).toBe(0);
  expect(Object.keys(p)).toHaveLength(66);
});
