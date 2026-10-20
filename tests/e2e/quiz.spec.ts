// Section 3, the quiz (docs/specs/quiz.md 7), on the content Sam sent on 2026-10-16, as plain text on the fog (Sam,
// 2026-10-19: "just plain text on the fog background with the same animation, no boxes or anything"): ten questions of
// seven answers, one per personality, scored by scoreQuiz and drawn by pickShade (src/config/quiz.ts), every line
// decoded in and out as section 2's labels are (src/scripts/quiz/decode.ts). The decode splits each [data-dc] element
// into a visually hidden copy (Sam's sentence case, where the accessible name comes from) and an aria-hidden row of one
// span per upper-cased character, so these specs read text through accessible names or the .sr-only child, never an
// element's textContent (it holds both copies), and wait for the decode with #find:not([data-decoding]). The motion is
// timed on the decoder's own clock (watch() and expectMotion()): every step of the decoder is seen, however few frames a
// slow machine draws, and each wipe, fade, roll, stagger and hold is held to its length from both sides.
// AC5 and AC6: ten answers for The Quiet Curator give Porcelain in full with Math.random pinned at 0.01 (each group's
// first shade), the answer taken marked at the press and drawn underlined at 2 px, staying at full opacity while the rest
// of its question wipes out, holding 120 ms, then wiping out itself, then the next question decoding in; a tie settled by the tied personality picked most recently, with Math.random at 0.5 (the group's
// middle shade); Back to the previous question with the answer corrected and no answer taken during its wipe; the deck by
// keyboard (Down and Up among the answers, Enter and Space, the Tab order with every other question hidden and inert);
// "Not quite? Try again" with a second draw from the same group; a press while the chunk is in flight (replayed at mount)
// and an aborted chunk (a press retries through a fresh URL, "Loading..." until that fails, then the button comes back);
// the decode itself (the intro at rest, the roll, the left-to-right wipe, the stagger, the settled row) and a hidden page
// (the text jumps to its end state). AC1, AC7 and AC10: no boxes (no fill, border or shadow), section 2's label type
// (IBM Plex Mono 500, upper case, Pearl Whisper), the two Plex files split by unicode-range, the email line, the no-JS
// path; Sam's words reach assistive technology in his case (the lines that are not decoded too) and keep his no-break
// space. AC8 the gift form against a
// mocked /api/quiz-lead (page.route): validation on blur and on an empty submit, 500, 200 and "Not you?", 409 and 422,
// the payload with the personality and the ten answers, the offline queue and its re-send, "Still trying..." at 8 s and
// the abort at 20 s. AC9 reduced motion (no transform anywhere, 0.2 s fades with no glyph ever rolling, no hold) and AC4 no
// horizontal scroll at 390 x 844 and across the widths of CHECKLIST G10, with the text columns inside the gutters, the
// controls at least 44 px each way and every line at the type scale's size for the screen. The quiz needs no island, so the specs run
// on the poster tier (?tier=poster; the test build lands there without an override too) and scroll the section in with
// scrollTo at its own top (17.2 screens on the 3D path, where __skreedSnap pins the followers once the island installed
// it). The test build has PUBLIC_HERO_HOOKS=1, so the gift form renders.
// The review of 2026-10-19: deck.ts drops a press on an answer or Back made within 350 ms of its question being put on
// screen (150 ms under reduced motion), as the second click of a double click. The helpers press once that guard has
// passed (ready(), 150 ms under reduced motion), while the question is still decoding in, and the guard has tests of its
// own: a double click on Begin and on Back, a press 100 ms after a question appears, and under reduced motion a press at
// 100 ms dropped and one at 200 ms taken. Also from that review: Try again while a send is in flight, for a 500, a 200 and
// a 409 (the request aborted at the press, Send wiping out with the rest, nothing of the abandoned send coming back, the
// next gift decoding in whole, Send included); Try again clearing the form's lines and freeing Send from a send that never
// answers; the form's errors announced through #qzLive when focus stays where it is (the email field and the consent
// box) and focus moved to the field at fault otherwise (a 422, Send); the swatches' hairline on the poster tier's night
// (Pearl on the ten dark shades) and on the fog (Urban Slate on the pale ones); a 60-character address inside the gutters
// at 360 px; and the underlines written as longhands in the page's style sheets (Safari before 26.2 drops the shorthand
// with a thickness, which Chromium computes the same) and computed from them.
// The changes of 2026-10-20 (Sam: "the text is soo small, look at the screen size and look at how much area the text is
// covering, it doesnt make any sense"): the type scales with the screen through three clamp() tokens in quiz.css, so every
// line is held to typeScale() at each size tested, not to fixed sizes; a question takes focus from script only (tabindex
// -1 on every card) and draws no outline and no ring. And the answer pictures (Sam, the same day: "for any question that
// is visual, open envato and pick pictures relating to that specific option ... that image should appear only when u hover
// over that option ... dont just straight up blankly slap the image on the screen on hover"): one Envato stock photograph
// per answer of the five visual questions (config/quiz-pictures.ts), drawn by picture.ts in 12 strips that decode in as
// the text does. recordPics() logs every step of a picture on its own clock, as watch() does the text: a mouse over an
// answer at 1280 x 800 decodes its picture in beside the question and settles it within 0.9 s, the next answer wipes it
// out and decodes its own over it, and leaving the answers wipes that out; keyboard focus shows it and Tab away hides it;
// a tap at 390 x 844 shows it above the question and holds the answer until it has settled; a question with no pictures
// has no frame; only the question on screen loads its pictures; under reduced motion a picture fades, with no roll and no
// transform. From the review of the same day: pictures held on the network by page.route (an answer hovered and left, or
// left for a loaded one, before its picture arrives shows nothing when it does, the pointer at rest on question 3 too; a
// tap on an answer still loading holds it 0.9 s at most and the picture never comes on the question gone); a press that
// turns into a scroll (pointercancel) and a tap dropped by the guard leave no picture; at 360 x 780 and 844 x 390 the
// frame has no room (data-none), nothing is asked for and a tap is taken with no hold; at 800 x 1280 the frame is 40% of
// the height; a picture left on as the question changes is cleared at once; an answer taken with the mouse or the
// keyboard keeps its picture while the pointer or focus leaves it during the hold; focus that is not the keyboard's shows
// none; the shade's name and the done line draw no focus box.
import { test, expect, type Locator, type Page } from '@playwright/test';
import { QUIZ_COPY as Q, QUIZ_PERSONAS, QUIZ_QUESTIONS, needsRing, needsRingNight, pickShade, scoreQuiz, shadeHref, type Persona, type PersonaId } from '../../src/config/quiz.ts';
import { SHADES } from '../../src/config/shades.gen.ts';

/** the lazy chunk (deck.ts with config/quiz.ts), imported by Quiz.astro's loader within a screen of the section */
const DECK = /\/deck\.[^/?]*\.js(\?.*)?$/;   // with the loader's retry query (?r=) too
/** the second Plex file: the rest of Basic Latin, the no-break space and the curly quotes (src/styles/fonts.css) */
const REST_FONT = '/fonts/ibm-plex-mono-500-rest.woff2';
const EMAIL = 'quiz@example.com';
const PEARL = 'rgb(247, 246, 243)';   // #F7F6F3, Pearl Whisper: every line of the section
const CLEAR = 'rgba(0, 0, 0, 0)';
const URBAN_SLATE = 'rgb(56, 63, 67)';   // #383F43: the focus ring inside the outline, the swatches' hairline
const EMBER = 'rgb(255, 153, 0)';   // #FF9900, Ember Luxe: the keyboard focus outline
/** deck.ts's guard: a press on an answer or Back this soon after its question was put on screen (showCard) is dropped, as
 *  the second click of a double click; GUARD_REDUCED under reduced motion */
const GUARD = 350, GUARD_REDUCED = 150;
/** the ten quiz shades under 3:1 against --night #050506 (needsRingNight), by catalog id: Burgundy, Claret, Wine,
 *  Midnight, Sapphire, Chestnut, Fig, Pine, Navy and Prussian */
const NIGHT = ['basic-brown-20', 'blissful-blue-15', 'blissful-blue-21', 'blissful-blue-22', 'blissful-blue-24', 'go-green-21', 'roaring-red-15', 'roaring-red-21', 'roaring-red-23', 'vivid-violet-16'];
/** the gift's decoded lines: its heading, the line under it, the email label, the consent words, Send my gift, the fine print */
const GIFT_LINES = 6;
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

type Ev = [string, Record<string, string | number>];
const events = (page: Page): Promise<Ev[]> => page.evaluate(() => ((window as unknown as { __skreedEvents?: { name: string; props: Record<string, string | number> }[] }).__skreedEvents ?? []).map((e) => [e.name, e.props] as [string, Record<string, string | number>]));
/** the quiz_answer events for answers[from] onwards */
const answered = (answers: PersonaId[], from = 0): Ev[] => answers.slice(from).map((persona, k) => ['quiz_answer', { q: from + k + 1, persona }]);

const byId = new Map(SHADES.map((s) => [s.id, s]));
const familyName = (f: string) => f.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
/** a compatible shade as the result paints it: id, swatch colour and which hairline it carries (data-ring, for the fog;
 *  data-ring-night, for the poster tier's night) */
const mini = (id: string) => { const s = byId.get(id)!; return `${id}|${rgb(s.hex)}|${needsRing(s.hex)}|${needsRingNight(s.hex)}`; };

interface Drawn { p: Persona; shade: string; others: string[]; family: string; name: string; fam: string; href: string; ring: boolean; night: boolean; rgb: string }
/** a result's decoded lines in reading order: the eyebrow, the name, the family line, the finish, the personality, the
 *  profile, the colour profile, "Also compatible with", one name per compatible shade, the closing line, the two links */
const resultLines = (r: Drawn): number => 8 + r.others.length + 3;
/** the decoder's keys for n elements of a part from `from` on: `${part}:${i}`, i the element's place in the list its part
 *  decodes in (deck.ts items(): the result's lines, then the gift's, in one list) */
const keys = (part: string, n: number, from = 0): string[] => Array.from({ length: n }, (_v, k) => `${part}:${from + k}`);
/** where card i's answer for a personality stands among its decoded elements (after the count and the question) */
const answerAt = (i: number, persona: PersonaId): number => QUIZ_QUESTIONS[i].answers.findIndex((a) => a.persona === persona) + 2;

/** the result for ten answers with Math.random pinned at v: scoreQuiz's personality, pickShade's draw, and the shade's
 *  name, family line, link and hairline as Quiz.astro resolves them from the catalog at build */
function drawn(answers: PersonaId[], v: number): Drawn {
  const p = scoreQuiz(answers), { shade, others } = pickShade(p, () => v), s = byId.get(shade)!;
  return { p, shade, others, family: s.family, name: s.name, fam: Q.fam(familyName(s.family), s.index), href: shadeHref(s.family, s.n), ring: needsRing(s.hex), night: needsRingNight(s.hex), rgb: rgb(s.hex) };
}

/** Math.random pinned before any of the page's scripts run, so the shade draw is known: 0.01 gives each group's first
 *  shade, 0.5 its middle one (the fourth of six or seven) */
const pin = (page: Page, v: number): Promise<void> => page.addInitScript((v) => { Math.random = () => v; }, v);

/** every Element.animate call made on something inside #find (deck.ts animates the swatches only, on opacity), logged
 *  from before the page's scripts run: what it animates and for how long */
const logAnimate = (page: Page): Promise<void> => page.addInitScript(() => {
  const log: string[] = [];
  (window as unknown as { __qzAnimate: string[] }).__qzAnimate = log;
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (this: Element, frames: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) {
    if (this.closest('#find')) {
      const props = [...new Set((Array.isArray(frames) ? frames : frames ? [frames] : []).flatMap((f) => Object.keys(f)))].filter((k) => !/^(offset|easing|composite)$/.test(k)).sort().join(',');
      log.push(`${this.className}|${props}|${typeof options === 'number' ? options : options?.duration}`);
    }
    return animate.call(this, frames, options);
  };
});
const animateLog = (page: Page): Promise<string[]> => page.evaluate(() => (window as unknown as { __qzAnimate?: string[] }).__qzAnimate ?? []);

/** #find's data-decoding attribute, every change from before the page's scripts run: "on" or "off", with the state */
const logDecoding = (page: Page): Promise<void> => page.addInitScript(() => {
  const log: string[] = [];
  (window as unknown as { __qzDecoding: string[] }).__qzDecoding = log;
  new MutationObserver((recs) => { for (const r of recs) { const el = r.target as HTMLElement; if (el.id === 'find') log.push(`${el.hasAttribute('data-decoding') ? 'on' : 'off'}@${el.dataset.state}`); } })
    .observe(document, { subtree: true, attributes: true, attributeFilter: ['data-decoding'] });   // the document: an init script runs before <html> exists
});
const decodingLog = (page: Page): Promise<string[]> => page.evaluate(() => (window as unknown as { __qzDecoding?: string[] }).__qzDecoding ?? []);

/** when each card was last put on screen (given is-top by showCard) and every text the live region took, on the page's
 *  clock, from before the deck chunk runs (the observers go on at DOMContentLoaded, long before the chunk mounts) */
const logPage = (page: Page): Promise<void> => page.addInitScript(() => {
  const top: Record<string, number> = {}, live: string[] = [];
  Object.assign(window, { __qzTopAt: top, __qzLive: live });
  document.addEventListener('DOMContentLoaded', () => {
    const cards = document.getElementById('qzCards'), region = document.getElementById('qzLive');
    if (cards) new MutationObserver((recs) => { for (const r of recs) { const c = r.target as HTMLElement; if (c.classList.contains('is-top') && !(r.oldValue ?? '').split(/\s+/).includes('is-top')) top[c.dataset.i ?? ''] = performance.now(); } })
      .observe(cards, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    if (region) new MutationObserver(() => { if (region.textContent) live.push(region.textContent); }).observe(region, { childList: true, characterData: true, subtree: true });
  });
});
/** every text #qzLive has taken (announce() empties it, then sets the text a frame later) */
const heard = (page: Page): Promise<string[]> => page.evaluate(() => [...((window as unknown as { __qzLive?: string[] }).__qzLive ?? [])]);

/** the poster tier with the section's top at the viewport's top (the 3D path's 17.2 screens), the fonts in and, unless
 *  `chunk` is false, the deck chunk fetched and mounted (the intro split into its glyphs): the observer asks for it at the
 *  scroll, and a press that lands while it is in flight is swallowed by the loader (the AC5 pending test), so every other
 *  test presses once the chunk is in */
async function openQuiz(page: Page, baseURL: string | undefined, chunk = true): Promise<void> {
  await logPage(page);
  const deck = chunk ? page.waitForResponse(DECK) : null;
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await expect(page.locator('html')).toHaveClass('js poster');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { const top = document.getElementById('find')!.getBoundingClientRect().top + scrollY; scrollTo(0, top); window.__skreedSnap?.(top / innerHeight); });
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'intro');
  await expect(page.locator('#qzBegin')).toBeInViewport();
  if (deck) {
    await (await deck).finished();
    await expect(page.locator('#qzBegin > .dc')).toHaveCount(1);   // mounted: deck.ts has split "Swipe to begin"
  }
}

/** the page quiet before a test that must catch a frame inside a decode window of 0.2 to 1 s: scrolled to the quiz, the
 *  page fetches section 4's room below it, and its set-up can hold the main thread past such a window */
async function quiet(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** every decode on the section has settled (data-decoding is on #find while any text moves) */
const settled = (page: Page): Promise<void> => expect(page.locator('#find:not([data-decoding])')).toHaveCount(1);

/** card i on top and focused (each card is awaited: a press while the previous question wipes out is not taken) */
async function onTop(page: Page, i: number): Promise<void> {
  const card = page.locator(`.qz-card[data-i="${i}"]`);
  await expect(card).toHaveClass(/is-top/);
  await expect(card).toBeFocused();
}

/** card i on top and past deck.ts's guard: GUARD ms since showCard put it on screen (GUARD_REDUCED under reduced motion),
 *  its words still decoding in (the whole decode takes about 1.2 s; 0.8 s under reduced motion). Checked every frame, not
 *  through expect's polling (its retries at 0, 100, 350 and 850 ms would hold the press to about 0.45 s whatever the
 *  guard), so the press that follows is a quick visitor's, which the guard must take; the guard's own tests press inside it */
async function ready(page: Page, i: number): Promise<void> {
  await page.waitForFunction(({ i, guard, reduced }) => {
    const card = document.querySelector(`.qz-card[data-i="${i}"]`), t = (window as unknown as { __qzTopAt?: Record<string, number> }).__qzTopAt?.[i];
    // __qzTopAt[i] is set as the card is given is-top, so with is-top on it is this showing's time, not a run before a retry
    return !!card?.classList.contains('is-top') && t !== undefined && performance.now() >= t + (matchMedia('(prefers-reduced-motion: reduce)').matches ? reduced : guard);
  }, { i, guard: GUARD, reduced: GUARD_REDUCED }, { timeout: 15_000 });
}

/** the deck as it stands: which cards are unhidden, on top and not inert (only the top one, always), and which are in the
 *  Tab order (none: a question takes focus from script only, tabindex -1 on every card, 2026-10-20) */
const deckState = (page: Page) => page.locator('.qz-card').evaluateAll((cards) => {
  const pick = (f: (c: HTMLElement) => boolean) => (cards as HTMLElement[]).filter(f).map((c) => Number(c.dataset.i));
  return { unhidden: pick((c) => !c.hidden), top: pick((c) => c.classList.contains('is-top')), tabbable: pick((c) => c.tabIndex !== -1 || c.getAttribute('tabindex') !== '-1'), live: pick((c) => !c.inert) };
});
const only = (i: number) => ({ unhidden: [i], top: [i], tabbable: [] as number[], live: [i] });

/** "Swipe to begin" with the chunk in (openQuiz): the press begins at once */
async function begin(page: Page): Promise<void> {
  await page.locator('#qzBegin').click();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await expect(page.locator('#qzIntro')).toBeHidden();
  await onTop(page, 0);
}

/** cards from..9 answered by a click on the top card's answer for each personality (a click lands as soon as the guard
 *  has passed, while the question is still decoding in, as a quick visitor's would) */
async function answer(page: Page, personas: PersonaId[], from = 0): Promise<void> {
  for (let i = from; i < personas.length; i++) {
    await ready(page, i);
    await onTop(page, i);   // focused too
    await page.locator(`.qz-card.is-top .qz-opt[data-persona="${personas[i]}"]`).click();
  }
}

/** the consent box ticked through its row (the native box is 1 px at opacity 0; the row shows [ ] or [X]) */
async function tick(page: Page): Promise<void> {
  await page.locator('.qz-check').click();
  await expect(page.locator('#qzConsent')).toBeChecked();
}

/** a decoded element's two copies: the visually hidden one (Sam's text) and the glyph row as drawn, with the number of
 *  glyphs still carrying an inline opacity (none once a decode in has settled at full) */
const copies = (el: Locator) => el.evaluate((e) => ({
  sr: e.querySelector(':scope > .sr-only')?.textContent ?? null,
  row: e.querySelector(':scope > .dc')?.textContent ?? null,
  faded: [...e.querySelectorAll<HTMLElement>(':scope > .dc > span')].filter((s) => s.style.opacity !== '').length,
}));

/** the words a decoded line says: its visually hidden copy (the form's lines too: deck.ts sets the errors, the status
 *  line and the done line through the decoder, so each holds Sam's sentence case beside the capitals drawn) */
const said = (line: Locator): Locator => line.locator(':scope > .sr-only');

/** the one shown result is r's (AC6): personality and finish, the drawn shade large (its colour from the catalog token,
 *  the hairline where it needs one), name, family line, finish, personality, profile, colour profile, the compatible
 *  shades (the rest of the group in its order, painted, the drawn one hidden) and the link; once settled, every line's
 *  glyph row reads its text upper-cased at full opacity */
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
  if (r.night) await expect(big).toHaveAttribute('data-ring-night', ''); else await expect(big).not.toHaveAttribute('data-ring-night');
  await expect(big).toHaveCSS('background-color', r.rgb);
  const lines: [string, string][] = [['.qz-eyebrow', Q.eyebrow], ['.qz-shade', `${r.name}.`], ['.qz-fam', r.fam], ['.qz-finish', Q.finish(r.p.finish)], ['.qz-persona', r.p.name], ['.qz-text', r.p.profile], ['.qz-palette', r.p.palette], ['.qz-also-h', Q.also], ['.qz-own', Q.own]];
  for (const [sel, text] of lines) await expect(shown.locator(`${sel} > .sr-only`), sel).toHaveText(text);
  await expect(shown.getByRole('heading', { name: `${r.name}.`, exact: true })).toHaveClass(/qz-shade/);
  await expect(shown.locator('.qz-see')).toHaveAccessibleName(Q.see);
  await expect(shown.locator('.qz-retry')).toHaveAccessibleName(Q.retry);
  const minis = shown.locator('.qz-mini:not([hidden])');
  await expect(minis).toHaveCount(r.others.length);
  await expect(minis.locator('.qz-mini-name > .sr-only')).toHaveText(r.others.map((id) => byId.get(id)!.name));
  expect(await minis.evaluateAll((els) => els.map((m) => `${(m as HTMLElement).dataset.shade}|${getComputedStyle(m.querySelector('.qz-mini-sw')!).backgroundColor}|${m.hasAttribute('data-ring')}|${m.hasAttribute('data-ring-night')}`))).toEqual(r.others.map(mini));
  await expect(shown.locator('a.qz-see')).toHaveAttribute('href', r.href);
  await settled(page);
  for (const [sel, text] of [...lines, ['.qz-see', Q.see], ['.qz-retry', Q.retry]] as [string, string][]) {
    const c = await copies(shown.locator(sel));
    expect(c.row?.replace(/\s+/g, ' '), `${sel} drawn`).toBe(text.toUpperCase().replace(/\s+/g, ' '));
    expect(c.faded, `${sel} settled at full opacity`).toBe(0);
  }
}

/** one decoded element as it stands: its glyphs' opacity range, how many sit strictly between 0 and 1, how many show a
 *  character other than their final upper-cased one (and of those, how many are visible), whether the opacity never
 *  rises from left to right (both wipes keep the left of a line the more visible) and whether every glyph has one opacity */
interface Row { k: string; n: number; min: number; max: number; mid: number; rolled: number; shownRolled: number; mono: boolean; equal: boolean }
/** one frame: the decode flag, the state, the answer marked (aria-pressed) and the answers drawn with the 2 px underline
 *  (the mark as seen), each part on screen (intro, card<i>, result, gift) as its decoded elements in reading order, the
 *  running animations inside #find, anything moved by a transform, and whether the page scrolls sideways */
interface Frame { decoding: boolean; state: string; pressed: string; underlined: string[]; parts: Record<string, Row[]>; anims: string[]; moved: string[]; wide: boolean }
/** one decoded element after one step of the decoder, timed on the decoder's own clock (the timestamp of the animation
 *  frame the step ran in, which decode.ts times every step by): the decode phase it belongs to, its part, and i, its
 *  place in the list its part decodes in (the stagger order) */
interface Snap extends Row { t: number; phase: number; part: string; i: number }
/** a decode phase: from #find's data-decoding switched on (inside the first element's start) to off (the last one
 *  settled or gone), in ms on the same clock */
interface Phase { on: number; off: number }
/** an answer marked or unmarked (aria-pressed): its card, how many glyph writes strictly between opacity 0 and 1 that
 *  card had seen by then, and whether the card was hidden by then */
interface Mark { act: 'on' | 'off'; persona: string; part: string; before: number; cardHidden: boolean }
/** snaps: every element after every step of the decoder (a MutationObserver callback runs at the microtask checkpoint
 *  straight after the animation frame callback that wrote it, so no step is missed, however few frames the page
 *  draws); rolledWrites: glyph writes of a character other than the final one; partial: per part, the glyph opacity
 *  writes strictly between 0 and 1 (a hide in one write to 0 makes none) */
interface Watched { frames: Frame[]; snaps: Snap[]; phases: Phase[]; marks: Mark[]; rolledWrites: number; partial: Record<string, number>; timedOut: boolean }

/** every frame from now until `stop` matches and nothing decodes (or 10 s, the old sampler's cap), with every step of the
 *  decoder, the decode phases and the marks. The window follows the page, not the moment of the press, so a slow
 *  machine cannot close it before the motion starts */
function watch(page: Page, stop: string, capMs = 10_000): Promise<Watched> {
  return page.evaluate(({ stop, capMs }) => new Promise<Watched>((res) => {
    const root = document.getElementById('find')!;
    const frames: Frame[] = [], snaps: Snap[] = [], phases: Phase[] = [], marks: Mark[] = [];
    let rolledWrites = 0;
    const partial: Record<string, number> = {};
    // the decoder's clock: the timestamp each animation frame callback is given; the observer's callback for a step's
    // writes runs before the flag is cleared (its microtask is queued by the first write, inside the callback)
    const raf0 = window.requestAnimationFrame;
    let clock = 0, inFrame = false;
    window.requestAnimationFrame = (cb) => raf0.call(window, (ts) => { clock = ts; inFrame = true; try { cb(ts); } finally { queueMicrotask(() => { inFrame = false; }); } });
    // the phases: data-decoding on and off, timed at the call that switches it (setAttribute, removeAttribute or toggleAttribute)
    const proto = Element.prototype as unknown as Record<string, (this: Element, ...a: unknown[]) => unknown>;
    const restore = (['setAttribute', 'removeAttribute', 'toggleAttribute'] as const).map((name) => {
      const f = proto[name];
      proto[name] = function (this: Element, ...a: unknown[]) {
        if (this !== root) return f.apply(this, a);
        const was = root.hasAttribute('data-decoding'), r = f.apply(this, a), is = root.hasAttribute('data-decoding');
        if (is && !was) phases.push({ on: performance.now(), off: Infinity });
        else if (was && !is && phases.length) phases[phases.length - 1].off = performance.now();
        return r;
      };
      return () => { proto[name] = f; };
    });
    const partOf = (s: Element) => { const c = s.closest<HTMLElement>('.qz-card'); return c ? `card${c.dataset.i}` : s.closest('.qz-result') ? 'result' : s.closest('#qzGift') ? 'gift' : s.closest('#qzIntro') ? 'intro' : 'other'; };
    const scopeOf = (s: Element, p: string) => (p.startsWith('card') ? s.closest('.qz-card') : p === 'result' ? s.closest('.qz-result') : p === 'gift' ? document.getElementById('qzGift') : p === 'intro' ? document.getElementById('qzIntro') : null) as HTMLElement | null;
    const finalOf = (row: Element) => [...(row.parentElement?.querySelector(':scope > .sr-only')?.textContent ?? '').toUpperCase()];
    // deck.ts's items(): the decoded elements of a part in reading order, less those inside something hidden
    const items = (scope: HTMLElement) => [...scope.querySelectorAll<HTMLElement>('[data-dc]')].filter((e) => { for (let p = e.parentElement; p && p !== scope; p = p.parentElement) if (p.hidden) return false; return true; });
    const key = (el: HTMLElement) => (el.id ? `#${el.id}` : el.classList.contains('qz-opt') ? `opt:${el.dataset.persona}` : el.classList.length ? `.${el.classList[el.classList.length - 1]}` : el.tagName.toLowerCase());
    const rowOf = (el: HTMLElement): Row => {
      const r = el.querySelector(':scope > .dc'), k = key(el);
      if (!r) return { k, n: 0, min: 1, max: 1, mid: 0, rolled: 0, shownRolled: 0, mono: true, equal: true };   // not split: drawn as the server drew it
      const fin = finalOf(r);
      let min = 1, max = 0, mid = 0, rolled = 0, shownRolled = 0, mono = true, prev = 1;
      [...r.children].forEach((s, i) => {
        const o = (s as HTMLElement).style.opacity, a = o === '' ? 1 : Number(o);
        min = Math.min(min, a); max = Math.max(max, a);
        if (a > 0 && a < 1) mid++;
        if (s.textContent !== fin[i]) { rolled++; if (a > 0) shownRolled++; }
        if (a > prev + 0.002) mono = false;   // the decoder skips writes under 0.001 and rounds to 0.001
        prev = a;
      });
      return { k, n: r.children.length, min, max, mid, rolled, shownRolled, mono, equal: max - min < 1e-6 };
    };
    const glyphAt = new WeakMap<Element, number>(), indexed = new WeakSet<Element>();
    const onRecords = (recs: MutationRecord[]) => {
      const t = inFrame ? clock : performance.now(), dirty = new Set<Element>(), finals = new Map<Element, string[]>();
      for (const r of recs) {
        const target = r.target as Element;
        if (r.type === 'attributes' && r.attributeName === 'aria-pressed') {
          const o = target as HTMLElement, c = o.closest<HTMLElement>('.qz-card'), p = c ? `card${c.dataset.i}` : 'other';
          const act = r.oldValue === null ? 'on' : o.hasAttribute('aria-pressed') ? null : 'off';
          if (act) marks.push({ act, persona: o.dataset.persona ?? '', part: p, before: partial[p] ?? 0, cardHidden: !!c?.hidden });
          continue;
        }
        const s = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement, row = s?.parentElement;
        if (!s || !row?.classList.contains('dc')) continue;
        dirty.add(row);
        if (r.type === 'attributes') { const a = Number((s as HTMLElement).style.opacity || 1); if (a > 0 && a < 1) { const p = partOf(s); partial[p] = (partial[p] ?? 0) + 1; } }
        else {
          if (!indexed.has(row)) { indexed.add(row); [...row.children].forEach((g, i) => glyphAt.set(g, i)); }
          let fin = finals.get(row);
          if (!fin) finals.set(row, fin = finalOf(row));
          if (s.textContent !== fin[glyphAt.get(s) ?? -1]) rolledWrites++;
        }
      }
      const lists = new Map<HTMLElement, HTMLElement[]>();
      const list = (scope: HTMLElement) => { let l = lists.get(scope); if (!l) lists.set(scope, l = items(scope)); return l; };
      for (const row of dirty) {
        const el = row.parentElement as HTMLElement, p = partOf(el), scope = scopeOf(el, p);
        let i = scope ? list(scope).indexOf(el) : -1;
        if (p === 'gift') { const shown = document.querySelector<HTMLElement>('#qzResults:not([hidden]) .qz-result:not([hidden])'); if (shown) i += list(shown).length; }
        snaps.push({ ...rowOf(el), t, phase: phases.length - 1, part: p, i });
      }
    };
    const mo = new MutationObserver(onRecords);
    mo.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'aria-pressed'], attributeOldValue: true });
    const parts = () => {
      const p: Record<string, Row[]> = {};
      const intro = document.getElementById('qzIntro')!, results = document.getElementById('qzResults')!, gift = document.getElementById('qzGift');
      if (!intro.hidden) p.intro = items(intro).map(rowOf);
      for (const c of root.querySelectorAll<HTMLElement>('.qz-card:not([hidden])')) p[`card${c.dataset.i}`] = items(c).map(rowOf);
      const shown = results.querySelector<HTMLElement>('.qz-result:not([hidden])');
      if (!results.hidden && shown) p.result = items(shown).map(rowOf);
      if (gift && !gift.hidden) p.gift = items(gift).map(rowOf);
      return p;
    };
    const anims = () => document.getAnimations().filter((a) => { const t = (a.effect as KeyframeEffect | null)?.target; return t instanceof Element && root.contains(t); }).map((a) => {
      const e = a.effect as KeyframeEffect;
      const props = [...new Set(e.getKeyframes().flatMap((f) => Object.keys(f)))].filter((k) => !/^(offset|computedOffset|easing|composite)$/.test(k)).sort().join(',');
      return `${(e.target as Element).className}|${props}|${e.getTiming().duration}`;
    });
    const moved = () => [...root.querySelectorAll<HTMLElement>('.qz-stage, .qz-intro, .qz-deck, .qz-cards, .qz-card, .qz-opt, .qz-results, .qz-result, .qz-big, .qz-mini-sw, .qz-gift, .qz-gift-in')]
      .filter((e) => { const cs = getComputedStyle(e); return cs.transform !== 'none' || cs.translate !== 'none' || cs.rotate !== 'none' || cs.scale !== 'none'; }).map((e) => e.className);
    const underlined = () => [...root.querySelectorAll<HTMLElement>('.qz-card:not([hidden]) .qz-opt')]
      .filter((o) => { const cs = getComputedStyle(o); return cs.textDecorationLine.includes('underline') && cs.textDecorationThickness === '2px'; }).map((o) => o.dataset.persona ?? '');
    const t0 = performance.now();
    const tick = () => {
      frames.push({ decoding: root.hasAttribute('data-decoding'), state: root.dataset.state ?? '', pressed: root.querySelector<HTMLElement>('.qz-card:not([hidden]) .qz-opt[aria-pressed="true"]')?.dataset.persona ?? '', underlined: underlined(), parts: parts(), anims: anims(), moved: moved(), wide: document.scrollingElement!.scrollWidth > innerWidth });
      const done = !!document.querySelector(stop) && !root.hasAttribute('data-decoding'), timedOut = performance.now() - t0 > capMs;
      if (done || timedOut) {
        onRecords(mo.takeRecords()); mo.disconnect();
        for (const r of restore) r();
        window.requestAnimationFrame = raf0;
        res({ frames, snaps, phases, marks, rolledWrites, partial, timedOut });
      } else requestAnimationFrame(tick);
    };
    tick();
  }), { stop, capMs });
}
/** the rows of a part in a frame, or undefined when the part is not on screen */
const part = (f: Frame, p: string): Row[] | undefined => f.parts[p];
const full = (rows: Row[] | undefined) => !!rows && rows.length > 0 && rows.every((r) => r.n > 0 && r.min === 1 && r.rolled === 0);

