// The cue's words, "Scroll to see more" (docs/specs/scroll-cue.md; acceptance 1, 4, 5 and 7 where a source can carry them):
// the pin's rule walked over the scroll map, the copy, and the markup and CSS the browser rows rely on.
// Since the redesign (docs/specs/redesign.md D2, D3 and D15; 2026-11-09) the landing page no longer mounts the old
// hero's cue (components/hero/ScrollCue.astro, boot.ts, shell.css, the countdown's inline script, the pin's rule in
// scripts/hero/scroll/cue-words.ts). Those files stay on disk, unmounted and unedited (D2), and every assertion this
// file held of them still holds, so none was retired: the rows that read them are named "the old landing's" and keep
// that source as it was (the redesign's criterion 12). The redesigned landing's own cue, the same words at the hero's
// foot, has a row named for it, and a line each in the constants' row (its 8 px edge) and the chrome's row (its face,
// and the countdown's on its new slide). The family page's rows, the copy row and the Plex capitals preload on both
// pages are as they were.
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
  y: screens * VH, vh: VH, restMs: CUE.stillMs, tp: Math.min(1, Math.max(0, (screens - S2T.PULL) / S2T.WIPE)), s2ready: true, cueOff: screens * VH > CUE.top, locked: false,
  quizBelow: () => true, pageBelow: () => true, ...o,
});
/** the places by the scroll map (halved on 2026-11-02, section-2.md 14), never literal screens */
const { PULL, WIPE, W1END, LAND, W2, W2END } = S2T, MID = (W1END + LAND) / 2;

test('the constants: 1.5 s of rest, and the chevrons\' 8 px edge, which the family page shares', () => {
  assert.equal(CUE.stillMs, 1500);
  assert.equal(CUE.top, 8);
  assert.equal(CUE.fadeMs, 500, 'the words\' fade, the stylesheets\' .5s');
  assert.ok(CUE.stillMs > CUE.fadeMs, 'the rest outlasts the fade: the pin place is dropped before the words can come back at the top (ride.ts, D10)');
  assert.equal(CUE_STILL_MS, CUE.stillMs, 'the family page\'s own copy (timing.ts), so grid mode loads no chunk shared with the island');
  assert.doesNotMatch(read('src/scripts/family/page.ts'), /config\/cue/, 'the family page module never imports the landing\'s config');
  assert.match(read('src/inline/countdown.inline.js'), /scrollY>8\|\|/, 'the old landing\'s chevrons hide past 8 px (its inline script, unmounted since 2026-11-09)');
  // the redesigned landing's edge is the same 8 px, a literal of its own in the hero's script (docs/specs/redesign.md D15)
  assert.equal(Number(read('src/scripts/redesign/hero.ts').match(/^const CUE_OFF = (\d+);$/m)?.[1]), CUE.top, 'the redesigned landing\'s cue hides past 8 px');
  assert.match(read('src/scripts/family/page.ts'), /if \(scrollY > 8\) H\.setAttribute\('data-scrolled', ''\)/, 'the family columns hide past 8 px');
});

// (the four rows of the pin are the old landing's rule, scripts/hero/scroll/cue-words.ts over the hero's scroll map: the
// redesigned page has no pin, and its cue stands at the hero's foot alone; named so on 2026-11-09, no assertion changed)
test('the old landing\'s pin: on at rest in the pull-back, at both ends of the first wipe, in the cascade and at the gems\' rest', () => {
  for (const s of [0.05, PULL / 2, PULL * 0.6, PULL, W1END, MID, LAND - 0.2, LAND, LAND + 0.3, W2 - 0.05, W2]) assert.equal(cueWordsOn(at(s)), true, `${s} screens`);
});

