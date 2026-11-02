// The cue's words on a family page (docs/specs/family-page.md 25, docs/specs/scroll-cue.md 7, acceptance 5): the cue's words on a family page,
// at 390 x 844 and 1280 x 800, then at 360 x 780, 430 x 932, 375 x 667 and 375 x 553 against the front case's box.
// The 3D rows need a PUBLIC_FAMILY_3D=on (or dev) build and force the 3D path past SwiftShader (?render=force&tier=high,
// as back.spec.ts does); grid mode runs on any build. The words settle by their own fade, awaited, never a fixed frame.
import { test, expect, type Page } from '@playwright/test';
import { PHONE, WIDE } from './util.ts';

const PEARL = 'rgb(247, 246, 243)';
type Box = { l: number; t: number; r: number; b: number };
const meets = (a: Box, b: Box) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

async function open3d(page: Page): Promise<void> {
  await page.goto('/shades/blissful-blue/?render=force&tier=high');
  const has = await page.evaluate(() => !!document.getElementById('fam-3d'));
  test.skip(!has, 'this build has no 3D island (PUBLIC_FAMILY_3D=off)');
  await expect(page.locator('html')).toHaveClass(/\bm3d\b/);
  await expect(page.locator('html')).not.toHaveClass(/\bloading\b/, { timeout: 90_000 });
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page, sel: string, want: boolean, timeout = 30_000) => page.waitForFunction(([sel, want]) => {
  const c = getComputedStyle(document.querySelector(sel as string)!); const o = Number(c.opacity);
  return want ? o > 0.99 && c.visibility === 'visible' : o < 0.01 || c.visibility === 'hidden';
}, [sel, want] as const, { timeout, polling: 100 });
/** a line's words and the text or boxes it must keep clear of, shown at the time */
const scene = (page: Page, sel: string) => page.evaluate((sel) => {
  const b = (r: DOMRect) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom });
  const text = (e: Element) => { const r = document.createRange(); r.selectNodeContents(e); return b(r.getBoundingClientRect()); };
  const shown = (e: Element) => { const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && Number(c.opacity) > 0.05; };
  const w = document.querySelector(sel)!, cs = getComputedStyle(w);
  const others = Array.from(document.querySelectorAll('#cue, #cue2, .fp-scrub, .fp-ctl, .bar, .beat.on .beat-txt, .beatnav, .hud-btn, #famBack, .allfam, #toTop')).filter(shown)
    .map((e) => ({ id: e.id || e.className.toString().split(' ')[0], box: ['toTop', 'famBack'].includes(e.id) || e.classList.contains('allfam') ? text(e) : b(e.getBoundingClientRect()) }));
  return { words: text(w), el: b(w.getBoundingClientRect()), cue: b(document.getElementById('cue')!.getBoundingClientRect()), cue2: b(document.getElementById('cue2')!.getBoundingClientRect()), others,
    style: { family: cs.fontFamily.split(',')[0].replace(/"/g, ''), weight: cs.fontWeight, size: cs.fontSize, color: cs.color }, label: w.textContent, vw: innerWidth };
}, sel);

for (const [name, setup] of [['390', PHONE], ['1280', WIDE]] as const) {
  test(`${name}: the first screen's words with the columns, the story's at rest at the bottom right, none on the argument screen`, async ({ browser }) => {
    test.setTimeout(300_000);
    const ctx = await browser.newContext(setup);
    const page = await ctx.newPage();
    await open3d(page);
    await settled(page, '.cuetext.is-land', true);
    const top = await scene(page, '.cuetext.is-land');
    expect(top.label).toBe('Scroll to see more');
    expect(top.style).toMatchObject({ family: 'IBM Plex Mono', weight: '500', size: '14px', color: PEARL });
    expect(Math.abs((top.words.l + top.words.r) / 2 - top.vw / 2), 'centred').toBeLessThan(1);
    if (name === '390') expect(Math.abs(top.el.b - top.cue.b), 'on the columns\' bottom line').toBeLessThan(2);
    for (const o of top.others.filter((o) => !['cue', 'cue2'].includes(o.id))) expect(meets(top.words, o.box), `first screen: clear of ${o.id}`).toBe(false);
    expect(meets(top.words, top.cue) || meets(top.words, top.cue2)).toBe(false);
    await settled(page, '.cuetext.is-story', false);
    // the story: shown only once the page has rested, at the bottom right, clear of Back to top's words and the beat text
    await page.evaluate(() => scrollTo({ top: 2.1 * innerHeight, behavior: 'instant' }));
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-still'))).toBe(false);
    await settled(page, '.cuetext.is-story', true);
    const story = await scene(page, '.cuetext.is-story');
    expect(story.vw - story.words.r, 'right-aligned on --inset').toBeLessThan(Math.max(16, 0.035 * story.vw) + 1.5);
    for (const o of story.others) expect(meets(story.words, o.box), `story: clear of ${o.id}`).toBe(false);
    await settled(page, '.cuetext.is-land', false);
    // the end: nothing, before and after "Back to main page"
    await page.evaluate(() => scrollTo({ top: document.scrollingElement!.scrollHeight, behavior: 'instant' }));
    await settled(page, '.cuetext.is-story', false);
    await page.waitForTimeout(3200);
    await expect(page.locator('#famBack')).toBeVisible();
    expect(await page.locator('.cuetext').evaluateAll((els) => els.map((e) => getComputedStyle(e).visibility))).toEqual(['hidden', 'hidden']);
    await ctx.close();
  });
}

/** the front case's box at the carousel pose: the skeleton's polygon (page.ts drawSkel, the fit's hull) nearest the centre */
const frontCase = (page: Page) => page.evaluate(() => {
  const polys = Array.from(document.querySelectorAll('#skel polygon')).map((p) => (p.getAttribute('points') || '').split(' ').map((q) => q.split(',').map(Number)));
  const W = innerWidth;
  let best: number[][] | null = null, d = Infinity;
  for (const pts of polys) { const cx = pts.reduce((s, q) => s + q[0], 0) / pts.length; if (Math.abs(cx - W / 2) < d) { d = Math.abs(cx - W / 2); best = pts; } }
  return best ? { l: Math.min(...best.map((q) => q[0])), r: Math.max(...best.map((q) => q[0])), b: Math.max(...best.map((q) => q[1])) } : null;
});

for (const [w, h, shown] of [[360, 780, true], [430, 932, true], [375, 667, true], [375, 553, false]] as const) {
  test(`${w} x ${h}: the first screen's words ${shown ? 'clear the front case by 4 px or more' : 'stand down, the case reaching their line; the columns stay'}`, async ({ browser }) => {
    test.setTimeout(300_000);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await open3d(page);
    const fc = await frontCase(page);
    expect(fc, 'the skeleton gives the front case').not.toBeNull();
    expect(await page.evaluate(() => document.documentElement.classList.contains('cue-tight'))).toBe(!shown);
    if (shown) {
      await settled(page, '.cuetext.is-land', true);
      const top = await scene(page, '.cuetext.is-land');
      expect(top.el.t - fc!.b, 'the line clears the front case').toBeGreaterThanOrEqual(4);
      expect(Math.abs(top.el.b - top.cue.b), 'on the columns\' bottom line').toBeLessThan(2);
      for (const o of top.others.filter((o) => !['cue', 'cue2'].includes(o.id))) expect(meets(top.words, o.box), `clear of ${o.id}`).toBe(false);
      expect(top.words.l).toBeGreaterThanOrEqual(16);
      expect(w - top.words.r).toBeGreaterThanOrEqual(16);
    } else {
      expect(await page.locator('.cuetext.is-land').evaluate((e) => getComputedStyle(e).display)).toBe('none');
      // the columns show after their own 0.5 s visibility delay once the loader lifts (family.css's one transition for both ways)
      await page.waitForFunction(() => getComputedStyle(document.getElementById('cue')!).visibility === 'visible', null, { timeout: 5_000 });
    }
    // the story at rest at every size: bottom right, clear of Back to top's words and the beat text
    await page.evaluate(() => scrollTo({ top: 2.1 * innerHeight, behavior: 'instant' }));
    await settled(page, '.cuetext.is-story', true);
    const story = await scene(page, '.cuetext.is-story');
    for (const o of story.others) expect(meets(story.words, o.box), `story: clear of ${o.id}`).toBe(false);
    expect(w - story.words.r).toBeLessThan(Math.max(16, 0.035 * w) + 1.5);
    await ctx.close();
  });
}

test('swatch grid mode: one screen, so no words and no columns', async ({ page }) => {
  await page.goto('/shades/blissful-blue/?mode=grid');
  await page.waitForTimeout(800);
  for (const v of await page.locator('.cuetext, .scrollcue').evaluateAll((els) => els.map((e) => getComputedStyle(e).visibility))) expect(v).toBe('hidden');
});
