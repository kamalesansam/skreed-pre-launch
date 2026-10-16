// Section 4's transition (docs/specs/section-4.md 2 "The transition" and 4): from the hall's frame through white, then
// ten soft bands in the families' key shades sweeping across the white, then the universe's frame fading in under them.
// One full-screen pass from uv and a progress value (the GL Transitions "fadecolor" and "colorphase" forms, evidence
// file section 5): the two frames are the island's own targets. Under reduced motion the sweep is off and the white is a
// plain fade either side (spec section 4). The bands are the one canvas effect of the section (exception E-S4-sweep).
import { Color, ShaderMaterial, Vector2, WebGLRenderTarget, type Texture, type WebGLRenderer } from 'three';
import { fsCam, fsScene } from '../section2/background.ts';
import { FS_UV_VERT } from './post.ts';
import { SWEEP_BANDS, TRANSITION } from '../../../config/room.ts';

const FRAG = /* glsl */`
  uniform sampler2D tFrom, tTo; uniform float uP, uWhiteIn0, uWhiteIn1, uSweep0, uSweep1, uToIn0, uToIn1, uBandW, uSweepOn; uniform vec2 uRes, uDir; uniform vec3 uBands[10];
  varying vec2 vUv;
  void main() {
    vec3 from = texture2D(tFrom, vUv).rgb, to = texture2D(tTo, vUv).rgb;
    float w = smoothstep(uWhiteIn0, uWhiteIn1, uP), ti = smoothstep(uToIn0, uToIn1, uP);
    vec3 base = mix(mix(from, vec3(1.0), w), to, ti);
    if (uSweepOn > 0.5 && uP > uSweep0 && uP < uSweep1) {
      // the band coordinate along the sweep's direction, 0 at the entering corner and 1 at the far one, aspect-true
      vec2 a = (vUv - 0.5) * uRes / max(uRes.x, uRes.y);
      float span = abs(uDir.x) * uRes.x / max(uRes.x, uRes.y) + abs(uDir.y) * uRes.y / max(uRes.x, uRes.y);
      float d = dot(a, uDir) / span + 0.5;
      float s = (uP - uSweep0) / (uSweep1 - uSweep0);
      // the ribbon travels its own length, the screen and a feather either side, so the first band enters and the last leaves whole
      float feather = 0.04, stack = 10.0 * uBandW, lead = s * (1.0 + stack + 2.0 * feather) - feather;
      for (int k = 0; k < 10; k++) {
        float hi = lead - float(k) * uBandW, lo = hi - uBandW;
        float inBand = smoothstep(lo - feather, lo + feather, d) * (1.0 - smoothstep(hi - feather, hi + feather, d));
        base = mix(base, uBands[k], inBand);
      }
    }
    gl_FragColor = vec4(base, 1.0);
  }`;

export interface TransitionPass {
  readonly out: Texture | null;
  resize(w: number, h: number): void;
  /**
   * p: 0 to 1 over the transition; bandW in screens; angle in degrees from horizontal (bottom left to top right at 45);
   * sweep: the window of p the bands cross in; reduced: a fade through white, no sweep; plain: a straight mix of the two
   * frames, no white and no sweep (the 'fade' hand-off from the fog)
   */
  run(from: Texture, to: Texture, p: number, bandW: number, angle: number, sweep: readonly [number, number], reduced: boolean, plain?: boolean): void;
  dispose(): void;
}

export function createTransition(renderer: WebGLRenderer): TransitionPass {
  // the bands written as display values: the pass's target is read as sRGB (three's Color holds a hex as linear)
  const bands = SWEEP_BANDS.map((b) => new Color(b.hex).convertLinearToSRGB());
  const U = {
    tFrom: { value: null as Texture | null }, tTo: { value: null as Texture | null }, uP: { value: 0 },
    uWhiteIn0: { value: TRANSITION.whiteIn[0] as number }, uWhiteIn1: { value: TRANSITION.whiteIn[1] as number }, uSweep0: { value: TRANSITION.sweep[0] as number }, uSweep1: { value: TRANSITION.sweep[1] as number }, uToIn0: { value: TRANSITION.toIn[0] as number }, uToIn1: { value: TRANSITION.toIn[1] as number },
    uBandW: { value: 0.12 }, uSweepOn: { value: 1 }, uRes: { value: new Vector2(1, 1) }, uDir: { value: new Vector2(Math.SQRT1_2, Math.SQRT1_2) }, uBands: { value: bands },
  };
  const mat = new ShaderMaterial({ uniforms: U, vertexShader: FS_UV_VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false });
  const scene = fsScene(mat);
  let rt: WebGLRenderTarget | null = null;
  return {
    get out() { return rt ? rt.texture : null; },
    resize(w, h) { rt?.dispose(); rt = new WebGLRenderTarget(Math.max(1, w), Math.max(1, h), { depthBuffer: false }); U.uRes.value.set(Math.max(1, w), Math.max(1, h)); },
    run(from, to, p, bandW, angle, sweep, reduced, plain = false) {
      if (!rt) return;
      U.tFrom.value = from; U.tTo.value = to; U.uP.value = p; U.uBandW.value = bandW; U.uSweepOn.value = reduced || plain ? 0 : 1;
      const a = (angle * Math.PI) / 180; U.uDir.value.set(Math.cos(a), Math.sin(a));
      U.uSweep0.value = sweep[0]; U.uSweep1.value = Math.max(sweep[0] + 0.01, sweep[1]);
      if (plain) { U.uWhiteIn0.value = 2; U.uWhiteIn1.value = 3; U.uToIn0.value = 0; U.uToIn1.value = 1; }
      else if (reduced) { U.uWhiteIn0.value = 0; U.uWhiteIn1.value = 0.45; U.uToIn0.value = 0.55; U.uToIn1.value = 1; }
      else { U.uWhiteIn0.value = TRANSITION.whiteIn[0]; U.uWhiteIn1.value = TRANSITION.whiteIn[1]; U.uToIn0.value = TRANSITION.toIn[0]; U.uToIn1.value = TRANSITION.toIn[1]; }
      renderer.setRenderTarget(rt); renderer.render(scene, fsCam); renderer.setRenderTarget(null);
    },
    dispose() { rt?.dispose(); rt = null; mat.dispose(); },
  };
}
