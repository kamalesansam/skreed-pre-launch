// Section 3, the quiz (docs/specs/quiz.md 7), on the content Sam sent on 2026-10-16: ten questions of seven answers, one
// per personality, scored by scoreQuiz and drawn by pickShade (src/config/quiz.ts). AC5 and AC6: ten answers for The
// Quiet Curator give Porcelain in full with Math.random pinned at 0.01 (each group's first shade), the answer marked
// before its card flies off to the left; a tie settled by the tied personality picked most recently, with Math.random at
// 0.5 (the group's middle shade); Back to the previous card with the answer corrected; the deck by keyboard (Down and Up
// among the answers, Enter and Space, the Tab order with the next card inert); "Not quite? Try again" with a second draw
// from the same group; a press while the chunk is in flight (replayed at mount) and an aborted chunk (a press retries
// through a fresh URL, "Loading..." until that fails, then the button comes back). AC8 the gift form against a mocked /api/quiz-lead (page.route): validation on blur and on an empty submit, 500,
// 200 and "Not you?", 409 and 422, the payload with the personality and the ten answers, the offline queue and its
// re-send, "Still trying..." at 8 s and the abort at 20 s. AC9 reduced motion (no transform on the committed card, no
// rise of the deck) and AC4 no horizontal scroll at 390 x 844 and across the widths of CHECKLIST G10, with the gutters
// and the card's padding. The quiz needs no island, so the specs run on the poster tier (?tier=poster; the test build
// lands there without an override too) and scroll the section in with scrollTo at its own top (17.2 screens on the 3D
// path, where __skreedSnap pins the followers once the island installed it). The test build has PUBLIC_HERO_HOOKS=1, so
// the gift form renders.
import { test, expect, type Page } from '@playwright/test';
import { QUIZ_COPY as Q, QUIZ_PERSONAS, QUIZ_QUESTIONS, needsRing, pickShade, scoreQuiz, shadeHref, type Persona, type PersonaId } from '../../src/config/quiz.ts';
import { SHADES } from '../../src/config/shades.gen.ts';

/** the lazy chunk (deck.ts with config/quiz.ts), imported by Quiz.astro's loader within a screen of the section */
const DECK = /\/deck\.[^/?]*\.js(\?.*)?$/;   // with the loader's retry query (?r=) too
const EMAIL = 'quiz@example.com';
/** ten answers for The Quiet Curator */
const CURATOR: PersonaId[] = Array<PersonaId>(10).fill('curator');
/** a three-way tie with The Romantic Rebel in the middle twice over: The Warm Optimist, the Rebel and The Dreamer three
 *  each, first picked in that order, listed in that order in QUIZ_PERSONAS; the Optimist reaches three first (card 7),
 *  the Rebel is picked last among the three (card 9) and the last card goes to none of them. So the first picked, the
 *  last first picked (a `>=` over the count Map), the first to three, the first or last in the list and the last answer
 *  all give someone else, and only the tie rule (the tied personality picked most recently) gives the Rebel */
const TIE: PersonaId[] = ['optimist', 'rebel', 'dreamer', 'optimist', 'rebel', 'dreamer', 'optimist', 'dreamer', 'rebel', 'main'];
/** Back: three answers, then card 3 answered again (The Dreamer for The Spark), which changes the result */
const BEFORE: PersonaId[] = ['dreamer', 'dreamer', 'spark'];
const FIXED: PersonaId[] = ['dreamer', 'dreamer', 'dreamer', 'main', 'strategist', 'optimist', 'rebel', 'curator', 'spark', 'main'];
const URBAN_SLATE = 'rgb(56, 63, 67)';   // #383F43, the fill of the answer taken

type Ev = [string, Record<string, string | number>];
const events = (page: Page): Promise<Ev[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: { name: string; props: Record<string, string | number> }[] }).__skreedEvents ?? []).map((e) => [e.name, e.props] as [string, Record<string, string | number>]));
/** the quiz_answer events for answers[from] onwards */
const answered = (answers: PersonaId[], from = 0): Ev[] => answers.slice(from).map((persona, k) => ['quiz_answer', { q: from + k + 1, persona }]);

const byId = new Map(SHADES.map((s) => [s.id, s]));
const familyName = (f: string) => f.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
/** a compatible shade as the result paints it: id, swatch colour and whether it carries the hairline */
const mini = (id: string) => { const s = byId.get(id)!; return `${id}|${rgb(s.hex)}|${needsRing(s.hex)}`; };

