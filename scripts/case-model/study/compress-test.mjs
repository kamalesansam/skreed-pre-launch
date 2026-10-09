// Measure how much a GLB shrinks under the standard pipelines. Writes temp outputs to <tmpdir>, prints sizes, and
// (with --keep absent) deletes them afterwards. Measurement only.
// Usage: node compress-test.mjs <in.glb> <tmpdir> [--keep]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, quantize, meshopt, draco, prune, reorder, simplify } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const [inp, tmp] = process.argv.slice(2);
const keep = process.argv.includes('--keep');
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule(),
  'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder,
});
fs.mkdirSync(tmp, { recursive: true });
const br = (b) => zlib.brotliCompressSync(b, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const gz = (b) => zlib.gzipSync(b, { level: 9 }).length;
const tris = (doc) => doc.getRoot().listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => k + (p.getIndices() ? p.getIndices().getCount() / 3 : p.getAttribute('POSITION').getCount() / 3), 0), 0);
const runs = {
  raw: [],
  'dedup+weld': [dedup(), weld()],
  'quantize (pos14 norm10 uv12)': [dedup(), weld(), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 })],
  'meshopt (quantize+EXT_meshopt, medium)': [dedup(), weld(), reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' })],
  'draco (edgebreaker, pos14 norm10 uv12)': [dedup(), weld(), draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 })],
  'simplify 50% + meshopt': [dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.5, error: 0.001 }), reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' })],
};
const res = {};
for (const [name, steps] of Object.entries(runs)) {
  const doc = await io.read(inp);
  await doc.transform(prune({ keepAttributes: true, keepLeaves: true }), ...steps);
  const bytes = await io.writeBinary(doc);
  const outp = path.join(tmp, name.replace(/[^a-z0-9]+/gi, '_') + '.glb');
  fs.writeFileSync(outp, bytes);
  res[name] = { bytes: bytes.length, gzip: gz(bytes), brotli: br(bytes), triangles: tris(doc) };
  console.log(name.padEnd(42), JSON.stringify(res[name]));
  if (!keep) fs.unlinkSync(outp);
}
console.log(JSON.stringify(res));
