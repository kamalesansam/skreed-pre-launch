// The page scroll's decisions (docs/specs/section-4-flux.md 2 "The elastic glue", 4 "Motion plan" row for the glue, 5
// "Glue spans"; no wrap from the top since 2026-11-04, docs/specs/scroll-steps.md 2; the reference's burst filter, keys and touch rule in
// docs/specs/evidence/section-4-flux-reference.md 5): pure functions with no DOM, so tests/unit/page-scroll.test.ts can
// drive every rule with numbers. scroll.ts wires them to the window. Nothing here reads the director or config/room.ts.

/** A glue span in document pixels: the scroll positions across which one seam is in view, start under end. */
export interface Span { readonly start: number; readonly end: number }

/** The glue's numbers: the dead band at a span's ends, the stillness before a settle, how recent an input must be for a run to arm it, the settle's length. */
export const GLUE = { dead: 2, stillMs: 150, inputMs: 300, settleMs: 500 } as const;
/**
 * The wheel burst filter (reference 5): a burst ends after this silence; while consumed, deltas under this share of the
 * peak are swallowed. carriedMs: the wheel input that carried the page onto scene 1 is the page's until it falls silent
 * this long (section-4-no-hall.md 2 "The arrival"), so a tail that comes in sparsely (a slow machine coalescing a fling,
 * a free-spinning wheel slowing down) never steps; a gesture after that silence is the visitor's own.
 */
export const BURST = { silenceMs: 200, keep: 0.5, carriedMs: 700 } as const;
/** A one-finger touch: the move that is one step in the carousel. */
export const TOUCH = { stepPx: 12 } as const;
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

/** A wheel burst: when its last event came, its largest delta so far, and whether a step has run in it. */
export interface BurstState { last: number; peak: number; consumed: boolean }
export const createBurst = (): BurstState => ({ last: -Infinity, peak: 0, consumed: false });

/**
 * One wheel event, the reference's filter (Scene.v2 343-368): fed for every wheel event, in range or not, so the clock
 * never goes stale. A burst ends after BURST.silenceMs of silence (the peak and the consumed flag reset); the peak is
 * the burst's largest delta, swallowed events included. fresh: this event begins a burst after silence. pass: the event
 * may act. An unconsumed burst always passes. A consumed burst (a step ran in it, burstConsume) is swallowed without a
 * half-peak test while busy (a step runs, its cooldown runs or the lock holds), and after that its tail under half the
 * peak is swallowed; a delta of at least half the peak ends the consumed burst and becomes the new peak, which passes
 * (one more step) but is not fresh. Mutates b.
 */
export function burstFeed(b: BurstState, delta: number, now: number, busy = false): { fresh: boolean; pass: boolean } {
  const a = Math.abs(delta);
  const fresh = now - b.last > BURST.silenceMs;
  b.last = now;
  if (fresh) { b.peak = 0; b.consumed = false; }
  b.peak = Math.max(b.peak, a);
  if (!b.consumed) return { fresh, pass: true };
  if (busy || a < BURST.keep * b.peak) return { fresh: false, pass: false };
  b.consumed = false; b.peak = a;
  return { fresh: false, pass: true };
}

/** a step ran in this burst, or the burst was swallowed by a running step, its cooldown or the lock */
export const burstConsume = (b: BurstState): void => { b.consumed = true; };
/** the burst begins again with the next event, its peak and consumed flag cleared and its clock kept: a wheel event against the direction of the input that carried the page in is the visitor's own gesture, never that input's tail (scroll.ts; section-4-no-hall.md AC4) */
export const burstReset = (b: BurstState): void => { b.peak = 0; b.consumed = false; };

export interface WheelContext {
  /** a step runs or its 150 ms cooldown (the adapter's busy): swallowed, and the burst consumed */
  readonly busy: boolean;
  /** the last rest (scene 5, Armor): a forward gesture is the page's */
  readonly edgeForward: boolean;
  /** the first rest (scene 1, Tough): a backward gesture is the page's (up into the third wipe and the quiz; section-4-no-hall.md 2) */
  readonly edgeBack: boolean;
  /** ctrlKey (a trackpad pinch): never captured */
  readonly ctrl?: boolean;
}

