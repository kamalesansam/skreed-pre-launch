// Section 4 part three's carousel (docs/specs/section-4-flux.md 3 "Size and pose" and "Materials and lights", 4 "Motion
// plan" and "A loop the browser paused", 5 "Video policy" and "Loading", 7 AC7 and AC15, 9 X-1 and X-4; the numbers
// read off the reference in docs/specs/evidence/section-4-flux-reference.md 2 to 4, 7 to 9 and 14): carousel-math.ts
// against the spec's numbers (the ease with eased(0.3) 0.657 and the front switch at 285 ms, the fov curve with its
// bottom at 227 ms, the angles per class, the per-frame fit and its two branches, the light-up's direction rule, rate
// limit and dt cap with the shader's gain, the play and pause thresholds with at most two loops playing over a double
// step, the product's yaw, scale and class scale, the key light's fade, the planes' coverage across a step on both
// classes with the minimum printed, and the cloud's curves); video.ts's pure rules and its resume rule over a
// hidden-then-visible document through fake elements; carousel.ts driven through a stub renderer and a fake loop pool
// (the step's clock, the cooldown, the swap, the loop textures' residency over a lap, the class scale on both shapes,
// the reduced path's cut with the product facing out, the motion control, products arriving late); and the three
// modules' imports: three, RoomEnvironment and products-bin.ts alone, no loader, nothing outside section4, and video.ts
// the only one that spells the loops' format.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Group, Mesh, MeshPhysicalMaterial, Scene, Texture, type Object3D, type WebGLRenderer } from 'three';
import { LIGHT, LINES, LOOP_ASPECT, PLACE, STEP, anglesAt, boxOverlap, cloudCover, coverFit, easeStep, fovAt, frameSource, insetPx, keyLight, lightGain, lightTarget, lightUp, linesBox, loopShouldPlay, loopShouldReset, planeCoverage, poseWeight, productFit, productPlacement, productScale, productScreenBox, productYaw, proximity, ringPlace, smoothstep, toView, type LoopClass } from '../../src/scripts/hero/section4/carousel-math.ts';
import { VIDEO, allowed, create as createPool, wholeBuffered, type VideoElement, type VideoHost, type VideoPool } from '../../src/scripts/hero/section4/video.ts';
import { CLASS_FILL, CLOUD, EXHIBIT, FINISH, LIGHTS, PARTS, SHADE, createCarousel, partRole, type CarouselTune, type SceneDef } from '../../src/scripts/hero/section4/carousel.ts';

const near = (a: number, b: number, eps = 1e-9, msg?: string) => assert.ok(Math.abs(a - b) <= eps, msg ?? `${a} against ${b}`);
const DEG = Math.PI / 180;
const CAM_D = Math.hypot(STEP.cam.x - STEP.target.x, STEP.cam.y - STEP.target.y, STEP.cam.z - STEP.target.z);   // 6.0033, the camera to the ring's front
const TUNE: CarouselTune = { stepMs: 770, sweepDeg: 80, sweepDegPortrait: 22, fovStep: 42, fovReturnAt: 0.65, lightStart: 0.5, lightSoft: 0.64, lightBoost: 0.17, keyLightMs: 1100 };
/** the t at which the ease reaches e: the inverse of 1 minus (1 minus t) cubed */
const easeInv = (e: number) => 1 - Math.cbrt(1 - e);

test('the ease: power2.out, eased(0.3) 0.657, the front switch at 285 ms of 770, the fov bottom at 227 ms', () => {
  near(easeStep(0.3), 0.657, 5e-4);
  assert.equal(easeStep(0), 0); assert.equal(easeStep(1), 1); assert.equal(easeStep(-1), 0); assert.equal(easeStep(2), 1);
  near(easeInv(STEP.frontAt) * STEP.ms, 285, 0.5, 'the front switch');
  near(easeInv(STEP.fovReturnAt) * STEP.ms, 227, 0.5, 'the fov bottom');
  assert.equal(STEP.ms, 770); assert.equal(STEP.cooldownMs, 150); assert.equal(STEP.frontAt, 0.75); assert.equal(STEP.swapAt, 0.5);
  for (let t = 0; t < 1; t += 0.01) assert.ok(easeStep(t + 0.01) > easeStep(t), 'monotone');
});

test('the fov: 45 at rest, 42 at eased 0.65, 45 at 1, 43.5 half way down and half way back, a cubic smoothstep each way', () => {
  assert.equal(fovAt(0, 45, 42, 0.65), 45);
  near(fovAt(0.65, 45, 42, 0.65), 42);
  assert.equal(fovAt(1, 45, 42, 0.65), 45);
  near(fovAt(0.325, 45, 42, 0.65), 43.5);
  near(fovAt(0.825, 45, 42, 0.65), 43.5);
  for (let t = 0; t < 0.65; t += 0.01) assert.ok(fovAt(t + 0.01, 45, 42, 0.65) <= fovAt(t, 45, 42, 0.65) + 1e-12, 'down to the bottom');
  for (let t = 0.65; t < 1; t += 0.01) assert.ok(fovAt(t + 0.01, 45, 42, 0.65) >= fovAt(t, 45, 42, 0.65) - 1e-12, 'back by the end');
  assert.equal(fovAt(0.5, 45, 42, 0), fovAt(0.5, 45, 42, 0.01), 'returnAt is clamped to [0.01, 0.99]');
  assert.equal(STEP.fovBase, 45); assert.equal(STEP.fovStep, 42); assert.equal(STEP.fovReturnAt, 0.65);
});

test('the angles at t 0, 0.5 and 1 on both arcs: the outgoing from 0 to dir x sweep, the incoming from minus that to 0', () => {
  for (const [deg, cls] of [[80, 'wide'], [22, 'portrait']] as const) {
    const s = deg * DEG;
    for (const dir of [1, -1] as const) {
      const a0 = anglesAt(0, dir, s), a5 = anglesAt(0.5, dir, s), a1 = anglesAt(1, dir, s);
      near(a0.out, 0); near(a0.in, -dir * s);
      near(a5.out, dir * s / 2); near(a5.in, -dir * s / 2);
      near(a1.out, dir * s); near(a1.in, 0);
    }
    assert.equal(cls === 'wide' ? STEP.sweepDeg : STEP.sweepDegPortrait, deg);
  }
});

test('ringPlace: angle 0 is straight ahead at (0, 0, minus 7), every plane faces the fixed camera', () => {
  const p0 = ringPlace(0, STEP.radius, STEP.cam);
  assert.deepEqual([p0.x, p0.y, p0.z, p0.yaw], [-0, 0, -7, 0]);
  for (const a of [-80, -40, -22, -11, 11, 22, 40, 80]) {
    const p = ringPlace(a * DEG, STEP.radius, STEP.cam);
    near(Math.hypot(p.x, p.z), 7, 1e-9, 'on the ring');
    // the plane's normal (sin yaw, 0, cos yaw) points at the camera: parallel to (cam minus p), so their cross product is 0
    const dx = STEP.cam.x - p.x, dz = STEP.cam.z - p.z;
    near(Math.sin(p.yaw) * dz - Math.cos(p.yaw) * dx, 0, 1e-9, `faces the camera at ${a} degrees`);
    assert.ok(Math.sin(p.yaw) * dx + Math.cos(p.yaw) * dz > 0, 'toward it, not away');
  }
  near(CAM_D, 6.0033, 1e-4);
});