test('the old landing\'s pin: off at the top, while moving, across the first wipe, from the second wipe on, while section 2 builds, with the quiz in view', () => {
  assert.equal(cueWordsOn(at(0)), false, 'at 0 the words follow the chevrons (shell.css), not this rule');
  assert.equal(cueWordsOn(at(8 / VH)), false, 'at 8 px still the chevrons\' top');
  assert.equal(cueWordsOn(at(PULL / 2, { restMs: CUE.stillMs - 1 })), false, 'not yet rested');
  assert.equal(cueWordsOn(at(PULL + WIPE / 2, { tp: 0.5 })), false, 'the first wipe crossing');
  assert.equal(cueWordsOn(at(PULL + 0.02 * WIPE, { tp: 0.02 })), false, 'past the wipe\'s rest tolerance');
  assert.equal(cueWordsOn(at(S2T.PULL, { tp: REST_EPS / 2 })), true, 'the wipe\'s rest within the tolerance');
  assert.equal(cueWordsOn(at(S2T.W2 + 0.05)), false, 'the second wipe');
  for (const s of [W2 + WIPE / 2, W2END, W2END + 1, W2END + 3]) assert.equal(cueWordsOn(at(s)), false, `${s} screens`);
  assert.equal(cueWordsOn(at(W1END + 0.5, { s2ready: false })), false, 'held at the pull-back\'s end while section 2 builds, and after it has failed (the wipe opens on black there, where neither tone reads)');
  assert.equal(cueWordsOn(at(PULL / 2, { s2ready: false })), true, 'the pull-back itself does not wait for section 2');
  assert.equal(cueWordsOn(at(LAND + 0.3, { quizBelow: () => false })), false, 'the quiz\'s section in view (phones whose bars have collapsed)');
  assert.equal(cueWordsOn(at(PULL / 2, { vh: 0 })), false);
});

test('the old landing\'s top: the chevrons speak there, unless they stay hidden at rest with the page going on below', () => {
  assert.equal(cueWordsOn(at(0, { cueOff: false })), false, 'chevrons shown: the words follow them by CSS');
  assert.equal(cueWordsOn(at(0, { cueOff: true })), true, 'chevrons stuck off after a jump the followers reach late');
  assert.equal(cueWordsOn(at(0, { cueOff: true, restMs: CUE.stillMs - 1 })), false, 'not before the rest');
  assert.equal(cueWordsOn(at(0, { cueOff: true, pageBelow: () => false })), false, 'nothing below (a one-screen document): the chevrons alone');
  assert.equal(cueWordsOn(at(0, { cueOff: true, locked: true })), false, 'the loader and the intro lock the page: off, whatever the document says');
  assert.equal(cueWordsOn(at(PULL / 2, { locked: true })), false, 'locked in the pin too (a jump the loader lands on)');
  assert.equal(cueWordsOn(at(8 / VH, { cueOff: true })), true, 'at 8 px still the top');
  let reads = 0;
  const count = () => { reads++; return true; };
  cueWordsOn(at(0, { cueOff: false, pageBelow: count }));
  cueWordsOn(at(0, { cueOff: true, restMs: 0, pageBelow: count }));
  cueWordsOn(at(PULL / 2, { pageBelow: count }));
  cueWordsOn(at(0, { cueOff: true, locked: true, pageBelow: count }));
  assert.equal(reads, 0, 'the document is measured only at the top, at rest, with the chevrons off, and never under the lock (a read kept from there, where the track is collapsed, would say nothing is below until the scroll position next changes)');
});

test('the old landing\'s pin: the quiz is read last, only when everything else holds (one layout read per rest, CHECKLIST C3)', () => {
  let reads = 0;
  const q = () => { reads++; return true; };
  cueWordsOn(at(0, { quizBelow: q }));
  cueWordsOn(at(PULL / 2, { restMs: 0, quizBelow: q }));
  cueWordsOn(at(PULL + WIPE / 2, { tp: 0.5, quizBelow: q }));
  cueWordsOn(at(W2END + 0.3, { quizBelow: q }));
  assert.equal(reads, 0);
  cueWordsOn(at(MID, { quizBelow: q }));
  assert.equal(reads, 1);
});

