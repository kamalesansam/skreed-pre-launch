# Section 4, part three: Pearl Whisper's contrast on the scene (AC12, E-S4-contrast)

Measured 2026-10-23 by `scripts/room/contrast.mjs` on the served hooks build (`build:test`) at http://127.0.0.1:8791/, in the installed Chrome on the Metal GPU, at 390 x 844 and 1280 x 800, device pixel ratio 1, so a CSS pixel is a pixel of the shot. The bottom shade: the build's own (SHADE in carousel.ts).

**Method (AC12).** Each decoded line's box is read from its glyph row (`.dc`); the section's text, the logotype and the Back to top control are hidden through the CSSOM for one shot and the scene alone is shot; inside each box the scene's relative luminance gives the median and the lightest 5 percent, and Pearl Whisper's (#F7F6F3) ratio is taken against each. The prompt is one frame over the hall, which holds still; Skip over the bubble at 25, 50 and 90 percent and every text box of each scene at rest are 10 frames 500 ms apart with the loop playing: the **median** is the median over the frames of each frame's median ratio, the **worst** the lowest over the frames of each frame's lightest-5-percent ratio. Ratios under 4.5:1 are in bold. AC12 says the bottom shade is darkened until every median is 4.5:1 or better and anything under is flagged to Sam, never boxed.

## Every box, median / worst

| Frame | Box | 390 x 844 | 1280 x 800 |
|---|---|---|---|
| the prompt at the station | rm-key | **2.36** / **2.25** | **2.85** / **2.71** |
| the prompt at the station | rm-enter-text | **2.77** / **1.91** | 8.53 / **3.25** |
| Skip, the bubble at 25 percent | rmSkip | 17.10 / 17.10 | 11.91 / 11.75 |
| Skip, the bubble at 50 percent | rmSkip | 14.42 / 14.25 | 11.91 / 11.75 |
| Skip, the bubble at 90 percent | rmSkip | 14.42 / 14.25 | 7.28 / 6.25 |
| scene 1 cove (Phone case) at rest | rmName-cove | 13.63 / 8.86 | 10.77 / 7.07 |
| scene 1 cove (Phone case) at rest | rm-scene-shade | 9.23 / 6.84 | 11.37 / 7.51 |
| scene 1 cove (Phone case) at rest | rm-scene-line | 12.04 / 7.94 | 12.16 / 8.44 |
| scene 1 cove (Phone case) at rest | rmSceneHint | 13.29 / 8.72 | 14.36 / 11.78 |
| scene 1 cove (Phone case) at rest | rm-scene-count | 14.09 / 8.69 | 17.66 / 16.06 |
| scene 1 cove (Phone case) at rest | rmPrev | 14.77 / 8.71 | 12.55 / 7.57 |
| scene 1 cove (Phone case) at rest | rmNext | 15.01 / 7.37 | 16.86 / 15.52 |
| scene 2 grove (AirPods case) at rest | rmName-grove | 13.60 / 6.47 | 17.30 / 12.84 |
| scene 2 grove (AirPods case) at rest | rm-scene-shade | 17.23 / 13.31 | 17.18 / 12.76 |
| scene 2 grove (AirPods case) at rest | rm-scene-line | 15.85 / 11.56 | 15.60 / 10.05 |
| scene 2 grove (AirPods case) at rest | rm-scene-count | 17.78 / 9.79 | 18.23 / 15.57 |
| scene 2 grove (AirPods case) at rest | rmPrev | 16.73 / 11.98 | 15.72 / 10.84 |
| scene 2 grove (AirPods case) at rest | rmNext | 17.26 / 12.90 | 17.96 / 7.20 |
| scene 3 ember (MagSafe wallet) at rest | rmName-ember | 17.30 / 13.18 | 13.75 / 4.70 |
| scene 3 ember (MagSafe wallet) at rest | rm-scene-shade | 18.04 / 13.58 | 15.81 / 13.38 |
| scene 3 ember (MagSafe wallet) at rest | rm-scene-line | 16.22 / 13.44 | 15.53 / 9.02 |
| scene 3 ember (MagSafe wallet) at rest | rm-scene-count | 18.81 / 15.38 | 18.81 / 16.25 |
| scene 3 ember (MagSafe wallet) at rest | rmPrev | 16.70 / 15.73 | 17.44 / 14.86 |
| scene 3 ember (MagSafe wallet) at rest | rmNext | 16.84 / 16.31 | 18.77 / 18.06 |
| scene 4 palace (Lenskin) at rest | rmName-palace | 8.31 / 6.94 | 18.04 / 9.13 |
| scene 4 palace (Lenskin) at rest | rm-scene-shade | 6.92 / 5.19 | 16.39 / 5.59 |
| scene 4 palace (Lenskin) at rest | rm-scene-line | 7.01 / 5.98 | 9.13 / 5.49 |
| scene 4 palace (Lenskin) at rest | rm-scene-count | 8.46 / 7.21 | 10.35 / 9.27 |
| scene 4 palace (Lenskin) at rest | rmPrev | 6.11 / 5.68 | 7.00 / 6.67 |
| scene 4 palace (Lenskin) at rest | rmNext | 6.35 / 5.95 | 8.65 / 7.03 |
| scene 5 dawn (Phone case) at rest | rmName-dawn | 6.56 / 5.70 | 6.20 / 5.13 |
| scene 5 dawn (Phone case) at rest | rm-scene-shade | 11.93 / 6.68 | 6.35 / 5.14 |
| scene 5 dawn (Phone case) at rest | rm-scene-line | 12.87 / 8.83 | 6.02 / 4.79 |
| scene 5 dawn (Phone case) at rest | rm-scene-count | 12.15 / 11.08 | 11.33 / 9.13 |
| scene 5 dawn (Phone case) at rest | rmPrev | 13.66 / 10.29 | 6.87 / 6.57 |
| scene 5 dawn (Phone case) at rest | rmNext | 15.65 / 12.90 | 13.38 / 7.90 |

## Per frame, the lowest median and the lowest worst across its boxes

| Frame | 390 x 844: median | worst | 1280 x 800: median | worst |
|---|---|---|---|---|
| the prompt at the station | **2.36** | **1.91** | **2.85** | **2.71** |
| Skip, the bubble at 25 percent | 17.10 | 17.10 | 11.91 | 11.75 |
| Skip, the bubble at 50 percent | 14.42 | 14.25 | 11.91 | 11.75 |
| Skip, the bubble at 90 percent | 14.42 | 14.25 | 7.28 | 6.25 |
| scene 1 cove (Phone case) at rest | 9.23 | 6.84 | 10.77 | 7.07 |
| scene 2 grove (AirPods case) at rest | 13.60 | 6.47 | 15.60 | 7.20 |
| scene 3 ember (MagSafe wallet) at rest | 16.22 | 13.18 | 13.75 | 4.70 |
| scene 4 palace (Lenskin) at rest | 6.11 | 5.19 | 7.00 | 5.49 |
| scene 5 dawn (Phone case) at rest | 6.56 | 5.70 | 6.02 | 4.79 |

## Medians under 4.5:1

- 390x844, the prompt at the station, rm-key: 2.36 (worst 2.25)
- 390x844, the prompt at the station, rm-enter-text: 2.77 (worst 1.91)
- 1280x800, the prompt at the station, rm-key: 2.85 (worst 2.71)

## Not shown in these frames

- The loading line (`.rm-scene-more`): every loop was in before its scene was measured, so it never showed.
- The 2.2.2 control (`#rmPause`): hidden while E-S4-loops is pending (the director sets data-pause only once Sam declines it).
- The scene hint shows on scene 1 only (its first visit).

## GPU at scene 1 at rest, 390 x 844

```json
[
 {
  "vp": "390x844",
  "at": "scene 1 at rest",
  "geometries": 56,
  "textures": 55,
  "programs": 42,
  "carousel": 21817122,
  "loops": [
   {
    "i": 0,
    "state": "in",
    "in": true,
    "refused": false,
    "playing": true
   },
   {
    "i": 1,
    "state": "in",
    "in": true,
    "refused": false,
    "playing": false
   },
   {
    "i": 2,
    "state": "in",
    "in": true,
    "refused": false,
    "playing": false
   },
   {
    "i": 3,
    "state": "in",
    "in": true,
    "refused": false,
    "playing": false
   },
   {
    "i": 4,
    "state": "in",
    "in": true,
    "refused": false,
    "playing": false
   }
  ]
 }
]
```
