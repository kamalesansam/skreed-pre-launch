# Section 4, part two: the Skreed world (spec)

Written 2026-10-20 from Sam's brief of 2026-10-19 and his answers of 2026-10-19 and 2026-10-20. Status: the plan for the build loop (`plan`, then `build`, then `review`). This spec **replaces** these parts of `docs/specs/section-4.md`: section 2's "The transition" and "The universe", the universe rows of section 4's motion table, the products list and the label in section 5, E-S4-sweep and E-S4-colour in section 10, and the universe items of section 11. Everything before the press stays as section-4.md and its section 12 build record say: the hall, the walk, the door, the station, the third wipe from the fog, the poster tier's hall still, and the loop screen that wipes back to the hero and jumps to scroll 0. The numbers measured on igloo.inc are in `docs/specs/evidence/section-4-world-igloo.md`, quoted here with their source. Nothing of igloo ships: the rings, the lattice, the particles and the garden are our own geometry, shaders and Blender renders.

**Sam's brief, verbatim (2026-10-19).** "for section 4, after the door opens, we will have a travel animation as how it is there on the igloo site, i'm talking about this section, the moment the door opens, remove the lines of color animation and have a wavy circle zooming from centre to the end of the screen animation instead, where the inner part of the wavy outline circle is colorful and the exterior is dark and grey, and the wavy circumference of the circle just wobbles like a bubble wall and slowly gets bigger till filling the screen size, and once the animation is done, this section of the igloo site will come on the screen, it should be smooth, and instead of scrolling it automatically moves towards all those circle blocks, but that entire section is white and grey, but we will make it colorful instead, all the mini geometrical grids and lines everything will be colorfull, even the backround will be like a bright beautiful day garden kind of area and we will be travelling through this round blocks and then by the end of the travel we will have a particle morphism animation which will transition into a 2d picture, and also go inside the world which is basically the central park in new york, i have attached the 2d picture for you, and then from there after scroll trigger it will travel through the central park again which will land into another 2d picture which will be a lifestyle image of another person in central park using airpods cases with airpods, and then the same with lenskin as well, so the story is from a grey room now we enter the immersive colorful world of skreed, so each 2d land will look something similar to the image that i attached, it could be different, but that's the basic idea of the lifestyle image". The screenshot was igloo.inc's entry dive; the picture was Skreed's own listing image `A3-lifestyle-iPhone-17-Pro-Max.png` (a woman against a pink wall holding a phone in a yellow case, yellow flowers).

**His answers.**
- 2026-10-19:
  - the round room with the four 3D products on pedestals is replaced;
  - all four products get a land: phone case, MagSafe wallet, Lenskin, AirPods case;
  - the pictures and the garden come from Blender and Higgsfield;
  - for the travel through the park, build all three options behind a Tune toggle and he picks one: (A) the pictures in depth, (B) a modelled park, (C) generated video clips.
- 2026-10-20:
  - the pictures start from his own listing photos, with Higgsfield moving each person into Central Park and keeping the product;
  - up to 300 Higgsfield credits;
  - video is allowed on staging and dev now, and in production only if he picks C;
  - section 4 is plain text on the scene everywhere, in section 2's label type with its decode: the prompt, Skip, the hints and the lands' text, and the orange prompt button goes. This is his rule of 2026-10-19 for the quiz: "just plain text on the fog backround with the same animation, no boxes or anything".

## 1. Goal

Turn the press at the door into the story Sam told: from the grey hall, through a bubble, into a sunlit garden tunnel of colourful rings, and out into four lifestyle pictures in Central Park, one per product, each the visitor can step into before travelling to the next. It serves goal 1 of the stack in `docs/00-IDEATION.md` ("Position Skreed as a lifestyle brand that connects, not a tech brand"): the products appear for the first time in people's hands in a real place, after the grey hall withholds colour for ten screens.

## 2. Phone-first wireframe in words

### 390 x 844, 3D path

**Before the press.** As section-4.md and its section 12 say, except the controls are plain text (section 3 here). Near the door the prompt decodes in over the door's handle: `[E] ENTER SKREED UNIVERSE` on a device that can hover, `ENTER SKREED UNIVERSE` on touch.

**The press, 0 to 0.9 s.** Unchanged: the leaves swing 95 degrees (cubic ease-out) and from 0.3 s the camera glides 1.6 m into the doorway (cubic ease-in-out). The prompt's text wipes out (0.2 s). `SKIP` decodes in at the bottom centre and stays until the first land (section 4, WCAG 2.2.2). There is no white-out and there are no bands.