test('the fit at t 0, 0.65 and 1: the view height at the distance times the aspect rule, both times 1.01; both branches', () => {
  const h = (fov: number, d: number) => 2 * Math.tan((fov * DEG) / 2) * d;
  for (const t of [0, 0.65, 1]) {
    const fov = fovAt(t, 45, 42, 0.65);
    const wide = coverFit(fov, CAM_D, 1280 / 800, LOOP_ASPECT.wide), portrait = coverFit(fov, CAM_D, 390 / 844, LOOP_ASPECT.portrait);
    near(wide.height, h(fov, CAM_D) * 1.01, 1e-9, `wide height at ${t}`);
    near(wide.width, h(fov, CAM_D) * LOOP_ASPECT.wide * 1.01, 1e-9, `wide width at ${t}`);
    near(portrait.height, h(fov, CAM_D) * 1.01, 1e-9, `portrait height at ${t}`);
    near(portrait.width, h(fov, CAM_D) * LOOP_ASPECT.portrait * 1.01, 1e-9, `portrait width at ${t}`);
  }
  near(coverFit(45, CAM_D, 1280 / 800, LOOP_ASPECT.wide).height, 5.023, 5e-4, 'the reference: 4.97 units tall times 1.01 at rest');
  // the other branch, a viewport wider than the frame: the width fills and the height follows the frame's aspect (844 x 390, 768 x 1024, 1920 x 969)
  for (const [w, hh, cls] of [[844, 390, 'wide'], [768, 1024, 'portrait'], [1920, 969, 'wide']] as const) {
    const u = w / hh, f = LOOP_ASPECT[cls];
    assert.ok(u > f, `${w} x ${hh} is wider than the ${cls} frame`);
    const fit = coverFit(45, CAM_D, u, f);
    near(fit.width, h(45, CAM_D) * u * 1.01, 1e-9, `${w} x ${hh}: the width fills`); near(fit.height, (h(45, CAM_D) * u * 1.01) / f, 1e-9, `${w} x ${hh}: the height follows the frame`);
  }
  assert.ok(LOOP_ASPECT.wide > 1280 / 800 && LOOP_ASPECT.portrait > 390 / 844, '1280 x 800 and 390 x 844 take the height branch');
  assert.equal(STEP.overscan, 1.01);
  assert.equal(coverFit(45, 0, 1, 1).height > 0, true, 'a zero distance is clamped');
});

test('proximity: 1 at rest on the scene, 0 a whole step away, linear between', () => {
  assert.equal(proximity(2, 2), 1); assert.equal(proximity(2.5, 2), 0.5); assert.equal(proximity(2.5, 3), 0.5);
  assert.equal(proximity(3, 2), 0); assert.equal(proximity(0, 2), 0); near(proximity(1.3, 2), 0.3);
});

test("the light-up's direction rule: the leaving room lit until its proximity drops to 0.5, the arriving dark until it rises past it; the rate of dt over 0.68 s with dt capped at 0.1 s", () => {
  // rising: S = (h minus 0.5) over 0.5 through the smoothstep
  assert.equal(lightTarget(0, true, 0.5), 0); assert.equal(lightTarget(0.5, true, 0.5), 0); near(lightTarget(0.75, true, 0.5), 0.5); assert.equal(lightTarget(1, true, 0.5), 1);
  // falling: S = h over 0.5
  assert.equal(lightTarget(1, false, 0.5), 1); assert.equal(lightTarget(0.5, false, 0.5), 1); near(lightTarget(0.25, false, 0.5), 0.5); assert.equal(lightTarget(0, false, 0.5), 0);
  near(lightTarget(0.625, true, 0.5), smoothstep(0, 1, 0.25), 1e-12, 'the cubic smoothstep');
  for (let h = 0; h < 1; h += 0.01) for (const rising of [true, false]) assert.ok(lightTarget(h + 0.01, rising, 0.5) >= lightTarget(h, rising, 0.5), 'monotone in proximity');
  assert.ok(lightTarget(0.7, false, 0.5) >= lightTarget(0.7, true, 0.5), 'the falling room is the lit one at the same proximity');
  // the rate limit: a frame of 68 ms moves the value by a tenth at most; a frame of a second counts as 0.1 s
  near(lightUp(0, 1, true, 0.068, LIGHT), 0.1);
  near(lightUp(1, 0, false, 0.068, LIGHT), 0.9);
  near(lightUp(0, 1, true, 1, LIGHT), 0.1 / 0.68, 1e-9, 'dt capped at 0.1 s');
  near(lightUp(0.5, 0.75, true, 0.068, LIGHT), 0.5, 1e-9, 'a change under the limit lands on its target');
  let v = 0; for (let k = 0; k < 10; k++) v = lightUp(v, 1, true, 0.068, LIGHT);
  near(v, 1, 1e-9, 'whole after 0.68 s');
  assert.equal(STEP.lightRateS, 0.68); assert.equal(STEP.lightDtCap, 0.1);
  assert.deepEqual(LIGHT, { start: 0.5, soft: 0.64, boost: 0.17, floor: 0.01 });
  // a step at 60 Hz: the outgoing plane stays lit through the first half and the incoming stays dark through it; both move over the second half and settle within 0.68 s of it
  const dt = 1 / 60; let out = 1, inn = 0, outProx = 1, inProx = 0, firstMove = -1;
  for (let t = dt; t <= 2; t += dt) {
    const e = easeStep(t / (STEP.ms / 1000)), po = proximity(e, 0), pi = proximity(e, 1);
    out = lightUp(out, po, po > outProx, dt, LIGHT); inn = lightUp(inn, pi, pi > inProx, dt, LIGHT); outProx = po; inProx = pi;
    if (e <= 0.5) { assert.equal(out, 1, `the leaving room lit at eased ${e.toFixed(3)}`); assert.equal(inn, 0, `the arriving room dark at eased ${e.toFixed(3)}`); }
    else if (firstMove < 0 && (out < 1 || inn > 0)) firstMove = t;
    if (t >= STEP.ms / 1000 + 0.7) { near(out, 0, 1e-9, 'the leaving room out'); near(inn, 1, 1e-9, 'the arriving room whole'); }
  }
  assert.ok(firstMove > 0 && firstMove < 0.25, `both move from the half (${(firstMove * 1000).toFixed(0)} ms)`);
});

test("the shader's gain (the reference's reveal): whole at value 1, the floor at 0 for every pixel; the brightest pixels come up first; monotone in the value", () => {
  for (const lum of [0, 0.1, 0.5, 1]) { assert.equal(lightGain(1, lum, LIGHT), 1, `whole at 1 (luminance ${lum})`); assert.equal(lightGain(0, lum, LIGHT), LIGHT.floor, `the floor at 0 (luminance ${lum})`); }
  // the reference's numbers at value 0.5: the ambient term alone (0.037) until the brightest pixels, which the reveal lifts to 0.196
  near(lightGain(0.5, 0, LIGHT), 0.0370, 5e-4); near(lightGain(0.5, 0.5, LIGHT), 0.0370, 5e-4); near(lightGain(0.5, 1, LIGHT), 0.1960, 5e-4);
  near(lightGain(0.7, 1, LIGHT), 0.9303, 5e-4); near(lightGain(0.9, 0.5, LIGHT), 0.9531, 5e-4);
  for (const v of [0.3, 0.5, 0.7, 0.9]) for (let l = 0; l < 1; l += 0.05) assert.ok(lightGain(v, l + 0.05, LIGHT) >= lightGain(v, l, LIGHT) - 1e-12, `brighter pixels lead at ${v}`);
  // monotone in the value up to the boost's overshoot: a fully revealed pixel carries 1 plus boost x (1 minus value), which eases back to 1 at value 1
  for (const lum of [0, 0.5, 1]) for (let v = 0; v < 1; v += 0.02) {
    const a = lightGain(v, lum, LIGHT), b = lightGain(v + 0.02, lum, LIGHT);
    if (a < 1) assert.ok(b >= a - 1e-12, `monotone in the value at luminance ${lum} (${v.toFixed(2)})`);
    else assert.ok(b <= 1 + LIGHT.boost + 1e-12 && b >= 1 - 1e-12, `the overshoot stays within the boost at luminance ${lum} (${v.toFixed(2)})`);
  }
  assert.ok(lightGain(0.5, 1, LIGHT) > lightGain(0.5, 0, LIGHT), 'a room comes up from its brightest areas');
});

