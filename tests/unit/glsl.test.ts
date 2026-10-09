// Every GLSL string of the island equals the prototype's, byte for byte, with the slots empty (hero-architecture.md 5.1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prototypeShaders, evalLiteral } from './proto-source.ts';
import { logoVert, logoFrag } from '../../src/scripts/hero/logo/shaders.ts';
import * as W from '../../src/scripts/hero/world/shaders.ts';
import * as P from '../../src/scripts/hero/post/shaders.ts';

const proto = Object.fromEntries(Object.entries(prototypeShaders()).map(([k, raw]) => [k, evalLiteral(raw, 30)]));
const port: Record<string, string> = {
  logoVert: logoVert(30), logoFrag: logoFrag(30),
  skyVert: W.SKY_VERT, skyFrag: W.skyFrag(),
  groundVertCommon: W.GROUND_VERT_COMMON, groundVertProject: W.GROUND_VERT_PROJECT,
  groundFragCommon: W.GROUND_FRAG_COMMON, groundFragMap: W.GROUND_FRAG_MAP,
  windVert: W.WIND_VERT, windFrag: W.WIND_FRAG, fogVert: W.FOG_VERT, fogFrag: W.FOG_FRAG,
  restoreVert: P.RESTORE_VERT, restoreFrag: P.RESTORE_FRAG, compositeVert: P.COMPOSITE_VERT, compositeFrag: P.compositeFrag(),
};

test('16 GLSL strings, the same set as the prototype', () => {
  assert.deepEqual(Object.keys(port).sort(), Object.keys(proto).sort());
});

for (const k of Object.keys(port)) {
  test(`${k} equals the prototype's string`, () => {
    assert.equal(port[k], proto[k]);
  });
}

test('MAXB stays interpolated as text (30)', () => {
  assert.match(logoVert(30), /#define NB 30\n/);
  assert.match(logoFrag(30), /uniform vec3 uBlockCol\[30\];/);
});

test('slots splice in where documented and nowhere else', () => {
  assert.ok(logoVert(30, { vertPos: '/*VP*/' }).includes('qrot(uQ[i], local);/*VP*/'));
  assert.ok(logoFrag(30, { fragOut: '/*FO*/' }).includes('1.0 : 0.0);/*FO*/'));
  assert.ok(W.skyFrag({ fragPars: '/*SP*/' }).includes('varying vec3 vDir;/*SP*/'));
  assert.ok(P.compositeFrag({ fragPars: '/*CP*/' }).includes('uniform vec2 uNoiseOff;/*CP*/'));
});
