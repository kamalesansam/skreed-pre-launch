// Section 5's DOM side, as Sam's picture of 2026-11-02 (his words: "If someone clicks on the Facebook symbol, it should
// take them to our Facebook page. If they follow it, the fourth jar should fill up 25% with blue ... After that if they
// click on the YouTube symbol ... the fourth jar should fill up 25% with red (on top of the 25% blue)"). The follows: a
// press on a follow column lets the link open the platform's page in a new tab; the follow itself is the visitor's word,
// the Followed tick under the column (since 2026-11-06, the site review of 2026-11-05: "When checked, the fourth jar should
// visually fill up. When unchecked, it should return to its original unfilled state."; until then the press counted as
// the follow, the honour system either way: no site can check one), remembered for the visit in sessionStorage as the
// ordered ids; a tick already in adds nothing. The visitor's jar (jar 4) then fills where the visitor can see it: 500 ms
// after the tick if the page is still visible, else 300 ms after it is visible again, the next state's render laid over
// the current one and revealed upward with clip-path from the old surface to the new (from the old state's seam, below
// which the two renders agree, so nothing jumps; 900 ms a quarter, 1400 ms a half, ease-out; ticks during a fill queue;
// at once under reduced motion; on load the remembered state at once). A tick taken off drains the same way in reverse:
// the edge falls from the shown surface to the seam of the base the two states share, the lower render above it (drainSpan).
// The next states' renders are fetched once the section is near. Also: the email form (the
// quiz's gift form: validation on blur and submit, sending, the error line, the offline queue sent on `online`, a
// duplicate read as success, the done line with "Not you?"), data-ready (C3), the events (C4) and the hooks (C5). No loop
// from the section's end since 2026-11-03 (Sam: "remove the loop"), and no wrap onto it from the top since 2026-11-04. Strings from config/signup.ts.
import { FILL_GATE, FOLLOW_COUNT, SIGNUP_COPY as C, SIGNUP_FOLLOWS, SIGNUP_KEYS, addedLine, drainSpan, fillMs, jarById, pressFollow, releaseFollow, removedLine, revealSpan, stateOf, yoursAlt } from '../../config/signup.ts';
import { SIZES, STATE_SRCS, STATE_TOPS, type Srcs } from './jar-srcs.ts';
import { clearMask } from './cut.ts';
import { reducedMQ } from '../motion.ts';
import { track } from '../quiz/track.ts';

type FollowId = 'facebook' | 'youtube' | 'instagram';
declare global {
  interface Window {
    /** test and staging builds only (PUBLIC_HERO_HOOKS): the jar's shown state, a follow ticked or its tick taken off from script, a fresh visit */
    __skreedSignupHooks?: { state(): string; press(id: FollowId): void; release(id: FollowId): void; reset(): void };
  }
}

const READY_MS = 4000;
/** the states' renders from jar-srcs.ts (the table Signup.astro lays the showcase jars out from): the sizes and, per state, the AVIF and WebP srcsets and the fallback */
interface JarData { sizes: string; states: Record<string, Srcs> }

