// The About page, /about/ (docs/specs/about.md AC2 and AC4 to AC9), against a production build served by wrangler dev:
//   PUBLIC_HERO_HOOKS=0 PUBLIC_TUNE=0 PUBLIC_STAGING=0 PUBLIC_FAMILY_3D=on npx astro build --outDir dist-about
//   node scripts/csp.mjs --dist dist-about; npx wrangler dev --ip 127.0.0.1 --port <port> --assets dist-about
//   BASE_URL=http://127.0.0.1:<port>/ SKREED_DIST=dist-about npx playwright test tests/e2e/about.spec.ts --project=e2e
// The page ships no script, so every row reads what a visitor's browser has: the network, the DOM, the computed styles
// and, through the DevTools protocol, the platform font each run of text was drawn with.
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { watchCsp, cspViolations } from '../harness/csp.ts';
import { ABOUT_COPY as C } from '../../src/config/about.ts';
import { LAUNCH_ISO } from '../../src/config/site.ts';

const PATH = '/about/';
const FONT = '/fonts/inter-400-700-latin.woff2';
const DIST = resolve(process.env.SKREED_DIST || 'dist');
const PHONE = { width: 390, height: 844 }, LAPTOP = { width: 1280, height: 800 };
const SLATE = 'rgb(56, 63, 67)', PEARL = 'rgb(247, 246, 243)', EMBER = 'rgb(255, 153, 0)';
const TEXT = 'main h1, main p';
const inset = (w: number) => Math.min(56, Math.max(16, 0.035 * w));

type Box = { sel: string; x: number; y: number; w: number; h: number };
/** the boxes of the wordmark and of every text element, in document order */
const boxes = (page: Page): Promise<Box[]> => page.evaluate((sel) => [document.querySelector('a.site-logo')!, ...document.querySelectorAll(sel)].map((e, i) => {
  const r = e.getBoundingClientRect();
  return { sel: i === 0 ? 'a.site-logo' : `${e.tagName.toLowerCase()}${e.className ? '.' + e.className : ''}#${i}`, x: r.x, y: r.y + scrollY, w: r.width, h: r.height };
}), TEXT);
const meets = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

async function open(page: Page, viewport = PHONE) {
  await page.setViewportSize(viewport);
  await page.goto(PATH);
  await page.evaluate(() => document.fonts.ready);
}

