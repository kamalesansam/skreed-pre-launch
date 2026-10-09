// Stage 1 assets are byte-identical to the prototype's (hero-architecture.md 6.1, spec D7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const sha = (u: URL) => createHash('sha256').update(readFileSync(u)).digest('hex');

test('src/assets/hero/SHA256SUMS covers every stage 1 file and matches the copies and the prototype', () => {
  const lines = readFileSync(new URL('src/assets/hero/SHA256SUMS', root), 'utf8').trim().split('\n');
  const expected = [...readdirSync(new URL('prototypes/hero-v9/assets/', root)).sort(), 'pieces.json'];
  assert.deepEqual(lines.map((l) => l.split('  ')[1]), expected);
  for (const line of lines) {
    const [hash, name] = line.split('  ');
    const proto = new URL(name === 'pieces.json' ? 'prototypes/hero-v9/pieces.json' : `prototypes/hero-v9/assets/${name}`, root);
    assert.equal(sha(new URL(`src/assets/hero/${name}`, root)), hash, `${name}: copy differs from SHA256SUMS`);
    assert.equal(sha(proto), hash, `${name}: prototype differs from SHA256SUMS`);
  }
});

test('the lossless masters are recorded (assets-src/hero/masters/SHA256SUMS)', () => {
  const lines = readFileSync(new URL('assets-src/hero/masters/SHA256SUMS', root), 'utf8').trim().split('\n');
  assert.deepEqual(lines.map((l) => l.split('  ')[1]), ['sky.png', 'ground_bake.png']);
  for (const l of lines) assert.match(l.split('  ')[0], /^[0-9a-f]{64}$/);
});
