// Section 4's products as shipped for the Flux carousel (scripts/room/products-bin.mjs; src/assets/room/flux/products.bin):
// the committed bin and its manifest are the script's output from the four GLBs byte for byte (so a re-export cannot
// leave a stale binary), the island's parser reads back every product's parts with the GLBs' own names, triangles,
// corners and normals (the GLBs decoded here as room-products.test.ts does), each product at the manifests' life size
// within 1 percent and centred on the origin, unit normals within 1 percent, the file no larger than its payload, and
// the parser carries no glTF loader and gzips under 2 KB.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { Box3, Vector3, type Mesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../src/scripts/family/three/vendor/meshopt-decoder-reference.js';
import { BIN_PATH, LINE_KB, MANIFEST_PATH, PRODUCT_SOURCES, productsBin } from '../../scripts/room/products-bin.mjs';
import { parseProductsBin } from '../../src/scripts/hero/section4/products-bin.ts';
import ROOM from '../../src/data/room-products.json' with { type: 'json' };
import CASE from '../../src/data/case-model.json' with { type: 'json' };
import MANIFEST from '../../src/data/room-products-bin.json' with { type: 'json' };

const root = new URL('../../', import.meta.url);
const file = (path: string) => readFileSync(new URL(path, root));
const bin = file(BIN_PATH), ab = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.length) as ArrayBuffer;
const sources = PRODUCT_SOURCES.map((s: { name: string; path: string }) => ({ ...s, glb: file(s.path) }));
const products = parseProductsBin(ab);
const KB = 1024;

type GlbPart = { name: string; corners: number[][] };
/** one GLB through GLTFLoader and the vendored decoder: each mesh's triangle corners as [x, y, z, nx, ny, nz] in metres (the case's unitMM extra scales it), and the whole box */
async function glbParts(glb: Buffer): Promise<{ parts: GlbPart[]; centre: number[]; size: number[] }> {
  const jl = glb.readUInt32LE(12), json = JSON.parse(glb.subarray(20, 20 + jl).toString('utf8')), unit = (json.scenes?.[json.scene ?? 0]?.extras?.unitMM ?? 1000) / 1000;
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.length) as ArrayBuffer, '');
  gltf.scene.updateMatrixWorld(true);
  const parts: GlbPart[] = [], box = new Box3(), v = new Vector3();
  gltf.scene.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const pos = m.geometry.attributes.position, nrm = m.geometry.attributes.normal, idx = m.geometry.index!;
    const world = Array.from({ length: pos.count }, (_, k) => v.fromBufferAttribute(pos, k).applyMatrix4(m.matrixWorld).multiplyScalar(unit).toArray());
    for (const w of world) box.expandByPoint(v.fromArray(w));
    parts.push({ name: m.name, corners: Array.from({ length: idx.count }, (_, k) => { const i = idx.getX(k); return [...world[i], nrm.getX(i), nrm.getY(i), nrm.getZ(i)]; }) });
  });
  return { parts, centre: box.getCenter(new Vector3()).toArray(), size: box.getSize(new Vector3()).toArray() };
}

test('products.bin and its manifest are products-bin.mjs output from the four GLBs, byte for byte', async () => {
  const out = await productsBin(sources, BIN_PATH);
  assert.ok(out.bin.equals(bin), `${BIN_PATH} is stale: run node scripts/room/products-bin.mjs`);
  assert.deepEqual(MANIFEST, out.manifest, `${MANIFEST_PATH} is stale: run node scripts/room/products-bin.mjs`);
  assert.equal(createHash('sha256').update(bin).digest('hex'), MANIFEST.bin.sha256);
  assert.deepEqual(sources.map((s) => s.name), ['wallet', 'airpods', 'lenskin', 'case']);
  for (const s of sources) {
    const e = (MANIFEST.products as Record<string, { source: string; sha256: string }>)[s.name];
    assert.equal(e.source, s.path, s.name);
    assert.equal(createHash('sha256').update(s.glb).digest('hex'), e.sha256, `${s.name}: the manifest's source hash`);
  }
  assert.equal(ROOM.wallet.path, sources[0].path); assert.equal(`public${CASE.lod1}`, sources[3].path);
});

