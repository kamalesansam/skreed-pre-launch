// The scroll map in screens (prototype lines 1263 to 1271 and 1283 to 1288; frame step F6): native scrollY / innerHeight
// through igloo's two followers (0.075, then 0.15), 0 to 1.5 the pull-back, 1.5 to 2.5 the wipe. Pure functions, unit
// tested (tests/unit/scroll.test.ts).
import { SCROLL_MAP } from '../../../config/hero.ts';
import { clamp01, easeInOutCubic, lerpFPS, smoothstep } from '../util/math.ts';

export const PULL = SCROLL_MAP[0].screens, WIPE = SCROLL_MAP[1].screens;

export interface ScrollFollower { a: number; b: number; update(pr: number, ratio: number): void }

export function createScrollFollower(): ScrollFollower {
  return {
    a: 0, b: 0,
    update(pr, ratio) {
      if (!Number.isFinite(this.a) || !Number.isFinite(this.b)) this.a = this.b = 0;
      this.a = lerpFPS(this.a, pr, 0.075, ratio); this.b = lerpFPS(this.b, this.a, 0.15, ratio);   // igloo's two followers
    },
  };
}

/** s: the pull-back (eased), tp: the wipe, heroOn: push only works near the hero pose, like igloo. */
export function mapScroll(b: number, reduced: boolean): { s: number; tp: number; heroOn: number } {
  const s = reduced ? 0 : easeInOutCubic(clamp01(b / PULL));
  const tp = clamp01((b - PULL) / WIPE);
  const heroOn = 1 - smoothstep(0, 0.45, s);
  return { s, tp, heroOn };
}

/** A straight-line approximation of the wipe edge, for the DOM copy only. */
export function clipFor(tp: number, above: boolean, asp: number): string {
  const sl = 0.2 * asp, pp = -0.2 + 1.2 * tp * (1 + sl) + 0.1;
  const yL = 1 - pp, yR = 1 - (pp - sl);     // CSS y (0 top) of the edge at x=0 and x=1
  const L = (yL * 100).toFixed(2), R = (yR * 100).toFixed(2);
  return above ? `polygon(0 0,100% 0,100% ${R}%,0 ${L}%)` : `polygon(0 ${L}%,100% ${R}%,100% 100%,0 100%)`;
}
