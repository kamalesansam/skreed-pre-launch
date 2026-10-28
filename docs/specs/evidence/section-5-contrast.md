# Section 5: the contrast of its lines on the fog (evidence)

Measured 2026-10-28 (the final code: the equal cells, the credit on one line, the lock opened by the hooks override) by `scripts/signup/contrast.mjs` (the quiz's method, `scripts/quiz/contrast.mjs`) against the dev server on the forced 3D tier, in headless Chrome on this machine's GPU (ANGLE, Intel UHD): at 390 x 844 and 1280 x 800, section 5 at rest at its top and at its end (the wrap's landing, the body's end at the viewport's bottom), the section's text hidden for one frame and the fog with the jars screenshotted ten times 0.5 s apart; for every decoded line the fog's luminance inside the line's box over the ten frames, and Pearl Whisper's contrast against the median, the lightest 5 percent and the lightest pixel. The text is never boxed (E-S5-contrast, pending Sam, `docs/specs/section-5.md` section 10; its default is the quiz's, a darker fog under the section's text). The figures are the fog's own and change from run to run as it drifts, as the quiz's do (`docs/specs/quiz.md` section 6); the poster tier and reduced motion put the same text on `--night` at about 19:1.

The first measure, 2026-10-26 on the first build, read 52 lines with medians 2.15:1 to 4.66:1 and 51 under 4.5:1; the lines and their boxes moved a little with the cells' fix and the credit's line, so the table is the re-measure. 48 lines over 10 frames each; medians from 2.27:1 to 2.81:1; 48 under 4.5:1 at the median.

| Viewport | Place | Line | Text | Median | Lightest 5 percent | Worst |
|---|---|---|---|---|---|---|
| 390 x 844 | top | su-h | You’ve made it this far. | 2.79:1 | 1.89:1 | 1.18:1 |
| 390 x 844 | top | su-sub | One thing left. Follow u | 2.66:1 | 1.77:1 | 1.27:1 |
| 390 x 844 | top | su-jars-h | Every follow fills the j | 2.58:1 | 1.92:1 | 1.30:1 |
| 390 x 844 | top | su-link | Follow on Facebook | 2.42:1 | 1.91:1 | 1.77:1 |
| 390 x 844 | top | su-state | Not yet | 2.37:1 | 1.86:1 | 1.78:1 |
| 390 x 844 | top | su-link | Subscribe on YouTube | 2.53:1 | 1.83:1 | 1.25:1 |
| 390 x 844 | top | su-state | Not yet | 2.51:1 | 1.82:1 | 1.18:1 |
| 390 x 844 | end | su-link | Follow on Instagram | 2.41:1 | 1.88:1 | 1.35:1 |
| 390 x 844 | end | su-state | Not yet | 2.44:1 | 1.86:1 | 1.62:1 |
| 390 x 844 | end | su-word | Your jar | 2.57:1 | 1.94:1 | 1.85:1 |
| 390 x 844 | end | su-state | Nothing collected yet | 2.62:1 | 1.89:1 | 1.20:1 |
| 390 x 844 | end | su-got | Got your colours? | 2.57:1 | 1.80:1 | 1.15:1 |
| 390 x 844 | end | su-got-sub | Leave your email and you | 2.64:1 | 1.74:1 | 1.17:1 |
| 390 x 844 | end | su-label | Email | 2.47:1 | 1.65:1 | 1.60:1 |
| 390 x 844 | end | SPAN | I’m happy to hear from S | 2.81:1 | 1.54:1 | 1.42:1 |
| 390 x 844 | end | su-link | Save my colours | 2.52:1 | 1.46:1 | 1.21:1 |
| 390 x 844 | end | su-fine | One email when we launch | 2.65:1 | 1.47:1 | 1.07:1 |
| 390 x 844 | end | su-keep | Keep following to keep y | 2.54:1 | 1.48:1 | 1.40:1 |
| 390 x 844 | end | SPAN | Glass jar model by | 2.41:1 | 1.49:1 | 1.00:1 |
| 390 x 844 | end | A | Pentristo | 2.42:1 | 1.53:1 | 1.46:1 |
| 390 x 844 | end | A | CC BY 4.0 | 2.41:1 | 1.50:1 | 1.46:1 |
| 1280 x 800 | top | su-h | You’ve made it this far. | 2.55:1 | 1.97:1 | 1.26:1 |
| 1280 x 800 | top | su-sub | One thing left. Follow u | 2.53:1 | 1.85:1 | 1.08:1 |
| 1280 x 800 | top | su-jars-h | Every follow fills the j | 2.66:1 | 1.80:1 | 1.30:1 |
| 1280 x 800 | top | su-link | Follow on Facebook | 2.37:1 | 1.66:1 | 1.56:1 |
| 1280 x 800 | top | su-state | Not yet | 2.31:1 | 1.68:1 | 1.62:1 |
| 1280 x 800 | top | su-link | Subscribe on YouTube | 2.36:1 | 1.80:1 | 1.17:1 |
| 1280 x 800 | top | su-state | Not yet | 2.34:1 | 1.85:1 | 1.74:1 |
| 1280 x 800 | top | su-link | Follow on Instagram | 2.34:1 | 1.70:1 | 1.21:1 |
| 1280 x 800 | top | su-state | Not yet | 2.27:1 | 1.73:1 | 1.46:1 |
| 1280 x 800 | top | su-word | Your jar | 2.29:1 | 1.72:1 | 1.64:1 |
| 1280 x 800 | top | su-state | Nothing collected yet | 2.27:1 | 1.76:1 | 1.16:1 |
| 1280 x 800 | top | su-got | Got your colours? | 2.28:1 | 1.76:1 | 1.29:1 |
| 1280 x 800 | top | su-got-sub | Leave your email and you | 2.42:1 | 1.81:1 | 1.24:1 |
| 1280 x 800 | end | su-state | Not yet | 2.28:1 | 1.68:1 | 1.10:1 |
| 1280 x 800 | end | su-state | Not yet | 2.35:1 | 1.63:1 | 1.57:1 |
| 1280 x 800 | end | su-state | Not yet | 2.52:1 | 1.78:1 | 1.65:1 |
| 1280 x 800 | end | su-state | Nothing collected yet | 2.60:1 | 2.16:1 | 1.38:1 |
| 1280 x 800 | end | su-got | Got your colours? | 2.42:1 | 1.70:1 | 1.21:1 |
| 1280 x 800 | end | su-got-sub | Leave your email and you | 2.57:1 | 1.84:1 | 1.15:1 |
| 1280 x 800 | end | su-label | Email | 2.41:1 | 1.84:1 | 1.77:1 |
| 1280 x 800 | end | SPAN | I’m happy to hear from S | 2.56:1 | 2.06:1 | 1.45:1 |
| 1280 x 800 | end | su-link | Save my colours | 2.71:1 | 1.88:1 | 1.26:1 |
| 1280 x 800 | end | su-fine | One email when we launch | 2.67:1 | 1.87:1 | 1.11:1 |
| 1280 x 800 | end | su-keep | Keep following to keep y | 2.60:1 | 1.88:1 | 1.27:1 |
| 1280 x 800 | end | SPAN | Glass jar model by | 2.47:1 | 1.75:1 | 1.29:1 |
| 1280 x 800 | end | A | Pentristo | 2.56:1 | 2.05:1 | 1.95:1 |
| 1280 x 800 | end | A | CC BY 4.0 | 2.56:1 | 1.96:1 | 1.82:1 |