test('parseProductsBin reads every product with the GLBs\' part names, triangles, corners and normals, recentred', async () => {
  assert.deepEqual(products.map((p) => p.name), MANIFEST.bin.products);
  for (const [k, s] of sources.entries()) {
    const want = await glbParts(s.glb), got = products[k];
    assert.deepEqual(got.parts.map((p) => p.name), want.parts.map((p) => p.name), s.name);
    const e = (MANIFEST.products as Record<string, { triangles: number; vertices: number; parts: string[] }>)[s.name];
    assert.deepEqual(e.parts, want.parts.map((p) => p.name), `${s.name}: the manifest's parts`);
    assert.equal(got.parts.reduce((a, p) => a + p.geometry.index!.count / 3, 0), want.parts.reduce((a, p) => a + p.corners.length / 3, 0), `${s.name}: triangles`);
    assert.equal(e.triangles, want.parts.reduce((a, p) => a + p.corners.length / 3, 0), `${s.name}: the manifest's triangles`);
    assert.equal(e.vertices, got.parts.reduce((a, p) => a + p.geometry.attributes.position.count, 0), `${s.name}: the manifest's vertices`);
    if (s.name !== 'case') assert.equal(e.triangles, (ROOM as Record<string, { tris: number }>)[s.name].tris, `${s.name}: room-products.json's count`);
    else assert.equal(e.triangles, CASE.triangles.lod1, 'case-model.json\'s LOD1 count');
    got.parts.forEach((p, j) => {
      const pos = p.geometry.attributes.position.array as Float32Array, nrm = p.geometry.attributes.normal.array as Float32Array, idx = p.geometry.index!.array as Uint16Array, ref = want.parts[j].corners;
      assert.equal(p.geometry.index!.count, ref.length, `${s.name}/${p.name}: the corner count`);
      assert.ok(idx instanceof Uint16Array && pos instanceof Float32Array && nrm instanceof Float32Array, `${s.name}/${p.name}: the attribute types`);
      for (let c = 0; c < ref.length; c++) {
        const i = idx[c];
        for (let a = 0; a < 3; a++) {
          assert.ok(Math.abs(pos[i * 3 + a] - (ref[c][a] - want.centre[a])) < 2e-6, `${s.name}/${p.name} corner ${c} axis ${a}: ${pos[i * 3 + a]} against ${ref[c][a] - want.centre[a]}`);
          assert.ok(Math.abs(nrm[i * 3 + a] - ref[c][3 + a]) < 1e-6, `${s.name}/${p.name} corner ${c} normal ${a}: ${nrm[i * 3 + a]} against ${ref[c][3 + a]}`);
        }
      }
    });
    got.size.forEach((v, a) => assert.ok(Math.abs(v - want.size[a]) < 2e-6, `${s.name} size axis ${a}: ${v} against the GLB's ${want.size[a]}`));
  }
  assert.throws(() => parseProductsBin(new ArrayBuffer(64)), /not products\.bin/);
});

