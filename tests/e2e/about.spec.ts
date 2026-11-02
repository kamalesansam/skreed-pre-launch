// The About page, /about/ (docs/specs/about.md AC2 and AC4 to AC9, and AC12 since round 2), against a production build
// served by wrangler dev:
//   PUBLIC_HERO_HOOKS=0 PUBLIC_TUNE=0 PUBLIC_STAGING=0 PUBLIC_FAMILY_3D=on npx astro build --outDir dist-about
//   node scripts/csp.mjs --dist dist-about; npx wrangler dev --ip 127.0.0.1 --port <port> --assets dist-about
//   BASE_URL=http://127.0.0.1:<port>/ SKREED_DIST=dist-about npx playwright test tests/e2e/about.spec.ts --project=e2e
// The page ships no script, so every row reads what a visitor's browser has: the network, the DOM, the computed styles
// and, through the DevTools protocol, the platform font each run of text was drawn with. Since round 2 (2026-11-03) the
// page carries the section index, script-free, in its own face (Work Sans Light), and from 1024 px it is one screen in
// three columns (the title and the sign-off, the letter, the quotation mark).
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { watchCsp, cspViolations } from '../harness/csp.ts';
import { ABOUT_COPY as C } from '../../src/config/about.ts';
import { LAUNCH_ISO } from '../../src/config/site.ts';

const PATH = '/about/';
const FONT = '/fonts/inter-400-700-latin.woff2';
/** the section index's face (E-NAV-font): preloaded here as on the landing page */
const NAV_FONT = '/fonts/work-sans-300-latin.woff2';
const DIST = resolve(process.env.SKREED_DIST || 'dist');
const PHONE = { width: 390, height: 844 }, LAPTOP = { width: 1280, height: 800 };
const SLATE = 'rgb(56, 63, 67)', PEARL = 'rgb(247, 246, 243)', EMBER = 'rgb(255, 153, 0)';
const TEXT = 'main h1, main p';
const NAV_WORDS = ['Home', 'Families', 'Quiz', 'Products', 'About'], NAV_HREFS = ['/#top', '/#families', '/#find', '/#room', '/about/'];
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

