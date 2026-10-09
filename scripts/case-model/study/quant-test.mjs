// Measurement only: sizes of the stand-in under quantisation-only (KHR_mesh_quantization, no decoder)
// against meshopt, for LOD0 and a simplified LOD1, with and without UVs. Our own fixture only.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, quantize, meshopt, prune, reorder, simplify } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import zlib from 'node:zlib';
const [inp] = process.argv.slice(2);
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const br = (b) => zlib.brotliCompressSync(b, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const gz = (b) => zlib.gzipSync(b, { level: 9 }).length;
const tris = (doc) => doc.getRoot().listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => k + p.getIndices().getCount() / 3, 0), 0);
const noUV = () => (doc) => { for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const a = p.getAttribute('TEXCOORD_0'); if (a) { p.setAttribute('TEXCOORD_0', null); } } };
const Q = () => quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 });
const S = (n) => simplify({ simplifier: MeshoptSimplifier, ratio: n, error: 0.001 });
const runs = {
  'lod0 float (as exported)': [],
  'lod0 quantise only': [dedup(), weld(), Q()],
  'lod0 quantise only, no uv': [dedup(), weld(), noUV(), Q()],
  'lod0 meshopt': [dedup(), weld(), reorder({ encoder: MeshoptEncoder }), Q(), meshopt({ encoder: MeshoptEncoder, level: 'medium' })],
  'lod1 (ratio 0.5) quantise only': [dedup(), weld(), S(0.5), Q()],
  'lod1 (ratio 0.5) quantise only, no uv': [dedup(), weld(), S(0.5), noUV(), Q()],
  'lod1 (ratio 0.5) meshopt': [dedup(), weld(), S(0.5), reorder({ encoder: MeshoptEncoder }), Q(), meshopt({ encoder: MeshoptEncoder, level: 'medium' })],
};
const res = {};
for (const [name, steps] of Object.entries(runs)) {
  const doc = await io.read(inp);
  await doc.transform(prune({ keepAttributes: true, keepLeaves: true }), ...steps, prune({ keepAttributes: false, keepLeaves: true }));
  const bytes = await io.writeBinary(doc);
  const used = [...doc.getRoot().listExtensionsUsed()].map((e) => e.extensionName);
  res[name] = { bytes: bytes.length, gzip: gz(bytes), brotli: br(bytes), triangles: tris(doc), extensions: used };
  console.log(name.padEnd(40), JSON.stringify(res[name]));
}
