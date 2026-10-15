// Round 3 frames against the v11.4 prototype: the first wipe at 5.5 screens (tp 0.5, the hero and section 2 through the
// composite) and 6.0 (tp 1, section 2 covers), and the gems at rest at 15.0 screens (every block landed, the labels on).
// Both pages run under reduced motion (the port on ?tier=still3d, the prototype through the media query) with the intro
// skipped and Math.random pinned to 0.5, scroll to the position, wait for the follower to settle, freeze, and take the
// canvas alone. At each position the DOM ride (the hero copy's transform and clip, the logotype's tone, the cue) is compared too (AC2.3).
// The threshold is measured, not assumed: section 2's background grain is keyed to a frame counter (uFrame, the v11.4
// chunk line 2484), which no two page loads share, so the prototype against itself is not PSNR 99 here. Each test
// renders the prototype twice (a, b) and the port once, and the port must reach the prototype's own floor (PSNR of a
// against b) less 1 dB, with the floor and the result printed. The rest frame (tests/parity/rest.spec.ts) keeps PSNR 99.
import { test, expect, type Browser, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { SETUPS, launch } from '../harness/browser.ts';
import { servePrototype, PROTO11_URL } from '../harness/prototype.ts';
import { pinRandom, moreFrames } from '../harness/settle.ts';
import { OVERLAYS } from '../harness/canvas.ts';
import { compare } from '../harness/compare.ts';

const POSITIONS = (process.env.V11_POSITIONS || '5.5,6,15').split(',').map(Number);
const VIEWPORTS = (process.env.V11_VIEWPORTS || '390,1280').split(',');
const MARGIN_DB = 1;
let gl: Browser;
test.beforeAll(async () => { gl = await launch(); });
test.afterAll(async () => { await gl?.close(); });

// At 1280 x 800 (dsf 1.5) SwiftShader draws too few frames for the follower to settle on a 1920 x 1200 buffer, so both
// pages settle at 320 x 200 (the same 1.6 aspect and dsf), freeze, and only then take the full viewport (as wipe.spec.ts).
const SETTLE: Record<string, { width: number; height: number } | null> = { '390': null, '1280': { width: 320, height: 200 } };

interface At { png: Buffer; sb: number; labels: number; transform: string; clip: string; tone: string | undefined; cueOff: boolean }

async function run(url: string, setup: { viewport: { width: number; height: number } }, proto: boolean, settleAt: { width: number; height: number } | null): Promise<At[]> {
  const ctx = await gl.newContext({ ...setup, viewport: settleAt ?? setup.viewport, reducedMotion: 'reduce', bypassCSP: true });
  await pinRandom(ctx);
  if (proto) await servePrototype(ctx, { version: 'v11.4' });
  const page: Page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 300_000 });
  await page.waitForFunction(() => !document.getElementById('intro') && typeof window.__skreedState === 'function', null, { timeout: 900_000, polling: 500 });
  const out: At[] = [];
  for (const s of POSITIONS) {
    if (settleAt) await page.setViewportSize(settleAt);
    await page.evaluate(() => { window.__skreedFreeze = false; });
    await page.evaluate((x) => scrollTo(0, x * innerHeight), s);
    await page.waitForFunction((x) => Math.abs(window.__skreedState!().sb - x) < 1e-9, s, { timeout: 1_500_000, polling: 300 });
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
  test(`v11.4 frames at ${POSITIONS.join(', ')} screens under reduced motion at ${vp}: the port reaches the prototype's own noise floor less ${MARGIN_DB} dB`, async ({ baseURL }, info) => {
    test.setTimeout(5_400_000);
    const dir = info.outputPath(); mkdirSync(dir, { recursive: true });
    const [a, b, c] = await Promise.all([run(PROTO11_URL, setup, true, SETTLE[vp]), run(PROTO11_URL, setup, true, SETTLE[vp]), run(new URL('/?tier=still3d&intro=0', baseURL).href, setup, false, SETTLE[vp])]);
    const rows: string[] = [];
    POSITIONS.forEach((s, i) => {
      writeFileSync(`${dir}/proto-a-${s}.png`, a[i].png); writeFileSync(`${dir}/proto-b-${s}.png`, b[i].png); writeFileSync(`${dir}/port-${s}.png`, c[i].png);
      const floor = compare(`${dir}/proto-a-${s}.png`, `${dir}/proto-b-${s}.png`, {}, `${dir}/floor-${s}.png`);
      const r = compare(`${dir}/proto-a-${s}.png`, `${dir}/port-${s}.png`, {}, `${dir}/diff-${s}.png`);
      rows.push(`${s} screens: floor ${floor.psnr} dB (ssim ${floor.ssim}); port ${r.psnr} dB (ssim ${r.ssim}, diff_px ${r.diff_px}, max ${r.max_diff}); proto sb ${a[i].sb} labels ${a[i].labels}; port sb ${c[i].sb} labels ${c[i].labels}`);
      expect(r.size, `size at ${s}`).toEqual(floor.size);
      expect(r.psnr, `frame at ${s} screens: floor ${floor.psnr}`).toBeGreaterThanOrEqual(Math.min(99, floor.psnr) - MARGIN_DB);
      expect(c[i].labels, `labels at ${s}`).toBe(a[i].labels);
      // AC2.3: the DOM ride equals the prototype's (the hero copy holds still in the first wipe, Sam: nothing flies up; the logotype's tone turns light past tp 0.5; the cue is off)
      expect([c[i].transform, c[i].clip, c[i].tone, c[i].cueOff], `ride at ${s}`).toEqual([a[i].transform, a[i].clip, a[i].tone, a[i].cueOff]);
      if (s === 5.5) expect(c[i].tone).toBe('dark'); if (s >= 6) expect(c[i].tone).toBe('light'); if (s > 5) expect(c[i].cueOff).toBe(true);
    });
    console.log(`[v11 frames ${vp}] ` + rows.join(' | '));
    info.annotations.push({ type: 'v11-frames', description: rows.join(' | ') });
  });
}
