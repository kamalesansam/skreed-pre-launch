// The cue's words, "Scroll to see more" (docs/specs/scroll-cue.md; acceptance 1, 4, 5 and 7 where a source can carry them):
// the pin's rule walked over the scroll map, the copy, and the markup and CSS the browser rows rely on.
//   node --test tests/unit/scroll-cue.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CUE } from '../../src/config/cue.ts';
import { COPY } from '../../src/config/copy.ts';
import { S2T } from '../../src/config/hero.ts';
import { FAM_COPY } from '../../src/scripts/family/copy.ts';
import { CUE_STILL_MS } from '../../src/scripts/family/timing.ts';
import { cueWordsOn, REST_EPS, type CueWordsIn } from '../../src/scripts/hero/scroll/cue-words.ts';
import { landClear } from '../../src/scripts/family/cue.ts';
import { solve } from '../../src/scripts/family/three/pose.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const VH = 844;
/** the page at rest at `screens`, its first wipe settled to the matching end, section 2 built, the quiz below */
const at = (screens: number, o: Partial<CueWordsIn> = {}): CueWordsIn => ({
  y: screens * VH, vh: VH, restMs: CUE.stillMs, tp: Math.min(1, Math.max(0, screens - S2T.PULL)), s2ready: true, cueOff: screens * VH > CUE.top,
  quizBelow: () => true, pageBelow: () => true, ...o,
});

test('the constants: 1.5 s of rest, and the chevrons\' 8 px edge, which the family page shares', () => {
  assert.equal(CUE.stillMs, 1500);
  assert.equal(CUE.top, 8);
  assert.equal(CUE_STILL_MS, CUE.stillMs, 'the family page\'s own copy (timing.ts), so grid mode loads no chunk shared with the island');
  assert.doesNotMatch(read('src/scripts/family/page.ts'), /config\/cue/, 'the family page module never imports the landing\'s config');
  assert.match(read('src/inline/countdown.inline.js'), /scrollY>8\|\|/, 'the landing\'s chevrons hide past 8 px');
  assert.match(read('src/scripts/family/page.ts'), /if \(scrollY > 8\) H\.setAttribute\('data-scrolled', ''\)/, 'the family columns hide past 8 px');
});

test('the pin: on at rest in the pull-back, at both ends of the first wipe, in the cascade and at the gems\' rest', () => {
  for (const s of [0.05, 1, 3, S2T.PULL, S2T.W1END, 8, 10, 12.7, S2T.LAND, 14.8, S2T.W2]) assert.equal(cueWordsOn(at(s)), true, `${s} screens`);
});

test('the pin: off at the top, while moving, across the first wipe, from the second wipe on, while section 2 builds, with the quiz in view', () => {
  assert.equal(cueWordsOn(at(0)), false, 'at 0 the words follow the chevrons (shell.css), not this rule');
  assert.equal(cueWordsOn(at(8 / VH)), false, 'at 8 px still the chevrons\' top');
  assert.equal(cueWordsOn(at(1, { restMs: CUE.stillMs - 1 })), false, 'not yet rested');
  assert.equal(cueWordsOn(at(5.5, { tp: 0.5 })), false, 'the first wipe crossing');
  assert.equal(cueWordsOn(at(5.02, { tp: 0.02 })), false, 'past the wipe\'s rest tolerance');
  assert.equal(cueWordsOn(at(S2T.PULL, { tp: REST_EPS / 2 })), true, 'the wipe\'s rest within the tolerance');
  assert.equal(cueWordsOn(at(S2T.W2 + 0.05)), false, 'the second wipe');
  for (const s of [15.7, 16.2, 17.2, 20]) assert.equal(cueWordsOn(at(s)), false, `${s} screens`);
  assert.equal(cueWordsOn(at(8, { s2ready: false })), false, 'held at the pull-back\'s end while section 2 builds');
  assert.equal(cueWordsOn(at(3, { s2ready: false })), true, 'the pull-back itself does not wait for section 2');
  assert.equal(cueWordsOn(at(14.8, { quizBelow: () => false })), false, 'the quiz\'s section in view (phones whose bars have collapsed)');
  assert.equal(cueWordsOn(at(1, { vh: 0 })), false);
});

