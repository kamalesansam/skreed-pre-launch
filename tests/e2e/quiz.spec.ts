// Section 3, the quiz (docs/specs/quiz.md 7): AC5 the deck by keyboard, "Not quite? Try again", a press while the chunk
// is in flight (replayed at mount), an aborted chunk (the button comes back) and the Tab order (the covered card takes no
// focus), AC6 the three paths through the UI (110101 Bubblegum, 111111 Sunflower, 011110 Cinnamon, each with the name,
// family line, finish, persona, paragraph and link scoreQuiz gives), AC8 the gift form against a mocked /api/quiz-lead
// (page.route): validation on blur and on an empty submit, 500, 200 and "Not you?", 409 and 422, the offline queue and
// its re-send, "Still trying..." at 8 s and the abort at 20 s, AC9 reduced motion (no transform animation on the
// committed card, no rise of the deck) and AC4 no horizontal scroll at 390 x 844 and across the widths of CHECKLIST G10.
// The quiz needs no island, so the specs run on the poster tier (?tier=poster; the test build lands there without an
// override too) and scroll the section in with scrollTo at its own top (17.2 screens on the 3D path, where __skreedSnap
// pins the followers once the island installed it). The test build has PUBLIC_HERO_HOOKS=1, so the gift form renders.
import { test, expect, type Page } from '@playwright/test';
import { QUIZ_COPY as Q, scoreQuiz, resultHref, type Answer, type QuizResult } from '../../src/config/quiz.ts';

/** the lazy chunk (deck.ts with config/quiz.ts), imported by Quiz.astro's loader within a screen of the section */
const DECK = /\/deck\.[^/?]*\.js(\?.*)?$/;   // with the loader's retry query (?r=) too
/** a six-answer word (left = 1), the arrows that give it, and the result config/quiz.ts scores for it */
const path = (word: string) => { const answers = word.split('').map(Number) as Answer[]; return { word, keys: answers.map((a) => (a ? 'ArrowLeft' : 'ArrowRight')), r: scoreQuiz(answers) }; };
const BUBBLEGUM = path('110101'), SUNFLOWER = path('111111'), CINNAMON = path('011110');
const EMAIL = 'quiz@example.com';
type Ev = [string, Record<string, string | number>];
const events = (page: Page): Promise<Ev[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: { name: string; props: Record<string, string | number> }[] }).__skreedEvents ?? []).map((e) => [e.name, e.props] as [string, Record<string, string | number>]));

/** the poster tier with the section's top at the viewport's top (the 3D path's 17.2 screens), the fonts in and, unless
 *  `chunk` is false, the deck chunk fetched: the observer asks for it at the scroll, and a press that lands while it is
 *  in flight is swallowed by the loader (the AC5 pending test), so every other test presses once the chunk is in */
async function openQuiz(page: Page, baseURL: string | undefined, chunk = true): Promise<void> {
  const deck = chunk ? page.waitForResponse(DECK) : null;
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await expect(page.locator('html')).toHaveClass('js poster');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { const top = document.getElementById('find')!.getBoundingClientRect().top + scrollY; scrollTo(0, top); window.__skreedSnap?.(top / innerHeight); });
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'intro');
  await expect(page.locator('#qzBegin')).toBeInViewport();
  if (deck) await (await deck).finished();
}

/** card i on top and focused (the arrows go to the focused card; a press during the fly-off is ignored, so each card is awaited) */
async function onTop(page: Page, i: number): Promise<void> {
  const card = page.locator(`.qz-card[data-i="${i}"]`);
  await expect(card).toHaveClass(/is-top/);
  await expect(card).toBeFocused();
}

/** "Swipe to begin" with the chunk in (openQuiz): the press begins at once */
async function begin(page: Page): Promise<void> {
  await page.locator('#qzBegin').click();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await expect(page.locator('#qzIntro')).toBeHidden();
  await onTop(page, 0);
}

async function answer(page: Page, keys: string[], from = 0): Promise<void> {
  for (let i = from; i < keys.length; i++) { await onTop(page, i); await page.keyboard.press(keys[i]); }
}

