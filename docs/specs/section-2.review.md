# Section 2: review log

## Iteration 1, 2026-11-03: FAIL

Five-minute review on the owner's word, graded from the hand-off's measurements and the frames; nothing re-run.

The round landed on the default at ec7d5a3 before this review, on the owner's word of 2026-11-03, so every FAIL item below is a follow-up on the default, not a block. Graded: `docs/specs/section-2.md` section 14, the hand-off `handoff-r4.md` (suites, parity, hooks, budgets, Lighthouse), `git diff 21f1480` (stat, and `src/config/hero.ts`, `src/scripts/hero/section2/gems.ts`, `src/styles/shell.css` in full), five of the twelve frames opened (`hero-r4-390-rest`, `-390-flight`, `-390-pull-end`, `-1280-rest`, `-1280-flight`) and the sizes of all twelve, and `graphify affected` for `S2T` and `TRACK_SVH`.

### The frames, read first

- `hero-r4-390-pull-end.png`: the wordmark loader at 45 percent, no scene.
- `hero-r4-390-flight.png`: the loader's hairline wordmark at 88 percent; no block in the air.
- `hero-r4-1280-flight.png`: the loader at 83 percent; no block in the air.
- `hero-r4-1280-rest.png`: the loader at 100 percent; no gem, no label.
- `hero-r4-390-rest.png`: ten gems in their slots and ten labels, under a dim veil with the loader's hairline wordmark still drawn across the middle (over Basic Brown's label): the loader's exit, caught mid-fade.
- Not opened, graded by size: `390-wipe-mid` 9.0 KB and `1280-pull-end` 15.7 KB and `1280-wipe-mid` 16.1 KB sit in the loader frames' size class (7.7 to 16.1 KB); the scene frames are 200 KB to 1.5 MB (`390-rest`, both `wipe2-mid`, both `quiz`).
- Reading: seven of the twelve frames show the loader. The capture snapped its positions in order before the loader had finished (at 390 it ended between flight and rest, at 1280 between rest and the second wipe). A capture defect in `scripts/hero/frames-r4.mjs`, most likely not a build defect, but the round's visual proof of the flight is missing at both widths and of the rest at 1280.

### CHECKLIST

- A1 PASS: the source diff changes three constants' maths, one comment block, one deleted per-block schedule and one CSS height; no colour, type, gradient, shadow, icon, card, copy or hover change, so none of rules 1 to 50 is touched (motion stays under E-12, the canvas under E-C3).
- A2 PASS: no colour or token in the diff.
- A3 PASS: no type change.
- A4 PASS: no UI copy changed; the record's added lines scanned for em and en dashes and emoji by the builder (hand-off, criterion 9); my own count did not complete inside the box.
- A5 PASS: the ten gems in the family shades, `390-rest`.
- B1 FAIL: the frames exist at 390 and 1280, but seven of twelve show the loader, not the section (above).
- B2 PASS: no width or layout change in the diff; `390-rest` shows no overflow.
- B3 PASS: no link or storage change.
- B4 PASS: `.track{height:675svh}`, svh, not animated.
- C1 PASS: every budget line ok, total JS 243.2 KB gz, the default's own figure; the island chunk 56.6 KB gz (hand-off).
- C2 PASS: no image change.
- C3 PASS under E-C3: no new WebGL, no CSS property animated; the island renders per frame, not per scroll pixel.
- C4 PASS against E-C4's default (pending Sam): Lighthouse 97 mobile on the poster tier, LCP 2.3 s, TBT 0, CLS 0 (`lh-poster.json`).
- D1 FAIL: the frames that should show the flight (both widths) and the rest (1280) at rest show the loader; the hooks' readings (labels 10 at 5.0 at both widths) say the state is reached, but no frame at 1280 proves what a visitor sees, and `390-rest` is under the loader's exit.
- D2 PASS: the reduced-motion path unchanged (`hidden` at L 0.5, labels at L 0.6, one L for the ten); the parity frame at W1END on the still tier within 1 dB of the floor at both widths.
- D3 PASS: no data or input added.
- D4 PASS: hover and press untouched by the diff.
- E1 BLOCKED: `/web-design-guidelines` is not installed here. In its place I looked at the 390 frames by eye: three of the six I opened or sized show the loader; the rest frame reads clearly, the two staggered columns of gems with their labels, no overflow, the navbar's Menu on the logotype's row.
- E2 BLOCKED: `visual-critique:critique-screen` is not installed here; the same by-eye pass of the 390 frames stands in for it.
- E3 PASS: no markup, control or focus change; the ten links unchanged; the labels' contrast stands under E-S2-contrast and the bar's under E-NAV-contrast's default (pending Sam).
- E4 PASS (not applicable): nothing writes data.
- E5 PASS (not applicable): no schema.
- F1 FAIL: criterion 6 fails (below).
- F2 PASS: no TODO, placeholder or commented-out code in the three source files; the deleted schedule is described in comments, not left as code.

