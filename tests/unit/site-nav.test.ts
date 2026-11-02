// The section index (docs/specs/navbar.md AC4, AC5, AC10): (a) nav-map.ts's rest positions and the section on screen,
// on the 3D path against the hero's scroll map (S2T) and on the poster tier against the page's tops; (b) its fragment
// links name the landing page's real ids, and the drawer sits inside the bar's nav; (c) Products is always listed and
// opens the quiz gate as Skip quiz does (the gate's key from config/quiz.ts, room_unlock, skreed:quiz-unlock); (d) the
// drawer's look; (e) the copy rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { S2T } from '../../src/config/hero.ts';
import { COPY } from '../../src/config/copy.ts';
import { QUIZ_GATE } from '../../src/config/quiz.ts';
import { rideTarget } from '../../src/scripts/quiz/gate.ts';
import { restY, sectionAt, SECTION_IDS, type PageMap } from '../../src/scripts/shell/nav-map.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const vh = 800;
// the 3D path at 800 px: the track is TRACK_SVH / 100 screens (6.75 since 2026-11-02; 17.2 before), the quiz under it, section 4 two screens below the quiz's top
const island: PageMap = { island: true, roomStill: false, vh, families: 5400, familiesH: 300, quiz: 5400, room: 7000, stage: 800, max: 40000 };
const poster: PageMap = { island: false, roomStill: false, vh, families: 800, familiesH: 300, quiz: 1100, room: 2900, stage: 800, max: 6000 };

test('the 3D path: each section rests where the hero, the glue and Skip quiz put it', () => {
  assert.equal(restY('top', island), 0);
  assert.equal(restY('families', island), Math.round(S2T.LAND * vh));
  assert.equal(restY('quiz', island), island.quiz);
  assert.equal(restY('room', island), island.room + island.stage);   // q 1, scene 1 fully in
  assert.equal(restY('room', island), rideTarget({ top: island.room, one: island.stage, poster: false, max: island.max }), 'Skip quiz\'s own landing');
  assert.equal(restY('room', { ...island, roomStill: true }), island.room);   // section 4 on its stills rests at its top
});

test('the poster tier: the top, nav#families centred, the quiz and section 4 at their tops', () => {
  assert.equal(restY('top', poster), 0);
  assert.equal(restY('families', poster), Math.round(800 + 150 - 400));
  assert.equal(restY('quiz', poster), 1100);
  assert.equal(restY('room', poster), 2900);
  assert.equal(restY('room', poster), rideTarget({ top: poster.room, one: poster.stage, poster: true, max: poster.max }), 'Skip quiz\'s own landing');
});

test('rest positions are clamped to the page and never NaN (section 4 locked has no box)', () => {
  assert.equal(restY('room', { ...island, room: NaN }), 0);
  assert.equal(restY('room', { ...island, max: 7500 }), 7500);   // q 1 would be 7800 on this fixture
  assert.equal(restY('families', { ...poster, families: 0, familiesH: 100 }), 0);
});

test('the 3D path: the section on screen changes at the middle of each seam', () => {
  const s = (screens: number) => sectionAt(screens * vh, island);
  assert.equal(s(0), 'top');
  const seam1 = (S2T.PULL + S2T.W1END) / 2;   // the middle of the first wipe (2.75 screens since 2026-11-02; 5.5 before)
  assert.equal(s(seam1 - 0.01), 'top');
  assert.equal(s(seam1), 'families');
  assert.equal(s(S2T.LAND), 'families');
  const seam2 = (Math.min(S2T.W2 * vh, island.quiz - vh) + island.quiz) / 2;
  assert.equal(sectionAt(seam2 - 1, island), 'families');
  assert.equal(sectionAt(seam2, island), 'quiz');
  assert.equal(sectionAt(island.quiz, island), 'quiz');
  assert.equal(sectionAt(island.room - 1, island), 'quiz');
  assert.equal(sectionAt(island.room, island), 'room');
  assert.equal(sectionAt(island.room + 5 * vh, { ...island, room: NaN }), 'quiz');   // locked: the page ends at the quiz
  for (const id of SECTION_IDS) assert.equal(sectionAt(restY(id, island), island), id, `${id} rests inside itself`);
});

