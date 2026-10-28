// Section 5, the sign-up (docs/specs/section-5.md 7): AC3 the follow (a press on a follow word is an https link to a
// new tab with noopener, counts the platform as collected, pours its worth into your jar over 0.9 s, a second press
// pours nothing, the follows survive a reload within the visit and are gone in a new session; nothing on a jar moves
// at rest), AC5 the form with its endpoint routed to a stub (validation on blur and submit, a 5xx keeps the address
// and shows the error line, offline queues and sends on `online`, a 422 marks the field, a 409 reads as success, success
// shows the done line and "Not you?" puts the fields back), AC9 the links' names and the live region, AC10 the poster
// tier (the stills with the words, your jar's count in words, no island, no tall track) and the still3d tier (the fill
// instant). The 3D path runs on SwiftShader here (?tier=hero3d), the glue off (?glue=0) and section 4 open (?room=open),
// as room.spec does; the exit seam and the wrap onto section 5 are room.spec's cases. The test build (PUBLIC_HERO_HOOKS
// 1) renders the form (PUBLIC_LEADS unset is on there).
import { test, expect, type Page } from '@playwright/test';

type S5 = { ready: boolean; failed: boolean; order: string[]; levels: Record<string, number>; filling: string[] };
const s5 = (page: Page): Promise<S5 | null> => page.evaluate(() => (window.__s5?.state() ?? null) as S5 | null);
const events = (page: Page): Promise<string[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: { name: string }[] }).__skreedEvents ?? []).map((e) => e.name));
const said = (page: Page, sel: string) => page.locator(`${sel} .sr-only`).first().textContent({ timeout: 5_000 }).catch(() => '');

async function open3d(page: Page, baseURL: string | undefined, extra = ''): Promise<void> {
  await page.goto(new URL('/?tier=hero3d&glue=0&room=open' + extra, baseURL).href);
  await page.waitForFunction(() => window.__heroStarted && !!window.__skreedIntro, null, { timeout: 540_000, polling: 500 });
  await page.evaluate(() => (window.__skreedIntro as unknown as { skip(): void }).skip());
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 300_000, polling: 500 });
}
/** section 5's top at the viewport's top, the followers snapped, its chunk in */
async function atSignup(page: Page): Promise<void> {
  await page.evaluate(() => { const el = document.getElementById('signup')!, y = el.getBoundingClientRect().top + scrollY; scrollTo({ top: y, behavior: 'instant' }); window.__skreedSnap?.(y / innerHeight); });
  await page.evaluate(() => window.__s5?.load());
  await page.waitForFunction(() => !!window.__s5?.ready || !!(window.__s5?.state() as { failed?: boolean } | null)?.failed, null, { timeout: 180_000, polling: 500 });
  await page.waitForTimeout(600);
}
/** a press on a follow word that stays on the page (the link's new tab is not followed here) */
async function press(page: Page, id: string): Promise<void> {
  await page.evaluate((id) => { const a = document.querySelector<HTMLAnchorElement>(`a.su-follow[data-id="${id}"]`)!; a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); }, id);
}

