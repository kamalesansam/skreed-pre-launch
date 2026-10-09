// AC3.1 loader frame parity: at __skreedLoader.seek(t) for the nine times below, the .ld-w element is pixel-identical to
// the prototype's, at 390 x 844 and 1280 x 800. The loader's frames depend only on its inline script and CSS, so both
// pages are held still around it: the prototype without three.js (its noHero disarmed), the port with its island held
// before the first byte (tests/harness/island.ts). Raster as in the overlay spec: CPU (--disable-gpu-rasterization),
// because SwiftShader's GPU raster varies edge pixels by 1/255 with the raster cache state.
import { test, expect, chromium, type Browser, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { servePrototype, PROTO_URL } from '../harness/prototype.ts';
import { CHROME_PATH } from '../harness/browser.ts';
import { holdIsland, holdPrototypeLoader } from '../harness/island.ts';
import { compare } from '../harness/compare.ts';

const TIMES = [0.5, 1.64, 2.4, 3.2, 4.0, 4.96, 5.6, 6.2, 7.05];
const VIEWPORTS = [
  { name: '390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  { name: '1280', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 },
];

let cpu: Browser;
test.beforeAll(async () => { cpu = await chromium.launch({ executablePath: CHROME_PATH, args: ['--disable-gpu-rasterization'] }); });
test.afterAll(async () => { await cpu?.close(); });

const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

async function shots(page: Page): Promise<Buffer[]> {
  // the mask is a data: SVG decoded asynchronously; wait until the loader has drawn a few frames with it
  await page.waitForFunction(() => document.getElementById('ldM')?.classList.contains('on'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const out: Buffer[] = [];
  for (const t of TIMES) {
    await page.evaluate((tt) => (window as unknown as { __skreedLoader: { seek(t: number): void } }).__skreedLoader.seek(tt), t);
    await page.evaluate(frames);
    await page.waitForTimeout(120);
    await page.evaluate(frames);
    out.push(await page.locator('.ld-w').screenshot());
  }
  return out;
}

for (const vp of VIEWPORTS) {
  test(`AC3.1 loader frames at the nine seek times are identical to the prototype at ${vp.name}`, async ({ baseURL }, info) => {
    const open = async (proto: boolean) => {
      const ctx = await cpu.newContext({ viewport: vp.viewport, deviceScaleFactor: vp.deviceScaleFactor });
      if (proto) { await servePrototype(ctx, { three: false }); await holdPrototypeLoader(ctx); }
      else await holdIsland(ctx);
      const page = await ctx.newPage();
      await page.goto(proto ? PROTO_URL : new URL('/?tier=hero3d', baseURL).href, { waitUntil: 'domcontentloaded' });
      const png = await shots(page);
      const state = await page.evaluate(() => (window as unknown as { __skreedLoader: { state(): unknown } }).__skreedLoader.state());
      await ctx.close();
      return { png, state };
    };
    const a = await open(true), b = await open(false);
    const dir = info.outputPath();
    mkdirSync(dir, { recursive: true });
    const rows: string[] = [];
    let bad = 0;
    TIMES.forEach((t, i) => {
      const pa = `${dir}/proto-${t}.png`, pb = `${dir}/port-${t}.png`;
      writeFileSync(pa, a.png[i]); writeFileSync(pb, b.png[i]);
      const same = a.png[i].equals(b.png[i]);
      const r = same ? null : compare(pa, pb, {}, `${dir}/diff-${t}.png`);
      // compare.py reports a size mismatch as {error: 'shape'} with no diff_px: that is a failure, never "identical pixels"
      const failed = r !== null && (Boolean(r.error) || r.diff_px !== 0);
      if (failed) bad++;
      rows.push(`t=${t}: ${same ? 'identical bytes' : r!.error ? `compare error ${r!.error} (${JSON.stringify(r)})` : r!.diff_px ? `differs ${r!.diff_px} px, max ${r!.max_diff}, bbox ${r!.bbox}` : 'identical pixels'}`);
    });
    info.annotations.push({ type: 'frames', description: rows.join('; ') });
    console.log(`[AC3.1 ${vp.name}] ` + rows.join('; '));
    expect(bad, rows.join('\n')).toBe(0);
    expect((b.state as { phase: string }).phase).toBe('seek');
  });
}