/** the one shown result is r's (AC6): family and swatch, name, family line, finish, persona, paragraph and link */
async function expectResult(page: Page, r: QuizResult): Promise<void> {
  const shown = page.locator('.qz-result:not([hidden])');
  await expect(shown).toHaveCount(1);
  await expect(shown).toHaveAttribute('data-family', r.family);
  await expect(shown.locator('.qz-big')).toHaveAttribute('data-shade', r.shade);
  await expect(shown.locator('a.btn')).toHaveAttribute('href', resultHref(r));
  for (const [sel, text] of [['.qz-shade', `${r.name}.`], ['.qz-fam', Q.fam(r.familyName, r.index)], ['.qz-finish', Q.finish(r.finish)], ['.qz-persona', `${r.persona}. ${r.tagline}`], ['.qz-text', r.text]]) await expect(shown.locator(sel), sel).toHaveText(text);
}

/** every frame for `ms`: the element's inline transform, its computed transform and the properties its running animations touch */
function sample(page: Page, sel: string, ms: number): Promise<string[]> {
  return page.evaluate(([sel, ms]) => new Promise<string[]>((res) => {
    const seen = new Set<string>(), t0 = performance.now();
    const tick = () => {
      const el = document.querySelector<HTMLElement>(sel);
      if (el) seen.add(`${el.style.transform}|${getComputedStyle(el).transform}|${el.getAnimations().map((a) => Object.keys((a.effect as KeyframeEffect).getKeyframes()[0] ?? {}).filter((k) => !/^(offset|computedOffset|easing|composite)$/.test(k)).join(',')).join(';')}`);
      if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res([...seen]);
    };
    tick();
  }), [sel, ms] as const);
}

test('AC5 and AC6: six arrows score the word 110101; the result shows Bubblegum in full with its announcement and focus on the shade; the events queue', async ({ page, baseURL }) => {
  await openQuiz(page, baseURL);
  await begin(page);
  // the fly-off in normal motion moves the card (the sampler of AC9 sees a transform here, so its silence there means something)
  const flight = sample(page, '.qz-card[data-i="0"]', 400);
  await page.keyboard.press(BUBBLEGUM.keys[0]);
  expect((await flight).some((s) => s.split('|')[1] !== 'none' && /transform/.test(s.split('|')[2]))).toBe(true);
  await answer(page, BUBBLEGUM.keys, 1);
  const r = BUBBLEGUM.r;
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  await expectResult(page, r);
  await expect(page.locator('#qzLive')).toHaveText(`${Q.eyebrow}: ${r.name}. ${r.persona}.`);
  await expect(page.locator('.qz-result:not([hidden]) .qz-shade')).toBeFocused();
  await expect(page.locator('#qzDeck')).toBeHidden();
  await expect(page.locator('#qzGift')).toBeVisible();
  await expect(page.locator('#qzForm')).toHaveAttribute('data-shade', r.shade);
  expect(await events(page)).toEqual([['quiz_start', {}], ...BUBBLEGUM.keys.map((k, i): Ev => ['quiz_answer', { q: i + 1, side: k === 'ArrowLeft' ? 'left' : 'right' }]), ['quiz_complete', { family: r.family, shade: r.shade }]]);
});

test('AC5 "Not quite? Try again" returns to card 1 with no data-done dots and the gift hidden; the second run scores 111111 Sunflower afresh', async ({ page, baseURL }) => {
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, BUBBLEGUM.keys);
  await expect(page.locator('#qzGift')).toBeVisible();
  await page.locator('.qz-result:not([hidden]) .qz-retry').click();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
  await expect(page.locator('.qz-card.is-top .qz-dot')).toHaveCount(6);
  await expect(page.locator('.qz-card.is-top .qz-dot[data-done]')).toHaveCount(0);
  await expect(page.locator('.qz-card[data-i="1"]')).toHaveClass(/is-next/);
  await expect(page.locator('#qzResults')).toBeHidden();
  await expect(page.locator('#qzGift')).toBeHidden();
  await answer(page, SUNFLOWER.keys);
  await expectResult(page, SUNFLOWER.r);
  expect((await events(page)).map((e) => e[0]).filter((n) => n !== 'quiz_answer')).toEqual(['quiz_start', 'quiz_complete', 'quiz_retake', 'quiz_complete']);
});

