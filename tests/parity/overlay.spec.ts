// AC1.3 (overlay layer), poster path: the DOM overlay at rest (logotype, countdown, cue) is identical to the prototype's
// at both viewports. Settings as hero.md 7, AC1.3: canvas and poster hidden, one background on both pages, Date fixed,
// the same Open Sans file, the cue paused at 0, Math.random pinned to 0.5.
// The prototype's module is not loaded here (three is aborted), so its loader drops to its poster state and nothing
// writes ride styles: both pages show their static overlay, as the port's poster tier does.
import { test, expect, chromium, type Browser, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { servePrototype, PROTO_URL } from '../harness/prototype.ts';
import { CHROME_PATH, GL_ARGS } from '../harness/browser.ts';
import { compare } from '../harness/compare.ts';
import { pinRandom, sameBackground, pauseCue, fontsReady } from '../harness/settle.ts';

const NOW = new Date('2026-10-09T09:00:00+05:30');
// #wallCopy is the prototype's section 2 placeholder copy, dropped by the port (spec D9, architecture 5.1). It is a
// hidden fixed layer with will-change, which changes how Chromium composites the logotype; it is not part of the overlay.
const HIDE = '#stage,.hero-poster,#intro,.tune,.labels,.fallback,#wallCopy{display:none!important}';
const VIEWPORTS = [
  { name: '390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  { name: '1280', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 },
];

async function settle(page: Page) {
  await page.addStyleTag({ content: HIDE });
  await sameBackground(page);
  await fontsReady(page);
  await page.waitForTimeout(1600);   // past the port's poster-tier intro burst (0.75 s + 0.5 s)
  await pauseCue(page);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function shoot(browser: Browser, base: string, vp: (typeof VIEWPORTS)[number], proto: boolean) {
  // bypassCSP: the harness injects its hide and background styles (tests/e2e/csp.spec.ts checks the real policy)
  const ctx = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: vp.deviceScaleFactor, bypassCSP: true });
  await pinRandom(ctx);
  if (proto) await servePrototype(ctx, { three: false });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(NOW);
  if (proto) {
    await page.goto(PROTO_URL);
    await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 30_000 });
  } else {
    await page.goto(new URL('/?tier=poster', base).href);
  }
  await settle(page);
  const png = await page.screenshot();
  await ctx.close();
  return png;
}

// The overlay is DOM only (canvas and poster hidden, the prototype's module not loaded), so this spec uses a browser with
// GPU rasterisation off. Under SwiftShader's GPU raster the logotype's edge pixels depend on the raster cache state of the
// page (measured 2026-10-09: the port against itself differs by 1/255 on up to 346 edge pixels depending on what drew
// before), while Skia's CPU raster is deterministic: both pages then compare pixel for pixel.
let cpu: Browser;
test.beforeAll(async () => { cpu = await chromium.launch({ executablePath: CHROME_PATH, args: ['--disable-gpu-rasterization'] }); });
test.afterAll(async () => { await cpu?.close(); });

