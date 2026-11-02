// Section 4's five products as one loader-free binary, src/assets/room/flux/products.bin, for the Flux carousel (the
// products in front of the video backgrounds): the wallet, the AirPods case, the Lenskin and the AirPods Max case from
// scripts/room/models/ and the phone case from public/models/case.lod1, read here under node through three's GLTFLoader with the vendored
// pure-JS meshopt decoder (the way tests/unit/room-products.test.ts reads them; never in site code) and written as plain
// typed-array blocks that src/scripts/hero/section4/products-bin.ts reads back with views, so the director's chunk ships
// without a glTF loader (tests/unit/hall-bin.test.ts enforces that; hall.bin and scripts/room/hall-bin.mjs are the
// precedent). Layout, little-endian, every block padded to 4 bytes:
//   u32 magic 'SHP1' (bytes S, H, P, 1), u32 products N, u32 parts P, u32 vertices V, u32 indices I, u32 names bytes L
//   N x product, 36 B: f32 offset x y z (m), f32 scale (m per grid unit), f32 size x y z (m), u32 first part, u32 parts
//   P x part, 16 B: u32 first vertex, u32 vertex count, u32 first index, u32 index count
//   names: ASCII, comma-separated, the N product names then the P part names, padded to 4
//   positions: u16 x 3V, each product's own grid (position = offset + scale x q), padded to 4
//   normals: i8 x 3V (divide by 127; every length within 1 percent of 1), padded to 4
//   indices: u16 x I, each part's own from 0 (so a product has at most 65535 vertices), padded to 4
// The grid is each source's own, so the positions are the GLBs' to float precision: the accessories' 14-bit grid
// (pack.mjs: 0 to 16383 at the node's uniform scale, in metres) and the case's normalised 16-bit grid (glTF-Transform:
// i16 shifted here by 32768), the case scaled to metres by its scene's unitMM extra (1 unit = 196.43 mm). Each product
// is recentred so its bounding box centre is the origin; Y stays up as the sources. The part order is the GLB's node
// order; the product order is PRODUCT_SOURCES. Prints each product's vertex and triangle counts, bytes and bounding box
// in millimetres, then the file's stored and gzip sizes against the brief's 160 KB figure and the 270 KB ceiling the
// unit test holds the file to (see LINE_KB and CEILING_KB), and writes the manifest
// src/data/room-products-bin.json (what the unit test pins, with the bin, to this script's output):
//   node scripts/room/products-bin.mjs [src/assets/room/flux/products.bin] [src/data/room-products-bin.json]
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../src/scripts/family/three/vendor/meshopt-decoder-reference.js';

const root = new URL('../../', import.meta.url);
const ROOM = JSON.parse(readFileSync(new URL('src/data/room-products.json', root), 'utf8'));
const CASE = JSON.parse(readFileSync(new URL('src/data/case-model.json', root), 'utf8'));
/** the four products in file order, each by its manifest's path (repo-relative) */
export const PRODUCT_SOURCES = Object.freeze([
  ...['wallet', 'airpods', 'lenskin'].map((name) => ({ name, path: ROOM[name].path })),
  { name: 'case', path: `public${CASE.lod1}` },
  // Sam's AirPods Max model (2026-10-26), scene 5's product, at full detail (scripts/room/products-full.py), after the case so the first four keep their order
  { name: 'airpods-max', path: ROOM['airpods-max'].path },
]);
export const BIN_PATH = 'src/assets/room/flux/products.bin', MANIFEST_PATH = 'src/data/room-products-bin.json';
export const LINE_KB = 160;      // the brief's stored figure, KB = 1024 B: 106,060 B short of these four models under this encoding
export const CEILING_KB = 1000;  // the line the unit test holds the file to: the four models of 2026-10-16 (263.6 KiB) plus the AirPods Max at full detail (Sam, 2026-10-26: "just place the actual 3d model"), measured below 800 KiB, with room for the AirPods case and the Lenskin re-exported at full detail when their FBX files are to hand
const MAGIC = 0x31504853;     // 'SHP1' read as bytes S, H, P, 1
const pad4 = (n) => (n + 3) & ~3;
const mm = (v) => Math.round(v * 1e5) / 100 || 0;   // metres to millimetres, two decimals (a -0 would differ from the JSON's 0)

