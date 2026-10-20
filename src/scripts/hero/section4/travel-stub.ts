// Section 4's travel stub (docs/specs/section-4-world.md 5, "Build modes"; W9). In a build with Tune off (build,
// build:test) astro.config.mjs resolves the two travel modules that are not PUBLIC_PARK_TRAVEL's pick (travel-depth.ts
// for A, travel-park.ts for B, travel-video.ts for C) to this file, so neither their code nor the ?url assets they import
// (the park's model and lightmap, the clips) enter the module graph or the bundle. Such a build's director is to ask
// only for the pick: ROOM_PARAMS.parkTravel will default from import.meta.env.PUBLIC_PARK_TRAVEL (src/config/room.ts,
// the director's change; astro.config.mjs sets the variable to A when it is unset), and no Tune panel can change it
// there. So nothing should reach this module; it draws nothing, and a director that does reach it finds no travel to
// create and treats the travel as failed: the 300 ms cross-fade (section 5, "The poster path and failures"). The import
// keeps the real module's types; only the bundle sees this file.
//
// The hand-off, two rules for every module that reaches a travel option:
// 1. Only import() reaches a travel module, never a static named import from shared code. This file exports TRAVEL_STUB
//    and nothing else, so import { createDepthTravel } from './travel-depth.ts' in world.ts or the director stops the
//    build of every pick that stubs it ([MISSING_EXPORT], seen with world.ts and pick B). Code that every option runs, such
//    as land 1's push through its depth map (spec 2), lives outside the travel modules, in world.ts or a module of its own,
//    never in travel-depth.ts.
// 2. Every park or clip ?url import sits inside its travel module (the park's in travel-park.ts, the clips' in
//    travel-video.ts), never in the director's prefetch, world.ts or a config: only there does the stub keep the file out
//    of a build that did not pick it. Anywhere else it ships in every build, and the post-build guard
//    (scripts/room/guards.mjs --post-build) fails a production build of the wrong pick on it.

/** true only here: the travel option asked for is not in this build */
export const TRAVEL_STUB = true;
