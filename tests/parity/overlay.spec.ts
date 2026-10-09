// AC1.3 (overlay layer), poster path: the DOM overlay at rest (logotype, countdown, cue) is identical to the prototype's
// at both viewports. Settings as hero.md 7, AC1.3: canvas and poster hidden, one background on both pages, Date fixed,
// the same Open Sans file, the cue paused at 0, Math.random pinned to 0.5.
// The prototype's module is not loaded here (three is aborted), so its loader drops to its poster state and nothing
// writes ride styles: both pages show their static overlay, as the port's poster tier does.
import { test, expect, chromium, type Browser, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { servePrototype, PROTO_URL } from '../harness/prototype.ts';
import { CHROME_PATH } from '../harness/browser.ts';
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
