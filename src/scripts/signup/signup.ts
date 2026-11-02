// Section 5's DOM side, as Sam's picture of 2026-11-02 (his words: "If someone clicks on the Facebook symbol, it should
// take them to our Facebook page. If they follow it, the fourth jar should fill up 25% with blue ... After that if they
// click on the YouTube symbol ... the fourth jar should fill up 25% with red (on top of the 25% blue)"). The follows: a
// press on a follow column lets the link open the platform's page in a new tab and, in the same press, counts the
// follow (the honour system: no site can check a follow), remembered for the visit in sessionStorage as the ordered ids;
// a platform already pressed opens its page again and adds nothing. The visitor's jar (jar 4) then fills where the
// visitor can see it: 500 ms after the press if the page is still visible, else 300 ms after it is visible again, the
// next state's render laid over the current one and revealed upward with clip-path from the old surface to the new
// (from the old state's seam, below which the two renders agree, so nothing jumps; 900 ms a quarter, 1400 ms a half,
// ease-out; presses during a fill queue; at once under reduced motion; on load the remembered state at once). The next states' renders are fetched once the section is near. Also: the email form (the
// quiz's gift form: validation on blur and submit, sending, the error line, the offline queue sent on `online`, a
// duplicate read as success, the done line with "Not you?"), data-ready (C3), the events (C4), the hooks (C5), the wrap
// announcement and the poster tier's loop end (the 300 ms fade through --night to the top). Strings from config/signup.ts.
import { FILL_GATE, FOLLOW_COUNT, SIGNUP_COPY as C, SIGNUP_FOLLOWS, SIGNUP_KEYS, SIGNUP_LEAD_ENDPOINT, addedLine, fill, fillMs, jarById, pressFollow, revealSpan, stateOf, yoursAlt } from '../../config/signup.ts';
import { SIZES, STATE_SRCS, STATE_TOPS, type Srcs } from './jar-srcs.ts';
import { reducedMQ } from '../motion.ts';
import { track } from '../quiz/track.ts';

type FollowId = 'facebook' | 'youtube' | 'instagram';
declare global {
  interface Window {
    /** test and staging builds only (PUBLIC_HERO_HOOKS): the jar's shown state, a follow counted without opening a tab, a fresh visit */
    __skreedSignupHooks?: { state(): string; press(id: FollowId): void; reset(): void };
  }
}

