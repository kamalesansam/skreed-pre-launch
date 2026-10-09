// The family posters (docs/specs/family-page.md 5 "First paint"; case-model-class.md 15 "When it lands"): frame 0 of
// each family's lineup (the poster pose: no case promoted, centred on the middle of the family) rendered by the page
// itself, on its stage neutral, encoded AVIF and WebP.
//   node scripts/case-model/posters.mjs <base url of a PUBLIC_FAMILY_3D=on build:test server> [slug ...] [--layouts=phone,wide]
// Phone: a 430 x 520 stage at 2x (860 x 1040), shown with object-fit: none. Wide: the 1280 x 728 stage at 1.5x
// (1920 x 1092), shown with object-fit: cover. Budgets (section 6): phone 80 KB, wide 110 KB (AVIF). The canvas is read
// with the test hook __famStage.snapshot() in the same task as its render, so the PNG holds exactly frame 0.
// Writes src/components/family/posters/<slug>-{phone,wide}.{avif,webp}.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const BASE = process.argv[2];
if (!BASE) { console.error('usage: node scripts/case-model/posters.mjs <base url> [slug ...]'); process.exit(2); }
const data = JSON.parse(readFileSync(join(ROOT, 'docs/data/shades-240.json'), 'utf8'));
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const layoutsArg = process.argv.find((a) => a.startsWith('--layouts='))?.slice(10).split(',');
const OUT = join(ROOT, 'src/components/family/posters');
mkdirSync(OUT, { recursive: true });
const NEUTRAL = ['#383F43', '#F7F6F3'];   // catalog order alternates Urban Slate, Pearl Whisper (family-page.md 2.1)
const LAYOUTS = [
  { name: 'phone', viewport: { width: 430, height: 932 }, dsf: 2, mobile: true, size: [860, 1040], avif: 50, webp: 74, budget: 80_000 },
  { name: 'wide', viewport: { width: 1280, height: 800 }, dsf: 1.5, mobile: false, size: [1920, 1092], avif: 46, webp: 70, budget: 110_000 },
];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let bad = false;
console.log('| family | layout | px | AVIF B | WebP B |\n|---|---|---|---:|---:|');
for (const [fi, fam] of data.families.entries()) {
  if (only.length && !only.includes(fam.id)) continue;
  for (const L of LAYOUTS.filter((x) => !layoutsArg || layoutsArg.includes(x.name))) {
    const ctx = await browser.newContext({ viewport: L.viewport, deviceScaleFactor: L.dsf, isMobile: L.mobile, hasTouch: L.mobile });
    const page = await ctx.newPage();
    await page.goto(`${BASE.replace(/\/$/, '')}/shades/${fam.id}/?render=force&tier=high&pose=poster`);
    await page.waitForFunction(() => document.querySelector('#st3d canvas.on') && window.__famStage?.state().detail === 'loaded', null, { timeout: 300_000, polling: 500 });
    const png = Buffer.from((await page.evaluate(() => window.__famStage.snapshot())).split(',')[1], 'base64');
    await ctx.close();
    const meta = await sharp(png).metadata();
    if (meta.width !== L.size[0] || meta.height !== L.size[1]) { console.error(`${fam.id} ${L.name}: canvas ${meta.width} x ${meta.height}, expected ${L.size.join(' x ')}`); bad = true; continue; }
    const flat = sharp(png).flatten({ background: NEUTRAL[fi % 2] });
    const avif = await flat.clone().avif({ quality: L.avif, effort: 6, chromaSubsampling: '4:2:0' }).toBuffer();
    const webp = await flat.clone().webp({ quality: L.webp, effort: 6 }).toBuffer();
    writeFileSync(join(OUT, `${fam.id}-${L.name}.avif`), avif);
    writeFileSync(join(OUT, `${fam.id}-${L.name}.webp`), webp);
    if (avif.length > L.budget) bad = true;
    console.log(`| ${fam.name} | ${L.name} | ${meta.width} x ${meta.height} | ${avif.length.toLocaleString('en')}${avif.length > L.budget ? ' (over)' : ''} | ${webp.length.toLocaleString('en')} |`);
  }
}
await browser.close();
process.exit(bad ? 1 : 0);
