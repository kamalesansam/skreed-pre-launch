# Reference: fluxtheory.in

Code read with line pointers: [../specs/evidence/section-4-flux-reference.md](../specs/evidence/section-4-flux-reference.md). The spec it feeds: [../specs/section-4-flux.md](../specs/section-4-flux.md).

| | |
|---|---|
| URL | https://www.fluxtheory.in/ |
| Captured | 22 October 2026, by Sam, as a saved-page zip: `www.fluxtheory.in.zip`, 14,427,471 B, 193 entries all dated 2026-10-22 13:06. It holds the page HTML, the site's bottle models and label textures, and the Shopify Oxygen asset folder with the built chunks, the CSS, the hero's three clips and the mobile poster. The 14 scene clips inside it are 104 to 112 byte "No Content" stubs; the real clips were downloaded from the same URLs and probed separately. The chunk the page loads under 1024 px is not in the capture, so the phone carousel is unverified |
| Brief | None. The capture process in the README starts from a Chrome brief saved in `raw/`; here Sam supplied the capture himself and the brief is his message of 2026-10-22, quoted verbatim in the spec |
| What Sam liked, in Sam's words | "put that exact same background in section 4, all 4 backgrounds, or 5"; "the fog, the water, the gradient, everything"; "a rotation of perspective animation"; "the exact same background and the transition animation with the same scroll trigger values for each transition" |
| Where on the page | The second section of the home page, between the hero and the shop: five full-screen rooms, each a looping video on a plane with one bottle turning in front of it, stepped one at a time by wheel, key or touch, entered and left through a cloud |
| Skreed sections it feeds | Section 4 part three, the five scenes after the bubble (`docs/specs/section-4-flux.md`): the step, the fov pinch, the gesture rules, the scroll map, the product slot and its key light, the cloud on the loop screen, and the ten regenerated backgrounds |
| Reconciled against | Nothing captured the same day. It replaces the ring travel and the four lands of `section-4-world.md` for everything after the bubble; the hall, the walk, the door, the station and the bubble stay |
| Treated as | Untrusted third-party data: read as text in its own folder, nothing executed, no page opened, nothing copied into `src/` or `public/`. The post-build guard bans its file names and strings |

## What makes it work

1. One gesture is one whole step. Every wheel tick, Down or Up key, or 12 px of touch is a complete 0.77 s move on power2.out; the page is snapped to the scene's 50vh slot when it ends and nothing arrives for 150 ms after. No scene is ever seen half way, so it reads as a place rather than a scroll.
2. The rooms swing, they do not cut. Two cover-fitted video planes sit on a ring of radius 7 and swing 80 degrees, both facing a fixed camera 6 units away; they meet at the screen's centre line at the half of the move with the incoming plane nearer, so it overdraws the outgoing one. Half the angle happens in the first 0.22 s.
3. Lights down, black, lights up. The outgoing plane plays a 1 s outro as it leaves; the incoming plane is black for the first half of the move and starts its 1 s intro at the half, so the next room lights up as it settles. With the fov pinch this is the "rotation of perspective".
4. The pinch is small and on the product. The fov goes 45 to 42 by 0.65 of the step and back by its end, a cubic smoothstep each way; the planes are refitted to the view every frame, so the pinch enlarges the bottle and steepens the swinging planes without zooming the room.
5. The rooms are video, unlit. Each is a 1700 x 884 h264 loop at 30 fps, 3.2 to 4.2 s, cover-fitted with 1 percent overscan on a material the canvas's tone mapping does not touch. The fog, the water and the gradients Sam named are inside the clip; the code only plays it.
6. One live object. A single bottle at scale 10, 3.4 units from the camera, turns 180 degrees per step and swaps its label texture at the half; its key light, one of an 11-light Blender rig, cross-fades over 1.1 s to the scene's own tint (five colours).
7. The page is held. Lenis is stopped for the step; inside the carousel the wheel, keys and touch are captured at window level with a burst filter (200 ms, half the peak) against trackpad tails.
8. The seams are clouds. The carousel is entered and left through an fbm cloud wipe (280 ms in, 360 ms out, a 400 ms lock) that pins the page, covers it and jumps it to the next section's top under the cover. The cloud never runs between scenes.

## What Skreed takes

