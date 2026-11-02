// The takeover's shader (docs/specs/family-page.md 24.1, 24.2 D4, D7 and D9; E-F6): our own code spliced into three
// r165's physical material by onBeforeCompile, reproducing what was measured of depth.fyi's material takeover for two
// models instead of two materials. Every fragment of the front case finds its place on the sweep in the case's own
// normalised space (height 1), roughened by two layers of value-noise fBm; the outgoing case keeps the side the boundary
// has not reached and the incoming case the side it has passed, by discard, so nothing is see-through and no pixel
// shows both; each draws the band on its own side, after the shade, so the shade never tints it. The band's relief is a
// bump of band x fBm, differentiated in screen space, and the clearcoat normal follows it. One uniform switches all of
// it off at rest, by a uniform branch, so a frame at rest is the plain material's. The band's clearcoat and iridescence
// paths are compiled into every front material (a define where the finish has none, its own value 0 per fragment), so
// no program compiles when a run starts.
import { Color, Matrix4, Vector2, Vector3, type MeshPhysicalMaterial } from 'three';
import { TAKEOVER } from '../../../config/takeover.ts';

/** The values of one run, shared by every front material (the two cases of a run draw with the same field). */
export interface TakeoverRunUniforms {
  /** the boundary's place, -0.12 to 1.12 */
  uTkP: { value: number };
  /** the sweep axis in the case's space, from the screen's right to its left (or mirrored, D5) */
  uTkAxis: { value: Vector3 };
  /** the two models' extent along the axis */
  uTkRange: { value: Vector2 };
  uTkSeed: { value: Vector3 };
  /** the relief's bump strength in view units: 0.07 x the case's sweep extent in the world over the form's (TAKEOVER.reliefRef) */
  uTkRelief: { value: number };
  /** the relief's noise per unit of the case's space: 8 x 1.37 per sweep extent */
  uTkReliefScale: { value: number };
  /** the inverse of the front case's pose: inverse x instance matrix x position is the case's own space */
  uTkCaseInv: { value: Matrix4 };
  /** the band's iridescence: 0.2 on the high tier, 0 on the low (D7) */
  uTkIrid: { value: number };
  /** D7: the band's share of the environment light */
  uTkLight: { value: number };
  /** the band's base colour as an albedo: the stage sets the one that reads #D5F6F3 where the case reads its shade */
  uTkBand: { value: Color };
}
/** One model's switch and side: on 1 while it is drawn in a run; side +1 the outgoing case, -1 the incoming. */
export interface TakeoverSideUniforms { uTkOn: { value: number }; uTkSide: { value: number } }

export function createRunUniforms(): TakeoverRunUniforms {
  return {
    uTkP: { value: TAKEOVER.pFrom }, uTkAxis: { value: new Vector3(-1, 0, 0) }, uTkRange: { value: new Vector2(-0.5, 0.5) },
    uTkSeed: { value: new Vector3() }, uTkRelief: { value: TAKEOVER.relief }, uTkReliefScale: { value: TAKEOVER.detailScale * TAKEOVER.reliefFreq }, uTkCaseInv: { value: new Matrix4() },
    uTkIrid: { value: TAKEOVER.band.iridescence }, uTkLight: { value: TAKEOVER.bandLight }, uTkBand: { value: new Color(TAKEOVER.band.base) },
  };
}
export const createSideUniforms = (): TakeoverSideUniforms => ({ uTkOn: { value: 0 }, uTkSide: { value: 1 } });

/** a GLSL float literal */
const f = (x: number): string => { const s = String(+x.toPrecision(7)); return /[.e]/.test(s) ? s : `${s}.0`; };
const lin = (hex: number) => { const c = new Color(hex); return `vec3( ${f(c.r)}, ${f(c.g)}, ${f(c.b)} )`; };   // sRGB hex to the linear working space, as three's own colours

/** The fragment's declarations: the uniforms, the varying, the noise and the bump. */
export function takeoverFragPars(): string {
  const T = TAKEOVER;
  return `
varying vec3 vTkPos;
uniform float uTkOn;
uniform float uTkSide;
uniform float uTkP;
uniform vec3 uTkAxis;
uniform vec2 uTkRange;
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
		float tkT = clamp( ( dot( vTkPos, uTkAxis ) - uTkRange.x ) / max( uTkRange.y - uTkRange.x, 1e-5 ), 0.0, 1.0 );
		float tkF = tkT + tkFbm( vTkPos * ${f(T.majorScale)} + uTkSeed ) * ${f(T.majorStrength)}
			+ tkFbm( vTkPos * ${f(T.detailScale)} + uTkSeed.yzx * 1.618 ) * ${f(T.detailStrength)};
		tkD = tkF - uTkP;
		tkBand = 1.0 - smoothstep( 0.0, ${f(T.edgeWidth)}, abs( tkD ) );
		tkMix = tkBand * ${f(T.bandMix)};
		if ( tkBand > 0.0 ) tkH = tkBand * tkFbm( vTkPos * uTkReliefScale + uTkSeed.zxy * 2.237 );
	}
	vec2 tkDh = vec2( dFdx( tkH ), dFdy( tkH ) ) * uTkRelief;
	vec3 tkSx = dFdx( - vViewPosition );
	vec3 tkSy = dFdy( - vViewPosition );
	// the outgoing case keeps f >= p, the incoming f < p: one surface per pixel, never a blend
	if ( uTkOn > 0.5 && ( uTkSide > 0.0 ? tkD < 0.0 : tkD >= 0.0 ) ) discard;
`;
}

