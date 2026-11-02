// The section index's maths (docs/specs/navbar.md 5): where each of the landing page's four sections rests, and which
// one is on screen at a scroll position, on the 3D path (the island's scroll map in screens of innerHeight, the quiz and
// section 4 in flow after the track) and on the poster tier (everything in flow). No DOM here, so
// tests/unit/site-nav.test.ts imports it under node; site-nav.ts measures the page and calls it.
import { S2T } from '../../config/hero.ts';

export type SectionId = 'top' | 'families' | 'quiz' | 'room';
export const SECTION_IDS: readonly SectionId[] = ['top', 'families', 'quiz', 'room'];

export interface PageMap {
  /** the 3D path: the island runs and draws section 4's scenes (false on the poster tier, or for section 4 alone when it fell to its stills) */
  island: boolean;
  /** section 4 shows its stills (its data-tier "poster"): it rests at its top, as Skip quiz's ride lands there */
  roomStill: boolean;
  /** innerHeight, px */
  vh: number;
  /** document tops, px: nav#families (the poster tier's swatch grid), section#find, section#room (NaN while the quiz gate hides it) */
  families: number;
  quiz: number;
  room: number;
  /** nav#families' height and section 4's stage (one 100svh), px */
  familiesH: number;
  stage: number;
  /** the page's scroll range, px */
  max: number;
}

/**
 * Where a section rests, rounded and clamped to the page's range. 3D path: the top; section 2 at rest with the gems
 * landed (S2T.LAND, the return path's position, hero.ts); the quiz's top (the second seam's end, where its glue settles);
 * section 4's q 1, its top plus one stage, scene 1 fully in (the hall until 2026-11-02; gate.ts rideTarget). Poster tier: the top, nav#families
 * centred (as boot.ts centres it on a return), the quiz's top and section 4's top.
 */
export function restY(id: SectionId, m: PageMap): number {
  const y = id === 'top' ? 0
    : id === 'families' ? (m.island ? S2T.LAND * m.vh : m.families + m.familiesH / 2 - m.vh / 2)
    : id === 'quiz' ? m.quiz
    : m.island && !m.roomStill ? m.room + m.stage : m.room;
  return Number.isFinite(y) ? Math.max(0, Math.min(Math.max(0, m.max), Math.round(y))) : 0;
}

/**
 * The section on screen at scroll y. 3D path: the countdown until the middle of the first wipe, section 2 until the
 * middle of the second seam (the glue's span, hero.ts), the quiz until section 4's top (the middle of the third seam),
 * then section 4. Poster tier: the section under the middle of the screen.
 */
export function sectionAt(y: number, m: PageMap): SectionId {
  const has = Number.isFinite;
  if (m.island) {
    if (y < ((S2T.PULL + S2T.W1END) / 2) * m.vh) return 'top';
    if (!has(m.quiz) || y < (Math.min(S2T.W2 * m.vh, m.quiz - m.vh) + m.quiz) / 2) return 'families';
    return has(m.room) && y >= m.room ? 'room' : 'quiz';
  }
  const mid = y + m.vh / 2;
  if (has(m.room) && mid >= m.room) return 'room';
  if (has(m.quiz) && mid >= m.quiz) return 'quiz';
  if (has(m.families) && mid >= m.families) return 'families';
  return 'top';
}
