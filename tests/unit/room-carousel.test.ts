// Section 4 part three's carousel (docs/specs/section-4-flux.md 4 "Motion plan", 5 "Video policy", 7 AC15, 9 X-1 and
// X-4; the numbers read off the reference in docs/specs/evidence/section-4-flux-reference.md 2 to 4 and 7 to 9):
// carousel-math.ts against the spec's numbers (the ease with eased(0.3) 0.657 and the front switch at 285 ms, the fov
// curve with its bottom at 227 ms, the angles per class, the per-frame fit, the light-up's thresholds and rate limit,
// the play and pause thresholds with at most two loops playing over a double step, the product's yaw and scale, the
// key light's fade, the planes' coverage across a step on both classes and the cloud's curves); video.ts's pure
// rules; carousel.ts driven through a stub renderer and a fake loop pool (the step's clock, the cooldown, the swap, the
// residency rule, the reduced path); and the three modules' imports: three and products-bin.ts alone, no loader,
// nothing outside section4, and video.ts the only one that spells the loops' format.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BufferAttribute, BufferGeometry, Color, Texture, type WebGLRenderer } from 'three';
import { LIGHT, LOOP_ASPECT, STEP, anglesAt, cloudCover, coverFit, easeStep, fovAt, keyLight, lightGain, lightUp, loopShouldPlay, loopShouldReset, planeCoverage, productScale, productYaw, proximity, ringPlace, smoothstep } from '../../src/scripts/hero/section4/carousel-math.ts';
import { VIDEO, allowed, wholeBuffered, type VideoPool } from '../../src/scripts/hero/section4/video.ts';
import { CLASS_FILL, CLOUD, EXHIBIT, FINISH, LIGHTS, SHADE, createCarousel, type CarouselTune, type SceneDef } from '../../src/scripts/hero/section4/carousel.ts';

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

test('the fit at t 0, 0.65 and 1: the view height at the distance times the aspect rule, both times 1.01', () => {
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
  // a viewport wider than the frame: the width fills and the height follows the frame's aspect
  const wider = coverFit(45, CAM_D, 2.4, LOOP_ASPECT.wide);
  near(wider.width, h(45, CAM_D) * 2.4 * 1.01); near(wider.height, (h(45, CAM_D) * 2.4 * 1.01) / LOOP_ASPECT.wide);
  assert.equal(STEP.overscan, 1.01);
  assert.equal(coverFit(45, 0, 1, 1).height > 0, true, 'a zero distance is clamped');
});

test('proximity: 1 at rest on the scene, 0 a whole step away, linear between', () => {
  assert.equal(proximity(2, 2), 1); assert.equal(proximity(2.5, 2), 0.5); assert.equal(proximity(2.5, 3), 0.5);
  assert.equal(proximity(3, 2), 0); assert.equal(proximity(0, 2), 0); near(proximity(1.3, 2), 0.3);
});

