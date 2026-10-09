# Hero on the real stack: architecture

Written 2026-10-09 by the architect step for `docs/specs/hero.md`.

Binding: `CLAUDE.md`, `docs/CHECKLIST.md`, `docs/00-IDEATION.md`, `docs/brand/type-system.md`, `DESIGN.md`.

Sources:
- `prototypes/hero-v9/template.html` (v9.9). Line numbers below refer to this file.
- The four reader reports of 2026-10-09: the 3D inventory, the shell inventory, the stack facts, and the asset and bundle probe.

Their scratch work lives in `/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad/port/`, written `SCR/port/` below. Build step 1 copies what the repo needs, because the scratchpad does not outlive the session.

## 1. Purpose and principles

1. **Parity first.** The port reproduces v9.9 exactly where the prototype is deterministic. Every shader string, constant, start-up step and per-frame step keeps its order (sections 5.3 and 5.4). Improvements that change pixels or timing are listed separately and each is gated by a pixel diff.
2. **Two stages** (spec D7):
   - **Stage 1** ships the prototype's asset files byte for byte and must give identical frames.
   - **Stage 2** swaps in the measured encodes, the sky crops and the posters, under the shipping thresholds.
3. **Poster first.** A raster poster is the LCP element and the fallback for every tier and failure. The WebGL island loads behind it, only when the device and the user's settings allow.
4. **Clean slots.** The igloo intro (v10), section 2 (the rocks) and section 3 (the Wall) plug into typed interfaces. None of them is ported here.
5. **Nothing dev-only ships.** Tune and the test hooks exist only in dev, test and staging builds.

## 2. Versions (exact pins)

| Package | Version | Why |
|---|---|---|
| `astro` | 7.3.8 | stack decision; needs Node 22.12 or later (environment has 22.22.0); bundles Vite 8 |
| `three` | 0.165.0 | parity with the prototype (section 9) |
| `wrangler` (dev) | 4.149.0 | Workers + Static Assets, `_headers`, `wrangler dev` for local header tests |
| `@playwright/test` (dev) | 1.56.1 | matches the Chromium build already in `/opt/pw-browsers` (chromium-1194) |
| `lighthouse` (dev) | 13.5.0 | C4 |
| `typescript` (dev) | exact version pinned at scaffold | strict mode, `erasableSyntaxOnly`, so `node --test` runs the `.ts` unit tests directly |
| Python tools (scripts only) | Pillow 12.3 (libavif 1.4.2, libwebp 1.6.0), numpy | the texture and poster encodes and the image compare; the same encoder versions produced the measured sizes |

Not installed for this section:
- `gsap` 3.15.0 and `lenis` 1.3.26: the hero uses neither (spec D6). They arrive with section 3.
- `@astrojs/cloudflare` 14.3.4: even for a static site it adds a SESSION KV binding and an IMAGES binding that need provisioning on Sam's account. An assets-only Worker serves `dist/` directly. The adapter, or a hand-written Worker, is added with `/api/*` in the Reserve section.
- `@astrojs/sitemap` 3.7.4: arrives with the site-essentials pass (G8).

Every version is exact in `package.json`, with no caret (security checklist row 18).

## 3. Repository layout

```
/
├─ DESIGN.md                      tokens and rules; read before any UI change
├─ astro.config.mjs               output 'static', site https://skreed.in, inlineStylesheets 'always', assetsInlineLimit 0
├─ wrangler.jsonc                 assets-only Worker (section 12)
├─ package.json                   exact pins, scripts (section 14)
├─ tsconfig.json                  strict, erasableSyntaxOnly, allowImportingTsExtensions
├─ public/
│  ├─ fonts/                      the four WOFF2 files (exist; served at /fonts/)
│  └─ _headers                    static security and cache headers; scripts/csp.mjs appends the CSP into dist/_headers
├─ src/
│  ├─ env.d.ts                    typed window globals (prod contract and hooks)
│  ├─ pages/index.astro           the hero page
│  ├─ layouts/Base.astro          <html lang="en-IN">, meta, canonical, preloads, staging noindex
│  ├─ styles/
│  │  ├─ tokens.css               generated from DESIGN.md's token block
│  │  ├─ fonts.css                @font-face and fallback faces, verbatim from type-system.md and scripts/fonts/manifest.txt
│  │  └─ shell.css                hero shell, loader, countdown, cue, logotype, poster, poster-tier layout
│  ├─ config/
│  │  ├─ site.ts                  SITE_URL, LAUNCH_ISO '2026-11-01T00:00:00+05:30'
│  │  ├─ hero.ts                  POSE, MOON_POSE, SCROLL_MAP, TRACK_SVH 460, PORTRAIT_ASPECT 0.9, DPR caps, tier rules, REDUCED_MOTION_TIER
│  │  ├─ params.ts                HERO_PARAMS (66 keys, locked values applied), heroParams(reduced)
│  │  ├─ loader-weights.json      WT, re-measured on fetched assets (section 7.4)
│  │  ├─ shades.gen.ts            generated from docs/data/shades-240.json by id
│  │  └─ tokens.ts                colour constants the canvas needs (night, slate, pearl), checked against tokens.css by a unit test
│  ├─ assets/hero/                stage 1: the prototype files; stage 2: the encodes (section 6); imported with ?url, hashed into /_astro/
│  ├─ components/
│  │  ├─ shell/Gate.astro         head inline script: html.js, tier choice (section 8)
│  │  ├─ shell/WordmarkSprite.astro   #skreed-wordmark built at build time from docs/brand/logo/skreed-logotype.svg
│  │  ├─ shell/SiteLogo.astro     corner logotype link and empty glitch groups
│  │  ├─ shell/Loader.astro       #intro markup and the verbatim loader script (is:inline, WT and POSE injected)
│  │  ├─ hero/HeroPoster.astro    <picture> per aspect class
│  │  ├─ hero/HeroStage.astro     canvas#stage, #labels, h1, .track, riders slot, after-track slot, boot <script>
│  │  ├─ hero/Countdown.astro     #heroCopy, countdown markup, noscript, <time>
│  │  ├─ hero/ScrollCue.astro     #cue markup and the countdown and cue inline script
│  │  └─ dev/Tune.astro           rendered only when PUBLIC_TUNE is '1'
│  ├─ scripts/
│  │  ├─ boot.ts                  the only processed script on the critical path (section 7)
│  │  ├─ motion.ts                reduced-motion and hover flags, read once
│  │  ├─ logotype/glitch.ts       logotype glitch, no three.js import
│  │  ├─ hero/**                  the WebGL island (section 5)
│  │  └─ dev/tune.ts              Tune bindings, dynamic import in dev and staging only
│  └─ inline/
│     ├─ gate.inline.js           emitted with set:html, hashed by scripts/csp.mjs
│     ├─ loader.inline.js         the prototype loader (lines 88 to 163) minus the POSE and WT literals
│     └─ countdown.inline.js      the prototype countdown and cue script (lines 178 to 191) plus the v10 hold hooks
├─ scripts/
│  ├─ fonts/                      exists
│  ├─ csp.mjs                     post-build: hash every inline <script> and <style> in dist/**/*.html, write the CSP into dist/_headers, fail on any style attribute
│  ├─ budget.mjs                  AC9
│  ├─ guards.mjs                  AC10 grep guards
│  ├─ lighthouse.mjs              three mobile runs, median
│  └─ hero/
│     ├─ gen-shades.mjs
│     ├─ copy-stage1-assets.mjs   copies prototypes/hero-v9/assets and pieces.json into src/assets/hero, checks sha256
│     ├─ encode-textures.py       stage 2 crops and encodes from the lossless PNGs
│     ├─ render-poster.mjs        canvas-only frozen render of the built page
│     ├─ encode-poster.py         AVIF and WebP posters
│     └─ measure-weights.mjs      loader milestone weights
├─ tests/
│  ├─ harness/                    browser launch, routing, settle and freeze helpers, canvas capture, compare.py
│  ├─ parity/                     rest, overlay, wipe, pull-back, loader frames (AC1 to AC3)
│  ├─ e2e/                        countdown, cue, logotype, hover and labels, tiers, reduced motion, failure, CSP, accessibility and breakpoints, locked values
│  └─ unit/                       node --test: maths, scroll map, wipe texture checksum, shades, tokens, weights
├─ .github/workflows/ci.yml
└─ .github/dependabot.yml
```

`.gitignore` gains `.wrangler/`, `test-results/` and `playwright-report/`.

## 4. Astro pages, layouts and components

**`src/pages/index.astro`** renders `Base` with the hero.

