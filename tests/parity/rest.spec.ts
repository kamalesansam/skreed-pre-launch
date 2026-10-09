// AC1.2 canvas-only rest frames, stage 1: identical to the prototype (PSNR 99, the noise floor measured by
// noise-floor.spec.ts), in normal motion and in reduced motion (port on ?tier=still3d), at 390 x 844 (dsf 1.25) and
// 1280 x 800 (dsf 1.5). __skreedFreeze is set before load, so scene time stays at 0; frames are taken at least 3 frames
// after the loader's ready with the DOM overlays and the poster hidden.
// D8 (architecture 6.3, build step 8): PORT_TEXPATHS=bitmap,image runs the port on both texture paths; 'bitmap' is kept
// only if its frames are identical too. REVIEW_SHOTS=1 copies the normal-motion prototype frames and x8 diff maps to
// docs/specs/screenshots/ (hero-<w>-proto.png, hero-<w>-diff.png).
// PROTO_CACHE=<dir> keeps the prototype's frame per viewport and mode and reuses it: noise-floor.spec.ts shows the
// prototype renders the identical frame every time, so one render serves every port run. The cached file is keyed by the
// pinned reference's hash (tests/harness/reference.ts), so a frame of any other prototype build is never reused.
import { test, expect, type Browser } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SETUPS, launch } from '../harness/browser.ts';
import { servePrototype, PROTO_URL } from '../harness/prototype.ts';
import { REF_SHA256 } from '../harness/reference.ts';
import { freezeBeforeLoad } from '../harness/settle.ts';
import { captureStage } from '../harness/canvas.ts';
import { compare } from '../harness/compare.ts';

const SHOTS = fileURLToPath(new URL('../../docs/specs/screenshots/', import.meta.url));
const TEXPATHS = (process.env.PORT_TEXPATHS || 'bitmap').split(',');
const MODES = (process.env.REST_MODES || 'normal,still3d').split(',');
const VIEWPORTS = (process.env.REST_VIEWPORTS || '390,1280').split(',');

let gl: Browser;
test.beforeAll(async () => { gl = await launch(); });
test.afterAll(async () => { await gl?.close(); });

async function frame(url: string, setup: object, reduced: boolean, proto: boolean, path: string) {
  const ctx = await gl.newContext({ ...setup, reducedMotion: reduced ? 'reduce' : 'no-preference', bypassCSP: true });
  await freezeBeforeLoad(ctx);
  if (proto) await servePrototype(ctx);
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'load', timeout: 300_000 });
  await captureStage(page, path);
  await ctx.close();
  return errors;
}

for (const vp of VIEWPORTS) for (const mode of MODES) {
  const setup = vp === '390' ? SETUPS.phoneCanvas : SETUPS.desktop;
  test(`AC1.2 stage 1 rest frame at ${vp}, ${mode === 'normal' ? 'normal motion' : 'reduced motion (still3d)'}: identical to the prototype`, async ({ baseURL }, info) => {
    test.setTimeout(3_000_000);
    const dir = info.outputPath(); mkdirSync(dir, { recursive: true });
    const reduced = mode !== 'normal';
    const pp = `${dir}/proto.png`;
    const cache = process.env.PROTO_CACHE ? `${process.env.PROTO_CACHE}/proto-${REF_SHA256['index.html'].slice(0, 12)}-${vp}-${mode}.png` : null;
    if (cache && existsSync(cache)) copyFileSync(cache, pp);
    else {
      expect(await frame(PROTO_URL, setup, reduced, true, pp)).toEqual([]);
      if (cache) { mkdirSync(process.env.PROTO_CACHE!, { recursive: true }); copyFileSync(pp, cache); }
    }
    const results: Record<string, unknown> = {};
    for (const tp of TEXPATHS) {
      const port = `${dir}/port-${tp}.png`;
      const url = new URL(`/?tier=${reduced ? 'still3d' : 'hero3d'}&texpath=${tp}`, baseURL).href;
      expect(await frame(url, setup, reduced, false, port)).toEqual([]);
      const r = compare(pp, port, { psnr: 99 }, `${dir}/diff-${tp}.png`);
      results[tp] = r;
      console.log(`[AC1.2 ${vp} ${mode} ${tp}] ${JSON.stringify(r)}`);
      if (process.env.REVIEW_SHOTS === '1' && mode === 'normal' && tp === TEXPATHS[0]) {
        copyFileSync(pp, `${SHOTS}hero-${vp}-proto.png`);
        copyFileSync(`${dir}/diff-${tp}.png`, `${SHOTS}hero-${vp}-diff.png`);
        copyFileSync(port, `${SHOTS}hero-${vp}-stage.png`);
      }
    }
    info.annotations.push({ type: 'compare', description: JSON.stringify(results) });
    for (const tp of TEXPATHS) expect((results[tp] as { psnr: number }).psnr, tp).toBe(99);
  });
}
