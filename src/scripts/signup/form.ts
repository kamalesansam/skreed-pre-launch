// Section 5's email form (PUBLIC_LEADS on; the quiz's gift form, quiz.md 5), its own chunk since 2026-11-03 so the page
// script stays in its budget and a build without the form never fetches it: validation on blur and submit, sending, the
// error line, the offline queue sent on `online`, the duplicate, done. Since 2026-11-03 a save mails a six-digit code and
// the form asks for it in the same place (the code field and Confirm where the email stood, "Send a new code" and "Use
// another email" where the tick stood); the address counts once the code is right (Sam: "the emails are veified with an
// otp, so we actually know thats the right email of that person"; src/scripts/lead/code.ts).
import { SIGNUP_COPY as C, SIGNUP_KEYS, SIGNUP_LEAD_ENDPOINT, fill } from '../../config/signup.ts';
import { LEAD_CODE_COPY as K, codeLine, waitLine, wrongLine } from '../../config/lead-code.ts';
import { RESEND_GAP_S, checkCode, cleanCode, cleanName, codeComplete, readCheck, readSave, validName as nameOk } from '../lead/code.ts';
import { track } from '../quiz/track.ts';
import '../../styles/signup-form.css';

const SLOW_MS = 8000, HARD_MS = 20000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function el<T extends keyof HTMLElementTagNameMap>(tag: T, attrs: Record<string, string>, text?: string): HTMLElementTagNameMap[T] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text) e.textContent = text;
  return e;
}

