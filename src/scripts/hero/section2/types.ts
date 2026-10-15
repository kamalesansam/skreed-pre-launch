// The section 2 slot (hero-architecture.md 11.2; round 3: section2/gems.ts, the ten gems of section-2.md) and the Wall
// placeholder the last wipe opens on (world/wall.ts, v9.9's 240 swatches). Section 2 renders into its own targets; the
// composite wipes the hero to section 2's output and keeps the logo over it through a mask (loop.ts, step F14).
import type { Texture } from 'three';

export interface Section2Scene {
  /** build() has been called (after the intro); ready once every gem is built and compiled; failed on an error */
  readonly started: boolean;
  readonly ready: boolean;
  readonly failed: boolean;
  /** section 2's frame: sRGB colour, alpha = what the gems and the flights cover (the composite's tB and tS) */
  readonly out: Texture | null;
  /** 1 while section 2 is on screen (the first wipe has started and the second has not ended) */
  readonly live: number;
  /** one stone per frame, after the intro; the first flight then costs no compile */
  build(): Promise<void>;
  resize(w: number, h: number): void;
  /** S: the scroll follower in screens; tp1 the first wipe, tp2 the wipe to the Wall; t the scene clock */
  update(S: number, tp1: number, tp2: number, t: number, dt: number): void;
  /** draws the background, the gems and the bloom into its own targets (NoToneMapping, clear colour saved) */
  render(): void;
  /** a hero block whose flying copy has taken over (or, under reduced motion, whose gem is at its slot) */
  hidden(i: number, S: number): boolean;
  /** true while the logo is whole or a block has not left yet (the composite keeps the logo over section 2) */
  logoLeft(): boolean;
  /** set by hero.ts: the keyboard's jump to section 2's rest (the family links' focus, family-page.md 2.2) */
  snapTo?: ((screens: number) => void) | null;
  /** test hook state (hooks builds) */
  hooks?(): unknown;
  dispose(): void;
}
