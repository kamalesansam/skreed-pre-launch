// The family page module (docs/specs/family-page.md 2.3 to 2.7, 4, 5, 20, 21): one selection store and everything that
// follows it (the bar's swatch and name, the scrubber, the swatch grid, the finish, the URL, the live region, events),
// the switcher's focus handling, swatch grid mode, the seven-screen scroll map (the HUD's exit, the tint, the beats'
// text and nav, the argument screen with its letters and smoke, and its way out, "Back to main page", section 22), the
// skeleton at runtime, the loader's lift (the wordmark's glitch, E-F4). No GSAP: DOM moves are CSS transitions and the
// Web Animations API (decision 10). The
// selected markers are drawn by CSS from html[data-shade], so this module only moves the attribute and writes text.
import { reducedMQ } from '../motion.ts';
import { FAM_COPY, splitLine, type CopyShade } from './copy.ts';
import { track } from './track.ts';
import { emit, on, type Finish, type Input } from './bus.ts';
import { SWAP_MS, SHADE_MS, URL_DEBOUNCE_MS, SETTLE_MS, DRAG_HUD_MS, LIVE_MS } from './timing.ts';
import { tintOf } from './tint.ts';
import { createSmoke } from './smoke.ts';
import { createArgument } from './argument.ts';
import { backFade, backTimer } from './back.ts';
import { WIDE_MQ, activeBeat, scrollClasses, skeletonPolys, solve, type Dims } from './three/pose.ts';

interface PageData { slug: string; name: string; first: number; key: number; has3d: boolean; size3d: string | null; names: string[]; dims: Dims }

const H = document.documentElement;
const D = JSON.parse(document.getElementById('fam-data')!.textContent!) as PageData;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const nnn = (i: number) => String(D.first + i).padStart(3, '0');
const shadeAt = (i: number): CopyShade => ({ name: D.names[i], index: i + 1, n: D.first + i, nnn: nnn(i) });
const clamp = (i: number) => Math.max(0, Math.min(23, Math.round(i)));
const hexOf = (i: number) => getComputedStyle(H).getPropertyValue(`--shade-${D.slug}-${String(i + 1).padStart(2, '0')}`).trim();

const hudNumSr = $('hudNumSr')!, barName = $('barName')!;
const prevBtn = $<HTMLButtonElement>('prev')!, nextBtn = $<HTMLButtonElement>('next')!, scrub = $('scrub')!;
const live = $('live')!, stateEl = $('state')!;
const finishBox = $('finish')!, st3d = $('st3d');
const mqWide = matchMedia(WIDE_MQ);

// ---- the store ----
const fromAttr = (v: string | undefined) => { const n = Number(v) - D.first; return Number.isInteger(n) && n >= 0 && n < 24 ? n : D.key; };
let sel = fromAttr(H.dataset.shade);
let finish: Finish = H.dataset.finish === 'gloss' ? 'gloss' : 'matte';
let lastInput: Input = 'deeplink';
const reduced = () => reducedMQ.matches;

// ---- the bar's swatch (spec 4, C3): it takes the new shade at once from html[data-shade]; a copy of the old
// shade on top fades out by opacity. A newer copy goes under the ones still fading, so quick changes blend smoothly ----
const barSw = document.querySelector<HTMLElement>('.bar-sw');
function fadeBar(from: string | undefined, instant: boolean): void {
  if (!barSw) return;
  if (!from || instant || reduced() || typeof barSw.animate !== 'function') { barSw.replaceChildren(); return; }
  const old = document.createElement('i');
  old.dataset.s = from;
  barSw.prepend(old);
  while (barSw.children.length > 6) barSw.lastElementChild!.remove();
  old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SHADE_MS, easing: 'linear', fill: 'forwards' }).onfinish = () => old.remove();
}

// ---- the per-shade background (E-F2) and the smoke's colours ----
const smokeCv = $<HTMLCanvasElement>('smoke');
const smoke = smokeCv ? createSmoke(smokeCv, reduced) : null;
function setTint(i: number): void {
  const t = tintOf(hexOf(i));
  H.style.setProperty('--tint1', t[0]); H.style.setProperty('--tint2', t[1]);
  smoke?.tint(t[0], t[1]);
}

