// The supplier model through the page's own loader, in Node (no WebGL needed): GLTFLoader with the vendored pure-JS
// meshopt decoder, the manifest's parts, one normalisation for both LODs, and picking that covers every part of the
// front case (case-model-class.md amendment 2: trim pixels must hit the front slot), plus T1's contract on the real file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Matrix4, Raycaster, Vector3 } from 'three';
import { loadSupplierAsset, type CaseManifest } from '../../src/scripts/family/three/case-glb.ts';
import { CaseLineup } from '../../src/scripts/family/three/case-lineup.ts';
import { SUPPLIER_TUNING, cameraAt, derive, lineupFor, pose, solveFraming } from '../../src/scripts/family/three/pose.ts';

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

test('LOD1 first, LOD0 only on request; parts, tint and the normalised box', async () => {
  const a = await loadSupplierAsset(manifest);
  assert.deepEqual(requested, [manifest.lod1]);
  assert.equal(a.detail, 'deferred');
  assert.deepEqual(a.lods[1].map((p) => p.name), ['body', 'accent', 'logo']);
  assert.equal(a.lods[1].find((p) => p.name === 'logo')!.tint, 0.8468);
  assert.ok(a.lods[1].find((p) => p.name === 'body')!.followsShade && !a.lods[1].find((p) => p.name === 'accent')!.followsShade);
  const box = new Box3(), t = new Box3();
  for (const p of a.lods[1]) { p.geometry.computeBoundingBox(); t.copy(p.geometry.boundingBox!).applyMatrix4(p.base); box.union(t); }
  const size = box.getSize(new Vector3()), c = box.getCenter(new Vector3());
  assert.ok(Math.abs(size.y - 1) < 1e-6 && c.length() < 1e-6, `height ${size.y}, centre ${c.toArray()}`);
  assert.ok(Math.abs(a.dims.w - 0.532) < 0.002 && Math.abs(a.dims.d - 0.135) < 0.002);
  const lod0 = await a.loadDetail();
  assert.deepEqual(requested, [manifest.lod1, manifest.lod0]);
  assert.equal(a.detail, 'loaded');
  assert.deepEqual(lod0.map((p) => p.name), ['body', 'accent', 'logo']);
  // both LODs share the normalisation: LOD0's box matches LOD1's within the dequantisation step
  const b0 = new Box3();
  for (const p of lod0) { p.geometry.computeBoundingBox(); t.copy(p.geometry.boundingBox!).applyMatrix4(p.base); b0.union(t); }
  assert.ok(b0.min.distanceTo(box.min) < 1e-3 && b0.max.distanceTo(box.max) < 1e-3, `LOD0 box ${b0.min.toArray()} ${b0.max.toArray()}`);
  // triangles as the manifest says
  const tris = (ps: typeof lod0) => ps.reduce((s, p) => s + p.geometry.getIndex()!.count / 3, 0);
  assert.equal(tris(lod0), manifest.triangles.lod0);
  assert.equal(tris(a.lods[1]), manifest.triangles.lod1);
  a.dispose();
});

test('picking: a ray through the front case trim (the camera surround) hits the front slot, not the row behind it', async () => {
  const a = await loadSupplierAsset(manifest);
  await a.loadDetail();
  const lineup = new CaseLineup(a, 24, { tier: 'high' });
  lineup.setShades(Array.from({ length: 24 }, () => ({ hex: '#08bcf4' })));
  lineup.setDetail(a.lods[0]);
  const P = lineupFor(a.dims, 'wide', SUPPLIER_TUNING), K = derive(P);
  for (const sel of [0, 11, 23]) {
    const posef = (slot: number, out: Matrix4) => { pose(slot, sel, 1, P, K, out); };
    lineup.setPoses(posef, [sel, sel + 1 < 24 ? sel + 1 : sel - 1]);
    lineup.object.updateMatrixWorld(true);
    const f = solveFraming(1280, 728, 'wide', P);
    const cam = cameraAt(1280, 728, f.D, P);
    // trim vertices on the outer back (+Z), well inside the case outline: the camera surround
    const trim = a.lods[0].find((p) => p.name === 'accent')!;
    const pos = trim.geometry.getAttribute('position'), m = new Matrix4(), v = new Vector3();
    posef(sel, m);
    const world = m.clone().multiply(trim.base);
    const cand: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(trim.base);
      if (v.z > 0.02 && Math.abs(v.x) < 0.25 && v.y > 0.25) cand.push(i);   // the camera surround on the back, top
    }
    let hits = 0, tried = 0;
    for (let k = 0; k < cand.length; k += Math.max(1, Math.floor(cand.length / 40))) {
      tried++;
      const wpt = new Vector3().fromBufferAttribute(pos, cand[k]).applyMatrix4(world);
      const ray = new Raycaster(cam.position.clone(), wpt.clone().sub(cam.position).normalize());
      if (lineup.pick(ray) === sel) hits++;
    }
    assert.ok(tried >= 10, `found ${tried} trim points`);
    assert.ok(hits / tried >= 0.95, `selection ${sel + 1}: ${hits} of ${tried} trim points pick the front slot`);
  }
  lineup.dispose();
  a.dispose();
});
