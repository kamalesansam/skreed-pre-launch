// Section 3, the quiz (docs/specs/quiz.md AC1, AC6): the ten questions give every personality one answer each, the
// scoring always resolves and breaks ties the same way, the shade draw covers the group, every shade is a catalog shade,
// the hairline rule matches the catalog, and the copy keeps the brand rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUIZ_COPY, QUIZ_PERSONAS, QUIZ_QUESTIONS, QUIZ_QUESTION_COUNT, needsRing, needsRingNight, pickShade, scoreQuiz, shadeHref, type PersonaId } from '../../src/config/quiz.ts';
import { SHADES } from '../../src/config/shades.gen.ts';

const byId = new Map(SHADES.map((s) => [s.id, s]));
const IDS: PersonaId[] = ['main', 'curator', 'spark', 'optimist', 'rebel', 'dreamer', 'strategist'];
/** Sam's recommended shade per personality, by the catalog's name (his "Navy Blue" is the catalog's Navy) */
const RECOMMENDED: Record<PersonaId, string> = { main: 'Ruby', curator: 'Porcelain', spark: 'Sunflower', optimist: 'Autumn', rebel: 'Ballerina', dreamer: 'Wildberry', strategist: 'Navy' };
const allStrings = (): string[] => {
  const out: string[] = [];
  for (const v of Object.values(QUIZ_COPY)) out.push(typeof v === 'function' ? (v as (...a: never[]) => string)(...(['Mellow Yellow', 11] as never[])) : v);
  for (const q of QUIZ_QUESTIONS) out.push(q.q, ...q.answers.map((a) => a.text));
  for (const p of QUIZ_PERSONAS) out.push(p.name, p.profile, p.palette);
  return out;
};

test('seven personalities in Sam\'s order, each with a finish and a group of six or seven catalog shades led by his recommendation', () => {
  assert.deepEqual(QUIZ_PERSONAS.map((p) => p.id), IDS);
  for (const p of QUIZ_PERSONAS) {
    assert.match(p.finish, /^(gloss|matte)$/, p.id);
    assert.ok(p.shades.length >= 6 && p.shades.length <= 7, `${p.id}: ${p.shades.length} shades`);
    assert.equal(new Set(p.shades).size, p.shades.length, `${p.id}: a shade twice`);
    for (const id of p.shades) assert.ok(byId.has(id), `${p.id}: ${id} is not a catalog shade`);
    assert.equal(byId.get(p.shades[0])!.name, RECOMMENDED[p.id], `${p.id}: the first shade is Sam's recommendation`);
  }
});

test('ten questions, each with seven answers that give every personality exactly one, in a mixed order', () => {
  assert.equal(QUIZ_QUESTIONS.length, QUIZ_QUESTION_COUNT);
  assert.equal(QUIZ_QUESTION_COUNT, 10);
  for (const [i, q] of QUIZ_QUESTIONS.entries()) {
    assert.equal(q.answers.length, 7, q.q);
    assert.deepEqual([...q.answers.map((a) => a.persona)].sort(), [...IDS].sort(), q.q);
    assert.notDeepEqual(q.answers.map((a) => a.persona), IDS, `question ${i + 1} shows the answers in Sam's listing order`);
  }
  // the first answer on the card is not always the same personality
  assert.ok(new Set(QUIZ_QUESTIONS.map((q) => q.answers[0].persona)).size >= 5);
  assert.deepEqual(QUIZ_QUESTIONS.map((q) => q.visual), [true, false, true, false, true, false, false, true, true, false]);
});

test('the most-picked personality wins, and a tie goes to the tied personality picked most recently', () => {
  for (const id of IDS) assert.equal(scoreQuiz(Array(10).fill(id)).id, id);
  // a plurality of four
  assert.equal(scoreQuiz(['spark', 'spark', 'spark', 'spark', 'main', 'main', 'main', 'curator', 'curator', 'dreamer']).id, 'spark');
  // three-three tie between main and curator: curator was picked last among them
  assert.equal(scoreQuiz(['main', 'curator', 'main', 'curator', 'main', 'curator', 'spark', 'optimist', 'rebel', 'dreamer']).id, 'curator');
  // main, curator and spark two each, the rest one each: of the three tied at two, spark was picked last
  assert.equal(scoreQuiz(['main', 'curator', 'spark', 'optimist', 'rebel', 'dreamer', 'strategist', 'main', 'curator', 'spark']).id, 'spark');
  assert.throws(() => scoreQuiz(['main']), /10 answers expected/);
  // deterministic over a sample of random answer sets
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 500; k++) { const a = Array.from({ length: 10 }, () => IDS[Math.floor(rnd() * 7)]); assert.equal(scoreQuiz(a).id, scoreQuiz([...a]).id); }
});

