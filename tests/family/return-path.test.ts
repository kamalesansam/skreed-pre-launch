// Section 13 step 3 (docs/specs/family-page.md 2.2 and 13; built with round 4, section 22, as D4's dependency): the
// landing's return path on the 3D path, read from the sources, since no browser runs here. Back from a family page, or
// /#families: the inline loader shows no wordmark and schedules no exit (a night veil), the hero skips its intro, snaps
// the page and its scroll followers to section 2's rest (S2T.LAND, 14.5 screens, which also undoes the browser's own
// scroll to nav#families) and lifts the veil through the loader's skip path once frame2 is in and the gems are built.
// The prototype parity of the loader is tests/unit/inline-loader.test.ts; the browser row is specs/back.spec.ts.
//   node --test tests/family/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { S2T } from '../../src/config/hero.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

test('the loader: RET from the two conditions of isReturnVisit(), on html.hero3d only; the ret class; no exit at FULL on a return visit', () => {
  const loader = read('src/inline/loader.inline.js');
  const ret = loader.match(/^var RET=(.*);if\(RET\)intro\.classList\.add\('ret'\);$/m)?.[1] ?? '';
  assert.ok(ret, 'the loader computes RET once');
  assert.ok(ret.includes("HT.classList.contains('hero3d')"), 'the landing\'s 3D path only: the family pages share this loader and lift it their own way');
  assert.ok(ret.includes("location.hash==='#families'") && ret.includes("type==='back_forward'"), 'the two conditions of isReturnVisit(), repeated inline (rock-links.ts)');
  assert.match(loader, /if\(ready&&!RET&&tl>=FULL-\.001\)sched\(now\)/, 'on a return visit the exit is never scheduled: the island lifts the veil through skip()');
  assert.match(loader, /skip:function\(\)\{manual=true;ready=true;if\(ph!=='done'&&ph!=='lift'\)\{ph='enter';lift\(\)\}\}/, 'the skip path lifts at once');
  assert.match(loader, /history\.scrollRestoration='manual';if\(!location\.hash\)scrollTo\(0,0\);/, 'manual restoration, and no scroll to 0 with the hash (the return entry is always /#families)');
  assert.match(read('src/styles/shell.css'), /\.intro\.ret \.ld-w,\.intro\.ret #ldPct\{display:none\}/, 'a night veil: no wordmark, no percent; the status line can still show');
  const rock = read('src/scripts/family/rock-links.ts');
  assert.match(rock, /return nav\?\.type === 'back_forward' \|\| location\.hash === '#families';/, 'isReturnVisit() as the loader repeats it');
});

test('the hero: the intro skipped, the page and both followers snapped to S2T.LAND under the veil, the lift once frame2 is in and the gems are built, the context checked on a restore', () => {
  assert.equal(S2T.LAND, 14.5);
  const hero = read('src/scripts/hero/hero.ts');
  assert.match(hero, /import \{ isReturnVisit \} from '\.\.\/family\/rock-links\.ts';/);
  assert.match(hero, /const ret = isReturnVisit\(\);/);
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
