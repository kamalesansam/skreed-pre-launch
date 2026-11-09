// The section index (docs/specs/navbar.md AC4, AC5, AC10) on the redesigned landing page (docs/specs/redesign.md D4;
// Sam, 2026-11-09: "keep the logo and navbar intact"): (a) nav-map.ts's groups, rest positions and the entry on screen,
// over the page's own boxes; (b) its fragment links name the landing page's real ids, and the drawer sits inside the
// bar's nav; (c) Products is always listed and nothing is locked or waited for; (d) the drawer's look; (e) the copy
// rules; (f) About and the gift are page links.
// Rewritten on 2026-11-09 (D17) for the map's new shape. Until then the map stood on the old landing's scroll map
// (S2T, the 3D path's seams and the poster tier's tops, a PageMap of pixels with an island flag), and section 5 was an
// entry of it, the gift. The redesigned page is ordinary sections in flow, so the map is document boxes and nothing
// else, and the gift is a link to the jars' own page. The six rows of the old map (the 3D path's rests and seams, the
// poster tier's two, the clamp and the gift's) are replaced here by the rows of the new one, which ask the same things
// of it: where an entry rests, that the rest is held in the page and never NaN, which entry is on screen, and that each
// entry is marked at its own rest. The drawer's, the popover's, the copy's and About's rows are as they were, word for
// word. What the old rows read of the old landing's own parts (nav#families, section#room, the director's reset) is
// kept in the last row: those files stay on disk, unmounted and unedited (D2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COPY } from '../../src/config/copy.ts';
import { RD_IDS } from '../../src/config/redesign.ts';
import { hull, restY, sectionAt, SECTION_GROUPS, SECTION_IDS, type Box, type Boxes, type SectionId, type Tops } from '../../src/scripts/shell/nav-map.ts';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const vh = 800;
// the page at 1280 x 800, in round figures: the hero one screen, "what you've seen so far" two (its scene is sticky
// inside it), the swatches, the picker, the photograph band (which no entry lists), the range, MATCH ESSENTIALS, the
// five tiles, the quiz's way in with its host closed; then the proof, the countdown and the jars (D19 and D20 took the
// two steps and the band from between them), to 13,000 px
const PART: Record<string, Box | null> = {
  top: { top: 0, bottom: 800 }, seen: { top: 800, bottom: 2400 },
  families: { top: 2400, bottom: 3500 }, glimpse: { top: 3500, bottom: 4200 },
  products: { top: 4960, bottom: 6600 }, match: { top: 6600, bottom: 7360 }, everyone: { top: 7360, bottom: 8400 },
  quiz: { top: 8400, bottom: 9200 }, quizHost: null,
};
/** the measures site-nav.ts takes of a page: each entry's box (its parts' hull) and its rest (its first part's top) */
const measure = (part: Record<string, Box | null>, height = 13000): { boxes: Boxes; tops: Tops } => ({
  boxes: Object.fromEntries(SECTION_IDS.map((id) => [id, hull(SECTION_GROUPS[id].map((p) => part[p]))])),
  tops: { ...Object.fromEntries(SECTION_IDS.map((id) => [id, part[SECTION_GROUPS[id][0]]?.top ?? NaN])), max: height - vh },
});
const { boxes, tops } = measure(PART);
const at = (y: number, b: Boxes = boxes) => sectionAt(y, vh, b);

