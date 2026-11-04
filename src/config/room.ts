import { SCENE_COUNT as MAP_SCENE_COUNT } from './room-map.ts';
// Section 4, the five scenes (docs/specs/section-4-flux.md for the scenes; docs/specs/section-4-no-hall.md since
// 2026-11-02, when the hall, the door and the bubble left and the third wipe took the fog straight to scene 1): every
// string by id, the five scenes with their products, shades, key lights and files, the scroll map in screens, and the
// tunable parameters (Tune's "Section 4" group, PUBLIC_TUNE builds) with the spec's defaults. Plain data, read by
// Room.astro at build and by the island and the walk script at runtime; the unit tests import it under Node, where
// import.meta.glob and import.meta.env do not exist.

/**
 * The copy (section-4-flux.md 3, "Copy"; section-4-no-hall.md 3), in sentence case: the decode prints it in capitals,
 * as section 2 and the quiz do, and the accessible names keep the sentence case through the decode's visually hidden
 * copy. sceneLive and count are patterns for fill().
 */
export const ROOM_COPY = Object.freeze({
  aria: 'Section 4: the five scenes',
  worldAria: 'The five scenes. Use Down and Up to move between them.',
  loading: 'Loading the scenes...',
  still: 'Still loading...',
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
  count: '{n} / {N}',
  clipBlocked: 'Clip blocked',
});

/** a copy pattern with its {fields} filled */
export const fill = (pattern: string, v: Record<string, string | number>): string => pattern.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));

/** relative luminance of an sRGB hex (WCAG 2.x) */
export function relLuminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export type ProductId = 'case' | 'wallet' | 'lenskin' | 'airpods' | 'airpods-max';
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
  // Sam's AirPods Max model (2026-10-26); the catalog names AirPods Max among the AirPods cases (page 13) and gives it no line of its own, so this one is the range's sentence and the AirPods case page's availability, pending his words (section-4-flux.md 11)
  { id: 'airpods-max', name: 'AirPods Max case', line: 'Our AirPods case range covers AirPods Max too. Available in 240 shades. Matte or gloss.' },
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
  /** the product in front (ROOM_PRODUCTS by id); scene 5 is the AirPods Max case since 2026-10-26 (X-8); the lanyard and the PopSocket take slots when their models land */
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
  /** the product's authored presentation yaw at rest, radians (0 is face out) */
  readonly baseYaw: number;
  /**
   * The product's authored presentation pitch at rest, radians (positive tips the top toward the camera). The rest pose
   * (this and baseYaw) is Sam's references of 2026-10-26: the AirPods case as his Blender view, from a little above so
   * the open lid and the shell's mouth show; the Lenskin as his renders, turned so its thickness and the holes' walls
   * show. All of the pose at rest, none at the edge-on swap (carousel-math.ts poseWeight).
   */
  readonly basePitch: number;
  /**
   * The logotype (and the section index, which copies its tone) turn Urban Slate over this scene (true) or stay Pearl Whisper (false): the
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

// The two versions of the scenes' backgrounds (docs/specs/section-4-pictures.md; Sam, 2026-11-04: "i want another version
// of the product pages, where we will be replacing the backround, everything else looks the same ... make sure u keep the
// old version safely because if i dont like this i might revert back to the older version itself"): 'pictures', his five
// still backgrounds, one per product, drawn on the planes as each scene's still with no loop; 'loops', the old version,
// the five looping videos with their first frames as the stills. ROOM_BACKDROP_DEFAULT picks the version; set it to
// 'loops' to go back. ?scenes=loops or ?scenes=pictures on the address picks one for that visit, so the two can be put
// side by side on any build. The pictures are committed in src/assets/room/pictures/ (Sam, the same day, asked whether
// they could go into the public repository: "yes they're fine"), made by scripts/room/prepare-pictures.mjs; a build
// without them would draw the loops, as under Node.
export type RoomBackdrop = 'pictures' | 'loops';
export const ROOM_BACKDROP_DEFAULT: RoomBackdrop = 'pictures';
let PICTURE_FILES: Record<string, string> = {};
try { PICTURE_FILES = import.meta.glob<string>('../assets/room/pictures/*.{avif,webp}', { eager: true, query: '?url', import: 'default' }); } catch { PICTURE_FILES = {}; }
/** the URL of a file in src/assets/room/pictures/ by its name, '' where the build has none */
const pictureUrl = (name: string): string => Object.entries(PICTURE_FILES).find(([k]) => k.endsWith(`/${name}`) || k === name)?.[1] ?? '';
/** the version this visit draws: the address's ?scenes= where it names one, else the default; the loops wherever a picture is missing */
export function roomBackdrop(search: string = typeof location !== 'undefined' ? location.search : ''): RoomBackdrop {
  const asked = /(?:^|[?&])scenes=(pictures|loops)(?:&|$)/.exec(search)?.[1] as RoomBackdrop | undefined;
  const want = asked ?? ROOM_BACKDROP_DEFAULT;
  const ids = ['cove', 'grove', 'ember', 'palace', 'dawn'], have = ids.every((id) => (['wide', 'portrait'] as const).every((c) => pictureUrl(`${id}-${c}.avif`) && pictureUrl(`${id}-${c}.webp`)));
  return want === 'pictures' && have ? 'pictures' : 'loops';
}
export const ROOM_BACKDROP: RoomBackdrop = roomBackdrop();
/** the loops play in this version (the director makes no loop elements otherwise) */
export const ROOM_LOOPS = ROOM_BACKDROP === 'loops';
const files = (id: string): Readonly<Record<SceneClass, SceneFiles>> => {
  const one = (cls: SceneClass): SceneFiles => ROOM_LOOPS
    ? Object.freeze({ loop: fluxUrl(`${id}-${cls}.${'mp4'}`), avif: fluxUrl(`${id}-${cls}.avif`), webp: fluxUrl(`${id}-${cls}.webp`) })
    : Object.freeze({ loop: '', avif: pictureUrl(`${id}-${cls}.avif`), webp: pictureUrl(`${id}-${cls}.webp`) });
  return Object.freeze({ wide: one('wide'), portrait: one('portrait') });
};
/** products.bin's URL (the four meshes, section-4-flux.md 9 X-7) */
export const PRODUCTS_BIN_URL = fluxUrl('products.bin');

