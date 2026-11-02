// Every string the hero renders (docs/specs/hero.md section 3), by id. Inline scripts receive the ones they need as JSON.
// Status as in the spec: the h1, title, description and poster alt are proposed and wait for Sam's yes (hero.md 11).
/** The loader's strings. boot.ts imports only these, so the critical boot chunk carries no other copy. */
export const COPY_LD = {
  aria: 'Loading Skreed',
  slow: 'Slow connection',
  still: 'Still loading',
  offline: 'You are offline. The countdown still runs.',
} as const;

export const COPY = {
  ld: COPY_LD,
  cd: {
    eyebrow: 'Launch in',
    units: ['days', 'hours', 'minutes', 'seconds'],
    aria: 'Time until launch',
    /** At zero: "Skreed is live. " followed by the link "skreed.com" to https://skreed.com (D12). */
    liveLead: 'Skreed is live. ',
    liveLink: 'skreed.com',
    /** No JavaScript: "Launching " followed by the date in a <time> element. */
    noscriptLead: 'Launching ',
    noscriptDate: '15 November 2026',
    noscriptDatetime: '2026-11-15T00:00+05:30',
  },
  /** the cue's words: over the chevrons on phones, in the bottom right corner on laptops (docs/specs/scroll-cue.md; the brief of 2026-11-02) */
  cue: { label: 'Scroll to see more' },
  /** section 2's labels (section-2.md 3): igloo's three slots, carrying our facts, uppercase (E-S2-font) */
  s2: { count: '24 SHADES', click: 'CLICK TO EXPLORE', tap: 'TAP TO EXPLORE', aria: 'Colour families' },
  logo: { aria: 'Skreed, home' },
  /** the back-to-top control on every page (Sam, 2026-10-19): back to the landing page's section 1, without a reload */
  toTop: { label: 'Back to top' },
  /** the section index at the top of the landing page (docs/specs/navbar.md 3): its name, the phone's Menu and panel, the four sections in page order (2026-11-02: "instead of countdown name it as home, instead of universe, name it as products") */
  nav: {
    aria: 'Sections',
    menu: 'Menu',
    close: 'Close',
    items: { top: 'Home', families: 'Families', quiz: 'Quiz', room: 'Products' },
  },
  page: {
    h1: 'Skreed. Tech essentials that go beyond basic.',
    title: 'Skreed. Tech essentials that go beyond basic.',
    description: 'Skreed launches in India on 15 November 2026. 240 shades. One of them is yours.',
  },
  poster: { alt: 'The Skreed mark in ten black blocks on a moonlit snowfield.' },
} as const;