test('the groups (spec D4): four entries in the bar\'s order, each over parts of the page in page order, its first part its target; every part a section of the page', () => {
  assert.deepEqual([...SECTION_IDS], ['top', 'families', 'quiz', 'room'], 'Home, Families, Quiz, Products: the bar\'s order, the old keys');
  assert.deepEqual(JSON.parse(JSON.stringify(SECTION_GROUPS)), { top: ['top', 'seen'], families: ['families', 'glimpse'], room: ['products', 'match', 'everyone'], quiz: ['quiz', 'quizHost'] });
  const ids = RD_IDS as readonly string[];
  const parts = SECTION_IDS.flatMap((id) => SECTION_GROUPS[id]);
  assert.equal(new Set(parts).size, parts.length, 'no part under two entries');
  for (const id of SECTION_IDS) {
    const real = SECTION_GROUPS[id].filter((p) => p !== 'quizHost');
    for (const p of real) assert.ok(ids.includes(p), `${id} covers "${p}", a section of the page`);
    // a group is a run of the page: its parts follow one another with nothing between them
    assert.deepEqual(real, ids.slice(ids.indexOf(real[0]), ids.indexOf(real[0]) + real.length), `${id}: its parts in page order`);
  }
  // the page's own order is Home, Families, Products, Quiz: the bar lists Quiz before Products, as it did (spec 12, item 8)
  const first = (id: SectionId) => ids.indexOf(SECTION_GROUPS[id][0]);
  assert.ok(first('top') < first('families') && first('families') < first('room') && first('room') < first('quiz'));
  // the map is arithmetic on boxes: no import (no scroll map, nothing of the old landing's config), no DOM
  const src = read('src/scripts/shell/nav-map.ts');
  assert.doesNotMatch(src, /^\s*import\s/m, 'nav-map.ts imports nothing');
  assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''), /\bdocument\b|\bwindow\b|\binnerHeight\b|getBoundingClientRect|addEventListener/, 'no DOM in the map: the scroll position and the screen\'s height are handed to it');
});

test('hull: a group\'s box runs from its highest top to its lowest bottom, over the parts that have a box', () => {
  assert.deepEqual(hull([PART.top, PART.seen]), { top: 0, bottom: 2400 });
  assert.deepEqual(hull([PART.products, PART.match, PART.everyone]), { top: 4960, bottom: 8400 });
  assert.deepEqual(hull([PART.quiz, null]), PART.quiz, 'the quiz\'s host has no box until it opens');
  assert.deepEqual(hull([PART.quiz, { top: 9200, bottom: 11000 }]), { top: 8400, bottom: 11000 }, 'and joins its entry once it has');
  assert.equal(hull([null, undefined]), null);
  assert.equal(hull([]), null);
  assert.equal(hull([{ top: 5, bottom: 5 }, { top: NaN, bottom: 9 }, { top: 9, bottom: 3 }]), null, 'a box with no height, or no number, is no box');
});

test('each entry rests with its first part\'s top at the top of the screen, Home at 0', () => {
  assert.equal(restY('top', tops), 0);
  assert.equal(restY('top', { ...tops, top: 64 }), 0, 'Home is the page\'s top, whatever the hero\'s box says');
  assert.equal(restY('families', tops), 2400);
  assert.equal(restY('room', tops), 4960);
  assert.equal(restY('quiz', tops), 8400);
  assert.equal(restY('families', { ...tops, families: 2400.4 }), 2400);
  assert.equal(restY('families', { ...tops, families: 2400.5 }), 2401, 'rounded to a pixel');
});

test('rest positions are held inside the page and never NaN (an entry with no box)', () => {
  assert.equal(restY('room', { ...tops, room: NaN }), 0);
  assert.equal(restY('room', { top: 0 }), 0, 'absent');
  assert.equal(restY('quiz', { ...tops, max: 7500 }), 7500, 'a short page: the rest is its end');
  assert.equal(restY('families', { ...tops, families: -40 }), 0);
  assert.equal(restY('quiz', { ...tops, max: undefined }), 8400, 'no range given: the target itself');
  assert.equal(restY('quiz', { ...tops, max: NaN }), 8400);
  assert.equal(restY('quiz', { ...tops, max: -1 }), 0);
  for (const id of SECTION_IDS) for (const t of [tops, {}, { max: 0 }, { [id]: Infinity }] as Tops[]) assert.ok(Number.isFinite(restY(id, t)), `${id}: a number`);
});