export type WheelVerdict = { kind: 'page' } | { kind: 'swallow' } | { kind: 'step'; dir: 1 | -1 };
const PAGE: WheelVerdict = { kind: 'page' }, SWALLOW: WheelVerdict = { kind: 'swallow' };

/**
 * What one wheel event in range does: the page's own scroll, swallowed, or one step; at either edge (on at the last
 * rest, back at the first) the page's. The lock and busy are checked before the edges, as the reference's he() does; an
 * event they swallow marks the burst consumed. The caller consumes the burst for a step the adapter accepts.
 */
export function wheelDecision(b: BurstState, deltaY: number, now: number, ctx: WheelContext): WheelVerdict {
  if (ctx.ctrl) return PAGE;
  const dir: 1 | -1 | 0 = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;
  if (dir === 0) return PAGE;                                 // a horizontal wheel: the page's, and no part of a burst
  const r = burstFeed(b, deltaY, now, ctx.busy);
  if (ctx.busy) { burstConsume(b); return SWALLOW; }          // a step or its cooldown: swallowed before the edges
  if (!r.pass) return SWALLOW;                                // a consumed burst's tail
  if (dir === 1 && ctx.edgeForward) return PAGE;              // scene 5: the page scrolls on into the hold
  if (dir === -1 && ctx.edgeBack) return PAGE;               // scene 1: the page scrolls back up into the wipe
  return { kind: 'step', dir };
}

// ---- the touch

export type TouchVerdict =
  | { kind: 'none' }            // no vertical movement yet: nothing decided
  | { kind: 'page' }            // the page's own touch: forward at the last rest, back at the first
  | { kind: 'hold' }            // ours, under the threshold: preventDefault and wait
  | { kind: 'step'; dir: 1 | -1 };

/**
 * One touchmove, decided on the first move with a vertical component: whether the touch is the page's or ours, and once
 * ours, when it steps (TOUCH.stepPx, the direction by the sign). The finger moving up the glass scrolls forward (dir 1).
 * At either edge, the last rest forward or the first back, the touch is the page's.
 */
export function touchDecision(startY: number, y: number, atEdgeForward: boolean, atEdgeBack = false): TouchVerdict {
  const dy = y - startY;
  if (!(dy !== 0)) return { kind: 'none' };
  const dir: 1 | -1 = dy < 0 ? 1 : -1;
  if ((dir === 1 && atEdgeForward) || (dir === -1 && atEdgeBack)) return { kind: 'page' };
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

// ---- the key steps between the page's rests (docs/specs/scroll-steps.md 4; Sam, 2026-11-04: "on the main page, all the
// sections will follow this same rule only for one gesture ... That only gesture is a key")

/**
 * A key step's ride from one rest to the next: its length grows with the distance (msPerScreen a screen), between minMs
 * and maxMs, so the long road from the hero to the gems plays its pull-back, wipe and cascade at a pace a visitor can
 * follow; the cooldown after it swallows the step keys, as a carousel step's does.
 */
export const KEY_RIDE = { msPerScreen: 450, minMs: 700, maxMs: 2400, cooldownMs: 150 } as const;
export const keyRideMs = (px: number, vh: number): number =>
  Math.round(Math.max(KEY_RIDE.minMs, Math.min(KEY_RIDE.maxMs, (Math.abs(px) / Math.max(1, vh)) * KEY_RIDE.msPerScreen)));

/**
 * The rest a step key takes the page to from y: the nearest rest beyond the dead band in the key's direction (a page that
 * stopped between two rests goes to the next one, never back to the one behind it); null when there is none that way
 * (the page's top, or its end: the quiz while the gate holds the sections after it). Rests that are not finite are skipped.
 */
export function nextStop(y: number, stops: readonly number[], dir: 1 | -1, dead: number = GLUE.dead): number | null {
  let best: number | null = null;
  for (const s of stops) {
    if (!Number.isFinite(s)) continue;
    if (dir > 0 ? s > y + dead && (best === null || s < best) : s < y - dead && (best === null || s > best)) best = s;
  }
  return best;
}

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