test('copy: the brief\'s words on both pages, sentence case, no end stop, no dash, no emoji, no buzzword, no arrow', () => {
  for (const s of [COPY.cue.label, FAM_COPY.scrollMore]) {
    assert.equal(s, 'Scroll down to see more');   // "Scroll down" since 2026-11-06 (the site review of 2026-11-05)
    assert.doesNotMatch(s, /\u2014|\u2013|\p{Extended_Pictographic}|[\u2190-\u21ff]|[.!]$/u);
    assert.doesNotMatch(s, /seamless|elevate|unleash|next-level|revolutionary/i);
  }
});

test('the old landing\'s markup (ScrollCue.astro and boot.ts, kept on disk and mounted by no page since 2026-11-09): the words follow the chevrons as their next sibling, aria-hidden, from the config', () => {
  const astro = read('src/components/hero/ScrollCue.astro');
  assert.match(astro, /<div class="scrollcue" id="cue" aria-hidden="true" set:html=\{svg\} \/>\}\n\{part === 'cue' && <p class="cuetext" id="cueText" aria-hidden="true">\{COPY\.cue\.label\}<\/p>\}/);
  assert.match(read('src/scripts/boot.ts'), /more: \$\('cueText'\)/);
});

test('the redesigned landing\'s cue (docs/specs/redesign.md D15, E-cue-text carried over; 2026-11-09): the same words from the config at the hero\'s foot with the chevrons, aria-hidden, in Plex Mono capitals, hidden past 8 px by opacity and visibility alone', () => {
  const astro = read('src/components/redesign/Hero.astro');
  assert.match(astro, /<div class="rd-hero-cue" aria-hidden="true">\s*<p class="rd-hero-cue-text">\{COPY\.cue\.label\}<\/p>\s*<svg class="rd-hero-cue-chev"[^>]*aria-hidden="true" focusable="false">/, 'the words over the chevrons, both out of the accessibility tree');
  assert.doesNotMatch(astro, /Scroll down|Scroll to see/, 'the words are the config\'s, never typed into the component');
  const js = read('src/scripts/redesign/hero.ts');
  assert.match(js, /cue\?\.classList\.toggle\('is-off', \w+ > CUE_OFF\)/, 'hidden past the edge, back at the top');
  const css = read('src/styles/rd-hero.css');
  const text = css.match(/\n\.rd-hero-cue-text \{([^}]*)\}/)?.[1] ?? '';
  assert.ok(text.includes('font: 500 var(--fs-label)/1 var(--font-mono); text-transform: uppercase; letter-spacing: 0;'), 'IBM Plex Mono Medium in capitals at the label size (E-chrome-font)');
  const off = css.match(/\n\.rd-hero-cue\.is-off \{([^}]*)\}/)?.[1] ?? '';
  const fade = `opacity ${CUE.fadeMs / 1000}s`;   // 0.5s, the words' fade on every page (CUE.fadeMs)
  assert.ok(off.includes('opacity: 0; visibility: hidden;') && off.includes(`transition: ${fade} `) && off.includes(`visibility 0s ${CUE.fadeMs / 1000}s`), 'the fade out, then hidden');
  let rules = 0;
  for (const m of css.matchAll(/\.rd-hero-cue[^{,]*\{([^}]*)\}/g)) {
    rules++;
    assert.doesNotMatch(m[1], /text-shadow|box-shadow|background|border|letter-spacing:(?!\s*0)|text-transform:(?!\s*uppercase)/, m[0]);
    for (const t of m[1].matchAll(/transition:([^;}]+)/g)) for (const part of t[1].replace(/\([^)]*\)/g, '()').split(',')) assert.ok(['opacity', 'visibility'].includes(part.trim().split(/\s+/)[0]), part);
  }
  assert.ok(rules >= 4, `${rules} rules read`);
});

