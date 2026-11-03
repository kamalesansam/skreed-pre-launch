// The cue's words on the landing (docs/specs/scroll-cue.md 7): acceptance 1 and 2 on the poster tier at the top, 4 on the
// 3D path in the pin (the test build forces the tier), and the family page's swatch grid mode, which test builds serve
// (acceptance 5's grid row; its 3D rows are tests/family/specs/scroll-cue.spec.ts). The pin's rows wait for the words to
// settle rather than for a fixed time: under SwiftShader a frame can take a second.
import { test, expect, type Page } from '@playwright/test';
import { S2T } from '../../src/config/hero.ts';

/** the pin's places by the scroll map (halved on 2026-11-02, section-2.md 14), never literal screens: the pull-back's fifth, half, 0.6 and end,
 *  mid first wipe (hidden), its end, the cascade's middle, the gems' rest, the glue's rest, mid second wipe, its end and the quiz (hidden) */
const { PULL, WIPE, W1END, LAND, W2, W2END } = S2T;
const P = { pull1: PULL * 0.2, pull: PULL / 2, pull3: PULL * 0.6, pullEnd: PULL, wipe1Mid: PULL + WIPE / 2, wipe1End: W1END, cascade: (W1END + LAND) / 2, gems: LAND + 0.3, gemsGlue: W2, wipe2Mid: W2 + WIPE / 2, wipe2End: W2END, quiz: W2END + 1 };

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
    test(`${w} x ${h}: "Scroll to see more" in Plex Mono capitals, in the bottom right corner (small under 768 px), in the gutters`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.goto('/?tier=poster');
      await page.evaluate(() => document.fonts.ready);
      await settled(page, true);
      const g = await geometry(page);
      expect(g.label).toBe('Scroll to see more');
      expect(g.hidden).toBe('true');
      expect(g.pe).toBe('none');
      expect(g.style).toMatchObject({ family: 'IBM Plex Mono', weight: '500', size: w < 768 ? '11px' : '14px', color: PEARL, transform: 'uppercase', style: 'normal', opacity: '1', visibility: 'visible' });
      const inset = Math.min(56, Math.max(16, 0.035 * w));
      expect(Math.abs(w - g.text.r - inset), 'the bottom right corner: the right inset').toBeLessThan(1.5);
      expect(Math.abs(h - g.el.b - inset), 'the bottom right corner: the bottom inset').toBeLessThan(1.5);
      expect(g.text.l).toBeGreaterThanOrEqual(16);
      expect(w - g.text.r).toBeGreaterThanOrEqual(16);
      for (const c of g.countdown) expect(hit(g.text, c), `clear of the countdown ${JSON.stringify(c)}`).toBe(false);
      expect(hit(g.text, g.cue)).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      await ctx.close();
    });
  }

  for (const [w, h] of [[390, 844], [1280, 800]]) {
    test(`${w} x ${h}: the countdown's eyebrow and unit labels in the chrome's face (E-chrome-font); the countdown lifted 84 px up to 1100 px for the column`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.goto('/?tier=poster');
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(() => {
        const face = (e: Element) => { const c = getComputedStyle(e); return { family: c.fontFamily.split(',')[0].replace(/"/g, ''), weight: c.fontWeight, size: c.fontSize, transform: c.textTransform, style: c.fontStyle }; };
        return { eyebrow: face(document.getElementById('cdEyebrow')!), labels: Array.from(document.querySelectorAll('#count .l')).map(face), countBottom: document.getElementById('count')!.getBoundingClientRect().bottom };
      });
      const PLEX = { family: 'IBM Plex Mono', weight: '500', size: '14px', transform: 'uppercase', style: 'normal' };
      expect(r.eyebrow).toMatchObject(PLEX);
      expect(r.labels.length).toBe(4);
      for (const l of r.labels) expect(l).toMatchObject(PLEX);
      const inset = Math.min(56, Math.max(16, 0.035 * w));
      expect(Math.abs(h - r.countBottom - inset - (w <= 1100 ? 84 : 0)), 'the countdown\'s bottom edge on --inset, lifted 84 px up to 1100 px (shell.css .copy)').toBeLessThan(2);
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
  for (const [w, h, full] of [[390, 844, true], [1280, 800, true], [768, 1024, false], [1024, 768, false]] as const) {
    test(`${w} x ${h}: back after 1.5 s at rest ${full ? 'in the pull-back, at both ends of the first wipe, in the cascade and at the gems' : 'in the pull-back, the cascade and at the gems'}, on the page edge; never in a wipe or on the quiz`, async ({ browser }) => {
      test.setTimeout(full ? 1_200_000 : 600_000);
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
      const all = [[P.pull1, true, PEARL], [P.pull, true, PEARL], [P.pull3, true, PEARL], [P.pullEnd, true, PEARL], [P.wipe1Mid, false, ''], [P.wipe1End, true, SLATE], [P.cascade, true, SLATE],
        [P.gems, true, SLATE], [P.gemsGlue, true, SLATE], [P.wipe2Mid, false, ''], [P.wipe2End, false, ''], [P.quiz, false, '']] as const;
      const rows = full ? all : all.filter(([k]) => [P.pull, P.wipe1Mid, P.cascade, P.gems, P.gemsGlue, P.wipe2Mid].includes(k));   // the two tablet sizes (G10): one place of each kind
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
        expect(Math.abs(h - g.el.b - inset), `${k}: on the bottom inset`).toBeLessThan(1.5);
        for (const c of g.countdown) if (k < P.wipe1Mid) expect(hit(g.text, c), `${k}: clear of the countdown`).toBe(false);
        if (k >= P.gems) {
          const labels = await page.evaluate(() => Array.from(document.querySelectorAll('.s2lab')).map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }).filter((r) => r.r > r.l));
          for (const l of labels) expect(hit(g.text, l), `${k}: clear of the gem label ${JSON.stringify(l)}`).toBe(false);
        }
        if (k === P.gemsGlue) {
          // moving from a shown place: the class goes on the island's next frame, and the words fade out within their 0.5 s of it
          await page.evaluate(() => scrollBy(0, -40));
          await page.waitForFunction(() => !document.getElementById('cueText')!.classList.contains('is-on'), null, { timeout: 10_000 });
          await settled(page, false, 5_000, `${k} moving:`);   // the 0.5 s fade, read between the island's frames (a second or more each under SwiftShader on a loaded machine)
        }
      }
      await ctx.close();
    });
  }

  test('390 x 844: a jump to the top the camera reaches late leaves the chevrons off; the words come back there alone', async ({ browser }) => {
    test.setTimeout(900_000);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('/?tier=hero3d');
    await page.waitForFunction(() => !!(window.__s2?.() as { ready?: boolean } | undefined)?.ready, null, { timeout: 420_000 });
    await page.evaluate((k) => { scrollTo(0, k * innerHeight); window.__skreedSnap?.(k); }, P.cascade);
    // on by the island's own class (is-on), not merely visible: at the top the words were visible with the chevrons, and under
    // SwiftShader a frame can take a second, so a jump back inside that frame would leave the island's rest clock at the top
    await page.waitForFunction(() => document.getElementById('cueText')!.classList.contains('is-on'), null, { timeout: 90_000 });
    await settled(page, true, 90_000, 'in the pin:');
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
    expect(g.text.l, 'in the bottom right corner again, right of the column').toBeGreaterThan(g.cue.r);
    expect(g.style.color).toBe(PEARL);
    await ctx.close();
  });

  test('390 x 844: a jump to the top from the pin: the words leave the pin corner hidden and come back in the bottom right corner, never moving while they show (D10)', async ({ browser }) => {
    test.setTimeout(900_000);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('/?tier=hero3d');
    await page.waitForFunction(() => !!(window.__s2?.() as { ready?: boolean } | undefined)?.ready, null, { timeout: 420_000 });
    // every change of the words' place (data-at) or state (class), with their computed opacity and visibility at that moment:
    // the place is CSS keyed on data-at alone (shell.css), so "a change of place only while hidden" is "every change of
    // data-at at opacity 0", whatever the frame rate
    await page.evaluate(() => {
      const el = document.getElementById('cueText')!, w = window as unknown as { __places: { at?: string; on: boolean; opacity: number; visibility: string; y: number }[] };
      w.__places = [];
      new MutationObserver(() => { const c = getComputedStyle(el); w.__places.push({ at: el.dataset.at, on: el.classList.contains('is-on'), opacity: Number(c.opacity), visibility: c.visibility, y: scrollY }); }).observe(el, { attributes: true, attributeFilter: ['data-at', 'class'] });
    });
    for (const from of [P.pull, P.cascade]) {
      await page.evaluate((k) => { scrollTo(0, k * innerHeight); window.__skreedSnap?.(k); }, from);
      await page.waitForFunction(() => document.getElementById('cueText')!.classList.contains('is-on'), null, { timeout: 90_000 });
      await settled(page, true, 90_000, `${from} in the pin:`);
      const pin = await geometry(page);
      await page.evaluate(() => scrollTo(0, 0));   // no snap: the Home key, a scrollbar drag, a status-bar tap
      await settled(page, false, 30_000, `${from} leaving:`);
      // back at the top: with the chevrons once the camera's followers arrive, or alone after the rest if they stay off
      await settled(page, true, 90_000, `${from} at the top:`);
      const top = await geometry(page);
      expect(top.text.l, `${from}: in the bottom right corner, right of the column`).toBeGreaterThan(top.cue.r);
      expect(pin.el.l, `${from}: the pin was the corner, left of the column`).toBeLessThan(top.el.l - 20);
    }
    const places = await page.evaluate(() => (window as unknown as { __places: { at?: string; on: boolean; opacity: number; visibility: string; y: number }[] }).__places);
    const moves = places.filter((p, i) => i > 0 && p.at !== places[i - 1].at);
    expect(moves.length, `the place changed into the pin and back for each jump: ${JSON.stringify(places)}`).toBeGreaterThanOrEqual(4);
    for (const m of moves) expect(m.opacity < 0.01 || m.visibility === 'hidden', `the place changed while the words showed: ${JSON.stringify(m)}`).toBe(true);
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
  await page.waitForTimeout(1_700);   // past the 1.5 s rest: a pin over the soft poster's page would have shown by now (ride.ts treats html.poster as the lock)
  await settled(page, false, 5_000);
  await context.setOffline(false);
});


test('the family page in swatch grid mode, one screen: no words and no columns', async ({ page }) => {
  await page.goto('/shades/blissful-blue/?mode=grid');
  await page.waitForTimeout(800);
  for (const v of await page.locator('.cuetext, .scrollcue').evaluateAll((els) => els.map((e) => getComputedStyle(e).visibility))) expect(v).toBe('hidden');
});
