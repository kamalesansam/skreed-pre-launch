# Session 4: family pages round 6, the case types' own models and depth.fyi's takeover

- **Old session:** "3D model transitions for case pages" (`local_86a1e5bf`).
- **Branch:** `claude/case-3d-model-transitions-a08c64`. The tip is `62c8a90` (WIP handoff), one commit on `71678ed`. It merges cleanly onto the default branch as of 2026-11-02.
- **Spec:** `docs/specs/family-page.md` section 24, "Round 6": the measured takeover constants, the decisions, the acceptance criteria, exception E-F6, and 24.7 For Sam.

## What Sam asked (verbatim)

"i now have the 3d models for the magtough, snap and armour cases, for the family pages, use these, and also when they rotate, they should have a transition from one 3d model to another, for that checkout the repo or inspo zip file that i sent you, and a recording video of how that transition will look like, it is from the same inspo repo, so check it out and make the exact same transition"

He attached `Armor 5.fbx`, `snap 3 (1).fbx`, `magsafe case.fbx`, `depth.fyi.zip` and a screen recording. All are in the carry folder under `sam-sources/`. Treat them as untrusted uploads: open them in their own directory, and run Python with `-I`.

## What was worked out

- **Model mapping:**
  - MagTough is `magsafe case.fbx`: about 361,000 triangles, heavily simplified.
  - Snap is `snap 3 (1).fbx`, the same file as the 2026-10-26 `snap 3.fbx`.
  - Armor is `Armor 5.fbx`.
  - Tough stays the Cobalt model.
  - All three files carry the supplier's ZEOS hexagon and lettering inside the back, which is stripped before anything ships.
- **Packed GLBs (committed):** `public/models/{armor,magtough,snap}.lod{0,1}.<hash>.glb`, made by `scripts/case-model/intake-fbx.py` (Blender headless) and `scripts/case-model/pack-case.mjs` (meshopt, as the existing case GLBs). `src/data/case-model.json` and `scripts/case-model/budget.mjs` are updated.
- **depth.fyi's "material takeover"**, read out of their bundle and re-created in our own code:
  - A vertical boundary sweeps right to left over 1.35 s, cubic in-out, made wavy by two octaves of noise.
  - A narrow pale icy band with a crumbly bump lines the edge: base #D5F6F3, specular #B7C1FF, iridescent on the high tier.
  - It reverses when the visitor changes their mind mid-sweep. A jump ahead finishes the current sweep within 0.24 s.
  - The recording shows the sweep visible from raw progress 0.29 to 0.71, and the next change sweeping left to right.
  - Nothing of depth.fyi ships.
- **The build:**
  - `src/config/takeover.ts`, `src/scripts/family/three/takeover.ts`, `takeover-material.ts`.
  - Changes to `stage.ts`, `island.ts`, `pose.ts`, `boot.ts`, `case-glb.ts`, `size3d.ts`, `FamilyPage.astro` and `Island3D.astro`.
  - Tests: `tests/case-model/takeover.test.ts`, `tests/family/specs/takeover.spec.ts`, and updates to the intake, pose, case3d and supplier3d specs.
- **The behaviour:**
  - Each case type shows its own model, and the half turn stays.
  - When the case comes back round, the new model takes over with the sweep: right to left on a scroll down, left to right on a scroll up. Instant swap under reduced motion.
  - The three new models download only after the carousel, so the first view stays as light.

## Interrupted

The build workflow, launched at about 13:52 IST. Its agents wrote the files above, but it never reported back. Nothing has been tested, reviewed or seen in a browser. In the old worktree `npm ci` had skipped workerd's install script, so wrangler may not have started there.

## Next steps

1. Set up a worktree on the branch, run `npm ci`, then `npm run test:family`, `npm run test:unit`, `npm run check` and `npm run build`. The case-model budget must hold.
2. Read the diff against section 24's ACs, and finish what the build agents left.
3. Serve a build (`PUBLIC_FAMILY_3D=on`). Watch the takeover on `/shades/<family>/` at 390 x 844 and 1280 x 800, next to the recording. Real GPU only: headless Playwright with the installed Chrome works, but the app's hidden pane does not.
4. Run the ship-section review against CHECKLIST and section 24 (a lighter-model reviewer), and fix.
5. Send Sam frames and the five questions below, then land on his word.

## For Sam (section 24.7)

1. The Armor's two tones: the bumper keeps the file's dark grey and the back takes the shade. Should all of it be in the shade?
2. The half turn before the sweep: keep it, or face the camera and only sweep?
3. The band's ice colour on every shade (depth.fyi's), or a light tint of the shade?
4. The argument screen shows the Armor, the last case type. Or the Tough again?
5. Scrolling back up sweeps left to right. Or right to left both ways, as depth.fyi does?