test.describe('AC2 Inter from the one self-hosted file, no other face, nothing italic', () => {
  for (const vp of [PHONE, LAPTOP]) {
    test(`cold load at ${vp.width} x ${vp.height}`, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      const reqs: { url: string; type: string; status?: number }[] = [];
      page.on('requestfinished', async (r) => { reqs.push({ url: r.url(), type: r.resourceType(), status: (await r.response())?.status() }); });
      page.on('requestfailed', (r) => { reqs.push({ url: r.url(), type: r.resourceType() }); });
      await page.goto(new URL(PATH, baseURL).href, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const origin = new URL(baseURL!).origin;
      expect(reqs.filter((r) => new URL(r.url).origin !== origin), 'nothing leaves the origin').toEqual([]);
      const fonts = reqs.filter((r) => new URL(r.url).pathname.startsWith('/fonts/'));
      expect(fonts.map((r) => [new URL(r.url).pathname, r.status])).toEqual([[FONT, 200]]);
      expect(await page.locator('link[rel="preload"][as="font"]').evaluateAll((ls) => ls.map((l) => (l as HTMLLinkElement).href))).toEqual([new URL(FONT, baseURL).href]);
      // the faces: Inter loaded, every face of the site's own set left unloaded
      const faces = await page.evaluate(() => [...document.fonts].map((f) => ({ family: f.family.replace(/^"|"$/g, ''), weight: f.weight, style: f.style, status: f.status })));
      expect(faces.filter((f) => f.family === 'Inter')).toEqual([{ family: 'Inter', weight: '400 700', style: 'normal', status: 'loaded' }]);
      // the site's own faces (the brand's, the quiz's, the result's) all unloaded: Inter is the one face the page loads
      const brand = faces.filter((f) => ['Poppins', 'Open Sans', 'Source Serif 4', 'IBM Plex Mono'].includes(f.family));
      expect(brand.length).toBeGreaterThanOrEqual(6);
      for (const f of brand) expect(f.status, `${f.family} ${f.weight}`).toBe('unloaded');
      expect(faces.filter((f) => f.status !== 'unloaded').map((f) => f.family)).toEqual(['Inter']);
      // the face actually drawn, run by run: the DevTools protocol's platform fonts for each element's own text
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      for (const sel of ['h1 span', '.ab-text p', '.ab-text em', '.ab-sign', '.ab-launch', '.ab-launch time', '.ab-quote']) {
        const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: sel });
        expect(nodeIds.length, sel).toBeGreaterThan(0);
        for (const nodeId of nodeIds) {
          const { fonts: used } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
          expect(used.length, sel).toBeGreaterThan(0);
          for (const u of used) expect({ sel, family: u.familyName, custom: u.isCustomFont }).toEqual({ sel, family: 'Inter', custom: true });
        }
      }
      // computed: the family, the weights, the sizes and line heights, the title's tracking; nothing italic anywhere
      const px = vp.width < 1024 ? { h1: 44, text: 18, sign: 20 } : { h1: 88, text: 22, sign: 24 };   // E-About-look: the reference's tall title and larger letter
      const cs = await page.evaluate(() => [...document.querySelectorAll('h1, main p, main em, main time')].map((e) => {
        const c = getComputedStyle(e);
        return { tag: e.tagName.toLowerCase(), cls: e.className, family: c.fontFamily, weight: c.fontWeight, size: parseFloat(c.fontSize), lh: parseFloat(c.lineHeight), ls: c.letterSpacing };
      }));
      for (const c of cs) expect(c.family, c.tag).toMatch(/^Inter,/);
      const h1 = cs.find((c) => c.tag === 'h1')!, sign = cs.find((c) => c.cls === 'ab-sign')!, launch = cs.find((c) => c.cls === 'ab-launch')!;
      const letter = cs.filter((c) => c.tag === 'p' && !c.cls);
      expect(letter.length).toBe(5);
      expect([h1.weight, sign.weight, launch.weight, ...letter.map((c) => c.weight), cs.find((c) => c.tag === 'em')!.weight]).toEqual(['700', '700', '400', '400', '400', '400', '400', '400', '600']);
      expect(Math.abs(h1.size - px.h1)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(sign.size - px.sign)).toBeLessThanOrEqual(0.1);
      for (const c of [...letter, launch]) { expect(Math.abs(c.size - px.text)).toBeLessThanOrEqual(0.1); expect(Math.abs(c.lh - 1.6 * c.size)).toBeLessThanOrEqual(0.1); }
      expect(Math.abs(h1.lh - 0.95 * h1.size)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(sign.lh - 1.2 * sign.size)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(parseFloat(h1.ls) + 0.02 * h1.size)).toBeLessThanOrEqual(0.01);   // tightened caps
      expect(await page.locator('main h1').evaluate((e) => getComputedStyle(e).textTransform)).toBe('uppercase');   // the DOM keeps the sentence case
      expect(await page.evaluate(() => [...document.querySelectorAll('header, header *, main, main *')].map((e) => getComputedStyle(e).fontStyle).filter((s) => s !== 'normal'))).toEqual([]);
      await ctx.close();
    });
  }
});