/**
 * What a scene takes in the pictures version in place of the loops' (docs/specs/section-4-pictures.md): the picture's
 * alt and the logotype's tone over it (scene-tone.mjs --pictures), and the product's shade (Sam, 2026-11-04: "use a color
 * from the color ffamily that we have for each of the cases of the 3d models which will go good with the backround": a
 * catalog shade by id that suits the picture) with the key light's tint taken from the picture's own light.
 */
export interface PictureLook { readonly alt: string; readonly toneDark: boolean; readonly shade: string; readonly shadeName: string; readonly family: string; readonly hex: string; readonly keyLight: string }
/** a row: the scene as the loops draw it, and its pictures version's look beside it (the version picks one) */
type SceneRow = Omit<RoomScene, 'i' | 'files' | 'basePitch'> & { basePitch?: number; picture: PictureLook };
const SCENE_ROWS: readonly SceneRow[] = [
  { id: 'cove', order: 1, product: 'case', shade: 'vivid-violet-05', shadeName: 'Lilac', family: 'vivid violet', hex: '#c988c8', finish: 'matte', keyLight: '#ffa6c8', baseYaw: 0, toneDark: false,
    alt: 'A pink rock cove with gold columns under a sunset sky, water rippling across the floor.',
    picture: { alt: 'A sunlit beige room, window light falling across the wall and the floor, three pebbles by the window.', toneDark: true, shade: 'roaring-red-18', shadeName: 'Terracotta', family: 'roaring red', hex: '#9a3f3d', keyLight: '#ffe2c4' } },
  { id: 'grove', order: 2, product: 'airpods', shade: 'go-green-09', shadeName: 'Sage', family: 'go green', hex: '#96a880', finish: 'gloss', keyLight: '#a8ffe0', baseYaw: 0, basePitch: 0.42, toneDark: false,
    alt: 'A green forest with a dense rainforest floor, a misty lake and a ring of light.',
    picture: { alt: 'A soft pink studio, its pale floor curving away to the wall.', toneDark: true, shade: 'vivid-violet-14', shadeName: 'Mulberry', family: 'vivid violet', hex: '#742665', keyLight: '#ffd6d8' } },
  { id: 'ember', order: 3, product: 'wallet', shade: 'basic-brown-04', shadeName: 'Desert', family: 'basic brown', hex: '#c6a884', finish: 'matte', keyLight: '#ffa171', baseYaw: 0, toneDark: false,
    alt: 'A red sunset over the sea, a leaning slab and a wet stone floor of flat slabs.',
    picture: { alt: 'A grey studio backdrop, lit in the middle and darker towards its edges.', toneDark: true, shade: 'basic-brown-07', shadeName: 'Cinnamon', family: 'basic brown', hex: '#ba7237', keyLight: '#dfe9f2' } },
  { id: 'palace', order: 4, product: 'lenskin', shade: 'playful-pink-06', shadeName: 'Ballerina', family: 'playful pink', hex: '#efa3af', finish: 'metallic', keyLight: '#ffc9a3', baseYaw: 0.55, basePitch: 0.12, toneDark: false,
    alt: 'A pink palace with a royal marble floor, statues and lattice screens open to the sea.',
    picture: { alt: 'A pale lilac studio, the wall meeting the floor in a straight line.', toneDark: true, shade: 'vivid-violet-06', shadeName: 'Lavender', family: 'vivid violet', hex: '#986db5', keyLight: '#e4dcff' } },
  { id: 'dawn', order: 5, product: 'airpods-max', shade: 'vivid-violet-04', shadeName: 'Pastel', family: 'vivid violet', hex: '#d7b9ed', finish: 'matte', keyLight: '#cbb0ff', baseYaw: -0.5, basePitch: 0.1, toneDark: false,   // minus: rotation.y turns +x away from the camera, and the Skreed S is on the +x (right) cup
    alt: 'A lilac dawn through sheer curtains, a starry disc and fog across the floor.',
    picture: { alt: 'An empty sage green room seen straight on, its walls, ceiling and floor in soft light.', toneDark: false, shade: 'playful-pink-03', shadeName: 'Blush', family: 'playful pink', hex: '#f4b6bb', keyLight: '#eef5e0' } },
];
/**
 * The five scenes (section-4-flux.md 3, "The scenes"), in the carousel's order: the room, the product in front with
 * its catalog shade and finish, the key light's tint, the still's alt and the files of both classes. The ids are ours
 * (X-12); the reference's names never reach src/ (scripts/room/guards.mjs).
 */
