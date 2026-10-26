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

**D4, closed: the AC2 check.** `scripts/room/product-check.mjs` renders each scene at 1280 x 800 (DPR 1) through the hooks under a white key (`__s4.lights({ tint: false, bodyOnly: true })`: the fill and the environment on, the planes, the logo and the trim hidden so the body alone is drawn on black), reads the median of each channel inside the central half of the product's box, and prints dE00 (CIEDE2000) against the catalog hex. The cause: with the scene's environment alone three 0.165 sets the shader's `envMapIntensity` from `scene.environmentIntensity` (1) and ignores the material's, so the environment stood at 1 whatever `LIGHTS.env` said; the environment gives 1.5 times the albedo per unit, the key 0.19 and the fill 0.2, so the spec's 1.6, 0.575 and 0.2 summed to 1.84 of the albedo as drawn before the fix (1.21 as the spec intended, with the environment at 0.575) and the lit faces clipped. Each product material now carries the environment as its own `envMap` (as the family page's gloss materials do), the three intensities are the spec's scaled by 0.83 (key 1.33, environment 0.48, fill 0.17: the intended 1.21 times 0.83 gives 1.0), and the metallic finish, which reflects the environment rather than gathering it, takes it at 1.0 on the wide class (`LIGHTS.metalEnv`; at 1.1 the Lenskin read dE00 2.7 with 30 percent of its face at 255, at 0.9 dE00 5.7 with 1 percent) and, since the checker's finding (section 9), at 0.6 on the portrait class (`LIGHTS.metalEnvPortrait`). The parts were already roled as render-products.py roles them (the trim in its fixed dark at roughness 0.55, the logo at 0.8468 of the body). The readings with the build's own lights:

| Scene | Product, shade, finish | Catalog | Drawn (median of the lit face) | dE00 | Pixels at 255 |
|---|---|---|---|---|---|
| 1 cove | Phone case, Lilac, matte | #c988c8 | #c989c9 | 0.29 | 0.0 percent |
| 2 grove | AirPods case, Sage, gloss | #96a880 | #95a680 | 0.77 | 0.0 percent |
| 3 ember | MagSafe wallet, Desert, matte | #c6a884 | #c6a885 | 0.33 | 0.0 percent |
| 4 palace | Lenskin, Ballerina, metallic | #efa3af | #ea93a0 | 3.97 | 4.1 percent |
| 5 dawn | Phone case, Pastel, matte | #d7b9ed | #d7baee | 0.32 | 0.1 percent |

Before the fix (the spec's numbers, the white key): 12.93, 13.06, 13.27, 3.73 and 17.35, three faces wholly at 255. The check re-runs with `node scripts/room/product-check.mjs <base>` against a served hooks build; `--try` runs other intensities in one session. These readings are the laptop's; section 9 has both viewports.

**D5, closed.** `ROOM_SCENES` carries `toneDark` per scene and the director's plan takes the front scene's (the front switches at eased 0.75 of a step, where the lights change over; the bubble's end and the still3d dissolve's half take scene 1's). `scripts/room/scene-tone.mjs` measures each scene's still as drawn at rest (cover-fitted at the 1.01 overscan, the bottom shade in the frame) under the logotype's box (the gutter, 96 x 23.2 px at 390, 136 x 32.9 at 1280) and the control's (its 44 px row top right) at both viewports: the median luminance, and Pearl Whisper's and Urban Slate's contrast against it. Every scene's top is dark, so all five keep Pearl (Urban Slate measured 1.05 to 1.98:1, which is D5's reading):

| Scene | 390 logotype: Pearl / Slate | 390 control | 1280 logotype | 1280 control | The pick |
|---|---|---|---|---|---|
| 1 cove | 9.05 / 1.09 | 17.66 / 1.78 | 14.39 / 1.45 | 11.19 / 1.13 | Pearl Whisper |
| 2 grove | 12.19 / 1.23 | 12.48 / 1.26 | 17.57 / 1.77 | 16.26 / 1.64 | Pearl Whisper |
| 3 ember | 18.36 / 1.85 | 18.6 / 1.88 | 16.85 / 1.7 | 16.77 / 1.69 | Pearl Whisper |
| 4 palace | 5.76 / 1.72 | 6.6 / 1.5 | 13.15 / 1.33 | 11.69 / 1.18 | Pearl Whisper |
| 5 dawn | 12.49 / 1.26 | 10.46 / 1.05 | 5.02 / 1.98 | 9.25 / 1.07 | Pearl Whisper |

The script exits 1 when `ROOM_SCENES` disagrees with its picks; `tests/unit/room.test.ts` holds the five values and the director's use of them.

**D6, closed.** The scene hint is a row of scene 1's text grid on both classes, above the count (a row under the count shares the previous and next words' row at 390, where the hint reaches 223 px from the gutter and the words start at 141 px), and `walk.ts` hides it on any arrival at another scene, as a step already did. On the served build it reads at (16, 778) above the count at 390 x 844 and at (45, 688) at 1280 x 800, and no other scene shows it.

**The 2.2.2 control.** `.rm-pause` sits bottom right one row above the previous and next words (44 px plus --s2), as the spec's sections 3 and 5 place it, a plain button whose text swaps between pause and play, hidden until the director sets data-pause (E-S4-loops is pending, so it never showed in these runs) and never in the hall; the unit test holds the stylesheet, the markup and walk.ts to that.

