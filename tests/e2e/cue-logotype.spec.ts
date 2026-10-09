// AC5: the scroll cue and the corner logotype, on the poster path and the loader state (build step 4).
// The 3D-path parts (tone light at tp 1, the cue during the wipe, the intro at the loader's cut) wait for step 6.
import { test, expect, type Page } from '@playwright/test';
import { servePrototype, PROTO_URL } from '../harness/prototype.ts';
import { recordBursts, bursts } from '../harness/bursts.ts';
import { boxStats, contrast, luminanceOfHex, type Box } from '../harness/pixels.ts';
import { URBAN_SLATE, EMBER_LUXE } from '../../src/config/tokens.ts';
import { SHADES, GLITCH_PAIRS } from '../../src/config/shades.gen.ts';

const keyframes = (page: Page, name: string) => page.evaluate((n) => {
  for (const sh of Array.from(document.styleSheets)) {
    let rules: CSSRule[] = [];
    try { rules = Array.from(sh.cssRules); } catch { continue; }   // cross-origin sheets (the prototype's font CSS)
    for (const r of rules) if (r instanceof CSSKeyframesRule && r.name === n) {
      // per keyframe, its declarations sorted: the CSS minifier may reorder declarations, which changes nothing
      return Array.from(r.cssRules as CSSRuleList).map((k) => {
        const st = (k as CSSKeyframeRule).style;
        return (k as CSSKeyframeRule).keyText + ' { ' + Array.from(st).sort().map((p) => `${p}: ${st.getPropertyValue(p)}`).join('; ') + ' }';
      }).join('\n');
    }
  }
  return null;
}, name);

test('AC5.1 cue: the prototype keyframes, 1.5 s cycle, 2.44 cycles, then it rests on its line', async ({ page, browser }) => {
  await page.goto('/?tier=poster');
  const ball = page.locator('#cue .ball');
  const st = await ball.evaluate((e) => { const c = getComputedStyle(e); return { name: c.animationName, dur: c.animationDuration, n: c.animationIterationCount, w: c.width, h: c.height }; });
  expect(st).toEqual({ name: 'cueBall', dur: '1.5s', n: '2.44', w: '9px', h: '9px' });
  const base = await page.locator('#cue .base').evaluate((e) => { const c = getComputedStyle(e); return [c.animationName, c.animationDuration, c.animationIterationCount]; });
  expect(base).toEqual(['cueBase', '1.5s', '2.44']);
  // keyframes and easings identical to the prototype's (22 px drop)
  const ctx = await browser.newContext();
  await servePrototype(ctx, { three: false });
  const proto = await ctx.newPage();
  await proto.goto(PROTO_URL);
  for (const k of ['cueBall', 'cueBase']) expect(await keyframes(page, k), k).toBe(await keyframes(proto, k));
  await ctx.close();
  expect(await keyframes(page, 'cueBall')).toContain('translateY(-22px)');
  await page.waitForTimeout(3900);
  expect(await ball.evaluate((e) => ({ anims: e.getAnimations().length, t: getComputedStyle(e).transform }))).toEqual({ anims: 0, t: 'none' });
});

