// The case types' steps (docs/specs/family-page.md 26, docs/specs/scroll-steps.md 3; Sam, 2026-11-04: "apply this exact
// same concept on the family pages for the case types, same for the phone swipe as well", the concept being section 4's:
// "One gesture moves you one whole scene ... While a change is playing, plus a short pause after it, any more scrolling is
// ignored ... A long trackpad swipe still counts as one step, not several"). Between the four types' rests (Tough,
// MagTough, Snap and Armor at screens 2, 3, 4 and 5, pose.ts CASE_REST) one wheel burst, one swipe or one step key rides
// the page a whole screen to the next type, its turn and its sweep played by the scroll as before (the stage lags it),
// on --ease-turn over CASE_STEP_MS; during the ride and its cooldown every gesture is swallowed. At Tough a gesture back
// and at Armor a gesture on are the page's own, up into the zoom and on to the argument screen. The gestures are section
// 4's own module (hero/section4/scroll.ts, its burst filter, touch rule and key table), driven through its adapter with
// twoWay on; this module is the adapter's other side: the rests, the ride, and the arrival's hold, which puts a page that
// its own scroll carried into the types (a fling from the zoom, a key's smooth scroll, the argument screen scrolled up)
// back on the type it entered at and holds it there against the momentum until it is still. Made on every family page
// and acting only while the 3D tier is on (html.m3d, read at each decision, so a page that loads in swatch grid mode and
// then shows 3D steps too); a ride is an instant scrollTo under reduced motion. The beat nav rides here too.
import { createPageScroll, type PageScroll } from '../hero/section4/scroll.ts';
import { cubicBezier, isScrollKey, nextStop } from '../hero/section4/scroll-math.ts';
import { CASE_REST, CASE_TYPES } from './three/pose.ts';
import { CASE_HOLD_MAX_MS, CASE_HOLD_STILL_MS, CASE_STEP_COOLDOWN_MS, CASE_STEP_MAX_MS, CASE_STEP_MS, TURN_EASE } from './timing.ts';

/** the four types' rests in screens, in beat order */
export const CASE_RESTS: readonly number[] = CASE_TYPES.map((t) => CASE_REST[t]);
/** a ride's length for a distance in screens: one screen CASE_STEP_MS, more by the screen, at most CASE_STEP_MAX_MS */
export const caseRideMs = (screens: number): number => Math.round(Math.min(CASE_STEP_MAX_MS, Math.max(1, Math.abs(screens)) * CASE_STEP_MS));
const easeTurn = cubicBezier(...TURN_EASE);
/** the 2 px within which the page is at a rest, as the glue's dead band */
const DEAD = 2;
/** a phone's momentum after the finger lifts: a crossing this soon after the release is still the swipe's */
const MOMENTUM_MS = 3000;

export interface CaseSteps {
  /** ride to type i (0 Tough to 3 Armor), the beat nav's press; false while a ride or its cooldown runs */
  go(i: number): boolean;
  /** the review hooks: whether a ride or a hold runs */
  state(): { riding: boolean; holding: boolean; inRange: boolean };
  dispose(): void;
}

