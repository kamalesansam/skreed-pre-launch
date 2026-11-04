# Section 2: the ten gems (spec)

Status: planned 2026-10-10. Look decided by Sam on 2026-10-10: **Gem C**, approved as rendered ("gem c looks perfect"). Labels and hover: igloo's text, font and hover, exactly (Sam, 2026-10-10). Standalone prototype of the field with labels and hover: `prototypes/section-2/` (live: https://claude.ai/artifact/ArbU2rDdfmjuFMBVbmAWfn). Prototype first, on the approved hero and intro prototype (`prototypes/hero-v9/template.html`, v10), then ported into the Astro hero island.

Sources (measured; all numbers below come from them):
- Scroll choreography: `research/s2gems/STUDY-study-scroll.md`, `scroll/choreo.json`, `scroll/animatic.html` (session scratch).
- Labels and hover: `research/s2gems/STUDY-study-labels-hover.md`, `labels-hover/data/skreed-labels-hover-recipe.json`.
- Background: `research/s2gems/background/RECIPE.md`, `STUDY-study-background.md`.
- Float: `research/s2gems/float/REPORT.md`.
- Look: `research/s2gems/lookdev/lookdev.src.html` (look C), judges in `STUDY-lookdev-judge-*.md`. Live comparison page: https://claude.ai/artifact/DfDgwjkrx5TQ4krsyW1NSB.

igloo.inc was measured, never copied. No igloo code, model, texture, font or string ships.

## 1. Goal
The ten blocks of the Skreed mark leave the logo together (one at a time until 2026-11-02, section 14), fly down into a field of ten floating gems, one per colour family, and each gem opens its family's 24 shades. Brand goals served: 1 (the 240 shades are the product) and 2 (a site people remember and share).

## 2. Wireframe in words

### 390 x 844 (phone first)
- **Hand-off (scroll 1.5 to 2.5 screens, the hero's wipe, unchanged).** The hero's igloo-style cut wipes the snow scene away to the fog. The logo is not cut: it lifts out of the hero and rides up to v 0.16 of the screen at 0.181 H tall.
- **Cascade (2.0 to 6.1).** From mid-wipe the blocks lift off in catalog order, one every 0.4 screens. Each flies 0.5 screens down, swelling to 1.12x mid-flight with a seeded tumble, turns from matte black block into its gem in the air, and settles in its slot. The logo empties in pairs (centre bar, top, bottom, two diagonals). Slots during the cascade: a two-column zig-zag at scale 0.78, u 0.377 / 0.624, v 0.319 to 0.912.
- **Re-frame (6.1 to 6.8).** The empty logo is gone. The field moves up and zooms in x1.28 (gems grow from 64.5 to 83 px): u 0.342 / 0.658, v = 0.120 + 0.0845 j, pitch 142.6 px.
- **Rest (6.8 to 7.1).** Ten gems float. Each has its family name beside it on the inner side at the gem's height, 12 px Open Sans 600. Nothing else is on screen: no headline, no copy, no buttons.
- **Tap a gem:** a short frost splat on pointerdown, then the native link opens `/shades/<family>/`.
- **Drag across a gem:** frost paints along the finger, as on igloo. A drag that becomes a scroll stops painting at pointercancel.
- **Leave (7.1 to 8.1).** Wipe 2 into section 3's fog ground (this background alone; the quiz rises after it, docs/specs/quiz.md).

### 1280 x 800
Same scroll map. The logo rides up to v 0.26 at 0.313 H. Two rows of five in reading order (families 1 to 5 on top), the second row offset half a pitch, every neighbour exactly p = min(W/5.6, 0.33 H) = 228.6 px apart, gems 149 px (0.186 H). During the cascade the rows sit at v 0.539 and 0.787; the re-frame moves the field up 0.163 H to v 0.376 and 0.624 (top row u 0.098, 0.277, 0.455, 0.634, 0.813; bottom row u 0.188, 0.366, 0.545, 0.723, 0.902). Labels upper-right on the top row and lower-right on the bottom row; Roaring Red flips to upper-left. Hover paints frost along the pointer.

## 3. Content
- Copy: none in the scene. The only strings on the gems are igloo's three labels per gem, carrying our facts (uppercase, as igloo):
  - Title (always shown): the family's name in the singular, uppercase (Sam, 2026-10-10: "not reds, it's red"; Basic Brown is Basic Brown): `FROSTY WHITE`, `BLISSFUL BLUE`, `PLAYFUL PINK`, `VIVID VIOLET`, `MELLOW YELLOW`, `BASIC BROWN`, `BLUSHING CORAL`, `STORMY GREY`, `GO GREEN`, `ROARING RED`. No `FAMILY_nn` line.
  - (Removed by Sam, 2026-10-10: no shade name, number or hex on hover.)
  - Call to action (igloo's date slot), on the active gem only: `24 SHADES` over `CLICK TO EXPLORE` (`TAP TO EXPLORE` on touch) (igloo: `D 01.02.2020` over `CLICK TO EXPLORE`).
- The cue's words (2026-11-02, `docs/specs/scroll-cue.md`, E-cue-text): "Scroll to see more", the one line outside the labels, IBM Plex Mono Medium in capitals at `--fs-label` (E-chrome-font; 14 px beside the labels' 12 and 13 px), Urban Slate over the fog, in the bottom left corner on phones and the bottom right on laptops, shown once the page has rested in the pin and gone at the next scroll; not a label, so it shares the labels' face and nothing of their reveal or hover.
- Accessible names (not visible): each link reads "<Family>, 24 shades", e.g. "Blissful Blue, 24 shades". The section's landmark is labelled "Colour families".
- Gems, slot j = catalog order, each in its family's key shade (the hero block's colour):

| j | Family | Key shade | Hex | Hero block id | Link |
|---|---|---|---|---|---|
| 0 | Frosty White | Snow | #f0f4f5 | 2 | /shades/frosty-white/ |
| 1 | Blissful Blue | Sky | #08bcf4 | 3 | /shades/blissful-blue/ |
| 2 | Playful Pink | Rouge | #f2638f | 7 | /shades/playful-pink/ |
| 3 | Vivid Violet | Amethyst | #8554d1 | 5 | /shades/vivid-violet/ |
| 4 | Mellow Yellow | Sunbeam | #fff164 | 6 | /shades/mellow-yellow/ |
| 5 | Basic Brown | Cinnamon | #ba7237 | 4 | /shades/basic-brown/ |
| 6 | Blushing Coral | Mango | #ff9f40 | 0 | /shades/blushing-coral/ |
| 7 | Stormy Grey | Silver | #acacac | 1 | /shades/stormy-grey/ |
| 8 | Go Green | Lawn | #4aa325 | 8 | /shades/go-green/ |
| 9 | Roaring Red | Crimson | #d20000 | 9 | /shades/roaring-red/ |

- In the single-file prototype the links are in-document routes (`#/shades/<family>/`) into the family-pages prototype merged into the same file; on the site they are real paths (family-page.md 2.2).