test('section 5 at 390 x 844: the follow words, the pour, the stacking, the second press, the visit\'s memory, and nothing moving at rest (AC3, AC9)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await open3d(page, baseURL);
  await atSignup(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // the three follow words: https links to a new tab with noopener, named for assistive technology with the new tab
  const links = page.locator('a.su-follow');
  await expect(links).toHaveCount(3);
  for (const [id, href, name] of [['facebook', 'https://facebook.com/skreedofficial', 'Follow on Facebook. Opens in a new tab.'], ['youtube', 'https://www.youtube.com/@skreedofficial', 'Subscribe on YouTube. Opens in a new tab.'], ['instagram', 'https://www.instagram.com/skreedofficial/', 'Follow on Instagram. Opens in a new tab.']]) {
    const a = page.locator(`a.su-follow[data-id="${id}"]`);
    await expect(a).toHaveAttribute('href', href);
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAttribute('rel', 'noopener');
    await expect(a).toHaveAttribute('aria-label', name);
    const box = await a.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  // at rest: the three platform jars at their worth, your jar empty, nothing filling
  const s0 = (await s5(page))!;
  expect(s0.ready).toBe(true);
  expect(s0.levels).toEqual({ facebook: 0.25, youtube: 0.25, instagram: 0.5, yours: 0 });
  expect(s0.filling).toEqual([]);
  await page.waitForTimeout(1500);
  expect((await s5(page))!.levels.yours).toBe(0);
  // the Instagram press: collected, your jar half full after the fill, the live region once
  await press(page, 'instagram');
  await expect(page.locator('li.su-jar[data-id="instagram"]')).toHaveAttribute('data-collected', '1');
  await expect(page.locator('li.su-jar[data-id="yours"]')).toHaveAttribute('data-n', '1');
  await expect(page.locator('#suLive')).toHaveText('Instagram collected. Your jar: 1 of 3.');
  await expect.poll(async () => (await s5(page))!.levels.yours, { timeout: 5_000 }).toBe(0.5);
  await expect.poll(() => said(page, 'li.su-jar[data-id="instagram"] .su-state'), { timeout: 5_000 }).toBe('Collected');
  await expect.poll(() => said(page, 'li.su-jar[data-id="yours"] .su-state'), { timeout: 5_000 }).toBe('1 of 3 collected');
  expect(await events(page)).toContain('follow_click');
  // a second press pours nothing
  await press(page, 'instagram');
  await page.waitForTimeout(1200);
  expect((await s5(page))!.levels.yours).toBe(0.5);
  expect((await s5(page))!.order).toEqual(['instagram']);
  // the other two: full, in order
  await press(page, 'facebook');
  await expect.poll(async () => (await s5(page))!.levels.yours, { timeout: 5_000 }).toBe(0.75);
  await press(page, 'youtube');
  await expect.poll(async () => (await s5(page))!.levels.yours, { timeout: 5_000 }).toBe(1);
  await expect(page.locator('#suLive')).toHaveText('YouTube collected. Your jar is full.');
  await expect.poll(() => said(page, 'li.su-jar[data-id="yours"] .su-state'), { timeout: 5_000 }).toBe('Full');
  expect((await s5(page))!.order).toEqual(['instagram', 'facebook', 'youtube']);
  expect(await events(page)).toContain('jar_full');
  // remembered for the visit: the follows stand after a reload, in order
  await page.reload();
  await page.waitForFunction(() => window.__heroStarted && !!window.__skreedIntro, null, { timeout: 540_000, polling: 500 });
  await page.evaluate(() => (window.__skreedIntro as unknown as { skip(): void }).skip());
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 300_000, polling: 500 });
  await atSignup(page);
  await expect(page.locator('li.su-jar[data-id="yours"]')).toHaveAttribute('data-n', '3');
  expect((await s5(page))!.order).toEqual(['instagram', 'facebook', 'youtube']);
  expect((await s5(page))!.levels.yours).toBe(1);
  expect(errors).toEqual([]);
  await ctx.close();
  // gone in a new session
  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p2 = await fresh.newPage();
  await p2.goto(new URL('/?tier=poster&room=open', baseURL).href);
  await expect(p2.locator('li.su-jar[data-id="yours"]')).not.toHaveAttribute('data-n', '3');
  await fresh.close();
});

