// The "{size}" of "Show in 3D, {size} MB" (docs/specs/family-page.md 3 and 24 D2): the island's JavaScript as served
// plus every model file the 3D path downloads (both LODs of the Tough case and of each case type's own model), one
// decimal. The model bytes come from the intake's manifest; the island's compressed JavaScript cannot be known while the
// page renders, so it is this measured constant, and scripts/case-model/budget.mjs fails the check when the built
// chunks would round to a different figure (re-measure, then update the constant).
export const ISLAND_JS_BYTES = 162_800;   // gzip: every chunk past the page module on the 3D path, the takeover in (2026-11-03, budget.mjs on the production build with the default at 3dabb60 merged in)
type Lods = { lod0: number; lod1: number };
export function size3dMb(bytes: Lods, types: readonly Lods[] = [], islandJs = ISLAND_JS_BYTES): string {
  const models = [bytes, ...types].reduce((s, b) => s + b.lod0 + b.lod1, 0);
  return ((islandJs + models) / 1e6).toFixed(1);
}
