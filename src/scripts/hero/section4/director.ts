// Section 4's director (docs/specs/section-4-flux.md 2, 4 and 5 for the scenes; docs/specs/section-4-no-hall.md since
// 2026-11-02, when the hall, the door and the bubble left): the section's state (approach, world), its progress q
// in screens of its own height through two followers, the third wipe from the fog straight to scene 1, the five scenes
// on the carousel (carousel.ts) with their loops (video.ts), the arrival's hold and the hooks.
// - The approach: under scene 1's q the carousel draws scene 1 at rest and the composite's third wipe (q 0 to 1) takes
//   the quiz's fog away to it. The wipe waits for scene 1 to be drawable (its still or its loop); if it becomes so while
//   the section is on screen, the wipe plays in over a second.
// - The arrival: the raw position at scene 1's q (within 2 px) or past it, once scene 1 can be drawn, makes the state
//   world, always at scene 1. A page the visitor's own scroll carried past it (a fling from the quiz, a key, the
//   scrollbar, a scroll made while scene 1 loaded) is put back on it and held there against the momentum: an instant
//   scrollTo each frame it has run past it, until 150 ms without one, at most 1.2 s, ended by the visitor's next touch,
//   press, key or upward wheel (a held key's repeat is the key that carried the page in, not a new one, and renews the
//   hold as the carrying wheel's events do); a finger still down defers the hold to its release. The stage is pinned over the whole
//   range, so the scroll's return shows nothing but scene 1 staying; under a hold the scene never re-syncs and the exit
//   never fires. Without the hall's walk a fling would otherwise coast through the five scenes into the cut. Under
//   scene 1's q again (the page's own scroll up from scene 1, the scrollbar) the state is approach, scene 1 again.
// - In world a gesture (scroll.ts, through the adapter hero.ts builds) is one whole step on the carousel's own tween;
//   the page's scroll is snapped to the scene's q when the step ends. A position change without a gesture (the
//   scrollbar) re-syncs the scene. A gesture at either edge (back at scene 1, on at scene 5) is the page's.
// - No exit seam (2026-11-03, Sam: "remove the loop"): the page ends at section 5. The fourth wipe (docs/specs/section-5.md 2)
//   from q 3.8 over one screen: the composite cuts from the scenes onto section 5's ground, the first wipe's cut; this
//   director reports its progress (wipeOut) and the frame holds still under it. No wrap from the top either
//   (2026-11-04, Sam: "i cant go to the bottom of the site from the top section, remove that trick";
//   docs/specs/scroll-steps.md 2): the cloud's cover, its seam and the state seam left with it. Every state change is
//   reported to the wiring (onState), which re-evaluates the page scroll's capture set.
// - Loading runs in phases, one compile, upload or decode a frame: when the quiz or the section nears (load, phase 1)
//   the carousel's programs and scene 1's still; once the section is open (phase 2) products.bin and scene 1's loop,
//   with the loop elements' unlock armed for the visitor's next gesture (no press gives iOS one now); on arrival the
//   other loops one at a time, 2 to 5, each still before its loop.
// The section's layout is cached (layout.ts: its document top and height, re-read when html's class changes, when the
// document, the quiz or the section changes size, and on resize; a reading taken under the intro's layout is replaced
// once the intro ends), so a frame reads only scrollY and never forces layout under the quiz. The DOM side
// (scripts/room/walk.ts) gets one frame object per step through window.__skreedRoomFrame and drives the scene through
// window.__skreedRoom.
import { LinearFilter, NoColorSpace, Texture, type WebGLRenderer } from 'three';
import { PRODUCTS_BIN_URL, ROOM_BACKDROP, ROOM_HEIGHT, ROOM_LOOPS, ROOM_SCENES, ROOM_SCREENS, SCENE_COUNT, SCENES_END, WIPE4_START, WORLD_START, liveRoomParams, sceneQ, type RoomFrame, type RoomIsland, type RoomParams, type RoomState, type SceneClass } from '../../../config/room.ts';
import { createScrollFollower } from '../scroll/scrollMap.ts';
import { clamp01 } from '../util/math.ts';
import { createTransition, type TransitionPass } from './transition.ts';
import { createCarousel, type Carousel, type CarouselTune, type LightSetting, type SceneDef } from './carousel.ts';
import { STEP } from './carousel-math.ts';
import { allowed, create as createPool, type VideoPool } from './video.ts';
import { fetchProductsBin } from './products-bin.ts';
import { watchLayout } from './layout.ts';

export interface RoomStepIn { t: number; dt: number;
  /** section 3's fog ground, the third wipe's near side (the 'fade' hand-off mixes from it) */
  fog: Texture | null }

