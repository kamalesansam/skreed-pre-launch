// The logotype's and the section index's tone on the redesigned landing page (docs/specs/redesign.md D5): Pearl Whisper
// over the photographs, the night quiz and the footer, Urban Slate over the light sections. Every part of the page says
// which ground it is with data-tone="dark" or "light": the sections, and inside them any box of the other tone (a
// photograph panel in a light section, the quiz's host). This reads the part under the logotype's row, the innermost
// one where they nest, and tells the logotype (window.__skreedLogo.setTone, logotype/glitch.ts); the section index sits
// on that row and copies the logotype's tone (shell/site-nav.ts), so the two always change together. The row runs from
// the logotype's middle to the middle of the index's last entry, and a part counts only when it lies under both ends:
// a box under the logotype alone (a picture in a grid) would turn the index's words the wrong way with it. Read on
// scroll, once a frame, on resize, when a section says its layout moved (the window event skreed:rd-layout), when the
// page's height changes, and when the quiz's host opens or closes. Over the quiz's result html[data-qz-ground] keeps
// both Pearl Whisper whatever is said here (quiz.css). No motion and no library: one attribute, written only when it
// changes.
export {};

const logo = document.getElementById('siteLogo');
/** every part that says its ground: inside the page's main, and the footer. Never the chrome: the logotype and the
 *  index carry data-tone as their own colour, and the countdown's is its glitch's (logotype/install.ts) */
const PARTS = 'main [data-tone]:not(#count), footer[data-tone], footer [data-tone]';

if (logo) {
  /** the row's far end: the index's last entry, the gift, shown at every width */
  const end = document.getElementById('snavGift');
  let parts: HTMLElement[] = [];
  let stale = true, raf = 0;

  /** The tone told to the logotype, only when it differs from the one it wears (read from the logotype itself, so no
   *  flag here can go stale). Its script may not have run yet, the modules' order being the page's: then the word waits
   *  in the queue that script drains as it installs (window.__skreedLogoQ), and the attribute it would write is written
   *  here too, so the first paint is right either way. */
  const say = (light: boolean) => {
    if (light === (logo.dataset.tone === 'light')) return;
    const api = window.__skreedLogo;
    if (api) { api.setTone(light); return; }
    const q = (window.__skreedLogoQ ??= []);
    for (let i = q.length - 1; i >= 0; i--) if (q[i][0] === 'setTone') q.splice(i, 1);
    q.push(['setTone', light]);
    logo.dataset.tone = light ? 'light' : 'dark';
  };

  /** The part under the row: the one that holds the logotype's middle point and reaches past the row's far end. The
   *  parts are listed in document order, which puts a box after the section it sits in, so the last one that holds the
   *  row is the innermost. A part with no box (the quiz's host until it opens) holds nothing; a pinned section is read
   *  where it is drawn. With no part under the row (the page pulled past its end) the tone stays as it was. */
  const read = () => {
    raf = 0;
    if (stale) { parts = [...document.querySelectorAll<HTMLElement>(PARTS)]; stale = false; }
    const l = logo.getBoundingClientRect();
    if (!(l.width > 0 && l.height > 0)) return;
    const x = (l.left + l.right) / 2, y = (l.top + l.bottom) / 2;
    const e = end?.getBoundingClientRect();
    const far = e && e.width > 0 ? (e.left + e.right) / 2 : x;
    let under: HTMLElement | null = null;
    for (const el of parts) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.top <= y && y < r.bottom && r.left <= x && Math.max(x, far) < r.right) under = el;
    }
    if (under) say(under.dataset.tone === 'light');
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(read); };
  const relist = () => { stale = true; queue(); };

  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', relist, { passive: true });
  addEventListener('skreed:rd-layout', relist);
  // a page restored from the back-forward cache keeps its scroll, and its parts may have moved while it was away
  addEventListener('pageshow', relist);
  // the page's height (the faces arriving, a picture's box, the quiz opening) moves the parts under a still logotype
  if ('ResizeObserver' in window) new ResizeObserver(queue).observe(document.body);
  const host = document.getElementById('quizHost');
  if (host) new MutationObserver(relist).observe(host, { attributes: true, attributeFilter: ['hidden'] });
  read();
}
