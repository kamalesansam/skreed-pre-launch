// E-3D-only (Sam, 2026-11-04; docs/specs/3d-only.md): the production build has no fallback a visitor's device can trigger.
// The browser suites run on test builds, which keep the harness's SwiftShader on the poster and the grid, so the production
// rules are read here from the source.
// Split on 2026-11-09 for the redesign (docs/specs/redesign.md D2, D3 and E-RD-design), by the three places the rule now
// has. No assertion was dropped; one was replaced, the landing page's <SiteNote />, which the redesigned page does not
// mount (the last row says what it mounts instead).
//   1. The family pages keep their 3D, and every row this file held of them stands as it was.
//   2. The old landing's own source (the Gate, boot.ts, the island's renderer, section 4's director and loops) stays on
//      disk, unmounted and unedited (D2: one revert or a branch switch brings that page back). Its rows are kept, named
//      as that source's, because each still holds and criterion 12 says those files do not move. The site they describe
//      runs at the ref archive/site-before-redesign-2026-11-09.
//   3. The landing page is the redesign: no Gate, no loader, no site note, no island, so there is no tier to fall from
//      and nothing to fall to. Its motion reads the one Reduce motion flag the site has.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { posix } from 'node:path';
import { HONOUR_REDUCED_MOTION } from '../../src/config/hero.ts';
import { COPY_NOTE } from '../../src/config/copy.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
/** every file under a folder of src/, as paths from the repository's root */
const walk = (dir: string): string[] => readdirSync(new URL(dir, root)).flatMap((n) => (statSync(new URL(`${dir}${n}`, root)).isDirectory() ? walk(`${dir}${n}/`) : [`${dir}${n}`]));
/** what a source file imports, statically or by import(): a relative specifier as a path from the repository's root (its ?raw or ?url taken off), a package by its name */
const importsOf = (file: string): string[] => [...read(file).matchAll(/(?:^|[\s;])import\s*(?:[^'"()]*?\sfrom\s*)?\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1].replace(/\?.*$/, '')).map((spec) => (spec.startsWith('.') ? posix.normalize(posix.join(posix.dirname(file), spec)) : spec));

// ---- 1. the family pages, and what the whole site shares ----

test('the family head picks the 3D for every browser with WebGL2: no data saver, connection, memory or Reduce motion rule', () => {
  const s = read('src/scripts/family/head.inline.js');
  assert.doesNotMatch(s, /saveData|effectiveType|deviceMemory|prefers-reduced-motion|reducedTier/);
  assert.match(s, /CFG\.hooks && q\.get\('mode'\) === 'grid'/, '?mode=grid in test builds only');
});

test('Reduce motion is not honoured: the flag, motion.ts, the loader and no stylesheet, the redesign\'s among them', () => {
  assert.equal(HONOUR_REDUCED_MOTION, false);
  assert.match(read('src/scripts/motion.ts'), /matchMedia\(HONOUR_REDUCED_MOTION \? '\(prefers-reduced-motion: reduce\)' : 'not all'\)/);
  assert.doesNotMatch(read('src/inline/loader.inline.js'), /reduce/);
  const sheets = readdirSync(new URL('src/styles/', root));
  for (const f of sheets) assert.doesNotMatch(read(`src/styles/${f}`), /prefers-reduced-motion/, f);
  // the loop reads the redesigned page's stylesheets as it reads every other (2026-11-09)
  assert.ok(sheets.includes('redesign.css') && sheets.some((f) => /^rd-.+\.css$/.test(f)), 'redesign.css and the rd-<section>.css files are in src/styles');
});

test('the family pages: the software renderer leads to the grid in test and staging builds only', () => {
  assert.match(read('src/scripts/family/three/boot.ts'), /const gl = glCheck\(!hooks \|\| /);
  assert.match(read('src/scripts/family/three/island.ts'), /const force = !HOOKS \|\| q\.get\('render'\) === 'force';/);
});

test('hard failures reload once, then the site note; the loader has no poster state', () => {
  const note = read('src/scripts/shell/note.ts');
  assert.match(note, /if \(n < 1\) location\.reload\(\); else showNote\('failed'\);/);
  assert.match(note, /addEventListener\('online', \(\) => location\.reload\(\), \{ once: true \}\);/);
  assert.doesNotMatch(read('src/inline/loader.inline.js'), /function poster\(|'poster'/);
  assert.match(read('src/scripts/family/three/boot.ts'), /function fail\(reason: string\): void \{[\s\S]*?failHard\(\);\n\}/);
});

test('the site note: three lines, short, no em dashes; on every family page', () => {
  for (const v of Object.values(COPY_NOTE)) { assert.doesNotMatch(v, /[\u2014\u2013]/); assert.ok(v.length <= 80, v); }
  assert.match(read('src/pages/shades/[family].astro'), /<SiteNote \/>/);
});

// ---- 2. the old landing's source, on disk and unmounted since 2026-11-09 (docs/specs/redesign.md D2) ----

test('the old landing\'s Gate (kept on disk, mounted by no page): the 3D for every browser with WebGL2, no data saver, connection, memory or Reduce motion rule', () => {
  const s = read('src/inline/gate.inline.js');
  assert.doesNotMatch(s, /saveData|effectiveType|deviceMemory|prefers-reduced-motion|reducedTier/);
  assert.match(s, /if \(!t\) t = !\('WebGL2RenderingContext' in window\) \|\| !\('DecompressionStream' in window\) \? 'nogl' : 'hero3d';/);
});

test('the old landing\'s island and scenes (kept on disk): the software renderer leads to the poster in test builds only, the loops never read Reduce motion, and scene 1 failing is a hard failure', () => {
  const boot = read('src/scripts/boot.ts');
  assert.match(boot, /if \(gl === 'software' && import\.meta\.env\.PUBLIC_HERO_HOOKS === '1'\) \{ posterForTests\(\); return; \}/);
  assert.doesNotMatch(boot, /toPoster|onSoftPoster/);
  assert.match(read('src/scripts/hero/gfx/renderer.ts'), /failIfMajorPerformanceCaveat: false/);
  assert.match(read('src/scripts/hero/section4/video.ts'), /reduced: false \}/);
  assert.match(read('src/scripts/hero/section4/director.ts'), /const toPoster = \(\) => \{ console\.warn\('section 4: scene 1 cannot be drawn'\); failHard\(\); \};/);
});

// ---- 3. the redesigned landing (docs/specs/redesign.md D3, D16 and E-RD-design; 2026-11-09) ----

test('the redesigned landing mounts no Gate, no loader, no site note, no island and no section 4: one page for every visitor, with no tier to fall from', () => {
  // until 2026-11-09 this row read: index.astro mounts <SiteNote />. The redesigned page has no 3D to fail (E-RD-design:
  // "the landing has no 3D; the family pages keep theirs"), so it carries no note, and none of the parts that picked a tier
  const index = read('src/pages/index.astro');
  const imports = importsOf('src/pages/index.astro');
  assert.ok(imports.length >= 10 && imports.includes('src/components/shell/SiteLogo.astro'), 'the page\'s imports are read, as paths from the root');
  for (const gone of ['Gate', 'Loader', 'SiteNote', 'HeroStage', 'Room']) {
    assert.ok(!imports.some((p) => p.endsWith(`/${gone}.astro`)), `index.astro imports ${gone}.astro`);
    assert.doesNotMatch(index, new RegExp(`<${gone}\\b`), `index.astro mounts <${gone}>`);
  }
  // D3 names two more: the old page's boot script and its stylesheet
  for (const gone of ['src/scripts/boot.ts', 'src/styles/shell.css']) assert.ok(!imports.includes(gone), `index.astro imports ${gone}`);
  // and nothing of the redesign's own reaches the old island, its scenes or three by an import: not the page, not a
  // section's component, not a section's script (config/room.ts counts: its eager glob would ship the ten loops)
  const OLD = (p: string) => /^src\/(?:scripts\/hero|components\/hero|components\/room)\//.test(p) || p === 'src/config/room.ts' || p === 'src/scripts/boot.ts' || p === 'three' || p.startsWith('three/');
  const own = ['src/pages/index.astro', ...walk('src/components/redesign/'), ...walk('src/scripts/redesign/')].filter((p) => /\.(?:astro|ts)$/.test(p));
  assert.ok(own.length >= 20, `${own.length} files of the redesign read`);
  let read_ = 0;
  for (const p of own) { const list = importsOf(p); read_ += list.length; assert.deepEqual(list.filter(OLD), [], `${p} imports the old landing's island, its scenes or three`); }
  assert.ok(read_ >= 60, `${read_} imports read`);
  assert.equal(OLD('src/scripts/hero/hero.ts') && OLD('src/components/room/Room.astro') && OLD('three/addons/loaders/GLTFLoader.js') && !OLD('src/scripts/family/rock-links.ts') && !OLD('gsap'), true);
});

test('the redesigned landing\'s motion runs for every visitor: its one query comes from the site\'s flag, and nothing else on the page reads Reduce motion', () => {
  const motion = read('src/scripts/redesign/motion.ts');
  assert.match(motion, /^import \{ reducedMQ \} from '\.\.\/motion\.ts';$/m);
  // 'not all' (the flag off, as it is) makes the page's query 'all': every setup runs. The other branch is what the
  // page would do were the flag honoured again, and it is the only place the redesign names the media feature
  assert.match(motion, /^const MOTION_MQ = reducedMQ\.media === 'not all' \? 'all' : '\(prefers-reduced-motion: no-preference\)';$/m);
  const own = [...walk('src/components/redesign/'), ...walk('src/scripts/redesign/')].filter((p) => /\.(?:astro|ts)$/.test(p));
  for (const p of own) {
    const hits = read(p).split('\n').filter((l) => /prefers-reduced-motion/.test(l) && !/^\s*(?:\/\/|\*|\/\*)/.test(l));
    assert.equal(hits.length, p === 'src/scripts/redesign/motion.ts' ? 1 : 0, `${p}: ${hits.join(' | ')}`);
  }
});