// AC5's pending path (quiz.md 7 item 5, D18) with the chunk held by a route after the observer asked for it: Quiz.astro's
// loader keys on the chunk having mounted, not on the import having started, so a press that lands while the fetch is in
// flight shows "Loading..." with aria-disabled and aria-busy, keeps focus, and the quiz begins by itself on arrival.
test('AC5 a press while the chunk is in flight shows "Loading..." with aria-disabled and aria-busy, keeps focus, and begins by itself on arrival', async ({ page, baseURL }) => {
  let release = (): void => undefined; const held = new Promise<void>((r) => { release = r; });
  await page.route(DECK, async (route) => { await held; await route.continue(); });
  const requested = page.waitForRequest(DECK);
  await openQuiz(page, baseURL, false);
  await requested;   // the observer has asked for the chunk and the route holds it
  const button = page.locator('#qzBegin');
  await button.click();
  await expect(button).toHaveText(Q.loading, { timeout: 3000 });
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toBeFocused();
  release();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
});

test('AC8 the gift form: blur with a value validates and an empty submit shows both errors and focuses the email; 500 keeps the values; 200 shows the done text and "Not you?" reopens an empty form; 409 the duplicate line; 422 the email error', async ({ page, baseURL }) => {
  let status = 500;
  const posts: string[] = [];
  await page.route('**/api/quiz-lead', (route) => { posts.push(route.request().postData() ?? ''); void route.fulfill({ status, contentType: 'application/json', body: '{}' }); });
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, BUBBLEGUM.keys);
  const r = BUBBLEGUM.r;
  const email = page.locator('#qzEmail'), consent = page.locator('#qzConsent'), send = page.locator('#qzSend'), done = page.locator('.qz-done-text'), errEmail = page.locator('#qzErrEmail');
  await expect(page.locator('#qzGift')).toBeVisible();
  // a value is validated on blur, never per keystroke
  await email.fill('nope'); await expect(errEmail).toHaveText(''); await email.blur();
  await expect(errEmail).toHaveText(Q.errEmail);
  await email.fill(''); await send.click();
  await expect(errEmail).toHaveText(Q.errEmail);
  await expect(page.locator('#qzErrConsent')).toHaveText(Q.errConsent);
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(consent).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toBeFocused();
  expect(posts).toEqual([]);
  // 500: the line under the button, the values kept, the button back to its label (aria-disabled, never disabled)
  await email.fill(EMAIL); await consent.check(); await send.click();
  await expect(page.locator('#qzMsg')).toHaveText(Q.errSend);
  await expect(email).toHaveValue(EMAIL);
  await expect(consent).toBeChecked();
  await expect(send).toHaveText(Q.send);
  await expect(send).toHaveAttribute('aria-disabled', 'false');
  await expect(send).toBeEnabled();
  expect(JSON.parse(posts[0])).toEqual({ email: EMAIL, shadeId: r.shade, familyId: r.family, finish: r.finish, answers: BUBBLEGUM.word, source: 'quiz' });
  // 200: the done block with the address and focus; "Not you?" reopens an empty form on the email
  status = 200; await send.click();
  await expect(done).toHaveText(Q.done(EMAIL));
  await expect(done).toBeFocused();
  await expect(page.locator('.qz-fields')).toBeHidden();
  await page.locator('.qz-notyou').click();
  await expect(page.locator('.qz-fields')).toBeVisible();
  await expect(page.locator('#qzDone')).toBeHidden();
  await expect(email).toHaveValue('');
  await expect(consent).not.toBeChecked();
  await expect(email).toBeFocused();
  await expect(errEmail).toHaveText('');
  // 409: the duplicate line in the done block
  status = 409; await email.fill('again@example.com'); await consent.check(); await send.click();
  await expect(done).toHaveText(Q.dup);
  // 422: the form again with the email error and the value kept, the done block hidden
  status = 422; await page.locator('.qz-notyou').click(); await email.fill('typo@example.com'); await consent.check(); await send.click();
  await expect(errEmail).toHaveText(Q.errEmail);
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveValue('typo@example.com');
  await expect(page.locator('#qzDone')).toBeHidden();
  await expect(send).toHaveText(Q.send);
  expect(posts).toHaveLength(4);
  expect((await events(page)).filter(([n]) => n.startsWith('lead_'))).toEqual([['lead_submit', {}], ['lead_error', { kind: 'network' }], ['lead_submit', {}], ['lead_success', {}], ['lead_submit', {}], ['lead_error', { kind: 'duplicate' }], ['lead_submit', {}], ['lead_error', { kind: 'invalid' }]]);
});