test('the poster tier: the section under the middle of the screen', () => {
  assert.equal(sectionAt(0, poster), 'top');
  assert.equal(sectionAt(399, poster), 'top');
  assert.equal(sectionAt(400, poster), 'families');
  assert.equal(sectionAt(700, poster), 'quiz');
  assert.equal(sectionAt(2500, poster), 'room');
  for (const id of SECTION_IDS) assert.equal(sectionAt(restY(id, poster), poster), id, `${id} rests inside itself`);
});

test('the fragment links name the landing page\'s ids, in page order, in the bar and the drawer, one landmark', () => {
  const nav = read('src/components/shell/SiteNav.astro');
  assert.match(nav, /top: '#top', families: '#families', quiz: '#find', room: '#room'/);
  assert.match(read('src/components/family/FamilyLinksNav.astro'), /<nav id="families"/);
  assert.match(read('src/components/quiz/Quiz.astro'), /<section class="quiz" id="find"/);
  assert.match(read('src/components/room/Room.astro'), /<section class="room" id="room"[^>]* hidden data-locked/);
  assert.equal((nav.match(/items\.map/g) ?? []).length, 2);
  assert.equal((nav.match(/pages\.map/g) ?? []).length, 2, 'About, a page link, after the sections in the bar and in the drawer');
  assert.match(nav, /const pages = \[\{ id: 'about', href: '\/about\/', label: N\.pages\.about \}\];/);
  assert.ok(nav.indexOf('items.map') < nav.indexOf('pages.map') && nav.lastIndexOf('items.map') < nav.lastIndexOf('pages.map'), 'About comes last in both lists');
  assert.doesNotMatch(nav, /data-sec=\{p\.id\}/, 'a page link carries no data-sec, so site-nav.ts never jumps or marks it current');
  assert.equal((nav.match(/<nav\b/g) ?? []).length, 1, 'the drawer sits inside the bar\'s nav, so the index is one landmark');
  assert.ok(nav.indexOf('id="site-sections"') > nav.indexOf('<nav') && nav.indexOf('id="site-sections"') < nav.indexOf('</nav>'));
  const index = read('src/pages/index.astro');
  assert.ok(index.indexOf('<SiteLogo slot="logo" />') < index.indexOf('<SiteNav slot="logo" />'), 'next after the logotype in the tab order');
});

