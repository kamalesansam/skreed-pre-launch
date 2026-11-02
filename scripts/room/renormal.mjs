// Re-smooth a packed product model's normals by angle, keeping its geometry: a stop-gap for a model whose FBX is not to
// hand (the Lenskin on 2026-10-26: products.py's shade-smooth at 40 degrees bent the flat face's vertex normals toward
// the fillet facets that meet it at 30 to 40 degrees, and across the face's long triangles that interpolates to a light
// wedge with a straight edge and a bright patch on the bridge between two holes, as the review of that day measured; at
// 20 degrees the face-to-fillet edges are sharp, so the face is flat, the holes' walls (10 degree steps) stay smooth, and
// the fillet's coarse facets read as crisp bevels rather than a dish). Reads a GLB from scripts/room/models/ (quantised
// and meshopt-encoded, as pack.mjs writes them) through three's GLTFLoader with the vendored decoder (the way
// products-bin.mjs reads them), welds vertices by position, computes face normals, and gives each face corner the
// average of the normals of the faces round its vertex that lie within the angle of its own face (the usual
// smooth-by-angle), splitting the vertex where they differ more. Writes <outdir>/<which>-raw.glb (float positions and
// normals, Y up, one mesh per part, no transforms) and <outdir>/<which>-report.json in products.py's shape, so
// scripts/room/pack.mjs packs it as it packs a Blender export:
//   node scripts/room/renormal.mjs <which> <outdir> [--angle 20]
// then node scripts/room/pack.mjs <outdir> <which> and node scripts/room/products-bin.mjs. The geometry is the file's to
// the grid; only the normals change, so room-products.json's size and triangle counts stay.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../src/scripts/family/three/vendor/meshopt-decoder-reference.js';