const SLOW_MS = 8000, HARD_MS = 20000, FADE_MS = 300, READY_MS = 4000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
  const live = $('suLive'), loopEnd = $('suLoopEnd'), fade = $('suFade'), jar = $('suYours');
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

  // ---- the fill: one job per follow, in press order, each from the shown state to the next
  let gen = 0, anim: Animation | null = null, chain: Promise<void> = Promise.resolve();
  /** the visitor can see it: 500 ms after the press if the page is visible then, else 300 ms after it is visible again */
  async function gate(at: number) {
    const wait = at + FILL_GATE.afterPress - performance.now();
    if (wait > 0) await sleep(wait);
    while (document.visibilityState !== 'visible') { await whenVisible(); await sleep(FILL_GATE.afterVisible); }
  }
  /** the incoming render revealed upward over the current one, from the shown state's surface to the new state's */
  async function play(state: string, id: string, g: number) {
    announce(addedLine(id, idsOf(state).length >= FOLLOW_COUNT));
    const img = setPic(nxt, state);
    if (!img || !cur || !nxt) { showState(state); return; }
    try { await Promise.resolve(); await img.decode(); } catch { /* shown as it loads */ }
    if (g !== gen) return;
    const span = revealSpan(tops, shown, state), ms = reducedMQ.matches || !span ? 0 : fillMs(id);
    nxt.hidden = false;
    if (ms > 0 && span) {
      // the two layers never draw one pixel both (the renders' soft rims and shadows would composite twice, up to 37 of 255
      // darker, and pop back when the old layer is hidden; 2026-11-03): the incoming layer shows the rows below the rising
      // edge, the old one the rows above it, each clip the other's complement on the same clock
      anim = nxt.animate([{ clipPath: `inset(${span.from}% 0 0 0)` }, { clipPath: `inset(${span.to}% 0 0 0)` }], { duration: ms, easing: 'ease-out', fill: 'forwards' });
      const under = cur.animate([{ clipPath: `inset(0 0 ${100 - span.from}% 0)` }, { clipPath: `inset(0 0 ${100 - span.to}% 0)` }], { duration: ms, easing: 'ease-out', fill: 'forwards' });
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
  function enqueue(id: string, state: string) {
    const at = performance.now(), g = gen;
    chain = chain.then(async () => {
      if (g !== gen) return;
      if (!reducedMQ.matches) await gate(at);
      if (g !== gen) return;
      await play(state, id, g);
      if (g !== gen) return;
      window.dispatchEvent(new CustomEvent('skreed:signup-filled', { detail: { state } }));
      preload();
    }).catch(() => {});
  }
  /** a follow counted (a press on a column, or the hooks): remembered, announced to the page, its fill queued */
  function follow(id: string) {
    if (!jarById(id)) return;
    track('follow_click', { platform: id });
    const next = pressFollow(follows, id);
    if (next === follows) return;   // already pressed: its page opens again, nothing is added
    follows = [...next]; writeFollows(follows);
    if (follows.length >= FOLLOW_COUNT) track('jar_full');
    window.dispatchEvent(new CustomEvent('skreed:signup', { detail: { id, follows: [...follows] } }));
    preload();
    enqueue(id, stateOf(follows));
  }
  for (const a of root.querySelectorAll<HTMLAnchorElement>('a.su-follow')) {
    a.addEventListener('click', () => { follow(a.dataset.id ?? ''); });   // the link opens its page as a link does (a new tab)
  }

  // ---- data-ready (C3): jar 4's render, the three showcase jars and the section's fonts decoded, or 4 s after the unlock
  const ready = () => { if (root.dataset.ready !== '1') root.dataset.ready = '1'; };
  if (root.hasAttribute('data-locked')) addEventListener('skreed:quiz-unlock', () => { setTimeout(ready, READY_MS); }, { once: true });
  else setTimeout(ready, READY_MS);
  const imgs = [cur?.querySelector('img'), ...root.querySelectorAll<HTMLImageElement>('a.su-follow img')].filter((i): i is HTMLImageElement => !!i);
  const faces = 'fonts' in document ? ['300 16px Inter', '400 16px Inter', '700 16px Inter', '400 16px Jost'].map((f) => document.fonts.load(f).catch(() => [])) : [];
  void Promise.all([...imgs.map((i) => i.decode().catch(() => undefined)), ...faces]).then(ready);

  // ---- the hooks (C5): test and staging builds only, folded out of production
  if (import.meta.env.PUBLIC_HERO_HOOKS === '1') {
    window.__skreedSignupHooks = {
      state: () => shown,
      press: (id) => { follow(id); },
      reset: () => {
        gen++; anim?.cancel(); anim = null; chain = Promise.resolve();
        follows = []; try { sessionStorage.removeItem(SIGNUP_KEYS.follows); } catch { /* no storage */ }
        if (nxt) nxt.hidden = true;
        setPic(cur, '0'); showState('0');
      },
    };
  }

  // ---- the island's word on a change (hero/loop.ts): the body goes under a seam's cloud with the cover, back at rest
  const body = $('suBody');
  window.__skreedSignupFrame = (f) => {
    const op = f.cover > 0 && !isPoster() ? Math.max(0, 1 - f.cover) : 1;
    if (body) body.style.opacity = op < 1 ? op.toFixed(3) : '';
    root.dataset.state = op < 1 ? 'seam' : 'rest';
  };

  // ---- the logotype over the section on the poster tier: Urban Slate while the section's cream ground is under the
  // logotype's middle, as the island sets it on the 3D path from the ground's tone (hero/loop.ts), and Pearl Whisper again
  // once the section has left it (a scroll back to the scenes, the wrap to the top). Two rect reads per frame while the
  // page scrolls, on the poster tier alone; the tone is read from the logotype itself, so another writer's word (the
  // island's setTone, a reset) is never contradicted by a stale flag (the band's clearance was the threshold until
  // 2026-11-03, 23 to 33 px of scroll before the ground reached the logotype)
  const logo = document.querySelector<HTMLElement>('a.site-logo');
  if (logo) {
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

  // ---- the wrap's landing, the view, the poster tier's loop end
  addEventListener('skreed:room-state', (e) => { if ((e as CustomEvent<string>).detail === 'wrap') announce(C.wrapLive); });
  if ('IntersectionObserver' in window) {
    let viewed = false;
    new IntersectionObserver((es) => { if (!viewed && es.some((x) => x.isIntersecting)) { viewed = true; track('signup_view'); } }, { rootMargin: '0px 0px -50% 0px' }).observe(root);
    if (loopEnd && fade) {
      let fading = false;
      new IntersectionObserver((es) => {
        if (!isPoster() || fading || !es.some((x) => x.isIntersecting)) return;
        fading = true; fade.hidden = false;
        const a = fade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reducedMQ.matches ? 0 : FADE_MS, fill: 'forwards' });
        a.finished.then(() => { scrollTo({ top: 0, behavior: 'instant' }); track('room_loop'); return fade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reducedMQ.matches ? 0 : FADE_MS, fill: 'forwards' }).finished; })
          .catch(() => {}).finally(() => { fade.hidden = true; fading = false; });
      }, { threshold: 0.95 }).observe(loopEnd);
    }
  }

  // ---- the form (PUBLIC_LEADS on; the quiz's gift form, quiz.md 5): the field and the button joined, one line under them
  const form = $<HTMLFormElement>('suForm');
  if (!form) return;
  const email = form.querySelector<HTMLInputElement>('#suEmail'), send = form.querySelector<HTMLButtonElement>('#suSend'), msg = form.querySelector<HTMLElement>('#suMsg');
  const pill = form.querySelector<HTMLElement>('#suPill'), done = form.querySelector<HTMLElement>('#suDone'), notYou = form.querySelector<HTMLButtonElement>('#suNotYou');
  if (!email || !send || !msg || !pill || !done || !notYou) return;
  const note = (text: string) => { msg.textContent = text; };   // role=status: read politely
  const setErr = (text: string) => { note(text); email.setAttribute('aria-invalid', text ? 'true' : 'false'); };
  const validEmail = () => { const ok = EMAIL.test(email.value.trim()); setErr(ok ? '' : C.errEmail); return ok; };
  email.addEventListener('blur', () => { if (email.value) validEmail(); });   // on blur only once there is a value, never per keystroke
  const closeForm = (text: string) => { pill.hidden = true; done.hidden = false; done.textContent = text; done.title = text; note(''); notYou.hidden = false; done.focus(); };
  const openForm = () => { done.hidden = true; notYou.hidden = true; pill.hidden = false; email.value = ''; setErr(''); email.focus(); };
  let sending = false, queued: Record<string, string> | null = null, inflight: AbortController | null = null;
  const setSending = (on: boolean, label: string) => { sending = on; send.setAttribute('aria-disabled', on ? 'true' : 'false'); send.textContent = label; };
  const payload = (address: string): Record<string, string> => ({ email: address, follows: follows.join(','), source: 'signup' });
  const queueLead = (b: Record<string, string>) => { queued = b; try { sessionStorage.setItem(SIGNUP_KEYS.queue, JSON.stringify(b)); } catch { /* no storage: the queue lives in memory */ } closeForm(C.offline); track('signup_offline'); };
  const submit = async (b: Record<string, string>): Promise<void> => {
    if (sending) return;
    setSending(true, C.sending); note('');
    const ac = new AbortController();
    inflight = ac;
    const slow = setTimeout(() => { send.textContent = C.still; }, SLOW_MS), hard = setTimeout(() => ac.abort(), HARD_MS);
    try {
      const res = await fetch(SIGNUP_LEAD_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b), signal: ac.signal, credentials: 'omit' });
      // a definite answer (saved, saved before, rejected) settles a queued lead too
      if (res.ok || res.status === 409 || res.status === 422) { queued = null; try { sessionStorage.removeItem(SIGNUP_KEYS.queue); } catch { /* ignore */ } }
      if (res.status === 422) { pill.hidden = false; done.hidden = true; notYou.hidden = true; setErr(C.errEmail); email.focus(); track('signup_error', { kind: 'invalid' }); }
      else if (!res.ok && res.status !== 409) throw new Error(String(res.status));
      else { closeForm(fill(C.done, { email: b.email })); track('signup_success', { dup: res.status === 409 ? 1 : 0 }); }
    } catch (err) {
      // offline is a failed request with navigator.onLine false (a pre-check lies on captive portals): queue and retry on `online`
      if (!navigator.onLine) queueLead(b);
      else { pill.hidden = false; done.hidden = true; notYou.hidden = true; note(C.errSend); track('signup_error', { kind: err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'network' }); }
    } finally {
      clearTimeout(slow); clearTimeout(hard); if (inflight === ac) inflight = null;
      setSending(false, C.send);
    }
  };
  addEventListener('online', () => { const q = queued; if (q && !sending) { queued = null; void submit(q); } });
  try {
    const saved = sessionStorage.getItem(SIGNUP_KEYS.queue);
    if (saved) {
      const q = JSON.parse(saved) as Record<string, string>;
      email.value = q.email ?? '';
      if (navigator.onLine) void submit(q); else queueLead(q);
    }
  } catch { /* a bad entry is dropped */ }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (sending) return;
    if (!validEmail()) { if (document.activeElement === email) announce(C.errEmail); else email.focus(); return; }
    track('signup_submitted', { follows: follows.length });
    void submit(payload(email.value.trim()));
  });
  notYou.addEventListener('click', () => { queued = null; try { sessionStorage.removeItem(SIGNUP_KEYS.queue); } catch { /* ignore */ } openForm(); });
}
