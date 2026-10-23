// Section 4's director (docs/specs/section-4.md 2, 4 and 5 for the hall; docs/specs/section-4-world.md 2 for the press
// and the bubble; docs/specs/section-4-flux.md 2, 4 and 5 for the scenes): the section's state (hall, entering, world,
// back, seam), its progress q in screens of its own height through two followers, the third wipe from the fog, the
// walk, the door, the entry clock, the five scenes on the carousel (carousel.ts) with their loops (video.ts), the way
// back, the two seams and the hooks.
// - The entry is one clock from the press: the leaves and the glide into the doorway (the hall frozen once the glide
//   ends, its last frame the bubble's outside), the bubble (transition.ts) opening on the carousel's frame at scene 1
//   with its loop playing; when the circle has passed the farthest corner the entry is over: state world, scene 1, the
//   page snapped to q 10. Skip ends it at once.
// - In world a gesture (scroll.ts, through the adapter hero.ts builds) is one whole step on the carousel's own tween;
//   the page's scroll is snapped to the scene's q when the step ends. A position change without a gesture (the
//   scrollbar) re-syncs the scene; the raw position under q 10 resets to the hall at once.
// - The way back from scene 1: the bubble's clock runs down over half of bubbleMs while the hall renders live (the dolly
//   back, the leaves shut, the outside's grey and dark fading with the circle), then the hall at the station.
// - The exit seam when the raw scroll crosses LOOP_START (12.8) downward in world or hall: the cloud covers the frame in
//   280 ms with the scroll held there (the section's own frame, the scenes or the hall, stays under the forming cloud,
//   X-15), under full cover the page jumps to scroll 0 and the section resets, the cloud thins over the hero in 360 ms,
//   gestures are swallowed for 400 ms more. The reverse seam (the wrap, from scroll 0): cover in over the hero, the page
//   set to scene 5's position with the hero's followers snapped and the carousel at scene 5 under the cloud, full cover
//   held until dawn's still is resident, cover out over dawn, the lock; the state is seam throughout and becomes world
//   when the lock ends, and the visitor's next gesture unlocks the loop elements again. Under reduced motion both are
//   cuts. Every state change is reported to the wiring (onState), which re-evaluates the page scroll's capture set.
// - Loading runs in phases, one compile, upload or decode a frame: the cloud's pass at idle (warmCloud, phase 0); the
//   hall with this chunk (load); past the third wipe the carousel's programs, products.bin, scene 1's still and loop;
//   the five elements unlocked in the press task; on arrival the other loops one at a time, 2 to 5, each still before
//   its loop; after a wrap 5 first, then 4, 3, 2, 1.
// The section's layout is cached (layout.ts: its document top and height, re-read when html's class changes, when the
// document, the quiz or the section changes size, and on resize; a reading taken under the intro's layout is replaced
// once the intro ends), so a frame reads only scrollY and never forces layout under the quiz. The DOM side
// (scripts/room/walk.ts) gets one frame object per step through window.__skreedRoomFrame and drives the scene through
// window.__skreedRoom.
import { LinearFilter, NoColorSpace, Texture, type WebGLRenderer } from 'three';
import { HALL, LOOP_START, PRESS, PRODUCTS_BIN_URL, ROOM_SCENES, ROOM_SCREENS, SCENE_COUNT, SCENES_END, STATION_Q, WORLD_START, liveRoomParams, sceneQ, type RoomFrame, type RoomIsland, type RoomParams, type RoomState, type SceneClass } from '../../../config/room.ts';
import { createScrollFollower } from '../scroll/scrollMap.ts';
import { clamp01, easeInOutCubic, lerpFPS } from '../util/math.ts';
import { createHall, type HallScene } from './hall.ts';
import { BUBBLE, bubbleAt, createTransition, type TransitionPass } from './transition.ts';
import { createCarousel, type Carousel, type CarouselTune, type LightSetting, type SceneDef } from './carousel.ts';
import { STEP, cloudCover, frameSource } from './carousel-math.ts';
import { allowed, create as createPool, type VideoPool } from './video.ts';
import { fetchProductsBin } from './products-bin.ts';
import { watchLayout } from './layout.ts';

export interface RoomStepIn { t: number; dt: number; ratio: number; pointer: { active: boolean; ndc: { x: number; y: number } }; touch: boolean; mouseRate: number;
  /** section 3's fog ground, the third wipe's near side (the 'fade' hand-off mixes from it) */
  fog: Texture | null }

/** what the composite draws for the section this frame */
export interface RoomPlan {
  /** the section draws this frame (the hall is ready and the section is on screen past its top, or the scenes are) */
  on: boolean;
  /** the frame the section shows: the hall, the bubble over it, or the carousel */
  tex: Texture | null;
  /** the third wipe's progress (fog to the section) */
  wipeIn: number;
  /** the fog ground is still on screen (the third wipe, or the fade, has not finished) */
  groundNeeded: boolean;
  /** a seam's cloud cover, 0 to 1: above 0 the composite blends cloud (premultiplied) over its result */
  cover: number;
  cloud: Texture | null;
  /** the logotype and the Back to top control over the section: Pearl in the hall; over the scenes the front scene's own tone (ROOM_SCENES toneDark, measured on the stills) */
  toneDark: boolean;
}

