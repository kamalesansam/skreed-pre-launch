# Reference: ciaoenergy.com landing page, the 3D lineup (study for the family pages)

Study of 2026-10-09, revision 2 (same day: mechanisms behind the camera angle, the diagonal, the lighting, the ease rate and the entrance added after the spec review). Feeds `docs/specs/family-page.md` and `docs/specs/case-model-class.md`. Earlier notes on the same site: [2026-10-06-ciaoenergy-com.md](2026-10-06-ciaoenergy-com.md) (scroll grammar, written under "no WebGL in the spine") and [wiring/ciaoenergy-com.md](wiring/ciaoenergy-com.md) (code wiring).

| | |
|---|---|
| What was asked | Sam (2026-10-09): each of the ten section 2 rocks opens a family page, one per family, modelled on ciao's landing page, where drink cans stand lined up in 3D. On ours the cans become phone cases: the Blissful Blues page shows 24 cases, one per shade. One case model arrives as a zip; it must be one model class instanced in all 240 shades, never 240 assets |
| Source | Local mirror of www.ciaoenergy.com (captured 2026-10-06, site published 2026-09-17): page HTML, Webflow CSS and JS, three r161 with addons, `can.glb`, `base.glb`, `hdri2.hdr`, label and mask AVIFs, the loader video. Served by Playwright route interception, everything else blocked. No mirror file was edited; probes were injected in flight only |
| Method | Four parallel studies: source (every line of the inline 3D module and DOM script, plus live probes of the scene objects at 1280x800 DPR 1, 1280x800 DPR 2 and 390x844 DPR 3 iOS), runtime (42 input sequences, about 1,000 frames, one virtual clock driving rAF, timers and CSS transitions, at 1280x800 DPR 1 and 390x844 DPR 2 Android), assets (the GLBs, HDR and textures measured and rendered, plus our own stand-in case tests), layout (DOM, type and HUD measured at nine widths, a Skreed wireframe built from the shipped fonts and the real shade data) |
| Rendering caveat | Headless Chromium uses SwiftShader. Geometry, state, counts and timings are exact; shading is approximate and every frame-time number is meaningless for a phone GPU |
| Citations | `P:n` is line n of the mirror's `index.patched.html` (the inline 3D module is P:1877 to 3358). `SCR` = `/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad/research/ciao-landing`, for frames and probe data that exist only in this session. Nothing of ciao's (code, model, HDR, texture) was copied into this repo |
| In the repo | Our own tooling and measurements, so the build does not depend on scratch: `scripts/case-model/study/` (intake, verifier, render harness, stand-in recipe, colour maths, size and fit solvers) and `tests/case-model/baseline/` (calibration and size baselines, the computed lineup fit). The asset contract is `docs/specs/case-asset-contract.json` |

## 1. What ciao's 3D is, in one paragraph

One transparent WebGL canvas, fixed full screen behind eleven 125svh spacer sections, draws one can model cloned 24 times (12 on phones). A single paused GSAP timeline holds one keyframe per section (camera, spacing, light levels, wave, pedestal offset), and every frame seeks it to the scroll position, so the 3D is a pure function of scroll. In the hero the cans form a horizontal wave seen from slightly below, with the centred can lit by two spotlights and the rest receding into shadow; in section 8 ("full gamme") all of them close up into one tight diagonal that a rolled, yawed camera makes rise to the right. Flavour is a label texture per can. Nothing moves at rest. The flavour colour never reaches the 3D scene: it is two registered CSS colours that repaint a page wash and a few DOM details.

## 2. The assets, measured

