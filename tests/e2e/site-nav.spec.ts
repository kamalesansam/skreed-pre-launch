// The section index (docs/specs/navbar.md AC2 to AC9; src/components/shell/SiteNav.astro, src/scripts/shell/site-nav.ts):
// at the top right on the logotype's row at every breakpoint, clear of it, 44 px hits, no horizontal scroll; Menu and
// its light drawer from the right under 768 px; each section in place by a press on the poster tier, with aria-current
// following and a second press during a jump honoured; Products always listed, opening the quiz gate as Skip quiz does;
// on the 3D path a keyboard press on Products leaves focus on the hall's pad; plain fragment links without JavaScript.
// About, the page link (navbar.md D7, AC11), is last in the bar and the drawer and leaves for /about/ with no veil, the
// drawer closed as the page goes (the Back row launches Chromium with the back-forward cache allowed; the runner's has it off).
// The 3D path's rest positions are nav-map.ts's, checked in tests/unit/site-nav.test.ts.
import { test, expect, chromium, type Page } from '@playwright/test';
import { CHROME_PATH, GL_ARGS } from '../harness/browser.ts';

const PEARL = 'rgb(247, 246, 243)', SLATE = 'rgb(56, 63, 67)';
const docTop = (page: Page, id: string) => page.evaluate((i) => document.getElementById(i)!.getBoundingClientRect().top + scrollY, id);
const familiesOff = (page: Page) => page.evaluate(() => { const f = document.getElementById('families')!; return Math.abs(f.getBoundingClientRect().top + f.offsetHeight / 2 - innerHeight / 2); });
const veilDown = (page: Page) => expect(page.locator('#toTopVeil')).toBeHidden();
const events = (page: Page) => page.evaluate(() => ((window as unknown as { __skreedEvents?: { name: string; props: Record<string, unknown> }[] }).__skreedEvents ?? []).map((e) => [e.name, e.props]));

for (const width of [360, 390, 430, 768, 1024, 1280]) {
  test(`at ${width} px: the index sits at the top right on the logotype's row, clear of it, with 44 px hits`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: width < 768 ? 800 : 900 });
    await page.goto(new URL('/?tier=poster', baseURL).href);
    const g = await page.evaluate(() => {
      const box = (el: Element) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, cy: b.y + b.height / 2 }; };
      const items = [...document.querySelectorAll('#siteNav .snav-a')].filter((a) => a.getClientRects().length && !a.closest('[popover]')).map((a) => ({ t: a.textContent, ...box(a) }));
      const inset = parseFloat(getComputedStyle(document.getElementById('siteLogo')!).left);
      return { items, logo: box(document.getElementById('siteLogo')!), inset, sw: document.documentElement.scrollWidth, vw: innerWidth };
    });
    expect(g.items.map((i) => i.t)).toEqual(width < 768 ? ['Menu'] : ['Home', 'Families', 'Quiz', 'Products', 'About']);   // Products with the gate still locked; About, the page link, last
    expect(g.sw).toBeLessThanOrEqual(g.vw);
    const last = g.items[g.items.length - 1];
    expect(Math.abs(last.r - (g.vw - g.inset + 12))).toBeLessThan(1);   // the last word's text ends on --inset, its hit padded past it
    for (const i of g.items) {
      expect(i.h).toBeGreaterThanOrEqual(44); expect(i.w).toBeGreaterThanOrEqual(44);
      expect(Math.abs(i.cy - g.logo.cy)).toBeLessThan(1.5);   // on the logotype's row
      expect(i.x).toBeGreaterThan(g.logo.r + 8);   // clear of the logotype
    }
  });
}

