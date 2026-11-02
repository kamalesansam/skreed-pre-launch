// The takeover's controller (docs/specs/family-page.md 24.1 "requests" and "timing", 24.2 D4, D5, D8 and D10): which
// case is in front, which is taking it over and how far, on the page's clock and never on the scroll, so a scroll that
// stops never holds a sweep half done. Pure: no three.js, no DOM; the stage asks it for a target each frame, ticks it
// with the frame's time and draws its snapshot. The rules are depth.fyi's, measured from its controller and re-written
// here: a new target while idle runs forward; the target the run came from reverses it at the same rate; any other
// target is queued and the run finishes within 240 ms at the rate that takes, then the queued one runs; reduced motion
// snaps. dir is ours (D5): +1 for a run to a later target in the order, -1 to an earlier one, held for the run.
import { TAKEOVER, easeTakeover, takeoverP } from '../../../config/takeover.ts';

export type TakeoverPhase = 'idle' | 'running' | 'reversing' | 'finishing';
export interface TakeoverSnapshot<T extends string> {
  /** the case in front at rest; while a run is under way, the outgoing one */
  readonly current: T;
  /** the case the run goes to (the current one when idle) */
  readonly incoming: T;
  /** the run's raw progress, 0 to 1, linear in time */
  readonly raw: number;
  /** the in-out cubic of raw */
  readonly eased: number;
  /** where the boundary sits: -0.12 to 1.12 over the run */
  readonly p: number;
  readonly phase: TakeoverPhase;
  /** a third target waiting for the run to finish */
  readonly queued: T | null;
  /** +1 toward a later target in the order (right to left), -1 toward an earlier one (mirrored) */
  readonly dir: 1 | -1;
  readonly suspended: boolean;
}
export interface Takeover<T extends string> {
  /** asks for a target; true when the request changed anything */
  request(target: T): boolean;
  /** advances the run by dtMs of the page's clock; true when the progress or the phase moved */
  update(dtMs: number): boolean;
  /** reduced motion: the target at once, no run */
  snapTo(target: T): boolean;
  /** holds the run where it is (a test hook's pin); requests still land */
  suspend(on: boolean): boolean;
  snapshot(): TakeoverSnapshot<T>;
}
export interface TakeoverOptions<T extends string> {
  /** the targets in beat order, for dir */
  order: readonly T[];
  durationMs?: number;
  finishWithinMs?: number;
}

/**
 * A run's noise offset (24.1 "seed"): FNV-1a over 27027 and the two case types, spread by an xorshift into three values
 * of 0 to 37, so each pair of types has its own boundary and the same pair always the same one.
 */
export function takeoverSeed(from: string, to: string, seed: number = TAKEOVER.seed, scale: number = TAKEOVER.seedScale): [number, number, number] {
  let h = 0x811c9dc5;
  for (const ch of `${seed}|${from}|${to}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  const out: number[] = [];
  for (let i = 0; i < 3; i++) { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; out.push((h / 2 ** 32) * scale); }
  return out as [number, number, number];
}

/** The sweep's range (24.1 "range"): the least and greatest projection on the axis of every point of the sets (x, y, z triples). */
export function sweepRange(axis: readonly [number, number, number], ...sets: readonly ArrayLike<number>[]): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (const s of sets) for (let i = 0; i + 2 < s.length; i += 3) { const d = s[i] * axis[0] + s[i + 1] * axis[1] + s[i + 2] * axis[2]; if (d < lo) lo = d; if (d > hi) hi = d; }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [-0.5, 0.5];
  if (hi - lo < 1e-5) { const c = (lo + hi) / 2; return [c - 5e-6, c + 5e-6]; }
  return [lo, hi];
}

export function createTakeover<T extends string>(initial: T, opts: TakeoverOptions<T>): Takeover<T> {
  const duration = opts.durationMs ?? TAKEOVER.durationMs, finishWithin = opts.finishWithinMs ?? TAKEOVER.finishWithinMs;
  const rank = (t: T) => opts.order.indexOf(t);
  let current = initial, incoming = initial, raw = 0, phase: TakeoverPhase = 'idle', queued: T | null = null, dir: 1 | -1 = 1, suspended = false;
  // a finishing run's own rate (progress per ms) and whether it finishes a reversal
  let finishRate = 0, finishBack = false;
  const backward = () => phase === 'reversing' || (phase === 'finishing' && finishBack);
  const clearFinish = () => { finishRate = 0; finishBack = false; };
  const start = (t: T) => { dir = rank(t) >= rank(current) ? 1 : -1; incoming = t; raw = 0; phase = 'running'; queued = null; clearFinish(); };
  // the end of a run: the case it ran to is in front (promote) or the one it came from stays (settle); a queued target
  // then runs from there
  const end = (to: T) => {
    const q = queued;
    current = incoming = to; raw = 0; phase = 'idle'; queued = null; clearFinish();
    if (q !== null && q !== to) start(q);
  };
  const beginFinish = (back: boolean) => {
    const left = Math.max(0, back ? raw : 1 - raw), ms = Math.min(finishWithin, left * duration);
    finishRate = ms > 2 ** -52 ? left / ms : Infinity;
    finishBack = back;
    phase = 'finishing';
  };
  return {
    request(t) {
      if (phase === 'idle') { if (t === current) return false; start(t); return true; }
      const back = backward(), heading = back ? current : incoming, origin = back ? incoming : current;
      if (t === heading) { if (queued === null) return false; queued = null; return true; }
      if (t === origin) { phase = back ? 'running' : 'reversing'; queued = null; clearFinish(); return true; }
      if (t === queued) return false;
      queued = t;
      if (phase !== 'finishing') beginFinish(back);
      return true;
    },
    update(dtMs) {
      if (suspended || !Number.isFinite(dtMs) || dtMs <= 0) return false;
      let left = dtMs, moved = false;
      // at most four ends in one tick: a run, the queued run it hands to, and spare
      for (let ends = 0; left > 0 && ends < 4 && phase !== 'idle';) {
        const rate = phase === 'finishing' ? finishRate : 1 / duration;
        moved = true;
        if (backward()) {
          const need = raw / rate;
          if (left < need) { raw = Math.max(0, raw - left * rate); left = 0; } else { left -= need; end(current); ends++; }
        } else {
          const need = (1 - raw) / rate;
          if (left < need) { raw = Math.min(1, raw + left * rate); left = 0; } else { left -= need; end(incoming); ends++; }
        }
      }
      return moved;
    },
    snapTo(t) {
      if (phase === 'idle' && current === t && queued === null) return false;
      current = incoming = t; raw = 0; phase = 'idle'; queued = null; clearFinish();
      return true;
    },
    suspend(on) {
      if (suspended === on) return false;
      suspended = on;
      return true;
    },
    snapshot() {
      const eased = easeTakeover(raw);
      return { current, incoming, raw, eased, p: takeoverP(eased), phase, queued, dir, suspended };
    },
  };
}
