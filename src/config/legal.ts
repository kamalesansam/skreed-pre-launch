// The two legal pages (CHECKLIST G15 and G16, rules 46 and 47; docs/specs/legal-pages.md): the privacy notice,
// DPDP-shaped, and the terms of use. Every fact here is read from the code that handles the data (server/lib/lead.php,
// server/schema.sql, the two forms) or from facts the site already states (SITE_COPY.org); whatever only Sam can say
// (the legal entity, a named grievance officer, a retention period, the courts) is a question in the spec, never a
// guess in the copy. Drafts for Sam and his lawyer to read before the pages count as final. No em dashes, no emojis.
import { SITE_COPY } from '../scripts/family/site-copy.ts';

/** a run of a paragraph: plain words, or a link */
export type Run = string | { readonly text: string; readonly href: string };
/** a block of a section: a paragraph of runs, or a plain list of them */
export type Block = readonly Run[] | { readonly list: readonly (readonly Run[])[] };
export interface LegalSection { readonly h: string; readonly blocks: readonly Block[] }
export interface LegalPage {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly h1: string;
  readonly updated: readonly [string, string];   // the words and the ISO date
  readonly intro: readonly Run[];
  readonly sections: readonly LegalSection[];
}

const EMAIL = SITE_COPY.org.email;
const mail: Run = { text: EMAIL, href: `mailto:${EMAIL}` };
const UPDATED = ['Updated 3 November 2026.', '2026-11-03'] as const;

export const PRIVACY: LegalPage = {
  path: '/privacy/',
  title: 'Privacy notice. Skreed',
  description: 'What skreed.shop collects, why, who handles it for us, and how to see, change or remove it.',
  h1: 'Privacy notice',
  updated: UPDATED,
  intro: ['This notice covers skreed.shop, our page before the Skreed store opens on 15 November 2026. It says what we collect, why we collect it, who handles it for us, and how you can see, change or remove it. We wrote it for India’s Digital Personal Data Protection Act, 2023.'],
  sections: [
    { h: 'Who we are', blocks: [
      ['Skreed, Hyderabad, Telangana, India. Write to us at ', mail, '.'],
    ] },
    { h: 'What we collect', blocks: [
      ['Only what you send us with the sign-up form or the quiz’s form, and only once you tick the box that says you are happy to hear from us by email:'],
      { list: [
        ['Your first name and email address, and that you ticked the box.'],
        ['To check the address is yours: a six-digit code we email you. We keep only a scrambled form of it, it stops working after 10 minutes, and we note when you confirmed.'],
        ['From the quiz: the shade it drew for you, its family, the finish, the personality it matched, the other shades it recommended and your answers.'],
        ['From the sign-up: which of our Facebook, YouTube and Instagram pages you opened from the jars.'],
        ['With either form, to keep it safe: a one-way scramble of your IP address that cannot be turned back into the address, the name and version your browser reports, and the time.'],
      ] },
      ['We ask for no phone number and no payment details.'],
    ] },
    { h: 'What we do not collect', blocks: [
      ['The site sets no cookies and runs no analytics or advertising trackers. Its fonts, pictures and 3D models come from skreed.shop itself, not from other companies.'],
      ['While you visit, your browser keeps a few notes for this tab only, such as where you are in the quiz and which jars you have opened. They never leave your browser, and they end when you close the tab.'],
    ] },
    { h: 'Why we use it', blocks: [
      { list: [
        ['To confirm your address: the six-digit code.'],
        ['To email you once you have confirmed: a welcome note (from the quiz, with wallpapers in your shade), then in November 2026 a reminder and our launch email with your launch offer. An address that is never confirmed gets nothing but the code.'],
        ['To tell our team that you signed up, with what you sent.'],
        ['To stop abuse: the scrambled IP address limits how often one connection can send the forms.'],
      ] },
      ['We do not sell your data, and we do not use it for advertising.'],
    ] },
    { h: 'Who handles it for us', blocks: [
      ['Hostinger hosts the site and the database your address is saved in. Zoho sends our emails. Both handle it on our instructions only.'],
    ] },
    { h: 'How long we keep it', blocks: [
      ['An address that is never confirmed is deleted a day after its last code. A confirmed address we keep until you unsubscribe or ask us to remove it, or until we no longer need it for the launch, whichever comes first.'],
    ] },
    { h: 'Your rights', blocks: [
      ['You can ask to see the data we hold about you, to correct it, or to erase it. You can withdraw your consent at any time, as easily as you gave it: every email we send you has an unsubscribe link, and one press stops our emails and deletes your address and everything you sent with it. You can also reply to any of our emails, or write to ', mail, '. Withdrawing stops what we do next; it does not undo what we did before.'],
    ] },
    { h: 'Questions and complaints', blocks: [
      ['Write to ', mail, ' with “Privacy” in the subject, and we will answer you by email. If we do not resolve your complaint, you can take it to the Data Protection Board of India.'],
    ] },
    { h: 'Under 18', blocks: [
      ['The forms are for people aged 18 or over. If you are under 18, please do not send them.'],
    ] },
    { h: 'Other sites', blocks: [
      ['The jars open Facebook, YouTube and Instagram in a new tab. Their own privacy policies apply there.'],
    ] },
    { h: 'Changes', blocks: [
      ['When this notice changes, we change the date at the top. If a change affects how we use your email, we tell you by email first.'],
    ] },
  ],
};

