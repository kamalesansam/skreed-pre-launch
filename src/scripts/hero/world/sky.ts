// The sky dome (prototype lines 561 to 592): the rendered night sky on the inside of a sphere segment that travels with
// the camera, plus a faint galaxy wash in the catalog's Space, Eggplant, Forest and Wine (exception E-1/21/40), only
// lifting what is near black. Stage 1 keeps the prototype's extents; stage 2 narrows them to the class crop (6.5).
import { Color, DoubleSide, BackSide, MathUtils, Mesh, ShaderMaterial, SphereGeometry, type Texture } from 'three';
import { SKY_VERT, skyFrag, type SkySlots } from './shaders.ts';
import { GALAXY } from '../../../config/shades.gen.ts';
import type { HeroParams } from '../../../config/params.ts';

/** Dome extents in degrees: longitude span, top and bottom latitude (architecture 6.5). */
export interface SkyExtents { lon: number; top: number; bot: number }
export const PROTOTYPE_SKY: SkyExtents = { lon: 140, top: 60, bot: -10 };

export function skyGeometry(e: SkyExtents): SphereGeometry {
  const skyLon = MathUtils.degToRad(e.lon);
  return new SphereGeometry(900, 128, 64, Math.PI * 1.5 - skyLon / 2, skyLon, MathUtils.degToRad(90 - e.top), MathUtils.degToRad(e.top - e.bot));
}

export function createSkyDome(tex: Texture, P: HeroParams, extents: SkyExtents = PROTOTYPE_SKY, slots: SkySlots = {}): Mesh<SphereGeometry, ShaderMaterial> {
  const dome = new Mesh(skyGeometry(extents),
    new ShaderMaterial({
      uniforms: { tSky: { value: tex }, uSkyGain: { value: P.skyGain }, uHue: { value: P.hue }, uHueScale: { value: P.hueScale },
        uC1: { value: new Color(GALAXY[0].hex) }, uC2: { value: new Color(GALAXY[1].hex) }, uC3: { value: new Color(GALAXY[2].hex) }, uC4: { value: new Color(GALAXY[3].hex) } },
      vertexShader: SKY_VERT, fragmentShader: skyFrag(slots),
      side: BackSide, depthWrite: false, fog: false }));
  dome.scale.x = -1; dome.rotation.x = MathUtils.degToRad(-2.6);   // keeps the approved planet and Milky Way positions after the floor reframing
  dome.material.side = DoubleSide; dome.renderOrder = -2; dome.frustumCulled = false;
  return dome;
}
