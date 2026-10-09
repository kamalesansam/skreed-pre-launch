// The stage chunk (three.js, the case model, the lineup), imported by boot.ts. It reads the page's own data, builds
// the case asset (PUBLIC_FAMILY_3D=dev: the procedural stand-in; the supplier GLB path arrives with run 2 and its
// manifest), mounts the stage and connects it to the page module through the bus. Colours are read from the shade
// tokens on :root (shades.gen.css), so no hex is duplicated in script.
import { emit, on } from '../bus.ts';
import { Stage, StageError } from './stage.ts';
import { buildStandInAsset } from './stand-in-case.ts';
import type { Finish } from '../bus.ts';

interface PageData { slug: string; first: number; key: number }
const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));

export async function mountIsland(host: HTMLElement, onLive: () => void): Promise<void> {
  const H = document.documentElement;
  const D = JSON.parse(document.getElementById('fam-data')!.textContent!) as PageData;
  const cfg = JSON.parse(document.getElementById('fam-3d')?.textContent ?? '{}') as { mode?: string };
  if (cfg.mode !== 'dev') throw new StageError('webgl', 'the supplier model path is not built yet (run 2)');
  const root = getComputedStyle(H);
  const shades = Array.from({ length: 24 }, (_, i) => ({ hex: root.getPropertyValue(`--shade-${D.slug}-${String(i + 1).padStart(2, '0')}`).trim() }));
  const sel = Number(H.dataset.shade) - D.first;
  const finish: Finish = H.dataset.finish === 'gloss' ? 'gloss' : 'matte';
  const force = import.meta.env.PUBLIC_HERO_HOOKS === '1' && /[?&]render=force(?:&|$)/.test(location.search);
  await yieldToMain();
  const asset = buildStandInAsset();
  await yieldToMain();
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  host.append(canvas);
  let stage: Stage;
  let warmPrograms = -1;
  const offs: (() => void)[] = [];
  const dispose = () => { offs.forEach((f) => f()); stage?.dispose(); asset.dispose(); canvas.remove(); };
  try {
    stage = new Stage(host, canvas, asset, {
      shades, selected: Number.isInteger(sel) && sel >= 0 && sel < 24 ? sel : D.key, finish,
      still: H.classList.contains('still3d'), force,
      onPick: (i, input, dragging) => emit('fam:pick', { i, input, dragging }),
      onLive,
      onLost: () => { dispose(); emit('fam:grid', { reason: 'context', message: '' }); },
    });
  } catch (e) {
    canvas.remove();
    asset.dispose();
    throw e;
  }
  offs.push(on('fam:select', ({ i, instant }) => stage.setTarget(i, instant)));
  offs.push(on('fam:finish', ({ finish: f }) => stage.setFinish(f)));
  await yieldToMain();
  stage.kick();
  const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  idle(() => { void stage.warmUp().then((n) => { warmPrograms = n; }); });
  const onHide = (e: PageTransitionEvent) => { if (!e.persisted) dispose(); };
  addEventListener('pagehide', onHide);
  offs.push(() => removeEventListener('pagehide', onHide));
  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') {
    (window as unknown as { __famStage: unknown }).__famStage = {
      info: () => { const i = stage.renderer.info; return { calls: i.render.calls, triangles: i.render.triangles, frame: i.render.frame, programs: i.programs?.length ?? 0, geometries: i.memory.geometries, textures: i.memory.textures, warmPrograms }; },
      pickAt: (x: number, y: number) => stage.pickAt(x, y),
      state: () => stage.state(),
      project: (slot: number) => stage.project(slot),
      render: () => stage.render(),
      lose: () => stage.renderer.getContext().getExtension('WEBGL_lose_context'),
      dispose,
      source: asset.source,
    };
  }
}
