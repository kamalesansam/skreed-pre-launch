// The cue's words on the landing (docs/specs/scroll-cue.md 7): acceptance 1 and 2 on the poster tier at the top, 4 on the
// 3D path in the pin (the test build forces the tier), and the family page's swatch grid mode, which test builds serve
// (acceptance 5's grid row; its 3D rows are tests/family/specs/scroll-cue.spec.ts). The pin's rows wait for the words to
// settle rather than for a fixed time: under SwiftShader a frame can take a second.
import { test, expect, type Page } from '@playwright/test';

const PEARL = 'rgb(247, 246, 243)', SLATE = 'rgb(56, 63, 67)';
type Box = { l: number; t: number; r: number; b: number };

/** the words' text box and element box, the column's box, and the countdown's own text boxes */
const geometry = (page: Page) => page.evaluate(() => {
  const b = (r: DOMRect) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom });
  const text = (e: Element) => { const r = document.createRange(); r.selectNodeContents(e); return b(r.getBoundingClientRect()); };
  const w = document.getElementById('cueText')!;
  const cs = getComputedStyle(w);
  return {
    text: text(w), el: b(w.getBoundingClientRect()), cue: b(document.getElementById('cue')!.getBoundingClientRect()),
    countdown: Array.from(document.querySelectorAll('#cdEyebrow, #count .n, #count .l')).map(text),
    style: { family: cs.fontFamily.split(',')[0].replace(/"/g, ''), weight: cs.fontWeight, size: cs.fontSize, color: cs.color, transform: cs.textTransform, style: cs.fontStyle, spacing: cs.letterSpacing, opacity: cs.opacity, visibility: cs.visibility },
    label: w.textContent, hidden: w.getAttribute('aria-hidden'), pe: cs.pointerEvents,
  };
});
const hit = (a: Box, o: Box) => a.l < o.r && o.l < a.r && a.t < o.b && o.t < a.b;
const settled = (page: Page, want: boolean, timeout = 60_000, label = '') => page.waitForFunction((want) => {
  const c = getComputedStyle(document.getElementById('cueText')!); const o = Number(c.opacity);
  return want ? o > 0.99 && c.visibility === 'visible' : o < 0.01 || c.visibility === 'hidden';
}, want, { timeout, polling: 100 }).catch(async (e) => {
  // say where it stuck: the words' and the chevrons' state, the scroll and the camera's lagged scroll
  const st = await page.evaluate(() => {
    const w = document.getElementById('cueText')!, c = getComputedStyle(w), s = (window as unknown as { __skreedState?: () => { sb: number } }).__skreedState?.();
    return { opacity: c.opacity, visibility: c.visibility, words: w.className, at: w.dataset.at, cue: document.getElementById('cue')!.className, y: scrollY, screens: +(scrollY / innerHeight).toFixed(3), sb: s?.sb, html: document.documentElement.className };
  }).catch(() => null);
  throw new Error(`${label} the words did not settle ${want ? 'shown' : 'hidden'}: ${JSON.stringify(st)}; ${(e as Error).message.split('\n')[0]}`);
});

