// Post (prototype lines 918 to 942): each scene renders into its own target. The hero's composer blooms the glow but
// keeps the bloom off the black faces: save the clean frame, bloom, then put the faces back. No multisampling (v9.8:
// multisampled half-float targets drew stray lines on some GPUs). Built after setPixelRatio, because EffectComposer
// copies the ratio at construction.
import { HalfFloatType, ShaderMaterial, Vector2, WebGLRenderTarget, type Camera, type Scene, type WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SavePass } from 'three/addons/postprocessing/SavePass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RESTORE_FRAG, RESTORE_VERT } from './shaders.ts';

export interface HeroComposer { c: EffectComposer; b: UnrealBloomPass; save: SavePass }
export interface PlainComposer { c: EffectComposer }

export function makeHeroComposer(renderer: WebGLRenderer, scene: Scene, cam: Camera, bloom: number): HeroComposer {
  const c = new EffectComposer(renderer); c.renderToScreen = false;
  c.addPass(new RenderPass(scene, cam));
  const save = new SavePass(new WebGLRenderTarget(1, 1, { type: HalfFloatType })); c.addPass(save);
  const b = new UnrealBloomPass(new Vector2(256, 256), bloom, 0.22, 0.62); c.addPass(b);
  const restore = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, tClean: { value: null } },
    vertexShader: RESTORE_VERT,
    fragmentShader: RESTORE_FRAG,
  } as unknown as ShaderMaterial);
  c.addPass(restore);
  restore.uniforms.tClean.value = save.renderTarget.texture;
  c.addPass(new OutputPass());
  return { c, b, save };
}

export function makePlainComposer(renderer: WebGLRenderer, scene: Scene, cam: Camera): PlainComposer {
  const c = new EffectComposer(renderer); c.renderToScreen = false;
  c.addPass(new RenderPass(scene, cam));
  c.addPass(new OutputPass());
  return { c };
}
