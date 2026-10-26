// Section 13 step 3 (docs/specs/family-page.md 2.2 and 13; built with round 4, section 22, as D4's dependency): the
// landing's return path on the 3D path, read from the sources, since no browser runs here. Back from a family page, or
// /#families: the inline loader shows no wordmark and schedules no exit (a night veil), the hero skips its intro, snaps
// the page and its scroll followers to section 2's rest (S2T.LAND, 14.5 screens, which also undoes the browser's own
// scroll to nav#families) and lifts the veil through the loader's skip path once frame2 is in and the gems are built.
// Iteration 2 (the review of 2026-10-26): the skipped view transition into the landing is never a hero failure (item 1),
// Back to top's way home is not a return visit (item 2), and a return that falls to the poster centres the families (item 3).
// The prototype parity of the loader is tests/unit/inline-loader.test.ts; the browser row is specs/back.spec.ts.
//   node --test tests/family/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { S2T } from '../../src/config/hero.ts';
import { isAbortError, IslandDead } from '../../src/scripts/hero/bridge/life.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

test('the loader: RET from the two conditions of isReturnVisit(), on html.hero3d only and never for Back to top\'s way home; the ret class; no exit at FULL on a return visit', () => {
  const loader = read('src/inline/loader.inline.js');
  assert.match(loader, /^var TT=false;try\{TT=sessionStorage\.getItem\('skreed:to-top'\)==='1'\}catch\(e\)\{\}$/m, 'Back to top\'s flag, read inside a try as to-top.ts reads it');
  const ret = loader.match(/^var RET=(.*);if\(RET\)intro\.classList\.add\('ret'\);$/m)?.[1] ?? '';
  assert.ok(ret, 'the loader computes RET once');
  assert.ok(ret.startsWith('!TT&&'), 'never a return visit on Back to top\'s way home (item 2)');
  assert.ok(ret.includes("HT.classList.contains('hero3d')"), 'the landing\'s 3D path only: the family pages share this loader and lift it their own way');
  assert.ok(ret.includes("location.hash==='#families'") && ret.includes("type==='back_forward'"), 'the two conditions of isReturnVisit(), repeated inline (rock-links.ts)');
  assert.match(loader, /^if\(TT\)\{scrollTo\(0,0\);if\(location\.hash\)history\.replaceState\(history\.state,'',location\.pathname\+location\.search\)\}$/m, 'Back to top\'s fresh load starts at the top, its hash dropped so the fragment\'s own scroll cannot undo it');
  assert.match(loader, /if\(ready&&!RET&&tl>=FULL-\.001\)sched\(now\)/, 'on a return visit the exit is never scheduled: the island lifts the veil through skip()');
  assert.match(loader, /skip:function\(\)\{manual=true;ready=true;if\(ph!=='done'&&ph!=='lift'\)\{ph='enter';lift\(\)\}\}/, 'the skip path lifts at once');
  assert.match(loader, /history\.scrollRestoration='manual';if\(!location\.hash\)scrollTo\(0,0\);/, 'manual restoration, and no scroll to 0 with the hash (the return entry is always /#families)');
  assert.match(read('src/styles/shell.css'), /\.intro\.ret \.ld-w,\.intro\.ret #ldPct\{display:none\}/, 'a night veil: no wordmark, no percent; the status line can still show');
  const rock = read('src/scripts/family/rock-links.ts');
  assert.match(rock, /return nav\?\.type === 'back_forward' \|\| location\.hash === '#families';/, 'isReturnVisit() as the loader repeats it');
  const toTop = read('src/scripts/shell/to-top.ts');
  assert.match(toTop, /const FLAG = 'skreed:to-top'/, 'the flag the loader reads');
  assert.match(toTop, /function backHome\(\) \{\n\s+flag\.set\(\);/, 'set before Back to top steps back through the history');
});

test('the hero: the intro skipped, the page and both followers snapped to S2T.LAND under the veil, the lift once frame2 is in and the gems are built, the context checked on a restore; the loader\'s decision read, not made again', () => {
  assert.equal(S2T.LAND, 14.5);
  const hero = read('src/scripts/hero/hero.ts');
  assert.match(hero, /const ret = !!document\.getElementById\('intro'\)\?\.classList\.contains\('ret'\);/, 'the loader decided (item 2: to-top.ts has cleared its flag by now)');
  assert.doesNotMatch(hero, /import \{ isReturnVisit \}|= isReturnVisit\(\)/, 'never a second reading of the conditions');
  assert.match(hero, /createIglooIntro\(\{ [^}]*skip: ret[^}]*\}\)/, 'the shot is skipped on a return visit, as for a hash');
  assert.match(read('src/scripts/hero/intro/igloo.ts'), /const SKIP = reduce \|\| !!o\.skip \|\|/);
  assert.match(hero, /section2\.snapTo = \(screens\) => \{ scrollTo\(\{ top: Math\.round\(screens \* innerHeight\), behavior: 'instant' \}\); loop\.snap\(screens\); \};/, 'snapTo scrolls the page and sets both followers');
  assert.match(hero, /if \(ret\) \{\n\s+const snapTo = section2\.snapTo;\n\s+snapTo\(S2T\.LAND\);/, 'section 2 at rest at once, under the veil: the fragment\'s scroll to nav#families is undone');
  assert.match(hero, /if \(!L\.state\(\)\.ready \|\| !\(section2\.ready \|\| section2\.failed \|\| !loop\.running\)\) \{ requestAnimationFrame\(settle\); return; \}/, 'frame2 still gates the lift (the readiness model), and the gems are built first');
  assert.match(hero, /snapTo\(S2T\.LAND\); L\.skip\(\);/, 'snapped again, then the loader\'s skip path');
  assert.match(hero, /if \(e\.persisted && renderer\.getContext\(\)\.isContextLost\(\)\) o\.onHardFail\('webglcontextlost after restore'\)/, 'a back-forward cache restore with a lost context goes the way every lost context goes (boot.ts: the poster page)');
  assert.match(hero, /addEventListener\('pageshow', onShow\)/);
  // the poster path's half of the return (links.ts) is untouched: it scrolls the links into view off the 3D path
  assert.match(read('src/scripts/family/links.ts'), /if \(isReturnVisit\(\) && !document\.documentElement\.classList\.contains\('hero3d'\)\) nav\.scrollIntoView/);
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
  assert.match(gate, /addEventListener\('pagereveal', function \(e\) \{ var v = e\.viewTransition; if \(v\) \{ v\.ready\.catch\(function \(\) \{\}\); v\.finished\.catch\(function \(\) \{\}\); \} \}\);/, 'the Gate, in the head before the first render, handles both promises');
  assert.ok(gate.indexOf("addEventListener('pagereveal'") < gate.indexOf("addEventListener('error'"), 'before the module error guard');
});

test('item 3: a return visit that falls to the poster centres nav#families instead of keeping the 3D scroll offset', () => {
  const boot = read('src/scripts/boot.ts');
  assert.match(boot, /const fam = location\.hash === '#families' \? \$\('families'\) : null;/);
  assert.match(boot, /if \(fam\) fam\.scrollIntoView\(\{ block: 'center', behavior: 'instant' \}\);\n\s+else if \(y < before - innerHeight\) scrollTo\(\{ top: 0, behavior: 'instant' \}\);\n\s+else scrollTo\(\{ top: y - \(before - after\), behavior: 'instant' \}\);/, 'the centring takes the place of the offset keep, after the track has collapsed to one screen');
  assert.ok(boot.indexOf("H.classList.replace('hero3d', 'poster')") < boot.indexOf('fam.scrollIntoView'), 'the page is the poster page before the nav is centred, so the nav is in flow after one screen');
});
