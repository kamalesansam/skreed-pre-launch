// The scroll map in screens (prototype v11.4 template.html, the step() lines after the followers; frame step F6): native
// scrollY / innerHeight through igloo's two followers (0.075, then 0.15), 0 to PULL (5) the pull-back, PULL to PULL + 1
// the wipe into section 2, W2 to W2 + 1 the wipe to the Wall. Pure functions, unit tested (tests/unit/hero-math.test.ts).
import { S2T, SCROLL_MAP } from '../../../config/hero.ts';
import { clamp01, easeInOutCubic, lerpFPS, smoothstep } from '../util/math.ts';

export const PULL = SCROLL_MAP[0].screens, WIPE = SCROLL_MAP[1].screens;

export interface ScrollFollower { a: number; b: number; update(pr: number, ratio: number): void; snap(v: number): void }

export function createScrollFollower(): ScrollFollower {
  return {
    a: 0, b: 0,
    update(pr, ratio) {
      if (!Number.isFinite(this.a) || !Number.isFinite(this.b)) this.a = this.b = 0;
      this.a = lerpFPS(this.a, pr, 0.075, ratio); this.b = lerpFPS(this.b, this.a, 0.15, ratio);   // igloo's two followers
    },
    /** both followers at once (the keyboard's jump to section 2's rest, and the test hook __skreedSnap) */
    snap(v) { this.a = this.b = v; },
  };
}

/** s: the pull-back (eased), tp: the first wipe, tp2: the wipe to the Wall, heroOn: push only works near the hero pose. */
export function mapScroll(b: number, reduced: boolean): { s: number; tp: number; tp2: number; heroOn: number } {
  const s = reduced ? 0 : easeInOutCubic(clamp01(b / PULL));
  const tp = clamp01((b - PULL) / WIPE), tp2 = clamp01((b - S2T.W2) / WIPE);
  const heroOn = 1 - smoothstep(0, 0.45, s);
  return { s, tp, tp2, heroOn };
}

/** A straight-line approximation of the wipe edge, for the DOM copy only. */
export function clipFor(tp: number, above: boolean, asp: number): string {
  const sl = 0.2 * asp, pp = -0.2 + 1.2 * tp * (1 + sl) + 0.1;
  const yL = 1 - pp, yR = 1 - (pp - sl);     // CSS y (0 top) of the edge at x=0 and x=1
  const L = (yL * 100).toFixed(2), R = (yR * 100).toFixed(2);
  return above ? `polygon(0 0,100% 0,100% ${R}%,0 ${L}%)` : `polygon(0 ${L}%,100% ${R}%,100% 100%,0 100%)`;
}
