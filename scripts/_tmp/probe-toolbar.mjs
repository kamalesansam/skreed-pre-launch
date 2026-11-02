// probe: is Astro's dev toolbar drawn in a headless capture of the dev server, and where?
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4321/';
const browser = await chromium.launch({ channel: 'chrome', args: ['--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(new URL('/?tier=poster&room=open', base).href, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 3000));
const info = await page.evaluate(() => {
  const t = document.querySelector('astro-dev-toolbar');
  if (!t) return { present: false };
  const out = { present: true, display: getComputedStyle(t).display, rect: t.getBoundingClientRect().toJSON() };
  const root = t.shadowRoot;
  if (root) out.inner = [...root.querySelectorAll('#dev-bar, #dev-toolbar-root, .item, #bar-container, [data-placement]')].slice(0, 6).map((e) => ({ id: e.id, cls: e.className, rect: e.getBoundingClientRect().toJSON(), vis: getComputedStyle(e).visibility, op: getComputedStyle(e).opacity }));
  return out;
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: process.argv[3], clip: { x: 0, y: 744, width: 390, height: 100 } });
await browser.close();
