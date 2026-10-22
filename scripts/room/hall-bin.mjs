// The hall's model as a compact binary (src/assets/room/hall.bin) in place of hall.glb, so the director's chunk no longer
// carries three's GLTFLoader (13.5 KB gzip; docs/specs/section-4-world.md 6 and 8, the section's script line). It reads
// the GLB hall.py exports (25 nodes, no transforms, no materials: the island assigns them by name) and writes the parts
// hall.ts needs, each its own vertex and index range: the lit shell (positions, normals and the lightmap's UVs), the
// fixtures, the floor spots, the two leaves (apart, for their hinges) and the seam. Same-material boxes are merged into
// one part. Layout, little-endian, every block 4-byte aligned:
//   u32 magic 'SHK1', u32 vertices V, u32 indices I, u32 UV vertices (the shell's, which come first), u32 parts P,
//   u32 the names' byte length L, then P x (u32 first vertex, u32 vertex count, u32 first index, u32 index count),
//   the names (ASCII, comma-separated, padded to 4), positions f32 x 3V, UVs f32 x 2 per UV vertex, normals i8 x 3V
//   (normalized: the hall's normals are axis-aligned, so exact; padded to 4), indices u16 x I (each part's own from 0).
// src/scripts/hero/section4/assets.ts's parseHallBin reads it; tests/unit/hall-bin.test.ts checks it against the GLB
// triangle for triangle and that the shipped file is this script's output byte for byte. Run after hall.py and
// encode.mjs (encode.mjs's hall mode runs it too):
//   node scripts/room/hall-bin.mjs [src/assets/room/hall.glb] [src/assets/room/hall.bin]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** the parts in file order, each by the node names hall.py gives them */
export const HALL_PARTS = Object.freeze([
  ['hall', /^hall$/], ['fixture', /^fixture(\.\d+)?$/], ['spot', /^spot(\.\d+)?$/], ['leaf_left', /^leaf_left$/], ['leaf_right', /^leaf_right$/], ['seam', /^seam$/],
]);
const MAGIC = 0x314b4853;   // 'SHK1' read as bytes S, H, K, 1
const pad4 = (n) => (n + 3) & ~3;

/** the GLB's JSON and its BIN chunk */
function readGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('hall-bin: not a GLB (magic)');
  const jlen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jlen).toString('utf8'));
  const blen = buf.readUInt32LE(20 + jlen);
  return { json, bin: buf.subarray(28 + jlen, 28 + jlen + blen) };
}

/** an accessor's values as a plain array (float or unsigned short, tightly packed as the Blender exporter writes them) */
function values(json, bin, i) {
  const a = json.accessors[i], v = json.bufferViews[a.bufferView];
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3 }[a.type], f = a.componentType === 5126;
  if (!n || (!f && a.componentType !== 5123) || (v.byteStride && v.byteStride !== n * (f ? 4 : 2))) throw new Error(`hall-bin: accessor ${i} is not a packed float or u16 ${a.type}`);
  const off = (v.byteOffset ?? 0) + (a.byteOffset ?? 0), out = [];
  for (let k = 0; k < a.count * n; k++) out.push(f ? bin.readFloatLE(off + k * 4) : bin.readUInt16LE(off + k * 2));
  return out;
}

/** hall.glb to hall.bin: a Buffer */
export function hallBin(glb) {
  const { json, bin } = readGlb(glb);
  const nodes = json.scenes[json.scene ?? 0].nodes.map((i) => json.nodes[i]);
  for (const n of nodes) if (n.matrix || n.translation || n.rotation || n.scale || n.children) throw new Error(`hall-bin: node ${n.name} carries a transform or children; hall.py exports them applied`);
  const parts = HALL_PARTS.map(([name, re]) => {
    const own = nodes.filter((n) => re.test(n.name));
    if (!own.length) throw new Error(`hall-bin: no node for ${name}`);
    const pos = [], nrm = [], uv = [], idx = [];
    for (const n of own) for (const p of json.meshes[n.mesh].primitives) {
      if ((p.mode ?? 4) !== 4) throw new Error(`hall-bin: ${n.name} is not triangles`);
      const base = pos.length / 3;
      pos.push(...values(json, bin, p.attributes.POSITION)); nrm.push(...values(json, bin, p.attributes.NORMAL));
      if (name === 'hall') { if (p.attributes.TEXCOORD_0 === undefined) throw new Error('hall-bin: the shell has no lightmap UVs'); uv.push(...values(json, bin, p.attributes.TEXCOORD_0)); }
      idx.push(...values(json, bin, p.indices).map((k) => k + base));
    }
    for (const v of nrm) if (v !== 0 && Math.abs(v) !== 1) throw new Error(`hall-bin: ${name} has a normal off the axes (${v}); the i8 normals are exact only on them`);
    return { name, pos, nrm, uv, idx };
  });
  const V = parts.reduce((a, p) => a + p.pos.length / 3, 0), I = parts.reduce((a, p) => a + p.idx.length, 0), U = parts[0].uv.length / 2;
  if (V > 65535) throw new Error('hall-bin: too many vertices for u16 indices');
  const names = Buffer.from(parts.map((p) => p.name).join(','), 'ascii');
  const head = 24 + parts.length * 16, at = { names: head, pos: head + pad4(names.length) };
  at.uv = at.pos + V * 12; at.nrm = at.uv + U * 8; at.idx = at.nrm + pad4(V * 3);
  const out = Buffer.alloc(pad4(at.idx + I * 2));
  [MAGIC, V, I, U, parts.length, names.length].forEach((x, k) => out.writeUInt32LE(x, k * 4));
  let v0 = 0, i0 = 0;
  parts.forEach((p, k) => {
    const vc = p.pos.length / 3;
    [v0, vc, i0, p.idx.length].forEach((x, j) => out.writeUInt32LE(x, 24 + k * 16 + j * 4));
    p.pos.forEach((x, j) => out.writeFloatLE(x, at.pos + (v0 * 3 + j) * 4));
    p.uv.forEach((x, j) => out.writeFloatLE(x, at.uv + j * 4));
    p.nrm.forEach((x, j) => out.writeInt8(Math.round(x * 127), at.nrm + v0 * 3 + j));
    p.idx.forEach((x, j) => out.writeUInt16LE(x, at.idx + (i0 + j) * 2));
    v0 += vc; i0 += p.idx.length;
  });
  names.copy(out, at.names);
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const src = process.argv[2] ?? 'src/assets/room/hall.glb', dst = process.argv[3] ?? 'src/assets/room/hall.bin';
  const glb = readFileSync(src), out = hallBin(glb);
  writeFileSync(dst, out);
  console.log(`hall-bin: ${src} (${glb.length} B) to ${dst} (${out.length} B)`);
}
