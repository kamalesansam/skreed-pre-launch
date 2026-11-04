// Section 5, the sign-up, as Sam's picture of 2026-11-02 (his words: "just make this exact same page with the same logic,
// same font, same space, same backround, same everything from that picture, just relayout it for phone as well"): every
// string by id, the three follows with their platforms, addresses, worth and colours, the lead endpoint and the storage
// keys. Plain data, read by Signup.astro at build and by the DOM script (scripts/signup/signup.ts) at runtime; the unit
// tests import it under Node. The discount words of his picture ship because he asked for the exact page; the records
// (docs/specs/section-5.md) carry the exception to the brand rule.

/**
 * The copy, verbatim from the picture top to bottom (its capitals as printed, the curly apostrophe U+2019 everywhere, the
 * footer's three full stops). The sub-line is three runs (the middle one bold) and the picture breaks it after "below"
 * and the grey lines after "send" on wide screens (Signup.astro's <br class="su-br">). The rest are never printed in
 * the picture: the accessible names, the jar's description, the live region's words and the form's states.
 */
export const SIGNUP_COPY = Object.freeze({
  aria: 'Section 5: the sign-up',
  /** the headline, two lines */
  h1: 'YOU’VE MADE IT',
  h2: 'THIS FAR.',
  /** the sub-line: the lead, the bold run, the rest of the picture's first line, its second line */
  subLead: 'All that’s left to do is ',
  subBold: 'save up to 20% off your first order.',
  subMid: ' Click each icon below',
  subTail: ' to visit and follow our page. Collect a colour with every follow, and unlock bigger discounts.',
  /** the label over the jars */
  jars: 'EVERY FOLLOW FILLS THE JAR',
  /** the star's worth, two lines */
  starLead: 'UP TO',
  starWorth: '20% OFF',
  /** the form's heading between its hairlines, and the grey lines under it (the break after "send" on wide screens) */
  got: 'GOT YOUR COLOURS?',
  gotLead: 'Drop your email below. We’ll verify your follows and send',
  gotTail: ' your colour codes straight to your inbox when we launch.',
  /** the field's placeholder (and its visually hidden label) and the button */
  email: 'Your email address',
  send: 'SAVE MY DISCOUNTS',
  /** the footer */
  keep: 'Pssst...keep following to keep your savings!',
  // ---- never printed in the picture
  /** a follow column's accessible name ({worth} in sentence case, "5% off") */
  followAria: 'Follow Skreed on {platform}, {worth} (opens in a new tab)',
  subscribeAria: 'Subscribe to Skreed on {platform}, {worth} (opens in a new tab)',
  /** the star column's group name */
  yoursAria: 'Your jar, up to 20% off',
  /** jar 4's description from the follows in press order */
  jarEmpty: 'Your jar, empty.',
  jarLayers: 'Your jar, {level}, from the bottom: {layers}.',
  levelQuarter: 'a quarter full',
  levelHalf: 'half full',
  levelThree: 'three quarters full',
  levelFull: 'full',
  layerJoin: ', then ',
  /** the live region, once a fill plays */
  added: '{colour} added to your jar.',
  addedFull: '{colour} added to your jar. Your jar is full.',
  /** the form's states: the button while sending, the line under the form */
  sending: 'SENDING...',
  still: 'STILL TRYING...',
  errEmail: 'That doesn’t look like an email address.',
  /** the consent tick under the field (DPDP Act; Sam, 2026-11-03: "yeah add that"), the quiz's words */
  consent: 'I’m happy to hear from Skreed by email.',
  errConsent: 'Tick the box so we can email you.',
  errSend: 'That didn’t go through. Try again.',
  offline: 'You’re offline. We’ll send it when you’re back.',
  done: 'Done. Your colours are saved to {email}.',
  notYou: 'Not you? Use another email.',
  /** the email code's button (its lines are LEAD_CODE_COPY's), in the form's capitals */
  confirm: 'CONFIRM',
  checking: 'CHECKING...',
  noscript: 'The form needs JavaScript.',
});

/** a copy pattern with its {fields} filled */
export const fill = (pattern: string, v: Record<string, string | number>): string => pattern.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));

export type JarId = 'facebook' | 'youtube' | 'instagram';
export interface SignupJar {
  readonly id: JarId;
  /** the state's letter (f, y, i): a state is the letters of the follows in press order */
  readonly letter: 'f' | 'y' | 'i';
  /** the platform's name */
  readonly platform: string;
  /** the accessible name's pattern (follow or subscribe) */
  readonly verb: 'follow' | 'subscribe';
  /** the address, plain https (never an app scheme, B3) */
  readonly url: string;
  /** the share of the jar one follow fills (Sam: a quarter, a quarter, a half), in quarters */
  readonly worth: number;
  /** the worth label under the column, as the picture prints it */
  readonly label: string;
  /** the colour the follow pours, as the live region says it */
  readonly colour: string;
  /** the families whose catalog shades the pellets read as (the picture's blue, red, and pink and purple) */
  readonly families: readonly string[];
  /** the families' site names in the singular */
  readonly familyNames: string;
}

