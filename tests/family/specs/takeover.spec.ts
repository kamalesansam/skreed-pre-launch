// Round 6 (docs/specs/family-page.md 24): each beat's own case type and depth.fyi's takeover between them, the browser
// rows of 24.4's criteria 2 (each beat shows its own case, with its frames), 4 (the sweep on the page rides the turn's
// second half: its progress is the stage's own scroll from the edge-on frame to the rest, Sam's words of 2026-11-03),
// 6 (back up: the sweep plays back as the scroll falls, and forward again as it rises, never off its scroll), 7 (no
// program compiles for a sweep), 8 (nothing of the type models before 0.5 screens; one model failing keeps the case
// before it, with no sweep; a model let through late stands at its beat once it lands) and 10 (reduced motion: the type
// changes in one frame, no sweep). Runs on a PUBLIC_FAMILY_3D=on test build (hooks on) served by wrangler dev, the 3D path
// forced past SwiftShader with ?render=force&tier=high; skipped until src/data/case-model.json carries the three type
// models (24 D1). The stage's scroll lags the page's at 10 per second, so every wait reads the stage's own sv.
// Frames: docs/specs/screenshots/family-r6-{390,1280}-beat{1,2,3,4}.png and -argument.png, looked at.
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { PHONE, WIDE } from './util.ts';

const SHOTS = new URL('../../../docs/specs/screenshots/', import.meta.url);
const shot = (name: string) => fileURLToPath(new URL(`family-r6-${name}.png`, SHOTS));
const TYPE_GLB = /\/models\/(magtough|snap|armor)\.lod[01]\.[0-9a-f]{8}\.glb$/;
type Tk = { phase: string; from: string; to: string; raw: number; eased: number; p: number; held: boolean };
/** the sweep's raw progress the scroll gives at sv: 0 at the edge-on frame h, 1 at h + 0.15 (pose.ts TURN_LEN / 2) */
const rawAt = (sv: number, h: number) => Math.min(1, Math.max(0, (sv - h) / 0.15));
type St = { sv: number; type: string; takeover: Tk };
type Types = { listed: string[]; started: boolean; loaded: string[]; failed: Record<string, string>; detailFailed: string[] };
type Row = { t: number; sv: number; type: string } & Tk;
type W = { __famStage: { state(): St; types(): Types; info(): { programs: number } } };
const st = (p: Page) => p.evaluate(() => (window as unknown as W).__famStage.state());
const types = (p: Page) => p.evaluate(() => (window as unknown as W).__famStage.types());
const programs = (p: Page) => p.evaluate(() => (window as unknown as W).__famStage.info().programs);

/** The page on the 3D path, live, the loader gone; skipped on a build without the island or without the three type models. */
async function open(page: Page, slug = 'blissful-blue'): Promise<void> {
  await page.goto(`/shades/${slug}/?render=force&tier=high`);
  const on = await page.evaluate(() => { const c = document.getElementById('fam-3d'); return !!c && JSON.parse(c.textContent || '{}').mode === 'on'; });
  test.skip(!on, 'needs a PUBLIC_FAMILY_3D=on test build');
  await expect(page.locator('html')).not.toHaveClass(/\bloading\b/, { timeout: 120_000 });
  await page.waitForFunction(() => document.querySelector('#st3d canvas.on'), null, { timeout: 120_000 });
  test.skip((await types(page)).listed.length < 3, 'needs the three type models in the manifest (section 24 D1)');
}
/** The browser's own scroll to a screen (page.ts emits fam:scroll from it). */
const toScreen = (p: Page, s: number) => p.evaluate((v) => scrollTo({ top: Math.round(v * innerHeight), behavior: 'instant' }), s);
/** The stage at rest at a screen: its own sv there and no takeover under way. */
const rest = (p: Page, s: number) => p.waitForFunction((v) => { const x = (window as unknown as W).__famStage.state(); return Math.abs(x.sv - v) < 0.005 && x.takeover.phase === 'idle'; }, s, { timeout: 30_000, polling: 100 });
/** Every listed type model landed or failed. */
const settledTypes = (p: Page) => p.waitForFunction(() => { const t = (window as unknown as W).__famStage.types(); return t.loaded.length + Object.keys(t.failed).length >= t.listed.length; }, null, { timeout: 120_000, polling: 250 });
/** A scroll at a steady pace from one screen to another over ms, then tail ms more, logging the stage every frame. */
const glide = (p: Page, from: number, to: number, ms: number, tail = 1800) => p.evaluate(([a, b, d, e]) => new Promise<Row[]>((done) => {
  const log: Row[] = [], t0 = performance.now();
  const step = (now: number) => {
    const t = now - t0;
    scrollTo({ top: Math.round((a + (b - a) * Math.min(1, t / d)) * innerHeight), behavior: 'instant' });
    const x = (window as unknown as W).__famStage.state();
    log.push({ t, sv: x.sv, type: x.type, ...x.takeover });
    if (t < d + e) requestAnimationFrame(step); else done(log);
  };
  requestAnimationFrame(step);
}), [from, to, ms, tail] as const);
function trackModels(ctx: BrowserContext): string[] { const seen: string[] = []; ctx.on('request', (r) => { if (TYPE_GLB.test(r.url())) seen.push(new URL(r.url()).pathname); }); return seen; }