## 4. Look: Gem C
- **Geometry:** one deformed faceted polytope per family, built at init by half-space clipping of a box (22 to 30 seeded cut planes around a tall, flattened ellipsoid, a few deep cleaves, a narrow bevel on every edge sharper than 20 degrees), longest side 2.4 units. Our own code (lookdev `gemGeometry`).
- **Material:** one pass. Screen-space refraction of the background (IOR 1.70, per-channel split R x0.985, B x1.03), two inner bounces traced against the gem's own facet planes (up to 32), shade absorption, and a luminous core of radius 0.32 at the centre. Khronos Neutral tone curve. Bloom on the gems' target only, threshold 0.75, intensity 0.7.
- **Fixes the judges suggested** (optional since Sam approved Gem C as rendered; pending Sam):
  1. Cap the core's emission by the shade's lightness (Snow, Silver, Sunbeam) so it never clips to white and never reaches past the silhouette. Measured: no gem pixel above sRGB 250 outside a 3 px specular glint, and core light zero outside the gem's mask.
  2. Give the dark shades (Amethyst, Crimson, Cinnamon, Rouge) facet darks: total internal reflection to a dark studio floor, so each gem has a dark share of at least 0.10 of its pixels at L* under 25.
  3. Raise Crimson's chroma: median stone chroma at least 0.80 of the shade's chroma.
  4. Motion test for shimmer: frame-to-frame change inside a gem at rest under 3 sRGB levels median (temporal stability of the traced reflections).
- **Block to gem morph:** uMorph = smoothstep(0.10, 0.75, L) per block. At 0 the block is the hero's matte black block (its existing material); at 1 it is the gem. The morph is driven by the block's own flight progress only, never by the screen cut.

## 5. Motion plan
Everything lives in the hero's one WebGL island (CLAUDE.md "Always do", E-C3). No GSAP; the hero loads none (E-GSAP). Reduced motion through `matchMedia` and CSS.

