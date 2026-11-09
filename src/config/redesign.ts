// The redesigned landing page's words and numbers (docs/specs/redesign.md sections 3 and 4; Sam, 2026-11-09, with his
// "Skreed Pre-Launch" design: "checkout the pdf, and build the exact same thing"). Every string is the PDF's, verbatim,
// except where the spec says otherwise: the curly apostrophe throughout, British spelling for the quiz paragraph, no
// dash characters, and the five lines marked proposed, which wait for Sam (spec section 12, item 6).
// Words and numbers only: no imports of section code, so any component or test can read it.

/** a headline segment: its words and, for the three coloured words, the accent it wears */
export interface RdSeg { readonly t: string; readonly accent?: 'sage' | 'blue' | 'lavender' }
/** a headline: the phrase as it is read, the PDF's lines, its size in u, its tracking in em (Inter 500 against the
 * PDF's line widths, scripts measured 2026-11-09: each line within 2% of the PDF's share of the page) and its line pitch */
export interface RdHeadline { readonly say: string; readonly lines: readonly (readonly RdSeg[])[]; readonly size: number; readonly track: number; readonly lh: number }

const line = (...segs: (string | RdSeg)[]): readonly RdSeg[] => segs.map((s) => (typeof s === 'string' ? { t: s } : s));

export const RD_HEADLINES = {
  hero: { say: 'Things are about to look different', lines: [line('THINGS ARE'), line('ABOUT TO LOOK')], size: 110.26, track: -0.0429, lh: 0.81 },
  families: { say: 'Now choose from what’s possible.', lines: [line('NOW CHOOSE'), line('FROM WHAT’S'), line('POSSIBLE.')], size: 105.55, track: -0.0444, lh: 0.806 },
  glimpse: { say: 'This is just a glimpse.', lines: [line('THIS IS JUST'), line('A GLIMPSE.')], size: 130, track: -0.0483, lh: 0.81 },
  products: { say: 'We’re not just a phone case brand.', lines: [line('WE’RE NOT JUST'), line('A ', { t: 'PHONE CASE', accent: 'sage' }), line('BRAND.')], size: 93, track: -0.0455, lh: 0.806 },
  everyone: { say: 'There’s something for everyone', lines: [line('THERE’S ', { t: 'SOMETHING', accent: 'blue' }), line('FOR EVERYONE')], size: 83, track: -0.0395, lh: 0.85 },
  quiz: { say: 'Don’t be overwhelmed.', lines: [line('DON’T BE'), line({ t: 'OVER', accent: 'lavender' }, 'WHELMED.')], size: 92, track: -0.0418, lh: 0.807 },
} as const satisfies Record<string, RdHeadline>;

/** the hero's third line (D19 and D20; Sam, 2026-11-09: "the font should look normal when not glitching, only when it
 * glitches it should have that distorted effect", then "use that same font which was think and different for the word
 * DIFFERENT, which was there earlier, just without the distorted part"). At rest it is Rubik Black; only while a glitch
 * burst runs does the Rubik Glitch drawing of the word stand in its place (components/redesign/Hero.astro). Rubik Glitch
 * is Rubik Black in slices, the same advances letter for letter (scripts/fonts/manifest-redesign.txt), so the two share
 * these numbers, in em and untracked and unkerned: the sum of the advances, the capitals' height, and the D's left and
 * the T's right bearing in the plain face and, torn, reaching past the advances. size is the PDF's, in u; track is the
 * tracking the PDF sets the word at, in em. */
export const RD_GLITCH_WORD = { text: 'DIFFERENT', size: 117.25, advance: 5.87, cap: 0.7, track: -0.03, plain: { lsb: 0.055, rsb: 0.017 }, torn: { lsb: -0.04, rsb: -0.041 } } as const;

