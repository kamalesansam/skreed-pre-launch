# Section 5, Sam's picture: the sign-up rebuilt (spec)

Slug `section-5-picture`. Written 2026-11-02 for the rebuild of that day, on branch `claude/section-5-signup-glass-jar-9d74d2` at 78eae8f (one jar of sand, a checkpoint that was never reviewed) with the exit guard G4 in the working tree (`src/scripts/hero/section4/exit-guard.ts`, its wiring in `director.ts`, `tests/unit/exit-guard.test.ts`, `tests/unit/room.test.ts`, `tests/e2e/room.spec.ts`), which stays. Status: the build's spec. The decisions D1 to D10 (section 2) and the contracts C1 to C6 (section 4) were fixed before the build and are not reopened here. Four builders work at once, each on its own files (the page; the hero island; the jar renders; these records). There is no review step: Sam reviews the result himself, by eye, on the dev server at http://127.0.0.1:4321 ("i'll do the review part"), and a measuring step follows the builders and fills section 16. An abandoned liquid version sits in the git ref `refs/wip/section-5-liquid-2026-11-02` and is no part of this spec.

This spec supersedes `docs/specs/section-5.md` (2026-10-26) and `docs/specs/section-5-sand.md` (2026-10-29) wherever they describe what section 5 shows or how it is drawn; section 12 lists what still holds from them. Every measured number in section 3 is read from Sam's picture of 2026-11-02 (1019 x 1543 px), measured that day for its layout, colours, jars and pellets, and line by line for its type. The picture is his upload and stays out of the repository, as do the measurements' working files. His first picture, of 2026-10-26, is `docs/specs/screenshots/section-5-reference.webp`.

**Sam's words, verbatim (2026-11-02).**
1. "If someone clicks on the Facebook symbol, it should take them to our Facebook page. If they follow it, the fourth jar should fill up 25% with blue (which is same as Jar 1). After that if they click on the YouTube symbol, it should take them to our YouTube page. If they subscribe to it, the fourth jar should fill up 25% with red (on top of the 25% blue). just make this exact same page with the same logic, same font, same space, same backround, same everything from that picture, just relayout it for phone as well, use the exact same font for each and every line from that picture"
2. "Background, font, placement - everything should be like this. The pink-purple of Instagram is a mix of the two colours, not pink then purple. It's one mixed lot."
3. "the sand should look exactly the same as the picture"
4. Asked whether to keep the picture's exact spacing, taller than one screen, or to fit one screen, he chose "Fit one screen" (the option as put to him: the picture's placement, fonts, background, jars, icons and copy, with tighter spacing and a smaller headline and jars, so that everything fits one screen on the laptop and on most phones).
5. "i'll do the review part ... i'll review it on the localhost port on the browser visually and tell u if i like it or not, so cut down the time to only building"

**His picture, in words.** A warm cream page. At the top left, in large light capitals on two lines, "YOU’VE MADE IT" / "THIS FAR."; under it, indented a little, two lines of grey text with a bold run: "All that’s left to do is **save up to 20% off your first order.** Click each icon below to visit and follow our page. Collect a colour with every follow, and unlock bigger discounts." From there everything is centred. "EVERY FOLLOW FILLS THE JAR" in a geometric face; four identical clear glass jars standing level on a glossy floor, each casting a soft shadow to its right: the first a quarter full of blue plastic pellets, the second a quarter of red, the third about half of pink over purple, the fourth empty. Under each jar a mark and a worth: the Facebook mark and "5% OFF", the YouTube mark and "5% OFF", the Instagram mark and "10% OFF", an orange star and "UP TO" / "20% OFF". Then "GOT YOUR COLOURS?" between two hairlines that fade outwards, two grey lines ("Drop your email below. We’ll verify your follows and send your colour codes straight to your inbox when we launch."), a pill-shaped email field ("Your email address") joined to a black pill button, "SAVE MY DISCOUNTS", and a pale footer, "Pssst...keep following to keep your savings!" Behind the jars the backdrop darkens softly towards the right, as in a studio photograph.

**What this changes.** Everything section 5 shows. Section 2's fog under it becomes a flat ground of the picture's colour; the one jar of sand the island drew becomes four jars as pre-rendered images in the page; the three follow words become the platforms' marks over their worth; IBM Plex Mono capitals with the decode become the picture's type; the stand-ins for the picture's discount words ("first dibs", "Save my colours") become his words; the credit line, the consent box, the count line and the state lines go (section 10).

