// The takeover's shader (docs/specs/family-page.md 24.1, 24.2 D4, D7 and D9; E-F6): our own code spliced into three
// r165's physical material by onBeforeCompile, reproducing what was measured of depth.fyi's material takeover for two
// models instead of two materials. Every fragment of the front case finds its place on the sweep on the screen (D4,
// since 2026-11-03): its place across the case's box as the stage projects it this frame, 0 at the case's right edge
// and 1 at its left, roughened by two layers of value-noise fBm sampled on the screen in units of the case's height, so
// the two cases read the same field at a pixel; the outgoing case keeps the side the boundary has not reached and the
// incoming case the side it has passed, by discard, so every pixel under both cases shows exactly one of them, nothing
// is see-through where both stand and no pixel shows both (the field of 2026-11-02, in each case's own space, cut the
// two surfaces apart and showed the incoming case's inner walls through the outgoing one's near the edge-on angle);
// each draws the band on its own side, after the shade, so the shade never tints it. The band's relief is a bump of
// band x fBm in the case's own space, differentiated in screen space, and the clearcoat normal follows it. One uniform
// switches all of it off at rest, by a uniform branch, so a frame at rest is the plain material's. The band's clearcoat
// and iridescence paths are compiled into every front material (a define where the finish has none, its own value 0
// per fragment), so no program compiles when a sweep starts.
import { Color, Matrix4, Vector3, Vector4, type MeshPhysicalMaterial } from 'three';
import { TAKEOVER } from '../../../config/takeover.ts';
import { f, takeoverFragField, takeoverFragPars } from './takeover-glsl.ts';

/** The values of one run, shared by every front material (the two cases of a run draw with the same field). */
export interface TakeoverRunUniforms {
  /** the boundary's place, -0.12 to 1.12 */
  uTkP: { value: number };
  /** the box round both cases on the screen this frame, in device pixels as gl_FragCoord reads them: x0, x1, y0, y1 */
  uTkRect: { value: Vector4 };
  /** the box's height in device pixels: the unit of the boundary's noise on the screen (the case's height, as the form's) */
  uTkPx: { value: number };
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
    uTkP: { value: TAKEOVER.pFrom }, uTkRect: { value: new Vector4(0, 1, 0, 1) }, uTkPx: { value: 1 },
    uTkSeed: { value: new Vector3() }, uTkRelief: { value: TAKEOVER.relief }, uTkReliefScale: { value: TAKEOVER.detailScale * TAKEOVER.reliefFreq }, uTkCaseInv: { value: new Matrix4() },
    uTkIrid: { value: TAKEOVER.band.iridescence }, uTkLight: { value: TAKEOVER.bandLight }, uTkBand: { value: new Color(TAKEOVER.band.base) },
  };
}
export const createSideUniforms = (): TakeoverSideUniforms => ({ uTkOn: { value: 0 }, uTkSide: { value: 1 } });

const lin = (hex: number) => { const c = new Color(hex); return `vec3( ${f(c.r)}, ${f(c.g)}, ${f(c.b)} )`; };   // sRGB hex to the linear working space, as three's own colours

export { takeoverFragField, takeoverFragPars } from './takeover-glsl.ts';

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
