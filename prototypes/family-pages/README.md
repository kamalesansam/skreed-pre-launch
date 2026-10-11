# Family pages prototype (2026-10-09 to 2026-10-11)

## Ciao's look (2026-10-11, hero link version 32)
Sam: "it's not anywhere close to the ciao energy site, check out exactly how the background is, how the lighting is in the ciao energy site, and just replace the 3d can with the 3d phone case, rest everything looks the same." The page is now ciao's opening carousel with the case in place of the can. Full notes: `docs/specs/family-page.md` 19.
- **Backdrop:** ciao's fixed grey-to-night ramp (9.02 degrees, light at -30%, #959492 at 15%, black at 65%; ours with Pearl Whisper, `--studio` and `--night`) and its fade over the bottom of the first screen. Exception E-F1.
- **Scene:** ciao's carousel at rest (3.5 units a slot, the sine wave, the V in depth, tipped 20 degrees back, turned, leaned 11.25 degrees; camera at z 29, FOV 20), the case scaled to the can's height; ciao's two spotlights on the front case; ciao's studio HDRI measured and re-created as our own map (`ciao-measure/`: `hdrmeasure.py` measures, `fitmap.py` fits; irradiance within 15% on nine normals). The front case is lit, the others sit in the dark, as ciao's cans do.
- **Colour:** the case's albedo is fitted per shade so the front case reads the catalog colour (`tools/ciaocal.mjs` measures a and b; `ciao-measure/sim.cjs` simulates all 240). Two departures from ciao's renderer, each measured: the base-layer specular is cut to 0.2 (ciao's spots laid a grey sheen over the matte back), and the tone mapping is Neutral, not ACES (through ACES no albedo makes Sky read better than 123, 188, 244; Neutral leaves 227 of 240 shades under dE00 2). `?tm=1` shows ACES.
- **Layout:** the first screen, as ciao's: arrows either side of the front case, the name under it, the scrubber under the name; finish and Reserve bottom right on laptops, above the fixed bar on phones.
- Shots: `shot-ciao-look-1280.png`, `shot-ciao-look-390.png` (ciao's own frames are not kept in the repo). `ciao-measure/` holds measurements and fitting code only; ciao's HDRI and the arrays read from it are not in the repo.
- Not yet reviewed independently (no agents in use).

The ten family pages (`/shades/<family>/`): 24 cases of one family in a ciao-style line, one Cobalt case model recoloured per shade, case only (no phone). Spec: `docs/specs/family-page.md`. In the full page it opens from a gem in section 2 (hero link, v11.1).

- `index.html`: the built single file (the case LODs embedded); `page.src.html` its source; `build.py` the builder (expects the session's asset paths).
- Review: round 3, engineering PASS, fidelity FAIL on a drag past either end freezing the line and a stale name while a drag is held. Round 4 fixes (clamped front slot, a trailing name update, a route race guard, a fixed-width view toggle, the copy now says gems) were checked by the builder against the reviewer's own harnesses (drag past both ends at 390 and 1280, held drags) but not yet re-reviewed independently.
- Family names are the catalog's (Blissful Blues); the gem labels use Sam's singular names. Whether the singular names replace these is pending Sam.
