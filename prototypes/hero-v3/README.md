# Hero prototype v3 (2026-10-07)

Live: https://claude.ai/artifact/QDXUhF32ZLd7L9a5ccDnq8 (version 3). Tune → Blocks switches 10 / 20 / 30; `?blocks=10` in the URL opens on one.

- **Three cuts, all equal area.** 10 blocks (84,574 sq SVG units each), 20 (42,287), 30 (28,191). Same method as v2 (`slice3.py`): bisection along the logo's 30/150/90 degree grid, one half sliced and rotated 180 degrees for the other. Colour areas: blocks ordered clockwise from the top and grouped into ten equal runs, so each family shade owns 1, 2 or 3 blocks.
- **3D texture, not a painted pattern.** `mesh3.py` gives every block a Delaunay-triangulated front face (facets about 0.16 world units). In the browser each facet vertex is lifted by its own height (smooth noise plus a random step) and the rim is chamfered down, so the face is real chiselled relief. Normals come from the geometry itself, flat per facet, lit by a raking matte key light. Relief depth is a Tune slider (0 gives v2's flat block); fine grain stays as a subtle albedo variation.
- Everything else (igloo hover maths, glow, the wipe into the Wall) is unchanged from v2.

Rebuild: `python3 mesh3.py` (needs scipy, shapely, svgpathtools; writes `pieces_all.json`), copy to `pieces.json`, then `python3 build.py`.