test('the shade draw: any shade of the group can come up, the others are the compatible ones in their order', () => {
  for (const p of QUIZ_PERSONAS) {
    const seen = new Set<string>();
    for (let k = 0; k < p.shades.length; k++) {
      const { shade, others } = pickShade(p, () => (k + 0.5) / p.shades.length);
      seen.add(shade);
      assert.equal(others.length, p.shades.length - 1);
      assert.ok(!others.includes(shade));
      assert.deepEqual(others, p.shades.filter((s) => s !== shade));
    }
    assert.equal(seen.size, p.shades.length, `${p.id}: every shade reachable`);
    assert.equal(pickShade(p, () => 0).shade, p.shades[0]);
    assert.equal(pickShade(p, () => 0.9999999).shade, p.shades[p.shades.length - 1]);
  }
});

test('the family link carries the three-digit catalog number, and the hairline goes on exactly the shades under 1.5:1 on Pearl', () => {
  assert.equal(shadeHref('frosty-white', 10), '/shades/frosty-white/?shade=010');
  assert.equal(shadeHref('mellow-yellow', 107), '/shades/mellow-yellow/?shade=107');
  const ringed = [...new Set(QUIZ_PERSONAS.flatMap((p) => p.shades))].filter((id) => needsRing(byId.get(id)!.hex));
  // the near-whites, the pale yellows and the palest pastel: Porcelain, Almond, Powder, Linen, Sunflower, Mimosa, Bumblebee, Daffodil, Pale Violet
  assert.deepEqual(ringed.sort(), ['basic-brown-01', 'blissful-blue-03', 'frosty-white-10', 'frosty-white-20', 'mellow-yellow-10', 'mellow-yellow-11', 'mellow-yellow-15', 'mellow-yellow-20', 'vivid-violet-02']);
  // the CSS carries the generic rule the component's data-ring relies on
  const css = readFileSync(new URL('../../src/styles/quiz.css', import.meta.url), 'utf8');
  assert.match(css, /\.qz-big\[data-ring\][^{]*\{[^}]*border: 1px solid var\(--urban-slate\)/);
});

test('on the night ground (the poster tier) the dark shades under 3:1 against --night take a Pearl hairline instead, and the pale ones none (review 2026-10-19)', () => {
  const night = [...new Set(QUIZ_PERSONAS.flatMap((p) => p.shades))].filter((id) => needsRingNight(byId.get(id)!.hex));
  // Burgundy, Claret, Wine, Midnight, Sapphire, Chestnut, Fig, Pine, Navy, Prussian
  assert.deepEqual(night.sort(), ['basic-brown-20', 'blissful-blue-15', 'blissful-blue-21', 'blissful-blue-22', 'blissful-blue-24', 'go-green-21', 'roaring-red-15', 'roaring-red-21', 'roaring-red-23', 'vivid-violet-16']);
  const css = readFileSync(new URL('../../src/styles/quiz.css', import.meta.url), 'utf8');
  assert.match(css, /html:not\(\.hero3d\) \.qz-big\[data-ring\], html:not\(\.hero3d\) \.qz-mini-sw\[data-ring\] \{ border: 0; \}/);
  assert.match(css, /html:not\(\.hero3d\) \.qz-big\[data-ring-night\], html:not\(\.hero3d\) \.qz-mini-sw\[data-ring-night\] \{ border: 1px solid var\(--pearl-whisper\); \}/);
});

test('copy: sentence case headings, no em or en dash, no emoji, no banned words, no digits in a question (CLAUDE.md 3, 4, 16, 17)', () => {
  for (const s of allStrings()) {
    assert.doesNotMatch(s, /[–—]/, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, s);
    assert.doesNotMatch(s, /\b(seamless|elevate|unleash|next-level|revolutionary)\b/i, s);
  }
  for (const h of [QUIZ_COPY.h, QUIZ_COPY.own, QUIZ_COPY.gift, ...QUIZ_QUESTIONS.map((q) => q.q)]) {
    assert.notEqual(h, h.toUpperCase(), `all caps: ${h}`);
    assert.equal(h[0], h[0].toUpperCase(), h);
  }
  for (const q of QUIZ_QUESTIONS) assert.doesNotMatch(q.q, /\d/, `a digit in a question: ${q.q}`);
  // the gate's control (quiz-gate.md 3): Sam's "rskip quiz" in sentence case, read into the rules above with the rest of QUIZ_COPY
  assert.equal(QUIZ_COPY.skip, 'Skip quiz');
  assert.ok(allStrings().includes(QUIZ_COPY.skip));
  // no invented counts on the result (Sam, 2026-10-16: the confidence and rarity figures stay out)
  for (const p of QUIZ_PERSONAS) assert.doesNotMatch(`${p.profile} ${p.palette}`, /%|Top \d/, p.id);
});
