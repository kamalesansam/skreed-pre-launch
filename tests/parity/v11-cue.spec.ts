// Round 3, the scroll cue: ciao's side icon re-created (hero.md 14) against the v11.4 prototype's. Both pages on the
// poster path (three aborted on the prototype; the port on ?tier=poster), everything but the two cues hidden, one
// background, the cue's animations paused at the same instant (0.6 s and 1.4 s into the 2.5 s cycle: the top chevron
// drawn; all three held), CPU raster (as overlay.spec.ts), full-page screenshots compared pixel for pixel. The one
// designed difference is the colour: the port draws the dots in Pearl Whisper (#F7F6F3, rule 23) where the prototype
// uses #fff, 12/255 at most on any channel, so max_diff must stay within 12 and the differing pixels within the cues.
import { test, expect, chromium, type Browser, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { servePrototype, PROTO11_URL } from '../harness/prototype.ts';
import { CHROME_PATH } from '../harness/browser.ts';
import { compare } from '../harness/compare.ts';
import { sameBackground } from '../harness/settle.ts';

// The cue's show and hide logic is e2e's (AC5.2); here both cues are forced shown, so only the drawing is compared.
const HIDE = '#stage,.hero-poster,#intro,.tune,.labels,.fallback,#wallCopy,.site-logo,.copy,#s2labels,#s2links,#families,#main{display:none!important}'
  + '.scrollcue{opacity:1!important;visibility:visible!important;transition:none!important}';
const TIMES = [0.6, 1.4];
const VIEWPORTS = [
  { name: '390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  { name: '1280', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 },
];

async function pauseAt(page: Page, t: number) {
  await page.evaluate((ms) => {
    for (const a of document.getAnimations()) {
      const el = (a.effect as KeyframeEffect | null)?.target as Element | null;
      if (el && el.closest('.scrollcue')) { a.pause(); a.currentTime = ms; }
    }
  }, t * 1000);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function shoot(browser: Browser, base: string, vp: (typeof VIEWPORTS)[number], proto: boolean) {
  const ctx = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: vp.deviceScaleFactor, bypassCSP: true });
  if (proto) await servePrototype(ctx, { three: false, version: 'v11.4' });
  const page = await ctx.newPage();
  if (proto) {
    await page.goto(PROTO11_URL);
    await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 30_000 });
  } else {
    await page.goto(new URL('/?tier=poster', base).href);
  }
  await page.addStyleTag({ content: HIDE });
  await sameBackground(page);
  await page.evaluate(() => scrollTo(0, 0));
  const shown = await page.evaluate(() => ['cue', 'cue2'].map((id) => { const e = document.getElementById(id)!, c = getComputedStyle(e); return [c.visibility, c.opacity, e.querySelectorAll('.chev').length].join(' '); }));
  const pngs: Buffer[] = [];
  for (const t of TIMES) { await pauseAt(page, t); pngs.push(await page.screenshot()); }
  await ctx.close();
  return { pngs, shown };
}

let cpu: Browser;
test.beforeAll(async () => { cpu = await chromium.launch({ executablePath: CHROME_PATH, args: ['--disable-gpu-rasterization'] }); });
test.afterAll(async () => { await cpu?.close(); });

for (const vp of VIEWPORTS) {
  test(`v11.4 cue at rest at ${vp.name}: both cues identical to the prototype's but for Pearl Whisper against white`, async ({ baseURL }, info) => {
    const a = await shoot(cpu, baseURL!, vp, true), b = await shoot(cpu, baseURL!, vp, false);
    expect(b.shown).toEqual(a.shown);
    expect(a.shown).toEqual(['visible 1 3', 'visible 1 3']);
    const dir = info.outputPath(); mkdirSync(dir, { recursive: true });
    const rows: string[] = [];
    TIMES.forEach((t, i) => {
      writeFileSync(`${dir}/proto-${t}.png`, a.pngs[i]); writeFileSync(`${dir}/port-${t}.png`, b.pngs[i]);
      const r = compare(`${dir}/proto-${t}.png`, `${dir}/port-${t}.png`, {}, `${dir}/diff-${t}.png`);
      rows.push(`${t} s: ${JSON.stringify({ psnr: r.psnr, diff_px: r.diff_px, max_diff: r.max_diff, bbox: r.bbox })}`);
      expect(r.max_diff, `at ${t} s`).toBeLessThanOrEqual(12);
      expect(r.diff_px, `at ${t} s`).toBeGreaterThan(0);   // the dots are there (the colour differs by design); an empty frame would compare equal
    });
    console.log(`[v11 cue ${vp.name}] ` + rows.join(' | '));
    info.annotations.push({ type: 'v11-cue', description: rows.join(' | ') });
  });
}
