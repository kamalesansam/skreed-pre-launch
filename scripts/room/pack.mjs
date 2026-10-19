// Section 4's product models into the site (docs/specs/section-4.md 12): each GLB that scripts/room/products.py wrote
// (float positions and normals, one mesh per named part) is quantised and meshopt-encoded, the way the site's other
// models load: KHR_mesh_quantization (positions as 16-bit integers dequantised by each node's translation and uniform
// scale, normals as 8-bit normalised) and EXT_meshopt_compression (decoded by the vendored pure-JS reference decoder,
// so the CSP's no-WebAssembly rule holds). No materials, textures, colours or UVs survive: the island draws its own.
// Writes public/models/<which>.<sha8>.glb (content-hashed; older copies removed) and src/data/room-products.json.
//   node scripts/room/pack.mjs <dir with <which>-raw.glb and <which>-report.json> wallet airpods lenskin
// The park mode (docs/specs/section-4-world.md 3 "Option B's park", 6) packs what scripts/room/park.py wrote into
// src/assets/room/park/: park.glb, park-lightmap.avif and .webp (1024), and park.json (the poses, the flights, the light):
//   node scripts/room/pack.mjs park [dir=scripts/room/out/park]
// See packPark below for what the park's GLB carries; the products' path above it is unchanged.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MeshoptEncoder } from 'meshoptimizer';

const [dir, ...which] = process.argv.slice(2);
const PARK = dir === 'park';
await MeshoptEncoder.ready;
const MANIFEST = 'src/data/room-products.json';
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const COMP = { 5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] };
const N = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function readGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67 || buf.readUInt32LE(4) !== 2) throw new Error('not a glTF 2 binary');
  const jl = buf.readUInt32LE(12), json = JSON.parse(buf.subarray(20, 20 + jl).toString('utf8'));
  const at = 20 + jl, bl = buf.readUInt32LE(at), bin = buf.subarray(at + 8, at + 8 + bl);
  return { json, bin };
}
function read(json, bin, i) {
  const a = json.accessors[i], v = json.bufferViews[a.bufferView], [T, size] = COMP[a.componentType], n = N[a.type];
  const stride = v.byteStride || size * n, out = new T(a.count * n), base = (v.byteOffset || 0) + (a.byteOffset || 0);
  const dv = new DataView(bin.buffer, bin.byteOffset);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) {
    const o = base + k * stride + c * size;
    out[k * n + c] = a.componentType === 5126 ? dv.getFloat32(o, true) : a.componentType === 5125 ? dv.getUint32(o, true) : a.componentType === 5123 ? dv.getUint16(o, true) : dv.getUint8(o);
  }
  return out;
}
const pad4 = (n) => (n + 3) & ~3;

