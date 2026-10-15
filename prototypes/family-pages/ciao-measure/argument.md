# ciao's argument screen, measured (round 3, D5; 2026-10-15)

Sources (scratch only, nothing copied into the repo): `research/ciao-landing/layout/data/ciao-to-skreed-map.json` element 19,
`refsites/src/ciao/webflow.css` 4091, 4431, 4911 to 4953, `inline-styles.css` 582 to 596, `markup.html` 910 to 1064,
`research/ciao-landing/source/extracted/patched.L3361-L4557.js` 4206 to 4262 (the video stack) and 4410 to 4477 (the
section), `source/runs/keyframes-desk.json` rows 5000 to 7000, `source/extracted/patched.L1877-L3358.js` 3045 to 3115
(the per-frame can pose), the frames `ciaofam/research/sections/1280-6000..6750.png` and `390-6500..7250.png`, and the
letter geometry read in a headless browser (`round3/fam/measure/measure_letters.mjs`, `letters.json`).

## The section

- `section.is-argument`, 1000 px of scroll at 1280 x 800 (6000 to 7000), 1055 at 390 x 844 (6330 to 7385); z-index 0 under
  the other sections' 2; its `argument_container` is 100svh, flex-centred.
- The media: six per-flavour looping videos (`argument_video-stack`, `object-fit: cover`, full bleed), one at a time
  (`autoAlpha` 0.6 s power2.inOut on the carousel's `changed`, debounced 150 ms), played only while the section is in
  view (`ScrollTrigger` top bottom to bottom top). Posters are AVIF stills of the same loops. Ours: a procedural smoke
  loop (below), never their files.
- The letters: `argument_svg-container` 80% of the width, max 100rem (1400 px at the 14 px root), flex, absolute,
  centred in the container; `argument_svg` width 100%, `mix-blend-mode: screen`,
  `filter: drop-shadow(0 0 80px secondary) drop-shadow(0 0 90px primary)` (secondary is the flavour's light colour,
  primary its dark one); every path and polygon `fill: secondary`, `fill-opacity 0.72`, `will-change: transform`.
- The blur: `argument_svg-blur`, 100% x 100% over the SVG, `backdrop-filter: blur(2rem)` (28 px at the 14 px root),
  `mix-blend-mode: screen`, masked by an SVG of the letters (`mask-size: contain`, centred).
- The gradient overlay (ciao's bottom fade) fades out over the section (`autoAlpha` 1 to 0, 0.5 s power2.inOut).

## The letters' geometry (viewBox 0 0 1314 x 405, twelve shapes)

| shape | viewBox box (x, y, w, h) | 1280 px box (x, y, w, h) | 390 px box |
|---|---|---|---|
| Z | 0, 214.7, 196.2, 184.6 | 128, 409.5, 152.9, 143.9 | 39, 424.9, 46.6, 43.8 |
| E (row 1) | 279.4, 4.9, 194.4, 184.6 | 345.7, 246, 151.5, 143.9 | 105.3, 375.1, 46.2, 43.8 |
| R (row 1) | 455.4, 4.9, 171.2, 184.6 | 482.9, 246, 133.4, 143.9 | 147.1, 375.1, 40.6, 43.8 |
| O (row 1) | 611.9, 4.9, 196.3, 184.6 | 604.9, 246, 152.9, 143.9 | 184.3, 375.1, 46.6, 43.8 |
| T (last) | 1145.1, 214.7, 168.6, 184.6 | 1020.4, 409.5, 131.4, 143.9 | 310.9, 424.9, 40, 43.8 |

- Two rows: ZERO at y 4.9 to 189.5 (row 1, from x 0 to 808: 61% of the box), BULLSHIT at y 214.7 to 399.3 (row 2, the
  box's full width). Cap height 184.6 units (45.6% of the box height); the row gap 25.2 units (13.6% of the cap height).
  Round letters overshoot by 5 units.
- Rendered: at 1280 x 800 the box is 1024 x 315.6 px at (128, 242): caps 143.9 px, the box centred on the screen
  (centre y 400); at 390 x 844 the box is 312 x 96.2 px at (39, 374): caps 43.8 px.
- Font: Franklin Gothic ATF Black Italic (ciao's heading face, one paid file), uppercase. We cannot ship it and the
  brand bans slanted type (rule 18), so ours is Poppins 700 upright (rule 4's display face); its caps at the same row
  width are 97 px at 1280 (0.67 of ciao's) because the face is wider. If Sam licenses the font, it is a one-file swap:
  the layout measures the row and refits.

## The motion

- On enter (`ScrollTrigger` trigger section, start top bottom, end bottom bottom, play reverse play reverse): the
  container `autoAlpha` 0 to 1 over 0.5 s power2.inOut; the shapes from `autoAlpha` 0, scale 0.6 (origin 50% 50%)
  to 1, 1 over 0.5 s with `back.out(2)` (overshoot 1.13 at 55% of the way), stagger 0.04 s, delay 0.4 s; the blur layer
  `autoAlpha` 0 to 1 over 0.4 s power2.out after 1 s.
- On leave or leave back: shapes to `autoAlpha` 0, scale 0.6 over 0.4 s power2.in; the blur out over 0.4 s power2.in.

## The can

- Keyframe row 5000 to 6000 (the tween runs through the last benefit screen and lands at the section's top): camera
  (0, 0, 8), rotation 0, FOV 45; can scale 1 (the carousel's 1.2 lerps to the data's 1 by p0), position (0, 0, -0.5),
  rotation (-0.3491, 0, -0.0873) (tipped back 20 degrees, rolled -5), spin 0 (the label to the camera), spacing 5,
  lightIntensity 45 (the two carousel spots), spotIntensity 0, tintStrength 2, pointerInfluence 0.2.
- Row 6000 to 7000 drifts toward the packshot (camera (-3, -3.5, 20), rotation (0.1745, -0.1571, -0.1745), FOV 30,
  spacing 0.47, swirl 1, baseOffset 20, lightIntensity 10): not re-created (no packshot beat on our page).
- The can is 4.07 units tall at scale 1, 8.5 units from the camera at FOV 45: 0.578 of the screen height; tipped back it
  reads 0.54 (1280-6250.png: 160 to 595 px of 800). On the phone frame 390-6750.png (already drifting toward the
  packshot) it reads 0.47 of the height and 36% of the width.
- The float: ciao's module has no time-based idle (no sin of time in the per-frame pose, 3045 to 3115); in this pose
  the can answers the pointer (`rotation.y += smoothX / 1280 x 0.2`, `rotation.x += smoothY / 1280 x 0.2`: about 5.7
  degrees at the screen's edge).

## Ours (family-page.md 21, D5)

- Screen 6 to 7 (the DOM at 5.6, the stage over 5 to 6 as ciao's row): the case at the centre, z -0.5, tipped back 20
  degrees, rolled -5, facing the camera (yaw 0), scale 4.07; the camera to (0, 0, 8) level at FOV 45 (on phones z 10,
  where the case is 0.49 of the height and leaves the letters showing either side, as the slender can does at 0.47);
  the two carousel spots back at 45 of 50; the pointer's influence (our 5 and 3 degree tilt scaled by the argument
  factor) plus a slow bob of ours (0.05 units over 5.6 s, 1.5 degrees of yaw over 8.3 s; `?bob=0` turns it off; off
  under reduced motion), because a touch screen has no pointer.
- The letters: GO over BEYOND BASIC in Poppins 700 uppercase (E-F3), one `<text>` per letter in an SVG of
  1314 x 266.84 units (the long row the box's width, caps 0.705 em, the row gap 13.6% of the cap height), the box 80%
  of the width, 1400 px at most, centred; fill the shade's light tint at 0.72, screen blend, drop shadows 80 px in the
  light tint and 90 px in the dark one; the pop and the leave as ciao's (WAAPI, `linear()` sampled from back.out(2),
  0.5 s, stagger 0.04 s, delay 0.4 s; out 0.4 s power2.in); the blur 28 px, clipped by a copy of the rows in a
  `clipPath` (userSpaceOnUse, scaled to the box), in 0.4 s after 1 s.
- The smoke: a 2D canvas of about 6,000 pixels scaled to the screen, tileable value noise (three octaves, the lattice
  two cells tall over the screen, x unbounded), a 40 s loop (the field rises one period and sways on a circle through
  the depth), the body in a 65/35 mix of the dark and light tints, the brightest wisps in the light tint, over the
  night; 30 frames a second while the screen shows (0.59 ms a frame in node, round3/fam/smokebench.mjs), one still frame
  under reduced motion.
