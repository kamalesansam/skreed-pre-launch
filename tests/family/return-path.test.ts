// The way back to the landing page, read from the sources, since no browser runs here.
// Since the redesign (docs/specs/redesign.md D2, D3, D10 and section 6; 2026-11-09) the landing page mounts no Gate, no
// loader and no island, so nothing of ours runs on the way back: a family page's "Back to main page" and the browser's
// Back land on /#families by the browser alone, restored from its back-forward cache where it kept the page
// (E-way-back) and loaded with the fragment's own scroll to section#families where it did not. The first row below
// holds that, and is new.
// The six rows after it are what this file was written for, as they were: the old landing's return path on the 3D path
// (family-page.md 2.2, 13, 22, 23 and 27). Its source stays on disk, unmounted and unedited (D2: one revert or a branch
// switch brings that page back), the family pages still mount its loader, and every assertion in the six still holds;
// so none was dropped, and each row is named for what it reads. The site they describe runs at the ref
// archive/site-before-redesign-2026-11-09. Their story, as this header told it until that day:
// Section 13 step 3 (docs/specs/family-page.md 2.2 and 13; built with round 4, section 22, as D4's dependency; the loader
// in full since round 5, section 23): the old landing's return path on the 3D path. Back from a family page, or
// /#families: the inline loader runs as on a first visit (the wordmark, the count, the fill at the load's pace, the
// status lines and the stall rule) but schedules its exit only once the island has
// called its ready(); the hero skips its intro, snaps the page and its scroll followers to section 2's rest (S2T.LAND,
// 14.5 screens, which also undoes the browser's own scroll to nav#families), calls ready() once frame2 is in and the gems
// are built, and snaps a third time at the lift (life.onRecover, run by __introDone), so the loader's fade opens on the
// gems at rest. Round 4's veil (shell.css hiding .ld-w and #ldPct, L.skip()) is gone.
// Iteration 2 (the review of 2026-10-26): the skipped view transition into the landing is never a hero failure (item 1),
// Back to top's way home left on 2026-11-04 (item 2 has nothing left to guard), and a return that falls to the poster centres the families (item 3).
// Round 5, iteration 3 (the review of 2026-10-28): links.ts, the poster path's half of the return, reads Back to top's flag
// before it centres, holds the centring to the load event and stops at the visitor's first input. Iteration 4 (the same
// day): on the poster tier proper the loader never ran, so links.ts itself sets manual scroll restoration when it decides
// to centre, or the browser puts the old place back after the load event (the two rows named "iteration 3 (round 5)"
// and "iteration 4 (round 5)").
// The prototype parity of the loader is tests/unit/inline-loader.test.ts; the browser row is specs/back.spec.ts.
//   node --test tests/family/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { posix } from 'node:path';
import { S2T } from '../../src/config/hero.ts';
import { RD_IDS } from '../../src/config/redesign.ts';
import { isAbortError, IslandDead } from '../../src/scripts/hero/bridge/life.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
/** every file under a folder, as paths from the repository's root */
const walk = (dir: string): string[] => readdirSync(new URL(dir, root)).flatMap((n) => (statSync(new URL(`${dir}${n}`, root)).isDirectory() ? walk(`${dir}${n}/`) : [`${dir}${n}`]));
/** what a source file imports, statically or by import(): a relative specifier as a path from the repository's root, a package by its name */
const importsOf = (file: string): string[] => [...read(file).matchAll(/(?:^|[\s;])import\s*(?:[^'"()]*?\sfrom\s*)?\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1].replace(/\?.*$/, '')).map((spec) => (spec.startsWith('.') ? posix.normalize(posix.join(posix.dirname(file), spec)) : spec));

// ---- the redesigned landing (docs/specs/redesign.md; 2026-11-09) ----

test('the redesigned landing: the way back lands on /#families with no loader and no code of ours in the way; the fragment is a section of the page, a swatch leaves it in the history, and nothing keeps the page out of the back-forward cache', () => {
  // nothing to run on arrival: no Gate, no loader, no island, and not the old poster path's ten links (links.ts centred them itself)
  const imports = importsOf('src/pages/index.astro');
  assert.ok(imports.includes('src/components/redesign/Families.astro'), 'the page\'s imports are read, as paths from the root');
  for (const gone of ['Gate', 'Loader', 'HeroStage', 'FamilyLinks', 'FamilyLinksNav']) assert.ok(!imports.some((p) => p.endsWith(`/${gone}.astro`)), `index.astro imports ${gone}.astro`);
  // the fragment the family pages link to is the ten swatches' section, the one element of the page with that id
  assert.ok((RD_IDS as readonly string[]).includes('families'));
  const families = read('src/components/redesign/Families.astro');
  assert.equal((families.match(/\bid="families"/g) ?? []).length, 1);
  assert.match(families, /<section\b[^>]*\bid="families"/);
  for (const p of walk('src/components/redesign/').filter((f) => f.endsWith('.astro') && !f.endsWith('/Families.astro'))) assert.doesNotMatch(read(p), /\bid="families"/, `${p} carries the id too`);
  // a family page's link (back.test.ts holds its markup): to /#families, marked for the way back through the history,
  // which is installed off the landing page only
  assert.match(read('src/pages/shades/[family].astro'), /<a class="fam-back ring2 press" id="famBack" href="\/#families" data-home hidden>/);
  assert.match(read('src/scripts/shell/back-home.ts'), /^if \(location\.pathname !== '\/'\) \{$/m);
  // a swatch leaves /#families in the history before it goes, the gems' own way, so the browser's Back returns to the section
  assert.match(read('src/scripts/redesign/families.ts'), /^\s*followRock\(l, 'rock_grid'\);$/m);
  assert.match(read('src/scripts/family/rock-links.ts'), /history\.replaceState\(history\.state, '', '#families'\);\n\s*location\.assign\(link\.href\);/);
  // the browser's own scroll is left to it: scroll restoration is set to manual by the loader and by the old poster
  // path's links.ts alone, and the redesigned landing mounts neither
  const src = walk('src/').filter((f) => /\.(?:ts|js|mjs|astro)$/.test(f));
  assert.deepEqual(src.filter((f) => /scrollRestoration/.test(read(f))), ['src/inline/loader.inline.js', 'src/scripts/family/links.ts']);
  // and nothing holds a page out of the back-forward cache (E-way-back): no unload or beforeunload handler anywhere, no no-store
  for (const f of src) assert.doesNotMatch(read(f), /['"`](?:unload|beforeunload)['"`]|\bon(?:before)?unload\b/, f);
  assert.doesNotMatch(read('public/_headers'), /no-store/);
  // a page restored from the cache keeps its scroll but not its triggers' places: the motion measures them again
  assert.match(read('src/scripts/redesign/motion.ts'), /addEventListener\('pageshow', \(e\) => \{ if \(e\.persisted\) refresh\(\); \}\);/);
});

// ---- the old landing's return path, its source kept on disk (docs/specs/redesign.md D2), and the loader the family pages share ----

test('the loader the family pages still mount, with the old landing\'s return rule in it: RET from the two conditions of isReturnVisit(), on html.hero3d only; the ret class hides nothing; on a return visit the loader lifts as soon as the island gives its ready() (2026-11-04, family-page.md 27: "make the going back wait time quicker")', () => {
  const loader = read('src/inline/loader.inline.js');
  assert.doesNotMatch(loader, /skreed:to-top|\bTT\b/, 'no Back to top flag: a family page\'s Back to top stays on its own page since 2026-11-04');
  const ret = loader.match(/^var RET=(.*);if\(RET\)intro\.classList\.add\('ret'\);$/m)?.[1] ?? '';
  assert.ok(ret, 'the loader computes RET once');
  assert.ok(ret.startsWith("HT.classList.contains('hero3d')"), 'the landing\'s 3D path only: the family pages share this loader and lift it their own way');
  assert.ok(ret.includes("location.hash==='#families'") && ret.includes("type==='back_forward'"), 'the two conditions of isReturnVisit(), repeated inline (rock-links.ts)');
  // a return visit: the island's ready() (manual, ready) goes straight to enter(): the count to 100 and the lift, no fill timeline and no dim
  assert.match(loader, /if\(RET&&manual&&ready\)\{fA\.pause\(\);enter\(\);return\}\n\s*if\(ready&&!RET&&tl>=FULL-\.001\)sched\(now\)/, 'on a return visit the lift follows the island\'s word at once; a first visit schedules its exit at FULL as the prototype does');
  assert.equal((loader.match(/\)sched\(now\)/g) ?? []).length, 1, 'the exit is scheduled by that line alone');
  assert.match(loader, /ready:function\(\)\{manual=true;p=1;ready=true\},/, 'the prototype\'s own ready(): the island\'s word, no new method (D2)');
  assert.equal((loader.match(/manual=/g) ?? []).length, 6, 'manual is written by its declaration and the five API methods only');
  assert.match(loader, /skip:function\(\)\{manual=true;ready=true;if\(ph!=='done'&&ph!=='lift'\)\{ph='enter';lift\(\)\}\}/, 'skip() is unchanged: it is still the family pages\' way out of their 3D (three/boot.ts)');
  assert.match(loader, /history\.scrollRestoration='manual';if\(!location\.hash\)scrollTo\(0,0\);/, 'manual restoration, and no scroll to 0 with the hash (the return entry is always /#families)');
  assert.doesNotMatch(read('src/styles/shell.css'), /\.intro\.ret/, 'the class ret hides nothing');
  const rock = read('src/scripts/family/rock-links.ts');
  assert.match(rock, /return nav\?\.type === 'back_forward' \|\| location\.hash === '#families';/, 'isReturnVisit() as the loader repeats it');
  const toTop = read('src/scripts/shell/to-top.ts'), toTopCode = toTop.replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(toTopCode, /sessionStorage|traverseToLanding|location\.assign/, 'Back to top never leaves its page');
  assert.match(toTop, /scrollTo\(\{ top: 0, behavior: reducedMQ\.matches \? 'instant' : 'smooth' \}\)/, 'the page\'s own top, smoothly, at once under reduced motion');
  assert.match(read('src/components/shell/BackToTop.astro'), /<a class="to-top" id="toTop" href="#" data-page=\{page\} hidden>/, 'a link to the page\'s own top without JavaScript');
});
test('the old landing\'s hero (kept on disk, mounted by no page since 2026-11-09): the intro skipped, the page and both followers snapped to S2T.LAND under the loader, the island\'s ready() once frame2 is in and the gems are built (never skip or cut), the third snap at the lift, the context checked on a restore; the loader\'s decision read, not made again', () => {
  assert.equal(S2T.LAND, 4.8);   // 14.5 until 2026-11-02, when the hero's scroll was halved and the stagger went (section-2.md 14); 4.55 that day, 4.8 since the wipes went back to one screen (2026-11-03, section-2.md 15)
  const hero = read('src/scripts/hero/hero.ts');
  const loader = read('src/inline/loader.inline.js');
  assert.match(hero, /const ret = !!document\.getElementById\('intro'\)\?\.classList\.contains\('ret'\);/, 'the loader decided (item 2: to-top.ts has cleared its flag by now)');
  assert.doesNotMatch(hero, /import \{ isReturnVisit \}|= isReturnVisit\(\)/, 'never a second reading of the conditions');
  assert.match(hero, /createIglooIntro\(\{ [^}]*skip: ret[^}]*\}\)/, 'the shot is skipped on a return visit, as for a hash');
  assert.match(read('src/scripts/hero/intro/igloo.ts'), /const SKIP = reduce \|\| !!o\.skip \|\|/);
  assert.match(hero, /section2\.snapTo = \(screens\) => \{ if \(!document\.documentElement\.classList\.contains\('poster'\)\) scrollTo\(\{ top: Math\.round\(screens \* innerHeight\), behavior: 'instant' \}\); loop\.snap\(screens\); \};/, 'snapTo scrolls the page, never the poster page (iteration 4), and sets both followers');
  assert.match(hero, /if \(ret\) \{\n\s+const snapTo = section2\.snapTo;\n\s+snapTo\(S2T\.LAND\);\n(?:\s*\/\/[^\n]*\n)*\s+life\.onRecover\(\(\) => snapTo\(S2T\.LAND\)\);/, 'section 2 at rest at once under the loader (the fragment\'s scroll to nav#families undone), and again at the lift: a soft poster\'s recovery (iteration 4) or the loader\'s own lift (round 5), both through __introDone');
  assert.match(hero, /if \(!L\.state\(\)\.ready \|\| !\(section2\.ready \|\| section2\.failed \|\| !loop\.running\)\) \{ requestAnimationFrame\(settle\); return; \}/, 'frame2 still gates the lift (the readiness model), and the gems are built first');
  assert.match(hero, /snapTo\(S2T\.LAND\); L\.ready\(\);/, 'snapped again, then the island\'s word through the loader\'s ready(): the exit runs at the next pass and the lift follows (round 5, D2)');
  assert.doesNotMatch(hero, /L\.skip\(\)/, 'the veil\'s skip path is gone: the loader runs its own exit and lift on a return visit (round 5, D3)');
  assert.doesNotMatch(hero, /L\.cut\(\)/, 'not the family pages\' cut either: the landing\'s timing, D1 (the other reading named for Sam)');
  // the third snap: the lift runs __introDone, which runs life.recover() before the hero's own intro-done work, so the
  // onRecover hook above puts the page and both followers at S2T.LAND as the loader's fade starts, whatever the browser's own
  // scroll to the fragment did under the longer loader (section 23, criterion 3)
  assert.match(read('src/scripts/hero/bridge/loader.ts'), /window\.__introDone = \(\) => \{\n\s+if \(life\.dead\) return;\n(?:[^\n]*\n)*?\s+life\.recover\(\);\n\s+cb\(\);/, '__introDone runs the recovery hooks first');
  assert.match(read('src/scripts/hero/bridge/life.ts'), /recover\(\) \{ if \(dead\) return; for \(const fn of recovers\.splice\(0\)\) fn\(\); \}/, 'each hook runs once, at the one lift');
  assert.match(loader, /function lift\(\)\{if\(ph==='done'\)return;ph='lift';intro\.style\.pointerEvents='none';HT\.classList\.remove\('loading'\);inertAll\(false\);if\(window\.__introDone\)window\.__introDone\(\);/, 'the loader\'s lift calls __introDone (its own lift and the recovery branch alike)');
  assert.match(hero, /if \(e\.persisted && renderer\.getContext\(\)\.isContextLost\(\)\) o\.onHardFail\('webglcontextlost after restore'\)/, 'a back-forward cache restore with a lost context goes the way every lost context goes (boot.ts: the poster page)');
  assert.match(hero, /addEventListener\('pageshow', onShow\)/);
  // the poster path's half of the return (links.ts) centres the links off the 3D path, reading the class each time (the next test)
  assert.match(read('src/scripts/family/links.ts'), /const centre = \(\) => \{ if \(!document\.documentElement\.classList\.contains\('hero3d'\)\) nav\.scrollIntoView\(\{ block: 'center', behavior: 'instant' \}\); \};/);
});

test('the old landing\'s poster path, iteration 3 (round 5): links.ts holds the centring from its module to the load event and stops for good at the visitor\'s first input (Back to top\'s way home and its flag left on 2026-11-04)', () => {
  const links = read('src/scripts/family/links.ts');
  assert.doesNotMatch(links, /skreed:to-top|toTop/, 'no Back to top flag since 2026-11-04');
  assert.match(links, /if \(isReturnVisit\(\)\) \{/, 'a return visit alone decides');
  // item 2: centred now, on each scroll the browser makes and at the load event, all three reading the class; stopped for good at the
  // visitor's first wheel, touch, key or pointer; passive listeners, removed once used, nothing that prevents default
  assert.match(links, /const INPUT = \['wheel', 'touchstart', 'keydown', 'pointerdown'\] as const;/);
  assert.match(links, /const stop = \(\) => \{ removeEventListener\('scroll', centre\); removeEventListener\('load', loaded\); for \(const e of INPUT\) removeEventListener\(e, stop\); \};/, 'stop removes every listener, its own included');
  assert.match(links, /const loaded = \(\) => \{ centre\(\); stop\(\); \};/, 'the load event centres once more, which the fragment scroll never follows, then stops');
  assert.match(links, /centre\(\);\n\s*if \(document\.readyState !== 'complete'\) \{\n\s*addEventListener\('scroll', centre, \{ passive: true \}\);\n\s*addEventListener\('load', loaded\);\n\s*for \(const e of INPUT\) addEventListener\(e, stop, \{ passive: true \}\);\n\s*\}/, 'centred now; the listeners only while the load still runs');
  assert.doesNotMatch(links, /preventDefault|once: true/, 'nothing prevents default; stop() removes the listeners itself (once would leave the other three)');
  assert.equal((links.match(/scrollIntoView/g) ?? []).length, 1, 'one centring call, in centre()');
});

test('the old landing\'s poster path, iteration 4 (round 5): on the poster tier proper the loader never ran, so links.ts sets history.scrollRestoration to manual itself when it decides to centre (a return visit, the flag not set, off the 3D path), before the load event; never on a first visit, on Back to top\'s way home or on the 3D path', () => {
  const links = read('src/scripts/family/links.ts');
  const loader = read('src/inline/loader.inline.js');
  const gate = read('src/inline/gate.inline.js');
  // the assignment, once, guarded by the class as centre() is, first inside the block that decides to centre: before centre() and the
  // listeners, so before the load event, and so on no plain first visit (isReturnVisit() false) and never with the flag set
  assert.equal((links.match(/scrollRestoration/g) ?? []).length, 1, 'one assignment');
  assert.match(links, /if \(isReturnVisit\(\)\) \{\n\s*if \(!document\.documentElement\.classList\.contains\('hero3d'\)\) history\.scrollRestoration = 'manual';\n\s*const INPUT = /, 'the first line of the centring block, guarded by the class: on the 3D path the loader set it already, and a fall to the poster keeps the loader\'s setting');
  assert.ok(links.indexOf("history.scrollRestoration = 'manual'") < links.indexOf('centre();'), 'before the first centring');
  // the premise, read from the loader and the gate: the loader returns without html.loading before the line that sets manual, and the
  // gate adds loading on the hero3d tiers only, so on the poster tier proper nothing but links.ts sets it
  assert.ok(loader.indexOf("if(!HT.classList.contains('loading'))return;") < loader.indexOf("history.scrollRestoration='manual'"), 'the loader leaves the poster tier before it sets manual (lines 7 and 10)');
  assert.match(gate, /if \(t === 'poster'\) c\.add\('poster'\); else \{ c\.add\('hero3d', 'loading'\);/, 'the gate adds loading off the poster tier only');
  // the comment says why, and no longer says the loader keeps it manual off the 3D path
  assert.match(links, /the loader never ran/, 'the comment\'s premise: on the poster tier proper the loader never ran');
  assert.doesNotMatch(links, /keeps manual scroll restoration \(the loader\)/, 'iteration 3\'s premise, which held on the 3D path only, is gone');
});

test('the old landing, item 1: a skipped cross-document view transition is never a hero failure: isAbortError, boot.ts\'s rejection guard returns early on it, and the Gate handles the transition\'s ready and finished', () => {
  assert.equal(isAbortError(new DOMException('Transition was skipped', 'AbortError')), true);
  assert.equal(isAbortError(new DOMException('gone', 'NotFoundError')), false);
  assert.equal(isAbortError(new Error('AbortError')), false, 'a plain Error with that text is not one');
  assert.equal(isAbortError(new IslandDead('test')), false);
  assert.equal(isAbortError(undefined), false);
  const boot = read('src/scripts/boot.ts');
  assert.match(boot, /import \{ createLife, isAbortError, IslandDead \} from '\.\/hero\/bridge\/life\.ts';/);
  assert.match(boot, /const onRejection = \(e: PromiseRejectionEvent\) => \{ if \(isAbortError\(e\.reason\)\) return; if \(!window\.__heroStarted && !\(e\.reason instanceof IslandDead\)\) hardFail\('unhandled rejection before start', e\.reason\); \};/, 'the early return comes first');
  const gate = read('src/inline/gate.inline.js');
  assert.match(gate, /addEventListener\('pagereveal', function \(e\) \{ var v = e\.viewTransition; if \(v\) \{ v\.ready\.catch\(function \(\) \{\}\); v\.finished\.catch\(function \(\) \{\}\); v\.updateCallbackDone\.catch\(function \(\) \{\}\); \} \}\);/, 'the Gate, in the head before the first render, handles all three promises (iteration 3: updateCallbackDone rejected too)');
  assert.ok(gate.indexOf("addEventListener('pagereveal'") < gate.indexOf("addEventListener('error'"), 'before the module error guard');
});

test('the old landing since 2026-11-04 (E-3D-only): a return visit never meets the poster: the loader has no stall or offline poster, and every hard failure is a reload or the site note', () => {
  // iterations 3 to 5 centred nav#families on the poster page a stalled or failed return visit fell to; that page is gone
  const boot = read('src/scripts/boot.ts');
  assert.doesNotMatch(boot, /onSoftPoster|toPoster|softCentred/, 'no poster path in the boot');
  assert.equal(boot.split("classList.replace('hero3d', 'poster')").length - 1, 1, 'but the test builds\' software-renderer poster (posterForTests)');
  assert.match(boot, /if \(gl === 'software' && import\.meta\.env\.PUBLIC_HERO_HOOKS === '1'\) \{ posterForTests\(\); return; \}/);
  assert.match(boot, /function hardFail\(reason: string, err\?: unknown\): void \{\n\s+if \(life\.dead\) return;\n\s+life\.kill\(reason\);/, 'the island stops first');
  assert.match(boot, /failHard\(\);\n\}/, 'then shell/note.ts reloads once or shows the note');
  const loader = read('src/inline/loader.inline.js');
  assert.doesNotMatch(loader, /function poster\(|intro\.classList\.add\('po'\)|'stall'/, 'the loader never turns into the poster');
  assert.match(read('src/scripts/hero/bridge/loader.ts'), /life\.recover\(\);\n\s+cb\(\);/, 'the recovery hooks still run before the hero\'s own intro-done work');
});