interface Drawn { p: Persona; shade: string; others: string[]; family: string; name: string; fam: string; href: string; ring: boolean; rgb: string }
/** the result for ten answers with Math.random pinned at v: scoreQuiz's personality, pickShade's draw, and the shade's
 *  name, family line, link and hairline as Quiz.astro resolves them from the catalog at build */
function drawn(answers: PersonaId[], v: number): Drawn {
  const p = scoreQuiz(answers), { shade, others } = pickShade(p, () => v), s = byId.get(shade)!;
  return { p, shade, others, family: s.family, name: s.name, fam: Q.fam(familyName(s.family), s.index), href: shadeHref(s.family, s.n), ring: needsRing(s.hex), rgb: rgb(s.hex) };
}

/** Math.random pinned before any of the page's scripts run, so the shade draw is known: 0.01 gives each group's first
 *  shade, 0.5 its middle one (the fourth of six or seven) */
const pin = (page: Page, v: number): Promise<void> => page.addInitScript((v) => { Math.random = () => v; }, v);

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

/** card i on top and focused (a press during the fly-off is ignored, so each card is awaited) */
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

/** cards from..9 answered by a click on the top card's answer for each personality (the click waits out the next card's
 *  scale-in, as Playwright waits for a stable target) */
async function answer(page: Page, personas: PersonaId[], from = 0): Promise<void> {
  for (let i = from; i < personas.length; i++) {
    await onTop(page, i);
    await page.locator(`.qz-card.is-top .qz-opt[data-persona="${personas[i]}"]`).click();
  }
}

/** the one shown result is r's (AC6): personality and finish, the drawn shade large (its colour from the catalog token,
 *  the hairline where it needs one), name, family line, finish, personality, profile, colour profile, the compatible
 *  shades (the rest of the group in its order, painted, the drawn one hidden) and the link */
async function expectResult(page: Page, r: Drawn): Promise<void> {
  // the result state first: after a retry the previous run's article keeps its attributes under the hidden container
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  const shown = page.locator('.qz-result:not([hidden])');
  await expect(shown).toHaveCount(1);
  await expect(shown).toHaveAttribute('data-persona', r.p.id);
  await expect(shown).toHaveAttribute('data-finish', r.p.finish);
  const big = shown.locator('.qz-big');
  await expect(big).toHaveAttribute('data-shade', r.shade);
  if (r.ring) await expect(big).toHaveAttribute('data-ring', ''); else await expect(big).not.toHaveAttribute('data-ring');
  await expect(big).toHaveCSS('background-color', r.rgb);
  for (const [sel, text] of [['.qz-eyebrow', Q.eyebrow], ['.qz-shade', `${r.name}.`], ['.qz-fam', r.fam], ['.qz-finish', Q.finish(r.p.finish)], ['.qz-persona', r.p.name], ['.qz-text', r.p.profile], ['.qz-palette', r.p.palette], ['.qz-also-h', Q.also], ['.qz-own', Q.own], ['.qz-see', Q.see], ['.qz-retry', Q.retry]]) await expect(shown.locator(sel), sel).toHaveText(text);
  const minis = shown.locator('.qz-mini:not([hidden])');
  await expect(minis).toHaveCount(r.others.length);
  await expect(minis.locator('.qz-mini-name')).toHaveText(r.others.map((id) => byId.get(id)!.name));
  expect(await minis.evaluateAll((els) => els.map((m) => `${m.dataset.shade}|${getComputedStyle(m.querySelector('.qz-mini-sw')!).backgroundColor}|${m.hasAttribute('data-ring')}`))).toEqual(r.others.map(mini));
  await expect(shown.locator('a.qz-see')).toHaveAttribute('href', r.href);
}

/** every frame while the element is shown: its inline transform, its computed transform, the properties its running
 *  animations touch, and the answer marked inside it (its personality and fill). 'gone' samples until the element is
 *  hidden again (a card that has flown off); a number samples for that many ms from the frame it is first shown (the
 *  deck's rise). The window follows the page, not the moment of the press, so a slow machine cannot close it before the
 *  motion starts; 10 s caps it */
