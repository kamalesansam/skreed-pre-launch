// The 3D path's entry (hero-architecture.md 7 and 8; spec D3, D11, D19). In order: the context check (no WebGL2 context at
// all is the site note's "unsupported"; a software renderer runs the 3D since 2026-11-04), the poster's decode (the island
// never competes with the LCP bytes), the class by aspect and AVIF support from the poster's chosen source, then the data
// prefetch and the hero chunk in parallel. Every hard failure lands in hardFail: the island stops and the page reloads once
// or shows the site note (shell/note.ts), never the poster page (Sam, 2026-11-04, E-3D-only: "dont have this fallback").
// No three.js import: the boot chunk stays small, and the island loads only on the 3D tier.
import { PORTRAIT_ASPECT, SOFTWARE_GL, TEXTURE_PATH } from '../config/hero.ts';
import { createLife, isAbortError, IslandDead } from './hero/bridge/life.ts';
import { prefetchHeroData, dataPromises } from './hero/data/assets.ts';
import type { RideEls } from './hero/scroll/reset.ts';
import { failHard, loadedOk, showNote } from './shell/note.ts';

const H = document.documentElement;
const life = createLife();
const $ = (id: string) => document.getElementById(id);
const els: RideEls = { heroCopy: $('heroCopy'), cue: $('cue'), labels: $('labels'), siteLogo: $('siteLogo'), more: $('cueText') };

/** The WebGL2 context (architecture 8): 'none', 'software' (SwiftShader, llvmpipe) or 'ok'. Production runs the 3D on a
 * software renderer since 2026-11-04 (E-3D-only: slow beats a page that is not the site). */
function glKind(): 'none' | 'software' | 'ok' {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return 'none';                                      // --disable-3d-apis, blocklisted GPUs
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return SOFTWARE_GL.test(name) ? 'software' : 'ok';
}

/** Test and staging builds only (PUBLIC_HERO_HOOKS '1'): the harness's SwiftShader still lands on the poster page, as the
 * browser suites were written against it (?tier=hero3d runs the 3D there); a production build never comes here. Before any
 * island byte, so there is nothing of the island to undo. */
function posterForTests(): void {
  life.kill('software renderer (test build)');
  window.__skreedLoader?.abort();
  H.classList.remove('loading', 'still3d', 'intro', 'uh1', 'uh2', 'uh3', 'uh4');
  H.classList.replace('hero3d', 'poster');
  for (const e of document.querySelectorAll('[inert]')) e.removeAttribute('inert');
  scrollTo({ top: 0, behavior: 'instant' });
  dispatchEvent(new Event('scroll'));
  console.warn('[hero] no hardware WebGL2');
}

/** A hard failure (architecture 7.3): the island, its loop and its context stop, then a reload or the site note. */
function hardFail(reason: string, err?: unknown): void {
  if (life.dead) return;
  life.kill(reason);
  if (err === undefined) console.warn('[hero] ' + reason); else console.warn('[hero] ' + reason, err);
  failHard();
}

async function boot(): Promise<void> {
  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') Object.defineProperty(window, '__skreedDead', { configurable: true, get: () => life.dead });

  // the test and staging override (?tier=hero3d|still3d) skips the context check, so the SwiftShader harness runs 3D
  const forced = import.meta.env.PUBLIC_HERO_HOOKS === '1' && !!window.__skreedTierOverride?.();
  const gl = forced ? 'ok' : glKind();
  if (gl === 'none') { life.kill('no WebGL2'); showNote('unsupported'); return; }
  if (gl === 'software' && import.meta.env.PUBLIC_HERO_HOOKS === '1') { posterForTests(); return; }

  const canvas = $('stage') as HTMLCanvasElement | null;
  const onLost = () => hardFail('webglcontextlost');   // no restore attempt: a reload
  canvas?.addEventListener('webglcontextlost', onLost);
  const onError = (e: ErrorEvent) => { if (!window.__heroStarted) hardFail('error before start', e.error ?? e.message); };
  // a skipped cross-document view transition into this page (a family page's "Back to main page" or wordmark, Back to top on a
  // cache miss) rejects its promises with AbortError "Transition was skipped": the browser's own, never the island's failure
  const onRejection = (e: PromiseRejectionEvent) => { if (isAbortError(e.reason)) return; if (!window.__heroStarted && !(e.reason instanceof IslandDead)) hardFail('unhandled rejection before start', e.reason); };
  addEventListener('error', onError); addEventListener('unhandledrejection', onRejection);
  life.onKill(() => { removeEventListener('error', onError); removeEventListener('unhandledrejection', onRejection); });

  const img = $('posterImg') as HTMLImageElement | null;
  try { await img?.decode(); } catch { /* a poster that fails to decode still lets the island start */ }
  if (life.dead) return;
  const avif = /\.avif(?:[?#]|$)/.test(img?.currentSrc ?? '');
  const cls = innerWidth / innerHeight < PORTRAIT_ASPECT ? 'portrait' : 'wide';
  const data = prefetchHeroData(cls, avif);
  for (const p of dataPromises(data)) p.catch((e) => hardFail('data', e));

  let mod: typeof import('./hero/hero.ts');
  try { mod = await import('./hero/hero.ts'); } catch (e) { hardFail('import', e); return; }
  if (life.dead) return;
  let texturePath = TEXTURE_PATH;
  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') { const q = new URLSearchParams(location.search).get('texpath'); if (q === 'image' || q === 'bitmap') texturePath = q; }
  try {
    await mod.startHero({ data, life, forced, texturePath, els, onHardFail: hardFail });
    loadedOk();
  } catch (e) {
    if (e instanceof IslandDead) return;
    hardFail('start', e);
  }
}

if (H.classList.contains('hero3d')) void boot();
