// Section 4 part three's step maths (docs/specs/section-4-flux.md 4 "Motion plan", 9 X-1, X-2 and X-4; the numbers are
// read off the reference in docs/specs/evidence/section-4-flux-reference.md 2 to 4, 7 to 9): pure functions with no
// three import, so tests/unit/room-carousel.test.ts holds them to the spec's numbers under node. carousel.ts drives its
// three objects from these; nothing here reads the DOM, the clock or a texture. Every angle is radians unless the name
// says degrees, every time is seconds unless it says ms, and t is the step's eased value (easeStep of the tween's own
// 0 to 1) wherever a function takes a step position.

/** the step's constants (spec 4, the motion table; X-13 for the keys Tune moves) */
export const STEP = Object.freeze({
  /** one step, ms (Tune stepMs) */
  ms: 770,
  /** the front index switches at this eased t (285 ms of 770) */
  frontAt: 0.75,
  /** the product is swapped edge-on at this eased t */
  swapAt: 0.5,
  /** the product's scale eases between the two products over this span of eased t */
  scaleFrom: 0.35, scaleTo: 0.65,
  /** further gestures are swallowed this long after a step, ms */
  cooldownMs: 150,
  /** the field of view at rest, at the pinch's bottom, and where the pinch returns (Tune fovStep, fovReturnAt) */
  fovBase: 45, fovStep: 42, fovReturnAt: 0.65,
  /** the ring and the fixed camera (reference 2) */
  radius: 7,
  cam: Object.freeze({ x: 0, y: 0.2, z: -1 }),
  target: Object.freeze({ x: 0, y: 0, z: -7 }),
  /** the arc per class, degrees (Tune sweepDeg, sweepDegPortrait; X-1) */
  sweepDeg: 80, sweepDegPortrait: 22,
  /** the planes' overscan over the cover fit */
  overscan: 1.01,
  /** the product's place on the ring's front and its look from a pressed pointer, radians per unit of the pointer */
  productZ: -4.4, lookRad: 0.3,
  /** the lights: the light-up value may change by at most dt over this many seconds (X-4) */
  lightRateS: 0.68,
  /** the loops: play above this proximity (or while falling), paused and reset at or under the other */
  playAbove: 0.3, resetAt: 0.02,
  /** the key light's cross-fade from the front switch, ms (Tune keyLightMs) */
  keyLightMs: 1100,
  /** the seams' cloud: cover in, cover out, the out curve's knee and where it lands (reference 8.1) */
  seamInMs: 280, seamOutMs: 360, seamKneeMs: 120, seamKnee: 0.78,
  /** the still to loop cross-fade, and the reduced-motion step (spec 4, "Reduced motion") */
  fadeMs: 300,
});

/** the loops' frame sizes by class (spec 3, "The backgrounds"), as width over height */
export const LOOP_ASPECT = Object.freeze({ wide: 1328 / 692, portrait: 720 / 1280 });
export type LoopClass = keyof typeof LOOP_ASPECT;

/** the light-up's parameters (Tune lightStart, lightSoft, lightBoost; the floor is the reference's) */
export interface LightConfig { start: number; soft: number; boost: number; floor: number }
export const LIGHT: Readonly<LightConfig> = Object.freeze({ start: 0.5, soft: 0.64, boost: 0.17, floor: 0.01 });

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
/** the cubic smoothstep of x over [a, b] */
export const smoothstep = (a: number, b: number, x: number): number => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** the tween's ease, power2.out: 1 minus (1 minus t) cubed, so eased(0.3) is 0.657 */
export const easeStep = (t: number): number => { const u = 1 - clamp01(t); return 1 - u * u * u; };

/**
 * The field of view at eased t: a cubic smoothstep from base to step over [0, returnAt] and back over [returnAt, 1]
 * (reference 4: 45 to 42 with the return at 0.65, so 43.5 at 0.325, 42 at 0.65, 43.5 at 0.825, 45 at 1).
 */
export function fovAt(t: number, base: number, step: number, returnAt: number): number {
  const n = Math.min(0.99, Math.max(0.01, returnAt)), x = clamp01(t), r = x <= n ? x / n : (1 - x) / (1 - n);
  return base + (step - base) * r * r * (3 - 2 * r);
}