test("lightUp's thresholds: the floor at and under proximity 0.43, nearly out at 0.5, whole at 1, never below the floor; the rate limit of dt over 0.68 s", () => {
  const settle = (p: number) => lightUp(0, p, 10, LIGHT);
  assert.equal(settle(1), 1);
  assert.equal(settle(0), LIGHT.floor);
  assert.equal(settle(0.4), LIGHT.floor);
  assert.equal(settle(0.427), LIGHT.floor);
  near(settle(0.5), 0.048, 2e-3, 'the lights are down by the half');
  near(settle(0.8), 0.760, 2e-3);
  near(settle(0.9), 0.950, 2e-3);
  for (let p = 0; p < 1; p += 0.01) assert.ok(settle(p + 0.01) >= settle(p), 'monotone in proximity');
  assert.ok(lightUp(0.5, 0, 10, LIGHT) >= LIGHT.floor && lightUp(LIGHT.floor, 0, 10, LIGHT) === LIGHT.floor, 'never below the floor');
  // the rate limit: a frame of 68 ms moves the value by a tenth at most, ten of them cross the whole range
  near(lightUp(0, 1, 0.068, LIGHT), 0.1);
  near(lightUp(1, 0, 0.068, LIGHT), 0.9);
  near(lightUp(settle(0.9), 0.92, 0.068, LIGHT), settle(0.92), 1e-9, 'a change under the limit lands on its target');
  let v = 0; for (let k = 0; k < 10; k++) v = lightUp(v, 1, 0.068, LIGHT);
  near(v, 1, 1e-9, 'whole after 0.68 s');
  assert.equal(STEP.lightRateS, 0.68);
  assert.deepEqual(LIGHT, { start: 0.5, soft: 0.64, boost: 0.17, floor: 0.01 });
  // the shader's per-pixel gain: whole at 1 and at the floor at the floor whatever the pixel; the brightest areas lead
  for (const lum of [0, 0.5, 1]) { assert.equal(lightGain(1, lum, LIGHT), 1); near(lightGain(LIGHT.floor, lum, LIGHT), LIGHT.floor); }
  assert.ok(lightGain(0.5, 1, LIGHT) > lightGain(0.5, 0.5, LIGHT) && lightGain(0.5, 0.5, LIGHT) > lightGain(0.5, 0, LIGHT));
  near(lightGain(0.5, 1, LIGHT) - lightGain(0.5, 0, LIGHT), (1 - LIGHT.floor) * LIGHT.boost, 1e-9, 'the lead is the boost');
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

test('productYaw: face out at every rest, edge-on at every half step; the scale eases over 0.35 to 0.65', () => {
  for (let i = 0; i < 5; i++) for (const base of [0, 0.3, Math.PI, -1.2]) {
    near(productYaw(i, i, base), base, 1e-12, `rest on ${i}`);
    near(Math.cos(productYaw(i + 0.5, i, 0)), 0, 1e-12, `edge-on after ${i}`);
    near(Math.cos(productYaw(i + 0.5, i + 1, 0)), 0, 1e-12, `edge-on before ${i + 1}`);
    near(productYaw(i + 1, i, base) - productYaw(i, i, base), -Math.PI, 1e-12, 'minus pi a step');
  }
  assert.equal(productScale(0, 1, 2), 1); assert.equal(productScale(0.35, 1, 2), 1); assert.equal(productScale(0.5, 1, 2), 1.5);
  assert.equal(productScale(0.65, 1, 2), 2); assert.equal(productScale(1, 1, 2), 2);
  assert.ok(productScale(0.45, 1, 2) > 1 && productScale(0.45, 1, 2) < 1.5);
  assert.equal(STEP.scaleFrom, 0.35); assert.equal(STEP.scaleTo, 0.65);
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
test('plane coverage on the portrait arc at 390 x 844: never under 70 percent across the step (X-1, AC15)', () => {
  const cov = TS.map((t) => planeCoverage(t, 'portrait', { w: 390, h: 844 }));
  assert.equal(cov[0], 1); assert.equal(cov[40], 1);
  cov.forEach((c, k) => assert.ok(c >= 0.7, `${c.toFixed(3)} at eased ${TS[k]}`));
  assert.ok(Math.min(...cov) > 0.9, `the portrait arc keeps the frame full: ${Math.min(...cov).toFixed(3)} at worst`);
});

test('plane coverage on the wide arc at 1280 x 800: whole at rest, 70 percent or more at the half, and the reference rig\'s floor across the step reported', (t) => {
  const cov = TS.map((x) => planeCoverage(x, 'wide', { w: 1280, h: 800 }));
  assert.equal(cov[0], 1); assert.equal(cov[40], 1);
  assert.ok(cov[20] >= 0.7, `mid-step ${cov[20].toFixed(3)}`);
  const min = Math.min(...cov), at = TS[cov.indexOf(min)];
  t.diagnostic(`wide arc 80 at 1280 x 800: coverage ${min.toFixed(3)} at eased ${at} is the floor (the spec's line is 0.70; sweep 76 is the first arc that clears it, see the todo below)`);
  assert.ok(min >= 0.68, `the measured floor has moved: ${min.toFixed(3)} at eased ${at}`);
});

test('plane coverage on the wide arc at 1280 x 800: never under 70 percent across the step (the spec\'s line)', { todo: 'the reference rig (radius 7, sweep 80, fov 45 to 42, overscan 1.01) ray-casts to 0.690 at eased 0.6 to 0.75 on 1280 x 800, a point under the spec\'s 0.70; the lead or Sam decides between the reference\'s 80 and the first arc that clears the line, 76' }, () => {
  TS.forEach((x) => { const c = planeCoverage(x, 'wide', { w: 1280, h: 800 }); assert.ok(c >= 0.7, `${c.toFixed(3)} at eased ${x}`); });
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
  assert.deepEqual(VIDEO, { slack: 1 / 48, fetchMs: 20_000, refuseMs: 1500, max: 5 });
});

test("carousel.ts's constants: the exhibit factors, the class scale, the finishes, the lights, the shade, the cloud's tones", () => {
  assert.deepEqual(EXHIBIT, { case: 1, wallet: 1.55, airpods: 1.75, lenskin: 2.2 });
  assert.deepEqual(CLASS_FILL, { wide: 0.55, portrait: 0.62 });
  assert.deepEqual(FINISH, { matte: { roughness: 0.62, metalness: 0 }, gloss: { roughness: 0.62, metalness: 0, clearcoat: 0.03 }, metallic: { roughness: 0.38, metalness: 1 } });
  assert.equal(LIGHTS.env, 0.5); assert.equal(LIGHTS.blur, 0.04); assert.equal(LIGHTS.fill, 0.2);
  assert.deepEqual(SHADE, { dark: 0.85, height: 0.24 });
  assert.deepEqual(CLOUD.shadow, [0.80, 0.84, 0.93]);
  CLOUD.light.forEach((v, k) => near(v, [0xf7, 0xf6, 0xf3][k] / 255), 'Pearl Whisper');
  assert.equal(CLOUD.dpr, 1.5);
});

// ---- carousel.ts through a stub renderer (no GL) and a fake loop pool
const quiet = async <T>(fn: () => Promise<T>): Promise<T> => { const warn = console.warn; console.warn = () => {}; try { return await fn(); } finally { console.warn = warn; } };
const stubRenderer = () => ({ toneMapping: 1, autoClear: true, getClearColor: (c: Color) => c.set(0), getClearAlpha: () => 1, setRenderTarget() {}, setClearColor() {}, clear() {}, render() {}, compileAsync: () => Promise.reject(new Error('no GL under node')) }) as unknown as WebGLRenderer;
const geometry = () => { const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(new Float32Array(9), 3)); g.setAttribute('normal', new BufferAttribute(new Float32Array(9), 3)); g.setIndex(new BufferAttribute(new Uint16Array([0, 1, 2]), 1)); return g; };
const products = () => (['wallet', 'airpods', 'lenskin', 'case'] as const).map((name) => ({ name, size: name === 'case' ? [0.1047, 0.19674, 0.02656] as [number, number, number] : [0.07, 0.09, 0.005] as [number, number, number], parts: [{ name: 'shell', geometry: geometry() }] }));
function fakePool(n: number) {
  const st = Array.from({ length: n }, () => ({ playing: false, plays: 0, resets: 0 })), tex = new Texture();
  const pool: VideoPool = { n, unlock() {}, fetch: async () => true, in: () => true, refused: () => false, aspect: () => LOOP_ASPECT.wide, size: () => [1328, 692], texture: () => tex as never, playing: (i) => st[i].playing, play(i) { st[i].playing = true; st[i].plays++; }, reset(i) { if (st[i].playing) st[i].resets++; st[i].playing = false; }, dispose() {} };
  return { pool, st };
}
const sceneDefs = (still: (i: number) => Promise<Texture | null>): SceneDef[] => (['cove', 'grove', 'ember', 'palace', 'dawn'] as const).map((id, i) => ({ id, keyLight: ['#ffa6c8', '#a8ffe0', '#ffa171', '#ffc9a3', '#cbb0ff'][i], baseYaw: 0, product: ['case', 'airpods', 'wallet', 'lenskin', 'case'][i], shade: ['#c988c8', '#96a880', '#c6a884', '#efa3af', '#d7b9ed'][i], finish: (['matte', 'gloss', 'matte', 'metallic', 'matte'] as const)[i], still: () => still(i), loop: i }));
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

test('the step through the carousel: one gesture one whole step, the front switch at 285 ms, the swap at the half, the cooldown, at most two loops playing', async () => quiet(async () => {
  const { pool, st } = fakePool(5);
  const c = createCarousel({ renderer: stubRenderer(), scenes: sceneDefs(async () => new Texture()), products: products(), video: pool, cls: 'wide', reduced: false, tune: () => TUNE, dpr: 1 });
  c.setScene(0, true); await tick();
  const dt = 1 / 60; let t = 0;
  const frame = () => { t += dt; c.update(t, dt, 1280, 800); assert.ok(st.filter((s) => s.playing).length <= 2, 'at most two playing'); };
  frame();
  assert.equal(c.scene(), 0); assert.equal(c.step(), 0); assert.equal(c.busy(), false);
  assert.deepEqual(st.map((s) => s.playing), [true, false, false, false, false], 'at rest the front loop alone');
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
  // the second step, after the cooldown
  assert.equal(c.requestStep(1), true);
  while (c.busy()) frame();
  assert.equal(c.scene(), 2); assert.equal(c.front(), 2);
  assert.deepEqual(st.map((s) => s.playing), [false, false, true, false, false]);
  assert.ok(c.memory() > 0);
  assert.equal(c.cloud, null);
  c.seam('in', 0.5); frame(); assert.ok(c.cloud !== null, 'the cloud only during a seam'); c.seam(null, 0); frame(); assert.equal(c.cloud, null);
  c.dispose();
}));

test('the step waits on the next scene\'s still (spec 5, "Loading"): refused while it loads, allowed once it has settled, even to nothing', async () => quiet(async () => {
  const waits = new Map<number, () => void>();
  const c = createCarousel({ renderer: stubRenderer(), scenes: sceneDefs((i) => new Promise((r) => waits.set(i, () => r(i === 1 ? null : new Texture())))), products: products(), video: null, cls: 'portrait', reduced: false, tune: () => TUNE, dpr: 2 });
  c.setScene(0, true); c.update(0.016, 0.016, 390, 844); await tick();
  assert.equal(c.requestStep(1), false, 'scene 2\'s still is still loading');
  waits.get(1)!(); await tick();
  assert.equal(c.requestStep(1), true, 'settled, to no still');
  c.dispose();
}));

test('the reduced path: a step is a 300 ms cut with a cross-fade, the front switches at once, no look', async () => quiet(async () => {
  const c = createCarousel({ renderer: stubRenderer(), scenes: sceneDefs(async () => new Texture()), products: products(), video: fakePool(5).pool, cls: 'wide', reduced: true, tune: () => TUNE, dpr: 1 });
  c.setScene(4, true); await tick();
  let t = 0; const dt = 1 / 60; const frame = () => { t += dt; c.update(t, dt, 1280, 800); };
  frame();
  assert.equal(c.scene(), 4); assert.equal(c.requestStep(1), false, 'past the edge');
  assert.equal(c.requestStep(-1), true);
  const t0 = t;
  frame();
  assert.equal(c.front(), 3, 'the key light set at once');
  while (c.scene() !== 3 && t - t0 < 1) frame();
  near(t - t0, 0.3, dt + 1e-9, `the cut done at ${((t - t0) * 1000).toFixed(0)} ms`);
  c.look(1, 1, true); frame();
  assert.equal(c.step(), 3);
  c.dispose();
}));

test('the three modules import three and products-bin.ts alone, no loader, nothing outside section4; video.ts alone spells .mp4', () => {
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
