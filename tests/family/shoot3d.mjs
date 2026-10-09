// Screenshots of the 3D lineup for the build hand-off (.claude/skills/build/SKILL.md step 3; family-page.md 7's sizes).
//   BASE_URL=http://127.0.0.1:8795/ node tests/family/shoot3d.mjs <outdir> [slug:WxH[:gloss|:sel=NN|:poster] ...]
// Needs a PUBLIC_FAMILY_3D=on test build. Waits for the live, settled lineup (LOD0 in) and writes
// <outdir>/family-r2-<slug>-<W>x<H>[-variant].png. Phones (under 900 wide or 600 tall) get a coarse pointer at 2x.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [out = 'docs/specs/screenshots', ...jobs] = process.argv.slice(2);
const base = (process.env.BASE_URL || 'http://127.0.0.1:8795/').replace(/\/$/, '');
const list = jobs.length ? jobs : ['blissful-blues:390x844', 'blissful-blues:1280x800', 'frosty-whites:390x844', 'frosty-whites:1280x800', 'vivid-violets:390x844', 'vivid-violets:1280x800'];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const job of list) {
  const [slug, size, variant = ''] = job.split(':');
  const [w, h] = size.split('x').map(Number);
  const phone = w < 900 || h < 600;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone && w < 900, hasTouch: phone });
  const page = await ctx.newPage();
  const q = variant === 'poster' ? '&pose=poster' : '';
  await page.goto(`${base}/shades/${slug}/?render=force&tier=high${q}`);
  const settled = () => page.waitForFunction(() => { const s = window.__famStage?.state(); return !!s && !s.running && (location.search.includes('pose=poster') || (s.G > 0.999 && Math.abs(s.s - s.target) < 0.001)); }, null, { timeout: 300_000, polling: 400 });
  await page.waitForFunction(() => document.querySelector('#st3d canvas.on') && window.__famStage?.state().detail === 'loaded', null, { timeout: 300_000, polling: 400 });
  await settled();
  if (variant === 'gloss') { await page.getByRole('button', { name: 'Gloss' }).click(); await page.waitForTimeout(900); await settled(); }
  if (variant.startsWith('sel=')) { await page.evaluate((k) => window.__fam.select(k), Number(variant.slice(4)) - 1); await page.waitForTimeout(600); await settled(); }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const file = join(out, `family-r2-${slug}-${w}x${h}${variant ? `-${variant.replace('=', '')}` : ''}.png`);
  await page.screenshot({ path: file, timeout: 180_000 });
  console.log(file, JSON.stringify(await page.evaluate(() => { const s = window.__famStage.state(); return { s: s.s, tier: s.tier, pxu: Math.round(s.pxu * 10) / 10 }; })));
  await ctx.close();
}
await browser.close();
