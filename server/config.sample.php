<?php
// Copy to ~/domains/skreed.shop/skreed-api/config.php on the server (never into git, never into public_html) and fill in.
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
  // /api/leads: the user name and a hash made by: php -r 'echo password_hash("your password", PASSWORD_DEFAULT);'
  'admin_user' => 'skreed',
  'admin_hash' => 'CHANGE-ME',
  // any long random string: the IP is stored only as a salted hash, for the rate limit
  'ip_salt' => 'CHANGE-ME',
];
