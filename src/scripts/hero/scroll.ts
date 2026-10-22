// The page scroll (docs/specs/section-4-flux.md 2 "The elastic glue" and "The top of the page", 5 "Inputs", "Glue
// spans" and "The island modules": scroll.ts; X-5, E-S4-scroll, E-S4-snap). Its own chunk, import()ed by hero.ts and
// never created on the poster tier; scripts/hero/budget.mjs attributes it by the marker skreed:scroll. Native scroll
// stays the page's position; this module adds three things on top of it. (1) The glue: when a run the visitor made with
// the wheel, one finger or a scrolling key stops inside a glue span, the page settles to the span's nearer end, once per
// run, 0.5 s on --ease-standard (instant under reduced motion), cancelled by any new input, never after a scroll it
// cannot see as input (focus, scrollIntoView, find), never with a typing control focused, a finger or a button down, the
// keyboard up, the page zoomed, two spans in view, or a focused element that would leave the viewport. (2) The wrap: with
// the intro over, a touch that begins at scroll 0 and moves down 16 px, or a wheel burst that begins at scroll 0 after
// 200 ms of silence, runs the reverse seam onto scene 5 (no key does); overscroll-behavior-y none goes on html once the
// intro is over, and the first touchmove of such a touch is prevented, so neither the rubber band nor pull-to-refresh
// gets it. (3) The carousel's gestures while it is in range: a wheel tick through the burst filter, a one-finger swipe
// decided on its first move, and the keys of section 2, each one whole step through the adapter; a forward gesture at
// scene 5 is left to the page, a backward one at scene 1 is the way back, and anything during a seam or the way back is
// swallowed. Never captured: Ctrl+wheel, more than one finger, or anything while visualViewport.scale is above 1.01.
// The non-passive listeners exist only while the carousel is in range or the page is at scroll 0; the adapter is the
// one link to the director, so this module imports nothing from section4/ (tests/unit/page-scroll.test.ts).
import { GLUE, burstConsume, createBurst, easeStandard, glueDecision, isScrollKey, keyDir, touchDecision, wheelDecision, type Span, type TouchVerdict } from './scroll-math.ts';

export type { Span } from './scroll-math.ts';

/** the marker the budget attributes this chunk by, and the name of the event a settle dispatches ({ detail: { settle: y } }) */
export const SCROLL_MARK = 'skreed:scroll';

/** The director's side, handed in by the wiring: the only thing this module knows about section 4. */
export interface RoomAdapter {
  /** the raw position within 2 px of the scenes' range and the state is world */
  inRange(): boolean;
  /** what a gesture in that direction meets: scene 5 forward, scene 1 back, or a step */
  edge(dir: 1 | -1): 'forward' | 'back' | null;
  /** one whole step; false when refused (a step runs, or its cooldown) */
  step(dir: 1 | -1): boolean;
  /** the way back from scene 1 into the hall */
  back(): void;
  /** the reverse seam from scroll 0 onto scene 5 */
  wrap(): void;
  /** the intro is over and no seam runs */
  canWrap(): boolean;
  /** a seam or the way back is running: gestures are swallowed without stepping */
  lock(): boolean;
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
}

export interface PageScrollState { armed: boolean; settling: boolean; capturing: boolean }

export interface PageScroll {
  /** the room's state changed: re-evaluate what is attached */
  notify(): void;
  glue(on: boolean): void;
  dispose(): void;
  state(): PageScrollState;
}

type Touch1 = { y: number; scroll: number; decided: boolean; ours: boolean; done: boolean };