test.describe('the landing at the top, poster tier', () => {
  for (const [w, h] of [[360, 780], [390, 844], [430, 932], [768, 1024], [1024, 768], [1100, 800], [1280, 800]]) {
    test(`${w} x ${h}: "Scroll to see more" in Plex Mono capitals, centred a --s1 over the column up to 1100 px, in the bottom right corner above it, in the gutters`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.goto('/?tier=poster');
      await page.evaluate(() => document.fonts.ready);
      await settled(page, true);
      const g = await geometry(page);
      expect(g.label).toBe('Scroll to see more');
      expect(g.hidden).toBe('true');
      expect(g.pe).toBe('none');
      expect(g.style).toMatchObject({ family: 'IBM Plex Mono', weight: '500', size: '14px', color: PEARL, transform: 'uppercase', style: 'normal', opacity: '1', visibility: 'visible' });
      const inset = Math.min(56, Math.max(16, 0.035 * w));
      if (w > 1100) {
        expect(Math.abs(w - g.text.r - inset), 'the bottom right corner: the right inset').toBeLessThan(1.5);
        expect(Math.abs(h - g.el.b - inset), 'the bottom right corner: the bottom inset').toBeLessThan(1.5);
      } else {
        expect(Math.abs((g.text.l + g.text.r) / 2 - (g.cue.l + g.cue.r) / 2), 'centred over the column').toBeLessThan(1.5);
        expect(Math.abs(g.cue.t - g.el.b - 8), 'a --s1 over the column').toBeLessThan(1.5);
      }
      expect(g.text.l).toBeGreaterThanOrEqual(16);
      expect(w - g.text.r).toBeGreaterThanOrEqual(16);
      for (const c of g.countdown) expect(hit(g.text, c), `clear of the countdown ${JSON.stringify(c)}`).toBe(false);
      expect(hit(g.text, g.cue)).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      await ctx.close();
    });
  }

  test('hidden past 8 px with the column, back at 8 px; hidden while loading; without JavaScript, not displayed', async ({ page, browser }) => {
    await page.goto('/?tier=poster');
    await settled(page, true);
    await page.evaluate(() => scrollTo(0, 9));
    await settled(page, false, 5_000);
    expect(await page.locator('#cue').evaluate((e) => e.classList.contains('is-off'))).toBe(true);
    await page.evaluate(() => scrollTo(0, 8));
    await settled(page, true, 5_000);
    await page.evaluate(() => document.documentElement.classList.add('loading'));
    await settled(page, false, 5_000);
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const nojs = await ctx.newPage();
    await nojs.goto('/');
    expect(await nojs.locator('#cueText').evaluate((e) => getComputedStyle(e).display)).toBe('none');
    await ctx.close();
  });
});