test('the play and pause thresholds: play above 0.3 or while falling, reset at 0.02 or under; at most two loops play over a double step with the cooldown', () => {
  assert.equal(loopShouldPlay(0.31, false), true); assert.equal(loopShouldPlay(0.3, false), false); assert.equal(loopShouldPlay(0, false), false);
  assert.equal(loopShouldPlay(0.1, true), true); assert.equal(loopShouldPlay(0.021, true), true); assert.equal(loopShouldPlay(0.02, true), false);
  assert.equal(loopShouldReset(0.02), true); assert.equal(loopShouldReset(0.021), false); assert.equal(loopShouldReset(0), true);
  assert.equal(STEP.playAbove, 0.3); assert.equal(STEP.resetAt, 0.02);
  // the double step 0 to 1 to 2 at 60 Hz: 770 ms, 150 ms still, 770 ms, each scene's loop by its proximity
  const N = 5, prox = new Array(N).fill(0), falling = new Array(N).fill(false), playing = new Array(N).fill(false), atZero = new Array(N).fill(true);
  const dt = 1 / 60;
  const frame = (step: number) => {
    for (let i = 0; i < N; i++) {
      const p = proximity(step, i);
      falling[i] = p < prox[i] - 5e-4 ? true : p > prox[i] + 5e-4 ? false : falling[i];
      prox[i] = p;
      if (loopShouldReset(p)) { playing[i] = false; atZero[i] = true; }
      else if (loopShouldPlay(p, falling[i])) { playing[i] = true; atZero[i] = false; }
    }
    assert.ok(playing.filter(Boolean).length <= 2, `${playing.filter(Boolean).length} playing at step ${step}`);
  };
  frame(0);
  assert.deepEqual(playing, [true, false, false, false, false], 'at rest the front alone');
  for (let t = dt; t < STEP.ms / 1000; t += dt) {
    frame(easeStep(t / (STEP.ms / 1000)));
    if (prox[1] <= 0.3) assert.ok(!playing[1] && atZero[1], 'the incoming holds frame 0 until 0.3');
  }
  frame(1);
  assert.deepEqual(playing, [false, true, false, false, false], 'the outgoing is reset by the end of the step');
  assert.ok(atZero[0]);
  for (let t = 0; t < STEP.cooldownMs / 1000; t += dt) frame(1);
  for (let t = dt; t < STEP.ms / 1000; t += dt) frame(1 + easeStep(t / (STEP.ms / 1000)));
  frame(2);
  assert.deepEqual(playing, [false, false, true, false, false]);
});

test('productYaw: face out at every rest, edge-on at every half step; the scale eases over 0.35 to 0.65; the class scale by whichever of 0.55 of the height and 0.62 of the width bites first', () => {
  for (let i = 0; i < 5; i++) for (const base of [0, 0.3, Math.PI, -1.2]) {
    near(productYaw(i, i, base), base, 1e-12, `rest on ${i}`);
    near(Math.cos(productYaw(i + 0.5, i, 0)), 0, 1e-12, `edge-on after ${i}`);
    near(Math.cos(productYaw(i + 0.5, i + 1, 0)), 0, 1e-12, `edge-on before ${i + 1}`);
    near(productYaw(i + 1, i, base) - productYaw(i, i, base), -Math.PI, 1e-12, 'minus pi a step');
    // the authored rest pose: all of it at rest, none at either half step (the edge-on swap), between in between
    assert.equal(poseWeight(i, i), 1, `the whole pose at rest on ${i}`);
    assert.equal(poseWeight(i + 0.5, i), 0, `no pose at the swap after ${i}`); assert.equal(poseWeight(i - 0.5, i), 0, `no pose at the swap before ${i}`);
    assert.equal(poseWeight(i + 0.7, i), 0, 'none past the half either');
    const w = poseWeight(i + 0.25, i); assert.ok(w > 0 && w < 1, `part of the pose a quarter step out (${w})`); near(w, 0.5, 1e-12, 'the cubic smoothstep\'s half at the quarter');
    assert.ok(poseWeight(i + 0.1, i) > poseWeight(i + 0.2, i), 'falling away from rest');
  }
  // the scale, each product held within 1.3 of its own size: 1 to 2 is a 2 times change, so the outgoing reaches 1.3 at the swap and the incoming starts at 2 / 1.3
  assert.equal(productScale(0, 1, 2), 1); assert.equal(productScale(0.35, 1, 2), 1); near(productScale(0.5, 1, 2, false), 1.3, 1e-12, 'the outgoing at the swap'); near(productScale(0.5, 1, 2), 2 / 1.3, 1e-12, 'the incoming at the swap');
  assert.equal(productScale(0.65, 1, 2), 2); assert.equal(productScale(1, 1, 2), 2);
  assert.ok(productScale(0.45, 1, 2) > 1 && productScale(0.45, 1, 2) < 1.3);
  assert.ok(productScale(0.55, 1, 2) > 2 / 1.3 && productScale(0.55, 1, 2) < 2);
  // a change inside the reach eases the whole way, as before: 1 to 1.2
  near(productScale(0.5, 1, 1.2, false), 1.2, 1e-12); near(productScale(0.5, 1, 1.2), 1, 1e-12); near(productScale(0.65, 1, 1.2), 1.2, 1e-12);
  // the Lenskin (2.2) to the AirPods Max (0.62): never more than 1.3 times the Max's size, never under 2.2 / 1.3 for the Lenskin
  near(productScale(0.5, 2.2, 0.62), 0.62 * 1.3, 1e-12, 'the Max appears at 1.3 times its size, not 3.5'); near(productScale(0.5, 2.2, 0.62, false), 2.2 / 1.3, 1e-12); near(productScale(0.65, 2.2, 0.62), 0.62, 1e-12);
  assert.equal(STEP.scaleFrom, 0.35); assert.equal(STEP.scaleTo, 0.65); assert.equal(STEP.scaleReach, 1.3);
  // the class scale (spec 3): the case 0.1047 x 0.19674 m in a view 2.8215 units tall at its distance
  const [cw, ch] = [0.1047, 0.19674], viewH = 2 * Math.tan((45 * DEG) / 2) * Math.hypot(0.2, 3.4);
  near(viewH, 2.8215, 5e-4);
  for (const [w, h] of [[390, 844], [844, 390], [1280, 800], [768, 1024], [1920, 969]]) {
    const s = productFit(viewH, w / h, cw, ch, CLASS_FILL), hs = (s * ch) / viewH, ws = (s * cw) / (viewH * (w / h));
    assert.ok(hs <= 0.55 + 1e-12 && ws <= 0.62 + 1e-12, `${w} x ${h}: under both lines (${hs.toFixed(3)} of the height, ${ws.toFixed(3)} of the width)`);
    assert.ok(Math.abs(hs - 0.55) < 1e-9 || Math.abs(ws - 0.62) < 1e-9, `${w} x ${h}: one line bites`);
  }
  near((productFit(viewH, 844 / 390, cw, ch, CLASS_FILL) * ch) / viewH, 0.55, 1e-9, 'a landscape phone: the height bites, 1.55 units tall, never 7');
  near((productFit(viewH, 390 / 844, cw, ch, CLASS_FILL) * cw) / (viewH * (390 / 844)), 0.62, 1e-9, 'a portrait phone: the width bites');
});

test('keyLight: the old tint at 0, the new at 1.1 s, half way at 0.55, a smoothstep between', () => {
  const a: [number, number, number] = [1, 0.4, 0.2], b: [number, number, number] = [0.2, 1, 0.8];
  const same = (got: readonly number[], want: readonly number[]) => got.forEach((v, k) => near(v, want[k]));
  same(keyLight(0, a, b), a); same(keyLight(1.1, a, b), b); same(keyLight(5, a, b), b);
  keyLight(0.55, a, b).forEach((v, k) => near(v, (a[k] + b[k]) / 2));
  keyLight(0.275, a, b).forEach((v, k) => near(v, a[k] + (b[k] - a[k]) * smoothstep(0, 1, 0.25)));
  same(keyLight(0, a, b, 300), a); same(keyLight(0.3, a, b, 300), b);
  assert.equal(STEP.keyLightMs, 1100);
});

const TS = Array.from({ length: 41 }, (_, k) => k / 40);
/** the planes' coverage across the step on a class and viewport, its minimum and where it occurs */
const sweep = (cls: LoopClass, w: number, h: number) => { const cov = TS.map((t) => planeCoverage(t, cls, { w, h })); const min = Math.min(...cov); return { cov, min, at: TS[cov.indexOf(min)] }; };

test('plane coverage on the portrait arc at 390 x 844: never under 90 percent across the step (X-1, AC15), the minimum printed', (t) => {
  const { cov, min, at } = sweep('portrait', 390, 844);
  assert.equal(cov[0], 1); assert.equal(cov[40], 1);
  t.diagnostic(`portrait arc 22 at 390 x 844: the minimum coverage is ${min.toFixed(4)} at eased ${at}`);
  cov.forEach((c, k) => assert.ok(c >= 0.9, `${c.toFixed(3)} at eased ${TS[k]} is under the 90 percent line`));
});

test('plane coverage on the wide arc at 1280 x 800: never under 65 percent across the step (the reference rig bottoms near eased 0.68), the minimum printed', (t) => {
  const { cov, min, at } = sweep('wide', 1280, 800);
  assert.equal(cov[0], 1); assert.equal(cov[40], 1);
  t.diagnostic(`wide arc 80 at 1280 x 800: the minimum coverage is ${min.toFixed(4)} at eased ${at}`);
  cov.forEach((c, k) => assert.ok(c >= 0.65, `${c.toFixed(3)} at eased ${TS[k]} is under the 65 percent line`));
  assert.ok(min < 0.72 && at >= 0.6 && at <= 0.75, `the reference rig's floor is about 0.69 near eased 0.68 (measured ${min.toFixed(3)} at ${at})`);
});