test('the old landing\'s CSS (shell.css, kept on disk and loaded by no page since 2026-11-09): Plex Mono capitals at the label size, in the corner, hidden with them, opacity and visibility only', () => {
  const css = read('src/styles/shell.css');
  const base = css.match(/\n\.cuetext\{([^}]*)\}/)![1];
  assert.ok(base.includes('font:500 var(--fs-label)/1 var(--font-mono);text-transform:uppercase;letter-spacing:0'), 'IBM Plex Mono Medium in capitals (E-chrome-font)');
  assert.ok(base.includes('right:calc(var(--inset) + env(safe-area-inset-right,0px));bottom:calc(var(--inset) + env(safe-area-inset-bottom,0px))'), 'the bottom right corner at the top at every width, and in the pin above 1100 px');
  assert.ok(css.includes('@media (max-width:767px){.cuetext{font-size:11px}}'), 'small on phones (Sam, 2026-11-03)');
  assert.ok(css.includes('@media (max-width:1100px){.cuetext[data-at="pin"]{right:auto;left:calc(var(--inset) + env(safe-area-inset-left,0px));bottom:calc(var(--inset) + env(safe-area-inset-bottom,0px))}.cuetext[data-at="pin"]:not(.is-on){opacity:0;visibility:hidden;transition:opacity .5s cubic-bezier(.333,0,.667,1),visibility 0s .5s}}'), 'up to 1100 px in the pin: the bottom left corner, keyed on the place alone, and hidden while the place is held without the words being on, so they leave the corner hidden (D10); the bottom left corner');
  assert.ok(css.includes('@media (max-width:1100px){.copy{padding-bottom:calc(var(--inset) + 84px + env(safe-area-inset-bottom,0px))}}'), 'the countdown lifts for the column (73) and 11 px');
  assert.ok(!css.includes('.intro.po~.cuetext'), 'no forced show over the loader poster state: the words follow is-off there');
  assert.match(css, /\.scrollcue\.is-off~\.cuetext:not\(\.is-on\),html\.loading \.cuetext,html\.uh3 \.cuetext\{opacity:0;visibility:hidden;/);
  const fade = `opacity ${String(CUE.fadeMs / 1000).replace(/^0\./, '.')}s`;   // .5s: the ride holds the pin place this long after the words go off (CUE.fadeMs)
  assert.ok(base.includes(`transition:${fade} `), 'the fade in');
  assert.equal([...css.matchAll(/[^{}]*\.cuetext[^{]*\{[^}]*visibility 0s \.5s\}/g)].length, 2, 'the fade out of the words: with the chevrons, and while the pin place is held');
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
  assert.ok(css.includes('html.cue-tight .cuetext.is-land { left: auto; right: calc(4% + 18.25px + env(safe-area-inset-right, 0px)); transform: none; white-space: normal; max-width: 8ch; font-size: 11px; line-height: 1.2; text-align: right; }'), 'where the case reaches the line the words keep to the arrows, beside the right column in three short lines (2026-11-06)');
  assert.ok(css.includes('white-space: normal; max-width: 11ch; text-align: right; line-height: 1.2; }'), 'the story line in two lines on phones, SCROLL DOWN over TO SEE MORE, in the dark corner (D6)');
  assert.ok(css.includes('.cuetext.is-story { bottom: calc(var(--inset) + var(--sab)); white-space: nowrap; max-width: none; line-height: 1; }'), 'one line on the wide layout');
  assert.doesNotMatch(css, /prefers-reduced-motion/, 'the full motion for every visitor since 2026-11-04 (E-3D-only): no instant branch');
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
  assert.match(read('src/scripts/family/page.ts'), /if \(sizeKey !== fitKey\) \{[^\n]*\n\s+fitKey = sizeKey;\n[^\n]*\n\s+if \(landLine\) H\.classList\.toggle\('cue-tight'/, 'the clearance is read once per size, never on a shade change (CHECKLIST C3)');
});

test('the family page\'s CSS: every .cuetext transition is opacity and visibility only (or none under reduced motion)', () => {
  const css = read('src/styles/family.css');
  let rules = 0;
  for (const m of css.matchAll(/\.cuetext[^{]*\{([^}]*)\}/g)) {
    rules++;
    assert.doesNotMatch(m[1], /animation|text-shadow|box-shadow|background|border|letter-spacing:(?!\s*0)|text-transform:(?!\s*uppercase)/, m[0]);
    for (const t of m[1].matchAll(/transition:([^;}]+)/g)) for (const part of t[1].replace(/\([^)]*\)/g, '()').split(',')) assert.ok(['opacity', 'visibility', 'none'].includes(part.trim().split(/\s+/)[0]), part);
  }
  assert.ok(rules >= 4, `${rules} rules read`);
  assert.ok(css.includes('transition: opacity 0.5s cubic-bezier(0.333, 0, 0.667, 1), visibility 0s 0.5s;') || css.includes('transition: opacity .5s'), 'the words\' fade is the landing\'s 0.5 s (CUE.fadeMs)');
});