/**
 * The follows, in the picture's order. The addresses are the store's own, read from the footer of https://www.skreed.com/
 * on 2026-10-26, in the form of Sam's brief of 2026-11-02 ("it should take them to our Facebook page"). Facebook fills
 * a quarter of blue, YouTube a quarter of red (Sam: "on top of the 25% blue"), Instagram a half of the pink and purple
 * mixed lot (Sam: "It's one mixed lot").
 */
export const SIGNUP_JARS: readonly SignupJar[] = Object.freeze([
  { id: 'facebook', letter: 'f', platform: 'Facebook', verb: 'follow', url: 'https://www.facebook.com/skreedofficial', worth: 1, label: '5% OFF', colour: 'Blue', families: ['blissful-blue'], familyNames: 'Blissful Blue' },
  { id: 'youtube', letter: 'y', platform: 'YouTube', verb: 'subscribe', url: 'https://www.youtube.com/@skreedofficial', worth: 1, label: '5% OFF', colour: 'Red', families: ['roaring-red'], familyNames: 'Roaring Red' },
  { id: 'instagram', letter: 'i', platform: 'Instagram', verb: 'follow', url: 'https://www.instagram.com/skreedofficial', worth: 2, label: '10% OFF', colour: 'Pink and purple', families: ['playful-pink', 'vivid-violet'], familyNames: 'Playful Pink and Vivid Violet' },
]);
/** the platforms with an address: the follows rendered */
export const SIGNUP_FOLLOWS: readonly SignupJar[] = SIGNUP_JARS.filter((j) => j.url !== '' && j.worth > 0);
/** the number of follows that fill the jar */
export const FOLLOW_COUNT = SIGNUP_FOLLOWS.length;
/** the worths together: a full jar */
export const WORTH_TOTAL = SIGNUP_FOLLOWS.reduce((a, j) => a + j.worth, 0);
/** a follow's share of the jar, 0 to 1: its worth over the whole */
export const jarLevel = (j: SignupJar): number => (WORTH_TOTAL ? j.worth / WORTH_TOTAL : 0);
/** a follow by id */
export const jarById = (id: string): SignupJar | undefined => SIGNUP_JARS.find((j) => j.id === id);
/** the follow column's accessible name */
export const followAria = (j: SignupJar): string => fill(j.verb === 'subscribe' ? SIGNUP_COPY.subscribeAria : SIGNUP_COPY.followAria, { platform: j.platform, worth: j.label.toLowerCase() });
/** your jar's level after these follows, in the order they came */
export const yoursLevel = (ids: readonly string[]): number => Math.min(1, ids.reduce((a, id) => a + (jarById(id)?.worth ?? 0), 0) / (WORTH_TOTAL || 1));

/** the sixteen states of the visitor's jar: '0' empty, else the follows' letters in press order (C2's names) */
export const SIGNUP_STATES: readonly string[] = Object.freeze(['0', 'f', 'y', 'i', 'fy', 'fi', 'yf', 'yi', 'if', 'iy', 'fyi', 'fiy', 'yfi', 'yif', 'ify', 'iyf']);
/** the state for the follows in press order: '0' when empty, else their letters (unknown ids and repeats left out) */
export const stateOf = (order: readonly string[]): string => {
  const seen: string[] = [];
  for (const id of order) if (jarById(id) && !seen.includes(id)) seen.push(id);
  return seen.length ? seen.map((id) => jarById(id)!.letter).join('') : '0';
};
/** the previous name of stateOf (the island's stills were keyed by it) */
export const stillKey = stateOf;
/** the follows after a press: a platform already pressed adds nothing */
export const pressFollow = (order: readonly string[], id: string): readonly string[] => (!jarById(id) || order.includes(id) ? order : [...order, id]);
/** the level in words, by quarters */
export function levelWord(level: number): string {
  const q = Math.round(level * 4);
  return q >= 4 ? SIGNUP_COPY.levelFull : q === 3 ? SIGNUP_COPY.levelThree : q === 2 ? SIGNUP_COPY.levelHalf : SIGNUP_COPY.levelQuarter;
}
/** jar 4's description for the follows in press order: the level and the colours from the bottom */
export function yoursAlt(order: readonly string[]): string {
  const ids = order.filter((id, k) => jarById(id) && order.indexOf(id) === k);
  if (!ids.length) return SIGNUP_COPY.jarEmpty;
  return fill(SIGNUP_COPY.jarLayers, { level: levelWord(yoursLevel(ids)), layers: ids.map((id) => jarById(id)!.colour.toLowerCase()).join(SIGNUP_COPY.layerJoin) });
}
/** the live region's words for a follow's fill, the jar full or not */
export const addedLine = (id: string, full: boolean): string => fill(full ? SIGNUP_COPY.addedFull : SIGNUP_COPY.added, { colour: jarById(id)?.colour ?? '' });

