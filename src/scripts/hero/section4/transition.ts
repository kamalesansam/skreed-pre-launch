// Section 4's transition (docs/specs/section-4-world.md 2 "The bubble", 4 and 5 "The island"; it replaces the white-out
// and the ten bands of section-4.md 2 "The transition", E-S4-sweep withdrawn). One full-screen pass from uv over the
// island's own targets, the hall's frame (from) and the world's (to), both display values, in three modes on one
// program: the mode is a uniform, never a define, so the director's warm-up compiles it once and no mode compiles on
// the press.
// - The bubble (E-S4-portal): a wavy circle opens from a centre (the frame's own unless the director moves it) and grows
//   until its edge has cleared the farthest corner. Inside, the world's frame, sampled with a small lens pull near the
//   edge like the film of a bubble; outside, the hall's own frame greyed and darkened at full strength from the first
//   frame ("the exterior is dark and grey"); on the edge a 2 device px Pearl Whisper outline, antialiased by the true
//   distance to the wobbling curve, so it reads the same width on every lobe.
// - Plain: a straight mix of the two frames (the fog's 'fade' hand-off).
// - The dissolve: reduced motion's 600 ms cross-fade from the hall to the world's first frame (spec 4, "Reduced motion").
// The radius, the amplitude and the five phases are set on the CPU every frame by bubbleAt, which the director and the
// unit test share (tests/unit/room-bubble.test.ts sweeps it at 60 steps a second: no point of the edge ever steps
// inward, so every pixel crosses from outside to inside exactly once, WCAG 2.3.1 and AC4).
import { Color, ShaderMaterial, Vector2, WebGLRenderTarget, type Texture, type WebGLRenderer } from 'three';
import { fsCam, fsScene } from '../section2/background.ts';
import { FS_UV_VERT } from './post.ts';
import { PEARL_WHISPER, URBAN_SLATE } from '../../../config/tokens.ts';
import { clamp01, smoothstep } from '../util/math.ts';

/** The bubble's numbers (spec 2 "The bubble"). Tune's range for bubbleMs is msRange, its own (ROOM_RANGES carries it; room-bubble.test.ts proves the growth across it). */
export interface BubbleConstants {
  /** seconds after the press the bubble starts */
  readonly start: number;
  /** bubbleMs's default, and Tune's range (the growth is proven across it, room-bubble.test.ts) */
  readonly ms: number;
  readonly msRange: readonly [number, number];
  /** R1, the radius the opening ease reaches, as a share of the frame's short side */
  readonly r1: number;
  /** the share of the time the opening ease takes; the rest is the constant zoom to the end */
  readonly ease: number;
  /** the five angular modes: lobes (a Fibonacci run, so the shader builds each power from the two before), weights, phase rates in rad per second, and their phases at the start */
  readonly lobes: readonly number[];
  readonly weights: readonly number[];
  readonly rates: readonly number[];
  readonly phase0: readonly number[];
  /** the wobble's amplitude as a share of the radius: while small, and at the end */
  readonly ampSmall: number;
  readonly ampEnd: number;
  /** device px the edge's innermost point clears the farthest corner by at the end */
  readonly margin: number;
  /** the outline's width, device px */
  readonly line: number;
  /** the lens pull at the edge and the depth it fades over, device px; it fades out from lensOut of the time to the end, so the last frame is the world's own */
  readonly lens: number;
  readonly lensFade: number;
  readonly lensOut: number;
  /** outside: the luminance mixed this far toward Urban Slate, then multiplied by dark */
  readonly grey: number;
  readonly dark: number;
  /** reduced motion's dissolve, ms */
  readonly dissolveMs: number;
}

export const BUBBLE: BubbleConstants = Object.freeze({
  start: 0.35,
  ms: 2000,
  msRange: Object.freeze([1200, 3200]) as readonly [number, number],
  r1: 0.08,
  ease: 0.12,
  lobes: Object.freeze([2, 3, 5, 8, 13]),
  weights: Object.freeze([0.34, 0.28, 0.20, 0.12, 0.06]),
  rates: Object.freeze([1.3, 1.9, 3.1, 4.6, 6.8]),          // a weighted sum of 2.55 rad per second
  phase0: Object.freeze([0, 2.4, 4.8, 0.917, 3.317]),       // golden-angle steps, so no two modes start in step
  ampSmall: 0.12,
  ampEnd: 0.025,
  margin: 4,
  line: 2,
  lens: 6,
  lensFade: 24,
  lensOut: 0.9,
  grey: 0.5,
  dark: 0.6,
  dissolveMs: 600,
});

