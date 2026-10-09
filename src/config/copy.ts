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
    noscriptDate: '1 November 2026',
    noscriptDatetime: '2026-11-01T00:00+05:30',
  },
  cue: { label: 'Scroll' },
  logo: { aria: 'Skreed, home' },
  page: {
    h1: 'Skreed. Tech essentials that go beyond basic.',
    title: 'Skreed. Tech essentials that go beyond basic.',
    description: 'Skreed launches in India on 1 November 2026. 240 shades. One of them is yours.',
  },
  poster: { alt: 'The Skreed mark in ten black blocks on a moonlit snowfield.' },
} as const;