function sample(page: Page, sel: string, stop: 'gone' | number): Promise<string[]> {
  return page.evaluate(([sel, stop]) => new Promise<string[]>((res) => {
    const seen = new Set<string>(), t0 = performance.now();
    let shownAt = -1;
    const tick = () => {
      const el = document.querySelector<HTMLElement>(sel), now = performance.now();
      if (el && !el.hidden) {
        if (shownAt < 0) shownAt = now;
        const b = el.querySelector<HTMLElement>('[aria-pressed="true"]');
        seen.add(`${el.style.transform}|${getComputedStyle(el).transform}|${el.getAnimations().map((a) => Object.keys((a.effect as KeyframeEffect).getKeyframes()[0] ?? {}).filter((k) => !/^(offset|computedOffset|easing|composite)$/.test(k)).join(',')).join(';')}|${b ? `${b.dataset.persona}:${getComputedStyle(b).backgroundColor}` : ''}`);
      }
      const done = shownAt >= 0 && (stop === 'gone' ? !el || el.hidden : now - shownAt >= stop);
      if (done || now - t0 > 10_000) res([...seen]); else requestAnimationFrame(tick);
    };
    tick();
  }), [sel, stop] as const);
}

test('AC5 and AC6: ten answers for The Quiet Curator with Math.random at 0.01 give Porcelain in full; the answer is marked before its card flies off to the left; the announcement, the focus and the events queue', async ({ page, baseURL }) => {
  const r = drawn(CURATOR, 0.01);
  // the result as literals, so the derivation every other test leans on is pinned here once: the catalog's name and
  // family line, the link with the three-digit number (AC10 samples Porcelain as ?shade=010), and Sam's profile and
  // colour profile in his words (his dash written as a full stop, CLAUDE.md rule 16)
  expect({ persona: r.p.name, shade: r.shade, name: r.name, fam: r.fam, finish: Q.finish(r.p.finish), href: r.href, ring: r.ring, profile: r.p.profile, palette: r.p.palette })
    .toEqual({ persona: 'The Quiet Curator', shade: 'frosty-white-10', name: 'Porcelain', fam: 'Frosty White, shade 10 of 24', finish: 'Best in matte.', href: '/shades/frosty-white/?shade=010', ring: true,
      profile: 'You curate your life the way you’d curate a gallery. Nothing stays unless it earns its place. You’re thoughtful, observant, and quietly confident. You have a calming presence and an eye for the understated. You choose with intention, gravitating towards things that feel balanced, timeless, and effortlessly distinctive rather than simply trendy.',
      palette: 'Soft, warm neutrals with quiet depth. Your palette doesn’t shout.' });
  expect(r.others.map((id) => byId.get(id)!.name)).toEqual(['Stone', 'Almond', 'Sage', 'Pale Grey', 'Powder', 'Linen']);
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  // card 1 by click, sampled: the answer fills Urban Slate while the card stands, then the card flies off to the left
  // still marked (the sampler of AC9 sees the transform here, so its silence there means something)
  const flight = sample(page, '.qz-card[data-i="0"]', 'gone');
  await page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]').click();
  const frames = (await flight).map((s) => s.split('|'));
  const PRESSED = `curator:${URBAN_SLATE}`;
  const marked = frames.findIndex(([, computed, animated, pressed]) => pressed === PRESSED && computed === 'none' && animated === '');
  const flying = frames.filter(([, computed, animated]) => computed !== 'none' && /transform/.test(animated));
  expect(marked, 'the answer is filled while its card still stands').toBeGreaterThanOrEqual(0);
  expect(flying.length, 'then the card flies off').toBeGreaterThan(0);
  expect(frames.indexOf(flying[0]), 'the mark comes first').toBeGreaterThan(marked);
  for (const f of flying) expect(f[3], 'the answer stays marked as its card leaves').toBe(PRESSED);
  const tx = flying.map(([, computed]) => Number(/matrix\(([^)]+)\)/.exec(computed)![1].split(',')[4]));
  expect(Math.max(...tx), 'never to the right').toBeLessThanOrEqual(0);
  expect(Math.min(...tx), 'well off to the left').toBeLessThan(-50);
  await answer(page, CURATOR, 1);
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  await expectResult(page, r);
  await expect(page.locator('#qzLive')).toHaveText(`${Q.eyebrow}: Porcelain. The Quiet Curator.`);
  await expect(page.locator('.qz-result:not([hidden]) .qz-shade')).toBeFocused();
  await expect(page.locator('#qzDeck')).toBeHidden();
  await expect(page.locator('#qzGift')).toBeVisible();
  const form = page.locator('#qzForm');
  for (const [k, v] of [['shade', r.shade], ['family', 'frosty-white'], ['finish', 'matte'], ['persona', 'curator']]) await expect(form, k).toHaveAttribute(`data-${k}`, v);
  expect(await events(page)).toEqual([['quiz_start', {}], ...answered(CURATOR), ['quiz_complete', { persona: 'curator', shade: 'frosty-white-10', others: r.others.join(',') }]]);
});

