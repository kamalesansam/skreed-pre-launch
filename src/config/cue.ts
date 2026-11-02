// The cue's words (docs/specs/scroll-cue.md; the brief of 2026-11-02: "add some text like "Scroll to see more" wherever one
// has to scroll"): with the chevrons at the top of a page (over them on phones, in the corner on laptops), and alone mid-page once the page has rested, wherever more lies
// below and only scrolling reaches it. The landing's island reads these (scroll/cue-words.ts, scroll/ride.ts); the family
// page keeps its own twin of stillMs (family/timing.ts CUE_STILL_MS, a unit test holds them equal), and the two pages' 8 px
// edges are their own literals (countdown.inline.js, family/page.ts), which the same test pins to `top`.
export const CUE = {
  /** the page's scroll position unchanged this long (the visitor's scroll or the page's own) before the words come back, ms */
  stillMs: 1500,
  /** at or under this scroll position the words stand with the chevrons, which hide past it, px */
  top: 8,
} as const;
