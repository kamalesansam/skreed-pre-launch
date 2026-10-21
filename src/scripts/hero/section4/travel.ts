// Section 4's travel between the lands (docs/specs/section-4-world.md 2 "The travel between lands", 5 "Build modes" and
// "The poster path and failures"; W6, W9). The director starts a travel on a trigger or a key and runs it on its own clock;
// what the travel looks like is an option, A (the pictures in depth, travel-depth.ts), B (the modelled park,
// travel-park.ts) or C (the clips, travel-video.ts), each a module of its own that only import() reaches (travel-stub.ts's
// first rule), so each is its own lazy chunk and a build with Tune off carries only its pick (astro.config.mjs resolves the
// other two to travel-stub.ts, which exports no createTravel). This file is the contract between the director and an
// option, and the 300 ms cross-fade that stands in wherever an option is not there, failed, refused or cannot play:
// never option A in its place where the pick is not A. Nothing here imports an option statically, and no option's ?url
// asset is named here (the stub's second rule).
import type { WebGLRenderer } from 'three';
import type { LandClass, RoomParams, TravelOption } from '../../../config/room.ts';
import type { LandView, WorldLayer, WorldScene } from './world.ts';

/** what an option gets from the director: the renderer and the world it draws into, and the lands as they are resident */
export interface TravelContext {
  readonly renderer: WebGLRenderer;
  readonly world: WorldScene;
  readonly touch: boolean;
  /** the still3d tier: every travel is the cross-fade (spec 4), so an option is never created there */
  readonly reduced: boolean;
  readonly dpr: number;
  /** the image format the island picked at boot (the hero poster's): an option's own images in AVIF, else WebP (B's lightmap) */
  readonly avif: boolean;
  /** land i's view while it is resident (the director keeps the previous, current and next), else null */
  view(i: number): LandView | null;
  /** the picture class in use */
  cls(): LandClass;
  /** the live parameters (Tune's copy, or the defaults) */
  params(): RoomParams;
}

/** one option's travel, created once per option and reused for every pair of lands */
export interface Travel {
  /** its own assets and programs (B's park, C's first clips), one compile, upload or decode a frame (spec 5, phase 3, on the press) */
  load(): Promise<void>;
  readonly ready: boolean;
  /** it could not load: every travel is the cross-fade from then on */
  readonly failed: boolean;
  /** what the land's text shows where a travel did not play as the option (C's refused clip on a Tune build), else null */
  readonly note: string | null;
  /** whether the travel from land `from` to land `to` can play now (both lands resident; for C, its clip fully fetched) */
  can(from: number, to: number): boolean;
  /** its length in ms: landTravelMs for A and B, the clip's own for C */
  ms(from: number, to: number, params: RoomParams): number;
  /** the frame at p (0 to 1) of the travel from `from` to `to` as the world's layers; null if it cannot go on (the cross-fade takes the rest) */
  frame(from: number, to: number, p: number): readonly WorldLayer[] | null;
  /** the travel ended, landed or was abandoned (reset, Escape) */
  end(): void;
  /** its GPU resources and fetches (Tune switching options disposes the previous one) */
  dispose(): void;
}

/** a travel module's one export; travel-stub.ts has none, so a stubbed option reads as absent */
export interface TravelEntry { createTravel(ctx: TravelContext): Travel | null }

/** the cross-fade's length, ms (spec 2: "a failed or refused travel is the 300 ms cross-fade"; spec 4 under still3d) */
export const FADE_MS = 300;

/** land i at rest as a layer, or the garden at the glide's end pose where its picture is not resident (spec 5: a failed land picture shows its text on the garden) */
export const restLayer = (world: WorldScene, view: LandView | null, i: number, alpha?: number): WorldLayer =>
  (view ? { kind: 'land', i, push: world.restPush(i), alpha } : { kind: 'garden' });

/**
 * The cross-fade's frame at p: the departing land at rest, the arriving one over it at alpha p (the garden stands in for
 * the departing one where its picture failed). Where the arriving land's picture failed, the garden has no alpha of its
 * own, so it cuts in half way.
 */
export function fadeLayers(world: WorldScene, view: (i: number) => LandView | null, from: number, to: number, p: number): WorldLayer[] {
  const a = view(from), b = view(to);
  if (b) return [restLayer(world, a, from), restLayer(world, b, to, Math.max(0, Math.min(1, p)))];
  return [p < 0.5 ? restLayer(world, a, from) : { kind: 'garden' }];
}

/**
 * The option's module by import() only (travel-stub.ts's first rule). Resolves to its entry, or null where this build
 * does not carry the option (the stub), its chunk failed to load, or it has no travel yet: the cross-fade then.
 */
export async function loadTravel(option: TravelOption): Promise<TravelEntry | null> {
  try {
    const m: Record<string, unknown> = option === 'A' ? await import('./travel-depth.ts') : option === 'B' ? await import('./travel-park.ts') : await import('./travel-video.ts');
    return typeof m.createTravel === 'function' ? (m as unknown as TravelEntry) : null;
  } catch (e) {
    console.warn(`section 4: option ${option}'s travel did not load; the cross-fade stands in`, e);
    return null;
  }
}
