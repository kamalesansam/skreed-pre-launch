// Section 3, the quiz (docs/specs/quiz.md 2, 4 and 5): the six swipe cards, the scoring, the result and the gift
// form. Loaded lazily by Quiz.astro once the section is within a screen. No library: Pointer Events for the swipe
// (touch, mouse and pen alike), the Web Animations API on transform and opacity, reduced motion from motion.ts. Every
// string comes from config/quiz.ts; the markup is server-rendered, this file only shows, hides and moves it.
import { QUIZ_CARDS, QUIZ_COPY as Q, QUIZ_LEAD_ENDPOINT, scoreQuiz, type Answer } from '../../config/quiz.ts';
import { reducedMQ } from '../motion.ts';
import { track } from './track.ts';

const EASE_STANDARD = 'cubic-bezier(0.2, 0, 0, 1)', EASE_IN = 'cubic-bezier(.55, .085, .68, .53)', EASE_REBOUND = 'cubic-bezier(0, .3, .5, 1)';
const DUR_OUT = 200, DUR_CARD = 300, DUR_REDUCED = 150;
const COMMIT_FRACTION = 0.35, FLICK = 0.5, DRAG_DEAD = 8, TAP_MS = 300;
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
  const answers: Answer[] = [];
  let state: State = 'intro', top = 0, busy = false;

  function setState(s: State) { state = s; root.dataset.state = s; }
  function announce(text: string) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = text; }); }

  // ---- the deck: one card on top (focusable, role group), the next behind it at 0.96
  function showCard(i: number, enter: boolean) {
    cards.forEach((c, k) => {
      c.classList.toggle('is-top', k === i); c.classList.toggle('is-next', k === i + 1); c.hidden = k < i || k > i + 1;
      c.tabIndex = k === i ? 0 : -1; c.inert = k !== i;   // the next card shows behind the top one but takes no focus or clicks
      c.style.transform = k === i + 1 ? 'scale(0.96)' : '';
    });
    const c = cards[i];
    // the next card was already in view behind the top one, so it only comes forward (no opacity ramp: that read as doubled text under the card flying off)
    if (enter) c.animate(reduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'scale(0.96)' }, { transform: 'none' }], { duration: reduced() ? DUR_REDUCED : DUR_CARD, easing: EASE_STANDARD });
    announce(`${Q.cardAria(i + 1)}: ${QUIZ_CARDS[i].q}`);
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
      busy = false; showCard(0, false);
    });
  }

  function commit(side: Answer, dx: number) {
    if (busy || state !== 'quiz') return;
    busy = true;
    const i = top, card = cards[i];
    answers[i] = side;
    track('quiz_answer', { q: i + 1, side: side ? 'left' : 'right' });
    const w = card.offsetWidth || 320, dir = side ? -1 : 1;
    const fly = reduced()
      ? card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR_REDUCED, fill: 'forwards' })
      : card.animate([{ transform: card.style.transform || 'none' }, { transform: `translateX(${dir * (w * 1.3 + Math.abs(dx))}px) rotate(${dir * 14}deg)` }], { duration: DUR_CARD, easing: EASE_IN, fill: 'forwards' });   // opaque all the way: it covers the next card until it has left
    fly.finished.then(() => {
      fly.cancel(); card.style.transform = ''; card.hidden = true; card.classList.remove('is-top');
      top = i + 1; busy = false;
      if (top >= QUIZ_CARDS.length) finish(); else showCard(top, true);
    });
  }

  function finish() {
    const r = scoreQuiz(answers);
    track('quiz_complete', { family: r.family, shade: r.shade });
    deck.hidden = true;
    for (const el of results.querySelectorAll<HTMLElement>('.qz-result')) el.hidden = el.dataset.family !== r.family;
    results.hidden = false; if (gift) gift.hidden = false; setState('result');
    const shown = results.querySelector<HTMLElement>(`.qz-result[data-family="${r.family}"]`);
    if (shown && !reduced()) shown.animate([{ transform: 'scale(0.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: EASE_STANDARD });
    announce(`${Q.eyebrow}: ${r.name}. ${r.persona}.`);
    shown?.querySelector<HTMLElement>('.qz-shade')?.focus({ preventScroll: true });
    if (form) { form.dataset.shade = r.shade; form.dataset.family = r.family; form.dataset.finish = r.finish; }
  }

  function retry() {
    track('quiz_retake');
    results.hidden = true; if (gift) gift.hidden = true;
    for (const c of cards) { c.hidden = false; c.classList.remove('is-top', 'is-next'); }
    answers.length = 0; top = 0;
    deck.hidden = false; setState('quiz'); showCard(0, true);
    root.scrollIntoView({ block: 'start', behavior: reduced() ? 'instant' : 'smooth' });   // the section's top, so the deck sits where the intro stood
  }

  // ---- input: a tap on an option, Left and Right on the card (the options bubble to it), or a drag past 35 percent
  // of the card's width or a flick. A gesture is a tap while it moves under 8 px and lasts under 300 ms; otherwise it
  // is a drag, and the click the browser fires afterwards is swallowed.
  let dragId: number | null = null, dragX0 = 0, dragY0 = 0, dragT0 = 0, dragged = false, lastX = 0, lastT = 0, vel = 0, dragCard: HTMLDivElement | null = null, follow = 0, swallow = false;
  const opts = (card: HTMLDivElement) => [...card.querySelectorAll<HTMLElement>('.qz-opt')];
  for (const card of cards) {
    for (const opt of opts(card)) opt.addEventListener('click', () => { if (swallow || !card.classList.contains('is-top')) return; commit(opt.dataset.side === '1' ? 1 : 0, 0); });
    card.addEventListener('keydown', (e) => { if (!card.classList.contains('is-top')) return; if (e.key === 'ArrowLeft') { e.preventDefault(); commit(1, 0); } else if (e.key === 'ArrowRight') { e.preventDefault(); commit(0, 0); } });
  }
  function applyDrag(card: HTMLDivElement, dx: number) {
    const w = card.offsetWidth || 320, p = Math.max(-1, Math.min(1, dx / (w * COMMIT_FRACTION)));
    if (!reduced()) card.style.transform = `translateX(${dx}px) rotate(${(8 * p).toFixed(2)}deg)`;   // leans into the drag (the same sense as the fly-off)
    const [l, r] = opts(card);
    l?.classList.toggle('is-lift', p <= -1); r?.classList.toggle('is-lift', p >= 1);   // past the threshold the side that will commit shows it (reduced motion too)
  }
  function springBack(card: HTMLDivElement) {
    for (const o of opts(card)) o.classList.remove('is-lift');
    const back = card.animate([{ transform: card.style.transform || 'none' }, { transform: 'none' }], { duration: reduced() ? 0 : DUR_CARD, easing: EASE_REBOUND, fill: 'forwards' });
    back.finished.then(() => { back.cancel(); card.style.transform = ''; });
  }
  cardsEl.addEventListener('pointerdown', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLDivElement>('.qz-card.is-top');
    if (!card || busy || e.button !== 0) return;
    dragId = e.pointerId; dragX0 = lastX = e.clientX; dragY0 = e.clientY; dragT0 = lastT = e.timeStamp; vel = 0; dragged = false; dragCard = card; swallow = false;
  });
  cardsEl.addEventListener('pointermove', (e) => {
    if (e.pointerId !== dragId || !dragCard) return;
    const dx = e.clientX - dragX0, dy = e.clientY - dragY0;
    if (!dragged) { if (Math.abs(dx) < DRAG_DEAD) return; if (Math.abs(dy) > Math.abs(dx)) { dragId = null; dragCard = null; return; } dragged = true; dragCard.setPointerCapture(e.pointerId); }
    const dt = e.timeStamp - lastT; if (dt > 0) vel = 0.7 * vel + 0.3 * ((e.clientX - lastX) / dt); lastX = e.clientX; lastT = e.timeStamp;
    if (!follow) follow = requestAnimationFrame(() => { follow = 0; if (dragCard) applyDrag(dragCard, dx); });
  });
  const endDrag = (e: PointerEvent, cancelled: boolean) => {
    if (e.pointerId !== dragId || !dragCard) return;
    const card = dragCard, dx = e.clientX - dragX0; dragId = null; dragCard = null;
    if (follow) { cancelAnimationFrame(follow); follow = 0; }
    if (!dragged) return;
    swallow = e.timeStamp - dragT0 >= TAP_MS || Math.abs(dx) >= DRAG_DEAD;
    setTimeout(() => { swallow = false; }, 0);
    const w = card.offsetWidth || 320;
    if (!cancelled && (Math.abs(dx) >= w * COMMIT_FRACTION || Math.abs(vel) >= FLICK)) { for (const o of opts(card)) o.classList.remove('is-lift'); commit(dx < 0 ? 1 : 0, dx); }
    else springBack(card);
  };
  cardsEl.addEventListener('pointerup', (e) => endDrag(e, false));
  cardsEl.addEventListener('pointercancel', (e) => endDrag(e, true));
  cardsEl.addEventListener('lostpointercapture', (e) => { if (e.pointerId === dragId) endDrag(e, true); });

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
  const setErr = (el: HTMLElement, input: HTMLInputElement, text: string) => { el.textContent = text; el.hidden = !text; input.setAttribute('aria-invalid', text ? 'true' : 'false'); };
  const validEmail = () => { const ok = EMAIL.test(email.value.trim()); setErr(errEmail, email, ok ? '' : Q.errEmail); return ok; };
  const validConsent = () => { const ok = consent.checked; setErr(errConsent, consent, ok ? '' : Q.errConsent); return ok; };
  email.addEventListener('blur', () => { if (email.value) validEmail(); });   // on blur only once there is a value, never per keystroke
  consent.addEventListener('change', () => { if (consent.checked) validConsent(); });
  const note = (text: string) => { msg.textContent = text; if (text) announce(text); };   // the status line stays in the tree so the live region is heard; the sr-only region repeats it
  const closeForm = (text: string) => { fields.hidden = true; doneEl.hidden = false; doneText.textContent = text; note(''); doneText.focus(); };
  const openForm = () => { doneEl.hidden = true; fields.hidden = false; email.value = ''; consent.checked = false; setErr(errEmail, email, ''); setErr(errConsent, consent, ''); note(''); email.focus(); };
  let sending = false, queued: Record<string, string> | null = null;
  const setSending = (on: boolean, label: string) => { sending = on; send.setAttribute('aria-disabled', on ? 'true' : 'false'); send.textContent = label; };
  function payload(address: string) { return { email: address, shadeId: form!.dataset.shade ?? '', familyId: form!.dataset.family ?? '', finish: form!.dataset.finish ?? '', answers: answers.join(''), source: 'quiz' }; }
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
