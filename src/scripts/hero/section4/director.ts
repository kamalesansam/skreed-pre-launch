// Section 4's director (docs/specs/section-4.md 2, 4 and 5 for the hall; docs/specs/section-4-world.md 2, 4 and 5 for
// the world): the section's state (the hall, entering, the world), its progress q in screens of its own height through
// two followers, the third wipe from the fog, the walk, the door, the entry clock, the lands and the travels between
// them, and the loop screen whose fourth wipe ends in the jump back to the top.
// - The entry is one clock from the press: the leaves and the glide into the doorway (the hall frozen once the glide
//   ends, its last frame the bubble's outside), the bubble (transition.ts) opening on the world's glide through the
//   rings, the morph and the push into land 1 (world.ts), on its own clock whatever the page's scroll does; at its end,
//   and on Skip, the page is put at land 1's station by one instant scrollTo with the followers snapped.
// - In the world each land holds 0.4 screens either side of its station (config/room.ts landQ); a scroll past either
//   edge, or a single press of Down or Up from the walk script, starts the travel to the next or the previous land on
//   its own clock (travel.ts: the option's module, or the 300 ms cross-fade); once it ends and the scroll has been still
//   for 150 ms with no touch down, the page is set to the new station (settling) and that land's triggers arm once q is
//   inside its hold zone. A travel to a land whose pictures are not in yet waits on the current land (Loading).
// - The loop screen's progress is held at 0 while entering, travelling, settling or waiting, so no momentum can reach
//   the hero before the last land has shown; reset() (the loop's jump, back to top) stops every clock in every state.
// - Loading runs in phases, one compile, upload or decode a frame: the hall with this chunk; past the third wipe the
//   world's chunk and the garden, the rings and the cloud, land 1's picture and depth map and the shader compiles; on
//   the press the travel option's chunk; on arrival at each land the next land's pictures. Only the previous, current
//   and next lands stay resident.
// The section's layout is cached (its document top and height, re-read by a ResizeObserver on the quiz and the section
// and on resize), so a frame reads only scrollY and never forces layout under the quiz. The DOM side
// (scripts/room/walk.ts) gets one frame object per step through window.__skreedRoomFrame and drives the scene through
// window.__skreedRoom.
import type { Texture, WebGLRenderer } from 'three';
import { HALL, LAND_SIZE, PRESS, ROOM_HEIGHT, ROOM_LANDS, ROOM_SCREENS, STATION_Q, landQ, liveRoomParams, loopStart, travelOption, worldHeight, type LandClass, type LandSub, type RoomFrame, type RoomIsland, type RoomParams, type RoomState, type TravelOption } from '../../../config/room.ts';
import { createScrollFollower } from '../scroll/scrollMap.ts';
import { clamp01, easeInOutCubic, lerpFPS } from '../util/math.ts';
import { createHall, type HallScene } from './hall.ts';
import { BUBBLE, bubbleAt, createTransition, type TransitionPass } from './transition.ts';
import { FADE_MS, fadeLayers, loadTravel, restLayer, unlockMedia, type Travel, type TravelContext } from './travel.ts';
import type { LandView, WorldLayer, WorldParams, WorldScene } from './world.ts';

type WorldModule = typeof import('./world.ts');

export interface RoomStepIn { t: number; dt: number; ratio: number; pointer: { active: boolean; ndc: { x: number; y: number } }; touch: boolean; mouseRate: number;
  /** section 3's fog ground, the third wipe's near side (the 'fade' hand-off mixes from it) */
  fog: Texture | null }

/** what the composite draws for the section this frame */
export interface RoomPlan {
  /** the section draws this frame (the hall or the world is ready and the section is on screen past its top) */
  on: boolean;
  /** the frame the section shows: the hall, the bubble over it, or the world */
  tex: Texture | null;
  /** the third wipe's progress (fog to the section) */
  wipeIn: number;
  /** the fog ground is still on screen (the third wipe, or the fade, has not finished) */
  groundNeeded: boolean;
  /** the fourth wipe's progress over the loop screen (the section's frame to the hero at rest); 0 off it */
  loop: number;
  /** the logotype over the section: Pearl in the hall, Urban Slate over the garden, each land by its crop's tone (LAND_COPY) */
  toneDark: boolean;
}

export interface RoomDirector {
  readonly hall: HallScene;
  readonly state: RoomState;
  /** before the hero's part of the frame: the section's progress and the loop screen's (the hero renders its rest pose while it is > 0) */
  begin(ratio: number): { loop: number };
  /** the scene work of the frame: update, render the hall, the bubble and the world; the plan for the composite */
  step(f: RoomStepIn): RoomPlan;
  /** after the composite: the jump back to the top once the fourth wipe has crossed the screen */
  after(): void;
  /** the page went to the top by other means (the back-to-top control): every clock stops, and the next lap starts as the jump's does */
  reset(): void;
  resize(w: number, h: number): void;
  load(): Promise<void>;
  hooks(): Record<string, unknown>;
  dispose(): void;
}

