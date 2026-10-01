---
name: plan
description: Turn a one-line section brief for the Skreed teaser into a build spec with acceptance criteria that the review skill can grade. Use before building any section or feature.
---
# Plan a section

Input: a one-line brief (e.g. "Section 2: The Wall").

Read first: `CLAUDE.md`, `docs/00-IDEATION.md` (the spine table for this section), `docs/data/shades-240.json`, `docs/CHECKLIST.md`.

Write `docs/specs/<section-slug>.md` containing:
1. **Goal in one sentence** and which of the four brand goals it serves.
2. **Phone-first wireframe in words**: what is on screen at 390 px at rest, then what changes on scroll, tap, drag. Then the 1280 px variant in one paragraph.
3. **Content**: every string of copy, every shade or render referenced by id. No placeholders.
4. **Motion plan**: which library, which triggers, what happens with reduced motion.
5. **Data and states**: inputs, outputs, every UI state from CHECKLIST D3 that applies.
6. **Budget**: JS and image weight this section may add.
7. **Acceptance criteria**: 5–10 testable statements the reviewer can mark PASS/FAIL, each tied to a CHECKLIST item.
8. **Out of scope** for this section.

Do not write code. Do not widen the section beyond the spine table. If the brief is ambiguous in a way that changes the design, pick the option that is cheaper on a phone and note it under "Decisions taken".