test('AC9 reduced motion: the deck does not rise and the committed card never translates during the fly-off; the quiz still works', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await openQuiz(page, baseURL);
  const rise = sample(page, '#qzDeck', 1000);
  await page.locator('#qzBegin').click();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
  expect(await rise).toEqual(['|none|']);   // through the intro's fade and the 400 ms a rise would take: no transform, no animation on the deck
  const flight = sample(page, '.qz-card[data-i="0"]', 400);
  await page.keyboard.press('ArrowLeft');
  for (const s of await flight) {
    const [inline, computed, animated] = s.split('|');
    expect(inline, s).not.toContain('translate');
    expect(computed, s).toBe('none');
    expect(animated, s).not.toMatch(/transform/);
  }
  await onTop(page, 1);
  await expect(page.locator('.qz-card[data-i="0"]')).toBeHidden();
  await answer(page, BUBBLEGUM.keys, 1);
  await expectResult(page, BUBBLEGUM.r);
  await ctx.close();
});

test('AC4 at 390 x 844 nothing scrolls sideways through the intro, a card (and its fly-off) and the result (011110 Cinnamon)', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const fits = async (at: string) => expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= innerWidth), at).toBe(true);
  await openQuiz(page, baseURL);
  await fits('intro');
  await begin(page);
  await fits('card 1');
  const during = page.evaluate(() => new Promise<boolean>((res) => { let ok = true; const t0 = performance.now(); const tick = () => { ok &&= document.scrollingElement!.scrollWidth <= innerWidth; if (performance.now() - t0 < 400) requestAnimationFrame(tick); else res(ok); }; tick(); }));
  await page.keyboard.press(CINNAMON.keys[0]);
  expect(await during, 'during the fly-off').toBe(true);
  await answer(page, CINNAMON.keys, 1);
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  await expectResult(page, CINNAMON.r);
  await expect(page.locator('#qzGift')).toBeVisible();
  await fits('result and gift');
  await ctx.close();
});

test('AC5 the Tab order: from the focused card two Tabs reach its two options and the third leaves the deck; the covered next card takes no focus', async ({ page, baseURL }) => {
  await openQuiz(page, baseURL);
  await begin(page);
  const active = () => page.evaluate(() => { const a = document.activeElement as HTMLElement; return `${a.tagName.toLowerCase()}${a.className ? '.' + a.className.split(' ').join('.') : ''}${a.closest('.qz-card') ? '@' + (a.closest('.qz-card') as HTMLElement).dataset.i : ''}`; });
  await page.keyboard.press('Tab'); expect(await active()).toBe('button.qz-opt@0');
  await page.keyboard.press('Tab'); expect(await active()).toBe('button.qz-opt@0');
  await page.keyboard.press('Tab');
  const third = await active();
  expect(third, 'the third Tab leaves the deck').not.toMatch(/@/);
  expect(await page.locator('.qz-card.is-next').evaluate((c) => (c as HTMLElement).inert)).toBe(true);
  // Shift+Tab back onto the card, and the arrows still commit there
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab');
  await onTop(page, 0);
  await page.keyboard.press('ArrowLeft');
  await onTop(page, 1);
});

test('AC5 an aborted chunk gives "Swipe to begin" back, and the next press begins once the chunk can load', async ({ page, baseURL }) => {
  let abort = true;
  await page.route(DECK, (route) => (abort ? route.abort('failed') : route.continue()));
  await openQuiz(page, baseURL, false);
  const button = page.locator('#qzBegin');
  await expect(button).toHaveText(Q.begin);   // the observer's import failed and the loader reset itself
  await expect(button).not.toHaveAttribute('aria-disabled', 'true');
  await button.click();   // tries again while the route still aborts: the button goes to "Loading..." and comes back
  await expect(button).toHaveText(Q.begin);
  await expect(button).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'intro');
  abort = false;
  await button.click();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
});

