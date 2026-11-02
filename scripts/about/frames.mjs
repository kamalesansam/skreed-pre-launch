// The review frames of the About page and the section index (docs/specs/about.md, docs/specs/navbar.md), round 2 of
// 2026-11-03: the About page with its index and its laptop layout, and the landing page's index in its new face.
// Against a production build served by wrangler dev, in the installed Chrome on the machine's GPU (the 3D path draws
// there; the harness's SwiftShader barely ticks the page's animation clock), device scale 1:
//   npm run build; npx wrangler dev --ip 127.0.0.1 --port <port> --assets dist
//   node scripts/about/frames.mjs --base http://127.0.0.1:<port>/ [--out docs/specs/screenshots] [--only a.png,b.png]
// The landing page's frames wait for the loader (#intro) to leave the DOM and for the intro to hand the index back
// (html.uh1 gone), not for a class or a ready flag alone (a frame taken on those shows the loader's wordmark).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:8787/');
const OUT = arg('--out', 'docs/specs/screenshots');
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--ignore-gpu-blocklist', '--enable-gpu'] });
const url = (p) => new URL(p, BASE).href;
const shot = async (page, name, fullPage = false) => { await page.screenshot({ path: join(OUT, name), fullPage }); console.log('wrote', join(OUT, name)); };

/** the About page at a size: fonts in, the drawer open when asked (its slide over) */
async function about(w, h, name, { full = false, menu = false } = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(url('/about/'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (menu) {
    await page.locator('#siteNav .snav-menu').click();
    await page.waitForFunction(() => { const p = document.querySelector('#site-sections .snav-in'); return !!p && ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(p).transform); });
    await page.mouse.move(1, h - 1);   // the pointer off the drawer, so no row shows its hover
    await page.waitForTimeout(400);    // Close, under the pointer as the drawer opened, back from its 1 px lift (--dur-press)
  }
  await shot(page, name, full);
  await page.close();
}

/** the landing page at rest after the intro on the 3D path; the drawer open when asked */
async function landing(w, h, name, { menu = false, js = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, javaScriptEnabled: js });
  const page = await ctx.newPage();
  await page.goto(url('/'), { waitUntil: 'load' });
  if (js) {
    await page.waitForFunction(() => !document.getElementById('intro') && !document.documentElement.classList.contains('uh1') && !document.documentElement.classList.contains('loading'), null, { timeout: 90_000, polling: 250 });
    await page.waitForTimeout(1500);   // the countdown's glitch and the cue settled
  } else {
    await page.waitForTimeout(800);
  }
  await page.evaluate(() => document.fonts.ready);
  if (menu) {
    await page.locator('#siteNav .snav-menu').click();
    await page.waitForFunction(() => { const p = document.querySelector('#site-sections .snav-in'); return !!p && ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(p).transform); });
    await page.mouse.move(1, h - 1);
    await page.waitForTimeout(400);
  }
  await shot(page, name);
  await ctx.close();
}

const only = arg('--only', '');
const want = (n) => !only || only.split(',').includes(n);
if (want('about-390.png')) await about(390, 844, 'about-390.png', { full: true });
if (want('about-390-menu.png')) await about(390, 844, 'about-390-menu.png', { menu: true });
if (want('about-1280.png')) await about(1280, 800, 'about-1280.png', { full: true });
if (want('about-1512.png')) await about(1512, 830, 'about-1512.png', { full: true });
if (want('navbar-about-1280.png')) await landing(1280, 800, 'navbar-about-1280.png');
if (want('navbar-about-390-menu.png')) await landing(390, 844, 'navbar-about-390-menu.png', { menu: true });
if (want('navbar-about-360-nojs.png')) await landing(360, 800, 'navbar-about-360-nojs.png', { js: false });
await browser.close();