// ---- writing a selection into the page ----
const grids = () => document.querySelectorAll<HTMLElement>('.sgrid');
function writeText(i: number): void {
  const s = shadeAt(i);
  barName.replaceChildren(Object.assign(document.createElement('span'), { textContent: s.name }));
  hudNumSr.textContent = FAM_COPY.numberSr(s);
}
function writeControls(i: number): void {
  const s = shadeAt(i);
  for (const [b, off] of [[prevBtn, i === 0], [nextBtn, i === 23]] as const) { if (off) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); }
  scrub.setAttribute('aria-valuenow', String(i + 1));
  scrub.setAttribute('aria-valuetext', FAM_COPY.scrubberText(s));
  grids().forEach((g) => g.querySelectorAll<HTMLElement>('.gsw').forEach((b, k) => {
    b.setAttribute('aria-checked', k === i ? 'true' : 'false');
    b.tabIndex = k === i ? 0 : -1;
  }));
  setTint(i);
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
    const a = document.activeElement;
    if (a === scrub || (a instanceof HTMLElement && a.closest('.sgrid'))) return;
    live.textContent = FAM_COPY.live(shadeAt(sel), D.name);
  }, LIVE_MS);
}

let hudT = 0, hudPending = -1;
/** The one way the selection changes. While a finger drags, the bar follows at most every 150 ms (spec 2.5). */
function select(i: number, input: Input, opts: { instant?: boolean; dragging?: boolean; fromIsland?: boolean } = {}): void {
  i = clamp(i);
  if (i === sel) return;
  sel = i;
  lastInput = input;
  const from = H.dataset.shade;
  H.dataset.shade = nnn(i);
  fadeBar(from, !!opts.instant);
  writeControls(i);
  if (opts.dragging) {
    hudPending = i;
    if (!hudT) hudT = window.setTimeout(() => { hudT = 0; if (hudPending >= 0) writeText(hudPending); hudPending = -1; }, DRAG_HUD_MS);
  } else {
    clearTimeout(hudT); hudT = 0; hudPending = -1;
    writeText(i);
  }
  if (!opts.fromIsland) emit('fam:select', { i, input, instant: !!opts.instant || reduced() });
  writeUrl();
  settle();
  drawSkel();
}

// ---- first paint: a deep link's text replaces the skeletons; nothing moves ----
writeControls(sel);
if (H.hasAttribute('data-deeplink')) {
  writeText(sel);
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
  if (hudPending >= 0) { clearTimeout(hudT); hudT = 0; writeText(hudPending); hudPending = -1; }
};
scrub.addEventListener('pointerup', endScrub);
scrub.addEventListener('pointercancel', endScrub);
// the whole first screen: left and right arrows move the line (not inside a control)
document.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || scrollY > 8) return;
  const t = e.target as Element | null;
  if (t?.closest?.('#scrub, .sgrid, [popover], input, textarea, select, #finish, button, a')) return;
  e.preventDefault();
  select(sel + (e.key === 'ArrowLeft' ? -1 : 1), 'key');
});

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
  b.closest('.sgrid')?.querySelectorAll<HTMLElement>('.gsw')[to]?.focus();
});

// ---- finish ----
function setFinish(f: Finish, user: boolean): void {
  finish = f;
  H.dataset.finish = f;
  finishBox.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.finish === f ? 'true' : 'false'));
  if (user) { emit('fam:finish', { finish: f }); track('finish_selected', { finish: f, shade_id: nnn(sel), family: D.slug }); writeUrl(); }
}
finishBox.addEventListener('click', (e) => {
  const b = (e.target as Element).closest('button');
  const f = b?.dataset.finish;
  if ((f === 'matte' || f === 'gloss') && f !== finish) setFinish(f, true);
});

// ---- links out: the switcher ----
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.('a[href^="/shades/"]') as HTMLAnchorElement | null;
  if (!a) return;
  track('family_open', { family: a.pathname.split('/')[2] ?? '', from: 'switcher' });
});

// ---- the switcher: focus moves to the current family on open and back to "All families" on close ----
const sw = $('family-switcher');
const famBtn = $<HTMLButtonElement>('famBtn')!;
sw?.addEventListener('toggle', (e) => {
  const open = (e as ToggleEvent).newState === 'open';
  if (open) sw.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
  else if (!document.activeElement || document.activeElement === document.body || sw.contains(document.activeElement)) famBtn.focus();
});

