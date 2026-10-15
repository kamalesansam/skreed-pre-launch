// Resize (prototype v11.4 template.html resize(); hero-architecture.md 5.6). The width is the root's clientWidth (the
// fixed canvas's width, without a classic scrollbar). During the shot a small viewport change moves only the camera (the
// intro director decides); otherwise the renderer, the composers, the cameras, the mask, the Wall and section 2 follow.
import { PORTRAIT_ASPECT } from '../../../config/hero.ts';
import type { HeroContext } from '../types.ts';

export function createResize(ctx: HeroContext & { lastW?: number }): () => void {
  return function resize() {
    const w = document.documentElement.clientWidth || innerWidth, h = innerHeight; if (!w || !h) return; const asp = w / h;
    const cameras = () => {
      ctx.camA.aspect = asp; ctx.camA.zoom = Math.min(1, asp * 1.25); ctx.camA.updateProjectionMatrix();   // igloo's portrait rule
      ctx.composite.C.uAspect.value = asp;
    };
    if (ctx.intro.resize(w, h, ctx.dpr, ctx.touch)) { cameras(); ctx.wall.camera.aspect = asp; ctx.wall.camera.updateProjectionMatrix(); return; }
    ctx.lastW = w;
    ctx.renderer.setSize(w, h, false);
    ctx.composerA.c.setSize(w, h);
    cameras();
    ctx.wall.resize(w, h, asp, asp < PORTRAIT_ASPECT);
    ctx.mask.resize(w, h, ctx.dpr);
    ctx.section2?.resize(w, h);
    ctx.sky.onAspect(asp);
  };
}