test('AC4 the words on the page are section 3\'s, element by element; the title, the description and the time', async ({ page }) => {
  await open(page);
  const text = (sel: string) => page.locator(sel).evaluateAll((es) => es.map((e) => e.textContent));
  expect(await text('main h1')).toEqual([C.h1]);
  expect(await text('.ab-text p')).toEqual([C.p1, C.p2, C.p3, C.p4, C.p5.join('')]);
  expect(await text('.ab-close p')).toEqual([C.sign, C.launch.join('')]);
  expect(await page.locator('main').evaluate((m) => [...m.querySelectorAll('h1, p')].map((e) => e.textContent).join('|'))).toBe([C.h1, C.p1, C.p2, C.p3, C.p4, C.p5.join(''), C.sign, C.launch.join('')].join('|'));
  expect(await text('main em')).toEqual(['that’s the one']);
  expect(await page.locator('main em').evaluate((e) => e.nextSibling?.textContent)).toBe('.');
  expect(await page.locator('main time').getAttribute('datetime')).toBe(LAUNCH_ISO);
  expect(await text('main time')).toEqual(['November 15']);
  await expect(page).toHaveTitle(C.title);
  expect(await page.locator('meta[name="description"]').getAttribute('content')).toBe(C.description);
});

test.describe('AC5 360 to 1280 px: no horizontal scroll, the gutters, the column, the wordmark', () => {
  for (const [w, h] of [[360, 780], [390, 844], [430, 932], [768, 1024], [1024, 768], [844, 390], [1280, 800]] as const) {
    test(`${w} x ${h}`, async ({ page }) => {
      await open(page, { width: w, height: h });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      const all = await boxes(page), logo = all[0], text = all.slice(1), i = inset(w);
      for (const b of all) { expect(b.x, `${b.sel} left`).toBeGreaterThanOrEqual(16); expect(w - (b.x + b.w), `${b.sel} right`).toBeGreaterThanOrEqual(16); }
      const col = (await page.locator('.ab-col').boundingBox())!;
      expect(col.width).toBeLessThanOrEqual(704 + 0.01);   // the measure, 44rem (E-About-look)
      expect(Math.abs(col.x - i), 'the column starts at the gutter').toBeLessThanOrEqual(0.5);   // at the left, as the reference sets its text
      expect(w - col.x - col.width, 'the right gutter').toBeGreaterThanOrEqual(i - 0.5);
      for (const b of text) expect(Math.abs(b.x - col.x), `${b.sel} flush left`).toBeLessThanOrEqual(0.5);
      const h1 = await page.locator('main h1').evaluate((e) => e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight));
      expect(Math.abs(h1 - 3), 'the h1 is three lines, as the reference breaks it').toBeLessThanOrEqual(0.1);
      // the quotation mark: at the top right, clear of the title's text, never past the right gutter
      const quote = (await page.locator('.ab-quote').boundingBox())!, h1Box = (await page.locator('main h1').boundingBox())!;
      expect(w - (quote.x + quote.width), 'the quotation mark inside the right gutter').toBeGreaterThanOrEqual(i - 1);
      const words = await page.locator('main h1 span').evaluateAll((es) => es.map((e) => e.getBoundingClientRect().right));
      expect(Math.max(...words), 'the title clear of the quotation mark').toBeLessThan(quote.x);
      expect(quote.y, 'the quotation mark on the title\'s row').toBeLessThan(h1Box.y + h1Box.height);
      expect(Math.abs(logo.w - (w >= 1024 ? 136 : 96))).toBeLessThanOrEqual(0.5);
      expect(Math.abs(logo.x - i)).toBeLessThanOrEqual(0.5); expect(Math.abs(logo.y - i)).toBeLessThanOrEqual(0.5);
      for (const b of text) expect(meets(logo, b), `the wordmark meets ${b.sel}`).toBe(false);
      if (w === 390 || w === 1280) {
        const [hd, ...ps] = text, sign = ps[5], launch = ps[6], letter = ps.slice(0, 5);
        const near = (got: number, want: number, what: string) => expect(Math.abs(got - want), `${what}: ${got}`).toBeLessThanOrEqual(1);
        near(hd.y - (logo.y + logo.h), 48, 'wordmark foot to h1');
        near(letter[0].y - (hd.y + hd.h), 32, 'h1 to the first paragraph');
        for (let k = 1; k < 5; k++) near(letter[k].y - (letter[k - 1].y + letter[k - 1].h), 24, `paragraph ${k} to ${k + 1}`);
        near(sign.y - (letter[4].y + letter[4].h), 48, 'the fifth paragraph to the sign-off');
        near(launch.y - (sign.y + sign.h), 8, 'the sign-off to the date line');
        expect(await page.locator('main').evaluate((m) => getComputedStyle(m).paddingBottom)).toBe('48px');
        test.info().annotations.push({ type: 'boxes', description: JSON.stringify(all.map((b) => ({ ...b, x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.w.toFixed(2), h: +b.h.toFixed(2) }))) });
      }
    });
  }
});

