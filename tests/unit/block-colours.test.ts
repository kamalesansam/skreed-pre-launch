// AC6.4 (table part): the port's block shades, in block order, equal the prototype's 'cool' order resolved through the
// prototype's own FAMILIES (inlined in prototypes/hero-v9/index.html), and assignBlockColours writes them by block.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Color } from 'three';
import { BLOCK_SHADES } from '../../src/config/shades.gen.ts';
import { assignBlockColours } from '../../src/scripts/hero/logo/uniforms.ts';
import { constSource } from './proto-source.ts';

const INDEX = readFileSync(fileURLToPath(new URL('../../prototypes/hero-v9/index.html', import.meta.url)), 'utf8');

test('the cool order resolved through the prototype FAMILIES equals BLOCK_SHADES', () => {
  const m = /const FAMILIES = (\[.*?\]);\n/s.exec(INDEX);
  assert.ok(m, 'FAMILIES inlined in index.html');
  const FAMILIES = JSON.parse(m![1]) as { n: string; s: [string, string][] }[];
  const orders = new Function(constSource('BLOCK_ORDERS') + '\nreturn BLOCK_ORDERS;')() as Record<string, string[]>;
  const REGION = [['Frosty Whites', 'Snow'], ['Blissful Blues', 'Sky'], ['Playful Pinks', 'Rouge'], ['Vivid Violets', 'Amethyst'], ['Mellow Yellows', 'Sunbeam'],
    ['Earthy Browns', 'Cinnamon'], ['Blushing Corals', 'Mango'], ['Stormy Greys', 'Silver'], ['Go Green', 'Lawn'], ['Roaring Reds', 'Crimson']];
  const hexOf = (name: string) => { const [fam] = REGION.find(([, n]) => n === name)!; return FAMILIES.find((f) => f.n === fam)!.s.find((s) => s[0] === name)![1]; };
  assert.deepEqual(BLOCK_SHADES.map((s) => s.hex.toLowerCase()), orders.cool.map((n) => hexOf(n).toLowerCase()));
  assert.deepEqual(BLOCK_SHADES.map((s) => s.name), orders.cool);
});

test('assignBlockColours sets block i to BLOCK_SHADES[i] (linear working colour, as new Color(hex) in the prototype)', () => {
  const U = { uBlockCol: { value: Array.from({ length: 30 }, () => new Color()) } } as unknown as Parameters<typeof assignBlockColours>[1];
  const blocks = Array.from({ length: 10 }, () => ({})) as Parameters<typeof assignBlockColours>[0];
  assignBlockColours(blocks, U);
  BLOCK_SHADES.forEach((s, i) => {
    const want = new Color(s.hex);
    assert.ok(U.uBlockCol.value[i].equals(want), `block ${i}`);
    assert.equal('#' + U.uBlockCol.value[i].getHexString(), s.hex.toLowerCase());
  });
});
