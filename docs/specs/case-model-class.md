# CaseModel: one case model, 240 shades

Spec v2, 2026-10-09. The 3D object behind the ten family pages (`docs/specs/family-page.md`). Built inside the family-page loops (family-page.md 11); reviewed with them.

- **Brief:** the user supplies one phone case 3D model (a zip, not here yet). The page uses one model class and makes every shade from it: shared geometry, colour per shade, never 240 separate assets. Until the zip arrives, a procedural stand-in with the same interface lets the page be built now and the real model dropped in later.
- **What changed from v1 (review of 2026-10-09):** no mesh decoder at runtime (the site CSP blocks WebAssembly), so the model ships with `KHR_mesh_quantization` only and raw byte budgets; picking made safe against three's cached instanced bounding sphere; the PMREM generator and RoomEnvironment disposed after use, with exact renderer counts; the shader warm-up spelled out; the device glass given a material that separates from Slate pages; the T11 fixtures made our own; T12 restated so it can pass; every source the build relies on moved into the repo.
- **Read with:** `docs/specs/family-page.md` (pose function, camera, states, budgets), `docs/specs/case-asset-contract.json` (what the supplier's file must meet), `docs/references/2026-10-09-ciao-landing-3d.md` (the study), `docs/data/shades-240.json`, and, read only, `docs/specs/hero-architecture.md` 12.3 (the CSP).
- **three.js:** `three@0.165.0`, the landing's exact pin (hero D1). Features used and the release that introduced them: `NeutralToneMapping` (r162), `Scene.environmentIntensity` (r163), `renderer.compileAsync` (r158), `RoomEnvironment.dispose()`, `InstancedMesh.setColorAt` (long-standing). WebGL2 only.

## 1. What the class must do

1. Load the single case GLB once per page with GLTFLoader, no decoder.
2. Normalise it: case height 1.0, pivot at the bounding-box centre, back facing +Z, long axis +Y.
3. Find its parts and the shade-coloured material slot.
4. Produce any of the 240 shades for 7 bytes each (the hex): shared geometry and textures, one material per finish, colour per instance.
5. Lay out 24 for a family page in as few draw calls as the parts allow, pick reliably, and promote one for selection effects.
6. Render each shade's colour so the case matches its swatch, measured, not judged by eye.
7. Release everything it allocated.
8. Behave identically with the stand-in.

ciao's way (one label texture and one material per variant, 3 draw calls per can, about 17.5 MB of GPU memory per flavour) is the counter-example (study sections 2 and 3).

## 2. Modules

| File | Exports | Notes |
|---|---|---|
| `src/three/case-asset.ts` | `loadCaseAsset(source): Promise<CaseAsset>` | GLB path and stand-in path behind one function |
| `src/three/stand-in-case.ts` | `buildStandInAsset(): CaseAsset` | Dev and test only; the production build fails if the manifest names it |
| `src/three/case-lineup.ts` | `class CaseLineup` | 24 instances per part, the front pair, colours, finish, poses, picking |
| `src/three/finish-materials.ts` | `getFinishMaterial(finish, tier)` | The material cache |
| `src/three/stage.ts` | `mountStage(el, family, opts): Stage` | Renderer, camera fit, environment, key light, loop, inputs, tier probe, states (family-page.md 2.5) |
| `src/three/calibration.json` | E, K, environment rotation, roughness values, measured errors, model hash | Written by the calibration script, never by hand |
| `src/data/case-model.json` | The manifest (section 3) | Written by the intake; imported into the island chunk at build, so it is never fetched at runtime |
| `public/models/case.lod0.<hash>.glb`, `case.lod1.<hash>.glb` | The model | Content-hashed, served `Cache-Control: public, max-age=31536000, immutable` through `_headers` |
| `scripts/case-model/study/` | The study's own tooling, in the repo since 2026-10-09: `intake.sh`, `verify-case.mjs`, `run-page.mjs`, `case-lineup.html`, `gen-standin.html`, `calib_de.py`, `inspect-glb.mjs`, `compress-test.mjs`, `quant-test.mjs`, `fit.mjs` | Our code only; `run-page.mjs` had its reference-site routes removed. Not yet runnable from the repo: build step 1 ports them (below) |
| `scripts/case-model/` | `intake.sh`, `verify-case.mjs`, `calibrate.mjs`, `contact-sheet.mjs`, `posters.mjs` | The ported intake and verifier, plus the new calibration, contact-sheet and poster scripts |
| `tests/case-model/baseline/` | `calib-summary.json`, `calib-neutral-<family>.json` (ten files, per-shade rendered RGB), `model-size-standin.txt`, `lineup-fit-standin.jsonl` | The study's measurements of our stand-in: calibration A's baseline, the size baseline, the computed lineup fit |
| `tests/case-model/` | Unit tests, the calibration page, Playwright specs | Never in `dist/` |

**Porting the study tooling (build step 1).**
- `run-page.mjs`: the scratch root constant `S` and the `THREE165` path point at this session's scratch; they become the repo's `node_modules/three` and `tests/case-model/`.
- `intake.sh`: reads `shades-240.json` from `docs/data/` instead of its scratch `files/` folder, and writes its output folder outside the repo.
- `verify-case.mjs`: B14 and `--optimise` change from meshopt to quantisation only (`KHR_mesh_quantization`, positions 14 bit, normals 10 bit, UVs 12 bit), LOD0 at 150 KB raw or less and LOD1 at 60 KB raw or less, `TEXCOORD_0` dropped when no shared map is used, and embedded images refused. `--lod1` defaults to 3,500 triangles. Draco and meshopt stay as Node dependencies only to read a supplier file that arrives compressed and to run the simplifier offline.
- Dependencies pinned exactly (security checklist row 18): `@gltf-transform/core`, `@gltf-transform/functions` and `@gltf-transform/extensions` 4.5.1, `meshoptimizer` 0.22.0, `draco3dgltf` 1.5.7 (the versions the study ran).
- `fit.mjs` is the reference implementation of the pose and camera rule in family-page.md 2.5; its output must match `tests/case-model/baseline/lineup-fit-standin.jsonl` until the parameters are retuned on purpose.

Interfaces (shape only, not implementation):

```ts
type Finish = 'matte' | 'gloss';
type Tier = 'high' | 'low';
interface Shade { id: string; index: number; name: string; hex: string; catalog: number } // from shades-240.json
interface CasePart { name: 'body' | 'accent' | 'device'; geometry: BufferGeometry; base: Matrix4; material?: Material; followsShade: boolean }
interface CaseAsset {
  source: 'supplier' | 'standin';
  lods: [CasePart[], CasePart[]];          // [LOD0, LOD1], same parts in the same order; LOD0 may arrive later
  dims: { w: number; h: 1; d: number };    // normalised units
  sizeMm: [number, number, number];
  maps: { orm?: Texture; normal?: Texture };
  dispose(): void;
}
class CaseLineup {
  constructor(asset: CaseAsset, count: 24, opts: { tier: Tier });
  readonly object: Group;                  // add to the scene
  setShades(shades: Shade[]): void;        // 24, catalog order
  setFinish(finish: Finish): void;
  setPoses(pose: (slot: number, out: Matrix4) => void, front: [number, number]): void; // also clears cached bounds
  pick(raycaster: Raycaster): number | null; // slot under the pointer
  warmUp(renderer: WebGLRenderer, scene: Scene, camera: Camera): Promise<void>; // section 7
  dispose(): void;
}
```

## 3. Intake and the manifest

The zip is untrusted input. It is unpacked into a new empty folder outside the repo, nothing from it is executed, and only the verified GLB outputs enter `public/models/`. The intake (`scripts/case-model/intake.sh <zip|glb|folder> [family] [lod1 triangles]`, about 60 s) runs the verifier (zip safety, glTF validity and required extensions, units with mm, cm and inch detection, orientation and camera side, origin and transforms, parts and the Device check, triangles, baked colour, UVs, topology, textures, animations and skins, shipped size), then with `--optimise` writes a quantised LOD0 and a simplified, quantised LOD1 (scaled to metres when needed), then renders the review set (three views matte and gloss, the 390 grid, the 1280 row, the Neutral colour grid, the LOD1 grid). In the study it was run on a good zip (0 fail, 4 warnings, 15 pass), a non-case model (fails the units check: not case-sized), an OBJ-only zip (fails: convert in Blender first) and a millimetre `.gltf` (warns: "scale by 0.001"; outputs came back at 0.077 x 0.163 x 0.0123 m). In the repo the non-case fixture is our own (T11).

The manifest the page imports at build (no runtime guessing in production):

```json
{
  "source": "supplier",
  "lod0": "/models/case.lod0.<hash>.glb",
  "lod1": "/models/case.lod1.<hash>.glb",
  "sha256": { "lod0": "...", "lod1": "..." },
  "orient": [0, 0, 0, 1],
  "sizeMm": [77.0, 163.0, 12.3],
  "parts": {
    "body":   { "node": "Case_Body",   "material": "Shade",  "followsShade": true },
    "accent": { "node": "Case_Accent", "material": "Accent", "followsShade": false },
    "device": { "node": "Device",      "material": "Device", "followsShade": false }
  },
  "triangles": { "lod0": 0, "lod1": 0 },
  "bytes": { "lod0": 0, "lod1": 0 },
  "maps": { "orm": null, "normal": null },
  "instancing": true,
  "caseType": "",
  "device": ""
}
```

`orient` is the quaternion the intake found to bring the long axis to +Y and the camera side to +Z (identity when the file follows the contract). `maps` are separate WebP or AVIF files when present, never images embedded in the GLB. `caseType` and `device` are filled from what the supplier says; the page does not show them in v1.

## 4. Loading

- **GLTFLoader with no decoder.** `KHR_mesh_quantization` is read natively (normalised integer attributes). No `setMeshoptDecoder`, no DRACOLoader, no KTX2Loader in the bundle. The site CSP (`hero-architecture.md` 12.3) allows no `'wasm-unsafe-eval'`, and all three decoders compile WebAssembly, so they would fail on every load. If the supplier's file arrives Draco- or meshopt-compressed, the intake decodes it in Node and writes it quantised; the page never decodes either. A model that still declares `EXT_meshopt_compression`, `KHR_draco_mesh_compression` or `KHR_texture_basisu` as required is rejected by the production build.
- **No embedded images.** GLTFLoader turns images inside a GLB into `blob:` URLs, which `img-src 'self' data:` and `connect-src 'self'` block. Shared maps ship as separate files and are loaded by our code (`ImageBitmapLoader` over `fetch`, which `connect-src 'self'` allows) after the first live frame.
- **Order.** LOD1 first. LOD0 only after the tier probe returns high (family-page.md 2.5), so a low-tier phone never downloads it. One request each, `fetch` with an `AbortController` and a 20 s timeout per file; a 404, a decode error or a timeout rejects with a reason that the stage turns into the "model failed" state.
- **Retries.** A load is memoised per URL for the page's life; "Try again" or the `online` event clears the memo for the failed file only. A rejected `import()` of the island is a "model failed" too: "Try again" re-imports the entry with a cache-busting query (`?r=1`), and a second failure asks for a page reload (family-page.md 5), because a failed dependency chunk stays in the browser's module map.
- The loaded `gltf.scene` is never added to the scene. The class extracts each part's geometry and node world matrix, keeps the optional maps, and disposes every loaded material and any texture it does not use.

## 5. Normalisation (a matrix, never a geometry rewrite)

`KHR_mesh_quantization` stores positions and normals as normalised 16-bit and 8-bit integers, with the dequantising scale and offset in the node transform. Baking a transform into such an attribute (`applyMatrix4`) writes floats into an integer array and clamps them, and de-quantising would double the memory. So the normalisation is a matrix:

1. For each part, `nodeWorld` = the node's world matrix in the file (including the dequantising transform).
2. The case box = the union of every part's `geometry.boundingBox` transformed by its `nodeWorld` (three's `getX` de-normalises when reading).
3. `orient` from the manifest rotates the box so +Y is the long axis and +Z the camera side.
4. `normalise` = scale(1 / box height) x orient x translate(-box centre).
5. Each part's `base` = `normalise` x `nodeWorld`. Every instance matrix is `pose x base`, so the pose's rotations pivot about the case's centre.
6. `dims` = the normalised box: h 1, w and d as measured (the stand-in: w 0.472, d 0.075). family-page.md derives pitch and gap from these, so a different case shape gets a correct layout without new numbers.

