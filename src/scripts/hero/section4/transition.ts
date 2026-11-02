// Section 4's transition (docs/specs/section-4-no-hall.md 3): the fog's 'fade' hand-off (Tune `handoff` 2), a straight
// mix of section 3's fog ground and the carousel's frame by the third wipe's progress, both display values, in one
// full-screen pass from uv into its own target. Until 2026-11-02 the same pass also drew the bubble that opened from
// the hall onto scene 1 and reduced motion's dissolve; both left with the hall (the archive branch keeps them).
import { ShaderMaterial, WebGLRenderTarget, type Texture, type WebGLRenderer } from 'three';
import { fsCam, fsScene } from '../section2/background.ts';
import { clamp01 } from '../util/math.ts';

/** the full-screen triangle's uv, from the clip-space position */
const FS_UV_VERT = /* glsl */`varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */`
  uniform sampler2D tFrom, tTo; uniform float uP;
  varying vec2 vUv;
  void main() { gl_FragColor = vec4(mix(texture2D(tFrom, vUv).rgb, texture2D(tTo, vUv).rgb, uP), 1.0); }`;

export interface TransitionPass {
  readonly out: Texture | null;
  /** device px */
  resize(w: number, h: number): void;
  /** a straight mix of the two frames by p (the fog's 'fade' hand-off) */
  plain(from: Texture, to: Texture, p: number): void;
  dispose(): void;
}

export function createTransition(renderer: WebGLRenderer): TransitionPass {
  const U = { tFrom: { value: null as Texture | null }, tTo: { value: null as Texture | null }, uP: { value: 0 } };
  const mat = new ShaderMaterial({ uniforms: U, vertexShader: FS_UV_VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false });
  const scene = fsScene(mat);
  let rt: WebGLRenderTarget | null = null;
  return {
    get out() { return rt ? rt.texture : null; },
    resize(w, h) { rt?.dispose(); rt = new WebGLRenderTarget(Math.max(1, w), Math.max(1, h), { depthBuffer: false }); },
    plain(from, to, p) {
      if (!rt) return;
      U.tFrom.value = from; U.tTo.value = to; U.uP.value = clamp01(p);
      renderer.setRenderTarget(rt); renderer.render(scene, fsCam); renderer.setRenderTarget(null);
    },
    dispose() { rt?.dispose(); rt = null; mat.dispose(); },
  };
}