test('AC6 a tie: The Warm Optimist, The Romantic Rebel and The Dreamer three each, the Rebel picked last among them, give The Romantic Rebel; Math.random at 0.5 draws the group\'s fourth shade, Blush', async ({ page, baseURL }) => {
  const count = (id: PersonaId) => TIE.filter((a) => a === id).length;
  expect(QUIZ_PERSONAS.map((p) => count(p.id)), 'three each for the Optimist, the Rebel and the Dreamer, fewer for the rest').toEqual([1, 0, 0, 3, 3, 3, 0]);
  // every other way to break this tie gives someone else (TIE's comment)
  const tied: PersonaId[] = ['optimist', 'rebel', 'dreamer'];
  const firstPicks = [...new Set(TIE)].filter((a) => tied.includes(a)), listed = QUIZ_PERSONAS.map((p) => p.id).filter((id) => tied.includes(id));
  expect({ firstPicked: firstPicks[0], lastFirstPicked: firstPicks[firstPicks.length - 1], firstToThree: [...tied].sort((a, b) => TIE.lastIndexOf(a) - TIE.lastIndexOf(b))[0], listFirst: listed[0], listLast: listed[listed.length - 1], lastAnswer: TIE[9] })
    .toEqual({ firstPicked: 'optimist', lastFirstPicked: 'dreamer', firstToThree: 'optimist', listFirst: 'optimist', listLast: 'dreamer', lastAnswer: 'main' });
  const r = drawn(TIE, 0.5);
  expect([r.p.id, r.shade, r.name]).toEqual(['rebel', 'playful-pink-03', 'Blush']);
  await pin(page, 0.5);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, TIE);
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  await expectResult(page, r);
  await expect(page.locator('#qzLive')).toHaveText(`${Q.eyebrow}: ${r.name}. ${r.p.name}.`);
  await expect(page.locator('.qz-result:not([hidden]) .qz-shade')).toBeFocused();
  expect(await events(page)).toEqual([['quiz_start', {}], ...answered(TIE), ['quiz_complete', { persona: 'rebel', shade: r.shade, others: r.others.join(',') }]]);
});

test('AC5 Back: absent on card 1; after three answers it brings card 3 back on top with two dots done and no answer marked; answered again, the result follows the corrected answers', async ({ page, baseURL }) => {
  const uncorrected = [...BEFORE, ...FIXED.slice(BEFORE.length)];
  expect(scoreQuiz(uncorrected).id, 'the correction changes the result').not.toBe(scoreQuiz(FIXED).id);
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  await expect(page.locator('.qz-card[data-i="0"] .qz-back')).toHaveCount(0);
  await expect(page.locator('.qz-back')).toHaveCount(QUIZ_QUESTIONS.length - 1);
  await answer(page, BEFORE);
  await onTop(page, 3);
  const back = page.locator('.qz-card.is-top .qz-back');
  await expect(back).toHaveText(Q.back);
  await back.click();
  await onTop(page, 2);
  await expect(page.locator('.qz-card.is-top .qz-dot')).toHaveCount(10);
  await expect(page.locator('.qz-card.is-top .qz-dot[data-done]')).toHaveCount(2);
  await expect(page.locator('.qz-card.is-top .qz-opt[aria-pressed]')).toHaveCount(0);
  await expect(page.locator('.qz-card[data-i="3"]')).toHaveClass(/is-next/);
  await expect(page.locator('.qz-card[data-i="1"]')).toBeHidden();
  await answer(page, FIXED, 2);
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  const r = drawn(FIXED, 0.01);
  await expectResult(page, r);
  expect(await events(page)).toEqual([['quiz_start', {}], ...answered(BEFORE), ['quiz_back', { q: 4 }], ...answered(FIXED, 2), ['quiz_complete', { persona: r.p.id, shade: r.shade, others: r.others.join(',') }]]);
});

