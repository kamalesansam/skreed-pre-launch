// AC4: the countdown, on the poster path (build step 4). The 3D-path parts (contrast on the canvas) wait for step 6.
import { test, expect, type Page } from '@playwright/test';
import { boxStats, contrast, luminanceOfHex, type Box } from '../harness/pixels.ts';
import { PEARL_WHISPER, URBAN_SLATE, EMBER_LUXE } from '../../src/config/tokens.ts';
import { pauseClockAt } from '../harness/settle.ts';

const digits = (page: Page) => page.evaluate(() => ['cd-d', 'cd-h', 'cd-m', 'cd-s'].map((i) => document.getElementById(i)!.textContent).join(' '));

test.describe('AC4.1 values', () => {
  for (const [iso, want] of [['2026-10-09T09:00:00+05:30', '22 15 00 00'], ['2026-10-31T23:59:59+05:30', '00 00 00 01']]) {
    test(`reads ${want} at ${iso}`, async ({ page }) => {
      await pauseClockAt(page, iso);
      await page.goto('/?tier=poster');
      expect(await digits(page)).toBe(want);
    });
  }

  test('at zero: the live line with a real link, and no numerals', async ({ page, context }) => {
    await context.route('https://skreed.com/**', (r) => r.fulfill({ body: '<!doctype html><title>skreed.com</title>', contentType: 'text/html' }));
    await pauseClockAt(page, '2026-11-01T00:00:00+05:30');
    await page.goto('/?tier=poster');
    await expect(page.locator('#cdEyebrow')).toHaveText('Skreed is live. skreed.com');
    expect(await page.locator('#count').evaluate((e) => getComputedStyle(e).display)).toBe('none');
    const link = page.locator('#cdEyebrow a[href="https://skreed.com"]');
    await expect(link).toHaveCount(1);
    expect(await link.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe('auto');
    const b = (await link.boundingBox())!;
    const [cx, cy] = [b.x + b.width / 2, b.y + b.height / 2];
    expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.matches('#cdEyebrow a'), [cx, cy])).toBe(true);
    const hit = await page.evaluate(([x, y]) => {
      const on = (yy: number) => !!document.elementFromPoint(x, yy)?.closest('#cdEyebrow a');
      let top = y, bot = y; while (on(top - 1)) top--; while (on(bot + 1)) bot++; return bot - top + 1;
    }, [cx, cy]);
    expect(hit).toBeGreaterThanOrEqual(44);
    await link.click();
    await expect(page).toHaveURL('https://skreed.com/');
  });
});

test('AC4.2 numerals: Open Sans 600 tabular, two digits, 2ch, hidden until the first tick, ticks on the wall-clock second', async ({ page }) => {
  await pauseClockAt(page, '2026-10-09T09:00:00.400+05:30');
  await page.goto('/?tier=poster');
  for (const id of ['cd-d', 'cd-h', 'cd-m', 'cd-s']) {
    const s = await page.locator('#' + id).evaluate((e) => { const c = getComputedStyle(e); return { ff: c.fontFamily, fw: c.fontWeight, fvn: c.fontVariantNumeric, t: e.textContent }; });
    expect(s.ff).toMatch(/^"Open Sans"/);
    expect(s.fw).toBe('600');
    expect(s.fvn).toBe('tabular-nums');
    expect(s.t).toMatch(/^\d\d$/);
  }
  const rules = await page.evaluate(() => {
    const out: Record<string, string> = {};
    for (const sh of Array.from(document.styleSheets)) for (const r of Array.from(sh.cssRules)) {
      if (r instanceof CSSStyleRule && r.selectorText === '.count .n') out.minWidth = r.style.minWidth;
      if (r instanceof CSSStyleRule && r.selectorText === '.count:not([data-ready]) .n') out.hidden = r.style.visibility;
    }
    return out;
  });
  expect(rules).toEqual({ minWidth: '2ch', hidden: 'hidden' });
  expect(await page.locator('#count').getAttribute('data-ready')).toBe('');
  expect(await digits(page)).toBe('22 14 59 59');
  await page.clock.runFor(590);
  expect(await digits(page)).toBe('22 14 59 59');   // the next tick waits for the wall-clock second (plus 5 ms)
  await page.clock.runFor(20);
  expect(await digits(page)).toBe('22 14 59 58');
});