### The spec's criteria (section-2.md 14.7)

1. PASS: `S2T` in the diff reads PULL 2.5, WIPE 0.5, CAS0 2.75, FLY 1.8, W1END 3.0, LAND 4.55, W2 5.25, W2END 5.75, no GAP; `TRACK_SVH` is round((5.75 + 1) x 100) = 675, equal to `shell.css` (unit test, 211 of 211).
2. PASS: one `Lof(S)` for the ten (`const L = Lof(S); for (const st of stones) st.L = L`), `hidden` without the per-block lookup; hooks read ten equal values at every position, 0 at 2.5 and 2.75, 0.5 at 3.65, 1 from 5.0, labels 10 at 5.0. At 3.0 and 4.3 by construction (0.139 and 0.861 for all ten).
3. PASS: `pullback.spec.ts` PASS, the seven pairs equal to four decimals, inside the wipe at equal curve parameter; the `camX` and `camCurve` unit test unchanged and passing.
4. PASS: no schedule in `gems.ts`, no GAP in `config/hero.ts` (diff); unit and `astro check` pass, 0 errors, so nothing reads `S2T.GAP`.
5. PASS: budget lines at the default's figures, total JS 243.2 KB.
6. FAIL: `flight` at 390 and 1280 and `rest` at 1280 show the loader, not every block in the air and not ten gems with ten labels; `pull-end` and `wipe-mid` at both widths likewise.
7. PASS: the glue's spans, the section index, the return path, `back.spec.ts`, the gate test and both quiz scripts read `S2T` and `TRACK_SVH` (stat and hand-off); e2e island, site-nav, to-top 29 of 29, the gate test 1 of 1.
8. PASS: the still tier's frame at W1END against the prototype's 6.0 within 1 dB of the floor, 43.767 against 43.776 dB at 390 and 42.386 against 42.396 dB at 1280. Noted: the floor was redefined on 2026-11-03 (the lower of the frozen and one-frame-on captures) and E-fog-hue's patches are off on the port for the capture; both are recorded in 14.9 with the measurement behind them (mean signed difference 0.00, a zero-mean grain from the frame-keyed dither), and I accept them.
9. PASS: `CLAUDE.md`, `hero.md`, this spec, `quiz.md`, `DESIGN.md` and `hero-architecture.md` all in the stat; the dash and emoji scan is the builder's.

### Blast radius

`graphify affected "S2T"`: 20 dependents at depth 2. Those changed by the round are `gems.ts`, `scrollMap.ts` and the four unit and family tests; the rest (`rig.ts`, `hero/hero.ts`, `section3/ground.ts`, `nav-map.ts`, `types.ts`, `moon.ts`, `boot.ts`, `loop.ts`, `ride.ts`, `section4/director.ts`, `SiteNav.astro`, `site-nav.ts`, `tests/e2e/hover.spec.ts`) are unchanged and read the map by name; GAP was the only field removed and `astro check` reports 0 errors. `graphify affected "TRACK_SVH"`: `hero-math.test.ts` and `page-scroll.test.ts`, both in the hand-off. Unproven, not failed: `hover.spec.ts` and `room.spec.ts` were not run under the new map (hand-off known limits).

