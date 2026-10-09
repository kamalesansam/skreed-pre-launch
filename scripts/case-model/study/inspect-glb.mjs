// Inspect a .glb/.gltf: hierarchy, world transforms, mesh stats, attributes, materials,
// textures, UV ranges, topology checks and a byte breakdown. Read-only.
// Usage: node inspect-glb.mjs <file.glb> [--json out.json]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/core';
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2];
const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
let draco = null;
try {
  const d3d = (await import('draco3dgltf')).default;
  draco = { 'draco3d.decoder': await d3d.createDecoderModule(), 'draco3d.encoder': await d3d.createEncoderModule() };
} catch {}
let meshopt = null;
try { const m = await import('meshoptimizer'); await m.MeshoptDecoder.ready; await m.MeshoptEncoder.ready; meshopt = { 'meshopt.decoder': m.MeshoptDecoder, 'meshopt.encoder': m.MeshoptEncoder }; } catch {}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ ...(draco || {}), ...(meshopt || {}) });

// raw JSON chunk first (to report extensions/bufferViews exactly as shipped)
const buf = fs.readFileSync(file);
let rawJson;
if (file.endsWith('.glb')) {
  const jlen = buf.readUInt32LE(12);
  rawJson = JSON.parse(buf.subarray(20, 20 + jlen).toString('utf8'));
} else rawJson = JSON.parse(buf.toString('utf8'));

const doc = await io.read(file);
const root = doc.getRoot();
const out = { file: path.basename(file), bytes: buf.length, generator: rawJson.asset?.generator, extensionsUsed: rawJson.extensionsUsed || [], extensionsRequired: rawJson.extensionsRequired || [] };

// byte breakdown from raw bufferViews
const bvUse = new Map();
(rawJson.meshes || []).forEach((m) => m.primitives.forEach((p) => {
  const tag = (acc, kind) => { const a = rawJson.accessors[acc]; if (a && a.bufferView != null) bvUse.set(a.bufferView, kind); };
  Object.entries(p.attributes).forEach(([k, v]) => tag(v, 'attr:' + k));
  if (p.indices != null) tag(p.indices, 'indices');
  const dr = p.extensions?.KHR_draco_mesh_compression; if (dr) bvUse.set(dr.bufferView, 'draco');
}));
(rawJson.images || []).forEach((im) => { if (im.bufferView != null) bvUse.set(im.bufferView, 'image'); });
const bytesBy = {};
(rawJson.bufferViews || []).forEach((bv, i) => { const k = (bvUse.get(i) || 'other').replace(/_\d+$/, ''); bytesBy[k] = (bytesBy[k] || 0) + bv.byteLength; });
out.bytesByKind = bytesBy;

// node hierarchy with world matrices
const mat4mul = (a, b) => { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return r; };
const nodes = [];
const walk = (node, depth, parentPath) => {
  const p = parentPath ? parentPath + '/' + node.getName() : node.getName();
  const mesh = node.getMesh();
  const wb = mesh ? getBounds(node) : null;
  nodes.push({ path: p, depth, t: node.getTranslation().map((v) => +v.toFixed(4)), r: node.getRotation().map((v) => +v.toFixed(4)), s: node.getScale().map((v) => +v.toFixed(4)), mesh: mesh ? mesh.getName() : null, worldBounds: wb ? { min: wb.min.map((v) => +v.toFixed(4)), max: wb.max.map((v) => +v.toFixed(4)), size: wb.max.map((v, i) => +(v - wb.min[i]).toFixed(4)) } : null });
  node.listChildren().forEach((c) => walk(c, depth + 1, p));
};
root.listScenes().forEach((sc) => sc.listChildren().forEach((n) => walk(n, 0, '')));
out.nodes = nodes;
const sb = getBounds(root.listScenes()[0]);
out.sceneBounds = { min: sb.min.map((v) => +v.toFixed(4)), max: sb.max.map((v) => +v.toFixed(4)), size: sb.max.map((v, i) => +(v - sb.min[i]).toFixed(4)) };

