# Section 4 measurements: the grey hall, merged

Date: 2026-10-16. This document merges six measurement reports into one text the section 4 spec can cite. Nothing was measured anew here except five repo facts checked by grep (noted where they appear). Every number keeps its source report and the method that produced it.

Source reports, all under `scratchpad/s4/`:

| Tag | Report | What it measured | How |
|---|---|---|---|
| G | `geometry.md` | the hall mesh | `hall_geometry_s4.py`, pure python, plane slices and face tables of `hall.obj` read as text |
| L | `light.md` | the baked textures, the shader, our material recipe | `hall_measure.py`, `hall_plots.py`, `hall_floorlights.py`, `hall_seams.py`; UV to 3D mapping of every texel |
| C | `camera-post.md` | the storyboard, the camera, the post chain | `storyline_eval.py`, `obj_bbox.py`, `obj_xprofile.py`; the demo's scripts and shaders read as text |
| I | `interaction.md` | Roblox prompt, walking, scroll, reduced motion, white-out | official pages read with a fetcher or in the browser pane; two live sites probed at 375 x 812 CSS px |
| P | `products.md` | the Skreed catalog, the renders, the case models | `pdftext.swift` (PDFKit), `glbjson.py` (GLB JSON chunk only) |
| B | `pipeline.md` | how to build and ship the hall inside the site's rules | Blender 5.2.2 bakes, sharp encodes, esbuild bundles, `budget.mjs` on the dist |

Rules kept by every report: the reference copy was read as data only; nothing was executed from it and nothing was copied out of it. The repository was read, not edited.

Units. "u" is one OBJ unit of the reference mesh. "m" is one scene unit after the demo centres the mesh and scales it to 4 units high. Scale = 4 / 8.0553 = 0.49656 (G, from the bounding box; C computes 0.49657; the task text says 0.4966). Conversion (G, bounding box centre (-0.020, 4.028, 0.451) u): scene x = (obj x + 0.020) x 0.49656; scene y = (obj y - 4.028) x 0.49656; scene z = (obj z - 0.451) x 0.49656. Whether a scene unit is a real metre is unknown (G, L, C). The OBJ header says centimetres; the demo ignores it (G). Report B writes OBJ units as "m"; this document reads those as "u" (see 9.1).

Luma is Rec.601 on 0..255 sRGB as stored in the JPEGs (L). FOV is three.js vertical FOV in degrees (C). "px" is device pixels unless marked CSS px (C).

---

## 1. The hall

### 1.1 Dimensions in scene units

| Item | Scene (m) | OBJ (u) | Source and method |
|---|---|---|---|
| Bounding box, x by y by z | 12.217 by 4.000 by 4.176 | 24.60 by 8.055 by 8.41 | G (vertex extents), C (`obj_bbox.py`), B (`measure_obj.py`) |
| Interior box, wall face to wall face | 11.88 long, 3.15 wide, 3.99 high | 23.93 by 6.34 by 8.03 | G, slice at y = 0.30 u and horizontal face table |
| Floor top | y = -2.000 | y = 0.000 | G, horizontal faces facing up |
| Ceiling underside | y = +1.988 | y = 8.031 | G, horizontal faces facing down |
| Fixture tops, hidden above the ceiling | y = +2.000 | y = 8.055 | G |
| West end wall, base plane | x = -5.952 | x = -12.006 | G, slice |
| East end wall, base plane | x = +5.932 | x = +11.926 | G, slice |
| West end panel face | x = -5.836 | x = -11.773 | G, slice |
| East end panel face | x = +5.816 | x = +11.692 | G, slice |
| Side wall base planes | z = -1.575 and +1.574 | z = -2.720 and +3.621 | G, slice |
| Corridor centre line | z = 0.000 | z = 0.451 | G |
| East side panel faces | z = -1.464 and +1.464 | z = -2.497 and +3.399 | G, slice |
| West side panel faces | z = -1.522 and +1.522 | z = -2.615 and +3.517 | G, slice |
| Transept slot, x range | -2.924 to -2.271 | -5.909 to -4.593 | G, slice |
| Transept slot, far ends (open) | z = -2.088 and +2.088 | z = -3.754 and +4.656 | G, slice |
| Floor slots under the end walls | x -6.11 to -5.95 and 5.93 to 6.08, y -2.00 to -1.91 | 0.313 u deep, 0.19 u high | G, slice at y = 0.10 u |

Clear width on the centre line, by stretch (G, slices at y = 1.00 to 7.50 u): 3.00 m between the end-panel returns (6.04 u), 3.04 m between the west panels (6.12 u), 3.15 m at bare base wall (6.34 u), 2.92 m between the east panels (5.88 u). The transept stretch is open on both sides.

The mesh: 3137 vertices, 3886 UVs, 3153 normals, 3878 faces (3877 triangles and 1 heptagon; 3882 triangles after fan triangulation), one group, one material (G, B, L; see 9.17). It is a single-sided interior shell. No wall has thickness. There is no exterior. Face normals from winding agree with the file's normals at 11531 of 11616 corners (G).

Surface area: 867.1 u^2 = 213.8 m^2 in all; floor 157.3 u^2 = 38.8 m^2; ceiling 159.1 u^2 = 39.2 m^2 (G, face areas).

### 1.2 The plan

The long arm is the corridor along x. The short arm is one narrow slot through both side walls (G):

- Opening in the side walls: x = -5.909 to -4.593 u, width 1.316 u = 0.653 m, centre x = -5.251 u = -2.60 m scene.
- Depth beyond the base wall line: 1.034 u south and 1.035 u north (0.513 and 0.514 m), out to z = -3.754 and +4.656 u (scene minus and plus 2.088).
- Full height, floor to ceiling. The slot walls at x = -5.909 and -4.593 u run y 0.02 to 8.02 u; each x plane holds 16.26 u^2 (4.0 m^2).
- Floor and ceiling continue into the slot (1.30 u^2 and 1.32 u^2 per side).
- Far ends: no faces at z below -3.70 or above 4.60 u (12 slivers of 0.0003 u^2 in all). The slot is open to the void. Nothing is modelled beyond it. L confirms from the texture: 12 z-facing texels beyond |z| = 1.9 m, which is nothing.
- Cross span tip to tip: 8.41 u = 4.18 m, against the corridor width of 6.34 u = 3.15 m.
- The cross is off centre: 6.097 u (3.03 m) from the west end wall, 16.519 u (8.20 m) from the east end wall. It sits in the western quarter of the hall.

Schematic plan (G, not to scale; x west to east across, z south to north down):

```
 x (u): -12.32 -12.01 -11.77           -6.18 -5.91  -4.59 -3.98                                11.31 11.69 11.93 12.24
                                                |  open  |
 z -3.75                                        +--------+   transept slot, far end open (no face)
                                                |        |
 z -2.72  S|B|P| base wall =====================|        |===================================== base wall |P|B|S
 z -2.62  S|B|P|  [ west side panel +0.105 ]    |        |                                               |P|B|S
 z -2.50  S|B|P|                                |        |  [ east side panel, +0.222, x -3.98..11.31 ]  |P|B|S
          S|B|P|                                |        |                                               |P|B|S
 z  0.45  S|B|P| - - - - - - - - - - - - - corridor centre line (scene z = 0) - - - - - - - - - - - - - |P|B|S
          S|B|P|                                |        |                                               |P|B|S
 z  3.40  S|B|P|                                |        |  [ east side panel, +0.222 ]                  |P|B|S
 z  3.52  S|B|P|  [ west side panel +0.105 ]    |        |                                               |P|B|S
 z  3.62  S|B|P| base wall =====================|        |===================================== base wall |P|B|S
                                                |        |
 z  4.66                                        +--------+   transept slot, far end open (no face)
                                                |  open  |

 S = floor slot back face (x -12.32 / +12.24, only y 0..0.19)
 B = base end wall plane (x -12.006 / +11.926, y 0.21..8.03)
 P = end panel face (x -11.773 / +11.692, z -2.57..3.47, y 0.33..7.86 west / 7.90 east)
```

### 1.3 The side walls and their panels

The base walls are at z = -2.720 and +3.621 u (G). Raised panels float in front of them (G, slices at y = 1.00, 2.00, 4.00, 6.00, 7.50 u, all identical; checked also at 2.25, 4.33, 6.50 u):

| Panel pair | x extent (u) | x extent (scene m) | Face z (scene m) | Proud of base wall | Height | Length |
|---|---|---|---|---|---|---|
| East (one long pair) | -3.979 to 11.311 | -1.97 to 5.63 | plus and minus 1.464 | 0.222 u = 0.110 m | y 0.334 to 7.84 u (scene -1.834 to 1.89) | 15.29 u = 7.59 m |
| West (one short pair) | -11.731 to -6.184 | -5.82 to -3.06 | plus and minus 1.522 | 0.105 u = 0.052 m | y 0.33 to 7.86 u (scene -1.84 to 1.90) | 5.55 u = 2.76 m |

The panels are plain from y = 0.33 to 7.82 u. There is no step, groove or ledge at mid height; the vertex levels at y = 2.2, 4.2 to 4.5 and 6.3 to 6.7 u are triangulation and smoothing-group seams, and no face lies inside those bands (G).

Bare base wall shows between panels for 0.27 u west of the slot (x -6.179 to -5.911), 0.61 u east of it (x -4.591 to -3.984), 0.27 u at the west end (x -12.005 to -11.736) and 0.61 u at the east end (x 11.316 to 11.925) (G). Panel end returns are 0.07 u (west) and 0.19 u (east) long in z (G).

Shadow gaps (G, differences of grouped coordinates): under every panel 0.33 u = 0.166 m, where the bare base wall is visible from y = 0.02 to 0.33 u; above the panels 0.19 u east side (0.094 m), 0.17 u west side and west end panel (0.084 m), 0.13 u east end panel (0.065 m).

Edge fillets (G, read from vertex offsets, accurate to about 0.005 u): floor to wall about 0.02 u, panel edges about 0.013 u, fixtures about 0.055 u. Fillets are 1316 tiny faces, 6.46 u^2, 0.7 % of the surface.

### 1.4 The end walls

Both ends are solid. No opening, window or niche in either (G). Layers from the room outward:

| Layer | West (u) | East (u) | Notes (G) |
|---|---|---|---|
| End panel face | x = -11.773 | x = +11.692 | proud 0.233 u = 0.116 m of the base wall |
| Panel side faces | z = -2.570 and +3.472 | same | panel width 6.042 u = 3.000 m; margin 0.150 u = 0.074 m to each side wall |
| Panel bottom | y = 0.334 | y = 0.334 | 0.166 m above the floor, faces down |
| Panel top | y = 7.855 | y = 7.899 | west height 7.52 u = 3.73 m, east 7.57 u = 3.76 m |
| Base wall plane | x = -12.006 | x = +11.926 | y 0.21 to 8.03 u, z -2.70 to 3.60 u; 6.31 u = 3.13 m wide, 7.82 u = 3.88 m tall; visible only as a frame 0.15 u each side, 0.33 u at the bottom, 0.13 to 0.17 u at the top |
| Floor slot back face | x = -12.319 | x = +12.238 | y 0.02 to 0.18 u, faces into the room, 1.02 u^2 each |
| Slot ceiling | y = 0.20 | y = 0.20 | faces down, 0.31 x 6.3 u |
| Ceiling overshoot | x = -12.321 | x = +12.281 | the ceiling plane runs 0.32 / 0.36 u past the base wall, hidden above the wall top |

End panel area: 45.0 u^2 west, 45.3 u^2 east (11.1 and 11.2 m^2) (G). The east panel is 0.044 u = 0.022 m taller than the west one. That is the only difference between the two ends (G).

For a door (G): the clear wall is 6.31 u (3.13 m) wide by 7.82 u (3.88 m) high at the base plane; the panel in front of it is 6.04 u (3.00 m) by about 7.5 u (3.7 m), 0.12 m proud. The corridor centre line (scene z = 0) hits the end wall at z = 0.451 u. A door centred there, cut through panel and base wall, must cross the floor slot (0.155 m deep, 0.094 m high) or the slot must stop at the jambs.

### 1.5 The floor

One level, y = 0 u, flat, no step; the transept floor is at the same level (G, horizontal faces). Floor area 157.3 u^2 = 38.8 m^2 (G).

Floor slots under each end wall (G, slice at y = 0.10 u and horizontal faces at y = 0.20 u): the floor runs 0.313 u = 0.155 m past the base end wall to x = -12.319 (west) and +12.238 (east). Vertical back face at the slot end, y 0.02 to 0.18 u, facing into the room, 6.3 u wide. Slot ceiling at y 0.192 to 0.20 u, facing down. The base end wall begins at y = 0.21 u. Net slot 0.31 u deep by 0.19 u high (0.155 m by 0.094 m), full width z -2.70 to 3.60 u. The side base walls continue through the slot.

Floor seams, from the base normal map (L, point sampled every 4th texel of `norm_4096.jpg`, mapped to 3D): 18 seams across the hall (running along z) at x = -5.47, -4.81, -4.15, -3.51, -2.89, -2.15, -1.49, -0.83, -0.17, 0.47, 1.13, 1.73, 2.39, 3.05, 3.71, 4.37, 4.99 m, pitch 0.66 m (1.33 u), plus a split at -0.51 m. One long seam along the hall at z = -0.92 m. Profile across a seam in 0.01 m steps: 2.2, 2.3, 2.7, 3.4, 5.1, 10.0, 8.7, 10.7, 7.3, 4.5, 2.4, 2.6 degrees, so the groove is about 0.05 m wide with 9 to 14 degrees of tilt. The seams are also baked dark in the colour: the floor seam at z = -0.93 m reads luma 21.8 against 27.9 beside it (L).

### 1.6 The ceiling and its five fixtures

The ceiling is flat at y = 8.031 u (scene +1.988), one level (G). The bounding box height 8.055 u is the top of the fixtures, which poke 0.024 u above the ceiling plane and are hidden. So "4 m" in scene units is the bounding box; the visible room height is 3.988 m (G).

Five rounded boxes hang below the ceiling (G, smoothing groups 1, 9, 17, 25, 33 of 114 faces each):

