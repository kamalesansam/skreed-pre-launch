// The stage chunk (three.js, the case model, the lineup), imported by boot.ts. It reads the page's own data, builds
// the case asset (PUBLIC_FAMILY_3D=on: the supplier model from the intake's manifest; dev: the procedural stand-in),
// mounts the stage, runs the tier probe, fetches LOD0 after a high verdict and connects the stage to the page module
// through the bus. Colours are read from the shade tokens on :root (shades.gen.css), so no hex is duplicated in script.
import { emit, on } from '../bus.ts';
import { Stage, StageError } from './stage.ts';
import type { CaseAsset } from './case-asset.ts';
import { loadSupplierAsset, type CaseManifest } from './case-glb.ts';
import MANIFEST from '../../../data/case-model.json' with { type: 'json' };
import { SUPPLIER_TUNING } from './pose.ts';
import type { Finish } from '../bus.ts';
import type { Tier } from './finish-materials.ts';

interface PageData { slug: string; first: number; key: number }
const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));
const HOOKS = import.meta.env.PUBLIC_HERO_HOOKS === '1';
/** Folded at build: a supplier build (PUBLIC_FAMILY_3D=on) never carries the stand-in (decision 15). */
const SUPPLIER = import.meta.env.PUBLIC_FAMILY_3D === 'on';

async function loadAsset(signal: AbortSignal): Promise<CaseAsset> {
  if (SUPPLIER) return loadSupplierAsset(MANIFEST as unknown as CaseManifest, signal);
  else { const { buildStandInAsset } = await import('./stand-in-case.ts'); return buildStandInAsset(); }
}

export async function mountIsland(host: HTMLElement, onLive: () => void): Promise<void> {
  const H = document.documentElement;
  const D = JSON.parse(document.getElementById('fam-data')!.textContent!) as PageData;
  const root = getComputedStyle(H);
  const shades = Array.from({ length: 24 }, (_, i) => ({ hex: root.getPropertyValue(`--shade-${D.slug}-${String(i + 1).padStart(2, '0')}`).trim() }));
  const sel = Number(H.dataset.shade) - D.first;
  const finish: Finish = H.dataset.finish === 'gloss' ? 'gloss' : 'matte';
  const q = new URLSearchParams(location.search);
  const force = HOOKS && q.get('render') === 'force';
  const forcedTier = HOOKS && (q.get('tier') === 'high' || q.get('tier') === 'low') ? (q.get('tier') as Tier) : undefined;
  const ac = new AbortController();
  await yieldToMain();
  const asset = await loadAsset(ac.signal);
  await yieldToMain();
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  host.append(canvas);
  let stage: Stage;
  let warmPrograms = -1;
  let detail: 'none' | 'loading' | 'loaded' | 'failed' = asset.detail === 'loaded' ? 'loaded' : 'none';
  const offs: (() => void)[] = [];
  let disposed = false;
  const dispose = () => { if (disposed) return; disposed = true; ac.abort(); offs.forEach((f) => f()); stage?.dispose(); asset.dispose(); canvas.remove(); };
  try {
    stage = new Stage(host, canvas, asset, {
      shades, selected: Number.isInteger(sel) && sel >= 0 && sel < 24 ? sel : D.key, finish,
      still: H.classList.contains('still3d'), force,
      // hook builds may override the tuning for measurement runs: ?tune=fan:72,Sphone:1.3
      tuning: { ...(asset.source === 'supplier' ? SUPPLIER_TUNING : {}), ...(HOOKS ? Object.fromEntries((q.get('tune') ?? '').split(',').filter(Boolean).map((kv) => { const [k, v] = kv.split(':'); return [k, Number(v)]; })) : {}) },
      tier: forcedTier,
      hold: HOOKS && q.get('pose') === 'poster',
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
  const verdict = await stage.start();
  if (verdict === 'grid') { dispose(); throw new StageError('software', 'the low tier is still too slow'); }
  // LOD0 only after a high verdict, so a low-tier phone never downloads it (2.5 "Tiers")
  if (verdict === 'high' && asset.detail === 'deferred') {
    detail = 'loading';
    asset.loadDetail().then((parts) => { if (disposed) return; detail = 'loaded'; stage.setDetail(parts); }, () => { detail = 'failed'; emit('fam:detail', { ok: false }); });
  }
  const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  idle(() => { void stage.warmUp().then((n) => { warmPrograms = n; }); });
  const onHide = (e: PageTransitionEvent) => { if (!e.persisted) dispose(); };
  addEventListener('pagehide', onHide);
  offs.push(() => removeEventListener('pagehide', onHide));
  // back-forward cache: the stage keeps its context; if the browser dropped it, the restore path rebuilds
  const onShow = (e: PageTransitionEvent) => { if (e.persisted && !disposed && stage.renderer.getContext().isContextLost()) { canvas.classList.remove('on'); } else if (e.persisted) stage.kick(); };
  addEventListener('pageshow', onShow);
  offs.push(() => removeEventListener('pageshow', onShow));
  if (HOOKS) {
    (window as unknown as { __famStage: unknown }).__famStage = {
      info: () => { const i = stage.renderer.info; return { calls: i.render.calls, triangles: i.render.triangles, frame: i.render.frame, programs: i.programs?.length ?? 0, geometries: i.memory.geometries, textures: i.memory.textures, warmPrograms }; },
      pickAt: (x: number, y: number) => stage.pickAt(x, y),
      state: () => ({ ...stage.state(), detail, probe: stage.probeResult }),
      project: (slot: number) => stage.project(slot),
      slotBox: (slot: number) => stage.slotBox(slot),
      render: () => stage.render(),
      /** the canvas as a PNG data URL, read in the same task as its render (the poster renderer) */
      snapshot: () => { stage.render(); return canvas.toDataURL('image/png'); },
      lose: () => stage.renderer.getContext().getExtension('WEBGL_lose_context'),
      dispose,
      disposed: () => disposed,
      source: asset.source,
      dims: asset.dims,
    };
  }
}
