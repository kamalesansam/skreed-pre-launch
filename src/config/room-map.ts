// Section 4's scroll map in screens of the section's own height (docs/specs/section-4-flux.md 5, "The scroll map";
// docs/specs/section-4-no-hall.md 5 since the hall left on 2026-11-02; docs/specs/section-5.md 5 for the end): the
// third wipe 0 to 1 from the fog straight to scene 1, the five scenes from 1 at a step of 0.5 (1, 1.5, 2, 2.5, 3), the
// hold 3 to 3.8, the fourth wipe 3.8 to 4.8 (the cut from scene 5 onto section 5's ground, the first wipe's; since
// 2026-10-26 it replaces the exit seam at the hold's end, and since 2026-11-03 no exit seam runs anywhere: the page ends
// at section 5) and one pinned screen, so the stage unpins as the cut ends and section 5 rises. On its own, apart from
// config/room.ts (the copy, the scenes and their hashed files), because the hero island reads the fourth wipe's span
// statically (hero.ts) and must not carry the rest of that module in its first-view chunk; room.ts re-exports everything here.

export const ROOM_SCREENS = Object.freeze({ wipe: 1, step: 0.5, hold: 0.8, out: 1 });
/** the scenes: five (ROOM_SCENES in config/room.ts has that many; tests/unit/room.test.ts holds the two equal) */
export const SCENE_COUNT = 5;
/** where the scenes start (q 1, the wipe's end): scene 1's position */
export const WORLD_START = ROOM_SCREENS.wipe;
/** scene i's position (the reference's 50 vh a step) */
export const sceneQ = (i: number): number => WORLD_START + ROOM_SCREENS.step * i;
/** the last scene's position: the carousel is in range while the raw q is within 2 px of [WORLD_START, SCENES_END] */
export const SCENES_END = sceneQ(SCENE_COUNT - 1);
/** the fourth wipe's start (section-5.md 2): from here the composite cuts from the section's frame onto section 5's over one screen */
export const WIPE4_START = SCENES_END + ROOM_SCREENS.hold;
/**
 * The track's height in screens: a sticky 100svh stage inside an H-screen track is pinned for q 0 to H - 1, so one screen
 * beyond the cut keeps the stage pinned through it, and the stage unpins exactly as the cut ends, section 5 rising from
 * the bottom edge after it. src/styles/room.css carries the literal (580svh) and tests/unit/room.test.ts reads it back.
 */
export const ROOM_HEIGHT = WIPE4_START + ROOM_SCREENS.out + 1;
