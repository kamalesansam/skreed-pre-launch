// Section 5's DOM side (docs/specs/section-5.md 2, 4 and 5; docs/specs/section-5-sand.md 2, 3 and 6): the text split
// into glyphs as it stands (visible at rest, rule 12) by section 3's decode; the follows (a press on a follow word lets
// the link open its page in a new tab and, in the same press, counts the platform as collected: the honour system of
// docs/00-IDEATION.md decision 11; the island pours its colours, the row's state and the count line decode to their
// new words, the slot's description reads the jar's layers in press order, the live region says it once; remembered
// for the visit in sessionStorage); data-pouring from the frame the island hands over, with the body going under a
// seam's cloud with the cover; the poster tier's still swapped by the state's key with no transition; the email form
// as the quiz's gift form (validation on blur and submit, sending, the error line, the offline queue sent on `online`,
// a duplicate read as success, the done line with "Not you?"); and the poster tier's loop end (the 300 ms fade through
// --night to the top). Every string comes from config/signup.ts.
import { FOLLOW_COUNT, SIGNUP_COPY as C, SIGNUP_FOLLOWS, SIGNUP_KEYS, SIGNUP_LEAD_ENDPOINT, fill, jarById, stillAlt, stillKey, yoursLevel, yoursState, type SignupFrame } from '../../config/signup.ts';
import { reducedMQ } from '../motion.ts';
import { createDecoder } from '../quiz/decode.ts';
import { track } from '../quiz/track.ts';

const SLOW_MS = 8000, HARD_MS = 20000, FADE_MS = 300;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// the poster tier's stills by key (sixteen states at 1x and 2x, AVIF and WebP), hashed by the build; under Node there is no glob
let STILLS: Record<string, string> = {};
try { STILLS = import.meta.glob<string>('../../assets/signup/stills/*.{avif,webp}', { eager: true, query: '?url', import: 'default' }); } catch { STILLS = {}; }
/** a state's four files, or null when the build has none */
function stillFiles(key: string): { avif: string; webp: string; src: string } | null {
  const f = (k: string) => STILLS[`../../assets/signup/stills/jar-${key}-${k}`];
  const a1 = f('1x.avif'), a2 = f('2x.avif'), w1 = f('1x.webp'), w2 = f('2x.webp');
  return a1 && a2 && w1 && w2 ? { avif: `${a1} 160w, ${a2} 320w`, webp: `${w1} 160w, ${w2} 320w`, src: w1 } : null;
}

/** the follows pressed this visit, in order, from sessionStorage (try and catch: without storage, none) */
function readFollows(): string[] {
  try {
    const raw = sessionStorage.getItem(SIGNUP_KEYS.follows);
    if (!raw) return [];
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string' && !!jarById(id)) : [];
  } catch { return []; }
}
function writeFollows(ids: readonly string[]): void { try { sessionStorage.setItem(SIGNUP_KEYS.follows, JSON.stringify(ids)); } catch { /* no storage: the follows live for the page */ } }

