// The page scroll (docs/specs/section-4-flux.md 2 "The elastic glue" and "The top of the page", 5 "Inputs", "Glue
// spans", "Capture, by state and position" and "The island modules": scroll.ts; X-5, E-S4-scroll, E-S4-snap). Its own
// chunk, import()ed by hero.ts and never created on the poster tier; scripts/hero/budget.mjs attributes it by the
// marker skreed:scroll. Native scroll stays the page's position; this module adds three things on top of it. (1) The
// glue: when a run the visitor made with the wheel, one finger or a scrolling key stops inside a glue span, the page
// settles to the span's nearer end, once per run, 0.5 s on --ease-standard (instant under reduced motion), cancelled by
// any new input, never after a scroll it cannot see as input (focus, scrollIntoView, find), never with a typing control
// focused, a finger or a button down, the keyboard up, the page zoomed, two spans in view, or a focused element that
// would leave the viewport. (2) The carousel's gestures while it is in range: a wheel tick through the burst filter, a
// one-finger swipe decided on its first move, and the keys of section 2, each one whole step through the adapter; a
// gesture at either edge (on at scene 5, back at scene 1, section-4-no-hall.md 2) is left to the page, and anything
// during a step or its cooldown is swallowed. Never captured: Ctrl+wheel, more than one finger, or anything while
// visualViewport.scale is above 1.01. The burst filter is fed by every wheel event, captured or not, so a burst that
// carries the page into the carousel's range is never mistaken for a new one, and a wheel event against the direction
// of the input that carried the page in begins a burst of its own (at scene 1 it is the page's). The non-passive wheel
// and touch listeners exist only while the carousel is in range. (3) The key steps (docs/specs/scroll-steps.md 4; Sam,
// 2026-11-04): out of the carousel's range, or at its edges, ArrowDown, PageDown and Space ride the page to the next of
// its rests (the hero, the gems, the quiz, scene 1, scene 5, section 5) and ArrowUp, PageUp and Shift+Space to the one
// before, one rest a keydown, on --ease-standard over a length that grows with the distance (KEY_RIDE), the step keys
// swallowed while it rides and for its cooldown, the ride ended by a wheel, a touch or a press; with no rest that way the
// key is the browser's. The wheel and the touch stay the page's own out of the carousel. No wrap from the top since
// 2026-11-04 (Sam: "i cant go to the bottom of the site from the top section, remove that trick"). The adapter is the one
// link to the director, so this module imports nothing else from section4/ (tests/unit/page-scroll.test.ts).
import { BURST, GLUE, KEY_RIDE, burstConsume, burstFeed, burstReset, createBurst, easeStandard, glueDecision, isScrollKey, keyDir, keyRideMs, nextStop, touchDecision, wheelDecision, type Span, type TouchVerdict } from './scroll-math.ts';

export type { Span } from './scroll-math.ts';

/** the marker the budget attributes this chunk by; it rides the returned object (mark) so the bundler keeps it in the chunk */
export const SCROLL_MARK = 'skreed:scroll';

/** The director's side, handed in by the wiring: the only thing this module knows about section 4. */
export interface RoomAdapter {
  /** the raw position within 2 px of the scenes' range and the state is world */
  inRange(): boolean;
  /** a gesture in that direction meets an edge the page takes: scene 5 forward, scene 1 back */
  edge(dir: 1 | -1): boolean;
  /** one whole step; false when refused for a reason other than busy (the next still not resident), and the burst is then not consumed */
  step(dir: 1 | -1): boolean;
  /** a step runs or its 150 ms cooldown: gestures are swallowed and the wheel's burst consumed */
  busy(): boolean;
  /** a wheel event the page cannot cancel came in range, forward (both ways under twoWay): the other side holds the page on its rest while they come */
  carried(dir: 1 | -1): void;
}

