// The 3D island entry (FAMILY_3D builds only; docs/specs/family-page.md 5 "First paint", 2.7). Small on purpose: it
// waits for the load event and idle time (or the first pointerdown on the stage), then imports the stage chunk with
// three.js and the case model, and turns every failure into swatch grid mode with the state line of section 5.
import { emit, on } from '../bus.ts';
import { fetchModel } from './model-fetch.ts';
import { glCheck } from './gl-check.ts';

type Island = typeof import('./island.ts');
const H = document.documentElement;
const host = document.getElementById('st3d');
const SLOW_MS = 8000;
const CFG = JSON.parse(document.getElementById('fam-3d')?.textContent ?? '{}') as { mode?: string; lod1?: string };

let attempts = 0, started = false, live = false, slowT = 0, chunkUrl = '';

/**
 * The island chunk. A retry after a failed import re-imports the same hashed chunk with a cache-busting query (?r=1,
 * spec 5), found from the import error or the resource timing entries; a failed dependency chunk stays in the
 * browser's module map, so a second failure asks for a reload.
 */
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
  // no WebGL2, or only a software renderer: grid mode now, with no island chunk and no model downloaded
  const gl = glCheck(import.meta.env.PUBLIC_HERO_HOOKS === '1' && /[?&]render=force(?:&|$)/.test(location.search));
  if (gl !== 'ok') { clearTimeout(slowT); emit('fam:grid', { reason: gl, message: '' }); return; }
  // the model's LOD1 downloads while the island chunk does (the island finds the same request in model-fetch)
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
    await mod.mountIsland(host, () => { live = true; clearTimeout(slowT); emit('fam:slow', { on: false }); emit('fam:live', {}); });
  } catch (e) {
    const reason = (e as { reason?: string }).reason;
    if (reason === 'webgl' || reason === 'software') { clearTimeout(slowT); emit('fam:grid', { reason, message: '' }); return; }
    fail('model');
  }
}

function fail(reason: string): void {
  clearTimeout(slowT);
  started = false;
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
}
// data saver and 2G: the visitor asked for the 3D ("Show in 3D")
on('fam:want3d', () => { H.classList.remove('grid'); H.classList.add('m3d'); void start(); });