export function mountForm(form: HTMLFormElement, ctx: { follows: () => readonly string[]; announce: (text: string) => void }): void {
  const { announce } = ctx;
  const email = form.querySelector<HTMLInputElement>('#suEmail'), send = form.querySelector<HTMLButtonElement>('#suSend'), msg = form.querySelector<HTMLElement>('#suMsg');
  const pill = form.querySelector<HTMLElement>('#suPill'), done = form.querySelector<HTMLElement>('#suDone'), notYou = form.querySelector<HTMLButtonElement>('#suNotYou');
  const consent = form.querySelector<HTMLInputElement>('#suConsent'), consentRow = form.querySelector<HTMLElement>('#suConsentRow');
  if (!email || !send || !msg || !pill || !done || !notYou || !consent || !consentRow) return;
  // the first name (required, above the email) and the code step's field and links, made here so the first view
  // carries none of them (section 5's budget)
  const nameRow = el('div', { class: 'su-namef', id: 'suNameRow' });
  const nameLabel = el('label', { class: 'sr-only', for: 'suName' }, K.name);
  const name = el('input', { class: 'su-input su-name', id: 'suName', name: 'name', type: 'text', autocomplete: 'given-name', autocapitalize: 'words', maxlength: '60', spellcheck: 'false', required: '', placeholder: K.name, 'aria-describedby': 'suMsg' });
  nameRow.append(nameLabel, name);
  form.querySelector('.su-slotf')?.before(nameRow);
  const codePill = el('div', { class: 'su-pill', id: 'suCodePill', hidden: '' });
  const code = el('input', { class: 'su-input su-code', id: 'suCode', name: 'code', type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', pattern: '[0-9]*', maxlength: '9', spellcheck: 'false', placeholder: K.code, 'aria-label': K.code, 'aria-describedby': 'suMsg' });
  const confirm = el('button', { type: 'submit', class: 'su-send', id: 'suConfirm' }, C.confirm);
  codePill.append(code, confirm);
  done.before(codePill);
  const codeLinks = el('div', { class: 'su-codelinks', id: 'suCodeLinks', hidden: '' });
  const resend = el('button', { type: 'button', class: 'su-notyou', id: 'suResend' }, K.resend), other = el('button', { type: 'button', class: 'su-notyou', id: 'suOther' }, K.other);
  codeLinks.append(resend, other);
  consentRow.after(codeLinks);
  const note = (text: string) => { msg.textContent = text; };   // role=status: read politely
  const setErr = (text: string) => { note(text); email.setAttribute('aria-invalid', text ? 'true' : 'false'); };
  const validName = () => { const ok = nameOk(name.value); name.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok) note(K.errName); else if (msg.textContent === K.errName) note(''); return ok; };
  name.addEventListener('blur', () => { if (name.value) validName(); });
  const validEmail = () => { const ok = EMAIL.test(email.value.trim()); setErr(ok ? '' : C.errEmail); return ok; };
  const validConsent = () => { const ok = consent.checked; consent.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok) note(C.errConsent); return ok; };
  consent.addEventListener('change', () => { if (consent.checked && msg.textContent === C.errConsent) { note(''); consent.setAttribute('aria-invalid', 'false'); } });
  email.addEventListener('blur', () => { if (email.value) validEmail(); });   // on blur only once there is a value, never per keystroke

  // the form's three stages: the email (with the tick), the code, done
  let step: 'email' | 'code' | 'done' = 'email', lastBody: Record<string, string> | null = null;
  const showStep = (s: typeof step) => {
    step = s;
    pill.hidden = s !== 'email'; consentRow.hidden = s !== 'email'; nameRow.hidden = s !== 'email';
    codePill.hidden = s !== 'code'; codeLinks.hidden = s !== 'code';
    done.hidden = s !== 'done'; notYou.hidden = s !== 'done';
  };
  // "Send a new code" waits out the server's gap, counting down in its own words
  let tick = 0;
  const stopTimer = () => { clearInterval(tick); tick = 0; resend.setAttribute('aria-disabled', 'false'); resend.textContent = K.resend; };
  const startTimer = (s: number) => {
    clearInterval(tick);
    const until = performance.now() + s * 1000;
    const step = () => {
      const left = Math.ceil((until - performance.now()) / 1000);
      if (left <= 0) { stopTimer(); return; }
      resend.setAttribute('aria-disabled', 'true'); resend.textContent = codeLine(K.resendIn, { s: left });
    };
    step(); tick = window.setInterval(step, 1000);
  };
  const closeForm = (text: string) => { stopTimer(); showStep('done'); done.textContent = text; done.title = text; note(''); done.focus(); };
  const openForm = () => { inflight?.abort(); inflight = null; stopTimer(); lastBody = null; showStep('email'); consent.checked = false; name.value = ''; email.value = ''; code.value = ''; name.setAttribute('aria-invalid', 'false'); setErr(''); name.focus(); };
  const askCode = (b: Record<string, string>, again: boolean, gap: number) => {
    lastBody = b; showStep('code'); code.value = ''; code.setAttribute('aria-invalid', 'false');
    note(codeLine(again ? K.resent : K.sent, { email: b.email })); startTimer(gap); code.focus();
  };

  let sending = false, queued: Record<string, string> | null = null, inflight: AbortController | null = null;
  const setSending = (on: boolean, label: string) => { sending = on; send.setAttribute('aria-disabled', on ? 'true' : 'false'); send.textContent = label; };
  const payload = (address: string): Record<string, string> => ({ email: address, name: cleanName(name.value), follows: ctx.follows().join(','), consent: 'yes', source: 'signup' });
  const queueLead = (b: Record<string, string>) => { queued = b; try { sessionStorage.setItem(SIGNUP_KEYS.queue, JSON.stringify(b)); } catch { /* no storage: the queue lives in memory */ } closeForm(C.offline); track('signup_offline'); };
  const unqueue = () => { queued = null; try { sessionStorage.removeItem(SIGNUP_KEYS.queue); } catch { /* ignore */ } };
  /** a save, from the email step or as "Send a new code" from the code step */
  const submit = async (b: Record<string, string>, again = false): Promise<void> => {
    if (sending) return;
    if (again) resend.setAttribute('aria-disabled', 'true'); else setSending(true, C.sending);
    note('');
    const ac = new AbortController();
    inflight = ac;
    const slow = setTimeout(() => { if (!again) send.textContent = C.still; }, SLOW_MS), hard = setTimeout(() => ac.abort(), HARD_MS);
    sending = true;
    try {
      const res = await fetch(SIGNUP_LEAD_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b), signal: ac.signal, credentials: 'omit' });
      if (inflight !== ac) return;   // "Use another email" was pressed while it was sending
      const a = await readSave(res);
      if (a.kind === 'error') throw new Error(String(a.status));
      unqueue();   // a definite answer settles a queued lead too
      if (a.kind === 'code') { askCode(b, again, a.gap); track('signup_code_sent', { again: again ? 1 : 0 }); }
      else if (a.kind === 'dup') { closeForm(fill(C.done, { email: b.email })); track('signup_success', { dup: 1 }); }
      else if (a.kind === 'invalid') { showStep('email'); setErr(C.errEmail); email.focus(); track('signup_error', { kind: 'invalid' }); }
      else if (a.kind === 'name') { showStep('email'); name.setAttribute('aria-invalid', 'true'); note(K.errName); name.focus(); track('signup_error', { kind: 'name' }); }
      // too soon: a code went out a moment ago (a reload, a second press), so the form asks for that one
      else if (a.kind === 'wait') { if (a.wait <= RESEND_GAP_S && step !== 'code') askCode(b, false, a.wait); else { showStep(step === 'done' ? 'email' : step); note(waitLine(a.wait)); if (step === 'code') startTimer(a.wait); } track('signup_error', { kind: 'wait' }); }
      else { if (step === 'done') showStep('email'); note(K.mail); if (step === 'code') stopTimer(); track('signup_error', { kind: 'mail' }); }
    } catch (err) {
      if (inflight !== ac) return;
      // offline is a failed request with navigator.onLine false (a pre-check lies on captive portals): queue and retry on `online`
      if (!navigator.onLine && !again) queueLead(b);
      else { if (step === 'done') showStep('email'); note(C.errSend); if (again) stopTimer(); track('signup_error', { kind: err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'network' }); }
    } finally {
      clearTimeout(slow); clearTimeout(hard); if (inflight === ac) inflight = null;
      setSending(false, C.send);
    }
  };
  /** the code checked */
  let checking = false;
  const check = async () => {
    if (checking || !lastBody) return;
    if (!codeComplete(code.value)) { code.setAttribute('aria-invalid', 'true'); note(K.errCode); if (document.activeElement !== code) code.focus(); else announce(K.errCode); return; }
    const b = lastBody;
    checking = true; confirm.setAttribute('aria-disabled', 'true'); confirm.textContent = C.checking; note('');
    const ac = new AbortController();
    inflight = ac;
    const hard = setTimeout(() => ac.abort(), HARD_MS);
    try {
      const a = await readCheck(await checkCode(b.email, 'signup', code.value, ac.signal));
      if (inflight !== ac) return;
      if (a.kind === 'ok') { lastBody = null; closeForm(fill(C.done, { email: b.email })); track('signup_success', { dup: 0 }); return; }
      code.setAttribute('aria-invalid', 'true');
      if (a.kind === 'wrong') { note(wrongLine(a.left)); code.select(); track('signup_error', { kind: 'code' }); }
      else if (a.kind === 'format') note(K.errCode);
      else if (a.kind === 'expired') { note(K.expired); code.value = ''; stopTimer(); track('signup_error', { kind: 'expired' }); }
      else throw new Error(String(a.status));
    } catch (err) {
      if (inflight !== ac) return;
      note(C.errSend); track('signup_error', { kind: err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'network' });
    } finally {
      clearTimeout(hard); if (inflight === ac) inflight = null;
      checking = false; confirm.setAttribute('aria-disabled', 'false'); confirm.textContent = C.confirm;
    }
  };
  // typed or pasted: the digits alone, and a whole code checks itself (a phone's one-time-code fill included)
  code.addEventListener('input', () => {
    const v = cleanCode(code.value);
    if (v !== code.value) code.value = v;
    if (code.getAttribute('aria-invalid') === 'true') { code.setAttribute('aria-invalid', 'false'); }
    if (codeComplete(v)) void check();
  });
  resend.addEventListener('click', () => { if (resend.getAttribute('aria-disabled') !== 'true' && !checking && lastBody) void submit(lastBody, true); });
  other.addEventListener('click', openForm);

  addEventListener('online', () => { const q = queued; if (q && !sending) { queued = null; void submit(q); } });
  try {
    const saved = sessionStorage.getItem(SIGNUP_KEYS.queue);
    if (saved) {
      const q = JSON.parse(saved) as Record<string, string>;
      email.value = q.email ?? ''; name.value = q.name ?? ''; consent.checked = true;   // the visitor ticked it when it was queued
      if (navigator.onLine) void submit(q); else queueLead(q);
    }
  } catch { /* a bad entry is dropped */ }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (step === 'code') { void check(); return; }
    if (sending) return;
    if (!validName()) { if (document.activeElement === name) announce(K.errName); else name.focus(); return; }
    if (!validEmail()) { if (document.activeElement === email) announce(C.errEmail); else email.focus(); return; }
    if (!validConsent()) { consent.focus(); announce(C.errConsent); return; }
    track('signup_submitted', { follows: ctx.follows().length });
    void submit(payload(email.value.trim()));
  });
  notYou.addEventListener('click', () => { unqueue(); openForm(); });
}
