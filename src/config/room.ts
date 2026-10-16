// Section 4, the entrance and the Skreed universe (docs/specs/section-4.md): every string by id, the hall's measured
// frame, the scroll map in screens, and the tunable parameters (Tune's "Section 4" group, PUBLIC_TUNE builds) with the
// spec's defaults. Plain data, read by Room.astro at build and by the island and the walk script at runtime.

export const ROOM_COPY = Object.freeze({
  aria: 'Section 4: the entrance to the Skreed universe',
  stageAria: 'The entrance. Use the arrow keys to walk to the door.',
  hintTouch: 'Scroll to walk to the door.',
  hintKeys: 'Scroll or use the arrow keys to walk to the door.',
  loading: 'Loading the entrance...',
  still: 'Still loading...',
  enter: 'Enter Skreed universe',
  key: 'E',
  skip: 'Skip',
  roomAria: 'The Skreed universe: our products on pedestals',
  roomHintTouch: 'Scroll to look around. Tap a pedestal to read about it.',
  roomHintKeys: 'Move the pointer to look around. Hover a pedestal, or use the arrow keys, to read about it.',
  stillHallAlt: 'A long grey concrete hall lit by two ceiling strips and a row of floor lights, with a closed dark door at its end.',
  stillRoomAlt: 'A round room whose ten walls are the ten Skreed colour families, with pedestals holding Skreed cases.',
  noscript: 'The entrance needs JavaScript.',
  productsAria: 'Products in the universe',
  standin: 'Shown on a stand-in model until the real one arrives.',
});

/**
 * The hall's frame in scene metres (evidence file section 1; Blender's x along the hall and z up become three's x and y,
 * Blender's y across becomes three's -z). The floor is y = 0, the ceiling 3.99; the west wall at x = -5.95 carries the
 * door, the east wall at +5.93 stands behind the start station.
 */
export const HALL = Object.freeze({
  xWest: -5.95, xEast: 5.93, width: 3.15, height: 3.99,
  panelProud: 0.12,                 // the end panels stand 0.12 m proud of the base walls
  door: { width: 1.6, height: 2.6, depth: 0.18, face: -5.83, handle: [-5.83, 1.1, -0.35] as const },   // face: the panel face the leaves sit behind; handle: the point the prompt anchors to (x, y up, z across)
  start: 5.33,                      // the start station: 0.6 m inside the east wall
  end: -4.63,                       // the door station: 1.2 m short of the door's panel face (-5.83)
  promptFrom: 2.2,                  // the prompt appears this far from the door face (the Roblox default of 10 studs is about 2.8 m)
  transeptX: -2.6,                  // the slot's centre, open to white either side
});

/** The scroll map of the section in screens of its own height (spec section 2, "Scroll map"). */
export const ROOM_SCREENS = Object.freeze({ wipe: 1, walk: 8, station: 1, pan: 2, loop: 1, tail: 1 });
/**
 * The track's height in screens before the universe is entered, and after: a sticky 100svh stage inside an H-screen
 * track is pinned for q 0 to H - 1, so one tail screen keeps the stage pinned through the loop screen and the jump
 * fires while the raw scroll is still inside the document (the spec's section 2, "Scroll map").
 */
export const ROOM_HEIGHT = ROOM_SCREENS.wipe + ROOM_SCREENS.walk + ROOM_SCREENS.station + ROOM_SCREENS.loop + ROOM_SCREENS.tail;
export const ROOM_HEIGHT_ENTERED = ROOM_HEIGHT + ROOM_SCREENS.pan;

/**
 * The tunable parameters (Tune, "Section 4"): the spec's defaults. Numbers only, as HERO_PARAMS, so the panel binds them
 * the same way; the choices are 0 or 1 (or small integers) with their meaning in the comment.
 */
export const ROOM_PARAMS = Object.freeze({
  // the camera
  eye: 0.9,            // metres above the floor (the reference's eye-level shot, 0.908)
  fov: 60,             // vertical field of view on laptops; phones widen it by the hero's portrait rule
  lookYaw: 6,          // degrees of head sway from the pointer (laptops; the hero's own tilt is 6.3 and 2.25)
  lookPitch: 2.5,
  keySpeed: 0.5,       // metres per second while an arrow key is held
  // the look
  exposure: 1.0,       // multiplies the lightmap
  albedo: 0.62,        // the concrete's grey (linear), the same on floor, walls and ceiling
  seams: 0.3,          // how much darker the baked seams read (0 to 1)
  grain: 0.06,         // the concrete's micro grain, as luminance variation
  vignette: 2.0,       // the output pass: the centre's boost (the reference's 2.0)
  corners: 0.85,       // and the corners (0.85)
  bleach: 1.0,         // the bleach-bypass curve's amount
  split: 8,            // the colour split at the corners, device pixels
  noise: 0.01,         // film grain
  // the door and the prompt
  door: 0,             // 0 two leaves, 1 one sliding slab, 2 no door (the seam of light alone)
  seamGlow: 1.0,       // the seam's brightness at the door station
  promptChip: 1,       // 1 shows the key chip on laptops
  // the transition
  handoff: 0,          // the hand-off from the fog: 0 the ice-shard wipe, 1 a cut, 2 a fade
  transitionMs: 2400,
  sweepSpeed: 1.2,     // screens per second
  sweepAngle: 45,      // degrees from horizontal, bottom left to top right
  sweepWidth: 0.12,    // of the screen, per band
  // the universe
  wallsColour: 1,      // 1 the ten family bays in their key shades, 0 Pearl Whisper walls
  standins: 1,         // 1 shows Snap and Armor on the Cobalt model with a note, 0 hides them
  catalogWords: 0,     // 0 the trimmed lines (rule 17), 1 the catalog's own words
  mouseLook: 0,        // 1 lets a drag turn the head on laptops
  productScale: 1.5,   // the products' scale on the pedestals
} as const);

export type RoomParams = { -readonly [K in keyof typeof ROOM_PARAMS]: number };
export type RoomParamKey = keyof typeof ROOM_PARAMS;
export function roomParams(): RoomParams { return { ...ROOM_PARAMS }; }

const DEFAULTS: RoomParams = roomParams();
/** The parameters in use: Tune's live copy when its panel is open (dev and staging), else the defaults. */
export function liveRoomParams(): RoomParams {
  const t = typeof window !== 'undefined' ? window.__skreedTune?.room?.params : undefined;
  return t ?? DEFAULTS;
}

/** What the island hands the walk script every frame (scripts/room/walk.ts): the section's progress and the prompt's anchor. */
export interface RoomFrame {
  /** the section's smoothed progress in screens of its own height */
  q: number;
  /** the camera's place along the hall, metres */
  x: number;
  /** 0 far from the door, 1 at the door station */
  nearDoor: number;
  ready: boolean;
  failed: boolean;
  inView: boolean;
  /** the door's handle in CSS pixels of the canvas, or null when the hall is not drawn */
  prompt: { x: number; y: number } | null;
}