test("the fit's two branches at rest: 844 x 390 (the wide set on a landscape phone), 768 x 1024 (portrait) and 1920 x 969 (wide) at least 99.8 percent covered", (t) => {
  for (const [w, h, cls] of [[844, 390, 'wide'], [768, 1024, 'portrait'], [1920, 969, 'wide']] as const) {
    const c = planeCoverage(0, cls, { w, h }, undefined, 192);
    t.diagnostic(`${w} x ${h} (${cls}) at rest: ${c.toFixed(4)} covered`);
    assert.ok(c >= 0.998, `${w} x ${h}: ${c.toFixed(4)}`);
  }
});

test('the failing case: the reference\'s 80 degree arc empties a 390 x 844 frame for part of the step', () => {
  const cov = TS.map((t) => planeCoverage(t, 'portrait', { w: 390, h: 844 }, 80));
  assert.ok(cov.some((c) => c === 0), 'coverage 0 somewhere');
  const empty = cov.filter((c) => c === 0).length / cov.length;
  assert.ok(empty > 0.3 && empty < 0.6, `empty for ${(empty * 100).toFixed(0)} percent of the eased step`);
  assert.ok(planeCoverage(0.5, 'wide', { w: 1280, h: 800 }, 22) > 0.99, 'and 22 on a laptop is whole');
});

test('cloudCover: in on 1 minus (1 minus e) squared; out linear to 0.78 over the first 120 ms of 360, then a smoothstep to 0; 0 with no phase', () => {
  assert.equal(cloudCover('in', 0), 0); assert.equal(cloudCover('in', 0.5), 0.75); assert.equal(cloudCover('in', 1), 1); assert.equal(cloudCover('in', 2), 1);
  assert.equal(cloudCover('out', 0), 1); near(cloudCover('out', 1 / 6), 0.89); near(cloudCover('out', 1 / 3), 0.78); assert.equal(cloudCover('out', 1), 0);
  near(cloudCover('out', 2 / 3), 0.78 * (1 - smoothstep(0, 1, 0.5)));
  for (let e = 0; e < 1; e += 0.02) { assert.ok(cloudCover('out', e + 0.02) <= cloudCover('out', e) + 1e-12, 'out falls'); assert.ok(cloudCover('in', e + 0.02) >= cloudCover('in', e), 'in rises'); }
  assert.equal(cloudCover(null, 0.5), 0);
  assert.deepEqual([STEP.seamInMs, STEP.seamOutMs, STEP.seamKneeMs, STEP.seamKnee], [280, 360, 120, 0.78]);
});

test('video.ts: wholly buffered within half a frame, the policy exclusions, the numbers', () => {
  const r = (...s: [number, number][]) => ({ length: s.length, start: (i: number) => s[i][0], end: (i: number) => s[i][1] });
  assert.equal(wholeBuffered(r([0, 5]), 5), true);
  assert.equal(wholeBuffered(r([0, 4.99]), 5), true);
  assert.equal(wholeBuffered(r([0, 4.9]), 5), false);
  assert.equal(wholeBuffered(r([2.5, 5], [0, 2.5]), 5), true);
  assert.equal(wholeBuffered(r([0, 1], [1.5, 5]), 5), false);
  assert.equal(wholeBuffered(r(), 5), false);
  assert.equal(wholeBuffered(r([0, 5]), NaN), false);
  assert.equal(allowed({}), true);
  assert.equal(allowed({ effectiveType: '4g', deviceMemory: 4 }), true);
  assert.equal(allowed({ effectiveType: '3g' }), true);
  assert.equal(allowed({ saveData: true }), false);
  assert.equal(allowed({ effectiveType: '2g' }), false);
  assert.equal(allowed({ effectiveType: 'slow-2g' }), false);
  assert.equal(allowed({ deviceMemory: 2 }), false);
  assert.equal(allowed({ deviceMemory: 0.5 }), false);
  assert.equal(allowed({ reduced: true }), false);
  assert.deepEqual(VIDEO, { slack: 1 / 48, fetchMs: 20_000, refuseMs: 1500, watchdogMs: 2000, max: 5 });
});

// ---- video.ts through fake elements and a fake page
const quiet = async <T>(fn: () => Promise<T>): Promise<T> => { const warn = console.warn; console.warn = () => {}; try { return await fn(); } finally { console.warn = warn; } };
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
/** what the pool uses of a video element: in once loaded, plays unless told to refuse, pauses silently (the browser's own pauses are dispatched by the test) */
class FakeVideo extends EventTarget {
  muted = false; defaultMuted = false; playsInline = false; disableRemotePlayback = false; loop = false; preload = ''; src = '';
  paused = true; ended = false; seeking = false; currentTime = 0; duration = 5; readyState = 4; videoWidth = 1328; videoHeight = 692;
  buffered = { length: 1, start: () => 0, end: () => 5 };
  plays = 0; reject = false;
  play(): Promise<void> { this.plays++; if (this.reject) return Promise.reject(new Error('NotAllowedError')); this.paused = false; return Promise.resolve(); }
  pause(): void { this.paused = true; }
  load(): void { queueMicrotask(() => this.dispatchEvent(new Event('loadeddata'))); }
  setAttribute(): void {}
  removeAttribute(name: string): void { if (name === 'src') this.src = ''; }
}
function fakePage(n: number) {
  const els = Array.from({ length: n }, () => new FakeVideo()), doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as string }), win = new EventTarget();
  let clock = 1000, watchdog: (() => void) | null = null;
  const host: VideoHost = { doc, win, element: (k) => els[k] as unknown as VideoElement, now: () => clock, every: (_ms, fn) => { watchdog = fn; return () => { watchdog = null; }; } };
  return { els, doc, win, host, advance: (ms: number) => { clock += ms; }, watchdog: () => watchdog?.(), hasWatchdog: () => watchdog !== null };
}

test('the resume rule (spec 4, AC7): a loop the carousel wants plays again on a pause it did not cause, on visibilitychange to visible, on pageshow and by the watchdog; the refusal clock counts visible time from the latest play(); a refused loop is retried on the next input; a reset or paused loop is left alone', async () => quiet(async () => {
  const page = fakePage(2), v = page.els[0];
  const pool = createPool(2, page.host);
  assert.equal(await pool.fetch(0, 'loop-0'), true, 'in once loaded and wholly buffered');
  assert.equal(pool.in(0), true); assert.equal(pool.playing(0), false);
  pool.play(0);
  assert.equal(pool.playing(0), true); assert.equal(v.plays, 1);
  // the browser pauses it (power saving): played again
  v.paused = true; v.dispatchEvent(new Event('pause'));
  assert.equal(pool.playing(0), true); assert.equal(v.plays, 2);
  // hidden for 3 s, paused silently by the browser: played again on return, and the 3 s do not count toward a refusal
  page.doc.visibilityState = 'hidden'; page.doc.dispatchEvent(new Event('visibilitychange'));
  v.paused = true; page.advance(3000);
  page.doc.visibilityState = 'visible'; page.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(pool.playing(0), true); assert.equal(v.plays, 3);
  page.advance(1000); pool.texture(0);
  assert.equal(pool.refused(0), false, 'a second of visible time with no frame is not a refusal');
  assert.equal(pool.resident(0), true, 'the texture is made when first asked');
  v.currentTime = 0.1; pool.texture(0);   // a frame came
  page.advance(5000); pool.texture(0);
  assert.equal(pool.refused(0), false, 'a frame came since the play');
  // pageshow: a paused wanted loop plays again
  v.paused = true; page.win.dispatchEvent(new Event('pageshow'));
  assert.equal(v.plays, 4); assert.equal(pool.playing(0), true);
  // the watchdog
  v.paused = true; page.watchdog();
  assert.equal(v.plays, 5); assert.equal(pool.playing(0), true);
  // 1.5 s of visible time with no new frame since the latest play(): refused, the still stays, the plays stop
  pool.pause(0); assert.equal(pool.playing(0), false);
  pool.play(0); assert.equal(v.plays, 6);
  page.advance(1600); pool.texture(0);
  assert.equal(pool.refused(0), true); assert.equal(pool.in(0), false); assert.equal(pool.playing(0), false);
  page.watchdog(); v.dispatchEvent(new Event('pause'));
  assert.equal(v.plays, 6, 'nothing plays a refused loop');
  // the next input retries it
  page.win.dispatchEvent(new Event('keydown'));
  assert.equal(pool.refused(0), false); assert.equal(pool.in(0), true); assert.equal(pool.playing(0), true); assert.equal(v.plays, 7);
  v.currentTime = 0.2; pool.texture(0);
  // a reset loop is not wanted: no pause, visibility, pageshow or watchdog plays it
  pool.reset(0);
  assert.equal(pool.playing(0), false); assert.equal(v.currentTime, 0);
  v.dispatchEvent(new Event('pause')); page.doc.dispatchEvent(new Event('visibilitychange')); page.win.dispatchEvent(new Event('pageshow')); page.watchdog();
  assert.equal(v.plays, 7);
  // a rejected play() is a refusal at once; unlock clears it
  v.reject = true; pool.play(0); await tick(); pool.texture(0);
  assert.equal(pool.refused(0), true);
  v.reject = false; pool.unlock(); assert.equal(pool.refused(0), false);
  // the texture released and made again
  pool.release(0); assert.equal(pool.resident(0), false); pool.texture(0); assert.equal(pool.resident(0), true);
  // dispose: the listeners and the watchdog go, the element stays unlocked
  assert.equal(page.hasWatchdog(), true);
  pool.dispose();
  assert.equal(page.hasWatchdog(), false); assert.equal(pool.resident(0), false);
  const plays = v.plays; v.paused = true; v.dispatchEvent(new Event('pause')); page.win.dispatchEvent(new Event('pageshow')); page.win.dispatchEvent(new Event('pointerup'));
  assert.equal(v.plays, plays, 'nothing listens after dispose');
  assert.equal(v.src, '', 'the element is unloaded');
}));