/** what the composite draws for the section this frame */
export interface RoomPlan {
  /** the section draws this frame (on screen past its top, and scene 1 drawable during the approach) */
  on: boolean;
  /** the carousel's frame (or, under the 'fade' hand-off, its mix with the fog) */
  tex: Texture | null;
  /** the third wipe's progress (fog to the section) */
  wipeIn: number;
  /** the fourth wipe's progress (the section to section 5's frame, section-5.md 2): loop.ts cuts the composite by it */
  wipeOut: number;
  /** the fog ground is still on screen (the third wipe, or the fade, has not finished) */
  groundNeeded: boolean;
  /** a seam's cloud cover, 0 to 1, and its texture: always 0 and null since the wrap left (2026-11-04); the composite's blend stays for a seam to come */
  cover: number;
  cloud: Texture | null;
  /** the logotype (and the section index, which copies its tone) over the section: the front scene's own tone (ROOM_SCENES toneDark, measured on the stills) */
  toneDark: boolean;
}

export interface RoomDirector {
  readonly state: RoomState;
  /** what the quiz's ride waits for (quiz-gate.md D4, as section-4-no-hall.md 2 has it): scene 1 drawable or failed, and products.bin in or failed */
  settled(): boolean;
  /** before the hero's part of the frame: the section's progress */
  begin(ratio: number): void;
  /** the scene work of the frame: update and render the carousel; the plan for the composite */
  step(f: RoomStepIn): RoomPlan;
  /**
   * the page jumped by other means (the section index, a family page's Back to top restoring section 1): every clock
   * stops, and the next lap starts as the exit's does; with y, the page's new position, a landing inside the section
   * (the index's Products, at q 1) has the section's followers snapped there too, so the third wipe is not played again
   */
  reset(y?: number): void;
  resize(w: number, h: number): void;
  /** phase 1 when the quiz or the section nears (the carousel's programs, scene 1's still), and phase 2 once the section is open (products.bin, scene 1's loop); called again by the quiz's unlock */
  load(): Promise<void>;
  // the adapter for scroll.ts (section-4-flux.md 5, "Capture, by state and position")
  /** the raw position within 2 px of [q 1, q 3] in world */
  inRange(): boolean;
  /** a gesture in that direction meets an edge the page takes: scene 5 forward, scene 1 back */
  edge(dir: 1 | -1): boolean;
  /** one whole step; false when refused (busy, an edge, the next scene's still not resident) */
  stepScene(dir: 1 | -1): boolean;
  /** a forward wheel event the page cannot cancel (scroll.ts): the page held on the scene's q while they come, the arrival's hold renewed or begun there */
  carried(): void;
  /** a step runs or its 150 ms cooldown */
  busy(): boolean;
  hooks(): Record<string, unknown>;
  dispose(): void;
}

export interface DirectorOptions {
  renderer: WebGLRenderer; avif: boolean; reduced: boolean;
  /** the canvas's pixel ratio (the cloud's target is capped at 1.5) */
  dpr: number;
  /** every state change, as it happens (an arrival changes the state with no gesture, so the page scroll re-evaluates its capture set from here) */
  onState?(state: RoomState): void;
  /** every reading of the section's layout (the intro ending, the document growing, a resize): the page scroll re-evaluates its range from here */
  onLayout?(): void;
  /** section 5 (section-5.md 5): the exit seam's trigger in document px (its body's end at the viewport's bottom; NaN before section 5 has a reading) */
  exitY(): number;
  /** section 5's rest, document px (NaN before a reading): the fourth wipe ends there when it comes first */
  restY(): number;
}

/** the review hooks beyond hooks() (hero.ts installs them as window.__s4 in hooks builds) */
export interface RoomHooks {
  /** scene i at rest with the page at its position; true once its still or loop is resident */
  scene(i: number): boolean;
  /** the carousel's lights set live (the product check, AC2); the values in force */
  lights(o: Partial<LightSetting>): LightSetting;
  /** the bottom shade set live (AC12's tuning): how dark at the bottom edge, where it clears and up to where it stays solid, shares of the frame's height */
  shade(dark: number, height?: number, solid?: number): void;
}

type LoopState = 'idle' | 'fetching' | 'in' | 'failed';

