// Section 4, the entrance and the Skreed universe (docs/specs/section-4.md): every string by id, the hall's measured
// frame, the scroll map in screens, and the tunable parameters (Tune's "Section 4" group, PUBLIC_TUNE builds) with the
// spec's defaults. Plain data, read by Room.astro at build and by the island and the walk script at runtime.

export const ROOM_COPY = Object.freeze({
  aria: 'Section 4: the entrance to the Skreed universe',
  stageAria: 'The entrance. Use the arrow keys to walk to the door.',
  hintTouch: 'Scroll to walk to the door.',
  hintKeys: 'Scroll or use the arrow keys to walk to the door.',
  loading: 'Loading the entrance...',
  loadingRoom: 'Loading...',
  still: 'Still loading...',
  enter: 'Enter Skreed universe',
  key: 'E',
  skip: 'Skip',
  roomAria: 'The Skreed universe: our products on pedestals',
  roomHintTouch: 'Scroll to look around. Tap a pedestal to read about it.',
  roomHintKeys: 'Scroll to look around. Hover a pedestal, or use the arrow keys, to read about it.',
  stillHallAlt: 'A long grey concrete hall under five cool ceiling lights, with a row of warm floor lights along each wall and a closed dark door at its end.',
  stillRoomAlt: 'A round room whose ten walls are the ten Skreed colour families, with pedestals holding Skreed cases.',
  noscript: 'The entrance needs JavaScript.',
  productsAria: 'Products in the universe',
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
  end: -3.83,                       // the door station: 2.0 m short of the door's panel face (-5.83), so a phone sees the whole door
  promptFrom: 2.8,                  // the prompt appears this far from the door face (the Roblox default, 10 studs at 0.28 m)
  transeptX: -2.6,                  // the slot's centre, open to white either side
});

/**
 * The transition's beats as fractions of its length (spec section 2 "The transition", 2.4 s by default): the leaves
 * swing 0 to 0.375, the frame lifts to white 0.125 to 0.417, the sweep runs 0.417 to 0.79, the universe fades in 0.67
 * to 1 while the bands clear by 0.92.
 */
export const TRANSITION = Object.freeze({ swing: [0, 0.375], whiteIn: [0.125, 0.417], sweep: [0.417, 0.79], toIn: [0.67, 1.0], skipFrom: 0.17 } as const);

/** The universe's ten bays, in catalog order clockwise from the doorway: the families' key shades, the gems' colours (shades.gen.ts BLOCK_SHADES). */
export const ROOM_BAYS: readonly { readonly family: string; readonly name: string; readonly shade: string; readonly hex: string }[] = Object.freeze([
  { family: 'Frosty White', name: 'Snow', shade: 'frosty-white-07', hex: '#f0f4f5' },
  { family: 'Blissful Blue', name: 'Sky', shade: 'blissful-blue-08', hex: '#08bcf4' },
  { family: 'Playful Pink', name: 'Rouge', shade: 'playful-pink-14', hex: '#f2638f' },
  { family: 'Vivid Violet', name: 'Amethyst', shade: 'vivid-violet-07', hex: '#8554d1' },
  { family: 'Mellow Yellow', name: 'Sunbeam', shade: 'mellow-yellow-01', hex: '#fff164' },
  { family: 'Basic Brown', name: 'Cinnamon', shade: 'basic-brown-07', hex: '#ba7237' },
  { family: 'Blushing Coral', name: 'Mango', shade: 'blushing-coral-04', hex: '#ff9f40' },
  { family: 'Stormy Grey', name: 'Silver', shade: 'stormy-grey-05', hex: '#acacac' },
  { family: 'Go Green', name: 'Lawn', shade: 'go-green-12', hex: '#4aa325' },
  { family: 'Roaring Red', name: 'Crimson', shade: 'roaring-red-07', hex: '#d20000' },
]);