test('the chrome\'s small words in IBM Plex Mono Medium capitals (E-chrome-font): Back to top, All families, Back to main page, the countdown\'s eyebrow and labels, the words', () => {
  const PLEX = 'font-family: var(--font-mono); font-size: var(--fs-label); font-weight: 500; line-height: 1; text-transform: uppercase; letter-spacing: 0;';
  assert.ok(read('src/styles/tokens.css').includes('--font-mono: "IBM Plex Mono", ui-monospace, monospace;'));
  assert.ok(read('src/styles/to-top.css').includes(PLEX), 'Back to top');
  const fam = read('src/styles/family.css');
  assert.equal(fam.split(PLEX).length - 1, 3, 'All families, Back to main page and the words');
  assert.ok(fam.includes('.cuetext { position: fixed; z-index: 2; font-family: var(--font-mono); font-size: var(--fs-label); font-weight: 500; line-height: 1; text-transform: uppercase; letter-spacing: 0;'), 'the family page\'s words');
  // the countdown's eyebrow and unit labels: on the old landing's sheet (kept on disk, loaded by no page since 2026-11-09) ...
  const shell = read('src/styles/shell.css');
  assert.ok(shell.includes('.copy .eyebrow{font-family:var(--font-mono);font-size:.875rem;font-weight:500;text-transform:uppercase;letter-spacing:0;'), 'Launch in');
  assert.ok(shell.includes('.count .l{font-family:var(--font-mono);font-weight:500;font-size:.875rem;text-transform:uppercase;letter-spacing:0;'), 'days, hours, minutes, seconds');
  // ... and on the redesigned landing's slide, where the countdown stands now (docs/specs/redesign.md D7 and D13; 2026-11-09).
  // Since D20 the slide's eyebrow holds the PDF's COMING SOON mark and no words of "Launch in"; its rule stays for what the
  // element says with no mark in it, the no-JavaScript date and the live line at zero, so the row reads it under that name
  const launch = read('src/styles/rd-launch.css');
  for (const [sel, what] of [['.rd-launch .eyebrow', 'the no-JavaScript date and the live line at zero'], ['.rd-launch .count .l', 'days, hours, minutes, seconds']] as const) {
    const rule = launch.split('\n').find((l) => l.startsWith(`${sel} {`)) ?? '';
    assert.ok(/font-family: var\(--font-mono\); font-weight: 500;/.test(rule) && /text-transform: uppercase; letter-spacing: 0;/.test(rule), `${what} on the redesigned landing: ${rule}`);
  }
  assert.ok(read('src/styles/rd-hero.css').includes('.rd-hero-cue-text { font: 500 var(--fs-label)/1 var(--font-mono); text-transform: uppercase; letter-spacing: 0;'), 'the redesigned landing\'s words');
  // drawn in capitals, every glyph of these words is in the capitals file the pages preload (U+0020, digits, A to Z)
  for (const s of [COPY.cue.label, FAM_COPY.scrollMore, FAM_COPY.allFamilies, FAM_COPY.backHome, COPY.toTop.label, 'Launch in', 'days', 'hours', 'minutes', 'seconds']) assert.match(s.toUpperCase(), /^[ 0-9A-Z]+$/, s);
  for (const page of ['src/pages/index.astro', 'src/pages/shades/[family].astro']) assert.ok(read(page).includes("'/fonts/ibm-plex-mono-500-caps.woff2'"), `${page} preloads the capitals file`);
});
