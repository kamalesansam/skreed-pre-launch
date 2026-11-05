// The DOM ride (prototype v11.4 template.html, the end of step(); frame step F16): the countdown is clipped above the wipe
// edge (and slides up by 0.4 tp^3 screens only while section 2 is not yet built), the corner logotype turns Urban Slate
// past half the wipe, the two side cues hide during the wipe. Section 4's exit is a jump to scroll 0 under the seam's
// cloud (section-4-flux.md 9 X-15), so there is no ride for a fourth wipe: at scroll 0 this is the hero's own ride.
// resetRiders (scroll/reset.ts) undoes it on the hard poster path. It also places the cue's words in the pin
// (docs/specs/scroll-cue.md 4): on once the page has rested, by cue-words.ts's rule, in the logotype's tone, on the
// page's edge (data-at="pin", shell.css), set while they are still hidden and dropped at the top only once they have
// finished hiding, so a change of place never shows (D10).
import { clipFor } from './scrollMap.ts';
import { cueWordsOn } from './cue-words.ts';
import { CUE } from '../../../config/cue.ts';
import type { RideEls } from './reset.ts';
export type { RideEls } from './reset.ts';

// the rest clock (any change of the scroll position, the visitor's or the page's own, restarts it, and it runs from the
// lock's end) and two layout reads, each made at most once per rest and only when everything else holds, never per frame
// (CHECKLIST C3): whether the quiz's section is still below the screen, and at the top whether the document goes on below
// it (the countdown script's test); neither is read while the loader, the intro or a soft poster lock the page, since a
// read kept from under the lock would be wrong
const H = document.documentElement;
let lastY = Number.NaN, restSince = 0, offSince = 0, quizBelow: boolean | null = null, pageBelow: boolean | null = null;
/** the page lock (shell.css: overflow hidden, nothing below), or the soft poster's page under a still loading island
 *  (boot.ts onSoftPoster), over which the words are never pinned */
const isLocked = () => H.classList.contains('loading') || H.classList.contains('intro') || H.classList.contains('poster');
const findBelow = () => (quizBelow ??= (document.getElementById('find')?.getBoundingClientRect().top ?? Infinity) >= innerHeight - 2);
const docBelow = () => (pageBelow ??= document.documentElement.scrollHeight > innerHeight + CUE.top);
function cueWords(m: HTMLElement, cue: HTMLElement | null, tp: number, s2ready: boolean, light: boolean): void {
  const y = scrollY, now = performance.now(), locked = isLocked();
  if (y !== lastY || locked) { lastY = y; restSince = now; quizBelow = null; pageBelow = null; }
  const on = cueWordsOn({ y, vh: innerHeight, restMs: now - restSince, tp, s2ready, cueOff: !!cue?.classList.contains('is-off'), locked, quizBelow: findBelow, pageBelow: docBelow });
  if (on !== m.classList.contains('is-on')) { m.classList.toggle('is-on', on); if (!on) offSince = now; }   // written only on a change
  // the place: the pin is set in the frame the words come on, while they are still hidden; at the top it is dropped only once
  // the fade out has ended (CUE.fadeMs, shell.css's transition), so the words leave the corner hidden and come back over the
  // column, never moving while they show (D10); the rest outlasts the fade, so they cannot come back at the top before that
  if (on && y > CUE.top && m.dataset.at !== 'pin') m.dataset.at = 'pin';
  else if (!on && y <= CUE.top && m.dataset.at && now - offSince >= CUE.fadeMs) delete m.dataset.at;
  // the logotype's tone: Urban Slate over the fog (the words show before the second wipe, so never over the quiz's night)
  if (light !== (m.dataset.tone === 'light')) { if (light) m.dataset.tone = 'light'; else delete m.dataset.tone; }
}

/** `light`: the frame's ground wants the dark tone (Urban Slate) on the logotype and the cue's words: past half the first
 *  wipe, over section 2's fog, by default; the loop also says no over the quiz's night ground (past half the second wipe,
 *  since 2026-11-06) and yes again over section 5's cream */
export function rideCopy(els: RideEls, tp: number, asp: number, s2ready = false, light = tp > 0.5): void {
  window.__skreedLogo?.setTone(light);
  const c = els.heroCopy;
  if (c) {
    // v11: once section 2 is up the hero layer holds still in the first wipe (Sam: nothing flies up)
    c.style.transform = `translate3d(0,${(s2ready ? 0 : -0.4 * tp ** 3 * 100).toFixed(3)}vh,0)`;
    c.style.clipPath = tp > 0 ? clipFor(tp, true, asp) : 'none';
    c.style.visibility = tp >= 1 ? 'hidden' : 'visible';
  }
  if (tp > 0) els.cue?.classList.add('is-off');   // the plain script hides it on scroll; this covers the wipe
  if (els.more) cueWords(els.more, els.cue, tp, s2ready, light);
}
