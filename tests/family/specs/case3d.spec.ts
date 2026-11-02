// The 3D lineup in a test build, the stand-in (PUBLIC_FAMILY_3D=dev) or the supplier model (on) (case-model-class.md
// 14: T4, T14, T15; the selection rules of family-page.md acceptance 5). SwiftShader is allowed with ?render=force, and
// ?tier=high skips the tier probe so the counts are deterministic (the probe has its own rows in supplier3d.spec.ts).
// Skipped on a build without the island (the default production build is swatch grid mode).
import { test, expect, type Page } from '@playwright/test';
import { PHONE, WIDE, watch, cspViolations, shade } from './util.ts';

type Info = { calls: number; triangles: number; frame: number; programs: number; geometries: number; textures: number; warmPrograms: number };
type St = { s: number; target: number; G: number; busy: boolean; renders: number };   // busy: something still moves (round 3 on; running is the loop's own switch)
const info = (p: Page) => p.evaluate(() => (window as unknown as { __famStage: { info(): Info } }).__famStage.info());
const st = (p: Page) => p.evaluate(() => (window as unknown as { __famStage: { state(): St } }).__famStage.state());
const project = (p: Page, slot: number) => p.evaluate((k) => (window as unknown as { __famStage: { project(k: number): { x: number; y: number } } }).__famStage.project(k), slot);
const pickAt = (p: Page, x: number, y: number) => p.evaluate(([a, b]) => (window as unknown as { __famStage: { pickAt(x: number, y: number): number | null } }).__famStage.pickAt(a, b), [x, y]);
async function settled(p: Page) {
  await p.waitForFunction(() => { const s = (window as unknown as { __famStage?: { state(): St } }).__famStage?.state(); return !!s && Math.abs(s.s - s.target) < 0.001 && s.G > 0.999 && !s.busy; }, null, { timeout: 90_000, polling: 250 });
}
async function open(p: Page, slug: string, q = '') {
  await p.goto(`/shades/${slug}/?render=force&tier=high${q}`);
  const has = await p.evaluate(() => !!document.getElementById('fam-3d'));
  test.skip(!has, 'this build has no 3D island (PUBLIC_FAMILY_3D=off)');
  await p.waitForFunction(() => document.querySelector('#st3d canvas.on'), null, { timeout: 90_000 });
  // the loader stays up past the island's first frame (3.5 s against 0.8 s on a fast machine) and everything under it is
  // inert, so a tap before it lifts lands on nothing: wait for its exit before any row acts
  await p.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 90_000 });
  await settled(p);
  await p.waitForFunction(() => (window as unknown as { __famStage: { state(): { detail: string } } }).__famStage.state().detail !== 'loading', null, { timeout: 90_000 });
}

test('T4 renderer counts after the PMREM disposal, at 390 and 1280; idle renders nothing', async ({ browser }) => {
  for (const opts of [PHONE, WIDE]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await open(page, 'blissful-blue');
    const i = await info(page);
    const supplier = await page.evaluate(() => (window as unknown as { __famStage: { source: string } }).__famStage.source === 'supplier');
    // round 6 (family-page.md 24 D9): the row and the 24 logos on their plain materials, the front pair and the front
    // logo on the takeover's (off at rest); the type models load only past 0.5 screens, so none draws here
    expect(i.calls).toBeLessThanOrEqual(6);
    expect(i.warmPrograms).toBe(6);               // shade matte, shade gloss (warmed) and accent, each plain and with the takeover
    expect(i.programs).toBe(6);                   // the logos share the shade's programs; no device
    expect(i.geometries).toBe(supplier ? 6 : 4);  // body, accent (and the supplier's logo) at two LODs
    expect(i.textures).toBe(1);                   // the PMREM target only
    expect(i.triangles).toBeLessThanOrEqual(supplier ? 24 * 9811 + 2 * 20348 : 24 * 1800 + 2 * 7520);
    // render on demand: the loop draws no frame while nothing changes (its own count: info() renders a frame to read
    // the counts, so renderer.info's frame rises by one per call, round 6 24.4 criterion 12)
    const r0 = (await st(page)).renders;
    await page.waitForTimeout(2000);
    expect((await st(page)).renders).toBe(r0);
    await ctx.close();
  }
});

test('T15 warm-up: the program count does not change on the first finish toggle; all 24 change in the same frame', async ({ browser }) => {
  const ctx = await browser.newContext(WIDE);
  await watch(ctx);
  const page = await ctx.newPage();
  await open(page, 'roaring-red');
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
  await open(page, 'blissful-blue');
  const sel = (i: number) => page.evaluate((k) => (window as unknown as { __fam: { select(i: number): void } }).__fam.select(k), i);
  for (const base of [3, 19]) {
    await sel(base); await settled(page);
    // ciao's lineup (round 3, section 21; pose.test.ts "the skeleton": two cases in frame at 390): a neighbour shows a
    // strip at the stage's edge while its centre sits outside it, so a case is visible where the pick finds it inside
    // the stage, through the row's middle and 60 px above and below; its tap lands in the middle of its strip
    const stage = (await page.locator('#stage').boundingBox())!;
    const yc = (await project(page, base)).y;
    const runs = new Map<number, { x0: number; x1: number; y: number }>();
    for (const y of [yc, yc - 60, yc + 60]) for (let x = stage.x + 4; x < stage.x + stage.width - 4; x += 4) {
      const k = await pickAt(page, x, y);
      if (k == null) continue;
      const r = runs.get(k);
      if (!r) runs.set(k, { x0: x, x1: x, y }); else if (r.y === y) r.x1 = x;
    }
    const visible = [...runs.keys()];
    expect(visible.length, `cases in the stage from ${base + 1}`).toBeGreaterThanOrEqual(2);
    for (const k of visible) {
      if (k === base) continue;
      await sel(base); await settled(page);
      const r = runs.get(k)!, pt = { x: (r.x0 + r.x1) / 2, y: r.y };
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
  await open(page, 'basic-brown');
  const before = await shade(page);
  const c = await project(page, 6);
  await page.touchscreen.tap(c.x, c.y);
  await page.waitForTimeout(150);
  expect((await st(page)).busy).toBe(true);       // the 600 ms turn plays
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
  await open(page, 'stormy-grey');
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
  await page.goto('/shades/blissful-blue/');
  const has = await page.evaluate(() => !!document.getElementById('fam-3d'));
  test.skip(!has, 'this build has no 3D island');
  // the harness's software renderer (playwright.config.ts) only: on a GPU (playwright.gpu.config.ts) the gate finds it
  const software = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const d = gl?.getExtension('WEBGL_debug_renderer_info'); return !gl || !d || /swiftshader|llvmpipe|software/i.test(String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL))); });
  test.skip(!software, 'needs the software renderer; on a GPU the gate keeps the 3D by design');
  await expect(page.locator('html')).toHaveClass(/\bgrid\b/, { timeout: 60_000 });
  await expect(page.locator('#stage .sgrid')).toBeVisible();
  await expect(page.locator('#state')).toBeEmpty();
});