/** a decode phase as decode.ts draws it, timed on the decoder's clock from the phase's start. Out (a wipe out): every
 *  element from 0 ms, right to left over 0.2 s. In (a decode in): element i of the n in its list from i x step, the step
 *  0.05 s or less so the last starts within 0.6 s, left to right over 0.4 s while its glyphs roll until 0.75 s. Reduced
 *  motion: both a 0.2 s fade, no roll. Checked: only the elements in `keys` move, and each ends gone (out) or drawn in
 *  full and settled (in); none early (nothing drawn before its start, nothing complete before its duration, the phase not
 *  over before its last element's end) and none late (nothing still visible, still coming in or still rolling after its
 *  end, to the decoder's own frame); a step of the decoder seen part-way; the shape at every step (a wipe keeps the left
 *  of a line the more visible and is uneven part-way; a fade keeps a line's glyphs at one opacity); the roll seen on a
 *  visible glyph (a decode in) or never (the rest) */
function expectMotion(at: string, w: Watched, p: number, m: { dir: 'in' | 'out'; keys: string[]; reduced?: boolean }): void {
  const ph = w.phases[p];
  expect(ph, `${at}: decode phase ${p + 1} ran`).toBeTruthy();
  expect(ph.off, `${at}: and ended`).toBeLessThan(Infinity);
  const snaps = w.snaps.filter((s) => s.phase === p), id = (s: Snap) => `${s.part}:${s.i}`, since = (s: Snap) => s.t - ph.on;
  expect([...new Set(snaps.map(id))].sort(), `${at}: what moved`).toEqual([...m.keys].sort());
  const n = m.keys.length, step = m.dir === 'in' && n > 1 ? Math.min(50, 600 / (n - 1)) : 0;
  const dur = m.reduced || m.dir === 'out' ? 200 : 400, roll = m.dir === 'in' && !m.reduced ? 750 : 0;
  for (const k of m.keys) {
    const mine = snaps.filter((s) => id(s) === k), last = mine[mine.length - 1], start = Number(k.split(':')[1]) * (m.dir === 'in' ? step : 0);
    const name = `${at}: ${k} (${last.k})`;
    if (m.dir === 'in') {
      expect(last.min === 1 && last.rolled === 0, `${name} ends drawn in full, settled`).toBe(true);
      expect(since(mine.find((s) => s.max > 0)!), `${name}: nothing drawn before its start at ${start.toFixed(1)} ms`).toBeGreaterThan(start - 1);
      expect(since(mine.find((s) => s.min === 1)!), `${name}: not in full before ${(start + dur).toFixed(1)} ms`).toBeGreaterThan(start + dur - 1);
      expect(mine.filter((s) => s.min < 1 && since(s) > start + dur + 5).map(since), `${name}: still coming in after ${(start + dur).toFixed(1)} ms`).toEqual([]);
      if (roll) expect(mine.filter((s) => s.rolled > 0 && since(s) > start + roll + 5).map(since), `${name}: still rolling after ${(start + roll).toFixed(1)} ms`).toEqual([]);
    } else {
      expect(last.max, `${name} ends gone`).toBe(0);
      expect(since(mine.find((s) => s.max === 0)!), `${name}: not gone before ${dur} ms`).toBeGreaterThan(dur - 1);
      expect(mine.filter((s) => s.max > 0 && since(s) > dur + 5).map(since), `${name}: still visible after ${dur} ms`).toEqual([]);
    }
  }
  const end = m.dir === 'out' ? dur : (n - 1) * step + (roll || dur);
  expect(ph.off - ph.on, `${at}: over at ${end.toFixed(1)} ms, not before`).toBeGreaterThan(end - 1);
  const moving = snaps.filter((s) => s.max > 0 && s.min < 1);
  expect(moving.length, `${at}: a step of the decoder seen part-way`).toBeGreaterThan(0);
  if (m.reduced) expect(snaps.filter((s) => !s.equal).map(id), `${at}: a fade, each line's glyphs at one opacity`).toEqual([]);
  else {
    expect(snaps.filter((s) => !s.mono).map(id), `${at}: the left of each line the more visible at every step (${m.dir === 'in' ? 'in from the left' : 'out from the right'})`).toEqual([]);
    expect(moving.some((s) => !s.equal), `${at}: a wipe, uneven part-way, not a fade`).toBe(true);
  }
  if (roll) expect(snaps.some((s) => s.shownRolled > 0), `${at}: a visible glyph shows a character other than its final one`).toBe(true);
  else expect(snaps.filter((s) => s.rolled > 0).map(id), `${at}: no glyph rolls`).toEqual([]);
}

test('AC5 and AC6: ten answers for The Quiet Curator with Math.random at 0.01 give Porcelain in full; the answer taken is marked at the press (underlined at 2 px) and stays marked and at full opacity while the rest of its question wipes out, holds 120 ms, then wipes out itself, and the next question decodes in; the result and the gift decode in staggered within 0.6 s; the swatches fade in on opacity; the announcement, the focus and the events queue', async ({ page, baseURL }) => {
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
  await logAnimate(page);
  await openQuiz(page, baseURL);
  await quiet(page);
  await begin(page);
  await settled(page);
  // card 1 by click, watched until card 2 has decoded in: the answer is marked, the count, the question and the other
  // answers wipe out while it stands at full opacity, it holds, then it wipes out itself and card 2 decodes in
  const ans = answerAt(0, 'curator');
  const flow = watch(page, '.qz-card[data-i="1"].is-top');
  await page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]').click();
  const w = await flow, { frames } = w;
  expect(w.timedOut, 'card 2 settled within the window').toBe(false);
  // the mark comes first: aria-pressed is set at the press, before a glyph of its question has moved, and taken off only
  // once its card is hidden (with the next card shown)
  expect(w.marks, 'marked at the press, before anything of card 1 moves; unmarked only with card 1 hidden').toEqual([
    { act: 'on', persona: 'curator', part: 'card0', before: 0, cardHidden: false },
    { act: 'off', persona: 'curator', part: 'card0', before: expect.any(Number), cardHidden: true },
  ]);
  const one = (f: Frame) => part(f, 'card0'), two = (f: Frame) => part(f, 'card1');
  const answerRow = (f: Frame) => one(f)?.find((x) => x.k === 'opt:curator');
  const rest = (f: Frame) => one(f)?.filter((x) => x.k !== 'opt:curator') ?? [];
  const pressed = frames.findIndex((f) => f.pressed !== ''), lastOne = frames.findLastIndex((f) => !!one(f)), firstTwo = frames.findIndex((f) => !!two(f));
  expect(pressed, 'frame 0 is drawn before the press').toBeGreaterThan(0);
  for (const f of frames.slice(0, pressed)) expect(f.underlined, 'before the press no answer carries the 2 px line').toEqual([]);
  // the mark as seen: on every frame from the press until card 1 goes, the answer taken is the one answer underlined at 2 px
  for (const f of frames.slice(pressed, lastOne + 1)) {
    expect(f.pressed, 'the answer stays marked until its card goes').toBe('curator');
    expect(f.underlined, 'drawn underlined at 2 px, the only answer so').toEqual(['curator']);
  }
  for (const f of frames.slice(lastOne + 1)) expect(f.underlined, 'card 2 comes with no answer underlined at 2 px').toEqual([]);
  // three phases: the rest of card 1 wipes out (0.2 s, right to left) with the answer untouched; the answer holds on its
  // own for 120 ms, then wipes out itself (0.2 s); card 2 decodes in (0.4 s wipe, 0.05 s apart, rolling until 0.75 s)
  expect(w.phases.length, 'the rest out, the answer out, card 2 in').toBe(3);
  expectMotion('the rest of card 1 wipes out', w, 0, { dir: 'out', keys: keys('card0', 9).filter((k) => k !== `card0:${ans}`) });
  expectMotion('then the answer taken wipes out', w, 1, { dir: 'out', keys: [`card0:${ans}`] });
  expectMotion('then card 2 decodes in', w, 2, { dir: 'in', keys: keys('card1', 10) });
  const held = w.phases[1].on - w.phases[0].off;
  expect(held, 'the answer holds 120 ms after the rest has gone').toBeGreaterThanOrEqual(119);
  expect(held, 'and not much longer').toBeLessThan(120 + 400);
  const hold = frames.findIndex((f) => f.pressed === 'curator' && answerRow(f)?.min === 1 && rest(f).length === 8 && rest(f).every((x) => x.max === 0));
  expect(hold, 'a frame of the hold: the answer taken at full opacity with the count, the question and the six other answers at opacity 0').toBeGreaterThanOrEqual(0);
  expect(rest(frames[hold]).map((x) => x.k).slice(0, 2), 'the count and the question are among them').toEqual(['.qz-count', '.qz-q']);
  expect(frames.slice(hold, lastOne + 1).every((f) => rest(f).every((x) => x.max === 0)), 'the answer goes alone: nothing else of card 1 comes back').toBe(true);
  expect(firstTwo, 'card 2 comes once card 1 has gone, never beside it').toBeGreaterThan(lastOne);
  expect(full(two(frames[frames.length - 1])), 'and settles at full opacity').toBe(true);
  for (const f of frames) expect(f.moved, 'nothing moves by transform').toEqual([]);
  expect(await deckState(page)).toEqual(only(1));
  // cards 2 to 9, then the last one watched: the result's lines and the gift's (23 in one list) decode in, the step
  // shrunk from 0.05 s so the last starts at 0.6 s
  await answer(page, CURATOR.slice(0, 9), 1);
  await onTop(page, 9);
  await settled(page);
  const finish = watch(page, '#find[data-state="result"]');
  await page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]').click();
  const e = await finish;
  expect(e.timedOut, 'the result settled within the window').toBe(false);
  expect(e.phases.length, 'card 10 out (the rest, then the answer), the result in').toBe(3);
  const lines = resultLines(r);
  expect(lines + GIFT_LINES, 'more lines than fit 0.05 s apart in 0.6 s').toBeGreaterThan(13);
  expectMotion('the result and the gift decode in', e, 2, { dir: 'in', keys: [...keys('result', lines), ...keys('gift', GIFT_LINES, lines)] });
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  await expectResult(page, r);
  await expect(page.locator('#qzLive')).toHaveText(`${Q.eyebrow}: Porcelain. The Quiet Curator.`);
  await expect(page.locator('.qz-result:not([hidden]) .qz-shade')).toBeFocused();
  await expect(page.locator('#qzDeck')).toBeHidden();
  await expect(page.locator('#qzGift')).toBeVisible();
  // the large swatch and the six compatible ones fade in on opacity over 400 ms; nothing else in the section is animated
  // through the Web Animations API (the decode sets each glyph's opacity itself)
  expect(await animateLog(page)).toEqual(['qz-big|opacity|400', ...r.others.map(() => 'qz-mini-sw|opacity|400')]);
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

test('AC5 Back: absent on card 1; after three answers it wipes card 4 out (an answer pressed meanwhile is not taken) and decodes card 3 back in, reading 03 / 10, the only card unhidden, no answer marked; answered again, the result follows the corrected answers', async ({ page, baseURL }) => {
  const uncorrected = [...BEFORE, ...FIXED.slice(BEFORE.length)];
  expect(scoreQuiz(uncorrected).id, 'the correction changes the result').not.toBe(scoreQuiz(FIXED).id);
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  await expect(page.locator('.qz-card[data-i="0"] .qz-back')).toHaveCount(0);
  await expect(page.locator('.qz-back')).toHaveCount(QUIZ_QUESTIONS.length - 1);
  await answer(page, BEFORE);
  await onTop(page, 3);
  await settled(page);   // card 4 has decoded in, so the watch below sees Back's wipe and nothing of card 4's own decode
  await quiet(page);
  const back = page.locator('.qz-card.is-top .qz-back');
  await expect(back).toHaveAccessibleName(Q.back);
  await expect(page.locator('.qz-card.is-top .qz-count > .sr-only')).toHaveText(Q.count(4));
  // Back, and in the same task an answer on the card it is wiping out: the deck is busy, so the answer is not taken
  const flow = watch(page, '.qz-card[data-i="2"].is-top');
  await page.evaluate(() => { const c = document.querySelector('.qz-card.is-top')!; c.querySelector<HTMLElement>('.qz-back')!.click(); c.querySelector<HTMLElement>('.qz-opt')!.click(); });
  const w = await flow, { frames } = w;
  expect(w.timedOut).toBe(false);
  const four = (f: Frame) => part(f, 'card3'), three = (f: Frame) => part(f, 'card2');
  expect(w.phases.length, 'card 4 out, card 3 in').toBe(2);
  expectMotion('Back wipes card 4 out', w, 0, { dir: 'out', keys: keys('card3', 10) });
  expectMotion('then card 3 decodes in', w, 1, { dir: 'in', keys: keys('card2', 10) });
  expect(frames.findIndex((f) => !!three(f)), 'card 3 comes once card 4 has gone, never beside it').toBeGreaterThan(frames.findLastIndex((f) => !!four(f)));
  expect(w.marks, 'the answer pressed during the wipe is not taken: nothing is marked').toEqual([]);
  expect(frames.every((f) => !f.pressed && f.underlined.length === 0), 'no answer is marked or underlined at 2 px').toBe(true);
  await onTop(page, 2);
  await settled(page);
  expect(await copies(page.locator('.qz-card.is-top .qz-count')), 'the count over the question').toEqual({ sr: Q.count(3), row: Q.count(3), faded: 0 });
  await expect(page.locator('.qz-card.is-top .qz-q > .sr-only')).toHaveText(QUIZ_QUESTIONS[2].q);
  await expect(page.locator('.qz-card.is-top .qz-opt[aria-pressed]')).toHaveCount(0);
  expect(await deckState(page)).toEqual(only(2));
  await expect(page.locator('.qz-card[data-i="3"]')).toBeHidden();
  await expect(page.locator('.qz-card[data-i="1"]')).toBeHidden();
  await answer(page, FIXED, 2);
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  const r = drawn(FIXED, 0.01);
  await expectResult(page, r);
  expect(await events(page)).toEqual([['quiz_start', {}], ...answered(BEFORE), ['quiz_back', { q: 4 }], ...answered(FIXED, 2), ['quiz_complete', { persona: r.p.id, shade: r.shade, others: r.others.join(',') }]]);
});

/** every click on the page from now on, caught before the deck's own listeners: when (the page's clock), its detail (2
 *  for the second click of a double click) and what it landed on */
interface Click { t: number; detail: number; on: string }
const logClicks = (page: Page): Promise<void> => page.evaluate(() => {
  const log: { t: number; detail: number; on: string }[] = [];
  (window as unknown as { __qzClicks: typeof log }).__qzClicks = log;
  document.addEventListener('click', (e) => {
    const t = e.target as Element, card = t.closest<HTMLElement>('.qz-card')?.dataset.i, opt = t.closest<HTMLElement>('.qz-opt');
    log.push({ t: performance.now(), detail: e.detail, on: t.closest('#qzBegin') ? 'begin' : opt ? `opt:${opt.dataset.persona}@${card}` : t.closest('.qz-back') ? `back@${card}` : t.tagName.toLowerCase() });
  }, true);
});
const clicks = (page: Page): Promise<Click[]> => page.evaluate(() => (window as unknown as { __qzClicks: { t: number; detail: number; on: string }[] }).__qzClicks);

/** arm(): a watch in the page for card i's next time on screen (showCard giving it is-top); shown(): that time */
const arm = (page: Page, i: number): Promise<void> => page.evaluate((i) => {
  const c = document.querySelector<HTMLElement>(`.qz-card[data-i="${i}"]`)!;
  (window as unknown as { __qzShown: Promise<number> }).__qzShown = new Promise<number>((res) => {
    const mo = new MutationObserver(() => { if (c.classList.contains('is-top')) { mo.disconnect(); res(performance.now()); } });
    mo.observe(c, { attributes: true, attributeFilter: ['class'] });
  });
}, i);
const shown = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { __qzShown: Promise<number> }).__qzShown);

/** a double click where the mouse stands: the first click now, the second (detail 2, as a real double click sends it)
 *  the moment the next question is on screen under the pointer, which is about 0.2 s later, the wipe out between */
async function doubleClick(page: Page, x: number, y: number, next: number): Promise<{ one: Click; two: Click; at: number }> {
  await logClicks(page);
  await arm(page, next);
  await page.mouse.click(x, y);
  const at = await shown(page);
  await page.mouse.down({ clickCount: 2 }); await page.mouse.up({ clickCount: 2 });
  await settled(page);
  const [one, two] = await clicks(page);
  // the clicks are those of a double click, and the second lands inside the guard of the question just put on screen
  expect(two, 'two clicks').toBeTruthy();
  expect(two.detail, 'a double click').toBe(2);
  expect(two.t - one.t, 'the second about 0.2 s after the first').toBeGreaterThanOrEqual(150);
  expect(two.t - one.t).toBeLessThan(500);
  expect(two.t - at, 'the second after the next question was put on screen').toBeGreaterThanOrEqual(0);
  expect(two.t - at, 'and inside its guard').toBeLessThan(GUARD);
  return { one, two, at };
}

test('AC5 the guard, a double click on "Swipe to begin": its second click lands about 0.2 s after the first, on an answer of question 1 just put on screen where Begin stood, and is dropped (question 1 stays on top, nothing marked, no answer taken); a click at that spot once the question has settled is taken', async ({ page, baseURL }) => {
  await openQuiz(page, baseURL);
  await quiet(page);
  const b = (await page.locator('#qzBegin').boundingBox())!, x = b.x + b.width / 2, y = b.y + b.height / 2;
  const { one, two } = await doubleClick(page, x, y, 0);
  expect([one.on, one.detail], 'the first click: Begin').toEqual(['begin', 1]);
  expect(two.on, 'the second, at the same spot: an answer of question 1').toMatch(/^opt:[a-z]+@0$/);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'no answer taken').toEqual([]);
  await expect(page.locator('.qz-card[data-i="0"] .qz-opt[aria-pressed]')).toHaveCount(0);
  expect(await deckState(page), 'question 1 stays on top').toEqual(only(0));
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  // the same spot once question 1 has settled: a press like any other
  await page.mouse.click(x, y);
  await onTop(page, 1);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer')).toEqual([['quiz_answer', { q: 1, persona: two.on.slice(4, -2) }]]);
});

