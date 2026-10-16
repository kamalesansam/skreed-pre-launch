// Section 3, the quiz (docs/specs/quiz.md AC1, AC6): the scoring resolves every path, the data matches the catalog,
// and the copy keeps the brand rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUIZ_CARDS, QUIZ_COPY, QUIZ_RESULTS, scoreQuiz, resultHref, type Answer } from '../../src/config/quiz.ts';
import { SHADES } from '../../src/config/shades.gen.ts';

const byId = new Map(SHADES.map((s) => [s.id, s]));
const FAMILIES = ['frosty-white', 'blissful-blue', 'playful-pink', 'vivid-violet', 'mellow-yellow', 'basic-brown', 'blushing-coral', 'stormy-grey', 'go-green', 'roaring-red'];

function dist(a: string, b: string): number { let d = 0; for (let i = 0; i < 6; i++) if (a[i] !== b[i]) d++; return d; }
function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const PEARL = lum('#f7f6f3');
const allStrings = (): string[] => {
  const out: string[] = [];
  for (const v of Object.values(QUIZ_COPY)) out.push(typeof v === 'function' ? (v as (...a: never[]) => string)(...(['Mellow Yellow', 11] as never[])) : v);
  for (const c of QUIZ_CARDS) out.push(c.q, c.left.word, c.right.word);
  for (const r of QUIZ_RESULTS) out.push(r.persona, r.tagline, r.text);
  return out;
};

test('ten results, one per family in catalog order, each with a 6-bit signature', () => {
  assert.deepEqual(QUIZ_RESULTS.map((r) => r.family), FAMILIES);
  for (const r of QUIZ_RESULTS) assert.match(r.sig, /^[01]{6}$/, r.family);
});

test('the signatures are pairwise at Hamming distance 2 or more', () => {
  for (let i = 0; i < QUIZ_RESULTS.length; i++) for (let j = i + 1; j < QUIZ_RESULTS.length; j++) {
    assert.ok(dist(QUIZ_RESULTS[i].sig, QUIZ_RESULTS[j].sig) >= 2, `${QUIZ_RESULTS[i].family} and ${QUIZ_RESULTS[j].family}`);
  }
});

test('all 64 answer words resolve, every family is reachable, and the result is deterministic', () => {
  const hits = new Map<string, number>();
  for (let w = 0; w < 64; w++) {
    const answers = [5, 4, 3, 2, 1, 0].map((b) => ((w >> b) & 1) as Answer);
    const r = scoreQuiz(answers), again = scoreQuiz(answers);
    assert.ok(r, `word ${w}`);
    assert.equal(r.family, again.family);
    // the winner is one of the nearest, and the tie rule picks the one that matches the earliest differing card
    const d = (sig: string) => dist(sig, answers.join(''));
    const best = Math.min(...QUIZ_RESULTS.map((x) => d(x.sig)));
    assert.equal(d(r.sig), best, `word ${w}: not a nearest result`);
    hits.set(r.family, (hits.get(r.family) ?? 0) + 1);
  }
  // the paths per family of docs/specs/quiz.md section 5 (a changed signature moves these on purpose)
  assert.deepEqual(Object.fromEntries(FAMILIES.map((f) => [f, hits.get(f) ?? 0])), { 'frosty-white': 10, 'blissful-blue': 6, 'playful-pink': 7, 'vivid-violet': 5, 'mellow-yellow': 10, 'basic-brown': 6, 'blushing-coral': 6, 'stormy-grey': 3, 'go-green': 5, 'roaring-red': 6 });
  assert.equal([...hits.values()].reduce((a, b) => a + b, 0), 64);
});

test('a personality’s own signature returns that personality', () => {
  for (const r of QUIZ_RESULTS) assert.equal(scoreQuiz(r.sig.split('').map(Number) as Answer[]).family, r.family);
});

test('every shade on the cards and in the results is a catalog shade with its name, hex, index and number', () => {
  const refs = [...QUIZ_CARDS.flatMap((c) => [c.left, c.right]), ...QUIZ_RESULTS];
  for (const s of refs) {
    const cat = byId.get(s.shade);
    assert.ok(cat, s.shade);
    assert.equal(s.name, cat.name, s.shade);
    assert.equal(s.hex.toLowerCase(), cat.hex.toLowerCase(), s.shade);
  }
  for (const r of QUIZ_RESULTS) { const cat = byId.get(r.shade)!; assert.equal(r.index, cat.index); assert.equal(r.n, cat.n); assert.equal(cat.family, r.family); }
  assert.equal(resultHref(QUIZ_RESULTS[4]), '/shades/mellow-yellow/?shade=107');
});

test('the card swatches read on Pearl Whisper without a border (contrast 1.5:1 or more); a result shade under 1.5:1 is one of the two ringed in quiz.css, and no other', () => {
  const ratio = (hex: string) => (PEARL + 0.05) / (lum(hex) + 0.05);
  for (const c of QUIZ_CARDS) for (const s of [c.left, c.right]) assert.ok(ratio(s.hex) >= 1.5, `${s.name} ${s.hex}: ${ratio(s.hex).toFixed(2)}:1`);
  // the result swatch is a 160 px circle on the same Pearl: under 1.5:1 it carries the 1 px Urban Slate hairline (the family page's --swr),
  // and the rule in src/styles/quiz.css names exactly the shades that need it
  const css = readFileSync(new URL('../../src/styles/quiz.css', import.meta.url), 'utf8');
  const rule = css.split('\n').find((l) => l.includes('.qz-big[data-shade=') && l.includes('border: 1px solid var(--urban-slate)'));
  assert.ok(rule, 'quiz.css has no hairline ring rule on .qz-big');
  const ringed = [...rule.matchAll(/\.qz-big\[data-shade="([a-z-]+-\d+)"\]/g)].map((m) => m[1]).sort();
  assert.deepEqual(ringed, ['frosty-white-10', 'mellow-yellow-11']);
  const low = QUIZ_RESULTS.filter((r) => ratio(r.hex) < 1.5).map((r) => r.shade).sort();
  assert.deepEqual(low, ringed, `result shades under 1.5:1 on Pearl: ${QUIZ_RESULTS.map((r) => `${r.shade} ${ratio(r.hex).toFixed(2)}:1`).join(', ')}`);
  for (const r of QUIZ_RESULTS) if (!ringed.includes(r.shade)) assert.ok(ratio(r.hex) >= 1.5, `${r.name} ${r.hex}: ${ratio(r.hex).toFixed(2)}:1 without a ring`);
});

test('copy: sentence case headings, no em or en dash, no emoji, no banned words (CLAUDE.md 3, 4, 16, 17)', () => {
  for (const s of allStrings()) {
    assert.doesNotMatch(s, /[–—]/, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, s);
    assert.doesNotMatch(s, /\b(seamless|elevate|unleash|next-level|revolutionary)\b/i, s);
  }
  for (const h of [QUIZ_COPY.h, QUIZ_COPY.own, QUIZ_COPY.gift]) {
    assert.notEqual(h, h.toUpperCase(), `all caps: ${h}`);
    assert.equal(h[0], h[0].toUpperCase());
  }
  for (const c of QUIZ_CARDS) assert.doesNotMatch(c.q, /\d/, 'no digits in a question');
});