**AC12, the contrast (`scripts/room/contrast.mjs`, `docs/specs/evidence/section-4-flux-contrast.md`).** The script drives the new hooks (`__s4.scene(i)`, `__s4.seek`, `__s4.shade`) and AC12's method: every text box of each scene at rest (the four lines, the hint on scene 1, the previous and next words; the loading line and the 2.2.2 control where they show), the prompt at the station and Skip over the bubble at 25, 50 and 90 percent with scene 1's loop playing, over 10 frames 0.5 s apart at both viewports, the median over the frames of each frame's median ratio and the lowest of each frame's lightest-5-percent ratio. With the reference's shade (85 percent of black at the bottom edge, clear by 0.24 of the height) the four lines' block, which reaches 0.30 of the height at 390 and 0.45 at 1280, stood above the shade: dawn's name read 2.22:1 at 1280 and 2.79 at 390, its shade line 2.29 and the catalog line 3.76 at 1280, palace's name 3.40 and shade line 2.74 at 390. The shade gained a solid band (`SHADE.solid`, the darkening held from the bottom edge up to that share of the height, then clearing linearly by `SHADE.height`) and the lightest setting at which every scene box's median reads 4.5:1 or better is 45 percent of black, solid to 0.45 of the height, clear by 0.72 (at 60 percent the medians ran 9 to 17). The readings with the build's own shade (the lowest median and the lowest worst across each frame's boxes; the whole table per box is in the contrast document):

| Frame | 390 x 844: median | worst | 1280 x 800: median | worst |
|---|---|---|---|---|
| the prompt at the station | **2.36** | **1.91** | **2.85** | **2.71** |
| Skip, the bubble at 25 percent | 17.10 | 17.10 | 11.91 | 11.75 |
| Skip, the bubble at 50 percent | 14.42 | 14.25 | 11.91 | 11.75 |
| Skip, the bubble at 90 percent | 14.42 | 14.25 | 7.28 | 6.25 |
| scene 1 cove (Phone case) at rest | 9.23 | 6.84 | 10.77 | 7.07 |
| scene 2 grove (AirPods case) at rest | 13.60 | 6.47 | 15.60 | 7.20 |
| scene 3 ember (MagSafe wallet) at rest | 16.22 | 13.18 | 13.75 | 4.70 |
| scene 4 palace (Lenskin) at rest | 6.11 | 5.19 | 7.00 | 5.49 |
| scene 5 dawn (Phone case) at rest | 6.56 | 5.70 | 6.02 | 4.79 |

Flagged to Sam, not the shade's to fix: the prompt over the hall's lit grey door reads 2.36 / 1.91 at 390 and 2.85 / 2.71 at 1280 (part one's E-S4-contrast reading, as built). Not shown in these frames: the loading line (every loop was in before its scene was measured) and the 2.2.2 control (hidden while E-S4-loops is pending). The GPU estimate at scene 1 at 390 x 844: 56 geometries, 55 textures, 42 programs, the carousel's own count 21,817,122 B (20.8 MiB).

**AC5, the flash check (`scripts/room/loop-flash.py`, `scripts/room/step-frames.mjs`).** The lands' clip-flash.py method on the ten loops as drawn at rest (decoded by ffmpeg at 24 frames a second, cover-fitted to the viewport of their class at the planes' 1.01 overscan, the bottom shade in the frame, the first second appended after the last frame so the loop's wrap is checked) and on the five steps (the four forward steps and the step back from scene 5) captured from the hooks build one 1/24 s tick at a time (`window.__skreedTick` while the clock is frozen; the loop elements play on at the wall clock, so a frame's video content is whatever the loops show then), 36 frames each at both viewports. AC5's rule as the spec quotes it: no 341 x 256 CSS px region has more than 25 percent of its area flash more than three times in any one second (more than six turns), a flash being a pair of opposing changes of at least 10 percent of the maximum relative luminance where the darker state is below 0.80, the same for saturated red. Every sequence passes; the verdicts are in `src/data/room-flux.json` (`flash` per loop, `flashSteps`):

| Sequence | Viewport | Frames | Most transitions of one pixel in 1 s | Largest share of a region turning together | Most turns of a region in 1 s | Red: largest share | Red: most turns | Verdict |
|---|---|---:|---:|---:|---:|---:|---:|---|
| cove-portrait.mp4 | 390 x 844 | 144 | 3 | 0.1 percent | 0 | 0.2 percent | 0 | pass |
| cove-wide.mp4 | 1280 x 800 | 144 | 7 | 1.4 percent | 0 | 0.0 percent | 0 | pass |
| dawn-portrait.mp4 | 390 x 844 | 144 | 0 | 0.0 percent | 0 | 0.0 percent | 0 | pass |
| dawn-wide.mp4 | 1280 x 800 | 144 | 2 | 0.0 percent | 0 | 0.0 percent | 0 | pass |
| ember-portrait.mp4 | 390 x 844 | 144 | 0 | 0.0 percent | 0 | 2.7 percent | 0 | pass |
| ember-wide.mp4 | 1280 x 800 | 144 | 0 | 0.0 percent | 0 | 5.8 percent | 0 | pass |
| grove-portrait.mp4 | 390 x 844 | 144 | 0 | 0.0 percent | 0 | 0.0 percent | 0 | pass |
| grove-wide.mp4 | 1280 x 800 | 144 | 1 | 0.0 percent | 0 | 0.0 percent | 0 | pass |
| palace-portrait.mp4 | 390 x 844 | 144 | 11 | 5.2 percent | 0 | 0.0 percent | 0 | pass |
| palace-wide.mp4 | 1280 x 800 | 144 | 0 | 0.0 percent | 0 | 0.4 percent | 0 | pass |
| step 1 to 2 | 1280 x 800 | 36 | 7 | 100.0 percent | 2 | 0.0 percent | 0 | pass |
| step 2 to 3 | 1280 x 800 | 36 | 6 | 100.0 percent | 3 | 53.7 percent | 2 | pass |
| step 3 to 4 | 1280 x 800 | 36 | 8 | 100.0 percent | 2 | 35.8 percent | 4 | pass |
| step 4 to 5 | 1280 x 800 | 36 | 7 | 100.0 percent | 4 | 0.6 percent | 0 | pass |
| step 5 to 4 | 1280 x 800 | 36 | 10 | 100.0 percent | 3 | 31.6 percent | 2 | pass |
| step 1 to 2 | 390 x 844 | 36 | 8 | 66.9 percent | 2 | 0.0 percent | 0 | pass |
| step 2 to 3 | 390 x 844 | 36 | 7 | 72.2 percent | 2 | 38.6 percent | 2 | pass |
| step 3 to 4 | 390 x 844 | 36 | 12 | 87.9 percent | 2 | 9.8 percent | 0 | pass |
| step 4 to 5 | 390 x 844 | 36 | 8 | 92.7 percent | 2 | 0.0 percent | 0 | pass |
| step 5 to 4 | 390 x 844 | 36 | 10 | 87.5 percent | 2 | 0.2 percent | 0 | pass |

A step turns a region two to four times in a second (the lights down then up over its second half, and the saturated red of ember's sky in and out), within the six AC5 allows. Not run: five steps back to back at Tune's shortest stepMs, the two seams, the way back and the wrap (the capture driver takes a from-to list; the seams and the wrap need a driver of their own).

**Open after these fixes.** The e2e suite (not run here; the 390 flow gained the layout and prompt assertions); section 6's frame cost (the probe); section 12's documents; the prompt's contrast over the hall (part one); AC5 over the seams, the way back and the wrap; the mid-step frames remain mostly black (the "For Sam" note above stands). Section 9 closes the e2e and AC5's remaining sequences.

**The frames.** `scripts/room/render-stills.mjs` ran as written (no shim) against the served hooks build in the installed Chrome on the Metal GPU, 1 minute 44 seconds for both setups, 24 frames each, the exit landing at scroll 0 and the hall at both viewports. The contact sheets of the fixed build are `docs/specs/screenshots/section-4-flux-fixes-390.jpg` and `section-4-flux-fixes-1280.jpg` (the frames in the stills script's order: the hall's start and station, the bubble at 25, 50 and 90 percent, the five scenes at rest, the mid-step frame, the hold, the exit's cover-in and the frame after the jump, the wrap's cover and its landing, the way back at its half and the hall after it, then the poster tier's hall and five scenes); the sheets of section 4 above stay as the record of the defects.

**Tests, type check and the production build, after the fixes (in the worktree).**

| Command | Result |
|---|---|
| `npm run test:unit` | exit 0; 186 tests, 186 pass, 0 fail (177 before; the layout, the prompt, the placement and the tone tests are new) |
| `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| `npm run build` | exit 0; csp.mjs: 12 pages, media-src 'self'; budget: "every enforced line of section-4-flux.md 6 holds (49 enforced) and AC8's formats check"; guard: "the ten loops and nothing else, media-src 'self'" |

**The budget (the production build after the fixes).** Scripts at gzip, everything else as stored, KB = 1024 B, as budget.mjs prints them; the section's script grew from 27.9 to 29.4 KB with the layout cache, the placement maths, the light and shade hooks and the shade's band, still under Sam's 30 KB line.

| Line | Measured | Line in section 6 |
|---|---|---|
| Section 4's script (director, carousel, video, assets, walk, lazy) | 29.4 KB | 30 KB pending Sam, 38 KB hard |
| scroll.ts (its own chunk, marker skreed:scroll) | 2.8 KB | 4 KB |
| Total JS with section 4 and scroll.ts | 228.1 KB | 250 KB |
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

## 9. The checker's findings on s4/flux-fixes, fixed (2026-10-23)

The same worktree and branch, the hooks build served by wrangler on 127.0.0.1:8791 and driven through `__s4` in the installed Chrome 155 (channel chrome) on the Metal GPU (Apple M3 Pro); the e2e suite in the harness's own Chromium on SwiftShader. The checker's one major finding and five of its minors are closed below; the sixth, the spec's figures, is listed for the lead.

**The tone over the cloud (major), closed.** D5's first fix took the plan's tone from the front scene alone, so under a seam's cloud (Pearl Whisper where it is thickest) the logotype and the Back to top control stayed Pearl and vanished at full cover: the checker read data-tone dark, colour rgb(247, 246, 243), on the wrap at both viewports. The exit's full cover had the same fault since c17d76a, where the frame applied the plan's tone only while the section was on, and after the exit's jump it is off. Now the director sets the plan's toneDark while a seam's cover is 0.5 or more (`toneDark ||= cover >= 0.5`, whatever is under the cloud: the hall, the scenes, or the hero after the jump), and the frame applies the plan's tone whenever the cover is above 0 as well as over the section past the third wipe (loop.ts, after the ride's own write, so it stands). Read at full cover on the fixed build through the checker's driver, the exit once its jump has run (phase out, the page at 0) and the wrap once it has landed (hold), at 390 x 844 and at 1280 x 800: the logotype and the Back to top control data-tone light, colour rgb(56, 63, 67), Urban Slate. The 390 e2e flow now holds the clock at both seams' full cover (`holdAtCover`: a frame watcher freezes the loop's clock on the first frame after the exit's jump and on the wrap's landing) and asserts the tone there, and dawn's own Pearl at rest before the exit and after the wrap; `tests/unit/room.test.ts` holds the director's line and the frame's. The AC5 captures below show it (the exit at frame 10 at 390: the cloud whole, the logotype in Urban Slate on it).

**D4 at the phone (minor), closed.** `scripts/room/product-check.mjs` runs at 1280 x 800 and at 390 x 844 (`--views`). At 390 the Lenskin clipped under the one metallic environment of 1.0: dE00 4.67 with 96.0 percent of its face at 255, the face reading about (255, 181, 196), because the raised portrait placement shows the face from lower down and the metallic finish mirrors the environment's bright ceiling. The sweep, with the key 1.33, the environment 0.48 and the fill 0.17 (the metallic environment on the class in force):

| Metallic environment | 1280 x 800: dE00 | At 255 | 390 x 844: dE00 | At 255 |
|---|---|---|---|---|
| 1.0 | 3.97 | 4.1 percent | 4.67 | 96.0 percent |
| 0.9 | 5.71 | 1.3 percent | 3.21 | 80.9 percent |
| 0.8 | 8.06 | 0.9 percent | 2.64 | 48.3 percent |
| 0.7 | 10.63 | 0.8 percent | 1.86 | 12.2 percent |
| 0.6 | 13.76 | 0.6 percent | 4.44 | 2.2 percent |
| 0.5 | 17.41 | 0.5 percent | 7.87 | 1.2 percent |

No one value serves both (the wide class needs 0.9 or more to stay under dE00 8, the phone 0.6 or less for a small share at 255), so the metallic finish takes the environment per placement class: `LIGHTS.metalEnv` 1.0 on the wide class and `LIGHTS.metalEnvPortrait` 0.6 on the portrait class (`envOf` by the placement's class, applied again when a resize changes the class; the hooks' `lights()` sets either). The readings with the build's own lights, under the white key:

| Scene | Product, shade, finish | Catalog | 1280 x 800: drawn | dE00 | At 255 | 390 x 844: drawn | dE00 | At 255 |
|---|---|---|---|---|---|---|---|---|
| 1 cove | Phone case, Lilac, matte | #c988c8 | #c989c9 | 0.29 | 0.0 percent | #ca89c9 | 0.30 | 0.0 percent |
| 2 grove | AirPods case, Sage, gloss | #96a880 | #95a680 | 0.77 | 0.0 percent | #94a67f | 0.64 | 0.0 percent |
| 3 ember | MagSafe wallet, Desert, matte | #c6a884 | #c6a885 | 0.33 | 0.0 percent | #c6a885 | 0.33 | 0.0 percent |
| 4 palace | Lenskin, Ballerina, metallic | #efa3af | #ea93a0 | 3.97 | 4.1 percent | #e2929e | 4.44 | 2.2 percent |
| 5 dawn | Phone case, Pastel, matte | #d7b9ed | #d7baee | 0.32 | 0.1 percent | #d8baee | 0.25 | 0.0 percent |

**The e2e 390 flow's focus (minor), closed.** At the step the checker named (room.spec.ts, the focus on the prompt off-station) the prompt still held the focus it took as it decoded in at the station, so `page.focus` fired no event and walk.ts never snapped. The spec now blurs the active element, waits for the prompt's is-near class to leave (walk.ts snaps only while the prompt is not near, and the frame clears that state once the page is off-station), then focuses it. The suite (`npm run test:e2e`, the harness's own Chromium 141 on SwiftShader, BASE_URL at the served hooks build) ran in 19.4 minutes: 115 passed, 19 failed. Seventeen of the failures are the quiz's picture specs (quiz.spec.ts 1115 and 2169 to 2732): the 35 quiz photographs live only in the main checkout's src/assets/quiz/pics, never in the repository, so this worktree's build has none; the base c17d76a built the same way fails them the same way. The other two were room specs, and both are closed below. After the two fixes the 390 flow (41 s, with the new tone assertions at both seams' full cover), the cold first-visit wrap (22 s) and the rest of the suite stand as before; the one room spec still failing is AC14, at its line 325, for the lead:

- **The cold first-visit wrap (room.spec.ts 356), a regression of this branch, closed.** The wrap landed with scene 5's `is-on` class and lost it 240 ms later, still under the cover-out. Against the base the spec passes. The cause is a race this branch's timing exposed: the walk chunk mounts only when the section comes within a screen, which on a cold wrap is the landing itself, so the `wrap` line reached the walk before its first frame, and that first frame read the walk's initial state (`hall`) against the frame's `seam` as a hall-to-seam transition, which wipes the shown scene's lines and, after the wipe, its `is-on`. walk.ts now starts from the section's own `data-state` at mount, so a chunk mounted mid-seam sees no false transition.
- **AC14 (room.spec.ts 290) at its line 322, closed.** The hook's entry arrives twice at scene 1 (finishEnter's arrival, then the hook's own), the first with Skip focused (focus goes to the name), the second with the name already focused, which the walk did not count as focus that moves, so it announced the line as well: the name focused and the live region speaking both, which the spec forbids. A scene name already focused now counts as focus that moves to the new name. The same code stands at c17d76a, where the spec fails earlier, at the scene hint (D6).
- **AC14 at its line 325, open.** With every play() rejecting (the spec's stub), scene 1's loop reads `in` but never `refused`: in the installed Chrome as in Chromium, over 12 s at rest, no play() is attempted (`playing` false, `refused` false, no refusal warning), while the pool marks a refusal only on a frame after a play() it made has rejected. The carousel's gate for that play (motion on, the plane's proximity above the play threshold, the loop in and not playing) holds it back on that fixture; which term, and whether the spec's expectation or the gate is wrong, is the lead's to settle. video.ts and the gate are unchanged since c17d76a, where the spec never reached this line.

**scene-tone.mjs (minor), closed.** Its shade term is the plane shader's: 1 minus dark times (1 minus clamp((y / H minus solid) / (height minus solid), 0, 1)), y the pixel's centre from the bottom, so a box inside the solid band would read as drawn. Re-run: every reading under the logotype's and the control's boxes is the same as the table in section 8 (the boxes sit above the band), and ROOM_SCENES matches the picks.

**The record's D4 sentence (minor), closed.** Section 8 now says it in one place: 1.84 of the albedo as drawn before the fix, 1.21 as the spec intended, times 0.83 gives 1.0.

**AC5's remaining sequences (minor), closed.** `scripts/room/step-frames.mjs` captures, one 1/24 s tick at a time as it captured the steps, the exit seam (the raw scroll across q 12.8: the cover in, the jump to scroll 0, the cover out over the hero and the lock), the wrap from scroll 0 (the cover in over the hero, the landing on scene 5, the cover out, the lock), the way back from scene 1, and five steps back to back at Tune's shortest stepMs, 400 (1 to 5 and back to 4, each requested on the first frame the previous one allows: frames 0, 14, 28, 42 and 56 at both viewports; Tune's live copy of the parameters set through `window.__skreedTune.room.params`, which every build reads), 36 frames each and 78 for the burst (`--seq`); `scripts/room/loop-flash.py` reads the new folders (`seam-<W>-exit`, `seam-<W>-wrap`, `seam-<W>-back`, `burst-<W>-<ms>`). The verdicts are in `src/data/room-flux.json` (`flashSteps` re-run on the fixed build, `flashSeams` new). Every sequence passes; the burst at 1280 x 800 reaches six turns of a region on saturated red in a second (ember's sky in and out at the short step), the most the rule allows, so a shorter step than Tune's range offers would fail it:

| Sequence | Viewport | Frames | Most transitions of one pixel in 1 s | Largest share of a region turning together | Most turns of a region in 1 s | Red: largest share | Red: most turns | Verdict |
|---|---|---:|---:|---:|---:|---:|---:|---|
| the exit seam | 1280 x 800 | 36 | 6 | 100.0 percent | 2 | 0.3 percent | 0 | pass |
| the wrap | 1280 x 800 | 36 | 4 | 100.0 percent | 2 | 0.0 percent | 0 | pass |
| the way back | 1280 x 800 | 36 | 5 | 51.6 percent | 1 | 0.0 percent | 0 | pass |
| five steps at stepMs 400 | 1280 x 800 | 78 | 10 | 100.0 percent | 5 | 65.8 percent | 6 | pass |
| the exit seam | 390 x 844 | 36 | 6 | 100.0 percent | 2 | 0.1 percent | 0 | pass |
| the wrap | 390 x 844 | 36 | 6 | 100.0 percent | 2 | 0.0 percent | 0 | pass |
| the way back | 390 x 844 | 36 | 6 | 36.4 percent | 1 | 0.1 percent | 0 | pass |
| five steps at stepMs 400 | 390 x 844 | 78 | 10 | 84.6 percent | 5 | 45.0 percent | 2 | pass |
| step 1 to 2 (re-run) | 1280 x 800 | 36 | 7 | 100.0 percent | 2 | 0.0 percent | 0 | pass |
| step 2 to 3 (re-run) | 1280 x 800 | 36 | 6 | 100.0 percent | 3 | 66.0 percent | 2 | pass |
| step 3 to 4 (re-run) | 1280 x 800 | 36 | 8 | 98.6 percent | 2 | 33.6 percent | 4 | pass |
| step 4 to 5 (re-run) | 1280 x 800 | 36 | 7 | 100.0 percent | 4 | 0.6 percent | 0 | pass |
| step 5 to 4 (re-run) | 1280 x 800 | 36 | 10 | 100.0 percent | 3 | 31.6 percent | 2 | pass |
| step 1 to 2 (re-run) | 390 x 844 | 36 | 8 | 69.6 percent | 2 | 0.0 percent | 0 | pass |
| step 2 to 3 (re-run) | 390 x 844 | 36 | 7 | 54.0 percent | 2 | 42.2 percent | 2 | pass |
| step 3 to 4 (re-run) | 390 x 844 | 36 | 11 | 72.1 percent | 4 | 9.1 percent | 0 | pass |
| step 4 to 5 (re-run) | 390 x 844 | 36 | 8 | 51.3 percent | 2 | 0.0 percent | 0 | pass |
| step 5 to 4 (re-run) | 390 x 844 | 36 | 10 | 73.9 percent | 2 | 0.2 percent | 0 | pass |

**The spec's figures (minor), for the lead.** The build differs from figures the spec (revision 3, the source of truth) states, each reasoned in section 8 but ruled on by nobody; the spec is unchanged on this branch. With the merge the lead either amends it (revision 4) or lists each as pending Sam (F2 for the lights, the size and the shade):

- Lights: the key 1.33, the environment 0.48 and the fill 0.17 with the metallic environment 1.0 on the wide class and 0.6 on the portrait class, where section 3 says 1.6, 0.575 and 0.2.
- Product size and place: the portrait cap 0.50 of the view's height with the centre at 0.60, and the wide holder moved 89 px right at 1280 x 800, where section 3 says 0.55 / 0.62 centred.
- The bottom shade: 45 percent of black, solid to 0.45 of the height and clear by 0.72, where section 3 says the reference's 24 vh shade, darkened; the lower half of every scene is darker than the reference's, and Sam has not seen it.
- The scene hint: in the left column above the count, where the copy table says bottom centre and section 2 says one row above the words.
- The pause control: bottom right with no aria-pressed, where section 10 says top left with aria-pressed; its place goes to whichever section the lead rules.

**The frames.** `scripts/room/render-stills.mjs` ran as written against the served hooks build in the installed Chrome on the Metal GPU, 1 minute 45 seconds for both setups, 24 frames each; the contact sheets `docs/specs/screenshots/section-4-flux-fixes-390.jpg` and `section-4-flux-fixes-1280.jpg` are replaced with them (the same order as section 8's: the hall's start and station, the bubble at 25, 50 and 90 percent, the five scenes at rest, the mid-step frame, the hold, the exit's cover-in and the frame after the jump, the wrap's cover and its landing, the way back at its half and the hall after it, then the poster tier's hall and five scenes). Frame 15, the wrap at full cover, now shows the logotype and the Back to top control in Urban Slate on the cloud at both widths (section 8's sheets showed the blank frame); frame 9, palace, has the Lenskin at the per-class environment.

**Tests, type check and the production build, after these fixes (in the worktree).**

| Command | Result |
|---|---|
| `npm run test:unit` | exit 0; 186 tests, 186 pass, 0 fail (the tone assertions on the director and the frame, the per-class metallic environment) |
| `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| `npm run test:e2e` (the served hooks build, Chromium on SwiftShader) | 115 passed, 19 failed in 19.4 minutes: 17 quiz picture specs (no photographs in this worktree), the cold wrap and AC14, the first two since fixed and re-run green, AC14 open at its line 325 (above) |
| `npm run build` | exit 0; csp.mjs: 12 pages, media-src 'self'; budget: "every enforced line of section-4-flux.md 6 holds (49 enforced) and AC8's formats check"; guard: "the ten loops and nothing else, media-src 'self'" |

**The budget (the production build after these fixes).** As budget.mjs prints it (scripts at gzip, everything else as stored, KB = 1024 B); the section's script grew from 29.4 to 29.5 KB with the cover's tone, the per-class environment and the walk's two lines, still under Sam's 30 KB line. Every other line is section 8's: scroll.ts 2.8 of 4; total JS with section 4 and scroll.ts 228.2 of 250; the poster tier's script 8.0 of 8.5; the ten loops 618.2 to 1,131.7 of 1,200 each; the largest stills grove wide AVIF 43.2 of 110 and WebP 49.2 of 176, portrait AVIF 49.9 of 80 and WebP 61.0 of 128; products.bin 263.6 of 270; to the press wide / portrait AVIF 1,444.7 / 1,459.2 and WebP-only 1,486.6 / 1,506.2 of 1,700; the whole section 10,899.8 of 15,000; one visit wide / portrait AVIF 5,349.5 / 5,334.7 and WebP 5,411.3 / 5,400.6 of 7,300; the poster tier's pictures AVIF 174.1 / 196.8 of 570 / 420 and WebP 197.7 / 223.9 of 900 / 660; the first view's markup and room.css 3.9 of 4; 13 pictures AVIF with a WebP twin, 10 scene img with width and height.

**Open after section 9.** AC14 at its line 325 (above); section 6's frame cost (the probe); section 12's documents; the prompt's contrast over the hall (part one); the loading line and the 2.2.2 control never on screen for AC12 (E-S4-loops pending); the mid-step frames mostly black (the "For Sam" note in section 6 stands); the burst at 1280 x 800 at AC5's limit on red (six turns) at Tune's shortest step; the spec's figures above, pending the lead; the section's script at 29.5 KB of Sam's 30 KB line (pending him).

## 10. The frame cost probe, the e2e suite and the GPU resident set on the merged build (2026-10-23)

Branch `s4/flux-probe` at 3276400 (the merge of `s4/flux-fixes`), in its own worktree, nothing in the code changed. `npm run build:test` (exit 0) was served by `npx wrangler dev --port 8787 --ip 127.0.0.1` from the worktree, the harness's port; the probe and the suite used that one server, one after the other, and it was stopped at the end. Before the build the quiz's photographs were copied from the main checkout's `src/assets/quiz/pics/` into the worktree's own ignored folder, so this build carries them as the main checkout's does (section 9's worktree had none); they are not staged. Apple M3 Pro; Google Chrome 155.0.8059.85 (channel chrome, headless) for the probe; Playwright's Chromium 141 for the suite, as the harness sets it. Other sessions shared the machine (load average 4 to 10 over the runs), so a single reading moves between runs; every probe case ran twice.

**In one paragraph.** On the Metal GPU every case passes with room: the heaviest frame, the wrap's cloud over the hero's composite at 1280 x 800, reads 0.62 P, and a step 0.23 P at most. Under Chrome's 4x CPU throttle with SwiftShader every case fails, the hero at rest on its own included (4.75 P at 390 x 844, 18.93 P at 1280 x 800), so that stand-in cannot settle section 6's check, and no A15-class iPhone or Redmi-class Android was at hand: the frame cost stays open. The section's resident set at scene 1 at 390 x 844 reads 22.92 MiB by its own count, about 36.6 MiB with the hall's estimate, and about 43.7 MiB at the heaviest moment of a step: under the 48 MiB line. The e2e suite, with the quiz's photographs in the build: 133 of 134 pass. The one failure is AC14 at its line 326, which cannot pass in the harness's Chromium (no loop is ever in there) and, in a Chrome that decodes the loops, fails on the code: the carousel calls play() every frame and each call erases the previous rejection before the pool reads it.

**The probe's method.** The family page's probe (`docs/specs/family-page.md` 2.5, and section 18 item 7 as built): the display period P from 10 animation frames with nothing drawn (a blank page in the same browser context, at the same throttle), then 20 renders of the frame under test, each timed from the start of the page's loop frame (`loop.ts` step(): the hero where it shows, section 4's targets, the cloud, the composite) to the end of a one-pixel `readPixels` of the canvas, which returns only once the GPU process has finished the frame. The reading is the median of the 20; pass at 1.25 P or less. Two more readings were kept: the interval between the loop's animation frames, and the GPU time from `EXT_disjoint_timer_query_webgl2`, which Chrome 155 exposes on both back ends here. The timer is not used for the verdict: on Metal its median read more than the median wall time of the same frames in 7 of the 30 cases (all of them frames with the hero's composite, five at 1280 x 800 and two at 390 x 844), which a GPU time spent inside those frames cannot do.

