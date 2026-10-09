// The "{size}" of "Show in 3D, {size} MB" (docs/specs/family-page.md 3): the island's JavaScript as served plus both
// LODs, one decimal. The model bytes come from the intake's manifest; the island's compressed JavaScript cannot be known
// while the page renders, so it is this measured constant, and scripts/case-model/budget.mjs fails the check when the
// built chunks would round to a different figure (re-measure, then update the constant).
export const ISLAND_JS_BYTES = 153_700;   // gzip: boot 1.3 KB, preload helper 0.9 KB, island 25.7 KB, three core 125.8 KB (2026-10-09, budget.mjs)
export function size3dMb(bytes: { lod0: number; lod1: number }, islandJs = ISLAND_JS_BYTES): string {
  return ((islandJs + bytes.lod0 + bytes.lod1) / 1e6).toFixed(1);
}
