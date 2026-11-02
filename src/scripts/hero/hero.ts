// The WebGL island's entry (hero-architecture.md 5.3; round 3: the v11.4 prototype's start-up order with the igloo intro
// and section 2's gems filling their slots). boot.ts has already started the data fetches and loads this chunk
// dynamically; every disposer is registered with life, and life.check() after every await stops the start-up once a
// hard failure has killed the island. The 27 milestones (config/loader-weights.json) arrive in key order: import, b1 to
// b10, sky, ground, intro, scene, c1 to c9, compile, frame1, frame2.
import { PerspectiveCamera, SRGBColorSpace, Scene } from 'three';
import { DPR_CAP, POSE, S2T } from '../../config/hero.ts';
import { heroParams, type HeroParams } from '../../config/params.ts';
import { hoverNoneMQ, sceneReduced } from '../motion.ts';
import MOON_META from '../../assets/hero/moon_meta.json';
import type { Life } from './bridge/life.ts';
import { createLoaderBridge, type Milestone } from './bridge/loader.ts';
import { installHooks, installStall, stallGate } from './bridge/hooks.ts';
import type { HeroData } from './data/assets.ts';
import { textureUrls } from './data/urls.ts';
import { yieldFrame } from './util/time.ts';
import { createRenderer } from './gfx/renderer.ts';
import { loadTexture, type TexturePath } from './gfx/textures.ts';
import { buildLogoGeometry, logoFrame } from './logo/geometry.ts';
import { assignBlockColours, createLogoUniforms, resetBlockUniforms } from './logo/uniforms.ts';
import { createLogoMaterial, createLogoMesh } from './logo/material.ts';
import { createMoonGroup, createSceneFog, applyMoonWorld } from './world/moon.ts';
import { createSkyDome, PROTOTYPE_SKY } from './world/sky.ts';
import { createGround, type MoonMeta } from './world/ground.ts';
import { createStones } from './world/stones.ts';
import { bakeWindTexture } from './world/wind.ts';
import { createFogCards, createFogUniforms, placeFogCards, type FogUniforms } from './world/fog.ts';
import { createCameraRig } from './camera/rig.ts';
import { createFogGround } from './section3/ground.ts';
import { createGems } from './section2/gems.ts';
import { makeHeroComposer } from './post/composer.ts';
import { makeScrollTexture } from './post/wipeTexture.ts';
import { createComposite, createLogoMask } from './post/composite.ts';
import { createResize } from './stage/resize.ts';
import { createPointer } from './interaction/pointer.ts';
import { createLabels } from './interaction/labels.ts';
import { createLoop } from './loop.ts';
import { warmUp } from './warmup.ts';
import { createIglooIntro } from './intro/igloo.ts';
import type { RideEls } from './scroll/ride.ts';
import type { RoomDirector } from './section4/director.ts';
import type { PageScroll } from './section4/scroll.ts';
import { createSignupGround } from './section5/ground.ts';
import { ROOM_SCREENS, WIPE4_START } from '../../config/room-map.ts';
import type { HeroContext, HeroUniforms, SkyState } from './types.ts';

export interface StartOptions {
  data: HeroData;
  life: Life;
  /** the test override forced the 3D tier: no failIfMajorPerformanceCaveat (SwiftShader runs the harness) */
  forced: boolean;
  texturePath: TexturePath;
  els: RideEls;
  /** a hard failure found inside the island (a texture that fails to load) */
  onHardFail(reason: string, err?: unknown): void;
}