export interface DirectorOptions {
  renderer: WebGLRenderer; avif: boolean; reduced: boolean; touch: boolean;
  /** the canvas's pixel ratio (the world's points and their cap) */
  dpr: number;
  /** the intro's triangle lattice (hero.ts ctx.U.tTri), the rings' and the forcefields' lattice */
  tTri: { value: unknown } | null;
  /** the hero's own followers to 0 at the jump (loop.snap) */
  onJump(): void;
}

/** the review hooks beyond hooks() (hero.ts installs them as window.__s4 in hooks builds) */
export interface RoomHooks {
  /** starts the entry without the walk (false while the world loads) */
  enterNow(): boolean;
  /** the entry clock at sec seconds after the press, held there (a negative sec lets it run on); past the entry's end it lands */
  seek(sec: number): void;
  /** land i at rest with the page at its station (entering at once if need be); true once its picture is resident */
  land(i: number): boolean;
  /** the travel from land i to land j held at p (0 to 1); a negative p lets it run on */
  travel(i: number, j: number, p: number): boolean;
  /** the travel option in use and whether its module carries a travel */
  option(): { option: TravelOption; module: boolean };
}

const JUMP_AT = 0.995, CUT_AT = 0.5, STILL_MS = 150, WORLD_KEYS = ['bubbleMs', 'travelMs', 'ringCount', 'travelRoll', 'morphMs', 'enterPushMs', 'worldBloom'] as const;
const N = ROOM_LANDS.length;
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

interface LandSlot { cls: LandClass; view: LandView | null; failed: boolean; job: Promise<void> | null }

