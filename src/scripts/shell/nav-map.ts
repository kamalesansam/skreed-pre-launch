// The section index's maths on the redesigned landing page (docs/specs/redesign.md D4; docs/specs/navbar.md 5 for the
// index itself): which parts of the page each of its four entries covers, where an entry rests, and which entry is on
// screen at a scroll position. The page is ordinary sections in flow now, so this is document tops and nothing else:
// no scroll map, no tiers, no import from the old landing's config. No DOM here, so tests/unit/site-nav.test.ts imports
// it under node; site-nav.ts measures the page and calls it.

export type SectionId = 'top' | 'families' | 'quiz' | 'room';
/** the index's entries in the bar's order (Home, Families, Quiz, Products); the keys are the old landing's, so COPY.nav.items and site-nav.css stand as they are */
export const SECTION_IDS: readonly SectionId[] = ['top', 'families', 'quiz', 'room'];

/**
 * The element ids each entry covers, in page order (spec D4): Home over the hero and "what you've seen so far";
 * Families over the swatches and the picker; Products over the range, MATCH ESSENTIALS and the five tiles; Quiz over
 * its way in and the open quiz. The first id of a group is the entry's target: its fragment link and its rest.
 */
export const SECTION_GROUPS: Readonly<Record<SectionId, readonly string[]>> = {
  top: ['top', 'seen'],
  families: ['families', 'glimpse'],
  room: ['products', 'match', 'everyone'],
  quiz: ['quiz', 'quizHost'],
};

/** a box in document px: its top edge and its bottom edge */
export interface Box { readonly top: number; readonly bottom: number }
/** each entry's box, its group's hull; null or absent for a group with nothing in the layout */
export type Boxes = Readonly<Partial<Record<SectionId, Box | null>>>;
/** the document top of each entry's target in px (absent or NaN for one with no box), and the page's scroll range */
export interface Tops extends Readonly<Partial<Record<SectionId, number>>> { readonly max?: number }

const isBox = (b: Box | null | undefined): b is Box => !!b && Number.isFinite(b.top) && Number.isFinite(b.bottom) && b.bottom > b.top;

/** A group's box: from the highest top to the lowest bottom of its parts that have a box (the quiz's host has none until it opens); null when none has. */
export function hull(parts: readonly (Box | null | undefined)[]): Box | null {
  const real = parts.filter(isBox);
  return real.length ? { top: Math.min(...real.map((b) => b.top)), bottom: Math.max(...real.map((b) => b.bottom)) } : null;
}

/**
 * Where an entry rests: Home at 0; the others with their target's top at the top of the screen, rounded and held
 * inside the page's range when it is given. Never NaN: an entry with no box rests at 0.
 */
export function restY(id: SectionId, tops: Tops): number {
  const y = id === 'top' ? 0 : tops[id] ?? NaN;
  if (!Number.isFinite(y)) return 0;
  const max = Number.isFinite(tops.max) ? Math.max(0, tops.max!) : Infinity;
  return Math.max(0, Math.min(max, Math.round(y)));
}

/**
 * The entry on screen at scroll y: the one whose box holds the screen's middle line (its top edge counted in, its
 * bottom edge out, so two boxes that meet never both hold it). A part of the page between two groups that neither
 * lists (the photograph band under the picker) stays with the group above it, so the mark never drops out between two
 * entries: the entry is the lowest group whose top the line has reached. None, null, above the first group and below
 * the last, where the page goes on to the proof, the sign-up and the countdown; but a last group shorter than half the
 * screen (the quiz's way in on a phone) keeps the mark for as long as its top edge is still on the screen, so the
 * entry is marked at its own rest (to within a pixel, the rest being rounded).
 */
export function sectionAt(scrollY: number, viewportHeight: number, boxes: Boxes): SectionId | null {
  const mid = scrollY + viewportHeight / 2;
  let at: SectionId | null = null, top = -Infinity, end = -Infinity;
  for (const id of SECTION_IDS) {
    const b = boxes[id];
    if (!isBox(b)) continue;
    if (b.bottom > end) end = b.bottom;
    if (mid >= b.top && b.top >= top) { at = id; top = b.top; }
  }
  return at !== null && (mid < end || scrollY - top < 1) ? at : null;
}
