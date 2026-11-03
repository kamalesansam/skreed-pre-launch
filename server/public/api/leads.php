<?php
// The team's view of the leads: HTTP basic auth (config's admin_user and admin_hash, a password_hash()), a table in the
// browser, every row marked verified or not (the email code), ?verified=1 for the verified ones only (the list to mail),
// ?format=csv for a file to import into Zoho Campaigns or Shopify's customer import. The password is config's
// admin_pass, in a file only the account can read.
declare(strict_types=1);
require dirname(__DIR__, 4) . '/skreed-api/lib/lead.php';   // /home/<user>/skreed-api, outside the site
$c = lead_config();
if (($_SERVER['PHP_AUTH_USER'] ?? '') !== $c['admin_user'] || strlen($c['admin_pass']) < 12 || !hash_equals($c['admin_pass'], (string) ($_SERVER['PHP_AUTH_PW'] ?? ''))) {
  header('WWW-Authenticate: Basic realm="Skreed leads"');
  lead_reply(401);
}
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
$only = ($_GET['verified'] ?? '') === '1';
$rows = lead_db()->query('SELECT id, first_name, email, source, fields, verified_at, mail_sent, created_at, updated_at FROM leads' . ($only ? ' WHERE verified_at IS NOT NULL' : '') . ' ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);
if (($_GET['format'] ?? '') === 'csv') {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="skreed-leads-' . gmdate('Y-m-d') . '.csv"');
  $out = fopen('php://output', 'w');
  fputcsv($out, ['id', 'first_name', 'email', 'source', 'fields', 'verified_at_utc', 'mail_sent', 'created_at_utc', 'updated_at_utc'], ',', '"', '');
  foreach ($rows as $r) fputcsv($out, $r, ',', '"', '');
  exit;
}
$h = fn($v) => htmlspecialchars((string) $v, ENT_QUOTES);
echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Skreed leads</title>';
$verified = count(array_filter($rows, fn($r) => $r['verified_at'] !== null));
$q = $only ? 'verified=1&' : '';
echo '<body style="font:14px system-ui;margin:16px;background:#F7F6F3;color:#383F43"><h1>Skreed leads: ' . count($rows) . ' (' . $verified . ' verified)</h1>';
echo '<p>' . ($only ? '<a href="?">All leads</a>' : '<a href="?verified=1">Verified only</a>') . ' · <a href="?' . $q . 'format=csv">Download CSV</a></p><table cellpadding="6" border="1" style="border-collapse:collapse">';
echo '<tr><th>#</th><th>First name</th><th>Email</th><th>Source</th><th>Answers</th><th>Verified (UTC)</th><th>Welcome mail</th><th>Saved (UTC)</th></tr>';
foreach ($rows as $r) echo '<tr><td>' . $h($r['id']) . '</td><td>' . $h($r['first_name']) . '</td><td>' . $h($r['email']) . '</td><td>' . $h($r['source']) . '</td><td>' . $h($r['fields']) . '</td><td>' . ($r['verified_at'] ? $h($r['verified_at']) : 'no') . '</td><td>' . ($r['mail_sent'] ? 'sent' : 'no') . '</td><td>' . $h($r['created_at']) . '</td></tr>';
echo '</table></body>';