test('the phone: Menu opens a light drawer from the right, 75 percent wide; a row jumps and closes it; Escape returns focus to Menu', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  const menu = page.locator('#siteNav .snav-menu');
  await menu.click();
  const drawer = page.locator('#site-sections'), panel = drawer.locator('.snav-in');
  await expect(drawer).toBeVisible();
  await expect.poll(() => panel.evaluate((el) => getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);   // slid in
  const box = (await panel.boundingBox())!;
  expect(Math.abs(box.x + box.width - 390)).toBeLessThan(1);   // on the right edge
  expect(Math.abs(box.width - 0.75 * 390)).toBeLessThan(1);   // 75 percent of the screen
  expect(Math.abs(box.height - 844)).toBeLessThan(1);   // the screen's full height
  expect(await panel.evaluate((el) => { const s = getComputedStyle(el); return [s.backgroundColor, s.color]; })).toEqual([PEARL, SLATE]);
  expect(await drawer.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');   // the layer beside it is clear
  await expect(drawer.locator('a:visible')).toHaveText(['Home', 'Families', 'Quiz', 'Products', 'About']);
  await drawer.locator('a', { hasText: 'Quiz' }).click();
  await expect(drawer).toBeHidden();
  await expect.poll(async () => page.evaluate(() => scrollY)).toBe(Math.round(await docTop(page, 'find')));
  await veilDown(page);
  await menu.click();
  await expect(drawer.locator('a[aria-current]')).toHaveText('Quiz');
  await page.keyboard.press('Tab');   // into the drawer
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('#site-sections'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(menu).toBeFocused();   // back from inside the drawer to the control that opened it
});

test('the phone: a tap on the page beside the drawer only closes it, and never presses what is under it', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  const begin = (await page.locator('#qzBegin').boundingBox())!;
  expect(begin.x).toBeLessThan(0.25 * 390 - 8);   // "Click to begin" starts in the strip the drawer leaves in view
  await page.locator('#siteNav .snav-menu').click();
  await expect(page.locator('#site-sections')).toBeVisible();
  await page.mouse.click(Math.min(begin.x + 12, 0.25 * 390 - 8), begin.y + begin.height / 2);
  await expect(page.locator('#site-sections')).toBeHidden();
  await page.waitForTimeout(800);
  await expect(page.locator('#qzIntro')).toBeVisible();   // the quiz did not begin
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('a tap beside the drawer only closes it, and never presses what is under it', async ({ page, baseURL }) => {
    await page.goto(new URL('/?tier=poster', baseURL).href);
    await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
    const begin = (await page.locator('#qzBegin').boundingBox())!;
    await page.locator('#siteNav .snav-menu').tap();
    await expect(page.locator('#site-sections')).toBeVisible();
    await page.waitForTimeout(400);   // slid in
    await page.touchscreen.tap(Math.min(begin.x + 12, 0.25 * 390 - 8), begin.y + begin.height / 2);
    await expect(page.locator('#site-sections')).toBeHidden();
    await page.waitForTimeout(800);
    await expect(page.locator('#qzIntro')).toBeVisible();   // the quiz did not begin
  });
});

test('a keyboard press on Quiz mid-quiz puts focus on the live question', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await page.locator('#qzBegin').click();
  for (let i = 0; i < 2; i++) {
    const card = page.locator(`.qz-card[data-i="${i}"].is-top`);
    await card.waitFor();
    await page.waitForTimeout(700);   // past the deck's guard after a question goes up
    await card.locator('.qz-opt').first().evaluate((b) => (b as HTMLButtonElement).click());
  }
  await page.locator('.qz-card[data-i="2"].is-top').waitFor();
  await page.locator('#siteNav .snav-list a[data-sec="top"]').click();
  await page.waitForFunction(() => scrollY === 0, null, { timeout: 5000 });
  await veilDown(page);
  await page.locator('#siteNav .snav-list a[data-sec="quiz"]').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => { const a = document.activeElement; return a ? `${a.className} ${a.getAttribute('data-i')}` : ''; }), { timeout: 10_000 }).toMatch(/qz-card.*is-top.* 2$/);
});

test('the phone: the drawer closes when the window widens past its Menu', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.locator('#siteNav .snav-menu').click();
  await expect(page.locator('#site-sections')).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 844 });
  await expect(page.locator('#site-sections')).toBeHidden();
  await expect(page.locator('#siteNav .snav-list a')).toHaveCount(5);
});