### Pending Sam, graded against their defaults

- E-C4: Lighthouse graded on the poster tier, 97 (PASS against the default).
- E-2.2.2: the scene without a pause control; unchanged by this round (graded against the default, not FAIL).
- The reduced-motion tier: the still tier as built; its parity frame passes (graded against the default, not FAIL).

### Verdict: FAIL

1. Re-capture the twelve frames after the loader has gone. In `scripts/hero/frames-r4.mjs`, wait for the loader's exit to finish (the loader element hidden or removed, not only the island's ready hook) before the first position, then snap the six positions at both widths and look at each: `flight` must show all ten blocks in the air, none on the logo and none landed; `rest` ten gems and ten labels with no veil and no hairline wordmark over them. Commit the new frames on the default. Unblocks criterion 6, B1, D1 and F1.

Time taken: about five minutes.

## Iteration 2, 2026-11-03: PASS

Three-minute re-grade of the re-taken frames on the owner's word; iteration 1's other items stand.

### The frames, read first

Each of the twelve opened (the phone frames 390 x 844, the laptop frames 1280 x 800); the top strip of `hero-r4-390-flight.png` enlarged four times in a scratch copy outside the repository. Nothing re-run.

- `hero-r4-390-pull-end.png`: the logo pulled back and whole, small at the centre over the moon's terrain under the night sky; the countdown at the bottom left; the logotype and Menu; no loader.
- `hero-r4-390-wipe-mid.png`: the logo whole with every block on it at the centre, the fog rising over the lower half and the sky streaked above; no loader.
- `hero-r4-390-flight.png`: ten blocks in the air over the fog in the ten families' shades, in a staggered column above their slots; no logo on screen, no gem, no label; Frosty White shows only its lower corner at the top edge (confirmed in the enlarged strip), the rest of it above the frame.
- `hero-r4-390-rest.png`: ten gems in a staggered column, each with its label, Frosty White to Roaring Red in order; no veil and no hairline wordmark over them; Menu on the logotype's row.
- `hero-r4-390-wipe2-mid.png`: the second wipe's middle: the upper five gems dithered as they are cut away, Basic Brown a ghost, the lower four gone to the fog; no labels.
- `hero-r4-390-quiz.png`: the quiz intro on the fog in the label type, its heading, standfirst, Click to begin and Skip quiz underlined, in the lower half of the screen; Menu.
- `hero-r4-1280-pull-end.png`: the logo pulled back and whole at the centre over the terrain; the countdown at the bottom left, its numerals caught in a glitch burst (E-CD-glitch); the section index with Home underlined; no loader.
- `hero-r4-1280-wipe-mid.png`: the logo whole with every block on it as the fog rises through the terrain's rocks and the sky streaks above; Families underlined; no loader.
- `hero-r4-1280-flight.png`: ten blocks in the air across the upper third in the ten shades; no logo on screen, no gem, no label; Playful Pink cut by the top edge, Frosty White passing under the logotype and Mellow Yellow under Families and Quiz, the words still legible.
- `hero-r4-1280-rest.png`: ten gems in two rows of five, each with its label on a leader line, Frosty White to Roaring Red in order; no veil and no hairline wordmark; Families underlined.
- `hero-r4-1280-wipe2-mid.png`: the second wipe's middle: Playful Pink and Vivid Violet still whole with dithered edges, Frosty White, Blissful Blue and Mellow Yellow smeared and dithered, Go Green and Roaring Red ghosts at the right, Basic Brown, Blushing Coral and Stormy Grey gone to the fog; no labels.
- `hero-r4-1280-quiz.png`: the quiz intro on the fog left of centre, a rose and a lavender hue patch in the fog near the top (E-fog-hue); Quiz underlined.

