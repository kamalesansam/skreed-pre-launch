// Section 5, the sign-up (docs/specs/section-5.md 3 and 5): every string by id, the four jars with their platforms,
// addresses, worth and families, the lead endpoint, the storage keys and the fill's length. Plain data, read by
// Signup.astro at build and by the DOM script (scripts/signup/signup.ts) and the island's jar chunk
// (hero/section5/jars.ts) at runtime; the unit tests import it under Node. No import of the shade table here: the
// beads' hexes are joined at build (config/signup-colours.ts) and ride the markup, so neither client chunk carries it.

/**
 * The copy (section-5.md 3), in sentence case: the decode prints it in capitals, as the quiz and section 4 do, and the
 * accessible names keep the sentence case through the decode's visually hidden copy. The patterns take fill(). No
 * discount, percent or price word anywhere: Sam's picture's "save up to 20% off", "5% OFF", "SAVE MY DISCOUNTS" and
 * "keep your savings" stand in section 11 of the spec, pending him (the brand rule, CLAUDE.md rule 37, the quiz's precedent).
 */
export const SIGNUP_COPY = Object.freeze({
  aria: 'Section 5: the sign-up',
  h: 'You’ve made it this far.',
  sub: 'One thing left. Follow us to collect colours. Every follow fills your jar, and a full jar means first dibs when we launch.',
  jars: 'Every follow fills the jar',
  jarsAria: 'Your jar and the three that fill it',
  follow: 'Follow on {platform}',
  subscribe: 'Subscribe on {platform}',
  newTab: 'Opens in a new tab',
  notYet: 'Not yet',
  collected: 'Collected',
  yours: 'Your jar',
  yoursEmpty: 'Nothing collected yet',
  yoursSome: '{n} of {N} collected',
  yoursFull: 'Full',
  live: '{platform} collected. Your jar: {n} of {N}.',
  liveFull: '{platform} collected. Your jar is full.',
  wrapLive: 'Round to the sign-up.',
  got: 'Got your colours?',
  gotSub: 'Leave your email and your jar is saved. Your first dibs land in your inbox when we launch.',
  email: 'Email',
  consent: 'I’m happy to hear from Skreed by email.',
  send: 'Save my colours',
  sending: 'Sending...',
  still: 'Still trying...',
  fine: 'One email when we launch. Unsubscribe any time.',
  errEmail: 'That doesn’t look like an email address.',
  errConsent: 'Tick the box so we can email you.',
  errSend: 'That didn’t go through. Try again.',
  offline: 'You’re offline. We’ll send it when you’re back.',
  done: 'Done. Your colours are saved to {email}.',
  notYou: 'Not you? Use another email.',
  keep: 'Keep following to keep your colours.',
  creditLead: 'Glass jar model by',
  creditJoin: ', ',
  creditEnd: '.',
  noscriptLead: 'The form needs JavaScript. Follow us on ',
  noscriptLink: 'Instagram',
  noscriptEnd: '.',
});

/** a copy pattern with its {fields} filled */
export const fill = (pattern: string, v: Record<string, string | number>): string => pattern.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));

export type JarId = 'facebook' | 'youtube' | 'instagram' | 'yours';
export interface SignupJar {
  readonly id: JarId;
  /** the platform's name as the words print it; "Your jar" for the fourth */
  readonly platform: string;
  /** the follow word's pattern (follow or subscribe); null for your jar, which is no link */
  readonly verb: 'follow' | 'subscribe' | null;
  /** the address, plain https (never an app scheme, B3); '' for your jar */
  readonly url: string;
  /** the share of your jar one follow pours in (Sam's ladder: a quarter, a quarter, a half); 0 for your jar */
  readonly worth: number;
  /** the families whose 24 shades the beads wear (SHADES by family id), in catalog order */
  readonly families: readonly string[];
  /** the poster tier's still, described */
  readonly alt: string;
}

/**
 * The jars (section-5.md 3, "The jars"), in Sam's picture's order. The addresses are the store's own, read from the
 * footer of https://www.skreed.com/ on 2026-10-26 (facebook.com/skreedofficial, www.youtube.com/@skreedofficial,
 * instagram.com/skreedofficial; Instagram was on record before, docs/00-IDEATION.md and
 * docs/research/04-signup-virality-social.md 5). The families are read from his picture's pellets: blue, red, pink and
 * violet, to the nearest family each. Your jar wears what is poured into it.
 */