test('AC4.3 semantics: role timer with its label', async ({ page }) => {
  await page.goto('/?tier=poster');
  const c = page.locator('#count');
  await expect(c).toHaveAttribute('role', 'timer');
  await expect(c).toHaveAttribute('aria-label', 'Time until launch');
});

test('AC4.3 without JavaScript: one line with a <time>, no eyebrow, numerals or cue', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(baseURL!);
  for (const sel of ['#cdEyebrow', '#count', '#cue']) expect(await page.locator(sel).evaluate((e) => getComputedStyle(e).display), sel).toBe('none');
  const line = page.locator('#heroCopy p.eyebrow:not(#cdEyebrow)');
  await expect(line).toBeVisible();
  await expect(line).toHaveText('Launching 1 November 2026');
  await expect(line.locator('time')).toHaveAttribute('datetime', '2026-11-01T00:00+05:30');
  await expect(line.locator('time')).toHaveText('1 November 2026');
  await ctx.close();
});

test('AC4.4 independence: runs with WebGL2 removed and with every module script blocked', async ({ browser, baseURL }) => {
  for (const mode of ['no-webgl2', 'no-modules']) {
    const ctx = await browser.newContext();
    if (mode === 'no-webgl2') await ctx.addInitScript(() => { delete (window as unknown as Record<string, unknown>).WebGL2RenderingContext; });
    else await ctx.route('**/_astro/*.js', (r) => r.abort());
    const page = await ctx.newPage();
    await pauseClockAt(page, '2026-10-09T09:00:00.400+05:30');
    await page.goto(baseURL!);
    if (mode === 'no-webgl2') await expect(page.locator('html')).toHaveClass(/\bposter\b/);
    expect(await digits(page), mode).toBe('22 14 59 59');
    await page.clock.runFor(610);
    expect(await digits(page), mode).toBe('22 14 59 58');
    await ctx.close();
  }
});

test('AC4.5 reduced motion hides the seconds group', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.locator('#count .sec').evaluate((e) => getComputedStyle(e).display)).toBe('none');
  await expect(page.locator('#cd-m')).toBeVisible();
});

test('AC4.7 v10 hooks: data-hold stops digit writes, __skreedCountV carries the four strings', async ({ page }) => {
  await pauseClockAt(page, '2026-10-09T09:00:00.400+05:30');
  await page.goto('/?tier=poster');
  expect(await page.evaluate(() => window.__skreedCountV)).toEqual(['22', '14', '59', '59']);
  await page.evaluate(() => { document.getElementById('count')!.dataset.hold = '1'; });
  await page.clock.runFor(1610);   // ticks at 0.605 s and 1.605 s
  expect(await digits(page)).toBe('22 14 59 59');
  expect(await page.evaluate(() => window.__skreedCountV)).toEqual(['22', '14', '59', '57']);
  await page.evaluate(() => { delete document.getElementById('count')!.dataset.hold; });
  await page.clock.runFor(1000);
  expect(await digits(page)).toBe('22 14 59 56');
});

