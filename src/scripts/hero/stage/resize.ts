// Resize (prototype v11.4 template.html resize(); hero-architecture.md 5.6). The width is the root's clientWidth (the
// fixed canvas's width, without a classic scrollbar). During the shot a small viewport change moves only the camera (the
// intro director decides); otherwise the renderer, the composers, the cameras, the mask, section 3's ground and section 2 follow.
import type { HeroContext } from '../types.ts';

export function createResize(ctx: HeroContext & { lastW?: number }): () => void {
  return function resize() {
    const w = document.documentElement.clientWidth || innerWidth, h = innerHeight; if (!w || !h) return; const asp = w / h;
    const cameras = () => {
      ctx.camA.aspect = asp; ctx.camA.zoom = Math.min(1, asp * 1.25); ctx.camA.updateProjectionMatrix();   // igloo's portrait rule
      ctx.composite.C.uAspect.value = asp;
    };
    if (ctx.intro.resize(w, h, ctx.dpr, ctx.touch)) { cameras(); return; }
    ctx.lastW = w;
    ctx.renderer.setSize(w, h, false);
    ctx.composerA.c.setSize(w, h);
    cameras();
    ctx.fogGround.resize(ctx.renderer.domElement.width, ctx.renderer.domElement.height);   // device pixels, as section 2's targets
    ctx.room?.resize(ctx.renderer.domElement.width, ctx.renderer.domElement.height);   // section 4: the hall, the universe, the transition, and the section's cached layout
    ctx.mask.resize(w, h, ctx.dpr);
    ctx.section2?.resize(w, h);
    ctx.sky.onAspect(asp);
  };
}
