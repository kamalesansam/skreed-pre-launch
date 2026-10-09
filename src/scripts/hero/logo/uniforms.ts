// The logo's uniforms (prototype lines 395 to 407) and its block colours (408 to 413). The getters read the live params
// object, so a Tune change reaches the shader without a rebuild, as in the prototype. Dropped as unused by the GLSL:
// uAnchor, uRegion and uRimDir (hero-architecture.md 5.1).
import { Color, Vector3, Vector4 } from 'three';
import { BLOCK_SHADES } from '../../../config/shades.gen.ts';
import type { HeroParams } from '../../../config/params.ts';
import { MAXB, type Block } from './geometry.ts';

export function createLogoUniforms(P: HeroParams) {
  return {
    uOff: { value: Array.from({ length: MAXB }, () => new Vector3()) }, uQ: { value: Array.from({ length: MAXB }, () => new Vector4(0, 0, 0, 1)) }, uD: { value: new Float32Array(MAXB) },
    uBlockCol: { value: Array.from({ length: MAXB }, () => new Color()) },
    uTime: { value: 0 }, uGlow: { value: P.glow }, uRest: { value: P.rest }, uTint: { value: P.tint }, uGrad: { value: P.grad }, uTex: { value: P.tex }, uKey: { value: P.key }, uRelief: { value: P.relief },
    uBevelW: { get value() { return P.bevel; } }, uBevelAng: { get value() { return P.bevelAng * Math.PI / 180; } }, uAlb: { get value() { return P.alb; } }, uWrap: { get value() { return P.wrap; } },
    uKeyPos: { get value() { return new Vector3(P.keyX, P.keyY, P.keyZ); } }, uKeyRad: { get value() { return P.keyRad; } },
    uRimPos: { get value() { return new Vector3(P.rimX, P.rimY, P.rimZ); } }, uRimRad: { get value() { return P.rimRad; } },
    uRim2: { get value() { return P.rim2; } }, uRim2Pos: { get value() { return new Vector3(P.rim2X, P.rim2Y, P.rim2Z); } }, uRim2Rad: { get value() { return P.rim2Rad; } },
    uFloor: { get value() { return P.floor; } }, uHz: { get value() { return P.hz; } }, uSky: { get value() { return P.sky; } }, uKTemp: { get value() { return P.ktemp; } }, uWear: { get value() { return P.wear; } }, uOcc: { get value() { return P.occ; } }, uKnee: { get value() { return P.knee; } },
    uRim: { get value() { return P.rim; } }, uSpec: { get value() { return P.spec; } }, uRough: { get value() { return P.rough; } }, uBounce: { get value() { return P.bounce; } }, uAmb: { get value() { return P.amb; } },
  };
}
export type LogoUniforms = ReturnType<typeof createLogoUniforms>;

/** One shade per block, one family each, in the 'cool' order (hero.md section 3), looked up by id. */
export function assignBlockColours(blocks: Block[], U: LogoUniforms): void {
  blocks.forEach((b, i) => { const k = i % BLOCK_SHADES.length; U.uBlockCol.value[i].set(BLOCK_SHADES[k].hex); b.shade = k; });
}

/** Resets the per-block motion uniforms (prototype line 392). */
export function resetBlockUniforms(U: LogoUniforms): void {
  for (let i = 0; i < MAXB; i++) { U.uOff.value[i].set(0, 0, 0); U.uQ.value[i].set(0, 0, 0, 1); U.uD.value[i] = 0; }
}
