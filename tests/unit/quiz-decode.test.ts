// Section 3 as plain text on the fog (docs/specs/quiz.md 4; Sam, 2026-10-19): the quiz's decode keeps section 2's label
// animation (labels.ts) to the number, every character the quiz can draw (its copy, upper-cased, and every glyph the
// roll passes through) is in the two IBM Plex Mono files, and nothing in the section draws a box.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HIDE, REDUCED, REVEAL_ALPHA, REVEAL_ROLL, ROLL_STEPS, roll } from '../../src/scripts/quiz/decode.ts';
import { QUIZ_COPY, QUIZ_PERSONAS, QUIZ_QUESTIONS } from '../../src/config/quiz.ts';
import { SHADES } from '../../src/config/shades.gen.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const labels = read('src/scripts/hero/section2/labels.ts'), decode = read('src/scripts/quiz/decode.ts');

test('the decode keeps section 2\'s timings: 0.4 s alpha wipe, 0.75 s roll through 5.753 steps, 0.2 s hide, 0.2 s reduced fade', () => {
  assert.match(labels, /const u = Math\.min\(1, t \/ 0\.4\), v = Math\.min\(1, t \/ 0\.75\);/);
  assert.match(labels, /11 \* u - 10 \* x/);
  assert.match(labels, /Math\.max\(0, Math\.min\(1, 2 \* v - x\)\), g = roll\(c\.ch, Math\.floor\(\(1 - tr\) \* 5\.753\) % 8\)/);
  assert.match(labels, /if \(t >= 0\.75\) L\.settled = true;/);
  assert.match(labels, /const u = Math\.min\(1, t \/ 0\.2\);[\s\S]*11 \* \(1 - u\) - 10 \* xs\(i\)/);
  assert.match(labels, /if \(REDUCE\) \{ const a = Math\.min\(1, t \/ 0\.2\)/);
  assert.deepEqual([REVEAL_ALPHA, REVEAL_ROLL, ROLL_STEPS, HIDE, REDUCED], [0.4, 0.75, 5.753, 0.2, 0.2]);
  // the same formulas, with the constants named
  assert.match(decode, /clamp\(11 \* u - 10 \* x\)/);
  assert.match(decode, /Math\.floor\(\(1 - clamp\(2 \* v - x\)\) \* ROLL_STEPS\) % 8/);
  assert.match(decode, /clamp\(11 \* \(1 - u\) - 10 \* xs\(i\)\)/);
});

test('the roll is labels.ts\'s on printable ASCII and leaves anything else as it is', () => {
  const body = /const roll = \(ch: string, k: number\) => \{ (.*?) \};\n/.exec(labels)?.[1];
  assert.ok(body, 'labels.ts roll found');
  const theirs = new Function('ch', 'k', body!) as (ch: string, k: number) => string;
  for (let c = 32; c <= 126; c++) for (let k = 0; k < 8; k++) assert.equal(roll(String.fromCharCode(c), k), theirs(String.fromCharCode(c), k), `${String.fromCharCode(c)} ${k}`);
  for (const ch of ['’', '‘', '“', '”', ' ', '…']) for (let k = 0; k < 8; k++) assert.equal(roll(ch, k), ch);
});

test('every character the quiz draws, and every glyph its roll passes through, is in the two Plex Mono files', () => {
  const css = read('src/styles/fonts.css');
  const ranges = [...css.matchAll(/font-family: "IBM Plex Mono";[^}]*unicode-range: ([^;]+);/g)].flatMap((m) => m[1].split(',').map((r) => r.trim()));
  assert.equal(ranges.length > 3, true, 'two Plex faces with their ranges');
  const covered = (cp: number) => ranges.some((r) => { const [a, b] = r.replace('U+', '').split('-').map((h) => parseInt(h, 16)); return cp >= a && cp <= (b ?? a); });
  // Plex Mono has no U+201B or U+201F (scripts/fonts/manifest.txt); the range names them but the roll never draws them
  const missing = new Set([0x201b, 0x201f]);
  const strings: string[] = [];
  for (const v of Object.values(QUIZ_COPY)) strings.push(typeof v === 'function' ? (v as (...a: never[]) => string)(...(['Mellow Yellow', 11] as never[])) : v);
  for (const n of [1, 10]) strings.push(QUIZ_COPY.count(n), QUIZ_COPY.fam('Frosty White', n));
  for (const q of QUIZ_QUESTIONS) strings.push(q.q, ...q.answers.map((a) => a.text));
  for (const p of QUIZ_PERSONAS) strings.push(p.name, p.profile, p.palette, QUIZ_COPY.finish(p.finish));
  const names = new Set(QUIZ_PERSONAS.flatMap((p) => p.shades));
  for (const s of SHADES) if (names.has(s.id)) strings.push(`${s.name}.`, s.name);
  for (const s of strings) for (const ch of s.toUpperCase()) {
    const cp = ch.codePointAt(0)!;
    assert.ok(covered(cp) && !missing.has(cp), `"${ch}" (U+${cp.toString(16)}) in "${s}" is not in the Plex files`);
    for (let k = 0; k < 8; k++) { const g = roll(ch, k).codePointAt(0)!; assert.ok(covered(g) && !missing.has(g), `roll("${ch}", ${k}) = U+${g.toString(16)} is not in the Plex files`); }
  }
});

test('no boxes: no panel, no fill, no shadow; the controls are words (Sam, 2026-10-19)', () => {
  const css = read('src/styles/quiz.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/background(?:-color)?:\s*([^;}]+)/g)) assert.match(m[1].trim(), /^(none|transparent)$/, `a fill in quiz.css: ${m[0]}`);
  assert.doesNotMatch(css, /box-shadow|text-shadow|backdrop-filter|filter:/);
  // borders: the swatch hairline, the email field's underline and the focus ring's inner line only
  for (const m of css.matchAll(/([^{}]+)\{([^}]*\bborder(?:-bottom)?(?:-width)?:(?!\s*0\b)\s*[^;}]+)/g)) {
    assert.match(m[1].trim(), /data-ring|\.qz-input|focus-visible/, `a border in quiz.css: ${m[1].trim()}`);
  }
  const astro = read('src/components/quiz/Quiz.astro');
  assert.doesNotMatch(astro, /qz-panel|class="btn|txtbtn/);
  assert.match(css, /\.quiz \{[^}]*font: 500 var\(--qz-fs\) \/ 1\.45 var\(--qz-font\); text-transform: uppercase; letter-spacing: 0/);
  assert.match(css, /--qz-font: "IBM Plex Mono", ui-monospace, monospace/);
  assert.match(css, /color: var\(--pearl-whisper\)/);
  // the deck no longer flies the card off; each change of screen is the decode
  const deck = read('src/scripts/quiz/deck.ts');
  assert.doesNotMatch(deck, /rotate\(|translateX/);
  assert.match(deck, /createDecoder/);
});