| Asset | Size | What it is | Notes |
|---|---|---|---|
| `can.glb` | 162,956 B (about 87 KB gzip, 67 KB brotli, estimated) | 3 meshes, 5,702 triangles: Shell (label, 297 vertices, 512 triangles, an open 32 x 8 tube), Bottom (489 v, 720 t), Top with ring pull (3,132 v, 4,470 t) | Blender glTF I/O 4.4.56. No Draco, no meshopt, no quantisation: float32 positions, normals, UVs. Modelled in centimetres (shell 5.30 cm across, 13.40 cm tall), every node rotated +90 degrees about X and scaled 0.3, so the can is 1.59 x 4.07 x 1.59 units. Mesh-local Z is the can's axis. Shell UVs are one full cylindrical wrap, u 0 to 1, v 0 to 0.964 |
| `base.glb` | 621,704 B (about 342 KB gzip, 241 KB brotli) | The chrome pedestal: two halves, 24,432 triangles, 14,733 vertices | No materials in the file. 256 degenerate triangles; top half UVs run 1 to 2 |
| `hdri2.hdr` | 1,429,581 B, 1024 x 512 RGBE | A neutral photo studio: white backdrop, gridded skylight, silver umbrella | 14.6 stops from the 1% level to the maximum (52.4, the skylight). Becomes a 768 x 1024 half-float PMREM, about 6.3 MB of GPU memory |
| Six label AVIFs | 2048 x 1603 each, 192,030 to 252,726 B, 1,363,432 B together | The whole printed label per flavour: logo, flavour, ingredients, barcode | About 17.5 MB of GPU memory each with mipmaps, about 105 MB for six (computed) |
| `can-metallic-2.avif` | 1024 x 1024, 35,092 B | Brushed aluminium noise, shared by every can | About 5.6 MB GPU |
| `spot-mask.avif` | 408 x 408, 2,678 B | A gobo for the third spotlight | Carries the benefits beats |
| Totals | 11 asset files, 3,615,443 B raw (about 2.82 MB gzip, 2.56 MB brotli) | three r161 core 1,491,275 B (266 KB gzip) plus 18 addon files 290,896 B (88 KB gzip) | All together 5,397,614 B raw, about 3.17 MB gzip or 2.85 MB brotli |

Renders of every asset: `SCR/assets/renders/sheet-ciao-assets.png`. Numbers: `SCR/assets/ciao-3d-assets.json`, `SCR/source/glb-dump.txt`.

## 3. One model, many variants: how ciao does it

1. The can GLB loads once (a top-level await).
2. Every non-label mesh of the template gets one shared metal material.
3. Per flavour: the template's scene is cloned (three's `Mesh.copy` shares geometry and material references), the flavour's label texture is awaited, a new label material is made with that texture as its colour map, and it is assigned to the clone's Shell.
4. The ring is filled to 24 (12 on phones) by cloning the finished flavour cans in turn.

Measured on desktop: 24 cans, 76 meshes, 7 unique geometries (the 3 can geometries are each used 24 times), 8 unique materials, label materials repeating 0 to 5 four times. No InstancedMesh, no BatchedMesh: 3 draw calls per can. The six label materials compile to one shader program because their `onBeforeCompile` patch has identical source, which three uses as the program cache key.

What a variant costs ciao: one texture plus one material, about 220 KB of download and about 17.5 MB of GPU memory per flavour. For 240 shades that model is impossible on a phone. A Skreed variant is one sRGB hex from `shades-240.json`, about 7 bytes, applied as a per-instance colour on shared geometry (section 10).

## 4. Renderer, camera, lights, backdrop, post

- **Renderer.** Antialias on, alpha on, clear colour transparent, so the CSS background shows through. sRGB output, ACES Filmic tone mapping at exposure 1, physical light units, no shadows. Context loss is caught and rendering pauses until restore. The canvas is fixed to the viewport.
- **Backdrop.** At rest the transparent canvas sits over a grey "studio floor" painted in CSS on `body::before`, `linear-gradient(9.02deg, #eee, #959492, #000)` (layout study, inline styles 468 to 488), plus the flavour wash on `body::after` when the profile beat is active (section 7).
- **DPR policy.** "Low power" is iOS or a window under 1024 px, decided once at load (P:1988 to 1992). Low power caps the pixel ratio at 2, desktop at 1.5. The authors' own comment: DPR 2 on a phone is sharp, the jagged edges came from DPR 1 with SMAA off. Measured backing stores: 1920 x 1200 at 1280 x 800 DPR 2; 780 x 1688 at 390 x 844 DPR 3.
- **Post.** RenderPass, UnrealBloomPass (strength 0.1, radius 0.1, threshold 1, so only specular glints above 1.0 bloom), OutputPass, SMAAPass. Phones get RenderPass and OutputPass only. The composer draws to its own target with 0 samples, so the canvas `antialias` flag buys nothing and phones have no anti-aliasing beyond DPR 2.
- **Composer sizing defect, measured.** The composer is handed a render target already multiplied by the pixel ratio and then multiplies again, so every pass is sized at DPR squared until the first width resize. At 1280 x 800 DPR 2: bloom's bright target 1440 x 900 where 640 x 400 was intended; SMAA's edge target 2880 x 1800 reading a 1920 x 1200 input. After a 1 px width resize: bloom 961 x 600, SMAA 1921.5 x 1200. No effect at DPR 1.
- **Camera.** Perspective, vertical FOV 20 degrees, rest at (0, 0, 29), no look-at target: position, Euler rotation and FOV are written from keyframe data every frame. The only adaptation to the screen is the aspect ratio; vertical FOV stays 20, so a portrait phone sees about 2.36 units either side of centre at z 29 (computed). A width factor, 1440 / page width clamped to 1 to 2.4 (1.125 at 1280, 2.4 at 390), raises the wave frequency and the lineup twist on narrow screens.
- **Environment.** The HDR becomes `scene.environment` (not the background), not awaited, so reflections can arrive after the first frames. Brightness per material comes from `envMapIntensity` (pedestal 0.1, can metal 3, label 1). One shared tint uniform, patched into every material after the lighting stage, dims or lifts all indirect light at once per keyframe; its colour stays white.
- **Lights, and why only the centred can is lit.** Three spotlights, all penumbra 1 and decay 0.1, no ambient or hemisphere light (the HDR fills):
  - spot1 at (0, 3.5, 0) aimed at (0, 0, 1), and spot2 at (0, -3, 2) aimed at (0, 0, 1.8): one above and one below the centre slot, intensity 50, distance 8. Their cone angle is rewritten every frame to 45 degrees times the keyframe's light width (spot2's own 60 degrees never survives; measured 45 at rest) (P:2192 to 2206, 3111 to 3118).
  - The first neighbour stands at x 3.5, z -3.7, about 63 degrees off spot2's axis and 68 degrees off spot1's (computed), outside both 45 degree cones. So at rest the centred can is lit and its neighbours read by environment light only: part of the selection reads through light.
  - spot3 carries the gobo mask and is off at rest; it lights the benefits beats.
  - The packshot drops the pair to intensity 10 with the light width at 3 (cones of 135 degrees), so the whole line is lit evenly.

