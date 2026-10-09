# Section 1: the hero (port of the approved v9.9 prototype to the real stack)

Slug `hero`. Written 2026-10-09 by the plan step. Revision 2 (same day) fixes every problem the critics raised against revision 1. Review log: `docs/specs/hero.review.md`. How it is built, including the ordered build plan: `docs/specs/hero-architecture.md` (build order in section 17). Tokens: `DESIGN.md`.

The thing being ported is `prototypes/hero-v9/template.html` (v9.9, artifact version 25, documented in `prototypes/hero-v9/README.md`). Sam approved it on 2026-10-09: "I'm good with whatever we've built so far." Every behaviour, string and number below comes from that file, its README, the four reader reports of 2026-10-09 (3D inventory, shell inventory, stack facts, asset and bundle probe), the critics' measurements of the same day, or the binding docs. Nothing under `prototypes/` is changed by this work.

## 0. Locked values (Sam, 2026-10-09)

These are binding for the real build. They come from Sam's two Tune screenshots, recorded in the session file `LOCKED_VALUES.md` (copied to `docs/specs/evidence/LOCKED_VALUES.md` in build step 1).

**Fog (igloo smoke).** These equal the v9.9 defaults (`template.html` line 305).

| Tune label | Param | Value |
|---|---|---|
| Fog amount | `fog` | 1.00 |
| Fog brightness | `fogBright` | 0.40 |
| Fog drift speed | `fogSpeed` | 0.15 |
| Wisp size | `fogSize` | 1.00 |
| Ground hug | `fogHug` | 1.60 |

**Terrain.** These change the v9.9 defaults. The real build uses the locked value.

| Tune label | Param | v9.9 default | Locked |
|---|---|---|---|
| Ground exposure | `gExp` | 0.45 | 0.20 |
| Ground contrast | `gGamma` | 0.70 | 0.87 |
| Near ground | `gNear` | 0.68 | 0.54 |
| Shadow floor | `gToe` | 0.03 | 0.02 |
| Crumb grain contrast | `crumb` | 0.35 | 0.53 |
| Crumb grain size | `crumbSize` | 0.03 | 0.07 |
| Ground mist | `mist` | 0.55 | 0.20 |
| Ground mist speed | `mistSpeed` | 1.00 | 0.55 |

A test reads the runtime params of the built hero and compares them with both tables (AC1.1). The parity harness gives the prototype the same values through its URL overrides (`?gExp=0.2&gGamma=0.87&gNear=0.54&gToe=0.02&crumb=0.53&crumbSize=0.07&mist=0.2&mistSpeed=0.55`). Those set the prototype's `P` before any uniform exists, so both pages start from the same numbers. Setting the Tune inputs and dispatching `input` is the equivalent method named in `LOCKED_VALUES.md`.

The harness also passes `&logoIdle=0` to the prototype, because the production build ships without the idle twitch (D20). `logoIdle` is not one of Sam's locked values; it is changed for WCAG 2.2.2.

Every other value of the prototype's 66-key `P` table keeps its v9.9 default. The full table is in `hero-architecture.md`, section 5.5.

## 1. Goal

Put the approved v9.9 hero on the decided stack (Astro 7 static on Cloudflare Workers + Static Assets) so it stops living only in an artifact. It must match the prototype pixel for pixel wherever the prototype is deterministic. A static poster loads first and stays wherever WebGL cannot or should not run.

Brand goals served (Prem's order in `docs/00-IDEATION.md`): goal 2, "say this changes everything in the space", and goal 1, "a lifestyle brand that connects". These are the same goals as spine row 1.

## 2. Phone-first wireframe in words

### 390 x 844, 3D path, first paint to rest

**First paint (HTML only, before any JavaScript file arrives).**
- The screen is night, `--night` #050506 (the loader, and the page background under it).
- The Skreed wordmark sits in the centre at `min(47.6svh, 72vw, 600px)` wide, which is 281 px at 390 px. It rests at Pearl Whisper `#F7F6F341`, that is 65/255 or 25.5 percent.
- The percent counter sits at the bottom centre in Open Sans 400, tabular figures, tracked 1.1 em, `clamp(40px, 9svh, 88px)` above the bottom edge. It starts at 0.
- Nothing else shows: the corner logotype and the countdown are under the loader, and the cue is hidden while `html.loading` is set.

**Loading (the approved ciao-style loader).**
- Every 1.6 s a soft band of light runs across the wordmark from the s to the d in 0.7 s. The band is about 0.3 of the wordmark's width at half height and tilted 5 degrees. It flares on the d.
- From 1.6 s the wordmark fills with Pearl Whisper from the s, behind a soft edge 0.22 of its width, at about a quarter width per second. The fill never runs ahead of the real load: 23 milestones reported by the hero (the hero chunk with `pieces.json`, each of the ten blocks, the sky and ground textures, the scene, six compile groups, the compile, two real frames).
- If 4 s pass without progress, a status line appears above the percent: "Slow connection" while a network milestone is pending, "Still loading" otherwise.

**Exit.** Once the second real frame is drawn:
- the lit wordmark dims over 1.24 s while the next band passes;
- a hairline outline appears and holds;
- the percent reaches 100 and fades;
- the screen lifts in 0.6 s.

On a fast load the whole sequence takes 8.2 s from first paint to the hero.

**When loading stalls or the device goes offline (soft poster).** The loader's wordmark gives way to the poster image (the hero's rest frame), the track collapses to one screen, and the logotype and countdown stay as they are. Offline, one status line stays above the bottom centre: "You are offline. The countdown still runs." If the hero finishes later and the page has not been scrolled more than 8 px, the loader lifts into the hero as usual. If the visitor scrolls first, the poster stays for the visit (section 5).

**The hero at rest.**
- The SKRD mark stands in the middle of the screen as ten matte black blocks, about 0.95 units deep, on a moonlit snowfield. Behind it is a night sky with a faint Milky Way, and four bands of igloo-style fog drift low over the snow.
- On a portrait phone the camera zoom is `min(1, aspect * 1.25)`, which is 0.578 at 390 x 844, so the whole mark fits with air around it.
- The blocks bob 0.07 units on a 0.7 rad/s sine and breathe a little. The camera shakes by 0.01. All of this ramps in over 2 s (cubic out) after the lift.
- Corner logotype: top left, 96 px wide, at the corner inset (16 px on a 390 phone, measured).
- Countdown: bottom left at the same inset. Eyebrow "Launch in", then four groups (days, hours, minutes, seconds) of two Open Sans 600 tabular numerals with a label under each. Below 1100 px wide the countdown sits 84 px higher, so the cue has its own row.
- Scroll cue: bottom centre. The word "Scroll" over a 9 px Pearl Whisper ball that drops 22 px onto a short line, squashes and springs back on a 1.5 s cycle. It bounces three times, lands, and rests on the line (D20).

