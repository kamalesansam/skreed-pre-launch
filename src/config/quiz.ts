// Section 3, the quiz (docs/specs/quiz.md 3 and 5): every string, the six cards, the ten results and the scoring.
// Plain data and pure functions. The Astro component reads it at build and the lazy chunk at runtime, so it imports
// nothing (the shade ids, names, hexes and numbers are written out and checked against shades.gen.ts by
// tests/unit/quiz.test.ts). Sam's words of 2026-10-16 are quoted in the spec; the ten personalities, their taglines,
// shades, finishes and paragraphs are from his Shade Diagnosis quiz (the PDF), one per family.

export const QUIZ_COPY = {
  aria: 'Find your shade',
  h: 'Spoilt for choice? Let’s find your signature shade.',
  /** Sam's alternative headline, kept for him; not rendered */
  hAlt: 'Overwhelmed by 240 shades? Let’s fix that.',
  sub: 'Grab a coffee, sit back and get comfortable. Answer a few questions and we’ll match you to your perfect Skreed shade.',
  begin: 'Swipe to begin',
  loading: 'Loading...',
  noscriptLead: 'The quiz needs JavaScript. Browse the ',
  noscriptLink: 'ten families',
  noscriptTail: ' instead.',
  /** each card's accessible name, "Question n of 6" */
  cardAria: (n: number) => `Question ${n} of 6`,
  eyebrow: 'Your shade',
  fam: (family: string, index: number) => `${family}, shade ${index} of 24`,
  finish: (f: 'gloss' | 'matte') => `Best in ${f}.`,
  own: 'Found the perfect shade? Make it yours!',
  see: 'See it on the case',
  retry: 'Not quite? Try again',
  gift: 'And here’s a little something extra.',
  giftSub: 'Leave your email and we’ll send you a surprise gift inspired by your shade right away, plus first dibs on your shade when we launch.',
  email: 'Email',
  consent: 'I’m happy to hear from Skreed by email.',
  send: 'Send my gift',
  sending: 'Sending...',
  trying: 'Still trying...',
  fine: 'One email about your shade, one when we launch. Unsubscribe any time.',
  errEmail: 'That doesn’t look like an email address.',
  errConsent: 'Tick the box so we can email you.',
  errSend: 'That didn’t go through. Try again.',
  dup: 'You’re already on the list. Check your inbox.',
  offline: 'You’re offline. We’ll send it when you’re back.',
  done: (email: string) => `Done. Your gift is on its way to ${email}.`,
  notYou: 'Not you? Use another email.',
} as const;

export interface QuizSide { word: string; shade: string; name: string; hex: string }
export interface QuizCard { q: string; left: QuizSide; right: QuizSide }

/** The six cards. The left side is bit 1 of the answer word, the right side bit 0. */
export const QUIZ_CARDS: readonly QuizCard[] = [
  { q: 'Loud or quiet?', left: { word: 'Loud', shade: 'playful-pink-24', name: 'Fuchsia', hex: '#e0028d' }, right: { word: 'Quiet', shade: 'stormy-grey-07', name: 'Dove', hex: '#9c9c9c' } },
  { q: 'Warm or cool?', left: { word: 'Warm', shade: 'blushing-coral-09', name: 'Clementine', hex: '#f78628' }, right: { word: 'Cool', shade: 'blissful-blue-08', name: 'Sky', hex: '#08bcf4' } },
  { q: 'Morning or midnight?', left: { word: 'Morning', shade: 'mellow-yellow-18', name: 'Golden', hex: '#f7bc34' }, right: { word: 'Midnight', shade: 'blissful-blue-24', name: 'Midnight', hex: '#0e1442' } },
  { q: 'Plan it or wing it?', left: { word: 'Plan it', shade: 'stormy-grey-23', name: 'Graphite', hex: '#424548' }, right: { word: 'Wing it', shade: 'playful-pink-09', name: 'Bubblegum', hex: '#f086c6' } },
  { q: 'Classic or new?', left: { word: 'Classic', shade: 'basic-brown-07', name: 'Cinnamon', hex: '#ba7237' }, right: { word: 'New', shade: 'vivid-violet-07', name: 'Amethyst', hex: '#8554d1' } },
  { q: 'Spotlight or backstage?', left: { word: 'Spotlight', shade: 'roaring-red-06', name: 'Classic', hex: '#ef1123' }, right: { word: 'Backstage', shade: 'go-green-09', name: 'Sage', hex: '#96a880' } },
];

export type Finish = 'gloss' | 'matte';
export interface QuizResult {
  family: string; familyName: string;
  persona: string; tagline: string; text: string;
  shade: string; name: string; hex: string;
  /** index within the family (1 to 24) and the catalog number (1 to 240) */
  index: number; n: number;
  finish: Finish;
  /** the personality's answers to the six cards, left = 1 */
  sig: string;
}