| Fixture | Centre x (u) G | Centre x (scene m) G | Centre x (scene m) L | Baked colour L | Luma L |
|---|---|---|---|---|---|
| 1 (west) | -11.849 | -5.87 | -5.877 | (214, 227, 235) | 225 |
| 2 | -7.120 | -3.53 | -3.526 | (218, 231, 239) | 229 |
| 3 | 0.108 | 0.06 | 0.066 | (217, 230, 238) | 228 |
| 4 | 6.410 | 3.19 | 3.197 | (215, 228, 236) | 226 |
| 5 (east) | 11.631 | 5.78 | 5.790 | (212, 224, 233) | 222 |

G's x comes from the vertex bounding box of each group; L's from texel positions. They differ by at most 0.01 m (see 9.6).

Size and placement (G): box 0.431 x 0.135 x 3.385 u, plan 0.21 x 1.68 m; L measures the plan at 0.435 x 3.34 u = 0.216 x 1.66 m from texels (see 9.5). Visible drop below the ceiling 0.110 u = 0.055 m; underside at y 7.92 u (scene 1.933 m). z extent -1.086 to 2.299 u (scene -0.763 to 0.918), centre z 0.607 u (0.08 m north of the corridor centre line). Corner radius about 0.055 u = 0.027 m, from a quarter circle in the first nine vertices of the file. Spacing centre to centre 4.73, 7.23, 6.30, 5.22 u (2.35, 3.59, 3.13, 2.59 m), not uniform. The west fixture's outer edge at x = -12.064 u reaches 0.058 u past the west end wall plane and is buried in the wall; the east fixture stops 0.080 u short of the east wall.

