# Hero prototype v9 (2026-10-08)

Live: https://claude.ai/artifact/QDXUhF32ZLd7L9a5ccDnq8 (version 14). Builds on v8.2 (`../hero-v8`).

## The floor, re-created from igloo.inc's snow
Sam asked for the floor to look exactly like igloo's. Three Blender variants were built from the hero camera and judged against four igloo screenshots by three reviews (surface, shape, tone): variant a won on composition (flank knolls, open centre, foreground mounds), with b's tone and stone scatter and c's measurement harness grafted on. The integrated floor (`blender/floor_final.py`, post curve `blender/floor_final_post.py`, LUT `blender/floor_lut.json`, checks `blender/floor_judge.py` and `blender/verify_bake.py`) adds:
- a pale blue-grey snow (near ground sRGB about 0.42/0.44/0.49 after the page curve, B/R 1.15 to 1.18, dark tenth B/R 1.27), neutral shadows, no violet;
- wind-sculpted drifts and soft mounds, a central plain under the logo held 0.30 below the sightline, a logo pad at y -3.6;
- 70 small dark stones so a dozen show in frame, albedo lifted so none crush to black;
- a soft contact shadow baked under the floating logo (a shadow-only proxy of the mark, invisible to the camera);
- depth haze toward the far valley.
The 4096 bake carries the macro lighting only; the page's own crumb grain sits on top, because at 18 to 35 texels per unit a bake cannot hold igloo's 0.03-unit grain.

**Page side.** The bake came through a stop too bright on the lit faces while the shaded flanks matched, so the ground shader applies a soft power curve in linear light (`gExp` 0.45, `gGamma` 0.7, fitted band by band against the igloo hero shot: lit bands now within 3 percent) and a gentle near-camera falloff (`gNear` 0.8, full by 20 units), which also mirrors igloo's darker foreground and keeps the headline at 4.8:1 on desktop and 4.6:1 on the phone (the phone sub-line goes to Source Serif 4 600 so it stays inside AA as bold text). Fog brightness raised to 0.4 so the wisps read on pale snow and the far ridge melts into the night instead of cutting out. New Tune sliders: Ground exposure, Ground contrast, Near ground.

Known gaps against igloo, being fixed in a further bake round: the bake's streak layer reads as brushed smear at 2x (igloo is soft isotropic mottling), a flat band where the sightline cap meets the plain, little relief in the mid field (igloo has stacked drifts with crescent scarps), the far ridge as one flat plane, the left mound's crest. igloo's camera also looks down onto its terrain; ours sits 1.1 units above the floor pitched up, so its big hazy hills behind the subject cannot read the same way here. A higher-camera framing was rendered for comparison (`blender/` notes) and is a decision for Sam.

## Logotype glitch, in our shades
The classic glitch splits red and blue. Ours splits a near-complementary pair from the hero's ten family shades (OKLCH hues 130 to 170 degrees apart, the same theory behind a chromatic split): Sky and Crimson, Amethyst and Sunbeam, Lawn and Rouge, Sky and Mango. Each burst picks one pair; about 40 percent of the slabs get two ghost copies of the wordmark pulled 1.5 to 2.7 percent of the width to either side, opacity balanced by lightness so Sunbeam and Amethyst read with the same weight, with the Pearl Whisper copy on top so the colour shows only as fringes. The intro burst uses Sky and Crimson, the pair the mark itself shows at rest. Tune: "Colour split" toggle. Off under reduced motion with the rest of the glitch.

## Logo lighting (sliders in, defaults off)
The matte black mark on the black sky needs cinematic separation. The shader now has a rim kicker (direction by azimuth and elevation), a GGX specular with roughness, a floor bounce from the snow and a violet sky ambient, all at 0 by default pending the lighting research and a judged preset. Tune section "Logo light".

## Test hooks
`__skreedSolo(i)`, `__skreedFreeze`, `__skreedFrame`, `__skreedState()`, `__skreedFloorCheck()`, `__skreedLogo`. Screenshots under a strict CSP via `../hero-v8/shot.mjs`.