/** The ten results, in catalog family order. */
export const QUIZ_RESULTS: readonly QuizResult[] = [
  { family: 'frosty-white', familyName: 'Frosty White', persona: 'The Quiet Curator', tagline: 'Nothing stays unless it earns its place.', shade: 'frosty-white-10', name: 'Porcelain', hex: '#eff1f0', index: 10, n: 10, finish: 'matte', sig: '001110',
    text: 'You edit your life the way you’d edit a gallery. Nothing stays unless it earns its place. You’re drawn to things that feel considered rather than loud, and people read your restraint as confidence, not shyness.' },
  { family: 'blissful-blue', familyName: 'Blissful Blue', persona: 'The Calm Strategist', tagline: 'Three steps ahead, quietly.', shade: 'blissful-blue-22', name: 'Navy', hex: '#0e305b', index: 22, n: 46, finish: 'matte', sig: '000101',
    text: 'You’re the one everyone looks at when things go sideways, because you don’t. Composed under pressure, three steps ahead, quietly running the show without needing credit for it.' },
  { family: 'playful-pink', familyName: 'Playful Pink', persona: 'The Romantic Rebel', tagline: 'Feeling first, no regrets.', shade: 'playful-pink-09', name: 'Bubblegum', hex: '#f086c6', index: 9, n: 57, finish: 'gloss', sig: '110000',
    text: 'Soft on the outside, stubborn underneath. You lead with feeling, not logic, and you’ve never once regretted it. Sentimental about the little things, allergic to anything that feels forced.' },
  { family: 'vivid-violet', familyName: 'Vivid Violet', persona: 'The Dreamer', tagline: 'Half here, half somewhere more interesting.', shade: 'vivid-violet-07', name: 'Amethyst', hex: '#8554d1', index: 7, n: 79, finish: 'matte', sig: '000000',
    text: 'Half in this world, half somewhere more interesting. You notice things other people miss and you’re always a little bit mid-thought. Deeply creative, gently mysterious.' },
  { family: 'mellow-yellow', familyName: 'Mellow Yellow', persona: 'The Spark', tagline: 'Main energy, no permission needed.', shade: 'mellow-yellow-11', name: 'Sunflower', hex: '#f4d41d', index: 11, n: 107, finish: 'gloss', sig: '111001',
    text: 'You’re the reason the group chat is active at 11pm. Rooms feel different when you walk in. Brighter, faster, more fun. You don’t wait for permission to be the main energy.' },
  { family: 'basic-brown', familyName: 'Basic Brown', persona: 'The Grounded Wanderer', tagline: 'Experience over show.', shade: 'basic-brown-07', name: 'Cinnamon', hex: '#ba7237', index: 7, n: 127, finish: 'matte', sig: '011100',
    text: 'Steady, dependable, and quietly adventurous. You’re the one people trust to figure it out, whether that’s a group trip or a group crisis. You value experience over show.' },
  { family: 'blushing-coral', familyName: 'Blushing Coral', persona: 'The Warm Optimist', tagline: 'Golden hour, all year round.', shade: 'blushing-coral-09', name: 'Clementine', hex: '#f78628', index: 9, n: 153, finish: 'gloss', sig: '011011',
    text: 'You’re the friend people call with good news first. Warm without trying, welcoming without performing it. You make people feel like they’ve known you longer than they have.' },
  { family: 'stormy-grey', familyName: 'Stormy Grey', persona: 'The Understated Icon', tagline: 'Memorable without the noise.', shade: 'stormy-grey-23', name: 'Graphite', hex: '#424548', index: 23, n: 191, finish: 'matte', sig: '000011',
    text: 'You’ve never needed to be loud to be memorable. Effortlessly composed, quietly self-assured. You’re proof that confidence doesn’t require noise. People notice you precisely because you’re not trying to be noticed.' },
  { family: 'go-green', familyName: 'Go Green', persona: 'The Quiet Architect', tagline: 'Timeless over trendy.', shade: 'go-green-09', name: 'Sage', hex: '#96a880', index: 9, n: 201, finish: 'matte', sig: '010110',
    text: 'Thoughtful, observant, and quietly confident. You don’t chase attention. Your style is intentional, and you’re drawn to things that feel timeless rather than trendy. You have a calming presence.' },
  { family: 'roaring-red', familyName: 'Roaring Red', persona: 'The Main Character', tagline: 'Attention just tends to arrive.', shade: 'roaring-red-06', name: 'Classic', hex: '#ef1123', index: 6, n: 222, finish: 'gloss', sig: '110011',
    text: 'You don’t chase attention. It just tends to arrive. Bold decisions, strong opinions, zero interest in blending in. Every story you tell somehow becomes the best one in the room.' },
];

export type Answer = 0 | 1;

/** Hamming distance between a 6-bit answer word and a signature string. */
function distance(answers: readonly Answer[], sig: string): number {
  let d = 0;
  for (let i = 0; i < 6; i++) if ((sig.charCodeAt(i) - 48) !== answers[i]) d++;
  return d;
}

/**
 * The result for six answers (left = 1): the personality nearest by Hamming distance. On a tie, the earliest card on
 * which the tied personalities differ decides, in the visitor's favour. Every one of the 64 words resolves to one
 * result (tests/unit/quiz.test.ts proves it, and that every family is reachable).
 */
export function scoreQuiz(answers: readonly Answer[]): QuizResult {
  if (answers.length !== 6) throw new Error(`scoreQuiz: six answers expected, got ${answers.length}`);
  let best = 7, c: QuizResult[] = [];
  for (const r of QUIZ_RESULTS) { const d = distance(answers, r.sig); if (d < best) { best = d; c = [r]; } else if (d === best) c.push(r); }
  for (let q = 0; q < 6 && c.length > 1; q++) {
    const bit = String(answers[q]);
    if (c.some((r) => r.sig[q] !== bit) && c.some((r) => r.sig[q] === bit)) c = c.filter((r) => r.sig[q] === bit);
  }
  return c[0];
}

/** The family page with the shade in front (family-page.md 2.2: three-digit catalog number). */
export function resultHref(r: QuizResult): string {
  return `/shades/${r.family}/?shade=${String(r.n).padStart(3, '0')}`;
}

/** The lead endpoint contract (quiz.md 5): the Worker arrives with section 4's lead infrastructure. */
export const QUIZ_LEAD_ENDPOINT = '/api/quiz-lead';
