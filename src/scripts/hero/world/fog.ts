// Moving fog, re-created from igloo's smoke (prototype lines 769 to 878 and 1353 to 1362): four vertical cards sample
// three drifting taps of the wind tile, multiplied, so the wisps boil rather than slide. FOG.uTime is the same object as
// the logo's uTime, and the cards share the FOG uniform objects by reference (architecture 5.1).
import { Color, MathUtils, Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3, Vector4, type PerspectiveCamera, type Texture, type WebGLRenderer } from 'three';
import { FOG_FRAG, FOG_VERT } from './shaders.ts';
import { PEARL_WHISPER } from '../../../config/tokens.ts';
import type { HeroParams } from '../../../config/params.ts';

export function createFogUniforms(windTex: Texture, uTime: { value: number }, P: HeroParams) {
  return {
    tWindProc: { value: windTex }, uTime,
    uTileMul: { value: P.fogSize }, uSpeed: { value: P.fogSpeed }, uRise: { value: 1 }, uGain: { value: 8 }, uHaze: { value: 0.03 },
    uDensity: { value: P.fog }, uMaxAlpha: { value: 0.45 }, uOpacity: { value: 1 }, uEdgeX: { value: 0.2 }, uBottomRamp: { value: 0.1 },
    uTopFade: { value: P.fogHug }, uSoftDepth: { value: 3 }, uNearStart: { value: 6 }, uNearEnd: { value: 12 }, uFarStart: { value: 220 }, uFarEnd: { value: 420 },
    uGrazing: { value: 0.25 }, uFogColor: { value: new Color(PEARL_WHISPER) }, uFogBright: { value: P.fogBright }, uLift: { value: 0.35 },
    uLogoRect: { value: new Vector4(0.5, 0.5, 0.2, 0.3) }, uLogoClear: { value: 0.8 }, uLogoSoft: { value: 0.35 }, uResolution: { value: new Vector2(1, 1) },
    uGMAmount: { value: P.mist }, uGMScale: { value: 0.1 }, uGMVelX: { value: 0.25 * P.mistSpeed }, uGMVelZ: { value: 0.3 * P.mistSpeed },
    uGMNear: { value: 6 }, uGMFar: { value: 140 }, uGMLitOnly: { value: 0.6 },
  };
}
export type FogUniforms = ReturnType<typeof createFogUniforms>;

/** [z, width, height, tile, phase, front, yaw in degrees] (architecture 5.5) */
const CARDS: [number, number, number, [number, number], number, number, number][] = [
  [9, 44, 1.8, [5.8, 2.9], 0.0, 1, 4], [-10, 90, 3.5, [13.1, 6.5], 0.914, 0, -6], [-45, 170, 7.0, [26.5, 13.3], 2.31, 0, 3], [-150, 440, 18.0, [67.0, 33.5], 4.07, 0, 0]];

export function createFogCards(FOG: FogUniforms): Mesh[] {
  return CARDS.map(([z, w, h, tile, phase, front, yaw]) => {
    const mat = new ShaderMaterial({
      uniforms: { ...FOG, uTile: { value: new Vector2(...tile) }, uPhase: { value: phase }, uFront: { value: front } },
      vertexShader: FOG_VERT, fragmentShader: FOG_FRAG, transparent: true, depthWrite: false, fog: false });
    const card = new Mesh(new PlaneGeometry(w, h), mat);
    card.userData = { z, h }; card.rotation.y = MathUtils.degToRad(yaw); card.renderOrder = 2; card.frustumCulled = false;
    return card;
  });
}

/** Each card's bottom edge sits 0.15 x its height below the ground at its depth. */
export function placeFogCards(cards: Mesh[], groundAt: ((x: number, z: number) => number) | null): void {
  for (const c of cards) { const gy = groundAt ? groundAt(0, c.userData.z) : -4.35; c.position.set(0, gy - 0.15 * c.userData.h + c.userData.h / 2, c.userData.z); }
}

const _lp = new Vector3();
const CORNERS: [number, number][] = [[-2.8, -3.05], [2.8, -3.05], [-2.8, 3.05], [2.8, 3.05]];
/** Where the logo sits on screen (so the front card thins over it), and the drawing-buffer size (frame step F13). */
export function updateFogLogoRect(FOG: FogUniforms, cam: PerspectiveCamera, logoY: number, renderer: WebGLRenderer): void {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const [lx, ly] of CORNERS) {
    _lp.set(lx, ly + logoY, 0).project(cam); const u = _lp.x * 0.5 + 0.5, v = _lp.y * 0.5 + 0.5;
    x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v);
  }
  FOG.uLogoRect.value.set((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2);
  renderer.getDrawingBufferSize(FOG.uResolution.value);
}