test('a browser without the popover API: the words still jump', async ({ page, baseURL }) => {
  // as Safari 16 or Chrome 113 run it: no popover methods, and :popover-open is not a selector (matches() throws on it)
  await page.addInitScript(() => {
    delete (HTMLElement.prototype as unknown as { hidePopover?: unknown }).hidePopover;
    const m = Element.prototype.matches;
    Element.prototype.matches = function (this: Element, s: string) { if (s.includes(':popover-open')) throw new DOMException(`'${s}' is not a valid selector`, 'SyntaxError'); return m.call(this, s); };
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.locator('#siteNav .snav-list a[data-sec="quiz"]').click();
  await expect.poll(async () => page.evaluate(() => scrollY)).toBe(Math.round(await docTop(page, 'find')));
});

test('aria-current follows a plain scroll too', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  const current = () => page.locator('#siteNav .snav-list a[aria-current]');
  await expect(current()).toHaveText('Home');
  await page.evaluate(() => { const f = document.getElementById('find')!; scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await expect(current()).toHaveText('Quiz');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(current()).toHaveText('Home');
});

test('laptop: each word lands on its section on the poster tier, and aria-current follows the scroll', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  const word = (sec: string) => page.locator(`#siteNav .snav-list a[data-sec="${sec}"]`);
  await expect(word('top')).toHaveAttribute('aria-current', 'location');
  await word('quiz').click();
  await expect.poll(async () => page.evaluate(() => scrollY)).toBe(Math.round(await docTop(page, 'find')));
  await expect(word('quiz')).toHaveAttribute('aria-current', 'location');
  await veilDown(page);
  await word('families').click();
  await expect.poll(() => familiesOff(page)).toBeLessThan(2);   // nav#families centred
  await expect(word('families')).toHaveAttribute('aria-current', 'location');
  await veilDown(page);
  await word('top').click();
  await page.waitForFunction(() => scrollY === 0, null, { timeout: 5000 });
});

test('a second press during a jump is honoured: the page ends on the section pressed last', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.locator('#siteNav .snav-list a[data-sec="quiz"]').click();
  await page.waitForTimeout(120);   // while the veil comes in
  await page.locator('#siteNav .snav-list a[data-sec="families"]').click();
  await expect.poll(() => familiesOff(page)).toBeLessThan(2);
  await veilDown(page);
  await page.locator('#siteNav .snav-list a[data-sec="quiz"]').click();
  await page.waitForTimeout(500);   // while the veil lifts
  await page.locator('#siteNav .snav-list a[data-sec="top"]').click();
  await page.waitForFunction(() => scrollY === 0, null, { timeout: 5000 });
  await veilDown(page);
});

test('Products while the quiz gate holds section 4: the press opens it as Skip quiz does and lands on its top', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  const room = () => page.evaluate(() => { const r = document.getElementById('room')!; return { hidden: r.hasAttribute('hidden'), locked: r.hasAttribute('data-locked'), open: r.dataset.open ?? null }; });
  expect(await room()).toEqual({ hidden: true, locked: true, open: null });
  const heard = page.evaluate(() => new Promise<string>((r) => addEventListener('skreed:quiz-unlock', (e) => r((e as CustomEvent<{ by: string }>).detail.by), { once: true })));
  await page.locator('#siteNav .snav-list a[data-sec="room"]').click();
  expect(await heard).toBe('nav');
  await expect.poll(room).toEqual({ hidden: false, locked: false, open: 'nav' });
  await expect.poll(async () => page.evaluate(() => scrollY)).toBe(Math.round(await docTop(page, 'room')));
  await expect(page.locator('#siteNav .snav-list a[data-sec="room"]')).toHaveAttribute('aria-current', 'location');
  expect(await page.evaluate(() => sessionStorage.getItem('skreed:quiz-done'))).toBe('1');   // open for the rest of the visit
  expect((await events(page)).filter(([n]) => n === 'room_unlock')).toEqual([['room_unlock', { by: 'nav' }]]);
  await veilDown(page);
  await page.locator('#siteNav .snav-list a[data-sec="room"]').click();   // open now: a second press only jumps
  await veilDown(page);
  expect((await events(page)).filter(([n]) => n === 'room_unlock')).toHaveLength(1);
});

/** the 3D path on SwiftShader (?tier=hero3d), booted as room.spec.ts's open3d does, the intro skipped by its hook; the gate as the URL leaves it */
async function boot3d(page: Page, baseURL: string | undefined, query: string): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL(`/?tier=hero3d${query}`, baseURL).href);
  await page.waitForFunction(() => window.__heroStarted && !!window.__skreedIntro, null, { timeout: 540_000, polling: 500 });
  await page.evaluate(() => (window.__skreedIntro as unknown as { skip(): void }).skip());
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading') && typeof window.__skreedJump === 'function', null, { timeout: 300_000, polling: 500 });
}
const roomQ = (page: Page) => page.evaluate(() => (window.__s4?.state() as { q?: number } | null)?.q ?? null);

