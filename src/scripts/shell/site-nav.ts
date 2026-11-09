// The section index (src/components/shell/SiteNav.astro; docs/specs/navbar.md) on the redesigned landing page
// (docs/specs/redesign.md D4; Sam, 2026-11-09: "keep the logo and navbar intact"). It does what it did: marks the entry
// on screen with aria-current in the bar and the phone's drawer, takes the logotype's colour, and turns a press on an
// entry into Back to top's jump: the --night veil in over 250 ms, the page in place at the entry's rest (an instant
// scroll, Home to 0, the others with their first part's top at the top of the screen), the veil lifted; no scroll
// through the sections between. What changed is the page under it: ordinary sections in flow, so the entry on screen is
// the one whose parts hold the screen's middle line (nav-map.ts, measured here from the page's own boxes, again after a
// resize, a change of the page's height, or a section's word that its layout moved, the window event
// skreed:rd-layout). The old landing's island, its tiers, its scenes and the quiz gate are not on this page, and nothing
// here waits for them. A keyboard press moves focus into the section it opened. Where the browser has no popover (the
// drawer's CSS falls back to the words in a row), nothing here touches the popover API. The page links (data-page, no
// data-sec; navbar.md D7), About and since the redesign the gift, which opens the jars on their own page (/jars/, spec
// D1), are left to the browser: no veil and no jump, only a plain press tracked as the sections' are (a modifier press
// opens a new tab, untracked, as theirs is). The drawer is closed as the page leaves (pagehide), so a landing page
// restored from the back-forward cache comes back without it; a restore that still finds it open closes it. The gift
// carries the logotype's glitch with a shorter idle wait (GIFT_EVERY), and its bounce is CSS.
import { track } from '../quiz/track.ts';
import { veiled } from './veil.ts';
import { SECTION_GROUPS, SECTION_IDS, hull, restY, sectionAt, type Box, type Boxes, type SectionId, type Tops } from './nav-map.ts';
import { createLogoGlitch } from '../logotype/glitch.ts';
import { GIFT_EVERY, GIFT_TARGET, LOGO_IDLE, LOGO_SPLIT } from '../../config/glitch.ts';

const nav = document.getElementById('siteNav');
const sheet = document.getElementById('site-sections');
const logo = document.getElementById('siteLogo');
const html = document.documentElement;
/** the popover API: without it `:popover-open` is not a selector, and matches() would throw on it */
const POPOVER = 'hidePopover' in HTMLElement.prototype;
const open = () => POPOVER && !!sheet?.matches(':popover-open');
/** :focus-visible, false where the browser cannot parse it */
const focusVisible = (el: Element) => { try { return el.matches(':focus-visible'); } catch { return false; } };
const isSection = (id: string | undefined): id is SectionId => (SECTION_IDS as readonly string[]).includes(id ?? '');

