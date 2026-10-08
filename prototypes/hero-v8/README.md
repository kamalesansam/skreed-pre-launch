# Hero prototype v8 (2026-10-08)

Live: https://claude.ai/artifact/QDXUhF32ZLd7L9a5ccDnq8 (version 13). Moon world by default.

**Why the floor was missing in v7:** the artifact viewer's sandbox blocks `fetch` (including of `data:` URIs) and WebAssembly, so the Draco glTF never loaded. Reproduced locally with a strict CSP (`shot.mjs` serves the page under one). The ground and stones now ship as plain quantised arrays (`assets/*.bin`, base64 in the page), decoded with `atob`: ground heights uint16 (400 x 320 grid, rebuilt in JS with the bake's own row and column mapping), stones int16 positions + sRGB uint8 baked colours + uint16 indices (37,836 vertices).

**Changes in this version**
- Milky Way rendered at about a seventh of v7's brightness (`MW_GAIN=0.08` in `blender/moon.py`), stars a little dimmer, planets unchanged. The sky is counter-rotated 2.6 degrees so the planets and band sit where they were approved after the floor reframing.
- Camera target lowered so the floor holds the lower third.
- Blocks never sink into the ground or the stones: each frame every block's hull is checked against the decoded heightfield and a stone-top grid around the logo, lifted to keep 0.2 units clear, with the lost downward motion sent toward the camera.
- Locked to 10 blocks, one family shade per block, with a gradient inside each block (deeper at the inner edge, brighter at the outer edge).
- Relief 0.01, grain 1.5 (max), key light 2.9 as defaults.
- Terrain, re-created from igloo's ground (research in the session): a fine crumb grain (about 0.03 units) fading with distance, and ground mist from two taps of a shared wind tile scrolling at igloo's terrain rates.
- Moving fog, re-created from igloo's smoke cards: a procedural wind tile baked once on the GPU, four vertical cards (z +9, -10, -45, -150) sampling three drifting taps multiplied (gain 8, t = time x 0.15, one rising, one sinking), Pearl Whisper at low brightness, thinned over the logo.
- Galaxy hues: a faint wash in the dark sky from deep catalog shades (Space, Eggplant, Forest, Wine), live in the page.
- Tune sliders for all of the above (Terrain, Fog, Sky sections).
- Robustness from the review pass: the render loop schedules itself first; labels for blocks that no longer exist are dropped; zero-height frames cannot poison the scroll state; labels built without innerHTML; pointercancel handled; the button uses Open Sans; the sub-line and link lines use Pearl Whisper; the first label appears as soon as a block parts.

## v8.1 (same day)
- **Logotype top left, with igloo's logo glitch** (research: igloo's corner logo is one MSDF quad; it glitches only at load, 0.5 s after a 0.75 s delay, and on every pointer entry or tap, 0.25 s: thin horizontal slabs shifted sideways by up to 0.75% of the logo width, three slab patterns per burst, opacity 0.85 + 0.15 sin(30p + phase), then clean; no RGB split, no scramble, no idle timer). Re-created in SVG: up to 48 clipped `<use>` tiles of the wordmark, cut on device pixels, shifted up to 1.05% of the width (about 1.4 px at 136 px). Ours adds an optional idle twitch every 8-16 s (Tune, on by default) because Sam saw it "here and there". Off entirely under reduced motion. Pearl Whisper on the hero, Urban Slate once the wipe reveals the light Wall.
- **From the review (7 findings confirmed by 3 skeptics each):** the Wall placeholder copy is hidden until the scene runs and the designed fallback shows if the module never starts; tighter bloom (strength 0.5, radius 0.22, threshold 0.62) so the glow stays on the cut faces instead of a haze; square 48 px CTA with a 1 px lift on hover and no invented hover colour; under reduced motion the scroll dolly, the wipe's chromatic aberration and parallax, the glow shimmer and the fog drift all hold still. The soft near ground and the rock pile are being replaced by the igloo-style snow floor (in progress).

## v8.2 (same day): block colours arranged by colour theory
The ten family shades were placed on the ten blocks by hand before (nearest colour-wheel anchor), which put Lawn beside Crimson and Amethyst beside Sunbeam on touching edges. Now the order is chosen for the edges that actually meet and the faces that actually show.

**Method** (`colour/`):
- `blocks10_adj.json`: which blocks touch (eight shared edges, two chains of five) and the five pairs that face each other across the centre gap.
- `oklch10.json`: the ten shades in OKLCH (Rouge 4, Crimson 29, Cinnamon 57, Mango 61, Sunbeam 104, Lawn 138, Sky 229, Amethyst 298; Snow and Silver neutral).
- `vis.mjs` + `vis_measure.py`: how much of each block's glow is on screen, measured by lighting one block at a time (white, all others black) with the scene frozen, at rest and in five pointer poses, desktop and phone; `visibility.json`. Blocks 3 and 7 show most, then 2 and 9; block 0 least (0.12).
- `palette_search2.py`: all 3.6 million orders scored on touching-pair hue distance (analogous low, 60 to 120 degrees discordant, equal-lightness saturated pairs vibrate), weighted by the visibility of both blocks, plus colour-vision-deficiency collapse (deuteranopia and protanopia in OKLab), closeness to Ember Luxe on visible blocks (Mango is 0.02 from the button colour), lightness balance and a full-wheel-in-order penalty. The best orders under four weightings were rendered live (`round2-flat.png`, `round2-candidates.json`) and judged by three independent reviews (colour theory, how it renders under bloom and CVD, brand) with a refutation pass on every proposed swap. All three ranked the same order first (8/10) and proposed no change.

**The order** (`BLOCK_ORDERS.cool`, by block index): Mango, Silver, Snow, Sky, Cinnamon, Amethyst, Sunbeam, Rouge, Lawn, Crimson.
- The two inner ends that bloom on hover are Sky (3) and Snow (2): a cool, calm heart with a white light, 0.22 apart in lightness so they never merge.
- The crown over it is Amethyst, Rouge, Crimson (5, 7, 9): one hue walk, 25 to 66 degrees a step, against the violet Milky Way.
- Each stroke is one monotonic hue walk with a neutral rest inside it (Silver on 1, Snow on 2). No touching pair is a complement; the largest touching step is 66 degrees.
- The orange family (Mango 0, Cinnamon 4, Sunbeam 6) sits on the blocks that barely show, and never on the blocks that light up when the pointer moves toward the button, so Ember Luxe stays the only orange that matters on the page. Visibility-weighted orange presence 0.33 against 1.34 for the runner-up.
- At rest the right-hand edges draw a red line, a white zigzag and a cyan line. Under deuteranopia and protanopia the cool/warm split maps onto the blue/yellow axis, so the S stays legible.

Tune has a "Block colours" row (Cool heart, Warm over cool, Wheel, Original) and `?blockColors=cool|warm|wheel|original` or a comma list of ten shade names overrides it for tests. Test hooks: `__skreedSolo(i)`, `__skreedFreeze`, `__skreedFrame`, `__skreedState()`.