export function createRoomDirector(o: DirectorOptions): RoomDirector & Partial<RoomHooks> {
  const { renderer, reduced } = o;
  const root = document.getElementById('room');
  if (root) root.dataset.lands = String(N);
  const hall = createHall({ renderer, avif: o.avif, reduced, touch: o.touch });
  const trans = createTransition(renderer);
  let mix: TransitionPass | null = null, curW = 1, curH = 1;   // the 'fade' hand-off (Tune only): the same pass's straight mix, made on first use
  const getMix = () => (mix ??= (() => { const m = createTransition(renderer); m.resize(curW, curH); return m; })());
  const follow = createScrollFollower();
  let state: RoomState = 'hall', disposed = false;
  const ac = new AbortController();
  // the section's layout, cached: its top in document pixels and its height
  let top = 0, height = 1, measured = false;
  const measure = () => { if (!root) return; const r = root.getBoundingClientRect(); top = r.top + scrollY; height = Math.max(1, r.height); measured = true; };
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => measure()) : null;
  if (root && ro) { ro.observe(root); const find = document.getElementById('find'); if (find) ro.observe(find); }
  addEventListener('resize', measure);
  // the scroll's stillness and the touches down, for settling (spec 2: "once no touch is down and the scroll has been still for 150 ms")
  let lastScroll = 0, scrollEnded = true, touches = 0;
  const onScroll = () => { lastScroll = performance.now(); scrollEnded = false; };
  const onScrollEnd = () => { scrollEnded = true; };
  const onTouch = (e: TouchEvent) => { touches = e.touches.length; };
  const hasScrollEnd = 'onscrollend' in window;
  addEventListener('scroll', onScroll, { passive: true });
  if (hasScrollEnd) addEventListener('scrollend', onScrollEnd, { passive: true });
  for (const t of ['touchstart', 'touchend', 'touchcancel'] as const) addEventListener(t, onTouch, { passive: true });
  const still = () => touches === 0 && performance.now() - lastScroll >= STILL_MS && (!hasScrollEnd || scrollEnded || performance.now() - lastScroll >= 4 * STILL_MS);

  // the per-frame values
  let q = 0, qAll = 0, qRaw = 0, inRoom = false, loopP = 0, armed = true, jumped = false, revealAt = -1, wasReady = false, snapped = true, lastNear = 0;
  let pendingEnter = false, hover = -1, holdSway = false, x: number = HALL.start;
  // the entry clock (seconds since the press), its end, a held seek, and the hall frozen after its glide
  let entryT = 0, arrive = 0, seekT = -1, endNow = false, hallFrozen = false, hallStale = false;
  // the world: its module, its scene, the lands' slots, the land on screen and what it is doing
  let W: WorldModule | null = null, world: WorldScene | null = null, worldJob: Promise<void> | null = null, worldFailed = false, gardenLap = -1, lap = 0;
  const slots = new Map<number, LandSlot>();
  let land = 0, sub: LandSub = 'rest', landArmed = false, waitTo = -1, waitAt = 0, waitByKey = false, restKey = '';
  // a travel between lands: from, to, its clock (ms), its length and how it plays; a held p for the review frames
  let tFrom = 0, tTo = 0, tMs = FADE_MS, tAt = 0, tSeek = -1, tMode: 'option' | 'fade' = 'fade', tOpt: TravelOption | 'fade' = 'fade';
  let travel: Travel | null = null, travelOpt: TravelOption | null = null, optJob: Promise<void> | null = null;
  let landChain: Promise<void> = Promise.resolve();
  const H = document.documentElement;
  const poster = () => root?.dataset.tier === 'poster' || !H.classList.contains('hero3d') || H.classList.contains('poster');
  const say = (detail: string) => window.dispatchEvent(new CustomEvent('skreed:room-state', { detail }));
  /** an asset the section needs failed: the stills and the column stand in, the island stops drawing the section */
  const toPoster = () => { pendingEnter = false; if (root) root.dataset.tier = 'poster'; };
  const look = { yaw: 0, pitch: 0 };
  const cls = (): LandClass => (curW < curH ? 'portrait' : 'wide');
  /** the logotype over land i: Urban Slate (dark) unless the land's crop in use says Pearl */
  const landDark = (i: number): boolean => ROOM_LANDS[i]?.tone[cls()] !== 'pearl';
  const view = (i: number): LandView | null => slots.get(i)?.view ?? null;
  const settled = (i: number) => { const s = slots.get(i); return !!s && (!!s.view || s.failed) && !s.job; };
  const worldReady = () => !!world?.ready && settled(0);

  const screens = () => (state === 'hall' ? ROOM_HEIGHT : worldHeight(N));
  const screenPx = () => height / screens();
  const setState = (s: RoomState) => { state = s; if (root) { root.dataset.state = s; if (s !== 'world') { delete root.dataset.land; delete root.dataset.sub; } } measure(); };
  const setSub = (s: LandSub) => { sub = s; if (root) { root.dataset.sub = s; root.dataset.land = String(land); if (s === 'travel') root.dataset.travel = `${tFrom}-${tTo}`; else delete root.dataset.travel; } };
  const params = (): RoomParams => liveRoomParams();
  const wp = {} as WorldParams;
  const worldParams = (P: RoomParams): WorldParams => { for (const k of WORLD_KEYS) wp[k] = P[k]; return wp; };

  // ---- phase 2: the world's chunk and the garden, the rings, the cloud, land 1's pictures and the compiles
  function loadWorld(): Promise<void> {
    return (worldJob ??= Promise.all([import('./world.ts'), import('./garden.ts')]).then(async ([m, g]) => {
      if (disposed) return;
      W = m;
      const w = m.createWorld({ renderer, touch: o.touch, reduced, dpr: o.dpr, tTri: (o.tTri?.value as Texture | null | undefined) ?? null, garden: g.gardenSpec(o.avif), params: { ...worldParams(params()) } });
      world = w; gardenLap = lap;
      w.resize(curW, curH);
      await w.load();
      if (disposed) return;
      if (w.failed) { worldFailed = true; toPoster(); window.dispatchEvent(new CustomEvent('skreed:room-world', { detail: { ready: false, failed: true } })); return; }
      await ensureLand(0);
      afterWorld();
    }).catch((e: unknown) => {
      if (disposed) return;
      console.warn('section 4: the world chunk did not load', e);
      worldFailed = true; toPoster();
      window.dispatchEvent(new CustomEvent('skreed:room-world', { detail: { ready: false, failed: true } }));
    }));
  }
  /** the world and land 1 are in: a press that waited enters now, while the visitor is still at the door */
  function afterWorld() {
    if (pendingEnter) {
      pendingEnter = false;
      if (inRoom && state === 'hall' && lastNear > 0) startEnter(); else say('unbusy');
    }
    window.dispatchEvent(new CustomEvent('skreed:room-world', { detail: { ready: true, failed: false } }));
  }

  // ---- the lands' pictures: one land at a time, each image decoded off the main thread and uploaded a strip a frame
  function ensureLand(i: number, c: LandClass = cls()): Promise<void> {
    if (i < 0 || i >= N || !W) return Promise.resolve();
    const s = slots.get(i);
    if (s && s.cls === c && (s.view || s.failed || s.job)) return s.job ?? Promise.resolve();
    const slot: LandSlot = s ?? { cls: c, view: null, failed: false, job: null };
    slot.cls = c; slot.failed = false; slots.set(i, slot);
    const job = (landChain = landChain.then(() => loadLand(i, c, slot))).finally(() => { if (slot.job === job) slot.job = null; });
    slot.job = job;
    return job;
  }
  async function loadLand(i: number, c: LandClass, slot: LandSlot): Promise<void> {
    const m = W!, L = ROOM_LANDS[i], pic = L.pics[c], dep = L.depth[c], made: Texture[] = [];
    if (slots.get(i) !== slot || slot.cls !== c || disposed) return;
    try {
      const upload = async (url: string, red: boolean) => {
        const bmp = await m.decodeImage(url, ac.signal);
        if (disposed) { bmp.close(); throw new Error('section 4: disposed'); }
        const up = m.stripUpload(renderer, bmp, red ? { red: true } : { mipmaps: true });
        made.push(up.texture);
        while (!up.step()) { await nextFrame(); if (disposed) throw new Error('section 4: disposed'); }
        await nextFrame();
        return up.texture;
      };
      const picture = await upload(o.avif ? pic.avif : pic.webp, false);
      // a depth map that fails leaves the picture flat (the push then moves through a plane), never the land failed
      let depth: Texture | null = null;
      if (dep) depth = await upload(o.avif ? dep.avif : dep.webp, true).catch((e: unknown) => { console.warn(`section 4: land ${L.id}'s depth map did not load`, e); return null; });
      if (slots.get(i) !== slot || slot.cls !== c) { for (const t of made) t.dispose(); return; }
      const old = slot.view;
      slot.view = { picture, depth, aspect: LAND_SIZE[c].width / LAND_SIZE[c].height, fov: L.fov, near: L.near, far: L.far };
      world?.setLand(i, slot.view);
      if (old) { old.picture.dispose(); old.depth?.dispose(); }
      restKey = '';
    } catch (e) {
      for (const t of made) t.dispose();
      if (disposed) return;
      console.warn(`section 4: land ${L.id}'s picture did not load; its text stands on the garden`, e);
      if (!slot.view) slot.failed = true;
    }
  }
  /** keep the previous, current and next lands (and land 1, for the next lap's morph, while the hall is drawn) */
  function keepAround(j: number) {
    for (const [i, s] of slots) {
      if (Math.abs(i - j) <= 1 || (i === 0 && state !== 'world')) continue;
      if (s.job) continue;
      if (s.view) { world?.setLand(i, null); s.view.picture.dispose(); s.view.depth?.dispose(); }
      slots.delete(i);
    }
    for (const i of [j, j + 1, j - 1]) void ensureLand(i);
  }

  // ---- phase 3: the travel option's chunk, on the press (none under still3d, none with a single land)
  function loadOption(opt: TravelOption) {
    if (reduced || N < 2 || !world) return;
    if (travelOpt === opt && optJob) return;
    travel?.dispose(); travel = null; travelOpt = opt;
    const ctx: TravelContext = { renderer, world, touch: o.touch, reduced, dpr: o.dpr, view, cls, params };
    const job: Promise<void> = (optJob = loadTravel(opt).then(async (entry) => {
      if (optJob !== job || disposed) return;
      const t = entry?.createTravel(ctx) ?? null;
      if (!t) return;
      travel = t;
      await t.load();
    }).catch((e: unknown) => { console.warn(`section 4: option ${opt}'s travel failed; the cross-fade stands in`, e); }));
  }

  function snap(qq: number) {
    if (!measured) measure();
    const y = Math.round(top + qq * screenPx());
    scrollTo({ top: y, behavior: 'instant' }); follow.snap(qq); q = qAll = qq; snapped = true;
  }

  // ---- the entry
  function startEnter() {
    if (state !== 'hall' || N < 1) return;
    if (q < ROOM_SCREENS.wipe + ROOM_SCREENS.walk) snap(STATION_Q);   // off-station: to the station first, in the same task
    entryT = 0; seekT = -1; endNow = false; hallFrozen = false; hallStale = false;
    hall.entering(true);
    setState('entering');
    // option C's video elements, unlocked in the press's own task (travel.ts unlockMedia); on Tune builds for any pick, as Tune can switch to C
    if (!reduced && N > 1 && (travelOption(params()) === 'C' || import.meta.env.PUBLIC_TUNE === '1')) unlockMedia(N - 1);
    loadOption(travelOption(params()));
    say('entering');
  }
  function finishEnter() {
    seekT = -1; endNow = false;
    world?.scissor(null);
    // the garden serves only the entry (and a failed picture, which decodes it again): the world frees it when its clock
    // reaches land 1, and Skip, Escape and the hooks end the clock before that, so it is freed here for them too
    world?.releaseGarden();
    hall.swing(0, params().door);
    land = 0; landArmed = false; waitTo = -1; restKey = '';
    setState('world'); setSub('rest');
    if (inRoom) { snap(landQ(0)); landArmed = true; }
    keepAround(0);
    say('world');
  }

  // ---- the travels between lands
  /** a travel to land `to`, by a scroll past a trigger or by a key or button (byKey) */
  function requestTravel(to: number, byKey: boolean): boolean {
    if (state !== 'world' || sub !== 'rest' || to < 0 || to >= N || to === land) return false;
    landArmed = false;
    // the option's own part of the land being in (C: its clip fully fetched), waited on with the pictures
    const more = travel && travelOpt === travelOption(params()) && travel.ready && !travel.failed ? travel.pending?.(land, to) ?? null : null;
    if (settled(to) && !more) { beginTravel(land, to); return true; }
    waitTo = to; waitAt = performance.now(); waitByKey = byKey; setSub('wait');
    void Promise.all([ensureLand(to), more]).then(() => { if (sub === 'wait' && waitTo === to && !disposed) beginTravel(land, to); });
    return true;
  }
  function beginTravel(from: number, to: number) {
    const P = params(), opt = travelOption(P);
    if (opt !== travelOpt) loadOption(opt);
    const mod = travel && travelOpt === opt && travel.ready && !travel.failed && view(from) && view(to) && travel.can(from, to) ? travel : null;
    tFrom = from; tTo = to; tAt = 0; waitTo = -1;
    tMode = mod ? 'option' : 'fade'; tOpt = mod ? opt : 'fade';
    tMs = mod ? Math.max(FADE_MS, mod.ms(from, to, P)) : FADE_MS;
    setSub('travel');
  }
  function arriveAt(to: number) {
    travel?.end();
    land = to; restKey = '';
    setSub('settling');
    keepAround(to);
  }

  const island: RoomIsland = {
    snap,
    enter() {
      if (state !== 'hall' || N < 1 || !hall.ready || poster()) return false;
      if (worldFailed) { toPoster(); return false; }
      if (worldReady()) { startEnter(); return true; }
      pendingEnter = true; void loadWorld().then(() => { if (world?.ready && !settled(0)) void ensureLand(0).then(afterWorld); });
      if (q < ROOM_SCREENS.wipe + ROOM_SCREENS.walk) snap(STATION_Q);
      return false;
    },
    skip() {
      if (state === 'entering') endNow = true;
      else if (state === 'world' && sub === 'travel') { tSeek = -1; tAt = tMs; }
    },
    travel(dir) { return requestTravel(land + dir, true); },
    setHover(i) { hover = i; holdSway = i === -2; },
  };
  window.__skreedRoom = island;

  /** the frame the composite shows for land j at rest, drawn only when it changes (no idle drift, WCAG 2.2.2); a land
   * whose picture failed stands on the garden, drawn again once the garden, freed after the entry, has decoded again */
  function drawRest(j: number) {
    const key = `${j}|${curW}x${curH}|${view(j) ? 'pic' : world?.gardenReady ? 'garden' : 'garden-loading'}`;
    if (key === restKey || !world) return;
    restKey = key;
    world.scissor(null);
    world.layers([restLayer(world, view(j), j)]);
    world.render();
  }

  const api: RoomDirector & Partial<RoomHooks> = {
    hall,
    get state() { return state; },
    begin(ratio) {
      if (!root) return { loop: 0 };
      if (!measured) measure();
      const rTop = top - scrollY;
      inRoom = rTop < innerHeight && rTop + height > 0;
      qRaw = -rTop / screenPx();
      follow.update(qRaw, ratio);
      // q drives the walk and waits for the hall; the loop screen reads the follower itself, so the page never ends while the hall loads
      qAll = Math.max(0, follow.b);
      q = hall.ready ? qAll : 0;
      // the loop is held while a clock runs (the entry, a travel, its settling, a wait for the next land's pictures)
      const held = state === 'entering' || (state === 'world' && sub !== 'rest');
      loopP = held || !inRoom || poster() ? 0 : clamp01((qAll - loopStart(state === 'hall' ? null : N)) / ROOM_SCREENS.loop);
      return { loop: loopP };
    },
    step(f) {
      const P = params();
      if (poster()) return { on: false, tex: null, wipeIn: 0, groundNeeded: false, loop: 0, toneDark: false };
      // phase 2 during the walk, past the third wipe (spec 5, "Loading"); on a later lap the garden and land 1 again
      if (N > 0 && hall.ready && inRoom && q > ROOM_SCREENS.wipe) {
        if (!worldJob) void loadWorld();
        else if (state === 'hall' && world?.ready && gardenLap !== lap) {
          gardenLap = lap;
          world.loadGarden().catch((e: unknown) => console.warn('section 4: the garden did not load again', e));
          void ensureLand(0);
        }
      }
      // the third wipe waits for the hall; if it becomes ready while the section is in view it plays over a second
      if (hall.ready && !wasReady) {
        wasReady = true; revealAt = qRaw > 0.02 && !reduced ? f.t : -1; snapped = true;
        if (loopP > 0) armed = false;   // the hall arrived with the visitor on the loop screen: no jump until they scroll across it again
      }
      const clock = revealAt < 0 ? 1 : clamp01((f.t - revealAt) / 1.0);
      const wipeIn = hall.ready ? Math.min(clamp01(q / ROOM_SCREENS.wipe), clock) : 0;
      // the head: the pointer's sway on laptops in the hall only (held while the pointer is over the prompt), the keys' turn, the drag
      const sway = f.touch || reduced ? 0 : 1, extra = window.__skreedRoomLook;
      if (!holdSway) {
        const ty = (f.pointer.active ? f.pointer.ndc.x * P.lookYaw : 0) * sway, tp = (f.pointer.active ? f.pointer.ndc.y * P.lookPitch : 0) * sway;
        look.yaw = lerpFPS(look.yaw, ty, f.mouseRate, f.ratio); look.pitch = lerpFPS(look.pitch, tp, f.mouseRate, f.ratio);
      }
      const keyYaw = (extra?.yaw ?? 0) + (P.mouseLook >= 0.5 ? extra?.drag ?? 0 : 0), headYaw = look.yaw + keyYaw;
      let tex: Texture | null = null, toneDark = false, nearDoor = 0, prompt: { x: number; y: number } | null = null;
      let on = hall.ready && inRoom && q > 0;

      if (state === 'hall' || state === 'entering') {
        const walk = clamp01((q - ROOM_SCREENS.wipe) / ROOM_SCREENS.walk), end = HALL.door.face + Math.min(HALL.promptFrom - 0.05, Math.max(0.6, P.stationDist));
        // reduced motion: four cuts, the start, the middle, just inside the prompt's range and the station (section-4.md 4)
        const w3 = (HALL.start - (HALL.door.face + HALL.promptFrom - 0.05)) / (HALL.start - end);
        const w2 = reduced ? (walk < 0.33 ? 0 : walk < 0.66 ? 0.5 : walk < w3 ? w3 : 1) : walk;
        if (state === 'hall') {
          // the walk is clamped at 1.0 m per second (section-4.md 2), except across a snap, the hall's arrival, the jump and the cuts
          const xT = HALL.start + (end - HALL.start) * w2, mx = 1.0 * f.dt;
          x = snapped || reduced ? xT : x + Math.max(-mx, Math.min(mx, xT - x));
        }
        snapped = false;
        nearDoor = clamp01((HALL.promptFrom - (x - HALL.door.face)) / (HALL.promptFrom - (end - HALL.door.face)));
        lastNear = nearDoor;
        if (pendingEnter && state === 'hall' && (nearDoor <= 0 || !inRoom)) { pendingEnter = false; say('unbusy'); }   // the visitor walked away from a waiting press
        if (state === 'hall') {
          if (on) {
            hall.swing(0, P.door);
            hall.update(x, { yaw: headYaw, pitch: look.pitch, anchorYaw: keyYaw }, nearDoor, f.t, P);
            hall.render();
            if (N > 0) prompt = hall.project(HALL.door.handle);
          }
          tex = hall.out;
        } else {
          // the entry clock: the press's frames from 0, the hall's swing and glide, the bubble, the world's glide, morph and push
          if (seekT >= 0) entryT = seekT; else entryT += f.dt;
          const t = entryT;
          const sw = reduced ? 0 : 1 - Math.pow(1 - clamp01(t / PRESS.swing), 3);
          const dolly = reduced ? 0 : easeInOutCubic(clamp01((t - PRESS.glideFrom) / PRESS.glide)) * PRESS.dolly;
          hall.swing(sw, P.door);
          hall.update(end - dolly, { yaw: 0, pitch: 0 }, 1, f.t, P);
          // the hall draws until its glide ends (the first frame only under still3d), then its last frame is reused
          if (inRoom && (!hallFrozen || hallStale)) { hall.render(); hallStale = false; if (t >= (reduced ? 0 : PRESS.freeze)) hallFrozen = true; }
          tex = hall.out;
          const w = world;
          if (w?.ready) {
            // the clock runs whatever the page's scroll does: the world steps every frame and draws while the section is on screen
            const ef = w.entry(t, worldParams(P));
            arrive = ef.arrive;
            if (inRoom && reduced) {
              // still3d: a 600 ms dissolve from the hall to the tunnel's first frame, then the world's own hold and cross-fade
              w.scissor(null); w.render();
              const d = hall.out && w.out ? trans.dissolve(hall.out, w.out, t * 1000) : 1;
              tex = d >= 1 ? w.out : trans.out;
              toneDark = d >= 0.5;
            } else if (inRoom) {
              const ms = (t - BUBBLE.start) * 1000;
              if (ms >= 0) {
                const b = bubbleAt(ms, P.bubbleMs, { w: curW, h: curH });
                // the world's draw scissored to the bubble's bounding box while it is small (origin bottom left, a 2 px pad)
                const r = Math.ceil(b.reach) + 2;
                w.scissor(b.done || 2 * r >= Math.max(curW, curH) ? null : { x: Math.max(0, Math.floor(b.cx - r)), y: Math.max(0, Math.floor(curH - b.cy - r)), w: 2 * r, h: 2 * r });
                w.render();
                if (b.done || !hall.out || !w.out) tex = w.out;
                else { trans.bubble(hall.out, w.out, ms, P.bubbleMs); tex = trans.out; }
                toneDark = b.done;
              }
            }
            // once the morph has handed over to land 1's picture (the push, then rest), the logotype takes that land's tone
            if (ef.phase === 'push' || ef.phase === 'rest') toneDark = landDark(0);
            if ((ef.done && seekT < 0) || endNow) finishEnter();
          } else if (endNow) finishEnter();
          on = inRoom;
        }
      } else {
        // the world: the lands at rest, a wait, a travel, settling
        const w = world;
        if (w?.ready) {
          // Tune switching the option disposes the previous one's resources (spec 5, "Build modes")
          const opt = travelOption(P);
          if (N > 1 && !reduced && opt !== travelOpt && sub !== 'travel') loadOption(opt);
          const at = landQ(land), hold = ROOM_SCREENS.hold;
          if (sub === 'rest') {
            if (!landArmed && Math.abs(q - at) <= hold) landArmed = true;
            if (landArmed && inRoom) {
              if (q > at + hold && land < N - 1) requestTravel(land + 1, false);
              else if (q < at - hold && land > 0) requestTravel(land - 1, false);
            }
          } else if (sub === 'wait') {
            // scrolling back cancels the wait: into the hold zone after a scroll's trigger, past its other edge after a key's
            const back = Math.sign(waitTo - land) * (q - at);
            if (waitByKey ? back < -hold : back <= hold) { waitTo = -1; setSub('rest'); landArmed = Math.abs(q - at) <= hold; }
          }
          if (sub === 'travel') {
            if (tSeek >= 0) tAt = tSeek * tMs; else tAt += f.dt * 1000;
            const p = clamp01(tAt / tMs);
            let layers: readonly WorldLayer[] | null = tMode === 'option' && travel ? travel.frame(tFrom, tTo, p) : null;
            if (tMode === 'option' && !layers) { tMode = 'fade'; tOpt = 'fade'; tMs = FADE_MS; tAt = p * FADE_MS; }   // the option cannot go on: the cross-fade takes the rest
            layers ??= fadeLayers(w, view, tFrom, tTo, clamp01(tAt / tMs));
            w.scissor(null); w.layers(layers); w.render(); restKey = '';
            if (p >= 1 && tSeek < 0) arriveAt(tTo);
          } else drawRest(land);
          if (sub === 'settling' && still()) {
            if (inRoom) { snap(landQ(land)); landArmed = true; } else landArmed = false;
            setSub('rest');
          }
          tex = w.out;
          toneDark = landDark(sub === 'travel' ? tTo : land);
        }
        on = inRoom && q > 0 && !!w?.ready;
      }

      // the hand-off from the fog (Tune: handoff): 0 the composite's ice-shard cut, 1 a cut at half the screen, 2 a fade
      const handoff = P.handoff >= 1.5 ? 'fade' : P.handoff >= 0.5 ? 'cut' : 'wipe';
      // (in the hall, and in the world too when the visitor scrolls back up to the quiz: the third wipe from the land)
      const handing = state !== 'entering';
      let wipe = handing ? wipeIn : 1;
      const groundNeeded = handing && wipeIn < 1;
      if (handing && handoff === 'cut') wipe = wipeIn >= CUT_AT ? 1 : 0;
      if (handing && handoff === 'fade' && wipeIn < 1 && f.fog && tex) { const m = getMix(); m.plain(f.fog, tex, wipeIn); tex = m.out; wipe = 1; }
      window.__skreedRoomFrame?.({
        q, x, nearDoor, ready: hall.ready, failed: hall.failed || worldFailed, inView: inRoom && qRaw > 0, prompt, state, lands: N,
        worldReady: worldReady(), entry: state === 'entering' ? entryT : 0, arrive,
        land, sub, travel: state === 'world' && sub === 'travel' ? { from: tFrom, to: tTo, p: clamp01(tAt / tMs), option: tOpt } : null,
        waitMs: sub === 'wait' ? performance.now() - waitAt : 0, note: travel?.note ?? null, loop: loopP, jumped,
      } satisfies RoomFrame);
      jumped = false;
      return { on: on && !!tex, tex: on ? tex : null, wipeIn: wipe, groundNeeded, loop: loopP, toneDark };
    },
    after() {
      if (loopP >= JUMP_AT && armed && inRoom) {
        armed = false;
        say('loop');
        scrollTo({ top: 0, behavior: 'instant' });
        o.onJump();
        api.reset();
      } else if (loopP < 0.5) armed = true;
    },
    reset() {
      jumped = true; lap++;
      follow.snap(0); q = qAll = 0; loopP = 0; revealAt = -1; pendingEnter = false; snapped = true;
      seekT = -1; endNow = false; tSeek = -1; waitTo = -1;
      travel?.end();
      world?.scissor(null);
      if (state === 'entering') { setState('hall'); hall.entering(false); }
      if (state === 'world') {
        land = 0; landArmed = false; restKey = ''; setSub('rest');   // a travel, its settling or a wait ends here
        if (params().lapReset >= 0.5) { setState('hall'); hall.entering(false); }
      }
      if (state === 'hall') keepAround(0);
      hall.swing(0, params().door); x = HALL.start; hover = -1; holdSway = false; hallFrozen = false;
      say('jump');
    },
    resize(w, h) {
      const was = cls();
      curW = w; curH = h; hall.resize(w, h); trans.resize(w, h); mix?.resize(w, h); world?.resize(w, h); measure();
      hallStale = true; restKey = '';
      // a turn of the phone: the other crop is fetched while the current one stays, cover-fit (spec 2, "A land, at rest")
      if (cls() !== was && W) { for (const i of [land, ...[...slots.keys()].filter((k) => k !== land)]) if (slots.has(i)) void ensureLand(i); }
    },
    // the hall, then the bubble's program compiled in the section's own warm-up (not on the press)
    load() { return hall.load().then(() => { if (hall.ready && hall.out) trans.plain(hall.out, hall.out, 0.5); }); },
    hooks() {
      if (import.meta.env.PUBLIC_HERO_HOOKS !== '1') return {};   // hooks builds only: folded away in production
      return {
        state, sub, land, lands: N, q: +q.toFixed(3), qRaw: +qRaw.toFixed(3), loop: +loopP.toFixed(3), screens: screens(),
        entry: +entryT.toFixed(3), arrive: +arrive.toFixed(3), worldReady: worldReady(), worldFailed,
        travel: state === 'world' && sub === 'travel' ? { from: tFrom, to: tTo, p: +clamp01(tAt / tMs).toFixed(3), ms: tMs, option: tOpt } : null,
        option: travelOpt, optionModule: !!travel, resident: [...slots].map(([i, s]) => ({ i, cls: s.cls, ready: !!s.view, failed: s.failed, loading: !!s.job })),
        landQ: Array.from({ length: N }, (_, i) => landQ(i)), hall: hall.hooks(), world: world?.hooks?.() ?? null,
      };
    },
    dispose() {
      disposed = true; ac.abort();
      ro?.disconnect(); removeEventListener('resize', measure);
      removeEventListener('scroll', onScroll); removeEventListener('scrollend', onScrollEnd);
      for (const t of ['touchstart', 'touchend', 'touchcancel'] as const) removeEventListener(t, onTouch);
      travel?.dispose();
      for (const s of slots.values()) if (s.view) { s.view.picture.dispose(); s.view.depth?.dispose(); }
      slots.clear();
      hall.dispose(); trans.dispose(); mix?.dispose(); world?.dispose();
      if (window.__skreedRoom === island) window.__skreedRoom = undefined;
    },
  };
  // the review and test hooks (spec 5; hooks builds only, folded away in production): the entry by its clock, a land at
  // rest, a travel held at p
  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') Object.assign(api, {
    enterNow: () => island.enter(),
    seek(sec: number) {
      if (sec < 0) { if (state === 'entering' && seekT >= 0) { entryT = seekT; seekT = -1; } return; }   // a negative time lets the clock run on from where it is held
      if (state === 'hall') { if (!worldReady()) return; startEnter(); }
      if (state !== 'entering') return;
      hallFrozen = false; hallStale = true;
      if (arrive > 0 && sec >= arrive) { seekT = -1; entryT = sec; endNow = true; } else seekT = sec;
    },
    land(i: number) {
      if (i < 0 || i >= N) return false;
      if (state === 'hall' && worldReady()) startEnter();
      if (state === 'entering') finishEnter();
      if (state !== 'world') return false;
      tSeek = -1; land = i; restKey = ''; setSub('rest'); landArmed = true;
      snap(landQ(i)); keepAround(i);
      return !!view(i);
    },
    travel(i: number, j: number, p: number) {
      if (state !== 'world' || i < 0 || j < 0 || i >= N || j >= N || i === j) return false;
      if (p < 0) { tSeek = -1; return true; }
      if (sub !== 'travel' || tFrom !== i || tTo !== j) { land = i; void ensureLand(i); void ensureLand(j); beginTravel(i, j); }
      tSeek = clamp01(p);
      return !!view(i) && !!view(j);
    },
    option: () => ({ option: travelOption(params()), module: !!travel }),
  } satisfies RoomHooks);
  return api;
}
