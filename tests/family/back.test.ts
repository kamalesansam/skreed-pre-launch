// Round 4 (docs/specs/family-page.md 22, D7; acceptance 1, 2, 4 and 6 of that section): "Back to main page" on the
// argument screen, everything a browser is not needed for: the route's markup read from source, the stylesheet's rules,
// the page module's wiring, backTimer (the 5.6 boundary, 2,499 and 2,500 ms, the cancel, the re-arrival, dueMs) and
// backFade (the two curves equal to --ease-standard and --ease-in, null under reduced motion). The browser rows are
// specs/back.spec.ts; section 13's step 3, the landing's return path the control depends on (D4), is return-path.test.ts.
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

test('the stylesheet: .fam-back fixed at z-index 4 after .allfam, set as "All families" is, centred by the margins, no transition, no underline; off outside 3D mode; the wide layout\'s bottom', () => {
  const css = read('src/styles/family.css');
  const rule = css.match(/^\.fam-back \{([^}]*)\}/m)?.[1] ?? '';
  assert.ok(rule, 'one .fam-back rule');
  assert.ok(css.indexOf('.allfam {') < css.indexOf('.fam-back {') && css.indexOf('.ring2 {') < css.indexOf('.fam-back {'), 'declared after .allfam and .ring2, so position: fixed wins');
  for (const decl of ['position: fixed', 'z-index: 4', 'left: 0', 'right: 0', 'width: max-content', 'margin-inline: auto', 'bottom: calc(var(--to-top-bottom) + var(--hit) + var(--s1) + var(--sab))',
    'min-height: var(--hit)', 'padding: 0 var(--s2)', 'display: inline-flex', 'align-items: center', 'font-size: var(--fs-label)', 'font-weight: 600', 'line-height: 1', 'white-space: nowrap', 'color: var(--pearl-whisper)', 'text-decoration: none']) {
    assert.ok(rule.includes(decl), `.fam-back: ${decl}`);
  }
  assert.doesNotMatch(rule, /transition|transform|opacity|box-shadow|border|background/, 'no transition (the fade is the Web Animations API), no transform (.press owns it), no box');
  assert.match(css, /html:not\(\.m3d\) \.beats, html:not\(\.m3d\) \.beatnav, html:not\(\.m3d\) #tint, html:not\(\.m3d\) \.arg, html:not\(\.m3d\) \.fam-back \{ display: none; \}/, 'swatch grid mode has no control (D3)');
  const wide = css.slice(css.indexOf('@media (min-width: 900px) and (min-height: 600px) {\n'));
  assert.ok(wide.slice(0, wide.indexOf('\n}')).includes('.fam-back { bottom: calc(var(--inset) + var(--sab)); }'), 'the wide layout: one --inset above the safe area');
  assert.match(css, /\[hidden\] \{ display: none !important; \}/, 'hidden is display: none, which no transition can start from');
  // rule 15: Back to top's bottom offset is one token, used by its own row and by this control's (iteration 2, item 4)
  const toTop = read('src/styles/to-top.css');
  assert.match(toTop, /^:root \{ --to-top-bottom: 14px; \}/m, 'the token, defined where Back to top is styled (both pages load it)');
  assert.match(toTop, /\.to-top\[data-page="family"\] \{[^}]*bottom: calc\(var\(--to-top-bottom\) \+ env\(safe-area-inset-bottom, 0px\)\);/, 'Back to top stands on it');
  assert.equal(((toTop + css).match(/\b14px\b/g) ?? []).length, 1, 'the number is written once, as the token');
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