export function mountSignup(root: HTMLElement): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  const body = $('suBody'), live = $('suLive'), loopEnd = $('suLoopEnd'), fade = $('suFade');
  if (!body || !live) return;
  const H = document.documentElement;
  const isPoster = () => !H.classList.contains('hero3d') || H.classList.contains('poster') || root.dataset.tier === 'poster';
  const dec = createDecoder(() => reducedMQ.matches);
  // every line split into its glyphs once, visible as it stands (the section is visible at rest; nothing waits for an observer)
  for (const el of root.querySelectorAll<HTMLElement>('[data-dc]')) dec.prepare(el, undefined, true);
  const announce = (text: string) => { live.textContent = ''; live.textContent = text; };
  /** a line's new words: wiped out, set, decoded in (the quiz's idiom) */
  const setLine = (el: HTMLElement, text: string) => { void dec.hide(el).then(() => { dec.set(el, text); dec.conceal(el); void dec.show(el); }); };

  // ---- the follows and the jar
  const jar = root.querySelector<HTMLElement>('.su-jar'), slot = root.querySelector<HTMLElement>('.su-slot[data-slot="yours"]'), count = root.querySelector<HTMLElement>('.su-count');
  const rows = [...root.querySelectorAll<HTMLLIElement>('li.su-follow-row')].map((li) => ({ li, id: li.dataset.id ?? '', link: li.querySelector<HTMLAnchorElement>('a.su-follow'), state: li.querySelector<HTMLElement>('.su-state') }));
  const follows = readFollows().filter((id) => SIGNUP_FOLLOWS.some((f) => f.id === id));
  /** the poster tier's still of a state: the sources, the image and the slot's key, swapped with no transition (this tier is the reduced-motion tier too) */
  function setStill(key: string) {
    const pic = slot?.querySelector<HTMLElement>('picture.su-still');
    if (!pic) return;
    const files = stillFiles(key);
    if (files) {
      for (const src of pic.querySelectorAll<HTMLSourceElement>('source')) src.srcset = src.type === 'image/avif' ? files.avif : files.webp;
      const img = pic.querySelector<HTMLImageElement>('img'); if (img) img.src = files.src;
      pic.removeAttribute('data-lazy');
    } else if (pic.hasAttribute('data-lazy')) {
      // no map (a build without the files): the markup's own empty jar
      for (const src of pic.querySelectorAll<HTMLSourceElement>('source[data-srcset]')) src.srcset = src.dataset.srcset ?? '';
      const img = pic.querySelector<HTMLImageElement>('img[data-src]'); if (img) img.src = img.dataset.src ?? '';
      pic.removeAttribute('data-lazy');
    }
    if (slot) slot.dataset.still = key;
  }
  /** the DOM carries the follows as data-collected (their order, 1-based), the source of truth the island reads at its start; the jar's count, level and description follow */
  function mark(animated: boolean) {
    follows.forEach((id, k) => {
      const r = rows.find((x) => x.id === id);
      if (!r) return;
      r.li.dataset.collected = String(k + 1);
      if (r.state) { if (animated) setLine(r.state, C.collected); else dec.set(r.state, C.collected); }
    });
    if (jar) { jar.dataset.n = String(follows.length); jar.dataset.level = yoursLevel(follows).toFixed(3); }
    if (count) { const text = yoursState(follows.length); if (animated) setLine(count, text); else dec.set(count, text); }
    slot?.setAttribute('aria-label', stillAlt(follows));
    if (isPoster()) setStill(stillKey(follows));
  }
  mark(false);
  // saved follows at mount: the island may have read the DOM before this script marked it (its chunk comes at idle, this
  // one when the section nears), so it hears them now and sets the jar at once (no press, no stream)
  if (follows.length) window.dispatchEvent(new CustomEvent('skreed:signup', { detail: { id: '', follows: [...follows] } }));
  for (const r of rows) {
    const link = r.link;
    if (!link) continue;
    link.addEventListener('click', () => {
      // the link opens its page as a link does (a new tab); the press is the follow's one evidence
      track('follow_click', { platform: r.id });
      if (follows.includes(r.id)) return;
      follows.push(r.id); writeFollows(follows);
      mark(true);
      const platform = jarById(r.id)?.platform ?? r.id;
      announce(follows.length >= FOLLOW_COUNT ? fill(C.liveFull, { platform }) : fill(C.live, { platform, n: follows.length, N: FOLLOW_COUNT }));
      if (follows.length >= FOLLOW_COUNT) track('jar_full');
      // the island hears the press and pours the platform's colours (hero/section5/jars.ts); the hooks read the event too
      window.dispatchEvent(new CustomEvent('skreed:signup', { detail: { id: r.id, follows: [...follows] } }));
    });
  }

  // ---- the frame from the island: the body goes under a seam's cloud with the cover; data-pouring while a stream runs
  let opacity = 1, viewed = false;
  window.__skreedSignupFrame = (f: SignupFrame) => {
    const op = f.cover > 0 ? Math.max(0, 1 - f.cover) : 1;
    if (op !== opacity) { opacity = op; body.style.opacity = op < 1 ? op.toFixed(3) : ''; }
    const state = f.cover > 0 ? 'seam' : 'rest';
    if (root.dataset.state !== state) root.dataset.state = state;
    if (f.pour) { if (root.dataset.pouring !== f.pour) root.dataset.pouring = f.pour; } else if (root.dataset.pouring !== undefined) delete root.dataset.pouring;
  };
  addEventListener('skreed:room-state', (e) => { if ((e as CustomEvent<string>).detail === 'wrap') announce(C.wrapLive); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { if (!viewed && es.some((x) => x.isIntersecting)) { viewed = true; track('signup_view'); } }, { rootMargin: '0px 0px -50% 0px' }).observe(root);
  }

  // ---- the poster tier: the still of the state now (never on the 3D path), and the loop is a fade through --night to the top
  const loadStills = () => { if (!slot?.dataset.still) setStill(stillKey(follows)); };
  if (loopEnd && fade && 'IntersectionObserver' in window) {
    let fading = false;
    new IntersectionObserver((es) => {
      if (!isPoster() || fading || !es.some((x) => x.isIntersecting)) return;
      fading = true; fade.hidden = false;
      const a = fade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reducedMQ.matches ? 0 : FADE_MS, fill: 'forwards' });
      a.finished.then(() => { scrollTo({ top: 0, behavior: 'instant' }); track('room_loop'); return fade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reducedMQ.matches ? 0 : FADE_MS, fill: 'forwards' }).finished; })
        .catch(() => {}).finally(() => { fade.hidden = true; fading = false; });
    }, { threshold: 0.95 }).observe(loopEnd);
  }
  // a fall to the poster path while the section is on screen: the still comes in, the body's opacity is put back
  new MutationObserver(() => { if (isPoster()) { loadStills(); body.style.opacity = ''; root.dataset.state = 'rest'; delete root.dataset.pouring; } }).observe(H, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => { if (isPoster()) { loadStills(); body.style.opacity = ''; root.dataset.state = 'rest'; delete root.dataset.pouring; } }).observe(root, { attributes: true, attributeFilter: ['data-tier'] });

  // ---- the form (section-5.md 2 "The form", 5; the quiz's gift form, quiz.md 5): rendered only with PUBLIC_LEADS on
  const form = $<HTMLFormElement>('suForm');
  if (!form) return;
  const email = form.querySelector<HTMLInputElement>('#suEmail')!, consent = form.querySelector<HTMLInputElement>('#suConsent')!;
  const send = form.querySelector<HTMLButtonElement>('#suSend')!, msg = form.querySelector<HTMLElement>('#suMsg')!;
  const errEmail = form.querySelector<HTMLElement>('#suErrEmail')!, errConsent = form.querySelector<HTMLElement>('#suErrConsent')!;
  const doneEl = $('suDone')!, doneText = doneEl.querySelector<HTMLElement>('.su-done-text')!, notYou = doneEl.querySelector<HTMLButtonElement>('.su-notyou')!;
  const fields = form.querySelector<HTMLElement>('.su-fields')!;
  dec.prepare(notYou, undefined, true);
  // the form's own lines go through the decoder too (set: at once, no animation), so each has its sentence-case copy
  const setErr = (el: HTMLElement, input: HTMLInputElement, text: string) => { dec.set(el, text); input.setAttribute('aria-invalid', text ? 'true' : 'false'); };
  const validEmail = () => { const ok = EMAIL.test(email.value.trim()); setErr(errEmail, email, ok ? '' : C.errEmail); return ok; };
  const validConsent = () => { const ok = consent.checked; setErr(errConsent, consent, ok ? '' : C.errConsent); return ok; };
  email.addEventListener('blur', () => { if (email.value) validEmail(); });   // on blur only once there is a value, never per keystroke
  consent.addEventListener('change', () => { if (consent.checked) validConsent(); });
  const note = (text: string) => { dec.set(msg, text); if (text) announce(text); };
  const closeForm = (text: string) => { fields.hidden = true; doneEl.hidden = false; dec.set(doneText, text); note(''); doneText.focus(); };
  const openForm = () => { doneEl.hidden = true; fields.hidden = false; email.value = ''; consent.checked = false; setErr(errEmail, email, ''); setErr(errConsent, consent, ''); note(''); email.focus(); };
  let sending = false, queued: Record<string, string> | null = null, inflight: AbortController | null = null;
  const flag = (input: HTMLInputElement, text: string) => { if (document.activeElement === input) announce(text); else input.focus(); };
  const setSending = (on: boolean, label: string) => { sending = on; send.setAttribute('aria-disabled', on ? 'true' : 'false'); dec.set(send, label); };
  const payload = (address: string): Record<string, string> => ({ email: address, consent: 'yes', follows: follows.join(','), source: 'signup' });
  function queueLead(b: Record<string, string>) { queued = b; try { sessionStorage.setItem(SIGNUP_KEYS.queue, JSON.stringify(b)); } catch { /* no storage: the queue lives in memory */ } closeForm(C.offline); track('signup_offline'); }
  async function submit(b: Record<string, string>) {
    if (sending) return;
    setSending(true, C.sending); note('');
    const ac = new AbortController();
    inflight = ac;
    const slow = setTimeout(() => { dec.set(send, C.still); }, SLOW_MS), hard = setTimeout(() => ac.abort(), HARD_MS);
    try {
      const res = await fetch(SIGNUP_LEAD_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b), signal: ac.signal, credentials: 'omit' });
      // a definite answer (saved, saved before, rejected) settles a queued lead too
      if (res.ok || res.status === 409 || res.status === 422) { queued = null; try { sessionStorage.removeItem(SIGNUP_KEYS.queue); } catch { /* ignore */ } }
      if (res.status === 422) { fields.hidden = false; doneEl.hidden = true; setErr(errEmail, email, C.errEmail); flag(email, C.errEmail); track('signup_error', { kind: 'invalid' }); }
      else if (!res.ok && res.status !== 409) throw new Error(String(res.status));
      else { closeForm(fill(C.done, { email: b.email })); track('signup_success', { dup: res.status === 409 ? 1 : 0 }); }
    } catch (err) {
      // offline is a failed request with navigator.onLine false (a pre-check lies on captive portals): queue and retry on `online`
      if (!navigator.onLine) queueLead(b);
      else { fields.hidden = false; doneEl.hidden = true; note(C.errSend); track('signup_error', { kind: err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'network' }); }
    } finally {
      clearTimeout(slow); clearTimeout(hard); if (inflight === ac) inflight = null;
      setSending(false, C.send);
    }
  }
  addEventListener('online', () => { const q = queued; if (q && !sending) { queued = null; void submit(q); } });
  try {
    const saved = sessionStorage.getItem(SIGNUP_KEYS.queue);
    if (saved) {
      const q = JSON.parse(saved) as Record<string, string>;
      email.value = q.email ?? ''; consent.checked = true;   // the visitor consented when it was queued
      if (navigator.onLine) void submit(q); else queueLead(q);
    }
  } catch { /* a bad entry is dropped */ }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (sending) return;
    const okEmail = validEmail(), okConsent = validConsent();
    if (!okEmail || !okConsent) { if (okEmail) flag(consent, C.errConsent); else flag(email, C.errEmail); return; }
    track('signup_submitted', { follows: follows.length });
    void submit(payload(email.value.trim()));
  });
  notYou.addEventListener('click', () => { queued = null; try { sessionStorage.removeItem(SIGNUP_KEYS.queue); } catch { /* ignore */ } openForm(); });
}
