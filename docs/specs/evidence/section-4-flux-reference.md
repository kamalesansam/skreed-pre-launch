# fluxtheory.in's home carousel, read from the build (evidence for docs/specs/section-4-flux.md)

Read 2026-10-22 from Sam's capture of www.fluxtheory.in (`www.fluxtheory.in.zip` at the repo root), unpacked and pretty-printed in a session scratchpad and read as text with grep, sed and ffprobe. Nothing in it was executed, no page was opened, no frame was rendered. The chunks are Shopify Oxygen's production bundle (React, react-three-fiber, GSAP, Lenis), which is why every name below is a one or two letter identifier; the line pointers are into the pretty-printed copies and are exact. Nothing of it ships: the carousel, the step, the shaders and the loops in section 4 are our own code and our own regenerated videos, and these numbers are what they are measured against.

## 1. How this was read

**The capture.** `www.fluxtheory.in.zip`, 14,427,471 B, 193 entries all dated 2026-10-22 13:06: `www.fluxtheory.in/index.html` (37,351 B), the site's `assets/models/bottles/` and `assets/textures/bottle-texture/` folders, the Shopify Oxygen asset folder `cdn.shopify.com/oxygen-v2/59192/169421/346366/4690733/assets/` (117 entries: the built chunks, the CSS, the hero's clips and posters) and the tracking pixels the page loads. It is untracked and named in `.git/info/exclude` (line 11), so `git status` does not show it and `git add -A` cannot stage it. The unpacked copy sits in a session scratchpad (`/private/tmp/claude-501/-Users-apple-Library-Application-Support-Claude-scratch-workspaces-b3fc6180-1578-46fe-918e-4706ccd4a481-1b0b6853-ef5f-4ad3-9a28-7fe923b0e694-scratch-2026-10-15-e4b8f1/318fb736-076b-47f9-9186-0e1a8ebc6d54/scratchpad/flux-ref/`); it may vanish, the zip is the record.

**The chunks.** Six files carry the carousel. They were pretty-printed in place so that one line is one statement, and every pointer below is `short name:line` into the pretty-printed copy. A few one-off pointers name their file in full (scrollRoot-CnBY1CED.js, useIsDesktop-JwJWKnL_.js, HeroScrollCue-Tv9c4Av5.js, lenis-react-CpwmkRjw.js, SmoothScroll-CvpIhmGb.js, overlayWipeState-ON3XOY-v.js, HomeV3Page-5VB90rQJ.css).

| Short name | File | Lines | What it holds |
|---|---|---|---|
| Scene.v2 | Scene.v2-CCx3P-cY.js | 4,241 | the carousel hook, the video planes, the clip state machine, the studio lights, the in-canvas fog, the canvas |
| HomeV3Page | HomeV3Page-BQHX0_dj.js | 2,935 | the home page: the hero, the two seam wipes (CloudTransition), the Lenis root, the section layout |
| BottleRigV2 | BottleRigV2-DU7pfyTY.js | 4,920 | the bottle rig, its label swap and cap swap, the environment; also lil-gui and five dead 3D scenes |
| SceneCaption | SceneCaption-C17gK76f.js | 198 | the captions and their timings |
| lenis | lenis-C9A3lpHu.js | 620 | the bundled Lenis |
| Scene.css | Scene-Dt0r93tC.css | 121 | the sticky canvas and the caption layout |

**The media.** The 14 scene clips inside the capture are not video: each is a 104 to 112 byte text file reading `No Content: https://cdn.shopify.com/.../<name>.mp4` (xxd of `bathroom-1-c-D_tcJ5Sd.mp4`, 106 B; ffprobe: moov atom not found). The real clips were downloaded from the same URLs (Scene.v2:3447-3460) into the scratchpad's `flux-videos/` (`.../4f1d30e2-96a0-4d42-9276-375f274eaa2e/scratchpad/flux-videos/`) and probed there (section 12). They are the files the site serves today, not files from Sam's capture. The hero's three clips were captured whole (section 15).

**What was not run.** No script in the capture was executed; the lil-gui preset JSON at Scene.v2:142-150 was read as data. Where a number is computed from the constants rather than read it says so.

## 2. The carousel geometry

| Value | Where |
|---|---|
| Ring radius 7 (`na = 7`, passed as `radius: na`) | Scene.v2:3523, :3845 |
| Placement `V(e, t, n)`: `x = -sin(t) x r`, `z = -cos(t) x r`, y 0, so angle 0 is the ring point straight ahead at (0, 0, -7) | Scene.v2:245-250 |
| Billboard: `rotation.y = atan2(camX - x, camZ - z) + faceRotations[e]`, so every plane faces the camera wherever it sits on the ring (the fallback when no camera is set is `-r + 6`, the same z of -1) | Scene.v2:251-254 |
| `faceRotations A = PI + extraYRotation`, with extraYRotation PI for every scene, so 2 PI: no extra turn; the preset's "Model Rotation" is 180 for each scene | Scene.v2:3518, :3527, :150 |
| Static placement `sa(A, i)`: index 0 at [0, 0, -7] with rotationY A[0]; the others at [0, 0, 7] with A[i] - PI | Scene.v2:3528-3534 |
| On mount `H(e, isFront)` parks every plane with `V(e, isFront ? 0 : sweep, +isFront)`: the front one at angle 0 with light factor 1, the rest at the sweep angle with factor 0 | Scene.v2:258-264, :287-289 |
| A plane is `visible` only while its index is in the visible set and the section is in view | Scene.v2:3906-3908 |
| Camera fixed at position [0, 0.2, -1] looking at [0, 0, -7]; it never rotates between scenes (the hook only ever moves the planes) | Scene.v2:3543-3546, :3590-3602 |
| Camera to ring point: sqrt(0.2 x 0.2 + 6 x 6) = 6.0 units (computed) | |
| Canvas camera fov 45, near 0.1, far 1000, at `$.position` | Scene.v2:4157-4162, :3995 |
| Cursor parallax: x 0.06 and y 0.02 of the camera to target distance, 0.5 s power2.out; off by default (`parallax: !1`) | Scene.v2:3584-3587, :4030 |
| Renderer: antialias on desktop only, alpha false, powerPreference high-performance, `outputColorSpace = 'srgb'`, `toneMapping = 4` (ACESFilmic), `toneMappingExposure = ra` with `ra = 1.8`, background black (`color attach="background" args=[0]`), dpr [1, 2] on desktop else 1 | Scene.v2:4155-4175, :3524 |
| Frame loop: `always` while the section intersects with more than 8 px visible, `demand` within a 100 percent rootMargin, else `never` | Scene.v2:4111-4121, :4155 |
| The canvas: `.scene-v2` sticky, top 0, 100vh, black, z-index 20, overflow hidden, inside `.scene-v2__scroll-section` (relative, pointer-events none) | Scene.css:1-10, :17-21 |

