// Section 5's bead colours (docs/specs/section-5.md 3, "The beads"): a jar's families as the catalog's hexes in catalog
// order, 24 a family, every bead a catalog shade (A2). Read at build by Signup.astro, which writes each slot's list into
// the markup (data-colours) for the island's jar chunk to read, so the 240-shade table never ships in a client chunk;
// the unit test reads it under Node. config/signup.ts carries the families; this module alone joins them to SHADES.
import { SHADES } from './shades.gen.ts';

/** the beads' colours of a set of families: the catalog's hexes in catalog order */
export const beadColours = (families: readonly string[]): readonly string[] => families.flatMap((f) => SHADES.filter((s) => s.family === f).map((s) => s.hex));