test('AC5.2 cue visibility: scroll past 8 px, nothing below, while loading, reduced motion', async ({ page, browser, baseURL }) => {
  await page.goto('/?tier=poster');
  const cue = page.locator('#cue');
  await expect(cue).not.toHaveClass(/is-off/);            // the test build has content below (the filler)
  await page.evaluate(() => scrollTo(0, 9));
  await expect(cue).toHaveClass(/is-off/);
  await page.evaluate(() => scrollTo(0, 8));
  await expect(cue).not.toHaveClass(/is-off/);
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(() => { document.getElementById('main')?.remove(); dispatchEvent(new Event('resize')); });
  await expect(cue).toHaveClass(/is-off/);                 // nothing to scroll to
  // while loading (the 3D tier before the lift): hidden and still
  const p2 = await browser.newPage({ baseURL });
  await p2.goto('/?tier=hero3d');
  await expect(p2.locator('html')).toHaveClass(/\bloading\b/);
  expect(await p2.locator('#cue').evaluate((e) => getComputedStyle(e).opacity)).toBe('0');
  expect(await p2.locator('#cue .ball').evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  await p2.close();
  // reduced motion: still
  const p3 = await browser.newPage({ baseURL, reducedMotion: 'reduce' });
  await p3.goto('/');
  expect(await p3.locator('#cue .ball').evaluate((e) => [getComputedStyle(e).animationName, getComputedStyle(e).transform])).toEqual(['none', 'none']);
  await p3.close();
});

test('AC5.3 logotype link: href, label, 44 px hit area', async ({ page }) => {
  await page.goto('/?tier=poster');
  const a = page.locator('#siteLogo');
  await expect(a).toHaveAttribute('href', '/');
  await expect(a).toHaveAttribute('aria-label', 'Skreed, home');
  const b = (await a.boundingBox())!;
  const hit = await page.evaluate(([x, y]) => {
    const on = (xx: number, yy: number) => !!document.elementFromPoint(xx, yy)?.closest('#siteLogo');
    let top = y, bot = y, l = x, r = x;
    while (on(x, top - 1)) top--; while (on(x, bot + 1)) bot++; while (on(l - 1, y)) l--; while (on(r + 1, y)) r++;
    return { h: bot - top + 1, w: r - l + 1 };
  }, [b.x + b.width / 2, b.y + b.height / 2]);
  expect(hit.h).toBeGreaterThanOrEqual(44);
  expect(hit.w).toBeGreaterThanOrEqual(112);
});

test('AC5.3 two-tone focus ring at tone dark, over the poster', async ({ browser, baseURL }, info) => {
  const dsf = 2;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dsf, bypassCSP: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage();   // reduced motion keeps the glitch from flickering the mark during the capture
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.evaluate(async () => { await (document.getElementById('posterImg') as HTMLImageElement).decode(); });
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.matches('#siteLogo:focus-visible'))).toBe(true);
  const b = (await page.locator('#siteLogo').boundingBox())!;
  const png = info.outputPath('logo-ring.png');
  await page.screenshot({ path: png });
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await page.addStyleTag({ content: '.site-logo{visibility:hidden!important}' });
  const bg = info.outputPath('logo-ring-bg.png');
  await page.screenshot({ path: bg });
  const s = (v: number) => v * dsf;
  // outline 6 to 8 px outside the box; slate ring 2 to 4 px outside; the gap between them and the ground outside
  const outline: Box = [s(b.x - 8), s(b.y - 8), s(b.width + 16), s(2)];
  const ring: Box = [s(b.x - 4), s(b.y - 4), s(b.width + 8), s(2)];
  const gap: Box = [s(b.x - 6), s(b.y - 6), s(b.width + 12), s(2)];
  const outside: Box = [s(b.x - 12), s(b.y - 12), s(b.width + 24), s(4)];
  const [o, r] = boxStats(png, [outline, ring]);
  const [g, out] = boxStats(bg, [gap, outside]);
  const LE = luminanceOfHex(EMBER_LUXE), LS = luminanceOfHex(URBAN_SLATE);
  const c = { emberVsOutside: contrast(LE, out.max), slateVsGap: contrast(LS, g.max), emberVsSlate: contrast(LE, LS), outlineRgb: o.rgb_median, ringRgb: r.rgb_median };
  info.annotations.push({ type: 'ring', description: JSON.stringify(c) });
  const near = (a: number[], t: number[]) => Math.max(...a.map((v, i) => Math.abs(v - t[i]))) <= 24;
  expect(near(o.rgb_median, [255, 153, 0]), 'outline is Ember Luxe').toBe(true);
  expect(near(r.rgb_median, [56, 63, 67]), 'inner ring is Urban Slate').toBe(true);
  expect(Math.max(c.emberVsOutside, c.slateVsGap)).toBeGreaterThanOrEqual(3);
  expect(c.emberVsSlate).toBeGreaterThanOrEqual(3);
  await ctx.close();
});

test('AC5.4 a click on the logotype scrolls to the top: smooth, or instant under reduced motion', async ({ page }) => {
  await page.goto('/?tier=poster');
  await page.evaluate(() => scrollTo(0, 300));
  await page.locator('#siteLogo').click();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);   // smooth: still travelling right after the click
  await page.waitForFunction(() => scrollY === 0);
  expect(page.url()).toMatch(/\?tier=poster$/);                      // intercepted: no navigation
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => scrollTo(0, 300));
  await page.locator('#siteLogo').click();
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

// Glitch timing runs on Playwright's fake clock: it drives performance.now() and requestAnimationFrame, so the burst
// windows are exact instead of sampled from headless frames (measured here: frame gaps up to 600 ms under load).
const tilesShown = (page: Page) => page.evaluate(() => !document.querySelector('.site-logo .logo-tiles')!.hasAttribute('display'));

