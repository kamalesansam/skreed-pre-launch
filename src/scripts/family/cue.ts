// The cue's words on a family page (docs/specs/family-page.md 24, docs/specs/scroll-cue.md): whether the first screen's
// line, on the side columns' bottom line, clears the front case. Pure, so the unit test can run it over solve()'s fit.

/** The line's box (`lineH` px tall, its bottom `bottom` px above the stage's foot) clears the front case's box, whose foot
 *  is at `caseBottom` px from the stage's top, by at least `gap` px. The box is the hull of the case's corners, about 10 px
 *  below the drawn case on a phone, so `gap` 4 keeps some 14 px of air between the words and the drawn case. */
export function landClear(caseBottom: number, stageH: number, bottom: number, lineH = 14, gap = 4): boolean {
  return stageH - bottom - lineH - caseBottom >= gap;
}