// meshes
let totV = 0, totT = 0;
out.meshes = root.listMeshes().map((m) => ({
  name: m.getName(),
  primitives: m.listPrimitives().map((p) => {
    const pos = p.getAttribute('POSITION');
    const idx = p.getIndices();
    const vcount = pos.getCount();
    const tcount = idx ? idx.getCount() / 3 : vcount / 3;
    totV += vcount; totT += tcount;
    const attrs = {};
    p.listSemantics().forEach((s) => { const a = p.getAttribute(s); attrs[s] = { type: a.getType(), componentType: a.getComponentType(), normalized: a.getNormalized(), min: a.getMin([]).map((v) => +v.toFixed(4)), max: a.getMax([]).map((v) => +v.toFixed(4)) }; });
    // topology: degenerate tris, boundary (open) edges, non-manifold edges, duplicate positions
    const ia = idx ? idx.getArray() : Array.from({ length: vcount }, (_, i) => i);
    const P = pos.getArray();
    // weld by position for topology (UV seams split verts but are not holes)
    const key = (i) => `${P[i * 3].toFixed(5)},${P[i * 3 + 1].toFixed(5)},${P[i * 3 + 2].toFixed(5)}`;
    const weld = new Map(); const wid = new Int32Array(vcount);
    for (let i = 0; i < vcount; i++) { const k = key(i); if (!weld.has(k)) weld.set(k, weld.size); wid[i] = weld.get(k); }
    const edges = new Map(); let degen = 0;
    for (let t = 0; t < ia.length; t += 3) {
      const a = wid[ia[t]], b = wid[ia[t + 1]], c = wid[ia[t + 2]];
      if (a === b || b === c || a === c) { degen++; continue; }
      for (const [u, v] of [[a, b], [b, c], [c, a]]) { const k = u < v ? u + '_' + v : v + '_' + u; edges.set(k, (edges.get(k) || 0) + 1); }
    }
    let boundary = 0, nonManifold = 0; edges.forEach((n) => { if (n === 1) boundary++; else if (n > 2) nonManifold++; });
    return {
      mode: p.getMode(), vertices: vcount, triangles: tcount, uniquePositions: weld.size, splitRatio: +(vcount / weld.size).toFixed(2),
      indexType: idx ? idx.getComponentType() : null, material: p.getMaterial()?.getName() ?? null,
      attributes: attrs, degenerateTris: degen, boundaryEdges: boundary, nonManifoldEdges: nonManifold,
      targets: p.listTargets().length,
    };
  }),
}));
out.totals = { vertices: totV, triangles: totT, meshes: root.listMeshes().length, primitives: root.listMeshes().reduce((n, m) => n + m.listPrimitives().length, 0), materials: root.listMaterials().length, textures: root.listTextures().length, animations: root.listAnimations().length, skins: root.listSkins().length };

// materials
out.materials = root.listMaterials().map((m) => {
  const tex = (t, info) => t ? { name: t.getName() || t.getURI(), mime: t.getMimeType(), size: t.getSize(), bytes: t.getImage()?.byteLength, texCoord: info?.getTexCoord() } : null;
  const ext = {}; m.listExtensions().forEach((e) => { ext[e.extensionName] = true; });
  return {
    name: m.getName(), alphaMode: m.getAlphaMode(), doubleSided: m.getDoubleSided(),
    baseColorFactor: m.getBaseColorFactor().map((v) => +v.toFixed(4)), metallic: m.getMetallicFactor(), roughness: +m.getRoughnessFactor().toFixed(4),
    emissive: m.getEmissiveFactor(),
    baseColorTexture: tex(m.getBaseColorTexture(), m.getBaseColorTextureInfo()),
    metallicRoughnessTexture: tex(m.getMetallicRoughnessTexture(), m.getMetallicRoughnessTextureInfo()),
    normalTexture: tex(m.getNormalTexture(), m.getNormalTextureInfo()),
    occlusionTexture: tex(m.getOcclusionTexture(), m.getOcclusionTextureInfo()),
    emissiveTexture: tex(m.getEmissiveTexture(), m.getEmissiveTextureInfo()),
    extensions: Object.keys(ext),
  };
});
out.textures = root.listTextures().map((t) => ({ name: t.getName() || t.getURI(), mime: t.getMimeType(), size: t.getSize(), bytes: t.getImage()?.byteLength }));

console.log(JSON.stringify(out, null, 1));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(out, null, 1));