test('AC5 the guard, a double click on Back: the second click lands on the Back of the question just put back on screen (the same spot: every question\'s Back sits at the foot of the one grid cell) and is dropped, so the deck goes back once, to question 2, not twice; Back pressed again once that question has settled is taken', async ({ page, baseURL }) => {
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, ['main', 'spark']);
  await onTop(page, 2);
  await settled(page);
  await quiet(page);
  const b = (await page.locator('.qz-card.is-top .qz-back').boundingBox())!, x = b.x + b.width / 2, y = b.y + b.height / 2;
  const { one, two } = await doubleClick(page, x, y, 1);
  expect([one.on, one.detail], 'the first click: question 3\'s Back').toEqual(['back@2', 1]);
  expect(two.on, 'the second, at the same spot: question 2\'s Back').toBe('back@1');
  expect(await deckState(page), 'back once, to question 2').toEqual(only(1));
  expect(await copies(page.locator('.qz-card.is-top .qz-count')), 'reading 02 / 10').toEqual({ sr: Q.count(2), row: Q.count(2), faded: 0 });
  expect((await events(page)).filter(([n]) => n === 'quiz_back'), 'one Back taken').toEqual([['quiz_back', { q: 3 }]]);
  // pressed again once question 2 has settled: taken, to question 1
  await page.mouse.click(x, y);
  await onTop(page, 0);
  expect(await deckState(page)).toEqual(only(0));
  expect((await events(page)).filter(([n]) => n === 'quiz_back')).toEqual([['quiz_back', { q: 3 }], ['quiz_back', { q: 2 }]]);
  // answered on from there, the answers are the new ones
  await answer(page, ['dreamer', 'curator']);
  await onTop(page, 2);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer')).toEqual([...answered(['main', 'spark']), ...answered(['dreamer', 'curator'])]);
});

/** armed in the page: `ms` after card i is next put on screen (given is-top by showCard), a press on its answer for
 *  `persona`; pressedAt() gives when it landed (ms after the card came) and whether it was marked at the press */
const pressAfter = (page: Page, i: number, persona: PersonaId, ms: number): Promise<void> => page.evaluate(({ i, persona, ms }) => {
  const c = document.querySelector<HTMLElement>(`.qz-card[data-i="${i}"]`)!, o = c.querySelector<HTMLElement>(`.qz-opt[data-persona="${persona}"]`)!;
  const w = window as unknown as { __qzPress?: Record<number, { at: number; pressed: boolean }> };
  const mo = new MutationObserver(() => {
    if (!c.classList.contains('is-top')) return;
    mo.disconnect();
    const t0 = performance.now();
    setTimeout(() => { const at = performance.now() - t0; o.click(); (w.__qzPress ??= {})[i] = { at, pressed: o.hasAttribute('aria-pressed') }; }, ms);
  });
  mo.observe(c, { attributes: true, attributeFilter: ['class'] });
}, { i, persona, ms });
const pressedAt = async (page: Page, i: number): Promise<{ at: number; pressed: boolean }> =>
  await (await page.waitForFunction((i) => (window as unknown as { __qzPress?: Record<number, { at: number; pressed: boolean }> }).__qzPress?.[i], i)).jsonValue() as { at: number; pressed: boolean };

test('AC5 the guard, an answer pressed 100 ms after its question was put on screen is dropped (not marked, not taken, the question stays on top); the same answer pressed once the question has settled is taken', async ({ page, baseURL }) => {
  await openQuiz(page, baseURL);
  await begin(page);
  await settled(page);
  // armed before question 1 is answered: 100 ms after question 2 is put on screen, a press on its answer for The Spark
  await pressAfter(page, 1, 'spark', 100);
  await page.locator('.qz-card.is-top .qz-opt[data-persona="main"]').click();
  await onTop(page, 1);
  const early = await pressedAt(page, 1);
  expect(early.at, 'pressed 100 ms after question 2 was put on screen').toBeGreaterThanOrEqual(100);
  expect(early.at, 'inside the guard').toBeLessThan(GUARD);
  expect(early.pressed, 'not marked at the press').toBe(false);
  await settled(page);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'not taken').toEqual(answered(['main']));
  await expect(page.locator('.qz-card[data-i="1"] .qz-opt[aria-pressed]')).toHaveCount(0);
  expect(await deckState(page), 'question 2 stays on top').toEqual(only(1));
  await page.locator('.qz-card.is-top .qz-opt[data-persona="spark"]').click();
  await onTop(page, 2);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'taken once settled').toEqual(answered(['main', 'spark']));
});

test('AC5 and AC9 the guard under reduced motion is 150 ms: an answer pressed 100 ms after its question was put on screen is dropped (not marked, not taken); one pressed 200 ms after, inside the 350 ms of full motion, is marked at the press and taken', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await openQuiz(page, baseURL);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'reduced motion').toBe(true);
  await begin(page);
  await settled(page);
  // 100 ms after question 2 is put on screen: inside the 150 ms, dropped
  await pressAfter(page, 1, 'spark', 100);
  await page.locator('.qz-card.is-top .qz-opt[data-persona="main"]').click();
  await onTop(page, 1);
  const early = await pressedAt(page, 1);
  expect(early.at, 'pressed 100 ms after question 2 was put on screen').toBeGreaterThanOrEqual(100);
  expect(early.at, 'inside the reduced guard').toBeLessThan(GUARD_REDUCED);
  expect(early.pressed, 'not marked at the press').toBe(false);
  await settled(page);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'not taken').toEqual(answered(['main']));
  await expect(page.locator('.qz-card[data-i="1"] .qz-opt[aria-pressed]')).toHaveCount(0);
  expect(await deckState(page), 'question 2 stays on top').toEqual(only(1));
  // 200 ms after question 3 is put on screen: past the 150 ms, so taken, where the full-motion 350 would drop it
  await pressAfter(page, 2, 'curator', 200);
  await page.locator('.qz-card.is-top .qz-opt[data-persona="spark"]').click();
  const late = await pressedAt(page, 2);
  expect(late.at, 'pressed 200 ms after question 3 was put on screen').toBeGreaterThanOrEqual(200);
  expect(late.at, 'inside the full-motion guard').toBeLessThan(GUARD);
  expect(late.pressed, 'marked at the press').toBe(true);
  await onTop(page, 3);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'taken').toEqual(answered(['main', 'spark', 'curator']));
  await ctx.close();
});

test('AC5 the keyboard: from the focused card Down and Up move among the answers and Enter commits; Tab from the last answer reaches Back and then leaves the deck; every other card is hidden and inert and never takes focus; Space commits too', async ({ page, baseURL }) => {
  await openQuiz(page, baseURL);
  await begin(page);
  const active = () => page.evaluate(() => { const a = document.activeElement as HTMLElement; return `${a.tagName.toLowerCase()}${a.className ? '.' + a.className.split(' ').join('.') : ''}${a.closest('.qz-card') ? '@' + (a.closest('.qz-card') as HTMLElement).dataset.i : ''}`; });
  const opts0 = page.locator('.qz-card[data-i="0"] .qz-opt'), opts1 = page.locator('.qz-card[data-i="1"] .qz-opt'), back1 = page.locator('.qz-card[data-i="1"] .qz-back');
  const first = QUIZ_QUESTIONS[0].answers[0], last = QUIZ_QUESTIONS[1].answers[6];
  await page.keyboard.press('ArrowDown'); await expect(opts0.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(opts0.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowUp'); await expect(opts0.nth(0)).toBeFocused();
  await expect(opts0.nth(0)).toHaveAccessibleName(first.text);
  await expect(opts0.nth(0)).toHaveAttribute('data-persona', first.persona);
  await ready(page, 0);   // Enter on an answer is a press like a click: past the guard
  await page.keyboard.press('Enter');
  await onTop(page, 1);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer')).toEqual([['quiz_answer', { q: 1, persona: first.persona }]]);
  // card 2: Up from the card goes to the last answer, Tab from there to Back, and the next Tab leaves the deck
  await page.keyboard.press('ArrowUp'); await expect(opts1.nth(6)).toBeFocused();
  await page.keyboard.press('Tab'); await expect(back1).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await active(), 'the Tab after Back leaves the deck').not.toMatch(/@/);
  expect(await deckState(page)).toEqual(only(1));
  const next = page.locator('.qz-card[data-i="2"]');
  await expect(next).toBeHidden();
  expect(await next.evaluate((c) => (c as HTMLElement).inert)).toBe(true);
  expect(await next.locator('.qz-opt').first().evaluate((b) => { (b as HTMLElement).focus(); return document.activeElement === b; }), 'not even a script can focus it').toBe(false);
  // Shift+Tab comes back through Back to the last answer, and Space commits it
  await page.keyboard.press('Shift+Tab'); await expect(back1).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(opts1.nth(6)).toBeFocused();
  await expect(opts1.nth(6)).toHaveAttribute('data-persona', last.persona);
  await expect(opts1.nth(6)).toHaveAccessibleName(last.text);
  await ready(page, 1);
  await page.keyboard.press('Space');
  await onTop(page, 2);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer')).toEqual([['quiz_answer', { q: 1, persona: first.persona }], ['quiz_answer', { q: 2, persona: last.persona }]]);
});

/** an element's focus as drawn: its outline, and the ring its ::before draws inside it (DESIGN.md 4) */
const focusLook = (el: Locator) => el.evaluate((e) => {
  const cs = getComputedStyle(e), b = getComputedStyle(e, '::before');
  return { outline: cs.outlineStyle === 'none' ? 'none' : `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} offset ${cs.outlineOffset}`, ring: b.content === 'none' || b.content === 'normal' ? 'none' : `${b.borderTopStyle} ${b.borderTopWidth} ${b.borderTopColor} inset ${b.top}` };
});

test('AC5 and AC7 a question takes focus from script only: every card is tabindex -1, so Shift+Tab from its first answer leaves the deck and Tab comes back to that answer, never the card; focused after Begin pressed with Enter (so matching :focus-visible), the card draws no outline and no ring, while its answers keep the Ember Luxe outline with the Urban Slate ring; the shade\'s name and the gift\'s done line, focused from script at the end of a keyboard run (so matching :focus-visible too), draw none either', async ({ page, baseURL }) => {
  await page.route('**/api/quiz-lead', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await openQuiz(page, baseURL);
  expect(await page.locator('.qz-card').evaluateAll((cs) => cs.map((c) => c.getAttribute('tabindex'))), 'every card, as the server draws it').toEqual(Array(10).fill('-1'));
  await page.locator('#qzBegin').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
  const card = page.locator('.qz-card[data-i="0"]');
  expect(await card.evaluate((c) => c.matches(':focus-visible')), 'focused by script after a key: where a focus ring would show').toBe(true);
  expect(await focusLook(card), 'the question draws no outline and no ring').toEqual({ outline: 'none', ring: 'none' });
  expect(await page.locator('.qz-card').evaluateAll((cs) => cs.map((c) => (c as HTMLElement).tabIndex)), 'and none is in the Tab order once the deck has run').toEqual(Array(10).fill(-1));
  expect(await deckState(page)).toEqual(only(0));
  await page.keyboard.press('ArrowDown');
  const first = card.locator('.qz-opt').first();
  await expect(first).toBeFocused();
  expect(await focusLook(first), 'an answer keeps the outline and the ring').toEqual({ outline: `solid 2px ${EMBER} offset 2px`, ring: `solid 2px ${URBAN_SLATE} inset -2px` });
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => { const a = document.activeElement; return a?.closest('.qz-card') ? `in the deck: ${a.className}` : 'out'; }), 'Shift+Tab from the first answer passes the card by').toBe('out');
  await page.keyboard.press('Tab');
  await expect(first, 'and Tab comes back to the first answer').toBeFocused();
  // the rest by keyboard (Down to each question's first answer, Enter): the result focuses the shade's name from script
  for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
    await ready(page, i);
    if (i > 0) await page.keyboard.press('ArrowDown');
    await expect(page.locator(`.qz-card[data-i="${i}"] .qz-opt`).first()).toBeFocused();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  const shade = page.locator('.qz-result:not([hidden]) .qz-shade');
  await expect(shade).toBeFocused();
  expect(await shade.evaluate((e) => e.matches(':focus-visible')), 'the shade\'s name, focused from script after a key: where a focus ring would show').toBe(true);
  expect(await focusLook(shade), 'the shade\'s name draws no outline and no ring').toEqual({ outline: 'none', ring: 'none' });
  // the gift by keyboard: the address typed, the box ticked with Space, Enter in the field; the done line takes focus
  await settled(page);
  await page.locator('#qzEmail').focus();
  await page.keyboard.type(EMAIL);
  await page.locator('#qzConsent').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#qzConsent')).toBeChecked();
  await page.locator('#qzEmail').focus();
  await page.keyboard.press('Enter');
  const done = page.locator('.qz-done-text');
  await expect(said(done)).toHaveText(Q.done(EMAIL));
  await expect(done).toBeFocused();
  expect(await done.evaluate((e) => e.matches(':focus-visible')), 'the done line, focused from script after a key').toBe(true);
  expect(await focusLook(done), 'the done line draws no outline and no ring').toEqual({ outline: 'none', ring: 'none' });
});

test('AC5 "Not quite? Try again" wipes the result and the gift out, decodes card 1 back in reading 01 / 10 with no Back, the only card unhidden, scrolls the section to its top, and hides the result and the gift; with Math.random changed, the second run draws another shade of the same group', async ({ page, baseURL }) => {
  const DREAMER = Array<PersonaId>(10).fill('dreamer');
  const one = drawn(DREAMER, 0.01), two = drawn(DREAMER, 0.5);
  expect([one.p.id, one.shade, one.name, two.p.id, two.shade, two.name]).toEqual(['dreamer', 'vivid-violet-13', 'Wildberry', 'dreamer', 'blissful-blue-18', 'Teal']);
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, DREAMER);
  await expectResult(page, one);
  await expect(page.locator('#qzGift')).toBeVisible();
  // down to the gift's end, so the section's top is well above the viewport when the retry is pressed
  await page.evaluate(() => document.getElementById('qzGift')!.scrollIntoView({ block: 'end' }));
  const top = () => page.evaluate(() => document.getElementById('find')!.getBoundingClientRect().top);
  expect(await top()).toBeLessThan(-100);
  await quiet(page);
  const flow = watch(page, '.qz-card[data-i="0"].is-top');
  await page.locator('.qz-result:not([hidden]) .qz-retry').click();
  const w = await flow, { frames } = w;
  expect(w.timedOut).toBe(false);
  expect(w.phases.length, 'the result and the gift out, card 1 in').toBe(2);
  const lines = resultLines(one);
  expectMotion('the retry wipes the result and the gift out', w, 0, { dir: 'out', keys: [...keys('result', lines), ...keys('gift', GIFT_LINES, lines)] });
  expectMotion('then card 1 decodes in', w, 1, { dir: 'in', keys: keys('card0', 9) });
  expect(frames.findIndex((f) => !!part(f, 'card0')), 'card 1 comes once the result has gone, never beside it').toBeGreaterThan(frames.findLastIndex((f) => !!part(f, 'result') || !!part(f, 'gift')));
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
  await settled(page);
  expect(await copies(page.locator('.qz-card.is-top .qz-count'))).toEqual({ sr: Q.count(1), row: Q.count(1), faded: 0 });
  await expect(page.locator('.qz-card.is-top .qz-back')).toHaveCount(0);
  expect(await deckState(page)).toEqual(only(0));
  await expect(page.locator('#qzResults')).toBeHidden();
  await expect(page.locator('#qzGift')).toBeHidden();
  await expect.poll(top, { message: 'the section scrolls back to its top' }).toBeGreaterThan(-1.5);
  expect(await top()).toBeLessThan(1.5);
  await page.evaluate(() => { Math.random = () => 0.5; });
  await answer(page, DREAMER);
  await expectResult(page, two);   // the first draw is back among the compatible shades and the second one hidden there
  expect((await events(page)).filter(([n]) => n !== 'quiz_answer')).toEqual([['quiz_start', {}], ['quiz_complete', { persona: 'dreamer', shade: one.shade, others: one.others.join(',') }], ['quiz_retake', {}], ['quiz_complete', { persona: 'dreamer', shade: two.shade, others: two.others.join(',') }]]);
});

/** a label the server split (or the loader's say()): each child as class|aria-hidden|text|text-transform */
const labelCopies = (el: Locator): Promise<string[]> => el.evaluate((b) => [...b.children].map((c) => `${c.className}|${c.getAttribute('aria-hidden')}|${c.textContent}|${getComputedStyle(c).textTransform}`));
/** Sam's words for assistive technology in his case, and the copy drawn, aria-hidden, in capitals */
const twoCopies = (text: string): string[] => [`sr-only|null|${text}|none`, `|true|${text}|uppercase`];

// AC5's pending path (quiz.md 7 item 5, D18) with the chunk held by a route after the observer asked for it: Quiz.astro's
// loader keys on the chunk having mounted, not on the import having started, so a press that lands while the fetch is in
// flight shows "Loading..." with aria-disabled and aria-busy, keeps focus, and the quiz begins by itself on arrival.
test('AC5 a press while the chunk is in flight shows "Loading..." (in two copies, as the server draws the label) with aria-disabled and aria-busy, keeps focus, and begins by itself on arrival', async ({ page, baseURL }) => {
  let release = (): void => undefined; const held = new Promise<void>((r) => { release = r; });
  await page.route(DECK, async (route) => { await held; await route.continue(); });
  const requested = page.waitForRequest(DECK);
  await openQuiz(page, baseURL, false);
  await requested;   // the observer has asked for the chunk and the route holds it
  const button = page.locator('#qzBegin');
  await expect(button).toHaveAccessibleName(Q.begin);
  await button.click();
  await expect(button).toHaveAccessibleName(Q.loading, { timeout: 3000 });
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toBeFocused();
  expect(await labelCopies(button), 'in two copies, as the server draws the label').toEqual(twoCopies(Q.loading));
  release();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
  expect(await deckState(page)).toEqual(only(0));
});

test('AC5 an aborted chunk leaves "Swipe to begin" live; a press retries through a fresh URL and shows "Loading..." until that fails too, then gives the button back (its label read from data-label, in two copies), and the next press begins once the chunk can load', async ({ page, baseURL }) => {
  let mode: 'abort' | 'hold' | 'load' = 'abort';
  let release = (): void => undefined; const held = new Promise<void>((r) => { release = r; });
  await page.route(DECK, async (route) => { if (mode === 'load') return route.continue(); if (mode === 'hold') await held; return route.abort('failed'); });
  const failed = page.waitForEvent('requestfailed', (r) => DECK.test(r.url()));
  await openQuiz(page, baseURL, false);
  await failed;   // the observer's import was aborted
  const button = page.locator('#qzBegin');
  await expect(button).toHaveAccessibleName(Q.begin);
  await expect(button).not.toHaveAttribute('aria-disabled', 'true');
  // the next attempt is held by the route, so "Loading..." can be seen before it fails; the browser's module map keeps
  // the failed URL, so the loader asks again through the URL the error named, with ?r=
  mode = 'hold';
  const retried = page.waitForRequest((r) => DECK.test(r.url()) && /\?r=\d+$/.test(r.url()));
  await button.click();
  await retried;
  await expect(button).toHaveAccessibleName(Q.loading);
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  expect(await labelCopies(button)).toEqual(twoCopies(Q.loading));
  release();   // into the abort: the loader resets and gives the button back
  await expect(button).toHaveAccessibleName(Q.begin);
  expect(await labelCopies(button), 'the label back from data-label, in its two copies').toEqual(twoCopies(Q.begin));
  await expect(button).not.toHaveAttribute('aria-busy', 'true');
  await expect(button).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'intro');
  mode = 'load';
  await button.click();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
});

test('AC5 the decode: the intro stands at rest, split into its glyphs at full opacity with no decode run; Begin wipes it out right to left over 0.2 s and card 1 decodes in, each line 0.05 s after the one before, a left-to-right wipe over 0.4 s while every glyph rolls through others until 0.75 s; settled, the row reads the question upper-cased with no inline opacity, and the answers are named in Sam\'s sentence case', async ({ page, baseURL }) => {
  const q = QUIZ_QUESTIONS[0];
  await logDecoding(page);
  await openQuiz(page, baseURL);
  await quiet(page);
  // rule 12: the intro is visible at rest, as the server drew it, and mounting it ran no decode
  expect(await decodingLog(page), 'no decode ran at mount').toEqual([]);
  await expect(page.locator('#find')).not.toHaveAttribute('data-decoding');
  await expect(page.locator('#qzIntro')).toBeVisible();
  for (const [sel, text] of [['.qz-h', Q.h], ['.qz-sub', Q.sub], ['#qzBegin', Q.begin]]) expect(await copies(page.locator(`#qzIntro ${sel}`)), sel).toEqual({ sr: text, row: text.toUpperCase(), faded: 0 });
  await expect(page.getByRole('heading', { name: Q.h, exact: true })).toHaveClass(/qz-h/);
  await expect(page.locator('#qzBegin')).toHaveAccessibleName(Q.begin);
  const flow = watch(page, '.qz-card[data-i="0"].is-top');
  await page.locator('#qzBegin').click();
  const w = await flow, { frames } = w;
  expect(w.timedOut).toBe(false);
  expect(full(part(frames[0], 'intro')), 'the intro at full opacity until the press').toBe(true);
  expect(w.phases.length, 'the intro out, card 1 in').toBe(2);
  expectMotion('Begin wipes the intro out', w, 0, { dir: 'out', keys: keys('intro', 3) });
  expectMotion('card 1 decodes in', w, 1, { dir: 'in', keys: keys('card0', 9) });
  expect(w.rolledWrites, 'the roll writes other characters into the glyphs').toBeGreaterThan(0);
  const cards = frames.map((f) => part(f, 'card0'));
  const firstCard = cards.findIndex((c) => !!c);
  expect(firstCard, 'card 1 comes once the intro has gone, never beside it').toBeGreaterThan(frames.findLastIndex((f) => !!part(f, 'intro')));
  const reveal = cards.slice(firstCard) as Row[][];
  expect(reveal[0].map((x) => x.k), 'the count, the question and the seven answers, in reading order; no Back on card 1').toEqual(['.qz-count', '.qz-q', ...q.answers.map((a) => `opt:${a.persona}`)]);
  expect(full(reveal[reveal.length - 1]), 'settled at full opacity').toBe(true);
  await settled(page);
  const card = page.locator('.qz-card[data-i="0"]');
  expect(await card.locator('.qz-q').evaluate((e) => e.querySelector(':scope > .dc')!.textContent), 'the glyph row reads the question upper-cased').toBe(q.q.toUpperCase());
  expect(await card.evaluate((c) => [...c.querySelectorAll<HTMLElement>('.dc > span')].filter((s) => s.hasAttribute('style') && s.style.opacity !== '').length), 'no glyph carries an inline opacity').toBe(0);
  expect(await copies(card.locator('.qz-count'))).toEqual({ sr: Q.count(1), row: Q.count(1), faded: 0 });
  await expect(card.locator('.qz-count')).toHaveAttribute('aria-hidden', 'true');
  await expect(card.locator('.qz-q > .sr-only')).toHaveText(q.q);
  await expect(page.getByRole('group', { name: Q.cardAria(1), exact: true })).toHaveAttribute('data-i', '0');
  await expect(card.locator('.qz-opt').first(), 'the first answer is named in Sam\'s words').toHaveAccessibleName(q.answers[0].text);
  for (const [k, a] of q.answers.entries()) await expect(card.locator('.qz-opt').nth(k)).toHaveAccessibleName(a.text);
  for (const row of await card.locator('.dc').all()) await expect(row).toHaveAttribute('aria-hidden', 'true');
  const log = await decodingLog(page);
  expect(log[0], 'the decode flag went on at the press').toBe('on@intro');
  expect(log[log.length - 1], 'and is off once settled').toMatch(/^off@/);
});

test('AC5 a hidden page: a decode under way jumps to its end state at visibilitychange, and a commit made while hidden shows the next card settled with no roll', async ({ page, baseURL }) => {
  await openQuiz(page, baseURL);
  // Begin, then the moment card 1 is on top (decoding in), the page goes hidden: everything settles at once
  const jump = await page.evaluate(() => new Promise<Record<string, unknown>>((res) => {
    const root = document.getElementById('find')!;
    const look = (c: Element) => ({ decoding: root.hasAttribute('data-decoding'), faded: [...c.querySelectorAll<HTMLElement>('.dc > span')].filter((s) => s.style.opacity !== '').length });
    document.getElementById('qzBegin')!.click();
    const tick = () => {
      const card = document.querySelector('.qz-card[data-i="0"].is-top');
      if (!card) { requestAnimationFrame(tick); return; }
      const before = look(card);
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      res({ before, after: look(card) });
    };
    tick();
  }));
  expect(jump.before, 'card 1 was decoding in').toMatchObject({ decoding: true });
  expect((jump.before as { faded: number }).faded).toBeGreaterThan(0);
  expect(jump.after, 'and stands settled at once').toEqual({ decoding: false, faded: 0 });
  // the press was a script's, so the page has no focus yet: the card is the active element all the same
  expect(await page.evaluate(() => document.activeElement?.matches('.qz-card[data-i="0"].is-top'))).toBe(true);
  // a commit while hidden (once past the guard): no frame is needed, the rest wipes out at once, the answer goes after
  // its hold, card 2 settled
  await ready(page, 0);
  const flow = watch(page, '.qz-card[data-i="1"].is-top');
  await page.locator('.qz-card.is-top .qz-opt').first().click();
  const { frames, rolledWrites } = await flow;
  await onTop(page, 1);
  expect(rolledWrites, 'no glyph rolls').toBe(0);
  for (const f of frames) if (part(f, 'card1')) expect(full(part(f, 'card1')), 'card 2 is never seen part-way').toBe(true);
  expect(await copies(page.locator('.qz-card.is-top .qz-q'))).toEqual({ sr: QUIZ_QUESTIONS[1].q, row: QUIZ_QUESTIONS[1].q.toUpperCase(), faded: 0 });
  await expect(page.locator('#find')).not.toHaveAttribute('data-decoding');
});

/** every element of #find, hidden ones too (a box on one would show the moment it is shown), and its ::before and ::after
 *  with a fill, a background image or a border: none but the swatches (the shade's colour, with a 1 px hairline: Urban
 *  Slate where data-ring asks for it on the fog of the 3D tier, Pearl Whisper where data-ring-night asks for it on the
 *  poster tier's night), the email field's underline (checked on its own) and the strips of an answer picture, whose
 *  background is the photograph (picture.ts draws the <img>'s chosen source through the CSSOM) with no fill and no border.
 *  Focus is dropped first: the focus ring's ::before is a box on :focus-visible only */
