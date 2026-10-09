// The WebGL island's entry (hero-architecture.md 5.3): the prototype's module (template.html lines 260 to 1400) in its
// start-up order, which the loader's milestones and weights depend on. boot.ts has already started the data fetches and
// loads this chunk dynamically; every disposer is registered with life, and life.check() after every await stops the
// start-up once a hard failure has killed the island.
import { PerspectiveCamera, SRGBColorSpace, Scene } from 'three';
import { POSE } from '../../config/hero.ts';
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
import { createPlaceholderWall } from './section2/placeholderWall.ts';
import { makeHeroComposer } from './post/composer.ts';
import { makeScrollTexture } from './post/wipeTexture.ts';
import { createComposite } from './post/composite.ts';
import { createResize } from './stage/resize.ts';
import { createPointer } from './interaction/pointer.ts';
import { createLabels } from './interaction/labels.ts';
import { createLoop } from './loop.ts';
import { warmUp } from './warmup.ts';
import { NO_INTRO } from './intro/none.ts';
import type { RideEls } from './scroll/ride.ts';
import type { HeroContext, SkyState } from './types.ts';

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

  // 1. the hero chunk and pieces.json
  const pieces = await data.pieces; life.check();
  bridge.report('import');

  // 2. params (Tune's live copy in dev and staging when it is open)
  const reduced = sceneReduced(), touch = hoverNoneMQ.matches;
  const tune = import.meta.env.PUBLIC_TUNE === '1' ? window.__skreedTune : undefined;
  const P: HeroParams = tune ? tune.params : heroParams(reduced);
  const intro = NO_INTRO;

  // 3. renderer
  const canvas = document.getElementById('stage') as HTMLCanvasElement;
  const { renderer, dpr } = createRenderer(canvas, { touch, forced: o.forced, extra: intro.rendererOptions });
  life.onKill(() => { renderer.dispose(); renderer.forceContextLoss(); });

  // 4. scene A and its camera (igloo's field of view)
  const sceneA = new Scene();
  const camA = new PerspectiveCamera(30, 1, 0.1, 1200);
  const sf = createSceneFog(); sceneA.background = sf.background; sceneA.fog = sf.fog;

  // 5. the logo first, so it is warm-up group c1
  const U = createLogoUniforms(P);
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

  // 9. the ground texture, then the floor and the stones once their binaries are in
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

  // 13. section 2 (v9.9: the placeholder Wall)
  const section2 = createPlaceholderWall();
  life.onKill(() => section2.dispose());

  // 14. the composers
  await yieldFrame(); life.check();
  const composerA = makeHeroComposer(renderer, sceneA, camA, P.bloom);
  section2.makeComposer(renderer);

  // 15. the composite
  const composite = createComposite(scrollTex.tex, reduced, intro.slots.composite);

  const skyState: SkyState = { dome, cls: data.cls, onAspect() {}, onFrame2() {} };   // stage 2: world/skyClass.ts
  const ctx: HeroContext = {
    renderer, dpr, life, bridge, sceneA, camA, U, FOG, blocks, frame, logo, moon, rig,
    groundAt: ground.groundAt, stoneTopAt: stones.stoneTopAt, sky: skyState,
    composerA, section2, composite, intro, params: P, reduced, touch, ghost: touch && !reduced, els,
  };
  section2.install(ctx);

  // 16. resize
  const resize = createResize(ctx);
  resize();
  addEventListener('resize', resize);
  life.onKill(() => removeEventListener('resize', resize));

  // 17. input, state, the labels' links (added last: warm-up group c5)
  const pointer = createPointer();
  life.onKill(() => pointer.dispose());
  const labels = createLabels(els.labels, { blocks, U, logo, camA, depth: frame.DEPTH });
  sceneA.add(labels.links);

  // 18. hooks, the loader's cut, the stage observer
  const loop = createLoop(ctx, pointer, labels, initiallyIntroDone, tex);
  life.onKill(() => { loop.stop(); labels.clear(); labels.dispose(); });
  if (HOOKS) installHooks(ctx, loop, { skyClass: () => ctx.sky.cls });
  bridge.onIntroDone(() => loop.introDone());
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
  // The track leaving the viewport (a section follows it) stops the loop and hides the canvas: no WebGL from section 3
  // on (architecture 7.5). It restarts when the track returns.
  let compiled = false, inView = true;
  const track = document.getElementById('track');
  if (track && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (!compiled) return;
      if (inView) { canvas.style.removeProperty('visibility'); loop.start(); } else { loop.stop(); canvas.style.visibility = 'hidden'; }
    });
    io.observe(track);
    life.onKill(() => { io.disconnect(); canvas.style.removeProperty('visibility'); });
  }
  intro.install(ctx);

  // the textures, in key order: while one is pending the loader reads it as network ('Slow connection')
  await sky.p; life.check(); bridge.report('sky');
  await groundL.p; life.check(); bridge.report('ground');

  // 19. the scene is built
  if (HOOKS) await stallGate('scene');
  bridge.report('scene'); await yieldFrame(); life.check();

  // 20. warm-up: compile, groups c1 to c5, composer c6
  await warmUp(ctx, resize, HOOKS ? stallGate : null);
  life.check();

  // 21. compiled; frame1 and frame2 follow on the first two frames with both textures loaded
  if (HOOKS) await stallGate('compile');
  bridge.report('compile');
  compiled = true;
  if (inView) loop.start(); else canvas.style.visibility = 'hidden';
}