test('AC5 the keyboard: from the focused card Down and Up move among the answers and Enter commits; Tab from the last answer reaches Back and then leaves the deck; the next card is inert and never takes focus; Space commits too', async ({ page, baseURL }) => {
  await openQuiz(page, baseURL);
  await begin(page);
  const active = () => page.evaluate(() => { const a = document.activeElement as HTMLElement; return `${a.tagName.toLowerCase()}${a.className ? '.' + a.className.split(' ').join('.') : ''}${a.closest('.qz-card') ? '@' + (a.closest('.qz-card') as HTMLElement).dataset.i : ''}`; });
  const opts0 = page.locator('.qz-card[data-i="0"] .qz-opt'), opts1 = page.locator('.qz-card[data-i="1"] .qz-opt'), back1 = page.locator('.qz-card[data-i="1"] .qz-back');
  const first = QUIZ_QUESTIONS[0].answers[0], last = QUIZ_QUESTIONS[1].answers[6];
  await page.keyboard.press('ArrowDown'); await expect(opts0.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(opts0.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowUp'); await expect(opts0.nth(0)).toBeFocused();
  await expect(opts0.nth(0)).toHaveText(first.text);
  await expect(opts0.nth(0)).toHaveAttribute('data-persona', first.persona);
  await page.keyboard.press('Enter');
  await onTop(page, 1);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer')).toEqual([['quiz_answer', { q: 1, persona: first.persona }]]);
  // card 2: Up from the card goes to the last answer, Tab from there to Back, and the next Tab leaves the deck
  await page.keyboard.press('ArrowUp'); await expect(opts1.nth(6)).toBeFocused();
  await page.keyboard.press('Tab'); await expect(back1).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await active(), 'the Tab after Back leaves the deck').not.toMatch(/@/);
  const next = page.locator('.qz-card[data-i="2"]');
  await expect(next).toHaveClass(/is-next/);
  expect(await next.evaluate((c) => (c as HTMLElement).inert)).toBe(true);
  expect(await next.locator('.qz-opt').first().evaluate((b) => { (b as HTMLElement).focus(); return document.activeElement === b; }), 'not even a script can focus it').toBe(false);
  // Shift+Tab comes back through Back to the last answer, and Space commits it
  await page.keyboard.press('Shift+Tab'); await expect(back1).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(opts1.nth(6)).toBeFocused();
  await expect(opts1.nth(6)).toHaveAttribute('data-persona', last.persona);
  await page.keyboard.press('Space');
  await onTop(page, 2);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer')).toEqual([['quiz_answer', { q: 1, persona: first.persona }], ['quiz_answer', { q: 2, persona: last.persona }]]);
});

test('AC5 "Not quite? Try again" returns to card 1 with no data-done dots and the gift hidden; with Math.random changed, the second run draws another shade of the same group', async ({ page, baseURL }) => {
  const DREAMER = Array<PersonaId>(10).fill('dreamer');
  const one = drawn(DREAMER, 0.01), two = drawn(DREAMER, 0.5);
  expect([one.p.id, one.shade, one.name, two.p.id, two.shade, two.name]).toEqual(['dreamer', 'vivid-violet-13', 'Wildberry', 'dreamer', 'blissful-blue-18', 'Teal']);
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, DREAMER);
  await expectResult(page, one);
  await expect(page.locator('#qzGift')).toBeVisible();
  await page.locator('.qz-result:not([hidden]) .qz-retry').click();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
  await expect(page.locator('.qz-card.is-top .qz-dot')).toHaveCount(10);
  await expect(page.locator('.qz-card.is-top .qz-dot[data-done]')).toHaveCount(0);
  await expect(page.locator('.qz-card.is-top .qz-back')).toHaveCount(0);
  await expect(page.locator('.qz-card[data-i="1"]')).toHaveClass(/is-next/);
  await expect(page.locator('#qzResults')).toBeHidden();
  await expect(page.locator('#qzGift')).toBeHidden();
  await page.evaluate(() => { Math.random = () => 0.5; });
  await answer(page, DREAMER);
  await expectResult(page, two);   // the first draw is back among the compatible shades and the second one hidden there
  expect((await events(page)).filter(([n]) => n !== 'quiz_answer')).toEqual([['quiz_start', {}], ['quiz_complete', { persona: 'dreamer', shade: one.shade, others: one.others.join(',') }], ['quiz_retake', {}], ['quiz_complete', { persona: 'dreamer', shade: two.shade, others: two.others.join(',') }]]);
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

test('AC5 an aborted chunk leaves "Swipe to begin" live; a press retries through a fresh URL and shows "Loading..." until that fails too, then gives the button back, and the next press begins once the chunk can load', async ({ page, baseURL }) => {
  let mode: 'abort' | 'hold' | 'load' = 'abort';
  let release = (): void => undefined; const held = new Promise<void>((r) => { release = r; });
  await page.route(DECK, async (route) => { if (mode === 'load') return route.continue(); if (mode === 'hold') await held; return route.abort('failed'); });
  const failed = page.waitForEvent('requestfailed', (r) => DECK.test(r.url()));
  await openQuiz(page, baseURL, false);
  await failed;   // the observer's import was aborted
  const button = page.locator('#qzBegin');
  await expect(button).toHaveText(Q.begin);
  await expect(button).not.toHaveAttribute('aria-disabled', 'true');
  // the next attempt is held by the route, so "Loading..." can be seen before it fails; the browser's module map keeps
  // the failed URL, so the loader asks again through the URL the error named, with ?r=
  mode = 'hold';
  const retried = page.waitForRequest((r) => DECK.test(r.url()) && /\?r=\d+$/.test(r.url()));
  await button.click();
  await retried;
  await expect(button).toHaveText(Q.loading);
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  release();   // into the abort: the loader resets and gives the button back
  await expect(button).toHaveText(Q.begin);
  await expect(button).not.toHaveAttribute('aria-busy', 'true');
  await expect(button).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'intro');
  mode = 'load';
  await button.click();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
});

test('AC8 the gift form: blur with a value validates and an empty submit shows both errors and focuses the email; 500 keeps the values and posts the shade, the personality and the ten answers; 200 shows the done text and "Not you?" reopens an empty form; 409 the duplicate line; 422 the email error', async ({ page, baseURL }) => {
  let status = 500;
  const posts: string[] = [];
  await page.route('**/api/quiz-lead', (route) => { posts.push(route.request().postData() ?? ''); void route.fulfill({ status, contentType: 'application/json', body: '{}' }); });
  await pin(page, 0.5);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, TIE);
  const r = drawn(TIE, 0.5);
  const email = page.locator('#qzEmail'), consent = page.locator('#qzConsent'), send = page.locator('#qzSend'), done = page.locator('.qz-done-text'), errEmail = page.locator('#qzErrEmail');
  await expect(page.locator('#qzGift')).toBeVisible();
  // a value is validated on blur, never per keystroke, and a valid one clears the line again
  await email.fill('nope'); await expect(errEmail).toHaveText(''); await email.blur();
  await expect(errEmail).toHaveText(Q.errEmail);
  await email.fill(EMAIL); await email.blur();
  await expect(errEmail).toHaveText('');
  await expect(email).toHaveAttribute('aria-invalid', 'false');
  // so both errors after the empty submit come from the submit (an empty field is not validated on blur)
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
  expect(JSON.parse(posts[0])).toEqual({ email: EMAIL, shadeId: r.shade, familyId: r.family, finish: r.p.finish, persona: 'rebel', answers: TIE.join(','), source: 'quiz' });
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

test('AC9 reduced motion: the deck does not rise and the committed card never translates during its fade; the quiz still works', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  const rise = sample(page, '#qzDeck', 1000);
  await page.locator('#qzBegin').click();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
  expect(await rise).toEqual(['|none||']);   // for a second from the frame the deck is shown, past the 400 ms a rise would take: no transform, no animation on the deck
  const flight = sample(page, '.qz-card[data-i="0"]', 'gone');
  await page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]').click();
  const frames = await flight;
  for (const s of frames) {
    const [inline, computed, animated] = s.split('|');
    expect(inline, s).not.toContain('translate');
    expect(computed, s).toBe('none');
    expect(animated, s).not.toMatch(/transform/);
  }
  expect(frames.some((s) => s.split('|')[2] === 'opacity'), 'the sampler saw the fade').toBe(true);
  await onTop(page, 1);
  await expect(page.locator('.qz-card[data-i="0"]')).toBeHidden();
  await answer(page, CURATOR, 1);
  await expectResult(page, drawn(CURATOR, 0.01));
  await ctx.close();
});