## 3. The step

| Value | Where |
|---|---|
| One GSAP tween: `fe()` tweens `D.t` from 0 to 1 over `st = 0.77` s on `ot = 'power2.out'`, calling `G(from, from + dir, dir, t)` on every update | Scene.v2:159-160, :294-304, :339 |
| Sweep `ia = 80` degrees, handed to the hook in radians | Scene.v2:3525, :4191 |
| Per frame `G(from, to, dir, t)`: outgoing `V(from, dir x sweep x t, 1 - t)`; incoming `V(to, dir x sweep x (t - 1), t)`; `U(t)` the fov; `W(from, to, t)` the bloom; `step = from + dir x t`; `frontIndex = t >= 0.75 ? to : from` (`at = .75`) | Scene.v2:283-286, :158 |
| So the outgoing plane swings from angle 0 to 80 degrees on its side of the ring and the incoming from -80 degrees to 0 on the other, both billboarded; each travels a chord of 2 x 7 x sin(40 degrees) = 9.0 units (computed) | |
| power2.out puts half the angle in the first 0.29 of t (0.22 s), three quarters by 0.5 (0.385 s), 90 percent by 0.68 (0.52 s) (computed from the ease) | |
| On complete: `G(from, to, dir, 1)`, `t = 0`, the index becomes `to`, `de(to)` moves the page, the visible set becomes {to}, the tween ref is cleared, the cooldown `j = now + et` with `et = 150` ms | Scene.v2:339-341, :153 |
| `de(r)` writes the page position to `T + r x K()` at once (`window.scrollTo(0, y)`, or the mobile scroll root's `scrollTop`), with `K() = innerHeight x 0.5` (section 6); the position the hook reads comes from the same root | Scene.v2:290-293, :21-24; scrollRoot-CnBY1CED.js:13-25 |
| Lenis is stopped (`Y`) as a step starts and restarted (`pe`) only when a gesture is refused and nothing is running | Scene.v2:322-325, :332-342 |
| The last scene: a forward gesture at the end calls `onForwardEdge` only when it exists; the home page passes `productEnabled: !1`, so it is undefined and the gesture restarts Lenis and falls through to the page | Scene.v2:339, :3855; HomeV3Page:2857 |

## 4. The field of view curve

`U(t)` at Scene.v2:265-274: `n = clamp(fovReturnAt, 0.01, 0.99)`; `r = t <= n ? t / n : (1 - t) / (1 - n)`; `i = r x r x (3 - 2 x r)`; `fov = base + (transition - base) x i`; the projection matrix is updated only when the change is 0.001 or more. Base `Da = 45`, transition `Oa = 42`, `fovReturnAt ka = 0.65` (Scene.v2:3995-3997, passed at :3851-3853). The preset records Camera FOV 45, Transition FOV 42, Sweep Angle 80 (Scene.v2:144-148). So the fov is 43.5 at t 0.325, 42 at t 0.65, 43.5 at t 0.825 and 45 at t 1 (computed), a cubic smoothstep down and a cubic smoothstep back, the return taking the last 0.35 of the step. On a scroll resync `U(0)` puts it back to the base at once (Scene.v2:316).

Note that the video planes are cover-fitted every frame from the current fov (section 7), so the pinch does not zoom the background: it enlarges the bottle and steepens the perspective on the swinging planes (inferred from the code; no frame was rendered).

## 5. The gesture rules

| Rule | Where |
|---|---|
| Wheel: a window listener with `passive: false`; the step direction is `sign(deltaY)` | Scene.v2:343-371 |
| Wheel burst filter: a burst ends after `rt = 200` ms of silence (the consumed flag and the peak reset); the peak `F = max(F, |deltaY|)`; while a burst is consumed, a gesture during the tween or the cooldown is swallowed with preventDefault, and a delta under `it = 0.5` of the peak is swallowed; a larger delta ends the burst and becomes the new peak; a step that runs marks the burst consumed | Scene.v2:156-157, :343-368 |
| Keys: ArrowDown and PageDown +1, ArrowUp and PageUp -1, Space (or "Spacebar") +1 and Shift+Space -1; ignored when `defaultPrevented`, `ctrlKey`, `metaKey` or `altKey`; any other shifted key is left alone; a target that `isContentEditable` or whose tag is input, textarea, select or button is left alone | Scene.v2:372-387 |
| Touch: touchstart records `clientY` (passive); touchmove steps once per touch when `|startY - y| >= nt` with `nt = 12` px, direction by the sign, with preventDefault; after that step every further move of the same touch is preventDefault-ed while in range; touchend and touchcancel reset | Scene.v2:155, :388-415 |
| `he(dir, prevent)`: refused when disabled; swallowed (Lenis stopped, preventDefault) while the overlay wipe is active, while a tween runs or `now < cooldown`; refused and Lenis restarted when out of range; out-of-range targets refused except the product handoff; otherwise the visible set becomes {from, to}, Lenis stops, preventDefault, and the tween starts | Scene.v2:332-342 |
| `me()` re-measures the section top when idle and resyncs the step on entering the range | Scene.v2:326-331 |
| preventDefault happens at window level: wheel (`passive: false`), keydown, touchmove (`passive: false`) | Scene.v2:369-371, :387, :409-411 |
| The seam wipe also captures wheel and touchmove at window level with `capture: true` and `stopImmediatePropagation` while it runs; the product handoff captures wheel, touchmove and keydown the same way | HomeV3Page:2166-2175; Scene.v2:460-477, :525 |
| The overlay state shared between the page and the canvas is `{cover, autoActive, consumeGesture}`; `cover >= 0.7` counts as covered | overlayWipeState-ON3XOY-v.js:20-28 |

Inside the carousel there is no scrubbing and no half-way pull: every gesture is one whole step or nothing.

## 6. The scroll mapping and the section

| Value | Where |
|---|---|
| Step height `$e = 0.5`; `K() = innerHeight x 0.5` (50vh of scroll per scene) | Scene.v2:152, :290 |
| The section top `T = rect.top + scrollY`, measured on mount and on resize | Scene.v2:224-231 |
| In range while `scrollY` is within `[T - tt, T + (count - 1) x K + tt]` with `tt = 2` px | Scene.v2:154, :305-310 |
| Scroll to step `J()`: `index = clamp(round((scrollY - T) / K), 0, count - 1)`; on a change every plane is re-parked (`H`), the fov reset, step and frontIndex set, the visible set {index}; exported as `syncToScroll` and called by the page after a seam jump | Scene.v2:311-321, :3838-3841 |
| Section height `(count - 1) x $e x 100 + (productEnabled ? Yi + 10 : 0) + Xi + trailingHoldVh` vh, with `Yi = 90`, `Xi = 100` | Scene.v2:4143, :3509-3510 |
| The home page passes `productEnabled: !1` and `trailingHoldVh: 40 + an` with `an = 40`, so 4 x 50 + 100 + 80 = 380vh; the placeholder before the chunk loads is `nn + 40 + an` = 380 too (`nn = 300`) | HomeV3Page:2857-2858, :2715, :2712, :2745, :2862-2863 |
| The scenes occupy `T` to `T + 200vh`; the canvas stays stuck until `T + 280vh`; the shop's seam marker sits 40dvh above the section's end (section 8) | computed from the above |

## 7. The video plane

| Value | Where |
|---|---|
| A 1 x 1 `planeGeometry` with a `meshBasicMaterial` (`toneMapped: false`, `side: 2`), so the video is unlit and the canvas's ACES exposure does not touch it | Scene.v2:3432-3445 |
| Cover fit `hi()` every frame: `o = distance(camera, plane)` (or 0.001); `c = 2 x tan(fov / 2) x o` (the view's height at that distance); `l = c x (width / height)`; `u = l / c` (the viewport aspect); `f = videoWidth / videoHeight`, or `u` until metadata; if `f > u` then height `c`, width `c x f`, else width `l`, height `l / f`; `scale.set(width x 1.01, height x 1.01, 1)` (`oi = 1.01` overscan) | Scene.v2:3196, :3220-3239 |
| At rest the plane is 2 x tan(22.5 degrees) x 6.0 = 4.97 units tall (times 1.01); with a 1700 x 884 clip (aspect 1.923) it is 9.56 wide, so a 1280 x 800 view shows 82 percent of the frame's width and a 390 x 844 phone the centre 24 percent (computed; the phone chunk itself was not captured, section 15) | |
| The material is black (`color.setScalar(0)`) while the clip state is `wait` and full colour (1) otherwise; the map is the intro texture in `wait` and `intro`, the loop texture in `loop`, the outro (or the intro when there is none) in `outro`; `needsUpdate` only when the first map is set | Scene.v2:3346-3356 |
| Clip config `ri`: `startAt 0.5`, `clipStartAt 0.5`, `softness 0.64`, `boost 0.17`, `floor 0.01`; the plane takes `clipStartAt` as its `startAt` | Scene.v2:3140-3146, :3431 |
| State machine `Oi()`, per frame: proximity `_ = clamp(1 - |step - sceneIndex|, 0, 1)`; direction +1 when `_` rises by more than `di = 5e-4`, -1 when it falls by more than 5e-4; `_ <= 0` means `wait` with both clips paused and reset to 0 | Scene.v2:3307-3332, :3215 |
| `wait` to `intro` when the direction is +1 and `_ >= startAt` (0.5, half way through the sweep): the loop is pre-rolled with `Ti(loop, remainingIntro / playbackRate - wi)` (`wi = 0.07`), that is `loop.currentTime = (duration - t mod duration) mod duration` when that time is buffered, so it reaches 0 as the intro ends | Scene.v2:3334-3336, :3294-3299 |
| `intro`: direction -1 plays the outro from `outroDuration - introCurrentTime` and goes to `outro`; the intro ended (`currentTime >= duration - _i`, `_i = 0.012`, or `ended`) pauses it, runs `Ei(loop)` (seek to 0 if it drifted past `Ci = 0.15` s and 0 is buffered) and goes to `loop`; else keeps playing at `bi = 1` | Scene.v2:3337-3339, :3278-3285, :3300-3302 |
| `loop`: direction -1 plays the outro from 0 and goes to `outro` | Scene.v2:3340-3342 |
| `outro`: direction +1 pauses it and goes back to `loop`; else it plays until ended | Scene.v2:3343-3344 |
| So the incoming plane is black for the first half of the sweep and its intro (1 s) starts at the half; the outgoing plays its outro (1 s) while it leaves and is cut to black at the end of the 0.77 s step (inferred from the machine and the clip lengths) | |
| Loop play and pause `ni()`: active (playing) when the proximity `> Gr = 0.3` or while the proximity is falling; reset (pause and `currentTime = 0`) when it is `<= Kr = 0.02`; a watchdog every `Wr = 2000` ms re-asserts play or pause and restarts an ended loop; play is also re-asserted on loadedmetadata, canplay, pause, ended, visibilitychange and the first pointerdown | Scene.v2:2998-3002, :3015-3028, :3100-3138 |
| Loop elements `Jr()`: a `<video>` appended to body, 16 x 16 px, fixed, opacity 0.02, z-index -1, aria-hidden, `crossOrigin anonymous`, muted, `loop = true`, playsInline, `preload auto`; its `src` is the blob URL from `Nr()`, then `load()` | Scene.v2:3004-3013 |
| Preload `Nr(url, {priority})`: `fetch(url, {priority})`, `blob()`, `URL.createObjectURL`, cached in a Map; on any failure the promise resolves to the plain URL, so a direct `src` is a path the reference already takes | Scene.v2:2820-2835 |
| Scene 0's three clips are fetched with `priority: 'high'`, the rest `'low'`; nothing registers with the page preloader | Scene.v2:3373-3390 |
| Intro and outro elements `ii()` are the same with `loop = false`; after `loadeddata` a clip at 0 is nudged to `currentTime = 1e-4` | Scene.v2:3148-3151, :3183-3188 |
| Seamless loop: `loop = true` on the element, no cross-fade; continuity is the `Ti` pre-roll and the `Ei` reset at the intro to loop cut; first frame equals last frame is a content convention, not enforced in code | Scene.v2:3006, :3294-3302 |
| Safari: when `navigator.vendor` is `Apple Computer, Inc.` the texture is a `CanvasTexture` fed by drawImage from the video (nearest filtering, no mipmaps) under a manual clock `Hr()` that advances `currentTime` itself and wraps play, pause, paused, ended and currentTime; elsewhere a `VideoTexture`; colour space sRGB on both | Scene.v2:2850-2871, :2877-2997 |

## 8. The cloud wipe

The fbm cloud is not the per-step transition. It is a page-level overlay (`CloudTransition`) drawn on its own WebGL canvas at the two section seams of the home page, hero to scene and scene to shop, and an in-canvas copy (`HandoffFogWipe`) is used only for the product handoff, which the home page does not enable.

### 8.1 Constants and the cover curve

| Value | Where |
|---|---|
| `bt = 0.25`, `xt = 0.45`, `St = 0.7` | HomeV3Page:1916-1918 |
| Passive cover `Ct(top, vh) = clamp(1 - (|top - 0.7 x vh| / vh - 0.25) / 0.45, 0, 1)`: 1 while the marker's top is within [0.45vh, 0.95vh], 0 at and beyond a distance of 0.7vh from 0.7vh; evaluated only while `top <= Ot x vh` with `Ot = 1` and only while the seam is disarmed (`!w.current`; `w` starts true and is re-armed whenever the top is past 1.05vh, disarmed when a wipe lands or by the page's `disarm()`), so in ordinary scrolling it is the near-zero cover under the first 16 px of a scroll back up before the reverse wipe fires; the forward wipe starts from `gatherFrom`, not from this value | HomeV3Page:1919-1924, :1929, :2115, :1990, :2087, :2122, :2127, :2152-2154 |
| The passive value goes through the quintic `Mt(e) = e x e x e x (e x (e x 6 - 15) + 10)` before the shader; an active wipe passes its raw cover | HomeV3Page:1933, :2140 |
| Auto timings: defaults `wt = 800` (outMs), `Tt = 800` (inMs), `Et = 400` ms gesture lock after a wipe; the home page overrides `inMs = on = 280` and `outMs = sn = 360` on both seams | HomeV3Page:1925-1927, :2716-2717, :2837-2845, :2873-2879 |
| `Dt = 0.96` (the in phase counts as complete when the cover reaches it), `kt = 1.05` (re-armed when the marker's top is past 1.05vh), `At = 1.1` (a reverse wipe lands 1.1vh above the marker when no `reverseLandTarget` is given), `jt = 16` px (a reverse wipe fires when the marker's top crosses from at most 16 px to more while scrolling up) | HomeV3Page:1928-1932, :2087, :2128-2131 |
| In ease `Nt(e) = 1 - (1 - e) x (1 - e)` | HomeV3Page:1934 |
| Out curve `Ft(n, e)` with `Pt = 0.78`: for `n < e` the cover drops linearly from 1 to 0.78; after that `0.78 x (1 - smoothstep)` to 0; `e = min(0.55, 120 / outMs)` when outMs is under 500 ms, so 0.333 at 360 ms (the knee at 120 ms) | HomeV3Page:1935-1943, :2111-2112 |
| The lock `re()`: `autoActive` for `Et` 400 ms, then `consumeGesture` is set unless the whole wipe took under 80 ms | HomeV3Page:2060-2074 |

### 8.2 The forward and reverse sequences

Forward (HomeV3Page:2118-2127, :2089-2109): the marker is armed once its top has been past 1.05vh; when scrolling down with the top at or under 1vh for two consecutive frames the wipe fires. Phase `in`: cover from `gatherFrom` (0 on the home page; `p.from = n ?? P`) to 1 over inMs on `Nt`, the scroll pinned at `markerAbs - 1vh` with Lenis stopped and re-pinned whenever it drifts by more than 2 px; it ends at full time or at cover 0.96. Phase `out`: the scroll is jumped to `markerAbs` (the next section's top at the viewport's top), cover from 1 to 0 over outMs on `Ft`; then `re()`. Reverse (HomeV3Page:2128-2133): scrolling up as the marker's top crosses 16 px, `in` to 1 pinned at the marker, then `out` landing at `reverseLandTarget` (0 on the hero seam, which also calls the hero's reset) or 1.1vh above the marker. The canvas is hidden (opacity 0, visibility hidden) when the cover is at or under 5e-4 and no wipe is active (HomeV3Page:2136-2139).

