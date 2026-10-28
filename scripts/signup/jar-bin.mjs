// Section 5's glass jar as one loader-free binary, src/assets/signup/jar.bin (docs/specs/section-5.md 3, "The jar"):
// Sam's upload, "Glass jar" by Pentristo on Sketchfab (CC BY 4.0), kept at assets-src/signup/glass_jar.glb for the record,
// read here under node from its JSON and BIN chunks (float positions and normals, u32 indices, one mesh under a node that
// turns the mesh's z up to Y up) and written in products.bin's own layout (SHP1, scripts/room/products-bin.mjs; the
// island's section4/products-bin.ts parser reads it back, so section 5's chunk ships without a glTF loader, X-7's rule):
//   u32 magic 'SHP1', u32 products 1, u32 parts 1, u32 vertices V, u32 indices I, u32 names bytes L
//   1 product, 36 B: f32 offset x y z (m), f32 scale (m per grid unit), f32 size x y z (m), u32 first part 0, u32 parts 1
//   1 part, 16 B: u32 first vertex 0, u32 vertex count V, u32 first index 0, u32 index count I
//   names: 'jar,jar' padded to 4; positions u16 x 3V (one grid for the three axes, the box's longest side over 65535),
//   normals i8 x 3V, indices u16 x I, each padded to 4
// The jar is recentred (its bounding box centre at the origin), turned Y up by the node's matrix and scaled so its height
// is 1 m, so the island places it by one number (the slot's height). Prints the counts, the box in millimetres, the
// stored and gzip sizes against the 20 KB line, and writes the manifest src/data/signup-jar-bin.json (what the unit test
// pins, with the bin, to this script's output):
//   node scripts/signup/jar-bin.mjs [assets-src/signup/glass_jar.glb] [src/assets/signup/jar.bin] [src/data/signup-jar-bin.json]
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

export const GLB_PATH = 'assets-src/signup/glass_jar.glb', BIN_PATH = 'src/assets/signup/jar.bin', MANIFEST_PATH = 'src/data/signup-jar-bin.json';
export const LINE_KB = 20;
/** the model's provenance, as the licence asks it to be carried (section-5.md 3; the credit line in the section) */
export const CREDIT = Object.freeze({ title: 'Glass jar', author: 'Pentristo', source: 'https://sketchfab.com/3d-models/glass-jar-c1e74f99560549739bcb17df3103b66d', licence: 'CC BY 4.0', licenceUrl: 'http://creativecommons.org/licenses/by/4.0/' });
const MAGIC = 0x31504853;
const pad4 = (n) => (n + 3) & ~3;
const mm = (v) => Math.round(v * 1e5) / 100 || 0;

/** a glTF accessor's values as a typed array (tightly packed, as Sketchfab writes them) */
function accessor(json, bin, i) {
  const a = json.accessors[i], v = json.bufferViews[a.bufferView], off = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type], T = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[a.componentType];
  if (!n || !T) throw new Error(`jar-bin: accessor ${i} is ${a.type} ${a.componentType}, not float or integer`);
  if (v.byteStride && v.byteStride !== n * T.BYTES_PER_ELEMENT) throw new Error(`jar-bin: accessor ${i} is interleaved`);
  return new T(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + a.count * n * T.BYTES_PER_ELEMENT));
}

/** the one mesh's node chain multiplied out: the mesh's local to the scene (column-major 4 x 4, as glTF stores it) */
function worldMatrix(json) {
  const nodes = json.nodes, parent = new Map();
  nodes.forEach((n, i) => { for (const c of n.children ?? []) parent.set(c, i); });
  const meshNode = nodes.findIndex((n) => n.mesh !== undefined);
  if (meshNode < 0) throw new Error('jar-bin: no mesh node');
  const chain = [];
  for (let i = meshNode; i !== undefined; i = parent.get(i)) chain.unshift(i);
  let M = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (const i of chain) {
    const n = nodes[i];
    if (n.translation || n.rotation || n.scale) throw new Error(`jar-bin: node ${i} uses TRS, not a matrix`);
    const m = n.matrix ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], out = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += M[k * 4 + r] * m[c * 4 + k];
    M = out;
  }
  return M;
}
const apply = (M, x, y, z, w) => [M[0] * x + M[4] * y + M[8] * z + M[12] * w, M[1] * x + M[5] * y + M[9] * z + M[13] * w, M[2] * x + M[6] * y + M[10] * z + M[14] * w];

