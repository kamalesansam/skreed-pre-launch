// Screenshots of the family pages for the build hand-off (.claude/skills/build/SKILL.md step 3).
//   BASE_URL=http://127.0.0.1:8790/ node tests/family/shoot.mjs <outdir> [family ...] [--sizes=390x844,1280x800] [--full]
// Writes <outdir>/family-<slug>-<w>x<h>.png. Uses Playwright's Chromium (CHROME_PATH overrides).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith('--')) ?? 'docs/specs/screenshots';
const fams = args.filter((a) => !a.startsWith('--')).slice(1);
const sizesArg = args.find((a) => a.startsWith('--sizes='))?.slice(8) ?? '390x844,1280x800';
const full = args.includes('--full');
const query = args.find((a) => a.startsWith('--query='))?.slice(8) ?? '';
const suffix = args.find((a) => a.startsWith('--suffix='))?.slice(9) ?? '';
const base = process.env.BASE_URL || 'http://127.0.0.1:8790/';
const sizes = sizesArg.split(',').map((s) => s.split('x').map(Number));
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
for (const slug of fams.length ? fams : ['blissful-blues', 'frosty-whites', 'vivid-violets']) {
  for (const [w, h] of sizes) {
    const coarse = w < 900 || h < 600;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: coarse && w < 900, hasTouch: coarse });
    const page = await ctx.newPage();
    await page.goto(new URL(`shades/${slug}/${query}`, base).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const file = join(out, `family-${slug}-${w}x${h}${suffix}.png`);
    await page.screenshot({ path: file, fullPage: full });
    console.log(file);
    await ctx.close();
  }
}
await browser.close();
