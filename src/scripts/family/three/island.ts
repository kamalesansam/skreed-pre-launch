// The stage chunk (three.js, the case models, the stage), imported by boot.ts. It reads the page's own data, loads the
// models (PUBLIC_FAMILY_3D=on: the Cobalt and the Desert stand-in from the intake's manifest; dev: the procedural
// stand-in, one model), reports the loader's milestones, mounts the stage, fetches LOD0 after a high verdict and
// connects the stage to the page module through the bus. Colours are read from the shade tokens on :root.
import { emit, on } from '../bus.ts';
import { createStage, StageError, type StageApi, type Tier } from './stage.ts';
import type { CaseAsset, CasePart } from './case-asset.ts';
import { loadSupplierAsset, type CaseManifest } from './case-glb.ts';
import MANIFEST from '../../../data/case-model.json' with { type: 'json' };
import { WIDE_MQ } from './pose.ts';
import type { Finish } from '../bus.ts';

interface PageData { slug: string; first: number; key: number }
const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));
const HOOKS = import.meta.env.PUBLIC_HERO_HOOKS === '1';
/** Folded at build: a supplier build (PUBLIC_FAMILY_3D=on) never carries the stand-in (decision 15). */
const SUPPLIER = import.meta.env.PUBLIC_FAMILY_3D === 'on';
const M = MANIFEST as unknown as CaseManifest;
type Loader = { cut(): void; skip(): void; abort(): void; state(): { phase: string; mode: string } };
const w = window as unknown as { __skreedLoaderReport?: (m: string) => void; __skreedLoader?: Loader; __skreedLogo?: { intro(d: number): void }; __famStage?: unknown };
const report = (m: string) => { w.__skreedLoaderReport?.(m); };

async function loadAssets(signal: AbortSignal): Promise<{ tough: CaseAsset; second: CaseAsset | null }> {
  if (SUPPLIER) {
    const tough = await loadSupplierAsset(M, signal);
    report('lod1');
    const second = M.magtough ? await loadSupplierAsset(M.magtough, signal).catch(() => null) : null;   // the stand-in is an upgrade: without it the Tough case stays through the beats
    return { tough, second };
  }
  const { buildStandInAsset } = await import('./stand-in-case.ts');
  const tough = buildStandInAsset();
  report('lod1');
  return { tough, second: null };
}

export async function mountIsland(host: HTMLElement, onLive: () => void): Promise<void> {
  const H = document.documentElement;
  const D = JSON.parse(document.getElementById('fam-data')!.textContent!) as PageData;
  const root = getComputedStyle(H);
  const shades = Array.from({ length: 24 }, (_, i) => root.getPropertyValue(`--shade-${D.slug}-${String(i + 1).padStart(2, '0')}`).trim());
  const sel = Number(H.dataset.shade) - D.first;
  const finish: Finish = H.dataset.finish === 'gloss' ? 'gloss' : 'matte';
  const q = new URLSearchParams(location.search);
  const force = HOOKS && q.get('render') === 'force';
  const forcedTier = HOOKS && (q.get('tier') === 'high' || q.get('tier') === 'low') ? (q.get('tier') as Tier) : undefined;
  const ac = new AbortController();
  report('import');
  await yieldToMain();
  const { tough, second } = await loadAssets(ac.signal);
  await yieldToMain();
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  host.append(canvas);
  const mqWide = matchMedia(WIDE_MQ), mqFine = matchMedia('(pointer: fine)'), mqCoarse = matchMedia('(pointer: coarse)');
  const offs: (() => void)[] = [];
  let stage: StageApi | null = null, disposed = false;
  const dispose = () => { if (disposed) return; disposed = true; ac.abort(); offs.forEach((f) => f()); stage?.dispose(); tough.dispose(); second?.dispose(); canvas.remove(); delete w.__famStage; };
  try {
    stage = await createStage({
      host, canvas, tough, second, shades, selected: Number.isInteger(sel) && sel >= 0 && sel < 24 ? sel : D.key, finish,
      still: H.classList.contains('still3d') || matchMedia('(prefers-reduced-motion: reduce)').matches,
      force, tier: forcedTier, aces: HOOKS && q.get('tm') === '1', hold: HOOKS && q.get('pose') === 'poster',
      layout: () => (mqWide.matches ? 'wide' : 'phone'), fine: () => mqFine.matches, coarse: () => mqCoarse.matches,
      report,
      onPick: (i, input, dragging) => emit('fam:pick', { i, input, dragging }),
      onTurn: (side) => emit('fam:turn', { side }),
      onLive,
      onLost: () => { dispose(); emit('fam:grid', { reason: 'context', message: '' }); },
    });
  } catch (e) {
    canvas.remove();
    tough.dispose(); second?.dispose();
    throw e;
  }
  const S = stage;
  offs.push(on('fam:select', ({ i, instant }) => S.setTarget(i, instant)));
  offs.push(on('fam:finish', ({ finish: f }) => S.setFinish(f)));
  offs.push(on('fam:scroll', ({ sv }) => S.scroll(sv)));
  // LOD0 only after a high verdict, so a low-tier phone never downloads it (2.5 "Tiers")
  const lod0 = async () => {
    if (S.tier() !== 'high') { S.setDetailState('none'); report('lod0'); return; }
    S.setDetailState('loading');
    try {
      const jobs: Promise<void>[] = [];
      if (tough.detail === 'deferred') jobs.push(tough.loadDetail().then((p: CasePart[]) => S.setDetail('tough', p)));
      if (second && second.detail === 'deferred') jobs.push(second.loadDetail().then((p: CasePart[]) => S.setDetail('second', p)));
      await Promise.all(jobs);
      S.setDetailState('loaded');
    } catch { S.setDetailState('failed'); emit('fam:detail', { ok: false }); }
    report('lod0');
  };
  await yieldToMain();
  // the stage goes live on its first frame (the loader counts to 100 on it, then lifts); LOD0 follows in the background
  S.start();
  // the loader's cut: the fill snaps full and the dim and lift run (the hero's own timing, about 2.3 s)
  const L = w.__skreedLoader;
  if (L && L.state().phase === 'load') L.cut();
  void lod0();
  const onHide = (e: PageTransitionEvent) => { if (!e.persisted) dispose(); };
  addEventListener('pagehide', onHide);
  offs.push(() => removeEventListener('pagehide', onHide));
  const onShow = (e: PageTransitionEvent) => { if (e.persisted && !disposed) S.kick(); };
  addEventListener('pageshow', onShow);
  offs.push(() => removeEventListener('pageshow', onShow));
  if (HOOKS) {
    w.__famStage = {
      info: () => S.info(),
      state: () => S.state(),
      project: (slot: number) => S.project(slot),
      caseBox: () => S.caseBox(),
      pickAt: (x: number, y: number) => S.pickAt(x, y),
      render: () => S.render(),
      snapshot: () => S.snapshot(),
      snapScroll: (v: number) => S.snapScroll(v),
      sample: (slot?: number) => S.sample(slot),
      calibrate: (ly?: number) => S.calibrate(ly),
      lose: () => S.lose(),
      dispose,
      disposed: () => disposed,
      source: tough.source,
      second: !!second,
      dims: tough.dims,
    };
  }
}
export { StageError };