/** an attribute's raw stored values (meshopt's padded attributes arrive interleaved) and its typed array */
function rawOf(a) {
  const i = a.isInterleavedBufferAttribute, arr = i ? a.data.array : a.array, stride = i ? a.data.stride : a.itemSize, off = i ? a.offset : 0;
  return { arr, at: (k, c) => arr[k * stride + off + c] };
}

/** one GLB as its parts: the grid (metres per unit, origin, step), each part's raw quantised arrays and world positions */
async function decode(name, glb) {
  const jl = glb.readUInt32LE(12), json = JSON.parse(glb.subarray(20, 20 + jl).toString('utf8'));
  const unitMM = json.scenes?.[json.scene ?? 0]?.extras?.unitMM, unit = (unitMM ?? 1000) / 1000;   // metres per file unit
  const ab = glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.length);
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(ab, '');
  gltf.scene.updateMatrixWorld(true);
  const meshes = [];
  gltf.scene.traverse((o) => { if (o.isMesh) meshes.push(o); else if (o.isLine || o.isPoints) throw new Error(`products-bin: ${name}/${o.name} is not triangles`); });
  if (!meshes.length) throw new Error(`products-bin: ${name} has no mesh`);
  let grid = null;
  const parts = meshes.map((o) => {
    const e = o.matrixWorld.elements, t = [e[12], e[13], e[14]], s = e[0];
    if (e[5] !== s || e[10] !== s || [e[1], e[2], e[4], e[6], e[8], e[9]].some((x) => x !== 0)) throw new Error(`products-bin: ${name}/${o.name} carries a rotation or a non-uniform scale; the grid is a translation and one scale`);
    const g = o.geometry, pos = g.attributes.position, nrm = g.attributes.normal, idx = g.index;
    const P = pos && rawOf(pos), Nn = nrm && rawOf(nrm);
    if (!pos || pos.itemSize !== 3 || !(P.arr instanceof Uint16Array && !pos.normalized || P.arr instanceof Int16Array && pos.normalized)) throw new Error(`products-bin: ${name}/${o.name}: positions are not u16 on a grid or normalised i16 (KHR_mesh_quantization)`);
    if (!nrm || nrm.itemSize !== 3 || !(Nn.arr instanceof Int8Array) || !nrm.normalized || nrm.count !== pos.count) throw new Error(`products-bin: ${name}/${o.name}: normals are not normalised i8`);
    if (!idx || idx.count % 3) throw new Error(`products-bin: ${name}/${o.name} has no triangle index`);
    const signed = pos.normalized;
    if (!grid) grid = { t, s, signed }; else if (grid.s !== s || grid.signed !== signed || grid.t.some((x, i) => x !== t[i])) throw new Error(`products-bin: ${name}/${o.name} sits on another grid than the first part; one grid per product`);
    const q = new Uint16Array(pos.count * 3), n = new Int8Array(pos.count * 3), world = [], v = new Vector3();
    for (let k = 0; k < pos.count; k++) for (let c = 0; c < 3; c++) {
      const x = P.at(k, c) + (signed ? 32768 : 0);
      if (x < 0 || x > 65535) throw new Error(`products-bin: ${name}/${o.name}: grid value ${P.at(k, c)} off the u16 grid`);
      q[k * 3 + c] = x; n[k * 3 + c] = Nn.at(k, c);
    }
    for (let k = 0; k < pos.count; k++) world.push(v.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld).multiplyScalar(unit).toArray());
    for (let k = 0; k < n.length; k += 3) { const l = Math.hypot(n[k], n[k + 1], n[k + 2]) / 127; if (Math.abs(l - 1) > 0.01) throw new Error(`products-bin: ${name}/${o.name}: normal ${k / 3} decodes to length ${l}`); }
    const index = new Uint16Array(idx.count);
    for (let k = 0; k < idx.count; k++) { const x = idx.getX(k); if (x >= pos.count) throw new Error(`products-bin: ${name}/${o.name}: index ${x} past ${pos.count} vertices`); index[k] = x; }
    return { name: o.name, q, n, index, world };
  });
  // the grid in metres: position = unit x (t + s x deq(raw)); deq is raw (u16) or raw / 32767 (normalised i16, shifted by 32768 in q)
  const step = unit * grid.s / (grid.signed ? 32767 : 1), origin = grid.t.map((x) => unit * x - (grid.signed ? 32768 * step : 0));
  return { name, unitMM: unitMM ?? null, step, origin, parts };
}

