// The stage chunk (three.js, the case models, the stage), imported by boot.ts. It reads the page's own data, loads the
// Tough case (PUBLIC_FAMILY_3D=on: the Cobalt from the intake's manifest; dev: the procedural stand-in), reports the
// loader's milestones, mounts the stage, fetches LOD0 after a high verdict and connects the stage to the page module
// through the bus. Round 6 (docs/specs/family-page.md 24 D2): the case types' own models (MagTough, Snap, Armor) load
// once the scroll first passes 0.5 screens, one after another in beat order, each handed to the stage as it lands; a
// model that fails keeps the case before it through its beat, with no error on screen. Colours are read from the shade
// tokens on :root.
import { emit, on } from '../bus.ts';
import { createStage, StageError, type StageApi, type Tier, type TypeCase } from './stage.ts';
import type { CaseAsset } from './case-asset.ts';
import { loadSupplierAsset, typeEntries, type CaseManifest } from './case-glb.ts';
import MANIFEST from '../../../data/case-model.json' with { type: 'json' };
import { WIDE_MQ, type CaseType } from './pose.ts';
import type { Finish } from '../bus.ts';
import { reducedMQ } from '../../motion.ts';
import { failHard } from '../../shell/note.ts';

interface PageData { slug: string; first: number; key: number }
const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));
const HOOKS = import.meta.env.PUBLIC_HERO_HOOKS === '1';
/** Folded at build: a supplier build (PUBLIC_FAMILY_3D=on) never carries the stand-in (decision 15). */
const SUPPLIER = import.meta.env.PUBLIC_FAMILY_3D === 'on';
const M = MANIFEST as unknown as CaseManifest;
/** The scroll (in screens) past which the type models load: the zoom begins there, and nothing of them loads on the carousel (D2). */
const TYPES_FROM = 0.5;
type Loader = { cut(): void; skip(): void; abort(): void; state(): { phase: string; mode: string } };
const w = window as unknown as { __skreedLoaderReport?: (m: string) => void; __skreedLoader?: Loader; __skreedLogo?: { intro(d: number): void }; __famStage?: unknown };
const report = (m: string) => { w.__skreedLoaderReport?.(m); };

async function loadTough(signal: AbortSignal): Promise<CaseAsset> {
  if (SUPPLIER) {
    const tough = await loadSupplierAsset(M, signal);
    report('lod1');
    return tough;
  }
  const { buildStandInAsset } = await import('./stand-in-case.ts');
  const tough = buildStandInAsset();
  report('lod1');
  return tough;
}

