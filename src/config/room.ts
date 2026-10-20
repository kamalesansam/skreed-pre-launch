// Section 4, the entrance and the Skreed world (docs/specs/section-4.md for the hall, docs/specs/section-4-world.md for
// everything after the door): every string by id, the hall's measured frame, the lands Sam has approved (the encoded
// files present in src/assets/room/lands/), the scroll map in screens, and the tunable parameters (Tune's "Section 4"
// group, PUBLIC_TUNE builds) with the spec's defaults. Plain data, read by Room.astro at build and by the island and the
// walk script at runtime; the unit tests import it under Node, where import.meta.glob and import.meta.env do not exist.

/**
 * The copy (section-4-world.md 3, "Copy"), in sentence case: the decode prints it in capitals, as section 2 and the quiz
 * do, and the accessible names keep the sentence case through the decode's visually hidden copy. The lands' own lines
 * (the family line and the alt, by catalog order) follow ROOM_PRODUCTS; landLive and count are patterns for fill().
 */
export const ROOM_COPY = Object.freeze({
  aria: 'Section 4: the entrance to the Skreed world',
  stageAria: 'The entrance. Use the arrow keys to walk to the door.',
  worldAria: 'The Skreed world. Use Down and Up to travel.',
  hintTouch: 'Scroll to walk to the door.',
  hintKeys: 'Scroll or use the arrow keys to walk to the door.',
  loading: 'Loading the entrance...',
  still: 'Still loading...',
  enter: 'Enter Skreed universe',
  key: '[E]',
  loadingRoom: 'Loading...',
  skip: 'Skip',
  landHintTouch: 'Scroll to travel',
  landHintKeys: 'Scroll or press Down to travel',
  loadingLand: 'Loading...',
  next: 'Next land',
  prev: 'Previous land',
  landsTitle: 'The Skreed world',
  landsAria: 'Our products, out in the park',
  landLive: '{n} of {N}. {name}. {family}.',
  count: '{n} / {N}',
  clipBlocked: 'Clip blocked',
  stillHallAlt: 'A long grey concrete hall under five cool ceiling lights, with a row of warm floor lights along each wall and a closed dark door at its end.',
  noscript: 'The entrance needs JavaScript. The lands are below.',
});

/** a copy pattern with its {fields} filled */
export const fill = (pattern: string, v: Record<string, string | number>): string => pattern.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));

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
 * The press (section-4-world.md 2, "The press"): the leaves swing for 0.9 s (cubic ease-out), the camera glides 1.6 m
 * into the doorway from 0.3 s over 0.9 s (cubic ease-in-out), and the hall freezes once the glide ends at 1.2 s, its last
 * frame the bubble's outside from then on.
 */
export const PRESS = Object.freeze({ swing: 0.9, glideFrom: 0.3, glide: 0.9, dolly: 1.6, freeze: 1.2 });

/** The ten families' key shades by id, in catalog order (the gems' colours, shades.gen.ts BLOCK_SHADES): the rings, the lattice, the cloud and the garden's beds carry them. */
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

export interface RoomProduct {
  readonly id: 'case' | 'wallet' | 'lenskin' | 'airpods';
  readonly name: string;
  /** the catalog's sentence with rule 17's words dropped, and the catalog's own words */
  readonly line: string;
  readonly lineCatalog: string;
  /** the accessory's own shade by id (the case's: the family pages' Cobalt model, which no land shows) and its finish */
  readonly shade: string;
  readonly hex: string;
  readonly finish: 'matte' | 'gloss' | 'metallic';
}

/**
 * Sam's four products (2026-10-16) in the catalog's order (pages 15 to 19), one land each (W7); the lines are the
 * catalog's own sentences. The accessories' shades are the ones the lands render (spec 3: "The shade rendered is the
 * shade named"): the wallet in Desert, the Lenskin in Sage (Sam, 2026-10-20) and the AirPods case in Sage.
 * scripts/room/lands.py reads each entry's id, shade, hex and finish from this block, one entry to a line.
 */
