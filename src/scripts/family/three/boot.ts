// The 3D island entry (FAMILY_3D builds only; docs/specs/family-page.md 5 "First paint", 2.7). Small on purpose: it
// waits for the load event and idle time (or the first pointerdown on the stage), then imports the stage chunk with
// three.js and the case model, and turns every failure into swatch grid mode with the state line of section 5.
import { emit, on } from '../bus.ts';

type Island = typeof import('./island.ts');
const H = document.documentElement;
const host = document.getElementById('st3d');
const SLOW_MS = 8000;

let attempts = 0, started = false, live = false, slowT = 0;

async function start(): Promise<void> {
  if (started || !host) return;
  started = true;
  attempts++;
  clearTimeout(slowT);
  slowT = window.setTimeout(() => { if (!live) emit('fam:slow', { on: true }); }, SLOW_MS);
  let mod: Island;
  try {
    // "Try again" imports once more; a failed chunk can stay in the browser's module map, so a second failure asks
    // for a reload (spec 5). The cache-busting re-import of the hashed chunk is run 2 work with the real model.
    mod = await import('./island.ts');
  } catch {
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
