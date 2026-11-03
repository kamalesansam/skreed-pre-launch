// The section index (src/components/shell/SiteNav.astro; docs/specs/navbar.md). Marks the section on screen with
// aria-current in the bar and the phone's drawer, takes the logotype's colour as Back to top did here, and turns a press
// on a section into Back to top's jump: the --night veil in over 250 ms, the page in place at the section's rest position
// (the hero's own jump when the island runs, its followers snapped and section 4 reset; a plain instant scroll on the
// poster tier), the veil lifted; no scroll through the sections between. Home is the jump Back to top made here.
// Products is always listed (2026-11-02: "its okay add products as well no problem"): pressed while the quiz gate holds
// section 4, it opens it as Skip quiz does (gate.ts unlock); on the 3D path it waits under the veil for the scenes, at
// most 1.5 s, as Skip quiz's ride does, so the landing shows scene 1 drawn (the hall until 2026-11-02). Reduced motion:
// the cut with no veil. A
// keyboard press moves focus into the section it opened. Where the browser has no popover (the drawer's CSS falls back
// to the words in a row), nothing here touches the popover API. About, the page the index links to (data-page, no
// data-sec; navbar.md D7), is left to the browser: no veil and no jump, only a plain press tracked as the sections' are
// (a modifier press opens a new tab, untracked, as theirs is). The drawer is closed as the page leaves (pagehide), so a
// landing page restored from the back-forward cache comes back without it; a restore that still finds it open closes it.
// The gift at the end (2026-11-03) jumps to section 5, the sign-up, opening it as Products opens section 4 while the quiz
// gate holds both; it carries the logotype's glitch with a shorter idle wait (GIFT_EVERY), and its bounce is CSS.
import { track } from '../quiz/track.ts';
import { veiled } from './veil.ts';
import { restY, sectionAt, type JumpId, type PageMap } from './nav-map.ts';
import { createLogoGlitch } from '../logotype/glitch.ts';
import { GIFT_EVERY, GIFT_TARGET, LOGO_IDLE, LOGO_SPLIT } from '../../config/glitch.ts';

const nav = document.getElementById('siteNav');
const sheet = document.getElementById('site-sections');
const logo = document.getElementById('siteLogo');
const html = document.documentElement;
/** on the 3D path a press on Products waits for the scenes at most this long (gate.ts SCENES_WAIT_MS) */
const SCENES_WAIT_MS = 1500;
/** the popover API: without it `:popover-open` is not a selector, and matches() would throw on it */
const POPOVER = 'hidePopover' in HTMLElement.prototype;
const open = () => POPOVER && !!sheet?.matches(':popover-open');
/** :focus-visible, false where the browser cannot parse it */
const focusVisible = (el: Element) => { try { return el.matches(':focus-visible'); } catch { return false; } };

