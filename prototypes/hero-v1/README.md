# Hero prototype v1

The Skreed logomark cut into blocks along its own 30 degree lines, extruded, merged into one mesh, with an inner glow in a chosen shade, a cursor push, a field of the 240 shades in fog, and a scroll pull-back. Plain three.js 0.165, no framework. Published privately at https://claude.ai/artifact/QDXUhF32ZLd7L9a5ccDnq8

- `slice2.py` cuts `logomark.svg` into pieces (needs shapely, svgpathtools); `pieces.min.json` is its output.
- `template.html` is the page; `index.html` is the template with the pieces and shades inlined.
- `shot.mjs` renders it in Playwright Chromium with three.js served from node_modules.

Not in v1: the transition into section 2, a poster image and no-WebGL fallback, the production loading path.