test('AC8 offline: the lead is queued under skreed-quiz-lead with the offline line, and re-sent when the connection returns', async ({ page, context, baseURL }) => {
  const posts: string[] = [];
  let offline = false;   // a routed request is answered even with the context offline, so the route fails it like a dead network while the flag is on
  await page.route('**/api/quiz-lead', (route) => { if (offline) return route.abort('internetdisconnected'); posts.push(route.request().postData() ?? ''); return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, BUBBLEGUM.keys);
  const done = page.locator('.qz-done-text');
  await page.locator('#qzEmail').fill(EMAIL); await page.locator('#qzConsent').check();
  offline = true; await context.setOffline(true);
  await page.locator('#qzSend').click();
  await expect(done).toHaveText(Q.offline);
  await expect(page.locator('.qz-notyou')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('skreed-quiz-lead') ?? 'null'))).toMatchObject({ email: EMAIL, shadeId: BUBBLEGUM.r.shade, answers: BUBBLEGUM.word });
  expect(posts).toEqual([]);
  offline = false; await context.setOffline(false);
  await expect(done).toHaveText(Q.done(EMAIL));
  expect(posts).toHaveLength(1);
  expect(await page.evaluate(() => sessionStorage.getItem('skreed-quiz-lead'))).toBeNull();
  expect((await events(page)).filter(([n]) => n.startsWith('lead_'))).toEqual([['lead_submit', {}], ['lead_success', {}]]);
});

test('AC8 a slow route: "Still trying..." at 8 s, the error line and a timeout event at 20 s, the values kept', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await page.route('**/api/quiz-lead', async (route) => { await new Promise((r) => setTimeout(r, 25_000)); await route.fulfill({ status: 200, body: '{}' }).catch(() => undefined); });
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, BUBBLEGUM.keys);
  const send = page.locator('#qzSend');
  await page.locator('#qzEmail').fill(EMAIL); await page.locator('#qzConsent').check();
  await send.click();
  await expect(send).toHaveText(Q.sending);
  await expect(send).toHaveAttribute('aria-disabled', 'true');
  await expect(send).toHaveText(Q.trying, { timeout: 10_000 });
  await expect(page.locator('#qzMsg')).toHaveText(Q.errSend, { timeout: 15_000 });
  await expect(send).toHaveText(Q.send);
  await expect(send).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('#qzEmail')).toHaveValue(EMAIL);
  expect((await events(page)).filter(([n]) => n.startsWith('lead_'))).toEqual([['lead_submit', {}], ['lead_error', { kind: 'timeout' }]]);
});

for (const [w, h] of [[360, 780], [430, 932], [768, 1024], [1024, 768], [1280, 800], [844, 390]] as const) {
  test(`AC4 at ${w} x ${h}: the intro, a card, the result and the gift fit the width, the panels sit inside the gutters and the card keeps its padding`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const fits = async (at: string) => {
      const m = await page.evaluate(() => {
        const panels = [...document.querySelectorAll<HTMLElement>('.qz-panel')].filter((p) => p.offsetParent !== null).map((p) => p.getBoundingClientRect());
        return { wide: document.scrollingElement!.scrollWidth <= innerWidth, left: Math.min(...panels.map((r) => r.left)), right: Math.max(...panels.map((r) => r.right)), n: panels.length };
      });
      expect(m.wide, `${at}: no horizontal scroll`).toBe(true);
      expect(m.n, `${at}: a panel is shown`).toBeGreaterThan(0);
      expect(m.left, `${at}: left gutter`).toBeGreaterThanOrEqual(16);
      expect(m.right, `${at}: right gutter`).toBeLessThanOrEqual(w - 16);
    };
    await openQuiz(page, baseURL);
    await fits('intro');
    await begin(page);
    await fits('card');
    const pad = await page.locator('.qz-card.is-top').evaluate((c) => { const r = c.getBoundingClientRect(), q = c.querySelector('.qz-q')!.getBoundingClientRect(), s = c.querySelector('.qz-step')!.getBoundingClientRect(); return { top: q.top - r.top, bottom: r.bottom - s.bottom }; });
    expect(pad.top, 'the question keeps the card\'s top padding').toBeGreaterThanOrEqual(20);
    expect(pad.bottom, 'the stepper keeps the card\'s bottom padding').toBeGreaterThanOrEqual(20);
    await answer(page, CINNAMON.keys);
    await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
    await fits('result');
    await page.evaluate(() => document.getElementById('qzGift')!.scrollIntoView({ block: 'end' }));
    await fits('gift');
    await ctx.close();
  });
}
