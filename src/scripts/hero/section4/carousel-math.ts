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
  /** the product's scale eases between the two products over this span of eased t, each product held within scaleReach of its own size (productScale) */
  scaleFrom: 0.35, scaleTo: 0.65, scaleReach: 1.3,
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
  /** the lights: the light-up value moves toward its target by at most dt over this many seconds, dt capped (X-4) */
  lightRateS: 0.68, lightDtCap: 0.1,
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

/** the product's share of the view at its distance (spec 3, "Size and pose"): the case at most this much of the view's height and of its width, whichever bites first */
export interface ProductFill { height: number; width: number }

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
 * The plane's light-up target, the reference's intro-less path (X-4, spec 4 "Proximity"): S from the proximity h and
 * the direction it moves in, rising (h minus start) over (1 minus start), falling h over (1 minus start), clamped, then
 * the cubic smoothstep. So the room leaving stays lit until its proximity drops to start (0.5, the step's half) and
 * the room arriving is dark until it rises past it: both change over the step's second half.
 */
export function lightTarget(prox: number, rising: boolean, start: number): number {
  const x = Math.max(1 - start, 1e-3), h = clamp01(prox);
  return smoothstep(0, 1, rising ? (h - start) / x : h / x);
}

/**
 * The plane's light-up value this frame: it moves from prev toward lightTarget by at most dt over lightRateS (0.68 s),
 * dt capped at lightDtCap (0.1 s, so a long frame cannot jump it). No mount ramp: a plane parked by setScene takes its
 * target at once (carousel.ts). The shader (carousel.ts) then builds each pixel's gain from the value, lightGain.
 */
export function lightUp(prev: number, prox: number, rising: boolean, dt: number, cfg: Readonly<LightConfig>): number {
  const target = lightTarget(prox, rising, cfg.start);
  const rate = Math.min(Math.max(0, dt), STEP.lightDtCap) / STEP.lightRateS;
  return prev + Math.max(-rate, Math.min(rate, target - prev));
}

/**
 * The per-pixel gain the plane's shader applies to the decoded (linear) pixel, on the CPU for the test (the reference's
 * reveal, evidence 14): with the pixel's luminance L as its square root, an edge at (1 plus soft) times (1 minus value)
 * reveals the pixel through a smoothstep of width soft (the brightest areas first), an ambient term smoothstep(0.4, 1,
 * value) times value lifts the rest as the value nears 1, the boost scales the revealed areas while the value is under
 * 1, and nothing goes below the floor. Whole (1) at value 1 for every pixel, the floor at value 0 for every pixel.
 */
export function lightGain(light: number, lum: number, cfg: Readonly<LightConfig>): number {
  const v = clamp01(light), l = Math.sqrt(clamp01(lum));
  const edge = (1 + cfg.soft) * (1 - v);
  const reveal = smoothstep(edge, edge + cfg.soft, l);
  const ambient = smoothstep(0.4, 1, v) * v;
  return Math.max(Math.max(reveal, ambient) * (1 + cfg.boost * reveal * (1 - v)), cfg.floor);
}

/** the class scale (spec 3, "Size and pose"): the life-size case (caseW by caseH) at most fill.height of the view's height viewH and fill.width of its width, whichever bites first */
export function productFit(viewH: number, viewportAspect: number, caseW: number, caseH: number, fill: Readonly<ProductFill>): number {
  return Math.min((fill.height * viewH) / caseH, (fill.width * viewH * viewportAspect) / caseW);
}

// ---- the product against the lines (spec 3 "Size and pose"; the build record's D3)

/**
 * The lines' column as room.css and tokens.css lay it out: the gutter --inset is clamp(16px, 3.5vw, 56px), the four
 * lines' block sits at the gutter, 100 percent minus two gutters wide and at most 520 px, bottom left; the block the
 * four lines, the hint and the loading line may fill is the bottom 34 percent of the stage. gap: the clearance the
 * product keeps from the column's edge, CSS px. tests/unit/room-carousel.test.ts holds the stylesheets to these.
 */
export const LINES = Object.freeze({ insetMin: 16, insetVw: 0.035, insetMax: 56, column: 520, block: 0.34, gap: 2 });
/** the gutter at a stage width, CSS px */
export const insetPx = (cssW: number): number => Math.min(LINES.insetMax, Math.max(LINES.insetMin, cssW * LINES.insetVw));
/** a box in shares of the stage, x from the left edge and y from the top */
export interface Box { x0: number; y0: number; x1: number; y1: number }
/** the lines' box at a stage size: the column's width at the gutter, the bottom block */
export function linesBox(cssW: number, cssH: number): Box {
  const inset = insetPx(cssW), w = Math.min(LINES.column, Math.max(0, cssW - 2 * inset));
  return { x0: inset / cssW, x1: (inset + w) / cssW, y0: 1 - LINES.block, y1: 1 };
}
/**
 * The product's place per class. The wide class: the case at most 0.55 of the view's height and 0.62 of its width,
 * the centre kept (the ring's own, world y 0), the holder moved right only as far as the widest product's near face
 * needs to clear the lines' column (at 1280 x 800 the column's edge at 565 px would run under a centred case by 42 px
 * and under the Lenskin by 87). The portrait class: the case at most 0.50 of the view's height and 0.62 of its width,
 * its centre raised to 0.60 of the view's height from the bottom, so the case's near face clears the lines' block (at
 * 0.58 the near face, which projects 3 percent larger than the centre's depth, would still cross the block's top by
 * 0.017 of the height). The class is the stage's shape, as the arc is (X-1).
 */
export const PLACE = Object.freeze({
  wide: Object.freeze({ height: 0.55, width: 0.62, centre: null as number | null }),
  portrait: Object.freeze({ height: 0.50, width: 0.62, centre: 0.60 as number | null }),
});
export interface Placement { cls: LoopClass; scale: number; /** the holder's world x and y at productZ */ x: number; y: number }
/** the fixed camera's basis (three's lookAt): forward, right and up, unit vectors */
export function cameraBasis(): { f: [number, number, number]; r: [number, number, number]; u: [number, number, number] } {
  const P = STEP.cam, T = STEP.target;
  let fx = T.x - P.x, fy = T.y - P.y, fz = T.z - P.z;
  const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
  let rx = -fz, rz = fx;
  const rl = Math.hypot(rx, rz); rx /= rl; rz /= rl;
  return { f: [fx, fy, fz], r: [rx, 0, rz], u: [-rz * fy, rz * fx - rx * fz, rx * fy] };
}
/** a world point in the fixed camera's view: its right, up and depth coordinates */
export function toView(x: number, y: number, z: number): { vx: number; vy: number; depth: number } {
  const { f, r, u } = cameraBasis(), P = STEP.cam, dx = x - P.x, dy = y - P.y, dz = z - P.z;
  return { vx: dx * r[0] + dy * r[1] + dz * r[2], vy: dx * u[0] + dy * u[1] + dz * u[2], depth: dx * f[0] + dy * f[1] + dz * f[2] };
}
/** the product's placement at a stage size (CSS px), from the case's life size and every product's life size times its exhibit factor */
export function productPlacement(cssW: number, cssH: number, caseW: number, caseH: number, sizes: readonly (readonly [number, number, number])[]): Placement {
  const cls: LoopClass = cssH > cssW ? 'portrait' : 'wide', P = PLACE[cls], aspect = cssW / Math.max(1, cssH), tanH = Math.tan((STEP.fovBase * Math.PI) / 360);
  const { f, u } = cameraBasis(), C = STEP.cam, dz = STEP.productZ - C.z;
  // the holder's y: world 0 (the ring's centre) or the y whose projection sits at centre of the view's height from the bottom
  let y = 0;
  if (P.centre !== null) {
    const n = 2 * P.centre - 1;   // vy = n x tanH x depth, both linear in y
    y = (n * tanH * (f[1] * -C.y + f[2] * dz) - (u[1] * -C.y + u[2] * dz)) / (u[1] - n * tanH * f[1]);
  }
  const d0 = toView(0, y, STEP.productZ).depth, viewH = 2 * tanH * d0, viewW = viewH * aspect;
  const scale = productFit(viewH, aspect, caseW, caseH, P);
  let x = 0;
  if (cls === 'wide') {
    const col = linesBox(cssW, cssH), edge = (col.x1 - 0.5 + LINES.gap / cssW) * viewW;   // the column's right edge plus the gap, world units at the centre's depth
    let need = 0;
    for (const s of sizes) { const hw = (s[0] * scale) / 2, dn = Math.max(1e-3, d0 - (s[2] * scale) / 2); need = Math.max(need, (hw * d0) / dn); }   // the near face's half width as seen at the centre's depth
    x = Math.max(0, edge + need);
  }
  return { cls, scale, x, y };
}
/** the product's box on the stage at rest (face out, no look): its life-size box times its exhibit factor at the placement, every corner projected */
export function productScreenBox(p: Placement, size: readonly [number, number, number], cssW: number, cssH: number): Box {
  const aspect = cssW / Math.max(1, cssH), tanH = Math.tan((STEP.fovBase * Math.PI) / 360);
  const box: Box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const v = toView(p.x + (sx * size[0] * p.scale) / 2, p.y + (sy * size[1] * p.scale) / 2, STEP.productZ + (sz * size[2] * p.scale) / 2);
    const nx = v.vx / (v.depth * tanH * aspect), ny = v.vy / (v.depth * tanH), x = (nx + 1) / 2, yy = (1 - ny) / 2;
    box.x0 = Math.min(box.x0, x); box.x1 = Math.max(box.x1, x); box.y0 = Math.min(box.y0, yy); box.y1 = Math.max(box.y1, yy);
  }
  return box;
}
/** the two boxes' overlap in CSS px squared (0 where they only touch or stand apart) */
export function boxOverlap(a: Box, b: Box, cssW: number, cssH: number): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * cssW * h * cssH : 0;
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

