// Section 4's product models (docs/specs/section-4.md 12; scripts/room/products.py and pack.mjs), Blender references only
// (scripts/room/models/, never in public/): each file in the manifest exists with its hash, uses only the extensions the
// site can decode without WebAssembly, carries no materials, images or colours, and decodes through three's GLTFLoader
// with the vendored pure-JS meshopt decoder to the named parts at the manifest's life size (metres, standing on y = 0).
// What the page draws is src/assets/room/flux/products.bin, written from these GLBs by scripts/room/products-bin.mjs
// (section-4-flux.md 9 X-7; tests/unit/room-products-bin.test.ts holds the bin to them byte for byte).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Box3, type Mesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../src/scripts/family/three/vendor/meshopt-decoder-reference.js';
import PRODUCTS from '../../src/data/room-products.json' with { type: 'json' };

type Entry = { path: string; sha256: string; bytes: number; tris: number; sizeMm: number[]; parts: string[] };
const ENTRIES = Object.entries(PRODUCTS as Record<string, Entry>);
const file = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url));

test('the manifest names the four products, each file present with its hash and size', () => {
  assert.deepEqual(ENTRIES.map(([k]) => k).sort(), ['airpods', 'airpods-max', 'lenskin', 'wallet']);
  for (const [k, e] of ENTRIES) {
    assert.match(e.path, /^scripts\/room\/models\/[a-z-]+\.[0-9a-f]{8}\.glb$/, `${k}: a Blender reference, not a public file`);
    const buf = file(e.path);
    assert.equal(buf.length, e.bytes, k);
    assert.equal(createHash('sha256').update(buf).digest('hex'), e.sha256, k);
    assert.ok(e.path.includes(e.sha256.slice(0, 8)), `${k}: the name carries the hash`);
    // the three of 2026-10-16 were simplified to under 50 KB each; the AirPods Max ships at full detail (Sam, 2026-10-26), 434,572 B meshopt-packed
    assert.ok(e.bytes <= (k === 'airpods-max' ? 500_000 : 50_000), `${k}: ${e.bytes} B`);
  }
});

test('render-products.py and products-bin.mjs read the models from scripts/room/models/, never public/', () => {
  const render = readFileSync(new URL('../../scripts/room/render-products.py', import.meta.url), 'utf8'), bin = readFileSync(new URL('../../scripts/room/products-bin.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(render, /public\/models/);
  assert.match(bin, /scripts\/room\/models/);
  for (const [k, e] of ENTRIES) assert.ok(bin.includes(e.path) || bin.includes(e.path.split('/').pop()!.split('.')[0]), `${k}: products-bin.mjs names ${e.path}`);
});

test('only quantisation and meshopt, no materials, images, colours or UVs (the CSP and the island\'s own materials)', () => {
  for (const [k, e] of ENTRIES) {
    const buf = file(e.path), jl = buf.readUInt32LE(12), json = JSON.parse(buf.subarray(20, 20 + jl).toString('utf8'));
    assert.deepEqual([...json.extensionsRequired].sort(), ['EXT_meshopt_compression', 'KHR_mesh_quantization'], k);
    for (const key of ['materials', 'images', 'textures', 'samplers', 'animations', 'skins', 'cameras']) assert.equal(json[key], undefined, `${k}: ${key}`);
    for (const m of json.meshes) for (const p of m.primitives) assert.deepEqual(Object.keys(p.attributes).sort(), ['NORMAL', 'POSITION'], `${k}: ${m.name}`);
  }
});

test('each decodes to its named parts at life size, standing on y = 0', async () => {
  await MeshoptDecoder.ready;
  for (const [k, e] of ENTRIES) {
    const buf = file(e.path);
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length), '');
    const names: string[] = []; let tris = 0;
    gltf.scene.traverse((o) => { const m = o as Mesh; if (m.isMesh) { names.push(m.name); tris += (m.geometry.index?.count ?? 0) / 3; } });
    assert.deepEqual(names.sort(), [...e.parts].sort(), k);
    assert.equal(tris, e.tris, k);
    gltf.scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(gltf.scene), size = box.getSize(box.min.clone());
    // Blender's x, y, z (thickness on y, height on z) are glTF's x, -z, y
    const want = [e.sizeMm[0], e.sizeMm[2], e.sizeMm[1]].map((v) => v / 1000);
    [size.x, size.y, size.z].forEach((v, i) => assert.ok(Math.abs(v - want[i]) < Math.max(0.0004, want[i] * 0.01), `${k} axis ${i}: ${v} against ${want[i]}`));
    assert.ok(Math.abs(box.min.y) < 0.0005, `${k} stands on y = 0 (${box.min.y})`);
  }
});
