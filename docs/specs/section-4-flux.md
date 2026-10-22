# Section 4, part three: the five scenes (spec)

Written 2026-10-22 from Sam's brief of 2026-10-22 and his answers of the same day. Revision 1. Status: the plan for the build loop (`plan`, then `build`, then `review`).

**What this replaces in `docs/specs/section-4-world.md`.** Everything after the bubble: the ring travel (section 2, "The glide" to "The push"), the morph, the lands at rest and the travel between lands with options A, B and C; section 3's lands, garden, park, depth maps and clips; section 5's scroll map past the station, the world modules and the travel chunks; section 6 in full; AC1 to AC13; W1 to W13 except W2 and W12; E-S4-garden, E-S4-photo, E-S4-device, E-S4-people and E-S4-video as written; For Sam 1 to 5. The lands' pictures, the park and the garden leave the repo with this part.

**What stays.** The hall, the walk, the door, the station, the third wipe from the fog, the cached layout, the press and the bubble as section-4.md and section-4-world.md section 2 ("The press", "The bubble") say; the plain-text rule and section 2's label type with its decode; the copy pattern (every string by id, sentence case, capitals through the decode); the build modes' mechanics (Tune, hooks, staging); the loop screen that wipes back to the hero and jumps to scroll 0.

**Sources.** The numbers read off fluxtheory.in's built page are in `docs/specs/evidence/section-4-flux-reference.md` (cited here as "reference", with the chunk and line). The loops' provenance, job records and credits are in `docs/specs/evidence/section-4-flux-loops.md`. The capture note is `docs/references/2026-10-22-fluxtheory-in.md`. Nothing of the capture ships: the carousel, its shaders and the page code are ours; the five backgrounds are our own regenerated videos (see section 3, "Provenance").

**Sam's brief, verbatim (2026-10-22).** "scrape the entire section 4, we are redoing it, entirely different concept... https://www.fluxtheory.in/ ... put that exact same backround in section 4, all 4 backrounds, or 5... each backround matches to any one of our color groups, keep the grey room, the 3d room, and also sync the scroll to the speed of the movement in the room, and also keep the wiggly circle zooming in animation as well, after opening the door, and after that, these backrounds should come one by one... we need to remove the shower element alone, rest everything will be the same, the fog, the water, the gradient, everything, oh and we have to remove the bathtub as well, and also observe the animation between transition to each and every backround, a rotation of perspective animation, and also instead of the shampoo product... we will have our 3d model, which is phone case, airpods, magsafe wallet, and lenskin, and i will provide 3d model for lanyard and airpods max and popsocket as well... make sure we use the colors for each 3d model which will suit the backround... i want the exact same backround and the transition animation with the same scroll trigger values for each transition, and also the hero section 1 will go to the last section when scrolled backwards since it's a loop from both the directions, and also each section has an elastic sticky glue which pulls to it's original position when the scroll is left halfway, so if the position lies between either side of the 50% of each section, it will pull back to the sections's original position respectively".

**His answers (2026-10-22).** Our stack only (Astro, three; no React, GSAP or Lenis) but "exactly what i just showed you"; all five scenes; the real videos found and used; the blob reveal shows the first background inside the circle; our own plain text as before; the exit is the loop screen; "use the same colors what they use for all 5 scenes"; the four product models now, the lanyard, AirPods Max and PopSocket models later; a wrapped virtual scroll replacing native scroll: "sure"; the elastic snap on "page sections only, same on touch"; videos on "phones as well"; keep tokens for basic tests low. Round 2 on the backgrounds: "make sure any of the scene doesn't look like a bathroom, all of them should look like a dreamy nostalgic backround"; floors: scene 1 keeps its water, scene 2 "thick dense amazon forest level bushes or plants", scene 4 "good royal marble on the floor, since the sorroundings look like a spa in a palace". Then: "All ten backgrounds are approved. Write the Flux spec and start the build around them." And, mid-work: "make sure all of these look good in phone screen size aspect ratio as well."

## 1. Goal

After the door and the bubble, the visitor stands in five dreamlike rooms, one at a time, each a looping video that fills the screen with one of our products turning in front of it, and moves between them with the reference's own step: the next room swings in on a wide arc while the view pinches and relaxes, 0.77 s a step, one step a gesture. The fifth room gives way to a cloud that rises into the hero, and the page is a loop both ways: the hero scrolled up lands on the fifth room. Every page section settles to a whole screen when the scroll stops across a boundary. Nothing in the scenes looks like a bathroom, nothing is a panel or a button, and the phone gets its own portrait set of the same five rooms.

## 2. Phone-first wireframe in words

### 390 x 844, 3D path

Everything up to the press is section-4.md and section-4-world.md section 2 as built: the third wipe from the fog, the grey hall, the walk synced to the scroll (1.145 m a screen, at most 1.0 m per second), the prompt "[E] Enter Skreed universe" rising from q 8.30, the station at q 9.5.

**The press, 0 to 0.9 s.** As built: the leaves swing open over 0.9 s, the dolly from 0.3 to 1.2 s, the hall frozen at 1.2 s. A press before scene 1 is in makes the prompt busy (as built) and the entry starts by itself when scene 1 is in.

