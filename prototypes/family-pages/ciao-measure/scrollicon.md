# Ciao's side scroll icon, measured (R1, 2026-10-14)

What the icon is: at the left and right edges of the first screen, three downward chevrons of five dots each, stacked, drawn in one after the other, held, wiped out top to bottom, dark, then again. 2.5 s per cycle. White dots, opaque at the apex, fainter outward. Both sides run in step.

Paths: `SC` = `/tmp/claude-0/-home-user-skreed-pre-launch/5a355426-a449-5fdb-a97b-268f46030370/scratchpad`. Data for machines: `SC/ciaofam/research/scrollicon.json`. Our re-creation: `SC/ciaofam/research/scrollicon-ours.html` (section 9). Frames and sheets: `SC/ciaofam/research/scrollicon/`.

## 1. Sources and method

- Markup: `SC/refsites/src/ciao/markup.html` lines 1771 to 1857 (left `.icon-scroll_wrapper`) and 1875 to 1958 (right), identical SVGs.
- Code: `SC/refsites/src/ciao/ui-gsap.js` `initScrollIcon` lines 447 to 498 (called at 1511 on DOMContentLoaded, before the loader finishes, so the cycle is already running when the hud is revealed); `initSectionGamme` lines 1141 to 1180 (the hide).
- Styles: `SC/refsites/src/ciao/webflow.css` `.icon-scroll_wrapper` 4738, `.code-embed` 4824, `.hud` family 4540 to 4631, `.scroll_discover` 5099, tokens 2187 to 2232. `inline-styles.css` has nothing on the icon.
- Live measurement: the local mirror `SC/refsites/ciao/www.ciaoenergy.com/index.patched.html` served by request interception (the trick from `SC/refsites/work/drive-ciao.mjs` and `mirror.mjs`, copied into `SC/ciaofam/research/scrollicon-capture.mjs`), Chromium with SwiftShader, 1280 x 800 at dpr 1 and 390 x 844 at dpr 2 with the iPhone UA. The page's clock (`performance.now`, `Date.now`, the rAF timestamp) is virtual and stepped 50 ms per frame; a hold switch freezes the page so a screenshot shows one instant, and `__stepOnce(ms)` advances exactly one frame. The icon's state is read from the DOM (the `transform` attribute GSAP writes on each `<g>` and its `style.opacity`); the GSAP timeline found by walking `gsap.globalTimeline` only served as a cross-check.
- Runs: `node scrollicon-capture.mjs desktop|phone|reduced|hide`, logs and raw JSON in `scrollicon/run-*.log`, `scrollicon/raw-*.json`. Contact sheets by `scrollicon-sheet.py`. Our demo checked by `scrollicon-ours-check.mjs` (`scrollicon/ours-check.json`).

## 2. SVG geometry (viewBox 0 0 35 146, three `<g>`, five `<path>` circles each, `fill="currentColor"`)

Dot radius 2.4 everywhere (path bbox 4.8 x 4.8, confirmed by `getBBox` in the page). Centres (cx, cy) and fill-opacity:

| chevron | outer left | mid left | apex | mid right | outer right |
|---|---|---|---|---|---|
| top (g 1) | (2.4, 2.4) 0.3 | (10, 9.1) 0.6 | (17.5, 15.7) 1 | (25, 9.1) 0.6 | (32.6, 2.4) 0.3 |
| middle (g 2) | (2.4, 66.4) 0.3 | (10, 73) 0.6 | (17.5, 79.7) 1 | (25, 73) 0.6 | (32.6, 66.4) 0.3 |
| bottom (g 3) | (2.4, 130.4) 0.3 | (10, 137) 0.6 | (17.5, 143.7) 1 | (25, 137) 0.6 | (32.6, 130.3) 0.3 |

- One chevron: outer dot centres 30.2 apart, apex 13.3 below them, arms at 41.3 degrees, bbox 35 x 18.1 with the dots. Opacity falls from the apex outward: 1, 0.6, 0.3.
- Pitch between chevrons 64 units (63.9 to 64.1 by their rounding). The viewBox height 146 = 2 x 64 + 18.
- Rendered at 0.5 px per unit (section 3): dot radius 1.2 px, chevron 17.5 x 9.05 px, outer centres 15.1 px apart, apex 6.65 px below them, chevron pitch 32 px, whole icon 17.5 x 73 px.
- Transform origin for the animation: the centre of each group's bbox (17.5, 9.05), (17.5, 73.05), (17.5, 137.05).

