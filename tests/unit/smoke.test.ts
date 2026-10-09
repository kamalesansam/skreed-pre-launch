import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('package.json pins every dependency exactly', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  const all = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;
  for (const [name, range] of Object.entries(all)) assert.match(range, /^\d+\.\d+\.\d+$/, `${name} is not an exact pin: ${range}`);
  assert.equal(all.astro, '7.3.8');
  assert.equal(all.three, '0.165.0');
});