### The four items

- Criterion 6 (section-2.md 14.7, "Frames (B1, D1)") PASS: all twelve files at 390 x 844 and 1280 x 800; `pull-end` and `wipe-mid` the logo whole with its blocks; `flight` every block in the air at both widths, none on the logo (no logo left on screen) and none landed (blocks, no gem, no label), at 390 with Frosty White's corner at the top edge; `rest` ten gems and ten labels at both widths; `wipe2-mid` the gems cut away towards the fog with the labels off; `quiz` the quiz's intro.
- B1 PASS: rendered and captured at 390 and 1280, the same six states at each, all in `docs/specs/screenshots/`; the 390 set is as strong as the 1280 set, the rest's ten labels in full with no overflow and none clipped, the quiz intro legible.
- D1 PASS: no frame shows the loader, its percent or its hairline wordmark; `hero-r4-390-rest.png` and `hero-r4-1280-rest.png` show the ten gems and ten labels in full with no veil, and the quiz intro is up at 6.75 at both widths.
- F1 PASS: the acceptance criteria of 14.7 are each met: 1 to 5 and 7 to 9 stand as PASS from iteration 1, and 6 passes above; the real shades are on screen in every scene frame, the ten blocks and the ten gems in the families' shades, each gem named.

### Verdict: PASS

Criterion 6, B1, D1 and F1 pass on the re-taken frames, which clears iteration 1's one numbered item. Iteration 1's other items stand as graded there, E1 and E2 blocked (the tools are not installed here), not counted against the round.

The round landed on the default at ec7d5a3 before iteration 1, so the re-taken frames and the script fix (`scripts/hero/frames-r4.mjs`, which now waits for `#intro`, the loader, to leave the DOM) land as a follow-up commit.

## Iteration 3, 2026-11-03: FAIL

Five-minute review of round 5 on the owner's word, graded from the hand-off's measurements and the frames; nothing re-run.

Round 5, `docs/specs/section-2.md` section 15: half the world's travel at the old speed. Source read: `git diff 3dabb60 bb104ab -- src/config/hero.ts src/scripts/hero/camera/rig.ts src/styles/shell.css`, the rest of the round's diff (`scrollMap.ts` and `section4/layout.ts` comments, the tests, `frames-r4.mjs`) and the stat. Frames opened: ten of the twelve `hero-r5-*` (390: pull-end, wipe-mid, flight, rest, wipe2-mid, quiz; 1280: pull-end, wipe-mid, flight, rest), with `hero-r4-390-pull-end.png` for the comparison.

