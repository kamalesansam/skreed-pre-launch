// Section 5, the sign-up, as Sam's picture of 2026-11-02 (docs/specs/section-5.md): the page on the poster tier (the jars
// are renders, so the section is the same on both tiers; ?room=open opens it, as room.spec does), driven through the
// hooks of a test build (PUBLIC_HERO_HOOKS 1, which also renders the form): the fit in one screen at 390 x 844 and
// 1280 x 800, the three follow columns (https links to a new tab, noopener, named for assistive technology) and the
// star column with no link, the fill in press order with its events (a repeat press adds nothing), the visit's memory
// across a reload, the gate on the page's visibility, reduced motion at once, data-ready, and the form's states against
// a stub. The exit seam and the wrap onto section 5 are room.spec's cases.
import { test, expect, type Page } from '@playwright/test';

type Hooks = { state(): string; press(id: string): void; reset(): void };
const hooks = (page: Page) => page.waitForFunction(() => !!(window as unknown as { __skreedSignupHooks?: Hooks }).__skreedSignupHooks, null, { timeout: 30_000 });
const state = (page: Page) => page.evaluate(() => (window as unknown as { __skreedSignupHooks: Hooks }).__skreedSignupHooks.state());
const press = (page: Page, id: string) => page.evaluate((id) => (window as unknown as { __skreedSignupHooks: Hooks }).__skreedSignupHooks.press(id), id);
const filled = (page: Page) => page.evaluate(() => (window as unknown as { __filled?: { state: string; t: number }[] }).__filled ?? []);

async function open(page: Page, baseURL: string | undefined, extra = '') {
  await page.addInitScript(() => {
    const w = window as unknown as { __filled: { state: string; t: number }[]; __signed: unknown[] };
    w.__filled = []; w.__signed = [];
    addEventListener('skreed:signup-filled', (e) => { w.__filled.push({ ...(e as CustomEvent<{ state: string }>).detail, t: performance.now() }); });
    addEventListener('skreed:signup', (e) => { w.__signed.push((e as CustomEvent).detail); });
  });
  await page.goto(new URL('/?tier=poster&glue=0&room=open' + extra, baseURL).href);
  await page.waitForFunction(() => !document.getElementById('signup')?.hidden, null, { timeout: 30_000 });
  await page.evaluate(() => { const el = document.getElementById('signup')!; scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await hooks(page);
  await page.waitForFunction(() => document.getElementById('signup')?.dataset.ready === '1', null, { timeout: 10_000 });
  // (2026-11-09, docs/specs/redesign.md D18 and E-RD-motion) on the redesigned landing the section closes the page and
  // arrives once, as the scroll above brings it on screen: its headline, label, columns, ticks and form rise into place
  // (scripts/redesign/jars.ts), and none of them carries a transform or an opacity of its own at rest. The rows read the
  // section's boxes, so they wait for the motion kit to have run (html.rd-live) and for every part it moves to stand at
  // rest. Without this wait the Followed ticks row at 390 x 844 failed 2 runs in 7 the same day, a tick read 12 px up
  // inside its column while the column was still rising. Nothing of the old page is asked for: on a page that is not the
  // redesign (no main.rd) open() is as it was
  if (await page.locator('main.rd').count()) {
    await page.waitForFunction(() => document.documentElement.classList.contains('rd-live'), null, { timeout: 30_000 });
    await page.waitForFunction(() => [...document.querySelectorAll('#signup :is(.su-h > span, .su-sub, .su-every, .su-col, .su-tick, .su-got, .su-form, .su-keep)')]
      .every((e) => { const s = getComputedStyle(e); return s.transform === 'none' && s.opacity === '1'; }), null, { timeout: 15_000 });
  }
}
/** every line of the section inside the viewport under the clearance, no two boxes overlapping (the laptop lays the
 * headline beside the jars since 2026-11-02, so the check is pairwise, not down the DOM's order), no horizontal scroll */
const fit = (page: Page) => page.evaluate(() => {
  const sel = ['.su-h > span', '.su-sub', '.su-every', '.su-jar', '.su-icon', '.su-worth', '.su-got-h h3', '.su-grey', '.su-slotf', '.su-msgrow', '.su-keep'];
  const all = sel.flatMap((s) => [...document.querySelectorAll(s)].map((e) => e.getBoundingClientRect())), body = document.getElementById('suBody')!;
  let overlap = 0;
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ox > 0.5 && oy > 0.5) overlap = Math.max(overlap, Math.min(ox, oy));
  }
  return { top: Math.min(...all.map((b) => b.top)), bottom: Math.max(...all.map((b) => b.bottom)), clear: parseFloat(getComputedStyle(body).paddingTop), vh: innerHeight, bodyH: body.getBoundingClientRect().height, overflowX: document.documentElement.scrollWidth > innerWidth, overlap };
});