/** the follows pressed this visit, in order, from sessionStorage (try and catch: without storage, none) */
function readFollows(): string[] {
  try {
    const raw = sessionStorage.getItem(SIGNUP_KEYS.follows);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.reduce<string[]>((o, id) => (typeof id === 'string' ? [...pressFollow(o, id)] : o), []) : [];
  } catch { return []; }
}
function writeFollows(ids: readonly string[]): void { try { sessionStorage.setItem(SIGNUP_KEYS.follows, JSON.stringify(ids)); } catch { /* no storage: the follows live for the page */ } }
const sleep = (ms: number) => new Promise<void>((r) => { setTimeout(r, ms); });
/** resolves once the page is visible (at once when it is) */
const whenVisible = () => new Promise<void>((r) => {
  if (document.visibilityState === 'visible') { r(); return; }
  const h = () => { if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', h); r(); } };
  document.addEventListener('visibilitychange', h);
});
/** the follows of a state, in press order */
const idsOf = (state: string): string[] => (state === '0' ? [] : [...state].map((l) => SIGNUP_FOLLOWS.find((j) => j.letter === l)?.id ?? '').filter(Boolean));

export function mountSignup(root: HTMLElement): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  const live = $('suLive'), jar = $('suYours');
  if (!live) return;
  const H = document.documentElement;
  const isPoster = () => !H.classList.contains('hero3d') || H.classList.contains('poster');
  const announce = (text: string) => { live.textContent = ''; live.textContent = text; };

  // ---- the visitor's jar: two stacked renders, the current state and the incoming one
  const data: JarData = { sizes: SIZES, states: STATE_SRCS };   // a build without the renders has an empty table: the jar keeps its markup
  const tops = { states: STATE_TOPS };   // each state's surface top and seam from jars.json, the reveal's two ends
  const pics = jar ? [...jar.querySelectorAll<HTMLElement>('picture.su-pic')] : [];
  let cur = pics.find((p) => p.dataset.layer === 'cur') ?? null, nxt = pics.find((p) => p.dataset.layer === 'next') ?? null;
  /** a layer set to a state's renders (the sources and the fallback); its image, or null when the build has none */
  const setPic = (pic: HTMLElement | null, state: string): HTMLImageElement | null => {
    const s = data.states[state], img = pic?.querySelector('img');
    if (!pic || !s || !img) return null;
    for (const src of pic.querySelectorAll<HTMLSourceElement>('source')) src.srcset = src.type === 'image/avif' ? s.a : s.w;
    if (img.getAttribute('src') !== s.s) img.src = s.s;
    return img;
  };
  let follows = readFollows();
  let shown = '0';
  const showState = (state: string) => {
    shown = state;
    if (jar) { jar.dataset.state = state; jar.setAttribute('aria-label', yoursAlt(idsOf(state))); }
  };
  // the remembered state at once (no reveal on load)
  if (follows.length) { setPic(cur, stateOf(follows)); }
  showState(stateOf(follows));

  // the next states' renders, fetched once the section is near (this script comes within a screen of it): the queued
  // states and every state one press further, in the format and density the current render was chosen in
  const fetched = new Set<string>(), keep: HTMLImageElement[] = [];
  function preload() {
    const img = cur?.querySelector('img');
    if (!img) return;
    const go = () => {
      const avif = /\.avif(?:[?#]|$)/i.test(img.currentSrc || img.src);
      const target = stateOf(follows), want = new Set<string>();
      for (let k = shown === '0' ? 1 : shown.length + 1; k <= target.length; k++) want.add(target.slice(0, k));
      for (const j of SIGNUP_FOLLOWS) if (!target.includes(j.letter)) want.add(target === '0' ? j.letter : target + j.letter);
      for (const id of idsOf(target)) want.add(stateOf(idsOf(target).filter((x) => x !== id)));   // and one tick fewer (a tick taken off)
      for (const st of want) {
        const s = data.states[st];
        if (!s || fetched.has(st)) continue;
        fetched.add(st);
        const im = new Image();
        im.decoding = 'async'; im.sizes = data.sizes; im.srcset = avif ? s.a : s.w;
        keep.push(im);
      }
    };
    if (img.complete && img.currentSrc) go(); else img.addEventListener('load', go, { once: true });
  }
  preload();

  // ---- the fill: one job per tick, in order, each from the shown state to the next (up for a tick, down for one taken off)
  let gen = 0, anim: Animation | null = null, chain: Promise<void> = Promise.resolve();
  /** the visitor can see it: 500 ms after the press if the page is visible then, else 300 ms after it is visible again */
  async function gate(at: number) {
    const wait = at + FILL_GATE.afterPress - performance.now();
    if (wait > 0) await sleep(wait);
    while (document.visibilityState !== 'visible') { await whenVisible(); await sleep(FILL_GATE.afterVisible); }
  }
  /** the incoming render revealed upward over the current one, from the shown state's surface to the new state's; or,
   *  for a tick taken off (`down`), the lower render revealed downward from the shown surface to the shared base's seam */
  async function play(state: string, id: string, g: number, down = false) {
    announce(down ? removedLine(id) : addedLine(id, idsOf(state).length >= FOLLOW_COUNT));
    const img = setPic(nxt, state);
    if (!img || !cur || !nxt) { showState(state); return; }
    try { await Promise.resolve(); await img.decode(); } catch { /* shown as it loads */ }
    if (g !== gen) return;
    const span = down ? drainSpan(tops, shown, state) : revealSpan(tops, shown, state), ms = reducedMQ.matches || !span ? 0 : fillMs(id);
    nxt.hidden = false;
    if (ms > 0 && span) {
      // the two layers never draw one pixel both (the renders' soft rims and shadows would composite twice, up to 37 of 255
      // darker, and pop back when the old layer is hidden; 2026-11-03): the incoming layer shows the rows below the rising
      // edge (above the falling one on a drain), the old one the rest, each clip the other's complement on the same clock;
      // the old layer's clip reaches 1 px past the edge, so the two clips' soft edges never let the ground through as a hairline
      const inc = (e: number) => (down ? `inset(0 0 ${100 - e}% 0)` : `inset(${e}% 0 0 0)`);
      const old = (e: number) => (down ? `inset(calc(${e}% - 1px) 0 0 0)` : `inset(0 0 calc(${100 - e}% - 1px) 0)`);
      anim = nxt.animate([{ clipPath: inc(span.from) }, { clipPath: inc(span.to) }], { duration: ms, easing: 'ease-out', fill: 'forwards' });
      const under = cur.animate([{ clipPath: old(span.from) }, { clipPath: old(span.to) }], { duration: ms, easing: 'ease-out', fill: 'forwards' });
      // the reveal's end: the animation's own word, or its duration and a frame more where the browser's animation clock
      // does not run (a throttled tab, a software-rendered page), so the layer stands as the new state either way
      const end = await Promise.race([anim.finished.then(() => 'finished', () => 'cancelled'), sleep(ms + 100).then(() => 'timer')]);
      under.cancel();
      if (end === 'cancelled') return;   // a reset
      anim.cancel(); anim = null;
    }
    if (g !== gen) return;
    // the incoming layer is the jar now; the old one goes under it, hidden, for the next fill
    cur.hidden = true; cur.dataset.layer = 'next'; nxt.dataset.layer = 'cur';
    [cur, nxt] = [nxt, cur];
    showState(state);
  }
  function enqueue(id: string, state: string, down = false) {
    const at = performance.now(), g = gen;
    chain = chain.then(async () => {
      if (g !== gen) return;
      if (!reducedMQ.matches) await gate(at);
      if (g !== gen) return;
      await play(state, id, g, down);
      if (g !== gen) return;
      window.dispatchEvent(new CustomEvent('skreed:signup-filled', { detail: { state } }));
      preload();
    }).catch(() => {});
  }
  // the Followed ticks (Signup.astro, one under each follow column): the remembered follows on load, and the visitor's word from then on
  const ticks = [...root.querySelectorAll<HTMLInputElement>('input.su-tick-box')];
  const syncTicks = () => { for (const t of ticks) t.checked = follows.includes(t.dataset.id ?? ''); };
  syncTicks();
  /** a follow ticked (the tick, or the hooks): remembered, announced to the page, its fill queued */
  function follow(id: string) {
    if (!jarById(id)) return;
    const next = pressFollow(follows, id);
    if (next === follows) { syncTicks(); return; }   // already in: nothing is added
    follows = [...next]; writeFollows(follows); syncTicks();
    track('follow_tick', { platform: id });
    if (follows.length >= FOLLOW_COUNT) track('jar_full');
    window.dispatchEvent(new CustomEvent('skreed:signup', { detail: { id, follows: [...follows] } }));
    preload();
    enqueue(id, stateOf(follows));
  }
  /** a tick taken off: forgotten, announced, its layer drained (the rest keep their order) */
  function unfollow(id: string) {
    if (!jarById(id)) return;
    const next = releaseFollow(follows, id);
    if (next === follows) { syncTicks(); return; }   // not in: nothing changes
    follows = [...next]; writeFollows(follows); syncTicks();
    track('follow_untick', { platform: id });
    window.dispatchEvent(new CustomEvent('skreed:signup', { detail: { id, follows: [...follows] } }));
    preload();
    enqueue(id, stateOf(follows), true);
  }
  for (const t of ticks) t.addEventListener('change', () => { if (t.checked) follow(t.dataset.id ?? ''); else unfollow(t.dataset.id ?? ''); });
  for (const a of root.querySelectorAll<HTMLAnchorElement>('a.su-follow')) {
    a.addEventListener('click', () => { track('follow_click', { platform: a.dataset.id ?? '' }); });   // the link opens its page as a link does (a new tab); the follow is the tick's
  }

  // ---- data-ready (C3): jar 4's render, the three showcase jars and the section's fonts decoded, or 4 s after the mount
  const ready = () => { if (root.dataset.ready !== '1') root.dataset.ready = '1'; };
  setTimeout(ready, READY_MS);
  const imgs = [cur?.querySelector('img'), ...root.querySelectorAll<HTMLImageElement>('a.su-follow img')].filter((i): i is HTMLImageElement => !!i);
  const faces = 'fonts' in document ? ['300 16px Inter', '400 16px Inter', '700 16px Inter', '400 16px Jost'].map((f) => document.fonts.load(f).catch(() => [])) : [];
  void Promise.all([...imgs.map((i) => i.decode().catch(() => undefined)), ...faces]).then(ready);

  // ---- the hooks (C5): test and staging builds only, folded out of production
  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') {
    window.__skreedSignupHooks = {
      state: () => shown,
      press: (id) => { follow(id); },
      release: (id) => { unfollow(id); },
      reset: () => {
        gen++; anim?.cancel(); anim = null; chain = Promise.resolve();
        follows = []; try { sessionStorage.removeItem(SIGNUP_KEYS.follows); } catch { /* no storage */ }
        syncTicks();
        if (nxt) nxt.hidden = true;
        setPic(cur, '0'); showState('0');
      },
    };
  }

  // ---- the fourth wipe on the 3D path (Sam, 2026-11-03: "the transition is not done properly, i could see that box"):
  // the island's cut draws the cream ground over the scene along its ragged diagonal, so while it runs the section leaves
  // its own ground to the canvas (no cream box rising with a flat edge under the cut) and shows its lines only below the
  // cut's clear line (cut.ts), ramping in over an eighth of a screen just behind the band; at either end, nothing. Lead and
  // soft in px: the line is the worst texel's, and the lead covers a frame of scroll the compositor runs ahead of the draw
  const stage = document.getElementById('stage');
  let cutOn = false;
  const cut = (w: number) => {
    if (!(w > 0 && w < 1)) {
      if (!cutOn) return;
      cutOn = false; delete root.dataset.cut;
      root.style.removeProperty('mask-image'); root.style.removeProperty('-webkit-mask-image');
      return;
    }
    const vw = H.clientWidth || innerWidth, vh = innerHeight, r = stage?.getBoundingClientRect();
    const canvas = r && r.width > 0 && r.height > 0 ? r : { left: 0, top: 0, width: vw, height: vh };
    const m = clearMask(w, canvas, vw / vh, root.getBoundingClientRect(), 0.02 * vh, 0.12 * vh);
    root.style.setProperty('mask-image', m); root.style.setProperty('-webkit-mask-image', m);
    if (!cutOn) { cutOn = true; root.dataset.cut = ''; }
  };

  // ---- the island's word on a change (hero/loop.ts): the body goes under a seam's cloud with the cover, back at rest;
  // the cut's progress while the island draws the fourth wipe under the section
  const body = $('suBody');
  window.__skreedSignupFrame = (f) => {
    const op = f.cover > 0 && !isPoster() ? Math.max(0, 1 - f.cover) : 1;
    if (body) body.style.opacity = op < 1 ? op.toFixed(3) : '';
    root.dataset.state = op < 1 ? 'seam' : 'rest';
    cut(f.on && !isPoster() ? f.wipe : 0);
  };

  // ---- the logotype over the section on the poster tier: Urban Slate while the section's cream ground is under the
  // logotype's middle, as the island sets it on the 3D path from the ground's tone (hero/loop.ts), and Pearl Whisper again
  // once the section has left it (a scroll back to the scenes). Two rect reads per frame while the
  // page scrolls, on the poster tier alone; the tone is read from the logotype itself, so another writer's word (the
  // island's setTone, a reset) is never contradicted by a stale flag (the band's clearance was the threshold until
  // 2026-11-03, 23 to 33 px of scroll before the ground reached the logotype)
  const logo = document.querySelector<HTMLElement>('a.site-logo');
  // (2026-11-09, docs/specs/redesign.md D18) not where the section sits inside a part that says its own ground with
  // data-tone, as it does at the end of the redesigned landing page: there the page's own reader has the logotype
  // (scripts/redesign/tone.ts), and a second writer here would turn it Pearl Whisper over every light section above
  if (logo && !root.closest('[data-tone]')) {
    let pending = false;
    const setTone = (on: boolean) => {
      if (on === (logo.dataset.tone === 'light')) return;
      if (window.__skreedLogo?.setTone) window.__skreedLogo.setTone(on);
      else if (on) logo.dataset.tone = 'light'; else delete logo.dataset.tone;
    };
    const readTone = () => { pending = false; if (!isPoster()) return; const r = root.getBoundingClientRect(), l = logo.getBoundingClientRect(), mid = (l.top + l.bottom) / 2; setTone(r.top < mid && r.bottom > mid); };
    const onMove = () => { if (!pending) { pending = true; requestAnimationFrame(readTone); } };
    addEventListener('scroll', onMove, { passive: true });
    addEventListener('resize', onMove, { passive: true });
    readTone();
  }

  // ---- the view
  if ('IntersectionObserver' in window) {
    let viewed = false;
    new IntersectionObserver((es) => { if (!viewed && es.some((x) => x.isIntersecting)) { viewed = true; track('signup_view'); } }, { rootMargin: '0px 0px -50% 0px' }).observe(root);
  }
  // no loop from the section's end (Sam, 2026-11-03: "remove the loop, i dont want the sign up page to scroll back to section 1"):
  // the page ends here on every tier; the empty screen and the poster tier's fade that served the loop are gone

  // ---- the form (PUBLIC_LEADS on): its own chunk (form.ts), fetched only where the build renders the form
  const form = $<HTMLFormElement>('suForm');
  if (form) void import('./form.ts').then((m) => { m.mountForm(form, { follows: () => follows, announce }); });
}