test.describe('AC2 Inter from the one self-hosted file for the page, Work Sans for the index, no other face, nothing italic', () => {
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
      expect(fonts.map((r) => [new URL(r.url).pathname, r.status]).sort(), 'the page\'s face and the index\'s, each once').toEqual([[FONT, 200], [NAV_FONT, 200]]);
      expect(await page.locator('link[rel="preload"][as="font"]').evaluateAll((ls) => ls.map((l) => (l as HTMLLinkElement).href))).toEqual([new URL(FONT, baseURL).href, new URL(NAV_FONT, baseURL).href]);
      // the faces: Inter and Work Sans loaded, every other face of the site's own set left unloaded
      const faces = await page.evaluate(() => [...document.fonts].map((f) => ({ family: f.family.replace(/^"|"$/g, ''), weight: f.weight, style: f.style, status: f.status })));
      expect(faces.filter((f) => f.family === 'Inter')).toEqual([{ family: 'Inter', weight: '400 700', style: 'normal', status: 'loaded' }]);
      expect(faces.filter((f) => f.family === 'Work Sans')).toEqual([{ family: 'Work Sans', weight: '300', style: 'normal', status: 'loaded' }]);
      const brand = faces.filter((f) => ['Poppins', 'Open Sans', 'Source Serif 4', 'IBM Plex Mono', 'Anton'].includes(f.family));
      expect(brand.length).toBeGreaterThanOrEqual(7);
      for (const f of brand) expect(f.status, `${f.family} ${f.weight}`).toBe('unloaded');
      // the metric-matched fallbacks are local() faces (Arial), fetched from nowhere; the installed Chrome marks them loaded
      // once the swap period has drawn with them, the bundled Chromium leaves them unloaded, so they are not counted here
      expect(faces.filter((f) => f.status !== 'unloaded' && !f.family.endsWith(' Fallback')).map((f) => f.family).sort()).toEqual(['Inter', 'Work Sans']);
      // the face actually drawn, run by run: the DevTools protocol's platform fonts for each element's own text
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const drawn = async (sel: string) => {
        const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: sel });
        expect(nodeIds.length, sel).toBeGreaterThan(0);
        const out: { family: string; custom: boolean }[] = [];
        for (const nodeId of nodeIds) {
          const { fonts: used } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
          expect(used.length, sel).toBeGreaterThan(0);
          out.push(...used.map((u) => ({ family: u.familyName, custom: u.isCustomFont })));
        }
        return out;
      };
      for (const sel of ['h1 span', '.ab-text p', '.ab-text em', '.ab-sign', '.ab-launch', '.ab-launch time', '.ab-quote']) {
        for (const u of await drawn(sel)) expect({ sel, ...u }).toEqual({ sel, family: 'Inter', custom: true });
      }
      // the index's words in Work Sans (the file names its family "Work Sans Light" and "Work Sans"): the bar on a laptop, Menu on a phone
      for (const u of await drawn(vp.width < 768 ? '#siteNav .snav-menu' : '#siteNav .snav-list a')) { expect(u.family, 'the index').toMatch(/^Work Sans\b/); expect(u.custom).toBe(true); }
      // computed: the family, the weights, the sizes and line heights, the title's tracking; nothing italic anywhere
      const cs = await page.evaluate(() => [...document.querySelectorAll('h1, main p, main em, main time')].map((e) => {
        const c = getComputedStyle(e);
        return { tag: e.tagName.toLowerCase(), cls: e.className, family: c.fontFamily, weight: c.fontWeight, size: parseFloat(c.fontSize), lh: parseFloat(c.lineHeight), ls: c.letterSpacing };
      }));
      for (const c of cs) expect(c.family, c.tag).toMatch(/^Inter,/);
      const h1 = cs.find((c) => c.tag === 'h1')!, sign = cs.find((c) => c.cls === 'ab-sign')!, launch = cs.find((c) => c.cls === 'ab-launch')!;
      const letter = cs.filter((c) => c.tag === 'p' && !c.cls);
      expect(letter.length).toBe(5);
      expect([h1.weight, sign.weight, launch.weight, ...letter.map((c) => c.weight), cs.find((c) => c.tag === 'em')!.weight]).toEqual(['700', '700', '400', '400', '400', '400', '400', '400', '600']);
      // E-About-look: the reference's tall title and larger letter; on the laptop layout (round 2) the title is held by its
      // column (11/24 of what the gaps and the mark leave, over 5.85em) and the letter by the screen's height (2.3vh)
      if (vp.width < 1024) {
        expect(Math.abs(h1.size - 44)).toBeLessThanOrEqual(0.1);
        for (const c of [...letter, launch]) expect(Math.abs(c.size - 18)).toBeLessThanOrEqual(0.1);
        expect(Math.abs(sign.size - 20)).toBeLessThanOrEqual(0.1);
      } else {
        const want = await page.evaluate(() => {
          const col = document.querySelector('.ab-col')!.getBoundingClientRect().width, gap = parseFloat(getComputedStyle(document.querySelector('.ab-col')!).columnGap);
          const mark = parseFloat(getComputedStyle(document.querySelector('.ab-quote')!).fontSize);
          return Math.min(88, (col - 2 * gap - 0.492 * mark) * 11 / 24 / 5.85);
        });
        expect(Math.abs(h1.size - want), `the title sized to its column: ${h1.size} against ${want}`).toBeLessThanOrEqual(0.5);
        expect(h1.size).toBeGreaterThanOrEqual(76);   // 77.1 px at 1280 x 800
        for (const c of [...letter, launch]) expect(Math.abs(c.size - Math.max(16, Math.min(24, Math.min(0.016 * vp.width, 0.023 * vp.height))))).toBeLessThanOrEqual(0.1);   // 18.4 px at 1280 x 800
        expect(Math.abs(sign.size - 24)).toBeLessThanOrEqual(0.1);
      }
      for (const c of [...letter, launch]) expect(Math.abs(c.lh - 1.6 * c.size)).toBeLessThanOrEqual(0.1);
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