/** relative luminance of an sRGB hex (WCAG 2.x) */
export function relLuminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** the sweep's ten bands, brightest first and darkest last, so its luminance falls once (spec 2 "The transition", WCAG 2.3.1) */
export const SWEEP_BANDS: readonly { readonly name: string; readonly hex: string }[] = Object.freeze([...ROOM_BAYS].sort((a, b) => relLuminance(b.hex) - relLuminance(a.hex)).map((b) => ({ name: b.name, hex: b.hex })));

/**
 * The universe's geometry (spec section 2 "The universe"; scripts/room/universe.py bakes the same numbers): metres, in
 * the island's frame (y up). The camera stands in the doorway at x = doorX looking +x; yaw turns it toward -z (left) and
 * +z (right). The pedestals stand on an arc arcRadius from the camera, arcSpan degrees either side, one per visible product.
 */
export const UNIVERSE = Object.freeze({ radius: 5.5, height: 3.99, doorX: -5.0, eye: 1.0, arcRadius: 3.2, arcSpan: 60, panDeg: 60, pedestals: 4, pedestalRadius: 0.25, labelAbove: 0.3, hoverLift: 0.02 });
/** Pedestal i of the six: its angle from the view axis (degrees, left negative) and its place. */
export function pedestalAt(i: number): { deg: number; x: number; z: number; height: number } {
  const deg = -UNIVERSE.arcSpan + (2 * UNIVERSE.arcSpan * i) / (UNIVERSE.pedestals - 1), a = (deg * Math.PI) / 180;
  return { deg, x: UNIVERSE.doorX + UNIVERSE.arcRadius * Math.cos(a), z: UNIVERSE.arcRadius * Math.sin(a), height: PEDESTAL_HEIGHTS[i] ?? 0.7 };
}
export const PEDESTAL_HEIGHTS: readonly number[] = Object.freeze([0.6, 0.9, 1.0, 0.8]);

export interface RoomProduct {
  readonly id: string;
  readonly name: string;
  /** the label's line with rule 17's words dropped, and the catalog's own words (Tune: catalogWords) */
  readonly line: string;
  readonly lineCatalog: string;
  /** what stands on the pedestal: the family pages' Cobalt case, or one of Sam's models of 2026-10-16 (src/data/room-products.json) */
  readonly model: 'cobalt' | 'wallet' | 'airpods' | 'lenskin';
  readonly shade: string;
  readonly hex: string;
  readonly finish: 'matte' | 'gloss' | 'metallic';
  /** the pedestal's height, metres */
  readonly height: number;
  /** the display scale against the case's (the products are shown at productScale x this, so the small ones read at about the case's size) */
  readonly exhibit: number;
}

/**
 * The pedestals, left to right (Sam, 2026-10-16: "this is all the products that are supposed to be phone case, airpods
 * case, magsafe wallet, and lenskin"), in the catalog's order (pages 15 to 19); the lines are the catalog's own sentences.
 */
