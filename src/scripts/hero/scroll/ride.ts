// The DOM ride (prototype lines 1371 to 1379; frame step F16): the countdown slides up by 0.4 tp^3 screens and is clipped
// above the wipe edge, the corner logotype turns Urban Slate past half the wipe, the cue hides during the wipe.
// resetRiders (scroll/reset.ts) undoes it on the hard poster path.
import { clipFor } from './scrollMap.ts';
import type { RideEls } from './reset.ts';
export type { RideEls } from './reset.ts';

export function rideCopy(els: RideEls, tp: number, asp: number): void {
  window.__skreedLogo?.setTone(tp > 0.5);
  const c = els.heroCopy;
  if (c) {
    c.style.transform = `translate3d(0,${(-0.4 * tp ** 3 * 100).toFixed(3)}vh,0)`;
    c.style.clipPath = tp > 0 ? clipFor(tp, true, asp) : 'none';
    c.style.visibility = tp >= 1 ? 'hidden' : 'visible';
  }
  if (tp > 0) els.cue?.classList.add('is-off');   // the plain script hides it on scroll; this covers the wipe
}