**`<head>` order** (`Base.astro`):
1. `meta charset`, `meta viewport` (`width=device-width,initial-scale=1,viewport-fit=cover`).
2. `Gate` (inline script). It sets the tier classes before any CSS applies, so there is no flash.
3. The inline `<style>`: tokens, fonts, shell. Astro inlines it because of `inlineStylesheets: 'always'`.
4. `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/open-sans-400-600-latin.woff2">` (spec D14).
5. Two poster preloads. Each is `<link rel="preload" as="image" type="image/avif" fetchpriority="high">` with its own `imagesrcset` and with `media="(max-aspect-ratio: 9/10)"` or its complement.
6. `<title>`, meta description, canonical `https://skreed.in/`, `color-scheme` dark. On staging builds only, `robots` noindex.

Slots are left for OG, icons and JSON-LD (site essentials, not this section).

**`<body>`.** One `<main>` holds everything, in the prototype's sibling order (spec D17). The v10 selectors such as `.intro.po ~ .site-logo` depend on it.

| # | Element | Component | Notes |
|---|---|---|---|
| 1 | `picture.hero-poster` | HeroPoster | fixed, inset 0, object-fit cover, under the canvas; hidden on `html.hero3d:not(.loading)` |
| 2 | `canvas#stage` | HeroStage | `aria-hidden`, fixed, `touch-action: pan-y`; `display: none` on `html.poster` |
| 3 | `svg.sprite` | WordmarkSprite | uses a class instead of the prototype's inline `style`, because a style attribute would need CSP `style-src-attr` |
| 4 | `div#intro` and the loader script | Loader | shown only on `html.js.loading`; the prototype's noscript `<style>` is dropped, which saves a CSP hash |
| 5 | `a#siteLogo.site-logo` | SiteLogo | `href="/"`, `aria-label="Skreed, home"`, an empty `<defs>` and a `.logo-tiles` group for the glitch |
| 6 | `div#labels` | HeroStage | `aria-hidden` |
| 7 | `h1.sr-only` | HeroStage | `hero.md` copy id `h1` |
| 8 | `div.track#track` | HeroStage | 460svh on `html.hero3d`, 100svh otherwise |
| 9 | `section#heroCopy.copy` | Countdown | fixed on `html.hero3d`, absolute otherwise |
| 10 | `div#cue.cue` and the countdown script | ScrollCue | the script must follow `#cue`, as in the prototype |
| 11 | `<slot name="riders">` | HeroStage | section 2's DOM copy (template7's `#s2Copy`) |
| 12 | `<slot name="after-track">` | HeroStage | section 3, the Wall (template7's `.wall.is-fixed` hand-off) |
| 13 | `<script>` that imports `boot.ts` | HeroStage | processed by Vite, `type=module`, deferred by nature |
| 14 | `Tune` | dev/Tune.astro | only when `import.meta.env.PUBLIC_TUNE === '1'` |

**Inline scripts.** Each is a real `.js` file in `src/inline/`, read with `?raw` and emitted with `<script is:inline set:html={...}>`. This keeps them testable and their hashes stable.
- The loader file is the prototype's lines 88 to 163, unchanged except:
  - `POSE` and `WT` are prepended as JSON from `config/hero.ts` and `config/loader-weights.json`, so the loader and the module can never drift;
  - `scrollTo(0, 0)` runs only without a hash;
  - `inert` is set on `#siteLogo` and `#heroCopy` while loading and removed at lift;
  - it returns early unless `html.loading` is set.
- The countdown file is the prototype's lines 178 to 191, plus the v10 `data-hold` check and `window.__skreedCountV`, and the `skreed.com` link at zero.

**CSS.**
- `tokens.css` carries the `:root` block from `DESIGN.md`.
- `shell.css` is the prototype's lines 10 to 50 and 63 to 83, with these changes:
  - token names follow `type-system.md` (`--pearl-whisper`, `--urban-slate`, `--ember-luxe`);
  - Pearl alpha stops are written as `rgb(var(--pearl-whisper-rgb) / a)`;
  - the Tune and fallback rules are removed;
  - `#ldSt` is set in Pearl Whisper (spec D15);
  - the visually hidden `h1` uses the UI face, because a clipped h1 in Poppins would still download Poppins (spec D14 keeps `/` to Open Sans only).
- The poster-tier rules are new. On `html.poster` or `html:not(.js)`:
  - `.track` is 100svh;
  - `.copy` is `position: absolute`;
  - `#stage` and `#intro` are `display: none`;
  - the poster is visible.

## 5. The WebGL island (`src/scripts/hero/`)

### 5.1 Module split

All modules are strict TypeScript. "Lines" refers to `template.html`.

| Module | Exports | Depends on | Lines |
|---|---|---|---|
| `util/math.ts` | `lerpFPS(a, b, k, ratio)`, `smoothstep`, `fit`, `clamp01`, `easeInOutCubic`, `sineNoise`, `hash2`, `vnoise2`, `parkMiller(seed)` | none | 313 to 318, 339 to 394, 1260 |
| `util/time.ts` | `yieldFrame()` (setTimeout 0 promise); THREE.Clock stays in r165 | none | 274 |
| `bridge/loader.ts` | `report(m)`, `onIntroDone(cb)` (installs `window.__introDone`), `markStarted()`, `loaderFail(text)`, `isLoading()`; typed `Milestone` union from the weights keys | config | 275 to 280, 1239, 1369, 1381 to 1398 |
| `bridge/hooks.ts` | `installHooks(ctx)`, compiled only when `PUBLIC_HERO_HOOKS` is '1' (section 10) | context types | 1238 to 1256, 1276 to 1278 |
| `data/urls.ts` | hashed `?url` strings for every asset and class | none | |
| `data/assets.ts` | `prefetchHeroData(class)`, which fetches the binaries and `pieces.json` as ArrayBuffer or JSON; `loadTexture(url, milestone, opts)` | bridge, urls | 593 to 599 |
| `gfx/renderer.ts` | `createRenderer(canvas, {touch})` returning `{renderer, dpr}` | three | 320 to 328 |
| `logo/geometry.ts` | `buildLogoGeometry(pieces, pose, step)` returning `{geometry, blocks}`; type `Block` | three, math | 339 to 394 |
| `logo/uniforms.ts` | `createLogoUniforms(params)`, `assignBlockColours(blocks, U)` | three, shades | 282 to 301, 395 to 413 |
| `logo/shaders.ts` | `logoVert(maxb, slots)`, `logoFrag(maxb, slots)`; slots `vertPars`, `vertPos`, `fragPars`, `fragOut`, empty by default | none | 414 to 533 |
| `logo/material.ts` | `createLogoMaterial(U, slots)` | uniforms, shaders | 414 to 533 |
| `logo/motion.ts` | `updateBlocks(f)`: breath, push, followers, rotation, floor clearance | math; samplers passed in | 1297 to 1330 |
| `world/wind.ts` | `bakeWindTexture(renderer)` | three | 712 to 768 |
| `world/fog.ts` | `createFogUniforms(windTex, uTime, params)`, `createFogCards(FOG)`, `placeFogCards(cards, groundAt)`, `updateFogLogoRect(FOG, cam, logoY, renderer)` | three, config | 769 to 878, 1353 to 1362 |
| `world/sky.ts` | `createSkyDome(tex, params, extents, slots)` | three | 557 to 592 |
| `world/ground.ts` | `createGround({meta, heights, tex, FOG, params, patches})` returning `{mesh, material, groundAt}`; `customProgramCacheKey` 'skreed-ground' | three, fog | 600 to 687 |
| `world/stones.ts` | `createStones({meta, buffers, patches})` returning `{mesh, material, stoneTopAt}` | three | 688 to 710 |
| `world/moon.ts` | `createMoon(...)`, `applyMoonWorld(scene, rig)`: background and fog #050506, near 60, far 430, moon visible | world/* | 879 to 896 (spires branch only) |
| `post/composer.ts` | `makeHeroComposer(renderer, scene, cam)` (Render, Save, Bloom, Restore, Output), `makePlainComposer(...)` | three addons | 918 to 942 |
| `post/wipeTexture.ts` | `makeScrollTexture(512)` returning `{tex, fill(j0, j1)}`; `needsUpdate` after the last fill | three | 944 to 986 |
| `post/composite.ts` | `createComposite(scrollTex, calm, slots)` returning `{scene, camera, C, render(...)}` | three | 987 to 1037 |
| `section2/types.ts`, `section2/placeholderWall.ts` | `Section2Scene` (section 11); the v9.9 swatch field | three, shades | 898 to 916 |
| `intro/types.ts`, `intro/none.ts` | `IntroDirector`; `NO_INTRO` (v9.9: live ramps from the loader cut) | none | 1273 to 1282 |
| `interaction/pointer.ts` | `createPointer()` returning `{ndc, active, lastInput}`; `ghostTarget(t)` | none | 1073 to 1084 |
| `interaction/labels.ts` | `createLabels(layerEl, sceneA)` returning `{update(...)}` | three | 1090 to 1154 |
| `camera/rig.ts` | `createCameraRig(camA, pose, moonPose)` returning `{update(...), setZoom(aspect)}` | math | 330 to 337, 1335 to 1348 |
| `scroll/scrollMap.ts` | `createScrollFollower()`, `mapScroll(b)` returning `{s, tp, heroOn}`, `clipFor(tp, above, aspect)` | math | 1258 to 1264, 1283 to 1288 |
| `scroll/ride.ts` | `rideCopy(els, tp)` | scrollMap | 1265 to 1271, 1371 to 1379 |
| `warmup.ts` | `warmUp(ctx)`: compile, groups c1 to c5, composer warm c6, then resize | bridge | 1381 to 1399 |
| `loop.ts` | `createLoop(ctx)` returning `{start, stop}`; owns `t`, `ratio`, `live`, `tHero0` | everything above | 1273 to 1369 |
| `hero.ts` | `startHero(opts)`: the start-up order of section 5.3; builds `HeroContext` | everything above | 260 to 1400 |
| `../boot.ts` | tier check, poster wait, data prefetch, `import('./hero/hero.ts')`, failure routing, IntersectionObserver, `webglcontextlost` | bridge only, plus the dynamic import | new |
| `../logotype/glitch.ts` | `createLogoGlitch(linkEl, opts)` returning `{burst, intro, setTone}`, installed as `window.__skreedLogo` | shades, motion | 1156 to 1237 |

**Import graph.**
- `config/*` and `util/*` are leaves.
- `world`, `logo` and `post` import only leaves and three.
- `logo/motion.ts` receives `groundAt` and `stoneTopAt` as functions, so there is no import cycle.
- `section2` and `intro` are interfaces plugged in through `HeroContext`.
- `boot.ts` imports `bridge/loader.ts` and `data/urls.ts` only, and loads `hero.ts` dynamically.
- `glitch.ts` never imports three.

Expected chunks:
- the boot chunk, about 1 KB gz (the probe's island gate was 0.9 KB gz);
- the hero chunk, three and the scene together, 139.8 KB gz in the Astro probe before Tune is removed;
- the glitch chunk, about 2.5 KB gz.

**Port rules that keep pixels identical.**
- GLSL strings are copied byte for byte. `MAXB` (30) stays interpolated as text. The minifier never rewrites string contents.
- Named slots are string concatenation points that are empty by default, so the default shader text equals the prototype's.
- `makeScrollTexture` keeps its integer hash exactly: `(x*374761393 + y*668265263 + s*2147483647)|0`, then `((h^(h>>>13))*1274126177)|0`. Never `Math.imul`, because the double rounding of the 1274126177 product is part of the texture. `x*999|0` keeps its precedence. A unit test compares the texture's checksum with the prototype function's, extracted from `template.html`.
- `buildLogoGeometry` keeps the Park-Miller call order (seed 11, three calls per block), the `Math.sin` hashes and the float maths.
- Every `onBeforeCompile` material gets an explicit `customProgramCacheKey`. three keys programs on `onBeforeCompile.toString()`, and minified closures can collide.
- `setPixelRatio` runs before the composers are built, because EffectComposer copies the pixel ratio at construction.
- `FOG.uTime` is the same object as `U.uTime`, and the fog cards share the FOG uniform objects by reference.
- The one-frame camera lag in the raycast, the labels and the fog logo rect (they read camA's matrices from the last render) is kept.

**Dropped from the prototype.** None of these changes a pixel.
- The canyon and dunes plates, `PLATES` (about 150 KB), `?world`, `[data-world]`.
- The `[data-n]` variant code.
- The orders other than 'cool', `?blockColors`, `[data-order]`.
- `P_DEFAULTS`, the `?key=` overrides and the slider loop. These move to `dev/tune.ts`.
- The unused uniforms `uAnchor`, `uRegion` and `uRimDir`, and the `SOFT_DEPTH` branch.
- The no-op resize lines (`A.b.resolution.set` and the second savePass setSize).
- The placeholder `#wallCopy` text.

### 5.2 HeroContext

`hero.ts` builds one object and passes it to `warmUp`, `createLoop`, the hooks and the slots:
- `renderer`, `dpr`;
- `sceneA`, `camA`, `U`, `FOG`, `blocks`, `logo`, `moon` (with `groundAt` and `stoneTopAt`);
- `composerA` (bloom) and `section2` (a `Section2Scene`, the placeholder by default);
- `composite`, `intro` (an `IntroDirector`, `NO_INTRO` by default);
- `params`, `reduced`, `touch`, `ghost` (`touch && !reduced`), `els` (`heroCopy`, `cue`, `labels`, `logoGlitch`).

### 5.3 Start-up order (keep it: the loader milestones and weights depend on it)

1. `hero.ts` evaluates: `report('import')`.
2. Params: the frozen `HERO_PARAMS`. `breath` is 0 when reduced.
3. Renderer: `antialias` true (parity), `powerPreference` 'high-performance'. Then `setPixelRatio(min(devicePixelRatio, touch ? 1.25 : 1.5))`, ACESFilmic, `autoClear` true. A construction failure goes to `loaderFail` and the poster.
4. `sceneA` and `camA`: PerspectiveCamera(30, 1, 0.1, 1200).
5. `U`, the logo material, and the logo mesh added to `sceneA` first, so it is warm-up group c1.
6. `makeScrollTexture(512)`.
7. `buildLogoGeometry` per block. For each block: fill the wipe texture rows `round(id * 51.2)` to `round((id + 1) * 51.2)`, `yieldFrame`, `report('b' + (id + 1))`. Then the attributes, `assignBlockColours`, and `uOff`, `uQ` and `uD` reset.
8. The moon group added (invisible). The sky texture starts loading, and `sky` is reported on load or error. The sky dome is added to the moon group.
9. `yieldFrame`. The ground texture starts loading (`ground` on load or error). Ground mesh and `groundAt`. Stones and `stoneTopAt`.
10. Wind texture bake: one synchronous render.
11. FOG uniforms. Four fog cards added to the moon group, then `placeFogCards`.
12. `applyMoonWorld`: poses, fog 60 and 430, background and fog #050506, moon visible.
13. The section 2 scene installed (placeholder: `sceneB` on Pearl Whisper, `camB` (30, 1, 0.1, 100), the 240-instance swatch field).
14. `yieldFrame`. Composer A (bloom) and the section 2 composer.
15. The composite.
16. `resize()`.
17. Pointer listeners, state objects. Labels: the links LineSegments added to `sceneA` last, so they are group c5.
18. Hooks (test builds). The `heroCopy`, `cue` and labels references.
19. `report('scene')`, `yieldFrame`.
20. Warm-up:
    - `compileAsync(sceneA, camA)` and `compileAsync(screenScene, screenCam)`;
    - groups c1 logo, c2 sky, c3 ground and stones, c4 fog cards, c5 links, each drawn alone into an 8 x 8 target, with a yield and a report between them;
    - sizes to 8 x 8, composer A rendered once: c6;
    - the section 2 composer and the composite drawn once;
    - `resize()`, dispose the warm-up target;
    - errors are warned and swallowed.
21. `report('compile')`, then the first `requestAnimationFrame`. `frame1` and `frame2` are reported on the two frames after both textures have loaded or failed.

The prototype's invisible plate mesh sat between steps 5 and 8. Removing it saves one compile in `compileAsync`. The warm-up groups count only visible meshes, so c1 to c6 are unchanged.

### 5.4 Per-frame order (keep it exactly)

| Step | What happens |
|---|---|
| F1 | `requestAnimationFrame(frame)` first; hooks build: `__skreedFrame++`; `__heroStarted = true` |
| F2 | `dt = freeze ? (getDelta(), 0) : min(getDelta(), 1/12)`; `t += dt`; `ratio = min(5, dt * 60)` |
| F3 | `U.uTime = reduced ? 0 : t` |
| F4 | `live = introDone ? (reduced ? 1 : 1 - (1 - clamp01((t - tHero0) / 2))^3) : 0`. The intro slot may override this. |
| F5 | `logo.position.y = reduced ? 0 : sin(0.7t) * 0.07 * live` |
| F6 | scroll followers 0.075 and 0.15; `s = reduced ? 0 : easeInOutCubic(clamp01(b / 1.5))`; `tp = clamp01((b - 1.5) / 1)`; `heroOn = 1 - smoothstep(0, 0.45, s)` |
| F7 | pointer target or ghost sweep; raycast through camA onto z = 0; mouse follower |
| F8 | blocks: breath, push, followers, offset, rotation, floor clearance; write `uOff`, `uQ`, `uD` |
| F9 | `logo.updateMatrixWorld()` |
| F10 | labels update; label layer visibility |
| F11 | camera: base pose by `s`, parallax lerps, orbit, position, sky follows the camera, shake, `lookAt` |
| F12 | section 2 update (placeholder: `camB.y = -clamp01((b - 2.5) / 1.5) * 0.8`) |
| F13 | `FOG.uLogoRect` and `FOG.uResolution` |
| F14 | composer A if `tp < 1`; section 2 composer under NoToneMapping if `tp > 0`; composite to the canvas with `uNoiseOff` random |
| F15 | `frame1` and `frame2` reports |
| F16 | DOM ride: logotype tone, `heroCopy` transform, clip and visibility, cue `is-off` |

### 5.5 Constants that must survive

**`HERO_PARAMS`, 66 keys.** The locked values from `hero.md` section 0 are marked with an asterisk; every other value is the v9.9 default.

| Group | Key and value |
|---|---|
| Hover | push 0.5, wob 0.3, r0 1, r1 3, follow 0.06, mouse 0.05, breath 0.3 (0 under reduced motion), lift 1.6, clear 0.2 |
| Look | glow 2.4, rest 0.06, tint 0.035, grad 0.7, tex 1.5, relief 0.01, key 2.0 |
| Logo light | rim 2.4, spec 0.8, rough 0.55, bounce 1.0, amb 1, rimAz 35, rimEl 40 (both unused by the GLSL), bevel 0.05, bevelAng 50, alb 0.017, wrap 0.25 |
| Key light | keyX -6, keyY 7, keyZ 10, keyRad 3.5 |
| Kicker and counter kicker | rimX -4, rimY 9, rimZ -3, rimRad 4.5; rim2 0.75, rim2X 9, rim2Y 7, rim2Z -3, rim2Rad 4 |
| Environment | floor 0.24, hz 0.06, sky 0.008, ktemp 1, wear 0.3, occ 0.3, knee 0.55 |
| Post | bloom 0.5 |
| Glitch | logoIdle 1, logoSplit 0.4 |
| Sky | skyGain 1, hue 0.8, hueScale 2.2 |
| Terrain | gExp 0.20\*, gGamma 0.87\*, gNear 0.54\*, gToe 0.02\*, crumb 0.53\*, crumbSize 0.07\*, mist 0.20\*, mistSpeed 0.55\* |
| Fog | fog 1\*, fogBright 0.4\*, fogSpeed 0.15\*, fogSize 1\*, fogHug 1.6\* |

**Logo geometry.**
- Size: MAXB 30 (uniform array size; 10 blocks used). viewBox 1207.63 x 1312.81. Logo width 5.6, scale 0.00463718191830, height 6.0877, depth 0.95. Seam scale 0.992.
- Hash: Park-Miller seed 11, multiplier 16807, modulus 2147483647. hash2 = fract(sin(127.1x + 311.7y) * 43758.5453).
- Relief: boundary vertices -0.55 - 0.35 hash2(9x, 9y); interior vertices 0.15 + 0.5 vnoise2(2.4x + 3, 2.4y) + 0.55 hash2(13x, 13y).

**Camera.**
- Hero pose: camera (0, -2.5, 24), target (0, -1, 0). Pulled-back pose: camera (0, 3.2, 36), target (0, -1.2, -6).
- Zoom `min(1, aspect * 1.25)`. Portrait below aspect 0.9.
- Parallax: theta `0.07 * pi/2 * x`, phi `-0.025 * pi/2 * y`, lerp 0.035.
- Shake: 0.01 times live, with `sineNoise(-2.45, 4.789, 7.343 + 0.5t)` about the right axis and `sineNoise(12.23, 3.44, -3.234 + 0.5t)` about the up axis.
- Live ramp 2 s, cubic out. dt cap 1/12, ratio cap 5.

**Block motion.**
- Breath: `0.4 (sin(-2t + cx) * 0.5 + 0.5)(cos(-t) * 0.5 + 0.5)(0.5 + 1.5 rand.z) * 0.5 * breath * live`.
- Push wobble: `sin(t + rand.x * 12.342) * rand.y`.
- Rotation axes in order Y, Z, X, each by `cos(2d + rand * 30) * d * 0.5`.
- Floor clearance +0.2; when a block is lifted, z also moves by 0.6 times the lift.
- Ghost sweep after 2500 ms idle. Mouse rest sentinel 99; it decays toward the sentinel at `mouse * 0.25`.

**Labels.**
- Limits: max 5, links 2, minimum displacement 0.1, near 2, step 0.05, fade in 0.1 s, out 0.06 s.
- Look: link colour #F7F6F3 at opacity 0.35, renderOrder 10. Label offset (-1.5, -6) px. Readout `floor(|off| * 50) % 100`, padded to two digits.

**Sky dome.**
- Shape: radius 900, segments 128 x 64, longitude 140 degrees centred on 1.5 pi, elevation -10 to 60 degrees. scale.x -1, rotation.x -2.6 degrees, DoubleSide, renderOrder -2.
- Texture: anisotropy 8.
- Galaxy wash: 5 fbm octaves (x2.03 + 11.7, gain 0.5). Taps `d + 3.1`, `d * 1.3 - 7.4`, `d * 0.8 + 19`, `d * 1.7 + 41`, with thresholds (0.38, 0.78), (0.42, 0.8), (0.48, 0.84), (0.5, 0.86). Horizon mask `smoothstep(-0.03, 0.12, dir.y)`. Dark mask `1 - smoothstep(0.02, 0.18, luma709)`.
- The wash uses the view direction, not the UV, so cropping the texture with the dome leaves it unchanged.
- Stage 2 extents: portrait longitude 43.2667 degrees, wide 106.9333 degrees, top 36.2667 degrees, bottom -10 degrees.

**Ground.**
- Grid: 400 rows by 320 columns. zmin -3.88707484659952, zmax 38.88389816956722.
- Mapping: row depth `PY = -30 + 450 (1 - r / 399)^2.2`; half width `34 + 1.25 (PY + 30)`.
- Texture: anisotropy at the renderer maximum.
- Tone: `gExp * pow(c, gGamma)`; near falloff `smoothstep(6, 20)`; toe `0.5 (c + sqrt(c^2 + 4 toe^2))`.
- Crumb: weights 0.5, 0.3, 0.2, fading by `smoothstep(6, 45)`.
- Mist: near 6, far 140, lit-only weight 0.6.

**Stones.** 3066 vertices, 5840 triangles, u16 index. lo (-53.78633499, -3.95012641, -54.32771683), hi (54.74985886, 0.28714204, 18.81669998). Top grid: x0 -9, z0 -6, 120 by 100 cells of 0.15, dilated 2 cells.

**Wind bake.** 256 px, RGBA8, repeat, trilinear mips. uPeriod (3, 5), uWarp 0.6, uEmboss 0.3, uHeightMix 0.6, uOctGain 0.45, uSeed 0, uNorm (1.338, -0.176). Output clamped to 0.13 to 0.80.

**FOG uniforms.**
- Tiles and fades: uTileMul 1, uSpeed 0.15, uRise 1, uGain 8, uHaze 0.03, uDensity 1, uMaxAlpha 0.45, uOpacity 1, uEdgeX 0.2, uBottomRamp 0.1, uTopFade 1.6.
- Distances: uNearStart 6, uNearEnd 12, uFarStart 220, uFarEnd 420, uGrazing 0.25.
- Colour: uFogColor #F7F6F3, uFogBright 0.4, uLift 0.35.
- Logo guard: uLogoClear 0.8, uLogoSoft 0.35.
- Ground mist: uGMAmount 0.55 in v9.9 (0.20 with the lock), uGMScale 0.1, uGMVelX 0.25 and uGMVelZ 0.3 (each times mistSpeed), uGMNear 6, uGMFar 140, uGMLitOnly 0.6.
- The wind tile is decoded with pow 2.2 and dithered by `(ign - 0.5) / 255`.

**Fog cards** `[z, width, height, tile, phase, front, yaw]`:
- [9, 44, 1.8, (5.8, 2.9), 0, 1, 4 deg]
- [-10, 90, 3.5, (13.1, 6.5), 0.914, 0, -6 deg]
- [-45, 170, 7.0, (26.5, 13.3), 2.31, 0, 3 deg]
- [-150, 440, 18.0, (67.0, 33.5), 4.07, 0, 0 deg]

Each card sits at y = `groundAt(0, z) - 0.15 h + h / 2`, renderOrder 2.

**Composer and bloom.**
- No MSAA (v9.8: multisampled half-float targets drew stray lines on GPUs).
- Pass order: RenderPass, SavePass (HalfFloat), UnrealBloomPass(256 x 256, strength 0.5, radius 0.22, threshold 0.62), Restore `mix(clean, bloomed, step(0.5, clean.a))`, OutputPass.
- The section 2 composer is RenderPass and OutputPass, rendered under NoToneMapping.

**Wipe texture.**
- Size and channel R: N 512, 7 cells, warp ±0.03, edge x40.
- Channel G: block split depth up to 5, stopping when depth is above 2 and the hash is below 0.3, split ratio `0.3 + 0.4 hash`.
- Channel B: fbm base 2, seed 7.

**Composite.** Slope `-0.2 aspect`, wobble ±0.4. Margins: blur 2.0, disp 0.9, cutDisp 1.0, cutDiag 0.2, cut 2.0. Parallax `0.4 cubicIn`, disp 0.025. Five-tap chromatic aberration with a barrel bend, modulator 12. `uCalm` is set under reduced motion.

**DOM ride.**
- Countdown translate `-0.4 tp^3 * 100vh`.
- `clipFor`: `sl = 0.2 aspect`, `pp = -0.2 + 1.2 tp (1 + sl) + 0.1`.

**Section 2 placeholder.** Circle radius 0.2, 48 segments, gap 0.5. 24 columns, or 12 when aspect is below 0.9. y offset -0.6 (-0.9 in portrait). camB z 19 (26 in portrait). Background #F7F6F3.

**Glitch.**
- Geometry: viewBox 1209.46 x 292.9, AMP 12.69933, 8 rows by 6 segments.
- Slabs: rows `rand(0.05, 0.24)` of the height, segments `rand(0.06, 0.26)` of the width, cuts snapped to device pixels.
- Ghosts: offset `AMP * rand(1.4, 2.6)`, alpha `clamp(0.74 * sqrt(0.72 / L), 0.5, 0.9)`.
- Flicker `0.85 + 0.15 sin(30p + phase)`. 3 patterns per burst.

**Loader.** CYC 1.6, DEL 0.2, LEAD 0.04, FULL 4.96, END 7.05. Ease-in `cubic-bezier(.55, .085, .68, .53)`. Lift 600 ms, or 400 ms under reduced motion. Status text after 4 s without progress. Poster after 12 s without progress once `scene` is in, 20 s before it.

## 6. Asset pipeline

### 6.1 Sources

- **Stage 1.** `scripts/hero/copy-stage1-assets.mjs` copies `prototypes/hero-v9/assets/*` and `prototypes/hero-v9/pieces.json` into `src/assets/hero/`. It checks each sha256 against a committed manifest. The asset probe proved these files are byte-identical to the data inlined in the built `index.html`.
- **Stage 2 masters.** The lossless renders exist only in the session scratchpad: `SCR/land/moon_igloo/sky.png` (4200 x 2100 RGBA, 12,989,807 B) and `ground_bake.png` (4096 x 4096 RGB, 13,485,739 B). Re-encoding them with `build.py`'s settings gives the shipped WebPs byte for byte, which proves they are the v9.9 sources. **They must be copied to durable storage first** (open question for Sam: Git LFS in this repo, or Dropbox). `encode-textures.py` takes their path as an argument and commits only the encodes.
- **Shades.** `scripts/hero/gen-shades.mjs` reads `docs/data/shades-240.json` and writes `src/config/shades.gen.ts`: the ten block shades, the four galaxy shades, the glitch pairs and lightness, and the 240 hexes in catalog order. Everything is looked up by id, because names repeat (Pastel six times, Neon four, Wine twice).
- **Wordmark.** `WordmarkSprite.astro` reads `docs/brand/logo/skreed-logotype.svg` at build. It strips the class and fill so the paths draw in `currentColor`. A unit test checks the six path strings against the prototype sprite.

### 6.2 Files per device class (stage 2)

| Class | Chosen when | Sky | Ground | Shared |
|---|---|---|---|---|
| poster | the tiers in section 8 | none | none | poster only |
| portrait | aspect below 0.9 at load | crop 1298 x 1388, AVIF q50 (182,948 B), WebP q84 fallback (326,326 B) | 4096 AVIF q50 (408,036 B) | ground_h, stones, pieces, meta |
| wide | aspect 0.9 or more | crop 3208 x 1388, AVIF q50 (362,639 B), WebP q84 fallback (604,504 B); the ladder probe measured the 3209 px variant at 362,950 B | 4096 AVIF q50 (408,036 B) | same |
| WebP-only browser | the poster's `currentSrc` is not `.avif` | the class's WebP crop | 2048 WebP q82 (317,324 B), the only use of the 2048 ground (spec D4) | same |

- **Crops.** Each crop keeps the bottom 1388 rows, centred on column 2100, with a 0.01 margin.
- **Rotation.** A portrait device that rotates to wide loads the wide crop, then swaps the texture and the dome extents.
- **Parity.** The encodes reach the measured parity: phone PSNR 42.12 dB and SSIM 0.9766; desktop 41.55 dB and 0.9748; residual is codec grain only. SSIM against the lossless source, AVIF q50 against the shipped WebP:
  - ground: 0.9812 against 0.9826 (WebP q82);
  - sky: portrait crop 0.9470 and wide crop 0.9506 against 0.9489 (full sky, WebP q84).
- **Optional, lossless.** Row-and-column delta coding of `ground_h.bin` saves 39 KB br (191.2 to 152.1 KB). A unit test checks the decoded heights byte for byte against `ground_h.bin`.

### 6.3 Loading and decoding

- **Bundling.** Every asset is imported with `?url` from `src/assets/hero/`, so Vite emits it with a content hash under `/_astro/`. `assetsInlineLimit: 0` guarantees that nothing turns into a base64 `data:` URI. `moon_meta.json` (279 B) is imported as a JSON module into the hero chunk. `pieces.json` is fetched as data, not bundled; bundled it would add 39.4 KB gz to the JS budget.
- **Prefetch.** After the poster decodes, `boot.ts` starts the hero chunk import and, in parallel, `prefetchHeroData(class)`: `fetch()` for `pieces.json`, `ground_h`, `stones_p`, `stones_c` and `stones_i` as ArrayBuffers. `hero.ts` awaits those promises where the prototype decoded base64. Typed-array views are little-endian on every target.
- **Textures.** They load through `ImageBitmapLoader` with `{imageOrientation: 'flipY', premultiplyAlpha: 'none'}`, so decode happens off the main thread. The bitmap is closed after upload. This is kept only if the stage 1 rest frames stay identical to the `TextureLoader` path (spec D8); otherwise `TextureLoader`. The `sky` and `ground` milestones fire on load or error (a failed decode still hands over, as in the prototype). The upload happens at the first bind inside the warm-up, as in the prototype.
- **Compression.** `.bin` files are served as `application/octet-stream`. Whether Cloudflare compresses that type is not verified. If it does not, `ground_h` ships 250 KB instead of 191 KB br. The first staging deploy checks `curl -sI -H 'Accept-Encoding: br'` on each `.bin`.

### 6.4 Posters

1. `scripts/hero/render-poster.mjs` renders the built stage 2 page canvas-only with `__skreedFreeze` set before load (scene time 0), at least 3 frames after `ready`, with the overlays hidden. It renders at 390 x 844 (deviceScaleFactor 1.25, buffer 488 x 1055) and at 1280 x 800 (deviceScaleFactor 1.5, buffer 1920 x 1200).
2. `encode-poster.py` writes:
   - phone: 488 x 1056 AVIF q60 (measured 42,668 B on v9.9 values) and WebP q80 (44,492 B);
   - desktop: 1920 x 1200 AVIF q50 (86,318 B) and WebP q70 (91,548 B). Desktop AVIF q60 would be 123,357 B, over budget.
3. The poster is re-rendered whenever a parameter, an asset or the pose changes. A test compares it with a fresh canvas render (SSIM at least 0.954 phone, 0.953 desktop).

## 7. Loading sequence

### 7.1 Timeline, 3D path

1. **HTML arrives.** In the head, `Gate` sets `html.js`, the tier class and `html.loading`. The inline CSS paints night, and the loader script starts its light band (compositor-driven). The poster and Open Sans preloads start at high priority.
2. **Body parse.** The countdown script ticks once, revealing the numerals in the same task. The loader builds its mask from the sprite. `boot.ts` (module) runs after the parse.
3. **`boot.ts`.**
   - Awaits `poster.decode()` (failure ignored), so the island never competes with the LCP bytes.
   - Reads the poster's `currentSrc` for AVIF support.
   - Picks the class by aspect.
   - Starts the data prefetch and `import('./hero/hero.ts')`.
4. **The chunk evaluates.** `report('import')`, then `startHero()` runs the order of section 5.3. The milestones feed the loader through `window.__skreedLoaderReport`.
5. **`frame2`.** The loader schedules its exit on the next light pass, then dims, outlines and lifts. The lift removes `html.loading` and calls `window.__introDone()`. The hero's life ramps in over 2 s, and the logotype's intro burst runs.

Measured and calculated, not yet run end to end on the real stack: on Lighthouse 4G (1.6 Mbps, 150 ms RTT) the 78 KB critical set lands in about 1.2 to 1.5 s. The 948 KB phone island then takes about 4.7 s more. The loader covers that, and on a fast load it runs its own 8.2 s.

### 7.2 Loader bridge (the prod contract)

| Global | Direction | Purpose |
|---|---|---|
| `SKREED_POSE` | loader writes, module reads | `{cam: [0, -2.5, 24], tgt: [0, -1, 0], fov: 30, lw: 5.6, z: 0.475}` |
| `__skreedLoaderReport(m)` | module to loader | milestone names are the keys of `loader-weights.json` |
| `__skreedLoader` | `{setProgress, ready, cut, skip, fail, seek, state}` | `fail` is how `boot.ts` hands over to the poster |
| `__introDone()` | module defines, loader calls at the lift | starts `live` and the logotype intro |
| `__heroStarted` | module sets on the first frame | tells `boot.ts` the island is running |
| `__skreedLogo` | glitch module | `burst`, `intro`, `setTone` |
| `__skreedCountV`, `#count[data-hold]` | countdown | v10 slot |

All of them are typed in `src/env.d.ts`.

### 7.3 Failure routing (`boot.ts`)

`toPoster(reason)`:
1. Calls `__skreedLoader.fail(...)`. Offline keeps `ld.offline`; every other cause passes an empty string.
2. Swaps `html.hero3d` for `html.poster` and removes `html.loading`.
3. Stops the loop if it is running and removes `#intro` after its fade.
4. Logs `console.warn('[hero] ' + reason)`.

It is called on:
- an `import()` rejection (a chunk failure does not fire the window `error` event the prototype's `noHero` listened for);
- an `unhandledrejection` or a window `error` from the hero chunk before `__heroStarted`;
- a renderer construction failure;
- `webglcontextlost` at any time (no restore attempt);
- the loader's own stall and offline rules (12 s after `scene`, 20 s before it, offline before ready).

### 7.4 Loader weights

The 23 weights in `prototypes/hero-v9/loader_weights.json` were measured with the data inlined as base64. Fetching the data changes the network milestones, so `scripts/hero/measure-weights.mjs` re-measures them on the test build:
1. Record `performance.now()` at every report (hooks build: `__skreedMilestoneTimes`) over 5 runs at each viewport, with 4x CPU throttling (Lighthouse's mobile slowdown) through CDP.
2. Weight = mean interval before the milestone divided by the mean total, rounded to 0.01. The largest weight absorbs the rounding so the sum is 1.
3. Write `src/config/loader-weights.json`. The loader and the module both import it.

Any later change to the warm-up groups, an extra milestone (v10 adds `intro`) or a change to the null-target `compileAsync` means re-running it.

### 7.5 Stopping the island

- An IntersectionObserver watches `#track`. When the track leaves the viewport (which can only happen once a section follows it), the loop stops and the canvas is hidden. It restarts when the track returns. This keeps WebGL out of section 3 and beyond.
- `requestAnimationFrame` already pauses in background tabs. The dt cap of 1/12 absorbs the resume.

## 8. Tiers

`Gate` runs in the head before first paint. In order:

1. Add `js`.
2. Test builds only: honour `?tier=poster|hero3d|still3d`.
3. `poster` if any of these holds:
   - `'WebGL2RenderingContext' in window` is false;
   - `navigator.connection.saveData` is true;
   - `effectiveType` is `slow-2g` or `2g`;
   - `navigator.deviceMemory` is 2 or less (undefined counts as more);
   - `prefers-reduced-motion: reduce` matches and `REDUCED_MOTION_TIER` is `poster`.
4. Otherwise `hero3d loading`.

Without JavaScript nothing is added, and the default CSS is the poster layout.

The real WebGL2 context is created by the renderer; a failure there routes to the poster (section 7.3). `hardwareConcurrency` is not used (spec D3). A frame-time probe is out of scope.

## 9. three.js version

Pin `three@0.165.0`. The readers measured:
- **Look.** r186's `UnrealBloomPass` changed in three ways:
  - blur kernels: [3, 5, 7, 9, 11] with sigma equal to the kernel, became [6, 10, 14, 18, 22] with sigma a third of it;
  - composite: alpha-weighted, so the added light scaled with strength squared, became `3 * strength * rgb`, premultiplied;
  - high-pass luma: (0.299, 0.587, 0.114) became Rec. 709.

  At strength 0.5 that is roughly twice the glow at the core, with longer tails.
- **Size.** r165 tree-shaken with the six addons is 119.3 KB gz. r186 is 134.1 KB gz, 14.8 KB gz more.
- **Clock.** `THREE.Clock` is deprecated from r183 and warns.

The r186 upgrade is its own task:
1. Vendor r165's `UnrealBloomPass.js` and `LuminosityHighPassShader.js` (MIT, header kept) as `post/UnrealBloomPassR165.ts`.
2. Replace `THREE.Clock` with a `DeltaClock` with the same semantics (lazy start, first delta 0).
3. Pass the AC1 stage 1 diff against the r165 build.

The ShaderChunks the ground and stones patch are compatible between the two versions (3D inventory, parity register).

## 10. Tune panel and test hooks

| Build | Command | `PUBLIC_HERO_HOOKS` | `PUBLIC_TUNE` | `PUBLIC_STAGING` | Used for |
|---|---|---|---|---|---|
| dev | `astro dev` | 1 | 1 | 0 | local work; Tune opens with `?tune` |
| test | `npm run build:test` | 1 | 0 | 0 | Playwright parity and e2e |
| staging | `npm run build:staging` | 1 | 1 | 1 | Sam's review on the staging Worker; noindex |
| production | `npm run build` | 0 | 0 | 0 | skreed.in, Lighthouse, budgets, guards |

- The flags are read as `import.meta.env.PUBLIC_*` inside `if` blocks that Vite folds at build time. The production bundle therefore contains no Tune code and no test hooks. `scripts/guards.mjs` greps `dist/` for `tuneReset`, `__skreedSolo`, `__skreedState`, `__skreedFreeze`, `__skreedProject`, `__skreedFloorCheck`, `__skreedParams` and `?tier=` and fails the build if any is found.
- **Tune.** `dev/tune.ts` is the prototype's slider loop, buttons and `apply()` (lines 303 to 311, 1052 to 1071), dynamically imported only when `PUBLIC_TUNE` is '1' and `?tune` is in the URL. Every lookup is null-guarded. It drives the same `HERO_PARAMS` object through a mutable dev copy, so Sam can tune on staging and hand the numbers back for `params.ts`.
- **Hooks**, with the prototype names kept for the harness:
  - `__skreedState()`, `__skreedSolo(i)`, `__skreedFloorCheck()`, `__skreedProject(i, px, py, back)`, `__skreedFrame`, `__skreedFreeze` (read in F2);
  - new: `__skreedParams()`, `__skreedMilestoneTimes`, `__skreedLoseContext()`, and `__skreedStall(milestone)` (holds the warm-up before that milestone, for the "Still loading" test).

## 11. Slots for work happening elsewhere

### 11.1 The igloo intro (v10, `scratchpad/proto/template_v10.html`)

```ts
// src/scripts/hero/intro/types.ts
export interface IntroDirector {
  readonly milestones: readonly string[];              // v10: ['intro'], appended to the loader weights
  readonly rendererOptions?: Partial<THREE.WebGLRendererParameters>; // v10: {antialias: false, depth: false, stencil: false}
  readonly slots: HeroShaderSlots;                     // logo frag (uPrint, uPrintCol, tTri, print band, alpha 'am'),
                                                       // ground and stones color_fragment patch, sky (uFlat, uSkyP, uSkyB), composite (uIntro)
  install(ctx: HeroContext): void;                     // cage lines, outline, numbers Points; FOG.uOpacity; bloom overrides; sceneA.background
  start(t: number): void;                              // at the loader cut, instead of the v9.9 live ramp
  update(t: number, dt: number, ctx: HeroContext): IntroFrame; // {live?, breath?, touch?, camera?, uiPhase?, scrollLocked?}
  skip(): void;                                        // v10 SKIP rule: reduced motion, ?intro=0, location.hash
}
export const NO_INTRO: IntroDirector;                  // v9.9 behaviour
```

Hooks the shell already leaves for the intro:
- the `html.intro` and `uh1` to `uh4` class names;
- `#count[data-hold]` and `__skreedCountV`;
- the prototype's sibling order for the `.intro.po ~ ...` selectors;
- a `patches` list on the ground and stones materials (`onBeforeCompile` chain with explicit cache keys);
- `renderOrder` and `transparent` overridable on both.

### 11.2 Section 2, the rocks (`scratchpad/proto/template7.html`)

```ts
// src/scripts/hero/section2/types.ts
export interface Section2Scene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.Camera;
  readonly composer: PlainComposer;            // v9.9: RenderPass + OutputPass under NoToneMapping
  readonly scrollSegments: ScrollSegment[];    // v9.9: []; rocks: DWELL 1 (phone 1.5), WIPE2 1, then 1
  readonly compositeSlots?: CompositeSlots;    // rocks: modes 0 to 3, tR, uRide, uRockFade, uTopFade
  readonly logoVertexSlot?: string;            // rocks: the logo morph into the rock pose (view-space uOff and uQ)
  install(ctx: HeroContext): void;             // rocks: sceneR rendered through camA into its own linear target; sceneB becomes the fog
  resize(w: number, h: number, aspect: number, portrait: boolean): void;
  update(f: FrameCtx): void;
  pump?(budgetMs: number): void;               // rocks: idle build budget of 4, 12 or unlimited ms by scroll
  dispose(): void;
}
```

`SCROLL_MAP` is data: `[PULL 1.5, WIPE 1.0, ...section2.scrollSegments]`. The track height is set from it; it is 460svh in v9.9.

The DOM riders slot takes `#s2Copy` with the copy clip under the logo.

**Sky crop check.** The stage 2 sky crops assume the hero camera's views. Before the rocks ship, the sky UV probe (`SCR/port/bundle-probe/three-0.165.0/skyuv.mjs`) is re-run with the section 2 and intro cameras. If they see sky outside u 0.127 to 0.871 or v 0 to 0.651, the crops widen.

### 11.3 Section 3, the Wall

- It is DOM, never WebGL (CLAUDE.md).
- It mounts in the `after-track` slot. The hero exposes `onStageExit(cb)` from the IntersectionObserver for template7's `.wall.is-fixed` hand-off (`margin-top: -100svh`).
- GSAP, ScrollTrigger and Lenis arrive with it. Lenis must not smooth the hero's track range: either it is disabled until the track ends, or the hero keeps reading native `scrollY`. Otherwise the pull-back gets a third smoother.
- `motion.ts` then wraps `gsap.matchMedia()` so reduced motion has one source.

## 12. Cloudflare Workers + Static Assets

### 12.1 `wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "skreed-teaser",
  "compatibility_date": "2026-10-09",
  "assets": { "directory": "./dist", "not_found_handling": "404-page", "html_handling": "auto-trailing-slash" },
  "env": {
    "staging": {
      "name": "skreed-teaser-staging",
      "assets": { "directory": "./dist", "not_found_handling": "404-page", "html_handling": "auto-trailing-slash" }
    }
  }
  // After A1 (nameservers on Cloudflare), production adds:
  // "routes": [ { "pattern": "skreed.in", "custom_domain": true }, { "pattern": "www.skreed.in", "custom_domain": true } ]
  // With /api/* (Reserve section): "main", and "assets.run_worker_first": ["/api/*", "/r/*"]
}
```

There is no adapter, no KV and no Images binding: nothing needs provisioning before the first deploy. `404-page` serves `dist/404.html` once the 404 page exists (G1).

### 12.2 Headers

`public/_headers` holds the static rules. `scripts/csp.mjs` runs after `astro build` and appends the CSP line to the `/*` rule in `dist/_headers`.

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), gyroscope=(), accelerometer=(), magnetometer=()
  Strict-Transport-Security: max-age=31536000
  Content-Security-Policy: (generated)
/
  Cache-Control: public, max-age=0, s-maxage=60
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
/fonts/*
  Cache-Control: public, max-age=2592000
```

- **HTML** follows `00-IDEATION.md`: `max-age=0, s-maxage=60`. Each later HTML route adds its own exact-path rule, so no two `Cache-Control` rules match one path.
- **Hashed assets** are immutable.
- **Fonts** keep their fixed `/fonts/` URLs (type-system.md), so they get one month instead of immutable. A changed font file gets a new name.
- **HSTS** is one year, with no `includeSubDomains` and no `preload`, because skreed.in redirects to skreed.com after 31 October.
- **Permissions-Policy** gets `gyroscope=(self)` when the tilt card ships, and `camera=(self)` only if the week-two camera ships.

### 12.3 CSP (what the hero needs and why)

```
default-src 'self';
script-src 'self' 'sha256-<gate>' 'sha256-<loader>' 'sha256-<countdown>' <any other inline script Astro emits>;
style-src 'self' 'sha256-<each inline <style>>';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'self';
base-uri 'none'; form-action 'self'; frame-ancestors 'none';
upgrade-insecure-requests
```

**Why each source is allowed.**
- `img-src data:`: the loader builds its wordmark mask as an SVG `data:` URL at runtime.
- `connect-src 'self'`: the binaries, `pieces.json` and `ImageBitmapLoader` all use `fetch`.
- No `'unsafe-eval'`, no `'wasm-unsafe-eval'` (no Basis or KTX2), no `blob:`.
- Scripts that set `element.style.*` (loader mask, ride, labels, glitch) are CSSOM writes, which CSP allows. Markup `style` attributes are not allowed, and `csp.mjs` fails the build if one appears.

**Why a post-build script and not Astro's CSP.** Astro 7's `security.csp` writes a `<meta>` tag, does not hash `is:inline` scripts, and cannot carry `frame-ancestors` (browsers ignore it in a meta tag). Any byte change to an inline script changes its hash, so `csp.mjs` runs on every build.

**Later additions, each in its own section:**
- Turnstile: `script-src` and `frame-src https://challenges.cloudflare.com`.
- PostHog: its ingest host in `connect-src`.
- Cloudflare Web Analytics: `static.cloudflareinsights.com` in `script-src` and `cloudflareinsights.com` in `connect-src`. Until then the dashboard's auto-injected beacon stays off, or the CSP blocks it.

**Local verification.** `npx wrangler dev` serves `dist/` with `dist/_headers`. `curl -sI http://127.0.0.1:8787/` and a fetch of one `/_astro/` file show every header. The CSP Playwright spec listens for `securitypolicyviolation`.

## 13. Test plan and harness

### 13.1 Harness (`tests/harness/`)

The harness is ported from the readers' scratch scripts (`SCR/port/scripts/render.mjs`, `compare2.py`, `poster.py`, `sizes.mjs`) and `prototypes/hero-v9/shot.mjs`.

- **`browser.ts`.**
  - Chromium launch args `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
  - Three contexts:
    - phone canvas captures: 390 x 844 at deviceScaleFactor 1.25, so the screenshot equals the 488 x 1055 drawing buffer, as the asset probe measured;
    - phone behaviour: 390 x 844, `isMobile`, `hasTouch`, deviceScaleFactor 2;
    - desktop: 1280 x 800, deviceScaleFactor 1.5, buffer and screenshot 1920 x 1200.
  - `servePrototype(ctx)`:
    - fulfils `https://proto.test/` with `prototypes/hero-v9/index.html` (read-only, tracked in git);
    - routes `cdn.jsdelivr.net/npm/three@0.165.0/*` to the port's own `node_modules/three` (same version);
    - fulfils `fonts.googleapis.com` with a stylesheet whose `@font-face` points at `public/fonts/open-sans-400-600-latin.woff2`, so both pages draw text with the same file;
    - aborts everything else.
  - The prototype URL carries the locked values (`hero.md` section 0).
  - The port is served by `npx wrangler dev` on `127.0.0.1:8787`. The fallback is `astro preview` with a route that applies `dist/_headers`.
- **`settle.ts`.**
  - `waitReady(page)`: loader `state().ready` and `__skreedFrame` above 3.
  - `settleScroll(page, screens)`: `scrollTo`, then wait until `__skreedState().sb` equals the target at 4 decimals.
  - `freeze(page)`: set `__skreedFreeze`, then wait 2 frames.
  - `pinRandom(ctx)`: an init script that sets `Math.random = () => 0.5`.
  - `fixDate(page, iso)`: `page.clock.setFixedTime`.
  - `pauseCue(page)`: the cue animation paused at 0.
- **`canvas.ts`.** Hides `#intro, .site-logo, .copy, .cue, .tune, .labels, .fallback, .hero-poster`, then takes a screenshot of `#stage`.
- **`compare.py`.** PSNR and SSIM overall, sky band (top 40 percent) and ground band (bottom 35 percent), as `compare2.py`. It takes thresholds as arguments, exits non-zero on a miss, and writes an x8 difference map next to the frames.

### 13.2 Specs

| Spec | Covers | Method |
|---|---|---|
| `tests/unit/*.test.ts` (`node --test`) | maths helpers, `mapScroll`, `clipFor`, wipe texture checksum against the prototype function, shades by id, tokens against `DESIGN.md`, weights sum and order, delta-coded heights | pure functions |
| `parity/rest.spec.ts` | AC1.2 | freeze before load; canvas frames in normal motion and in reduced motion with `?tier=still3d`; both viewports; stage thresholds |
| `parity/overlay.spec.ts` | AC1.3 | canvas hidden, fixed date, same font, cue paused, random pinned; identical |
| `parity/pullback.spec.ts` | AC2.1 | `__skreedState().cam` at 0, 0.375, 0.75, 1.125 and 1.5 screens |
| `parity/wipe.spec.ts` | AC2.2 and AC2.3 | reduced motion, `still3d`, random pinned, tp 0.5 and 1; ride strings; tone; cue |
| `parity/loader-frames.spec.ts` | AC3.1 | `.ld-w` screenshots at nine `seek(t)` times |
| `e2e/locked-values.spec.ts` | AC1.1 | `__skreedParams()` against `hero.md` section 0 |
| `e2e/loader.spec.ts` | AC3.2 to AC3.7 | milestone order and monotonic progress; delayed sky route for "Slow connection"; `__skreedStall('c3')` for "Still loading"; `context.setOffline(true)` before ready; abort of the hero chunk; Tab order while loading; `/#x` keeps its scroll |
| `e2e/countdown.spec.ts` | AC4 | `page.clock` at three instants; type, roles, noscript; WebGL2 removed; chunk blocked; contrast sampled from the rest frame under the eyebrow, labels and numerals |
| `e2e/cue-logotype.spec.ts` | AC5 | cue classes at scroll 9 px, during the wipe and while loading; computed keyframes; logotype href, label, hit box, focus ring, click scroll; glitch slab count and ghost fills on enter, touch and focus; intro burst; poster path; reduced motion |
| `e2e/hover.spec.ts` | AC6 | the prototype's 40-move routine on both pages; `d` above 0.1; `__skreedFloorCheck()`; label count, readouts and hiding; ghost only on touch after 2.5 s |
| `e2e/tiers.spec.ts` | AC7 and AC8 | init scripts for WebGL2 removed, `saveData`, `effectiveType` 2g, `deviceMemory` 2; reduced motion; aborted chunk; `__skreedLoseContext()`; network log asserts no island requests on the tier cases; poster attributes and sizes; track 100svh |
| `e2e/csp.spec.ts` | AC10.5 | `securitypolicyviolation` listener on every path, under `wrangler dev` |
| `e2e/a11y-breakpoints.spec.ts` | AC10.3 and AC10.4 | one h1; `aria-hidden` on canvas and labels; no horizontal scroll and 16 px gutters at 360, 390, 430, 768, 1024 and 1280; tap targets; nothing animated in `dvh` |
| `scripts/budget.mjs` | AC9 | gzip level 9 and brotli quality 11 sizes of `dist/` files (method of `SCR/port/scripts/sizes.mjs`); classifies critical, island and first view per class; asserts `hero.md` section 6 |
| `scripts/guards.mjs` | AC10.6 | greps `dist/` |
| `scripts/lighthouse.mjs` | AC10.1 | three mobile runs against `wrangler dev`; median performance, LCP, CLS and TBT written to `docs/specs/screenshots/hero-lighthouse.json` |

**Screenshots** for the reviewer (B1):
- 3D path at rest: `docs/specs/screenshots/hero-390.png` and `hero-1280.png`;
- poster path: `hero-390-poster.png`;
- the prototype at the same moment for side by side: `hero-390-proto.png` and `hero-1280-proto.png`;
- the x8 difference maps: `hero-390-diff.png` and `hero-1280-diff.png`.

**Known limits.** Headless Chromium renders WebGL with SwiftShader. Pixel parity is exact because both pages use the same renderer. Lighthouse and timing numbers from SwiftShader are not representative of phones (see risks).

## 14. CI (`.github/workflows/ci.yml`)

```yaml
name: ci
on:
  pull_request:
  push: { branches: [main] }
  workflow_dispatch:
    inputs:
      deploy: { type: choice, options: [none, staging, production], default: none }
permissions: { contents: read }
jobs:
  verify:
    runs-on: ubuntu-24.04
    timeout-minutes: 90
    steps:
      - uses: actions/checkout@<pinned sha>          # fetch-depth 0 for gitleaks
      - uses: gitleaks/gitleaks-action@<pinned sha>  # security checklist row 4
      - uses: actions/setup-node@<pinned sha>        # node-version 22.22.0, cache npm
      - uses: actions/setup-python@<pinned sha>      # python 3.12
      - run: pip install pillow==12.3.0 numpy
      - run: npm ci
      - run: npm audit --omit=dev                    # row 18
      - run: npx playwright install --with-deps chromium
      - run: npm run test:unit
      - run: npm run build:test
      - run: npm run test:e2e && npm run test:parity # both start wrangler dev as the Playwright webServer
      - run: npm run build                           # production: astro build, then scripts/csp.mjs
      - run: npm run guards && npm run budget
      - run: npm run lighthouse
      - uses: actions/upload-artifact@<pinned sha>   # screenshots, diff maps, Lighthouse JSON, Playwright report
  deploy:
    needs: verify
    if: github.event_name == 'workflow_dispatch' && inputs.deploy != 'none'
    environment: ${{ inputs.deploy }}               # GitHub environments with Sam as required reviewer
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@<pinned sha>
      - uses: actions/setup-node@<pinned sha>
      - run: npm ci
      - run: npm run ${{ inputs.deploy == 'staging' && 'build:staging' || 'build' }}
      - run: npx wrangler deploy ${{ inputs.deploy == 'staging' && '--env staging' || '' }}
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**`package.json` scripts:**
- `build`: `astro build && node scripts/csp.mjs`.
- `build:test`, `build:staging`: the same, with the env flags of section 10.
- `test:unit`: `node --test tests/unit/`.
- `test:e2e`, `test:parity`: `playwright test --project ...`.
- `guards`, `budget`, `lighthouse`.
- `ci`: all of the above in the workflow's order, so the same gate runs locally without a push.

**`dependabot.yml`:** weekly npm and GitHub Actions updates.

Deploys are manual dispatches only. Nothing deploys on push until Sam turns it on.

**Before any push to main** (CLAUDE.md): `/web-design-guidelines` and the security checklist rows that apply. For a static page these are rows 1, 4 and 18.

## 15. Deployment

There are no Cloudflare credentials in this environment.

**Prerequisites:**
- A1: skreed.in's nameservers on Cloudflare (Prem).
- A2: a Cloudflare API token with Workers deploy rights, and the account id. Stored as GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` and as environment secrets here, never in the repo.

**Steps:**
1. **Locally, before any token.** `npm run build && npx wrangler deploy --dry-run` validates the config and the assets. `npx wrangler dev` serves the production build with the real headers.
2. **Staging (needs A2).** Dispatch the workflow with `deploy: staging`, or run `npm run build:staging && npx wrangler deploy --env staging` with the two variables set. It is served on the account's `workers.dev` subdomain with noindex. Then check:
   - every header with `curl -sI`;
   - brotli on the `.bin` files (section 6.3);
   - a Lighthouse run against staging;
   - Sam's look on his phone and laptop. This is also where the v9.8 stray-line check on a real GPU happens.
3. **Production (needs A1 and A2).** Add the two custom-domain routes to `wrangler.jsonc`, then dispatch `deploy: production`. Workers custom domains create the DNS records and the certificate on the zone. Turn on "Always Use HTTPS" in the zone.
4. **Rollback.** `npx wrangler rollback` to the previous version, or re-dispatch an earlier commit.
5. **Cutover (G20, not this section).** A Single Redirect rule `skreed.in/* -> https://skreed.com/$1`, 302 for about ten minutes of testing, then 301, at 31 October 23:59 IST. It is rehearsed a week early on a staging hostname. The teaser stays deployed for rollback. The exceptions for `/r/<code>` and `/thanks` are still undecided.

## 16. Risks

1. **Lighthouse C4 (90 or more).**
   - Geometry build, shader compile and the 4096 texture upload are long main-thread tasks. On SwiftShader the ground upload alone is about 1.1 s.
   - They fall inside Lighthouse's TBT window. The island starting after the poster decode helps LCP, not TBT.
   - If CI runs miss, the levers are moving the ground mesh build into smaller yields and `renderer.initTexture` spread across frames. Each lever changes timing and needs the weights re-measured. The checklist is not loosened.
2. **Visible-sky assumption.** The crops assume the hero camera covers every view of the sky dome (section 11.2 check).
3. **Lossless masters.** The lossless PNGs exist only in the scratchpad. If they are lost, every stage 2 encode starts from lossy WebP.
4. **VRAM and low-memory phones.** The 4096 ground is 85.3 MB of VRAM, and render targets add about 24 MB on a phone. iOS reports no `deviceMemory`, so low-memory iPhones are not gated. Context loss falls back to the poster, but a tab crash would not.
5. **Compression of `.bin` on Cloudflare** is unverified (section 6.3).
6. **Loader weights.** They must be re-measured after any start-up change (section 7.4). Stale weights make the fill stall or jump, though it never runs ahead.
7. **iOS address bar.** The prototype reads `innerHeight` every frame against a 460svh track, so URL-bar resizes shift `pr` slightly. This keeps parity; the risk is noted for the Sam device check.
8. **Spec conflicts.** The approved hero breaks several written rules (`hero.md` section 10). Until Sam codifies them, an adversarial reviewer may still FAIL them.
9. **Parallel work.** v10 and template7 are still changing. Renaming any id, class, global or milestone during the port would break both merges, so names are frozen as listed in sections 4 and 7.2.
10. **JS headroom.** The hero leaves 104.4 KB gz of the 250 KB gz page budget. GSAP with ScrollTrigger is 42.9 KB gz, SplitText and Flip add 11.2 KB gz, Lenis is 5.2 KB gz, and PostHog is about 50 KB. Those later sections must share what is left.