test('AC6 visible at rest; the wordmark\'s lift and press, and none under reduced motion', async ({ browser, baseURL }) => {
  const url = new URL(PATH, baseURL).href;
  const ctx = await browser.newContext({ viewport: LAPTOP });
  const page = await ctx.newPage();
  await page.goto(url); await page.evaluate(() => document.fonts.ready);
  // every element at rest and visible; the quotation mark ornament stands at its fixed tone (Urban Slate at a quarter, E-About-look) and never changes
  expect(await page.evaluate(() => [...document.querySelectorAll('header, header *, main, main *')].filter((e) => !e.matches('.ab-quote')).map((e) => getComputedStyle(e)).filter((c) => c.opacity !== '1' || c.visibility !== 'visible').length)).toBe(0);
  expect(await page.locator('.ab-quote').evaluate((e) => { const c = getComputedStyle(e); return [c.opacity, c.visibility, e.getAttribute('aria-hidden'), c.pointerEvents]; })).toEqual(['0.25', 'visible', 'true', 'none']);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  const logo = page.locator('a.site-logo');
  const look = () => logo.evaluate((e) => { const c = getComputedStyle(e); return { transform: c.transform, opacity: c.opacity, color: c.color }; });
  expect(await logo.evaluate((e) => { const c = getComputedStyle(e); return [c.transitionProperty, c.transitionDuration, c.transitionTimingFunction]; })).toEqual(['transform', '0.15s', 'cubic-bezier(0.2, 0, 0, 1)']);
  expect(await look()).toEqual({ transform: 'none', opacity: '1', color: SLATE });
  await logo.hover();
  await expect.poll(look, { timeout: 5000 }).toEqual({ transform: 'matrix(1, 0, 0, 1, 0, -1)', opacity: '1', color: SLATE });   // the lift, once its 150 ms transition has run (polled: the machine is shared)
  await page.mouse.down();
  await expect.poll(look, { timeout: 5000 }).toEqual({ transform: 'matrix(0.98, 0, 0, 0.98, 0, 0)', opacity: '1', color: SLATE });
  await page.mouse.move(LAPTOP.width - 20, LAPTOP.height - 20);   // release away from the link, so no click navigates
  await page.mouse.up();
  await ctx.close();
  const rm = await browser.newContext({ viewport: LAPTOP, reducedMotion: 'reduce' });
  const p2 = await rm.newPage();
  await p2.goto(url); await p2.evaluate(() => document.fonts.ready);
  const l2 = p2.locator('a.site-logo');
  expect(await l2.evaluate((e) => getComputedStyle(e).transitionDuration)).toBe('0s');
  await l2.hover();
  await p2.waitForTimeout(250);
  expect(await l2.evaluate((e) => getComputedStyle(e).transform)).toBe('none');
  await p2.mouse.down();
  await p2.waitForTimeout(250);
  expect(await l2.evaluate((e) => getComputedStyle(e).transform)).toBe('none');
  await p2.mouse.move(LAPTOP.width - 20, LAPTOP.height - 20);
  await p2.mouse.up();
  await rm.close();
});