if (PARK) await packPark(which[0] ?? 'scripts/room/out/park');
for (const w of PARK ? [] : which) {
  const { json, bin } = readGlb(readFileSync(join(dir, `${w}-raw.glb`)));
  const report = JSON.parse(readFileSync(join(dir, `${w}-report.json`), 'utf8'));
  // one quantisation grid for the whole model, so the parts meet exactly: the model's box, a uniform step
  const prims = [];
  for (const node of json.nodes) {
    if (node.mesh === undefined) continue;
    if (node.rotation || node.scale || node.translation) throw new Error(`${w}: node ${node.name} carries a transform; products.py applies them`);
    for (const p of json.meshes[node.mesh].primitives) prims.push({ name: node.name, pos: read(json, bin, p.attributes.POSITION), nor: read(json, bin, p.attributes.NORMAL), idx: read(json, bin, p.indices) });
  }
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of prims) for (let i = 0; i < p.pos.length; i++) { lo[i % 3] = Math.min(lo[i % 3], p.pos[i]); hi[i % 3] = Math.max(hi[i % 3], p.pos[i]); }
  // a 14-bit grid (stored in 16 bits): 6 microns on the 94 mm wallet, and the codec's deltas stay small
  const range = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]), step = range / 16383;
  const chunks = [], views = [], accessors = [], meshes = [], nodes = [];
  let fallback = 0, packed = 0, tris = 0;
  const view = (bytes, stride, count, mode) => {
    const enc = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, mode);
    const v = { buffer: 1, byteOffset: fallback, byteLength: bytes.byteLength, extensions: { EXT_meshopt_compression: { buffer: 0, byteOffset: packed, byteLength: enc.byteLength, byteStride: stride, mode, count } } };
    if (mode === 'ATTRIBUTES') { v.byteStride = stride; v.target = 34962; } else v.target = 34963;
    chunks.push({ at: packed, data: enc }); packed = pad4(packed + enc.byteLength); fallback = pad4(fallback + bytes.byteLength);
    views.push(v); return views.length - 1;
  };
  for (const p of prims) {
    const count = p.pos.length / 3;
    // vertex order for the codec: meshopt's reorder (the index buffer is rewritten in place), then the attributes follow
    const idx32 = Uint32Array.from(p.idx);
    const [remap, unique] = MeshoptEncoder.reorderMesh(idx32, true, true);
    const pos = new Uint16Array(unique * 4), nor = new Int8Array(unique * 4);
    const qlo = [16383, 16383, 16383], qhi = [0, 0, 0];
    for (let i = 0; i < count; i++) {
      const j = remap[i]; if (j === 0xffffffff) continue;
      for (let c = 0; c < 3; c++) {
        const q = Math.max(0, Math.min(16383, Math.round((p.pos[i * 3 + c] - lo[c]) / step)));
        pos[j * 4 + c] = q; qlo[c] = Math.min(qlo[c], q); qhi[c] = Math.max(qhi[c], q);
        nor[j * 4 + c] = Math.max(-127, Math.min(127, Math.round(p.nor[i * 3 + c] * 127)));
      }
    }
    const idx = unique < 65536 ? Uint16Array.from(idx32) : idx32;
    const vp = view(new Uint8Array(pos.buffer), 8, unique, 'ATTRIBUTES'), vn = view(new Uint8Array(nor.buffer), 4, unique, 'ATTRIBUTES');
    const vi = view(new Uint8Array(idx.buffer), idx.BYTES_PER_ELEMENT, idx.length, 'TRIANGLES');
    accessors.push({ bufferView: vp, componentType: 5123, count: unique, type: 'VEC3', min: qlo, max: qhi });
    accessors.push({ bufferView: vn, componentType: 5120, normalized: true, count: unique, type: 'VEC3' });
    accessors.push({ bufferView: vi, componentType: idx.BYTES_PER_ELEMENT === 2 ? 5123 : 5125, count: idx.length, type: 'SCALAR' });
    const a = accessors.length;
    meshes.push({ name: p.name, primitives: [{ attributes: { POSITION: a - 3, NORMAL: a - 2 }, indices: a - 1, mode: 4 }] });
    nodes.push({ name: p.name, mesh: meshes.length - 1, translation: lo, scale: [step, step, step] });
    tris += idx.length / 3;
  }
  const out = {
    asset: { version: '2.0', generator: 'skreed scripts/room/pack.mjs' },
    extensionsUsed: ['KHR_mesh_quantization', 'EXT_meshopt_compression'], extensionsRequired: ['KHR_mesh_quantization', 'EXT_meshopt_compression'],
    scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes, accessors, bufferViews: views,
    buffers: [{ byteLength: packed }, { byteLength: fallback, extensions: { EXT_meshopt_compression: { fallback: true } } }],
  };
  const binOut = Buffer.alloc(packed);
  for (const c of chunks) Buffer.from(c.data.buffer, c.data.byteOffset, c.data.byteLength).copy(binOut, c.at);
  let js = Buffer.from(JSON.stringify(out), 'utf8'); js = Buffer.concat([js, Buffer.alloc(pad4(js.length) - js.length, 0x20)]);
  const total = 12 + 8 + js.length + 8 + binOut.length, glb = Buffer.alloc(total);
  glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(total, 8);
  glb.writeUInt32LE(js.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); js.copy(glb, 20);
  glb.writeUInt32LE(binOut.length, 20 + js.length); glb.writeUInt32LE(0x004e4942, 24 + js.length); binOut.copy(glb, 28 + js.length);
  const sha = createHash('sha256').update(glb).digest('hex'), name = `${w}.${sha.slice(0, 8)}.glb`;
  for (const f of readdirSync('public/models')) if (f.startsWith(`${w}.`) && f.endsWith('.glb') && f !== name) rmSync(join('public/models', f));
  writeFileSync(join('public/models', name), glb);
  manifest[w] = { url: `/models/${name}`, sha256: sha, bytes: glb.length, tris, sizeMm: report.size_mm, parts: prims.map((p) => p.name), source: report.source ?? `Sam's ${w} FBX (2026-10-16), cleaned by scripts/room/products.py` };
  console.log(`${w}: ${name} ${glb.length} B (raw float ${readFileSync(join(dir, `${w}-raw.glb`)).length} B), ${tris} triangles, parts ${prims.map((p) => p.name).join(', ')}, ${report.size_mm.join(' x ')} mm`);
}
if (!PARK) writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');