test('AC4 at 390 x 844 nothing scrolls sideways through the intro, a card (and its fly-off) and the result', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const fits = async (at: string) => expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= innerWidth), at).toBe(true);
  await pin(page, 0.5);
  await openQuiz(page, baseURL);
  await fits('intro');
  await begin(page);
  await fits('card 1');
  // every frame until card 1 has flown off and is hidden (10 s at most), so the check spans the whole fly-off on any machine
  const during = page.evaluate(() => new Promise<boolean>((res) => { let ok = true; const t0 = performance.now(), card = document.querySelector<HTMLElement>('.qz-card[data-i="0"]')!; const tick = () => { ok &&= document.scrollingElement!.scrollWidth <= innerWidth; if (!card.hidden && performance.now() - t0 < 10_000) requestAnimationFrame(tick); else res(ok && card.hidden); }; tick(); }));
  await page.locator(`.qz-card.is-top .qz-opt[data-persona="${TIE[0]}"]`).click();
  expect(await during, 'during the fly-off, to its end').toBe(true);
  await answer(page, TIE, 1);
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  await expectResult(page, drawn(TIE, 0.5));
  await expect(page.locator('#qzGift')).toBeVisible();
  await fits('result and gift');
  await ctx.close();
});

test('AC8 offline: the lead is queued under skreed-quiz-lead with the offline line, and re-sent when the connection returns', async ({ page, context, baseURL }) => {
  const posts: string[] = [];
  let offline = false;   // a routed request is answered even with the context offline, so the route fails it like a dead network while the flag is on
  await page.route('**/api/quiz-lead', (route) => { if (offline) return route.abort('internetdisconnected'); posts.push(route.request().postData() ?? ''); return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await pin(page, 0.5);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, TIE);
  const r = drawn(TIE, 0.5);
  const done = page.locator('.qz-done-text');
  await page.locator('#qzEmail').fill(EMAIL); await page.locator('#qzConsent').check();
  offline = true; await context.setOffline(true);
  await page.locator('#qzSend').click();
  await expect(done).toHaveText(Q.offline);
  await expect(page.locator('.qz-notyou')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('skreed-quiz-lead') ?? 'null'))).toEqual({ email: EMAIL, shadeId: r.shade, familyId: r.family, finish: r.p.finish, persona: 'rebel', answers: TIE.join(','), source: 'quiz' });
  expect(posts).toEqual([]);
  offline = false; await context.setOffline(false);
  await expect(done).toHaveText(Q.done(EMAIL));
  expect(posts).toHaveLength(1);
  expect(JSON.parse(posts[0])).toMatchObject({ email: EMAIL, shadeId: r.shade, persona: 'rebel', answers: TIE.join(',') });
  expect(await page.evaluate(() => sessionStorage.getItem('skreed-quiz-lead'))).toBeNull();
  expect((await events(page)).filter(([n]) => n.startsWith('lead_'))).toEqual([['lead_submit', {}], ['lead_success', {}]]);
});

