// Round 3 frames against the v11.4 prototype, re-paired on 2026-11-02 (the port's scroll map is the prototype's halved with
// no stagger, section-2.md 14): the first wipe at the prototype's 5.5 screens and the port's 2.75 (tp 0.5, the hero and
// section 2 through the composite), at 6.0 and 3.0 (tp 1, section 2 covers), and the gems at rest at 15.0 and 5.0 (every
// block landed, the labels on). Both pages run under reduced motion (the port on ?tier=still3d, the prototype through the
// media query) with the intro skipped and Math.random pinned to 0.5, scroll to the position, wait for the follower to
// settle, freeze, and take the canvas alone. At each pair the DOM ride (the hero copy's transform and clip, the logotype's
// tone, the cue) and the labels are compared too (AC2.3).
// The pixel threshold is measured, not assumed: section 2's background grain is keyed to a frame counter (uFrame, the v11.4
// chunk line 2484), which no two page loads share, so the prototype against itself is not PSNR 99 here. Each test renders
// the prototype twice (a, b) and the port once, and the port must reach the prototype's own floor (PSNR of a against b)
// less 1 dB, with the floor and the result printed. That grade holds where the fog's treadmill (2.15 + 0.3 x (S - W1END)
// on both pages) reads the same, the wipe's end; at the wipe's middle and at rest the halved map puts the fog 0.075 and
// 2.1 units from the prototype's, so those two frames are recorded with their PSNR printed and graded on the ride, the
// labels and the tone alone (section-2.md 14.9). The rest frame (tests/parity/rest.spec.ts) keeps PSNR 99.
// Run this spec alone (`--workers=1`, no other suite beside it): on a Mac SwiftShader needs about six minutes for each
// intro and each settle with the three pages at once (2026-11-03), and two specs at once overrun the waits.
import { test, expect, type Browser, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { SETUPS, launch } from '../harness/browser.ts';
import { servePrototype, PROTO11_URL } from '../harness/prototype.ts';
import { pinRandom, moreFrames } from '../harness/settle.ts';
import { OVERLAYS } from '../harness/canvas.ts';
import { compare } from '../harness/compare.ts';
import { S2T } from '../../src/config/hero.ts';

/** [prototype position, port position], in screens; V11_POSITIONS takes "proto:port" pairs */
const PAIRS: [number, number][] = (process.env.V11_POSITIONS || '5.5:2.75,6:3,15:5').split(',').map((s) => { const [a, b] = s.split(':').map(Number); return [a, b ?? a]; });
const VIEWPORTS = (process.env.V11_VIEWPORTS || '390,1280').split(',');
const MARGIN_DB = 1;
/** the pinned prototype's first wipe ends at 6 screens (template.html: PULL 5, WIPE 1) */
const PROTO_W1END = 6;
/** the fog's treadmill, 2.15 + 0.3 x (S - W1END) on both pages, in units: the port's less the prototype's */
const fogDelta = ([a, b]: [number, number]) => 0.3 * ((b - S2T.W1END) - (a - PROTO_W1END));
let gl: Browser;
test.beforeAll(async () => { gl = await launch(); });
test.afterAll(async () => { await gl?.close(); });

// At 1280 x 800 (dsf 1.5) SwiftShader draws too few frames for the follower to settle on a 1920 x 1200 buffer, so both
// pages settle at 320 x 200 (the same 1.6 aspect and dsf), freeze, and only then take the full viewport (as wipe.spec.ts).
const SETTLE: Record<string, { width: number; height: number } | null> = { '390': null, '1280': { width: 320, height: 200 } };

interface At { png: Buffer; sb: number; labels: number; transform: string; clip: string; tone: string | undefined; cueOff: boolean }

// tag names the page in the progress lines (SwiftShader is slow here, and a timeout should say which page and which wait)
async function run(url: string, setup: { viewport: { width: number; height: number } }, proto: boolean, settleAt: { width: number; height: number } | null, tag: string): Promise<At[]> {
  const t0 = Date.now(), since = (t: number) => `${Math.round((Date.now() - t) / 1000)} s`;
  const ctx = await gl.newContext({ ...setup, viewport: settleAt ?? setup.viewport, reducedMotion: 'reduce', bypassCSP: true });
  await pinRandom(ctx);
  if (proto) await servePrototype(ctx, { version: 'v11.4' });
  const page: Page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 300_000 });
  await page.waitForFunction(() => !document.getElementById('intro') && typeof window.__skreedState === 'function', null, { timeout: 900_000, polling: 500 });
  console.log(`[v11 frames] ${tag}: the intro over after ${since(t0)}`);
  const out: At[] = [];
  for (const pair of PAIRS) {
    const s = proto ? pair[0] : pair[1], t1 = Date.now();
    if (settleAt) await page.setViewportSize(settleAt);
    await page.evaluate(() => { window.__skreedFreeze = false; });
    await page.evaluate((x) => scrollTo(0, x * innerHeight), s);
    await page.waitForFunction((x) => Math.abs(window.__skreedState!().sb - x) < 1e-9, s, { timeout: 1_500_000, polling: 300 });
    console.log(`[v11 frames] ${tag}: settled at ${s} screens after ${since(t1)}`);
    await page.evaluate(() => { window.__skreedFreeze = true; });
    await moreFrames(page, 2);
    if (settleAt) { await page.setViewportSize(setup.viewport); await moreFrames(page, 3); }
    const sb = await page.evaluate(() => window.__skreedState!().sb);
    const labels = await page.evaluate(() => Array.from(document.querySelectorAll('.s2lab')).filter((e) => getComputedStyle(e).visibility !== 'hidden' && (e as HTMLElement).offsetParent !== null).length);
    const dom = await page.evaluate(() => { const c = document.getElementById('heroCopy')!, cs = getComputedStyle(c); return { transform: cs.transform, clip: cs.clipPath, tone: document.getElementById('siteLogo')!.dataset.tone, cueOff: document.getElementById('cue')!.classList.contains('is-off') }; });
    const hide = await page.addStyleTag({ content: `${OVERLAYS}{display:none!important}html,body{background:#000!important}` });
    await moreFrames(page, 3);
    const png = await page.locator('#stage').screenshot({ timeout: 600_000 });
    await hide.evaluate((e) => (e as Element).remove());
    out.push({ png, sb, labels, ...dom });
  }
  await ctx.close();
  return out;
}

