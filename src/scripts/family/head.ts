// The head script's configuration (FamilyHeadFirst.astro prepends it to head.inline.js). One value per build, the same
// on all ten pages, so the script's bytes and its CSP hash are identical across families.
import { GATE } from '../../config/hero.ts';
import { FAMILIES } from './data.ts';

export function headCfg(has3d: boolean) {
  return { slugs: FAMILIES.map((f) => f.slug), has3d, reducedTier: GATE.reducedTier, minMemory: GATE.minMemory, slowTypes: GATE.slowTypes };
}