### 8.3 Layout of the seams

The hero section is `calc(100dvh + 40dvh + 40dvh)` tall with `pt = 40` (HomeV3Page:1666-1671, :1056). Each seam's marker is a 1 px, 0 height div at `bottom: 40dvh` inside the hero wrapper and inside the scene wrapper (HomeV3Page:2828-2834, :2865-2872); the scene wrapper and the shop are pulled up by `marginTop: -40dvh` (HomeV3Page:2846-2851, :2880-2883), so each next section starts 40dvh under the previous one's end. Computed from these: the hero's marker is at 140dvh, so the wipe fires after 40dvh of hero scroll (the marker's top at 1vh), covers over 280 ms with the page pinned at 40dvh, and jumps to 140dvh, which is the carousel's `T`, under the 360 ms out. The scene's marker is at `T + 340vh`, so after the last scene's slot at `T + 200vh` there are 40vh of plain native scroll (scene 5 still stuck on the canvas, the gestures no longer captured) before the wipe fires at `T + 240vh` and jumps to `T + 340vh`, the shop's top. The 80vh trailing hold is therefore 40vh of scroll on the last scene and 40vh hidden under the shop's pull-up. The seam is armed whenever the marker's top is past 1.05vh, so the cloud is never seen rising before the wipe fires.

