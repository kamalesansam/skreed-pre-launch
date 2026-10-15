// The igloo intro slot (hero-architecture.md 11.1, filled in round 3 by intro/igloo.ts). NO_INTRO (intro/none.ts) keeps
// v9.9's behaviour: the live ramp from the loader's cut and frame1 and frame2 on the first two frames with both textures
// loaded. The loop asks the director once per frame (frame), after the composite has been drawn (afterRender), and the
// start-up asks it to build (install), to set its warm-up values (warm) and to arm its first frame (arm).
import type { Vector3, WebGLRendererParameters } from 'three';
import type { LogoSlots } from '../logo/shaders.ts';
import type { SkySlots } from '../world/shaders.ts';
import type { CompositeSlots } from '../post/shaders.ts';
import type { ShaderPatch } from '../world/ground.ts';
import type { HeroContext } from '../types.ts';

export interface HeroShaderSlots {
  logo?: LogoSlots;
  sky?: SkySlots;
  composite?: CompositeSlots;
  ground?: ShaderPatch[];
  stones?: ShaderPatch[];
}

export interface IntroFrame {
  /** the hero's life (bob, shake, breath, parallax, push, sweep): igloo's touchAmount during the shot, the 2 s ramp after a cut */
  live: number;
  /** igloo's introDisplacementModulator: gates the breathing (and the labels) from 2 s */
  breath: number;
  /** the crane down from the start pose: the base camera pose is blended from pos/tgt (w 0) to the scroll pose (w 1) */
  crane: { w: number; pos: Vector3; tgt: Vector3 } | null;
  /** armed and the previous frame's fence still pending: skip this render */
  hold: boolean;
}

export interface IntroFrameInput {
  t: number; dt: number;
  /** the raw clock delta before the 1/12 cap (the intro clock's lag smoothing reads it) */
  raw: number;
  /** __skreedFreeze or a seek: the clocks hold */
  frozen: boolean;
  now: number;
  /** textures loaded so far (0 to 2) */
  texOk: number;
}

export interface IntroHooks {
  state(): Record<string, unknown>;
  /** pins the shot at x seconds (t0 pins the shader clock too); returns the loop's new t */
  seek(x: number, t0?: number): number;
  play(): void;
  replay(): void;
  skip(): void;
  tune?(o: Record<string, number>): void;
}

export interface IntroDirector {
  /** v10: ['intro'], reported by hero.ts after install, before 'scene' (loader-weights.json) */
  readonly milestones: readonly string[];
  /** v10: {antialias: false, depth: false, stencil: false} */
  readonly rendererOptions?: Partial<WebGLRendererParameters>;
  readonly slots: HeroShaderSlots;
  /** uniforms the logo material needs (uPrint, uPrintCol, tTri, uMask); merged into U before the material is built */
  readonly logoUniforms: Record<string, { value: unknown }>;
  /** the shot is over or skipped: the hero is at rest and section 2 may build */
  readonly done: boolean;
  /** a seek pinned the clock (test hook): the loop advances nothing */
  readonly paused: boolean;
  /** builds the intro's geometry, textures and materials (needs the renderer, the blocks and the floor); reports nothing */
  install(ctx: HeroContext): Promise<void>;
  /** the warm-up's first draw: every branch at mid values */
  warm(ctx: HeroContext): void;
  /** after the warm-up: the armed frames at t = 0, or the end state when the shot is skipped */
  arm(): void;
  /** the loader's lift (__introDone): igloo's hide and introTL.play(0) on one tick */
  start(t: number): void;
  frame(f: IntroFrameInput, ctx: HeroContext): IntroFrame;
  /** after the composite is drawn: the GPU fence of an armed frame, frame1 when it is issued, frame2 when it signals */
  afterRender(now: number, ctx: HeroContext, texOk: number): void;
  /** true when a small viewport change during the shot moves only the camera (render targets keep their size) */
  resize(w: number, h: number, dpr: number, touch: boolean): boolean;
  /** called by the resize path once it has run in full (the deferred resize is replayed when the shot ends) */
  onResize?: (() => void) | null;
  skip(reason: 'reduced' | 'param' | 'hash' | 'poster'): void;
  readonly hooks?: IntroHooks;
}
