// Section 5, the sign-up (docs/specs/section-5.md 3 and 5; docs/specs/section-5-liquid.md 3): every string by id, the
// three follows with their platforms, addresses, worth, families and the shades their liquid wears, the lead endpoint
// and the storage keys. Plain data, read by Signup.astro at build and by the DOM script (scripts/signup/signup.ts) and
// the island's jar chunk (hero/section5/jars.ts) at runtime; the unit tests import it under Node. No import of the
// shade table here: the liquid's hexes are joined at build (config/signup-colours.ts) and ride the follow links'
// markup, so neither client chunk carries it.

/**
 * The copy (section-5.md 3, section-5-liquid.md 3), in sentence case: the decode prints it in capitals, as the quiz and
 * section 4 do, and the accessible names keep the sentence case through the decode's visually hidden copy. The patterns
 * take fill(). No discount, percent, price or verification word anywhere: Sam's picture's "save up to 20% off", "5% OFF",
 * "SAVE MY DISCOUNTS" and "keep your savings" stand in section 11 of the spec, pending him (the brand rule, CLAUDE.md
 * rule 37, the quiz's precedent); "verifies" in his brief of 2026-10-29 is the honour system (section-5-liquid.md 12).
 */
export const SIGNUP_COPY = Object.freeze({
  aria: 'Section 5: the sign-up',
  h: 'You’ve made it this far.',
  sub: 'One thing left. Follow us to collect colours. Every follow fills your jar, and a full jar means first dibs when we launch.',
  jars: 'Every follow fills the jar',
  followsAria: 'The three follows that fill your jar',
  /** the slot's accessible name at build, before the DOM script describes the jar's state (never printed) */
  jarAria: 'Your jar',
  follow: 'Follow on {platform}',
  subscribe: 'Subscribe on {platform}',
  newTab: 'Opens in a new tab',
  notYet: 'Not yet',
  collected: 'Collected',
  yoursEmpty: 'Nothing collected yet',
  yoursSome: '{n} of {N} collected',
  yoursFull: 'Full',
  live: '{platform} collected. Your jar: {n} of {N}.',
  liveFull: '{platform} collected. Your jar is full.',
  wrapLive: 'Round to the sign-up.',
  /** the jar's description (the slot's aria-label on both tiers), from the follows in press order (the spec's `still` and `stillEmpty`; `still` is the form's "Still trying..." already, so these carry their own ids) */
  jarEmpty: 'An empty glass jar.',
  jarLayers: 'A glass jar {level} of colour, from the bottom: {layers}.',
  levelQuarter: 'a quarter full',
  levelHalf: 'half full',
  levelThree: 'three quarters full',
  levelFull: 'full',
  layerJoin: ', then ',
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

export type JarId = 'facebook' | 'youtube' | 'instagram';
export interface SignupJar {
  readonly id: JarId;
  /** the platform's name as the words print it */
  readonly platform: string;
  /** the follow word's pattern (follow or subscribe) */
  readonly verb: 'follow' | 'subscribe';
  /** the address, plain https (never an app scheme, B3) */
  readonly url: string;
  /** the share of the jar one follow pours in (Sam's ladder: a quarter, a quarter, a half), in quarters */
  readonly worth: number;
  /** the families of its liquid (SHADES by family id), in pouring order: one per band from the bottom */
  readonly families: readonly string[];
  /** the families' site names in the singular, as the jar's description reads them (pinned to the ids by the unit test) */
  readonly familyNames: string;
  /** the liquid's shades, catalog ids one per quarter of worth in pouring order (each of one of the families; the hexes joined at build, config/signup-colours.ts) */
  readonly shades: readonly string[];
}

/**
 * The follows (section-5.md 3, "The jars"; section-5-liquid.md 3), in Sam's picture's order. The addresses are the
 * store's own, read from the
 * footer of https://www.skreed.com/ on 2026-10-26 (facebook.com/skreedofficial, www.youtube.com/@skreedofficial,
 * instagram.com/skreedofficial; Instagram was on record before, docs/00-IDEATION.md and
 * docs/research/04-signup-virality-social.md 5). The families and the shades are read from his picture's pellets: a
 * bright azure, a classic red, and violet under pink for Instagram (so its violet quarter pours first and "from the
 * bottom" stays literally true), to the nearest catalog shade each (section-5-liquid.md 3, argued from the transmitted
 * colours; Cobalt and Classic Violet are the alternatives one id away). The one jar is yours and wears what is poured
 * into it, a band per quarter of worth in press order.
 */
export const SIGNUP_JARS: readonly SignupJar[] = Object.freeze([
  { id: 'facebook', platform: 'Facebook', verb: 'follow', url: 'https://facebook.com/skreedofficial', worth: 1, families: ['blissful-blue'], familyNames: 'Blissful Blue', shades: ['blissful-blue-10'] },
  { id: 'youtube', platform: 'YouTube', verb: 'subscribe', url: 'https://www.youtube.com/@skreedofficial', worth: 1, families: ['roaring-red'], familyNames: 'Roaring Red', shades: ['roaring-red-06'] },
  { id: 'instagram', platform: 'Instagram', verb: 'follow', url: 'https://www.instagram.com/skreedofficial/', worth: 2, families: ['vivid-violet', 'playful-pink'], familyNames: 'Vivid Violet and Playful Pink', shades: ['vivid-violet-07', 'playful-pink-20'] },
]);
/** the platforms with an address: the follows rendered (a row with no address is left out, section-5.md 3) */
export const SIGNUP_FOLLOWS: readonly SignupJar[] = SIGNUP_JARS.filter((j) => j.url !== '' && j.worth > 0);
/** the number of follows that fill the jar (the {N} of the copy) */
export const FOLLOW_COUNT = SIGNUP_FOLLOWS.length;
/** the worths together: a full jar */
export const WORTH_TOTAL = SIGNUP_FOLLOWS.reduce((a, j) => a + j.worth, 0);
/** a follow's share of the jar, 0 to 1: its worth over the whole */
export const jarLevel = (j: SignupJar): number => (WORTH_TOTAL ? j.worth / WORTH_TOTAL : 0);
/** a follow by id */
export const jarById = (id: string): SignupJar | undefined => SIGNUP_JARS.find((j) => j.id === id);
/** the follow word for a platform */
export const followWord = (j: SignupJar): string => fill(j.verb === 'subscribe' ? SIGNUP_COPY.subscribe : SIGNUP_COPY.follow, { platform: j.platform });
/** your jar's level after these follows, in the order they came */
export const yoursLevel = (ids: readonly string[]): number => Math.min(1, ids.reduce((a, id) => a + (jarById(id)?.worth ?? 0), 0) / (WORTH_TOTAL || 1));
/** your jar's count line */
export function yoursState(n: number): string {
  if (n <= 0) return SIGNUP_COPY.yoursEmpty;
  if (n >= FOLLOW_COUNT) return SIGNUP_COPY.yoursFull;
  return fill(SIGNUP_COPY.yoursSome, { n, N: FOLLOW_COUNT });
}

/** the still's key for the follows in press order: '0' when empty, else the platforms' first letters (f, y, i); sixteen keys */
export const stillKey = (order: readonly string[]): string => { const ids = order.filter((id) => jarById(id)); return ids.length ? ids.map((id) => id[0]).join('') : '0'; };
/** the level in words, by quarters */
export function levelWord(level: number): string {
  const q = Math.round(level * 4);
  return q >= 4 ? SIGNUP_COPY.levelFull : q === 3 ? SIGNUP_COPY.levelThree : q === 2 ? SIGNUP_COPY.levelHalf : SIGNUP_COPY.levelQuarter;
}
/** the jar's description for the follows in press order (the slot's aria-label on both tiers): the level and the layers from the bottom */
export function stillAlt(order: readonly string[]): string {
  const ids = order.filter((id) => jarById(id));
  if (!ids.length) return SIGNUP_COPY.jarEmpty;
  return fill(SIGNUP_COPY.jarLayers, { level: levelWord(yoursLevel(ids)), layers: ids.map((id) => jarById(id)!.familyNames).join(SIGNUP_COPY.layerJoin) });
}

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
  /** the platform id while a stream runs (the latest press's in an extended stream), else null: the DOM script's data-pouring */
  pour: string | null;
}

/** one still of the jar: 320 x 400 RGBA, the rows bottom-up (hooks builds) */
export interface SignupStill { width: number; height: number; data: Uint8Array }

/** The island's side of the bridge (window.__skreedSignup): what the DOM script can ask of the jar. */
export interface SignupIsland {
  /** a follow pressed now: the stream pours the platform's worth into the jar (section-5-liquid.md 4) */
  pour(id: string): void;
  /** the follows as they stand (a mount with saved follows): the jar set at once, banded in press order */
  follows(ids: readonly string[]): void;
  /** hooks builds only (folded out of the production chunk): the jar at the bands of an order over --night, the stream's clock, the tilt */
  still?(order: readonly string[], level?: number): Promise<SignupStill | null>;
  scrub?(t: number | null): void;
  tilt?(deg: number): void;
}