## 3. Rendered size and position

Ciao's root font is 14 px at both viewports (`html` computed `font-size: 14px`), so `1.25rem` = 17.5 px and `10rem` = 140 px. The wrapper: `width 1.25rem; position absolute; inset auto auto 10rem 50%; transform translate(-50%)` inside the hud's side column (`.hud_left-bottom` / `.hud_right-bottom`, `position: relative`, 7 px wide, the width of the 0.5rem corner marks). The hud is fixed, full viewport, `pointer-events: none`, padding top 8rem (7rem at max-width 479 px), bottom `clamp(2rem, 2vw, 3rem)` = 28 px, side padding 4 percent. The SVG (`width 100%`, `height 100%`, inline, baseline aligned) is 17.5 x 73 px and leaves a 4.75 px baseline gap under itself, so the wrapper box is 77.75 px tall.

Rule that reproduces the box at any size: centre x = 4 percent of the viewport width + 3.5 px from each edge; svg top = viewport height - 245.75 px (28 + 140 + 4.75 + 73); svg box 17.5 x 73 px.

| | 1280 x 800 | 390 x 844 |
|---|---|---|
| root font, hud padding top / bottom / side | 14 px, 112 / 28 / 51.19 px | 14 px, 98 / 28 / 15.59 px |
| left svg box (x, y, w, h) | 45.94, 554.25, 17.5, 73 | 10.34, 598.25, 17.5, 73 |
| right svg box | 1216.56, 554.25, 17.5, 73 | 362.16, 598.25, 17.5, 73 |
| centre x, left / right | 54.69 / 1225.31 | 19.09 / 370.91 |
| apex dots y (top, middle, bottom chevron) | 562.1, 594.1, 626.1 | 606.1, 638.1, 670.1 |
| outer dots x (left icon) and y | 47.14 and 62.24; 555.5, 587.5, 619.4 | 11.54 and 26.64; 599.5, 631.5, 663.4 |
| wrapper css | bottom 140 px, left 3.5 px, translate -8.75 px | same |

## 4. Colour