const [which, outdir, ...rest] = process.argv.slice(2);
if (!which || !outdir) { console.error('usage: node scripts/room/renormal.mjs <which> <outdir> [--angle 20]'); process.exit(1); }
const ANGLE = Number(rest[rest.indexOf('--angle') + 1] || 20);
const ROOM = JSON.parse(readFileSync('src/data/room-products.json', 'utf8'));
const entry = ROOM[which];
if (!entry) throw new Error(`renormal: no ${which} in src/data/room-products.json`);
const glb = readFileSync(entry.path);
await MeshoptDecoder.ready;
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.length), '');
gltf.scene.updateMatrixWorld(true);
const cosA = Math.cos((ANGLE * Math.PI) / 180);
const parts = [];
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const g = o.geometry, pos = g.attributes.position, idx = g.index;
  if (!idx) throw new Error(`renormal: ${o.name} has no index`);
  // world positions, welded by exact value (the grid makes equal corners equal)
  const v = new Vector3(), key = new Map(), weld = new Uint32Array(pos.count), P = [];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
    const k = `${v.x},${v.y},${v.z}`;
    let w = key.get(k); if (w === undefined) { w = P.length; key.set(k, w); P.push([v.x, v.y, v.z]); }
    weld[i] = w;
  }
  const tri = idx.count / 3, fn = new Float64Array(tri * 3), faces = Array.from({ length: P.length }, () => []);
  const corners = new Uint32Array(idx.count);
  for (let t = 0; t < tri; t++) {
    const a = weld[idx.getX(t * 3)], b = weld[idx.getX(t * 3 + 1)], c = weld[idx.getX(t * 3 + 2)];
    corners[t * 3] = a; corners[t * 3 + 1] = b; corners[t * 3 + 2] = c;
    const [ax, ay, az] = P[a], [bx, by, bz] = P[b], [cx, cy, cz] = P[c];
    const ux = bx - ax, uy = by - ay, uz = bz - az, wx = cx - ax, wy = cy - ay, wz = cz - az;
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    fn[t * 3] = nx; fn[t * 3 + 1] = ny; fn[t * 3 + 2] = nz;
    // the face's area weights the average
    faces[a].push([t, l]); faces[b].push([t, l]); faces[c].push([t, l]);
  }
  // each corner's normal: the area-weighted mean of the normals of the faces at its vertex within ANGLE of its own face
  const outPos = [], outNrm = [], outIdx = new Uint32Array(idx.count), seen = new Map();
  for (let t = 0; t < tri; t++) for (let k = 0; k < 3; k++) {
    const w = corners[t * 3 + k], nx0 = fn[t * 3], ny0 = fn[t * 3 + 1], nz0 = fn[t * 3 + 2];
    let sx = 0, sy = 0, sz = 0;
    for (const [f, area] of faces[w]) {
      const d = fn[f * 3] * nx0 + fn[f * 3 + 1] * ny0 + fn[f * 3 + 2] * nz0;
      if (d >= cosA) { sx += fn[f * 3] * area; sy += fn[f * 3 + 1] * area; sz += fn[f * 3 + 2] * area; }
    }
    const l = Math.hypot(sx, sy, sz) || 1; sx /= l; sy /= l; sz /= l;
    // one output vertex per distinct (position, normal) pair, the normal rounded to what i8 keeps
    const nk = `${w}|${Math.round(sx * 127)},${Math.round(sy * 127)},${Math.round(sz * 127)}`;
    let id = seen.get(nk);
    if (id === undefined) { id = outPos.length / 3; seen.set(nk, id); outPos.push(...P[w]); outNrm.push(sx, sy, sz); }
    outIdx[t * 3 + k] = id;
  }
  parts.push({ name: o.name, pos: Float32Array.from(outPos), nrm: Float32Array.from(outNrm), idx: outIdx, tris: tri, welded: P.length, verts: outPos.length / 3 });
});
// the raw GLB: one buffer, one mesh and node per part, no transforms (pack.mjs refuses them), Y up as the source
const pad4 = (n) => (n + 3) & ~3;
const chunks = [], views = [], accessors = [], meshes = [], nodes = [];
let off = 0;
const view = (arr, target) => { const bytes = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); chunks.push({ at: off, bytes }); views.push({ buffer: 0, byteOffset: off, byteLength: bytes.length, target }); off = pad4(off + bytes.length); return views.length - 1; };
const minmax = (arr, n) => { const lo = Array(n).fill(Infinity), hi = Array(n).fill(-Infinity); for (let i = 0; i < arr.length; i++) { lo[i % n] = Math.min(lo[i % n], arr[i]); hi[i % n] = Math.max(hi[i % n], arr[i]); } return { lo, hi }; };
for (const p of parts) {
  const vp = view(p.pos, 34962), vn = view(p.nrm, 34962);
  const small = p.verts < 65536, ix = small ? Uint16Array.from(p.idx) : p.idx;
  const vi = view(ix, 34963);
  const mm = minmax(p.pos, 3);
  accessors.push({ bufferView: vp, componentType: 5126, count: p.verts, type: 'VEC3', min: mm.lo, max: mm.hi });
  accessors.push({ bufferView: vn, componentType: 5126, count: p.verts, type: 'VEC3' });
  accessors.push({ bufferView: vi, componentType: small ? 5123 : 5125, count: ix.length, type: 'SCALAR' });
  const a = accessors.length;
  meshes.push({ name: p.name, primitives: [{ attributes: { POSITION: a - 3, NORMAL: a - 2 }, indices: a - 1, mode: 4 }] });
  nodes.push({ name: p.name, mesh: meshes.length - 1 });
}
const json = { asset: { version: '2.0', generator: 'skreed scripts/room/renormal.mjs' }, scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes, accessors, bufferViews: views, buffers: [{ byteLength: off }] };
const bin = Buffer.alloc(off); for (const c of chunks) c.bytes.copy(bin, c.at);
let js = Buffer.from(JSON.stringify(json), 'utf8'); js = Buffer.concat([js, Buffer.alloc(pad4(js.length) - js.length, 0x20)]);
const total = 12 + 8 + js.length + 8 + bin.length, out = Buffer.alloc(total);
out.writeUInt32LE(0x46546c67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(total, 8);
out.writeUInt32LE(js.length, 12); out.writeUInt32LE(0x4e4f534a, 16); js.copy(out, 20);
out.writeUInt32LE(bin.length, 20 + js.length); out.writeUInt32LE(0x004e4942, 24 + js.length); bin.copy(out, 28 + js.length);
mkdirSync(outdir, { recursive: true });
writeFileSync(join(outdir, `${which}-raw.glb`), out);
const report = { which, size_mm: entry.sizeMm, parts: Object.fromEntries(parts.map((p) => [p.name, { tris_in: p.tris, tris: p.tris, verts: p.verts, welded: p.welded }])), tris: parts.reduce((a, p) => a + p.tris, 0), smooth_deg: ANGLE, source: `${entry.source}; normals re-smoothed at ${ANGLE} degrees by scripts/room/renormal.mjs (2026-10-26), geometry unchanged`, glb_bytes: out.length };
writeFileSync(join(outdir, `${which}-report.json`), JSON.stringify(report, null, 1) + '\n');
console.log(`${which}: ${parts.map((p) => `${p.name} ${p.tris} tris, ${p.welded} welded positions, ${p.verts} vertices after the ${ANGLE} degree smoothing`).join('; ')}; ${out.length} B raw`);