test('the 3D path, gate locked: a jump to the quiz leaves section 4\'s followers alone, so Skip quiz\'s ride still plays the third wipe', async ({ page, baseURL }) => {
  test.setTimeout(900_000);
  await boot3d(page, baseURL, '');
  await page.waitForFunction(() => window.__s4?.state() != null, null, { timeout: 120_000, polling: 500 });   // the director is in (it loads at idle after the intro)
  await page.locator('#siteNav .snav-list a[data-sec="quiz"]').click();
  await expect(page.locator('#toTopVeil')).toBeHidden({ timeout: 20_000 });
  expect(await page.evaluate(() => document.getElementById('room')!.hasAttribute('data-locked'))).toBe(true);
  await page.locator('#qzSkip').click();
  // through the ride and after it: q climbs from 0 to the hall's 1 and never past it (a landing measured against the
  // locked section's missing box put it thousands of screens deep, which drew the hall at once and walked it by itself)
  let most = 0;
  for (let i = 0; i < 40; i++) { const q = await roomQ(page); if (q !== null) most = Math.max(most, q); await page.waitForTimeout(100); }
  expect(most).toBeLessThan(1.05);
  await expect.poll(() => roomQ(page), { timeout: 20_000 }).toBeGreaterThan(0.95);
});

test('the 3D path, gate locked: a keyboard press on Products opens it, lands on the hall fully in, and leaves focus on the pad', async ({ page, baseURL }) => {
  test.setTimeout(900_000);
  await boot3d(page, baseURL, '');
  await page.locator('#siteNav .snav-list a[data-sec="room"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#toTopVeil')).toBeHidden({ timeout: 30_000 });
  expect(await page.evaluate(() => document.getElementById('room')!.dataset.open)).toBe('nav');
  expect(await page.evaluate(() => sessionStorage.getItem('skreed:quiz-done'))).toBe('1');
  const q = await roomQ(page);
  expect(Math.abs((q ?? -1) - 1)).toBeLessThan(0.02);
  await expect.poll(() => page.evaluate(() => document.activeElement?.id ?? ''), { timeout: 20_000 }).toBe('rmPad');
});

test('the 3D path: a keyboard press on Products leaves focus on the hall\'s pad', async ({ page, baseURL }) => {
  // the 3D path on SwiftShader (?tier=hero3d), booted as room.spec.ts's open3d does: the intro skipped by its hook, the hall in
  test.setTimeout(900_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=hero3d&room=open', baseURL).href);
  await page.waitForFunction(() => window.__heroStarted && !!window.__skreedIntro, null, { timeout: 540_000, polling: 500 });
  await page.evaluate(() => (window.__skreedIntro as unknown as { skip(): void }).skip());
  await page.waitForFunction(() => !document.documentElement.classList.contains('loading') && typeof window.__skreedJump === 'function', null, { timeout: 300_000, polling: 500 });
  await page.waitForFunction(() => window.__s4?.ready, null, { timeout: 300_000, polling: 500 });
  await page.locator('#siteNav .snav-list a[data-sec="room"]').focus();
  await page.keyboard.press('Enter');
  // the landing is the hall fully in: section 4's own follower is snapped to q 1 under the veil, so the third wipe does
  // not play again once the veil has lifted
  await expect(page.locator('#toTopVeil')).toBeVisible();
  await expect(page.locator('#toTopVeil')).toBeHidden({ timeout: 20_000 });
  const q = await page.evaluate(() => (window.__s4?.state() as { q?: number } | null)?.q ?? -1);
  expect(Math.abs(q - 1)).toBeLessThan(0.02);
  await expect.poll(() => page.evaluate(() => document.activeElement?.id ?? ''), { timeout: 20_000 }).toBe('rmPad');
  await page.waitForTimeout(1500);   // the hall's next frames: focus stays
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('rmPad');
});

test('the bar has no fill, box or shadow, and takes the logotype\'s tone', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  const look = () => page.evaluate(() => { const n = getComputedStyle(document.getElementById('siteNav')!), a = getComputedStyle(document.querySelector('#siteNav .snav-a')!); return { bg: n.backgroundColor, abg: a.backgroundColor, shadow: a.boxShadow, border: a.borderTopStyle, color: a.color }; });
  expect(await look()).toEqual({ bg: 'rgba(0, 0, 0, 0)', abg: 'rgba(0, 0, 0, 0)', shadow: 'none', border: 'none', color: PEARL });
  await page.evaluate(() => { document.getElementById('siteLogo')!.dataset.tone = 'light'; });
  await expect.poll(async () => (await look()).color).toBe(SLATE);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const width of [360, 1280]) {
    test(`at ${width} px the four section words are plain fragment links, and About a plain page link`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(new URL('/', baseURL).href);
      const links = page.locator('#siteNav .snav-list a');
      await expect(links).toHaveText(['Home', 'Families', 'Quiz', 'Products', 'About']);
      await expect(links.last()).toHaveAttribute('href', '/about/');
      await expect(page.locator('#siteNav .snav-menu')).toBeHidden();
      const boxes = await links.evaluateAll((els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right }; }));
      const logo = await page.locator('#siteLogo').evaluate((e) => e.getBoundingClientRect().bottom);
      for (const b of boxes) { expect(b.r).toBeLessThanOrEqual(width); if (width < 768) expect(b.y).toBeGreaterThanOrEqual(logo); }
      for (const b of boxes) expect(Math.abs(b.y - boxes[0].y)).toBeLessThanOrEqual(1);   // one row: About beside the four section words (AC9, AC11)
      await links.filter({ hasText: 'Quiz' }).click();
      await expect(page).toHaveURL(/#find$/);
    });
  }
});