test("the refusal under the carousel's per-frame play() (AC7; the build record's section 10): a play() that always rejects marks the element refused within 1.6 s of visible time with play() and texture() called every frame, one play() an attempt; the keydown retry plays it again, once; a play() that resolves with no frame is refused at 1.5 s the same way, and a frame that comes clears the clock", async () => quiet(async () => {
  const page = fakePage(1), v = page.els[0];
  const pool = createPool(1, page.host);
  assert.equal(await pool.fetch(0, 'loop-0'), true);
  // the carousel's gate (carousel.ts update: in and not playing, then play) and the plane's map (texture while in), once a frame at 60 Hz
  const frame = () => { if (pool.in(0) && !pool.playing(0)) pool.play(0); if (pool.in(0)) pool.texture(0); page.advance(1000 / 60); };
  const frames = async (n: number) => { for (let k = 0; k < n; k++) { frame(); await tick(); } };
  // every play() rejects (the e2e's stub, iOS in Low Power Mode): the rejection survives the next frame's play() and is read by texture()
  v.reject = true;
  const t0 = page.host.now();
  let refusedAt = -1;
  for (let k = 0; k < 120 && refusedAt < 0; k++) { frame(); await tick(); if (pool.refused(0)) refusedAt = page.host.now() - t0; }
  assert.ok(refusedAt >= 0 && refusedAt <= 1600, `refused after ${refusedAt} ms of visible time`);
  assert.equal(v.plays, 1, 'one play() for the attempt, not one a frame');
  assert.equal(pool.in(0), false); assert.equal(pool.playing(0), false);
  await frames(60);
  assert.equal(v.plays, 1, 'the frames do not play a refused loop'); assert.equal(pool.refused(0), true);
  // the next input retries it, once (its rejection lands before the next frame, as in the browser: the input is its own task); rejected again, it is refused again by the frames that follow
  page.win.dispatchEvent(new Event('keydown'));
  assert.equal(v.plays, 2, 'the retry plays it again'); assert.equal(pool.refused(0), false); assert.equal(pool.in(0), true);
  await tick();
  await frames(10);
  assert.equal(pool.refused(0), true, 'refused again once the rejection is read'); assert.equal(v.plays, 2, 'one play() for the retry');
  // a play() that resolves but brings no frame: refused at 1.5 s of visible time, the per-frame call restarting nothing
  v.reject = false;
  page.win.dispatchEvent(new Event('pointerup'));
  assert.equal(v.plays, 3); assert.equal(pool.playing(0), true);
  const t1 = page.host.now();
  await frames(60);
  assert.equal(pool.refused(0), false, 'a second of visible time with no frame is not a refusal');
  await frames(40);
  assert.equal(pool.refused(0), true, `refused by ${(page.host.now() - t1).toFixed(0)} ms`); assert.equal(v.plays, 3, 'no play() restarted the clock');
  assert.equal(pool.playing(0), false, 'paused where it was');
  // a frame that comes clears the clock: the loop plays on and is never refused
  page.win.dispatchEvent(new Event('keydown'));
  assert.equal(v.plays, 4); assert.equal(pool.playing(0), true);
  v.currentTime = 0.1; await frames(120);
  assert.equal(pool.refused(0), false); assert.equal(v.plays, 4); assert.equal(pool.playing(0), true);
  pool.dispose();
}));

test("carousel.ts's constants: the exhibit factors, the class scale's lines, the physical finishes, the lights, the parts, the shade, the cloud's tones", () => {
  assert.deepEqual(EXHIBIT, { case: 1, wallet: 1.55, airpods: 1.75, lenskin: 2.2, 'airpods-max': 0.62 });
  assert.deepEqual(CLASS_FILL, { height: 0.55, width: 0.62, centre: null });
  assert.deepEqual(PLACE, { wide: { height: 0.55, width: 0.62, centre: null }, portrait: { height: 0.50, width: 0.62, centre: 0.60 } });
  assert.deepEqual(LINES, { insetMin: 16, insetVw: 0.035, insetMax: 56, column: 520, block: 0.34, gap: 2 });
  assert.deepEqual(FINISH, { matte: { roughness: 0.62, metalness: 0, specularIntensity: 0.2 }, gloss: { roughness: 0.62, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 0.2 }, metallic: { roughness: 0.38, metalness: 1 } });
  // the intensities as the product check set them (AC2, 2026-10-23): the spec's 1.6, 0.575 and 0.2 scaled by 0.83, the metallic finish's environment at 1.0 on the wide class and 0.6 on the portrait class
  assert.deepEqual(LIGHTS, { key: 1.33, keyMix: 0.6, keyFrom: [0.1, 0.8, 0.6], fill: 0.17, fillTint: '#dfe6ea', fillFrom: [-0.6, 0.2, 0.8], env: 0.48, metalEnv: 1.0, metalEnvPortrait: 0.6, blur: 0.04 });
  // the metallic finish mirrors the environment's bright ceiling from the raised portrait placement, so its environment is lower there (product-check.mjs at 390 x 844: 96 percent of the Lenskin's face at 255 at 1.0, 2.2 percent at 0.6)
  assert.ok(LIGHTS.metalEnvPortrait < LIGHTS.metalEnv);
  for (const k of ['key', 'env', 'fill'] as const) near(LIGHTS[k] / { key: 1.6, env: 0.575, fill: 0.2 }[k], 0.83, 0.03, `${k}: the spec's balance kept (within 0.03 of 0.83)`);
  assert.deepEqual(PARTS, { trim: [0.073, 0.077, 0.077], trimRoughness: 0.55, logoTint: 0.8468, device: [0.80, 0.80, 0.79], deviceRoughness: 0.22, deviceDark: [0.02, 0.02, 0.022], deviceDarkRoughness: 0.5 }, "render-products.py's trim, logo and device numbers");
  // the roles: the AirPods case's "trim" part is its Skreed S (the logo), every other product's trim is trim, device and device-dark are the device a case holds, the rest the body
  assert.equal(partRole('airpods', 'trim'), 'logo'); assert.equal(partRole('wallet', 'trim'), 'trim'); assert.equal(partRole('case', 'logo'), 'logo');
  assert.equal(partRole('airpods-max', 'device'), 'device'); assert.equal(partRole('airpods-max', 'device-dark'), 'device-dark'); assert.equal(partRole('airpods-max', 'shell'), 'body'); assert.equal(partRole('airpods', 'lid'), 'body');
  assert.deepEqual(SHADE, { dark: 0.45, solid: 0.45, height: 0.72 }, 'the bottom shade as the contrast check set it (AC12, 2026-10-23)');
  assert.deepEqual(CLOUD.shadow, [0.80, 0.84, 0.93]);
  CLOUD.light.forEach((v, k) => near(v, [0xf7, 0xf6, 0xf3][k] / 255), 'Pearl Whisper');
  assert.equal(CLOUD.dpr, 1.5);
});

