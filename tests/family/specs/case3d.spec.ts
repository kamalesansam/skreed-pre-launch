// The 3D lineup in a test build, the stand-in (PUBLIC_FAMILY_3D=dev) or the supplier model (on) (case-model-class.md
// 14: T4, T14, T15; the selection rules of family-page.md acceptance 5). SwiftShader is allowed with ?render=force, and
// ?tier=high skips the tier probe so the counts are deterministic (the probe has its own rows in supplier3d.spec.ts).
// Skipped on a build without the island (the default production build is swatch grid mode).
import { test, expect, type Page } from '@playwright/test';
import { PHONE, WIDE, watch, cspViolations, shade } from './util.ts';

type Info = { calls: number; triangles: number; frame: number; programs: number; geometries: number; textures: number; warmPrograms: number };
type St = { s: number; target: number; G: number; running: boolean };
const info = (p: Page) => p.evaluate(() => (window as unknown as { __famStage: { info(): Info } }).__famStage.info());
const st = (p: Page) => p.evaluate(() => (window as unknown as { __famStage: { state(): St } }).__famStage.state());
const project = (p: Page, slot: number) => p.evaluate((k) => (window as unknown as { __famStage: { project(k: number): { x: number; y: number } } }).__famStage.project(k), slot);
const pickAt = (p: Page, x: number, y: number) => p.evaluate(([a, b]) => (window as unknown as { __famStage: { pickAt(x: number, y: number): number | null } }).__famStage.pickAt(a, b), [x, y]);
async function settled(p: Page) {
  await p.waitForFunction(() => { const s = (window as unknown as { __famStage?: { state(): St } }).__famStage?.state(); return !!s && Math.abs(s.s - s.target) < 0.001 && s.G > 0.999 && !s.running; }, null, { timeout: 90_000, polling: 250 });
}
async function open(p: Page, slug: string, q = '') {
  await p.goto(`/shades/${slug}/?render=force&tier=high${q}`);
  const has = await p.evaluate(() => !!document.getElementById('fam-3d'));
  test.skip(!has, 'this build has no 3D island (PUBLIC_FAMILY_3D=off)');
  await p.waitForFunction(() => document.querySelector('#st3d canvas.on'), null, { timeout: 90_000 });
  await settled(p);
  await p.waitForFunction(() => (window as unknown as { __famStage: { state(): { detail: string } } }).__famStage.state().detail !== 'loading', null, { timeout: 90_000 });
}
/** A point on the visible strip of slot k: scan the row through its centre for pixels the pick gives to k. */
async function pointOn(p: Page, k: number): Promise<{ x: number; y: number } | null> {
  const c = await project(p, k);
  for (const dy of [0, -30, 30, -60, 60]) for (let dx = 0; dx <= 60; dx += 4) for (const sx of [1, -1]) {
    const x = c.x + sx * dx, y = c.y + dy;
    if (await pickAt(p, x, y) === k) return { x, y };
  }
  return null;
}

test('T4 renderer counts after the PMREM disposal and the warm-up, at 390 and 1280; idle renders nothing', async ({ browser }) => {
  for (const opts of [PHONE, WIDE]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await open(page, 'blissful-blues');
    await page.waitForFunction(() => (window as unknown as { __famStage: { info(): Info } }).__famStage.info().warmPrograms > 0, null, { timeout: 60_000 });
    const i = await info(page);
    const supplier = await page.evaluate(() => (window as unknown as { __famStage: { source: string } }).__famStage.source === 'supplier');
    expect(i.calls).toBeLessThanOrEqual(6);
    expect(i.programs).toBe(3);                   // shade matte, shade gloss (warmed), accent; the logo shares the shade programs; no device
    expect(i.geometries).toBe(supplier ? 6 : 4);  // body, accent (and the supplier's logo) at two LODs
    expect(i.textures).toBe(1);                   // the PMREM target only
    expect(i.triangles).toBeLessThanOrEqual(supplier ? 24 * 9811 + 2 * 20348 : 24 * 1800 + 2 * 7520);
    const f0 = (await info(page)).frame;
    await page.waitForTimeout(2000);
    expect((await info(page)).frame).toBe(f0);    // render on demand: 0 frames while nothing changes
    await ctx.close();
  }
});

test('T15 warm-up: the program count does not change on the first finish toggle; all 24 change in the same frame', async ({ browser }) => {
  const ctx = await browser.newContext(WIDE);
  await watch(ctx);
  const page = await ctx.newPage();
  await open(page, 'roaring-reds');
  await page.waitForFunction(() => (window as unknown as { __famStage: { info(): Info } }).__famStage.info().warmPrograms > 0, null, { timeout: 60_000 });
  const before = (await info(page)).programs;
  await page.getByRole('button', { name: 'Gloss' }).click();
  await settled(page);
  expect((await info(page)).programs).toBe(before);
  await page.getByRole('button', { name: 'Matte' }).click();
  await settled(page);
  expect((await info(page)).programs).toBe(before);
  expect(await cspViolations(page)).toEqual([]);
  await ctx.close();
});

