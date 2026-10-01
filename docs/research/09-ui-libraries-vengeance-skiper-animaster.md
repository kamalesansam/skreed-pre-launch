# UI libraries from post 95: Vengeance UI, Skiper UI, Animaster Lib

Catalogued 2026-10-01 via Composio's remote browser (the sandbox proxy blocks the sites). Judged against the Skreed stack (Astro static + GSAP, React only in islands) and the 50 rules in `CLAUDE.md`.

## Verdict in one table

| Library | What it is | Price | Fits our stack? | Use for Skreed |
|---|---|---|---|---|
| **Vengeance UI** (vengeanceui.com) | Animated React components + page blocks, Vercel OSS Program, ~1.2k GitHub stars | Open source, free, no watermark | Partly. Next.js + Tailwind + Framer Motion, install via `npx vengeance-ui add <component>` or copy-paste. Works only inside a React island. | Reference for two things: **Model Viewer** (rotating 3D object; the upgrade-path hero) and **Perspective Carousel** (3D depth slider; a candidate for the family picker on laptop). Everything else is either banned by our rules or already covered by GSAP. |
| **Skiper UI** (skiper-ui.com) | 106+ "un-common" shadcn components; 24+ free, 54+ premium | Free tier; Premium $129 one-time, unlimited projects, licence key in `.env.local`; Exclusive $549 adds Figma + templates | Partly. React + Tailwind + shadcn CLI (`npx shadcn add @skiper-ui/<name>`) + Framer Motion. Island-only. | Three **free** components earn a place: **Card swipe carousel** (touch-first; the quiz's swipe cards), **Animated number** (the per-shade reservation counters), **Oliver parallax** (pointer parallax for the tilt card on desktop). **Scroll images reveal 001** (free) is a reference for the finish-tilt. Premium is not needed. |
| **Animaster Lib** (animmasterlib.dev) | 300 components: Scroll (71), Sliders (25), WebGL (19), Text (18), Mouse (21), Page transitions (14), SVG (11), Nav (21), Physics (10) | Junior $3, PRO $4.99 (sale), Premium $8 (sale, lifetime updates). One-time. | **Best fit of the three.** 60% plain HTML/CSS/JS, 30% React, 10% Next; copy-paste or ZIP. Plain-JS components drop straight into Astro with no island. GSAP and Three.js/shader based. | Buy Premium ($8). Harvest patterns, not files: the **scroll-pinned horizontal strip** and **image-sequence scroll** (both in Scroll Animations) for the Wall ribbon and the finish reveal; **3D tilting cards** (Mouse Effects) for the tilt card; **split-text reveals** (Text Animations) for the manifesto. Licence terms are not stated on the site; confirm commercial use with the author before shipping any copied code, otherwise treat as reference only. |

## What the rulebook rules out, by name

These exist in the catalogues and must not be used, whatever the library:
- Vengeance: Radial Glow Button, Liquid Metal, Gooey Text Reveal, Image Trail, Pixelated Image Trail, ASCII Glitch Ripple, Creepy Button, Candy Button (rules 13, 22, 28, 42, 44, 48).
- Skiper: Gooey Effect, Dynamic island, Tik tik color list (a colour list that ticks; our Wall is a grid, not a ticker) (rules 11, 48).
- Animaster: WebGL Shaders category in any spine section (rule: no WebGL in the spine), fluid cursor-following shapes (rule 13), background animations (rules 42, 43).

## Mapping to the spine

| Section | Pattern needed | Source to study |
|---|---|---|
| 1. Basic vs Beyond Basic splitter | Before/after drag slider | None of the three has a true before/after. Build with `clip-path` + pointer events (half a day). Skiper's "Image reveal" is the nearest reference. |
| 2. The Wall | 240-tile grid, tap enlarge, family tabs, horizontal ribbon | Animaster scroll-pinned horizontal strip (ribbon on laptop); Vengeance Image Collage (grid hover layouts) as reference. Grid itself is DOM + CSS vars + GSAP Flip. |
| 3. Find your shade | Swipe cards for the quiz | **Skiper Card swipe carousel (free)**, in the quiz island. |
| 3. Shade card tilt | Pointer/gyro parallax, finish toggle | Skiper Oliver parallax (free) for desktop pointer; Animaster 3D tilting card for the maths; gyro from DeviceOrientation ourselves. |
| 4. Reserve counters | Counting numbers | **Skiper Animated number (free)** or GSAP's own tween on textContent. |
| 7. Manifesto | Kinetic split text | GSAP SplitText (already in stack); Animaster Text Animations and Vengeance Stagger Text as references. |
| Upgrade path | 3D case | Vengeance Model Viewer as the embed pattern; img2threejs for the mesh. |

## Bottom line

None of the three replaces the stack. Animaster is worth the $8 for patterns because it ships plain JS; Skiper's free tier gives three island components that save a day; Vengeance is reference only. Everything copied gets restyled to the tokens (rule 11) and passes the review loop like any other code.
