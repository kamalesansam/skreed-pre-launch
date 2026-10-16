// Section 3, the quiz (docs/specs/quiz.md 2, 4 and 5): the ten question cards, the scoring, the shade draw, the result
// and the gift form. Loaded lazily by Quiz.astro once the section is within a screen. No library: the Web Animations
// API on transform and opacity, reduced motion from motion.ts. Every string comes from config/quiz.ts and the markup is
// server-rendered (shade names, numbers and links included); this file only shows, hides, moves and paints it.
import { QUIZ_COPY as Q, QUIZ_LEAD_ENDPOINT, QUIZ_QUESTIONS, pickShade, scoreQuiz, type PersonaId } from '../../config/quiz.ts';
import { reducedMQ } from '../motion.ts';
import { track } from './track.ts';

const EASE_STANDARD = 'cubic-bezier(0.2, 0, 0, 1)', EASE_IN = 'cubic-bezier(.55, .085, .68, .53)';
const DUR_OUT = 200, DUR_CARD = 300, DUR_REDUCED = 150, DUR_MARK = 120;
const QUEUE_KEY = 'skreed-quiz-lead';

type State = 'intro' | 'quiz' | 'result';

export function mountQuiz(root: HTMLElement): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  // the section's own markup (Quiz.astro): missing means a broken build, so it throws rather than mounting half a quiz
  const must = <T extends HTMLElement>(id: string): T => { const el = $<T>(id); if (!el) throw new Error(`quiz: #${id} missing`); return el; };
  const intro = must('qzIntro'), begin = must<HTMLButtonElement>('qzBegin'), deck = must('qzDeck'), cardsEl = must('qzCards');
  const results = must('qzResults'), live = must('qzLive'), gift = $('qzGift'), form = $<HTMLFormElement>('qzForm');
  const cards = [...cardsEl.querySelectorAll<HTMLDivElement>('.qz-card')];
  const reduced = () => reducedMQ.matches;
  const answers: PersonaId[] = [];
  let state: State = 'intro', top = 0, busy = false;

  // the swatches take their shade from the catalog token through the CSSOM (the CSP allows no style attributes)
  for (const el of root.querySelectorAll<HTMLElement>('.qz-big, .qz-mini-sw')) el.style.background = `var(--shade-${el.dataset.shade})`;

  function setState(s: State) { state = s; root.dataset.state = s; }
  function announce(text: string) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = text; }); }

  // ---- the deck: one card on top (focusable, role group), the next behind it at 0.96 and inert
  function showCard(i: number, enter: 'none' | 'next' | 'back') {
    cards.forEach((c, k) => {
      c.classList.toggle('is-top', k === i); c.classList.toggle('is-next', k === i + 1); c.hidden = k < i || k > i + 1;
      c.tabIndex = k === i ? 0 : -1; c.inert = k !== i;
      c.style.transform = k === i + 1 ? 'scale(0.96)' : '';
      for (const o of c.querySelectorAll('.qz-opt[aria-pressed]')) o.removeAttribute('aria-pressed');
    });
    const c = cards[i];
    if (enter === 'next') c.animate(reduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'scale(0.96)' }, { transform: 'none' }], { duration: reduced() ? DUR_REDUCED : DUR_CARD, easing: EASE_STANDARD });
    if (enter === 'back') c.animate(reduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: `translateX(${-(c.offsetWidth || 320) * 1.3}px) rotate(-14deg)` }, { transform: 'none' }], { duration: reduced() ? DUR_REDUCED : DUR_CARD, easing: EASE_STANDARD });
    announce(`${Q.cardAria(i + 1)}: ${QUIZ_QUESTIONS[i].q}`);
    c.focus({ preventScroll: true });
  }

  function beginQuiz() {
    if (state !== 'intro' || busy) return;
    busy = true; begin.setAttribute('aria-disabled', 'true');   // a second press during the fade does nothing
    track('quiz_start');
    answers.length = 0; top = 0;
    const out = intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced() ? DUR_REDUCED : DUR_OUT, easing: EASE_STANDARD, fill: 'forwards' });
    out.finished.then(() => {
      intro.hidden = true; out.cancel(); begin.removeAttribute('aria-disabled');
      deck.hidden = false; setState('quiz');
      if (!reduced()) deck.animate([{ transform: 'translateY(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: EASE_STANDARD });
      busy = false; showCard(0, 'none');
    });
  }

  /** an answer: the button is marked (filled Urban Slate) for a beat, then the card flies off to the left */
  function commit(opt: HTMLButtonElement) {
    if (busy || state !== 'quiz') return;
    busy = true;
    const i = top, card = cards[i], persona = opt.dataset.persona as PersonaId;
    answers[i] = persona;
    track('quiz_answer', { q: i + 1, persona });
    opt.setAttribute('aria-pressed', 'true');
    const w = card.offsetWidth || 320;
    setTimeout(() => {
      const fly = reduced()
        ? card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR_REDUCED, fill: 'forwards' })
        : card.animate([{ transform: 'none' }, { transform: `translateX(${-w * 1.3}px) rotate(-14deg)` }], { duration: DUR_CARD, easing: EASE_IN, fill: 'forwards' });   // opaque all the way: it covers the next card until it has left
      fly.finished.then(() => {
        fly.cancel(); card.hidden = true; card.classList.remove('is-top');
        top = i + 1; busy = false;
        if (top >= QUIZ_QUESTIONS.length) finish(); else showCard(top, 'next');
      });
    }, reduced() ? 0 : DUR_MARK);
  }

  /** Back: the last answer is dropped and the previous card comes back in from the left */
  function back() {
    if (busy || state !== 'quiz' || top === 0) return;
    busy = true;   // no answer is taken while the previous card is still coming back
    track('quiz_back', { q: top + 1 });
    answers.length = top - 1; top -= 1;
    showCard(top, 'back');
    setTimeout(() => { busy = false; }, reduced() ? DUR_REDUCED : DUR_CARD);
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
    big.dataset.shade = shade; big.style.background = `var(--shade-${shade})`; big.toggleAttribute('data-ring', pick.hasAttribute('data-ring'));
    shown.querySelector('.qz-shade')!.textContent = `${pick.dataset.name}.`;
    shown.querySelector('.qz-fam')!.textContent = pick.dataset.fam ?? '';
    shown.querySelector<HTMLAnchorElement>('.qz-see')!.href = pick.dataset.href ?? '';
    for (const m of shown.querySelectorAll<HTMLElement>('.qz-mini')) m.hidden = m.dataset.shade === shade;
    results.hidden = false; if (gift) gift.hidden = false; setState('result');
    track('quiz_complete', { persona: p.id, shade, others: others.join(',') });
    if (!reduced()) shown.animate([{ transform: 'scale(0.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: EASE_STANDARD });
    announce(`${Q.eyebrow}: ${pick.dataset.name}. ${p.name}.`);
    shown.querySelector<HTMLElement>('.qz-shade')?.focus({ preventScroll: true });
    if (form) { form.dataset.shade = shade; form.dataset.family = pick.dataset.family ?? ''; form.dataset.finish = p.finish; form.dataset.persona = p.id; }
  }

  function retry() {
    track('quiz_retake');
    results.hidden = true; if (gift) gift.hidden = true;
    for (const c of cards) { c.hidden = false; c.classList.remove('is-top', 'is-next'); }
    answers.length = 0; top = 0;
    deck.hidden = false; setState('quiz'); showCard(0, 'next');
    root.scrollIntoView({ block: 'start', behavior: reduced() ? 'instant' : 'smooth' });   // the section's top, so the deck sits where the intro stood
  }

  // ---- input: a tap, click, Enter or Space on an answer commits it; Up and Down move between the answers; Back
  for (const card of cards) {
    const opts = [...card.querySelectorAll<HTMLButtonElement>('.qz-opt')];
    for (const opt of opts) opt.addEventListener('click', () => { if (card.classList.contains('is-top')) commit(opt); });
    card.querySelector('.qz-back')?.addEventListener('click', back);
    card.addEventListener('keydown', (e) => {
      if (!card.classList.contains('is-top') || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      e.preventDefault();
      const at = opts.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.key === 'ArrowDown' ? (at < 0 ? 0 : Math.min(opts.length - 1, at + 1)) : (at < 0 ? opts.length - 1 : Math.max(0, at - 1));
      opts[next].focus();
    });
  }

  // ---- begin: the button (tap, click, Enter, Space); a press made before this chunk arrived begins now
  begin.removeAttribute('aria-disabled'); begin.removeAttribute('aria-busy'); begin.textContent = Q.begin;
  begin.addEventListener('click', beginQuiz);
  if (begin.dataset.pending === '1') { delete begin.dataset.pending; beginQuiz(); }
  for (const b of results.querySelectorAll<HTMLButtonElement>('.qz-retry')) b.addEventListener('click', retry);

  // ---- the gift form (quiz.md 5: validation on blur and submit, sending, error, offline queue, duplicate, success);
  // rendered only when the build has PUBLIC_LEADS on (Quiz.astro), so everything below is skipped without it
  if (!form || !gift) return;
  const email = form.querySelector<HTMLInputElement>('#qzEmail')!, consent = form.querySelector<HTMLInputElement>('#qzConsent')!;
  const send = form.querySelector<HTMLButtonElement>('#qzSend')!, msg = form.querySelector<HTMLElement>('#qzMsg')!;
  const errEmail = form.querySelector<HTMLElement>('#qzErrEmail')!, errConsent = form.querySelector<HTMLElement>('#qzErrConsent')!;
  const doneEl = $('qzDone')!, doneText = doneEl.querySelector<HTMLElement>('.qz-done-text')!, notYou = doneEl.querySelector<HTMLButtonElement>('.qz-notyou')!;
  const fields = form.querySelector<HTMLElement>('.qz-fields')!;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const setErr = (el: HTMLElement, input: HTMLInputElement, text: string) => { el.textContent = text; input.setAttribute('aria-invalid', text ? 'true' : 'false'); };   // the line keeps its height (quiz.css), so a message never moves the controls under it
  const validEmail = () => { const ok = EMAIL.test(email.value.trim()); setErr(errEmail, email, ok ? '' : Q.errEmail); return ok; };
  const validConsent = () => { const ok = consent.checked; setErr(errConsent, consent, ok ? '' : Q.errConsent); return ok; };
  email.addEventListener('blur', () => { if (email.value) validEmail(); });   // on blur only once there is a value, never per keystroke
  consent.addEventListener('change', () => { if (consent.checked) validConsent(); });
  const note = (text: string) => { msg.textContent = text; if (text) announce(text); };   // the status line stays in the tree so the live region is heard; the sr-only region repeats it
  const closeForm = (text: string) => { fields.hidden = true; doneEl.hidden = false; doneText.textContent = text; note(''); doneText.focus(); };
  const openForm = () => { doneEl.hidden = true; fields.hidden = false; email.value = ''; consent.checked = false; setErr(errEmail, email, ''); setErr(errConsent, consent, ''); note(''); email.focus(); };
  let sending = false, queued: Record<string, string> | null = null;
  const setSending = (on: boolean, label: string) => { sending = on; send.setAttribute('aria-disabled', on ? 'true' : 'false'); send.textContent = label; };
  function payload(address: string) { return { email: address, shadeId: form!.dataset.shade ?? '', familyId: form!.dataset.family ?? '', finish: form!.dataset.finish ?? '', persona: form!.dataset.persona ?? '', answers: answers.join(','), source: 'quiz' }; }
  function queueLead(body: Record<string, string>) { queued = body; try { sessionStorage.setItem(QUEUE_KEY, JSON.stringify(body)); } catch { /* no storage: the queue lives in memory */ } closeForm(Q.offline); }
  async function submit(body: Record<string, string>) {
    if (sending) return;
    setSending(true, Q.sending); note('');
    const ac = new AbortController();
    const slow = setTimeout(() => { send.textContent = Q.trying; }, 8000), hard = setTimeout(() => ac.abort(), 20000);
    try {
      const res = await fetch(QUIZ_LEAD_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ac.signal });
      // a definite answer (sent, duplicate, rejected) settles a queued lead too: it must not be re-sent on the next load
      if (res.ok || res.status === 409 || res.status === 422) { queued = null; try { sessionStorage.removeItem(QUEUE_KEY); } catch { /* ignore */ } }
      if (res.status === 409) { closeForm(Q.dup); track('lead_error', { kind: 'duplicate' }); }
      else if (res.status === 422) { fields.hidden = false; doneEl.hidden = true; setErr(errEmail, email, Q.errEmail); track('lead_error', { kind: 'invalid' }); }
      else if (!res.ok) throw new Error(String(res.status));
      else { closeForm(Q.done(body.email)); track('lead_success'); }
    } catch (err) {
      // offline is a failed request with navigator.onLine false (a pre-check lies on captive portals): queue and retry on `online`
      if (!navigator.onLine) queueLead(body);
      else { fields.hidden = false; doneEl.hidden = true; note(Q.errSend); track('lead_error', { kind: err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'network' }); }
    } finally { clearTimeout(slow); clearTimeout(hard); setSending(false, Q.send); }
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
    if (!okEmail || !okConsent) { (okEmail ? consent : email).focus(); return; }
    track('lead_submit');
    void submit(payload(email.value.trim()));
  });
  notYou.addEventListener('click', () => { queued = null; try { sessionStorage.removeItem(QUEUE_KEY); } catch { /* ignore */ } openForm(); });
}