export async function mountIsland(host: HTMLElement, onLive: () => void): Promise<void> {
  const H = document.documentElement;
  const D = JSON.parse(document.getElementById('fam-data')!.textContent!) as PageData;
  const root = getComputedStyle(H);
  const shades = Array.from({ length: 24 }, (_, i) => root.getPropertyValue(`--shade-${D.slug}-${String(i + 1).padStart(2, '0')}`).trim());
  const sel = Number(H.dataset.shade) - D.first;
  const finish: Finish = H.dataset.finish === 'gloss' ? 'gloss' : 'matte';
  const q = new URLSearchParams(location.search);
  // a software renderer and a slow frame run the 3D in production since 2026-11-04 (E-3D-only); test and staging builds keep
  // the harness's SwiftShader out unless ?render=force, as the browser suites were written against it
  const force = !HOOKS || q.get('render') === 'force';
  const forcedTier = HOOKS && (q.get('tier') === 'high' || q.get('tier') === 'low') ? (q.get('tier') as Tier) : undefined;
  const ac = new AbortController();
  report('import');
  await yieldToMain();
  const tough = await loadTough(ac.signal);
  await yieldToMain();
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  host.append(canvas);
  const mqWide = matchMedia(WIDE_MQ), mqFine = matchMedia('(pointer: fine)'), mqCoarse = matchMedia('(pointer: coarse)');
  const offs: (() => void)[] = [];
  const typeAssets = new Map<TypeCase, CaseAsset>();
  let stage: StageApi | null = null, disposed = false;
  const dispose = () => { if (disposed) return; disposed = true; ac.abort(); offs.forEach((f) => f()); stage?.dispose(); tough.dispose(); typeAssets.forEach((a) => a.dispose()); canvas.remove(); delete w.__famStage; };
  try {
    stage = await createStage({
      host, canvas, tough, shades, selected: Number.isInteger(sel) && sel >= 0 && sel < 24 ? sel : D.key, finish,
      still: H.classList.contains('still3d') || reducedMQ.matches,
      force, tier: forcedTier, aces: HOOKS && q.get('tm') === '1', hold: HOOKS && q.get('pose') === 'poster',
      layout: () => (mqWide.matches ? 'wide' : 'phone'), fine: () => mqFine.matches, coarse: () => mqCoarse.matches,
      report,
      onPick: (i, input, dragging) => emit('fam:pick', { i, input, dragging }),
      onTurn: (side) => emit('fam:turn', { side }),
      onLive,
      onLost: () => { dispose(); failHard(); },   // a reload or the site note, never the grid (E-3D-only)
    });
  } catch (e) {
    canvas.remove();
    tough.dispose();
    throw e;
  }
  const S = stage;
  // the case types' own models (D2): LOD1 of each in beat order, each handed to the stage as it lands, then LOD0 of
  // each after a high verdict; a failure is kept for the hooks and leaves the case before it, with nothing on screen
  const TYPES = SUPPLIER ? typeEntries(M) : [];
  const typeFailed = new Map<TypeCase, string>(), typeDetailFailed = new Set<TypeCase>();
  let typesStarted = false;
  const loadTypes = async () => {
    if (typesStarted || !TYPES.length || disposed) return;
    typesStarted = true;
    for (const [key, entry] of TYPES) {
      if (disposed) return;
      try {
        const a = await loadSupplierAsset(entry, ac.signal);
        if (disposed) { a.dispose(); return; }
        typeAssets.set(key, a);
        await S.addType(key, a);
      } catch (e) { if (!disposed) typeFailed.set(key, String((e as Error)?.message ?? e)); }
    }
    if (S.tier() !== 'high') return;
    for (const [key, a] of typeAssets) {
      if (disposed) return;
      if (a.detail !== 'deferred') continue;
      try { const p = await a.loadDetail(); if (!disposed) S.setDetail(key, p); } catch { typeDetailFailed.add(key); }
    }
  };
  const onScrolled = (sv: number) => { if (sv > TYPES_FROM) void loadTypes(); };
  offs.push(on('fam:select', ({ i, instant }) => S.setTarget(i, instant)));
  offs.push(on('fam:finish', ({ finish: f }) => S.setFinish(f)));
  offs.push(on('fam:scroll', ({ sv, tight }) => { S.scroll(sv, tight); onScrolled(sv); }));
  // a page that opens past the carousel (a reload or a link deep in the page): the stage starts where the page is and
  // the type models load at once (D2)
  const sv0 = innerHeight > 0 ? scrollY / innerHeight : 0;
  if (sv0 > 0) S.snapScroll(sv0);
  // LOD0 only after a high verdict, so a low-tier phone never downloads it (2.5 "Tiers")
  const lod0 = async () => {
    if (S.tier() !== 'high') { S.setDetailState('none'); report('lod0'); return; }
    S.setDetailState('loading');
    try {
      if (tough.detail === 'deferred') S.setDetail('tough', await tough.loadDetail());
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
  onScrolled(sv0);
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
      project: (slot: number, local?: [number, number, number]) => S.project(slot, local),
      caseBox: () => S.caseBox(),
      pickAt: (x: number, y: number) => S.pickAt(x, y),
      render: () => S.render(),
      snapshot: () => S.snapshot(),
      snapScroll: (v: number) => S.snapScroll(v),
      sample: (slot?: number, local?: [number, number, number]) => S.sample(slot, local),
      calibrate: (ly?: number) => S.calibrate(ly),
      lose: () => S.lose(),
      /** section 24 D10: pins a run from one case type to another at a raw progress (0 to 1) for frames; null releases it */
      holdTakeover: (from: CaseType, to: CaseType, raw: number | null) => S.holdTakeover(from, to, raw),
      /** the type models: drawn by the stage, failed (with the reason), and those whose LOD0 failed */
      types: () => ({ listed: TYPES.map(([k]) => k), started: typesStarted, loaded: S.types(), failed: Object.fromEntries(typeFailed), detailFailed: [...typeDetailFailed] }),
      dispose,
      disposed: () => disposed,
      source: tough.source,
      dims: tough.dims,
    };
  }
}
export { StageError };