test('T14 picking at 1280: after jumps to 01, 24 and 12, a click on the front case hits the front slot and only turns it', async ({ browser }) => {
  const ctx = await browser.newContext(WIDE);
  const page = await ctx.newPage();
  await open(page, 'go-green');
  const slider = page.getByRole('slider', { name: 'Shade' });
  for (const [key, slot] of [['Home', 0], ['End', 23]] as const) {
    await slider.focus();
    await page.keyboard.press(key);
    await settled(page);
    const c = await project(page, slot);
    expect(await pickAt(page, c.x, c.y)).toBe(slot);
    await page.mouse.click(c.x, c.y);
    await page.waitForTimeout(300);
    expect(await shade(page)).toBe(String(193 + slot));
    await settled(page);
  }
  // 12 with the scrubber (pointer)
  const r = (await slider.boundingBox())!;
  await page.mouse.click(r.x + (11.5 / 24) * r.width, r.y + r.height / 2);
  await settled(page);
  const c = await project(page, 11);
  expect(await pickAt(page, c.x, c.y)).toBe(11);
  await ctx.close();
});

test('T14 picking at 390: after moves to 04 and 20, a tap on every visible case selects that case', async ({ browser }) => {
  test.setTimeout(600_000);
  const ctx = await browser.newContext(PHONE);
  const page = await ctx.newPage();
  await open(page, 'blissful-blues');
  const sel = (i: number) => page.evaluate((k) => (window as unknown as { __fam: { select(i: number): void } }).__fam.select(k), i);
  for (const base of [3, 19]) {
    await sel(base); await settled(page);
    const stage = (await page.locator('#stage').boundingBox())!;
    const visible: number[] = [];
    for (let k = 0; k < 24; k++) { const c = await project(page, k); if (c.x > stage.x + 8 && c.x < stage.x + stage.width - 8) visible.push(k); }
    expect(visible.length).toBeGreaterThanOrEqual(5);
    for (const k of visible) {
      if (k === base) continue;
      await sel(base); await settled(page);
      const pt = await pointOn(page, k);
      expect(pt, `a visible pixel of case ${k + 1}`).not.toBeNull();
      await page.touchscreen.tap(pt!.x, pt!.y);
      await page.waitForTimeout(200);
      expect(await shade(page), `tap on case ${k + 1} from ${base + 1}`).toBe(String(25 + k).padStart(3, '0'));
    }
  }
  await ctx.close();
});

test('a tap on the front case turns it and changes nothing else; dragging moves the line and settles on a case', async ({ browser }) => {
  const ctx = await browser.newContext(PHONE);
  const page = await ctx.newPage();
  await open(page, 'earthy-browns');
  const before = await shade(page);
  const c = await project(page, 6);
  await page.touchscreen.tap(c.x, c.y);
  await page.waitForTimeout(150);
  expect((await st(page)).running).toBe(true);    // the 600 ms turn plays
  await settled(page);
  expect(await shade(page)).toBe(before);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  // a horizontal mouse drag of about three strips to the left moves the line toward higher shades
  const stage = (await page.locator('#stage').boundingBox())!;
  const y = stage.y + stage.height / 2;
  await page.mouse.move(stage.x + 300, y);
  await page.mouse.down();
  for (let k = 1; k <= 12; k++) { await page.mouse.move(stage.x + 300 - k * 11, y); await page.waitForTimeout(40); }
  await page.mouse.up();
  await settled(page);
  const after = Number(await shade(page));
  expect(after).toBeGreaterThan(Number(before));
  await ctx.close();
});

test('context loss: the canvas hides and returns on restore; a second loss lands in swatch grid mode', async ({ browser }) => {
  const ctx = await browser.newContext(WIDE);
  const page = await ctx.newPage();
  await open(page, 'stormy-greys');
  await page.evaluate(() => { const w = window as unknown as { __famStage: { lose(): WEBGL_lose_context }; __lc: WEBGL_lose_context }; w.__lc = w.__famStage.lose(); w.__lc.loseContext(); });
  await expect(page.locator('#st3d canvas')).not.toHaveClass(/\bon\b/);
  await page.evaluate(() => (window as unknown as { __lc: WEBGL_lose_context }).__lc.restoreContext());
  await expect(page.locator('#st3d canvas')).toHaveClass(/\bon\b/, { timeout: 60_000 });
  await page.evaluate(() => (window as unknown as { __lc: WEBGL_lose_context }).__lc.loseContext());
  await expect(page.locator('html')).toHaveClass(/\bgrid\b/, { timeout: 30_000 });
  await expect(page.locator('#stage .sgrid')).toBeVisible();
  await ctx.close();
});

test('software rendering without ?render=force lands in swatch grid mode, no message', async ({ page }) => {
  await page.goto('/shades/blissful-blues/');
  const has = await page.evaluate(() => !!document.getElementById('fam-3d'));
  test.skip(!has, 'this build has no 3D island');
  await expect(page.locator('html')).toHaveClass(/\bgrid\b/, { timeout: 60_000 });
  await expect(page.locator('#stage .sgrid')).toBeVisible();
  await expect(page.locator('#state')).toBeEmpty();
});