export const SIGNUP_JARS: readonly SignupJar[] = Object.freeze([
  { id: 'facebook', platform: 'Facebook', verb: 'follow', url: 'https://facebook.com/skreedofficial', worth: 1, families: ['blissful-blue'], alt: 'A glass jar a quarter full of blue pellets.' },
  { id: 'youtube', platform: 'YouTube', verb: 'subscribe', url: 'https://www.youtube.com/@skreedofficial', worth: 1, families: ['roaring-red'], alt: 'A glass jar a quarter full of red pellets.' },
  { id: 'instagram', platform: 'Instagram', verb: 'follow', url: 'https://www.instagram.com/skreedofficial/', worth: 2, families: ['playful-pink', 'vivid-violet'], alt: 'A glass jar half full of pink and violet pellets.' },
  { id: 'yours', platform: 'Your jar', verb: null, url: '', worth: 0, families: [], alt: 'An empty glass jar.' },
]);
/** the platforms with an address: the follows rendered (a row with no address is left out, section-5.md 3) */
export const SIGNUP_FOLLOWS: readonly SignupJar[] = SIGNUP_JARS.filter((j) => j.url !== '' && j.worth > 0);
/** the number of follows that fill the jar (the {N} of the copy) */
export const FOLLOW_COUNT = SIGNUP_FOLLOWS.length;
/** the worths together: a full jar */
export const WORTH_TOTAL = SIGNUP_FOLLOWS.reduce((a, j) => a + j.worth, 0);
/** a platform jar's level, 0 to 1: its worth as a share of the whole */
export const jarLevel = (j: SignupJar): number => (WORTH_TOTAL ? j.worth / WORTH_TOTAL : 0);
/** a jar by id */
export const jarById = (id: string): SignupJar | undefined => SIGNUP_JARS.find((j) => j.id === id);
/** the follow word for a platform jar */
export const followWord = (j: SignupJar): string => fill(j.verb === 'subscribe' ? SIGNUP_COPY.subscribe : SIGNUP_COPY.follow, { platform: j.platform });
/** your jar's level after these follows, in the order they came */
export const yoursLevel = (ids: readonly string[]): number => Math.min(1, ids.reduce((a, id) => a + (jarById(id)?.worth ?? 0), 0) / (WORTH_TOTAL || 1));
/** your jar's state line */
export function yoursState(n: number): string {
  if (n <= 0) return SIGNUP_COPY.yoursEmpty;
  if (n >= FOLLOW_COUNT) return SIGNUP_COPY.yoursFull;
  return fill(SIGNUP_COPY.yoursSome, { n, N: FOLLOW_COUNT });
}

/** the fill's length, ms: the beads rise over it on power2.out (section-5.md 4); instant under reduced motion */
export const FILL_MS = 900;
/** the storage keys (sessionStorage, the visit only; try and catch everywhere): the follows pressed, in order, and the queued lead */
export const SIGNUP_KEYS = Object.freeze({ follows: 'skreed:signup-follows', queue: 'skreed:signup-queue' });
/** the lead endpoint (the ideation's write route, docs/00-IDEATION.md 7b); the Worker arrives with the lead infrastructure */
export const SIGNUP_LEAD_ENDPOINT = '/api/signup';

/** the jar model's credit, as the licence asks (section-5.md 3; tests/unit/signup.test.ts holds it to src/data/signup-jar-bin.json) */
export const SIGNUP_CREDIT = Object.freeze({ author: 'Pentristo', source: 'https://sketchfab.com/3d-models/glass-jar-c1e74f99560549739bcb17df3103b66d', licence: 'CC BY 4.0', licenceUrl: 'http://creativecommons.org/licenses/by/4.0/' });

// jar.bin as the build emits it (a hashed URL); under Node (the unit tests) there is no glob and the URL is empty
let JAR_FILES: Record<string, string> = {};
try { JAR_FILES = import.meta.glob<string>('../assets/signup/jar.bin', { eager: true, query: '?url', import: 'default' }); } catch { JAR_FILES = {}; }
export const JAR_BIN_URL: string = Object.values(JAR_FILES)[0] ?? '';

/** What the island hands the DOM script every frame it draws the section (scripts/signup/signup.ts). */
export interface SignupFrame {
  /** the section's frame is drawn (in view, or the far side of the fourth wipe) */
  on: boolean;
  /** a seam's cloud cover over it, 0 to 1 */
  cover: number;
  /** the fourth wipe's progress, 0 before it and 1 once section 5 is the whole frame */
  wipe: number;
}

/** The island's side of the bridge (window.__skreedSignup): what the DOM script can ask of the jars. */
export interface SignupIsland {
  /** a follow pressed now: your jar fills by the platform's worth over FILL_MS */
  pour(id: string): void;
  /** the follows as they stand (a mount with saved follows): your jar set at once */
  follows(ids: readonly string[]): void;
}