### 8.4 The overlay canvas

Its own WebGL context (`alpha: true`, `premultipliedAlpha: true`, `antialias: true`, `depth: false`), dpr capped at 1.5, one 4-vertex `TRIANGLE_STRIP` quad from `[-1, -1, 1, -1, -1, 1, 1, 1]` (HomeV3Page:1999-2009, :2047, :2024); `.cloud-transition` is fixed, inset 0, z-index 30, pointer-events none, opacity 0 and visibility hidden at rest (HomeV3Page-5VB90rQJ.css:121-131). Per frame: `uTime = (now - mount) / 1000` s, 0 under prefers-reduced-motion; `uProgress` = the cover (raw while active, `Mt(cover)` when passive); `uResolution` = the canvas's pixel size (HomeV3Page:2136-2140). The colour is the same at every seam; there is no per-scene tint.

### 8.5 The shaders, as formulas

Not copied: the source text is at HomeV3Page:1831-1838 (vertex) and :1839-1915 (fragment) for the page overlay, and Scene.v2:668 (vertex) and :669-725 (fragment) for the in-canvas copy. Every constant is below; the in-canvas copy differs only where marked.

1. Vertex, overlay: a clip-space quad from `aPosition` with `vUv = aPosition x 0.5 + 0.5`. In-canvas: the standard projected plane with `vUv = uv`.
2. Uniforms, overlay: `uTime`, `uProgress` (0 clear, 1 full white-out), `uResolution`. In-canvas: `uOpacity` in place of `uProgress`, `uTime`, `uAspect`.
3. `hash(p)`: `p = fract(p x (123.34, 456.21))`; `p += dot(p, p + 45.32)`; `fract(p.x x p.y)`.
4. `noise(p)`: value noise on the integer lattice, `i = floor(p)`, `f = fract(p)`, the four corner hashes mixed bilinearly by a fade `u`. Overlay: the quintic `u = f x f x f x (f x (f x 6 - 15) + 10)`. In-canvas: the cubic `u = f x f x (3 - 2 x f)`.
5. `fbm(p)`: 6 octaves, amplitude 0.5 halving each octave, `p = mat2(1.6, 1.2, -1.2, 1.6) x p` after each.
6. The domain. Overlay: `aspect = res.x / max(res.y, 1)`; `p = ((vUv.x - 0.5) x aspect, vUv.y - 0.5)`. In-canvas: `p = (vUv - 0.5) x 2` then `p.x x= uAspect`.
7. `p x= mix(1.35, 0.92, progress)` (a zoom out as the cover rises).
8. `t = uTime x 0.03`; `clouds = fbm(p x 2.6 + (t, 0.4 t)) + 0.35 x fbm(p x 5.5 - (1.3 t, 0.7 t))`; `clouds /= 1.35`.
9. `density = smoothstep(0, 0.55, clouds + 1.9 x progress - 1)`; then `density = max(density, smoothstep(0.72, 1, progress))` so the core is opaque near full cover whatever the noise does.
10. `col = mix((0.80, 0.84, 0.93), (1, 1, 1), density)`.
11. Output. Overlay: `(col x density, density)`, premultiplied, because WebKit composites the overlay canvas as premultiplied whatever the context flag says. In-canvas: `(col, density)`, straight alpha, blended inside the opaque three.js canvas.

