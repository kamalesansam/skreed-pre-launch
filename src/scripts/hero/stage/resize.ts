// Resize (prototype v11.4 template.html resize(); hero-architecture.md 5.6). The width is the root's clientWidth (the
// fixed canvas's width, without a classic scrollbar). During the shot a small viewport change moves only the camera (the
// intro director decides); otherwise the renderer, the composers, the cameras, the mask, section 3's ground, section 4, section 5's layout and section 2 follow.
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
    ctx.room?.resize(ctx.renderer.domElement.width, ctx.renderer.domElement.height);   // section 4: the carousel, the fade hand-off, and the section's cached layout
    ctx.signup?.invalidate();   // section 5: its layout read afresh on the next frame (the ground's one texel needs no resize)
    ctx.mask.resize(w, h, ctx.dpr);
    ctx.section2?.resize(w, h);
    ctx.sky.onAspect(asp);
  };
}
