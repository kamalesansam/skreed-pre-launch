// Option B's flight (docs/specs/section-4-world.md 2 "Option B"): park.json's flights flown exactly as its travel.how
// says, the two cross-fades, and the lands' map onto the park's poses. Pure (three's curves and the site's ease only, the
// park's numbers handed in), so tests/unit/room-travel-park.test.ts flies what travel-park.ts flies; travel-park.ts is its
// only importer, so it ships only where option B does.
// - The flight at tau (0 to 1; back runs it from 1 to 0): the position on the centripetal Catmull-Rom path through
//   points, at easeInOutCubic(tau) of its arc length; the look at the point of the centripetal path through look at tau
//   (not by arc length: the keys are spaced in time); the FOV, the scene's and the sky's exposures from their keys, one
//   every 1 / (keys - 1) of the travel, linearly. The camera looks at it with the world's up, so it never rolls.
// - The land's rest: a land at rest is its picture pushed into along its view by its rest push (world.ts restPush, 0.15 of
//   its near distance), so the park's camera stands that far ahead of the pose along the view, at either end and blended
//   between on the same ease. Along the view, so the view's direction, and its rate, are the flight's own.
// - The cross-fades: the departing picture over the park out over the first 0.4 s, the arriving one in over the last
//   0.4 s, each on a smoothstep so neither starts or ends with a jolt; at p 0 and 1 the frame is the land at rest.
// - The speed: while the camera is fast the baked light is blurred by the ground it covers (blurAt, AC5).
import { CatmullRomCurve3, Vector3 } from 'three';
import { clamp01, easeInOutCubic } from '../util/math.ts';

export type V3 = readonly [number, number, number];
/** park.json's pose (pack.mjs park writes it) */
export interface ParkPoseJson { id: string; position: V3; target: V3; fov: number; near: number; exposure: number; skyExposure: number }
/** park.json's flight between two poses, in pose order */
export interface ParkFlightJson { from: number; to: number; points: readonly V3[]; look: readonly V3[]; exposure: readonly number[]; skyExposure: readonly number[]; fov: readonly number[] }
/** park.json's travel: the flights' design length and Tune's longest, the ease, the keys' count, the view rate's cap */
export interface ParkTravelJson { ms: number; msMax: number; ease: string; keys: number; rateMaxDegPerS: number }

/** the cross-fades either end, seconds (spec 2: "cross-fades over 0.4 s") */
export const PARK_FADE_S = 0.4;

/** each land's pose by its product id (ROOM_LANDS' order; a land Sam has not approved is not among them), -1 where park.json has none */
export const posesOfLands = (lands: readonly { id: string }[], poses: readonly { id: string }[]): number[] => lands.map((l) => poses.findIndex((p) => p.id === l.id));

export interface Leg { flight: number; reverse: boolean }
/** the travel from land a to land b: the flight between their poses, forward or flown back; null where there is none (poses not neighbours, or a pose missing): the cross-fade then */
export function legOf(poseOf: readonly number[], flights: readonly { from: number; to: number }[], a: number, b: number): Leg | null {
  const pa = poseOf[a] ?? -1, pb = poseOf[b] ?? -1;
  if (pa < 0 || pb < 0 || pa === pb) return null;
  const f = flights.findIndex((x) => x.from === pa && x.to === pb);
  if (f >= 0) return { flight: f, reverse: false };
  const r = flights.findIndex((x) => x.from === pb && x.to === pa);
  return r >= 0 ? { flight: r, reverse: true } : null;
}

/** a key at tau: keys one every 1 / (n - 1) of the travel, read linearly */
export function keyAt(keys: readonly number[], tau: number): number {
  if (keys.length < 2) return keys[0] ?? 0;
  const x = clamp01(tau) * (keys.length - 1), i = Math.min(keys.length - 2, Math.floor(x));
  return keys[i] + (keys[i + 1] - keys[i]) * (x - i);
}

