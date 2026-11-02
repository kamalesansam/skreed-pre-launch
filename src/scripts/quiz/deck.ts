// Section 3, the quiz (docs/specs/quiz.md 2, 4 and 5): the ten questions, the scoring, the shade draw, the result and
// the gift form, as plain text on the fog (Sam, 2026-10-19). Loaded lazily by Quiz.astro once the section is within a
// screen. Every change of screen is section 2's decode (decode.ts): the text on screen wipes out, the next decodes in,
// element after element; the answer taken stays a beat after the rest of its question has gone. No library: the decode
// sets each glyph's opacity, and the swatches fade in on opacity alone; reduced motion makes both a 0.2 s fade. Every
// string comes from config/quiz.ts and the markup is server-rendered (shade names, numbers and links included); this
// file only shows, hides, decodes and paints it.
import { QUIZ_COPY as Q, QUIZ_LEAD_ENDPOINT, QUIZ_QUESTIONS, pickShade, scoreQuiz, type PersonaId } from '../../config/quiz.ts';
import { reducedMQ } from '../motion.ts';
import { createDecoder } from './decode.ts';
import { ride, riding, unlock } from './gate.ts';
import { createPictures, type Pictures } from './picture.ts';
import { track } from './track.ts';

const DUR_MARK = 120, DUR_SWATCH = 400;
/** a press on a question this soon after it was put on screen is dropped: its words are still at opacity 0, so it is the
 *  second click of a double click (on Begin, an answer or Back), not a choice (review 2026-10-19) */
const GUARD = 350, GUARD_REDUCED = 150;
const QUEUE_KEY = 'skreed-quiz-lead';

type State = 'intro' | 'quiz' | 'result';

