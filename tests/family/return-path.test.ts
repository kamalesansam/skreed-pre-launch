// Section 13 step 3 (docs/specs/family-page.md 2.2 and 13; built with round 4, section 22, as D4's dependency; the loader
// in full since round 5, section 23): the landing's return path on the 3D path, read from the sources, since no browser
// runs here. Back from a family page, or /#families: the inline loader runs as on a first visit (the wordmark, the count,
// the fill at the load's pace, the status lines and the stall rule) but schedules its exit only once the island has
// called its ready(); the hero skips its intro, snaps the page and its scroll followers to section 2's rest (S2T.LAND,
// 14.5 screens, which also undoes the browser's own scroll to nav#families), calls ready() once frame2 is in and the gems
// are built, and snaps a third time at the lift (life.onRecover, run by __introDone), so the loader's fade opens on the
// gems at rest. Round 4's veil (shell.css hiding .ld-w and #ldPct, L.skip()) is gone.
// Iteration 2 (the review of 2026-10-26): the skipped view transition into the landing is never a hero failure (item 1),
// Back to top's way home is not a return visit (item 2), and a return that falls to the poster centres the families (item 3).
// Round 5, iteration 3 (the review of 2026-10-28): links.ts, the poster path's half of the return, reads Back to top's flag
// before it centres, holds the centring to the load event and stops at the visitor's first input. Iteration 4 (the same
// day): on the poster tier proper the loader never ran, so links.ts itself sets manual scroll restoration when it decides
// to centre, or the browser puts the old place back after the load event (the third and fourth of the seven tests,
// named "iteration 3 (round 5)" and "iteration 4 (round 5)").
// The prototype parity of the loader is tests/unit/inline-loader.test.ts; the browser row is specs/back.spec.ts.
//   node --test tests/family/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { S2T } from '../../src/config/hero.ts';
import { isAbortError, IslandDead } from '../../src/scripts/hero/bridge/life.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

test('the loader: RET from the two conditions of isReturnVisit(), on html.hero3d only and never for Back to top\'s way home; the ret class hides nothing; on a return visit the exit at FULL waits for the island\'s ready() (round 5)', () => {
  const loader = read('src/inline/loader.inline.js');
  assert.match(loader, /^var TT=false;try\{TT=sessionStorage\.getItem\('skreed:to-top'\)==='1'\}catch\(e\)\{\}$/m, 'Back to top\'s flag, read inside a try as to-top.ts reads it');
  const ret = loader.match(/^var RET=(.*);if\(RET\)intro\.classList\.add\('ret'\);$/m)?.[1] ?? '';
  assert.ok(ret, 'the loader computes RET once');
  assert.ok(ret.startsWith('!TT&&'), 'never a return visit on Back to top\'s way home (item 2)');
  assert.ok(ret.includes("HT.classList.contains('hero3d')"), 'the landing\'s 3D path only: the family pages share this loader and lift it their own way');
  assert.ok(ret.includes("location.hash==='#families'") && ret.includes("type==='back_forward'"), 'the two conditions of isReturnVisit(), repeated inline (rock-links.ts)');
  assert.match(loader, /^if\(TT\)\{scrollTo\(0,0\);if\(location\.hash\)history\.replaceState\(history\.state,'',location\.pathname\+location\.search\)\}$/m, 'Back to top\'s fresh load starts at the top, its hash dropped so the fragment\'s own scroll cannot undo it');
  // round 5 (section 23, D1 and D2): the one condition that schedules the exit. Off a return visit !RET is true and the line
  // reads as the prototype's; on one the exit waits for manual, which on the landing only the island's ready() sets
  assert.match(loader, /if\(ready&&\(!RET\|\|manual\)&&tl>=FULL-\.001\)sched\(now\)/, 'on a return visit the exit is scheduled once frame2 is in (ready) and the island has called ready() (manual): the first visit\'s exit, at the next pass');
  assert.equal((loader.match(/\)sched\(now\)/g) ?? []).length, 1, 'the exit is scheduled by that line alone (the other sched(now) is the function\'s own definition)');
  assert.match(loader, /ready:function\(\)\{manual=true;p=1;ready=true\},/, 'the prototype\'s own ready(): the island\'s word, no new method (D2)');
  assert.equal((loader.match(/manual=/g) ?? []).length, 6, 'manual is written by its declaration and the five API methods only (setProgress, ready, cut, skip, seek); the landing\'s island calls ready() alone');
  assert.match(loader, /skip:function\(\)\{manual=true;ready=true;if\(ph!=='done'&&ph!=='lift'\)\{ph='enter';lift\(\)\}\}/, 'skip() is unchanged: it is still the family pages\' way out of their 3D (three/boot.ts)');
  assert.match(loader, /history\.scrollRestoration='manual';if\(!location\.hash\)scrollTo\(0,0\);/, 'manual restoration, and no scroll to 0 with the hash (the return entry is always /#families)');
  assert.doesNotMatch(read('src/styles/shell.css'), /\.intro\.ret/, 'the class ret hides nothing: the wordmark and the count show on a return visit as on a first (round 5; E-H1)');
  assert.match(loader, /the loader in full since round 5, section 23/, 'the comment says what the return path now is');
  const rock = read('src/scripts/family/rock-links.ts');
  assert.match(rock, /return nav\?\.type === 'back_forward' \|\| location\.hash === '#families';/, 'isReturnVisit() as the loader repeats it');
  const toTop = read('src/scripts/shell/to-top.ts');
  assert.match(toTop, /const FLAG = 'skreed:to-top'/, 'the flag the loader reads');
  assert.match(toTop, /function backHome\(\) \{\n\s+flag\.set\(\);/, 'set before Back to top steps back through the history');
});