if (nav) {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[data-sec]')];
  // the page links (About, and the gift to the jars' page): a plain navigation, never jumped or marked current; a plain press is tracked as the sections' are
  for (const a of document.querySelectorAll<HTMLAnchorElement>('#siteNav a[data-page]')) a.addEventListener('click', (e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; track('nav', { to: a.dataset.page! }); });

  /** A part's box in document px, null for one with no box (the quiz's host until it opens). The page's one pinned
   *  scene is sticky inside its own section, so its section's box is already its place in the page; should the motion
   *  kit ever pin a part itself, it wraps it in a spacer and fixes the part to the screen while its scene plays, and
   *  the part is then read from that spacer, which holds its place and the scene's scroll room. */
  const boxOf = (id: string): Box | null => {
    const el = document.getElementById(id);
    if (!el) return null;
    const held = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el;
    if (!held.getClientRects().length) return null;
    const r = held.getBoundingClientRect();
    return { top: r.top + scrollY, bottom: r.bottom + scrollY };
  };
  // the page's measures: each entry's box (its parts' hull) and its rest (its first part's top), read again after a
  // resize, a change of the page's height (the faces arriving, a picture's box, the quiz opening) or skreed:rd-layout
  let cached: { boxes: Boxes; tops: Tops } | null = null;
  const page = () => {
    if (cached) return cached;
    const boxes: Partial<Record<SectionId, Box | null>> = {}, tops: Partial<Record<SectionId, number>> = {};
    for (const id of SECTION_IDS) {
      const parts = SECTION_GROUPS[id].map(boxOf);
      boxes[id] = hull(parts);
      tops[id] = parts[0]?.top ?? boxes[id]?.top ?? NaN;
    }
    return (cached = { boxes, tops: { ...tops, max: Math.max(0, (document.scrollingElement ?? html).scrollHeight - innerHeight) } });
  };

  // the gift's glitch: the logotype's, on the gift's symbol, twitching more often (2026-11-03: "glitches more often")
  const gift = document.getElementById('snavGift');
  if (gift) createLogoGlitch(gift, { split: LOGO_SPLIT, idle: LOGO_IDLE, every: GIFT_EVERY, target: { ...GIFT_TARGET, href: '#skreed-gift', prefix: 'gg-' } });

  let current: SectionId | null = null, raf = 0;
  const mark = () => {
    raf = 0;
    const s = sectionAt(scrollY, innerHeight, page().boxes);
    if (s === current) return;
    current = s;
    for (const a of links) { if (s !== null && a.dataset.sec === s) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(mark); };
  const remeasure = () => { cached = null; queue(); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', remeasure);
  addEventListener('skreed:rd-layout', remeasure);
  new ResizeObserver(remeasure).observe(document.body);
  mark();

  // the logotype's colour, Pearl Whisper over the photographs and the night quiz and Urban Slate over the light sections
  // (scripts/redesign/tone.ts says which through glitch.ts setTone), as to-top.ts copied it
  if (logo) {
    const tone = () => { if (logo.dataset.tone) nav.dataset.tone = logo.dataset.tone; else delete nav.dataset.tone; };
    new MutationObserver(tone).observe(logo, { attributes: true, attributeFilter: ['data-tone'] });
    tone();
  }

  // the drawer: a full-screen layer, transparent beside its panel, so a tap on the strip of page left in view lands on the
  // layer and only closes it (a light dismiss would let that tap press whatever is under it: a swatch, a product, the
  // logotype). Pointer, touch and wheel events on it stay out of the page's own listeners on the window; a scroll on the
  // strip, or on the panel when it has nothing to scroll, does not move the page behind the open drawer, while a pinch
  // or Ctrl+wheel stays the browser's zoom. The page's own scroll is never held: this layer is over it only while the
  // drawer is open. It closes when the window widens past its Menu.
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
    // a page link (About, the gift) leaves with the drawer open, since its press is the browser's own navigation: close
    // it as the page goes, so the landing page enters the back-forward cache without it and Back does not bring it back
    // open; a restore that still finds it open (a browser that froze the page before this ran) closes it the same way
    addEventListener('pagehide', () => { if (open()) sheet.hidePopover(); });
    addEventListener('pageshow', (e) => { if (e.persisted && open()) sheet.hidePopover(); });
  }

  const frame = () => new Promise<void>((r) => { requestAnimationFrame(() => r()); });

  /** the entry's rest at once (nav-map.ts restY), measured afresh: Home at 0, the others with their first part's top at the top of the screen */
  const jump = (id: SectionId) => {
    cached = null;
    scrollTo({ top: restY(id, page().tops), behavior: 'instant' });
  };
  /** a candidate that can take focus: in the layout, not inside an inert or hidden part */
  const focusable = (e: HTMLElement) => e.getClientRects().length > 0 && !e.closest('[inert], [hidden]') && getComputedStyle(e).visibility !== 'hidden';
  /**
   * A keyboard press: focus into the section it opened, each candidate tried until one takes focus. Home: the logotype,
   * where Back to top's jump left it. Every entry: its first part's heading, given tabindex -1 here so it can hold the
   * focus (a split headline's aria-label is its whole phrase, so that is what is read out), else that part's first
   * control, else the part itself.
   */
  const focusIn = (id: SectionId) => {
    const part = document.getElementById(SECTION_GROUPS[id][0]);
    const list: (HTMLElement | null)[] = id === 'top' ? [logo] : [];
    if (part) list.push(part.querySelector<HTMLElement>('h1, h2'), ...part.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])'), part);
    for (const el of list) {
      if (!el || !focusable(el)) continue;
      if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
      if (document.activeElement === el) return;
    }
  };

  for (const a of links) {
    a.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // a new tab or window opens the fragment as a link does
      const id = a.dataset.sec;
      if (!isSection(id)) return;   // not one of the index's entries: the link is the browser's
      e.preventDefault();
      const keyboard = focusVisible(a);
      if (open()) sheet!.hidePopover();
      track('nav', { to: id });
      void veiled(async () => {
        jump(id);
        mark();
        if (!keyboard) { (document.activeElement as HTMLElement | null)?.blur(); return; }
        // a frame on, so what the jump set off (a scene's pin taken or let go) has settled before the focus moves
        await frame();
        focusIn(id);
      });
    });
  }
}
