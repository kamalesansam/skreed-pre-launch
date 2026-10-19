# igloo.inc's entry dive, measured (evidence for docs/specs/section-4-world.md)

Measured 2026-10-19 on the live site (App3D-d68cb154.js) in headless Chromium 141 on the Apple M3 Pro GPU, driven only by ArrowDown and ArrowRight and by setting the scroll controller's number, plus the code reading of `docs/references/wiring/igloo-inc.md` (an older build, App3D-f554a111.js). Nothing was clicked, accepted, downloaded or uploaded; no shader source was read in this pass. Screenshots were taken for measurement and are not kept in the repo. Nothing of igloo ships: these numbers describe what our own rings, lattice and particles are measured against.

## 1. How this was measured

**The built-in browser failed.** I tried it at 1024x768 and 1280x800. The pane was hidden and ran at about 2 frames a second. The console showed repeated `GL_INVALID_FRAMEBUFFER_OPERATION ... Attachment has zero size` and `RangeError: Maximum call stack size exceeded at nF.update (App3D-d68cb154.js:7101)`. The loader never cleared after about 40 s. This matches docs/specs/evidence/section-4-measurements.md:516, where igloo also stayed on its loader in the emulated pane.

**Claude in Chrome also failed.** The tab reported `visibilityState: hidden` and never left the loader. I closed it.

**What worked.** Headless Chromium 141, launched from the repo's playwright 1.56.1, rendered on the real GPU ("ANGLE Metal Renderer: Apple M3 Pro"):
- An init script caught the scroll controller the same way the doc's harness did (`scrollMultiplier` trap, doc line 699).
- I only pressed ArrowDown and ArrowRight. One sweep run set the scroll number directly. Nothing was clicked or accepted, and nothing was downloaded or uploaded.
- Reading shader source was refused by the permission classifier, so no shader code was read in this pass. Shader behaviour below comes from the doc's earlier code read plus what the frames show.
- The repo is untouched. The built-in browser viewport is reset to desktop and its tab is closed.

**The live build has changed since the doc.** It now runs App3D-d68cb154.js and index-2e130bc1.js; the doc read App3D-f554a111.js and index-2eb69c09.js. Live values from the controller:
- The loop is 9.85 units, not 10.85.
- The cubes scene is 2.35 to 4.35, height 2 (now 2 cubes), not 3.
- The entry scene is 4.35 to 9.85, height 5.5.
- The room rest is 8.29, not 9.29. Formula 0.76 x 6.5 - 1 + 4.35; measured y=8.29, entry progress 0.76.
- The top-of-shaft rest is about 4.65 (inferred from initialScrollAutocenter 0.2).
- The entry timeline itself is unchanged: 9.2 s, the same keyframes.

## 2. Numbers quoted from docs/references/wiring/igloo-inc.md

**Entry dive (4.6, lines 386-396)**
- Timeline: 9.2 s over 6.5 units of scroll.
- Start pose: camera (0, 1.5, -2) looking at (0, -2.5, -1).
- x and z go to 0 by 2.5 s (power2.out).
- y falls to -9.83 from 0.2 to 7.2 s (`entry_ease_3`). The target drops to -10, then -9.81.
- Roll: the up vector rotates by pi over 5.25 s from 1 s (power3.inOut), then blends back to world up from 3.5 s over 3.7 s (`entry_ease`).
- z pulls back to -1.5 from 3.5 s, and to -3 from 7.2 s.
- FOV is 22 at 0 and opens to 30 by 7.2 s (power1.inOut).
- Parallax starts at (0.01, 0.005) and goes to 0 between 4 and 5 s. Between 4 and 6 s the target gets an offset of (-0.03, -0.01) and a 0.05 roll.
- Portrait zoom is `min(1, aspect x 1.5)`.
- Rings are hidden once passed, below progress 0.34, 0.43 and 0.52. Tunnel and snow go at 0.52; the room ring appears above 0.53.
- Glitch flash `uRingProximity` at timeline 2.0, 2.95 and 3.8 s: up over 0.5 s (power1.in), down over 0.4 or 0.6 s (power1.out), with a new random seed for the glitch squares each time.
- Portal hum: power2.out of the distance to progress 0.28, 0.375 or 0.465, within 0.04.
- Shards are pushed outward along their own `centr` vector and spun by `rand`. The amount is `falloffsmooth` of the camera's distance to the ring (App3D.js:53273-53429).
- Later layers: particles from 1.5 s, floor from 3.4 s (5 s power2.out), forcefield from 4 s, text cylinders from 4.5 s, ground smoke and ambient particles from 4.4 s.
- Autopilot: after 1.4 s idle, glide over `clamp(4 x distance, 2, 20)` s (also line 217).