**The bubble, from 0.35 s for `bubbleMs` (Tune, default 2000 ms).**
- A wavy circle opens from the screen's centre and grows until its edge has cleared the farthest corner.
- Inside it the garden tunnel is already moving: the camera glide of the next beat runs from the bubble's first frame.
- Outside it is the hall's own frame, darkening and losing colour as the circle grows: luminance mixed toward Urban Slate by up to 50 percent, then multiplied by up to 0.6, both scaling with the radius. "dark and grey" are the hall's own pixels, not a new colour.
- The edge wobbles like a bubble wall: five angular modes (2, 3, 5, 8 and 13 lobes, weights 0.34, 0.28, 0.20, 0.12, 0.06), each phase advancing on its own rate (1.3, 1.9, 3.1, 4.6 and 6.8 rad per second). The amplitude eases from 12 percent of the radius when small to 2.5 percent at the end.
- The radius grows monotonically and faster than the wobble moves the edge (`dR/dt > A x omega` at every frame), so every pixel crosses from outside to inside once (WCAG 2.3.1).
- The radius pops to 8 percent of the short side over the first 12 percent of the time (an ease-out-back), then grows at a constant zoom rate, `R = R1 x (Rend / R1)^u`, to `Rend` = the half-diagonal plus the final amplitude plus the rim plus 2 px.
- The edge is a 2 device px Pearl Whisper outline (the "wavy outline circle"), antialiased in device pixels by a true distance to the wobbling curve. No iridescence, no shade ring on the edge (rules 1, 21, 24).
- The inside is sampled with a small lens pull near the edge, like the film of a bubble: up to 6 device px, fading over 24 px.

