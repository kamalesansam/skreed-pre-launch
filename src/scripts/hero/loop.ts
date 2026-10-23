// The frame (prototype v11.4 template.html step(); hero-architecture.md 5.4, F1 to F16, with the intro's clock and the
// section 2 hand-over). It owns t, ratio and the scroll followers; the intro director owns live, breath and the crane.
// requestAnimationFrame is called first, so one bad frame can never stop the loop.
import { Clock, Color, Plane, Raycaster, Vector3, type Scene, type Vector2 } from 'three';
import { lerpFPS } from './util/math.ts';
import { updateBlocks } from './logo/motion.ts';
import { updateFogLogoRect } from './world/fog.ts';
import { createScrollFollower, mapScroll, PULL } from './scroll/scrollMap.ts';
import { rideCopy } from './scroll/ride.ts';
import { ghostTarget, type Pointer } from './interaction/pointer.ts';
import type { Labels } from './interaction/labels.ts';
import type { HeroContext } from './types.ts';

export interface LoopState {
  t: number; ratio: number; live: number;
  mouse: Vector3; scroll: { a: number; b: number };
  introDone: boolean;
}

export interface Loop {
  state: LoopState; start(): void; stop(): void; readonly running: boolean;
  introDone(): void;
  /** both scroll followers at once (the keyboard's jump to section 2, the test hook) */
  snap(v: number): void;
  /** one frame now, outside requestAnimationFrame (the intro's seek hook) */
  stepNow(): void;
}

