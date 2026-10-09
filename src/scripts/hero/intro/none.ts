// v9.9 behaviour: no intro. The loader's cut starts the 2 s live ramp (frame step F4), and frame1 and frame2 follow the
// default texture rule (F15).
import type { IntroDirector } from './types.ts';

export const NO_INTRO: IntroDirector = {
  milestones: [],
  slots: {},
  install() {},
  start() {},
  update() { return null; },
  skip() {},
};
