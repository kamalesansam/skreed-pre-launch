<?php
// The leads endpoint for skreed.shop on Hostinger: the quiz's offer band (/api/quiz-lead) and section 5's form
// (/api/signup) POST JSON here. One row per email and source in MySQL, a confirmation mail to the visitor and a note to
// the team, both by SMTP (Zoho). The status codes are the ones the page scripts read: 201 saved, 409 already saved,
// 422 bad email, 403 wrong origin, 429 too many, 400 bad request, 500 our fault. Config lives outside public_html.
declare(strict_types=1);

function lead_config(): array {
  static $c = null;
  if ($c === null) $c = require __DIR__ . '/../config.php';
  return $c;
}

function lead_db(): PDO {
  $c = lead_config();
  $pdo = new PDO($c['db_dsn'], $c['db_user'], $c['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
  return $pdo;
}

function lead_reply(int $code, array $body = []): never {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($body + ['ok' => $code < 300]);
  exit;
}

// a plain SMTP client over implicit TLS (port 465), AUTH LOGIN; returns true when the server queued the message
function lead_smtp(string $to, string $subject, string $text, ?string $replyTo = null): bool {
  $c = lead_config();
  $s = @stream_socket_client('ssl://' . $c['smtp_host'] . ':' . $c['smtp_port'], $errno, $err, 10);
  if (!$s) return false;
  stream_set_timeout($s, 10);
  $read = function () use ($s): string { $out = ''; while (($l = fgets($s, 515)) !== false) { $out .= $l; if (($l[3] ?? '') === ' ') break; } return $out; };
  $say = function (string $cmd, string $want) use ($s, $read): bool { if ($cmd !== '') fwrite($s, $cmd . "\r\n"); return str_starts_with($read(), $want); };
  $from = $c['mail_from'];
  $headers = [
    'Date: ' . date('r'),
    'From: ' . $c['mail_from_name'] . ' <' . $from . '>',
    'To: <' . $to . '>',
    'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($from, '@'), 1) . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  if ($replyTo) $headers[] = 'Reply-To: <' . $replyTo . '>';
  $data = implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($text));
  $ok = $say('', '220') && $say('EHLO skreed.shop', '250') && $say('AUTH LOGIN', '334')
    && $say(base64_encode($c['smtp_user']), '334') && $say(base64_encode($c['smtp_pass']), '235')
    && $say('MAIL FROM:<' . $from . '>', '250') && $say('RCPT TO:<' . $to . '>', '25')
    && $say('DATA', '354') && $say($data . "\r\n.", '250');
  fwrite($s, "QUIT\r\n");
  fclose($s);
  return $ok;
}

function lead_family_name(string $id): string {
  return ucwords(str_replace('-', ' ', preg_replace('/[^a-z-]/', '', $id)));
}

// the visitor's confirmation, by source; plain text, the brand's voice, no promise the site cannot keep
function lead_confirmation(string $source, array $f): array {
  $site = lead_config()['site_url'];
  if ($source === 'quiz') {
    $fam = lead_family_name($f['familyId'] ?? '');
    $body = "Thank you for taking the Skreed quiz.\n\n"
      . ($fam !== '' ? "Your shade comes from our {$fam} family. See it on the case: {$site}/shades/" . ($f['familyId'] ?? '') . "/\n\n" : '')
      . "We have saved this address for our launch on 15 November 2026. We will write when the store opens, with your launch offer.\n\n"
      . "colour is personal.\nSkreed\n\nDid not sign up, or want out? Reply to this email and we remove you.\n";
    return ['Your Skreed shade is saved', $body];
  }
  $body = "Thank you for signing up.\n\n"
    . "We have saved this address for our launch on 15 November 2026. We will write when the store opens, with your launch offer.\n\n"
    . "colour is personal.\nSkreed\n{$site}\n\nDid not sign up, or want out? Reply to this email and we remove you.\n";
  return ['You are on the Skreed list', $body];
}

function lead_handle(string $source): never {
  $c = lead_config();
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); lead_reply(405); }
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if (!in_array($origin, $c['origins'], true)) lead_reply(403);
  $raw = file_get_contents('php://input', false, null, 0, 4096);
  $in = json_decode((string) $raw, true);
  if (!is_array($in)) lead_reply(400);
  $email = strtolower(trim((string) ($in['email'] ?? '')));
  if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) lead_reply(422);

  $keep = $source === 'quiz' ? ['shadeId', 'familyId', 'finish', 'persona', 'answers', 'consent'] : ['follows', 'consent'];
  $fields = [];
  foreach ($keep as $k) if (isset($in[$k]) && is_scalar($in[$k])) $fields[$k] = substr((string) $in[$k], 0, 120);
  $ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . $c['ip_salt']);

  try {
    $db = lead_db();
    $q = $db->prepare('SELECT COUNT(*) FROM leads WHERE ip_hash = ? AND created_at > ?');
    $q->execute([$ipHash, gmdate('Y-m-d H:i:s', time() - 600)]);
    if ((int) $q->fetchColumn() >= 8) lead_reply(429);
    $ins = $db->prepare('INSERT INTO leads (email, source, fields, ip_hash, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    try {
      $ins->execute([$email, $source, json_encode($fields), $ipHash, substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255), gmdate('Y-m-d H:i:s')]);
    } catch (PDOException $e) {
      if ($e->getCode() !== '23000') throw $e;
      // already saved: keep the latest answers (the follows grow), say so
      $db->prepare('UPDATE leads SET fields = ?, updated_at = ? WHERE email = ? AND source = ?')
        ->execute([json_encode($fields), gmdate('Y-m-d H:i:s'), $email, $source]);
      lead_reply(409);
    }
    $id = (int) $db->lastInsertId();
    $total = (int) $db->query('SELECT COUNT(*) FROM leads')->fetchColumn();
  } catch (PDOException $e) {
    error_log('skreed lead: ' . $e->getMessage());
    lead_reply(500);
  }

  // answer the page first, then mail (the visitor never waits on SMTP)
  ignore_user_abort(true);
  http_response_code(201);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo '{"ok":true}';
  if (function_exists('fastcgi_finish_request')) fastcgi_finish_request(); else flush();

  [$subject, $text] = lead_confirmation($source, $fields);
  $sent = lead_smtp($email, $subject, $text, $c['reply_to'] ?? null);
  $note = "New {$source} lead #{$id}: {$email}\n\n" . json_encode($fields, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
    . "\n\nConfirmation mail: " . ($sent ? 'sent' : 'FAILED') . "\nLeads in total: {$total}\nAll leads: " . $c['site_url'] . "/api/leads\n";
  foreach ((array) $c['notify_to'] as $to) lead_smtp($to, "Skreed: new {$source} sign-up ({$total})", $note);
  try { lead_db()->prepare('UPDATE leads SET mail_sent = ? WHERE id = ?')->execute([$sent ? 1 : 0, $id]); } catch (PDOException) { /* the row stands */ }
  exit;
}
