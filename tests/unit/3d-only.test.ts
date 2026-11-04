// E-3D-only (Sam, 2026-11-04; docs/specs/3d-only.md): the production build has no fallback a visitor's device can trigger.
// The browser suites run on test builds, which keep the harness's SwiftShader on the poster and the grid, so the production
// rules are read here from the source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { HONOUR_REDUCED_MOTION } from '../../src/config/hero.ts';
import { COPY_NOTE } from '../../src/config/copy.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

test('the Gate and the family head pick the 3D for every browser with WebGL2: no data saver, connection, memory or Reduce motion rule', () => {
  for (const p of ['src/inline/gate.inline.js', 'src/scripts/family/head.inline.js']) {
    const s = read(p);
    assert.doesNotMatch(s, /saveData|effectiveType|deviceMemory|prefers-reduced-motion|reducedTier/, p);
  }
  assert.match(read('src/inline/gate.inline.js'), /if \(!t\) t = !\('WebGL2RenderingContext' in window\) \|\| !\('DecompressionStream' in window\) \? 'nogl' : 'hero3d';/);
  assert.match(read('src/scripts/family/head.inline.js'), /CFG\.hooks && q\.get\('mode'\) === 'grid'/, '?mode=grid in test builds only');
});

test('Reduce motion is not honoured: the flag, motion.ts, the loader, the scene loops and no stylesheet', () => {
  assert.equal(HONOUR_REDUCED_MOTION, false);
  assert.match(read('src/scripts/motion.ts'), /matchMedia\(HONOUR_REDUCED_MOTION \? '\(prefers-reduced-motion: reduce\)' : 'not all'\)/);
  assert.doesNotMatch(read('src/inline/loader.inline.js'), /reduce/);
  assert.match(read('src/scripts/hero/section4/video.ts'), /reduced: false \}/);
  for (const f of readdirSync(new URL('src/styles/', root))) assert.doesNotMatch(read(`src/styles/${f}`), /prefers-reduced-motion/, f);
});

test('the software renderer leads to the poster or the grid in test and staging builds only', () => {
  const boot = read('src/scripts/boot.ts');
  assert.match(boot, /if \(gl === 'software' && import\.meta\.env\.PUBLIC_HERO_HOOKS === '1'\) \{ posterForTests\(\); return; \}/);
  assert.doesNotMatch(boot, /toPoster|onSoftPoster/);
  assert.match(read('src/scripts/hero/gfx/renderer.ts'), /failIfMajorPerformanceCaveat: false/);
  assert.match(read('src/scripts/family/three/boot.ts'), /const gl = glCheck\(!hooks \|\| /);
  assert.match(read('src/scripts/family/three/island.ts'), /const force = !HOOKS \|\| q\.get\('render'\) === 'force';/);
});

test('hard failures reload once, then the site note; the loader has no poster state', () => {
  const note = read('src/scripts/shell/note.ts');
  assert.match(note, /if \(n < 1\) location\.reload\(\); else showNote\('failed'\);/);
  assert.match(note, /addEventListener\('online', \(\) => location\.reload\(\), \{ once: true \}\);/);
  assert.doesNotMatch(read('src/inline/loader.inline.js'), /function poster\(|'poster'/);
  assert.match(read('src/scripts/family/three/boot.ts'), /function fail\(reason: string\): void \{[\s\S]*?failHard\(\);\n\}/);
  assert.match(read('src/scripts/hero/section4/director.ts'), /const toPoster = \(\) => \{ console\.warn\('section 4: scene 1 cannot be drawn'\); failHard\(\); \};/);
});

test('the site note: three lines, short, no em dashes; on the landing page and every family page', () => {
  for (const v of Object.values(COPY_NOTE)) { assert.doesNotMatch(v, /[—–]/); assert.ok(v.length <= 80, v); }
  assert.match(read('src/pages/index.astro'), /<SiteNote \/>/);
  assert.match(read('src/pages/shades/[family].astro'), /<SiteNote \/>/);
});