const boxed = (page: Page): Promise<string[]> => page.evaluate(({ CLEAR, URBAN_SLATE, PEARL }) => {
  const had = document.activeElement as HTMLElement | null;
  had?.blur?.();
  const found = [...document.querySelectorAll<HTMLElement>('#find, #find *')].flatMap((e) => [null, '::before', '::after'].map((p) => {
    const cs = getComputedStyle(e, p), border = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join(' ');
    const what = `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}${[...e.classList].map((c) => `.${c}`).join('')}${p ?? ''}`;
    if (!p && e.matches('.qz-pics .qz-strip')) {
      const layer = e.closest<HTMLElement>('.qz-shot'), img = e.closest('.qz-pics')?.querySelector<HTMLImageElement>(`.qz-pic[data-persona="${layer?.dataset.persona}"] img`);
      const photo = !!img?.currentSrc && cs.backgroundImage === `url("${img.currentSrc}")`;   // built and drawn at once (picture.ts build()), so never none
      return border === '0px 0px 0px 0px' && cs.backgroundColor === CLEAR && photo ? '' : `${what}: ${cs.backgroundColor} ${cs.backgroundImage} ${border}`;
    }
    if (!p && e.matches('.qz-big, .qz-mini-sw')) {
      const fog = document.documentElement.classList.contains('hero3d'), ring = e.hasAttribute(fog ? 'data-ring' : 'data-ring-night');
      return border === (ring ? '1px 1px 1px 1px' : '0px 0px 0px 0px') && (!ring || cs.borderTopColor === (fog ? URBAN_SLATE : PEARL)) && cs.backgroundImage === 'none' ? '' : `${what}: ${border} ${cs.borderTopColor} ${cs.backgroundImage}`;
    }
    const fill = cs.backgroundColor !== CLEAR || cs.backgroundImage !== 'none', edge = border !== '0px 0px 0px 0px' && !(!p && e.id === 'qzEmail');
    return fill || edge ? `${what}: ${cs.backgroundColor} ${cs.backgroundImage} ${border}` : '';
  })).filter(Boolean);
  had?.focus?.({ preventScroll: true });   // and given back, so the deck's own focus carries on
  return found;
}, { CLEAR, URBAN_SLATE, PEARL });

/** no box-shadow or text-shadow on anything in #find, its ::before and ::after included */
const shadowed = (page: Page): Promise<string[]> => page.evaluate(() => [...document.querySelectorAll('#find, #find *')].flatMap((e) => [null, '::before', '::after'].map((p) => { const cs = getComputedStyle(e, p); return cs.boxShadow !== 'none' || cs.textShadow !== 'none' ? `${e.className}${p ?? ''}: ${cs.boxShadow} ${cs.textShadow}` : ''; })).filter(Boolean));

/** the type scale (quiz.css, 2026-10-20): each size a clamp() of the screen's width and height, 1rem being 16 px; the
 *  label (the body and the answers) 15 to 22 px, the question and headline step 24 to 52, the shade's name 36 to 88 */
interface Sizes { label: number; step: number; name: number }
function typeScale(w: number, h: number): Sizes {
  const clamp = (lo: number, v: number, hi: number) => Math.min(hi, Math.max(lo, v)), vw = w / 100, vh = h / 100, rem = 16;
  return { label: clamp(15, Math.min(0.6 * rem + 0.95 * vw, 2.6 * vh), 22), step: clamp(24, Math.min(rem + 2.3 * vw, 5 * vh), 52), name: clamp(36, Math.min(rem + 4.6 * vw, 10 * vh), 88) };
}

/** every line of #find as drawn, hidden ones too, that is not in section 2's label type: each decoded element and its
 *  glyph row, the lines that are not decoded (the field errors, the status line, the done line, Not you), the consent
 *  tick and anything else holding text of its own; less the visually hidden copies (what assistive technology reads, not
 *  what is drawn) and the email field (the address keeps the case it is typed in, at 16 px against iOS's zoom). The size
 *  by role, from the type scale for the screen (typeScale()): the label's (the body and the answers), the question and
 *  headline step, and the shade's name, each within 0.01 px of its clamp() */
const offType = async (page: Page, sizes: Sizes): Promise<string[]> => {
  const lines = await page.evaluate(() => {
    const els = new Set<Element>(document.querySelectorAll('#find [data-dc], #find .dc, #find .qz-err, #find .qz-msg, #find .qz-done-text, #find .qz-notyou, #find .qz-tick'));
    for (const e of document.querySelectorAll('#find *')) if ([...e.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim())) els.add(e);
    return [...els].filter((e) => !e.closest('.sr-only, .dc > span, #qzEmail, noscript')).map((e) => {
      const cs = getComputedStyle(e), role = e.closest('.qz-shade') ? 'name' : e.closest('.qz-h, .qz-q, .qz-own, .qz-gift-h') ? 'step' : 'label';
      return { what: `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}${[...e.classList].map((c) => `.${c}`).join('')}`, role, got: [cs.fontFamily.split(',')[0].trim(), cs.fontWeight, cs.textTransform, cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing, cs.color, cs.fontSize].join('|') };
    });
  });
  expect(lines.length, 'lines found').toBeGreaterThan(100);
  return lines.filter((l) => {
    const cut = l.got.lastIndexOf('|'), size = parseFloat(l.got.slice(cut + 1));
    return l.got.slice(0, cut) !== `"IBM Plex Mono"|500|uppercase|0px|${PEARL}` || !(Math.abs(size - sizes[l.role as keyof Sizes]) <= 0.01);
  }).map((l) => `${l.what} (${l.role}): ${l.got}, not ${sizes[l.role as keyof Sizes].toFixed(3)}px`);
};

/** the text controls of #find (Begin, Back, See it on the case, Try again, Send my gift, Not you) that are not underlined */
const plainLinks = (page: Page): Promise<string[]> => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#find .qz-link')].filter((l) => !getComputedStyle(l).textDecorationLine.includes('underline')).map((l) => l.className));

test('AC1 and AC7 no boxes: no fill, border or shadow on any element of the section or its ::before and ::after, hidden ones included, but the swatches (on the poster tier a Pearl hairline on the dark shades, none on the pale), the email field\'s underline and an answer picture\'s strips (the photograph, nothing else); every line in section 2\'s label type, IBM Plex Mono 500, upper case, no letter-spacing, Pearl Whisper, at the type scale\'s clamp() sizes for the screen (18.72, 36 and 72 px at 1280 x 720), the error, status, done and Not-you lines and the consent tick included; every text control underlined', async ({ page, baseURL }) => {
  let status = 500;
  await page.route('**/api/quiz-lead', (route) => route.fulfill({ status, contentType: 'application/json', body: '{}' }));
  // the clamp() tokens against the sizes measured on 2026-10-20: the answers and the questions 20.8 and 40 px at 1280 x 800,
  // 17.08 and 32.85 at 1366 x 657, 15 and 24.97 on a 390 x 844 phone
  const r2 = (s: Sizes) => [s.label, s.step, s.name].map((v) => Math.round(v * 100) / 100);
  expect([r2(typeScale(1280, 800)), r2(typeScale(1366, 657)), r2(typeScale(390, 844)), r2(typeScale(1280, 720))]).toEqual([[20.8, 40, 74.88], [17.08, 32.85, 65.7], [15, 24.97, 36], [18.72, 36, 72]]);
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  const { width, height } = page.viewportSize()!;
  expect([width, height], 'the default screen').toEqual([1280, 720]);
  const sizes = typeScale(width, height);
  const check = async (at: string) => {
    expect(await boxed(page), `${at}: no fill or border`).toEqual([]);
    expect(await shadowed(page), `${at}: no shadow`).toEqual([]);
    expect(await offType(page, sizes), `${at}: the label type`).toEqual([]);
    expect(await plainLinks(page), `${at}: the controls underlined`).toEqual([]);
  };
  await check('the intro');
  await begin(page);
  await settled(page);
  // an answer's picture on screen: its strips carry the photograph and nothing else in its frame has a fill
  await picsLoaded(page, 0);
  const first = QUIZ_QUESTIONS[0].answers[0].persona;
  await page.locator(`.qz-card.is-top .qz-opt[data-persona="${first}"]`).hover();
  await expect.poll(async () => (await picNow(page, 0))[first], { message: 'the picture settled' }).toBe('settled');
  await check('card 1');
  for (const h of await page.locator('.qz-card.is-top .qz-opt').evaluateAll((os) => os.map((o) => o.getBoundingClientRect().height))) expect(h, 'each answer is 44 px to tap').toBeGreaterThanOrEqual(44);
  await answer(page, ['curator']);
  await onTop(page, 1);
  await settled(page);
  await check('card 2, with Back');
  await answer(page, CURATOR, 1);
  await expectResult(page, drawn(CURATOR, 0.01));
  await check('the result and the gift');
  expect(await page.locator('#qzEmail').evaluate((e) => { const cs = getComputedStyle(e); return { bg: cs.backgroundColor, image: cs.backgroundImage, border: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join(' '), shadow: cs.boxShadow }; }), 'the email field is its underline only').toEqual({ bg: CLEAR, image: 'none', border: '0px 0px 1px 0px', shadow: 'none' });
  await expect(page.locator('#qzEmail')).toHaveCSS('border-bottom-color', PEARL);
  // the lines that are not decoded, with words in them: both field errors (an empty submit), the status line (500), the
  // done line and Not you (200)
  await page.locator('#qzSend').click();
  await expect(said(page.locator('#qzErrEmail'))).toHaveText(Q.errEmail);
  await expect(said(page.locator('#qzErrConsent'))).toHaveText(Q.errConsent);
  await check('the field errors');
  await page.locator('#qzEmail').fill(EMAIL); await tick(page); await page.locator('#qzSend').click();
  await expect(said(page.locator('#qzMsg'))).toHaveText(Q.errSend);
  await check('the status line');
  status = 200; await page.locator('#qzSend').click();
  await expect(said(page.locator('.qz-done-text'))).toHaveText(Q.done(EMAIL));
  await expect(page.locator('.qz-notyou')).toBeVisible();
  await check('the done line and Not you');
});

/** every swatch of #find, hidden ones too: its shade, its two hairline attributes and its border as computed, with
 *  whether the page is on the fog (html.hero3d) at that moment */
const swatches = (page: Page) => page.evaluate(() => ({
  fog: document.documentElement.classList.contains('hero3d'),
  list: [...document.querySelectorAll<HTMLElement>('#find .qz-big, #find .qz-mini-sw')].map((e) => {
    const cs = getComputedStyle(e);
    return { what: `${e.classList[0]} ${e.dataset.shade}`, shade: e.dataset.shade ?? '', ring: e.hasAttribute('data-ring'), night: e.hasAttribute('data-ring-night'), border: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join(' '), style: cs.borderTopStyle, color: cs.borderTopColor };
  }),
}));

test('AC7 the swatches\' hairline follows the ground: on the poster tier (the quiz on --night) the ten dark shades under 3:1 against it carry data-ring-night and a 1 px Pearl Whisper border and the pale data-ring shades none; the drawn shade\'s large swatch takes its own (Wine for The Main Character, Thyme for The Strategist, whose server default is Navy); on the 3D tier (the fog) the 1 px Urban Slate ring is back and no Pearl border is drawn', async ({ page, baseURL }) => {
  expect(NIGHT.map((id) => byId.get(id)!.name), 'Sam\'s ten dark shades').toEqual(['Chestnut', 'Sapphire', 'Prussian', 'Navy', 'Midnight', 'Pine', 'Claret', 'Burgundy', 'Wine', 'Fig']);
  const pearl = { border: '1px 1px 1px 1px', style: 'solid', color: PEARL }, slate = { border: '1px 1px 1px 1px', style: 'solid', color: URBAN_SLATE }, none = { border: '0px 0px 0px 0px' };
  const each = (list: Awaited<ReturnType<typeof swatches>>['list'], want: (s: { ring: boolean; night: boolean }) => Record<string, string>) => {
    for (const s of list) {
      const hex = byId.get(s.shade)!.hex;
      expect([s.ring, s.night], `${s.what}: data-ring and data-ring-night as config/quiz.ts gives them`).toEqual([needsRing(hex), needsRingNight(hex)]);
      expect(s, s.what).toMatchObject(want(s));
    }
  };
  await pin(page, 0.5);
  await openQuiz(page, baseURL);
  const night = await swatches(page);
  expect(night.fog, 'the poster tier').toBe(false);
  expect([...new Set(night.list.filter((s) => s.night).map((s) => s.shade))].sort(), 'the ten dark shades carry data-ring-night').toEqual(NIGHT);
  expect(night.list.filter((s) => s.ring).length, 'pale shades with data-ring among them').toBeGreaterThan(0);
  each(night.list, (s) => (s.night ? pearl : none));
  // the drawn shade's large swatch: Wine (dark) on Ruby's article, toggled on
  const MAIN = Array<PersonaId>(10).fill('main'), STRATEGIST = Array<PersonaId>(10).fill('strategist');
  expect([drawn(MAIN, 0.5).name, drawn(MAIN, 0.5).night, byId.get(QUIZ_PERSONAS.find((p) => p.id === 'main')!.shades[0])!.name], 'Wine is drawn where Ruby stood').toEqual(['Wine', true, 'Ruby']);
  expect([drawn(STRATEGIST, 0.5).name, drawn(STRATEGIST, 0.5).night, byId.get(QUIZ_PERSONAS.find((p) => p.id === 'strategist')!.shades[0])!.name], 'Thyme is drawn where Navy stood').toEqual(['Thyme', false, 'Navy']);
  const big = page.locator('.qz-result:not([hidden]) .qz-big');
  const bigLine = () => big.evaluate((e) => { const cs = getComputedStyle(e); return { border: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join(' '), style: cs.borderTopStyle, color: cs.borderTopColor }; });
  await begin(page);
  await answer(page, MAIN);
  await expectResult(page, drawn(MAIN, 0.5));
  await expect(big).toHaveAttribute('data-ring-night', '');
  expect(await bigLine(), 'Wine large, with the Pearl hairline').toMatchObject(pearl);
  // and toggled off: Thyme on Navy's article
  await page.locator('.qz-result:not([hidden]) .qz-retry').click();
  await answer(page, STRATEGIST);
  await expectResult(page, drawn(STRATEGIST, 0.5));
  await expect(big).not.toHaveAttribute('data-ring-night');
  expect(await bigLine(), 'Thyme large, no hairline').toMatchObject(none);
  // the 3D tier: on the fog the pale shades take the Urban Slate hairline and the dark ones none
  await page.goto(new URL('/?tier=hero3d', baseURL).href);
  const fog = await swatches(page);
  expect(fog.fog, 'the 3D tier').toBe(true);
  expect(fog.list.length).toBe(night.list.length);
  each(fog.list, (s) => (s.ring ? slate : none));
});

test('AC7 the underlines are written as longhands and computed from them: every quiz rule that draws one sets text-decoration-line and text-decoration-thickness in the page\'s style sheets, never the text-decoration shorthand (Safari before 26.2 drops a shorthand with a thickness; Chromium computes the same from either); every text control (Begin, Back, See it on the case, Try again, Send my gift, Not you, hidden ones too) text-decoration-line underline at 1 px; the answer taken underline at 2 px from the press, the other answers none; on hover an answer is underlined at 1 px and a control thickens to 2', async ({ page, baseURL }) => {
  await page.route('**/api/quiz-lead', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  // how the CSS is written, as the page's style sheets hold it after the build's minifier: Chromium computes the same line
  // and thickness from the shorthand, so only the rules themselves show it. Each quiz rule with an underline in it sets the
  // longhands, and none sets text-decoration itself (a rule written with the shorthand serialises it, and its value reads back)
  const written = await page.evaluate(() => {
    const rules: { sel: string; css: string; shorthand: string; line: string; thickness: string }[] = [];
    let unread = 0;
    const walk = (list: CSSRuleList) => {
      for (const r of [...list]) {
        if (r instanceof CSSStyleRule && /\.qz-(link|opt)\b/.test(r.selectorText) && /text-decoration/.test(r.style.cssText)) {
          rules.push({ sel: r.selectorText, css: r.style.cssText, shorthand: r.style.getPropertyValue('text-decoration'), line: r.style.getPropertyValue('text-decoration-line'), thickness: r.style.getPropertyValue('text-decoration-thickness') });
        }
        if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules);   // inside @media (hover: hover) and @supports, and nested rules
      }
    };
    for (const sheet of [...document.styleSheets]) { try { walk(sheet.cssRules); } catch { unread++; } }
    return { rules, unread };
  });
  expect(written.unread, 'every style sheet of the page read').toBe(0);
  const role = (sel: string) => (/^\.qz-link$/.test(sel) ? 'link' : /^\.qz-link:hover\b/.test(sel) ? 'link on hover' : /^\.qz-opt:hover$/.test(sel) ? 'answer on hover' : /^\.qz-opt\[aria-pressed="?true"?\]$/.test(sel) ? 'answer taken' : `other: ${sel}`);
  expect(written.rules.map((r) => `${role(r.sel)}: line ${r.line || '(unset)'}, thickness ${r.thickness || '(unset)'}, shorthand ${r.shorthand || '(unset)'}`).sort(), 'the four underline rules, in longhands').toEqual([
    'answer on hover: line underline, thickness 1px, shorthand (unset)',
    'answer taken: line underline, thickness 2px, shorthand (unset)',
    'link on hover: line (unset), thickness 2px, shorthand (unset)',
    'link: line underline, thickness 1px, shorthand (unset)',
  ]);
  expect(written.rules.filter((r) => /(^|;)\s*text-decoration\s*:/.test(r.css)).map((r) => `${r.sel} { ${r.css} }`), 'no rule written with the shorthand').toEqual([]);
  const lineOf = (sel: string) => page.locator(sel).evaluateAll((els) => els.map((e) => { const cs = getComputedStyle(e); return `${cs.textDecorationLine} ${cs.textDecorationThickness}`; }));
  await page.mouse.move(0, 0);
  expect(await lineOf('#qzBegin'), 'Begin').toEqual(['underline 1px']);
  await begin(page);
  await page.mouse.move(0, 0);
  await settled(page);
  expect((await lineOf('.qz-card.is-top .qz-opt')).map((l) => l.split(' ')[0]), 'no answer underlined at rest').toEqual(Array(7).fill('none'));
  // the press: the answer taken is underlined at 2 px in the same task, the others not at all
  const taken = await page.evaluate(() => {
    const c = document.querySelector('.qz-card.is-top')!, o = c.querySelector<HTMLElement>('.qz-opt[data-persona="curator"]')!;
    o.click();
    return [...c.querySelectorAll<HTMLElement>('.qz-opt')].map((x) => { const cs = getComputedStyle(x); return `${x.dataset.persona} ${cs.textDecorationLine}${cs.textDecorationLine === 'none' ? '' : ` ${cs.textDecorationThickness}`}`; });
  });
  expect(taken).toEqual(QUIZ_QUESTIONS[0].answers.map((a) => `${a.persona} ${a.persona === 'curator' ? 'underline 2px' : 'none'}`));
  await onTop(page, 1);
  await settled(page);
  expect(await lineOf('.qz-card.is-top .qz-back'), 'Back').toEqual(['underline 1px']);
  // hover (a pointer that hovers): an answer underlined at 1 px, a control thickened to 2
  await page.locator('.qz-card.is-top .qz-opt').first().hover();
  expect(await lineOf('.qz-card.is-top .qz-opt:hover'), 'an answer under the pointer').toEqual(['underline 1px']);
  await page.locator('.qz-card.is-top .qz-back').hover();
  expect(await lineOf('.qz-card.is-top .qz-back'), 'Back under the pointer').toEqual(['underline 2px']);
  await page.mouse.move(0, 0);
  await answer(page, CURATOR, 1);
  await expectResult(page, drawn(CURATOR, 0.01));
  await page.mouse.move(0, 0);
  expect(await lineOf('.qz-result:not([hidden]) .qz-link'), 'See it on the case, Try again').toEqual(['underline 1px', 'underline 1px']);
  expect(await lineOf('#qzSend'), 'Send my gift').toEqual(['underline 1px']);
  await page.locator('#qzEmail').fill(EMAIL); await tick(page); await page.locator('#qzSend').click();
  await expect(said(page.locator('.qz-done-text'))).toHaveText(Q.done(EMAIL));
  await page.mouse.move(0, 0);
  expect(await lineOf('.qz-notyou'), 'Not you').toEqual(['underline 1px']);
  // every control of the section, hidden ones included: Begin, nine Backs, two links on each of the seven results, Send, Not
  // you; at 1 px unless it still matches :hover (Chromium keeps :hover on Send, hidden under the pointer by the done state)
  const all = await page.locator('#find .qz-link').evaluateAll((els) => els.map((e) => { const cs = getComputedStyle(e); return { what: e.id || e.className, hover: e.matches(':hover'), line: `${cs.textDecorationLine} ${cs.textDecorationThickness}` }; }));
  expect(all.length).toBe(1 + 9 + 7 * 2 + 1 + 1);
  expect(all.filter((l) => l.line !== (l.hover ? 'underline 2px' : 'underline 1px')), 'each underlined at 1 px, 2 under the pointer').toEqual([]);
  expect(all.filter((l) => !l.hover).length, 'at most one under the pointer').toBeGreaterThanOrEqual(all.length - 1);
});

