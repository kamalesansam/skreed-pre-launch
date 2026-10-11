# Family pages prototype (2026-10-09 to 2026-10-11)

The ten family pages (`/shades/<family>/`): 24 cases of one family in a ciao-style line, one Cobalt case model recoloured per shade, case only (no phone). Spec: `docs/specs/family-page.md`. In the full page it opens from a gem in section 2 (hero link, v11.1).

- `index.html`: the built single file (the case LODs embedded); `page.src.html` its source; `build.py` the builder (expects the session's asset paths).
- Review: round 3, engineering PASS, fidelity FAIL on a drag past either end freezing the line and a stale name while a drag is held. Round 4 fixes (clamped front slot, a trailing name update, a route race guard, a fixed-width view toggle, the copy now says gems) were checked by the builder against the reviewer's own harnesses (drag past both ends at 390 and 1280, held drags) but not yet re-reviewed independently.
- Family names are the catalog's (Blissful Blues); the gem labels use Sam's singular names. Whether the singular names replace these is pending Sam.
