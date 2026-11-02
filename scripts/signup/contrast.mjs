// Section 5's contrast, as Sam's picture of 2026-11-02 (docs/specs/section-5.md): every line is a flat colour on the flat
// ground (SIGNUP_GROUND; the falloff behind the jars is never behind a line), so the ratios are computed, not sampled.
// Reads the colours from src/styles/signup.css and the ground from src/config/signup-ground.ts, and prints a Markdown
// table (WCAG 2 contrast, the AA line for the text's size) for docs/specs/evidence/section-5-contrast.md.
//   node scripts/signup/contrast.mjs
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/styles/signup.css', import.meta.url), 'utf8');
const ground = readFileSync(new URL('../../src/config/signup-ground.ts', import.meta.url), 'utf8').match(/SIGNUP_GROUND = '(#[0-9A-Fa-f]{6})'/)?.[1];
if (!ground) throw new Error('SIGNUP_GROUND not found');
const token = (name) => { const m = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`)); if (!m) throw new Error(`--${name} not in signup.css`); return m[1]; };
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// the lines, their colour token and whether they are large text (24 px and up, or 18.66 px bold) at their smallest
const LINES = [
  ['YOU’VE MADE IT / THIS FAR.', 'su-ink', true],
  ['Sub-line', 'su-sub', false],
  ['Sub-line, the bold run', 'su-sub-b', false],
  ['EVERY FOLLOW FILLS THE JAR', 'su-every', false],
  ['Worth labels', 'su-worth', false],
  ['GOT YOUR COLOURS?', 'su-ink', false],
  ['Grey lines', 'su-grey', false],
  ['Placeholder', 'su-ph', false],
  ['Typed text', 'su-typed', false],
  ['Footer', 'su-foot', false],
  ['Field outline (non-text, 3:1)', 'su-field', 'ui'],
];
console.log(`| Line | Colour | On ${ground} | AA |`);
console.log('| --- | --- | --- | --- |');
for (const [name, tok, large] of LINES) {
  const c = token(tok), r = ratio(c, ground), need = large === 'ui' || large === true ? 3 : 4.5;
  console.log(`| ${name} | ${c} | ${r.toFixed(2)}:1 | ${r >= need ? 'passes' : `below ${need}:1`} |`);
}
const btn = ratio('#FFFFFF', '#000000');
console.log(`| SAVE MY DISCOUNTS (white on the black button) | #FFFFFF on #000000 | ${btn.toFixed(2)}:1 | passes |`);
