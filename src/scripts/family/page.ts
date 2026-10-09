// The family page module (docs/specs/family-page.md 2.3 to 2.7, 4, 5): one selection store and everything that
// follows it (HUD swap, scrubber, swatch grid, finish, reserve link, URL, live region, events), plus the header,
// the switcher's focus handling and swatch grid mode. No GSAP: DOM moves are CSS transitions and the Web Animations
// API (decision 10). The selected markers are drawn by CSS from html[data-shade], so this module only moves the
// attribute and writes text. Budget: 12 KB gzip (spec 6).
import { reducedMQ } from '../motion.ts';
import { FAM_COPY, type CopyShade } from './copy.ts';
import { track } from './track.ts';
import { emit, on, type Finish, type Input } from './bus.ts';
import { SWAP_MS, SWAP_EASE, URL_DEBOUNCE_MS, SETTLE_MS, DRAG_HUD_MS, LIVE_MS } from './timing.ts';

interface PageData { slug: string; name: string; first: number; key: number; has3d: boolean; size3d: string | null; names: string[] }

const H = document.documentElement;
const D = JSON.parse(document.getElementById('fam-data')!.textContent!) as PageData;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const nnn = (i: number) => String(D.first + i).padStart(3, '0');
const shadeAt = (i: number): CopyShade => ({ name: D.names[i], index: i + 1, n: D.first + i, nnn: nnn(i) });
const clamp = (i: number) => Math.max(0, Math.min(23, Math.round(i)));

const hudName = $('hudName')!, hudNum = $('hudNum')!, hudNumSr = $('hudNumSr')!, barName = $('barName')!;
const prevBtn = $<HTMLButtonElement>('prev')!, nextBtn = $<HTMLButtonElement>('next')!, scrub = $('scrub')!;
const reserve = $<HTMLAnchorElement>('reserve')!, live = $('live')!, stateEl = $('state')!, stage = $('stage')!;
const finishBox = $('finish')!, st3d = $('st3d'), wholeCap = $('wholeCap');

// ---- the store ----
const fromAttr = (v: string | undefined) => { const n = Number(v) - D.first; return Number.isInteger(n) && n >= 0 && n < 24 ? n : D.key; };
let sel = fromAttr(H.dataset.shade);
let finish: Finish = H.dataset.finish === 'gloss' ? 'gloss' : 'matte';
let lastInput: Input = 'deeplink';
const reduced = () => reducedMQ.matches;

// ---- the name and number swap (spec 4): old and new lines move together inside the mask, never an empty slot ----
const running = new WeakMap<HTMLElement, Animation[]>();
function swap(box: HTMLElement, text: string, instant: boolean): void {
  running.get(box)?.forEach((a) => a.cancel());         // a new swap finishes the running one at its end state
  running.delete(box);
  while (box.children.length > 1) box.firstElementChild!.remove();
  const old = box.firstElementChild as HTMLElement | null;
  if (old && old.textContent === text) return;
  const nu = document.createElement('span');
  nu.textContent = text;
  if (instant || reduced() || !old || typeof nu.animate !== 'function') { box.replaceChildren(nu); return; }
  box.append(nu);
  const o: KeyframeAnimationOptions = { duration: SWAP_MS, easing: SWAP_EASE };
  const a = [old.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], o),
    nu.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], o)];
  running.set(box, a);
  a[1].onfinish = () => { if (running.get(box) === a) { running.delete(box); old.remove(); } };
}

// ---- writing a selection into the page ----
const grid = () => $('sgrid');
function writeText(i: number, instant: boolean): void {
  const s = shadeAt(i);
  swap(hudName, s.name, instant);
  swap(hudNum, FAM_COPY.number(s), instant);
  barName.replaceChildren(Object.assign(document.createElement('span'), { textContent: s.name }));
  hudNumSr.textContent = FAM_COPY.numberSr(s);
  if (wholeCap) wholeCap.textContent = FAM_COPY.caption(s, D.name);
}
function writeControls(i: number): void {
  const s = shadeAt(i);
  for (const [b, off] of [[prevBtn, i === 0], [nextBtn, i === 23]] as const) { if (off) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); }
  scrub.setAttribute('aria-valuenow', String(i + 1));
  scrub.setAttribute('aria-valuetext', FAM_COPY.scrubberText(s));
  grid()?.querySelectorAll<HTMLElement>('.gsw').forEach((b, k) => {
    b.setAttribute('aria-checked', k === i ? 'true' : 'false');
    b.tabIndex = k === i ? 0 : -1;
  });
  writeReserve();
}
function writeReserve(): void {
  const s = shadeAt(sel);
  reserve.href = FAM_COPY.reserveHref(s, finish);
  reserve.setAttribute('aria-label', FAM_COPY.reserveAria(s.name));
}

