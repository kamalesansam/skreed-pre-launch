// The rule for the cue's words in the pin (docs/specs/scroll-cue.md 4, E-cue-text): pure, so the unit test can walk the
// scroll map. The words stand with the chevrons at the top (shell.css); past CUE.top they come back alone once the page has
// rested CUE.stillMs, wherever the pin goes on below: the pull-back, the cascade and the gems at rest. At the top they come
// back alone too, after the same rest, when the chevrons stay hidden there (a jump to the top that the camera's lagging
// followers reach late, while the ride keeps the chevrons off for the wipe) and the page still goes on below. Never while
// the loader, the intro or a soft poster lock the page: the layout read behind "goes on below" is kept until the scroll
// position next changes, and a read taken under the lock, where the document measures as one screen (the countdown
// script's own finding), would say nothing is below for as long as the page stays at the top (iteration 4, 2026-11-02).
import { S2T } from '../../../config/hero.ts';
import { CUE } from '../../../config/cue.ts';

/** a wipe at rest reads 0 or 1 within this (the camera's followers close in on the scroll), and the glue's rest at a span's
 *  end counts as that end within this many screens */
export const REST_EPS = 0.01;

export interface CueWordsIn {
  /** scrollY and innerHeight, px */
  y: number; vh: number;
  /** how long the scroll position has not changed, ms */
  restMs: number;
  /** the first wipe's progress from the lagged scroll (mapScroll) */
  tp: number;
  /** section 2 is built (until it is, the scene holds at the pull-back's end and scrolling shows nothing new; after a
   *  failure the hold is released but the wipe opens on black, where neither tone of the words reads, so they stay off
   *  past the pull-back there too) */
  s2ready: boolean;
  /** the chevrons are off (#cue.is-off) */
  cueOff: boolean;
  /** the page is locked (html.loading, html.intro: the loader and the intro hold it with overflow hidden, so nothing is
   *  below until they end; html.poster: a soft poster's page under a still loading island, never pinned over); the words
   *  are hidden by CSS meanwhile, no layout is read, and the rest clock runs from the lock's end */
  locked: boolean;
  /** the quiz's section still wholly below the screen: a layout read, so asked last and only when all else holds */
  quizBelow: () => boolean;
  /** the document goes on below the screen (the countdown script's own test): a layout read, asked only at the top */
  pageBelow: () => boolean;
}

export function cueWordsOn(i: CueWordsIn): boolean {
  if (i.locked || i.vh <= 0 || i.restMs < CUE.stillMs) return false;   // under the lock nothing is read, so no read taken there is kept
  if (i.y <= CUE.top) return i.cueOff && i.pageBelow();     // at the top the chevrons speak, unless they stay hidden there
  const pr = i.y / i.vh;
  if (i.tp > REST_EPS && i.tp < 1 - REST_EPS) return false;   // the first wipe is crossing: the ground under the words changes
  if (pr > S2T.W2 + REST_EPS) return false;                    // the second wipe on: the quiz takes over
  if (!i.s2ready && pr > S2T.PULL + REST_EPS) return false;    // held at the pull-back's end while section 2 builds
  return i.quizBelow();
}