| Material | Colour | Metalness | Roughness | Extras | Env intensity | Users |
|---|---|---|---|---|---|---|
| Pedestal | 0xababab | 0.9 | 0.3 | sheen 0.3 | 0.1 | 4 |
| Can metal | 0x555555 | 0.9 | 0.2 | sheen 0.8, clearcoat 1 (roughness 0.1), metalness map | 3 | 48 |
| Label, one per flavour | 0xababab | 0.9 | 0.2 | clearcoat 0.5 (roughness 0.3), label map, metalness map | 1 | 4 each |

Phones get MeshStandardMaterial with clearcoat and sheen stripped. Programs compiled: 17 on desktop, 9 on phones, including post and PMREM.

## 5. The two lined-up compositions

ciao has two product rows. Both are the same 24 objects under different keyframes, and in both **the selected slot sits at screen centre and the whole line slides under it**: per can, x = wrap(i x 3.5 - carousel position) x spacing (P:3053 to 3079). Dragging moves the line like a conveyor; the centred can is always the selection.

**The hero carousel (section 1): one hero, the rest recede.** Slots sit 3.5 units apart on a ring that wraps. Each can's pose is a function of its slot offset x from the centre and its "centredness" p (1 at the centre, falling to 0 one slot away) blended with the scroll position (P:3061 to 3097):
- **Depth, not scale.** Every can has the same scale, 1.2. The centred can reads larger because the line is a V in plan: z = -|x| - 0.2, so each slot stands 3.5 units further back and the neighbours shrink step by step (211, 179 and 148 px wide at 1280).
- **A wave.** y = sin(x x 0.25 x width factor), so the left side sits lower and the right higher (world y about +-0.83, +-0.92, +-0.19).
- **A low angle.** Every can is pitched -20 degrees, top tipped away from the camera, so the can bottoms face the viewer: the hero is seen from slightly below (visible in `SCR/runtime/desktop/rest.png`). A roll of 11.25 degrees leans every can's top to the left.
- **Yaw.** x x 0.5 rad - 20 degrees, which is 100.27 degrees per slot, so every neighbour shows a different side of its label. On top, the label spins about the can's own axis by 0.6 times that yaw (child `rotation.z = rotY x 0.6 + canSpin x p`, possible because mesh Z is the can axis), so the printed label turns about 1.6 times the can's yaw.
- **Pointer tilt.** Only the centred can responds: it turns toward the pointer (yaw grows as the pointer moves right, pitch as it moves down), scaled by p, with the raw pixel position over a fixed 1280 divisor (section 6).
- **Light.** Only the centred can sits inside the spotlight cones (section 4).

| Measure | 1280 x 800 | 390 x 844 |
|---|---|---|
| Cans in view | 7 in view, 5 whole (source run); 9 touch the frame, about 7 read (runtime run) | 3 in view, 1 whole, slivers of 29 and 16 px (iOS DPR 3); slivers of 63 and 48 px (Android DPR 2) |
| Centre can box | 211 x 403 px at (640, 400) (source run); 245 x 454 px, 57% of the viewport height (runtime run) | 222 x 425 px, 57% of the width (iOS); 262 x 480 px, 67% of the width (Android) |
| Neighbours | 179 x 355 and 148 x 356 px; centre-to-centre 243, 196, 161 px | n/a |
| Name | Bottom centre, directly under the centred can ("DOUBLE LITCHI" at x 640) | Bottom centre, arrows flanking it |
| Frames | `SCR/source/runs/desk-rest-annotated.png`, `SCR/runtime/desktop/rest.png` | `SCR/source/runs/phone-rest-annotated.png`, `SCR/runtime/phone/rest.png` |