/** tex.ok counts the textures loaded (0 to 2); the intro director turns them into frame1 and frame2. */
export function createLoop(ctx: HeroContext, pointer: Pointer, labels: Labels, initiallyIntroDone: boolean, tex: { ok: number }): Loop {
  const { renderer, camA, U, blocks, logo, params: P, reduced, composerA, fogGround, composite, intro, els, mask } = ctx;
  const S2 = ctx.section2;
  const clock = new Clock();
  let s2Rest = -1;   // the time the second wipe completed, or -1 while section 2 is in play
  const ray = new Raycaster(), plane = new Plane(new Vector3(0, 0, 1), 0), hit = new Vector3();
  const scroll = createScrollFollower();
  const st: LoopState = { t: 0, ratio: 1, live: 0, mouse: new Vector3(99, 99, 0), scroll, introDone: initiallyIntroDone };
  let raf = 0, running = false;
  const C = composite.C;
  const uMask = (U as Record<string, { value: unknown }>).uMask as { value: number } | undefined;
  const _cc = new Color();

  function step() {
    if (import.meta.env.PUBLIC_HERO_HOOKS === '1') window.__skreedFrame = (window.__skreedFrame ?? 0) + 1;
    window.__heroStarted = true;
    const now = performance.now(), raw = clock.getDelta();                        // F2
    const frozen = (import.meta.env.PUBLIC_HERO_HOOKS === '1' && !!window.__skreedFreeze) || intro.paused;   // freeze: test hook for pixel-diff measurements; a seek pins the clocks
    // a tick while frozen (hooks builds): one frame's worth of clock, handed in by the flash check's step capture, consumed here
    let tick = 0;
    if (import.meta.env.PUBLIC_HERO_HOOKS === '1' && frozen && window.__skreedTick) { tick = Math.min(window.__skreedTick, 1 / 12); window.__skreedTick = 0; }
    const dt = frozen ? tick : Math.min(raw, 1 / 12);
    st.t += dt; st.ratio = Math.min(5, dt / (1 / 60));
    const t = st.t, ratio = st.ratio;
    const iv = intro.frame({ t, dt, raw, frozen, now, texOk: tex.ok }, ctx);      // the intro's clock, timeline, fences and readiness
    U.uTime.value = reduced ? 0 : t;                                             // F3
    st.live = iv.live;                                                           // F4
    const live = st.live;
    logo.position.y = reduced ? 0 : Math.sin(t * 0.7) * 0.07 * live;            // F5
    const pr = innerHeight > 0 ? scrollY / innerHeight : 0;                       // F6
    scroll.update(pr, ratio);
    if (S2 && !S2.started && intro.done) void S2.build();
    if (S2 && !S2.ready && !S2.failed && scroll.b > PULL) scroll.b = PULL;   // section 2 is still being built: the wipe waits
    // section 4 (section-4-flux.md 5): its own followers first; its exit jumps the page to scroll 0 under the seam's cloud,
    // so the hero's rest pose is the page's own at 0 and no loop screen holds the followers (X-15)
    const room = ctx.room; room?.begin(ratio);
    const hb = scroll.b;
    const { s, tp, tp2, heroOn } = mapScroll(hb, reduced);

    // F7: pointer target: real pointer, or a slow sweep on touch when idle
    let target: Vector2 | null = null;
    if (pointer.active) target = pointer.ndc;
    else if (ctx.ghost && live >= 1 && performance.now() - pointer.lastInput > 2500) target = ghostTarget(t);
    const mouse = st.mouse;
    if (target) { ray.setFromCamera(target, camA); if (ray.ray.intersectPlane(plane, hit)) { mouse.x = lerpFPS(mouse.x, hit.x, P.mouse, ratio); mouse.y = lerpFPS(mouse.y, hit.y, P.mouse, ratio); } }
    else { mouse.x = lerpFPS(mouse.x, 99, P.mouse * 0.25, ratio); mouse.y = lerpFPS(mouse.y, 99, P.mouse * 0.25, ratio); }

    updateBlocks(blocks, U, P, { t, ratio, live, heroOn, mouse, logoY: logo.position.y, floor: ctx.moon.visible, groundAt: ctx.groundAt, stoneTopAt: ctx.stoneTopAt, breath: iv.breath, paused: intro.paused });   // F8
    if (S2) for (let i = 0; i < blocks.length; i++) if (S2.hidden(i, hb)) U.uOff.value[i].set(0, -500, 0);   // a block that has left for section 2 is gone from the logo
    logo.updateMatrixWorld();                                                    // F9
    labels.update(dt, !!target && heroOn > 0.5 && tp <= 0 && live > 0.5 && iv.breath >= 1, mouse);   // F10: igloo's labels wait for the breath gate
    if (els.labels) els.labels.style.visibility = tp > 0 ? 'hidden' : 'visible';

    ctx.rig.update({ s, t, ratio, live, reduced, b: hb, curve: true, crane: iv.crane, pointerActive: pointer.active, target, follow: ctx.sky.dome });   // F11
    // F12; past the second wipe section 2 keeps updating for half a second (its labels fade out over 0.2 s and the hover is dropped), then rests under the quiz
    if (tp2 < 1) s2Rest = -1; else if (s2Rest < 0) s2Rest = t;
    if (S2 && (s2Rest < 0 || t - s2Rest < 0.5)) S2.update(hb, tp, tp2, t, dt);
    fogGround.update(hb, t);
    if (ctx.moon.visible) updateFogLogoRect(ctx.FOG, camA, logo.position.y, renderer);   // F13

    // section 4 (docs/specs/section-4.md 5, section-4-flux.md 5, section4/director.ts): the hall, the bubble or the carousel
    // into their own targets, and the plan for the composite: the third wipe from the fog, the section's frame, a seam's cover
    const plan = room ? room.step({ t, dt, ratio, pointer, touch: ctx.touch, mouseRate: P.mouse, fog: fogGround.out }) : null;
    const roomOn = !!plan && plan.on && !!plan.tex, cover = plan?.cover ?? 0;

    // F14: hero, then section 2 (its own targets), then section 3's ground (the fog alone); the composite wipes hero to
    // section 2, then section 2 to the ground, which stays the whole frame under section 3 (quiz.md 5)
    if (!iv.hold) {
      const s2on = !!S2 && S2.ready && tp > 0 && tp2 < 1, keep = s2on && tp2 <= 0 && S2!.logoLeft(), groundOn = (tp2 > 0 || (tp > 0 && !(S2 && S2.ready))) && !(roomOn && !plan!.groundNeeded);
      ctx.moon.visible = tp < 1;   // once the first wipe has covered the scene only the logo is seen: the ground and sky are skipped
      if (tp < 1 || keep) composerA.c.render(dt);
      if (s2on) S2!.render();
      if (groundOn) fogGround.render();
      if (keep && uMask) { const pc = renderer.getClearColor(_cc), pa = renderer.getClearAlpha(); renderer.setClearColor(0x000000, 1); uMask.value = 1;
        renderer.setRenderTarget(mask.rt); renderer.render(logo as unknown as Scene, camA); uMask.value = 0; renderer.setClearColor(pc, pa); }
      const groundTex = fogGround.out;
      if (tp2 > 0) { C.tA.value = S2!.out; C.tB.value = groundTex; C.uProgress.value = tp2; C.uParA.value = 0; }   // section 2 holds still under the cut, as the hero does in the first wipe; the same fog is on both sides
      else { C.tA.value = composerA.c.readBuffer.texture; C.tB.value = s2on ? S2!.out : groundTex; C.uProgress.value = tp; C.uParA.value = s2on ? 0 : 1; }
      if (roomOn) {
        const rt = plan!.tex;
        // the third wipe: the fog holds still under the cut and the hall slides in; past it the section is the whole frame
        if (plan!.wipeIn < 1) { C.tA.value = groundTex; C.tB.value = rt; C.uProgress.value = plan!.wipeIn; C.uParA.value = 0; }
        else { C.tA.value = rt; C.tB.value = rt; C.uProgress.value = 0; }
      }
      // a seam of section 4: its cloud over whatever the frame is (the section's frame, or the hero at rest after the jump)
      C.uCover.value = cover; C.tCloud.value = cover > 0 ? plan!.cloud : null;
      C.tH.value = composerA.c.readBuffer.texture; C.tM.value = mask.rt.texture; C.tS.value = s2on ? S2!.out : mask.black; C.uKeep.value = keep ? 1 : 0;
      C.uNoiseOff.value.set(Math.random(), Math.random());
      renderer.setRenderTarget(null); renderer.render(composite.scene, composite.camera);
      intro.afterRender(now, ctx, tex.ok);                                       // F15
    }
    rideCopy(els, tp, innerWidth / innerHeight, !!S2 && S2.ready);               // F16
    // the logotype over the section (after the ride's own write, so this one stands): Pearl on the hall, the front scene's
    // tone over the scenes, Urban Slate under a seam's cloud, after the exit's jump too, when the section is off and the
    // cloud thins over the hero at rest
    if (plan && (cover > 0 || (roomOn && plan.wipeIn >= 0.5))) window.__skreedLogo?.setTone(plan.toneDark);
  }
  function frame() {
    raf = requestAnimationFrame(frame);                                          // F1: the request first, so one bad frame can never stop the loop
    step();
  }

  return {
    state: st,
    get running() { return running; },
    start() { if (running) return; running = true; raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    introDone() { if (st.introDone) return; st.introDone = true; intro.start(st.t); },
    snap(v) { scroll.snap(v); },
    stepNow() { step(); },
  };
}
