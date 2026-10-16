// Section 4's product models into the site (docs/specs/section-4.md 12): each GLB that scripts/room/products.py wrote
// (float positions and normals, one mesh per named part) is quantised and meshopt-encoded, the way the site's other
// models load: KHR_mesh_quantization (positions as 16-bit integers dequantised by each node's translation and uniform
// scale, normals as 8-bit normalised) and EXT_meshopt_compression (decoded by the vendored pure-JS reference decoder,
// so the CSP's no-WebAssembly rule holds). No materials, textures, colours or UVs survive: the island draws its own.
// Writes public/models/<which>.<sha8>.glb (content-hashed; older copies removed) and src/data/room-products.json.
//   node scripts/room/pack.mjs <dir with <which>-raw.glb and <which>-report.json> wallet airpods lenskin
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MeshoptEncoder } from 'meshoptimizer';

const [dir, ...which] = process.argv.slice(2);
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

for (const w of which) {
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
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