/**
 * How much of the authored rest pose (the scene's baseYaw and basePitch) the product carries at the fractional step
 * while it stands for scene i: all of it at rest, none by the half step, so the edge-on swap stays edge-on whatever the
 * pose; a cubic smoothstep between (Sam's references of 2026-10-26: the AirPods case seen from above, the Lenskin turned).
 */
export const poseWeight = (step: number, i: number): number => smoothstep(0.5, 1, 1 - Math.abs(step - i));

/**
 * The product's scale across a step, for whichever product is shown (the outgoing until the swap at eased t 0.5, the
 * incoming after, as the carousel swaps them): the outgoing eases from its own scale toward the incoming's over 0.35
 * to 0.5, the incoming from the outgoing's toward its own over 0.5 to 0.65, each far end held within STEP.scaleReach
 * (1.3) of the shown product's own scale, so no product is ever drawn at more than 1.3 times or less than 1 over 1.3 of
 * its size. Unclamped, the AirPods Max (exhibit 0.62) after the Lenskin (2.2) appeared at 3.5 times its size for two
 * frames, filling a phone's screen (the review of 2026-10-26); the pair's sizes still meet across the edge-on swap, in
 * two eases rather than one.
 */
export function productScale(t: number, from: number, to: number, incoming: boolean = t >= STEP.swapAt): number {
  const R = STEP.scaleReach, within = (x: number, own: number) => Math.min(own * R, Math.max(own / R, x));
  if (!incoming) { const target = within(to, from); return from + (target - from) * smoothstep(STEP.scaleFrom, STEP.swapAt, t); }
  const start = within(from, to); return start + (to - start) * smoothstep(STEP.swapAt, STEP.scaleTo, t);
}

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

// ---- the frame under a seam

/** the section's states as the director names them (config/room.ts RoomState, spelt here so this file imports nothing) */
export type RoomStateName = 'hall' | 'entering' | 'world' | 'back' | 'seam';
/** what the director's plan carries this frame */
export type FrameSource = 'hall' | 'entering' | 'back' | 'scenes';
/**
 * Which frame the director's plan carries, by the state and by what the frame was when a seam began (under): the hall
 * in hall, or under a seam that began over the hall; the entry's bubble; the way back; the scenes in world, or under a
 * seam over them. The exit's cover-in from scene 5 and the wrap's hold, cover-out and lock keep the carousel's frame
 * under the cloud, so the cut comes at full cover and the hero is never seen through the cloud (spec 9, X-15).
 */
export function frameSource(state: RoomStateName, under: 'hall' | 'world'): FrameSource {
  if (state === 'entering' || state === 'back') return state;
  return state === 'world' || under === 'world' ? 'scenes' : 'hall';
}
