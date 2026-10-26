// The argument screen's way out (docs/specs/family-page.md 22, D2 and D7; exception E-F5): the rules of "Back to main
// page" as pure functions of the scroll and the clock, no DOM, so they are tested without a browser (tests/family/
// back.test.ts). The page module (page.ts) owns the element, the timer and the Web Animations API calls.
import { scrollClasses } from './three/pose.ts';
import { BACK_DELAY_MS, BACK_IN_MS, BACK_OUT_MS } from './timing.ts';

/** The argument screen off: no timer, nothing shown. On: since the time it came on, show once 2.5 s have passed, dueMs the time left (0 once due). */
export type BackState = { readonly since: null; readonly show: false; readonly dueMs: null } | { readonly since: number; readonly show: boolean; readonly dueMs: number };

/**
 * sv is the scroll in screens, t the time in ms (performance.now()), since the time the argument came on or null. The
 * argument is on above 5.6 screens (scrollClasses(sv).argOn). Leaving before 2.5 s drops since; the next arrival starts
 * a new 2.5 s.
 */
export function backTimer(sv: number, t: number, since: number | null): BackState {
  if (!scrollClasses(sv).argOn) return { since: null, show: false, dueMs: null };
  const s = since ?? t;
  const dueMs = Math.max(0, BACK_DELAY_MS - (t - s));
  return { since: s, show: dueMs === 0, dueMs };
}

/** The arrival (400 ms on --ease-standard) and the exit (200 ms on --ease-in) as Web Animations API options; null under reduced motion, where the change is instant. */
export function backFade(dir: 'in' | 'out', reduced: boolean): { duration: number; easing: string } | null {
  if (reduced) return null;
  return dir === 'in' ? { duration: BACK_IN_MS, easing: 'cubic-bezier(0.2, 0, 0, 1)' } : { duration: BACK_OUT_MS, easing: 'cubic-bezier(.55, .085, .68, .53)' };
}
