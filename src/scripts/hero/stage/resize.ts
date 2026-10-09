// Resize (prototype lines 1039 to 1050, hero-architecture.md 5.6) without its two no-op lines: EffectComposer.setSize
// already sizes the SavePass target, and UnrealBloomPass.resolution is only read at construction. None of these calls
// reads another's result, so section 2's own resize changes no pixel.
import { PORTRAIT_ASPECT } from '../../../config/hero.ts';
import type { HeroContext } from '../types.ts';

export function createResize(ctx: HeroContext): () => void {
  return function resize() {
    const w = innerWidth, h = innerHeight; if (!w || !h) return; const asp = w / h;
    ctx.renderer.setSize(w, h, false);
    ctx.composerA.c.setSize(w, h);
    ctx.camA.aspect = asp; ctx.camA.zoom = Math.min(1, asp * 1.25); ctx.camA.updateProjectionMatrix();   // igloo's portrait rule
    ctx.composite.C.uAspect.value = asp;
    ctx.section2.resize(w, h, asp, asp < PORTRAIT_ASPECT);
    ctx.sky.onAspect(asp);
  };
}