**The ring travel, from 0.35 s for `travelMs` (Tune, default 6500 ms).** "instead of scrolling it automatically moves towards all those circle blocks".
- **The camera.** It flies level along the tunnel by itself and ignores the page's scroll. Its ease is igloo's own, `cubic-bezier(0.6, 0, 0, 1)` (measured, evidence file 4): a slow start inside the bubble, the rings passed in the fast middle, a long settle into the morph.
- **The rings.** `ringCount` (Tune, default 5) shattered rings stand across the flight path, spaced S = 2.5 units apart. Each is igloo's proportions (evidence file 8): outer radius 0.16 S, inner about 0.116 S, thickness 0.052 S. The camera starts 1.26 S before the first ring, where it fills about 116 percent of the frame height on a laptop and is wider than the screen on a phone.
- **The ten families.** Each ring is cut into ten 36-degree arcs in the ten families' key shades by id, in catalog order clockwise: the gems' ten, and the old universe's ten bays. Each ring is turned 36 degrees from the one before, so the colours step as the visitor passes.
- **Assembly.** The ring far ahead is broken: shards pushed outward along their own centre vector, spun about a random axis and shrunk. It pulls together between 1.4 S and 1.0 S from the camera and is whole as the camera passes through. That is the behaviour seen on igloo (evidence file 5: "far rings are spread apart and they come together between about 3.5 and 2.5 units").
- **The lattice.** Each shard face carries our own triangle lattice (the intro's `tTri`, already on the GPU) in the next family's key shade. A forcefield disc fills each ring's hole, 0.13 S in radius and 0.06 S ahead of the ring: the lattice plus concentric and radial lines in the arc's shade, brightest at the rim, fading toward the centre, fading out as the camera passes through.
- **The garden.** The backdrop is our own bright day garden: a Blender render of a lawn, flower beds, clipped hedges and trees under a clear sky, as an equirectangular panorama around the flight path. The flight is level, so the camera sees its horizon band, never its poles.
- **The lens.** The FOV opens from 22 to 30 degrees over the glide (igloo, evidence file 2), with the portrait zoom `min(1, aspect x 1.5)`.
- **The roll.** A gentle roll of `travelRoll` degrees (Tune, default 40) over the ring passes, back to level for the morph. igloo turns half a turn; that is a vestibular risk on a phone, so it is Tune's to try.
- **No flash.** There is no glitch flash at the rings (WCAG 2.3.1). At least 0.4 s passes between two ring passes at the glide's fastest.

**The particle morph, from the last ring's pass for `morphMs` (Tune, default 1800 ms).** "by the end of the travel we will have a particle morphism animation which will transition into a 2d picture".
- **Points.** 32,768 points on phones and 65,536 on laptops start as samples on the last ring's shards and forcefield. On the 3D path the count is per touch, not per screen width.
- **Paths.** Each flies on a curved path, with a swirl about the view axis that unwinds as it lands. The centre of the picture lands first.
- **Landing.** Each lands on its cell of the first land's picture, set as a plane filling the frame, and takes the picture's colour: an antialiased mosaic, each cell the picture's average. The cells are sampled on a jittered grid, never a regular dot grid (rule 43). The points are round and opaque, never additive (rule 42) and never twinkling (rule 44).
- **The picture.** It fades in under the points over the last 0.6 s, then the points fade out. Points near the camera are capped at 24 x DPR pixels.

**A land, at rest** ("each 2d land will look something similar to the image that i attached").
- **The picture.** The land's lifestyle picture fills the stage, cover-fit: a portrait crop on phones, a wide crop on laptops (section 3 says where each crop comes from).
- **The text.** It decodes in on arrival (section 2's decode, as the quiz): the product's name at 18 px (22 on laptops), then its shade and family line, then the catalog line at 12 px (13), then the count `1 / 4`, bottom left inside the gutters above the safe area, Pearl Whisper on the picture.
- **Contrast.** Each crop is composed with a darker, quieter area under the text (section 3). The measured ratio per land is recorded in the review; below 3:1 it is flagged to Sam, never boxed (his rule).
- **The camera** is still at rest: no idle drift (WCAG 2.2.2), no pointer-following light (rule 13). On laptops the pointer sways the head as in the hall.
- **The hint.** On the first land the hint decodes in under the text: `SCROLL TO TRAVEL` on touch, `SCROLL OR PRESS DOWN TO TRAVEL` on devices that can hover. It goes on the first travel.

**The travel between lands** ("after scroll trigger it will travel through the central park again which will land into another 2d picture"). A scroll past the land's trigger, 0.4 screens beyond its station, starts the travel to the next land on its own clock, `landTravelMs` (Tune, default 2600 ms). Scrolling 0.4 screens back before its station starts the travel back. The page is never held (D13 of section-4.md). The trigger reads `q`, so the wheel, touch, the keys, the scrollbar and assistive scrolling all start it. When the travel ends and the scroll has been still for 150 ms (`scrollend` where it exists), the page is set to the new land's station in one instant `scrollTo`, and the triggers re-arm once `q` is back inside that land's hold zone. `parkTravel` (Tune) picks how the travel looks:
- **A, the pictures in depth (default).** The land's picture, with its depth map, becomes a displaced grid, so the camera pushes into it: up to 0.35 of its near distance, with a slight sway, over the first 45 percent. Then the grid breaks into points that stream past the camera; behind the camera each takes the next picture's colour and position and settles into it as the camera arrives at the next land's capture pose. The next picture fades in under the settled points. Back plays the same in reverse.
- **B, a modelled Central Park.** The picture cross-fades over 0.4 s into our own low-poly Central Park model, seen from a pose matched to the picture. The camera flies a path through the park (paths, lawns, trees, a lake and a bridge, the skyline as a backdrop) to the next land's matched pose, and the next picture cross-fades in over 0.4 s. Back flies the path in reverse.
- **C, video clips.** A generated clip from this land's picture to the next (first and last frame given, 3 s) plays in the scene as a video texture and hands over to the next land's still, which is the clip's last frame, in a 0.2 s cross-fade. Back cross-fades to the previous still over 0.4 s.

**After the last land.** The AirPods case is fourth in the catalog's order (section 3). Scrolling on from it reaches the loop screen: the fourth wipe from the land's picture to the hero at rest, then the jump to scroll 0, exactly as today (section-4.md section 5, "The loop"; `lapReset` 1 walks the hall again on the next lap).

**Scrolling back past the first land.** The first land holds while the visitor scrolls back up through the screens where the hall was, as the universe held at yaw -60 before. The third wipe plays from the land back to the fog at q 0 to 1.

**Skip.** `SKIP` is present from the press to the first land's arrival, about 8.3 s at the defaults. Activating it ends the bubble, the travel and the morph at once on the first land, decoded. On each travel between lands it is present again and lands at once. Escape does the same; so does Enter or Space while the pad has focus. A tap on the stage no longer skips: a thumb stopping a scroll's momentum must not end the sequence.

### 390 x 844, poster path (no WebGL2, data saver, reduced motion on the poster tier, a failed boot or asset) and no JavaScript

- **Before the press.** The hall's still and the prompt as plain text, as today.
- **The press.** It cross-fades to the first land's picture (300 ms; a cut under reduced motion). The four lands then stand one per screen in a column, each its picture (AVIF with WebP, `width` and `height`, lazy, on a `--skeleton` box of its aspect ratio until it decodes) with its text under it on `--night`. Never 2 x 2, never four in a row (rules 8, 26, 33).
- **Without JavaScript.** The hall still, then the four lands as the same column, all at once.
- **Data saver.** On the poster tier under Save-Data, the lands' pictures load only when each is within one screen, not all four with the first.

### 1280 x 800

The same sequence. The rings fill the frame wider, and the particles double. The land text sits bottom left at the laptop's inset, at its laptop sizes, within 520 px. The pictures are the wide crops. The pointer sways the head by `lookYaw` and `lookPitch`, as in the hall, held still while over a control.

## 3. Content

**Copy** (`src/config/room.ts` `ROOM_COPY`, sentence case in the source, printed in capitals by the decode as section 2 prints its labels; the accessible names keep the sentence case, as the quiz does):

| Id | Text | Where |
|---|---|---|
| `enter` | Enter Skreed universe | the prompt |
| `key` | E | the prompt's key, shown as `[E]` on devices that can hover |
| `skip` | Skip | through the bubble, the travel, the morph and each travel between lands |
| `landHintTouch` | Scroll to travel | the first land, touch |
| `landHintKeys` | Scroll or press Down to travel | the first land, devices that can hover |
| `loadingLand` | Loading... / Still loading... (from 8 s) | under a land's text when the next land is not in yet |
| `landsAria` | The Skreed world: our products in Central Park | the lands list's label |
| `count` | `n / 4` | each land, tabular |

**The lands**, in the catalog's order (pages 15 to 19), each with its listing photo, its product and its line (the catalog's sentence with rule 17's words dropped, as built in `ROOM_PRODUCTS`):

| # | Product | Base picture (Sam's listing photo) | What Higgsfield changes | Line |
|---|---|---|---|---|
| 1 | Phone case | `A3-lifestyle-iPhone-17-Pro-Max.png` (the picture he attached, a case in Mellow Yellow) | the pink wall becomes Central Park: the Mall's elm canopy in afternoon sun; the person, the phone and the case are kept | the Tough case's line, as built |
| 2 | MagSafe wallet | a second listing photo from `~/Downloads/amazon listing/image listing/lifestyle/17 promax/` with a different person and family | moved into Central Park (Bethesda Terrace's arcade); our MagSafe wallet, from our Blender render, added on the phone's back | the wallet's line |
| 3 | Lenskin | a third listing photo, a third family | moved to the lawn of Sheep Meadow with the skyline beyond; our Lenskin, from our render, set on the phone's camera plateau | the Lenskin's line |
| 4 | AirPods case | a fourth listing photo, a fourth family | moved to Bow Bridge over the Lake; our AirPods case in the free hand, open, earbuds inside ("using airpods cases with airpods") | the AirPods case's line |

- **Choosing the photos.** The build picks the photos for 2 to 4 so that the four lands show four different families and people. Each pictured case's shade is identified by id by measuring the case against the catalog (as AC3 of section-4.md does) and named in the land's text. The wallet, the Lenskin and the AirPods case take the shades in `ROOM_PRODUCTS` (Desert, Crimson and Sage) unless a render in another shade sits better on the person's case; the shade shown is the shade named.
- **Each land picture.** One master per land (2k, square, like the listing photos) is outpainted to a 9:16 portrait master and a 16:10 wide master, so both crops show the same person and the same place. Each is composed with the product in the upper 60 percent of the portrait frame, the product the sharpest thing in it, and a quiet, darker area at the lower left for the text.
- **Approval.** Sam approves each master before it is encoded. Until he has, the land is not built into the page; no placeholder ships (CHECKLIST F2).

**The garden.** One equirectangular render from Blender (`scripts/room/garden.py`, our own geometry, Cycles on the Metal GPU): a mown lawn, beds of flowers whose colours are the ten key shades by id, clipped box hedges, a few trees with sunlit canopies, a clear blue sky with soft clouds, the sun behind the camera at 35 degrees. 4096 x 2048, shipped at 2048 x 1024.

**Alt text** (`ROOM_COPY.landAlt[i]`, the poster tier and the lands list). It describes the scene and the product by shade name, never claims a place a generated picture was not taken in, and never names or describes a person's identity. For example: "A person in a park under tall elms holds a phone in a Sunflower case." The hall's still keeps its alt.

**Colours.**
- The rings: the ten key shades by id (`ROOM_BAYS`).
- The lattice and the lines: the next family's key shade by id.
- The bubble's outline and the text: Pearl Whisper.
- Outside the bubble: the hall's frame, mixed toward Urban Slate.
- The garden and the pictures: image content (E-S4-garden, E-S4-photo).
- The list on the poster tier: `--night`.

## 4. Motion plan

No library: the island's own loop for the camera and the shaders; section 3's decode (`src/scripts/quiz/decode.ts`) for the text; the Web Animations API for the poster tier's cross-fades. Everything DOM moves by opacity only, and the decode swaps characters (E-S3-motion's pattern).

| Trigger | What moves | How |
|---|---|---|
| near the door (2.8 m) | the prompt | the decode in (0.4 s alpha, 0.75 s roll); out in 0.2 s on leaving |
| press, 0 to 0.9 s | the door's leaves | 95 degrees, cubic ease-out (unchanged) |
| press + 0.3 s, 0.9 s | the camera | 1.6 m forward, cubic ease-in-out (unchanged) |
| press + 0.35 s, `bubbleMs` | the bubble | radius from 0 to `Rend` (section 2), the wobble, the outside darkening |
| press + 0.35 s, `travelMs` | the ring camera | level flight on `cubic-bezier(0.6, 0, 0, 1)`, FOV 22 to 30, roll to `travelRoll` and back |
| a ring 1.4 S to 1.0 S ahead | its shards | from broken to whole (the falloff of camera distance) |
| the last ring's pass, `morphMs` | the points | from the shards to the picture; the picture fades in over the last 0.6 s, the points out |
| arrival at a land | its text | the decode in, one line after another (`showAll`, step 0.12 s) |
| q past the land's trigger | the travel | `landTravelMs`, option A, B or C (section 2) |
| the last land, scrolled on | the fourth wipe | as today |

**Reduced motion** (`motion.ts`). On the poster tier, the stills and the column of lands (section 2). On the 3D path under `still3d`:
- no door swing and no glide;
- the bubble is a 600 ms dissolve from the hall to the garden tunnel's first frame;
- the tunnel holds still for 1 s, with no flight, no assembly and no roll;
- a 300 ms cross-fade to the first land;
- each travel between lands is a 300 ms cross-fade, with no video and no points;
- the text appears by a 0.2 s fade, no roll.

Nothing moves on its own for more than the 8.3 s from the press to the first land, and Skip stops it throughout (WCAG 2.2.2; DESIGN.md's 5 s house rule).

## 5. Data and states

**Inputs.** The section's progress `q` (section-4.md section 12's cached layout); the keys (Up and Down, W and S, E, Enter, Space, Escape, while the pad or a section control has focus); Pointer Events on the pad; `hover: hover` and `prefers-reduced-motion` through `motion.ts`; Tune's `parkTravel` and the beats.

**Outputs.** The visitor's place (`q`, the land), analytics through `track()`: `room_view`, `room_walk`, `room_enter`, `room_skip`, `room_land { id }` (a land reached), `room_travel { from, to, option }`, `room_loop`. Nothing is stored (B3).

**The scroll map** (`config/room.ts`, in screens of the section's own height).
- **In the hall** (unchanged): the third wipe 0 to 1, the walk 1 to 9, the station 9 to 10, the loop screen 10 to 11, the tail 11 to 12, and one more screen: 13 screens, 1300svh.
- **Once entered:** the lands' stations at q 10, 12, 14 and 16 (`landQ(i) = 10 + 2i`), each holding from 0.4 screens before its station to 0.4 after. Then the loop screen 17 to 18, the tail 18 to 19, and one more screen: 20 screens, 2000svh.
- `room.css` carries the literals (`1300svh`, and `2000svh` under `[data-state="world"]`); `tests/unit/room.test.ts` reads them against `ROOM_HEIGHT` and `ROOM_HEIGHT_WORLD`, and checks that `loopStart + loop + tail <= height - 1`.

**States** (`section#room[data-state]`).
- `hall`: the walk.
- `entering`: the door, the bubble, the travel and the morph, on one clock.
- `world`: the lands, with `data-land` 0 to 3 and `data-travel` while a travel between lands runs.

Every clocked state holds the loop screen at 0 (today only `entering` does: `director.ts:165`), so a fast scroller can never jump to the hero mid-travel. `reset` (back to top, `__skreedTop`) stops every clock in every state.

**The DOM** (`src/components/room/Room.astro`, in the after-track slot after the quiz).
- The prompt: `button.rm-enter.rm-link`, plain text with the quiz's link pattern. A 44 px hit area, never `hidden` in the hall, clipped until near; its text is split by the decode.
- The pad: `div.rm-pad[tabindex=0]`, unchanged, with its inset two-tone ring.
- Skip: `button.rm-skip.rm-link`, plain text.
- The hint and the loading line: `p.rm-line`, plain text, `role="status"` on the loading line.
- `ol.rm-lands[aria-label=landsAria]`, one `li.rm-land[data-id]` per land. Each holds:
  - the picture, as `picture.rm-land-pic` (portrait AVIF and WebP, wide AVIF and WebP, `alt`, `width` and `height`, `data-srcset` until the poster tier or the island asks for it);
  - the text: `h3.rm-land-name`, `p.rm-land-shade`, `p.rm-land-line` and `p.rm-land-count`.
- On the 3D path the pictures are not fetched as DOM images; the island loads the same files. Only the active land's text is shown, over the canvas. The others are `hidden` until they are reached, then stay in the accessibility tree.
- The live region `p.sr-only#rmLive` announces "Land n of 4: name, shade" on arrival.
- No `style` attributes (the CSP): positions through the CSSOM.
- Removed: the products list, the label panel, `#rmLabel` and the universe's strings.

**The island** (one renderer, one context; section-4.md section 12's module pattern).
- `section4/transition.ts`: the bubble replaces the white and the bands in the same full-screen pass, with `plain` mode kept for the fog's fade hand-off. Its inputs are `hall.out` and `world.out`; the radius, the amplitude and the five phases are set on the CPU every frame.
- `section4/world.ts` (new, replaces `universe.ts`): the garden dome, the rings, the forcefields, the morph's points and the land picture.
  - It renders into one 8-bit target with depth, display values written by hand (`toSrgb`), `NoToneMapping` around the draw, no output pass; on laptops `post.ts` with bleach 0 may add the screened bloom.
  - The rings are generated at load from a seed, about 2,000 triangles per ring, with no asset. Each shard carries its centre, a random spin and its shade index.
  - The picture textures are untagged (bytes in, display values out), mipmapped, decoded by `createImageBitmap`.
- `section4/travel-depth.ts` (A), `travel-park.ts` (B) and `travel-video.ts` (C): one lazy chunk each.
  - In production only the option `parkTravel` names is built into the bundle, through a build-time constant.
  - With Tune on, the chosen option loads on demand, and switching disposes the previous option's GPU resources.
- `section4/director.ts`:
  - its states: `hall`, then `entering`, then `world`;
  - one clock across the bubble, the travel and the morph, and each between-lands travel on its own;
  - the triggers and the instant set at `scrollend`;
  - the loading in phases (below);
  - the loop hold in every clocked state;
  - the hooks: `__s4.state()`, `enter()`, `seek(sec)` across the entry clock, `land(i)`, `travel(i, j, p)` for the review frames, and `skip()`.
- The composite's shader is unchanged (it is pinned byte for byte, `tests/unit/glsl-v11.test.ts`). The section hands it one texture per frame, as today.

**Loading, in phases** (one compile or one upload per frame at most, so the quiz above never stutters; `quiz.spec.ts:117` already notes the set-up on the main thread).
1. When `#find` comes into view: the director's chunk and the hall (as today).
2. Once past the third wipe: the world's chunk, the garden, the rings' generation, the first land's picture (and depth map for A), and the shader compiles with the world's target bound, all during the walk.
3. On the press: the chosen option's chunk.
4. On arrival at each land: the next land's picture, depth map (A) or clip (C).

A press that arrives before phase 2 is done makes the prompt busy: its text reads `Loading...`, then `Still loading...` at 8 s, `aria-busy`, and it enters by itself when ready. The busy wait is dropped if the visitor walks away (the pattern built today).

**The poster path and failures.**
- **A failed garden or ring asset:** the section falls to `data-tier=poster`, the island runs on, and the hero is untouched (as today).
- **A failed land picture on the 3D path:** that land shows its text on the garden, and the travel to it is a cross-fade.
- **A failed option chunk, park model or clip:** that travel falls to A; A failing falls to a cross-fade.
- **A clip whose `play()` is refused** (iOS Low Power Mode): it falls to A.
- **A context loss:** the hero's hard poster path and the section's poster layout, as section-4.md says.

**States (CHECKLIST D3 and H).**

| State | Section 4, part two |
|---|---|
| Empty | n/a: nothing is entered or chosen |
| Loading | The world loads during the walk. A press before it is in makes the prompt busy (above). A travel triggered before the next land is in waits on the current land with `Loading...` under its text, then `Still loading...` at 8 s, and starts by itself when it arrives; scrolling back cancels the wait. On the poster tier each picture stands on its `--skeleton` box until it decodes (H1). |
| Error | As "The poster path and failures" above: never a blank, never a hold at white |
| No internet | Everything loaded works. A land not yet loaded behaves as Loading, then as Error (its text on the garden) after the fetch's 20 s timeout (`model-fetch.ts`'s pattern) |
| Slow network | As Loading, with the 8 s line |
| No results, Permission denied, Session expired, Form validation | n/a (no search, no sensors, no session, no form) |
| Success | Each land reached; the loop |

## 6. Budget

Everything of part two loads lazily, outside the first view, as section-4.md section 6 measured for part one. KB are 1024 B; scripts gzip; images, models and clips as stored.

**Freed by removing the universe** (measured in section-4.md section 6): the universe chunk (9,026 B), `room.glb` (38,240 B as stored), its lightmaps, the three product GLBs (90,052 B), and the case LOD1 on this page (54,688 B). The product GLBs move out of `public/` into `scripts/room/models/`, where they are Blender references only.

| Part | Line | Note |
|---|---|---|
| Section 4's script, the shipped option | 38 KB | Today 36.3 KB, of which three's GLTFLoader is 13.5 KB. Minus the universe and the products DOM, plus about 10 KB new: the bubble 1, the rings 3, the glide 1.5, the morph 2.5, the lands DOM 1.5, option A 1. The line moves from 30 KB to 38 KB unless the hall drops GLTFLoader for a raw binary, which is out of scope here (section 8). Sam's call (section 11) |
| Options B and C, Tune builds only | about 8 KB each, never in production until picked | The picked option moves into the 38 KB line; the other two are deleted |
| Total JS with section 4 | under 250 KB | today 233.8 KB with section 4; the rework adds about 2 KB net |
| The rings | 0 B | generated at load |
| The garden | 150 KB or less as AVIF 2048 x 1024 (WebP 240 KB or less, unsummed) | one file |
| Each land picture | portrait 720 x 1280, 80 KB or less; wide 1600 x 1000, 110 KB or less; WebP at most 1.6 times, unsummed | one class fetched, one land ahead |
| Each depth map (A) | 12 KB or less per land per class | an 8-bit grey AVIF at a quarter of the picture's size |
| The particles | 0 B | sampled from the shards and the picture at runtime |
| Option B's park | 300 KB or less GLB (meshopt, quantised, ours) plus a 150 KB or less AVIF lightmap | about 30k triangles drawn, 40 draws or fewer; Tune only until picked |
| Option C's clips | 3 clips of 3 s per class, H.264 720p, no audio, 700 KB or less each | staging and dev only until picked (`media-src 'self'`) |
| Section 4 on the 3D tier, to the first land | 300 KB portrait / 330 KB wide | the script 38, the hall 21.7, the garden 150, land 1 and its depth map 92 or 122 |
| Each further land (A) | 92 KB portrait / 122 KB wide | B adds 450 KB once; C adds 700 KB per clip |
| The poster tier | the hall still plus four pictures: 380 KB portrait / 500 KB wide, lazy; script 7 KB | |
| The first view | +0 B fetched; inline markup and `room.css` 4 KB gzip or less | |
| Frame cost | the bubble and the morph frames at DPR 1.25 within 1.25 frame periods on the reference phone | the family page's probe (family-page.md D7), timed in the review; the bubble frame is the section's costliest (the hall, the world, the bubble pass and the composite) |

## 7. Acceptance criteria

1. **Frames (B1, B2, B4).** At 390 x 844 and 1280 x 800, from the built page on the 3D path, each by a named hook (`__s4.seek` or `__s4.travel`):
   - the prompt near;
   - the bubble at 25, 50 and 90 percent;
   - the travel at its first ring, mid-glide and the last ring;
   - the morph at 30 and 80 percent;
   - each land at rest with its text;
   - each travel at half for A, B and C;
   - the frame pair one frame either side of the loop's jump;
   - the poster tier's column.

   Also: `section#room.offsetHeight` is 13 x `innerHeight` in the hall and 20 x once entered; no horizontal scroll at 390 in any state; every control has a 44 px hit area.
2. **Real products (A4, A5, F2).** Every land shows a real Skreed product named by its catalog name and its shade by id. The pictured case's colour is measured against the catalog hex once and recorded. Sam has approved every master before it is in the page. No placeholder picture or text ships.
3. **Colours (A1, A2).** The rings' arcs are the ten key shades by id in catalog order; the lattice and the lines are key shades by id; the bubble's outline and every line of text are Pearl Whisper; outside the bubble is the hall's frame mixed toward Urban Slate. The only other colours are the garden and the pictures (E-S4-garden, E-S4-photo), read back by a unit test from the scene's constants.
4. **The bubble (rule 12, WCAG 2.3.1).** Its radius grows monotonically. At every frame of a `seek` sweep its growth outruns the wobble's radial speed, so no pixel of the frame changes from inside to outside. Its edge clears all four corners by the end at 360 x 780, 390 x 844, 844 x 390 and 1280 x 800.
5. **No flashing (WCAG 2.3.1).** No pixel sees more than three opposing changes of 10 percent relative luminance in any one-second window. The frame test is driven by `seek` across the entry clock and each travel (A and B), and run on each clip (C). This replaces AC11 of section-4.md.
6. **Keyboard and screen readers (E3).**
   - The prompt is in the Tab order through the hall and works by E while the pad or it has focus. W, S and E do nothing without that focus (WCAG 2.1.4).
   - Skip is reachable by Tab from the press and takes focus when the press came from the keyboard.
   - On arrival at a land, focus goes to its name when the visitor came by keyboard; Down and Up on the pad travel to the next and previous land; Escape blurs.
   - Each land's text is real DOM with the shade named, and is announced once on arrival.
   - The canvas is `aria-hidden`.
   - Focus is visible with the two-tone ring on a visible element at 390 and 1280.
7. **One context, one loop (C3).** No second WebGL context is created (`renderer.info`, `__skreedPrograms`). The loop screen stays at 0 through every clocked state: a scroll of 5 screens during the entry clock never reaches the jump. `__skreedTop` from any state lands at section 1 with every clock stopped.
8. **Budget (C1, C2).** The parts measure at or under section 6 on the built page, by `scripts/hero/budget.mjs`. It gains the world's chunk, the option chunks, the garden, the land pictures, the depth maps, the park and the clips (`.mp4`) as their own rows, and fails a production build that carries `.mp4` unless `parkTravel` is C. Pictures are AVIF with WebP, with `width` and `height`.
9. **Reduced motion and the poster tier (D1, D2).** Under `still3d`, every beat is the cut or the fade of section 4, and no video plays. On the poster tier and without JavaScript, the four lands stand in a column with their pictures and text, and the loop is the fade through `--night`.
10. **States (D3, H).** As section 5's table says, shown in `tests/e2e/room.spec.ts` with the network throttled, a land's picture route blocked, the option chunk blocked, a clip's `play()` rejected, and `__skreedLoseContext()` called mid-travel.

## 8. Out of scope

- The hall, the walk, the door, the third wipe and the loop's mechanics (section-4.md stands).
- Replacing three's GLTFLoader in the hall with a raw binary to win back 13.5 KB: a separate change, proposed to Sam with the script line.
- Sound.
- A link from a land to its product or family page.
- Any person's identity: no identity model, no names, no quotes.
- Scrolling up from the top into section 4 backwards.

## 9. Decisions taken

- **W1.** Level flight through upright rings, not igloo's dive straight down a shaft. The door is in a wall and the lands are eye-level photographs, so the tunnel arrives where the lands are; an equirect garden then suffices (no cube, smaller).
- **W2.** The rings assemble on approach rather than bursting on contact: that is what igloo shows on screen, though its notes say "burst" (evidence file 5).
- **W3.** Rings generated at load, not a Blender GLB: zero bytes, a seed, and the lattice from the intro's `tTri` already on the GPU.
- **W4.** No glitch flash at the rings (WCAG 2.3.1), and a 40-degree roll by default instead of igloo's half turn (vestibular); both on Tune.
- **W5.** The bubble's outside is the hall's own frame, darkened and greyed (A2), not a new grey; its edge a Pearl outline, not a shade or a rainbow rim (rules 1, 21, 24).
- **W6.** Between lands: a trigger on `q`, then a timed travel, then one instant set at `scrollend`. It follows Sam's "after scroll trigger it will travel", works with every scrolling method, and never prevents the page's scroll. A scrubbed travel would read better on a phone, but C cannot scrub, and Sam asked for the trigger.
- **W7.** The lands in the catalog's order (the phone case, the wallet, the Lenskin, the AirPods case), Sam's own order in his second answer.
- **W8.** The particles' motion is fixed per point and runs on one progress value: no simulation, no float render targets, no workers (the CSP has `worker-src 'none'`).
- **W9.** In production only the picked option is in the bundle; with Tune on, all three load on demand, so Sam can compare them on staging.
- **W10.** A tap on the stage no longer skips (it did during the 2.4 s transition): over an 8 s sequence a thumb stopping momentum would end it by accident.
- **W11.** The listing photos are the masters' base (Sam). Higgsfield moves the person into Central Park and keeps the case. The wallet, the Lenskin and the AirPods case come from our Blender renders as references and are checked against the real products by Sam.

## 10. Exceptions this part needs (to add to CLAUDE.md "Approved exceptions" when Sam confirms)

- **E-S4-webgl (widened).** The island draws the bubble, the tunnel, the morph, the lands and the travels between them. *Default if declined:* the column of lands on every tier.
- **E-S4-colour (rewritten; the universe's walls are gone).** The rings' ten arcs, their lattice and the forcefield lines carry the ten key shades by id as scene surfaces and lines (rule 24; A2 by id), never a neon or pastel shade as a ring's dominant colour (rules 49, 50). *Default if declined:* the rings and the lattice in Pearl Whisper as light (igloo's white), with the colour carried by the garden and the pictures.
- **E-S4-garden (new).** The tunnel's backdrop is our own Blender render of a garden in daylight. Its colours are image content, not palette colours (A2, as E-A2b), and its sky's fall-off is a natural gradient (rules 1, 21, as E-1/21/40). It never clips to #ffffff across the frame (rule 23) and carries no grain (rule 20). *Default if declined:* the rings over the hall's dark colours, with no backdrop.
- **E-S4-portal (new; replaces E-S4-sweep).** The wavy circle that opens over the hall (rule 42 while small; rule 21 for its antialiased edge; rule 12). *Default if declined:* a 300 ms cross-fade from the hall to the tunnel.
- **E-S4-motion (widened).** Adds:
  - the bubble;
  - the timed glide and the rings assembling;
  - the particle morph;
  - the travels between lands (A's push and stream, B's flight, C's clip);
  - the text's decode on arrival (E-S3-motion's pattern).

  D1 holds at rest. *Default if declined:* cuts between the hall, the first land and each next land.
- **E-S4-photo (new).** Lifestyle pictures in a park, against "soft lifestyle photography on neutral backdrops" (CLAUDE.md brand facts; DESIGN.md 1). They are made from Sam's own listing photos, and he approves each. *Default if declined:* the listing photos as they are, on their own backdrops.
- **E-S4-device (new).** A phone in the case, the Lenskin on a phone and earbuds in the AirPods case, against the family pages' case-only rule (CLAUDE.md, the family pages line; section-4.md section 12 removed Apple's case and earbuds from the AirPods model). These are Sam's words: "using airpods cases with airpods". *Default if declined:* the products alone in the hand.
- **E-S4-people (new).** Real people from Sam's listing photos, in places they were not photographed; never named, quoted or presented as customers (rule 32, CHECKLIST G25 and G27). Sam confirms he holds the rights to the photos. *Default if declined:* hands and products only.
- **E-S4-font (new).** Section 2's label type (IBM Plex Mono Medium, capitals) for every line of section 4, as E-S3-font for the quiz. *Default if declined:* Open Sans and Poppins as before, still with no panels.
- **E-S4-contrast (new).** Pearl Whisper text straight on the pictures and on the hall, measured per land and recorded, as E-S3-contrast for the quiz. *Default if declined:* each crop recomposed until its text area measures 4.5:1.
- **E-S4-video (only if C is picked).** `media-src 'self'`; muted clips with no audio track, `playsinline`, 3 s each. Never on the poster tier, under Save-Data, on 2g, at `deviceMemory` 2 or less, or under reduced motion. Each clip passes AC5. Staging and dev builds carry it now (Sam, 2026-10-20). *Default if declined:* option A.
- **E-S4-38 (kept).** The hall, the bubble and the tunnel show no product; the lands do.
- **E-S4-glow (narrowed).** The forcefields' additive glow and the laptop bloom over the tunnel. *Default if declined:* flat lines, no bloom.
- **E-S4-grain (narrowed).** The hall only.
- **E-S4-light (edited).** The universe's floor, ceiling and lamp go; the bubble's outline is Pearl Whisper.
- **E-S4-sweep (withdrawn).**
- **WCAG 2.2.2.** A note, not an exception: Skip covers every automatic stretch.

## 11. For Sam

1. **The section's script line.** The rework lands at about 38 KB against the 30 KB line, mostly three's model loader (13.5 KB) the hall already uses. Move the line to 38 KB, or ask for the loader to be replaced (a separate change, about a day)?
2. **The photos' rights.** You hold the rights to the listing photos and the people in them for this use (E-S4-people)? The masters will show them in Central Park.
3. **Pick A, B or C** on staging with Tune's "Section 4" group (`parkTravel`); the other two are then deleted.
4. **The roll and the glide.** `travelRoll` 40 degrees and `travelMs` 6.5 s are guesses against igloo's half turn over a 14 s glide; try them on Tune.
5. **The deadline.** The teaser is live until Oct 31: the pictures need your approval as they come, so the lands can ship one by one, with the column of lands as the fallback until the travel is approved.
