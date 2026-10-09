Status (2026-10-09): built as prototype v10 (`prototypes/hero-v9/`), passed round 3 of review from the fidelity judge and the engineer.
Section A's tape loader was not built: the ciao-style shine loader from v9.9 stays, and the readiness milestones in A2 feed it.
Copied from the session research folder with timeline.md, page_plan.md, budget.md and risks.md.

SKREED HERO: SYNC LOADER + IGLOO INTRO, BUILD SPEC (replaces "Plot, scan, cut")
All code and data are ours. No igloo code, models, textures or tape strings are shipped. Helper scripts and derived values: research/intro/spec/pose_check.py, aces_inverse.py, skreed_tl.py, skreed_timeline_values.txt.

0. FRAME MAPPING (decisions that make the rest exact)
- Our world: the logo stands in the xy plane at the origin, front face z=+0.475, x ±2.8, y ±3.05. The moon floor under it is G = moonGroundAt(0,0) = -3.61 (sample it at init, do not hard-code).
- Shockwave origin O = (0, G, 0), the floor point under the logo centre. This matches igloo, whose origin is the igloo's base centre on its ground.
- Igloo's y-up is our y-up, at lattice scale 1:1 (2.0 pitch). All igloo radii (cage 25u-5, numbers 48u-d, snow disc 32.1u-0.2) carry over unchanged.
- The lattice is yawed 45° about the vertical through O. Our camera is straight-on (x=0), and igloo's camera sits 45° off its lattice axes, so this restores igloo's 3/4 "skeletal" read. Report 3: head-on cubes read as flat squares.
- Height sweeps (outline, print) are normalised to object height:
  - igloo y -0.5..3.72 (4.22 tall) maps to ours -3.05..3.05 (6.10 tall), k=1.4455: y_ours = -3.05 + (y_igloo + 0.5)·k; margins ×k.
  - Outline: start 3.5→2.73, end 0.1→-2.18, margin 2→2.89.
  - Print: start 3.95→3.38, end -0.4→-2.905, margin 1.5→2.17.
- Colour: every intro emissive is Pearl Whisper #F7F6F3 (THREE.Color, linear). The flat start colour is Urban Slate #383F43. No igloo blue: CLAUDE.md allows no extra colour.
- Camera intro pose: P0 = (0, 22.05, 24) looking at T0 = (0, -2.8, 0).
  - This keeps igloo's 46° elevation and its start/rest distance ratio of 1.43 (igloo (-14,21,14)→(0,.5,0) against rest (-13.49,2.65,14.43)→(0,1.24,0)).
  - It is a pure crane (x and z fixed), like igloo, where x and z move less than 0.5.
  - Projections (pose_check.py):

    | Viewport | Logo size | Logo centre | r=15 cage ring |
    |---|---|---|---|
    | 1280x800 | 278x207 px | (640,311), 39% down; igloo's dome sits about 38% down | spans x -27..1307, so it fills the frame like igloo's |
    | 390x844 (zoom .5776) | 170x127 | (195,368) | spans x -211..601 |
    | Hero end pose | 356x383 | (640,338) | |

A. SYNC LOADER (igloo mechanism, Skreed look)

A1 Look and motion
- #loader: position fixed, inset 0, flex-centred, background var(--bgColor)=#383F43, pointer-events none, will-change opacity, z-index above everything, aria-hidden.
- Content: a 10-cell window over a moving tape of "-", "=", "+" in Open Sans 600 17px, colour Pearl.
  - Cells are a fixed .62em wide with centred glyphs, faking igloo's monospace because Open Sans has no mono.
  - No text-shadow. Igloo's 5px white glow is dropped (rule 25).
- Tape: our own 100-cell string with igloo's grammar (crests "+++", "+", "++" on "=" shoulders over a "-" floor):
  `---===+++===-----=+=----==++==------===+++===---=+=-----==++==----===+++===------=+=---==++==-------`
- Motion: one cell to the right every 50 ms (20 cells/s, 5 s loop). New cells enter at the left, igloo's `head` cadence.
  - Build a strip of 110 spans (the tape plus its first 10 cells) in an overflow-hidden window.
  - Animate with `@keyframes tape{from{transform:translateX(calc(-100*var(--cw)))}to{transform:none}}` and `animation:tape 5s steps(100) infinite`.
  - A transform with steps() runs on the compositor, so the tape keeps moving while the main thread compiles. Igloo's `content` keyframes stall; ours must not.
