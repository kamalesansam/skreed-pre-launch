# Stage 1 reference: hero prototype v9.10 (pinned)

The approved hero prototype as Sam approved it on 2026-10-09, frozen for the port's stage 1 parity gate (`docs/specs/hero.md` section 7, `docs/specs/hero-architecture.md` 13.1). Do not edit these files. They are test inputs, not source.

## Why it is pinned here

The port is graded against v9.10. At 17:26 on 2026-10-09 the v10 igloo-intro build replaced `prototypes/hero-v9/index.html` and `template.html` in place (commit 2038bef). Every unit test and parity spec that read the reference from that path then compared the port against v10, and failed for reasons that had nothing to do with the port. The tests now read the reference from this folder, so later changes under `prototypes/` cannot move it.

v10 joins the port later through the intro slot (`hero-architecture.md` 11.1), with its own pinned reference (for example `tests/fixtures/hero-v10/`) and its own gate. Stage 1 parity stays on v9.10.

## Provenance

Taken with `git show ccce3fb:prototypes/hero-v9/<file>` from commit ccce3fb ("Hero v9.10 with Sam's locked terrain values; final Astro port plan", 2026-10-09 10:35 UTC), which is also 2038bef~1. Git stores each file as the same blob as in that commit, so the copy adds no size to the repository.

| File | Bytes | Git blob | SHA-256 |
|---|---|---|---|
| `index.html` (the built v9.10, assets inlined) | 3,454,906 | 9cf4e890f4bccb7ce6c4852bb1ba5df922461993 | 29daf8815578061b7ea23450e7e08277a6c20a6e6ef5e3b3aa9ec3a45b956416 |
| `template.html` (its source) | 116,079 | 90f9925aa5e00c66b022ffebc2ea3be0046c04b6 | 9b31a19a6594a64774ea0877e940db16fbadb71154c89975cffbcdc00b9d19b4 |

- `SHA256SUMS` lists the two files above. `(cd tests/fixtures/hero-v9.10 && sha256sum -c SHA256SUMS)` checks them.
- `assets.SHA256SUMS` lists the v9.10 asset files (`prototypes/hero-v9/assets/*` and `pieces.json` at ccce3fb). The port's stage 1 copies in `src/assets/hero/` must match it byte for byte. The asset bytes are not copied here: they are the same blobs as `src/assets/hero/`.

`tests/harness/reference.ts` holds the same hashes as constants and checks the files every time a test reads them, so a changed file fails loudly instead of moving the reference.

## Who reads it

- `tests/harness/prototype.ts` (`servePrototype`): every parity and e2e spec that loads the prototype, and `scripts/hero/render-poster.mjs --prototype`.
- `tests/unit/proto-source.ts`: the GLSL, wipe, maths, params, wordmark and loader unit tests, and `scripts/hero/gen-glsl.mjs`.
- `tests/unit/block-colours.test.ts` (the inlined `FAMILIES`) and `tests/unit/assets-manifest.test.ts` (`assets.SHA256SUMS`).
- `scripts/hero/copy-stage1-assets.mjs`, which refuses to copy asset bytes that differ from `assets.SHA256SUMS`.