// ---- carousel.ts through a stub renderer (no GL) and a fake loop pool
/** a renderer that draws nothing and keeps the stage it was asked to draw, so the test can read the product in front */
function stubRenderer() {
  let stage: Scene | null = null;
  const draws = { stage: 0, cloud: 0 };   // the stage holds the planes, the holder and the lights; the cloud's scene its one triangle
  const renderer = { toneMapping: 1, autoClear: true, getClearColor: (c: Color) => c.set(0), getClearAlpha: () => 1, setRenderTarget() {}, setClearColor() {}, clear() {}, render(s: Scene) { if (s.children.length > 3) { stage = s; draws.stage++; } else draws.cloud++; }, compileAsync: () => Promise.reject(new Error('no GL under node')) } as unknown as WebGLRenderer;
  const holder = () => (stage as Scene | null)?.children.find((o: Object3D) => o instanceof Group && Math.abs(o.position.z - STEP.productZ) < 1e-9) as Group | undefined;
  return { renderer, shown: () => holder()?.children.find((g) => g.visible) ?? null, draws };
}
const geometry = () => { const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(new Float32Array(9), 3)); g.setAttribute('normal', new BufferAttribute(new Float32Array(9), 3)); g.setIndex(new BufferAttribute(new Uint16Array([0, 1, 2]), 1)); return g; };
const products = () => (['wallet', 'airpods', 'lenskin', 'case', 'airpods-max'] as const).map((name) => ({ name, size: name === 'case' ? [0.1047, 0.19674, 0.02656] as [number, number, number] : name === 'airpods-max' ? [0.17436, 0.1873, 0.07992] as [number, number, number] : [0.07, 0.09, 0.005] as [number, number, number], parts: name === 'airpods-max' ? [{ name: 'shell', geometry: geometry() }, { name: 'logo', geometry: geometry() }, { name: 'device', geometry: geometry() }, { name: 'device-dark', geometry: geometry() }] : [{ name: 'shell', geometry: geometry() }, { name: 'trim', geometry: geometry() }, { name: 'logo', geometry: geometry() }] }));
function fakePool(n: number) {
  const st = Array.from({ length: n }, () => ({ playing: false, plays: 0, resets: 0, pauses: 0, tex: null as Texture | null, made: 0 }));
  const pool: VideoPool = { n, unlock() {}, fetch: async () => true, in: () => true, refused: () => false, aspect: () => LOOP_ASPECT.wide, size: () => [1328, 692], texture(i) { if (!st[i].tex) { st[i].tex = new Texture(); st[i].made++; } return st[i].tex as never; }, release(i) { st[i].tex = null; }, resident: (i) => st[i].tex !== null, playing: (i) => st[i].playing, play(i) { st[i].playing = true; st[i].plays++; }, pause(i) { if (st[i].playing) st[i].pauses++; st[i].playing = false; }, reset(i) { if (st[i].playing) st[i].resets++; st[i].playing = false; }, dispose() {} };
  return { pool, st, resident: () => st.filter((s) => s.tex !== null).length };
}
const sceneDefs = (still: (i: number) => Promise<Texture | null>, baseYaw = 0, basePitch = 0): SceneDef[] => (['cove', 'grove', 'ember', 'palace', 'dawn'] as const).map((id, i) => ({ id, keyLight: ['#ffa6c8', '#a8ffe0', '#ffa171', '#ffc9a3', '#cbb0ff'][i], baseYaw, basePitch, product: ['case', 'airpods', 'wallet', 'lenskin', 'case'][i], shade: ['#c988c8', '#96a880', '#c6a884', '#efa3af', '#d7b9ed'][i], finish: (['matte', 'gloss', 'matte', 'metallic', 'matte'] as const)[i], still: () => still(i), loop: i }));

test('the look (X-14 as amended, E-S4-hover) and the rest pose: at rest the authored yaw and pitch; the look adds 0.3 rad of each, eased by a tenth a frame at 60 Hz (1 minus 0.9 to the power of 60 dt), and returns the same way once inactive; across a step the pose is gone at the edge-on swap; every part is drawn on both sides (the AirPods lid)', async () => quiet(async () => {
  const rig = stubRenderer();
  const c = createCarousel({ renderer: rig.renderer, scenes: sceneDefs(async () => new Texture(), 0.3, 0.2), products: products(), video: fakePool(5).pool, cls: 'wide', reduced: false, tune: () => TUNE, dpr: 1 });
  c.setScene(1, true); await tick();
  let t = 0; const dt = 1 / 60; const frame = () => { t += dt; c.update(t, dt, 1280, 800); };
  frame();
  const g = rig.shown()!;
  near(g.rotation.x, 0.2, 1e-9, 'at rest: the pitch'); near(g.rotation.y, 0.3, 1e-9, 'at rest: the yaw');
  for (const m of g.children) assert.equal(((m as Mesh).material as MeshPhysicalMaterial).side, DoubleSide, `${m.name || 'part'} drawn on both sides`);
  c.look(1, 1, true); frame();
  near(g.rotation.y, 0.3 + 0.3 * 0.1, 1e-9, 'a tenth of the way after one frame (w = 1 - 0.9)'); near(g.rotation.x, 0.2 + 0.3 * 0.1, 1e-9, 'the pitch too, y down adds pitch');
  for (let k = 0; k < 200; k++) frame();
  near(g.rotation.y, 0.6, 1e-4, 'settled at the yaw plus 0.3 rad'); near(g.rotation.x, 0.5, 1e-4, 'settled at the pitch plus 0.3 rad');
  c.look(-1, 0, true); for (let k = 0; k < 200; k++) frame();
  near(g.rotation.y, 0.0, 1e-4, 'the other way'); near(g.rotation.x, 0.2, 1e-4, 'the pitch back at rest');
  c.look(0, 0, false); for (let k = 0; k < 200; k++) frame();
  near(g.rotation.y, 0.3, 1e-4, 'inactive: back to rest');
  // a step: the pose fades out by the swap (poseWeight) and comes back by the end
  assert.equal(c.requestStep(1), true);
  let minPitch = 1, before = rig.shown();
  while (c.busy()) { frame(); const s = rig.shown()!; if (s === before) minPitch = Math.min(minPitch, Math.abs(s.rotation.x)); }
  assert.ok(minPitch < 5e-3, `the outgoing product's pitch is gone by the swap, within the last frame before it (min ${minPitch.toFixed(4)} rad)`);
  near(rig.shown()!.rotation.x, 0.2, 1e-9, 'the incoming product at rest carries the whole pose'); near(rig.shown()!.rotation.y, 0.3, 1e-9, 'and the yaw');
  c.dispose();
}));