for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`section 5 at ${vp.width} x ${vp.height}: one screen, the columns, the fill in press order, a repeat adds nothing, the visit's memory`, async ({ browser, baseURL }) => {
    test.setTimeout(240_000);
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await open(page, baseURL);
    const f = await fit(page);
    expect(f.overflowX).toBe(false);
    expect(f.top).toBeGreaterThanOrEqual(f.clear - 0.5);
    expect(f.bottom).toBeLessThanOrEqual(f.vh + 0.5);
    expect(f.overlap).toBeLessThanOrEqual(0.5);
    expect(Math.abs(f.bodyH - f.vh)).toBeLessThanOrEqual(1);
    // the three follow columns and the star column
    for (const [id, href, name] of [['facebook', 'https://www.facebook.com/skreedofficial', 'Follow Skreed on Facebook, 5% off (opens in a new tab)'], ['youtube', 'https://www.youtube.com/@skreedofficial', 'Subscribe to Skreed on YouTube, 5% off (opens in a new tab)'], ['instagram', 'https://www.instagram.com/skreedindia', 'Follow Skreed on Instagram, 10% off (opens in a new tab)']]) {
      const a = page.locator(`a.su-follow[data-id="${id}"]`);
      await expect(a).toHaveAttribute('href', href);
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', 'noopener');
      await expect(a).toHaveAttribute('aria-label', name);
    }
    await expect(page.locator('.su-yours a')).toHaveCount(0);
    await expect(page.locator('#suYours')).toHaveAttribute('aria-label', 'Your jar, empty.');
    expect(await state(page)).toBe('0');
    // Facebook, then YouTube on top (Sam's example), each after the 500 ms gate and its reveal
    await press(page, 'facebook');
    await expect.poll(() => filled(page).then((x) => x.map((e) => e.state)), { timeout: 5_000 }).toEqual(['f']);
    expect(await state(page)).toBe('f');
    await expect(page.locator('#suLive')).toHaveText('Blue added to your jar.');
    await press(page, 'facebook');   // a repeat: nothing added
    await page.waitForTimeout(1600);
    expect((await filled(page)).length).toBe(1);
    await press(page, 'youtube');
    await expect.poll(() => filled(page).then((x) => x.map((e) => e.state)), { timeout: 5_000 }).toEqual(['f', 'fy']);
    await expect(page.locator('#suYours')).toHaveAttribute('aria-label', 'Your jar, half full, from the bottom: blue, then red.');
    expect(await page.evaluate(() => sessionStorage.getItem('skreed:signup-follows'))).toBe('["facebook","youtube"]');
    // a reload in the visit: the jar at its state at once, no fill
    await page.reload();
    await page.waitForFunction(() => !document.getElementById('signup')?.hidden, null, { timeout: 30_000 });
    await page.evaluate(() => { const el = document.getElementById('signup')!; scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
    await hooks(page);
    expect(await state(page)).toBe('fy');
    await expect(page.locator('#suYours')).toHaveAttribute('data-state', 'fy');
    // Instagram fills the jar: the mixed lot, a half, 1400 ms
    await press(page, 'instagram');
    await expect.poll(() => filled(page).then((x) => x.map((e) => e.state)), { timeout: 6_000 }).toEqual(['fyi']);
    await expect(page.locator('#suLive')).toHaveText('Pink and purple added to your jar. Your jar is full.');
    // the hooks' reset: a fresh visit
    await page.evaluate(() => (window as unknown as { __skreedSignupHooks: Hooks }).__skreedSignupHooks.reset());
    expect(await state(page)).toBe('0');
    expect(errors).toEqual([]);
    await ctx.close();
  });
}

test('section 5 at 390 x 844, the poster tier: the logotype is Urban Slate while the section\'s cream ground is under its middle, and not once the section is below it', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await open(page, baseURL);   // the section's top at the viewport's top, under the logotype
  const logo = page.locator('a.site-logo');
  await expect(logo).toHaveAttribute('data-tone', 'light');
  await expect(logo).toHaveCSS('color', 'rgb(56, 63, 67)');   // Urban Slate (shell.css)
  // the section's top 20 px below the logotype's bottom: the dark scenes are under it again
  await page.evaluate(() => { const l = document.querySelector('a.site-logo')!.getBoundingClientRect(); scrollBy({ top: -(l.bottom + 20), behavior: 'instant' }); });
  await expect(logo).not.toHaveAttribute('data-tone', 'light');
  // and the ground under the logotype's middle again
  await page.evaluate(() => { const l = document.querySelector('a.site-logo')!.getBoundingClientRect(); scrollBy({ top: l.bottom + 20 - (l.top + l.bottom) / 2 + 2, behavior: 'instant' }); });
  await expect(logo).toHaveAttribute('data-tone', 'light');
  await ctx.close();
});