if (nav) {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[data-sec]')];
  // the page links (About): a plain navigation, never jumped or marked current; a plain press is tracked as the sections' are
  for (const a of document.querySelectorAll<HTMLAnchorElement>('#siteNav a[data-page]')) a.addEventListener('click', (e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; track('nav', { to: a.dataset.page! }); });
  const room = document.getElementById('room');
  /** an element's document top, NaN for one with no box (section#room hidden behind the quiz gate), as hero.ts reads it */
  const docTop = (el: HTMLElement | null) => (el && el.getClientRects().length ? el.getBoundingClientRect().top + scrollY : NaN);
  const island = () => html.classList.contains('hero3d') && !html.classList.contains('poster');
  // the page's measures, read again after a resize or a change of the page's height (the gate opening, a poster's collapse)
  let cached: PageMap | null = null;
  const map = (): PageMap => {
    if (cached) return cached;
    const fam = document.getElementById('families');
    return (cached = {
      island: island(), roomStill: room?.dataset.tier === 'poster', vh: innerHeight,
      families: docTop(fam), quiz: docTop(document.getElementById('find')), room: docTop(room), signup: docTop(document.getElementById('signup')),
      familiesH: fam?.offsetHeight ?? 0, stage: document.getElementById('rmStage')?.offsetHeight || innerHeight,
      max: Math.max(0, (document.scrollingElement ?? html).scrollHeight - innerHeight),
    });
  };

  // the gift's glitch: the logotype's, on the gift's symbol, twitching more often (2026-11-03: "glitches more often")
  const gift = document.getElementById('snavGift');
  if (gift) createLogoGlitch(gift, { split: LOGO_SPLIT, idle: LOGO_IDLE, every: GIFT_EVERY, target: { ...GIFT_TARGET, href: '#skreed-gift', prefix: 'gg-' } });

  let current: JumpId | null = null, raf = 0;
  const mark = () => {
    raf = 0;
    const s = sectionAt(scrollY, map());
    if (s === current) return;
    current = s;
    for (const a of links) { if (a.dataset.sec === s) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(mark); };
  const remeasure = () => { cached = null; queue(); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', remeasure);
  new ResizeObserver(remeasure).observe(document.body);
  new MutationObserver(remeasure).observe(html, { attributes: true, attributeFilter: ['class'] });
  mark();

  // the logotype's colour, which turns Urban Slate over the light fog and a seam's cloud (glitch.ts setTone), as to-top.ts copies it
  if (logo) {
    const tone = () => { if (logo.dataset.tone) nav.dataset.tone = logo.dataset.tone; else delete nav.dataset.tone; };
    new MutationObserver(tone).observe(logo, { attributes: true, attributeFilter: ['data-tone'] });
    tone();
  }

  // the drawer: a full-screen layer, transparent beside its panel, so a tap on the strip of page left in view lands on the
  // layer and only closes it (a light dismiss would let that tap press whatever is under it: an answer, Begin, the
  // logotype). Pointer, touch and wheel events on it stay out of the page's own listeners on the window (the gems' hover
  // and frost, the hero's glow, section 4's product turn and its gesture capture); a scroll on the strip, or on the panel
  // when it has nothing to scroll, does not move the page behind, while a pinch or Ctrl+wheel stays the browser's zoom.
  // It closes when the window widens past its Menu.
  if (POPOVER && sheet) {
    const panel = sheet.querySelector<HTMLElement>('.snav-in');
    sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.hidePopover(); });
    const stop = (e: Event) => { e.stopPropagation(); };
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerover', 'pointerout', 'touchstart', 'touchend', 'touchcancel']) sheet.addEventListener(type, stop, { passive: true });
    const hold = (e: Event) => {
      e.stopPropagation();
      if ((e as WheelEvent).ctrlKey || ((e as TouchEvent).touches?.length ?? 1) > 1) return;
      const scrolls = !!panel && panel.scrollHeight > panel.clientHeight + 1 && panel.contains(e.target as Node);
      if (!scrolls && e.cancelable) e.preventDefault();
    };
    for (const type of ['wheel', 'touchmove']) sheet.addEventListener(type, hold, { passive: false });
    matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches && open()) sheet.hidePopover(); });
    // a page link (About) leaves with the drawer open, since its press is the browser's own navigation: close it as the
    // page goes, so the landing page enters the back-forward cache without it and Back does not bring it back open; a
    // restore that still finds it open (a browser that froze the page before this ran) closes it the same way
    addEventListener('pagehide', () => { if (open()) sheet.hidePopover(); });
    addEventListener('pageshow', (e) => { if (e.persisted && open()) sheet.hidePopover(); });
  }

  /**
   * Section 4 opened by Products while the quiz gate holds it, as gate.ts's unlock() opens it for Skip quiz: hidden and
   * data-locked go, data-open says "nav", the visit's flag is written (its key from config/quiz.ts, through the bar's
   * data-gate-key, so the quiz's config stays in its own chunk), room_unlock is tracked and the hero hears
   * skreed:quiz-unlock (it loads the scenes). True when this call opened it. Keep in step with gate.ts unlock().
   */
  const unlock = (): boolean => {
    if (!room?.hasAttribute('data-locked')) return false;
    room.removeAttribute('hidden'); room.removeAttribute('data-locked'); room.dataset.open = 'nav';
    // section 5 (section#signup), locked with the room since it follows it in the page, opens in the same press, as gate.ts unlock() opens it (2026-11-03)
    const signup = document.getElementById('signup');
    if (signup) { signup.removeAttribute('hidden'); signup.removeAttribute('data-locked'); signup.dataset.open = 'nav'; }
    const key = nav.dataset.gateKey;
    if (key) { try { sessionStorage.setItem(key, '1'); } catch { /* no storage: the attributes, once removed, stay removed for the page's life */ } }
    track('room_unlock', { by: 'nav' });
    dispatchEvent(new CustomEvent('skreed:quiz-unlock', { detail: { by: 'nav' } }));
    return true;
  };
  const frame = () => new Promise<void>((r) => { requestAnimationFrame(() => r()); });
  const wait = (ms: number) => new Promise<void>((r) => { setTimeout(r, ms); });
  /** Skip quiz's ride over (data-ride goes when it lands or is ended; its wait for the scenes included, at most 2.7 s) */
  const rideOver = () => new Promise<void>((r) => { const tick = () => (room?.hasAttribute('data-ride') ? requestAnimationFrame(tick) : r()); tick(); });

  /** the section at once: section 1 by the hero's own jump (Back to top's), the rest by the island's jump to y, or a plain instant scroll */
  const jump = (id: JumpId) => {
    cached = null;
    if (id === 'top' && window.__skreedTop) { window.__skreedTop(); return; }
    const y = restY(id, map());
    if (island() && window.__skreedJump) window.__skreedJump(y); else scrollTo({ top: y, behavior: 'instant' });
  };
  /** a candidate that can take focus: in the layout, not inside an inert or hidden part (the quiz keeps a hidden card's box, visibility hidden and inert) */
  const focusable = (e: HTMLElement) => e.getClientRects().length > 0 && !e.closest('[inert], [hidden]') && getComputedStyle(e).visibility !== 'hidden';
  /**
   * A keyboard press: focus into the section, each candidate tried until one takes focus. The logotype; the first family
   * link; in the quiz the live question, read out first as deck.ts reads it when it puts a question up (the card's name and
   * its question through #qzLive), else the result's shade name (deck.ts's own target for the result, at its top), else
   * the first control on screen (Begin on the intro); section 4's pad on the 3D path (the arrival at scene 1 moves that
   * focus on to scene 1's name, walk.ts), or the first scene's name on the poster tier.
   */
  const focusIn = (id: JumpId) => {
    let list: (HTMLElement | null)[];
    if (id === 'top') list = [logo];
    else if (id === 'signup') list = [...document.querySelectorAll<HTMLElement>('#signup :is(a[href], input, button:not([disabled]))')];
    else if (id === 'families') list = [document.querySelector<HTMLElement>('#families a')];
    else if (id === 'quiz') list = [document.querySelector<HTMLElement>('#find .qz-card.is-top'), ...document.querySelectorAll<HTMLElement>('#find .qz-shade'), ...document.querySelectorAll<HTMLElement>('#find :is(a[href], button:not([disabled]))')];
    else { const m = map(); list = [m.island && !m.roomStill ? document.getElementById('rmPad') : null, document.querySelector<HTMLElement>('#rmScenes .rm-scene-name')]; }
    for (const el of list) {
      if (!el || !focusable(el)) continue;
      if (el.classList.contains('qz-card')) {
        const live = document.getElementById('qzLive'), q = el.querySelector('.qz-q')?.textContent?.trim();
        if (live && q) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = `${el.getAttribute('aria-label') ?? ''}: ${q}`; }); }
      }
      el.focus({ preventScroll: true });
      if (document.activeElement === el) return;
    }
  };

  for (const a of links) {
    a.addEventListener('click', async (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // a new tab or window opens the fragment as a link does
      const id = a.dataset.sec as JumpId;
      e.preventDefault();
      const keyboard = focusVisible(a);
      if (open()) sheet!.hidePopover();
      // Skip quiz's ride is taking the page to section 4: the press runs once the ride has landed or been ended (a touch
      // on the index ends it), so it is neither lost nor undone by the ride's next frame
      if (room?.hasAttribute('data-ride')) await rideOver();
      track('nav', { to: id });
      void veiled(async () => {
        // Products: section 4 opened if the gate holds it; on the 3D path the scenes load from the unlock (or from this
        // press where they have not started) and the page waits for them under the veil, so the landing shows scene 1
        // drawn and its reveal is not played again after the lift; then a frame for the shown section's layout
        // The gift (section 5) waits the same way: section 4's director measures its section once the scenes load, and
        // a jump to the page's end before that left the hero reading the page as at its top (the countdown over section 5)
        if (id === 'room' || id === 'signup') {
          const opened = unlock(), scenes = window.__skreedScenes;
          if (island() && scenes && !scenes.ready) {
            a.setAttribute('aria-busy', 'true');
            await Promise.race([scenes.load(), wait(SCENES_WAIT_MS)]);
            a.removeAttribute('aria-busy');
          }
          if (opened) await frame();
        }
        jump(id);
        mark();
        if (!keyboard) { (document.activeElement as HTMLElement | null)?.blur(); return; }
        // focus two frames on: the jump reset section 4 for its next lap, and the island's next frame carries that to
        // walk.ts, whose new lap blurs any focus inside section#room (newLap), so the pad could not hold it before then
        await frame(); await frame();
        focusIn(id);
      });
    });
  }
}
