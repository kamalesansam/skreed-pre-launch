// The wipe's data texture equals the prototype's, byte for byte (hero-architecture.md 5.1): the integer hash with its
// double rounding, the recursive block split, the Voronoi shards. The prototype function is read from template.html and
// run against a stub DataTexture; the port's runs against three's. Filled in the same ten bands as the block build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { functionSource } from './proto-source.ts';
import { makeScrollTexture } from '../../src/scripts/hero/post/wipeTexture.ts';

test('makeScrollTexture(512) equals the prototype function, filled band by band', () => {
  const THREE = { DataTexture: class { image: { data: Uint8Array }; constructor(data: Uint8Array) { this.image = { data }; } }, RGBAFormat: 1023, RepeatWrapping: 1000, LinearFilter: 1006 };
  const protoMake = new Function('THREE', functionSource('function makeScrollTexture(') + '\nreturn makeScrollTexture;')(THREE) as (n: number) => { tex: { image: { data: Uint8Array } }; fill(a: number, b: number): void };
  const a = protoMake(512), b = makeScrollTexture(512);
  for (let id = 0; id < 10; id++) { a.fill(Math.round(id * 51.2), Math.round((id + 1) * 51.2)); b.fill(Math.round(id * 51.2), Math.round((id + 1) * 51.2)); }
  const da = a.tex.image.data, db = b.tex.image.data as Uint8Array;
  assert.equal(db.length, 512 * 512 * 4);
  const ha = createHash('sha256').update(da).digest('hex'), hb = createHash('sha256').update(db).digest('hex');
  assert.equal(hb, ha);
  let nonzero = 0; for (let i = 0; i < db.length; i += 4) if (db[i] || db[i + 1] || db[i + 2]) nonzero++;
  assert.ok(nonzero > 512 * 500, 'the texture is filled');
  console.log('wipe texture sha256 ' + hb);
});
