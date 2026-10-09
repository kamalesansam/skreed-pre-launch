// The shades: 240 in catalog order, 24 per family, the hero's selections by id equal hero.md section 3,
// and the 240 CSS tokens (spec D30).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { SHADES, SHADE_HEX, REGION, BLOCK_ORDER, BLOCK_SHADES, GALAXY, GLITCH_PAIRS, GLITCH_LIGHT } from '../../src/config/shades.gen.ts';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const data = JSON.parse(read('docs/data/shades-240.json'));
const heroMd = read('docs/specs/hero.md');
const byId = new Map(SHADES.map((s) => [s.id, s]));

test('the generated files are up to date with docs/data/shades-240.json', () => {
  execFileSync(process.execPath, ['scripts/hero/gen-shades.mjs', '--check'], { cwd: new URL(root).pathname, stdio: 'pipe' });
});

test('240 shades, 24 per family, catalog order, catalog numbers 1 to 240', () => {
  assert.equal(SHADES.length, 240);
  assert.equal(SHADE_HEX.length, 240);
  assert.equal(data.families.length, 10);
  data.families.forEach((f: { id: string; shades: { id: string; hex: string }[] }, fi: number) => {
    assert.equal(f.shades.length, 24, f.id);
    f.shades.forEach((s, si) => {
      const g = SHADES[fi * 24 + si];
      assert.equal(g.id, s.id);
      assert.equal(g.hex, s.hex);
      assert.equal(g.family, f.id);
      assert.equal(g.n, fi * 24 + si + 1);
      assert.equal(SHADE_HEX[fi * 24 + si], s.hex);
    });
  });
  assert.equal(SHADES[0].id, 'frosty-whites-01');
  assert.equal(SHADES[239].id, 'roaring-reds-24');
});

// hero.md section 3, "Block glows": | Block | Id | Name | Hex |
function blockTable() {
  const rows = [...heroMd.matchAll(/^\| (\d) \| ([a-z-]+-\d\d) \| ([A-Za-z ]+) \| (#[0-9a-f]{6}) \|$/gm)];
  return rows.map((m) => ({ block: +m[1], id: m[2], name: m[3], hex: m[4] }));
}

test('block glows equal hero.md section 3, by id', () => {
  const rows = blockTable();
  assert.equal(rows.length, 10);
  rows.forEach((r, i) => {
    assert.equal(r.block, i);
    assert.deepEqual(BLOCK_SHADES[i], { id: r.id, name: r.name, hex: r.hex });
    assert.equal(byId.get(r.id)?.hex, r.hex);
    assert.deepEqual(REGION[BLOCK_ORDER[i]], BLOCK_SHADES[i]);
  });
});

test('REGION is one shade per family, in catalog family order', () => {
  assert.equal(REGION.length, 10);
  REGION.forEach((s, i) => assert.ok(s.id.startsWith(data.families[i].id + '-'), s.id));
});

test('galaxy wash equals hero.md section 3, by id', () => {
  const line = heroMd.split('\n').find((l) => l.startsWith('Sky galaxy wash:'));
  assert.ok(line);
  const want = [...line.matchAll(/([a-z]+-[a-z]+-\d\d) ([A-Za-z]+) (#[0-9a-f]{6})/g)].map((m) => ({ id: m[1], name: m[2], hex: m[3] }));
  assert.equal(want.length, 4);
  assert.deepEqual([...GALAXY], want);
  for (const g of GALAXY) assert.equal(byId.get(g.id)?.hex, g.hex);
});

test('glitch pairs and lightness equal hero.md section 3, by id', () => {
  const start = heroMd.indexOf('Logotype glitch pairs');
  const block = heroMd.slice(start, heroMd.indexOf('Lightness weights', start));
  const pairs = [...block.matchAll(/^- ([a-z-]+-\d\d) [A-Za-z]+ with ([a-z-]+-\d\d) [A-Za-z]+;?\.?$/gm)].map((m) => [m[1], m[2]]);
  assert.equal(pairs.length, 4);
  assert.deepEqual(GLITCH_PAIRS.map((p) => [...p]), pairs);
  const lw = heroMd.split('\n').find((l) => l.startsWith('Lightness weights for the glitch'));
  assert.ok(lw);
  const weights = Object.fromEntries([...lw.matchAll(/([A-Z][a-z]+) \.(\d+)/g)].map((m) => [m[1], +('0.' + m[2])]));
  const nameOf = (id: string) => REGION.find((s) => s.id === id)?.name;
  const got = Object.fromEntries(Object.entries(GLITCH_LIGHT).map(([id, v]) => [nameOf(id), v]));
  assert.deepEqual(got, weights);
});

test('shades.gen.css carries the 240 tokens, --shade-<id>, in catalog order, 7,855 B raw', () => {
  const css = read('src/styles/shades.gen.css');
  assert.equal(Buffer.byteLength(css), 7855);
  const toks = [...css.matchAll(/--shade-([a-z-]+-\d\d):(#[0-9a-fA-F]{6});/g)];
  assert.equal(toks.length, 240);
  toks.forEach((m, i) => { assert.equal(m[1], SHADES[i].id); assert.equal(m[2], SHADES[i].hex); });
});

test('src/data/family-keys.json is REGION with catalog numbers (shared with section 2 and the family pages)', () => {
  const keys = JSON.parse(read('src/data/family-keys.json'));
  assert.equal(keys.length, 10);
  keys.forEach((k: { family: string; shade: string; n: number }, i: number) => {
    assert.equal(k.family, data.families[i].id);
    assert.equal(k.shade, REGION[i].id);
    assert.equal(k.n, byId.get(k.shade)?.n);
  });
  // family-page.md 2.1: the key shades' catalog numbers
  assert.deepEqual(keys.map((k: { n: number }) => k.n), [7, 32, 62, 79, 97, 127, 148, 173, 204, 223]);
});