test('the top: the chevrons speak there, unless they stay hidden at rest with the page going on below', () => {
  assert.equal(cueWordsOn(at(0, { cueOff: false })), false, 'chevrons shown: the words follow them by CSS');
  assert.equal(cueWordsOn(at(0, { cueOff: true })), true, 'chevrons stuck off after a jump the followers reach late');
  assert.equal(cueWordsOn(at(0, { cueOff: true, restMs: CUE.stillMs - 1 })), false, 'not before the rest');
  assert.equal(cueWordsOn(at(0, { cueOff: true, pageBelow: () => false })), false, 'the loader and the intro lock the page: nothing below');
  assert.equal(cueWordsOn(at(8 / VH, { cueOff: true })), true, 'at 8 px still the top');
  let reads = 0;
  const count = () => { reads++; return true; };
  cueWordsOn(at(0, { cueOff: false, pageBelow: count }));
  cueWordsOn(at(0, { cueOff: true, restMs: 0, pageBelow: count }));
  cueWordsOn(at(3, { pageBelow: count }));
  assert.equal(reads, 0, 'the document is measured only at the top, at rest, with the chevrons off');
});

test('the pin: the quiz is read last, only when everything else holds (one layout read per rest, CHECKLIST C3)', () => {
  let reads = 0;
  const q = () => { reads++; return true; };
  cueWordsOn(at(0, { quizBelow: q }));
  cueWordsOn(at(1, { restMs: 0, quizBelow: q }));
  cueWordsOn(at(5.5, { tp: 0.5, quizBelow: q }));
  cueWordsOn(at(16, { quizBelow: q }));
  assert.equal(reads, 0);
  cueWordsOn(at(10, { quizBelow: q }));
  assert.equal(reads, 1);
});

test('copy: the brief\'s words on both pages, sentence case, no end stop, no dash, no emoji, no buzzword, no arrow', () => {
  for (const s of [COPY.cue.label, FAM_COPY.scrollMore]) {
    assert.equal(s, 'Scroll to see more');
    assert.doesNotMatch(s, /\u2014|\u2013|\p{Extended_Pictographic}|[\u2190-\u21ff]|[.!]$/u);
    assert.doesNotMatch(s, /seamless|elevate|unleash|next-level|revolutionary/i);
  }
});

test('the landing\'s markup: the words follow the chevrons as their next sibling, aria-hidden, from the config', () => {
  const astro = read('src/components/hero/ScrollCue.astro');
  assert.match(astro, /<div class="scrollcue" id="cue" aria-hidden="true" set:html=\{svg\} \/>\}\n\{part === 'cue' && <p class="cuetext" id="cueText" aria-hidden="true">\{COPY\.cue\.label\}<\/p>\}/);
  assert.match(read('src/scripts/boot.ts'), /more: \$\('cueText'\)/);
});

