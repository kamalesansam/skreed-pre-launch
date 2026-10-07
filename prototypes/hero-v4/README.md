# Hero prototype v4: three landscapes (2026-10-07)

Live: https://claude.ai/artifact/QDXUhF32ZLd7L9a5ccDnq8 (version 5). Tune → World switches; `?world=basalt|salt|peaks` opens on one (combine with `&blocks=10|20|30`).

All three are generated in code (no model files, a few KB each), matte, and neutral (slate, charcoal, haze), so the logo's ten shades remain the only colour. Fog and background colour are set per world.

1. **Basalt** (default). About 12,800 hexagonal columns (7,000 on touch devices) in one instanced draw. Heights: terraced noise, a crater with a raised rim under the logo, ground falling away towards the viewer, rising to the sides and the horizon. Lit from above-left with a strong sky light so the column tops read.
2. **Salt flat.** One shader plane: Voronoi ridges of varying thickness (the raised crust of a real salt pan), grain and broad tonal drift, ridges fade out by 90 units so they never shimmer, the near crust sits in dusk shadow. Two stepped silhouette ridgelines of flat-topped mesas on the horizon.
3. **Peaks.** A displaced grid with jittered vertices and flat shading (low-poly facets), a wide valley floor under the logo, ridged mountains from 55 units back and beyond 32 units to the sides, tone by height, raking sun from the left.

Known next steps: the hero copy's readability on the salt flat sub-line, a low sun or atmospheric depth pass, and how each world looks on the pull-back (scroll 1.5 screens).