/**
 * Option B's park. The raw GLB from park.py has one node per mesh, untransformed (a node transform is applied to its
 * positions if one turns up), float positions, the lightmap UV as TEXCOORD_0 and COLOR_0 where a mesh has colours; its
 * report names each mesh's material, light and albedo and lists every prototype's instances. Written here:
 *   - one primitive per material (meshes sharing one are merged), no normals (nothing in the park is shaded at runtime);
 *   - KHR_mesh_quantization: positions as 16-bit integers on one grid for all the lightmapped meshes (so they meet
 *     exactly; 2.9 mm on the park's 190 m), and on their own grid for each unlit mesh and each prototype, dequantised by
 *     the node's translation and uniform scale; the lightmap UV as normalised 16-bit, stored as TEXCOORD_1 (three's
 *     uv1, the lightmap channel) with TEXCOORD_0 naming the same accessor (glTF wants the set indices to start at 0; one
 *     accessor, no extra bytes); COLOR_0 as normalised 8-bit RGB in a 4-byte stride (linear, as glTF says);
 *   - EXT_mesh_gpu_instancing for the trees, benches and lamps: TRANSLATION, ROTATION, SCALE and _COLOR_0 (three's
 *     instanceColor, each instance's shade) as tightly packed floats (three builds instanceColor from the accessor's
 *     array as if packed, so a padded 8-bit colour would be read askew); the translations are written in the
 *     prototype's quantised frame (the node's dequantisation applies after the instance's transform, so t' = (t + R(K lo)
 *     - lo) / step puts each copy where park.py stood it);
 *   - EXT_meshopt_compression on every buffer view (the vendored pure-JS decoder reads it: no WebAssembly);
 *   - materials with KHR_materials_unlit, the albedo as baseColorFactor (linear) and extras.light naming the light:
 *     'lightmap' (albedo x baseColor x COLOR_0 x the map / unit), 'baked' (COLOR_0 is the lit colour, x the instance's
 *     shade) or 'unlit' (COLOR_0 is the final colour). With three's stock materials as GLTFLoader makes them
 *     (MeshBasicMaterial), only the lightmapped ones need the map: lightMap.channel = 1 and lightMapIntensity = PI / unit.
 */