test('the entry on screen is the one whose box holds the screen\'s middle line: it changes as the line reaches the next entry\'s top', () => {
  assert.equal(at(0), 'top');
  // Home through the hero and "what you've seen so far", until the line (400 px down the screen) reaches the swatches
  assert.equal(at(1999), 'top');
  assert.equal(at(2000), 'families', 'the top edge counts in, so two boxes that meet never both hold the line');
  assert.equal(at(2400), 'families');
  // the photograph band under the picker (4200 to 4960) is in no group: it stays with the entry above it
  assert.equal(at(3800), 'families');
  assert.equal(at(4559), 'families');
  assert.equal(at(4560), 'room');
  // Products over the range, MATCH ESSENTIALS and the five tiles
  assert.equal(at(6800), 'room');
  assert.equal(at(7999), 'room');
  assert.equal(at(8000), 'quiz');
  assert.equal(at(8799), 'quiz');
  // and none past the last group, where the page goes on to the proof, the countdown and the jars
  assert.equal(at(8800), null);
  assert.equal(at(12200), null);
  // the open quiz joins its entry: the host's box is part of the hull
  const open = measure({ ...PART, quizHost: { top: 9200, bottom: 11000 } }).boxes;
  assert.equal(at(8800, open), 'quiz');
  assert.equal(at(10599, open), 'quiz');
  assert.equal(at(10600, open), null);
  // the bar's order is not the page's: Quiz is asked before Products and still yields to it above its own top
  assert.equal(at(5000), 'room');
});

test('each entry is marked at its own rest; an entry with no box is never marked; a last group shorter than half the screen is still marked at its rest', () => {
  for (const id of SECTION_IDS) assert.equal(at(restY(id, tops)), id, `${id} rests inside itself`);
  // no box for an entry: the line stays with the entry above it, and nothing is NaN
  const noFamilies = { ...boxes, families: null };
  assert.equal(at(2400, noFamilies), 'top');
  assert.equal(at(5000, noFamilies), 'room');
  assert.equal(at(0, {}), null, 'no box at all: no entry');
  assert.equal(at(0, { top: { top: 0, bottom: NaN } }), null);
  // the quiz's way in on a phone, 300 px tall: at its rest the middle line is already under it, and it keeps the mark
  // there, to within the pixel the rest is rounded by
  const short = measure({ ...PART, quiz: { top: 8400, bottom: 8700 } });
  assert.equal(sectionAt(restY('quiz', short.tops), vh, short.boxes), 'quiz');
  assert.equal(sectionAt(8300, vh, short.boxes), 'quiz', 'and on the way to it, once the line has reached its top');
  assert.equal(sectionAt(8401, vh, short.boxes), null, 'a pixel past its rest the page has gone on');
  assert.equal(sectionAt(7999, vh, short.boxes), 'room');
  // a phone's taller page (the same parts at 390 x 844, three times the height) reads the same way
  const phone = measure(Object.fromEntries(Object.entries(PART).map(([k, b]) => [k, b && { top: b.top * 3, bottom: b.bottom * 3 }])), 39000);
  for (const id of SECTION_IDS) assert.equal(sectionAt(restY(id, phone.tops), 844, phone.boxes), id, `${id} on a phone`);
});

