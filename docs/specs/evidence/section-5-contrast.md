# Section 5: the contrast of its lines on the fog (evidence)

Measured 2026-10-29, re-measured on the sand build (one jar of sand, `docs/specs/section-5-sand.md`; the measures of 2026-10-26 and 2026-10-28 were on the four-jar build), by `scripts/signup/contrast.mjs` (the quiz's method, `scripts/quiz/contrast.mjs`) against the served test build (`dist-s5t`, hooks on, under `wrangler dev` on 127.0.0.1:8787; the dev server of the day served an older shader strip, see `docs/HANDOFF.md`) on the forced 3D tier, in headless Chrome on this machine's GPU (ANGLE, Intel UHD, D3D11): at 390 x 844 and 1280 x 800, section 5 at rest at its top and at its end (the wrap's landing, the body's end at the viewport's bottom), the section's text hidden for one frame and the fog with the empty jar screenshotted ten times 0.5 s apart; for every decoded line the fog's luminance inside the line's box over the ten frames, and Pearl Whisper's contrast against the median, the lightest 5 percent and the lightest pixel. The script now reads the place again once the page has settled and corrects the scroll (the jump from the hall moves the room's layout under section 5 at 390, which had left the headline and the sub-line above the viewport in the first run of the day). The text is never boxed (E-S5-contrast, pending Sam, `docs/specs/section-5.md` section 10, carried over by `docs/specs/section-5-sand.md` section 11; its default is the quiz's, a darker fog under the section's text). The figures are the fog's own and change from run to run as it drifts, as the quiz's do (`docs/specs/quiz.md` section 6); the poster tier and reduced motion put the same text on `--night` at about 19:1.

The measure of 2026-10-28 on the four-jar layout read 48 lines with medians 2.27:1 to 2.81:1, all under 4.5:1. On the sand layout (one slot left-aligned at 390 with the count line under it and the three rows below; from 720 px the follows list left of the jar) the lines moved, so the table is the re-measure. 50 lines over 10 frames each; medians from 2.09:1 to 3.17:1; 50 under 4.5:1 at the median.

| Viewport | Place | Line | Text | Median | Lightest 5 percent | Worst |
|---|---|---|---|---|---|---|
| 390 x 844 | top | su-h | You’ve made it this far. | 2.55:1 | 1.88:1 | 1.01:1 |
| 390 x 844 | top | su-sub | One thing left. Follow u | 2.53:1 | 1.76:1 | 1.25:1 |
| 390 x 844 | top | su-jars-h | Every follow fills the j | 2.37:1 | 1.80:1 | 1.18:1 |
| 390 x 844 | top | su-count | Nothing collected yet | 2.46:1 | 1.72:1 | 1.24:1 |
| 390 x 844 | top | su-link | Follow on Facebook | 2.46:1 | 1.71:1 | 1.62:1 |
| 390 x 844 | top | su-state | Not yet | 2.55:1 | 1.65:1 | 1.10:1 |
| 390 x 844 | top | su-link | Subscribe on YouTube | 2.46:1 | 1.70:1 | 1.04:1 |
| 390 x 844 | top | su-state | Not yet | 2.47:1 | 1.64:1 | 1.58:1 |
| 390 x 844 | top | su-link | Follow on Instagram | 2.44:1 | 1.70:1 | 1.62:1 |
| 390 x 844 | top | su-state | Not yet | 2.41:1 | 1.64:1 | 1.60:1 |
| 390 x 844 | top | su-got | Got your colours? | 2.38:1 | 1.71:1 | 1.07:1 |
| 390 x 844 | end | su-count | Nothing collected yet | 2.58:1 | 1.70:1 | 1.25:1 |
| 390 x 844 | end | su-link | Follow on Facebook | 2.61:1 | 1.71:1 | 1.16:1 |
| 390 x 844 | end | su-state | Not yet | 2.56:1 | 1.46:1 | 1.40:1 |
| 390 x 844 | end | su-link | Subscribe on YouTube | 2.58:1 | 1.70:1 | 1.31:1 |
| 390 x 844 | end | su-state | Not yet | 2.62:1 | 1.46:1 | 1.41:1 |
| 390 x 844 | end | su-link | Follow on Instagram | 2.50:1 | 1.71:1 | 1.40:1 |
| 390 x 844 | end | su-state | Not yet | 2.61:1 | 1.47:1 | 1.43:1 |
| 390 x 844 | end | su-got | Got your colours? | 2.36:1 | 1.68:1 | 1.26:1 |
| 390 x 844 | end | su-got-sub | Leave your email and you | 2.33:1 | 1.69:1 | 1.07:1 |
| 390 x 844 | end | su-label | Email | 2.09:1 | 1.80:1 | 1.18:1 |
| 390 x 844 | end | SPAN | I’m happy to hear from S | 2.09:1 | 1.70:1 | 1.23:1 |
| 390 x 844 | end | su-link | Save my colours | 2.16:1 | 1.59:1 | 1.26:1 |
| 390 x 844 | end | su-fine | One email when we launch | 2.23:1 | 1.59:1 | 1.02:1 |
| 390 x 844 | end | su-keep | Keep following to keep y | 2.31:1 | 1.57:1 | 1.26:1 |
| 390 x 844 | end | SPAN | Glass jar model by | 2.35:1 | 1.55:1 | 1.09:1 |
| 390 x 844 | end | A | Pentristo | 2.33:1 | 1.64:1 | 1.57:1 |
| 390 x 844 | end | A | CC BY 4.0 | 2.40:1 | 1.54:1 | 1.49:1 |
| 1280 x 800 | top | su-h | You’ve made it this far. | 3.17:1 | 2.15:1 | 1.30:1 |
| 1280 x 800 | top | su-sub | One thing left. Follow u | 3.03:1 | 1.97:1 | 1.16:1 |
| 1280 x 800 | top | su-jars-h | Every follow fills the j | 3.08:1 | 2.28:1 | 1.36:1 |
| 1280 x 800 | top | su-count | Nothing collected yet | 2.26:1 | 1.82:1 | 1.24:1 |
| 1280 x 800 | top | su-link | Follow on Facebook | 2.64:1 | 1.97:1 | 1.34:1 |
| 1280 x 800 | top | su-state | Not yet | 2.57:1 | 1.84:1 | 1.78:1 |
| 1280 x 800 | top | su-link | Subscribe on YouTube | 2.54:1 | 1.92:1 | 1.37:1 |
| 1280 x 800 | top | su-state | Not yet | 2.49:1 | 1.83:1 | 1.32:1 |
| 1280 x 800 | top | su-link | Follow on Instagram | 2.47:1 | 1.88:1 | 1.37:1 |
| 1280 x 800 | top | su-state | Not yet | 2.42:1 | 1.83:1 | 1.76:1 |
| 1280 x 800 | top | su-got | Got your colours? | 2.30:1 | 1.77:1 | 1.03:1 |
| 1280 x 800 | end | su-count | Nothing collected yet | 2.48:1 | 1.96:1 | 1.50:1 |
| 1280 x 800 | end | su-got | Got your colours? | 2.60:1 | 1.93:1 | 1.34:1 |
| 1280 x 800 | end | su-got-sub | Leave your email and you | 2.67:1 | 1.90:1 | 1.23:1 |
| 1280 x 800 | end | su-label | Email | 2.81:1 | 1.89:1 | 1.83:1 |
| 1280 x 800 | end | SPAN | I’m happy to hear from S | 2.61:1 | 1.77:1 | 1.37:1 |
| 1280 x 800 | end | su-link | Save my colours | 2.75:1 | 2.01:1 | 1.62:1 |
| 1280 x 800 | end | su-fine | One email when we launch | 2.54:1 | 1.77:1 | 1.27:1 |
| 1280 x 800 | end | su-keep | Keep following to keep y | 2.40:1 | 1.75:1 | 1.31:1 |
| 1280 x 800 | end | SPAN | Glass jar model by | 2.39:1 | 1.77:1 | 1.62:1 |
| 1280 x 800 | end | A | Pentristo | 2.33:1 | 1.63:1 | 1.55:1 |
| 1280 x 800 | end | A | CC BY 4.0 | 2.20:1 | 1.61:1 | 1.52:1 |
