# The four lands' pictures, made (evidence for docs/specs/section-4-world.md)

Made 2026-10-20 and 2026-10-21 by `scripts/room/lands.py` (the driver) and `scripts/room/render-products.py` (the accessories in Blender), on the branch `s4/lands-pipeline`. Sam reviewed the first sheet and asked for fixes (section 8), approved the second, `sheet-v2.jpg`, with the seams to be blended and the Lenskin in option 3, Sage (section 9), and on 2026-10-21 approved `sheet-final.jpg`, the encoded files: "this works, build it" (section 10). The masters are encoded into `src/assets/room/lands/` by `scripts/room/encode-lands.mjs`; `ROOM_LANDS` is the integration's to write (spec section 3, "Approval"; CHECKLIST F2). The masters are gitignored in `assets-src/room/lands/`, with their `SHA256SUMS` committed beside the folder's `.gitignore`.

**Credits: 45.0 of the 100 this builder was given** (the account read 1,800 before the first call and 1,755 after the last, so no other call was charged to it meanwhile). Every call is in section 4 with its job id.

**The second round** (Sam's review of the first sheet, 2026-10-20) is section 8: **28.0 of its 40 credits** (the account read 1,755 before and 1,727 after). **The third** (his approval of sheet-v2, the same day) is section 9, and made no call: 73.0 credits in all. **The fourth** (his approval of sheet-final, 2026-10-21) is section 10: four depth calls, **6.0 of its 8 credits**, 79.0 in all. Sections 1 to 7 describe the first round; where a later section differs, the later holds. In `src/data/room-lands.json` every land records three reviews: round 1 reviewed on 2026-10-20 with fixes asked, sheet-v2 approved on 2026-10-20 with the seams to be blended (land 3 adds Lenskin option 3, Sage), and sheet-final approved on 2026-10-21, "this works, build it".

## 1. The result

| # | Land | Base | Place | Square | Portrait 1406 x 2500 | Wide 4000 x 2500 (16:10) |
|---|---|---|---|---|---|---|
| 1 | `case` | `yellow.png` | the Mall, leaning on an elm, afternoon sun from the right | bg attempt 2 | x 657 to 2063 | outpaint, square at x 972 of the 16:9 |
| 2 | `wallet` | `blue.png` | Bethesda Terrace's arcade, open shade | bg attempt 2 | x 587 to 1993 | outpaint |
| 3 | `lenskin` | `green.png` | Sheep Meadow, the skyline beyond, overcast | bg attempt 1 | x 250 to 1656 | outpaint |
| 4 | `airpods` | `violet.png` | Bow Bridge over the Lake, open shade | hand attempt 2, bg attempt 1 | x 450 to 1856 | outpaint |

Files, per land, in the run folder's `out/` and copied to `assets-src/room/lands/`: `land-<id>-square.png` (2500 x 2500), `land-<id>-portrait.png`, `land-<id>-wide.png`, `land-<id>-portrait-depth.png` (720 x 1280, 8-bit grey, near is light) and `land-<id>-wide-depth.png` (1920 x 1200). The contact sheet is `out/sheet.jpg` in the run folder (the four lands, square, portrait and wide in a row each). The ids are `ROOM_PRODUCTS`' (case, wallet, lenskin, airpods), which the spec's file names `land-<id>-portrait.*` take.

## 2. The inputs

**Sam's listing photos**, copied out of `~/Downloads/amazon listing/image listing/lifestyle/17 promax/` and read only as pixels (untrusted files; every Python run with `-I`). The copies match the originals byte for byte (`cmp`). Each is 2500 x 2500, sRGB, no ICC profile, no EXIF.

| File | SHA-256 |
|---|---|
| `yellow.png` | `d7d97bc48f75909cc2342069034a1f104c401e8ffe2c8153b17b1155e14155da` |
| `blue.png` | `ab364ca41ffa112d6a259a009d9dfdd9496fb090ce557f333f43962bd4f034ea` |
| `green.png` | `4216993532cbb707fc49a5eb514ef322d5c6fb92185ee2e58ccd704a299e33b0` |
| `violet.png` | `25292983c91225e945e17c5395eac1eaa0759a560e5647c2bf3fafa00aa08395` |

**The models.** The wallet and the Lenskin are the shipped GLBs, read where the site serves them, `public/models/wallet.a15a8ebb.glb` and `lenskin.3831acd1.glb` (Blender 5.2.2's glTF importer decodes their meshopt and quantisation). Their move to `scripts/room/models/` was reverted on this branch: `universe.ts` still loads them by their public `url`, so they move in the integration that deletes it. Land 4 needs Apple's case and earbuds, which `products.py` dropped, so it renders Sam's source FBX instead: `air pods/source/airpods.fbx` from `~/Downloads/air pods.zip` (2026-10-16, SHA-256 `f1c264cddd96fb985f93573dc50a306aa7c29798a676246346b1beb2a5f96dbf`), extracted alone into the run folder. That variant is a reference only and never becomes a model the site loads (E-S4-device).

**The shades**, by id from `docs/data/shades-240.json`, converted to linear in the script: Desert `basic-brown-04` #c6a884 (matte), Crimson `roaring-red-07` #d20000 (metallic matte), Sage `go-green-09` #96a880 (gloss). The finishes are the universe's (`universe.ts`): matte roughness 0.62 with the Specular IOR Level at 0.1 (three's specularIntensity 0.2), gloss the same under a clearcoat at roughness 0.03, metallic at roughness 0.38; the logo at 0.8468 of the shade, the trim the fixed (0.073, 0.077, 0.077).

## 3. The steps

**3.1 Render (Blender 5.2.2, `-b --factory-startup`, Cycles on the Metal GPU, Standard view, 128 samples, OpenImageDenoise, transparent film).** One spec per land, written by `lands.py`, in the photo's own camera axes. The photos carry no lens data, so every pose assumes a 3500 px focal length (a 50 mm lens across 2500 px); the planes are near frontal, so the guess moves little. Each render writes three passes: the beauty, a neutral pass (every surface a white Lambertian under the same light, for the gain and the colour check) and an emission mask (body, logo, other). A Cycles shadow catcher under each product puts its contact shadow in the film's alpha. Renders run three or four stops down (`exposure`) so neither pass clips in the 16-bit PNG; the composite's gain undoes it. The first wallet render at 0 stops clipped to a pale yellow, which is how that was found. A shared GPU ran out of memory once (the AirPods neutral pass): the script now renders in 512 px tiles and retries a failed frame on the CPU.
- **Wallet (land 2).** The case's back is posed by OpenCV's planar PnP (IPPE) from its four edge-line corners, (1043, 542), (1536, 542), (1497, 1552), (1062, 1552), against a case 82 mm wide (a 78 mm 17 Pro Max in a Tough case) and 178 mm tall: the photographed phone is drawn longer than a real one's 167 mm, so its own proportion is used. Reprojection error 10.2 to 10.7 px per corner; the case's normal comes out (-0.095, -0.138, 0.986), 615 mm from the camera. The wallet sits centred across, its back on the case, its centre 27.1 mm below the case's centre (halfway between the camera window's lower edge at y 850 and the case's bottom). The wallet's 93.8 mm height is products.py's assumption, still open with Sam. Light: a 0.6 m disc at the picture's left and above (the lit hand reads 242 against the far one's 203), a 2 m fill at the right, world 0.25.
- **Lenskin (land 3).** The plate is rendered face-on (orthographic, 20 px per mm), seen from outside with the phone upright, its `+y` face outward, so its holes fall where the 17 Pro Max's lenses are seen from behind. It is then placed by the homography from its six holes (mm) to the photo's lenses, flash, microphone and LiDAR (px), fitted by least squares: residual 0.8 to 3.6 px. The photographed lenses stand about 11 percent wider apart than the layout the Lenskin is cut for, so the plate is registered on the lenses and clipped to the plateau inside the case's rim (polygon (1170, 612), (1428, 595), (1432, 1012), (1182, 1030), 34 px corners, 7 px inset), and behind the fingers (skin by hue, saturation and value inside the plateau). A face-on satin plate reflects one direction only, so a small source near the mirror direction (0.1 m at 0.14 m) gives it its sheen.
- **AirPods case (land 4).** Sam's FBX with products.py's three Skreed slots (lambert37 shell and lambert38 lid in Sage gloss, lambert33 the front plate as trim) and every other slot kept as Apple's white plastic, the grilles dark. The source poses the earbuds lifted clear of their wells (z 45.6 to 75.6 mm against the shell's rim at 33.9), so their faces drop 31 mm and they sit in the case. The case is posed at her chest, at pixel (1725, 1470), 4.1 px per mm (between her face's scale, about 3.7, and the phone's, about 4.9), its front turned 20 degrees toward the picture's centre and its top 28 degrees toward the camera so the earbuds read. Her free hand was out of the frame (her left arm hangs at the right edge), so the hand is generated around it (3.4).

**3.2 Composite (local, PIL, numpy and OpenCV).** Alpha over in linear light, with the contact shadow as Cycles caught it. The gain per channel is the photo's own white (the wall, 240 237 230, for land 2; his T-shirt, 236 236 233, for land 3; the wall, 232 229 223, for land 4) over the neutral pass's median on the body, times a grade set by eye (0.9, 0.85, 1.0). Then the photo's softness (a 0.7 px blur of the premultiplied layer) and its grain (the robust spread of a high-pass on the case nearby: 2.1, 0.7 and 1.1 code values) go on the render, so it sits in the picture.

**3.3 Matte.** Higgsfield's `image_background_remover` on each composite (land 4's after the hand). Its alpha is reshaped: a smoothstep from 0.35 to 0.85 (land 2's chin read 0.91 to 0.98, which would have let the new place into her face; wall between curls read 0.26); a hole the person encloses stays the person's when it is more than 80 px from the background that reaches the frame (land 2's open mouth); the phone in its case and the accessory are held exactly (the measured polygon, cut to the remover's alpha over 0.2, so no wall at its rounded corners).

**3.4 Land 4's hand.** A masked `nano_banana_2_1` inpaint at 2k on the composite, the case cut out of the mask. Attempt 1 (a zone from her shoulder down) drew a second, generated case in her hand beside ours: rejected, because a generator must never draw the product. Attempt 2 (a band from under the case to the frame's lower right, a prompt that forbids any other object) drew her left hand holding ours from below, in her sleeve. The generator drew the fingertips past the zone, so the blend takes the zone plus whatever it changed by more than 14 code values within 160 px of it, never the phone; the case's own pixels and its contact shadow go back on top.

**3.5 Background.** A masked `nano_banana_2_1` inpaint at 2k: the image and the mask go up at 2048 x 2048 (white is what may be painted, confirmed on the first call: a mean change of 28.8 inside the mask against 4.0 outside), and the result comes back at 2048 and is resized to 2500. The blend keeps the photo's pixels inside the person, the generator's outside, and across a 12 px band at the edge takes the old wall out of each pixel by the remover's alpha (the wall spread in by a normalised blur), choked over 2 px, plus a colour key over 30 to 60 px where the wall was plain (lands 2 to 4), so neither white wall nor land 3's lime wall rings the hair or the fingers. Land 2 needed a second call whose mask also covered the wall the key found between her curls (`paint_pockets`).

**3.6 Crops.** The portrait is the square's 1406 columns from `portrait_x`, each keeping the product in its upper 60 percent. The wide is the square on a 16:9 canvas at its full height (no pad above or below, so never above a cropped face and never a body invented under the frame), then cut to 16:10. The first try, a `nano_banana_2_1` masked inpaint of the pads alone, failed twice over: on land 1 it returned a 21:9 frame with the woman re-framed smaller, and on land 2 it cut her off at the square's edges with a straight line and an arcade where her shoulders should be (land 3's call failed outright). Higgsfield's `outpaint` model (no prompt, 16:9, symmetric) continued each picture outward instead. Its output is registered to the canvas by SIFT matches inside the square and a RANSAC similarity (93 to 320 inliers; scale 0.999 to 1.024), the square is kept exact except a 48 px seam band at each edge, and the 16:10 is cut from the left edge, so the left pad is the wider (972 px) where the text sits.

**3.7 Depth (option A).** `depth_anything_video`, variant VDA-Small (Apache-2.0), `--max_frames 1`, greyscale, resolution auto, on a one-frame H.264 clip of each crop at its encoded size (`ffmpeg -loop 1 -i crop.png -t 1 -r 1 -c:v libx264 -pix_fmt yuv420p -crf 12`), the returned clip's one frame saved as 8-bit grey. Land 4's two were made again after its hand was re-blended (1.1 and 1.3 percent of the crops' pixels had changed). Land 1's crops changed in 46 pixels at the phone's corners after their depth maps were made; they were not made again.

## 4. Every Higgsfield call

All calls costed first with `higgsfield generate cost` and refused by the script past the cap. No 4k, no pro mode. A failed job was not charged.

| # | Stage | Land | Model | Job id | Credits | Seed | What came of it |
|---|---|---|---|---|---|---|---|
| 1 | hand | 4 | `nano_banana_2_1` 2k inpaint | `f385e606-08bb-4955-8b47-e5c6f8437124` | 2 | 41402 | rejected: a second, generated case in her hand |
| 2 | hand | 4 | `nano_banana_2_1` 2k inpaint | `fd8a1625-077f-4d65-afae-5c8ec8c29ab2` | 2 | 41403 | used |
| 3 | matte | 1 | `image_background_remover` | `a8997fd3-4297-4e74-8190-fe1a4ccff7fa` | 1 | | used |
| 4 | matte | 2 | `image_background_remover` | `e7b1ac28-ef2a-41c5-b58c-ed0f122b49ab` | 1 | | used |
| 5 | matte | 3 | `image_background_remover` | `53692dc4-86cf-4e28-842f-bcac74bccec8` | 1 | | used |
| 6 | matte | 4 | `image_background_remover` | `fb685562-4356-44d5-a623-473279c0602b` | 1 | | used (on hand attempt 2's first blend) |
| 7 | bg | 1 | `nano_banana_2_1` 2k inpaint | `9482ee0b-d9e7-4935-ae25-bd513bb7ecb5` | 0 | 41112 | failed, no reason given |
| 8 | bg | 1 | `nano_banana_2_1` 2k inpaint | `8fff57ab-eb18-4587-8285-e83bcbf32861` | 2 | 41113 | used |
| 9 | bg | 2 | `nano_banana_2_1` 2k inpaint | `a57386de-034b-4405-aad4-0dc0a81ff270` | 2 | 41212 | not used: white wall left between her curls |
| 10 | bg | 3 | `nano_banana_2_1` 2k inpaint | `d89f29d3-47fa-4bce-b0c9-f7283239a327` | 2 | 41312 | used |
| 11 | bg | 4 | `nano_banana_2_1` 2k inpaint | `1475d9be-4c44-4966-b65c-3b984b9c1a2c` | 2 | 41412 | used |
| 12 | bg | 2 | `nano_banana_2_1` 2k inpaint | `765be83f-e22b-49e8-a406-300783070bba` | 2 | 41213 | used |
| 13 | pad | 1 | `nano_banana_2_1` 2k inpaint | `62d8cf8e-f025-43a0-9bba-ba43e4117531` | 2 | 41122 | not used: re-framed to 21:9 |
| 14 | pad | 2 | `nano_banana_2_1` 2k inpaint | `5e6890a5-c6b7-4493-814d-51823b56e60b` | 2 | 41222 | not used: the person cut off at the square's edges |
| 15 | pad | 3 | `nano_banana_2_1` 2k inpaint | `056cfb32-8cb3-43a6-a4db-cea37332d4a1` | 0 | 41322 | failed, no reason given |
| 16 | pad | 2 | `outpaint` 16:9 | `ea5b966b-f6d2-4172-aa8d-406c88f45d1f` | 2 | | used |
| 17 | pad | 1 | `outpaint` 16:9 | `31ce3e41-63ba-4d37-8b8d-a483140a70c4` | 2 | | used |
| 18 | pad | 3 | `outpaint` 16:9 | `3e98cd05-8fd0-4baf-bc6c-ccf1ec70740e` | 2 | | used |
| 19 | pad | 4 | `outpaint` 16:9 | `e5b3882e-15ab-4173-8be9-6d838c9a39e6` | 2 | | used |
| 20 | depth | 1 portrait | `depth_anything_video` VDA-Small | `f81a1207-d95a-41f5-b6bf-971a4b6722e9` | 1.5 | | used |
| 21 | depth | 1 wide | `depth_anything_video` VDA-Small | `2674cd6e-3688-4dd6-b848-960c5c7c3c30` | 1.5 | | used |
| 22 | depth | 2 portrait | `depth_anything_video` VDA-Small | `d9d4309a-f791-4253-ade8-b5ae32ae03fd` | 1.5 | | used |
| 23 | depth | 2 wide | `depth_anything_video` VDA-Small | `e9bf48c8-4729-42a2-ae61-37dfdf82bcfa` | 1.5 | | used |
| 24 | depth | 3 portrait | `depth_anything_video` VDA-Small | `7e88e9d8-3474-4498-b1af-79ff4ee08b48` | 1.5 | | used |
| 25 | depth | 3 wide | `depth_anything_video` VDA-Small | `a920cd55-6add-4864-8a36-2a3deb25cd88` | 1.5 | | used |
| 26 | depth | 4 portrait | `depth_anything_video` VDA-Small | `739e8774-c81d-40ec-bce7-30d9066d5141` | 1.5 | | superseded by 28 |
| 27 | depth | 4 wide | `depth_anything_video` VDA-Small | `94f57dc4-d5f7-40ae-b217-d0a5e5e1d004` | 1.5 | | superseded by 29 |
| 28 | depth | 4 portrait | `depth_anything_video` VDA-Small | `72c10e86-c8c0-4ba2-be32-839206debfb0` | 1.5 | | used |
| 29 | depth | 4 wide | `depth_anything_video` VDA-Small | `583f52e2-3045-4e34-ba1d-8e537275ab5e` | 1.5 | | used |
| | | | | **total** | **45.0** | | |

**Against the credit plan (spec section 6).** The depth line is wrong: `generate cost` prices a one-frame VDA-Small call at **1.5 credits**, not 0.05, with or without `--max_frames 1` and at 360p alike. Eight depth maps are 12 credits, not 1, and every redo is 3 per land. The background and the hand at 2 each, the remover at 1 and `outpaint` at 2 match it. `flux_2_pro_outpaint` could not be costed: the server asks for `input_width` and `input_height`, which this CLI (1.1.24) refuses as unknown parameters.

**The prompts** (seeds above; the masks and inputs are each call's upload ids on the ledger, `work/ledger.jsonl` in the run folder).
- Hand, attempt 1: "Her left arm is bent at the elbow and her left hand is raised to chest height, holding the small open sage green earbuds case that is already in the picture: the case rests in her palm, her fingers curled lightly under and around its sides, her thumb at its side. A natural relaxed hand with five fingers, the same skin tone and soft window light as her right hand, the same black leather jacket sleeve. Photorealistic. Do not change the case, the earbuds, her face or the phone."
- Hand, attempt 2: the `hand` string in `LANDS['airpods']` in `lands.py` ("Her left hand rises from the lower right ... do not draw any other case, earbuds, phone or object, and do not change the case already there.").
- Background, per land: the `bg` strings in `LANDS` (the place and the light of the spec's table, "softly out of focus as with a portrait lens at f/2", and the people and products to keep).
- Pad (calls 13 to 15 only): the `pad` strings in `LANDS`. `outpaint` takes no prompt.

## 5. Checks

**The case is untouched.** Each master against its base, inside the phone-in-its-case region (the measured polygon cut to the remover's alpha), with the accessory and its contact shadow (alpha over 5 of 255, dilated 3 px) left out. Mean absolute difference in 8-bit code values:

| Land | Region px | Square | Portrait | Wide |
|---|---|---|---|---|
| 1 | 270,810 | 0.0 (max 0) | 0.0 (max 0) | 0.0 (max 0) |
| 2 | 191,355 | 0.0 (max 1) | 0.0 (max 1) | 0.0 (max 1) |
| 3 | 389,809 | 0.0003 (max 2) | 0.0003 (max 2) | 0.0003 (max 2) |
| 4 | 318,829 | 0.0 (max 0) | 0.0 (max 0) | 0.0 (max 0) |

The 1 and 2 code-value maxima are the contact shadow's faint tail below the 5/255 cut (land 2) and the Lenskin's antialiased clip at the plateau (land 3).

**The accessories' colour against the catalog hex.** "Under a neutral patch" is the render's beauty over its neutral pass per pixel (the albedo the light shows), median over the body; "over the photo's white" is the composite's median divided by the photo's white in linear light. CIEDE2000.

| Land | Shade | Hex | Under the neutral patch | dE | The composite | Over the photo's white | dE |
|---|---|---|---|---|---|---|---|
| 2 | Desert, matte | #c6a884 | #c6a885 | 0.33 | 178 149 113 | #bda17e | 2.23 |
| 3 | Crimson, metallic matte | #d20000 | #fb0000 | 8.85 | 210 0 0 | #e30000 | 3.60 |
| 4 | Sage, gloss | #96a880 | #8d9d7a | 3.49 | 127 139 104 | #8c9b78 | 4.07 |

The Lenskin's neutral-patch figure overstates it: a Lambertian patch is no measure for metal, whose reflection under the sheen light is brighter than a white diffuse surface's. Its composite's median is the hex exactly. The AirPods case reads about 3.5 darker under its clearcoat, as the gloss finish does in the universe; a grade of about 1.07 would bring it to the hex if Sam wants it.

## 6. What looks wrong, for Sam

- **Land 1.** The wide's left pad is mostly the elm's bark, close and busy, where the land's text sits: not the "darker, quieter lower left" the spec asks for (`outpaint` takes no prompt). The bouquet's rightmost flowers stop at the square's right edge in the wide. The generator redrew some daisies at the bouquet's edge and added small distant walkers on the promenade.
- **Land 2.** A few smeared wisps at her hair's outer edge on the right, where the wall between curls was replaced. The arcade in the square's top corners is close and soft; in the wide's pads it is a longer, sharper corridor. The wallet is placed by eye (centred below the camera window); its size is products.py's assumed 93.8 mm.
- **Land 3.** The Lenskin is registered on the lenses and clipped by the case's rim, because the photographed lens layout is not the real one the Lenskin is cut for. Its Crimson reads very saturated (the hex is a pure red). The skyline's towers are generated, not a true view from Sheep Meadow.
- **Land 4.** Her left hand is generated (her free hand was out of the frame), holding the case from below with the fingertips at its base: Sam should look at the fingers closely. The wide's pads add a stone balustrade in the foreground at both lower corners. The earbuds are Apple's (the reference-only variant).
- **All.** The backgrounds are generated places, not photographs of Central Park; the people are Sam's listing models in places they were not photographed (E-S4-people, E-S4-photo).

## 7. To make it again

```
python3 -I scripts/room/lands.py render    --root <run> [--airpods-fbx <run>/airpods-src/airpods.fbx] --samples 128
python3 -I scripts/room/lands.py composite --root <run>
python3 -I scripts/room/lands.py hand      --root <run> --land airpods --attempt 2        # 2 credits; --reuse to re-blend
python3 -I scripts/room/lands.py matte     --root <run> --hand 2                          # 4 credits
python3 -I scripts/room/lands.py bg        --root <run> --land <id> --attempt <n>         # 2 credits each; blend re-blends
python3 -I scripts/room/lands.py pick      --root <run> --land <id> --attempt <n> [--hand 2]
python3 -I scripts/room/lands.py crops     --root <run> --attempt 2                       # outpaint, 2 credits each; widen re-makes
python3 -I scripts/room/lands.py pickwide  --root <run> --attempt 2
python3 -I scripts/room/lands.py depth     --root <run>                                   # 1.5 credits per crop
python3 -I scripts/room/lands.py check|sheet|sums|ledger --root <run>
```
`<run>` holds `src/` (the four copies), `work/` (every intermediate, the uploads memo and the ledger) and `out/`. The generators are not deterministic across their versions even with a seed, so a re-run makes new candidates; the sums pin the ones above.

## 8. The second round (Sam, 2026-10-20)

Sam's words on the first sheet: "the lenskin color combination with the phone case and the lenskin doesnt go well, redo that one. fix the AirPods placement and shadow, the Lenskin's sheen, and darken the text areas." The approved backgrounds and pads are kept: their calls are reused, never paid again. The masters, the run's `work/` and `out/`, and the first round's masters (`v1/`) are copied into `assets-src/room/lands/` (gitignored); `SHA256SUMS` lists all 55 (the 20 masters, the Lenskin candidates' 15 in `lenskin-options/`, and the first round's 20 in `v1/`), and `shasum -a 256 -c SHA256SUMS` passes for every one. The sheet is `out/sheet-v2.jpg` in the run folder; the Lenskin's is `out/lenskin-options.jpg`.

**8.1 The shades are read, not typed.** `lands.py` reads each accessory's shade id and finish from `ROOM_PRODUCTS` in `src/config/room.ts` and checks the hex against `shades-240.json` by id; `tests/unit/room-lands.test.ts` checks `room-lands.json` against the same.

**8.2 The Lenskin, redone (land 3; nothing generated).** The park of the first round stays; only the plate changes, in four candidate shades by id, each metallic matte, for Sam to choose from. Nothing here picks.
- **Why these four.** The case as photographed is a deep blue-green, #103f32 at its median (hue about 163 degrees, L* about 23). Crimson sits almost opposite it on the wheel at full chroma, the pairing that fights. The four keep a contrast in value or in warmth instead:

| Option | Shade | Id | Hex | Why |
|---|---|---|---|---|
| 0 | Crimson | `roaring-red-07` | #d20000 | the first candidate, for comparison |
| 1 | Porcelain | `frosty-white-10` | #eff1f0 | a light neutral that reads as brushed aluminium: the most contrast in value and none in hue, its faint green cast the case's own |
| 2 | Dijon | `mellow-yellow-24` | #cea146 | a warm metal, a muted gold about a third of the wheel from the case (a triad, not a complement): racing green and gold |
| 3 | Sage | `go-green-09` | #96a880 | a lighter green from the case's own family, greyed: analogous, tone on tone (and land 4's AirPods case) |
| 4 | Graphite | `stormy-grey-23` | #424548 | a dark neutral, gunmetal: a green darker than this case would vanish on it, so the dark option is a neutral, the quietest |

- **The sheen.** Rendered in Blender (Cycles on Metal, 128 samples) in perspective, the plate face-on at 0.2 m, its outside face still 20 px per mm so the first round's hole homography places it unchanged (residual 0.8 to 3.6 px). The view turns about 9 degrees across the plate, so it reflects a soft park sky (`env`: an overcast sky brighter toward its zenith, a line of trees, the lawn), its zenith the photo's up (the render's left: the phone is held on its side) and the horizon a little under the mirror direction. A strip light (0.4 x 0.006 m, 0.25 m off, rolled 18 degrees) lays a streak along the plate; a 0.3 mm bevel on the model's cut edges is where the metal's fresnel lights its rim, and where the plate is cut to the plateau the same rim is carried along the cut (lit facing the photo's up, shaded facing down). Roughness 0.24 here against the universe's 0.38: at a hand's length 0.38 spread the streak over the whole plate. The lights are in the photo's own axes (the soft key above and in front, as on his face), turned into the plate's frame by the homography; the first round's lights had the photo's light coming from its lower left.
- **The composite.** As the first round's (the photo's white for the gain, the plateau's clip, behind his fingers, the photo's softness and grain), plus: the lenses', flash's, microphone's and LiDAR's bezels (fitted on a 3x zoom: radius 52 px for the three lenses, 20, 7 and 24 for the others) stay on top, the plate takes a 5 px contact shade round each, and the plateau left showing in the holes' gaps and at the plate's left edge takes the plate's shade (0.55). A shoulder rolls the sheen off toward the photo's white above 0.75 of it, on the brightest channel, so Porcelain does not blow out flat (38 percent of its plate clipped without it). Each plate is then graded so its median over the photo's white is the hex's luminance:

| Option | Grade | Over the photo's white | dE2000 against the hex |
|---|---|---|---|
| 0 Crimson (the first round's plate) | 0.85 | #e00000 | 2.96 |
| 1 Porcelain | 0.851 | #f2f3f3 | 0.95 |
| 2 Dijon | 0.748 | #cfa046 | 0.68 |
| 3 Sage | 0.745 | #96a880 | 0.00 |
| 4 Graphite | 0.748 | #424548 | 0.00 |

- **The lime line.** The old wall's faint line along the case's top edge and its wedge between the case's right edge and his finger (2,917 px), found by hue within 16 px of the person's outline: the line filled from both sides (`cv2.inpaint`, Telea, 4 px), the wedge with the background just under it carried up column by column. No credits.
- **The masters** carry option 0 until Sam picks; `out/lenskin-options/land-lenskin-<n>-{square,portrait,wide}.png` hold each candidate, cut and burnt exactly as the masters. A pick swaps only the plate inside the plateau, so the depth maps (made on option 0) stand: the plate is under 1 percent of either crop.

**8.3 The AirPods case, placed again (land 4).**
- **The pose.** From (1725, 1470), yaw 20, to (1470, 1360), yaw 14 (pitch 28, 4.1 px per mm, as before), with the portrait from x 360 (was 450). The case spans x 1362 to 1577 and y 1241 to 1479 of the square: its bottom at 59.2 percent of the frame (inside the upper 60), and the phone's 390 x 844 cover-fit window (x 485 to 1641) holds it whole with 64 px to spare on the right; the violet phone's left edge (x 490) is inside the window too. The check's suggestion was x 1500 to 1530 with the portrait from 375; at 375 the phone's left edge falls 10 px outside the window, so the case went 30 px further left instead.
- **The gloss.** The window at the picture's left is now a 0.28 x 0.8 m rectangle at 1.2 m (was a 1.2 m disc, which spread its reflection to nothing), so the clearcoat carries its highlight down the case's left side; a soft open-shade sky (`env`) gives the rims the rest. Graded 1.07 toward the hex: the composite over the photo's white reads #8fa07c, dE2000 2.57 (was #8c9b78, 4.07).
- **The hand.** One new masked inpaint (attempt 3, the zone moved with the case: from under it down to the frame's foot). She holds the case up from below between her fingertips and thumb, her forearm in the jacket's sleeve crossing to the lower right. The first round's background is reused (`rebg`: bg attempt 1's generator output, the first round's matte with the new hand added), so Bow Bridge is as Sam saw it; 56 px of the square's edge bands changed (the old sleeve's last rows), under the 0.05 percent the wide's seams allow.
- **The shadow.** On her generated hand: the window's short cast shadow (10, 14 px down and right, blur 6, 0.55) and the contact's occlusion (blur 3, 0.5); on her top behind, a softer drop shadow farther off (36, 44 px, blur 22, 0.3; the case is held a few centimetres in front of her). The Cycles catcher's shadow is kept within about 12 px of the case: its plane is the case's base, and farther off it fell on a plane her chest is not on, as a pale box (seen and removed before the masters).

**8.4 The text areas, darker.**
- **The wides.** The lower-left pad of each refilled by a masked `nano_banana_2_1` inpaint at 2k with a prompt for a darker, quieter lower left (the `darken` strings in `LANDS`), registered back by SIFT and taken inside the mask only, its edge drawn 24 px in and feathered over 24. Land 1's busy bark: the first call (masked from 0.42 down) cut the trunk off in a straight line over a lawn, so the second took the whole pad: the elm's trunk now ends inside it, and the Mall in deep shade lies beyond, darkest at the lower left. Land 2: the first call painted a dark wall under a straight edge across the arches; the second, on the whole pad, has the arcade recede into shade. Land 3: the first call came back square (2048 x 2048, not the 16:9 sent) and did not register; the second puts the lawn in a tree's shade. Land 4: the lake's dark water at the lower left, the stone balustrade gone from that corner.
- **The burn.** Every portrait and wide then takes a soft burn of its lower left, local and free: a raised cosine over an ellipse from the frame's lower-left corner (its reach 1.5 of the width shown and 0.62 of the height on the portrait, 0.8 and 0.65 on the wide), multiplicative in linear light with a shoulder that holds the brightest things down a little more, so it reads as shade falling across the corner rather than a box. Each crop takes the least burn, from 0.6 stops (portrait) or 0.5 (wide) at the corner, that brings its text area's median to 4.5:1 and its lightest 5 percent to 3:1, and at most 1.6 (1.4); land 3's portrait, which his white T-shirt fills, up to 2.6 with a stronger shoulder. The product (the phone in its case and the accessory, dilated and feathered 24 px) is never burnt: the case is untouched in every master (8.6).
- **The contrast.** Pearl Whisper (#F7F6F3) over each crop's text area by `scripts/quiz/contrast.mjs`'s method: the WCAG luminance of every pixel under the text, sorted, the median and the value at 95 percent (the lightest 5 percent), and Pearl's ratio against each. The text area is the spec's bottom left as the land shows it: on the portrait, x 0.04 to 0.92 and y 0.74 to 0.97 of what a 390 x 844 cover-fit shows (its middle 0.82 of the width); on the wide, x 0.03 to 0.45 and y 0.68 to 0.95 of the 16:10 at 1280 x 800. The first round's numbers are on the same boxes (the check's own boxes differ a little, so its figures do too).

| Land | Crop | First round, median / lightest 5% | Now, median / lightest 5% | Burn at the corner, stops |
|---|---|---|---|---|
| 1 Phone case | portrait | 4.16 / 2.14 | 5.87 / 3.03 | 0.85 |
| 1 Phone case | wide | 7.28 / 1.84 | 16.22 / 3.09 | 0.5 |
| 2 MagSafe wallet | portrait | 4.72 / 1.60 | 8.04 / 2.86 | 1.6 |
| 2 MagSafe wallet | wide | 3.09 / 1.42 | 11.35 / 2.34 | 1.4 |
| 3 Lenskin | portrait | 1.40 / 1.04 | 4.40 / 2.16 | 2.6 |
| 3 Lenskin | wide | 4.18 / 2.13 | 9.82 / 3.03 | 1.1 |
| 4 AirPods case | portrait | 17.50 / 5.25 | 18.01 / 7.79 | 0.6 |
| 4 AirPods case | wide | 4.51 / 1.87 | 11.87 / 3.00 | 0.65 |

  Seven of the eight medians pass 4.5:1; land 3's portrait reaches 4.40. No lightest 5 percent reaches 4.5:1: four reach 3:1, and land 2's two (2.86, 2.34) and land 3's portrait (2.16) do not. Below 4.5:1 is recorded here and flagged to Sam, never boxed (AC12). Land 3's portrait needs a new composition to do better: every 1406-wide window holds the T-shirt.

**8.5 Depth (option A), made again from the final crops.** All eight, since every crop changed: `depth_anything_video` VDA-Small, `--max_frames 1`, greyscale, 1.5 credits each, on a one-frame clip of each final crop at its encoded size (720 x 1280 and 1920 x 1200). Land 1's no longer predate its crops.

**8.6 Checks.** The case against its base inside the phone-in-its-case region, accessory and shadow left out, in every master: mean absolute difference 0.0 on lands 1, 2 and 4 (largest single difference 0, 1 and 0 code values) and 0.0003 on land 3 (largest 2, the Lenskin's clip, as before), square, portrait and wide alike. The burn's weight inside the products is 0 by construction. `npm run test:unit`: 94 of 94 (the first round's 89 with the GLBs back in `public/models`, and 5 for `room-lands.json`). `npx astro check`: 0 errors. `PUBLIC_HERO_HOOKS=1 PUBLIC_TUNE=0 PUBLIC_STAGING=0 npx astro build`: 12 pages, `dist/models` with the three product GLBs and the case's LODs, and the universe's chunk naming each by its url again.

**8.7 Every call this round** (round 2 in `work/ledger.jsonl` and `src/data/room-lands.ledger.json`; each costed first and refused past the cap, 85 on the ledger's running total: the first round's 45 plus this round's 40).

| # | Stage | Land | Model | Job id | Credits | Seed | What came of it |
|---|---|---|---|---|---|---|---|
| 30 | hand | 4 | `nano_banana_2_1` 2k inpaint | `6e73cb69-0b5a-4fdd-9537-b9aaef7dc4d5` | 2 | 41404 | used (attempt 3, the second pose) |
| 31 | darken | 1 | `nano_banana_2_1` 2k inpaint | `d01e8e5e-65e0-4690-b2ec-9531640dc51c` | 2 | 41132 | not used: the trunk cut off in a straight line |
| 32 | darken | 1 | `nano_banana_2_1` 2k inpaint | `e5009577-54a8-42ab-a8d5-9fe87a1790c0` | 2 | 41133 | used (the whole pad) |
| 33 | darken | 2 | `nano_banana_2_1` 2k inpaint | `85d2a354-53c0-4c74-9a1f-c989cb8fd6a0` | 2 | 41232 | not used: a dark wall under a straight edge |
| 34 | darken | 3 | `nano_banana_2_1` 2k inpaint | `b2bda40c-2aca-4b50-9a5e-c26946991931` | 2 | 41332 | not used: came back square, did not register |
| 35 | darken | 4 | `nano_banana_2_1` 2k inpaint | `54f03f5f-437f-4572-ab8b-8b6aea044349` | 2 | 41432 | used |
| 36 | darken | 2 | `nano_banana_2_1` 2k inpaint | `7d6bd7ae-a65d-4a4c-827b-4ca9d8106420` | 2 | 41233 | used (the whole pad) |
| 37 | darken | 3 | `nano_banana_2_1` 2k inpaint | `39ef2429-3c49-4fad-9a4c-6b617d10cce5` | 2 | 41333 | used |
| 38 | depth | 1 portrait | `depth_anything_video` VDA-Small | `535797f7-ea1f-49b1-9111-080553ebe584` | 1.5 | | used |
| 39 | depth | 1 wide | `depth_anything_video` VDA-Small | `603ab9f4-36ae-4daf-a731-1150ddf51b56` | 1.5 | | used |
| 40 | depth | 2 portrait | `depth_anything_video` VDA-Small | `6e0d763b-d252-495f-a2a2-1d3b403249c5` | 1.5 | | used |
| 41 | depth | 2 wide | `depth_anything_video` VDA-Small | `91371a3e-1415-4ee5-bf5b-2fec89e90a78` | 1.5 | | used |
| 42 | depth | 3 portrait | `depth_anything_video` VDA-Small | `bac0ebde-8ba8-4fbc-8acc-2e0d54627315` | 1.5 | | used (on option 0) |
| 43 | depth | 3 wide | `depth_anything_video` VDA-Small | `a58ad032-83fa-4bf9-9561-5ab28907aae6` | 1.5 | | used (on option 0) |
| 44 | depth | 4 portrait | `depth_anything_video` VDA-Small | `b95403b8-a194-4b47-a8ab-d32e17f3e8a6` | 1.5 | | used |
| 45 | depth | 4 wide | `depth_anything_video` VDA-Small | `1b0befa0-ff24-4a07-885c-846dec5d4b29` | 1.5 | | used |
| | | | | **this round** | **28.0** | | **73.0 in all** |

**8.8 For Sam.**
- **Land 3:** pick a Lenskin, 0 to 4, from `lenskin-options.jpg` (or another shade). If it is not Crimson, `ROOM_PRODUCTS`' Lenskin shade changes with it (spec 3: the shade rendered is the shade named), and the masters take that option's plate.
- **Land 4:** look at the new hand (generated, as before) and the shadow under the case.
- **The text areas:** land 3's portrait reaches 4.40:1 at its median; land 2's lightest 5 percent stay under 3:1. Accept them under E-S4-contrast, or say which land to recompose.
- **Still open from the first round:** land 2's few smeared wisps at her hair's right edge, the wallet's 93.8 mm size, the generated skyline and the generated places in general (E-S4-photo, E-S4-people).

```
python3 -I scripts/room/lands.py render    --root <run> --land airpods --airpods-fbx <run>/airpods-src/airpods.fbx --samples 128
python3 -I scripts/room/lands.py composite --root <run> --land airpods
python3 -I scripts/room/lands.py hand      --root <run> --land airpods --attempt 3     # 2 credits; --reuse to re-blend
python3 -I scripts/room/lands.py rebg      --root <run> --land airpods --hand 3
python3 -I scripts/room/lands.py retouch   --root <run> --land lenskin
python3 -I scripts/room/lands.py square2   --root <run> --hand 3
python3 -I scripts/room/lands.py wide2     --root <run>
python3 -I scripts/room/lands.py darken    --root <run> --land <id> --attempt <n>      # 2 credits each; redarken re-makes
python3 -I scripts/room/lands.py final     --root <run> --land <id> --attempt <n>      # n: the darken call the wide is made from
python3 -I scripts/room/lands.py render    --root <run> --land lenskin --samples 128   # the four candidates
python3 -I scripts/room/lands.py lenskin   --root <run> --land lenskin
python3 -I scripts/room/lands.py depth     --root <run>                                # 1.5 credits per crop
python3 -I scripts/room/lands.py contrast|check|sheet2|sums|record --root <run>
```

## 9. The third round (Sam, 2026-10-20)

Sam on sheet-v2: all four lands approved, with the wide crops' seams blended out, and the Lenskin in option 3, Sage (`go-green-09`, #96a880). **No call and no credits**: every wide is made again from the outpaint and the darken refill already paid for. `room-lands.json` records both reviews per land (`reviews`) and the approval: "Sam 2026-10-20 (sheet-v2), with the seams to be blended", and for land 3 ", Lenskin option 3 (Sage)". The second round's masters, as sheet-v2 showed them, are kept in `work/v2/`.

**9.1 The Lenskin in Sage (`lenskinpick`).** Land 3's square is `lenskin-options/land-lenskin-3-square.png`, the plate rendered with its sheen and rim and graded to its hex (dE2000 0.00 over the photo's white, by `check` on the plate's uncovered body). It differs from the retouched square in 80,247 px, every one inside the plateau: 1.3 percent of the square, 2.3 percent of the portrait, 0.8 percent of the wide (the portrait figure is above the 1 percent the round-2 note gave). Its depth maps were made on option 0 and stand: the plate is the same flat plate at the case's depth. `ROOM_PRODUCTS` still names Crimson (`roaring-red-07`); `lands.py` takes the pick from `LENSKIN_PICK` and says so on every run, and `tests/unit/room-lands.test.ts` holds a todo that turns into a test once room.ts names Sage.

**9.2 The seams (`seams`).** Round 2 left two kinds, both straight:
- **The darken refill's edge.** Its take weight was the mask eroded 24 px and blurred by 24, then cut by the mask itself, so it fell from about 0.16 to 0 in one pixel: x 948 down every wide, and y 1050 across lands 3 and 4.
- **The outpaint's pad meeting the photo.** A straight 48 px linear band at the square's edges, x 972 to 1020 and 3424 to 3472.

The third round makes each wide again (`seamed_wide`), with the weights in `SEAMS`:
- **The registrations.** The outpaint is registered again on the square it was sent (`work/square1-<id>.png`), the refill on the canvas it was sent (`work/wide169v2-<id>.png`), each by SIFT and a RANSAC similarity with OpenCV's generator seeded, so a re-run gives the same bytes (checked: two runs, identical sums).
- **The pad into the photo.** Inside the square only, a smootherstep (no slope and no bend at either end) over 128 px, its weight on the photo 0 at the square's edge. Its centre follows the cheapest path down the rows (the columns where the outpaint's own copy of the square differs least from the photo, at most 320 px in), smoothed over 40 rows and wandering by up to 72 px over about 90 rows, so no seam is straight. The outpaint redrew the square near its edges (25 to 53 code values off on lands 1 and 2), so where it differs most the path goes deeper and keeps the outpaint's own continuation: land 4's lower right now has its balustrade meeting her jacket, not the photo's strip of leaves cut by a line. The ramp ends 8 px short of the product in every row (checked in code).
- **The refill into the pad.** Inside the mask only, from its edges (the frame's own edges are no seam): first a relight, the pad's linear light times the refill's luminance over its own (both low-passed by 48 px), raised to a smootherstep weight, so the pad's texture darkens as shade would; then, half a ramp behind, the refill itself mixed in by a second smootherstep. 128 px each at the side, 240 at the top (the check asked 200 or more), each edge wandering (up to 80 px at the side over about 90 rows, 112 at the top over about 120 columns). Land 1's elm now keeps more of its trunk, which turns into shade; land 2's sleeve keeps its own outline; land 3's tree shade has a soft, uneven edge.
- **In OKLab.** Every mix is in OKLab (Björn Ottosson's matrices), as the spec's W13 and E-S4-colour ask of shades that meet; the relight is in linear light.
- **The weights at the old edges.** Both are 0 at the mask's edge and at the square's edge (recorded per land in `room-lands.json`, `seams`).
- **The crops.** Then both crops and their burn as `final` does, the burn tuned again: lands 1 and 4's wides take 0.7 and 1.2 stops (were 0.5 and 0.65); the rest are as before.

**9.3 The steps across the old seams (`steps`, `work/steps.json`).** For each old seam: the mean step (code values, the three channels averaged) from each column to the next over the seam's own rows (from each row to the next over its columns, for the top edge); the largest of the three pairs across the seam; and the image's own steps there, the median and the 90th percentile of the same profile over the 256 nearest columns (rows) either side, with the seam's rank among them. "The blend's own step" is the largest step the third round's weights add anywhere along that seam: each weight's change from one column (row) to the next times how far apart the two pictures it mixes are there, averaged as the steps are.

| Land | Old seam | Round 2: step / median (rank) | Now: step / median / p90 (rank) | The blend's own step, largest |
|---|---|---|---|---|
| 1 | darken edge, x 948 | 17.07 / 11.84 (99) | 16.42 / 12.13 / 14.74 (100) | 0.83 |
| 1 | pad band, x 972 | 14.51 / 12.40 (74) | 14.37 / 13.03 / 14.97 (83) | 0.60 |
| 1 | pad band, x 1020 | 17.01 / 14.00 (72) | 9.99 / 13.43 / 15.06 (13) | 0.60 |
| 1 | pad band, x 3424 | 2.65 / 2.42 (64) | 2.18 / 2.21 / 2.72 (45) | 0.28 |
| 1 | pad band, x 3472 | 2.93 / 2.21 (94) | 2.93 / 2.12 / 2.38 (100) | 0.28 |
| 2 | darken edge, x 948 | 7.36 / 1.81 (100) | 2.33 / 2.14 / 2.64 (72) | 0.60 |
| 2 | pad band, x 972 | 2.43 / 1.95 (72) | 2.43 / 2.20 / 2.70 (70) | 0.24 |
| 2 | pad band, x 1020 | 2.68 / 2.36 (81) | 2.74 / 2.33 / 2.74 (90) | 0.24 |
| 2 | pad band, x 3424 | 2.68 / 2.65 (56) | 2.35 / 2.50 / 3.05 (32) | 0.37 |
| 2 | pad band, x 3472 | 3.69 / 2.51 (100) | 3.39 / 2.32 / 2.89 (98) | 0.37 |
| 3 | darken edge, x 948 | 4.94 / 3.78 (74) | 4.65 / 4.52 / 5.11 (57) | 0.56 |
| 3 | darken top, y 1050 | 4.99 / 1.07 (100) | 1.27 / 1.14 / 1.41 (70) | 0.44 |
| 3 | pad band, x 972 | 3.79 / 2.61 (97) | 3.79 / 3.13 / 3.52 (98) | 0.09 |
| 3 | pad band, x 1020 | 2.81 / 2.41 (81) | 3.41 / 3.05 / 3.53 (82) | 0.09 |
| 3 | pad band, x 3424 | 1.40 / 1.35 (55) | 1.36 / 1.37 / 1.80 (47) | 0.04 |
| 3 | pad band, x 3472 | 1.16 / 1.21 (41) | 1.16 / 1.27 / 1.62 (38) | 0.04 |
| 4 | darken edge, x 948 | 4.92 / 1.09 (100) | 1.05 / 0.91 / 1.01 (93) | 0.67 |
| 4 | darken top, y 1050 | 2.43 / 1.22 (100) | 1.36 / 1.25 / 1.45 (75) | 0.33 |
| 4 | pad band, x 972 | 1.12 / 1.20 (38) | 1.04 / 1.05 / 1.21 (49) | 0.17 |
| 4 | pad band, x 1020 | 1.69 / 1.34 (85) | 1.18 / 1.09 / 1.40 (71) | 0.17 |
| 4 | pad band, x 3424 | 2.05 / 1.23 (90) | 1.82 / 1.17 / 1.87 (88) | 0.05 |
| 4 | pad band, x 3472 | 1.17 / 1.18 (49) | 1.14 / 1.12 / 1.87 (54) | 0.05 |

- **The blend.** Its own step is under the image's own median step at every one of the 22 seams: 0.04 to 0.83 code values, against medians of 0.91 to 13.4.
- **The hard steps are gone.** The four that stood out at rank 100 with nothing in the picture to explain them now rank as their neighbours do: land 2 at x 948 (7.36, 4 times its median, now 2.33), land 3 at y 1050 (4.99, now 1.27), and land 4 at x 948 (4.92, now 1.05) and at y 1050 (2.43, now 1.36).
- **What still ranks high is the picture itself, where no weight changes.**
  - Land 1, x 944 to 966: the outpaint's sharpest bark, between the refill's ramp and the pad's. The profile is flat across the old seam (15.5 to 16.4).
  - Lands 1 and 2, x 3472, and land 3, x 972: the same two columns of the outpaint's own picture in both rounds, with an equal step in both, so nothing composited is there. On land 2 it is an arcade pillar's upright edge.
  - Land 4, x 948: within 0.14 of its median, on calm water.
- **The frames** `after-a.jpg` and `after-b.jpg` (this round's scratch folder, `wave2a/lands-pipeline/probe/`: the round-2 wide over the new, at 1:1, on each worst seam) show no line on any of them.

**9.4 Checks.**
- **The case is untouched** in every master: 0.0 mean difference on all four lands (largest single difference 0, 1, 0 and 0 code values; land 3's plateau is the Lenskin's footprint).
- **Colours over the photo's white.**
  - Desert dE 2.23 and the AirPods case's Sage 2.57, as in round 2 (check items 5 and 6, minor, not part of this round).
  - The Lenskin's Sage 0.00.
- **Contrast**, Pearl Whisper over each crop's text area, median and lightest 5 percent, by `contrast.mjs`'s method.
  - The portraits are as round 2: 5.87 / 3.03, 8.04 / 2.86, 4.40 / 2.16, 18.01 / 7.79.
  - The wides now: 15.44 / 3.01, 10.78 / 2.33, 9.37 / 3.03, 12.73 / 3.03 (round 2: 16.22 / 3.09, 11.35 / 2.34, 9.82 / 3.03, 11.87 / 3.00).
  - Every median passes 4.5:1 but land 3's portrait (4.40). The lightest 5 percent stays under 3:1 on land 2's two crops and land 3's portrait, as in round 2.

**9.5 Depth (`depthseams`; no call; replaced in the fourth round, section 10).**
- **Land 1.** Its wide now keeps the elm's trunk up to about 200 px further left than the depth map made in round 2, which had the trunk end at x 948 and the far park beyond. So inside the mask, the share of the picture the seams took from the pad takes each row's depth just right of the edge (the median over x 960 to 1000, the trunk's, which fills every row there). That is 6.0 percent of the map.
- **Lands 2, 3 and 4.** Their wide depth maps stay as made. The same carry drew blocks with straight tops where a silhouette crosses those columns. Their round-2 maps already hold the jacket (land 3), the sleeve within about 20 px of its edge in the picture (land 2) and the water (land 4).
- **The portraits' maps** are the round-2 ones, and every portrait is unchanged byte for byte, but land 3's (the plate).
- **If Sam's displaced-grid frames show a tear,** a fresh depth call per wide is 1.5 credits (6 for the four).

**9.6 The encoded files (`scripts/room/encode-lands.mjs`, sharp 0.35.5 on libvips 8.18.7).**
- **The input.** Each master is read only after its SHA-256 matches `room-lands.json`'s.
- **The sizes.** `land-<id>-portrait` 720 x 1280, `land-<id>-wide` 1920 x 1200, and the depth maps at a quarter of each (180 x 320 and 480 x 300, grey; the AVIF in three channels with flat chroma, as sharp writes no 4:0:0).
- **The encoders.** AVIF from q60 (4:4:4, effort 9) and WebP from q80 (effort 6), each lowered by 1 until it fits its line.
- **What is written.** No ICC profile and no metadata. `encoded.json` beside the files records each one's bytes, quality, size and master. KB below are 1024 B, as stored.

| Land | Portrait AVIF | Portrait WebP | Wide AVIF | Wide WebP | Depth AVIF, portrait / wide | Depth WebP, portrait / wide |
|---|---|---|---|---|---|---|
| 1 case | 65.5 (q60) | 83.2 (q80) | 107.0 (**q48**) | 174.9 (**q64**) | 2.0 / 3.0 | 1.9 / 2.8 |
| 2 wallet | 72.8 (q60) | 90.6 (q80) | 109.6 (q57) | 175.1 (q80) | 2.2 / 2.9 | 2.2 / 2.7 |
| 3 lenskin | 42.7 (q60) | 52.7 (q80) | 105.4 (q58) | 148.8 (q80) | 1.7 / 3.0 | 1.5 / 2.9 |
| 4 airpods | 50.1 (q60) | 60.9 (q80) | 88.3 (q60) | 115.2 (q80) | 2.1 / 3.1 | 2.0 / 2.9 |
| line | 80 | 128 | 110 | 176 | 12 | 20 |

- **Land 1's wide** is the one file that needed to go under the brief's range. The sunlit bark and paving cost the most:
  - At q50 it was 115 KB in 4:2:0 and more in 4:4:4, so the AVIF fits its 110 KB at q48.
  - The WebP fits its 176 KB at q64 (q80 was 237 KB).
  - Decoded, both differ from the master by 2.9 code values on average; the bark is a little softer at 1:1.
- **The rest** fit at q57 to q60 and q80.
- **The final sheet**, `out/sheet-final.jpg` in the run folder, is made from the files decoded back (`lands.py sheetfinal`).

**9.7 The masters, kept twice.**
- **The sums.** `assets-src/room/lands/SHA256SUMS` (76 lines: the 20 masters, the 15 candidates, round 1's 20 in `v1/`, round 2's 20 in `work/v2/`, and `work/SHA256SUMS`) and `work/SHA256SUMS` (339 files: every mask and generator output `room-lands.json` names, the ledger, the picks) both check OK.
- **The main checkout.** The folder is copied with `rsync -a` (nothing deleted) into the main checkout's `assets-src/room/lands/`, and both sums check OK there.

```
python3 -I scripts/room/lands.py lenskinpick --root <run> --land lenskin
python3 -I scripts/room/lands.py seams       --root <run>
python3 -I scripts/room/lands.py steps|check|contrast|sums|record --root <run>
node scripts/room/encode-lands.mjs --decoded <run>/out/decoded
python3 -I scripts/room/lands.py sheetfinal  --root <run>
```

The third round also ran `depthseams` (9.5) between `seams` and `steps`; the fourth round removed that stage.

## 10. The fourth round (Sam, 2026-10-21)

Sam on `sheet-final.jpg`, the encoded files decoded back: **"this works, build it"**. The four lands are approved as encoded, with land 1's wide at AVIF q48 and WebP q64. Every land in `room-lands.json` now records this as its third review (round 3, 2026-10-21, `sheet-final.jpg`, "approved", his words in `words`). Its `approval` reads `Sam 2026-10-21 (sheet-final.jpg, the encoded files): "this works, build it"`, and land 3 adds ", Lenskin option 3 (Sage)".

**10.1 The wides' depth maps, made again (4 calls, 6.0 credits; 79.0 in all).**
- **Why.** The wides' maps were made in round 2. The third round then blended the seams, so the pictures changed in 1.7 to 8.5 percent of the frame, and land 1's map was a local carry across the trunk (9.5). The spec (3, "Option A's depth maps") asks for each map to be the depth model's output on its own crop.
- **How.** `lands.py depth --crop wide`: `depth_anything_video`, VDA-Small, `--max_frames 1`, greyscale, on a one-frame clip of each final wide at 1920 x 1200. Each call is costed first, with the cap at 81 (73 spent plus this round's 8). Each map is extracted as 1920 x 1200 8-bit grey: the same name and size as before.
- **What is kept.** The `depthseams` stage and land 1's `depth_carry` are gone from `lands.py`. The third round's four maps are kept in `work/v3/` (land 1's patched one; the other three are the round-2 maps). Nothing else changed: the other 16 masters keep their sums.

| Land | Job | Seconds | Mean change, code values | Pixels changed by more than 8 |
|---|---|---|---|---|
| 1 case | `f676a4b7-5a23-4f17-8d7e-a0ee9a707876` | 207 | 2.30 | 2.3 percent |
| 2 wallet | `ac3d1275-e984-45ff-99b6-bbe277e5e0af` | 12 | 0.98 | 1.1 percent |
| 3 lenskin | `7cc5ec47-6106-458a-94b0-ceaba916637c` | 11 | 0.82 | 0.2 percent |
| 4 airpods | `243d4b82-b9c5-467c-8a71-a6e4c57c9308` | 16 | 1.78 | 4.0 percent |

- **The account.** Other sessions share it, so its balance is not this round's alone: it read 1,711 before and 1,664 after. Its transactions show this round's four 1.5-credit charges, at 05:02:55, 05:07:03, 05:07:24 and 05:07:47 UTC.

**10.2 The maps against their pictures.** The edges of each map (Canny on the map, blurred 1 px, at 12 and 30) were measured against the edges in its wide (Canny on the grey picture, blurred 1.5 px, at the median's usual bounds), both at 1920 x 1200. The table gives the median distance from a depth edge to the nearest picture edge, and the share within 4 px:

| Land | Round 3's map | Round 4's map |
|---|---|---|
| 1 case | 2.8 px, 57 percent | 1.4 px, 80 percent |
| 2 wallet | 1.4 px, 79 percent | 1.4 px, 80 percent |
| 3 lenskin | 1.4 px, 74 percent | 1.4 px, 76 percent |
| 4 airpods | 3.0 px, 59 percent | 2.2 px, 64 percent |

- **Land 1.** The trunk's left edge in the new map is sharp, at the bark's own edge. The carry had drawn it as a soft ramp about 200 px wide.
- **Land 4.** The balustrade meeting her jacket at the lower right now has its own depth. Round 2's map was made before the seams were blended, so it put that edge where the round-2 picture had it.
- **Lands 2 and 3.** These change least. Their edges were already within a few px of the picture's, and they still are.
- **The frames.** `depth-edges-r3-r4.jpg` (each map's edges over its wide, round 3 left, round 4 right), `depth-maps-r3-r4.jpg` and `case-depth-compare.jpg` are in this round's scratch folder, `wave2b/lands-pipeline/probe/`. Sam still checks the displaced-grid frame of each land when option A is wired (spec 3).

**10.3 The encoder's quality floor (`scripts/room/encode-lands.mjs`).**
- **The floor.** Each format still starts at q60 (AVIF) and q80 (WebP) and steps down by 1, but now it stops at its floor, **AVIF q45 and WebP q60**. A file that does not fit its line by then throws.
- **Accepted files.** A file may go lower only if `room-lands.json`'s `encoding.accepted` names it with Sam's acceptance, a quality, the master and the master's sum. A named file is held to that: it must come from that master (by sum) and be written at exactly that quality, or the run throws. An acceptance for a file the run does not write also throws.
- **What `encoded.json` records.** Each file's `floor`, and `accepted` where there is one.
- **Land 1's wide.** It is recorded as accepted under Sam's approval of 2026-10-21: `land-case-wide.avif` at q48 and `land-case-wide.webp` at q64, from `land-case-wide.png` (`8518f158...`), with sheet-final and his words. Both qualities are above the new floors, so the record is what pins them: q48 is under the brief's AVIF q50, and q64 is the only WebP under q80. If the master changes, or the file stops fitting at exactly those qualities, the encoder stops and asks for a new acceptance.
- **Checked against altered records** (land 1 only, from a copy of `room-lands.json`; logs in `wave2b/lands-pipeline/enc-neg/`):
  - **Accepted at q50.** It throws: "written at q48, room-lands.json records Sam's acceptance at q50".
  - **Floor raised to q50, nothing accepted.** It throws: "nothing from q60 to the floor q50 fits 112640 B".
  - **Floor raised to q50, q48 accepted.** It passes, at q48 and q64.
  - **An acceptance naming another master's sum.** It throws before encoding.
  - **The record as committed.** It gives land 1's eight files byte for byte.
- **The re-encode.** It wrote all 32 files. 24 are byte for byte as before; only the eight wide depth files changed (AVIF 2.9 to 3.1 KB, WebP 2.7 to 2.9 KB, against lines of 12 and 20). The pictures' qualities are as in 9.6, and the poster-tier totals are unchanged. The depth AVIFs decode with flat chroma; the WebPs decode within 2 code values across the channels, as the unchanged portrait maps do.

**10.4 The Lenskin's shade in `ROOM_PRODUCTS`.**
- **The change.** `src/config/room.ts` names the Lenskin `go-green-09` (Sage, `#96a880`), Sam's pick, the shade its masters carry. It is the same values as the `s4/world-wire` branch's change; only the shade and the hex change on this branch's line.
- **The scripts.** `lands.py` now refuses a run where `ROOM_PRODUCTS` and `LENSKIN_PICK` differ, and `room-lands.json` no longer carries `room_ts`.
- **The test.** `tests/unit/room-lands.test.ts` asserts plainly that each accessory's shade and hex in `room-lands.json` equal `ROOM_PRODUCTS'`: the wallet's Desert, the Lenskin's Sage and the AirPods case's Sage. It also asserts the Lenskin is `go-green-09` / `#96a880` and Sam's pick. The todo is gone. With room.ts set back to Crimson the test fails, as it should: "lenskin: the shade rendered is the shade ROOM_PRODUCTS names".
- **Lands 3 and 4.** Both now carry Sage, the Lenskin on land 3 and the AirPods case on land 4.

**10.5 The masters, kept twice.**
- **The sums.** `SHA256SUMS` now has 80 lines (76 plus `work/v3/`'s four), and `work/SHA256SUMS` lists 355 files. Both check OK in the worktree.
- **The main checkout.** Both also check OK in the main checkout's `assets-src/room/lands/`, after `rsync -a` with nothing deleted.

```
python3 -I scripts/room/lands.py depth --root <run> --crop wide --cap 81
python3 -I scripts/room/lands.py sums|record --root <run>
node scripts/room/encode-lands.mjs --decoded <scratch>/decoded
```
