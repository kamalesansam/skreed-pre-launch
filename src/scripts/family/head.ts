// The head script's configuration (FamilyHeadFirst.astro prepends it to head.inline.js). One value per build, the same
// on all ten pages, so the script's bytes and its CSP hash are identical across families.
import { FAMILIES } from './data.ts';

/** hooks: test and staging builds, where ?mode=grid still asks for swatch grid mode (E-3D-only keeps it out of production) */
export function headCfg(has3d: boolean, hooks: boolean = import.meta.env?.PUBLIC_HERO_HOOKS === '1') {
  return { slugs: FAMILIES.map((f) => f.slug), has3d, hooks };
}