**The packshot (section 8): every can on one diagonal.** Keyframe (P:2732 to 2760): camera at (-3, -3.5, 20) with rotation (10, -9, -10) degrees and FOV 30; spacing 0.47 of the hero's, so 1.645 units apart for 1.59-unit cans, almost touching; pedestals 20 units off screen; key lights at 10 with 135 degree cones; drag speed doubled. **The cans stand on a level world line** (y 0, z -0.4, no wave). The diagonal and the depth both come from the camera:
- it sits 3.5 units below the line and pitches up 10 degrees, a low angle again;
- its roll of -10 degrees makes the level line rise to the right on screen (about 20 px per can) and leans every can's top to the left;
- its yaw of -9 degrees from 3 units to the left makes the right end recede, so the can boxes shrink from 175 to 137 px wide left to right.

Each can is also pitched a fixed step more than the last (swirl), so can bottoms face left and tops face right.

| Measure | 1280 x 800 | 390 x 844 |
|---|---|---|
| Cans in frame | 13 visible, 11 whole (source); 14 touch the frame, 12 fully in (runtime) | 5 touch the frame, 2 whole (source); about 3 fully in (runtime) |
| Size and pitch | Boxes 137 to 175 by 249 to 314 px, centres about 105 to 128 px apart (source); 115 to 130 px pitch, about 350 px tall at centre, 44% of the height (runtime) | About 200 CSS px wide per can |
| Twist | 13.54 degrees per can, from -56 to +106 (source; runtime read -70 to +106) | About 29 degrees per can, because the width factor caps at 2.4 |
| Rise | About 20 px per can, left to right, from the camera roll | Same beat, cropped; no portrait reframing |
| Draw calls | 40 (frustum culling) | 15 |
| Frames | `SCR/runtime/desktop/lineup-rest.png`, `SCR/source/runs/desk-packshot-annotated.png`, `SCR/runtime/sheets/desktop-lineup-enter.jpg`, `SCR/runtime/sheets/desktop-lineup-drag.jpg` | `SCR/runtime/phone/lineup-rest.png`, `SCR/source/runs/phone-packshot-annotated.png`, `SCR/runtime/sheets/phone-lineup-enter.jpg`, `SCR/runtime/sheets/phone-lineup-drag.jpg` |

Arrival into the packshot on desktop (one wheel notch, 1.5 s): spacing under 2 at 400 ms, under 1 at 583 ms, under 0.5 at 967 ms; the cans in frame climb 1, 3, 7, 11, 13, 14 at 200 ms steps. Dragging slides the whole line along its own diagonal like a conveyor and wraps, because the 24 cans are 6 flavours repeated 4 times.

**Portrait is the weak spot.** Neither composition reframes for a phone: the camera keeps its vertical FOV and only the aspect changes, so a 24-can line shows 2 whole cans at 390 px.

## 6. Motion and input, measured (virtual 60 fps, input at tick 0)

**The ease.** Each frame the position moves `lerp(position, target, dt x 10)` (P:3155). At 60 fps that keeps 5/6 of the remaining distance per frame, a continuous rate of 60 x ln(6/5), about 10.94 per second: true crossings at 63, 210 and 421 ms; measured at 67, 217 and 433 ms because the measurement steps whole frames. It is frame-rate dependent and unclamped (at 30 fps a step reaches 90% in about 190 ms, computed).