/** code after an anchor that appears exactly once (three r165's physical shader's own include lines) */
function after(src: string, anchor: string, code: string): string {
  const i = src.indexOf(anchor);
  if (i < 0 || src.indexOf(anchor, i + anchor.length) >= 0) throw new Error(`takeover: the anchor ${anchor} is missing or not unique (three r165's physical shader expected)`);
  return src.slice(0, i + anchor.length) + code + src.slice(i + anchor.length);
}

/** Splices the takeover into a physical shader's two stages (three r165's anchors; throws on a missing one). */
export function injectTakeover(shader: { vertexShader: string; fragmentShader: string }): void {
  const T = TAKEOVER, B = T.band;
  let v = shader.vertexShader;
  v = after(v, '#include <common>', '\nvarying vec3 vTkPos;\nuniform mat4 uTkCaseInv;');
  // the case's own space: every front instance matrix is the pose times the part's base, so the pose's inverse leaves base x position
  v = after(v, '#include <project_vertex>', `
	vec4 tkP = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		tkP = instanceMatrix * tkP;
	#endif
	vTkPos = ( uTkCaseInv * tkP ).xyz;`);
  let s = shader.fragmentShader;
  s = after(s, '#include <common>', takeoverFragPars());
  s = after(s, '#include <clipping_planes_fragment>', takeoverFragField());
  // the band over the case's own colour, after the shade's instance colour, so the shade never tints it
  s = after(s, '#include <color_fragment>', '\n\tif ( uTkOn > 0.5 ) diffuseColor.rgb = mix( diffuseColor.rgb, uTkBand, tkMix );');
  s = after(s, '#include <roughnessmap_fragment>', `\n\tif ( uTkOn > 0.5 ) roughnessFactor = mix( roughnessFactor, ${f(B.roughness)}, tkMix );`);
  s = after(s, '#include <metalnessmap_fragment>', `\n\tif ( uTkOn > 0.5 ) metalnessFactor = mix( metalnessFactor, ${f(B.metalness)}, tkMix );`);
  s = after(s, '#include <normal_fragment_maps>', '\n\tif ( uTkOn > 0.5 ) normal = tkBump( normal, tkSx, tkSy, tkDh, faceDirection );');
  s = after(s, '#include <clearcoat_normal_fragment_maps>', `
	#ifdef USE_CLEARCOAT
		if ( uTkOn > 0.5 ) clearcoatNormal = normalize( mix( clearcoatNormal, normal, tkBand * ${f(T.coatFollow)} ) );
	#endif`);
  // the band's IOR, specular colour, clearcoat and iridescence, set after three's own so its clamps are kept
  s = after(s, '#include <lights_physical_fragment>', `
	if ( uTkOn > 0.5 ) {
		#ifdef IOR
			material.ior = mix( material.ior, ${f(B.ior)}, tkMix );
			specularColorFactor = mix( specularColorFactor, ${lin(B.specular)}, tkMix );
			material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
		#endif
		#ifdef USE_CLEARCOAT
			material.clearcoat = mix( material.clearcoat, ${f(B.clearcoat)}, tkMix );
			material.clearcoatRoughness = min( max( mix( clearcoatRoughness, ${f(B.clearcoatRoughness)}, tkMix ), 0.0525 ) + geometryRoughness, 1.0 );
		#endif
		#ifdef USE_IRIDESCENCE
			material.iridescence = mix( material.iridescence, uTkIrid, tkMix );
		#endif
	}
	#ifdef USE_IRIDESCENCE
		material.iridescenceFresnel = vec3( 0.0 );
		material.iridescenceF0 = vec3( 0.0 );
	#endif`);
  // D7: the band's own share of the environment light
  s = after(s, '#include <lights_fragment_maps>', `
	if ( uTkOn > 0.5 ) {
		float tkL = mix( 1.0, uTkLight, tkMix );
		#if defined( RE_IndirectDiffuse )
			iblIrradiance *= tkL;
		#endif
		#if defined( RE_IndirectSpecular )
			radiance *= tkL;
			clearcoatRadiance *= tkL;
		#endif
	}`);
  shader.vertexShader = v;
  shader.fragmentShader = s;
}

/** The program cache key every takeover material shares (one program per finish and part kind, whichever model draws it). */
export const TAKEOVER_PROGRAM = 'skreed-family-takeover-1';

/**
 * Makes a physical material a front material: the takeover's code and its two uniform sets (the run's, shared by every
 * front material, and the model's own switch and side). A finish without its own clearcoat or iridescence gets the
 * define, so the band's paths are compiled while the case's own values stay 0 per fragment.
 */
export function withTakeover<M extends MeshPhysicalMaterial>(m: M, run: TakeoverRunUniforms, side: TakeoverSideUniforms): M {
  m.defines = { ...(m.defines ?? {}) };
  if (!(m.clearcoat > 0)) m.defines.USE_CLEARCOAT = '';
  if (!(m.iridescence > 0)) m.defines.USE_IRIDESCENCE = '';
  m.customProgramCacheKey = () => TAKEOVER_PROGRAM;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, run, side);
    injectTakeover(shader);
  };
  m.needsUpdate = true;
  return m;
}
