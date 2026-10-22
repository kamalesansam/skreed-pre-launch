// The island's shared types: HeroContext (hero-architecture.md 5.2; round 3 adds the intro's and section 2's needs) and
// the per-frame context the slots receive.
import type { Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, ShaderMaterial, SphereGeometry, Texture, WebGLRenderer } from 'three';
import type { HeroParams } from '../../config/params.ts';
import type { Life } from './bridge/life.ts';
import type { LoaderBridge } from './bridge/loader.ts';
import type { Pieces } from './data/assets.ts';
import type { Block, LogoFrame } from './logo/geometry.ts';
import type { LogoUniforms } from './logo/uniforms.ts';
import type { FogUniforms } from './world/fog.ts';
import type { HeroComposer } from './post/composer.ts';
import type { Composite, LogoMask } from './post/composite.ts';
import type { CameraRig } from './camera/rig.ts';
import type { Section2Scene } from './section2/types.ts';
import type { GroundScene } from './section3/ground.ts';
import type { RoomDirector } from './section4/director.ts';
import type { IntroDirector } from './intro/types.ts';
import type { RideEls } from './scroll/ride.ts';
import type { SkyClass } from './data/urls.ts';

export interface FrameCtx {
  t: number; dt: number; ratio: number; live: number;
  /** the scroll follower's second stage, in screens */
  b: number;
  s: number; tp: number; tp2: number; heroOn: number;
  reduced: boolean;
}

export interface SkyState {
  dome: Mesh<SphereGeometry, ShaderMaterial>;
  cls: SkyClass;
  /** stage 2: the one-way portrait to wide upgrade (architecture 6.5); a no-op at stage 1 */
  onAspect(asp: number): void;
  onFrame2(): void;
}

/** the logo's uniforms plus whatever the intro adds (uPrint, uPrintCol, tTri, uMask) */
export type HeroUniforms = LogoUniforms & Record<string, { value: unknown }>;

export interface HeroContext {
  renderer: WebGLRenderer; dpr: number; life: Life; bridge: LoaderBridge;
  sceneA: Scene; camA: PerspectiveCamera; U: HeroUniforms; FOG: FogUniforms;
  blocks: Block[]; frame: LogoFrame; pieces: Pieces; logo: Mesh; moon: Group; rig: CameraRig;
  groundAt: (x: number, z: number) => number; stoneTopAt: (x: number, z: number) => number;
  groundMesh: Mesh<never, MeshBasicMaterial> | Mesh; stonesMesh: Mesh;
  sky: SkyState;
  composerA: HeroComposer; fogGround: GroundScene; section2: Section2Scene | null; composite: Composite; mask: LogoMask; scrollTex: Texture;
  /** section 4 (section4/director.ts: the hall, the bubble, the world and its lands, the loop), created by its lazy chunk once the quiz is in view; null before that and on a failed import */
  room: RoomDirector | null;
  intro: IntroDirector;
  params: HeroParams; reduced: boolean; touch: boolean; ghost: boolean;
  els: RideEls;
  /** the width of the last full resize (stage/resize.ts), compared by the ResizeObserver */
  lastW?: number;
}
