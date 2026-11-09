// The redesigned landing page, read from its sources (docs/specs/redesign.md, written 2026-11-09; Sam, the same day, with
// his "Skreed Pre-Launch" design: "checkout the pdf, and build the exact same thing, but keep the logo and navbar
// intact"). No browser and no build run here: these rows hold what a source can carry of the page's ground rules. The
// page in order (D3, section 4), each section's id and tone (D5), the headline numbers said twice (D8), the copy's
// rules and the catalog's four product lines (section 3), what the redesign's files may not contain (the CSP, E-3D-only,
// the Never-do list), how the motion arrives and what it may not take (D16), the four display faces (D7, D20), and the
// pictures and the jars' page (D9, D1). The built page's weight and formats are scripts/hero/budget.mjs's, its ids, its
// forms and its stray pictures scripts/room/guards.mjs's, with their own rows in build-modes.test.ts; the section
// index's are site-nav.test.ts's; the page in a browser is tests/e2e/redesign.spec.ts.
// The page changed three times on the day it was built, and the rows follow it in the open:
//   D18 (Sam: "put the jars in the last of the main page as well"): the jars, section 5 as built, close the landing
//   page too, through components/redesign/Jars.astro, and of section 5 the page may mount that one component only.
//   D19 (his review of the first build: "remove that signup section"): the PDF's two steps left with their component,
//   stylesheet, script, copy and photograph, form.ts is the archive's again, and the jars' form is the page's one
//   sign-up; the rows that held two forms apart now hold that one. The same review set DIFFERENT plain at rest, moved
//   the cue's chevrons, opened the fans to equal steps with every case opaque, put the PDF's own swatches in the row,
//   made the picker answer a hover and added the countdown's colons: each has a row of its own below.
//   D20 (his second review: "remove the entire section in the last picture"): the white-blazer band left too, its mark
//   stands over the digits in the place of "Launch in", and DIFFERENT is Rubik Black at rest, a fourth display face.
// So the page has eleven sections, in the order of RD_IDS: the PDF's ten that are left and the jars.
//   node --test tests/unit/redesign.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLON, PAIR_H } from '../../src/config/countdown-digits.ts';
import { RD_BANDS, RD_COPY, RD_GLITCH_WORD, RD_HEADLINES, RD_IDS, RD_JARS } from '../../src/config/redesign.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const bytes = (p: string) => readFileSync(new URL(p, root));
const has = (p: string) => existsSync(new URL(p, root));
/** every file under a folder, as paths from the repository's root */
const walk = (dir: string): string[] => readdirSync(new URL(dir, root)).flatMap((n) => (statSync(new URL(`${dir}${n}`, root)).isDirectory() ? walk(`${dir}${n}/`) : [`${dir}${n}`]));
/** what a source file imports, statically or by import(): a relative specifier as a path from the repository's root (its ?raw or ?url taken off), a package by its name */
const importsOf = (file: string): string[] => [...read(file).matchAll(/(?:^|[\s;])import\s*(?:[^'"()]*?\sfrom\s*)?\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1].replace(/\?.*$/, '')).map((spec) => (spec.startsWith('.') ? posix.normalize(posix.join(posix.dirname(file), spec)) : spec));
/** an Astro file's template: what follows its frontmatter */
const template = (file: string) => { const s = read(file); const m = s.match(/^---\n[\s\S]*?\n---\n/); return m ? s.slice(m[0].length) : s; };
/** a stylesheet or a script without its comments, so a rule that says "never a box-shadow" is not read as one */
const code = (file: string) => (file.endsWith('.css') ? read(file).replace(/\/\*[\s\S]*?\*\//g, '') : read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"`\\])\/\/[^\n'"`]*$/gm, '$1'));

const INDEX = 'src/pages/index.astro';
const component = (name: string) => `src/components/redesign/${name}.astro`;
/** the PDF's sections in the page's order (section 4's table, without the two steps of D19 and the band of D20), then the jars (D18); RD_IDS holds their ids in the same order */
const SECTIONS = ['Hero', 'Seen', 'Families', 'Glimpse', 'Products', 'Match', 'Everyone', 'QuizCta', 'Proof', 'Launch', 'Jars'] as const;
/** section 5 as built, which D18 mounts on the landing page and D1 on /jars/ */
const SECTION5 = 'src/components/signup/Signup.astro';
/** the site as it stood on the day of the brief (spec, head): what "byte for byte the archive's" is read against */
const ARCHIVE = 'archive/site-before-redesign-2026-11-09';
/** a file as the archive has it, or null where this checkout has no git to ask or no such ref (a shallow clone) */
const archived = (file: string): string | null => {
  const r = spawnSync('git', ['show', `${ARCHIVE}:${file}`], { cwd: fileURLToPath(root), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
};
/** the redesign's own files: the page, its components, its scripts, its stylesheets */
const SHEETS = ['src/styles/redesign.css', ...walk('src/styles/').filter((f) => /^src\/styles\/rd-[a-z-]+\.css$/.test(f))];
const OWN = [INDEX, ...walk('src/components/redesign/'), ...walk('src/scripts/redesign/'), ...SHEETS].filter((f) => /\.(?:astro|ts|css)$/.test(f));

test('package.json pins GSAP exactly, at the version the spec names (D16), beside astro and three', () => {
  const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };
  assert.equal(pkg.dependencies.gsap, '3.15.1');
  assert.match(pkg.dependencies.gsap, /^\d+\.\d+\.\d+$/, 'an exact pin: no caret, no tilde, no range');
  assert.ok(!('gsap' in pkg.devDependencies), 'the page ships it: a dependency, not a tool');
  assert.equal(pkg.dependencies.three, '0.165.0', 'the family pages keep their island');
  for (const gone of ['lenis', '@studio-freight/lenis', 'locomotive-scroll', 'react', 'motion', 'framer-motion']) assert.ok(!(gone in pkg.dependencies) && !(gone in pkg.devDependencies), `${gone}: CLAUDE.md's stack is Astro, three and GSAP`);
});

test('index.astro: the kept chrome (the wordmark sprite, the logotype, the section index, the jump\'s veil), then the page\'s eleven sections in the order of RD_IDS with the jars as the last (D18, D19, D20), all inside main.rd, then the footer', () => {
  const t = template(INDEX);
  // the jars after the countdown and before the small footer (D18), inside main with the rest: the logotype's tone is
  // read from the parts of main (scripts/redesign/tone.ts), and the jars' part says its own
  const order = ['<RdHead slot="head-first" />', '<WordmarkSprite />', '<SiteLogo />', '<SiteNav />', '<BackToTop page="home" />', '<main class="rd" id="main">', ...SECTIONS.map((n) => `<${n} />`), '</main>', '<Footer />', '</Base>'];
  let at = -1;
  for (const tag of order) {
    const k = t.indexOf(tag);
    assert.ok(k >= 0, `index.astro mounts ${tag}`);
    assert.ok(k > at, `${tag} comes after what the spec puts before it`);
    assert.equal(t.split(tag).length - 1, 1, `${tag} once`);
    at = k;
  }
  // every component the page mounts is imported from where it lives, and the eleven are the redesign's own
  const imports = importsOf(INDEX);
  for (const n of SECTIONS) assert.ok(imports.includes(component(n)), `${n} from ${component(n)}`);
  for (const p of ['src/components/redesign/Footer.astro', 'src/components/redesign/RdHead.astro', 'src/components/shell/WordmarkSprite.astro', 'src/components/shell/SiteLogo.astro', 'src/components/shell/SiteNav.astro', 'src/components/shell/BackToTop.astro', 'src/layouts/Base.astro', 'src/styles/redesign.css']) assert.ok(imports.includes(p), p);
  // the page's one module script: the motion's loader and the logotype's tone (D5, D16)
  for (const p of ['src/scripts/redesign/motion.ts', 'src/scripts/redesign/tone.ts']) assert.ok(imports.includes(p), p);
  // the first screen's picture is fetched with the HTML, at the hero's own srcset and sizes (D9). Until D20 this row read
  // imagesizes="100vw"; the hero's crop grew on a tall screen and the two changed together, so it now holds them equal
  // whatever they say: a preload at other sizes than the picture's fetches a second file for nothing
  const hero = template(component('Hero')).match(/<RdPicture name="hero" alt=\{[^}]*\} sizes="([^"]+)" eager \/>/)?.[1];
  assert.ok(hero, 'Hero.astro draws the picture "hero", eager, with a literal sizes');
  assert.equal(t.match(/<link slot="head" rel="preload" as="image" type="image\/avif" imagesrcset=\{hero\.avif\} imagesizes="([^"]+)" fetchpriority="high" \/>/)?.[1], hero, 'the preload\'s imagesizes against the picture\'s sizes');
  assert.match(read(INDEX), /^const hero = rdPicture\('hero'\);$/m);
  assert.equal(RD_BANDS.hero.picture, 'hero');
});

test('what left the page stays gone (D19 "remove that signup section", D20 "remove the entire section in the last picture"): no component, stylesheet or script of the two steps or the band, no key of theirs in the config, no id or picture of theirs', () => {
  for (const f of ['src/components/redesign/SignupSteps.astro', 'src/styles/rd-signup.css', 'src/scripts/redesign/signup.ts', 'src/components/redesign/Soon.astro', 'src/styles/rd-soon.css', 'src/scripts/redesign/soon.ts']) assert.ok(!has(f), `${f} is back`);
  for (const key of ['steps', 'signup', 'soon']) {
    assert.ok(!(key in RD_HEADLINES), `RD_HEADLINES.${key}`);
    assert.ok(!(key in RD_COPY), `RD_COPY.${key}`);
    assert.ok(!(key in RD_BANDS), `RD_BANDS.${key}`);
  }
  for (const id of ['steps', 'soon']) assert.ok(!(RD_IDS as readonly string[]).includes(id), `RD_IDS has "${id}"`);
  for (const f of walk('src/components/redesign/').filter((p) => p.endsWith('.astro'))) {
    assert.doesNotMatch(template(f), /\bid="(?:steps|soon)"|<(?:SignupSteps|Soon)\b/, f);
    // the page's pictures name neither: the blue photograph left with the form, and the band's own photograph, proof, is now only the proof's
    assert.doesNotMatch(template(f), /\bname="(?:signup|soon)"/, f);
  }
  assert.deepEqual(walk('src/components/redesign/').filter((f) => /\.astro$/.test(f) && /\bname="proof"/.test(read(f))), ['src/components/redesign/Proof.astro'], 'the proof photograph is drawn once (D20)');
  // the encoded pictures, where this checkout has them (the folder is git-ignored): their index and their files say the same
  if (has('src/assets/redesign/index.json')) {
    const index = JSON.parse(read('src/assets/redesign/index.json')) as Record<string, unknown>;
    assert.ok(!('signup' in index) && !('soon' in index), 'the index lists a picture that left');
    assert.deepEqual(readdirSync(new URL('src/assets/redesign/', root)).filter((f) => /^(?:signup|soon)[-.]/.test(f)), [], 'a file of a picture that left: the glob in pictures.ts would ship it');
  }
});

test('index.astro imports nothing of the old landing (D2, D3): no Gate, loader, site note, island, gems or scenes, no boot.ts and no shell.css, and of section 5 only what D18 mounts; the redesign\'s own files reach none of them either', () => {
  const OLD: [RegExp, string][] = [
    [/^src\/components\/shell\/(?:Gate|Loader|SiteNote)\.astro$/, 'the Gate, the loader and the site note (the family pages keep them)'],
    [/^src\/components\/(?:hero|room)\//, 'the old hero and section 4'],
    [/^src\/components\/signup\//, 'section 5: on /jars/ (D1), and on the landing page through Jars.astro alone (D18)'],
    [/^src\/components\/family\/FamilyLinks(?:Nav)?\.astro$/, 'the old ten links (the swatches took their place, D10)'],
    [/^src\/scripts\/hero\//, 'the island'],
    [/^src\/scripts\/(?:boot|signup\/signup)\.ts$/, 'the old page\'s boot script and section 5\'s page script'],
    [/^src\/styles\/(?:shell|room|signup|family-links)\.css$/, 'the old page\'s stylesheets'],
    [/^src\/config\/room\.ts$/, 'config/room.ts, whose eager glob would ship the ten loops'],
    [/^three(?:\/|$)/, 'three'],
  ];
  const mine = [INDEX, ...walk('src/components/redesign/'), ...walk('src/scripts/redesign/')].filter((f) => /\.(?:astro|ts)$/.test(f));
  assert.ok(mine.length >= 30, `${mine.length} files read`);
  let n = 0;
  for (const f of mine) for (const p of importsOf(f)) {
    n++;
    // D18's one way in: the jars' component mounts section 5 as built, whole, and nothing else of the redesign touches it
    if (f === component('Jars') && p === SECTION5) continue;
    for (const [re, what] of OLD) assert.doesNotMatch(p, re, `${f} imports ${p}: ${what}`);
  }
  assert.ok(n >= 80, `${n} imports read`);
  assert.ok(importsOf(component('Jars')).includes(SECTION5), 'Jars.astro mounts section 5 as built (components/signup/Signup.astro)');
  // until D19 the two steps mounted section 5's form from a script of the redesign's own; they left, and now no script of
  // the redesign reaches it: scripts/signup/signup.ts mounts it, inside section 5, as it did before the redesign
  assert.deepEqual(walk('src/scripts/redesign/').filter((f) => importsOf(f).includes('src/scripts/signup/form.ts')), [], 'a script of the redesign mounts the form');
  // and the quiz is the quiz, unedited (D11): its component, mounted by the quiz\'s way in
  assert.ok(importsOf(component('QuizCta')).includes('src/components/quiz/Quiz.astro'));
});

test('the sections carry RD_IDS in the page\'s order, one id each, and each says its tone as section 4\'s table has it (D5); the quiz\'s host is dark and hidden until asked for (D11); the jars keep section 5\'s #signup (D18), and the proof goes straight on to the countdown (D19, D20)', () => {
  assert.deepEqual([...RD_IDS], ['top', 'seen', 'families', 'glimpse', 'products', 'match', 'everyone', 'quiz', 'proof', 'launch', 'signup']);
  assert.equal(SECTIONS.length, RD_IDS.length);
  const TONE: Record<string, 'dark' | 'light'> = { top: 'dark', seen: 'light', families: 'light', glimpse: 'light', products: 'light', match: 'dark', everyone: 'light', quiz: 'light', proof: 'dark', signup: 'light', launch: 'light' };
  const all = walk('src/components/redesign/').filter((f) => f.endsWith('.astro'));
  SECTIONS.forEach((name, i) => {
    const id = RD_IDS[i] as string;
    if (name === 'Jars') {
      // section 5 keeps its own markup and its id (D18: "its markup, stylesheet and script are the old ones"); the
      // component around it is the part that says the tone, light, for the logotype and the index
      const t = template(component('Jars'));
      assert.equal(id, 'signup');
      assert.match(t, /<Signup\b/, 'Jars.astro mounts <Signup />');
      assert.match(t, /\bdata-tone="light"/, 'in a part that says data-tone="light"');
      assert.match(template(SECTION5), /<section class="signup" id="signup"/);
      for (const f of all) assert.doesNotMatch(template(f), /\bid="signup"/, `${f}: id="signup" is section 5's own on this page`);
      return;
    }
    const t = template(component(name));
    const tag = t.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>`))?.[0];
    assert.ok(tag, `${name}.astro is section#${id}`);
    assert.match(tag, /\bclass="rd-sec\b/, `${name}: a section of the page (.rd-sec)`);
    assert.match(tag, new RegExp(`\\bdata-tone="${TONE[id]}"`), `section#${id} is ${TONE[id]}`);
    for (const f of all) assert.equal((template(f).match(new RegExp(`\\bid="${id}"`, 'g')) ?? []).length, f === component(name) ? 1 : 0, `id="${id}" in ${f}`);
  });
  // a photograph band is dark and a light ground is said by name, so the logotype's tone can be read from the markup alone
  for (const f of all) for (const m of template(f).matchAll(/<(?:section|div|footer)\b[^>]*\bdata-(?:band|ground)="[^"]*"[^>]*>/g)) {
    const band = /\bdata-band=/.test(m[0]), night = /\bdata-ground="night"/.test(m[0]);
    if (/\bdata-tone=/.test(m[0])) assert.match(m[0], new RegExp(`\\bdata-tone="${band || night ? 'dark' : 'light'}"`), `${f}: ${m[0]}`);
  }
  const host = template(component('QuizCta')).match(/<div\b[^>]*\bid="quizHost"[^>]*>/)?.[0];
  assert.ok(host, 'QuizCta.astro holds div#quizHost');
  for (const want of [/\bclass="[^"]*\brd-quizhost\b/, /\bdata-tone="dark"/, /\shidden(?:[\s>=]|$)/]) assert.match(host, want);
});

test('D18 and D19, the jars close the landing page and are its one sign-up: its three files are the spec\'s, section 5 is mounted in that one place, form.ts is the archive\'s byte for byte, signup.ts differs from it by one guard, and no literal id is said twice across the page\'s sources', () => {
  for (const f of [component('Jars'), 'src/styles/rd-jars.css', 'src/scripts/redesign/jars.ts']) assert.ok(has(f), `${f} (spec section 13, "Changed for D18")`);
  // of the page's parts one mounts section 5, once, and the page itself does not
  const parts = [INDEX, ...walk('src/components/redesign/').filter((f) => f.endsWith('.astro'))];
  assert.deepEqual(parts.filter((f) => /<Signup\b/.test(template(f))), [component('Jars')], 'where section 5 is mounted on the landing page');
  assert.equal((template(component('Jars')).match(/<Signup\b/g) ?? []).length, 1);
  assert.deepEqual(parts.filter((f) => /<form\b/.test(template(f))), [], 'a form of the redesign\'s own: section 5\'s is the page\'s sign-up, and the quiz keeps its offer (D11)');
  // no id may be said twice on the page (criterion 4): the redesign's components, section 5, the quiz and the chrome, each
  // literal id once. The built page is held to the same by the post-build guard (build-modes.test.ts) and in the browser
  // by tests/e2e/redesign.spec.ts, where the scripts' ids are in it too
  const ids = (file: string) => [...template(file).matchAll(/\bid="([^"{}]+)"/g)].map((m) => m[1]);
  const jars = ids(SECTION5);
  assert.ok(jars.includes('signup') && jars.includes('suForm') && jars.some((id) => /^su[A-Z]/.test(id)), 'section 5 keeps its ids');
  const everywhere = [...walk('src/components/redesign/').filter((f) => f.endsWith('.astro')), SECTION5, 'src/components/quiz/Quiz.astro', 'src/components/shell/SiteNav.astro', 'src/components/shell/SiteLogo.astro', 'src/components/shell/BackToTop.astro'].flatMap(ids);
  assert.ok(everywhere.length >= 50, `${everywhere.length} ids read`);
  assert.deepEqual(everywhere.filter((id, k) => everywhere.indexOf(id) !== k), [], 'an id said twice on the landing page');
  // the form as it was before the redesign: D18 gave mountForm a prefix option for the two steps' sake, and D19 took it
  // away with them (spec criterion 8). The literal names stay in the chunk, the budget script's marker with them
  const form = read('src/scripts/signup/form.ts');
  assert.doesNotMatch(form, /\bprefix\b/, 'scripts/signup/form.ts has a prefix option again');
  assert.match(form, /querySelector<HTMLInputElement>\('#suEmail'\)/);
  assert.match(form, /suCodePill/);
  // read against the archive where this checkout has the ref (it is on GitHub), and said aloud where it has not
  const was = archived('src/scripts/signup/form.ts');
  if (was !== null) assert.equal(form, was, `scripts/signup/form.ts differs from ${ARCHIVE}`);
  else console.log(`# no ref ${ARCHIVE} here: form.ts was not compared with the archive`);
  // signup.ts differs by one guard: its writer of the logotype's tone stands down inside a part that says data-tone
  const signup = read('src/scripts/signup/signup.ts');
  const GUARD = /  \/\/ \(2026-11-09, docs\/specs\/redesign\.md D18\)[^\n]*\n  \/\/[^\n]*\n  \/\/[^\n]*\n  if \(logo && !root\.closest\('\[data-tone\]'\)\) \{\n/;
  assert.match(signup, GUARD, 'the guard');
  const wasSignup = archived('src/scripts/signup/signup.ts');
  if (wasSignup !== null) assert.equal(signup.replace(GUARD, '  if (logo) {\n'), wasSignup, `scripts/signup/signup.ts differs from ${ARCHIVE} by more than the guard`);
  // and the part around it says that tone, so the guard has something to read (the row above holds the markup)
  assert.match(template(component('Jars')), /<div class="rd-jarsec" data-tone="light">\s*<Signup \/>\s*<\/div>/);
});

test('the countdown (D13, D19 item 9, D20): the PDF\'s COMING SOON mark stands in #cdEyebrow where "Launch in" stood, named for assistive technology; three colons of the digits\' own dots stand between the pairs, hidden from assistive technology, and the glitch finds no pair in them', () => {
  const t = template(component('Launch'));
  // the mark inside the element the script writes the live line into at zero, so the line takes its place then (D20)
  assert.match(t, /<p class="eyebrow" id="cdEyebrow"><svg class="rd-launch-mark" viewBox="0 0 778 263" role="img" aria-label=\{RD_COPY\.launch\.soon\} focusable="false">/);
  assert.equal(RD_COPY.launch.soon, 'Coming soon');
  assert.doesNotMatch(read(component('Launch')).replace(/^\s*\/\/.*$/gm, ''), /COPY\.cd\.eyebrow|Launch in/, 'the old eyebrow\'s words on the slide');
  // its two handles: the bar's fill and the knob, moved by a transform on a scrub (launch.ts), the markup being the PDF's mark without it
  assert.match(t, /<rect class="rd-launch-fill"/);
  assert.match(t, /<circle class="rd-launch-knob"/);
  const launch = code('src/scripts/redesign/launch.ts');
  assert.match(launch, /\.fromTo\(fill, \{ scaleX: 0 \}, \{ scaleX: 1,/);
  assert.match(launch, /\.fromTo\(knob, \{ x: -ROAD \}, \{ x: 0,/);
  // a colon between each pair and the next, three of the four units' row, for the eye alone: no id, no name, nothing focusable
  assert.match(t, /\{i > 0 && <svg class="colon" viewBox=\{.*?\} aria-hidden="true" focusable="false"><use href="#rd-colon"\/><\/svg>\}/);
  assert.doesNotMatch(t.match(/<svg class="colon"[^>]*>/)![0], /\bid=/, 'a colon has no id');
  assert.match(read(component('Launch')), /^const units = \['d', 'h', 'm', 's'\] as const;$/m);
  // the timer is as it was: its role, its name, the digits as hidden text in the four spans
  assert.match(t, /<div class="count" id="count" role="timer" aria-label=\{COPY\.cd\.aria\}>/);
  assert.match(t, /<span class="sr-only" id=\{`cd-\$\{u\}`\}>00<\/span>/);
  // no pair for the glitch: it takes the row's div children for its four groups (install.ts), a colon is an svg child;
  // it finds the digits by #cdg-<unit>, and the colon's use sits outside those groups; its path's id does not begin dg-
  assert.match(read('src/scripts/logotype/install.ts'), /count\.querySelectorAll<HTMLElement>\(':scope > div'\)/);
  const inline = read('src/inline/countdown-launch.inline.js');
  assert.match(inline, /dots\(DG\.colon,'rd-colon'\);/);
  assert.match(inline, /DG\.rows\.forEach\(function\(rows,n\)\{dots\(rows,'dg-'\+n\)\}\);/);
  assert.match(inline, /box\.querySelectorAll\('#cdg-'\+u\+' use'\)/);
  // its bitmap is in the digits' grid and notation, 13 rows of 2 cells (Launch.astro stops the build on any other)
  const rows = COLON.split('/');
  assert.equal(rows.length, PAIR_H);
  for (const r of rows) assert.match(r, /^[.#]{2}$/);
  assert.equal(rows.filter((r) => r === '##').length, 4, 'two marks, each two dots tall');
  assert.equal(rows.join(''), [...rows].reverse().join(''), 'the marks stand evenly about the digits\' middle row');
  // laid out with the row, hidden until the first tick with the digits, gone at zero with them, still: no animation of its own
  const css = code('src/styles/rd-launch.css');
  assert.match(css, /\.rd-launch \.count \.colon \{ display: block; flex: none; width: calc\(6 \* var\(--rd-launch-dot\)\);/);
  assert.match(css, /\.rd-launch \.count:not\(\[data-ready\]\) :is\(\.n, \.colon\) \{ visibility: hidden; \}/);
  assert.match(css, /\.rd-launch \.count\[hidden\] \{ display: none; \}/);
  assert.doesNotMatch(css.match(/\.rd-launch \.count \.colon \{[^}]*\}/)![0], /animation|transition/);
});

test('DIFFERENT (D19 item 1, D20): plain Rubik Black at rest, the Rubik Glitch drawing only inside a burst, both on one baseline and one set of advances; the hero asks for Inter nowhere in code', () => {
  // the shape of RD_GLITCH_WORD since D20: the PDF's size and tracking, the two faces' shared numbers, each face's bearings
  assert.deepEqual(RD_GLITCH_WORD, { text: 'DIFFERENT', size: 117.25, advance: 5.87, cap: 0.7, track: -0.03, plain: { lsb: 0.055, rsb: 0.017 }, torn: { lsb: -0.04, rsb: -0.041 } });
  const manifest = read('scripts/fonts/manifest-redesign.txt');
  // the manifest measured the same advances in both files: that is why the torn letters lie on the plain ones
  for (const face of ['rubik-900-caps.woff2', 'rubik-glitch-400-caps.woff2']) {
    const block = manifest.slice(manifest.indexOf(face));
    assert.match(block, /advances, in em: DIFFERENT 5\.8700;/, face);
    assert.match(block, /cap 0\.700,/, face);
  }
  const hero = template(component('Hero')).replace(/<script\b[\s\S]*?<\/script>/g, '');
  // at rest: HTML letters in the word's face, and over them a layer that draws nothing until the engine fills .gl-tiles
  assert.match(hero, /<span class="rd-hero-word" aria-hidden="true">/);
  assert.match(hero, /<g class="gl-tiles" display="none"><\/g>/);
  assert.match(hero, /<text class="rd-hero-g" data-g="plain" x=\{origin\} y=\{baseline\} font-family="Rubik, Arial, sans-serif" font-weight="900" font-size=\{U\} letter-spacing=\{track\}/);
  assert.match(hero, /<text class="rd-hero-g" data-g="face" display="none" x=\{origin\} y=\{baseline\} font-family="Rubik Glitch, Arial, sans-serif" font-weight="400" font-size=\{U\} letter-spacing=\{track\}/);
  const css = code('src/styles/rd-hero.css');
  assert.match(css, /\.rd-hero-word \{[^}]*font-family: var\(--rd-word\); font-weight: 900; font-size: calc\(117\.25em \/ 110\.26\);[^}]*letter-spacing: -0\.03em;/, 'the PDF\'s size and tracking, in the headline\'s own em');
  assert.match(css, /\.rd-hero-word\.is-glitch \.rd-ln \{ visibility: hidden; \}/, 'the plain letters give way for exactly the burst');
  assert.match(code('src/styles/redesign.css'), /--rd-word: "Rubik", "Inter", Arial, sans-serif;/);
  // the swap hangs on the engine's own switch, and the torn face is asked for after the first paint, never preloaded
  const js = code('src/scripts/redesign/hero.ts');
  assert.match(js, /new MutationObserver\(\(\) => word\.classList\.toggle\('is-glitch', layer\.getAttribute\('display'\) !== 'none'\)\)/);
  assert.match(js, /const FACE = '400 1em "Rubik Glitch"';/);
  assert.match(js, /document\.fonts\?\.load\(FACE,/);
  assert.match(js, /const faced = Promise\.all\(\[painted, pictured\]\)\.then\(/);
  assert.match(js, /createLogoGlitch\(svg, \{ split: LOGO_SPLIT, idle: 0, interactive: false,/, 'the logotype\'s engine, its own idle off: the word\'s bursts are timed here');
  assert.doesNotMatch(hero, /\bInter\b/, 'the fallback of the SVG word is Arial since D20');
});

test('the cue (D15, D19 item 2): its three chevrons run the old cue\'s cycle, stop only once it has faded out and go on at the top', () => {
  const hero = template(component('Hero'));
  assert.match(hero, /<svg class="rd-hero-cue-chev" viewBox="0 0 35 146" aria-hidden="true" focusable="false">\{CHEVRONS\.map\(\(c\) => <g class=\{`rd-hero-chev rd-hero-chev--\$\{c\.at\}`\}>/);
  assert.match(read(component('Hero')), /^const CHEVRONS = \[\{ at: 'top', y: \[[^\]]*\] \}, \{ at: 'mid', y: \[[^\]]*\] \}, \{ at: 'bottom', y: \[[^\]]*\] \}\];$/m);
  const css = code('src/styles/rd-hero.css');
  assert.match(css, /\.rd-hero-chev \{[^}]*animation-duration: 2\.5s; animation-timing-function: linear; animation-iteration-count: infinite;/, '2.5 s a cycle, for as long as the cue shows');
  // the same cycle as the old landing's (shell.css, kept on disk): each chevron's stops, opacities and transforms, by name
  const stops = (sheet: string, name: string) => {
    const at = sheet.indexOf(`@keyframes ${name}`);
    assert.ok(at >= 0, `@keyframes ${name}`);
    // the block ends where the next @keyframes or rule begins at the head of a line; a stop's braces hold no brace
    const block = sheet.slice(at, sheet.slice(at + 1).search(/\n(?:@|\.|\/\*)/) + at + 1);
    return [...block.matchAll(/(\d+)%\s*\{\s*opacity:\s*([\d.]+);\s*transform:\s*([^;}]+)/g)].map((m) => [m[1], m[2], m[3].replace(/\s+/g, '')]);
  };
  const shell = read('src/styles/shell.css');
  for (const at of ['top', 'mid', 'bottom']) {
    assert.match(css, new RegExp(`\\.rd-hero-chev--${at} \\{ animation-name: rd-hero-chev-${at}; \\}`));
    const mine = stops(css, `rd-hero-chev-${at}`);
    assert.ok(mine.length >= 5, `${at}: ${mine.length} stops read`);
    assert.deepEqual(mine, stops(shell, `cue-${at}`), `${at}: the old cue's stops`);
  }
  // they rest once the cue has faded out and go on as it returns; the script only ever names the two classes
  assert.match(css, /\.rd-hero-cue\.is-still \.rd-hero-chev \{ animation-play-state: paused; \}/);
  const js = code('src/scripts/redesign/hero.ts');
  assert.match(js, /if \(off\) still = window\.setTimeout\(\(\) => cue\?\.classList\.add\('is-still'\), CUE_FADE\);/);
  assert.match(js, /else cue\?\.classList\.remove\('is-still'\);/);
  assert.match(js, /^const CUE_FADE = 500;$/m);
});

test('the fans at the scrub\'s end (D10, D19 item 3): every case opaque, the same step in every fan, a quarter of a case, and four equal spaces: the stylesheet\'s numbers, and nothing that touches an opacity on a case', () => {
  const css = code('src/styles/rd-seen.css');
  const num = (name: string) => Number(css.match(new RegExp(`--${name}: ([\\d.]+);`))?.[1]);
  const cu = num('rd-seen-cu'), step = num('rd-seen-step');
  assert.equal(cu, 169.4, 'a case, in units of the PDF');
  assert.equal(step, 42, 'one step: a quarter of a case to the nearest unit, the clip\'s last frame');
  assert.equal(Math.round(cu / 4), step);
  // a fan is a case and three steps; the three fans leave four equal spaces of the 1024.5u page, 34.575u each
  assert.match(css, /--rd-seen-fan: calc\(var\(--rd-seen-cu\) \+ 3 \* var\(--rd-seen-step\)\);/);
  assert.match(css, /--rd-seen-gap: calc\(\(1024\.5 - 3 \* var\(--rd-seen-fan\)\) \/ 4\);/);
  assert.ok(Math.abs((1024.5 - 3 * (cu + 3 * step)) / 4 - 34.575) < 1e-9);
  // the wide row shares the ground out evenly: the same space at the left edge, between the fans and at the right edge
  assert.match(css, /\.rd-seen-row \{ position: absolute;[^}]*justify-content: space-evenly; gap: 0;/);
  // one, two and three steps to the right of the front case, each behind the one before
  assert.match(css, /\.rd-seen-case--2 \{ left: calc\(var\(--rd-seen-step\) \* var\(--rd-seen-k\)\); z-index: 3; \}/);
  assert.match(css, /\.rd-seen-case--3 \{ left: calc\(2 \* var\(--rd-seen-step\) \* var\(--rd-seen-k\)\); z-index: 2; \}/);
  assert.match(css, /\.rd-seen-case--4 \{ left: calc\(3 \* var\(--rd-seen-step\) \* var\(--rd-seen-k\)\); z-index: 1; \}/);
  // opaque throughout: no rule on a case or a fan names an opacity, and no tween does; the one opacity of the scrub is the second line's black copy
  for (const m of css.matchAll(/([^{}]*\.rd-seen-(?:case|fan|row|view)[^{}]*)\{([^}]*)\}/g)) assert.doesNotMatch(m[2], /opacity/, m[1].trim());
  const js = code('src/scripts/redesign/seen.ts');
  assert.deepEqual([...js.matchAll(/^.*\bopacity\b.*$/gm)].map((m) => m[0].trim()), ['inks.forEach((w, i) => { tl.to(w, { opacity: 1, duration: 0.05 }, plan.line + 0.075 + i * 0.022); });']);
  assert.doesNotMatch(js, /autoAlpha/);
  // a back case closes by a share of its own width, the stylesheet's two numbers read by the script, and slides home at rest
  assert.match(js, /tl\.from\(el, \{ xPercent: -100 \* \(n - 1\) \* step, duration: d, ease: 'power3\.out' \}, t\);/);
  assert.match(js, /parseFloat\(look\.getPropertyValue\('--rd-seen-step'\)\)/);
  assert.match(js, /parseFloat\(look\.getPropertyValue\('--rd-seen-cu'\)\)/);
  // twelve real pictures, four to a fan, only the front case named for assistive technology
  const seen = template(component('Seen'));
  assert.match(seen, /\{\[1, 2, 3, 4\]\.map\(\(n\) => \(\s*<RdPicture name=\{`case-\$\{fan\.id\}-\$\{n\}`\} alt=\{n === 1 \? fan\.alt : ''\}/);
  assert.deepEqual(RD_COPY.seen.fans.map((f) => f.id), ['grey', 'blue', 'brown']);
});

test('the ten swatches (D10, D19 item 4): one per family in the row\'s order, each a link to its family page on a real catalog shade of that family, its picture the PDF\'s or the same brush; the blobs are the PDF\'s own, as pictures (D21)', () => {
  const swatches = RD_COPY.families.swatches;
  const shades = JSON.parse(read('docs/data/shades-240.json')) as { families: { id: string; shades: { id: string; n?: number; name: string }[] }[] };
  const families = shades.families.map((f) => f.id);
  assert.equal(families.length, 10);
  assert.equal(swatches.length, 10);
  assert.deepEqual(swatches.map((s) => s.family).sort(), [...families].sort(), 'each of the ten families, once');
  for (const s of swatches) {
    const fam = shades.families.find((f) => f.id === s.family)!;
    assert.ok(fam.shades.some((sh) => sh.id === s.shade), `${s.shade} is a shade of ${s.family}`);
    assert.equal(s.picture, `swatch-${s.family}`, `${s.family}: its picture`);
  }
  // the PDF's six first, as its frame has them left to right, then the four of the same brush
  assert.deepEqual(swatches.slice(0, 6).map((s) => s.family), ['frosty-white', 'playful-pink', 'stormy-grey', 'basic-brown', 'blissful-blue', 'vivid-violet']);
  // a picture in its place in the row, its name and its count as a link's words; the address is built from the catalog, and the build stops on a row that fails any of this
  const t = template(component('Families'));
  const astro = read(component('Families'));
  assert.match(t, /<RdPicture name=\{s\.picture\} alt="" sizes=\{SIZES\}/);
  assert.match(astro, /href: pagesOn \? `\$\{familyHref\(family\)\}\?shade=\$\{shade\.nnn\}` : undefined/);
  assert.match(astro, /has \$\{n\} swatches, not one/);
  assert.match(astro, /is no shade of \$\{family\.slug\}/);
  assert.match(astro, /stands for \$\{said\}, not \$\{shade\.id\}/);
  // the row is ten pictures and no drawing of ours: no catalog hex is painted here (D19 withdrew the circles in the gems' key shades)
  assert.doesNotMatch(code('src/styles/rd-families.css'), /--shade-|var\(--rd-blob/);
  // the three blobs: the PDF's own paths as pictures, the words over them words
  assert.deepEqual([...RD_COPY.families.blobs], ['grey', 'blue', 'brown']);
  assert.match(t, /<RdPicture name=\{`blob-\$\{word\}`\} alt="" sizes=\{BLOB_SIZES\}/);
  // the encoded files, where this checkout has them: each swatch and blob with its record, the swatch's naming its shade
  if (has('src/assets/redesign/index.json')) {
    const index = JSON.parse(read('src/assets/redesign/index.json')) as Record<string, { shade?: string; alpha?: boolean }>;
    for (const s of swatches) { assert.equal(index[s.picture]?.shade, s.shade, s.picture); assert.equal(index[s.picture]?.alpha, true, `${s.picture}: its own brush edge`); }
    for (const word of RD_COPY.families.blobs) assert.equal(index[`blob-${word}`]?.alpha, true, `blob-${word}: a true alpha`);
  }
});

test('the picker (D10, D19 items 5 and 6, D21): a pointer over a dot changes the shade with nothing pressed, a tap, a click and the arrow keys are still the radios\' own; the dot\'s colour is said in three places and they agree; five equal discs that nothing in the row changes', () => {
  const js = code('src/scripts/redesign/glimpse.ts');
  // the hover: the pointer's own movement over the group, a finger and a pen on the glass left to their tap
  const move = js.match(/group\.addEventListener\('pointermove', \(e\) => \{([\s\S]*?)\}, QUIET\);/)?.[1] ?? '';
  assert.match(move, /if \(e\.pointerType === 'touch' \|\| \(e\.pointerType === 'pen' && e\.buttons !== 0\) \|\| !\(t instanceof HTMLInputElement\)\) return;/);
  assert.match(move, /takeOver\(\);\s*choose\(t\.value, SAY_MS\);/, 'at once, and no press asked for');
  // the radios' own change still takes a tap, a click and the arrow keys
  assert.match(js, /group\.addEventListener\('change', \(e\) => \{[\s\S]*?takeOver\(\);\s*choose\(t\.value\);\s*\}, QUIET\);/);
  // no key listener of ours moves the choice and every listener of the picker is passive
  assert.doesNotMatch(js, /preventDefault/);
  assert.doesNotMatch(js, /addEventListener\('keydown', \(/, 'the arrow keys are the browser\'s own on the radios');
  // leaving the dots changes nothing: the last shade stays, and no pointerleave or mouseout puts one back
  assert.doesNotMatch(js, /pointerleave|pointerout|mouseleave|mouseout/);
  // the demo's cursor glides and presses nothing: it reaches the same choose(), and never a click or a checked of its own
  assert.doesNotMatch(js, /\.click\(\)/);
  assert.match(js, /const arrive = \(\): void => \{ if \(!over && !taken\) \{ over = true; choose\(d\.id\); \} \};/);
  // the dots are real radios and the row is the radiogroup, hidden until the script lifts it (no script: the frame's shade)
  const t = template(component('Glimpse'));
  assert.match(t, /<div class="rd-glimpse-dots" role="radiogroup" aria-label=\{g\.aria\} hidden>/);
  assert.match(t, /<input class="rd-glimpse-radio" type="radio" name="rd-glimpse-shade" value=\{s\.id\} checked=\{s\.id === first\.id\} \/>/);
  // the colour on each dot, said three times: the config, the stylesheet, the picture's own record (the build stops if they part)
  const css = code('src/styles/rd-glimpse.css');
  const shades = RD_COPY.glimpse.shades;
  assert.deepEqual(shades.map((s) => s.dot), ['#023A5D', '#89D6E0', '#619799', '#74BCA8', '#A5CC93'], 'the frame\'s own five flat colours');
  const index = has('src/assets/redesign/index.json') ? JSON.parse(read('src/assets/redesign/index.json')) as Record<string, { hex?: string }> : null;
  for (const s of shades) {
    assert.ok(css.includes(`.rd-glimpse-dot[data-shade="${s.id}"] { color: ${s.dot}; }`), `${s.id}: rd-glimpse.css`);
    if (index) assert.equal(index[`picker-${s.id}`]?.hex?.toLowerCase(), s.dot.toLowerCase(), `${s.id}: the picture's record`);
  }
  assert.match(read(component('Glimpse')), /and rd-glimpse\.css has no rule that says so/);
  assert.match(read(component('Glimpse')), /and its picture was painted for \$\{painted\}/);
  // the row itself never changes: five equal discs, each later one over the one before, with no rule for the chosen one and no ring on it
  assert.doesNotMatch(css, /\.rd-glimpse-radio:checked|\.rd-glimpse-dot:has\(/);
  assert.doesNotMatch(css, /\.rd-glimpse-disc \{[^}]*z-index/);
  assert.match(css, /\.rd-glimpse-disc \{ position: absolute; left: 0; top: 0; width: var\(--gl-disc\); height: var\(--gl-disc\);/);
  // the masters' size and the five names, where the checkout has the pictures: 1560 by 1500, the clean recut of D19 item 6
  if (index) {
    const all = index as Record<string, { width?: number; height?: number }>;
    for (const s of shades) assert.deepEqual([all[`picker-${s.id}`]?.width, all[`picker-${s.id}`]?.height], [1560, 1500], s.id);
  }
});

test('the headline numbers are said twice and agree: redesign.css\'s data-h rules against RD_HEADLINES (size in u, tracking in em, line pitch); what a headline is read as is what it draws', () => {
  const css = read('src/styles/redesign.css');
  const rules = new Map([...css.matchAll(/^\.rd-h\[data-h="([a-z]+)"\] \{([^}]*)\}$/gm)].map((m) => [m[1], m[2]]));
  assert.deepEqual([...rules.keys()].sort(), Object.keys(RD_HEADLINES).sort(), 'one rule a headline, and no rule without one');
  const num = (body: string, name: string, unit = '') => { const m = body.match(new RegExp(`--${name}: (-?[\\d.]+)${unit};`)); assert.ok(m, `--${name} in ${body}`); return Number(m[1]); };
  for (const [key, h] of Object.entries(RD_HEADLINES)) {
    const body = rules.get(key)!;
    assert.equal(num(body, 'size'), h.size, `${key}: size`);
    assert.equal(num(body, 'track', 'em'), h.track, `${key}: tracking`);
    assert.equal(num(body, 'lh'), h.lh, `${key}: line pitch`);
    assert.ok(num(body, 'hk') >= 1, `${key}: the phone factor never shrinks a headline (section 5)`);
    // the lines as drawn, joined, are the phrase as read (the hero's third line is the glitch word's)
    const drawn = [...h.lines.map((ln) => ln.map((seg) => seg.t).join('')), ...(key === 'hero' ? [RD_GLITCH_WORD.text] : [])].join(' ').replace(/\s+/g, ' ');
    assert.equal(drawn, h.say.toUpperCase(), `${key}: aria-label against the letters`);
    assert.equal(drawn, drawn.toUpperCase(), `${key}: the PDF's capitals are in the config, not made by CSS`);
  }
  assert.match(css, /^\.rd-h \{[^}]*font-family: var\(--rd-display\); font-weight: 500;[^}]*text-transform: none;/m, 'Inter 500, the capitals typed');
  // one unit is a 1024.5th of the page's width, capped where the page is 1600 px wide (D8)
  assert.match(css, /--rd-u: calc\(min\(100vw, 1600px\) \/ 1024\.5\);/);
  // the bands' veils and crops are said twice too; the veils are the PDF's as measured with its white text masked (spec
  // section 4): four bands since the sign-up's photograph and the band left (D19, D20)
  for (const [key, b] of Object.entries(RD_BANDS)) assert.match(css, new RegExp(`^\\.rd-band\\[data-band="${key}"\\] \\{ --veil: ${b.veil}; --fx: ${b.focus[0]}%; --fy: ${b.focus[1]}%; \\}$`, 'm'), `${key}: the veil and the wide crop`);
  assert.deepEqual(Object.fromEntries(Object.entries(RD_BANDS).map(([key, b]) => [key, b.veil])), { hero: 0.6, glimpse: 0.6, match: 0.6, proof: 0.45 });
});

/** every string under a value, with its path for the message */
function strings(v: unknown, at: string, out: [string, string][] = []): [string, string][] {
  if (typeof v === 'string') out.push([at, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${at}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, `${at}.${k}`, out);
  return out;
}

test('copy (section 3): no em or en dash, no emoji, no rule-17 buzzword and no straight apostrophe in any string of the config; the quiz paragraph in British spelling; the figures the PDF gives', () => {
  const all = [...strings(RD_COPY, 'RD_COPY'), ...strings(RD_HEADLINES, 'RD_HEADLINES'), ...strings(RD_GLITCH_WORD, 'RD_GLITCH_WORD'), ...strings(RD_JARS, 'RD_JARS')];
  assert.ok(all.length >= 120, `${all.length} strings read`);
  for (const [at, s] of all) {
    assert.doesNotMatch(s, /[\u2014\u2013]/, `${at}: a dash`);
    assert.doesNotMatch(s, /\p{Extended_Pictographic}/u, `${at}: an emoji`);
    assert.doesNotMatch(s, /seamless|elevate|unleash|next-level|revolutionary/i, `${at}: rule 17`);
    assert.doesNotMatch(s, /['\u2018`]/, `${at}: a straight or an opening apostrophe (the page's is U+2019)`);
    assert.equal(s, s.normalize('NFC'), at);
  }
  const body = RD_COPY.quiz.body;
  assert.ok(body.includes('analysing') && body.includes('behavioural'), 'the PDF\'s "analyzing" and "behavioral", respelt');
  assert.doesNotMatch(body, /analyz|behavior(?!al)|behavioral/);
  assert.ok(body.includes('we’ve') && body.includes('Skreed’s') && body.includes('98% accuracy') && body.startsWith('Two hundred and forty shades'));
  assert.equal(RD_COPY.quiz.cta, 'Let’s find it');
  assert.equal(RD_COPY.quiz.ctaPlain + RD_COPY.quiz.ctaPill, RD_COPY.quiz.cta, 'the pill begins inside the same words');
  // the PDF's words where the spec gives them whole
  assert.equal(RD_COPY.seen.first, 'what you’ve seen so far');
  assert.equal(RD_COPY.seen.second, 'is about to change');
  assert.deepEqual([...RD_COPY.families.blobs], ['grey', 'blue', 'brown']);
  assert.equal(RD_COPY.families.lead, 'You’re used to choosing from what’s available.');
  assert.equal(RD_COPY.families.count, '24 SHADES');
  assert.deepEqual(RD_COPY.products.items.map((i) => i.label), ['PHONE CASE', 'AIRPODS CASE', 'LENSKIN', 'MAGSOCKET', 'MAGSAFE WALLET']);
  assert.deepEqual(RD_COPY.everyone.tiles.map((t) => t.label), ['MONOCHROME', 'LIFESTYLE INSPIRED', 'PEPPY PATTERNS', 'PASTEL PAIRINGS', 'CORPORATE READY']);
  assert.equal(`${RD_COPY.match.first} ${RD_COPY.match.second}`, 'MATCH ESSENTIALS');
  // the two steps' words left with them (D19), and with them the page's 15%: the jars' 5 + 5 + 10 is its one offer. This
  // row read the sub-line and the panel's line until then; what still matters of it is that the words are gone from the whole config
  const said = all.map(([, s]) => s).join('\n');
  assert.doesNotMatch(said, /15% off|exclusive discounts|No spam, we promise/, 'a line of the two steps');
  assert.equal(RD_COPY.launch.soon, 'Coming soon', 'the PDF\'s mark, by name (D20)');
  assert.equal(RD_COPY.footer.tagline, 'Tech Essentials That Go Beyond Basic.');
  // the picker's five shades are catalog ids, Sage the one line the PDF gives; the four proposed lines are marked so
  const shades = JSON.parse(read('docs/data/shades-240.json')) as { families: { id: string; shades: { id: string; name: string }[] }[] };
  const byId = new Map(shades.families.flatMap((f) => f.shades.map((sh) => [sh.id, sh.name] as const)));
  assert.deepEqual(RD_COPY.glimpse.shades.map((sh) => byId.get(sh.id)), ['Navy', 'Powder', 'Teal', 'Mint', 'Sage']);
  assert.deepEqual(RD_COPY.glimpse.shades.filter((sh) => !sh.proposed).map((sh) => sh.line), ['Moss on a rainy day.']);
  assert.equal(RD_COPY.glimpse.start, RD_COPY.glimpse.shades.at(-1)!.id);
});

test('the four catalog product descriptions are ROOM_PRODUCTS\' lines, word for word (section 3), read from config/room.ts as text; MagSocket\'s is marked proposed', () => {
  // room.ts is never imported, here or by the page: its eager glob would pull section 4's loops into whatever reads it
  for (const f of OWN.filter((p) => !p.endsWith('.css'))) assert.ok(!importsOf(f).includes('src/config/room.ts'), `${f} imports config/room.ts`);
  const src = read('src/config/room.ts');
  const table = src.slice(src.indexOf('export const ROOM_PRODUCTS'), src.indexOf(']);', src.indexOf('export const ROOM_PRODUCTS')));
  const lines = new Map([...table.matchAll(/\{ id: '([a-z-]+)', name: '[^']+', line: (?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)") \}/g)].map((m) => [m[1], m[2] ?? m[3]]));
  assert.deepEqual([...lines.keys()], ['case', 'wallet', 'lenskin', 'airpods', 'airpods-max'], 'the catalog\'s five, read whole');
  const items = RD_COPY.products.items;
  assert.deepEqual(items.map((i) => i.id), ['case', 'airpods', 'lenskin', 'magsocket', 'wallet'], 'the PDF\'s order, left to right');
  for (const id of ['case', 'airpods', 'lenskin', 'wallet']) {
    const item = items.find((i) => i.id === id)!;
    // word for word; the one difference is the page's apostrophe (U+2019), which room.ts types straight
    assert.equal(item.text, lines.get(id)!.replace(/'/g, '’'), id);
    assert.ok(!('proposed' in item), `${id}: the catalog's own line`);
  }
  const mag = items.find((i) => i.id === 'magsocket')!;
  assert.ok('proposed' in mag && mag.proposed === true, 'no catalog line for the MagSocket: proposed, for Sam (spec 12, item 6)');
  assert.ok(![...lines.values()].includes(mag.text));
});

test('the redesign\'s files hold no style attribute (the CSP), no Reduce motion query (E-3D-only), no box-shadow, backdrop-filter or gradient (the Never-do list) and no em or en dash, comments included', () => {
  // (floors of the files this reads, so a walk that came back short is not read as a clean page: 45 and 12 until the two
  // steps and the band took six files with them, D19 and D20)
  assert.ok(SHEETS.length >= 12 && SHEETS.includes('src/styles/redesign.css'), `${SHEETS.length} stylesheets read`);
  assert.ok(OWN.length >= 40, `${OWN.length} files read`);
  for (const f of OWN) {
    const raw = read(f);
    assert.doesNotMatch(raw, /[\u2014\u2013]/, `${f}: an em or en dash`);
    assert.doesNotMatch(raw, /\p{Extended_Pictographic}/u, `${f}: an emoji`);
    const c = code(f);
    assert.doesNotMatch(c, /box-shadow|boxShadow|backdrop-filter|backdropFilter|gradient\(/, `${f}: a shadow, a backdrop filter or a gradient`);
    // a style attribute in markup, written in a template or built in a string; the CSSOM (el.style.x = ...) is the CSP's way
    if (f.endsWith('.astro')) assert.doesNotMatch(template(f).replace(/<script\b[\s\S]*?<\/script>/g, ''), /<[A-Za-z][^<>]*\sstyle\s*=/, `${f}: a style attribute in the template`);
    if (!f.endsWith('.css')) assert.doesNotMatch(c, /<[a-z][^<>]*\sstyle\s*=|setAttribute\(\s*['"`]style['"`]/i, `${f}: a style attribute written by script`);
    // Reduce motion: no query in a stylesheet or a component; among the scripts, motion.ts names it once, in the branch
    // the site's flag would turn on (3d-only.test.ts holds that line word for word)
    const hits = (c.match(/prefers-reduced-motion/g) ?? []).length;
    assert.equal(hits, f === 'src/scripts/redesign/motion.ts' ? 1 : 0, `${f}: prefers-reduced-motion`);
  }
});

test('the motion arrives by import() and takes no scroll (D16): GSAP and ScrollTrigger from motion.ts alone, no SplitText and no smooth-scroll library, no wheel or touch listener that could hold the page', () => {
  const scripts = [INDEX, ...walk('src/components/redesign/'), ...walk('src/scripts/redesign/')].filter((f) => /\.(?:astro|ts)$/.test(f));
  for (const f of scripts) {
    const c = code(f);
    // the kit is a type everywhere and a module in one place: a static import in any section would put 44 KB in the critical JS
    for (const m of c.matchAll(/^.*\bfrom\s+['"]gsap(?:\/[A-Za-z]+)?['"].*$/gm)) assert.match(m[0], /^\s*import type\b/, `${f}: ${m[0].trim()}`);
    assert.equal(/\bimport\(\s*['"]gsap(?:\/[A-Za-z]+)?['"]\s*\)/.test(c), f === 'src/scripts/redesign/motion.ts', `${f}: import('gsap')`);
    // of GSAP's own modules the page takes the core and ScrollTrigger: no SplitText (the headlines are split at build),
    // no ScrollSmoother, ScrollToPlugin or Observer, and no smooth-scroll library beside it
    for (const m of c.matchAll(/['"]gsap\/([A-Za-z]+)['"]/g)) assert.equal(m[1], 'ScrollTrigger', `${f}: gsap/${m[1]}`);
    assert.doesNotMatch(c, /SplitText|ScrollSmoother|ScrollToPlugin|lenis|locomotive-scroll/i, `${f}: the headlines are split at build, and nothing eases the scroll`);
    // wheel, touch and keys stay the browser's: a listener on the wheel or a touch is passive, or it is not there
    assert.doesNotMatch(c, /passive:\s*false/, `${f}: a listener that may prevent default`);
    for (const m of c.matchAll(/addEventListener\(\s*['"`](?:wheel|mousewheel|DOMMouseScroll|touchstart|touchmove|touchend)['"`][^\n]*/g)) assert.match(m[0], /passive:\s*true/, `${f}: ${m[0]}`);
    assert.doesNotMatch(c, /\bonwheel\b|\bontouchmove\b|scroll-behavior|scrollBehavior/, f);
  }
  const motion = read('src/scripts/redesign/motion.ts');
  assert.match(motion, /await Promise\.all\(\[import\('gsap'\), import\('gsap\/ScrollTrigger'\)\]\)/);
  assert.match(motion, /const mm = k\.gsap\.matchMedia\(\);/, 'every tween inside gsap.matchMedia() (CLAUDE.md, Always do)');
  // the page restored from the back-forward cache measures again, and nothing listens for unload (section 6)
  assert.match(motion, /addEventListener\('pageshow', \(e\) => \{ if \(e\.persisted\) refresh\(\); \}\);/);
  // one start, however it is reached: a second run would give every entrance a second tween whose end is the first's
  // hidden start. A chunk that does not come is caught, and the page stands complete without it (D16)
  assert.match(motion, /if \(asked\) return;\s*asked = true;/);
  assert.match(motion, /motionKit\(\)\.then\(\(k\) => \{ started = true; run\(k\); \}\)\.catch\(\(\) => \{/);
  // and the triggers are measured again when the page's height changes after load (a picture's box, the quiz, a form's step)
  assert.match(motion, /new ResizeObserver\(\(\) => \{[\s\S]*?t = window\.setTimeout\(refresh, 200\);[\s\S]*?\}\)\.observe\(document\.body\);/);
  // a headline is a column of lines, its lines' negative margins kept apart: as blocks they collapsed and every line after the first stood low
  assert.match(code('src/styles/redesign.css'), /\.rd-split \{ display: flex; flex-direction: column; \}/);
  // no stylesheet eases the scroll either, and the one sticky scene is the spec's (pins: #seen only)
  for (const f of SHEETS) {
    const c = code(f);
    // (the products row snaps sideways inside itself on a phone, section 5: an x snap is the row's own, a y snap would be the page's)
    assert.doesNotMatch(c, /scroll-behavior\s*:\s*smooth|scroll-snap-type\s*:[^;]*\b(?:y|both|block)\b/, `${f}: the page's own scroll is eased or snapped`);
    if (/position:\s*sticky/.test(c)) assert.equal(f, 'src/styles/rd-seen.css', `${f}: a sticky scene outside #seen`);
  }
  for (const f of scripts) assert.doesNotMatch(code(f).replace(/\s+/g, ' '), /\bpin:\s*(?!false\b)[\w!'"`(]/, `${f}: only #seen may pin, and it pins by CSS`);
});

test('the four display faces (D7, D20, E-RD-font): each file under its line, the same bytes in public/fonts and docs/brand/fonts, its licence beside it, declared by redesign.css alone, recorded in the manifest and built by its script', () => {
  // three until D20 ("Yes, download"): Rubik at its Black weight is the fourth, first and the one in the first view; each cap is scripts/fonts/build-redesign.py's
  const FACES = [
    { file: 'rubik-900-caps.woff2', family: 'Rubik', weight: 900, cap: 12_000, licence: 'rubik-OFL.txt' },
    { file: 'rubik-glitch-400-caps.woff2', family: 'Rubik Glitch', weight: 400, cap: 30_000, licence: 'rubik-glitch-OFL.txt' },
    { file: 'skreed-wide-400-caps.woff2', family: 'Skreed Wide', weight: 400, cap: 12_000, licence: 'krona-one-OFL.txt' },
    { file: 'windsong-400-lower.woff2', family: 'WindSong', weight: 400, cap: 16_000, licence: 'windsong-OFL.txt' },
  ];
  const css = read('src/styles/redesign.css');
  const manifest = read('scripts/fonts/manifest-redesign.txt');
  const script = read('scripts/fonts/build-redesign.py');
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.deepEqual(faces.map((f) => f.match(/font-family:\s*"([^"]+)"/)?.[1]), FACES.map((f) => f.family), 'four faces, in this order, and no other');
  assert.match(manifest, /^4 files, \d+ bytes/m, 'the manifest\'s own count');
  for (const [i, face] of FACES.entries()) {
    assert.ok(has(`public/fonts/${face.file}`), `public/fonts/${face.file}`);
    const pub = bytes(`public/fonts/${face.file}`);
    assert.ok(pub.length > 0 && pub.length <= face.cap, `${face.file}: ${pub.length} bytes against ${face.cap}`);
    assert.equal(pub.toString('latin1', 0, 4), 'wOF2');
    assert.ok(pub.equals(bytes(`docs/brand/fonts/${face.file}`)), `${face.file}: the two copies differ`);
    const licence = read(`docs/brand/fonts/${face.licence}`);
    assert.match(licence, /SIL Open Font License, Version 1\.1/, face.licence);
    assert.match(faces[i], new RegExp(`src:\\s*url\\(/fonts/${face.file.replace(/\./g, '\\.')}\\) format\\("woff2"\\)`), `${face.family}: its file`);
    assert.match(faces[i], new RegExp(`font-weight:\\s*${face.weight};\\s*font-style:\\s*normal;`), `${face.family}: one upright weight, ${face.weight}`);
    assert.match(manifest, new RegExp(`^${face.file.replace(/\./g, '\\.')}\\s+${pub.length} bytes\\b`, 'm'), `${face.file} in the manifest at its size`);
    assert.ok(manifest.includes(`licence ${face.licence}`), `${face.licence} named in the manifest`);
    assert.ok(script.includes(`"${face.file}"`) && script.includes(`"${face.licence}"`), `scripts/fonts/build-redesign.py builds ${face.file}`);
  }
  // Krona One's licence reserves the original's name, so the cut file carries a name of its own, and that is the
  // family every rule asks for (a comment may say where the face came from; no declaration names the original)
  assert.match(read('docs/brand/fonts/krona-one-OFL.txt'), /Reserved Font Name/i);
  assert.match(manifest, /renamed to "Skreed Wide"/);
  for (const f of OWN) assert.doesNotMatch(code(f), /Krona/, `${f} asks for the original by name`);
  // only this page ships the four: no other stylesheet declares them or fetches their files (a comment may point at one)
  for (const f of walk('src/styles/').filter((p) => p.endsWith('.css') && p !== 'src/styles/redesign.css')) {
    assert.doesNotMatch(code(f), /rubik-900-caps|rubik-glitch-400-caps|skreed-wide-400-caps|windsong-400-lower/, `${f} fetches one of the four`);
    assert.doesNotMatch(code(f), /@font-face\s*\{[^}]*font-family:\s*"(?:Rubik|Rubik Glitch|Skreed Wide|WindSong)"/, `${f} declares one of the four`);
  }
  // what the page preloads is what its first screen draws: the headline's face, DIFFERENT's at rest (D20), the index's
  // words and the cue's. Until D19 this row asked for Rubik Glitch here: the torn face is no part of the first paint now,
  // fetched by hero.ts afterwards and drawn only inside a burst
  const preload = read(INDEX).match(/preloadFonts=\{\[([^\]]*)\]\}/)?.[1] ?? '';
  assert.deepEqual([...preload.matchAll(/'([^']+)'/g)].map((m) => m[1]), ['/fonts/inter-opsz-wght-latin.woff2', '/fonts/rubik-900-caps.woff2', '/fonts/work-sans-300-latin.woff2', '/fonts/ibm-plex-mono-500-caps.woff2']);
  for (const f of [...preload.matchAll(/'([^']+)'/g)].map((m) => m[1])) assert.ok(has(`public${f}`), `${f} is in public/`);
});

test('the PDF and its masters stay out of git, the encoded pictures are tracked, and the jars have their page (D9, D1): .gitignore holds the masters, the sitemap and the headers list /jars/', () => {
  const ignore = read('.gitignore').split('\n').map((l) => l.trim());
  assert.ok(ignore.includes('assets-src/redesign/'), '.gitignore lists assets-src/redesign/');
  // the encoded pictures are tracked since 2026-11-10 on Sam's word ("Commit them"), so a fresh clone builds the page
  assert.ok(!ignore.includes('src/assets/redesign/'), 'the encoded pictures are no longer ignored');
  // criterion 11, as amended: nothing of the design's PDF or the masters is tracked (asked of git where this is a
  // checkout with git to ask; the catalog's PDF in docs/brand is another file, and tracked)
  const git = spawnSync('git', ['ls-files'], { cwd: fileURLToPath(root), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (git.status === 0) {
    const tracked = git.stdout.split('\n').filter(Boolean);
    assert.ok(tracked.includes('package.json'), 'git answered with the repository\'s files');
    assert.deepEqual(tracked.filter((f) => /^assets-src\/redesign\//.test(f) || /pre[ _-]?launch[^/]*\.pdf$/i.test(f)), [], 'git tracks none of the masters and not the design\'s PDF');
    assert.ok(tracked.some((f) => /^src\/assets\/redesign\/[^/]+\.avif$/.test(f)), 'git tracks the encoded pictures');
  }
  // the pictures are reached through pictures.ts alone, which says how to make them where they are missing
  const pictures = read('src/components/redesign/pictures.ts');
  assert.match(pictures, /import\.meta\.glob<string>\('\.\.\/\.\.\/assets\/redesign\/\*\.\{avif,webp\}', \{ query: '\?url', import: 'default', eager: true \}\)/);
  assert.match(pictures, /scripts\/redesign\/extract-pdf\.py[^\n]*scripts\/redesign\/encode-pictures\.mjs/);
  for (const f of ['scripts/redesign/extract-pdf.py', 'scripts/redesign/encode-pictures.mjs']) assert.ok(has(f), f);
  for (const f of OWN.filter((p) => p.endsWith('.astro') && !p.endsWith('/RdPicture.astro'))) assert.doesNotMatch(template(f).replace(/<script\b[\s\S]*?<\/script>/g, ''), /<img\b|<picture\b/, `${f}: a picture outside RdPicture.astro`);
  assert.match(template('src/components/redesign/RdPicture.astro'), /<picture class=\{cls\}><source type="image\/avif" srcset=\{p\.avif\} sizes=\{sizes\} \/><source type="image\/webp" srcset=\{p\.webp\} sizes=\{sizes\} \/><img [^>]*width=\{p\.width\} height=\{p\.height\} loading=\{eager \? 'eager' : 'lazy'\}/);
  // /jars/: a page, in the sitemap after /about/, revalidated as every page is
  assert.ok(has('src/pages/jars.astro'));
  assert.ok(importsOf('src/pages/jars.astro').includes('src/components/signup/Signup.astro'), 'the current section 5, as built');
  assert.match(read('src/pages/sitemap.xml.ts'), /return \['\/', '\/about\/', '\/jars\/', '\/privacy\/', '\/terms\/', /);
  assert.match(read('public/_headers'), /^\/jars\/\n {2}Cache-Control: public, max-age=0, s-maxage=60$/m);
  assert.match(RD_JARS.description, /19 November 2026/);
});
