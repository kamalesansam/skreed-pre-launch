# Section 4: the pictures version and Questrial

Sam, 2026-11-04, with his "Skreed Pre-Launch" design (a PDF) and a folder of five pictures:

> one more edit for the product pages, i want another version of the product pages, where we will be replacing the backround, everything else looks the same, oh and change the font over there as well, use any font from this pdf, and these are the new backrounds for each product, they're 2d only, so u dont have that much work, the only agenda for u is to replace the current backrounds for all the backround with the given backround, and make sure u keep the old version safely because if i dont like this i might revert back to the older version itself, but make sure u change the font in the older version as well, i mean the current version

The "product pages" are section 4's five scenes (the section index calls them Products); his five pictures are named for their five products.

## 1. The font, in both versions

Every line of section 4 is set in Questrial, in capitals at the same sizes as before. Questrial is the face his design sets its body copy and its small capitals labels in ("MONOCHROME", "PASTEL PAIRINGS"), and the one face in the PDF under an open licence that was already on the build machine (his label renderer's copy, googlefonts/questrial v2.000, SIL OFL 1.1). The PDF's other faces: Neue Montreal and Monument Extended (Pangram Pangram, paid for commercial use), Nourd, Westonia and Helvetica (paid), Open Sauce One, Rubik Glitch and Inter (open, not on the machine).

- `public/fonts/questrial-400-latin.woff2`, 12.2 KB, cut to Latin by `scripts/fonts/build-questrial.py` (the record in `scripts/fonts/manifest-questrial.txt`, the licence in `docs/brand/fonts/questrial-OFL.txt`), declared in `src/styles/fonts.css` with a metric-matched "Questrial Fallback".
- `src/styles/room.css`: `--rm-font: "Questrial", "Questrial Fallback", sans-serif;` at weight 400.
- Questrial is proportional, so `walk.ts` gives every line the decode's proportional mode (`data-dc="prop"`): the rolled glyph is drawn over the face's own, so no line changes width while it decodes, as on the quiz result.
- Exception E-S4-font amended in CLAUDE.md.

## 2. The two versions of the backgrounds

| Version | What the planes draw | Where it lives |
|---|---|---|
| `pictures` (the default) | his five still pictures, one per product, no video | `src/assets/room/pictures/`, git-ignored |
| `loops` (the old version) | the five 5 s looping videos, their first frames as the stills | `src/assets/room/flux/`, committed |

His pictures, by scene: cove (the phone case, Lilac) "for Lilac phonecase", the sunlit beige room; grove (the AirPods case, Sage) "For Airpod case", the pink studio; ember (the MagSafe wallet, Desert) "For Magsafe wallet", the grey studio; palace (the Lenskin, Ballerina) "for lenskin", the lilac studio; dawn (the AirPods Max case, Pastel) "For airpod max", the green room.

### The products' shades over the pictures

Sam, the same day: "use a color from the color ffamily that we have for each of the cases of the 3d models which will go good with the backround". In the pictures version each product wears a catalog shade chosen for its picture, and the key light takes its tint from the picture's own light (`PICTURE_ROWS` in `src/config/room.ts`; the loops version keeps its shades and tints):

| Scene | Picture | Product | Shade (was) | Key light |
|---|---|---|---|---|
| 1 cove | the sunlit beige room | phone case, matte | Terracotta, roaring red, `roaring-red-18` (Lilac) | #ffe2c4 |
| 2 grove | the pink studio | AirPods case, gloss | Mulberry, vivid violet, `vivid-violet-14` (Sage) | #ffd6d8 |
| 3 ember | the blue-grey studio | MagSafe wallet, matte | Cinnamon, basic brown, `basic-brown-07` (Desert) | #dfe9f2 |
| 4 palace | the lilac studio | Lenskin, metallic | Lavender, vivid violet, `vivid-violet-06` (Ballerina) | #e4dcff |
| 5 dawn | the sage green room | AirPods Max case, matte | Blush, playful pink, `playful-pink-03` (Pastel) | #eef5e0 |

Amethyst was tried on the Lenskin first and read electric under the metallic finish, so Lavender, its softer neighbour, took its place. The shade lines under each product name follow the shade.

### The AirPods inside the AirPods case

Sam: "idk why the airpods inside the airpods case dissappeared lol". They are not in the model the site ships: `scripts/room/products.py` cut Apple's charging case and earbuds out on 2026-10-16 under the rule "the case only, never the device", so `airpods.6fe7a22f.glb` holds only the lid, the shell and the Skreed S. E-S4-device (2026-10-26) lets the device back in, and `scripts/room/products-full.py` keeps it, but it needs the AirPods case FBX of 2026-10-16, which is not on this Mac (searched 2026-11-04: Downloads holds only order CSVs for AirPods; section-4-flux.md item 16). With the file in Downloads, `products-full.py airpods`, `pack.mjs` and `products-bin.mjs` bring the earbuds back in both versions.

Everything else is as it was: the carousel's step, the arc, the pinch, the lights going down and up, the product's turn and its cursor tilt, the bottom shade, the lines, the words and the glue. In the pictures version the director makes no video elements, so no loop is fetched.

### Switching

- **Go back to the old version:** set `ROOM_BACKDROP_DEFAULT` in `src/config/room.ts` to `'loops'` (one line), rebuild, deploy.
- **Compare on any build:** add `?scenes=loops` or `?scenes=pictures` to the address.
- **The old version whole, as it stood:** the branch `archive/section-4-loops` is the site with the new font and the loops only, before the pictures were added.
- A build without the picture files draws the loops on its own.

### The files

His uploads never go into the public repository (the standing rule), so the encoded pictures are made on each machine that builds the site:

```
node scripts/room/prepare-pictures.mjs "<the unzipped backgrounds folder>"
```

It cover-crops each 3840 x 2160 PNG about its centre to the wide class, 1920 x 1000 (the loops' aspect, so the planes' fit is unchanged), and the portrait class, 1080 x 1920, in AVIF and WebP at high quality (smooth gradients band at low quality): 26 to 85 KB a file, 0.86 MB for all twenty. Sam's folder sits at `/Users/apple/Downloads/backgrounds.zip` on the Mac.

### The logotype's tone

The pictures are light where the loops were dark at the top, so the logotype and the section index turn Urban Slate over four of them. `node scripts/room/scene-tone.mjs --pictures` (2026-11-04): Urban Slate over cove, grove, ember and palace (3.11 to 7.73:1 under every box, but ember's worst is 2.93:1 at 1280 x 800, flagged, where Pearl reads 2.15:1), Pearl Whisper over the green room (5.08 to 5.72:1). The picks are `PICTURE_ROWS` in `src/config/room.ts`, held by `tests/unit/room.test.ts`. Each picture has its own alt text there too.

## 3. Contrast of the lines (still for Sam)

Pearl Whisper lines over the pictures with the bottom shade as it is (`scripts/room/contrast.mjs`, 2026-11-04, the dev hooks build, two frames): the lowest median per scene 3.82 to 6.34:1, and 12 of the 62 text boxes have a median under AA's 4.5:1 (the lowest the ember scene's shade line at 390 x 844, 3.82:1; the grove scene's two words at 4.1 to 4.4:1). The loops read 6.0:1 or better at the median. This falls under E-S4-contrast, already pending; its default, the bottom shade darkened until every median reads 4.5:1, would change how the lower half of the pictures looks, so it is left as it is until he says.

## 4. Still for Sam

1. Whether he likes the pictures version and its five shades, or wants the loops back (one line).
2. The contrast above: darken the bottom shade, or keep the look.
3. Whether the pictures may be committed (are they his to publish in a public repository?). Until he says, they stay git-ignored and each building machine runs the prepare script.
4. The AirPods case FBX of 2026-10-16, so the earbuds come back.