/** WCAG 2 contrast of two computed rgb() colours */
const contrast = (a: string, b: string) => {
  const lum = (s: string) => { const [r, g, bl] = s.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number).map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('AC7 the landmarks and the tree, the focus ring, the hit box, the contrast', async ({ page }) => {
  await open(page);
  expect(await page.locator('html').getAttribute('lang')).toBe('en-IN');
  // the tree as Chromium exposes it: the em as emphasis and the time as time inside their paragraphs (the snapshot trims
  // the text runs and reads the no-break space as a space)
  const q = (s: string) => JSON.stringify(s.replace(/ /g, ' ').trim());
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - banner:
      - link "Skreed, home":
        - /url: /
    - main:
      - heading "A message from our founder" [level=1]
      - paragraph: ${q(C.p1)}
      - paragraph: ${q(C.p2)}
      - paragraph: ${q(C.p3)}
      - paragraph: ${q(C.p4)}
      - paragraph:
        - text: ${q(C.p5[0])}
        - emphasis: ${q(C.p5[1])}
        - text: ${q(C.p5[2])}
      - paragraph: ${q(C.sign)}
      - paragraph:
        - text: ${q(C.launch[0])}
        - time: ${q(C.launch[1])}
        - text: ${q(C.launch[2])}
  `);
  expect(await page.locator('main').getByRole('heading').count()).toBe(1);
  expect(await page.locator('main').getByRole('paragraph').count()).toBe(7);
  // the first Tab: the wordmark, with the two-tone ring
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const a = document.activeElement as HTMLElement, c = getComputedStyle(a), b = getComputedStyle(a, '::before'), h = getComputedStyle(a, '::after');
    return { cls: a.className, outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`, offset: c.outlineOffset,
      before: `${b.borderTopStyle} ${b.borderTopWidth} ${b.borderTopColor}`, beforeInset: [b.top, b.right, b.bottom, b.left], after: [h.top, h.right, h.bottom, h.left] };
  });
  expect(ring).toEqual({ cls: 'site-logo', outline: `solid 2px ${EMBER}`, offset: '6px', before: `solid 2px ${SLATE}`, beforeInset: ['-4px', '-4px', '-4px', '-4px'], after: ['-11px', '-8px', '-11px', '-8px'] });
  // the hit box: the link answers at its ::after's corners, at least 44 x 44 px
  const r = (await page.locator('a.site-logo').boundingBox())!;
  expect(r.width + 16).toBeGreaterThanOrEqual(44); expect(r.height + 22).toBeGreaterThanOrEqual(44);
  for (const [x, y] of [[r.x - 7.5, r.y - 10.5], [r.x + r.width + 7.5, r.y + r.height + 10.5]]) {
    expect(await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest('a')?.className ?? null, [x, y])).toBe('site-logo');
  }
  // contrast: every text element and the wordmark against the page's ground, from the computed values
  const colours = await page.evaluate(() => ({ ground: [getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor],
    fg: [...document.querySelectorAll('a.site-logo, main h1, main p, main em, main time')].map((e) => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]) }));
  expect(colours.ground).toEqual([PEARL, PEARL]);
  // the wordmark and the title in Urban Slate (9.9:1); the letter, its emphasis, the sign-off and the date in Coffee (E-About-look; 5.9:1, over AA's 4.5)
  const COFFEE = 'rgb(122, 88, 63)';
  for (const [fg, bg] of colours.fg) { expect([SLATE, COFFEE]).toContain(fg); expect(bg).toBe('rgba(0, 0, 0, 0)'); expect(contrast(fg, PEARL)).toBeGreaterThanOrEqual(fg === SLATE ? 9.9 : 5.8); }
  expect(colours.fg.slice(0, 2).map(([fg]) => fg)).toEqual([SLATE, SLATE]);
  expect(colours.fg.slice(2).map(([fg]) => fg).every((fg) => fg === COFFEE)).toBe(true);
});

