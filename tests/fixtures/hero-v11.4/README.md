# Prototype v11.4, pinned (the round-3 hero port's parity reference)

Taken from `prototypes/hero-v9/` at commit `ac9c612` (2026-10-14, "Round 2 after ciao"), byte for byte: the same git blobs, so the copy costs the repository nothing (as `tests/fixtures/hero-v9.10/` did for stage 1, hero-architecture.md 17.2 note 18).

- `index.html`: the ship build (`SHIP=1 python build_v11.py <bake dir> template_v11.html index.html`, then `s2/embed_family.py`): test hooks stripped, the family-pages prototype embedded as a non-executed `familyDoc` block. The hooks that stay are the ones outside `/*TEST*/` markers: `__skreedFreeze`, `__skreedState`, `__skreedFrame`, `__skreedSolo`, `__skreedFloorCheck`, `__skreedProject`, `__skreedLogo`; `?intro=0` skips the intro, `?<param>=` overrides a P value.
- `template.html`: the readable source (`template_v11.html`, built from `template_v10.html` by `s2/patch_v11.py` with `s2/s2chunk.js`).
- `SHA256SUMS`: `tests/harness/reference.ts` checks these on every read and throws on any difference.

What the port is measured against here (tests/parity/*11*.spec.ts): the rest frame with the intro skipped, the pull-back camera along the weaving curve, the first wipe at tp 0.5 and 1, the settled gem field, and the ciao scroll cue. The intro's own frames are not compared pixel for pixel: the ship build has no seek hook, and the intro clock is frame-time dependent.

Restore after an in-place replacement: `git show ac9c612:prototypes/hero-v9/index.html > tests/fixtures/hero-v11.4/index.html` (and `template.html`).