**What stays.** The fourth wipe from scene 5 (the composite's cut, now onto the flat ground), the exit seam from the section's end with G4, the wrap from the top onto the section's rest, the glue's fourth span, the lock with section 4 behind the quiz, the honour system for a follow, the ladder of worth (a quarter, a quarter, a half; three follows fill the jar), the follows' storage key, the form's logic and its endpoint, and the section's shared hooks (D9).

## 1. Goal

Sam's picture, built and fitted to one screen: after the fifth scene one page asks for a follow on each platform and for an email, and the visitor's jar (jar 4) fills as they follow. Brand goals served (Prem's order, `docs/00-IDEATION.md`): 4 (people follow @skreedofficial) and 3 (people share their details). Goal 1 (the shades are the product) is no longer served here: the pellets wear the picture's colours, not the catalog's (E-S5-picture, section 13; section 14, item 13).

## 2. The decisions (D1 to D10)

Fixed before the build; every builder follows them.

**D1 Copy**, verbatim from the picture, top to bottom. A curly apostrophe (U+2019) everywhere; the footer's three full stops, not an ellipsis character (U+2026).

| # | Text | Where |
|---|---|---|
| 1 | YOU’VE MADE IT | the headline, its first line |
| 2 | THIS FAR. | the headline, its second line |
| 3 | All that’s left to do is **save up to 20% off your first order.** Click each icon below to visit and follow our page. Collect a colour with every follow, and unlock bigger discounts. | the sub-line; the bold run is "save up to 20% off your first order." with its full stop |
| 4 | EVERY FOLLOW FILLS THE JAR | over the jars |
| 5 | 5% OFF | under jar 1's mark (Facebook) |
| 6 | 5% OFF | under jar 2's mark (YouTube) |
| 7 | 10% OFF | under jar 3's mark (Instagram) |
| 8 | UP TO / 20% OFF | under jar 4's star, on two lines, broken after "UP TO" |
| 9 | GOT YOUR COLOURS? | the form's heading, between two hairlines |
| 10 | Drop your email below. We’ll verify your follows and send your colour codes straight to your inbox when we launch. | the grey lines |
| 11 | Your email address | the field's placeholder |
| 12 | SAVE MY DISCOUNTS | the button |
| 13 | Pssst...keep following to keep your savings! | the footer |

Nothing else shows: no credit line, no consent box, no counts, no follow words. The form's state messages (D8) appear in their states only, in the one message line; the live region (D6) is visually hidden. The discount words ship because Sam asked for the exact page (E-S5-picture; section 14, item 1).

**D2 Placement and fit.** The picture's arrangement. The headline and the sub-line are left-aligned to the content column, the sub-line indented from the headline's left edge as in the picture (26 of its 1019 px, 0.0255 of its width, kept in proportion); everything from "EVERY FOLLOW FILLS THE JAR" down is centred. The whole section fits one screen ("Fit one screen"): at every size of the fit targets below each element sits inside the visible viewport, below the site's own top chrome that the section already clears (that clearance kept), nothing overlaps, nothing overflows sideways, and the footer is visible without scrolling, with the form on (dev) and off (production).
- *Laptop.* The picture's proportions between the elements hold as far as the height allows. The vertical gaps tighten first (the picture's big gaps, in its px: 125 above the headline, 98 from the sub-line to the label, 96 from the label to the jars, 123 from the labels to the heading, 69 from the grey lines to the form, 71 from the form to the footer, 58 below); then the headline and the jars shrink. The body lines (the sub-line, the grey lines, the footer, the placeholder, the button) never go below 15 px, the worth labels never below 13 px.
- *Laptop, landscape* (since the evening of 2026-11-02; Sam, of the laptop as first built: "For the desktop, everything is compressed to the center. Make sure it's layouted, it's relayouted to fit properly across the entire screen, not just in the center like a mobile screen. There's a lot of free space."). On screens 900 px wide or more whose width is at least their height, two columns across the whole width between the insets: the headline and the sub-line on the left, two fifths of the frame, centred on the band beside them; "EVERY FOLLOW FILLS THE JAR" over the four jars with their marks and labels on the right, 56 percent of the frame, the axes 220 picture px apart, the falloff behind that band alone, rising out of the ground at the column's left edge and reaching the screen's right edge; then "GOT YOUR COLOURS?", the grey lines, the form and the footer centred under both, in the picture's order. The picture's unit comes from the jar column's width and from the height, never over 1.15 px per picture px, so the jars grow with the screen instead of shrinking to one column's height; the headline's size is the picture's or the text column's width for its first line, whichever is smaller, and the sub-line's indent is 0.0255 of the text column. The single column above, the picture's own arrangement, stays for phones and for portrait tablets.
- *Phone* (under 720 px wide). The same order in one column with 16 px side insets: the headline in its two lines as large as fits, the sub-line wrapping as it needs, the four jars still in one row (each jar's outer diameter about 0.18 of the column), their marks and labels under them, shorter hairlines, the field and the button still one joined pill. Body lines never below 13 px, labels never below 11 px.
- *How.* One spacing scale (tokens), flex or grid with `gap`, every size from `clamp()` with viewport units (`svh` for height), so the fit holds without JavaScript.

**D3 Type.** Sam: "use the exact same font for each and every line from that picture". The picture's originals are paid fonts (section 3, "Type"), so the closest free matches ship: two variable Google Fonts files, downloaded from fonts.gstatic.com, under the SIL Open Font License, shipped unchanged and used by section 5 only.
- Inter (wght 100 to 900, opsz 14 to 32, latin): `public/fonts/inter-opsz-wght-latin.woff2`, 72,920 bytes, sha256 `2c295d99e26dcf357d4d01bcf270fd6924b600c9a13dd8c363ef114f4c6976fa`, from `https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900`.
- Jost (wght 100 to 900, latin): `public/fonts/jost-wght-latin.woff2`, 26,576 bytes, sha256 `7726a5cd6f3c0e876c028ea2a643d45f7aad4b0f164b70966c669f4a4668f4b9`, from `https://fonts.googleapis.com/css2?family=Jost:wght@100..900`.

Each has its `@font-face` rule in `src/styles/fonts.css`: `font-display: swap`, the weight range 100 900 and the latin `unicode-range` of the Google stylesheet beside the download (U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD). `font-optical-sizing: auto`, so Inter's large lines render as Inter Display, as measured. Per line (letter-spacing in em; the size in the picture's px, for proportions, with its share of the picture's width W):

| Line | Face | Letter-spacing | Line-height | Size (picture px; share of W) | Colour |
|---|---|---|---|---|---|
| Headline | Inter 300 | -0.021 | 0.82 | 107.9; 0.106 | #000000 |
| Sub-line | Inter 400 | -0.010 | 1.44 | 21.2; 0.021 | #5A544D |
| Its bold run | Inter 700 | +0.010 | the sub-line's | the sub-line's | #3F3935 |
| EVERY FOLLOW FILLS THE JAR | Jost 400 | -0.046 | | 31.4; 0.031 | #27211F |
| Worth labels (one size for all four) | Inter 300 | +0.004 | 0.96 | 26.9; 0.026 | #49443F |
| GOT YOUR COLOURS? | Inter 300 | -0.003 | | 48.3; 0.047 | #000000 |
| Grey lines | Inter 400 | -0.035 | as tight as the picture's but never so tight that descenders touch the next line, about 1.15 | 21.4; 0.021 | #77706A |
| Placeholder | Jost 400 | -0.019 | | 20.1; 0.020 | #AFA9A5 |
| Typed text | Jost 400 | -0.019 | | 20.1; 0.020 | #27211F |
| Button | Jost 400 | -0.011 | | 19.3; 0.019 | #FFFFFF on #000000 |
| Footer | Jost 400 | -0.006 | | 20.9; 0.021 | #AEA8A3 |

The hairlines are #5C5650 at the end nearest the heading, fading to the ground along their length.

**D4 Ground.** Flat #F2EAE1, the picture's top band (its bottom third is 0.7 L* lighter, too little to draw): one constant, `SIGNUP_GROUND` in `src/config/signup-ground.ts` (C1), and the page's CSS custom property `--su-ground` with the same value. Over it, the picture's soft photographic falloff behind the jar row: from about the label to just below the jars, darkening towards the right, to #E7E0D5 at the right margin at the jars' mid-height and #EFE8DF at the left margin; drawn by the page, behind the jar row only, soft, with no visible edge, never behind text.

**D5 Jars.** Four identical glass jars pre-rendered as images by the renders builder (C2), in the picture's look: clear glass, satin plastic pellets, a soft shadow to the right, a faint glossy floor reflection ("the sand should look exactly the same as the picture"). Jar 1 holds a quarter of blue, jar 2 a quarter of red, jar 3 a half of the pink and purple mixed as one lot ("It's one mixed lot."), and jar 4, the visitor's, is empty at first. The frames are wider than the jars: the row is laid out by the jar's box from `jars.json`, and the transparent frames overlap their neighbours.

**D6 Fill logic** (Sam's words, item 1). The Facebook, YouTube and Instagram columns (the jar, the mark and the worth label together) are each one link: `<a href="https://www.facebook.com/skreedofficial" target="_blank" rel="noopener">`, YouTube `https://www.youtube.com/@skreedofficial`, Instagram `https://www.instagram.com/skreedofficial`, each with an accessible name such as "Follow Skreed on Facebook, 5% off (opens in a new tab)". The star's column is not a link.
- *The follow.* A press counts as the follow (the honour system: no site can check a follow; `docs/00-IDEATION.md` decision 11), remembered for the visit in `sessionStorage` under the existing `SIGNUP_KEYS.follows` key (`skreed:signup-follows`) as the ordered list of ids. A platform already pressed opens its page again and adds nothing.
- *The layers.* Jar 4 gains the platform's layer on top, in press order: Facebook a quarter of blue, YouTube a quarter of red, Instagram a half of the mixed lot. Three follows fill it.
- *When.* The fill plays where the visitor can see it: if the page is still visible 500 ms after the press, it plays then; otherwise 300 ms after the page is visible again.
- *How.* The next state's image is laid over the current one and revealed upward with `clip-path: inset(<top>% 0 0 0)`, from the current state's surface to the new state's top (`jars.json`), over 900 ms for a quarter and 1400 ms for a half, ease-out. The start is the current state's `seam` where the renders give one (2026-11-02, the measure's item 10): the row below which every later state is pixel-identical to it, with the band from the seam up to its top holding the new grains that lie over its surface, so a reveal that starts at the seam never jumps, where one that started at the top showed that band at once. Presses during a fill queue. Under `prefers-reduced-motion` the new state shows at once. On load the remembered state shows at once.
- *Around it.* The possible next states' images are preloaded once the section is near. The page dispatches C4's events. A polite live region says what was added (for example "Blue added to your jar."). Nothing moves at rest.

**D7 Marks.** Inline SVG of our own drawing, never downloaded files, matching the picture (section 3, "Marks"): Facebook's 2023 mark (a #0866FF disc, a white f whose stem runs off the bottom); YouTube's (a #FF0000 rounded rectangle, a white play triangle); Instagram's (a rounded square with the app icon's radial gradient from yellow #F9CF7C at the bottom left through orange #F58947, red-pink #E62B58 and magenta #C53098 to purple #9649B6 and blue-violet #5F5ECB at the top left, and a white outline camera: a rounded square, a ring, a dot); the star (an #FA841A disc with a five-point star cut out in the ground's colour). Equal heights (Facebook, Instagram and the star square, YouTube wider), each centred on its jar's axis (the picture's drift of up to 15 px to the right is an accident of the picture), the labels centred under them. Hover on a link column: the mark scales to 1.06 on the site's standard easing (`--ease-standard`, cubic-bezier(0.2, 0, 0, 1)), with no change of opacity. `:focus-visible`: the site's focus ring around the whole column.

**D8 Form**, behind `PUBLIC_LEADS` as before (on in dev, test and staging builds; off in production). The existing form logic, states and messages are kept (empty, invalid, sending, success, error, the offline queue; `POST /api/signup`, which has no Worker yet), restyled as the picture: a full pill field (outline 1.4 px #A49B99, no fill, its radius half its height) with the black pill button overlapping its right end, flush top and bottom, the button 45.6 percent of the joined width, the field's own right end hidden under it. One message line under the form for the states, its space reserved so that nothing moves. No consent box. With `PUBLIC_LEADS` off: no heading, no grey lines, no form; the footer stays.

**D9 Out of the section, and kept.** Out: the island's WebGL jar, the sand, the pour, the dust, the tilt, the third party's jar model and its credit line, the decode and IBM Plex Mono on these lines, the follow words, the counts, the poster stills (section 10). Kept as they are: `section#signup` and its id; the quiz gate's `hidden` and `data-locked` handling; `.su-body` as the one-screen content block (the island reads its rect for the exit and the wrap); `.su-loopend` (the run after the section for the exit seam) and `.su-fade`, with their CSS; the `skreed:room-state` wrap announcement; the `skreed:signup` event.

**D10 Island.** The WebGL jar leaves the island. The fourth wipe from scene 5 cuts onto a flat `SIGNUP_GROUND` in exact sRGB (no tone mapping, fog, grain or dither on it), and the island holds that flat ground under section 5 while the section is in view (drawn, then held: no per-frame work at rest), setting `data-ground="island"` on `section#signup` while it does. The exit seam from section 5's end (the cloud, then the hero at scroll 0) and the wrap from the top (landing at section 5's rest) keep working, with G4 as built.

## 3. The measured picture

**The picture.** 1019 x 1543 px, WebP with an embedded profile on sRGB primaries. Every px value below is the picture's own; W is its width. It was decoded with the repository's sharp and analysed pixel by pixel; colours were mapped to `docs/data/shades-240.json` by CIEDE2000, and each line's type was matched against 34 free families by the overlap of ink at the measured cap height and stem weight. The picture reads as a generated image (a round full stop in a Helvetica-style face, "UP TO" drawn 4 percent smaller than its neighbours, the marks drifting right of the jars), so its accidents are not copied (D3, one size for the labels; D7, the marks on the jars' axes).

**Layout.** The top block is left-aligned: the headline's left edge at x 57 to 58 (0.056 W), the sub-line's at x 83 (0.081 W), 26 px in. Everything from "EVERY FOLLOW FILLS THE JAR" down is centred within 2 px of the picture's centre (x 509.5): the label at 510.5, the jar row at 511.6, the heading at 509.5, the grey lines at 509, the form at 509.7, the footer at 508. The row of marks and labels alone sits right of it (its mean x 521).

| Element | Box, picture px (x0,y0 to x1,y1) | Notes |
|---|---|---|
| Headline, line 1 | 57,125 to 806,206 (750 x 82) | cap height 78.5 by the type measure; letter gaps 1 to 7 px |
| Headline, line 2 | 58,214 to 491,295 (434 x 82) | cap-top pitch 89, 1.13 of the cap height |
| Sub-line, line 1 | 83,326 to 867,346 | the bold run at x 289 to 654; baseline 342 |
| Sub-line, line 2 | 83,356 to 922,376 | baseline 372.5; pitch 30.5 |
| EVERY FOLLOW FILLS THE JAR | 318,475 to 703,498 | cap height 22 |
| Jars 1 to 4 | x 69.4 to 220.6, 310.4 to 460.4, 556.2 to 707.4, 801.6 to 953.7; y 595.5 (the rim's far edge) to 906.7 | axes at x 145.0, 385.4, 631.8, 877.7 |
| Marks | Facebook 123,940 to 169,985; YouTube 366,940 to 430,986; Instagram 624,947 to 670,992; the star 870,940 to 916,985 | centres +1.0, +12.6, +15.2 and +15.3 px right of the axes; Instagram 7 px lower |
| Worth labels | 100,1018 to 191,1038; 353,1019 to 444,1039; 596,1018 to 698,1039; "UP TO" 859,1015 to 928,1034 over "20% OFF" 840,1040 to 947,1060 | centred on the marks; cap height 19.6 ("UP TO" 18.75); the two lines 26 px apart |
| Hairlines | left x 89 to 233 (traces to x 60), right x 784 to 927 (traces to x 960), at y 1180 to 1181 | 37 and 35 px from the heading |
| GOT YOUR COLOURS? | 271,1163 to 748,1200 | cap height 35.15 |
| Grey lines | 250,1225 to 769,1246; 249,1243 to 768,1263 | baselines 1240.5 and 1259 (pitch 18.5): line 1's descenders touch line 2's ascenders |
| Field (its visible part) | 164.8,1333.3 to 540.0,1393.7 | it runs on under the button |
| Placeholder | 196,1357 to 350,1370 | 31.2 px in from the field's outer left edge, centred on y 1363.5 |
| Button | 540.0,1333.3 to 854.7,1394.3 (314.7 x 61.0) | the joined control x 164.8 to 854.7 (689.9 px, 0.677 W) |
| Button label | 609,1356 to 789,1370 | centred (699 against the button's 697.3) |
| Footer | 323,1466 to 693,1484 | baseline 1480.5 |

**Rhythm.** The clear rows between ink, in reading order:

| From | To | Gap (picture px) | Share of W |
|---|---|---|---|
| the picture's top | the headline's cap top | 125 | 0.123 |
| headline line 1 | line 2 | 7 (cap-top pitch 89) | 0.007 |
| the headline | the sub-line | 30 | 0.029 |
| sub-line line 1 | line 2 | 9 (baseline pitch 30.5) | 0.009 |
| the sub-line | EVERY FOLLOW FILLS THE JAR | 98 | 0.096 |
| the label | the jars' rims | 96 | 0.094 |
| the jars' bottoms | the marks | 32 (39 to Instagram's) | 0.031 |
| the marks | the worth labels | 32 (25 under Instagram's, 29 to "UP TO") | 0.031 |
| the worth labels | GOT YOUR COLOURS? | 123 (102 from "20% OFF") | 0.121 |
| the heading | the grey lines | 24 | 0.024 |
| grey line 1 | line 2 | they overlap (baseline pitch 18.5) | |
| the grey lines | the form | 69 | 0.068 |
| the form | the footer | 71 | 0.070 |
| the footer | the picture's foot | 58 | 0.057 |

At the picture's own spacing the content, from the headline's cap top to the footer's foot, is about 1360 px tall for 1019 px of width (1.33 : 1); the seven big gaps are 640 of its 1543 px (41 percent), which is why D2 tightens them first.

**Colours.**
- *Ground.* Not quite flat. The top band (y 0 to 320) is #F2EAE1 (L* 93.1, a* 1.2, b* 5.3), with no corner vignette; the band at y 390 to 460 #EFE8DF (L* 92.3); the bottom third (y 1180 to 1543) #F3ECE3 (L* 93.8), 0.7 L* lighter than the top; the mark band (y 1070 to 1150) #F2EAE1; a faint mottle of about 1 L*, mostly compression; the hue constant. It is dE00 4.4 from Pearl Whisper; the nearest catalog shades are Seashell (`frosty-white-19`, #f0e8db, dE00 1.91) and Lace (`frosty-white-04`, #f5f0ea, 2.03).
- *The falloff.* Behind the jar row the backdrop darkens towards the right, from about y 330 to y 900, strongest at y 500 to 720 right of x 700. Above the jars (y 520 to 585) the left reads #EEE6DE and the right #E8E1D6. At the jars' mid-height (y 650 to 840): the left margin #EFE8DF (L* 92.3), between jars 1 and 2 #EEE6DE, 2 and 3 #EDE6DA, 3 and 4 #ECE4D9, the right margin #E7E0D5 (L* 89.4).
- *Text.* Read from the darkest pixels of each line (thin strokes read lighter than their ink), the picks of D3: the headline and the heading #000000; the sub-line #5A544D (its bold run #3F3935); the label over the jars #27211F; the worth labels #49443F; the grey lines #77706A (the picture reads about 3.7 to 3.8:1); the placeholder #AFA9A5; the footer #AEA8A3; the button's label near-white on #000000.
- *Hairlines.* About 1 to 1.5 px. Darkest at the end nearest the heading (#5C5650 to #645E59), fading linearly to the ground (#BAB5AE midway); the left one opaque at x 233 and gone by about x 85, the right one opaque at x 784 and gone by about x 940.
- *Field and button.* The field's outline #A49B99 at its centre pixel (L* 65), about 1.4 px wide (the ink of a 1 px line of about #7D7671); inside and outside it the ground, no fill. The button #000000.

**Type.** Two families set everything: a neo-grotesque for the headline, the sub-line, the labels, the heading and the grey lines, and a geometric sans for the label over the jars, the placeholder, the button and the footer. The originals are best guesses, named only (nothing of them was downloaded or ships):

| Line | The picture's face (named only; confidence) | Ships as (D3) | Glyph overlap of the match |
|---|---|---|---|
| Headline | Helvetica Now Display Light (Monotype), or Neue Haas Grotesk Display 45 Light (about 60 percent) | Inter 300, rendered as Inter Display | 0.81 |
| Sub-line | Helvetica Now Text Regular, or Helvetica Neue 55 (about 50 percent) | Inter 400 | 0.75 |
| Its bold run | Helvetica Now Text Bold, or Helvetica Neue 75 | Inter 700 | 0.79 |
| EVERY FOLLOW FILLS THE JAR | Avenir Next or Avenir, Medium or Roman (about 35 percent) | Jost 400 | 0.62 |
| Worth labels | Helvetica Now Text Light, or Helvetica Neue 45 (about 45 percent) | Inter 300 | 0.64 |
| GOT YOUR COLOURS? | the headline's face (about 60 percent) | Inter 300 | 0.69 |
| Grey lines | the sub-line's face (about 50 percent) | Inter 400 | 0.70 |
| Placeholder | Avenir Book, or Avenir Next Regular (about 40 percent) | Jost 400 | 0.67 |
| Button | Avenir Next Medium, or Avenir (about 35 percent) | Jost 400 | 0.65 |
| Footer | Avenir Book (about 40 percent) | Jost 400 | 0.68 |

Known differences: Inter draws its apostrophe as a straight wedge where the picture's is comma-shaped; Jost's J descends below the baseline where the picture's sits on it, and at matched caps Jost's ascenders stand about 11 percent taller; the word gaps of the headline, the heading and the labels are about 0.08 em tighter than Inter's space (the headline's first line sets 2.2 percent wide; a word-spacing of about -0.075 em would close it). Where another free family scored higher: "GOT YOUR COLOURS?" in Host Grotesk 300 (0.735 combined against Inter's 0.645, its O and G as wide as the picture's); the headline in Work Sans 333 at -0.10 em (0.709 against 0.674, with the picture's comma-shaped apostrophe); the button in Plus Jakarta Sans or Poppins 400 (both barred by the site's rules). Albert Sans ties Inter on the grey lines and is the nearest family not on the banned lists (section 14, item 5). The footer's dots are three full stops: their 6.5 px pitch matches Jost's full stops at the fitted tracking, where its ellipsis would give 5.6 px.

**Jars.** Four identical jars standing level: the rim's far edge at y 595.5, the bottom outline at y 906.7 on the axis.
- *Place.* Axes at x 145.0, 385.4, 631.8 and 877.7 (spacing 240.4, 246.4 and 245.9 px); outer diameters 151.2, 150.0, 151.2 and 152.1 px (mean 151.1, 0.148 W); gaps between the walls 89.8, 95.8 and 94.2; margins 69.4 px left and 65.3 px right.
- *Camera.* About 9 degrees above (6 to 11 from the rim, base, floor and fill-surface ellipses; each level fill top is 7 to 7.5 px higher on the axis than at the walls). The true height H is 294.8 px, so H / D is 1.95.
- *Fill.* As a share of the inner height (the inner floor to the lip's top, 279.8 px): 0.230 blue, 0.243 red, 0.463 pink and purple, 0 for jar 4; over the straight inner body alone (220.7 px), 0.291, 0.309 and 0.587. The fill tops at the axis and at the walls: jar 1 y 807.5 and 815, jar 2 804 and 811, jar 3 743 and 750.5.
- *Profile* (normalised to H, traced from the eight half-silhouettes and corrected for the camera). Base 0.051 thick, a flat bottom of radius 0.212, an outer corner radius 0.044; a straight body at r 0.2565 from z 0.044 to 0.799; an S-shaped shoulder to r 0.209 at z 0.892; a neck at r 0.207 outside and 0.190 bore up to z 0.942; the bead's near-flat underside from z 0.942 to 0.954, flaring to r 0.235; its outer face at r 0.246 to 0.2507 up to z 0.99; a flat top ring from r 0.24 to 0.19 at z 1.0. The full outer and inner lists stay with the measurement, outside the repository; the renders carry what they use (`scripts/signup/jars/`).
- *Glass.* Nearly clear: seen through both walls at the centre it is #E8E1D6, about 1 L* below the backdrop beside it, with no tint. Two soft vertical highlight bands inside the body (at -0.72 to -0.49 of the radius and +0.47 to +0.69), L* 94 to 95. Dark edge bands 6 px wide at the silhouette (L* 47 to 66), with a lighter inner line 3 to 4 px further in. The base reads 13 to 16 px thick, with a visible inner floor ellipse and a small central dimple; the rolled lip about 18 by 15 px in section. Tiny pure white speculars on the bead, the shoulder and the base; the darkest glass #4B433A at the bead's sides and the base's contact. The key light comes from the left.

**Pellets** (Sam's "sand").
- *Shape.* Small irregular plastic granules: the pink and purple mostly lentil-shaped or short rods with rounded edges, the blue and red chunkier faceted chips. No discs, spheres or powder.
- *Size.* About 6 to 9 px across in projection (0.045 to 0.065 of the inner width, 16 to 23 grains across the jar); the blue and red a little smaller than the pink and purple.
- *Sheen and light.* Satin: the brightest 0.1 percent of pixels stay coloured, with no white glints. The top is lit from above (the blue reads L* 62 on top against 44 on the front), the key comes from the left, and the gaps between grains are darker saturated versions of the lot, never grey or black. Almost all the variation is shading; the hue holds within each lot.
- *Pile.* Level and flat on top, bumpy at the grain's scale (about 2 px), with no loose grains above it; the arc seen in the picture is the perspective of a level surface.
- *Colours.* Blue median #056AED (p10 #0049C2, p90 #59ABFE); red #E81617 (p10 #BC0E10, p90 #FD5750); pink #EC63A5; purple #8E49B0. Jar 3 in the picture is layered, pink over purple (41 to 59 percent by visible area, about 1 : 2 by volume, a 16 px mixed seam); Sam asks for one mixed lot (D5), whose median in the picture is #B14FA8.
- *Against the catalog* (CIEDE2000): the blue's nearest shade is Azure (`blissful-blue-10`, dE00 8.7; its shadows Royal or Cobalt), the red's Classic (`roaring-red-06`, 2.6), the pink's Doll (`playful-pink-16`, 4.8), the purple's Amethyst (`vivid-violet-07`, 6.9), the mixed lot's Wildberry (`vivid-violet-13`, 4.5). The pellets wear the picture's colours, not these (E-S5-picture).

**Marks.** All about 47 px tall (0.046 W): Facebook, Instagram and the star 47 x 46, YouTube 65 x 47.
- *Facebook.* The 2023 mark: a disc in #0966F9 (the brand's #0866FF) with a white f whose stem runs off the bottom of the disc.
- *YouTube.* The play-button shape in #FB0303 (#FF0000): a rounded rectangle with a corner radius of about 12 to 13 px and near-straight sides, a white triangle about 17 x 20 px, centred.
- *Instagram.* A squircle with a corner radius of about 11 to 13 px in the 2016 app icon's radial gradient, from yellow #F9CF7C at the bottom left through orange #F58947, red-pink #E62B58 and magenta #C53098 to purple #9649B6 and blue-violet #5F5ECB at the top left; a white outline camera (a rounded square of about 35 px with a stroke of about 3.5 px, a ring of radius about 9 px, a dot of about 2 px at its top right).
- *The star.* An orange disc #FA841A (not Ember Luxe #FF9900) with a five-point star of about 30 x 28 px cut out to the page's colour.
- *Placement.* The centres sit +1.0, +12.6, +15.2 and +15.3 px right of the jar axes, Instagram's 7 px lower than the others; the worth labels are centred on the marks (x 145.5, 398.5, 647, 893.5), not on the jars. D7 centres both on the jars.

**Form.** One control, centred: x 164.8 to 854.7 (689.9 px, 0.677 W, centred at 509.7), y 1333.3 to 1394.3.
- *Field.* A full pill 60.4 px tall (0.059 W) with semicircular ends (the outline's centre-line radius 29.5 px), the outline about 1.4 px at #A49B99, no fill; 375.2 px of it visible. The placeholder is 31.2 px in from its outer left edge, vertically centred, in a light geometric face.
- *Button.* 314.7 x 61.0 px, a full black pill (radius 30.5 px), its label near-white with open tracking, centred.
- *The join.* The button overlaps the field's right end: its left semicircle sits on the field, its top and bottom edges are flush with the outer edges of the field's outline, the outline's top and bottom lines run straight into it, and the field's own right end is hidden. The button takes 45.6 percent of the joined width.

**Shadows and floor.**
- *Shadows.* Every jar casts one soft shadow, to its right only (the key from the left and a little in front): a wedge on the floor from the jar's right wall, 24 px tall beside the jar, narrowing to about 6 px, at full depth for 30 to 35 px and fading to nothing by 75 to 80 px from the wall (about half the jar's diameter). Its core is #C6B9AD to #CCC2B5 (dL* -15 to -18 on a floor of L* 93 to 94; jar 2's the darkest, jar 4's the lightest at -13); its edges blur over 4 to 6 px; jar 4's runs off the picture's right edge.
- *Floor.* Glossy. Directly under each jar (y 907 to 945) a coloured reflection of the fill: blue #E0DEE8, red #F2D0CB, pink and violet #E9D8DE, and only the ground under the empty jar (#EDE5DC); a faint pale reflection of the glass base under each.

**The renders, tested.** A render test on 2026-11-02 traced the jar from the picture, revolved it into a mesh of our own (its silhouette within 1 to 3 px of the picture's at its scale, height to width 2.076 against 2.072) and rendered the glass and the pellets in Blender's Cycles on this machine: the pellets as flat rounded-triangle chips, their medians within about 15 levels of the picture's (blue 21,100,236 against 5,96,230; red 242,25,24 against 230,14,15), the blue and the red calibrated to the picture's medians and the pink and purple set from them, not from catalog shades. The lower layers keep their pixels in every later state only when they are taken from the earlier state's render (the light of a new layer and the denoiser change them by about 5 of 255 otherwise); C2 asks for that identity.

## 4. The contracts (C1 to C6)

Between the builders; each holds as written.

**C1 The ground's constant.** `src/config/signup-ground.ts`, exactly these three lines (the island builder writes it first; the page builder writes the same if it is missing):

```ts
// Section 5's ground, measured from Sam's picture of 2026-11-02 (its top band; the bottom third is 0.7 L* lighter, too little to draw).
// The page (--su-ground in src/styles/signup.css) and the hero island's flat ground for the fourth wipe use it; a unit test keeps them equal.
export const SIGNUP_GROUND = '#F2EAE1';
```

**C2 The jar images** (the renders builder; nobody else writes in that folder). `src/assets/signup/jars/jar-<state>-<1x|2x>.<avif|webp>` for the sixteen states `0 f y i fy fi yf yi if iy fyi fiy yfi yif ify iyf` (f is Facebook's quarter of blue, y YouTube's quarter of red, i Instagram's half of the mixed lot; the letters in press order, the bottom layer first): 64 files. The frames: 2x 400 x 480 px, 1x 200 x 240 px, a transparent background, the jar's axis at the frame's horizontal centre, its outer diameter half the frame's width, the base's contact at about 0.87 of the frame's height and the rim's top at about 0.06, the shadow inside the frame to the right. `src/assets/signup/jars/jars.json`: `{ "frame": { "w": 400, "h": 480 }, "jar": { "x0", "x1", "y0", "y1" }, "states": { "<state>": { "top": <the topmost point of the fill's surface as a fraction of the frame's height; for "0", the inner floor> } } }`, the jar's box as fractions of the frame. Each state's image is pixel-identical to its prefix state's below the prefix's surface, so a reveal from the old top never jumps. Jars 1, 2 and 3 use f, y and i. Provisional files under every name within the renders builder's first 15 minutes, replaced by the final renders all at once at its end.

**C3 `section#signup` attributes.** `data-ready="1"`, set by the page's script once jar 4's current image, the three showcase jars and the section's fonts are decoded, or 4 s after the section is unlocked, whichever comes first. `data-ground="island"`, set and removed by the island only.

**C4 Events.** The page's script dispatches `skreed:signup` with `{ id, follows }` on each follow (as before) and `skreed:signup-filled` with `{ state }` when a fill has finished (at once under reduced motion). The budget identifies the page script's chunk by the string `skreed:signup-filled`.

**C5 Test hooks.** Behind `import.meta.env.PUBLIC_HERO_HOOKS === '1'` the page's script sets `window.__skreedSignupHooks = { state(): string, press(id: 'facebook' | 'youtube' | 'instagram'): void, reset(): void }`; `press` counts the follow without opening a tab. The island's old signup hooks (`__s5`) go.

**C6 Geometry.** The island reads `exitY` and `restY` from the DOM only (`signupDom()`, `.su-body`'s rect, as before). `.su-body` is one screen tall, so its exit is its top: `exitY` (the body's document bottom less the viewport's height) equals the body's top, and `restY` is the same point.

## 5. Fit targets

Every case with section 5 at its rest (`.su-body`'s top at the viewport's top). The top clearance is the section's as built and is kept (D2): `--inset` (`clamp(16px, 3.5vw, 56px)`) plus 56 px plus the top safe area. The height left assumes today's bottom padding (`--inset` plus the bottom safe area); the build may take it in. Laptop rules apply from 720 px wide, so 768 x 1024 is a laptop case; since 2026-11-02 the landscape sizes from 900 px wide (every laptop case but 768 x 1024) take D2's two columns.

| Viewport | Rules | Form | Top clearance (px) | Bottom padding today (px) | Height left (px) |
|---|---|---|---|---|---|
| 1280 x 800 | laptop | on and off | 100.8 | 44.8 | 654.4 |
| 1366 x 657 | laptop | on and off | 103.8 | 47.8 | 505.4 |
| 1536 x 730 | laptop | on and off | 109.8 | 53.8 | 566.5 |
| 1920 x 970 | laptop | on and off | 112.0 | 56.0 | 802.0 |
| 768 x 1024 | laptop | on and off | 82.9 | 26.9 | 914.2 |
| 412 x 915 | phone | on and off | 72.0 | 16.0 | 827.0 |
| 390 x 844 | phone | on and off | 72.0 | 16.0 | 756.0 |
| 360 x 780 | phone | on and off | 72.0 | 16.0 | 692.0 |
| 390 x 664 | phone | off; the overflow reported if it does not fit | 72.0 | 16.0 | 576.0 |
| 375 x 667 | phone | off; as above | 72.0 | 16.0 | 579.0 |

The minimum sizes: on a laptop the body lines (the sub-line, the grey lines, the footer, the placeholder, the button) 15 px and the worth labels 13 px; on a phone 13 and 11. The measured fit (each case's content height, its free space or overflow, the sizes it settled on) is section 16, item 1.

## 6. States

**Jar 4.** Sixteen states, one image each (C2), named by the follows in press order. Jars 1, 2 and 3 show `f`, `y` and `i` and never change.

| State | Follows, in press order | Level | Layers, from the bottom |
|---|---|---|---|
| `0` | none | empty | none |
| `f` | Facebook | a quarter | blue |
| `y` | YouTube | a quarter | red |
| `i` | Instagram | a half | the mixed lot |
| `fy`, `yf` | Facebook and YouTube | a half | blue then red; red then blue |
| `fi`, `if` | Facebook and Instagram | three quarters | blue then the lot; the lot then blue |
| `yi`, `iy` | YouTube and Instagram | three quarters | red then the lot; the lot then red |
| `fyi`, `fiy`, `yfi`, `yif`, `ify`, `iyf` | all three | full | in press order |

- *A new follow* moves jar 4 from a state to the state with the new letter added: the fill of D6, from the old state's seam to the new one's top.
- *A repeat press* on a platform already in the state opens its page and changes nothing.
- *A press during a fill* waits; its fill starts when the running one has finished and `skreed:signup-filled` has fired.
- *A press while the page is hidden* (the platform's tab in front): the state is counted and stored at once; the fill plays 300 ms after the page is visible again.
- *On load* the stored state shows at once, with no fill and no `skreed:signup-filled`. A new session starts at `0`. Without storage the follows live for the page's life.
- *Reduced motion:* each new state at once, `skreed:signup-filled` at once.

**The form** (`PUBLIC_LEADS` on; the logic and the words of the form as before).

| State | What the visitor sees |
|---|---|
| Empty | the pill field with "Your email address" in #AFA9A5, the black "SAVE MY DISCOUNTS"; the message line empty, its space kept |
| Typing | the typed text in Jost 400, #27211F; nothing is checked per keystroke |
| Invalid | on blur once there is a value, and on submit: "That doesn’t look like an email address." in the message line, the field marked (`aria-invalid`), the value kept |
| Sending | "Sending..." while the request runs; "Still trying..." at 8 s; the request stopped at 20 s |
| Error | a 5xx, a network failure or the 20 s stop: "That didn’t go through. Try again.", the address kept |
| Offline | a failed request with `navigator.onLine` false: the lead queued in `sessionStorage` (`skreed:signup-queue`), "You’re offline. We’ll send it when you’re back.", sent on `online` |
| Rejected (422) | as Invalid |
| Saved before (409) | read as success |
| Success | "Done. Your colours are saved to {email}." and "Not you? Use another email.", which puts the empty form back |
| Off (production) | no heading with its hairlines, no grey lines, no form, no message line; the footer stays |

The request: `POST /api/signup`, JSON, credentials omitted, carrying the email, the follows in press order and `source: 'signup'`; with no box to tick there is no consent for it to carry (section 14, item 4; the request as built is section 16, item 12).

**The section.**

| Attribute | When | Set by |
|---|---|---|
| `hidden`, `data-locked` | until the quiz's result shows or Skip quiz is pressed, then open for the visit; never without JavaScript | the quiz gate (E-QG-lock), as built |
| `data-ready="1"` | once jar 4's current image, the three showcase jars and the fonts are decoded, or 4 s after the unlock | the page (C3) |
| `data-ground="island"` | while the island holds the flat ground under the section | the island (C3, D10) |

## 7. Accessibility

- **Headings.** The headline is the section's heading and "GOT YOUR COLOURS?" a heading under it (an `h2` and an `h3` in the markup of 2026-10-26; as built, section 16, item 12).
- **Links.** Each platform's column is one link with one name: the platform, its worth and the new tab, for example "Follow Skreed on Facebook, 5% off (opens in a new tab)". The jar image and the mark inside a link are decorative (an empty `alt`, an `aria-hidden` SVG), so the name is read once. The star's column is no link and takes no focus; its words are read as text.
- **Jar 4.** Its state is given as text (an `alt` or a visually hidden line) that changes with each fill (the words as built, section 16, item 12).
- **The live region.** Polite and visually hidden; one sentence per new follow ("Blue added to your jar."), none for a repeat press and none on load. The wrap's announcement from `skreed:room-state` stays (D9).
- **Focus.** The site's two-tone ring (Ember Luxe outside, Urban Slate inside) round the whole column on `:focus-visible`, and on the field and the button. On the cream ground the Urban Slate ring carries it (8.99:1 against #F2EAE1; Ember Luxe alone reads 1.80:1).
- **The field.** It has an accessible name beyond its placeholder (a label, visible or visually hidden); errors are tied to it by `aria-describedby` and `aria-invalid`; the done line takes focus on success. Its text should be at least 16 px on a phone, so that iOS Safari does not zoom the page on focus (the rule of the build of 2026-10-26; above D2's 13 px floor).
- **Targets.** Each column is far over 44 px; the field and the button are at least 44 px tall at every size (CHECKLIST B2).
- **Reduced motion.** The fill at once and its event at once (D6); the fourth wipe's calm path and the seams as cuts, as built.
- **Contrast** on the flat ground, computed from the hex values (WCAG AA: 4.5:1 for text at these sizes, 3:1 for a control's edge):

| Line | Colour | Ratio on #F2EAE1 | AA |
|---|---|---|---|
| Headline, GOT YOUR COLOURS? | #000000 | 17.63:1 | passes |
| Sub-line | #5A544D | 6.27:1 | passes |
| Its bold run | #3F3935 | 9.54:1 | passes |
| EVERY FOLLOW FILLS THE JAR; the typed text | #27211F | 13.32:1 | passes |
| Worth labels | #49443F | 8.08:1 | passes |
| Grey lines | #77706A | 4.09:1 (about 3.8:1 measured in the picture) | below |
| Placeholder | #AFA9A5 | 1.95:1 | below |
| Footer | #AEA8A3 | 1.97:1 | below |
| Button label | #FFFFFF on #000000 | 21.0:1 | passes |
| The field's outline (a control's edge) | #A49B99 | 2.28:1 | below 3:1 |

The lines below AA are the picture's (E-S5-picture; section 14, item 8). The falloff never sits behind text, so these ratios hold where the text is.

## 8. Motion

No library. The page moves by the fill's `clip-path` and the mark's hover; the island moves only for the fourth wipe and the seams.

| Trigger | What moves | How |
|---|---|---|
| The scroll from section 4's q 12.8 to 13.8 | the fourth wipe | the composite's cut as built, scene 5's frame held under it, the far side the flat ground in exact sRGB (E-S5-bg, E-S5-wipe) |
| Section 5 in view, at rest | nothing | visible at rest (rule 12): the page whole, every jar at its state; the island draws the ground once and holds it |
| A press on a platform's column, a new follow | jar 4's new layer | 500 ms after the press while the page is in front (else 300 ms after it is in front again): the next state's image over the current one, revealed upward by `clip-path: inset(<top>% 0 0 0)` from the current state's seam (D6) to the new state's top, 900 ms a quarter and 1400 ms a half, ease-out; then `skreed:signup-filled` (E-S5-fill) |
| A press during a fill | nothing yet | queued; its fill follows the running one |
| A press on a platform already followed | nothing | its page opens again |
| A fine pointer over a platform's column | the mark | scale 1.06 on `--ease-standard`, no change of opacity (rule 14) |
| The exit seam, the wrap, the glue | the seams | as built, with the exit guard (G4): the exit runs only once the page has rested at the section's rest for 300 ms with no input; before that the page is held at the rest, with no cloud |
| Idle | nothing | the corner logotype's own idle glitch (E-CD-glitch) is the page's, not the section's |

**WCAG 2.2.2.** Each fill is visitor-started and ends on its own in 1.4 s at most; three quick presses chain to 3.7 s (4.7 s if each queued fill waits its own half second), under the 5 s past which a pause control is required. The ground does not move.

**WCAG 2.3.1.** The fill is a slow reveal of one small area; nothing flashes.

## 9. Budget

KB are 1024 B; scripts at gzip, everything else as stored. Measured by `scripts/hero/budget.mjs` on `npm run build`; the island builder owns the script and its lines.

| Part | Line | Note |
|---|---|---|
| Critical JS | 60 KB gz | unchanged: nothing of section 5 is in the boot |
| Total JS with sections 4 and 5 and `scroll.ts` (enforced) | 250 KB gz | the island's jar chunk leaves (7.6 plus 1.6 KB gz in the sand's build record), so the total falls; measured 247.0 KB on 2026-11-03, with the section index on the page since the merge of the default (section 16, item 6) |
| Section 5's page script (`src/scripts/signup/`; its chunk named by the string `skreed:signup-filled`, C4) | 7 KB gz, set 2026-11-03 (6.5 KB on 2026-11-02 from the measure; 6 KB was the old page's line) | the decode and the stills' map leave it; the fill, the queue, the preload and the sixteen states' picture URLs (`jar-srcs.ts`, shared with the page) come; measured 6.7 KB on 2026-11-03 (section 16, item 6) |
| The first view: section 5's markup and `signup.css` | 5.5 KB gz, set 2026-11-03 (5 KB on 2026-11-02 from the measure; 4 KB was the old page's line) | the four inline marks, the joined field and button and jar 4's two layers come; the follow links' 96 hexes, the credit and the poster picture go; the states' URL table never rides the markup; measured 4.9 KB on 2026-11-03 (section 16, item 6) |
| Inter and Jost | 72,920 and 26,576 bytes, unchanged files | outside the 120 KB cap of the brand faces (`docs/brand/type-system.md`), as the Plex Mono files are; requested only once section 5's text is laid out, so never while the section is locked |
| The jar images | 64 files: sixteen states at 1x (200 x 240) and 2x (400 x 480), AVIF and WebP | the caps set from the measured files; jars 1 to 3 and jar 4's state load when the section nears, the possible next states after them |
| The first view | 1.5 MB | unchanged: section 5 loads nothing while it is locked |
| Gone | the jar chunk's line (9.5 KB gz), `jar.bin` (20 KB), the sixteen stills (64 files, caps 10 to 40 KB) | the island's jar left (D9, D10) |

**Frame cost.** Under section 5 the island draws the flat ground once and holds it: no draw per frame at rest. The fill animates `clip-path` on one image; nothing lays out.

## 10. What left the section

- **The island's WebGL jar**: `src/scripts/hero/section5/jars.ts` and `jars-math.ts` (the renderer and its maths; the folder now holds the island's flat ground), its chunk and its hooks (`__s5`), `skreed:signup-poured` and `data-pouring`.
- **The third party's jar model and its credit**: Pentristo's "Glass jar" (CC BY 4.0), its source GLB (`assets-src/signup/glass_jar.glb`), packed as `src/assets/signup/jar.bin` by `scripts/signup/jar-bin.mjs` with its manifest (`src/data/signup-jar-bin.json`), and the credit line the licence asked for. The jars are now our own lathe traced from the picture (section 3, "The renders, tested"; `scripts/signup/jars/`).
- **The sand, the pour, the dust and the tilt**: the sand body, the stream of grains, the heap, the motes and the 10 degree lean (E-S5-pour, E-S5-tilt, E-S5-dust-alpha).
- **The fog under the section**: section 2's fog as E-S5-bg first had it.
- **The decode and IBM Plex Mono** on the section's lines (E-S5-font, E-S5-motion), and the quiz's sizes they wore.
- **The follow words and the counts**: "Follow on Facebook", "Subscribe on YouTube", "Follow on Instagram", the state lines ("Not yet", "Collected") and the count line ("Nothing collected yet", "1 of 3 collected", "Full").
- **The poster stills**: the sixteen states over `--night` in `src/assets/signup/stills/` (64 files) and `scripts/signup/render-stills.mjs`. The jar images serve every tier now: the poster tier shows the same page, on the page's own ground.
- **The stand-in copy**: "One thing left. Follow us to collect colours. ...", "first dibs", "Save my colours", "Keep following to keep your colours.", the consent row, the fine print, the label "Email" as printed.

## 11. Acceptance criteria

Each is PASS or FAIL with evidence; the measuring step reads them at 390 x 844 and 1280 x 800 unless a criterion names its own sizes, on the 3D path (`?tier=hero3d&room=open`, a hooks build) and on the poster tier, and records the figures in section 16.

1. **Copy (D1; CHECKLIST A4).** The section's visible text, read in order, is D1's thirteen items exactly: U+2019 in "YOU’VE", "that’s" and "We’ll"; "Pssst...keep" with three U+002E and no U+2026; the bold run's text exactly "save up to 20% off your first order."; "UP TO" and "20% OFF" on two lines. No other visible text in the section but the form's message in its states: no credit, no consent, no count, no follow word. No em dash and no emoji.
   *Measured:* section 16, item 1 (the fit table).
2. **Type (D3; A3 under E-S5-picture).** Per line of D3's table, the computed `font-family` begins with its face, the weight is the table's, the letter-spacing over the font size is within 0.002 em of the table's, the line-height is the table's where it gives one (the grey lines' leaves their descenders clear of the next line), and the colour is the table's hex exactly; `font-optical-sizing` is `auto`. The two files under `public/fonts/` have the sizes and sha256 of D3; their `@font-face` rules carry `font-display: swap`, the weight range 100 900 and the latin `unicode-range`. No element in the section computes to IBM Plex Mono.
   *Measured:* section 16, item 2 (the sizes and the gaps).
3. **Ground and falloff (D4, D10; A2 under E-S5-picture).** A unit test holds `SIGNUP_GROUND` to '#F2EAE1' and to `--su-ground`. On the 3D path with `data-ground="island"`, ten sampled pixels of the section away from the jar row read (242, 234, 225) exactly at both sizes; on the poster tier the same, from the page. The falloff lies behind the jar row only: its box intersects no text box, and no two neighbouring pixels across its edges differ by more than 1 level a channel. Its colours at its two ends at the jars' mid-height are recorded against #EFE8DF and #E7E0D5.
   *Measured:* section 16, item 3 (the placement).
4. **One screen (D2; B2, B4).** At each of the ten fit cases (section 5 of this spec), with `.su-body`'s top at the viewport's top: every element's box (the headline's lines, the sub-line, the label, each jar's box from `jars.json`, the marks, the labels, the hairlines, the heading, the grey lines, the form, the footer) lies below the top clearance and inside the viewport, with the 16 px insets on a phone; no two of those boxes intersect (the jars' transparent frames excepted); `scrollWidth` equals `clientWidth`; the footer's bottom is inside the viewport. The two short phones may instead record their overflow in px. Every size holds its floor (15 and 13 px on a laptop, 13 and 11 on a phone). `.su-body`'s height equals the viewport's height within 1 px.
5. **Placement (D2, D7).** The sub-line's left edge sits right of the headline's by 0.0255 of the column's width, within 1 px (the text column's on the laptop's two columns). The label, the jar row (the mean of the four axes), the heading, the grey lines, the form and the footer are centred on the column within 1 px (on the two columns, the label and the jar row on the jar column, the rest on the frame). Each mark's centre is on its jar's axis within 1 px and each label's centre on its mark's within 1 px. On a phone each jar's outer diameter is 0.18 of the column, within 0.01. The axes' spacing is recorded.
6. **The jar images (C2, D5).** 64 files under C2's names, each 400 x 480 (2x) or 200 x 240 (1x), with an alpha channel; `jars.json` of C2's shape; the sixteen tops ordered by level (the empty floor lowest, then the quarters, the halves, the three quarters, the full states highest; within one level within 0.01 of each other). Each state equals its prefix state (the state less its last letter) below the prefix's top: byte for byte in the lossless renders, and within the encoder's error in the files that ship (that error recorded per format). Jars 1 to 3 show `f`, `y` and `i`; jar 4 starts at `0`.
7. **The fill (D6, C4, C5; rule 12 under E-S5-fill).** In a fresh session, a press on Facebook: `href`, `target="_blank"` and `rel="noopener"` as D6 gives them; `sessionStorage['skreed:signup-follows']` becomes `["facebook"]`; `skreed:signup` fires once with `{ id: 'facebook', follows: ['facebook'] }`; with the page in front, the reveal starts 500 ms after the press and lasts 900 ms, each within one frame, then `skreed:signup-filled` fires once with `{ state: 'f' }` and `__skreedSignupHooks.state()` returns 'f'. A second press on Facebook fires nothing and changes nothing. YouTube then Instagram give 'fy' and 'fyi', Instagram's reveal lasting 1400 ms. A press during a fill starts its fill when the running one has fired its event. With the page hidden at the press, the fill starts 300 ms after the page is visible again. Under reduced motion each new state shows at once and its event fires at once. A reload within the visit shows the stored state at once with no reveal and no `skreed:signup-filled`; a new context starts at '0'; with `sessionStorage` throwing, the follows hold for the page's life. The live region says one sentence per new follow. At rest, two captures of the section below the logotype's band, 1.5 s apart, are byte-equal, and `document.getAnimations()` holds nothing inside the section.
   *Measured:* section 16, item 7 (the ground and the falloff).
8. **Marks (D7).** Four inline `<svg>` elements, no image file and no network request for a mark, and no `style` attribute in them (the CSP); Facebook's, Instagram's and the star's heights equal within 0.5 px and YouTube's width about 65 / 47 of theirs; the disc #0866FF, the rectangle #FF0000, the star's disc #FA841A with its star in the ground's colour, Instagram's gradient with D7's six stops. On a fine pointer's hover the mark's transform settles at scale 1.06 with `--ease-standard` and its opacity stays 1. On keyboard focus the ring encloses the column's jar, mark and label. The star's column holds no link and no focusable element.
9. **Form (D8; G13, H2, H3, H4, E4).** With `PUBLIC_LEADS` on: the field's outline 1.4 px #A49B99, no fill, its radius half its height; the button #000000 with a #FFFFFF label, its width 0.456 of the joined width within 0.005, its top and bottom on the field's outer top and bottom within 0.5 px, over the field's right end. The footer's top does not move between the empty, invalid, sending and error states. The states of section 6 as listed (validation on blur and submit only; the 8 s and 20 s marks; a 5xx keeps the address; offline queues and sends on `online`; 422 marks the field; 409 reads as success; "Not you?" restores the form). The request goes to `/api/signup` with no cookie. No consent box anywhere in the section. With `PUBLIC_LEADS` off (a production build): no heading, no hairlines, no grey lines, no form; the footer present.
10. **Accessibility (E3 under E-S5-picture).** The three links' names in the accessibility tree carry the platform, the worth and the new tab; the star's column is not in the tab order; the tab order runs the three links, then the field, then the button; the ring of each is visible; the field's accessible name is not its placeholder alone; jar 4's text changes with its state; the live region speaks once per new follow; the field and the button are at least 44 px tall at every size; the measured contrast of each line matches section 7's table within the anti-aliasing of thin strokes.
11. **The island and the seams (D10, C6; E-S5-bg, E-S5-wipe).** Mid-cut, the far side's pixels away from the cut's band read (242, 234, 225) exactly. With section 5 in view `data-ground="island"` is set, and gone when it is not; at rest the island draws no frame over 1.5 s. The exit seam runs from section 5's rest once the guard has armed, and the wrap from the top lands with `.su-body`'s top at the viewport's top (`tests/e2e/room.spec.ts`'s exit and wrap cases and `tests/unit/exit-guard.test.ts` pass). The glue's fourth span is as built. On the poster tier there is no island and no `data-ground`.
12. **What left (D9).** The production build carries no `jar.bin`, no stills of the old jar and no chunk of the island's jar, and the test build's island no `__s5`; no `data-dc` attribute in the section; no follow word, count line, credit or consent box. Kept and working: `section#signup` with its id, `hidden` and `data-locked` until the unlock, `.su-body`, `.su-loopend`, `.su-fade`, the `skreed:room-state` announcement and the `skreed:signup` event.
13. **Budget (C1, C2, C4; CLAUDE.md's budget).** `npm run build` passes with every enforced line of section 9 holding; critical JS unchanged; total JS at most 250 KB gz; the page script found by `skreed:signup-filled`; no request for either font file or any jar image in the first view; the production CSP unchanged.
14. **Tests and records (F1, F2).** The unit and e2e suites of section 5 (`tests/unit/signup.test.ts`, `tests/e2e/signup.spec.ts`) cover AC1 to AC12 as far as a headless browser can; the room's, the exit guard's and the quiz gate's suites pass; the documents of section 15 carry the rebuild; no TODO, placeholder or commented-out code.

## 12. What still holds from section-5.md and section-5-sand.md

From `docs/specs/section-5.md` (2026-10-26):
- The fourth wipe from scene 5 (its section 2, "The fourth wipe"; section 4's track 14.8 screens, `WIPE4_START` 12.8, `ROOM_HEIGHT` 14.8, the track 1480svh), its far side now the flat ground.
- The exit seam from the section's end and the wrap onto its rest (its section 2, "The exit seam" and "The wrap from the top"), with `.su-body` one screen tall (C6) and the trigger the exit guard's since 2026-11-02 (a crossing of the rest once the page has rested there, in place of its section 12's bare crossing).
- The glue's fourth span over the fourth wipe; no span at the section's top or end.
- The lock with section 4 behind the quiz (its section 12, "The lock"; the inline step after the markup; `gate.ts`'s unlock opening both).
- The honour system (its D6), the store's own addresses (its section 3), the ladder of worth (a quarter, a quarter, a half; its D5), email only (its D9).
- The form's logic, its words for the states and `/api/signup` (its section 2, "The form"), and the poster tier's loop end (at `.su-loopend` until 2026-11-03; gone since, section 18).

From `docs/specs/section-5-sand.md` (2026-10-29):
- The follows remembered for the visit in `sessionStorage` as the ordered list of ids, the layers lying in press order, and its sixteen keys of the press order (`0`, `f`, `y`, `i` to `iyf`), which now name jar 4's images.
- The `skreed:signup` event with `{ id, follows }`; its reading of "verifies" as the honour system.

Everything else in both is history: the fog, the four jars and then the one jar drawn by the island, the glass and the beads, the model and its credit, the sand and the pour, the type and the decode, the follow words and the counts, the stand-ins for the discount words, the consent box, the stills, and the exceptions E-S5-font, E-S5-contrast, E-S5-motion, E-S5-model, E-S5-pour, E-S5-tilt and E-S5-dust-alpha.

## 13. Exceptions

Sam's words of 2026-10-26 and 2026-11-02 cover these, so they are recorded as approved with them, each with its default if withdrawn. They apply to section 5 (`section#signup`) and the fourth wipe only.

- **E-S5-bg, amended** (CLAUDE.md "No WebGL from section 3 (the Wall) on", CHECKLIST C3). The hero island keeps running under section 5 and draws a flat ground of the picture's colour there (`SIGNUP_GROUND`, #F2EAE1, exact sRGB), drawn once and held while the section is in view (`data-ground="island"`), and no jar; the cut from scene 5 onto it is the composite's. The fog of 2026-10-26 and the rules it touched (1, 12, 20, 21, 42 and 43, WCAG 2.2.2) are gone with it; the ground's colour is E-S5-picture's. Sam: "the same transition animation as section 1 to section 2" (2026-10-26) for the cut, and "same backround ... from that picture" and "Background, font, placement - everything should be like this" (2026-11-02) for the ground, in place of his "the same backround as section 2". *Default if withdrawn:* the page paints the ground with no island under the section; the fourth wipe a 300 ms cross-fade.
- **E-S5-wipe** (rule 12's reserved-motion list). The fourth wipe; "the same transition animation as section 1 to section 2". Stands, onto the flat ground. *Default:* a cut.
- **E-S5-pour: withdrawn** on 2026-11-02. The island's sand, its stream and its dust left the section with the picture; E-S5-fill takes its place.
- **E-S5-fill** (rule 12's reserved-motion list; CHECKLIST C3's "transform/opacity only" for the animated `clip-path`, as E-C3b's clip-path ride). Sam: "If they follow it, the fourth jar should fill up 25% with blue (which is same as Jar 1)" and "If they subscribe to it, the fourth jar should fill up 25% with red (on top of the 25% blue)". On a press of a platform's column only, jar 4's new layer revealed upward over the current image, 900 ms for a quarter and 1400 ms for a half, ease-out, 500 ms after the press while the page is in front or 300 ms after it is in front again, presses during a fill queued; never at rest, never on hover, never on its own; at once under reduced motion. *Default if withdrawn:* the new state at once.
- **E-S5-picture.** Sam: "just make this exact same page with the same logic, same font, same space, same backround, same everything from that picture, just relayout it for phone as well, use the exact same font for each and every line from that picture"; "Background, font, placement - everything should be like this."; "the sand should look exactly the same as the picture". The picture's page as built, in five parts:
  - *Its type.* Inter (300, 400 and 700) and Jost (400) for every line, from two self-hosted variable files outside the four and outside the brand faces' 120 KB cap; capitals for the headline, "EVERY FOLLOW FILLS THE JAR", the worth labels, "GOT YOUR COLOURS?" and the button; the worth labels down to 11 px on a phone. Against rules 4, 19 and 30 (Inter is banned in every role; DESIGN.md's banned list), the typography line (Poppins 700 headlines in sentence case, never all-caps headlines; Open Sans for labels, inputs and buttons), `docs/brand/type-system.md` ("Nothing else is loaded") and CHECKLIST A3, its 12 px floor included. *Default if withdrawn:* the brand faces in the same places and sizes: Poppins 700 for the headline and "Got your colours?" in sentence case, Source Serif 4 for the sub-line (its bold run at 600), Open Sans 400 to 600 for the rest, nothing under 12 px.
  - *Its colours.* The cream ground #F2EAE1 (the island's ground the same) against "The page neutral is Pearl Whisper" (rule 23), the visual identity line, the Always-do colour line and CHECKLIST A2; its warm greys and black for the text, the hairlines and the field (#000000, #5A544D, #3F3935, #27211F, #49443F, #77706A, #AFA9A5, #AEA8A3, #5C5650, #A49B99) against A2's "No invented greys"; the platforms' blue and red and Instagram's gradient against rules 1, 21 and 24; the orange star (#FA841A, not Ember Luxe), a mark on no control, against rules 10 and 24; the black pill button with a white label in place of Ember Luxe for the primary button (the visual identity line; DESIGN.md's primary button), and the pills' full radius against rule 39; the pellets in the picture's colours, not catalog shades, against A2, the Always-do colour line, rule 38 and CHECKLIST A5 (the section shows no case and no catalog shade). *Default if withdrawn:* the Pearl Whisper ground (page and island), the text in Urban Slate, the marks in Urban Slate with no gradient and no orange, an Ember Luxe button with an Urban Slate label and square corners, a square field, the pellets in the families' catalog shades (Blissful Blue, Roaring Red, Playful Pink with Vivid Violet), re-rendered.
  - *Its contrast below AA.* The grey lines about 3.8:1 in the picture (4.09:1 as set), the placeholder 1.95:1, the footer 1.97:1, the field's outline 2.28:1 against WCAG 1.4.11's 3:1; against CHECKLIST E3. *Default if withdrawn:* #706964 for the grey lines (4.53:1), #6D6A67 for the placeholder and the footer (4.51:1), #8D8684 for the outline (3.0:1).
  - *Its discount words.* "save up to 20% off your first order", "unlock bigger discounts", "5% OFF", "10% OFF", "UP TO 20% OFF", "SAVE MY DISCOUNTS" and "keep your savings", against the brand's "Never discount language", rule 37 ("No pricing at all on the teaser") and `docs/00-IDEATION.md` decision 3. This answers E-S5-discount, the separate question section-5.md left open. *Default if withdrawn:* the stand-ins of 2026-10-26 ("first dibs", "Save my colours", "Keep following to keep your colours."), the worth labels gone.
  - *The falloff.* The soft darkening the page draws behind the jar row, never behind text, against rules 1 and 42. *Default if withdrawn:* the flat ground alone.
- **E-QG-lock** stands: section 5 is locked with section 4 behind the quiz.
- **Pending for section 5: none as exceptions.** E-S5-font, E-S5-contrast, E-S5-motion, E-S5-model, E-S5-tilt and E-S5-dust-alpha are superseded by the picture (the mono type, the fog, the decode, the third party's jar, the tilt and the dust all left the section). The questions on the rebuild are section 14.

## 14. For Sam

Each with what ships until he answers.

1. **The discounts are a promise to honour.** The page now says "save up to 20% off your first order", "5% OFF", "10% OFF", "UP TO 20% OFF", "unlock bigger discounts", "SAVE MY DISCOUNTS" and "keep your savings". They ship because you asked for the exact page; on launch day they are an offer the store must honour to every address that saved them. Decide what the code is, what it applies to, whether the 5, 5 and 10 add up to the 20, when it ends, one per person or per address, and what happens to someone who unfollows ("keep following to keep your savings"). Ships: your words, as the picture.
2. **"We’ll verify your follows" cannot be done by the site.** It collects an email only. No site can see who follows an Instagram, Facebook or YouTube account, so the press on a mark is counted as the follow (the honour system) and nothing is verified. Ships: the line as the picture has it. If you want a line that is true: "Drop your email below. We’ll send your colour codes straight to your inbox when we launch." Checking by hand on launch day would need each visitor's handles, which the form does not ask for.
3. **Meta's and YouTube's rules on rewarding follows and subscriptions.** The ideation records that "Meta cannot verify follows and prohibits enforced engagement gates" (decision 11), and YouTube's fake engagement policy, as we read it, covers incentives offered for subscribing. A discount per follow or subscription is such an incentive. Have their current terms read before launch; the build changes nothing for it.
4. **No consent box, under India's DPDP Act.** The picture's form has none, so none ships. The Act asks for consent that is free, specific, informed, unconditional and unambiguous, given by a clear affirmative action against a notice of what the data is for; typing an email and pressing "SAVE MY DISCOUNTS" can be that action only beside a notice saying what the address is used for, and the privacy policy (CHECKLIST G15) does not exist yet. The form is off in production (`PUBLIC_LEADS`) until the Worker exists, so nothing is collected before you answer. Choose: a one-line notice under the form, or the box back.
5. **Inter is banned by the site's rules in every role** (rules 4, 19 and 30) and ships here as the closest free match to the picture's Helvetica, with Jost for its Avenir, by your words ("use the exact same font for each and every line from that picture"). Albert Sans is the nearest family not on the banned lists (it ties Inter on the grey lines and averages about 0.02 lower in the match): a one-line swap of the file and the family name. Ships: Inter.
6. **The picture's originals are paid fonts.** Helvetica Now (Monotype) for the headline, the sub-line, the labels, the heading and the grey lines; Avenir or Avenir Next for the label over the jars, the field, the button and the footer. They are best guesses from the picture, named only: nothing of them was downloaded and nothing ships. Using them would be a licence to buy. Ships: the free matches.
7. **The platform marks are our own drawings**, inline SVG made to match the picture, not the platforms' official files. Meta, YouTube and Instagram publish their own files and rules for their marks. Swapping in the official files is four drawings. Ships: our drawings.
8. **The contrast is below AA, as in the picture.** The footer (#AEA8A3, 1.97:1) and the placeholder (#AFA9A5, 1.95:1) read at about 1.9:1, the grey lines at about 3.8:1 in the picture (4.09:1 as set), the field's outline at 2.28:1; AA asks 4.5:1 for this text and 3:1 for the outline. Ships: the picture's colours. To pass: the grey lines #706964, the footer and the placeholder #6D6A67, the outline #8D8684.
9. **The marks are centred on the jars.** In the picture they drift right by up to 15 px (+1.0, +12.6, +15.2 and +15.3 px) and Instagram's sits 7 px low; the build centres each mark and its label on its jar's axis. Ships: centred. Say if you want the drift.
10. **The apostrophe in "that’s" is curly.** The picture draws it straight, while "YOU’VE" and "We’ll" are curly; the build makes all three curly (U+2019). Ships: curly.
11. **The glossy floor and the falloff.** The jars stand on a faint glossy floor inside their images (a coloured reflection of the fill under each jar, a pale reflection of the base), and the page draws the picture's soft darkening behind the jar row, towards the right (#EFE8DF at the left to #E7E0D5 at the right, at the jars' middle). Both are the picture's photography. Ships: both. Without them: the flat ground and no reflection.
12. **The fill's motion.** A follow reveals the new layer in jar 4 from the bottom up, 0.9 s for a quarter and 1.4 s for a half, half a second after the press if the page is still in front, or 0.3 s after you come back from the platform's tab; at once under reduced motion. The picture shows only the states. Ships: the reveal. The alternative: the new state at once.
13. **The pellets wear the picture's colours**, calibrated to its blue, red, pink and purple ("the sand should look exactly the same as the picture"), not the catalog's shades: the nearest catalog blue, Azure, is dE00 8.7 away. So the section no longer shows one of the 240 shades (rule 38). Ships: the picture's colours. The alternative: the families' catalog shades, re-rendered.

## 15. Documents this rebuild changes

- `CLAUDE.md`: the "Section 5, the sign-up" bullet rewritten for the picture (Sam's words of 2026-10-26 for the wipe, his words of 2026-11-02, the DOM page over the island's flat ground); the section 5 exceptions: E-S5-bg amended, E-S5-wipe standing, E-S5-pour withdrawn, E-S5-fill and E-S5-picture added; the pending list for section 5 cleared in one line.
- `docs/CHECKLIST.md`: A1, A2, A3, C3, D1 and E3, their section 5 lines.
- `DESIGN.md`: the section 5 block of section 4 (Component Stylings) and the section 5 entry among the approved exceptions.
- `docs/HANDOFF.md`: the section 5 line.
- `docs/00-IDEATION.md`: the spine row for section 5.
- `docs/02-THE-SITE-IN-WORDS.md`: section 5's words, and a line on the sign-up at the top of "Section 5 on a laptop".
- `docs/specs/section-5.md` and `docs/specs/section-5-sand.md`: a note at the top on the rebuild, what still holds and what does not.
- Not changed, kept as history: `docs/specs/section-5.review.md`, `docs/specs/evidence/section-5-build.md`, `docs/specs/evidence/section-5-sand-build.md` and `docs/specs/evidence/section-5-contrast.md` (the fog's figures; section 7 here replaces them).
- Code, assets, scripts and tests: by the page, island and renders builders, each in its own files.

## 16. The measure (2026-11-02)

For the measuring step after the builders; each entry is filled in here with its figures, or answered in a line. Measured on 2026-11-02 on the Mac that took the work over, on the dev server (a hooks build) with the installed Chrome under Playwright, by `scripts/signup/measure.mjs` (the browser's part: items 1 to 3 and 7 to 12), `scripts/signup/measure-files.mjs` (items 4 and 5) and the build's own budget (item 6); the figures of items 1 to 3 are at the ten fit cases with the form on and, for the production markup's shape, with the heading block and the form taken out of the page and `.su-body` given `su-noform`.

1. **The fit table.** For each of the ten fit cases (the eight sizes with the form on and off, the two short phones with it off): the content's height against the height left, the free space or the overflow in px, and any element outside the viewport or overlapping another (AC4).
   *Measured* (the evening's layout: the laptop's two columns from 900 px wide in landscape, the single column below; `scripts/signup/measure.mjs`). Every case fits: no element outside the viewport or the insets, no two boxes intersecting, `scrollWidth` equal to the viewport's width, `.su-body` exactly the viewport's height, and the floors held (the body lines at least 15 px on a laptop and 13 on a phone, the worth labels 13 and 11). The content's height against the height left under the clearance and above the bottom padding, and the free space under the footer:

   | Viewport | Form on: content, left, free | Form off: content, left, free |
   |---|---|---|
   | 1280 x 800 | 662.4 of 683.2, 13.1 free | 607.4 of 683.2, 47.7 free |
   | 1366 x 657 | 530.2 of 537.2, 4.5 free | 512.9 of 537.2, 15.3 free |
   | 1536 x 730 | 594 of 604.2, 6.5 free | 576.9 of 604.2, 17.3 free |
   | 1920 x 970 | 829.2 of 842, 8.2 free | 784.6 of 842, 36.1 free |
   | 768 x 1024 | 892.2 of 925.1, 20.9 free | 863.2 of 925.1, 39.1 free |
   | 412 x 915 | 789.4 of 827, 24 free | 762.2 of 827, 41.1 free |
   | 390 x 844 | 724.5 of 756, 20.2 free | 698.9 of 756, 36.2 free |
   | 360 x 780 | 664.6 of 692, 17.6 free | 640.4 of 692, 32.8 free |
   | 390 x 664 | (the form off only) | 548.2 of 576, 17.9 free |
   | 375 x 667 | (the form off only) | 548.1 of 579, 19.8 free |

   The two short phones fit as well, with the form off, so no overflow is recorded. The grid's fr gaps take the leftover (Chrome sizes them against the body's `min-height`), so the picture's rhythm holds in the single column and the laptop's three gaps under the band keep their shares.
2. **The sizes it settled on**, at each case: every line's font size in px, the headline's two line widths, each jar's outer diameter and height on screen, the jar row's width and the axes' spacing, the marks' height, the form's height and width, the hairlines' length, and the gaps between the blocks.
   *Measured* (px; the field is 16 px everywhere, so iOS Safari never zooms on focus; the headline's two lines are as wide as each other, the first line's `nowrap` width setting the block):

   | Viewport | Form | Headline | Sub-line | Label | Worth | Heading | Grey | Button | Footer | Jar, w x h | Axes apart | Mark h | Form, w x h (button) | Hairlines |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
   | 1280 x 800 | on | 68.51 | 15.77 | 23.36 | 20.01 | 35.94 | 15.92 | 15 | 15.55 | 112.41 x 234.39 | 163.7 | 34.59 | 513.28 x 44.94 (234.05) | 130.19 / 130.19 |
   | 1280 x 800 | off | 68.51 | 15.77 | 23.36 | 20.01 |  |  |  | 15.55 | 112.41 x 234.39 | 163.7 | 34.59 |  |  |
   | 1366 x 657 | on | 67.53 | 15 | 19.65 | 16.84 | 30.23 | 15 | 15 | 15 | 94.56 x 197.17 | 137.7 | 29.09 | 431.77 x 44 (196.88) | 109.52 / 109.52 |
   | 1366 x 657 | off | 73.12 | 16.83 | 24.93 | 21.36 |  |  |  | 16.59 | 119.97 x 250.14 | 174.7 | 36.91 |  |  |
   | 1536 x 730 | on | 76.35 | 15 | 22.22 | 19.03 | 34.18 | 15.14 | 15 | 15 | 106.91 x 222.94 | 155.7 | 32.89 | 488.17 x 44 (222.59) | 123.83 / 123.83 |
   | 1536 x 730 | off | 82.22 | 18.93 | 28.03 | 24.02 |  |  |  | 18.66 | 134.89 x 281.28 | 196.4 | 41.5 |  |  |
   | 1920 x 970 | on | 104.06 | 21.15 | 31.32 | 26.83 | 48.18 | 21.35 | 19.25 | 20.85 | 150.72 x 314.28 | 219.5 | 46.38 | 688.2 x 60.25 (313.81) | 174.56 / 174.56 |
   | 1920 x 970 | off | 104.06 | 23.96 | 35.48 | 30.4 |  |  |  | 23.62 | 170.73 x 356.02 | 248.6 | 52.53 |  |  |
   | 768 x 1024 | on | 73.94 | 15 | 21.52 | 18.43 | 33.1 | 15 | 15 | 15 | 103.53 x 215.88 | 167.3 | 31.86 | 472.72 x 44 (215.55) | 119.91 / 119.91 |
   | 768 x 1024 | off | 73.94 | 15 | 21.52 | 18.43 |  |  |  | 15 | 103.53 x 215.88 | 167.3 | 31.86 |  |  |
   | 412 x 915 | on | 52.41 | 14.83 | 15 | 12.18 | 22.8 | 14.42 | 14.42 | 14.42 | 68.39 x 142.61 | 95 | 21.05 | 380 x 46 (173.27) | 56 / 56 |
   | 412 x 915 | off | 52.41 | 14.83 | 15 | 12.18 |  |  |  | 14.42 | 68.39 x 142.61 | 95 | 21.05 |  |  |
   | 390 x 844 | on | 49.38 | 14.04 | 15 | 11.47 | 21.48 | 13.65 | 13.65 | 13.65 | 64.44 x 134.36 | 89.5 | 19.83 | 358 x 46 (163.23) | 55.05 / 55.06 |
   | 390 x 844 | off | 49.38 | 14.04 | 15 | 11.47 |  |  |  | 13.65 | 64.44 x 134.36 | 89.5 | 19.83 |  |  |
   | 360 x 780 | on | 45.24 | 13 | 15 | 11 | 19.68 | 13 | 13 | 13 | 59.03 x 123.09 | 82 | 18.16 | 328 x 46 (149.56) | 48.88 / 48.88 |
   | 360 x 780 | off | 45.24 | 13 | 15 | 11 |  |  |  | 13 | 59.03 x 123.09 | 82 | 18.16 |  |  |
   | 390 x 664 | off | 49.38 | 14.04 | 15 | 11.47 |  |  |  | 13.65 | 64.44 x 134.36 | 89.5 | 19.83 |  |  |
   | 375 x 667 | off | 47.31 | 13.5 | 15 | 11 |  |  |  | 13.13 | 61.73 x 128.73 | 85.8 | 19 |  |  |

   The gaps at 1280 x 800 with the form on (the two columns): the band's label 29.8 px above the jars, the jars 24.8 px above the marks and the marks 22.3 px above the labels; the labels 57.4 px above the heading (14 of them the star's second line), the heading 10.4 px above the grey lines, the grey lines 21.4 px above the form, the form 48.7 px above the footer (the message line's reserved row inside it), the footer 13.1 px above the bottom padding. At 390 x 844: 11.3 above the headline, 8.5 headline to sub-line, 43.3 to the label, 43.8 to the jars, 14.2, 12.8, 55.2 to the heading, 6, 30.1, 53.3 and 20.2 under the footer. Every figure is in `measure.md` from `scripts/signup/measure.mjs` (`test-results/signup-measure/` by default).
3. **The placement** in px: the sub-line's indent against 0.0255 of the column, the centred blocks' offsets from the column's centre, each mark's and label's offset from its jar's axis (AC5).
   *Measured.* The sub-line's text starts right of the headline's edge by 0.0255 of its column at every case, within 0.01 px: 1280 x 800: 12.14 px (12.14 wanted), 1280 x 800 (form off): 12.14 px (12.14 wanted), 1366 x 657: 12.96 px (12.96 wanted), 1536 x 730: 14.57 px (14.57 wanted), 1920 x 970: 18.44 px (18.44 wanted), 768 x 1024: 17.81 px (17.8 wanted), 412 x 915: 9.69 px (9.69 wanted), 390 x 844: 9.13 px (9.13 wanted), 360 x 780: 8.36 px (8.36 wanted), 390 x 664 (form off): 9.13 px (9.13 wanted), 375 x 667 (form off): 8.75 px (8.75 wanted). The label and the jar row (the mean of the four axes) are centred on their column and the heading, the grey lines, the form and the footer on the frame, within 0.02 px at every case (the laptop's two columns: the jar column for the first two, the frame for the rest; the single column: all on the column); each mark's centre is on its jar's axis within 0.01 px and each label's on its mark's within 0.01 px. Each jar's outer diameter is 0.1800 of the column on the phones and 0.1483 on the portrait tablet (the picture's 151.1 of 1019); on the laptop's two columns the jar is 0.2361 of the text column's width, since its size follows the jar column (D2). The axes' spacing: 163.7 px at 1280 x 800, 137.7 px at 1366 x 657, 155.7 px at 1536 x 730, 219.5 px at 1920 x 970, 167.3 px at 768 x 1024, 95 px at 412 x 915, 89.5 px at 390 x 844, 82 px at 360 x 780, 89.5 px at 390 x 664, 85.8 px at 375 x 667.
4. **`jars.json` as delivered**: the jar's box in the frame, the sixteen tops, any field beyond C2's (the renders add a `seam` per state, below which every later state is pixel-identical in the masters), the share of the inner height a quarter fills (the picture's 0.230 to 0.243) and the mixed lot's pink-to-purple ratio; and that the provisional files are gone (`"provisional"` absent).
   *Measured.* The frame 400 x 480; the jar's box x 0.25 to 0.75 (the outer diameter 200 px, half the width) and y 0.0437 to 0.9125 (the rim's far edge at 21 px, the base's bottom at 438 px); `notes.axisFloor` 0.87. Beyond C2: `seam` per state and a `notes` object (the renders' own words on `top`, `seam`, the floor and the order); no `provisional`. The tops, ordered by level: `0` 1 (the lowest row the first press changes, the foot's reflection, as the notes say; not the inner floor C2 names); the quarters `f` 0.5729 and `y` 0.5958; the halves `i` 0.4167, `fy` and `yf` 0.4229; the three quarters `fi` 0.1938, `if` 0.2437, `yi` 0.2458, `iy` 0.2479; the six full states 0.0396. Every higher level stands higher, but within a level the tops differ by up to 0.054 (`fi` against the other three; `f` against `y` by 0.023), over AC6's 0.01: `top` is the fill's topmost grain, and a stray grain stands higher in some orders, so the figure is the grain's, not the level's; the reveal (D6) runs from the old state's seam to the new one's top, so a stray grain moves where a reveal starts or ends by a few px and nothing else. The seams, the levels' own rows (0.7063, 0.5208, 0.3333, 0.0396), are equal within a level. A quarter fills 0.235 of the inner height by the renders' README (the picture's 0.230 to 0.243); in the frame `f`'s top is 0.297 of the height above the axis floor, `y`'s 0.274 and `i`'s 0.453. The mixed lot is about 2 pink to 3 purple by grain count, even through the layer (the README), which the files cannot measure.
5. **The jar images**: each file's bytes, the caps the budget sets for them, and the largest difference between a state and its prefix below the prefix's top, per format, in the decoded pixels (AC6).
   *Measured.* 64 files for the 64 names, 1,120.8 KB together, every 2x file 400 x 480 and every 1x 200 x 240 with an alpha channel. The largest at 2x: AVIF 23.0 KB (`jar-fyi-2x.avif`, 23,528 B) of the budget's 45 KB cap, WebP 38.4 KB (`jar-fyi-2x.webp`, 39,294 B) of 60 KB; the empty jar 3.6 and 6.7 KB at 1x; every file's bytes are in the build log's `signup jar` rows. Each state against its prefix in the decoded 2x pixels: below the prefix's seam the files that ship differ by at most 52 of 255 in AVIF and 27 in WebP on single channels (the lossy encoders' own error on the pellets' texture; 5 to 17 percent of the channels below the seam differ by more than 2), and below the prefix's top by up to 255, because the band from the seam up to the top is where the next layer's grains lie over the prefix's surface by the compose's design (the README: a reveal that starts at the seam never jumps). The masters' byte-identity below the seam is the compose script's own check at render time; the masters (the carry folder's `section-5-jar-work/`) are not on this machine. What the swap shows on screen is item 10's pop figure.
6. **The budget**: section 5's page script (gzip, found by `skreed:signup-filled`), the first view's line for section 5's markup and `signup.css`, total JS once the island's jar chunk has gone, critical JS (AC13).
   *Measured* (`npm run build`, 2026-11-03; the morning of 2026-11-02 read 6.2 KB, 4.6 KB and 241.7 KB, the evening 6.4, 4.9 and 241.9): section 5's page script 6.7 KB gzip (`/_astro/signup.*.js`, 6,827 B, with the complement clip and the loop's trigger at the page's end) of its 7 KB line; the first view, section 5's markup and `signup.css`, 4.9 KB gzip (the markup 5,971 B, the stylesheet about 12,146 B minified) of 5.5 KB; total JS with sections 4 and 5 and `scroll.ts` 247.0 KB of 250 (the section index on the page since the merge of the default); critical JS 19.2 KB, nothing of section 5 in it; the island carries no jar chunk; the frame and the jar's box no longer ride the chunk (their reads marked pure); every enforced line holds, and section 4's script reads 30.2 KB against Sam's 30.0 KB figure (the budget's soft line, 29.9 KB before the director heard the gesture down). The two section lines were set from the measure of 2026-11-02, as section 9 foresaw, and re-set on 2026-11-03 (section 18): the page script's to 6.5 KB (the build of the morning measured 4.7 KB with the sixteen states' picture URLs in the markup; the table moved into the script's chunk, `src/scripts/signup/jar-srcs.ts`, shared with the page, so that the first view never carries it) and the first view's to 5 KB (5.5 KB measured with the table in the markup, over the old page's 4 KB). The fonts and the jar pictures are never in the first view: the section is `hidden` while the quiz gate holds it, so its text is not laid out and no font is fetched, and its pictures are lazy; the script comes within a screen of the section.
7. **The ground and the falloff**: the pixels under the section on the 3D path and the poster tier, the cut's far side mid-cut, the falloff's band and its colours at both ends at the jars' mid-height (AC3, AC11).
   *Measured* (390 x 844 and 1280 x 800, from screenshots of the dev server's page; the island's own bytes through `__skreedGround.sample` on the 3D path). Ten points away from the jar row (the gutters beside the headline, the sub-line, the label and the footer, and along the bottom edge) read (242, 234, 225) exactly on both tiers at both sizes, and the island's four corner samples read (242, 234, 225, 255) with `data-ground="island"` set on the 3D path and absent on the poster tier. The falloff at the jars' mid-height, in the single column at 390 x 844: the left margin (239, 232, 223), #EFE8DF exactly; before the first jar (238, 231, 222), between the jars (238, 230, 222), (237, 230, 219) and (236, 228, 217), after the last (231, 224, 213); the right margin (231, 224, 213), #E7E0D5 exactly. On the laptop's two columns at 1280 x 800 the band runs from the jar column's left edge, where it reads the ground (242, 234, 225) and (242, 234, 225) before the first jar, through (239, 231, 223), (238, 230, 220) and (237, 229, 218) between the jars and (232, 225, 214) after the last, to the screen's right edge (231, 224, 213), #E7E0D5. Across its top and bottom fades and, on the two columns, across its left edge above the jars, no two neighbouring pixels differ by more than 1 level on any channel, on either tier at either size. The band lies behind the jar band alone (under the label, its foot lifted off the marks and the labels), so it meets no text box; the laptop's text column stands beside it on the plain ground. The cut's far side mid-cut is not re-read here: `tests/e2e/room.spec.ts`'s fourth-wipe case reads it (item 14), and the island's ground texel is the same bytes the corner samples returned.
8. **The island at rest**: the frames it draws per second under section 5 at rest (0 expected).
   *Measured* (the 3D path, `__skreedGround.state()` 1.5 s apart at 390 x 844 and 1280 x 800): `draws` 1 before and 1 after, `held` 125 then 216 at 390 x 844 and 126 then 216 at 1280 x 800 (the loop's frames held, none drawn), mode `whole`, `data-ground="island"` set, `ready` true, `inView` true, the exit and the rest both at the section's top (26,400 px at 1280 x 800; 27,852 at 390 x 844); so 0 draws per second under the section at rest.
9. **Contrast as rendered**: each line's ratio read from the pixels at 390 x 844 and 1280 x 800, against section 7's computed table.
   *Measured* (device pixel ratio 2, the darkest pixel inside each line's box against the ground, the same at both sizes): the headline 17.63:1 and "GOT YOUR COLOURS?" 17.63:1 (17.63 computed); the sub-line's box 9.54:1, its bold run's ink, the regular run's own hex computing to 6.27:1; "EVERY FOLLOW FILLS THE JAR" 13.32:1 (13.32); the worth labels 8.08:1 (8.08); the grey lines 4.09:1 (4.09, below AA as the picture); the field's left half 2.28:1, which is the outline's ink (2.28 computed), the placeholder's own hex computing to 1.95:1 (below AA as the picture); the footer 1.97:1 (1.97, below AA as the picture); the button's label 21.0:1 on its black. The rendered figures equal the computed table to two decimals, since every line is a flat colour on the flat ground with no falloff behind it.
10. **The fill**: the measured delay after a press, the reveal's length for a quarter and a half, the queue's order, the hidden-page case and reduced motion (AC7).
   *Measured* (390 x 844 on the poster tier, the dev server, the installed Chrome). The reveal starts 502 to 509 ms after the press (D6's 500) and its animation runs 900 ms with `ease-out` for a quarter (the `skreed:signup-filled` event 930 to 1,000 ms after the reveal's start, the layer swap and the promise's hops included; 1,432 ms from the press); the hooks' state and the jar's text alternative change with the event. Two presses at once (Instagram, then Facebook) fill in press order: `i` at 1,906 ms and `if` at 2,840 ms after the presses, the second reveal starting when the first has fired its event. A repeat press adds nothing (no event, the state unchanged). Under reduced motion the event fires 1 ms after the press with no animation. The pop at a reveal's first frame (the animation held at its start, the screenshot differenced against the frame before the press, inside jar 4's box at device pixel ratio 2): at the first press nothing (the reveal starts at the empty jar's own seam, the frame's bottom); at the second press, from `f` to `fy`, the band from `f`'s top down to its seam is unchanged (0 of 255, 0 pixels), and below the seam the two files' lossy encoding differs by at most 35 of 255 on a channel over 866 of about 34,700 device pixels, which is the encoders' noise on the pellets' texture (item 5) and reads as nothing at a jar's size. The build of the morning, which revealed from the old state's top, showed that band at once: 252 of 255 over 5,532 pixels, the red grains appearing over the blue surface in one frame; the seam fixed it (D6). The hidden-page case (300 ms after the page is visible again) is `tests/e2e/signup.spec.ts`'s row (item 14). Where the browser's animation clock does not run, the reveal settles by its duration and a frame (`Promise.race` in `signup.ts`), so the event always comes; headless Chromium under the e2e harness's SwiftShader flags ticks about twice a second on this Mac and never reported `finished` before that.
11. **`data-ready`**: the time from the unlock to the attribute at 390 x 844 and 1280 x 800, and which condition set it (the decodes, or the 4 s).
   *Measured* (the section opened by `?room=open` at parse, so the time is from the page script's mount, within a screen of the section): 4 ms at 390 x 844 and 26 ms at 1280 x 800 (the last run; earlier runs read 11 and 11, then 7 and 4), by the decodes (the four faces and the four pictures were in when the attribute came); the 4 s timer never ran out.
12. **As built, for the record**: the links' accessible names; jar 4's text alternative; the live region's words for each platform (the mixed lot's wording); the field's accessible name and its font size on a phone (16 px or more keeps iOS Safari from zooming on focus); the heading levels; whether the capitals are in the DOM or set by `text-transform`; the button's hover and press (colour, scale or position, never opacity: rule 14); the request's fields (no consent expected); the success state's height (whether the footer moves); whether the section's body still goes under a seam's cloud (the old `__skreedSignupFrame` bridge); the no-JavaScript path (the form, the noscript line).
   *Measured.* The links' names: "Follow Skreed on Facebook, 5% off (opens in a new tab)", "Subscribe to Skreed on YouTube, 5% off (opens in a new tab)", "Follow Skreed on Instagram, 10% off (opens in a new tab)"; the star's column a `group` named "Your jar, up to 20% off" with nothing focusable in it. Jar 4 is `role="img"` named "Your jar, empty.", then "Your jar, three quarters full, from the bottom: pink and purple, then blue." after Instagram and Facebook. The live region (polite, visually hidden) says "Blue added to your jar.", "Red added to your jar.", "Pink and purple added to your jar.", and "... Your jar is full." on the third. The field's name is its visually hidden label, "Your email address", at 16 px on a phone, described by the message line. The headings: the headline an `h2`, "GOT YOUR COLOURS?" an `h3`. The capitals are in the DOM (`text-transform: none`), as the picture prints them. The button's hover darkens its ground to #3F3935 and its press scales it to 0.98, both over `--dur-press` on `--ease-standard`; nothing changes opacity. The tab order runs the three links, the field, the button. The request: `POST /api/signup`, `application/json`, no cookie, the body `{"email":"...","follows":"facebook","source":"signup"}` (the follows in press order, comma-joined); no consent field. Success: the done line "Done. Your colours are saved to <address>." takes focus and the footer does not move (0 px). The body still goes under a seam's cloud through `window.__skreedSignupFrame`. The logotype's tone: on the 3D path the island turns it Urban Slate over the cream ground (`hero/loop.ts`, the ground's tone), and since the measure the page script does the same on the poster tier while the section sits under the logotype's band (one rect read per frame while the page scrolls), with Back to top following it; without JavaScript nothing can turn it, so the Pearl Whisper logotype stands on the cream there (recorded, not fixed). Without JavaScript the section is displayed (`html:not(.js)` lifts the lock), the three links work, the form renders with its noscript line "The form needs JavaScript.".
13. **The fonts' licence notice**: whether each file carries its SIL Open Font License notice in its own metadata; if not, the licence text joins the repository beside the files.
   *Measured* (fontTools, the `name` table): each file carries its copyright line (Inter: Copyright 2016 The Inter Project Authors, version 4.001; Jost: Copyright 2020 The Jost Project Authors, version 3.710) and the licence's URL (Inter `https://openfontlicense.org`, Jost `http://scripts.sil.org/OFL`), but neither carries the licence's text (name 13 is absent in both, as Google Fonts' subsets ship), and the axes are as D3 says (Inter opsz 14 to 32 and wght 100 to 900, Jost wght 100 to 900). So the licence text joins the repository: `docs/brand/fonts/inter-OFL.txt` (the file the About page's branch adds at the same path, byte for byte, so the two branches never conflict) and `docs/brand/fonts/jost-OFL.txt` (the OFL.txt of Google Fonts' `ofl/jost`, whose body is the same OFL 1.1 text under Jost's copyright line; no Reserved Font Name is declared in either).
14. **The test runs**: the unit and e2e suites of section 5, the room's exit and wrap cases with G4, the exit guard's unit test and the quiz gate's cases (AC14).
   *Measured* (2026-11-02, this Mac). Unit: 235 of 235 (`npm run test:unit`, the exit guard's 18 and the quiz gate's rows among them); the family pages' 61 of 61; `astro check` 0 errors and 0 warnings; `npm run build` with every enforced line holding (item 6). The browser suites on the installed Chrome on the machine's GPU (`SKREED_GL=gpu` in `tests/harness/browser.ts`, added today) against a hooks build served by wrangler: `tests/e2e/signup.spec.ts` 4 of 4 (the fit at both sizes, the three columns and the star's, the fill in press order with its events, a repeat press, the visit's memory across a reload, the gate on the page's visibility, the queue, reduced motion, `data-ready`, the form's states against a stub), run again after the laptop's two columns with the fit check made pairwise; `tests/e2e/room.spec.ts` 6 of 7, the exit seam, the wrap onto section 5 and the way back among the passes, and the one failure, the five scenes by five steps (a double step, scene 4 for 3), failing the same way on the branch's own build at `3e4673a` served from a scratch worktree, so it predates this work and belongs to the section the hall's removal (session 2) replaces. Under the harness's default SwiftShader flags every section 5 case and two room cases fail on this Mac because the page's animation clock ticks about twice a second there (item 10): the machine, not the page.

## 17. The second day (2026-11-02, after the hand-off)

Resumed on Sam's Mac in a worktree on this branch after the move between accounts (`docs/HANDOFF-2026-11-02.md`; the session file `docs/handoff/2026-11-02/3-section-5-four-jars.md`, both on the default branch). What stood on the branch at `3e4673a`: all four builders' parts (the page, the island's flat ground, the 64 renders with `jars.json`, the records), 235 unit tests passing, `astro check` clean, and one build failure, the first view's line for section 5 (5.5 KB against 4). What changed since, before Sam saw the page:

- The sixteen states' picture URLs left the markup for `src/scripts/signup/jar-srcs.ts`, shared by `Signup.astro` and the page script, so the first view never carries them (the markup 6,035 B; the chunk 6.2 KB gzip and the first view 4.6 KB that morning, 6.4 and 4.9 KB by the day's end; section 18 for 2026-11-03). The two section lines in `scripts/hero/budget.mjs` were set from the measure (6.5 and 5 KB), as section 9 foresaw; `npm run build` passes with every enforced line holding (section 16, item 6).
- The reveal starts at the old state's `seam` from `jars.json`, its top where there is none (D6, section 8): the measure's first run showed the second fill popping at its first frame (252 levels over 5,500 device pixels inside jar 4), because the band between a state's seam and its top holds the next layer's grains over its surface, which a reveal from the top shows at once (section 16, item 10).
- The logotype and Back to top turn Urban Slate over the cream ground on the poster tier as they do on the 3D path: the page script sets the logotype's tone while the section sits under its band (section 16, item 12). The poster frames of the morning showed both in Pearl Whisper on the cream, all but invisible.
- The sub-line's indent is 0.0255 of the column on phones as well (AC5); it was 26 jar units there, about 0.031 of the column.
- The OFL texts beside the fonts: `docs/brand/fonts/inter-OFL.txt` (the About page branch's file at the same path, byte for byte) and `docs/brand/fonts/jost-OFL.txt` (section 16, item 13).
- The measuring pass as scripts: `scripts/signup/measure.mjs` (the browser's part, items 1 to 3 and 7 to 12, `--only` to rerun parts) and `scripts/signup/measure-files.mjs` (the manifest and the pictures, items 4 and 5).
- The laptop laid out again as two columns across the whole width (D2's landscape bullet), after Sam saw the first frames: "For the desktop, everything is compressed to the center. Make sure it's layouted, it's relayouted to fit properly across the entire screen, not just in the center like a mobile screen. There's a lot of free space." The fit, the sizes, the placement and the band were measured again (section 16, items 1 to 3 and 7); the first view's line reads 4.9 KB of its 5.
- `.claude/launch.json` gained `astro-dev-mac` (`npm run dev` on 127.0.0.1:4321), the app's browser pane on a Mac; the two Windows entries stay.

Still open: Sam's verdict on localhost; session 2 (the hall's removal, the hand-off's second session) had not landed when this was written, so this branch is not yet fixed onto it (its entry seam assumes the hall's scroll map); the picture and the Blender intermediates (the carry folder's `sam-sources/references/section-5-four-jars-picture.webp` and `section-5-jar-work/`) are not on this Mac, so the jars were checked against section 3's figures and the renders' README, not against the picture itself; the default branch (the navbar, the quiz's phone layout, the hand-off docs) is not merged in yet.

## 18. The end of the page (2026-11-03)

Sam, of the page past section 5 on localhost (2026-11-03): "so after scrolling to section 5 it has a large free space for no reasin, remove the free space, and have the snap scroll effet which every other section has", and "wrap this up real quick, just a minor fix". The free space was the empty screen under the body (`.su-loopend`, 100svh), the exit seam's scroll room since 2026-10-26 (section-5.md 2): the exit guard only sees a crossing of the rest where the page can move past it, and wherever the guard is off (a seam's lock, a refusal) or on the poster tier before its observer fired, the page could rest in that screen with the cloud over its top. Changed:

- Nothing follows the body. The document ends at section 5's rest, so the glue's fourth span settles onto it and the page cannot scroll past it: D2's one screen is the page's end on both tiers (`Signup.astro`, `signup.css`).
- The exit seam's trigger is a gesture down at the armed rest (`exit-guard.ts`: `down` and `maxY` in the frame, the rule after the hold's): a wheel notch down, never Ctrl+wheel; one finger moved up 12 px or more; ArrowDown, PageDown, End or Space without Shift (`director.ts` hears them with the guard's inputs and hands one per frame). The rest that arms it is as before (300 ms with no input and no movement), and the crossing rule stays for a page with room below the rest. The seam itself is unchanged: the cloud over the frame with the page held, the jump to scroll 0, the cover-out over the hero.
- The poster tier's loop end runs on the same gesture at the page's end after the same rest, with the seams' refusals (a typing control focused, the on-screen keyboard up, the page zoomed), in `signup.ts`; the fade through `--night` and the jump to the top are as before. Without JavaScript the page simply ends.
- The tests: the guard's unit test drives the gesture at the rest, before it, with room below it and above it; the room suite's exit cases send a wheel notch at the armed rest in place of the scroll across `exitY`; the signup unit test pins the markup and the trigger.
- The two section lines of section 9 were re-set from the build of 2026-11-03: the page script's to 7 KB (6.4 KB measured against 6.5 before this change, 6.7 KB with the loop's trigger) and the first view's to 5.5 KB (5.0 KB measured after the morning's fixes, 45 B under the 5 KB line; 4.9 KB without the empty screen). The director's gesture reading adds about 0.2 KB to section 4's script, 30.2 KB against Sam's 30.0 KB figure, the budget's soft line (29.9 KB before), pending him with that line's other readings.

Against section-5.md 2's "one empty screen" (superseded by this section) and nothing else: E-S4-scroll's wording holds (the end mirrors the top, a gesture, never a hold), E-S4-snap's glue is unchanged, and the exit guard (G4) keeps its rest.

The same night, after the gesture's build was on localhost: "remove the loop, i dont want the sign up page to scroll back to section 1, just a minor chagne, dont take an eternity". So the loop from section 5's end is gone on both tiers: the director no longer acts on the guard's verdict (the guard still arms at the rest, read by the hooks' `exitArmed`, and would hold the page past it, which no longer has room), `startExit` and the gesture reading left `director.ts` and `exit-guard.ts` is as it was before this day; the poster tier's trigger, its fade (`#suFade`, `.su-fade`) and the `room_loop` tracking left `signup.ts`, the markup and the stylesheet; the room suite's two exit steps now assert that a notch down at the armed rest runs nothing and the page stays at the section. The page ends at section 5. The wrap from the top (the hero scrolled up landing on section 5, section-4-flux.md) stays as section 4 built it, his to keep or drop. Against section-5.md 2 ("the loop from this section's end") and CLAUDE.md's section 5 bullet, amended.
