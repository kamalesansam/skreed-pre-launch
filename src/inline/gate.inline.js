/* Gate (hero-architecture.md 8): picks the tier before first paint. CFG is prepended by Gate.astro from config/hero.ts. */
(function () {
  var H = document.documentElement, c = H.classList; c.add('js');
  var t = window.__skreedTierOverride ? window.__skreedTierOverride() : '';
  /* every visitor gets the 3D site (Sam, 2026-11-04, E-3D-only: "make sure the real site loads on any machine or any phone
     or any browser, dont have this fallback"): data saver, a slow connection, little memory and Reduce motion no longer pick
     the poster. A browser that cannot draw it at all (no WebGL2 or no DecompressionStream) gets the site note's one line
     (SiteNote.astro) over the poster page, which is never shown; the poster tier stays only as the test builds' ?tier=poster */
  if (!t) t = !('WebGL2RenderingContext' in window) || !('DecompressionStream' in window) ? 'nogl' : 'hero3d';
  if (t === 'nogl') { c.add('poster', 'nogl'); H.setAttribute('data-note', 'unsupported'); }
  else if (t === 'poster') c.add('poster'); else { c.add('hero3d', 'loading'); if (t === 'still3d') c.add('still3d'); }
  /* a cross-document view transition into this page that the browser skips (the family pages' way back, family-page.md 22) rejects
     its promises (ready, finished, and updateCallbackDone, seen in the console after the first two were handled) with AbortError;
     handled here, so the rejection never reaches boot.ts's guard as unhandled */
  addEventListener('pagereveal', function (e) { var v = e.viewTransition; if (v) { v.ready.catch(function () {}); v.finished.catch(function () {}); v.updateCallbackDone.catch(function () {}); } });
  addEventListener('error', function (e) {
    var s = e.target; if (s && s.tagName === 'SCRIPT' && s.type === 'module' && !window.__heroStarted && window.__skreedLoader) window.__skreedLoader.fail('');
  }, true);
})();
