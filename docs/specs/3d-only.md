# Only the real site (E-3D-only)

Sam, 2026-11-04, after two screenshots of the fallbacks (a family page in swatch grid mode, section 4's poster column):
"make sure the real site loads on any machine or any phone or any browser, dont have this fallback, ppl will think this is
our acrtual site, then we're cooked, make sure to force load or run only the actual version of the site". Asked what
visitors with Reduce motion on should get: "Exactly the full motion". Asked what a browser with no 3D graphics at all
should show: "A plain 'open in a modern browser' line".

## What changed

| Before | Since 2026-11-04 |
| --- | --- |
| Data saver, 2G or slow-2G, `deviceMemory` 2 or less: the landing's poster tier, the family pages' swatch grid mode | The 3D site |
| Reduce motion: the poster tier and swatch grid mode, and the reduced paths in every script and stylesheet | The 3D site with the full motion; `HONOUR_REDUCED_MOTION` is false (`src/config/hero.ts`), `reducedMQ` (`src/scripts/motion.ts`) never matches, the CSS blocks are gone, the scene loops ignore it |
| A software renderer, or a context that fails `failIfMajorPerformanceCaveat`: the poster or the grid | The 3D site (the hero renderer and the family stage never set the flag; the family stage's slow-tier check is off) |
| The loader's stall (12 or 20 s without a milestone) and offline rules: its poster state | The loader stays up with "Still loading", "Slow connection" or the offline line; nothing turns into the poster |
| A hard failure (the hero chunk, its data or textures, section 4's chunk or scene 1, a family chunk or model, a lost context): the poster page, the poster column or the grid with "Try again" | `failHard()` in `src/scripts/shell/note.ts` (and the loader's `fail()`, when the page's own module does not load): one reload a visit (sessionStorage `skreed-3d-retry`, cleared once the 3D is up), offline the note until the connection returns and then a reload, a second failure the site note |
| No WebGL2 (or no DecompressionStream on the landing) | The site note's "unsupported" line over the page |
| `?mode=grid` on a family page | Test and staging builds only (`PUBLIC_HERO_HOOKS=1`); `?tier=poster` was already test-only |
| The test harness's SwiftShader | Test and staging builds still send it to the poster and the grid (`?tier=hero3d` and `?render=force` run the 3D there, as before), so the browser suites keep the ground they were written on; production runs the 3D on it. `tests/unit/3d-only.test.ts` reads the production rules from the source |

## The site note

`src/components/shell/SiteNote.astro`, on the landing page and the family pages, hidden unless `html.nogl`. Then it covers
the page on `--night`: the wordmark (from `#skreed-wordmark`) and one line in Open Sans 400 at 16 px, Pearl Whisper, chosen by
`html[data-note]`:

- `unsupported`: "This browser cannot show Skreed. Open it in Chrome, Safari, Firefox or Edge."
- `failed`: "Skreed did not load." and "Try again", a plain link to the same page (works with no script).
- `offline`: "You are offline. Skreed loads when you are back online."

The copy is `COPY_NOTE` in `src/config/copy.ts`. The page under the note is the poster page or the grid, never seen.

## Not covered

- JavaScript turned off: the `noscript` copies stand as before (no script, no 3D).
- A browser with WebGL2 but too weak to keep up (an old phone, SwiftShader) now runs the 3D slowly instead of the poster.

## Undo

The change is one commit; `git revert` of it brings every fallback back.