const typing = (el: Element | null): boolean =>
  !!el && ((el as HTMLElement).isContentEditable === true || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');

export function createPageScroll(o: PageScrollOptions): PageScroll {
  const { room } = o;
  const html = document.documentElement;
  const vv = window.visualViewport ?? null;
  let glueOn = !(o.hooks && new URLSearchParams(location.search).get('glue') === '0');
  let disposed = false, capturing = false, overscroll = false;
  // the glue: the last input that counts, the run it may arm, the fingers and buttons down, the still timer
  let lastInput = -Infinity, runOpen = false, armed = false, touches = 0, stillPending = false, timer = 0;
  const pointers = new Set<number>();
  // the settle under way and the position it last wrote
  let settling = false, raf = 0, wrote = NaN;
  // the one-finger touch under way while capturing
  let touch: Touch1 | null = null;
  const burst = createBurst();
  const now = () => performance.now();
  const zoomed = () => (vv?.scale ?? 1) > 1.01;
  const keyboardUp = () => !!vv && vv.height < innerHeight - 1;

  // ---- the settle
  const cancelSettle = () => {
    if (!settling) return;
    settling = false; wrote = NaN;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  /** a visitor's input: the glue's arming for the run it makes, and the end of any settle */
  const input = () => { lastInput = now(); cancelSettle(); };
  const settle = (from: number, to: number) => {
    const done = () => dispatchEvent(new CustomEvent(SCROLL_MARK, { detail: { settle: to } }));
    if (o.reduced) { scrollTo({ top: to, behavior: 'instant' }); done(); return; }
    settling = true;
    const t0 = now();
    const frame = () => {
      raf = 0;
      if (!settling) return;
      const p = Math.min(1, (now() - t0) / GLUE.settleMs);
      const y = p >= 1 ? to : from + (to - from) * easeStandard(p);
      wrote = y;
      scrollTo({ top: y, behavior: 'instant' });
      if (p >= 1) { settling = false; wrote = NaN; done(); return; }
      raf = requestAnimationFrame(frame);
    };
    frame();
  };

  // ---- the glue's decision, once the run is still
  const keepRect = () => {
    const el = document.activeElement;
    if (!el || el === document.body || el === html) return null;
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

  // ---- the capture set: wheel, touch and keys while the carousel is in range or the page is at scroll 0
  const onWheel = (e: WheelEvent) => {
    if (zoomed()) return;
    const inRange = room.inRange();
    const v = wheelDecision(burst, e.deltaY, now(), {
      atTop: !inRange && scrollY <= 0, canWrap: room.canWrap(), locked: room.lock(),
      edgeForward: inRange && room.edge(1) === 'forward', edgeBack: inRange && room.edge(-1) === 'back', ctrl: e.ctrlKey,
    });
    if (v.kind === 'page') return;
    e.preventDefault();
    if (v.kind === 'wrap') { burstConsume(burst); room.wrap(); }
    else if (v.kind === 'back') { burstConsume(burst); room.back(); }
    else if (v.kind === 'step' && room.step(v.dir)) burstConsume(burst);
  };
  const onTouchStart = (e: TouchEvent) => {
    touch = e.touches.length === 1 && !zoomed() ? { y: e.touches[0].clientY, scroll: scrollY, decided: false, ours: false, done: false } : null;
  };
  const act = (t: Touch1, v: TouchVerdict) => {
    if (v.kind === 'wrap') { t.done = true; room.wrap(); }
    else if (v.kind === 'step') {
      t.done = true;
      const edge = room.edge(v.dir);
      if (edge === 'back') room.back(); else if (edge !== 'forward') room.step(v.dir);
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    const t = touch;
    if (!t) return;
    if (e.touches.length !== 1 || zoomed()) { touch = null; return; }   // a second finger, or a zoomed viewport: the page's
    const y = e.touches[0].clientY, inRange = room.inRange(), atTop = !inRange && t.scroll <= 0;
    if (!t.decided) {
      if ((atTop && !room.canWrap()) || (!atTop && !inRange)) { touch = null; return; }
      if (room.lock()) { t.decided = t.ours = t.done = true; e.preventDefault(); return; }   // a seam or the way back: swallowed whole
      const v = touchDecision(t.y, t.scroll, y, inRange && room.edge(1) === 'forward');
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
    if (room.lock()) { t.done = true; return; }
    act(t, touchDecision(t.y, t.scroll, y, inRange && room.edge(1) === 'forward'));
  };
  const onTouchEnd = () => { touch = null; };
  const onKey = (e: KeyboardEvent) => {
    if (zoomed()) return;
    const d = keyDir(e);
    if (d === null) return;
    if (room.lock()) { e.preventDefault(); return; }
    if (!room.inRange()) return;                                // the top: no key wraps the page
    if (d === 1 && room.edge(1) === 'forward') return;          // scene 5: the page scrolls on
    e.preventDefault();
    if (e.repeat) return;                                       // one step per keydown
    if (d === -1 && room.edge(-1) === 'back') { room.back(); return; }
    room.step(d);
  };
  const capture: [string, EventListener, AddEventListenerOptions][] = [
    ['wheel', onWheel as EventListener, { passive: false }],
    ['touchstart', onTouchStart as EventListener, { passive: true }],
    ['touchmove', onTouchMove as EventListener, { passive: false }],
    ['touchend', onTouchEnd, { passive: true }],
    ['touchcancel', onTouchEnd, { passive: true }],
    ['keydown', onKey as EventListener, {}],
  ];
  const evaluate = () => {
    if (disposed) return;
    if (!overscroll && room.canWrap()) { html.style.setProperty('overscroll-behavior-y', 'none'); overscroll = true; }
    const want = room.inRange() || scrollY <= 0;
    if (want === capturing) return;
    capturing = want;
    if (want) for (const [n, f, opt] of capture) addEventListener(n, f, opt);
    else { for (const [n, f, opt] of capture) removeEventListener(n, f, opt); touch = null; }
  };

  // ---- always on: the scroll itself, and the inputs that arm the glue or cancel a settle
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
  const onWheelAny = (e: WheelEvent) => { if (!e.ctrlKey) input(); };
  const onTouchAny = (e: TouchEvent) => {
    touches = e.touches.length;
    if (e.type === 'touchend' || e.type === 'touchcancel') { if (touches === 0) released(); return; }
    if (touches === 1) input();
  };
  const onKeyAny = (e: KeyboardEvent) => {
    cancelSettle();
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
    ['keydown', onKeyAny as EventListener, { passive: true }],
    ['pointerdown', onPointer as EventListener, { passive: true }],
    ['pointerup', onPointer as EventListener, { passive: true }],
    ['pointercancel', onPointer as EventListener, { passive: true }],
    ['blur', onBlur, {}],
  ];
  for (const [n, f, opt] of always) addEventListener(n, f, opt);
  evaluate();

  return {
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
      if (overscroll) html.style.removeProperty('overscroll-behavior-y');
    },
    state: () => ({ armed, settling, capturing }),
  };
}
