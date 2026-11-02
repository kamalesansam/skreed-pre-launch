// The takeover's progress on a family page (docs/specs/family-page.md 24.2 D2, D4 to D6, D8 and D10). Sam, 2026-11-03,
// on the build of 2026-11-02: "the transition animation comes after the rotation, it should come simultaneously ... not
// after the rotation". So the sweep rides the second half of the turn (pose.ts: from the edge-on frame at HANDOVERS[i]
// to the beat's rest TURN_LEN / 2 later), and the band crosses the case as it comes round, the two ending together;
// scrolling back up plays the same sweep back. Pure: no three.js, no DOM; the stage asks it each frame with its own
// scroll, which lags the page's at 10 per second, so a fling still shows the crossing. A type whose model has not landed
// keeps the case before it with no sweep (D2); reduced motion changes the type at the edge-on frame with no sweep (D8).
// The clock-driven controller of 2026-11-02 (depth.fyi's 1,350 ms run, its reversal at the same rate and its queue that
// finishes a run within 240 ms) went with Sam's words: those stay in 24.1 as measurements of depth.fyi's picker.
import { TAKEOVER, easeTakeover, takeoverP } from '../../../config/takeover.ts';
import { CASE_TYPES, HANDOVERS, TURN_LEN, beatPose, caseTargetAt, type CaseType } from './pose.ts';

/** What the front slot shows: one case (b null), or the outgoing a and the incoming b at the sweep's progress. */
export interface TakeoverView {
  readonly a: CaseType;
  readonly b: CaseType | null;
  /** the sweep's raw progress, 0 at the edge-on frame to 1 at the beat's rest, linear in the scroll */
  readonly raw: number;
  /** the in-out cubic of raw */
  readonly eased: number;
  /** where the boundary sits: -0.12 to 1.12 over the sweep */
  readonly p: number;
}
export interface TakeoverOptions {
  /** whether a case type's model is drawn and compiled (the Tough always) */
  has(t: CaseType): boolean;
  /** reduced motion: the type changes at the edge-on frame, no sweep */
  instant?: boolean;
}

/** The scroll a hand-over's sweep spans: the turn's second half, from the edge-on frame to the beat's rest. */
export const SWEEP_SPAN = TURN_LEN / 2;
/** The hair before the span's end where the beat's case stands alone: the page scrolls by whole pixels, so it can rest a fraction of a screen short of the beat (0.001 of a screen is under a pixel at any size). */
export const SWEEP_END_SLACK = 0.001;

/** The two case types a hand-over joins: the type before and the type after the edge-on frame at HANDOVERS[i]. */
export const handoverTypes = (i: number): [CaseType, CaseType] => [CASE_TYPES[i], CASE_TYPES[i + 1]];

/** The type asked for, or the latest type before it whose model has landed (D2: a model that fails keeps the case before it). */
export function availableType(want: CaseType, has: (t: CaseType) => boolean): CaseType {
  let i = CASE_TYPES.indexOf(want);
  while (i > 0 && !has(CASE_TYPES[i])) i--;
  return CASE_TYPES[i];
}

const rest = (a: CaseType): TakeoverView => ({ a, b: null, raw: 0, eased: 0, p: TAKEOVER.pFrom });

/**
 * The view at the stage's scroll sv (in screens). Inside a hand-over's span the outgoing and the incoming case with the
 * sweep's progress; everywhere else the beat's case alone (D3), the Tough on the carousel.
 */
export function takeoverAt(sv: number, opts: TakeoverOptions): TakeoverView {
  if (!(beatPose(sv).k > 0)) return rest('tough');
  for (let i = 0; i < HANDOVERS.length; i++) {
    const h = HANDOVERS[i];
    if (sv < h || sv >= h + SWEEP_SPAN - SWEEP_END_SLACK) continue;
    const [from, to] = handoverTypes(i);
    const a = availableType(from, opts.has), b = availableType(to, opts.has);
    // nothing to sweep into (the model is not here), or reduced motion: the case at once
    if (a === b || opts.instant) return rest(b);
    const raw = Math.min(1, Math.max(0, (sv - h) / SWEEP_SPAN)), eased = easeTakeover(raw);
    return { a, b, raw, eased, p: takeoverP(eased) };
  }
  return rest(availableType(caseTargetAt(sv), opts.has));
}

/**
 * A pair's noise offset (24.1 "seed"): FNV-1a over 27027 and the two case types, spread by an xorshift into three
 * values of 0 to 37, so each pair of types has its own boundary and the same pair always the same one.
 */
export function takeoverSeed(from: string, to: string, seed: number = TAKEOVER.seed, scale: number = TAKEOVER.seedScale): [number, number, number] {
  let h = 0x811c9dc5;
  for (const ch of `${seed}|${from}|${to}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  const out: number[] = [];
  for (let i = 0; i < 3; i++) { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; out.push((h / 2 ** 32) * scale); }
  return out as [number, number, number];
}
