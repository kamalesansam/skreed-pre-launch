// Round 3: every GLSL string the v11 port adds (the intro's cage, outline, numbers and triangle bake, the v11 composite,
// the IGL helpers and the print, sky-mix and floor-reveal slot code) occurs verbatim in the v11.4 prototype's template,
// and the composite's fragment shader equals the prototype's literal exactly (hero-architecture.md 5.1, "Port rules").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATE11, literalAfter, evalLiteral } from './proto-source.ts';
import { IGL, LOGO_PRINT, SKY_MIX, COMPOSITE_FRAG_V11, CAGE_VERT, CAGE_FRAG, OUTLINE_VERT, OUTLINE_FRAG, NUMS_VERT, NUMS_FRAG, TRI_VERT, TRI_FRAG, FLOOR_INTRO_COLOR } from '../../src/scripts/hero/v11/glsl.ts';
import { compositeFrag } from '../../src/scripts/hero/post/shaders.ts';

const STRINGS: Record<string, string> = { IGL, LOGO_PRINT, SKY_MIX, CAGE_VERT, CAGE_FRAG, OUTLINE_VERT, OUTLINE_FRAG, NUMS_VERT, NUMS_FRAG, TRI_VERT, TRI_FRAG, FLOOR_INTRO_COLOR };

for (const [name, s] of Object.entries(STRINGS)) {
  test(`${name} occurs verbatim in the v11.4 prototype`, () => {
    assert.ok(s.trim().length > 20, 'not empty');
    assert.ok(TEMPLATE11.includes(s.trim()), `${name} not found in template_v11`);
  });
}

test('the v11 composite fragment shader equals the prototype literal, and the composite slot carries it whole', () => {
  const raw = literalAfter('uniforms: C, depthTest: false, depthWrite: false,', 'fragmentShader:', 0, TEMPLATE11).raw;
  assert.equal(COMPOSITE_FRAG_V11, evalLiteral(raw));
  assert.equal(compositeFrag({ full: COMPOSITE_FRAG_V11 }), COMPOSITE_FRAG_V11);
  assert.notEqual(compositeFrag(), COMPOSITE_FRAG_V11);   // the default string stays v9.10's
});
