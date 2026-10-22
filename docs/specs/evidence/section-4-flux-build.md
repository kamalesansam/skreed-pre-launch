# Section 4 flux: the build on s4/flux-wire, proved (evidence for docs/specs/section-4-flux.md)

Proved 2026-10-23 on branch `s4/flux-wire` at bf4c6f0 (21 commits on the default branch's 06c2339), in its own worktree, with nothing in the code changed. Node 24.3.0, wrangler 4.149.0, Google Chrome 155.0.8059.85 and Playwright's Chromium 141.0.7390.37 (headless shell), WebGL on SwiftShader through the e2e's flags (`--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`). The spec is revision 3. The contact sheets are `docs/specs/screenshots/section-4-flux-390.jpg` and `docs/specs/screenshots/section-4-flux-1280.jpg`.

**In one paragraph.** The unit tests (177 of 177), the type check and the production build pass, and every enforced line of section 6 holds (the section's script at 27.9 KB of Sam's 30). The stills script could not finish as written: at 390 x 844 the director caches the section's position during the intro and every snap lands 13,784 px short (defect D1 below, a regression against the default branch, and the reason the 390 frames needed a workaround). With that worked around in the harness only, the script ran to the end at both viewports, and the frames show four more problems for the lead before Sam sees them: the prompt comes back blank after the way back (D2), the four lines sit over the product and lose their contrast on three scenes at 390 (D3), the products' lit faces clip to white on three scenes (D4), and the logotype goes dark over dark scene tops (D5). AC5 (flash), AC12 (contrast), the e2e suite and section 12's documents are still open.

## 1. Tests, type check and builds

| Command (in the worktree) | Result |
|---|---|
| `npm run test:unit` | exit 0 in 5.3 s; the reference guard: "nothing of the references in public/ or src/"; 177 tests, 177 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo |
| `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| `npm run build` | exit 0; csp.mjs: 12 pages, media-src 'self'; budget: "every enforced line of section-4-flux.md 6 holds (49 enforced) and AC8's formats check"; guard: "the ten loops and nothing else, media-src 'self'" |
| `npm run build:test` | exit 0 (the hooks build the frames were made from; media-src 'self') |

Values the unit tests print: plane coverage on the portrait arc (22) at 390 x 844 never under 0.9485 (at eased 0.65); on the wide arc (80) at 1280 x 800 never under 0.6880 (at eased 0.7); the fit at rest 1.0000 covered at 844 x 390, 768 x 1024 and 1920 x 969; products.bin 269,900 B stored, 195,521 B gzip; room-flux.test.ts's ffprobe case ran here (ffprobe 8.0.1 on the PATH) over the ten loops.

## 2. The budget (production build, `npm run build`)

Scripts at gzip, everything else as stored, KB = 1024 B, as budget.mjs prints them.

| Line | Measured | Line in section 6 |
|---|---|---|
| Section 4's script (director 19.9, walk 4.9, room 3.1) | 27.9 KB | 30 KB pending Sam, 38 KB hard |
| scroll.ts (its own chunk, marker skreed:scroll) | 2.8 KB | 4 KB |
| Total JS with section 4 and scroll.ts | 226.6 KB | 250 KB |
| Total JS as CLAUDE.md counts it (critical + island + quiz) | 195.9 KB | 250 KB |
| Critical JS | 14.6 KB | 60 KB (CLAUDE.md) |
| Section 4 on the poster tier: its script | 8.0 KB | 8.5 KB |
| Loop cove, wide / portrait | 1,119.1 / 1,116.1 KB | 1,200 KB each |
| Loop grove, wide / portrait | 1,131.7 / 1,111.6 KB | 1,200 KB each |
| Loop ember, wide / portrait | 931.4 / 924.2 KB | 1,200 KB each |
| Loop palace, wide / portrait | 1,096.5 / 1,054.5 KB | 1,200 KB each |
| Loop dawn, wide / portrait | 618.2 / 651.5 KB | 1,200 KB each |
| Stills, wide AVIF (largest, grove) | 43.2 KB | 110 KB |
| Stills, wide WebP (largest, grove) | 49.2 KB | 176 KB |
| Stills, portrait AVIF (largest, grove) | 49.9 KB | 80 KB |
| Stills, portrait WebP (largest, grove) | 61.0 KB | 128 KB |
| products.bin | 263.6 KB | 270 KB |
| To the press, wide / portrait, AVIF | 1,444.7 / 1,459.2 KB | 1,700 KB |
| To the press, wide / portrait, WebP-only browsers | 1,486.6 / 1,506.2 KB | 1,700 KB |
| The whole section in dist (10 loops, 20 stills) | 10,899.8 KB | 15,000 KB |
| One visit, wide / portrait, AVIF | 5,349.5 / 5,334.7 KB | 7,300 KB |
| One visit, wide / portrait, WebP | 5,411.3 / 5,400.6 KB | 7,300 KB |
| Poster tier pictures, AVIF wide / portrait | 174.1 / 196.8 KB | 570 / 420 KB |
| Poster tier pictures, WebP wide / portrait | 197.7 / 223.9 KB | 900 / 660 KB |
| First view: section 4's markup and room.css | 3.9 KB | 4 KB |
| Formats | 13 pictures AVIF with a WebP twin; 10 scene `<img>` with width and height | AC8 |

Not measured by the budget: the pixel sizes, length, frames, codec and audio track (room-flux.test.ts reads them), the frame cost (the probe was not run), the credits. The GPU estimate the hooks report (`__s4.state().memory`) at rest and just after a step: 390 x 844, 24,032,622 to 27,719,022 B (22.9 to 26.4 MiB, of the phone line's 48 MiB); 1280 x 800, 44,951,746 to 48,361,666 B (42.9 to 46.1 MiB). Vite warns that the hero island chunk is over 500 KB minified (623.5 KB raw, 171.2 KB gzip).

## 3. How the frames were made

**Server.** `npm run build:test`, then `npx wrangler dev --port 8791 --ip 127.0.0.1` in the worktree (a free port beside the harness's 8787; nothing else was started). Local wrangler answered a `Range: bytes=0-99` request on a loop with 200 and the whole file (1,145,970 B), not 206; Chrome played the loops regardless. Production's answer is unverified.

**The stills script** (`scripts/room/render-stills.mjs`, unchanged), `SKREED_GL=swiftshader`, base `http://127.0.0.1:8791/`, `--frames` into the session scratchpad. Three runs:

1. As written. The script launches Playwright's own Chromium, which has no H.264 decoder (`canPlayType('video/mp4; codecs="avc1.640028"')` is empty and `MediaSource.isTypeSupported` false), so every loop is refused and the planes show the stills. It stopped at render-stills.mjs line 79 (`state === 'world'` never came, 20 s timeout) after five 390 frames: defect D1.
2. With a launch shim (`node --import`) that sends `chromium.launch` to the installed Chrome (`channel: 'chrome'`, where the same check says "probably"). The loops played; it stopped at the same line for the same reason.
3. With the shim also making `window.__skreedRoom.snap()` dispatch a window `resize` first, so the director re-reads its layout before the script's first snap (a real phone's toolbar collapse fires the same event). The script then ran to the end at both setups (390 x 844 at DPR 2, touch; 1280 x 800 at DPR 1.5): 25 frames each, in about five minutes.

