// The island's maths, scroll map and DOM clip equal the prototype's own functions, read from template.html and evaluated
// here: same inputs, the same doubles (Object.is) and the same strings (hero-architecture.md 5.1, build step 6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { constSource, functionSource, TEMPLATE11 } from './proto-source.ts';
import { readFileSync } from 'node:fs';
import { S2T, CAMX, CAM_DRIFT, CAM_TRAVEL, PROTO_MAP, TRACK_SVH } from '../../src/config/hero.ts';
import { camX, camCurve } from '../../src/scripts/hero/camera/rig.ts';
import { Vector3 } from 'three';
import { lerpFPS, smoothstep, fit, clamp01, easeInOutCubic, sineNoise, hash2, vnoise2, parkMiller } from '../../src/scripts/hero/util/math.ts';
import { mapScroll, clipFor, PULL, WIPE } from '../../src/scripts/hero/scroll/scrollMap.ts';

const proto = <T>(names: string[], ret: string, args: string[] = [], vals: unknown[] = []): T =>
  new Function(...args, names.map((n) => constSource(n)).join('\n') + '\nreturn ' + ret)(...vals) as T;

const grid = (lo: number, hi: number, n: number) => Array.from({ length: n }, (_, i) => lo + (hi - lo) * i / (n - 1));
const xs = [...grid(-3.7, 4.2, 61), 0, 0.5, 1, -0, 1e-9, 0.449999];

test('smoothstep, fit, clamp01 equal the prototype', () => {
  const p = proto<{ smoothstep: typeof smoothstep; fit: typeof fit; clamp01: typeof clamp01 }>(['smoothstep', 'fit', 'clamp01'], '{ smoothstep, fit, clamp01 }');
  for (const x of xs) {
    assert.ok(Object.is(smoothstep(0, 0.45, x), p.smoothstep(0, 0.45, x)));
    assert.ok(Object.is(smoothstep(1, 3, x), p.smoothstep(1, 3, x)));
    assert.ok(Object.is(fit(x, 0, 1, 0.5 + 0.3 * x, 0), p.fit(x, 0, 1, 0.5 + 0.3 * x, 0)));
    assert.ok(Object.is(clamp01(x), p.clamp01(x)));
  }
});

test('lerpFPS equals the prototype at every ratio', () => {
  for (const ratio of [0, 0.37, 1, 1.4999, 2.5, 5]) {
    const p = proto<(a: number, b: number, k: number) => number>(['lerpFPS'], 'lerpFPS', ['ratio'], [ratio]);
    for (const x of xs) for (const k of [0.035, 0.05, 0.06, 0.075, 0.15, 0.0125]) assert.ok(Object.is(lerpFPS(x, 99, k, ratio), p(x, 99, k)));
  }
});

test('ease (in-out cubic), sineNoise, hash2, vnoise2 equal the prototype', () => {
  const p = proto<{ ease: typeof easeInOutCubic; sineNoise: typeof sineNoise; hash2: typeof hash2; vnoise2: typeof vnoise2 }>(['ease', 'sineNoise', 'hash2', 'vnoise2'], '{ ease, sineNoise, hash2, vnoise2 }');
  for (const x of xs) {
    assert.ok(Object.is(easeInOutCubic(clamp01(x)), p.ease(clamp01(x))));
    assert.ok(Object.is(sineNoise(-2.45, 4.789, 7.343 + x * 0.5), p.sineNoise(-2.45, 4.789, 7.343 + x * 0.5)));
    for (const y of [-1.3, 0, 0.7, 2.9]) {
      assert.ok(Object.is(hash2(x * 9, y * 9), p.hash2(x * 9, y * 9)));
      assert.ok(Object.is(vnoise2(x * 2.4 + 3, y * 2.4), p.vnoise2(x * 2.4 + 3, y * 2.4)));
    }
  }
});

test('Park-Miller seed 11 gives the prototype rnd() sequence', () => {
  const p = new Function("let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; return rnd;")() as () => number;
  const q = parkMiller(11);
  for (let i = 0; i < 60; i++) assert.ok(Object.is(q(), p()));
});

