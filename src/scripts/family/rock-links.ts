// Section 2 to the family pages: the integration contract of docs/specs/family-page.md 2.2, as code. Two parts:
//  - installFamilyLinks(nav): the ten links' own behaviour (focus prefetch, the return path, family_open, the scoped
//    view transition). FamilyLinksNav.astro (mounted through FamilyLinks.astro) runs it on every path, so mounting the
//    component is all the poster path needs.
//  - installRockNav, placeLinkBoxes, clearLinkBoxes, isReturnVisit: what the section 2 island calls on the 3D path. The
//    island supplies a pick function (which gem is under a point) and the gems' projected boxes; nothing here touches
//    WebGL. CLAUDE.md (Sam, 2026-10-09): every gem is a link to its family page by click, tap and keyboard.
import keys from '../../data/family-keys.json' with { type: 'json' };
import { track } from './track.ts';

export interface RockLink { readonly slug: string; readonly family: string; readonly shade: string; readonly nnn: string; readonly href: string }

/** The ten links in catalog family order. A gem's shade index (the hero's b.shade, an index into REGION, which is in
 * catalog family order) is the index into this list, so any block colour order keeps its links right. */
export const ROCK_LINKS: readonly RockLink[] = keys.map((k) => {
  const nnn = String(k.n).padStart(3, '0');
  return { slug: k.family, family: k.familyName, shade: k.name, nnn, href: `/shades/${k.family}/?shade=${nnn}` };
});

/** The link for the gem holding REGION[shadeIndex]. */
export function linkForShade(shadeIndex: number): RockLink {
  const l = ROCK_LINKS[shadeIndex];
  if (!l) throw new RangeError(`no family for shade index ${shadeIndex}`);
  return l;
}

/** A pointer that moved this far or less between pointerdown and click is a tap; more is a drag or a scroll. */
export const TAP_SLOP_PX = 10;
/** Hover this long over one gem before its page is prefetched. */
export const PREFETCH_HOVER_MS = 150;

/** True when the landing was reached by Back from a family page (or with #families): skip the loader, keep scroll. */
export function isReturnVisit(): boolean {
  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  return nav?.type === 'back_forward' || location.hash === '#families';
}

const prefetched = new Set<string>();
/** Insert <link rel="prefetch"> for a family page once (the page, never the model). */
export function prefetchFamily(slug: string): void {
  if (prefetched.has(slug)) return;
  prefetched.add(slug);
  const l = document.createElement('link');
  l.rel = 'prefetch';
  l.href = `/shades/${slug}/`;
  document.head.append(l);
}

/** Leave for a family page: the history entry left behind is /#families (the return path), then navigate. */
export function followRock(link: RockLink, from: 'rock' | 'rock_grid'): void {
  track('family_open', { family: link.slug, from });
  history.replaceState(history.state, '', '#families');
  location.assign(link.href);
}

/** Fired on nav#families when one of its links takes keyboard focus; detail.index is the shade index (0 to 9). */
export const FAMILY_FOCUS_EVENT = 'skreed:family-focus';

const plain = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * The links' own behaviour, on every path (FamilyLinksNav.astro runs it once): focus prefetches the family page and tells
 * the section 2 island which gem to bring to rest (FAMILY_FOCUS_EVENT); a plain click leaves /#families behind, logs
 * family_open ('rock_grid' on the poster path, 'rock' on the 3D path) and navigates; modified clicks keep the browser's
 * own behaviour. Also scopes the landing's view transition to /shades/ links.
 */
export function installFamilyLinks(nav: HTMLElement): () => void {
  const offs: (() => void)[] = [installViewTransitionScope()];
  nav.querySelectorAll<HTMLAnchorElement>('a[data-shade-index]').forEach((a) => {
    const idx = Number(a.dataset.shadeIndex);
    const onFocus = () => {
      prefetchFamily(ROCK_LINKS[idx].slug);
      nav.dispatchEvent(new CustomEvent(FAMILY_FOCUS_EVENT, { detail: { index: idx } }));
    };
    const onClick = (e: MouseEvent) => {
      if (!plain(e)) return;
      e.preventDefault();
      followRock(ROCK_LINKS[idx], nav.hasAttribute('data-placed') ? 'rock' : 'rock_grid');
    };
    a.addEventListener('focus', onFocus);
    a.addEventListener('click', onClick);
    offs.push(() => { a.removeEventListener('focus', onFocus); a.removeEventListener('click', onClick); });
  });
  return () => offs.forEach((f) => f());
}

export interface RockNavOptions {
  /** the section 2 canvas; clicks count only when they land on it directly */
  canvas: HTMLElement;
  /** the gem under a client point, as its shade index (0 to 9), or null */
  pick: (clientX: number, clientY: number) => number | null;
  /** the nav#families element rendered by FamilyLinksNav.astro; its links' focus calls onFocusGem */
  nav?: HTMLElement | null;
  /** is section 2 live (its gems on screen and pickable)? clicks outside it do nothing */
  active?: () => boolean;
  /** a link got keyboard focus: bring section 2 to rest and make this gem the focus gem */
  onFocusGem?: (shadeIndex: number) => void;
  /** the cursor over a gem (fine pointers); the island may already do this */
  setCursor?: (pointer: boolean) => void;
}