**The bubble, 0.35 to 2.35 s.** As built (BUBBLE, bubbleMs 2000 by default), with one change inside it: the circle's inside is the first scene at rest, cove's portrait loop already playing with the phone case turning slowly in front, not the garden tunnel. When the circle has passed the farthest corner the entry is over: state `world`, scene 1, the page snapped to q 10. There is no ring glide, morph or push any more; Skip during the bubble ends it at once (as built).

**Scene 1, at rest.** Cove fills the screen: the pink rock cove, gold columns, the sunset sky, water rippling across the floor. In front, 3.4 units from the camera, the phone case in Lilac turns gently with the finger's drift (plus or minus 0.3 rad) and sways on its own; the key light on it is the scene's own pink. Bottom left, in Plex Mono capitals through the decode, four lines: "Phone case", "Lilac, vivid violet", the catalog line, "1 / 5". Bottom centre on the first visit, the hint "Swipe to the next scene". No panel, no fill, no border anywhere.

**A step, 0.77 s.** A swipe of 12 px up (or any wheel tick or Down key) is one whole step, never a scrub: cove swings away to the left on an 80 degree arc of the radius-7 ring, grove swings in from the right on the same arc, the view pinches from 45 to 42 degrees over the first 65 percent of the step and relaxes back by its end, the case turns through 180 degrees and becomes the AirPods case as its back faces the camera at the half, the key light cross-fades to grove's mint over 1.1 s, and the text wipes out at the step's start and decodes back in with grove's lines at its end. While the step runs and for 150 ms after, further gestures are swallowed. The page's own scroll is held during the step and snapped to grove's position (q 10.5) when it ends. A swipe down steps back the same way.

**Scenes 2 to 5.** Grove (dense rainforest floor, the misty lake, the ring light) with the AirPods case in Sage; ember (the red sunset over the sea, the wet stone floor and its slabs) with the MagSafe wallet in Desert; palace (the royal marble floor, the statues, the lattice and the sea) with the Lenskin in Ballerina; dawn (the sheer curtains, the starry disc, the lilac dawn) with the phone case in Pastel violet, the lanyard's slot until Sam's model lands.

**Scene 5 and the exit.** A further swipe up at scene 5 is not a step: it lets the page scroll on. Dawn stays in place for 0.8 screens of hold, then over the loop screen (one screen) a cloud rises over it, the reference's own fbm clouds in the reference's own cover curve, until the frame is white; behind the white the hero's rest pose is already there (the fourth wipe as built) and at 0.995 the page jumps to scroll 0, as built. The loop then starts again at the hall on the next lap (lapReset 1, as built).

**Scene 1 and the way back.** A swipe down at scene 1 is the way back: the circle shrinks over half of bubbleMs from the whole screen to nothing, revealing the hall at the station with the door shut; state `hall`, the page at q 9.5; the walk runs backwards from there, into the third wipe and the quiz, as built.

**The top of the page.** A swipe down (12 px, finger on the glass) or a wheel tick up while the page is at scroll 0 and the intro is over lands the visitor on scene 5: the page is set to q 12 (dawn's position) in one instant jump, the hero's followers snapped there, section 4 put straight into `world` at scene 5. Dawn shows its still until its loop is in, then the loop plays. From there swipes down step back through palace, ember, grove and cove, then the way back into the hall. Nothing waits on the wrap: whatever is not loaded yet shows its still or its loading line (section 5, "Loading").

**The elastic glue.** Wherever a page section boundary stops inside the viewport (the first wipe from the hero into section 2, the quiz's top, section 4's top), the page settles: if the boundary is above the viewport's middle the next section is pulled to the top; if below, the previous section is pulled back to fill the screen. It runs 0.5 s on the standard ease, after the scroll has been still 150 ms with no finger down, on wheel, keys and touch alike. Inside the carousel the step rule applies instead; inside the walk, the hall's cascade and the hero's pull-back nothing settles (they are scrubbed ranges, not section boundaries).

**Portrait rule.** The phone plays the portrait set (720 x 1280), cover-fitted to the stage; on a phone in landscape it plays the wide set. The set is decided when the island starts and again on resize until the first loop fetch begins; from then on the set is fixed for the visit and cover-fit absorbs the rest.

### 390 x 844, poster path and no JavaScript

The hall's still as built, then, under it, a column of the five scenes as the lands' column was: each scene's portrait still (AVIF with its WebP twin, width and height set, lazy) on --night with its four lines under it in Plex Mono capitals. No video, no carousel, no wrap, no glue; the loop end is the 300 ms fade as built. Without JavaScript the noscript copy says the scenes are below and the column shows.

### 1280 x 800

The same with the wide set (1328 x 692 cover-fitted, 1.01 overscan), the product larger in the frame (its exhibit scale, section 3), the text in the quiz's laptop sizes (20.8 px lines, the name at 40 px), the hint "Scroll to the next scene" with the keys variant "Scroll or press Down to the next scene". A wheel tick is one step; the wheel's burst filter (reference: a burst resets after 200 ms of silence, and while a burst is consumed, deltas under half its peak are swallowed) stops a trackpad's tail from stepping twice. ArrowDown, PageDown and Space step forward; ArrowUp, PageUp and Shift+Space step back; with Ctrl, Meta or Alt, any other shifted key, or a focused input, textarea, select, button or editable target the keys are the browser's. The pad's own arrow walk (the hall's, WCAG 2.1.4) is unchanged in the hall.

