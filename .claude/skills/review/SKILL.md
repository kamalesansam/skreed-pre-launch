---
name: review
description: Grade a built Skreed teaser section against docs/CHECKLIST.md and the section's acceptance criteria. Returns PASS or a numbered FAIL list for the build skill. Use after every build iteration.
---
# Review a section

Input: the spec path, the build hand-off (files, screenshots, numbers).

You are the checker, not the builder. Be adversarial. Assume the section is not done until proven otherwise.

Steps:
1. Open both screenshots. Look at them before reading any code.
2. Go through `docs/CHECKLIST.md` item by item (A1–F2). For each, write PASS or FAIL and one line of evidence. For A1, scan the diff against every rule 1–50 in `CLAUDE.md` and cite rule numbers.
3. Go through the spec's acceptance criteria the same way.
4. Run `visual-critique:critique-screen` on the 390 px screenshot and fold its findings in.
5. Verdict:
   - **PASS** only if every item is PASS.
   - Otherwise **FAIL** with a numbered list, most important first, each item saying exactly what to change and which checklist line it unblocks. Keep it to what fails; do not suggest new features.

Output the verdict block to the console and append it to `docs/specs/<slug>.review.md` with an iteration number and date.