Acceptance: for fixtures in metres, millimetres, centimetres, inches and Z-up, the normalised box has height 1 within 1e-6, centre at the origin within 1e-6, and +Z is the camera side.

## 6. Parts and the shade slot

| Part | Found by (production: the manifest) | Gets | Colour |
|---|---|---|---|
| body | Node `Case_Body`, material `Shade` | The finish material | Per instance, the shade |
| accent (optional) | Node `Case_Accent`, material `Accent` | Its own material, re-coloured to a token | Fixed: Urban Slate #383F43, metalness 0.6, roughness 0.35, unless `followsShade` (then per instance like the body) |
| device (strongly recommended) | Node `Device`, material `Device`; the lens bumps are part of the same primitive | One material for glass and lenses | `--night` #050506 with roughness 0.1, so the environment's bright panels reflect in it (R17 in family-page.md); if Sam declines, Urban Slate #383F43 at roughness 0.08. Checked on Slate pages by calibration B (section 10) |

- Each part becomes one geometry (multiple primitives of one part are merged with `mergeGeometries` when their attribute types match; otherwise each primitive is its own instanced mesh and the draw-call budget is re-checked). A separate lens primitive with its own material is not supported: it would add a material group and 2 draw calls for a colour within 1 dE00 of the glass. Kept attributes: position, normal, and uv only when a shared map is used. Vertex colours, extra UV sets, tangents (unless a normal map needs them), morph targets and skins are dropped.
- The body must have a base colour factor of 1, 1, 1, no base colour texture and no vertex colours (contract, verifier check B8): anything baked there would multiply every hex. In development a body that breaks this throws with the part name.
- Development fallback only (the stand-in and quick tests of unprepared files): body = the mesh whose material has no base colour texture and whose surface area is largest; a warning names the choice. Production reads the manifest and never guesses.
- Colours for the accent and the device come from the CLAUDE.md palette tokens and DESIGN.md; nothing invented.