Lights or beams: G could not say from geometry. L settles it: the undersides and sides are baked cool white (mean #d7e4ec, luma 222 to 229) and the ceiling plane directly behind each box is baked pure white (254 to 255, 773 to 872 texels per fixture, hidden inside the box). They are emissive lights (see 9.7).

Ceiling seams (L): faint, 3 to 7 degrees, along the hall at z = -1.19, -0.27, 0.67 m (pitch 0.93 m) and across it at x = -4.25, -2.95, -1.69, 1.87, 4.43 m.

### 1.7 Faces per orientation (G, dominant normal component over 0.9)

| Orientation | Faces | Area (u^2) | Area (m^2) | Share |
|---|---|---|---|---|
| +y, floor-like | 255 | 168.1 | 41.4 | 19.4 % |
| -y, ceiling-like | 244 | 179.3 | 44.2 | 20.7 % |
| +x | 468 | 72.9 | 18.0 | 8.4 % |
| -x | 466 | 72.9 | 18.0 | 8.4 % |
| +z | 563 | 183.7 | 45.3 | 21.2 % |
| -z | 566 | 183.7 | 45.3 | 21.2 % |
| slanted or curved (fillets) | 1316 | 6.5 | 1.6 | 0.7 % |
| total | 3878 | 867.1 | 213.8 | 100 % |

By smoothing group: five fixtures of 114 faces, the ceiling plane in `s 41` (2 faces, 156.5 u^2), the main shell in `s 42` (2868 faces), the upper base walls in `s off` (438 faces) (G).

### 1.8 Rebuild numbers in scene metres (G section 11, hall 4.00 m bounding box height)

- Interior box: 11.88 m long (x -5.95 to 5.93), 3.15 m wide (z -1.575 to 1.574), 3.99 m high (y -2.00 to 1.99). Floor at y = -2.00.
- East side panels: x -1.97 to 5.63, faces at z = plus and minus 1.464 (proud 0.110 m), y -1.84 to 1.89.
- West side panels: x -5.82 to -3.06, faces at z = plus and minus 1.522 (proud 0.052 m), y -1.84 to 1.90.
- End panels: faces at x = -5.836 and +5.816, z -1.50 to 1.50, y -1.84 to 1.90 (west) / 1.92 (east).
- Transept slot: x -2.92 to -2.27, z out to plus and minus 2.088, full height, open ends.
- Floor slots: x -6.11 to -5.95 and 5.93 to 6.08, y -2.00 to -1.91.
- Ceiling fixtures: centres x -5.87, -3.53, 0.06, 3.19, 5.78; z -0.76 to 0.92; underside at y 1.93; size 0.21 x 1.68 m; corner radius 0.03 m.

Everything in this list is an axis-aligned box. There are no arches, mouldings, vaults or pillars anywhere in the mesh (G, face tables and slices). That fact decides the pipeline (section 7.5).

---

## 2. Light and materials

### 2.1 Method (L)

- `hall.obj` parsed for `v`, `vt`, `f`; each face classed by its dominant normal as floor, ceiling, side wall or end wall.
- Every face drawn into a 1024 x 1024 UV index image; 527,298 texels covered, matching the summed UV area within 1.2 %. Each texel mapped back to 3D by barycentric weights, giving a position, a class and a normal per texel.
- `baked_4096.jpg` and `spec_4096.jpg` box-downscaled to 1024 (one texel = 0.042 u = 0.021 m). Lights = 8-connected regions with luma over 200. Surface tones exclude those regions plus a 16 texel (0.34 m) halo.
- `norm_4096.jpg` point-sampled every 4th texel. Tilt = atan2(|xy|, z). White padding texels (54.7 degrees, a defect in the reference) excluded; 6.2 % of island texels touch it.
- `displacement.jpg` (2048) analysed whole: tilt statistics, autocorrelation, radial power spectrum.
- Texel density: area-weighted median 43.45 u per full UV span (floor 43.0, ceiling 40.1, side walls 44.0, end walls 44.0). One 4096 texel = 0.0106 u = 0.0053 m. The 50x detail tile = 0.869 u = 0.432 m.
- Colour temperature by McCamy's formula on sRGB to xy; rough for greys and blues. Read it as "cool" or "warm", not as a lamp spec.
- Not measured: the rendered frame, the orb.

The reference's texture files (B, Pillow for dimensions, `ls` for bytes): baked diffuse 4096 x 4096 JPEG 917,145 B; normal 4096 x 4096, 1,162,078 B; specular 4096 x 4096, 1,847,884 B; detail displacement 2048 x 2048, 417,003 B; background 2880 x 1800, 614,667 B. About 5.0 MB of hall textures in all.

### 2.2 The five ceiling fixtures (L)

Colour: mean of all five undersides and sides (215.3, 227.6, 235.9) = #d7e4ec, chromaticity x 0.299, y 0.320, about 7400 K (cool white, bluish). The box sides read the same, luma 213. Per-fixture values are in the table in 1.6.

The fixtures do not light the ceiling or the floor in the bake. Ceiling luma beside fixture 3 along x: 41 at 0.09 m from the box edge, 31 at 0.19 m, 29 at 0.29 m, then 26 to 27. Side wall under fixture 3 by height: 126 in the top 0.1 m, 37 to 40 across the upper half, 31 to 33 across the lower half. Floor under fixture 3 across z from -1.4 to +1.4 m: 34, 31, 25, 28, 29, 28, 27, 27, 29, 27, 29, 30, 31, 33, 35. No pool at all.

Fixture 1 touches the west end wall; fixture 5 stops 0.08 u short of the east wall (G, L).

### 2.3 The sixteen floor-edge lights (L)

They are not in the mesh. They are baked light pools in the 0.165 m gap under the floating side-wall panels (panel bottom y = -1.835 m, floor -2.0 m). Lit texels sit on the base wall behind the gap, the floor in front of it and the panel underside. Detection: luma over 120, below y = -1.7 m, within 0.4 m of a side wall.

| Wall | Scene x centres (m) | Pitch (m) |
|---|---|---|
| north (+z, inner face z = 1.43 to 1.59) | -1.47, -0.49, 0.49, 1.48, 2.53, 3.53, 4.56, 5.58 | 0.98, 0.98, 0.99, 1.05, 1.00, 1.03, 1.02 |
| south (-z, inner face z = -1.47 to -1.58) | -1.44, -0.44, 0.55, 1.55, 2.56, 3.57, 4.59, 5.56 | 1.00, 0.99, 1.00, 1.01, 1.01, 1.02, 0.97 |

Pitch 1.00 m (2.01 u). The first light is 0.8 m east of the transept slot (slot east edge x = -2.27); the last is 0.2 m short of the east end panel (x = 5.82). None west of the transept.

Each lit patch (luma over 120): 0.16 to 0.26 m along x (use 0.22 m = 0.44 u), full slot height 0.165 m (0.33 u), 0.11 to 0.14 m deep into the wall (0.25 u).

Colour: brightest 20 % of lit texels (184, 166, 130) = #b8a682, about 4500 K (warm, amber); mean of lit texels (154, 140, 112) = #9a8c70. Peak luma 160 to 193 (north 167 to 193, south 162 to 189). They never reach luma 200, so a 200 threshold finds only the ceiling fixtures.

Pools, floor luma from the wall outward in 0.1 m steps: north light 105, 61, 41, 35, 31, 29, 28, 27 (ambient 27 to 28); south light 65, 48, 39, 35, 30, 26. Between two lights at the wall: 37, 36, 34, 32, 30. Wall above a light: 114 at 0.05 m, 89 at 0.15 m, 29 at 0.25 m; above the panel bottom the panel face is unlit.

### 2.4 The transept ends (L)

The renderer clears to white (0xffffff), so both open ends show pure white in the frame and in the cube map. The bake shows no daylight gradient from them: transept floor luma along z from -2.0 to 2.0 m in 0.25 m steps is 33, 39, 41, 43, 40, 39, 40, 39, 39, 35, 36, 38, 38, 39, 40, 43, 44.

### 2.5 Surface tones, bake, away from lights (L)

| Surface | Texels | Mean sRGB | Hex | Mean luma | Median | p10 | p90 |
|---|---|---|---|---|---|---|---|
| Floor | 95,066 | (28.8, 32.2, 35.2) | #1d2023 | 31.5 | 28.9 | 21.7 | 42.0 |
| Side walls | 202,920 | (29.0, 33.2, 35.9) | #1d2124 | 32.3 | 31.8 | 24.1 | 39.8 |
| Ceiling | 88,475 | (25.7, 30.0, 34.2) | #1a1e22 | 29.2 | 26.9 | 19.9 | 44.9 |
| End walls (all x-facing faces, transept sides included) | 86,160 | (27.5, 32.1, 37.8) | #1c2026 | 31.4 | 23.7 | 18.1 | 63.8 |

All surfaces carry a blue cast, blue minus red +6 to 7 (2.5 % of full scale), about 8200 K for the grey. The transept is bluer: floor (33.8, 39.9, 51.2) #222833, ceiling (39.5, 46.5, 60.4) #282e3c, transept side walls (45.6, 53.7, 66.8) #2e3643, blue minus red +17 to 21. The transept side walls are the brightest surfaces in the hall.

Along the hall, mean luma in 1 m bins from x = -6 to +6 m:

| Bin | -6..-5 | -5..-4 | -4..-3 | -3..-2 | -2..-1 | -1..0 | 0..1 | 1..2 | 2..3 | 3..4 | 4..5 | 5..6 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Floor | 20.7 | 25.5 | 32.4 | 38.8 | 36.1 | 33.9 | 33.5 | 32.3 | 32.2 | 31.6 | 30.6 | 27.3 |
| Ceiling | 18.8 | 29.6 | 36.4 | 45.0 | 33.7 | 29.7 | 26.9 | 25.5 | 26.5 | 25.8 | 24.0 | 18.8 |
| Side walls | 24.7 | 33.4 | 38.3 | 36.8 | 35.3 | 34.9 | 33.2 | 31.3 | 31.9 | 32.1 | 30.1 | 26.1 |

The brightest part is the transept crossing at x = -2.7 m and the metres either side. The west end is 0.53 of the floor peak; the east end 0.70. Floor colour by zone: west end metre #14181c, transept #212630, middle #191d20, east end metre #16191a.

Up the side walls in 0.5 m bins from y = -2 to +2: 35.8, 28.6, 28.8, 31.3, 31.7, 35.0, 34.5, 32.0. Flat within plus or minus 10 %.

Wall seams baked dark at y = -0.87, 0.23, 1.23, 1.89 m: luma 18.5, 19.5, 23.8, 24.9 against 31.2 beside them.

### 2.6 The specular map (L)

`spec_4096.jpg` is greyscale; the shader uses the red channel.

| Surface | Mean | Median | p10 | p90 |
|---|---|---|---|---|
| Floor | 51.6 (0.20) | 49 (0.19) | 31 (0.12) | 77 (0.30) |
| Side walls | 46.8 (0.18) | 46 (0.18) | 32 (0.13) | 63 (0.25) |
| Ceiling | 46.5 (0.18) | 54 (0.21) | 1 (0.00) | 65 (0.25) |
| End walls | 37.8 (0.15) | 40 (0.16) | 1 (0.00) | 63 (0.25) |

The zeros on ceiling and end walls are the fixture faces and some transept faces. The glossy surfaces proper sit at 0.15 to 0.25. The floor has streaks along the hall: autocorrelation along x stays near 0.4 from 0.2 m to 1.2 m, across z it falls to 0.1 by 0.4 m. By 0.25 m band across the floor: 59, 54, 47, 62, 52, 50, 49, 34, 44, 57, 59, 54, a duller lane at z = 0.25 to 0.75 m and shinier lanes near both walls. Walls carry soft blotches 0.3 to 0.5 m across, range 0.13 to 0.25.

Effective reflection weight in the shader: r = clamp(spec + 0.2 x rim, 0, 1), rim = 1 - |n dot v|. Floor 0.20 face-on, 0.30 at 60 degrees, 0.40 at grazing. Walls 0.18 to 0.38.

### 2.7 The normal maps (L)

Base map (`norm_4096.jpg`): flat inside the islands, mean (126.8, 126.9, 252.4). Tilt mean 2.3 degrees, median 1.3, p90 5.4, p95 7.9, p99 15.4. Per surface (mean / median / p90 / p99): floor 3.2 / 2.1 / 7.4 / 16.5; ceiling 1.8 / 1.3 / 3.6 / 9.4; side walls 1.5 / 0.7 / 3.1 / 15.2; end walls 3.6 / 2.6 / 7.8 / 18.0. The detail is panel seams (1.5, 1.6), not surface grain. Side wall seams at y = -1.89 (panel bottom), -0.87, 0.23, 1.23 m, pitch 1.0 to 1.1 m, tilt 8 to 10 degrees; no vertical wall seams found. Texel size 0.0053 m.

Detail map (`displacement.jpg`, 2048, used as a second normal map at 50x UV): mean (128.1, 126.7, 242.1), standard deviation (23.7, 23.6, 16.0). Tilt mean 13.7 degrees, median 11.0, p95 34, p99 51. Crumpled, cracked relief. Row autocorrelation 0.74 at 1 px, below 0.05 by 5 px; power-weighted mean period 12 px. One tile = 0.869 u = 0.432 m; one detail texel = 0.21 mm (m); typical feature 12 px = 2.5 mm (m); correlation length about 0.5 to 0.6 mm.

The shader mixes base and detail 50/50 and rebuilds z with bumpiness 1. Effective tilt of the mixed normal: mean 8.5 degrees, median 5.3, p95 39. These features are far below one screen pixel, so the reflection sparkles rather than blurs. Nearest standard-material equivalent: roughness about 0.35 to 0.45 (alpha = tan(8.5 degrees) = 0.15). That equivalence is a judgement from the tilt numbers, not a measurement (L).

### 2.8 How the demo turns textures into the frame (L, C)

- No lights. Colour = mix(baked, env, r), r = clamp(spec.r + 0.2 x rim, 0, 1).
- env = cube-map lookup along the reflected view vector, parallax-corrected to a box of 12.217 x 4.000 x 4.176 m centred at the origin (the scaled bounding box, set at run time; the shader's comment constants 24.557, 8.410, 6.32 or 7.961 are dead, see 8.A).
- The cube map is rendered once from the origin (CubeCamera, 1024 px per face, near 1e-8, far 10) with every surface drawn as the baked map only and the orb hidden. So reflections are the dark hall, the five cool fixtures, the sixteen warm pools and the white transept openings. Mipmaps on, no LOD bias.
- Normals: mixed normal = 0.5 x base + 0.5 x detail(50 x uv), bumpiness 1, tangent space.
- No gamma in or out. Texture values pass through as stored.
- Post chain, in order: vignette, RGB split, depth of field, bloom, FXAA, bleach bypass, noise (section 4 has each pass).

Worked on-screen values (L; flat area, reflection ignored, fade = 1; screen centre / half width out / corner):

- floor #1d2023 (29, 32, 35) -> (89, 97, 105) / (54, 59, 63) / (19, 21, 22)
- ceiling #1a1e22 -> (76, 86, 96) / (46, 52, 58) / (16, 18, 20)
- transept wall (46, 54, 67) -> (186, 194, 202) / (129, 139, 149) / (48, 52, 57)
- floor pool at the wall (105, 97, 80) -> white / (241, 238, 229) / (157, 149, 130)
- floor light peak #b8a682 -> white / white / (240, 235, 223)
- fixture #d7e4ec -> white everywhere.

On screen the hall is a mid blue-grey around the frame centre, falling to near black in the corners, with every light clipped to white and haloed.

### 2.9 Our material recipe (L section 8, own numbers)

Base colours at texture level, for an unlit or lightmap-style material:

| Surface | Hex | Notes |
|---|---|---|
| Floor | #1d2023 | blue cast +7; seams 30 % darker |
| Side walls | #1d2124 | seams 35 % darker |
| Ceiling | #1a1e22 | |
| End walls | #1c2026 | |
| Transept floor | #222833 | |
| Transept ceiling | #282e3c | |
| Transept side walls | #2e3643 | brightest surfaces |

Along-hall multiplier on floor and walls per metre from x = -6 to +6: 0.66, 0.81, 1.03, 1.23, 1.15, 1.08, 1.06, 1.03, 1.02, 1.00, 0.97, 0.87. Ceiling: 0.64, 1.01, 1.25, 1.54, 1.15, 1.02, 0.92, 0.87, 0.91, 0.88, 0.82, 0.64. Keep walls flat in height.

If the hall is lit rather than baked, aim for the screen-centre values: floor about #596169, walls #5b6670, ceiling #4c5660, transept walls #bac2ca, and let a vignette take the corners to about #131516.

| Surface | Reflection face-on | at grazing | Roughness (standard PBR) | Micro grain |
|---|---|---|---|---|
| Floor | 0.20 (0.12 to 0.30 in streaks along the hall) | 0.40 | 0.35 to 0.45 | fine noise normal, tile 0.43 m, features 2 to 5 mm, strength 0.3 to 0.5 |
| Side walls | 0.18 (blotches 0.13 to 0.25, 0.3 to 0.5 m across) | 0.38 | 0.45 | same |
| Ceiling | 0.18 | 0.38 | 0.45 | same |
| End walls | 0.15 | 0.35 | 0.50 | same |

Metalness 0. The reflection source should be the hall itself (a cube map or planar reflection of the dark hall with its lights), not a bright HDRI. The rim term (reflection weight rising by 0.2 toward grazing) is what makes the far floor mirror the fixtures.

Seam normal map (own drawing): floor grooves across the hall every 0.66 m plus one long groove at z = -0.92 m; wall grooves at y = -0.87, 0.23, 1.23 m and the panel bottom edge at -1.835 m; groove width 0.05 m, tilt 10 degrees, baked 30 to 35 % darker.

Ceiling fixtures: five boxes 0.216 x 1.66 m plan, 0.055 m visible drop, 0.027 m corner radius, undersides at y = 1.933 m, at x = -5.88, -3.53, 0.07, 3.20, 5.79 m, z -0.75 to 0.92 m. Emissive #d7e4ec. They should not light the ceiling (any local glow under 0.3 m) and should not pool on the floor.

Floor-edge lights: sixteen warm points in the 0.165 m slot under the side-wall panels, 1.00 m pitch, x = -1.47 to 5.58 m on both walls, none west of the transept. Lit patch 0.22 x 0.165 m, emissive #b8a682, fading to the base over 0.3 m on the floor and 0.2 m up the base wall. Floor pool at the wall 3.3 x the base luma.

Transept ends: open to a white background (clear colour #ffffff). No baked daylight gradient.

---

## 3. Camera and motion

### 3.1 Camera basics (C, from `index.html` read as text)

- `PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 30)`. The 45 is only the construction value; the story sets 75 on the first frame. Near 0.01, far 30 scene units. `camera.lookAt(camera.target)` every frame.
- On resize: renderer and composer sized to the window in device pixels, aspect from the window. No portrait rule. Vertical FOV is the same on a phone, so the horizontal field collapses:

| Vertical FOV | 16:9 | 16:10 | 390 by 844 | 390 by 660 |
|---|---|---|---|---|
| 75 | 107.5 | 101.7 | 39.0 | 48.8 |
| 60 | 91.5 | 85.5 | 29.9 | 37.7 |
| 50 | 79.3 | 73.5 | 24.3 | 30.8 |
| 40 | 65.8 | 60.4 | 19.1 | 24.3 |

- Pixel ratio: `setPixelRatio(pixelRatioScale x devicePixelRatio)`, scale 0.5 on touch devices, else 1. No cap: a 3x phone on "Normal" renders at 1.5x (585 by 1266 px for 390 by 844); a 2x laptop on "High" at 2x.

### 3.2 The storyline (C, `storyline_eval.py` on `storyboard.js` and `timeline.js`)

Every channel is a list of "T cut to V", "T linear to V", "T ease to V" events keyed to the music track (128.5 s, measured with `afinfo`). A cut holds; a linear ends at T and starts at the previous event's end; ease is in-out quadratic. The story runs only while `manual` is false; three taps or clicks call `goInteractive()` and the story stops for good.

Six shots. Cuts at 22, 51.4, 64.5, 80 and 96 s. Scene units; eye height = y + 2.0. Speed is path length over duration; every move is linear so speed is constant within a shot.

| Shot | Start s | End s | Dur s | Camera from | Camera to | Target from | Target to | FOV | Path | Speed u/s | Eye above floor |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.0 | 22.0 | 22.0 | (-2.48, -0.50, 0.00) | (-2.48, 0.50, 0.00) | (0.50, -0.50, 0.00) | (0.50, 0.50, 0.00) | 75 | 0.99 | 0.045 | 1.50 to 2.50 |
| 2 | 22.0 | 51.4 | 29.4 | (2.48, -1.09, -0.39) | (-0.99, -1.09, -0.39) | (-0.74, -1.67, -1.53) | (-2.48, -1.67, -1.53) | 60 to 40 | 3.48 | 0.118 | 0.91 |
| 3 | 51.4 | 64.5 | 13.1 | (5.46, -1.49, 0.00) | (0.50, 0.00, 0.00) | (-5.46, 1.99, 0.00) | (-5.46, 1.99, 0.00) | 75 | 5.18 | 0.396 | 0.51 to 2.00 |
| 4 | 64.5 | 80.0 | 15.5 | (-4.62, -1.54, 0.02) | (-4.62, 0.65, 0.02) | (0.00, -1.54, 0.00) | (0.00, 0.65, 0.00) | 75 to 50 | 2.18 | 0.141 | 0.46 to 2.65 |
| 5 | 80.0 | 96.0 | 16.0 | (-0.50, 2.48, 0.00) | (-2.63, 2.48, 0.00) | (-0.50, 0.00, 0.00) | (-2.63, 0.00, 0.00) | 50 | 2.14 | 0.133 | 4.48 |
| 6 | 96.0 | 120.0 | 24.0 | (-0.74, 0.00, 0.00) | (5.96, 1.49, 0.00) | (-1.49, 0.00, 0.00) | (-1.49, 0.00, 0.00) | 75 | 6.87 | 0.286 | 2.00 to 3.49 |

Depth of field per shot (story aperture; the shader gets aperture x scale): 1 off; 2 on, 0.01 to 0.02, focus fixed 0.83 = 5.1 units ahead; 3 off; 4 nearly off, 0.001 to 0, focus 0.70 to 0.90 = 9.0 to 3.0 units; 5 on, 0.01, autofocus; 6 on, 0.02 to 0 by 100 s, then off, autofocus.

What each shot is (C):

1. A slow rise of 0.99 units in 22 s inside the transept slot (camera x -2.48 is inside the slot's -2.92 to -2.27, see 9.3), looking down the nave toward +x, level gaze, FOV 75. Title in from 7 to 9 s, out 12 to 15 s. Picture fades up from black over 0 to 3.5 s.
2. The only eye-level shot. A dolly along the nave from x = 2.48 to -0.99 at 0.118 u/s, eye 0.91 units above the floor (0.227 of the hall height), 0.39 units off the centre line toward -z, gaze down and to the -z wall. FOV narrows 60 to 40 over the shot.
3. The fastest move: 5.18 units in 13.1 s (0.396 u/s) from the +x end near the floor to the centre at mid height, looking at the far end wall just under the ceiling. The orb scales in from 59 to 64.5 s at x = -1.99.
4. A crane up at the -x end: 2.18 units of rise in 15.5 s, level gaze at the hall centre, FOV 75 to 50. The orb slides from x = 0 to -2.98.
5. Top down from 0.48 units above the ceiling, following the orb from x = -0.50 to -2.63 at 0.133 u/s, FOV 50. The hall is drawn front-side only, so from above the ceiling is culled and the floor shows as a strip on the white clear colour.
6. The pull-out from the orb back and up to the +x end, 6.87 units in 24 s (0.286 u/s), target fixed at (-1.49, 0, 0), FOV 75. Fade to black 110 to 115 s, title 114 to 116 s, credits 118 to 120 s.

Other channels: `fade` drives the vignette boost (2 x fade plus 0.2 x Perlin noise, a flicker of about plus or minus 0.14 in practice, see C section 9). `sphereAngle` turns the orb 6.28 rad over 59 to 120 s (0.103 rad/s, 5.9 deg/s). `autofocus` is 0 until 80 s, then 1.

### 3.3 Speed bracket (C)

All linear moves: slowest 0.045 u/s (shot 1, a rise), fastest 0.396 u/s (shot 3). Horizontal dollies only: 0.118, 0.133, 0.286, 0.396 scene u/s (OBJ 0.238, 0.269, 0.576, 0.797 per second). The demo never exceeds 0.4 u/s.

### 3.4 The interactive mode (C)

- Pre-story pose, `prepare()`: camera at (4.211, -1.036, 0.184) scene, lookAt the orb at (-1.986, 0, 0), FOV 45, eye 0.96 above the floor. Rendered once with the canvas hidden to warm the shaders, never shown.
- `goInteractive()` after the third click or touch: `manual = true`, the story stops where it is; `OrbitControls` on `document` with target (0, 0, 0); the orb forced visible at scale 0.2 (radius 0.884, twice the story size); vignette boost fixed at 2 (no flicker). The camera keeps its position from the moment of the third tap and looks at the hall centre; orbit radius is that position's distance from the origin. Zoom unlimited (minDistance 0, maxDistance Infinity), polar angle 0 to pi, rotate speed 1, no auto-rotate, no key panning. OrbitControls' feel in deg per px was not measured.

### 3.5 The orb (C, B)

`assets/orb.obj`: 4082 vertices, 8160 triangles, radius 4.42 u. Position x = orbx x scale, y = 0, z = 0; orbx is -4 u (-1.99 m, which is 0.28 m east of the slot's east edge, in the nave, see 9.3) until 64.5 s, then 0 to -6 over 64.5 to 80 s, -1 to -5.3 over 80 to 96 s, -4 after 96 s. Story scale 0.0993 (radius 0.439 m), eased in 59 to 64.5 s. Material: parallax-corrected cube-map reflection with its own normal map plus the hall's detail map at 50x UV, double-sided.

Decision carried from the brief (C): the orb is removed. Nothing else in the storyline depends on it except the autofocus raycast list, which still hits the hall.

### 3.6 Proposals for the walk (C section 8; each names the demo number it comes from)

- Eye height: 0.90 scene units above the floor (camera y = -1.10), from shot 2's 0.908 (0.227 of the hall height). If OBJ units were metres that is 1.83 m; 0.85 (1.71 m) is the lower bound C would accept.
- FOV, laptop: vertical 60 (shot 2's start; 85.5 horizontal at 16:10, 91.5 at 16:9). 75 bends the walls at eye level. Phone portrait: apply the hero's portrait rule on a base of 60. The rule is `camA.zoom = Math.min(1, asp * 1.25)` in `src/scripts/hero/stage/resize.ts` (verified by grep today). A 390 by 844 phone then gets 90 vertical and 49.6 horizontal; 390 by 660 gets 76 by 49.6. Cap the vertical at 90.
- Walking speed, keyboard hold: 0.40 u/s (shot 3's 0.396), with a 0.3 s ease in and out, no sprint. The nave (12.2 units bounding box; 11.88 wall to wall per G) takes about 30 s end to end; a 4-unit stretch 10 s. 0.5 u/s is the most C would go.
- Scroll-driven dolly: gain 0.5 units per screen with a follower time constant of 0.5 s (the hero's parallax lerp of 0.035 per frame is 0.47 s). A steady drag of 0.25 to 0.8 screens per second moves at 0.12 to 0.40 u/s, inside the bracket. Clamp the follower output at 0.4 u/s if the peak must stay inside the bracket. Path length is a content decision: 4 units = 8 screens, the full nave 24 screens.
- Lateral: on the centre line or within 0.4 units of it (shot 2 is 0.39 off). C says 1.1 units clear of the nave walls using the base half-width 1.575; the east panel faces are at 1.464, so the clearance there is 1.06 (see 9.8). Level gaze; no tilt.
- Near 0.05, far 30.
- Pixel ratio: the repo's caps, `DPR_CAP = { touch: 1.25, fine: 1.5 }` in `src/config/hero.ts` (verified by grep today).
- Colour: see 4.4.

I's scroll findings sit inside these numbers: the Codrops 2026 gallery advances t by 0.25 per viewport with a 1 s power3.out smoothing; drei's ScrollControls damps at 0.2 s by default; so C's 0.5 s follower is in the published range (see 9.14).

---

## 4. The post stack

### 4.1 Buffers and order (C, from `render()` and the Wagner pass files)

Two ping-pong render targets at canvas resolution in device pixels, RGB, UnsignedByte, LinearFilter, ClampToEdge, with stencil. Everything is 8-bit, so the vignette's boost above 1 clips to white. No colour management, no tone mapping.

| # | Pass | What it does, with parameters | Cost per pixel | Phone (C's ranking, cheapest first) | Laptop |
|---|---|---|---|---|---|
| 0 | Depth pre-pass | Only if DOF is on with aperture above 0: the scene drawn again with a depth override into a full-resolution target, writing 1 - (distance - near) / (far - near) | a second scene draw | Drop with DOF | Keep with DOF |
| 1 | Scene | Into the composer, clear colour white | | | |
| 2 | Vignette2 | factor = boost - 2 x (distance from frame centre / frame width); colour x factor. boost = 2 x fade plus flicker; 2 in interactive mode. Centre x2.00 and clips; factor 1.0 at a radius of half the width; corners 0.853 (16:9), 0.821 (16:10). On 390 by 844 the division by width gives -0.16 at the top and bottom mid-edges and -0.38 at the corners: black | 1 fetch | Rank 1. Keep, folded into one output pass. Normalise by max(width, height) so 390 by 844 corners read 0.90, not black. Keep the clip above 1. Flicker optional | Keep as measured |
| 3 | RGB split | offset = 0.7 x |d| x d x delta, d = uv - 0.5 (grows with radius squared). Red tap shifted inward by offset / width, blue outward by offset / height, green stays. delta 20 px (10 on touch, with the half-size buffer: the same in CSS px). Zero at the centre; 16:9 corner red tap 4.9 by 2.8 px, blue 8.8 by 4.9 px; mid-edge 3.5 px | 3 fetches | Rank 4. Keep in the same pass if the budget allows; first thing to drop | Keep |
| 4 | DOF | Two passes, horizontal then vertical. bias = min(|depth - focalDistance| x aperture, 0.005) UV units; 9-tap Gaussian (0.051, 0.0918, 0.12245, 0.1531, 0.1633, mirrored) at 1 to 4 x bias. aperture = story x scale (0.01 -> 0.00497, 0.02 -> 0.00993). At 1920 wide and aperture 0.01: outer tap 3.8 px for a surface 3 units off focus, 19 px at 15 units; at 0.02, 7.6 and 38 px; the cap means never over 2 % of the width (38 px at 1920, 7.8 px at 390) | about 20 fetches plus the depth pass | Rank 7. Drop (the demo's own "Low" preset drops it for phones) | Keep: autofocus by raycast from the screen centre, aperture 0.005 to 0.01, outer tap capped at 2 % of width |
| 5 | Bloom | Copy the frame to a 512 by 512 buffer (256 on mobile), blur with two 9-tap Gaussian passes at delta 1 px (0.5 on mobile): outer tap 4 px of 512, 0.78 % of the frame (15 px at 1920, 3 px at 390 CSS px). Screen-blend over the full frame at opacity 1: 1 - (1 - base)(1 - blur). No threshold: mid grey 0.5 becomes 0.75 | small-buffer blur plus 2 fetches at full resolution | Rank 5. Optional; first of the expensive ones to cut | Keep: 512 buffer, radius 0.78 % of the frame, screen at opacity 1 |
| 6 | FXAA | Console variant (reduce min 1/128, reduce mul 1/8, span max 8 px). Its centre sample is taken at the frame corner (a bug), so it is a faint directional softening, not edge AA. The renderer already has MSAA | 9 fetches | Rank 6. Drop; our renderer has MSAA on (`gfx/renderer.ts`, B) | Drop |
| 7 | Bokeh | Defined, `bokeh = false`, never run | | Not part of the look | |
| 8 | Bleach bypass | luma = dot(colour, (0.2125, 0.7154, 0.0721)); mixamount = clamp((luma - 0.45) x 10, 0, 1); result = mix(2 x colour x luma, 1 - 2(1 - colour)(1 - luma), mixamount). Shadows multiply, highlights screen, pivot over luma 0.45 to 0.55 | 1 fetch | Rank 3. Keep, same pass | Keep |
| 9 | Noise | colour + 0.01 x (0.5 - hash(uv)); plus or minus 1.3 levels of 8 bits; speed 0 so the pattern is static | 1 fetch | Rank 2. Keep, same pass; static or animated, nobody will see the difference | Keep |
| 10 | toScreen | one copy to the canvas | 1 fetch | | |

Lens flare and dirt are declared and off. Brightness-contrast and zoom-blur are not used at run time.

Full-resolution cost on the demo's "High" preset: two scene draws (with DOF), then about 39 full-resolution fetches per pixel over 9 full-screen passes, plus two blur passes at 512 by 512 (C).

Order matters: the vignette's clip happens before the bloom and the bleach, which is what makes the centre bloom white (C, L).

The phone stack per C: scene, then one full-screen pass holding vignette, grain, bleach and the split if kept; no second scene draw. The laptop stack: scene, depth, vignette, split, DOF, bloom, bleach, grain, in the demo's order.

### 4.2 Renderer settings (C)

- `WebGLRenderer({ antialias: true, alpha: false })`, clear colour 0xffffff, `autoClear = false`.
- Quality presets: Very low = no post; Low = post without DOF at half resolution; Normal = full post at half resolution; High = full post at full resolution. The page says phones try Low or Normal, desktop Normal or High.
- Mobile differences: bloom buffer 256 not 512, blur 0.5 not 1 (same radius as a fraction of the frame), split delta 10 not 20 (same in CSS px).
- Textures: 4096 px baked colour, specular and normal maps; a tiling detail normal at 50x UV; repeat wrapping; no mipmap LOD extension.

### 4.3 The hero's own post (repo, verified today)

`src/scripts/hero/post/composer.ts` builds an `UnrealBloomPass` at `Vector2(256, 256)` (line 21) with strength from config, radius 0.22, threshold 0.62. `src/scripts/hero/post/composite.ts` is the wipe between two textures. Both exist (see 9.10). `gfx/renderer.ts` sets ACESFilmic tone mapping on the canvas and antialias on (B).

### 4.4 Colour pipeline note (C, B)

The demo does no colour management: textures shown as stored, post on 8-bit buffers that clip. In three 0.165 the equivalent is `NoToneMapping` for the walk scene and sRGB textures with the default output colour space, with the post chain rendered into 8-bit targets, not half-float (C). B's island design renders the hall under `NoToneMapping` into an sRGB render target and then hands it to the composite, which draws to a canvas under ACESFilmic. ACES will soften the white clip the demo relies on (see 9.11). Sam decides (8.C).

---

## 5. The prompt and the walk

### 5.1 Roblox ProximityPrompt, facts with sources (I)

What it is. Roblox Creator Docs: the ProximityPrompt instance "lets you prompt players to interact with an object in the 3D world"; a UI appears when the character approaches; the default UI can be swapped for a custom one. Prompts display the correct input for keyboard, gamepad and touchscreen and trigger through a press or hold. Sources: https://create.roblox.com/docs/reference/engine/classes/ProximityPrompt and https://create.roblox.com/docs/ui/proximity-prompts. Class added 2020-10-23 (engine 0.454); public release post 2020-12-12 (https://robloxapi.github.io/ref/class/ProximityPrompt.html, https://devforum.roblox.com/t/proximity-prompt-release/919991).

Defaults (the API dump as mirrored by robloxapi.github.io; "docs" marks values the Creator Docs also state in prose):

| Property | Default | Confirmed by |
|---|---|---|
| MaxActivationDistance | 10 studs | API dump |
| HoldDuration | 0 s (0 triggers immediately) | API dump, docs |
| RequiresLineOfSight | true | API dump, docs |
| KeyboardKeyCode | E | API dump, docs |
| GamepadKeyCode | ButtonX | API dump, docs |
| ClickablePrompt | true | API dump |
| ActionText | "Interact" | API dump, docs |
| ObjectText | empty | API dump |
| Exclusivity | OnePerButton | API dump |
| Style | Default | API dump |
| UIOffset | (0, 0) px | API dump |
| Enabled | true | API dump |
| AutoLocalize | true | API dump |
| MaxIndicatorDistance | 0 (indicator off) | API dump, docs |

Exclusivity: OnePerButton (one prompt per input key), OneGlobally (one prompt at a time), AlwaysShow. Style: Default = 0 (built-in CoreScript UI), Custom = 1 (no default UI). Input types to PromptShown: Keyboard 0, Gamepad 1, Touch 2. Visibility: shown once the character is inside MaxActivationDistance; with RequiresLineOfSight it needs a clear path from the camera; with several in range, which shows depends on where the camera points and Exclusivity. Mobile: phone and tablet users can always tap the prompt directly, whatever ClickablePrompt says. Events: Triggered, TriggerEnded, PromptButtonHoldBegan, PromptButtonHoldEnded, PromptShown(inputType), PromptHidden; a progress bar shows hold progress. Sources: the class page, the guide page, https://create.roblox.com/docs/reference/engine/enums/ProximityPromptStyle, https://create.roblox.com/docs/reference/engine/enums/ProximityPromptInputType.

The default UI, measured from Roblox's own look-alike sample (the built-in CoreScript's source is not published; the sample on the ProximityPromptStyle page is described as "similar to the default style"):

- Container: BillboardGui, AlwaysOnTop, 72 px tall, width from the frame's measured width after two render steps; right padding 24 px, minus 9 px when ObjectText is present.
- Background: RGB(0.07, 0.07, 0.07) (about #121212), BackgroundTransparency 0.2 (80 % opaque), rounded corners.
- Key chip: round 48 x 48 px, transparency 0.5. Keyboard: a 28 x 30 px key image with the letter in GothamMedium 14 px white (12, 10 or 8 px for long key names); 36 x 36 px for glyph keys. Gamepad: 24 x 24 px glyph. Touch: 25 x 31 px tap icon.
- Text: ActionText GothamMedium 19 px white, left aligned; ObjectText GothamMedium 14 px at RGB(0.7, 0.7, 0.7) (about #B3B3B3) above it (ObjectText Y -10 px, ActionText Y +9 px when ObjectText exists).
- Hold ring: 58 x 58 px centred on the chip, two half frames each with a radial fill and a UIGradient (transparency 0 at 0, 0 at 0.5, 1 at 0.51, 1 at 1); angle = Progress x 360 degrees; right half from Progress 0.01 (0 to 180 deg), left half from 0.5 (180 to 360 deg).
- Hold (only when HoldDuration > 0): Progress tweens 0 to 1 over HoldDuration, linear; chip scales to 1.33 (1.6 on touch) over 0.2 s Quad Out; text and background fade out. On release: chip back to 1.0, text and background back, Progress to 0 over 0.5 s Quad Out.
- Appear and disappear: 0.2 s Quad Out fade for frame, text and background, 0.06 s linear for images, on creation and on TriggerEnded; fade out on Triggered; on PromptHidden fade out, wait 0.2 s, remove.
- Touch and click: a full-size transparent TextButton when the input is Touch or ClickablePrompt is true; InputBegan calls InputHoldBegin, InputEnded calls InputHoldEnd.
Source: https://create.roblox.com/docs/reference/engine/enums/ProximityPromptStyle (sample code).

Unknown (I): whether the built-in CoreScript scales the prompt on appear, and its exact fade duration.

I's recommendation: build the door prompt as a Style=Default clone of the sample numbers with ActionText "Enter Skreed universe", ObjectText "Door" in the small grey line above, HoldDuration 0, a 0.2 s Quad-Out fade at a distance threshold that maps 10 studs onto the corridor's own unit, and a tap chip plus a full-size invisible hit area on touch. The stud-to-scene mapping is open (8.D). The door's end is open (8.A).

### 5.2 Keyboard rules (I)

Pointer lock is desktop only. MDN: `requestPointerLock()` needs transient activation, fails right after the default unlock gesture, and is not Baseline. caniuse (features-json/pointerlock.json): iOS Safari 27.2 no; Android Chrome 154 no; Android Browser 154 no; Samsung Internet 30 no; desktop Chrome 157 yes; Firefox 160 yes; Safari TP yes. Sources: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API, https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock, https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/pointerlock.json. So mouse look is desktop only; keyboard walking on desktop and scroll walking on phones is the baseline.

WCAG 2.2 (sources https://www.w3.org/WAI/WCAG22/Understanding/ followed by the page name):

- 2.1.1 Keyboard (A): all functionality operable from a keyboard; the path-dependent exception does not cover walking to a door, which is endpoint input.
- 2.1.2 No Keyboard Trap (A): focus must be movable away by keyboard; Esc is a common exit.
- 2.1.4 Character Key Shortcuts (A): letter shortcuts (W, A, S, D, E) must be switchable off, remappable, or active only on focus. Arrow keys are not printable and are exempt.
- 2.2.2 Pause, Stop, Hide (A): any automatic motion lasting over 5 s alongside other content needs a pause. An idle camera drift or head bob falls under this.

Implementation note (I, not from a source): arrows and Space scroll the page by default, so the walk handler listens only while the canvas is focused and calls preventDefault there; that also satisfies 2.1.4's "active only on focus" for WASD and E.

I's recommendation: a focusable canvas that handles arrow keys and WASD only while focused, with Esc blurring it.

### 5.3 Scroll rules and published examples (I)

- Codrops, 2026-07-07 (Gaspard Hedde): camera from `curve.getPoint(t)` on a closed CatmullRomCurve3 (tension 0.5); GSAP Observer with 'wheel,touch,pointer' so desktop and touch feed the same deltaY; sensitivity 1 / (innerHeight x 4), so one viewport of scrolling advances t by 0.25; `gsap.quickTo` with 1 s power3.out; `setPixelRatio(min(devicePixelRatio, 2))`; fog 10 to 40 units. No native page scroll; reduced motion not handled. Source: https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/
- Codrops, 2023-02-14 (Andrew Prifer): drei ScrollControls with pages 5, `sheet.sequence.position = scroll.offset x sequenceLength`; camera FOV 90, near 0.1, far 70; linear keyframes. ScrollControls makes a real HTML scroll container in front of the canvas; offset dampened 0 to 1, damping default 0.2 s. Sources: https://tympanus.net/codrops/2023/02/14/animate-a-camera-fly-through-on-scroll-using-theatre-js-and-react-three-fiber/ and https://drei.docs.pmnd.rs/controls/scroll-controls
- Moxy (moxy.studio), measured 2026-10-16 at 375 x 812 CSS px, DPR 2 in the browser pane: one full-screen canvas with backing 750 x 1624 px (full DPR 2); body overflow hidden; document height 813 px, so scroll is virtual; a "SCROLL" cue; no readable prefers-reduced-motion rule (cross-origin sheets unreadable). Offscreen Canvas issue 011 names camera movement along a curve as the most common scroll-tied WebGL animation. Sources: https://offscreencanvas.com/issues/011/ and https://moxy.studio/
- Igloo Inc (igloo.inc): Awwwards Site of the Day 2024-07-23 (7.92/10), Developer Award (7.66/10, Responsive Design 8.40/10). Measured 2026-10-16 at 375 x 812, DPR 2: after 20 s still on its text loader, no canvas; html and body overflow hidden; body touch-action none; document height 812 px. What it does on a real phone after loading is unknown. Sources: https://www.awwwards.com/sites/igloo-inc, https://awwwards.com/igloo-inc-case-study.html, https://igloo.inc/
- Not verified: Blue Marine Foundation "The Sea We Breathe", Renaud Rohlinger's portfolio, "Museum camera travel" (https://www.magische-spiegelungen.de/). Codrops "Reactive Depth" (2026-02-17) is a spin, not a corridor (deltaY x 0.004, damping 0.92 per frame, clamp plus or minus 2).

I's recommendation: a real scroll container N viewports tall (drei's pattern) with the camera's t from scrollTop and 0.2 s to 1 s smoothing, because phones get native touch momentum, keyboards get Space and arrow scrolling for free, and reduced motion gets a plain cut-and-crossfade path. I also suggests `min(devicePixelRatio, 2)`; the repo's caps are lower and win (see 9.13).

### 5.4 Reduced motion rules (I)

- WCAG 2.3.3 Animation from Interactions (AAA): motion animation triggered by interaction can be disabled unless essential; motion animation excludes changes of colour and opacity; moving new content into the viewport is essential for scrolling; parallax is named. Techniques C39 and SCR40 (prefers-reduced-motion in CSS and JS).
- WCAG 2.3.1 Three Flashes (A): nothing flashes more than three times in any one second. A general flash is a pair of opposing changes of relative luminance of 10 % or more where the darker image is below 0.80, over more than 25 % of any 10 degree visual field (a 341 x 256 px rectangle at 1024 x 768). One white-out is a single change, not a flash pair; colour sweeps must not cross that step more than three times per second.
- prefers-reduced-motion (MDN): values no-preference and reduce; Baseline widely available since January 2020. OS switches: iOS Settings > Accessibility > Motion; Android 9+ Remove animations; macOS Accessibility > Display or Motion > Reduce motion; Windows 11 Accessibility > Visual Effects > Animation Effects. In JS: `matchMedia('(prefers-reduced-motion: reduce)')` with a change listener; in-flight JS animations must be stopped by hand (web.dev).
- Apple HIG, Accessibility: reduce automatic and repetitive animations including zooming, scaling and peripheral motion; replace transitions in x, y and z with fades. Apple HIG, Motion: use instantaneous directional changes during a quick fade-out; an automatically moving world makes people unwell; avoid sustained oscillation near 0.2 Hz; use fades to relocate an object.
- WebKit (2017-05-15): scaling or zooming gives the illusion of moving forward or backward; a FOV change is a zoom in this sense.
- Xbox Accessibility Guideline 117: avoid camera shake, bobbing, motion blur, or provide an off switch; avoid repetitive side-to-side or up-and-down movement; provide adjustable FOV; lower FOV helps with motion sickness.
- Game Accessibility Guidelines: set an appropriate default FOV and allow adjustment; avoid differences between controller movement and camera movement; avoid acceleration, keep the camera under the player's control, keep a constant horizon, keep the frame rate high.
- Val Head, A List Apart: full-screen wipes and exaggerated parallax are likely triggers; opacity, colour and blur changes are not.
Sources: the pages named in I section 2.

I's rule for a scroll-driven walk under reduce: stop the continuous dolly and cut or crossfade between fixed camera stops (200 ms to 300 ms crossfade); hold the FOV constant; no head bob or idle sway; keep page scrolling itself; keep the white-out, which is an opacity and colour change.

The repo's tier: `REDUCED_MOTION_TIER: 'poster' | 'still3d' = 'poster'` in `src/config/hero.ts` (verified by grep today), pending Sam (B). On 'poster' the island never loads under reduced motion and section 4 shows its still (7.9). I's crossfade rule applies only on 'still3d' or if Sam changes the tier (see 9.12).

### 5.5 The white-out with colour sweeps (I)

Shader forms (GL Transitions, MIT; https://github.com/gl-transitions/gl-transitions):

- `fadecolor.glsl`: uniforms color (default black) and colorPhase (0.4); mix(mix(color, from, smoothstep(1 - colorPhase, 0, progress)), mix(color, to, smoothstep(colorPhase, 1, progress)), progress). The screen is the solid colour from progress 0.4 to 0.6. Set color to white.
- `colorphase.glsl`: vec4 fromStep and toStep per RGBA channel, example (0.0, 0.2, 0.4, 0.0) and (0.6, 0.8, 1.0, 1.0); mix(a, b, smoothstep(fromStep, toStep, vec4(progress))). The cheapest documented colour sweep: one smoothstep, no texture.
- `luminance_melt.glsl`: melts by brightness (luma = 0.299 R + 0.587 G + 0.114 B, threshold 0.8). A luminance ramp needs the scene as a texture, which forces a render target.
- three.js `RenderTransitionPass`: two HalfFloat render targets, both scenes rendered every frame, a full-screen triangle mixing them (mixRatio, threshold 0.1, optional mix texture); the example animates mixRatio over 1500 ms. `FullScreenQuad` is one triangle: positions (-1, 3), (-1, -1), (3, -1).
- pmndrs/postprocessing merges effects into one EffectPass.

DOM route: web.dev says restrict animations to opacity and transform; blur-like paints are slow. MDN: `background-image` animates discretely, so a gradient cannot be tweened; moving bands need background-position (paint each frame) or a transform on an oversized gradient element (compositor only). MDN WebGL best practices: fragment work dominates; render smaller and upscale; invalidate unused attachments on tiled mobile GPUs; prefer RGBA8 over RGB8; alpha:false can cost on some platforms.

Cost on a phone at 375 x 812 CSS px, DPR 2 (1.22 million pixels), reasoning from the facts above, not a measurement (I):

a) Post-process pass: at least one extra full-screen fragment pass plus a render-target write and read. A HalfFloat RGBA target at that size is about 9.7 MB; RenderTransitionPass allocates two, about 19.5 MB. Needed only for a luminance-driven white-out.
b) In-scene full-screen triangle drawn last, depth test off, alpha blend: one extra fragment per pixel in the same pass, no render target. Bands and white from uv and a progress uniform. The cheapest WebGL form.
c) DOM overlay: a fixed div fading by opacity is compositor-only but adds a second layer; bands by transform are compositor-only; bands by background-position repaint every frame.

I's recommendation: draw the white-out as one full-screen triangle in the existing scene, last in render order, with the colour bands and the fade to white computed in the fragment shader from uv and progress (the colorphase form); reserve the render-target route for a luminance-driven white-out only if the brief insists (8.D).

---

## 6. Products for the pedestals

### 6.1 The catalog (P, `Skreed_Catalog_2026-27.pdf`, 9,217,183 B, 20 pages A4; text by PDFKit, names checked against page PNGs)

Pages: 1 cover ("Tech Essentials That Go Beyond Basic."); 2 welcome (240 shades, "bringing that innovation to India"); 3 highlights (240 swatches in Matte and Gloss; Phone Cases, AirPods Cases, MagSafe Wallets; Snap to MagTough to Armor); 4 to 13 one family per page, 24 circle swatches in a 6 x 4 grid (Frosty Whites, Blissful Blues, Playful Pinks, Vivid Violets, Mellow Yellows, Earthy Browns, Blushing Corals, Stormy Greys, Go Green, Roaring Reds); 14 product ecosystem with seven photo tiles; 15 Snap and Tough; 16 MagTough and Sylvr; 17 Armor and Ultra; 18 MagSafe Wallets and Lenskin; 19 AirPods Case and Lanyards; 20 contact (+91-7993622255, collab@skreed.in, Hyderabad). No chargers, cables, power banks or stands anywhere (P).

### 6.2 Product table (P; descriptions are the catalog's own sentences, verbatim)

| # | Product | Category | Catalog description | Shades | Finishes | Devices | Page |
|---|---|---|---|---|---|---|---|
| 1 | Snap Case | Phone case, slim | "Slim, lightweight, and designed for everyday protection while preserving the sleek profile of your phone." | 240 | "Matte (except for iPhone 16 series and Samsung Galaxy models), Gloss" | Not stated on the page; family pages say phone cases cover iPhone 15/16/17/18, Samsung Galaxy S25/S26, Google Pixel 10/11 | 15 |
| 2 | Tough Case | Phone case, dual layer | "Enhanced dual-layered protection with a tough Polycarbonate exterior and a flexible TPU core. The perfect balance of style, strength, and functionality." | 240 | Matte, Gloss | As row 1 | 15 |
| 3 | MagTough Case | Phone case, dual layer, MagSafe | "Enhanced dual-layered protection with seamless MagSafe compatibility. The perfect balance of style, strength, and functionality." | 240 | Matte, Gloss | As row 1 | 16 |
| 4 | Sylvr Case | Phone case, silver metallic | "Premium protection in a sleek silver metallic finish, designed to combine everyday durability with a polished, contemporary look." | 48 | Matte, Gloss | "Offered in Snap and MagTough for the iPhone 17 and 18 series; MagTough for the iPhone 16 series; and Tough for the Samsung Galaxy S26, Google Pixel 10 and 11 series." | 16 |
| 5 | Armor Case | Phone case, rugged | "Ultra-rugged build with extra durability for demanding daily use. Reinforced with maximum impact resistance to withstand the toughest drops without compromising on style." | Not stated (unknown) | Matte, Gloss | Not stated (unknown) | 17 |
| 6 | Ultra Case | Phone case, premium dual material | "Premium form of protection. A refined dual-material design with interchangeable TPU corners for added protection and lanyard compatibility, complemented by a textured back, independent buttons, and an aluminum camera lens ring." | 240 | Matte, Gloss | "Offered for the iPhone 17/18 Pro and Pro Max models." | 17 |
| 7 | MagSafe Wallets | Accessory, wallet | "Sleek and secure MagSafe-comptaible phone wallet for convenient card storage without the bulk. Designed to blend seamlessly with your phone case for a clean and minimal look." (the typo is the catalog's) | 240 | Matte, Gloss, Metallic Matte, Metallic Gloss | Not stated | 18 |
| 8 | Lenskin ("Lens Skins" in page 14 prose) | Accessory, camera lens accent | "Sleek metal accent designed to elevate the latest iPhone's camera lens area and personalize your look. Available in a range of contrasting solid shades and patterns." | Not stated | Matte, Metallic Matte, Metallic Gloss | "the latest iPhone" | 18, 14 |
| 9 | AirPods Case | Accessory, earbuds case | "Durable polycarbonate case with a sleek profile and precise cut-outs for seamless charging and functionality. Includes a convenient carabiner ring for easy attachment to bags." | 240 | Matte, Gloss | AirPods Pro 2, Pro 3, AirPods 4, AirPods Max | 19, 14 |
| 10 | Lanyards | Accessory, strap | "Made from tightly woven material for a sturdy, comfortable feel. Designed for effortless everyday access without easily fraying." | 8 colours: Beige, Black, Light Pink, Dark Green, Purple, Sunset, Blossom, Earth (only Beige, Light Pink and Sunset are shade names) | Not stated; types Crossbody, Wrist | Not stated | 19 |
| 11 | MagSocket ("Pop Sockets" in prose) | Accessory, phone grip | No description; a photo tile only | Unknown | Unknown | Unknown | 14 |
| 12 | Forge-X ("Screen Protectors" in prose) | Accessory, screen protector | No description; a photo tile only | Unknown | Unknown | Unknown | 14 |
| 13 | The 240 shades | Colour range | "240 carefully curated shades across the spectrum" (page 2); footer on every family page: "Available for phone cases (iPhone 15/16/17/18 series, Samsung Galaxy S25/S26 series, Google Pixel 10/11 series), AirPods cases (Pro 2, Pro 3, 4, Max), and MagSafe wallets." | 240, 24 per family | Page 3 says every shade is swatched in Matte and Gloss; the swatch pages show one circle per shade | As quoted | 2 to 13 |

Family names: the catalog prints plurals ("Frosty Whites"); the site uses singulars ("Frosty White", "Basic Brown"), Sam's decision of 2026-10-14, kept as `catalogName` in `docs/data/shades-240.json`; the Dropbox folders are a third spelling. The pedestal room must use the site names (P).

### 6.3 What assets exist (P)

Dropbox renders (`docs/data/dropbox-asset-inventory.md`, listed 2026-10-01): Tough Case 5,040 PNG, `{series}/tough/{family}/{device}/{Shade}_A1.png`, 6 series (15, 16, 17, Pixel 10, S25, S26), 21 devices, 240 shades, one front view, 0.63 to 1.59 MB each; MagTough 5,040 PNG that are byte-identical copies of the Tough files, no MagSafe ring in any; Snap and Armor 40 empty folders each; Sylvr, Ultra, wallet, Lenskin, AirPods, lanyards, MagSocket, Forge-X none; swatches 264 PNG (11 folders x 24, one duplicate folder), 1.4 to 43 KB; 423 supporting lifestyle and comparison images per family, not per shade. No iPhone 18, no Pixel 11.

3D case models in the build (P, `glbjson.py` on the GLB JSON chunk; mm from each file's `unitMM` and node scales):

| Model | Files | Parts | Triangles | Bytes | Stands in for |
|---|---|---|---|---|---|
| Tough (the Cobalt case, `Cobalt.fbx`, 2026-10-09) | `public/models/case.lod0.e4e48720.glb`, `case.lod1.462e2dc8.glb` | shell (shade), trim (Urban Slate, base 0.073, 0.077, 0.077, roughness 0.553), logo (shade at tint 0.8468) | LOD0 20,348 (shell 4,785, trim 15,495, logo 68); LOD1 9,811 back only | 106,000 and 54,688 | Tough only |
| MagTough (the Desert case, `Desert.fbx`, 2026-10-15) | `public/models/magtough.lod0.a36de3c2.glb`, `magtough.lod1.108172f9.glb` | shell (shade), ring (shade), trim | LOD0 17,567 (shell 14,000, ring 68, trim 3,499); LOD1 7,967 | 96,232 and 52,160 | MagTough, Snap and Armor (`standsInFor`) |

Case height 196.43 mm (Cobalt) and 196.7 mm (Desert); width 104.7 mm at the trim; thickness 26.6 mm. The Cobalt is a stylised iPhone 17 Pro Max shape, not to scale (cavity 1.16x tall, 1.28x wide, 2.1x thick against the phone). The Desert "ring" node is a flat plate 10.6 mm wide, 11.5 mm tall, about 0.05 mm thick, 78 mm below the case centre, 72 vertices and 68 triangles: the same as the Cobalt's logo node. So it is the Skreed S inlay, not a magnetic ring. Whether the Desert shell carries a ring in relief is unknown (meshopt-compressed, not decoded). Not in the build: Snap, Armor, Sylvr, Ultra and every accessory; no Sylvr material parameter in `src/`. The procedural stand-in case is development only and must never ship (rule 38, acceptance 10). Finishes are calibrated on the Cobalt: matte roughness 0.62, gloss clearcoat 1 at roughness 0.03; Sky reads 21, 181, 236 against 8, 188, 244; the calibration was not re-measured for the Desert (P).

Coverage verdicts (P): Tough, show as 3D now. MagTough, show as 3D now and say the ring is missing. Snap and Armor, 3D on the stand-in or hold for Sam's files (the Desert is a two-layer shape, not slim; the Armor's corners are not on it). Sylvr, Ultra, wallet, Lenskin, AirPods, lanyards, MagSocket, Forge-X: cannot show yet. The 240 shades: swatches now (hexes in `shades-240.json`, or the Dropbox discs). The catalog's own photos are the brand's and may be used, but they exist only inside the PDF at 679 x 949 px (20 of them), 1,129 x 798 (8), 1,698 x 1,200 (4); which is which is unknown; 679 x 949 is too small for a 1280 px stage at 2x.

### 6.4 Proposed line-up (P; hover text is the catalog's own sentence, with a rule 17 trim where the sentence uses "seamless" or "elevate", for Sam to decide)

| # | Pedestal | What stands on it | Hover text | Status |
|---|---|---|---|---|
| 1 | Tough case | The Cobalt model in Cobalt (Blissful Blue 11, #1040ca), matte | "Tough case. Enhanced dual-layered protection with a tough Polycarbonate exterior and a flexible TPU core. Available in 240 shades. Finish: Matte, Gloss." | Ready now |
| 2 | MagTough case | The Desert model in Desert (Basic Brown 04, #c6a884), matte | Verbatim: "MagTough case. Enhanced dual-layered protection with seamless MagSafe compatibility. Available in 240 shades. Finish: Matte, Gloss." Rule 17 version: "Enhanced dual-layered protection with MagSafe compatibility." | Ready now; the model shows no magnetic ring |
| 3 | Snap case | The Desert model (stand-in) in Umber (Basic Brown 24, #662917), matte | "Snap case. Slim, lightweight, and designed for everyday protection while preserving the sleek profile of your phone. Available in 240 shades. Finish: Matte, Gloss." | Buildable; wrong shape until Sam's Snap file lands. Hold or label |
| 4 | Armor case | The Desert model (stand-in) in Sage (Go Green 09, #96a880), matte | "Armor case. Ultra-rugged build with extra durability for demanding daily use. Finish: Matte, Gloss." No "240 shades": the catalog states no count | Buildable; same caveat |
| 5 | Matte and Gloss | The Cobalt model twice in Sky (Blissful Blue 08, #08bcf4), one matte, one gloss | "Finish: Matte, Gloss. Most products are also offered in both Matte and Gloss finishes, giving you the freedom to choose the look and feel that best matches your style." (page 14) | Ready now |
| 6 | 240 shades | A swatch set: one family's 6 x 4 grid of 24 CSS circles from the hexes, or ten circles, one per family (Ivory, Cobalt, Fuchsia, Amethyst, Sunflower, Chocolate, True Coral, Charcoal, Sage, Crimson) | "240 shade swatches. Explore our complete colour library." (page 3); "240 shades, 24 per family"; the footer line can follow | Ready now; rule 24 allows swatches in catalog order |
| 7 | MagSafe wallet | Nothing yet; needs a model or a clean photo | "MagSafe wallet. Sleek and secure MagSafe-compatible phone wallet for convenient card storage without the bulk. Available in 240 shades. Finish: Matte, Gloss, Metallic Matte, Metallic Gloss." (second sentence dropped for rule 17; typo corrected) | Waiting on an asset |
| 8 | AirPods case | Nothing yet | "AirPods case. Durable polycarbonate case with a sleek profile and precise cut-outs for charging and functionality. Includes a convenient carabiner ring for easy attachment to bags. Available in 240 shades. Finish: Matte, Gloss." ("seamless" removed) | Waiting on an asset |

Not proposed: Sylvr (48 shades, metallic finish with no material, no model), Ultra, Lenskin, Lanyards, MagSocket, Forge-X. If the room wants six today: rows 1, 2, 5, 6 are honest as they stand; 3 and 4 need the stand-in caveat or Sam's yes (P).

One observation for the spec, a suggestion and not a measurement: the hall has eight floor-edge lights per wall at 1.00 m pitch from x = -1.47 to 5.58 m (2.3), and the line-up has eight pedestals. The lit slots are the natural pedestal places; the west 3 m of the nave (west of the transept) has no lights and no pools.

### 6.5 Flags for Sam (P section 8)

1. The MagTough model has no visible magnetic ring; the catalog photo shows one.
2. Snap and Armor on the Desert model show the wrong shape; Sam's files promised on 2026-10-14 have not arrived.
3. Three catalog sentences use words rule 17 bans ("seamless", "seamlessly", "elevate").
4. Armor has no shade count and no device list; do not print "240 shades" on it.
5. Page 3 promises every shade swatched in Matte and Gloss; the swatch pages show one circle per shade. Show finishes on the case (row 5), not as two swatches.
6. Page 14's prose words (Lens Skins, Pop Sockets, Screen Protectors) are categories; the tile names (Lenskin, MagSocket, Forge-X) are the product names.
7. Family names: use the site's singular names only.
8. The Dropbox renders cover 15, 16, 17, Pixel 10, S25, S26 only; the catalog also sells iPhone 18 and Pixel 11. No pedestal should name a device.

---

## 7. Pipeline

### 7.1 Rules that bind before any option (B)

- One WebGL island only (CLAUDE.md, CHECKLIST C3, exception E-C3). Section 4 cannot open a second canvas. It can only be a new scene inside the existing island, as section 2 and section 3's fog ground are. Section 3 already runs the island under the quiz as the pending exception E-S3-bg; section 4 extends that one section further and needs its own line, E-S4-hall. If Sam says no to E-S3-bg, section 4 cannot use the island and only the still remains.
- The CSP (architecture 12.3): no `'wasm-unsafe-eval'`, no `blob:`, `img-src 'self' data:`, `connect-src 'self'`, no workers. So no KTX2, no Draco, no three's WebAssembly meshopt decoder, no images embedded in a GLB. Textures ship as AVIF with a WebP fallback through our own loader (`gfx/textures.ts`, ImageBitmapLoader). Meshes ship as GLB with `KHR_mesh_quantization` plus `EXT_meshopt_compression`, decoded by the vendored pure-JavaScript reference decoder (family-page.md decision 16; 9,379 B source, 1,617 B gzip minified).
- Budgets (CLAUDE.md): critical JS under 60 KB gzip, total JS under 250 KB gzip, hero image under 120 KB, first view under 1.5 MB, LCP under 2.5 s on throttled 4G. CHECKLIST C1: the section's plan must name its own byte line. C2: AVIF with WebP fallback, sizes set, lazy below the fold.
- No `box-shadow`, no gradients as devices, no grain over a gradient (rules 1, 20, 21, 25). The hall's look must come from its render.
- Reduced motion and the poster tier never load the island (`REDUCED_MOTION_TIER = 'poster'`, verified today, pending Sam). Section 4 needs a non-island form of itself.
- `docs/02-THE-SITE-IN-WORDS.md` still calls section 4 "Reserve your shade" (verified today, line 65). This document takes the computed task as given: section 4 is the grey hall (see 9.16). Rule 38 still applies: every section shows the actual case, so every option carries the case model.

### 7.2 The machine (B, measured 2026-10-16)

| Item | Result | How |
|---|---|---|
| Blender | 5.2.2 LTS, Python 3.13.13, numpy 2.3.4 | `--version`, `-b --python blender_probe.py` |
| Cycles headless | Works on the machine's GPU (14 cores, Metal). A 1024 px, 64 sample diffuse bake of the stand-in hall took 2.8 s once kernels were cached; the very first Cycles run took 421.7 s (one-time kernel compile; cache location not found) | `bake_hall.py`, `bake_hall2.py`, three runs |
| glTF export | `export_scene.gltf` with `export_format='GLB'`, `export_image_format='NONE'` works; float32 attributes only, no quantisation or meshopt, so a pack step follows | the bake script's export |
| three.js | 0.165.0; GLTFLoader.js 109,831 B present; the WebAssembly meshopt decoder is present but banned by the CSP | `ls` |
| GLTFLoader cost | 13,857 B gzip (12,439 B brotli) minified alone; 15,250 B gzip (13,716 B brotli) with the pure-JS meshopt decoder | esbuild `--bundle --minify --external:three`, gzip -9, brotli q11 |
| gltf-transform, gltfpack | Not installed (`npx --no-install`); gltfpack would need a download | `npx --no-install` |
| meshoptimizer | 0.18.1 in `node_modules` (dev dependency of `@types/three`); its encoder, simplifier and decoder run in Node. Codec version 0 in 0.18 and 0.22, but a decode test must prove 0.18 output decodes with the vendored 0.22 decoder | `package-lock.json`, `glb_quant_meshopt.mjs` |
| AVIF encoder | sharp 0.35.5 with AVIF output (libaom 3.15.1). Pillow 11.1.0 here has WebP but no AVIF, so `scripts/hero/encode-poster.py` cannot encode AVIF on this machine as written | `node -e` on sharp.format; `python3 -I` on PIL.features |
| Case model pipeline | `scripts/case-model/intake.mjs` verifies and copies GLBs (checks C1 to C10); it does not quantise or compress; that step was done outside the repo | reading the script |
| Hashed assets | `vite.build.assetsInlineLimit: 0`; `?url` imports land under `/_astro/` with a content hash and `Cache-Control: immutable`; `/models/*` is immutable too | `astro.config.mjs`, `public/_headers` |

### 7.3 The stand-in bake and its bytes (B)

B built a stand-in hall to measure bytes: a box interior of the reference's bounding box with eight 24-sided pillars and three emissive ceiling panels (the real hall has no pillars; the stand-in's shape was a guess made before G, see 9.9). Cycles, 1024 px, 64 samples, diffuse direct plus indirect, margin 8 px; smart UV project (which wasted more than half the atlas). Result: 748 triangles, 1,176 exported vertices (392 before UV splits); GLB 43,292 B raw float32, 11,129 B gzip, 7,227 B brotli.

Lightmap encodes (sharp, effort 6):

| Lightmap | AVIF q40 | AVIF q50 | AVIF q60 | WebP q75 | WebP q82 |
|---|---:|---:|---:|---:|---:|
| 1024 px, as baked (mean 22), grey | 9,744 B | 19,552 B | 33,323 B | 25,024 B | 39,642 B |
| 1024 px, gain 3 (mean 48) | | 41,822 B | 61,243 B | | 80,820 B |
| 1024 px, gain 5 (mean 58) | | 48,004 B | 63,568 B | | 88,932 B |
| 512 px, as baked, grey | 3,843 B | 5,176 B | 6,874 B | 6,096 B | 8,194 B |
| 512 px, gain 3 / gain 5, AVIF q50 | | 8,327 B / 10,003 B | | | |

A 1024 px RGB AVIF at q50 was 19,813 B against 19,552 B grey, so colour costs almost nothing. One 1024 px AVIF encode took about 0.4 s.

GLB after our own pack (positions 14-bit int16, normals int8, UVs uint16, meshoptimizer 0.18.1 encoder): quantised raw 23,304 B plus 4,488 B of uint16 indices; meshopt streams 14,053 B; shipped GLB about 15.6 KB. That is 20.8 B per triangle, 11.9 B per exported vertex. The case model runs at 5.2 B per triangle because its vertices are shared; a hall of flat walls splits vertices at every hard edge and UV seam, so budget by vertices (B).

### 7.4 The three options (B)

(a) Procedural box geometry in three.js with real-time lights. `BoxGeometry` walls, `MeshStandardMaterial` grey (roughness about 0.9), two or three lights, at most one 1024 px shadow map. Bytes: geometry 0 B; JS about 3 to 4 KB gzip (estimate); optional 256 px grain AVIF 5 to 10 KB (estimate). Total about 4 to 14 KB plus the case. Phone cost: one full-screen opaque pass shaded by the Standard BRDF per light, the most fragment work of the three; no measured number. Work: 1 to 2 days. Risk: fails the look (no bounce, no contact darkening, banding on big flat walls that rule 20 forbids hiding under grain).

(b) A Blender-modelled hall with baked lighting, GLB plus a 1024 px lightmap. Modelled by measurement, lit in Cycles, baked to one lightmap on the glTF's `TEXCOORD_0`, exported with no images by `scripts/hall/bake.py` (our own file), packed by our own Node step (quantise plus meshopt), verified by a hall intake (one node `hall`, one material, triangles at most 8,000, raw bytes at most 60 KB), lightmap encoded by sharp (AVIF q50, WebP q82). Bytes: GLB about 25 to 45 KB (11.9 B per vertex over 2,000 to 4,000 vertices, estimate); lightmap 40 to 50 KB AVIF (41,822 to 48,004 B measured on the lifted stand-in), WebP 80 to 90 KB; JS 15,250 B gzip measured plus about 3 KB module. Total about 85 to 115 KB on AVIF browsers (125 to 155 KB WebP-only) plus the case. Phone cost: one draw call, one texture fetch per pixel, no lights; lightmap about 5.6 MB GPU memory with mips; target 487 x 1055 x 4 B = 2.06 MB plus depth at 390 x 844 and DPR 1.25; decode under 10 ms (estimate by proportion from 6 to 40 ms on 10k to 20k triangle files). Work: 4 to 5 days. Risk: 8-bit banding on dark walls (the composite's per-frame noise offset helps; needs a phone look check); atlas packing and seams; three new scripts to own.

(c) Hybrid: procedural geometry with a lightmap baked by our own script. The same primitives built in three.js from a description under 1 KB (dimensions and a list of boxes), with lightmap UVs laid out by our own atlas rule in code; the same description drives `scripts/hall/bake.py`, which builds the same primitives in Blender with the same UV rectangles and bakes. No GLB, no GLTFLoader, no decoder for the hall. Bytes: geometry 0 B plus the description; lightmap 40 to 50 KB AVIF (80 to 90 KB WebP); JS about 4 KB gzip (estimate). Total about 45 to 55 KB plus the case. Phone cost: as (b). Work: 2 to 3 days. Risk: shape too simple if the reference is ornate; the two builders must stay in step on UV layout, which a unit test proves (Blender writes `hall-uv.json`, three.js reads it).

| | (a) procedural, live lights | (b) Blender GLB plus lightmap | (c) procedural plus baked lightmap |
|---|---|---|---|
| Lazy bytes, hall only | about 4 to 14 KB (estimate) | about 85 to 115 KB | about 45 to 55 KB |
| Of which JS, gzip | about 3 to 4 KB | about 18 KB (15.25 measured plus module) | about 4 KB |
| Draw calls per frame, hall | 1 plus 0 to 2 shadow passes | 1 | 1 |
| Fragment work per pixel | Standard BRDF x lights (highest) | one texture fetch (lowest) | one texture fetch (lowest) |
| Look against the reference | flat CG room, no bounce | baked bounce and occlusion | baked bounce and occlusion |
| Work | 1 to 2 days | 4 to 5 days | 2 to 3 days |
| Main risk | fails the look | three new scripts, atlas, banding | shape too simple if ornate |

The case in every option: Tough LOD1 54,688 B raw (39,033 B brotli if Cloudflare compresses `.glb`, unverified) or LOD0 106,000 B, plus GLTFLoader and the decoder (15,250 B gzip) in every option. Honest totals with the case at LOD1: (a) about 75 to 85 KB, (b) 140 to 170 KB, (c) 115 to 125 KB (B).

### 7.5 The chosen way and its reasons

B left the choice between (b) and (c) open on one question: how ornate the reference hall is beyond its bounding box. G answers it. The hall is an axis-aligned box with eight flat raised panels, one rectangular slot through both side walls, two shallow floor slots under the end walls, and five rounded boxes under the ceiling. No arches, mouldings, vaults or pillars (1.8). Every element is a box; the only curves are edge fillets of 0.013 to 0.055 u, which a bake can carry as bevel shading without geometry. So this document records (c) as the chosen way, subject to Sam:

1. Shape: the description in 1.8 is about 20 boxes. (c)'s "list of boxes" covers it with no modelling session.
2. Bytes: about 45 to 55 KB for the hall on AVIF browsers (B), inside a proposed 150 KB section line with the case (7.7).
3. Phone cost: one draw call and one texture fetch per pixel, the lowest of the three (B).
4. Look: the light is baked with bounce and occlusion, which (a) cannot give (B). The bake must carry what L measured: the five fixture glows that fall off within 0.3 m (2.2), the sixteen warm pools at 1.00 m pitch under the panels (2.3), the bright blue transept (2.5), the along-hall gradient (2.9), and the seams baked 30 to 35 % darker (1.5, 2.5). The fixtures are emissive boxes in the description; the floor-edge lights are small emissive patches in the panel slot.
5. Drift-proof: the same JSON drives Blender and three.js, and a unit test pins the atlas (B).

What (c) does not cover, carried as open questions: the reflection term L says makes the far floor mirror the fixtures (0.2 face-on to 0.4 grazing from a cube map of the hall itself; B's material is one lightmap fetch and budgets no cube map, see 9.18); the micro-grain detail normal (L's roughness 0.35 to 0.45 equivalent); the demo's post chain (section 4, which lands in the composite, not in the hall material). A derived number, not measured: a 1024 px lightmap over G's 213.8 m^2 of surface is 0.0143 m per texel at perfect packing (sqrt(213.8) / 1024); the fixture boxes (0.21 m wide) and the 0.05 m seams need the atlas to give them more than their area share, or the seams come from the material rather than the bake.

Measure before building: the family page's probe method (acceptance 8 and decision 7: 20 timed renders of the pose, pass at 1.25 frame periods or less, or 12 ms GPU where the timer query exists, plus a trace on a Moto G class phone) must run on each material before the look work starts. No phone frame time was measured by any report (B).

### 7.6 How the hall fits the island (B section 2)

The island holds several scenes under one `WebGLRenderer` (`gfx/renderer.ts`: antialias on, ACESFilmic on the canvas, DPR capped at 1.25 touch and 1.5 fine). Section 2 and section 3's fog ground each render into their own `WebGLRenderTarget` at device pixels under `NoToneMapping` with the clear colour saved and restored, and the composite (`post/composite.ts`) wipes between two textures with `uProgress`. Section 4 follows the same contract.

- Module: `src/scripts/hero/section4/hall.ts`, `createHall(renderer, reduced, dpr)` returning `{ started, ready, failed, out, load(), resize(w, h), update(S, tp3, t, dt), render(), dispose() }`, shaped like the fog ground plus section 2's readiness flags. Render target `WebGLRenderTarget(w, h, { depthBuffer: true, colorSpace: SRGBColorSpace })`, drawn under `NoToneMapping` as `section3/ground.ts` does. Material: `MeshBasicMaterial` with the lightmap as `map` and the hall grey as `color`, or a 20-line `ShaderMaterial` that samples the lightmap on `uv` and adds a small dither. The case uses the family page's `case-glb.ts` material path if importable, else `MeshStandardMaterial` under a `RoomEnvironment` PMREM (114 B gzip, measured).
- Lazy chunk: `hero.ts` holds `import('./section4/hall.ts')` as `Quiz.astro` holds the deck import; data files imported with `?url` inside the chunk land hashed and immutable. `scripts/hero/budget.mjs` needs a `hall` group and `avif|glb` in its data regex, or section 4's bytes are invisible to the budget run.
- Trigger: add `section#s4` to the existing IntersectionObserver; start `hall.load()` when `#find` (the quiz) first intersects, so the 85 to 155 KB (about 0.5 to 0.8 s at 1.6 Mbps plus a round trip) arrives during the quiz; the chunk itself can use the quiz's `rootMargin: '100% 0px'`.
- Readiness: if `#s4` arrives before `hall.ready`, `tp3` stays 0 and the fog ground stays the whole frame; the wipe plays when the hall is ready and the section is in view. A failed load warns, keeps `tp3` at 0, sets `html.s4-still` so the still shows above the canvas, and never calls `toPoster` (architecture 6.5's rule for a failed wide load).
- The third wipe: `tp3 = clamp01((b - S4) / WIPE)` with `S4 = (s4.offsetTop - innerHeight) / innerHeight` read in `stage/resize.ts` (re-read on the quiz's resize and on every `resize()`); `mapScroll` gains `tp3` with a unit test next to `tp2`'s in `tests/unit/hero-math.test.ts` (`tp2 = clamp01((b - S2T.W2) / WIPE)` at `scroll/scrollMap.ts` line 26, verified today). In loop F14 after the fog ground: `hallOn = tp3 > 0 && hall.ready`; `groundOn` gains `&& tp3 < 1`; composite inputs when `tp3 > 0`: `tA = fogGround.out`, `tB = hall.out`, `uProgress = tp3`, `uParA = 0`, `tS = mask.black`, `uKeep = 0`. At `tp3 = 1` the frame is two passes (hall, composite). `clipFor(tp3, ...)` is available for a text block cut by the same edge. `uCalm` is already 1 on the `still3d` tier. The parity frames at 5.5, 6 and 15 screens stay identical if `tp3` is 0 there (S4 is past 17.2 screens by construction).
- Warm-up: inside `hall.load()` after its fetches: `renderer.compileAsync`, `renderer.initTexture(lightmap)`, one 8 x 8 render, the composite drawn once at `uProgress` 0.5 with `tB` the hall, then resize back; `yieldFrame()` between steps keeps it under the 200 ms task line. The loader's 27 milestones do not change.
- Resize, disposal, hooks: `stage/resize.ts` calls `ctx.hall?.resize(domElement.width, domElement.height)` and reads `S4`; `hero.ts` registers `hall.dispose()` with `life.onKill`; hooks builds expose `__s4`; the tune panel gets the hall grey and the composite progress.

Section 4's scroll height for the walk is not set by B (S4 comes from `offsetTop` only); C's dolly needs 8 screens for a 4-unit path at 0.5 units per screen (see 9.15).

### 7.7 The budget (B, `node scripts/hero/budget.mjs dist` on the build of 2026-10-16 12:37)

Today, gzip unless noted: critical JS 12.9 KB (line 60); quiz chunk 5.8 KB; island chunk 169.6 KB; total JS 188.4 KB (line 250), so 61.6 KB of JS headroom for every later section plus PostHog and the beacon. Posters: portrait AVIF 33.4 KB, wide 78.1 KB (line 120). First view, poster tier: 71.2 KB portrait, 115.9 KB wide. First view, 3D tier: 2,495.3 KB portrait (2,555,187 B), 2,540.0 KB wide, against the 1.5 MB line; over by about 1,055 KB on phones, caused by the 4096 px sky WebP (1,146.8 KB) and ground WebP (776.7 KB) shipped to every class; the remedy is stage 2 of architecture 6.2 (per-class AVIF crops: phone 1,032,565 B, desktop 1,255,906 B). Section 4 cannot fix that and must not make it worse.

What section 4 may add, if it loads lazily (dynamic `import()`, never a static import or a preload, images `loading="lazy"`): first view 0 B (dynamic chunks and their data are outside the first-view set); total JS about 18 to 20 KB in every option, because the case needs GLTFLoader and the decoder anyway, leaving about 40 KB for PostHog, the beacon and sections 5 to 8; LCP and Lighthouse unaffected (the poster tier never loads the island). Proposed section line (CHECKLIST C1): 150 KB of lazy bytes on AVIF browsers for the hall plus the case LOD1, and 60 KB per class for the still, matching the family page's 150 KB for shared maps and the quiz's 60 KB stills. At the Lighthouse 4G profile (1.6 Mbps, 150 ms RTT) 150 KB takes about 0.9 s, and the fetch starts at the quiz.

What would break the rules: a static import of GLTFLoader into the hero chunk (15 KB into the first view on the 3D tier); a GLB with embedded images; KTX2 or Draco; a second canvas; a lightmap above 1024 px on phones (a 2048 px AVIF is about 4x the bytes, estimate, and 22 MB of GPU memory with mips).

### 7.8 The fallbacks (B section 4)

What the site does today: the head Gate picks the poster tier when there is no `WebGL2RenderingContext`, no `DecompressionStream`, `saveData`, a 2g or slow-2g connection, `deviceMemory` of 2 GB or less, or reduced motion; `boot.ts` refuses software GL by renderer string; hard failures call `toPoster` (the island dies, the track collapses to 100svh, scroll is kept). On the poster tier the page is one screen of the poster, the family links, then section 3 on `--night` (#050506) with its Pearl Whisper panels; the quiz has no still of the fog by decision. On `still3d` (test override only today) the island runs with the fog's `uTime` pinned at 7, `uCalm` on, 150 ms fades. No JavaScript: the poster layout is the default CSS.

What section 4 should do:

- Poster tier, data saver, reduced motion as 'poster', failed boot, context lost: a still of the hall with the case in it, a `<picture>` in the section's own markup with the hero poster's four sources (AVIF and WebP, portrait and wide, the `POSTER_MEDIA` queries), `loading="lazy"`, `decoding="async"`, width and height set, at most 60 KB per class. Rendered from the built page's own hall at the end of the third wipe by `scripts/hero/render-poster.mjs`'s method (hooks build, `__skreedFreeze`, a seek) and encoded by sharp with the hero poster's settings (AVIF q50 to q60, WebP q70 to q80). The hero's posters are 33.4 KB and 78.1 KB for a far busier frame; a grey hall should land under 60 KB, unknown until rendered. The section's text and controls stay the same DOM as on the 3D path (rule 12). Rule 38 is met: the case is in the still.
- The still is also the recovery for a section 4 load failure on the 3D path (`html.s4-still`).
- `still3d` (and reduced motion if Sam picks that tier): the hall renders with its camera at the end of its path, no drift, `tp3` follows the scroll only, the case's idle turn off.
- No JavaScript: the still shows, the DOM text shows, any control carries its `<noscript>` line.
- Contrast: Pearl Whisper over a mid-grey hall will not reach 4.5:1 by itself. Section 3 solved this with the ground's `uLab` plates fed by a `skreed:plates` event; section 4 needs the same event into the hall's shader (darken under the text rects to luma 113 or less, feathered), and the still darkened the same way once. Where the text sits is unknown until the copy exists.
- Exceptions to record for Sam: E-S4-hall (the island under a fourth section, extending E-S3-bg) and the still's darkening if it reads as a plate (as E-S3-plate does).

---

## 8. Open questions for the site owner

Merged from the six reports. "Answered" means another report settled it; the answer is given so Sam can confirm.

### A. The hall

1. Which end gets the door. The two ends are geometrically identical except the east end panel is 0.044 u (0.022 m) taller (G). A door on the corridor centre line (scene z = 0) must cross or stop the 0.155 m deep floor slot under the end wall (G). Open.
2. Are the five ceiling boxes lights or beams. Answered by L: they are emissive lights, baked #d7e4ec with pure white ceiling patches behind them (2.2). Confirm.
3. What should appear beyond the open transept ends. The reference models nothing there; the demo shows its white clear colour (G, L). Open.
4. The origin of the shader's 6.32 / 7.961 cube-map depth constants is unknown; no measured extent matches them, and the demo overrides the uniform with the scaled bounding box 12.217 x 4.000 x 4.176 m at run time (G, C). Open, and of no consequence for the build.
5. Real-world scale of a scene unit (G, L, C). The OBJ header says centimetres; the demo rescales to 4 units high. If OBJ units were metres the hall would be 24.6 m long, 6.3 m wide and 8.1 m tall, the eye-level shot 1.83 m, and the walk speeds 0.24 to 0.80 m/s (C). Not established. All sizes here are in scene and OBJ units.
6. Whether the pure-white ceiling patches baked behind the five fixture boxes ever show on screen was not checked by rendering (L). Open; they should be hidden inside the boxes.
7. The green channel convention (y up or y down) of the two normal maps is unknown; tilt magnitudes do not depend on it (L). Matters only if the seam map is drawn from the reference's convention, which it is not.

### B. Light

8. The worked on-screen values ignore the reflection term, depth of field and the bloom buffer's aspect-fit sampling; the orb was not measured (L). Known limits of the numbers in 2.8.
9. Whether section 4 renders the reflection term at all (a once-rendered cube map of the hall, 0.2 face-on to 0.4 grazing per L) or ships the lightmap alone (B). Cost not measured (new, from the merge, see 9.18).

### C. Camera and post

10. Colour pipeline for the walk scene: `NoToneMapping` with 8-bit post targets reproduces the demo's white clip; the hero canvas uses ACES; B's island design puts the hall through the ACES composite (C, B; see 9.11). Sam decides which the walk uses.
11. Scroll-dolly gain and path length: 0.5 scene units per screen is proposed; the path length (4 units = 8 screens, the full nave = 24 screens) is a content decision (C). The section's height in screens must be set in its markup; B's S4 is read from `offsetTop` only (9.15).
12. Vignette on portrait phones: the demo's formula gives black corners on 390 by 844; normalising by max(width, height) is proposed instead of matching the demo's phone look (C).

### D. Interaction

13. What corridor unit should 10 Roblox studs map to for the door prompt's show distance. The brief gives no scale (I).
14. Does the brief require a luminance-driven white-out (bright parts first), which forces a render target, or is a plain overlay with colour bands acceptable (I).
15. The built-in Roblox CoreScript's exact appear animation (fade duration, any scale-in) is unpublished; should the spec adopt the official look-alike sample's 0.2 s Quad-Out fade (I).
16. igloo.inc's behaviour on a real phone after its loader could not be measured in the emulated pane; is a real-device check wanted before it is cited as a phone reference (I).
17. The repo's note calls igloo.inc "Site of the Year 2024" but the Awwwards site page lists only Site of the Day (2024-07-23) and a Developer Award; which should the spec cite (I).
18. Reduced motion: with `REDUCED_MOTION_TIER = 'poster'` the island never runs under reduced motion and section 4 is a still; I's crossfade-between-stops rule applies only on `still3d`. Does Sam keep 'poster' (B, I; 9.12).

### E. Products

19. Does Sam accept the catalog's own wording in hover text where it uses "seamless" or "elevate", or the trimmed versions that follow CLAUDE.md rule 17 (P).
20. Should the MagTough pedestal ship on the Desert model with no visible magnetic ring, or wait for a model that has one (P).
21. Should Snap and Armor take pedestals on the Desert stand-in (wrong shape) now, or wait for Sam's Snap and Armor files promised on 2026-10-14 (P).
22. Do originals of the catalog's accessory photos (wallet, AirPods case, Lenskin, lanyards, MagSocket, Forge-X) exist outside the PDF, or will accessory models be supplied (P).
23. What is the Armor case's shade count and device list. The catalog does not state either (P).

### F. Pipeline

24. Sam's answer on E-S3-bg (the island running under section 3) decides whether section 4 may use the island at all; if no, only the still remains (B).
25. Which of (b) or (c) fits. Answered by G: the hall is boxes only, so (c) (7.5). Confirm.
26. No phone frame time was measured for any option; the family page's probe method (20 timed renders, 1.25 frame periods, Moto G class trace) should run on each material before the look work starts (B).
27. Whether Cloudflare compresses `.glb` on skreed.in is unverified, so GLB bytes are counted raw (B).
28. meshoptimizer 0.18.1's encoder output decoding with the vendored 0.22.0 reference decoder is expected (codec version 0) but not proven; a T16-style test or pinning 0.22.0 is needed (B).
29. The still's bytes and section 4's text placement (and so its contrast handling) are unknown until a hall and copy exist (B).
30. `docs/02-THE-SITE-IN-WORDS.md` still names section 4 "Reserve your shade"; the task makes it the grey hall. Which is section 4, and where does the reservation form go (B; 9.16).

### G. Process notes, for the parent session rather than Sam

31. The shared `tools/` directory is being written by another session (it overwrote `hall_measure.py`); scripts there should use distinctive names (L).
32. The user's message asked for a localhost link to inspect the site; the subagents started no server, so the parent should serve dist (`npm run preview` on port 8787) and hand over the link (B).

---

## 9. Contradictions between reports, resolved or flagged

9.1 Unit naming. B writes the reference's OBJ units as metres ("24.602 m long", "radius about 4.42 m"). G, L and C treat OBJ units as unitless with the real scale unknown, and use "m" for the scene unit (OBJ x 0.49656). Resolved: this document reads B's "m" as "u"; the real scale stays open (8.5).

9.2 Hall length. C gives the end walls at x = plus and minus 12.30 u (plus and minus 6.108 scene) and a nave "12.2 units long"; G gives the base end walls at -12.006 and +11.926 u, 23.93 u = 11.88 m wall face to wall face, with the bounding box 12.217 m including the 0.31 u floor slots and the ceiling overshoot. Resolved: walkable length 11.88 m between base walls, 11.65 m between end panel faces (x -5.836 to 5.816); 12.217 m is the cube-map box only. C's 30 s end-to-end at 0.4 u/s becomes about 29 s.

9.3 Transept position. C places the transept bay at x -6 to -4 u (-2.98 to -1.99 scene) from a coarse x profile and calls the orb's x = -4 u "in that bay". L writes the slot as x = -3.1 to -2.27 m. G's slice gives x = -5.909 to -4.593 u = -2.924 to -2.271 m. Resolved to G (a direct slice of the mesh). Consequences: the orb at -1.99 m sits 0.28 m east of the slot's east edge, in the nave, not inside the slot; shot 1's camera at x = -2.48 is inside the slot; L's -3.1 is unexplained and is read as -2.92.

9.4 Ceiling fixture count. C found three vertex clusters (x -8 to -7, -1 to 1, 6 to 7 u); G and L find five. The end fixtures at x = -11.85 and 11.63 u fell into C's end-wall bins. Resolved: five.

9.5 Fixture size. G: 0.431 x 3.385 u (0.21 x 1.68 m) from vertices; L: 0.435 x 3.34 u (0.216 x 1.66 m) from texels. The 0.045 u length difference is the fillet and the texel size. Resolved: G for geometry, L for colour.

9.6 Fixture centres. G: scene x -5.87, -3.53, 0.06, 3.19, 5.78; L: -5.877, -3.526, 0.066, 3.197, 5.790. Within 0.01 m, different methods. Resolved: G's numbers in the rebuild list.

9.7 Lights or beams. G: unknown from geometry. L: emissive lights by the baked colour. Resolved: lights (8.2).

9.8 Wall clearance. C's "1.1 units clear of the nave walls" uses the base half-width 1.575; G's east panel faces are at 1.464 and the west at 1.522. A camera 0.4 off centre is 1.06 m from the east panel face. Resolved: use the panel faces.

9.9 The stand-in's shape. B's stand-in hall for byte measurement has eight pillars and three ceiling panels; G shows the reference has no pillars, eight flat raised panels and five fixture boxes. B stated it had not analysed the shape and left (b) versus (c) open. Resolved: (c) is chosen (7.5); B's bytes stay valid as rates (11.9 B per vertex, lightmap bytes per exposure), not as totals for the real hall.

9.10 Which post module. C cites `post/composer.ts` for the hero's `UnrealBloom` at 256 by 256; B lists `post/composite.ts` for the wipe. Both exist (verified today: `composer.ts` line 21 constructs `UnrealBloomPass(new Vector2(256, 256), bloom, 0.22, 0.62)`). Not a contradiction; recorded so the spec names both.

9.11 Colour pipeline. C: the demo look needs `NoToneMapping` and 8-bit targets that clip at the vignette's x2 boost. B: the hall renders under `NoToneMapping` into an sRGB target, then the composite draws to the canvas under ACESFilmic (`gfx/renderer.ts`). ACES maps a clipped 1.0 below white and softens the demo's clip. Flagged for Sam (8.10).

9.12 Reduced motion. I's rule (snap between stops behind a 200 to 300 ms crossfade, FOV fixed, no bob) assumes the hall renders under reduced motion. B: `REDUCED_MOTION_TIER = 'poster'` (verified today) means the island never loads under reduced motion and section 4 shows its still. Resolved: I's rule applies on `still3d` only, or if Sam flips the tier (8.18).

9.13 Pixel ratio cap. I recommends `min(devicePixelRatio, 2)` from the Codrops demo. C and B: the repo's `DPR_CAP = { touch: 1.25, fine: 1.5 }` (verified today). Resolved: the repo's caps.

9.14 Scroll smoothing. I: 0.2 s (drei default) to 1 s (Codrops quickTo). C: a 0.5 s follower from the hero's own parallax lerp. Compatible; 0.5 s adopted.

9.15 Scroll height. C's dolly needs 8 screens for a 4-unit path at 0.5 units per screen (24 screens for the nave). B's island fit reads `S4` from `offsetTop` and does not give section 4 a scroll height. Flagged: the section's height in screens is a content decision to add to the spec (8.11).

9.16 Section 4's identity. `docs/02-THE-SITE-IN-WORDS.md` section 4 is "Reserve your shade" (verified today, line 65). The computed task and every report treat section 4 as the grey hall. B noted it. Flagged for Sam (8.30).

9.17 Mesh counts. B: 3,878 faces (3,882 triangles). G: 3878 faces, 3877 triangles and 1 heptagon. L: 3882 triangles after fan triangulation. Consistent: the heptagon fans into 5 triangles, 3877 + 5 = 3882.

9.18 The reflection term. L's recipe needs a cube map of the hall itself for the reflection (0.2 face-on to 0.4 grazing) and says it is what makes the far floor mirror the fixtures. B's materials are one lightmap fetch and budget no cube-map render. Flagged (8.9); the cost of a once-rendered cube map (six draws of the hall at load, at say 256 px per face) is not measured.

9.19 Texel density. L: 0.0053 m per 4096 texel on the reference. B: 3 cm per texel at 1024 px over the stand-in's 946 u^2 (the bounding box surface). Different objects. Derived here for the real hall at 1024 px over G's 213.8 m^2: 0.0143 m per texel at perfect packing. Not a contradiction.

9.20 Rounding. Scale 0.49656 (G), 0.49657 (C), 0.4966 (task); nave 11.88 m (G) and "11.8 m" (L); eye height 0.908 (C's text), 0.91 (C's table), 0.90 (C's proposal). All rounding.

9.21 Awwwards. The repo's note: igloo.inc "Site of the Year 2024". The Awwwards site page: Site of the Day 2024-07-23 and a Developer Award (I). Flagged (8.17).

9.22 Floor-edge lights. G reports no floor-level fixtures because the mesh has none; L finds sixteen baked pools. Not a contradiction: they are texture only. Any rebuild must put them in the lightmap or as emissive patches, since the geometry gives no cue.

9.23 Post on phones. C ranks FXAA and DOF as drops and says our renderer has MSAA; B confirms antialias on in `gfx/renderer.ts` and a composite that already runs. Consistent.