test('the hero: the intro skipped, the page and both followers snapped to S2T.LAND under the loader, the island\'s ready() once frame2 is in and the gems are built (never skip or cut), the third snap at the lift, the context checked on a restore; the loader\'s decision read, not made again', () => {
  assert.equal(S2T.LAND, 14.5);
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

test('iteration 3 (round 5): links.ts never centres on Back to top\'s way home (the flag read as the loader reads it, before BackToTop\'s module clears it), holds the centring from its module to the load event, and stops for good at the visitor\'s first input', () => {
  const links = read('src/scripts/family/links.ts');
  // item 1: the flag, read inside a try as the loader's TT and to-top.ts read it, decides before isReturnVisit() does; never cleared here
  assert.match(links, /let toTop = false;\n\s*try \{ toTop = sessionStorage\.getItem\('skreed:to-top'\) === '1'; \} catch \{ \/\*[^*]*\*\/ \}\n\s*if \(!toTop && isReturnVisit\(\)\) \{/, 'the flag first: a cache miss on Back to top\'s way home is a back_forward load too, which isReturnVisit() cannot tell apart');
  assert.doesNotMatch(links, /removeItem|setItem/, 'the flag is BackToTop\'s to clear (to-top.ts line 92), after this module has read it');
  assert.match(read('src/scripts/shell/to-top.ts'), /if \(home\) \{\n(?:\s*\/\/[^\n]*\n)*\s*flag\.clear\(\);/, 'BackToTop clears the flag when its module runs on the landing');
  // the order the read relies on: FamilyLinks (links.ts) is mounted before BackToTop on the landing, so its module script runs first
  const index = read('src/pages/index.astro');
  assert.ok(index.indexOf('<FamilyLinks slot="riders" />') > 0 && index.indexOf('<FamilyLinks slot="riders" />') < index.indexOf('<BackToTop slot="riders" page="home" />'), 'FamilyLinks before BackToTop in index.astro');
  const built = new URL('dist/index.html', root);
  if (existsSync(built)) {
    const html = readFileSync(built, 'utf8');
    const order = [...html.matchAll(/<script type="module" src="\/_astro\/(\w+)\.astro_astro_type_script_[^"]+"/g)].map((m) => m[1]);
    assert.ok(order.indexOf('FamilyLinksNav') >= 0 && order.indexOf('FamilyLinksNav') < order.indexOf('BackToTop'), `the built landing's module scripts run FamilyLinksNav before BackToTop (${order.join(', ')})`);
  }
  // item 2: centred now, on each scroll the browser makes and at the load event, all three reading the class; stopped for good at the
  // visitor's first wheel, touch, key or pointer; passive listeners, removed once used, nothing that prevents default
  assert.match(links, /const INPUT = \['wheel', 'touchstart', 'keydown', 'pointerdown'\] as const;/);
  assert.match(links, /const stop = \(\) => \{ removeEventListener\('scroll', centre\); removeEventListener\('load', loaded\); for \(const e of INPUT\) removeEventListener\(e, stop\); \};/, 'stop removes every listener, its own included');
  assert.match(links, /const loaded = \(\) => \{ centre\(\); stop\(\); \};/, 'the load event centres once more, which the fragment scroll never follows, then stops');
  assert.match(links, /centre\(\);\n\s*if \(document\.readyState !== 'complete'\) \{\n\s*addEventListener\('scroll', centre, \{ passive: true \}\);\n\s*addEventListener\('load', loaded\);\n\s*for \(const e of INPUT\) addEventListener\(e, stop, \{ passive: true \}\);\n\s*\}/, 'centred now; the listeners only while the load still runs');
  assert.doesNotMatch(links, /preventDefault|once: true/, 'nothing prevents default; stop() removes the listeners itself (once would leave the other three)');
  assert.equal((links.match(/scrollIntoView/g) ?? []).length, 1, 'one centring call, in centre()');
  assert.match(links, /Not on Back to top's way home/, 'the comment says so');
});

test('iteration 4 (round 5): on the poster tier proper the loader never ran, so links.ts sets history.scrollRestoration to manual itself when it decides to centre (a return visit, the flag not set, off the 3D path), before the load event; never on a first visit, on Back to top\'s way home or on the 3D path', () => {
  const links = read('src/scripts/family/links.ts');
  const loader = read('src/inline/loader.inline.js');
  const gate = read('src/inline/gate.inline.js');
  // the assignment, once, guarded by the class as centre() is, first inside the block that decides to centre: before centre() and the
  // listeners, so before the load event, and so on no plain first visit (isReturnVisit() false) and never with the flag set
  assert.equal((links.match(/scrollRestoration/g) ?? []).length, 1, 'one assignment');
  assert.match(links, /if \(!toTop && isReturnVisit\(\)\) \{\n\s*if \(!document\.documentElement\.classList\.contains\('hero3d'\)\) history\.scrollRestoration = 'manual';\n\s*const INPUT = /, 'the first line of the centring block, guarded by the class: on the 3D path the loader set it already, and a fall to the poster keeps the loader\'s setting');
  assert.ok(links.indexOf("history.scrollRestoration = 'manual'") < links.indexOf('centre();'), 'before the first centring');
  // the premise, read from the loader and the gate: the loader returns without html.loading before the line that sets manual, and the
  // gate adds loading on the hero3d tiers only, so on the poster tier proper nothing but links.ts sets it
  assert.ok(loader.indexOf("if(!HT.classList.contains('loading'))return;") < loader.indexOf("history.scrollRestoration='manual'"), 'the loader leaves the poster tier before it sets manual (lines 7 and 10)');
  assert.match(gate, /if \(t === 'poster'\) c\.add\('poster'\); else \{ c\.add\('hero3d', 'loading'\);/, 'the gate adds loading off the poster tier only');
  // the comment says why, and no longer says the loader keeps it manual off the 3D path
  assert.match(links, /the loader never ran/, 'the comment\'s premise: on the poster tier proper the loader never ran');
  assert.doesNotMatch(links, /keeps manual scroll restoration \(the loader\)/, 'iteration 3\'s premise, which held on the 3D path only, is gone');
});

test('item 1: a skipped cross-document view transition is never a hero failure: isAbortError, boot.ts\'s rejection guard returns early on it, and the Gate handles the transition\'s ready and finished', () => {
  assert.equal(isAbortError(new DOMException('Transition was skipped', 'AbortError')), true);
  assert.equal(isAbortError(new DOMException('gone', 'NotFoundError')), false);
  assert.equal(isAbortError(new Error('AbortError')), false, 'a plain Error with that text is not one');
  assert.equal(isAbortError(new IslandDead('test')), false);
  assert.equal(isAbortError(undefined), false);
  const boot = read('src/scripts/boot.ts');
  assert.match(boot, /import \{ createLife, isAbortError, IslandDead \} from '\.\/hero\/bridge\/life\.ts';/);
  assert.match(boot, /const onRejection = \(e: PromiseRejectionEvent\) => \{ if \(isAbortError\(e\.reason\)\) return; if \(!window\.__heroStarted && !\(e\.reason instanceof IslandDead\)\) toPoster\('unhandled rejection before start', e\.reason\); \};/, 'the early return comes first');
  const gate = read('src/inline/gate.inline.js');
  assert.match(gate, /addEventListener\('pagereveal', function \(e\) \{ var v = e\.viewTransition; if \(v\) \{ v\.ready\.catch\(function \(\) \{\}\); v\.finished\.catch\(function \(\) \{\}\); v\.updateCallbackDone\.catch\(function \(\) \{\}\); \} \}\);/, 'the Gate, in the head before the first render, handles all three promises (iteration 3: updateCallbackDone rejected too)');
  assert.ok(gate.indexOf("addEventListener('pagereveal'") < gate.indexOf("addEventListener('error'"), 'before the module error guard');
});

test('iterations 3 and 4: a return visit that stalls lands on the families, and only the visitor moves the poster page: the soft poster centres nav#families and measures its scroll rule from there; toPoster centres only when the loader was not already on its soft poster; the recovery on frame2 puts section 2 in place', () => {
  const boot = read('src/scripts/boot.ts');
  const soft = boot.slice(boot.indexOf('function onSoftPoster('), boot.indexOf('async function boot('));
  assert.match(soft, /resetRiders\(els\);\n(?:\s*\/\/[^\n]*\n)*\s+const ret = !!document\.getElementById\('intro'\)\?\.classList\.contains\('ret'\);\n\s+if \(ret\) \{ \$\('families'\)\?\.scrollIntoView\(\{ block: 'center', behavior: 'instant' \}\); softCentred = true; \}\n\s+const base = ret \? scrollY : 0;\n\s+const onScroll = \(\) => \{ if \(Math\.abs\(scrollY - base\) > 8\) toPoster\('soft-then-scrolled'\); \};/,
    'on a return visit the families are centred first and the flag set beside the centring (iteration 5), then the scroll rule is measured from that position (from the top it is scrollY > 8 as before), so neither the collapse nor the centring counts');
  assert.match(soft, /addEventListener\('scroll', onScroll, \{ passive: true \}\);\n\s+const off = \(\) => removeEventListener\('scroll', onScroll\);\n\s+life\.onRecover\(off\); life\.onKill\(off\);/, 'the rule is installed on every soft poster and lifted by a recovery');
  assert.match(soft, /if \(kind === 'fail'\) \{ if \(!life\.dead\) toPoster\('module-load-error'\); return; \}/, 'a real failure still ends it');
  const hard = boot.slice(boot.indexOf('function toPoster('), boot.indexOf('function onSoftPoster('));
  assert.match(boot, /^let softCentred = false;$/m, 'one module-level flag (iteration 5)');
  assert.match(hard, /const fam = !softCentred && location\.hash === '#families' \? \$\('families'\) : null;/, 'toPoster reads the flag: a soft poster that centred keeps the visitor\'s place on a hard turn; a fall that never passed there (the Gate\'s fail, a lost context, a failed fetch) centres the families');
  assert.doesNotMatch(hard, /fresh|s\.mode !== 'poster';/, 'nothing reads the loader\'s mode for the centring: the fail kind sets mode poster without any centring');
  assert.equal(boot.split('softCentred').length - 1, 3, 'declared, set beside the centring, read in toPoster');
  const loader = read('src/inline/loader.inline.js');
  assert.match(loader, /if\(mode==='poster'\)\{if\(ready\)\{ph='enter';HT\.classList\.replace\('poster','hero3d'\);lift\(\)\}return\}/, 'the loader\'s recovery branch lifts on frame2, then __introDone runs life.recover(), which runs the hero\'s snap hook');
  assert.match(loader, /intro\.classList\.add\('po'\)/, 'poster() keeps #intro, so its ret class is still there to read');
  assert.match(read('src/scripts/hero/bridge/loader.ts'), /life\.recover\(\);\n\s+cb\(\);/, 'the recovery hooks run before the hero\'s own intro-done work');
});

test('item 3: a return visit that falls to the poster centres nav#families instead of keeping the 3D scroll offset', () => {
  const boot = read('src/scripts/boot.ts');
  assert.match(boot, /const fam = !softCentred && location\.hash === '#families' \? \$\('families'\) : null;/, 'a fall centres unless a soft poster already did (iterations 4 and 5)');
  assert.match(boot, /if \(fam\) fam\.scrollIntoView\(\{ block: 'center', behavior: 'instant' \}\);\n\s+else if \(y < before - innerHeight\) scrollTo\(\{ top: 0, behavior: 'instant' \}\);\n\s+else scrollTo\(\{ top: y - \(before - after\), behavior: 'instant' \}\);/, 'the centring takes the place of the offset keep, after the track has collapsed to one screen');
  assert.ok(boot.indexOf("H.classList.replace('hero3d', 'poster')") < boot.indexOf('fam.scrollIntoView'), 'the page is the poster page before the nav is centred, so the nav is in flow after one screen');
});
