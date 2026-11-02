# Section 4, part four: straight into the scenes, no hall (spec)

Written 2026-11-02 from Sam's brief of the same day. Status: the plan for the build loop (`plan`, then `build`, then `review`).

**Sam's brief, verbatim (2026-11-02).** "whatever u have on the default branch, move that to a different branch and create a new branch as the default branch which basically doesnt contain that grey room in section section 4, it directly goes to the product scenes, and make sure u remember this branch well, because i might ask u to go back to this without removing any other changes".

**What this replaces.** The hall (all of `docs/specs/section-4.md`: the corridor, its model, lightmap and stills, the walk, the station, the door, the prompt "[E] Enter Skreed universe", the pad's arrow walk), the press and the bubble (`docs/specs/section-4-world.md` section 2, "The press" and "The bubble", world AC4), and in `docs/specs/section-4-flux.md` everything that leans on them: the entry (the bubble over scene 1, Skip), the way back at scene 1 (the circle shrinking into the hall), the hall's station frame under q 10 to 12.8, the lap reset to the hall, the hall's phase of the loading, and the `hall`, `entering` and `back` states. Everything else in section-4-flux.md stands: the five scenes, their loops, stills, products and lines, the step, the lights, the look, the hold, both seams, the glue, the capture, the video policy, the build modes, Tune's carousel keys, the budget's scene lines.

**Where the hall is kept.** The site as it was, hall and all, is the branch `archive/section-4-grey-room` at 71678ed (the default branch's tip on 2026-11-02, before this part). This part lands as one commit on the new default branch `main`, so the hall comes back with one `git revert` of that commit, which leaves every later change in place.

## 1. Goal

Section 4 starts with the five scenes: the third wipe takes the quiz's fog straight to scene 1 (cove, the phone case in Lilac) and the visitor is in the scenes, with no hall to walk, no door to press and no bubble between. It serves brand goals 1 and 2 (the product, seen sooner, and the 240 shades worn by it).

## 2. Phone-first wireframe in words

### 390 x 844, 3D path

**The approach (q under 1).** The quiz's foot scrolls up and section 4's stage pins (q 0). From q 0 to 1 the third wipe (the composite's ice-shard cut, Tune `handoff` as built) takes the fog away to scene 1 at rest: cove's portrait loop playing, the phone case in Lilac face out in front. No text of the section shows during the approach: the scene's lines and the two words wait for the arrival. Scrolling up runs the wipe backwards into the fog and the quiz.

**The arrival (q 1).** When the raw position reaches scene 1's q (WORLD_START 1, within 2 px) and scene 1 can be drawn (its still or its loop resident; until then the fog and "Loading the scenes..." stand, as they did while the hall loaded, and when scene 1 arrives with the section on screen the wipe plays in over a second and the arrival follows), the section is in `world`: scene 1's four lines decode in one after another ("Phone case", "Lilac, vivid violet", the catalog line, "1 / 5"), "Previous scene" and "Next scene" decode in bottom right, and the first-visit hint "Swipe to the next scene" follows above the count, all as section-4-flux.md 2 builds them. The arrival is always at scene 1, whatever scroll brought the page there: a page the visitor's own scroll carried past scene 1 (a fling from the quiz, a key, the scrollbar, a scroll made while scene 1 was still loading, a reload restored deep) is put back on scene 1's q and held there: an instant `scrollTo` each frame it has run past it, until 150 ms without one, at most 1.2 s after its start or after the latest wheel event of the input that carried the page in (a trackpad's gesture that began before the scenes' capture attached is latched by the browser as one the page cannot cancel, so it scrolls on natively for as long as the fingers and their momentum move: its events never step, and each one holds the page on its scene again, the arrival's hold renewed or begun at the scene's q, short of scene 5, where forward is the page's), ended at once by a new touch, pointer press, key or upward wheel. A held key's auto-repeat is not a new key: it is the key that carried the page in, and it renews the hold as the carrying wheel's events do (the section steps once per keydown and never on a repeat, and prevents a repeat in range, so the repeats move nothing while the smooth scroll the key's presses started runs on and is put back). A finger still down at the arrival defers the hold to its release, when the page goes back to scene 1. The stage is pinned over the whole range, so the scroll's return shows nothing but scene 1 staying; under a hold the scene never re-syncs from the position and the exit seam never fires. The wheel input that carried the page in (a trackpad fling's tail, a wheel still spinning, any wheel event of the last 0.7 s as the scenes' capture attaches) is the page's and is swallowed whole until it has been silent 0.7 s (`BURST.carriedMs`), its later and larger pushes included, so it never steps; the carousel's own bursts keep the reference's 200 ms. A wheel event the other way is the visitor's own: it ends the carried input and begins a burst of its own, so at scene 1 it is the page's at once, whatever the carried burst's peak. A tail that comes in sparsely, as a slow machine coalesces it, is still one input. A snap of the section's own, the glue's settle and the quiz's ride land on scene 1 exactly and the hold changes nothing. The section's DOM chunk (`walk.ts`) mounts once the section is within a screen, so an instant jump to scene 1 (the section index's Products, a fling that beats the import) can fire the arrival's event before it listens: on its first frame in `world` with no scene shown it arrives at the frame's scene, so scene 1 never stands without its lines. The hall's eight screens used to absorb a fling; without them a fling from the quiz would coast through the five scenes into the exit seam, so the arrival holds it (D3).

**Scenes 1 to 5.** As section-4-flux.md 2 builds them: one whole step a gesture, 0.77 s, the arc, the pinch, the lights, the product's half turn and edge-on swap, the look, the hint gone at the first step, the page's q snapped to the scene's at a step's end, the re-sync from the page's position. "Previous scene" at scene 1 is aria-disabled, as "Next scene" is at scene 5.

**Scene 1 and up.** A backward gesture at scene 1 (a wheel up, a swipe down, ArrowUp, PageUp, Shift+Space) is the page's own, as a forward one at scene 5 is: the page scrolls up natively, the section leaves `world` once the raw q is under 1 minus 2 px (the lines and the words wipe out, the carousel set to scene 1 at rest if it was elsewhere, as the scrollbar can leave it), and the wipe runs backwards into the quiz. There is no way back into a hall.

**Scene 5 and the exit.** As built: a forward gesture at scene 5 is the page's, the hold (0.8 screens of dawn at rest), and the exit seam when the raw scroll crosses q 3.8 downward from the scenes (never from the approach, where scene 1 is still loading: a page scrolled on over the fog meanwhile is put back on scene 1 when it arrives): the cloud covers the frame in 280 ms with the scroll held, the page jumps to scroll 0 under full cover, the section returns to the approach with the carousel at scene 1, the cloud thins over the hero in 360 ms, gestures are swallowed 400 ms more. The next lap arrives at scene 1 again through the wipe.

**The top of the page.** As built: the wrap from scroll 0 lands on scene 5 under the cloud (only once the quiz gate has opened the section).

**The glue.** As built, three spans; section 4's span is still the room's top minus one viewport to its top plus one viewport, which is now q minus 1 to q 1, the quiz's foot to scene 1.

**The quiz's ride.** Skip quiz rides the page through the third wipe to section 4's q 1 as built, which is now scene 1. On the 3D path it waits for the scenes (scene 1's still or loop resident and products.bin settled, at most 1.5 s, the control reading "Loading..." meanwhile) where it waited for the hall. A keyboard press lands focus on the pad, as built; on the poster tier on scene 1's name, where it was the prompt.

**Keyboard.** The pad (`#rmPad`, the stage's focusable group, labelled "The five scenes. Use Down and Up to move between them.") is the section's first tab stop. A visitor's keyboard focus on it during the approach (a Tab from the quiz, `:focus-visible`) snaps the page to scene 1, and the arrival moves that focus on to scene 1's name; a click or a tap on the stage focuses the pad without `:focus-visible` and moves nothing. The keys of the scenes stay section4/scroll.ts's alone.

### 390 x 844, poster path and no JavaScript

The column of the five scenes from the section's top: each scene's portrait still (AVIF with its WebP twin, width and height set, lazy) on --night with its four lines under it in Plex Mono capitals, as section-4-flux.md 2 builds it, now without the hall's still or the prompt over it and without a press: the column shows at once. No video, no carousel, no wrap, no glue; the loop end is the 300 ms fade to the top as built. Without JavaScript the noscript copy of the column shows, without its line about the entrance.

### 1280 x 800

The same with the wide set on the 80 degree arc, the hint "Scroll to the next scene" (or "Scroll or press Down to the next scene" after a key), as section-4-flux.md 2's laptop paragraph.

## 3. Content

**Copy.** Every string by id in `ROOM_COPY`. Ids that go with the hall: stageAria, hintTouch, hintKeys, enter, key, loadingRoom, skip, stillHallAlt, noscript. Ids that change:

| Id | Text | Where |
|---|---|---|
| aria | Section 4: the five scenes | `section#room`'s label (was "the entrance to the Skreed world") |
| loading | Loading the scenes... | the stage's loading line while the section is in view and scene 1 cannot be drawn yet (was "Loading the entrance..."); "Still loading..." (id still) after 8 s as built |

Every other id (worldAria, sceneHint*, loadingScene, next, prev, pause, play, scenesTitle, scenesAria, sceneLive, wrapLive, count, clipBlocked, still) as built. The two new texts are flagged for Sam (section 11).

**Scenes, products, shades, loops, stills.** Unchanged: `ROOM_SCENES` and `ROOM_PRODUCTS` (cove with the phone case in Lilac `vivid-violet-05`, grove with the AirPods case in Sage `go-green-09`, ember with the MagSafe wallet in Desert `basic-brown-04`, palace with the Lenskin in Ballerina `playful-pink-06`, dawn with the AirPods Max case in Pastel `vivid-violet-04`), the ten loops and twenty stills in `src/assets/room/flux/`, products.bin.

**What leaves the repository.** The hall's shipped assets (`src/assets/room/hall.bin`, `hall.glb`, `hall.json`, `hall-lightmap.avif` and `.webp`, `stills/hall-portrait` and `hall-wide` in both formats), its modules (`src/scripts/hero/section4/hall.ts`, `assets.ts`, `post.ts`), its build scripts (`scripts/room/hall.py`, `hall-bin.mjs`, `encode.mjs`) and its tests (`tests/unit/hall-bin.test.ts`, `room-bubble.test.ts`, `room-prompt.test.ts`). `transition.ts` keeps only its straight mix, the fog's 'fade' hand-off (Tune `handoff` 2); the bubble and the dissolve go.

## 4. Motion plan

No library (the section stays on the island's own frame loop, as built). What changes against section-4-flux.md 4:

| Trigger | What moves | How |
|---|---|---|
| The raw q from 0 to 1 | the third wipe from the fog to scene 1 | the composite's cut by the followed q, as built for the hall; Tune `handoff` 1 a cut at half, 2 a fade. If scene 1 becomes drawable while the section is on screen past q 0.02, the wipe plays in over 1 s on its own clock (as the hall's did) |
| The raw q reaches 1 (within 2 px) or is past it, scene 1 drawable | the arrival | state `world` at scene 1, its lines decode in (showAll, step 0.12 s), the words decode in, room_scene; the page put back on scene 1 and held (section 2), at the finger's release if one is down |
| The raw q under 1 minus 2 px in `world`, no step running | the departure | state `approach`: the lines and the words wipe out, the carousel set to scene 1 at once if it was elsewhere |
| A backward gesture at scene 1 | nothing captured | the wheel, the touch or the key is left to the page |
| The exit seam's full cover | the reset | the section to `approach`, the carousel at scene 1 at once (Tune `lapReset` goes) |

Gone: the press, the door's swing and dolly, the hall's freeze, the bubble and its dissolve, Skip, the way back, the walk's camera, the head's sway, the arrow walk and the drag.

**Reduced motion** (the still3d tier). The arrival's lines fade in over 0.2 s (the decode's reduced path); the hold is the same instant snap; everything else as section-4-flux.md 4.

**WCAG 2.2.2 and 2.3.1.** Unchanged for the scenes; the bubble's growth check leaves with the bubble. The loops now play from the third wipe on, while scene 1 is on screen under it.

## 5. Data and states

**States.** `section#room[data-state]` is `approach` (the section before the scenes: the raw q under 1 minus 2 px, or the page above the section; the carousel draws scene 1 under the wipe), `world` (the scenes, `data-scene` 0 to 4, `data-step` 1 while a step runs) or `seam` (either seam). `entering`, `back` and `hall` go. The section is rendered with `data-state="approach"`.

**The scroll map**, in screens of the section's height: wipe 1 (q 0 to 1), the scenes from WORLD_START 1 at a step of 0.5 (1, 1.5, 2, 2.5, 3), the hold 0.8 (3 to 3.8), the exit seam at LOOP_START 3.8, the loop screen 1 (3.8 to 4.8), the tail 1 (4.8 to 5.8) and the pinned screen: ROOM_HEIGHT 6.8, `.room .rm-track { height: 680svh; }` (the unit test reads the literal against ROOM_HEIGHT and keeps `loopStart + loop + tail <= ROOM_HEIGHT - 1`). The carousel is in range while the raw q is within 2 px of [1, 3] in `world`.

**Capture**, as section-4-flux.md 5 with two changes: a backward gesture at scene 1 is the page's (the adapter's `back` goes; `edge(-1)` at scene 1 reads as an edge the page takes, as `edge(1)` at scene 5 does), and `lock()` holds for a seam only (no entry, no way back).

**Loading, in phases** (one compile, upload or decode a frame, as built).
- (0) As built: once the intro ends, the director chunk at idle and the cloud's pass, so a wrap from the top has its cover.
- (1) When the quiz or the section comes into view (where the hall loaded): the director chunk, the carousel's programs and environment, scene 1's still.
- (2) Once the section is open (the quiz's unlock, or at once when the visit's flag opened it): products.bin, scene 1's loop and scene 2's still (a step waits on the next scene's still), and the one-shot unlock of the loop elements armed for the visitor's next pointerup, touchend or keydown (no press gives iOS its gesture now; the wrap's rule, section-4-flux.md 5 "Video policy", applied from the start).
- (3) On arrival at scene 1: the other loops one at a time in the order 2, 3, 4, 5, each still before its loop; from any other scene (the hooks) every loop, the nearest first.
- (5) The wrap first: as built.

The section is drawable (`ready`) once scene 1's still or loop is resident; the wipe waits for it. It falls to the poster tier (`data-tier="poster"`, the column) when the director chunk fails, as built, or when both scene 1's still and its loop have failed.

**The bridge.** `RoomFrame` loses x, nearDoor, prompt, worldReady and entry; `ready` and `failed` mean the scenes; `under` is `approach` or `world`. `RoomIsland` keeps snap, step, wrap and motion; enter, skip, back and setHover go. `window.__skreedHall` becomes `window.__skreedScenes` (`ready`, `load()`), the quiz's ride's wait. `__s4` keeps state, scene, step, wrap, glue, lights, shade and ready; enter, seek, back and skip go.

**Outputs.** room_view, room_scene, room_step, room_loop, room_wrap and room_unlock as built; room_walk, room_enter, room_skip and room_back go. The DOM events 'skreed:room-state' (loop, jump, seam, wrap), 'skreed:room-scene' and 'skreed:room-step' as built; entering, unbusy and back go.

**Tune** ("Section 4"): the hall's keys go (eye, fov, lookYaw, lookPitch, keySpeed, mouseLook, exposure, albedo, seams, grain, vignette, corners, bleach, split, noise, gloss, bloom, stationDist, door, seamGlow, promptChip), with bubbleMs and lapReset; handoff and the carousel's keys (stepMs to snapMs) stay with their ranges.

| State | What the visitor sees |
|---|---|
| Empty (scene 1 not drawable yet) | the fog through the approach, the wipe waiting; in view, "Loading the scenes...", "Still loading..." at 8 s |
| Loading | scene 1's still on the plane until its loop is in (300 ms cross-fade), the product when products.bin arrives |
| Error | the director chunk, or both scene 1's still and loop, failed: the poster column; a later loop fails: its still stays |
| No internet | the column if the island never loaded, else the still if decoded |
| Slow network | the stills carry the carousel, loops arrive one by one; a still or a loop that times out (20 s) leaves its scene to the other (a still that failed never fails the stills queued after it), and scene 1 losing both is the Error row |
| Success | the loops play |

## 6. Budget

The lines of section-4-flux.md 6, less the hall. "To the press" becomes "to scene 1" (products.bin, scene 1's loop and still), 2,500 KB; "the whole section in dist" (15,800 KB) and "one visit" (8,100 KB) lose the hall's model, lightmap and stills; the poster tier's pictures line is the five scenes' stills alone, at the same caps. The section's script line (30 KB pending Sam, 38 KB hard) should fall by the hall's modules. No new file ships.

## 7. Acceptance criteria

1. **No hall (A5, rule 38, F2).** `npm run build` ships no hall model, lightmap or still, no `hall.ts`, `assets.ts`, `post.ts` or bubble code, and the page carries no prompt, Skip or door copy; every frame section 4 draws on the 3D path is a scene with its product, and the poster column is the five scenes.
2. **Straight in (B1, D1).** On the 3D path at 390 x 844 and 1280 x 800, from the quiz (opened by `?room=open` or Skip quiz): the third wipe from the fog to scene 1 with cove's loop and the phone case, scene 1's four lines and the two words on arrival at q 1, five scenes by five steps as section-4-flux.md AC1, the hold and the exit seam to the hero, the next lap arriving at scene 1 again; the wrap onto scene 5 from the top. Frames at 390 and 1280.
3. **The arrival hold (D2, E3).** A fling (a trackpad's wheel burst included, whose tail never steps), PageDown or Space pressed or held, a scrollbar move or a finger's drag that carries the page from the approach into or past the scenes' range lands on scene 1 at q 1 and stays there (still 150 ms, at most 1.2 s after its start or the carrying wheel's latest event, a new touch, press, key or upward wheel ending the hold, a held key's repeat never, since it is the carrying key; a finger's at its release); scene 1 arriving late puts a page scrolled on over the fog back on scene 1, with the 1 s reveal; the exit seam never fires from the approach or under a hold; a snap, the glue's settle and the ride land there without a correction.
4. **The edges (D2, E3).** At scene 1 a backward wheel (right after the fling that carried the page in too, whatever that fling's peak), swipe or key scrolls the page up into the wipe (nothing captured) and the section leaves `world`; "Previous scene" is aria-disabled there; at scene 5 forward is the page's as built; the capture never holds the page outside [q 1, q 3] in `world` or during a seam.
5. **The scroll map (B4).** ROOM_HEIGHT 6.8 and `.rm-track` 680svh, the scenes at 1 to 3 by 0.5, the hold to 3.8, LOOP_START 3.8, the pinned-screen invariant; unit tested.
6. **The quiz's ride (QG AC3 and AC4).** Skip quiz on the 3D path waits for the scenes (at most 1.5 s), rides through the third wipe to scene 1 at q 1 in 1.2 s, and a keyboard press lands focus on the pad; on the poster tier the ride lands on the column's top with focus on scene 1's name.
7. **Poster and no JavaScript (D1, D2).** The column of five stills with their lines shows at once from the section's top, no hall still, no prompt, no press; the loop end's fade as built.
8. **Budget and build (C1, C2).** Every enforced line of section 6 holds on `npm run build`, the post-build guard passes, the section's script is smaller than at 71678ed.
9. **Tests (B1).** `npm run test:unit` passes with the hall's, the bubble's and the prompt's tests removed and the map, the capture's edges, the ride's wait and the copy rules updated; `astro check` is clean; the e2e rows for section 4 and the quiz's ride are updated to the new flow.
10. **Nothing else moves (F1).** Sections 1 to 3, the family pages and the quiz's own flow are unchanged; section 4's scenes, step, lights, look, seams, glue and video policy behave as section-4-flux.md specifies.

## 8. Out of scope

New copy beyond the two lines of section 3; the bubble as a new way from the fog into scene 1 (the wavy circle went with the hall it opened over; it could come back as the third wipe's replacement if Sam wants it); any change to the five scenes, their products or shades; section 5's branch (signup-glass-jar-9d74d2, unmerged, which edits the director, the map and the walk for its fourth wipe: it is merged by its own session onto this part); the family pages; the hero.

## 9. Touches

From the graph (`graphify affected` on HALL, createHall, loadHall, ROOM_SCREENS, RoomState, mountRoom) and the reads that followed:
- `src/config/room.ts`: ROOM_COPY, HALL, PRESS, RENDER_COLOURS, ROOM_SCREENS, STATION_Q, WORLD_START, ROOM_HEIGHT, ROOM_PARAMS, ROOM_RANGES, RoomState, RoomFrame, RoomIsland.
- `src/scripts/hero/section4/director.ts` (createRoomDirector, RoomDirector, RoomHooks), `carousel-math.ts` (frameSource, RoomStateName), `transition.ts`, `hall.ts`, `assets.ts`, `post.ts`, `scroll.ts` and `scroll-math.ts` (RoomAdapter, wheelDecision, touchDecision).
- `src/scripts/hero/hero.ts` (loadDirector, loadHall, __skreedHall, __s4, the stage observer, the page scroll's adapter), `src/scripts/hero/loop.ts` (comments), `src/scripts/hero/types.ts`.
- `src/scripts/room/walk.ts` (mountRoom), `src/components/room/Room.astro`, `src/styles/room.css`.
- `src/scripts/quiz/gate.ts` (ride, HALL_WAIT_MS), `src/scripts/quiz/deck.ts` (comment), `src/env.d.ts`, `src/components/dev/Tune.astro`.
- `scripts/hero/budget.mjs`, `scripts/room/render-stills.mjs`, `contrast.mjs`, `encode.mjs`, `scripts/quiz/frames.mjs`, `hall.py`, `hall-bin.mjs`.
- Tests: `tests/unit/room.test.ts`, `page-scroll.test.ts`, `quiz-gate.test.ts`, `room-carousel.test.ts`, `build-modes.test.ts`, `hall-bin.test.ts`, `room-bubble.test.ts`, `room-prompt.test.ts`; `tests/e2e/room.spec.ts`, `quiz.spec.ts`, `tiers.spec.ts`.
- Docs: `CLAUDE.md` (section 4's paragraph and its exceptions), `docs/00-IDEATION.md` (the spine row), the headers of `section-4.md`, `section-4-world.md`, `section-4-flux.md` and `quiz-gate.md`.

Must not move: sections 1 to 3, the quiz's flow and gate lock, the family pages, the five scenes' content and the carousel's maths.

Every file the removal commit touches, as it lands (80; the graph's list above was the plan, this is the measure): the root: CLAUDE.md, DESIGN.md; `docs/`: 00-IDEATION.md, 02-THE-SITE-IN-WORDS.md, CHECKLIST.md, HANDOFF.md; `docs/specs/`: hero-architecture.md, navbar.md, quiz-gate.md, quiz.md, section-4-flux.md, section-4-no-hall.md (added), section-4-no-hall.review.md (added), section-4-world.md, section-4.md; `scripts/hero/`: budget.mjs; `scripts/quiz/`: frames.mjs; `scripts/room/`: contrast.mjs, encode.mjs (deleted), guards.mjs, hall-bin.mjs (deleted), hall.py (deleted), loop-flash.py, product-check.mjs, products-bin.mjs, render-products.py, render-stills.mjs, step-frames.mjs, universe.py; `src/assets/room/`: hall-lightmap.avif (deleted), hall-lightmap.webp (deleted), hall.bin (deleted), hall.glb (deleted), hall.json (deleted); `src/assets/room/stills/`: hall-portrait.avif (deleted), hall-portrait.webp (deleted), hall-wide.avif (deleted), hall-wide.webp (deleted); `src/components/dev/`: Tune.astro; `src/components/room/`: Room.astro; `src/config/`: quiz.ts, room.ts; `src/data/`: room-flux.json; `src/`: env.d.ts; `src/scripts/hero/`: hero.ts, loop.ts, types.ts; `src/scripts/hero/section4/`: assets.ts (deleted), carousel-math.ts, carousel.ts, director.ts, hall.ts (deleted), layout.ts, post.ts (deleted), products-bin.ts, scroll-math.ts, scroll.ts, transition.ts, video.ts; `src/scripts/hero/stage/`: resize.ts; `src/scripts/quiz/`: deck.ts, gate.ts; `src/scripts/room/`: walk.ts; `src/scripts/shell/`: nav-map.ts, site-nav.ts; `src/styles/`: room.css; `tests/e2e/`: quiz.spec.ts, room.spec.ts, site-nav.spec.ts, tiers.spec.ts; `tests/unit/`: build-modes.test.ts, hall-bin.test.ts (deleted), page-scroll.test.ts, quiz-gate.test.ts, room-bubble.test.ts (deleted), room-carousel.test.ts, room-products-bin.test.ts, room-prompt.test.ts (deleted), room.test.ts, site-nav.test.ts.

## Decisions taken

- **D1. The bubble goes with the hall.** Sam's "it directly goes to the product scenes": the wavy circle opened over the hall onto scene 1; with no hall the third wipe from the fog is the way in, as it was the way into the hall. Cheaper on a phone (no second full-screen pass at the entry).
- **D2. Scene 1 sits at q 1.** The scenes start where the hall's walk did, right after the wipe, so the glue's span at the section's seam lands on scene 1 and the quiz's ride lands there with its target unchanged (the section's top plus one viewport).
- **D3. The arrival hold.** Without the walk a fling from the quiz would coast through the scenes and loop to the hero before the visitor saw them; the hold stops the page at scene 1, by the per-frame snap the exit seam already uses, so it stays inside E-S4-scroll's and E-S4-snap's terms ("page sections only, same on touch"). One rule for every way in (iteration 1 of the review found a trackpad's tail, a finger's drag and a late scene 1 each landing elsewhere): the scenes start at scene 1, and only a step moves between them. The stage is pinned over the range, so putting the scroll back is invisible. Flagged for Sam (section 11).
- **D4. The scenes load during the quiz.** Phase 1 (programs, scene 1's still) when the quiz comes into view, phase 2 (products.bin, scene 1's loop) on the unlock, so a visitor who never finishes the quiz pays only for the still, and Skip quiz's ride finds scene 1 drawn.
- **D5. "Previous scene" at scene 1 is aria-disabled**, as "Next scene" is at scene 5, since there is no way back.
- **D6. The file names stay.** `walk.ts` keeps its name (the section's DOM side; the budget, the graph and the docs name it), with its header saying the walk is gone.

## 10. Exceptions

Withdrawn, nothing left to cover: **E-S4-portal** (the bubble), **E-S4-grain** and **E-S4-light** (the hall's grain, its clear colours and the bubble's outline), and the hall's parts of E-S4-38, E-S4-glow, E-S4-contrast, E-S4-webgl and E-S4-motion (the door, the walk's camera, the prompt and Skip over the hall, the hall's seam glow, halos and bloom, the way back). **E-S4-38** now has nothing to except: every frame of section 4 shows a product. **E-S4-scroll** and **E-S4-snap** cover the arrival hold (D3) on Sam's words of 2026-10-22 ("sure"; "page sections only, same on touch"); the scope's q range is now 1 to 3. **E-QG-ride** waits for the scenes where it waited for the hall. The rest stand as section-4-flux.md section 10 and CLAUDE.md give them.

## 11. For Sam

1. Section 4 now opens on scene 1 at the end of the third wipe: no hall, no door, no "[E] Enter Skreed universe", no bubble. The hall is kept whole on `archive/section-4-grey-room`, and one revert brings it back.
2. The wavy circle went with the hall. Say if you want it back as the way in from the fog.
3. A fling from the quiz stops at scene 1 (the arrival hold) instead of coasting through the five scenes into the loop. Confirm.
4. Two new lines: the section's label "Section 4: the five scenes" and the loading line "Loading the scenes...". Confirm or give your words.
5. "Previous scene" does nothing at scene 1 now (as "Next scene" at scene 5); scrolling up goes back to the quiz.
6. On the poster tier the column's stills show the rooms without the product (rule 38); each scene's lines name it. E-S4-38 covered the hall and the bubble only, so this is as built since the scenes came, not an approved exception. Confirm the column as it is, or ask for stills with the product.
