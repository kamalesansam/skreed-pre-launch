# The legal pages: /privacy/ and /terms/

Status: built 2026-11-03 on `claude/privacy-terms-pages`, corrected the same day after the email codes (bc1ee64: a required first name, the six-digit code) and the dated mailings (09ac423) landed, at Sam's request ("Do this task here: Privacy and terms pages for skreed.shop"), after skreed.shop went live with the two lead forms and both legal paths answered 404. Drafts: the copy is written from what the code does, and section 6 lists what only Sam (and his lawyer) can settle before the pages count as final.

## 1. Goal

CLAUDE.md rules 46 and 47 and CHECKLIST G15 and G16 require a terms page and a DPDP-shaped privacy policy ("what is collected, why, how to withdraw, grievance contact"). The site now collects email addresses on skreed.shop (section 5's sign-up and the quiz result's offer band, `server/lib/lead.php`), so the notice has to exist and be one press from each form.

## 2. What the notice says, and where each fact comes from

| Claim | Source |
|---|---|
| First name and email, and that the box was ticked | `leads.first_name` (required since the email codes of 2026-11-03), `email`, `consent` must be `yes` or no row is written |
| A six-digit code, kept only hashed, 10 minutes, and when the address was confirmed | `OTP_TTL` 600, `code_hash` (an HMAC of the code), `verified_at` |
| Quiz: shade, family, finish, personality, the other shades recommended, answers | `$keep` for `quiz`: `shadeId`, `familyId`, `finish`, `persona`, `answers`, the names, `also`, `alsoIds`, `shadeHref` |
| Sign-up: which platform pages were opened | `$keep` for `signup`: `follows` |
| A one-way scramble of the IP address, the browser's reported name and version, the time | `ip_hash` (SHA-256 of the address and a secret salt), `user_agent` (255 characters), `created_at` |
| No phone or payment details | the two forms send only the fields above |
| No cookies, no analytics or advertising trackers | no `document.cookie` anywhere in `src/`; the analytics events are queued on the window and nothing sends them (`src/scripts/quiz/track.ts`, `src/scripts/family/track.ts`) |
| Fonts, pictures and models from skreed.shop itself | every face self-hosted (`src/styles/fonts.css`); the CSP's `default-src 'self'` |
| Notes in the browser for this tab only | `sessionStorage` only (31 uses, no `localStorage`): the quiz's place and gate, the follows, Back to top |
| The code; once confirmed, a welcome (the quiz's with wallpapers), a November reminder and the launch email; a note to the team; nothing more to an unconfirmed address | `lead_confirmation`, `server/lib/mailing.php` (`reminder`, `launch`, verified addresses only), the `notify_to` mail on a verified lead |
| Abuse limit | 8 sends per scrambled address per 10 minutes, then 429 |
| Hostinger hosts, Zoho sends | the deploy (`scripts/deploy/hostinger.sh`), `smtp.zoho.in` |
| Withdraw by replying, or by writing to collab@skreed.in | a manual removal by the team: the emails of 2026-11-03 carry no unsubscribe link (section 6, item 10) |
| Skreed, Hyderabad, Telangana, India; collab@skreed.in | `SITE_COPY.org`, from the catalog (CHECKLIST G19) |

## 3. Decisions

D1. Two pages, `/privacy/` and `/terms/`, from one component (`src/components/legal/LegalPage.astro`) and one copy file (`src/config/legal.ts`), so the words live in config as the site's other copy does.

D2. The look is the brand's own, not About's exception: Pearl Whisper, Urban Slate, Poppins 700 for the headings in sentence case, Open Sans at `--fs-legal` for the prose (docs/brand/type-system.md names Open Sans for legal prose), one column at the left gutter capped at 38rem, links underlined, Ember Luxe for focus rings only. No box, no shadow, no radius, no swatch (rule 38 is read as not applying to legal pages, which show no product; flag if Sam reads it otherwise). The wordmark at the top left goes home, drawn from the sprite as /about/ draws it, so the pages ship no JavaScript.

D3. Each page ends with a hairline and two links: the other legal page and "Back to skreed.shop". The sitemap lists both.

D4. The link beside each form: "Privacy notice", next to the consent tick on section 5 (`#suConsentRow`, now a row holding the label and the link, so a press on the link never ticks the box) and after the quiz's fine print (`.qz-fine`, its words and the link as two decoded runs, so the link decodes with the rest of the band; the quiz suite's gift lines go from 7 to 8).

D5. Nothing is invented. Where the code does not state a fact, the copy either leaves it out (the legal entity, a named grievance officer, a fixed retention period, the courts) or states the plainest default the site already practises, marked in section 6 for Sam.

## 4. Acceptance criteria

1. `/privacy/` and `/terms/` build, answer 200 and carry their own `<title>` and meta description (G3, G4); both are in `sitemap.xml`.
2. The privacy notice covers what is collected, why, who handles it, how long, how to see, correct, erase and withdraw, and where to complain (G15).
3. Section 5's form and the quiz's offer band each show a "Privacy notice" link to `/privacy/` beside the consent, and pressing it does not tick the box.
4. No em or en dash, no emoji, no banned face; the pages load no script.
5. `npm run test:unit` and `npm run build` pass; frames at 390 and 1280 px, looked at.

## 5. Out of scope

A cookie notice (G17: the site sets no cookies, so none is needed while that holds), contest rules (no contest runs), and a footer on the landing page (the landing has none; the forms carry the link).

## 6. For Sam (and a lawyer) before these count as final

1. The legal entity: the pages say "Skreed, Hyderabad, Telangana, India". DPDP notices normally name the company that holds the data (the data fiduciary) and its registered address. What is the company's legal name and address?
2. The grievance contact: the pages send privacy questions and complaints to collab@skreed.in. Is that the right address, and should a named person be given (DPDP Rules expect a contact able to answer for the processing)?
3. Retention: "until you ask us to remove it, or until we no longer need it for the launch, whichever comes first" is a proposed default. A fixed period (for example, deletion a set number of months after launch) is clearer.
4. Under 18: the notice asks under-18s not to send the forms, because DPDP needs verifiable parental consent for children. Keep that, or change how the forms handle it?
5. Where the data is stored: Hostinger's and Zoho's data centres are not stated. If either is outside India, the notice should say so.
6. "If a change affects how we use your email, we tell you by email first": a promise; keep it?
7. The terms' launch offers: the terms say only that each offer's details come with it at launch. The discounts section 5 names ("5% OFF" to "UP TO 20% OFF") are its open question in `docs/specs/section-5-picture.md` 14; the terms should match whatever Sam decides there.
8. Courts: the terms name the laws of India only. Add "the courts at Hyderabad, Telangana" as the place for disputes?
9. A lawyer's read of both pages before the store opens.
10. Withdrawal: DPDP asks that consent be as easy to withdraw as to give. The emails (Sam's welcome, reminder and launch copy, since the email codes of 2026-11-03) carry no unsubscribe line or link, so today withdrawal is a reply or a mail to collab@skreed.in and a removal by hand. An unsubscribe link in each email, or at least a line saying "reply to stop", would match what the notice promises.
11. Unconfirmed addresses: a row is saved before the code is entered, and an address never confirmed stays in the table. A rule to delete those after a short time (a day, a week) would keep only what the notice needs.
