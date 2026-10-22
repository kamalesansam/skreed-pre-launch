// The page scroll's decisions (docs/specs/section-4-flux.md 2 "The elastic glue" and "The top of the page", 4 "Motion
// plan" rows for the glue and the wrap, 5 "Glue spans"; the reference's burst filter, keys and touch rule in
// docs/specs/evidence/section-4-flux-reference.md 5): pure functions with no DOM, so tests/unit/page-scroll.test.ts can
// drive every rule with numbers. scroll.ts wires them to the window. Nothing here reads the director or config/room.ts.

/** A glue span in document pixels: the scroll positions across which one seam is in view, start under end. */
export interface Span { readonly start: number; readonly end: number }

/** The glue's numbers: the dead band at a span's ends, the stillness before a settle, how recent an input must be for a run to arm it, the settle's length. */
export const GLUE = { dead: 2, stillMs: 150, inputMs: 300, settleMs: 500 } as const;
/** The wheel burst filter (reference 5): a burst ends after this silence; while consumed, deltas under this share of the peak are swallowed. */
export const BURST = { silenceMs: 200, keep: 0.5 } as const;
/** A one-finger touch: the move that is one step in the carousel, and the move down from scroll 0 that is the wrap. */
export const TOUCH = { stepPx: 12, wrapPx: 16 } as const;
/** --ease-standard in src/styles/tokens.css, the settle's curve. */
export const EASE_STANDARD = [0.2, 0, 0, 1] as const;

// ---- the glue

export interface GlueOptions {
  /** the dead band at a span's ends in px (GLUE.dead) */
  readonly dead?: number;
  /** the focused element's document rect, if one is focused: a settle that would take it out of the viewport is refused */
  readonly keep?: { readonly top: number; readonly bottom: number } | null;
}

/** the raw decision: the one span the position is inside (beyond the dead band), settled to the end the midpoint picks */
function decide(y: number, spans: readonly Span[], dead: number): number | null {
  let hit: Span | null = null;
  for (const s of spans) {
    if (!(s.end - s.start > 2 * dead)) continue;             // degenerate or inverted (innerHeight over 100svh can invert the quiz seam): no seam to settle
    if (!(y > s.start + dead && y < s.end - dead)) continue; // outside, or at rest at an end
    if (hit) return null;                                     // two spans in view: none
    hit = s;
  }
  if (!hit) return null;
  return y <= (hit.start + hit.end) / 2 ? hit.start : hit.end;
}

const fully = (r: { readonly top: number; readonly bottom: number }, top: number, vh: number): boolean => r.top >= top && r.bottom <= top + vh;
const touches = (r: { readonly top: number; readonly bottom: number }, top: number, vh: number): boolean => r.bottom > top && r.top < top + vh;

/**
 * Where a visitor's run that stopped at scrollY settles: null, or the start or end of the one span it is inside (the
 * midpoint decides, ties to the start), with a dead band at both ends, none when two spans are in view, and never a
 * target that is not itself a rest (so a settle runs once or not at all, whatever units the spans were built in).
 * innerHeight and svhPx are the page's two viewport units; the smaller is the height a focused element must stay in.
 */
export function glueDecision(scrollY: number, spans: readonly Span[], innerHeight: number, svhPx: number, opts: GlueOptions = {}): number | null {
  const dead = opts.dead ?? GLUE.dead;
  const t = decide(scrollY, spans, dead);
  if (t === null) return null;
  if (decide(t, spans, dead) !== null) return null;   // the target would settle again: not at all
  const keep = opts.keep;
  if (keep) {
    const vh = Math.min(innerHeight, svhPx);
    if (fully(keep, scrollY, vh) ? !fully(keep, t, vh) : touches(keep, scrollY, vh) && !touches(keep, t, vh)) return null;
  }
  return t;
}

// ---- the wheel burst filter and the wheel's decision

export interface BurstState { last: number; peak: number; consumed: boolean }
export const createBurst = (): BurstState => ({ last: -Infinity, peak: 0, consumed: false });

/**
 * One wheel event. fresh: this event begins a burst (after BURST.silenceMs of silence, or a delta that ends a consumed
 * burst); pass: the event may act (false for a consumed burst's tail under half its peak). A step or a wrap that runs
 * marks the burst consumed with burstConsume.
 */
export function burstFeed(b: BurstState, delta: number, now: number): { fresh: boolean; pass: boolean } {
  const a = Math.abs(delta);
  const fresh = now - b.last > BURST.silenceMs;
  b.last = now;
  if (fresh) { b.peak = 0; b.consumed = false; }
  if (b.consumed) {
    if (a < BURST.keep * b.peak) return { fresh: false, pass: false };
    b.consumed = false; b.peak = a;                           // a larger delta ends the burst and becomes the new peak
    return { fresh: true, pass: true };
  }
  b.peak = Math.max(b.peak, a);
  return { fresh, pass: true };
}

export const burstConsume = (b: BurstState): void => { b.consumed = true; };

export interface WheelContext {
  /** scrollY is 0 and the carousel is not in range */
  readonly atTop: boolean;
  /** the intro is over and no seam runs (the adapter's canWrap) */
  readonly canWrap: boolean;
  /** a seam or the way back is running (the adapter's lock): swallowed without stepping */
  readonly locked: boolean;
  /** scene 5 is front: a forward gesture is the page's */
  readonly edgeForward: boolean;
  /** scene 1 is front: a backward gesture is the way back */
  readonly edgeBack: boolean;
  /** ctrlKey (a trackpad pinch): never captured */
  readonly ctrl?: boolean;
}