// round 3: the v11.2 scroll map (prototype v11.4, template.html: PULL 5, WIPE 1, S2T with a stagger of GAP 0.8), halved on
// 2026-11-02 (Sam: half the hero's scroll, every block leaving at once; section-2.md 14, hero.md 12.8) and set right on
// 2026-11-03 (Sam: half the travel of the world, not its speed; section-2.md 15): the port's PULL is half the prototype's
// and covers half the camera's road at the prototype's rate, WIPE is the prototype's screen again, CAS0 is mid-wipe, FLY is
// the prototype's, there is no GAP, and the frame's s, tp, tp2 and heroOn come from the prototype's own formula evaluated
// at the port's constants
const v11 = <T>(names: string[], ret: string, extra = ''): T =>
  new Function(names.map((n) => constSource(n, TEMPLATE11)).join('\n') + '\n' + extra + '\nreturn ' + ret)() as T;
const S2T_LINE = /S2T\.LAND = [^\n]+/.exec(TEMPLATE11)![0];

test('the scroll map: the v11.4 prototype\'s pull-back halved over half the road at its rate, one-screen wipes, no stagger (2026-11-03); CAMX equals the prototype', () => {
  const p = v11<{ PULL: number; WIPE: number; S2T: Record<string, number>; CAMX: number[][] }>(['PULL', 'S2T', 'CAMX'], '{ PULL, WIPE, S2T, CAMX }', S2T_LINE);
  assert.equal(p.PULL, 5.0); assert.equal(p.WIPE, 1.0); assert.equal(p.S2T.GAP, 0.8);   // the pinned prototype, unchanged
  assert.deepEqual({ ...PROTO_MAP }, { PULL: p.PULL, LAND: p.S2T.LAND });                 // the rates the world keeps come from the pinned map
  assert.equal(PULL, p.PULL / 2); assert.equal(WIPE, p.WIPE);
  assert.equal(PULL, 2.5); assert.equal(WIPE, 1);
  assert.equal(S2T.PULL, PULL); assert.equal(S2T.WIPE, WIPE);
  assert.equal(S2T.CAS0, PULL + WIPE / 2);                     // mid-wipe, the prototype's PULL + 0.5
  assert.equal(S2T.FLY, p.S2T.FLY);                            // 1.8: the flight is the prototype's
  assert.ok(!('GAP' in S2T), 'no stagger: S2T has no GAP');
  assert.equal(S2T.W1END, PULL + WIPE);
  assert.equal(S2T.LAND, S2T.CAS0 + S2T.FLY);
  assert.equal(S2T.W2, S2T.LAND + 0.7);
  assert.equal(S2T.W2END, S2T.W2 + WIPE);
  assert.deepEqual([S2T.CAS0, +S2T.LAND.toFixed(4), +S2T.W2.toFixed(4), +S2T.W2END.toFixed(4)], [3, 4.8, 5.5, 6.5]);
  assert.ok(S2T.W2END < 16.2 / 2, 'under half the scroll of the v11.4 map (16.2 screens to the second wipe\'s end)');
  // the camera's road: half of it over the pull-back at the prototype's rate (a fifth of the road per screen), the drift at its rate
  assert.equal(CAM_TRAVEL, 0.5); assert.equal(CAM_TRAVEL, PULL / p.PULL);
  assert.ok(Math.abs(CAM_DRIFT - (S2T.LAND - S2T.PULL) / (p.S2T.LAND - p.PULL)) < 1e-12 && Math.abs(CAM_DRIFT - 2.3 / 9.5) < 1e-12, `CAM_DRIFT ${CAM_DRIFT}`);
  assert.deepEqual(CAMX.map((c) => [...c]), p.CAMX);
  // the track is the scroll map's length: the second wipe's end plus the screen in which the quiz rises (shell.css carries the literal)
  assert.equal(TRACK_SVH, 750); assert.equal(TRACK_SVH, Math.round((S2T.W2END + 1) * 100));
  assert.ok(readFileSync(new URL('../../src/styles/shell.css', import.meta.url), 'utf8').includes(`.track{position:relative;height:${TRACK_SVH}svh;`));
});

