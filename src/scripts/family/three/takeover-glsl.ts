// The takeover's fragment code as text (docs/specs/family-page.md 24.2 D4): the declarations and the field, shared by the
// family pages' case types (takeover-material.ts) and section 2's block-to-gem wave (hero/section2/wave.ts, E-S2-wave).
// A module of its own with no three.js, so the landing page's chunk carries these two strings and nothing of the case types.
import { TAKEOVER } from '../../../config/takeover.ts';

/** a GLSL float literal */
export const f = (x: number): string => { const s = String(+x.toPrecision(7)); return /[.e]/.test(s) ? s : `${s}.0`; };

/** The fragment's declarations: the uniforms, the varying, the noise and the bump. */
export function takeoverFragPars(): string {
  const T = TAKEOVER;
  return `
varying vec3 vTkPos;
uniform float uTkOn;
uniform float uTkSide;
uniform float uTkP;
uniform vec4 uTkRect;
uniform float uTkPx;
uniform vec3 uTkSeed;
uniform float uTkRelief;
uniform float uTkReliefScale;
uniform float uTkIrid;
uniform float uTkLight;
uniform vec3 uTkBand;

// a lattice point to -1..1: the pcg3d integer hash (Jarzynski and Olano 2020), 24 bits of it
float tkHash( vec3 c ) {
	uvec3 v = uvec3( ivec3( c ) + 32768 );
	v = v * 1664525u + 1013904223u;
	v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
	v ^= v >> 16u;
	v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
	return float( v.x >> 8u ) * ( 2.0 / 16777215.0 ) - 1.0;
}
// value noise: the lattice's eight corners blended on a cubic
float tkNoise( vec3 p ) {
	vec3 i = floor( p );
	vec3 w = fract( p );
	w = w * w * ( 3.0 - 2.0 * w );
	float a = mix( tkHash( i ), tkHash( i + vec3( 1.0, 0.0, 0.0 ) ), w.x );
	float b = mix( tkHash( i + vec3( 0.0, 1.0, 0.0 ) ), tkHash( i + vec3( 1.0, 1.0, 0.0 ) ), w.x );
	float c = mix( tkHash( i + vec3( 0.0, 0.0, 1.0 ) ), tkHash( i + vec3( 1.0, 0.0, 1.0 ) ), w.x );
	float d = mix( tkHash( i + vec3( 0.0, 1.0, 1.0 ) ), tkHash( i + vec3( 1.0, 1.0, 1.0 ) ), w.x );
	return mix( mix( a, b, w.y ), mix( c, d, w.y ), w.z );
}
// ${T.octaves} octaves, each ${T.lacunarity} times finer and ${T.gain} as strong, the first at ${f(T.firstAmp)}: the sum stays within -1..1
float tkFbm( vec3 p ) {
	float s = 0.0;
	float a = ${f(T.firstAmp)};
	for ( int o = 0; o < ${T.octaves}; o ++ ) {
		s += a * tkNoise( p );
		p = p * ${f(T.lacunarity)} + vec3( 5.21, 11.73, 3.37 );
		a *= ${f(T.gain)};
	}
	return s;
}
// the surface-gradient bump (Mikkelsen 2010) on view-space derivatives left unnormalised, so the relief keeps its
// size in view units: n tilts against the height's gradient along the surface
vec3 tkBump( vec3 n, vec3 sx, vec3 sy, vec2 dh, float face ) {
	vec3 r1 = cross( sy, n );
	vec3 r2 = cross( n, sx );
	float det = dot( sx, r1 ) * face;
	if ( abs( det ) < 1e-24 ) return n;
	return normalize( abs( det ) * n - sign( det ) * ( dh.x * r1 + dh.y * r2 ) );
}
`;
}

/** The field, the band and the side, first thing in main; the derivatives in uniform control flow, then the discard. */
export function takeoverFragField(): string {
  const T = TAKEOVER;
  return `
	float tkD = 0.0;
	float tkBand = 0.0;
	float tkMix = 0.0;
	float tkH = 0.0;
	if ( uTkOn > 0.5 ) {
		// the sweep on the screen: 0 at the case's right edge, 1 at its left, the same for both cases at a pixel
		float tkT = clamp( ( uTkRect.y - gl_FragCoord.x ) / max( uTkRect.y - uTkRect.x, 1.0 ), 0.0, 1.0 );
		vec2 tkQ = ( gl_FragCoord.xy - uTkRect.xz ) / max( uTkPx, 1.0 );
		float tkF = tkT + tkFbm( vec3( tkQ * ${f(T.majorScale)}, 0.0 ) + uTkSeed ) * ${f(T.majorStrength)}
			+ tkFbm( vec3( tkQ * ${f(T.detailScale)}, 0.0 ) + uTkSeed.yzx * 1.618 ) * ${f(T.detailStrength)};
		tkD = tkF - uTkP;
		tkBand = 1.0 - smoothstep( 0.0, ${f(T.edgeWidth)}, abs( tkD ) );
		tkMix = tkBand * ${f(T.bandMix)};
		if ( tkBand > 0.0 ) tkH = tkBand * tkFbm( vTkPos * uTkReliefScale + uTkSeed.zxy * 2.237 );
	}
	vec2 tkDh = vec2( dFdx( tkH ), dFdy( tkH ) ) * uTkRelief;
	vec3 tkSx = dFdx( - vViewPosition );
	vec3 tkSy = dFdy( - vViewPosition );
	// the outgoing case keeps f >= p, the incoming f < p: one case per pixel, never a blend
	if ( uTkOn > 0.5 && ( uTkSide > 0.0 ? tkD < 0.0 : tkD >= 0.0 ) ) discard;
`;
}
