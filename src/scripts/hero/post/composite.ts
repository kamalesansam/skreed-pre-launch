// The composite (prototype lines 987 to 1037): one full-screen shader wipes from the hero's frame (tA) to section 2's
// (tB) along igloo's diagonal of ice shards and tech blocks, with parallax, displacement and a five-tap chromatic
// aberration. uCalm (reduced motion) takes out the parallax, the displacement and the aberration.
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, type Texture } from 'three';
import { COMPOSITE_VERT, compositeFrag, type CompositeSlots } from './shaders.ts';

export function createComposite(scrollTex: Texture, calm: boolean, slots: CompositeSlots = {}) {
  const C = {
    tA: { value: null as Texture | null }, tB: { value: null as Texture | null }, tScroll: { value: scrollTex },
    uProgress: { value: 0 }, uAspect: { value: 1 }, uNoiseOff: { value: new Vector2() }, uCalm: { value: calm ? 1 : 0 },
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