/** the two planes' ring angles at eased t: the outgoing swings dir x sweep x t from the front, the incoming dir x sweep x (t minus 1) in from the other side */
export const anglesAt = (t: number, dir: 1 | -1, sweepRad: number): { out: number; in: number } => ({ out: dir * sweepRad * t, in: dir * sweepRad * (t - 1) });

/** a point of the ring at angle a (0 straight ahead at (0, 0, minus r)) and the billboard yaw that faces the camera from there (reference 2) */
export function ringPlace(angleRad: number, radius: number, cam: { x: number; y: number; z: number }): { x: number; y: number; z: number; yaw: number } {
  const x = -Math.sin(angleRad) * radius, z = -Math.cos(angleRad) * radius;
  return { x, y: 0, z, yaw: Math.atan2(cam.x - x, cam.z - z) };
}

/**
 * The plane's cover fit at a distance (reference 7): the view's height there is 2 tan(fov / 2) d and its width that
 * times the viewport's aspect; the frame fills whichever the video's aspect leaves short, with the overscan on both.
 */
export function coverFit(fovDeg: number, distance: number, viewportAspect: number, videoAspect: number, overscan: number = STEP.overscan): { width: number; height: number } {
  const c = 2 * Math.tan((fovDeg * Math.PI) / 360) * Math.max(1e-3, distance), l = c * viewportAspect;
  const [w, h] = videoAspect > viewportAspect ? [c * videoAspect, c] : [l, l / videoAspect];
  return { width: w * overscan, height: h * overscan };
}

/** scene i's proximity to the fractional step: 1 at rest on it, 0 a whole step away */
export const proximity = (step: number, i: number): number => clamp01(1 - Math.abs(step - i));

/**
 * The plane's light-up value, the reference's intro-less path (X-4): its target is proximity times (1 plus boost)
 * through a cubic smoothstep from start to start plus soft (so proximity 1 lands exactly on 1 with the defaults, the
 * lights are down by proximity 0.43 and up from 0.5, the first and the second half of a step), never below the floor,
 * and the value moves from prev by at most dt over lightRateS a frame. The shader (carousel.ts) then leads each pixel
 * by its luminance, lightGain.
 */
export function lightUp(prev: number, prox: number, dt: number, cfg: Readonly<LightConfig>): number {
  const target = Math.max(cfg.floor, smoothstep(cfg.start, cfg.start + cfg.soft, clamp01(prox) * (1 + cfg.boost)));
  const rate = Math.max(0, dt) / STEP.lightRateS;
  return prev + Math.max(-rate, Math.min(rate, target - prev));
}

/**
 * The per-pixel gain the plane's shader applies, on the CPU for the test: the light-up value v (0 at the floor, 1 at
 * rest) shifted by boost times (v plus luminance minus 1), so the brightest areas come up first and go down last, the
 * frame is whole at v 1 and at the floor at v 0 whatever the pixel.
 */
export function lightGain(light: number, lum: number, cfg: Readonly<LightConfig>): number {
  const v = (light - cfg.floor) / (1 - cfg.floor);
  return cfg.floor + (1 - cfg.floor) * clamp01(v + cfg.boost * (v + lum - 1));
}

/** a loop plays while its proximity is above 0.3, or while it is falling (the room leaving keeps moving until it is reset) */
export const loopShouldPlay = (prox: number, falling: boolean): boolean => prox > STEP.playAbove || (falling && prox > STEP.resetAt);
/** a loop is paused and sought to 0 once its proximity is 0.02 or less (the end of the step it leaves) */
export const loopShouldReset = (prox: number): boolean => prox <= STEP.resetAt;

/**
 * The product's yaw at the fractional step while it stands for scene i: minus pi per step plus the base yaw of pi times
 * i, plus the scene's authored presentation yaw, so at rest on scene i (step i) it faces out at baseYaw and is edge-on
 * at every half step, where it is swapped.
 */
export const productYaw = (step: number, i: number, baseYaw: number): number => baseYaw + Math.PI * (i - step);

/** the product's scale across a step: from the outgoing's to the incoming's over eased t 0.35 to 0.65, around the swap at 0.5 */
export const productScale = (t: number, from: number, to: number): number => from + (to - from) * smoothstep(STEP.scaleFrom, STEP.scaleTo, t);

