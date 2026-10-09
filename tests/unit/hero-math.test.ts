// The island's maths, scroll map and DOM clip equal the prototype's own functions, read from template.html and evaluated
// here: same inputs, the same doubles (Object.is) and the same strings (hero-architecture.md 5.1, build step 6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { constSource, functionSource } from './proto-source.ts';
import { lerpFPS, smoothstep, fit, clamp01, easeInOutCubic, sineNoise, hash2, vnoise2, parkMiller } from '../../src/scripts/hero/util/math.ts';
import { mapScroll, clipFor, PULL, WIPE } from '../../src/scripts/hero/scroll/scrollMap.ts';

const proto = <T>(names: string[], ret: string, args: string[] = [], vals: unknown[] = []): T =>
  new Function(...args, names.map(constSource).join('\n') + '\nreturn ' + ret)(...vals) as T;

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

test('mapScroll equals the prototype frame lines 1286 to 1288 (normal and reduced)', () => {
  assert.equal(PULL, 1.5); assert.equal(WIPE, 1.0);
  const p = proto<(b: number, reduce: boolean) => { s: number; tp: number; heroOn: number }>(['smoothstep', 'clamp01', 'ease'],
    '(b, reduce) => { const PULL = 1.5, WIPE = 1.0; const s = reduce ? 0 : ease(clamp01(b / PULL)); const tp = clamp01((b - PULL) / WIPE); const heroOn = 1 - smoothstep(0, 0.45, s); return { s, tp, heroOn }; }');
  for (const b of [...grid(-0.5, 4.5, 181), 0.375, 0.75, 1.125, 2.0, 2.5]) for (const r of [false, true]) {
    const a = mapScroll(b, r), e = p(b, r);
    assert.ok(Object.is(a.s, e.s) && Object.is(a.tp, e.tp) && Object.is(a.heroOn, e.heroOn), `b=${b} reduced=${r}`);
  }
});

test('clipFor gives the prototype strings at every aspect', () => {
  const src = functionSource('function clipFor(');
  for (const [w, h] of [[390, 844], [1280, 800], [360, 780], [844, 390], [1920, 1080]]) {
    const p = new Function('innerWidth', 'innerHeight', src + '\nreturn clipFor;')(w, h) as (tp: number, above: boolean) => string;
    for (const tp of grid(0, 1, 41)) for (const above of [true, false]) assert.equal(clipFor(tp, above, w / h), p(tp, above));
  }
});
