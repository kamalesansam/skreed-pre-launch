// The composite (prototype lines 987 to 1037; v11: the wipe as a function plus the kept logo and the intro's flat
// night): one full-screen shader wipes from the hero's frame (tA) to section 2's (tB) along igloo's diagonal of ice
// shards and tech blocks, with parallax, displacement and a five-tap chromatic aberration. uCalm (reduced motion) takes
// out the parallax, the displacement and the aberration. With the v11 fragment (slots.full) the uniforms gain uIntro and
// uFlat (the intro) and tH, tM, tS, uKeep, uParA (section 2: the hero frame, the logo mask, section 2's cover).
import { DataTexture, Mesh, OrthographicCamera, PlaneGeometry, RGBAFormat, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget, type Texture } from 'three';
import { COMPOSITE_VERT, compositeFrag, type CompositeSlots } from './shaders.ts';

export function createComposite(scrollTex: Texture, calm: boolean, slots: CompositeSlots = {}) {
  const C = {
    tA: { value: null as Texture | null }, tB: { value: null as Texture | null }, tScroll: { value: scrollTex },
    uProgress: { value: 0 }, uAspect: { value: 1 }, uNoiseOff: { value: new Vector2() }, uCalm: { value: calm ? 1 : 0 },
    uIntro: { value: 1 }, uFlat: { value: new Vector3(5 / 255, 5 / 255, 6 / 255) },   // the loader's night, in output sRGB
    tH: { value: null as Texture | null }, tM: { value: null as Texture | null }, tS: { value: null as Texture | null }, uKeep: { value: 0 }, uParA: { value: 1 },
  };
  const mesh = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
    uniforms: C, depthTest: false, depthWrite: false,
    vertexShader: COMPOSITE_VERT,
    fragmentShader: compositeFrag(slots),
  }));
  const scene = new Scene(); scene.add(mesh);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return { scene, camera, C, mesh };
}
export type Composite = ReturnType<typeof createComposite>;

/** The logo mask the hand-over draws the kept logo through (rtMask), and a transparent 1 px texture for tS when section 2 is off. */
export function createLogoMask() {
  const rt = new WebGLRenderTarget(1, 1);
  const black = new DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, RGBAFormat); black.needsUpdate = true;
  return {
    rt, black,
    resize(w: number, h: number, dpr: number) { rt.setSize(w * dpr, h * dpr); },
    dispose() { rt.dispose(); black.dispose(); },
  };
}
export type LogoMask = ReturnType<typeof createLogoMask>;