**Held frames.** The script times the mid-step and the seams by the wall clock, which SwiftShader stretches. A driver in the scratchpad repeated the script's setup (Chrome, the same flags and setups, the resize after the intro) and held chosen frames with the hooks build's `window.__skreedFreeze` (the loop's dt goes to 0, so the tween, the seam and the lights hold while frames still draw; the loops keep playing): the step from grove to ember at eased 0.5 and 0.7 (0.76 at 1280, the first frame past 0.7), the exit at the frame of the jump (cover 1), the wrap's cover-in after 0.05 s (0.08 s at 1280) of its 0.28 s, and the wrap at the landing's frame. The same driver read the prompt after the way back and the GPU estimate.

The shims, the drivers, the raw frames and the logs stay in the session scratchpad (folder `prove/`); nothing of them is in the repo.

**A harness note.** The prompt and Skip carry the Ember Luxe focus ring in the frames: walk.ts focuses the prompt as it appears (part one's rule), and with no pointer input in the harness Chrome treats that as keyboard focus. A visitor who has touched or clicked the page should not see the ring; not verified on a device.

## 4. The frames on the sheets

Both sheets carry the same frames in the same order (the 390 sheet adds three frames of D1). "Script" is the stills script's frame; "held" is the driver's.

| # | Frame | Source | What it shows |
|---|---|---|---|
| 1 | The hall at the station | script | q 9.5, the door shut, "Enter Skreed universe" at the handle ("[E]" too at 1280; touch hides the key at 390) |
| 2 | The bubble at 50 percent | script | scene 1 inside the circle; at 390 the circle holds mostly the phone case's back (the case is centred and 0.55 of the view tall), with cove's sky at its top edge; at 1280 the case and cove's walls |
| 3 | The bubble at 90 percent | script | cove with its loop playing and the Lilac case, the hall greyed outside, Skip below |
| 4 to 8 | Scenes 1 to 5 at rest | script | cove (case, Lilac), grove (AirPods case, Sage), ember (MagSafe wallet, Desert), palace (Lenskin, Ballerina), dawn (case, Pastel), each with its four lines, the count and the two words; the scene hint shows on every scene here because the hook changes scenes without a step (after a real step it is hidden, checked) |
| 9, 10 | Mid-step of each class | held | grove swinging out, ember swinging in, the wallet edge-on near the swap; portrait arc 22 at 390, wide arc 80 at 1280. Most of the frame is black: the incoming room is still at its light floor (see "For Sam" below) |
| 11 | The hold | script | dawn at rest at q 12.5 |
| 12 | The exit seam at full cover | held | the frame of the jump: Pearl cloud over the whole frame |
| 13 | The cloud thinning | script | just after the jump to scroll 0, the hero's rest pose and countdown through the cloud |
| 14 | The wrap's cover over the hero | held | early in the cover-in: the cloud forming over the hero |
| 15 | The wrap at full cover | held | the landing's frame, the dark logotype over Pearl |
| 16 | The wrap landed on scene 5 | script | dawn at rest, its lines, 2.6 s after the cover-out |
| 17 | The way back at its half | script | the circle shrinking into the hall with the case inside |
| 18 | The hall after the way back | held | 6 s after the hall landed: the prompt is a focus ring with nothing in it (D2) |
| 19 | Poster tier, scene 1 | script | the still on --night with its four lines (1280 adds 20, the poster hall with its prompt) |
| 20 to 22 (390 only) | D1's evidence | driver | a natural visit after the intro, native scroll to 2,000, 6,000 and 12,000 px: the hall's third wipe over the hero's pull-back, the walk where section 2 belongs, section 2's labels over the hall |

Not on the sheets (in the scratchpad): the script's hall start, bubble at 25 percent, its own mid-step at a third of the step (wall clock), the exit's cover a tenth of a second in (already full at 1280), the wrap at hold, the poster hall and the other four poster scenes.

## 5. Defects found

**D1, blocker, a regression: at 390 x 844 section 4 caches its position during the intro.** In a natural visit (the intro run out by itself, then native scroll, no hooks), `__s4.state().qRaw` puts the section's top at 1,577 px while `#room` is at 15,361 px (15,644 px just after the intro). The director chunk is created during the intro (the hooks report it 3.9 s after load with `html.intro` still set): in the intro's layout `#find` sits at 733 px, inside the 844 px viewport, so hero.ts's IntersectionObserver is the likely caller (loadHall); `measure()` caches that layout, and nothing re-measures afterwards (the ResizeObserver sees no size change on `#room` or `#find`, there is no window resize, and setState first runs at the press). On the default branch (06c2339, built and served the same way) `#find` sits at 1,914 px during the intro, outside the viewport, and no director exists then; the taller track (1580svh, 13,335 px against 1300svh, 10,972 px) is what brings `#find` into view. Effects seen: at scroll 2,000 px the hall's third wipe draws over the hero (frame 20), at 6,000 px the walk replaces section 2 (21), at 12,000 px section 2's labels float over the hall (22); every snap (the script's, the press off the station, a step's end, the entry's end) scrolls 13,784 px short; a seek into the entry then finds the page outside the section and abandons to the hall, which is where the stills script stopped. At 1280 x 800 the cached top is right (14,725 px). The e2e's 390 flow opens the same URL and skips the intro the same way, so it should meet this too. A real phone's toolbar collapse fires a resize that would re-measure; whether that always comes before the visitor reaches 733 px is unverified on a device. Any fix belongs to the builder (for example, re-measuring when the intro ends, or reading the rect when it is needed).

**D2, major: after the way back the prompt is blank and its accessible name is garbled.** At the station before the entry the prompt is 189 x 44 px at (185, 358) at 390 and decoded. After `__s4.back()` lands in the hall, at +0, +1.5, +3 and +6 s and after a 40 px wheel, `#rmEnter` is `is-near`, focused and not hidden or inert, but its `.rm-key` and `.rm-enter-text` spans are gone: the button holds one sr-only span reading "[E][E]Enter Skreed universeENTER SKREED UNIVERSE" and a decode span whose glyphs stay at opacity 0. It is 390 px wide and starts at x = -16 at 390 (599 px wide at x = 665 at 1280, against 312 px at x = 761 before). Frame 18 shows the empty ring. The likely cause is that the entry's wipe re-splits the whole button, so restorePrompt and the decode show act on the detached spans. The e2e assertion (is-near, visible, focused) passes on this state, so it cannot catch it.

**D3, major: the four lines sit over the product and lose their contrast (the spec is silent on where the product sits against the lines).** At 390 the case's lower third is behind the name and shade lines; at 1280 the catalog line runs under the case or the wallet on cove, ember and dawn. One frame per scene, the lines hidden through the CSSOM, Pearl Whisper (#F7F6F3) against every background pixel of each line's box (the element's box, wider than its glyphs), median / 5th percentile:

| Scene | 390 name | 390 shade | 390 catalog | 1280 name | 1280 shade | 1280 catalog |
|---|---|---|---|---|---|---|
| 1 cove | 1.6 / 1.5 | 6.9 / 4.8 | 13.0 / 8.5 | 3.9 / 1.5 | 5.8 / 1.5 | 10.4 / 3.6 |
| 2 grove | 8.2 / 3.4 | 13.2 / 5.8 | 16.0 / 10.3 | 10.8 / 1.8 | 8.7 / 4.0 | 13.0 / 5.4 |
| 3 ember | 11.7 / 8.3 | 11.4 / 9.4 | 16.7 / 10.9 | 4.5 / 1.3 | 7.1 / 1.3 | 12.5 / 4.5 |
| 4 palace | 2.4 / 1.5 | 2.7 / 1.9 | 6.4 / 3.5 | 3.4 / 2.3 | 3.2 / 1.9 | 5.9 / 1.8 |
| 5 dawn | 1.1 / 1.0 | 7.4 / 4.0 | 13.2 / 8.8 | 1.8 / 1.0 | 1.9 / 1.0 | 3.7 / 1.6 |

The count and the two words measured 8.9:1 or better at the median everywhere; the 390 hint 6.7:1 or better. This is not AC12's method (10 frames 0.5 s apart over the glyphs, by contrast.mjs), so it only flags where AC12 will fail: the bottom shade cannot help where the product is drawn over it.

**D4, for Sam's F2: the products' lit faces clip.** A 20 px patch of each product's face at 390, under its scene's key (60 percent toward the tint, so AC2's white-key reading does not apply):

| Product | Drawn | Catalog | dE00 |
|---|---|---|---|
| Phone case, Lilac (cove) | #ffb0ff | #c988c8 | 12.5 |
| AirPods case, Sage (grove) | #bed9a7 | #96a880 | 12.7 |
| MagSafe wallet, Desert (ember) | #ffd7a8 | #c6a884 | 12.6 |
| Lenskin, Ballerina (palace) | #f2aea5 | #efa3af | 7.8 |
| Phone case, Pastel (dawn) | #ffedff | #d7b9ed | 14.8 |

Three of five reach 255 in a channel. AC2 (within dE00 8 under a white key) was not measured here.

**D5, the spec is silent: the logotype and "Back to top" turn Urban Slate over the scenes.** The logotype's box measured 1.2 to 2.0:1 at the median on all five scenes at both viewports (darkest against the rock of cove and the night sky of dawn); the link is the same tone.

**D6, minor: the scene hint.** At 390 it is drawn across the catalog line's rows (the spec's own position, one row above the two words; the builder's minor 8). It also stays up when the scene changes without a step (the hooks, or a scrollbar re-sync); after a real step it hides.

## 6. For Sam, from the frames (not defects)

- **The mid-step is mostly black.** At eased 0.5 and 0.7 the incoming room is still at its light floor (the light-up of section 4 and X-4: it starts rising only past proximity 0.5 at dt over 0.68 s) while the outgoing room has swung most of the way out. Share of the frame at or under 12/255: 390, 37 and 48 percent (58 and 62 at or under 30/255); 1280, 62 and 63 percent (83 and 93). At rest, 5 percent (390) and 11 percent (1280).
- **The cloud is effectively whole early.** Through the reference's density curve the frame is already flat Pearl at 0.09 s of the 0.28 s cover-in at 390 and at 0.17 s at 1280 (the earliest held frames that were flat; 0.05 s and 0.08 s still show the hero).
- **The case is large at 390.** It fills about 0.53 of the view height and 0.62 of its width, as the class scale allows, so the bubble's first half shows mostly the case's back.

## 7. Gaps between the build and the spec still open

- **AC5 (flash):** `src/data/room-flux.json` records `"flash": "pending"` for all ten loops; no check has run on the loops, steps, seams, the way back or the wrap.
- **AC12 (contrast):** `scripts/room/contrast.mjs` still drives `__s4.land` and `__s4.travel` (lines 101 to 115), which no longer exist, so it cannot run; `docs/specs/evidence/section-4-flux-contrast.md` does not exist. D3's table is the only reading.
- **AC15 (e2e):** not run here (no e2e was asked). Two notes for whoever runs it: the harness's browser is Playwright's Chromium, which cannot decode the loops, so every video assertion runs against refusals; and the 390 flow should meet D1.
- **Section 6, frame cost:** the probe at 390 x 844 and 1280 x 800 was not run (SwiftShader cannot measure it).
- **AC2:** dE00 under a white key not measured.
- **Section 12's documents:** none changed on this branch (`git diff 06c2339 HEAD` over docs/, DESIGN.md and CLAUDE.md lists nothing but this record and the sheets, once committed).
- **Range requests:** local wrangler answers 200 with the whole loop; Workers Static Assets in production unverified.
- **The builder's open items stand:** the "Pause motion" control's place and aria-pressed contradict between sections 3, 5 and 10 (minor 9; the control is hidden while E-S4-loops is pending); the design choices listed in the builder's report (an entry abandoned off screen resets with no event, one extra carousel frame after a scrollbar reset, the hall's reveal skipped under the scenes, the wrap's one-shot unlock spent on a late touchend).

## 8. The fixes on s4/flux-fixes (2026-10-23)

Branch `s4/flux-fixes` on the default branch's c17d76a, in its own worktree, the hooks build served by wrangler on 127.0.0.1:8791 and driven through `__s4` in the installed Chrome 155 (channel chrome) on the Metal GPU (Apple M3 Pro) unless a line says SwiftShader. Each defect below names its commit's content; the numbers are the runs' own.

**D1, closed.** `src/scripts/hero/section4/layout.ts` holds the section's cached layout and re-reads it when html's class changes (a MutationObserver), when the document, the quiz or the section changes size (a ResizeObserver on documentElement, #find and #room), on resize, and by `get()` once a reading taken under html.intro is stale; the hooks report it (`__s4.state().layout`), the page scroll re-evaluates its capture set on every reading (the glue spans were already measured fresh at every decision). Checked in a natural visit (the intro skipped, native scrolls): at 390 x 844 the director is made during the intro with the section at 1,577 px (the quiz at 733 px, inside the viewport) and reads 15,361 px once the intro ends; at 1280 x 800, 1,442 px during the intro and 14,560 after; at scroll 2,000, 6,000, 12,000 px and at the section's q 2 and 9.5, `qRaw` equals the page's own q at both viewports, and `__skreedRoom.snap(9.5)` lands at 9.5. `render-stills.mjs` launches the installed Chrome when present and waits for a reading taken after the intro before its first snap. Tests: `tests/unit/room-layout.test.ts` (a reading under html.intro replaced three ways), the e2e 390 flow checks the cached top against the live rect (not run here).

**D2, closed.** The entry wiped the prompt through the decode's hide of the button itself, which split its whole text afresh and detached the two spans. `walk.ts` wipes the prompt by its two spans (`wipePrompt`). After the way back the prompt reads "[E]" and "Enter Skreed universe" in its two spans, decoded in by 1.5 s, focused, 189 x 44 px at (185, 358) at 390 and 312 x 44 at (761, 309) at 1280, the same boxes as on the first lap. Tests: `tests/unit/room-prompt.test.ts` (the mechanism and the fix under a fake document), the e2e way back checks the spans, the accessible name and the box.

**D3, closed.** `carousel-math.ts productPlacement`: on the portrait class the case is capped at 0.50 of the view's height (0.62 of the width kept) and its centre raised to 0.60 of the view's height from the bottom (not 0.58: the near face projects 3 percent larger than the centre's depth and would cross the block's top by 0.017 of the height); on the wide class the 0.55 cap and the vertical centre are kept and the holder moves right only as far as the widest product's near face needs to clear the lines' column (the gutter plus 520 px, 565 px at 1280: the centred case overlapped it by 42 px and the Lenskin by 87), 0.314 world units, 89 px, at 1280 x 800, nothing at 1920 wide. The unit test projects every scene's product box and holds its overlap with the lines' box (the column at the gutter, the bottom 34 percent) at zero at both viewports:

| Viewport | The lines' box | Case (scenes 1 and 5) | AirPods case | Wallet | Lenskin |
|---|---|---|---|---|---|
| 390 x 844 | x 16 to 374, y 557 to 844 | x 79 to 311, y 117 to 552 (51.6 percent tall) | x 94 to 296, y 227 to 441 | x 76 to 314, y 179 to 494 | x 39 to 351, y 245 to 430 |
| 1280 x 800 | x 45 to 565, y 528 to 800 | x 611 to 854, y 198 to 651 (56.7 percent tall) | x 631 to 843, y 317 to 541 | x 606 to 855, y 260 to 588 | x 567 to 893, y 328 to 521 |

On the served build the lines' glyph boxes (the name, the shade, the catalog line, the count) meet no product box on any scene at either viewport (the hooks' `product.box` against each line's `.dc` rect).

**D4, closed: the AC2 check.** `scripts/room/product-check.mjs` renders each scene at 1280 x 800 (DPR 1) through the hooks under a white key (`__s4.lights({ tint: false, bodyOnly: true })`: the fill and the environment on, the planes, the logo and the trim hidden so the body alone is drawn on black), reads the median of each channel inside the central half of the product's box, and prints dE00 (CIEDE2000) against the catalog hex. The cause: with the scene's environment alone three 0.165 sets the shader's `envMapIntensity` from `scene.environmentIntensity` (1) and ignores the material's, so the environment stood at 1 whatever `LIGHTS.env` said; the environment gives 1.5 times the albedo per unit, the key 0.19 and the fill 0.2, so the spec's 1.6, 0.575 and 0.2 summed to 1.84 of the albedo and the lit faces clipped. Each product material now carries the environment as its own `envMap` (as the family page's gloss materials do), the three intensities are the spec's scaled by 0.83 (key 1.33, environment 0.48, fill 0.17, which sum to 1.0), and the metallic finish, which reflects the environment rather than gathering it, takes it at 1.0 (`LIGHTS.metalEnv`; at 1.1 the Lenskin read dE00 2.7 with 30 percent of its face at 255, at 0.9 dE00 5.7 with 1 percent). The parts were already roled as render-products.py roles them (the trim in its fixed dark at roughness 0.55, the logo at 0.8468 of the body). The readings with the build's own lights:

| Scene | Product, shade, finish | Catalog | Drawn (median of the lit face) | dE00 | Pixels at 255 |
|---|---|---|---|---|---|
| 1 cove | Phone case, Lilac, matte | #c988c8 | #c989c9 | 0.29 | 0.0 percent |
| 2 grove | AirPods case, Sage, gloss | #96a880 | #95a680 | 0.77 | 0.0 percent |
| 3 ember | MagSafe wallet, Desert, matte | #c6a884 | #c6a885 | 0.33 | 0.0 percent |
| 4 palace | Lenskin, Ballerina, metallic | #efa3af | #ea93a0 | 3.97 | 4.1 percent |
| 5 dawn | Phone case, Pastel, matte | #d7b9ed | #d7baee | 0.32 | 0.1 percent |

Before the fix (the spec's numbers, the white key): 12.93, 13.06, 13.27, 3.73 and 17.35, three faces wholly at 255. The check re-runs with `node scripts/room/product-check.mjs <base>` against a served hooks build; `--try` runs other intensities in one session.