test('the step through the carousel: one gesture one whole step, the front switch at 285 ms, the swap at the half, the cooldown, at most two loops playing; over a lap at most two loop textures resident and one at rest; the cloud only during a seam, and the stage not drawn under full cover', async () => quiet(async () => {
  const { pool, st, resident } = fakePool(5), { renderer, draws } = stubRenderer();
  const c = createCarousel({ renderer, scenes: sceneDefs(async () => new Texture()), products: products(), video: pool, cls: 'wide', reduced: false, tune: () => TUNE, dpr: 1 });
  c.setScene(0, true); await tick();
  const dt = 1 / 60; let t = 0;
  const frame = () => { t += dt; c.update(t, dt, 1280, 800); assert.ok(st.filter((s) => s.playing).length <= 2, 'at most two playing'); assert.ok(resident() <= 2, `${resident()} loop textures resident`); };
  frame();
  assert.equal(c.scene(), 0); assert.equal(c.step(), 0); assert.equal(c.busy(), false);
  assert.deepEqual(st.map((s) => s.playing), [true, false, false, false, false], 'at rest the front loop alone');
  assert.equal(resident(), 1, 'at rest the front loop\'s texture alone');
  assert.equal(c.requestStep(-1), false, 'past the edge');
  assert.equal(c.requestStep(1), true);
  const t0 = t;
  assert.equal(c.requestStep(1), false, 'swallowed during the step');
  assert.equal(c.busy(), true);
  let frontAt = -1, done = -1, lastStep = 0;
  while (t - t0 < 2) {
    frame();
    if (frontAt < 0 && c.front() === 1) frontAt = t - t0;
    if (done < 0 && c.scene() === 1) done = t - t0;
    assert.ok(c.step() >= lastStep - 1e-12, 'the step never goes back'); lastStep = c.step();
    if (done >= 0 && !c.busy()) break;
  }
  near(frontAt, 0.285, dt + 1e-9, `the front switch at ${(frontAt * 1000).toFixed(0)} ms`);
  near(done, 0.77, dt + 1e-9, `the step done at ${(done * 1000).toFixed(0)} ms`);
  near(t - t0 - done, 0.15, dt + 1e-9, `busy for the cooldown`);
  assert.equal(c.step(), 1);
  assert.deepEqual(st.map((s) => s.playing), [false, true, false, false, false], 'the outgoing loop reset, the incoming playing');
  assert.equal(st[0].resets, 1);
  assert.equal(resident(), 1, 'the outgoing loop\'s texture released with its plane parked');
  assert.deepEqual(st.map((s) => s.tex !== null), [false, true, false, false, false]);
  const atRest = c.memory();
  assert.ok(atRest > 1328 * 692 * 4, 'memory counts the resident texture');
  // the rest of the lap: 1 to 4, each step the same
  for (let to = 2; to <= 4; to++) {
    assert.equal(c.requestStep(1), true);
    while (c.busy()) frame();
    assert.equal(c.scene(), to); assert.equal(c.front(), to);
    assert.deepEqual(st.map((s) => s.playing), st.map((_, k) => k === to));
    assert.equal(resident(), 1, `one texture at rest on ${to}`);
    assert.ok(st[to].tex !== null, 'the front\'s');
  }
  assert.equal(c.requestStep(1), false, 'past the far edge');
  assert.equal(st[1].made, 1, 'a texture is made once per visit of its plane');
  assert.ok(c.memory() > 0);
  assert.equal(c.cloud, null);
  // the seams: the cloud drawn only while one runs; under full cover (the wrap's hold, the ends of a cover-in and a cover-out) the stage is not drawn and its target keeps the last frame
  const before = { ...draws };
  c.seam('in', 0.5); frame(); assert.ok(c.cloud !== null, 'the cloud only during a seam');
  assert.deepEqual({ stage: draws.stage - before.stage, cloud: draws.cloud - before.cloud }, { stage: 1, cloud: 1 }, 'half cover: the stage and the cloud');
  c.seam('in', 1); frame(); frame(); c.seam('out', 0); frame();
  assert.deepEqual({ stage: draws.stage - before.stage, cloud: draws.cloud - before.cloud }, { stage: 1, cloud: 4 }, 'full cover: the cloud alone');
  assert.ok(c.cloud !== null);
  c.seam('out', 0.5); frame();
  assert.deepEqual({ stage: draws.stage - before.stage, cloud: draws.cloud - before.cloud }, { stage: 2, cloud: 5 }, 'the cover thinning: the stage again');
  c.seam(null, 0); frame(); assert.equal(c.cloud, null);
  assert.deepEqual({ stage: draws.stage - before.stage, cloud: draws.cloud - before.cloud }, { stage: 3, cloud: 5 }, 'no seam: the stage alone');
  c.dispose();
  assert.equal(resident(), 0, 'dispose releases every loop texture');
}));

test('the step waits on the next scene\'s still (spec 5, "Loading"): refused while it loads, allowed once it has settled, even to nothing', async () => quiet(async () => {
  const waits = new Map<number, () => void>();
  const c = createCarousel({ renderer: stubRenderer().renderer, scenes: sceneDefs((i) => new Promise((r) => waits.set(i, () => r(i === 1 ? null : new Texture())))), products: products(), video: null, cls: 'portrait', reduced: false, tune: () => TUNE, dpr: 2 });
  c.setScene(0, true); c.update(0.016, 0.016, 390, 844); await tick();
  assert.equal(c.requestStep(1), false, 'scene 2\'s still is still loading');
  waits.get(1)!(); await tick();
  assert.equal(c.requestStep(1), true, 'settled, to no still');
  c.dispose();
}));

test('the class scale and the place on both shapes (D3): by the stage\'s shape whatever the loop class, so a visit that started portrait and turned to 844 x 390 keeps the case in the frame; the holder raised on a portrait stage, moved right on a wide one only as far as the lines\' column needs', async () => quiet(async () => {
  const [cw, ch] = [0.1047, 0.19674];
  const sizes = products().map((p) => { const e = EXHIBIT[p.name]; return [p.size[0] * e, p.size[1] * e, p.size[2] * e] as const; });
  for (const [w, h, cls, dpr] of [[844, 390, 'portrait', 1], [390, 844, 'wide', 1], [1280, 800, 'wide', 1], [390, 844, 'portrait', 1], [780, 1688, 'portrait', 2], [1920, 1200, 'wide', 1.5]] as const) {
    const rig = stubRenderer();
    const c = createCarousel({ renderer: rig.renderer, scenes: sceneDefs(async () => new Texture()), products: products(), video: null, cls, reduced: false, tune: () => TUNE, dpr });
    c.setScene(0, true); await tick(); c.update(0.016, 0.016, w, h);
    const g = rig.shown();
    assert.ok(g, 'the case is in front');
    const want = productPlacement(w / dpr, h / dpr, cw, ch, sizes), p = c.place();
    near(g!.scale.x, want.scale, 1e-9, `${w} x ${h} (${cls} class): the class scale`);
    near(g!.parent!.position.x, want.x, 1e-9, `${w} x ${h}: the holder's x`); near(g!.parent!.position.y, want.y, 1e-9, `${w} x ${h}: the holder's y`);
    assert.equal(p.cls, h > w ? 'portrait' : 'wide', 'the class is the stage\'s shape');
    near(p.scale, want.scale, 1e-9); assert.ok(p.box && p.box.x1 > p.box.x0 && p.box.y1 > p.box.y0, 'the shown product\'s box');
    if (h > w) assert.ok(want.y > 0 && want.x === 0, `${w} x ${h}: raised, centred`); else assert.ok(want.y === 0 && want.x >= 0, `${w} x ${h}: the centre kept, the holder never left of it`);
    c.dispose();
  }
}));

test('D3: at rest every scene\'s product clears the lines\' box (the bottom 34 percent of the stage, the column at the gutter and at most 520 px wide) at 390 x 844 and 1280 x 800: zero overlap, the boxes printed; the stylesheets carry the column\'s numbers', (t) => {
  const bin = JSON.parse(readFileSync(new URL('../../src/data/room-products-bin.json', import.meta.url), 'utf8')) as { products: Record<string, { sizeMm: [number, number, number] }> };
  const sizeOf = (name: string): readonly [number, number, number] => { const e = EXHIBIT[name], m = bin.products[name].sizeMm; return [(m[0] / 1000) * e, (m[1] / 1000) * e, (m[2] / 1000) * e]; };
  const caseM = bin.products.case.sizeMm.map((v) => v / 1000);
  const order = ['case', 'airpods', 'wallet', 'lenskin', 'airpods-max'];
  const sizes = ['wallet', 'airpods', 'lenskin', 'case', 'airpods-max'].map(sizeOf);
  for (const [w, h] of [[390, 844], [1280, 800]] as const) {
    const p = productPlacement(w, h, caseM[0], caseM[1], sizes), lines = linesBox(w, h);
    const px = (b: { x0: number; y0: number; x1: number; y1: number }) => `x ${Math.round(b.x0 * w)} to ${Math.round(b.x1 * w)}, y ${Math.round(b.y0 * h)} to ${Math.round(b.y1 * h)}`;
    t.diagnostic(`${w} x ${h} (${p.cls}): the holder at x ${p.x.toFixed(3)}, y ${p.y.toFixed(3)}, scale ${p.scale.toFixed(3)}; the lines' box ${px(lines)}`);
    for (const [i, name] of order.entries()) {
      const box = productScreenBox(p, sizeOf(name), w, h), over = boxOverlap(box, lines, w, h);
      t.diagnostic(`  scene ${i + 1} ${name}: ${px(box)} (${((box.y1 - box.y0) * 100).toFixed(1)} percent of the height), overlap ${over.toFixed(1)} px squared`);
      assert.equal(over, 0, `${w} x ${h}: scene ${i + 1}'s ${name} crosses the lines' box`);
    }
    // the case's height against its cap (the near face projects a little larger than the centre's depth), the widest product inside the stage
    const caseBox = productScreenBox(p, sizeOf('case'), w, h);
    assert.ok(caseBox.y1 - caseBox.y0 <= PLACE[p.cls].height * 1.04 && caseBox.y1 - caseBox.y0 >= PLACE[p.cls].height * 0.97, `${w} x ${h}: the case at its cap (${(caseBox.y1 - caseBox.y0).toFixed(3)})`);
    for (const name of order) { const b = productScreenBox(p, sizeOf(name), w, h); assert.ok(b.x0 >= 0 && b.x1 <= 1 && b.y0 >= 0 && b.y1 <= 1, `${w} x ${h}: ${name} inside the stage`); }
  }
  // the portrait centre: the case's centre projects to 0.60 of the view's height from the bottom; the wide centre is the ring's own
  const pp = productPlacement(390, 844, caseM[0], caseM[1], sizes), v = toView(0, pp.y, STEP.productZ);
  near((v.vy / (v.depth * Math.tan((45 * DEG) / 2)) + 1) / 2, 0.60, 1e-9, 'the raised centre');
  assert.equal(productPlacement(1280, 800, caseM[0], caseM[1], sizes).y, 0);
  // the gutter and the column as the stylesheets have them
  assert.equal(insetPx(390), 16); near(insetPx(1280), 44.8); assert.equal(insetPx(2000), 56);
  const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8'), css = readFileSync(new URL('../../src/styles/room.css', import.meta.url), 'utf8');
  assert.match(tokens, /--inset: clamp\(16px, 3\.5vw, 56px\);/);
  assert.match(css, /\.rm-scene\.is-on \.rm-scene-text \{[^}]*left: var\(--inset\); bottom: var\(--rm-bottom\); width: calc\(100% - 2 \* var\(--inset\)\); max-width: 520px;/);
  const l390 = linesBox(390, 844);
  near(l390.x0, 16 / 390); near(l390.x1, 374 / 390); near(l390.y0, 0.66); assert.equal(l390.y1, 1);
  near(linesBox(1280, 800).x1, 564.8 / 1280);
});

