// The two models through the page's own loader, in Node (no WebGL needed): GLTFLoader with the vendored pure-JS meshopt
// decoder, the manifest's parts (the second model's ring among them), one normalisation for both LODs, LOD1 first and
// LOD0 only on request, plus T1's contract on the real files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Vector3 } from 'three';
import { loadSupplierAsset, type CaseManifest } from '../../src/scripts/family/three/case-glb.ts';
import type { CasePart } from '../../src/scripts/family/three/case-asset.ts';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('src/data/case-model.json', root), 'utf8')) as CaseManifest;
const realFetch = globalThis.fetch;
const requested: string[] = [];
globalThis.fetch = (async (url: string) => {
  requested.push(String(url));
  const b = readFileSync(new URL(`public${url}`, root));
  return new Response(b, { status: 200, headers: { 'content-type': 'model/gltf-binary' } });
}) as typeof fetch;
test.after(() => { globalThis.fetch = realFetch; });
const boxOf = (ps: CasePart[]) => { const box = new Box3(), t = new Box3(); for (const p of ps) { p.geometry.computeBoundingBox(); t.copy(p.geometry.boundingBox!).applyMatrix4(p.base); box.union(t); } return box; };
const tris = (ps: CasePart[]) => ps.reduce((s, p) => s + p.geometry.getIndex()!.count / 3, 0);

test('the Tough case: LOD1 first, LOD0 only on request; parts, tint, the accent colour and the normalised box', async () => {
  requested.length = 0;
  const a = await loadSupplierAsset(manifest);
  assert.deepEqual(requested, [manifest.lod1]);
  assert.equal(a.detail, 'deferred');
  assert.deepEqual(a.lods[1].map((p) => p.name), ['body', 'accent', 'logo']);
  assert.equal(a.lods[1].find((p) => p.name === 'logo')!.tint, 0.8468);
  const accent = a.lods[1].find((p) => p.name === 'accent')!;
  assert.ok(accent.color && accent.color[0] < 0.1 && Math.abs(accent.color[1] - accent.color[2]) < 1e-3, 'the trim keeps its dark grey');
  assert.ok(a.lods[1].find((p) => p.name === 'body')!.followsShade && !accent.followsShade);
  const box = boxOf(a.lods[1]);
  const size = box.getSize(new Vector3()), c = box.getCenter(new Vector3());
  assert.ok(Math.abs(size.y - 1) < 1e-6 && c.length() < 1e-6, `height ${size.y}, centre ${c.toArray()}`);
  assert.ok(Math.abs(a.dims.w - 0.532) < 0.002 && Math.abs(a.dims.d - 0.135) < 0.002);
  const lod0 = await a.loadDetail();
  assert.deepEqual(requested, [manifest.lod1, manifest.lod0]);
  assert.equal(a.detail, 'loaded');
  const b0 = boxOf(lod0);
  assert.ok(b0.min.distanceTo(box.min) < 1e-3 && b0.max.distanceTo(box.max) < 1e-3, `LOD0 box ${b0.min.toArray()} ${b0.max.toArray()}`);
  assert.equal(tris(lod0), manifest.triangles.lod0);
  assert.equal(tris(a.lods[1]), manifest.triangles.lod1);
  a.dispose();
});

test('the second model (Desert): shell, trim and ring, the ring following the shade, the same height-1 box, both LODs', async () => {
  requested.length = 0;
  const m = manifest.magtough!;
  const a = await loadSupplierAsset(m);
  assert.deepEqual(requested, [m.lod1]);
  assert.deepEqual(a.lods[1].map((p) => p.name), ['body', 'accent', 'ring']);
  const ring = a.lods[1].find((p) => p.name === 'ring')!;
  assert.ok(ring.followsShade, 'the ring takes the shade');
  assert.ok(ring.color && ring.color.every((v) => Math.abs(v - 1) < 1e-3), 'the ring is white in the file, like the shell');
  const box = boxOf(a.lods[1]), size = box.getSize(new Vector3()), c = box.getCenter(new Vector3());
  assert.ok(Math.abs(size.y - 1) < 1e-6 && c.length() < 1e-6, `height ${size.y}, centre ${c.toArray()}`);
  // the same case as the Cobalt: the silhouette does not jump at the hand-over (D3)
  assert.ok(Math.abs(a.dims.w - 0.532) < 0.003 && Math.abs(a.dims.d - 0.135) < 0.003, JSON.stringify(a.dims));
  const lod0 = await a.loadDetail();
  assert.deepEqual(lod0.map((p) => p.name), ['body', 'accent', 'ring']);
  assert.equal(tris(lod0), m.triangles.lod0);
  assert.equal(tris(a.lods[1]), m.triangles.lod1);
  // the ring sits on the outer back (+Z), inside the outline
  ring.geometry.computeBoundingBox();
  const rb = ring.geometry.boundingBox!.clone().applyMatrix4(ring.base);
  assert.ok(rb.getCenter(new Vector3()).z > 0, 'the ring is on the back');
  assert.ok(Math.abs(rb.getCenter(new Vector3()).x) < 0.1 && rb.getCenter(new Vector3()).y < -0.3 && rb.getCenter(new Vector3()).y > -0.45, 'the ring is centred, on the lower half of the back (the magnet area)');
  a.dispose();
});