- No number, no bar, no percentage (igloo has none). The milestones gate readiness only.
- States:
  - Loading: tape only.
  - Slow: no milestone for 6 s. Show one Open Sans 400 12px Pearl line 24px under the tape: "Still loading", or "Slow connection" when the pending item is a texture.
  - Offline at start: "You are offline. The countdown still runs." then the poster path.
  - Error or stall: module load error, no WebGL2, context lost before ready, or no milestone for 20 s. Go to the poster path (A5).

A2 What "ready" waits for (igloo's isReady, mapped; each step reports a milestone)
1. 'import': the module ran. three is loaded by dynamic import after the poster guard (see page plan).
2. 'fonts': document.fonts.load('600 24px "Open Sans"') for the number atlas, plus Poppins 700 and Source Serif 4 400 for the page, capped at 3 s.
3. 'b1'..'b10': buildVariant(10), as today.
4. 'sky', 'ground': await img.decode() (off-main-thread decode), then renderer.initTexture(tex). Do the same initTexture for scrollTex, the fog noise, the wind tile and the four intro textures.
5. 'intro': cage, number anchors, outline loops, triangle tiling, mosaic and number atlas built (B2-B6).
6. 'scene': the scene graph is complete.
7. 'compile' (igloo Jo._upload):
   - For sceneA, sceneR, sceneB and screenScene, traverse and save visible / material.visible / frustumCulled.
   - Force visible=true, material.visible=true, frustumCulled=false on every object, including the intro meshes and the hidden rock mesh.
   - await renderer.compileAsync(scene, cam) for each (KHR_parallel_shader_compile where present), then restore the flags.
8. 'warm': one draw per material group into an 8x8 RT (the existing c1..cN loop, now including the intro meshes).
   - Set intro uniforms to mid values first (uPrint .5, uCageA .4, uCageP .5, uNumP .5, uOutP .5, uU/uU2 .5, uFloorA 1, uSkyP .5) so every branch rasterises.
   - Run composer A and composer B once at 8x8, and the composite once with uIntro .5.
   - Restore the uniforms to their t=0 values, then resize() to full size.
9. 'frame1', 'frame2': start the frame loop in phase 'armed' with intro time pinned at 0, rendering real full-size frames to the screen under the opaque loader. After the second, call __skreedLoader.ready().
- On the next rAF after ready, phase becomes 'run': the intro clock starts at 0 and the loader hide starts on that same tick.
- Report 1: igloo's hide and introTL.play(0) fire on one tick.

A3 Hide (igloo's Svelte outro, exact, driven by the intro clock inside the module frame)
- Tape opacity = 1 - G(t/0.25); panel opacity = 1 - G(t/0.75), where G(x) = x<.5 ? 4x³ : .5(2x-2)³+1. The tape keeps scrolling during the fade.
- Remove #loader at t ≥ 0.766.
- Composite overlay: rgb = mix(SLATE, scene, uIntro), with uIntro = inOut3(t/1.0).
  - SLATE is raw sRGB (56,63,67)/255, applied after OutputPass, in every composite mode.
  - So loader = overlay = flat scene, and the hand-off is invisible. Igloo measured the centre unchanged at (160,165,177) through the whole fade.

A4 Flat first frame
- At uSkyP=0 the sky dome outputs linear (0.05666, 0.06642, 0.07234). three r165 ACESFilmic plus sRGB output turn that into exactly #383F43 (aces_inverse.py). It sits below the bloom threshold.
- At t=0 the floor, stones, fog cards and logo are all invisible (uniforms below), so the only early content is the outline crown at about 0.4 s and the first cage face at about 0.78 s.

A5 Poster path (no WebGL2, saveData or prefers-reduced-data, module error, 20 s stall, offline module failure)
- The tape stops. hero-poster.webp fades in over 300 ms inside #loader: a still of the final hero frame from this build, srcset 780w / 1280w, object-fit cover, placed so the logo sits where the hero puts it.
- Site logo, "Launch in", countdown and cue show at once with no plate reveal. Scroll is enabled.
- Section 2 copy and the Wall become plain flow DOM: no wipe, no fixed canvas.
- On save-data or no WebGL2 the module stops before importing three, so no WebGL bytes are spent.

A6 Reduced motion
- The tape is static (animation none, window parked at cell 45).
- Same ready gate. At ready the intro is set to its end state (progress(1)): print complete, floor and sky final, camera at the hero pose, cage, numbers and outline hidden, UI shown without plates.
- The loader fades with a 300 ms opacity, cubic in-out. No cage animation, no descent.
- The existing reduce rules (no bob, no shake, seconds hidden, static cue) stay.

B. INTRO (t = seconds after start; total 8.2 s; same numbers on phone)
Shared GLSL (igloo's helper, already partly in the composite):
- linstep(a,b,t) = clamp((t-a)/(b-a),0,1)
- falloff(x,s,e,m,p): M = m·sign(e-s); f = mix(s-M, e, p); return linstep(f+M, f, x)
- falloffsmooth: the same with smoothstep.

B1 Overlay: see A3.

B2 Outline (igloo's brick-edge wire, here our ten block loops)
- Geometry: one closed loop per block of PIECES.variants['10'], built from the boundary v[:nb]:
  1. toLocal.
  2. Pull toward the block centroid by 0.992 (the logo's seam).
  3. Douglas-Peucker at 1.5 viewBox units.
  4. Miter inset 0.05.
  5. Round corners over 25° with r 0.053 in 3 segments.
  6. Split straight runs to ≤ 0.222.
  7. Place at z = 0.477.
  - Result: about 388 segments in 10 loops. This is a port of the outline section of research/intro/tools/gen_intro_geo.cjs.
  - Shared seams read as double lines 0.1 apart, as igloo's brick gaps do. Non-indexed LineSegments.
- Material (shared with the cage):
  - ShaderMaterial, transparent, additive (three AdditiveBlending: SRC_ALPHA, ONE), depthTest false, depthWrite false, renderOrder 999, frustumCulled false.
  - Plain 1-device-pixel GL lines. Colour uLineCol.
- Fragment: idle = (sin(w.y·6+T·5)·.5+.5)·(cos(w.z·6+T·5)·.5+.5)·(sin(w.x·6+T·5)·.5+.5)·.8+.2, with T = uTime and w = world position. alpha = uOutA·idle·falloffsmooth(w.y, 2.73, -2.18, 2.89, uOutP).
- Front: f = mix(5.62, -2.18, p). Lines are fully lit above f and fade over 2.89 below it.
  - The crown of the mark (the upper loops of the top blocks) first shows at about 0.4 s. This is igloo's "asterisk".
  - The whole outline is lit by about 1.5 s. Front speed peaks at about 1.2 s.

B3 Cage (the "mesh skeletal thing"; built in the page from seed 20261009 with mulberry32, 0 bytes of data)
- Lattice: 2.0-unit voxels, cube centres at O + Ry(45°)·(2i, 2L, 2j), faces on odd coordinates, each cube inset 0.0015 per side so neighbours never share a line.
- 117 cubes. Quotas per layer L by radial band b = floor(r/3.433), with the outermost centre at 4.24·3.433 = 14.6:

  | Layer | Band quotas | Total |
  |---|---|---|
  | L-1 | [0,0,7,3,2] | 12 |
  | L0 | [0,15,28,23,19] | 85 |
  | L1 | [3,3,0,2,1] | 9 |
  | L2 | [3,3,0,0,0] | 6 |
  | L3 | [3,2,0,0,0] | 5 |

  - Igloo's L1 11 and L2 9 are spread over three layers because our mark rises 6.65 above the floor against the igloo's 4.2.
  - The top layer (y 1.4..3.4) clears the mark's top at 3.05, as igloo's y 3..5 clears its dome at 3.72.
- Placement: port the clump grower in gen_intro_geo.cjs.
  - L0 clumps use igloo's component sizes ×85/117 (28,18,13,11,8,7,6,3,3,3,2,2,2, then singles), never touching another clump.
  - L-1 sits directly under L0 cubes, L1 on L0, and L2 and L3 stacked on the layer below where possible.
- Each cube is igloo's 3-face shell: top, -z and +x in the lattice frame, 12 vertices and 6 triangles in the TPL stream order of the generator, rotated about up with weights 61/13/43/0.
- Draw: THREE.LineSegments(geometry with the triangle index). Pairs read (a,b)(c,c)(b,d)..., so each cube draws 6 axis edges (2 of them twice, brighter under additive), 2 zero-length pairs and 1 face diagonal of 2.83.
  - Totals: 1404 vertices, 2106 indices, 1053 pairs (702 of length 2.0, 117 diagonals, 234 zero).
- Attributes:
  - position
  - aCentr: the centre of the face the vertex belongs to, so each face pops as a unit
  - aPh: random 0..1 per unique corner position, shared by coincident vertices
- Fragment: alpha = uCageA·falloff(length(aCentr-O), 0, 20, 5, uCageP)·(sin(vPh·13 + uTime·6)·.5+.5).
  - The phase interpolates along each line, so bright dashes crawl about 2 cycles per edge instead of whole lines blinking. 6 rad/s is about 0.95 Hz.
- Front: fully lit at R = 25u-5, zero at 25u, a linear 5-unit shell.
  - First face at about 0.78 s (nearest face centre about 2.2 from O).
  - All faces touched at about 2.4 s, all fully lit at about 3.0 s.
  - Strong until 3.4 s, half at 3.8, faint at 4.2, invisible by about 4.6. Hidden at 5.1.
- Brightness: uLineCol = Pearl × uLineGain.
  - The default gain matches igloo's line-to-ground luminance contrast (lines at 205-220 on 160, ratio about 1.8): lines read about 100 sRGB on the 56-67 slate before bloom.
  - Expected gain about 0.3. Expose it as a Tune slider "Intro lines" 0.1..1 and lock it from the 1280 capture.

B4 Number sprites
- Anchors: 58.5% of unique lattice corners (seeded pick), each offset (+0.1, +0.1, 0) in the lattice frame (right and up). About 260 points.
  - Attribute aD = |p-O|, giving distances from about 1.9 to 16.
- THREE.Points with a ShaderMaterial: additive, no depth test or write, renderOrder 1000, frustumCulled false.
  - gl_PointSize = uResY/100 in drawing-buffer pixels: 8 CSS px at 800 tall on any DPR, 8.4 on an 844 phone.
- Atlas, drawn at runtime on a 32x1024 black canvas: 32 cells of 32x32, stacked top to bottom.

  | Cells | Content |
  |---|---|
  | 0-7 | blank |
  | 8-9 | "+" |
  | 10-29 | 00 08 11 18 23 29 32 38 41 47 54 59 63 68 71 76 83 87 94 99 |
  | 30-31 | "+" |

  - Glyphs: Open Sans 600 24px in white (Open Sans figures are tabular by default), left x 2, baseline at cell top + 25, so the glyph box is about x 2..30, y 8..25 like igloo's. "+" is centred at x 16.
  - Texture: CanvasTexture, flipY true, mipmaps, LinearMipmapLinear.
- Fragment:
  - n = floor(uNumP·48 - vD); cell = (n>=0 && n<=30) ? n+1 : 1 (blank)
  - uv = (pc.x, 1 - (cell + pc.y)/32); colour = uLineCol·2.5·tex.r (clamped), keeping igloo's numbers-to-lines ratio
  - alpha = 0.5·falloff(vD, 0, 20, 5, uNumP)
- Behaviour: each sprite shows blank, then "+" twice, then 00 to 99 (one glyph per Δu = 1/48), then "+" twice, then blank.
  - The count wave runs about 9 units behind the alpha front: count front 48u-9 is 9.4 at 1.5 s, 17.7 at 2.0 and 24.9 at 2.5.
  - Sprites showing a number: 0 at 1.0 s, about 250 at 2.3 s, 0 by 3.6 s.
- Igloo's uAlpha 1→0 tween from 1.75 to 3.75 s is dead code (the shader never reads it), so it is omitted.

B5 Print (igloo's solid materialising)
- logoMat gains uPrint and tTri, on the non-ROCK path only. Before gl_FragColor:
  ```
  if (uPrint < 1.0) {
    float e = 1.0 - falloffsmooth(vRest.y, 3.38, -2.905, 2.17, uPrint);
    if (e > 0.9999) discard;
    e += clamp(e * texture2D(tTri, vRest.xy * 0.6).r * 13.0, 0.0, 1.0);
    col = clamp(col + e * uPrintCol, 0.0, 1.0);
    a = max(a, step(0.001, e));
  }
  ```
  - uPrintCol = Pearl (linear). The added band reaches 2× and is clamped, so it saturates to white as igloo's does.
  - Setting the alpha marker to 1 in the band lets the save/restore pass bloom it even on the black faces.
- Leading edge E = 3.38 - 8.455p. Top of the band f = E + 2.17.
- Ease igloo_ease_1 (M0,0 C0.662,0.073 0.047,1 1,1) over 2.25 s from 1.1:
  - The first pixels on the top of the mark come at about 1.45 s: a flat white cap with a ragged triangle-patterned rim.
  - It is slow until about 1.85 s. The band then sweeps the rest in about 0.25 s, passing the bottom at -3.05 by about 2.1 s.
  - The glow sinks below the base from 2.1 to 2.5 s.
  - Edge values: E 3.29 at 1.25, 2.92 at 1.5, 1.99 at 1.75, -1.44 at 2.0, -3.62 at 2.25, -4.41 at 2.5.
- The logo mesh is hidden at 0 and shown at 1.1 (the warm-up already drew it).
- Breath gate (igloo's introDisplacementModulator): 0→1 linear over 2 s from 2.0, multiplying the existing breath term.

B6 Floor: snow disc and triangle ring (igloo's terrain, base and patches)
- Applies to the moon ground and the stones through onBeforeCompile.
  - Both become transparent:true, depthWrite true, renderOrder -1, permanently, so no program switch at the end.
  - At rest the chunk is skipped (uU2 = 1), so alpha is 1 and colour is unchanged.
- Chunk (w = world position, base = the material's colour after the existing map, tone and crumb code):
  ```
  if (uU2 < 1.0) {
    float nz = texture2D(tMosaic, w.xz * 0.07).r;
    float tri = texture2D(tTri, w.xz * 0.25).r;
    float g = length(w.xz - O.xz) + nz * 3.5;
    float tf  = 1. - falloffsmooth(g, 0., 32., 8., uU2);
    float tf2 = 1. - falloffsmooth(g, 0., 32., 3., uU2);
    vec3 c = base + (tf * tri * 3. + tf2) * uGlowCol;
    float tA = falloff(g, -0.1, 31.9, 0.1, uU2);
    float trA = falloff(g, 1., 33., 0.1, uU) * (1. - falloffsmooth(g, 0., 32., 10., uU)) * tri;
    c += uGlowCol * (1. - tA);
    float a = tA + trA * (1. - tA);
    float far = smoothstep(32., 36., g) * uFarA;   // our far floor plays igloo's mountains
    c = mix(c, base, far);
    a = max(a, far);
    diffuseColor = vec4(clamp(c, 0., 1.), a * uFloorA);
  }
  ```
  - uGlowCol = Pearl (linear) × 0.45, the luminance of igloo's (0.3,0.45,1.0).
- Textures (runtime, 0 bytes):
  - tMosaic: 32x32 R8 DataTexture, seeded uniform random, NearestFilter, Repeat. One cell is about 0.45 units, with up to 3.5 units of square jitter, which gives the stair-stepped edge.
  - tTri: 512x512 R8, Repeat, linear with mipmaps.
    - A 14x14 jittered grid (±0.35 cell), periodic, each quad split on a random diagonal.
    - Edges stroked 1.5 px white on black, with wrapped copies.
    - About 200 vertices per tile, edges about 37 px (0.29 units at ×0.25), ink 9-11%, as Report 3 measured igloo's.
- Values:
  - Disc D = 32.1·u2 - 0.2 with a hard 0.1 edge: 1.2 at 2.0 s, 3.2 at 2.5, 8.5 at 3.0, 19.0 at 3.5, 24.2 at 4.0, 28.6 at 5.0, 31.9 at 8.0.
  - The white rim bands trail inside the edge: [40u2-8, 40u2] with triangles ×3, and [35u2-3, 35u2] flat.
  - The triangle ring leads at 0.9 + 32.1u with a 10-unit tail.
- The disc pops in at 2.1 s as a white pool under the mark (uFloorA hard switch).
- At P0 the visible floor runs z -18.7..9.8 on desktop, so snow covers the frame by about 3.3-3.5 s, as on igloo. The phone sees z -42.8..15.2; its far part is the far field, faded in from 0.7 s.
- Fog cards (igloo smoke): FOG.uOpacity 0→1, power2.inOut, 3 s from 2.0. Igloo's snow particles have no counterpart here, so nothing is added.

B7 Sky
- Sky dome fragment: c = mix(uFlat, sky, uSkyP), with uFlat as in A4.
- While uSkyP < 1, directions below the horizon (dir.y < 0) use the dome's horizon-row colour instead of the texture, so the not-yet-snowed floor shows a flat night rather than the texture pole.
- uSkyP 0→1, power2.inOut, 3 s from 1.5. The frame moves from slate to night between 1.5 and 4.5 s.
- Igloo's diagonal colour-correction gradient is not added: the hero grade is already approved.

B8 Bloom
- strength = 1.5·P.bloom until 2.5 s, then sine.inOut to P.bloom by 4.5 (igloo goes 1.5→1).
- threshold = 0.08 until 2.5, then sine.inOut to 0.62 by 4.5.
  - This ramp is our addition: igloo blooms at 0.2 on bright grey. On slate the lines sit lower, so the threshold sits just above the flat sky (luminance 0.065) and the lines, numbers, print band and snow rim bloom before returning to the hero's 0.62.

B9 Camera
- w = inOut1 (M0,0 C0.5,0 0.1,1 1,1) over 5.5 s from 2.0.
- basePos = lerp(P0, heroBasePos, w) and baseTgt = lerp(T0, heroBaseTgt, w). heroBase* is the existing pose (camFrom→camTo by the scroll s, plus the tail).
  - So a scroll after 5.0 s blends into the pull-back, as igloo's timeline pose carries its scroll.
- camY: 22.05 (≤2.0), 21.21 (2.75), 18.82 (3.25), 16.32 (3.5), 12.56 (3.75), 8.71 (4.0), 3.76 (4.5), 1.08 (5.0), -0.52 (5.5), -1.52 (6.0), -2.41 (7.0), -2.50 (7.5).
- Target y runs from -2.8 to -1.0 alongside. The camera never goes below the floor (1.2 above it at z 24).
- Parallax, shake, bob and push are multiplied by touch = power2.inOut over 5 s from 2.0 (igloo's touchAmount).
- camA.zoom stays min(1, aspect·1.25).

B10 UI (igloo's webgl_show_ui_intro at 4.5 s and its uShow beats; DOM here, not MSDF)
- Hidden from t=0 with clip-path, not visibility, so screen readers still read it: site logo, "Launch in", the countdown row, the cue.
- Plate reveal (igloo's uShow1 plate, then uShow2 text):
  - A Pearl plate (square corners, no shadow) grows from the line's left edge: scaleX = sine.out over 0.4 s.
  - The text appears left to right over 0.75 s linear, in whole characters (whole number groups for the countdown).
  - The plate's left edge follows the text front, so the plate only covers what is not yet written and is gone when the text completes.
- Beats:

  | t (s) | Event |
  |---|---|
  | 4.50 | event fires |
  | 5.25 | site logo shows via logoGlitch.intro, i.e. burst(0.5) with PAIRS[0] (igloo logo: 0.75 s delay, 0.5 s linear); settled 5.75 |
  | 5.53 | "Launch in": plate 5.53-5.93, text 5.53-6.28 (igloo message) |
  | 5.63 | countdown row: plate 5.63-6.03, groups 5.63-6.38 (igloo on/off labels) |
  | 5.63 | cue "Scroll": plate 5.63-6.00, text to 6.37; ball and line appear and start at 6.37 |
  | 6.80 | everything settled |

- Scroll unlocks at 5.0 s, where igloo enables scroll and swaps its composite.

B11 Hand-off to the live hero
- live = touch(t) during the intro and 1 after. This replaces the 2 s ease-out from the old cut and __introDone.
- The breath term additionally uses the breath gate (B5).
- Rock solve (rocksPump 4 ms per frame) does not start before 5.1 s (cage hidden). A scroll past 0.3 still forces it.
- Labels keep their gate (live > .5, about 4.5 s).
- The idle glitch timer starts after 5.75.
- introDone = true at 8.2 s.
- Intro clock: dtI = raw > 0.5 s ? 1/30 : min(raw, 1/12). This is igloo's GSAP lagSmoothing(500,33) plus the template's 1/12 cap, so a hitch slows the shot instead of skipping it. It reads rAF timestamps or performance.now only.
- Skip to the end state at ready (standard 750 ms fade) when: location.hash is set, scrollY > 0 at ready (restored scroll), or ?intro=0. Igloo skips the same way for deep links.
- Optional smoothness parity: igloo's adaptive DPR.
  - Sample fps from 10.2 s.
  - Every 4 s with ≥ 5 samples: below 30 fps lowers the multiplier by 0.1 (floor 0.6); 60 or more raises it by 0.1 (cap 1).
  - Stop after 4 flips. Never inside the intro.

C. PHONE (390x844)
- Identical timeline and values: igloo ships one timeline. camA.zoom .5776 gives a vertical fov of about 49.7°.
- The cage ring fills the portrait frame. Numbers are 8.4 CSS px. The DPR cap stays 1.25 on touch. The ghost sweep starts only when live reaches 1.
- Scroll lock 0-5 s on iOS: html.intro{overflow:hidden;overscroll-behavior:none} plus a non-passive touchmove preventDefault, removed at 5.0.
- Plates and text use the existing corner insets.

D. NO-WEBGL / DATA-SAVER: the poster path (A5). The inline loader decides before the module imports anything.