test('each product is the manifests\' life size within 1 percent (metres, Y up) and its box is centred on the origin', () => {
  for (const p of products) {
    // room-products.json's sizes are Blender's x, y, z (thickness on y, height on z), glTF's x, -z, y; case-model.json's are width, height, depth
    const r = (ROOM as Record<string, { sizeMm: number[] } | undefined>)[p.name];
    const want = (p.name === 'case' ? CASE.sizeMm : [r!.sizeMm[0], r!.sizeMm[2], r!.sizeMm[1]]).map((v) => v / 1000);
    p.size.forEach((v, a) => assert.ok(Math.abs(v - want[a]) < want[a] * 0.01, `${p.name} axis ${a}: ${v} against ${want[a]} m`));
    const box = new Box3();
    for (const q of p.parts) box.union(new Box3().setFromBufferAttribute(q.geometry.attributes.position as never));
    [box.min, box.max].forEach((v, k) => v.toArray().forEach((x, a) => assert.ok(Math.abs(x - (k ? 1 : -1) * p.size[a] / 2) < 2e-6, `${p.name} ${k ? 'max' : 'min'} axis ${a}: ${x} against ${(k ? 1 : -1) * p.size[a] / 2}`)));
    const e = (MANIFEST.products as Record<string, { sizeMm: number[]; boxMm: { min: number[]; max: number[] } }>)[p.name];
    p.size.forEach((v, a) => { assert.ok(Math.abs(v * 1000 - e.sizeMm[a]) < 0.006, `${p.name}: the manifest's sizeMm ${a}`); assert.ok(Math.abs(v * 500 - e.boxMm.max[a]) < 0.006 && Math.abs(-v * 500 - e.boxMm.min[a]) < 0.006, `${p.name}: the manifest's boxMm ${a}`); });
  }
});

test('every normal decodes to unit length within 1 percent', () => {
  let n = 0, lo = 2, hi = 0;
  for (const p of products) for (const q of p.parts) {
    const a = q.geometry.attributes.normal.array as Float32Array;
    for (let i = 0; i < a.length; i += 3) { const l = Math.hypot(a[i], a[i + 1], a[i + 2]); lo = Math.min(lo, l); hi = Math.max(hi, l); n++; }
  }
  assert.equal(n, MANIFEST.bin.vertices);
  assert.ok(lo > 0.99 && hi < 1.01, `normal lengths ${lo} to ${hi}`);
});

test('the file is its payload and head alone, at the manifest\'s size; the 160 KB line is reported', (t) => {
  assert.equal(bin.length, MANIFEST.bin.bytes);
  const [, N, P, V, I, L] = new Uint32Array(ab, 0, 6), pad = (n: number) => (n + 3) & ~3;
  assert.equal(N, 4); assert.equal(P, 11); assert.equal(V, MANIFEST.bin.vertices); assert.equal(I, MANIFEST.bin.triangles * 3);
  assert.equal(bin.length, 24 + N * 36 + P * 16 + pad(L) + pad(V * 6) + pad(V * 3) + pad(I * 2), 'no slack beyond the head, the names and the three blocks');
  assert.ok(V <= 65535, 'u16 indices');
  const gz = gzipSync(bin, { level: 9 }).length, line = LINE_KB * KB;
  // u16 positions with i8 normals are 9 B a vertex and u16 indices 6 B a triangle: 16,472 vertices and 20,203 triangles
  // are 269,466 B before the head, so the 160 KB line asked for the file cannot hold these counts; pending the lead
  t.diagnostic(`products.bin ${bin.length} B stored (${(bin.length / KB).toFixed(1)} KiB), ${gz} B gzip; the ${LINE_KB} KB line (${line} B) is ${bin.length > line ? `over by ${bin.length - line} B, pending` : 'met'}`);
  assert.ok(bin.length <= 270 * KB, `${bin.length} B: the bin has grown past what these four models measure (263.6 KiB)`);
});

test('products-bin.ts imports three alone, no glTF loader, no model file, and gzips under 2 KB', () => {
  const src = readFileSync(new URL('src/scripts/hero/section4/products-bin.ts', root), 'utf8');
  assert.doesNotMatch(src, /from '[^']*(loaders\/GLTFLoader|meshopt-decoder)|\.glb\?url'/);
  assert.deepEqual([...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]), ['three']);
  assert.match(src, /export function parseProductsBin\(buf: ArrayBuffer\)/);
  assert.match(src, /export async function fetchProductsBin\(url: string, signal\?: AbortSignal\)/);
  assert.match(src, /setTimeout\(\(\) => ac\.abort\(\), 20_000\)/, 'the 20 s timeout');
  const gz = gzipSync(src, { level: 9 }).length;
  assert.ok(gz < 2 * KB, `${gz} B gzip`);
});