export async function startHero(o: StartOptions): Promise<void> {
  const { life, data, els } = o;
  const HOOKS = import.meta.env.PUBLIC_HERO_HOOKS === '1';
  const bridge = createLoaderBridge(life);
  if (HOOKS) installStall();
  // the loader hands over at its cut: until then the hero holds the plotted pose exactly
  const initiallyIntroDone = !document.documentElement.classList.contains('loading');
  // the return path (family-page.md 2.2 and 13, step 3; round 5, section 23): Back from a family page, or /#families; the loader runs in
  // full, its exit held for this island's word, and section 2 is the destination. The loader decided (loader.inline.js RET:
  // isReturnVisit()'s two conditions, and not Back to top's way home, whose sessionStorage flag to-top.ts has cleared by now), so its
  // decision is read, never made again
  const ret = !!document.getElementById('intro')?.classList.contains('ret');

  // 1. the hero chunk and pieces.json
  const pieces = await data.pieces; life.check();
  bridge.report('import');

  // 2. params (Tune's live copy in dev and staging when it is open), and the intro director (it locks the scroll now)
  const reduced = sceneReduced(), touch = hoverNoneMQ.matches;
  const tune = import.meta.env.PUBLIC_TUNE === '1' ? window.__skreedTune : undefined;
  const P: HeroParams = tune ? tune.params : heroParams(reduced);
  const dpr = Math.min(devicePixelRatio, touch ? DPR_CAP.touch : DPR_CAP.fine);
  const intro = createIglooIntro({ reduced, touch, dpr, mist: P.mist, bloom: P.bloom, hooks: HOOKS, skip: ret });

  // 3. renderer
  const canvas = document.getElementById('stage') as HTMLCanvasElement;
  const { renderer } = createRenderer(canvas, { touch, forced: o.forced, extra: intro.rendererOptions });
  life.onKill(() => { renderer.dispose(); renderer.forceContextLoss(); });

  // 4. scene A and its camera (igloo's field of view)
  const sceneA = new Scene();
  const camA = new PerspectiveCamera(30, 1, 0.1, 1200);
  const sf = createSceneFog(); sceneA.background = sf.background; sceneA.fog = sf.fog;

  // 5. the logo first, so it is warm-up group c1 (the intro's uniforms join the logo's before the material is built)
  const U = Object.assign(createLogoUniforms(P), intro.logoUniforms) as HeroUniforms;
  const logo = createLogoMesh(createLogoMaterial(U, intro.slots.logo));
  sceneA.add(logo);

  // 6. the wipe texture, filled one band per block
  const scrollTex = makeScrollTexture(512);

  // 7. ten blocks, one loader frame each
  const pose = window.SKREED_POSE ?? POSE;
  const frame = logoFrame(pieces, pose);
  const built = await buildLogoGeometry(pieces, frame, async (id) => {
    scrollTex.fill(Math.round(id * 51.2), Math.round((id + 1) * 51.2));
    await yieldFrame(); life.check();
    const m = ('b' + (id + 1)) as Milestone;
    if (HOOKS) await stallGate(m);
    bridge.report(m);
  });
  life.check();
  logo.geometry.dispose(); logo.geometry = built.geometry;
  const blocks = built.blocks;
  assignBlockColours(blocks, U); resetBlockUniforms(U);

  // 8. the moon group and the sky
  const moon = createMoonGroup(); sceneA.add(moon);
  const tex = { ok: 0 };
  const urls = textureUrls(data.cls, data.avif);
  // each texture settles a promise; the milestones are reported in key order before 'scene' (start-up step 19), so the
  // order is fixed and the warm-up's first draws upload both (architecture 17.2, build note 1)
  const texLoad = (url: string) => {
    let done!: () => void, fail!: (e: unknown) => void;
    const p = new Promise<void>((res, rej) => { done = res; fail = rej; });
    p.catch(() => {});   // routed through onHardFail
    const t = loadTexture(url, o.texturePath, () => { if (life.dead) return; tex.ok++; done(); }, (e) => { o.onHardFail('texture', e); fail(e); });
    return { t, p };
  };
  const sky = texLoad(urls.sky), skyTex = sky.t;
  skyTex.colorSpace = SRGBColorSpace; skyTex.anisotropy = 8;
  const dome = createSkyDome(skyTex, P, PROTOTYPE_SKY, intro.slots.sky);
  moon.add(dome);

  // 9. the ground texture, then the floor (with the apron) and the stones once their binaries are in
  await yieldFrame(); life.check();
  const groundL = texLoad(urls.ground), groundTex = groundL.t;
  groundTex.colorSpace = SRGBColorSpace; groundTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const [gh, sp, sc, si] = await Promise.all([data.groundH, data.stonesP, data.stonesC, data.stonesI]); life.check();
  let FOG: FogUniforms | null = null;
  const meta = MOON_META as MoonMeta;
  const ground = createGround({ meta, heights: gh, tex: groundTex, FOG: () => FOG!, P, patches: intro.slots.ground });
  moon.add(ground.mesh);
  const stones = createStones({ meta, p: sp, c: sc, i: si, patches: intro.slots.stones });
  moon.add(stones.mesh);

  // 10. the wind tile (one synchronous render)
  const windRT = bakeWindTexture(renderer);

  // 11. the fog
  FOG = createFogUniforms(windRT.texture, U.uTime, P);
  const cards = createFogCards(FOG);
  for (const c of cards) moon.add(c);
  placeFogCards(cards, ground.groundAt);

  // 12. the moon world: poses, fog 60 to 430, night background
  const rig = createCameraRig(camA);
  applyMoonWorld(sceneA, moon, rig, pose);

  // 13. section 3's ground (the last wipe's far side: the fog alone, quiz.md 5) and section 2, the gems (built after the
  // intro, one stone per frame)
  const fogGround = createFogGround(renderer, reduced);
  life.onKill(() => fogGround.dispose());
  const section2 = createGems({ renderer, reduced, touch, dpr, logo, U, blocks, camA, canvas, hooks: HOOKS });
  life.onKill(() => section2.dispose());

  // 14. the composers
  await yieldFrame(); life.check();
  const composerA = makeHeroComposer(renderer, sceneA, camA, P.bloom);

  // 15. the composite (the v11 fragment: the kept logo, the intro's flat night) and the logo mask
  const composite = createComposite(scrollTex.tex, reduced, intro.slots.composite);
  const mask = createLogoMask();
  life.onKill(() => mask.dispose());

  // section 5's ground (section5/ground.ts; Sam's picture of 2026-11-02): the flat SIGNUP_GROUND the fourth wipe cuts onto
  // and the island holds under section#signup, and the section's layout read from the DOM for the exit seam and the wrap
  const signupEl = document.getElementById('signup');
  const signup = signupEl ? createSignupGround(signupEl) : null;
  // the mark goes with the island (the poster path, a teardown), and the page is told the island is gone, so a cut's mask
  // or a seam's cover never outlives the frames that set them
  if (signup) life.onKill(() => { signup.dispose(); window.__skreedSignupFrame?.({ on: false, cover: 0, wipe: 0, pour: null }); });

  const skyState: SkyState = { dome, cls: data.cls, onAspect() {}, onFrame2() {} };   // stage 2: world/skyClass.ts
  const ctx: HeroContext = {
    renderer, dpr, life, bridge, sceneA, camA, U, FOG, blocks, frame, pieces, logo, moon, rig,
    groundAt: ground.groundAt, stoneTopAt: stones.stoneTopAt, groundMesh: ground.mesh, stonesMesh: stones.mesh, sky: skyState,
    composerA, fogGround, section2, composite, mask, scrollTex: scrollTex.tex, intro, params: P, reduced, touch, ghost: touch && !reduced, els,
    room: null, signup,
  };
  // the intro's geometry, textures and wire layers (cage, outline, numbers: warm-up groups c5 to c7, before the labels' links)
  await intro.install(ctx); life.check();

  // 16. resize (a classic scrollbar appearing or going changes the root's width without a window resize event)
  const resize = createResize(ctx);
  intro.onResize = resize;
  resize();
  addEventListener('resize', resize);
  life.onKill(() => removeEventListener('resize', resize));
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => { if (document.documentElement.clientWidth !== ctx.lastW) resize(); });
    ro.observe(document.documentElement);
    life.onKill(() => ro.disconnect());
  }

  // 17. input, state, the labels' links (added last: warm-up group c8)
  const pointer = createPointer();
  life.onKill(() => pointer.dispose());
  const labels = createLabels(els.labels, { blocks, U, logo, camA, depth: frame.DEPTH });
  sceneA.add(labels.links);

  // 18. hooks, the loader's cut, the stage observer
  const loop = createLoop(ctx, pointer, labels, initiallyIntroDone, tex);
  life.onKill(() => { loop.stop(); labels.clear(); labels.dispose(); });
  // never a scroll of the poster page (a soft poster's one-screen track, boot.ts onSoftPoster): only the visitor moves that; the followers are set all the same, for the recovery
  section2.snapTo = (screens) => { if (!document.documentElement.classList.contains('poster')) scrollTo({ top: Math.round(screens * innerHeight), behavior: 'instant' }); loop.snap(screens); };
  // section 1 in place (the section index's Home, scripts/shell/site-nav.ts, and a family page's Back to top restoring the
  // landing page, scripts/shell/to-top.ts): the loop's own jump, without the fourth wipe
  window.__skreedTop = () => { scrollTo({ top: 0, behavior: 'instant' }); loop.snap(0); ctx.room?.reset(); };
  life.onKill(() => { window.__skreedTop = undefined; });
  // a section in place (the section index, scripts/shell/site-nav.ts): the page at y at once, the followers snapped to it
  // and section 4 reset for its next lap, as the jump above does for scroll 0; a landing inside section 4 (Products, its
  // q 1) snaps the section's own followers there too, so scene 1 is fully in under the veil
  window.__skreedJump = (y) => { scrollTo({ top: y, behavior: 'instant' }); loop.snap(innerHeight > 0 ? scrollY / innerHeight : 0); ctx.room?.reset(scrollY); };
  life.onKill(() => { window.__skreedJump = undefined; });
  // the return path (family-page.md 2.2 and 13, step 3; built with round 4, section 22; the loader in full since round 5,
  // section 23): Back from a family page, or /#families, the landing is section 2 at rest with the gems live, never the
  // quiz the fragment's own scroll aimed at (nav#families stands in flow after the track). The page and both followers
  // snap to S2T.LAND now, under the loader (loader.inline.js: a return visit runs the first visit's loader, but schedules
  // its exit only after ready() below), and once the loader has its frame2 and the gems are built (or have failed, or the
  // loop is not running to build them) the island gives its word through the loader's own ready(): the exit runs at the
  // next light pass and the lift opens on the gems. frame2 still gates the lift, so the readiness model holds (hero.md 12.7)
  if (ret) {
    const snapTo = section2.snapTo;
    snapTo(S2T.LAND);
    // the third snap, at every lift (bridge/loader.ts: __introDone runs life.recover() first), the loader's own lift and a
    // soft poster's recovery on frame2 alike: section 2 in place as the fade starts, whatever the browser's own scroll to
    // the fragment did under the loader's 7.5 s
    life.onRecover(() => snapTo(S2T.LAND));
    const settle = () => {
      if (life.dead) return;
      const L = window.__skreedLoader;
      if (!L) return;
      if (!L.state().ready || !(section2.ready || section2.failed || !loop.running)) { requestAnimationFrame(settle); return; }
      snapTo(S2T.LAND); L.ready();
    };
    requestAnimationFrame(settle);
  }
  // restored from the back-forward cache with its context gone (iOS can return a cached page that way): the hero's one
  // answer to a lost context is the poster page (boot.ts, no restore attempt), reached through onHardFail
  const onShow = (e: PageTransitionEvent) => { if (e.persisted && renderer.getContext().isContextLost()) o.onHardFail('webglcontextlost after restore'); };
  addEventListener('pageshow', onShow);
  life.onKill(() => removeEventListener('pageshow', onShow));
  if (HOOKS) installHooks(ctx, loop, { skyClass: () => ctx.sky.cls });
  // section 4 (section-4-flux.md 5, "Loading", as section-4-no-hall.md 5 has it): its director chunk comes at idle once
  // the intro ends (phase 0: the cloud's pass readied, so a wrap from the top has its cover), or when the quiz or the
  // section itself comes into view (phase 1: the carousel's programs and scene 1's still, so the third wipe finds scene 1
  // drawn); products.bin and scene 1's loop follow once the section is open, the other loops on arrival (section4/director.ts)
  let roomImport: Promise<RoomDirector | null> | null = null;
  const loadDirector = () => (roomImport ??= import('./section4/director.ts').then((m) => {
    if (life.dead) return null;
    const room = m.createRoomDirector({
      renderer, avif: data.avif, reduced, dpr, snapHero: (y) => loop.snap(innerHeight > 0 ? y / innerHeight : 0),
      // a state change with no gesture (an arrival, a seam's end): the page scroll re-evaluates its capture set now
      onState: () => pageScroll?.notify(),
      // the section's layout read again (the intro ending, the document growing, a resize): its range moved, so the capture set is re-evaluated too; the glue spans below are measured fresh at every decision
      onLayout: () => pageScroll?.notify(),
      // section 5 (section-5.md 5; C6): the exit seam's trigger and the wrap's landing from the section's layout in the DOM
      // (.su-body's end and the section's top), and its readiness for the wrap's cover-out (the page's data-ready, C3)
      exitY: () => signup ? signup.exitY() : NaN,
      restY: () => signup ? signup.restY() : NaN,
      signupReady: () => !signup || signup.ready(),
    });
    ctx.room = room; life.onKill(() => room.dispose());
    room.resize(renderer.domElement.width, renderer.domElement.height);
    return room;
  }).catch((e: unknown) => { console.warn('section 4: the section chunk did not load; the stills stand in', e); document.getElementById('room')?.setAttribute('data-tier', 'poster'); return null; }));
  // the scenes' phases 1 and 2 (the director falls to the poster column itself if scene 1 cannot be drawn)
  const loadScenes = () => loadDirector().then((room) => room?.load());
  // the quiz gate (docs/specs/quiz-gate.md D1, D2, D5): section#room is hidden and data-locked until the quiz's result or
  // Skip quiz opens it (scripts/quiz/gate.ts). While locked there is no wrap from the top (canWrap, below) and no glue
  // span at its seam (docTop reads NaN for an element with no box, below); the director chunk and phase 1 still load
  // when the quiz comes into view (the stage observer and afterIntro). The unlock's event re-evaluates the page scroll
  // and starts phase 2 (products.bin, scene 1's loop); __skreedScenes tells the quiz's ride whether the scenes are in,
  // and lets it wait for them (at most 1.5 s).
  const roomEl = document.getElementById('room');
  const roomLocked = () => !!roomEl?.hasAttribute('data-locked');
  // (section 5 opens with section 4: its layout is read afresh)
  const onUnlock = () => { signup?.invalidate(); pageScroll?.notify(); void loadScenes(); };
  addEventListener('skreed:quiz-unlock', onUnlock);
  life.onKill(() => removeEventListener('skreed:quiz-unlock', onUnlock));
  // the director's load() starts its phases and returns, and it always has by the time the quiz's ride asks (the stage
  // observer, then the unlock's listener), so the hook waits a frame at a time until scene 1 and products.bin have
  // settled, or the director is gone; the ride races this against its 1.5 s (quiz-gate.md, amendment 2)
  const scenesSettled = () => life.dead || !ctx.room || ctx.room.settled();
  const untilScenes = () => new Promise<void>((res) => { const tick = () => { if (scenesSettled()) res(); else requestAnimationFrame(tick); }; tick(); });
  window.__skreedScenes = { get ready() { return !!ctx.room?.settled(); }, load: () => loadScenes().then(untilScenes) };
  life.onKill(() => { window.__skreedScenes = undefined; });
  // the page scroll (section4/scroll.ts, its own chunk, marker skreed:scroll): the glue over the three seams, the wrap from
  // the top and the carousel's gestures, from the intro's end; the director is its adapter's other side. One viewport for
  // the spans is a probe's 100svh (the track is in svh, the hero's map in innerHeights)
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
  document.body.append(probe); life.onKill(() => probe.remove());
  // an element with no box (section#room hidden behind the quiz gate) reads NaN, and its span is dropped below: a display:
  // none element's rect is all zeros and would read as the current scroll position, a span the glue would settle into
  const docTop = (id: string) => { const el = document.getElementById(id); return el && el.getClientRects().length ? el.getBoundingClientRect().top + scrollY : NaN; };
  const svh = () => probe.offsetHeight || innerHeight;
  let pageScroll: PageScroll | null = null, scrollImport: Promise<void> | null = null;
  const startScroll = () => (scrollImport ??= import('./section4/scroll.ts').then((m) => {
    if (life.dead) return;
    pageScroll = m.createPageScroll({
      reduced, hooks: HOOKS, svh, settleMs: () => tune?.room?.params.snapMs,
      // the four spans (section-4-flux.md 5 "Glue spans"; section-5.md 2 "The elastic glue"): the first wipe, the quiz seam,
      // section 4's seam, and the fourth wipe (the room's top plus 12.8 and 13.8 of its screens, which are the probe's 100svh)
      spans: () => {
        const vh = innerHeight, one = svh(), quiz = docTop('find'), top = docTop('room');
        return [{ start: S2T.PULL * vh, end: S2T.W1END * vh }, { start: Math.min(S2T.W2 * vh, quiz - vh), end: quiz }, { start: top - one, end: top + one }, { start: top + WIPE4_START * one, end: top + (WIPE4_START + ROOM_SCREENS.out) * one }].filter((x) => Number.isFinite(x.start) && Number.isFinite(x.end));
      },
      room: {
        inRange: () => !!ctx.room?.inRange(), edge: (d) => !!ctx.room?.edge(d), step: (d) => !!ctx.room?.stepScene(d),
        wrap: () => { void loadDirector().then((r) => r?.wrap()); },
        canWrap: () => loop.state.introDone && !ctx.room?.lock() && !roomLocked(), lock: () => !!ctx.room?.lock(), busy: () => !!ctx.room?.busy(),
        carried: () => ctx.room?.carried(),
      },
    });
    life.onKill(() => pageScroll?.dispose());
  }).catch((e: unknown) => { console.warn('section 4: the page scroll chunk did not load', e); }));
  const idle = (fn: () => void) => { if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 2000 }); else setTimeout(fn, 2000); };
  let introOver = false;
  const afterIntro = () => { if (introOver) return; introOver = true; void startScroll(); idle(() => { if (!life.dead) void loadDirector().then((r) => r?.warmCloud()); }); };
  if (HOOKS) {
    const extra = () => ctx.room as unknown as import('./section4/director.ts').RoomHooks | null;
    window.__s4 = {
      state: () => ctx.room?.hooks() ?? null,
      scene: (i) => extra()?.scene(i) ?? false,
      step: (dir) => ctx.room?.stepScene(dir) ?? false,
      wrap: () => { void loadDirector().then((r) => r?.wrap()); },
      glue: (on) => pageScroll?.glue(on),
      lights: (o) => extra()?.lights(o) ?? null,
      shade: (dark, height, solid) => extra()?.shade(dark, height, solid),
      get ready() { return !!ctx.room?.settled(); },
    };
    // section 5's ground (section5/ground.ts): this frame's mode, the mark, the section's layout, the exit's trigger and
    // the rest, the page's readiness, the composite's draws and holds; and the bytes it writes at canvas points (device
    // px from the bottom left) on its next draw, read back before the frame is shown
    if (signup && signupEl) {
      window.__skreedGround = {
        state: () => ({ mode: signup.stats.mode, draws: signup.stats.draws, held: signup.stats.held, mark: signupEl.dataset.ground ?? null, ready: signup.ready(), inView: signup.inView(), layout: signup.layout(), exitY: signup.exitY(), restY: signup.restY() }),
        sample: (pts) => new Promise<number[][]>((res) => { signup.probe = { pts, done: res }; }),
      };
      life.onKill(() => { window.__skreedGround = undefined; });
    }
  }
  bridge.onIntroDone(() => { loop.introDone(); afterIntro(); });
  if (initiallyIntroDone) afterIntro();
  if (import.meta.env.PUBLIC_TUNE === '1' && tune) {
    const apply = () => {
      U.uGlow.value = P.glow; U.uRest.value = P.rest; U.uTint.value = P.tint; U.uGrad.value = P.grad; U.uTex.value = P.tex; U.uRelief.value = P.relief; U.uKey.value = P.key;
      composerA.b.strength = P.bloom;
      const F = ctx.FOG;
      F.uDensity.value = P.fog; F.uFogBright.value = P.fogBright; F.uSpeed.value = P.fogSpeed; F.uTileMul.value = P.fogSize; F.uTopFade.value = P.fogHug;
      F.uGMAmount.value = P.mist; F.uGMVelX.value = 0.25 * P.mistSpeed; F.uGMVelZ.value = 0.3 * P.mistSpeed;
      const su = dome.material.uniforms; su.uSkyGain.value = P.skyGain; su.uHue.value = P.hue; su.uHueScale.value = P.hueScale;
    };
    const off = tune.subscribe(apply);
    life.onKill(() => { off(); });
    const onGhost = (e: Event) => { ctx.ghost = !!(e as CustomEvent<boolean>).detail; };
    addEventListener('skreed:tune-ghost', onGhost);
    life.onKill(() => removeEventListener('skreed:tune-ghost', onGhost));
  }
  // The loop runs while the track, section 3 (section#find, the quiz over the fog ground, quiz.md 5), section 4 or section 5
  // (section#signup over its flat ground, held: section5/ground.ts) is in view; once all have left the viewport it stops and
  // the canvas hides (architecture 7.5, amended for sections 3 to 5). It restarts when any returns.
  let compiled = false, inView = true;
  const trackEl = document.getElementById('track');
  const watched = [trackEl, document.getElementById('find'), document.getElementById('room'), signupEl].filter((el): el is HTMLElement => !!el);
  if (watched.length && 'IntersectionObserver' in window) {
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) { seen.set(e.target, e.isIntersecting); if (e.isIntersecting && e.target !== trackEl) void loadScenes(); }
      inView = [...seen.values()].some(Boolean);
      if (!compiled) return;
      if (inView) { canvas.style.removeProperty('visibility'); loop.start(); } else { loop.stop(); canvas.style.visibility = 'hidden'; }
    });
    for (const el of watched) io.observe(el);
    life.onKill(() => { io.disconnect(); canvas.style.removeProperty('visibility'); });
  }

  // 19. the textures, in key order (while one is pending the loader reads it as network), then the intro, then the scene
  await sky.p; life.check(); bridge.report('sky');
  await groundL.p; life.check(); bridge.report('ground');
  bridge.report('intro');
  if (HOOKS) await stallGate('scene');
  bridge.report('scene'); await yieldFrame(); life.check();

  // 20. warm-up: compile, groups c1 to c8, composers c9
  await warmUp(ctx, resize, HOOKS ? stallGate : null);
  life.check();
  intro.arm();   // the armed frames: real full-size frames of t = 0 under the loader, or the end state when skipped

  // 21. compiled; frame1 and frame2 follow from the intro's readiness (its GPU fences)
  if (HOOKS) await stallGate('compile');
  bridge.report('compile');
  compiled = true;
  if (inView) loop.start(); else canvas.style.visibility = 'hidden';
}
