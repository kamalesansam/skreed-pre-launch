// v9.9 behaviour: no intro. The loader's cut starts the 2 s live ramp (frame step F4), the logotype's intro burst runs
// 0.25 s after it, and frame1 and frame2 follow the default texture rule (F15).
import { clamp01 } from '../util/math.ts';
import type { IntroDirector } from './types.ts';

export function createNoIntro(reduced: boolean): IntroDirector {
  let introDone = false, tHero0 = 0, texFrames = 0;
  return {
    milestones: [], slots: {}, logoUniforms: {},
    get done() { return true; },
    get paused() { return false; },
    async install() {},
    warm() {},
    arm() {},
    start(t) {
      if (introDone) return; introDone = true; tHero0 = t;
      const w = window;
      if (w.__skreedLogo) w.__skreedLogo.intro(0.25); else (w.__skreedLogoQ ||= []).push(['intro', 0.25]);
    },
    frame(f) {
      return { live: introDone ? (reduced ? 1 : 1 - Math.pow(1 - clamp01((f.t - tHero0) / 2), 3)) : 0, breath: 1, crane: null, hold: false };
    },
    afterRender(_now, ctx, texOk) {
      if (texOk === 2 && texFrames < 2) { texFrames++; const m = texFrames === 1 ? 'frame1' : 'frame2'; ctx.bridge.report(m); if (m === 'frame2') ctx.sky.onFrame2(); }
    },
    resize() { return false; },
    skip() {},
  };
}
