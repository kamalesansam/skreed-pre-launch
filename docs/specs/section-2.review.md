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
