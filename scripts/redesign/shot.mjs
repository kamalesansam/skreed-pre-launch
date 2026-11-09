// Review frames of the redesigned landing page (docs/specs/redesign.md): one section at one width, at rest or in
// steps through its scroll, from a running dev server or a served build. The build skill's frames (390 by 844 and
// 1280 by 800) and every section builder's own checks come from here.
//
//   node scripts/redesign/shot.mjs --id products --w 1280 --out /abs/dir/products-1280.png
//   node scripts/redesign/shot.mjs --id seen --w 390 --steps 6 --out /abs/dir/seen-390.png      (writes -0.png to -5.png)
//   node scripts/redesign/shot.mjs --w 1280 --page --out /abs/dir/page-1280.png                 (the whole page, top to bottom)
//
// --url      the page (default http://127.0.0.1:4390/)
// --id       the section's id; without it the frame is the top of the page
// --w, --h   the viewport (390 by 844 at 2x with touch, or 1280 by 800 at 1x, by default from --w)
// --at       where the section's top sits, as a share of the screen's height (default 0; 0.5 puts it mid-screen)
// --section  the section's whole box instead of the screen
// --steps n  n frames while the page scrolls from the section entering to the section leaving
// --hover, --click, --focus   a selector to hover, press or focus before the frame
// --wait     ms to settle before the frame (default 1400)
// --js off   scripts disabled (the no-JavaScript page)
// --block    a substring of request URLs to fail (for instance gsap, to see the page without the kit)
// Prints the console's errors and any CSP violation, so a frame that looks right but logs wrong is caught.
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i < 0 ? d : (args[i + 1]?.startsWith('--') || args[i + 1] === undefined ? true : args[i + 1]); };
const url = opt('url', 'http://127.0.0.1:4390/');
const w = Number(opt('w', 1280));
const phone = w < 720;
const h = Number(opt('h', phone ? 844 : 800));
const out = opt('out');
if (!out) { console.error('shot: --out <file.png> is required'); process.exit(2); }
const id = opt('id');
const steps = Number(opt('steps', 0));
const wait = Number(opt('wait', 1400));

let browser;
try { browser = await chromium.launch({ channel: 'chrome', args: ['--ignore-gpu-blocklist'] }); }
catch { browser = await chromium.launch(); }
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: Number(opt('dpr', phone ? 2 : 1)), isMobile: phone, hasTouch: phone, javaScriptEnabled: opt('js', 'on') !== 'off' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
const block = opt('block');
if (block) await page.route((u) => u.href.includes(block), (r) => r.abort());
await page.goto(url, { waitUntil: 'load' });
if (opt('js', 'on') !== 'off') await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' }).catch(() => {});
if (opt('js', 'on') !== 'off') {
  await page.evaluate(() => document.fonts.ready);
  if (!block) await page.waitForFunction(() => document.documentElement.classList.contains('rd-live'), null, { timeout: 8000 }).catch(() => errors.push('shot: the motion kit never arrived (html.rd-live)'));
}
const box = async () => (id ? page.evaluate((i) => { const e = document.getElementById(i); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top + scrollY, height: r.height }; }, id) : { top: 0, height: h });
let b = await box();
if (!b) { console.error(`shot: no element with id ${id}`); await browser.close(); process.exit(1); }
const to = (y) => page.evaluate((v) => scrollTo({ top: Math.max(0, v), behavior: 'instant' }), y);

if (opt('page', false)) {
  // walk the page once so every lazy picture and entrance has happened, then take it whole
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += h * 0.5) { await to(y); await page.waitForTimeout(220); }
  await to(0); await page.waitForTimeout(500);
  await page.screenshot({ path: out, fullPage: true });
} else if (steps > 0) {
  const from = b.top - h, end = b.top + b.height;
  for (let i = 0; i < steps; i++) {
    await to(from + ((end - from) * i) / (steps - 1));
    await page.waitForTimeout(Math.max(350, wait / 3));
    await page.screenshot({ path: out.replace(/\.png$/, `-${i}.png`) });
  }
} else {
  await to(b.top - Number(opt('at', 0)) * h);
  await page.waitForTimeout(wait);
  for (const k of ['hover', 'click', 'focus']) {
    const sel = opt(k);
    if (typeof sel === 'string') { await page.locator(sel).first()[k === 'hover' ? 'hover' : k === 'click' ? 'click' : 'focus'](); await page.waitForTimeout(700); }
  }
  if (opt('section', false) && id) await page.locator(`#${id}`).screenshot({ path: out });
  else await page.screenshot({ path: out });
}
const csp = await page.evaluate(() => (window.__cspViolations ?? []).length).catch(() => 0);
console.log(JSON.stringify({ out, width: w, height: h, section: id ?? null, sectionBox: b, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth), errors, csp }));
await browser.close();