**Room (4.7, lines 398-416)**
- 150,000 points simulated on the GPU in float textures (half-float fallback).
- Each step samples a 3D texture: RGB is the direction to the surface, alpha a signed distance. Particles are pushed along it to the surface, pulled gently back to their spawn point, and stirred by curl noise.
- A 128-cell fluid sim stirs them: splat radius 0.22, force 35.
- Damping `0.9^dtRatio`, kept inside a cylinder. Particles inside the shape are shaded darker.
- Rotation 0.75 rad/s.
- Link change:
  - Swap the volume texture.
  - Burst noise 1 to 0 over 0.5 s (power2.inOut).
  - Reset the rotation to 1.5 pi.
  - Floor rings advance 4 units over 3 s (power4.out).
- The room UI is enabled only between entry progress 0.64 and 0.9.
- Lines 656 and 660: the shapes are signed-distance volumes, and fast particles lighten toward #d7ebfa as a motion-blur stand-in.

**Reveal primitive (4.10, lines 444-459)**
- `falloff(input, start, end, margin, progress)`. For start 0 and end 1 it is `clamp((progress x (1 + margin) - input) / margin, 0, 1)`. `falloffsmooth` uses a smoothstep ramp.
- It is also used with a fixed progress as a plain band, for example ring fades by camera distance (53333-53352).

**Ledger rows**

| Line | File | Size | Contents and use |
|---|---|---|---|
| 538 | shattered_ring.drc | 40,703 B | 7,194 verts, 10,402 tris (centr, rand); middle ring |
| 539 | shattered_ring2.drc | 43,550 B | 7,801 verts, 10,788 tris; rings 1 and 3 |
| 540 | shattered_ring_smoke.drc | 10,263 B | 1,677 verts, 3,072 tris; plasma halos, also squashed into ground smoke |
| 541 | smoke_trail.drc | 4,126 B | 641 verts, 1,032 tris; three meshes |
| 556-559 | ring colour maps | 1024 px, 219 to 229 KB | ring colour |
| 556-559 | `_ao` maps | 256 px | used as `tGlow`: the red channel adds blue light near the camera |
| 577 | triangles_tiling.ktx2 | 512 px, 47,616 B | the triangle lattice in the ring forcefields |
| 579 | wind_noise | 256 px | smoke |
| 580 | clouds_noise | 256 px | moving bands in the forcefields |
| 592 | scroll-datatexture | | also drives the ring-flash glitch |
| 594 | blue noise | 128 px | dither for the ring post pass |
| 599-601 | volumes | 64³ (836,620 B), 64³ (318,476 B), 32³ (45,330 B) | penguin, X and M |

Bloom threshold 0.2 is shared by every scene (line 762).

## 3. Live scene geometry (world units, read from the running scene)

**Rings**
- Three rings, flat on XZ (rotated -pi/2 about x), at y -1.65, -4.15 and -6.65. **Spacing 2.5.**
- Outer radius 0.4006. Thickness 0.131 (local z from -0.014 to 0.117).
- Inner radius about 0.29 (inferred from the frame: inner/outer ratio about 0.71).
- Opaque, depth-tested. Uniforms: tMap 1024, tGlow 256, uColor1 #6a6f7d, uColor2 #e1e6f1.
- Ring 2 is `shattered_ring`; rings 1 and 3 are `shattered_ring2`.

**Ring forcefields:** 0.65 x 0.65 planes (radius 0.325) at y -1.5, -4.0 and -6.5, which is 0.15 above each ring and covers the ring's hole. Additive, no depth test. Textures: triangles 512 and noise 256. Same two colours.

**Plasma halos:** at y -1.6, -4.1 and -6.6, rotated 0, 1.57 and 3.14 about y. Radius 0.62 (wider than the ring), sitting +0.094 to +0.202 above. Additive, double-sided.

**Smoke trails:** at the same heights and rotations. They span x from -1.37 to 1.41. Normal blending, no depth test.

**Shaft layers**
- Tunnel: cylinder of radius 1.3 (3.25 x the ring radius) from y +1 to -8. Additive.
- Snow: 200 points within ±1.5 (x, z) and ±4 (y) around y -3.5.

