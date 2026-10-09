// The 3D path's entry (hero-architecture.md 7 and 8; spec D3, D11, D19). In order: the context check (a null or
// software WebGL2 context goes to the poster before any island byte), the poster's decode (the island never competes
// with the LCP bytes), the class by aspect and AVIF support from the poster's chosen source, then the data prefetch and
// the hero chunk in parallel. Every failure lands here: soft ones (the loader's own stall and offline rules) recover on
// frame2 unless the visitor scrolls; hard ones are terminal (toPoster).
// No three.js import: the boot chunk stays small, and the island loads only on the 3D tier.
import { PORTRAIT_ASPECT, SOFTWARE_GL, TEXTURE_PATH } from '../config/hero.ts';
import { COPY_LD } from '../config/copy.ts';
import { createLife, IslandDead } from './hero/bridge/life.ts';
import { prefetchHeroData, dataPromises } from './hero/data/assets.ts';
import { resetRiders, type RideEls } from './hero/scroll/reset.ts';

const H = document.documentElement;
const life = createLife();
const $ = (id: string) => document.getElementById(id);
const els: RideEls = { heroCopy: $('heroCopy'), cue: $('cue'), labels: $('labels'), siteLogo: $('siteLogo') };

/** A hardware WebGL2 context (architecture 8): SwiftShader passes failIfMajorPerformanceCaveat, so the renderer string decides. */
function hardwareGL(): boolean {
  const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
  if (!gl) return false;                                       // --disable-3d-apis, blocklisted GPUs, caveat
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return !SOFTWARE_GL.test(name);
}

/** The hard poster path (architecture 7.3), terminal. */
function toPoster(reason: string, err?: unknown): void {
  if (life.dead) return;
  life.kill(reason);                                            // 1. loop, observer, listeners, renderer and its context
  const L = window.__skreedLoader;                              // 2. the loader, in any phase
  if (L) {
    const s = L.state();
    if (!navigator.onLine && s.phase === 'load' && s.mode !== 'poster') L.fail(COPY_LD.offline);
    else if (!(s.mode === 'poster' && s.note)) L.abort();
  }
  const track = $('track'), before = track ? track.offsetHeight : 0, y = scrollY;   // 3. the page becomes the poster page
  H.classList.remove('loading', 'still3d', 'intro', 'uh1', 'uh2', 'uh3', 'uh4');
  if (H.classList.contains('hero3d')) H.classList.replace('hero3d', 'poster'); else H.classList.add('poster');
  resetRiders(els);                                             // 4. ride styles, tone, labels (section 2 and the intro reset in their disposers)
  for (const e of document.querySelectorAll('[inert]')) e.removeAttribute('inert');   // 5.
  const after = track ? track.offsetHeight : 0;                 // 6. keep what the visitor was reading in place
  if (y < before - innerHeight) scrollTo({ top: 0, behavior: 'instant' });
  else scrollTo({ top: y - (before - after), behavior: 'instant' });
  dispatchEvent(new Event('scroll'));                           // 7. the inline cue check recomputes the cue
  if (err === undefined) console.warn('[hero] ' + reason); else console.warn('[hero] ' + reason, err);   // 8.
}

/** The loader went to its poster state on its own (stall, offline) or through fail (architecture 7.3, soft poster). */
function onSoftPoster(kind: 'stall' | 'offline' | 'fail'): void {
  if (kind === 'fail') { if (!life.dead) toPoster('module-load-error'); return; }
  if (life.dead) return;
  resetRiders(els);
  const onScroll = () => { if (scrollY > 8) toPoster('soft-then-scrolled'); };
  addEventListener('scroll', onScroll, { passive: true });
  const off = () => removeEventListener('scroll', onScroll);
  life.onRecover(off); life.onKill(off);
}

async function boot(): Promise<void> {
  window.__skreedOnPoster = (kind) => onSoftPoster(kind);
  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') Object.defineProperty(window, '__skreedDead', { configurable: true, get: () => life.dead });
  const L = window.__skreedLoader;
  if (L && L.state().mode === 'poster') onSoftPoster(L.state().note ? 'offline' : 'stall');   // offline before this script ran

  // the test and staging override (?tier=hero3d|still3d) skips the context check, so the SwiftShader harness runs 3D
  const forced = import.meta.env.PUBLIC_HERO_HOOKS === '1' && !!window.__skreedTierOverride?.();
  if (!forced && !hardwareGL()) { toPoster('no hardware WebGL2'); return; }

  const canvas = $('stage') as HTMLCanvasElement | null;
  const onLost = () => toPoster('webglcontextlost');   // no restore attempt
  canvas?.addEventListener('webglcontextlost', onLost);
  const onError = (e: ErrorEvent) => { if (!window.__heroStarted) toPoster('error before start', e.error ?? e.message); };
  const onRejection = (e: PromiseRejectionEvent) => { if (!window.__heroStarted && !(e.reason instanceof IslandDead)) toPoster('unhandled rejection before start', e.reason); };
  addEventListener('error', onError); addEventListener('unhandledrejection', onRejection);
  life.onKill(() => { removeEventListener('error', onError); removeEventListener('unhandledrejection', onRejection); });

  const img = $('posterImg') as HTMLImageElement | null;
  try { await img?.decode(); } catch { /* a poster that fails to decode still lets the island start */ }
  if (life.dead) return;
  const avif = /\.avif(?:[?#]|$)/.test(img?.currentSrc ?? '');
  const cls = innerWidth / innerHeight < PORTRAIT_ASPECT ? 'portrait' : 'wide';
  const data = prefetchHeroData(cls, avif);
  for (const p of dataPromises(data)) p.catch((e) => toPoster('data', e));

  let mod: typeof import('./hero/hero.ts');
  try { mod = await import('./hero/hero.ts'); } catch (e) { toPoster('import', e); return; }
  if (life.dead) return;
  let texturePath = TEXTURE_PATH;
  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') { const q = new URLSearchParams(location.search).get('texpath'); if (q === 'image' || q === 'bitmap') texturePath = q; }
  try {
    await mod.startHero({ data, life, forced, texturePath, els, onHardFail: toPoster });
  } catch (e) {
    if (e instanceof IslandDead) return;
    toPoster('start', e);
  }
}

if (H.classList.contains('hero3d')) void boot();
