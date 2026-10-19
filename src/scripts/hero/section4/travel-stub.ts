// Section 4's travel stub (docs/specs/section-4-world.md 5, "Build modes"; W9). In a build with Tune off (build,
// build:test) astro.config.mjs resolves the two travel modules that are not PUBLIC_PARK_TRAVEL's pick (travel-depth.ts
// for A, travel-park.ts for B, travel-video.ts for C) to this file, so neither their code nor the ?url assets they import
// (the park's model and lightmap, the clips) enter the module graph or the bundle. Such a build's director only asks for
// the pick (ROOM_PARAMS.parkTravel defaults from it and no Tune panel can change it), so nothing should reach this module;
// it draws nothing, and a director that does reach it finds no travel to create and treats the travel as failed: the
// 300 ms cross-fade (section 5, "The poster path and failures"). The import keeps the real module's types; only the
// bundle sees this file.

/** true only here: the travel option asked for is not in this build */
export const TRAVEL_STUB = true;