/** the travel's length, ms: Tune's landTravelMs held to the flights' design range, so the view never turns faster than 90 degrees a second */
export const parkMs = (landTravelMs: number, t: Pick<ParkTravelJson, 'ms' | 'msMax'>): number => Math.min(t.msMax, Math.max(t.ms, landTravelMs));

/** the departing picture's alpha and the arriving one's at p of a travel ms long (each fade 0.4 s, at most half the travel) */
export function fadesAt(p: number, ms: number): [number, number] {
  const f = Math.min(0.5, (PARK_FADE_S * 1000) / Math.max(1, ms)), s = (x: number) => x * x * (3 - 2 * x);
  return [1 - s(clamp01(p / f)), s(clamp01((p - (1 - f)) / f))];
}

/** the vertical FOV, degrees, that shows a picture of picAspect captured at fov cover-fit on a frame of aspect (world.ts landCamera's rule) */
export function coverFov(fov: number, picAspect: number, aspect: number): number {
  const ty = Math.tan((fov * Math.PI) / 360), tyS = aspect < picAspect ? ty : (ty * picAspect) / aspect;
  return (2 * Math.atan(tyS) * 180) / Math.PI;
}

/** the camera at a moment of a flight */
export interface Flown { position: Vector3; look: Vector3; fov: number; exposure: number; sky: number }
export const flown = (): Flown => ({ position: new Vector3(), look: new Vector3(), fov: 0, exposure: 1, sky: 1 });

export interface Flight {
  readonly json: ParkFlightJson;
  /**
   * the camera at tau (0 at the flight's first pose, 1 at its last), pushed ahead along its view by push0 at tau 0 and
   * push1 at tau 1 (the lands' rest pushes), blended on the flight's ease; into out, which it returns
   */
  at(tau: number, out: Flown, push0?: number, push1?: number): Flown;
  /** the camera's speed along the path at tau, m/s, for a travel ms long */
  speed(tau: number, ms: number): number;
}

/**
 * The baked light's blur, metres, at a camera speed (m/s): the ground the camera covers in BLUR_S (6 frames at 60 Hz), as
 * a camera's motion blur softens a sun-striped path. Flown in 2.6 s the flights reach 61 to 75 m/s, and the Mall's elms
 * stripe its path with sun and shade: sharp, the bands sweep the lower half of the frame as AC5's flashes (WCAG 2.3.1;
 * scripts/room/park-review.mjs --flash measured 7 transitions in a second at 1280 x 800 on 1 to 2, over the 6 that three
 * flashes allow). Blurred by the distance covered, the bands merge into the path's mean light while the camera is fast
 * (at most 4 transitions in a second on every travel at both sizes), and the blur is 0 at either end, so the poses are
 * drawn as baked.
 */
export const BLUR_S = 6 / 60;
export const blurAt = (speed: number): number => Math.max(0, speed) * BLUR_S;

export function createFlight(json: ParkFlightJson): Flight {
  const P = new CatmullRomCurve3(json.points.map((v) => new Vector3(...v)), false, 'centripetal');
  const L = new CatmullRomCurve3(json.look.map((v) => new Vector3(...v)), false, 'centripetal');
  const d = new Vector3(), a = new Vector3(), b = new Vector3();
  return {
    json,
    speed(tau, ms) {
      const h = 1e-3, t0 = clamp01(tau - h), t1 = clamp01(tau + h);
      if (t1 <= t0) return 0;
      P.getPointAt(easeInOutCubic(t0), a); P.getPointAt(easeInOutCubic(t1), b);
      return a.distanceTo(b) / (((t1 - t0) * ms) / 1000);
    },
    at(tau, out, push0 = 0, push1 = 0) {
      const t = clamp01(tau), e = easeInOutCubic(t);
      P.getPointAt(e, out.position); L.getPoint(t, out.look);
      const push = push0 + (push1 - push0) * e;
      if (push !== 0) { d.subVectors(out.look, out.position); const n = d.length(); if (n > push) out.position.addScaledVector(d, push / n); }
      out.fov = keyAt(json.fov, t); out.exposure = keyAt(json.exposure, t); out.sky = keyAt(json.skyExposure, t);
      return out;
    },
  };
}