test('section 5 at 390 x 844: the fill waits for the page to be visible (300 ms after it is), presses during a fill queue, reduced motion at once', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await open(page, baseURL);
  // the page hidden at the press (the platform's tab in front): nothing fills until it is visible again
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await press(page, 'instagram');
  await page.waitForTimeout(1200);
  expect((await filled(page)).length).toBe(0);
  expect(await state(page)).toBe('0');
  const back = await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); return performance.now(); });
  await expect.poll(() => filled(page).then((x) => x.length), { timeout: 5_000 }).toBe(1);
  const t = (await filled(page))[0].t - back;
  expect(t).toBeGreaterThanOrEqual(300 + 1400 - 50);   // 300 ms after the page is visible, then a half's reveal
  // two quick presses: one after the other, in press order
  await press(page, 'youtube'); await press(page, 'facebook');
  await expect.poll(() => filled(page).then((x) => x.map((e) => e.state)), { timeout: 6_000 }).toEqual(['i', 'iy', 'iyf']);
  await ctx.close();
  // reduced motion: the same fill as everyone since 2026-11-04 (E-3D-only), not at once
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page2 = await ctx2.newPage();
  await open(page2, baseURL);
  const t0 = await page2.evaluate(() => performance.now());
  await press(page2, 'facebook');
  await expect.poll(() => filled(page2).then((x) => x.length), { timeout: 6_000 }).toBe(1);
  expect((await filled(page2))[0].t - t0).toBeGreaterThan(400);
  expect(await state(page2)).toBe('f');
  await ctx2.close();
});

test('section 5 at 390 x 844: the form\'s states against a stub (empty, invalid, sending, error, success with "Not you?", offline queue)', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const calls: Record<string, string>[] = [];
  let answer = 500, offline = false;
  await page.route('**/api/signup', async (route) => { if (offline) { await route.abort('internetdisconnected'); return; } calls.push(JSON.parse(route.request().postData() ?? '{}')); await route.fulfill({ status: answer, contentType: 'application/json', body: '{}' }); });
  await open(page, baseURL);
  const email = page.locator('#suEmail'), send = page.locator('#suSend'), msg = page.locator('#suMsg');
  await expect(email).toHaveAttribute('placeholder', 'Your email address');
  await expect(send).toHaveText('SAVE MY DISCOUNTS');
  // empty, then invalid: the line under the form, the field marked
  await send.click();
  await expect(msg).toHaveText('That doesn’t look like an email address.');
  await email.fill('not-an-address'); await email.blur();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  // a server error
  await email.fill('sam@example.com'); await email.blur();
  await expect(email).toHaveAttribute('aria-invalid', 'false');
  const before = await page.locator('.su-msgrow').boundingBox();
  await send.click();
  await expect(msg).toHaveText('That didn’t go through. Try again.');
  expect(calls[0]).toEqual({ email: 'sam@example.com', follows: '', source: 'signup' });
  expect((await page.locator('.su-msgrow').boundingBox())?.y).toBe(before?.y);   // nothing moves
  // success: the done line in the pill's place, "Not you?" under it
  answer = 200;
  await send.click();
  await expect(page.locator('#suDone')).toHaveText('Done. Your colours are saved to sam@example.com.');
  await expect(page.locator('#suNotYou')).toBeVisible();
  await page.locator('#suNotYou').click();
  await expect(email).toBeVisible(); await expect(email).toHaveValue('');
  // offline: queued for the visit and sent on `online`
  offline = true; await ctx.setOffline(true);
  await email.fill('sam@example.com'); await send.click();
  await expect(page.locator('#suDone')).toHaveText('You’re offline. We’ll send it when you’re back.');
  expect(await page.evaluate(() => sessionStorage.getItem('skreed:signup-queue'))).toContain('sam@example.com');
  offline = false; await ctx.setOffline(false);
  await expect(page.locator('#suDone')).toHaveText('Done. Your colours are saved to sam@example.com.', { timeout: 10_000 });
  await ctx.close();
});

