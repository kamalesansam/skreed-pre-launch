// Warm-up (prototype v11.4 template.html "Readiness, igloo's upload step re-expressed"; hero-architecture.md 5.3 step
// 20). Every object of the hero scene and the Wall is forced visible and unculled; the intro's uniforms sit at mid
// values so every branch rasterises; programs are linked with the HalfFloat warm-up target bound, so they are the
// variants the composer really uses; every texture is pushed to the GPU; then one draw per material group into an 8 px
// target (c1 logo, c2 sky, c3 ground and stones, c4 fog cards, c5 cage, c6 outline, c7 numbers, c8 links), then the
// hero composer (c9), the Wall's composer under NoToneMapping and the composite at two progress values. One milestone
// per group keeps the loader's count moving. Errors are warned and swallowed, as in the prototype; a dead island still stops here.
import { ACESFilmicToneMapping, HalfFloatType, NoToneMapping, WebGLRenderTarget, type Line, type Material, type Mesh, type Object3D, type Points, type ShaderMaterial } from 'three';
import { yieldFrame } from './util/time.ts';
import { IslandDead } from './bridge/life.ts';
import type { Milestone } from './bridge/loader.ts';
import type { HeroContext } from './types.ts';

export type StallGate = (m: Milestone) => Promise<void>;

type Drawable = Mesh | Line | Points;
const isDrawable = (o: Object3D): o is Drawable => (o as Mesh).isMesh || (o as Line).isLine || (o as Points).isPoints;

export async function warmUp(ctx: HeroContext, resize: () => void, gate: StallGate | null): Promise<void> {
  const { renderer, sceneA, camA, composerA, wall, composite, life, bridge } = ctx;
  const step = async (m: Milestone) => { await yieldFrame(); life.check(); if (gate) await gate(m); bridge.report(m); };
  try {
    const warmRT = new WebGLRenderTarget(8, 8, { type: HalfFloatType }), saved: [Object3D, boolean, boolean, boolean][] = [], vis: Drawable[] = [], groups = new Map<string, Drawable[]>(); let k = 0;
    for (const sc of [sceneA, wall.scene]) sc.traverse((o) => { const m = (o as Mesh).material as Material | undefined; saved.push([o, o.visible, o.frustumCulled, m ? m.visible : false]); o.visible = true; o.frustumCulled = false; if (m) m.visible = true; });
    ctx.intro.warm(ctx);
    renderer.initTexture(ctx.scrollTex);
    sceneA.traverse((o) => { if (!isDrawable(o)) return;
      vis.push(o); const m = o.material as Material; const key = (m as ShaderMaterial).fragmentShader || m.type; if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(o); });
    // one group at a time: link its programs (parallel where the driver can), then draw it. Without parallel compile (SwiftShader,
    // some Safari and Firefox builds) each link blocks, so a milestone per group keeps the loader's watchdog fed.
    for (const g of groups.values()) { for (const o of vis) o.visible = g.includes(o); renderer.setRenderTarget(warmRT);
      await renderer.compileAsync(sceneA, camA); life.check(); renderer.setRenderTarget(warmRT); renderer.render(sceneA, camA); await step(('c' + ++k) as Milestone); }
    for (const o of vis) o.visible = true;
    const B = wall.composer!;
    renderer.setRenderTarget(warmRT); await renderer.compileAsync(wall.scene, wall.camera); life.check(); renderer.setRenderTarget(null); await renderer.compileAsync(composite.scene, composite.camera); life.check();
    renderer.setSize(8, 8, false); composerA.c.setSize(8, 8); B.c.setSize(8, 8); composerA.save.renderTarget.setSize(8, 8);
    composerA.c.render(0); await step(('c' + ++k) as Milestone);
    renderer.toneMapping = NoToneMapping; B.c.render(0); renderer.toneMapping = ACESFilmicToneMapping;
    const C = composite.C;
    C.tA.value = composerA.c.readBuffer.texture; C.tB.value = B.c.readBuffer.texture; renderer.setRenderTarget(null);
    C.uProgress.value = 0.5; renderer.render(composite.scene, composite.camera); C.uProgress.value = 0; renderer.render(composite.scene, composite.camera);
    for (const [o, v, f, m] of saved) { o.visible = v; o.frustumCulled = f; const mat = (o as Mesh).material as Material | undefined; if (mat) mat.visible = m; }
    resize(); warmRT.dispose();
  } catch (e) {
    if (e instanceof IslandDead) throw e;
    console.warn('warm-up', e);
  }
}
