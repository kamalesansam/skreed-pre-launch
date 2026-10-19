// Section 3, the quiz (docs/specs/quiz.md 3 and 5): every string, the ten questions, the seven personalities and the
// scoring. Plain data and pure functions. The Astro component reads it at build and the lazy chunk at runtime, so it
// imports nothing: shades are ids only, and the component resolves their names, hexes and numbers from shades.gen.ts at
// build (tests/unit/quiz.test.ts checks every id against the catalog). The questions, answers, personalities, profiles,
// colour profiles, finishes and shade groups are Sam's (2026-10-16, "the basic idea for the content for the quiz"),
// in his words, with three changes only: his two dashes written as full stops (CLAUDE.md rule 16), "11 p.m." kept on one
// line and his "color" spelt "colour" as the site spells it; his shade names as the catalog prints them ("Sage", not
// "Sage Green"). His confidence scores and rarity figures are left out until real answers exist to count (Sam, the
// same day).

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
  /** each card's accessible name, "Question n of 10" */
  cardAria: (n: number) => `Question ${n} of ${QUIZ_QUESTION_COUNT}`,
  /** the count over each question, in the labels' mono: "01 / 10" (aria-hidden; the card's name says it in words) */
  count: (n: number) => `${String(n).padStart(2, '0')} / ${QUIZ_QUESTION_COUNT}`,
  back: 'Back',
  eyebrow: 'Your shade',
  fam: (family: string, index: number) => `${family}, shade ${index} of 24`,
  finish: (f: 'gloss' | 'matte') => `Best in ${f}.`,
  also: 'Also compatible with',
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

export type Finish = 'gloss' | 'matte';
export type PersonaId = 'main' | 'curator' | 'spark' | 'optimist' | 'rebel' | 'dreamer' | 'strategist';

export interface Persona {
  id: PersonaId;
  name: string;
  /** the personality profile, Sam's words */
  profile: string;
  /** the colour profile, Sam's words */
  palette: string;
  finish: Finish;
  /** the group's shades by catalog id; the first is the one Sam recommends, and the result draws any of them at random */
  shades: readonly string[];
}

/** The seven personalities, in the order Sam lists them under each question. */
export const QUIZ_PERSONAS: readonly Persona[] = [
  { id: 'main', name: 'The Main Character', finish: 'gloss',
    profile: 'You don’t chase attention, you command it. Bold decisions, strong opinions, zero interest in blending in. Every story you tell somehow becomes the best one in the room.',
    palette: 'Rich, saturated, and attention-grabbing tones.',
    shades: ['roaring-red-11', 'roaring-red-21', 'roaring-red-15', 'roaring-red-23', 'blissful-blue-24', 'roaring-red-07', 'roaring-red-02'] },
  { id: 'curator', name: 'The Quiet Curator', finish: 'matte',
    profile: 'You curate your life the way you’d curate a gallery. Nothing stays unless it earns its place. You’re thoughtful, observant, and quietly confident. You have a calming presence and an eye for the understated. You choose with intention, gravitating towards things that feel balanced, timeless, and effortlessly distinctive rather than simply trendy.',
    palette: 'Soft, warm neutrals with quiet depth. Your palette doesn’t shout.',
    shades: ['frosty-white-10', 'blissful-blue-20', 'basic-brown-01', 'go-green-09', 'stormy-grey-01', 'blissful-blue-03', 'frosty-white-20'] },
  { id: 'spark', name: 'The Spark', finish: 'gloss',
    profile: 'You’re the reason the group chat is active at 11 p.m. Rooms feel different when you walk in. Brighter, faster, more fun.',
    palette: 'High-energy brights with just enough warmth to keep them from feeling harsh.',
    shades: ['mellow-yellow-11', 'playful-pink-09', 'blushing-coral-12', 'playful-pink-24', 'vivid-violet-07', 'mellow-yellow-15'] },
  { id: 'optimist', name: 'The Warm Optimist', finish: 'gloss',
    profile: 'You’re the friend people call with good news first. Warm without trying, welcoming without performing it, you make people feel like they’ve known you longer than they have.',
    palette: 'Warm tones with a soft edge.',
    shades: ['blushing-coral-19', 'mellow-yellow-20', 'blushing-coral-09', 'blushing-coral-14', 'basic-brown-05', 'mellow-yellow-10', 'blushing-coral-17'] },
  { id: 'rebel', name: 'The Romantic Rebel', finish: 'gloss',
    profile: 'Soft on the outside, stubborn underneath. You lead with feeling, not logic, and you’ve never once regretted it. Sentimental about the little things, allergic to anything that feels forced.',
    palette: 'Playful, expressive brights with a soft edge.',
    shades: ['playful-pink-06', 'roaring-red-10', 'vivid-violet-03', 'playful-pink-03', 'roaring-red-03', 'vivid-violet-05', 'roaring-red-08'] },
  { id: 'dreamer', name: 'The Dreamer', finish: 'gloss',
    profile: 'Half in this world, half somewhere more interesting. You notice things other people miss, and you’re always a little bit mid-thought. Deeply creative, gently mysterious.',
    palette: 'Deep, moody tones with a touch of whimsy.',
    shades: ['vivid-violet-13', 'blissful-blue-15', 'basic-brown-20', 'blissful-blue-18', 'vivid-violet-16', 'go-green-20', 'go-green-21'] },
  { id: 'strategist', name: 'The Calm Strategist', finish: 'matte',
    profile: 'You’re the one everyone looks at when things go sideways, because you don’t. Composed under pressure, three steps ahead, quietly running the show without needing credit for it.',
    palette: 'Nuanced neutrals with depth and a hint of colour.',
    shades: ['blissful-blue-22', 'blissful-blue-21', 'go-green-08', 'go-green-16', 'vivid-violet-02', 'basic-brown-02', 'basic-brown-20'] },
];