export const RD_COPY = {
  hero: { alt: 'A woman in a beige blazer on a call, her phone in an orange Skreed case, a matching AirPods case in her other hand.' },
  seen: {
    first: 'what you’ve seen so far',
    second: 'is about to change',
    /** the three fans, front case first; the words under them are the blobs' */
    fans: [
      { id: 'grey', alt: 'Four phone cases fanned out, from black to pale grey.' },
      { id: 'blue', alt: 'Four phone cases fanned out, from navy to pale blue.' },
      { id: 'brown', alt: 'Four phone cases fanned out, from dark brown to tan.' },
    ],
  },
  families: {
    /** the words over the PDF's three brush blobs, each of which also names its picture (blob-grey, blob-blue, blob-brown:
     * the PDF's own paths, components/redesign/Families.astro) */
    blobs: ['grey', 'blue', 'brown'],
    lead: 'You’re used to choosing from what’s available.',
    aria: 'The ten colour families',
    /** on each swatch: the family's name over the gems' own count line (COPY.s2.count) */
    count: '24 SHADES',
    /** the row, left to right (spec D19, item 4; Sam, 2026-11-09: "look at how the shades are looking here, it looks
     * different on the site, use the same ones"): the family each swatch opens, the catalog shade it stands for and its
     * picture. The first six are the PDF's own, cut from its frame, each standing for the family of the catalog shade
     * nearest its colour; the last four are the same brush in catalog shades of the families the six leave out.
     * components/redesign/Families.astro fails the build unless each of the ten families has exactly one swatch and
     * each shade is its family's */
    swatches: [
      { family: 'frosty-white', shade: 'frosty-white-22', picture: 'swatch-frosty-white' },
      { family: 'playful-pink', shade: 'playful-pink-06', picture: 'swatch-playful-pink' },
      { family: 'stormy-grey', shade: 'stormy-grey-04', picture: 'swatch-stormy-grey' },
      { family: 'basic-brown', shade: 'basic-brown-03', picture: 'swatch-basic-brown' },
      { family: 'blissful-blue', shade: 'blissful-blue-03', picture: 'swatch-blissful-blue' },
      { family: 'vivid-violet', shade: 'vivid-violet-01', picture: 'swatch-vivid-violet' },
      { family: 'mellow-yellow', shade: 'mellow-yellow-04', picture: 'swatch-mellow-yellow' },
      { family: 'blushing-coral', shade: 'blushing-coral-01', picture: 'swatch-blushing-coral' },
      { family: 'go-green', shade: 'go-green-09', picture: 'swatch-go-green' },
      { family: 'roaring-red', shade: 'roaring-red-01', picture: 'swatch-roaring-red' },
    ],
  },
  glimpse: {
    aria: 'Pick a shade',
    /** the picker's five catalog shades in the order of the frame's dots; the line under each, Sage's the PDF's and the
     * other four proposed, waiting for Sam (spec 12, item 6); and the colour of the dot.
     * dot is the PDF's own colour by the owner's word and not the catalog's hex (Sam, 2026-11-09, sending frames of his
     * designer's clip: "it looks different on the site, use the same ones"). The frame's five flat colours are no
     * catalog shades: the nearest ones, which the dots wore until then (Navy #0E305B, Powder #9ADEEE, Teal #05877D, Mint
     * #6BE5B4, Sage #96A880), plainly differ beside the frame, the Teal and the Mint far too saturated and the Sage dull.
     * So an id and its name stay the catalog's, which is what the site calls the shade (never an invented name), and the
     * colour on the dot is the frame's, read off its disc by scripts/redesign/extract-pdf.py (dots_of), which paints the
     * products to stand to it as the frame's Sage does. components/redesign/Glimpse.astro fails the build unless this,
     * the dot's rule in rd-glimpse.css and the picture's own record say the same */
    shades: [
      { id: 'blissful-blue-22', line: 'The sea after dark.', dot: '#023A5D', proposed: true },
      { id: 'blissful-blue-03', line: 'A clear sky at seven.', dot: '#89D6E0', proposed: true },
      { id: 'go-green-19', line: 'Deep water, standing still.', dot: '#619799', proposed: true },
      { id: 'go-green-05', line: 'Mint leaves, just picked.', dot: '#74BCA8', proposed: true },
      { id: 'go-green-09', line: 'Moss on a rainy day.', dot: '#A5CC93', proposed: false },
    ],
    /** the shade the section opens on: the frame's, the last dot */
    start: 'go-green-09',
    alt: 'A Skreed phone case and a matching AirPods case, lying flat, both in {shade}.',
    bandAlt: 'A hand at a jeans pocket holding a phone in a white Skreed case.',
  },
  products: {
    body: [
      'Choose from different case types (Snap/Tough/MagTough/Armor/Ultra) designed for different levels of protection and everyday needs in 240 core shades in matte or gloss finish, and an additional 48 silver metallic shades.',
      'And a whole ecosystem to match: AirPods cases, MagSafe wallets, lanyards, PopSockets, LensSkins and more. Designed to work together.',
      'One place for everything your phone needs.',
    ],
    aria: 'The range',
    /** the PDF's order, left to right. The four catalog lines are ROOM_PRODUCTS' (src/config/room.ts), word for word:
     * tests/unit/redesign.test.ts holds them equal by reading that file, which is never imported here (its eager glob
     * would ship section 4's loops). MagSocket has no description in the catalog or in Sam's document: proposed. */
    items: [
      { id: 'case', label: 'PHONE CASE', picture: 'product-case', tall: true, alt: 'A Skreed phone case in a pale green, seen from the back.',
        text: 'Enhanced dual-layered protection with a tough Polycarbonate exterior and a flexible TPU core. Available in 240 shades. Matte or gloss.' },
      { id: 'airpods', label: 'AIRPODS CASE', picture: 'product-airpods', tall: false, alt: 'A Skreed AirPods case in a pale green with its carabiner ring.',
        text: 'Durable polycarbonate case with a sleek profile and precise cut-outs for charging. Includes a carabiner ring for easy attachment to bags. Available in 240 shades. Matte or gloss.' },
      { id: 'lenskin', label: 'LENSKIN', picture: 'product-lenskin', tall: false, alt: 'A green Lenskin over the camera of a phone in a pale green case.',
        text: 'Sleek metal accent for the latest iPhone’s camera lens area, designed to personalize your look. Available in a range of contrasting solid shades and patterns. Matte, metallic matte or metallic gloss.' },
      { id: 'magsocket', label: 'MAGSOCKET', picture: 'product-magsocket', tall: false, alt: 'A MagSocket phone grip with a pale green top.',
        text: 'A phone grip in a shade to match your case.', proposed: true },
      { id: 'wallet', label: 'MAGSAFE WALLET', picture: 'product-wallet', tall: true, alt: 'A Skreed MagSafe wallet in a pale green.',
        text: 'Sleek and secure MagSafe-compatible phone wallet for convenient card storage without the bulk. Available in 240 shades. Matte, gloss, metallic matte or metallic gloss.' },
    ],
  },
  match: { first: 'MATCH', second: 'ESSENTIALS', say: 'Match essentials', alt: 'A woman at a blue door on a call, her phone in a blue Skreed case, a matching AirPods case in her hand.' },
  everyone: {
    /** the PDF's five tiles: row 1 a narrow and a wide one, row 2 three */
    tiles: [
      { id: 'monochrome', label: 'MONOCHROME', picture: 'tile-monochrome', alt: 'A phone case and an AirPods case in the same pale blue.' },
      { id: 'lifestyle', label: 'LIFESTYLE INSPIRED', picture: 'tile-lifestyle', alt: 'A pink phone case on a desk beside a pink notebook, a white pen and a pink tray.' },
      { id: 'peppy', label: 'PEPPY PATTERNS', picture: 'tile-peppy', alt: 'A phone case printed with flamingos, going into a jeans pocket.' },
      { id: 'pastel', label: 'PASTEL PAIRINGS', picture: 'tile-pastel', alt: 'Three phone cases and three AirPods cases in beige, pink and pale blue on white stone.' },
      { id: 'corporate', label: 'CORPORATE READY', picture: 'tile-corporate', alt: 'A deep red phone case on a dark wooden desk.' },
    ],
  },
  quiz: {
    body: 'Two hundred and forty shades can be a lot to choose from. After analysing thousands of behavioural patterns, we’ve developed a test with 98% accuracy to match your personality to one of Skreed’s 240-shade palette.',
    cta: 'Let’s find it',
    /** where the PDF's lavender pill begins inside the CTA's words: behind "s find it" */
    ctaPlain: 'Let’',
    ctaPill: 's find it',
  },
  proof: {
    aria: 'About Skreed',
    alt: 'A woman in a white blazer on a call, her phone in a pale blue Skreed case, a matching AirPods case in her hand.',
    items: [
      { icon: 'trophy', text: 'From the team behind multiple CES Innovation Awards, New York Product Design Awards, and a Red Dot Design Award' },
      { icon: 'globe', text: 'Already making waves in the United States' },
      { icon: 'palette', text: 'India’s most expansive personal tech shade range yet' },
    ],
  },
  /** the countdown's slide: its name, and the words of the PDF's COMING SOON mark, which stands over the digits since D20 */
  launch: { aria: 'The launch', soon: 'Coming soon' },
  footer: {
    tagline: 'Tech Essentials That Go Beyond Basic.',
    links: [
      { href: '/privacy/', label: 'Privacy' },
      { href: '/terms/', label: 'Terms' },
      { href: '/about/', label: 'About' },
    ],
    place: 'Hyderabad, Telangana',
    aria: 'Skreed',
    social: 'Skreed on {platform}',
    newTab: ' (opens in a new tab)',
  },
} as const;

