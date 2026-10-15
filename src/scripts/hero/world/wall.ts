// The Wall placeholder (prototype lines 898 to 916; spec D9): the far side of the last wipe (section 2 to the Wall),
// the 240 shades as circle swatches in catalog order on Pearl Whisper, 24 per row (12 on a portrait screen), without the
// placeholder copy. It drifts down by up to 0.8 units over the 1.5 screens after that wipe. Section 3 replaces it.
import { CircleGeometry, Color, InstancedMesh, Matrix4, MeshBasicMaterial, PerspectiveCamera, Scene, type WebGLRenderer } from 'three';
import { SHADE_HEX } from '../../../config/shades.gen.ts';
import { PEARL_WHISPER } from '../../../config/tokens.ts';
import { clamp01 } from '../util/math.ts';
import { S2T } from '../../../config/hero.ts';
import { WIPE } from '../scroll/scrollMap.ts';
import { makePlainComposer, type PlainComposer } from '../post/composer.ts';

export interface WallScene {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  /** built at start-up step 14, after composer A: RenderPass + OutputPass under NoToneMapping */
  composer: PlainComposer | null;
  makeComposer(renderer: WebGLRenderer): void;
  resize(w: number, h: number, aspect: number, portrait: boolean): void;
  update(b: number): void;
  dispose(): void;
}

export function createPlaceholderWall(): WallScene {
  const sceneB = new Scene();
  sceneB.background = new Color(PEARL_WHISPER);
  const camB = new PerspectiveCamera(30, 1, 0.1, 100);
  const wall = new InstancedMesh(new CircleGeometry(0.2, 48), new MeshBasicMaterial(), 240);
  sceneB.add(wall);
  let portrait = false, done = false;
  function layoutWall(p: boolean) {
    const cols = p ? 12 : 24, gap = 0.5, rows = 240 / cols;
    const m4 = new Matrix4(), col = new Color();
    for (let i = 0; i < 240; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      m4.makeTranslation((c - (cols - 1) / 2) * gap, -(r - (rows - 1) / 2) * gap - (p ? 0.9 : 0.6), 0);
      wall.setMatrixAt(i, m4); wall.setColorAt(i, col.set(SHADE_HEX[i]));
    }
    wall.instanceMatrix.needsUpdate = true; wall.instanceColor!.needsUpdate = true;
    camB.position.set(0, 0, p ? 26 : 19); camB.lookAt(0, 0, 0);
  }
  const s2: WallScene = {
    scene: sceneB, camera: camB, composer: null,
    makeComposer(renderer: WebGLRenderer) { s2.composer = makePlainComposer(renderer, sceneB, camB); },
    resize(w, h, asp, p) {
      s2.composer?.c.setSize(w, h);
      camB.aspect = asp; camB.updateProjectionMatrix();
      if (p !== portrait || !done) { portrait = p; layoutWall(p); done = true; }
    },
    update(b) { camB.position.y = -(clamp01((b - S2T.W2 - WIPE) / 1.5)) * 0.8; },   // a slow drift as you scroll through it
    dispose() { wall.geometry.dispose(); wall.material.dispose(); wall.dispose(); },
  };
  return s2;
}
