// Round 4 (docs/specs/family-page.md 22, D7; acceptance 1, 2, 4 and 6 of that section) and round 5 (section 23, B, D4
// and D5; its criteria 5, 6 and 7): "Back to main page" on the argument screen, everything a browser is not needed for:
// the route's markup read from source, the stylesheet's rules (phone first: on Back to top's row with Back to top's
// offsets; the wide layout centred as round 4 built it), the page module's wiring, backTimer (the 5.6 boundary, 2,499
// and 2,500 ms, the cancel, the re-arrival, dueMs) and backFade (the two curves equal to --ease-standard and --ease-in,
// null under reduced motion). The browser rows are specs/back.spec.ts; section 13's step 3, the landing's return path the
// control depends on (D4), is return-path.test.ts.
//   node --test tests/family/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { backFade, backTimer } from '../../src/scripts/family/back.ts';
import { BACK_DELAY_MS, BACK_IN_MS, BACK_OUT_MS } from '../../src/scripts/family/timing.ts';
import { SV } from '../../src/scripts/family/three/pose.ts';
import { FAM_COPY } from '../../src/scripts/family/copy.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const OFF = { since: null, show: false, dueMs: null };

test('the route: one a#famBack.fam-back.ring2.press to /#families, hidden at render, the copy id, after Back to top as the last element, 3D builds only', () => {
  const route = read('src/pages/shades/[family].astro');
  const lines = route.split('\n');
  const k = lines.findIndex((l) => l.includes('id="famBack"'));
  assert.ok(k >= 0, 'the route carries #famBack');
  assert.equal(lines[k].trim(), '{has3d && <a class="fam-back ring2 press" id="famBack" href="/#families" hidden>{FAM_COPY.backHome}</a>}');
  assert.equal(route.split('famBack').length - 1, 1, 'one element');
  assert.ok(lines[k - 1].includes('<BackToTop page="family" />'), 'directly after Back to top, so Tab reaches it last');
  assert.equal(lines.slice(k + 1).join('\n').trim(), '</Base>', 'the body\'s last element');
  assert.doesNotMatch(lines[k], /aria-label|data-|<svg|style=/, 'no aria-label, no icon, no data state, no style attribute');
  assert.match(route, /const has3d = mode !== 'off';/, 'has3d folds at build time: an off build renders nothing');
  assert.equal(FAM_COPY.backHome, 'Back to main page');
});

const WIDE_Q = '@media (min-width: 900px) and (min-height: 600px) {\n';
/** One declaration of a rule body, by name (a name preceded by a hyphen, as in min-width or safe-area-inset-right, does not count). */
const decl = (rule: string, name: string) => rule.match(new RegExp(`(?:^|;)\\s*${name}: ([^;]+);`, 'm'))?.[1];