/** the frame's size in device px, and the bubble's centre in device px from its top left (the frame's centre if absent) */
export interface BubbleSize { w: number; h: number; cx?: number; cy?: number }

/** the bubble at one moment */
export interface BubbleFrame {
  /** the progress over the bubble's time, 0 to 1 */
  u: number;
  /** the base radius R and the wobble's amplitude A as a share of it; the edge is R(1 + A f(theta)), |f| <= 1 */
  R: number;
  A: number;
  /** the five modes' phases, rad */
  phases: number[];
  /** the centre, device px from the frame's top left */
  cx: number;
  cy: number;
  /** R1, the end radius and the duration in use (bubbleMs clamped to Tune's range) */
  r1: number;
  rEnd: number;
  bubbleMs: number;
  /** the farthest the edge reaches, R(1 + A): a bounding circle for the world's scissor while the bubble is small */
  reach: number;
  /** the lens pull at the edge this frame, device px */
  lens: number;
  /** the edge has cleared every corner: the frame is the world's own */
  done: boolean;
}

/**
 * The bubble ms after its start, for a duration and a frame (spec 2, "Growth"). Over the first `ease` of the time the
 * radius rises from 0 to R1 on an ease-out cubic blended with a line, g(x) = (1 - k)(1 - (1 - x)^3) + k x: concave, so
 * no overshoot, and its end slope k is the zoom's opening slope, so the velocity is continuous at the join (the ease
 * ends with no acceleration left). Then a constant zoom rate, R = R1 (Rend / R1)^v, to Rend = the farthest corner plus the end
 * amplitude plus the margin. The amplitude eases (smoothstep) from ampSmall to ampEnd over the zoom. The phases advance
 * with the time and stop with the bubble, so its edge stands still once it is off screen.
 */
export function bubbleAt(ms: number, bubbleMs: number, size: BubbleSize, c: BubbleConstants = BUBBLE): BubbleFrame {
  const w = Math.max(1, size.w), h = Math.max(1, size.h), cx = size.cx ?? w / 2, cy = size.cy ?? h / 2;
  const T = Math.min(c.msRange[1], Math.max(c.msRange[0], bubbleMs));
  const far = Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy));
  const r1 = c.r1 * Math.min(w, h), rEnd = (far + c.margin) / (1 - c.ampEnd);   // the edge's innermost point at the end, Rend(1 - ampEnd), is the margin past the corner
  const zoom = Math.log(rEnd / r1), e = c.ease, u = clamp01(ms / T);
  const k = Math.min(1, (e * zoom) / (1 - e));
  let R: number, v = 0;
  if (u <= e) { const x = u / e; R = r1 * ((1 - k) * (1 - (1 - x) ** 3) + k * x); }
  else { v = (u - e) / (1 - e); R = r1 * Math.exp(zoom * v); }
  const A = c.ampSmall + (c.ampEnd - c.ampSmall) * v * v * (3 - 2 * v);
  const t = Math.min(T, Math.max(0, ms)) / 1000;
  const phases = c.rates.map((rate, i) => c.phase0[i] + rate * t);
  return { u, R, A, phases, cx, cy, r1, rEnd, bubbleMs: T, reach: R * (1 + A), lens: c.lens * (1 - smoothstep(c.lensOut, 1, u)), done: u >= 1 };
}

/** the edge's radius at angle theta (rad, counter-clockwise from +x with y up, as the shader): R(1 + A sum w cos(n theta - phase)) */
export function bubbleEdge(f: BubbleFrame, theta: number, c: BubbleConstants = BUBBLE): number {
  let s = 0;
  for (let i = 0; i < c.lobes.length; i++) s += c.weights[i] * Math.cos(c.lobes[i] * theta - f.phases[i]);
  return f.R * (1 + f.A * s);
}

