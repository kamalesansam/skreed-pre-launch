# Section 5's jar frames

The four glass jars of the sign-up section are pre-rendered images, one per fill state, made to look like the jars in
Sam's picture of 2026-11-02: clear glass with dark edge bands, two soft highlight bands and tiny white speculars, satin
plastic pellets, a soft shadow wedge to the right and a glossy floor that reflects the fill's colour under the jar.

The shipped files are in `src/assets/signup/jars/`:

- `jar-<state>-<1x|2x>.<avif|webp>` for the 16 states `0 f y i fy fi yf yi if iy fyi fiy yfi yif ify iyf`. A state is
  the press order, bottom layer first: `f` Facebook, a quarter of blue; `y` YouTube, a quarter of red; `i` Instagram, a
  half of one mixed lot of pink and purple grains (about 2 pink to 3 purple, evenly through the layer). A quarter fills
  0.235 of the inner height (the inner floor to the lip's top), so three follows reach 0.94. Jars 1, 2 and 3 use `f`,
  `y` and `i`; jar 4 starts at `0`.
- The frame is 400 x 480 px at 2x (200 x 240 at 1x) on a transparent background: the jar's axis at the centre, its
  body half the frame's width, the axis's floor point at 0.87 of the height, the shadow inside the frame to the right.
- `jars.json`: the frame, the jar's measured box (`jar.x0 x1 y0 y1`, fractions of the frame) and per state `top` (the
  first row from the top that differs from the empty jar: the fill's topmost grain; for `0`, the lowest row a first
  press changes) and `seam` (below it every state built on this one is pixel-identical to it in the masters).

## Rebuilding

Blender 5.2 (headless, Cycles on the CPU) and Node with the repository's `sharp`:

```sh
bash scripts/signup/jars/run.sh            # pack, render, compose and install (all)
bash scripts/signup/jars/run.sh render     # one step: pack | render | compose
BLENDER="/path/to/blender" SAMPLES=64 bash scripts/signup/jars/run.sh
```

1. `pack.py` fills the whole jar once with about 13,000 pellets by a seeded deposition on a height field (no physics
   engine; the same seed gives the same pile). Every state is cut from this one pile, so every follow order shares the
   same grains.
2. `render.py` renders the states in one Blender process: the pellets whose centres lie below the state's level, each
   coloured by the band it falls in. A state with a prefix renders only the band its last press adds.
3. `compose.mjs` builds each frame: the empty jar above the fill, the state's own band, the prefix state's finished
   frame below the prefix's seam (feathered over 4 rows above it), then under the jar the shared shadow wedge and the
   floor's reflection drawn in 2D. It checks that every state equals its prefix below the seam, encodes AVIF and WebP
   at 2x and 1x (the 1x is the 2x downscaled) and writes `jars.json`. `--compare <dir> --picture <png>` also writes
   comparison sheets against the picture.

`jarlib.py` holds the jar's lathe profile (traced from the picture: body radius 1.0, height 3.935, a thick base, a
rolled lip) and the pellet mesh. Intermediates go to `scripts/signup/jars/work/` (git-ignored).
