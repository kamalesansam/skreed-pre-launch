// Stage 1 assets are byte-identical to the prototype's (hero-architecture.md 6.1, spec D7). The reference is v9.10,
// pinned in tests/fixtures/hero-v9.10/ (assets.SHA256SUMS, taken from git at ccce3fb), not prototypes/hero-v9/, which later
// prototype builds replace in place.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { REF_DIR, REF_SHA256, readReference, referenceAssetSums } from '../harness/reference.ts';

const root = new URL('../../', import.meta.url);
const sha = (u: URL | string) => createHash('sha256').update(readFileSync(u)).digest('hex');

test('src/assets/hero/SHA256SUMS equals the v9.10 asset manifest, and every copy matches it', () => {
  const lines = readFileSync(new URL('src/assets/hero/SHA256SUMS', root), 'utf8').trim().split('\n');
  const ref = referenceAssetSums();
  assert.equal(ref.length, 8);
  assert.deepEqual(lines, ref.map((r) => `${r.hash}  ${r.name}`));
  for (const { hash, name } of ref) {
    assert.equal(sha(new URL(`src/assets/hero/${name}`, root)), hash, `${name}: copy differs from prototype v9.10`);
  }
});

test('the pinned v9.10 reference files are intact (SHA256SUMS and the hashes in reference.ts agree with the bytes)', () => {
  const lines = readFileSync(REF_DIR + 'SHA256SUMS', 'utf8').trim().split('\n');
  assert.deepEqual(lines, Object.entries(REF_SHA256).map(([n, h]) => `${h}  ${n}`));
  for (const name of Object.keys(REF_SHA256) as (keyof typeof REF_SHA256)[]) {
    assert.equal(sha(REF_DIR + name), REF_SHA256[name], `${name} changed`);
    assert.doesNotThrow(() => readReference(name));
  }
});

test('the lossless masters are recorded (assets-src/hero/masters/SHA256SUMS)', () => {
  const lines = readFileSync(new URL('assets-src/hero/masters/SHA256SUMS', root), 'utf8').trim().split('\n');
  assert.deepEqual(lines.map((l) => l.split('  ')[1]), ['sky.png', 'ground_bake.png']);
  for (const l of lines) assert.match(l.split('  ')[0], /^[0-9a-f]{64}$/);
});