export interface RoomDirector {
  readonly hall: HallScene;
  readonly state: RoomState;
  /** before the hero's part of the frame: the section's progress */
  begin(ratio: number): void;
  /** the scene work of the frame: update, render the hall, the bubble, the carousel and a seam's cloud; the plan for the composite */
  step(f: RoomStepIn): RoomPlan;
  /** the page went to the top by other means (the back-to-top control): every clock stops, and the next lap starts as the exit's does */
  reset(): void;
  resize(w: number, h: number): void;
  /** the hall's model and lightmap, the bubble's program (when the quiz or the section nears) */
  load(): Promise<void>;
  /** phase 0: the cloud's pass and target, at idle once the intro ends, so a wrap from the top has its cover */
  warmCloud(): Promise<void>;
  // the adapter for scroll.ts (section-4-flux.md 5, "Capture, by state and position")
  /** the raw position within 2 px of [q 10, q 12] in world */
  inRange(): boolean;
  /** what a gesture in that direction meets: scene 5 forward, scene 1 back, or a step */
  edge(dir: 1 | -1): 'forward' | 'back' | null;
  /** one whole step; false when refused (busy, an edge, the next scene's still not resident) */
  stepScene(dir: 1 | -1): boolean;
  back(): boolean;
  wrap(): boolean;
  /** the entry, the way back or a seam (cover-in, cover-out and the 400 ms after) is running: gestures are swallowed */
  lock(): boolean;
  /** a step runs or its 150 ms cooldown */
  busy(): boolean;
  hooks(): Record<string, unknown>;
  dispose(): void;
}

export interface DirectorOptions {
  renderer: WebGLRenderer; avif: boolean; reduced: boolean; touch: boolean;
  /** the canvas's pixel ratio (the cloud's target is capped at 1.5) */
  dpr: number;
  /** the hero's own followers to the page's position in document px (the exit's jump to 0, the wrap's landing) */
  snapHero(y: number): void;
  /** every state change, as it happens (a press at the station changes the state with no scroll event, so the page scroll re-evaluates its capture set from here) */
  onState?(state: RoomState): void;
  /** every reading of the section's layout (the intro ending, the document growing, a resize): the page scroll re-evaluates its range from here */
  onLayout?(): void;
}

/** the review hooks beyond hooks() (hero.ts installs them as window.__s4 in hooks builds) */
export interface RoomHooks {
  /** starts the entry without the walk (false while the scenes load) */
  enterNow(): boolean;
  /** the entry clock at sec seconds after the press, held there (a negative sec lets it run on); past the entry's end it lands */
  seek(sec: number): void;
  /** scene i at rest with the page at its position (entering at once if need be); true once its still or loop is resident */
  scene(i: number): boolean;
  /** the carousel's lights set live (the product check, AC2); the values in force */
  lights(o: Partial<LightSetting>): LightSetting;
  /** the bottom shade set live (AC12's tuning): how dark at the bottom edge, where it clears and up to where it stays solid, shares of the frame's height */
  shade(dark: number, height?: number, solid?: number): void;
}

/** the exit seam and the reverse seam (the wrap), by phase (section-4-flux.md 4, the motion table) */
type SeamKind = 'exit' | 'wrap';
type SeamPhase = 'wait' | 'in' | 'hold' | 'out' | 'lock';
interface Seam { kind: SeamKind; phase: SeamPhase; t0: number; holdY: number }
type LoopState = 'idle' | 'fetching' | 'in' | 'failed';

const N = SCENE_COUNT, SEAM = { inS: STEP.seamInMs / 1000, outS: STEP.seamOutMs / 1000, lockS: 0.4, waitS: 1.5, holdS: 1.5 };
/** E-S4-loops is pending: the "Pause motion" control (walk.ts) shows only once Sam declines it (the director sets data-pause) */
const LOOPS_DECLINED = false;
const TIMEOUT_MS = 20_000;
const HOOKS = import.meta.env.PUBLIC_HERO_HOOKS === '1';
/** the visitor's next gesture after a wrap unlocks the loop elements again (spec 5, "Video policy"; AC7) */
const UNLOCK_EVENTS = ['pointerup', 'touchend', 'keydown'] as const;