/** /jars/, the jars on a page of their own (spec D1): its title and description are the page's own words (section 5's
 * "EVERY FOLLOW FILLS THE JAR" and its sub-line) with the launch date of COPY.page */
export const RD_JARS = {
  title: 'Skreed. Every follow fills the jar.',
  description: 'Follow us to collect colours. The more you collect, the more you save. Skreed launches in India on 19 November 2026.',
} as const;

/** the PDF's photographs under their flat black veil: the veil's alpha (1 minus the share of the picture that shows,
 * measured with the PDF's render laid over the source picture and its white text masked: 0.40 of the picture for the
 * hero, the glimpse band and MATCH ESSENTIALS, 0.55 for proof) and where the PDF crops the picture
 * (object-position, per cent) on a wide screen and a phone */
export const RD_BANDS = {
  hero: { picture: 'hero', veil: 0.6, focus: [50, 46], focusPhone: [34, 30] },
  glimpse: { picture: 'glimpse-band', veil: 0.6, focus: [50, 65], focusPhone: [46, 60] },
  match: { picture: 'match', veil: 0.6, focus: [50, 50], focusPhone: [52, 40] },
  proof: { picture: 'proof', veil: 0.45, focus: [50, 50], focusPhone: [58, 30] },
} as const;

/** the section ids, in page order; the section index's targets are among them (spec D4). The last is the jars, the
 * page's sign-up (D18, D19): section 5's own section, under its own id */
export const RD_IDS = ['top', 'seen', 'families', 'glimpse', 'products', 'match', 'everyone', 'quiz', 'proof', 'launch', 'signup'] as const;
export type RdId = (typeof RD_IDS)[number];