// ---- the skeleton (rule 41): the 24 silhouettes at the carousel pose, drawn in the stage's own pixels; it shows until
// the canvas is live and again while a context is lost ----
const skel = document.getElementById('skel');
let skelKey = '';
function drawSkel(): void {
  if (!skel || !st3d || !H.classList.contains('m3d')) return;
  const W = st3d.clientWidth, Hh = st3d.clientHeight;
  if (!W || !Hh) return;
  const cls = mqWide.matches ? 'wide' : 'phone';
  const key = `${W}x${Hh}${cls}:${sel}`;
  if (key === skelKey) return;
  skelKey = key;
  const fit = solve(W, Hh, cls, D.dims);
  H.style.setProperty('--case-y', `${fit.caseY.toFixed(1)}px`); H.style.setProperty('--case-hw', `${fit.caseHW.toFixed(1)}px`);
  skel.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
  skel.replaceChildren(...skeletonPolys(W, Hh, cls, D.dims, sel).map((pts) => { const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); p.setAttribute('points', pts); return p; }));
}
drawSkel();
if (st3d) new ResizeObserver(drawSkel).observe(st3d);

// ---- the scroll in screens: 0 to 1 the carousel, 1 to 2 the zoom (no text), 2 to 6 the four case types, 6 to 7 the
// argument screen (pose.ts SV). The stage lags it; the DOM switches at the same points ciao's triggers fire ----
const argSvg = $('arg-svg') as unknown as SVGSVGElement | null, argClip = document.getElementById('arg-clip') as unknown as SVGClipPathElement | null, argBlur = $('arg-blur');
const argument = argSvg && argClip && argBlur && smoke ? createArgument(argSvg, argClip, argBlur, smoke, reduced, (e, p) => track(e as 'argument_shown', p)) : null;
const beatEls = document.querySelectorAll<HTMLElement>('.beat'), navBtns = document.querySelectorAll<HTMLButtonElement>('.beatnav button');
let sv = 0;

// ---- the argument screen's way out (section 22, exception E-F5): "Back to main page", a link to /#families, hidden
// until the argument screen has been on for 2.5 s, then faded in by opacity over 400 ms; faded out over 200 ms and hidden
// again when the screen goes off. back.ts holds the rules (the scroll and the clock); this is the element, one timer and
// the Web Animations API, since [hidden] is display: none, which no CSS transition can start from. 3D mode only ----
const backEl = $<HTMLAnchorElement>('famBack');
let backSince: number | null = null, backShown = false, backT = 0, backAnim: Animation | null = null;
/** hidden at once, timer dropped: the argument came back during the exit, or the page went to swatch grid mode */
function backReset(): void {
  clearTimeout(backT); backT = 0;
  backAnim?.cancel(); backAnim = null;
  backShown = false; backSince = null;
  if (backEl) backEl.hidden = true;
}
function backShow(): void {
  backAnim?.cancel(); backAnim = null;
  backShown = true;
  backEl!.hidden = false;   // dropped and animated in the same task: no frame shows it at full opacity first
  const o = backFade('in', reduced());
  if (!o || typeof backEl!.animate !== 'function') return;
  const a = backEl!.animate([{ opacity: 0 }, { opacity: 1 }], o);
  backAnim = a;
  a.onfinish = () => { if (backAnim === a) backAnim = null; };
}
function backHide(): void {
  backAnim?.cancel(); backAnim = null;
  backShown = false;
  const o = backFade('out', reduced());
  if (!o || typeof backEl!.animate !== 'function') { backEl!.hidden = true; return; }
  const a = backEl!.animate([{ opacity: 1 }, { opacity: 0 }], { ...o, fill: 'forwards' });
  backAnim = a;
  a.onfinish = () => { if (backAnim !== a) return; backEl!.hidden = true; a.cancel(); backAnim = null; };   // as to-top.ts lifts its veil
}
/** on every scroll and when the timer fires: the rules of back.ts against the clock */
function backCheck(): void {
  if (!backEl) return;
  clearTimeout(backT); backT = 0;
  const r = backTimer(H.classList.contains('m3d') ? sv : 0, performance.now(), backSince);
  if (r.since === null) {   // the argument is off: the timer is dropped; a shown control leaves
    backSince = null;
    if (backShown) backHide();
    return;
  }
  if (backSince === null && backAnim) backReset();   // back on during the exit: hidden at once, then a new 2.5 s
  backSince = r.since;
  if (r.show) { if (!backShown) backShow(); }
  else backT = window.setTimeout(backCheck, r.dueMs);
}
backEl?.addEventListener('click', () => track('family_back', { from: 'argument' }));   // the browser follows the link (D4)