// ---- URL (debounced replaceState, so Back leaves the page), settle events and the live region ----
let urlT = 0, settleT = 0, liveT = 0;
function writeUrl(): void {
  clearTimeout(urlT);
  urlT = window.setTimeout(() => {
    const q = new URLSearchParams(location.search);
    q.set('shade', nnn(sel));
    if (finish === 'gloss') q.set('finish', 'gloss'); else q.delete('finish');
    history.replaceState(history.state, '', `${location.pathname}?${q}${location.hash}`);
  }, URL_DEBOUNCE_MS);
}
function settle(): void {
  clearTimeout(settleT);
  settleT = window.setTimeout(() => {
    track('shade_selected', { shade_id: nnn(sel), family: D.slug, input: lastInput, finish });
    if (st3d) st3d.setAttribute('aria-label', FAM_COPY.stage(D.name, D.names[sel]));
  }, SETTLE_MS);
  clearTimeout(liveT);
  liveT = window.setTimeout(() => {
    // a focused slider or radio announces its own new value; the live region speaks for every other input
    const a = document.activeElement;
    if (a === scrub || (a instanceof HTMLElement && a.closest('#sgrid'))) return;
    live.textContent = FAM_COPY.live(shadeAt(sel), D.name);
  }, LIVE_MS);
}

let hudT = 0, hudPending = -1;
/** The one way the selection changes. While a finger drags, the HUD follows at most every 150 ms (spec 2.5). */
function select(i: number, input: Input, opts: { instant?: boolean; dragging?: boolean; fromIsland?: boolean } = {}): void {
  i = clamp(i);
  if (i === sel) return;
  sel = i;
  lastInput = input;
  H.dataset.shade = nnn(i);
  writeControls(i);
  if (opts.dragging) {
    hudPending = i;
    if (!hudT) hudT = window.setTimeout(() => { hudT = 0; if (hudPending >= 0) writeText(hudPending, false); hudPending = -1; }, DRAG_HUD_MS);
  } else {
    clearTimeout(hudT); hudT = 0; hudPending = -1;
    writeText(i, !!opts.instant);
  }
  if (!opts.fromIsland) emit('fam:select', { i, input, instant: !!opts.instant || reduced() });
  writeUrl();
  settle();
}

// ---- first paint: a deep link's text replaces the skeletons; nothing moves ----
writeControls(sel);
if (H.hasAttribute('data-deeplink')) {
  writeText(sel, true);
  H.removeAttribute('data-deeplink');
  settle();
}
if (finish === 'gloss') setFinish('gloss', false);

// ---- Prev and Next ----
prevBtn.addEventListener('click', () => { if (sel > 0) select(sel - 1, 'prev_next'); });
nextBtn.addEventListener('click', () => { if (sel < 23) select(sel + 1, 'prev_next'); });

// ---- the scrubber: one slider; keys, tap and drag ----
const KEYS: Record<string, (i: number) => number> = {
  ArrowLeft: (i) => i - 1, ArrowDown: (i) => i - 1, ArrowRight: (i) => i + 1, ArrowUp: (i) => i + 1,
  Home: () => 0, End: () => 23, PageUp: (i) => i + 6, PageDown: (i) => i - 6,
};
scrub.addEventListener('keydown', (e) => {
  const f = KEYS[e.key];
  if (!f || e.altKey || e.ctrlKey || e.metaKey) return;
  e.preventDefault();
  select(f(sel), 'scrubber');
});
let scrubbing = -1;
const slotAt = (x: number) => { const r = scrub.getBoundingClientRect(); return clamp(Math.floor(((x - r.left) / r.width) * 24 - 0.0001)); };
scrub.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  scrubbing = e.pointerId;
  scrub.setPointerCapture(e.pointerId);
  select(slotAt(e.clientX), 'scrubber');
});
scrub.addEventListener('pointermove', (e) => { if (e.pointerId === scrubbing) select(slotAt(e.clientX), 'scrubber', { dragging: true }); });
const endScrub = (e: PointerEvent) => {
  if (e.pointerId !== scrubbing) return;
  scrubbing = -1;
  if (hudPending >= 0) { clearTimeout(hudT); hudT = 0; writeText(hudPending, false); hudPending = -1; }
};
scrub.addEventListener('pointerup', endScrub);
scrub.addEventListener('pointercancel', endScrub);

// ---- the swatch grid: a radio group with a roving tabindex; arrows move by one, up and down by a row ----
const GRID_KEYS: Record<string, (i: number) => number> = {
  ArrowLeft: (i) => i - 1, ArrowRight: (i) => i + 1, ArrowUp: (i) => i - 6, ArrowDown: (i) => i + 6, Home: () => 0, End: () => 23,
};
document.addEventListener('click', (e) => {
  const b = (e.target as Element).closest?.('.gsw') as HTMLElement | null;
  if (b) select(Number(b.dataset.i), 'grid');
});
document.addEventListener('keydown', (e) => {
  const b = (e.target as Element).closest?.('.gsw') as HTMLElement | null;
  const f = b && GRID_KEYS[e.key];
  if (!b || !f || e.altKey || e.ctrlKey || e.metaKey) return;
  e.preventDefault();
  const to = Math.max(0, Math.min(23, f(Number(b.dataset.i))));
  select(to, 'grid');
  grid()?.querySelectorAll<HTMLElement>('.gsw')[to]?.focus();
});