for (const vp of VIEWPORTS) {
  const setup = vp === '390' ? SETUPS.phoneCanvas : SETUPS.desktop;
  test(`v11.4 frames at the prototype's ${PAIRS.map((p) => p[0]).join(', ')} and the port's ${PAIRS.map((p) => p[1]).join(', ')} screens under reduced motion at ${vp}: the port reaches the prototype's own noise floor less ${MARGIN_DB} dB where the fog agrees`, async ({ baseURL }, info) => {
    test.setTimeout(5_400_000);
    const dir = info.outputPath(); mkdirSync(dir, { recursive: true });
    const [a, b, c] = await Promise.all([run(PROTO11_URL, setup, true, SETTLE[vp], `proto a at ${vp}`), run(PROTO11_URL, setup, true, SETTLE[vp], `proto b at ${vp}`), run(new URL('/?tier=still3d&intro=0', baseURL).href, setup, false, SETTLE[vp], `port at ${vp}`)]);
    const rows: string[] = [];
    PAIRS.forEach((pair, i) => {
      const [s, sp] = pair, fog = fogDelta(pair), graded = Math.abs(fog) < 1e-9;
      writeFileSync(`${dir}/proto-a-${s}.png`, a[i].png); writeFileSync(`${dir}/proto-b-${s}.png`, b[i].png); writeFileSync(`${dir}/port-${sp}.png`, c[i].png);
      const floor = compare(`${dir}/proto-a-${s}.png`, `${dir}/proto-b-${s}.png`, {}, `${dir}/floor-${s}.png`);
      const r = compare(`${dir}/proto-a-${s}.png`, `${dir}/port-${sp}.png`, {}, `${dir}/diff-${s}.png`);
      rows.push(`proto ${s} / port ${sp} screens: floor ${floor.psnr} dB (ssim ${floor.ssim}); port ${r.psnr} dB (ssim ${r.ssim}, diff_px ${r.diff_px}, max ${r.max_diff})${graded ? '' : `, recorded and not graded: the fog's treadmill is ${fog.toFixed(3)} units from the prototype's since the map of 2026-11-02`}; proto sb ${a[i].sb} labels ${a[i].labels}; port sb ${c[i].sb} labels ${c[i].labels}`);
      expect(r.size, `size at ${s}/${sp}`).toEqual(floor.size);
      if (graded) expect(r.psnr, `frame at the prototype's ${s} and the port's ${sp} screens: floor ${floor.psnr}`).toBeGreaterThanOrEqual(Math.min(99, floor.psnr) - MARGIN_DB);
      expect(c[i].labels, `labels at ${s}/${sp}`).toBe(a[i].labels);
      // AC2.3: the DOM ride equals the prototype's (the hero copy holds still in the first wipe, Sam: nothing flies up; the logotype's tone turns light past tp 0.5; the cue is off)
      expect([c[i].transform, c[i].clip, c[i].tone, c[i].cueOff], `ride at ${s}/${sp}`).toEqual([a[i].transform, a[i].clip, a[i].tone, a[i].cueOff]);
      if (s === 5.5) expect(c[i].tone).toBe('dark'); if (s >= 6) expect(c[i].tone).toBe('light'); if (s > 5) expect(c[i].cueOff).toBe(true);
    });
    expect(PAIRS.some((pair) => Math.abs(fogDelta(pair)) < 1e-9), 'at least one pair is graded on its pixels').toBe(true);
    console.log(`[v11 frames ${vp}] ` + rows.join(' | '));
    info.annotations.push({ type: 'v11-frames', description: rows.join(' | ') });
  });
}