| Input | What happens | Timing |
|---|---|---|
| Nothing (6 s idle) | No can moves. The only changing pixels are four sound-equaliser bars and two HUD chevron loops (`SCR/runtime/idle-diffmax-desktop.png`) | n/a |
| Arrow click or tap | Target moves one slot; position follows the ease above | 50% at 67 ms, 90% at 217 ms, 99% at 433 ms, no overshoot. Index flips at 67 ms |
| Same, the DOM | Name split per character (SplitText): old characters to yPercent -110 over 0.6 s power3.out with a 0.01 s stagger, new ones from 110 after a 0.3 s delay; slide, title and description cross-fade 0.5 s power2.inOut (P:3429 to 3461, 4013 to 4041); colour variables change after a 150 ms debounce over a 0.6 s :root transition; pagination dot 0.6 s power3.out (P:4114); a conic ring turns 60 degrees in 0.8 s | Name slot empty from about 200 to 350 ms, new name readable at 350 ms, last character at about 1.03 s; colour 283 to 750 ms; dot settled 650 to 700 ms |
| Mouse drag (desktop) | Target moves 0.02 units per px, so 175 px per slot (87.5 px in the packshot); the cans lag the target; release rounds to the nearest slot | 300 px in 300 ms moves 2 slots. The coded 8x fling acts on a delta the frame loop has already zeroed, so there is no momentum |
| Touch swipe (phone) | Same; the axis locks to horizontal after 2 px | 200 px in 250 ms: one slot, position 90% at 350 ms, 99% at 550 ms. One slot is 45% of the phone width |
| Click a side can | Moves one step towards it, whatever its distance (only the sign is used) | As the arrow |
| Click or tap the centred can | Opens it: a 1.5 s cubic-out page turn to the profile section; the camera dollies from z 29 to 6 and widens to FOV 40; the can turns to (-37.5, 15, 22.5) degrees (Taste keyframe, P:2536 to 2564); neighbours fly out sideways; the flavour wash switches on at 100 ms. Input is captured by the raycast on `window` (P:2366 to 2388) | 50% at 317 ms, 99% at 1,183 ms |
| Pagination bar | Click jumps straight to the slot in one ease; dragging steps one slot per boundary | 4 slots in one ease, 99% at 433 ms; the name changes once at 500 ms |
| Hover | Cursor only (grab, pointer over a can of the centred flavour, grabbing). The centred can tilts toward the pointer | Tilt smoothed to 90% in about 225 ms; not centred: at screen middle the can carries +5.73 degrees of yaw and +3.58 of pitch, and the divisor is 1280 px on every screen |
| Keyboard | Left and Right do nothing. Tab reaches the logo, CONTACT, the newsletter field and its submit, never the arrows, pagination or cans | n/a |
| Wheel | Pages one section per notch for 1 to 1.5 s and swallows extra notches; scrolls freely from section 8 on | 1.5 s per page turn |

Frame sheets: `SCR/runtime/sheets/desktop-arrow-next.jpg`, `desktop-drag-next.jpg`, `desktop-drag-fling.jpg`, `desktop-click-right2-can.jpg`, `desktop-click-centre-can.jpg`, `desktop-hover-sweep.jpg`, `desktop-pagination-click.jpg`, `phone-swipe-next.jpg`, `phone-tap-centre-can.jpg`; storyboards `SCR/runtime/sheets/desktop-storyboard.jpg` and `phone-storyboard.jpg`; videos in `SCR/runtime/video/`; timings in `SCR/runtime/desktop/timings.json` and `SCR/runtime/phone/timings.json`.

## 7. Colour per flavour

Two registered CSS colour properties (primary and secondary) with a 0.6 s transition on :root. On a carousel change, after a 150 ms debounce, they are set from data attributes on the matching slide. They paint a fixed radial wash over the page, visible only while the profile section is active, plus the argument SVG and the benefit icons. The 3D never reads them. The slide order and the hard-coded can order are coupled only by convention. Skreed's single `--shade` maps onto this pair, and Skreed must not repaint the page per shade (CLAUDE.md rule 24), so only the swatch carriers read it.

## 8. The HUD and the text layer

- **The HUD is decoration.** Four corner brackets, mono glyphs "C", "E" and "_", looping chevrons, in Geist Mono at 10.5 px, white 50%. Nothing in it changes per flavour and no script writes to it. It slides in from plus or minus 10rem over 0.9 s at the loader exit.
- **Per-flavour information lives elsewhere:** the bottom-centre title (one slide per flavour), the profile name and description, a letter grid, and the colour pair. The four benefit sections are identical for all six flavours; the per-flavour facts exist only on the label textures.
- **Name swap.** As in section 6. On desktop the profile block is vertically centred, so a description going from 2 lines to 3 moves the title by 13 px. Frames: `SCR/layout/sheets/swap-1280.png`, `swap-390.png`, `profswap-1280.png`.
- **Type.** Root size clamp(0.875rem, 0.833vw, 1rem), 14 px at every width up to 1680. Flavour name clamp(2.25rem, 3vw, 3rem): 31.5 px at 390, 38.4 px at 1280. One uppercase italic display face for every heading.
- **Chrome.** Navbar 80 px at 390, 85 px at 1280, 4% gutter. MENU is a div with an 18 px tall box at 390 (under a 44 px target). One aria attribute on the whole page; arrows, menu and sound are divs; no reduced-motion handling in any CSS or script. Breakpoints disagree: CSS 991/767/479, UI script 991/992, 3D low power under 1024.

## 9. Loader, the 3D entrance, and performance