export const ROOM_PRODUCTS: readonly RoomProduct[] = Object.freeze([
  { id: 'case', name: 'Phone case', line: 'Enhanced dual-layered protection with a tough Polycarbonate exterior and a flexible TPU core. Available in 240 shades. Matte or gloss.', lineCatalog: 'Enhanced dual-layered protection with a tough Polycarbonate exterior and a flexible TPU core. The perfect balance of style, strength, and functionality. Available in 240 shades. Finish: Matte, Gloss.', shade: 'blissful-blue-11', hex: '#1040ca', finish: 'matte' },
  { id: 'wallet', name: 'MagSafe wallet', line: 'Sleek and secure MagSafe-compatible phone wallet for convenient card storage without the bulk. Available in 240 shades. Matte, gloss, metallic matte or metallic gloss.', lineCatalog: 'Sleek and secure MagSafe-compatible phone wallet for convenient card storage without the bulk. Designed to blend seamlessly with your phone case for a clean and minimal look. Available in 240 shades. Finish: Matte, Gloss, Metallic Matte, Metallic Gloss.', shade: 'basic-brown-04', hex: '#c6a884', finish: 'matte' },
  { id: 'lenskin', name: 'Lenskin', line: "Sleek metal accent for the latest iPhone's camera lens area, designed to personalize your look. Available in a range of contrasting solid shades and patterns. Matte, metallic matte or metallic gloss.", lineCatalog: "Sleek metal accent designed to elevate the latest iPhone's camera lens area and personalize your look. Available in a range of contrasting solid shades and patterns. Finish: Matte, Metallic Matte, Metallic Gloss.", shade: 'go-green-09', hex: '#96a880', finish: 'metallic' },
  { id: 'airpods', name: 'AirPods case', line: 'Durable polycarbonate case with a sleek profile and precise cut-outs for charging. Includes a carabiner ring for easy attachment to bags. Available in 240 shades. Matte or gloss.', lineCatalog: 'Durable polycarbonate case with a sleek profile and precise cut-outs for seamless charging and functionality. Includes a convenient carabiner ring for easy attachment to bags. Available in 240 shades. Finish: Matte, Gloss.', shade: 'go-green-09', hex: '#96a880', finish: 'gloss' },
]);

/**
 * Each land's own copy and capture (spec 3, "The lands"; one per product, in ROOM_PRODUCTS' order). family: the line
 * that names the pictured case by its family and the accessory by its shade (the listing photos are family photos, so
 * never a single shade of the case); alt: the scene and the products by name and colour, nothing more (never the park's
 * name, never anything about the person). fov: the picture's vertical field of view in degrees and near: its near
 * distance in scene units, both shared with option B's park (src/assets/room/park/park.json's poses, by eye); far: the
 * depth map's far distance, so a pixel of disparity d sits at 1 / mix(1 / far, 1 / near, d). tone: the logotype over the
 * land (Urban Slate unless the land says Pearl).
 */
export const LAND_COPY: Readonly<Record<RoomProduct['id'], { family: string; alt: string; fov: number; near: number; far: number; tone: 'slate' | 'pearl' }>> = Object.freeze({
  case: { family: 'A Mellow Yellow case', alt: 'A person under tall elms in a sunlit park holds a phone in a Mellow Yellow case.', fov: 32, near: 1.6, far: 30, tone: 'slate' },
  wallet: { family: 'Desert, on a Blissful Blue case', alt: 'A person in the shade of a stone arcade holds a phone in a Blissful Blue case with a Desert MagSafe wallet on its back.', fov: 34, near: 1.6, far: 30, tone: 'slate' },
  lenskin: { family: 'Sage, on a Go Green case', alt: 'A person on a wide lawn under a soft grey sky holds a phone in a Go Green case with a Sage Lenskin around its camera.', fov: 32, near: 1.6, far: 30, tone: 'slate' },
  airpods: { family: 'Sage, beside a Vivid Violet case', alt: 'A person on a bridge over a lake holds a phone in a Vivid Violet case and an open Sage AirPods case with its earbuds inside.', fov: 32, near: 1.6, far: 30, tone: 'slate' },
});