test('AC10 the fonts: one family in two files split by unicode-range, each fetched once and loaded by the time card 1 has settled; the quiz\'s own glyphs for "’,.?" are drawn by the Plex web font (the browser\'s platform fonts for them), and every character the quiz draws outside the capitals file is in the rest file (each measures at the mono\'s 0.6 em with a serif fallback behind the family, so a missing glyph would fall back and show)', async ({ page, baseURL }) => {
  const rest: string[] = [], caps: string[] = [];
  page.on('request', (r) => { const p = new URL(r.url()).pathname; if (p === REST_FONT) rest.push(r.url()); if (p === '/fonts/ibm-plex-mono-500-caps.woff2') caps.push(r.url()); });
  await openQuiz(page, baseURL);
  // the intro's own glyph spans for ’ , . ? (and S, a capital): the platform font Chrome drew each with
  const probe = ['’', ',', '.', '?', 'S'];
  const marked = await page.evaluate((chars) => chars.map((ch, n) => { const g = [...document.querySelectorAll<HTMLElement>('#qzIntro .dc > span')].find((s) => s.textContent === ch && s.getClientRects().length > 0); if (g) g.dataset.qzProbe = String(n); return !!g; }), probe);
  expect(marked, 'each on screen in the intro').toEqual(probe.map(() => true));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const used: Record<string, string[]> = {};
  for (const [n, ch] of probe.entries()) {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-qz-probe="${n}"]` });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    used[ch] = fonts.map((f) => `${f.familyName}${f.isCustomFont ? ' (web font)' : ''}`);
  }
  await page.evaluate(() => { for (const g of document.querySelectorAll<HTMLElement>('[data-qz-probe]')) delete g.dataset.qzProbe; });
  expect(used, 'drawn by IBM Plex Mono, the web font, alone').toEqual(Object.fromEntries(probe.map((ch) => [ch, [expect.stringMatching(/^IBM Plex Mono\b.* \(web font\)$/)]])));
  await begin(page);
  await settled(page);
  expect(rest, 'the rest file, once').toHaveLength(1);
  expect(caps, 'the capitals and digits, once').toHaveLength(1);
  const faces = await page.evaluate(() => [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'IBM Plex Mono').map((f) => `${f.weight}|${f.unicodeRange}|${f.status}`).sort());
  expect(faces, 'one family in two files split by unicode-range, both loaded').toEqual(['500|U+20, U+30-39, U+41-5A|loaded', '500|U+21-2F, U+3A-40, U+5B-7E, U+A0, U+2018-201E, U+2026|loaded']);
  // every character the quiz draws: its copy upper-cased as drawn (the no-JS line, the counts, the family lines, the
  // done line included) and the email as typed (the field keeps its case), less the capitals file's space, digits and A-Z
  const copy = [...(Object.values(Q) as unknown[]).filter((v): v is string => typeof v === 'string'), ...QUIZ_QUESTIONS.map((_c, i) => Q.count(i + 1)), Q.finish('gloss'), Q.finish('matte'), Q.done(EMAIL),
    ...QUIZ_QUESTIONS.flatMap((c) => [c.q, ...c.answers.map((a) => a.text)]),
    ...QUIZ_PERSONAS.flatMap((p) => [p.name, p.profile, p.palette, ...p.shades.map((id) => { const s = byId.get(id)!; return `${s.name}. ${Q.fam(familyName(s.family), s.index)}`; })])];
  const chars = [...new Set([...copy.join('').toUpperCase(), ...EMAIL])].filter((c) => !/[ 0-9A-Z]/.test(c)).sort();
  expect(chars, 'the curly apostrophe, the comma, the full stop, the question mark and Sam\'s no-break space among them').toEqual(expect.arrayContaining(['’', ',', '.', '?', '\u00a0']));
  const em = await page.evaluate(async (chars) => {
    const family = getComputedStyle(document.getElementById('find')!).fontFamily.split(',')[0].trim();   // the quiz's own face
    await document.fonts.load(`500 100px ${family}`, chars.join(''));
    const s = document.createElement('span');
    s.style.font = `500 100px ${family}, serif`; s.style.position = 'absolute'; s.style.whiteSpace = 'pre'; s.style.visibility = 'hidden';
    document.body.append(s);
    const out = Object.fromEntries([...chars, 'A'].map((c) => { s.textContent = c.repeat(10); return [c, Math.round(s.getBoundingClientRect().width) / 1000]; }));
    s.remove();
    return out;
  }, chars);
  expect(em, 'each drawn at the mono\'s 0.6 em, a capital as well').toEqual(Object.fromEntries([...chars, 'A'].map((c) => [c, 0.6])));
});

test('AC7 the email field shows focus as its underline at 3 px with no outline, over an invalid field\'s 2 px; the consent row shows keyboard focus as the Ember Luxe outline with the Urban Slate ring inside it (its box is 1 px at opacity 0), and nothing on a click; it reads [ ] then [X]', async ({ page, baseURL }) => {
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, CURATOR);
  await expectResult(page, drawn(CURATOR, 0.01));
  const email = page.locator('#qzEmail');
  const line = () => email.evaluate((e) => { const cs = getComputedStyle(e); return { outline: cs.outlineStyle, bottom: cs.borderBottomWidth, others: [cs.borderTopWidth, cs.borderRightWidth, cs.borderLeftWidth].join(' '), color: cs.borderBottomColor, bg: cs.backgroundColor }; });
  expect(await line(), 'at rest, a 1 px Pearl line').toEqual({ outline: 'none', bottom: '1px', others: '0px 0px 0px', color: PEARL, bg: CLEAR });
  await email.click();
  await expect(email).toBeFocused();
  expect(await line(), 'focused by a click').toEqual({ outline: 'none', bottom: '3px', others: '0px 0px 0px', color: PEARL, bg: CLEAR });
  await email.blur();
  expect((await line()).bottom).toBe('1px');
  await page.locator('#qzConsent').focus(); await page.keyboard.press('Shift+Tab');
  await expect(email).toBeFocused();
  expect(await line(), 'focused by the keyboard').toEqual({ outline: 'none', bottom: '3px', others: '0px 0px 0px', color: PEARL, bg: CLEAR });
  await expect(email).toHaveCSS('text-transform', 'none');   // the address keeps the case it is typed in
  // an invalid field is drawn at 2 px, so focus on it still shows, at 3
  await email.fill('nope'); await email.blur();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  expect(await line(), 'invalid').toEqual({ outline: 'none', bottom: '2px', others: '0px 0px 0px', color: PEARL, bg: CLEAR });
  await email.focus();
  expect(await line(), 'invalid and focused').toEqual({ outline: 'none', bottom: '3px', others: '0px 0px 0px', color: PEARL, bg: CLEAR });
  // the consent box: the native input 1 px at opacity 0 inside its row, the row's tick text after it
  const box = page.locator('#qzConsent');
  expect(await box.evaluate((b) => { const cs = getComputedStyle(b), r = b.getBoundingClientRect(); return { w: r.width, h: r.height, opacity: cs.opacity, in: !!b.closest('label.qz-check') }; })).toEqual({ w: 1, h: 1, opacity: '0', in: true });
  await expect(box).toHaveAccessibleName(Q.consent);
  const mark = () => page.locator('.qz-check .qz-tick').evaluate((t) => getComputedStyle(t, '::before').content);
  expect(await mark()).toBe('"[ ]"');
  // so the row carries keyboard focus (DESIGN.md 4): the outline, and the ring as its ::before
  const ring = () => page.locator('.qz-check').evaluate((c) => {
    const cs = getComputedStyle(c), b = getComputedStyle(c, '::before');
    return { outline: cs.outlineStyle === 'none' ? 'none' : `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} offset ${cs.outlineOffset}`, ring: b.content === 'none' || b.content === 'normal' ? 'none' : `${b.borderTopStyle} ${b.borderTopWidth} ${b.borderTopColor} inset ${b.top}` };
  });
  expect(await ring(), 'the row while the email has focus').toEqual({ outline: 'none', ring: 'none' });
  await page.keyboard.press('Tab');
  await expect(box).toBeFocused();
  expect(await ring(), 'the consent focused by the keyboard').toEqual({ outline: `solid 2px ${EMBER} offset 2px`, ring: `solid 2px ${URBAN_SLATE} inset -2px` });
  expect(await mark(), 'focus alone ticks nothing').toBe('"[ ]"');
  await email.click();
  await tick(page);
  expect(await ring(), 'ticked by a click: no ring').toEqual({ outline: 'none', ring: 'none' });
  expect(await mark()).toBe('"[X]"');
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
  await settled(page);
  await expect(page.getByRole('textbox', { name: Q.email, exact: true })).toHaveId('qzEmail');
  await expect(send).toHaveAccessibleName(Q.send);
  // a value is validated on blur, never per keystroke, and a valid one clears the line again
  await email.fill('nope'); await expect(errEmail).toHaveText(''); await email.blur();
  await expect(said(errEmail)).toHaveText(Q.errEmail);
  await email.fill(EMAIL); await email.blur();
  await expect(errEmail).toHaveText('');
  await expect(email).toHaveAttribute('aria-invalid', 'false');
  // so both errors after the empty submit come from the submit (an empty field is not validated on blur)
  await email.fill(''); await send.click();
  await expect(said(errEmail)).toHaveText(Q.errEmail);
  await expect(said(page.locator('#qzErrConsent'))).toHaveText(Q.errConsent);
  expect(await copies(errEmail), 'the error drawn in capitals at once, through the decoder').toEqual({ sr: Q.errEmail, row: Q.errEmail.toUpperCase(), faded: 0 });
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(consent).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toBeFocused();
  await expect(email).toHaveCSS('border-bottom-width', '3px');   // invalid and focused: focus at 3 px over the error's 2
  await email.blur();
  await expect(email).toHaveCSS('border-bottom-width', '2px');   // invalid: the line at 2 px
  expect(posts).toEqual([]);
  // 500: the line under the button, the values kept, the button back to its label (aria-disabled, never disabled)
  await email.fill(EMAIL); await tick(page); await send.click();
  await expect(said(page.locator('#qzMsg'))).toHaveText(Q.errSend);
  await expect(email).toHaveValue(EMAIL);
  await expect(consent).toBeChecked();
  await expect(send).toHaveAccessibleName(Q.send);
  expect(await copies(send)).toEqual({ sr: Q.send, row: Q.send.toUpperCase(), faded: 0 });
  await expect(send).toHaveAttribute('aria-disabled', 'false');
  await expect(send).toBeEnabled();
  expect(JSON.parse(posts[0])).toEqual({ email: EMAIL, shadeId: r.shade, familyId: r.family, finish: r.p.finish, persona: 'rebel', answers: TIE.join(','), source: 'quiz' });
  // 200: the done block with the address and focus; "Not you?" reopens an empty form on the email
  status = 200; await send.click();
  await expect(said(done)).toHaveText(Q.done(EMAIL));
  await expect(done).toBeFocused();
  await expect(page.locator('.qz-fields')).toBeHidden();
  await expect(page.getByRole('button', { name: Q.notYou, exact: true })).toBeVisible();
  await page.locator('.qz-notyou').click();
  await expect(page.locator('.qz-fields')).toBeVisible();
  await expect(page.locator('#qzDone')).toBeHidden();
  await expect(email).toHaveValue('');
  await expect(consent).not.toBeChecked();
  await expect(email).toBeFocused();
  await expect(errEmail).toHaveText('');
  // 409: the duplicate line in the done block
  status = 409; await email.fill('again@example.com'); await tick(page); await send.click();
  await expect(said(done)).toHaveText(Q.dup);
  // 422: the form again with the email error and the value kept, the done block hidden
  status = 422; await page.locator('.qz-notyou').click(); await email.fill('typo@example.com'); await tick(page); await send.click();
  await expect(said(errEmail)).toHaveText(Q.errEmail);
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toBeFocused();   // moved from Send to the field the error is under
  await expect(email).toHaveValue('typo@example.com');
  await expect(page.locator('#qzDone')).toBeHidden();
  await expect(send).toHaveAccessibleName(Q.send);
  expect(posts).toHaveLength(4);
  expect((await events(page)).filter(([n]) => n.startsWith('lead_'))).toEqual([['lead_submit', {}], ['lead_error', { kind: 'network' }], ['lead_submit', {}], ['lead_success', {}], ['lead_submit', {}], ['lead_error', { kind: 'duplicate' }], ['lead_submit', {}], ['lead_error', { kind: 'invalid' }]]);
});

test('AC9 reduced motion: no transform anywhere and no animation but opacity; Begin, a commit and the result are 0.2 s fades (each line\'s glyphs one opacity, staggered as the decode is) in which no glyph ever shows a character other than its final one; the answer taken goes with no hold; the swatches fade in over 200 ms; the quiz still works', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await pin(page, 0.01);
  await logAnimate(page);
  await openQuiz(page, baseURL);
  await quiet(page);
  const r = drawn(CURATOR, 0.01), lines = resultLines(r);
  const opening = watch(page, '.qz-card[data-i="0"].is-top');
  await page.locator('#qzBegin').click();
  const a = await opening;
  await onTop(page, 0);
  await settled(page);
  const commit = watch(page, '.qz-card[data-i="1"].is-top');
  await page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]').click();
  const b = await commit;
  await onTop(page, 1);
  await answer(page, CURATOR.slice(0, 9), 1);
  await onTop(page, 9);
  await settled(page);
  const finish = watch(page, '#find[data-state="result"]');
  await page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]').click();
  const c = await finish;
  await expectResult(page, r);
  for (const [name, w] of [['Begin', a], ['the commit', b], ['the result', c]] as const) {
    expect(w.timedOut, name).toBe(false);
    expect(w.rolledWrites, `${name}: no glyph is ever written with another character`).toBe(0);
    for (const f of w.frames) {
      expect(f.moved, `${name}: nothing moved by a transform`).toEqual([]);
      for (const an of f.anims) expect(an.split('|')[1], `${name}: ${an}`).toBe('opacity');
    }
  }
  // each a 0.2 s fade on the decoder's clock (a 2 s one fails: a line still part-way after 0.2 s), staggered as the
  // decode is, with no roll; the answer taken goes the moment the rest has gone
  expect(a.phases.length, 'Begin: the intro out, card 1 in').toBe(2);
  expectMotion('Begin: the intro fades out', a, 0, { dir: 'out', reduced: true, keys: keys('intro', 3) });
  expectMotion('Begin: card 1 fades in', a, 1, { dir: 'in', reduced: true, keys: keys('card0', 9) });
  const ans = answerAt(0, 'curator');
  expect(b.phases.length, 'the commit: the rest out, the answer out, card 2 in').toBe(3);
  expectMotion('the commit: the rest of card 1 fades out', b, 0, { dir: 'out', reduced: true, keys: keys('card0', 9).filter((k) => k !== `card0:${ans}`) });
  expectMotion('the commit: then the answer taken', b, 1, { dir: 'out', reduced: true, keys: [`card0:${ans}`] });
  expect(b.phases[1].on - b.phases[0].off, 'no 120 ms hold under reduced motion').toBeLessThan(20);
  expectMotion('the commit: card 2 fades in', b, 2, { dir: 'in', reduced: true, keys: keys('card1', 10) });
  expect(c.phases.length, 'card 10 out (the rest, then the answer), the result in').toBe(3);
  expect(c.phases[1].on - c.phases[0].off, 'no hold on the last card either').toBeLessThan(20);
  expectMotion('the result and the gift fade in', c, 2, { dir: 'in', reduced: true, keys: [...keys('result', lines), ...keys('gift', GIFT_LINES, lines)] });
  expect(await animateLog(page)).toEqual(['qz-big|opacity|200', ...r.others.map(() => 'qz-mini-sw|opacity|200')]);
  await expect(page.locator('.qz-card[data-i="0"]')).toBeHidden();
  await ctx.close();
});

test('AC4 at 390 x 844 nothing scrolls sideways through the intro, a card (and a commit: the wipe out and the next card\'s decode in) and the result', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const fits = async (at: string) => expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= innerWidth), at).toBe(true);
  await pin(page, 0.5);
  await openQuiz(page, baseURL);
  await fits('intro');
  await begin(page);
  await fits('card 1');
  // every frame until card 2 has decoded in, so the check spans the whole commit on any machine; 10 s at most, as the
  // old sampler allowed (the commit and card 2's decode take 1.67 s on the decoder's clock)
  await ready(page, 0);
  const flow = watch(page, '.qz-card[data-i="1"].is-top', 10_000);
  await page.locator(`.qz-card.is-top .qz-opt[data-persona="${TIE[0]}"]`).click();
  const { frames, timedOut } = await flow;
  expect(timedOut).toBe(false);
  expect(frames.filter((f) => f.wide), 'during the commit, to card 2 settled').toEqual([]);
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
  await page.locator('#qzEmail').fill(EMAIL); await tick(page);
  offline = true; await context.setOffline(true);
  await page.locator('#qzSend').click();
  await expect(said(done)).toHaveText(Q.offline);
  await expect(page.locator('.qz-notyou')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('skreed-quiz-lead') ?? 'null'))).toEqual({ email: EMAIL, shadeId: r.shade, familyId: r.family, finish: r.p.finish, persona: 'rebel', answers: TIE.join(','), source: 'quiz' });
  expect(posts).toEqual([]);
  offline = false; await context.setOffline(false);
  await expect(said(done)).toHaveText(Q.done(EMAIL));
  expect(posts).toHaveLength(1);
  expect(JSON.parse(posts[0])).toMatchObject({ email: EMAIL, shadeId: r.shade, persona: 'rebel', answers: TIE.join(',') });
  expect(await page.evaluate(() => sessionStorage.getItem('skreed-quiz-lead'))).toBeNull();
  expect((await events(page)).filter(([n]) => n.startsWith('lead_'))).toEqual([['lead_submit', {}], ['lead_success', {}]]);
});

test('AC8 a slow route: "Still trying..." at 8 s, the error line and a timeout event at 20 s, the values kept; each label is set through the decoder at once, with no animation', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await page.route('**/api/quiz-lead', async (route) => { await new Promise((r) => setTimeout(r, 25_000)); await route.fulfill({ status: 200, body: '{}' }).catch(() => undefined); });
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, CURATOR);
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  await settled(page);
  const send = page.locator('#qzSend');
  await page.locator('#qzEmail').fill(EMAIL); await tick(page);
  await send.click();
  await expect(send).toHaveAccessibleName(Q.sending);
  expect(await copies(send), 'Sending..., drawn at once').toEqual({ sr: Q.sending, row: Q.sending.toUpperCase(), faded: 0 });
  await expect(page.locator('#find')).not.toHaveAttribute('data-decoding');
  await expect(send).toHaveAttribute('aria-disabled', 'true');
  await expect(send).toHaveAccessibleName(Q.trying, { timeout: 10_000 });
  expect(await copies(send), 'Still trying..., drawn at once').toEqual({ sr: Q.trying, row: Q.trying.toUpperCase(), faded: 0 });
  await expect(said(page.locator('#qzMsg'))).toHaveText(Q.errSend, { timeout: 15_000 });
  await expect(send).toHaveAccessibleName(Q.send);
  expect(await copies(send)).toEqual({ sr: Q.send, row: Q.send.toUpperCase(), faded: 0 });
  await expect(send).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('#qzEmail')).toHaveValue(EMAIL);
  expect((await events(page)).filter(([n]) => n.startsWith('lead_'))).toEqual([['lead_submit', {}], ['lead_error', { kind: 'timeout' }]]);
});

/** the gift's decoded lines as the watch keys them, in reading order (deck.ts items(): the consent words are a bare span) */
const GIFT_KEYS = ['.qz-gift-h', '.qz-gift-sub', '.qz-label', 'span', '#qzSend', '.qz-fine'];

test('AC8 Try again while a send is in flight, for a 500, a 200 and a 409 each answered 1.5 s after the send: the request is aborted at the press; the result and the gift wipe out whole, Send under its sending label with them; once the answer would have come no error line, announcement, done state, focus on the done line or lead event appears; and each next result\'s gift decodes in whole, Send hidden at its start like the rest of its lines and back in its own words', async ({ page, baseURL }) => {
  const STATUSES = [500, 200, 409] as const;
  const posts: string[] = [], aborted: string[] = [];
  let landed = (): void => undefined;
  await page.route('**/api/quiz-lead', async (route) => {
    const k = posts.push(route.request().postData() ?? '') - 1;
    await new Promise((r) => setTimeout(r, 1500));
    await route.fulfill({ status: STATUSES[k], contentType: 'application/json', body: '{}' }).catch(() => undefined);   // gone if the page aborted it, which requestfailed records
    landed();
  });
  page.on('requestfailed', (req) => { if (new URL(req.url()).pathname === '/api/quiz-lead') aborted.push(req.failure()?.errorText ?? ''); });
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, CURATOR);
  const r = drawn(CURATOR, 0.01), lines = resultLines(r), gone = [...keys('result', lines), ...keys('gift', GIFT_LINES, lines)];
  await expectResult(page, r);
  const send = page.locator('#qzSend');
  await page.locator('#qzEmail').fill(EMAIL); await tick(page);   // kept through each Try again
  for (const [k, status] of STATUSES.entries()) {
    const at = `the ${status}`;
    const land = new Promise<void>((res) => { landed = res; });
    await send.click();
    await expect(send, `${at}: sending`).toHaveAccessibleName(Q.sending);
    expect(posts, `${at}: posted`).toHaveLength(k + 1);
    // Try again with the send in flight, watched until card 1 has decoded in: everything of the result and the gift wipes
    // out, Send included (its label is left to the wipe, not put back at full opacity when the abandoned send settles)
    const flow = watch(page, '.qz-card[data-i="0"].is-top');
    await page.locator('.qz-result:not([hidden]) .qz-retry').click();
    const w = await flow;
    expect(w.timedOut, at).toBe(false);
    expect(w.phases.length, `${at}: the result and the gift out, card 1 in`).toBe(2);
    expectMotion(`${at}: Try again wipes the result and the gift out, Send with them`, w, 0, { dir: 'out', keys: gone });
    expectMotion(`${at}: then card 1 decodes in`, w, 1, { dir: 'in', keys: keys('card0', 9) });
    expect(aborted, `${at}: the request aborted at the press, before its answer came`).toEqual(STATUSES.slice(0, k + 1).map(() => 'net::ERR_ABORTED'));
    await land;
    await page.waitForTimeout(500);   // a window for anything the answer would set off had it reached the page
    for (const sel of ['#qzErrEmail', '#qzErrConsent', '#qzMsg', '.qz-done-text']) await expect(page.locator(sel), `${at}: ${sel} empty`).toHaveText('');
    await expect(page.locator('#qzDone'), `${at}: no done state`).toHaveAttribute('hidden', '');
    await expect(page.locator('.qz-fields'), `${at}: the fields stay`).not.toHaveAttribute('hidden');
    await expect(page.locator('.qz-card[data-i="0"]'), `${at}: focus stays on question 1, not on the done line`).toBeFocused();
    expect((await heard(page)).filter((t) => [Q.errSend, Q.errEmail, Q.dup, Q.done(EMAIL)].includes(t)), `${at}: nothing of the send announced`).toEqual([]);
    expect((await events(page)).filter(([n]) => n.startsWith('lead_')), `${at}: no lead event but the submits`).toEqual(STATUSES.slice(0, k + 1).map(() => ['lead_submit', {}]));
    await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
    await expect(send, `${at}: Send free again`).toHaveAttribute('aria-disabled', 'false');
    // the next result: its gift's lines all hidden when it comes, Send among them, then decoded in with the rest
    await answer(page, CURATOR.slice(0, 9));
    await onTop(page, 9);
    await settled(page);
    const finish = watch(page, '#find[data-state="result"]');
    await page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]').click();
    const e = await finish;
    expect(e.timedOut, at).toBe(false);
    const first = e.frames.find((f) => !!part(f, 'gift'));
    expect(part(first!, 'gift')!.map((x) => `${x.k}:${x.max}`), `${at}: the gift comes with every line hidden, Send included`).toEqual(GIFT_KEYS.map((x) => `${x}:0`));
    expectMotion(`${at}: the result and the gift decode in, Send with them`, e, 2, { dir: 'in', keys: gone });
    await expectResult(page, r);
    expect(await copies(send), `${at}: Send my gift in its own words again, settled`).toEqual({ sr: Q.send, row: Q.send.toUpperCase(), faded: 0 });
    await expect(send).toHaveAttribute('aria-disabled', 'false');
    await expect(page.locator('.qz-fields')).toBeVisible();
    for (const sel of ['#qzErrEmail', '#qzErrConsent', '#qzMsg']) await expect(page.locator(sel), `${at}: ${sel} empty`).toHaveText('');
  }
  expect(posts, 'nothing re-sent').toHaveLength(STATUSES.length);
});

test('AC8 Try again clears the form\'s lines and frees the form: a 500\'s line under Send and both field errors are gone from the next result\'s gift, aria-invalid false on both fields; a send that is never answered is aborted at the press, so Send on the next result, inside the 20 s the abandoned send would have held it, posts again and is answered', async ({ page, baseURL }) => {
  const posts: string[] = [], aborted: string[] = [];
  let mode: 'fail' | 'hold' | 'ok' = 'fail';
  let release = (): void => undefined; const held = new Promise<void>((r) => { release = r; });
  await page.route('**/api/quiz-lead', async (route) => {
    const m = mode;
    posts.push(route.request().postData() ?? '');
    if (m === 'hold') await held;   // never answered while the test runs
    await route.fulfill({ status: m === 'fail' ? 500 : 200, contentType: 'application/json', body: '{}' }).catch(() => undefined);
  });
  page.on('requestfailed', (req) => { if (new URL(req.url()).pathname === '/api/quiz-lead') aborted.push(req.failure()?.errorText ?? ''); });
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, CURATOR);
  const r = drawn(CURATOR, 0.01);
  await expectResult(page, r);
  const email = page.locator('#qzEmail'), consent = page.locator('#qzConsent'), send = page.locator('#qzSend'), msg = page.locator('#qzMsg'), errEmail = page.locator('#qzErrEmail'), errConsent = page.locator('#qzErrConsent');
  const retry = page.locator('.qz-result:not([hidden]) .qz-retry');
  // the first result: a 500 puts the send error under Send, then a bad address with the box unticked puts up both field
  // errors (the send error stays: a failed validation leaves the status line as it is)
  await email.fill(EMAIL); await tick(page); await send.click();
  await expect(said(msg)).toHaveText(Q.errSend);
  await email.fill('nope'); await page.locator('.qz-check').click(); await expect(consent).not.toBeChecked();
  await send.click();
  await expect(said(errEmail)).toHaveText(Q.errEmail);
  await expect(said(errConsent)).toHaveText(Q.errConsent);
  await expect(said(msg), 'the send error still under Send').toHaveText(Q.errSend);
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(consent).toHaveAttribute('aria-invalid', 'true');
  expect(posts).toHaveLength(1);
  // Try again, and through to the next result: its gift has none of them
  await retry.click();
  await onTop(page, 0);
  await answer(page, CURATOR);
  await expectResult(page, r);
  for (const [name, el] of [['the status line', msg], ['the email error', errEmail], ['the consent error', errConsent]] as const) await expect(el, `${name} cleared`).toHaveText('');
  await expect(email, 'the email no longer invalid').toHaveAttribute('aria-invalid', 'false');
  await expect(consent, 'the consent no longer invalid').toHaveAttribute('aria-invalid', 'false');
  // the second result: a send that is never answered, abandoned by Try again, is aborted at the press
  mode = 'hold';
  await email.fill(EMAIL); await tick(page);
  const sentAt = Date.now();
  await send.click();
  await expect(send).toHaveAccessibleName(Q.sending);
  await expect.poll(() => posts.length).toBe(2);
  await retry.click();
  await expect.poll(() => aborted, { message: 'the held request aborted at the press', timeout: 1000 }).toEqual(['net::ERR_ABORTED']);
  await onTop(page, 0);
  // the third result, inside the 20 s deck.ts's own timeout would otherwise keep Send busy for: Send posts and is answered
  mode = 'ok';
  await answer(page, CURATOR);
  await expectResult(page, r);
  // read at once, not waited for: held by the abandoned send, Send would stay aria-disabled until that 20 s timeout
  expect(await send.getAttribute('aria-disabled'), 'Send free on the next result, not held by the abandoned send').toBe('false');
  await send.click();
  expect(Date.now() - sentAt, 'Send pressed again inside the 20 s').toBeLessThan(20_000);
  await expect.poll(() => posts.length, { message: 'posted again' }).toBe(3);
  await expect(said(page.locator('.qz-done-text'))).toHaveText(Q.done(EMAIL));
  await expect(page.locator('.qz-done-text')).toBeFocused();
  expect(JSON.parse(posts[2])).toMatchObject({ email: EMAIL, shadeId: r.shade, persona: 'curator', answers: CURATOR.join(',') });
  expect((await events(page)).filter(([n]) => n.startsWith('lead_'))).toEqual([['lead_submit', {}], ['lead_error', { kind: 'network' }], ['lead_submit', {}], ['lead_submit', {}], ['lead_success', {}]]);
  release();
});

test('AC8 the form\'s errors reach assistive technology: Enter in the email field with a bad address keeps focus there and announces the error through #qzLive; a 422 after Send moves focus to the email field, which the error describes; a 422 after Enter in the field announces it through #qzLive; with a good address and the box unticked, a submit made from the box keeps focus there and announces the consent error, and Send moves focus to the box, which that error describes, with nothing announced', async ({ page, baseURL }) => {
  const posts: string[] = [];
  await page.route('**/api/quiz-lead', (route) => { posts.push(route.request().postData() ?? ''); return route.fulfill({ status: 422, contentType: 'application/json', body: '{}' }); });
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, CURATOR);
  await expectResult(page, drawn(CURATOR, 0.01));
  const email = page.locator('#qzEmail'), errEmail = page.locator('#qzErrEmail'), send = page.locator('#qzSend');
  await tick(page);   // the consent ticked, so the email is the one error
  // Enter in the field with a bad address: the error under it, focus kept there, and the error said through the live region
  let n = (await heard(page)).length;
  await email.click(); await email.fill('nope'); await email.press('Enter');
  await expect(said(errEmail)).toHaveText(Q.errEmail);
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toBeFocused();
  await expect.poll(async () => (await heard(page)).slice(n), { message: 'announced through #qzLive' }).toEqual([Q.errEmail]);
  await expect(page.locator('#qzLive')).toHaveText(Q.errEmail);
  expect(posts).toEqual([]);
  // a 422 after a press of Send: focus moves from Send to the field, which its error line describes
  await email.fill('typo@example.com'); await send.click();
  await expect.poll(() => posts.length).toBe(1);
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(said(errEmail)).toHaveText(Q.errEmail);
  await expect(email).toHaveAccessibleDescription(Q.errEmail);
  // a 422 after Enter in the field: focus is already there, so the error is said through the live region
  n = (await heard(page)).length;
  await email.fill('typo2@example.com'); await email.press('Enter');
  await expect.poll(() => posts.length).toBe(2);
  await expect.poll(async () => (await heard(page)).slice(n), { message: 'the 422 announced through #qzLive' }).toEqual([Q.errEmail]);
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  // the consent: a good address and the box unticked. A submit made with the box focused (requestSubmit, as Enter would
  // from a field) keeps focus on the box and the consent error is said through the live region; the email is clear
  const consent = page.locator('#qzConsent'), errConsent = page.locator('#qzErrConsent');
  await email.fill(EMAIL);
  await page.locator('.qz-check').click(); await expect(consent).not.toBeChecked();
  await consent.focus();
  n = (await heard(page)).length;
  await page.locator('#qzForm').evaluate((f) => { (f as HTMLFormElement).requestSubmit(); });
  await expect(said(errConsent)).toHaveText(Q.errConsent);
  await expect(consent).toHaveAttribute('aria-invalid', 'true');
  await expect(errEmail).toHaveText('');
  await expect(email).toHaveAttribute('aria-invalid', 'false');
  await expect(consent, 'focus kept on the box').toBeFocused();
  await expect.poll(async () => (await heard(page)).slice(n), { message: 'the consent error announced through #qzLive' }).toEqual([Q.errConsent]);
  // a press of Send: focus moves from Send to the box, which its error line describes, and nothing is announced (the
  // move itself has the box read with its description)
  n = (await heard(page)).length;
  await send.click();
  await expect(consent, 'focus moved to the box').toBeFocused();
  await expect(consent).toHaveAccessibleDescription(Q.errConsent);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));   // announce() writes a frame later
  expect((await heard(page)).slice(n), 'nothing announced when focus moves').toEqual([]);
  expect(posts, 'the unticked box posts nothing').toHaveLength(2);
  expect((await events(page)).filter(([n]) => n.startsWith('lead_'))).toEqual([['lead_submit', {}], ['lead_error', { kind: 'invalid' }], ['lead_submit', {}], ['lead_error', { kind: 'invalid' }]]);
});

test('AC10 without JavaScript the intro reads as the server drew it, each line in two copies (Sam\'s case for assistive technology, capitals drawn), "Swipe to begin" is not shown, and the no-JS line links to /#families, which exists on the page, its link named "ten families"', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(new URL('/?tier=poster', baseURL).href);
  await expect(page.locator('html')).not.toHaveClass(/\bjs\b/);
  await expect(page.locator('#qzIntro .dc')).toHaveCount(0);   // nothing split into glyphs
  // each line in the two copies Quiz.astro writes: Sam's sentence case for assistive technology, and the one drawn, in capitals
  for (const [sel, text] of [['.qz-h', Q.h], ['.qz-sub', Q.sub]] as const) expect(await labelCopies(page.locator(`#qzIntro ${sel}`)), sel).toEqual(twoCopies(text));
  await expect(page.getByRole('heading', { name: Q.h, exact: true })).toHaveClass(/qz-h/);
  await expect(page.locator('#qzBegin')).toBeHidden();
  const line = page.locator('.qz-noscript');
  expect(await labelCopies(line), 'the no-JS line: its words in two copies round the link').toEqual([...twoCopies(Q.noscriptLead), `|null|${Q.noscriptLink}|uppercase`, ...twoCopies(Q.noscriptTail)]);
  await expect(page.getByRole('link', { name: Q.noscriptLink, exact: true })).toHaveAttribute('href', '/#families');
  await expect(line.locator('a')).toHaveAttribute('aria-label', Q.noscriptLink);
  await expect(page.locator('nav#families')).toHaveCount(1);
  await ctx.close();
});