test('the stylesheet: .fam-back fixed at z-index 4 after .allfam, set as "All families" is, no transition, no underline; off outside 3D mode; phone first on Back to top\'s row with Back to top\'s offsets (section 23, D5), the box shrunk to its words; centred by the margins in the wide block alone, one --inset above the safe area (round 4, as built)', () => {
  const css = read('src/styles/family.css');
  const toTop = read('src/styles/to-top.css');
  const rule = css.match(/^\.fam-back \{([^}]*)\}/m)?.[1] ?? '';
  assert.ok(rule, 'one base .fam-back rule');
  assert.equal((css.match(/^\.fam-back \{/gm) ?? []).length, 1, 'the base rule once; the wide block carries the other');
  assert.ok(css.indexOf('.allfam {') < css.indexOf('.fam-back {') && css.indexOf('.ring2 {') < css.indexOf('.fam-back {'), 'declared after .allfam and .ring2, so position: fixed wins');
  for (const d of ['position: fixed', 'z-index: 4', 'min-height: var(--hit)', 'padding: 0 var(--s2)', 'display: inline-flex', 'align-items: center', 'font-size: var(--fs-label)', 'font-weight: 600', 'line-height: 1', 'white-space: nowrap', 'color: var(--pearl-whisper)', 'text-decoration: none']) {
    assert.ok(rule.includes(d), `.fam-back: ${d}`);
  }
  assert.doesNotMatch(rule, /transition|transform|opacity|box-shadow|border|background/, 'no transition (the fade is the Web Animations API), no transform (.press owns it), no box');
  assert.match(css, /html:not\(\.m3d\) \.beats, html:not\(\.m3d\) \.beatnav, html:not\(\.m3d\) #tint, html:not\(\.m3d\) \.arg, html:not\(\.m3d\) \.fam-back \{ display: none; \}/, 'swatch grid mode has no control (D3)');
  assert.match(css, /\[hidden\] \{ display: none !important; \}/, 'hidden is display: none, which no transition can start from');

  // "follows" (criterion 5, D5): the phone rule's offsets are Back to top's own expressions, so a change to --to-top-bottom
  // or --inset moves both controls together. Back to top's rule is read from to-top.css, never retyped here
  const tt = toTop.match(/^\.to-top\[data-page="family"\] \{([^}]*)\}/m)?.[1] ?? '';
  const ttBottom = decl(tt, 'bottom'), ttRight = decl(tt, 'right');
  assert.equal(ttBottom, 'calc(var(--to-top-bottom) + env(safe-area-inset-bottom, 0px))', 'Back to top\'s row');
  assert.equal(ttRight, 'calc(var(--inset) + env(safe-area-inset-right, 0px) - var(--s2))', 'Back to top\'s right: the chevron ends at --inset');
  assert.equal(decl(css.slice(0, css.indexOf('.fam-back {')), '--sab'), 'env(safe-area-inset-bottom, 0px)', 'the family page\'s --sab is the bottom safe area');
  assert.equal(decl(rule, 'bottom'), ttBottom!.replace('env(safe-area-inset-bottom, 0px)', 'var(--sab)'), 'the same row as Back to top (its family expression, with --sab for the safe area)');
  assert.equal(decl(rule, 'left'), ttRight!.replace('safe-area-inset-right', 'safe-area-inset-left'), 'the mirror of Back to top\'s right: the words start at --inset, where the wordmark does');
  for (const n of ['right', 'width', 'margin-inline', 'top', 'height']) assert.equal(decl(rule, n), undefined, `${n} is not set on the phone layout: right auto, so the box shrinks to its words; the height is the 44 px row`);
  assert.doesNotMatch(rule, /--hit\) \+ var\(--s1\)/, 'round 4\'s row above Back to top is gone');

  // the wide layout: round 4's centring, moved whole into the wide block, so 900 x 600 and up are exactly as built
  const wide = css.slice(css.indexOf(WIDE_Q));
  const block = wide.slice(0, wide.indexOf('\n}'));
  assert.ok(block.includes('.fam-back { left: 0; right: 0; width: max-content; margin-inline: auto; bottom: calc(var(--inset) + var(--sab)); }'), 'the wide layout: centred by the margins, one --inset above the safe area');
  assert.equal(css.split('margin-inline: auto').length - 1, 1, 'the centring is written once');
  assert.ok(css.indexOf('margin-inline: auto') > css.indexOf(WIDE_Q), 'and only inside the wide block');
  assert.equal((css.match(/^\s*\.fam-back \{/gm) ?? []).length, 2, 'two rules of its own for the control: the phone layout and the wide block (the grid-mode list is a third selector)');

  // rule 15: Back to top's bottom offset is one token, used by its own row and by this control's (iteration 2, item 4)
  assert.match(toTop, /^:root \{ --to-top-bottom: 14px; \}/m, 'the token, defined where Back to top is styled (both pages load it)');
  assert.match(toTop, /\.to-top\[data-page="family"\] \{[^}]*bottom: calc\(var\(--to-top-bottom\) \+ env\(safe-area-inset-bottom, 0px\)\);/, 'Back to top stands on it');
  assert.equal(((toTop + css).match(/\b14px\b/g) ?? []).length, 1, 'the number is written once, as the token');
});

