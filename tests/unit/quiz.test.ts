// Section 3, the quiz (docs/specs/quiz.md AC1, AC6): the ten questions give every personality one answer each, the
// scoring always resolves and breaks ties the same way, the shade draw covers the group, every shade is a catalog shade,
// the hairline rule matches the catalog, and the copy keeps the brand rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUIZ_COPY, QUIZ_PERSONAS, QUIZ_QUESTIONS, QUIZ_QUESTION_COUNT, luminance, pickShade, scoreQuiz, shadeHref, type PersonaId } from '../../src/config/quiz.ts';
import { chipInk, chipRim, resultTones } from '../../src/config/quiz-tones.ts';
import { hexToOklab } from '../../src/scripts/family/tint.ts';
import { SHADES } from '../../src/config/shades.gen.ts';

const byId = new Map(SHADES.map((s) => [s.id, s]));
const IDS: PersonaId[] = ['main', 'curator', 'spark', 'optimist', 'rebel', 'dreamer', 'strategist'];
/** Sam's recommended shade per personality, by the catalog's name (his "Navy Blue" is the catalog's Navy) */
const RECOMMENDED: Record<PersonaId, string> = { main: 'Ruby', curator: 'Porcelain', spark: 'Sunflower', optimist: 'Autumn', rebel: 'Ballerina', dreamer: 'Wildberry', strategist: 'Navy' };
const allStrings = (): string[] => {
  const out: string[] = [];
  for (const v of Object.values(QUIZ_COPY)) out.push(...(Array.isArray(v) ? (v as readonly string[]) : [typeof v === 'function' ? (v as (...a: never[]) => string)(...(['Mellow Yellow', 11] as never[])) : (v as string)]));
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

test('the family link carries the three-digit catalog number', () => {
  assert.equal(shadeHref('frosty-white', 10), '/shades/frosty-white/?shade=010');
  assert.equal(shadeHref('mellow-yellow', 107), '/shades/mellow-yellow/?shade=107');
});

test('the result\'s tones (E-S3-result; Sam, 2026-11-02: "dynamic to all the colors that we got"): every quiz shade gives its own deep ground, a lighter band, a lighter layer for its name and the stroke\'s edge and ridge, Pearl Whisper reads AA on the ground and the band, each chip\'s name takes the better of --night and Pearl Whisper, and the darkest chips and strokes a Pearl hairline', () => {
  const ratio = (a: string, b: string) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const L = (h: string) => hexToOklab(h)[0];
  const ids = [...new Set(QUIZ_PERSONAS.flatMap((p) => p.shades))];
  for (const id of ids) {
    const hex = byId.get(id)!.hex, t = resultTones(hex);
    for (const v of Object.values(t)) assert.match(v, /^#[0-9a-f]{6}$/, `${id}: ${v}`);
    assert.ok(L(t.deep) <= 0.275, `${id}: the ground is deep (${t.deep}; OKLab 0.27 and the hex's rounding)`);
    assert.ok(L(t.band) > L(t.deep) && L(t.mid) > L(t.band), `${id}: the band a step over the ground, the name's layer over the band`);
    assert.ok(L(t.dark) < L(hex) + 1e-3 && L(t.light) >= L(hex) - 1e-3, `${id}: the stroke's edge darker, its ridge lighter`);
    assert.ok(ratio('#f7f6f3', t.deep) >= 4.5 && ratio('#f7f6f3', t.band) >= 4.5, `${id}: Pearl Whisper on the ground and the band, AA`);
    assert.ok(L(t.light) >= 0.415, `${id}: the stroke's ridge at 0.42 at the least, so a dark shade's stroke shows on its ground`);
    // the chip's name, on the chip as Sam's reference sets it, in the better of --night and Pearl Whisper
    const ink = chipInk(hex) === 'night' ? '#050506' : '#f7f6f3', other = ink === '#050506' ? '#f7f6f3' : '#050506';
    assert.ok(ratio(hex, ink) >= ratio(hex, other), `${id}: the chip's name in the better ink`);
    assert.ok(ratio(hex, ink) >= 4.39, `${id}: the chip's name at 4.4:1 at the least (${ratio(hex, ink).toFixed(2)})`);
  }
  // the two under AA's 4.5 (no ink of the brand's reaches it on them): Fuchsia 4.43 and Teal 4.40
  assert.deepEqual(ids.filter((id) => { const h = byId.get(id)!.hex; return Math.max(ratio(h, '#050506'), ratio(h, '#f7f6f3')) < 4.5; }).map((id) => byId.get(id)!.name).sort(), ['Fuchsia', 'Teal']);
  // Burgundy, Wine, Midnight, Sapphire, Chestnut, Fig, Pine, Navy, Prussian: under 1.5:1 against the lightest ground
  assert.deepEqual(ids.filter((id) => chipRim(byId.get(id)!.hex)).sort(), ['basic-brown-20', 'blissful-blue-15', 'blissful-blue-21', 'blissful-blue-22', 'blissful-blue-24', 'go-green-21', 'roaring-red-21', 'roaring-red-23', 'vivid-violet-16']);
  const css = readFileSync(new URL('../../src/styles/quiz.css', import.meta.url), 'utf8');
  assert.match(css, /\.qz-mini\[data-rim\] \{ border: 1px solid var\(--pearl-whisper\); \}/);
  // every chip's name on the chip in its ink, and the darkest strokes outlined
  assert.match(css, /\.qz-mini \{ --qz-ink: var\(--night\);[^}]*color: var\(--qz-ink\);/);
  assert.match(css, /\.qz-mini\[data-ink="pearl"\] \{ --qz-ink: var\(--pearl-whisper\); \}/);
  assert.doesNotMatch(css, /qz-sm-|data-sm-rim/, 'the stroke of 2026-11-02 is gone: the paint is a relief image in every build (make-smear.py), so no fill or hairline for it');
  // the component writes every chip's tones and deck.ts copies the drawn shade's onto the section
  const astro = readFileSync(new URL('../../src/components/quiz/Quiz.astro', import.meta.url), 'utf8');
  for (const a of ['data-ink={s.ink}', 'data-deep={s.tones.deep}', 'data-band={s.tones.band}', 'data-mid={s.tones.mid}', 'data-sd={s.tones.dark}', 'data-sl={s.tones.light}']) assert.ok(astro.includes(a), a);
  const deck = readFileSync(new URL('../../src/scripts/quiz/deck.ts', import.meta.url), 'utf8');
  for (const k of ['--qz-deep', '--qz-band', '--qz-mid', '--qz-sd', '--qz-sl']) assert.ok(deck.includes(`'${k}'`), k);
});

test('copy: sentence case headings, no em or en dash, no emoji, no banned words, no digits in a question (CLAUDE.md 3, 4, 16, 17)', () => {
  for (const s of allStrings()) {
    assert.doesNotMatch(s, /[–—]/, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, s);
    assert.doesNotMatch(s, /\b(seamless|elevate|unleash|next-level|revolutionary)\b/i, s);
  }
  for (const h of [QUIZ_COPY.h, QUIZ_COPY.eyebrow, QUIZ_COPY.toGift, QUIZ_COPY.toResult, ...QUIZ_QUESTIONS.map((q) => q.q)]) {
    assert.notEqual(h, h.toUpperCase(), `all caps: ${h}`);
    assert.equal(h[0], h[0].toUpperCase(), h);
  }
  for (const q of QUIZ_QUESTIONS) assert.doesNotMatch(q.q, /\d/, `a digit in a question: ${q.q}`);
  // the gate's control (quiz-gate.md 3): Sam's "rskip quiz" in sentence case, read into the rules above with the rest of QUIZ_COPY
  assert.equal(QUIZ_COPY.skip, 'Skip quiz');
  assert.ok(allStrings().includes(QUIZ_COPY.skip));
  // the offer is Sam's reference of 2026-11-02 word for word, its middle in bold (E-S3-result)
  assert.equal(`${QUIZ_COPY.offerLead} ${QUIZ_COPY.offerStrong} ${QUIZ_COPY.offerTail}`, 'Get an exclusive launch discount on any Skreed product in your signature shade or any other shade you love!');
  assert.equal(QUIZ_COPY.send, 'Send my code');
  // no invented counts on the result (Sam, 2026-10-16: the confidence and rarity figures stay out)
  for (const p of QUIZ_PERSONAS) assert.doesNotMatch(`${p.profile} ${p.palette}`, /%|Top \d/, p.id);
});