- **The loader video** (7.05 s) gates input; the scene is ready about 2 to 4 s before the video ends.
- **The 3D entrance is a separate move** (`loader.play`, P:2863 to 2942): it locks scroll, drag and pointer, starts the cans at spacing 10 (only the centred can in view), the key lights at 0 and the camera at z 25, then runs three 2.5 s power4.out moves: lights to 30 at 0 s, camera to z 29 at 1 s, everything to the rest pose (lights 50, spacing 1) at 2 s. Total 4.5 s, input locked throughout. First input is about 11.5 s after the video starts.
- Draw calls at rest: 28 on desktop (69,840 triangles drawn of 76 meshes and 161,280 triangles), 13 on phones (41,538 of 92,856). A full desktop composer frame is 45 calls, 17 of them post. Profile beat 3 calls, packshot 40.
- Done well: geometry and material sharing, one program for six label materials, shared uniforms, effective frustum culling, a designed low-power branch.
- Not done: instancing, render on demand (the composer renders every frame unconditionally), GLB compression, texture downsizing, pausing when hidden, dropping unused imports. `updateProjectionMatrix` runs every frame.

## 10. Our own measurements for the case model (not ciao's)

A procedural stand-in case (77 x 163 x 12.3 mm, camera cut-out, two parts, 7,520 triangles) was built as a test fixture to try the Skreed approach. It is not a product and never ships. Its recipe is `scripts/case-model/study/gen-standin.html`.

- **Instancing.** One InstancedMesh per part, 24 instances, per-instance shade colour: 2 draw calls and 180,480 triangles for a 24-case Blissful Blues grid, at 390 x 844 DPR 2 and at 1280 x 800. ciao spends 28 calls on desktop and 13 on phones. In a 4 x 6 phone grid each case is about 55 x 120 CSS px. Frames: `SCR/assets/renders/sheet-standin-instancing.png`, `standin-row-gloss-1280.png`, `standin-grid-matte-390.png`, `finish-compare-390.png`.
- **Camera cut-out.** Without a phone part the cut-out shows the page through the case; the model needs a Device part or a filled lens plate.
- **LOD.** meshopt's simplifier took the stand-in from 7,520 to 3,820 triangles; at the 390 px grid it differed from the full model on 2.1% of pixels, all on silhouettes (`SCR/assets/renders/lod1-vs-raw-crop.png`). Quantisation alone differed on 0.72%.
- **Compression, and what the site CSP allows.** On ciao's can: quantised only 54.7 KB brotli, meshopt plus quantise 47.4 KB, Draco 22.4 KB. The site CSP (`hero-architecture.md` 12.3) has no `'wasm-unsafe-eval'`, so the meshopt, Draco and KTX2 decoders, which all compile WebAssembly, cannot run on the site; only `KHR_mesh_quantization`, which GLTFLoader reads with no decoder, is usable. Measured on the stand-in without UVs (`tests/case-model/baseline/model-size-standin.txt`): LOD0 float 148,572 B; quantised 114,912 B raw, 64,443 B gzip, 36,145 B brotli; meshopt 48,624 B raw, 26,651 B brotli. LOD1 (3,770 triangles) quantised 58,724 B raw, 23,011 B brotli; meshopt 28,780 B raw. Decoder sizes for the record: meshopt 6.5 KB gzip; Draco 63 KB gzip wasm plus 11.5 KB wrapper plus 4.2 KB loader; Basis 245 KB gzip wasm plus 15.7 KB. RoomEnvironment (a procedural studio, no download) is 1.2 KB; GLTFLoader 23.5 KB (three r165, gzip). Pitfall: gltf-transform's default prune deletes UVs when the file's own materials have no textures.
- **Colour.** Matte case, roughness 0.62, under a uniform white environment of radiance 1, all 240 hexes, error measured as CIEDE2000 on a 3 x 3 px back-plate sample (`tests/case-model/baseline/calib-summary.json`, per-shade samples `tests/case-model/baseline/calib-neutral-<family>.json`, sheet `SCR/assets/calib/calib-neutral-blissful-blues.png`):

