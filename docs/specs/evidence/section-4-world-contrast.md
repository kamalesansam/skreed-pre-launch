# Section 4, part two: Pearl Whisper's contrast on the scene (AC12, E-S4-contrast)

Measured 2026-10-21 on `s4/world-wire` at `ec030cb`, from `build:test` with the four lands Sam approved on sheet-final (N = 4). Option A's travel is still a placeholder on this branch, so every travel between lands is the 300 ms cross-fade. The build was served by wrangler and measured in Playwright's Chromium on the Metal GPU (Apple M3 Pro), at 390 x 844 and 1280 x 800, device pixel ratio 1, so a CSS pixel is a pixel of the shot.

**Script.** `scripts/room/contrast.mjs`, which uses section 3's method (`scripts/quiz/contrast.mjs`):
- It reads each decoded line's box from its glyph row (`.dc`).
- It hides the section's text (`#rmStage`) and the logotype through the CSSOM for one frame and shoots the scene alone.
- Inside each box, it takes the scene's relative luminance: the median, and the lightest 5 percent.
- It prints Pearl Whisper's (#F7F6F3) ratio against each: the **median**, and the **worst**, against the lightest 5 percent.

Below, each frame gives the lowest median and the lowest worst over its lines. Ratios under 4.5:1 are in bold. AC12 says they are recorded and flagged to Sam, never boxed.

## The frames

| Frame | 390 x 844: median | worst | 1280 x 800: median | worst |
|---|---|---|---|---|
| the prompt at the station | **2.36** | **1.91** | **2.85** | **2.71** |
| Skip, the bubble at 25 % | 17.10 | 17.10 | 11.91 | 11.75 |
| Skip, the bubble at 50 % | 14.42 | 14.25 | 11.91 | 11.75 |
| Skip, the bubble at 90 % | 14.42 | 14.25 | **3.67** | **3.27** |
| Skip, ring 1's pass | **3.69** | **3.64** | **3.69** | **3.59** |
| Skip, ring 2's pass | **3.69** | **3.69** | 6.76 | **4.18** |
| Skip, ring 3's pass | **3.83** | **3.74** | **3.73** | **3.63** |
| Skip, the morph at 30 % | **2.69** | **2.59** | **2.75** | **2.65** |
| Skip, the morph at 80 % | 4.61 | **3.44** | 5.00 | **4.45** |
| land 1 (phone case) at rest | 5.78 | **2.86** | 12.44 | **2.47** |
| land 2 (MagSafe wallet) at rest | 6.57 | **2.71** | 10.02 | **1.82** |
| land 3 (Lenskin) at rest | **4.20** | **2.23** | 6.69 | **3.11** |
| land 4 (AirPods case) at rest | 18.43 | 6.62 | 7.32 | **2.49** |
| travel 1 to 2 at half, land 2's text area | 8.05 | **3.46** | 8.54 | **2.37** |
| travel 2 to 3 at half, land 3's text area | 5.09 | **2.73** | 7.27 | **2.89** |
| travel 3 to 4 at half, land 4's text area | 9.29 | **3.80** | 7.24 | **3.11** |
| the failed-picture case: land 2's pictures refused, its text on the garden | **2.83** | **2.65** | **2.86** | **1.01** |

**Per line, on the lands at rest** (median / worst):

| Land | 390 x 844 | 1280 x 800 |
|---|---|---|
| 1 | name 8.42 / 4.37; family 5.97 / 4.42; line 5.78 / 2.86; count 15.47 / 9.36; hint 6.47 / 4.98 | name 14.81 / 2.59; family 15.34 / 2.47; line 12.44 / 2.71; count 18.37 / 18.14; hint 18.39 / 10.61 |
| 2 | name 6.57 / 2.71; family 6.97 / 2.96; line 7.90 / 3.06; count 7.03 / 4.39 | name 14.70 / 1.82; family 13.95 / 2.16; line 10.02 / 2.25; count 16.13 / 13.69 |
| 3 | name 7.96 / 6.50; family 6.50 / 3.13; line 4.20 / 2.23; count 9.01 / 7.95 | name 11.25 / 5.81; family 9.17 / 3.56; line 6.69 / 3.11; count 15.54 / 10.63 |
| 4 | name 18.43 / 9.67; family 18.55 / 16.13; line 18.44 / 6.62; count 19.08 / 17.07 | name 9.43 / 3.57; family 7.32 / 2.49; line 11.91 / 4.16; count 15.38 / 14.48 |

The prompt reads `[E]` 2.36 / 2.25 and the words 2.77 / 1.91 at 390; 2.85 / 2.71 and 8.53 / 3.25 at 1280. The failed-picture case at 1280 is name 4.26 / 1.49, family 2.86 / 1.01, line 4.44 / 1.51 and count 5.24 / 4.40.

## Flagged to Sam

- **The lands at rest.** Every land's median is 4.2:1 or better. Land 3's catalog line at 390 is the lowest median, at 4.20. The worst areas fall to 1.8 to 3.1:1 where a line crosses a light patch of the picture: the wallet's wide (the name, 1.82), the case's wide (the family line, 2.47), the AirPods case's wide (the family line, 2.49), and the Lenskin's portrait (the line, 2.23).
- **The prompt over the door** measures 1.9 to 2.9:1. It is light text on the hall's lit grey door.
- **Skip over the tunnel.** Over the ring passes and the morph it measures 2.6 to 3.8:1. Over the bubble, while the outside is darkened, it is 11.8 to 17.1:1; at 1280, 90 percent of the way through the bubble, it falls to 3.3:1.
- **The failed-picture case.** The text stands on the garden: 2.8:1 median. At 1280 the family line crosses the white flower bed, at 1.01:1 worst.
- **Spec 10's default, if Sam declines E-S4-contrast.** Skip and the hints over a part darkened by construction, and each land recomposed until its text area measures 4.5:1. Nothing here is boxed.

## Not covered here

- Each option's travel at half (A, B and C). Those modules are placeholders on this branch; the options' builders measure them.
- Device pixel ratios above 1.
- The hint's two wordings apart. It is measured once, as it showed on land 1: 6.47 / 4.98 at 390 and 18.39 / 10.61 at 1280.