A frame is held while it is drawn 22 times (the first 2 discarded) the way `scripts/room/step-frames.mjs` holds one: the loop's clock frozen (`__skreedFreeze`), advanced one 1/24 s tick at a time (`__skreedTick`) to the chosen point, then probed with the clock held. The frames still draw in full, and the loops play on at the wall clock, so their textures upload as they would. Setups: 390 x 844 with touch at device scale 3, which the hero's touch cap draws at DPR 1.25 (canvas 487 x 1055); 1280 x 800 at device scale 2, which the fine-pointer cap draws at 1.5 (canvas 1920 x 1200). Both on `/?tier=hero3d&glue=0`, the intro skipped, the hall walked to the station through the section's snap. The driver is a scratchpad script, not in the repo. The cases:

- scene 1 at rest, the baseline;
- a step, scene 2 to 3 (grove to ember: both loops playing, the wallet swapping in), held at 3, 5 and 10 ticks of the 0.77 s step (0.125, 0.208 and 0.417 s; the hooks' step 1.41, 1.61 and 1.90, the front switched at the last);
- the exit seam from scene 5: its cover-in over the scenes at tick 3 (cover 0.51), and its cover-out over the hero after the jump to scroll 0 at tick 11 (cover 0.78);
- the hero at rest at scroll 0 with no seam, for comparison (not a case of the spec; second runs only);
- the wrap from scroll 0: its cover-in over the hero at tick 3 (cover 0.69).

**The frame cost on the Metal GPU (Chrome 155, no throttle).** P 16.6 ms in every context (60 Hz). The median of 20, run 1 / run 2, as a share of P, and the slowest single frame of both runs:

| Case | 390 x 844, DPR 1.25 | 1280 x 800, DPR 1.5 | Verdict |
|---|---|---|---|
| scene 1 at rest | 2.45 / 4.40 ms (0.15 / 0.27 P), slowest 5.5 | 2.80 / 3.50 ms (0.17 / 0.21 P), slowest 8.5 | pass |
| step 2 to 3 at 0.125 s | 2.20 / 3.50 ms (0.13 / 0.21 P), slowest 5.0 | 2.50 / 3.60 ms (0.15 / 0.22 P), slowest 6.2 | pass |
| step 2 to 3 at 0.208 s | 1.90 / 2.75 ms (0.11 / 0.17 P), slowest 7.3 | 2.60 / 3.60 ms (0.16 / 0.22 P), slowest 10.4 | pass |
| step 2 to 3 at 0.417 s | 1.80 / 2.50 ms (0.11 / 0.15 P), slowest 6.2 | 2.90 / 3.80 ms (0.17 / 0.23 P), slowest 5.4 | pass |
| exit seam, cover-in over scene 5 | 3.70 / 2.35 ms (0.22 / 0.14 P), slowest 5.3 | 5.95 / 4.50 ms (0.36 / 0.27 P), slowest 8.4 | pass |
| exit seam, cover-out over the hero | 5.05 / 6.00 ms (0.30 / 0.36 P), slowest 12.6 | 7.60 / 8.70 ms (0.46 / 0.52 P), slowest 10.1 | pass |
| the hero at rest, no seam (run 2) | 4.30 ms (0.26 P), slowest 6.6 | 9.25 ms (0.56 P), slowest 12.5 | pass |
| wrap, cover-in over the hero | 6.20 / 5.85 ms (0.37 / 0.35 P), slowest 14.0 | 10.25 / 8.90 ms (0.62 / 0.54 P), slowest 12.4 | pass |

The page's own JavaScript took 0.4 to 1.2 ms of each frame, and the interval between frames was 16.7 ms (1.0 P) in every case, so no frame was dropped. An M3 Pro is neither of the spec's phones; these readings show the frames are light on a laptop GPU and no more.

**The frame cost under Chrome's 4x CPU throttle with SwiftShader.** The installed Chrome with the e2e's flags (`--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`; the renderer reads "SwiftShader Device (LLVM 10.0.0)"), so the loops still decode (Playwright's Chromium has no H.264), and `Emulation.setCPUThrottlingRate` 4 on the page while each case is probed (the positioning ran unthrottled). P 16.5 to 16.6 ms. The median of 20, run 1 / run 2:

| Case | 390 x 844, DPR 1.25 | 1280 x 800, DPR 1.5 | Verdict |
|---|---|---|---|
| scene 1 at rest | 28.20 / 24.55 ms (1.71 / 1.48 P) | 55.55 / 50.50 ms (3.35 / 3.04 P) | fail |
| step 2 to 3 at 0.125 s | 41.20 / 38.65 ms (2.50 / 2.33 P) | 56.95 / 54.90 ms (3.43 / 3.31 P) | fail |
| step 2 to 3 at 0.208 s | 39.70 / 36.05 ms (2.41 / 2.17 P) | 59.95 / 63.15 ms (3.61 / 3.80 P) | fail |
| step 2 to 3 at 0.417 s | 43.00 / 39.70 ms (2.61 / 2.39 P) | 69.65 / 69.45 ms (4.20 / 4.18 P) | fail |
| exit seam, cover-in over scene 5 | 31.05 / 29.30 ms (1.88 / 1.77 P) | 76.15 / 81.25 ms (4.59 / 4.89 P) | fail |
| exit seam, cover-out over the hero | 98.65 / 94.20 ms (5.98 / 5.67 P) | 378.25 / 358.45 ms (22.79 / 21.59 P) | fail |
| the hero at rest, no seam (run 2) | 78.90 ms (4.75 P) | 314.30 ms (18.93 P) | fail |
| wrap, cover-in over the hero | 98.95 / 105.10 ms (6.00 / 6.33 P) | 373.85 / 360.20 ms (22.52 / 21.70 P) | fail |

Two controls, each run once:

- **The throttle off** (the same SwiftShader setup at rate 1), in the table's order: at 390 x 844, 22.65, 36.15, 38.00, 37.00, 26.75, 85.50, 72.55 and 85.30 ms (1.36 to 5.15 P); at 1280 x 800, 49.20, 51.00, 54.10, 64.00, 68.25, 325.25, 284.70 and 322.75 ms (2.96 to 19.59 P). The throttle takes the page's own JavaScript from 0.35 to 0.7 ms a frame to 1.2 to 3.7 ms; the rest of each frame is SwiftShader drawing in the GPU process, which the throttle does not slow.
- **The degrade path's first step, DPR 1** (390 x 844 at device scale 1, canvas 390 x 844, the 4x throttle): scene 1 22.35 ms (1.35 P); the step 30.40, 31.90 and 39.55 ms (1.84, 1.93 and 2.40 P); the cover-in 24.55 ms (1.49 P); the cover-out over the hero 68.25 ms (4.14 P); the hero alone 58.40 ms (3.54 P); the wrap 67.75 ms (4.11 P). Every case still fails. The second step, the cloud at half resolution, has no hook (`carousel.degrade` is not on `__s4`), so it was not measured.

What these say. On SwiftShader the hero at rest by itself costs 4.4 to 4.75 P at 390 x 844 and 17 to 19 P at 1280 x 800, so no frame that shows the hero can pass on this stand-in whatever section 4 does; the section's own frames (scene 1, the step, the cover-in over the scenes) cost 1.4 to 2.6 P at 390, less than the hero alone. A seam over the hero costs the hero plus 13 to 26 ms at 390 and 38 to 46 ms at 1280 on SwiftShader, and at most 2 ms on Metal. That extra is the cloud's pass and, with it, the carousel's whole stage: during a seam over the hall's frame `director.ts` steps the carousel for its cloud, and `carousel.ts` draw() renders the stage (the plane and the product) into its target before the cloud, though only the cloud is shown there. It is the one cost in these frames the section could shed; recorded as a reading, not changed here.

**Section 6's frame cost stays open.** Its pass is on an A15-class iPhone and a Redmi-class Android, and neither was at hand. On the M3 Pro every case passes, the heaviest frame at 0.62 P; under the world spec's stand-in (4x throttle, SwiftShader) every case fails, the hero alone included, so the stand-in cannot settle it either way.

**The GPU resident set at scene 1 at 390 x 844.** At scene 1 at rest, its loop playing, scenes 1 and 2's stills in (both Metal runs and every SwiftShader run read the same bytes; the texture count differs by one between the two back ends):

| Reading | DPR 1.25, the touch cap (canvas 487 x 1055) | DPR 1 (canvas 390 x 844) |
|---|---|---|
| `__skreedGpu()` (the one renderer: the hero, the hall and the section) | 56 geometries, 55 textures (54 on SwiftShader), 42 programs | 56 geometries, 54 textures, 42 programs (SwiftShader) |
| `__s4.state().memory` at scene 1 at rest | 24,032,622 B (22.92 MiB) | 21,817,122 B (20.81 MiB) |
| `__s4.state().memory` mid-step, 2 to 3 held | 31,405,422 B (29.95 MiB) | 29,189,922 B (27.84 MiB) |

The count at scene 1 at DPR 1.25, term by term (the terms of `carousel.ts` memory(), recomputed from the canvas and the files' pixel sizes; they sum to the reading exactly):

- the carousel's target, RGBA8 and depth, 487 x 1055 x 8: 4,110,280 B (3.92 MiB);
- the cloud's target at min(DPR, 1.5), 487 x 1055 x 4: 2,055,140 B (1.96 MiB);
- the products' environment, a PMREM of 768 x 1024 at half float: 6,291,456 B (6.00 MiB);
- the products' geometry (positions x 24 and indices x 2): 516,546 B (0.49 MiB);
- two stills, scenes 1 and 2, 720 x 1280 x 4: 7,372,800 B (7.03 MiB);
- one loop's texture, scene 1's, 720 x 1280 x 4: 3,686,400 B (3.52 MiB).

Mid-step adds scene 3's still and its loop's texture, 3,686,400 B each: two loops and three stills, as section 5 allows. Neither hook counts the hall, which stays resident under the scenes for the way back. The world's memory record (`docs/specs/evidence/section-4-world-memory.md`) estimates it from its sizes at about 13.7 MiB at DPR 1.25 (the 1024 x 1024 lightmap with mips 5.33, the hall's target 3.92, its output pass 1.96, the floor's cube 0.5, the bubble's pass 1.96); the lightmap in this build is still 1024 x 1024. With it the section holds about 36.6 MiB at scene 1 at rest and about 43.7 MiB at the heaviest moment of a step: **under the 48 MiB line, by 11.4 and 4.3 MiB.** Section 6's estimate (two VideoTextures, three stills, the products, the cloud's target) leaves out the products' environment map, 6.00 MiB, the largest single term, and the carousel's own target. At 1280 x 800 (DPR 1.5, not under the phone line): 44,951,746 B (42.87 MiB) at rest and 52,037,570 B (49.63 MiB) mid-step.

**The e2e suite.** `npx playwright test --project e2e` in the worktree, BASE_URL and SKREED_PORT unset, so the harness's port 8787, where the served build was already up and the config reused it; the build identity check read the same `index.html` at the start and at the end (sha256 6d18d4a8dc749320). Playwright's Chromium 141 on SwiftShader with the harness's flags, two workers: **133 passed, 1 failed, 134 tests, in 11.0 minutes.**

| Spec file | Tests | Passed | Failed |
|---|---:|---:|---:|
| a11y-breakpoints.spec.ts | 14 | 14 | 0 |
| countdown.spec.ts | 12 | 12 | 0 |
| csp.spec.ts | 7 | 7 | 0 |
| cue-logotype.spec.ts | 9 | 9 | 0 |
| hover.spec.ts | 4 | 4 | 0 |
| island.spec.ts | 2 | 2 | 0 |
| loader.spec.ts | 6 | 6 | 0 |
| locked-values.spec.ts | 1 | 1 | 0 |
| quiz.spec.ts | 53 | 53 | 0 |
| room.spec.ts | 7 | 6 | 1 |
| tiers.spec.ts | 14 | 14 | 0 |
| to-top.spec.ts | 5 | 5 | 0 |

Section 4's specs, one by one:

- room.spec.ts 72, the 390 x 844 flow (the track, the keyboard, the entry, five steps, the hold, the exit seam with the tone at full cover, the wrap, the way back): pass, 40.0 s.
- room.spec.ts 291, AC14: **fail** at its line 326 (section 9's line 325, one line further down since), after 48.8 s: `loops[0].refused` stayed false over the poll's 30 s.
- room.spec.ts 357, the cold first-visit wrap: pass, 16.9 s.
- room.spec.ts 391, the glue at section 4's seam and Shift+Tab into the quiz (AC4): pass, 21.9 s.
- room.spec.ts 429, Ctrl+wheel in range and the one-finger pan at scale 2 (AC3): pass, 21.0 s.
- room.spec.ts 462, still3d (AC11): pass, 10.9 s.
- room.spec.ts 502, the poster tier: pass, 0.9 s.

The 17 quiz picture specs that failed in section 9 (quiz.spec.ts 1115 and 2169 to 2732) pass here with the photographs in the build, which bears out section 9's reading of them. Every other test passed; the full list is the run's log in the session scratchpad.

**AC14's refused play() (room.spec.ts 291, line 326).** The line is `expect.poll(... loops[0]?.refused ...).toBe(true)`. Reproduced outside the suite with the test's own stub (every play() rejects with NotAllowedError) and routes (products.bin and ember's loop aborted), every play() call counted with its caller by a scratchpad driver, then 12 s at scene 1 after `__s4.scene(0)`:

- **In the harness's Chromium 141, the suite's browser:** no loop is ever in. Chromium has no H.264 decoder, so every loop errors and the pool marks it failed ("the loop ... did not load; its still stays", all five); `loops[0]` reads state failed, in false, refused false. The only play() calls are the pool's read-ahead nudge from its suspend handler (4 in all). A refused play() needs a loop that is in, so in this browser line 326 cannot pass whatever the code does; what the browser does show, the still kept and no video playing, is AC14's state for a loop that failed.
- **In the installed Chrome 155, which decodes the loops:** scene 1's loop is in, and play() is called once a frame, 699 calls in 12 s (704 frames), every one from the carousel's gate (`carousel.ts` update(): `motionOn && loopShouldPlay(...) && video.in(L) && !video.playing(L)`, then `video.play(L)`) through `video.ts` start(). Each is rejected, and `refused` stays false. The order inside a frame is why: the rejection lands as a microtask after the frame and sets `playAt` to -2; on the next frame the gate runs first and calls play() again, and start() sets `playAt` to the current time, overwriting the -2 before texture() (called after the gate, for the plane's map) reads it; the same call restarts the 1.5 s no-frame clock, so that never runs out either. Section 9 read this as no play() attempted; the call count says otherwise.

What the assertion needs:

1. A browser that decodes the loops for this spec: the installed Chrome (channel chrome, or CHROME_PATH pointed at it), since in the harness's Chromium the case it tests cannot arise. If the suite stays on Chromium, the line needs a branch on `loops[0].state === 'failed'` that asserts the still and no playing video instead of the refusal.
2. With the loops decoded, the assertion as written is what section 5 and AC14 ask (a rejected play() marks the element refused, and a refused loop is retried on the next input), and the code fails it. For it to pass, a rejected play() has to survive until texture() reads it: for example start() leaving `playAt` at -2 once a play() has been rejected, or the gate not calling play() again while one is pending or refused. Until then the page retries play() at the frame rate rather than on the next input, and by the code the plane draws the paused element's frame (the loop counts as in) rather than the scene's still. Nothing was changed here; the fix is the builder's, and which form it takes is the lead's to rule.

**Open after section 10.** Section 6's frame cost on an A15-class iPhone and a Redmi-class Android; AC14 at its line 326 (the harness's browser for it, and video.ts's refusal under the per-frame retry); the seams over the hero drawing the carousel's whole stage for the cloud alone (a cost reading); the cloud at half resolution, the degrade path's second step, with no hook to measure it. The rest of section 9's open list stands.

## 2026-10-26: the AirPods case, the Lenskin and the hover look

Sam, 2026-10-26, with his Blender view of the AirPods case and two Cycles renders of the Lenskin: "the 3d models for airpods are supposed to look like this, and for lenskin as well, not the color, but the smoothness and the visibility, compare it visually and check how it renders on the site, it looks a little different"; then "inspect the way the 3d model moves on hover on the flux site, i want these models to move exactly like that on hover, the 3d models here dont move at all on hover unless clicked and held and dragged the mouse". Done on branch `claude/3d-model-rendering-airpods-1047b9` on the Windows machine (no Blender, no FBX sources; the dev server through the `astro-dev-win` launch entry, the frames by the installed Chrome on the Intel UHD GPU through Playwright).

**What was wrong, measured on `products.bin`.** The AirPods lid is one open sheet of 2,200 triangles whose faces all wind outward from the lid's own centroid, 1,850 of them pointing away from the camera: from the front the camera sees the sheet's back face, which the front-side material culled, so the open lid was missing from every front view (the thin sliver in the old frames was its rim). The shell is an open sheet too. The Lenskin's mesh is a closed solid with 40 to 54 segments a hole, so its holes are round; what read as roughness was the frame itself: the carousel drew into a render target with no multisampling, and every silhouette and hole rim came out stair-stepped (3x crops of the old frames show single-pixel steps along each hole). Neither product's geometry needed a re-export, which this machine could not have done.

**The fixes.** (1) Every product part's material is `DoubleSide` (three flips the normal on a back face, so the lid's inside lights as a surface). (2) The frame target is multisampled (`MSAA` 4, `WebGLRenderTarget({ samples })`), counted in `memory()` as colour and depth at 4 samples plus the resolve texture. (3) Rest poses from his references: the AirPods case tipped 0.42 rad toward the camera (his Blender view from above; the lid and the shell's mouth show), the Lenskin turned 0.55 rad with 0.12 of pitch (his renders' three-quarter view; the thickness and the hole walls show); `basePitch` joins `baseYaw` in `ROOM_SCENES`, and `poseWeight` fades the pose to nothing by the half step so the swap stays edge-on. (4) The look is the reference's cursor tilt, read from the live bundle (BottleRigV2's `di`: `mousemove` on the window, x and y in minus 1 to 1 with y down, 0.3 rad each, eased by 1 minus 0.9 to the power of 60 dt, the last place held, the tilt on by default): the mouse moves the product by hovering anywhere in the viewport while a scene is up; a finger still moves it while it presses (E-S4-hover; X-14 amended).

**Frames.** `docs/specs/screenshots/section-4-products-1280.jpg` and `section-4-products-390.jpg`: each product at rest, then under the mouse low right and up left. Unit tests: `poseWeight` (1 at rest, 0 from the half step), the look's easing and return, the pose gone at the swap, every part double-sided (room-carousel.test.ts); `basePitch` finite (room.test.ts). The whole unit suite passes (188 tests, one skipped as before); `tsc --noEmit` is clean. Not run here: the e2e suites and Lighthouse.

**Still for Sam.** The two rest angles (section 11, item 14); whether the case and the wallet should be posed too; the Lenskin's metallic finish reads flatter than his matte Cycles render because the finish is the catalog's metallic under the room environment ("not the color", so left).