**Room**
- Floor at y -10.19, radius about 1.31 (1.8 x 0.73).
- Particles: 150,000 points centred at y -9.785, cubeSize 0.65, volume scales 1.2, 1.3 and 1.25, uSize 10, uLightPos (-0.75, 1, -0.1).
- Particle colours: initial #b5d5ff, light #bdc6d4, dark #222b42, fast #d7ebfa.
- Room forcefield: cylinder of radius 0.28, height 0.84, at y -10.13.
- Text cylinders: at -10.33 (scales 1.75 and 3.5) and at -9.5 (scales 2,9,2 and 3.3,8,3.3).
- Light-room sphere: at -12.15, rendered from the inside.
- Ring light: plane at about -9.40.
- Ceiling smoke at -9.4; ground smoke at -10.17 (scale 5).

**Camera:** PerspectiveCamera, FOV 22, near 0.1, far 1000. Initial up is (0.008, 0, -1), so screen-up points along world -z while looking down.

**Post:** the entry colour pass has `uRingProximity` (the flash), `uBlueOffset` (re-randomised every frame) and `uGradientAlpha` (0). The composite has uProgress, uProgressVel and two detail uniforms.

**Live timeline extras** (from the GSAP timeline):
- There is a fourth callback at 4.9 s with params `[false, 0.5]`. It is not in the doc; its purpose is unknown.
- Tween schedule, matched to the uniforms I watched:
  - particles alpha 0 to 1 over 1.5 to 4.0 s;
  - floor alpha from 3.4 s over 5 s (power2.out);
  - room forcefield from 4 s over 2 s (power2.inOut);
  - three proximity pulses at 2.0 to 2.5 to 2.9 s, 2.95 to 3.45 to 3.85 s, and 3.8 to 4.3 to 4.9 s;
  - two unidentified 1-to-0 fades at 3.5 s (1.5 s) and 3.9 s (1 s).
- The pulses match exactly: tl 3.214 gave 0.279, 3.609 gave 0.363, 4.066 gave 0.282, 4.52 gave 0.401.

## 4. Camera path and timing (desktop, 1280x800)

**When the camera crosses each ring plane (timeline seconds):**

| Ring | Crossing | Entry progress | Flash peak | Peak is ahead of the ring by | FOV at the pass |
|---|---|---|---|---|---|
| Ring 1 | about 2.81 s | 0.3055 | 2.5 s | 0.72 units | 24.4 |
| Ring 2 | about 3.67 s | about 0.40 | 3.45 s | 0.70 units | 26.2 |
| Ring 3 | about 4.48 s (interpolated) | about 0.49 | 4.3 s | about 0.6 units | about 27.7 |

- Intervals between crossings are 0.86 s and 0.81 s.
- In the sweep, `uRingProximity` reached 0.954 with the camera 0.7 above ring 2.

**Screen roll at each moment** (from camera up, timeline seconds):

| tl | 2.24 | 2.54 | 2.81 (ring 1) | 2.97 | 3.27 | 3.67 (ring 2) | 4.07 | 4.48 (ring 3) | 4.63 | end |
|---|---|---|---|---|---|---|---|---|---|---|
| Roll | -4° | -11° | about -19° | -28° | -50° | about -95° | -136° | about -160° | -167° | 180° |

About 140° of roll happens during the three ring passes. I did not verify the roll direction on screen.

**Exit:** after ring 3 the camera pitches from straight down (direction 0,-1,0) to level (0,0,1). Measured direction (0, -0.98, 0.20) at tl 4.89 and (0, -0.52, 0.85) at 5.59. It ends at (0, -9.822, -1.473), FOV 29.99, looking level at the sculpture 1.47 away. Camera x stays at about 0.

**Autopilot in real time.** I stopped at y 4.709 (entry progress 0.209). The glide started about 0.3 s later and ended at 8.29 at 14.47 s, so about 14.1 s for 3.58 units; the formula predicts 14.3 s.
- The ease is `inOut3`, cubic-bezier(0.6, 0, 0, 1). Checked against the log: at 24% of the time the camera has covered 12% of the distance (curve: 10.4%); at 35%, 53% (curve: 50%); at 46%, 79% (curve: 78%).

