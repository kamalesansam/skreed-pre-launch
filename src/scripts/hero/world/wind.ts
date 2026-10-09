// The wind-noise tile (prototype lines 712 to 768): generated once on the GPU, 256 px, repeating, trilinear mips. The fog
// cards and the ground mist sample it. One synchronous render.
import { LinearFilter, LinearMipmapLinearFilter, Mesh, OrthographicCamera, PlaneGeometry, RepeatWrapping, Scene, ShaderMaterial,
  UnsignedByteType, Vector2, WebGLRenderTarget, type WebGLRenderer } from 'three';
import { WIND_FRAG, WIND_VERT } from './shaders.ts';

export function bakeWindTexture(renderer: WebGLRenderer): WebGLRenderTarget {
  const windRT = new WebGLRenderTarget(256, 256, { wrapS: RepeatWrapping, wrapT: RepeatWrapping, generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter, magFilter: LinearFilter, type: UnsignedByteType });
  const bake = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
    uniforms: { uPeriod: { value: new Vector2(3, 5) }, uWarp: { value: 0.6 }, uEmboss: { value: 0.3 }, uHeightMix: { value: 0.6 },
      uOctGain: { value: 0.45 }, uSeed: { value: 0 }, uNorm: { value: new Vector2(1.338, -0.176) } },
    vertexShader: WIND_VERT, fragmentShader: WIND_FRAG, depthTest: false, depthWrite: false }));
  const bs = new Scene(); bs.add(bake); const bc = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  renderer.setRenderTarget(windRT); renderer.render(bs, bc); renderer.setRenderTarget(null);
  bake.geometry.dispose(); bake.material.dispose();
  return windRT;
}
