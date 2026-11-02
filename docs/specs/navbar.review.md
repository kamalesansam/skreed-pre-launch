# The section index: review log

## Iteration 1, 2026-11-02

**Verdict: FAIL** (6 items, below).

**What this rests on.** The six frames in `docs/specs/screenshots/navbar-*.png`, looked at first. The working tree's diff and the new files read in full. My own runs against the worktree's dev server (127.0.0.1:4323), headless Playwright in the installed Chrome: the poster tier at 390 x 844 and 1280 x 800 (keyboard paths, the panel, reduced motion, Skip quiz); the 3D path on the real GPU at 1280 x 800 and 390 x 844 (pointer presses by coordinates with a frame-by-frame record of the veil and the scroll, keyboard presses by Tab, Skip quiz's ride in the same run, and the bar's contrast with the bar hidden and the ground under each word's text box sampled, two or three runs per screen). `node --test tests/unit/site-nav.test.ts` 8 of 8; `npm run test:unit` 207 pass, 1 skipped; `npm run test:family` 64 of 64; `tests/e2e/site-nav.spec.ts` and `tests/e2e/to-top.spec.ts` (15 of 16, below); the changed test in `tests/e2e/room.spec.ts` (passes, 57 s); `tests/e2e/countdown.spec.ts` "AC4.6 at zero" (fails, below). Not run: the parity suite (needs `python3`, absent on this machine), a production build, `budget.mjs`, Lighthouse.

### CHECKLIST

| Item | Grade | Evidence |
|---|---|---|
| A1 | PASS | Diff scanned against rules 1 to 50: no gradient (1, 2, 21); no emoji (3, 27); Open Sans only, by `--font-ui`, at 14 and 16 px (4, 18, 19, 30); no coloured border or stripe, the hairlines are Urban Slate (5, 31); no blur or glass (6, 28); no badge (9); words, no icon (10, 22, 44, 45); hover lift, press scale and underline, never opacity (14, 48); spacing by `--s2`, `--s4` and `--inset`, the 44 and 56 px rows as Back to top and the family switcher have them (15); no em dash in copy (16, 29); plain words (17, 35); Pearl Whisper, Urban Slate and Ember Luxe only, no shade colour (23, 24, 40, 49, 50); no `box-shadow` (25); square (39). The veil is Back to top's existing press fade. The bar's contrast is graded under E3. |
| A2 | PASS | Pearl Whisper, Urban Slate, Ember Luxe for the ring and `--night` for the existing veil (E-A2), all by token; no new colour. |
| A3 | PASS | Open Sans 600 at `--fs-label` in the bar; Open Sans 400 and 600 at `--fs-button` and 1rem in the panel; no italic; nothing under 12 px. |
| A4 | PASS | "Sections", "Menu", "Close", "Home", "Families", "Quiz", "Products": the brief's and the switcher's own words; the unit test checks dashes and emoji. |
| A5 | n/a | The index is chrome over the four sections, which show the gems, the swatches and the products; it adds no section of its own. |
| B1 | PASS | Six frames at 390 and 1280 on the 3D path, the panel, the families jump and no JavaScript; my own frames at both widths on both tiers. |
| B2 | PASS | The e2e rows at 360, 390, 430, 768, 1024 and 1280 pass: no horizontal scroll, every hit 44 x 44 or more (Menu 62.8 x 44, rows 358 x 57, Close 65.4 x 44), the last word's text on `--inset` (16 px at 390). |
| B3 | PASS | Fragment links only; no `localStorage`; `sessionStorage` only in `to-top.ts`, inside try; a browser without the popover gets the four words in a row (`@supports not selector(:popover-open)`). |
| B4 | PASS | The panel's `max-height: 100svh`; nothing animated in `dvh`. |
| C1 | PASS | My measure (esbuild, minified, gzip 9): `site-nav.ts` with `veil.ts` and `nav-map.ts` 1.59 KB gz, 1.74 KB with `track.ts`, `motion.ts` and `config/hero.ts` (already on the page); `site-nav.css` 1.18 KB gz minified. Under the spec's 3 KB and 2 KB; it is a component script of its own. The page's critical JS was 15.5 KB at the last recorded production run (family-page review). No production `budget.mjs` run in this worktree. |
| C2 | n/a | No image. |
| C3 | PASS | The veil's opacity (Web Animations), the hover `translateY`, the press `scale`; a jump is one instant `scrollTo` (one scroll write in the frame record). |
| C4 | FAIL | No Lighthouse number for the page with the index (item 5). |
| D1 | PASS | After the intro the index is there at rest on every screen: frames of the hero, section 2, the quiz, the hall and all five scenes at 1280, and the hero, section 2, the quiz, the hall and scenes 1 to 3 at 390. Inert under the loader (a body child before the countdown's `inert(true)` call) and hidden under the intro (`html.uh1`), as the logotype. |
| D2 | PASS | Reduced motion on the poster tier: the veil never unhides across a jump, `.snav-a` `transition-duration: 0s`, no lift or scale. |
| D3 | PASS | Loading (inert, then hidden with the logotype), no JavaScript (fragment links, a second row under 768 px), no popover (the same row), no island (a plain instant scroll) are designed; there is no data or input otherwise. The press lost during the veil's lift is item 4. |
| D4 | PASS | Hover and press on the words, Menu, Close and the rows only (`site-nav.css` 18 to 23 and 47), once each. |
| E1 | BLOCKED | `web-design-guidelines` is not installed on this machine (not in `~/.claude/skills`, the project's `.claude/skills` or an installed plugin). Not a PASS. |
| E2 | BLOCKED | `visual-critique` is not installed; the critique below stands in for it. Not a PASS. |
| E3 | FAIL | Holds: a `nav` named "Sections", `ol` and real links and buttons, `aria-current="location"`, the two-tone ring, Escape closing the panel with focus back on Menu, the panel's words 9.9:1. Fails: the bar's words read under 4.5:1 over the fog, the hall and two scenes (item 1), and a keyboard press on Products leaves focus on `body` (item 2). |
| E4 | n/a | Writes nothing; `track('nav')` queues on the window. |
| E5 | n/a | No database. |
| F1 | FAIL | AC6 and AC10 fail (below). |
| F2 | PASS | No TODO, placeholder, lorem or commented-out code in the new or changed `src/` files (grep). |
| G, H | not graded | Page-level and data rows. G22's "sticky section index" now exists, with four sections and no numbers, as the spec decided. |

### Acceptance criteria

| AC | Grade | Evidence |
|---|---|---|
| 1 | PASS | Colours, type, no fill, blur, shadow, icon or radius: CSS and the e2e row "the bar has no fill, box or shadow, and takes the logotype's tone" (passes). |
| 2 | PASS | The six width rows of `site-nav.spec.ts` pass: on the logotype's row within 1.5 px, clear of it, 44 px hits, the last word's text on `--inset`, no horizontal scroll. |
| 3 | PASS | In every frame I took after the intro (D1), fixed while the page moves under it. |
| 4 | PASS | 3D path, both widths, pointer presses: the veil is up 25 to 115 ms after the press, the one scroll write lands at 280 to 360 ms, the last veil frame is at 547 to 734 ms. Families 11600 and 12238 (14.5 screens at 800 and 844), Quiz 13760 and 14517 (section#find's top), Products 15360 and 16205, the same as Skip quiz's own landing in the same run (the hall, q 1), Home 0; unchanged 2.5 to 8 s later, so the glue does not move them. Poster tier: Quiz on find's top, Families centred, Products on section 4's top, Home 0, under the veil; no veil under reduced motion. Home is Back to top's jump (the three landing rows of `to-top.spec.ts` pass; `#toTop` count 0, `#toTopVeil` count 1). |
| 5 | PASS | Locked: Products has no box in the bar or the panel on either tier, and the panel's accessibility snapshot lists three links. After a real press on Skip quiz it shows without a reload, on both tiers. |
| 6 | FAIL | Holds: the labelled `nav`, `aria-current`, the ring, Escape to Menu, and focus after a keyboard press onto the logotype, Frosty White's link (its box over the gem on the 3D path), "Click to begin", and the prompt on the poster tier. Fails: on the 3D path a keyboard press on Products (the bar at 1280, the panel's row at 390) leaves focus on `body`, 2 of 2 (item 2). |
| 7 | PASS | `site-nav.css`: lift, scale and underline only; no opacity on any state. |
| 8 | PASS | C1's figures; no change to the boot script. |
| 9 | PASS | The two "without JavaScript" rows pass (360 and 1280); the 390 frame shows the four words in the second row. |
| 10 | FAIL | Unit 8 of 8 and `test:unit` green; `to-top.spec.ts` 5 of 5; `site-nav.spec.ts` 10 of 11: "laptop: each word lands on its section on the poster tier" fails 4 of 4 here (item 4). |

### Blast radius

- `graphify affected "to-top.ts"`: `BackToTop.astro`, `index.astro`, `[family].astro` (and docs). The first two are changed; `[family].astro` is reached through `BackToTop.astro` (`graphify path`, 2 hops), whose family branch only moves `hidden = false` into the script; the two family rows of `to-top.spec.ts` pass.
- `graphify affected "src/scripts/hero/hero.ts"`: `boot.ts`, `HeroStage.astro`; the new hook is additive.
- `window.__skreedTop` (no graph node; grep): `hero.ts`, `to-top.ts`, `site-nav.ts`, `scripts/room/step-frames.mjs` (unchanged, still valid).
- The rest positions against `hero.ts`'s glue spans and `gate.ts`'s `rideTarget`: Families (14.5 screens) is outside span 1 (5 to 6 screens) and before span 2's start (the smaller of 15.2 screens and the quiz's top less a screen); Quiz is span 2's end; Products is span 3's end, `rideTarget`'s formula with the same poster test. Measured: no glue move after any jump.
- The quiz gate: Products is never rendered while locked, and a locked press could not land anywhere but 0 (NaN is clamped).
- `graphify affected "canvas.ts"`: `tests/parity/noise-floor.spec.ts`, `rest.spec.ts`, `v11-frames.spec.ts`, `scripts/hero/render-poster.mjs`: their overlay list does not know the index (item 3b).
- grep `#toTop` in `src/`, `tests/`, `scripts/`: `tests/family/*` (family pages, fine); `scripts/room/contrast.mjs` and `scripts/room/product-check.mjs` hide the landing page's `#toTop` that no longer exists (item 3c).
- The tab order: `tests/e2e/countdown.spec.ts` "AC4.6 at zero" assumed the skreed.com link is the second Tab stop (item 3a). The cue-logotype, a11y-breakpoints and loader specs Tab once to the logotype or run under the loader's inert, which covers the index; fine.
- `tests/e2e/room.spec.ts`, the changed line: the 390 test passes here.

### Visual critique at 390 (in place of E2)

- Hero: Menu sits on the logotype's row, its text ending on the 16 px inset, Pearl Whisper on the night sky (18.5:1). It reads light beside the wordmark (14 px words against a 23 px mark), as "All families" does on a family page; the hero's composition is untouched.
- Panel: the family switcher's idiom on Pearl Whisper, which answers "not black". The current row is marked by weight alone (Home at 600, the rest at 400), which is subtle at 16 px. The panel ends on two parallel rules, the last row's hairline and the panel's own 24 px under it. The frame was taken with the gate open (`?room=open`), so a first visit's three-row panel is not shown.
- Families: the logotype and Menu turn Urban Slate on the fog; legible, but faint (3.8 to 4.5:1, item 1).
- No JavaScript: the four words make a right-aligned second row under the logotype, a clean two-row header.
- At 1280 (for completeness): the four 14 px words sit far right against a 136 px logotype; in the palace scene "Home" and "Families" sit on the lit ceiling disc and are hard to read (item 1).

### Items to fix, most important first

1. **E3, the bar's contrast.** Measured on the 3D path (the bar hidden, the ground under each word's text box sampled, median per word, two or three runs; the fog drifts). At 1280 x 800: Urban Slate on section 2's fog at rest 2.2 to 4.1:1 and on the quiz's fog 3.0 to 4.1:1 (a first run read 3.8 to 4.7 and 4.9 to 6.2); Pearl Whisper over the hall at Products' rest 2.8 to 2.9:1 for Home and 3.9 to 4.3:1 for Families; over scene 4 (the palace) 2.6:1 for Home and 4.2:1 for Families; over scene 1 4.2:1 for Home. At 390 x 844: Menu in Urban Slate 3.8 to 4.5:1 on section 2's fog and 3.1 to 3.9:1 on the quiz's. AA for 14 px text at 600 is 4.5:1. The words copy the logotype's tone, which is decided for the logotype's box at the top left (`glitch.ts` `setTone`, `ROOM_SCENES` `toneDark` from `scene-tone.mjs`), not for the top right, and on the mid-grey fog neither neutral reaches 4.5:1. No exception covers the index: E-S3-contrast is section 3's text only, and DESIGN.md's below-AA line for the old Back to top was an open item, not an approval. Change: make every word read 4.5:1 or better at every rest and in every scene at 390 and 1280 (for example a tone decided under the index's own box, and a ground behind the words where neither neutral reaches it), or write the below-AA reading as a pending exception for Sam (spec section 10 and CLAUDE.md's pending list) with these figures and an AA default, so E3 is graded against that default. Either way record the measured figures in `navbar.md` and in DESIGN.md's Section index entry, which has no Contrast line. Unblocks E3.
2. **AC6, focus after a keyboard press on Products (3D path).** The page lands on q 1, but focus ends on `body`, not `#rmPad`, at 1280 (the bar) and at 390 (the panel's row). `site-nav.ts` focuses the pad inside the veiled run right after `__skreedJump`, whose `ctx.room?.reset()` runs `resetLap` (`director.ts` 316: `jumped = true`); the island's next frame carries `jumped` (595), and `walk.ts` `newLap()` then blurs any focus inside `#room` (line 340). Change: move the focus after the section's new lap has run (for example after the veil's lift, or a frame after the jump), or do not reset section 4 when the jump's target is inside it; add a 3D-path keyboard row for Products to `site-nav.spec.ts` (the poster rows cannot see this). Unblocks AC6, E3, F1.
3. **Dependents the index breaks, none in the spec's Touches.**
   a. `tests/e2e/countdown.spec.ts` 169 to 171 ("AC4.6 at zero: the link two-tone focus ring over the poster") press Tab twice and expect the skreed.com link; the second Tab now lands on Menu. Fails here: `#cdEyebrow a:focus-visible` is false. Tab past the index (one more stop at 390, three at 1280 while locked) or focus the link directly.
   b. The index is missing from the overlay lists of the canvas-only and overlay captures: `OVERLAYS` in `tests/harness/canvas.ts` (used by `tests/parity/rest.spec.ts`, `noise-floor.spec.ts`, `v11-frames.spec.ts` and `scripts/hero/render-poster.mjs` through `captureStage`) and the `HIDE` strings of `tests/parity/overlay.spec.ts` and `tests/parity/v11-cue.spec.ts`. The index is visible at rest in the first screen (Back to top was hidden there), so overlay.spec's AC1.3 "identical to the prototype" cannot hold at either width, and the canvas captures and the poster render take the words in. Add `#siteNav` and `#site-sections` to each list. Found by reading; the parity suite cannot run here (no `python3`).
   c. `scripts/room/contrast.mjs` 40 and 41 and `scripts/room/product-check.mjs` 98 hide the landing page's `#toTop`, which is no longer drawn, and not the index, which now stands in their frames; `scripts/room/render-stills.mjs` 144 hides the logotype for the shipped hall stills but not the index, so the next render would print the four words into `hall-*.avif` and `.webp`. Put the index in place of `#toTop` in the first two and add it to the third.
   Unblocks the blast-radius step and F1.
4. **AC10, `site-nav.spec.ts` "laptop: each word lands on its section on the poster tier" fails 4 of 4 here.** Run 1: the Families press came while the Quiz jump's veil was still lifting and `veil.ts`'s `busy` guard dropped it (no jump, focus left on the word, the centre 482.5 px off). Runs 2 to 4: line 64 reads `fam` straight after the click, before the veiled jump, so line 66 (`fam > 0`) gets -82.6. Change: read `fam` after the poll; and either wait in the test for `#toTopVeil` to be hidden before the next press, or let a press during the lift start the next jump instead of being dropped. If the drop stays, say so in the spec's states, since today a press in that window is lost with no response. Unblocks AC10, F1.
5. **C4, Lighthouse.** Run Lighthouse mobile on a production build (the poster tier, as E-C4) and paste the performance score into `navbar.md`, with `budget.mjs`'s critical and total JS lines from the same build. Unblocks C4.
6. **Docs that do not match the build.** DESIGN.md's Section index entry says a keyboard press on Products focuses the hall's pad (not true until item 2) and has no Contrast line (item 1); Back to top's Contrast line still gives the landing page's fog and hall figures, though the control is now on family pages only, Pearl Whisper on the dark ground. `tests/unit/site-nav.test.ts` still calls the fourth item "Universe" in its header (c) and in a test title, though the brief renamed it "Products". Unblocks F1.

### Notes for the owner (not graded)

- "flex it throughout the navbar" is read as 24 px between the hits at the top right; if the brief meant the words spread across the bar's width, that is the owner's call.
- The phone's panel is Pearl Whisper, the palette's light neutral, for "bright grey or something", and the opener is the word "Menu" where the brief says "hamburger" (D4 gives the reasons).
- With the panel open there are two navigation landmarks named "Sections".
- Where `:has()` is missing (Firefox before 121, Safari before 15.4) Products would show while locked and lead to the top; never past the gate.
- Not this change: on the poster tier, a back-forward cache miss on a family page's Back to top lands the landing page at its old scroll position (seen: 965 px, the quiz) rather than section 1, because only the 3D path's loader sets manual scroll restoration. The `pageshow` path itself is unchanged by the diff, and the cache cannot be exercised against the dev server.

## Iteration 2, 2026-11-02 (a four-lens review workflow, each serious finding put to an adversarial verifier)

Run against the working tree after iteration 1's fixes and the brief's second round (Products always listed, the phone drawer from the side at 75 percent). Four reviewers (correctness, accessibility, brand and build rules, blast radius and docs), every medium or high finding verified by an agent told to refute it.

**Verdict: FAIL.** Confirmed (7 findings, 4 distinct defects):
1. Every word dead where the browser has no popover API (Safari 16.4 to 16.6, Chrome 111 to 113, Firefox 114 to 124, inside the build's target): `sheet.matches(':popover-open')` threw after `preventDefault()`.
2. A press on Products on the 3D path replayed the third wipe after the veil: `__skreedJump`'s `ctx.room.reset()` put section 4's follower back to q 0 at a landing on q 1.
3. A tap on the strip beside the drawer closed it by light dismiss and also pressed what was under it (an answer, Begin, the logotype): a popover's `::backdrop` takes no pointer.
4. A keyboard press on Quiz mid-quiz left focus where it was: the first candidate with a box was a hidden, inert card's answer.

Refuted (3): a blank wait under the veil (recorded in the spec), CHECKLIST lacking E-NAV-contrast (graded through the spec's AC6), E-QG-lock's wording (recorded in CLAUDE.md line 19). 14 low findings kept unverified: among them the drawer staying open past a widen to 768 px, wheel and touch on the drawer reaching section 4's capture, a press during Skip quiz's hall wait, the restore's lift outside the veil's busy flag, stale comments and docs, `scene-tone.mjs` still measuring Back to top's box, and two weak test assertions.

Fixed by the build: a `POPOVER` test before any popover call and `:focus-visible` in try; `RoomDirector.reset(y)` snapping section 4's followers to the landing; the drawer as a transparent full-screen layer whose own click closes it, with the 75 percent panel inside; focus candidates tried in order (the live question first) until one takes focus; and the low items above (the widen closes the drawer, the drawer's wheel and touch kept from the page, the restore run through `veiled({ covered })`, the docs, the gate's third opener recorded in CLAUDE.md, CHECKLIST, quiz-gate.md and hero-architecture.md, `scene-tone.mjs` measuring the index's boxes, its picks unchanged).

## Iteration 3, 2026-11-02 (one skeptic per fix, then a completeness critic)

**Verdict: FAIL.** The no-popover guard, the strip tap and the quiz focus were confirmed fixed. The wipe fix was not, and added a regression: while the quiz gate hides section 4 the director has no reading (top 0, height 1), so `reset(y)` for a Home, Families or Quiz jump snapped the follower to about 15.8 times y, thousands of screens deep; after Skip quiz the hall was drawn at once with no third wipe and walked by itself for about 3 s. Also: Products on an open section whose hall had not arrived still played the reveal after the lift; residuals on the drawer (pointer events on the strip reaching the gems, the hero's glow and section 4's product turn; the closing layer taking taps for 300 ms; a pinch or Ctrl+wheel prevented; touch listeners registered non-passive), focus on the quiz's result landing off screen, no fallback after the stills' scenes are in, a press during Skip quiz's ride lost, rows with no press state, a covered restore losing `covered` when queued, presses not serialized under reduced motion, and docs drift.

Fixed by the build: `reset(y)` returns before measuring when the section has no reading; Products waits for the hall whether or not it opened the gate; the drawer stops pointer events at the layer, lets the pointer through while it slides out, takes no pan on the strip (`touch-action`), leaves pinches and Ctrl+wheel to the browser and registers its touch listeners passive; the quiz's focus goes to the live question (read out as the deck reads it), else the result's shade name, else Begin; section 4's falls back to the first scene's name; a press during Skip quiz's ride waits for the ride to land or end; the rows press as the bar's words do; `veiled()` queues `covered` and pins the veil at once, serializes jumps under reduced motion too and never leaves the veil up when a jump throws; the docs. New e2e rows: the 3D path with the gate locked (a jump to the quiz, then Skip quiz, the follower never past q 1.05; a keyboard press on Products opening the gate, q 1 after the lift, focus on the pad), a keyboard press on Quiz mid-quiz, a touch tap beside the drawer.

Not reviewed again after these fixes: no reviewer has graded the final state; the e2e and unit suites are its evidence.

## Round 2, 2026-11-03: the index on the About page, its face, the `#room` arrival (branch `claude/about-nav-desktop`)

The owner's words: "if about page had landed, it should also be landed in the navbar, about is not there in the navbar and also use a different font from some of the other new fonts that we added recently for the navbar". Built: the index on `/about/` with no script (AC12), its words in Work Sans Light capitals on both pages (D8, E-NAV-font), and the landing page treating an arrival with `#room` as a press on Products (D7). The builder's measurements, the frames and the suites' results are recorded with the About page's round 2 in `docs/specs/about.review.md`; this suite's figure there: `tests/e2e/site-nav.spec.ts` 26 of 26 on the GPU, the arrival row included.
