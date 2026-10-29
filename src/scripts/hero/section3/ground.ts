// Section 3's ground (docs/specs/quiz.md 5, "The hero island"): section 2's background on its own, no gems, no
// labels, no plates, the same fog, dots and sprites, the same clock and scroll, so the second wipe cuts the gems off
// the fog and the fog stays under the quiz. It replaces the v9.9 swatch wall (world/wall.ts) as the far side of the
// last wipe and is the whole frame once the track has ended, for as long as section 3 is in view. One thing differs
// from section 2's own background pass: it writes sRGB directly (section 2 encodes in its composite; the hero's
// composite reads tB as sRGB, as it read the wall's OutputPass). The fog's shade hues (E-fog-hue, section2/hues.ts) come
// from the clock section 2 shares, so the hued fog is the same on both sides of the cut, and they stay on under the
// quiz's result (Sam, 2026-10-29: "keep it on"; the day's first build faded them to grey there over 0.6 s).
import { Color, NoToneMapping, ShaderMaterial, WebGLRenderTarget, type Texture, type WebGLRenderer } from 'three';
import { createBackground, fsCam, fsScene } from '../section2/background.ts';
import { hueFrame, writeHues } from '../section2/hues.ts';
import { S2T } from '../../../config/hero.ts';

export interface GroundScene {
  /** the ground's frame: sRGB colour, alpha 1 (the composite's tB after section 2) */
  readonly out: Texture | null;
  /** device pixels, as section 2's targets */
  resize(w: number, h: number): void;
  /** S: the scroll follower in screens; t: the scene clock */
  update(S: number, t: number): void;
  render(): void;
  dispose(): void;
}

const ENCODE_FROM = 'gl_FragColor = vec4(dec(srgb), 0.0);';
const ENCODE_TO = 'gl_FragColor = vec4(srgb, 1.0);';

export function createFogGround(renderer: WebGLRenderer, reduced: boolean): GroundScene {
  const bg = createBackground();
  const src = bg.material.fragmentShader;
  if (!src.includes(ENCODE_FROM)) throw new Error('section3/ground: the background shader no longer ends with the expected encode line');
  const material = new ShaderMaterial({ uniforms: bg.uniforms, vertexShader: bg.material.vertexShader, fragmentShader: src.replace(ENCODE_FROM, ENCODE_TO), depthTest: false, depthWrite: false });
  const scene = fsScene(material);
  let rt: WebGLRenderTarget | null = null, frameNo = 0, W = 1, H = 1;
  const _cc = new Color();
  const U = bg.uniforms;
  U.uPre.value = 0; U.uLabN.value = 0;

  const api: GroundScene = {
    get out() { return rt ? rt.texture : null; },
    resize(w, h) {
      W = w; H = h;
      rt?.dispose();
      rt = new WebGLRenderTarget(w, h, { depthBuffer: false });
    },
    update(S, t) {
      U.uScroll.value = 2.15 + 0.3 * (S - S2T.W1END);   // section 2's formula: the fog scrolls on through the wipe
      U.uTime.value = reduced ? 7 : t;
      writeHues(U, hueFrame(t, reduced), 1);   // at full strength under the quiz's result too (Sam, 2026-10-29: "keep it on")
    },
    render() {
      if (!rt) return;
      U.uRes.value.set(W, H); U.uFrame.value = (frameNo++) % 4096; bg.layout(U.uTime.value, W, H);
      const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(), tm = renderer.toneMapping;
      renderer.toneMapping = NoToneMapping; renderer.setClearColor(0x000000, 1);
      renderer.setRenderTarget(rt); renderer.render(scene, fsCam);
      renderer.setRenderTarget(null); renderer.setClearColor(pc, pa); renderer.toneMapping = tm;
    },
    dispose() { rt?.dispose(); rt = null; material.dispose(); bg.dispose(); },
  };
  return api;
}
