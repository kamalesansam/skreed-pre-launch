// Family pages in swatch grid mode (docs/specs/family-page.md 7, run 1: acceptance 1, 2 (links), 6, 9 (grid rows), 10).
import { test, expect, type Page } from '@playwright/test';
import { FAMILIES, NAMES, PHONE, WIDE, watch, cspViolations, events, shade, islandRequests } from './util.ts';

const url = (slug: string, q = '') => `/shades/${slug}/${q}`;

test.describe('1. routes, titles and links', () => {
  test('the ten pages: own title and description, links home, to the Wall, to the neighbours and every family', async ({ page, request }) => {
    for (const [i, slug] of FAMILIES.entries()) {
      const res = await page.goto(url(slug));
      expect(res!.status()).toBe(200);
      await expect(page).toHaveTitle(`${NAMES[i]}, all 24 shades. Skreed`);
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc).toMatch(new RegExp(`^All 24 ${NAMES[i]} shades, from .+ to .+, on a Skreed case in matte or gloss\\. Doors open Nov 1\\.$`));
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://skreed.in/shades/${slug}/`);
      await expect(page.locator('a.fh-logo')).toHaveAttribute('href', '/');
      await expect(page.locator('.famnav .fn-all')).toHaveAttribute('href', `/?family=${slug}#wall`);
      const sw = await page.locator('#family-switcher a[href^="/shades/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(sw).toEqual(FAMILIES.map((f) => `/shades/${f}/`));
      await expect(page.locator(`#family-switcher a[aria-current="page"]`)).toHaveAttribute('href', `/shades/${slug}/`);
      const prev = page.locator('.famnav a.fn-prev'), next = page.locator('.famnav a.fn-next');
      if (i > 0) await expect(prev).toHaveAttribute('href', `/shades/${FAMILIES[i - 1]}/`); else await expect(prev).toHaveCount(0);
      if (i < 9) await expect(next).toHaveAttribute('href', `/shades/${FAMILIES[i + 1]}/`); else await expect(next).toHaveCount(0);
    }
    const nf = await request.get('/shades/blue/');
    expect(nf.status()).toBe(404);
    expect(await nf.text()).toContain('<h1 class="h404">404. This shade does not exist.</h1>');   // the site 404, not an empty body
  });

  test('the sitemap lists the landing and the ten pages; robots.txt names it; the favicon set and the OG and JSON-LD facts ship', async ({ request }) => {
    const sm = await (await request.get('/sitemap.xml')).text();
    const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(['https://skreed.in/', ...FAMILIES.map((f) => `https://skreed.in/shades/${f}/`)]);
    expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://skreed.in/sitemap.xml');
    for (const f of ['/favicon.ico', '/icon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest']) expect((await request.get(f)).status(), f).toBe(200);
    const html = await (await request.get(url('go-green'))).text();
    expect(html).toContain('<meta property="og:title" content="Go Green, all 24 shades. Skreed">');
    expect(html).toContain('<meta property="og:url" content="https://skreed.in/shades/go-green/">');
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)![1]);
    expect(ld['@graph'][0]).toMatchObject({ '@type': 'Organization', email: 'collab@skreed.in', sameAs: ['https://www.instagram.com/skreedofficial/'] });
    expect(ld['@graph'][1].itemListElement[1]).toMatchObject({ name: 'Go Green', item: 'https://skreed.in/shades/go-green/' });
  });

  test('the switcher opens with JavaScript off (popover), lists the ten families and closes', async ({ browser }) => {
    const ctx = await browser.newContext({ ...PHONE, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(url('playful-pinks'));
    await expect(page.locator('#family-switcher')).toBeHidden();
    await page.getByRole('button', { name: 'Families' }).click();
    await expect(page.locator('#family-switcher')).toBeVisible();
    await expect(page.locator('#family-switcher .sw-list a')).toHaveCount(10);
    await page.locator('#family-switcher').getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#family-switcher')).toBeHidden();
    // JS off: the key shade's page is complete static HTML with a working reserve link
    await expect(page.locator('#hudName')).toHaveText('Rouge');
    await expect(page.locator('#reserve')).toHaveAttribute('href', '/?shade=062&finish=matte#reserve');
    await ctx.close();
  });

  test('switcher focus: the current family on open, back to "Families" on Escape', async ({ browser }) => {
    const ctx = await browser.newContext(WIDE);
    const page = await ctx.newPage();
    await page.goto(url('go-green'));
    await page.locator('#famBtn').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#family-switcher')).toBeVisible();
    await expect(page.locator('#family-switcher a[aria-current="page"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#family-switcher')).toBeHidden();
    await expect(page.locator('#famBtn')).toBeFocused();
    await ctx.close();
  });
});

