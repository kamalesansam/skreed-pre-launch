# Section 4, part two: the Skreed world (spec)

**Status (2026-10-23): superseded after the bubble by `docs/specs/section-4-flux.md`**, part three, the five scenes, built and merged (its build records are `docs/specs/evidence/section-4-flux-build.md` and `section-4-flux-contrast.md`). Replaced here: section 2 after "The bubble" (the ring travel, the particle morph, the entry's end, a land at rest, the travel between lands with options A, B and C, after the last land, scrolling back past the first land, and Skip, which now ends the bubble alone), with the lands of the poster path and of 1280 x 800; section 3's lands, garden, park, depth maps and clips; section 5's scroll map past the station, the world modules and the travel chunks; section 6 in full; AC1 to AC3 and AC5 to AC13; W1 to W13 except W2 and W12; every E-S4 id that section-4-flux.md section 10 names (E-S4-video, E-S4-colour, E-S4-38, E-S4-webgl, E-S4-motion, E-S4-contrast and E-S4-glow, each amended there, and the new E-S4-scroll, E-S4-snap and E-S4-loops); For Sam 1 to 5. What stands: the press and the bubble (section 2, "The press" and "The bubble") with AC4, W2 and W12; the plain-text rule and section 2's label type with its decode; the copy pattern; the build modes' mechanics (Tune, hooks, staging); and the section 10 ids section-4-flux.md does not name: E-S4-portal and E-S4-font (approved), E-S4-grain and E-S4-light (pending), and E-S4-garden, E-S4-photo, E-S4-device and E-S4-people, which have nothing left to cover now that the lands' pictures, the park and the garden have left the repo. The rest of this file is the record of part two.

Written 2026-10-20 from Sam's brief of 2026-10-19 and his answers of 2026-10-19 and 2026-10-20. Revision 2 (same day) answers a review by six critics (3 blockers, 28 majors, 23 minors). Status: the plan for the build loop (`plan`, then `build`, then `review`).

**What this replaces in `docs/specs/section-4.md`.**
- **Section 2:** "The transition" and "The universe", and the panel and button styling of "The start station" and "The door station".
- **Section 4:** the universe rows and the reduced-motion paragraph.
- **Section 5:** the products list and the label.
- **Section 6:** in full.
- **Section 7:** AC1, AC2, AC4, AC5, AC6, AC7, AC11 and AC12.
- **Section 9:** D6 to D11.
- **Section 10:** in full. This spec's section 10 is the only text for every E-S4 id.
- **Section 11:** the universe items.

**What stays.** Everything else stands as section-4.md and its section 12 build record say: the hall, the walk, the door, the station, the third wipe from the fog, the cached layout, and the loop screen that wipes back to the hero and jumps to scroll 0. Section 12 of this spec lists the other documents this part changes.

**Sources.** The numbers measured on igloo.inc are in `docs/specs/evidence/section-4-world-igloo.md`, cited here as "evidence". Nothing of igloo ships: the rings, the lattice, the particles and the garden are our own geometry, shaders and Blender renders.

**Sam's brief, verbatim (2026-10-19).** "for section 4, after the door opens, we will have a travel animation as how it is there on the igloo site, i'm talking about this section, the moment the door opens, remove the lines of color animation and have a wavy circle zooming from centre to the end of the screen animation instead, where the inner part of the wavy outline circle is colorful and the exterior is dark and grey, and the wavy circumference of the circle just wobbles like a bubble wall and slowly gets bigger till filling the screen size, and once the animation is done, this section of the igloo site will come on the screen, it should be smooth, and instead of scrolling it automatically moves towards all those circle blocks, but that entire section is white and grey, but we will make it colorful instead, all the mini geometrical grids and lines everything will be colorfull, even the backround will be like a bright beautiful day garden kind of area and we will be travelling through this round blocks and then by the end of the travel we will have a particle morphism animation which will transition into a 2d picture, and also go inside the world which is basically the central park in new york, i have attached the 2d picture for you, and then from there after scroll trigger it will travel through the central park again which will land into another 2d picture which will be a lifestyle image of another person in central park using airpods cases with airpods, and then the same with lenskin as well, so the story is from a grey room now we enter the immersive colorful world of skreed, so each 2d land will look something similar to the image that i attached, it could be different, but that's the basic idea of the lifestyle image". The screenshot was igloo.inc's entry dive. The picture was Skreed's own listing photo, a woman against a pink wall holding a phone in a yellow case with yellow flowers; it is `lifestyle/17 promax/yellow.png`, the same file as `A3-lifestyle-iPhone-17-Pro-Max.png`.

**His answers.**
- 2026-10-19:
  - the round room with the four products on pedestals is replaced;
  - all four products get a land;
  - the pictures and the garden come from Blender and Higgsfield;
  - build the three travel options (A, B, C) behind a Tune toggle and he picks one.
- 2026-10-20, first:
  - the pictures start from his listing photos, with Higgsfield moving each person into Central Park and keeping the product;
  - up to 300 Higgsfield credits;
  - video on staging and dev now, and in production only if he picks C;
  - section 4 is plain text on the scene everywhere, in section 2's label type with its decode ("Yes, all of it"; his rule of 2026-10-19: "just plain text on the fog backround with the same animation, no boxes or anything").
- 2026-10-20, second:
  - the bases are yellow, blue, green and violet;
  - the lands come in catalog order;
  - his rights to the people in the photos cover AI edits and video on the website.

## 1. Goal

Turn the press at the door into the story Sam told: from the grey hall, through a bubble, into a sunlit garden tunnel of colourful rings, and out into four lifestyle pictures of Skreed's products in Central Park, each entered and then travelled between. It serves goal 1 of the stack in `docs/00-IDEATION.md` ("Position Skreed as a lifestyle brand that connects, not a tech brand"): the products appear for the first time in people's hands in a real place, after the grey hall has withheld colour for ten screens.

## 2. Phone-first wireframe in words

### 390 x 844, 3D path

**Before the press.** As section-4.md and its section 12 say, except that every element of the section is plain text on the scene in section 2's label type, decoded (section 3 of this spec):
- the hall's hint and the loading line;
- the prompt, which decodes in over the door's handle at 2.8 m: `[E] ENTER SKREED UNIVERSE` on a device that can hover, `ENTER SKREED UNIVERSE` on touch. It replaces today's Ember button and key chip.

There are no panels, no fills and no borders anywhere in the section (DESIGN.md's `.rm-pill`, `.btn` and `.txtbtn` styling goes from every tier).

**The press, 0 to 0.9 s.**
- The leaves swing 95 degrees (cubic ease-out), and from 0.3 s the camera glides 1.6 m into the doorway (cubic ease-in-out), as built.
- The hall's clear colour switches from white to Urban Slate at the press, so the opening behind the leaves reads dark, not white. The transept's white slots are behind the camera by then.
- The prompt's text wipes out (0.2 s) and takes `hidden`.
- `SKIP` decodes in at the bottom centre and stays until the first land. It takes focus when focus was in the section or the press came from the keyboard.
- There is no white-out and there are no bands.

**The bubble, from 0.35 s for `bubbleMs` (Tune, default 2000 ms, 1200 to 2190: past 2190 ms the first of four rings is passed before the bubble clears on the shortest glide).**
- **Shape.** A wavy circle opens from the screen's centre and grows until its edge has cleared the farthest corner.
- **Inside.** The garden tunnel is already moving: the camera glide of the next beat runs from the bubble's first frame ("the inner part ... is colorful").
- **Outside.** The hall's own frame, greyed and darkened at full strength from the bubble's first frame ("the exterior is dark and grey"): luminance mixed halfway toward Urban Slate, then multiplied by 0.6. On the hall's darker greys and the Urban Slate doorway this measures below 0.06 relative luminance (AC4). It is the hall's pixels, not a new colour.
- **The wobble** is like a bubble wall: five angular modes (2, 3, 5, 8 and 13 lobes, weights 0.34, 0.28, 0.20, 0.12, 0.06), each phase advancing at its own rate (1.3, 1.9, 3.1, 4.6 and 6.8 rad per second, a weighted sum of 2.55 rad per second). The amplitude A eases from 0.12 of the radius when small to 0.025 at the end.
- **Growth.** It grows only outward: `d/dt[R(1 + A f(theta, t))] > 0` for every angle and frame, counting dA/dt and the modes' summed speed. So every pixel crosses from outside to inside exactly once (WCAG 2.3.1). Over the first 12 percent of the time the radius rises to R1 = 8 percent of the short side on an ease-out cubic, with no overshoot, whose end velocity equals the next phase's. Then it grows at a constant zoom rate, `R = R1 x (Rend / R1)^u`, to `Rend` = the half-diagonal plus the final amplitude plus 4 px.
- **The edge** is a 2 device px Pearl Whisper outline, the "wavy outline circle". It is antialiased in device pixels by the true distance to the wobbling curve. No iridescence and no shade ring (rules 1, 21, 24).
- **The lens.** The inside is sampled with a small lens pull near the edge, like the film of a bubble: up to 6 device px, fading over 24 px.

**The ring travel, from 0.35 s for `travelMs` (Tune, default 8000 ms).** Sam: "instead of scrolling it automatically moves towards all those circle blocks".
- **The camera** flies level along the tunnel by itself and ignores the page's scroll. Its ease is igloo's own, `cubic-bezier(0.6, 0, 0, 1)` (evidence 4).
- **Three rings** (igloo's count; `ringCount` Tune 2 to 4: five rings put two passes under 0.4 s apart at any glide Tune offers) stand across the flight path, S = 2.5 units apart. They have igloo's proportions (evidence 8): outer radius 0.16 S, inner about 0.116 S, thickness 0.052 S.
- **The path.** The camera starts 0.71 S before the first ring, igloo's approach pose, where the ring fills about 116 percent of the laptop frame's height and more than the phone's width. It ends 0.5 S past the last ring.
- **The ring passes** fall at 2.70, 3.20 and 4.40 s after the press: every gap at least 0.5 s, and the first after the bubble has cleared (2.35 s). A unit test computes the passes from `ROOM_PARAMS` and Tune's ranges and fails on any gap under 0.4 s or a first pass before `0.35 + bubbleMs`; Tune's ranges are clamped to what passes.
- **The ten families.** Each ring carries the ten families' key shades by id, in catalog order clockwise: the gems' ten, and the old universe's ten bays. Each ring is turned 36 degrees from the one before.
- **Blended, never blocks** (Sam, 2026-10-20: "wherever there are colors involved, make gradient blends besides each color, so it doesnt look like a kids coloring book, make it realistic and add gradient beside each other").
  - Each shade blends softly into the next over the outer 40 percent of its 36 degrees on either side. The mix is in OKLab's polar form: the lightness and the chroma run straight from one shade to the next and the hue turns the short way round, so a blend stays clean and never passes through grey (OKLab's straight line from Amethyst to Sunbeam would fall to a grey beige). A pair with a neutral end (Snow, Silver) has no hue to turn and mixes on OKLab's straight line, a tint or a shade of the other end. A mix outside sRGB keeps its lightness and hue and loses chroma until it fits.
  - The shards vary slightly in value (plus or minus 6 percent).
  - The shards are lit by the garden's sun, with soft ambient occlusion in their seams and a soft specular sheen, so they read as a glazed, lacquered material, not flat fill.
- **Assembly.** A ring far ahead is broken: shards pushed outward along their own centre vector, spun about a random axis and shrunk. It pulls together between 1.4 S and 1.0 S from the camera and is whole as the camera passes through it. That is what igloo shows on screen (evidence 5: "far rings are spread apart and they come together between about 3.5 and 2.5 units").
- **The lattice.** Each shard face carries our own triangle lattice (the intro's `tTri`, already on the GPU) in the next family's key shade, blended around the ring the same way as the arcs. A forcefield disc fills each ring's hole, 0.13 S in radius and 0.06 S ahead of the ring: the lattice plus concentric and radial lines in the arc's shade, brightest at the rim, fading toward the centre, and fading out as the camera passes through.
- **The vanishing point.** igloo keeps a target at its vanishing point (evidence 5). Here it is the morph's points, waiting at the tunnel's far end as a slowly turning cloud in the ten key shades, 2.5 S past the last ring, seen through the rings from the start.
- **The garden** ("a bright beautiful day garden kind of area") is our own Blender render (section 3):
  - a forward plate covering 64 degrees around the flight's axis: the sky, the far trees and the lawn;
  - in front of it three depth cards at 2, 4 and 7 S beyond the last ring (clipped hedges, flower beds, near trees), which slide against each other as the camera flies, so the garden has parallax.
- **The lens.** The FOV opens from 22 to 30 degrees over the glide (evidence 2), with the portrait zoom `min(1, aspect x 1.5)`.
- **The roll** is gentle: up to `travelRoll` (Tune, default 30 degrees, 0 to 33: a larger roll cannot come up before the first of four rings at 30 degrees a second on the shortest glide and morph), reached before the first ring and unwound after the last. It is held steady through the passes and never turns faster than 30 degrees a second. igloo turns half a turn; that is a vestibular risk on a phone.
- **No flash.** There is no glitch flash at the rings (WCAG 2.3.1).

**The particle morph, for `morphMs` (Tune, default 1800 ms).** Sam: "by the end of the travel we will have a particle morphism animation which will transition into a 2d picture".
- **Start.** It begins when the glide has covered 97 percent of its way, at 75 percent of its time (6.35 s at the defaults); the camera creeps to rest under it.
- **Points.** The cloud's points, 32,768 on a touch device and 65,536 otherwise, leave the cloud on curved paths with a swirl about the view axis that unwinds as they land, the picture's centre first.
- **Landing.** Each lands on its cell of the first land's picture, set as a plane filling the frame, and takes the picture's colour: an antialiased mosaic, each cell the picture's average. The cells are a jittered grid, never a regular dot grid (rule 43). The points are round and opaque, never additive (rule 42) and never twinkling (rule 44). Their size is capped at 24 x DPR device px.
- **The picture** fades in under the points over the last 0.6 s, then the points fade out.
- **Going inside.** Sam: "and also go inside the world". After the morph the camera eases into the first picture for `enterPushMs` (Tune, default 1200 ms) through its depth map, as option A's push does (section 3). It pushes in by 0.15 of the picture's near distance and settles there. That settled pose is the land's rest.
- **Arrival.** The first land arrives at 0.35 + 6.0 + 1.8 + 1.2 = 9.35 s after the press at the defaults.

**When the entry clock ends, and on Skip**, the page is put at the first land's station by one instant `scrollTo` with the section's followers snapped, so a visitor who kept scrolling during the glide arrives at land 1, not past it. Land 1's triggers arm only once `q` is inside its hold zone.

**A land, at rest.** Sam: "each 2d land will look something similar to the image that i attached".
- **The picture** fills the stage, cover-fit: the portrait crop on phones, the wide crop on laptops (section 3). On a turn of the phone the other crop is fetched while the current one stays cover-fit.
- **The text** decodes in on arrival, one line after another (section 2's decode, as the quiz), bottom left inside the gutters above the safe area, within 520 px, Pearl Whisper on the picture:
  - the product's name (`--qz-fs-q`);
  - the family line;
  - the catalog line (`--qz-fs`);
  - the count `n / N`, tabular.
- **The camera** is still at rest: no idle drift (WCAG 2.2.2), no pointer sway (rule 48), no pointer-following light (rule 13).
- **The hint.** On the first land, once the text has settled, a hint decodes in under it: `SCROLL TO TRAVEL` on touch, `SCROLL OR PRESS DOWN TO TRAVEL` while the section has keyboard focus. It goes on the first travel.

**The travel between lands.** Sam: "after scroll trigger it will travel through the central park again which will land into another 2d picture".
- **The trigger.** A scroll past the land's trigger, 0.4 screens beyond its station, starts the travel to the next land on its own clock, `landTravelMs` (Tune, default 2600 ms, at most 4500). A scroll 0.4 screens back before the station starts the travel back.
- **The keys.** A single, non-repeating press of Down or S does the same as the forward trigger, and Up or W as the back trigger, while the pad, Skip or the land's name has focus. Held repeats are ignored. Up on land 1 and Down on land N do nothing; scrolling on from land N reaches the loop screen.
- **Never a hold.** The trigger reads `q`, so the wheel, touch, the keys, the scrollbar and assistive scrolling all start it, and the page is never held (D13 of section-4.md).
- **The text.** At the start the land's text wipes out (0.2 s) and takes `hidden`. A keyboard user's focus moves to the pad, then to the next land's name on arrival.
- **Settling.** When the travel ends, once no touch is down and the scroll has been still for 150 ms (`scrollend` where it exists), the page is set to the new land's station by one instant `scrollTo`. The new land's triggers arm once `q` is inside its hold zone. From the trigger until then the director is in `settling`, which holds the loop screen at 0 (section 5).
- **No Skip.** There is no Skip on these travels (each is under 5 s; WCAG 2.2.2). Escape lands at once.
- **`parkTravel` (Tune)** picks how the travel looks, A, B or C below. Where the shipped option is not A, a failed or refused travel is the 300 ms cross-fade, never A.

**Option A, the pictures in depth (default).**
- **Into depth.** The land's picture and its depth map become a displaced grid, seen from the picture's capture pose. Each land carries a vertical FOV and a near distance in config, shared with B.
- **The push.** The camera pushes into the grid by up to 0.35 of the near distance, over the first 45 percent, with a slight sway.
- **The stream.** The grid breaks into points that stream past the camera. Behind the camera each takes the next picture's colour and position, then settles into it as the camera arrives at the next land's rest pose. The next picture fades in under the settled points.
- **Back** plays the same in reverse.

**Option B, a modelled Central Park.**
- **In.** The picture cross-fades over 0.4 s into our own stylised Central Park model (section 3), seen from a pose matched to the picture.
- **The flight.** The camera flies a path through the park to the next land's matched pose: paths, lawns, trees, the Lake and Bow Bridge, the skyline as a far card. The four places sit in a park compressed to about 60 m between them.
- **Out.** The next picture cross-fades in over 0.4 s.
- **Back** flies the path in reverse.

**Option C, video clips.**
- **The clip.** A generated 3 s clip from this land's picture to the next plays in the scene as a video texture; C's travel lasts the clip.
- **The hand-over.** Its last frame cross-fades over 0.2 s to the approved next picture. A generated last frame is never exactly the master.
- **Back** cross-fades to the previous picture over 0.4 s.
- **When a land is in.** For C, a land counts as "in" when its clip is fully fetched.

**After the last land.** The AirPods case is fourth, in the catalog's order. Scrolling on from it reaches the loop screen: the fourth wipe from the land's picture to the hero at rest, then the jump to scroll 0, as today (section-4.md section 5, "The loop"; `lapReset` 1 walks the hall again on the next lap).

**Scrolling back past the first land.** The first land holds while the visitor scrolls back up through the screens where the hall was, as the universe held at yaw -60 before. The third wipe plays from the land back to the fog at `q` 0 to 1.

**Skip.**
- **Where.** `SKIP` is present from the press to the first land's arrival (9.35 s at the defaults).
- **What it does.** Activating it ends the bubble, the glide, the morph and the push at once: the first land shows with its text decoded and the page set to its station.
- **Its focus.** When Skip's stretch ends with focus on it, focus goes to the land's name, never to `body`.
- **Other ways.** Escape does the same, and so do Enter and Space while the pad has focus.
- **Guards.** A tap on the stage no longer skips: a thumb stopping a scroll's momentum must not end the sequence. An activation within 350 ms of Skip appearing is ignored, and key repeats are ignored (DESIGN.md's guard).

### 390 x 844, poster path and no JavaScript

**The poster path.** This covers no WebGL2, data saver, a failed boot or asset, and reduced motion: `REDUCED_MOTION_TIER` is `poster`, `config/hero.ts:49`.
- **Before the press.** The hall's still, and the prompt as plain text.
- **The press.** The hall's still cross-fades to the first land's picture over 300 ms, a cut under reduced motion. Focus moves from the prompt to land 1's name.
- **The lands.** All N lands then stand one per screen in a column on `--night`, each its picture over its text. Each picture is AVIF with WebP, with `width` and `height`, lazy, on a `--skeleton` box of its aspect ratio until it decodes. Never 2 x 2, never four in a row (rules 8, 26, 33). Under Save-Data a land's picture loads only when it is within one screen.
- **The loop** is the fade through `--night`, as today.

**Without JavaScript.** The hall's still, then the same column from `<noscript>` copies.

### 1280 x 800

The same sequence, with these differences:
- the rings fill the frame wider, and the points double;
- the land text sits bottom left at the laptop's inset, at the quiz's laptop sizes;
- the pictures are the wide crops;
- in the hall the pointer sways the head as built; on the lands it does not.

## 3. Content

**Copy** (`src/config/room.ts` `ROOM_COPY`). The source is in sentence case and the decode prints it in capitals, as section 2 and the quiz do; the accessible names keep the sentence case through the decode's visually hidden copy.

| Id | Text | Where |
|---|---|---|
| `hintTouch`, `hintKeys` | Scroll to walk to the door. / Scroll or use the arrow keys to walk to the door. | the hall, as today, now plain text |
| `loading`, `still` | Loading the entrance... / Still loading... | the hall, now plain text |
| `enter` | Enter Skreed universe | the prompt (`aria-keyshortcuts="E"`; `[E]` is `aria-hidden`, outside the decoded copy) |
| `loadingRoom` | Loading... / Still loading... (from 8 s) | the prompt while the world loads after a press; also announced through `#rmLive` |
| `skip` | Skip | the entry |
| `stageAria`, `worldAria` | The entrance. Use the arrow keys to walk to the door. / The Skreed world. Use Down and Up to travel. | the pad's label in the hall and in the world |
| `landHintTouch`, `landHintKeys` | Scroll to travel / Scroll or press Down to travel | the first land |
| `loadingLand` | Loading... / Still loading... | under a land's text while the next land is not in |
| `next`, `prev` | Next land / Previous land | the visually hidden travel buttons (section 5) |
| `landsTitle` | The Skreed world | the visually hidden `h2` |
| `landsAria` | Our products, out in the park | the lands list's label |
| `landLive` | n of N. Name. Family line. | `#rmLive` on arrival, only when focus does not move |
| `noscript` | The entrance needs JavaScript. The lands are below. | the no-JS line |

**The lands**, in the catalog's order (pages 15 to 19), from Sam's listing photos in `~/Downloads/amazon listing/image listing/lifestyle/17 promax/`:

| # | Product | Base photo | Place in Central Park | Light | What changes |
|---|---|---|---|---|---|
| 1 | Phone case | `yellow.png` (Mellow Yellow) | the Mall, under the elms | direct afternoon sun, as the photo | the pink wall becomes the Mall |
| 2 | MagSafe wallet | `blue.png` (Blissful Blue) | Bethesda Terrace's arcade | open shade | the background; our MagSafe wallet on the phone's back |
| 3 | Lenskin | `green.png` (Go Green) | Sheep Meadow, the skyline beyond | overcast | the background; our Lenskin on the phone's camera plateau |
| 4 | AirPods case | `violet.png` (Vivid Violet) | Bow Bridge over the Lake | open shade | the background; our AirPods case, open with earbuds inside, in her free hand |

**The land's text** names:
- the product;
- the pictured case's family;
- the accessory's own shade, by id.

The listing photos are family photos, so the case is named by its family, never a single shade the photo cannot be shown to be.
- **Land 1:** `PHONE CASE` / `A MELLOW YELLOW CASE` / the Tough case's line / `1 / 4`.
- **Land 2:** `MAGSAFE WALLET` / `DESERT, ON A BLISSFUL BLUE CASE` / the wallet's line / `2 / 4`.
- **Lands 3 and 4:** the same pattern: Lenskin in Sage on a Go Green case, and the AirPods case in Sage beside a Vivid Violet case.

The accessories' shades are `ROOM_PRODUCTS`' (Desert, Sage, Sage): Sam picked Sage (`go-green-09`, #96a880) for the Lenskin on 2026-10-20, approving sheet-v2. The shade rendered is the shade named.

**How each master is made** (W11; `docs/research/05-assets-and-creative-tooling.md:58`, "never let a generator draw the case"):
1. **The background.** It is replaced by a masked inpaint (Higgsfield `nano_banana_2_1` inpaint at 2k). The mask protects the person, the hands, the phone and the case, so the generator never redraws the product. The prompt names the place and the light above.
2. **The accessory.** It is our own Blender render (`scripts/room/render-products.py`, new). It runs headless, on Cycles on the Metal GPU, under the Standard view as `hall.py`. It draws the product in its shade and finish on a transparent background, posed and lit to match the photo. It is composited locally with a contact shadow.
   - **Land 4** renders the AirPods case open with earbuds inside, from a reference-only variant of Sam's AirPods file that keeps Apple's case and earbuds. That variant never ships (E-S4-device).
   - An optional masked harmonise pass may touch a 12 px ring around the composited product, never the product.
3. **The crops.** They are cut from the edited 2500 x 2500 square where the composition allows: a 1406 x 2500 portrait, encoded at 720 x 1280. The wide is padded locally to 16:9, bottom-weighted and never above a cropped face. Only the pad is filled by a masked inpaint, with a prompt for a darker, quieter lower left. It is then cropped to 16:10 and encoded at 1920 x 1200. Each crop keeps the product in the upper 60 percent of the portrait frame and the sharpest thing in the picture, with a quieter, darker lower left for the text.
4. **Approval.** Sam approves, per land, the edited square and both crops, and every clip (C), before anything is encoded into `src/assets/`. Until he has, the land is not in `ROOM_LANDS` and does not ship (CHECKLIST F2).
5. **Provenance.**
   - The masters live in `assets-src/room/lands/`: gitignored, with their `SHA256SUMS` committed, as hero.md P6.
   - `src/data/room-lands.json` records, per land and per class: the source file, the Higgsfield job ids, the model, the prompt, the seed, the mask, the accessory's shade id and the approval date.

**The garden** (`scripts/room/garden.py`, new; Blender 5.2 headless, Cycles on Metal, our own geometry):
- **The far plate.** Rendered with a perspective camera on the flight's axis, 64 degrees across, at 2048 x 2048: a clear blue sky with soft clouds, far trees, the lawn.
- **The depth cards.** Three cards with alpha, each 1024 to 2048 px wide: clipped box hedges, flower beds and near trees, each rendered on its own.
- **The flowers.** The beds' flowers are the ten key shades by id. Neighbouring drifts intermix over about a third of each drift's length, so the beds pass from one colour to the next as a real planting does. The flowers vary in value and tint around their shade and are lit as real petals.
- **Realistic, not stylised** (Sam, 2026-10-20: "make it realistic"). The garden reads as a photograph of a sunny garden, not low-poly geometry: real grass texture, leaf canopies, soft shadows, aerial haze toward the horizon. It is either a photoreal Blender render or a Higgsfield-generated plate with its depth layers, approved by Sam like the pictures.
- **The light.** The sun is behind the camera at 35 degrees.
- **Detail.** The plate gives at least 25 device px per degree at 390 and 32 at 1280; the cards give 40 or more.

**Option B's park** (`scripts/room/park.py`, new): our own stylised, compressed Central Park in metres, about 60 m between the four places. Paths, lawns, three or four instanced tree species, benches and lamps, the Lake with Bow Bridge, the Mall's elms and Bethesda's arcade, and the skyline as a far card. One baked lightmap at most 1024 x 1024. The four land poses are matched to the pictures' cameras by eye, and recorded in config with A's FOV and near distance. It uses no map data: the layout is drawn by hand from public knowledge of the park.

**Option A's depth maps.**
- **How.** Higgsfield `depth_anything_video`, variant VDA-Small (Apache-2.0; Base and Large are CC-BY-NC-4.0, so not for a commercial site), `--max_frames 1`, greyscale, on a one-frame clip of each crop.
- **Format.** An 8-bit grey AVIF and WebP at a quarter of the crop's size. A disparity-to-depth rule (near, far) lives in config. Sam checks the displaced-grid frame of each land.

**Option C's clips.**
- **Generation.** Higgsfield `kling_o3_flf` (Kling 3.0 Omni, first and last frame), 3 s, std, `--sound off`, `--multi_shots false`. The start frame is land n's crop and the end frame land n+1's.
- **Aspects.** 9:16 for the portrait class; 16:9 cropped to 16:10 for the wide.
- **Encoding.** H.264 720p, no audio track, `-movflags +faststart`. Each clip goes to Sam for approval.

**Alt text** (`ROOM_COPY.landAlt[i]`, on the poster tier, in `<noscript>`, and as each land's `aria-describedby` on the 3D path).
- **What it says.** The scene and the products by name and colour, and nothing more. For example: "A person under tall elms in a sunlit park holds a phone in a Mellow Yellow case."
- **What it never says.** That a picture was taken in Central Park; anything about a person's identity.

**Colours.**
- **The rings:** the ten key shades by id (`ROOM_BAYS`), each blending into its neighbours (section 2).
- **The lattice and the lines:** the next family's key shade by id, blended the same way.
- **The cloud:** the ten key shades by id; each point takes a blend of the two shades nearest its place in the cloud, so the cloud shifts smoothly from colour to colour.
- **The bubble's outline and every line of text:** Pearl Whisper.
- **Outside the bubble:** the hall's frame, mixed toward Urban Slate.
- **The hall's clear colour while entering:** Urban Slate.
- **The garden and the pictures:** image content (E-S4-garden, E-S4-photo).
- **The poster column:** `--night`.

## 4. Motion plan

No library:
- the island's own loop for the camera and the shaders;
- section 3's decode (`src/scripts/quiz/decode.ts`) for the text;
- the Web Animations API for the poster tier's cross-fades.

Everything in the DOM changes by opacity only, and the decode swaps characters, as E-S3-motion does. The prompt is placed by transform from a cached size (CHECKLIST C3); today it is placed by `left` and `top` with a layout read every frame (`walk.ts:101-105`).

| Trigger | What moves | How |
|---|---|---|
| 2.8 m from the door | the prompt | decode in (0.4 s alpha, 0.75 s roll); wipe out in 0.2 s on leaving |
| the hall's first frame; 1 m walked | the hall's hint | decode in; wipe out |
| press, 0 to 0.9 s | the leaves | 95 degrees, cubic ease-out (as built) |
| press + 0.3 s, for 0.9 s | the camera | 1.6 m forward, cubic ease-in-out (as built) |
| press | Skip | decode in; wipe out when the first land arrives |
| press + 0.35 s, `bubbleMs` | the bubble | the radius from 0 to `Rend` (section 2) and the wobble |
| press + 0.35 s, `travelMs` | the ring camera | level flight on `cubic-bezier(0.6, 0, 0, 1)`, FOV 22 to 30, roll to `travelRoll` and back |
| a ring 1.4 S to 1.0 S ahead | its shards | broken to whole, by the falloff of the camera's distance |
| 97 percent of the glide, `morphMs` | the points | the cloud to the picture; the picture fades in over the last 0.6 s, then the points fade out |
| the morph's end, `enterPushMs` | the camera | the push into the first picture through its depth map |
| arrival at a land | its text | decode in, one line after another (`showAll`, step 0.12 s) |
| the first land, settled | the travel hint | decode in; wipe out on the first travel |
| `q` past a trigger, or Down or Up | the travel | `landTravelMs`, option A, B or C (section 2) |
| the last land, scrolled on | the fourth wipe | as built |

**Reduced motion.**
- **The poster tier.** Reduced motion sends the visitor there by default (`REDUCED_MOTION_TIER` `poster`), with the column of section 2.
- **On the 3D path under `still3d`** (a test and Tune tier today):
  - no door swing and no glide;
  - the bubble is a 600 ms dissolve from the hall to the tunnel's first frame;
  - the tunnel holds still for 1 s, with no flight, no assembly and no roll;
  - a 300 ms cross-fade to the first land, with no push;
  - each travel between lands is a 300 ms cross-fade, with no video and no points;
  - text appears by a 0.2 s fade, with no roll.
- **Reading it.** The island reads reduced motion once at boot (`hero.ts:67`). The decode reads it live (`decode.ts:69`).

**WCAG 2.2.2.** Nothing moves on its own for more than the 9.35 s from the press to the first land, and Skip stops it throughout. Each travel between lands is under 5 s, and the visitor starts it.

## 5. Data and states

**Inputs.**
- the section's progress `q` (section-4.md section 12's cached layout);
- the keys: Up, Down, W and S, E, Enter, Space and Escape, while the pad or a section control has focus;
- Pointer Events on the pad;
- `hover: hover` and `prefers-reduced-motion` through `motion.ts`;
- Tune's values, on Tune builds.

**Outputs.**
- the visitor's place: `q` and the land.
- analytics through `track()`:
  - `room_view` and `room_walk`;
  - `room_enter` and `room_skip`;
  - `room_land { id }`, when a land is reached;
  - `room_travel { from, to, option }`;
  - `room_loop`.

Nothing is stored (B3).

**Build modes** (blocker B3 of the review).
- **The pick.** `PUBLIC_PARK_TRAVEL` (`A`, `B` or `C`) is set in `build`, `build:test` and `build:staging`, default `A`. `ROOM_PARAMS.parkTravel` defaults from it.
- **Unpicked options.** In builds with `PUBLIC_TUNE` 0, the unpicked options' modules are replaced by an empty stub through a Vite alias, so neither their code nor their `?url` assets (clips, the park) enter the module graph. Vite emits a `?url` asset as soon as its importer is in the graph, even behind a dead `import()`. In Tune builds all three are in the graph, each its own lazy chunk, and switching disposes the previous option's GPU resources.
- **The video policy.**
  - `scripts/csp.mjs` takes `--media self`, which writes `media-src 'self'`.
  - `build:staging` passes it after its `&&`, so staging can play C (Sam, 2026-10-20). Dev serves no `_headers`.
  - `build` passes it only when the pick is C.
  - Clips are streamed from their URL, never fetched to a blob, so `blob:` is never needed. The review checks that Workers Static Assets answers a Range request for an `.mp4` with 206 on staging.
  - A unit test reads `dist/_headers` per mode.
- **The post-build guard.** It runs in `npm run build` and fails on any `.mp4`, or on any park asset, unless the pick is C or B respectively.
- **Playback failures.** No frame within 1.5 s of `play()` counts as a refusal. On a Tune build a refused or blocked clip shows the visible line `CLIP BLOCKED` in the land's text, never a silent fall-back, so Sam can tell C apart from A.

**The scroll map** (`config/room.ts`, in screens of the section's own height). N is the number of lands in `ROOM_LANDS`, the lands Sam has approved.
- **In the hall, unchanged.** The third wipe 0 to 1, the walk 1 to 9, the station 9 to 10, the loop screen 10 to 11, the tail 11 to 12, and one more screen: 13 screens, 1300svh.
- **Once entered.**
  - The lands' stations are at `landQ(i) = 10 + 2i`, for i < N.
  - Each holds from 0.4 screens before its station to 0.4 after.
  - The loop screen runs from `9 + 2N` to `10 + 2N`, then the tail, then one more screen: `12 + 2N` screens. With N = 4 that is 20 screens, 2000svh.
  - `room.css` carries the height per N under `[data-state="world"][data-lands="N"]`. `tests/unit/room.test.ts` reads N from `ROOM_LANDS`, checks the CSS literal against `ROOM_HEIGHT_WORLD`, and checks that `loopStart + loop + tail <= height - 1`.
- **N = 1:** no travel and no option chunk; land 1, then the loop.
- **N = 0:** the press does nothing new. The hall keeps today's transition into the poster column, which is empty, so the prompt is not shown at all. Production ships with N = 0 until Sam has approved land 1.

**States** (`section#room[data-state]`).
- **`hall`:** the walk.
- **`entering`:** the door, the bubble, the glide, the morph and the push, on one clock.
- **`world`:** the lands, with:
  - `data-land`, 0 to N - 1;
  - `data-travel`, while a travel between lands runs;
  - `settling`, from a trigger until the page has been set and `q` is inside the new hold zone.

The loop screen's progress is held at 0 in `entering`, during a travel, in `settling` and during a land's Loading wait. Today only `entering` holds it (`director.ts:165`). So no momentum or fast scroll can jump to the hero before the last land is shown. `reset()` (back to top, `__skreedTop`) stops every clock in every state and cancels a pending set.

**The DOM** (`src/components/room/Room.astro`, in the after-track slot after the quiz).

*Controls*
- **The prompt.** `button.rm-enter.rm-link`: plain text with the quiz's link pattern and a 44 px hit area. It is never `hidden` in the hall and is clipped until near. Its text is split by the decode.
- **The pad.** `div.rm-pad[tabindex=0][role=group]`: `aria-label` `stageAria` in the hall and `worldAria` in the world. Its focus ring is drawn by a `::before` inset into the stage (the stage clips), 2 px Urban Slate, 2 px Ember Luxe, 2 px Urban Slate, in place of today's inset `box-shadow` (rule 25).
- **Skip.** `button.rm-skip.rm-link`, plain text.
- **The hints and the loading lines.** `p.rm-line`, plain text; the loading line has `role="status"`.
- **The travel buttons.** `button.rm-next` and `button.rm-prev`, visually hidden (the clip pattern), in the world. Screen-reader users in browse mode can travel with them; each runs the same travel as the keys.

*The lands*
- **The headings.** `h2.sr-only` (`landsTitle`), then `ol.rm-lands[aria-label=landsAria]` with one `li.rm-land[data-id]` per land in `ROOM_LANDS`.
- **Each land holds:**
  - the picture, `picture.rm-land-pic`: portrait AVIF and WebP, wide AVIF and WebP, `alt`, `width` and `height`, with `data-srcset` until the poster tier asks for it;
  - the text: `h3.rm-land-name[tabindex=-1]`, `p.rm-land-family`, `p.rm-land-line` and `p.rm-land-count`;
  - `p.sr-only.rm-land-alt`, which carries the alt as the name's `aria-describedby` on the 3D path.
- **What shows.** On the 3D path the island loads the same picture files and the DOM `picture` is not fetched. All N lands stay in the accessibility tree from entry: the unreached ones are clipped like today's `.rm-item`, not `hidden`. Only the active land's text is shown over the canvas.
- **Wiped elements.** Every element whose wipe ends takes `hidden`. A control moves focus first, then becomes `inert`.

*Announcements and the rest*
- **The live region.** `p.sr-only#rmLive` announces `landLive` on arrival only when focus does not move to the land's name. When it does, the name and its description speak for themselves.
- **Removed:** the products list, the label panel, `#rmLabel`, the universe's strings, the Ember button and key chip, and every panel.
- **Styles.** No `style` attributes (the CSP has no `style-src-attr`): positions go through the CSSOM.

**The island** (one renderer, one context; section-4.md section 12's module pattern).
- **`section4/transition.ts`.** The bubble replaces the white and the bands in the same full-screen pass. `plain` mode is kept for the fog's fade hand-off. Its inputs are `hall.out` and `world.out`. The radius, the amplitude and the five phases are set on the CPU every frame.
- **`section4/hall.ts`.** It keeps rendering until its dolly ends at 1.2 s, then freezes, and `hall.out` is reused for the rest of the bubble. Its clear colour switches to Urban Slate at the press.
- **`section4/world.ts`** (new; replaces `universe.ts`). The garden plate and cards, the rings, the forcefields, the cloud and its points, and the land picture with option A's grid.
  - **Its target.** It renders into one 8-bit target with depth, with display values written by hand (`toSrgb`) and `NoToneMapping` around the draw. Its draw is scissored to the bubble's bounding box while the bubble is small.
  - **Its look.** No output pass; on laptops `post.ts` may add the screened bloom with boost 1, corners 1, split 0, noise 0 and bleach 0, and no bloom on a land at rest.
  - **The rings.** Generated at load from a seed, about 2,000 triangles per ring, with no asset. Each shard carries its centre, a random spin and its shade index.
  - **The pictures.** Untagged (bytes in, display values out), mipmapped, decoded by `createImageBitmap`, and uploaded in row strips across frames. The depth maps are uploaded as single-channel data.
  - **What stays resident.** Only the previous, current and next lands.
  - **The logotype's tone.** Urban Slate over the garden. Over a land, the tone its config gives for the crop class in use (`LAND_COPY.tone`), measured where the logotype sits, top left: Pearl over the case in both crops and the wallet's wide, Urban Slate elsewhere.
- **The travel modules.** `section4/travel-depth.ts` (A), `travel-park.ts` (B) and `travel-video.ts` (C): one lazy chunk each, under the build modes above.
- **`section4/director.ts`:**
  - the states `hall`, `entering` and `world`;
  - one clock across the bubble, the glide, the morph and the push, and each between-lands travel on its own;
  - the triggers, the keys, `settling` and the instant set;
  - the loading in phases (below);
  - the loop hold in every clocked state;
  - `reset()` across every state;
  - the hooks: `__s4.state()`, `enter()`, `seek(sec)` across the entry clock, `land(i)`, `travel(i, j, p)` for the review frames, `skip()`, and the option in use. `createRoomDirector` receives the intro's `tTri`.
- **The composite.** Its shader is unchanged (pinned byte for byte, `tests/unit/glsl-v11.test.ts`); the section hands it one texture per frame, as today.

**Loading, in phases.** At most one compile, upload or decode runs per frame, so the quiz above never stutters (`quiz.spec.ts:167-168` already notes the set-up holding the main thread).
1. When `#room` is within one screen, or when `#find` is in view and lacks `data-decoding` (`deck.ts:30`): the director's chunk and the hall, as today, split into one step per frame.
2. Once past the third wipe:
   - the world's chunk and the garden;
   - the rings' generation and the cloud's points;
   - land 1's picture and depth map;
   - the shader compiles, with the world's target bound.

   All of it runs during the walk.
3. On the press: the chosen option's chunk, plus option B's model and lightmap.
4. On arrival at each land: the next land's picture, and its depth map (A) or clip (C).

A press before phase 2 is done makes the prompt busy: its text reads `Loading...`, then `Still loading...` at 8 s, with `aria-busy`, and it enters by itself when ready. The busy wait is dropped if the visitor walks away (as built).

**The poster path and failures.**
- **A failed garden or ring asset:** the section falls to `data-tier=poster`, the island runs on, and the hero is untouched (as built).
- **A failed land picture on the 3D path:** that land shows its text on the garden, and the travel to it is the 300 ms cross-fade.
- **A failed option chunk, park asset or clip, or a refused `play()`:** that travel is the 300 ms cross-fade. On Tune builds the land's text also shows the visible line.
- **A context loss:** the hero's hard poster path and the section's poster layout, as section-4.md says.

**States (CHECKLIST D3 and H).**

| State | Section 4, part two |
|---|---|
| Empty | n/a: nothing is entered or chosen |
| Loading | The world loads during the walk; a press before it is in makes the prompt busy. A travel triggered before the next land is in waits on the current land, with `Loading...` under its text and `Still loading...` at 8 s, and starts by itself when the land arrives; scrolling back cancels the wait. On the poster tier each picture stands on its `--skeleton` box until it decodes (H1). |
| Error | As "The poster path and failures": never a blank, never a hold at white |
| No internet | Everything loaded works. A land not yet loaded behaves as Loading, then as Error after the fetch's 20 s timeout (`model-fetch.ts`'s pattern) |
| Slow network | As Loading, with the 8 s line |
| No results, Permission denied, Session expired, Form validation | n/a: no search, no sensors, no session, no form |
| Success | Each land reached; the loop |

## 6. Budget

Everything of part two loads lazily, outside the first view. KB are 1024 B. **Lines count scripts at gzip and everything else as stored**, the bytes a visitor fetches when the edge does not compress them. `budget.mjs` also prints gzip sizes for reference.

**Freed by removing the universe** (section-4.md section 6, measured):

| Part | Bytes |
|---|---|
| the universe chunk | 9,026 B |
| `room.glb` | 38,240 B |
| its lightmaps | AVIF 8,783 B, WebP 13,154 B |
| the three product GLBs | 90,052 B |
| the case LOD1 on this page | 54,688 B |

The product GLBs move out of `public/` into `scripts/room/models/` as Blender references only.

| Part | Line | Note |
|---|---|---|
| Section 4's script, option A shipped | **30 KB, over and pending Sam (section 11, item 1); about 38 KB measured likely** | Today 36.3 KB, of which three's GLTFLoader is 13.5 KB. Minus the universe and the products DOM (about 9 KB), plus about 11 KB new: the bubble 1, the rings 3, the glide 1.5, the morph 2.5, the lands DOM and keys 2, option A 1. Measured 2026-10-21 (N = 0, option A's placeholder): 44.5 KB with the loader, 32.1 KB with the hall read from `hall.bin` (`scripts/room/hall-bin.mjs`) and the catalog's own lines moved to a test fixture. |
| ... option B shipped | about 45 KB | B adds the park's loader path, the meshopt decoder (about 1.5 KB) and its flight. |
| ... option C shipped | about 40 KB | C adds the video texture and its states. |
| Options in Tune builds | about 8 KB each, never in production until picked | Then the other two are deleted. |
| Total JS with section 4 (production) | under 250 KB | today 233.8 KB; with A about 236 KB |
| The rings and the cloud | 0 B | generated at load |
| The garden: far plate | 110 KB or less AVIF; WebP 180 KB or less | 2048 x 2048 |
| The garden: three depth cards | 60 KB or less AVIF together; WebP 100 KB or less | with alpha |
| Each land picture | portrait 720 x 1280, 80 KB or less; wide 1920 x 1200, 110 KB or less | AVIF; WebP at 1.6 times, 128 and 176 KB. One class fetched, one land ahead. |
| Each depth map (A, and land 1's push on every option) | 12 KB or less AVIF, 20 KB or less WebP, per land per class | |
| Option B: the park | GLB 300 KB or less (meshopt, quantised, with `TEXCOORD_1` for the lightmap); lightmap 1024 x 1024, 120 KB or less AVIF (WebP 190 KB) | about 30k triangles drawn, 40 draws or fewer; caps apply once B is picked |
| Option C: the clips | 3 clips per class, 3 s, H.264 720p, no audio, 700 KB or less each | staging and dev until picked |
| To the first land, 3D tier, A, AVIF | **portrait 355 KB, wide 385 KB** | script 38 + hall 51.3 (35.0 + 16.3) + garden 170 + land 1 with depth 92 (122): 351.3 and 381.3. Replaces section-4.md's 275 KB line. |
| ... WebP-only browsers | portrait 560 KB, wide 610 KB | script 38 + hall 91.0 (35.0 + 56.0) + garden 280 + land 1 with depth 148 (196): 557 and 605 |
| Each further land (A) | 92 KB portrait, 122 KB wide (AVIF); 148 and 196 (WebP) | |
| The whole section, by option, AVIF | A: portrait 630, wide 750 KB. B: about 1,020 / 1,140 KB. C: about 2,700 / 2,820 KB | A: the first-land row plus three further lands. B: A plus the park (420) and B's extra script (7), less A's depth maps after land 1 (about 36). C: A plus three clips (2,100), C's extra script (2), less A's depth maps after land 1. |
| The poster tier | the hall still (16.5 / 18.1 KB) plus four pictures: 337 KB portrait, 459 KB wide (AVIF); 529 and 724 KB (WebP); script 8.5 KB | lazy, one land ahead under Save-Data |
| The first view | +0 B fetched; inline markup and `room.css` 4 KB gzip or less, `<noscript>` copies included | |
| GPU memory, phone | section 4's resident set 48 MiB or less | the world target about 3.9 MiB, colour plus depth (1.96 MiB each at 390 x 844 and DPR 1.25); three pictures with mips about 15 MiB; the garden about 24 MiB; A's grid and points about 2 MiB. Beside the hero sky's 34 to 45 MiB, which stays resident. `renderer.info.memory` is recorded in the review. |
| Higgsfield credits | **300 or less** | see the credit plan below |

**The credit plan** (unit costs from `higgsfield generate cost`, 2026-10-19 and 2026-10-20).

| Step | Model | Unit | Count | Credits |
|---|---|---|---|---|
| background inpaint, 4 lands, 2k | `nano_banana_2_1` inpaint | 2 | 4 x 4 attempts | 32 |
| wide pad fill, 4 lands | `nano_banana_2_1` inpaint | 2 | 4 x 3 | 24 |
| harmonise ring, lands 2 to 4 (optional) | `nano_banana_2_1` inpaint | 2 | 3 x 3 | 18 |
| depth maps, 4 lands x 2 classes | `depth_anything_video` VDA-Small, `--max_frames 1` | 0.05 | 8 x 2 | 1 |
| clips (C), 3 travels x 2 aspects | `kling_o3_flf` 3 s std, sound off | 3 | 6 x 3 attempts | 54 |
| garden look-dev (optional) | `soul_location` | 0.12 | 10 | 1.2 |
| **total** | | | | **about 130** |
| reserve | | | | 170 |

- **The ledger.** A running ledger of every call (job id, credits) is kept in `src/data/room-lands.json`'s sidecar and in the review.
- **The cut order if it nears 300.** Fewer attempts; crops in place of wide fills; one clip aspect cropped for the other.
- **Guards.** Every depth call carries `--max_frames 1` (21.45 credits without it). No 4k and no pro modes.
- **The account.** The CLI's own account, premsanjay@gmail.com, is Sam's to confirm.

**Frame cost.**
- **What is timed.** Every state at 390 x 844 and 1280 x 800, at DPR 1.25 on touch: the hall walk, the bubble at 50 percent, the glide at a ring pass, the morph at 50 percent, a land at rest, each option at half its travel, and the loop screen, which part one never timed.
- **How.** The family page's probe (`docs/specs/family-page.md` section 2.5, lines 197 to 200): 20 renders, pass at 1.25 frame periods or less.
- **Where.** An A15-class iPhone and a Redmi-class Android, or Chrome's 4x CPU throttle with SwiftShader where no phone is at hand, recorded as such.
- **Bounds.** The points' total fill is at most 2.5 screen fills at any moment.
- **Degrade path.** If a state fails, DPR 1, then half the points, then that travel as the cross-fade.

## 7. Acceptance criteria

1. **Frames (B1, B2, B4).**
   - **What.** At 390 x 844 and 1280 x 800, from a built page on the 3D path, each by a named hook (`__s4.seek`, `__s4.land`, `__s4.travel`):
     - the prompt near;
     - the bubble at 25, 50 and 90 percent;
     - the glide at each ring pass;
     - the morph at 30 and 80 percent;
     - the push's end;
     - each land at rest with its text;
     - each travel at half for A, B and C;
     - the frame pair one frame either side of the loop's jump;
     - the poster tier's column.
   - **Builds.** The A, B and C frames and the clip tests come from `build:staging` (Tune on); the rest from `build:test`.
   - **Heights.** `section#room.offsetHeight` is 13 x `innerHeight` in the hall and `(12 + 2N)` x once entered.
   - **Layout.** No horizontal scroll at 390 in any state. Every control has a 44 px hit area.
2. **Real products (A4, A5, F2).**
   - **Names.** Each land names its product by its catalog name, the case by its family, and the accessory by its shade id.
   - **The case.** Diffed against the source photo: the masked inpaint left it untouched.
   - **The accessory's colour.** Measured against its catalog hex under a neutral patch and recorded.
   - **Approval.** Sam has approved every square, crop and clip in the page. No placeholder picture or text ships; production carries only approved lands.
3. **Colours (A1, A2).**
   - **The scene.** The rings' arcs, the lattice, the lines and the cloud are key shades by id. The bubble's outline and every line of text are Pearl Whisper. Outside the bubble is the hall's frame mixed toward Urban Slate; the hall clears to Urban Slate while entering.
   - **Image content.** The only other colours are the garden and the pictures.
   - **The test.** A unit test reads the scenes' constants back.
4. **The bubble (rule 12, WCAG 2.3.1).**
   - **Growth.** Across a `seek` sweep at 60 steps a second, no pixel goes from inside to outside.
   - **Clearance.** The edge clears all four corners by the end at 360 x 780, 390 x 844, 844 x 390 and 1280 x 800.
   - **Outside.** At 25 percent the mean relative luminance outside the bubble is below 0.06.
5. **Flashes (WCAG 2.3.1; replaces section-4.md AC11).**
   - **The sweep.** Over the `seek` sweep of the entry clock (the press's frames from 0 to 1.2 s included), each travel (A, B) and each clip, at 390 x 844 and 1280 x 800.
   - **The rule.** No 341 x 256 CSS px region (WCAG's 10 degrees at 1024 x 768) has more than 25 percent of its area flash more than three times in any one second.
   - **A flash.** A pair of opposing changes of at least 10 percent of the maximum relative luminance where the darker state is below 0.80. The same holds for saturated-red flashes.
6. **Keyboard and screen readers (E3).**
   - **The prompt.** It is in the Tab order through the hall and works by E while it or the pad has focus. W, S and E do nothing without that focus (WCAG 2.1.4).
   - **Skip.** It takes focus at the press when focus was in the section or the press came from the keyboard, and hands focus to the land's name, never to `body`.
   - **The lands.** Down and Up, single presses, travel. A keyboard user's focus lands on each land's name. Escape blurs or lands.
   - **What is exposed.** On the 3D path all N lands' names, family lines, lines and alts are exposed. The visually hidden Next and Previous buttons travel. The pad has a role and a label for its state.
   - **Announcements.** One per arrival, never two.
   - **The canvas** is `aria-hidden`.
   - **Focus.** It is visible as the two-tone ring on a visible element at 390 and 1280.
7. **One context, one loop (C3).**
   - **One context.** No second WebGL context is created (`renderer.info`, `__skreedPrograms`).
   - **The loop holds.** During the entry clock, during a travel, in `settling` and during a Loading wait.
   - **The scroll tests.**
     - A 5-screen scroll during the entry clock ends on land 1 at its station, with no travel started.
     - Triggering travel 3 to 4 and scrolling to the document's end during it ends on land 4, with no jump.
   - **Back to top.** `__skreedTop` from any state lands at section 1 with every clock stopped.
8. **Budget (C1, C2).**
   - **The lines.** The parts measure at or under section 6 on the built page.
   - **`scripts/hero/budget.mjs`.** It gains:
     - its own groups: the world chunk, each option chunk, the garden, the land pictures (named `land-<id>-portrait.*` and `land-<id>-wide.*`), the depth maps, the park and the clips;
     - thresholds for every line;
     - a non-zero exit on any line it breaks.
   - **When it runs.** `npm run build` and `build:staging` run it with the mode and the pick.
   - **Formats.** The pictures are AVIF with WebP, with `width` and `height`.
9. **Reduced motion and the poster tier (D1, D2).**
   - **Reduced motion.** It gives the poster tier. Under `still3d` every beat is the cut or the fade of section 4, and no video plays.
   - **The poster tier.** The N lands stand in a column with their pictures and text. Focus moves to land 1's name at the press, and the loop is the fade through `--night`.
   - **Without JavaScript.** The same column, from `<noscript>`.
10. **States (D3, H).** As section 5's table says, shown in `tests/e2e/room.spec.ts` with:
    - the network throttled;
    - a land picture's route blocked;
    - the option chunk blocked;
    - a clip's `play()` rejected;
    - `__skreedLoseContext()` called mid-travel.
11. **Plain text (Sam, 2026-10-19 and 2026-10-20).** A unit test on `room.css` and `Room.astro` fails on:
    - any `background`, `border` other than the focus ring's, or `box-shadow`;
    - `rm-pill`, `class="btn` or `txtbtn`.
12. **Contrast (E3, E-S4-contrast).**
    - **Measured** with `scripts/quiz/contrast.mjs`'s method, median and worst.
    - **On these frames:**
      - the prompt;
      - Skip over the bubble at 25, 50 and 90 percent, the three ring passes, and the morph at 30 and 80 percent;
      - each land's text;
      - each travel at half;
      - the failed-picture case.
    - **Below 4.5:1** is recorded and flagged to Sam, never boxed.
13. **Build modes (blocker B3).**
    - **The policy.** `dist/_headers` carries `media-src 'none'` for `build` with A or B, and `media-src 'self'` for `build:staging` and for `build` with C.
    - **The bundle.** A production build with A carries no `.mp4` and no park asset.
    - **On staging.** A clip plays with zero CSP violations. An `.mp4` Range request answers 206.

## 8. Out of scope

- The hall, the walk, the door, the third wipe and the loop's mechanics (section-4.md stands).
- Replacing three's GLTFLoader in the hall with a raw binary to win back 13.5 KB: proposed as a separate change, then made on `s4/world-wire` (2026-10-21) because total JS left no room for option A: the hall ships as `hall.bin`, 16,980 B against the GLB's 35,868.
- Sound.
- A link from a land to its family page (CHECKLIST G21): section 4 links nowhere today. It is offered to Sam in section 11; it is not built here.
- Any person's identity: no identity model, no names, no quotes.
- Scrolling up from the top into section 4 backwards.

## 9. Decisions taken

- **W1. Level flight.** Level flight through upright rings, not igloo's dive straight down a shaft. The door is in a wall and the lands are eye-level photographs, so the tunnel arrives where the lands are. A forward plate with depth cards then suffices, with no cube.
- **W2. Assembly, not burst.** The rings assemble on approach rather than bursting on contact, which is what igloo shows on screen though its notes say "burst" (evidence 5).
- **W3. Generated rings.** The rings are generated at load, not a Blender GLB: zero bytes, a seed, and the lattice from the intro's `tTri`, already on the GPU.
- **W4. Calm passes.** No glitch flash at the rings (WCAG 2.3.1). A 30-degree roll held through the passes, instead of igloo's half turn (vestibular). Three rings over 8 s, so every pass is at least 0.4 s from the next. All on Tune, with the ranges clamped by the unit test.
- **W5. The bubble's look.** Its outside is the hall's own frame, darkened and greyed (A2), with the doorway's clear colour Urban Slate. Its edge is a Pearl outline, not a shade or a rainbow rim (rules 1, 21, 24).
- **W6. Triggered travel.** Between lands: a trigger on `q` or a single key press, a timed travel, then one instant set once the scroll is still. It follows Sam's "after scroll trigger it will travel", works with every scrolling method, and never prevents the page's scroll. A scrubbed travel would read better on a phone, but C cannot scrub, and Sam asked for the trigger.
- **W7. Catalog order.** The phone case, the wallet, the Lenskin, the AirPods case (Sam, 2026-10-20).
- **W8. No simulation.** The particles' motion is fixed per point and runs on one progress value: no simulation, no float render targets, no workers (the CSP has `worker-src 'none'`).
- **W9. One option ships.** In production only the picked option is in the bundle, through the alias. With Tune on, all three load on demand, so Sam can compare them on staging.
- **W10. No tap-to-skip.** A tap on the stage no longer skips, because over a 9 s sequence a thumb stopping momentum would end it by accident.
- **W11. The real case stays real.** The listing photos are the masters' base. A masked inpaint changes only the background, so the case Sam photographed is never redrawn. The accessories are our own Blender renders, composited.
- **W13. Blends and realism.** Every place several shades meet in the scene blends them softly (rings, lattice, cloud, flower beds), and every surface is lit and textured to read as a real material. Sam's words of 2026-10-20 replace the hard 36-degree arcs and the stylised garden of revision 2.
- **W12. igloo's other layers.** Its plasma halos, smoke trails, tunnel ripples and snow are dropped: their look is ice and data, not a garden, and they cost bytes and fill. Its vanishing-point target is kept, as the cloud. Three rings, as igloo.

## 10. Exceptions this part needs

This section is the only text for every E-S4 id. Those Sam's own words already cover are recorded as approved, with his words, as CLAUDE.md does for E-S3; the rest are pending.

**Approved by Sam's words**
- **E-S4-colour (rewritten; the universe's walls are gone).** The rings, their lattice, the forcefield lines, the cloud and the garden's flower beds carry the ten key shades by id as scene surfaces and lines (rule 24; A2 by id), each blending softly into its neighbours. That blending waives rules 1 and 21 (no gradient as a device; no harsh gradients) for these scene surfaces only: the blends are soft and never harsh, mixed in OKLab's polar form (the lightness and chroma straight, the hue the short way round; straight where one end is neutral; the chroma reduced to fit sRGB). Never a neon or pastel shade as a ring's dominant colour (rules 49, 50). Sam, 2026-10-19: "we will make it colorful instead, all the mini geometrical grids and lines everything will be colorfull"; 2026-10-20: "wherever there are colors involved, make gradient blends besides each color, so it doesnt look like a kids coloring book, make it realistic and add gradient beside each other". *Default if withdrawn:* the rings and the lattice in Pearl Whisper as light (igloo's white).
- **E-S4-garden (new).** The tunnel's backdrop is our own Blender garden in daylight. Its colours are image content (A2, as E-A2b), and its sky's fall-off is a natural gradient (rules 1, 21, as E-1/21/40). Never clipped to #ffffff across the frame (rule 23), and no grain (rule 20). Sam, 2026-10-19: "even the backround will be like a bright beautiful day garden kind of area". *Default if withdrawn:* the rings over Urban Slate.
- **E-S4-portal (new; replaces E-S4-sweep).** The wavy circle that opens over the hall: rule 42 while it is small, rule 21 for its antialiased edge, rule 12 for the motion. Sam, 2026-10-19: "have a wavy circle zooming from centre to the end of the screen". *Default if withdrawn:* a 300 ms cross-fade.
- **E-S4-font (new).** Section 2's label type for every line of section 4: IBM Plex Mono Medium in capitals, against rules 4 and 19, the brand facts' typography line, `docs/brand/type-system.md` (the three families; no all-caps), DESIGN.md's type rules and CHECKLIST A3. As E-S3-font for the quiz. Sizes are the quiz's: `--qz-fs` 13 px, `--qz-fs-q` 22 px, 12 and 18 px under `max-aspect-ratio: 9/10` (`quiz.css:9, 13`). The two existing files, `ibm-plex-mono-500-caps.woff2` and `ibm-plex-mono-500-rest.woff2`, carry it. Sam, 2026-10-20: "Yes, all of it". *Default if withdrawn:* Open Sans and Poppins, still with no panels.
- **E-S4-photo (new).** Lifestyle pictures in a park, against "soft lifestyle photography on neutral backdrops" (CLAUDE.md brand facts; DESIGN.md 1). Made from Sam's own listing photos by a masked background change; he approves each. Sam, 2026-10-19: "each 2d land will look something similar to the image that i attached". *Default if withdrawn:* the listing photos as they are, on their own backdrops.
- **E-S4-device (new).** A phone in the case, the Lenskin on a phone and earbuds in the AirPods case. This reverses CLAUDE.md's section 4 line ("the AirPods case without Apple's case or earbuds") and the family pages' case-only rule for the lands; the AirPods variant with earbuds is a Blender reference only and never ships as a model. Sam, 2026-10-19: "using airpods cases with airpods". *Default if withdrawn:* the phone in its case as photographed; the AirPods case closed, with no earbuds; the wallet and the Lenskin only on the case.
- **E-S4-people (new).** The people in Sam's listing photos, shown in places they were not photographed and possibly in clips. Never named, quoted or presented as customers (rule 32, CHECKLIST G25 and G27). Sam, 2026-10-20: his rights cover AI edits and video on the website. *Default if withdrawn:* hands and products only, cropped below the face.
- **E-S4-video (staging and dev now; production only if C is picked).** `media-src 'self'` (section 5, "Build modes"); muted clips with no audio track, `playsinline`, 3 s each. Never on the poster tier, under Save-Data, on 2g, at `deviceMemory` 2 or less, or under reduced motion. Each clip passes AC5. Sam, 2026-10-20: "Staging now". *Default if declined for production:* option A.

**Pending, to add to CLAUDE.md "Approved exceptions" when Sam confirms**
- **E-S4-webgl (widened).** The island draws the bubble, the tunnel, the morph, the lands and the travels between them, against "No WebGL from section 3 on" and C3. *Default if declined:* the poster column on every tier.
- **E-S4-motion (rewritten, complete).**
  - **What it covers.**
    - the prompt's decode at 2.8 m;
    - the hall's hint;
    - Skip's decode and wipe;
    - the lands' hints;
    - each land's decode on arrival;
    - the door's swing and the 1.6 m glide;
    - the bubble;
    - the timed glide, the roll and the rings assembling;
    - the morph;
    - the push into the first land;
    - the travels between lands: A's push and stream, B's flight, C's clip.
  - **Rule 12.**
    - Its first sentence ("No fade-in-on-scroll as the default reveal") is waived for state-driven reveals that a scroll position triggers.
    - Its second ("Sections are visible at rest") holds: each land and the hall are whole at rest.
    - Its third (motion reserved to the listed places) is waived for section 4.
  - **Withdrawn.** Part one's 200 ms fades, the white mix, the sweep and the product lift.
  - *Default if declined:* cuts between the hall, the first land and each next land, with text set without the decode.
- **E-S4-contrast (new).** Pearl Whisper text straight on the scene: over the hall, the bubble, the garden tunnel, the morph, the lands and each travel. Measured on the frames of AC12 and recorded, as E-S3-contrast for the quiz. *Default if declined:* Skip and the hints over a part dark by construction (the garden's lower band darkened in `garden.py`), and each land recomposed until its text area measures 4.5:1.
- **E-S4-glow (widened).** The hall's seam, the fixtures' halos and the laptop bloom (unchanged from part one), plus the forcefields' additive glow and the laptop bloom over the tunnel. Under rule 42, with rules 1 and 21 for the forcefields' fall-off, and E-13/42 extended. *Default if declined:* flat lines, no bloom.
- **E-S4-38 (kept).** The hall, the bubble and the tunnel show no product; the lands do.
- **E-S4-grain (narrowed).** The hall only.
- **E-S4-light (edited).**
  - **Goes:** the universe's floor, ceiling and lamp; the white-out's #ffffff.
  - **Added:** the hall's clear colour while entering, Urban Slate; the bubble's outline, Pearl Whisper.
- **E-S4-sweep (withdrawn).**
- **WCAG 2.2.2.** A note, not an exception: Skip covers the entry; each travel between lands is under 5 s and started by the visitor.

## 11. For Sam

1. **The section's script line.** The loader is replaced (2026-10-21): the section measures 32.1 KB against the 30 KB line before option A's own code. Move the line to 38 KB?
2. **Pick A, B or C** on staging with Tune's "Section 4" group (`parkTravel`). The other two are then deleted, and the pick moves into the production build.
3. **The pace.** The first land arrives about 9.4 s after the press at the defaults: a 2 s bubble, an 8 s glide whose last 2 s overlap the morph, then the push. Every beat is on Tune; Skip is there throughout.
4. **A link from each land** to its family page (CHECKLIST G21)? Plain text, for example `SEE MELLOW YELLOW`. Not built unless you say.
5. **The deadline.** The teaser is live until Oct 31. Lands ship one by one as you approve their pictures; production carries only approved lands, and N = 0 keeps today's hall until land 1 is in.

## 12. Documents this part changes (at build time, each in its own branch)

- **`docs/specs/section-4.md`:** a line under its title pointing here for every part listed at the top of this spec.
- **`DESIGN.md`:**
  - section 3: Plex Mono's scope adds section 4;
  - section 4: the stage text and panels, the Section 4 panel, the Prompt, Skip, the Pad (its label, keys, tap and ring), the Product label and the Products list are replaced by plain-text entries, and Lands is added;
  - sections 7 and 10: section 4's motion and its exceptions.
- **`CLAUDE.md`:** line 18's section 4 summary and its pending exceptions list. The approved ones go into "Approved exceptions" with Sam's words.
- **`docs/CHECKLIST.md`:** the A1, A2, A3, C3, D1 and E3 exception lines for section 4, once Sam confirms the pending ones.
- **`docs/specs/hero-architecture.md`:** section 11.4 (the universe chunk becomes the world, the travel chunks, the render targets, the build modes), the file layout and the module split.