The icon is opaque white times its own fill-opacity: `.code-embed { color: var(--_primitives---colors--white) }` (#fff) wraps the SVG, so `currentColor` is #fff there, not the hud's `#ffffff80`. Measured on the fully drawn frame (`desktop-f05-t1.25.png`, peak over the local median backdrop): apex alpha 1.00, mid pair 0.60, outer pair 0.30, on both sides and all three chevrons. The hud letters and corner marks around it are `rgba(255,255,255,0.5)`.

## 5. The letters and the dash near it

The icon sits in ciao's hud frame: four 7 x 7 px L-shaped corner marks (0.5rem, 1 px stroke, white 50 percent) at the hud's corners (x 51.19 / 1221.81, y 112 / 765 at 1280; x 15.59 / 367.41, y 98 / 809 at 390), and Geist Mono 300 10.5 px letters (line box 15.75 px, white 50 percent) in the side columns, centred on the same x as the icon:

- Left column, top to bottom: "C" (line box y 403.9 at 1280, 420.3 at 390), "E" (464.4 / 478), "_" (508.2 / 521.75), then the icon (top 554.25 / 598.25), then the bottom-left corner mark.
- Right column: corner mark, "_" (163.8 / 147), a hidden "/" (`.hide`), then the icon, then "_" at line box y 698.1 at 1280 (744.25 at 390), i.e. the underscore glyph sits about 83 px under the icon's bottom edge, then the bottom-right corner mark.

So the "short dash under them" in Sam's photo is the right column's underscore, a hud letter, not part of the icon; on the left the underscore is above the icon. Geist Mono is banned for us (rule 19), so these letters are not for re-creation; if a dash is wanted under our cue it is a 6 px wide underscore glyph in Open Sans 400 at 10.5 px, white 50 percent, or nothing.

Also hidden with the icon: `.scroll_discover` "Scroller pour découvrir", Geist 300 12.25 px uppercase, white 60 percent, centred, line box y 760.6 at 1280 (804.6 at 390), and the carousel's pagination and previous arrow.

## 6. When it hides

`initSectionGamme`: one GSAP timeline, defaults 0.5 s `power2.inOut`, ScrollTrigger `trigger: .section.is-gamme, start: 'bottom bottom', toggleActions: 'play none none reverse'`, tweening `autoAlpha: 0` on `.carousel_pagination, .icon-scroll_wrapper (both), .carousel_arrow.is-prev, .scroll_discover, .gamme_gradient-wrapper` (desktop adds `.carousel_title-collection` autoAlpha 0 and `.carousel_nav` maxWidth 55 percent; mobile adds `.carousel_arrow.is-next` autoAlpha 0 and `.carousel_title-collection` y -2.5rem). ScrollTrigger reported start 200 px, end 1000 px at 1280 x 800 (the first section is 1000 px tall, so its bottom meets the viewport bottom at 200 px of scroll) and start 211, end 1055 at 390 x 844 (section 1055 px). Measured on the phone: at 181 px the icon is visible 1.00; at 241 px it reads 0.50 after 0.25 s (the midpoint of a 0.5 s power2.inOut) and `hidden / 0.00` after 1.5 s; back at 181 px it reverses to visible 1.00. On desktop ciao's wheel pager moves straight to the second section (1000 px), so a visitor sees the icon fade out during the page move; the `hide` run (section 8) records that.

## 7. The animation timeline (GSAP 3.15.0, live values match the source)

Setup: all three groups opacity 0, scale 0, origin 50 percent 50 percent; top chevron y +100, bottom chevron y -100 (SVG user units: 100 units = 50 px on screen, so the top chevron starts 50 px below its place, centred between the middle and bottom chevrons, and the bottom one starts 50 px above its place, between the top and middle ones). Timeline `repeat: -1, repeatDelay: 0.3`, duration 2.2 s, cycle 2.5 s.

| from | to | what | ease |
|---|---|---|---|
| 0.00 | 0.60 | top: opacity 1, scale 1, y 0 | power2.out |
| 0.20 | 0.80 | middle: opacity 1, scale 1 (in place), starts 0.4 s before the top ends | power2.out |
| 0.40 | 1.00 | bottom: opacity 1, scale 1, y 0, starts 0.4 s before the middle ends | power2.out |
| 1.00 | 1.30 | hold, all three drawn (the fade is placed `+=0.3`) | |
| 1.30 | 1.70 | top: opacity 0 | power2.in |
| 1.55 | 1.95 | middle: opacity 0 (stagger 0.25) | power2.in |
| 1.80 | 2.20 | bottom: opacity 0 | power2.in |
| 2.20 | 2.50 | repeat delay, dark; at 2.50 the start values return (invisible, no pop) | |

Eases: GSAP's power2 is cubic. `power2.out` = 1 - (1 - t)^3 (0.875 at the half-way point, checked on the live page and in a GSAP probe); `power2.in` = t^3 (0.125 at half). Scale, opacity and y share one tween, so they move together. In CSS these are exactly `cubic-bezier(0.333, 1, 0.667, 1)` and `cubic-bezier(0.333, 0, 0.667, 0)` (the Bezier reduces to the same cubic polynomial). `power2.inOut` (the hide) is two halves, t^3 scaled then its mirror.

The live record (70 ticks of 50 ms, `scrollicon.json` `liveRecord50ms`) matches this formula to within 0.0006 in opacity and scale and 0.06 units in y at every tick; the only exception is the tick that lands exactly on the repeat boundary, where GSAP renders the end state (opacity 0, scale 1) for one frame instead of the start state (opacity 0, scale 0), both invisible. Left and right wrappers share one clock and one setup pass: their states are identical in every frame.

### Frame by frame (12 frames, 0.25 s apart, `scrollicon/desktop-fNN-tT.png` and `phone-fNN-tT.png`, sheets `desktop-sheet.png` and `phone-sheet.png`)

| frame | t (s) | top chevron | middle chevron | bottom chevron | on screen |
|---|---|---|---|---|---|
| f00 | 0.00 | opacity 0 | 0 | 0 | nothing (the cycle boundary) |
| f01 | 0.25 | 0.80, scale 0.80, 9.9 px below its place | 0.23, scale 0.23 | 0 | the top chevron rises into view, still small, its apex at y 572 (1280); a faint speck where the middle will be |
| f02 | 0.50 | 0.995, in place | 0.875, scale 0.875 | 0.42, scale 0.42, 29 px above its place | top settled; middle nearly full; a small bottom chevron hanging just under the middle one (apex at y 597) |
| f03 | 0.75 | 1 | 0.999 | 0.93, 3.6 px above | all three readable; the bottom one still closing the last pixels |
| f04 | 1.00 | 1 | 1 | 1 | fully drawn (the bottom tween ends here) |
| f05 | 1.25 | 1 | 1 | 1 | hold |
| f06 | 1.50 | 0.875 (fading) | 1 | 1 | the top chevron starts to go; the fade is slow at first (cubic in) |
| f07 | 1.75 | 0 | 0.875 | 1 | top gone (at 1.70); middle going |
| f08 | 2.00 | 0 | 0 | 0.875 | only the bottom chevron, going |
| f09 | 2.25 | 0 | 0 | 0 | dark (bottom gone at 2.20) |
| f10 | 2.50 | 0 | 0 | 0 | dark; start values restored |
| f11 | 2.75 | 0.80, 9.9 px below | 0.23 | 0 | same as f01: the next cycle |

In words: the cue draws itself downward. The top chevron flies up into place while growing, the middle one pops in place, the bottom one drops into place while growing; the three stand for 0.3 s; they wipe out top to bottom with slow starts and quick ends; the column is dark for 0.3 s; repeat. Measured timings per frame are in `scrollicon.json` `frames`.

## 8. Reduced motion

Ciao does nothing special. There is no `prefers-reduced-motion` in `webflow.css`, `inline-styles.css`, `ui-gsap.js` or the 3D module, and no `gsap.matchMedia` call. Measured in the `reduced` run (Chromium with `prefers-reduced-motion: reduce`, `matchMedia` confirmed matching): the cycle runs exactly as without it, the three groups read 0.875 / 0.421 / 0 at one instant, 1 / 1 / 1 a second later and 0 / 0 / 0 a second after that (`scrollicon.json` `reducedMotion`). Our cue honours reduced motion (section 9).

## 9. Our re-creation: `scrollicon-ours.html`

Self-contained page, no GSAP, no ciao file: our own `<svg viewBox="0 0 35 146">` of fifteen `<circle>` elements at the centres and opacities of section 2, two copies fixed at the sides, CSS keyframes only. One 2.5 s cycle per chevron with the percentages of section 7 (24, 8 / 32, 16 / 40, 52 / 68, 62 / 78, 72 / 88 percent) and the exact cubic Bezier eases, `transform-box: fill-box; transform-origin: 50% 50%`, `translateY(100px)` and `(-100px)` in user units. Colour #fff with fill-opacity 1 / 0.6 / 0.3. Placement `left: calc(4% + 3.5px)` and `right: calc(4% + 3.5px)` with `translateX(-50%)`, `bottom: 172.75px`, width 17.5 px (section 3). Hide rule: the first section's bottom meeting the viewport bottom adds `is-hidden`, which runs a 0.5 s two-half cubic in-out fade to `visibility: hidden`, and removing it runs the same curve back.

Checked by `scrollicon-ours-check.mjs`: at 61 instants (0 to 3 s, 0.05 s steps) opacity, scale and y of all three chevrons equal the GSAP formula with error 0.000 at both viewports; the svg boxes land at (45.94, 554.25) and (1216.56, 554.25) at 1280 x 800 and (10.34, 598.25) and (362.16, 598.25) at 390 x 844, the same hundredths as ciao's; the hide fires at 200 px (opacity 0.50 after 0.25 s, hidden after 0.5 s) and returns; under reduced motion the three chevrons stand still, fully drawn, with no animations.

Differences from ciao, and why:

1. Reduced motion: ours shows the icon static; ciao keeps animating. Deliberate (our rules).
2. At the exact cycle boundary GSAP shows the previous iteration's end state for one frame (opacity 0, scale 1) and ours the start state (opacity 0, scale 0). Both invisible; not removable without GSAP's repeat semantics and not worth it.
3. The hide is a scroll listener plus a class, not ScrollTrigger; the curve and timing are the same. In a GSAP page it should be a ScrollTrigger with the same start and toggleActions.
4. The hud letters, corner marks and "Scroller pour découvrir" are not re-created: they are not part of the icon and use Geist Mono and Geist.
5. Ours makes the svg `display: block` (no 4.75 px baseline gap) and compensates in `bottom`, so the box is identical and nothing else changes.
6. Ciao's bottom-left outer dot sits at cy 130.4 by its path data while the right one is at 130.3 (a path rounding, 0.05 px on screen); ours uses 130.3 for both.

Note for the build: our pages must set the cue's font-size independent of ciao's 14 px root; the numbers above are absolute px.
