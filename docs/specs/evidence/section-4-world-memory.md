# Section 4, part two: GPU memory at land 1 (spec 6, "GPU memory, phone")

Measured 2026-10-21 on `s4/world-wire` at `ec030cb`, on a `build:test` page with the four approved lands (N = 4). The page ran at 390 x 844 in Playwright's Chromium on the Metal GPU (Apple M3 Pro), with the hall walked to the station and the entry ended by Skip.

## What was read

- **`renderer.info.memory`**, through `window.__skreedGpu()`. This is a hooks-only reading added on this branch in `src/scripts/hero/bridge/hooks.ts`, folded away in production. It gives the one renderer's resident geometries and textures, and its programs.
- **The world's own byte count**, through `__s4.state().world.memory`. Its parts:
  - the world target: RGBA8 colour plus 24-bit depth, stored in 4 bytes;
  - the garden's plate and three cards, with their mips;
  - the resident lands' pictures with mips, and their single-channel depth maps;
  - the bloom.

| | DPR 1 (canvas 390 x 844) | DPR 1.25, touch (canvas 487 x 1055) |
|---|---|---|
| `renderer.info.memory` at the station, before the press | 56 geometries, 59 textures, 44 programs | 56 geometries, 59 textures, 44 programs |
| `renderer.info.memory` at land 1, after Skip | 57 geometries, 58 textures, 44 programs | 57 geometries, 58 textures, 44 programs |
| the world target | 2,633,280 B (2.51 MiB) | 4,110,280 B (3.92 MiB) |
| the garden, at the station | 30,461,323 B (29.05 MiB) | 30,461,323 B (29.05 MiB) |
| the garden, at land 1 | 0 (freed) | 0 (freed) |
| the lands, at the station (land 1, portrait) | 4,972,800 B (4.74 MiB) | 4,972,800 B (4.74 MiB) |
| the lands, at land 1 (lands 1 and 2) | 9,945,600 B (9.49 MiB) | 9,945,600 B (9.49 MiB) |
| the bloom | 0 (none on touch, none on a land at rest) | 0 |
| **the world's count at the station, before the press, through the entry** | 38,067,403 B (36.30 MiB) | 39,544,403 B (37.71 MiB) |
| **the world's count at land 1** | 12,578,880 B (12.00 MiB) | 14,055,880 B (13.40 MiB) |

**Further lands.** A land in the middle keeps three lands resident, the previous, current and next: 14,918,400 B for the pictures. That makes the world's count 18.1 MiB at DPR 1.25.

**The contrast run.** At DPR 1 it read the same: 57 geometries, 58 textures (57 on the final build), 44 programs, the target 2,633,280 B, the garden 0 and the lands 9,945,600 B. It reached land 1 through the entry clock, not Skip.

## Against spec 6

The spec sets 48 MiB or less for section 4's resident set on a phone. Its own estimate:

| Part | Spec estimate | Measured |
|---|---|---|
| the world target | about 3.9 MiB | 3.92 MiB at DPR 1.25, as estimated |
| three pictures with mips | about 15 MiB | 14.2 MiB for three |
| the garden | about 24 MiB | **29.05 MiB**, over the estimate by 5 MiB; it is resident only from the walk's phase 2 until land 1 |
| A's grid and points | about 2 MiB | not counted by either reading (geometry buffers) |

**What the world's count leaves out.** It does not count the hall's own resources. They are estimated from their sizes, not measured:
- the lightmap, 1024 x 1024 RGBA8 with mips: 5.33 MiB;
- the hall's target at DPR 1.25: 3.92 MiB;
- the output pass's target: 1.96 MiB;
- the floor's 128 px cube with mips: 0.5 MiB;
- the bubble's pass: 1.96 MiB.

That is about 13.7 MiB, resident from the walk on.

**Totals, with the hall's estimate added.**
- At the station and through the entry: about **51 MiB**. The garden is resident there, and that is what puts it over 48.
- At land 1: about 27 MiB.
- At a middle land: about 32 MiB.

## A defect fixed on the way

Before `fb11eee`, Skip, Escape and the review hooks ended the entry without the world's clock reaching land 1, so the garden stayed resident: 29.05 MiB more at every land, about 56 MiB in all. The director now frees it when the entry ends either way. Then `ec030cb` makes a land whose picture failed draw again once the garden it stands on has decoded again; before that, its text stood on Urban Slate.