test.describe('6. HUD, type and colour rules', () => {
  for (const [label, opts, size] of [['390', PHONE, 28], ['1280', WIDE, 36]] as const) {
    test(`type and placement at ${label}`, async ({ browser }) => {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      await page.goto(url('blissful-blues'));
      await page.evaluate(() => document.fonts.ready);
      const m = await page.evaluate(() => {
        const cs = (s: string) => getComputedStyle(document.querySelector(s)!);
        const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const name = document.querySelector('#hudName > span')!.getBoundingClientRect(), stage = box('#stage');
        const all = [...document.querySelectorAll<HTMLElement>('body *')].filter((e) => e.offsetParent !== null && (e.textContent ?? '').trim() && e.children.length === 0);
        return {
          name: { f: cs('.hud-name').fontFamily, w: cs('.hud-name').fontWeight, s: parseFloat(cs('.hud-name').fontSize), dx: Math.abs(name.left + name.width / 2 - (stage.left + stage.width / 2)) },
          family: { f: cs('.hud-meta .family').fontFamily, w: cs('.hud-meta .family').fontWeight },
          counter: { f: cs('#hudNum').fontFamily, w: cs('#hudNum').fontWeight, n: cs('#hudNum').fontVariantNumeric },
          bar: { f: cs('#barName').fontFamily, w: cs('#barName').fontWeight, s: parseFloat(cs('#barName').fontSize) },
          smallPoppins: all.filter((e) => getComputedStyle(e).fontFamily.startsWith('Poppins') && parseFloat(getComputedStyle(e).fontSize) < 24).map((e) => e.textContent),
          under12: all.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => e.textContent),
          italic: all.filter((e) => getComputedStyle(e).fontStyle !== 'normal').length,
          digitsInHeadings: [...document.querySelectorAll('h1, h2')].filter((h) => /\d/.test(h.textContent ?? '')).length,
          faces: [...new Set(all.map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '').trim()))],
        };
      });
      expect(m.name.f).toMatch(/^"?Poppins/);
      expect(m.name.w).toBe('700');
      expect(m.name.s).toBeCloseTo(size, 0);
      expect(m.name.dx).toBeLessThanOrEqual(8);
      expect(m.family.f).toMatch(/^"?Open Sans/);
      expect(m.family.w).toBe('400');
      expect(m.counter.f).toMatch(/^"?Open Sans/);
      expect(m.counter.w).toBe('600');
      expect(m.counter.n).toContain('tabular-nums');
      if (label === '390') { expect(m.bar.f).toMatch(/^"?Open Sans/); expect(m.bar.w).toBe('600'); expect(m.bar.s).toBe(14); }
      expect(m.smallPoppins).toEqual([]);
      expect(m.under12).toEqual([]);
      expect(m.italic).toBe(0);
      expect(m.digitsInHeadings).toBe(0);
      expect(m.faces.sort()).toEqual(['Open Sans', 'Poppins']);
      await ctx.close();
    });
  }

  test('the built HTML has no style attribute and no hex in markup; Reserve carries shade and finish', async ({ page, request }) => {
    for (const slug of FAMILIES) {
      const html = await (await request.get(url(slug))).text();
      const markup = html.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<meta name="theme-color"[^>]*>/, '');
      expect(markup).not.toMatch(/\sstyle=/);
      expect(markup).not.toMatch(/#[0-9a-fA-F]{6}\b(?!reserve)/);
      expect(html).not.toMatch(/standin/i);
    }
    await page.goto(url('blissful-blues'));
    await expect(page.locator('#reserve')).toHaveAttribute('href', '/?shade=032&finish=matte#reserve');
    await expect(page.locator('#reserve')).toHaveAccessibleName('Reserve my shade, Sky');
    await page.locator('#next').click();
    await page.getByRole('button', { name: 'Gloss' }).click();
    await expect(page.locator('#reserve')).toHaveAttribute('href', '/?shade=033&finish=gloss#reserve');
    await expect(page.locator('#reserve')).toHaveAccessibleName('Reserve my shade, Ocean');
  });

  test('a deep link never shows the key shade: skeletons until the module writes the text', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    // first paint without the module: the HUD is a skeleton, never "Sky" in ink
    await page.route(/\/_astro\/.*\.js$/, (r) => r.abort());
    await page.goto(url('blissful-blues', '?shade=025'));
    const skel = await page.evaluate(() => ({
      deeplink: document.documentElement.hasAttribute('data-deeplink'),
      shade: document.documentElement.dataset.shade,
      color: getComputedStyle(document.querySelector('#hudName > span')!).color,
      bar: getComputedStyle(document.querySelector('#barName > span')!).color,
      ring: getComputedStyle(document.querySelector('.gsw[data-s="025"] .dot')!, '::after').borderTopColor,
      keyRing: getComputedStyle(document.querySelector('.gsw[data-s="032"] .dot')!, '::after').borderTopColor,
    }));
    expect(skel.deeplink).toBe(true);
    expect(skel.shade).toBe('025');
    expect(skel.color).toBe('rgba(0, 0, 0, 0)');
    expect(skel.bar).toBe('rgba(0, 0, 0, 0)');
    expect(skel.ring).toBe('rgb(56, 63, 67)');        // the deep-linked swatch carries the selected ring at first paint
    expect(skel.keyRing).toBe('rgba(0, 0, 0, 0)');
    await page.unroute(/\/_astro\/.*\.js$/);
    await page.goto(url('blissful-blues', '?shade=025'));
    await expect(page.locator('#hudName')).toHaveText('Electric');
    await expect(page.locator('#hudNum')).toHaveText('025 / 240');
    await expect(page.locator('html')).not.toHaveAttribute('data-deeplink', '');
    await ctx.close();
  });
});

async function next3(page: Page) {
  for (let k = 0; k < 3; k++) { await page.locator('#next').click(); await page.waitForTimeout(150); }
}

test.describe('5. selection in grid mode (DOM inputs)', () => {
  test('Next three times moves exactly three; one swap per move; the URL follows with replaceState', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    await watch(ctx);
    const page = await ctx.newPage();
    await page.goto(url('blissful-blues'));
    const len = await page.evaluate(() => history.length);
    await next3(page);
    expect(await shade(page)).toBe('035');
    await expect(page.locator('#hudName')).toHaveText('Cobalt');
    await expect(page.locator('#hudNum')).toHaveText('035 / 240');
    await expect(page).toHaveURL(/\?shade=035$/);
    expect(await page.evaluate(() => history.length)).toBe(len);
    await page.waitForTimeout(700);
    const sel = (await events(page)).filter((e) => e.event === 'shade_selected');
    expect(sel.at(-1)!.props).toEqual({ shade_id: '035', family: 'blissful-blues', input: 'prev_next', finish: 'matte' });
    await ctx.close();
  });

  test('Prev is disabled at 01 and Next at 24; nothing wraps', async ({ page }) => {
    await page.goto(url('roaring-reds', '?shade=217'));
    await expect(page.locator('#prev')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#prev').click({ force: true });   // aria-disabled stays focusable and clickable; the click is a no-op
    expect(await shade(page)).toBe('217');
    await page.goto(url('roaring-reds', '?shade=240'));
    await expect(page.locator('#next')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#next').click({ force: true });
    expect(await shade(page)).toBe('240');
  });

  test('scrubber: tap a swatch jumps there; dragging scrubs; the marker follows', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await page.goto(url('go-green'));
    const r = (await page.locator('#scrub').boundingBox())!;
    const x = (i: number) => r.x + (i + 0.5) * (r.width / 24);
    await page.mouse.click(x(2), r.y + r.height / 2);
    expect(await shade(page)).toBe('195');
    await page.mouse.move(x(2), r.y + 22);
    await page.mouse.down();
    await page.mouse.move(x(10), r.y + 22, { steps: 8 });
    await page.mouse.move(x(20), r.y + 22, { steps: 8 });
    await page.mouse.up();
    expect(await shade(page)).toBe('213');
    const name20 = await page.evaluate(() => JSON.parse(document.getElementById('fam-data')!.textContent!).names[20] as string);
    await expect(page.locator('#hudName')).toHaveText(name20);
    await page.waitForTimeout(500);
    const mark = await page.evaluate(() => { const m = document.querySelector('#scrub .mark')!.getBoundingClientRect(); const s = document.querySelector('#scrub')!.getBoundingClientRect(); return (m.left - s.left) / (s.width / 24) - 0.5; });
    expect(Math.round(mark)).toBe(20);
    await ctx.close();
  });

  test('grid: tap selects; arrows move one, up and down move a row; the page does not scroll', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await page.goto(url('stormy-greys'));
    await page.waitForFunction(() => !document.documentElement.classList.contains('m3d'), null, { timeout: 30_000 });
    // a 3D build has a second copy of the grid under "The whole family."; CSS shows one per mode, so work on the shown one
    await page.locator('.gsw[data-i="0"]:visible').click();
    expect(await shade(page)).toBe('169');
    await expect(page.locator('.gsw[data-i="0"]:visible')).toHaveAttribute('aria-checked', 'true');
    await page.locator('.gsw[data-i="0"]:visible').focus();
    const y0 = await page.evaluate(() => scrollY);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    expect(await shade(page)).toBe('176');
    await expect(page.locator('.gsw[data-i="7"]:visible')).toBeFocused();
    await page.keyboard.press('End');
    expect(await shade(page)).toBe('192');
    expect(await page.evaluate(() => scrollY)).toBe(y0);
    expect(await page.locator('.sgrid:visible .gsw[tabindex="0"]').count()).toBe(1);
    await ctx.close();
  });

  test('finish: Matte and Gloss are a pressed pair; the choice lives in the URL', async ({ page }) => {
    await page.goto(url('mellow-yellows'));
    await page.getByRole('button', { name: 'Gloss' }).click();
    await expect(page.getByRole('button', { name: 'Gloss' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Matte' })).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(/finish=gloss/);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Gloss' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#reserve')).toHaveAttribute('href', /finish=gloss#reserve$/);
  });
});

test.describe('C3. the sticky-bar swatch', () => {
  test('cross-fades by opacity only: the new shade at once, a copy of the old fading out on top; none under reduced motion', async ({ browser }) => {
    for (const reduced of [false, true]) {
      const ctx = await browser.newContext({ ...PHONE, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      const page = await ctx.newPage();
      await page.goto(url('blissful-blues'));
      await page.locator('#next').click();
      const m = await page.evaluate(() => {
        const sw = document.querySelector('.bar-sw')!;
        const kids = [...sw.querySelectorAll('i')].map((i) => (i as HTMLElement).dataset.s);
        const props = sw.getAnimations({ subtree: true }).flatMap((a) => (a.effect as KeyframeEffect).getKeyframes().flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))));
        return { kids, props: [...new Set(props)], bg: getComputedStyle(sw).backgroundColor, dur: getComputedStyle(sw).transitionDuration };
      });
      expect(m.bg).toBe('rgb(20, 148, 228)');          // Ocean (#1494e4), the new shade, at once
      expect(m.dur).toBe('0s');                        // no transition on the swatch, so no colour animates
      if (reduced) { expect(m.kids).toEqual([]); expect(m.props).toEqual([]); }
      else { expect(m.kids).toEqual(['032']); expect(m.props).toEqual(['opacity']); }
      await page.waitForTimeout(800);
      expect(await page.evaluate(() => document.querySelectorAll('.bar-sw i').length)).toBe(0);
      await ctx.close();
    }
  });
});

test.describe('9. states in grid mode', () => {
  test('?shade=999: the key shade, the URL cleaned', async ({ page }) => {
    await page.goto(url('blissful-blues', '?shade=999'));
    expect(await shade(page)).toBe('032');
    await expect(page).toHaveURL(/\/shades\/blissful-blues\/$/);
    await expect(page.locator('#hudName')).toHaveText('Sky');
  });

  test('?shade=032 on the Vivid Violets page lands on Blissful Blues with Sky', async ({ page }) => {
    await page.goto(url('vivid-violets', '?shade=032'));
    await page.waitForURL(/\/shades\/blissful-blues\/\?shade=032$/);
    await expect(page.locator('h1')).toHaveText('Blissful Blues');
    await expect(page.locator('#hudName')).toHaveText('Sky');
  });

  test('reduced motion, data saver and no WebGL2: swatch grid mode, no message, no island request', async ({ browser }) => {
    for (const [name, opts, init] of [
      ['reduced motion', { reducedMotion: 'reduce' as const }, null],
      ['data saver', {}, () => Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } })],
      ['no WebGL2', {}, () => { delete (window as unknown as Record<string, unknown>).WebGL2RenderingContext; }],
    ] as const) {
      const ctx = await browser.newContext({ ...PHONE, ...opts });
      await watch(ctx);
      if (init) await ctx.addInitScript(init);
      const page = await ctx.newPage();
      const requests: string[] = [];
      page.on('request', (r) => requests.push(new URL(r.url()).pathname));
      await page.goto(url('earthy-browns'));
      await page.waitForTimeout(800);
      await expect(page.locator('html')).toHaveClass(/\bgrid\b/);
      await expect(page.locator('#stage .sgrid')).toBeVisible();
      if (!(await page.evaluate(() => JSON.parse(document.getElementById('fam-data')!.textContent!).has3d))) await expect(page.locator('#state')).toBeEmpty();
      expect(islandRequests(requests), name).toEqual([]);
      expect(await cspViolations(page)).toEqual([]);
      await ctx.close();
    }
  });

  test('zero CSP violations with the header present, phone and laptop, every family', async ({ browser }) => {
    for (const opts of [PHONE, WIDE]) {
      const ctx = await browser.newContext(opts);
      await watch(ctx);
      const page = await ctx.newPage();
      for (const slug of FAMILIES) {
        const res = await page.goto(url(slug));
        expect(res!.headers()['content-security-policy']).toContain("default-src 'self'");
        await page.locator('#next').click();
        await page.getByRole('button', { name: 'Gloss' }).click();
        expect(await cspViolations(page), slug).toEqual([]);
      }
      await ctx.close();
    }
  });
});