/** the picture classes (spec 3, "The crops"): the portrait on phones, the wide on laptops, at their encoded sizes */
export const LAND_SIZE = Object.freeze({ portrait: { width: 720, height: 1280 }, wide: { width: 1920, height: 1200 } } as const);
export type LandClass = keyof typeof LAND_SIZE;
export interface LandFiles { avif: string; webp: string }

export interface RoomLand {
  readonly id: RoomProduct['id'];
  /** 0 to N - 1, its place among the approved lands */
  readonly i: number;
  readonly name: string;
  readonly family: string;
  readonly line: string;
  readonly alt: string;
  readonly fov: number;
  readonly near: number;
  readonly far: number;
  readonly tone: 'slate' | 'pearl';
  /** the picture per class, AVIF and WebP (the lands pipeline's land-<id>-portrait.* and land-<id>-wide.*) */
  readonly pics: Readonly<Record<LandClass, LandFiles>>;
  /** option A's depth map per class (land-<id>-<class>-depth.*), quarter size, single channel; null where it is not encoded */
  readonly depth: Readonly<Record<LandClass, LandFiles | null>>;
}

/**
 * The lands from a listing of the encoded files (URL by file name): every product, in catalog order, whose four picture
 * files exist (both classes in AVIF and WebP). A land Sam has not approved has no files in src/assets/room/lands/ and is
 * not among them (CHECKLIST F2); the depth maps are taken where both formats are there.
 */
export function landsFrom(files: Readonly<Record<string, string>>): readonly RoomLand[] {
  const url = (name: string) => Object.entries(files).find(([k]) => k.endsWith(`/${name}`) || k === name)?.[1];
  const pair = (stem: string): LandFiles | null => { const avif = url(`${stem}.avif`), webp = url(`${stem}.webp`); return avif && webp ? { avif, webp } : null; };
  const out: RoomLand[] = [];
  for (const p of ROOM_PRODUCTS) {
    const portrait = pair(`land-${p.id}-portrait`), wide = pair(`land-${p.id}-wide`);
    if (!portrait || !wide) continue;
    const c = LAND_COPY[p.id];
    out.push(Object.freeze({ id: p.id, i: out.length, name: p.name, family: c.family, line: p.line, alt: c.alt, fov: c.fov, near: c.near, far: c.far, tone: c.tone,
      pics: Object.freeze({ portrait, wide }), depth: Object.freeze({ portrait: pair(`land-${p.id}-portrait-depth`), wide: pair(`land-${p.id}-wide-depth`) }) }));
  }
  return Object.freeze(out);
}

// the encoded files as the build emits them (Vite's glob, each a hashed URL); under Node (the unit tests) there is no
// glob, and the lands are none
let LAND_FILES: Record<string, string> = {};
try { LAND_FILES = import.meta.glob<string>('../assets/room/lands/land-*.{avif,webp}', { eager: true, query: '?url', import: 'default' }); } catch { LAND_FILES = {}; }
/** The approved lands, N of them (spec 5: production ships with N = 0 until Sam has approved land 1). */
export const ROOM_LANDS: readonly RoomLand[] = landsFrom(LAND_FILES);

/**
 * The render colours that are not tokens or shades (E-S4-light, spec section 10; read back by tests/unit/room.test.ts), as
 * the numbers each scene writes: the hall's are display values (its target is read as sRGB).
 */
export const RENDER_COLOURS = Object.freeze({
  leaf: [0x38 / 255, 0x3f / 255, 0x43 / 255] as const,          // the door's leaves: Urban Slate
  fixture: [0.966, 1.0, 1.0] as const,                           // the ceiling fixtures, cool white (about 7400 K), over 1 so they clip
  floorLight: [0.9, 0.8125, 0.6375] as const,                    // the floor lights, warm (about 4500 K)
  hallClear: [1, 1, 1] as const,                                 // the transept's open ends and the clear colour, in the hall
  hallEntering: [0x38 / 255, 0x3f / 255, 0x43 / 255] as const,   // the clear colour from the press: Urban Slate, so the doorway reads dark
});

