// The DOM ride (prototype v11.4 template.html, the end of step(); frame step F16): the countdown is clipped above the wipe
// edge (and slides up by 0.4 tp^3 screens only while section 2 is not yet built), the corner logotype turns Urban Slate
// past half the wipe, the two side cues hide during the wipe.
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
  if (tp > 0) { els.cue?.classList.add('is-off'); els.cue2?.classList.add('is-off'); }   // the plain script hides them on scroll; this covers the wipe
}

/**
 * The fourth wipe (section 4's loop screen, docs/specs/section-4.md 5): the composite cuts from the section's frame to the
 * hero at rest, so the countdown rides in behind the cut from below (the region the wipe has reached), the logotype
 * keeps the section's tone until half way and is Pearl after, the cues stay off until the jump brings them back.
 */
export function rideLoop(els: RideEls, p: number, asp: number, sectionLight: boolean): void {
  window.__skreedLogo?.setTone(p < 0.5 ? sectionLight : false);
  const c = els.heroCopy;
  if (c) {
    c.style.transform = 'translate3d(0,0,0)';
    c.style.clipPath = clipFor(p, false, asp);
    c.style.visibility = p > 0 ? 'visible' : 'hidden';
  }
  els.cue?.classList.add('is-off'); els.cue2?.classList.add('is-off');
}
