# Reference capture prompt for Claude in Chrome

Paste the block below into a claude.ai chat with the Chrome extension attached, replace the two placeholders, and send. It returns a "Reference brief" you copy verbatim into the Claude Code session. One URL per run.

---

You are capturing a website reference for a developer who cannot see this browser. The developer is building the Skreed pre-launch site (a phone-case brand, 240 shades, Astro + GSAP, no WebGL, phone first). Your output will be pasted to them as text, so everything you observe has to be written down; nothing you see is visible to them.

URL: {{PASTE URL}}
What I like about it and where on the page it is: {{ONE OR TWO SENTENCES}}

Do all of the following, in order, in this browser:

1. Open the URL. Wait until it is fully loaded. Note whether there was a preloader, what it looked like, and how long it stayed.
2. Scroll the whole page slowly, top to bottom, and write down every section in order: what is in it, how it is laid out, what moves, what triggers the movement (scroll, hover, click, drag, time, cursor position), and roughly how long each movement takes.
3. Go to the part I named. Interact with it every way you can: hover, click, drag, scroll over it, press arrow keys, resize the window. Describe exactly what changes, in what order, and how it eases (snaps, springs, glides). Describe its resting state and its end state.
4. Resize the window to about 390 px wide and repeat step 3. Say what is different on the narrow layout and what was dropped.
5. Open DevTools. From the Elements panel on the element I named: copy its HTML structure (tag names and classes, two or three levels) and the computed CSS that matters (transform, transition, animation, position, will-change, font-family, font-size, letter-spacing, line-height, colour values). From the Network panel: list the script bundles and any animation or 3D libraries you can identify (gsap, lenis, three, ogl, framer-motion, motion, locomotive, swiper, splide, lottie, rive, spline), the font files and their sizes, the total transferred size on first load, and whether there is a canvas or WebGL context on the page. From the Sources or Console: if you can see the code that drives the effect, quote the relevant 10 to 40 lines.
6. Read the fonts: every family used, where, and at what sizes; note any all-caps headlines, italics, or mixed faces in one line.
7. Read the colours: the page background, the text colour, the accent, and whether gradients, glows, blur or glass panels are used anywhere.
8. Inventory the assets. For the part I named first, then for the whole page: every image (format: jpg, png, webp, avif, svg; pixel dimensions; file size; whether it is a photograph, a product render, a 3D render, an illustration, an icon, a texture, a mask or a sprite sheet; whether it has a transparent background; whether several frames of the same object exist, which would mean an image-sequence animation), every video (format, dimensions, length, size, autoplay or not, muted or not, loop or not, whether it is used as a background or as content), every 3D or motion file (glb, gltf, usdz, obj, lottie json, rive, spline), every audio file (format, length, size, what triggers it), every font file (family, weight, format, size), and any SVG used for shapes, masks, logos or clipping. Say how each asset is loaded (in the HTML, lazy, on interaction, preloaded) and what it looks like, in words a person would need to brief a photographer, a 3D artist or an illustrator to make the same thing: subject, angle, lighting, background, colour treatment, crop, style. If the thing I liked is made mostly of assets rather than code, say so plainly.
9. Judge it in one paragraph: what makes the thing I like work, what is doing the heavy lifting (layout, timing, photography, code), and what would be lost if it were rebuilt without WebGL or without a cursor.

Then write the output below, exactly in this shape, so it can be pasted into another tool. Plain text, no emojis, no em dashes, no tables wider than the page. Be concrete; "nice animation" is useless, "the image scales from 1.0 to 1.08 over 600 ms with an ease-out while the caption slides up 24 px" is useful.

=== REFERENCE BRIEF ===
URL:
Captured on:
What Sam liked, in Sam's words:
Where it is on the page:

1. Page in one paragraph:
2. Sections, top to bottom (one line each: content, layout, motion, trigger):
3. The thing Sam liked, in detail:
   Resting state:
   Trigger:
   What happens, step by step, with timings and easing:
   End state:
   On a 390 px window:
4. How it is built:
   HTML structure:
   CSS that matters:
   Libraries detected:
   Canvas or WebGL: yes/no, and what it draws
   Code excerpt (if visible):
5. Fonts (family, role, size, case):
6. Colours and surfaces:
7. Weight: total first-load transfer, largest files, font files:
8. Assets used (one line per asset: type, format, dimensions, size, how loaded, what it shows; then a short production brief for each kind of asset we would need to make to reproduce the effect: photography, renders, 3D, video, audio, illustration):
9. What makes it work, and what would be lost without WebGL or a cursor:
10. One-line recommendation for the Skreed section it fits:
=== END BRIEF ===

Then stop. Do not summarise the brief; the brief is the deliverable.