/** a poster still as a texture in display values, fetched with the site's 20 s timeout, decoded off the main thread, sampling as a picture does (the bitmap upside down, flipY off); null where the build has none */
async function decodeStill(url: string, signal?: AbortSignal): Promise<Texture | null> {
  if (!url) return null;
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), TIMEOUT_MS), stop = () => ac.abort();
  if (signal?.aborted) ac.abort();
  signal?.addEventListener('abort', stop, { once: true });
  try {
    const res = await fetch(url, { signal: ac.signal, credentials: 'same-origin' });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const bmp = await createImageBitmap(await res.blob(), { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    if (ac.signal.aborted) { bmp.close(); throw new Error(`${url}: aborted`); }
    const tex = new Texture(bmp);
    tex.flipY = false; tex.colorSpace = NoColorSpace; tex.generateMipmaps = false; tex.minFilter = LinearFilter; tex.magFilter = LinearFilter; tex.needsUpdate = true;
    return tex;
  } finally { clearTimeout(t); signal?.removeEventListener('abort', stop); }
}

export function createRoomDirector(o: DirectorOptions): RoomDirector & Partial<RoomHooks> {
  const { renderer, reduced } = o;
  const root = document.getElementById('room');
  const hall = createHall({ renderer, avif: o.avif, reduced, touch: o.touch });
  const trans = createTransition(renderer);
  let mix: TransitionPass | null = null, curW = 1, curH = 1;   // the 'fade' hand-off (Tune only): the same pass's straight mix, made on first use
  const getMix = () => (mix ??= (() => { const m = createTransition(renderer); m.resize(curW, curH); return m; })());
  const follow = createScrollFollower();
  let state: RoomState = 'hall', under: 'hall' | 'world' = 'hall', disposed = false;
  const ac = new AbortController();
  const H = document.documentElement;
  // the section's layout, cached (layout.ts): its top in document pixels and its height; a reading under the intro's
  // layout is replaced when the intro ends, and the page scroll hears of every reading
  let top = 0, height = 1, measured = false;
  const lay = watchLayout({
    html: H,
    read: () => { if (!root) return null; const r = root.getBoundingClientRect(); return { top: r.top + scrollY, height: r.height }; },
    watch: [root, document.getElementById('find'), H],
    onMeasure: (l) => { top = l.top; height = l.height; measured = true; o.onLayout?.(); },
  });
  const measure = () => { lay.measure(); };
  /** the layout for this frame: a reading under the intro is read again once the intro has ended */
  const current = () => { if (!measured) measure(); else lay.get(); };
  const poster = () => root?.dataset.tier === 'poster' || !H.classList.contains('hero3d') || H.classList.contains('poster');
  const say = (detail: string) => window.dispatchEvent(new CustomEvent('skreed:room-state', { detail }));
  const sayScene = (i: number) => window.dispatchEvent(new CustomEvent('skreed:room-scene', { detail: { i } }));
  /** an asset the section needs failed: the stills and the column stand in, the island stops drawing the section */
  const toPoster = () => { pendingEnter = false; if (root) root.dataset.tier = 'poster'; };
  const params = (): RoomParams => liveRoomParams();
  const screenPx = () => height / (ROOM_SCREENS.wipe + ROOM_SCREENS.walk + ROOM_SCREENS.station + ROOM_SCREENS.step * (N - 1) + ROOM_SCREENS.hold + ROOM_SCREENS.loop + ROOM_SCREENS.tail + 1);

  // the per-frame values
  let q = 0, qAll = 0, qRaw = 0, prevRaw = 0, lastRaw = 0, inRoom = false, jumped = false, revealAt = -1, wasReady = false, snapped = true, lastNear = 0, lastT = 0;
  let pendingEnter = false, hover = -1, holdSway = false, x: number = HALL.start;
  // the entry clock (seconds since the press), a held seek, and the hall frozen after its glide
  let entryT = 0, seekT = -1, endNow = false, hallFrozen = false, hallStale = false;
  // the way back's clock, the seam, the step under way (from and to), the motion control
  let backT = 0, seam: Seam | null = null, stepFrom = -1, stepTo = -1, motionOn = true, cloudReady = false;
  // the one-shot unlock armed by a wrap, and (hooks builds) the frame sources seen during a seam's cover-in
  let unlockOff: (() => void) | null = null;
  const seamDraws = new Set<string>();
  const look = { yaw: 0, pitch: 0 };
  // the product's look from a pressed pointer or a finger (never on hover, X-14)
  let pressed = false, lookX = 0, lookY = 0;

  // ---- the loop class, the loop elements, the stills and the carousel
  let cls: SceneClass = 'wide', clsFixed = false;
  const video: VideoPool | null = !reduced && allowed() ? createPool(N) : null;
  const loopState: LoopState[] = Array.from({ length: N }, () => 'idle');
  const stillJob: (Promise<unknown> | null)[] = Array.from({ length: N }, () => null), stillDone: boolean[] = Array.from({ length: N }, () => false);
  let stillChain: Promise<unknown> = Promise.resolve(), loopChain: Promise<unknown> = Promise.resolve();
  let productsState: LoopState = 'idle', productsJob: Promise<void> | null = null, phase2: Promise<void> | null = null;
  /** scene i's still: fetched and decoded one at a time (one decode a frame), a new texture each call; null where it failed (the plane is black then) */
  function loadStill(i: number): Promise<Texture | null> {
    const f = ROOM_SCENES[i].files[cls], url = o.avif ? f.avif : f.webp;
    const job = (stillChain = stillChain.then(() => decodeStill(url, ac.signal))).then(
      (t) => { if (disposed) { (t as Texture | null)?.dispose(); return null; } return t as Texture | null; },
      (e: unknown) => { if (!disposed) console.warn(`section 4: scene ${ROOM_SCENES[i].id}'s still did not load; its plane stays black`, e); return null; },
    ).finally(() => { stillDone[i] = true; if (stillJob[i] === job) stillJob[i] = null; });
    stillJob[i] = job;
    return job;
  }
  const tuneObj: CarouselTune = { stepMs: STEP.ms, sweepDeg: STEP.sweepDeg, sweepDegPortrait: STEP.sweepDegPortrait, fovStep: STEP.fovStep, fovReturnAt: STEP.fovReturnAt, lightStart: 0.5, lightSoft: 0.64, lightBoost: 0.17, keyLightMs: STEP.keyLightMs };
  const refreshTune = (P: RoomParams) => { tuneObj.stepMs = P.stepMs; tuneObj.sweepDeg = P.sweepDeg; tuneObj.sweepDegPortrait = P.sweepDegPortrait; tuneObj.fovStep = P.fovStep; tuneObj.fovReturnAt = P.fovReturnAt; tuneObj.lightStart = P.lightStart; tuneObj.lightSoft = P.lightSoft; tuneObj.lightBoost = P.lightBoost; tuneObj.keyLightMs = P.keyLightMs; };
  const scenes: SceneDef[] = ROOM_SCENES.map((s, i) => ({ id: s.id, keyLight: s.keyLight, baseYaw: s.baseYaw, product: s.product, shade: s.hex, finish: s.finish, still: () => loadStill(i), loop: video ? i : null }));
  const carousel: Carousel = createCarousel({ renderer, scenes, video, cls, reduced, tune: () => tuneObj, dpr: o.dpr });
  /** the carousel's loops and cloud clock run only while the scenes are drawn (never under the hall's frames) and the control allows */
  const syncMotion = () => carousel.motion(motionOn && state !== 'hall' && !(state === 'seam' && under === 'hall'));
  const setState = (s: RoomState) => { state = s; if (root) { root.dataset.state = s; if (s !== 'world') delete root.dataset.scene; } syncMotion(); measure(); o.onState?.(s); };
  /** the step under way is over or abandoned */
  const clearStep = () => { stepFrom = stepTo = -1; if (root) delete root.dataset.step; };
  const setScene = (i: number, instant = false) => { carousel.setScene(i, instant); if (root && state === 'world') root.dataset.scene = String(i); };
  const scene = () => carousel.scene();
  /** the front scene's tone for the logotype (the front switches at eased 0.75 of a step, where the lights change over) */
  const sceneTone = () => ROOM_SCENES[carousel.front()]?.toneDark ?? false;
  /** scene i's still or loop is resident (a step may start toward it; the wrap's cover may lift) */
  const resident = (i: number): boolean => stillDone[i] || (!!video && video.in(i));
  const loopSettled = (i: number) => loopState[i] === 'in' || loopState[i] === 'failed';
  /** products.bin and scene 1's loop (its still where loops never play) are in, or have failed: a press can start the entry */
  const worldReady = () => productsState !== 'idle' && productsState !== 'fetching' && (video ? loopSettled(0) : stillDone[0]);

  // ---- loading
  /** scene i's loop streamed into its element (the class fixed from the first fetch, X-10) */
  async function fetchLoop(i: number): Promise<void> {
    if (!video || loopState[i] !== 'idle' || disposed) return;
    clsFixed = true; loopState[i] = 'fetching';
    const ok = await video.fetch(i, ROOM_SCENES[i].files[cls].loop, ac.signal);
    if (disposed) return;
    loopState[i] = ok ? 'in' : 'failed';
    afterReady();
  }
  /** the loops in order, one at a time, each after its still where one is on its way (spec 5, "Loading", phases 4 and 5) */
  const queueLoops = (order: readonly number[]) => { for (const i of order) loopChain = loopChain.then(() => stillJob[i] ?? null).then(() => fetchLoop(i)).catch(() => {}); };
  /** phase 2 (past the third wipe): the carousel's programs, products.bin, the first scene's still and loop (scene 1 from the walk; scene 5 after a wrap-first visit) */
  function loadScenes(first = 0): Promise<void> {
    return (phase2 ??= (async () => {
      void api.warmCloud(); void carousel.warm();
      productsJob ??= (async () => {
        productsState = 'fetching';
        try { const p = await fetchProductsBin(PRODUCTS_BIN_URL, ac.signal); if (disposed) return; carousel.setProducts(p); productsState = 'in'; }
        catch (e) { if (disposed) return; console.warn('section 4: products.bin did not load; the scenes show without a product', e); productsState = 'failed'; }
        afterReady();
      })();
      carousel.prepare(first);
      queueLoops([first]);
      await productsJob;
    })());
  }
  /** the first scene's parts are in: a press that waited enters now, while the visitor is still at the door */
  function afterReady() {
    if (!worldReady()) return;
    if (pendingEnter) {
      pendingEnter = false;
      if (inRoom && state === 'hall' && lastNear > 0) startEnter(); else say('unbusy');
    }
  }
  /** the other scenes after arrival at scene i: the nearer first, then the rest in order (2, 3, 4, 5 from scene 1; 5, 4, 3, 2, 1 after a wrap) */
  const loadRest = (i: number) => { void loadScenes(i); queueLoops(i === 0 ? [1, 2, 3, 4] : [i, i - 1, i - 2, i - 3, i - 4].filter((k) => k >= 0 && k < N)); };

  function snap(qq: number) {
    current();
    const y = Math.round(top + qq * screenPx());
    scrollTo({ top: y, behavior: 'instant' }); follow.snap(qq); q = qAll = qq; qRaw = prevRaw = qq; snapped = true;
    return y;
  }

  // ---- the entry
  function startEnter() {
    if (state !== 'hall') return;
    if (q < ROOM_SCREENS.wipe + ROOM_SCREENS.walk) snap(STATION_Q);   // off-station: to the station first, in the same task
    entryT = 0; seekT = -1; endNow = false; hallFrozen = false; hallStale = false;
    hall.entering(true);
    setState('entering');
    setScene(0, true);
    say('entering');
  }
  function finishEnter() {
    seekT = -1; endNow = false;
    carousel.scissor(null);
    // the page left the section during the entry (a gesture the capture did not hold): the entry is abandoned and the hall
    // stands where the page is, so the next approach walks in again (never the scenes shown through the walk's range)
    if (!inRoom) { toHall(); return; }
    hall.swing(0, params().door);
    setState('world'); under = 'world';
    if (root) root.dataset.scene = '0';
    if (inRoom) snap(sceneQ(0));
    say('world'); sayScene(0);
    loadRest(0);
  }

  // ---- the way back and the resets
  /** the hall at the station, at once: the scenes stopped, the door shut, the next press entering again */
  function toHall() {
    seam = null; carousel.seam(null, 0); carousel.scissor(null);
    clearStep(); hallFrozen = false; hallStale = true;
    hall.entering(false); hall.swing(0, params().door);
    setState('hall'); under = 'hall';
    x = HALL.start; snapped = true;
  }
  /** the top of the page (the exit's jump, the back-to-top control): every clock stops, the next lap starts the hall's walk (Tune lapReset 0 keeps the scenes entered) */
  function resetLap(fromSeam: boolean) {
    jumped = true;
    follow.snap(0); q = qAll = 0; qRaw = prevRaw = 0; revealAt = -1; pendingEnter = false; snapped = true;
    seekT = -1; endNow = false; backT = 0; clearStep();
    carousel.scissor(null);
    const stay = params().lapReset < 0.5 && (state === 'world' || under === 'world');
    if (!fromSeam) { seam = null; carousel.seam(null, 0); }
    if (stay) { under = 'world'; if (!fromSeam) setState('world'); setScene(0, true); }
    else { under = 'hall'; if (!fromSeam) setState('hall'); hall.entering(false); }
    hall.swing(0, params().door); x = HALL.start; hover = -1; holdSway = false; hallFrozen = false;
    syncMotion();
    say('jump');
  }

  // ---- the seams (section-4-flux.md 4: the exit at LOOP_START, the wrap from scroll 0; cuts under reduced motion)
  function startExit(t: number) {
    clearStep(); seamDraws.clear();
    if (reduced) {
      scrollTo({ top: 0, behavior: 'instant' }); o.snapHero(0);
      say('loop'); resetLap(true);
      seam = { kind: 'exit', phase: 'lock', t0: t, holdY: 0 }; setState('seam'); say('seam');
      return;
    }
    current();
    seam = { kind: 'exit', phase: 'in', t0: t, holdY: Math.round(top + LOOP_START * screenPx()) };
    setState('seam'); say('seam');
    carousel.seam('in', 0);
  }
  /**
   * The wrap lands under full cover: the page at scene 5's position with the hero's followers snapped, the carousel at
   * scene 5 drawn under the cloud. The state stays seam through the hold, the cover-out and the 400 ms lock (the lock's
   * end makes it world and sets data-scene), so no gesture reaches the page and the exit's trigger stays armed off.
   */
  function landWrap() {
    under = 'world';
    hall.entering(true);
    setScene(N - 1, true);
    const y = snap(sceneQ(N - 1));
    o.snapHero(y);
    syncMotion();
    armUnlock();
    loadRest(N - 1);
  }
  /** after a wrap the five elements are unlocked again on the visitor's next gesture (a wrap is no press: iOS has had no gesture on them) */
  function armUnlock() {
    unlockOff?.();
    if (!video) return;
    const once = () => { unlockOff?.(); video.unlock(); };
    unlockOff = () => { unlockOff = null; for (const e of UNLOCK_EVENTS) removeEventListener(e, once); };
    for (const e of UNLOCK_EVENTS) addEventListener(e, once, { passive: true });
  }
  function seamFrame(t: number, s: Seam): number {
    const e = t - s.t0;
    switch (s.phase) {
      case 'wait':   // the wrap before the cloud's pass is compiled, at most 1.5 s
        if (cloudReady || e >= SEAM.waitS) { s.phase = 'in'; s.t0 = t; carousel.seam('in', 0); }
        return 0;
      case 'in': {
        const k = clamp01(e / SEAM.inS);
        carousel.seam('in', k);
        if (s.kind === 'exit') {   // the scroll held at LOOP_START by snapping each frame
          if (Math.abs(scrollY - s.holdY) > 0.5) scrollTo({ top: s.holdY, behavior: 'instant' });
          follow.snap(LOOP_START); q = qAll = qRaw = prevRaw = LOOP_START;
        }
        if (k >= 1) {
          if (s.kind === 'exit') { scrollTo({ top: 0, behavior: 'instant' }); o.snapHero(0); say('loop'); resetLap(true); s.phase = 'out'; }
          else { landWrap(); s.phase = 'hold'; }
          s.t0 = t;
        }
        return cloudCover('in', k);
      }
      case 'hold':   // full cover until dawn's still is resident, at most 1.5 s more
        carousel.seam('in', 1);
        if (resident(N - 1) || e >= SEAM.holdS) { s.phase = 'out'; s.t0 = t; say('wrap'); }
        return 1;
      case 'out': {
        const k = clamp01(e / SEAM.outS);
        carousel.seam('out', k);
        if (k >= 1) { s.phase = 'lock'; s.t0 = t; carousel.seam(null, 0); return 0; }
        return cloudCover('out', k);
      }
      case 'lock':
        if (e >= SEAM.lockS) { seam = null; setState(under); if (under === 'world' && root) root.dataset.scene = String(scene()); }
        return 0;
    }
  }

  // ---- the product's look: a pressed pointer or a finger on the stage (section-4-flux.md 4; X-14)
  const onDown = (e: PointerEvent) => { if (state !== 'world' || !inRoom) return; pressed = true; lookX = (e.clientX / innerWidth) * 2 - 1; lookY = 1 - (e.clientY / innerHeight) * 2; };
  const onMove = (e: PointerEvent) => { if (!pressed) return; lookX = (e.clientX / innerWidth) * 2 - 1; lookY = 1 - (e.clientY / innerHeight) * 2; };
  const onUp = () => { pressed = false; };
  addEventListener('pointerdown', onDown, { passive: true }); addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerup', onUp, { passive: true }); addEventListener('pointercancel', onUp, { passive: true }); addEventListener('blur', onUp);

  const island: RoomIsland = {
    snap,
    enter() {
      if (state !== 'hall' || !hall.ready || poster() || seam) return false;
      video?.unlock();   // the five elements unlocked in the press's own task, the gesture iOS counts, whether the entry starts now or waits on scene 1's parts
      if (worldReady()) { startEnter(); return true; }
      pendingEnter = true; void loadScenes();
      if (q < ROOM_SCREENS.wipe + ROOM_SCREENS.walk) snap(STATION_Q);
      return false;
    },
    skip() { if (state === 'entering') endNow = true; },
    step: (dir) => api.stepScene(dir),
    back: () => api.back(),
    wrap: () => api.wrap(),
    motion(on) { motionOn = on; syncMotion(); },
    setHover(i) { hover = i; holdSway = i === -2; },
  };
  window.__skreedRoom = island;

  const api: RoomDirector & Partial<RoomHooks> = {
    hall,
    get state() { return state; },
    begin(ratio) {
      if (!root) return;
      current();
      const rTop = top - scrollY;
      inRoom = rTop < innerHeight && rTop + height > 0;
      qRaw = -rTop / screenPx();
      follow.update(qRaw, ratio);
      // q drives the walk and waits for the hall
      qAll = Math.max(0, follow.b);
      q = hall.ready ? qAll : 0;
    },
    step(f) {
      const P = params();
      lastT = f.t;
      refreshTune(P);
      if (root && LOOPS_DECLINED && root.dataset.pause !== '1') root.dataset.pause = '1';
      if (poster()) return { on: false, tex: null, wipeIn: 0, groundNeeded: false, cover: 0, cloud: null, toneDark: false };
      // phase 2 during the walk, past the third wipe (spec 5, "Loading")
      if (hall.ready && inRoom && q > ROOM_SCREENS.wipe && state === 'hall') void loadScenes();
      // the exit seam: the raw scroll crossing LOOP_START downward in world or hall
      const crossed = prevRaw < LOOP_START && qRaw >= LOOP_START;
      prevRaw = qRaw;
      if (crossed && (state === 'hall' || state === 'world') && inRoom) startExit(f.t);
      // a seam first: its phase sets the carousel's cloud for this frame's draw, and may change the state (the exit's jump, the wrap's landing)
      const cover = seam ? seamFrame(f.t, seam) : 0;
      // what the frame carries: the hall, the entry, the way back or the scenes (a seam keeps the frame it began over, X-15)
      const source = frameSource(state, under), drawHall = source === 'hall';
      // the third wipe waits for the hall; if it becomes ready while the section is in view it plays over a second (never
      // over the scenes: a wrap that lands before the hall is in shows dawn whole, and the hall's reveal plays on the way back)
      if (hall.ready && !wasReady) { wasReady = true; revealAt = qRaw > 0.02 && !reduced ? f.t : -1; snapped = true; }
      const clock = revealAt < 0 ? 1 : clamp01((f.t - revealAt) / 1.0);
      const wipeIn = source === 'scenes' ? 1 : hall.ready ? Math.min(clamp01(q / ROOM_SCREENS.wipe), clock) : 0;
      // the head: the pointer's sway on laptops in the hall only (held while the pointer is over the prompt), the keys' turn, the drag
      const sway = f.touch || reduced ? 0 : 1, extra = window.__skreedRoomLook;
      if (!holdSway) {
        const ty = (f.pointer.active ? f.pointer.ndc.x * P.lookYaw : 0) * sway, tp = (f.pointer.active ? f.pointer.ndc.y * P.lookPitch : 0) * sway;
        look.yaw = lerpFPS(look.yaw, ty, f.mouseRate, f.ratio); look.pitch = lerpFPS(look.pitch, tp, f.mouseRate, f.ratio);
      }
      const keyYaw = (extra?.yaw ?? 0) + (P.mouseLook >= 0.5 ? extra?.drag ?? 0 : 0), headYaw = look.yaw + keyYaw;
      const end = HALL.door.face + Math.min(HALL.promptFrom - 0.05, Math.max(0.6, P.stationDist));
      let tex: Texture | null = null, toneDark = false, nearDoor = 0, prompt: { x: number; y: number } | null = null;
      let on = hall.ready && inRoom && q > 0;

      if (drawHall) {
        const walk = clamp01((q - ROOM_SCREENS.wipe) / ROOM_SCREENS.walk);
        // reduced motion: four cuts, the start, the middle, just inside the prompt's range and the station (section-4.md 4)
        const w3 = (HALL.start - (HALL.door.face + HALL.promptFrom - 0.05)) / (HALL.start - end);
        const w2 = reduced ? (walk < 0.33 ? 0 : walk < 0.66 ? 0.5 : walk < w3 ? w3 : 1) : walk;
        // the walk is clamped at 1.0 m per second (section-4.md 2), except across a snap, the hall's arrival, the jump and the cuts
        const xT = HALL.start + (end - HALL.start) * w2, mx = 1.0 * f.dt;
        x = snapped || reduced ? xT : x + Math.max(-mx, Math.min(mx, xT - x));
        snapped = false;
        nearDoor = clamp01((HALL.promptFrom - (x - HALL.door.face)) / (HALL.promptFrom - (end - HALL.door.face)));
        lastNear = nearDoor;
        if (pendingEnter && (nearDoor <= 0 || !inRoom)) { pendingEnter = false; say('unbusy'); }   // the visitor walked away from a waiting press
        if (on && (state === 'hall' || hallStale)) {
          hall.swing(0, P.door);
          hall.update(x, { yaw: headYaw, pitch: look.pitch, anchorYaw: keyYaw }, nearDoor, f.t, P);
          hall.render(); hallStale = false;
          if (state === 'hall') prompt = hall.project(HALL.door.handle);
        }
        tex = hall.out;
      } else if (source === 'entering') {
        // the entry clock: the press's frames from 0, the hall's swing and glide, the bubble over the carousel at scene 1
        if (seekT >= 0) entryT = seekT; else entryT += f.dt;
        const t = entryT;
        const sw = reduced ? 0 : 1 - Math.pow(1 - clamp01(t / PRESS.swing), 3);
        const dolly = reduced ? 0 : easeInOutCubic(clamp01((t - PRESS.glideFrom) / PRESS.glide)) * PRESS.dolly;
        hall.swing(sw, P.door);
        hall.update(end - dolly, { yaw: 0, pitch: 0 }, 1, f.t, P);
        // the hall draws until its glide ends (the first frame only under still3d), then its last frame is reused
        if (inRoom && (!hallFrozen || hallStale)) { hall.render(); hallStale = false; if (t >= (reduced ? 0 : PRESS.freeze)) hallFrozen = true; }
        tex = hall.out;
        if (inRoom && reduced) {
          // still3d: a 600 ms dissolve from the hall to scene 1 at rest
          carousel.scissor(null); carousel.update(f.t, f.dt, curW, curH);
          const d = hall.out ? trans.dissolve(hall.out, carousel.out, t * 1000) : 1;
          tex = d >= 1 ? carousel.out : trans.out;
          toneDark = d >= 0.5 && sceneTone();
          if ((d >= 1 && seekT < 0) || endNow) finishEnter();
        } else if (inRoom) {
          const ms = (t - BUBBLE.start) * 1000;
          if (ms >= 0) {
            const b = bubbleAt(ms, P.bubbleMs, { w: curW, h: curH });
            // the carousel's draw scissored to the bubble's bounding box while it is small (origin bottom left, a 2 px pad)
            const r = Math.ceil(b.reach) + 2;
            carousel.scissor(b.done || 2 * r >= Math.max(curW, curH) ? null : { x: Math.max(0, Math.floor(b.cx - r)), y: Math.max(0, Math.floor(curH - b.cy - r)), w: 2 * r, h: 2 * r });
            carousel.update(f.t, f.dt, curW, curH);
            if (b.done || !hall.out) tex = carousel.out;
            else { trans.bubble(hall.out, carousel.out, ms, P.bubbleMs); tex = trans.out; }
            toneDark = b.done && sceneTone();
            if ((b.done && seekT < 0) || endNow) finishEnter();
          } else if (endNow) finishEnter();
        } else if (endNow) finishEnter();
        on = inRoom;
      } else if (source === 'back') {
        // the way back: the bubble's clock runs down over half of bubbleMs while the hall renders live, its outside fading with the circle
        backT += f.dt;
        const p = clamp01(backT / ((P.bubbleMs * 0.5) / 1000)), ms = P.bubbleMs * (1 - p), ht = PRESS.freeze * (1 - p);
        const sw = 1 - Math.pow(1 - clamp01(ht / PRESS.swing), 3), dolly = easeInOutCubic(clamp01((ht - PRESS.glideFrom) / PRESS.glide)) * PRESS.dolly;
        hall.swing(sw, P.door);
        hall.update(end - dolly, { yaw: 0, pitch: 0 }, 1, f.t, P);
        if (inRoom) {
          hall.render(); hallStale = false;
          const b = bubbleAt(ms, P.bubbleMs, { w: curW, h: curH }), r = Math.ceil(b.reach) + 2;
          carousel.scissor(2 * r >= Math.max(curW, curH) ? null : { x: Math.max(0, Math.floor(b.cx - r)), y: Math.max(0, Math.floor(curH - b.cy - r)), w: 2 * r, h: 2 * r });
          carousel.update(f.t, f.dt, curW, curH);
          if (hall.out) { trans.bubble(hall.out, carousel.out, ms, P.bubbleMs, clamp01(b.R / b.rEnd)); tex = trans.out; } else tex = carousel.out;
        }
        on = inRoom;
        if (p >= 1) { toHall(); snap(STATION_Q); say('back'); tex = hall.out; }
      } else {
        // the scenes: world, or a seam over them (the exit's cover-in from scene 5; the wrap's hold, cover-out and lock), the
        // carousel's frame holding under the cloud (X-15). In world: the reset when the raw position leaves the range
        // downward (the scrollbar), the re-sync from the page's position, the step's end snap, the product's look
        if (state === 'world' && !seam) {
          const eps = 2 / screenPx();
          if (lastRaw >= WORLD_START - eps && qRaw < WORLD_START - eps && stepTo < 0) { toHall(); say('back'); }
          else if (!carousel.busy() && stepTo < 0 && qRaw >= WORLD_START - eps && qRaw <= SCENES_END + eps) {
            const want = Math.max(0, Math.min(N - 1, Math.round((qRaw - WORLD_START) / ROOM_SCREENS.step)));
            if (want !== scene()) { setScene(want); sayScene(want); }
          }
        }
        if (state === 'world' && stepTo >= 0 && scene() === stepTo) {   // the tween ended this frame: the page snapped to the scene's q
          const to = stepTo; clearStep();
          if (root) root.dataset.scene = String(to);
          if (inRoom) snap(sceneQ(to));
          sayScene(to);
        }
        const live = state === 'world';
        carousel.look(live ? lookX : 0, live ? lookY : 0, live && pressed);
        carousel.scissor(null); carousel.update(f.t, f.dt, curW, curH); tex = carousel.out; toneDark = sceneTone();
        on = inRoom && qRaw > 0;   // not the hall's q: a wrap may land before the hall is in
      }
      // a seam over the hall's frame, or over the hero after the exit's jump: the carousel steps for the cloud alone
      if (state === 'seam' && drawHall) { carousel.look(0, 0, false); carousel.scissor(null); carousel.update(f.t, f.dt, curW, curH); }
      if (HOOKS && seam && seam.phase === 'in') seamDraws.add(source);
      lastRaw = qRaw;

      // the hand-off from the fog (Tune: handoff): 0 the composite's ice-shard cut, 1 a cut at half the screen, 2 a fade
      const handoff = P.handoff >= 1.5 ? 'fade' : P.handoff >= 0.5 ? 'cut' : 'wipe';
      // (in the hall, and in the scenes too when the visitor scrolls back up to the quiz: the third wipe from the scene)
      const handing = state !== 'entering' && state !== 'back';
      let wipe = handing ? wipeIn : 1;
      const groundNeeded = handing && wipeIn < 1;
      if (handing && handoff === 'cut') wipe = wipeIn >= 0.5 ? 1 : 0;
      if (handing && handoff === 'fade' && wipeIn < 1 && f.fog && tex) { const m = getMix(); m.plain(f.fog, tex, wipeIn); tex = m.out; wipe = 1; }
      const sc = scene();
      const stepping = state === 'world' && stepTo >= 0;
      window.__skreedRoomFrame?.({
        q, qRaw, x, nearDoor, ready: hall.ready, failed: hall.failed, inView: inRoom && qRaw > 0, prompt, state, under,
        worldReady: worldReady(), entry: state === 'entering' ? entryT : 0,
        scene: sc, stepping, stepTo: stepping ? stepTo : -1,
        loading: !!video && state === 'world' && (loopState[sc] === 'idle' || loopState[sc] === 'fetching'),
        note: import.meta.env.PUBLIC_TUNE === '1' && !!video && video.refused(sc) ? 'refused' : null,
        cover, jumped,
      } satisfies RoomFrame);
      jumped = false;
      return { on: on && !!tex, tex: on ? tex : null, wipeIn: wipe, groundNeeded, cover, cloud: cover > 0 ? carousel.cloud : null, toneDark };
    },
    reset() { resetLap(false); },
    resize(w, h) {
      curW = w; curH = h; hall.resize(w, h); trans.resize(w, h); mix?.resize(w, h); carousel.resize(w, h, o.dpr); measure();
      hallStale = true;
      if (!clsFixed) cls = w < h ? 'portrait' : 'wide';   // the loop class until the first fetch began (X-10)
    },
    // the hall, then the bubble's program compiled in the section's own warm-up (not on the press)
    load() { return hall.load().then(() => { if (hall.ready && hall.out) trans.plain(hall.out, hall.out, 0.5); }); },
    warmCloud() { return carousel.warmCloud().then(() => { cloudReady = true; }); },
    inRange() {
      if (state !== 'world' || !measured) return false;
      current();
      const r = (scrollY - top) / screenPx(), eps = 2 / screenPx();
      return r >= WORLD_START - eps && r <= SCENES_END + eps;
    },
    edge(dir) { const i = scene(); return dir > 0 && i >= N - 1 ? 'forward' : dir < 0 && i <= 0 ? 'back' : null; },
    stepScene(dir) {
      if (state !== 'world' || seam || stepTo >= 0) return false;
      const from = scene();
      if (!carousel.requestStep(dir)) return false;
      stepFrom = from; stepTo = from + dir;
      if (root) root.dataset.step = '1';
      window.dispatchEvent(new CustomEvent('skreed:room-step', { detail: { from, to: stepTo } }));
      return true;
    },
    back() {
      if (state !== 'world' || seam || carousel.busy() || scene() !== 0) return false;
      if (reduced) { toHall(); snap(STATION_Q); say('back'); return true; }
      backT = 0; hallFrozen = false; hallStale = true;
      hall.entering(true);
      setState('back');
      return true;
    },
    wrap() {
      if (state !== 'hall' && state !== 'world') return false;
      if (seam || pendingEnter) return false;
      seamDraws.clear();
      void api.load(); void api.warmCloud();
      if (reduced) { landWrap(); seam = { kind: 'wrap', phase: 'lock', t0: lastT, holdY: 0 }; setState('seam'); say('seam'); say('wrap'); return true; }
      seam = { kind: 'wrap', phase: cloudReady ? 'in' : 'wait', t0: lastT, holdY: 0 };
      setState('seam'); say('seam');
      if (seam.phase === 'in') carousel.seam('in', 0);
      return true;
    },
    lock: () => state === 'entering' || state === 'back' || state === 'seam',
    busy: () => carousel.busy(),
    hooks() {
      if (!HOOKS) return {};   // hooks builds only: folded away in production
      const P = params();
      return {
        state, under, draws: frameSource(state, under), seamDraws: [...seamDraws], scene: scene(), step: +carousel.step().toFixed(3), front: carousel.front(), busy: carousel.busy(), lock: api.lock(), inRange: api.inRange(),
        seam: seam ? { kind: seam.kind, phase: seam.phase } : null, q: +q.toFixed(3), qRaw: +qRaw.toFixed(3), screens: ROOM_SCREENS,
        entry: +entryT.toFixed(3), arrive: reduced ? BUBBLE.dissolveMs / 1000 : BUBBLE.start + P.bubbleMs / 1000, worldReady: worldReady(),
        products: productsState, loops: loopState.map((s, i) => ({ i, state: s, in: !!video && video.in(i), refused: !!video && video.refused(i), playing: !!video && video.playing(i) })),
        stills: stillDone.map((d, i) => ({ i, settled: d, loading: !!stillJob[i] })), cls, video: !!video, cloudReady, memory: carousel.memory(),
        sceneQ: Array.from({ length: N }, (_, i) => sceneQ(i)), loopStart: LOOP_START, hall: hall.hooks(),
        layout: lay.layout ? { ...lay.layout } : null, product: carousel.place(),
      };
    },
    dispose() {
      disposed = true; ac.abort();
      unlockOff?.();
      lay.dispose();
      removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp); removeEventListener('blur', onUp);
      video?.dispose(); carousel.dispose();
      hall.dispose(); trans.dispose(); mix?.dispose();
      if (window.__skreedRoom === island) window.__skreedRoom = undefined;
    },
  };
  // the review and test hooks (spec 5; hooks builds only, folded away in production): the entry by its clock, a scene at rest
  if (HOOKS) Object.assign(api, {
    enterNow: () => island.enter(),
    seek(sec: number) {
      if (sec < 0) { if (state === 'entering' && seekT >= 0) { entryT = seekT; seekT = -1; } return; }   // a negative time lets the clock run on from where it is held
      if (state === 'hall') { if (!worldReady()) return; startEnter(); }
      if (state !== 'entering') return;
      hallFrozen = false; hallStale = true;
      const arrive = reduced ? BUBBLE.dissolveMs / 1000 : BUBBLE.start + params().bubbleMs / 1000;
      if (sec >= arrive) { seekT = -1; entryT = sec; endNow = true; } else seekT = sec;
    },
    scene(i: number) {
      if (i < 0 || i >= N) return false;
      if (state === 'hall' && worldReady()) startEnter();
      if (state === 'entering') finishEnter();
      if (state !== 'world') return false;
      clearStep();
      setScene(i, true); snap(sceneQ(i)); sayScene(i);
      return resident(i);
    },
    lights: (o: Partial<LightSetting>) => carousel.lights(o),
    shade: (dark: number, height?: number, solid?: number) => carousel.shade(dark, height, solid),
  } satisfies RoomHooks);
  return api;
}
