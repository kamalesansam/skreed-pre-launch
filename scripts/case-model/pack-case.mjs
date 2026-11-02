// Sam's case-type models packed for the site (docs/specs/family-page.md 24, D1): each raw GLB that
// scripts/case-model/intake-fbx.py wrote (float positions and normals, one mesh per part named by role, the Cobalt's
// materials) is quantised and meshopt-encoded into the case model contract, the way the Cobalt's files are:
// KHR_mesh_quantization (positions on a 14-bit grid stored as normalised 16-bit integers, dequantised by each node's
// translation and uniform scale: one grid for the whole case, so the parts meet exactly, a step of about 0.01 mm on a
// 160 mm case, and the codec's deltas stay small, as scripts/room/pack.mjs has it; normals as 8-bit octahedral) and
// EXT_meshopt_compression (decoded by the vendored pure-JS reference decoder, so the CSP's no-WebAssembly rule holds).
// The node, mesh and material names, the materials and the scene extras (the report's, with the LOD) are kept; nothing
// else of the raw file is.
//   node scripts/case-model/pack-case.mjs <dir with <model>-lod{0,1}-raw.glb and <model>-report.json> <model>...
// writes <dir>/<model>.lod0.glb and <dir>/<model>.lod1.glb, which scripts/case-model/intake.mjs --model <model> checks and
// installs under public/models.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MeshoptEncoder } from 'meshoptimizer';

const ORDER = ['shell', 'trim', 'logo', 'ring'];
const MATERIAL = { shell: [1, 1, 1], trim: [0.073, 0.077, 0.077], logo: [0.8468, 0.8468, 0.8468], ring: [1, 1, 1] };
const COMP = { 5121: [Uint8Array, 1], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] };
const N = { SCALAR: 1, VEC3: 3 };
const GRID = 8191;           // the grid's half range: 14 bits
const pad4 = (n) => (n + 3) & ~3;

function readGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67 || buf.readUInt32LE(4) !== 2) throw new Error('not a glTF 2 binary');
  const jl = buf.readUInt32LE(12), json = JSON.parse(buf.subarray(20, 20 + jl).toString('utf8'));
  const at = 20 + jl, bl = buf.readUInt32LE(at);
  return { json, bin: buf.subarray(at + 8, at + 8 + bl) };
}
function read(json, bin, i) {
  const a = json.accessors[i], v = json.bufferViews[a.bufferView], [T, size] = COMP[a.componentType], n = N[a.type];
  if (!T || !n || a.normalized) throw new Error(`accessor ${i}: unexpected ${a.componentType} ${a.type}`);
  const stride = v.byteStride || size * n, out = new T(a.count * n), base = (v.byteOffset || 0) + (a.byteOffset || 0);
  const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) {
    const o = base + k * stride + c * size;
    out[k * n + c] = size === 4 ? (a.componentType === 5126 ? dv.getFloat32(o, true) : dv.getUint32(o, true)) : size === 2 ? dv.getUint16(o, true) : dv.getUint8(o);
  }
  return out;
}

/** The parts of a raw file, in the contract's order, with their materials checked against the role. */
function partsOf(json, bin, file) {
  const parts = [];
  for (const node of json.nodes ?? []) {
    if (node.mesh === undefined) continue;
    if (!ORDER.includes(node.name)) throw new Error(`${file}: node "${node.name}" is not a part (${ORDER.join(', ')})`);
    if (node.rotation || node.scale || node.translation || node.matrix) throw new Error(`${file}: node ${node.name} carries a transform`);
    const prims = json.meshes[node.mesh].primitives;
    if (prims.length !== 1 || (prims[0].mode ?? 4) !== 4) throw new Error(`${file}: ${node.name} is not one triangle list`);
    const p = prims[0], m = json.materials[p.material], pbr = m.pbrMetallicRoughness ?? {};
    const base = (pbr.baseColorFactor ?? [1, 1, 1, 1]).slice(0, 3);
    if (m.name !== node.name || base.some((v, i) => Math.abs(v - MATERIAL[node.name][i]) > 1e-4) || (pbr.metallicFactor ?? 1) !== 0) {
      throw new Error(`${file}: material of ${node.name} is ${JSON.stringify(m)}`);
    }
    parts.push({ name: node.name, roughness: pbr.roughnessFactor ?? 1, base, pos: read(json, bin, p.attributes.POSITION), nor: read(json, bin, p.attributes.NORMAL), idx: read(json, bin, p.indices) });
  }
  return parts.sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
}