/** the shader's uM: each mode as R A w (cos phase, sin phase), so cos(n theta - phase) R A w is dot(z^n, uM[k]) for z = e^(i theta) */
export function bubbleModes(f: BubbleFrame, c: BubbleConstants = BUBBLE, out: number[] = new Array<number>(10)): number[] {
  const s = f.R * f.A;
  for (let i = 0; i < 5; i++) { out[2 * i] = s * c.weights[i] * Math.cos(f.phases[i]); out[2 * i + 1] = s * c.weights[i] * Math.sin(f.phases[i]); }
  return out;
}

/**
 * The shader's signed distance, mirrored on the CPU for the tests: device px from the edge to the pixel (x, y), from the
 * frame's top left, negative inside. The angle comes as the unit complex z, its powers as products of the two before
 * (z^2, z^3 = z^2 z, z^5 = z^3 z^2, z^8, z^13), never an atan. The radial gap rho - r(theta) is divided by the gradient's
 * length, sqrt(1 + (r'(theta) / rho)^2), the first-order true distance to the curve.
 */
export function bubbleDistance(f: BubbleFrame, x: number, y: number, c: BubbleConstants = BUBBLE): number {
  const px = x - f.cx, py = f.cy - y, rho = Math.max(Math.hypot(px, py), 0.5), m = bubbleModes(f, c);
  let ax = px / rho, ay = py / rho, bx = ax * ax - ay * ay, by = 2 * ax * ay;   // z^1, z^2
  let r = f.R, dr = 0;
  for (let i = 0; i < 5; i++) {
    r += bx * m[2 * i] + by * m[2 * i + 1];
    dr -= c.lobes[i] * (m[2 * i] * by - m[2 * i + 1] * bx);
    const nx = bx * ax - by * ay, ny = bx * ay + by * ax;   // the next power: this one times the one before
    ax = bx; ay = by; bx = nx; by = ny;
  }
  const g = dr / rho;
  return (rho - r) / Math.sqrt(1 + g * g);
}

/** what the bubble does to a hall pixel outside it (display values in and out), mirrored on the CPU for AC4's bound */
export function bubbleOutside(rgb: readonly [number, number, number], c: BubbleConstants = BUBBLE): [number, number, number] {
  const slate = [1, 3, 5].map((i) => parseInt(URBAN_SLATE.slice(i, i + 2), 16) / 255), l = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return [0, 1, 2].map((i) => (l + (slate[i] - l) * c.grey) * c.dark) as [number, number, number];
}

/** reduced motion's dissolve ms after its start: the mix, on a smoothstep, 1 when done */
export function dissolveAt(ms: number, c: BubbleConstants = BUBBLE): number { return smoothstep(0, c.dissolveMs, ms); }

export interface GrowthCheck {
  ok: boolean;
  /** no angle's edge radius fell from one step to the next */
  grows: boolean;
  /** the final edge, outline and antialiasing included, is off every corner pixel */
  clears: boolean;
  steps: number;
  angles: number;
  /** the smallest step of the edge's radius over every angle and step, device px, and where it fell */
  minStep: number;
  worst: { ms: number; theta: number };
  /** device px between the final edge and the nearest point it must clear: the farthest corner at every angle, and each corner pixel by the true distance */
  clearance: number;
}

/**
 * Checks the growth (AC4): the edge sampled at `angles` angles across a sweep at `fps` steps a second from the start
 * to the end must never step inward at any angle, and at the end its innermost point must clear the farthest corner,
 * and each corner pixel's centre must lie past the outline's half width and the antialiasing's half pixel.
 */