| Glide time (s) | 1.5 | 3.0 | 4.0 | 4.5 | 5.0 | 5.5 | 6.0 | 7.0 | 8.0 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Share of travel | 1.5% | 6.2% | 15.5% | 26% | 42% | 59% | 70% | 81% | 88% | 95% | 98.5% |

- Rings are crossed at about **4.1, 4.77 and 5.17 s**: all three in about 1.1 s.
- Peak descent speed is about 6.5 units/s, about 2.6 ring spacings a second.
- The first flash is visible (proximity above 0.05) from about 2.5 s to 4.1 s.
- The view is near level from about 6.5 s; the rest is a slow 8 s settle in the room.
- **The dive itself is roughly the 2.8 s window from 2.5 to 5.3 s inside a 14 s glide.**

**Visibility windows** (observed on/off by entry progress):

| Element | Shown from | Hidden by |
|---|---|---|
| Ring 1 | start | 0.34 to 0.35 |
| Ring 2 | start | 0.41 to 0.44 |
| Ring 3 | start | 0.50 to 0.52 |
| Forcefield 1 | start | 0.34 |
| Forcefield 2 | about 0.25 | 0.43 |
| Forcefield 3 | about 0.36 | 0.52 |
| Plasma 1 | start | 0.34 |
| Plasma 2 | about 0.25 | 0.43 |
| Plasma 3 | about 0.35 | 0.52 |
| Smoke 1 | start | about 0.37 |
| Smoke 2 | start | 0.44 to 0.50 |
| Smoke 3 | start | 0.54 to 0.58 |
| Tunnel and snow | start | 0.52 |

## 5. What the screenshots show (desktop)

**Approach** (entry-top-1280.png: camera 1.78 above ring 1, FOV 23.1)
- Straight down the shaft, perfectly centred.
- Ring 1 is about 930 px across, wider than the 800 px frame height, so it spills off the top and bottom. It is a chunky, bevelled, cool grey-blue band of about 12 segments with seams.
- Its inner rim glows white-blue and bleeds inward.
- The ring's hole is filled by the forcefield: an irregular, Delaunay-like triangle lattice of 1 px bright lines.
  - Triangle edges are 25 to 45 px, about 0.02 to 0.04 units, roughly 1/10 to 1/16 of the disc radius (inferred).
  - The lattice is brightest at the rim and fades to clear toward the centre, with wispy smoke threads in the lower part.
- Seen through it: ring 2 (about 420 px across) and ring 3 (about 240 px) are **broken** into a long C-arc of 180 to 240° plus 4 to 6 short arcs and 2 to 3 small blocks. The pieces are pushed outward and toward the camera, and tilted.
- Dead centre is a soft white particle glow: the room far below, the vanishing point in every frame.
- Sampled colours (real GPU, after post):

| Where | Colour |
|---|---|
| Fog, left | #797e8c |
| Fog, right | #adb3c0 (a diagonal gradient) |
| Ring face | #94a2b5 to #a8b7c8 |
| Rim glow | #c5cfde, rising to near white |
| Forcefield midtone | #a2aab7 |

**Transition wipe at half** (transition2-half-1280.png): the cube scene slides off the top with a strong RGB fringe. The rings appear below in fog.

**Mid-dive**
- Frames g2-007 to g2-009, flash 1 at proximity 0.46 to 0.80:
  - The near ring's rim has become a bright white halo at the frame edge.
  - The whole frame turns blue-grey and is smeared in small 4 to 12 px blocky, dithered displacements, like a pixelated brush smear, with a blue fringe at edges.
  - The next ring is ghosted. I saw no hard squares.
- g2-010 and g2-011: ring 2 snaps crisp: an assembled segmented band with a glowing inner rim and a few radial plasma wisps off its outer edge. Ring 3 inside is still broken.
- g2-013 to g2-015: ring 3 is intact and fills the frame. Through it, the tunnel's concentric ripple rings and the floor grooves.
- g2-016 to g2-019: the floor tilts up and the particle cloud stands up into the sculpture.

**Shard rule, observed** (distance sweep to ring 2, sheet-sweep.png):
- At 4.0 units the ring is broken, with gaps.
- At 3.5 and 3.0 it is caught mid-flash.
- At 2.5 and 2.0 it is assembled.
- By 1.5 it fills the frame; at 1.0 only the rim glow at the frame edge is left.
- So **far rings are spread apart and they come together between about 3.5 and 2.5 units, which is exactly during the previous ring's flash** (0.7 before ring N is 3.2 before ring N+1).
- A burst at close range cannot be seen separately, because the ring is already larger than the frame by about 1 unit away (inferred).