/** the key light's colour t seconds after the front switch: a cubic smoothstep from the old tint to the new over ms (1.1 s) */
export function keyLight(t: number, from: readonly [number, number, number], to: readonly [number, number, number], ms: number = STEP.keyLightMs): [number, number, number] {
  const k = smoothstep(0, 1, t / (ms / 1000));
  return [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k];
}

/**
 * The share of a w x h viewport the two planes cover at eased t of a step (X-1, AC15): the rig as carousel.ts builds it
 * (the fixed camera, the fov of fovAt, the planes on the ring at anglesAt, billboarded and cover-fitted at their own
 * distance to the class's loop aspect), ray-cast through a grid of sample points, a hit where the ray meets either
 * plane in front of the camera. The arc defaults to the class's (80 wide, 22 portrait); the failing case is 80 at 390
 * x 844, which empties the frame for a third of the step.
 */
export function planeCoverage(t: number, cls: LoopClass, viewport: { w: number; h: number }, sweepDeg: number = cls === 'portrait' ? STEP.sweepDegPortrait : STEP.sweepDeg, samples: number = 96): number {
  const aspect = viewport.w / viewport.h, fov = fovAt(t, STEP.fovBase, STEP.fovStep, STEP.fovReturnAt), tanH = Math.tan((fov * Math.PI) / 360);
  const P = STEP.cam, T = STEP.target;
  // the camera's basis: forward to the target, right from forward and world up, up from right and forward (three's lookAt)
  let fx = T.x - P.x, fy = T.y - P.y, fz = T.z - P.z;
  const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
  let rx = -fz, rz = fx;
  const rl = Math.hypot(rx, rz); rx /= rl; rz /= rl;
  const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
  const a = anglesAt(t, 1, (sweepDeg * Math.PI) / 180);
  const planes = [a.out, a.in].map((ang) => {
    const p = ringPlace(ang, STEP.radius, P), d = Math.hypot(p.x - P.x, p.y - P.y, p.z - P.z), fit = coverFit(fov, d, aspect, LOOP_ASPECT[cls]);
    // the plane's right axis and normal from its yaw (rotation about y), its up the world's
    return { cx: p.x, cy: p.y, cz: p.z, rx: Math.cos(p.yaw), rz: -Math.sin(p.yaw), nx: Math.sin(p.yaw), nz: Math.cos(p.yaw), hw: fit.width / 2, hh: fit.height / 2 };
  });
  const cols = Math.max(8, Math.round(samples)), rows = Math.max(8, Math.round(samples / aspect));
  let hits = 0;
  for (let j = 0; j < rows; j++) {
    const v = ((j + 0.5) / rows) * 2 - 1;
    for (let i = 0; i < cols; i++) {
      const u = ((i + 0.5) / cols) * 2 - 1;
      const dx = fx + u * tanH * aspect * rx + v * tanH * ux, dy = fy + v * tanH * uy, dz = fz + u * tanH * aspect * rz + v * tanH * uz;
      for (const q of planes) {
        const denom = dx * q.nx + dz * q.nz;
        if (Math.abs(denom) < 1e-9) continue;
        const s = ((q.cx - P.x) * q.nx + (q.cz - P.z) * q.nz) / denom;
        if (s <= 0) continue;
        const hx = P.x + s * dx - q.cx, hy = P.y + s * dy - q.cy, hz = P.z + s * dz - q.cz;
        if (Math.abs(hx * q.rx + hz * q.rz) <= q.hw && Math.abs(hy) <= q.hh) { hits++; break; }
      }
    }
  }
  return hits / (cols * rows);
}

/**
 * The seam's cloud cover at e (0 to 1 of the phase): in, 1 minus (1 minus e) squared over 280 ms; out, linear from 1 to
 * 0.78 over the first 120 ms of 360, then a cubic smoothstep to 0 (reference 8.1); 0 with no phase.
 */
export function cloudCover(phase: 'in' | 'out' | null, e: number): number {
  const x = clamp01(e);
  if (phase === 'in') return 1 - (1 - x) * (1 - x);
  if (phase === 'out') {
    const k = Math.min(0.55, STEP.seamKneeMs / STEP.seamOutMs);
    return x < k ? 1 - (1 - STEP.seamKnee) * (x / k) : STEP.seamKnee * (1 - smoothstep(0, 1, (x - k) / (1 - k)));
  }
  return 0;
}
