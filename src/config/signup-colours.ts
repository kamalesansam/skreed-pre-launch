// Section 5's liquid colours (docs/specs/section-5-liquid.md 3, "The colours"): a follow's shades as the catalog's
// hexes, one per quarter of worth in pouring order, every band exactly one catalog shade (A2). Read at build by
// Signup.astro, which writes each follow link's list into the markup (data-colours) for the island's jar chunk to read,
// so the 240-shade table never ships in a client chunk; the unit test reads it under Node. config/signup.ts carries the
// ids; this module alone joins them to SHADES.
import { SHADES } from './shades.gen.ts';

/** the liquid's colours of a follow's shades: the table's hexes by id, in the config's order (an unknown id fails the build) */
export const liquidColours = (ids: readonly string[]): readonly string[] => ids.map((id) => {
  const s = SHADES.find((x) => x.id === id);
  if (!s) throw new Error(`signup-colours: ${id} is no catalog shade`);
  return s.hex;
});
