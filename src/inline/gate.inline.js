/* Gate (hero-architecture.md 8): picks the tier before first paint. CFG is prepended by Gate.astro from config/hero.ts. */
(function () {
  var H = document.documentElement, c = H.classList; c.add('js');
  var t = window.__skreedTierOverride ? window.__skreedTierOverride() : '';
  if (!t) {
    var n = navigator, k = n.connection || {}, rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    t = !('WebGL2RenderingContext' in window) || !('DecompressionStream' in window) || k.saveData === true ||
        CFG.slowTypes.indexOf(k.effectiveType) >= 0 || (n.deviceMemory !== undefined && n.deviceMemory <= CFG.minMemory) ||
        (rm && CFG.reducedTier === 'poster') ? 'poster' : rm ? 'still3d' : 'hero3d';
  }
  if (t === 'poster') c.add('poster'); else { c.add('hero3d', 'loading'); if (t === 'still3d') c.add('still3d'); }
  /* a cross-document view transition into this page that the browser skips (the family pages' way back, family-page.md 22) rejects
     its promises (ready, finished, and updateCallbackDone, seen in the console after the first two were handled) with AbortError;
     handled here, so the rejection never reaches boot.ts's guard as unhandled */
  addEventListener('pagereveal', function (e) { var v = e.viewTransition; if (v) { v.ready.catch(function () {}); v.finished.catch(function () {}); v.updateCallbackDone.catch(function () {}); } });
  addEventListener('error', function (e) {
    var s = e.target; if (s && s.tagName === 'SCRIPT' && s.type === 'module' && !window.__heroStarted && window.__skreedLoader) window.__skreedLoader.fail('');
  }, true);
})();
