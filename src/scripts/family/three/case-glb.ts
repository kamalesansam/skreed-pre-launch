// The supplier model path (docs/specs/case-model-class.md 3, 4 and amendments 1 to 3): the manifest written by the
// intake (src/data/case-model.json, imported at build, never fetched), our own fetch with a 20 s timeout, GLTFLoader with
// meshoptimizer's pure-JS reference decoder (no WebAssembly, so the site CSP holds), the parts by the manifest's names,
// one normalisation for both LODs. LOD1 loads first; LOD0 only when the stage asks for it after a high-tier verdict.
import { Quaternion, type BufferGeometry, type Material, type Mesh, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/meshopt-decoder-reference.js';
import { findParts, normalising, withBase, type CaseAsset, type CasePart, type PartMap, type RawPart } from './case-asset.ts';
import { ModelError, fetchModel } from './model-fetch.ts';

export interface CaseManifest {
  source: 'supplier' | 'standin';
  lod0: string; lod1: string;
  sha256: { lod0: string; lod1: string };
  orient: [number, number, number, number];
  sizeMm: [number, number, number];
  parts: { body: PartMapEntry; accent?: PartMapEntry; logo?: PartMapEntry };
  triangles: { lod0: number; lod1: number };
  bytes: { lod0: number; lod1: number };
}
interface PartMapEntry { node: string; material: string; followsShade: boolean; tint?: number }

const partMap = (m: CaseManifest): PartMap => ({
  body: m.parts.body,
  ...(m.parts.accent ? { accent: m.parts.accent } : {}),
  ...(m.parts.logo ? { logo: m.parts.logo } : {}),
});

/** Parses one LOD into raw parts. The loaded scene is never added anywhere; its materials are disposed. */
async function parseLod(buf: ArrayBuffer, m: CaseManifest): Promise<RawPart[]> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let root: Object3D;
  try { root = (await loader.parseAsync(buf, '')).scene; } catch (e) { throw new ModelError('decode', String(e)); }
  const raw = findParts(root, partMap(m));
  const keep = new Set<BufferGeometry>(raw.map((p) => p.geometry));
  const mats = new Set<Material>();
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((x) => mats.add(x));
    if (!keep.has(mesh.geometry)) mesh.geometry.dispose();
  });
  mats.forEach((x) => x.dispose());
  // the page draws its own materials (finish cache, accent token, logo tint), never the file's
  return raw.map((p) => ({ ...p, material: undefined }));
}

/**
 * The supplier model as a CaseAsset: LOD1 now (the row, and the front case until LOD0 arrives), LOD0 on loadDetail().
 * The normalisation comes from LOD1's box and serves both, so the front case changes detail without moving.
 */
export async function loadSupplierAsset(m: CaseManifest, signal?: AbortSignal): Promise<CaseAsset> {
  if (m.source !== 'supplier') throw new Error('the manifest does not name a supplier model');
  const raw1 = await parseLod(await fetchModel(m.lod1, signal), m);
  const n = normalising(raw1, new Quaternion(...m.orient));
  const lod1 = withBase(raw1, n.matrix);
  const lods: [CasePart[], CasePart[]] = [lod1, lod1];
  let detail: 'loaded' | 'deferred' = 'deferred';
  let pending: Promise<CasePart[]> | null = null;
  const owned = new Set<BufferGeometry>(raw1.map((p) => p.geometry));
  let disposed = false;
  const asset: CaseAsset = {
    source: 'supplier',
    lods,
    get detail() { return detail; },
    dims: n.dims,
    sizeMm: m.sizeMm,
    maps: {},
    loadDetail() {
      if (detail === 'loaded') return Promise.resolve(lods[0]);
      pending ??= (async () => {
        const raw0 = await parseLod(await fetchModel(m.lod0, signal), m);
        if (disposed) { raw0.forEach((p) => p.geometry.dispose()); throw new Error('disposed'); }
        raw0.forEach((p) => owned.add(p.geometry));
        lods[0] = withBase(raw0, n.matrix);
        detail = 'loaded';
        return lods[0];
      })();
      pending.catch(() => { pending = null; });
      return pending;
    },
    dispose() {
      disposed = true;
      owned.forEach((g) => g.dispose());
      owned.clear();
    },
  };
  return asset;
}