test('the fragment links name the landing page\'s ids, each the first part its entry covers, in the bar and the drawer, one landmark', () => {
  const nav = read('src/components/shell/SiteNav.astro');
  assert.match(nav, /const HREF: Record<SectionId, string> = \{ top: '#top', families: '#families', quiz: '#quiz', room: '#products' \};/);
  // the link without a script and the jump with one land on the same place, and a renamed section stops the build
  assert.match(nav, /if \(HREF\[id\] !== `#\$\{SECTION_GROUPS\[id\]\[0\]\}`\) throw new Error\(/);
  assert.match(nav, /if \(part !== 'quizHost' && !\(RD_IDS as readonly string\[\]\)\.includes\(part\)\) throw new Error\(/);
  for (const id of SECTION_IDS) assert.ok((RD_IDS as readonly string[]).includes(SECTION_GROUPS[id][0]), `${id}'s target is a section of the page`);
  // the four targets, where the page carries them
  assert.match(read('src/components/redesign/Hero.astro'), /<section\b[^>]*\bid="top"/);
  assert.match(read('src/components/redesign/Families.astro'), /<section\b[^>]*\bid="families"/);
  assert.match(read('src/components/redesign/QuizCta.astro'), /<section\b[^>]*\bid="quiz"/);
  assert.match(read('src/components/redesign/Products.astro'), /<section\b[^>]*\bid="products"/);
  assert.match(read('src/components/redesign/QuizCta.astro'), /<div\b[^>]*\bid="quizHost"/, 'and the quiz\'s host, the second part of its entry');
  assert.match(read('src/components/quiz/Quiz.astro'), /<section class="quiz" id="find"/, 'the quiz itself is unedited, inside the host');
  assert.equal((nav.match(/items\.map/g) ?? []).length, 2);
  assert.equal((nav.match(/pages\.map/g) ?? []).length, 2, 'About, a page link, after the sections in the bar and in the drawer');
  assert.match(nav, /const pages = \[\{ id: 'about', href: '\/about\/', label: N\.pages\.about \}\];/);
  assert.ok(nav.indexOf('items.map') < nav.indexOf('pages.map') && nav.lastIndexOf('items.map') < nav.lastIndexOf('pages.map'), 'About comes last in both lists');
  assert.doesNotMatch(nav, /data-sec=\{p\.id\}/, 'a page link carries no data-sec, so site-nav.ts never jumps or marks it current');
  assert.equal((nav.match(/<nav\b/g) ?? []).length, 1, 'the drawer sits inside the bar\'s nav, so the index is one landmark');
  assert.ok(nav.indexOf('id="site-sections"') > nav.indexOf('<nav') && nav.indexOf('id="site-sections"') < nav.indexOf('</nav>'));
  const index = read('src/pages/index.astro');
  assert.ok(index.indexOf('<SiteLogo />') >= 0 && index.indexOf('<SiteLogo />') < index.indexOf('<SiteNav />'), 'next after the logotype in the tab order');
  assert.ok(index.indexOf('<SiteNav />') < index.indexOf('<main class="rd" id="main">'), 'and before the page\'s main');
});

test('Products is always listed, nothing is locked behind the quiz (2026-11-04), and nothing waits for the old landing (2026-11-09)', () => {
  const nav = read('src/components/shell/SiteNav.astro'), css = read('src/styles/site-nav.css'), js = read('src/scripts/shell/site-nav.ts');
  assert.doesNotMatch(css, /#room\[data-locked\]/, 'no rule hides Products');
  assert.doesNotMatch(nav, /data-gate-key/);
  assert.doesNotMatch(js, /data-locked|skreed:quiz-unlock|room_unlock|gateKey/, 'no unlock left in the index');
  // until 2026-11-09 Products waited up to 1.5 s on the scenes (SCENES_WAIT_MS, window.__skreedScenes): the redesigned
  // page has no scenes, and its Products entry is a section in flow, jumped to like any other
  assert.doesNotMatch(js, /SCENES_WAIT_MS|__skreedScenes|__skreedHero|__skreedRoom/, 'the index waits for no island and no scene');
  assert.doesNotMatch(js, /^import[^\n]*config\/quiz/m, 'the quiz\'s config stays out of the index\'s chunk');
  for (const f of ['src/scripts/shell/site-nav.ts', 'src/scripts/shell/nav-map.ts', 'src/components/shell/SiteNav.astro']) assert.doesNotMatch(read(f), /^import[^\n]*(?:config\/hero|scripts\/hero\/|\.\.\/hero\/)/m, `${f}: no scroll map and nothing of the island (spec D4)`);
});

test('site-nav.ts measures the page for the map and jumps in place under the veil: the entry on screen by its boxes, the rest by its first part\'s top, measured again when the page\'s layout moves', () => {
  const js = read('src/scripts/shell/site-nav.ts');
  assert.match(js, /^import \{ SECTION_GROUPS, SECTION_IDS, hull, restY, sectionAt, type Box, type Boxes, type SectionId, type Tops \} from '\.\/nav-map\.ts';$/m);
  // each entry's box is its parts' hull and its rest its first part's top, in document px
  assert.match(js, /return \{ top: r\.top \+ scrollY, bottom: r\.bottom \+ scrollY \};/);
  assert.match(js, /const parts = SECTION_GROUPS\[id\]\.map\(boxOf\);\n\s+boxes\[id\] = hull\(parts\);\n\s+tops\[id\] = parts\[0\]\?\.top \?\? boxes\[id\]\?\.top \?\? NaN;/);
  assert.match(js, /max: Math\.max\(0, \(document\.scrollingElement \?\? html\)\.scrollHeight - innerHeight\)/);
  // the mark, one read a frame, on the browser's own scroll (a passive listener: nothing here holds the page)
  assert.match(js, /const s = sectionAt\(scrollY, innerHeight, page\(\)\.boxes\);/);
  assert.match(js, /if \(s !== null && a\.dataset\.sec === s\) a\.setAttribute\('aria-current', 'location'\); else a\.removeAttribute\('aria-current'\);/);
  assert.match(js, /addEventListener\('scroll', queue, \{ passive: true \}\);/);
  // measured again after a resize, a change of the page's height (the faces, a picture, the quiz opening) and a section's word
  assert.match(js, /addEventListener\('resize', remeasure\);\n\s+addEventListener\('skreed:rd-layout', remeasure\);\n\s+new ResizeObserver\(remeasure\)\.observe\(document\.body\);/);
  // the press: Back to top's jump, an instant scroll to the rest under the --night veil, never a scroll through the page
  assert.match(js, /scrollTo\(\{ top: restY\(id, page\(\)\.tops\), behavior: 'instant' \}\);/);
  assert.match(js, /void veiled\(async \(\) => \{\n\s+jump\(id\);\n\s+mark\(\);/);
  assert.doesNotMatch(js, /behavior: 'smooth'/);
  // a modifier press opens the fragment as a link does
  assert.match(js, /if \(e\.button !== 0 \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.shiftKey \|\| e\.altKey\) return;   \/\/ a new tab or window opens the fragment as a link does/);
  // the index takes the logotype's tone, which the page's tone script sets (spec D5)
  assert.match(js, /new MutationObserver\(tone\)\.observe\(logo, \{ attributes: true, attributeFilter: \['data-tone'\] \}\);/);
});

test('the drawer: a transparent full-screen layer, its 75 percent light panel sliding from the right; the bar has no fill, blur or shadow', () => {
  const css = read('src/styles/site-nav.css');
  assert.match(css, /\.snav-sheet \{ position: fixed; inset: 0;[^}]*background: transparent;/, 'the layer covers the strip beside the panel, so a tap there lands on it');
  assert.match(css, /\.snav-in \{ position: absolute; inset: 0 0 0 auto; width: 75%;/);
  assert.match(css, /background: var\(--pearl-whisper\); color: var\(--urban-slate\);/);
  assert.match(css, /transform: translateX\(100%\); transition: transform var\(--dur-card\) var\(--ease-standard\)/);
  assert.doesNotMatch(css, /prefers-reduced-motion/, 'the full motion for every visitor since 2026-11-04 (E-3D-only)');
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

test('About is a plain link: site-nav.ts jumps only the data-sec links, tracks a press on a page link, and the About page carries no index', () => {
  const js = read('src/scripts/shell/site-nav.ts');
  assert.match(js, /const links = \[\.\.\.document\.querySelectorAll<HTMLAnchorElement>\('a\[data-sec\]'\)\];/);
  // a plain press is tracked; a modifier press (a new tab) returns first, as the sections' handler does
  assert.match(js, /querySelectorAll<HTMLAnchorElement>\('#siteNav a\[data-page\]'\)\) a\.addEventListener\('click', \(e\) => \{ if \(e\.button !== 0 \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.shiftKey \|\| e\.altKey\) return; track\('nav', \{ to: a\.dataset\.page! \}\); \}\);/);
  // the drawer goes with the page: closed as the page leaves, so a landing page restored from the back-forward cache
  // comes back without it, and closed again by a restore that still finds it open (navbar.md D7)
  assert.match(js, /addEventListener\('pagehide', \(\) => \{ if \(open\(\)\) sheet\.hidePopover\(\); \}\);/);
  assert.match(js, /addEventListener\('pageshow', \(e\) => \{ if \(e\.persisted && open\(\)\) sheet\.hidePopover\(\); \}\);/);
  const about = read('src/pages/about.astro');
  assert.doesNotMatch(about, /SiteNav|site-nav/, 'the About page has no index: its wordmark and Back to main page are its way home (docs/specs/about.md D6, D13)');
  // 2026-11-03: the wordmark with the glitch, and "Back to main page", both going Back to the landing page when it is behind them
  assert.match(about, /<SiteLogo \/>/);
  assert.match(about, /<a class="ab-home" href="\/" data-home>/);
});

test('the gift opens the jars on their own page (spec D1 and D4, 2026-11-09): a page link as About is, last in the bar at every width, never an entry of the map; it keeps the logotype\'s glitch', () => {
  // until 2026-11-09 the gift was the map's fifth place: it jumped to section 5 at the page's end and was marked once
  // that section was half a screen up. The jars are /jars/ now ("Both": the two steps on the landing page, and the jars
  // kept as their own page that the navbar's gift opens), so there is no rest and no mark to hold: only the link. The
  // jars close the landing page as well since D18, and the two steps left it with D19; the gift still opens /jars/ (spec
  // 12, item 11, his to change)
  const nav = read('src/components/shell/SiteNav.astro'), js = read('src/scripts/shell/site-nav.ts');
  assert.match(nav, /<a class="snav-a snav-gift" id="snavGift" href="\/jars\/" data-page="jars" aria-label=\{N\.gift\}>/);
  assert.doesNotMatch(nav.match(/<a class="snav-a snav-gift"[^>]*>/)![0], /data-sec/, 'no data-sec: never jumped to, never marked current');
  assert.ok(nav.indexOf('class="snav-a snav-menu"') < nav.indexOf('id="snavGift"') && nav.indexOf('id="snavGift"') < nav.indexOf('id="site-sections"'), 'after Menu, outside the drawer, so it shows at every width');
  assert.ok(!(SECTION_IDS as readonly string[]).includes('signup') && !('signup' in SECTION_GROUPS), 'section 5 is no entry of the map');
  assert.doesNotMatch(js, /['"]signup['"]|#signup|suEmail/, 'and the index knows nothing of a sign-up section');
  assert.equal(COPY.nav.gift, 'Sign up');
  assert.ok(read('src/pages/jars.astro').length > 0, 'the page it opens exists');
  // its press is the page links' (tracked, left to the browser), and the glitch is the logotype's on the gift's symbol
  assert.match(js, /const gift = document\.getElementById\('snavGift'\);\n\s+if \(gift\) createLogoGlitch\(gift, \{ split: LOGO_SPLIT, idle: LOGO_IDLE, every: GIFT_EVERY, target: \{ \.\.\.GIFT_TARGET, href: '#skreed-gift', prefix: 'gg-' \} \}\);/);
  assert.match(nav, /<symbol id="skreed-gift" viewBox="0 0 16 16">/);
  assert.match(nav, /Bootstrap Icons' "gift"[^\n]*\n[^\n]*MIT License/, 'the icon\'s notice is kept (E-NAV-gift)');
});

test('the old landing\'s own targets, kept on disk and mounted by no page since 2026-11-09 (docs/specs/redesign.md D2): nav#families, section#room open at rest, and the director\'s reset', () => {
  // these three were read by the two rows above them until the redesign; the files have not moved, so they still hold
  assert.match(read('src/components/family/FamilyLinksNav.astro'), /<nav id="families"/);
  assert.match(read('src/components/room/Room.astro'), /<section class="room" id="room"/);
  assert.doesNotMatch(read('src/components/room/Room.astro'), /\bhidden data-locked\b/, 'open at rest since 2026-11-04');
  // the landing inside section 4 snaps its followers only once the section has a reading (none while the gate hides it)
  assert.match(read('src/scripts/hero/section4/director.ts'), /reset\(y\) \{\n\s+resetLap\(\);\n\s+if \(y === undefined\) return;\n\s+current\(\);\n(?:\s+\/\/[^\n]*\n)*\s+if \(!measured\) return;\n\s+const qq = \(y - top\) \/ screenPx\(\);/);
});