/** One packed LOD: the GLB's bytes and what it holds. */
export function pack(raw, extras, lod, name) {
  const { json, bin } = readGlb(raw);
  const parts = partsOf(json, bin, `${name} ${lod}`);
  // one grid for the case: the box's centre and half its largest side over GRID steps
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) for (let i = 0; i < p.pos.length; i++) { lo[i % 3] = Math.min(lo[i % 3], p.pos[i]); hi[i % 3] = Math.max(hi[i % 3], p.pos[i]); }
  const t = lo.map((v, i) => (v + hi[i]) / 2), s = Math.max(...hi.map((v, i) => (v - lo[i]) / 2));
  const chunks = [], views = [], accessors = [], meshes = [], nodes = [], materials = [];
  let fallback = 0, packed = 0, tris = 0, maxErr = 0;
  const view = (bytes, stride, count, mode, filter) => {
    const enc = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, mode);
    const ext = { buffer: 0, byteOffset: packed, byteLength: enc.byteLength, byteStride: stride, mode, count, ...(filter ? { filter } : {}) };
    const v = { buffer: 1, byteOffset: fallback, byteLength: bytes.byteLength, ...(mode === 'ATTRIBUTES' ? { byteStride: stride, target: 34962 } : { target: 34963 }), extensions: { EXT_meshopt_compression: ext } };
    chunks.push({ at: packed, data: enc });
    packed = pad4(packed + enc.byteLength);
    fallback = pad4(fallback + bytes.byteLength);
    views.push(v);
    return views.length - 1;
  };
  for (const p of parts) {
    const count = p.pos.length / 3;
    const idx32 = Uint32Array.from(p.idx);
    // meshopt's vertex cache and fetch order (the index buffer is rewritten in place), then the attributes follow it
    const [remap, unique] = MeshoptEncoder.reorderMesh(idx32, true, true);
    const pos = new Int16Array(unique * 4), nor = new Float32Array(unique * 4);
    const qlo = [GRID, GRID, GRID], qhi = [-GRID, -GRID, -GRID];
    for (let i = 0; i < count; i++) {
      const j = remap[i];
      if (j === 0xffffffff) continue;
      let len = 0;
      for (let c = 0; c < 3; c++) len += p.nor[i * 3 + c] ** 2;
      len = Math.sqrt(len) || 1;
      for (let c = 0; c < 3; c++) {
        const q = Math.max(-GRID, Math.min(GRID, Math.round(((p.pos[i * 3 + c] - t[c]) / s) * GRID)));
        pos[j * 4 + c] = q;
        qlo[c] = Math.min(qlo[c], q); qhi[c] = Math.max(qhi[c], q);
        maxErr = Math.max(maxErr, Math.abs((q / GRID) * s + t[c] - p.pos[i * 3 + c]));
        nor[j * 4 + c] = p.nor[i * 3 + c] / len;
      }
    }
    const oct = MeshoptEncoder.encodeFilterOct(nor, unique, 4, 8);
    const idx = unique < 65536 ? Uint16Array.from(idx32) : idx32;
    const vp = view(new Uint8Array(pos.buffer), 8, unique, 'ATTRIBUTES');
    const vn = view(oct, 4, unique, 'ATTRIBUTES', 'OCTAHEDRAL');
    const vi = view(new Uint8Array(idx.buffer), idx.BYTES_PER_ELEMENT, idx.length, 'TRIANGLES');
    accessors.push({ bufferView: vp, componentType: 5122, normalized: true, count: unique, type: 'VEC3', min: qlo, max: qhi });
    accessors.push({ bufferView: vn, componentType: 5120, normalized: true, count: unique, type: 'VEC3' });
    accessors.push({ bufferView: vi, componentType: idx.BYTES_PER_ELEMENT === 2 ? 5123 : 5125, count: idx.length, type: 'SCALAR' });
    const a = accessors.length;
    const white = p.base.every((v) => v === 1);
    materials.push({ name: p.name, ...(p.name === 'logo' ? { extras: { tintOfShell: extras.logoTint } } : {}), pbrMetallicRoughness: { ...(white ? {} : { baseColorFactor: [...p.base, 1] }), roughnessFactor: p.roughness, metallicFactor: 0 } });
    meshes.push({ name: p.name, primitives: [{ attributes: { POSITION: a - 3, NORMAL: a - 2 }, indices: a - 1, mode: 4, material: materials.length - 1 }] });
    // a normalised SHORT reads as q / 32767, so the node's scale carries the grid back to the case's units
    const k = (s * 32767) / GRID;
    nodes.push({ name: p.name, mesh: meshes.length - 1, translation: t, scale: [k, k, k] });
    tris += idx.length / 3;
  }
  const { unitMM, axes, logoTint, shadeColour, source, backOnly } = extras;
  const out = {
    asset: { version: '2.0', generator: 'skreed scripts/case-model/pack-case.mjs' },
    extensionsUsed: ['EXT_meshopt_compression', 'KHR_mesh_quantization'], extensionsRequired: ['EXT_meshopt_compression', 'KHR_mesh_quantization'],
    scene: 0, scenes: [{ name, extras: { unitMM, axes, lod, logoTint, shadeColour, source, backOnly }, nodes: nodes.map((_, i) => i) }],
    nodes, meshes, materials, accessors, bufferViews: views,
    buffers: [{ byteLength: packed }, { byteLength: fallback, extensions: { EXT_meshopt_compression: { fallback: true } } }],
  };
  const binOut = Buffer.alloc(packed);
  for (const c of chunks) Buffer.from(c.data.buffer, c.data.byteOffset, c.data.byteLength).copy(binOut, c.at);
  let js = Buffer.from(JSON.stringify(out), 'utf8');
  js = Buffer.concat([js, Buffer.alloc(pad4(js.length) - js.length, 0x20)]);
  const total = 12 + 8 + js.length + 8 + binOut.length, glb = Buffer.alloc(total);
  glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(total, 8);
  glb.writeUInt32LE(js.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); js.copy(glb, 20);
  glb.writeUInt32LE(binOut.length, 20 + js.length); glb.writeUInt32LE(0x004e4942, 24 + js.length); binOut.copy(glb, 28 + js.length);
  return { glb, tris, parts: parts.map((p) => `${p.name} ${p.idx.length / 3}`), maxErrMm: maxErr * unitMM };
}

async function main() {
  const [dir, ...models] = process.argv.slice(2);
  if (!dir || !models.length) { console.error('usage: node scripts/case-model/pack-case.mjs <dir> <model>...'); process.exit(2); }
  await MeshoptEncoder.ready;
  for (const m of models) {
    const report = JSON.parse(readFileSync(join(dir, `${m}-report.json`), 'utf8'));
    for (const lod of ['lod0', 'lod1']) {
      const raw = readFileSync(join(dir, `${m}-${lod}-raw.glb`));
      const r = pack(raw, report.extras, lod, m);
      writeFileSync(join(dir, `${m}.${lod}.glb`), r.glb);
      console.log(`${m} ${lod}: ${r.glb.length} B (raw float ${raw.length} B), ${r.tris} triangles (${r.parts.join(', ')}), position error at most ${r.maxErrMm.toFixed(4)} mm`);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
