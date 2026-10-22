// The DOM ride (prototype v11.4 template.html, the end of step(); frame step F16): the countdown is clipped above the wipe
// edge (and slides up by 0.4 tp^3 screens only while section 2 is not yet built), the corner logotype turns Urban Slate
// past half the wipe, the two side cues hide during the wipe. Section 4's exit is a jump to scroll 0 under the seam's
// cloud (section-4-flux.md 9 X-15), so there is no ride for a fourth wipe: at scroll 0 this is the hero's own ride.
// resetRiders (scroll/reset.ts) undoes it on the hard poster path.
import { clipFor } from './scrollMap.ts';
import type { RideEls } from './reset.ts';
export type { RideEls } from './reset.ts';

export function rideCopy(els: RideEls, tp: number, asp: number, s2ready = false): void {
  window.__skreedLogo?.setTone(tp > 0.5);
  const c = els.heroCopy;
  if (c) {
    // v11: once section 2 is up the hero layer holds still in the first wipe (Sam: nothing flies up)
    c.style.transform = `translate3d(0,${(s2ready ? 0 : -0.4 * tp ** 3 * 100).toFixed(3)}vh,0)`;
    c.style.clipPath = tp > 0 ? clipFor(tp, true, asp) : 'none';
    c.style.visibility = tp >= 1 ? 'hidden' : 'visible';
  }
  if (tp > 0) els.cue?.classList.add('is-off');   // the plain script hides it on scroll; this covers the wipe
}