### 8.6 The in-canvas copy

`kt` (HandoffFogWipe, Scene.v2:631-728): a 1 x 1 plane kept 0.25 units in front of the camera along its view, copying the camera's quaternion, scaled `(a x aspect, a, 1)` with `a = 2 x tan(fov / 2) x 0.25`; `renderOrder 1000`, `frustumCulled false`, `depthTest` and `depthWrite` off, `toneMapped false`, `transparent`; hidden when its opacity is at or under 0.001. It is driven only by the product handoff: opacity 0 to 1 over `_t = 0.65` s power2.in, then 1 to 0 over `vt = 0.8` s power2.out starting at 0.65 s, with `Tt()` locking wheel, touchmove and keydown for the duration (Scene.v2:434-436, :525-542). `yt = 1.1` sits beside them unread here.

## 9. The bottle rig

| Value | Where |
|---|---|
| One shared bottle, not one per scene: the rig's group takes `sa(A, 0).position = [0, 0, -7]` and `rotationY = A[0]` | Scene.v2:3969-3978 |
| Offsets `offsetX 0`, `offsetY 0`, `offsetZ Jr = 2.6`, `scale qr = 10` (`setScalar`), `rotationY 0`, `capSink si = 0.05`; so the bottle stands at z -4.4, 2.6 units in front of the ring point and 3.4 in front of the camera; the preset agrees (Position Z 2.6, Scale 10) | BottleRigV2:4660-4662, :4762-4769, :4793, :4848; Scene.v2:150 |
| Per frame: `rotation.y = rotationY + rig rotationY + ri x PI x step + cursorX x Zr + idleSway`, `ri = -1` (minus 180 degrees per carousel step, on the fractional step so it turns during the sweep), `Zr = 0.3`; `rotation.x = rotationX + cursorY x Xr`, `Xr = 0.3`; the cursor smoothed by `w = 1 - 0.9 ^ (dt x 60)` | BottleRigV2:4663-4664, :4670, :4844-4852 |
| The rig accepts an `idleSwayRef`; Scene.v2 passes none, so there is no idle sway in this build | BottleRigV2:4725; Scene.v2:3969-3978 |
| Visible only when the flight override is not hidden and the front scene is enabled | BottleRigV2:4842-4844 |
| Per-scene colour is a label texture, not a material: `/assets/models/bottles/flux-bottle-v2.glb` with meshes named `Label` (front) and another `Label*` (back); material roughness 0.22, metalness 0.2, colour 0xF0F0F0, transparent, side 2; map `/assets/textures/bottle-texture/{persona}_front_asset.webp` per persona (dreamer, lover, rebel, sage, sport); the capture holds the two GLBs (462,460 and 460,884 B) and the five front textures (427,548 to 470,335 B), no back textures | BottleRigV2:4652-4657, :4677-4683, :4701-4710; the zip listing |
| Label swap: even steps show the front mesh, odd steps the back; within 0.02 of a whole step (`ai = 0.02`, or past 0.98) the front persona's texture is applied to the mesh that faces; otherwise below the half (`ii = 0.5`) the incoming persona's texture goes on the mesh about to face, above it the outgoing's stays | BottleRigV2:4671-4672, :4858-4875 |
| Dreamer cap swap: node `NEW_BASE008` (the standard cap) sinks by `capSink` 0.05 over `Qr = 0.125` s power2.in and `NEW_BASE003` from `bottle-dreamer-v1.glb` rises over `$r = 0.255` s power4.out after `ei = Qr x 0.4` = 0.05 s, whenever the front persona becomes or stops being `dreamer` | BottleRigV2:4665-4669, :4673-4674, :4809-4814, :4876-4905 |
| Environment: a PMREM from a synthetic `RoomEnvironment` (blur 0.04); `envMapIntensity = (label ? li 0.45 : body ci 0.5) x Kr(exposure)` with `Kr = 0.2 / exposure` and the exposure `ra = 1.8`, so 0.05 on the labels and 0.056 on the body | BottleRigV2:4658-4659, :4675-4676, :4817-4825; Scene.v2:3977 |
| Studio lights `jr`: a group at `[0, Yr, -7 + Jr]` = (0, 0.1379, -4.4), rotation `[0, PI, 0]`, holding 11 Blender-exported lights with coordinates converted by `(x, z, -y)` and energies scaled by `Kr(1.8)` = 0.111; the colour tween step is capped at `Tr = 0.1` s | Scene.v2:3962-3968, :2505-2612, :2618-2621, :2634, :2745-2756; BottleRigV2:4660-4662 (`Yr = 0.1379`, `Jr = 2.6`, exported as `t` and `n`, imported as `ze` and `Fe` at Scene.v2:115, :111) |
| The one light that changes per scene: `Area.007`, a DISK area light, energy 41.508, base colour (1, 0.3413, 0.9861), position (0.2374, 3.7584, 0.4185), rotation (-88.916, -41.583, 79.802) degrees; tinted `one #ffa6c8`, `five #ffa171`, `two #a8ffe0`, `three #cbb0ff`, `four #ffc9a3`; lerped with a cubic smoothstep over `gr = 1.1` s whenever the front index changes | Scene.v2:2451, :2477-2489, :2500, :2577-2587, :2745-2756 |