export interface QuizAnswer { text: string; persona: PersonaId }
export interface QuizQuestion {
  q: string;
  /** Sam marked it VISUAL: each answer is to carry a picture once the pictures exist (quiz.md 10); words only until then */
  visual: boolean;
  /** one answer per personality, in the order shown on the card */
  answers: readonly QuizAnswer[];
}

/** One answer per personality, written in Sam's order (main, curator, spark, optimist, rebel, dreamer, strategist). */
type SevenTexts = readonly [string, string, string, string, string, string, string];
const ORDER: readonly PersonaId[] = ['main', 'curator', 'spark', 'optimist', 'rebel', 'dreamer', 'strategist'];
/** The shown order per question: a fixed shuffle, so the position of an answer never gives its personality away. */
const SHOWN: readonly (readonly number[])[] = [
  [2, 5, 0, 6, 3, 1, 4], [6, 3, 1, 4, 0, 5, 2], [4, 1, 6, 2, 5, 0, 3], [1, 6, 3, 0, 4, 2, 5], [5, 0, 4, 1, 2, 6, 3],
  [3, 2, 5, 0, 6, 4, 1], [0, 4, 2, 5, 1, 3, 6], [6, 1, 3, 5, 2, 0, 4], [2, 4, 0, 3, 6, 1, 5], [5, 3, 6, 1, 0, 2, 4],
];
const question = (i: number, q: string, visual: boolean, texts: SevenTexts): QuizQuestion =>
  ({ q, visual, answers: SHOWN[i].map((k) => ({ text: texts[k], persona: ORDER[k] })) });

/** The ten questions (Sam's numbers 4, 5, 7, 8, 9, 10, 13, 14, 15 and 16). */
export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  question(0, 'Pick your ideal Sunday.', true, ['Front row at a concert, lights blazing', 'A rainy day, a good playlist, total silence', 'A rooftop party that starts at noon', 'A beach bonfire with your whole friend group', 'A spontaneous road trip, no destination', 'Getting lost in a bookstore for hours', 'A quiet morning, coffee, and a plan']),
  question(1, 'What’s your comfort drink?', false, ['Espresso, straight up', 'Oat milk latte, no sugar', 'Fresh lemonade', 'Masala chai, extra ginger', 'Strawberry milkshake', 'Butterfly pea tea', 'Filter coffee, no sugar']),
  question(2, 'Pick your dream trip.', true, ['Vegas, lights on all night', 'A vineyard in Tuscany', 'Rio during Carnival', 'A hammock in Bali, no plans', 'Paris', 'Santorini at sunset', 'A quiet lake in Switzerland']),
  question(3, 'Your friends would call you the one who...', false, ['Makes every plan actually happen', 'Has impeccable, effortless taste', 'Is always up for anything, any time', 'Checks in on everyone, always', 'Feels everything, loudly and honestly', 'Is always three ideas ahead of everyone else', 'Has a plan for the backup plan']),
  question(4, 'Pick your ideal desk setup.', true, ['A bold statement piece, front and centre', 'Wood, linen, clean surface, one plant', 'String lights and stickers, everywhere', 'Photos of everyone you love', 'Pink everything, no exceptions', 'Fairy lights and half-finished sketches', 'Colour-coded planner, zero clutter']),
  question(5, 'Pick a movie night.', false, ['Big blockbuster, opening night', 'An indie film nobody’s heard of yet', 'A rom-com with your loudest friends', 'A feel-good favourite you’ve seen ten times', 'Anything that makes you cry, honestly', 'Something surreal you’ll be thinking about for days', 'A tightly plotted thriller']),
  question(6, 'You walk into a party. Where do you find yourself?', false, ['Under the spotlight, surrounded by people', 'A quiet corner with a beautiful view', 'Dancing in the middle of the crowd', 'Outside with a small group, drinks in hand', 'Somewhere unexpected, laughing with new people', 'On a balcony, watching everything unfold', 'At a table with a drink, taking it all in']),
  question(7, 'Pick the room you’d want to wake up in.', true, ['Dramatic four-poster bed, velvet curtains, sunlight pouring in', 'Linen sheets, warm wood, one perfect vase of flowers', 'Colourful room, funky lamp, records playing', 'Sunlit room opening onto a garden', 'Pink sheets, scattered love notes, flowers everywhere', 'Moody room, books, art, plants, and a window overlooking the city', 'Minimal room, crisp sheets, coffee already waiting']),
  question(8, 'Pick the outfit you’d wear without overthinking it.', true, ['A sharp red dress with statement shoes', 'A perfectly tailored neutral set', 'Bright top, fun accessories, unexpected shoes', 'Breezy dress, sandals, woven bag', 'Pink mini dress, playful bag, lots of jewellery', 'Dark layered outfit with an unusual vintage piece', 'Crisp shirt, tailored trousers, minimalist watch']),
  question(9, 'If you could read everyone’s mind for one day, what would you look for?', false, ['What everyone really thinks of me', 'Whether people are being genuine', 'The funniest thing someone has ever thought', 'What would make everyone around me happier', 'What someone secretly feels about me', 'The weirdest, most unexpected thought in the room', 'What people are planning before they do it']),
];

