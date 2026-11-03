# Deploying the teaser on skreed.shop (Hostinger) with the lead forms on

Why the sign-up form was missing: Signup.astro and Quiz.astro render the email forms only when `PUBLIC_LEADS` is on, and the production build (`npm run build`, which Vercel runs) leaves it off because no endpoint existed. This deploy builds with `PUBLIC_LEADS=on` and ships the endpoint beside the site. Vercel's build is unchanged: its forms stay hidden, since it has no `/api`.

## The pieces
- `server/lib/lead.php`: `/api/signup` and `/api/quiz-lead`. Checks the Origin, validates the email, rate-limits by a salted IP hash, saves one row per email and source in MySQL, answers the page, then mails a confirmation to the visitor and a note to the team by Zoho SMTP.
- `server/public/api/leads.php`: `/api/leads`, the team's list behind a password, with `?format=csv` for Zoho Campaigns or Shopify's customer import before launch.
- `server/schema.sql`: the one table. `server/config.sample.php`: the settings, copied to the server as `skreed-api/config.php` and never committed.
- `scripts/deploy/htaccess.mjs`: `dist/_headers` (with the CSP) written again as `.htaccess` for LiteSpeed, plus the `/api` routes, HTTPS and the 404.
- `scripts/deploy/hostinger.sh` (`npm run deploy:hostinger`): build, convert, upload over SSH with rsync.

## The email code, the first name and the emails (2026-11-03)
Sam: "the emails are veified with an otp, so we actually know thats the right email of that person"; his choices that day: both forms, every address saved and marked verified when its code is entered, the code mail then the welcome mail, a required first name, and his confirmed emails ("PRE-LAUNCH EMAILS", his PDF, kept out of git for its discount codes) as the welcome mails.
- A save (`/api/signup`, `/api/quiz-lead`) needs `name` and answers 202: a six-digit code is mailed (10 minutes, 5 tries, 30 s between codes, 5 an hour). `/api/verify` checks it (200, 422 with the tries left, 410 for a new code); only then go the welcome mail and the team's note. Only the code's keyed hash is stored.
- The welcome mails are Sam's sign-up and quiz emails word for word, plain text and HTML, opening with the first name. The quiz email carries the visitor's result and six of Sam's wallpapers (the drawn shade and the next two of its group plain, the three after them patterned, about 0.6 MB).
- `/api/leads` shows the first name and when each address was verified; `?verified=1` lists only those (the list to mail).
- The Nov 18 reminder and the launch-day email are not built: they go to the whole verified list on a date, a separate piece of work.

Before the deploy that carries this:
1. phpMyAdmin: run `server/migrate-otp.sql` once on the leads table (a new database takes `server/schema.sql`).
2. `~/skreed-api/config.php`: add `'quiz_code' => '<the quiz email's 5% code>',` (empty leaves that paragraph out of the quiz email).
3. On the deploying machine: `node scripts/quiz/prepare-wallpapers.mjs "<the unzipped Quiz Wallpapers folder>"` fills the git-ignored `server/wallpapers/`, which the deploy uploads to `~/skreed-api/wallpapers/`. Without it the quiz email goes without wallpapers or their paragraph.

## One-time setup (hPanel, skreed.shop)
1. Advanced, SSH Access: enable SSH, note the IP, port and username, add this Mac's public key (`~/.ssh/id_ed25519.pub`).
2. Databases, MySQL Databases: create a database and user; open phpMyAdmin and run `server/schema.sql`.
3. Zoho: create an app-specific password for partner@skreed.info, the sending mailbox (accounts.zoho.in, Security, App Passwords).
4. On the server, `~/skreed-api/config.php` (made by the first deploy from the sample, chmod 600): fill in the database, Zoho and admin passwords, in hPanel's File Manager.
5. PHP 8.1 or newer (hPanel, Advanced, PHP Configuration).

## Each deploy
`npm run deploy:hostinger` (the account and key are the defaults), then post a test email to the form and check `/api/leads`.

Still open: what the launch offer is (Sam will send it). skreed.in forwarding to skreed.shop is set at Name.com, outside this repository.