test('criterion 8: nothing of the type models on the carousel; past 0.5 screens they load in beat order, LOD1 first', async ({ browser }) => {
  test.setTimeout(400_000);
  const ctx = await browser.newContext(WIDE);
  const seen = trackModels(ctx);
  const page = await ctx.newPage();
  await open(page);
  await page.waitForTimeout(3000);
  expect(seen, 'no type model before the scroll passes 0.5 screens').toEqual([]);
  expect((await types(page)).started).toBe(false);
  await toScreen(page, 0.4);
  await page.waitForTimeout(1500);
  expect(seen, 'not at 0.4 either').toEqual([]);
  await toScreen(page, 0.6);
  await settledTypes(page);
  const lod1 = seen.filter((u) => /\.lod1\./.test(u)).map((u) => u.split('/').pop()!.split('.')[0]);
  expect(lod1).toEqual(['magtough', 'snap', 'armor']);
  expect((await types(page)).loaded).toEqual(['magtough', 'snap', 'armor']);
  await ctx.close();
});

for (const [label, opts] of [['390', PHONE], ['1280', WIDE]] as const) {
  // the argument screen at the page's end, 6 screens (seven screens of 100svh; 6.5 is past the end of the scroll)
  test(`criterion 2 at ${label}: at rest at 2, 3, 4, 5 screens and the argument screen the case types are tough, magtough, snap, armor and armor; frames`, async ({ browser }) => {
    test.setTimeout(400_000);
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await open(page);
    await toScreen(page, 0.6);
    await settledTypes(page);
    for (const [sv, type, name] of [[2, 'tough', 'beat1'], [3, 'magtough', 'beat2'], [4, 'snap', 'beat3'], [5, 'armor', 'beat4'], [6, 'armor', 'argument']] as const) {
      await toScreen(page, sv);
      await rest(page, sv);
      expect((await st(page)).type, `the case at ${sv} screens`).toBe(type);
      await page.screenshot({ path: shot(`${label}-${name}`) });
    }
    await ctx.close();
  });
}

test('criteria 4 and 7: scrolled at a steady pace over each hand-over, the sweep to the next type runs from the edge-on frame with the turn, its progress the stage\'s own scroll, and ends as the case comes to rest; no program compiles for it', async ({ browser }) => {
  test.setTimeout(400_000);
  const ctx = await browser.newContext(WIDE);
  const page = await ctx.newPage();
  await open(page);
  await toScreen(page, 0.6);
  await settledTypes(page);
  for (const [a, from, type] of [[2.7, 'tough', 'magtough'], [3.7, 'magtough', 'snap'], [4.7, 'snap', 'armor']] as const) {
    const h = a + 0.15;
    await toScreen(page, a);
    await rest(page, a);
    const before = await programs(page);
    const log = await glide(page, a, a + 0.3, 300);
    const running = log.filter((r) => r.phase !== 'idle');
    expect(running.length, `frames of the sweep to ${type}`).toBeGreaterThan(5);
    for (const r of running) {
      expect([r.from, r.to], `the pair at ${r.sv.toFixed(3)}`).toEqual([from, type]);
      expect(r.sv, 'a sweep only inside the turn\'s second half').toBeGreaterThanOrEqual(h);
      expect(r.sv).toBeLessThan(h + 0.15 - 0.003);
      expect(Math.abs(r.raw - rawAt(r.sv, h)), `raw is the scroll\'s at ${r.sv.toFixed(3)}`).toBeLessThan(1e-6);
    }
    for (const r of log) if (r.sv < h) expect(r.type, `before the edge-on frame at ${r.sv.toFixed(3)}`).toBe(from);
    const after = log.filter((r) => r.sv >= h + 0.15 - 0.006);   // the page scrolls by whole pixels, so its rest can sit a few short of the beat (the mapping's slack is 0.004 of a screen)
    expect(after.length).toBeGreaterThan(0);
    for (const r of after) expect([r.phase, r.type], `at rest at ${r.sv.toFixed(3)}`).toEqual(['idle', type]);
    expect(log.at(-1)!.type).toBe(type);
    expect(await programs(page), 'no program compiled for the sweep').toBe(before);
  }
  await ctx.close();
});