## 10. The captions

| Value | Where |
|---|---|
| Per scene id: an uppercase title ("THE" and the persona), a link to the product page when there is one (the dreamer is "coming soon" with none), three short subtitle phrases, and a description whose first line is the product's name in bold | SceneCaption:30-86 |
| `.scene-v2__caption`: absolute, inset 0, z-index 5, pointer-events none, `aria-live="polite"`; a `::before` gradient 24vh tall at the bottom from transparent to `#000000d9` | Scene.css:53-68; SceneCaption:187-196 |
| Each pair: `absolute inset-0 bottom-0 p-8 flex items-end gap-6`, opacity 0 and visibility hidden at rest; left column `flex-col gap-5`: the heading `clamp(2rem, 6vw, 5.5rem)`, weight 700, line-height 0.94, letter-spacing -0.05em, uppercase, white, max-width 42vw; the subtitle row `clamp(0.85rem, 4vw, 1.1rem)`, uppercase, weight 500, phrases separated by 4 px white dots; right: `p.scene-v2__caption-desc` with `margin-left: auto`, max-width `min(24rem, 30vw)`, `clamp(0.9rem, 1.1vw, 1.15rem)`, weight 400, line-height 1.35, colour `#ffffffb3` | SceneCaption:137-173; Scene.css:70-109 |
| At or under 720 px: heading and description left-aligned at max-width `calc(100% - 3rem)`; the description absolutely placed at bottom `clamp(1.5rem, 6vh, 4.5rem)`, left `clamp(1.5rem, 4vw, 4.5rem)` | Scene.css:111-121 |
| Swap timing: on a scene change the showing pair exits (opacity 0, 0.32 s power2.in); after `l = 320` ms the id switches and the new pair enters (visibility visible, opacity 1, `d = 0.2` s power2.out); the heading's blur sweep `m = 0.5` s; the subtitles `h = 0.3` s with stagger `g = 0.015`; the description `f = 0.25` s with stagger `p = 0.012` | SceneCaption:22-29, :97-123, :176-186 |
| The whole caption, the scroll cue and the skip button fade over 500 ms (`transition-opacity duration-500`) while the product handoff is active | Scene.v2:4206-4225 |
| Scroll cue: variant `center`, `fadeOutAt: 0` (so it never fades), bottom `clamp(20px, 3.4vh, 32px)`, a 26 x 42 rounded rectangle (rx 11.5, stroke at 20 percent) with a dot; plus a skip-to-products button when the page gives one | Scene.v2:4214-4225; HeroScrollCue-Tv9c4Av5.js:29-69 |