| Tone mapping | Median | 90th percentile | Worst | Under 2 | Under 5 |
|---|---|---|---|---|---|
| Neutral | 1.65 | 2.84 | 3.63 | 67% | 100% |
| None | 2.27 | 6.83 | 11.59 | 47% | 81% |
| ACES (ciao's) | 6.04 | 9.39 | 11.48 | 0% | 33% |
| AgX | 10.5 | 14.44 | 17.33 | 2% | 5% |

  With no tone mapping the darkest shades lift (Mahogany #470406 renders as 84, 48, 48). Under ACES the median hue shift on saturated shades is 3.2 degrees against 0.23 under Neutral. Neutral's worst cases are the brightest saturated shades, whose peak channel compresses to 240 (Neon in Blushing Corals, #ff7901, rendered 240, 118, 36).
- **Intake.** `scripts/case-model/study/intake.sh <zip|glb|folder> [family] [lod1 tris]` checks the user's zip in about 60 s (zip safety, glTF validity, units, orientation, parts, triangles, baked colour, UVs, topology, textures, size), optionally writes LOD0 and LOD1, and renders three views, the phone grid, the 1280 row, the Neutral colour grid and the LOD1 grid. It still points at this session's scratch toolchain; `case-model-class.md` section 2 lists the port. The contract it checks is `docs/specs/case-asset-contract.json`.

## 11. Stage neutral per family (layout study)

WCAG contrast of every shade against the two page neutrals; the family's stage takes the neutral with the higher median (`SCR/layout/data/stage-neutral-contrast.json`). In catalog order the result alternates exactly, matching the catalog's own alternating pages:

| Family | Stage | Median on Pearl | Median on Slate | Under 1.5:1 on the chosen stage |
|---|---|---|---|---|
| Frosty Whites | Urban Slate | 1.08 | 9.25 | 0 (all 24 are under 1.5:1 on Pearl) |
| Blissful Blues | Pearl Whisper | 4.69 | 2.31 | 6 |
| Playful Pinks | Urban Slate | 2.59 | 4.22 | 0 |
| Vivid Violets | Pearl Whisper | 7.29 | 1.54 | 2 |
| Mellow Yellows | Urban Slate | 1.32 | 7.56 | 0 |
| Earthy Browns | Pearl Whisper | 5.52 | 2.14 | 2 |
| Blushing Corals | Urban Slate | 2.52 | 4.07 | 0 |
| Stormy Greys | Pearl Whisper | 3.91 | 2.60 | 0 |
| Go Green | Urban Slate | 2.96 | 3.51 | 5 |
| Roaring Reds | Pearl Whisper | 6.14 | 1.63 | 0 |

The wireframe built on this (`SCR/layout/sheets/wire-phone.png`, `wire-laptop.png`, metrics in `SCR/layout/data/wireframe-metrics.json`) fits at 360, 390 and 1280 with no horizontal scroll. The widest shade names in Poppins 700: Dark Chocolate 229 px at 28 px and 286 px at 36 px; Classic Violet 196 and 253. A 24-swatch scrubber at 390 has a pitch of 14.91 px (13.59 at 360, 27.66 at 1280).

The palette has no neutral near-black: the darkest shades are Midnight #0e1442 (1.64:1 against Urban Slate), Mahogany #470406 (1.52:1) and Wine #4b0923 (1.44:1). A dark device part inside a case therefore cannot separate from a Slate page by a palette hex alone (family-page.md R17).

## 12. Defects confirmed in ciao (do not copy)

1. Passes sized at DPR squared (section 4).
2. The ring's wrap puts slot N/2 + k in the centre, not slot k; it works only because 12 and 24 are multiples of 6. With 24 unique shades the centred mesh and the reported index would disagree by 12.
3. Pagination takes the long way round after a lap: `goTo(2)` from one lap on travelled 17.5 units back and fired 5 change events in 200 ms, each retriggering the text, dot, ring and sound.
4. Clicking a side can moves one step whatever its distance.
5. Arrow clicks can page the site: the click raycast listens on `window`, so three clicks on the next arrow 150 ms apart also hit the moving centred can under the arrow at (764, 384) and started a 1.5 s page turn (`SCR/runtime/sheets/desktop-arrow-next-x3.jpg`).
6. The fling never fires (the drag delta is zeroed before it is multiplied).
7. Easing is frame-rate dependent and unclamped (section 6).
8. The pointer tilt is not centred and uses a fixed 1280 px divisor.
9. No keyboard path to any product control; one aria attribute; no reduced motion; an 18 px tall MENU target.
10. The low-power branch halves the can count; for Skreed that would drop shades.

## 13. What the family pages take, and what they leave

This study reopens two rows the 2026-10-06 reference left ("the all-24 diagonal" and "live lighting"), for the family pages only and only if Sam amends the one-WebGL-island rule (see the spec's rule conflicts). The landing spine is unchanged.

| Take | Skreed form | Spec |
|---|---|---|
| One model loaded once, variants by data | One case GLB, InstancedMesh per part, per-instance colour from the hex; 240 shades cost 240 hex strings | case-model-class.md |
| The selected slot at screen centre, the line sliding under it (both compositions) | The same on every screen: the front case is always the centred slot and the line moves like a conveyor; the line has ends, so beyond the first and last shade the stage is empty | family-page.md 2.5 |
| Pose as a function of slot offset and centredness | One pose function of (slot offset, centredness) for all 24 | family-page.md 2.5 |
| A low camera and a rolled, yawed camera for the diagonal | Camera 4 degrees below the line looking up, 4 degrees to the left so the right end recedes, rolled so the level line rises 8 degrees to the right; the front case leans 3 degrees more | family-page.md 2.5 |
| The packshot's "all of them in one line" | On a laptop all 24 are in frame for mid-family selections, 14 to 15 at the ends; on a phone a window of 5 to 10 | family-page.md 2.5 |
| The exponential ease, no overshoot | The same rate (10.94 per second), made frame-rate independent | family-page.md 2.5 |
| A change signal the DOM listens to; CSS colour variables per selection | One `selection` event; `--shade` on the sticky-bar swatch only | family-page.md |
| No idle motion | None, and the render loop stops when settled | family-page.md |
| Transparent canvas over a CSS page colour | Same, over flat Pearl Whisper or Urban Slate per family | family-page.md |
| Context-loss handling, DPR cap 2 on phones | Same, plus a capability gate and a swatch-grid mode | family-page.md |
| The name bottom centre, arrows flanking it | Same: name, family and number centred under the front case, prev and next either side | family-page.md 2.3, 2.4 |

| Leave | Why | Rule or item |
|---|---|---|
| Label texture per variant | 17.5 MB GPU each; impossible for 240 | Performance budget |
| ACES tone mapping | Median colour error 6.04 against 1.65 for Neutral | A2, A5 |
| 1.43 MB HDR, bloom, SMAA, the composer | RoomEnvironment is 0 KB of download; MSAA on the default framebuffer replaces SMAA; no composer means no DPR-squared defect | Budget, rule 42 |
| The centre-only spotlight pair | Every shade must read at its calibrated colour, so all 24 cases get the same light; the selection reads from pose alone | A5, family-page.md 2.5 |
| Equal scale with a deep V and a sine wave | A small capped depth step plus a scale and lift on the front case: the overlapping deck needs equal strips past the third neighbour | family-page.md 2.5 |
| The grey studio-floor gradient behind the canvas, chrome pedestal, gobo, smoke, page wash, conic ring, rainbow pagination, HUD brackets and mono glyphs | Decoration, glow, gradients, a banned face, text under 12 px | Rules 1, 13, 19, 21, 24, 25, 42, 45; A3 |
| Loader video | No full-page loaders; the poster is frame 0 | H1, C4 |
| The 4.5 s 3D entrance with input locked | The poster must equal frame 0 and input is never locked; replaced by a converge of 421 ms or less from the poster pose that any input retargets, off under reduced motion | family-page.md 2.5, D1 |
| Clicking the centred can opens a profile page | No second page per shade; a tap on the front case turns it once so its finish reads | family-page.md 2.5 |
| Per-character name swap with an empty slot | One line move, old and new together, so the slot is never empty | family-page.md 4 |
| 150 ms colour debounce | `--shade` follows the settled selection directly | family-page.md 4 |
| Axis lock after 2 px | 6 px, so a vertical page scroll is not misread as a drag on a page that scrolls natively | family-page.md 2.5 |
| DPR decided once by window width under 1024 | Decided by layout class and pointer, re-read on resize | family-page.md 2.5 |
| Wheel paging, infinite loop | Native scroll; the page has an end | Fixed decision |
| A ring that wraps | The catalog order has a first and a last shade | family-page.md decisions |
| Halving the count on low power | Would drop shades; tier by DPR and LOD instead | family-page.md |
| The defects in section 12 | Each has a named fix in the spec | family-page.md |

## 14. Unknowns carried into the spec

- Real phone GPU cost: every frame time here is SwiftShader. The LOD1 budget, clearcoat cost and the tier thresholds need one mid-range Android and one iPhone once the model arrives.
- Whether Cloudflare Workers Static Assets compresses `model/gltf-binary`: check `Content-Encoding` on the first deploy. Until then the model is budgeted as raw bytes.
- Colour against a physical case in daylight: the calibration covers tone-mapping fidelity only.
- The supplier model: case type, device, whether it has a phone part, a logo, button detail or a lining.
- Phone runs used Chromium with iPhone and Android user agents, not WebKit; Safari memory pressure and context loss are untested.
- GPU texture memory figures are computed, not read; WebGL exposes no allocation sizes.
- The lineup fit numbers in family-page.md 2.5 are computed by projection (`scripts/case-model/study/fit.mjs`, output `tests/case-model/baseline/lineup-fit-standin.jsonl`), not rendered; the first build measures them.
