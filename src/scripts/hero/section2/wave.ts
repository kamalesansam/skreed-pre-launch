// The block-to-gem wave (Sam, 2026-11-04: "whatever the wave effect that we have on the case types, implement the same
// effect on the stone when they are dispersing from the logo ... have the same block and use the wave effect transition
// them into the stones, instead of making them small and enlarging"; E-S2-wave). The family pages' takeover field
// (family/three/takeover-material.ts, docs/specs/family-page.md 24; E-F6) read here on each stone's own box on the screen:
// the flying block and its gem share one pose and one size while the sweep crosses them from the screen's right to its
// left, the block keeping the side the boundary has not reached and the gem the side it has passed, by discard, so each
// pixel shows one of them and no pixel a blend; the boundary is the family's (two layers of value-noise fBm, measured
// from depth.fyi), lined with the same icy band (base #D5F6F3, specular #B7C1FF, edge 0.03, mix 0.82, the relief bump).
// The band is lit here by a fixed key and a fresnel rim instead of the physical material's own lights, because the gem's
// colour is our own refraction pass (gemMaterial.ts MAIN), not three's lighting. One uniform switches it all off outside
// the sweep, so a block or a gem at rest draws as before.
import { Color, Vector3, Vector4, type Camera, type PerspectiveCamera } from 'three';
import { TAKEOVER, takeoverP } from '../../../config/takeover.ts';
import { takeoverFragField, takeoverFragPars } from '../../family/three/takeover-glsl.ts';

/** The flight progress (L, 0 to 1) the sweep spans: it starts once the blocks are well clear of the logo and ends before the long settle (Tune-free: Sam's ask is the family's look). */
export const WAVE_L = Object.freeze({ from: 0.4, to: 0.7 });

/** The sweep's boundary for a flight progress: linear in L, so it crosses at the scroll's even pace as the family's step drives it at an even pace. */
export function waveP(L: number): number {
  const raw = Math.min(1, Math.max(0, (L - WAVE_L.from) / (WAVE_L.to - WAVE_L.from)));
  return takeoverP(raw);
}
/** Whether L is inside the sweep: both the block and the gem are drawn there, each on its side. */
export const inWave = (L: number): boolean => L > WAVE_L.from && L < WAVE_L.to;

export interface WaveUniforms {
  uTkOn: { value: number }; uTkSide: { value: number }; uTkP: { value: number }; uTkRect: { value: Vector4 }; uTkPx: { value: number };
  uTkSeed: { value: Vector3 }; uTkRelief: { value: number }; uTkReliefScale: { value: number }; uTkBand: { value: Color }; uTkSpec: { value: Color }; uTkLight: { value: number };
}