/** the fill's reveal (D6): 900 ms for a quarter, 1400 ms for a half */
export const FILL_MS = Object.freeze({ quarter: 900, half: 1400 });
export const fillMs = (id: string): number => ((jarById(id)?.worth ?? 1) >= 2 ? FILL_MS.half : FILL_MS.quarter);
/** the fill waits until the visitor can see it: 500 ms after the press if the page is visible then, else 300 ms after it is visible again */
export const FILL_GATE = Object.freeze({ afterPress: 500, afterVisible: 300 });

/** jars.json as builder C's renders write it (src/assets/signup/jars/jars.json): the frame, the jar's box in it, each state's surface */
export interface JarsManifest {
  frame: { w: number; h: number };
  /** the jar's measured box as fractions of the frame (x across, y down) */
  jar: { x0: number; x1: number; y0: number; y1: number };
  /** each state's topmost point of the fill's surface as a fraction of the frame's height ('0': the inner floor), and, as the
   * renders write it, its seam: the row below which every state built on this one is pixel-identical to it, where a reveal starts */
  states: Record<string, { top: number; seam?: number }>;
}
/** C2's frame when the renders are not in yet: 400 x 480 at 2x, the outer diameter half the width, the rim's top at 0.06, the base at 0.87 */
export const JARS_DEFAULT: JarsManifest = /* @__PURE__ */ Object.freeze({ frame: { w: 400, h: 480 }, jar: { x0: 0.25, x1: 0.75, y0: 0.06, y1: 0.87 }, states: {} });
/**
 * The reveal from one state to the next (D6): the incoming image's clip-path inset from the top, in percent of the frame's
 * height, from the current state's seam (its surface top where the manifest gives no seam) to the new state's top; null
 * when either is unknown (the fill is then set at once). The band between a state's seam and its top is where the next
 * layer's grains lie over its surface (jars.json's notes), so a reveal that starts at the seam never jumps: below it the
 * two images agree, and the new grains come up over the old surface as the clip rises.
 */
export function revealSpan(m: Pick<JarsManifest, 'states'>, from: string, to: string): { from: number; to: number } | null {
  const a = m.states[from]?.seam ?? m.states[from]?.top, b = m.states[to]?.top;
  if (typeof a !== 'number' || typeof b !== 'number' || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  const pct = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 10000) / 100;
  return { from: pct(a), to: pct(b) };
}

/** the storage keys (sessionStorage, the visit only; try and catch everywhere): the follows pressed, in order, and the queued lead */
export const SIGNUP_KEYS = Object.freeze({ follows: 'skreed:signup-follows', queue: 'skreed:signup-queue' });
/** the lead endpoint (the ideation's write route, docs/00-IDEATION.md 7b); the Worker arrives with the lead infrastructure */
export const SIGNUP_LEAD_ENDPOINT = '/api/signup';

// ---- the island's jar of 2026-10-29 (src/scripts/hero/section5/), kept until the island drops its imports

// jar.bin as the build emits it (a hashed URL); under Node (the unit tests) there is no glob and the URL is empty
let JAR_FILES: Record<string, string> = {};
try { JAR_FILES = import.meta.glob<string>('../assets/signup/jar.bin', { eager: true, query: '?url', import: 'default' }); } catch { JAR_FILES = {}; }
export const JAR_BIN_URL: string = Object.values(JAR_FILES)[0] ?? '';

/** What the island handed the DOM script every frame it drew the section (no longer read by the page). */
export interface SignupFrame {
  on: boolean;
  cover: number;
  wipe: number;
  pour: string | null;
}
/** one still of the island's jar: 320 x 400 RGBA, the rows bottom-up */
export interface SignupStill { width: number; height: number; data: Uint8Array }
/** The island's side of the old bridge (window.__skreedSignup). */
export interface SignupIsland {
  pour(id: string): void;
  follows(ids: readonly string[]): void;
  still?(order: readonly string[], level?: number): Promise<SignupStill | null>;
  scrub?(t: number | null): void;
  tilt?(deg: number): void;
}
