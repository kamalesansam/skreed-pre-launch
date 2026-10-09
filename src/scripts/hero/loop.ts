// The frame (prototype lines 1273 to 1380), in the order of hero-architecture.md 5.4 (F1 to F16). It owns t, ratio, live
// and tHero0. requestAnimationFrame is called first, so one bad frame can never stop the loop.
import { ACESFilmicToneMapping, Clock, NoToneMapping, Plane, Raycaster, Vector3, type Vector2 } from 'three';
import { clamp01, lerpFPS } from './util/math.ts';
import { updateBlocks } from './logo/motion.ts';
import { updateFogLogoRect } from './world/fog.ts';
import { createScrollFollower, mapScroll } from './scroll/scrollMap.ts';
import { rideCopy } from './scroll/ride.ts';
import { ghostTarget, type Pointer } from './interaction/pointer.ts';
import type { Labels } from './interaction/labels.ts';
import type { FrameCtx, HeroContext } from './types.ts';

export interface LoopState {
  t: number; ratio: number; live: number;
  mouse: Vector3; scroll: { a: number; b: number };
  introDone: boolean;
  /** frames reported since both textures loaded (frame step F15) */
  texFrames: number;
}

export interface Loop { state: LoopState; start(): void; stop(): void; readonly running: boolean; introDone(): void }

/** tex.ok counts the textures loaded (0 to 2); the first two frames after both report frame1 and frame2. */
export function createLoop(ctx: HeroContext, pointer: Pointer, labels: Labels, initiallyIntroDone: boolean, tex: { ok: number }): Loop {
  const { renderer, camA, U, blocks, logo, params: P, reduced, composerA, section2, composite, intro, els } = ctx;
  const clock = new Clock();
  const ray = new Raycaster(), plane = new Plane(new Vector3(0, 0, 1), 0), hit = new Vector3();
  const st: LoopState = { t: 0, ratio: 1, live: 0, mouse: new Vector3(99, 99, 0), scroll: createScrollFollower(), introDone: initiallyIntroDone, texFrames: 0 };
  const scroll = st.scroll as ReturnType<typeof createScrollFollower>;
  let tHero0 = 0, raf = 0, running = false;
  const C = composite.C;

  function frame() {
    raf = requestAnimationFrame(frame);                                          // F1
    if (import.meta.env.PUBLIC_HERO_HOOKS === '1') window.__skreedFrame = (window.__skreedFrame ?? 0) + 1;
    window.__heroStarted = true;
    const freeze = import.meta.env.PUBLIC_HERO_HOOKS === '1' && !!window.__skreedFreeze;
    const dt = freeze ? (clock.getDelta(), 0) : Math.min(clock.getDelta(), 1 / 12);   // F2
    st.t += dt; st.ratio = Math.min(5, dt / (1 / 60));
    const t = st.t, ratio = st.ratio;
    U.uTime.value = reduced ? 0 : t;                                             // F3
    const iv = intro.update(t, dt, ctx);
    st.live = iv?.live ?? (st.introDone ? (reduced ? 1 : 1 - Math.pow(1 - clamp01((t - tHero0) / 2), 3)) : 0);   // F4
    const live = st.live;
    logo.position.y = reduced ? 0 : Math.sin(t * 0.7) * 0.07 * live;            // F5
    const pr = innerHeight > 0 ? scrollY / innerHeight : 0;                       // F6
    scroll.update(pr, ratio);
    const { s, tp, heroOn } = mapScroll(scroll.b, reduced);

    // F7: pointer target: real pointer, or a slow sweep on touch when idle
    let target: Vector2 | null = null;
    if (pointer.active) target = pointer.ndc;
    else if (ctx.ghost && live >= 1 && performance.now() - pointer.lastInput > 2500) target = ghostTarget(t);
    const mouse = st.mouse;
    if (target) { ray.setFromCamera(target, camA); if (ray.ray.intersectPlane(plane, hit)) { mouse.x = lerpFPS(mouse.x, hit.x, P.mouse, ratio); mouse.y = lerpFPS(mouse.y, hit.y, P.mouse, ratio); } }
    else { mouse.x = lerpFPS(mouse.x, 99, P.mouse * 0.25, ratio); mouse.y = lerpFPS(mouse.y, 99, P.mouse * 0.25, ratio); }

    updateBlocks(blocks, U, P, { t, ratio, live, heroOn, mouse, logoY: logo.position.y, floor: ctx.moon.visible, groundAt: ctx.groundAt, stoneTopAt: ctx.stoneTopAt });   // F8
    logo.updateMatrixWorld();                                                    // F9
    labels.update(dt, !!target && heroOn > 0.5 && tp <= 0 && live > 0.5, mouse); // F10
    if (els.labels) els.labels.style.visibility = tp > 0 ? 'hidden' : 'visible';

    ctx.rig.update({ s, t, ratio, live, reduced, pointerActive: pointer.active, target, follow: ctx.sky.dome });   // F11

    const f: FrameCtx = { t, dt, ratio, live, b: scroll.b, s, tp, heroOn, reduced };
    section2.update(f);                                                          // F12
    if (ctx.moon.visible) updateFogLogoRect(ctx.FOG, camA, logo.position.y, renderer);   // F13

    // F14: render the visible scenes, then the composite
    if (tp < 1) composerA.c.render(dt);
    if (tp > 0) { renderer.toneMapping = NoToneMapping; section2.composer!.c.render(dt); renderer.toneMapping = ACESFilmicToneMapping; }   // swatches stay true to the catalog
    C.tA.value = composerA.c.readBuffer.texture; C.tB.value = section2.composer!.c.readBuffer.texture;
    C.uProgress.value = tp; C.uNoiseOff.value.set(Math.random(), Math.random());
    renderer.setRenderTarget(null); renderer.render(composite.scene, composite.camera);
    if (intro.reportFrames) intro.reportFrames(f, (m) => ctx.bridge.report(m));   // F15
    else if (tex.ok === 2 && st.texFrames < 2) { st.texFrames++; const m = st.texFrames === 1 ? 'frame1' : 'frame2'; ctx.bridge.report(m); if (m === 'frame2') ctx.sky.onFrame2(); }

    rideCopy(els, tp, innerWidth / innerHeight);                                 // F16
  }

  return {
    state: st,
    get running() { return running; },
    start() { if (running) return; running = true; raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    introDone() {
      if (st.introDone) return; st.introDone = true; tHero0 = st.t; intro.start(st.t);
      const w = window;
      if (w.__skreedLogo) w.__skreedLogo.intro(0.25); else (w.__skreedLogoQ ||= []).push(['intro', 0.25]);
    },
  };
}
