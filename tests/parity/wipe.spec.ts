// AC2.2 and AC2.3, stage 1. Under reduced motion (the port on ?tier=still3d) with Math.random pinned to 0.5, scroll to
// 2.0 screens (tp 0.5) and 2.5 screens (tp 1), wait for the follower to settle, freeze, and compare the canvas frames
// with the prototype's (PSNR 99). At tp 0.5 the countdown's computed transform and clip-path equal the prototype's;
// the logotype's tone is dark at tp 0.5 and light at tp 1 (light once tp is above 0.5); the cue is off once tp is above 0.
import { test, expect, type Browser, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { SETUPS, launch } from '../harness/browser.ts';
import { servePrototype, PROTO_URL } from '../harness/prototype.ts';
import { pinRandom, moreFrames } from '../harness/settle.ts';
import { OVERLAYS } from '../harness/canvas.ts';
import { compare } from '../harness/compare.ts';

const POSITIONS = [2.0, 2.5];
const VIEWPORTS = (process.env.WIPE_VIEWPORTS || '390,1280').split(',');
let gl: Browser;
test.beforeAll(async () => { gl = await launch(); });
test.afterAll(async () => { await gl?.close(); });

interface At { png: Buffer; transform: string; clip: string; tone: string | undefined; cueOff: boolean; tp: number }

// At 1280 x 800 (dsf 1.5) SwiftShader draws too few wipe frames here for the follower to settle (both composers render a
// 1920 x 1200 buffer). Both pages therefore settle at 320 x 200, the same 1.6 aspect and dsf, freeze (the frame ratio
// is then 0, so the followers hold exactly), and only then take the full viewport for the ride and the frame.
const SETTLE: Record<string, { width: number; height: number } | null> = { '390': null, '1280': { width: 320, height: 200 } };

async function run(url: string, setup: { viewport: { width: number; height: number } }, proto: boolean, settleAt: { width: number; height: number } | null): Promise<At[]> {
  const ctx = await gl.newContext({ ...setup, viewport: settleAt ?? setup.viewport, reducedMotion: 'reduce', bypassCSP: true });
  await pinRandom(ctx);
  if (proto) await servePrototype(ctx);
  const page: Page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 300_000 });
  await page.waitForFunction(() => !document.getElementById('intro') && typeof window.__skreedState === 'function', null, { timeout: 900_000, polling: 500 });
  const out: At[] = [];
  for (const s of POSITIONS) {
    if (settleAt) await page.setViewportSize(settleAt);
    await page.evaluate(() => { window.__skreedFreeze = false; });
    await page.evaluate((x) => scrollTo(0, x * innerHeight), s);
    await page.waitForFunction((x) => Math.abs(window.__skreedState!().sb - x) < 1e-9, s, { timeout: 900_000, polling: 300 });
    await page.evaluate(() => { window.__skreedFreeze = true; });
    await moreFrames(page, 2);
    if (settleAt) { await page.setViewportSize(setup.viewport); await moreFrames(page, 3); }
    const dom = await page.evaluate(() => {
      const c = document.getElementById('heroCopy')!, cs = getComputedStyle(c);
      return { transform: cs.transform, clip: cs.clipPath, tone: document.getElementById('siteLogo')!.dataset.tone, cueOff: document.getElementById('cue')!.classList.contains('is-off'), tp: Math.min(1, Math.max(0, window.__skreedState!().sb - 1.5)) };
    });
    const hide = await page.addStyleTag({ content: `${OVERLAYS}{display:none!important}html,body{background:#000!important}` });
    await moreFrames(page, 3);
    const png = await page.locator('#stage').screenshot({ timeout: 600_000 });
    await hide.evaluate((e) => (e as Element).remove());
    out.push({ png, ...dom });
  }
  await ctx.close();
  return out;
}

for (const vp of VIEWPORTS) {
  const setup = vp === '390' ? SETUPS.phoneCanvas : SETUPS.desktop;
  test(`AC2.2 and AC2.3 the wipe at tp 0.5 and 1 under reduced motion at ${vp}: frames and DOM ride equal the prototype`, async ({ baseURL }, info) => {
    test.setTimeout(3_000_000);
    const dir = info.outputPath(); mkdirSync(dir, { recursive: true });
    const [a, b] = await Promise.all([run(PROTO_URL, setup, true, SETTLE[vp]), run(new URL('/?tier=still3d', baseURL).href, setup, false, SETTLE[vp])]);
    const rows: string[] = [];
    POSITIONS.forEach((s, i) => {
      writeFileSync(`${dir}/proto-${s}.png`, a[i].png); writeFileSync(`${dir}/port-${s}.png`, b[i].png);
      const r = compare(`${dir}/proto-${s}.png`, `${dir}/port-${s}.png`, { psnr: 99 }, `${dir}/diff-${s}.png`);
      rows.push(`${s} screens: ${JSON.stringify(r)}; proto ride ${a[i].transform} ${a[i].clip} ${a[i].tone} cue-off ${a[i].cueOff}; port ride ${b[i].transform} ${b[i].clip} ${b[i].tone} cue-off ${b[i].cueOff}`);
      expect(r.psnr, `frame at ${s} screens`).toBe(99);
    });
    console.log(`[AC2.2 ${vp}] ` + rows.join(' | '));
    info.annotations.push({ type: 'wipe', description: rows.join(' | ') });
    // AC2.3 at tp 0.5
    expect(b[0].transform).toBe(a[0].transform);
    expect(b[0].clip).toBe(a[0].clip);
    expect(b[0].clip).toMatch(/^polygon\(/);
    expect(b[0].tone).toBe('dark');
    expect(b[1].tone).toBe('light');
    expect(b[0].cueOff && b[1].cueOff).toBe(true);
    expect(a[0].tone).toBe(b[0].tone); expect(a[1].tone).toBe(b[1].tone);
  });
}
