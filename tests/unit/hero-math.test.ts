// The island's maths, scroll map and DOM clip equal the prototype's own functions, read from template.html and evaluated
// here: same inputs, the same doubles (Object.is) and the same strings (hero-architecture.md 5.1, build step 6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { constSource, functionSource, TEMPLATE11 } from './proto-source.ts';
import { readFileSync } from 'node:fs';
import { S2T, CAMX, TRACK_SVH } from '../../src/config/hero.ts';
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

// round 3: the v11.2 scroll map (prototype v11.4, template.html: PULL 5, WIPE 1, S2T; the frame's s, tp, tp2, heroOn)
const v11 = <T>(names: string[], ret: string, extra = ''): T =>
  new Function(names.map((n) => constSource(n, TEMPLATE11)).join('\n') + '\n' + extra + '\nreturn ' + ret)() as T;
const S2T_LINE = /S2T\.LAND = [^\n]+/.exec(TEMPLATE11)![0];

test('S2T and CAMX equal the v11.4 prototype', () => {
  const p = v11<{ PULL: number; WIPE: number; S2T: Record<string, number>; CAMX: number[][] }>(['PULL', 'S2T', 'CAMX'], '{ PULL, WIPE, S2T, CAMX }', S2T_LINE);
  assert.equal(PULL, p.PULL); assert.equal(WIPE, p.WIPE);
  assert.equal(PULL, 5.0); assert.equal(WIPE, 1.0);
  assert.deepEqual({ CAS0: S2T.CAS0, GAP: S2T.GAP, FLY: S2T.FLY, W1END: S2T.W1END, LAND: S2T.LAND, W2: S2T.W2 }, p.S2T);
  assert.deepEqual(CAMX.map((c) => [...c]), p.CAMX);
  assert.equal(S2T.W2, 15.2);
  // the track is the scroll map's length (shell.css carries the literal)
  assert.ok(readFileSync(new URL('../../src/styles/shell.css', import.meta.url), 'utf8').includes(`.track{position:relative;height:${TRACK_SVH}svh;`));
});

test('mapScroll equals the v11.4 prototype frame (normal and reduced): s, tp, tp2, heroOn', () => {
  const p = v11<(b: number, reduce: boolean) => { s: number; tp: number; tp2: number; heroOn: number }>(['smoothstep', 'clamp01', 'ease', 'PULL', 'S2T'],
    '(b, reduce) => { const s = reduce ? 0 : ease(clamp01(b / PULL)); const tp = clamp01((b - PULL) / WIPE), tp2 = clamp01((b - S2T.W2) / WIPE); const heroOn = 1 - smoothstep(0, 0.45, s); return { s, tp, tp2, heroOn }; }', S2T_LINE);
  for (const b of [...grid(-0.5, 18.5, 381), 1.25, 2.5, 3.75, 5.0, 5.5, 6.0, 15.0, 15.2, 15.7, 16.2]) for (const r of [false, true]) {
    const a = mapScroll(b, r), e = p(b, r);
    assert.ok(Object.is(a.s, e.s) && Object.is(a.tp, e.tp) && Object.is(a.tp2, e.tp2) && Object.is(a.heroOn, e.heroOn), `b=${b} reduced=${r}`);
  }
});

test('camX and camCurve equal the v11.4 prototype at every scroll (the level weaving pull-back)', () => {
  const src = constSource('CAMX', TEMPLATE11) + '\n' + functionSource('function camX(', TEMPLATE11) + '\n' + functionSource('function camCurve(', TEMPLATE11);
  const tgtFrom = { y: -0.9 };
  const f = new Function('tgtFrom', 'V', src + '\nreturn { camX, camCurve: (s, u2) => { const P = new V(), T = new V(); camCurve(s, u2, P, T); return [...P.toArray(), ...T.toArray()]; } };')(tgtFrom, Vector3) as { camX: (v: number) => number; camCurve: (s: number, u2: number) => number[] };
  for (const v of grid(-0.1, 2.3, 241)) assert.ok(Object.is(camX(v), f.camX(v)), `camX ${v}`);
  const P = new Vector3(), T = new Vector3();
  for (const s of grid(0, 1, 41)) for (const u2 of grid(0, 1, 21)) {
    camCurve(s, u2, tgtFrom.y, P, T);
    assert.deepEqual([...P.toArray(), ...T.toArray()], f.camCurve(s, u2), `camCurve ${s} ${u2}`);
  }
});

test('clipFor gives the prototype strings at every aspect', () => {
  const src = functionSource('function clipFor(');
  for (const [w, h] of [[390, 844], [1280, 800], [360, 780], [844, 390], [1920, 1080]]) {
    const p = new Function('innerWidth', 'innerHeight', src + '\nreturn clipFor;')(w, h) as (tp: number, above: boolean) => string;
    for (const tp of grid(0, 1, 41)) for (const above of [true, false]) assert.equal(clipFor(tp, above, w / h), p(tp, above));
  }
});