export function createCaseSteps(o: { reduced: () => boolean }): CaseSteps {
  const H = document.documentElement;
  const on = () => H.classList.contains('m3d') && !H.classList.contains('grid');
  const vh = () => innerHeight;
  const px = (i: number) => Math.round(CASE_RESTS[i] * vh());
  const rests = () => CASE_RESTS.map((_, i) => px(i));
  const now = () => performance.now();
  let disposed = false;

  // ---- the ride: one instant scrollTo a frame on --ease-turn; ended only by a scroll it did not write (the scrollbar)
  let riding = false, rideEnd = -Infinity, raf = 0, wrote = NaN;
  const endRide = () => { if (raf) cancelAnimationFrame(raf); raf = 0; if (riding) { riding = false; rideEnd = now(); } wrote = NaN; };
  function ride(to: number): boolean {
    endHold();
    const from = scrollY;
    if (Math.abs(to - from) <= DEAD) return false;
    if (o.reduced()) { rideEnd = now(); scrollTo({ top: to, behavior: 'instant' }); return true; }
    riding = true;
    const t0 = now(), ms = caseRideMs((to - from) / vh());
    const frame = () => {
      raf = 0;
      if (!riding || disposed) return;
      if (!Number.isNaN(wrote) && Math.abs(scrollY - wrote) > 1.5) { endRide(); return; }   // someone else moved the page
      const p = Math.min(1, (now() - t0) / ms);
      const y = p >= 1 ? to : from + (to - from) * easeTurn(p);
      wrote = y;
      scrollTo({ top: y, behavior: 'instant' });
      if (p >= 1) { endRide(); return; }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return true;
  }

  // ---- the arrival's hold: the page put back on the type it entered at each frame it has run past it, until it has
  // been still for CASE_HOLD_STILL_MS, at most CASE_HOLD_MAX_MS after the start or the carrying input's latest event;
  // a finger still down defers it to the release; a new touch, press, key or a wheel the other way lets it go
  let hold: { y: number; dir: 1 | -1; t0: number; last: number } | null = null, holdRaf = 0, pending: { y: number; dir: 1 | -1 } | null = null, fingers = 0;
  const holdFrame = () => {
    holdRaf = 0;
    if (!hold || disposed) return;
    const t = now();
    if (hold.dir > 0 ? scrollY > hold.y + 0.5 : scrollY < hold.y - 0.5) { scrollTo({ top: hold.y, behavior: 'instant' }); hold.last = t; }
    if (t - hold.last >= CASE_HOLD_STILL_MS || t - hold.t0 >= CASE_HOLD_MAX_MS) { endHold(); return; }
    holdRaf = requestAnimationFrame(holdFrame);
  };
  function startHold(y: number, dir: 1 | -1) {
    endHold();
    if (fingers > 0) { pending = { y, dir }; return; }
    const t = now();
    hold = { y, dir, t0: t, last: t };
    holdFrame();
  }
  function endHold() { pending = null; hold = null; if (holdRaf) cancelAnimationFrame(holdRaf); holdRaf = 0; }
  const letGo = (e: Event) => {
    if (!hold) return;
    if (e.type === 'wheel') { const d = (e as WheelEvent).deltaY; if (d !== 0 && (d > 0 ? 1 : -1) === hold.dir) { hold.t0 = now(); return; } }   // the carrying input renews it
    if (e.type === 'keydown' && (e as KeyboardEvent).repeat) { hold.t0 = now(); return; }
    endHold();
  };
  const onFingers = (e: TouchEvent) => {
    fingers = e.touches.length;
    lastFinger = now();
    if (fingers === 0 && pending) { const p = pending; pending = null; startHold(p.y, p.dir); }
  };

  // ---- the arrival: the page's own scroll from a visitor's input (a wheel or a scrolling key in the last 300 ms, a finger
  // down or lifted in the last MOMENTUM_MS, whose momentum runs on after it; never a link, the beat nav, Home, End or the
  // scrollbar), crossing into the types past Tough from below or past Armor from above
  let lastInput = -Infinity, lastFinger = -Infinity, prevY = scrollY;
  const onScroll = () => {
    const y = scrollY, was = prevY;
    prevY = y;
    if (disposed || riding || hold || pending || !on()) return;
    if (now() - rideEnd < 200) return;                          // a ride's own landing (an instant one under reduced motion)
    if (now() - lastInput > 300 && fingers === 0 && now() - lastFinger > MOMENTUM_MS) return;
    const first = px(0), last = px(CASE_RESTS.length - 1);
    if (was < first - DEAD && y > first + DEAD) startHold(first, 1);
    else if (was > last + DEAD && y < last - DEAD) startHold(last, -1);
  };
  const onInput = (e: Event) => {
    if (e.type === 'keydown') { const k = (e as KeyboardEvent).key; if (!isScrollKey(k) || k === 'Home' || k === 'End') return; }
    lastInput = now();
  };

  // the listeners first, before the page scroll's: a key or a wheel that lets the hold go does so before it is judged as a gesture
  const onLost = () => { fingers = 0; if (pending) { const p = pending; pending = null; startHold(p.y, p.dir); } };
  const listeners: [string, EventListener, AddEventListenerOptions][] = [
    ['scroll', onScroll, { passive: true }],
    ['wheel', onInput, { passive: true }], ['touchmove', onInput, { passive: true }], ['keydown', onInput, { passive: true }],
    ['touchstart', onFingers as EventListener, { passive: true }], ['touchend', onFingers as EventListener, { passive: true }], ['touchcancel', onFingers as EventListener, { passive: true }],
    ['touchstart', letGo, { passive: true }], ['pointerdown', letGo, { passive: true }], ['keydown', letGo, { passive: true }], ['wheel', letGo, { passive: true }],
    ['blur', onLost, {}], ['pagehide', onLost, {}],
  ];
  for (const [n, f, opt] of listeners) addEventListener(n, f, opt);

  // ---- section 4's gestures over the types (scroll.ts, twoWay): the adapter
  const inRange = () => on() && scrollY >= px(0) - DEAD && scrollY <= px(CASE_RESTS.length - 1) + DEAD;
  const busy = () => riding || !!hold || !!pending || now() - rideEnd < CASE_STEP_COOLDOWN_MS;
  const ps: PageScroll = createPageScroll({
    reduced: o.reduced(), hooks: false, twoWay: true, spans: () => [], svh: vh,
    room: {
      inRange,
      edge: (d) => (d > 0 ? scrollY >= px(CASE_RESTS.length - 1) - DEAD : scrollY <= px(0) + DEAD),
      step: (d) => { if (busy()) return false; const to = nextStop(scrollY, rests(), d, DEAD); return to !== null && ride(to); },
      busy,
      // a wheel the page cannot cancel in the types (a trackpad gesture the browser latched before the capture attached):
      // the page held on the rest it stands at or last passed, against the gesture's direction
      carried: (d) => {
        if (riding) return;
        if (hold) { hold.t0 = now(); return; }
        const y = scrollY, r = rests();
        const at = d > 0 ? r.filter((x) => x <= y + DEAD).pop() : r.find((x) => x >= y - DEAD);
        if (at !== undefined) startHold(at, d);
      },
    },
  });

  return {
    go(i) {
      if (!on() || busy() || i < 0 || i >= CASE_RESTS.length) return false;
      return ride(px(i));
    },
    state: () => ({ riding, holding: !!hold || !!pending, inRange: inRange() }),
    dispose() {
      if (disposed) return;
      disposed = true;
      endRide(); endHold(); ps.dispose();
      for (const [n, f, opt] of listeners) removeEventListener(n, f, opt);
    },
  };
}
