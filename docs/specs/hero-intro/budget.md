BYTE AND RUNTIME BUDGET
Page bytes:
- Loader inline (CSS + markup + script + 100-cell tape): ≤ 3,000 B raw, ≤ 1,400 B gzip.
  - The current Plot-scan-cut block measures 9,955 B raw / 4,776 B gzip in the built page, so this saves about 7.0 KB raw / 3.4 KB gzip.
  - That includes the PLOT outline data and the WT weights, which are removed. build7.py's loader budget changes from 10000 to 3000.
- Intro code in the module: ≤ 14,000 B raw, ≤ 5,500 B gzip.

  | Part | Raw |
  |---|---|
  | cage generator (clump grower + 3-face template + attributes) | 2.5 KB |
  | outline loop builder | 1.2 KB |
  | triangle tiling generator | 0.8 KB |
  | mosaic | 0.2 KB |
  | number atlas | 0.6 KB |
  | shaders: cage/outline/numbers | 1.6 KB |
  | shaders: print | 0.4 KB |
  | shaders: floor chunk | 1.0 KB |
  | shaders: sky | 0.3 KB |
  | shaders: composite | 0.2 KB |
  | timeline rows + 5 bezier eases + evaluator | 2.5 KB |
  | UI plate reveal | 1.2 KB |
  | test hooks | 0.8 KB |

- Shipped data: 0 B. Geometry and textures are generated at load from seed 20261009. No igloo file is fetched, embedded or decoded at runtime.
- Poster (poster path only, loaded on demand): hero-poster 1280w WebP ≤ 120 KB, 780w ≤ 60 KB. It is the only new image.
- Net: about +5.5 KB gzip of module JS and -3.4 KB gzip of inline loader. Critical JS (inline loader + countdown) stays well under 60 KB gzip. three remains one CDN module, now dynamically imported after the poster guard.

Runtime:
- Intro data build ≤ 25 ms on a mid phone: cage ≤ 8, triangle canvas ≤ 10, atlas ≤ 3, outline + mosaic ≤ 4. It runs before the 'intro' milestone, behind the loader.
- GPU memory about +0.5 MB:
  - tTri 512² R8: 256 KB, plus 85 KB of mips
  - atlas 32x1024 RGBA: 128 KB, plus mips
  - mosaic: 1 KB
  - buffers about 45 KB (cage 1404 vertices × 7 floats, outline about 776 vertices, about 260 points)
- Draw calls +3 during the intro and 0 after 5.1 s: all three meshes are hidden, then disposed at 8.2.
- Timeline evaluation ≤ 0.1 ms per frame. Floor chunk: 2 extra texture taps per ground fragment, and only while uU2 < 1.
- Frame targets: ≤ 16.7 ms at 1280x800 on a mid laptop through the whole intro; ≤ 33 ms on a mid phone at DPR 1.25. No shader compile and no texture upload after ready (T3).
- Loader: the tape is a compositor-only transform. Zero main-thread cost while assets load.