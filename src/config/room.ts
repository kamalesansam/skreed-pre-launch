// Section 4, the entrance and the five scenes (docs/specs/section-4.md for the hall, docs/specs/section-4-world.md 2 for
// the press and the bubble, docs/specs/section-4-flux.md for everything after the bubble): every string by id, the
// hall's measured frame, the five scenes with their products, shades, key lights and files, the scroll map in screens,
// and the tunable parameters (Tune's "Section 4" group, PUBLIC_TUNE builds) with the spec's defaults. Plain data, read by
// Room.astro at build and by the island and the walk script at runtime; the unit tests import it under Node, where
// import.meta.glob and import.meta.env do not exist.

/**
 * The copy (section-4-flux.md 3, "Copy"), in sentence case: the decode prints it in capitals, as section 2 and the quiz
 * do, and the accessible names keep the sentence case through the decode's visually hidden copy. sceneLive, wrapLive
 * and count are patterns for fill().
 */
export const ROOM_COPY = Object.freeze({
  aria: 'Section 4: the entrance to the Skreed world',
  stageAria: 'The entrance. Use the arrow keys to walk to the door.',
  worldAria: 'The five scenes. Use Down and Up to move between them.',
  hintTouch: 'Scroll to walk to the door.',
  hintKeys: 'Scroll or use the arrow keys to walk to the door.',
  loading: 'Loading the entrance...',
  still: 'Still loading...',
  enter: 'Enter Skreed universe',
  key: '[E]',
  loadingRoom: 'Loading...',
  skip: 'Skip',
  sceneHintTouch: 'Swipe to the next scene',
  sceneHintWheel: 'Scroll to the next scene',
  sceneHintKeys: 'Scroll or press Down to the next scene',
  loadingScene: 'Loading...',
  next: 'Next scene',
  prev: 'Previous scene',
  pause: 'Pause motion',
  play: 'Play motion',
  scenesTitle: 'The five scenes',
  scenesAria: 'Our products, in five rooms',
  sceneLive: '{n} of {N}. {name}. {shade}.',
  wrapLive: 'Round to the five scenes. {n} of {N}. {name}. {shade}.',
  count: '{n} / {N}',
  clipBlocked: 'Clip blocked',
  stillHallAlt: 'A long grey concrete hall under five cool ceiling lights, with a row of warm floor lights along each wall and a closed dark door at its end.',
  noscript: 'The entrance needs JavaScript. The scenes are below.',
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

/** relative luminance of an sRGB hex (WCAG 2.x) */
export function relLuminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export type ProductId = 'case' | 'wallet' | 'lenskin' | 'airpods';
export interface RoomProduct {
  readonly id: ProductId;
  readonly name: string;
  /** the catalog's sentence with rule 17's words dropped; the catalog's own is a test fixture, never shipped */
  readonly line: string;
}

/**
 * Sam's four products (2026-10-16) in the catalog's order (pages 15 to 19): the names the scenes' first lines carry and
 * the catalog lines their third. Each scene's shade is the scene's own (ROOM_SCENES); products.bin carries the meshes
 * (scripts/room/products-bin.mjs).
 */
export const ROOM_PRODUCTS: readonly RoomProduct[] = Object.freeze([
  { id: 'case', name: 'Phone case', line: 'Enhanced dual-layered protection with a tough Polycarbonate exterior and a flexible TPU core. Available in 240 shades. Matte or gloss.' },
  { id: 'wallet', name: 'MagSafe wallet', line: 'Sleek and secure MagSafe-compatible phone wallet for convenient card storage without the bulk. Available in 240 shades. Matte, gloss, metallic matte or metallic gloss.' },
  { id: 'lenskin', name: 'Lenskin', line: "Sleek metal accent for the latest iPhone's camera lens area, designed to personalize your look. Available in a range of contrasting solid shades and patterns. Matte, metallic matte or metallic gloss." },
  { id: 'airpods', name: 'AirPods case', line: 'Durable polycarbonate case with a sleek profile and precise cut-outs for charging. Includes a carabiner ring for easy attachment to bags. Available in 240 shades. Matte or gloss.' },
]);
/** a product by id */
export const productById = (id: ProductId): RoomProduct => ROOM_PRODUCTS.find((p) => p.id === id)!;

/** the loop classes (section-4-flux.md 2, "Portrait rule"): the wide set on laptops and landscape phones, the portrait set on phones; the poster stills' sizes */
export const SCENE_SIZE = Object.freeze({ wide: { width: 1280, height: 666 }, portrait: { width: 720, height: 1280 } } as const);
export type SceneClass = keyof typeof SCENE_SIZE;
/** one scene's files of a class: the loop and its poster still in both formats (hashed URLs; empty under Node) */
export interface SceneFiles { readonly loop: string; readonly avif: string; readonly webp: string }
export type Finish = 'matte' | 'gloss' | 'metallic';

export interface RoomScene {
  readonly id: 'cove' | 'grove' | 'ember' | 'palace' | 'dawn';
  /** 0 to 4, its place in the carousel */
  readonly i: number;
  /** 1 to 5, the count line's number */
  readonly order: number;
  /** the product in front (ROOM_PRODUCTS by id); the lanyard takes scene 5's slot when Sam's model lands (X-8) */
  readonly product: ProductId;
  /** the product's shade: the catalog id, its name, its family in lower case words and its hex (SHADES; tests/unit/room.test.ts holds them to the catalog) */
  readonly shade: string;
  readonly shadeName: string;
  readonly family: string;
  readonly hex: string;
  readonly finish: Finish;
  /** the key light's tint over the scene (the reference's per-scene tints, spec 3) */
  readonly keyLight: string;
  /** one sentence describing the room (no product in the still), the poster column's alt */
  readonly alt: string;
  /** the product's authored presentation yaw at rest, radians (face out) */
  readonly baseYaw: number;
  /**
   * The logotype and the Back to top control turn Urban Slate over this scene (true) or stay Pearl Whisper (false): the
   * frame under their boxes measured on the scene's stills by scripts/room/scene-tone.mjs (the hero's 3:1 rule), the
   * readings in docs/specs/evidence/section-4-flux-build.md; every scene's top is dark, so all five stay Pearl.
   */
  readonly toneDark: boolean;
  /** the loop and the poster still per class */
  readonly files: Readonly<Record<SceneClass, SceneFiles>>;
}

// the encoded files as the build emits them (Vite's glob, each a hashed URL): the ten loops, the twenty stills and
// products.bin in src/assets/room/flux/; under Node (the unit tests) there is no glob, and every URL is empty
let FLUX_FILES: Record<string, string> = {};
try { FLUX_FILES = import.meta.glob<string>('../assets/room/flux/*', { eager: true, query: '?url', import: 'default' }); } catch { FLUX_FILES = {}; }
/** the URL of a file in src/assets/room/flux/ by its name, '' where the build did not emit it */
export const fluxUrl = (name: string): string => Object.entries(FLUX_FILES).find(([k]) => k.endsWith(`/${name}`) || k === name)?.[1] ?? '';
const files = (id: string): Readonly<Record<SceneClass, SceneFiles>> => {
  const one = (cls: SceneClass): SceneFiles => Object.freeze({ loop: fluxUrl(`${id}-${cls}.${'mp4'}`), avif: fluxUrl(`${id}-${cls}.avif`), webp: fluxUrl(`${id}-${cls}.webp`) });
  return Object.freeze({ wide: one('wide'), portrait: one('portrait') });
};
/** products.bin's URL (the four meshes, section-4-flux.md 9 X-7) */
export const PRODUCTS_BIN_URL = fluxUrl('products.bin');

type SceneRow = Omit<RoomScene, 'i' | 'files'>;
const SCENE_ROWS: readonly SceneRow[] = [
  { id: 'cove', order: 1, product: 'case', shade: 'vivid-violet-05', shadeName: 'Lilac', family: 'vivid violet', hex: '#c988c8', finish: 'matte', keyLight: '#ffa6c8', baseYaw: 0, toneDark: false,
    alt: 'A pink rock cove with gold columns under a sunset sky, water rippling across the floor.' },
  { id: 'grove', order: 2, product: 'airpods', shade: 'go-green-09', shadeName: 'Sage', family: 'go green', hex: '#96a880', finish: 'gloss', keyLight: '#a8ffe0', baseYaw: 0, toneDark: false,
    alt: 'A green forest with a dense rainforest floor, a misty lake and a ring of light.' },
  { id: 'ember', order: 3, product: 'wallet', shade: 'basic-brown-04', shadeName: 'Desert', family: 'basic brown', hex: '#c6a884', finish: 'matte', keyLight: '#ffa171', baseYaw: 0, toneDark: false,
    alt: 'A red sunset over the sea, a leaning slab and a wet stone floor of flat slabs.' },
  { id: 'palace', order: 4, product: 'lenskin', shade: 'playful-pink-06', shadeName: 'Ballerina', family: 'playful pink', hex: '#efa3af', finish: 'metallic', keyLight: '#ffc9a3', baseYaw: 0, toneDark: false,
    alt: 'A pink palace with a royal marble floor, statues and lattice screens open to the sea.' },
  { id: 'dawn', order: 5, product: 'case', shade: 'vivid-violet-04', shadeName: 'Pastel', family: 'vivid violet', hex: '#d7b9ed', finish: 'matte', keyLight: '#cbb0ff', baseYaw: 0, toneDark: false,
    alt: 'A lilac dawn through sheer curtains, a starry disc and fog across the floor.' },
];
/**
 * The five scenes (section-4-flux.md 3, "The scenes"), in the carousel's order: the room, the product in front with
 * its catalog shade and finish, the key light's tint, the still's alt and the files of both classes. The ids are ours
 * (X-12); the reference's names never reach src/ (scripts/room/guards.mjs).
 */
export const ROOM_SCENES: readonly RoomScene[] = Object.freeze(SCENE_ROWS.map((r, i) => Object.freeze({ ...r, i, files: files(r.id) })));
export const SCENE_COUNT = ROOM_SCENES.length;
/** a scene's shade line, "Lilac, vivid violet" (spec 3, "Each scene's four lines") */
export const shadeLine = (s: RoomScene): string => `${s.shadeName}, ${s.family}`;

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
 * The scroll map of the section in screens of its own height (section-4.md 2 for the hall; section-4-flux.md 5, "The
 * scroll map"): the third wipe 0 to 1, the walk 1 to 9, the station 9 to 10, the five scenes from 10 at a step of 0.5
 * (10, 10.5, 11, 11.5, 12), the hold 12 to 12.8, the exit seam at 12.8, the loop screen 12.8 to 13.8, the tail to 14.8
 * and one pinned screen. The same map in every state: in the hall q 10 to 12.8 holds the station frame and the seam at
 * 12.8 runs over the hall as it does over scene 5.
 */
export const ROOM_SCREENS = Object.freeze({ wipe: 1, walk: 8, station: 1, step: 0.5, hold: 0.8, loop: 1, tail: 1 });
/** the door station's q, mid-screen of the station */
export const STATION_Q = ROOM_SCREENS.wipe + ROOM_SCREENS.walk + 0.5;
/** where the scenes start (q 10): scene 1's position */
export const WORLD_START = ROOM_SCREENS.wipe + ROOM_SCREENS.walk + ROOM_SCREENS.station;
/** scene i's position (the reference's 50 vh a step) */
export const sceneQ = (i: number): number => WORLD_START + ROOM_SCREENS.step * i;
/** the last scene's position: the carousel is in range while the raw q is within 2 px of [WORLD_START, SCENES_END] */
export const SCENES_END = sceneQ(SCENE_COUNT - 1);
/** the exit seam's trigger: the raw scroll crossing it downward runs the cloud and the jump to the top */
export const LOOP_START = SCENES_END + ROOM_SCREENS.hold;
/**
 * The track's height in screens: a sticky 100svh stage inside an H-screen track is pinned for q 0 to H - 1, so one screen
 * beyond the tail keeps the stage pinned through the loop screen and the tail, and the seam fires while the raw scroll is
 * still inside the document. src/styles/room.css carries the literal (1580svh) and tests/unit/room.test.ts reads it back.
 */
export const ROOM_HEIGHT = LOOP_START + ROOM_SCREENS.loop + ROOM_SCREENS.tail + 1;

/**
 * The tunable parameters (Tune, "Section 4"): the spec's defaults. Numbers only, as HERO_PARAMS, so the panel binds them
 * the same way; the choices are 0 or 1 (or small integers) with their meaning in the comment. The carousel's keys are
 * section-4-flux.md 9 X-13 with the ranges in ROOM_RANGES; bubbleMs's range is transition.ts's BUBBLE.msRange (the growth
 * is proven across it, tests/unit/room-bubble.test.ts).
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
  // the entry
  bubbleMs: 2000,      // the bubble's growth from the screen's centre past the farthest corner (the way back takes half)
  // the carousel (section-4-flux.md 4 and 9 X-13)
  stepMs: 770,         // one step, on power2.out
  sweepDeg: 80,        // the arc on the wide class, degrees
  sweepDegPortrait: 22,   // the arc when the stage is taller than wide (X-1)
  fovStep: 42,         // the pinch's bottom, from 45
  fovReturnAt: 0.65,   // the eased t at which the pinch bottoms and turns back
  lightStart: 0.5,     // the light-up's threshold on proximity
  lightSoft: 0.64,     // its softness
  lightBoost: 0.17,    // its boost on the revealed areas
  keyLightMs: 1100,    // the key light's cross-fade from the front switch
  snapMs: 500,         // the glue's settle (scroll.ts)
  // the loop
  lapReset: 1,         // after the jump to the top: 1 the next lap walks the hall again, 0 the scenes stay entered
});

/** Tune's ranges for the keys this part sets (X-13; min, max, step): room.test.ts holds Tune.astro to them */
export const ROOM_RANGES = Object.freeze({
  bubbleMs: [1200, 3200, 10],
  stepMs: [400, 1200, 10],
  sweepDeg: [40, 120, 1],
  sweepDegPortrait: [12, 80, 1],
  fovStep: [36, 45, 0.5],
  fovReturnAt: [0.4, 0.9, 0.05],
  lightStart: [0.2, 0.8, 0.05],
  lightSoft: [0.2, 1, 0.02],
  lightBoost: [0, 0.5, 0.01],
  keyLightMs: [300, 2000, 50],
  snapMs: [200, 900, 10],
} as const satisfies Partial<Record<keyof typeof ROOM_PARAMS, readonly [number, number, number]>>);

export type RoomParams = { -readonly [K in keyof typeof ROOM_PARAMS]: number };
export type RoomParamKey = keyof typeof ROOM_PARAMS;
export function roomParams(): RoomParams { return { ...ROOM_PARAMS }; }

const DEFAULTS: RoomParams = roomParams();
/** The parameters in use: Tune's live copy when its panel is open (dev and staging), else the defaults. */
export function liveRoomParams(): RoomParams {
  const t = typeof window !== 'undefined' ? window.__skreedTune?.room?.params : undefined;
  return t ?? DEFAULTS;
}

/** section#room[data-state] (section-4-flux.md 5, "States"): the walk; the door and the bubble on one clock; the scenes; the way back; either seam */
export type RoomState = 'hall' | 'entering' | 'world' | 'back' | 'seam';

/** What the island hands the walk script every frame (scripts/room/walk.ts): the section's progress and the anchors. */
export interface RoomFrame {
  /** the section's smoothed progress in screens of its own height, and the raw position */
  q: number;
  qRaw: number;
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
  /** what a seam returns to (the hall after the exit's lap reset, the scenes with Tune's lapReset 0 or after the wrap) */
  under: 'hall' | 'world';
  /** products.bin and scene 1's loop (or its still where loops never play) are in: a press can start the entry */
  worldReady: boolean;
  /** seconds since the press while entering */
  entry: number;
  /** the scene at rest (0 to 4); while a step runs, the one it left */
  scene: number;
  /** a step runs, and the scene it goes to (minus 1 otherwise) */
  stepping: boolean;
  stepTo: number;
  /** the scene's loop is expected and not in (the loading line under its lines; never on the still paths nor after a refusal) */
  loading: boolean;
  /** the visible line where a loop was refused (Tune builds only: clipBlocked), else null */
  note: string | null;
  /** a seam's cloud cover, 0 to 1 */
  cover: number;
  /** true on the frame the page jumped back to the top */
  jumped: boolean;
}

/** The island's side of the bridge (window.__skreedRoom): what the walk script can ask of the scene. */
export interface RoomIsland {
  /** scrolls the page to the top of q (instant) and snaps the section's followers there */
  snap(q: number): void;
  /** starts the entry; false while the scenes are still loading (the prompt goes busy and enters by itself) */
  enter(): boolean;
  /** ends the entry at once: scene 1 at rest, the page at its position */
  skip(): void;
  /** one whole step to the next scene (+1) or the previous (-1); false when refused */
  step(dir: 1 | -1): boolean;
  /** the way back from scene 1 into the hall; false when not at scene 1 at rest */
  back(): boolean;
  /** the reverse seam from scroll 0 onto scene 5; false while another seam, the entry or the way back runs */
  wrap(): boolean;
  /** the loops and the cloud's clock run (true) or hold (false): the "Pause motion" control (E-S4-loops) */
  motion(on: boolean): void;
  /** -2 holds the head's sway while the pointer is over the prompt, -1 lets it go */
  setHover(i: number): void;
}