test.describe('the landing in the pin, 3D path', () => {
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    test(`${w} x ${h}: back after 1.5 s at rest in the pull-back, at both ends of the first wipe, in the cascade and at the gems, on the page edge; never in a wipe or on the quiz`, async ({ browser }) => {
      test.setTimeout(1_200_000);
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.goto('/?tier=hero3d');
      await page.waitForFunction(() => !!(window.__s2?.() as { ready?: boolean } | undefined)?.ready, null, { timeout: 420_000 });
      // the time the words gain is-on, stamped in the page; the scroll's own time stamped with it
      await page.evaluate(() => {
        const el = document.getElementById('cueText')!, w = window as unknown as { __onAt: number };
        w.__onAt = 0;
        new MutationObserver(() => { if (el.classList.contains('is-on') && !w.__onAt) w.__onAt = performance.now(); }).observe(el, { attributes: true, attributeFilter: ['class'] });
      });
      const at = (k: number) => page.evaluate((k) => {
        const w = window as unknown as { __onAt: number };
        w.__onAt = 0; scrollTo(0, k * innerHeight); window.__skreedSnap?.(k);
        return performance.now();
      }, k);
      const inset = Math.min(56, Math.max(16, 0.035 * w));
      const rows = [[1, true, PEARL], [2.5, true, PEARL], [3, true, PEARL], [5, true, PEARL], [5.5, false, ''], [6, true, SLATE], [10, true, SLATE],
        [14.8, true, SLATE], [15.2, true, SLATE], [15.7, false, ''], [16.2, false, ''], [17.2, false, '']] as const;
      for (const [k, want, color] of rows) {
        const t0 = await at(k);
        if (!want) {
          await page.waitForTimeout(2100);   // past the rest: a hidden place stays hidden
          await settled(page, false, 60_000, `${k}:`);
          continue;
        }
        // a shown place passes only on a class the island added after this move (at() zeroes the stamp, and every move
        // drops the class on the island's next frame), never on the place before; a hidden spell between two places in
        // the same corner can be shorter than one SwiftShader frame, so it is not waited for
        await page.waitForFunction(() => (window as unknown as { __onAt: number }).__onAt > 0, null, { timeout: 90_000 }).catch(async () => { await settled(page, true, 1, `${k}: no return after the move;`); });
        await settled(page, true, 30_000, `${k}:`);
        const onAt = await page.evaluate(() => (window as unknown as { __onAt: number }).__onAt);
        expect(onAt - t0, `${k}: back no sooner than the 1.5 s rest (SwiftShader frames can only make it later)`).toBeGreaterThan(1200);
        const g = await geometry(page);
        expect(g.style.color, `${k}`).toBe(color);
        if (w <= 1100) expect(Math.abs(g.text.l - inset), `${k}: on the left inset`).toBeLessThan(1.5);
        else expect(Math.abs(w - g.text.r - inset), `${k}: on the right inset`).toBeLessThan(1.5);
        for (const c of g.countdown) if (k < 5.5) expect(hit(g.text, c), `${k}: clear of the countdown`).toBe(false);
        if (k >= 14.8) {
          const labels = await page.evaluate(() => Array.from(document.querySelectorAll('.s2lab')).map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }).filter((r) => r.r > r.l));
          for (const l of labels) expect(hit(g.text, l), `${k}: clear of the gem label ${JSON.stringify(l)}`).toBe(false);
        }
      }
      // moving: the class goes on the next frame, and the line fades out
      await page.evaluate(() => scrollBy(0, -40));
      await page.waitForFunction(() => !document.getElementById('cueText')!.classList.contains('is-on'), null, { timeout: 10_000 });
      await settled(page, false, 10_000);
      await ctx.close();
    });
  }

  test('390 x 844: a jump to the top the camera reaches late leaves the chevrons off; the words come back there alone', async ({ browser }) => {
    test.setTimeout(900_000);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('/?tier=hero3d');
    await page.waitForFunction(() => !!(window.__s2?.() as { ready?: boolean } | undefined)?.ready, null, { timeout: 420_000 });
    await page.evaluate(() => { scrollTo(0, 10 * innerHeight); window.__skreedSnap?.(10); });
    await settled(page, true, 90_000);
    await page.evaluate(() => scrollTo(0, 0));   // no snap: the Home key, a scrollbar drag, a status-bar tap
    // the camera's followers reach the top late, and the ride keeps the chevrons off for the wipe meanwhile: the words go
    await settled(page, false, 30_000);
    await page.waitForFunction(() => window.__skreedState?.().sb === 0 || (window.__skreedState?.().sb ?? 0) < 0.01, null, { timeout: 30_000 }).catch(() => {});
    // then, at rest, they come back alone (is-on) while the chevrons stay off
    await page.waitForFunction(() => document.getElementById('cueText')!.classList.contains('is-on'), null, { timeout: 90_000 }).catch(async () => {
      const st = await page.evaluate(() => ({ html: document.documentElement.className, cue: document.getElementById('cue')!.className, words: document.getElementById('cueText')!.className, y: scrollY, sh: document.documentElement.scrollHeight, ih: innerHeight, sb: (window as unknown as { __skreedState?: () => { sb: number } }).__skreedState?.().sb, hidden: document.hidden }));
      throw new Error(`the words did not come back at the top: ${JSON.stringify(st)}`);
    });
    await settled(page, true, 30_000, 'at the top:');
    expect(await page.locator('#cue').evaluate((e) => e.classList.contains('is-off')), 'the chevrons stayed off (the older state this row covers)').toBe(true);
    const g = await geometry(page);
    expect(Math.abs((g.text.l + g.text.r) / 2 - (g.cue.l + g.cue.r) / 2), 'centred over the column again').toBeLessThan(1.5);
    expect(Math.abs(g.cue.t - g.el.b - 8), 'a --s1 over the column').toBeLessThan(1.5);
    expect(g.style.color).toBe(PEARL);
    await ctx.close();
  });
});

test('the offline soft poster: the words at the top, hidden from 8 px, never pinned over the page', async ({ page, context }) => {
  await page.goto('/?tier=hero3d');
  await expect(page.locator('html')).toHaveClass(/loading/);
  await context.setOffline(true);
  await expect(page.locator('html')).toHaveClass(/poster/);
  await expect(page.locator('#intro')).toHaveClass(/po/);
  await settled(page, true, 10_000);
  await page.evaluate(() => scrollTo(0, 9));
  await settled(page, false, 5_000);
  await page.evaluate(() => scrollTo(0, document.scrollingElement!.scrollHeight));
  await page.waitForTimeout(800);
  await settled(page, false, 5_000);
  await context.setOffline(false);
});


test('the family page in swatch grid mode, one screen: no words and no columns', async ({ page }) => {
  await page.goto('/shades/blissful-blue/?mode=grid');
  await page.waitForTimeout(800);
  for (const v of await page.locator('.cuetext, .scrollcue').evaluateAll((els) => els.map((e) => getComputedStyle(e).visibility))) expect(v).toBe('hidden');
});
