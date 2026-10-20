// Section 4's travel between the lands, option B (docs/specs/section-4-world.md 2, "Option B"): the modelled Central
// Park (src/assets/room/park/, its model and lightmap imported by ?url here and nowhere else). A placeholder until the
// option is built: travel.ts reaches it by import() only, so it is its own lazy chunk, and it has no travel yet, so
// every travel between the lands is the 300 ms cross-fade (travel.ts fadeLayers). The option's builder replaces
// createTravel with the real one against travel.ts's Travel contract.
import type { Travel, TravelContext } from './travel.ts';

/** no travel yet: null, so the director plays the cross-fade */
export function createTravel(_ctx: TravelContext): Travel | null { return null; }