test('the reduced path: a step is a 300 ms cut with a cross-fade, the front switches at once, the product is swapped at once and faces out on every frame (its base yaw, no half turn), no look', async () => quiet(async () => {
  const rig = stubRenderer();
  const c = createCarousel({ renderer: rig.renderer, scenes: sceneDefs(async () => new Texture(), 0.3), products: products(), video: fakePool(5).pool, cls: 'wide', reduced: true, tune: () => TUNE, dpr: 1 });
  c.setScene(4, true); await tick();
  let t = 0; const dt = 1 / 60; const frame = () => { t += dt; c.update(t, dt, 1280, 800); };
  frame();
  near(rig.shown()!.rotation.y, 0.3, 1e-9, 'at rest: the base yaw');
  assert.equal(c.scene(), 4); assert.equal(c.requestStep(1), false, 'past the edge');
  assert.equal(c.requestStep(-1), true);
  const t0 = t, before = rig.shown();
  frame();
  assert.equal(c.front(), 3, 'the key light set at once');
  assert.equal(c.step(), 3, 'the step at its end from the start');
  assert.notEqual(rig.shown(), before, 'the product swapped at once');
  while (c.scene() !== 3 && t - t0 < 1) { frame(); near(rig.shown()!.rotation.y, 0.3, 1e-9, `faces out at ${((t - t0) * 1000).toFixed(0)} ms of the cut`); }
  near(t - t0, 0.3, dt + 1e-9, `the cut done at ${((t - t0) * 1000).toFixed(0)} ms`);
  c.look(1, 1, true); frame();
  near(rig.shown()!.rotation.y, 0.3, 1e-9, 'no look');
  assert.equal(c.step(), 3);
  c.dispose();
}));

test('motion(false) (the "Pause motion" control): every loop paused where it is and none played while off; steps still work; motion(true) resumes by proximity', async () => quiet(async () => {
  const { pool, st } = fakePool(5);
  const c = createCarousel({ renderer: stubRenderer().renderer, scenes: sceneDefs(async () => new Texture()), products: products(), video: pool, cls: 'wide', reduced: false, tune: () => TUNE, dpr: 1 });
  c.setScene(1, true); await tick();
  let t = 0; const dt = 1 / 60; const frame = () => { t += dt; c.update(t, dt, 1280, 800); };
  frame();
  assert.deepEqual(st.map((s) => s.playing), [false, true, false, false, false]);
  c.motion(false);
  assert.equal(st[1].pauses, 1); assert.deepEqual(st.map((s) => s.playing), [false, false, false, false, false]);
  const plays = st.map((s) => s.plays);
  assert.equal(c.requestStep(1), true);
  while (c.busy()) frame();
  assert.equal(c.scene(), 2, 'the step ran');
  assert.deepEqual(st.map((s) => s.plays), plays, 'nothing played while off');
  c.motion(true); frame();
  assert.deepEqual(st.map((s) => s.playing), [false, false, true, false, false], 'the front loop plays again');
  c.dispose();
}));

test('products arriving late (a wrap-first visit, spec 5 "Loading" phase 5): no product until setProducts, then the scene\'s product in front at the class scale', async () => quiet(async () => {
  const rig = stubRenderer();
  const c = createCarousel({ renderer: rig.renderer, scenes: sceneDefs(async () => new Texture()), video: null, cls: 'wide', reduced: false, tune: () => TUNE, dpr: 1 });
  c.setScene(4, true); await tick(); c.update(0.016, 0.016, 1280, 800);
  assert.equal(rig.shown(), null, 'nothing in front');
  assert.equal(c.requestStep(-1), true, 'the carousel never blocks on the products');
  c.setProducts(products()); c.update(0.032, 0.016, 1280, 800);
  const g = rig.shown();
  assert.ok(g, 'the product is in front');
  assert.equal(g!.children.length, 3, 'its three parts');
  assert.ok(g!.scale.x > 1, 'at the class scale');
  c.dispose();
}));

test('the three modules import three, RoomEnvironment and products-bin.ts alone, no loader, nothing outside section4; video.ts alone spells .mp4', () => {
  const dir = new URL('../../src/scripts/hero/section4/', import.meta.url);
  const own = new Set(['./carousel-math.ts', './video.ts', './products-bin.ts']);
  for (const f of ['carousel.ts', 'carousel-math.ts', 'video.ts']) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    const from = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
    assert.ok(from.length > 0 || f === 'carousel-math.ts', `${f}: its imports are read`);
    for (const m of from) assert.ok(m === 'three' || m === 'three/addons/environments/RoomEnvironment.js' || own.has(m), `${f} imports ${m}`);
    assert.doesNotMatch(src, /loaders\/|\?url'|import\.meta\.glob|from '\.\.\//, `${f}: no loader, no asset, no file outside section4`);
    assert.equal(/\.mp4/.test(src), f === 'video.ts', `${f}: the loops' format`);
    assert.doesNotMatch(src, new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`), `${f}: no en or em dash`);
  }
  assert.doesNotMatch(readFileSync(new URL('carousel-math.ts', dir), 'utf8'), /^import /m, 'carousel-math.ts imports nothing');
});

test('frameSource (X-15): a seam keeps the frame it began over, so the exit\'s cover-in from scene 5 and the wrap\'s hold, cover-out and lock carry the carousel and a seam over the hall carries the hall; the entry and the way back are their own; the director draws by it', () => {
  assert.equal(frameSource('hall', 'hall'), 'hall');
  assert.equal(frameSource('world', 'world'), 'scenes');
  assert.equal(frameSource('seam', 'world'), 'scenes', 'the exit\'s cover-in from scene 5; the wrap once it has landed');
  assert.equal(frameSource('seam', 'hall'), 'hall', 'the exit from the hall; the wrap before it lands (the hero under the cloud)');
  assert.equal(frameSource('entering', 'hall'), 'entering');
  assert.equal(frameSource('back', 'world'), 'back');
  const director = readFileSync(new URL('../../src/scripts/hero/section4/director.ts', import.meta.url), 'utf8');
  assert.match(director, /const source = frameSource\(state, under\), drawHall = source === 'hall'/, 'the director picks its branch by it');
  assert.doesNotMatch(director, /the hall again after the reset/, 'the branch that showed the hall\'s stale frame under a seam over the scenes is gone');
  assert.match(director, /const wipeIn = source === 'scenes' \? 1 :/, 'the third wipe never plays over the scenes (a wrap before the hall is in)');
  assert.match(director, /seamDraws\.add\(source\)/, 'hooks builds record the frame sources seen during a cover-in (tests/e2e/room.spec.ts reads __s4.state().seamDraws)');
});
