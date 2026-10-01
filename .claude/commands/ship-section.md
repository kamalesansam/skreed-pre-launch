Run the plan → build → review loop for one section of the Skreed teaser until the review passes.

Section brief: $ARGUMENTS

Procedure:
1. Invoke the `plan` skill with the brief. Stop and show me the spec only if it had to make a design decision not covered by `docs/00-IDEATION.md`; otherwise continue.
2. Invoke the `build` skill with the spec path.
3. Invoke the `review` skill with the spec path and the build hand-off.
4. If the verdict is FAIL, invoke `build` again with the FAIL list, then `review` again. Repeat.
5. Stop when the verdict is PASS, or after 5 build/review iterations. On 5 failures, stop and report the remaining FAIL items and what you think is blocking them; do not loosen the checklist.
6. On PASS: commit the section with a message naming the section and the iteration count, and report: files, screenshots, bundle delta, Lighthouse score, iterations.

Never skip the review. Never let the build skill grade itself. Never widen scope beyond the spec.