| Idea | Skreed form | Spec |
|---|---|---|
| The step: one gesture, one whole 0.77 s move on power2.out, the 80 degree arc on a radius-7 ring, the planes billboarded to a fixed camera at (0, 0.2, -1) looking at (0, 0, -7), the front index switching at 0.75, the 150 ms cooldown | The same numbers in our own carousel module, one clock per gesture and one tween per step, no library; Tune keys stepMs 770, sweepDeg 80 | section-4-flux.md section 4, F-1, F-13 |
| The fov pinch 45 to 42 with the return at 0.65, cubic smoothstep each way | The same curve; Tune keys fovStep 42, fovReturnAt 0.65 | section 4, F-1 |
| The scroll map: 50vh a scene, in range within 2 px, the page snapped to the scene's slot after a step, a scene resynced from the page position when it changes without a gesture | sceneQ(i) = 10 + 0.5 i in the section's own screens; the same 2 px tolerance; the same resync | section 5 |
| The gesture rules: wheel sign, the burst filter (200 ms, 0.5 of the peak), ArrowDown, PageDown and Space forward, ArrowUp, PageUp and Shift+Space back, the ignored targets and modifiers, 12 px of touch once per touch, capture at window level | The same, captured only while the carousel is in range and at scroll 0 after the intro (E-S4-scroll); elsewhere the page scrolls natively | section 2, AC3, E-S4-scroll |
| The video plane: a 1 x 1 unlit plane cover-fitted every frame with 1.01 overscan, the loop kept playing within 0.3 of the front and reset at 0.02 | The same fit and the same play rule on our own loops, drawn as display values | section 4, F-9 |
| The product slot: 2.6 units in front of the ring point, 3.4 from the camera, 180 degrees per step on the fractional step, the swap at the half, the pointer's 0.3 rad | Our four products in that slot, swapping mesh at the half; the pointer look the same | section 4 |
| The per-scene key light tint lerped over 1.1 s | The five colours as the products' key light, by the reference's scene order | section 3, "Key light" |
| The cloud wipe's shader (value noise, 6-octave fbm, the density and core curves) and its cover curve (1 minus (abs(top minus 0.7) minus 0.25) over 0.45, clamped, then quintic) | Our own GLSL from the formulas in the evidence doc, in the in-canvas form on one renderer, as the exit over the loop screen only | section 4, F-2 |
| The scene order and the five rooms' colours | The same order; "the same colors what they use for all 5 scenes" (E-S4-colour as amended) | section 3 |
| The captions' timing (out 0.32 s, in 0.2 s after 320 ms) | The text wipes out at the step's start and decodes back in at its end, in section 2's label type | section 4 |
| The clips' facts: 1700 x 884, 30 fps, loops 3.17 to 4.23 s, intros and outros 1.0 s, seamless by convention (first frame equals last) | Our ten loops are 5.0 s at 24 fps with the first frame equal to the last within 2/255; no intros or outros (F-4) | section 3, evidence section-4-flux-loops.md |

## What we leave

| Leave | Why | Rule or item |
|---|---|---|
| React, react-three-fiber, GSAP and Lenis; the 121 KB scene chunk and the 271 KB bottle chunk | Our stack only (Sam, 2026-10-22): Astro and three, no library; the whole page's JS line is 250 KB gzip | CLAUDE.md Stack, section 6 |
| The reference's videos themselves | Nothing of the capture ships; our backgrounds are regenerated loops, with Sam asked to confirm their provenance | F-11, For Sam 3 |
| The intro and outro clips and the incoming plane black until the half | Our loops have no intros; black would read as a fault. The bubble is the lights-up and the cloud the lights-down | F-3, F-4 |
| The fetch-to-blob preload and the 14 hidden video elements kept alive by a 2 s watchdog | Loops stream by URL under media-src 'self'; five elements at most, unlocked in the press task | section 5, E-S4-video |
| The page-level cloud on its own WebGL context, and the cloud at the hero seam | One renderer; the entry seam is the bubble Sam kept; the cloud is the exit only | F-2, D7 |
| The Safari canvas path (a manual clock copying frames into a CanvasTexture) | A VideoTexture per element; a refused or late loop keeps the still | section 5 |
| ACES tone mapping at exposure 1.8 and the PMREM room environment | Section 4 draws display values under NoToneMapping; the reference's own planes are unlit too | F-9 |
| The bottle, its label textures, the dreamer cap swap and the 11-light Blender rig | Our products are different meshes per scene, lit by our own key light | section 3 |
| The captions' type (6vw uppercase at weight 700) and the gradient under them; the scroll cue and the skip-to-products button; the product reveal | Plain text in section 2's label type with its decode; no panels, no fills, no cue | rule 25, AC10 |
| Lenis on the rest of the page and its 40dvh seam overlaps | The page keeps native scroll; the loop both ways and the glue are built on it | F-5, E-S4-snap |
| The cursor parallax (off in the reference anyway) | No cursor-following effects beyond the product's look | rule 13 |
| lil-gui, the debug minimap, the FPS stats and the five dead 3D scenes in the bundle | Debug and dead code | |
| The light reveal, the bloom lerp and the light-up shader | Wired but inert in the reference; copying their parameters adds nothing visible | evidence section 14 |

## Where the capture sits

- The zip: `www.fluxtheory.in.zip` at the repo root, 14,427,471 B. Untracked and named in `.git/info/exclude` (line 11), so `git status` does not list it and `git add -A` cannot stage it; the repo is public and it must never be committed.
- The unpacked copy, with the six chunks pretty-printed in place so the evidence doc's line pointers hold: `the session scratchpad, folder flux-ref/`, a session scratchpad that may vanish. The zip is the record; unpacking it again and pretty-printing the six files named in the evidence doc restores the pointers.
- The real scene clips, 14 files, 6,803,005 B, downloaded from the Shopify URLs the chunk names: `the session scratchpad, folder flux-videos/`, with the stills and the regenerated loops in its subfolders (their record is `docs/specs/evidence/section-4-flux-loops.md`).
- Nothing from the capture is under `assets-src/`, `src/` or `public/`.

## Open questions

- Provenance: our ten backgrounds descend from frames of the reference's own clips, inpainted and re-animated; the repo is public. Sam confirms he is content to ship them, or the five rooms are regenerated from text alone (For Sam 3).
- The wheel and the finger are captured for whole steps inside the carousel's two screens, so a phone cannot scroll through it by momentum (For Sam 6).
- The phone chunk was not captured; what the reference does under 1024 px is unknown, and our portrait set is our own answer to Sam's "phones as well".