// Sam's words reach assistive technology in his case: the decode's visually hidden copy is what names each control (the
// glyph row is aria-hidden), so the browser's own accessibility tree (Chrome's, through CDP, which applies CSS
// text-transform when it builds names and text from rendered text) must give his sentence case, not the upper case drawn
// on screen. That holds for the lines that are not decoded too (the field errors, the status line, the done line, "Not
// you?" and the live region), which carry the section's text-transform straight to the tree.
test('AC1 assistive technology gets Sam\'s sentence case: the browser\'s accessibility tree reads the intro and Begin, the question, the answers and Back, the result, and the lines that are not decoded (the field errors, the status line, the done line, "Not you?", the live region) as written in config/quiz.ts, not as drawn', async ({ page, baseURL }) => {
  let status = 500;
  await page.route('**/api/quiz-lead', (route) => route.fulfill({ status, contentType: 'application/json', body: '{}' }));
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  const cdp = await page.context().newCDPSession(page);
  /** each wanted text against the tree: found (some node's name or text matches it, ignoring case) and never in another case */
  const cased = async (at: string, want: string[]) => {
    const { nodes } = await cdp.send('Accessibility.getFullAXTree') as { nodes: { name?: { value: string }; ignored?: boolean }[] };
    const names = nodes.filter((n) => !n.ignored && n.name?.value).map((n) => n.name!.value);
    const off = want.map((w) => ({ w, seen: names.filter((n) => n.toLowerCase() === w.toLowerCase()) })).filter((x) => x.seen.length === 0 || x.seen.some((n) => n !== x.w)).map((x) => `${x.w} -> ${x.seen.length ? x.seen.join(' | ') : 'missing'}`);
    expect(off, `${at}: each as Sam wrote it`).toEqual([]);
  };
  await cased('the intro', [Q.h, Q.sub, Q.begin]);
  await begin(page);
  await answer(page, ['main']);
  await onTop(page, 1);
  await settled(page);
  const q = QUIZ_QUESTIONS[1];
  await cased('card 2', [q.q, ...q.answers.map((a) => a.text), Q.back]);
  await answer(page, CURATOR, 1);
  const r = drawn(['main', ...CURATOR.slice(1)], 0.01);
  await expectResult(page, r);
  const heard = `${Q.eyebrow}: ${r.name}. ${r.p.name}.`;
  await expect(page.locator('#qzLive')).toHaveText(heard);
  await cased('the result and the live region', [Q.eyebrow, `${r.name}.`, r.p.name, Q.see, Q.retry, Q.email, Q.consent, Q.send, heard]);
  await page.locator('#qzSend').click();
  await expect(said(page.locator('#qzErrConsent'))).toHaveText(Q.errConsent);
  await cased('the field errors', [Q.errEmail, Q.errConsent]);
  await page.locator('#qzEmail').fill(EMAIL); await tick(page); await page.locator('#qzSend').click();
  await expect(said(page.locator('#qzMsg'))).toHaveText(Q.errSend);
  await expect(page.locator('#qzLive')).toHaveText(Q.errSend);
  await cased('the status line and the live region', [Q.errSend]);
  status = 200; await page.locator('#qzSend').click();
  await expect(said(page.locator('.qz-done-text'))).toHaveText(Q.done(EMAIL));
  await cased('the done line and "Not you?"', [Q.done(EMAIL), Q.notYou]);
});

test('AC1 the decode keeps Sam\'s no-break space: The Spark\'s profile reads "11 p.m." with U+00A0 in both its copies', async ({ page, baseURL }) => {
  const SPARK = Array<PersonaId>(10).fill('spark');
  const profile = QUIZ_PERSONAS.find((p) => p.id === 'spark')!.profile;
  expect(profile, 'config/quiz.ts writes it with U+00A0').toContain('11 p.m.');
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, SPARK);
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  await settled(page);
  const c = await copies(page.locator('.qz-result:not([hidden]) .qz-text'));
  expect({ sr: c.sr?.includes('11 p.m.'), row: c.row?.includes('11 P.M.') }, 'the hidden copy and the glyph row both keep U+00A0').toEqual({ sr: true, row: true });
  expect(c.sr).toBe(profile);
});

for (const [w, h] of [[360, 780], [430, 932], [768, 1024], [1024, 768], [1280, 800], [844, 390]] as const) {
  const scale = typeScale(w, h), px = (v: number) => String(Math.round(v * 100) / 100);
  test(`AC4 at ${w} x ${h}: the intro, a card, the result, the gift and its done line fit the width, the text columns and their words sit inside the gutters, every control is at least 44 px each way (Begin, the answers, Back, the links, Send, the field, the consent row, Not you), and every line is at the type scale's clamp() sizes for the screen, ${px(scale.label)}, ${px(scale.step)} and ${px(scale.name)} px`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.route('**/api/quiz-lead', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    /** the shown text column (and the drawn glyph rows inside it) between the 16 px gutters, no sideways scroll */
    const fits = async (at: string, sel: string) => {
      const m = await page.evaluate((sel) => {
        const cols = [...document.querySelectorAll<HTMLElement>(sel)].filter((c) => c.getClientRects().length > 0 && getComputedStyle(c).visibility !== 'hidden');
        const rects = cols.flatMap((c) => [c.getBoundingClientRect(), ...[...c.querySelectorAll<HTMLElement>('.dc')].filter((d) => d.getClientRects().length > 0).map((d) => d.getBoundingClientRect())]).filter((r) => r.width > 0);
        return { wide: document.scrollingElement!.scrollWidth <= innerWidth, n: cols.length, left: Math.min(...rects.map((r) => r.left)), right: Math.max(...rects.map((r) => r.right)) };
      }, sel);
      expect(m.wide, `${at}: no horizontal scroll`).toBe(true);
      expect(m.n, `${at}: the column is shown`).toBe(1);
      expect(m.left, `${at}: left gutter`).toBeGreaterThanOrEqual(16 - 0.01);
      expect(m.right, `${at}: right gutter`).toBeLessThanOrEqual(w - 16 + 0.01);
    };
    /** every shown control the selector matches (at least one) is 44 px or more each way */
    const tap = async (at: string, sel: string) => {
      const boxes = await page.locator(sel).evaluateAll((es) => es.filter((e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden').map((e) => { const r = e.getBoundingClientRect(); return { what: e.className || e.id, w: r.width, h: r.height }; }));
      expect(boxes.length, `${at}: ${sel} shown`).toBeGreaterThan(0);
      expect(boxes.filter((b) => b.w < 44 || b.h < 44), `${at}: ${sel} at least 44 x 44 px`).toEqual([]);
    };
    const sizes = scale;
    await pin(page, 0.01);
    await openQuiz(page, baseURL);
    await fits('intro', '.qz-intro');
    await tap('intro', '#qzBegin');
    expect(await offType(page, sizes), 'the intro (and every other line, hidden ones included)').toEqual([]);
    await begin(page);
    await settled(page);
    await fits('card 1', '.qz-card:not([hidden])');
    await tap('card 1', '.qz-card.is-top .qz-opt');
    await answer(page, ['curator']);
    await onTop(page, 1);
    await settled(page);
    await fits('card 2', '.qz-card:not([hidden])');
    await tap('card 2', '.qz-card.is-top .qz-opt');
    await tap('card 2', '.qz-card.is-top .qz-back');
    await answer(page, CURATOR, 1);
    await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
    await settled(page);
    await fits('result', '.qz-result:not([hidden])');
    await tap('result', '.qz-result:not([hidden]) .qz-link');
    await page.evaluate(() => document.getElementById('qzGift')!.scrollIntoView({ block: 'end' }));
    await fits('gift', '.qz-gift-in');
    await tap('gift', '#qzSend');
    await tap('gift', '#qzEmail');
    await tap('gift', '.qz-check');
    await page.locator('#qzEmail').fill(EMAIL); await tick(page); await page.locator('#qzSend').click();
    await expect(said(page.locator('.qz-done-text'))).toHaveText(Q.done(EMAIL));
    await page.evaluate(() => document.getElementById('qzGift')!.scrollIntoView({ block: 'end' }));
    await fits('done', '.qz-gift-in');
    await tap('done', '.qz-notyou');
    expect(await offType(page, sizes), 'every line at the end, the done line and Not you included').toEqual([]);
    await ctx.close();
  });
}

test('AC4 at 360 x 780 the done line with a 60-character address breaks inside the gutters: every glyph of it between 16 and 344 px, over three lines or more, with nothing scrolling sideways', async ({ browser, baseURL }) => {
  const ADDRESS = `${'a'.repeat(48)}@example.com`;
  expect(ADDRESS).toHaveLength(60);
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const page = await ctx.newPage();
  await page.route('**/api/quiz-lead', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await pin(page, 0.01);
  await openQuiz(page, baseURL);
  await begin(page);
  await answer(page, CURATOR);
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'result');
  await settled(page);
  await page.locator('#qzEmail').fill(ADDRESS); await tick(page); await page.locator('#qzSend').click();
  const done = page.locator('.qz-done-text');
  await expect(said(done)).toHaveText(Q.done(ADDRESS));
  await page.evaluate(() => document.getElementById('qzGift')!.scrollIntoView({ block: 'end' }));
  const m = await done.evaluate((d) => {
    const glyphs = [...d.querySelectorAll<HTMLElement>(':scope > .dc > span')].map((s) => s.getBoundingClientRect());
    return { n: glyphs.length, left: Math.min(...glyphs.map((r) => r.left)), right: Math.max(...glyphs.map((r) => r.right)), lines: new Set(glyphs.map((r) => Math.round(r.top))).size, glyph: glyphs[0].width, col: d.closest('.qz-gift-in')!.getBoundingClientRect().width, line: d.getBoundingClientRect().right, wide: document.scrollingElement!.scrollWidth > innerWidth };
  });
  expect(m.n, 'one glyph per character').toBe(Q.done(ADDRESS).length);
  expect(ADDRESS.length * m.glyph, 'the address alone is wider than the column, so it has to break').toBeGreaterThan(m.col);
  expect(m.left, 'left gutter').toBeGreaterThanOrEqual(16 - 0.01);
  expect(m.right, 'right gutter').toBeLessThanOrEqual(360 - 16 + 0.01);
  expect(m.line, 'the line itself').toBeLessThanOrEqual(360 - 16 + 0.01);
  expect(m.lines, 'broken over three lines or more').toBeGreaterThanOrEqual(3);
  expect(m.wide, 'no horizontal scroll').toBe(false);
  await ctx.close();
});

// ---- the answer pictures (Sam, 2026-10-20; config/quiz-pictures.ts, picture.ts) ----

/** a picture file as the build names it: /_astro/q<question index>-<personality>-<width>.<hash>.<avif or webp> */
const PIC_URL = /\/_astro\/(q\d+-[a-z]+)-(\d+)\.[\w-]+\.(avif|webp)$/;
/** the sizes attribute of every picture: the second column on a laptop, the width between the gutters on a phone */
const PIC_SIZES = '(min-width: 900px) and (min-height: 600px) min(30vw, 440px), calc(100vw - 32px)';

/** every picture of card i loaded (each <img> complete, with its size), so a show starts at once: picture.ts first awaits
 *  a picture still loading */
const picsLoaded = (page: Page, i: number): Promise<unknown> => page.waitForFunction((i) => {
  const imgs = [...document.querySelectorAll<HTMLImageElement>(`.qz-card[data-i="${i}"] .qz-pic img`)];
  return imgs.length > 0 && imgs.every((m) => m.complete && m.naturalWidth > 0);
}, i, { timeout: 15_000 });

/** card i's pictures as they stand, by personality: 'settled' (on screen, every strip on its own slice at full opacity,
 *  no transform), 'moving' (on screen part-way) or 'off' (never shown, or hidden with every strip at 0) */
const picNow = (page: Page, i: number): Promise<Record<string, string>> => page.evaluate((i) => {
  const frame = document.querySelector<HTMLElement>(`.qz-card[data-i="${i}"] .qz-pics`), out: Record<string, string> = {};
  if (!frame) return out;
  for (const pic of frame.querySelectorAll<HTMLElement>('.qz-pic')) out[pic.dataset.persona ?? ''] = 'off';
  for (const layer of frame.querySelectorAll<HTMLElement>('.qz-shot')) {
    const strips = [...layer.children] as HTMLElement[], W = frame.clientWidth, a = strips.map((s) => (s.style.opacity === '' ? 1 : Number(s.style.opacity)));
    const own = strips.every((s, n) => Math.abs(((W - parseFloat(s.style.backgroundSize)) / 2 - parseFloat(s.style.backgroundPosition)) * strips.length / W - n) < 0.01);
    out[layer.dataset.persona ?? ''] = layer.style.visibility !== 'visible' && a.every((v) => v === 0) ? 'off'
      : a.every((v) => v === 1) && own && layer.style.transform === '' && getComputedStyle(layer).transform === 'none' ? 'settled' : 'moving';
  }
  return out;
}, i);
const allOff = (i: number) => Object.fromEntries(QUIZ_QUESTIONS[i].answers.map((a) => [a.persona, 'off']));

/** one step of a picture as drawn, timed on its own clock (the timestamp of the animation frame its step ran in, as
 *  watch() times the decoder): whose it is (personality and card), its place among the frame's layers (z of n; the later
 *  drawn over the earlier), its visibility, its transform (inline and computed), the frame's box, and for each of its
 *  strips, left to right, the opacity and the slice it shows (j: the strip whose part of the covered picture it draws, from
 *  its background position and size; a strip's own slice is its index) */
interface PicStep { t: number; k: string; card: number; z: number; n: number; vis: string; tf: string; ctf: string; o: number[]; j: (number | null)[]; box: number[] }
/** a pointer (enter, leave, down, cancel), focus or blur event on an answer, on the page's clock, caught before the
 *  deck's own listeners */
interface PicEvent { t: number; ev: string; k: string; card: number }
/** an answer's glyphs after a step of the decoder: the least opacity among them */
interface OptStep { t: number; k: string; card: number; min: number }
interface PicLog { steps: PicStep[]; events: PicEvent[]; opts: OptStep[] }

/** from now until picLog(): every step of every picture (a MutationObserver callback runs straight after the animation
 *  frame callback that wrote it, so no step is missed however few frames the page draws), every pointer, focus and blur
 *  event on an answer, and every step of an answer's glyphs */
const recordPics = (page: Page): Promise<void> => page.evaluate(() => {
  const root = document.getElementById('find')!;
  const log: { steps: unknown[]; events: unknown[]; opts: unknown[] } = { steps: [], events: [], opts: [] };
  const raf0 = window.requestAnimationFrame;
  let clock = 0, inFrame = false;
  window.requestAnimationFrame = (cb) => raf0.call(window, (ts) => { clock = ts; inFrame = true; try { cb(ts); } finally { queueMicrotask(() => { inFrame = false; }); } });
  const cardOf = (e: Element) => Number(e.closest<HTMLElement>('.qz-card')?.dataset.i ?? -1);
  const opacity = (s: HTMLElement) => (s.style.opacity === '' ? 1 : Number(s.style.opacity));
  const step = (layer: HTMLElement, t: number) => {
    const frame = layer.parentElement as HTMLElement, W = frame.clientWidth, strips = [...layer.children] as HTMLElement[], layers = [...frame.querySelectorAll('.qz-shot')], b = frame.getBoundingClientRect();
    return {
      t, k: layer.dataset.persona ?? '', card: cardOf(layer), z: layers.indexOf(layer), n: layers.length, vis: layer.style.visibility, tf: layer.style.transform, ctf: getComputedStyle(layer).transform,
      o: strips.map(opacity),
      j: strips.map((s) => { const j = ((W - parseFloat(s.style.backgroundSize)) / 2 - parseFloat(s.style.backgroundPosition)) * strips.length / W; return Number.isFinite(j) ? Math.round(j * 1000) / 1000 : null; }),
      box: [b.left, b.top, b.right, b.bottom].map((v) => Math.round(v * 10) / 10),
    };
  };
  const onRecords = (recs: MutationRecord[]) => {
    const t = inFrame ? clock : performance.now(), layers = new Set<HTMLElement>(), opts = new Set<HTMLElement>();
    for (const r of recs) {
      const el = (r.target.nodeType === Node.ELEMENT_NODE ? r.target : r.target.parentElement) as HTMLElement | null;
      if (!el) continue;
      const layer = el.closest<HTMLElement>('.qz-shot');
      if (layer) layers.add(layer);
      for (const n of r.addedNodes) if (n instanceof HTMLElement && n.matches('.qz-shot')) layers.add(n);
      const opt = el.closest<HTMLElement>('.qz-opt');
      if (opt && r.type === 'attributes' && el.parentElement?.classList.contains('dc')) opts.add(opt);
    }
    for (const l of layers) log.steps.push(step(l, t));
    for (const o of opts) log.opts.push({ t, k: o.dataset.persona ?? '', card: cardOf(o), min: Math.min(...[...o.querySelectorAll<HTMLElement>(':scope > .dc > span')].map(opacity)) });
  };
  const mo = new MutationObserver(onRecords);
  mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
  (window as unknown as { __qzPicLog: typeof log }).__qzPicLog = log;   // picPeek() reads it while the record goes on
  const types = ['pointerenter', 'pointerleave', 'pointerdown', 'pointercancel', 'focus', 'blur'];
  // pointerenter and pointerleave come to the answer itself; a press and its cancel come to the glyph under it and bubble
  const on = (e: Event) => { const o = e.type === 'pointerdown' || e.type === 'pointercancel' ? (e.target as Element).closest?.('.qz-opt') : e.target; if (o instanceof HTMLElement && o.matches('.qz-opt')) log.events.push({ t: performance.now(), ev: e instanceof PointerEvent ? `${e.type}:${e.pointerType}` : e.type, k: o.dataset.persona ?? '', card: cardOf(o) }); };
  for (const ty of types) document.addEventListener(ty, on, true);
  (window as unknown as { __qzPicStop: () => unknown }).__qzPicStop = () => {
    onRecords(mo.takeRecords()); mo.disconnect();
    for (const ty of types) document.removeEventListener(ty, on, true);
    window.requestAnimationFrame = raf0;
    return log;
  };
});
const picLog = (page: Page): Promise<PicLog> => page.evaluate(() => (window as unknown as { __qzPicStop: () => PicLog }).__qzPicStop());
/** the pointer, focus and blur events recorded so far, the record going on */
const picPeek = (page: Page): Promise<PicEvent[]> => page.evaluate(() => [...(window as unknown as { __qzPicLog: PicLog }).__qzPicLog.events]);

/** the time of the nth event `ev` (pointerenter:mouse, focus, ...) on the answer for k */
function picEvent(log: PicLog, ev: string, k: string, nth = 0): number {
  const e = log.events.filter((x) => x.ev === ev && x.k === k)[nth];
  expect(e, `${ev} on ${k} (${nth + 1})`).toBeTruthy();
  return e.t;
}
/** card i's picture for k, its steps from the event at `from` to the next at `to` (a step can carry its frame's timestamp
 *  from a little before the event that started it: input is dispatched inside the frame) */
const between = (log: PicLog, i: number, k: string, from: number, to: number): PicStep[] => log.steps.filter((s) => s.card === i && s.k === k && s.t >= from - 20 && s.t < to - 20);
const own = (s: PicStep) => s.j.every((j, i) => j !== null && Math.abs(j - i) < 0.01);
const opaque = (s: PicStep) => s.o.every((o) => o === 1);
const gone = (s: PicStep) => s.vis === 'hidden' && s.o.every((o) => o === 0);
const settledPic = (s: PicStep) => s.vis === 'visible' && opaque(s) && own(s) && s.tf === '' && s.ctf === 'none';
/** the left of the frame at least as visible as the right, strip by strip (both wipes; the decoder rounds to 0.001) */
const leftFirst = (s: PicStep) => s.o.every((o, i) => i === 0 || o <= s.o[i - 1] + 0.002);
const partway = (s: PicStep) => s.o.some((o) => o > 0 && o < 1);
/** a visible strip showing a slice that is not its own */
const elsewhere = (s: PicStep) => s.j.some((j, i) => s.o[i] > 0 && j !== null && Math.abs(j - i) > 0.01);
/** every strip on a whole slice, its own or one of the seven after it (the roll counts down from 5.753 steps, mod 8) */
const nearSlice = (s: PicStep) => s.j.every((j, i) => j !== null && Math.abs(j - Math.round(j)) < 0.01 && (Math.round(j) - i + 12) % 12 <= 7);

/** a picture decoding in from the event at `from`, as picture.ts draws it on the decoder's timings (decode.ts): 12 strips,
 *  strip i (x = i / 11) at opacity clamp(11u - 10x) with u = t / 0.4, so left to right, the last strip starting at 0.364 s
 *  and every strip in full at 0.4 s; strip i showing the slice of strip (i + k) % 12 until settled on its own at 0.75 s;
 *  the frame from scale 1.03 to 1, ease-out cubic over 0.75 s; settled by 0.9 s. Reduced motion: a 0.2 s fade, every
 *  strip at one opacity and on its own slice at every step, no transform */
function expectPicIn(at: string, steps: PicStep[], from: number, m: { reduced?: boolean } = {}): void {
  const since = (s: PicStep) => Math.round(s.t - from);
  expect(steps.length, `${at}: steps seen`).toBeGreaterThan(2);
  expect(steps.filter((s) => s.o.length !== 12).map(since), `${at}: 12 strips`).toEqual([]);
  const done = steps.find(settledPic);
  expect(done, `${at}: settles on its own slices at full opacity, no transform`).toBeTruthy();
  expect(settledPic(steps[steps.length - 1]), `${at}: and stays so`).toBe(true);
  expect(steps.some(partway), `${at}: a step seen part-way`).toBe(true);
  const fullAt = since(steps.find(opaque)!);
  if (m.reduced) {
    expect(steps.filter((s) => new Set(s.o).size > 1).map(since), `${at}: a fade, every strip at one opacity`).toEqual([]);
    expect(steps.filter((s) => !own(s)).map(since), `${at}: every strip on its own slice at every step`).toEqual([]);
    expect(steps.filter((s) => s.tf !== '' || s.ctf !== 'none').map((s) => `${since(s)} ms: ${s.tf} ${s.ctf}`), `${at}: no transform`).toEqual([]);
    expect(fullAt, `${at}: not in full before 0.2 s`).toBeGreaterThan(200 - 1);
    expect(steps.filter((s) => !opaque(s) && s.t - from > 200 + 10).map(since), `${at}: still fading in after 0.2 s`).toEqual([]);
    return;
  }
  expect(steps.filter((s) => !leftFirst(s)).map(since), `${at}: left to right at every step (the left the more visible)`).toEqual([]);
  expect(steps.some((s) => partway(s) && new Set(s.o).size > 1), `${at}: a wipe, uneven part-way, not a fade`).toBe(true);
  expect(steps.filter((s) => !nearSlice(s)).map(since), `${at}: each strip on its own slice or one of the seven after it`).toEqual([]);
  expect(steps.some(elsewhere), `${at}: a visible strip shows another strip's slice`).toBe(true);
  expect(since(steps.find((s) => s.o[11] > 0)!), `${at}: the last strip starts at 0.364 s, not before`).toBeGreaterThan(Math.round(400 * 10 / 11) - 1);
  expect(fullAt, `${at}: not in full before 0.4 s`).toBeGreaterThan(400 - 1);
  expect(steps.filter((s) => !opaque(s) && s.t - from > 400 + 10).map(since), `${at}: still coming in after 0.4 s`).toEqual([]);
  expect(steps.filter((s) => elsewhere(s) && s.t - from > 750 + 10).map(since), `${at}: still rolling after 0.75 s`).toEqual([]);
  expect(since(done!), `${at}: settled at 0.75 s, not before`).toBeGreaterThan(750 - 1);
  expect(since(done!), `${at}: and within 0.9 s`).toBeLessThanOrEqual(900);
  const scaled = steps.filter((s) => s.tf !== '');
  expect(scaled.length, `${at}: scaled while it comes in`).toBeGreaterThan(0);
  const k = (s: PicStep) => Number(/^scale\(([\d.]+)\)$/.exec(s.tf)?.[1]);
  for (const s of scaled) {
    const v = Math.min(1, Math.max(0, s.t - from) / 750), want = 1.03 - 0.03 * (1 - (1 - v) ** 3);
    expect(Math.abs(k(s) - want), `${at}: ${s.tf} at ${since(s)} ms (ease-out cubic from 1.03 to 1: ${want.toFixed(4)})`).toBeLessThan(0.003);
    expect(s.ctf, `${at}: ${s.tf} as computed`).toBe(`matrix(${k(s)}, 0, 0, ${k(s)}, 0, 0)`);
  }
  expect(scaled.some((s) => k(s) > 1.001 && k(s) < 1.029), `${at}: a step part-way from 1.03 to 1`).toBe(true);
}

/** a picture going out from the event at `from`: right to left over 0.2 s (the left the more visible at every step), every
 *  strip on its own slice, no transform, ending hidden with every strip at 0. Reduced motion: a 0.2 s fade. `slack`: how
 *  late after `from` the hide may have started (10 ms for a pointer or focus event; the touch commit starts it a frame
 *  after its last settled step) */
function expectPicOut(at: string, steps: PicStep[], from: number, m: { reduced?: boolean; slack?: number } = {}): void {
  const since = (s: PicStep) => Math.round(s.t - from), slack = m.slack ?? 10;
  expect(steps.length, `${at}: steps seen`).toBeGreaterThan(1);
  const off = steps.find(gone);
  expect(off, `${at}: ends hidden, every strip at 0`).toBeTruthy();
  expect(gone(steps[steps.length - 1]), `${at}: and stays so`).toBe(true);
  expect(since(off!), `${at}: not gone before 0.2 s`).toBeGreaterThan(200 - 1);
  expect(steps.filter((s) => s.o.some((o) => o > 0) && s.t - from > 200 + slack).map(since), `${at}: still visible after 0.2 s`).toEqual([]);
  expect(steps.some(partway), `${at}: a step seen part-way`).toBe(true);
  expect(steps.filter((s) => s.o.some((o) => o > 0) && !own(s)).map(since), `${at}: every strip on its own slice`).toEqual([]);
  expect(steps.filter((s) => s.tf !== '').map(since), `${at}: no transform`).toEqual([]);
  if (m.reduced) expect(steps.filter((s) => new Set(s.o).size > 1).map(since), `${at}: a fade, every strip at one opacity`).toEqual([]);
  else {
    expect(steps.filter((s) => !leftFirst(s)).map(since), `${at}: right to left at every step (the left the more visible)`).toEqual([]);
    expect(steps.some((s) => partway(s) && new Set(s.o).size > 1), `${at}: a wipe, uneven part-way, not a fade`).toBe(true);
  }
}

/** card i's frame and the picture for k as laid out, with its strips' backgrounds and the picture's chosen source */
const picGeometry = (page: Page, i: number, k: string) => page.evaluate(({ i, k }) => {
  const card = document.querySelector<HTMLElement>(`.qz-card[data-i="${i}"]`)!, frame = card.querySelector<HTMLElement>('.qz-pics')!, layer = frame.querySelector<HTMLElement>(`.qz-shot[data-persona="${k}"]`)!;
  const img = frame.querySelector<HTMLImageElement>(`.qz-pic[data-persona="${k}"] img`)!;
  const box = (e: Element) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  return {
    vw: innerWidth, card: box(card), frame: box(frame), layer: box(layer), q: box(card.querySelector('.qz-q')!),
    text: Math.max(...[...card.querySelectorAll('.qz-count, .qz-q, .qz-opt')].map((e) => box(e).right)),
    strips: [...layer.children].map((s) => ({ ...box(s), image: getComputedStyle(s).backgroundImage, size: (s as HTMLElement).style.backgroundSize })),
    src: img.currentSrc, natural: [img.naturalWidth, img.naturalHeight], W: frame.clientWidth, H: frame.clientHeight,
  };
}, { i, k });

/** every step of card i's pictures (or its picture for k) drawn: the layer visible with a strip above opacity 0 */
const drawnSteps = (log: PicLog, i: number, k?: string): PicStep[] => log.steps.filter((s) => s.card === i && (!k || s.k === k) && s.vis === 'visible' && s.o.some((o) => o > 0));

/** an answer taken: its picture, shown from the event at the start of `steps`, settled and stayed so while the pointer or
 *  focus left the answer (at `left`, during the answer's hold: aria-pressed keeps it), then wiped out with the answer,
 *  starting in the frame the answer's glyphs started wiping out (`wiped`), over 0.2 s */
function expectPicGoesWithAnswer(at: string, steps: PicStep[], left: number, wiped: number): void {
  const on = steps.findIndex(settledPic), out = steps.findIndex((s, n) => n > on && !settledPic(s));
  expect(on, `${at}: the picture settles`).toBeGreaterThanOrEqual(0);
  expect(out, `${at}: then goes`).toBeGreaterThan(on);
  expect(steps.slice(on, out).filter((s) => !settledPic(s)).length, `${at}: settled until it goes`).toBe(0);
  expect(Math.round(steps[out].t - left), `${at}: not when the pointer or focus left the answer, 0.1 s or more before it goes`).toBeGreaterThan(100);
  expect(Math.round(steps[out].t - wiped), `${at}: it goes in the frame the answer starts wiping out`).toBeGreaterThanOrEqual(-20);
  expect(Math.round(steps[out].t - wiped)).toBeLessThanOrEqual(20);
  // from a frame and a half before its first step out: the hide began in the task between the two frames
  expectPicOut(`${at}: it wipes out with the answer`, steps.slice(out), steps[out].t - 25, { slack: 45 });
}

/** card i's pictures (every one, or those of the answers named) held on the network by page.route until release(): an
 *  answer can be hovered, focused or tapped while its picture is still loading (picture.ts first awaits its decode).
 *  held() lists the pictures asked for so far (q<i>-<personality>) */
async function holdPics(page: Page, i: number, personas?: string[]): Promise<{ release: () => void; held: () => string[] }> {
  let open: () => void = () => undefined;
  const gate = new Promise<void>((r) => { open = r; }), held: string[] = [];
  const key = (url: URL) => PIC_URL.exec(url.pathname)?.[1] ?? '';
  await page.route((url) => key(url).startsWith(`q${i}-`) && (!personas || personas.includes(key(url).slice(`q${i}-`.length))), async (route) => {
    held.push(key(new URL(route.request().url())));
    await gate;
    await route.continue().catch(() => undefined);   // the page may have closed meanwhile
  });
  return { release: () => open(), held: () => [...held] };
}
/** whether card i's picture for k has loaded (its <img> complete, with its size), now; and a wait for it */
const picLoadedNow = (page: Page, i: number, k: string): Promise<boolean> => page.locator(`.qz-card[data-i="${i}"] .qz-pic[data-persona="${k}"] img`).evaluate((m) => (m as HTMLImageElement).complete && (m as HTMLImageElement).naturalWidth > 0);
const picLoaded = (page: Page, i: number, k: string): Promise<unknown> => page.waitForFunction(({ i, k }) => {
  const m = document.querySelector<HTMLImageElement>(`.qz-card[data-i="${i}"] .qz-pic[data-persona="${k}"] img`);
  return !!m && m.complete && m.naturalWidth > 0;
}, { i, k }, { timeout: 15_000 });
/** a click by script where the pointer and focus stand (Begin, an answer, Back): neither moves */
const press = (el: Locator): Promise<void> => el.evaluate((e) => { (e as HTMLElement).click(); });

test('Pictures, a mouse at 1280 x 800 (Sam: "that image should appear only when u hover over that option"): on question 1 the answer under the pointer decodes its picture in beside the question, in the second column (aria-hidden), strip by strip left to right while the strips show other strips\' slices, from scale 1.03, settled on its own slices at full opacity within 0.9 s; the next answer wipes it out right to left over 0.2 s while its own decodes in over it; leaving the answers wipes that out', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const [a, b] = [QUIZ_QUESTIONS[0].answers[0].persona, QUIZ_QUESTIONS[0].answers[3].persona];
  expect(QUIZ_QUESTIONS[0].visual, 'question 1 is visual').toBe(true);
  await openQuiz(page, baseURL);
  await begin(page);
  await page.mouse.move(0, 0);
  await settled(page);
  await picsLoaded(page, 0);
  await quiet(page);
  await expect.poll(() => picNow(page, 0), { message: 'no picture with no pointer over an answer' }).toEqual(allOff(0));
  const frame = page.locator('.qz-card.is-top .qz-pics');
  await expect(frame, 'the frame is hidden from assistive technology').toHaveAttribute('aria-hidden', 'true');
  expect(await frame.locator('img').evaluateAll((ms) => ms.map((m) => m.getAttribute('alt'))), 'and its pictures say nothing').toEqual(Array(7).fill(''));
  await recordPics(page);
  await page.locator(`.qz-card.is-top .qz-opt[data-persona="${a}"]`).hover();
  await expect.poll(async () => (await picNow(page, 0))[a]).toBe('settled');
  const geo = await picGeometry(page, 0, a);
  await page.locator(`.qz-card.is-top .qz-opt[data-persona="${b}"]`).hover();
  await expect.poll(async () => { const s = await picNow(page, 0); return [s[a], s[b]]; }).toEqual(['off', 'settled']);
  await page.mouse.move(0, 0);
  await expect.poll(() => picNow(page, 0)).toEqual(allOff(0));
  const log = await picLog(page);
  await ctx.close();
  const inA = picEvent(log, 'pointerenter:mouse', a), outA = picEvent(log, 'pointerleave:mouse', a), inB = picEvent(log, 'pointerenter:mouse', b), outB = picEvent(log, 'pointerleave:mouse', b);
  expectPicIn('the answer under the pointer: its picture decodes in', between(log, 0, a, inA, outA), inA);
  expectPicOut('the pointer on the next answer: the first picture wipes out', between(log, 0, a, outA, Infinity), outA);
  expectPicIn('and the next answer\'s decodes in', between(log, 0, b, inB, outB), inB);
  expectPicOut('the pointer off the answers: it wipes out', between(log, 0, b, outB, Infinity), outB);
  // the incoming picture is drawn over the outgoing one: the last layer of the frame while the first is still going
  const going = between(log, 0, a, outA, Infinity).filter((s) => s.o.some((o) => o > 0));
  expect(going.length, 'the two on screen together a while').toBeGreaterThan(0);
  expect(going.filter((s) => s.z >= s.n - 1).map((s) => `${s.z} of ${s.n}`), 'the outgoing under the incoming').toEqual([]);
  expect(between(log, 0, b, inB, outB).filter((s) => s.z !== s.n - 1).map((s) => `${s.z} of ${s.n}`), 'the incoming the last drawn').toEqual([]);
  // the second column, beside the question: clamp(260px, 30vw, 440px) wide, four by five, level with the question
  expect(geo.frame.width, 'the column clamp(260px, 30vw, 440px)').toBeCloseTo(Math.min(440, Math.max(260, 0.3 * 1280)), 0);
  expect(geo.frame.height / geo.frame.width, 'four by five').toBeCloseTo(5 / 4, 2);
  expect(geo.frame.left - geo.text, 'beside the words, a gap of 32 px or more between').toBeGreaterThanOrEqual(32 - 0.5);
  expect(geo.frame.top, 'from the card\'s first row').toBeCloseTo(geo.card.top, 0);
  expect(geo.frame.top <= geo.q.top && geo.frame.bottom >= geo.q.bottom, 'level with the question').toBe(true);
  expect(geo.frame.right, 'inside the right gutter').toBeLessThanOrEqual(geo.vw - 16 + 0.01);
  for (const side of ['left', 'top', 'right', 'bottom'] as const) expect(geo.layer[side], `the picture fills the frame (${side})`).toBeCloseTo(geo.frame[side], 0);
  for (const s of between(log, 0, a, inA, outA).filter(settledPic)) expect(s.box, 'the settled picture where the frame stands').toEqual([geo.frame.left, geo.frame.top, geo.frame.right, geo.frame.bottom].map((v) => Math.round(v * 10) / 10));
  // twelve strips across it, each drawing the answer's own picture (the <img>'s chosen source), sized as object-fit: cover
  expect(geo.strips.length).toBe(12);
  expect(geo.strips.every((s, n) => n === 0 || s.left > geo.strips[n - 1].left), 'left to right in order').toBe(true);
  expect([geo.strips[0].left, geo.strips[11].right], 'across the frame').toEqual([expect.closeTo(geo.frame.left, 0), expect.closeTo(geo.frame.right + 1, 0)]);
  expect(PIC_URL.exec(new URL(geo.src).pathname)?.slice(1), 'the answer\'s own picture, AVIF').toEqual([`q0-${a}`, '640', 'avif']);
  expect([...new Set(geo.strips.map((s) => s.image))], 'every strip draws it').toEqual([`url("${geo.src}")`]);
  const [cw, ch] = geo.strips[0].size.split(' ').map(parseFloat);
  expect(cw, 'covers the width').toBeGreaterThanOrEqual(geo.W - 0.01);
  expect(ch, 'covers the height').toBeGreaterThanOrEqual(geo.H - 0.01);
  expect(Math.min(cw - geo.W, ch - geo.H), 'and fits one of them').toBeLessThan(0.01);
  expect(cw / ch, 'at the picture\'s own aspect').toBeCloseTo(geo.natural[0] / geo.natural[1], 3);
});

test('Pictures, the keyboard: Down from question 1 focuses its first answer, which shows its picture decoding in as under a pointer; Tab to the next answer wipes it out and decodes that one\'s in; Shift+Tab back does the same the other way, and Shift+Tab out of the deck wipes it out, leaving none; Tab back in shows it again, Enter takes the answer, and Tab on during the answer\'s hold keeps its picture settled (the answer taken) and shows none for the answer focused (no answer is live then) until the picture wipes out with the answer', async ({ page, baseURL }) => {
  const [a0, a1] = [QUIZ_QUESTIONS[0].answers[0].persona, QUIZ_QUESTIONS[0].answers[1].persona];
  await openQuiz(page, baseURL);
  await page.locator('#qzBegin').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
  await settled(page);
  await picsLoaded(page, 0);
  await quiet(page);
  expect(await picNow(page, 0), 'none while the question has focus').toEqual(allOff(0));
  await recordPics(page);
  const opts = page.locator('.qz-card[data-i="0"] .qz-opt');
  await page.keyboard.press('ArrowDown');
  await expect(opts.nth(0)).toBeFocused();
  expect(await opts.nth(0).evaluate((o) => o.matches(':focus-visible')), 'keyboard focus').toBe(true);
  await expect.poll(async () => (await picNow(page, 0))[a0]).toBe('settled');
  await page.keyboard.press('Tab');
  await expect(opts.nth(1)).toBeFocused();
  await expect.poll(async () => { const s = await picNow(page, 0); return [s[a0], s[a1]]; }).toEqual(['off', 'settled']);
  await page.keyboard.press('Shift+Tab');
  await expect(opts.nth(0)).toBeFocused();
  await expect.poll(async () => { const s = await picNow(page, 0); return [s[a0], s[a1]]; }).toEqual(['settled', 'off']);
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('#qzCards')), 'focus out of the deck').toBe(false);
  await expect.poll(() => picNow(page, 0)).toEqual(allOff(0));
  // Tab back in to the first answer, Enter on it, and Tab on at once, inside the answer's hold: the blur of the answer taken
  // does not hide its picture (aria-pressed), and the answer focused next shows none (the deck is busy)
  await page.keyboard.press('Tab');
  await expect(opts.nth(0)).toBeFocused();
  await expect.poll(async () => (await picNow(page, 0))[a0]).toBe('settled');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await onTop(page, 1);
  await settled(page);
  const log = await picLog(page);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'Enter took the first answer').toEqual([['quiz_answer', { q: 1, persona: a0 }]]);
  const f0 = picEvent(log, 'focus', a0), b0 = picEvent(log, 'blur', a0), f1 = picEvent(log, 'focus', a1), b1 = picEvent(log, 'blur', a1);
  const f0b = picEvent(log, 'focus', a0, 1), b0b = picEvent(log, 'blur', a0, 1), f0c = picEvent(log, 'focus', a0, 2), b0c = picEvent(log, 'blur', a0, 2);
  expectPicIn('focus on the first answer: its picture decodes in', between(log, 0, a0, f0, b0), f0);
  expectPicOut('Tab away: it wipes out', between(log, 0, a0, b0, f0b), b0);
  expectPicIn('and the next answer\'s decodes in', between(log, 0, a1, f1, b1), f1);
  expectPicOut('Shift+Tab back: that one wipes out', between(log, 0, a1, b1, f0c), b1);
  expectPicIn('and the first answer\'s decodes in again', between(log, 0, a0, f0b, b0b), f0b);
  expectPicOut('Shift+Tab out of the deck: it wipes out', between(log, 0, a0, b0b, f0c), b0b);
  expectPicIn('Tab back in: it decodes in again', between(log, 0, a0, f0c, b0c), f0c);
  // the hold: Tab moved focus on during it, and the picture stayed settled until the answer started wiping out
  const wiped = log.opts.find((o) => o.card === 0 && o.k === a0 && o.min < 1 && o.t > f0c);
  expect(wiped, 'the answer wipes out').toBeTruthy();
  expect(b0c, 'Tab moved focus on before the answer started wiping out').toBeLessThan(wiped!.t);
  expect(picEvent(log, 'focus', a1, 1), 'to the next answer').toBeGreaterThanOrEqual(b0c);
  expectPicGoesWithAnswer('Enter, then Tab during the hold', between(log, 0, a0, f0c, Infinity), b0c, wiped!.t);
  expect(drawnSteps(log, 0, a1).filter((s) => s.t > b0c).map((s) => Math.round(s.t - b0c)), 'the answer focused during the hold shows no picture').toEqual([]);
});