test('mapScroll equals the v11.4 prototype frame formula at the port\'s constants (normal and reduced): s, tp, tp2, heroOn', () => {
  const consts = `const PULL = ${PULL}, WIPE = ${WIPE}; const S2T = { W2: ${S2T.W2} };`;
  const p = v11<(b: number, reduce: boolean) => { s: number; tp: number; tp2: number; heroOn: number }>(['smoothstep', 'clamp01', 'ease'],
    '(b, reduce) => { const s = reduce ? 0 : ease(clamp01(b / PULL)); const tp = clamp01((b - PULL) / WIPE), tp2 = clamp01((b - S2T.W2) / WIPE); const heroOn = 1 - smoothstep(0, 0.45, s); return { s, tp, tp2, heroOn }; }', consts);
  for (const b of [...grid(-0.5, 8.5, 361), 0.625, 1.25, 1.875, 2.5, 3.0, 3.5, 3.9, 4.8, 5.25, 5.5, 6.0, 6.5, 7.5]) for (const r of [false, true]) {
    const a = mapScroll(b, r), e = p(b, r);
    assert.ok(Object.is(a.s, e.s) && Object.is(a.tp, e.tp) && Object.is(a.tp2, e.tp2) && Object.is(a.heroOn, e.heroOn), `b=${b} reduced=${r}`);
  }
  // the map's beats: the pull-back ends at PULL, the first wipe runs PULL to W1END, the second W2 to W2END
  assert.deepEqual([mapScroll(S2T.PULL, false).s, mapScroll(S2T.PULL, false).tp, mapScroll(S2T.W1END, false).tp, mapScroll(S2T.W2, false).tp2, mapScroll(S2T.W2END, false).tp2], [1, 0, 1, 0, 1]);
});

test('camX equals the v11.4 prototype at every v, and camCurve is the prototype\'s road at v = CAM_TRAVEL s + CAM_DRIFT u2 (half the road over the pull-back at its rate, 2026-11-03)', () => {
  const src = constSource('CAMX', TEMPLATE11) + '\n' + functionSource('function camX(', TEMPLATE11) + '\n' + functionSource('function camCurve(', TEMPLATE11);
  const tgtFrom = { y: -0.9 };
  const f = new Function('tgtFrom', 'V', src + '\nreturn { camX, camCurve: (s, u2) => { const P = new V(), T = new V(); camCurve(s, u2, P, T); return [...P.toArray(), ...T.toArray()]; } };')(tgtFrom, Vector3) as { camX: (v: number) => number; camCurve: (s: number, u2: number) => number[] };
  for (const v of grid(-0.1, 2.3, 241)) assert.ok(Object.is(camX(v), f.camX(v)), `camX ${v}`);
  const P = new Vector3(), T = new Vector3();
  for (const s of grid(0, 1, 41)) for (const u2 of grid(0, 1, 21)) {
    camCurve(s, u2, tgtFrom.y, P, T);
    const v = CAM_TRAVEL * s + CAM_DRIFT * u2;   // the prototype's v is s + u2: the same point of its road, taken with no drift
    assert.deepEqual([...P.toArray(), ...T.toArray()], f.camCurve(v, 0), `camCurve ${s} ${u2}`);
  }
  // the pull-back ends half-way along the road (z 34 of the prototype's 24 to 44, x about +3.4 mid-weave), and the drift
  // through the wipe and the flight adds the prototype's 16 units per unit of v for CAM_DRIFT of a unit (about 3.9)
  camCurve(1, 0, tgtFrom.y, P, T); assert.ok(Math.abs(P.z - 34) < 1e-9 && Math.abs(P.x - camX(0.5)) < 1e-12, `pull-end ${P.toArray()}`);
  camCurve(1, 1, tgtFrom.y, P, T); assert.ok(Math.abs(P.z - (24 + 20 * (CAM_TRAVEL + CAM_DRIFT))) < 1e-9, `land ${P.toArray()}`);
  camCurve(0, 0, tgtFrom.y, P, T); assert.deepEqual(P.toArray(), [0, -2.5, 24]);
});

test('clipFor gives the prototype strings at every aspect', () => {
  const src = functionSource('function clipFor(');
  for (const [w, h] of [[390, 844], [1280, 800], [360, 780], [844, 390], [1920, 1080]]) {
    const p = new Function('innerWidth', 'innerHeight', src + '\nreturn clipFor;')(w, h) as (tp: number, above: boolean) => string;
    for (const tp of grid(0, 1, 41)) for (const above of [true, false]) assert.equal(clipFor(tp, above, w / h), p(tp, above));
  }
});