- **Scroll map (screens of 100svh, S is the lagged scroll; Sam, 2026-10-10: a longer scene move, nothing flies up, a long slow flight; superseded by section 13 and then by section 14, the map of 2026-11-02):** PULL 0 to 2.6, the camera backing away along a level S-curve round the logo (heights within a metre, over the ground's measured heights; points in degrees, distance, height: (0, 24, -2.5), (-9, 26.5, -2.15), (5, 29, -1.95), (24, 32, -1.85), (35, 34, -1.8), then on past the pull-back, where only the logo is seen, (44, 38, -1.7), (40, 44, -1.5), (28, 50, -1.3), (15, 56, -1.1)). WIPE 1 2.6 to 3.6: igloo's cut, the hero layer held still (no slide) and the logo kept over section 2 through a mask, behind anything section 2 draws in front of it. CASCADE from 3.1: block j lifts off at 3.1 + 0.8 j and lands 1.8 screens later; the last lands at 12.1. REST 12.1 to 12.8. WIPE 2 12.8 to 13.8 into section 3's fog ground (the quiz). Track 1580svh. Built in v11 (`prototypes/hero-v9/`, live on the hero link).
- **Per block j:** L_j = clamp((S - 3.1 - 0.8 j) / 1.8, 0, 1) (since 2026-11-02 one L = clamp((S - CAS0) / FLY, 0, 1) for the ten, section 14), e = cubic-bezier(0.42, 0, 0.12, 1) of L (a slow lift, a long glide, a long settle). The block's copy (its own triangles, matte black) starts at the block's exact view-space pose in the receding logo and follows a cubic curve that lifts and swings out to one side (0.38 of the distance), then comes in from above and in front to its slot; it tumbles mid-flight and its edges warm to its shade, folds into a point (L 0.42 to 0.62) as the gem grows out of it (0.50 to 0.78) and its core lights (0.5 to 0.85) (since 2026-11-04 it keeps its size and turns into its gem by the family pages' wave over L 0.4 to 0.7, section 16); the gem eases into its resting pose and igloo's float fades in over the last 15 percent.
- **Followers and speed limit:** igloo's two followers (0.075 then 0.15 per frame) with a cap of 0.075 screens per frame on the first; K moves at most 3 blocks per second.
- **Holds:** re-frame and wipe 2 read min(S, 6.1) until every block has landed (K = 10.25); wipe 1 reads max(S, 2.0) until the logo is whole again (K = 0).
- **Auto-settle (igloo's 1.4 s rule):** wheel and keys only, never on touch or under reduced motion. In the cascade it goes to the nearest K in {0..9, 10.25}; duration clamp(6 |dS|, 1.6, 2.4) s, inOut3. Section 4's glue is a separate settle and acts on touch too, instantly under reduced motion, by E-S4-snap (Sam, 2026-10-22: "page sections only, same on touch"; `docs/specs/section-4-flux.md` section 2, "The elastic glue", and section 10): only over the page's three seams (the first wipe, `S2T.PULL` to `S2T.W1END`; the quiz seam; section 4's own seam), never inside the cascade, where this auto-settle, on touch too by the same exception, is section 2's to build (section-4-flux.md section 8).
- **Reverse is exact:** scrolling up runs everything backwards; Roaring Red leaves the field first.
- **Idle float (igloo's, measured):** gems never translate. Each turns about its centre: rot_a(t) = 0.1 sigma sin(w t + K_a s), K = (42.987, 12.423, 2.53), s a per-gem seed in [0, 1), sigma = sign(s - 0.5), Euler XYZ. w = 0.3 rad/s, varied per gem by up to 10 percent so ten gems on one screen never move in lockstep (Sam to confirm; default on). The camera's look direction drifts by igloo's six-sine noise at 0.0129 rad (scaled for our 30 degree fov), position fixed.
- **Labels (igloo's text, font and reveal; Sam, 2026-10-10):** IBM Plex Mono Medium (SIL Open Font License, self-hosted on the site), uppercase, Pearl Whisper, 13 px desktop, 12 px phone, line-height 1.08, as DOM text over the canvas (aria-hidden; the links carry the names). igloo's layout per gem: the title on a 1 px two-segment leader (45 degrees from the gem-local anchor (0.35, 0.85, 0.93), then horizontal under the text), the shade pair beside the gem's upper right without a leader, the call to action right-aligned over a rule that runs out from the anchor (0.70, 0.25, 0.95). Anchors are taken in the gem's rest frame and re-projected every frame, so labels ride the float and the parallax. With ten gems on one screen, the title shows on every gem and the shade pair, the call to action and igloo's plexus show on the active gem (pointer over it, or keyboard focus), the way igloo shows them on the stone in its centre band. Titles are placed once per layout: igloo's up-left first, mirrored, then beside the gem (phones: the inner side first), avoiding the 16 px gutters, other gems and other titles. Reveal, igloo's three tracks: leader 0.2 s (segment 1 then 2), text alpha wiping left to right over 0.4 s (per character alpha = clamp(11u - 10x, 0, 1)), glyph roll over 0.75 s (each letter counts down through the five glyphs after it in its 8-glyph code-point block and lands on itself). Hide: leader retracts 0.2 s, horizontal segment first; text wipes out right to left over 0.2 s. In the cascade, a title reveals when its gem's L crosses 0.9 and hides below 0.8 and when wipe 2 starts. No backing plates: igloo sets white text straight on the fog (about 2.5:1); plates read as grey boxes (tested) (see section 12).
- **Plexus (igloo's, on the active gem):** 18 points on a cylinder at 0.72 to 0.9 of the gem's bounding radius, orbiting at up to 0.25 rad/s on a slow vertical treadmill, links to up to 3 neighbours, "+" crosses of about 6 px, faint grey lines dashed by noise, depth-tested against the gem, growing in over 0.35 s, out over 0.25 s. Desktop only.
- **Hover (igloo's, measured):** a pointer-frost buffer per hovered gem. Pool of 3 RGBA16F 512 x 512 ping-pong pairs, least-recently-used; phones 256 x 256 at 30 Hz. Step at a fixed 60 Hz (at most 2 steps a frame): flow advect (std 0.22 texel, drift (0.10, -0.07)), 4-neighbour max (dilation), capsule splat of radius 0.05 x smoothstep(0.1, 1, vel), decay 0.985, rim = growth this step. Velocity: target = clamp((target + 6e) x 0.88), vel = lerp(vel, 1 - (1 - target)^5, 0.1), reset after 0.15 s idle, on enter and leave, or on a jump over 0.3. Drawn on the gem: facet micro-roughness x (1 - f); emissive += g x rim colour + lattice x g x 10 + lattice x f^2, rim colour igloo's #83a1c5 (a render light, E-A2b); the whole frost emission x2.5, because igloo blooms its scene from a 0.2 threshold and Gem C blooms from 0.75, so the crackle reads as bright as igloo's. The gem's rest look is unchanged while its buffer is empty. Lattice: our own baked tile (jittered 12 x 12 grid, periodic Delaunay, lines 1.5 to 1.9 px, vertex dots 3 px), triangle edge 0.045 of the gem's projected width, at least 6 px. Peak rim brightness 1.0 at birth, 0.5 at 0.2 s, gone about 3.7 s after the last movement. Pointer parallax, igloo's camera orbit re-made as a turn of each gem in place: 8.8 degrees yaw and 4.4 degrees pitch at full deflection, damped 0.035 per 60 Hz frame, half rate on touch, springing back on lift. Nothing else moves on hover: no scale, push or halo. Cursor pointer.
- **Background (igloo's section 2, re-created, our code):** fog from one 64 x 64 noise texture (seed 249, igloo's measured frequency content) sampled at two scales, s = 0.3 (u x aspect, v), t = 0.075 x time, octave offsets (-t, 0.25t - 0.65 x progress) and (t, -0.5t), mapped through the measured 21-stop ramp (#edeff4 at p 0, #9da1af at 0.5, #232936 at 1). Jittered 1 px dots on an H/13.5 cell, twinkling on a 10 s triangle wave. Grain at dither level (sd 1.3 levels). Six defocused wireframe gem sprites (our own atlas, strength 0.27) spinning 2.3 to 10.8 degrees a second. Scroll treadmill T = 0.5 x (S - 2.5) stone steps. The background never blooms. The blurred text layer is **off** (Sam: no text in this section). Since 2026-10-29 (E-fog-hue; Sam, 2026-10-26: "mild hues here and there, instead of just having grey and silver, likethey jsut appear and then goes back to grey", and 2026-10-29, for this section's fog too: "yes, and all the other section where the same backround is used"): three soft patches of shade hue at a time, the gems' key shades without Snow and Silver at the fog's own OKLab lightness and a quarter of their chroma, shaped by the fog's noise in two octaves in its lighter clouds, each on a sin² of 12 s a third of a cycle apart, a new shade and place while grey, never Amethyst beside Sky, from the clock section 3's ground shares (`section2/hues.ts`, `config/fog-hues.ts`; `docs/specs/quiz.md` section 10, item 18; Tune's "Sections 2 and 3" group).
- **Background reused by section 3:** the same background material is rendered alone by section 3's fog ground (`src/scripts/hero/section3/ground.ts`: no gems, no labels, `uPre` 0, `uLabN` 0, the fog scrolling on through the second wipe and drifting under the quiz); section 2's backing plates stay off there too (the quiz's text stands straight on the fog since 2026-10-19, E-S3-contrast; the hues stay on under the quiz's result too, Sam, 2026-10-29: "keep it on").
- **Reduced motion:** same scroll map and track. No pull-back, tumble, swell, float, camera drift, auto-settle or wipe displacement. The logo cross-fades to its cascade framing over tp 0.4 to 0.6. Each block fades out of the logo while its gem fades in at its slot (L 0.42 to 0.58). Labels fade in over 0.2 s at L 0.6, without the leader draw or roll. Re-frame is a 0.3 s cross-fade. Background time frozen, twinkle fixed, grain off. Hover: a static frost patch of radius 0.12 uv, in 0.15 s, out 1.5 s, no rim. Pending Sam (hero.md section 11): whether reduced motion gets this 3D tier or the poster.

## 6. Data and states
- Inputs: scroll, pointer, touch, keyboard. Outputs: navigation to `/shades/<family>/`, analytics event `family_open` with `{ family, from: 'gem' }`.
- **Loading:** section 2 has no loader of its own. Gem geometry, materials and the lattice tile are built during the hero's loader (new milestones `gems` and `lattice` reported to `__skreedLoaderReport`, weights measured) and compiled in the hero's `compile` and `warm` steps, so the first cascade frame costs no shader compile.
- **Slow device:** if the gem build is not finished when the scroll reaches S 2.0, the scroll holds at the wipe (as template7 did for the rocks) and the hero's "Still loading" line shows; it never shows half-built gems.
- **Error / no WebGL / context lost / data saver / 2g / low memory:** the poster path. Section 2's poster is a static image of the settled field per breakpoint (AVIF, at most 120 KB each) with ten real `<a>` links laid over the gems' rest positions, labels in the DOM. Context lost after the field is up: the canvas is replaced by that poster without moving the links.
- **Offline:** the page is already loaded; links to family pages still navigate (the browser shows its own offline page if the family page is not cached). No section-specific message.
- **Empty, no results, validation, permission denied, session:** n/a (no data entry, no permissions, no sessions). Argued: the ten gems are static data asserted at build (10 families, each with its key shade present).
- **Success:** a tap or click navigates; the frost splat is the only feedback.

## 7. Budget
- JS: section 2 adds at most 18 KB minified and 7 KB gzipped to the hero island (gem builder, material, cascade, labels, frost, background). Shaders are counted in that.
- Images: none on the 3D path. Poster path: two AVIF stills, at most 120 KB each, loaded only on the poster tier and lazily at S 1.5.
- GPU: at most 3 frost pairs (12 MB at 512, 3 MB at 256), one extra full-size HalfFloat target for the gem pass, the bloom chain at half size. Gem build under 150 ms on a Redmi-class phone; at most 6 new programs.
- Frame: the settled field with one gem hovered must not cost more than 1.6x the hero's rest frame (measured as a ratio under SwiftShader and on a real device before the port).

## 8. Acceptance criteria
1. **Cascade, one at a time (CHECKLIST F1, D4).** Frame sets at S 2.0, 2.2, 2.5, 3.0, 4.0, 5.0, 6.1, 6.8 at 390 x 844 and 1280 x 800 show the blocks leaving in catalog order, at most one block in flight in any frame, each landing in its slot. A scripted wheel fling of 4800 px still gives lift-off gaps of 0.33 s or more. (Withdrawn on 2026-11-02: the ten leave together, section 14.7, criterion 2.)
2. **Gem C read (A5, F1).** At rest the gems match the approved Gem C render (the live comparison page, look C) within 2 sRGB levels median per gem at the same pose and time; shimmer under 3 levels median frame to frame.
3. **Float (F1).** Logged gem rotations match rot_a(t) = 0.1 sigma sin(w t + K_a s) within 1e-4 rad over 30 s; gem centres move under 0.5 px; per-gem w spread within plus or minus 10 percent of 0.3 rad/s.
4. **Labels (A3, A4).** Ten titles with the exact strings of section 3 in IBM Plex Mono 500 at 13 px (desktop) and 12 px (phone), each inside 16 px gutters and none overlapping another gem or title at rest at 360, 390, 430, 768, 1024 and 1280 wide; the active gem adds its shade pair and call to action; reveal timings within one frame of 0.2 / 0.4 / 0.75 s on a virtual clock; the roll lands every character on its own glyph.
5. **Hover and touch (D4, B2).** A scripted pointer sweep (11 frames, 150 ms apart) paints frost with a visible rim and lattice on the hovered gem only; the rim's peak brightness halves by 0.2 s +- 1 frame and is gone by 3.7 s; no scale, translation or halo change on any gem. On a phone, a drag paints frost, a tap navigates, a scroll gesture over a gem scrolls the page.
6. **Links (E3, G21).** Each gem is a real link with the accessible name "<Family>, 24 shades", reachable by Tab in catalog order with a visible Ember focus ring on the gem's position, activated by click, tap and Enter; the hit area is at least 44 x 44 px; each opens its family page.
7. **No copy, no stray text (A1, A4).** The section's visible text is exactly the label strings of section 3, and, at rest, the cue's words "Scroll to see more" at the bottom (2026-11-02, `docs/specs/scroll-cue.md`, E-cue-text); no headline, sub-line, blurred text or button; zero em dashes, emojis or buzzwords.
8. **States (D2, D3, H1).** Reduced motion gives the fade-based cascade with no float, drift or tumble; the poster tier shows the field still with ten working links; no WebGL and context loss land on the poster with links in place; a slow gem build holds the scroll at the wipe and never shows half-built gems.
9. **Hero unchanged (F1).** At scroll 0 the hero's rest frame differs from v10's by under 1 percent of pixels away from the countdown numerals; the loader and intro timings are unchanged; the loader budget stays under 10,000 B.
10. **Performance and safety (C1, C4, E1).** Section 2 adds at most 7 KB gz of JS; page module parses (`node --check`); under the artifact's strict CSP there are zero violations, zero console errors, no fetch, eval or WebAssembly; the settled-field frame costs at most 1.6x the hero's rest frame.

## 9. Decisions taken (cheaper on a phone where the brief was open)
- Pace: 0.4 screens per lift-off, track 910svh (igloo's own pace of one screen per block would make the track about 15 screens). Since 2026-11-02 there is no pace: the ten leave together and the track is 675svh (section 14).
- Departure order: catalog order (some paths cross in front of the logo; changing that would change the approved hero's colours).
- Phone layout: all ten on one screen at 83 px in a zig-zag, not igloo's one stone per screen.
- Desktop layout: 5 + 5 band, not a 3-4-3 hex.
- Label colour: Pearl Whisper straight on the fog, as igloo's white (no plates).
- Plexus on the active gem only (igloo shows it on the stone in its centre band; ten at once would crowd the field).
- Background dots are jittered within their cells (rule 43); grain stays at dither level (rule 20); the sprites are defocused wireframe gems, not filled blur blobs (rule 42).
- The background's blurred text layer is off.
- The fog's hue patches (2026-10-29, E-fog-hue) are shaped by the fog's own noise and sit in its lighter clouds, soft-edged, never round blobs (rule 42), at the fog's lightness, so the labels' contrast holds (E-S2-contrast).

## 10. Exceptions this section needs (hero canvas only; to add to CLAUDE.md "Approved exceptions" when Sam confirms)
- E-12 extends to the gems' float, the background's drift, twinkle and sprites, and the label reveal (all inside the hero canvas).
- E-13/42 extends to the gem core glow and the frost rim bloom, kept inside each gem's silhouette.
- E-A2 / E-A2b extend to the fog ramp (#edeff4 to #232936) as a background-only render ramp and the frost rim colour as a render light.
- E-24: the ten key shades appear together in the gem field, in catalog order, as product (the gems are the shades), never as chrome.
- E-S2-font (Sam, 2026-10-10, "add the same text and font"): IBM Plex Mono Medium for the section 2 labels only, uppercase, numerals included (rules 4 and 19, CHECKLIST A3). A fifth self-hosted WOFF2, subset to A to Z, 0 to 9, `_ # /` and space.
- E-S2-contrast (approved, Sam, 2026-10-10: "dont change anything, this is perfect"): the labels at igloo's contrast, about 2.5:1 on the fog (CHECKLIST E3). The links carry the same names for assistive technology.
- E-fog-hue (approved, Sam, 2026-10-29: "yes, and all the other section where the same backround is used"): the fog's soft patches of shade hue in this section's canvas as under the quiz, against rules 1, 12, 20, 21, 24, 42 and 50 and CHECKLIST A2; full wording in `docs/specs/hero.md` section 10, `CLAUDE.md` and `docs/specs/quiz.md` section 10, item 18.

## 11. Out of scope
- Section 3 (the quiz, docs/specs/quiz.md) and the Wall (a later section). Wipe 2's far side is section 3's fog ground, this section's background reused alone (`section3/ground.ts`), built with section 3.
- Family pages themselves (`docs/specs/family-page.md`); this section only links to them.
- Sound (igloo's beeps).
- The Astro port of section 2 (follows the prototype's review PASS, as the hero did).
- Real-device traces (recorded as pending, as for the hero).

## 12. Open for Sam
1. Pace: decided (Sam, 2026-10-10): slower; built at 0.8 screens between lift-offs and 1.8 screens per flight. Decided again (Sam, 2026-11-02): no stagger, the ten leave together, the flight still 1.8 screens, the hero's scroll halved (section 14).
2. Per-gem float speed varied by up to 10 percent (default yes).
3. Label contrast: decided, igloo's look (approved).
5. Label content: decided, the singular family name; the call to action on hover. Pending: whether the singular names (and Basic Brown) replace the catalog family names everywhere, in `docs/data/shades-240.json` and the family page URLs.
4. Reduced motion: this fade-based 3D tier, or the poster (hero.md section 11).

## 13. Changes on 2026-10-11 (Sam)
- The pull-back path: straight back (24 to 44 units) with a weave, 8 left, 8 right, then slowly 4 left, looking half-way between ahead and the logo (never orbiting it); level after a 0.75 rise; the ground mirrored past its baked edge so it never ends in view. This replaces the curve in section 5.
- Clicking a gem opens its family page over the scene (the family-pages prototype embedded); the Skreed mark there, or Back, returns.
- Slower (Sam: "the scene is moving so fast with less scroll, make it more scroll, less scene movement"): the pull-back now takes 5 screens (was 2.6) on a smoothstep ease (peak rate 1.5, the old cubic ease peaked at 3), and the weave is 6 units each way (was 8), then 3, 5.25 and 1.5 left after it. Measured on the bake's ground: the logo's peak drift across the frame fell from 2.6 to 0.56 of the screen width per screen of scroll, the camera's peak speed from 92 to 20 units per screen, and the camera keeps at least 0.47 units over the ground (0.37 before). Everything after the pull-back moves by 2.4 screens: the wipe 5 to 6, the cascade from 5.5, the last landing at 14.5, the rest to 15.2, the wipe into section 3's fog ground 15.2 to 16.2. Track 1720svh since section 3 (1820 on this date). Artifact version 31.

## 14. Half the scroll, the blocks together (Sam, 2026-11-02)

Status: planned and built 2026-11-02 on the Astro island (the `hero-scroll-half` work), reviewed against this section; review log `docs/specs/section-2.review.md`; landed 2026-11-03 (ec7d5a3, 95efdc5). Its map ran the camera's whole road and the whole wipes over half the scroll, twice as fast per screen, which was not what Sam meant: section 15 (2026-11-03) keeps the rates and halves the travel instead, and its figures supersede this section's; the blocks leaving together stand. Sam's brief, in his words: "remove half of the the scroll from the hero section, that' jsut too much scrolling ... And make sure the other half px render is deleted so that it is more optimized. And also in the second section, each block will not align itself one by one in order. All the blocks from the logo will disperse and align itself in one single go at a time, at the same time. So all the blocks will align at the same time in the same scroll, not one block at a time. So there also scroll is reduced. So the basic point of this is to reduce too much scrolling."

### 14.1 Goal in one sentence
The hero and section 2 ask for under half the scrolling they did: the pull-back and both wipes take half their screens, and the ten blocks leave the logo in one go, so the page reaches section 3 after 5.75 screens instead of 16.2. Brand goals 1 and 2 as before; this serves the reader's patience.

### 14.2 Wireframe in words (390 x 844 first, 1280 x 800 the same map)
- **0 to 2.5 screens, the pull-back.** The camera backs away along the same level weaving curve (section 13), over 2.5 screens instead of 5; the ease, the path and the look are unchanged, so the scene moves twice as far per screen of scroll.
- **2.5 to 3.0, the first wipe.** igloo's cut, over half a screen (it was one). The hero copy holds still, the logotype turns light past the half, the cue hides.
- **2.75, mid-wipe: lift-off, all ten.** Every block leaves the logo in the same frame, each on its own bowed curve (its own side, tumble and seeds, section 5), turns into its gem in the air and settles in its slot 1.8 screens later, at 4.55. In every frame of the flight all ten are in the air; none waits its turn.
- **4.55 to 5.25, the rest.** Ten gems, ten labels, hover, tap and keyboard as before.
- **5.25 to 5.75, the second wipe** into section 3's fog ground, over half a screen; the quiz's top reaches the bottom edge at 5.75 and fills the screen at 6.75 (the track's end, `docs/specs/quiz.md` D8).
- Reduced motion: the same map and track; every block fades out of the logo as its gem fades in, all together at L 0.5; the labels at L 0.6; no flight.

### 14.3 Content
Unchanged: no copy; the ten labels of section 3; the ten links.

### 14.4 Motion plan
The constants (`src/config/hero.ts`), in screens: `PULL` 2.5, `WIPE` 0.5, `CAS0` = `PULL` + `WIPE` / 2 = 2.75, `FLY` 1.8, `W1END` 3.0, `LAND` = `CAS0` + `FLY` = 4.55, `W2` = `LAND` + 0.7 = 5.25, `W2END` 5.75; `TRACK_SVH` = (`W2END` + 1) x 100 = 675 (1720 before). `S2T` has no `GAP`: the departure schedule (block j at `CAS0` + j x 0.8) is deleted from the island, not set to zero; one flight progress L = clamp((S - `CAS0`) / `FLY`, 0, 1) drives the ten (`section2/gems.ts`). Nothing else moves: the curve (`CAMX`, `camX`, `camCurve`), the flight's ease and curve, the morph, the labels' reveal, the float, the hover, the fog's treadmill (0.3 per screen from `W1END`), the composite's two wipes. The camera's post-pull travel (the curve's v 1 to 2) now runs over `PULL` to `LAND`, 2.05 screens instead of 9.5, as it always ran over that span.

What "the other half's render" means here: the island renders one frame per animation frame from the scroll follower, never one frame per pixel of scroll, so halving the scroll removes scrolling, not per-frame work. What is deleted is the stagger's machinery (`GAP`, the per-block departure times, the per-block flight progress) and ten screens of track; the warm-up and the shader set are unchanged.

### 14.5 Data and states
Unchanged (section 6). The seams follow the map: the glue's first span `PULL` to `W1END`, the quiz seam from `W2`, the section index's zones (`shell/nav-map.ts`), the return path's landing at `LAND` (`hero.ts`), the quiz's review frames at `W2` + 0.5, `W2END` and `W2END` + 0.5 and its intro at `TRACK_SVH` / 100 (`scripts/quiz/frames.mjs`, `contrast.mjs`).

### 14.6 Budget
No new bytes: the island loses the stagger's arithmetic. The build's budget lines (critical, total, the island chunk) must not rise.

### 14.7 Acceptance criteria
1. **The map (F1, C3).** `S2T` reads PULL 2.5, WIPE 0.5, CAS0 2.75, FLY 1.8, W1END 3.0, LAND 4.55, W2 5.25, W2END 5.75 and has no GAP; `TRACK_SVH` is 675 and `.track{height:675svh}` in `shell.css` equals it (unit test). From rest to the second wipe's end is 5.75 screens, under half of 16.2.
2. **All ten together (F1, D4).** On the 3D path `__s2().L` reads ten equal values at every scroll: all 0 at 2.75 and below, all between 0 and 1 at 3.0, 3.65 and 4.3, all 1 from 4.55 on; the ten gems land in the same frame and the ten labels show together. No block waits for another: there is no `GAP` in the island (`grep`).
3. **The camera's path is the prototype's (F1).** `camX` and `camCurve` equal the v11.4 prototype's at every v (unit test); the pull-back camera at the port's 0, 0.625, 1.25, 1.875 and 2.5 screens equals the prototype's at 0, 1.25, 2.5, 3.75 and 5 to 4 decimals, and inside the wipe at equal v (parity, `tests/parity/pullback.spec.ts`).
4. **Dead code gone (F2).** No departure schedule in `section2/gems.ts`, no `GAP` in `config/hero.ts`; comments and specs say the blocks leave together; `npm run test:unit` and `astro check` pass.
5. **Budgets hold (C1).** `npm run build`'s budget lines are at or below the figures of the default branch's build.
6. **Frames (B1, D1).** `docs/specs/screenshots/hero-r4-<w>-<state>.png` at 390 x 844 and 1280 x 800: `pull-end` (2.5), `wipe-mid` (2.75), `flight` (3.65, every block in the air, none on the logo and none landed), `rest` (5.0, ten gems and ten labels), `wipe2-mid` (5.5), `quiz` (6.75, the quiz's intro).
7. **The seams and the scripts follow the map (F1).** The glue's spans (`tests/unit/page-scroll.test.ts`), the section index (`tests/unit/site-nav.test.ts`), the return path's landing (`tests/family/return-path.test.ts`, `tests/family/specs/back.spec.ts`), the quiz's gate test and frames script read their positions from `S2T` and `TRACK_SVH`, never a literal of the old map.
8. **Reduced motion (D2).** Under `prefers-reduced-motion` the same map and track; every block fades at L 0.5 and the labels at L 0.6, all together; the parity frame at `W1END` (3.0) against the prototype's at 6.0 reaches the prototype's own noise floor less 1 dB (`tests/parity/v11-frames.spec.ts`).
9. **The record (A4).** `CLAUDE.md`, `docs/specs/hero.md` 12.8, this section, `docs/specs/quiz.md`, `DESIGN.md` and `docs/specs/hero-architecture.md` carry the new numbers; no em dashes, no emoji, British spelling.

### 14.8 Out of scope
The flight's length (1.8 screens, Sam's "long slow flight" of 2026-10-10), the rest's 0.7, the fog treadmill's rate, the wipes' look, the curve, section 3's content, section 4. Each is a one-line change in `S2T` if Sam wants it.

### 14.9 Decisions taken (cheaper on a phone where the brief was open)
- Both wipes halve with the pull-back (one `WIPE` constant serves both): "half of the scroll from the hero section" read as the whole of section 1, pull-back and wipe, 6 screens to 3.
- `CAS0` stays mid-wipe, now written as `PULL` + `WIPE` / 2 (the prototype's `PULL` + 0.5 was that for a one-screen wipe).
- The flight keeps 1.8 screens: Sam asked for the stagger to go, not for a shorter flight, and section 2's scroll falls from 9.7 screens to 2.5 by the stagger alone.
- The fog treadmill keeps 0.3 per screen (the fog drifts the same amount per finger movement), so the mid-wipe and rest frames no longer share the pinned prototype's fog position at any matching state; the parity frame suite grades the pixel floor at `W1END` only, where the treadmill agrees, and records the other two frames with their ride, labels and tone compared (`tests/parity/v11-frames.spec.ts`).
- The pinned prototype (`tests/fixtures/hero-v11.4/`) is not edited: it is the approved v11.4 record; the port's map is the prototype's halved, asserted as such by the unit test.
- The v11 frames capture turns E-fog-hue's patches off on the port (`hueOn` 0 through the live copy `liveFogHues()` reads, set by an init script; Tune is off on a hooks build, so nothing else reads the object): the pinned prototype predates the hues (2026-10-29) and its fog is grey, and with the hues on the wipe's end read 41.4 dB against the prototype's own 99 dB floor (2026-11-03). The hues keep their own grade (`tests/unit/fog-hues.test.ts`, quiz.md 6.1). With the hues off the wipe's end read 43.8 dB with no bias (the mean levels equal to a hundredth, a zero-mean grain of up to 7 levels): the fog's dither is keyed to the frame counter, the port reaches its position in fewer frames than the prototype on the halved map, and the prototype's two runs read 99 dB against each other only because they froze at the same frame count. The spec's floor is now the lower of the prototype's second run captured as frozen and one frame on (43.9 dB at the rest pair), so the grade is "the port within 1 dB of the dither's own floor", which is what the spec's header always meant. At the wipe's middle the hero camera sits at another curve parameter on the halved map (u2 0.12 against the prototype's 0.05), a second reason that frame is recorded and not graded on its pixels; `pullback.spec.ts` grades the camera at equal u2.

## 15. Half the travel, not the speed (Sam, 2026-11-03)

Status: planned and built 2026-11-03 on the `hero-travel-half` branch, after round 4 landed (ec7d5a3, 95efdc5); review log `docs/specs/section-2.review.md`, iteration 3 on. Sam's words: "when i said half the scroll for hero scroll, i didnt mean speed it up, i meant just cut down the travelling of the 3d world itself into half, the scroll speed remains the same". Round 4 (section 14) kept the camera's whole road and the whole wipes over half the scroll, so the world moved twice as fast per screen; this round keeps every rate of the v11.4 prototype and halves the road instead. Its figures supersede section 14's.

### 15.1 Goal in one sentence
The camera travels half as far through the moon world, at the speed it always had, so the pull-back still takes 2.5 screens; the wipes take their old screen each; the ten blocks still leave together and fly as before; the page reaches section 3 after 6.5 screens (16.2 before round 4).

### 15.2 Wireframe in words (390 x 844 first, 1280 x 800 the same map)
- **0 to 2.5 screens, the pull-back.** The camera backs away along the first half of its level weaving road (`CAMX`, `camCurve`): the same ease (smoothstep), the same rate per screen as the prototype (a fifth of the road per screen), stopping half-way, at z 34 of the road's 24 to 44, left to 6 units and back across to +4.26 (camX(0.5) on the quintic ease between the keys at 0.25 and 0.6, read live by the pull-back parity). The logo therefore stands nearer and larger at the pull-back's end than in round 4 and in the prototype.
- **2.5 to 3.5, the first wipe.** igloo's cut over one screen, as the prototype's (half a screen in round 4). The hero copy holds still, the logotype turns light past the half, the cue hides. The camera drifts on along the road at the prototype's drift rate (`CAM_DRIFT`), as it did through the prototype's wipe.
- **3.0, mid-wipe: lift-off, all ten.** Section 14's flight, unchanged: each on its own bowed curve, 1.8 screens, landing at 4.8.
- **4.8 to 5.5, the rest.** Ten gems, ten labels, hover, tap and keyboard as before.
- **5.5 to 6.5, the second wipe** into section 3's fog ground, over one screen; the quiz's top reaches the bottom edge at 6.5 and fills the screen at 7.5 (the track's end, `docs/specs/quiz.md` D8).

### 15.3 Content
Nothing changes: no copy, the ten gems and their labels as before.

### 15.4 Motion plan
The constants (`src/config/hero.ts`), in screens: `PULL` 2.5, `WIPE` 1, `CAS0` 3.0, `FLY` 1.8, `W1END` 3.5, `LAND` 4.8, `W2` 5.5, `W2END` 6.5; `TRACK_SVH` 750 (675 in round 4). The road: `PROTO_MAP` holds the prototype's `PULL` 5 and `LAND` 14.5; `CAM_TRAVEL` = `PULL` / 5 = 0.5 is the share of the road the pull-back covers, so v advances a fifth of the road per screen as in the prototype; `CAM_DRIFT` = (`LAND` - `PULL`) / 9.5 = 0.242 is the share the drift after it covers, at the prototype's rate; `camCurve` takes v = `CAM_TRAVEL` x s + `CAM_DRIFT` x u2 (the prototype's own v = s + u2). Rates, per screen of scroll: the camera's z 4 units over the pull-back and 1.68 over the drift, in the prototype and here (round 4 had 8 and 7.8); the weave's lateral rate is the prototype's too. The flight, the fog's treadmill and the composite's wipes are the prototype's.

The alternative not taken: compressing the whole road into half the distance, so the weave completes its shape at half its amplitude and the pull-back ends where the prototype's ended in x (-3). Sam's words ask for the travel halved at the same speed, which is the road's first half; the pull-end frame (`hero-r5-<w>-pull-end.png`) shows the result for his eye, and the other reading is one constant and a scaled `CAMX` away.

### 15.5 Data and states
As 14.5: no new state. Reduced motion is unchanged (the straight v9.9 pull-back with s = 0 holds the hero pose; the still3d tier draws the gems at their slots).

### 15.6 Budget
No new bytes beyond three constants: the island chunk within 0.1 KB of round 4's; total JS 243.2 KB gz or under.

### 15.7 Acceptance criteria
1. **The map (F1, C3).** `S2T` reads PULL 2.5, WIPE 1, CAS0 3.0, FLY 1.8, W1END 3.5, LAND 4.8, W2 5.5, W2END 6.5 and has no GAP; `TRACK_SVH` 750 equals `shell.css` (unit test); the second wipe's end at 6.5 screens, under half of 16.2.
2. **The rates (F1).** `CAM_TRAVEL` 0.5 = `PULL` / the prototype's 5 and `CAM_DRIFT` = (`LAND` - `PULL`) / the prototype's 9.5, both read from the pinned fixture (unit test); `camCurve(s, u2)` equals the prototype's `camCurve` at v = 0.5 s + 0.242 u2 over the whole grid; the pull-back's end is at z 34, x camX(0.5); the live camera equals the prototype's at the same v (`tests/parity/pullback.spec.ts`: exactly at 0 and at the pull-end, to 3 decimals at five more pairs).
3. **All ten together (F1, D4).** As 14.7 criterion 2 at the new positions: `__s2().L` all 0 at 3.0 and below, all between 0 and 1 at 3.9, all 1 from 4.8 on.
4. **Seams and dependents (F1).** The glue spans, the section index's seams, the family return path, the quiz's scripts and tests read the map (unit page-scroll, site-nav, return-path; e2e site-nav, to-top, island and the quiz gate's AC1 and AC6 pass).
5. **Reduced motion and the frames parity (F1).** `v11-frames.spec.ts` grades the wipe's end at the prototype's 6 and the port's 3.5 within 1 dB of the dither floor at both widths, the labels and the ride equal on every pair.
6. **Frames (B1, D1).** `hero-r5-<w>-{pull-end,wipe-mid,flight,rest,wipe2-mid,quiz}.png` at 390 x 844 and 1280 x 800 with the loader gone: pull-end the logo whole and nearer than round 4's, wipe-mid the logo with its blocks under the cut, flight the ten in the air, rest the ten gems and labels, wipe2-mid the gems cut away, quiz the intro.
7. **Budgets (C1, C4).** Every budget line ok; total JS within 0.1 KB of 243.2 KB; Lighthouse on the poster tier 90 or more.
8. **The record (F2).** CLAUDE.md's Section 2 and Section 3 lines and its Always-do line, hero.md 12.9, quiz.md, DESIGN.md, hero-architecture.md, section-4.md and section-4-flux.md carry the new figures; no em or en dash, no emoji.

### 15.8 Out of scope
The flight's path and length (Sam's word covers the world's travel, and round 4 did not speed the flight up), the labels, hover, the fog and its hues, sections 3 and 4.

### 15.9 Decisions taken
- The road's first half, not a compressed road (15.4).
- The wipes back to the prototype's screen each: a wipe is motion on screen too and "the scroll speed remains the same" covers it; round 4's half-screen wipes ran twice as fast.
- The drift after the pull-back keeps the prototype's rate for the screens the wipe and the flight have (2.3 screens), so it covers 3.9 units, not half the prototype's 16: the stagger's removal, not this round, took those screens away.
- The pull-end frame was Sam's to judge: the logo nearer, the camera mid-weave (x +4.26 at v 0.5, measured) where the prototype's sat at x -3 after the whole road. Approved on the frames `hero-r5-390-pull-end.png` and `hero-r5-1280-pull-end.png` (Sam, 2026-11-03: "this is exactly what i meant"), so the road's first half is the reading, and the compressed road of 15.4 is not pursued.

## 16. The wave from block to gem, and the click hint (Sam, 2026-11-04)

Status: built 2026-11-04 on `claude/products-scroll-behavior-1ee3ec`, after the family pages' wave of the same day (`docs/specs/scroll-steps.md` 3, `docs/specs/family-page.md` 24 and 26). Sam's words: "whatever the wave effect that we have on the case types, implement the same effect on the stone when they are dispersing from the logo and transition into stones and allign themselves in section 2, and also we need an accessibility helper or smtg on the phone aspect ratio which makes the user knnow that the stones are clickable, maybe like a mouse cursor going around the stones and have a click animation, a cute one, so they will also try to click, and also currently the logo blocks just entirely get small and dissappear and then new stones apper and enlarge during the transition, check the attached picture, in that point it becomess very small, so instead of that, have the same block and use the wave effect transition them into the stones, instead of making them small and enlarging or whatever"; later the same day, of the hint, "make it small, second, when it hovers over the stone, make the cursor into the clickable cursor, so it makes more sense" and "have the same click hint for desktop as well", and "make sure to finish it properly for phone as well"; and after the landing, "make sure that the click hint is always there when ur on the familes page, it shouldnt dissappear later, both on phone as well as desktop". Its figures supersede section 4's "folds into a point (L 0.42 to 0.62) as the gem grows out of it (0.50 to 0.78)".

### 16.1 Goal in one sentence
Each block flies at its own size and turns into its gem by the family pages' wave, a sweep from the screen's right to its left with the icy band on its boundary, so nothing ever shrinks to a point or grows out of one; once the gems rest, on a phone and a laptop alike, a small cursor of our own drawing glides to a few of them, turns into the pointing hand over each and taps it, so the visitor sees they can be tapped or clicked.

### 16.2 Wireframe in words (390 x 844 first, 1280 x 800 the same)
- **3.0 to 3.72 screens (L 0 to 0.4), the flight.** As section 14: the ten blocks leave the logo together on their curves, tumbling, their edges warming to their shade. Their size goes from the block's in the logo to the gem's at rest over the whole flight (a smoothstep of L from 0.1 to 0.95), never through zero.
- **3.72 to 4.26 (L 0.4 to 0.7), the wave.** Each block and its gem share one place, one turn and one size; the sweep crosses the pair from the right of its box on the screen to the left, the block on the side the boundary has not reached and the gem on the side it has passed, one of them at each pixel, never a blend; the boundary is the family's two layers of noise, lined by the icy band (base #D5F6F3, specular #B7C1FF). The boundary moves at an even pace in the scroll (linear in L), as the family's step drives it at an even pace in time.
- **4.26 to 4.8, the settle.** The gem alone eases into its resting pose and igloo's float, as before.
- **4.8 on, at rest, every layout.** After a second with the gems still, their links on and no mouse resting on one, the cursor comes in from below a gem as a small arrow (15 px wide, a pointer's size), glides to it on a small arc (0.9 s), turns into the pointing hand the moment it is over a gem (any gem it crosses, as a pointer over a link, by the canvas's own pick), presses it with a squash and a ring that opens from the fingertip (0.36 s), and the gem answers as it does to a finger or a mouse for 1.25 s: its frost and its CTA, "24 SHADES / TAP TO EXPLORE" on a touch screen and "24 SHADES / CLICK TO EXPLORE" with a mouse. On a phone the CTA takes the name's place (the phone's column leaves no room beside it); on a laptop it stands beside the gem with the plexus, as a hover shows it. Three gems a tour (Blissful Blue, Mellow Yellow, Stormy Grey; then Playful Pink, Basic Brown, Go Green), the two tours taken in turn, round and round for as long as the gems rest, the cursor standing still 1.2 s where it pressed last before gliding on to the next tour's first gem, so it never leaves the screen while the visitor is on the section.

### 16.3 Content
No new copy: the cursor says nothing, and the CTA is section 2's own ("24 SHADES", "TAP TO EXPLORE" or "CLICK TO EXPLORE").

### 16.4 Motion plan
- **The wave** (`src/scripts/hero/section2/wave.ts`): the family's field, read on each stone's own box, a square round its centre with the projected radius of the larger shape, in the main target's pixels; `WAVE_L` 0.4 to 0.7; the boundary `takeoverP` of the span's raw progress (-0.12 to 1.12); the seed the family takeover's hash of 27027, "block" and the family; the relief the family's, scaled to each shape's own extent. The band is lit by a fixed key from the upper left and a fresnel rim (`tkBandLit`), because the gem's colour is our own refraction pass and not three's lighting; the band sits over each side's final colour (after the gem's tone curve), so it reads the same on the block and the gem. One uniform switches the field off outside the span, so a block or a gem at rest draws as before. The two text builders are shared with the family pages through `src/scripts/family/three/takeover-glsl.ts`, so the landing carries nothing else of the case types.
- **The hint** (`src/scripts/hero/section2/hint.ts`, `HINT`): driven by the hero's frame loop on `performance.now()`; the glide eased in-out cubic with a 26 px lift, the press a sine squash (8 percent wider, 16 percent shorter, a turn of 8 degrees), the ring a Web Animations scale from 0.3 to 2.2 and opacity 0.9 to 0 over 650 ms on --ease-standard, the fade in and out by opacity over 0.3 s.

### 16.5 Data and states
- A mouse resting on a gem, or a gem's link in keyboard focus (each shows that gem's own CTA), holds the hint back until it leaves, and the hint never takes that CTA from under it.
- A scroll (any change of the scroll of a ten-thousandth of a screen) ends a run at once and hides the cursor; the next rest of a second starts it again from the first tour. A change of the viewport's height is not read as a scroll.
- Nothing ends it for the visit (Sam: "it shouldnt dissappear later"): the visitor's own tap or click opens the family page, and when they come back the hint goes round again once the gems rest (the visit flag of the first build, `skreed:s2-hint-done`, is gone).
- Never under reduced motion (not created on the still3d tier, `display: none` in CSS), on the poster tier (no island), or while the tab is hidden.
- `aria-hidden` and `pointer-events: none`: the cursor is a picture of a tap inside `#s2labels`, never a control and never in the way of the gems' links.

### 16.6 Budget
Total JS 246.7 KB gz of 250 in production (242.5 before: +4.2 KB, the band's code, the shared field and the hint). No new file, image or font: the cursor is two inline SVGs, the arrow and the hand.

### 16.7 Acceptance criteria
1. **No shrink (F1).** Through the flight each block's scale is its size over its own radius and the gem's its size over its own; neither is ever under the smaller of the two at rest (frames at L 0.3, 0.45, 0.55, 0.62, 0.8).
2. **The wave (F1).** Between L 0.4 and 0.7 the block and the gem are drawn at one pose, the block on the side f >= p and the gem on f < p, the band on the boundary; outside it only one of them, with the field off (`tests/unit/gem-wave.test.ts`: the span, its even pace, the sides, the splices into three r165's standard shader and the gem's own).
3. **The landed links at the rest (F1).** At `S2T.LAND` x the viewport rounded to a whole pixel (4,051 of 4,051.2 px at 390 x 844, 1,022 of 1,022.4 at 568 x 213) the gems count as landed, their links placed and the hint able to start (`Lof` counts the flight's last three quarters of a pixel as landed).
4. **The hint (D1, E3).** At 390 x 844, a second after the gems rest the arrow glides to Blissful Blue, turns into the hand over it, presses, and the gem's frost and "TAP TO EXPLORE" show with its name hidden; at 1280 x 800 the same with "CLICK TO EXPLORE" beside the gem and its plexus; the tours go round with no end while the gems rest, the cursor on screen throughout; a scroll hides it and it is back a second after the next rest; a mouse resting on a gem holds it back; a real tap or click opens the family page, and back on the landing it goes round again.
5. **Budgets (C1).** Every budget line ok.

### 16.8 Out of scope
The flight's path and timing, the gems' look at rest, the labels' places, the real pointer's own hover.

### 16.9 Decisions taken
- The span L 0.4 to 0.7: the blocks well clear of the logo and of each other, and the wave over before the long settle, so every gem rests whole. About half a screen of scroll.
- The size matched by bounding radius, the block's to the gem's over the whole flight, so the hand-over shows two shapes of one size and no jump.
- The band lit by our own key and rim on both sides (16.4) instead of the family's physical paths, which the gem's pass does not use.
- The cursor is a pointer's arrow and, over a gem, its pointing hand, as Sam's "mouse cursor" and "clickable cursor" ask, on a touch screen too; the size of a real pointer (the arrow 15 by 19 px, the hand 15 by 18); Pearl Whisper with an Urban Slate outline, so it reads on the fog's light and dark clouds alike.
- The CTA on a phone takes the name's place for the press (the name decodes out, the CTA in), where before a finger's tap on a phone showed no CTA at all; a laptop keeps its side choice.
- Round and round with no end and no visit flag, on Sam's "always there", where the first build stopped after two tours (about 20 s) and after the visitor's first tap; the still moment between tours is 1.2 s with the cursor kept on screen.