## 11. The scenes

| Index | Id | Label | Persona | Loop | Intro | Outro | Where |
|---|---|---|---|---|---|---|---|
| 0 | one | Scene One | sport | bathroom-1-c-D_tcJ5Sd.mp4 | bathroom-1-c-intro-CPvToolp.mp4 | bathroom-1-c-outro-DapssKxz.mp4 | Scene.v2:3467-3475 |
| 1 | two | Scene Two | sage | bathroom-2-DeieLUq2.mp4 | bathroom-2-intro-SzjShx9h.mp4 | bathroom-2-outro-CWEGBWZQ.mp4 | :3475-3483 |
| 2 | five | Scene Five | rebel | bathroom-5-DFzbEF-b.mp4 | bathroom-5-intro-DKc22faz.mp4 | bathroom-5-outro-CLj-AE35.mp4 | :3483-3491 |
| 3 | four | Scene Four | lover | lover-loop-1-DPc_VaZZ.mp4 | lover-intro-1-Y1b5IZA7.mp4 | none | :3491-3498 |
| 4 | three | Scene Three | dreamer | dreamer-loop-BR-Inb7Q.mp4 | dreamer-intro-KvqPOREG.mp4 | dreamer-outro-C6q3nB0P.mp4 | :3498-3506 |

All URLs are under `https://cdn.shopify.com/oxygen-v2/59192/169421/346366/4690733/assets/` (Scene.v2:3447-3460). The mode is `Ki = CLIPS` (intros and outros on) and `Wi = false` (Scene.v2:3461-3466). The light group's own scene list names them in the preset's order, one, five, two, three, four (Scene.v2:2452-2471); the carousel's order is the table above.

## 12. The clips, probed

ffprobe of the downloads in `flux-videos/`. Every file: h264 High, 1700 x 884, yuv420p, 30 fps (`r_frame_rate` 30/1), no colour tags (primaries, transfer, matrix and range all unknown).

| File | Bytes | Frames | Seconds |
|---|---|---|---|
| bathroom-1-c-D_tcJ5Sd.mp4 (loop) | 773,106 | 96 | 3.200 |
| bathroom-1-c-intro-CPvToolp.mp4 | 363,043 | 30 | 1.000 |
| bathroom-1-c-outro-DapssKxz.mp4 | 303,235 | 30 | 1.000 |
| bathroom-2-DeieLUq2.mp4 (loop) | 914,806 | 96 | 3.200 |
| bathroom-2-intro-SzjShx9h.mp4 | 408,986 | 30 | 1.000 |
| bathroom-2-outro-CWEGBWZQ.mp4 | 373,104 | 30 | 1.000 |
| bathroom-5-DFzbEF-b.mp4 (loop) | 615,413 | 97 | 3.233 |
| bathroom-5-intro-DKc22faz.mp4 | 279,922 | 30 | 1.000 |
| bathroom-5-outro-CLj-AE35.mp4 | 255,152 | 30 | 1.000 |
| lover-loop-1-DPc_VaZZ.mp4 (loop) | 844,694 | 95 | 3.167 |
| lover-intro-1-Y1b5IZA7.mp4 | 568,817 | 30 | 1.000 |
| dreamer-loop-BR-Inb7Q.mp4 (loop) | 533,011 | 127 | 4.233 |
| dreamer-intro-KvqPOREG.mp4 | 289,746 | 30 | 1.000 |
| dreamer-outro-C6q3nB0P.mp4 | 279,970 | 30 | 1.000 |

The five loops are 3,681,030 B, the five intros 1,910,514 B, the four outros 1,211,461 B: 6,803,005 B for the set, all fetched at mount as blobs (section 7). Loop lengths in carousel order: 3.20, 3.20, 3.23, 3.17 and 4.23 s. Every intro and outro is exactly 1.0 s.

## 13. Lenis

| Value | Where |
|---|---|
| Home page options: `autoRaf: false`, `duration: 1.2`, `smoothWheel: true`, and `syncTouch: true` only when `rn` (the viewport under 1024 px); the root is `true` (window) on desktop and `'asChild'` (a wrapper div with `data-scroll-root`) under 1024 px | HomeV3Page:2801-2814, :2714; useIsDesktop-JwJWKnL_.js:6 (`(min-width: 1024px)`); lenis-react-CpwmkRjw.js:100-108 |
| `lenis.raf` is driven from `gsap.ticker` with `lagSmoothing(0)`; ScrollTrigger refreshed on the next frame | HomeV3Page:2786-2794 |
| Bundled defaults: `lerp 0.1`, `syncTouchLerp 0.075`, `touchInertiaExponent 1.7`, `wheelMultiplier 1`, `touchMultiplier 1`, `infinite false`, `overscroll true`, `smoothWheel true`, `syncTouch false`, `anchors false` | lenis:225-245 |
| A numeric duration with no easing takes `p(t) = min(1, 1.001 - 2 ^ (-10 t))`; duration and easing win over lerp in `advance` | lenis:201, :521, :31-37 |
| The page has no loop: `infinite` is false and the hero seam's reverse lands at 0 and resets the hero | lenis:236; HomeV3Page:2844-2845 |
| The other instance (`SmoothScroll`, non-home routes): duration 0.7, the same easing, `syncTouch false`, `touchMultiplier 1.5`, `anchors true`, `allowNestedScroll true` | SmoothScroll-CvpIhmGb.js:56-67 |

## 14. Wired but inert