## 3. Content

**Copy.** Every string by id in `ROOM_COPY`, sentence case, capitals through the decode. Ids that stay: aria, stageAria, hintTouch, hintKeys, loading, still, enter, key, loadingRoom, skip, stillHallAlt. Ids that change or are new:

| Id | Text | Where |
|---|---|---|
| worldAria | The five scenes. Use Down and Up to move between them. | the stage's label once in `world` |
| sceneHintTouch | Swipe to the next scene | bottom centre, scene 1, first visit |
| sceneHintKeys | Scroll or press Down to the next scene | the same, with a keyboard |
| loadingScene | Loading... | under a scene's lines while its loop is not in |
| next | Next scene | the hidden next control's name |
| prev | Previous scene | the hidden previous control's name |
| scenesTitle | The five scenes | the hidden heading |
| scenesAria | Our products, in five rooms | the list's label |
| sceneLive | {n} of {N}. {name}. {shade}. | the live region on arrival |
| count | {n} / {N} | the fourth line |
| noscript | The entrance needs JavaScript. The scenes are below. | noscript |

Dropped ids: landHintTouch, landHintKeys, loadingLand, landsTitle, landsAria, landLive, clipBlocked (the loops have no travel to block; a scene without its loop shows its still, see section 5).

**The scenes.** Ids are ours (the reference's file names never reach `src/` or `public/`; the guard bans them, AC9).

| # | Id | The room | Product | Shade (catalog) | Finish | Key light |
|---|---|---|---|---|---|---|
| 1 | cove | the pink rock cove: gold columns, a sunset sky, water across the floor | Phone case | vivid-violet-05 Lilac #c988c8 | matte | #ffa6c8 |
| 2 | grove | the green forest: dense rainforest floor, a misty lake, the ring light | AirPods case | go-green-09 Sage #96a880 | gloss | #a8ffe0 |
| 3 | ember | the red sunset: the sea, the leaning slab, a wet stone floor with flat slabs | MagSafe wallet | basic-brown-04 Desert #c6a884 | matte | #ffa171 |
| 4 | palace | the pink palace: royal marble, statues, lattice screens, the sea | Lenskin | playful-pink-06 Ballerina #efa3af | metallic | #ffc9a3 |
| 5 | dawn | the lilac dawn: sheer curtains, the starry disc, fog on the floor | Phone case (the lanyard's slot) | vivid-violet-04 Pastel #d7b9ed | matte | #cbb0ff |

The key light colours are the reference's own per-scene tints (reference, Area.007: one #ffa6c8, two #a8ffe0, five #ffa171, four #ffc9a3, three #cbb0ff, mapped by the reference's scene order), lerped over 1.1 s on a step. The product shades are picks to suit each room from the catalog (`SHADES`); Sam approves them in the frames (F2) and may swap any for another catalog shade by id. Scene 5 shows the phone case in a second shade until Sam's lanyard model lands (F-8); no placeholder ships (rule 38, AC2).

**Each scene's four lines** (bottom left, the lands' grid): the product's name (`ROOM_PRODUCTS[id].name`), the shade line "{Shade name}, {family name}" (from `SHADES`, the family in lower case words: "Lilac, vivid violet"), the catalog line (`ROOM_PRODUCTS[id].line`), and the count. The same lines are the poster column's text and the accessible copy.

**The backgrounds.** Ten loops, five wide (1328 x 692) and five portrait (720 x 1280), 24 fps, 120 frames (5.000 s), first frame equal to last within 2/255 so the loop is seamless, H.264 High, no audio track, BT.709 with the sRGB transfer, +faststart, encoded by `scripts/room/encode-flux.mjs` from the masters. One poster still per loop (its first frame) as AVIF with a WebP twin at 1280 x 666 (wide) and 720 x 1280 (portrait), within the land lines.

**How each master was made** (recorded in `docs/specs/evidence/section-4-flux-loops.md` with every job id and credit). Round 1: a frame of each of the reference's five loops with the shower and the bathtub inpainted out (masked inpaint, 2 credits each). Round 2 at Sam's request: every bathroom accessory removed (bottles, candles, incense, towels, the wash basin unit and its mirror), the grove floor made dense rainforest, the palace floor made royal marble, the cove floor kept as water. Then each still animated as a 5 s first-and-last-frame loop (Kling, 6.25 credits each) with a locked camera; the portrait set from the centre 788 px of each still extended top and bottom by masked inpaint and animated the same way. Sam saw all ten as stills and as loops and approved them on 2026-10-22.

**Provenance.** The masters descend from frames of the reference's own videos; the spec records that plainly and section 11 asks Sam to confirm he is content to ship derivatives (the repo is public). The masters, stills and job records are gitignored in `assets-src/room/flux/raw/` with `SHA256SUMS` committed; the encoded files in `src/assets/room/flux/` are tracked; `src/data/room-flux.json` records source, job ids, credits, prompts, sizes, hashes and the approval words. The capture itself (`www.fluxtheory.in.zip`) stays untracked and excluded.

**Approval.** Nothing ships that Sam has not approved (CHECKLIST F2): the ten loops are approved; the product shades and placement are approved in the frames of the review; a change to a loop goes back through the same record.

