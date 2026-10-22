# The five scenes' loops, made (evidence for docs/specs/section-4-flux.md)

Made 2026-10-22 on the branch `s4/flux-assets`. Section 4 is being redone after the reference site (www.fluxtheory.in): five video backgrounds on a carousel with our products in front. The backgrounds are our own loops, ten of them (five scenes, a wide and a portrait each), animated by `kling_o3_flf` from stills that were inpainted twice over, and encoded for the site by `scripts/room/encode-flux.mjs` into `src/assets/room/flux/`. Sam approved all ten on 2026-10-22 (section 6). The generator's files are gitignored in `assets-src/room/flux/raw/`, with `SHA256SUMS` committed beside the folder's `.gitignore`; the pipeline record is `src/data/room-flux.json`. Nothing here is wired into the page: the wiring branch imports these files.

The scene ids are ours, in page order; the reference site's names are the raw files' and appear only here, in `SHA256SUMS` and in the encoder script, never under `src/` or `public/`.

| # | Scene | Raw name | What it is |
|---|---|---|---|
| 1 | `cove` | `bathroom-1-c` | the pink rock cove with water |
| 2 | `grove` | `bathroom-2` | the green forest |
| 3 | `ember` | `bathroom-5` | the red sunset |
| 4 | `palace` | `lover` | the pink marble palace |
| 5 | `dawn` | `dreamer` | the lilac curtains |

## 1. Provenance and method

**The reference.** The capture `www.fluxtheory.in.zip` sits untracked at the repo root; the site's own videos were downloaded beside it into a scratchpad for the work below. Nothing of the capture ships as it is. What ships is three generations away from it: a frame of each reference video, inpainted twice, then animated afresh by a video generator that draws every frame, then re-encoded. The scenes' compositions are still the reference's, which Sam should know when he judges them.

**Round 1 (its records are lost).** One frame of each of the five reference videos, with the shower and the bathtub inpainted out by masked `nano_banana_2_1` calls. Round 1 also spent credits that bought nothing: failed Kling Omni Edit jobs, which were refunded, and six Seedance 2.5 `video_edit` jobs that returned the input unchanged at 30 credits each, 180 credits lost, to be raised with Higgsfield. No job ids were kept for any round-1 call, so none is in the ledger below.