| Part | Why it does nothing here | Where |
|---|---|---|
| Light reveal: `ue(angle) = clamp(1 - |angle| / lightRevealAngle, 0, 1)` scales baked light colours between `dt = 0.12` and `ft = 1`, `lightRevealAngle aa = 20` degrees | the hook accepts `lightRefs` and `bakedLightRefs`; the page passes `bakedLightRefs` as arrays created empty and never filled, and no `lightRefs` at all, so `le()` and `B()` have nothing to scale | Scene.v2:168-169, :232-244, :3526, :3766-3770, :3838-3856, :171-188 |
| Bloom lerp `W(from, to, t)` across `strength`, `radius`, `threshold` (defaults `ut` 0.8, 0.4, 0.85; the preset's 1.6, 0.55, 0.65 per scene) | `bloomTargets` is not passed, so `W` returns at once | Scene.v2:163-167, :275-282, :150, :3838-3856 |
| The light-up shader: uniforms `uLightUp`, `uLightSoftness`, `uLightBoost`, `uLightFloor`, a luminance reveal injected after `map_fragment`, with `ui = 1.65`, `fi = 0.68`, `pi = 0.1` | enabled only for a scene with no intro clip (`enabled: !m`); all five have intros | Scene.v2:3197-3212, :3214-3217, :3241-3277, :3394, :3415-3420 |
| Cursor parallax on the camera | off by default | Scene.v2:4030 |
| The five old 3D scene components (`Be`, `Ee`, `Pe`, `Ie`, `Re`, the `lr` to `jr` builds in BottleRigV2 with their water, fog, glass and trees) | referenced as a bare expression and never rendered; their tuned values survive only in the preset JSON | Scene.v2:3906-3907, :150 |
| The product handoff, the in-canvas fog and the forward edge | `productEnabled: !1` on the home page | HomeV3Page:2857 |
| The debug minimap (preset `Debug Minimap: true`) and the FPS stats | debug UI, not read further here | Scene.v2:146-147 |

## 15. What was not captured or verified

- The phone carousel. Under 1024 px the page lazy-loads a separate chunk, `Scenev2mweb-ufkzfSJw.js` (HomeV3Page:2698-2699, rendered at :2888-2911 with `showHeader: false`), and the hero's `scroll-mobile` and `autoplay-mobile` clips; none of them is in the capture, which holds only `mobile-poster-DNFpmQsF.webp`. Everything above is the desktop chunk; its cover fit would show a phone the centre 24 percent of a 1700 x 884 frame, but what the phone chunk does is unknown.
- The scene clips' bytes are not in the capture (the stubs); the probes in section 12 are of separate downloads from the same URLs.
- No frame was rendered, so the look after ACES at exposure 1.8, the bottle under the 11 lights and the cloud's density were read, not seen.
- The hero's three clips, for the record: `autoplay-D8uhkDNP.mp4` 1280 x 720 h264 24 fps, 46 frames, 1.917 s, 710,006 B; `scroll-Dpd4Xmbf.mp4` and `scroll-reverse-B9ediwvp.mp4` 1280 x 720 h264 48 fps, 76 frames, 1.583 s, 888,198 and 901,549 B. They belong to the hero, not the carousel.
- The idle sway the spec gives our product is ours: the reference's rig can take one and this build gives it none (section 9).

## 16. What makes it read the way it does, ranked

1. **One gesture, one whole step.** Every wheel tick, key or 12 px touch is a complete 0.77 s move on power2.out, the page is snapped to the scene's 50vh slot when it ends, and nothing arrives for 150 ms after. No scene is ever seen half way; the visitor sees rooms at rest and complete swings, which is why it reads as a place and not a scroll.
2. **The swing, not a cut.** Two cover-fitted planes swing 80 degrees on a radius-7 ring while facing a fixed camera 6 units away. They meet at the screen's centre line at the half of the tween (0.385 s) with the incoming plane nearer the camera, so it overdraws the outgoing; half the angle happens in the first 0.22 s. The room leaves at an angle and the next arrives from the other side; nothing fades.
3. **Lights down, black, lights up.** The outgoing plane plays its 1 s outro as it leaves and is cut to black; the incoming plane is black for the first half of the sweep and starts its 1 s intro at the half, so the new room lights up as it settles (0.615 s after the tween ends). The "rotation of perspective" is this slide plus the fov pinch.
4. **The pinch.** The fov goes 45 to 42 by 0.65 of the step and back by 1, a cubic smoothstep each way. The planes are refitted to the view every frame, so the pinch does not zoom the background; it enlarges the bottle and steepens the perspective on the swinging planes.
5. **The rooms are video.** Each plane is an unlit 1700 x 884 h264 loop at 30 fps, 3.2 to 4.2 s long, cover-fitted with 1 percent overscan: fog, water and gradients move at film quality for the cost of a texture upload. The loops never pause while a scene is within 0.3 of the front, and a 2 s watchdog keeps them playing.
6. **One live object.** The bottle stands 3.4 units from the camera at scale 10 and turns 180 degrees per step on the fractional step, its label texture swapped at the half so the new persona faces as it arrives; its key light, the one DISK light of an 11-light Blender rig, lerps over 1.1 s to the scene's tint. The bottle is the only thing the ACES exposure, the environment and the lights touch.
7. **The page is held.** Lenis is stopped for the step and the scroll is written to the scene's slot after it, so the DOM never fights the canvas; inside the carousel the wheel, keys and touch are captured at window level, and a burst filter (200 ms, half the peak) keeps a trackpad's tail from stepping twice.
8. **The captions change under the step.** The old pair fades out in 0.32 s, the new one in over 0.2 s after 320 ms, its heading blur-swept over 0.5 s; bottom left and bottom right, under a 24vh gradient, so the text is read after the room, not during the move.
9. **The seams are clouds.** The carousel is entered and left through the fbm cloud (280 ms in, 360 ms out, a 400 ms lock), not by scrolling into view: 40dvh into the hero, and 40vh past the last scene's slot, the page is pinned, covered in 280 ms, jumped and uncovered in 360 ms, with a 400 ms lock after. The 40dvh overlaps put the jump's landing exactly at the next section's top.
10. **Nothing follows the cursor** except the bottle, by 0.3 rad; the camera's parallax is off.