for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`section 5 at ${vp.width} x ${vp.height}: the Followed ticks (2026-11-06): one under each follow column, named per platform, a tick fills jar 4 and one taken off drains it (the rest keep their order), the ticks remembered for the visit, a press on a column counts no follow`, async ({ browser, baseURL }) => {
    test.setTimeout(240_000);
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await open(page, baseURL);
    const f = await fit(page);
    expect(f.overflowX).toBe(false);
    expect(Math.abs(f.bodyH - f.vh), 'one screen with the ticks').toBeLessThanOrEqual(1);
    // the three ticks under the first three columns (the fourth cell empty), each inside its column's width, 44 px of hit
    const cols = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.su-row > .su-col')].map((c) => { const r = c.getBoundingClientRect(); return { l: r.left, r: r.right, b: r.bottom }; }));
    const ticks = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.su-tick')].map((t) => { const r = t.getBoundingClientRect(), i = t.querySelector('input')!, cs = getComputedStyle(t, '::after'); return { id: t.dataset.id, l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height, hit: r.height - parseFloat(cs.top) * 2, name: i.getAttribute('aria-label'), word: t.textContent!.trim(), checked: i.checked }; }));
    expect(ticks.map((t) => [t.id, t.name, t.word, t.checked])).toEqual([['facebook', 'I follow Skreed on Facebook', 'Followed', false], ['youtube', 'I follow Skreed on YouTube', 'Followed', false], ['instagram', 'I follow Skreed on Instagram', 'Followed', false]]);
    for (const [k, t] of ticks.entries()) {
      expect(t.l, `${t.id}: inside its column`).toBeGreaterThanOrEqual(cols[k].l - 0.5);
      expect(t.r).toBeLessThanOrEqual(cols[k].r + 0.5);
      expect(t.t, 'under the column').toBeGreaterThanOrEqual(cols[k].b - 0.5);
      expect(t.hit, 'a 44 px hit box').toBeGreaterThanOrEqual(44);
    }
    // a press on a column opens its page and fills nothing
    const [tab] = await Promise.all([ctx.waitForEvent('page'), page.locator('a.su-follow[data-id="youtube"]').click()]);
    await tab.close();
    await page.waitForTimeout(1600);
    expect(await state(page)).toBe('0');
    expect(await page.locator('#suTick-youtube').isChecked()).toBe(false);
    // Facebook ticked, then Instagram: blue, then the mixed lot on top
    await page.locator('label.su-tick[data-id="facebook"]').click();
    await expect.poll(() => filled(page).then((x) => x.map((e) => e.state)), { timeout: 5_000 }).toEqual(['f']);
    await page.locator('label.su-tick[data-id="instagram"]').click();
    await expect.poll(() => filled(page).then((x) => x.map((e) => e.state)), { timeout: 6_000 }).toEqual(['f', 'fi']);
    await expect(page.locator('#suYours')).toHaveAttribute('aria-label', 'Your jar, three quarters full, from the bottom: blue, then pink and purple.');
    expect(await page.evaluate(() => sessionStorage.getItem('skreed:signup-follows'))).toBe('["facebook","instagram"]');
    // Facebook's tick off: the blue drains and the pink and purple stay (the render of 'i'), announced; the state and the memory follow
    await page.locator('label.su-tick[data-id="facebook"]').click();
    await expect.poll(() => filled(page).then((x) => x.map((e) => e.state)), { timeout: 5_000 }).toEqual(['f', 'fi', 'i']);
    expect(await state(page)).toBe('i');
    await expect(page.locator('#suYours')).toHaveAttribute('aria-label', 'Your jar, half full, from the bottom: pink and purple.');
    await expect(page.locator('#suLive')).toHaveText('Blue taken out of your jar.');
    expect(await page.evaluate(() => sessionStorage.getItem('skreed:signup-follows'))).toBe('["instagram"]');
    expect(await page.evaluate(() => [...document.querySelectorAll<HTMLInputElement>('.su-tick-box')].map((i) => i.checked))).toEqual([false, false, true]);
    // the last tick off: the jar empty again, as it began
    await page.locator('label.su-tick[data-id="instagram"]').click();
    await expect.poll(() => state(page), { timeout: 6_000 }).toBe('0');
    await expect(page.locator('#suYours')).toHaveAttribute('aria-label', 'Your jar, empty.');
    expect(await page.evaluate(() => sessionStorage.getItem('skreed:signup-follows'))).toBe('[]');
    // a reload in the visit: the ticks as remembered
    await page.locator('label.su-tick[data-id="youtube"]').click();
    await expect.poll(() => state(page), { timeout: 5_000 }).toBe('y');
    await page.reload();
    await page.waitForFunction(() => !document.getElementById('signup')?.hidden, null, { timeout: 30_000 });
    await page.evaluate(() => { const el = document.getElementById('signup')!; scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
    await hooks(page);
    expect(await state(page)).toBe('y');
    expect(await page.evaluate(() => [...document.querySelectorAll<HTMLInputElement>('.su-tick-box')].map((i) => i.checked))).toEqual([false, true, false]);
    expect(errors).toEqual([]);
    await ctx.close();
  });
}