export const QUIZ_QUESTION_COUNT = 10;

export const personaById = (id: PersonaId): Persona => {
  const p = QUIZ_PERSONAS.find((x) => x.id === id);
  if (!p) throw new Error(`quiz: no personality ${id}`);
  return p;
};

/**
 * The result for ten answers: the personality picked most often (Sam: "maximum answers corresponding to"). On a tie,
 * the tied personality the visitor picked most recently wins, so the last word is theirs. Deterministic: the same
 * answers always give the same personality (tests/unit/quiz.test.ts).
 */
export function scoreQuiz(answers: readonly PersonaId[]): Persona {
  if (answers.length !== QUIZ_QUESTION_COUNT) throw new Error(`scoreQuiz: ${QUIZ_QUESTION_COUNT} answers expected, got ${answers.length}`);
  const count = new Map<PersonaId, number>();
  for (const a of answers) count.set(a, (count.get(a) ?? 0) + 1);
  const best = Math.max(...count.values());
  for (let i = answers.length - 1; i >= 0; i--) if (count.get(answers[i]) === best) return personaById(answers[i]);
  throw new Error('scoreQuiz: unreachable');
}

/**
 * Sam's note: the recommended shade is drawn at random within the group, and the others are the compatible shades
 * (person A gets Porcelain, person B Stone, person C Sage). `rand` is injectable for the tests.
 */
export function pickShade(p: Persona, rand: () => number = Math.random): { shade: string; others: string[] } {
  const i = Math.min(p.shades.length - 1, Math.floor(rand() * p.shades.length));
  return { shade: p.shades[i], others: p.shades.filter((_s, k) => k !== i) };
}

/** The family page with the shade in front (family-page.md 2.2: the three-digit catalog number). */
export function shadeHref(family: string, n: number): string {
  return `/shades/${family}/?shade=${String(n).padStart(3, '0')}`;
}

/** WCAG relative luminance of a #rrggbb hex. */
export function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** A swatch under 1.5:1 against Pearl Whisper gets the 1 px Urban Slate hairline (the family page's --swr rule); in the
 *  quiz it applies on the fog (the 3D tier). */
export function needsRing(hex: string): boolean {
  return (luminance('#f7f6f3') + 0.05) / (luminance(hex) + 0.05) < 1.5;
}

/** On the poster tier (reduced motion, no WebGL, no JavaScript) the quiz stands on --night #050506: a swatch under 3:1
 *  against it (WCAG 1.4.11) gets a 1 px Pearl Whisper hairline there instead (review 2026-10-19). */
export function needsRingNight(hex: string): boolean {
  return (luminance(hex) + 0.05) / (luminance('#050506') + 0.05) < 3;
}

/** The lead endpoint contract (quiz.md 5): the Worker arrives with the lead infrastructure. */
export const QUIZ_LEAD_ENDPOINT = '/api/quiz-lead';
