// Strings of the site pages the family pass added (review iteration 1, CHECKLIST G1, G26): the 404 and the structured
// data. The 404 copy follows docs/brand/type-system.md role 16 and docs/02-THE-SITE-IN-WORDS.md ("404.", "That shade
// doesn't exist. These 240 do."); the button goes home, because the Wall it names does not exist yet (G21). Proposed,
// pending Sam (docs/specs/family-page.md 14). No em dashes, no emojis.
export const SITE_COPY = {
  notFound: {
    title: '404. This shade does not exist. Skreed',
    description: 'This page is not on skreed.in. Doors open Nov 1.',
    h1: '404. This shade does not exist.',
    line: 'These 240 do.',
    swatch: 'vivid-violets-03',   // Mauve, the one real swatch (type-system role 16)
    button: 'Back to skreed.in',
  },
  org: {
    name: 'Skreed',
    email: 'collab@skreed.in',
    locality: 'Hyderabad',
    region: 'Telangana',
    country: 'IN',
    instagram: 'https://www.instagram.com/skreedofficial/',
  },
} as const;