test.describe('10. accessibility and layout', () => {
  test('the scrubber is a slider with the spec keys and value text', async ({ page }) => {
    await page.goto(url('blissful-blues'));
    const s = page.getByRole('slider', { name: 'Shade' });
    await expect(s).toHaveAttribute('aria-valuemin', '1');
    await expect(s).toHaveAttribute('aria-valuemax', '24');
    await expect(s).toHaveAttribute('aria-valuenow', '8');
    await expect(s).toHaveAttribute('aria-valuetext', 'Sky, 8 of 24');
    await s.focus();
    for (const [key, want] of [['ArrowRight', 9], ['ArrowLeft', 8], ['PageUp', 14], ['PageDown', 8], ['End', 24], ['Home', 1], ['ArrowUp', 2], ['ArrowDown', 1]] as const) {
      await page.keyboard.press(key);
      await expect(s).toHaveAttribute('aria-valuenow', String(want));
    }
    await expect(s).toHaveAttribute('aria-valuetext', 'Electric, 1 of 24');
  });

  test('the live region speaks once for Prev and Next, and stays quiet for the focused slider', async ({ page }) => {
    await page.goto(url('blissful-blues'));
    await page.locator('#next').click();
    await expect(page.locator('#live')).toHaveText('Ocean. Blissful Blues. Shade 33 of 240.');
    await page.getByRole('slider', { name: 'Shade' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    await expect(page.locator('#live')).toHaveText('Ocean. Blissful Blues. Shade 33 of 240.');
  });

  test('focus is visible on both neutrals (Ember Luxe outline)', async ({ page }) => {
    for (const slug of ['frosty-whites', 'blissful-blues']) {
      await page.goto(url(slug));
      await page.keyboard.press('Tab');
      const o = await page.evaluate(() => { const a = document.activeElement!; const cs = getComputedStyle(a); return [a.className, cs.outlineStyle, cs.outlineColor, cs.outlineWidth]; });
      expect(o[1]).toBe('solid');
      expect(o[2]).toBe('rgb(255, 153, 0)');
      expect(o[3]).toBe('2px');
    }
  });

  for (const [w, h] of [[360, 780], [390, 844], [430, 932], [844, 390], [375, 667], [768, 1024], [1024, 768], [1366, 768], [1920, 1080]] as const) {
    test(`no horizontal scroll, 44 px targets, nothing under the sticky bar at ${w} x ${h}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 900, hasTouch: w < 1100 });
      const page = await ctx.newPage();
      await page.goto(url('vivid-violets'));
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(() => {
        const box = (e: Element) => e.getBoundingClientRect();
        // shown controls only: a 3D build's second grid copy is display: none in the mode that does not use it
        const targets = ['#prev', '#next', '#scrub', '#finish button', '.gsw', '#reserve', '#famBtn', '.fh-logo'].flatMap((s) => [...document.querySelectorAll(s)]).filter((e) => e.checkVisibility());
        const small = targets.map((e) => { const b = box(e); const after = e.matches('.fh-logo') ? 22 : 0; return { s: e.id || e.className, w: b.width, h: b.height + after }; }).filter((b) => b.w < 44 || b.h < 44);
        return { sw: document.documentElement.scrollWidth, vw: innerWidth, small };
      });
      expect(r.sw).toBeLessThanOrEqual(r.vw);
      expect(r.small).toEqual([]);
      await ctx.close();
    });
  }

  // review iteration 1, FAIL 2: short laptop screens. Grid mode keeps the spec's 80 px circles (2.6) and lets the page
  // scroll; no swatch box ever meets the HUD, the finish control, Reserve or the scrubber.
  for (const [w, h] of [[1280, 609], [1366, 657], [1536, 753], [1024, 600], [900, 600], [1280, 800], [1366, 768], [1920, 1080]] as const) {
    test(`wide swatch grid at ${w} x ${h}: 80 px circles, nothing over the controls, the HUD centred`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      for (const slug of ['blissful-blues', 'earthy-browns', 'frosty-whites']) {
        await page.goto(url(slug));
        // on a 3D build headless Chromium's software renderer turns the page to grid mode once the island's gate runs
        await page.waitForFunction(() => !document.documentElement.classList.contains('m3d'), null, { timeout: 30_000 });
        await page.evaluate(() => document.fonts.ready);
        const r = await page.evaluate(() => {
          const box = (e: Element) => e.getBoundingClientRect();
          const dots = [...document.querySelectorAll('#stage .gsw .dot')].map((d) => Math.round(box(d).width));
          const ctl = ['#hud', '#finish', '#reserve', '#scrub'].map((s) => [s, box(document.querySelector(s)!)] as const);
          const hits: string[] = [];
          for (const g of document.querySelectorAll('#stage .gsw')) {
            const a = box(g);
            for (const [s, c] of ctl) if (a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top) hits.push(`${(g as HTMLElement).dataset.s} ${s}`);
          }
          const name = box(document.querySelector('#hudName > span')!), stage = box(document.querySelector('#stage')!);
          return { dots: [...new Set(dots)], hits, sw: document.documentElement.scrollWidth, vw: innerWidth, dx: Math.abs(name.left + name.width / 2 - (stage.left + stage.width / 2)) };
        });
        expect(r.dots, slug).toEqual([80]);
        expect(r.hits, slug).toEqual([]);
        expect(r.sw).toBeLessThanOrEqual(r.vw);
        expect(r.dx).toBeLessThanOrEqual(8);
      }
      await ctx.close();
    });
  }

  test('at 390 x 844 every control sits above the sticky bar at rest; at 844 x 390 the stage fits between header and bar once the title scrolls', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    await page.goto(url('blissful-blues'));
    const r = await page.evaluate(() => ({ finish: document.querySelector('#finish')!.getBoundingClientRect().bottom, bar: document.querySelector('#bar')!.getBoundingClientRect().top, stage: document.querySelector('#stage')!.getBoundingClientRect().height }));
    expect(r.stage).toBe(450);
    expect(r.finish).toBeLessThanOrEqual(r.bar);
    await ctx.close();
    const land = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    const p2 = await land.newPage();
    await p2.goto(url('blissful-blues'));
    const t = await p2.evaluate(() => document.querySelector('.fp-title')!.getBoundingClientRect().height);
    await p2.evaluate((y) => scrollTo(0, y), t);
    const s = await p2.evaluate(() => ({ stage: document.querySelector('#stage')!.getBoundingClientRect(), head: document.querySelector('#fh')!.getBoundingClientRect().bottom, bar: document.querySelector('#bar')!.getBoundingClientRect().top }));
    expect(s.stage.height).toBe(262);
    expect(s.stage.top).toBeGreaterThanOrEqual(s.head - 1);
    expect(s.stage.bottom).toBeLessThanOrEqual(s.bar + 1);
    await land.close();
  });
});