export interface PageScrollOptions {
  room: RoomAdapter;
  /** the glue spans in document px, measured fresh for every decision */
  spans: () => Span[];
  /** a probe element's 100svh in px */
  svh: () => number;
  reduced: boolean;
  /** a hooks build: ?glue=0 turns the glue off */
  hooks: boolean;
  /** the settle's length in ms when Tune sets one (snapMs, X-13); GLUE.settleMs otherwise */
  settleMs?: () => number | undefined;
  /** the page's rests for the key steps in document px, measured fresh for every press; one that cannot be read (a section behind the quiz gate) is NaN and skipped */
  stops?: () => number[];
  /**
   * the range is entered from either end (the family pages' case types, entered from the zoom below and from the argument
   * screen above): the input that carried the page in is swallowed in its own direction, and a wheel event the page cannot
   * cancel is carried both ways. Section 4's scenes are entered from above only, as before
   */
  twoWay?: boolean;
}

export interface PageScrollState { armed: boolean; settling: boolean; capturing: boolean; riding: boolean }

export interface PageScroll {
  /** the budget's marker, SCROLL_MARK */
  readonly mark: string;
  /** the room's state changed: re-evaluate what is attached */
  notify(): void;
  glue(on: boolean): void;
  dispose(): void;
  state(): PageScrollState;
}

type Touch1 = { y: number; decided: boolean; ours: boolean; done: boolean };