/**
 * Wires the section 2 canvas (3D path). Returns a function that removes every listener. The click rule (2.2): native
 * click, event.target is the canvas itself, the pointer moved 10 px or less since pointerdown, no time limit. The links
 * themselves are wired by installFamilyLinks (FamilyLinksNav.astro); here their focus only reaches onFocusGem.
 */
export function installRockNav(o: RockNavOptions): () => void {
  let downX = 0, downY = 0, down = false, hoverIdx: number | null = null, hoverT = 0, raf = 0, lastMove: PointerEvent | null = null;
  const active = o.active ?? (() => true);
  const offs: (() => void)[] = [];
  const add = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Window, type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
    el.addEventListener(type, fn as EventListener, opts);
    offs.push(() => el.removeEventListener(type, fn as EventListener, opts));
  };
  add(o.canvas, 'pointerdown', (e) => { down = true; downX = e.clientX; downY = e.clientY; }, { passive: true });
  add(o.canvas, 'click', (e) => {
    const moved = down ? Math.hypot(e.clientX - downX, e.clientY - downY) : 0;
    down = false;
    if (e.target !== o.canvas || moved > TAP_SLOP_PX || !active() || e.defaultPrevented || !plain(e)) return;
    const idx = o.pick(e.clientX, e.clientY);
    if (idx === null) return;
    followRock(linkForShade(idx), 'rock');
  });
  // hover: one pick per animation frame, the cursor, and the prefetch after 150 ms over the same gem
  add(o.canvas, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    lastMove = e;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const m = lastMove!;
      const idx = active() ? o.pick(m.clientX, m.clientY) : null;
      o.setCursor?.(idx !== null);
      if (idx !== hoverIdx) {
        clearTimeout(hoverT);
        hoverIdx = idx;
        if (idx !== null) hoverT = window.setTimeout(() => prefetchFamily(ROCK_LINKS[idx].slug), PREFETCH_HOVER_MS);
      }
    });
  }, { passive: true });
  add(o.canvas, 'pointerleave', () => { clearTimeout(hoverT); hoverIdx = null; o.setCursor?.(false); });
  if (o.nav && o.onFocusGem) {
    const onFocusGem = o.onFocusGem;
    add(o.nav, FAMILY_FOCUS_EVENT as keyof HTMLElementEventMap, (e) => onFocusGem((e as unknown as CustomEvent<{ index: number }>).detail.index));
  }
  return () => { offs.forEach((f) => f()); cancelAnimationFrame(raf); clearTimeout(hoverT); };
}

export interface ScreenBox { x: number; y: number; w: number; h: number }
/**
 * 3D path: place each link's box over its gem's projected bounding box (in CSS px), at least 44 x 44. Call it from the
 * frame that updates the gem labels. boxes[i] belongs to shade index i; null leaves that box where it was (the links
 * are never hidden: they stay in the tab order, and focusing one brings section 2 to rest first). The first call marks
 * the nav data-placed: until then the links keep the visible fallback layout (family-links.css), so a mounted nav
 * that no island places never stacks ten invisible boxes at the top left.
 */
export function placeLinkBoxes(nav: HTMLElement, boxes: readonly (ScreenBox | null)[]): void {
  if (!nav.hasAttribute('data-placed')) nav.setAttribute('data-placed', '');
  nav.querySelectorAll<HTMLAnchorElement>('a[data-shade-index]').forEach((a) => {
    const b = boxes[Number(a.dataset.shadeIndex)];
    if (!b) return;
    const w = Math.max(44, b.w), h = Math.max(44, b.h);
    a.style.setProperty('width', `${w}px`);
    a.style.setProperty('height', `${h}px`);
    a.style.setProperty('transform', `translate3d(${b.x + (b.w - w) / 2}px, ${b.y + (b.h - h) / 2}px, 0)`);
  });
}

/** Back to the fallback layout (the island's dispose, the hero's toPoster): the inline boxes and data-placed go. */
export function clearLinkBoxes(nav: HTMLElement): void {
  nav.removeAttribute('data-placed');
  nav.querySelectorAll<HTMLAnchorElement>('a[data-shade-index]').forEach((a) => { a.style.removeProperty('width'); a.style.removeProperty('height'); a.style.removeProperty('transform'); });
}

/**
 * The landing's view transition scope (2.2, R14): the landing opts in with `@view-transition { navigation: auto; }`
 * and this handler skips the transition for every destination outside /shades/, so privacy and terms navigate plainly.
 */
export function installViewTransitionScope(): () => void {
  const h = (e: Event) => {
    const ev = e as Event & { viewTransition?: { skipTransition(): void } | null; activation?: { entry?: { url?: string } } | null };
    const url = ev.activation?.entry?.url;
    if (ev.viewTransition && (!url || !new URL(url).pathname.startsWith('/shades/'))) ev.viewTransition.skipTransition();
  };
  addEventListener('pageswap', h);
  return () => removeEventListener('pageswap', h);
}
