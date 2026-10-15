// The "{size}" of "Show in 3D, {size} MB" (docs/specs/family-page.md 3): the island's JavaScript as served plus every
// model file the 3D path downloads (both LODs of the Tough case and of the second model), one decimal. The model bytes
// come from the intake's manifest; the island's compressed JavaScript cannot be known while the page renders, so it is
// this measured constant, and scripts/case-model/budget.mjs fails the check when the built chunks would round to a
// different figure (re-measure, then update the constant).
export const ISLAND_JS_BYTES = 161_578;   // gzip: boot 1.7 KB, the island chunk 35 KB, three with the GLTF loader 125 KB (2026-10-15, budget.mjs)
export function size3dMb(bytes: { lod0: number; lod1: number }, second?: { lod0: number; lod1: number }, islandJs = ISLAND_JS_BYTES): string {
  return ((islandJs + bytes.lod0 + bytes.lod1 + (second ? second.lod0 + second.lod1 : 0)) / 1e6).toFixed(1);
}