test('section 5 at 390 x 844 on the poster tier: the text on night, the stills with the words, the count in words, no island, and the form\'s states against a stub (AC5, AC10)', async ({ page, baseURL }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const calls: Record<string, string>[] = [];
  let answer: { status: number } = { status: 500 }, offline = false;
  // the stub answers as the Worker would; while the context is offline it fails the request as the network would (a route
  // fulfils before the offline emulation, so the stub has to refuse on its own)
  // the page opened with the quiz gate's override (?room=open, hooks builds): section 5 is locked with section 4 until the quiz
  await page.route('**/api/signup', async (route) => { if (offline) { await route.abort('internetdisconnected'); return; } calls.push(JSON.parse(route.request().postData() ?? '{}')); await route.fulfill({ status: answer.status, contentType: 'application/json', body: '{}' }); });
  await page.goto(new URL('/?tier=poster&room=open', baseURL).href);
  const root = page.locator('#signup');
  await root.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => !!window.__s5?.state?.())).toBe(false);
  await expect(root).toHaveCSS('background-color', 'rgb(5, 5, 6)');
  await expect(page.locator('#signup .su-jar')).toHaveCount(4);
  // the stills come in on this tier (the build carries them: absent files render no picture, and the words stand)
  const stills = await page.locator('#signup picture.su-still').count();
  if (stills) { await expect(page.locator('#signup picture.su-still')).toHaveCount(4); await expect(page.locator('#signup picture.su-still img').first()).toHaveJSProperty('complete', true); expect(await page.locator('#signup picture.su-still[data-lazy]').count()).toBe(0); }
  // a press counts in words
  await page.evaluate(() => { const a = document.querySelector<HTMLAnchorElement>('a.su-follow[data-id="facebook"]')!; a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); });
  await expect(page.locator('li.su-jar[data-id="yours"]')).toHaveAttribute('data-n', '1');
  await expect.poll(() => said(page, 'li.su-jar[data-id="yours"] .su-state'), { timeout: 5_000 }).toBe('1 of 3 collected');
  // the form: validation on blur and submit, never per keystroke
  const email = page.locator('#suEmail'), consent = page.locator('#suConsent'), send = page.locator('#suSend');
  await email.fill('not-an-address');
  await expect(page.locator('#suErrEmail')).toHaveText('');
  await email.blur();
  await expect(page.locator('#suErrEmail .sr-only')).toHaveText('That doesn’t look like an email address.');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await email.fill('sam@example.com'); await email.blur();
  await expect(email).toHaveAttribute('aria-invalid', 'false');
  await send.click();
  await expect(page.locator('#suErrConsent .sr-only')).toHaveText('Tick the box so we can email you.');
  expect(calls.length).toBe(0);
  await consent.check();
  // a 5xx: the address kept, the error line, the send word back
  await send.click();
  await expect(page.locator('#suMsg .sr-only')).toHaveText('That didn’t go through. Try again.', { timeout: 10_000 });
  await expect(email).toHaveValue('sam@example.com');
  expect(calls.length).toBe(1);
  expect(calls[0]).toEqual({ email: 'sam@example.com', consent: 'yes', follows: 'facebook', source: 'signup' });
  await expect(send.locator('.sr-only')).toHaveText('Save my colours');
  // a 422: the field marked
  answer = { status: 422 };
  await send.click();
  await expect(email).toHaveAttribute('aria-invalid', 'true', { timeout: 10_000 });
  await expect(page.locator('#suErrEmail .sr-only')).toHaveText('That doesn’t look like an email address.');
  // a 409 reads as success; "Not you?" puts the fields back
  answer = { status: 409 };
  await send.click();
  await expect(page.locator('#suDone')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#suDone .su-done-text .sr-only')).toHaveText('Done. Your colours are saved to sam@example.com.');
  await expect(page.locator('#suDone .su-done-text')).toBeFocused();
  await page.locator('.su-notyou').click();
  await expect(page.locator('#suDone')).toBeHidden();
  await expect(email).toHaveValue('');
  await expect(email).toBeFocused();
  // offline: queued, the line says so, sent on `online`
  await email.fill('sam@example.com'); await consent.check();
  offline = true; await page.context().setOffline(true);
  await send.click();
  await expect(page.locator('#suDone .su-done-text .sr-only')).toHaveText('You’re offline. We’ll send it when you’re back.', { timeout: 10_000 });
  expect(await events(page)).toContain('signup_offline');
  answer = { status: 200 };
  const before = calls.length;
  offline = false; await page.context().setOffline(false);
  await page.evaluate(() => dispatchEvent(new Event('online')));
  await expect.poll(() => calls.length, { timeout: 10_000 }).toBeGreaterThan(before);
  await expect(page.locator('#suDone .su-done-text .sr-only')).toHaveText('Done. Your colours are saved to sam@example.com.', { timeout: 10_000 });
  expect(await events(page)).toContain('signup_success');
  // the request carries no cookie
  expect(await page.evaluate(() => document.cookie)).toBe('');
});

test('section 5 at 390 x 844 under reduced motion (still3d): the jars drawn, the fill instant (AC10)', async ({ browser, baseURL }) => {
  test.setTimeout(900_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await open3d(page, baseURL, '&tier=still3d');
  await atSignup(page);
  const s = await s5(page);
  if (s && s.ready) {
    await press(page, 'instagram');
    await page.waitForTimeout(80);
    expect((await s5(page))!.levels.yours).toBe(0.5);
    expect((await s5(page))!.filling).toEqual([]);
  }
  await ctx.close();
});