for (const vp of VIEWPORTS) {
  test(`AC1.3 overlay at rest is identical to the prototype at ${vp.name}`, async ({ baseURL }, info) => {
    const browser = cpu;
    const a = await shoot(browser, baseURL!, vp, true);
    const b = await shoot(browser, baseURL!, vp, false);
    const dir = info.outputPath();
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/proto.png`, a);
    writeFileSync(`${dir}/port.png`, b);
    let report = 'identical bytes';
    if (!a.equals(b)) {
      report = execFileSync('python3', ['-I', '-c', `
import sys, numpy as np
from PIL import Image
a=np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int); b=np.asarray(Image.open(sys.argv[2]).convert('RGB')).astype(int)
if a.shape!=b.shape: print('shape', a.shape, b.shape); sys.exit()
d=np.abs(a-b).max(axis=2); ys,xs=np.nonzero(d)
print('identical pixels' if not len(ys) else 'differing px %d max %d box %s' % (len(ys), d.max(), (xs.min(),ys.min(),xs.max(),ys.max())))
`, `${dir}/proto.png`, `${dir}/port.png`]).toString().trim();
    }
    info.annotations.push({ type: 'overlay', description: report });
    expect(['identical bytes', 'identical pixels']).toContain(report);
  });
}

// The 3D path: both pages lifted into the live hero (the prototype with its module and three.js), canvas and poster
// hidden, the DOM ride at rest (tp 0: transform 0, clip none, tone dark), the intro bursts over. CPU raster for the DOM,
// SwiftShader for the WebGL the pages need to reach the lift. Opt-in (OVERLAY_3D=1): under a loaded machine the two
// lifts take 10 to 45 minutes and did not finish reliably here (hero-architecture.md 17.2, note 16).
let glCpu: Browser;
test.beforeAll(async () => { if (process.env.OVERLAY_3D === '1') glCpu = await chromium.launch({ executablePath: CHROME_PATH, args: [...GL_ARGS, '--disable-gpu-rasterization'] }); });
test.afterAll(async () => { await glCpu?.close(); });

// Device scale 1 here (OVERLAY3D_DSF overrides): the pages must render WebGL up to the lift, which SwiftShader does far
// faster on small buffers; the DOM comparison is the same at any scale.
async function shoot3d(base: string, vp: (typeof VIEWPORTS)[number], proto: boolean) {
  const ctx = await glCpu.newContext({ viewport: vp.viewport, deviceScaleFactor: +(process.env.OVERLAY3D_DSF || 1), bypassCSP: true });
  await pinRandom(ctx);
  if (proto) await servePrototype(ctx);
  const page = await ctx.newPage();
  await page.clock.setFixedTime(NOW);
  await page.goto(proto ? PROTO_URL : new URL('/?tier=hero3d', base).href, { timeout: 300_000 });
  await page.waitForFunction(() => !document.getElementById('intro') && (window as unknown as { __heroStarted?: boolean }).__heroStarted, null, { timeout: 2_700_000, polling: 500 });
  const ride = await page.evaluate(() => { const c = document.getElementById('heroCopy')!, s = getComputedStyle(c); return [s.position, s.transform, s.clipPath, document.getElementById('siteLogo')!.dataset.tone].join(' '); });
  // D20: the port's cue bounces three times after the lift and rests, so its animation has usually finished by now and
  // there is nothing to pause at 0. Restarting the ball's and the line's animations (none, reflow, back) brings the bounce
  // back without touching the cue's opacity, and settle() then pauses both pages at 0 (AC1.3). The prototype's cue loops
  // forever and is unaffected.
  if (!proto) await page.evaluate(() => { for (const e of document.querySelectorAll<HTMLElement>('#cue .ball, #cue .base')) { e.style.animation = 'none'; void e.offsetWidth; e.style.removeProperty('animation'); } });
  await settle(page);
  const png = await page.screenshot({ timeout: 600_000 });
  await ctx.close();
  return { png, ride };
}

if (process.env.OVERLAY_3D === '1') for (const vp of VIEWPORTS) {
  test(`AC1.3 overlay at rest on the 3D path is identical to the prototype at ${vp.name}`, async ({ baseURL }, info) => {
    test.setTimeout(5_400_000);
    const [a, b] = await Promise.all([shoot3d(baseURL!, vp, true), shoot3d(baseURL!, vp, false)]);
    const dir = info.outputPath();
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/proto-3d.png`, a.png);
    writeFileSync(`${dir}/port-3d.png`, b.png);
    const r = a.png.equals(b.png) ? { diff_px: 0 } : compare(`${dir}/proto-3d.png`, `${dir}/port-3d.png`, {}, `${dir}/diff-3d.png`);
    const note = `ride proto [${a.ride}] port [${b.ride}]; ${JSON.stringify(r)}`;
    console.log(`[AC1.3 3D ${vp.name}] ${note}`);
    info.annotations.push({ type: 'overlay-3d', description: note });
    expect(b.ride).toBe(a.ride);
    expect(r.diff_px).toBe(0);
  });
}