export const ROOM_SCENES: readonly RoomScene[] = Object.freeze(SCENE_ROWS.map(({ picture, ...r }, i) => Object.freeze({
  ...r, basePitch: r.basePitch ?? 0, i, files: files(r.id),
  ...(ROOM_LOOPS ? {} : picture),
})));
/** the pictures version's look per scene, whichever version this visit draws (scene-tone.mjs --pictures checks the tones, room.test.ts the shades) */
export const PICTURE_ROWS: readonly (PictureLook & { readonly id: RoomScene['id'] })[] = Object.freeze(SCENE_ROWS.map((r) => Object.freeze({ id: r.id, ...r.picture })));
export const SCENE_COUNT = ROOM_SCENES.length;
if (SCENE_COUNT !== MAP_SCENE_COUNT) throw new Error('config/room: ROOM_SCENES and room-map.ts disagree on the scene count');
/** a scene's shade line, "Lilac, vivid violet" (spec 3, "Each scene's four lines") */
export const shadeLine = (s: RoomScene): string => `${s.shadeName}, ${s.family}`;

/**
 * The scroll map of the section in screens of its own height (section-4-flux.md 5, "The scroll map", as
 * section-4-no-hall.md 5 has it since the hall left): the third wipe 0 to 1, the five scenes from 1 at a step of 0.5
 * (1, 1.5, 2, 2.5, 3), the hold 3 to 3.8, the exit seam at 3.8, the loop screen 3.8 to 4.8, the tail to 5.8 and one
 * pinned screen. The same map in every state: under q 1 the section is approaching, scene 1 drawn under the wipe.
 */