/**
 * The scroll map of the section in screens of its own height (section-4.md 2 for the hall; section-4-world.md 5, "The
 * scroll map", once entered). In the hall: the third wipe 0 to 1, the walk 1 to 9, the station 9 to 10, the loop screen
 * 10 to 11, the tail 11 to 12 and one more screen. Once entered with N lands: land i's station at 10 + 2i, each held
 * 0.4 screens either side, the loop screen 9 + 2N to 10 + 2N, then the tail and one more screen.
 */
export const ROOM_SCREENS = Object.freeze({ wipe: 1, walk: 8, station: 1, loop: 1, tail: 1, land: 2, hold: 0.4 });
/** the door station's q, mid-screen of the station */
export const STATION_Q = ROOM_SCREENS.wipe + ROOM_SCREENS.walk + 0.5;
/** where the world's map starts (q 10): land 1's station */
export const WORLD_START = ROOM_SCREENS.wipe + ROOM_SCREENS.walk + ROOM_SCREENS.station;
/** land i's station */
export const landQ = (i: number): number => WORLD_START + ROOM_SCREENS.land * i;
/** the loop screen's start: after the station in the hall (lands null), after the last land once entered with n lands */
export const loopStart = (lands: number | null): number => (lands === null || lands < 1 ? WORLD_START : WORLD_START - 1 + ROOM_SCREENS.land * lands);
/**
 * The track's height in screens in the hall, and once entered with n lands: a sticky 100svh stage inside an H-screen
 * track is pinned for q 0 to H - 1, so one screen beyond the tail keeps the stage pinned through the loop screen and the
 * tail, and the jump fires while the raw scroll is still inside the document (1300svh; 2000svh with four lands).
 * src/styles/room.css carries the literal per n under [data-lands], and tests/unit/room.test.ts reads them back.
 */
export const ROOM_HEIGHT = ROOM_SCREENS.wipe + ROOM_SCREENS.walk + ROOM_SCREENS.station + ROOM_SCREENS.loop + ROOM_SCREENS.tail + 1;
export const worldHeight = (n: number): number => ROOM_HEIGHT - 1 + ROOM_SCREENS.land * n;
export const ROOM_HEIGHT_WORLD = worldHeight(ROOM_LANDS.length);

/** the travel options (spec 2, "The travel between lands"), by Tune's parkTravel: 0 A, 1 B, 2 C */
export const TRAVEL_OPTIONS = Object.freeze(['A', 'B', 'C'] as const);
export type TravelOption = (typeof TRAVEL_OPTIONS)[number];
// the build's pick (astro.config.mjs writes it back, A when unset); under Node there is no import.meta.env
let PICK: string | undefined;
try { PICK = import.meta.env.PUBLIC_PARK_TRAVEL; } catch { PICK = undefined; }
const PICK_INDEX = Math.max(0, TRAVEL_OPTIONS.indexOf((PICK ?? 'A') as TravelOption));

/**
 * The tunable parameters (Tune, "Section 4"): the spec's defaults. Numbers only, as HERO_PARAMS, so the panel binds them
 * the same way; the choices are 0 or 1 (or small integers) with their meaning in the comment. The world's (bubbleMs to
 * worldBloom) are world.ts's WORLD_DEFAULTS, and Tune's ranges for them are its WORLD_RANGES, inside which every
 * combination passes the ring-timing rule (spec 2; tests/unit/room-world.test.ts walks them, room.test.ts holds Tune to
 * them).
 */