export function checkBubbleGrowth(bubbleMs: number, size: BubbleSize, opts: { fps?: number; angles?: number } = {}, c: BubbleConstants = BUBBLE): GrowthCheck {
  const fps = opts.fps ?? 60, n = opts.angles ?? 720;
  const T = bubbleAt(0, bubbleMs, size, c).bubbleMs, steps = Math.ceil((T * fps) / 1000);
  const prev = new Float64Array(n);
  let minStep = Infinity, worst = { ms: 0, theta: 0 }, grows = true, last = bubbleAt(0, T, size, c);
  for (let s = 0; s <= steps; s++) {
    const ms = Math.min(T, (s * 1000) / fps);
    last = bubbleAt(ms, T, size, c);
    for (let j = 0; j < n; j++) {
      const theta = (2 * Math.PI * j) / n, r = bubbleEdge(last, theta, c);
      if (s > 0) { const d = r - prev[j]; if (d < minStep) { minStep = d; worst = { ms, theta }; } if (d < 0) grows = false; }
      prev[j] = r;
    }
  }
  const w = Math.max(1, size.w), h = Math.max(1, size.h);
  const far = Math.max(...[[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => Math.hypot(x - last.cx, y - last.cy)));
  let clearance = Infinity;
  for (let j = 0; j < n; j++) clearance = Math.min(clearance, prev[j] - far);
  for (const [x, y] of [[0.5, 0.5], [w - 0.5, 0.5], [0.5, h - 0.5], [w - 0.5, h - 0.5]]) clearance = Math.min(clearance, -bubbleDistance(last, x, y, c));
  const clears = last.done && clearance >= c.line / 2 + 0.5;
  return { ok: grows && clears, grows, clears, steps, angles: n, minStep, worst, clearance };
}

// uMode 0 the bubble, 1 a mix by uP (plain and the dissolve). The bubble's edge: r = R + sum dot(z^n, uM[k]) and its
// slope r' = -sum n cross(uM[k], z^n), the powers chained as bubbleDistance documents; d the true distance (negative
// inside). The lens samples the world inward along the curve's normal, uLens at the edge falling to 0 over uFade on a
// square, and never past half the way to the centre. Outside: the hall's luma mixed uGrey toward Urban Slate, times
// uDark. The outline covers |d| < uLine with a one-pixel box filter. Before the first growth (uR 0) the frame is all
// outside, with no dot at the centre.
const FRAG = /* glsl */`
  uniform sampler2D tFrom, tTo; uniform float uMode, uP, uR, uLens, uFade, uLine, uGrey, uDark; uniform vec2 uRes, uC, uM[5]; uniform vec3 uPearl, uSlate;
  varying vec2 vUv;
  vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
  float crs(vec2 a, vec2 b) { return a.x * b.y - a.y * b.x; }
  void main() {
    vec3 from = texture2D(tFrom, vUv).rgb;
    if (uMode > 0.5) { gl_FragColor = vec4(mix(from, texture2D(tTo, vUv).rgb, uP), 1.0); return; }
    vec2 p = vUv * uRes - uC;
    float rho = max(length(p), 0.5);
    vec2 z1 = p / rho, z2 = cmul(z1, z1), z3 = cmul(z2, z1), z5 = cmul(z3, z2), z8 = cmul(z5, z3), z13 = cmul(z8, z5);
    float r = uR + dot(z2, uM[0]) + dot(z3, uM[1]) + dot(z5, uM[2]) + dot(z8, uM[3]) + dot(z13, uM[4]);
    float dr = -(2.0 * crs(uM[0], z2) + 3.0 * crs(uM[1], z3) + 5.0 * crs(uM[2], z5) + 8.0 * crs(uM[3], z8) + 13.0 * crs(uM[4], z13));
    float g = dr / rho, k = inversesqrt(1.0 + g * g), d = (rho - r) * k;
    vec2 n = (z1 - g * vec2(-z1.y, z1.x)) * k;
    float s = 1.0 - clamp(-d / uFade, 0.0, 1.0), pull = min(uLens * s * s, 0.5 * rho);
    vec3 inside = texture2D(tTo, vUv - n * pull / uRes).rgb;
    float l = dot(from, vec3(0.2126, 0.7152, 0.0722));
    vec3 outside = mix(vec3(l), uSlate, uGrey) * uDark;
    float on = clamp(uR, 0.0, 1.0);
    vec3 c = mix(outside, inside, clamp(0.5 - d, 0.0, 1.0) * on);
    c = mix(c, uPearl, clamp(uLine + 0.5 - abs(d), 0.0, 1.0) * on);
    gl_FragColor = vec4(c, 1.0);
  }`;

export interface TransitionPass {
  readonly out: Texture | null;
  /** device px; the bubble's numbers are in these */
  resize(w: number, h: number): void;
  /** the bubble's centre in device px from the frame's top left, or null for the frame's centre. Set it before the bubble starts: the end radius depends on it */
  centre(c: { x: number; y: number } | null): void;
  /**
   * The bubble ms after its start (bubbleMs long, clamped to Tune's range), from the hall's frame to the scenes'; returns
   * the frame (reach for a scissor, done once every corner is the scenes'). fade scales the outside's grey and dark (1 the
   * spec's, 0 the hall's own frame): the way back runs the clock down and fades them with the circle's remaining radius,
   * so nothing pops when the circle is gone (section-4-flux.md 4, "A backward gesture at scene 1").
   */
  bubble(from: Texture, to: Texture, ms: number, bubbleMs: number, fade?: number): BubbleFrame;
  /** reduced motion: the dissolve ms after its start (BUBBLE.dissolveMs long); returns its progress, 1 when done */
  dissolve(from: Texture, to: Texture, ms: number): number;
  /** a straight mix of the two frames by p (the fog's 'fade' hand-off) */
  plain(from: Texture, to: Texture, p: number): void;
  dispose(): void;
}

export function createTransition(renderer: WebGLRenderer): TransitionPass {
  // the outline and Urban Slate as display values: the pass's targets are read as sRGB (three's Color holds a hex as linear)
  const display = (hex: string) => new Color(hex).convertLinearToSRGB();
  const U = {
    tFrom: { value: null as Texture | null }, tTo: { value: null as Texture | null }, uMode: { value: 1 }, uP: { value: 0 }, uR: { value: 0 },
    uLens: { value: BUBBLE.lens }, uFade: { value: BUBBLE.lensFade }, uLine: { value: BUBBLE.line / 2 }, uGrey: { value: BUBBLE.grey }, uDark: { value: BUBBLE.dark },
    uRes: { value: new Vector2(1, 1) }, uC: { value: new Vector2(0.5, 0.5) }, uM: { value: Array.from({ length: 5 }, () => new Vector2()) },
    uPearl: { value: display(PEARL_WHISPER) }, uSlate: { value: display(URBAN_SLATE) },
  };
  const mat = new ShaderMaterial({ uniforms: U, vertexShader: FS_UV_VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false });
  const scene = fsScene(mat);
  const modes = new Array<number>(10);
  let rt: WebGLRenderTarget | null = null, w = 1, h = 1, at: { x: number; y: number } | null = null;
  const draw = (from: Texture, to: Texture) => {
    if (!rt) return;
    U.tFrom.value = from; U.tTo.value = to;
    renderer.setRenderTarget(rt); renderer.render(scene, fsCam); renderer.setRenderTarget(null);
  };
  const mixAt = (from: Texture, to: Texture, p: number) => { U.uMode.value = 1; U.uP.value = clamp01(p); draw(from, to); };
  const pass: TransitionPass = {
    get out() { return rt ? rt.texture : null; },
    resize(nw, nh) { w = Math.max(1, nw); h = Math.max(1, nh); rt?.dispose(); rt = new WebGLRenderTarget(w, h, { depthBuffer: false }); U.uRes.value.set(w, h); },
    centre(c) { at = c ? { x: c.x, y: c.y } : null; },
    bubble(from, to, ms, bubbleMs, fade = 1) {
      const f = bubbleAt(ms, bubbleMs, at ? { w, h, cx: at.x, cy: at.y } : { w, h });
      bubbleModes(f, BUBBLE, modes);
      const k = clamp01(fade);
      U.uMode.value = 0; U.uR.value = f.R; U.uLens.value = f.lens; U.uGrey.value = BUBBLE.grey * k; U.uDark.value = 1 - (1 - BUBBLE.dark) * k;
      U.uC.value.set(f.cx, h - f.cy);   // the shader's frame has y up from the bottom
      for (let i = 0; i < 5; i++) U.uM.value[i].set(modes[2 * i], modes[2 * i + 1]);
      draw(from, to);
      return f;
    },
    dissolve(from, to, ms) { const p = dissolveAt(ms); mixAt(from, to, p); return p; },
    plain(from, to, p) { mixAt(from, to, p); },
    dispose() { rt?.dispose(); rt = null; mat.dispose(); },
  };
  return pass;
}