// the scroll map lives in config/room-map.ts (the hero island reads the fourth wipe's span statically, hero.ts, and must
// not carry this module's copy, scenes and files in its first-view chunk); every name of it is re-exported here
export { ROOM_SCREENS, WORLD_START, sceneQ, SCENES_END, WIPE4_START, ROOM_HEIGHT } from './room-map.ts';

/**
 * The tunable parameters (Tune, "Section 4"): the spec's defaults. Numbers only, as HERO_PARAMS, so the panel binds them
 * the same way; the choices are 0 or 1 (or small integers) with their meaning in the comment. The carousel's keys are
 * section-4-flux.md 9 X-13 with the ranges in ROOM_RANGES; the hall's keys, bubbleMs and lapReset left with the hall
 * (section-4-no-hall.md 5, "Tune").
 */
export const ROOM_PARAMS = Object.freeze({
  // the way in
  handoff: 0,          // the hand-off from the fog to scene 1: 0 the ice-shard wipe, 1 a cut, 2 a fade
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
});

/** Tune's ranges for the keys this part sets (X-13; min, max, step): room.test.ts holds Tune.astro to them */
export const ROOM_RANGES = Object.freeze({
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

/**
 * section#room[data-state] (section-4-no-hall.md 5, "States"): the section before the scenes (the raw q under scene 1's,
 * scene 1 drawn under the third wipe); the scenes. No seam state since the wrap from the top left (2026-11-04)
 */
export type RoomState = 'approach' | 'world';

/** What the island hands the walk script every frame (scripts/room/walk.ts): the section's progress and its state. */
export interface RoomFrame {
  /** the section's smoothed progress in screens of its own height, and the raw position */
  q: number;
  qRaw: number;
  /** scene 1 can be drawn (its still or its loop is resident): the third wipe may show it */
  ready: boolean;
  /** scene 1 has neither a still nor a loop (both failed): the section falls to the poster column */
  failed: boolean;
  inView: boolean;
  state: RoomState;
  /** the state under the frame (the state itself since no seam runs, 2026-11-04) */
  under: 'approach' | 'world';
  /** the scene at rest (0 to 4); while a step runs, the one it left */
  scene: number;
  /** a step runs, and the scene it goes to (minus 1 otherwise) */
  stepping: boolean;
  stepTo: number;
  /** the scene's loop is expected and not in (the loading line under its lines; never on the still paths nor after a refusal) */
  loading: boolean;
  /** the visible line where a loop was refused (Tune builds only: clipBlocked), else null */
  note: string | null;
  /** a seam's cloud cover, 0 to 1: always 0 since the wrap left (2026-11-04) */
  cover: number;
  /** the fourth wipe's progress (section-5.md 2): 0 before it, 1 once section 5's frame is whole; the scene's lines wipe out above 0 */
  wipeOut: number;
  /** true on the frame the page jumped back to the top */
  jumped: boolean;
}

/** The island's side of the bridge (window.__skreedRoom): what the walk script can ask of the scene. */
export interface RoomIsland {
  /** scrolls the page to the top of q (instant) and snaps the section's followers there */
  snap(q: number): void;
  /** one whole step to the next scene (+1) or the previous (-1); false when refused */
  step(dir: 1 | -1): boolean;
  /** the loops and the cloud's clock run (true) or hold (false): the "Pause motion" control (E-S4-loops) */
  motion(on: boolean): void;
}
