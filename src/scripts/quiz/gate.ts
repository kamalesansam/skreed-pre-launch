// The quiz gate (docs/specs/quiz-gate.md 4, 5 and 9; Sam, 2026-10-26: "it shouldnt scroll past the quiz untill someone
// takes the quiz, section 4 should be locked ... the moment they click on skip quiz, it should go to section 4
// automatically, with the transition included"). section#room is rendered hidden and data-locked (Room.astro), so the
// page ends at the quiz; this module opens it, by the result or by a press on Skip quiz (unlock), and on a press rides
// the page down through the third wipe to the hall fully in over 1.2 s on --ease-standard, one instant scrollTo a frame
// in the pattern of the glue's settle (section4/scroll.ts; E-QG-ride), ended by any wheel, touch or key from 350 ms
// after the press, or by a scroll it did not write. On the 3D path the ride waits for the hall first, at most 1.5 s
// (the hero's hook, window.__skreedHall), so the wipe it rides through is drawn; the poster tier rides at once, to the
// section's top. In the quiz's lazy chunk (deck.ts imports it) on every tier, since the poster tier rides too and has
// no island; the hero hears the unlock through a DOM event (hero.ts). Imports only config/quiz.ts and track.ts, and
// touches the DOM only inside its functions, so tests/unit/quiz-gate.test.ts imports it under node; the ease is the
// quiz's own copy of scroll-math.ts's cubicBezier, held equal to easeStandard by that test (importing scroll-math.ts
// would put the glue's maths in a chunk shared by the deck and scroll.ts).
import { QUIZ_COPY as Q, QUIZ_GATE } from '../../config/quiz.ts';
import { track } from './track.ts';

export type UnlockBy = 'result' | 'skip';

/** the ride's length, ms (QUIZ_GATE.rideMs) */
export const RIDE_MS: number = QUIZ_GATE.rideMs;
/** --ease-standard in src/styles/tokens.css, the ride's curve */
export const EASE = [0.2, 0, 0, 1] as const;
/** a wheel, a touch or a key ends the ride only from this long after the press: the second tap of a double tap lands about 0.2 s after the first (deck.ts's GUARD) */
export const RIDE_GUARD_MS = 350;
/** a scroll this far from the ride's last write is someone else's (the scrollbar, find-in-page, a focus): the ride ends where it is (scroll.ts's own test for its settle) */
export const RIDE_DRIFT_PX = 1.5;
/** on the 3D path the ride waits for the hall at most this long (it is loading from the unlock) */
export const HALL_WAIT_MS = 1500;

/** A CSS cubic-bezier(x1, y1, x2, y2) as a function of progress 0 to 1 (Newton's method, then bisection): scroll-math.ts's, copied so the deck chunk shares nothing with the glue. */
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
export const ease: (x: number) => number = cubicBezier(...EASE);

/** the page's position p of the way through the ride (0 at the press's frame, 1 at the landing), from `from` to `to` */
export const rideY = (from: number, to: number, p: number): number => (p >= 1 ? to : p <= 0 ? from : from + (to - from) * ease(p));
/** where the ride lands: section 4's q 1 (its document top plus one 100svh, the hall fully in) on the 3D path, its top on the poster tier; rounded and clamped to the page's scroll range */
export const rideTarget = (o: { top: number; one: number; poster: boolean; max: number }): number => Math.max(0, Math.min(Math.max(0, o.max), Math.round(o.poster ? o.top : o.top + o.one)));

const room = () => document.getElementById('room');
const html = () => document.documentElement;
/** the poster tier (as walk.ts reads it): html without hero3d or with poster, or the section fallen to the stills after a failed asset */
const poster = (r: HTMLElement) => !html().classList.contains('hero3d') || html().classList.contains('poster') || r.dataset.tier === 'poster';
const maxY = () => Math.max(0, (document.scrollingElement ?? html()).scrollHeight - innerHeight);
const frame = () => new Promise<void>((r) => { requestAnimationFrame(() => r()); });
const wait = (ms: number) => new Promise<void>((r) => { setTimeout(r, ms); });
/** the visit's flag, written in try and catch (CHECKLIST B3): where storage throws the unlock holds for the page's life and a reload starts locked */
const flag = () => { try { sessionStorage.setItem(QUIZ_GATE.key, '1'); } catch { /* no storage: the attributes, once removed, stay removed */ } };

/**
 * Opens section 4 (D2): nothing when it is not locked; else hidden and data-locked go, data-open says how, the visit's
 * flag is written, room_unlock is tracked and the hero hears skreed:quiz-unlock (it loads the hall and re-evaluates
 * the page scroll). True when this call opened it.
 */