**Alt text.** The column's stills carry one sentence each describing the room (no product in the still), from `ROOM_SCENES[i].alt`.

**Colours.** The scenes keep the reference's colours (E-S4-colour as amended). The products wear catalog shades. The text is Pearl Whisper as built; contrast per scene is measured and recorded (AC12), never boxed.

## 4. Motion plan

No library. One clock per gesture, one tween per step, one settle per stop, in the island's own frame loop.

| Trigger | What moves | How |
|---|---|---|
| The press | the door, the dolly, the hall freeze | as built (PRESS) |
| 0.35 s after the press | the bubble over scene 1 | as built (BUBBLE, bubbleMs); inside: the carousel's frame at scene 1 with cove's loop playing |
| The bubble done | state `world`, scene 1 | the page snapped to q 10; the text decodes in (showAll, step 0.12 s); room_scene |
| One gesture in range | one step | t: 0 to 1 over stepMs (770) on power2.out (1 minus (1 minus t) squared); outgoing scene angle dir times sweep times t, incoming dir times sweep times (t minus 1), sweep 80 degrees on a ring of radius 7 with the planes billboarded to the fixed camera at (0, 0.2, minus 1) looking at (0, 0, minus 7); fov 45 plus (42 minus 45) times s(r) where r is t over 0.65 up to 0.65 and (1 minus t) over 0.35 after, s the cubic smoothstep; the front index switches at t 0.75; the product turns 180 degrees per step (minus pi times step) and swaps mesh at t 0.5; the key light lerps 1.1 s; the text hides at t 0 (0.2 s) and shows on completion; the native scroll is snapped to the step's q when the tween ends; 150 ms cooldown |
| The step's end | nothing | visible set equals the front scene; the outgoing loop keeps playing for one more step's distance then pauses at 0 (reference: play above 0.3 of proximity, reset at 0.02) |
| Finger or pointer | the product's look | rotation.y plus x times 0.3 rad, rotation.x plus y times 0.3 rad, smoothed by 1 minus 0.9 to the power of 60 dt; an idle sway of 0.02 rad at 0.25 Hz |
| A forward gesture at scene 5 | nothing captured | the page scrolls natively into the hold |
| The hold (q 12 to 12.8) | nothing | scene 5 at rest |
| The loop screen (q 12.8 to 13.8) | the cloud | the fbm cloud (reference's shader, in-canvas form) rises with the loop progress through the reference's cover curve (cover 1 minus (abs(p minus 0.7) minus 0.25) over 0.45, clamped, then quintic), white at full; under it the fourth wipe and the jump at 0.995 as built |
| A backward gesture at scene 1 | the way back | the bubble in reverse over bubbleMs times 0.5 from done to nothing over the hall's station frame with the door shut; then state `hall`, the page at q 9.5 |
| A backward gesture at scroll 0 | the wrap | one instant jump to q 12 (room top plus 12 screens), the hero's followers snapped, section 4 in `world` at scene 5; room_wrap |
| The scroll stops across a boundary | the glue | after 150 ms still with no finger down: boundary above the viewport's middle, scrollTo the boundary; below, scrollTo the boundary minus one viewport; 0.5 s on --ease-standard, instant under reduced motion; the hero's and section 4's followers follow the page as they do today |
| The page position changes without a gesture (scrollbar, programmatic) | the scene | step equals round((q minus 10) over 0.5) clamped to 0 to 4; the planes re-parked, fov 45 |
| Resize | the carousel | planes re-fitted (cover, 1.01 overscan), the product re-scaled, the still or loop class fixed once a fetch began |

**Reduced motion** (the still3d tier; the poster tier is the default for prefers-reduced-motion, as built). No video: each plane carries the scene's poster still. The bubble is the 600 ms dissolve as built. A step is a cut with a 300 ms cross-fade between the two stills, the fov untouched, the product swapped at once, the text a 0.2 s fade. The way back and the wrap are instant. The glue is instant. The cloud still rises with the scroll (it is scroll-driven, not autonomous) at the same curve.

**WCAG 2.2.2.** The loops are ambient motion that never stops on its own; the products sway. That is autonomous motion over 5 s. Pending exception E-S4-loops (section 10); the default if Sam declines is a plain-text "Pause" control bottom centre that freezes the loops and the sway. The step (0.77 s), the bubble (2.35 s), the way back (1 s) and the glue (0.5 s) are each under 5 s and visitor-started. Skip is unchanged for the bubble.

**WCAG 2.3.1 (AC5).** The flash sweep runs on each loop (as it plays, cover-fitted, at 390 x 844 and 1280 x 800), on each step and on the cloud; the bubble's growth is monotonic as built.

## 5. Data and states

**Inputs.** The native scroll position through the cached layout (as built); wheel, keys and touch inside the carousel's range and at the page top (new, captured); the pointer for the product's look; orientation and viewport for the loop class; the reduced-motion flag once (the still3d tier) and live for the decode; Save-Data, effectiveType and deviceMemory for the video policy.

**Outputs.** Analytics through track(): room_view, room_walk, room_enter {q}, room_skip, room_loop as built; new room_scene {id, i} on arrival at a scene, room_step {from, to}, room_back (the way back into the hall), room_wrap (the top wrap). Custom DOM events as built ('skreed:room-state' with entering, unbusy, world, loop, jump) plus 'skreed:room-scene' {i}.

**Nothing is stored (B3).**

**Build modes.** PUBLIC_PARK_TRAVEL, the travel pick tables and the Vite stub alias go. `npm run build` ships the ten loops and media-src 'self' in the production CSP (E-S4-video as amended; AC13); `build:staging` as built with Tune on; the post-build guard fails any .mp4 in dist that is not one of the ten encoded loops by name, any park or land or garden asset, and any file naming the reference's scene file names. Hooks builds add `__s4.scene(i)`, `__s4.step(dir)`, `__s4.back()`, `__s4.wrap()` to the existing state, enter, seek, skip.

**Video policy.** Loops stream from their hashed URL, never a blob; muted, no audio track, playsinline, disableRemotePlayback, preload auto; five `<video>` elements at most, made once and unlocked (play then pause) inside the press task so iOS counts the gesture (as built in unlockMedia); the element for scene 1 is created and fetched before the press (fetching needs no gesture). A loop is "in" when it is wholly buffered (as built); a loop that is not in by the time its scene is front shows the scene's still on the plane and cross-fades to the loop (300 ms) when it arrives; a play() refusal or 1.5 s without a new frame keeps the still (no "Clip blocked" line in production; on Tune builds the loading line names it). No video at all (stills on every plane) under reduced motion, Save-Data, 2g or slow-2g, or deviceMemory 2 or less (E-S4-video's exclusions stand; Sam's "phones as well" lifts the poster-tier-only rule, not these).

**The scroll map**, in screens of the section's height (100svh each): wipe 1 (q 0 to 1), walk 8 (1 to 9), station 1 (9 to 10, STATION_Q 9.5), scenes from WORLD_START 10 at a step of 0.5 (sceneQ(i) = 10 + 0.5 i, i 0 to 4, so 10, 10.5, 11, 11.5, 12; the reference's 50vh a step), hold 0.8 (12 to 12.8), loop 1 (12.8 to 13.8), tail 1; ROOM_HEIGHT 14.8, `.room .rm-track { height: 1480svh; }` for every state (no per-N heights; the unit test pins the two). The carousel is in range while q is within 2 px of [10, 12]. The loop screen's progress is (q minus 12.8) clamped to 0 to 1.

