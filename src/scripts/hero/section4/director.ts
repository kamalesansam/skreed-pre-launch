// Section 4's director (docs/specs/section-4.md 2, 4 and 5): the section's state (the hall, the transition, the
// universe), its progress q in screens of its own height through two followers, the third wipe from the fog, the walk,
// the door, the transition clock, the universe's pan, and the loop screen whose fourth wipe ends in the jump back to the
// top. The section's layout is cached (its document top and height, re-read by a ResizeObserver on the quiz and the
// section and on resize), so a frame reads only scrollY and never forces layout under the quiz. The DOM side
// (scripts/room/walk.ts) gets one frame object per step through window.__skreedRoomFrame and drives the scene through
// window.__skreedRoom.
import type { Texture, WebGLRenderer } from 'three';
import { HALL, PAN_START, ROOM_HEIGHT, ROOM_HEIGHT_ENTERED, ROOM_SCREENS, TRANSITION, UNIVERSE, liveRoomParams, loopStart, pedestalAt, pedestalQ, type RoomFrame, type RoomIsland, type RoomParams, type RoomState } from '../../../config/room.ts';
import { createScrollFollower } from '../scroll/scrollMap.ts';
import { clamp01, lerpFPS } from '../util/math.ts';
import { createHall, type HallScene } from './hall.ts';
import { createTransition, type TransitionPass } from './transition.ts';
import type { UniverseScene } from './universe.ts';

export interface RoomStepIn { t: number; dt: number; ratio: number; pointer: { active: boolean; ndc: { x: number; y: number } }; touch: boolean; mouseRate: number;
  /** section 3's fog ground, the third wipe's near side (the 'fade' hand-off mixes from it) */
  fog: Texture | null }

/** what the composite draws for the section this frame */
export interface RoomPlan {
  /** the section draws this frame (the hall or the universe is ready and the section is on screen past its top) */
  on: boolean;
  /** the frame the section shows: the hall, the transition's mix or the universe */
  tex: Texture | null;
  /** the third wipe's progress (fog to the section) */
  wipeIn: number;
  /** the fog ground is still on screen (the third wipe, or the fade, has not finished) */
  groundNeeded: boolean;
  /** the fourth wipe's progress over the loop screen (the section's frame to the hero at rest); 0 off it */
  loop: number;
  /** the logotype over the section: dark on a light frame */
  toneDark: boolean;
}

export interface RoomDirector {
  readonly hall: HallScene;
  readonly state: RoomState;
  /** before the hero's part of the frame: the section's progress and the loop screen's (the hero renders its rest pose while it is > 0) */
  begin(ratio: number): { loop: number };
  /** the scene work of the frame: update, render the hall, the universe and the transition; the plan for the composite */
  step(f: RoomStepIn): RoomPlan;
  /** after the composite: the jump back to the top once the fourth wipe has crossed the screen */
  after(): void;
  resize(w: number, h: number): void;
  load(): Promise<void>;
  hooks(): Record<string, unknown>;
  dispose(): void;
}

export interface DirectorOptions {
  renderer: WebGLRenderer; avif: boolean; reduced: boolean; touch: boolean;
  /** the hero's own followers to 0 at the jump (loop.snap) */
  onJump(): void;
}

const JUMP_AT = 0.995, CUT_AT = 0.5;