test('About (AC11): last in the bar, a plain link to /about/, never current, no veil; the press is tracked and leaves for the page', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  const about = page.locator('#siteNav .snav-list a[data-page="about"]');
  await expect(about).toHaveText('About');
  await expect(about).toHaveAttribute('href', '/about/');
  expect(await about.getAttribute('data-sec')).toBeNull();
  expect(await about.getAttribute('aria-current')).toBeNull();
  expect(await page.locator('#siteNav .snav-list li:last-child a').getAttribute('data-page')).toBe('about');
  expect(await page.locator('#site-sections .snav-rows li:last-child a').getAttribute('data-page')).toBe('about');
  // the press, held back from navigating once, so the landing page's own record of it can be read
  await page.evaluate(() => { const hold = (e: Event) => e.preventDefault(); (window as unknown as { __hold: typeof hold }).__hold = hold; addEventListener('click', hold, true); });
  await about.click();
  expect((await events(page)).filter(([n]) => n === 'nav').pop()).toEqual(['nav', { to: 'about' }]);
  await page.waitForTimeout(300);
  await veilDown(page);   // no veil for a page link
  expect(await page.evaluate(() => scrollY)).toBe(0);   // and no jump
  expect(await about.getAttribute('aria-current')).toBeNull();
  await page.evaluate(() => removeEventListener('click', (window as unknown as { __hold: (e: Event) => void }).__hold, true));
  await about.click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.locator('main h1')).toHaveText('A message from our founder');
  await expect(page.locator('#siteNav')).toHaveCount(0);   // the About page carries no index: its wordmark is the way home
  await page.locator('a.site-logo').click();
  await expect(page).toHaveURL(/\/$/);
});

test('the phone: the drawer\'s About row leaves for /about/', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await page.locator('#siteNav .snav-menu').click();
  const row = page.locator('#site-sections a[data-page="about"]');
  await expect(row).toBeVisible();
  await expect(row).toHaveAttribute('href', '/about/');
  await row.click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.locator('main h1')).toHaveText('A message from our founder');
});

test('the phone: Back from About restores the landing page from the back-forward cache without the drawer (navbar.md D7)', async ({ baseURL }) => {
  // the runner launches Chromium with --disable-back-forward-cache, so this row launches its own with the cache allowed:
  // Playwright's full Chromium (the headless shell never caches), or CHROME_PATH where the environment names a browser
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: CHROME_PATH } : { channel: 'chromium' }), args: GL_ARGS, ignoreDefaultArgs: ['--disable-back-forward-cache'] });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    // a listener set before leaving survives only in a page restored from the cache; a reload starts a fresh document
    await context.addInitScript(() => { addEventListener('pageshow', (e) => { (window as unknown as { __shown: boolean[] }).__shown = [...((window as unknown as { __shown?: boolean[] }).__shown ?? []), e.persisted]; }); });
    const page = await context.newPage();
    await page.goto(new URL('/?tier=poster', baseURL).href);
    await page.locator('#siteNav .snav-menu').click();
    const sheet = page.locator('#site-sections');
    await expect.poll(async () => sheet.evaluate((e) => e.matches(':popover-open'))).toBe(true);
    await page.locator('#site-sections a[data-page="about"]').click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(page.locator('main h1')).toHaveText('A message from our founder');
    await page.goBack({ waitUntil: 'commit' });   // a restore from the cache fires pageshow, never load, so the row waits for the commit and polls
    await expect(page).toHaveURL(/\/\?tier=poster$/);
    const shown = () => page.evaluate(() => (window as unknown as { __shown?: boolean[] }).__shown ?? []);
    await expect.poll(async () => (await shown()).length, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);   // the first load's pageshow, then the restore's
    expect((await shown()).at(-1)).toBe(true);   // the page came back from the cache, as it does on a phone
    await expect.poll(async () => sheet.evaluate((e) => e.matches(':popover-open'))).toBe(false);   // and without the drawer: closed as the page left (pagehide)
  } finally { await browser.close(); }
});
