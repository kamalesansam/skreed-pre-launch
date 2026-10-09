PAGE PLAN FOR proto/template7.html (+ build7.py)

1. REMOVE the Plot-scan-cut loader
- Delete:
  - lines 83-98 (inside /*LOADER-CSS*/../*LOADER-CSS-END*/)
  - line 102 (#intro svg markup and its noscript)
  - lines 103-197 (the plot/scan/cut script: G, WT, projector, tickFrame, __skreedLoaderReport weights, __skreedLoader with setProgress/cut)
- Keep both markers so build7.py's budget check still finds the block.
- Delete `window.__introDone` (line 1863) and the `introDone = !html.loading` initialiser (line 325). The intro owns introDone now.
- Line 1856: `if (introDone) intro(0.75)` becomes the B10 call at t=4.5.
- Delete setTimeout(noHero, 8000) (line 304). The loader watchdog (6 s note, 20 s poster) replaces it, and the error listener stays.
- build7.py:
  - Drop plot_data(), the /*PLOT*/ and /*WT*/ replacements and the loader_weights.json assert.
  - Change the loader budget print from 10000 to 3000.
  - Add an assert that the built page contains none of 'igloo_', '.ktx2', '.drc'.

2. NEW LOADER BLOCK (inline, about 2.8 KB raw)
- Markup:
  ```
  <div id="loader" aria-hidden="true"><div class="tape"><div class="strip" id="strip"></div></div><p class="note" id="ldNote"></p></div>
  <noscript><style>#loader{display:none}html.loading,html.intro{overflow:auto}</style></noscript>
  ```
  - <html class="loading intro">.
- CSS:
  - :root{--bgColor:#383F43}
  - html.loading,html.intro{overflow:hidden;overscroll-behavior:none}
  - html.loading body{background:var(--bgColor)}
  - #loader, .tape (--cw:.62em; 10-cell window), .strip span, @keyframes tape with steps(100) over 5 s infinite, .note, #loader img (poster, opacity transition 300 ms), and the reduced-motion static tape.
  - Reveal rules, driven by CSS vars set from JS:
    - .rv{position:relative}
    - .rv::after{content:"";position:absolute;inset:0;background:var(--pearl);transform-origin:0 50%;transform:scaleX(var(--p1,0));clip-path:inset(0 0 0 calc(var(--p2,0)*100%))}
    - .rv>.t{clip-path:inset(0 calc(100% - var(--p2s,0)*100%) 0 0)}
    - html.intro .site-logo{clip-path:inset(0 100% 0 0)}
    - html.intro .cue .ball, html.intro .cue .base{visibility:hidden}
  - Wrap the "Launch in" text, the .count row and the cue label in .rv>.t.
- Script:
  1. Build the strip from the TAPE constant (110 spans).
  2. Decide the poster path: window.__skreedPoster = !webgl2 || navigator.connection?.saveData || matchMedia('(prefers-reduced-data: reduce)').matches || !navigator.onLine.
  3. Watchdog interval of 500 ms: "Still loading" or "Slow connection" after 6 s without a milestone; poster after 20 s.
  4. Offline listener before ready leads to the poster.
- API:
  - `window.__skreedLoaderReport(m)`: the name is kept, so the module's existing report() calls work. It records the milestone and a timestamp.
  - `window.__skreedLoader = { ready(), setFade(tape, panel), remove(), fail(msg), hold(on), state() }`
    - ready() is called by the module after 'frame2' and resolves the gate.
    - setFade and remove are called by the module each frame from 0 to 0.8 s, so the fade runs on the intro clock.
    - fail(msg) switches to the poster.
    - hold(true) keeps the panel up after ready, for loader screenshots.
    - state() returns {phase, got:{m:ms}, pending, note, poster}.

3. MODULE CHANGES
a. Imports
- Replace the static `import` lines (308-314) with a guard plus dynamic imports:
  `if (window.__skreedPoster) throw 0;` then `const THREE = await import('three'); const {EffectComposer} = await import('three/addons/...')` and so on, in one Promise.all.
- Static imports are fetched before any guard runs, so data-saver and no-WebGL users would otherwise still download three.
b. New "INTRO" section, after the moon, fog and stones (about line 1345) and before the composer:
- Constants: O (from moonGroundAt(0,0)), P0, T0, PEARL, SLATE_SRGB, FLAT_LIN = (0.05666, 0.06642, 0.07234).
- Generators: genCage(seed), genOutline(PIECES), genTri(), genMosaic(), genAtlas() (awaits fonts).
- Three meshes added to sceneA: cageLines (LineSegments), outlineLines (LineSegments), numPoints (Points).
- Shared shader chunk INTRO_GLSL (linstep, falloff, falloffsmooth).
- Timeline: an ordered array of rows {target, from, to, start, dur, ease} matching the timeline table, plus set/call rows.
  - evalTL(tI) writes uniforms, visibility, bloom, the camera weights (w, touch, breathGate) and the UI CSS vars.
  - About 40 rows; evaluation under 0.1 ms.
- report('intro') when everything above is built.
c. logoMat
- Add U.uPrint (default 1) and U.tTri.
- Insert the B5 chunk before the non-ROCK gl_FragColor, with the alpha marker raised in the band.
d. Ground and stones
- onBeforeCompile appends the B6 chunk after the existing crumb and mist block.
- Uniforms: uU, uU2, uFloorA, uFarA, tTri, tMosaic, uO, uGlowCol.
- material.transparent = true, mesh.renderOrder = -1, depthWrite true.
e. Sky dome
- Add uFlat and uSkyP, plus the below-horizon rule (B7).
f. Composite
- Add uniforms uIntro (default 1) and uSlate.
- Final line of every mode: gl_FragColor.rgb = mix(uSlate, gl_FragColor.rgb, uIntro). The uMode 0 early return must go through this too.
g. Bloom
- Each frame during the intro: A.b.strength and A.b.threshold come from the timeline. The existing apply() keeps P.bloom for rest.
h. frame()
- Add an intro phase machine:
  - 'wait': not running.
  - 'armed': tI = 0; render; count frames → report('frame1'), report('frame2'), then __skreedLoader.ready().
  - 'run': tI += dtI.
  - 'done': at tI ≥ 8.2.
- Call evalTL(tI) before the blocks loop.
- Replace line 2017 with `live = phase==='done' ? 1 : (reduce ? 1 : touch)`.
- Multiply the breath term by breathGate.
- After basePos and baseTgt (with tail) are computed and before the parallax: if phase !== 'done', lerp them from P0 and T0 by w.
- Rock pump gate (line 2023): also require tI ≥ 5.1.
- Loader fade: __skreedLoader.setFade(1-G(tI/.25), 1-G(tI/.75)); remove at tI ≥ 0.766.
- At 5.0: remove html.intro and the touchmove block. At 8.2: remove html.loading.
- Delete the old texFrames/report('frame1'/'frame2') line (2131). The armed phase reports them.
i. Warm-up (replace lines 2161-2181) with A2 steps 6-9:
- Force everything visible: intro meshes, rockMesh, logo.
- Run compileAsync on sceneA, sceneR, sceneB and screenScene.
- initTexture every texture: sky, ground, scrollTex, fog noise, wind, tTri, tMosaic, atlas.
- Warm draws per material group into an 8x8 RT with mid uniforms; render composers A and B at 8x8; render the composite with uIntro .5.
- Restore, call resize(), then start the frame loop in 'armed'.
- Milestones: 'compile', 'c1..cN', 'warm', then 'frame1' and 'frame2'.
j. Textures
- Swap TextureLoader's implicit decode for an explicit image.decode() before initTexture, for sky and ground.
k. Fonts
- report('fonts') after document.fonts.load for Open Sans 600, Poppins 700 and Source Serif 4 400 (Promise.race with 3 s).
l. Reduced motion and skip
- At ready, set tI = 8.2 (all end values), phase 'done', loader fade 0.3 s, UI vars to 1, no plates.

4. HOW PROGRESS IS DRIVEN (module hooks, in order)
- import → fonts → b1..b10 → sky, ground (decode + initTexture) → intro → scene → compile → c1..cN → warm → frame1 → frame2 → ready.
- The loader shows none of this. It uses the milestones only for the stall note and the 20 s poster.
- ready() only ever comes from the module after frame2. There is no time-based cut.

5. TEST HOOKS
- `window.__skreedIntro = { state(), seek(t), play(), pause(), skip() }`
  - state() returns {phase, t, w, touch, breath, uIntro, cageP, cageA, numP, outP, outA, print, u, u2, floorA, farA, skyP, bloom, thr, camY, tgtY, ui:{logo, eyebrow, count, cue}}.
  - seek(t) pauses and evaluates exactly at t, also pinning uTime via __skreedSetT.
  - skip() jumps to the end state.
- Query params:
  - ?intro=0: skip.
  - ?introT=2.4: run the gate, then seek(2.4) paused.
  - ?loader=hold: hold(true).
  - ?poster=1: force the poster path.
- `__skreedLoader.state()` exposes milestone timestamps (ms), so tests can assert ready came after every milestone.
- Existing hooks are kept and extended: __skreedFrame, __skreedFreeze, __skreedSetT, __skreedProbe('A') (centre pixel at t=0 must be (56,63,67)), __skreedState (now also {introPhase, tI}).
- The clock uses rAF timestamps or performance.now only, so research/intro/scripts/hooks.js and capture.mjs drive it frame by frame.

6. ACCEPTANCE CHECKS (Playwright at 1280x800 and 390x844, 1/30 s steps)
- T1 hand-off: the centre and four 40px-inset pixels are (56,63,67) ±2 on every frame from the last loader frame to t=0.30.
- T2 same tick: the loader fade starts on the same frame as tI=0.
- T3 nothing compiles or uploads during the intro: renderer.info.programs.length and memory.textures are unchanged between ready, t=8.2 and t=12.
- T4 frame pacing on a real GPU (not SwiftShader), 0-8.2 s:
  - p95 frame ≤ 18 ms on desktop.
  - No frame over 50 ms.
  - No longtask over 50 ms from ready to 8.2.
- T5 the tape still moves during a 400 ms main-thread block injected before ready.
- T6 phase anchors at seek points:

  | t (s) | Expected |
  |---|---|
  | 0.5 | outline crown only |
  | 0.75-0.85 | first cage face |
  | 2.4 | cage at the frame edges (desktop) |
  | 2.3 | numbers ≥ 200 showing |
  | 3.75 | numbers 0 |
  | 1.40 | no logo pixels |
  | 1.50 | white cap |
  | 2.2 | band below the mark |
  | 3.5 | snow covers the desktop frame |
  | 7.5 | camera at hero ±0.01 |
  | 6.8 | UI settled |

- T7 rest identity: the frame at t=12 matches ?intro=0 (pinned) within a mean of 1 level, and matches the current rest frame within 1 level. This guards the transparent floor change.
- T8 no lines after 5.2 s: a 1px straight-line detector finds nothing the ?intro=0 frame lacks.
- T9 reduced motion: no cage, numbers or outline in any frame; the UI is present when the 300 ms fade ends.
- T10 poster with WebGL2 off and saveData emulated:
  - No request to three; the poster shows within 300 ms of DOMContentLoaded.
  - With a stalled texture route: the note shows at 6 s and the poster at 20 s.
- T11 checklist: no em dashes, no emojis, Open Sans only in the loader and the atlas, no box-shadow or text-shadow, colours from Slate, Pearl, Ember and the shades only. Run /web-design-guidelines.