/** the GLB to jar.bin: the file as a Buffer and the manifest the test pins beside it */
export function jarBin(glb, { glbPath = GLB_PATH, binPath = BIN_PATH } = {}) {
  if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error('jar-bin: not a GLB');
  const jl = glb.readUInt32LE(12), json = JSON.parse(glb.subarray(20, 20 + jl).toString('utf8'));
  const bl = glb.readUInt32LE(20 + jl), bin = glb.subarray(28 + jl, 28 + jl + bl);
  const mesh = json.meshes[0], prim = mesh.primitives[0];
  if (json.meshes.length !== 1 || mesh.primitives.length !== 1 || (prim.mode ?? 4) !== 4) throw new Error('jar-bin: one mesh of one triangle primitive expected');
  const P = accessor(json, bin, prim.attributes.POSITION), Nn = accessor(json, bin, prim.attributes.NORMAL), I = accessor(json, bin, prim.indices);
  if (I.length % 3) throw new Error('jar-bin: the index is not triangles');
  const V = P.length / 3;
  if (V > 65535) throw new Error(`jar-bin: ${V} vertices; u16 indices allow 65535`);
  const M = worldMatrix(json);
  // the vertices in the scene's frame (Y up), the normals through the same rotation (the matrix is a rotation: no scale)
  const world = new Float64Array(V * 3), nrm = new Float64Array(V * 3);
  for (let k = 0; k < V; k++) {
    const p = apply(M, P[k * 3], P[k * 3 + 1], P[k * 3 + 2], 1), n = apply(M, Nn[k * 3], Nn[k * 3 + 1], Nn[k * 3 + 2], 0);
    const l = Math.hypot(...n) || 1;
    for (let c = 0; c < 3; c++) { world[k * 3 + c] = p[c]; nrm[k * 3 + c] = n[c] / l; }
  }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let k = 0; k < V; k++) for (let c = 0; c < 3; c++) { min[c] = Math.min(min[c], world[k * 3 + c]); max[c] = Math.max(max[c], world[k * 3 + c]); }
  const centre = min.map((a, c) => (a + max[c]) / 2), height = max[1] - min[1];
  if (!(height > 0)) throw new Error('jar-bin: the jar has no height');
  const unit = 1 / height;   // the jar 1 m tall
  const size = max.map((a, c) => (a - min[c]) * unit), longest = Math.max(...size), step = longest / 65535;
  const origin = min.map((a, c) => (a - centre[c]) * unit);
  const q = new Uint16Array(V * 3), n8 = new Int8Array(V * 3);
  for (let k = 0; k < V * 3; k++) {
    const c = k % 3, x = Math.round(((world[k] - centre[c]) * unit - origin[c]) / step);
    if (x < 0 || x > 65535) throw new Error(`jar-bin: grid value ${x} off the u16 grid`);
    q[k] = x; n8[k] = Math.max(-127, Math.min(127, Math.round(nrm[k] * 127)));
  }
  for (let k = 0; k < V * 3; k += 3) { const l = Math.hypot(n8[k], n8[k + 1], n8[k + 2]) / 127; if (Math.abs(l - 1) > 0.01) throw new Error(`jar-bin: normal ${k / 3} decodes to length ${l}`); }
  const idx = new Uint16Array(I.length);
  for (let k = 0; k < I.length; k++) { if (I[k] >= V) throw new Error(`jar-bin: index ${I[k]} past ${V} vertices`); idx[k] = I[k]; }
  // the f32 the parser will use, against the recentred positions to a micron
  const fo = origin.map(Math.fround), fs = Math.fround(step);
  for (let k = 0; k < V; k++) for (let c = 0; c < 3; c++) {
    const got = fo[c] + fs * q[k * 3 + c], want = (world[k * 3 + c] - centre[c]) * unit;
    if (Math.abs(got - want) > 1e-5) throw new Error(`jar-bin: vertex ${k}: ${got} against ${want} m`);
  }
  const names = Buffer.from('jar,jar', 'ascii');
  const at = { names: 24 + 36 + 16 };
  at.pos = at.names + pad4(names.length); at.nrm = at.pos + pad4(V * 6); at.idx = at.nrm + pad4(V * 3);
  const out = Buffer.alloc(at.idx + pad4(idx.length * 2));
  [MAGIC, 1, 1, V, idx.length, names.length].forEach((x, k) => out.writeUInt32LE(x, k * 4));
  [...fo, fs, ...size.map(Math.fround)].forEach((x, j) => out.writeFloatLE(x, 24 + j * 4));
  out.writeUInt32LE(0, 24 + 28); out.writeUInt32LE(1, 24 + 32);
  [0, V, 0, idx.length].forEach((x, j) => out.writeUInt32LE(x, 24 + 36 + j * 4));
  names.copy(out, at.names);
  q.forEach((x, j) => out.writeUInt16LE(x, at.pos + j * 2));
  n8.forEach((x, j) => out.writeInt8(x, at.nrm + j));
  idx.forEach((x, j) => out.writeUInt16LE(x, at.idx + j * 2));
  const manifest = {
    bin: { path: binPath, format: 'SHP1', bytes: out.length, sha256: createHash('sha256').update(out).digest('hex'), products: ['jar'], vertices: V, triangles: idx.length / 3, writtenBy: 'scripts/signup/jar-bin.mjs' },
    jar: {
      source: glbPath, sha256: createHash('sha256').update(glb).digest('hex'), ...CREDIT, generator: json.asset?.generator ?? null,
      parts: ['jar'], vertices: V, triangles: idx.length / 3, bytes: V * 9 + idx.length * 2,
      heightM: 1, sizeMm: size.map(mm), boxMm: { min: size.map((x) => mm(-x / 2)), max: size.map((x) => mm(x / 2)) }, sourceHeight: height, sourceCentre: centre, gridStepMm: Math.round(step * 1e7) / 1e4,
    },
  };
  return { bin: out, manifest };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const glbPath = process.argv[2] ?? GLB_PATH, binPath = process.argv[3] ?? BIN_PATH, manPath = process.argv[4] ?? MANIFEST_PATH;
  const { bin, manifest } = jarBin(readFileSync(glbPath), { glbPath, binPath });
  mkdirSync(dirname(binPath), { recursive: true }); mkdirSync(dirname(manPath), { recursive: true });
  writeFileSync(binPath, bin);
  writeFileSync(manPath, JSON.stringify(manifest, null, 1) + '\n');
  const j = manifest.jar, b = j.boxMm;
  console.log(`jar: ${j.vertices} vertices, ${j.triangles} triangles, ${j.bytes} B; box ${b.min[0]}..${b.max[0]} x ${b.min[1]}..${b.max[1]} x ${b.min[2]}..${b.max[2]} mm (${j.sizeMm.join(' x ')}) at 1 m tall (the source ${j.sourceHeight.toFixed(4)} units); grid ${j.gridStepMm} mm`);
  const gz = gzipSync(bin, { level: 9 }).length, line = LINE_KB * 1024;
  console.log(`${binPath}: ${bin.length} B stored (${(bin.length / 1024).toFixed(1)} KiB), gzip ${gz} B; sha256 ${manifest.bin.sha256.slice(0, 8)}`);
  console.log(bin.length <= line ? `within the ${LINE_KB} KB line (${line} B) by ${line - bin.length} B` : `OVER the ${LINE_KB} KB line (${line} B) by ${bin.length - line} B`);
  console.log(`${manPath} written`);
}