### Checklist
- A1 PASS. The source diff changes two constants' values, adds `PROTO_MAP`, `CAM_TRAVEL` and `CAM_DRIFT`, one expression in `camCurve`, comments and the track's height literal: no colour, gradient or glow (rules 1, 2, 21, 42), type (4, 18, 19, 30), copy (16, 17, 29, 35), shadow (25), radius (39), icon (10, 22, 44, 45), glass (6, 28) or hover (14, 48) change; no em or en dash in the diff (searched: none). The frames show only the approved exceptions (E-1/21/40, E-13/42, E-24).
- A2 PASS. No colour added; the gems and blocks in the families' shades by id, the scene's light as E-A2 and E-A2b.
- A3 PASS. No type change; the countdown's and labels' Plex capitals are E-chrome-font and E-S2-font from the default, untouched.
- A4 PASS. No copy change; the new comments carry no em or en dash and no buzzword.
- A5 PASS. The logo's ten blocks, the ten gems in their shades and the ten family names (rest frames at both widths).
- B1 PASS. Twelve frames at 390 x 844 and 1280 x 800, taken with the loader gone; ten opened, each as expected (below).
- B2 PASS. No layout width changed; no overflow in the 390 frames; the countdown and the quiz's lines on the 16 px gutter.
- B3 PASS. No link or storage change.
- B4 PASS. `.track` 750svh, static, nothing in dvh.
- C1 PASS. Every budget line ok; the island chunk 57.0 KB gz, under 60. The round adds two small constants and one changed expression, far under 0.1 KB gz; the 0.4 KB over round 4's 56.6 is the base default's (the hall removal's chunking), not the round's, read from the diff.
- C2 PASS. No image added to the page.
- C3 PASS. The one island under E-C3 and E-S3-bg; the round changes the camera's road parameter only; no layout property animated.
- C4 PASS. Lighthouse mobile on the poster tier, the median of three on a quiet machine: 99, LCP 1.84 s (99 / 1843 ms, 99 / 1842 ms, 100 / 1532 ms). Graded from the median, as the brief says; the single run of 95 with an LCP of 2.6 s right after the SwiftShader suites is the machine's load. The LCP line (2.5 s) holds at 1.84 s.
- D1 PASS. Nothing new waits at opacity 0; at rest (5.25) ten gems and ten labels, no loader, no veil.
- D2 PASS. Reduced motion unchanged (s = 0 holds the hero pose); `v11-frames.spec.ts` grades the fog, the labels and the ride at both widths at the dither floor.
- D3 PASS. No data, input or new state.
- D4 PASS. Hover and press untouched (15.8).
- E1 BLOCKED. `/web-design-guidelines` is not installed here; never PASS. In its place, my own by-eye pass of the 390 frames: pull-end the logo whole over the moon terrain with the countdown, nearer and larger than round 4's and left of centre (the camera at x +4.26 looks at 0.45 x), the owner's composition to judge (15.9); wipe-mid the logo whole over the cut; flight all ten blocks in the air, none on the logo, none landed; rest ten gems and ten labels, no loader, no veil; wipe2-mid the gems cut away; quiz the intro at rest. No new finding from the round.
- E2 BLOCKED. `visual-critique:critique-screen` is not installed here; the by-eye pass under E1 stands in for it.
- E3 PASS. No markup, control or focus change; the contrast items pending Sam stand against their defaults (below).
- E4 PASS. Nothing writes data.
- E5 PASS. No schema touched.
- F1 FAIL. Criteria 1 to 7 met; criterion 8 not (below).
- F2 PASS. No TODO, placeholder, lorem ipsum or commented-out code in the diff.

### Acceptance criteria (15.7)
1. PASS. `S2T` PULL 2.5, WIPE 1, CAS0 3.0, FLY 1.8, W1END 3.5, LAND 4.8, W2 5.5, W2END 6.5, no GAP (hand-off, unit test); `TRACK_SVH` = round((6.5 + 1) x 100) = 750 and `shell.css` reads 750svh (diff); 6.5 is under half of 16.2.
2. PASS. `CAM_TRAVEL` = 2.5 / 5 = 0.5 and `CAM_DRIFT` = 2.3 / 9.5 = 0.2421 from `PROTO_MAP` (diff, unit test); `camCurve` takes v = CAM_TRAVEL x s + CAM_DRIFT x u2 (diff); the live pull-back parity at seven pairs, exact at 0 and at the pull-end [4.2636, -1.75, 34], the rest within 1e-4.
3. PASS. `__s2().L` [0 x10] at 2.5 and 3.0, [0.5 x10] at 3.9, [1 x10] at 5.25, 6.0 and 7.5 at both widths; the flight frames show ten in the air (4.8 itself not sampled; LAND 4.8 asserted by the unit test).
4. PASS. Unit page-scroll, site-nav and return-path pass; e2e island, site-nav and to-top 29 of 29, the quiz gate's AC1 and AC6 1 of 1, room 11 of 11 on the GPU harness (the e2e on the build before the About landing was merged in).
5. PASS. `v11-frames.spec.ts` at 390: the wipe's end 43.781 dB against a floor of 43.779 and the mid-wipe 46.658 against 46.656; at 1280: 42.389 against 42.392 and 45.31 against 45.31; labels and the ride equal on every pair.
6. PASS. The twelve frames exist with the loader gone; the ten opened match: pull-end nearer than round 4's (the logo about 150 px wide at 390 against round 4's 120), wipe-mid the logo with its blocks under the cut, flight the ten in the air, rest the ten gems and labels, wipe2-mid the gems cut away, quiz the intro.
7. PASS. Every budget line ok; total JS 235.7 KB gz, under the 243.2 ceiling (15.6 "243.2 KB gz or under"; the drop is the base default's hall removal); Lighthouse 99 on the poster tier at the median.
8. FAIL. CLAUDE.md (the Section 3 line reads "5.5 to 6.5 screens since 2026-11-03"), hero.md 12.9 and the other docs carry the new map, and the diff has no em or en dash or emoji; but the record states the pull-end camera at "about +3.4" in x (`src/config/hero.ts` line 54, the `CAMX` comment; `docs/specs/section-2.md` 15.2 and 15.9; `docs/specs/hero.md` 12.9's table, line 632), where `camX(0.5)` is +4.26 under the quintic ease `camX` uses (`rig.ts`: t x t x t x (t x (6t - 15) + 10)), as the hand-off's own pull-back parity reads (x 4.2636 at the pull-end on both pages). The figure the owner reads to judge the pull-end composition is wrong by 0.86 units.

### Blast radius
`graphify affected "camCurve"`: `hero-math.test.ts` (changed, in the hand-off) and three historical doc sections (hero.md 12.1 and 12.5, hero-architecture.md 17.3, references only). `graphify affected "S2T"`: `rig.ts`, `scrollMap.ts` and the four unit and family tests are in the hand-off; `hero/hero.ts`, `gems.ts`, `section3/ground.ts`, `nav-map.ts`, `types.ts`, `moon.ts`, `boot.ts`, `loop.ts`, `ride.ts` and `director.ts` read `S2T` by name and are unchanged in the diff, covered by the suites run; `hover.spec.ts` reads `S2T` too, unchanged and listed as not run; `SiteNav.astro` and `site-nav.ts` changed by the About landings, not the round. Out-of-scope code (15.8) touched only in a comment (`section4/layout.ts`, a figure). PASS.

### Pending Sam, graded against their defaults
- E-C4: Lighthouse graded on the poster tier (the default), 99 at the median. PASS against the default.
- E-2.2.2: the scene and countdown with no pause control, unchanged by the round. Graded against its default, not as FAIL.
- The reduced-motion tier: unchanged (the still3d tier, s = 0 on the hero pose), graded against its default, not as FAIL.
- E-cue-text's contrast and E-NAV-contrast: the fog's tone unchanged; the cue reads `S2T`, so its read positions moved with the map and its spec's figures are the cue's to re-read. Graded against their defaults, not as FAIL.

### Verdict: FAIL

1. Correct the pull-end x figure in the record: write +4.26 (`camX(0.5)`, the quintic ease of `rig.ts` camX, read live as 4.2636 by `tests/parity/pullback.spec.ts`) for "about +3.4" in `src/config/hero.ts` line 54 (the `CAMX` comment), `docs/specs/section-2.md` 15.2 and 15.9, and `docs/specs/hero.md` 12.9 (line 632), and drop 15.2's "the weave's middle" (x +4.26 is 0.86 of the way from -6 to +6, not its middle). Unblocks criterion 8 and F1. A comment and docs change only; the code and the frames are right. At the time of this review an uncommitted edit in the worktree, not this review's, already writes +4.26 in 15.9; the other three places still read +3.4.

The round landed on the default at bb104ab before this review on the owner's word, so this item is a follow-up on the default, not a block. E1 and E2 are blocked (the tools are not installed here) and not counted against the round.

## Iteration 4, 2026-11-03: PASS

Two-minute re-grade of iteration 3's one item on the owner's word; iteration 3's other items stand.

Read only, nothing re-run (no build, test or frame): `git diff` of the three files iteration 3 named (an uncommitted edit in the worktree, five lines, 5 insertions and 5 deletions), the matching lines with their headings, the `CAMX` table in `src/config/hero.ts`, `camX` in `src/scripts/hero/camera/rig.ts` (lines 35 to 39) and the one evaluation below.

### The four places
1. `src/config/hero.ts` line 54, the `CAMX` comment: gives +4.26 ("camX(0.5) on the quintic ease between the keys at 0.25 and 0.6"). PASS.
2. `docs/specs/section-2.md` 15.2, the pull-back bullet (line 207): gives +4.26 ("camX(0.5) on the quintic ease between the keys at 0.25 and 0.6, read live by the pull-back parity"); "the weave's middle" is gone. PASS.
3. `docs/specs/section-2.md` 15.9, the last bullet (line 244): gives "x +4.26 at v 0.5, measured". PASS.
4. `docs/specs/hero.md` 12.9, the table's first row (line 632): gives "x +4.26, camX(0.5)". PASS.

Searches over the three files: `+3.4` matches nothing and neither does "the weave's middle" (the word-level diff shows "about +3.4" replaced in all four places and "the weave's middle" dropped from 15.2). A wider search for `3.4` finds only unrelated figures in `hero.md` (Speed Index limits of 3.4 s at lines 306, 436 and 490, an AVIF size of 33.4 KB at line 601), none an x position; `hero.ts` and `section-2.md` have no `3.4` at all.

### The evaluation
The keys are `CAMX` as shipped, [0, 0], [0.25, -6], [0.6, 6], [1, -3], [1.5, -5.25], [2, -1.5], and the interpolation is `camX` as shipped: x0 + (x1 - x0) x s between the keys either side of v, with t = (v - v0) / (v1 - v0) and s = t x t x t x (t x (6t - 15) + 10). At v = 0.5, the pull-back's end (`CAM_TRAVEL` 0.5 at s = 1):

```
node -e "const K=[[0,0],[0.25,-6],[0.6,6],[1,-3],[1.5,-5.25],[2,-1.5]];const v=0.5;for(let i=1;i<K.length;i++)if(v<=K[i][0]){const [v0,x0]=K[i-1],[v1,x1]=K[i],t=(v-v0)/(v1-v0);console.log(x0+(x1-x0)*t*t*t*(t*(t*6-15)+10));break}"
4.263580650919257
```

That is +4.26 to two decimal places, the 4.2636 the pull-back parity read live in iteration 3. By hand: t = 0.25 / 0.35 = 0.7143, s = 0.8553, x = -6 + 12 x 0.8553 = 4.2636.

### Verdict: PASS
Criterion 8 PASS and F1 PASS. All four places read +4.26, nothing in the three files reads +3.4 or calls the pull-end the weave's middle, and the figure is the one `camX` returns. Criteria 1 to 7 and the checklist's other items stand as iteration 3 graded them; E1 and E2 stay blocked (the tools are not installed here) and are not counted against the round.

The round landed on the default at bb104ab before iteration 3, on the owner's word, so the corrected record (the five-line edit, uncommitted in the worktree when graded) lands as a follow-up commit on the default, not as part of the round's merge.

### Noted, not graded
- The edit changes one more line than the four places: `hero.md` 12.9's introduction (line 628) gains a sentence recording the owner's approval of the pull-end frames, and 15.9's last bullet (line 244) gains the same, with "is" turned to "was". It quotes the owner and cannot be checked against his message from the files read here; it changes no figure and is not iteration 3's item.
- "mid-weave" stays in 12.9 (the new sentence and the first row) and in 15.9. In the first row and in 15.9 the figure sits beside it. It means midway along the pull-back's road (v 0.5), not the swing's middle, none of the three puts x near 0, and iteration 3 asked to drop only 15.2's "the weave's middle".
- `src/config/hero.ts` line 54's second sentence still says "smoothstep between them", as the comment on `camX` in `rig.ts` (line 34) does, where the code is the quintic. Wording only, unchanged by the edit; left for the next touch of those comments.
