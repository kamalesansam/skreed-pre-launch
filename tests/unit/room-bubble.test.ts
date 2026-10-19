// Section 4's bubble (docs/specs/section-4-world.md 2 "The bubble", AC4, AC5's bubble part): the radius's two phases,
// the growth that never steps inward at any angle across a 60 steps-a-second sweep (so every pixel crosses from outside
// to inside exactly once, and the outline passes each pixel once), the final edge clear of every corner, the shader's
// complex powers and true distance against the trigonometric curve and a brute-force distance, and the outside's bound.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BUBBLE, bubbleAt, bubbleDistance, bubbleEdge, bubbleModes, bubbleOutside, checkBubbleGrowth, dissolveAt, type BubbleSize } from '../../src/scripts/hero/section4/transition.ts';
import { URBAN_SLATE } from '../../src/config/tokens.ts';

const CSS: readonly [number, number][] = [[360, 780], [390, 844], [844, 390], [1280, 800]];
const DPRS = [1.25, 1.5], DURATIONS = [1200, 2000, 3200];
const SIZES: (BubbleSize & { name: string })[] = CSS.flatMap(([w, h]) => DPRS.map((d) => ({ w: Math.round(w * d), h: Math.round(h * d), name: `${w}x${h}@${d}` })));
const far = (s: BubbleSize) => { const cx = s.cx ?? s.w / 2, cy = s.cy ?? s.h / 2; return Math.max(Math.hypot(cx, cy), Math.hypot(s.w - cx, cy), Math.hypot(cx, s.h - cy), Math.hypot(s.w - cx, s.h - cy)); };
const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const relLum = (c: readonly number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

test('the constants: five Fibonacci modes the shader chains, weights summing to 1, a weighted rate of 2.55 rad/s', () => {
  assert.deepEqual([...BUBBLE.lobes], [2, 3, 5, 8, 13]);
  for (let i = 2; i < BUBBLE.lobes.length; i++) assert.equal(BUBBLE.lobes[i], BUBBLE.lobes[i - 1] + BUBBLE.lobes[i - 2], 'each power is the product of the two before');
  assert.deepEqual([...BUBBLE.weights], [0.34, 0.28, 0.20, 0.12, 0.06]);
  assert.deepEqual([...BUBBLE.rates], [1.3, 1.9, 3.1, 4.6, 6.8]);
  assert.ok(Math.abs(BUBBLE.weights.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  const rate = BUBBLE.weights.reduce((a, w, i) => a + w * BUBBLE.rates[i], 0);
  assert.ok(Math.abs(rate - 2.55) < 0.01, `${rate}`);
  assert.equal(BUBBLE.phase0.length, 5);
  assert.deepEqual([BUBBLE.ampSmall, BUBBLE.ampEnd, BUBBLE.r1, BUBBLE.ease, BUBBLE.margin, BUBBLE.line, BUBBLE.lens, BUBBLE.lensFade], [0.12, 0.025, 0.08, 0.12, 4, 2, 6, 24]);
  assert.deepEqual([BUBBLE.start, BUBBLE.ms, ...BUBBLE.msRange, BUBBLE.grey, BUBBLE.dark, BUBBLE.dissolveMs], [0.35, 2000, 1200, 3200, 0.5, 0.6, 600]);
});

test('the radius: an ease-out to R1 with no overshoot, the zoom\'s velocity at the join, then a constant zoom rate to Rend', () => {
  for (const s of SIZES) for (const T of DURATIONS) {
    const at = (u: number) => bubbleAt(u * T, T, s), e = BUBBLE.ease, R1 = BUBBLE.r1 * Math.min(s.w, s.h);
    const end = at(1), rEnd = (far(s) + BUBBLE.margin) / (1 - BUBBLE.ampEnd);
    assert.equal(at(0).R, 0, `${s.name}: 0 at the start`);
    assert.ok(Math.abs(at(e).R - R1) < 1e-9, `${s.name}: R1 at the end of the ease`);
    assert.ok(Math.abs(end.R - rEnd) < 1e-9 && end.done, `${s.name}: Rend at the end`);
    // Rend is the farthest corner plus the end amplitude plus 4 px
    assert.ok(Math.abs(end.R - (far(s) + BUBBLE.ampEnd * end.R + BUBBLE.margin)) < 1e-9);
    // the ease: rising, concave (no overshoot, decelerating), never past R1
    let prev = 0, prevStep = Infinity;
    for (let i = 1; i <= 600; i++) {
      const R = at((e * i) / 600).R, step = R - prev;
      assert.ok(step > 0 && R <= R1 + 1e-9, `${s.name} ${T}: the ease rises to R1`);
      assert.ok(step <= prevStep + 1e-9, `${s.name} ${T}: the ease decelerates`);
      prev = R; prevStep = step;
    }
    // the velocity either side of the join, by one-sided differences
    const h = 1e-6, vl = (at(e).R - at(e - h).R) / h, vr = (at(e + h).R - at(e).R) / h;
    assert.ok(Math.abs(vl - vr) / vr < 1e-3, `${s.name} ${T}: ${vl} against ${vr} at the join`);
    // the zoom: ln R rises by the same amount for every equal step of time
    const d0 = Math.log(at(0.3).R / at(0.2).R), d1 = Math.log(at(0.9).R / at(0.8).R);
    assert.ok(Math.abs(d0 - d1) < 1e-9, `${s.name} ${T}: a constant zoom rate`);
    // the amplitude: 0.12 of R while small, easing to 0.025 at the end
    assert.equal(at(0.05).A, BUBBLE.ampSmall);
    assert.ok(Math.abs(end.A - BUBBLE.ampEnd) < 1e-12);
    // the lens: full until 90 percent, then gone by the end, so the last frame is the world's own
    assert.equal(at(0.5).lens, BUBBLE.lens);
    assert.equal(end.lens, 0);
  }
});

test('AC4: 720 angles at 60 steps a second never step inward, and the final edge clears all four corners', () => {
  for (const T of DURATIONS) for (const s of SIZES) {
    const g = checkBubbleGrowth(T, s, { fps: 60, angles: 720 });
    assert.equal(g.angles, 720);
    assert.equal(g.steps, Math.ceil((T * 60) / 1000));
    assert.ok(g.grows, `${s.name} ${T} ms: the edge stepped in by ${-g.minStep} px at ${g.worst.ms} ms, theta ${g.worst.theta}`);
    assert.ok(g.minStep > 0, `${s.name} ${T} ms: min step ${g.minStep}`);
    assert.ok(g.clears, `${s.name} ${T} ms: clearance ${g.clearance} px`);
    assert.ok(g.clearance >= BUBBLE.line / 2 + 0.5);
    assert.ok(g.clearance >= BUBBLE.margin - 0.05, 'by construction the innermost point of the edge is the margin past the farthest corner');
    console.log(`bubble ${s.name} (${s.w}x${s.h} device px) ${T} ms: ${g.steps} steps, smallest step ${g.minStep.toFixed(3)} px, corners cleared by ${g.clearance.toFixed(2)} px`);
  }
});

test('the growth holds with the centre moved (the integrator may set it on the door), and fails as it should on a shrinking edge', () => {
  for (const [w, h] of [[585, 1266], [1600, 1000]]) for (const [fx, fy] of [[0.3, 0.6], [0.5, 0.42], [0.8, 0.2]]) {
    const s = { w, h, cx: w * fx, cy: h * fy };
    for (const T of DURATIONS) { const g = checkBubbleGrowth(T, s); assert.ok(g.ok, `${w}x${h} centre ${fx}, ${fy}, ${T} ms: grows ${g.grows}, clearance ${g.clearance}`); }
    assert.ok(Math.abs(bubbleAt(2000, 2000, s).rEnd * (1 - BUBBLE.ampEnd) - (far(s) + BUBBLE.margin)) < 1e-9, 'Rend from the farthest corner');
  }
  // the checker is not vacuous: a wobble far too fast for the zoom steps the edge inward, and a short margin fails the corners
  assert.equal(checkBubbleGrowth(3200, { w: 1600, h: 1000 }, {}, { ...BUBBLE, rates: BUBBLE.rates.map((r) => r * 12) }).grows, false);
  assert.equal(checkBubbleGrowth(2000, { w: 1600, h: 1000 }, {}, { ...BUBBLE, margin: -40 }).clears, false);
});

test('the shader\'s maths: the complex powers equal the trigonometric edge, and its distance is the true distance', () => {
  const s = { w: 585, h: 1266 };
  for (const u of [0.06, 0.25, 0.5, 0.9]) {
    const f = bubbleAt(u * 2000, 2000, s), m = bubbleModes(f);
    // the packed modes: R + sum dot(z^n, uM[k]) is the edge, at any angle
    for (let j = 0; j < 97; j++) {
      const th = (2 * Math.PI * j) / 97 + 0.01;
      let r = f.R; for (let i = 0; i < 5; i++) r += Math.cos(BUBBLE.lobes[i] * th) * m[2 * i] + Math.sin(BUBBLE.lobes[i] * th) * m[2 * i + 1];
      assert.ok(Math.abs(r - bubbleEdge(f, th)) < 1e-9, `u ${u} theta ${th}`);
      // a point on the edge is at distance 0 by the shader's own chain (y up in the shader, down from the top left here)
      const e = bubbleEdge(f, th);
      assert.ok(Math.abs(bubbleDistance(f, f.cx + e * Math.cos(th), f.cy - e * Math.sin(th))) < 1e-6);
    }
    // near the edge, the first-order distance against the nearest of 40,000 points on the curve
    const pts: [number, number][] = [];
    for (let j = 0; j < 40000; j++) { const th = (2 * Math.PI * j) / 40000, e = bubbleEdge(f, th); pts.push([f.cx + e * Math.cos(th), f.cy - e * Math.sin(th)]); }
    let worst = 0;
    for (let j = 0; j < 180; j++) for (const off of [-2, -1, -0.5, 0.5, 1, 2]) {
      const th = (2 * Math.PI * j) / 180 + 0.003, e = bubbleEdge(f, th), rr = e + off;
      const x = f.cx + rr * Math.cos(th), y = f.cy - rr * Math.sin(th);
      // the nearest point lies within a few degrees of the sample's own angle: search 0.13 rad either side
      let best = Infinity; const j0 = Math.round((th / (2 * Math.PI)) * 40000);
      for (let q = j0 - 800; q <= j0 + 800; q++) { const [qx, qy] = pts[(q + 40000) % 40000]; best = Math.min(best, Math.hypot(x - qx, y - qy)); }
      const d = bubbleDistance(f, x, y);
      assert.equal(Math.sign(d), Math.sign(off), 'inside is negative');
      worst = Math.max(worst, Math.abs(Math.abs(d) - best));
    }
    assert.ok(worst < 0.12, `u ${u}: the antialiasing distance is off the true distance by ${worst} px`);
    console.log(`bubble at ${u * 100}%: R ${f.R.toFixed(1)} px, A ${f.A.toFixed(3)}, true distance within ${worst.toFixed(3)} px of brute force within 2 px of the edge`);
  }
});

test('the source: one program for every mode (uniforms, no defines), no per-pixel atan, the bands gone', () => {
  const src = readFileSync(new URL('../../src/scripts/hero/section4/transition.ts', import.meta.url), 'utf8');
  const frag = src.slice(src.indexOf('const FRAG'), src.indexOf('}`;', src.indexOf('const FRAG')));
  assert.doesNotMatch(frag, /#define|#if/);
  assert.doesNotMatch(frag, /\batan\b/);
  assert.match(frag, /z13 = cmul\(z8, z5\)/);
  assert.doesNotMatch(src, /SWEEP_BANDS|uBands/);
  assert.doesNotMatch(src, /defines\s*:/);
});

test('outside the bubble (AC4): the hall\'s mid greys and the Urban Slate doorway fall below 0.06 relative luminance', () => {
  const slate = [1, 3, 5].map((i) => parseInt(URBAN_SLATE.slice(i, i + 2), 16) / 255) as [number, number, number];
  assert.ok(relLum(bubbleOutside(slate)) < 0.02, `${relLum(bubbleOutside(slate))}`);
  for (const g of [0.1, 0.3, 0.5, 0.6]) assert.ok(relLum(bubbleOutside([g, g, g])) < 0.06, `grey ${g}: ${relLum(bubbleOutside([g, g, g]))}`);
  // the outside never brightens a pixel the hall had dark, and even white is held near an eighth
  for (const g of [0.3, 0.5, 0.8, 1]) assert.ok(relLum(bubbleOutside([g, g, g])) <= relLum([g, g, g]) + 1e-12);
  assert.ok(relLum(bubbleOutside([1, 1, 1])) < 0.12);
});

test('the reduced dissolve: 0 to 1 over 600 ms on a smoothstep, never back', () => {
  assert.equal(dissolveAt(-50), 0); assert.equal(dissolveAt(0), 0); assert.equal(dissolveAt(300), 0.5); assert.equal(dissolveAt(600), 1); assert.equal(dissolveAt(900), 1);
  for (let ms = 0; ms < 600; ms += 1000 / 60) assert.ok(dissolveAt(ms + 1000 / 60) >= dissolveAt(ms));
});