test.describe('AC7 reflow, zoom and text spacing', () => {
  for (const [w, h] of [[320, 640], [640, 400]] as const) {
    test(`${w} x ${h}: no horizontal scroll, nothing leaves the viewport or meets another box`, async ({ page }) => {
      await open(page, { width: w, height: h });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      const all = await boxes(page);
      for (const b of all) { expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x + b.w).toBeLessThanOrEqual(w); }
      for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) expect(meets(all[a], all[b]), `${all[a].sel} meets ${all[b].sel}`).toBe(false);
    });
  }
  for (const vp of [{ width: 320, height: 640 }, PHONE]) {
    test(`WCAG 1.4.12 overrides at ${vp.width} px: nothing clipped, no horizontal scroll`, async ({ page }) => {
      await open(page, vp);
      // through the CSSOM: the page's CSP refuses an injected <style>, as it should
      await page.evaluate((rules) => { const s = document.styleSheets[0]; for (const r of rules) s.insertRule(r, s.cssRules.length); },
        ['* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }', 'p { margin-bottom: 2em !important; }']);
      // the overrides took: paragraph spacing 2em, letter spacing 0.12em, line height 1.5
      const applied = await page.locator('main p >> nth=0').evaluate((e) => { const c = getComputedStyle(e), fs = parseFloat(c.fontSize); return [parseFloat(c.marginBottom) / fs, parseFloat(c.letterSpacing) / fs, parseFloat(c.lineHeight) / fs]; });
      expect(applied.map((v) => +v.toFixed(2))).toEqual([2, 0.12, 1.5]);
      await page.waitForTimeout(200);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      // the letter's elements: 1.4.12 is about text, and the wordmark link holds none (its ::after hit box, inset -11px -8px by
      // design, is scrollable overflow of its own; the box check below keeps the link inside the viewport)
      // (the ring's drawn ellipse reaches past its words by design, so it is lifted out while the text's own overflow is read)
      const over = await page.evaluate(() => { const ring = document.querySelector<SVGElement>('.ab-ring svg')!; ring.style.display = 'none';
        const o = [...document.querySelectorAll('main, main *')].filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).filter((e) => e.clientWidth > 0).map((e) => e.tagName); ring.style.display = ''; return o; });
      expect(over).toEqual([]);
      const all = await boxes(page);
      for (const b of all) expect(b.x + b.w).toBeLessThanOrEqual(vp.width);
    });
  }
});