export type WheelVerdict = { kind: 'page' } | { kind: 'swallow' } | { kind: 'wrap' } | { kind: 'back' } | { kind: 'step'; dir: 1 | -1 };
const PAGE: WheelVerdict = { kind: 'page' }, SWALLOW: WheelVerdict = { kind: 'swallow' };

/** What one wheel event does: the page's own scroll, swallowed, the wrap (a new burst at scroll 0 moving up), the way back, or one step. */
export function wheelDecision(b: BurstState, deltaY: number, now: number, ctx: WheelContext): WheelVerdict {
  if (ctx.ctrl) return PAGE;
  const dir: 1 | -1 | 0 = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;
  if (dir === 0) return PAGE;                                 // a horizontal wheel: the page's, and no part of a burst
  const r = burstFeed(b, deltaY, now);
  if (ctx.atTop) {
    if (!ctx.canWrap) return PAGE;                            // the intro: its own lock
    if (ctx.locked) return SWALLOW;                           // the 400 ms after a seam
    return dir === -1 && r.fresh ? { kind: 'wrap' } : PAGE;   // only a burst that begins here, moving up, wraps
  }
  if (ctx.locked || !r.pass) return SWALLOW;
  if (dir === 1 && ctx.edgeForward) return PAGE;              // scene 5: the page scrolls on into the hold
  if (dir === -1 && ctx.edgeBack) return { kind: 'back' };
  return { kind: 'step', dir };
}

// ---- the touch

export type TouchVerdict =
  | { kind: 'none' }            // no vertical movement yet: nothing decided
  | { kind: 'page' }            // the page's own touch: forward at scene 5, or up from the top
  | { kind: 'hold' }            // ours, under the threshold: preventDefault and wait
  | { kind: 'step'; dir: 1 | -1 }
  | { kind: 'wrap' };           // ours, begun at scroll 0 and moved down TOUCH.wrapPx: the reverse seam

/**
 * One touchmove, decided on the first move with a vertical component: whether the touch is the page's or ours, and once
 * ours, when it steps (TOUCH.stepPx, the direction by the sign) or wraps (TOUCH.wrapPx down from scroll 0). The finger
 * moving up the glass scrolls forward (dir 1).
 */
export function touchDecision(startY: number, startScroll: number, y: number, atEdgeForward: boolean): TouchVerdict {
  const dy = y - startY;
  if (!(dy !== 0)) return { kind: 'none' };
  if (startScroll <= 0) {
    if (dy < 0) return { kind: 'page' };
    return dy >= TOUCH.wrapPx ? { kind: 'wrap' } : { kind: 'hold' };
  }
  const dir: 1 | -1 = dy < 0 ? 1 : -1;
  if (dir === 1 && atEdgeForward) return { kind: 'page' };
  return Math.abs(dy) >= TOUCH.stepPx ? { kind: 'step', dir } : { kind: 'hold' };
}

// ---- the keys

export interface KeyLike {
  readonly key: string;
  readonly shiftKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly altKey?: boolean;
  readonly defaultPrevented?: boolean;
  readonly repeat?: boolean;
  readonly target?: unknown;
}

/** the keys that scroll a page natively, whose runs arm the glue (not Tab: its scroll is focus, never a run) */
const SCROLL_KEYS = new Set([' ', 'Spacebar', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);
export const isScrollKey = (key: string): boolean => SCROLL_KEYS.has(key);

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);
const isSpace = (key: string): boolean => key === ' ' || key === 'Spacebar';

/**
 * The carousel's key table (reference 5): ArrowDown, PageDown and Space step forward, ArrowUp, PageUp and Shift+Space
 * back; null with Ctrl, Meta or Alt, any other shifted key, an event already defaultPrevented, or an input, textarea,
 * select, button or contentEditable target, which are the browser's. Repeats are not this function's concern.
 */
export function keyDir(e: KeyLike): 1 | -1 | null {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return null;
  const t = e.target as { tagName?: unknown; isContentEditable?: unknown } | null | undefined;
  if (t && typeof t === 'object' && (t.isContentEditable === true || TYPING_TAGS.has(String(t.tagName ?? '').toUpperCase()))) return null;
  if (e.shiftKey) return isSpace(e.key) ? -1 : null;
  if (isSpace(e.key) || e.key === 'ArrowDown' || e.key === 'PageDown') return 1;
  if (e.key === 'ArrowUp' || e.key === 'PageUp') return -1;
  return null;
}

/** keyDir, and null for a held key's repeat: one step per keydown. */
export const keyStep = (e: KeyLike): 1 | -1 | null => (e.repeat ? null : keyDir(e));

// ---- the settle's curve

/** A CSS cubic-bezier(x1, y1, x2, y2) as a function of progress 0 to 1 (Newton's method, then bisection). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const A = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1, B = (a1: number, a2: number) => 3 * a2 - 6 * a1, C = (a1: number) => 3 * a1;
  const at = (t: number, a1: number, a2: number) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
  const slope = (t: number, a1: number, a2: number) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
  return (x) => {
    if (!(x > 0)) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(t, x1, x2);
      if (s < 1e-6) break;
      const d = at(t, x1, x2) - x;
      if (Math.abs(d) < 1e-7) return at(t, y1, y2);
      t -= d / s;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 40 && hi - lo > 1e-7; i++) { if (at(t, x1, x2) > x) hi = t; else lo = t; t = (lo + hi) / 2; }
    return at(t, y1, y2);
  };
}

export const easeStandard: (x: number) => number = cubicBezier(...EASE_STANDARD);