## 7. Making 240 shades from one model

**The default path: instancing.** For each part, two `InstancedMesh` objects share that part's material:
- `row`: LOD1 geometry, 24 instances, one per slot in catalog order.
- `front`: LOD0 geometry (LOD1 until LOD0 arrives, and always at the low tier), 2 instances, for the two slots nearest the selection (section 9).

Per-instance colour on the body (and the accent if it follows the shade) through `setColorAt`, written only when the family is set or a front slot changes; matrices through `setMatrixAt` every frame the loop runs. `frustumCulled = false` on all of them (culling is all or nothing per InstancedMesh, and the line is on screen anyway). Per page: at most 3 parts x 2 meshes = **6 draw calls** for all 24 cases (the stand-in grid in the study: 2 draw calls for 24 cases against ciao's 28 on desktop and 13 on phones).

**Colour pipeline.** Hex (sRGB, as in `shades-240.json`) to `Color.setStyle(hex)`, which with `ColorManagement.enabled` (the default) converts to the linear working space; that linear value goes into `instanceColor`. The body material's own colour stays white, so the diffuse colour is exactly the instance colour. Never call `convertSRGBToLinear()` on top (a double conversion darkens every shade). Output: `outputColorSpace = SRGBColorSpace`, `toneMapping = NeutralToneMapping`, `toneMappingExposure = 1`; the canvas drawing buffer stays sRGB, the same space the CSS swatches are drawn in.

**Finish materials (the cache).** `getFinishMaterial(finish, tier)` returns one shared material per key; every shade uses it:

| Key | Material | Values | Basis |
|---|---|---|---|
| matte, any tier | MeshStandardMaterial | color white, roughness 0.62, metalness 0 | The roughness of the colour test (study section 10); contract range 0.55 to 0.7 |
| gloss, low | MeshStandardMaterial | roughness 0.16, metalness 0 | Study's "glossstd"; contract 0.12 to 0.2 for the low tier |
| gloss, high | MeshPhysicalMaterial | roughness 0.32, clearcoat 1, clearcoat roughness 0.06, metalness 0 | Study's gloss render; contract clearcoat roughness 0.03 to 0.08 |

The optional shared ORM and normal maps, when the model has them, are set on all three. Final roughness values come from the calibration (section 10) and Sam's daylight check, then are frozen in `calibration.json`. A finish change swaps the body material on both body meshes in one frame.

**Programs.** After warm-up the renderer holds exactly 4 programs: body matte, body gloss, accent, device (3 without an accent part). `row` and `front` share a program per material because their geometries carry the same attributes.

**Warm-up (so the first Gloss press never stalls).** `CaseLineup.warmUp()` runs in idle time after the first live frame:
1. Make a hidden `InstancedMesh` with count 1, the body's LOD1 geometry and the other finish's material for the current tier.
2. Call `setColorAt(0, white)` so `instanceColor` exists (the `USE_INSTANCING_COLOR` define must match the live body), and set its instance matrix to scale 0, so it draws nothing.
3. Add it to the live scene, with the environment and the key light already in place (the light count and environment define the program too), and `await renderer.compileAsync(scene, camera)`.
4. Remove it and call its `dispose()` (frees its instance buffers; the material stays in the cache).
5. Record `renderer.info.programs.length`; T15 asserts it does not change on the first finish toggle.

**The fallback path: clones with a small material cache.** Used only if instancing breaks the look, which happens when the real model needs per-case transparency sorting (a clear bumper or window), a material feature that ignores instance colour (transmission, a custom shader), or per-case morphs. Then: 24 clones sharing geometry (`Object3D.clone` shares geometry and material references, as ciao's clones do), each with a body material from a cache keyed `"{shadeId}:{finish}:{tier}"`, at most 48 entries per page (24 shades x 2 finishes), all of one finish sharing one program because their defines match. Up to 72 draw calls (24 x 3 parts); the family-page budget line becomes 72 and the low tier drops to LOD1 for all cases. The switch is the manifest flag `"instancing": false`, never automatic.

## 8. Laying out 24 on a family page, and picking

`CaseLineup.setPoses(pose, front)` takes the pose function of family-page.md 2.5 (slot offset, centredness, promotion G, fan, lift, lean, depth step, scale) and the two front slots. Per frame, for each slot and part: `instanceMatrix = pose(slot) x base(part)`. The row instance of a slot that is currently drawn by `front` is parked: same position, scale 0.0001 (invertible, so picking stays safe, and invisible). The pose function lives in the stage, not in the class, so the same class serves a future single-case view.

**Bounds.** three 0.165.0's `InstancedMesh.raycast` computes `boundingSphere` once, lazily, and returns early when the ray misses it (`src/objects/InstancedMesh.js` lines 166 to 171). With the conveyor every instance moves, so a sphere cached at one selection misses cases at another (for example the 2-instance `front` mesh after a jump from slot 01 to slot 24). So `setPoses` sets `boundingSphere = null` on every mesh it writes, and three recomputes it on the next raycast (24 instances: microseconds). Hover picks for the cursor run at most once per animation frame.

`pick(raycaster)` raycasts `front` then `row` and maps the hit to a slot (`row` instance id is the slot; `front` ids map through the current front pair). Parked instances never win because they are 0.0001 scale.

Checks on the pose (T5): for selections 0, 7, 7.5 and 23 and for s in steps of 0.05 through one move, at the 390 x 450 and 1280 x 728 stages, no two cases' oriented boxes intersect; the front case's box is clear of its neighbours' boxes; every case's screen box lies where family-page.md acceptance 3 and 4 put it.

## 9. Promotion and selection effects

- **Which case is "the front case".** The slot nearest the eased selection, `round(s)`, always at the stage centre (the conveyor). It is drawn by the `front` mesh at LOD0, with the slot on the other side of `s` (`floor` or `ceil`) as the second front instance, so both cases that are partly promoted during a move are at full detail. A slot leaves `front` only when it is a full slot from the selection, at row pose, where LOD0 and LOD1 differ on about 2.1% of pixels, all on silhouettes (study section 10); nothing visibly switches.
- **Effects, all on the front case only, all multiplied by its centredness p:** the pose's lift, scale, 15 degree turn and 3 degree lean (family-page.md 2.5); the pointer tilt toward the pointer (fine pointers, up to 5 degrees of yaw and 3 of tilt, centred on the stage); the 600 ms turn on a finish change or a tap on the front case. No outline, glow, halo, bloom or colour change: the selection reads from position, size and turn (rules 13, 25, 42).
- **Promotion G.** 0 in the poster pose (no case promoted), rising to 1 with the entrance converge, so frame 0 equals the poster.
- **Low tier:** the front case stays at LOD1 (LOD0 is not downloaded) and gloss uses the Standard material.

## 10. Colour management and calibration

**How a shade should read.** The reference is the flat sRGB hex, which is also what every CSS swatch on the page shows. The rendered matte back plate of the front case at its rest pose, sampled at a point clear of the camera cut-out and of the highlight, should be perceptually the same colour as the swatch; the rest of the case shades naturally around it. Gloss has the same base colour plus a specular highlight. The two knobs are global: `scene.environmentIntensity` E and the key light intensity K (plus the environment's rotation so its bright panel sits with the key at upper left). Exposure stays 1.0. There are no per-shade or per-family colour corrections, ever: a table of fixes breaks the moment the lighting changes, and the 240 hexes are the data.

**Calibration A, the pipeline (guards colour management).** Uniform white environment of radiance 1, no key light, orthographic camera, each family as a flat 6 x 4 grid, matte roughness 0.62, Neutral tone mapping, exposure 1. Sample a 3 x 3 px patch at (0, -0.25 h, +d/2) on each back plate (lower centre, away from the cut-out), convert to CIELAB (D65) and compare with the hex as CIEDE2000. The study measured median 1.65, 90th percentile 2.84, worst 3.63, 67% under 2 and 100% under 5 with the stand-in; the per-shade baseline is `tests/case-model/baseline/calib-neutral-<family>.json` and the summary `tests/case-model/baseline/calib-summary.json`. **Pass:** median 2.0 or less, worst 4.0 or less, 100% under 5. This catches a double sRGB conversion, a wrong tone mapper or a baked base colour at once (ACES would read median 6.04; no tone mapping lifts the dark shades, Mahogany #470406 to 84, 48, 48).

**Calibration B, the page look (sets E and K).** The family page's lighting (RoomEnvironment PMREM with blur 0.04, the key at (-2, 3, 4)), each case rendered alone in the front-case rest pose (lift, 15 degree turn, 3 degree lean) through the page camera (4 degrees below, 4 to the left, rolled -8 degrees), in a cell of a 6 x 4 grid per family (scissored viewports, 10 renders for all 240), the same sample point. Grid search E from 0.6 to 1.4 in steps of 0.1 and K from 0 to 1.5 in steps of 0.25; choose the pair with the lowest median dE00 over the 240 shades, subject to three guards: the gloss front case shows a highlight (peak relative luminance on its back 0.9 or more); the darkest shades are not crushed (Mahogany #470406, Midnight #0e1442 and Wine #4b0923 each at dE00 6 or less); and the device glass seen through the cut-out, sampled as a 3 x 3 px patch, has a contrast of 1.5:1 or more against the page neutral on a Pearl and on a Slate page. **Pass:** median 3.0 or less, worst 6.0 or less. These are starting thresholds: they are re-baselined once on the real model, written into `calibration.json` with the model's hash, and then frozen; any later change to the lighting, materials or model must pass them again. Neutral's known weak spot, the brightest saturated shades whose peak channel compresses to 240 (Neon in Blushing Corals #ff7901 rendered 240, 118, 36; Neon in Go Green #26ff00), is expected to be the worst row.

**Calibration C, daylight (Sam).** Six shades side by side with physical cases in daylight: Snow #f0f4f5, Sky #08bcf4, Rouge #f2638f, Mango #ff9f40, Charcoal #393f44 and Neon (Go Green) #26ff00. Only roughness and the E and K pair may change as a result, never a hex.

**Known data issue.** Royal and Midnight in Vivid Violets share #492376 (shades-240.json `issues`). The two cases render identically until the real Royal hex arrives; the contact sheet asserts they are identical so the issue stays visible, and the test is updated when the data is.

## 11. What the stage owns (for reference; specified in family-page.md 2.5)

- **Renderer.** WebGL2, `antialias: true`, `alpha: true`, clear alpha 0, `powerPreference: 'default'`, `failIfMajorPerformanceCaveat: true` (a software renderer means swatch grid mode; tests pass `?render=force` to allow SwiftShader). No EffectComposer, no post-processing, no shadows. Pixel ratio: cap 2 on the phone layout or a coarse pointer, 1.5 on the wide layout with a fine pointer, 1 at the low tier. Neutral tone mapping. Render on demand only.
- **Environment.** `new PMREMGenerator(renderer)`, then `fromScene(new RoomEnvironment(), 0.04)`: a 768 x 1024 half-float cube-UV target, about 6.3 MB of GPU memory by the study's measure of the same target size. Then, at once, `pmremGenerator.dispose()` (its blur material and lod-plane geometries) and `roomEnvironment.dispose()` (its box geometries and materials). Only the PMREM target stays. One directional key.
- **Counts, asserted by T4 after that disposal and the warm-up:** `renderer.info.programs.length` 4 (3 without an accent part); `renderer.info.memory.geometries` equal to the number of distinct part geometries across both LODs (6 for a model with body, accent and device at two LODs; 5 for the stand-in, whose device is one mesh at both LODs); `renderer.info.memory.textures` 1 (the PMREM target) plus the shared maps; draw calls 6 or fewer.
- **Tier probe.** As family-page.md 2.5: the display period from 10 unrendered frames, then 20 forced renders timed against it (GPU time through `EXT_disjoint_timer_query_webgl2` where it exists).
- **Context loss.** `webglcontextlost` is prevented and the loop stops (the stage shows the poster). On `webglcontextrestored` a new PMREMGenerator and RoomEnvironment are created, the environment regenerated and both disposed again, instance attributes flagged for upload, the warm-up re-run, and one frame rendered. A second loss in a session moves the page to swatch grid mode and disposes everything.
- **Boot.** The stage yields to the main thread between the island import, the PMREM generation, `compileAsync` and the first frame, so no task exceeds 200 ms on the reference Android (family-page.md acceptance 8).

## 12. Disposal and lifecycle

- `CaseLineup.dispose()`: `InstancedMesh.dispose()` on all six meshes (frees the instance matrix and colour buffers), removes them from the scene.
- `CaseAsset.dispose()`: every part geometry of both LODs, the optional maps, the cached finish materials and the accent and device materials.
- `Stage.dispose()`: the above, the PMREM target (the generator and RoomEnvironment were disposed at creation), listeners (resize, pointer, visibility, intersection, motion preference, context loss), then `renderer.dispose()` and `renderer.forceContextLoss()` so a phone gets its GPU memory back.
- **When:** on any switch to swatch grid mode (model failure after the canvas existed, second context loss, low tier still too slow); on `pagehide` when `event.persisted` is false. On `pagehide` with `persisted` true (back-forward cache) only the loop stops; on `pageshow` with `persisted` true the stage checks `gl.isContextLost()` and rebuilds if needed. No `unload` listener (it blocks the back-forward cache).
- Each family page is its own document, so moving between families tears down and rebuilds; the GLB and the three chunk come back from the HTTP cache (immutable, content-hashed).
- **Check:** after `Stage.dispose()`, `renderer.info.memory.geometries` and `.textures` read 0; 20 rounds of grid mode to 3D and back leave the JS heap within 5 MB of the first round (Chromium `performance.memory`).

## 13. The stand-in (until the zip arrives)

A procedural case built in code at runtime by `buildStandInAsset()`, returning a `CaseAsset` with `source: 'standin'`, the same parts, the same normalisation and the same `dims` contract, so `CaseLineup`, the stage, the calibration and every test run unchanged when the real model replaces it. It follows the study's fixture recipe (`scripts/case-model/study/gen-standin.html`, our own code), plus a Device part.

| Part | Shape (millimetres before normalisation) | LOD0 | LOD1 |
|---|---|---|---|
| Case_Body (material Shade) | Back plate and side walls as one part. Outline 77 x 163, corner radius 12, depth 11.2 (12.3 with the bevels), wall 1.6, back 1.3, a lip on the front edge. Camera cut-out in the back: a 40 x 40 rounded square, radius 10, 7 from the top and left edges as seen from the back (+Z) | Extrude with 10 curve segments and 3 bevel segments: 5,456 triangles (study) | 4 curve segments, 1 bevel segment; triangle count measured at build, target 2,500 to 3,800 for body plus accent plus device |
| Case_Accent (material Accent) | A camera ring 1.6 wide around the cut-out, 1.2 deep, proud of the back | Same settings: 2,064 triangles (study) | As above |
| Device (material Device) | A phone in the cavity: rounded box 73.4 x 159.4 x 8.0, corner radius 10.4, its back 0.2 behind the case's inner back surface, so the cut-out shows dark glass instead of the page; three lens discs of radius 6, 1.2 proud, centred at (10, 10), (10, 30) and (28, 20) from the cut-out's top-left corner, merged into the same primitive | 2,000 triangles or fewer | Same mesh |

- Normals: creased at 35 degrees (flat back, soft bevels), vertices merged at 1e-4; planar UVs from the back, 0 to 1 (good enough for a fixture; its UVs overlap by construction, which the verifier flags, as it should).
- Colours: body white (shade per instance), accent and device as in section 6.
- Cost: its build time is measured at build and logged; its code pulls `ExtrudeGeometry` from three core and `BufferGeometryUtils` from the addons, which the production bundle does not need.
- **Never ships.** `source: 'standin'` in the manifest fails `astro build` for production; the stand-in module is imported only from development and test entry points; acceptance 10 of family-page.md greps `dist/` for `standin`. The stand-in exists to build and test the page, not to represent the product (CLAUDE.md rule 38).

## 14. Test plan

| # | Test | Where | Pass |
|---|---|---|---|
| T1 | Normalisation on fixtures in m, mm, cm, inch and Z-up, float and quantised | Unit (no WebGL) | Height 1 within 1e-6, centre at origin within 1e-6, camera side +Z |
| T2 | Part identification: manifest path; development fallback on unnamed fixtures; a body with a base colour texture throws | Unit | As stated |
| T3 | Colour conversion: `setStyle('#ffffff')` gives 1, 1, 1; `#0040c1` gives the sRGB transfer function's linear values within 1e-6; no second conversion anywhere in the code path | Unit | Exact |
| T4 | Renderer probe on Blissful Blues at 390 x 844 and 1280 x 800 (`?render=force`), after the PMREM disposal and the warm-up | Playwright | Draw calls 6 or fewer; programs 4 (3 without an accent); geometries as section 11; textures 1 plus maps; triangles per frame 24 x LOD1 + 2 x LOD0 or fewer |
| T5 | Pose checks for selections 0, 7, 7.5 and 23 and through one move in steps of 0.05, at the 390 x 450 and 1280 x 728 stages; `fit.mjs` output matches `tests/case-model/baseline/lineup-fit-standin.jsonl` | Playwright and unit | Section 8 |
| T6 | **Contact sheet, all 240.** `scripts/case-model/contact-sheet.mjs` renders each family as a 6 x 4 grid under calibration A and again under calibration B, tiles the ten grids 2 x 5 into one PNG per calibration with each case's CSS swatch drawn beside it, samples every back plate, and writes `contact-sheet-A.json` and `-B.json` (per shade: id, name, hex, rendered RGB, dE00) | Playwright, SwiftShader | A: median 2.0 or less, worst 4.0 or less, 100% under 5. B: median 3.0 or less, worst 6.0 or less, device glass 1.5:1 or more against both neutrals. On failure the ten worst rows are printed with hex and rendered RGB, as the study's summary does |
| T7 | Finish: matte against gloss at the sample point; gloss highlight present | Playwright | dE00 3 or less between the two away from the highlight; gloss peak luminance 0.9 or more |
| T8 | LOD swap: front case rendered at LOD0 and LOD1 at one slot from the selection | Playwright | 2.1% of its pixels differ or fewer |
| T9 | Context loss through `WEBGL_lose_context`, then restore | Playwright | Poster shown during loss; frame after restore within 0.5% of pixels of the frame before; T4's counts hold again |
| T10 | Disposal and leaks | Playwright | Section 12 check |
| T11 | Intake on four of our own fixtures: a good zip of the stand-in; the stand-in scaled by 10 (1.63 m tall, a non-case model); an OBJ-only zip of the stand-in; the stand-in exported in millimetres as `.gltf` | Node | Pass; fail on units; fail on format; warn with scale 0.001. No reference-site model is used, here or anywhere in the repo |
| T12 | The real model on one mid-range Android (Moto G class) and one iPhone, traced with the GPU: island boot and dragging | Manual, once the model is in | No main-thread task over 200 ms from import to first live frame; while dragging, 95% of rAF intervals within 1.25 display periods (no dropped frames at the device refresh), or GPU time 12 ms or less where the timer query exists; otherwise the tier thresholds are revisited. SwiftShader numbers are not evidence (557 and 805 ms for the same scene in the study) |
| T13 | Royal and Midnight (Vivid Violets 19 and 20) render identically | Part of T6 | Equal until the data changes |
| T14 | Picking after moves: at 1280 x 800, select 01, jump to 24 and to 12 with the scrubber, click the front case each time; at 390 x 844, after moves to 04 and to 20, tap every visible case | Playwright | Every pick returns the slot under the pointer (front case: the front slot) |
| T15 | Warm-up: record the program count after `warmUp()`, then press Gloss, then Matte | Playwright | `renderer.info.programs.length` unchanged; no frame over 2 display periods on the toggle |
| T16 | CSP: load the 3D path under the production CSP with a `securitypolicyviolation` listener; a model declaring `EXT_meshopt_compression` as required | Playwright and build | Zero violations; the build rejects the meshopt model |

## 15. Asset requirements from the user's zip

What we need (the contract the intake checks, in full: `docs/specs/case-asset-contract.json`):

1. **One `.glb` (glTF 2.0)**, plus the source file (`.blend` or `.fbx`) for later fixes, and the licence for web use. FBX, OBJ, USDZ or STEP alone are converted in Blender before intake (Blender is not installed in this sandbox).
2. **The case type and device it models** (for example Tough on iPhone 17 Pro), named by the supplier.
3. **Real size in metres**, +Y the long axis, thickness on Z, the back (camera side) facing +Z, the camera cut-out at the top left when seen from the back, origin at the bounding-box centre, transforms applied, no negative or non-uniform scale.
4. **At most 4 parts:** `Case_Body` (material `Shade`, required: back, walls, lip and buttons as one primitive); `Case_Accent` (optional: camera ring, lens surround, the MagSafe ring on MagTough); `Device` (strongly recommended, 2,000 triangles or fewer, glass and lens bumps as one primitive, so the cut-out never shows the page).
5. **Triangles:** LOD0 8,000 to 10,000 per case (24 to 32 segments per rounded corner, 6 to 8 on the edge profile, within that cap); LOD1 2,500 to 3,800 (we generate it if only one arrives). These caps follow from the raw byte budgets: quantised, the stand-in costs about 15.3 B per triangle (`tests/case-model/baseline/model-size-standin.txt`). The verifier passes 20,000 or fewer and warns up to 60,000; the intake simplifies to the caps.
6. **Materials:** the body plain PBR with base colour factor 1, 1, 1, no base colour texture, no vertex colours, metallic 0, roughness about 0.6, opaque, single-sided. Matte, Gloss and Sylvr are code parameters, not separate files.
7. **UVs:** one set, 0 to 1, no overlap on visible outer surfaces, the back plate the largest island (40% of the square or more).
8. **Textures:** never a texture per colour, and no images embedded in the GLB. Optional: one ORM and one normal map at 1024 px or less, WebP or AVIF, 150 KB or less together, shared by every shade, as separate files. No KTX2.
9. **Compression:** none needed from the supplier; any compression is decoded at intake and the shipped files carry `KHR_mesh_quantization` only.
10. **Strip:** animations, skins, morph targets, cameras, lights, extra UV sets, vertex colours, hidden helpers.
11. **Size after our pass:** LOD0 150 KB raw or less, LOD1 60 KB raw or less (raw until a deploy shows `.glb` responses compressed).

**Until it arrives:** the stand-in of section 13 stands in for development and every test except family-page.md acceptance 3, 4 and 7's "with the real model" clauses and A5. The pages do not launch with the stand-in.

**When it lands:** run the intake; if it fails, send the supplier the verifier's report (it names the check and the fix); if it passes with `--optimise`, review its renders (three views and the 390 grid against the product), write the manifest, run calibration A and B, re-render the posters, re-run T4 to T9 and T14 to T16, and screenshot the three test families at the acceptance sizes. If the verifier warns that there is no Device part, ask the supplier for one before launch.

## 16. Build plan for the class

Steps 1 to 4 belong to run 1 of family-page.md 11 (behind a dev flag, never in the production bundle); steps 5 to 10 to run 2.

1. Port the study tooling (section 2) and pin its dependencies; T11 on our own fixtures.
2. `loadCaseAsset` for the stand-in path, normalisation as a matrix, parts; T1 to T3.
3. `CaseLineup` with instancing, colours, the finish cache, picking with cleared bounds and the warm-up; T4, T14, T15.
4. Front pair at LOD0, parking, effects hooks, the pose and camera rule checked against `fit.mjs`; T5 and T8.
5. Calibration page and `contact-sheet.mjs`; run A on the stand-in (expect the baseline's 1.65 / 3.63); tune B; write `calibration.json`; T6 and T7.
6. GLB path: GLTFLoader with no decoder, the manifest import, the 20 s timeout, retries and the cache-busting re-import; a quantised fixture generated from the stand-in through the intake proves it end to end; T16.
7. Tier probe, LOD0 after the high verdict, boot yields.
8. Lifecycle, context loss, disposal; T9 and T10.
9. Production guards: the build fails on a stand-in manifest, on a model that requires a decoder, and on embedded images.
10. When the zip arrives: section 15, then T12 on devices.
