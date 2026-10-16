// Section 4's output pass (docs/specs/section-4.md 2 "The look on screen"; the evidence file section 4), shared by the
// hall and the universe: the vignette multiplies first so the centre clips to white in the 8-bit target, the colour
// split pulls red in and blue out by the square of the radius, the bleach-bypass overlays the pixel with its own luma,
// the grain a hash of the pixel, static (E-S4-grain; the frame number stays 0), and on laptops a screened bloom. Normalised by the longer side so a portrait phone keeps the laptop's corners.
import { ShaderMaterial, Vector2, WebGLRenderTarget, type Texture, type WebGLRenderer } from 'three';
import { fsCam, fsScene } from '../section2/background.ts';

export const FS_UV_VERT = /* glsl */`varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const POST_FRAG = /* glsl */`
  uniform sampler2D tSrc; uniform vec2 uRes; uniform float uBoost, uCorners, uBleach, uSplit, uNoise, uFrame, uEncode, uBloom;
  varying vec2 vUv;
  vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
  vec3 tap(vec2 uv) { vec3 c = texture2D(tSrc, uv).rgb; return uEncode > 0.5 ? toSrgb(clamp(c, 0.0, 1.0)) : c; }
  float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
  void main() {
    vec2 d = (vUv - 0.5) * uRes / max(uRes.x, uRes.y);       // the corner of a 16:9 frame sits at |d| = 0.574
    float r = length(d);
    float vig = max(0.0, uBoost - (uBoost - uCorners) * (r / 0.574));
    // the split grows with the square of the radius and is uSplit device pixels at this frame's own corner, on any aspect
    float rc = length(0.5 * uRes / max(uRes.x, uRes.y));
    vec2 off = d * r * uSplit / (rc * rc * uRes);
    vec3 c = vec3(texture2D(tSrc, vUv - off).r, texture2D(tSrc, vUv).g, texture2D(tSrc, vUv + off).b);
    if (uEncode > 0.5) c = toSrgb(clamp(c, 0.0, 1.0));       // a linear source (the universe's half-float target) to display values first
    if (uBloom > 0.0) {
      // laptops: a blurred copy screened over the frame, no threshold, radius 0.8 percent of the frame (spec 2; 12 taps on two rings)
      vec2 px = 0.008 * max(uRes.x, uRes.y) / uRes; vec3 b = vec3(0.0);
      for (int i = 0; i < 12; i++) { float a = float(i) * 0.5236 + (i < 6 ? 0.0 : 0.2618); vec2 o = vec2(cos(a), sin(a)) * px * (i < 6 ? 0.45 : 1.0); b += tap(vUv + o); }
      c = 1.0 - (1.0 - c) * (1.0 - clamp(b / 12.0, 0.0, 1.0) * uBloom);
    }
    c = min(c * vig, 1.0);
    float luma = dot(c, vec3(0.2125, 0.7154, 0.0721));
    float m = clamp((luma - 0.45) * 10.0, 0.0, 1.0);
    vec3 bleached = mix(2.0 * c * luma, 1.0 - 2.0 * (1.0 - c) * (1.0 - luma), m);
    c = mix(c, bleached, uBleach);
    c += uNoise * (0.5 - ign(gl_FragCoord.xy + vec2(uFrame * 7.0, uFrame * 3.0)));
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  }`;

/** the pass's look: the centre's boost and the corners' factor, the bleach amount, the split in device pixels, the grain */
export interface PostLook { boost: number; corners: number; bleach: number; split: number; noise: number; /** the source is linear (encode it first) */ encode?: boolean; /** the screened blur's strength (laptops) */ bloom?: number }

export interface OutputPass {
  readonly out: Texture | null;
  resize(w: number, h: number): void;
  /** draws src through the pass into its own 8-bit target */
  run(src: Texture, look: PostLook, frame: number): void;
  dispose(): void;
}

export function createOutputPass(renderer: WebGLRenderer): OutputPass {
  const P = { tSrc: { value: null as Texture | null }, uRes: { value: new Vector2(1, 1) }, uBoost: { value: 2 }, uCorners: { value: 0.85 }, uBleach: { value: 1 }, uSplit: { value: 8 }, uNoise: { value: 0.01 }, uFrame: { value: 0 }, uEncode: { value: 0 }, uBloom: { value: 0 } };
  const mat = new ShaderMaterial({ uniforms: P, vertexShader: FS_UV_VERT, fragmentShader: POST_FRAG, depthTest: false, depthWrite: false });
  const scene = fsScene(mat);
  let rt: WebGLRenderTarget | null = null;
  return {
    get out() { return rt ? rt.texture : null; },
    resize(w, h) { rt?.dispose(); rt = new WebGLRenderTarget(Math.max(1, w), Math.max(1, h), { depthBuffer: false }); P.uRes.value.set(Math.max(1, w), Math.max(1, h)); },
    run(src, look, frame) {
      if (!rt) return;
      P.tSrc.value = src; P.uFrame.value = frame % 4096;
      P.uBoost.value = look.boost; P.uCorners.value = look.corners; P.uBleach.value = look.bleach; P.uSplit.value = look.split; P.uNoise.value = look.noise; P.uEncode.value = look.encode ? 1 : 0; P.uBloom.value = look.bloom ?? 0;
      renderer.setRenderTarget(rt); renderer.render(scene, fsCam); renderer.setRenderTarget(null);
    },
    dispose() { rt?.dispose(); rt = null; mat.dispose(); },
  };
}