export const ROOM_PRODUCTS: readonly RoomProduct[] = Object.freeze([
  { id: 'case', name: 'Phone case', line: 'Enhanced dual-layered protection with a tough Polycarbonate exterior and a flexible TPU core. Available in 240 shades. Matte or gloss.', lineCatalog: 'Enhanced dual-layered protection with a tough Polycarbonate exterior and a flexible TPU core. The perfect balance of style, strength, and functionality. Available in 240 shades. Finish: Matte, Gloss.', model: 'cobalt', shade: 'blissful-blue-11', hex: '#1040ca', finish: 'matte', height: 0.6, exhibit: 1 },
  { id: 'wallet', name: 'MagSafe wallet', line: 'Sleek and secure MagSafe-compatible phone wallet for convenient card storage without the bulk. Available in 240 shades. Matte, gloss, metallic matte or metallic gloss.', lineCatalog: 'Sleek and secure MagSafe-compatible phone wallet for convenient card storage without the bulk. Designed to blend seamlessly with your phone case for a clean and minimal look. Available in 240 shades. Finish: Matte, Gloss, Metallic Matte, Metallic Gloss.', model: 'wallet', shade: 'basic-brown-04', hex: '#c6a884', finish: 'matte', height: 0.9, exhibit: 1.55 },
  { id: 'lenskin', name: 'Lenskin', line: "Sleek metal accent for the latest iPhone's camera lens area, designed to personalize your look. Available in a range of contrasting solid shades and patterns. Matte, metallic matte or metallic gloss.", lineCatalog: "Sleek metal accent designed to elevate the latest iPhone's camera lens area and personalize your look. Available in a range of contrasting solid shades and patterns. Finish: Matte, Metallic Matte, Metallic Gloss.", model: 'lenskin', shade: 'go-green-09', hex: '#96a880', finish: 'metallic', height: 1.0, exhibit: 2.2 },
  { id: 'airpods', name: 'AirPods case', line: 'Durable polycarbonate case with a sleek profile and precise cut-outs for charging. Includes a carabiner ring for easy attachment to bags. Available in 240 shades. Matte or gloss.', lineCatalog: 'Durable polycarbonate case with a sleek profile and precise cut-outs for seamless charging and functionality. Includes a convenient carabiner ring for easy attachment to bags. Available in 240 shades. Finish: Matte, Gloss.', model: 'airpods', shade: 'go-green-09', hex: '#96a880', finish: 'gloss', height: 0.8, exhibit: 1.75 },
]);

/**
 * The render colours that are not tokens or shades (E-S4-light, spec section 10; read back by tests/unit/room.test.ts), as
 * the numbers each scene writes. The hall's are display values (its target is read as sRGB), the universe's linear.
 */
export const RENDER_COLOURS = Object.freeze({
  leaf: [0x38 / 255, 0x3f / 255, 0x43 / 255] as const,          // the door's leaves: Urban Slate
  fixture: [0.966, 1.0, 1.0] as const,                           // the ceiling fixtures, cool white (about 7400 K), over 1 so they clip
  floorLight: [0.9, 0.8125, 0.6375] as const,                    // the floor lights, warm (about 4500 K)
  hallClear: [1, 1, 1] as const,                                 // the transept's open ends and the clear colour
  roomCeiling: [0.92, 0.92, 0.92] as const,                      // the universe's plaster around the lamp
  roomLamp: [1.15, 1.15, 1.15] as const,                         // the universe's ceiling disc, over 1 so it clips white
});

/** The scroll map of the section in screens of its own height (spec section 2, "Scroll map"). */
export const ROOM_SCREENS = Object.freeze({ wipe: 1, walk: 8, station: 1, pan: 2, loop: 1, tail: 1 });
/** where the pan starts once entered (q 10): the station's end; the loop screen follows the station, or the pan */
export const PAN_START = ROOM_SCREENS.wipe + ROOM_SCREENS.walk + ROOM_SCREENS.station;
export const loopStart = (entered: boolean): number => PAN_START + (entered ? ROOM_SCREENS.pan : 0);
/**
 * The track's height in screens before the universe is entered, and after: a sticky 100svh stage inside an H-screen
 * track is pinned for q 0 to H - 1, so one screen beyond the tail keeps the stage pinned through the loop screen and the
 * tail, and the jump fires while the raw scroll is still inside the document (the spec's section 2, "Scroll map":
 * 1300svh and 1500svh; src/styles/room.css carries the literals, tests/unit/room.test.ts reads them back).
 */
