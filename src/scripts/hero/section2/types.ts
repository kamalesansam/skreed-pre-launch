// The section 2 slot (hero-architecture.md 11.2). v9.9's frame is the placeholder Wall of 240 swatches; the rocks
// (template7) plug in here later without touching the hero.
import type { Camera, Scene, WebGLRenderer } from 'three';
import type { ScrollSegment } from '../../../config/hero.ts';
import type { PlainComposer } from '../post/composer.ts';
import type { CompositeSlots } from '../post/shaders.ts';
import type { FrameCtx, HeroContext } from '../types.ts';

export interface Section2Scene {
  readonly scene: Scene;
  readonly camera: Camera;
  /** built at start-up step 14, after composer A: RenderPass + OutputPass under NoToneMapping in v9.9 */
  composer: PlainComposer | null;
  /** v9.9: none; the rocks: DWELL 1 (phone 1.5), WIPE2 1, then 1 */
  readonly scrollSegments: ScrollSegment[];
  readonly compositeSlots?: CompositeSlots;
  /** the rocks: the logo morph into the rock pose (view-space uOff and uQ) */
  readonly logoVertexSlot?: string;
  install(ctx: HeroContext): void;
  makeComposer(renderer: WebGLRenderer): void;
  resize(w: number, h: number, aspect: number, portrait: boolean): void;
  update(f: FrameCtx): void;
  /** the rocks: an idle build budget of 4, 12 or unlimited ms by scroll */
  pump?(budgetMs: number): void;
  /** also clears its DOM riders' inline styles (toPoster step 4) */
  dispose(): void;
}