test('criterion 6: from rest at Snap, up through 3.85 the sweep plays back as the scroll falls (the band left to right) and the MagTough stands below it; down again it plays forward; raw is the scroll\'s, never a jump of its own', async ({ browser }) => {
  test.setTimeout(400_000);
  const ctx = await browser.newContext(WIDE);
  const page = await ctx.newPage();
  await open(page);
  await toScreen(page, 0.6);
  await settledTypes(page);
  await toScreen(page, 4.2);
  await rest(page, 4.2);
  const up = await glide(page, 4.2, 3.6, 400, 250);
  const back = up.filter((r) => r.phase !== 'idle');
  expect(back.length, 'frames of the sweep on the way up').toBeGreaterThan(3);
  for (const r of back) { expect([r.from, r.to]).toEqual(['magtough', 'snap']); expect(Math.abs(r.raw - rawAt(r.sv, 3.85))).toBeLessThan(1e-6); }
  for (let k = 1; k < back.length; k++) expect(back[k].raw, 'raw falls with the scroll').toBeLessThanOrEqual(back[k - 1].raw + 1e-9);
  expect(up.at(-1)!.type, 'the MagTough below the hand-over').toBe('magtough');
  expect(up.at(-1)!.phase).toBe('idle');
  const down = await glide(page, 3.6, 4.2, 300, 600);
  const fore = down.filter((r) => r.phase !== 'idle');
  expect(fore.length, 'frames of the sweep on the way down').toBeGreaterThan(3);
  for (const r of fore) { expect([r.from, r.to]).toEqual(['magtough', 'snap']); expect(Math.abs(r.raw - rawAt(r.sv, 3.85))).toBeLessThan(1e-6); }
  for (let k = 1; k < fore.length; k++) expect(fore[k].raw, 'raw rises with the scroll').toBeGreaterThanOrEqual(fore[k - 1].raw - 1e-9);
  expect(down.at(-1)!.type).toBe('snap');
  expect(down.at(-1)!.phase).toBe('idle');
  await ctx.close();
});

test('criterion 8: a type model that fails keeps the case before it through its beat, with no takeover and no error of ours', async ({ browser }) => {
  test.setTimeout(400_000);
  const ctx = await browser.newContext(WIDE);
  await ctx.route(/\/models\/snap\.lod[01]\.[0-9a-f]{8}\.glb$/, (r) => r.abort('failed'));
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await open(page);
  await toScreen(page, 0.6);
  await settledTypes(page);
  expect(Object.keys((await types(page)).failed)).toEqual(['snap']);
  await toScreen(page, 3);
  await rest(page, 3);
  const log = await glide(page, 3.7, 4.2, 500, 1500);
  expect(log.some((r) => r.to === 'snap'), 'never a run to the failed type').toBe(false);
  expect(log.at(-1)!.type, 'the case before it').toBe('magtough');
  await toScreen(page, 5);
  await rest(page, 5);
  expect((await st(page)).type, 'the Armor still lands at its beat').toBe('armor');
  expect(errors).toEqual([]);
  await expect(page.locator('#state')).toBeEmpty();
  await ctx.close();
});

test('criterion 8: a model let through late stands at its beat once it lands, with no sweep (the sweep belongs to the turn)', async ({ browser }) => {
  test.setTimeout(400_000);
  const ctx = await browser.newContext(WIDE);
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => { release = r; });
  await ctx.route(/\/models\/magtough\.lod1\.[0-9a-f]{8}\.glb$/, async (r) => { await gate; await r.continue(); });
  const page = await ctx.newPage();
  await open(page);
  await toScreen(page, 3);
  await rest(page, 3);
  expect((await st(page)).type, 'the Tough while the MagTough is on its way').toBe('tough');
  release();
  await page.waitForFunction(() => (window as unknown as W).__famStage.types().loaded.includes('magtough'), null, { timeout: 60_000, polling: 50 });
  await page.waitForFunction(() => (window as unknown as W).__famStage.state().type === 'magtough', null, { timeout: 10_000, polling: 50 });
  await rest(page, 3);
  expect((await st(page)).takeover.phase, 'no sweep at rest').toBe('idle');
  // and the hand-over's sweep still runs for it from here on: back up and down through 2.85
  const down = await glide(page, 2.7, 3.0, 300, 600);
  expect(down.filter((r) => r.phase !== 'idle').every((r) => r.from === 'tough' && r.to === 'magtough')).toBe(true);
  expect(down.at(-1)!.type).toBe('magtough');
  await ctx.close();
});

test('criterion 10: reduced motion changes the case type in one frame at the edge-on frame, never a run (or, on the poster tier, grid mode as before)', async ({ browser }) => {
  test.setTimeout(400_000);
  const ctx = await browser.newContext({ ...WIDE, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/shades/blissful-blue/?render=force&tier=high');
  // REDUCED_MOTION_TIER 'poster' (config/hero.ts) sends reduced motion to swatch grid mode, which round 6 does not touch
  if (await page.evaluate(() => document.documentElement.dataset.why === 'reduced')) {
    await expect(page.locator('html')).toHaveClass(/\bgrid\b/);
    await expect(page.locator('#stage .sgrid')).toBeVisible();
    await ctx.close();
    return;
  }
  await open(page);
  await toScreen(page, 0.6);
  await settledTypes(page);
  await toScreen(page, 2.7);
  await rest(page, 2.7);
  const log = await glide(page, 2.7, 3.0, 300, 300);
  expect(log.filter((r) => r.phase !== 'idle'), 'no frame of a run').toEqual([]);
  const first = log.find((r) => r.type === 'magtough')!;
  expect(first.sv).toBeGreaterThanOrEqual(2.85);
  expect(log.filter((r) => r.sv < 2.85).every((r) => r.type === 'tough')).toBe(true);
  await ctx.close();
});