test('the phone row\'s arithmetic (section 23, the table): the row, the boxes and the gap at every phone size follow from the stylesheets\' constants, and the two boxes never meet', () => {
  const css = read('src/styles/family.css'), toTop = read('src/styles/to-top.css'), tokens = read('src/styles/tokens.css');
  // the constants, read from the stylesheets
  const px = (s: string | undefined) => { assert.ok(s, 'constant read'); return parseFloat(s!); };
  const inset = tokens.match(/--inset: clamp\((\d+)px, ([\d.]+)vw, (\d+)px\)/)!;
  const INSET = (w: number) => Math.min(+inset[3], Math.max(+inset[1], +inset[2] / 100 * w));
  const S2 = px(tokens.match(/--s2: (\d+)px/)?.[1]), S1 = px(tokens.match(/--s1: (\d+)px/)?.[1]);
  const HIT = px(css.match(/--hit: (\d+)px/)?.[1]), BOTTOM = px(toTop.match(/--to-top-bottom: (\d+)px/)?.[1]);
  const CHEVRON = px(toTop.match(/\.to-top svg \{[^}]*width: ([\d.]+)px/)?.[1]);
  assert.match(toTop, /\.to-top \{[^}]*gap: var\(--s1\);[^}]*min-height: 44px;[^}]*padding: 0 var\(--s2\);/, 'Back to top: the --s1 gap before its chevron, the 44 px row, --s2 of padding each side');
  assert.equal(HIT, 44); assert.equal(BOTTOM, 14); assert.equal(S2, 12); assert.equal(S1, 8); assert.equal(CHEVRON, 17.5);
  // the words' widths at Open Sans 600, 14 px, from the shipped font's advance widths (section 23: 124.3 and 76.5 px; the browser measures them with kerning)
  const WORDS_BACK = 124.3, WORDS_TOP = 76.5;
  const row = (w: number, h: number) => {
    const i = INSET(w);
    const top = h - BOTTOM - HIT, bottom = h - BOTTOM;                              // both boxes: bottom = --to-top-bottom + 0 safe area, 44 px tall
    const back = { x: i - S2, r: i - S2 + S2 + WORDS_BACK + S2, words: i };         // left = --inset - --s2; padding, the words, padding
    const tt = { r: w - (i - S2), x: w - (i - S2) - (S2 + WORDS_TOP + S1 + CHEVRON + S2), words: w - (i - S2) - S2 - CHEVRON - S1 - WORDS_TOP, chevronEnd: w - i };
    return { inset: i, top, bottom, back, tt, apart: tt.x - back.r };
  };
  const near = (a: number, b: number, msg: string) => assert.ok(Math.abs(a - b) < 0.06, `${msg}: ${a} against ${b}`);
  // the table of section 23 ("The phone row at the other sizes"), one row each. Its "apart" column reads 0.1 px more than
  // its own edges give at the four narrow sizes (230.0 less 152.3 is 77.7, not 77.8): the arithmetic's values stand here
  const TABLE: [number, number, number, number, number, number, number, number][] = [
    // w, h, --inset, row top, back x, back r, to-top x, apart
    [360, 780, 16, 722, 4, 152.3, 230, 77.7],
    [375, 667, 16, 609, 4, 152.3, 245, 92.7],
    [390, 844, 16, 786, 4, 152.3, 260, 107.7],
    [430, 932, 16, 874, 4, 152.3, 300, 147.7],
    [768, 1024, 26.88, 966, 14.88, 163.18, 627.12, 463.94],
    [780, 360, 27.3, 302, 15.3, 163.6, 638.7, 475.1],
    [844, 390, 29.54, 332, 17.54, 165.84, 700.46, 534.62],
  ];
  for (const [w, h, i, top, bx, br, tx, apart] of TABLE) {
    const r = row(w, h);
    near(r.inset, i, `${w}: --inset`);
    assert.equal(r.top, top, `${w}: the row's top`); assert.equal(r.bottom, h - 14, `${w}: 14 px above the bottom`);
    near(r.back.x, bx, `${w}: the control's left edge`); near(r.back.r, br, `${w}: the control's right edge`);
    near(r.tt.x, tx, `${w}: Back to top's left edge`); near(r.tt.r, w - (r.inset - S2), `${w}: Back to top's right edge`);
    near(r.apart, apart, `${w}: the boxes apart`);
    assert.ok(r.apart >= 48, `${w}: 48 px or more between the two hit boxes (criterion 5)`);
    assert.equal(r.back.words, r.inset, `${w}: the words start at --inset, as the wordmark does`);
    assert.equal(r.tt.chevronEnd, w - r.inset, `${w}: the chevron ends at --inset, as "All families" does`);
  }
  // round 4's centred control on the same row would have touched Back to top at 360 (D4, "Ruled out")
  const c = row(360, 780);
  assert.ok((360 + (c.back.r - c.back.x)) / 2 > c.tt.x, 'centred on Back to top\'s row, the control\'s box would meet Back to top\'s at 360 x 780');
  // the wide layout's row at 1280 x 800 (criterion 6): bottom one --inset above the bottom edge
  near(800 - INSET(1280) - HIT, 711.2, '1280 x 800: the hit row\'s top'); near(800 - INSET(1280), 755.2, '1280 x 800: its bottom');
});

