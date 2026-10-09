// The loader weights (hero-architecture.md 7.4): 23 keys, first import, last frame2, each at least 0.01, sum 1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const WT: Record<string, number> = JSON.parse(readFileSync(new URL('../../src/config/loader-weights.json', import.meta.url), 'utf8'));

test('loader weights: 23 milestones in start-up order, floor 0.01, sum 1', () => {
  const keys = Object.keys(WT);
  assert.equal(keys.length, 23);
  assert.deepEqual(keys, ['import', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'sky', 'ground', 'scene', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'compile', 'frame1', 'frame2']);
  for (const k of keys) assert.ok(WT[k] >= 0.01, `${k} is below the 0.01 floor`);
  const sum = keys.reduce((a, k) => a + WT[k], 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `sum is ${sum}`);
});
