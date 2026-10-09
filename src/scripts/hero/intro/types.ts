// The igloo intro slot (hero-architecture.md 11.1). v9.9 has no intro: NO_INTRO (intro/none.ts) keeps its behaviour,
// the live ramp from the loader's cut and frame1 and frame2 on the first two frames with both textures loaded.
import type { PerspectiveCamera, WebGLRendererParameters } from 'three';
import type { LogoSlots } from '../logo/shaders.ts';
import type { SkySlots } from '../world/shaders.ts';
import type { CompositeSlots } from '../post/shaders.ts';
import type { ShaderPatch } from '../world/ground.ts';
import type { FrameCtx, HeroContext } from '../types.ts';

export interface HeroShaderSlots {
  logo?: LogoSlots;
  sky?: SkySlots;
  composite?: CompositeSlots;
  ground?: ShaderPatch[];
  stones?: ShaderPatch[];
}

export interface IntroFrame {
  live?: number; breath?: number; touch?: boolean;
  camera?: (cam: PerspectiveCamera) => void;
  uiPhase?: number; scrollLocked?: boolean;
}

export interface IntroDirector {
  /** v10: ['intro'], appended to the loader weights (re-measure, architecture 7.4) */
  readonly milestones: readonly string[];
  /** v10: {antialias: false, depth: false, stencil: false} */
  readonly rendererOptions?: Partial<WebGLRendererParameters>;
  readonly slots: HeroShaderSlots;
  /** v10 calls __introDone itself when there is no loader */
  readonly ownsIntroDone?: boolean;
  install(ctx: HeroContext): void;
  /** at the loader's cut, instead of the v9.9 live ramp */
  start(t: number): void;
  update(t: number, dt: number, ctx: HeroContext): IntroFrame | null;
  /** v10: frame1 and frame2 from its GPU fence instead of the default rule (frame step F15) */
  reportFrames?(f: FrameCtx, report: (m: 'frame1' | 'frame2') => void): void;
  skip(reason: 'reduced' | 'param' | 'hash' | 'poster'): void;
}
