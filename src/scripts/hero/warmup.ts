// Warm-up (prototype lines 1381 to 1399; hero-architecture.md 5.3 step 20). compileAsync links every program of the hero
// scene, then one draw of each material group into an 8 px buffer under the loader, because some drivers (SwiftShader,
// some mobile GPUs) build their pipelines and upload textures at the first draw, not at link: that work lands here, one
// milestone per group (c1 logo, c2 sky, c3 ground and stones, c4 fog cards, c5 links), then the bloom composer (c6).
// Errors are warned and swallowed, as in the prototype; a dead island still stops here.
import { WebGLRenderTarget, type Line, type Material, type Mesh, type Object3D, type ShaderMaterial } from 'three';
import { yieldFrame } from './util/time.ts';
import { IslandDead } from './bridge/life.ts';
import type { Milestone } from './bridge/loader.ts';
import type { HeroContext } from './types.ts';

export type StallGate = (m: Milestone) => Promise<void>;

export async function warmUp(ctx: HeroContext, resize: () => void, gate: StallGate | null): Promise<void> {
  const { renderer, sceneA, camA, composerA, section2, composite, life, bridge } = ctx;
  const step = async (m: Milestone) => { await yieldFrame(); life.check(); if (gate) await gate(m); bridge.report(m); };
  try {
    await renderer.compileAsync(sceneA, camA); life.check();
    await renderer.compileAsync(composite.scene, composite.camera); life.check();
    const warmRT = new WebGLRenderTarget(8, 8), vis: Object3D[] = [], groups = new Map<string, Object3D[]>(); let k = 0;
    sceneA.traverse((o) => {
      if (!((o as Mesh).isMesh || (o as Line).isLine) || !o.visible) return; for (let q = o.parent; q; q = q.parent) if (!q.visible) return;
      vis.push(o); const m = (o as Mesh).material as Material; const key = (m as ShaderMaterial).fragmentShader || m.type;
      if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(o);
    });
    for (const g of groups.values()) { for (const o of vis) o.visible = g.includes(o); renderer.setRenderTarget(warmRT); renderer.render(sceneA, camA); await step(('c' + ++k) as Milestone); }
    for (const o of vis) o.visible = true;
    const B = section2.composer!;
    renderer.setSize(8, 8, false); composerA.c.setSize(8, 8); B.c.setSize(8, 8); composerA.save.renderTarget.setSize(8, 8);
    composerA.c.render(0); await step(('c' + ++k) as Milestone);
    B.c.render(0); composite.C.tA.value = composerA.c.readBuffer.texture; composite.C.tB.value = B.c.readBuffer.texture; renderer.setRenderTarget(null); renderer.render(composite.scene, composite.camera);
    resize(); warmRT.dispose();
  } catch (e) {
    if (e instanceof IslandDead) throw e;
    console.warn('warm-up', e);
  }
}