test('the landing\'s CSS: Plex Mono capitals at the label size, in the corner or over the chevrons, hidden with them, opacity and visibility only', () => {
  const css = read('src/styles/shell.css');
  const base = css.match(/\n\.cuetext\{([^}]*)\}/)![1];
  assert.ok(base.includes('font:500 var(--fs-label)/1 var(--font-mono);text-transform:uppercase;letter-spacing:0'), 'IBM Plex Mono Medium in capitals (E-chrome-font)');
  assert.ok(base.includes('right:calc(var(--inset) + env(safe-area-inset-right,0px));bottom:calc(var(--inset) + env(safe-area-inset-bottom,0px))'), 'above 1100 px the bottom right corner, at the top and in the pin');
  assert.ok(css.includes('@media (max-width:1100px){.cuetext{right:auto;left:50%;bottom:calc(var(--inset) + 73px + var(--s1) + env(safe-area-inset-bottom,0px));transform:translateX(-50%)}'), 'up to 1100 px centred a --s1 over the 73 px column at the top');
  assert.ok(css.includes('.scrollcue.is-off~.cuetext[data-at="pin"]{left:calc(var(--inset) + env(safe-area-inset-left,0px));bottom:calc(var(--inset) + env(safe-area-inset-bottom,0px));transform:none}}'), 'up to 1100 px in the pin: the bottom left corner');
  assert.ok(css.includes('@media (max-width:1100px){.copy{padding-bottom:calc(var(--inset) + 106px + env(safe-area-inset-bottom,0px))}}'), 'the countdown lifts for the column (73), the words over it (8 and 14) and 11 px');
  assert.ok(!css.includes('.intro.po~.cuetext'), 'no forced show over the loader poster state: the words follow is-off there');
  assert.match(css, /\.scrollcue\.is-off~\.cuetext:not\(\.is-on\),html\.loading \.cuetext,html\.uh3 \.cuetext\{opacity:0;visibility:hidden;/);
  assert.match(css, /,html:not\(\.js\) \.cuetext\{display:none\}/, 'without JavaScript, as the chevrons');
  for (const m of css.matchAll(/\.cuetext[^{]*\{([^}]*)\}/g)) {
    assert.doesNotMatch(m[1], /animation|text-shadow|box-shadow|background|border|letter-spacing:[^0]|text-transform:(?!uppercase)/, m[0]);
    for (const t of m[1].matchAll(/transition:([^;}]+)/g)) for (const part of t[1].replace(/\([^)]*\)/g, '()').split(',')) assert.ok(['opacity', 'visibility'].includes(part.trim().split(/\s+/)[0]), part);
  }
});

