// Section 2's block-to-gem wave and the phone's tap hint in Node (E-S2-wave, E-S2-hint; Sam, 2026-11-04): the sweep's
// span and its even pace in the flight, the field spliced into three r165's standard shader (the block) and into the gem's
// own patched physical shader, each side's discard and the band over its final colour, and the hint's tours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShaderLib, Texture } from 'three';
import { TAKEOVER } from '../../src/config/takeover.ts';
import { WAVE_L, createWaveUniforms, injectWave, inWave, waveMix, waveP } from '../../src/scripts/hero/section2/wave.ts';
import { matC } from '../../src/scripts/hero/section2/gemMaterial.ts';
import { HINT } from '../../src/scripts/hero/section2/hint.ts';

const shaderOf = (lib: { vertexShader: string; fragmentShader: string }) => ({ vertexShader: lib.vertexShader, fragmentShader: lib.fragmentShader, uniforms: {} as Record<string, unknown>, defines: {} });

test('the sweep: from the boundary before the shapes to past them, linear in the flight, inside the flight', () => {
  assert.ok(WAVE_L.from > 0 && WAVE_L.to < 1 && WAVE_L.from < WAVE_L.to);
  assert.equal(waveP(0), TAKEOVER.pFrom);
  assert.equal(waveP(WAVE_L.from), TAKEOVER.pFrom);
  assert.equal(waveP(WAVE_L.to), TAKEOVER.pTo);
  assert.equal(waveP(1), TAKEOVER.pTo);
  const mid = (WAVE_L.from + WAVE_L.to) / 2;
  assert.ok(Math.abs(waveP(mid) - (TAKEOVER.pFrom + TAKEOVER.pTo) / 2) < 1e-12, 'an even pace: the boundary is half way at the span\'s middle');
  assert.equal(inWave(WAVE_L.from), false);
  assert.equal(inWave(mid), true);
  assert.equal(inWave(WAVE_L.to), false);
});

test('the wave values: the block is the outgoing side, the gem the incoming, each family its own boundary, off at rest', () => {
  const a = createWaveUniforms(1, 'frosty-white'), b = createWaveUniforms(-1, 'frosty-white'), c = createWaveUniforms(1, 'roaring-red');
  assert.equal(a.uTkSide.value, 1);
  assert.equal(b.uTkSide.value, -1);
  assert.equal(a.uTkOn.value, 0);
  assert.deepEqual(a.uTkSeed.value.toArray(), b.uTkSeed.value.toArray(), 'the two sides of one stone read the same field');
  assert.notDeepEqual(a.uTkSeed.value.toArray(), c.uTkSeed.value.toArray());
  assert.equal(a.uTkBand.value.getHex(), 0xd5f6f3);
  assert.equal(a.uTkSpec.value.getHex(), 0xb7c1ff);
});

test('the block: the field and its discard spliced into three r165\'s standard shader, the band over its final colour', () => {
  const sh = shaderOf(ShaderLib.standard);
  injectWave(sh);
  sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight = ${waveMix('outgoingLight')};\n#include <opaque_fragment>`);
  assert.match(sh.vertexShader, /varying vec3 vTkPos;/);
  assert.match(sh.vertexShader, /vTkPos = transformed;/);
  assert.match(sh.fragmentShader, /uniform vec3 uTkSpec;/);
  assert.match(sh.fragmentShader, /discard;/);
  assert.match(sh.fragmentShader, /outgoingLight = \( uTkOn > 0\.5 \? mix\( outgoingLight, tkBandLit\(/);
  // the field leans on three's own view position, and comes before the colour is read
  assert.ok(sh.fragmentShader.indexOf('tkSx = dFdx( - vViewPosition )') < sh.fragmentShader.indexOf('outgoingLight = ( uTkOn'));
});

test('the gem: the wave inside its own patch, after its refraction, with the gem as the incoming side', () => {
  const tex = new Texture();
  const wave = createWaveUniforms(-1, 'blissful-blue');
  const m = matC('#1ba0d8', [[1, 0, 0, 1], [-1, 0, 0, 1], [0, 1, 0, 1], [0, -1, 0, 1], [0, 0, 1, 1], [0, 0, -1, 1]], tex, { blackTex: tex, latTex: tex, FSCALE: 3 }, wave);
  const sh = shaderOf(ShaderLib.physical);
  m.onBeforeCompile(sh as never, undefined as never);
  assert.equal(sh.uniforms.uTkSide, wave.uTkSide, 'the wave\'s own values are the shader\'s');
  assert.match(sh.fragmentShader, /discard;/);
  assert.match(sh.fragmentShader, /vec3 tkOut = neutralTone\(max\(outgoingLight, 0\.0\)\); gl_FragColor = vec4\(\( uTkOn > 0\.5 \? mix\( tkOut, tkBandLit/);
  assert.ok(sh.fragmentShader.indexOf('totalDiffuse = (1.0 - Fr) * col;') < sh.fragmentShader.indexOf('vec3 tkOut'), 'the band is over the refraction, never under it');
  assert.equal(sh.fragmentShader.split('#include <common>').length, 2);
});

test('the hint: tours of three different gems taken in turn, round and round, with no visit flag to end it', () => {
  assert.ok(HINT.tours.length >= 2);
  const seen = new Set<number>();
  for (const t of HINT.tours) { assert.equal(t.length, 3); for (const j of t) { assert.ok(j >= 0 && j < 10); assert.ok(!seen.has(j)); seen.add(j); } }
  assert.ok(HINT.restMs >= 1000, 'a rest first, so a scroll never runs into it');
  assert.ok(HINT.pauseMs <= 2000, 'between tours the cursor stands still only a moment, never leaving (Sam: "it shouldnt dissappear later")');
  assert.equal('key' in HINT, false, 'nothing turns it off for the visit');
});

test('the seed is the family takeover\'s own hash, so the two pages draw one kind of boundary', async () => {
  const { takeoverSeed } = await import('../../src/scripts/family/three/takeover.ts');
  assert.deepEqual(createWaveUniforms(1, 'go-green').uTkSeed.value.toArray(), takeoverSeed('block', 'go-green'));
});