test('Pictures, a touch screen at 390 x 844: a tap on an answer of question 1 shows its picture above the question, in the open space under the logotype\'s band, decoding in, and holds the answer at full opacity, the rest of the question gone, until the picture has settled (at most 0.9 s); then the answer and its picture wipe out together and question 2 decodes in', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  const p = QUIZ_QUESTIONS[0].answers[2].persona;
  await openQuiz(page, baseURL);
  await page.locator('#qzBegin').tap();
  await expect(page.locator('#find')).toHaveAttribute('data-state', 'quiz');
  await onTop(page, 0);
  await settled(page);
  await picsLoaded(page, 0);
  await quiet(page);
  const place = await page.evaluate(() => {
    const c = document.querySelector('.qz-card.is-top')!, f = c.querySelector<HTMLElement>('.qz-pics')!, r = (e: Element) => e.getBoundingClientRect();
    return { frame: [r(f).left, r(f).top, r(f).right, r(f).bottom], none: f.hasAttribute('data-none'), first: r(c.querySelector('.qz-count')!).top };
  });
  expect(place.none, 'room for the picture above the question').toBe(false);
  const [left, top, right, bottom] = place.frame;
  expect(bottom - top, '96 px high or more').toBeGreaterThanOrEqual(96);
  expect(top, 'under the logotype\'s band').toBeGreaterThanOrEqual(56 + 16 - 0.5);
  expect(bottom, 'above the question').toBeLessThanOrEqual(place.first + 0.5);
  expect([left, right], 'between the gutters').toEqual([expect.closeTo(16, 0), expect.closeTo(390 - 16, 0)]);
  await recordPics(page);
  const box = (await page.locator(`.qz-card.is-top .qz-opt[data-persona="${p}"]`).boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await onTop(page, 1);
  await settled(page);
  const log = await picLog(page);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'the tap took the answer').toEqual([['quiz_answer', { q: 1, persona: p }]]);
  await ctx.close();
  const down = picEvent(log, 'pointerdown:touch', p);
  const steps = between(log, 0, p, down, Infinity), at = steps.findIndex(settledPic), outAt = steps.findIndex((s, n) => n > at && !settledPic(s));
  expect(at, 'the picture settles').toBeGreaterThan(0);
  expect(outAt, 'then goes').toBeGreaterThan(at);
  expectPicIn('the tap: the picture decodes in', steps.slice(0, outAt), down);
  expectPicOut('then it wipes out with the answer', steps.slice(outAt), steps[outAt - 1].t, { slack: 40 });
  for (const s of steps.filter((s) => s.o.some((o) => o > 0))) expect(s.box, 'above the question, where the frame stood').toEqual(place.frame.map((v) => Math.round(v * 10) / 10));
  // the hold: the answer at full opacity until the picture has settled, the rest of the question gone by then
  const settledAt = steps[at].t, wiped = log.opts.find((o) => o.card === 0 && o.k === p && o.min < 1);
  expect(wiped, 'the answer wipes out').toBeTruthy();
  expect(wiped!.t, 'not before the picture has settled').toBeGreaterThanOrEqual(settledAt);
  expect(wiped!.t - down, 'held past the 0.32 s a click holds it').toBeGreaterThan(750 - 1);
  expect(wiped!.t - down, 'and at most 0.9 s past the 0.32 s').toBeLessThan(200 + 120 + 900 + 100);
  for (const o of QUIZ_QUESTIONS[0].answers.map((x) => x.persona).filter((x) => x !== p)) {
    expect(log.opts.filter((s) => s.card === 0 && s.k === o && s.t < wiped!.t).pop()?.min, `${o} gone before the answer goes`).toBe(0);
  }
});

test('Pictures only where a question is visual: the five visual questions (1, 3, 5, 8 and 9) carry data-pics and one frame, aria-hidden, with a <picture> per answer in the answers\' order (AVIF and WebP at 640 px and a larger width, the column\'s sizes, alt "", lazy, async); the other five have no frame, and hovering or focusing the answers of question 2 asks for no picture and draws none anywhere', async ({ page, baseURL }) => {
  const visual = QUIZ_QUESTIONS.flatMap((q, i) => (q.visual ? [i] : []));
  expect(visual).toEqual([0, 2, 4, 7, 8]);
  const asked: string[] = [];
  page.on('request', (r) => { const m = PIC_URL.exec(new URL(r.url()).pathname); if (m) asked.push(m[1]); });
  await openQuiz(page, baseURL);
  const cards = await page.locator('.qz-card').evaluateAll((cs) => cs.map((c) => ({
    pics: c.hasAttribute('data-pics'), frames: c.querySelectorAll('.qz-pics').length, hidden: c.querySelector('.qz-pics')?.getAttribute('aria-hidden') ?? null,
    list: [...c.querySelectorAll<HTMLElement>('.qz-pics > .qz-pic')].map((p) => {
      const s = p.querySelector('source'), m = p.querySelector('img')!;
      return { k: p.dataset.persona ?? '', type: s?.getAttribute('type') ?? '', avif: s?.getAttribute('srcset') ?? '', webp: m.getAttribute('srcset') ?? '', sizes: [s?.getAttribute('sizes'), m.getAttribute('sizes')], alt: m.getAttribute('alt'), loading: m.getAttribute('loading'), decoding: m.getAttribute('decoding'), shots: p.parentElement!.querySelectorAll('.qz-shot').length };
    }),
  })));
  for (const [i, c] of cards.entries()) {
    if (!visual.includes(i)) { expect(c, `question ${i + 1}: no pictures`).toEqual({ pics: false, frames: 0, hidden: null, list: [] }); continue; }
    expect([c.pics, c.frames, c.hidden], `question ${i + 1}: data-pics and one frame, aria-hidden`).toEqual([true, 1, 'true']);
    expect(c.list.map((x) => x.k), `question ${i + 1}: a picture per answer, in order`).toEqual(QUIZ_QUESTIONS[i].answers.map((a) => a.persona));
    for (const x of c.list) {
      const at = `question ${i + 1}, ${x.k}`;
      expect({ type: x.type, sizes: x.sizes, alt: x.alt, loading: x.loading, decoding: x.decoding, shots: x.shots }, at).toEqual({ type: 'image/avif', sizes: [PIC_SIZES, PIC_SIZES], alt: '', loading: 'lazy', decoding: 'async', shots: 0 });
      for (const [set, ext] of [[x.avif, 'avif'], [x.webp, 'webp']] as const) {
        const items = set.split(', ').map((e) => { const [url, w] = e.split(' '); return { m: PIC_URL.exec(url)?.slice(1), w }; });
        expect(items.length, `${at}: two widths of ${ext}`).toBe(2);
        expect(items.map((e) => e.m?.[0]), `${at}: its own files`).toEqual([`q${i}-${x.k}`, `q${i}-${x.k}`]);
        expect(items.map((e) => e.m?.[2]), `${at}: ${ext}`).toEqual([ext, ext]);
        expect(items.map((e) => `${e.m?.[1]}w`), `${at}: the descriptor is the file's width`).toEqual(items.map((e) => e.w));
        expect(Number(items[0].m?.[1]), `${at}: 640 px first`).toBe(640);
        expect(Number(items[1].m?.[1]), `${at}: then a larger one, at most 1100`).toBeGreaterThan(640);
        expect(Number(items[1].m?.[1])).toBeLessThanOrEqual(1100);
      }
    }
  }
  // on question 2, a pointer and keyboard focus on its answers ask for no picture and draw none, on any question
  await begin(page);
  await answer(page, ['curator']);
  await onTop(page, 1);
  await settled(page);
  await quiet(page);
  const before = [...asked].sort();
  expect(before, 'question 1\'s seven, asked for while it was on screen').toEqual(QUIZ_QUESTIONS[0].answers.map((a) => `q0-${a.persona}`).sort());
  for (const o of await page.locator('.qz-card.is-top .qz-opt').all()) await o.hover();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
  await expect(page.locator('.qz-card[data-i="1"] .qz-opt').nth(1)).toBeFocused();
  await page.waitForTimeout(900);   // the 0.75 s a picture would take to decode in, and more
  expect([...asked].sort(), 'no picture asked for').toEqual(before);
  expect(await page.locator('.qz-card[data-i="1"] .qz-pics, .qz-card[data-i="1"] .qz-shot').count(), 'question 2 has no frame and no picture').toBe(0);
  expect(await page.locator('.qz-shot').evaluateAll((ls) => ls.filter((l) => (l as HTMLElement).style.visibility === 'visible' || [...l.children].some((s) => (s as HTMLElement).style.opacity !== '0')).map((l) => `${(l as HTMLElement).dataset.persona}@${(l.closest('.qz-card') as HTMLElement).dataset.i}`)), 'no picture drawn on any question').toEqual([]);
});

