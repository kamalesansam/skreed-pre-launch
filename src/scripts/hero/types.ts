// The island's shared types: HeroContext (hero-architecture.md 5.2) and the per-frame context the slots receive.
import type { Group, Mesh, PerspectiveCamera, Scene, ShaderMaterial, SphereGeometry, WebGLRenderer } from 'three';
import type { HeroParams } from '../../config/params.ts';
import type { Life } from './bridge/life.ts';
import type { LoaderBridge } from './bridge/loader.ts';
import type { Block, LogoFrame } from './logo/geometry.ts';
import type { LogoUniforms } from './logo/uniforms.ts';
import type { FogUniforms } from './world/fog.ts';
import type { HeroComposer } from './post/composer.ts';
import type { Composite } from './post/composite.ts';
import type { CameraRig } from './camera/rig.ts';
import type { Section2Scene } from './section2/types.ts';
import type { IntroDirector } from './intro/types.ts';
import type { RideEls } from './scroll/ride.ts';
import type { SkyClass } from './data/urls.ts';

export interface FrameCtx {
  t: number; dt: number; ratio: number; live: number;
  /** the scroll follower's second stage, in screens */
  b: number;
  s: number; tp: number; heroOn: number;
  reduced: boolean;
}

export interface SkyState {
  dome: Mesh<SphereGeometry, ShaderMaterial>;
  cls: SkyClass;
  /** stage 2: the one-way portrait to wide upgrade (architecture 6.5); a no-op at stage 1 */
  onAspect(asp: number): void;
  onFrame2(): void;
}

export interface HeroContext {
  renderer: WebGLRenderer; dpr: number; life: Life; bridge: LoaderBridge;
  sceneA: Scene; camA: PerspectiveCamera; U: LogoUniforms; FOG: FogUniforms;
  blocks: Block[]; frame: LogoFrame; logo: Mesh; moon: Group; rig: CameraRig;
  groundAt: (x: number, z: number) => number; stoneTopAt: (x: number, z: number) => number;
  sky: SkyState;
  composerA: HeroComposer; section2: Section2Scene; composite: Composite; intro: IntroDirector;
  params: HeroParams; reduced: boolean; touch: boolean; ghost: boolean;
  els: RideEls;
}
