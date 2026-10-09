SKREED INTRO TIMELINE
t = seconds after ready; the loader fade and the intro start on the same rAF.

Ease definitions (CustomEase cubic beziers, as igloo's):
| Ease | Definition |
|---|---|
| inOut1 | M0,0 C0.5,0 0.1,1 1,1 |
| inOut3 | M0,0 C0.6,0 0,1 1,1 |
| inOut4 | M0,0 C0.4,0 -0.06,1 1,1 |
| igloo_ease_1 | M0,0 C0.662,0.073 0.047,1 1,1 |
| cubic (Svelte) | x<.5 ? 4x³ : .5(2x-2)³+1 |
| sine.inOut | GSAP sine.inOut |
| sine.out | GSAP sine.out |
| power2.inOut | GSAP power2.inOut |
| power3.inOut | GSAP power3.inOut |

| # | Element / target | From → to | Start (s) | Duration (s) | Ease | End (s) | Notes |
|---|---|---|---|---|---|---|---|
| 1 | #loader .tape opacity | 1 → 0 | 0.00 | 0.25 | cubic | 0.25 | tape keeps scrolling |
| 2 | #loader panel opacity | 1 → 0 | 0.00 | 0.75 | cubic | 0.75 | element removed at 0.766 |
| 3 | composite uIntro (mix Slate → scene) | 0 → 1 | 0.00 | 1.00 | inOut3 | 1.00 | .12 @.25, .84 @.5, .97 @.75 |
| 4 | outline uOutP (front y = mix(5.62,-2.18,p), margin 2.89) | 0 → 1 | 0.00 | 2.50 | power3.inOut | 2.50 | crown about 0.4; all lit about 1.5 |
| 5 | outline uOutA | 1 → 0 | 2.00 | 3.00 | inOut4 | 5.00 | .87 @2.5, .30 @3, .04 @4 |
| 6 | outline visible | true → false | 0.00 / 5.00 | set | – | 5.00 | |
| 7 | cage uCageP (R_full = 25p-5, R_zero = 25p) | 0 → 1 | 0.00 | 4.00 | sine.inOut | 4.00 | R_full 2.7 @1.5, 7.5 @2, 16.3 @3 |
| 8 | cage uCageA, part 1 | 0 → 0.4 | 0.00 | 0.10 | power2.inOut | 0.10 | |
| 9 | cage uCageA, part 2 | 0.4 → 0 | 2.10 | 3.00 | power2.inOut | 5.10 | .33 @3, .23 @3.5, .11 @4 |
| 10 | cage visible | true → false | 0.00 / 5.10 | set | – | 5.10 | |
| 11 | numbers uNumP (cell = floor(48p-d)+1) | 0 → 1 | 0.50 | 4.00 | sine.out | 4.50 | count front 48p-9: 9.4 @1.5, 17.7 @2 |
| 12 | numbers visible | true → false | 0.00 / 3.75 | set | – | 3.75 | igloo's alpha tween is dead code, omitted |
| 13 | logo mesh visible | false → true | 0.00 / 1.10 | set | – | 1.10 | |
| 14 | logo uPrint (edge E = 3.38-8.455p) | 0 → 1 | 1.10 | 2.25 | igloo_ease_1 | 3.35 | first pixels 1.45; mark bottom passed about 2.1 |
| 15 | breath gate (introDisplacementModulator) | 0 → 1 | 2.00 | 2.00 | linear | 4.00 | |
| 16 | floor + stones uFloorA | 0 → 1 | 0 / 2.10 | set | – | 2.10 | hard switch, white pool appears |
| 17 | far floor uFarA (smoothstep(32,36,g)) | 0 → 1 | 0.70 | 3.00 | power2.inOut | 3.70 | igloo's mountains |
| 18 | floor uU (triangle ring lead 0.9+32.1u) | 0 → 1 | 0.70 | 7.50 | inOut1 | 8.20 | 5.9 @2.5, 12.0 @3, 19.3 @3.5 |
| 19 | floor uU2 (snow disc D = 32.1u2-0.2) | 0 → 1 | 0.70 | 7.50 | inOut3 | 8.20 | 1.2 @2, 3.2 @2.5, 8.5 @3, 19.0 @3.5, 24.2 @4, 28.6 @5, 31.9 @8 |
| 20 | fog cards FOG.uOpacity | 0 → 1 | 2.00 | 3.00 | power2.inOut | 5.00 | igloo smoke |
| 21 | sky uSkyP (flat Slate → night dome) | 0 → 1 | 1.50 | 3.00 | power2.inOut | 4.50 | .22 @2.5, .50 @3, .78 @3.5 |
| 22 | bloom strength | 1.5·P.bloom → P.bloom | 2.50 | 2.00 | sine.inOut | 4.50 | igloo 1.5 → 1 |
| 23 | bloom threshold | 0.08 → 0.62 | 2.50 | 2.00 | sine.inOut | 4.50 | our addition |
| 24 | camera introWeight w (base pos/target lerp P0,T0 → hero) | 0 → 1 | 2.00 | 5.50 | inOut1 | 7.50 | camY 21.21 @2.75, 16.32 @3.5, 8.71 @4, 3.76 @4.5, 1.08 @5, -1.52 @6, -2.50 @7.5 |
| 25 | live / touch (parallax, shake, bob, push) | 0 → 1 | 2.00 | 5.00 | power2.inOut | 7.00 | .08 @3, .32 @4, .5 @4.5, .68 @5, .92 @6 |
| 26 | scroll lock | locked → free | 0 / 5.00 | set | – | 5.00 | |
| 27 | rock solve allowed | no → yes | 5.10 | set | – | 5.10 | scroll > 0.3 overrides |
| 28 | UI event | call | 4.50 | – | – | 4.50 | igloo webgl_show_ui_intro |
| 29 | site logo shown + glitch burst | burst(0.5) | 5.25 | 0.50 | linear (glitch) | 5.75 | idle glitch timer from 5.75 |
| 30 | "Launch in": plate scaleX | 0 → 1 | 5.53 | 0.40 | sine.out | 5.93 | uShow1 |
| 31 | "Launch in": text front (plate left edge follows) | 0 → 1 | 5.53 | 0.75 | linear, whole chars | 6.28 | uShow2 |
| 32 | countdown row: plate | 0 → 1 | 5.63 | 0.40 | sine.out | 6.03 | |
| 33 | countdown row: groups | 0 → 1 | 5.63 | 0.75 | linear, whole groups | 6.38 | |
| 34 | cue "Scroll": plate | 0 → 1 | 5.63 | 0.37 | sine.out | 6.00 | |
| 35 | cue "Scroll": text | 0 → 1 | 5.63 | 0.74 | linear | 6.37 | |
| 36 | cue ball + line shown, bounce starts | set | 6.37 | – | – | 6.37 | |
| 37 | UI settled | – | – | – | – | 6.80 | |
| 38 | introDone | false → true | 8.20 | set | – | 8.20 | end of uU and uU2 |

Always-running inputs:
- uTime = template t: cage twinkle sin(13·ph + 6·uTime), outline idle with 5·uTime.
- uResY = drawing-buffer height.

Reduced motion:
- Rows 1-38 are replaced by: at ready, every target is set to its end value, the loader panel fades 1 → 0 over 0.30 s (cubic), and the UI shows without plates.

Skip (hash, restored scroll, ?intro=0):
- At ready, every target is set to its end value, with the standard rows 1-3.

Phone:
- Identical rows. Only camA.zoom = min(1, aspect·1.25) and the DPR cap differ.

Full per-0.25 s values: research/intro/spec/skreed_timeline_values.txt, generated by skreed_tl.py.