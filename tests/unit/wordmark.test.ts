// The wordmark (hero-architecture.md 6.1): docs/brand/logo/skreed-logotype.svg's six paths are byte-identical to the
// prototype's sprite, which WordmarkSprite.astro builds #skreed-wordmark from.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

test('six paths, identical to the prototype sprite, in the same order', () => {
  const brand = [...read('docs/brand/logo/skreed-logotype.svg').matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  const t = read('prototypes/hero-v9/template.html');
  const g = t.slice(t.indexOf('<g id="skreed-wordmark"'), t.indexOf('</g></defs></svg>'));
  const proto = [...g.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(brand.length, 6);
  assert.deepEqual(brand, proto);
});