async function packPark(src) {
  const sharp = (await import('sharp')).default;
  const OUTDIR = 'src/assets/room/park';
  const { json, bin } = readGlb(readFileSync(join(src, 'park-raw.glb')));
  const report = JSON.parse(readFileSync(join(src, 'park-report.json'), 'utf8'));
  const readF = (i) => {   // an accessor as floats, normalised integers brought to 0..1
    const a = json.accessors[i], raw = read(json, bin, i), out = new Float32Array(raw.length);
    const k = !a.normalized ? 1 : a.componentType === 5121 ? 1 / 255 : a.componentType === 5123 ? 1 / 65535 : 1;
    for (let j = 0; j < raw.length; j++) out[j] = raw[j] * k;
    return { data: out, n: N[a.type] };
  };
  const trs = (node) => {   // the node's transform as a 3 x 4 matrix (column-major 4 x 4 in glTF)
    if (node.matrix) return node.matrix;
    const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1], [sx, sy, sz] = node.scale ?? [1, 1, 1], t = node.translation ?? [0, 0, 0];
    return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0, 2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
      2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, t[0], t[1], t[2], 1];
  };
  // gather the primitives by material, the node transform applied
  const groups = new Map();
  for (const node of json.nodes ?? []) {
    if (node.mesh === undefined) continue;
    const obj = report.objects[node.name];
    if (!obj) throw new Error(`park: node ${node.name} is not in the report`);
    const M = node.matrix || node.rotation || node.scale || node.translation ? trs(node) : null;
    for (const p of json.meshes[node.mesh].primitives) {
      const pos = readF(p.attributes.POSITION).data;
      if (M) for (let i = 0; i < pos.length; i += 3) {
        const [x, y, z] = [pos[i], pos[i + 1], pos[i + 2]];
        for (let c = 0; c < 3; c++) pos[i + c] = M[c] * x + M[4 + c] * y + M[8 + c] * z + M[12 + c];
      }
      const uv = p.attributes.TEXCOORD_0 !== undefined ? readF(p.attributes.TEXCOORD_0).data : null;
      const colA = p.attributes.COLOR_0 !== undefined ? readF(p.attributes.COLOR_0) : null;
      const idx = p.indices !== undefined ? read(json, bin, p.indices) : Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);
      if (obj.light === 'lightmap' && !uv) throw new Error(`park: ${node.name} is lightmapped but has no lightmap UV`);
      const key = obj.material;
      if (!groups.has(key)) groups.set(key, { name: key, light: obj.light, albedo: obj.albedo, doubleSided: !!obj.doubleSided, parts: [] });
      groups.get(key).parts.push({ pos, uv, col: colA, idx });
    }
  }
  const merged = [...groups.values()].map((g) => {
    const nv = g.parts.reduce((s, p) => s + p.pos.length / 3, 0), ni = g.parts.reduce((s, p) => s + p.idx.length, 0);
    const pos = new Float32Array(nv * 3), uv = g.parts[0].uv ? new Float32Array(nv * 2) : null, col = g.parts[0].col ? new Float32Array(nv * 3) : null, idx = new Uint32Array(ni);
    let v0 = 0, i0 = 0;
    for (const p of g.parts) {
      const n = p.pos.length / 3;
      pos.set(p.pos, v0 * 3);
      if (uv) uv.set(p.uv, v0 * 2);
      if (col) for (let k = 0; k < n; k++) for (let c = 0; c < 3; c++) col[(v0 + k) * 3 + c] = p.col.data[k * p.col.n + c];
      for (let k = 0; k < p.idx.length; k++) idx[i0 + k] = p.idx[k] + v0;
      v0 += n; i0 += p.idx.length;
    }
    return { ...g, pos, uv, col, idx };
  });
  const order = { lightmap: 0, unlit: 1, baked: 2 };
  merged.sort((a, b) => order[a.light] - order[b.light] || a.name.localeCompare(b.name));
  const box = (arrs) => {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const a of arrs) for (let i = 0; i < a.length; i++) { lo[i % 3] = Math.min(lo[i % 3], a[i]); hi[i % 3] = Math.max(hi[i % 3], a[i]); }
    return { lo, hi, range: Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) };
  };
  const shared = box(merged.filter((m) => m.light === 'lightmap').map((m) => m.pos));
  const chunks = [], views = [], accessors = [], meshes = [], nodes = [], materials = [];
  let fallback = 0, packed = 0;
  const view = (bytes, stride, count, mode) => {
    const enc = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, mode);
    const v = { buffer: 1, byteOffset: fallback, byteLength: bytes.byteLength, extensions: { EXT_meshopt_compression: { buffer: 0, byteOffset: packed, byteLength: enc.byteLength, byteStride: stride, mode, count } } };
    if (mode === 'ATTRIBUTES') { v.byteStride = stride; if (count > 0) v.target = 34962; } else v.target = 34963;
    chunks.push({ at: packed, data: enc }); packed = pad4(packed + enc.byteLength); fallback = pad4(fallback + bytes.byteLength);
    views.push(v); return views.length - 1;
  };
  const accessor = (a) => { accessors.push(a); return accessors.length - 1; };
  const stats = [];
  let trisStatic = 0, trisDrawn = 0;
  for (const m of merged) {
    // the grid: the lightmapped meshes share one at 16 bits; each unlit mesh and each prototype has its own at 14
    const g = m.light === 'lightmap' ? { ...shared, bits: 65535 } : { ...box([m.pos]), bits: 16383 };
    const step = g.range / g.bits, count = m.pos.length / 3;
    const idx32 = Uint32Array.from(m.idx);
    const [remap, unique] = MeshoptEncoder.reorderMesh(idx32, true, true);
    const pos = new Uint16Array(unique * 4), uv = m.uv ? new Uint16Array(unique * 2) : null, col = m.col ? new Uint8Array(unique * 4) : null;
    const qlo = [g.bits, g.bits, g.bits], qhi = [0, 0, 0];
    for (let i = 0; i < count; i++) {
      const j = remap[i]; if (j === 0xffffffff) continue;
      for (let c = 0; c < 3; c++) {
        const q = Math.max(0, Math.min(g.bits, Math.round((m.pos[i * 3 + c] - g.lo[c]) / step)));
        pos[j * 4 + c] = q; qlo[c] = Math.min(qlo[c], q); qhi[c] = Math.max(qhi[c], q);
      }
      if (uv) for (let c = 0; c < 2; c++) uv[j * 2 + c] = Math.max(0, Math.min(65535, Math.round(m.uv[i * 2 + c] * 65535)));
      if (col) for (let c = 0; c < 3; c++) col[j * 4 + c] = Math.max(0, Math.min(255, Math.round(m.col[i * 3 + c] * 255)));
    }
    const idx = unique < 65536 ? Uint16Array.from(idx32) : idx32;
    const attributes = { POSITION: accessor({ bufferView: view(new Uint8Array(pos.buffer), 8, unique, 'ATTRIBUTES'), componentType: 5123, count: unique, type: 'VEC3', min: qlo, max: qhi }) };
    if (uv) attributes.TEXCOORD_0 = attributes.TEXCOORD_1 = accessor({ bufferView: view(new Uint8Array(uv.buffer), 4, unique, 'ATTRIBUTES'), componentType: 5123, normalized: true, count: unique, type: 'VEC2' });
    if (col) attributes.COLOR_0 = accessor({ bufferView: view(col, 4, unique, 'ATTRIBUTES'), componentType: 5121, normalized: true, count: unique, type: 'VEC3' });
    const indices = accessor({ bufferView: view(new Uint8Array(idx.buffer), idx.BYTES_PER_ELEMENT, idx.length, 'TRIANGLES'), componentType: idx.BYTES_PER_ELEMENT === 2 ? 5123 : 5125, count: idx.length, type: 'SCALAR' });
    materials.push({ name: m.name, pbrMetallicRoughness: { baseColorFactor: [...m.albedo, 1], metallicFactor: 0, roughnessFactor: 1 }, extensions: { KHR_materials_unlit: {} }, extras: { light: m.light }, ...(m.doubleSided ? { doubleSided: true } : {}) });
    meshes.push({ name: m.name, primitives: [{ attributes, indices, material: materials.length - 1, mode: 4 }] });
    const node = { name: m.name, mesh: meshes.length - 1, translation: g.lo, scale: [step, step, step] };
    const tris = idx.length / 3;
    let copies = 1;
    if (m.light === 'baked' && report.objects[m.name]?.instanced) {
      const list = report.instances[m.name] ?? [];
      if (!list.length) { console.warn(`park: prototype ${m.name} has no instances; left out`); meshes.pop(); materials.pop(); continue; }
      copies = list.length;
      const T = new Float32Array(copies * 3), Q = new Float32Array(copies * 4), S = new Float32Array(copies * 3), C = new Float32Array(copies * 3);
      list.forEach((it, k) => {
        const [qx, qy, qz, qw] = it.r, K = it.s, v = [K[0] * g.lo[0], K[1] * g.lo[1], K[2] * g.lo[2]];
        // R(v) for the unit quaternion (x, y, z, w): v + 2w (q x v) + 2 q x (q x v)
        const cx = qy * v[2] - qz * v[1], cy = qz * v[0] - qx * v[2], cz = qx * v[1] - qy * v[0];
        const rv = [v[0] + 2 * (qw * cx + qy * cz - qz * cy), v[1] + 2 * (qw * cy + qz * cx - qx * cz), v[2] + 2 * (qw * cz + qx * cy - qy * cx)];
        for (let c = 0; c < 3; c++) { T[k * 3 + c] = (it.t[c] + rv[c] - g.lo[c]) / step; S[k * 3 + c] = K[c]; C[k * 3 + c] = Math.max(0, Math.min(1, it.c[c])); }
        Q.set(it.r, k * 4);
      });
      node.extensions = { EXT_mesh_gpu_instancing: { attributes: {
        TRANSLATION: accessor({ bufferView: view(new Uint8Array(T.buffer), 12, copies, 'ATTRIBUTES'), componentType: 5126, count: copies, type: 'VEC3' }),
        ROTATION: accessor({ bufferView: view(new Uint8Array(Q.buffer), 16, copies, 'ATTRIBUTES'), componentType: 5126, count: copies, type: 'VEC4' }),
        SCALE: accessor({ bufferView: view(new Uint8Array(S.buffer), 12, copies, 'ATTRIBUTES'), componentType: 5126, count: copies, type: 'VEC3' }),
        _COLOR_0: accessor({ bufferView: view(new Uint8Array(C.buffer), 12, copies, 'ATTRIBUTES'), componentType: 5126, count: copies, type: 'VEC3' }),
      } } };
    } else trisStatic += tris;
    nodes.push(node);
    trisDrawn += tris * copies;
    stats.push({ name: m.name, light: m.light, tris, instances: node.extensions ? copies : undefined, vertices: unique });
  }
  const out = {
    asset: { version: '2.0', generator: 'skreed scripts/room/pack.mjs park' },
    extensionsUsed: ['KHR_mesh_quantization', 'EXT_meshopt_compression', 'EXT_mesh_gpu_instancing', 'KHR_materials_unlit'],
    extensionsRequired: ['KHR_mesh_quantization', 'EXT_meshopt_compression', 'EXT_mesh_gpu_instancing'],
    scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes, materials, accessors, bufferViews: views,
    buffers: [{ byteLength: packed }, { byteLength: fallback, extensions: { EXT_meshopt_compression: { fallback: true } } }],
  };
  const binOut = Buffer.alloc(packed);
  for (const c of chunks) Buffer.from(c.data.buffer, c.data.byteOffset, c.data.byteLength).copy(binOut, c.at);
  let js = Buffer.from(JSON.stringify(out), 'utf8'); js = Buffer.concat([js, Buffer.alloc(pad4(js.length) - js.length, 0x20)]);
  const total = 12 + 8 + js.length + 8 + binOut.length, glb = Buffer.alloc(total);
  glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(total, 8);
  glb.writeUInt32LE(js.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); js.copy(glb, 20);
  glb.writeUInt32LE(binOut.length, 20 + js.length); glb.writeUInt32LE(0x004e4942, 24 + js.length); binOut.copy(glb, 28 + js.length);
  mkdirSync(OUTDIR, { recursive: true });
  writeFileSync(join(OUTDIR, 'park.glb'), glb);

  // the lightmap: the bake's map (sRGB-encoded irradiance) to 1024, AVIF with a WebP fallback, each at the highest quality under its line
  const LINES = { glb: 300 * 1024, avif: 120 * 1024, webp: 190 * 1024, draws: 40 };
  const base = sharp(join(src, 'park-lightmap.png')).removeAlpha().resize(1024, 1024, { kernel: 'lanczos3' });
  const png = await base.png().toBuffer();
  const under = async (fmt, qs, opts) => {
    for (const q of qs) { const b = await sharp(png)[fmt]({ quality: q, ...opts }).toBuffer(); if (b.length <= LINES[fmt] * 0.92 || q === qs[qs.length - 1]) return { b, q }; }
  };
  // 4:4:4: the map's colour (blue shade beside warm sun) changes at every island's edge, and halved chroma smears it there
  const avif = await under('avif', [66, 62, 58, 54, 50, 46, 42], { effort: 7, chromaSubsampling: '4:4:4' });
  const webp = await under('webp', [90, 86, 82, 78, 74, 70, 64], { effort: 6 });
  writeFileSync(join(OUTDIR, 'park-lightmap.avif'), avif.b); writeFileSync(join(OUTDIR, 'park-lightmap.webp'), webp.b);

  // the check: three's GLTFLoader with the vendored decoder reads it back to the same draws and triangles
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { MeshoptDecoder } = await import('../../src/scripts/family/three/vendor/meshopt-decoder-reference.js');
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.length), '');
  let draws = 0, drawn = 0;
  gltf.scene.traverse((o) => { if (o.isMesh) { draws++; drawn += ((o.geometry.index?.count ?? 0) / 3) * (o.isInstancedMesh ? o.count : 1); } });
  if (draws !== nodes.length || drawn !== trisDrawn) throw new Error(`park: the loader read ${draws} draws and ${drawn} triangles, against ${nodes.length} and ${trisDrawn} written`);

  const park = {
    about: 'Option B: our own stylised, compressed Central Park (scripts/room/park.py, packed by scripts/room/pack.mjs park). glTF frame: metres, y up; the Mall runs toward -z (north). See packPark in pack.mjs for what park.glb carries.',
    glb: { bytes: glb.length, draws, trianglesDrawn: trisDrawn, trianglesStatic: trisStatic, nodes: stats },
    lightmap: { size: 1024, unit: report.light.unit, avif: { bytes: avif.b.length, quality: avif.q }, webp: { bytes: webp.b.length, quality: webp.q }, bake: { size: report.size, samples: report.samples } },
    light: report.light,
    camera: { near: 0.1, far: 1600, eye: 1.5 },
    poses: report.poses,
    flights: report.flights.map((f) => ({ ...f, curve: 'CatmullRomCurve3, centripetal; points and look share each control point\'s parameter (getPoint(t)), the position read at constant speed (getUtoTmapping)' })),
    checks: report.checks,
  };
  writeFileSync(join(OUTDIR, 'park.json'), JSON.stringify(park, null, 1) + '\n');
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(`park: park.glb ${kb(glb.length)} (raw float ${kb(readFileSync(join(src, 'park-raw.glb')).length)}), ${draws} draws, ${trisDrawn} triangles drawn (${trisStatic} static)`);
  console.log(`park: lightmap avif ${kb(avif.b.length)} (q${avif.q}), webp ${kb(webp.b.length)} (q${webp.q})`);
  for (const s of stats) console.log(`  ${s.name.padEnd(12)} ${s.light.padEnd(8)} ${String(s.tris).padStart(6)} tris${s.instances ? ` x ${s.instances}` : ''}`);
  const over = [glb.length > LINES.glb && `park.glb ${kb(glb.length)} over 300 KB`, avif.b.length > LINES.avif && `AVIF ${kb(avif.b.length)} over 120 KB`, webp.b.length > LINES.webp && `WebP ${kb(webp.b.length)} over 190 KB`, draws > LINES.draws && `${draws} draws over 40`].filter(Boolean);
  if (trisDrawn > 33000) over.push(`${trisDrawn} triangles drawn, well over the 30k aim`);
  if (over.length) { console.error(`park: over the lines (section-4-world.md 6): ${over.join('; ')}`); process.exitCode = 1; }
}