export const ROOM_HEIGHT = ROOM_SCREENS.wipe + ROOM_SCREENS.walk + ROOM_SCREENS.station + ROOM_SCREENS.loop + ROOM_SCREENS.tail + 1;
export const ROOM_HEIGHT_ENTERED = ROOM_HEIGHT + ROOM_SCREENS.pan;
/** the q of pedestal i, where the pan centres it (yaw -60 to +60 over the pan's two screens) */
export const pedestalQ = (i: number): number => PAN_START + ((pedestalAt(i).deg + UNIVERSE.arcSpan) / (2 * UNIVERSE.arcSpan)) * ROOM_SCREENS.pan;

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
  noise: 0.01,         // film grain (static)
  gloss: 1.0,          // the floor's reflection of the hall (0 none, 1 the spec's fifth face-on to two fifths grazing)
  bloom: 0.35,         // laptops: the blurred copy screened over the frame (spec 2; none on touch)
  // the door and the prompt
  stationDist: 2.0,    // the door station, metres short of the door's panel face (the prompt shows from 2.8 m)
  door: 0,             // 0 two leaves, 1 one sliding slab, 2 no door (the seam of light alone)
  seamGlow: 1.0,       // the seam's brightness at the door station
  promptChip: 1,       // 1 shows the key chip on laptops
  // the transition
  handoff: 0,          // the hand-off from the fog: 0 the ice-shard wipe, 1 a cut, 2 a fade
  transitionMs: 2400,
  sweepSpeed: 2.4,     // screens per second (the ten bands travel 2.2 screens in 0.9 s at the spec's length)
  sweepAngle: 45,      // degrees from horizontal, bottom left to top right
  sweepWidth: 0.12,    // of the screen, per band
  // the universe
  wallsColour: 1,      // 1 the ten family bays in their key shades, 0 Pearl Whisper walls
  catalogWords: 0,     // 0 the trimmed lines (rule 17), 1 the catalog's own words
  mouseLook: 0,        // 1 lets a drag turn the head on laptops
  productScale: 3.2,   // the products' scale on the pedestals, times each product's exhibit (the spec's 1.5 read too small on a phone at 3.2 m)
  roomPitch: -6,       // the universe's view tilted down, degrees (less of the ceiling disc, the products nearer the centre)
  roomExposure: 1.0,   // multiplies the room's lightmap
  roomVignette: 1.3,   // the room's output pass: the centre's boost
  roomCorners: 0.9,    // and the corners
  roomBleach: 0.3,     // the bleach-bypass amount in the room
  productLight: 0.8,   // the products' environment light (three's RoomEnvironment through a PMREM)
  labelFloat: 1,       // laptops: 1 the label floats over the product, 0 the bottom panel as on phones
  // the loop
  lapReset: 1,         // after the jump to the top: 1 the next lap walks the hall again, 0 the universe stays entered
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

export type RoomState = 'hall' | 'entering' | 'universe';

/** What the island hands the walk script every frame (scripts/room/walk.ts): the section's progress and the anchors. */
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
  state: RoomState;
  /** the universe's assets are in (the transition can start) */
  universeReady: boolean;
  /** the transition's progress, 0 to 1, while entering */
  transition: number;
  /** the universe's yaw in degrees, -60 to 60 */
  yaw: number;
  /** the pedestal the pan has centred (by the smoothed q), the hovered one on laptops, -1 before the universe */
  active: number;
  hover: number;
  /** each visible product's label anchor (0.3 m above it) in CSS pixels, or null when off screen */
  labels: ({ x: number; y: number } | null)[];
  /** the fourth wipe's progress over the loop screen, 0 off it */
  loop: number;
  /** true on the frame the page jumped back to the top */
  jumped: boolean;
}

/** The island's side of the bridge (window.__skreedRoom): what the walk script can ask of the scene. */
export interface RoomIsland {
  /** scrolls the page to the top of q (instant) and snaps the section's followers there */
  snap(q: number, smooth?: boolean): void;
  /** starts the transition; false while the universe's assets are still loading */
  enter(): boolean;
  skip(): void;
  /** the pedestal under a CSS pixel of the canvas, or -1 */
  pick(x: number, y: number): number;
  setHover(i: number): void;
}
