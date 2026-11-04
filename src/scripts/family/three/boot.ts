// The 3D island entry (FAMILY_3D builds only; docs/specs/family-page.md 5 "First paint", 2.7, 20 "The loader"). Small on
// purpose: it waits for the load event and idle time (or the first pointerdown on the stage), then imports the stage
// chunk with three.js and the case models. Since 2026-11-04 (E-3D-only, Sam: "dont have this fallback") no failure leads to
// swatch grid mode: a browser with no WebGL2 gets the site note's "unsupported", and a failed chunk, model or context reloads
// the page once, waits for the connection offline, or shows the site note (shell/note.ts). The loader (the shell's, with the
// family milestones) covers the page from first paint in 3D mode; every path out of the 3D lifts it at once.
import { emit, on } from '../bus.ts';
import { fetchModel } from './model-fetch.ts';
import { glCheck } from './gl-check.ts';
import { failHard, loadedOk, showNote } from '../../shell/note.ts';

type Island = typeof import('./island.ts');
type Loader = { cut(): void; skip(): void; abort(): void; state(): { phase: string } };
const H = document.documentElement;
const host = document.getElementById('st3d');
const SLOW_MS = 8000;
const CFG = JSON.parse(document.getElementById('fam-3d')?.textContent ?? '{}') as { mode?: string; lod1?: string };
const w = window as unknown as { __skreedLoader?: Loader };

let attempts = 0, started = false, live = false, slowT = 0, chunkUrl = '';

/** The loader lifts the moment the page leaves the 3D path (the test builds' grid mode), whatever its phase. */
function lift(): void {
  const L = w.__skreedLoader;
  if (!L) return;
  const s = L.state();
  if (s.phase === 'done' || s.phase === 'lift') return;
  L.skip();
}

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
  // a software renderer runs the 3D (E-3D-only): only no WebGL2 context at all stops it. Test and staging builds keep the
  // harness's SwiftShader in swatch grid mode, as the browser suites were written against it (?render=force runs the 3D)
  const hooks = import.meta.env.PUBLIC_HERO_HOOKS === '1';
  const gl = glCheck(!hooks || /[?&]render=force(?:&|$)/.test(location.search));
  if (gl === 'webgl') { clearTimeout(slowT); showNote('unsupported'); return; }
  if (gl !== 'ok') { clearTimeout(slowT); lift(); emit('fam:grid', { reason: gl, message: '' }); return; }
  // the Tough's LOD1 downloads while the island chunk does (the island finds the same request in model-fetch); the case
  // types' own models load on scroll, never with the first view (family-page.md 24 D2)
  if (CFG.lod1) fetchModel(CFG.lod1).catch(() => {});
  let mod: Island;
  try {
    mod = await importIsland();
  } catch (e) {
    chunkUrl ||= failedChunk(e);
    fail('chunk');
    return;
  }
  try {
    await mod.mountIsland(host, () => { live = true; loadedOk(); clearTimeout(slowT); emit('fam:slow', { on: false }); emit('fam:live', {}); });
  } catch (e) {
    const reason = (e as { reason?: string }).reason;
    if (reason === 'webgl') { clearTimeout(slowT); showNote('unsupported'); return; }
    if (reason === 'software' || reason === 'slow') { clearTimeout(slowT); lift(); emit('fam:grid', { reason, message: '' }); return; }   // test and staging builds only (force is on in production)
    fail('model');
  }
}

function fail(reason: string): void {
  clearTimeout(slowT);
  started = false;
  console.warn('[family] the 3D did not load: ' + reason);
  failHard();
}

function whenIdle(fn: () => void): void {
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(() => fn(), { timeout: 2000 }) : setTimeout(fn, 1));
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
}

if (H.classList.contains('m3d') && host) {
  whenIdle(() => void start());
  host.parentElement?.addEventListener('pointerdown', () => void start(), { once: true });
} else lift();
// the test builds' grid mode (?mode=grid): the visitor asked for the 3D ("Show in 3D")
on('fam:want3d', () => { H.classList.remove('grid'); H.classList.add('m3d'); void start(); });