export const ROOM_PARAMS = Object.freeze({
  // the camera
  eye: 0.9,            // metres above the floor (the reference's eye-level shot, 0.908)
  fov: 60,             // vertical field of view on laptops; phones widen it by the hero's portrait rule
  lookYaw: 6,          // degrees of head sway from the pointer (laptops, in the hall only; the hero's own tilt is 6.3 and 2.25)
  lookPitch: 2.5,
  keySpeed: 0.5,       // metres per second while an arrow key is held
  mouseLook: 0,        // 1 lets a drag turn the head on laptops
  // the hall's look
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
  promptChip: 1,       // 1 shows [E] before the prompt on a device that can hover
  handoff: 0,          // the hand-off from the fog: 0 the ice-shard wipe, 1 a cut, 2 a fade
  // the entry (world.ts WORLD_DEFAULTS)
  bubbleMs: 2000,      // the bubble's growth from the screen's centre past the farthest corner
  travelMs: 8000,      // the ring glide
  ringCount: 3,        // igloo's three rings
  travelRoll: 30,      // degrees of roll, held through the passes
  morphMs: 1800,       // the particle morph onto land 1's picture
  enterPushMs: 1200,   // the push into land 1 through its depth map
  worldBloom: 0,       // laptops: the screened bloom over the tunnel and the push (0 off; never on a land at rest)
  // the lands
  landTravelMs: 2600,  // a travel between two lands (C: the clip's own length)
  parkTravel: PICK_INDEX,   // how a travel looks: 0 A the pictures in depth, 1 B the modelled park, 2 C the clips (default: the build's PUBLIC_PARK_TRAVEL)
  // the loop
  lapReset: 1,         // after the jump to the top: 1 the next lap walks the hall again, 0 the world stays entered
});

export type RoomParams = { -readonly [K in keyof typeof ROOM_PARAMS]: number };
export type RoomParamKey = keyof typeof ROOM_PARAMS;
export function roomParams(): RoomParams { return { ...ROOM_PARAMS }; }

const DEFAULTS: RoomParams = roomParams();
/** The parameters in use: Tune's live copy when its panel is open (dev and staging), else the defaults. */
export function liveRoomParams(): RoomParams {
  const t = typeof window !== 'undefined' ? window.__skreedTune?.room?.params : undefined;
  return t ?? DEFAULTS;
}
/** the travel option in use: Tune's pick where Tune is on, else the build's */
export const travelOption = (p: RoomParams): TravelOption => TRAVEL_OPTIONS[Math.min(2, Math.max(0, Math.round(p.parkTravel)))];

/** section#room[data-state] (spec 5, "States"): the walk; the door, the bubble, the glide, the morph and the push on one clock; the lands */
export type RoomState = 'hall' | 'entering' | 'world';
/** what a land is doing in the world: at rest, waiting on the next land's pictures, travelling, or settling the page after a travel */
export type LandSub = 'rest' | 'wait' | 'travel' | 'settling';

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
  /** the lands in this build (0: the prompt is never shown) */
  lands: number;
  /** the world's chunk, its scene and land 1 are in (a press can start the entry) */
  worldReady: boolean;
  /** seconds since the press while entering, and the entry clock's end */
  entry: number;
  arrive: number;
  /** the land on screen (0 to N - 1) once entered, and what it is doing */
  land: number;
  sub: LandSub;
  /** while a travel runs: from, to, its progress 0 to 1, and how it plays (the option, or the cross-fade standing in) */
  travel: { from: number; to: number; p: number; option: TravelOption | 'fade' } | null;
  /** a travel waits on the next land's pictures since this many ms (the Loading line under the land's text) */
  waitMs: number;
  /** the option's visible line where a travel did not play as the option (C's refused clip on a Tune build), else null */
  note: string | null;
  /** the fourth wipe's progress over the loop screen, 0 off it */
  loop: number;
  /** true on the frame the page jumped back to the top */
  jumped: boolean;
}

/** The island's side of the bridge (window.__skreedRoom): what the walk script can ask of the scene. */
export interface RoomIsland {
  /** scrolls the page to the top of q (instant) and snaps the section's followers there */
  snap(q: number): void;
  /** starts the entry; false while the world is still loading (the prompt goes busy and enters by itself) or there is no land */
  enter(): boolean;
  /** ends the entry at once: land 1 at rest, the page at its station; during a travel between lands, lands at once */
  skip(): void;
  /** a travel to the next land (+1) or the previous (-1), as the triggers start it; false when there is none */
  travel(dir: 1 | -1): boolean;
  /** -2 holds the head's sway while the pointer is over the prompt, -1 lets it go */
  setHover(i: number): void;
}