test('Products is always listed and opens the quiz gate as Skip quiz does', () => {
  const nav = read('src/components/shell/SiteNav.astro'), css = read('src/styles/site-nav.css'), js = read('src/scripts/shell/site-nav.ts');
  assert.doesNotMatch(css, /#room\[data-locked\]/, 'no rule hides Products while the gate holds section 4');
  assert.match(nav, /data-gate-key=\{QUIZ_GATE\.key\}/);
  assert.match(read('src/scripts/quiz/gate.ts'), /sessionStorage\.setItem\(QUIZ_GATE\.key, '1'\)/, 'the flag Skip quiz writes, under the same key');
  assert.equal(QUIZ_GATE.key, 'skreed:quiz-done');
  assert.match(js, /room\.removeAttribute\('hidden'\); room\.removeAttribute\('data-locked'\); room\.dataset\.open = 'nav';/);
  assert.match(js, /track\('room_unlock', \{ by: 'nav' \}\)/);
  assert.match(js, /dispatchEvent\(new CustomEvent\('skreed:quiz-unlock'/);
  assert.match(js, /SCENES_WAIT_MS = 1500/);
  assert.match(js, /window\.__skreedScenes/, 'Products waits on the scenes, as Skip quiz\'s ride does');
  // the landing inside section 4 snaps its followers only once the section has a reading (none while the gate hides it)
  assert.match(read('src/scripts/hero/section4/director.ts'), /reset\(y\) \{\n\s+resetLap\(false\);\n\s+if \(y === undefined\) return;\n\s+current\(\);\n(?:\s+\/\/[^\n]*\n)*\s+if \(!measured\) return;\n\s+const qq = \(y - top\) \/ screenPx\(\);/);
  assert.doesNotMatch(js, /^import[^\n]*config\/quiz/m, 'the quiz\'s config stays out of the index\'s chunk');
});

test('the drawer: a transparent full-screen layer, its 75 percent light panel sliding from the right; the bar has no fill, blur or shadow', () => {
  const css = read('src/styles/site-nav.css');
  assert.match(css, /\.snav-sheet \{ position: fixed; inset: 0;[^}]*background: transparent;/, 'the layer covers the strip beside the panel, so a tap there lands on it');
  assert.match(css, /\.snav-in \{ position: absolute; inset: 0 0 0 auto; width: 75%;/);
  assert.match(css, /background: var\(--pearl-whisper\); color: var\(--urban-slate\);/);
  assert.match(css, /transform: translateX\(100%\); transition: transform var\(--dur-card\) var\(--ease-standard\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.snav-a, \.snav-sheet, \.snav-in, \.snav-rows a span \{ transition: none; \}/);
  assert.match(css, /\.snav-sheet:not\(:popover-open\) \{ pointer-events: none; \}/, 'sliding out, the layer lets taps through at once');
  // no popover in the browser: the drawer hidden, the five words (the four sections and About) in a row under the logotype on phones, Menu gone
  const fallback = css.slice(css.indexOf('@supports not selector(:popover-open)'));
  assert.match(fallback, /^@supports not selector\(:popover-open\) \{\n  \.snav-sheet \{ display: none; \}\n  @media \(max-width: 767\.98px\) \{\n[^}]*\}\n    \.snav-list \{ display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0; \}\n    \.snav-menu \{ display: none; \}/);
  assert.doesNotMatch(css, /box-shadow|backdrop-filter|gradient/);
  assert.equal([...css.matchAll(/background: (?!none|transparent)[^;]+;/g)].length, 1, 'only the drawer\'s panel has a ground');
});

test('without the popover API the script never touches it, and a tap on the drawer\'s layer only closes it', () => {
  const js = read('src/scripts/shell/site-nav.ts');
  assert.match(js, /const POPOVER = 'hidePopover' in HTMLElement\.prototype;/);
  assert.match(js, /const open = \(\) => POPOVER && !!sheet\?\.matches\(':popover-open'\);/);
  assert.equal((js.match(/:popover-open/g) ?? []).length, 2, 'the selector only inside open() (and its comment)');
  assert.match(js, /const focusVisible = \(el: Element\) => \{ try \{ return el\.matches\(':focus-visible'\); \} catch \{ return false; \} \};/);
  assert.match(js, /sheet\.addEventListener\('click', \(e\) => \{ if \(e\.target === sheet\) sheet\.hidePopover\(\); \}\);/);
});

test('the copy: short words, no em dashes, no emojis', () => {
  const words = [COPY.nav.aria, COPY.nav.menu, COPY.nav.close, ...Object.values(COPY.nav.items), ...Object.values(COPY.nav.pages)];
  assert.deepEqual(Object.keys(COPY.nav.items), [...SECTION_IDS]);
  assert.deepEqual(Object.values(COPY.nav.items), ['Home', 'Families', 'Quiz', 'Products']);
  assert.deepEqual(COPY.nav.pages, { about: 'About' });
  for (const w of words) {
    assert.doesNotMatch(w, /[\u2014\u2013]/);
    assert.doesNotMatch(w, /\p{Extended_Pictographic}/u);
    assert.ok(w.length <= 9, w);
  }
});

test('About is a plain link: site-nav.ts jumps only the data-sec links, tracks a press on a page link, and the About page carries the index without the script', () => {
  const js = read('src/scripts/shell/site-nav.ts');
  assert.match(js, /const links = \[\.\.\.document\.querySelectorAll<HTMLAnchorElement>\('a\[data-sec\]'\)\];/);
  // a plain press is tracked; a modifier press (a new tab) returns first, as the sections' handler does
  assert.match(js, /querySelectorAll<HTMLAnchorElement>\('#siteNav a\[data-page\]'\)\) a\.addEventListener\('click', \(e\) => \{ if \(e\.button !== 0 \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.shiftKey \|\| e\.altKey\) return; track\('nav', \{ to: a\.dataset\.page! \}\); \}\);/);
  // the drawer goes with the page: closed as the page leaves, so a landing page restored from the back-forward cache
  // comes back without it, and closed again by a restore that still finds it open (navbar.md D7)
  assert.match(js, /addEventListener\('pagehide', \(\) => \{ if \(open\(\)\) sheet\.hidePopover\(\); \}\);/);
  assert.match(js, /addEventListener\('pageshow', \(e\) => \{ if \(e\.persisted && open\(\)\) sheet\.hidePopover\(\); \}\);/);
  const about = read('src/pages/about.astro');
  assert.match(about, /<SiteNav page="about" \/>/, 'the About page carries the index since round 2 (2026-11-03), with no script: its wordmark stays its way home (docs/specs/about.md D6, D13)');
  assert.doesNotMatch(about, /site-nav\.ts/, 'the script never reaches the page');
  assert.match(about, /<a class="site-logo" href="\/" aria-label=\{COPY\.logo\.aria\}>/);
});

test('the face (E-NAV-font, 2026-11-03): Work Sans Light capitals in the bar and the drawer, its token, its preload on both pages, and the fallback\'s numbers quoted from the manifest', () => {
  const css = read('src/styles/site-nav.css'), tokens = read('src/styles/tokens.css'), fonts = read('src/styles/fonts.css'), m = read('scripts/fonts/manifest.txt');
  assert.match(tokens, /--font-nav: "Work Sans", "Work Sans Fallback", Arial, sans-serif;/);
  assert.match(css, /\.snav-a \{[^}]*font-family: var\(--font-nav\); font-size: var\(--fs-label\); font-weight: 300; line-height: 1; letter-spacing: 0\.04em; text-transform: uppercase;/);
  assert.match(css, /\.snav-in \{[^}]*font-family: var\(--font-nav\); font-weight: 300; letter-spacing: 0\.04em; text-transform: uppercase; \}/);
  assert.doesNotMatch(css, /font-weight: 600|--font-ui/, 'one weight: the file ships 300 alone, so nothing is set bolder');
  for (const page of ['src/pages/index.astro', 'src/pages/about.astro']) assert.ok(read(page).includes("'/fonts/work-sans-300-latin.woff2'"), `${page} preloads the file`);
  const face = fonts.match(/@font-face \{ font-family: "Work Sans Fallback"; font-weight: 300; font-style: normal;\s*src: local\("Arial"\), local\("ArialMT"\);\s*([^}]*)\}/);
  assert.ok(face, 'the metric-matched fallback face in fonts.css');
  assert.match(m, /^== SECTION INDEX \(the navbar's face, 2026-11-03; exception E-NAV-font; the quiz result's Work Sans file, preloaded on \/ and \/about\/\)$/m);
  const line = m.match(/^Work Sans Fallback 300: (.+)$/m);
  assert.ok(line, 'the manifest\'s line, written by scripts/fonts/nav-fallback.py');
  const num = (s: string, k: string) => Number(s.match(new RegExp(`${k}[:\\s]+([\\d.]+)%`))![1]);
  for (const k of ['size-adjust', 'ascent-override', 'descent-override', 'line-gap-override']) assert.equal(num(face![1], k), num(line![1], k), k);
});

test('the About page carries the index with no script: About current, the section words plain links into the landing page, the drawer closed by a button over the strip (about.md round 2; navbar.md D7)', () => {
  const nav = read('src/components/shell/SiteNav.astro'), css = read('src/styles/site-nav.css'), about = read('src/pages/about.astro'), index = read('src/pages/index.astro');
  assert.doesNotMatch(nav, /<script\b/i, 'the component carries no script, so the About page renders it script-free');
  assert.match(index, /<script>\s*(?:\/\/[^\n]*\n\s*)*import '\.\.\/scripts\/shell\/site-nav\.ts';\s*<\/script>/, 'the landing page imports the script itself');
  assert.match(about, /<SiteNav page="about" \/>/);
  assert.match(nav, /href: \(page \? '\/' : ''\) \+ HREF\[id\]/, 'on a page the fragments point into the landing page');
  assert.match(nav, /const sec = \(id: SectionId\) => \(page \? undefined : id\);/, 'no data-sec on a page: every word a plain link');
  assert.match(nav, /const current = \(id: string\) => \(page === id \? 'page' : undefined\);/);
  assert.match(nav, /<nav class:list=\{\['snav', \{ 'snav-page': !!page \}\]\} id="siteNav" aria-label=\{N\.aria\} data-gate-key=\{QUIZ_GATE\.key\} data-tone=\{page \? 'light' : undefined\}>/);
  assert.match(nav, /<button class="snav-strip" type="button" popovertarget="site-sections" popovertargetaction="hide" tabindex="-1" aria-hidden="true"><\/button>/);
  assert.match(css, /\.snav-page \{ position: absolute; \}/, 'on the About page the bar scrolls away with the wordmark');
  assert.match(css, /\.snav-strip \{ position: absolute; inset: 0 75% 0 0;[^}]*background: transparent;/);
  assert.match(css, /html:not\(\.js\) \.snav:not\(\.snav-page\) \{ top:/, 'the no-script row is the landing page\'s alone; the About page keeps its drawer');
});