export function createRoomDirector(o: DirectorOptions): RoomDirector {
  const { renderer, reduced } = o;
  const root = document.getElementById('room');
  const hall = createHall({ renderer, avif: o.avif, reduced, touch: o.touch });
  const trans = createTransition(renderer);
  let mix: TransitionPass | null = null, curW = 1, curH = 1;   // the 'fade' hand-off (Tune only): the same pass with the white and the sweep off, made on first use
  const getMix = () => (mix ??= (() => { const m = createTransition(renderer); m.resize(curW, curH); return m; })());
  let universe: UniverseScene | null = null, uniImport: Promise<void> | null = null;
  const follow = createScrollFollower();
  let state: RoomState = 'hall';
  // the section's layout, cached: its top in document pixels and its height
  let top = 0, height = 1, measured = false;
  const measure = () => { if (!root) return; const r = root.getBoundingClientRect(); top = r.top + scrollY; height = Math.max(1, r.height); measured = true; };
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => measure()) : null;
  if (root && ro) { ro.observe(root); const find = document.getElementById('find'); if (find) ro.observe(find); }
  addEventListener('resize', measure);
  // the per-frame values
  let q = 0, qAll = 0, qRaw = 0, inRoom = false, loopP = 0, armed = true, jumped = false, revealAt = -1, wasReady = false, snapped = true, lastNear = 0;
  let transP = 0, seekP = -1, pendingEnter = false, hover = -1, holdSway = false, x: number = HALL.start, yaw = -UNIVERSE.arcSpan;
  const H = document.documentElement;
  const poster = () => root?.dataset.tier === 'poster' || !H.classList.contains('hero3d') || H.classList.contains('poster');
  const say = (detail: string) => window.dispatchEvent(new CustomEvent('skreed:room-state', { detail }));
  /** an asset the section needs failed: the stills and the list stand in, the island stops drawing the section */
  const toPoster = () => { pendingEnter = false; if (root) root.dataset.tier = 'poster'; };
  const look = { yaw: 0, pitch: 0 };

  const screens = () => (state === 'universe' ? ROOM_HEIGHT_ENTERED : ROOM_HEIGHT);
  const screenPx = () => height / screens();
  const setState = (s: RoomState) => { state = s; if (root) root.dataset.state = s; measure(); };
  const params = (): RoomParams => liveRoomParams();
  const tLen = () => (reduced ? 600 : Math.max(400, params().transitionMs));

  function loadUniverse(): Promise<void> {
    return (uniImport ??= import('./universe.ts').then(async (m) => {
      const u = m.createUniverse({ renderer, avif: o.avif, reduced, touch: o.touch });
      universe = u;
      u.resize(renderer.domElement.width, renderer.domElement.height);
      await u.load();
      if (u.failed) toPoster();
      else if (pendingEnter) {
        // a press waited for the universe: it enters only while the visitor is still at the door
        pendingEnter = false;
        if (inRoom && state === 'hall' && lastNear > 0) startEnter(); else say('unbusy');
      }
      window.dispatchEvent(new CustomEvent('skreed:room-universe', { detail: { ready: u.ready, failed: u.failed } }));
    }).catch((e: unknown) => {
      console.warn('section 4: the universe chunk did not load', e);
      toPoster();
      window.dispatchEvent(new CustomEvent('skreed:room-universe', { detail: { ready: false, failed: true } }));
    }));
  }

  function snap(qq: number, smooth = false) {
    if (!measured) measure();
    const y = Math.round(top + qq * screenPx());
    if (smooth && !reduced) { scrollTo({ top: y, behavior: 'smooth' }); return; }
    scrollTo({ top: y, behavior: 'instant' }); follow.snap(qq); q = qAll = qq; snapped = true;
  }

  const STATION_Q = ROOM_SCREENS.wipe + ROOM_SCREENS.walk + 0.5;
  function startEnter() {
    if (state !== 'hall') return;
    if (q < ROOM_SCREENS.wipe + ROOM_SCREENS.walk) snap(STATION_Q);   // off-station: to the station first, in the same task
    transP = 0; seekP = -1;
    setState('entering');
    say('entering');
  }

  function finishEnter() {
    setState('universe');
    hall.swing(0, params().door);
    if (inRoom) snap(PAN_START);   // the universe's map starts at q 10 whatever q the prompt was pressed at
    say('universe');
  }

  const island: RoomIsland = {
    snap,
    enter() {
      if (state !== 'hall' || !hall.ready || poster()) return false;
      if (universe?.failed) { toPoster(); return false; }
      if (universe?.ready) { startEnter(); return true; }
      pendingEnter = true; void loadUniverse();
      if (q < ROOM_SCREENS.wipe + ROOM_SCREENS.walk) snap(STATION_Q);
      return false;
    },
    skip() { if (state === 'entering') { transP = 1; seekP = -1; } },
    pick(px, py) { return state === 'universe' && universe?.ready ? universe.pick(px, py) : -1; },
    setHover(i) { hover = i; holdSway = i >= 0 || i === -2; },
  };
  window.__skreedRoom = island;

  const api: RoomDirector = {
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
      loopP = state === 'entering' || !inRoom || poster() ? 0 : clamp01((qAll - loopStart(state === 'universe')) / ROOM_SCREENS.loop);
      return { loop: loopP };
    },
    step(f) {
      const P = params();
      if (poster()) return { on: false, tex: null, wipeIn: 0, groundNeeded: false, loop: 0, toneDark: false };
      // the universe's assets load during the walk (spec 5, "Loading")
      if (hall.ready && inRoom && q > ROOM_SCREENS.wipe && !uniImport) void loadUniverse();
      // the third wipe waits for the hall; if it becomes ready while the section is in view it plays over a second
      if (hall.ready && !wasReady) {
        wasReady = true; revealAt = qRaw > 0.02 && !reduced ? f.t : -1; snapped = true;
        if (loopP > 0) armed = false;   // the hall arrived with the visitor on the loop screen: no jump until they scroll across it again
      }
      const clock = revealAt < 0 ? 1 : clamp01((f.t - revealAt) / 1.0);
      const wipeIn = hall.ready ? Math.min(clamp01(q / ROOM_SCREENS.wipe), clock) : 0;
      // the head: the pointer's sway on laptops (held while the pointer is over the prompt or a product), the keys' turn, the drag
      const sway = f.touch || reduced ? 0 : 1, extra = window.__skreedRoomLook;
      if (!holdSway) {
        const ty = (f.pointer.active ? f.pointer.ndc.x * P.lookYaw : 0) * sway, tp = (f.pointer.active ? f.pointer.ndc.y * P.lookPitch : 0) * sway;
        look.yaw = lerpFPS(look.yaw, ty, f.mouseRate, f.ratio); look.pitch = lerpFPS(look.pitch, tp, f.mouseRate, f.ratio);
      }
      const keyYaw = (extra?.yaw ?? 0) + (P.mouseLook >= 0.5 ? extra?.drag ?? 0 : 0), headYaw = look.yaw + keyYaw;
      const on = hall.ready && inRoom && q > 0;
      let tex: Texture | null = null, toneDark = false, nearDoor = 0, prompt: { x: number; y: number } | null = null, active = -1;
      let labels: ({ x: number; y: number } | null)[] = [];

      if (state === 'hall' || state === 'entering') {
        const walk = clamp01((q - ROOM_SCREENS.wipe) / ROOM_SCREENS.walk), end = HALL.door.face + Math.min(HALL.promptFrom - 0.05, Math.max(0.6, P.stationDist));
        // reduced motion: four cuts, the start, the middle, just inside the prompt's range and the station (spec 4)
        const w3 = (HALL.start - (HALL.door.face + HALL.promptFrom - 0.05)) / (HALL.start - end);
        const w2 = reduced ? (walk < 0.33 ? 0 : walk < 0.66 ? 0.5 : walk < w3 ? w3 : 1) : walk;
        if (state === 'hall') {
          // the walk is clamped at 1.0 m per second (spec 2), except across a snap, the hall's arrival, the jump and the cuts
          const xT = HALL.start + (end - HALL.start) * w2, mx = 1.0 * f.dt;
          x = snapped || reduced ? xT : x + Math.max(-mx, Math.min(mx, xT - x));
        }
        snapped = false;
        nearDoor = clamp01((HALL.promptFrom - (x - HALL.door.face)) / (HALL.promptFrom - (end - HALL.door.face)));
        lastNear = nearDoor;
        if (pendingEnter && state === 'hall' && (nearDoor <= 0 || !inRoom)) { pendingEnter = false; say('unbusy'); }   // the visitor walked away from a waiting press
        if (state === 'entering') {
          const T = tLen();
          if (seekP >= 0) transP = seekP; else if (transP < 1) transP = clamp01(transP + (f.dt * 1000) / T);
          // the leaves (0.9 s, cubic ease-out) and the dolly (1.6 m from 0.3 s over 0.9 s, cubic ease-in-out); none under reduced motion
          const sw = reduced ? 0 : 1 - Math.pow(1 - clamp01(transP / TRANSITION.swing[1]), 3);
          const dk = clamp01((transP - 0.125) / 0.375), dolly = reduced ? 0 : (dk < 0.5 ? 4 * dk ** 3 : 1 - Math.pow(-2 * dk + 2, 3) / 2) * 1.6;
          hall.swing(sw, P.door);
          hall.update(end - dolly, look, 1, f.t, P);
        } else if (on) {
          hall.swing(0, P.door);
          hall.update(x, { yaw: headYaw, pitch: look.pitch, anchorYaw: keyYaw }, nearDoor, f.t, P);
        }
        // during the transition the hall draws only until the white covers it (its last frame stays under the white)
        const hallSeen = state === 'hall' ? on : inRoom && transP < (reduced ? 0.45 : TRANSITION.whiteIn[1]) + 0.01;
        if (hallSeen) {
          hall.render();
          if (state === 'hall') prompt = hall.project(HALL.door.handle);
        }
        tex = hall.out;
        toneDark = false;
        if (state === 'entering') {
          const u = universe;
          // the last steps into the room over the universe's fade-in (0.4 m, cubic ease-out); none under reduced motion
          const ui = clamp01((transP - TRANSITION.toIn[0]) / (TRANSITION.toIn[1] - TRANSITION.toIn[0])), uDolly = reduced ? 0 : (1 - (1 - Math.pow(1 - ui, 3))) * 0.4;
          // the universe draws only from just before it starts to show under the bands
          if (u?.ready && inRoom && transP >= (reduced ? 0.55 : TRANSITION.toIn[0]) - 0.03) { u.update(-UNIVERSE.arcSpan, { yaw: 0, pitch: 0 }, -1, uDolly, f.dt, P); u.render(); }
          const sweepLen = ((1 + 10 * P.sweepWidth + 0.08) / Math.max(0.1, P.sweepSpeed)) * 1000 / tLen();   // the ribbon, the screen and a feather either side (transition.ts)
          const s0 = TRANSITION.whiteIn[1];
          if (hall.out && u?.out && inRoom) { trans.run(hall.out, u.out, transP, P.sweepWidth, P.sweepAngle, [s0, Math.min(0.995, s0 + sweepLen)], reduced); tex = trans.out; }
          toneDark = transP > 0.2;
          if (transP >= 1 && seekP < 0) finishEnter();
        }
      } else if (state === 'universe' && universe?.ready) {
        const pan = clamp01((q - PAN_START) / ROOM_SCREENS.pan);
        // reduced motion: three cuts, left, centre and right (spec 4)
        const pan2 = reduced ? Math.round(pan * 2) / 2 : pan;
        yaw = -UNIVERSE.arcSpan + 2 * UNIVERSE.arcSpan * pan2;
        universe.update(yaw, { yaw: headYaw, pitch: look.pitch }, hover, 0, f.dt, P);
        if (on) universe.render();
        tex = universe.out;
        toneDark = true;
        // the active pedestal: the one the pan has nearest the centre of the screen, among those with a product
        let best = Infinity;
        for (let i = 0; i < UNIVERSE.pedestals; i++) { if (!universe.shown(i)) continue; const d = Math.abs(pedestalAt(i).deg - yaw); if (d < best) { best = d; active = i; } }
        labels = universe.anchors();
      }

      // the hand-off from the fog (Tune: handoff): 0 the composite's ice-shard cut, 1 a cut at half the screen, 2 a fade
      const handoff = P.handoff >= 1.5 ? 'fade' : P.handoff >= 0.5 ? 'cut' : 'wipe';
      // (in the hall, and in the universe too when the visitor scrolls back up to the quiz)
      const handing = state !== 'entering';
      let wipe = handing ? wipeIn : 1;
      const groundNeeded = handing && wipeIn < 1;
      if (handing && handoff === 'cut') wipe = wipeIn >= CUT_AT ? 1 : 0;
      if (handing && handoff === 'fade' && wipeIn < 1 && f.fog && tex) { const m = getMix(); m.run(f.fog, tex, wipeIn, 0, 0, [0, 0], false, true); tex = m.out; wipe = 1; }
      window.__skreedRoomFrame?.({
        q, x, nearDoor, ready: hall.ready, failed: hall.failed, inView: inRoom && qRaw > 0, prompt, state,
        universeReady: !!universe?.ready, transition: transP, yaw, active, hover, labels, loop: loopP, jumped,
      } satisfies RoomFrame);
      jumped = false;
      const shown = on || (state === 'entering' && inRoom);
      return { on: shown && !!tex, tex: shown ? tex : null, wipeIn: wipe, groundNeeded, loop: loopP, toneDark };
    },
    after() {
      if (loopP >= JUMP_AT && armed && inRoom) {
        armed = false; jumped = true;
        scrollTo({ top: 0, behavior: 'instant' });
        o.onJump();
        follow.snap(0); q = qAll = 0; loopP = 0; revealAt = -1; pendingEnter = false; snapped = true;
        if (state === 'universe' && params().lapReset >= 0.5) setState('hall');
        hall.swing(0, params().door); x = HALL.start; hover = -1;
        say('jump');
      } else if (loopP < 0.5) armed = true;
    },
    resize(w, h) { curW = w; curH = h; hall.resize(w, h); trans.resize(w, h); mix?.resize(w, h); universe?.resize(w, h); measure(); },
    // the hall, then the transition's program compiled in the section's own warm-up (not on the press)
    load() { return hall.load().then(() => { if (hall.ready && hall.out) trans.run(hall.out, hall.out, 0.5, 0.12, 45, [0.4, 0.8], reduced); }); },
    hooks() {
      return { state, q: +q.toFixed(3), qRaw: +qRaw.toFixed(3), loop: +loopP.toFixed(3), transition: +transP.toFixed(3), screens: screens(), hall: hall.hooks(), universe: universe?.hooks() ?? null, pedestalQ: Array.from({ length: UNIVERSE.pedestals }, (_, i) => +pedestalQ(i).toFixed(3)) };
    },
    dispose() {
      ro?.disconnect(); removeEventListener('resize', measure);
      hall.dispose(); trans.dispose(); mix?.dispose(); universe?.dispose();
      if (window.__skreedRoom === island) window.__skreedRoom = undefined;
    },
  };
  // the test and stills hooks (spec 5): the transition by its clock, entering without the walk
  (api as unknown as { seek(sec: number): void }).seek = (sec: number) => {
    if (state === 'hall') { if (!universe?.ready) return; startEnter(); }
    seekP = clamp01((sec * 1000) / tLen()); transP = seekP;
    if (seekP >= 1) { seekP = -1; }
  };
  (api as unknown as { enterNow(): boolean }).enterNow = () => island.enter();
  return api;
}