export function unlock(by: UnlockBy): boolean {
  const r = room();
  if (!r || !r.hasAttribute('data-locked')) return false;
  r.removeAttribute('hidden'); r.removeAttribute('data-locked'); r.dataset.open = by;
  flag();
  track('room_unlock', { by });
  dispatchEvent(new CustomEvent('skreed:quiz-unlock', { detail: { by } }));
  return true;
}

export interface RideOptions {
  /** reduced motion at the press: the ride is one instant scrollTo, a frame after the press */
  reduced: boolean;
  /** the press matched :focus-visible: at the landing focus moves to the hall's pad (the prompt on the poster tier) */
  keyboard: boolean;
  /** the control's words while the hall is awaited ("Loading..."), and back (null) */
  label(text: string | null): void;
  /** one announcement through the quiz's live region (a pointer press): the destination's name */
  announce(text: string): void;
}

let active = false;
/** a ride runs, the hall's wait included (a second press does nothing) */
export const riding = (): boolean => active;

/**
 * The ride (D4): after the hall's wait on the 3D path and one frame for the shown section's layout, the page scrolls
 * from where it is to the target over RIDE_MS on --ease-standard, one instant scrollTo a frame, the target clamped to
 * the page's range again each frame (the track can collapse under a failure); ended at once by a wheel, a touchstart or
 * a keydown that is not a repeat from RIDE_GUARD_MS after the press, or by a scroll more than RIDE_DRIFT_PX from its
 * last write. A ride that lands moves focus (a keyboard press) or announces where it landed (a pointer press); an ended
 * one does neither. data-ride is on #room throughout.
 */
export async function ride(control: HTMLElement, o: RideOptions): Promise<void> {
  const r = room();
  if (!r || active) return;
  active = true;
  r.toggleAttribute('data-ride', true);
  const pressAt = performance.now();
  let ended = false, wrote = NaN;
  const input = (e: Event) => { if (!(e as KeyboardEvent).repeat && performance.now() - pressAt >= RIDE_GUARD_MS) ended = true; };
  const onScroll = () => { if (!Number.isNaN(wrote) && Math.abs(scrollY - wrote) > RIDE_DRIFT_PX) ended = true; };
  const ears: [string, EventListener, AddEventListenerOptions][] = [['wheel', input, { passive: true }], ['touchstart', input, { passive: true }], ['keydown', input, {}], ['scroll', onScroll, { passive: true }]];
  for (const [n, f, opt] of ears) addEventListener(n, f, opt);
  try {
    // the hall: on the 3D path it loads from the unlock, and the ride waits for it, at most HALL_WAIT_MS, so the third
    // wipe it rides through is drawn (Sam: "with the transition included"); Begin's loading pattern on the control meanwhile
    const hall = window.__skreedHall;
    if (!poster(r) && hall && !hall.ready) {
      control.setAttribute('aria-disabled', 'true'); control.setAttribute('aria-busy', 'true'); o.label(Q.loading);
      await Promise.race([hall.load(), wait(HALL_WAIT_MS)]);
      control.removeAttribute('aria-disabled'); control.removeAttribute('aria-busy'); o.label(null);
    }
    await frame();   // the shown section's layout settles (the director's and the hero's observers run in it)
    if (ended) return;
    const isPoster = poster(r), top = r.getBoundingClientRect().top + scrollY;
    const to = rideTarget({ top, one: document.getElementById('rmStage')?.offsetHeight || innerHeight, poster: isPoster, max: maxY() });
    if (o.reduced) scrollTo({ top: to, behavior: 'instant' });
    else {
      const from = scrollY, t0 = performance.now();
      for (;;) {
        const p = Math.min(1, (performance.now() - t0) / RIDE_MS);
        wrote = rideY(from, Math.min(to, maxY()), p);
        scrollTo({ top: wrote, behavior: 'instant' });
        if (p >= 1) break;
        await frame();
        if (ended) return;
      }
    }
    // the arrival: the pad's name is read as it takes focus (the prompt's on the poster tier, where the pad is not drawn); a
    // pointer press leaves focus out of the section and hears the destination's name once
    const dest = document.getElementById(isPoster ? 'rmEnter' : 'rmPad');
    if (o.keyboard) dest?.focus({ preventScroll: true });
    else { control.blur(); o.announce((isPoster ? r : dest)?.getAttribute('aria-label') ?? ''); }
  } finally {
    for (const [n, f, opt] of ears) removeEventListener(n, f, opt);
    r.removeAttribute('data-ride');
    active = false;
  }
}