**States.** `section#room[data-state]` is `hall`, `entering`, `world` or `back` (the way back, one clock); `data-scene` 0 to 4 in `world`; `data-step` 1 while a step runs; `data-tier` as built. The land sub-states go.

**The DOM** (Room.astro): the track and the sticky stage as built; the still (poster tier) and noscript as built; the prompt, the pad, Skip, the hint and loading lines as built; `h2.sr-only` "The five scenes" then `ol.rm-scenes` with five `li.rm-scene` (data-id, data-i), each holding the poster `picture` (lazy; shown on the poster tier only, as the lands' were) and the four lines; the hidden previous and next controls (visually clipped, in the tree); the live region. The unreached scenes are clipped, never hidden (as built).

**The island modules** (`src/scripts/hero/section4/`): `director.ts` (states, the cached layout, the press, the bubble, the way back, the loop screen, the hooks; the land, travel and option code removed), `hall.ts`, `transition.ts`, `assets.ts` (hall.bin and products.bin parsers), `carousel.ts` (new: the ring, the planes, the step tween, the fov curve, the product slot, the key light, the cloud exit pass; draws into its own 8-bit target cleared to Urban Slate under NoToneMapping, display values in and out; the planes write the loop's bytes as they are, the products are lit), `video.ts` (new, salvaged from travel-video.ts: the elements, unlock, fetch to wholly buffered with the 20 s timeout and the iOS suspend nudge, VideoTexture per element, the refusal rule), `scroll.ts` (new, page level, loaded with the hero: the glue at the three boundaries, the top wrap, and the carousel's gesture capture while in range). `walk.ts` keeps the DOM bridge, the decode, Skip, the hints and the scene lines (its land code becomes scene code). world.ts, rings.ts, blend.ts, cloud.ts, stream.ts, depth.ts, garden.ts, park-flight.ts, travel.ts, travel-stub.ts, travel-depth.ts, travel-park.ts and travel-video.ts are deleted.

**Loading, in phases, at most one compile, upload or decode a frame (as built).** (1) The hall with the director chunk (as built). (2) Past the third wipe (q over 1): the carousel's shaders compile, products.bin (one fetch, about 150 KB, parsed in strips), scene 1's loop fetched to wholly buffered, scene 1's still decoded. The press waits on products.bin and scene 1's loop (the busy prompt as built). (3) In the press task: the five elements unlocked. (4) On arrival at scene 1: the other loops fetched one at a time in the order 2, 3, 4, 5, each still decoded before its loop; the still of the next scene is resident before a step can start, the loop is optional. Resident at any moment: every element (paused at 0 beyond one step's distance), at most two playing, their two VideoTextures, the current and the two neighbouring stills, the four products' geometry (about 60k vertices). (5) The wrap loads the hall and the carousel if a visitor wraps first; scene 5's still then its loop first, then 4, 3, 2, 1.

**Failures.** products.bin fails: the scenes show without a product and the loading line says "Loading..." then "Still loading..." as built for the hall; the carousel never blocks on it after the press. A loop fails or is refused: its still stays. The hall fails: as built (the poster column). The island fails before the press: as built.

| State | What the visitor sees |
|---|---|
| Empty (no loops in) | the still on each plane, the loading line under the lines |
| Loading | the busy prompt before the press; stills on planes after |
| Error | the still stays, no line in production |
| No internet | the still if decoded, else the plane is Urban Slate with the lines |
| Slow network | the stills carry the carousel, loops arrive one by one |
| Success | the loops play |

## 6. Budget

KB are 1024 B. Lines count scripts at gzip and everything else as stored. Measured by `scripts/hero/budget.mjs` on `npm run build` (the lines below replace the world lines; the garden, land, depth, park and clip lines go).

| Part | Line | Note |
|---|---|---|
| Section 4 script (director, carousel, video, assets, walk, lazy) | 30 KB gz | Sam's line; the world's 36.3 KB measured chunk had the lands, the morph, the rings and the travel options, all gone now; measured on the first Flux build and recorded here |
| scroll.ts (page level, with the hero) | 3 KB gz | counted in critical JS |
| Total JS | 250 KB gz | as CLAUDE.md |
| Each loop (wide 1328 x 692, portrait 720 x 1280, 5.0 s) | 1,200 KB | H.264 High, CRF from 18 up until under the line |
| Each poster still | 110 KB AVIF, 176 WebP (wide); 80 KB AVIF, 128 WebP (portrait) | the land lines |
| products.bin | 160 KB | four products, u16 positions, i8 normals, u16 indices |
| To the press (one class) | 1,500 KB | products.bin, scene 1's loop, scene 1's still, the hall as built |
| Whole section in dist (both classes) | 15,000 KB | ten loops, twenty stills, products.bin, the hall |
| One visit (one class) | 7,000 KB | five loops, five stills (one format), products.bin, the hall |
| Poster tier | 529 KB AVIF, 724 WebP, 8.5 KB script | as built: the hall still and five stills in one column |
| First view markup plus room.css | 4 KB gz | as built |
| Higgsfield credits | 300 for this part | spent so far on the backgrounds: 1420 to 1346 over round 2 and the loops (the earlier rounds and the 180-credit Seedance loss are in the evidence doc) |

**Frame cost.** The carousel draws at most two video planes, one product (under 6k triangles), the key light and, on the loop screen, one cloud quad; the probe is the family page's (20 renders) at 390 x 844 and 1280 x 800, DPR 1.25 on touch, pass at 1.25 frame periods or less on an A15-class iPhone and a Redmi-class Android. Degrade path: DPR 1, then the cloud at half resolution. GPU resident set on a phone: 48 MiB or less for the section (two VideoTextures about 3.7 MB each, three stills about 3.3 MB each, the products about 2 MB); measured as the world's was (`__skreedGpu()`, `__s4.state().memory`).

## 7. Acceptance criteria

1. **The sequence (A1, C3, E3).** On the 3D path at 390 x 844 and 1280 x 800: the walk, the press, the bubble with scene 1 inside it, scene 1 at rest with its product and its four lines, five scenes by five steps (each 0.77 s plus or minus one frame, the 80 degree arc, the fov 45 to 42 to 45 with the return at 0.65, the front switch at 0.75), the hold, the cloud over the loop screen, the jump to scroll 0; the way back at scene 1 into the hall; the top wrap onto scene 5. Driven through `__s4` and the stills script; frames at 390 and 1280 for Sam.
2. **Approved content only (F2, rule 38).** Production carries the ten approved loops by hash, the four products in the shades of section 3's table, no placeholder; scene 5 shows the phone case until the lanyard model is approved.
3. **The step is whole (C3).** Inside the range every wheel tick, key and 12 px touch is one step; a gesture during a step or within 150 ms after is swallowed; the wheel burst filter holds (200 ms, 0.5); at scene 5 a forward gesture scrolls the page; at scene 1 a backward gesture runs the way back; the page's q is snapped to the scene's q when a step ends; a position change without a gesture re-syncs the scene.
4. **The glue (C3).** At each of the three boundaries, a stop with the boundary in the upper half settles to the boundary, in the lower half to the boundary minus a viewport, in 0.5 s, on wheel, keys and touch, after 150 ms still with no finger down; instant under reduced motion; never inside the walk, the cascade, the pull-back or the carousel.
5. **No flash (E3, WCAG 2.3.1).** The sweep of section-4-world.md AC5 on every loop as drawn, on every step and on the cloud, at both viewports: no 341 x 256 CSS px region flashes more than three times in any second. Recorded per loop in `room-flux.json` and the evidence doc.
6. **The loop both ways (A1).** The loop screen jumps to scroll 0 at 0.995 and resets to the hall; at scroll 0 a backward gesture after the intro lands on scene 5 in one jump with the hero's followers snapped; a backward gesture during the intro lock does nothing.
7. **Video policy (B1, E3).** media-src 'self' in every build's CSP; loops stream by URL, muted, no audio track, playsinline; no video under reduced motion, Save-Data, 2g or slow-2g, deviceMemory 2 or less (stills on the planes); a refused or late loop keeps the still; the five elements are unlocked inside the press task; one class per visit.
8. **Budget (B1).** Every line of section 6 holds on `npm run build`; the section's chunk is attributed to section 4 by the budget (its marker); the loops ship as AVIF plus WebP stills with width and height; no JPEG, PNG or GIF.
9. **Nothing of the reference ships (A4).** The guard bans fluxtheory's file names and strings and the reference's scene file names in `src/` and `public/`; the capture is untracked and excluded; the evidence doc states the method and provenance.
10. **Plain text (A3, rule 25).** AC11 of the world spec stands as the unit test on room.css and Room.astro: no panels, fills, borders (but the focus ring) or shadows; the lines in Plex Mono capitals through the decode, sentence case in the hidden copy.
11. **Reduced motion and the poster tier (E3).** still3d: stills on the planes, cuts with 300 ms cross-fades, the dissolve bubble, instant glue and wrap; poster: the column of five stills with the lines, no island.
12. **Contrast (A3).** Each scene's lines measured over its still at both viewports by `scripts/room/contrast.mjs`, recorded in `docs/specs/evidence/section-4-flux-contrast.md`, flagged to Sam under 4.5:1, never boxed.
13. **Accessibility (D1, D2).** The scenes list stays in the tree (clipped, not hidden); arrival moves focus to the scene's name for keyboard users, else one polite announcement; the previous and next controls work by keyboard and screen reader; the pad's arrow walk is unchanged in the hall; Escape, Enter and Space map to Skip during the bubble as built.
14. **Tests (B1).** Unit: the scroll map and the 1480svh track; the step maths (angles, fov curve, front switch) and the burst filter; the glue's decision at the three boundaries; products.bin byte for byte; the ten loops by hash, frames and tags; the copy rules; Tune's keys and ranges; the build modes (no pick, media-src 'self', the guard). E2E (SwiftShader, `?tier=hero3d`): the 390 x 844 flow of AC1, the top wrap, the glue at section 4's top, the still3d path, the poster column.

## 8. Out of scope

The lanyard, AirPods Max and PopSocket models (slots exist in `ROOM_SCENES`; they take a product id when Sam's models arrive). Intro and outro clips per scene (the bubble is the lights-up, the cloud the lights-down; F-4). A full virtual scroll of the whole page (F-5). Sound. The family pages. Section 3. The hero's own pause-motion control (pending E-2.2.2, hero.md).

## 9. Decisions taken

- **F-1 The camera is fixed and the planes orbit.** The reference's camera never rotates; the two planes swing on the ring and billboard toward it while the fov pinches. A rotating camera over flat planes would show them in perspective and not read as the reference. Sam's "rotation of perspective" is the fov pinch plus the arc.
- **F-2 The cloud is the exit, the bubble is the entry.** In the reference the fbm cloud covers section seams, not steps; the steps are the arc alone. Our entry seam is the bubble Sam kept; the exit seam gets the cloud.
- **F-3 The incoming plane shows its loop from the start of the step.** The reference shows the incoming plane black until half the step because it waits for a 1 s intro clip; ours have no intros, so black would read as a fault.
- **F-4 No intro or outro clips.** Ten loops only. The lights-up and lights-down of the reference are covered by the bubble and the cloud.
- **F-5 Native scroll stays the page's position; the capture is local.** Sam accepted a wrapped virtual scroll; what the brief needs is the loop both ways, whole steps in the carousel and the glue. Those are built on native scroll (gestures captured only inside the carousel's two screens and at scroll 0, settles by scrollTo), which keeps the quiz's native scrolling, find-in-page, focus scrolling, bfcache and the hero's followers as they are, and spares a third smoother. Recorded as E-S4-scroll since it captures wheel and touch where the rules forbade it.
- **F-6 The glue acts at section boundaries by the viewport's middle.** "Each section's original position" is its top at the viewport's top; the half rule is the boundary's place in the viewport. The scrubbed ranges (the pull-back, the cascade, the walk) are not sections and never settle; the carousel steps instead.
- **F-7 The products are a bin, not GLBs.** The director chunk stays loader-free (hall.bin's precedent, hall-bin.test.ts); products.bin carries the four meshes with u16 positions and i8 normals and the parser is under 2 KB gz. The GLBs stay Blender references.
- **F-8 Scene 5's product.** Sam named four products for five scenes and three models to come; the fifth slot shows the phone case in a second shade until the lanyard model is approved, because a placeholder may not ship (rule 38).
- **F-9 Display values.** The loops are drawn as encoded (bytes in, display values out, NoToneMapping) as every section 4 texture is; the reference's plane material is unlit too (toneMapped false), so the videos read the same.
- **F-10 One loop class per visit** by orientation, fixed once a fetch began; cover-fit covers the rest (the reference ships one class and scales it).
- **F-11 The lands' code, assets, scripts, data and tests leave with this part** rather than staying behind the stub alias: dead code and 61 assets have no place in a public repo with a byte budget. The unmerged branch s4/docs (part two's DESIGN.md, CLAUDE.md and CHECKLIST text) is superseded by this part's section 12 and is not merged.
- **F-12 Scene ids are ours** (cove, grove, ember, palace, dawn); the reference's file names are banned in `src/` and `public/` by the guard.
- **F-13 Tune keys.** stepMs 770 [400, 1200, 10], sweepDeg 80 [40, 120, 1], fovStep 42 [36, 45, 0.5], fovReturnAt 0.65 [0.4, 0.9, 0.05], snapMs 500 [200, 900, 10], keyLightMs 1100 [300, 2000, 50], bubbleMs, lapReset, handoff, stationDist, door and the hall keys as built; travelMs, ringCount, travelRoll, morphMs, enterPushMs, worldBloom, landTravelMs and parkTravel go. room.test.ts holds Tune to the list.
- **W-2 and W-12 stand** (the bubble's numbers; the world's target pattern for the carousel's target).

## 10. Exceptions this part needs

This section is the only text for every E-S4 id named here; the ids of section-4-world.md section 10 not named here are unchanged.

**Approved by Sam's words.**
- **E-S4-scroll** (section-4.md D13 "The section does not hold the scroll", world.md "Never a hold", docs/references/README.md's fixed decision against wheel hijacking on phones). Sam, 2026-10-22, to "a wrapped virtual scroll replacing native scroll": "sure"; and the brief's "each section has an elastic sticky glue". Scope: wheel, keys and touch are captured (preventDefault) only while the carousel is in range (q 10 to 12) and at scroll 0 after the intro; everywhere else the page scrolls natively. *Default if withdrawn:* the carousel steps from the native position (round((q minus 10) over 0.5)) without capturing gestures, no top wrap, the glue stays.
- **E-S4-snap** (section-2.md's auto-settle "never on touch or under reduced motion"; the references take list "no snap on the hero"). Sam, 2026-10-22: "page sections only, same on touch". Scope: the three boundaries, touch included; instant under reduced motion. *Default if withdrawn:* wheel and keys only.
- **E-S4-video, amended** (hero-architecture 12.3 media-src 'none'; world.md "production only if C"). Sam, 2026-10-22: the backgrounds are videos, "phones as well". Scope: media-src 'self' in production; the exclusions (reduced motion, Save-Data, 2g, deviceMemory 2 or less) stand with stills in place of loops. *Default if withdrawn:* stills on every plane in production, loops on staging.
- **E-S4-colour, amended** (A2, rule 24, DESIGN.md 1 and 2). Sam, 2026-10-22: "use the same colors what they use for all 5 scenes". Scope: the five scenes' own palettes; the products wear catalog shades; the text stays Pearl Whisper. *Default if withdrawn:* the loops graded toward one family each (a new round of masters).
- **E-S4-portal, E-S4-font, E-S4-38** stand as written in section-4-world.md.

**Pending.**
- **E-S4-loops** (WCAG 2.2.2, DESIGN.md motion rule: nothing moves on its own for more than 5 s without a way to stop it). The loops and the products' sway run while a scene is front. *Default if declined:* a plain-text "Pause" control bottom centre that freezes the loops (video.pause()) and the sway, remembered for the visit only.
- **E-S4-webgl, E-S4-motion, E-S4-contrast, E-S4-glow** stand pending as in section-4-world.md.

## 11. For Sam

1. The section script line: 30 KB (your line) is this part's target; the first Flux build's measured number goes here for your ruling if it lands between 30 and 38.
2. The loops never stop (WCAG 2.2.2): approve E-S4-loops in your words, or we ship the plain-text Pause control.
3. Provenance: the ten backgrounds descend from frames of fluxtheory.in's own videos, inpainted and re-animated. The repo is public. Confirm you are content to ship them, or we regenerate the five rooms from text prompts alone (about 60 credits).
4. The product shades per scene (section 3's table) are picks; name any swap by catalog id.
5. Scene 5 shows the phone case in Pastel violet until your lanyard model arrives; say if you would rather have a different product there now.
6. Inside the carousel (two screens of the page) the wheel and the finger are captured for whole steps, so a phone cannot scroll through it by momentum; at scene 5 a further swipe scrolls on. Confirm.
7. The way back at scene 1 (the circle shrinking into the hall) and the top wrap landing on scene 5 are inferred from "a loop from both the directions"; say if you want the wrap to land elsewhere.

## 12. Documents this part changes (at build time, each in its own branch)

- `docs/specs/section-4-world.md`: a status line under its title naming this spec as superseding everything after the bubble, listing the sections.
- `docs/specs/section-4.md`: the pointer line under its title (once the other session's open edit is committed).
- `docs/specs/hero-architecture.md` 11.4: rewritten for the hall, the bubble, the carousel, its target, the video policy, scroll.ts and the build modes.
- `DESIGN.md`: the section 4 entries replaced with plain-text entries (the prompt, Skip, the hint and loading lines, the scene lines), the scenes' type under "Section 3 type" (its scope line gains section 4), motion rows for the step, the glue, the way back and the wrap, the reduced-motion entries, E-S4-scroll, E-S4-snap, E-S4-video and E-S4-colour under approved exceptions, E-S4-loops under pending.
- `CLAUDE.md`: line 18's section 4 summary rewritten for this part; the Stack line amended to record "our stack only: Astro and three; no GSAP, Lenis or React" (Sam, 2026-10-22); the pending list updated.
- `docs/CHECKLIST.md`: the E-S4 lines under A1, A2, A3, C3, D1 and E3 once Sam confirms.
- `docs/00-IDEATION.md` and `docs/02-THE-SITE-IN-WORDS.md`: section 4's line.
- `docs/references/README.md`: the fluxtheory.in row (with the spec).