test('AC5.7 and AC5.5 glitch: intro 0.5 s burst 0.75 s after install on the poster tier, hover and focus bursts of 0.25 s, no idle twitch', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 60_000);
  await page.goto(new URL('/?tier=poster', baseURL).href);
  // the install script ran during load at the paused instant: the intro starts 750 ms later and lasts 500 ms
  await page.clock.runFor(735);
  expect(await tilesShown(page), 'before 0.75 s').toBe(false);
  await page.clock.runFor(40);
  expect(await tilesShown(page), 'at 0.775 s').toBe(true);
  await page.clock.runFor(450);
  expect(await tilesShown(page), 'at 1.225 s').toBe(true);
  await page.clock.runFor(60);
  expect(await tilesShown(page), 'at 1.285 s').toBe(false);
  // no idle twitch: nothing for 20 s without input (logoIdle 0)
  await recordBursts(page);
  await page.evaluate(() => { (window as unknown as { __bursts: unknown[] }).__bursts = []; });
  await page.evaluate(() => {
    const w = window as unknown as { __bursts: number[] };
    const g = document.querySelector('.site-logo .logo-tiles')!;
    new MutationObserver(() => { if (!g.hasAttribute('display')) w.__bursts.push(performance.now()); }).observe(g, { attributes: true, attributeFilter: ['display'] });
  });
  await page.clock.runFor(20_000);
  expect(await page.evaluate(() => (window as unknown as { __bursts: number[] }).__bursts.length), 'bursts in 20 s idle').toBe(0);
  // pointer enter (mouse): 0.25 s
  await page.locator('#siteLogo').hover();
  await page.clock.runFor(40);
  expect(await tilesShown(page), 'hover burst running').toBe(true);
  await page.clock.runFor(190);
  expect(await tilesShown(page), 'hover burst at 0.23 s').toBe(true);
  await page.clock.runFor(60);
  expect(await tilesShown(page), 'hover burst over').toBe(false);
  // keyboard focus (:focus-visible)
  await page.mouse.move(640, 400);
  await page.keyboard.press('Tab');
  await page.clock.runFor(40);
  expect(await tilesShown(page), 'focus burst running').toBe(true);
  await page.clock.runFor(250);
  expect(await tilesShown(page), 'focus burst over').toBe(false);
  await ctx.close();
});

test('AC5.5 glitch on touch: a tap bursts', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await recordBursts(ctx);
  const page = await ctx.newPage();
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.waitForTimeout(1600);
  const n = (await bursts(page)).length;
  await page.locator('#siteLogo').tap();
  await page.waitForTimeout(600);
  expect((await bursts(page)).length).toBe(n + 1);
  await ctx.close();
});

test('AC5.6 glitch slabs: 48, one pair per burst, ghosts filled by var(--shade-<id>) with the shade hex', async ({ page }) => {
  await page.goto('/?tier=poster');
  await page.waitForTimeout(1500);
  expect(await page.locator('.site-logo .logo-tiles > g').count()).toBe(48);
  expect(await page.locator('.site-logo defs clipPath').count()).toBe(48);
  const hex = Object.fromEntries(SHADES.map((s) => [s.id, s.hex]));
  const toRgb = (h: string) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
  for (let k = 0; k < 6; k++) {
    await page.evaluate(() => window.__skreedLogo!.burst(2));
    await page.waitForTimeout(150);
    const ghosts = await page.evaluate(() => [...document.querySelectorAll<SVGUseElement>('.site-logo .logo-tiles use')]
      .filter((u) => u.style.color && !u.hasAttribute('display') && !u.parentElement!.hasAttribute('display'))
      .map((u) => ({ style: u.style.color, computed: getComputedStyle(u).color })));
    const ids = new Set<string>();
    for (const g of ghosts) {
      const m = /^var\(--shade-([a-z-]+-\d\d)\)$/.exec(g.style);
      expect(m, g.style).not.toBeNull();
      ids.add(m![1]);
      expect(g.computed).toBe(toRgb(hex[m![1]]));
    }
    expect(GLITCH_PAIRS.some((p) => [...ids].every((id) => p.includes(id))), [...ids].join(',')).toBe(true);
    await page.waitForTimeout(2000);
  }
});

test('AC5.7 reduced motion: no burst at all, and turning it on after load stops new bursts', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  await recordBursts(ctx);
  const page = await ctx.newPage();
  await page.goto(new URL('/', baseURL).href);
  await page.waitForTimeout(1600);
  await page.locator('#siteLogo').hover();
  await page.keyboard.press('Tab');
  await page.waitForTimeout(600);
  expect(await bursts(page)).toEqual([]);
  await ctx.close();
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await recordBursts(ctx2);
  const p2 = await ctx2.newPage();
  await p2.goto(new URL('/?tier=poster', baseURL).href);
  await p2.waitForTimeout(1600);
  const n = (await bursts(p2)).length;
  await p2.emulateMedia({ reducedMotion: 'reduce' });
  await p2.locator('#siteLogo').hover();
  await p2.waitForTimeout(600);
  expect((await bursts(p2)).length).toBe(n);
  await ctx2.close();
});
