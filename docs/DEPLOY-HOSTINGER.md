# Deploying the teaser on skreed.shop (Hostinger) with the lead forms on

Why the sign-up form was missing: Signup.astro and Quiz.astro render the email forms only when `PUBLIC_LEADS` is on, and the production build (`npm run build`, which Vercel runs) leaves it off because no endpoint existed. This deploy builds with `PUBLIC_LEADS=on` and ships the endpoint beside the site. Vercel's build is unchanged: its forms stay hidden, since it has no `/api`.

## The pieces
- `server/lib/lead.php`: `/api/signup` and `/api/quiz-lead`. Checks the Origin, validates the email, rate-limits by a salted IP hash, saves one row per email and source in MySQL, answers the page, then mails a confirmation to the visitor and a note to the team by Zoho SMTP.
- `server/public/api/leads.php`: `/api/leads`, the team's list behind a password, with `?format=csv` for Zoho Campaigns or Shopify's customer import before launch.
- `server/schema.sql`: the one table. `server/config.sample.php`: the settings, copied to the server as `skreed-api/config.php` and never committed.
- `scripts/deploy/htaccess.mjs`: `dist/_headers` (with the CSP) written again as `.htaccess` for LiteSpeed, plus the `/api` routes, HTTPS and the 404.
- `scripts/deploy/hostinger.sh` (`npm run deploy:hostinger`): build, convert, upload over SSH with rsync.

## One-time setup (hPanel, skreed.shop)
1. Advanced, SSH Access: enable SSH, note the IP, port and username, add this Mac's public key (`~/.ssh/id_ed25519.pub`).
2. Databases, MySQL Databases: create a database and user; open phpMyAdmin and run `server/schema.sql`.
3. Zoho: create an app-specific password for the sending mailbox (accounts.zoho.in, Security, App Passwords).
4. On the server: `mkdir -p ~/domains/skreed.shop/skreed-api`, then write `config.php` from the sample with the values above (chmod 600).
5. PHP 8.1 or newer (hPanel, Advanced, PHP Configuration).

## Each deploy
`SKREED_SSH=<user>@<ip> SKREED_SSH_PORT=<port> npm run deploy:hostinger`, then post a test email to the form and check `/api/leads`.

Still open: the site URL, canonical and sitemap name skreed.in (`src/config/site.ts`); no consent box on section 5 (DPDP); what the launch offer is.
