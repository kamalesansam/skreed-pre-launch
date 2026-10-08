# Hero prototype v8 (2026-10-08)

Live: https://claude.ai/artifact/QDXUhF32ZLd7L9a5ccDnq8 (version 11). Moon world by default.

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