test('Pictures load with their question: none with the intro; question 1 on screen requests its seven, each once as AVIF at one width; question 2, with none, requests nothing, and question 3\'s wait until it is on screen, then its seven', async ({ page, baseURL }) => {
  const got: { key: string; w: number; type: string }[] = [];
  page.on('request', (r) => { const m = PIC_URL.exec(new URL(r.url()).pathname); if (m) got.push({ key: m[1], w: Number(m[2]), type: m[3] }); });
  const seven = (i: number) => QUIZ_QUESTIONS[i].answers.map((a) => `q${i}-${a.persona}`).sort();
  const of = (i: number) => got.filter((g) => g.key.startsWith(`q${i}-`)).map((g) => g.key).sort();
  await openQuiz(page, baseURL);
  await quiet(page);
  expect(got, 'none with the intro').toEqual([]);
  await begin(page);
  await picsLoaded(page, 0);
  await settled(page);
  await quiet(page);
  expect(of(0), 'question 1: its seven, each once').toEqual(seven(0));
  expect(got.length, 'and nothing more').toBe(7);
  await answer(page, ['curator']);
  await onTop(page, 1);
  await settled(page);
  await quiet(page);
  expect(got.length, 'question 2: none, and none of question 3\'s').toBe(7);
  await answer(page, ['curator', 'curator'], 1);
  await onTop(page, 2);
  await picsLoaded(page, 2);
  await settled(page);
  await quiet(page);
  expect(of(2), 'question 3 on screen: its seven, each once').toEqual(seven(2));
  expect(got.length, 'and nothing more').toBe(14);
  expect([...new Set(got.map((g) => `${g.type} ${g.w}`))], 'AVIF, at the 640 px width the column needs').toEqual(['avif 640']);
});

test('Pictures under reduced motion: the answer under the pointer fades its picture in over 0.2 s, every strip at one opacity and on its own slice at every step, with no transform; leaving fades it out over 0.2 s the same way', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const a = QUIZ_QUESTIONS[0].answers[4].persona;
  await openQuiz(page, baseURL);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'reduced motion').toBe(true);
  await begin(page);
  await page.mouse.move(0, 0);
  await settled(page);
  await picsLoaded(page, 0);
  await quiet(page);
  await expect.poll(() => picNow(page, 0)).toEqual(allOff(0));
  await recordPics(page);
  await page.locator(`.qz-card.is-top .qz-opt[data-persona="${a}"]`).hover();
  await expect.poll(async () => (await picNow(page, 0))[a]).toBe('settled');
  await page.mouse.move(0, 0);
  await expect.poll(() => picNow(page, 0)).toEqual(allOff(0));
  const log = await picLog(page);
  await ctx.close();
  const enter = picEvent(log, 'pointerenter:mouse', a), leave = picEvent(log, 'pointerleave:mouse', a);
  expectPicIn('the pointer on an answer: its picture fades in', between(log, 0, a, enter, leave), enter, { reduced: true });
  expectPicOut('the pointer off: it fades out', between(log, 0, a, leave, Infinity), leave, { reduced: true });
});

// ---- the pictures, from the review of 2026-10-20: a picture still on the network when its answer is shown or left, a
// touch that takes no answer, a screen with no room for the frame, a picture left on as the question changes, an answer
// taken with the mouse or the keyboard while the pointer or focus leaves it, and focus that is not the keyboard's

test('Pictures, a mouse press: pressed on an answer of question 1 and dragged off it (no click), the answer keeps focus but not :focus-visible, its picture wipes out as the pointer leaves, and focus given back to it by script (as when the window regains focus) shows none; an answer clicked keeps its picture settled while the pointer leaves it during the answer\'s hold, and the picture wipes out with the answer over 0.2 s as question 2 comes', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const [a, c] = [QUIZ_QUESTIONS[0].answers[2].persona, QUIZ_QUESTIONS[0].answers[5].persona];
  await openQuiz(page, baseURL);
  await begin(page);
  await page.mouse.move(0, 0);
  await settled(page);
  await picsLoaded(page, 0);
  await quiet(page);
  await expect.poll(() => picNow(page, 0)).toEqual(allOff(0));
  await recordPics(page);
  // pressed and dragged off: no click, the answer focused by the mouse
  const optA = page.locator(`.qz-card.is-top .qz-opt[data-persona="${a}"]`), optC = page.locator(`.qz-card.is-top .qz-opt[data-persona="${c}"]`);
  const focusOf = (o: Locator) => o.evaluate((e) => [document.activeElement === e, e.matches(':focus-visible')]);
  await optA.hover();
  await expect.poll(async () => (await picNow(page, 0))[a]).toBe('settled');
  await page.mouse.down();
  expect(await focusOf(optA), 'focused by the press, not :focus-visible').toEqual([true, false]);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await expect.poll(() => picNow(page, 0), { message: 'the pointer left: its picture wiped out' }).toEqual(allOff(0));
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'no click, no answer taken').toEqual([]);
  expect(await focusOf(optA), 'still focused').toEqual([true, false]);
  // focus away and back by script, the pointer off the answers: a focus that is not the keyboard's shows no picture
  await optA.evaluate((e) => { (e as HTMLElement).blur(); (e as HTMLElement).focus(); });
  expect(await focusOf(optA), 'focused again, not :focus-visible').toEqual([true, false]);
  await page.waitForTimeout(900);   // the 0.75 s a picture would take to decode in, and more
  expect(await picNow(page, 0), 'no picture from that focus').toEqual(allOff(0));
  // clicked: the pointer leaves 0.15 s into the answer's hold, and the picture stays until the answer goes
  await optC.hover();
  await expect.poll(async () => (await picNow(page, 0))[c]).toBe('settled');
  await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(150);
  await page.mouse.move(0, 0);
  await onTop(page, 1);
  await settled(page);
  const log = await picLog(page);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'the click took the answer').toEqual([['quiz_answer', { q: 1, persona: c }]]);
  await ctx.close();
  const focusA = picEvent(log, 'focus', a, 1);
  expect(drawnSteps(log, 0, a).filter((s) => s.t >= focusA).map((s) => Math.round(s.t - focusA)), 'nothing drawn for the answer focused by script').toEqual([]);
  const down = picEvent(log, 'pointerdown:mouse', c), left = picEvent(log, 'pointerleave:mouse', c);
  const wiped = log.opts.find((o) => o.card === 0 && o.k === c && o.min < 1 && o.t > down);
  expect(wiped, 'the answer wipes out').toBeTruthy();
  expect(left, 'the pointer left the answer during its hold').toBeLessThan(wiped!.t);
  expect(left - down, 'after the click').toBeGreaterThan(100);
  expectPicGoesWithAnswer('a click, then the pointer off during the hold', between(log, 0, c, picEvent(log, 'pointerenter:mouse', c), Infinity), left, wiped!.t);
});

test('Pictures on a slow network (question 1\'s pictures held by page.route) at 1280 x 800: an answer hovered and left before its picture has loaded shows nothing when the picture arrives; an answer still loading hovered and then one loaded shows only the loaded one, before and after the first arrives', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const [a, b, c] = [QUIZ_QUESTIONS[0].answers[1].persona, QUIZ_QUESTIONS[0].answers[3].persona, QUIZ_QUESTIONS[0].answers[5].persona];
  const slowA = await holdPics(page, 0, [a]), slowC = await holdPics(page, 0, [c]);
  await openQuiz(page, baseURL);
  await quiet(page);
  await page.mouse.move(0, 0);
  await press(page.locator('#qzBegin'));   // the pointer stays off the answers
  await onTop(page, 0);
  await settled(page);
  await picLoaded(page, 0, b);
  await expect.poll(() => [...slowA.held(), ...slowC.held()].sort(), { message: 'the two asked for and held' }).toEqual([`q0-${a}`, `q0-${c}`].sort());
  await recordPics(page);
  // hovered and left while its picture loads
  await page.locator(`.qz-card.is-top .qz-opt[data-persona="${a}"]`).hover();
  await page.waitForTimeout(250);
  expect(await picLoadedNow(page, 0, a), `${a}: still loading under the pointer`).toBe(false);
  await page.mouse.move(0, 0);
  expect(await picNow(page, 0), 'nothing drawn while it loads').toEqual(allOff(0));
  slowA.release();
  await picLoaded(page, 0, a);
  await page.waitForTimeout(1200);   // the 0.75 s a show would take, and more
  expect(await picNow(page, 0), `${a}: arrived with the pointer off the answers, not shown`).toEqual(allOff(0));
  // a slow one hovered, then a loaded one: the pointer stays on the loaded one
  await page.locator(`.qz-card.is-top .qz-opt[data-persona="${c}"]`).hover();
  await page.waitForTimeout(250);
  expect(await picLoadedNow(page, 0, c), `${c}: still loading under the pointer`).toBe(false);
  await page.locator(`.qz-card.is-top .qz-opt[data-persona="${b}"]`).hover();
  await expect.poll(async () => (await picNow(page, 0))[b]).toBe('settled');
  slowC.release();
  await picLoaded(page, 0, c);
  await page.waitForTimeout(1200);
  expect(await picNow(page, 0), `the pointer on ${b}: its picture alone, after ${c}'s arrived`).toEqual({ ...allOff(0), [b]: 'settled' });
  const log = await picLog(page);
  await ctx.close();
  expect(drawnSteps(log, 0, a).map((s) => s.t), `${a}: never drawn`).toEqual([]);
  expect(drawnSteps(log, 0, c).map((s) => s.t), `${c}: never drawn`).toEqual([]);
  const inB = picEvent(log, 'pointerenter:mouse', b);
  expectPicIn(`${b}: decodes in as ever`, between(log, 0, b, inB, Infinity), inB);
});

test('Pictures on a slow network, the pointer at rest (question 3\'s pictures held by page.route) at 1280 x 800: question 3 put on screen under the pointer left where question 2\'s answer was clicked gives the answer there pointerenter; the pointer moved off 0.3 s later, before the pictures arrive, leaves none shown once they have', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const slow = await holdPics(page, 2);
  await openQuiz(page, baseURL);
  await quiet(page);
  await page.mouse.move(0, 0);
  await press(page.locator('#qzBegin'));
  await ready(page, 0);
  await press(page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]'));
  await ready(page, 1);
  await settled(page);
  await recordPics(page);
  await arm(page, 2);
  await page.locator('.qz-card.is-top .qz-opt').nth(3).click();   // the pointer rests where it clicked
  const at = await shown(page);
  await expect.poll(async () => (await picPeek(page)).filter((e) => e.card === 2 && e.ev === 'pointerenter:mouse').length, { message: 'question 3\'s answer under the resting pointer takes pointerenter' }).toBeGreaterThan(0);
  const k = (await picPeek(page)).find((e) => e.card === 2 && e.ev === 'pointerenter:mouse')!.k;
  await page.waitForFunction((at) => performance.now() >= at + 300, at);
  expect(await picLoadedNow(page, 2, k), `${k}: still loading when the pointer moves off`).toBe(false);
  await page.mouse.move(0, 0);
  slow.release();
  await picsLoaded(page, 2);
  await page.waitForTimeout(1200);
  expect(await picNow(page, 2), 'the pictures arrived with the pointer off the answers: none shown').toEqual(allOff(2));
  const log = await picLog(page);
  await ctx.close();
  expect(drawnSteps(log, 2).map((s) => `${s.k} ${Math.round(s.t - at)} ms`), 'none drawn on question 3').toEqual([]);
});

test('Pictures, a tap on an answer whose picture is still loading (held by page.route) at 390 x 844: the answer holds at most 0.9 s past its 0.32 s, then wipes out and question 2 decodes in; the picture arriving later is never drawn, on the question gone or anywhere', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  const p = QUIZ_QUESTIONS[0].answers[4].persona;
  const slow = await holdPics(page, 0, [p]);
  await openQuiz(page, baseURL);
  await quiet(page);
  await page.locator('#qzBegin').tap();
  await onTop(page, 0);
  await settled(page);
  await expect.poll(() => slow.held(), { message: 'its picture asked for and held' }).toEqual([`q0-${p}`]);
  await recordPics(page);
  const box = (await page.locator(`.qz-card.is-top .qz-opt[data-persona="${p}"]`).boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await onTop(page, 1);
  expect(await picLoadedNow(page, 0, p), 'still loading when the answer went').toBe(false);
  slow.release();
  await picLoaded(page, 0, p);
  await page.waitForTimeout(1200);
  const log = await picLog(page), now = await picNow(page, 0);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'the tap took the answer').toEqual([['quiz_answer', { q: 1, persona: p }]]);
  await ctx.close();
  const down = picEvent(log, 'pointerdown:touch', p), wiped = log.opts.find((o) => o.card === 0 && o.k === p && o.min < 1);
  expect(wiped, 'the answer wipes out').toBeTruthy();
  expect(wiped!.t - down, 'held the 0.9 s its picture may take').toBeGreaterThan(200 + 120 + 900 - 60);
  expect(wiped!.t - down, 'and no longer: 0.32 s and 0.9 s, and a frame or two').toBeLessThan(200 + 120 + 900 + 150);
  expect(drawnSteps(log, 0).map((s) => `${s.k} ${Math.round(s.t - down)} ms`), 'no picture drawn on question 1').toEqual([]);
  expect(now, 'question 1, gone, with no picture on').toEqual(allOff(0));
});

for (const [w, h] of [[360, 780], [844, 390]] as const) {
  test(`Pictures with no room for the frame, a touch screen at ${w} x ${h}: question 1's frame has data-none and is not drawn, no picture is asked for, and a tap on its answer is taken with no hold, the answer wiping out as soon after the tap as one on question 2 (no pictures) does`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true });
    const page = await ctx.newPage();
    const asked: string[] = [];
    page.on('request', (r) => { if (PIC_URL.test(new URL(r.url()).pathname)) asked.push(new URL(r.url()).pathname); });
    await openQuiz(page, baseURL);
    await quiet(page);
    await page.locator('#qzBegin').tap();
    await onTop(page, 0);
    await settled(page);
    expect(await page.evaluate(() => matchMedia('(min-width: 900px) and (min-height: 600px)').matches), 'not the laptop layout').toBe(false);
    const frame = page.locator('.qz-card[data-i="0"] .qz-pics');
    await expect(frame, 'under 96 px of room above the question').toHaveAttribute('data-none', '');
    await expect(frame).toHaveCSS('display', 'none');
    await recordPics(page);
    const tapOn = async (i: number, k: string) => {
      const o = page.locator(`.qz-card[data-i="${i}"] .qz-opt[data-persona="${k}"]`);
      await o.scrollIntoViewIfNeeded();
      const b = (await o.boundingBox())!;
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    };
    const [p1, p2] = [QUIZ_QUESTIONS[0].answers[2].persona, QUIZ_QUESTIONS[1].answers[2].persona];
    await tapOn(0, p1);
    await onTop(page, 1);
    await ready(page, 1);
    await settled(page);
    await tapOn(1, p2);
    await onTop(page, 2);
    await settled(page);
    await expect(page.locator('.qz-card[data-i="2"] .qz-pics'), 'question 3: no room either').toHaveAttribute('data-none', '');
    const log = await picLog(page);
    expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'both taps taken').toEqual([['quiz_answer', { q: 1, persona: p1 }], ['quiz_answer', { q: 2, persona: p2 }]]);
    await ctx.close();
    const hold = (i: number, k: string) => {
      const down = log.events.find((e) => e.card === i && e.k === k && e.ev === 'pointerdown:touch'), wiped = log.opts.find((o) => o.card === i && o.k === k && o.min < 1 && o.t > (down?.t ?? Infinity));
      expect(down, `question ${i + 1}: the tap`).toBeTruthy();
      expect(wiped, `question ${i + 1}: the answer wipes out`).toBeTruthy();
      return Math.round(wiped!.t - down!.t);
    };
    expect(asked, 'no picture asked for').toEqual([]);
    expect(drawnSteps(log, 0), 'none drawn').toEqual([]);
    const [one, two] = [hold(0, p1), hold(1, p2)];
    expect(two, 'question 2: the 0.32 s hold of any answer').toBeLessThan(200 + 120 + 100);
    expect(one - two, `question 1 (${one} ms) held no longer than question 2 (${two} ms): no picture to wait for`).toBeLessThan(100);
  });
}

test('Pictures on a tall portrait screen under 900 px wide (800 x 1280): the room above question 1 is more than 40% of the screen\'s height, and the frame takes 40% of it (512 px), above the question, under the logotype\'s band, as wide as the question\'s column', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 1280 }, hasTouch: true });
  const page = await ctx.newPage();
  await openQuiz(page, baseURL);
  await page.locator('#qzBegin').tap();
  await onTop(page, 0);
  await settled(page);
  const m = await page.evaluate(() => {
    const c = document.querySelector('.qz-card.is-top')!, f = c.querySelector<HTMLElement>('.qz-pics')!, r = (e: Element) => e.getBoundingClientRect();
    return { wide: matchMedia('(min-width: 900px) and (min-height: 600px)').matches, none: f.hasAttribute('data-none'), frame: [r(f).left, r(f).top, r(f).right, r(f).bottom], first: r(c.querySelector('.qz-count')!).top, col: [r(c).left, r(c).right], h: innerHeight };
  });
  await ctx.close();
  expect(m.wide, 'not the laptop layout').toBe(false);
  expect(m.none, 'room for the picture').toBe(false);
  const [left, top, right, bottom] = m.frame;
  expect(m.first - (56 + 16) - 24, 'the room between the logotype\'s band and the question, less the gap, is over 40% of the height').toBeGreaterThan(0.4 * m.h);
  expect(bottom - top, 'the frame is 40% of the height').toBe(Math.floor(0.4 * m.h));
  expect(top, 'under the logotype\'s band').toBeGreaterThanOrEqual(56 + 16 - 0.5);
  expect(bottom, 'above the question').toBeLessThanOrEqual(m.first + 0.5);
  expect([left, right], 'as wide as the question\'s column (560 px at most, centred)').toEqual([expect.closeTo(m.col[0], 0), expect.closeTo(m.col[1], 0)]);
  expect(m.col, 'the column').toEqual([expect.closeTo((800 - 560) / 2, 0), expect.closeTo(800 - (800 - 560) / 2, 0)]);
});

test('Pictures, a new question opens with none: a picture left on as the question changes (a finger held on an answer of question 3 at 390 x 844 while Back is pressed) is off at once as question 2 is put on screen, and question 3 comes back, question 2 answered, with every picture off from its first frame', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  const k = QUIZ_QUESTIONS[2].answers[5].persona;
  await openQuiz(page, baseURL);
  await page.locator('#qzBegin').tap();
  await ready(page, 0);
  await press(page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]'));
  await ready(page, 1);
  await press(page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]'));
  await onTop(page, 2);
  await settled(page);
  await picsLoaded(page, 2);
  // a finger down on the answer, and held: its picture decodes in and stays (a touch has no pointerleave)
  const cdp = await ctx.newCDPSession(page);
  const b = (await page.locator(`.qz-card[data-i="2"] .qz-opt[data-persona="${k}"]`).boundingBox())!;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
  await expect.poll(async () => (await picNow(page, 2))[k], { message: 'the picture under the finger settles' }).toBe('settled');
  // question 3's pictures drawn, read as question 2 is put on screen (straight after showCard) and in question 3's first
  // frame when it comes back
  await page.evaluate(() => {
    const w = window as unknown as { __qzAtTop: Record<string, string[]> }, c1 = document.querySelector<HTMLElement>('.qz-card[data-i="1"]')!, c2 = document.querySelector<HTMLElement>('.qz-card[data-i="2"]')!;
    const drawn = () => [...c2.querySelectorAll<HTMLElement>('.qz-shot')].filter((l) => l.style.visibility === 'visible' || [...l.children].some((s) => (s as HTMLElement).style.opacity !== '0')).map((l) => l.dataset.persona ?? '');
    w.__qzAtTop = {};
    const watch = (c: HTMLElement, i: number) => {
      const mo = new MutationObserver(() => { if (!c.classList.contains('is-top')) return; mo.disconnect(); w.__qzAtTop[`${i}:now`] = drawn(); requestAnimationFrame(() => { w.__qzAtTop[`${i}:frame`] = drawn(); }); });
      mo.observe(c, { attributes: true, attributeFilter: ['class'] });
    };
    watch(c1, 1); watch(c2, 2);   // question 3 loses is-top first, and is watched until it has it again
  });
  await press(page.locator('.qz-card[data-i="2"] .qz-back'));
  await onTop(page, 1);
  await ready(page, 1);
  await press(page.locator('.qz-card.is-top .qz-opt[data-persona="curator"]'));
  await onTop(page, 2);
  await page.waitForFunction(() => '2:frame' in ((window as unknown as { __qzAtTop: Record<string, string[]> }).__qzAtTop));
  const at = await page.evaluate(() => (window as unknown as { __qzAtTop: Record<string, string[]> }).__qzAtTop);
  expect(at['1:now'], 'question 2 put on screen: question 3\'s picture off at once').toEqual([]);
  expect(at['1:frame'], 'and in question 2\'s first frame').toEqual([]);
  expect(at['2:now'], 'question 3 back: none drawn').toEqual([]);
  expect(at['2:frame'], 'none in its first frame').toEqual([]);
  expect(await picNow(page, 2), 'every picture of question 3 off').toEqual(allOff(2));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  expect((await events(page)).filter(([n]) => n === 'quiz_answer' || n === 'quiz_back'), 'Back and the answers by script only').toEqual([...answered(['curator', 'curator']), ['quiz_back', { q: 3 }], ['quiz_answer', { q: 2, persona: 'curator' }]]);
  await ctx.close();
});

test('Pictures, a press on an answer that turns into a scroll at 390 x 844 (pointerdown, then pointercancel, no click): the picture it showed wipes out, and no answer is taken', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  const k = QUIZ_QUESTIONS[0].answers[6].persona;
  await openQuiz(page, baseURL);
  await quiet(page);
  await page.locator('#qzBegin').tap();
  await onTop(page, 0);
  await settled(page);
  await picsLoaded(page, 0);
  await recordPics(page);
  // a finger down on the answer, moved up 160 px over 8 steps (the page scrolls), and lifted
  const cdp = await ctx.newCDPSession(page);
  const b = (await page.locator(`.qz-card[data-i="0"] .qz-opt[data-persona="${k}"]`).boundingBox())!, x = b.x + b.width / 2, y = b.y + b.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let n = 1; n <= 8; n++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 20 * n }] }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(1500);   // the 0.75 s the picture would take to settle, and more
  const now = await picNow(page, 0);
  const log = await picLog(page);
  const evs = log.events.filter((e) => e.k === k && /^pointer(down|cancel)/.test(e.ev)).map((e) => e.ev);
  expect(evs, 'a press, then cancelled by the scroll').toEqual(['pointerdown:touch', 'pointercancel:touch']);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'no answer taken').toEqual([]);
  expect(await deckState(page), 'question 1 stays').toEqual(only(0));
  await ctx.close();
  expect(now, 'the picture shown at the press wiped out').toEqual(allOff(0));
});

test('Pictures, a tap dropped by the guard at 390 x 844: a touch press on an answer 100 ms after question 1 was put on screen is dropped, not marked and not taken, and leaves no picture on once the pictures have loaded', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  const k = QUIZ_QUESTIONS[0].answers[3].persona;
  await openQuiz(page, baseURL);
  await quiet(page);
  // armed before Begin: 100 ms after question 1 is put on screen, a touch press on the answer (pointerdown, then its click)
  await page.evaluate((k) => {
    const c = document.querySelector<HTMLElement>('.qz-card[data-i="0"]')!, o = c.querySelector<HTMLElement>(`.qz-opt[data-persona="${k}"]`)!;
    const w = window as unknown as { __qzTouch?: { at: number; pressed: boolean; loaded: boolean } };
    const mo = new MutationObserver(() => {
      if (!c.classList.contains('is-top')) return;
      mo.disconnect();
      const t0 = performance.now();
      setTimeout(() => {
        const img = c.querySelector<HTMLImageElement>(`.qz-pic[data-persona="${k}"] img`)!;
        o.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', isPrimary: true, bubbles: true }));
        o.click();
        w.__qzTouch = { at: performance.now() - t0, pressed: o.hasAttribute('aria-pressed'), loaded: img.complete && img.naturalWidth > 0 };
      }, 100);
    });
    mo.observe(c, { attributes: true, attributeFilter: ['class'] });
  }, k);
  await page.locator('#qzBegin').tap();
  const t = await (await page.waitForFunction(() => (window as unknown as { __qzTouch?: unknown }).__qzTouch)).jsonValue() as { at: number; pressed: boolean; loaded: boolean };
  expect(t.at, 'pressed 100 ms after question 1 was put on screen').toBeGreaterThanOrEqual(100);
  expect(t.at, 'inside the guard').toBeLessThan(GUARD);
  expect(t.pressed, 'not marked').toBe(false);
  await settled(page);
  await picsLoaded(page, 0);
  await page.waitForTimeout(1200);
  expect((await events(page)).filter(([n]) => n === 'quiz_answer'), 'not taken').toEqual([]);
  expect(await deckState(page), 'question 1 stays').toEqual(only(0));
  expect(await picNow(page, 0), `the press dropped: no picture on (${t.loaded ? 'its picture had loaded' : 'its picture loaded after the press'})`).toEqual(allOff(0));
  await ctx.close();
});
