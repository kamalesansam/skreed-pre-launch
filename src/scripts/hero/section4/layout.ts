// The section's cached layout (docs/specs/section-4.md 5 "the cached layout"; section-4-flux.md 5 "Inputs"): its
// document top and height, read once and re-read when something above or inside it moves, so a frame reads only
// scrollY and never forces layout under the quiz. A reading taken under the intro's layout is provisional: while html
// carries the intro class the page is locked and the hero's track stands collapsed, and the director chunk can arrive
// then (at 390 x 844 the quiz's section sits inside the viewport in that layout, so hero.ts's observer loads the hall
// during the intro); #room's top read then is some 13,800 px short of its place once the intro ends, and every snap and
// the hall's wipe would land there (the build record's D1). So the layout is re-read when html's class changes (a
// MutationObserver, as the inline cue watches the loader and the intro), when the document's height changes (a
// ResizeObserver on documentElement: the hero's track expanding moves the section), when the section or the quiz
// changes size, and on resize; and get() re-reads on its own when the last reading was under the intro and the intro
// has since ended, so no frame ever drives off an intro reading. Pure of three and of any other module, so the unit
// test (tests/unit/room-layout.test.ts) runs it under node with fake observers.

export interface Layout {
  /** the section's document top, px */
  top: number;
  /** its height, px (at least 1) */
  height: number;
  /** the reading was taken while html carried the intro class */
  intro: boolean;
}

export interface LayoutWatchOptions {
  /** the html element: its class list carries intro while the intro's layout is on */
  html: { classList: { contains(name: string): boolean } };
  /** reads the section's rect now (its document top and height); null when there is no section */
  read(): { top: number; height: number } | null;
  /** what to watch for size changes: the section, the quiz, the document (its scroll height); nulls are skipped */
  watch: readonly (Element | null | undefined)[];
  /** called after every reading */
  onMeasure?(l: Layout): void;
  /** the window's observers (the fakes under test; null where the window has none) */
  mutation?: (new (cb: () => void) => Pick<MutationObserver, 'observe' | 'disconnect'>) | null;
  resize?: (new (cb: () => void) => Pick<ResizeObserver, 'observe' | 'disconnect'>) | null;
  /** subscribes fn to the window's resize; returns the unsubscribe */
  listen?(fn: () => void): () => void;
}

export interface LayoutWatch {
  /** the last reading, or null before the first */
  readonly layout: Layout | null;
  /** the layout now: read once, and read again when the last reading was under the intro and the intro has ended */
  get(): Layout | null;
  /** a fresh reading */
  measure(): Layout | null;
  dispose(): void;
}

const INTRO = 'intro';

export function watchLayout(o: LayoutWatchOptions): LayoutWatch {
  let layout: Layout | null = null, disposed = false;
  const intro = () => o.html.classList.contains(INTRO);
  const measure = (): Layout | null => {
    if (disposed) return layout;
    const r = o.read();
    if (!r) return layout;
    layout = { top: r.top, height: Math.max(1, r.height), intro: intro() };
    o.onMeasure?.(layout);
    return layout;
  };
  const MO = o.mutation === undefined ? (typeof MutationObserver === 'function' ? MutationObserver : null) : o.mutation;
  const RO = o.resize === undefined ? (typeof ResizeObserver === 'function' ? ResizeObserver : null) : o.resize;
  // html's class: the intro ending (and the tier classes arriving) change the layout above the section
  const mo = MO ? new MO(() => { measure(); }) : null;
  mo?.observe(o.html as unknown as Node, { attributes: true, attributeFilter: ['class'] });
  const ro = RO ? new RO(() => { measure(); }) : null;
  if (ro) for (const el of o.watch) if (el) ro.observe(el);
  const off = o.listen ? o.listen(() => { measure(); }) : (typeof addEventListener === 'function' ? (() => { const fn = () => { measure(); }; addEventListener('resize', fn); return () => removeEventListener('resize', fn); })() : () => {});
  return {
    get layout() { return layout; },
    get() { return !layout || (layout.intro && !intro()) ? measure() : layout; },
    measure,
    dispose() { disposed = true; mo?.disconnect(); ro?.disconnect(); off(); },
  };
}