// ---- finish ----
function setFinish(f: Finish, user: boolean): void {
  finish = f;
  H.dataset.finish = f;
  finishBox.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.finish === f ? 'true' : 'false'));
  writeReserve();
  if (user) { emit('fam:finish', { finish: f }); track('finish_selected', { finish: f, shade_id: nnn(sel), family: D.slug }); writeUrl(); }
}
finishBox.addEventListener('click', (e) => {
  const b = (e.target as Element).closest('button');
  const f = b?.dataset.finish;
  if ((f === 'matte' || f === 'gloss') && f !== finish) setFinish(f, true);
});

// ---- links out: reserve, switcher and family navigation ----
reserve.addEventListener('click', () => track('reserve_click', { shade_id: nnn(sel), family: D.slug, finish }));
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.('a[href^="/shades/"]') as HTMLAnchorElement | null;
  if (!a) return;
  const fam = a.pathname.split('/')[2] ?? '';
  track('family_open', { family: fam, from: a.closest('#family-switcher') ? 'switcher' : 'family_nav' });
});

// ---- header: transparent at the top, the page neutral with a hairline once content scrolls under it ----
const fh = $('fh')!;
const stuck = () => fh.toggleAttribute('data-stuck', scrollY > 0);
addEventListener('scroll', stuck, { passive: true });
stuck();

// ---- the switcher: focus moves to the current family on open and back to "Families" on close ----
const sw = $('family-switcher');
const famBtn = $<HTMLButtonElement>('famBtn')!;
sw?.addEventListener('toggle', (e) => {
  const open = (e as ToggleEvent).newState === 'open';
  if (open) sw.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
  else if (!document.activeElement || document.activeElement === document.body || sw.contains(document.activeElement)) famBtn.focus();
});

// ---- swatch grid mode and the state line (2.7, 5) ----
function showState(lead: string, rest: string, action?: { label: string; run: () => void }): void {
  const p = document.createElement('p');
  const s = document.createElement('strong');
  s.textContent = lead;
  p.append(s);
  if (rest) p.append(' ' + rest);
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ring2 press';
    b.textContent = action.label;
    b.addEventListener('click', action.run);
    p.append(b);
  }
  stateEl.replaceChildren(p);
}
const splitLine = (line: string): [string, string] => { const k = line.indexOf('. '); return k < 0 ? [line, ''] : [line.slice(0, k + 1), line.slice(k + 2)]; };
function toGrid(reason: string): void {
  H.classList.remove('m3d');
  H.classList.add('grid');
  H.dataset.why = reason;
  const g = grid();
  if (g && g.parentElement !== stage) { g.removeAttribute('aria-labelledby'); g.setAttribute('aria-label', FAM_COPY.gridGroup(D.name)); stage.append(g); }
}
const LINES = { failed: FAM_COPY.modelFailed, failedTwice: FAM_COPY.modelFailedTwice, offline: FAM_COPY.offline, saveData: FAM_COPY.saveData, slowConnection: FAM_COPY.slowConnection };
on('fam:grid', ({ reason, message, retry }) => {
  toGrid(reason);
  track('stage_mode', { mode: 'grid', reason });
  if (!message) { stateEl.replaceChildren(); return; }
  const [lead, rest] = splitLine(LINES[message]);
  const label = message === 'failedTwice' ? FAM_COPY.reload : message === 'failed' ? FAM_COPY.tryAgain : '';
  const run = message === 'failedTwice' ? () => location.reload() : retry;
  showState(lead, rest, label && run ? { label, run } : undefined);
});
on('fam:slow', ({ on: show }) => { if (show) showState(FAM_COPY.slow, ''); else stateEl.replaceChildren(); });
on('fam:pick', ({ i, input, dragging }) => select(i, input, { fromIsland: true, dragging }));
on('fam:live', () => {
  stateEl.replaceChildren();
  // back from swatch grid mode ("Show in 3D", "Try again", online again): the grid returns under its heading
  const g = grid(), whole = $('whole');
  if (g && whole && g.parentElement !== whole) { g.removeAttribute('aria-label'); g.setAttribute('aria-labelledby', 'whole-h'); whole.insertBefore(g, wholeCap); }
  track('stage_mode', { mode: '3d', reason: '' });
});

if (H.classList.contains('grid')) {
  const why = H.dataset.why ?? '';
  toGrid(why);
  track('stage_mode', { mode: 'grid', reason: why });
  // data saver and 2G: the 3D is one tap away, never downloaded unasked (spec 5)
  if (D.has3d && (why === 'savedata' || why === 'slow')) {
    const [lead, rest] = splitLine(why === 'savedata' ? FAM_COPY.saveData : FAM_COPY.slowConnection);
    showState(lead, rest, { label: D.size3d ? FAM_COPY.show3d(D.size3d) : FAM_COPY.show3dPlain, run: () => { stateEl.replaceChildren(); emit('fam:want3d', {}); } });
  }
}

// test and staging builds read the store through this hook; production never defines it
if (import.meta.env.PUBLIC_HERO_HOOKS === '1') (window as unknown as { __fam: unknown }).__fam = { get: () => ({ sel, finish, shade: nnn(sel) }), select: (i: number) => select(i, 'key') };