**Round 2 (2026-10-22, Sam's request: no bathroom left).** Every bathroom accessory removed and the floors changed, by one masked `nano_banana_2_1` inpaint per scene on the round-1 stills (2k, `is_inpaint`, aspect auto, thinking medium; the mask white where the generator may paint): bottles, jars and the incense tray off the cove's pedestals; the bottle and jar at the grove's tree replaced by ferns and moss; the ember's bottles, cup and side table off its ledge and floor; the palace's candles and bottles removed and its rippling water floor replaced by polished cream and rose marble; the dawn's vanity, basin, tap, mirror, bottles, towels and plant removed and its curtain wall continued. The grove still took a second inpaint after the one on record; that call's record was not kept, so its id is unknown. The results are the wide stills `<raw>-clean2.png`, 1700 x 884.

**The portrait stills.** One masked `nano_banana_2_1` inpaint per scene (aspect 9:16) that extends the wide still into a tall frame, the picture kept in place and the ceiling and floor continued above and below: `p-<raw>-clean.png`, 788 x 1401.

**The loops.** One `kling_o3_flf` call per still, 5 s, mode std, sound off, `multi_shots` false, the still as both the start and the end image, aspect 16:9 for the wide and 9:16 for the portrait, each prompt a locked camera and an ambient loop that returns to its first frame (the prompts are in section 7 and in `src/data/room-flux.json`). Each came back as H.264 Main, yuv420p, 121 frames at 24 fps (5.0417 s), no audio, moov first: the wide 1328 x 692, the portrait 720 x 1280. Nine of the ten carry no colour tags; the dawn wide alone is tagged BT.709, limited range.

**The encode (`scripts/room/encode-flux.mjs`, after `encode-clips.mjs`).** Each loop is read only after its sum matches `SHA256SUMS`. Its first 120 frames (5.000 s, five GOPs of 24) go to libx264 at the raw size (no rescale), preset veryslow, profile High level 4.0, `-g 24 -keyint_min 24` (x264 clamps keyint_min to 13, as it does for the clips), no audio, `-movflags +faststart`, `-map_metadata -1`, and the VUI set through x264 itself: `colorprim=bt709:transfer=iec61966-2-1:colormatrix=bt709:range=tv`, so a browser decodes the same display values as the pictures. The CRF search starts at 18 and steps up by 1 until the file is at or under the cap, 1,228,800 B (1,200 KB). The raw frame 120 is left out because it returns to the start image (section 3 measures how closely): kept, the loop would hold its first picture for two frames at the wrap.

**The matrix, per file.** A file without colour tags could be BT.601 or BT.709, and the two differ in the reds and blues by up to 12 code values on these frames. The script decodes each raw file's first frame twice, once under each matrix (`scale=in_color_matrix=bt601|bt709:in_range=tv`, the conversion in the scale filter itself), resizes the clean still the loop was animated from to the frame's size (sharp, lanczos3) and takes the mean absolute difference of each decode from it over all three channels; the closer matrix wins. A BT.601 file has its matrix alone converted to BT.709 by the `colorspace` filter (`ispace=bt470bg:space=bt709`, the primaries and the sRGB transfer left as they are, limited range in and out), as the clips were; a BT.709 file passes through, its samples re-encoded as they are. The outcome: BT.601 for eight files, BT.709 for the two dawn files (section 3). The dawn wide's tag agreed with the check.

**The posters.** Each loop's first frame, as decoded under the matrix chosen, written as AVIF and WebP with `encode-lands.mjs`'s settings: AVIF from q60 (4:4:4, 8-bit, effort 9), WebP from q80 (smart subsampling, effort 6), each stepping down by 1 until inside the land picture lines (`scripts/hero/budget.mjs` PIC: wide 110 KB AVIF and 176 KB WebP, portrait 80 and 128 KB, KB of 1,024 B as stored), the floor q45 and q60. The wide poster is 1280 x 666 (the 1328 x 692 frame scaled to 1280 x 667 and the odd row cropped, the aspect kept); the portrait is 720 x 1280, the frame's own size. No ICC profile and no metadata.

## 2. The result

Ten loops, 9,988,953 B together (the five wide 5,014,522 B, the five portrait 4,974,431 B); every one under the 1,228,800 B cap, seven of them at CRF 18, the lowest tried.

| # | Scene | Class | File | Size | Frames | Bytes | CRF | Matrix in |
|---|---|---|---|---|---|---|---|---|
| 1 | cove | wide | `cove-wide.mp4` | 1328 x 692 | 120 | 1,145,970 | 18 | BT.601 |
| 1 | cove | portrait | `cove-portrait.mp4` | 720 x 1280 | 120 | 1,142,902 | 23 | BT.601 |
| 2 | grove | wide | `grove-wide.mp4` | 1328 x 692 | 120 | 1,158,911 | 18 | BT.601 |
| 2 | grove | portrait | `grove-portrait.mp4` | 720 x 1280 | 120 | 1,138,258 | 19 | BT.601 |
| 3 | ember | wide | `ember-wide.mp4` | 1328 x 692 | 120 | 953,779 | 18 | BT.601 |
| 3 | ember | portrait | `ember-portrait.mp4` | 720 x 1280 | 120 | 946,363 | 18 | BT.601 |
| 4 | palace | wide | `palace-wide.mp4` | 1328 x 692 | 120 | 1,122,865 | 18 | BT.601 |
| 4 | palace | portrait | `palace-portrait.mp4` | 720 x 1280 | 120 | 1,079,781 | 20 | BT.601 |
| 5 | dawn | wide | `dawn-wide.mp4` | 1328 x 692 | 120 | 632,997 | 18 | BT.709 |
| 5 | dawn | portrait | `dawn-portrait.mp4` | 720 x 1280 | 120 | 667,127 | 18 | BT.709 |

Every file: 24 fps, 5.000 s, one stream (H.264 High, yuv420p), no audio. The CRF searches that went past 18: cove portrait 18: 2,094,095, 19: 1,856,116, 20: 1,643,616, 21: 1,455,890, 22: 1,291,865, 23: 1,142,902; grove portrait 18: 1,308,383, 19: 1,138,258; palace portrait 18: 1,401,928, 19: 1,231,978, 20: 1,079,781. The encode is deterministic: a second run of the cove wide at CRF 18 matched the first byte for byte (sha256 `1aa84e39f65f...`).

The raw files, for scale: the wide 1,285,120 (cove), 1,323,170 (grove), 1,023,766 (ember), 1,254,815 (palace) and 523,269 B (dawn); the portrait 3,832,121, 1,684,138, 895,270, 2,076,897 and 570,938 B, at 121 frames.

**The posters**, 344,402 B of AVIF and 393,988 B of WebP together, every one at its starting quality:

| Scene | Class | Size | AVIF bytes (q) | WebP bytes (q) |
|---|---|---|---|---|
| cove | wide | 1280 x 666 | 29,803 (60) | 32,048 (80) |
| cove | portrait | 720 x 1280 | 47,674 (60) | 55,226 (80) |
| grove | wide | 1280 x 666 | 44,231 (60) | 50,342 (80) |
| grove | portrait | 720 x 1280 | 51,135 (60) | 62,454 (80) |
| ember | wide | 1280 x 666 | 27,936 (60) | 32,736 (80) |
| ember | portrait | 720 x 1280 | 28,860 (60) | 30,828 (80) |
| palace | wide | 1280 x 666 | 40,266 (60) | 47,174 (80) |
| palace | portrait | 720 x 1280 | 39,869 (60) | 44,588 (80) |
| dawn | wide | 1280 x 666 | 17,525 (60) | 20,112 (80) |
| dawn | portrait | 720 x 1280 | 17,103 (60) | 18,480 (80) |

The lines were 112,640 and 180,224 B for the wide, 81,920 and 131,072 B for the portrait; the fullest is the grove portrait AVIF at 62 percent of its line.

## 3. Checks

**The probe.** Every encoded file: one video stream and no other, `h264` High, yuv420p, `nb_frames` 120, `r_frame_rate` 24/1, duration 5.000000 s, colour primaries bt709, transfer iec61966-2-1, matrix bt709, range tv; the top-level boxes in the order `ftyp moov free mdat`, the moov ahead of the media. The script fails on any of these being otherwise, and did not.

**The matrix, first frame against the still** (mean absolute difference in 8-bit code values, overall and then R G B; the closer is chosen):

| Scene | Class | Tag on the file | As BT.601 | As BT.709 | Chosen |
|---|---|---|---|---|---|
| cove | wide | none | 2.785 (2.958 2.568 2.829) | 3.286 (2.854 3.506 3.497) | BT.601 |
| cove | portrait | none | 3.005 (3.212 2.776 3.028) | 3.566 (3.261 3.986 3.450) | BT.601 |
| grove | wide | none | 3.427 (3.651 3.030 3.599) | 5.279 (5.078 6.136 4.623) | BT.601 |
| grove | portrait | none | 3.329 (3.714 2.826 3.447) | 5.492 (5.361 6.414 4.700) | BT.601 |
| ember | wide | none | 2.832 (3.160 2.335 3.002) | 5.094 (5.334 4.732 5.216) | BT.601 |
| ember | portrait | none | 2.665 (3.063 2.127 2.805) | 4.791 (4.811 4.515 5.046) | BT.601 |
| palace | wide | none | 3.163 (3.526 2.697 3.266) | 4.560 (4.264 5.054 4.361) | BT.601 |
| palace | portrait | none | 2.901 (3.066 2.671 2.966) | 4.532 (4.239 5.149 4.209) | BT.601 |
| dawn | wide | bt709 bt709 bt709 tv | 4.328 (4.558 5.579 2.845) | 2.899 (3.046 2.610 3.041) | BT.709 |
| dawn | portrait | none | 2.319 (2.643 1.949 2.364) | 2.045 (1.775 1.610 2.750) | BT.709 |

The residual under the chosen matrix (2.0 to 3.4) is the generator's own drift from its start image plus the still's resize; the wrong matrix adds 0.3 to 2.2 on top, mostly in green and red. The two cove files sit closest between the matrices (0.50 and 0.56 apart), the two grove files furthest (1.85 and 2.16).

**The loop at the wrap.** Each encoded file's first frame (frame 0) and last frame (frame 119), decoded as BT.709, against the raw file's first frame decoded under the matrix chosen; beside them, the raw file's frame 120 (the one left out) and its frame 1 against the same raw frame 0, so the wrap can be read against the step between two neighbouring frames. Mean absolute difference, overall and then R G B:

| Scene | Class | Encoded frame 0 | Encoded frame 119 | Raw frame 120 | Raw frame 1 |
|---|---|---|---|---|---|
| cove | wide | 1.066 (1.080 0.908 1.210) | 1.570 (1.615 1.395 1.700) | 1.222 (1.276 1.100 1.289) | 0.101 (0.101 0.093 0.109) |
| cove | portrait | 1.797 (1.916 1.479 1.995) | 3.685 (4.026 3.293 3.737) | 2.665 (2.870 2.389 2.736) | 1.585 (1.700 1.505 1.551) |
| grove | wide | 1.148 (1.115 1.060 1.269) | 1.579 (1.441 1.554 1.742) | 1.205 (1.140 1.144 1.330) | 0.150 (0.147 0.145 0.158) |
| grove | portrait | 1.339 (1.307 1.138 1.570) | 1.995 (1.845 1.876 2.262) | 1.601 (1.526 1.524 1.752) | 0.114 (0.110 0.109 0.123) |
| ember | wide | 1.117 (1.099 1.018 1.233) | 1.592 (1.622 1.485 1.670) | 1.251 (1.399 1.124 1.230) | 0.187 (0.185 0.172 0.205) |
| ember | portrait | 1.039 (0.994 0.962 1.161) | 1.376 (1.376 1.251 1.501) | 1.035 (1.148 0.898 1.060) | 0.125 (0.120 0.111 0.143) |
| palace | wide | 1.182 (1.229 0.999 1.317) | 1.481 (1.553 1.311 1.579) | 1.225 (1.315 1.100 1.260) | 0.047 (0.045 0.044 0.053) |
| palace | portrait | 1.325 (1.383 1.115 1.475) | 2.174 (2.262 1.980 2.279) | 1.851 (1.960 1.709 1.884) | 0.157 (0.152 0.150 0.170) |
| dawn | wide | 0.507 (0.519 0.407 0.594) | 0.999 (1.034 0.826 1.137) | 0.968 (1.003 0.819 1.082) | 0.120 (0.125 0.099 0.137) |
| dawn | portrait | 0.379 (0.388 0.310 0.440) | 0.981 (1.012 0.817 1.116) | 0.965 (1.002 0.828 1.066) | 0.080 (0.081 0.071 0.090) |

Read plainly: the encoded first frame is 0.4 to 1.8 from the raw one, which is the x264 compression at CRF 18 to 23 plus the matrix conversion's rounding. The raw frame 120 is not a pixel duplicate of frame 0: it returns to the start image to within 1.0 to 2.7 code values, while two neighbouring frames differ by 0.05 to 0.19 (the cove portrait by 1.59, its water moving fastest). So the wrap from frame 119 back to frame 0 is a step of about 1 to 2 code values on nine loops and 3.7 on the cove portrait, five to thirty times the usual frame step. Whether any of that reads as a hitch is for Sam to see on staging; it is the generator's return to its start image, not the encode, and cutting at 120 rather than 121 neither adds nor removes it (frame 120 is as far from frame 0 as frame 119 is). The flash check (AC5, WCAG 2.3.1) has not been run on the loops: `scripts/room/clip-flash.py` composes a travel, not a loop under a carousel, so every loop's `flash` stays `pending` in `src/data/room-flux.json` until a loop-and-wipe version runs.

**The guards and tests.** `node scripts/room/guards.mjs` reports nothing of the reference in `public/` or `src/`; `node --test tests/unit/room-video.test.ts` passes 10 of 10, including the rule that only `travel-video.ts` names a `.mp4` among the `.ts`, `.astro`, `.mjs` and `.js` files under `src/` (the data file is JSON and the encoder lives in `scripts/`). A grep for the raw names and `fluxtheory` over `src/` and `public/` finds nothing.

## 4. Every Higgsfield call

The job records (`<raw>-job.json`, `p-<raw>-job.json`, `<raw>-r2-job.json`, `p-<raw>-r2-job.json` in `raw/`, as the CLI's `--json` returned them) carry no price field; the credits per call are as the account's history showed them, 6.25 for a loop and 2 for an inpaint. Times are the records' `created_at`, UTC, 2026-10-22. All completed.

| # | Stage | Scene | Class | Job id | Job type | Credits | At |
|---|---|---|---|---|---|---|---|
| 1 | still | cove | wide | `85afba8b-cf2b-422f-b1cb-85b5c6ac40b4` | `nano_banana_2_1` 2k inpaint | 2 | 10:15:28 |
| 2 | still | palace | wide | `278b99ad-91c8-4ecf-ad16-6f5101bf7c7f` | `nano_banana_2_1` 2k inpaint | 2 | 10:18:46 |
| 3 | still | dawn | wide | `ac67de4f-fe5f-4ab5-8a39-8b729e08c07a` | `nano_banana_2_1` 2k inpaint | 2 | 10:22:12 |
| 4 | still | ember | wide | `2b636f06-6a1f-49be-9bae-7d0e29830af6` | `nano_banana_2_1` 2k inpaint | 2 | 10:23:43 |
| 5 | still | grove | wide | `14de6b54-3354-43a6-a22a-13a08ec0b1f9` | `nano_banana_2_1` 2k inpaint | 2 | 10:27:40 |
| 6 | still | grove | wide | record lost: the second inpaint on the grove still, id unknown | `nano_banana_2_1` 2k inpaint | 2 | unknown |
| 7 | still | ember | portrait | `abee60bc-8bce-4276-a554-af51270cc970` | `nano_banana_2_1` 2k inpaint, 9:16 | 2 | 10:30:10 |
| 8 | still | palace | portrait | `957816a9-acde-4dfc-b6d3-9044ec750310` | `nano_banana_2_1` 2k inpaint, 9:16 | 2 | 10:31:20 |
| 9 | still | dawn | portrait | `a1c0d67d-8c0d-4b81-ab83-0fe9849cbadc` | `nano_banana_2_1` 2k inpaint, 9:16 | 2 | 10:32:32 |
| 10 | still | grove | portrait | `bd12724b-6f41-472c-9242-ca1ab296670a` | `nano_banana_2_1` 2k inpaint, 9:16 | 2 | 10:34:08 |
| 11 | loop | cove | wide | `2086b7b3-5c6e-412f-a7f7-d53f33f92fe6` | `kling_o3_flf` 5 s std 16:9 | 6.25 | 10:35:06 |
| 12 | loop | ember | wide | `e02995d2-feaa-45e1-94b1-1107e536558c` | `kling_o3_flf` 5 s std 16:9 | 6.25 | 10:36:23 |
| 13 | loop | palace | wide | `228de375-0a4e-4af2-9976-39da5fd37443` | `kling_o3_flf` 5 s std 16:9 | 6.25 | 10:37:42 |
| 14 | loop | dawn | wide | `7325b64e-faf2-47fa-9f93-c5604d090c70` | `kling_o3_flf` 5 s std 16:9 | 6.25 | 10:39:03 |
| 15 | loop | grove | wide | `60f4afba-2291-4fdb-8562-d93e98bb8a71` | `kling_o3_flf` 5 s std 16:9 | 6.25 | 10:41:17 |
| 16 | still | cove | portrait | `b112a5a3-c2d0-45f9-960b-adde2649604c` | `nano_banana_2_1` 2k inpaint, 9:16 | 2 | 10:42:57 |
| 17 | loop | grove | portrait | `b99020ae-cf85-4e17-ad1e-c3ba31223443` | `kling_o3_flf` 5 s std 9:16 | 6.25 | 10:43:58 |
| 18 | loop | ember | portrait | `8e105771-58b1-47e5-bc91-b09b42fdae2b` | `kling_o3_flf` 5 s std 9:16 | 6.25 | 10:46:23 |
| 19 | loop | palace | portrait | `d02c1b78-7bab-4e46-a837-a97004f62c8a` | `kling_o3_flf` 5 s std 9:16 | 6.25 | 10:48:02 |
| 20 | loop | dawn | portrait | `37e286a6-703b-4203-95ad-182b268bd2dc` | `kling_o3_flf` 5 s std 9:16 | 6.25 | 10:49:17 |
| 21 | loop | cove | portrait | `c0904a7a-c421-4309-9900-3757058b035f` | `kling_o3_flf` 5 s std 9:16 | 6.25 | 10:51:46 |

Round 1's calls are not in the table: the masked inpaints that took the shower and the bathtub out of the five reference frames (their count and ids not kept), the failed Kling Omni Edit jobs (refunded, ids not kept) and the six Seedance 2.5 `video_edit` jobs that returned their input unchanged (30 credits each, 180 in all, ids not kept, to be raised with Higgsfield).

## 5. Credits

**Round 2 and its loops: the account read 1,420 before and 1,346 after, a drop of 74 credits.** The table's 21 calls sum to 84.5 at the prices given (ten loops at 6.25, 62.5; eleven inpaints at 2, 22), which overshoots the drop by 10.5. `higgsfield generate cost` on 2026-10-22, which creates no job, estimates 5 credits for a `kling_o3_flf` 5 s std frames job (with or without the start and end images) and 2 for a `nano_banana_2_1` 2k masked inpaint; at those prices the drop is the ten loops (50) and twelve inpaints (24), one more inpaint than the eleven known. Which price a loop was charged, 5 or 6.25, is to be settled from the account's history; `src/data/room-flux.json` records 6.25 per loop as given and the estimate beside it. **Round 1** cost on top of that: 180 credits lost to the six Seedance jobs, the inpaints' credits unknown, the Kling Omni Edit jobs refunded.

## 6. Sam's approval

2026-10-22: "All ten backgrounds are approved." Recorded on every loop in `src/data/room-flux.json` as `approval: { date: '2026-10-22', words: 'All ten backgrounds are approved.' }`.

## 7. To make it again

The three scripts are in `assets-src/room/flux/raw/` (their sums in `SHA256SUMS`). The two inpaint scripts expect, beside themselves, the 2k input still as `<name>-in.png` and its mask as `<name>-mask-in.png` (white where the generator may paint), upload both, run the masked inpaint and save `<name>-job.json` and `<name>-edit.png`; the inputs and masks were not kept, only the results, renamed to `<raw>-clean2.png` and `p-<raw>-clean.png`. `loop.sh` uploads a still, runs `kling_o3_flf` with it as both frames and saves `<name>.mp4` and `<name>-job.json` in `../edited/` relative to its own folder (from `raw/`, that is `assets-src/room/flux/edited/`). The generators are not deterministic, so a re-run makes new candidates; the sums pin the approved ones. Prices first: `higgsfield generate cost <job_type> ...` with the same flags.

The wide stills (`inpaint.sh`, aspect auto), 2 credits each:

```
zsh raw/inpaint.sh bathroom-1-c "Remove the bottles, jars and the incense tray from the tops of the two round stone pedestals, leaving the pedestal tops bare and smooth. Keep the pink sunset light, the rock walls, the gold columns, the plant and the rippling water exactly as they are. Photoreal 3D render look matching the scene."
zsh raw/inpaint.sh bathroom-2 "Replace the dark bottle and the dark jar at the base of the tree with ferns, moss and broad green leaves continuing the surrounding rainforest undergrowth, so no bottle, jar or container remains. Same green light and mist, photoreal 3D render look. Nothing else changes."
zsh raw/inpaint.sh bathroom-5 "Remove the bottles and jars from the round ledge on the right and the small cup and little side table on the left completely, leaving bare smooth surfaces and bare floor. Keep the sunset, the sea, the leaning stone slab, the wet dark stone floor with its flat slabs, the glass walls and everything else exactly as they are. Photoreal 3D render look matching the scene."
zsh raw/inpaint.sh lover "Remove every candle and every small bottle completely. Replace the rippling pink water floor with a polished royal palace marble floor: cream and pale rose veined marble with a soft mirror-like sheen reflecting the sunset light, continuing flat under the ledges and between the stone pedestals, no water anywhere. Keep the statues, the columns, the plants, the large white stone, the lattice screens, the ceiling and the sea view exactly as they are. Photoreal 3D render look matching the scene."
zsh raw/inpaint.sh dreamer "Remove the wall-mounted vanity cabinet, the basin, the tap, the oval mirror, the bottles, the towels and the small plant completely, leaving nothing in their place. Continue the sheer white vertical curtain wall and the soft lilac and peach light behind it seamlessly across the area. Keep everything else exactly as it is. Photoreal 3D render look matching the scene."
```
The grove's second inpaint, the one whose record is lost, ran the same way on the first's result.

The portrait stills (`inpaint916.sh`, aspect 9:16; the input is the wide still placed on a 9:16 canvas, the mask the pads above and below), 2 credits each:

```
zsh raw/inpaint916.sh p-bathroom-1-c "Extend this scene into a tall 9:16 portrait frame, keeping the existing picture exactly in place at its original size in the middle. At the top, continue the pink rock cave ceiling and the glowing light strip naturally; at the bottom, continue the rippling water floor with its reflections. Same materials, same pink sunset lighting, same colours, seamless, photoreal 3D render look. No new objects, no people, no text."
zsh raw/inpaint916.sh p-bathroom-2 "Extend this scene into a tall portrait frame. At the top, continue the wooden slatted ceiling and the glowing ring light naturally; at the bottom, continue the dense rainforest undergrowth of ferns, moss and broad leaves. Same materials, same soft green light and mist, same colours, seamless, photoreal 3D render look. No new objects, no people, no text."
zsh raw/inpaint916.sh p-bathroom-5 "Extend this scene into a tall portrait frame. At the top, continue the dark concrete roof slab naturally; at the bottom, continue the wet dark stone floor with its flat slabs and sunset reflections. Same materials, same red sunset lighting, same colours, seamless, photoreal 3D render look. No new objects, no people, no text."
zsh raw/inpaint916.sh p-lover "Extend this scene into a tall portrait frame. At the top, continue the carved stone ceiling around the round skylight naturally; at the bottom, continue the polished cream and rose marble floor with its soft reflections. Same materials, same pink sunset lighting, same colours, seamless, photoreal 3D render look. No new objects, no people, no text."
zsh raw/inpaint916.sh p-dreamer "Extend this scene into a tall portrait frame. At the top, continue the dark starry disc ceiling and the soft lilac wall above it naturally; at the bottom, continue the misty reflective floor with the drifting purple fog. Same materials, same soft lilac and peach dawn lighting, same colours, seamless, photoreal 3D render look. No new objects, no people, no text."
```

The loops (`loop.sh <name> <still> <aspect> "<prompt>"`), 6.25 credits each as charged to this account's history (5 by today's estimate):

```
zsh raw/loop.sh bathroom-1-c-r2 raw/bathroom-1-c-clean2.png 16:9 "A seamless ambient loop of this exact scene: gentle ripples drift across the calm water with soft reflections, the pink and blue sunset sky glows softly, the plant's leaves barely stir, the gold columns gleam steadily. The camera is completely locked. No new objects, no people, no text. The last frame matches the first frame exactly."
zsh raw/loop.sh bathroom-2-r2 raw/bathroom-2-clean2.png 16:9 "A seamless ambient loop of this exact scene: thin mist drifts slowly over the far lake and hills, the ferns and broad leaves sway very gently in a light breeze, the tree's leaves barely stir, the green ring light glows steadily. The camera is completely locked. No new objects, no people, no text. The last frame matches the first frame exactly."
zsh raw/loop.sh bathroom-5-r2 raw/bathroom-5-clean2.png 16:9 "A seamless ambient loop of this exact scene: soft waves roll slowly on the distant sea, thin clouds drift, the setting sun glows, light shimmers gently on the wet stone floor, the glass walls shimmer faintly. The camera is completely locked. No new objects, no people, no text. The last frame matches the first frame exactly."
zsh raw/loop.sh lover-r2 raw/lover-clean2.png 16:9 "A seamless ambient loop of this exact scene: soft waves roll slowly on the distant sea, the pink sunset glows, the plants' leaves barely stir, soft light reflections glide across the polished marble floor. The camera is completely locked. No new objects, no people, no text. The last frame matches the first frame exactly."
zsh raw/loop.sh dreamer-r2 raw/dreamer-clean2.png 16:9 "A seamless ambient loop of this exact scene: the sheer white curtains sway very gently, purple fog drifts slowly along the floor, the birds glide slowly, the stars twinkle faintly, the soft dawn glow breathes. The camera is completely locked. No new objects, no people, no text. The last frame matches the first frame exactly."
zsh raw/loop.sh p-bathroom-1-c-r2 raw/p-bathroom-1-c-clean.png 9:16 "<the cove prompt above>"
zsh raw/loop.sh p-bathroom-2-r2 raw/p-bathroom-2-clean.png 9:16 "<the grove prompt above>"
zsh raw/loop.sh p-bathroom-5-r2 raw/p-bathroom-5-clean.png 9:16 "<the ember prompt above>"
zsh raw/loop.sh p-lover-r2 raw/p-lover-clean.png 9:16 "<the palace prompt above>"
zsh raw/loop.sh p-dreamer-r2 raw/p-dreamer-clean.png 9:16 "A seamless ambient loop of this exact scene: the sheer white curtains sway very gently, purple fog drifts slowly along the floor, the stars twinkle faintly, the soft dawn glow breathes. The camera is completely locked. No new objects, no people, no text. The last frame matches the first frame exactly."
```
The four portrait prompts marked above are the wide prompts word for word; the dawn portrait's leaves out "the birds glide slowly". Every prompt is also in `src/data/room-flux.json`.

Then, from the repo root, with the raw files in place and their sums matching:

```
shasum -a 256 -c SHA256SUMS                                   # from assets-src/room/flux/
node scripts/room/encode-flux.mjs                             # --raw, --sums, --out, --data, --work and --only <ids> as needed
node scripts/room/guards.mjs && node --test tests/unit/room-video.test.ts
```
The encoder writes the ten loops and twenty posters to `src/assets/room/flux/`, `src/data/room-flux.json`, and the decoded frames it compared to `scripts/room/out/flux/` (gitignored); its log for this run is the numbers in sections 2 and 3.

## 8. Open

- The flash check (AC5) is pending on every loop: `clip-flash.py` needs a loop-and-wipe variant before a verdict can be recorded.
- The per-loop price, 6.25 as given or 5 as estimated today (section 5), and the one inpaint the account's drop implies beyond the eleven known.
- The grove still's second inpaint has no record; the surviving record (`14de6b54`) is one of its two calls, and the files do not say which.
- The wrap step on the cove portrait, 3.7 code values against its 1.6 frame step (section 3), is the one most likely to show; Sam judges it on staging.
- The lines these files are held to (1,200 KB a loop, the land picture lines for the posters) are this branch's; `scripts/hero/budget.mjs` and the spec's budget table are the wiring branch's to write, and nothing here edits them.