const N = SCENE_COUNT;
/** the arrival's hold (section-4-no-hall.md 2 and D3): over once the page has not run past scene 1 for stillS, at most maxS after the start or the carrying wheel's latest event */
const HOLD = { stillS: 0.15, maxS: 1.2 };
/** E-S4-loops is pending: the "Pause motion" control (walk.ts) shows only once Sam declines it (the director sets data-pause) */
const LOOPS_DECLINED = false;
const TIMEOUT_MS = 20_000;
const HOOKS = import.meta.env.PUBLIC_HERO_HOOKS === '1';
/** the visitor's next gesture unlocks the loop elements (spec 5, "Video policy"; AC7): from the section's opening */
const UNLOCK_EVENTS = ['pointerup', 'touchend', 'keydown'] as const;
/** what ends the arrival's hold at once (an upward wheel only: a downward one is captured for a step, or is the input that carried the page in, which renews the hold; a held key's repeat is that input too, never a new key) */
const LET_GO_EVENTS = ['touchstart', 'pointerdown', 'keydown', 'wheel'] as const;

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
  let mix: TransitionPass | null = null, curW = 1, curH = 1;   // the 'fade' hand-off (Tune only): a straight mix, made on first use
  const getMix = () => (mix ??= (() => { const m = createTransition(renderer); m.resize(curW, curH); return m; })());
  const follow = createScrollFollower();
  let state: RoomState = 'approach', under: 'approach' | 'world' = 'approach', disposed = false;
  const ac = new AbortController();
  const H = document.documentElement;
  // the section's layout, cached (layout.ts): its top in document pixels and its height; a reading under the intro's
  // layout is replaced when the intro ends, and the page scroll hears of every reading
  let top = 0, height = 1, measured = false;
  const lay = watchLayout({
    html: H,
    // null while the quiz gate holds the section hidden (quiz-gate.md D5): a hidden section's rect is all zeros and would
    // read as { top: scrollY, height: 1 }, a section that is not there; the section's ResizeObserver reads it as it opens
    read: () => { if (!root || root.hasAttribute('data-locked')) return null; const r = root.getBoundingClientRect(); return { top: r.top + scrollY, height: r.height }; },
    watch: [root, document.getElementById('find'), H],
    onMeasure: (l) => { top = l.top; height = l.height; measured = true; o.onLayout?.(); },
  });
  const measure = () => { lay.measure(); };
  /** the layout for this frame: a reading under the intro is read again once the intro has ended */
  const current = () => { if (!measured) measure(); else lay.get(); };
  const poster = () => root?.dataset.tier === 'poster' || !H.classList.contains('hero3d') || H.classList.contains('poster');
  const locked = () => !!root?.hasAttribute('data-locked');
  const say = (detail: string) => window.dispatchEvent(new CustomEvent('skreed:room-state', { detail }));
  const sayScene = (i: number) => window.dispatchEvent(new CustomEvent('skreed:room-scene', { detail: { i } }));
  /** scene 1 cannot be drawn: the stills and the column stand in, the island stops drawing the section */
  const toPoster = () => { if (root) root.dataset.tier = 'poster'; };
  const params = (): RoomParams => liveRoomParams();
  const screenPx = () => height / ROOM_HEIGHT;
  /** the document y of the section's position q */
  const yAt = (qq: number) => Math.round(top + qq * screenPx());

  // the per-frame values
  let q = 0, qRaw = 0, prevRaw = 0, seenRaw = false, inRoom = false, jumped = false, revealAt = -1, wasReady = false, drawn = false, lastWipeOut = 0;
  // the step under way (from and to), the motion control
  let stepFrom = -1, stepTo = -1, motionOn = true;
  // the one-shot unlock of the loop elements, armed from the section's opening
  let unlockOff: (() => void) | null = null;
  // the arrival's hold (its y, its start and its last snap on the frame clock, and whether a wheel event of the input that
  // carried the page in came since the last frame), a hold waiting for a finger's release and the y it takes there, the
  // fingers down
  let hold: { y: number; t0: number; last: number; renew: boolean } | null = null, pendingHold = false, holdAt: number | null = null, fingers = 0;
  // the product's look from the mouse's place or a pressed finger (E-S4-hover)
  let pressed = false, aimed = false, lookX = 0, lookY = 0;

  // ---- the loop class, the loop elements, the stills and the carousel
  let cls: SceneClass = 'wide', clsFixed = false;
  // the pictures version (Sam's still backgrounds, 2026-11-04, config/room.ts ROOM_BACKDROP) has no loops: the stills alone
  const video: VideoPool | null = ROOM_LOOPS && !reduced && allowed() ? createPool(N) : null;
  const loopState: LoopState[] = Array.from({ length: N }, () => 'idle');
  const stillJob: (Promise<unknown> | null)[] = Array.from({ length: N }, () => null), stillDone: boolean[] = Array.from({ length: N }, () => false), stillOk: boolean[] = Array.from({ length: N }, () => false);
  let stillChain: Promise<unknown> = Promise.resolve(), loopChain: Promise<unknown> = Promise.resolve();
  let productsState: LoopState = 'idle', productsJob: Promise<void> | null = null, phase1: Promise<void> | null = null, phase2 = false;
  /** scene i's still: fetched and decoded one at a time (one decode a frame), a new texture each call; null where it failed (the plane is black then); a still that failed never fails the ones queued after it */
  function loadStill(i: number): Promise<Texture | null> {
    const f = ROOM_SCENES[i].files[cls], url = o.avif ? f.avif : f.webp;
    stillOk[i] = false;
    const job = (stillChain = stillChain.catch(() => null).then(() => decodeStill(url, ac.signal))).then(
      (t) => { if (disposed) { (t as Texture | null)?.dispose(); return null; } stillOk[i] = !!t; return t as Texture | null; },
      (e: unknown) => { if (!disposed) console.warn(`section 4: scene ${ROOM_SCENES[i].id}'s still did not load; its plane stays black`, e); return null; },
    ).finally(() => { stillDone[i] = true; if (stillJob[i] === job) stillJob[i] = null; if (i === 0) afterFirst(); });
    stillJob[i] = job;
    return job;
  }
  const tuneObj: CarouselTune = { stepMs: STEP.ms, sweepDeg: STEP.sweepDeg, sweepDegPortrait: STEP.sweepDegPortrait, fovStep: STEP.fovStep, fovReturnAt: STEP.fovReturnAt, lightStart: 0.5, lightSoft: 0.64, lightBoost: 0.17, keyLightMs: STEP.keyLightMs };
  const refreshTune = (P: RoomParams) => { tuneObj.stepMs = P.stepMs; tuneObj.sweepDeg = P.sweepDeg; tuneObj.sweepDegPortrait = P.sweepDegPortrait; tuneObj.fovStep = P.fovStep; tuneObj.fovReturnAt = P.fovReturnAt; tuneObj.lightStart = P.lightStart; tuneObj.lightSoft = P.lightSoft; tuneObj.lightBoost = P.lightBoost; tuneObj.keyLightMs = P.keyLightMs; };
  const scenes: SceneDef[] = ROOM_SCENES.map((s, i) => ({ id: s.id, keyLight: s.keyLight, baseYaw: s.baseYaw, basePitch: s.basePitch, product: s.product, shade: s.hex, finish: s.finish, still: () => loadStill(i), loop: video ? i : null }));
  const carousel: Carousel = createCarousel({ renderer, scenes, video, cls, reduced, tune: () => tuneObj, dpr: o.dpr });
  /** the carousel's loops run only while it draws (the section on screen) and the control allows */
  const syncMotion = () => carousel.motion(motionOn && drawn);
  const setState = (s: RoomState) => { state = s; if (root) { root.dataset.state = s; if (s !== 'world') delete root.dataset.scene; } syncMotion(); measure(); o.onState?.(s); };
  /** the step under way is over or abandoned */
  const clearStep = () => { stepFrom = stepTo = -1; if (root) delete root.dataset.step; };
  const setScene = (i: number, instant = false) => { carousel.setScene(i, instant); if (root && state === 'world') root.dataset.scene = String(i); };
  const scene = () => carousel.scene();
  /** the scene the raw position stands on (the reference's 50 vh a step), clamped to the five */
  const sceneAt = (qq: number) => Math.max(0, Math.min(N - 1, Math.round((qq - WORLD_START) / ROOM_SCREENS.step)));
  /** the front scene's tone for the logotype (the front switches at eased 0.75 of a step, where the lights change over) */
  const sceneTone = () => ROOM_SCENES[carousel.front()]?.toneDark ?? false;
  /** scene i's still or loop has settled (a step may start toward it); a failed still counts, so a step is never refused for good */
  const resident = (i: number): boolean => stillDone[i] || (!!video && video.in(i));
  /** scene 1 can be drawn: its still decoded or its loop in (the third wipe waits for it) */
  const drawable0 = (): boolean => stillOk[0] || (!!video && video.in(0));
  /** scene 1 never will be: its still failed and so did its loop, or there is no loop to wait for */
  const failed0 = (): boolean => stillDone[0] && !stillOk[0] && !stillJob[0] && (!video || loopState[0] === 'failed');
  /** the quiz's ride may go: scene 1 drawable or failed, and products.bin in or failed */
  const settled = () => (drawable0() || failed0()) && (productsState === 'in' || productsState === 'failed');
  /** scene 1's still or loop settled: where neither can draw it the section falls to the poster column */
  function afterFirst() { if (!disposed && failed0()) toPoster(); }

  // ---- loading
  /** scene i's loop streamed into its element (the class fixed from the first fetch, X-10) */
  async function fetchLoop(i: number): Promise<void> {
    if (!video || loopState[i] !== 'idle' || disposed) return;
    clsFixed = true; loopState[i] = 'fetching';
    const ok = await video.fetch(i, ROOM_SCENES[i].files[cls].loop, ac.signal);
    if (disposed) return;
    loopState[i] = ok ? 'in' : 'failed';
    if (i === 0) afterFirst();
  }
  /** the loops in order, one at a time, each after its still where one is on its way (spec 5, "Loading", phases 3 and 5) */
  const queueLoops = (order: readonly number[]) => { for (const i of order) loopChain = loopChain.then(() => stillJob[i] ?? null).then(() => fetchLoop(i)).catch(() => {}); };
  /** phase 1 (the quiz or the section nears): the carousel's programs and environment, scene 1's still alone (a visitor who never finishes the quiz pays for no more) */
  const warmUp = () => (phase1 ??= (async () => { carousel.prepare(0, false); await carousel.warm(); })());
  /** phase 2 (the section open): products.bin, the first scene's loop and its neighbour's still (a step waits on it), the loop elements' unlock armed */
  function openScenes(first = 0) {
    if (phase2 || disposed) return;
    phase2 = true;
    void warmUp();
    productsJob ??= (async () => {
      productsState = 'fetching';
      try { const p = await fetchProductsBin(PRODUCTS_BIN_URL, ac.signal); if (disposed) return; carousel.setProducts(p); productsState = 'in'; }
      catch (e) { if (disposed) return; console.warn('section 4: products.bin did not load; the scenes show without a product', e); productsState = 'failed'; }
    })();
    carousel.prepare(first);
    queueLoops([first]);
    armUnlock();
  }
  /** every scene's loop after arrival at scene i, the nearest first (2, 3, 4, 5 from scene 1; outward either way from any other) */
  const loadRest = (i: number) => { openScenes(i); queueLoops(Array.from({ length: N }, (_, k) => k).sort((a, b) => Math.abs(a - i) - Math.abs(b - i) || b - a)); };
  /** the loop elements are unlocked on the visitor's next gesture (no press gives iOS one: the section's opening arms it) */
  function armUnlock() {
    unlockOff?.();
    if (!video) return;
    const once = () => { unlockOff?.(); video.unlock(); };
    unlockOff = () => { unlockOff = null; for (const e of UNLOCK_EVENTS) removeEventListener(e, once); };
    for (const e of UNLOCK_EVENTS) addEventListener(e, once, { passive: true });
  }

  function snap(qq: number) {
    current();
    const y = yAt(qq);
    scrollTo({ top: y, behavior: 'instant' }); follow.snap(qq); q = qq; qRaw = prevRaw = qq;
    return y;
  }

  // ---- the arrival's hold (section-4-no-hall.md 2 and D3)
  // a downward wheel during the hold is the input that carried the page in (a deliberate one steps, and the step ends the
  // hold before this runs): a trackpad's gesture that the browser no longer lets the page cancel scrolls on natively, so the
  // hold lasts while it comes, its maxS counted from its latest event. A held key's auto-repeat is that input too, never
  // the new key that lets go: scroll.ts steps once per keydown and prevents a repeat in range, while the smooth scroll the
  // key's presses in the approach started is still in flight, so the hold lasts while the repeats come and keeps putting
  // the page back as that scroll runs on (section-4-no-hall.md AC3)
  const letGo = (e: Event) => {
    if (e.type === 'wheel' && (e as WheelEvent).deltaY >= 0) { if (hold) hold.renew = true; return; }
    if (e.type === 'keydown' && (e as KeyboardEvent).repeat) { if (hold) hold.renew = true; return; }
    endHold(); holdAt = null;
  };
  const onFinger = (e: TouchEvent) => {
    fingers = e.touches.length;
    // a hold deferred to the finger's release: the page put back on scene 1 then (the stage is pinned, so nothing moves on
    // screen: the finger's drag past scene 1 showed scene 1 throughout)
    if (fingers === 0 && holdAt === null && hold === null && pendingHold) { pendingHold = false; current(); holdAt = yAt(WORLD_START); }
  };
  addEventListener('touchstart', onFinger, { passive: true }); addEventListener('touchend', onFinger, { passive: true }); addEventListener('touchcancel', onFinger, { passive: true });
  function startHold(t: number, y: number) {
    endHold();
    hold = { y, t0: t, last: t, renew: false };
    for (const e of LET_GO_EVENTS) addEventListener(e, letGo, { passive: true });
    holdFrame(t);
  }
  /** the page held at the hold's y: put back each frame it has run past it, until stillS without that, at most maxS */
  function holdFrame(t: number) {
    if (holdAt !== null) { const y = holdAt; holdAt = null; startHold(t, y); return; }
    if (!hold) return;
    // the raw position follows the snap at once (the exit's trigger reads it this frame); the followers ease to it as to any scroll, so the wipe's last part is not cut
    if (scrollY > hold.y + 0.5) { scrollTo({ top: hold.y, behavior: 'instant' }); qRaw = (hold.y - top) / screenPx(); hold.last = t; }
    if (hold.renew) { hold.renew = false; hold.t0 = t; }
    if (t - hold.last >= HOLD.stillS || t - hold.t0 >= HOLD.maxS) endHold();
  }
  function endHold() {
    pendingHold = false;
    if (!hold) return;
    hold = null;
    for (const e of LET_GO_EVENTS) removeEventListener(e, letGo);
  }
  /**
   * The arrival at the scenes and the departure from them. The raw position at scene 1's q or past it in the approach,
   * once scene 1 can be drawn (until then the fog and the loading line stand, as they did for the hall), makes the state
   * world, always at scene 1: a page the visitor's own scroll carried past it (a fling, a key, the scrollbar, a scroll
   * made while scene 1 was still loading, a reload restored deep) is put back on it, at once or at the finger's release,
   * and held there; the stage is pinned over the whole range, so the scroll's return shows nothing but scene 1 staying.
   * Under scene 1's q again in world, with no step and no hold, the state is approach, the carousel at scene 1.
   */
  function arrival(t: number, eps: number) {
    const at = WORLD_START - eps;
    // never on a reading taken under the intro's layout (layout.ts: the section's top then stands thousands of pixels
    // short of its place, so a page the intro locks at 0 can read as past scene 1): the arrival waits for the real layout,
    // or scene 1 would be announced and its hint spent during the intro at 390 x 844 behind an open gate
    if (state === 'approach' && inRoom && qRaw >= at && drawable0() && !lay.layout?.intro) {
      setState('world'); under = 'world';
      if (scene() !== 0) setScene(0, true);
      if (root) root.dataset.scene = '0';
      if (fingers > 0) pendingHold = true; else startHold(t, yAt(WORLD_START));
      sayScene(0);
      loadRest(0);
    } else if (state === 'world' && !hold && holdAt === null && stepTo < 0 && !carousel.busy() && qRaw < at) {
      // the page's own scroll back above scene 1 (a finger that crossed it and came back before lifting drops its hold)
      pendingHold = false;
      setState('approach'); under = 'approach';
      if (scene() !== 0) setScene(0, true);
    }
  }
  /** a hold runs or waits for a finger: the scene stays scene 1 and the exit's trigger is off, whatever the scroll does under it */
  const holding = () => !!hold || pendingHold || holdAt !== null;

  // ---- the resets
  /** the top of the page (the section index's Home): every clock stops, the next lap arrives at scene 1 again */
  function resetLap() {
    jumped = true;
    follow.snap(0); q = 0; qRaw = prevRaw = 0; revealAt = -1;
    endHold(); holdAt = null; clearStep();
    under = 'approach';
    setState('approach');
    setScene(0, true);
    syncMotion();
    say('jump');
  }

  // ---- the product's look, the reference's cursor tilt (section-4-flux.md 4; X-14 as amended, E-S4-hover): a mouse or
  // a pen by hovering anywhere in the viewport, a finger while it presses the stage; the pointer's place in minus 1 to 1,
  // x right and y down as the reference reads it (clientX / innerWidth x 2 minus 1, clientY / innerHeight x 2 minus 1),
  // and the last place holds when the pointer leaves or lifts, as the reference's does; the carousel eases toward it
  const aim = (e: PointerEvent) => { aimed = true; lookX = (e.clientX / innerWidth) * 2 - 1; lookY = (e.clientY / innerHeight) * 2 - 1; };
  const onDown = (e: PointerEvent) => { if (state !== 'world' || !inRoom) return; pressed = true; aim(e); };
  const onMove = (e: PointerEvent) => { if (e.pointerType === 'touch' ? pressed : state === 'world' && inRoom) aim(e); };
  const onUp = () => { pressed = false; };
  addEventListener('pointerdown', onDown, { passive: true }); addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerup', onUp, { passive: true }); addEventListener('pointercancel', onUp, { passive: true }); addEventListener('blur', onUp);


  const island: RoomIsland = {
    snap,
    step: (dir) => api.stepScene(dir),
    motion(on) { motionOn = on; syncMotion(); },
  };
  window.__skreedRoom = island;

  const OFF: RoomPlan = { on: false, tex: null, wipeIn: 0, wipeOut: 0, groundNeeded: false, cover: 0, cloud: null, toneDark: false };
  const api: RoomDirector & Partial<RoomHooks> = {
    get state() { return state; },
    settled,
    begin(ratio) {
      if (!root) return;
      current();
      // no reading yet (the section locked behind the quiz, quiz-gate.md D5): it is not on screen, and q stays 0
      if (!measured) { inRoom = false; q = qRaw = prevRaw = 0; return; }
      const rTop = top - scrollY;
      inRoom = rTop < innerHeight && rTop + height > 0;
      qRaw = -rTop / screenPx();
      // the first reading is no crossing (a reload restored deep in the section): it arrives where it stands
      if (!seenRaw) { seenRaw = true; prevRaw = qRaw; }
      follow.update(qRaw, ratio);
      q = Math.max(0, follow.b);
    },
    step(f) {
      const P = params();
      refreshTune(P);
      if (root && LOOPS_DECLINED && root.dataset.pause !== '1') root.dataset.pause = '1';
      // the poster tier (or a fall to it): nothing drawn, and no loop left playing under the column
      if (poster()) { if (drawn) { drawn = false; syncMotion(); } return OFF; }
      const eps = 2 / screenPx();
      // the hold and the arrival first: a page carried past scene 1 from above is put back on it before the frame reads
      // the position
      holdFrame(f.t); arrival(f.t, eps);
      prevRaw = qRaw;
      // the fourth wipe (section-5.md 2): from q 3.8 over one screen, on the raw position; no exit seam follows it
      // (2026-11-03). It ends at section 5's rest when that comes first (a phone's viewport taller than 100svh once its
      // toolbar hides, where the page stops short of the section's top), and it is done within 2 px of its end: the last
      // position stops a fraction of a pixel short of the section's sub-pixel top, and a cut a hair short of whole kept
      // section 4's frame on and the island's ground off at the section's rest. The rest is read inside the cut alone
      let wipeOut = 0;
      if (qRaw > WIPE4_START) {
        const rest = o.restY(), nominal = WIPE4_START + ROOM_SCREENS.out;
        const end = Number.isFinite(rest) ? Math.max(WIPE4_START + ROOM_SCREENS.out / 2, Math.min(nominal, (rest - top) / screenPx())) : nominal;
        wipeOut = qRaw >= end - eps ? 1 : clamp01((qRaw - WIPE4_START) / (end - WIPE4_START));
      }
      lastWipeOut = wipeOut;
      // in world: the re-sync from the page's position (the scrollbar; never under a hold), and the step's end snap
      if (state === 'world') {
        if (!carousel.busy() && stepTo < 0 && !holding() && qRaw >= WORLD_START - eps && qRaw <= SCENES_END + eps) {
          const want = sceneAt(qRaw);
          if (want !== scene()) { setScene(want); sayScene(want); }
        }
        if (stepTo >= 0 && scene() === stepTo) {   // the tween ended this frame: the page snapped to the scene's q
          const to = stepTo; clearStep();
          if (root) root.dataset.scene = String(to);
          if (inRoom) snap(sceneQ(to));
          sayScene(to);
        }
      }
      // the approach waits for scene 1 (if it becomes drawable while the section is in view, at scene 1, the wipe plays in
      // over a second, the arrival with it); in the scenes the front scene shows as it is
      const first = drawable0();
      if (first && !wasReady) { wasReady = true; revealAt = qRaw > 0.02 && !reduced && scene() === 0 ? f.t : -1; }
      const showable = state !== 'approach' || first;
      const clock = revealAt >= 0 ? clamp01((f.t - revealAt) / 1.0) : 1;
      const wipeIn = showable ? Math.min(clamp01(q / ROOM_SCREENS.wipe), clock) : 0;
      // the cut done, section 4's frame is off (its carousel and loops idle under section 5): the ground is the island's alone
      const on = showable && inRoom && qRaw > 0 && wipeOut < 1;
      // the carousel draws, and its loops run, while the section is on
      if (on !== drawn) { drawn = on; syncMotion(); }
      let tex: Texture | null = null, toneDark = false;
      if (drawn) {
        const live = state === 'world';
        carousel.look(live ? lookX : 0, live ? lookY : 0, live && aimed);
        carousel.update(f.t, f.dt, curW, curH); tex = carousel.out; toneDark = sceneTone();
      }
      // Urban Slate from half the fourth wipe, over section 5's cream ground
      toneDark ||= wipeOut >= 0.5;

      // the hand-off from the fog (Tune: handoff): 0 the composite's ice-shard cut, 1 a cut at half the screen, 2 a fade
      const handoff = P.handoff >= 1.5 ? 'fade' : P.handoff >= 0.5 ? 'cut' : 'wipe';
      let wipe = wipeIn;
      const groundNeeded = wipeIn < 1;
      if (handoff === 'cut') wipe = wipeIn >= 0.5 ? 1 : 0;
      if (handoff === 'fade' && wipeIn < 1 && f.fog && tex) { const m = getMix(); m.plain(f.fog, tex, wipeIn); tex = m.out; wipe = 1; }
      const sc = scene();
      const stepping = state === 'world' && stepTo >= 0;
      window.__skreedRoomFrame?.({
        q, qRaw, ready: showable, failed: failed0(), inView: inRoom && qRaw > 0, state, under,
        scene: sc, stepping, stepTo: stepping ? stepTo : -1,
        loading: !!video && state === 'world' && (loopState[sc] === 'idle' || loopState[sc] === 'fetching'),
        note: import.meta.env.PUBLIC_TUNE === '1' && !!video && video.refused(sc) ? 'refused' : null,
        cover: 0, wipeOut, jumped,
      } satisfies RoomFrame);
      jumped = false;
      return { on: on && !!tex, tex: on ? tex : null, wipeIn: wipe, wipeOut, groundNeeded, cover: 0, cloud: null, toneDark };
    },
    reset(y) {
      resetLap();
      if (y === undefined) return;
      current();
      // locked behind the quiz gate the section has no box and no reading yet (top 0, height 1): nothing to land on, and a
      // landing measured against that would put the followers thousands of screens deep for the unlock to inherit
      if (!measured) return;
      const qq = (y - top) / screenPx();
      if (qq > 0) { follow.snap(qq); q = qq; qRaw = prevRaw = qq; }
    },
    resize(w, h) {
      curW = w; curH = h; mix?.resize(w, h); carousel.resize(w, h, o.dpr); measure();
      if (!clsFixed) cls = w < h ? 'portrait' : 'wide';   // the loop class until the first fetch began (X-10)
    },
    load() { const p = warmUp(); if (!locked()) openScenes(0); return p; },
    inRange() {
      if (state !== 'world' || !measured) return false;
      current();
      const r = (scrollY - top) / screenPx(), eps = 2 / screenPx();
      return r >= WORLD_START - eps && r <= SCENES_END + eps;
    },
    edge(dir) { const i = scene(); return dir > 0 ? i >= N - 1 : i <= 0; },
    carried() {
      if (state !== 'world' || stepTo >= 0) return;
      if (hold) hold.renew = true;
      else if (holdAt === null && !pendingHold) { current(); holdAt = yAt(sceneQ(scene())); }
    },
    stepScene(dir) {
      if (state !== 'world' || stepTo >= 0) return false;
      const from = scene();
      if (!carousel.requestStep(dir)) return false;
      endHold(); holdAt = null;
      stepFrom = from; stepTo = from + dir;
      if (root) root.dataset.step = '1';
      window.dispatchEvent(new CustomEvent('skreed:room-step', { detail: { from, to: stepTo } }));
      return true;
    },
    busy: () => carousel.busy(),
    hooks() {
      if (!HOOKS) return {};   // hooks builds only: folded away in production
      return {
        state, under, scene: scene(), step: +carousel.step().toFixed(3), front: carousel.front(), busy: carousel.busy(), inRange: api.inRange(),
        q: +q.toFixed(3), qRaw: +qRaw.toFixed(3), screens: ROOM_SCREENS,
        hold: hold ? { y: hold.y } : null, ready: drawable0(), failed: failed0(), settled: settled(),
        products: productsState, loops: loopState.map((s, i) => ({ i, state: s, in: !!video && video.in(i), refused: !!video && video.refused(i), playing: !!video && video.playing(i) })),
        stills: stillDone.map((d, i) => ({ i, settled: d, ok: stillOk[i], loading: !!stillJob[i] })), cls, video: !!video, backdrop: ROOM_BACKDROP, memory: carousel.memory(),
        sceneQ: Array.from({ length: N }, (_, i) => sceneQ(i)), wipe4Start: WIPE4_START, wipeOut: +lastWipeOut.toFixed(3), restY: o.restY(),
        layout: lay.layout ? { ...lay.layout } : null, product: carousel.place(),
      };
    },
    dispose() {
      disposed = true; ac.abort();
      unlockOff?.(); endHold();
      lay.dispose();
      removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp); removeEventListener('blur', onUp);
      removeEventListener('touchstart', onFinger); removeEventListener('touchend', onFinger); removeEventListener('touchcancel', onFinger);
      video?.dispose(); carousel.dispose(); mix?.dispose();
      if (window.__skreedRoom === island) window.__skreedRoom = undefined;
    },
  };
  // the review and test hooks (spec 5; hooks builds only, folded away in production): a scene at rest, the lights, the shade
  if (HOOKS) Object.assign(api, {
    scene(i: number) {
      if (i < 0 || i >= N) return false;
      endHold(); holdAt = null; clearStep();
      if (state !== 'world') { setState('world'); under = 'world'; }
      setScene(i, true); snap(sceneQ(i)); sayScene(i); loadRest(i);
      return resident(i);
    },
    lights: (o: Partial<LightSetting>) => carousel.lights(o),
    shade: (dark: number, height?: number, solid?: number) => carousel.shade(dark, height, solid),
  } satisfies RoomHooks);
  return api;
}
