<?php
// Copy to ~/skreed-api/config.php on the server (chmod 600) (never into git, never into public_html) and fill in.
return [
  'site_url' => 'https://skreed.shop',
  'origins' => ['https://skreed.shop', 'https://www.skreed.shop'],
  // hPanel, Databases, MySQL Databases: the database, its user and password (host is localhost on Hostinger)
  'db_dsn' => 'mysql:host=localhost;dbname=u918474217_skreed;charset=utf8mb4',
  'db_user' => 'u918474217_skreed',
  'db_pass' => 'CHANGE-ME',
  // Zoho Mail SMTP (India data centre): partner@skreed.info and an app-specific password from accounts.zoho.in, Security
  'smtp_host' => 'smtp.zoho.in',
  'smtp_port' => 465,
  'smtp_user' => 'partner@skreed.info',
  'smtp_pass' => 'CHANGE-ME',
  'mail_from' => 'partner@skreed.info',
  'mail_from_name' => 'Skreed',
  'reply_to' => 'partner@skreed.info',
  // who hears about each new sign-up
  'notify_to' => ['partner@skreed.info'],
  // /api/leads: the user name and a password of 12 characters or more
  'admin_user' => 'skreed',
  'admin_pass' => 'CHANGE-ME',
  // the quiz email's 5% code (Sam's confirmed email of 2026-11-03); here only, never in git: the repository is public.
  // Empty, the email leaves that paragraph out
  'quiz_code' => '',
  // the dated mailings (mailing.php, run by the cron job): each one's window in IST as 'YYYY-MM-DD HH:MM'; the runs
  // inside it mail every verified address once. Sam's choices of 2026-11-03: the reminder 08:00 to 14:00 on 18 November,
  // the launch email from 10:00 on 19 November to the end of the 21st
  'mailings' => [
    'reminder' => ['start' => '2026-11-18 08:00', 'stop' => '2026-11-18 14:00'],
    'launch' => ['start' => '2026-11-19 10:00', 'stop' => '2026-11-21 23:59'],
  ],
  // the launch email's codes, here only, never in git: the repository is public; and its "SHOP SKREED HERE." link
  'launch_codes' => ['facebook' => '', 'youtube' => '', 'instagram' => ''],
  'shop_url' => 'https://www.skreed.in/',   // the PDF's own link, Sam's choice
  // Zoho's sending limit: the mailings' sends in any 24 hours (leave room under the account's daily limit for the codes
  // and welcome mails), mails per cron run, seconds between two mails; Sam's choice: 300 a day
  'bulk_daily' => 300,
  'bulk_per_run' => 30,
  'bulk_gap' => 5,
  // any long random string: the IP is stored only as a salted hash, for the rate limit (and the email codes' key)
  'ip_salt' => 'CHANGE-ME',
];
