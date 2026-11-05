// Section 3's ground (docs/specs/quiz.md 5, amended 2026-11-06): one flat colour, QUIZ_GROUND (the page's --night), as
// one 1 x 1 texture of its sRGB bytes with no colour space, the way section 5's ground is made (section5/ground.ts), so
// the composite copies the colour as it is: the second wipe cuts the gems and their fog away to it, it is the whole
// frame under the quiz, and the third wipe cuts from it to scene 1 (loop.ts). Until 2026-11-06 this was section 2's fog
// on its own with its hue patches, drawn by the background shader every frame (E-S3-bg, "yes keeep the fog backround",
// withdrawn on the site review of 2026-11-05: "Remove the light-to-dark gradient or shifting background effect so the text
// remains clearly readable at all times"). The fog and its hues stay in section 2 (section2/background.ts, hues.ts).
import { DataTexture, RGBAFormat, UnsignedByteType, type Texture } from 'three';
import { groundBytes } from '../section5/ground.ts';
import { QUIZ_GROUND } from '../../../config/quiz-ground.ts';

export interface GroundScene {
  /** the ground's frame: the one texel, sRGB bytes, alpha 1 (the composite's tB after section 2) */
  readonly out: Texture | null;
  dispose(): void;
}

export function createQuizGround(): GroundScene {
  const tex = new DataTexture(groundBytes(QUIZ_GROUND), 1, 1, RGBAFormat, UnsignedByteType);
  tex.needsUpdate = true;
  return {
    get out() { return tex; },
    dispose() { tex.dispose(); },
  };
}