**Room** (room-1280.png)
- Level view. A penguin-with-headphones made of particles fills about 80% of the frame height, on a pedestal disc with a triangle-lattice cylinder.
- The floor has concentric glowing grooves. An overhead ring light shows at the top, and blurred text cylinders float behind.
- Thin arrows sit at x 280 to 345 and 955 to 1020 (y 380). A bracketed selector at the bottom centre reads LinkedIn.

**Morph after ArrowRight** (room-next-*.png)

| Time after the key | What is on screen |
|---|---|
| 150 ms | The penguin dissolves into a lumpy column |
| 400 ms | A noisy swirling column, about half the particles lightened (fast particles) |
| 800 ms | The X is legible but ragged and turning, with a trailing strand; the label scramble has settled on "X / Twitter" |
| 1.5 s | The X is formed, with fuzzy edges |

## 6. Phone (390x844, DPR 3, touch user agent)

- Same geometry. Zoom is 0.693, so the effective vertical FOV at the approach is about 32.9° and horizontal about 15.5° (inferred from FOV 23.1 and the zoom).
- Ring 1 at the approach is wider than the 390 px screen. The inner rings fill about 60% of the width.
- The room sculpture is centred at about 60% of the width, with the ring light at the top.
- Canvas started at 585x1266 (the 1.5 DPR cap). Adaptive DPR stepped it down to 526x1139, 468x1012 and 409x886 during my capture; I infer the screenshot load caused it.
- **Each step cancelled the autopilot.** It sat at y 6.8829 for about 1.8 s and at 7.8919 for about 1.6 s, then restarted. This is the doc's resize-cancels-settle bug (lines 224 and 757).
- Frames: sheet-phone.png.

## 7. What makes it read the way it does, ranked

1. **Nested rings on the view axis.** Three identical rings, evenly spaced (2.5, about 6x their radius), seen dead-centre. Perspective turns them into concentric circles (930, 420, 240 px), which reads as depth immediately. A bright target sits at the vanishing point.
2. **Each ring is a lit portal in a dull frame.** An additive inner-rim glow plus a forcefield lattice disc in the hole, and plasma wisps outside, against a desaturated cool fog.
3. **Pacing.** A slow lead-in (about 6% of travel in the first 3 s), then all three rings in about 1.1 s at about 6.5 units/s, then a long settle (cubic-bezier 0.6, 0, 0, 1).
4. **Shatter by distance.** Far rings are broken into uneven arcs and blocks and snap together as the camera closes in (between 3.5 and 2.5 units), so even still frames show motion.
5. **A glitch flash just before each ring.** It peaks about 0.7 units before the ring plane and lasts 0.9 to 1.1 s in timeline time. A blocky dithered smear with a blue cast covers the next ring's snap.
6. **A 180° roll across the dive.** About 140° of it happens during the ring passes. It reads through the segment seams and the asymmetric smoke trails.
7. **Lens widening.** FOV opens from 22 to 30, plus parallax that fades out.
8. **Background parallax.** The tunnel wall's concentric ripples, 200 snow points, three smoke spirals and the plasma.
9. **The landing.** A pitch from straight down to level, with the floor and the particle cloud resolving into a sculpture.

## 8. Turned into numbers for a 3-ring glide (inferred conversions, not measured)

- **Geometry relative to the ring spacing S:**

| Part | Value |
|---|---|
| Ring outer radius | 0.16 S |
| Ring inner radius | about 0.116 S |
| Ring thickness | 0.052 S |
| Forcefield disc | radius 0.13 S, 0.06 S above the ring |
| Plasma halo | radius 0.25 S |
| Tunnel | radius 0.52 S |
| Start camera | 1.26 S above the first ring |

- **Apparent size:** at the approach pose the first ring should be about 116% of the frame height on desktop, and wider than the screen on a phone.
- **Events relative to each ring crossing:**
  - flash rise starts about 0.5 s of timeline before the peak;
  - peak about 0.28 S before the ring plane;
  - fall over 0.4 to 0.6 s;
  - the next ring assembles between 1.4 S and 1.0 S away.
- **Rhythm:** igloo crosses its rings about 0.85 s of timeline apart, and about 0.4 to 0.67 s apart in real time at the autopilot's peak.
