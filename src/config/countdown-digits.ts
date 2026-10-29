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