test.describe('AC5 360 to 1728 px: no horizontal scroll, the gutters, the column or the three columns, the wordmark, one screen from 1280 x 800', () => {
  for (const [w, h] of [[360, 780], [390, 844], [430, 932], [768, 1024], [1024, 768], [844, 390], [1280, 800], [1440, 900], [1728, 990]] as const) {
    test(`${w} x ${h}`, async ({ page }) => {
      await open(page, { width: w, height: h });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      const all = await boxes(page), logo = all[0], text = all.slice(1), i = inset(w);
      for (const b of all) { expect(b.x, `${b.sel} left`).toBeGreaterThanOrEqual(16); expect(w - (b.x + b.w), `${b.sel} right`).toBeGreaterThanOrEqual(16); }
      const col = (await page.locator('.ab-col').boundingBox())!, letterCol = (await page.locator('.ab-text').boundingBox())!;
      expect(Math.abs(col.x - i), 'the column starts at the gutter').toBeLessThanOrEqual(0.5);   // at the left, as the reference sets its text
      expect(w - col.x - col.width, 'the right gutter').toBeGreaterThanOrEqual(i - 0.5);
      expect(letterCol.width, 'the letter at most the measure, 44rem (E-About-look)').toBeLessThanOrEqual(704 + 0.01);
      const [hd, ...ps] = text, sign = ps[5], launch = ps[6], letter = ps.slice(0, 5);
      if (w < 1024) {
        expect(col.width).toBeLessThanOrEqual(704 + 0.01);
        for (const b of text) expect(Math.abs(b.x - col.x), `${b.sel} flush left`).toBeLessThanOrEqual(0.5);
      } else {
        // the laptop layout (round 2): the title and the sign-off in the left column at the gutter, the letter in the second, flush left in its own column
        for (const b of [hd, sign, launch]) expect(Math.abs(b.x - col.x), `${b.sel} at the gutter`).toBeLessThanOrEqual(0.5);
        for (const b of letter) expect(Math.abs(b.x - letterCol.x), `${b.sel} flush left in the letter's column`).toBeLessThanOrEqual(0.5);
        expect(letterCol.x, 'the letter beside the title').toBeGreaterThanOrEqual(hd.x + hd.w + 47);
        expect(Math.abs(letter[0].y - hd.y), 'the letter starts on the title\'s row').toBeLessThanOrEqual(0.5);
        expect(Math.abs(launch.y + launch.h - (letter[4].y + letter[4].h)), 'the date line ends level with the letter').toBeLessThanOrEqual(1);
        if (w >= 1280) expect(await page.evaluate(() => document.scrollingElement!.scrollHeight - innerHeight), 'one screen').toBeLessThanOrEqual(0);
      }
      const h1 = await page.locator('main h1').evaluate((e) => e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight));
      expect(Math.abs(h1 - 3), 'the h1 is three lines, as the reference breaks it').toBeLessThanOrEqual(0.1);
      // the quotation mark: at the top right, clear of the title's text and of the letter, never past the right gutter
      const quote = (await page.locator('.ab-quote').boundingBox())!, h1Box = (await page.locator('main h1').boundingBox())!;
      expect(w - (quote.x + quote.width), 'the quotation mark inside the right gutter').toBeGreaterThanOrEqual(i - 1);
      const words = await page.locator('main h1 span').evaluateAll((es) => es.map((e) => e.getBoundingClientRect().right));
      expect(Math.max(...words), 'the title clear of the quotation mark').toBeLessThan(quote.x);
      if (w >= 1024) expect(letterCol.x + letterCol.width, 'the letter clear of the quotation mark').toBeLessThanOrEqual(quote.x - 31);
      expect(quote.y, 'the quotation mark on the title\'s row').toBeLessThan(h1Box.y + h1Box.height);
      expect(Math.abs(logo.w - (w >= 1024 ? 136 : 96))).toBeLessThanOrEqual(0.5);
      expect(Math.abs(logo.x - i)).toBeLessThanOrEqual(0.5); expect(Math.abs(logo.y - i)).toBeLessThanOrEqual(0.5);
      for (const b of text) expect(meets(logo, b), `the wordmark meets ${b.sel}`).toBe(false);
      // the index on the wordmark's row: Menu on a phone, the five words from 768 px, nothing of it over the text
      const nav = await page.locator(w < 768 ? '#siteNav .snav-menu' : '#siteNav .snav-list').boundingBox();
      expect(nav, 'the index').toBeTruthy();
      expect(Math.abs(nav!.y + nav!.height / 2 - (logo.y + logo.h / 2)), 'on the wordmark\'s row').toBeLessThanOrEqual(1.5);
      for (const b of text) expect(meets({ sel: 'nav', x: nav!.x, y: nav!.y, w: nav!.width, h: nav!.height }, b), `the index meets ${b.sel}`).toBe(false);
      const near = (got: number, want: number, what: string) => expect(Math.abs(got - want), `${what}: ${got}`).toBeLessThanOrEqual(1);
      if (w === 390) {
        near(hd.y - (logo.y + logo.h), 48, 'wordmark foot to h1');
        near(letter[0].y - (hd.y + hd.h), 32, 'h1 to the first paragraph');
        for (let k = 1; k < 5; k++) near(letter[k].y - (letter[k - 1].y + letter[k - 1].h), 24, `paragraph ${k} to ${k + 1}`);
        near(sign.y - (letter[4].y + letter[4].h), 48, 'the fifth paragraph to the sign-off');
      }
      if (w === 1280) {
        expect(hd.y - (logo.y + logo.h), 'at least 48 px under the wordmark (the block is centred in the screen\'s height)').toBeGreaterThanOrEqual(47);
        for (let k = 1; k < 5; k++) near(letter[k].y - (letter[k - 1].y + letter[k - 1].h), 24, `paragraph ${k} to ${k + 1}`);
        expect(sign.y - (hd.y + hd.h), 'the sign-off below the title, at its column\'s foot').toBeGreaterThanOrEqual(47);
      }
      if (w === 390 || w === 1280) {
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
  // the tree as Chromium exposes it: the banner holds the wordmark and the index (its bar is display: none on a phone, so
  // only Menu is in the tree, and the closed drawer is not); the em as emphasis and the time as time inside their
  // paragraphs (the snapshot trims the text runs and reads the no-break space as a space)
  const q = (s: string) => JSON.stringify(s.replace(/ /g, ' ').trim());
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - banner:
      - link "Skreed, home":
        - /url: /
      - navigation "Sections":
        - button "Menu"
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
  // the first Tab: the wordmark, with the two-tone ring; the second, Menu (the index follows the wordmark in the tab order)
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const a = document.activeElement as HTMLElement, c = getComputedStyle(a), b = getComputedStyle(a, '::before'), h = getComputedStyle(a, '::after');
    return { cls: a.className, outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`, offset: c.outlineOffset,
      before: `${b.borderTopStyle} ${b.borderTopWidth} ${b.borderTopColor}`, beforeInset: [b.top, b.right, b.bottom, b.left], after: [h.top, h.right, h.bottom, h.left] };
  });
  expect(ring).toEqual({ cls: 'site-logo', outline: `solid 2px ${EMBER}`, offset: '6px', before: `solid 2px ${SLATE}`, beforeInset: ['-4px', '-4px', '-4px', '-4px'], after: ['-11px', '-8px', '-11px', '-8px'] });
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => (document.activeElement as HTMLElement).className)).toBe('snav-a snav-menu');
  // the hit box: the link answers at its ::after's corners, at least 44 x 44 px
  const r = (await page.locator('a.site-logo').boundingBox())!;
  expect(r.width + 16).toBeGreaterThanOrEqual(44); expect(r.height + 22).toBeGreaterThanOrEqual(44);
  for (const [x, y] of [[r.x - 7.5, r.y - 10.5], [r.x + r.width + 7.5, r.y + r.height + 10.5]]) {
    expect(await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest('a')?.className ?? null, [x, y])).toBe('site-logo');
  }
  // contrast: every text element, the wordmark and the index against the page's ground, from the computed values
  const colours = await page.evaluate(() => ({ ground: [getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor],
    fg: [...document.querySelectorAll('a.site-logo, main h1, main p, main em, main time')].map((e) => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]),
    nav: [...document.querySelectorAll('#siteNav .snav-a')].map((e) => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]) }));
  expect(colours.ground).toEqual([PEARL, PEARL]);
  // the wordmark and the title in Urban Slate (9.9:1); the letter, its emphasis, the sign-off and the date in Coffee (E-About-look; 5.9:1, over AA's 4.5)
  const COFFEE = 'rgb(122, 88, 63)';
  for (const [fg, bg] of colours.fg) { expect([SLATE, COFFEE]).toContain(fg); expect(bg).toBe('rgba(0, 0, 0, 0)'); expect(contrast(fg, PEARL)).toBeGreaterThanOrEqual(fg === SLATE ? 9.9 : 5.8); }
  expect(colours.fg.slice(0, 2).map(([fg]) => fg)).toEqual([SLATE, SLATE]);
  expect(colours.fg.slice(2).map(([fg]) => fg).every((fg) => fg === COFFEE)).toBe(true);
  for (const [fg, bg] of colours.nav) { expect(fg, 'the index in Urban Slate on the page').toBe(SLATE); expect(bg).toBe('rgba(0, 0, 0, 0)'); }
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
  // the first view's bytes as transferred: the document and every resource it fetched (the two fonts since round 2)
  const transferred = await page.evaluate(() => [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].reduce((a, e) => a + (e as PerformanceResourceTiming).transferSize, 0));
  expect(transferred).toBeGreaterThan(0); expect(transferred).toBeLessThanOrEqual(80_000);   // 61,286 bytes on 2026-11-03: the page, Inter and Work Sans
  const sel = ['a.site-logo', 'main', 'main h1', ...Array.from({ length: 7 }, (_, i) => `main p >> nth=${i}`), '#siteNav .snav-menu'];
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
  expect(html.length, 'dist/about/index.html raw').toBeLessThanOrEqual(36_000);   // 33,905 on 2026-11-03, the index's markup and rules inlined since round 2 (30,000 before)
  expect(gzipSync(html, { level: 9 }).length, 'gzip').toBeLessThanOrEqual(10_000);   // 9,748
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
  expect(await attr('link[rel="canonical"]', 'href')).toBe('https://skreed.in/about/');
  expect(await attr('meta[name="theme-color"]', 'content')).toBe('#F7F6F3');
  const pre = page.locator('link[rel="preload"]');
  await expect(pre).toHaveCount(2);
  expect(await pre.evaluateAll((ls) => ls.map((l) => [l.getAttribute('as'), l.getAttribute('type'), l.hasAttribute('crossorigin'), l.getAttribute('href')]))).toEqual([['font', 'font/woff2', true, FONT], ['font', 'font/woff2', true, NAV_FONT]]);
  for (const [p, v] of [['og:type', 'website'], ['og:site_name', 'Skreed'], ['og:locale', 'en_IN'], ['og:title', C.title], ['og:description', C.description], ['og:url', 'https://skreed.in/about/']]) expect(await attr(`meta[property="${p}"]`, 'content'), p).toBe(v);
  expect(await attr('meta[name="twitter:card"]', 'content')).toBe('summary');
  expect(await page.locator('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]').evaluateAll((ls) => ls.map((l) => `${l.getAttribute('rel')} ${l.getAttribute('href')}`)))
    .toEqual(['icon /favicon.ico', 'icon /icon.svg', 'apple-touch-icon /apple-touch-icon.png', 'manifest /manifest.webmanifest']);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  const fam = JSON.parse((await (await request.get('/shades/frosty-white/')).text()).match(/<script type="application\/ld\+json">([^<]+)<\/script>/)![1]);
  expect(ld['@graph'][0], 'the Organization node, as the family pages build it').toEqual(fam['@graph'][0]);
  expect(ld['@graph'][1]).toEqual({ '@type': 'AboutPage', url: 'https://skreed.in/about/', name: 'About Skreed', about: { '@id': 'https://skreed.in/#org' } });
  expect(ld['@graph'][2]).toEqual({ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Skreed', item: 'https://skreed.in/' },
    { '@type': 'ListItem', position: 2, name: 'About Skreed', item: 'https://skreed.in/about/' }] });
  expect(ld['@graph']).toHaveLength(3);
  // links: same-origin paths only (the wordmark, then the index's words in the bar and in the drawer); no storage touched; no CSP violation on load or on the first Tab
  expect(await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(['/', ...NAV_HREFS, ...NAV_HREFS]);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  expect(await cspViolations(page)).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie])).toEqual([0, 0, '']);
  await ctx.close();

  const sm = await (await request.get('/sitemap.xml')).text();
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.slice(0, 2)).toEqual(['https://skreed.in/', 'https://skreed.in/about/']);
  expect(locs).toHaveLength(12);
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://skreed.in/sitemap.xml');
});

test.describe('AC12 the index on the page (round 2, 2026-11-03): About current, the words plain links into the landing page, Work Sans Light capitals, script-free', () => {
  test('the laptop: the five words on the wordmark\'s row in Urban Slate, About underlined and current, the bar absolute; Quiz leaves for the landing page\'s quiz', async ({ page, baseURL }) => {
    await open(page, LAPTOP);
    const g = await page.evaluate(() => {
      const nav = document.getElementById('siteNav')!, logo = document.querySelector('a.site-logo')!.getBoundingClientRect();
      const words = [...nav.querySelectorAll<HTMLAnchorElement>('.snav-list a')].map((a) => { const b = a.getBoundingClientRect(), c = getComputedStyle(a); return { t: a.textContent, href: a.getAttribute('href'), sec: a.dataset.sec ?? null, cur: a.getAttribute('aria-current'), y: b.y + b.height / 2, r: b.right, h: b.height, w: b.width, family: c.fontFamily.split(',')[0], weight: c.fontWeight, size: c.fontSize, transform: c.textTransform, color: c.color, line: c.textDecorationLine }; });
      const n = getComputedStyle(nav);
      return { words, logoY: logo.y + logo.height / 2, position: n.position, tone: nav.dataset.tone, inset: parseFloat(getComputedStyle(document.querySelector('a.site-logo')!).left), vw: innerWidth, menuShown: nav.querySelector('.snav-menu')!.getClientRects().length > 0 };
    });
    expect(g.words.map((w) => [w.t, w.href, w.sec, w.cur])).toEqual(NAV_WORDS.map((t, k) => [t, NAV_HREFS[k], null, t === 'About' ? 'page' : null]));
    expect(g.position).toBe('absolute'); expect(g.tone).toBe('light'); expect(g.menuShown).toBe(false);
    expect(Math.abs(g.words[4].r - (g.vw - g.inset + 12))).toBeLessThan(1);   // the last word's text ends on --inset, its hit padded past it
    for (const w of g.words) {
      expect(Math.abs(w.y - g.logoY)).toBeLessThan(1.5);
      expect(w.h).toBeGreaterThanOrEqual(44); expect(w.w).toBeGreaterThanOrEqual(44);
      expect([w.family, w.weight, w.size, w.transform, w.color]).toEqual(['"Work Sans"', '300', '14px', 'uppercase', SLATE]);
      expect(w.line, w.t!).toBe(w.t === 'About' ? 'underline' : 'none');
    }
    await page.locator('#siteNav .snav-list a', { hasText: 'Quiz' }).click();
    await expect(page).toHaveURL(/\/#find$/);
    await expect(page.locator('section#find')).toBeAttached();
  });

  test('the phone: Menu on the wordmark\'s row opens the drawer with no script; About current in its rows; a tap beside the panel, Escape and Close each shut it', async ({ browser, baseURL }) => {
    for (const javaScriptEnabled of [true, false]) {
      const ctx = await browser.newContext({ viewport: PHONE, javaScriptEnabled });
      const page = await ctx.newPage();
      await page.goto(new URL(PATH, baseURL).href, { waitUntil: 'load' });
      await page.waitForTimeout(400);
      const menu = page.locator('#siteNav .snav-menu'), drawer = page.locator('#site-sections'), panel = drawer.locator('.snav-in');
      await expect(menu).toBeVisible();
      await expect(page.locator('#siteNav .snav-list')).toBeHidden();
      expect(await menu.evaluate((e) => { const c = getComputedStyle(e); return [c.fontFamily.split(',')[0], c.fontWeight, c.textTransform, c.color]; })).toEqual(['"Work Sans"', '300', 'uppercase', SLATE]);
      await expect(drawer).toBeHidden();
      /** the panel at rest: its slide over (a press inside it waits for this, as site-nav.spec.ts's drawer row does) */
      const slidIn = () => expect.poll(() => panel.evaluate((el) => getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
      await menu.click();
      await expect(drawer).toBeVisible();
      await slidIn();
      const box = (await panel.boundingBox())!;
      expect(Math.abs(box.x + box.width - PHONE.width)).toBeLessThan(1); expect(Math.abs(box.width - 0.75 * PHONE.width)).toBeLessThan(1);
      await expect(drawer.locator('.snav-rows a:visible')).toHaveText(NAV_WORDS);
      expect(await drawer.locator('.snav-rows a').evaluateAll((as) => as.map((a) => [a.getAttribute('href'), a.getAttribute('aria-current'), a.hasAttribute('data-sec')]))).toEqual(NAV_HREFS.map((h) => [h, h === '/about/' ? 'page' : null, false]));
      expect(await drawer.locator('.snav-rows a[aria-current] span').evaluate((e) => getComputedStyle(e).textDecorationLine)).toBe('underline');
      // the strip beside the panel: a button that hides the popover, with or without a script, and nothing under it is pressed
      await page.mouse.click(40, 400);
      await expect(drawer).toBeHidden();
      await expect(page).toHaveURL(/\/about\/$/);
      await menu.click(); await expect(drawer).toBeVisible();
      await page.keyboard.press('Escape'); await expect(drawer).toBeHidden();
      await menu.click(); await expect(drawer).toBeVisible(); await slidIn();
      await drawer.locator('.snav-close').click(); await expect(drawer).toBeHidden();
      // a row leaves for the landing page
      await menu.click(); await expect(drawer).toBeVisible(); await slidIn();
      await drawer.locator('.snav-rows a', { hasText: 'Families' }).click();
      await expect(page).toHaveURL(/\/#families$/);
      await ctx.close();
    }
  });
});
