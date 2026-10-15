// The 3D island entry (FAMILY_3D builds only; docs/specs/family-page.md 5 "First paint", 2.7, 20 "The loader"). Small on
// purpose: it waits for the load event and idle time (or the first pointerdown on the stage), then imports the stage
// chunk with three.js and the case models, and turns every failure into swatch grid mode with the state line of
// section 5. The loader (the shell's, with the family milestones) covers the page from first paint in 3D mode; every
// path out of the 3D lifts it at once, so it never traps input.
import { emit, on } from '../bus.ts';
import { fetchModel } from './model-fetch.ts';
import { glCheck } from './gl-check.ts';

type Island = typeof import('./island.ts');
type Loader = { cut(): void; skip(): void; abort(): void; fail(m: string): void; state(): { phase: string; mode: string } };
const H = document.documentElement;
const host = document.getElementById('st3d');
const SLOW_MS = 8000;
const CFG = JSON.parse(document.getElementById('fam-3d')?.textContent ?? '{}') as { mode?: string; lod1?: string; lod1b?: string };
const w = window as unknown as { __skreedLoader?: Loader; __skreedOnPoster?: (kind: string) => void };

let attempts = 0, started = false, live = false, slowT = 0, chunkUrl = '';

/** The loader lifts the moment the page leaves the 3D path (grid mode, a failure), whatever its phase. */
function lift(): void {
  const L = w.__skreedLoader;
  if (!L) return;
  const s = L.state();
  if (s.phase === 'done' || s.phase === 'lift') return;
  if (s.mode === 'poster') L.abort(); else L.skip();
}
// the loader's own stall (20 s without a milestone) and offline rules land in its poster state: the overlay goes; the
// boot carries on, so a slow model still arrives, and a failure still reaches the grid with its line
w.__skreedOnPoster = () => { w.__skreedLoader?.abort(); };

function importIsland(): Promise<Island> {
  if (attempts > 1 && chunkUrl) return import(/* @vite-ignore */ `${chunkUrl}${chunkUrl.includes('?') ? '&' : '?'}r=${attempts - 1}`) as Promise<Island>;
  return import('./island.ts');
}
function failedChunk(e: unknown): string {
  const m = String((e as Error)?.message ?? e).match(/https?:\/\/[^\s'"]+\.js/);
  if (m) return m[0];
  const r = performance.getEntriesByType('resource').map((x) => x.name).find((n) => /\/_astro\/island[.-][\w-]+\.js/.test(n));
  return r ?? '';
}

async function start(): Promise<void> {
  if (started || !host) return;
  started = true;
  attempts++;
  clearTimeout(slowT);
  slowT = window.setTimeout(() => { if (!live) emit('fam:slow', { on: true }); }, SLOW_MS);
  const gl = glCheck(import.meta.env.PUBLIC_HERO_HOOKS === '1' && /[?&]render=force(?:&|$)/.test(location.search));
  if (gl !== 'ok') { clearTimeout(slowT); lift(); emit('fam:grid', { reason: gl, message: '' }); return; }
  // the models' LOD1 download while the island chunk does (the island finds the same requests in model-fetch)
  if (CFG.lod1) fetchModel(CFG.lod1).catch(() => {});
  if (CFG.lod1b) fetchModel(CFG.lod1b).catch(() => {});
  let mod: Island;
  try {
    mod = await importIsland();
  } catch (e) {
    chunkUrl ||= failedChunk(e);
    fail('chunk');
    return;
  }
  try {
    await mod.mountIsland(host, () => { live = true; clearTimeout(slowT); emit('fam:slow', { on: false }); emit('fam:live', {}); });
  } catch (e) {
    const reason = (e as { reason?: string }).reason;
    if (reason === 'webgl' || reason === 'software' || reason === 'slow') { clearTimeout(slowT); lift(); emit('fam:grid', { reason, message: '' }); return; }
    fail('model');
  }
}

function fail(reason: string): void {
  clearTimeout(slowT);
  started = false;
  lift();
  const offline = navigator.onLine === false;
  emit('fam:grid', { reason, message: offline ? 'offline' : attempts > 1 ? 'failedTwice' : 'failed', retry: () => { H.classList.add('m3d'); H.classList.remove('grid'); void start(); } });
  if (offline) addEventListener('online', () => { H.classList.add('m3d'); H.classList.remove('grid'); void start(); }, { once: true });
}

function whenIdle(fn: () => void): void {
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(() => fn(), { timeout: 2000 }) : setTimeout(fn, 1));
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
}

if (H.classList.contains('m3d') && host) {
  whenIdle(() => void start());
  host.parentElement?.addEventListener('pointerdown', () => void start(), { once: true });
} else lift();
// data saver and 2G: the visitor asked for the 3D ("Show in 3D")
on('fam:want3d', () => { H.classList.remove('grid'); H.classList.add('m3d'); void start(); });