export function mountQuiz(root: HTMLElement): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  // the section's own markup (Quiz.astro): missing means a broken build, so it throws rather than mounting half a quiz
  const must = <T extends HTMLElement>(id: string): T => { const el = $<T>(id); if (!el) throw new Error(`quiz: #${id} missing`); return el; };
  const intro = must('qzIntro'), begin = must<HTMLButtonElement>('qzBegin'), skip = must<HTMLButtonElement>('qzSkip'), deck = must('qzDeck'), cardsEl = must('qzCards');
  const results = must('qzResults'), live = must('qzLive'), gift = $('qzGift'), form = $<HTMLFormElement>('qzForm');
  const cards = [...cardsEl.querySelectorAll<HTMLDivElement>('.qz-card')];
  const reduced = () => reducedMQ.matches;
  // data-decoding is on the section while any text is moving (the frame script and the tests wait for it to go)
  const dc = createDecoder(reduced, (on) => { root.toggleAttribute('data-decoding', on); });
  const answers: PersonaId[] = [];
  let state: State = 'intro', top = 0, busy = false, readyAt = 0;
  /** the gift form's own reset (set further down when the form is rendered): Try again abandons a send under way */
  let resetGift = () => {};
  /** and its labels put back before the gift decodes in again: an abandoned send leaves Send as it stood, for the wipe to take */
  let restoreGift = () => {};
  const early = () => performance.now() < readyAt;
  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  /** the decoded elements of a part, in reading order, less those inside something hidden (the drawn shade's mini, the done line) */
  const items = (scope: HTMLElement) => [...scope.querySelectorAll<HTMLElement>('[data-dc]')].filter((e) => { for (let p = e.parentElement; p && p !== scope; p = p.parentElement) if (p.hidden) return false; return true; });

  // ---- the visual questions' answer pictures (picture.ts): the answer under the pointer, in focus or pressed on a touch
  // screen shows its picture beside the question (above it on a phone), decoding in strip by strip; leaving it wipes it out
  const pics = new Map<HTMLDivElement, Pictures>();
  for (const card of cards) { const frame = card.querySelector<HTMLElement>('.qz-pics'); if (frame) pics.set(card, createPictures(frame, reduced)); }
  const stage = root.querySelector<HTMLElement>('.qz-stage');
  const wide = matchMedia('(min-width: 900px) and (min-height: 600px)');
  /** a phone held sideways (quiz.css): the frame is a row of the card's left column, under the question, as tall as the answers' column leaves it */
  const side = matchMedia('(min-width: 640px) and (max-height: 599px)');
  /** the logotype's band, 56 px, and 16 px more before a picture */
  const BAND = 56 + 16, MIN_FRAME = 96;
  /** where the band ends, in the viewport: 72 px under the viewport's top while the section's top is at it or below it (a phone browser whose bars have hidden leaves the stage lower than the viewport's top, and the frame may then stand above the section's top), and 72 px under the stage's top while the stage is above it (a measure taken with the page scrolled into the result, as retry's is before its scroll back, reads the same room the pinned section gives) */
  const bandEnd = () => Math.min(0, stage?.getBoundingClientRect().top ?? 0) + BAND;
  /** a phone held upright has no room beside the question: the frame takes the open space above the deck, under the band, at most 40% of the screen; none under 96 px */
  function fitPics() {
    for (const [card, ctl] of pics) {
      const frame = card.querySelector<HTMLElement>('.qz-pics')!;
      frame.style.removeProperty('--qz-pic-h'); frame.removeAttribute('data-none');
      if (side.matches) { if (!card.hidden) frame.toggleAttribute('data-none', frame.getBoundingClientRect().height < MIN_FRAME); }
      else if (!wide.matches) {
        const free = Math.min(card.getBoundingClientRect().top - 24 - bandEnd(), innerHeight * 0.4);
        frame.toggleAttribute('data-none', free < MIN_FRAME);
        frame.style.setProperty('--qz-pic-h', `${Math.max(0, Math.floor(free))}px`);
      }
      ctl.layout();
    }
  }
  addEventListener('resize', fitPics); wide.addEventListener('change', fitPics); side.addEventListener('change', fitPics);

  // the swatches take their shade from the catalog token through the CSSOM (the CSP allows no style attributes)
  for (const el of root.querySelectorAll<HTMLElement>('.qz-big, .qz-mini-sw')) el.style.background = `var(--shade-${el.dataset.shade})`;

  function setState(s: State) { state = s; root.dataset.state = s; }
  function announce(text: string) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = text; }); }

  // ---- the intro is visible at rest, as the server drew it (rule 12: no reveal on scroll); its text is split into glyphs
  // as it stands, so the first press wipes it out as section 2's labels go
  const introEls = items(intro);
  dc.prepare(begin, Q.begin, true); dc.prepare(skip, Q.skip, true);   // each given its config string: after a press before mount its copy reads "Loading..."
  for (const el of introEls) dc.prepare(el, undefined, true);

  // ---- the deck: one question on screen (focusable, role group), the rest hidden in the same grid cell
  function showCard(i: number) {
    cards.forEach((c, k) => {
      c.classList.toggle('is-top', k === i); c.hidden = k !== i; c.tabIndex = -1; c.inert = k !== i;   // focus from script only: the question is announced, then Tab or Down reaches its answers
      for (const o of c.querySelectorAll('.qz-opt[aria-pressed]')) o.removeAttribute('aria-pressed');
    });
    const c = cards[i], els = items(c);
    for (const ctl of pics.values()) ctl.clear();
    fitPics();
    for (const el of els) dc.prepare(el);
    readyAt = performance.now() + (reduced() ? GUARD_REDUCED : GUARD);
    void dc.showAll(els);
    announce(`${Q.cardAria(i + 1)}: ${QUIZ_QUESTIONS[i].q}`);
    c.focus({ preventScroll: true });
  }

  async function beginQuiz() {
    if (state !== 'intro' || busy) return;
    busy = true; begin.setAttribute('aria-disabled', 'true');   // a second press during the wipe does nothing
    track('quiz_start');
    answers.length = 0; top = 0;
    await dc.hideAll(introEls);
    intro.hidden = true; begin.removeAttribute('aria-disabled');
    deck.hidden = false; setState('quiz');
    busy = false; showCard(0);
  }

  /** an answer: it is underlined and stays while the rest of the question wipes out, then it goes and the next decodes in */
  async function commit(opt: HTMLButtonElement) {
    if (busy || state !== 'quiz' || early()) {
      // a tap dropped here showed its picture at the press: it goes again
      if (touchPic === opt) { touchPic = null; const c = opt.closest<HTMLDivElement>('.qz-card'); if (c) void pics.get(c)?.hide(opt.dataset.persona ?? ''); }
      return;
    }
    busy = true;
    const i = top, card = cards[i], persona = opt.dataset.persona as PersonaId;
    answers[i] = persona;
    track('quiz_answer', { q: i + 1, persona });
    opt.setAttribute('aria-pressed', 'true');
    const ctl = pics.get(card), touched = touchPic === opt;
    touchPic = null;
    await dc.hideAll(items(card).filter((e) => e !== opt));
    if (!reduced()) await wait(DUR_MARK);
    // an answer taken on a touch screen had no hover: its picture, shown at the press, holds the answer until it has
    // decoded (at most 0.9 s), so the visitor sees what they chose before the question goes; not under reduced motion
    // (the answer never holds there) and not where no frame is drawn (a phone with no room for it)
    if (touched && !reduced() && ctl?.has(persona) && ctl.visible()) await Promise.race([ctl.show(persona), wait(900)]);
    if (ctl?.has(persona)) void ctl.hide(persona);
    await dc.hide(opt);
    card.hidden = true; card.classList.remove('is-top');
    top = i + 1; busy = false;
    if (top >= QUIZ_QUESTIONS.length) finish(); else showCard(top);
  }

  /** Back: the last answer is dropped, this question wipes out and the previous one decodes in */
  async function back() {
    if (busy || state !== 'quiz' || top === 0 || early()) return;
    busy = true;   // no answer is taken while the questions change
    track('quiz_back', { q: top + 1 });
    answers.length = top - 1;
    await dc.hideAll(items(cards[top]));
    top -= 1; busy = false;
    showCard(top);
  }

  function finish() {
    const p = scoreQuiz(answers);
    const { shade, others } = pickShade(p);
    deck.hidden = true;
    for (const el of results.querySelectorAll<HTMLElement>('.qz-result')) el.hidden = el.dataset.persona !== p.id;
    const shown = results.querySelector<HTMLElement>(`.qz-result[data-persona="${p.id}"]`)!;
    // the drawn shade takes the large swatch, the heading, the family line and the link; the rest are the compatible ones
    const pick = shown.querySelector<HTMLElement>(`.qz-mini[data-shade="${shade}"]`)!;
    const big = shown.querySelector<HTMLElement>('.qz-big')!;
    big.dataset.shade = shade; big.style.background = `var(--shade-${shade})`;
    big.toggleAttribute('data-ring', pick.hasAttribute('data-ring')); big.toggleAttribute('data-ring-night', pick.hasAttribute('data-ring-night'));
    dc.prepare(shown.querySelector<HTMLElement>('.qz-shade')!, `${pick.dataset.name}.`);
    dc.prepare(shown.querySelector<HTMLElement>('.qz-fam')!, pick.dataset.fam ?? '');
    shown.querySelector<HTMLAnchorElement>('.qz-see')!.href = pick.dataset.href ?? '';
    for (const m of shown.querySelectorAll<HTMLElement>('.qz-mini')) m.hidden = m.dataset.shade === shade;
    results.hidden = false; if (gift) gift.hidden = false; setState('result');
    unlock('result');   // section 4 opens under the result and the gift (quiz-gate.md D2); nothing moves
    track('quiz_complete', { persona: p.id, shade, others: others.join(',') });
    const els = [...items(shown), ...(gift ? items(gift) : [])];
    restoreGift();
    for (const el of els) { dc.prepare(el); dc.conceal(el); }   // a label set at once earlier (Send) goes too, so the whole part decodes in
    for (const sw of shown.querySelectorAll<HTMLElement>('.qz-big, .qz-mini:not([hidden]) .qz-mini-sw')) sw.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced() ? 200 : DUR_SWATCH, easing: 'linear' });
    void dc.showAll(els);
    announce(`${Q.eyebrow}: ${pick.dataset.name}. ${p.name}.`);
    shown.querySelector<HTMLElement>('.qz-shade')?.focus({ preventScroll: true });
    if (form) { form.dataset.shade = shade; form.dataset.family = pick.dataset.family ?? ''; form.dataset.finish = p.finish; form.dataset.persona = p.id; }
  }

  async function retry() {
    if (busy || state !== 'result') return;
    busy = true;
    track('quiz_retake');
    resetGift();
    const shown = results.querySelector<HTMLElement>('.qz-result:not([hidden])');
    await dc.hideAll([...(shown ? items(shown) : []), ...(gift ? items(gift) : [])]);
    results.hidden = true; if (gift) gift.hidden = true;
    answers.length = 0; top = 0; busy = false;
    deck.hidden = false; setState('quiz'); showCard(0);
    root.scrollIntoView({ block: 'start', behavior: reduced() ? 'instant' : 'smooth' });   // the section's top, so the deck sits where the intro stood
  }

  /** Skip quiz (quiz-gate.md D3, D4): taken when Back's press would be (not during a change of screen, not inside the
   *  guard) and not while a ride runs; section 4 opens and the page rides to the hall; the quiz itself stays as it is */
  async function skipQuiz(control: HTMLButtonElement, q: number) {
    if (busy || early() || riding() || state !== (q ? 'quiz' : 'intro')) return;
    track('quiz_skip', { q });
    unlock('skip');
    await ride(control, { reduced: reduced(), keyboard: control.matches(':focus-visible'), label: (t) => dc.set(control, t ?? Q.skip), announce });
  }

  // ---- input: a tap, click, Enter or Space on an answer commits it; Up and Down move between the answers; Back
  let touchPic: HTMLButtonElement | null = null;
  for (const card of cards) {
    const opts = [...card.querySelectorAll<HTMLButtonElement>('.qz-opt')];
    const ctl = pics.get(card);
    if (ctl) for (const opt of opts) {
      const key = opt.dataset.persona ?? '';
      if (!ctl.has(key)) continue;
      const live = () => card.classList.contains('is-top') && !busy;
      opt.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch' && live()) void ctl.show(key); });
      opt.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch' && opt.getAttribute('aria-pressed') !== 'true') void ctl.hide(key); });
      opt.addEventListener('focus', () => { if (live() && opt.matches(':focus-visible')) void ctl.show(key); });
      opt.addEventListener('blur', () => { if (opt.getAttribute('aria-pressed') !== 'true') void ctl.hide(key); });
      opt.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' && live()) { touchPic = opt; void ctl.show(key); } });
      // a press that turns into a scroll (or a long press) ends with no click: its picture goes
      opt.addEventListener('pointercancel', (e) => { if (e.pointerType === 'touch' && touchPic === opt) { touchPic = null; void ctl.hide(key); } });
    }
    for (const opt of opts) opt.addEventListener('click', () => { if (card.classList.contains('is-top')) void commit(opt); });
    card.querySelector('.qz-back')?.addEventListener('click', () => { void back(); });
    const skipHere = card.querySelector<HTMLButtonElement>('.qz-skip');
    skipHere?.addEventListener('click', () => { if (card.classList.contains('is-top')) void skipQuiz(skipHere, Number(card.dataset.i) + 1); });
    card.addEventListener('keydown', (e) => {
      if (!card.classList.contains('is-top') || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      e.preventDefault();
      const at = opts.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.key === 'ArrowDown' ? (at < 0 ? 0 : Math.min(opts.length - 1, at + 1)) : (at < 0 ? opts.length - 1 : Math.max(0, at - 1));
      opts[next].focus();
    });
  }

  // ---- begin: the words (tap, click, Enter, Space); a press made before this chunk arrived begins now
  begin.removeAttribute('aria-disabled'); begin.removeAttribute('aria-busy');
  begin.addEventListener('click', () => { void beginQuiz(); });
  if (begin.dataset.pending === '1') { delete begin.dataset.pending; void beginQuiz(); }
  // ---- and Skip quiz on the intro, the same way (a press before this chunk arrived rides now)
  skip.removeAttribute('aria-disabled'); skip.removeAttribute('aria-busy');
  skip.addEventListener('click', () => { void skipQuiz(skip, 0); });
  if (skip.dataset.pending === '1') { delete skip.dataset.pending; void skipQuiz(skip, 0); }
  for (const b of results.querySelectorAll<HTMLButtonElement>('.qz-retry')) b.addEventListener('click', () => { void retry(); });

  // ---- the gift form (quiz.md 5: validation on blur and submit, sending, error, offline queue, duplicate, success);
  // rendered only when the build has PUBLIC_LEADS on (Quiz.astro), so everything below is skipped without it
  if (!form || !gift) return;
  const email = form.querySelector<HTMLInputElement>('#qzEmail')!, consent = form.querySelector<HTMLInputElement>('#qzConsent')!;
  const send = form.querySelector<HTMLButtonElement>('#qzSend')!, msg = form.querySelector<HTMLElement>('#qzMsg')!;
  const errEmail = form.querySelector<HTMLElement>('#qzErrEmail')!, errConsent = form.querySelector<HTMLElement>('#qzErrConsent')!;
  const doneEl = $('qzDone')!, doneText = doneEl.querySelector<HTMLElement>('.qz-done-text')!, notYou = doneEl.querySelector<HTMLButtonElement>('.qz-notyou')!;
  const fields = form.querySelector<HTMLElement>('.qz-fields')!;
  dc.prepare(notYou, undefined, true);
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // the form's own lines go through the decoder too (set: at once, no animation), so each has its sentence-case copy for
  // assistive technology beside the capitals on screen
  const setErr = (el: HTMLElement, input: HTMLInputElement, text: string) => { dc.set(el, text); input.setAttribute('aria-invalid', text ? 'true' : 'false'); };   // the line keeps its height (quiz.css), so a message never moves the controls under it
  const validEmail = () => { const ok = EMAIL.test(email.value.trim()); setErr(errEmail, email, ok ? '' : Q.errEmail); return ok; };
  const validConsent = () => { const ok = consent.checked; setErr(errConsent, consent, ok ? '' : Q.errConsent); return ok; };
  email.addEventListener('blur', () => { if (email.value) validEmail(); });   // on blur only once there is a value, never per keystroke
  consent.addEventListener('change', () => { if (consent.checked) validConsent(); });
  const note = (text: string) => { dc.set(msg, text); if (text) announce(text); };   // the status line stays in the tree so the live region is heard; the sr-only region repeats it
  const closeForm = (text: string) => { fields.hidden = true; doneEl.hidden = false; dc.set(doneText, text); note(''); doneText.focus(); };
  const openForm = () => { doneEl.hidden = true; fields.hidden = false; email.value = ''; consent.checked = false; setErr(errEmail, email, ''); setErr(errConsent, consent, ''); note(''); email.focus(); };
  let sending = false, queued: Record<string, string> | null = null, gen = 0, inflight: AbortController | null = null;
  resetGift = () => { gen++; inflight?.abort(); inflight = null; setErr(errEmail, email, ''); setErr(errConsent, consent, ''); note(''); };
  restoreGift = () => { if (!sending) dc.prepare(send, Q.send); };
  /** an error line is not a live region: when focus does not move to its field (it is there already), it is announced */
  const flag = (input: HTMLInputElement, text: string) => { if (document.activeElement === input) announce(text); else input.focus(); };
  const setSending = (on: boolean, label: string) => { sending = on; send.setAttribute('aria-disabled', on ? 'true' : 'false'); dc.set(send, label); };
  function payload(address: string) { return { email: address, shadeId: form!.dataset.shade ?? '', familyId: form!.dataset.family ?? '', finish: form!.dataset.finish ?? '', persona: form!.dataset.persona ?? '', answers: answers.join(','), source: 'quiz' }; }
  function queueLead(body: Record<string, string>) { queued = body; try { sessionStorage.setItem(QUEUE_KEY, JSON.stringify(body)); } catch { /* no storage: the queue lives in memory */ } closeForm(Q.offline); }
  async function submit(body: Record<string, string>) {
    if (sending) return;
    setSending(true, Q.sending); note('');
    const ac = new AbortController(), g = gen;
    inflight = ac;
    const slow = setTimeout(() => { dc.set(send, Q.trying); }, 8000), hard = setTimeout(() => ac.abort(), 20000);
    try {
      const res = await fetch(QUIZ_LEAD_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ac.signal });
      if (g !== gen) return;   // Try again was pressed while it was sending: the answer belongs to a result no longer shown
      // a definite answer (sent, duplicate, rejected) settles a queued lead too: it must not be re-sent on the next load
      if (res.ok || res.status === 409 || res.status === 422) { queued = null; try { sessionStorage.removeItem(QUEUE_KEY); } catch { /* ignore */ } }
      if (res.status === 409) { closeForm(Q.dup); track('lead_error', { kind: 'duplicate' }); }
      else if (res.status === 422) { fields.hidden = false; doneEl.hidden = true; setErr(errEmail, email, Q.errEmail); flag(email, Q.errEmail); track('lead_error', { kind: 'invalid' }); }
      else if (!res.ok) throw new Error(String(res.status));
      else { closeForm(Q.done(body.email)); track('lead_success'); }
    } catch (err) {
      if (g !== gen) return;
      // offline is a failed request with navigator.onLine false (a pre-check lies on captive portals): queue and retry on `online`
      if (!navigator.onLine) queueLead(body);
      else { fields.hidden = false; doneEl.hidden = true; note(Q.errSend); track('lead_error', { kind: err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'network' }); }
    } finally {
      clearTimeout(slow); clearTimeout(hard); if (inflight === ac) inflight = null;
      // abandoned by Try again: Send is wiping out with the rest of the gift, so only the state is reset here and its
      // label is left to the wipe (restoreGift puts its words back before the next result decodes in)
      if (g === gen) setSending(false, Q.send); else { sending = false; send.setAttribute('aria-disabled', 'false'); }
    }
  }
  addEventListener('online', () => { const q = queued; if (q && !sending) { queued = null; void submit(q); } });
  try {
    const saved = sessionStorage.getItem(QUEUE_KEY);
    if (saved) {
      const q = JSON.parse(saved) as Record<string, string>;
      email.value = q.email ?? ''; consent.checked = true;   // the visitor consented when it was queued; a failure then shows over the address, not an empty field
      if (navigator.onLine) void submit(q); else queueLead(q);
    }
  } catch { /* a bad entry is dropped */ }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (sending) return;
    const okEmail = validEmail(), okConsent = validConsent();
    if (!okEmail || !okConsent) { if (okEmail) flag(consent, Q.errConsent); else flag(email, Q.errEmail); return; }
    track('lead_submit');
    void submit(payload(email.value.trim()));
  });
  notYou.addEventListener('click', () => { queued = null; try { sessionStorage.removeItem(QUEUE_KEY); } catch { /* ignore */ } openForm(); });
}
