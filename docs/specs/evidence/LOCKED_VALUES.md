# Values Sam locked for the real build (2026-10-09)
Fog (igloo smoke), from Sam's Tune screenshot. These equal the v9.9 prototype defaults (template.html line 305: fog 1, fogBright 0.4, fogSpeed 0.15, fogSize 1, fogHug 1.6).
| Tune label | param | value |
|---|---|---|
| Fog amount | fog | 1.00 |
| Fog brightness | fogBright | 0.40 |
| Fog drift speed (igloo 0.15) | fogSpeed | 0.15 |
| Wisp size | fogSize | 1.00 |
| Ground hug | fogHug | 1.60 |
The build must assert these in a test (read the runtime params in the Astro hero and compare), and the spec must list them as locked.

Terrain, from Sam's second Tune screenshot (2026-10-09). These CHANGE the v9.9 defaults (template.html line 305); the real build must use the new values. The parity harness must apply the same values to the prototype (set the Tune inputs and dispatch 'input') before comparing.
| Tune label | param | v9.9 default | locked value |
|---|---|---|---|
| Ground exposure | gExp | 0.45 | 0.20 |
| Ground contrast | gGamma | 0.70 | 0.87 |
| Near ground | gNear | 0.68 | 0.54 |
| Shadow floor | gToe | 0.03 | 0.02 |
| Crumb grain contrast | crumb | 0.35 | 0.53 |
| Crumb grain size | crumbSize | 0.03 | 0.07 |
| Ground mist | mist | 0.55 | 0.20 |
| Ground mist speed | mistSpeed | 1.00 | 0.55 |
