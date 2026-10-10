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
The ten blocks of the Skreed mark leave the logo one at a time, fly down into a field of ten floating gems, one per colour family, and each gem opens its family's 24 shades. Brand goals served: 1 (the 240 shades are the product) and 2 (a site people remember and share).

## 2. Wireframe in words

### 390 x 844 (phone first)
- **Hand-off (scroll 1.5 to 2.5 screens, the hero's wipe, unchanged).** The hero's igloo-style cut wipes the snow scene away to the fog. The logo is not cut: it lifts out of the hero and rides up to v 0.16 of the screen at 0.181 H tall.
- **Cascade (2.0 to 6.1).** From mid-wipe the blocks lift off in catalog order, one every 0.4 screens. Each flies 0.5 screens down, swelling to 1.12x mid-flight with a seeded tumble, turns from matte black block into its gem in the air, and settles in its slot. The logo empties in pairs (centre bar, top, bottom, two diagonals). Slots during the cascade: a two-column zig-zag at scale 0.78, u 0.377 / 0.624, v 0.319 to 0.912.
- **Re-frame (6.1 to 6.8).** The empty logo is gone. The field moves up and zooms in x1.28 (gems grow from 64.5 to 83 px): u 0.342 / 0.658, v = 0.120 + 0.0845 j, pitch 142.6 px.
- **Rest (6.8 to 7.1).** Ten gems float. Each has its family name beside it on the inner side at the gem's height, 12 px Open Sans 600. Nothing else is on screen: no headline, no copy, no buttons.
- **Tap a gem:** a short frost splat on pointerdown, then the native link opens `/shades/<family>/`.
- **Drag across a gem:** frost paints along the finger, as on igloo. A drag that becomes a scroll stops painting at pointercancel.
- **Leave (7.1 to 8.1).** Wipe 2 into the Wall (section 3).

### 1280 x 800
Same scroll map. The logo rides up to v 0.26 at 0.313 H. Two rows of five in reading order (families 1 to 5 on top), the second row offset half a pitch, every neighbour exactly p = min(W/5.6, 0.33 H) = 228.6 px apart, gems 149 px (0.186 H). During the cascade the rows sit at v 0.539 and 0.787; the re-frame moves the field up 0.163 H to v 0.376 and 0.624 (top row u 0.098, 0.277, 0.455, 0.634, 0.813; bottom row u 0.188, 0.366, 0.545, 0.723, 0.902). Labels upper-right on the top row and lower-right on the bottom row; Roaring Reds flips to upper-left. Hover paints frost along the pointer.

## 3. Content
- Copy: none. The only strings are igloo's three labels per gem, carrying our facts (uppercase, as igloo):
  - Title (always shown): the family's name in the singular, uppercase (Sam, 2026-10-10: "not reds, it's red"; Earthy Browns is Basic Brown): `FROSTY WHITE`, `BLISSFUL BLUE`, `PLAYFUL PINK`, `VIVID VIOLET`, `MELLOW YELLOW`, `BASIC BROWN`, `BLUSHING CORAL`, `STORMY GREY`, `GO GREEN`, `ROARING RED`. No `FAMILY_nn` line.
  - (Removed by Sam, 2026-10-10: no shade name, number or hex on hover.)
  - Call to action (igloo's date slot), on the active gem only: `24 SHADES` over `CLICK TO EXPLORE` (`TAP TO EXPLORE` on touch) (igloo: `D 01.02.2020` over `CLICK TO EXPLORE`).
- Accessible names (not visible): each link reads "<Family>, 24 shades", e.g. "Blissful Blues, 24 shades". The section's landmark is labelled "Colour families".
- Gems, slot j = catalog order, each in its family's key shade (the hero block's colour):

| j | Family | Key shade | Hex | Hero block id | Link |
|---|---|---|---|---|---|
| 0 | Frosty Whites | Snow | #f0f4f5 | 2 | /shades/frosty-whites/ |
| 1 | Blissful Blues | Sky | #08bcf4 | 3 | /shades/blissful-blues/ |
| 2 | Playful Pinks | Rouge | #f2638f | 7 | /shades/playful-pinks/ |
| 3 | Vivid Violets | Amethyst | #8554d1 | 5 | /shades/vivid-violets/ |
| 4 | Mellow Yellows | Sunbeam | #fff164 | 6 | /shades/mellow-yellows/ |
| 5 | Earthy Browns | Cinnamon | #ba7237 | 4 | /shades/earthy-browns/ |
| 6 | Blushing Corals | Mango | #ff9f40 | 0 | /shades/blushing-corals/ |
| 7 | Stormy Greys | Silver | #acacac | 1 | /shades/stormy-greys/ |
| 8 | Go Green | Lawn | #4aa325 | 8 | /shades/go-green/ |
| 9 | Roaring Reds | Crimson | #d20000 | 9 | /shades/roaring-reds/ |

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

- **Scroll map (screens of 100svh, S is the lagged scroll; Sam, 2026-10-10: a longer scene move, nothing flies up, a long slow flight):** PULL 0 to 2.6, the camera backing away along a level S-curve round the logo (heights within a metre, over the ground's measured heights; points in degrees, distance, height: (0, 24, -2.5), (-9, 26.5, -2.15), (5, 29, -1.95), (24, 32, -1.85), (35, 34, -1.8), then on past the pull-back, where only the logo is seen, (44, 38, -1.7), (40, 44, -1.5), (28, 50, -1.3), (15, 56, -1.1)). WIPE 1 2.6 to 3.6: igloo's cut, the hero layer held still (no slide) and the logo kept over section 2 through a mask, behind anything section 2 draws in front of it. CASCADE from 3.1: block j lifts off at 3.1 + 0.8 j and lands 1.8 screens later; the last lands at 12.1. REST 12.1 to 12.8. WIPE 2 12.8 to 13.8 into the Wall. Track 1580svh. Built in v11 (`prototypes/hero-v9/`, live on the hero link).
- **Per block j:** L_j = clamp((S - 3.1 - 0.8 j) / 1.8, 0, 1), e = cubic-bezier(0.42, 0, 0.12, 1) of L (a slow lift, a long glide, a long settle). The block's copy (its own triangles, matte black) starts at the block's exact view-space pose in the receding logo and follows a cubic curve that lifts and swings out to one side (0.38 of the distance), then comes in from above and in front to its slot; it tumbles mid-flight and its edges warm to its shade, folds into a point (L 0.42 to 0.62) as the gem grows out of it (0.50 to 0.78) and its core lights (0.5 to 0.85); the gem eases into its resting pose and igloo's float fades in over the last 15 percent.
- **Followers and speed limit:** igloo's two followers (0.075 then 0.15 per frame) with a cap of 0.075 screens per frame on the first; K moves at most 3 blocks per second.
- **Holds:** re-frame and wipe 2 read min(S, 6.1) until every block has landed (K = 10.25); wipe 1 reads max(S, 2.0) until the logo is whole again (K = 0).
- **Auto-settle (igloo's 1.4 s rule):** wheel and keys only, never on touch or under reduced motion. In the cascade it goes to the nearest K in {0..9, 10.25}; duration clamp(6 |dS|, 1.6, 2.4) s, inOut3.
- **Reverse is exact:** scrolling up runs everything backwards; Roaring Reds leaves the field first.
- **Idle float (igloo's, measured):** gems never translate. Each turns about its centre: rot_a(t) = 0.1 sigma sin(w t + K_a s), K = (42.987, 12.423, 2.53), s a per-gem seed in [0, 1), sigma = sign(s - 0.5), Euler XYZ. w = 0.3 rad/s, varied per gem by up to 10 percent so ten gems on one screen never move in lockstep (Sam to confirm; default on). The camera's look direction drifts by igloo's six-sine noise at 0.0129 rad (scaled for our 30 degree fov), position fixed.
- **Labels (igloo's text, font and reveal; Sam, 2026-10-10):** IBM Plex Mono Medium (SIL Open Font License, self-hosted on the site), uppercase, Pearl Whisper, 13 px desktop, 12 px phone, line-height 1.08, as DOM text over the canvas (aria-hidden; the links carry the names). igloo's layout per gem: the title on a 1 px two-segment leader (45 degrees from the gem-local anchor (0.35, 0.85, 0.93), then horizontal under the text), the shade pair beside the gem's upper right without a leader, the call to action right-aligned over a rule that runs out from the anchor (0.70, 0.25, 0.95). Anchors are taken in the gem's rest frame and re-projected every frame, so labels ride the float and the parallax. With ten gems on one screen, the title shows on every gem and the shade pair, the call to action and igloo's plexus show on the active gem (pointer over it, or keyboard focus), the way igloo shows them on the stone in its centre band. Titles are placed once per layout: igloo's up-left first, mirrored, then beside the gem (phones: the inner side first), avoiding the 16 px gutters, other gems and other titles. Reveal, igloo's three tracks: leader 0.2 s (segment 1 then 2), text alpha wiping left to right over 0.4 s (per character alpha = clamp(11u - 10x, 0, 1)), glyph roll over 0.75 s (each letter counts down through the five glyphs after it in its 8-glyph code-point block and lands on itself). Hide: leader retracts 0.2 s, horizontal segment first; text wipes out right to left over 0.2 s. In the cascade, a title reveals when its gem's L crosses 0.9 and hides below 0.8 and when wipe 2 starts. No backing plates: igloo sets white text straight on the fog (about 2.5:1); plates read as grey boxes (tested) (see section 12).
- **Plexus (igloo's, on the active gem):** 18 points on a cylinder at 0.72 to 0.9 of the gem's bounding radius, orbiting at up to 0.25 rad/s on a slow vertical treadmill, links to up to 3 neighbours, "+" crosses of about 6 px, faint grey lines dashed by noise, depth-tested against the gem, growing in over 0.35 s, out over 0.25 s. Desktop only.
- **Hover (igloo's, measured):** a pointer-frost buffer per hovered gem. Pool of 3 RGBA16F 512 x 512 ping-pong pairs, least-recently-used; phones 256 x 256 at 30 Hz. Step at a fixed 60 Hz (at most 2 steps a frame): flow advect (std 0.22 texel, drift (0.10, -0.07)), 4-neighbour max (dilation), capsule splat of radius 0.05 x smoothstep(0.1, 1, vel), decay 0.985, rim = growth this step. Velocity: target = clamp((target + 6e) x 0.88), vel = lerp(vel, 1 - (1 - target)^5, 0.1), reset after 0.15 s idle, on enter and leave, or on a jump over 0.3. Drawn on the gem: facet micro-roughness x (1 - f); emissive += g x rim colour + lattice x g x 10 + lattice x f^2, rim colour igloo's #83a1c5 (a render light, E-A2b); the whole frost emission x2.5, because igloo blooms its scene from a 0.2 threshold and Gem C blooms from 0.75, so the crackle reads as bright as igloo's. The gem's rest look is unchanged while its buffer is empty. Lattice: our own baked tile (jittered 12 x 12 grid, periodic Delaunay, lines 1.5 to 1.9 px, vertex dots 3 px), triangle edge 0.045 of the gem's projected width, at least 6 px. Peak rim brightness 1.0 at birth, 0.5 at 0.2 s, gone about 3.7 s after the last movement. Pointer parallax, igloo's camera orbit re-made as a turn of each gem in place: 8.8 degrees yaw and 4.4 degrees pitch at full deflection, damped 0.035 per 60 Hz frame, half rate on touch, springing back on lift. Nothing else moves on hover: no scale, push or halo. Cursor pointer.
- **Background (igloo's section 2, re-created, our code):** fog from one 64 x 64 noise texture (seed 249, igloo's measured frequency content) sampled at two scales, s = 0.3 (u x aspect, v), t = 0.075 x time, octave offsets (-t, 0.25t - 0.65 x progress) and (t, -0.5t), mapped through the measured 21-stop ramp (#edeff4 at p 0, #9da1af at 0.5, #232936 at 1). Jittered 1 px dots on an H/13.5 cell, twinkling on a 10 s triangle wave. Grain at dither level (sd 1.3 levels). Six defocused wireframe gem sprites (our own atlas, strength 0.27) spinning 2.3 to 10.8 degrees a second. Scroll treadmill T = 0.5 x (S - 2.5) stone steps. The background never blooms. The blurred text layer is **off** (Sam: no text in this section).
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
1. **Cascade, one at a time (CHECKLIST F1, D4).** Frame sets at S 2.0, 2.2, 2.5, 3.0, 4.0, 5.0, 6.1, 6.8 at 390 x 844 and 1280 x 800 show the blocks leaving in catalog order, at most one block in flight in any frame, each landing in its slot. A scripted wheel fling of 4800 px still gives lift-off gaps of 0.33 s or more.
2. **Gem C read (A5, F1).** At rest the gems match the approved Gem C render (the live comparison page, look C) within 2 sRGB levels median per gem at the same pose and time; shimmer under 3 levels median frame to frame.
3. **Float (F1).** Logged gem rotations match rot_a(t) = 0.1 sigma sin(w t + K_a s) within 1e-4 rad over 30 s; gem centres move under 0.5 px; per-gem w spread within plus or minus 10 percent of 0.3 rad/s.
4. **Labels (A3, A4).** Ten titles with the exact strings of section 3 in IBM Plex Mono 500 at 13 px (desktop) and 12 px (phone), each inside 16 px gutters and none overlapping another gem or title at rest at 360, 390, 430, 768, 1024 and 1280 wide; the active gem adds its shade pair and call to action; reveal timings within one frame of 0.2 / 0.4 / 0.75 s on a virtual clock; the roll lands every character on its own glyph.
5. **Hover and touch (D4, B2).** A scripted pointer sweep (11 frames, 150 ms apart) paints frost with a visible rim and lattice on the hovered gem only; the rim's peak brightness halves by 0.2 s +- 1 frame and is gone by 3.7 s; no scale, translation or halo change on any gem. On a phone, a drag paints frost, a tap navigates, a scroll gesture over a gem scrolls the page.
6. **Links (E3, G21).** Each gem is a real link with the accessible name "<Family>, 24 shades", reachable by Tab in catalog order with a visible Ember focus ring on the gem's position, activated by click, tap and Enter; the hit area is at least 44 x 44 px; each opens its family page.
7. **No copy, no stray text (A1, A4).** The section's visible text is exactly the label strings of section 3; no headline, sub-line, blurred text or button; zero em dashes, emojis or buzzwords.
8. **States (D2, D3, H1).** Reduced motion gives the fade-based cascade with no float, drift or tumble; the poster tier shows the field still with ten working links; no WebGL and context loss land on the poster with links in place; a slow gem build holds the scroll at the wipe and never shows half-built gems.
9. **Hero unchanged (F1).** At scroll 0 the hero's rest frame differs from v10's by under 1 percent of pixels away from the countdown numerals; the loader and intro timings are unchanged; the loader budget stays under 10,000 B.
10. **Performance and safety (C1, C4, E1).** Section 2 adds at most 7 KB gz of JS; page module parses (`node --check`); under the artifact's strict CSP there are zero violations, zero console errors, no fetch, eval or WebAssembly; the settled-field frame costs at most 1.6x the hero's rest frame.

## 9. Decisions taken (cheaper on a phone where the brief was open)
- Pace: 0.4 screens per lift-off, track 910svh (igloo's own pace of one screen per block would make the track about 15 screens).
- Departure order: catalog order (some paths cross in front of the logo; changing that would change the approved hero's colours).
- Phone layout: all ten on one screen at 83 px in a zig-zag, not igloo's one stone per screen.
- Desktop layout: 5 + 5 band, not a 3-4-3 hex.
- Label colour: Pearl Whisper straight on the fog, as igloo's white (no plates).
- Plexus on the active gem only (igloo shows it on the stone in its centre band; ten at once would crowd the field).
- Background dots are jittered within their cells (rule 43); grain stays at dither level (rule 20); the sprites are defocused wireframe gems, not filled blur blobs (rule 42).
- The background's blurred text layer is off.

## 10. Exceptions this section needs (hero canvas only; to add to CLAUDE.md "Approved exceptions" when Sam confirms)
- E-12 extends to the gems' float, the background's drift, twinkle and sprites, and the label reveal (all inside the hero canvas).
- E-13/42 extends to the gem core glow and the frost rim bloom, kept inside each gem's silhouette.
- E-A2 / E-A2b extend to the fog ramp (#edeff4 to #232936) as a background-only render ramp and the frost rim colour as a render light.
- E-24: the ten key shades appear together in the gem field, in catalog order, as product (the gems are the shades), never as chrome.
- E-S2-font (Sam, 2026-10-10, "add the same text and font"): IBM Plex Mono Medium for the section 2 labels only, uppercase, numerals included (rules 4 and 19, CHECKLIST A3). A fifth self-hosted WOFF2, subset to A to Z, 0 to 9, `_ # /` and space.
- E-S2-contrast (approved, Sam, 2026-10-10: "dont change anything, this is perfect"): the labels at igloo's contrast, about 2.5:1 on the fog (CHECKLIST E3). The links carry the same names for assistive technology.

## 11. Out of scope
- The Wall (section 3) and wipe 2's far side beyond the existing placeholder.
- Family pages themselves (`docs/specs/family-page.md`); this section only links to them.
- Sound (igloo's beeps).
- The Astro port of section 2 (follows the prototype's review PASS, as the hero did).
- Real-device traces (recorded as pending, as for the hero).

## 12. Open for Sam
1. Pace: decided (Sam, 2026-10-10): slower; built at 0.8 screens between lift-offs and 1.8 screens per flight.
2. Per-gem float speed varied by up to 10 percent (default yes).
3. Label contrast: decided, igloo's look (approved).
5. Label content: decided, the singular family name; the call to action on hover. Pending: whether the singular names (and Basic Brown) replace the catalog family names everywhere, in `docs/data/shades-240.json` and the family page URLs.
4. Reduced motion: this fade-based 3D tier, or the poster (hero.md section 11).