test('AC8 a slow route: "Still trying..." at 8 s, the error line and a timeout event at 20 s, the values kept', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await page.route('**/api/quiz-lead', async (route) => { await new Promise((r) => setTimeout(r, 25_000)); await route.fulfill({ status: 200, body: '{}' }).catch(() => undefined); });
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, CURATOR);
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
    await pin(page, 0.01);
    await openQuiz(page, baseURL);
    await fits('intro');
    await begin(page);
    await fits('card');
    const pad = await page.locator('.qz-card.is-top').evaluate((c) => {
      const r = c.getBoundingClientRect(), q = c.querySelector('.qz-q')!.getBoundingClientRect(), o = c.querySelector('.qz-opts')!.getBoundingClientRect(), f = c.querySelector('.qz-foot')!.getBoundingClientRect();
      return { top: q.top - r.top, bottom: r.bottom - f.bottom, left: o.left - r.left, right: r.right - o.right };
    });
    expect(pad.top, 'the question keeps the card\'s top padding').toBeGreaterThanOrEqual(20);
    expect(pad.bottom, 'Back and the dots keep the card\'s bottom padding').toBeGreaterThanOrEqual(20);
    expect(pad.left, 'the answers keep the card\'s left padding').toBeGreaterThanOrEqual(15.5);
    expect(pad.right, 'the answers keep the card\'s right padding').toBeGreaterThanOrEqual(15.5);
    await answer(page, CURATOR);
    await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
    await fits('result');
    await page.evaluate(() => document.getElementById('qzGift')!.scrollIntoView({ block: 'end' }));
    await fits('gift');
    await ctx.close();
  });
}