const typing = (el: Element | null): boolean =>
  !!el && ((el as HTMLElement).isContentEditable === true || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');

export function createPageScroll(o: PageScrollOptions): PageScroll {
  const { room } = o;
  const html = document.documentElement;
  const vv = window.visualViewport ?? null;
  let glueOn = !(o.hooks && new URLSearchParams(location.search).get('glue') === '0');
  let disposed = false, capturing = false;
  // the glue: the last input that counts, the run it may arm, the fingers and buttons down, the still timer
  let lastInput = -Infinity, runOpen = false, armed = false, touches = 0, stillPending = false, timer = 0;
  const pointers = new Set<number>();
  // the settle under way and the position it last wrote; whether it is a key step's ride, and when the last ride ended
  let settling = false, raf = 0, wrote = NaN, riding = false, rideEnd = -Infinity;
  // the one-finger touch under way while capturing
  let touch: Touch1 | null = null;
  const burst = createBurst();
  // the burst running as the capture attached in range (a fling from the quiz that carried the page onto scene 1): the page's,
  // in its direction (1 down the page, -1 up it; 0 none); the last wheel event's direction
  let inherited: 0 | 1 | -1 = 0, lastDir: 1 | -1 = 1;
  const now = () => performance.now();
  const zoomed = () => (vv?.scale ?? 1) > 1.01;
  const keyboardUp = () => !!vv && vv.height < innerHeight - 1;
  /** a popover or a dialog is open over the page (the section index's drawer): the keys are its own, never a step */
  const overlaid = () => { try { return !!document.querySelector(':popover-open, dialog[open]'); } catch { return false; } };
  /** a carousel step or its cooldown: a gesture is swallowed whole */
  const held = () => room.busy();

  // ---- the settle (the glue's) and the ride (a key step's): one instant scrollTo a frame on --ease-standard
  /** the settle or the ride stops where it is: a ride ended this way leaves no cooldown, the visitor having taken over */
  const cancelSettle = () => {
    if (!settling) return;
    settling = false; wrote = NaN; riding = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  /** a visitor's input: the glue's arming for the run it makes, and the end of any settle or ride */
  const input = () => { lastInput = now(); cancelSettle(); };
  const settle = (from: number, to: number, ms: number = o.settleMs?.() || GLUE.settleMs) => {
    const done = () => { settling = false; wrote = NaN; if (riding) { riding = false; rideEnd = now(); } };
    if (o.reduced) { scrollTo({ top: to, behavior: 'instant' }); done(); return; }
    settling = true;
    const t0 = now();
    const frame = () => {
      raf = 0;
      if (!settling) return;
      const p = Math.min(1, (now() - t0) / ms);
      const y = p >= 1 ? to : from + (to - from) * easeStandard(p);
      wrote = y;
      scrollTo({ top: y, behavior: 'instant' });
      if (p >= 1) { done(); return; }
      raf = requestAnimationFrame(frame);
    };
    frame();
  };
  /** a key step: the page ridden from where it is to the rest, its length by the distance (KEY_RIDE) */
  const ride = (from: number, to: number) => { cancelSettle(); riding = true; settle(from, to, keyRideMs(to - from, innerHeight)); };
  /** a ride runs, or its cooldown: the step keys are swallowed */
  const stepping = () => riding || now() - rideEnd < KEY_RIDE.cooldownMs;

  // ---- the glue's decision, once the run is still
  // The focused element a settle must keep in view: only a focus the visitor sees (:focus-visible, a keyboard's), and only
  // one the page's scroll moves. A link or a button keeps the focus after a click with no ring to show for it, and the
  // navbar's links are fixed to the viewport while their document rect moves with every scroll, so either froze every
  // settle forward after a visit through the navbar or a click in the scenes (Sam, 2026-11-03: "the glue stick is not
  // working")
  const seen = (el: Element) => { try { return el.matches(':focus-visible'); } catch { return true; } };
  const fixed = (el: Element) => { try { for (let n: Element | null = el; n && n !== html; n = n.parentElement) if (getComputedStyle(n).position === 'fixed') return true; } catch { /* no styles to read */ } return false; };
  const keepRect = () => {
    const el = document.activeElement;
    if (!el || el === document.body || el === html || !seen(el) || fixed(el)) return null;
    const r = el.getBoundingClientRect();
    return r.height > 0 ? { top: r.top + scrollY, bottom: r.bottom + scrollY } : null;
  };
  const onStill = () => {
    timer = 0;
    if (disposed) return;
    if (touches > 0 || pointers.size > 0) { stillPending = true; return; }   // a finger or a button down: after the release
    stillPending = false; runOpen = false;
    const was = armed; armed = false;
    if (!was || !glueOn || settling || typing(document.activeElement) || keyboardUp() || zoomed()) return;
    const y = scrollY, to = glueDecision(y, o.spans(), innerHeight, o.svh(), { keep: keepRect() });
    if (to === null || Math.abs(to - y) <= GLUE.dead) return;
    settle(y, to);
  };
  const schedule = () => { if (timer) clearTimeout(timer); timer = window.setTimeout(onStill, GLUE.stillMs); };
  const released = () => { if (glueOn && stillPending && touches === 0 && pointers.size === 0) schedule(); };

  // ---- the capture set: wheel and touch while the carousel is in range
  const onWheel = (e: WheelEvent) => {
    if (zoomed()) return;                                       // onWheelAny feeds the burst for this one
    // a forward event the page cannot cancel, in the scenes short of the last: a gesture the browser latched before the
    // capture attached (the trackpad's own scroll that carried the page in, its momentum included) scrolls the page
    // natively whatever is done here, so it never steps, and the director holds the page on the scene's q while it comes
    const wd: 0 | 1 | -1 = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (!e.cancelable && !e.ctrlKey && wd !== 0 && (wd > 0 || o.twoWay) && room.inRange() && !room.edge(wd)) { burstFeed(burst, e.deltaY, now(), true); burstConsume(burst); room.carried(wd); return; }
    // the rest of the input that carried the page onto scene 1, in its own direction: swallowed whole, its clock fed,
    // however its later pushes compare with its peak (a fling still speeding up as it reached scene 1), until 0.7 s of
    // silence (BURST.carriedMs); a gesture after that is the visitor's (section-4-no-hall.md AC3)
    if (inherited !== 0) {
      if (wd === inherited && !e.ctrlKey && now() - burst.last <= BURST.carriedMs) { burstFeed(burst, e.deltaY, now(), true); burstConsume(burst); e.preventDefault(); return; }
      // the carried input is over: a wheel event the other way is the visitor's own gesture and begins a burst of its own,
      // never judged as the carried burst's tail by its peak (at scene 1 it is the page's at once, up into the wipe,
      // section-4-no-hall.md AC4)
      const against = wd === -inherited;
      inherited = 0;
      if (against) burstReset(burst);
    }
    if (!room.inRange()) return;                                // the page's own between the room's frames
    const v = wheelDecision(burst, e.deltaY, now(), { busy: room.busy(), edgeForward: room.edge(1), edgeBack: room.edge(-1), ctrl: e.ctrlKey });
    if (v.kind === 'page') return;
    e.preventDefault();
    if (v.kind === 'step' && room.step(v.dir)) burstConsume(burst);
  };
  const onTouchStart = (e: TouchEvent) => {
    touch = e.touches.length === 1 && !zoomed() ? { y: e.touches[0].clientY, decided: false, ours: false, done: false } : null;
  };
  const act = (t: Touch1, v: TouchVerdict) => {
    if (v.kind !== 'step') return;
    t.done = true;
    if (!room.edge(v.dir)) room.step(v.dir);
  };
  const onTouchMove = (e: TouchEvent) => {
    const t = touch;
    if (!t) return;
    if (e.touches.length !== 1 || zoomed()) { touch = null; return; }   // a second finger, or a zoomed viewport: the page's
    const y = e.touches[0].clientY, inRange = room.inRange();
    if (!t.decided) {
      if (!inRange) { touch = null; return; }                    // nowhere ours: the page's
      if (held()) { t.decided = t.ours = t.done = true; e.preventDefault(); return; }   // a step or its cooldown swallow the touch whole
      const v = touchDecision(t.y, y, room.edge(1), room.edge(-1));
      if (v.kind === 'none') return;
      t.decided = true;
      if (v.kind === 'page') return;
      t.ours = true;
      e.preventDefault();
      act(t, v);
      return;
    }
    if (!t.ours) return;
    e.preventDefault();
    if (t.done) return;
    if (held()) { t.done = true; return; }
    act(t, touchDecision(t.y, y, inRange && room.edge(1), inRange && room.edge(-1)));
  };
  const onTouchEnd = () => { touch = null; };
  const capture: [string, EventListener, AddEventListenerOptions][] = [
    ['wheel', onWheel as EventListener, { passive: false }],
    ['touchstart', onTouchStart as EventListener, { passive: true }],
    ['touchmove', onTouchMove as EventListener, { passive: false }],
    ['touchend', onTouchEnd, { passive: true }],
    ['touchcancel', onTouchEnd, { passive: true }],
  ];
  const evaluate = () => {
    if (disposed) return;
    const want = room.inRange();
    if (want === capturing) return;
    capturing = want;
    if (want) {
      // a wheel burst still running as the set attaches is the page's (a fling from the quiz that carried the page onto
      // scene 1): consumed; in range, the input of the last 0.7 s is inherited, so its tail
      // never steps (onWheel)
      const quiet = now() - burst.last;
      if (quiet <= BURST.silenceMs) burstConsume(burst);
      inherited = room.inRange() && quiet <= BURST.carriedMs ? (o.twoWay ? lastDir : 1) : 0;
      for (const [n, f, opt] of capture) addEventListener(n, f, opt);
    } else { for (const [n, f, opt] of capture) removeEventListener(n, f, opt); touch = null; inherited = 0; }
  };

  // ---- always on: the scroll itself, and the inputs that arm the glue, cancel a settle or feed the burst clock
  const onScroll = () => {
    if (settling) {
      if (Math.abs(scrollY - wrote) <= 1.5) { evaluate(); return; }   // our own frame
      cancelSettle();                                                 // something else moved the page
    }
    if (!runOpen) { runOpen = true; armed = false; }
    if (now() - lastInput <= GLUE.inputMs) armed = true;
    evaluate();
    if (glueOn) schedule();
  };
  const onWheelAny = (e: WheelEvent) => {
    if (e.ctrlKey) return;
    if (e.deltaY !== 0) lastDir = e.deltaY > 0 ? 1 : -1;
    input();
    if ((!capturing || zoomed()) && e.deltaY !== 0) burstFeed(burst, e.deltaY, now());   // the clock runs where onWheel does not decide
  };
  const onTouchAny = (e: TouchEvent) => {
    touches = e.touches.length;
    if (e.type === 'touchend' || e.type === 'touchcancel') { if (touches === 0) released(); return; }
    if (touches === 1) input();
  };
  /**
   * Every keydown. A step key (keyDir: never with a modifier, in a typing control or on a button, never one a control
   * already took, as the quiz's answers take the arrows): in the carousel's range, short of its edges, one scene a keydown
   * (swallowed during a step or its cooldown, as the reference's he() does); elsewhere one rest a keydown (a ride, its
   * cooldown swallowing the keys). Any other key ends a settle, and a ride only if it scrolls; a scrolling key the browser keeps arms the glue.
   */
  const onKeyAny = (e: KeyboardEvent) => {
    const d = zoomed() || overlaid() ? null : keyDir(e);
    if (d !== null) {
      if (room.inRange()) {
        if (room.busy()) { e.preventDefault(); return; }       // a step or its cooldown, before the edges
        if (!room.edge(d)) { e.preventDefault(); if (!e.repeat) room.step(d); return; }   // one step per keydown
      }
      if (stepping()) { e.preventDefault(); return; }         // a ride or its cooldown: swallowed
      const y = scrollY, to = o.stops ? nextStop(y, o.stops(), d) : null;
      if (to !== null) {
        e.preventDefault();
        if (!e.repeat) ride(y, to);                             // one rest per keydown
        return;
      }
    }
    // a key that scrolls ends a settle or a ride; any key ends a settle, but a ride runs on through a modifier's press
    // (the Shift of Shift+Space, a shortcut's Cmd) or any other key that does not move the page
    if (!riding || isScrollKey(e.key)) cancelSettle();
    if (!e.defaultPrevented && isScrollKey(e.key)) lastInput = now();
  };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;                     // fingers are counted by the touches
    if (e.type === 'pointerdown') { pointers.add(e.pointerId); cancelSettle(); }
    else { pointers.delete(e.pointerId); released(); }
  };
  const onBlur = () => { pointers.clear(); touches = 0; touch = null; };
  const always: [string, EventListener, AddEventListenerOptions][] = [
    ['scroll', onScroll, { passive: true }],
    ['wheel', onWheelAny as EventListener, { passive: true }],
    ['touchstart', onTouchAny as EventListener, { passive: true }],
    ['touchmove', onTouchAny as EventListener, { passive: true }],
    ['touchend', onTouchAny as EventListener, { passive: true }],
    ['touchcancel', onTouchAny as EventListener, { passive: true }],
    ['keydown', onKeyAny as EventListener, {}],
    ['pointerdown', onPointer as EventListener, { passive: true }],
    ['pointerup', onPointer as EventListener, { passive: true }],
    ['pointercancel', onPointer as EventListener, { passive: true }],
    ['blur', onBlur, {}],
  ];
  for (const [n, f, opt] of always) addEventListener(n, f, opt);
  evaluate();

  return {
    mark: SCROLL_MARK,
    notify: evaluate,
    glue(on) {
      glueOn = on;
      if (on) return;
      cancelSettle(); armed = false; stillPending = false;
      if (timer) { clearTimeout(timer); timer = 0; }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelSettle();
      if (timer) { clearTimeout(timer); timer = 0; }
      for (const [n, f, opt] of always) removeEventListener(n, f, opt);
      if (capturing) for (const [n, f, opt] of capture) removeEventListener(n, f, opt);
      capturing = false; touch = null;
    },
    state: () => ({ armed, settling, capturing, riding }),
  };
}
