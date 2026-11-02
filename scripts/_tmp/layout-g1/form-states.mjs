// throwaway (layout builder, G1): the form's states on a short phone, the body's height and the slot held (poster tier)
import { chromium } from '@playwright/test';
import { join } from 'node:path';
const base = 'http://127.0.0.1:4321/';
const out = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of [[375, 667], [390, 664], [360, 740]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  let status = 500;
  await page.route('**/api/signup', (route) => route.fulfill({ status, contentType: 'application/json', body: '{}' }));
  await page.goto(new URL('/?tier=poster&room=open', base).href, { waitUntil: 'load', timeout: 120_000 });
  await page.waitForFunction(() => !document.getElementById('signup')?.hidden, null, { timeout: 20_000 });
  await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
  await page.evaluate(() => { const el = document.getElementById('signup'); scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await page.evaluate(() => document.fonts.ready); await sleep(1200);
  const m = () => page.evaluate(() => { const root = document.getElementById('signup'), r = (s) => root.querySelector(s).getBoundingClientRect(); const vis = (s) => { const e = root.querySelector(s); return !!e && getComputedStyle(e).visibility !== 'hidden' && !!e.querySelector('.dc > *'); }; return { body: +r('.su-body').height.toFixed(1), slotY: +r('.su-slot').y.toFixed(1), credit: +r('.su-credit').bottom.toFixed(1), form: +r('#suForm').height.toFixed(1), msgs: ['#suErrEmail', '#suErrConsent', '#suMsg'].filter(vis), errLines: Math.round(r('#suErrEmail').height), done: !root.querySelector('#suDone').hidden, doneH: +r('#suDone').height.toFixed(1), doneText: +r('.su-done-text').height.toFixed(1) }; });
  const rows = [];
  rows.push(['rest', await m()]);
  await page.fill('#suEmail', 'not-an-address'); await page.locator('#suEmail').blur(); await sleep(200);
  rows.push(['email error', await m()]);
  await page.click('#suSend'); await sleep(300);
  rows.push(['both errors', await m()]);
  if (out) await page.screenshot({ path: join(out, `${w}x${h}-errors.png`) });
  await page.fill('#suEmail', 'sam@example.com'); await page.locator('#suEmail').blur(); await page.check('#suConsent'); await sleep(200);
  await page.click('#suSend'); await sleep(1200);
  rows.push(['send error', await m()]);
  status = 200;
  await page.fill('#suEmail', 'a.very.long.address.for.the.done.line.of.the.signup@an-example-domain.co.uk'); await page.locator('#suEmail').blur();
  await page.click('#suSend'); await sleep(1500);
  rows.push(['done, long address', await m()]);
  if (out) await page.screenshot({ path: join(out, `${w}x${h}-done.png`) });
  for (const [k, v] of rows) console.log(`${w}x${h} ${k.padEnd(18)} ${JSON.stringify(v)}`);
  await ctx.close();
}
await browser.close();