test('the family page\'s markup and CSS: two lines, the first screen\'s with the columns, the story\'s at rest and never on the argument screen', () => {
  const astro = read('src/components/family/FamilyCue.astro');
  assert.match(astro, /<p class="cuetext is-land" aria-hidden="true">\{FAM_COPY\.scrollMore\}<\/p><p class="cuetext is-story" aria-hidden="true">\{FAM_COPY\.scrollMore\}<\/p>/);
  const css = read('src/styles/family.css');
  assert.match(css, /html:not\(\.m3d\) \.scrollcue \{ opacity: 0; visibility: hidden; \}/, 'grid mode is one screen: no columns');
  const show = css.match(/\n(html\.m3d[^{]*\.cuetext\.is-story) \{/)![1];
  assert.match(show, /html\.m3d:not\(\.loading\):not\(\.hud-off\):not\(\[data-scrolled\]\) \.cuetext\.is-land/);
  assert.match(show, /html\.m3d:not\(\.loading\):not\(\.hud-off\)\[data-still\] \.cuetext\.is-land/);
  assert.ok(show.endsWith('html.m3d:not(.loading).hud-off[data-still]:not(.arg-on) .cuetext.is-story'), 'the story line: at rest, after the loader, never on the argument screen');
  assert.ok(css.includes('html.cue-tight .cuetext.is-land { display: none; }'), 'the first screen line stands down where it would meet the front case');
  assert.ok(css.includes('white-space: normal; max-width: 9ch; text-align: right; line-height: 1.2; }'), 'the story line in two lines on phones, SCROLL TO over SEE MORE, in the dark corner (D6)');
  assert.ok(css.includes('.cuetext.is-story { bottom: calc(var(--inset) + var(--sab)); white-space: nowrap; max-width: none; line-height: 1; }'), 'one line on the wide layout');
  assert.match(css, /\.press, [^}]*\.scrollcue, \.cuetext \{ transition: none; \}/, 'instant under reduced motion');
  assert.match(css, /@media \(max-height: 499px\) \{[^\n]*\.cuetext\.is-land \{ display: none; \}/, 'no first-screen line on a short screen');
  const page = read('src/scripts/family/page.ts');
  assert.match(page, /H\.removeAttribute\('data-still'\);\n  clearTimeout\(stillT\);\n  stillT = window\.setTimeout\(\(\) => H\.setAttribute\('data-still', ''\), CUE_STILL_MS\);/);
  assert.match(page, /if \(scrollY > 8\) H\.setAttribute\('data-scrolled', ''\); else H\.removeAttribute\('data-scrolled'\);\n  stillCheck\(\);/);
});

test('the family first screen line clears the front case or stands down (cue.ts over pose.ts solve, the page own fit)', () => {
  const [mw, mh, md] = (JSON.parse(read('src/data/case-model.json')) as { sizeMm: [number, number, number] }).sizeMm;
  const dims = { w: +(mw / mh).toFixed(4), d: +(md / mh).toFixed(4) };   // as FamilyPage.astro builds them
  const clears = (w: number, h: number, sab = 0) => landClear(solve(w, h, 'phone', dims).caseBottom, h, 204 + sab);
  for (const [w, h] of [[390, 844], [430, 932], [360, 780], [412, 915], [375, 667], [390, 664]] as const) assert.equal(clears(w, h), true, `${w} x ${h}`);
  for (const [w, h, sab] of [[375, 553, 0], [360, 584, 0], [390, 600, 0], [390, 750, 34]] as const) assert.equal(clears(w, h, sab), false, `${w} x ${h}, inset ${sab}`);
  assert.equal(landClear(500, 844, 204), true);
  assert.equal(landClear(623, 844, 204), false, 'the gap is 4 px: this is 3 px short');
  assert.equal(landClear(622, 844, 204), true);
  assert.ok(read('src/scripts/family/page.ts').includes("H.classList.toggle('cue-tight', cls === 'phone' && !landClear(fit.caseBottom, Hh, parseFloat(getComputedStyle(landLine).bottom) || 0));"));
});

test('the chrome\'s small words in IBM Plex Mono Medium capitals (E-chrome-font): Back to top, All families, Back to main page, the countdown\'s eyebrow and labels, the words', () => {
  const PLEX = 'font-family: var(--font-mono); font-size: var(--fs-label); font-weight: 500; line-height: 1; text-transform: uppercase; letter-spacing: 0;';
  assert.ok(read('src/styles/tokens.css').includes('--font-mono: "IBM Plex Mono", ui-monospace, monospace;'));
  assert.ok(read('src/styles/to-top.css').includes(PLEX), 'Back to top');
  const fam = read('src/styles/family.css');
  assert.equal(fam.split(PLEX).length - 1, 3, 'All families, Back to main page and the words');
  assert.ok(fam.includes('.cuetext { position: fixed; z-index: 2; font-family: var(--font-mono); font-size: var(--fs-label); font-weight: 500; line-height: 1; text-transform: uppercase; letter-spacing: 0;'), 'the family page\'s words');
  const shell = read('src/styles/shell.css');
  assert.ok(shell.includes('.copy .eyebrow{font-family:var(--font-mono);font-size:.875rem;font-weight:500;text-transform:uppercase;letter-spacing:0;'), 'Launch in');
  assert.ok(shell.includes('.count .l{font-family:var(--font-mono);font-weight:500;font-size:.875rem;text-transform:uppercase;letter-spacing:0;'), 'days, hours, minutes, seconds');
  // drawn in capitals, every glyph of these words is in the capitals file the pages preload (U+0020, digits, A to Z)
  for (const s of [COPY.cue.label, FAM_COPY.scrollMore, FAM_COPY.allFamilies, FAM_COPY.backHome, COPY.toTop.label, 'Launch in', 'days', 'hours', 'minutes', 'seconds']) assert.match(s.toUpperCase(), /^[ 0-9A-Z]+$/, s);
  for (const page of ['src/pages/index.astro', 'src/pages/shades/[family].astro']) assert.ok(read(page).includes("'/fonts/ibm-plex-mono-500-caps.woff2'"), `${page} preloads the capitals file`);
});