// AC4.6 on the poster path: the poster is the rest frame with the locked terrain (provisional at stage 1). The text is
// Pearl Whisper; the pixels behind each element are read from a screenshot with the text hidden, worst case (max).
for (const vp of [{ name: '390', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, { name: '1280', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 }]) {
  test(`AC4.6 contrast of the countdown and cue over the poster at ${vp.name}`, async ({ browser, baseURL }, info) => {
    const ctx = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: vp.deviceScaleFactor, bypassCSP: true });
    const page = await ctx.newPage();
    await pauseClockAt(page, '2026-10-09T09:00:00+05:30');
    await page.goto(new URL('/?tier=poster', baseURL).href);
    await page.evaluate(async () => { await document.fonts.ready; await (document.getElementById('posterImg') as HTMLImageElement).decode(); });
    const sel: Record<string, string> = { eyebrow: '#cdEyebrow', label: '#count .l', numeral: '#count .n', cue: '#cue .lbl' };
    const boxes: { kind: string; box: Box }[] = [];
    for (const [kind, s] of Object.entries(sel)) {
      for (const r of await page.locator(s).evaluateAll((els) => els.map((e) => { const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; }))) {
        boxes.push({ kind, box: r.map((v) => v * vp.deviceScaleFactor) as Box });
      }
    }
    await page.addStyleTag({ content: '.copy,.cue,.site-logo{visibility:hidden!important}' });
    const png = info.outputPath(`behind-${vp.name}.png`);
    await page.screenshot({ path: png });
    const stats = boxStats(png, boxes.map((b) => b.box));
    const Lt = luminanceOfHex(PEARL_WHISPER);
    const rows = boxes.map((b, i) => ({ kind: b.kind, worst: +contrast(Lt, stats[i].max).toFixed(2), p95: +contrast(Lt, stats[i].p95).toFixed(2) }));
    info.annotations.push({ type: 'contrast', description: JSON.stringify(rows) });
    for (const r of rows) expect(r.worst, `${r.kind} ${JSON.stringify(r)}`).toBeGreaterThanOrEqual(r.kind === 'numeral' ? 3 : 4.5);
    await ctx.close();
  });
}

test('AC4.6 at zero: the link two-tone focus ring over the poster', async ({ browser, baseURL }, info) => {
  const dsf = 2;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dsf, bypassCSP: true });
  const page = await ctx.newPage();
  await pauseClockAt(page, '2026-11-01T00:00:00+05:30');
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.evaluate(async () => { await document.fonts.ready; await (document.getElementById('posterImg') as HTMLImageElement).decode(); });
  await page.keyboard.press('Tab');   // the logotype
  await page.keyboard.press('Tab');   // the skreed.com link
  expect(await page.evaluate(() => document.activeElement?.matches('#cdEyebrow a:focus-visible'))).toBe(true);
  const b = (await page.locator('#cdEyebrow a').boundingBox())!;
  const png = info.outputPath('ring.png');
  await page.screenshot({ path: png });
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await page.addStyleTag({ content: '.copy{visibility:hidden!important}' });
  const bg = info.outputPath('ring-bg.png');
  await page.screenshot({ path: bg });
  const s = (v: number) => v * dsf;
  // outline: 2 to 4 px outside the box (offset 2, width 2); slate ring: 0 to 2 px outside (inset -2, border 2)
  const outer: Box = [s(b.x - 4), s(b.y - 4), s(b.width + 8), s(2)];
  const inner: Box = [s(b.x - 2), s(b.y - 2), s(b.width + 4), s(2)];
  const out2: Box = [s(b.x - 4), s(b.y - 8), s(b.width + 8), s(4)];
  const [ringO, ringI] = boxStats(png, [outer, inner]);
  const [bgOut] = boxStats(bg, [out2]);
  const LE = luminanceOfHex(EMBER_LUXE), LS = luminanceOfHex(URBAN_SLATE);
  const c = { emberVsBg: contrast(LE, bgOut.max), slateVsBg: contrast(LS, bgOut.max), emberVsSlate: contrast(LE, LS), ringOuterRgb: ringO.rgb_median, ringInnerRgb: ringI.rgb_median };
  info.annotations.push({ type: 'ring', description: JSON.stringify(c) });
  const near = (a: number[], b: number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i]))) <= 24;
  expect(near(ringO.rgb_median, [255, 153, 0]), 'outline is Ember Luxe').toBe(true);
  expect(near(ringI.rgb_median, [56, 63, 67]), 'inner ring is Urban Slate').toBe(true);
  expect(Math.max(c.emberVsBg, c.slateVsBg)).toBeGreaterThanOrEqual(3);
  expect(c.emberVsSlate).toBeGreaterThanOrEqual(3);
  await ctx.close();
});