/** the four GLBs to products.bin: the file as a Buffer and the manifest the test pins beside it */
export async function productsBin(sources, binPath = BIN_PATH) {
  await MeshoptDecoder.ready;
  const products = [];
  for (const { name, path, glb } of sources) {
    const d = await decode(name, glb);
    const box = new Box3();
    for (const p of d.parts) for (const w of p.world) box.expandByPoint(new Vector3(...w));
    const centre = box.getCenter(new Vector3()), size = box.getSize(new Vector3());
    const offset = d.origin.map((x, i) => x - centre.getComponent(i));
    // the f32 the parser will use, checked against three's own dequantisation (recentred) to a micron
    const fo = offset.map(Math.fround), fs = Math.fround(d.step);
    for (const p of d.parts) for (let k = 0; k < p.world.length; k++) for (let c = 0; c < 3; c++) {
      const got = fo[c] + fs * p.q[k * 3 + c], want = p.world[k][c] - centre.getComponent(c);
      if (Math.abs(got - want) > 1e-6) throw new Error(`products-bin: ${name}/${p.name} vertex ${k}: ${got} against ${want} m`);
    }
    const vertices = d.parts.reduce((a, p) => a + p.q.length / 3, 0), indices = d.parts.reduce((a, p) => a + p.index.length, 0);
    if (vertices > 65535) throw new Error(`products-bin: ${name} has ${vertices} vertices; u16 indices allow 65535`);
    products.push({
      name, source: path, sha256: createHash('sha256').update(glb).digest('hex'), unitMM: d.unitMM, offset: fo, scale: fs, size: size.toArray().map(Math.fround), centre: centre.toArray(), parts: d.parts, vertices, triangles: indices / 3, indices,
    });
  }
  const N = products.length, P = products.reduce((a, p) => a + p.parts.length, 0);
  const V = products.reduce((a, p) => a + p.vertices, 0), I = products.reduce((a, p) => a + p.indices, 0);
  const names = [...products.map((p) => p.name), ...products.flatMap((p) => p.parts.map((q) => q.name))];
  for (const n of names) if (!/^[\x21-\x7e]+$/.test(n) || n.includes(',')) throw new Error(`products-bin: name "${n}" is not plain ASCII without commas`);
  const nameBytes = Buffer.from(names.join(','), 'ascii');
  const at = { names: 24 + N * 36 + P * 16 };
  at.pos = at.names + pad4(nameBytes.length); at.nrm = at.pos + pad4(V * 6); at.idx = at.nrm + pad4(V * 3);
  const out = Buffer.alloc(at.idx + pad4(I * 2));
  [MAGIC, N, P, V, I, nameBytes.length].forEach((x, k) => out.writeUInt32LE(x, k * 4));
  let part = 0, v0 = 0, i0 = 0;
  products.forEach((p, k) => {
    const rec = 24 + k * 36;
    [...p.offset, p.scale, ...p.size].forEach((x, j) => out.writeFloatLE(x, rec + j * 4));
    out.writeUInt32LE(part, rec + 28); out.writeUInt32LE(p.parts.length, rec + 32);
    for (const q of p.parts) {
      const vc = q.q.length / 3, ic = q.index.length, prec = 24 + N * 36 + part * 16;
      [v0, vc, i0, ic].forEach((x, j) => out.writeUInt32LE(x, prec + j * 4));
      q.q.forEach((x, j) => out.writeUInt16LE(x, at.pos + (v0 * 3 + j) * 2));
      q.n.forEach((x, j) => out.writeInt8(x, at.nrm + v0 * 3 + j));
      q.index.forEach((x, j) => out.writeUInt16LE(x, at.idx + (i0 + j) * 2));
      v0 += vc; i0 += ic; part++;
    }
  });
  nameBytes.copy(out, at.names);
  const manifest = {
    bin: { path: binPath, format: 'SHP1', bytes: out.length, sha256: createHash('sha256').update(out).digest('hex'), products: products.map((p) => p.name), vertices: V, triangles: I / 3, writtenBy: 'scripts/room/products-bin.mjs' },
    products: Object.fromEntries(products.map((p) => [p.name, {
      source: p.source, sha256: p.sha256, parts: p.parts.map((q) => q.name), vertices: p.vertices, triangles: p.triangles,
      bytes: p.vertices * 9 + p.indices * 2,
      sizeMm: p.size.map(mm), boxMm: { min: p.size.map((x) => mm(-x / 2)), max: p.size.map((x) => mm(x / 2)) }, centreMovedMm: p.centre.map(mm),
      gridStepMm: Math.round(p.scale * 1e7) / 1e4, unitMM: p.unitMM,
    }])),
  };
  return { bin: out, manifest };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const binPath = process.argv[2] ?? BIN_PATH, manPath = process.argv[3] ?? MANIFEST_PATH;
  const sources = PRODUCT_SOURCES.map((s) => ({ ...s, glb: readFileSync(s.path) }));
  const { bin, manifest } = await productsBin(sources, binPath);
  mkdirSync(dirname(binPath), { recursive: true });
  writeFileSync(binPath, bin);
  writeFileSync(manPath, JSON.stringify(manifest, null, 1) + '\n');
  for (const [name, p] of Object.entries(manifest.products)) {
    const b = p.boxMm;
    console.log(`${name}: ${p.parts.join(', ')}; ${p.vertices} vertices, ${p.triangles} triangles, ${p.bytes} B; box ${b.min[0]}..${b.max[0]} x ${b.min[1]}..${b.max[1]} x ${b.min[2]}..${b.max[2]} mm (${p.sizeMm.join(' x ')}), centre moved from ${p.centreMovedMm.join(', ')} mm; grid ${p.gridStepMm} mm${p.unitMM ? ` (1 unit = ${p.unitMM} mm)` : ''}`);
  }
  const gz = gzipSync(bin, { level: 9 }).length, line = LINE_KB * 1024, ceiling = CEILING_KB * 1024;
  console.log(`${binPath}: ${bin.length} B stored (${(bin.length / 1024).toFixed(1)} KiB), gzip ${gz} B; ${manifest.bin.vertices} vertices, ${manifest.bin.triangles} triangles; sha256 ${manifest.bin.sha256.slice(0, 8)}`);
  console.log(bin.length <= line ? `within the ${LINE_KB} KB line (${line} B) by ${line - bin.length} B` : `OVER the ${LINE_KB} KB line (${line} B) by ${bin.length - line} B: u16 positions and i8 normals are 9 B a vertex and u16 indices 6 B a triangle, so these counts cannot fit it`);
  console.log(bin.length <= ceiling ? `within the ${CEILING_KB} KB ceiling (${ceiling} B) by ${ceiling - bin.length} B` : `OVER the ${CEILING_KB} KB ceiling (${ceiling} B) by ${bin.length - ceiling} B: the unit test will fail`);
  console.log(`${manPath} written`);
}
