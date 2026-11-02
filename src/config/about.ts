// The About page's words (docs/specs/about.md section 3): the brief's paste of 2026-11-02, verbatim, with only the
// changes its decision D4 lists. The launch line reads November 15, the date the site counts down to (LAUNCH_ISO,
// src/config/site.ts), with a no-break space; the straight apostrophes are U+2019, as the site's copy is; the paste's
// WhatsApp bold is the h1, and its WhatsApp italic an <em> set upright at 600 (never italic, rule 18). "over 240 shades",
// "recognised" and the three award names are the brief's own words. The page sets these in Inter (exception
// E-About-font, src/styles/about.css); this file holds words only. tests/unit/about.test.ts holds every string.
export const ABOUT_COPY = {
  h1: 'About Skreed',
  p1: 'Skreed started with a simple idea: colour is personal.',
  p2: 'We’ve always believed that the things we carry every day should feel a little more like us. That’s why we went looking beyond the usual handful of colours and built a world of our own: a spectrum of over 240 shades across an ecosystem of premium tech accessories, each designed to feel every bit as unique as the person using them.',
  p3: 'And while colour is at the heart of what we do, thoughtful design is what brings it all together. Backed by a team recognised with multiple CES Innovation Awards, Red Dot Design Awards, and New York Design Awards, Skreed brings a premium, considered approach to personal tech.',
  p4: 'And now we’re bringing it all to India.',
  /** the words before the <em>, the <em>'s words, and the full stop after it */
  p5: ['Welcome to Skreed. We hope you find something here that makes you stop scrolling for a second and think, ', 'that’s the one', '.'],
  sign: 'Your perfect shade.',
  /** "Launching ", the date in a <time> whose datetime is LAUNCH_ISO (a no-break space keeps "November 15" whole), the full stop */
  launch: ['Launching ', 'November 15', '.'],
  /** the <title>, og:title and the JSON-LD page name (proposed, docs/specs/about.md section 14) */
  title: 'About Skreed',
  /** the meta and og:description: three of the copy's own sentences, in order (proposed, section 14) */
  description: 'Skreed started with a simple idea: colour is personal. And now we’re bringing it all to India. Launching November 15.',
} as const;

/** the title's lines, one a line in the tall uppercase title of the owner's reference (E-About-look); joined by a space they are h1 */
export const ABOUT_H1_LINES = ['About', 'Skreed'] as const;
/** the words of the first paragraph ringed in Ember Luxe, as the reference circles them (E-About-look) */
export const ABOUT_RING = 'colour is personal.';
