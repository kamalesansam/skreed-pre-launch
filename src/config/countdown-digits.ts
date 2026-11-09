// The countdown's dot-matrix numerals (Sam, 2026-10-26: "make a font like this for the countdown", with a sample of a
// beaded dot face): ten digits drawn in our own grid, 8 dots wide and 13 tall, strokes two dots thick, outer corners
// rounded by one dot, every dot a circle slightly wider than its cell so neighbours touch and read as a bead chain.
// The sample's proportions (cap height 13 dots, stroke 2, corner 1) were measured from it; nothing of any font file ships.
// The plain countdown script (src/inline/countdown.inline.js) turns each bitmap into one SVG path, #dg-<digit>, at run time,
// so no font bytes load and the digits still draw with every module script blocked (hero.md AC4.4). Exception E-CD-font.
export const DIGIT_COLS = 8;
export const DIGIT_ROWS = 13;
/** x of the second digit of a pair: 8 dots plus a gap of 1.5 */
export const DIGIT_ADVANCE = 9.5;
/** one pair's viewBox */
export const PAIR_W = DIGIT_ADVANCE + DIGIT_COLS, PAIR_H = DIGIT_ROWS;
/** dot radius in cells: 0.5 touches, 0.55 overlaps as the sample's beads do */
export const DOT_R = 0.55;

/** 13 rows of 8 cells per digit, # for a dot */
export const DIGITS: readonly string[] = [
  ['.######.', '########', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '########', '.######.'],
  ['...##...', '..###...', '.####...', '##.##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...'],
  ['.######.', '########', '##....##', '......##', '......##', '.....###', '..#####.', '.####...', '###.....', '##......', '##......', '########', '########'],
  ['.######.', '########', '##....##', '......##', '......##', '..#####.', '..#####.', '......##', '......##', '......##', '##....##', '########', '.######.'],
  ['##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '########', '.#######', '......##', '......##', '......##', '......##', '......##'],
  ['########', '########', '##......', '##......', '##......', '#######.', '########', '......##', '......##', '......##', '##....##', '########', '.######.'],
  ['.######.', '########', '##....##', '##......', '##......', '#######.', '########', '##....##', '##....##', '##....##', '##....##', '########', '.######.'],
  ['########', '########', '......##', '......##', '.....##.', '.....##.', '....##..', '....##..', '...##...', '...##...', '...##...', '...##...', '...##...'],
  ['.######.', '########', '##....##', '##....##', '##....##', '.######.', '.######.', '##....##', '##....##', '##....##', '##....##', '########', '.######.'],
  ['.######.', '########', '##....##', '##....##', '##....##', '##....##', '########', '.#######', '......##', '......##', '##....##', '########', '.######.'],
].map((rows) => rows.join('/'));

/** The colon that stands between one pair and the next on the redesigned landing page (Sam, 2026-11-09: "add dots for
 *  the countdown timer"; docs/specs/redesign.md D19, item 9), in the digits' own grid and notation: 13 rows of 2 cells,
 *  # for a dot. Two marks, each two dots wide and two tall, as heavy as a digit's stroke, in rows 3 to 4 and 8 to 9:
 *  the 13 rows read 3 clear, 2 set, 3 clear, 2 set, 3 clear, so the marks stand evenly about the digits' middle row. */
export const COLON = ['..', '..', '..', '##', '##', '..', '..', '..', '##', '##', '..', '..', '..'].join('/');