test('the page module: the controller after argument.show in onScroll, hidden at once on fam:grid, family_back on click with the link left to the browser, the hook', () => {
  const page = read('src/scripts/family/page.ts');
  assert.match(page, /import \{ backFade, backTimer \} from '\.\/back\.ts';/);
  assert.match(page, /argument\?\.show\(c\.argOn\);\n  backCheck\(\);/, 'the check runs after the argument on every scroll');
  assert.match(page, /backTimer\(H\.classList\.contains\('m3d'\) \? sv : 0, performance\.now\(\), backSince\)/, '3D mode only, on the clock');
  assert.match(page, /backT = window\.setTimeout\(backCheck, r\.dueMs\)/, 'one timer for dueMs');
  assert.match(page, /toGrid\(reason\);\n  backReset\(\);/, 'swatch grid mode hides it at once');
  const click = page.match(/backEl\?\.addEventListener\('click', ([^\n]*)\);/)?.[1] ?? '';
  assert.match(click, /track\('family_back', \{ from: 'argument' \}\)/);
  assert.doesNotMatch(click, /preventDefault/, 'the browser follows the link (D4)');
  assert.match(page, /\{ \.\.\.o, fill: 'forwards' \}/, 'the exit holds its last frame until hidden');
  assert.match(page, /const from = getComputedStyle\(backEl!\)\.opacity;[^\n]*\n\s+backAnim\?\.cancel\(\);/, 'the exit starts from the current opacity, read before the arrival is cancelled (iteration 2, item 5)');
  assert.match(page, /animate\(\[\{ opacity: from \}, \{ opacity: 0 \}\]/);
  assert.match(page, /back: \(\) => \(\{ since: backSince, shown: backShown \}\)/, 'the test hook');
  assert.match(read('src/scripts/family/track.ts'), /\| 'family_back';/);
});

test('backTimer: off at 5.6 screens and below, on above; show at 2,500 ms and not at 2,499; leaving drops since; a new arrival waits again; dueMs counts down to 0', () => {
  assert.equal(SV.argOn, 5.6);
  assert.equal(BACK_DELAY_MS, 2500);
  assert.deepEqual(backTimer(0, 1000, null), OFF);
  assert.deepEqual(backTimer(5.6, 1000, null), OFF);
  assert.deepEqual(backTimer(5.6, 9000, 1000), OFF, 'on the boundary the argument is off');
  assert.deepEqual(backTimer(5.61, 1000, null), { since: 1000, show: false, dueMs: 2500 }, 'arrival: since is now');
  assert.deepEqual(backTimer(6.5, 2000, 1000), { since: 1000, show: false, dueMs: 1500 });
  assert.deepEqual(backTimer(6.5, 3499, 1000), { since: 1000, show: false, dueMs: 1 });
  assert.deepEqual(backTimer(6.5, 3500, 1000), { since: 1000, show: true, dueMs: 0 });
  assert.deepEqual(backTimer(7, 90000, 1000), { since: 1000, show: true, dueMs: 0 }, 'wall time: a tab left in the background comes back shown');
  // leaving before 2.5 s cancels; the next arrival starts a new 2.5 s
  assert.deepEqual(backTimer(5.5, 2000, 1000), OFF);
  assert.deepEqual(backTimer(6, 2000, null), { since: 2000, show: false, dueMs: 2500 });
  assert.equal(backTimer(6, 4499, 2000).show, false);
  assert.equal(backTimer(6, 4500, 2000).show, true);
  // leaving after it showed; the next arrival waits again
  assert.deepEqual(backTimer(5.6, 5000, 2000), OFF);
  assert.deepEqual(backTimer(6.2, 5000, null), { since: 5000, show: false, dueMs: 2500 });
});

test('backFade: 400 ms on --ease-standard in and 200 ms on --ease-in out, the curves read from tokens.css; null under reduced motion', () => {
  const tokens = read('src/styles/tokens.css');
  const tok = (name: string) => tokens.match(new RegExp(`${name}:\\s*(cubic-bezier\\([^)]*\\))`))?.[1];
  assert.deepEqual(backFade('in', false), { duration: BACK_IN_MS, easing: tok('--ease-standard') });
  assert.deepEqual(backFade('out', false), { duration: BACK_OUT_MS, easing: tok('--ease-in') });
  assert.equal(BACK_IN_MS, 400);
  assert.equal(BACK_OUT_MS, 200);
  assert.equal(backFade('in', true), null);
  assert.equal(backFade('out', true), null);
});