export const TERMS: LegalPage = {
  path: '/terms/',
  title: 'Terms of use. Skreed',
  description: 'The terms for using skreed.shop, our page before the Skreed store opens.',
  h1: 'Terms of use',
  updated: UPDATED,
  intro: ['These terms cover your use of skreed.shop, our page before the Skreed store opens on 15 November 2026. By using the site you agree to them.'],
  sections: [
    { h: 'Nothing is sold here', blocks: [
      ['The site shows our products, shades and case types. It takes no orders and no payments, and shows no prices. Products, shades and the launch date may change before the store opens.'],
    ] },
    { h: 'Launch offers', blocks: [
      ['The site and our emails name launch offers for the Skreed store. What each offer is, who can use it and for how long are set out with the offer when the store opens.'],
    ] },
    { h: 'Our content', blocks: [
      ['The site, its words, pictures and 3D models, and the names of our shades belong to Skreed or to those who licensed them to us. You are welcome to share links to it. Please do not copy, resell or reuse its content without our written permission.'],
    ] },
    { h: 'Using the site', blocks: [
      ['Please do not try to break, overload or misuse the site or its forms, and send only your own email address.'],
    ] },
    { h: 'Other sites', blocks: [
      ['Links to Facebook, YouTube, Instagram and other sites lead to services we do not run. Their own terms apply there.'],
    ] },
    { h: 'The site as it is', blocks: [
      ['We build the site with care, but we offer it as it is. It may change, pause or end at any time. As far as the law allows, we are not liable for any loss that comes from using it.'],
    ] },
    { h: 'Your data', blocks: [
      ['How we handle what you send us is in our ', { text: 'privacy notice', href: '/privacy/' }, '.'],
    ] },
    { h: 'The law', blocks: [
      ['These terms are governed by the laws of India.'],
    ] },
    { h: 'Contact', blocks: [
      ['Skreed, Hyderabad, Telangana, India. Write to us at ', mail, '.'],
    ] },
  ],
};

/**
 * The unsubscribe page (/unsubscribe/, docs/specs/legal-pages.md D6), opened from the line at the foot of every email to
 * the list. It asks before anything is deleted, because mail scanners open links on their own; the press posts to
 * /api/unsubscribe, which deletes the address and what came with it.
 */
export const UNSUB_COPY = {
  title: 'Unsubscribe. Skreed',
  description: 'Stop emails from Skreed and delete your address.',
  h1: 'Unsubscribe',
  ask: 'Stop all emails from Skreed to {email}? We delete your address and everything you sent us with it.',
  button: 'Unsubscribe',
  working: 'Unsubscribing...',
  done: 'Done. We have deleted {email}, and we will not write to it again.',
  broken: 'This link is not complete. Write to {contact} and we remove you by hand.',
  error: 'That didn’t go through. Try again.',
  noscript: 'This page needs JavaScript. Or write to {contact} and we remove you by hand.',
} as const;

/** the link beside each form's consent tick */
export const PRIVACY_LINK = 'Privacy notice';
/** the pages' own links back and across */
export const LEGAL_NAV = { home: 'Back to skreed.shop', privacy: 'Privacy notice', terms: 'Terms of use' } as const;