/** each stone's noise offset: FNV-1a over 27027 and the family, spread by an xorshift to 0 to 37 per axis (the family's takeoverSeed, kept here so the hero never loads the case types' module) */
function seedOf(fam: string): [number, number, number] {
  let h = 0x811c9dc5;
  for (const ch of `${TAKEOVER.seed}|block|${fam}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  const out: number[] = [];
  for (let i = 0; i < 3; i++) { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; out.push((h / 2 ** 32) * TAKEOVER.seedScale); }
  return out as [number, number, number];
}

/** One model's wave values: side +1 for the outgoing block, -1 for the incoming gem; the seed is the stone's family. */
export function createWaveUniforms(side: 1 | -1, fam: string): WaveUniforms {
  const s = seedOf(fam);
  return {
    uTkOn: { value: 0 }, uTkSide: { value: side }, uTkP: { value: TAKEOVER.pFrom }, uTkRect: { value: new Vector4(0, 1, 0, 1) }, uTkPx: { value: 1 },
    uTkSeed: { value: new Vector3(s[0], s[1], s[2]) }, uTkRelief: { value: TAKEOVER.relief }, uTkReliefScale: { value: TAKEOVER.detailScale * TAKEOVER.reliefFreq },
    uTkBand: { value: new Color(TAKEOVER.band.base) }, uTkSpec: { value: new Color(TAKEOVER.band.specular) }, uTkLight: { value: 0.85 },
  };
}

/** code after an anchor that appears exactly once (three r165's physical shader) */
function after(src: string, anchor: string, code: string): string {
  const i = src.indexOf(anchor);
  if (i < 0 || src.indexOf(anchor, i + anchor.length) >= 0) throw new Error(`wave: the anchor ${anchor} is missing or not unique (three r165's physical shader expected)`);
  return src.slice(0, i + anchor.length) + code + src.slice(i + anchor.length);
}

/** The band's own light: the icy base under a fixed key from the upper left, and its specular colour in a fresnel rim. */
const BAND_LIT = /* glsl */`
uniform vec3 uTkSpec;
vec3 tkBandLit( vec3 n ) {
	float key = clamp( dot( n, normalize( vec3( -0.35, 0.55, 0.76 ) ) ), 0.0, 1.0 );
	float rim = pow( 1.0 - clamp( abs( n.z ), 0.0, 1.0 ), 3.0 );
	return uTkLight * ( uTkBand * ( 0.38 + 0.62 * key ) + uTkSpec * ( 0.18 + 0.82 * rim ) );
}
`;

/**
 * Splices the field, the side's discard and the band's declarations into a physical or standard shader (three r165's
 * anchors). The colour itself is mixed by the caller through waveMix(), where its own colour is final.
 */
export function injectWave(shader: { vertexShader: string; fragmentShader: string }): void {
  let v = shader.vertexShader;
  v = after(v, '#include <common>', '\nvarying vec3 vTkPos;');
  v = after(v, '#include <begin_vertex>', '\n\tvTkPos = transformed;');
  let s = shader.fragmentShader;
  s = after(s, '#include <common>', takeoverFragPars() + BAND_LIT);
  s = after(s, '#include <clipping_planes_fragment>', takeoverFragField());
  shader.vertexShader = v;
  shader.fragmentShader = s;
}
/** GLSL: the band over a final linear colour c (normal and faceDirection are three's own, from normal_fragment_begin). */
export const waveMix = (c: string): string => `( uTkOn > 0.5 ? mix( ${c}, tkBandLit( tkBump( normal, tkSx, tkSy, tkDh, faceDirection ) ), tkMix ) : ${c} )`;

const _c = new Vector3();
/**
 * The sweep's box this frame, in the target's pixels as gl_FragCoord reads them (origin bottom left): a square round the
 * stone's centre, the projected radius r of the larger of the two shapes; and the relief's scale, as the family's.
 */
export function placeWave(U: WaveUniforms, on: boolean, p: number, centre: Vector3, r: number, localR: number, camera: Camera, w: number, h: number): void {
  U.uTkOn.value = on ? 1 : 0;
  if (!on) return;
  U.uTkP.value = p;
  _c.copy(centre).applyMatrix4(camera.matrixWorldInverse);
  const zv = Math.max(1e-3, -_c.z), e5 = (camera as PerspectiveCamera).projectionMatrix.elements[5];
  const rPx = (r * e5 / zv) * h / 2;
  _c.copy(centre).project(camera);
  const cx = (_c.x * 0.5 + 0.5) * w, cy = (_c.y * 0.5 + 0.5) * h;
  U.uTkRect.value.set(cx - rPx, cx + rPx, cy - rPx, cy + rPx);
  U.uTkPx.value = Math.max(1, 2 * rPx);
  // the relief: its noise at 8 x 1.37 per sweep extent in the shape's own space, its strength at the extent's ratio to the form's (TAKEOVER.reliefRef)
  U.uTkReliefScale.value = TAKEOVER.detailScale * TAKEOVER.reliefFreq / Math.max(1e-4, 2 * localR);
  U.uTkRelief.value = TAKEOVER.relief * (2 * r) / TAKEOVER.reliefRef;
}