**Touch.**
- A finger on the mark pushes the blocks within 1 unit fully and fades the push out by 3 units. Each pushed block lifts, tilts and glows from its cut faces in its family shade (the 'cool' order, section 3).
- While a finger is down, the camera also turns a little toward the touch point, as the pointer does on a laptop (the prototype's parallax reads any active pointer, touch included).
- Labels join the pushed blocks, one per 0.05 units of finger travel, up to five. Each label is a 3 px pip and a two-digit readout in Open Sans 600, 12 px, tabular. Hairlines in Pearl Whisper at 35 percent link each label to its two nearest.
- Ghost sweep (touch devices only): once the hero's life has fully ramped in (`live` reaches 1, 2 s after the lift) and no finger has touched for 2.5 s, a slow sweep moves the push across the mark. With no touch at all since load, it starts the moment `live` reaches 1, because the last-input time starts in the distant past.
- A tap on the logotype runs a 0.25 s glitch burst and scrolls to the top.

**Scroll.** The page is a 460svh track over a fixed canvas.
- **0 to 1.5 screens: pull-back.** Two followers smooth the scroll (0.075, then 0.15). The camera pulls back from (0, -2.5, 24) to (0, 3.2, 36) on an ease-in-out cubic. Its target moves from (0, -1, 0) to (0, -1.2, -6). The push and the labels fade out as the pull-back starts (`1 - smoothstep(0, 0.45, s)`). The cue fades out as soon as the page moves 8 px.
- **1.5 to 2.5 screens: the wipe.** An igloo-style diagonal wipe of ice shards and tech blocks reveals section 2's frame. The countdown rides up by `0.4 * tp^3 * 100vh` and is clipped above the wipe edge. The corner logotype turns Urban Slate once the wipe passes half way.
- **2.5 screens to the end of the track:** section 2's frame drifts down by up to 0.8 units over 1.5 screens.
- Past the track, whatever follows (section 3, the Wall, not in this section) scrolls over; the canvas stops rendering and hides once the track has left the viewport.

**Section 2's frame, for now.** Until the rocks land (section 2, built elsewhere) it is the v9.9 frame: the 240 shades as circle swatches in catalog order on Pearl Whisper, 12 per row on a portrait screen, with no copy (D9).

### 390 x 844, poster path (no WebGL2, no hardware WebGL2, data saver, low memory, reduced motion, no JavaScript, or any failure)

- First paint is night, then the poster: the hero's rest frame as a still image filling the first screen, AVIF with a WebP fallback, about 42 KB. It sits in the first screen and scrolls away with it (D29).
- The corner logotype and the countdown sit over it exactly as on the 3D path. There is no loader.
- The page's first screen is one screen tall: the 460svh track collapses to 100svh and the countdown sits in that screen, not fixed.
- The cue shows only when there is something below to scroll to. In this section nothing follows the hero in production, so the cue is hidden (D27).
- The logotype runs its 0.5 s intro burst 0.75 s after its script installs (the prototype's no-loader timing) and keeps its glitch on hover, tap and focus. It does not need WebGL. Under reduced motion it never glitches.
- Without JavaScript the countdown shows one line instead of numerals: "Launching 1 November 2026" (D27, AC4.3).

### 1280 x 800

Same composition, wider frame:
- The camera zoom is 1, so the mark sits smaller in a wider valley. More of the sky and the far ridge shows.
- The logotype is 136 px wide at the 44.8 px inset (measured).
- The countdown numerals reach `clamp(2.3rem, 7vw, 4.8rem)` (up to 77 px). From 1100 px up the countdown sits on the bottom inset with the cue on the same baseline in the centre.
- Pointer instead of touch: the push follows the mouse, and the camera turns a little toward the pointer wherever it is in the viewport (theta 0.07 x pi/2 x x, phi -0.025 x pi/2 x y, eased at 0.035).
- No ghost sweep.
- Hovering the logotype runs the glitch, and keyboard focus (`:focus-visible`) runs it too.
- The wipe slope is 0.2 x aspect, so the edge is steeper on a wide screen.

## 3. Content

### Copy (every string the section renders)

| Id | String | Where | Status |
|---|---|---|---|
| `ld.aria` | Loading Skreed | `#intro` aria-label (role progressbar) | approved, v9.9 |
| `ld.slow` | Slow connection | loader status, after 4 s without progress, network milestone pending | approved, v9.9 |
| `ld.still` | Still loading | loader status, after 4 s without progress, otherwise | approved, v9.9 |
| `ld.offline` | You are offline. The countdown still runs. | status line when offline before the hero is ready; on the poster it stays as the only visible part of `#intro` (section 5) | approved, v9.9 |
| `ld.pct` | 0% to 100% | loader percent | approved, v9.9 |
| `cd.eyebrow` | Launch in | countdown eyebrow (`#cdEyebrow`) | approved, v9.1 |
| `cd.units` | days, hours, minutes, seconds | countdown labels | approved, v9.1 |
| `cd.aria` | Time until launch | `#count` aria-label (role timer) | approved, v9.1 |
| `cd.live` | Skreed is live. skreed.com | eyebrow at zero; "skreed.com" is a link to `https://skreed.com` (D12) | approved text, v9.2 |
| `cd.noscript` | Launching 1 November 2026 | the no-JavaScript line, with "1 November 2026" in `<time datetime="2026-11-01T00:00+05:30">` | approved, v9.2 |
| `cue.label` | Scroll | scroll cue | approved, v9.1 |
| `logo.aria` | Skreed, home | corner logotype link | approved, v9 |
| `h1` | Skreed. Tech essentials that go beyond basic. | visually hidden h1, the page's only h1, first in reading order (D13) | new, tagline from the catalog, needs Sam's yes |
| `title` | Skreed. Tech essentials that go beyond basic. | `<title>` of `/` | new, needs Sam's yes |
| `description` | Skreed launches in India on 1 November 2026. 240 shades. One of them is yours. | meta description of `/` | new, from 00-IDEATION facts and type-system role 2, needs Sam's yes |
| `poster.alt` | The Skreed mark in ten black blocks on a moonlit snowfield. | poster `<img>` alt (G9) | new, descriptive, needs Sam's yes |

The prototype's fallback text ("This prototype needs WebGL2...") and the section 2 placeholder copy ("The Wall." and its sub-line) do not ship (F2). The poster is the designed failure state, so a failure shows no error copy; only offline shows `ld.offline` (section 5).

### Shades (by id from `docs/data/shades-240.json`; names repeat across families, so ids are the keys)

Block glows, the 'cool' order, by block index 0 to 9:

| Block | Id | Name | Hex |
|---|---|---|---|
| 0 | blushing-corals-04 | Mango | #ff9f40 |
| 1 | stormy-greys-05 | Silver | #acacac |
| 2 | frosty-whites-07 | Snow | #f0f4f5 |
| 3 | blissful-blues-08 | Sky | #08bcf4 |
| 4 | earthy-browns-07 | Cinnamon | #ba7237 |
| 5 | vivid-violets-07 | Amethyst | #8554d1 |
| 6 | mellow-yellows-01 | Sunbeam | #fff164 |
| 7 | playful-pinks-14 | Rouge | #f2638f |
| 8 | go-green-12 | Lawn | #4aa325 |
| 9 | roaring-reds-07 | Crimson | #d20000 |

Sky galaxy wash: blissful-blues-23 Space #15284f, vivid-violets-24 Eggplant #4a154d, go-green-22 Forest #084f3d, roaring-reds-23 Wine #4b0923. The other Wine, vivid-violets-23, is a different colour; this is why the generator looks shades up by id.

Logotype glitch pairs (one pair per burst; the intro burst forces the first):
- blissful-blues-08 Sky with roaring-reds-07 Crimson;
- vivid-violets-07 Amethyst with mellow-yellows-01 Sunbeam;
- go-green-12 Lawn with playful-pinks-14 Rouge;
- blissful-blues-08 Sky with blushing-corals-04 Mango.

Lightness weights for the glitch: Sky .74, Mango .78, Amethyst .56, Sunbeam .94, Crimson .54, Lawn .64, Rouge .69. The ghost fills are written as `var(--shade-<id>)` from the generated shade tokens (D30).

Section 2's interim frame: all 240 shades in catalog order, frosty-whites-01 to roaring-reds-24.

### Renders and data

Stage 1 is a test build only: it uses the prototype's files unchanged and is never deployed (D7). Stage 2 is the first deployable build; its encodes are specified in `hero-architecture.md` section 6.

| Id | Source | Stage 2 form | Use |
|---|---|---|---|
| `sky` | `prototypes/hero-v9/assets/sky.webp` (4200 x 2100, 1,173,974 B) | portrait crop 1298 x 1388 and wide crop 3208 x 1388, AVIF q50 with WebP q84 fallbacks | sky dome |
| `ground` | `prototypes/hero-v9/assets/ground_bake.webp` (4096 x 4096, 802,974 B) | 4096 AVIF q50; 2048 WebP q82 for WebP-only browsers | baked snow |
| `ground_h` | `prototypes/hero-v9/assets/ground_h.bin` (400 x 320 u16, 256,000 B) | row-and-column delta coded, then gzip (D22) | terrain heights |
| `stones_p`, `stones_c`, `stones_i` | `prototypes/hero-v9/assets/stones_*.bin` (18,396 / 9,198 / 35,040 B) | gzip (D22) | 70 stones, 3066 vertices, 5840 triangles |
| `moon_meta` | `prototypes/hero-v9/assets/moon_meta.json` (279 B) | bundled as a JSON module | grid and stone bounds |
| `pieces` | `prototypes/hero-v9/pieces.json` (variant 10 only, 118,933 B) | fetched as data | the ten block outlines |
| `wordmark` | `docs/brand/logo/skreed-logotype.svg` (six paths, byte-identical to the prototype sprite) | inline sprite | loader mask, loader outline, corner logotype |
| `poster` | stage 1: a provisional render of the prototype; stage 2: rendered from the built page, one per aspect class (AC8.4) | AVIF with WebP fallback | LCP image and fallback |

## 4. Motion plan

**Libraries.**
- three.js 0.165.0 (pinned, D1) runs the canvas in its own requestAnimationFrame loop, with frame-rate independent damping.
- The loader uses Web Animations on transform and opacity only, so it keeps running on the compositor while the scene's scripts block the main thread.
- The cue is a CSS keyframe animation of 2.44 cycles of 1.5 s: three bounces, ending on a landing (D20).
- The logotype glitch is SVG clip slabs driven by requestAnimationFrame.
- No GSAP, no ScrollTrigger and no Lenis in this section (D6). The scroll mapping is the prototype's own: native `scrollY / innerHeight` through two followers.

**Triggers and choreography** (every constant is in `hero-architecture.md` section 5.5).

| Trigger | What moves | Timing |
|---|---|---|
| First paint | loader light band | every 1.6 s after a 0.2 s delay, 0.7 s run |
| Milestones | loader fill | held at real progress, quarter width per second, catches up at twice the pace once ready |
| frame2 reported | loader exit | dim 1.24 s, outline 0.24 s, percent to 100 then fades over 400 ms after 300 ms, lift 0.6 s, 8.2 s total on a fast load |
| Lift (`__introDone`) | hero life (bob, shake, breath, parallax, ghost) | ramps in over 2 s, cubic out |
| Lift | logotype intro glitch | 0.5 s burst 0.25 s after the cut, pair Sky and Crimson |
| Poster tier, glitch script installed | logotype intro glitch | 0.5 s burst after 0.75 s, pair Sky and Crimson |
| Pointer or touch on the mark | push, glow, labels | followers at 0.06; pointer follower 0.05; labels in 0.1 s, out 0.06 s |
| Any active pointer, touch included | camera parallax | theta and phi eased at 0.035, times `live` |
| `live` reaches 1, or 2.5 s after the last input, touch only | ghost sweep | `(sin(0.45t) * 0.55, sin(0.31t + 1) * 0.3 + 0.1)` |
| Scroll 0 to 1.5 screens | camera pull-back | followers 0.075 and 0.15, ease-in-out cubic |
| Scroll 1.5 to 2.5 screens | wipe, countdown ride, logotype tone | `tp` from 0 to 1 |
| Scroll past 8 px | cue fades out | 0.4 s, `cubic-bezier(.2, 0, 0, 1)` |
| Page shown | cue | three bounces in 3.66 s, then rests on its line |
| Pointer enter, touch, focus-visible on the logotype | glitch burst | 0.25 s, 3 patterns |

There is no idle twitch in production (D20). The prototype's every-8-to-16-s twitch remains in the dev build behind Tune.

**Reduced motion** (`prefers-reduced-motion: reduce`). Default (D2): the island is not downloaded. The poster path renders:
- poster;
- countdown without the seconds group;
- cue still;
- glitch off;
- no loader.

The scene reads the setting once at start, as the prototype does. The glitch checks it live before every burst, as the prototype does (`reducedMQ.matches`), so turning reduced motion on after load stops new bursts.

`REDUCED_MOTION_TIER` in `src/config/hero.ts` switches to `still3d`, which is the prototype's own reduced-motion behaviour. That is the open question for Sam. Under `still3d`:
- the loader has no light passes, fills at twice the pace and fades in 0.4 s;
- the hero has no bob, shake, breath, pull-back or ghost sweep, and its shader time is frozen at 0;
- the wipe runs calm, with no parallax, displacement or chromatic aberration;
- hover push still works, because it is an interaction.

The parity harness uses `still3d` through a test-only override (`?tier=still3d`, test and staging builds only; section 10 of the architecture).

## 5. Data and states

**Inputs.**
- The clock (countdown, scene time).
- Pointer and touch.
- `scrollY` and `innerHeight`.
- `prefers-reduced-motion` and `(hover: none)`. The scene reads both once; the glitch reads reduced motion live.
- `WebGL2RenderingContext`, a throwaway WebGL2 context with `failIfMajorPerformanceCaveat`, and its unmasked renderer string.
- `DecompressionStream`.
- `navigator.connection` (`saveData`, `effectiveType`) and `navigator.deviceMemory`.
- `navigator.onLine` and the `offline` event.
- The asset files in section 3.

**Outputs.**
- The canvas.
- The DOM riders (countdown transform and clip-path, cue class, logotype `data-tone`).
- Classes on `<html>`: `js`, then exactly one of `hero3d` or `poster`; `loading` while the loader shows; `still3d` under that tier. `intro` and `uh1` to `uh4` are reserved for the v10 slot.
- The prod globals contract:
  - `SKREED_POSE` and `__skreedLoaderReport(m)`;
  - `__skreedLoader` with `setProgress`, `ready`, `cut`, `skip`, `fail`, `seek`, `state`, and the port's `abort` and `inert` (architecture 7.2);
  - `__skreedOnPoster(kind, msg)`, set by `boot.ts`, called by the loader on a soft poster;
  - `__introDone`, `__heroStarted`, `__skreedLogo`;
  - `__skreedCountV`, together with `#count[data-hold]`, for the v10 slot.

**Tiers** (D3):

| Tier | Chosen by | When | Gets |
|---|---|---|---|
| `poster` | the head Gate script, before first paint | no `WebGL2RenderingContext`; `saveData` true; `effectiveType` slow-2g or 2g; `deviceMemory` 2 or less; no `DecompressionStream`; reduced motion (unless `still3d`); no JavaScript (default CSS) | poster, countdown, logotype, no island bytes |
| `poster` | `boot.ts`, before any island byte is requested | the throwaway context with `failIfMajorPerformanceCaveat: true` is null; or its renderer string names a software rasteriser (SwiftShader, llvmpipe, softpipe, "Software", "Basic Render") | the same; the loader is removed |
| `hero3d` | everything else | | loader, then the island; sky crop by aspect class (portrait below 0.9) |

**Failures after the 3D tier was chosen** (D19; mechanism in `hero-architecture.md` 7.3):

| Kind | Causes | Result |
|---|---|---|
| Hard, terminal | import or chunk failure; a module script load error before the hero starts; `pieces.json` or a binary failing to load; a texture failing to load; renderer construction failure; `webglcontextlost`; any error from the hero before `__heroStarted`; a soft poster followed by a scroll past 8 px | island stopped and its context released, `html.poster`, loader removed (or kept only as the offline line when offline), every ride style, tone, label, `inert` and v10 class reset, scroll position kept sensible. `__introDone` is never called after this point, whatever phase the loader was in (load, exit, enter or lift). |
| Soft, recoverable | the loader's own stall rules (12 s without progress once `scene` is in, 20 s before it) and offline before ready | the loader's poster state over the poster image, `html.poster`, island keeps loading. If `frame2` arrives before any scroll past 8 px, the loader swaps back to `hero3d` and lifts into the hero as usual. |

**CHECKLIST H column for section 1** (the H table's "1 Splitter hero" column predates the decision; this replaces it for the hero):

| State | Hero |
|---|---|
| Empty | n/a: no input or data set can be empty. The countdown always has a value. At zero the eyebrow reads `cd.live` and the numerals are not displayed. |
| Loading | 3D path: the full-screen loader, with honest progress from 23 milestones (exception E-H1, section 10). Poster path: none; first paint is HTML plus the preloaded poster. The countdown numerals are hidden until the first tick, which runs in the same task as the script, so no false value shows. |
| Error | Every failure hands over to the poster path (the failures table). There is no error copy on screen, because the poster is the designed state. A console warning names the cause. |
| No internet | The page already loaded works: the countdown runs from the device clock. Offline before the hero is ready: the poster with `ld.offline` above the bottom centre. |
| Slow network | The poster (fetchpriority high, preloaded) is the LCP element. The loader shows `ld.slow` or `ld.still` after 4 s without progress, and the fill never runs ahead of the load. A slow `pieces.json` or binary counts as network (architecture 7.4). The island starts only after the poster has decoded, so it never competes with the LCP bytes. |
| No results | n/a: no search. |
| Permission denied | n/a: the hero asks for no permission. There is no gyroscope, camera or clipboard. |
| Session expired | n/a: no sessions. |
| Form validation | n/a: no form. |
| Success | The loader exit (dim, outline, 100 percent, lift), then the hero's life ramps in over 2 s. |
| Reduced motion | Section 4. |
| Data saver, low memory, no WebGL2, software WebGL, no JS | Poster tier, as in the tiers table. |

## 6. Budget

The section may add the following. Measured values are from the asset and bundle probe and the critics' measurements (2026-10-09); budget lines are from CLAUDE.md, CHECKLIST C and Lighthouse's mobile "good" thresholds.

| Item | Budget | Expected (measured or computed from measured parts) |
|---|---|---|
| Critical JS the hero adds (inline Gate, loader, countdown and cue; the `boot.ts` chunk; the glitch chunk), gzip | at most 8 KB gz of the 60 KB gz page budget (C1) | inline 4.1 KB gz (measured shell scripts), boot about 0.9 KB gz (probe gate), glitch about 2.5 KB gz |
| Island JS (three 0.165.0 tree-shaken plus the hero chunk), gzip | at most 140.6 KB gz, the probe's r165 plus the v9.9 scene with its Tune wiring; the port drops Tune, so it must come in at or under | 119.3 KB gz three, 21.3 KB gz scene before Tune removal |
| Total JS the hero adds to the page | at most 148.6 KB gz, leaving 101.4 KB gz of the 250 KB gz page budget for later sections | about 148 KB gz |
| Poster image, per aspect class | at most 120 KB (C2) | phone 488 x 1056 AVIF q60 42,668 B (WebP q80 44,492 B); desktop 1920 x 1200 AVIF q50 86,318 B (WebP q70 91,548 B) |
| Fonts fetched on `/` | Open Sans only (the hero has no visible Poppins or serif) | 19,712 B |
| Critical set before LCP (shell HTML with inline CSS and the 240 shade tokens, boot, Open Sans, poster) | none set; reported | phone 72,422 B; desktop 116,072 B |
| First view per class: everything up to the live hero, as served (text brotli as Cloudflare serves it; images, fonts and the pre-gzipped binaries as stored) | at most 1,500,000 B (CLAUDE.md "1.5 MB", read as decimal) | phone AVIF 1,051,605 B; desktop AVIF 1,274,946 B; phone WebP-only 1,106,095 B; desktop WebP-only 1,431,329 B (tightest, 68,671 B headroom). Parts in `hero-architecture.md` 6.6. |
| HTML | no `data:` URI and no base64 payload in the document | shell about 7.9 KB br, plus 1.3 KB br of shade tokens |
| LCP, Lighthouse mobile, graded run | at most 2.5 s | calculated 1.2 to 1.5 s for the critical set on Lighthouse 4G; not yet measured |
| TBT, Lighthouse mobile, graded run | at most 200 ms | not yet measured; the graded run is the poster tier (D23) |
| Speed Index, Lighthouse mobile, graded run | at most 3.4 s | not yet measured |
| CLS | at most 0.1 | not yet measured |
| INP, field p75 (`01-stack-and-hosting.md`) | at most 200 ms | not measurable here; Cloudflare Web Analytics later |

How Lighthouse is measured, and what is graded, is decision D23 and AC10.1.

## 7. Acceptance criteria

Each criterion is graded PASS or FAIL by the reviewer, with evidence. The harness is described in `hero-architecture.md` section 13.

The rendering setups used below:
- **Phone canvas captures:** 390 x 844 at deviceScaleFactor 1.25. The drawing buffer is 487 x 1055 (three floors 487.5); the element screenshot is 488 x 1055 device pixels. Both pages go through the same scaling, so the comparison is like for like. This is the setup the asset probe measured.
- **Phone behaviour tests:** 390 x 844, `isMobile`, `hasTouch`, deviceScaleFactor 2.
- **Desktop:** 1280 x 800, deviceScaleFactor 1.5. Drawing buffer and screenshot are both 1920 x 1200.
- **Prototype:** `prototypes/hero-v9/index.html`, served by the harness with three 0.165.0 from the port's own `node_modules`, the locked values and `logoIdle=0` as URL overrides.
- **Port:** the test build (`npm run build:test`) under `wrangler dev`, with `?tier=hero3d` or `?tier=still3d` wherever the 3D path is needed, because headless Chromium only has software WebGL (D3). AC8.1 and AC10.1 use the production build.
- **Filler:** test builds render a 100svh Pearl Whisper block in the after-track slot, so the track can leave the viewport (AC2.4, AC3.9, AC8.2). Production renders nothing there in this section.

**AC1. Locked values and visual parity at rest.** Ties to F1, A5 and A1.
1. The test build's `__skreedParams()` returns exactly the 13 locked values in section 0, and `logoIdle` 0.
2. **Canvas-only rest frames.** Settings: `__skreedFreeze` set before load, so scene time stays at 0; at least 3 frames after the loader's `ready`; DOM overlays and the poster hidden. The frames are taken in two setups: normal motion, and emulated reduced motion with the port on `?tier=still3d`. Compared with the prototype:
   - **Stage 1** (asset files byte-identical to `prototypes/hero-v9/assets`): identical frames, PSNR 99, which is the noise floor measured for the prototype against itself.
   - **Shipping build** (stage 2 encodes):

     | Viewport | PSNR | SSIM | Sky band (top 40%) SSIM | Ground band (bottom 35%) SSIM |
     |---|---|---|---|---|
     | Phone | at least 42.1 dB | at least 0.976 | at least 0.967 | at least 0.979 |
     | Desktop | at least 41.5 dB | at least 0.974 | at least 0.967 | at least 0.976 |

     These are the values measured for the approved encode proposal, rounded down. The first shipping run with the locked values is recorded in `hero.review.md`, and if the locked-value baseline of the same encodes measures lower, that run becomes the threshold. The x8 difference map must show codec grain only, with no shift.
3. **Overlay layer.** Settings: canvas and poster hidden; `html` and `body` background forced to one colour on both pages (the prototype's body is Urban Slate, the port's is night, D24); `Date` fixed with `page.clock.setFixedTime`; both pages given the same local Open Sans file; cue animation paused at 0; `Math.random` pinned to 0.5. The DOM overlay at rest (logotype, countdown, cue) is identical to the prototype's at both viewports, in both stages.

**AC2. Scroll pull-back, wipe and stopping.** Ties to F1, D2 and C3.
1. **Pull-back.** In normal motion with no pointer, scroll to 0, 0.375, 0.75, 1.125 and 1.5 screens. Wait until `__skreedState().sb` equals the target at 4 decimals. At each position the port's `__skreedState().cam` equals the prototype's at the hook's 4-decimal precision.
2. **Wipe.** Under reduced motion (port on `?tier=still3d`), with `Math.random` pinned to 0.5, scroll to 2.0 screens (tp 0.5) and to 2.5 screens (tp 1), then wait to settle and freeze. Canvas frames meet AC1's thresholds for the stage.
3. **DOM ride at tp 0.5.** The countdown's computed `transform` and `clip-path` strings equal the prototype's. The logotype's `data-tone` is `light` once tp is above 0.5. The cue has `is-off` once tp is above 0.
4. **Stopping.** With the filler present, scroll until the track has left the viewport. `__skreedFrame` stops increasing within 2 frames and `#stage` is hidden. Scroll back: it resumes.

**AC3. Loader behaviour and failure handling.** Ties to D3, E3, the H column and exception E-H1.
1. **Frame parity.** At `__skreedLoader.seek(t)` for t = 0.5, 1.64, 2.4, 3.2, 4.0, 4.96, 5.6, 6.2 and 7.05 s, the `.ld-w` element is pixel-identical to the prototype's at both viewports.
2. **Milestones.** They arrive in the order of the port's `loader-weights.json` keys: the 23 v9.9 names, first `import`, last `frame2`, every weight at least 0.01, sum 1. `aria-valuenow` never decreases. The fill never passes the share of milestones received (`state().tl`, mapped back to progress, is never above `state().p`).
3. **Slow states.**
   - With the sky texture delayed in the route, `ld.slow` appears after 4 s without progress.
   - With `pieces.json` delayed in the route, `ld.slow` appears (the pending key is `import`).
   - With the warm-up held at `c3` through `__skreedStall('c3')`, `ld.still` appears.
4. **Soft poster, then recovery.** Hold the warm-up at `c1` and wait past the 12 s stall. `html.poster` is set, the poster is visible, `#intro` has `.po` and shows nothing. Release the hold without scrolling: `frame2` arrives, `html.hero3d` returns, the loader lifts, `#intro` is removed, the poster is hidden, and the test counter `__skreedIntroDoneCalls` is 1.
5. **Soft poster, then scroll.** Same stall, with the filler present; scroll 9 px. Then release the hold: no lift happens, `__skreedIntroDoneCalls` stays 0, `__skreedDead` is true, `#intro` is gone and the island requests nothing more.
6. **Offline.** `context.setOffline(true)` before ready. The poster shows with only `#ldSt` of `#intro` visible, reading `ld.offline`. At 360 x 780, 390 x 844 and 1280 x 800, the bounding boxes of `#ldSt`, `#cue` (when shown) and `#count` do not intersect. When the island's next request fails, the hard path keeps that line.
7. **Import failure.** The hero chunk request is aborted. `html.poster` is set and `#intro` is gone before the loader's 4 s status timer would fire, so there is no 12 to 20 s hang.
8. **Failure during the exit.** When `__skreedLoader.state().phase` is `exit`, call `__skreedLoseContext()`. No lift happens, `__skreedIntroDoneCalls` is 0, `#intro` is removed, `html.poster` is set, no element has `inert`, and the logotype is focusable and glitches on focus. The same holds when the context is lost during `enter`.
9. **Failure mid-scroll.** Scroll to tp 0.5, then `__skreedLoseContext()`. After the hand-over: `#heroCopy` has no inline `transform`, `clip-path` or `visibility`; the logotype has no `data-tone`; `#labels` is empty; scroll is 0 (the position was inside the track's range); the cue shows the state the cue rule gives for the new page.
10. **Behind the loader.** While `html.loading` is set, every `body` child except `#intro`, the sprite, the poster, the canvas and scripts has `inert`; Tab cannot reach the logotype. After the lift, after a soft poster and after an abort, no element has `inert`.
11. **Deep links.** `scrollTo(0, 0)` runs only when `location.hash` is empty.

**AC4. Countdown.** Ties to A3, A4, B2, E3 and D1.
1. **Values.** With `page.clock` at the following instants the numerals read:

   | Instant | Reads |
   |---|---|
   | 2026-10-09T09:00:00+05:30 | 22 15 00 00 |
   | 2026-10-31T23:59:59+05:30 | 00 00 00 01 |
   | 2026-11-01T00:00:00+05:30 | see below |

   At zero: the eyebrow reads `cd.live`; `#count`'s computed `display` is `none` (D26); the `a[href="https://skreed.com"]` link has computed `pointer-events: auto`, `document.elementFromPoint` at its centre returns the link, its hit box is at least 44 px tall, and a click navigates (route intercepted in the test).
2. **Type.** Numerals are Open Sans 600 with `tabular-nums`, two digits, `min-width: 2ch`. They are hidden until the first tick, and ticks align to the wall-clock second.
3. **Semantics and no JavaScript.** `role="timer"` and `aria-label` `cd.aria`. With JavaScript disabled, `#cdEyebrow` and `#count` are not displayed, the cue is not displayed, and the noscript line shows `cd.noscript` with its `<time datetime="2026-11-01T00:00+05:30">`.
4. **Independence.** It runs with WebGL2 removed and with the hero chunk blocked.
5. **Reduced motion.** The seconds group is hidden.
6. **Contrast.** At the rest frame with the locked terrain, the eyebrow, the unit labels and the cue label measure at least 4.5:1 against the pixels behind them, and the numerals at least 3:1 (large text), at both viewports.
7. **v10 hooks.** `#count[data-hold]` stops digit writes and `__skreedCountV` carries the four strings.

**AC5. Scroll cue and corner logotype.** Ties to D4, B2 and E3, and exceptions E-12 and E-24.
1. **Cue animation.** The 9 px ball, 22 px drop and 1.5 s cycle with the prototype's keyframes and easings, and `animation-iteration-count: 2.44`. After 3.66 s the ball's computed transform is `none` and it has no running animation.
2. **Cue visibility.**
   - It hides at `scrollY` above 8 from the plain inline script, on the poster path as well as the 3D path.
   - It hides when the document is no taller than the viewport plus 8 px (nothing to scroll to).
   - It hides during the wipe and while loading.
   - It holds still under reduced motion.
3. **Logotype link and focus.** The link is `href="/"` with `aria-label` `logo.aria`. Its hit area is at least 44 px tall (112 x 45 at 96 px wide, measured). Focus shows the two-tone ring (D21): a 2 px Urban Slate ring and a 2 px Ember Luxe outline. Sampled from screenshots at `data-tone` dark (rest frame) and light (tp 1), at least one of the two rings measures at least 3:1 against the background next to it, and the two rings measure at least 3:1 against each other.
4. **Click.** A click on `/` scrolls to the top: smooth, or instant under reduced motion.
5. **Glitch triggers.** It bursts for 0.25 s on pointer enter (non-touch), touch pointerdown and `:focus-visible`. It runs the 0.5 s intro burst with Sky and Crimson 0.25 s after the cut. In the production build no burst runs in 20 s without input after the intro (no idle twitch).
6. **Glitch slabs.** It builds 48 slabs. Each burst uses one pair from section 3. The ghosts' fills reference `var(--shade-<id>)`, and their computed colours equal the shades' hexes by id.
7. **Glitch on the poster path.** On the poster tier, with no three.js loaded, the intro burst runs 0.75 s after the glitch script installs, and hover, tap and focus bursts work. After a soft or hard failure no extra burst runs. Under reduced motion no burst runs, and emulating reduced motion after load stops new bursts.

**AC6. Hover push, labels and parallax.** Ties to D4, A1 and A5.
1. **Push.** Run the prototype's hover routine (40 pointer moves, 120 ms apart, around 0.55 W and 0.32 H) on both pages. At least one block on each page has `d` above 0.1. `__skreedFloorCheck()` reports no block below the floor or the stones (maximum penetration at most 0).
2. **Labels.** Never more than 5. Each readout is two digits. Labels are hidden when tp is above 0 and when the pointer leaves the document.
3. **Ghost sweep.** It runs only with `(hover: none)`, never under reduced motion. With no input since load it starts when `live` reaches 1 (2 s after the lift); after an input it starts 2.5 s after that input.
4. **Block glows.** Each block's glow colour equals its 'cool' shade by id (`__skreedSolo` and the block colour table).
5. **Parallax.** For the same scripted input (mouse moves at desktop, a held touch on the phone), the series of `__skreedState().th` and `.ph` equals the prototype's at 4 decimals: the camera turns toward any active pointer anywhere in the viewport, and toward a touch point while the finger is down. Apart from the mark, the camera and the logotype, nothing on the page responds to the pointer.

**AC7. Reduced motion.** Ties to D2 and CLAUDE.md "Always do".
- With `prefers-reduced-motion: reduce` and default config, the network log shows no request for the hero chunk, three.js, the textures or the binaries.
- The page shows the poster, the countdown without seconds, a still cue (hidden when nothing follows), and no loader. The glitch never runs.
- With `?tier=still3d` (test build) the prototype's reduced-motion hero runs, and AC2.2 uses it.

**AC8. Poster and fallback paths.** Ties to C2, G9, D3 and the H column.
1. **Forced cases.** Each of these ends in `html.poster`:
   - `WebGL2RenderingContext` deleted in an init script;
   - `DecompressionStream` deleted in an init script;
   - `navigator.connection.saveData` true;
   - `effectiveType` 2g;
   - `deviceMemory` 2;
   - Chromium launched with `--disable-3d-apis` (the throwaway context is null);
   - the production build in headless Chromium, whose only WebGL is SwiftShader (the renderer string check);
   - the hero chunk aborted;
   - a context loss forced through `__skreedLoseContext()` (test build).
2. **What the poster path looks like.** The poster is visible and positioned in the first screen, the track is 100svh, and the countdown is not fixed. With the filler present, the poster and the countdown scroll away with the first screen and the cue shows until the page moves 8 px; without it the cue is hidden. The countdown and the logotype work. There is no horizontal scroll. The only console output is the expected warning.
3. **No island bytes on the tier cases.** The first seven cases request no island bytes (no hero chunk, no three.js, no texture, no binary, no `pieces.json`).
4. **Poster images.**
   - **Markup.** One `<picture>` with four `<source>` elements: the wide class AVIF and WebP with `media="(min-aspect-ratio: 9/10)"`, then the portrait class AVIF and WebP with `media="not all and (min-aspect-ratio: 9/10)"`. Each source has `srcset`, `type`, `width` and `height`. One `<img id="posterImg">` with `width`, `height`, `alt` `poster.alt`, `fetchpriority="high"` and `decoding="async"`. Two AVIF preloads use the same two media strings as the sources.
   - **One request.** Exactly one poster file is requested at 390 x 844 (portrait AVIF) and at 1280 x 800 (wide AVIF).
   - **Size.** Each file is at most 120 KB.
   - **Quality.** SSIM against the frozen rest render of the same build is at least 0.954 (phone, q60) and 0.953 (desktop, q50). These are the measured values.
5. **Hidden after the cut.** On the 3D path the poster is hidden once the loader lifts.
6. **Sky class upgrade.** Load at 390 x 844 (portrait crop), wait for `ready`, then resize to 844 x 390. Exactly one request for the wide crop follows, `__skreedSkyClass()` becomes `wide`, and no console error appears. Under `still3d` with the freeze set, the settled frame is identical (PSNR 99) to a fresh load at 844 x 390.

**AC9. Budgets.** Ties to C1 and C2. `scripts/budget.mjs` on the production build shows every line of section 6 within its budget:
- critical JS;
- island JS;
- the hero's total JS;
- the poster per class;
- fonts on `/`;
- first view for each of the four classes, in bytes, against 1,500,000 B;
- no `data:` URI or base64 payload in the HTML.

No request leaves the origin.

**AC10. Quality gates.** Ties to C4, B1, B2, B4, E1, E2, E3 and G10.
1. **Lighthouse** (D23). Lighthouse 13.5.0, mobile defaults (simulated throttling), Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` with `--headless=new --no-sandbox`, against the production build under `wrangler dev`, median of 3 runs. In that browser the page takes the poster tier (AC8.1). Graded: performance at least 90, LCP at most 2.5 s, TBT at most 200 ms, Speed Index at most 3.4 s, CLS at most 0.1. Recorded, not graded: the same run against the test build with `?tier=hero3d` and the SwiftShader flags. Both are pasted into the review. The 3D path's real-device trace on staging is the substitute gate under exception E-C4 and is recorded when A2 allows a staging deploy.
2. **Screenshots.** `docs/specs/screenshots/hero-390.png` and `hero-1280.png` exist (3D path at rest), plus `hero-390-poster.png`.
3. **Breakpoints.** At 360, 390, 430, 768, 1024 and 1280 there is no horizontal scroll and the gutters are at least 16 px.
4. **Structure and accessibility.** Exactly one `h1`, first in reading order. The canvas and the labels layer are `aria-hidden`. Visible focus. Nothing is animated in `dvh`.
5. **CSP.** The `Content-Security-Policy` header is present on `/` (asserted before counting violations), its line in `dist/_headers` is at most 1900 characters, and zero `securitypolicyviolation` events fire on the 3D path and on every poster path.
6. **Production grep guards.** `scripts/guards.mjs` finds none of:
   - Tune code, the `tier=` override or hook globals other than the prod contract;
   - `cdn.jsdelivr.net` or `fonts.googleapis.com`;
   - a base64 `data:` URI in `dist/_astro/*.js`;
   - banned font names, emoji or em dashes in shipped copy;
   - secrets patterns (`sk_`, `shpat_`, `service_role`).
7. **E1 and E2.** `/web-design-guidelines` and `visual-critique` are run if installed. If not, they are recorded as blocked on A9 with one line each, never marked PASS.

## 8. Out of scope

- The igloo intro (v10, `scratchpad/proto/template_v10.html`) and the section 2 rocks (`scratchpad/proto/template7.html`). The architecture leaves typed slots for both (`hero-architecture.md` section 11); nothing of either is ported.
- The Wall (section 3) and every later section. A named DOM slot after the track is left empty in production.
- Page-level essentials graded under CHECKLIST G before launch: 404, `/privacy`, `/terms` (rules 46 and 47, waiting on legal facts), the footer and its contact line, favicon set and manifest, OG image, robots.txt, sitemap, JSON-LD, the sticky mobile CTA, analytics. `Base.astro` carries the meta slots for them.
- The three.js r186 upgrade, as a separate task (D1).
- KTX2 or Basis textures: rejected on size (2 to 13 times larger than AVIF, transcoder about 234 KB br).
- A frame-time probe that drops to the poster after 3 s under 30 fps. The software-renderer check (D3) catches the 1 fps case; the probe is a follow-up with its own pixel and timing check.
- Rendering the island in a worker through OffscreenCanvas. It is the last lever for TBT if Sam declines E-C4 (D23).
- DPR changes after load (zoom, moving the window between monitors) and live changes of hover or of the scene's reduced-motion reading. The prototype reads these once; parity keeps that.
- The pause control of E-2.2.2. It is specified in section 10 and built only if Sam declines that exception.
- Deploying to skreed.in. That needs Sam's Cloudflare token and the nameserver move (A1, A2).

## 9. Decisions taken

Each decision says what changed from the prototype or the docs, and why. Every one that changes the design was decided by the plan rule "cheaper on a phone" unless noted.

| # | Decision | Reason |
|---|---|---|
| D1 | Pin `three@0.165.0` exactly. r186 waits for a separate upgrade task. | Parity: r186's UnrealBloomPass changed its blur kernels, its composite and its luma weights, giving roughly twice the glow at the core at strength 0.5. Size: r165 tree-shaken is 119.3 KB gz against 134.1 KB gz for r186 (measured). |
| D2 | Reduced motion gets the poster path by default. The prototype's frozen 3D stays in the code as `still3d`, behind one config flag, for Sam to choose. | CLAUDE.md asks for a reduced-motion fallback behind the poster. The poster is cheaper on a phone: about 1 MB of island bytes saved. |
| D3 | Tier gate in two places. The head Gate picks the poster on no WebGL2 constructor, Save-Data, 2g or slow-2g, `deviceMemory` 2 or less, no `DecompressionStream`, or reduced motion. `boot.ts` then creates a throwaway WebGL2 context with `failIfMajorPerformanceCaveat: true` and reads its unmasked renderer string, before any island byte; null or a software rasteriser goes to the poster. `hardwareConcurrency` is not used. | CLAUDE.md data-saver and no-WebGL fallbacks; `01-stack-and-hosting.md` asks for a real context check. Measured on 2026-10-09: headless Chromium 141 returns a context for `failIfMajorPerformanceCaveat` on SwiftShader, so only the renderer string catches software GL, which runs the hero at about 1 fps with tasks of about 1 s per frame. `--disable-3d-apis` keeps the constructor but returns no context. The context check stays out of the head script so it never delays first paint. |
| D4 | The 2048 ground is used only by WebP-only browsers. | `deviceMemory` reports powers of two, so the probe's "3 or less" rule equals "2 or less", which is already the poster tier. Elsewhere the 2048 ground is a visible softening (ground band SSIM 0.970). |
| D5 | The sky ships as two crops at native density (portrait 1298 x 1388, wide 3208 x 1388), with the dome narrowed to match. The class is picked at load by aspect below 0.9. A portrait load that later turns wide upgrades once to the wide crop (D28). | The camera never sees more than u 0.127 to 0.871 and v 0 to 0.651 of the sky. Any downscale loses stars (sky band SSIM 0.84 to 0.87 at 2048); the crop scores PSNR 47.8 and SSIM 0.993 in the same codec. |
| D6 | No GSAP, ScrollTrigger or Lenis in the hero. Reduced motion is read through one `motion.ts` and CSS media queries. `gsap.matchMedia()` arrives with the first section that uses GSAP, and `motion.ts` then wraps it so there is one source. | The hero uses none of GSAP. Loading it would add 42.9 KB gz. Lenis over the hero would add a third smoother on top of the two followers. |
| D7 | Two build stages. Stage 1 uses the prototype's asset files byte-identical, must give identical frames, and is a test build only, never deployed (its first view is about 2.6 MB). Stage 2 swaps in the encodes, the crops, the packed binaries and the posters under the shipping thresholds, and is the first deployable build. | Separates porting defects from encoding differences, so the parity test can be exact first. |
| D8 | Textures load through `ImageBitmapLoader` (`imageOrientation: 'flipY'`, `premultiplyAlpha: 'none'`), so decode runs off the main thread. Kept only if the stage 1 rest frames stay identical to the `TextureLoader` path; otherwise `TextureLoader` stays. | The asset reader asks for off-thread decode. The 3D reader warns that the flip differs and the ground UVs depend on it. The parity test decides, in build step 8. |
| D9 | Section 2's frame after the wipe stays the v9.9 one until the rocks land: the 240 swatches in catalog order on Pearl Whisper, without the placeholder copy. | Wipe parity needs the same target. The swatches are real product in catalog order (rule 24 allows exactly this). The placeholder text would fail F2. |
| D10 | The poster is rendered from the built page, canvas only, frozen at t = 0, with the locked values. Phone: 488 x 1056 AVIF q60 with WebP q80. Desktop: 1920 x 1200 AVIF q50 with WebP q70. One `<picture>` with four sources, split at aspect 0.9. Hidden after the cut on the 3D path. Stage 1 uses a provisional render of the prototype with the same settings. | The existing `shot-*.png` files carry the DOM overlays and the old terrain values. The sizes are the probe's measured candidates under 120 KB. One `<picture>` means one request; two `<img>` elements would both download. |
| D11 | `boot.ts` runs the context check first, then waits for the poster to decode, then starts the island. The poster's chosen source (`currentSrc` ends in `.avif`) doubles as the AVIF capability test for the textures. | Software-GL devices leave the loader for the poster at once instead of after a 1 to 1.5 s decode. Keeps the LCP bytes first. Saves a separate probe image. |
| D12 | At zero, "skreed.com" in `cd.live` is a real link to `https://skreed.com`, with `pointer-events: auto` (its parent `.copy` has none), Pearl Whisper with an underline, the two-tone focus ring and a hit area at least 44 px tall. The corner logotype's href is `/` instead of `#`, and its click handler intercepts only on `/`. | Shell reader: a working link without JavaScript, and the same component works on the legal pages. B2 tap targets. |
| D13 | A visually hidden h1 carries the catalog tagline in sentence case, as the first element of `body`. The prototype's only h1 was the placeholder. | E3 needs one h1, and it reads first. The tagline is a brand fact, and rule 35 keeps it as-is. The text needs Sam's yes. |
| D14 | Preload Open Sans 400 to 600 on `/`, not Poppins. | The hero shows no Poppins. The countdown, in Open Sans, is the text at first paint. type-system.md's "one preload, Poppins" assumed a headline the hero no longer has. |
| D15 | The loader's status line uses Pearl Whisper at full strength instead of the prototype's `--muted` (Pearl at 70 percent). The Tune greys `--panel` and `--line` go with the panel. | A2: no invented greys. |
| D16 | `scrollTo(0, 0)` on load only when there is no `location.hash`. While `html.loading` is set, every `body` child except `#intro`, the sprite, the poster, the canvas and scripts is `inert`. The countdown and cue script, moved to the end of `body`, applies it; the loader removes it at lift, on a soft poster and on abort. | Deep links such as `/#reserve` keep working. Focus cannot reach a covered link (E3). The loader script runs before the elements after it exist, so the last script in the body applies it. |
| D17 | The hero elements stay flat children of `body` in the prototype's sibling order. `<main>` wraps only the after-track slot, and is rendered only when that slot has content. The v10 countdown hooks (`#count[data-hold]`, `__skreedCountV`) are included now. | v10 styles `.intro.po~.site-logo`, `.intro.po~#heroCopy .eyebrow`, `.intro.po~#heroCopy #count` and `.intro.po~.cue .lbl`; wrapping any of these would break the merge. The hooks cost nothing when unused. |
| D18 | The Tune panel and every test hook except the prod contract exist only in the dev server and the test and staging builds. The production build contains no Tune code and no test hook, and a grep guard checks this. | The task brief: never in the prod bundle. Tune also breaks rules 11 and 39 and A2. |
| D19 | Failure model. Hard failures are terminal. The loader's stall and offline rules are soft and recover on `frame2` (the prototype's behaviour) unless the visitor has scrolled past 8 px, which makes them terminal. A texture that fails to load is a hard failure. The prototype rendered on without it. | The prototype recovers, and the port keeps that for the common slow load. Recovering after the visitor has started scrolling the poster page would change the page's length under them. A night scene with a missing sky or ground is not a designed state; the poster is. |
| D20 | WCAG 2.2.2 (pause, stop, hide). The cue runs 2.44 cycles (three bounces, 3.66 s) and rests on its line. The idle twitch is off in production (`logoIdle` 0). The intro burst and the hover, tap and focus bursts stay. The scene's ambient motion and the ticking countdown go to Sam as exception E-2.2.2, with a designed pause control if he declines. | Level A: anything that moves on its own for more than 5 s alongside content needs a way to stop it, and the OS setting is not on the page. The cue and the twitch could be brought under 5 s at no cost. The scene and the countdown cannot without a new control on the approved hero, which is Sam's call. |
| D21 | Focus ring: two-tone on the hero's focusable elements in both tones. A 2 px Urban Slate ring drawn by `::before` inside a 2 px Ember Luxe outline (the logotype keeps the prototype's 6 px outline offset; the link uses 2 px). No `box-shadow`. | Ember Luxe on Pearl Whisper is 2.0:1, which fails WCAG 1.4.11 once the logotype sits on Pearl after the wipe. Urban Slate on Pearl Whisper is 9.9:1; Ember Luxe passes on night; Urban Slate against Ember Luxe is 5.0:1. One rule works in every tone. |
| D22 | The four binaries are gzip-compressed at build (ground_h after a lossless row-and-column delta coding) and inflated with `DecompressionStream('gzip')`. | Cloudflare does not compress `application/octet-stream`: under wrangler 4.149 dev, `.js` came back as brotli and `.bin` uncompressed (318,634 B raw). Without packing, the WebP-only desktop class reaches 1,517,822 B, over 1.5 MB. With gzip only it is 1,478,433 B; with the delta coding it is 1,431,329 B. No CSP change is needed. |
| D23 | Lighthouse (C4). The graded run is the production build in headless Chromium, which takes the poster tier because its WebGL is software (D3): performance at least 90, LCP at most 2.5 s, TBT at most 200 ms, SI at most 3.4 s, CLS at most 0.1. The 3D path is recorded, not graded: a SwiftShader run of the test build, and a real-device trace on staging. Needs Sam's exception E-C4. If he declines, the levers in `hero-architecture.md` section 16 apply in their order. | Measured on the prototype under SwiftShader: long tasks of 348, 366, 1000, 117 and 111 ms and an unthrottled TBT of about 1.9 s; with Lighthouse's 4x CPU factor it is worse. At 1.9 s TBT scores about 0.05, which caps the score near 71 even with perfect FCP, LCP, CLS and SI. SwiftShader numbers are not phone numbers, and there is no GPU here to measure the real 3D path. |
| D24 | `html` and `body` background is `--night` on `/` (the prototype's body was Urban Slate, never visible on the 3D path). No `color-scheme` is declared on `/` (the prototype's `:root{color-scheme:dark}` is dropped). | Night is what the poster tier shows before the poster decodes, matching the poster's top. A page-wide dark scheme would style the later Pearl sections' scrollbars and form controls dark. The Wall spec decides the root background below the hero. |
| D25 | The glitch is a processed module script in `SiteLogo.astro`, independent of three.js and of the island, so it runs on every page and every tier. Module scripts run in document order, so it installs before `boot.ts`; the hero still queues its intro call if `__skreedLogo` is missing. On the poster tier it runs the prototype's no-loader intro (0.5 s after 0.75 s). After a soft or hard failure it runs no extra burst. | In the prototype the glitch lived inside the 3D module and vanished with it. Running it on the poster path is new behaviour, so it is a decision; the no-loader timing is the prototype's own. |
| D26 | `.count[hidden]{display:none}`. | The prototype's `box.hidden = true` at zero had no effect, because `.count{display:flex}` overrides the browser's `[hidden]` rule; it showed "00 00 00 00" under "Skreed is live." |
| D27 | The countdown and cue script moves to the end of `body`. The cue also hides when the document is no taller than the viewport plus 8 px. Without JavaScript the eyebrow, the numerals and the cue are not displayed, and the noscript line shows. | It is the last script, so it can apply `inert` (D16). A "Scroll" cue with nothing to scroll to is false. Without JavaScript the numeral boxes would stay empty. |
| D28 | Sky class upgrade: one way, portrait to wide, at most once per visit, only after `frame2`. The wide texture uploads first; texture and dome swap in one frame; the portrait dome stays meanwhile. | The wide crop covers every portrait view, so a downgrade is never needed. Loading both crops up front would cost every phone 179 KB to 354 KB more. |
| D29 | On the poster path the poster is positioned in the first 100svh and scrolls away with it, instead of staying fixed. | Later sections must not scroll over a fixed still of the hero. |
| D30 | All 240 shades are CSS tokens, `--shade-<id>`, generated into `src/styles/shades.gen.css` from `docs/data/shades-240.json` (7,855 B raw, 1,288 B br). The glitch ghost fills use them. | CLAUDE.md and A2: colours as CSS tokens on `:root`. |
| D31 | The loader's Pearl Whisper alpha stops stay the prototype's literal 8-digit hex values (`#F7F6F341` and the stops of `#ldFill` and `#ldBand`). | Writing them as `rgb(... / 0.26)` would round 65/255 to 66/255 and break AC3.1's pixel-identical frames. |

## 10. Approved exceptions the review must apply (to be written into CLAUDE.md and CHECKLIST by Sam)

Sam approved the v9.9 hero as built. Each item below is a property of that approved hero, or of this port, that a written rule still forbids. Until Sam writes them into `CLAUDE.md` and `docs/CHECKLIST.md`, the reviewer grades them as listed here, not as FAIL. Items marked "pending" are new and need Sam's yes. If Sam declines one, it becomes a FAIL item for the next build iteration. Anything not listed here is not excepted.

| Id | Rule or check | What the hero does | Approved in |
|---|---|---|---|
| E-H1 | CHECKLIST H1 "no full-page loaders", D1 "visible at rest", H table "first paint is HTML" | Full-screen wordmark loader with honest progress, on the 3D path only; the poster path never shows it. On a soft poster or offline, only the status line remains, over the poster. | v9.9 |
| E-G2 | CHECKLIST G2, primary CTA above the fold | No CTA on the fold; the reserve flow starts in later sections | v9.1, v9.2 ("not changed on purpose") |
| E-C3 | CHECKLIST C3 "no WebGL in a spine section" | The pinned hero canvas is the one WebGL island (CLAUDE.md amended 2026-10-07 and 2026-10-08); C3's wording predates that | CLAUDE.md |
| E-C3b | CHECKLIST C3 "animations use transform/opacity only" | The countdown ride sets `clip-path` per frame, and the glitch animates SVG clip rects and attributes. Both repaint without layout. | v9.2, v9 |
| E-12 | Rule 12 motion list ("the hero splitter") | The hero canvas, the loader, the cue's three bounces and the logotype's bursts move without being asked | v9.1 to v9.9 |
| E-13/42 | Rule 13 (no cursor-following glow), rule 42 (no glow blobs) | Blocks glow in their shade where the pointer pushes them; bloom at strength 0.5 on the canvas | v9 to v9.4 |
| E-1/21/40 | Rules 1, 21 and 40 (no purple-to-blue, no harsh gradients, no purple and black) | The sky's faint galaxy wash in Space #15284f, Eggplant #4a154d, Forest #084f3d and Wine #4b0923 over the night sky, masked to the dark sky above the horizon | v9.x, pending written yes |
| E-24 | Rule 24 (shades never colour UI chrome); brand guide "no outlines, shadows, effects" on the logo | The logotype glitch splits in shade pairs; the loader shows a hairline outline of the wordmark | v9, v9.9 |
| E-A2 | A2, palette only | `--night` #050506 as the loader background, the scene background and fog, and the `/` page background under the hero (never UI chrome on Pearl pages); Pearl Whisper at alpha for light falloff (loader rest `#F7F6F341` and its band and fill stops, outline stroke 0.42, cue line 0.6, label links 0.35) | v9.4, v9.9 |
| E-A2b | A2, palette only | The scene's light colours are render parameters, not palette colours: key light (1.0, 0.96, 0.90), kicker (0.80, 0.88, 1.0), environment floor (0.86, 0.90, 1.0), horizon (0.92, 0.93, 1.0) and sky (0.60, 0.45, 0.90) | v9 to v9.9, pending written yes |
| E-A3 | type-system `--fs-countdown` 32 to 48 px; role 10 "everything that ticks is 600"; eyebrow 12 to 13 px | Countdown numerals `clamp(2.3rem, 7vw, 4.8rem)`; loader percent Open Sans 400; eyebrow and labels 14 px 600; label readouts tracked 0.04em | v9.1, v9.2, v9.9 |
| E-GSAP | CLAUDE.md "honour reduced motion via `gsap.matchMedia()`" | The hero honours it through `matchMedia` and CSS, because it loads no GSAP (D6) | this spec, pending |
| E-C4 | CHECKLIST C4, Lighthouse mobile at least 90 "on the page" | The graded run is the poster tier, which is what Lighthouse's headless Chromium gets; the 3D path is recorded under SwiftShader and traced on a real phone on staging (D23) | this spec, pending |
| E-2.2.2 | E3 accessibility, WCAG 2.2.2 pause, stop, hide (Level A) | The scene's ambient motion (fog drift, bob, breath, shake) and the ticking countdown run without a page control to pause them; the OS reduced-motion setting turns both off (poster, no seconds) | this spec, pending |

**If Sam declines E-2.2.2**, the builder adds one control, specified here so it can be built without another plan round:
- A text button "Pause motion", becoming "Play motion" when pressed (`aria-pressed`), top right at `--inset` (plus the safe-area inset), Open Sans 600 at 0.875rem in Pearl Whisper, Urban Slate when `data-tone` is light, with a hit area at least 44 px tall and the two-tone focus ring.
- Pressed: scene time stops (fog, bob, breath, shake, shimmer and the ghost sweep hold), while hover push, labels and scroll still respond because they run on real frame time; the countdown holds its digits through `#count[data-hold]`; the cue stays still. Pressed again: everything resumes.
- It is a control, so its hover and press states follow the button rule in `DESIGN.md` (no opacity fade).

**If Sam declines E-C4**, the TBT levers of `hero-architecture.md` section 16 run in their order, each gated by AC1 and a weights re-measure, until the 3D path passes AC10.1 on a GPU machine.
