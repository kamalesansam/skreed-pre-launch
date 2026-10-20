// Every string on the family pages (docs/specs/family-page.md section 3, 20 and 21). Pure functions of the data, shared
// by the Astro components (build) and the page module (runtime), so the HTML and the live updates can never disagree.
// No em dashes, no emojis, sentence case (CLAUDE.md rules 3, 16, 29). Round 3 (Sam, 2026-10-15): no eyebrow, no index
// line, no family line in the HUD, no Reserve, no "Show swatches"; "All families" opens the switcher.

export interface CopyShade { readonly name: string; readonly index: number; readonly n: number; readonly nnn: string }

export const FAM_COPY = {
  title: (family: string) => `${family}, all 24 shades. Skreed`,
  description: (family: string, first: string, last: string) => `All 24 ${family} shades, from ${first} to ${last}, on a Skreed case in matte or gloss. Doors open Nov 15.`,
  home: 'Skreed home',
  families: 'Families',
  allFamilies: 'All families',
  stage: (family: string, shade: string) => `24 ${family} cases in a row. ${shade} is in front.`,
  prev: 'Previous shade',
  next: 'Next shade',
  numberSr: (s: CopyShade) => `Shade ${s.n} of 240`,
  scrubber: 'Shade',
  scrubberText: (s: CopyShade) => `${s.name}, ${s.index} of 24`,
  finish: 'Finish',
  matte: 'Matte',
  gloss: 'Gloss',
  gridGroup: (family: string) => `${family}, 24 shades`,
  swatch: (s: CopyShade, family: string) => `${s.name}, ${family}, ${s.index} of 24`,
  switcherClose: 'Close',
  caseTypes: 'Case types',
  live: (s: CopyShade, family: string) => `${s.name}. ${family}. Shade ${s.n} of 240.`,
  modelFailed: 'Could not load the 3D cases. Showing the swatches.',
  modelFailedTwice: 'Could not load the 3D cases. Reload the page to try again.',
  offline: 'You are offline. Showing the swatches.',
  loaderOffline: 'You are offline. Showing the swatches.',
  slow: 'Still loading the 3D cases.',
  saveData: 'Data saver is on. Showing the swatches.',
  slowConnection: 'Slow connection. Showing the swatches.',
  show3d: (mb: string) => `Show in 3D, ${mb} MB`,
  show3dPlain: 'Show in 3D',   // dev builds only: the stand-in has no measured download size
  tryAgain: 'Try again',
  reload: 'Reload',
  familyLink: (family: string) => `${family}, all 24 shades`,
} as const;

/** The four case types after the carousel (section 20; the copy cut from Sam's product descriptions, wording for Sam to confirm). */
export const BEATS = [
  { id: '1', name: 'Tough', copy: 'A durable polycarbonate shell over a shock-absorbing TPU layer, for everyday bumps, drops and scratches. Precision cutouts keep the camera, port and controls clear.' },
  { id: '2', name: 'MagTough', copy: 'The Tough case with a built-in magnetic ring. Works with every magnetic phone accessory.' },
  { id: '3', name: 'Snap', copy: 'Light everyday protection that keeps the slim profile of your phone. Precision cutouts keep the camera, port and controls clear.' },
  { id: '4', name: 'Armor', copy: 'Built for everyday impact. Reinforced edges and raised protection around the camera, with a built-in magnetic ring for magnetic accessories.' },
] as const;

/** The argument screen (section 21, exception E-F3): the tagline's short row over its long row, uppercase like ciao's letters. */
export const ARGUMENT = { rows: ['GO', 'BEYOND BASIC'], heading: 'Go beyond basic' } as const;

/** A state line's 600 lead sentence and the rest (spec 3, type-system note 10). Shared by the build, which writes the
 * data-saver and slow-connection lines into the HTML, and the page module, which writes the runtime lines. */
export function splitLine(line: string): [string, string] {
  const k = line.indexOf('. ');
  return k < 0 ? [line, ''] : [line.slice(0, k + 1), line.slice(k + 2)];
}