test('AC8 zero JavaScript: no script fetched, one data block, no handlers; the same boxes with JavaScript off; the bytes', async ({ browser, baseURL }) => {
  const url = new URL(PATH, baseURL).href;
  const on = await browser.newContext({ viewport: PHONE });
  const page = await on.newPage();
  const types: string[] = [];
  page.on('request', (r) => types.push(r.resourceType()));
  await page.goto(url, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  expect(types.filter((t) => t === 'script')).toEqual([]);
  expect(await page.evaluate(() => [...document.scripts].map((s) => s.type))).toEqual(['application/ld+json']);
  expect(await page.evaluate(() => [...document.querySelectorAll('*')].flatMap((e) => [...e.attributes].filter((a) => /^on/i.test(a.name)).map((a) => `${e.tagName} ${a.name}`)))).toEqual([]);
  expect(await page.locator('noscript').count()).toBe(0);
  // the first view's bytes as transferred: the document and every resource it fetched
  const transferred = await page.evaluate(() => [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].reduce((a, e) => a + (e as PerformanceResourceTiming).transferSize, 0));
  expect(transferred).toBeGreaterThan(0); expect(transferred).toBeLessThanOrEqual(80_000);
  const sel = ['a.site-logo', 'main', 'main h1', ...Array.from({ length: 7 }, (_, i) => `main p >> nth=${i}`)];
  const read = async (p: Page) => Promise.all(sel.map(async (s) => (await p.locator(s).boundingBox())!));
  const withJs = await read(page);
  await on.close();
  const off = await browser.newContext({ viewport: PHONE, javaScriptEnabled: false });
  const p2 = await off.newPage();
  await p2.goto(url, { waitUntil: 'load' }); await p2.waitForTimeout(800);
  const noJs = await read(p2);
  for (const [i, b] of noJs.entries()) for (const k of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(b[k] - withJs[i][k]), `${sel[i]} ${k}`).toBeLessThanOrEqual(0.5);
  await off.close();
  const html = readFileSync(resolve(DIST, 'about/index.html'));
  expect(html.length, 'dist/about/index.html raw').toBeLessThanOrEqual(30_000);
  expect(gzipSync(html, { level: 9 }).length, 'gzip').toBeLessThanOrEqual(10_000);
});

test('AC9 the head, the JSON-LD, the sitemap, the redirect, caching and the CSP', async ({ browser, baseURL, request }) => {
  const res = await request.get(PATH);
  expect(res.status()).toBe(200);
  const h = res.headers();
  expect(h['cache-control']).toBe('public, max-age=0, s-maxage=60');
  expect(h['content-security-policy']).toContain("default-src 'self'");
  expect(h['content-security-policy']).toContain("font-src 'self'");
  const bare = await request.get('/about', { maxRedirects: 0 });
  expect([307, 308]).toContain(bare.status());
  expect(new URL(bare.headers()['location'], baseURL).pathname).toBe(PATH);
  const line = readFileSync(resolve(DIST, '_headers'), 'utf8').split('\n').find((l) => /^\s+Content-Security-Policy:/.test(l))!;
  expect(line.length).toBeLessThanOrEqual(1900);

  const ctx = await browser.newContext({ viewport: PHONE });
  await watchCsp(ctx);
  const page = await ctx.newPage();
  await page.goto(new URL(PATH, baseURL).href);
  await page.evaluate(() => document.fonts.ready);
  const attr = (sel: string, a: string) => page.locator(sel).getAttribute(a);
  expect(await attr('link[rel="canonical"]', 'href')).toBe('https://skreed.shop/about/');
  expect(await attr('meta[name="theme-color"]', 'content')).toBe('#F7F6F3');
  const pre = page.locator('link[rel="preload"]');
  await expect(pre).toHaveCount(1);
  expect(await pre.evaluate((l) => [l.getAttribute('as'), l.getAttribute('type'), l.hasAttribute('crossorigin'), l.getAttribute('href')])).toEqual(['font', 'font/woff2', true, FONT]);
  for (const [p, v] of [['og:type', 'website'], ['og:site_name', 'Skreed'], ['og:locale', 'en_IN'], ['og:title', C.title], ['og:description', C.description], ['og:url', 'https://skreed.shop/about/']]) expect(await attr(`meta[property="${p}"]`, 'content'), p).toBe(v);
  expect(await attr('meta[name="twitter:card"]', 'content')).toBe('summary_large_image');
  expect(await attr('meta[property="og:image"]', 'content')).toBe('https://skreed.shop/og/skreed.jpg');
  expect(await page.locator('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]').evaluateAll((ls) => ls.map((l) => `${l.getAttribute('rel')} ${l.getAttribute('href')}`)))
    .toEqual(['icon /favicon.ico', 'icon /icon.svg', 'apple-touch-icon /apple-touch-icon.png', 'manifest /manifest.webmanifest']);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  const fam = JSON.parse((await (await request.get('/shades/frosty-white/')).text()).match(/<script type="application\/ld\+json">([^<]+)<\/script>/)![1]);
  expect(ld['@graph'][0], 'the Organization node, as the family pages build it').toEqual(fam['@graph'][0]);
  expect(ld['@graph'][1]).toEqual({ '@type': 'AboutPage', url: 'https://skreed.shop/about/', name: 'About Skreed', about: { '@id': 'https://skreed.shop/#org' } });
  expect(ld['@graph'][2]).toEqual({ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Skreed', item: 'https://skreed.shop/' },
    { '@type': 'ListItem', position: 2, name: 'About Skreed', item: 'https://skreed.shop/about/' }] });
  expect(ld['@graph']).toHaveLength(3);
  // links: https or same-origin paths only; no storage touched; no CSP violation on load or on the first Tab
  expect(await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(['/']);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  expect(await cspViolations(page)).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie])).toEqual([0, 0, '']);
  await ctx.close();

  const sm = await (await request.get('/sitemap.xml')).text();
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.slice(0, 2)).toEqual(['https://skreed.shop/', 'https://skreed.shop/about/']);
  expect(locs).toHaveLength(12);
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://skreed.shop/sitemap.xml');
});