function onScroll(): void {
  sv = innerHeight > 0 ? scrollY / innerHeight : 0;
  if (scrollY > 8) H.setAttribute('data-scrolled', ''); else H.removeAttribute('data-scrolled');
  const c = scrollClasses(sv);
  H.classList.toggle('hud-off', c.hudOff);
  H.classList.toggle('beats-on', c.beatsOn);
  H.classList.toggle('tint-on', c.tintOn);
  H.classList.toggle('arg-on', c.argOn);
  argument?.show(c.argOn);
  backCheck();
  const active = activeBeat(sv);
  beatEls.forEach((b) => b.classList.toggle('on', b.dataset.beat === active));
  navBtns.forEach((b) => b.setAttribute('aria-current', b.dataset.beat === active ? 'true' : 'false'));
  emit('fam:scroll', { sv });
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();
$('beatnav')?.addEventListener('click', (e) => {
  const b = (e.target as Element).closest('button[data-beat]') as HTMLButtonElement | null;
  if (!b) return;
  document.getElementById(`beat-${b.dataset.beat}`)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
});

// ---- the loader's lift (section 20; E-F4): the wordmark's intro burst when the loader lifts, as on the landing page ----
type Logo = { intro(d: number): void };
const w = window as unknown as { __skreedLogo?: Logo; __fam?: unknown };
if (H.classList.contains('loading')) {
  const mo = new MutationObserver(() => { if (!H.classList.contains('loading')) { mo.disconnect(); w.__skreedLogo?.intro(0.25); } });
  mo.observe(H, { attributes: true, attributeFilter: ['class'] });
}

// ---- swatch grid mode and the state line (2.7, 5). The head script set the mode, and CSS already shows the grid and,
// for data saver and 2G, the static line with "Show in 3D", so nothing here changes the first paint ----
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
function toGrid(reason: string): void {
  H.classList.remove('m3d');
  H.classList.add('grid');
  H.dataset.why = reason;
}
const LINES = { failed: FAM_COPY.modelFailed, failedTwice: FAM_COPY.modelFailedTwice, offline: FAM_COPY.offline, saveData: FAM_COPY.saveData, slowConnection: FAM_COPY.slowConnection };
on('fam:grid', ({ reason, message, retry }) => {
  toGrid(reason);
  backReset();
  track('stage_mode', { mode: 'grid', reason });
  if (!message) { stateEl.replaceChildren(); return; }
  const [lead, rest] = splitLine(LINES[message]);
  const label = message === 'failedTwice' ? FAM_COPY.reload : message === 'failed' ? FAM_COPY.tryAgain : '';
  const run = message === 'failedTwice' ? () => location.reload() : retry;
  showState(lead, rest, label && run ? { label, run } : undefined);
});
on('fam:slow', ({ on: show }) => { if (show) showState(FAM_COPY.slow, ''); else stateEl.replaceChildren(); });
on('fam:pick', ({ i, input, dragging }) => select(i, input, { fromIsland: true, dragging }));
on('fam:turn', ({ side }) => track('front_turn', { side }));
on('fam:live', () => {
  stateEl.replaceChildren();
  st3d?.classList.add('live');
  track('stage_mode', { mode: '3d', reason: '' });
});

// data saver and 2G: the 3D is one tap away, never downloaded unasked (spec 5). The line and its button are in the
// HTML; this only wires the button.
stateEl.querySelectorAll<HTMLButtonElement>('[data-line] button').forEach((b) => b.addEventListener('click', () => { stateEl.replaceChildren(); emit('fam:want3d', {}); }));
if (H.classList.contains('grid')) track('stage_mode', { mode: 'grid', reason: H.dataset.why ?? '' });

// test and staging builds read the store through this hook; production never defines it
if (import.meta.env.PUBLIC_HERO_HOOKS === '1') w.__fam = { get: () => ({ sel, finish, shade: nnn(sel), sv }), select: (i: number) => select(i, 'key'), smoke: () => smoke?.stats(), argument: () => ({ shown: argument?.shown(), laid: argument?.laid() }), back: () => ({ since: backSince, shown: backShown }) };
