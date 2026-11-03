<?php
// The leads endpoint for skreed.shop on Hostinger: the quiz's offer band (/api/quiz-lead) and section 5's form
// (/api/signup) POST JSON here. One row per email and source in MySQL, saved at once and marked verified when the visitor
// enters the six-digit code mailed to the address (/api/verify; Sam, 2026-11-03: "the emails are veified with an otp, so
// we actually know thats the right email of that person", his choices that day: both forms, save then mark verified, the
// code mail then the welcome mail). Mail by SMTP (Zoho). The status codes the page scripts read: on a save, 202 code
// sent, 409 already verified, 422 bad email, 429 too soon or too many (with `wait` in seconds), 502 the code mail failed;
// on a check, 200 verified, 422 wrong code (with `left`), 410 no live code (expired, used up or never sent: send a new
// one); on both, 403 wrong origin, 400 bad request, 500 our fault. Config lives outside public_html.
declare(strict_types=1);

const LEAD_SOURCES = ['signup', 'quiz'];
const OTP_TTL = 600;     // a code works for 10 minutes
const OTP_TRIES = 5;     // wrong entries before the code is spent
const OTP_GAP = 30;      // seconds between two codes to one address
const OTP_SENDS = 5;     // codes to one address in an hour
const UNCONFIRMED_TTL = 86400;   // an address never confirmed is deleted a day after its last code (docs/specs/legal-pages.md D7)

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
// $attach: [[file name shown, path on disk], ...], PNG files (the quiz email's wallpapers)
// $unsub: a mail to a visitor's list (the welcome, the reminder, the launch email): the unsubscribe line at its foot and the
// one-click headers (RFC 8058) mail clients show as their own Unsubscribe (docs/specs/legal-pages.md D6)
function lead_smtp(string $to, string $subject, string $text, ?string $replyTo = null, ?string $html = null, array $attach = [], bool $unsub = false): bool {
  $c = lead_config();
  lead_smtp_reply('');
  if ($unsub) {
    $page = lead_unsub_url($to);
    $text = rtrim($text) . "\n\nDon’t want these emails? Unsubscribe: {$page}\n";
    if ($html !== null) $html = str_replace('</div></body></html>', '<p style="margin:24px 0 0;font-size:13px;color:#383F43">Don’t want these emails? <a href="'
      . htmlspecialchars($page, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '" style="color:#383F43">Unsubscribe</a></p></div></body></html>', $html);
  }
  $s = @stream_socket_client('ssl://' . $c['smtp_host'] . ':' . $c['smtp_port'], $errno, $err, 10);
  if (!$s) { lead_smtp_reply("connect: {$err}"); return false; }
  stream_set_timeout($s, 10);
  $read = function () use ($s): string { $out = ''; while (($l = fgets($s, 515)) !== false) { $out .= $l; if (($l[3] ?? '') === ' ') break; } lead_smtp_reply(trim($out)); return $out; };
  // a TLS socket may take a long write in parts (the quiz email carries its wallpapers): written until all of it is out
  $write = function (string $d) use ($s): bool { for ($o = 0, $n = strlen($d); $o < $n; $o += $w) { $w = fwrite($s, substr($d, $o, 65536)); if (!$w) return false; } return true; };
  $say = function (string $cmd, string $want) use ($read, $write): bool { if ($cmd !== '' && !$write($cmd . "\r\n")) return false; return str_starts_with($read(), $want); };
  $from = $c['mail_from'];
  $headers = [
    'Date: ' . date('r'),
    'From: ' . $c['mail_from_name'] . ' <' . $from . '>',
    'To: <' . $to . '>',
    'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($from, '@'), 1) . '>',
    'MIME-Version: 1.0',
  ];
  if ($replyTo) $headers[] = 'Reply-To: <' . $replyTo . '>';
  if ($unsub) array_push($headers, 'List-Unsubscribe: <' . lead_unsub_api($to) . '>', 'List-Unsubscribe-Post: List-Unsubscribe=One-Click');
  if ($html === null) {
    array_push($headers, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64');
    $body = chunk_split(base64_encode($text));
  } else {   // the plain text and the HTML as alternatives: the mail client shows the richer one it can
    $b = 'skreed-' . bin2hex(random_bytes(8));
    $headers[] = 'Content-Type: multipart/alternative; boundary="' . $b . '"';
    $part = fn(string $type, string $s) => "--{$b}\r\nContent-Type: {$type}; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($s));
    $body = $part('text/plain', $text) . $part('text/html', $html) . "--{$b}--\r\n";
  }
  if ($attach && $html !== null) {   // the message and its files: the alternatives above become the mixed message's first part
    $m = 'skreed-m-' . bin2hex(random_bytes(8));
    $alt = array_pop($headers);   // Content-Type: multipart/alternative; boundary=...
    $body = $alt . "\r\n\r\n" . $body;
    $mixed = "--{$m}\r\n" . $body;
    foreach ($attach as [$fname, $path]) {
      $bytes = @file_get_contents($path);
      if ($bytes === false) continue;
      $fname = preg_replace('/[^A-Za-z0-9 ._-]/', '', $fname);
      $mixed .= "--{$m}\r\nContent-Type: image/png; name=\"{$fname}\"\r\nContent-Disposition: attachment; filename=\"{$fname}\"\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($bytes));
    }
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $m . '"';
    $body = $mixed . "--{$m}--\r\n";
  }
  $data = implode("\r\n", $headers) . "\r\n\r\n" . $body;
  $ok = $say('', '220') && $say('EHLO skreed.shop', '250') && $say('AUTH LOGIN', '334')
    && $say(base64_encode($c['smtp_user']), '334') && $say(base64_encode($c['smtp_pass']), '235')
    && $say('MAIL FROM:<' . $from . '>', '250') && $say('RCPT TO:<' . $to . '>', '25')
    && $say('DATA', '354') && $say($data . "\r\n.", '250');
  fwrite($s, "QUIT\r\n");
  fclose($s);
  return $ok;
}

/** the server's last reply in lead_smtp (set while it runs, read after it): what the mailing log records for a failed send */
function lead_smtp_reply(?string $set = null): string {
  static $last = '';
  if ($set !== null) $last = $set;
  return $last;
}

function lead_family_name(string $id): string {
  return ucwords(str_replace('-', ' ', preg_replace('/[^a-z-]/', '', $id)));
}

// The mails as blocks, so one source gives the plain text and the HTML: ['p', text] a paragraph, ['h', text] a bold line,
// ['ul', [items]] a list, ['sign'] the sign-off. In a text, **words** are bold and [words](url) a link.
function lead_mail_text(array $blocks): string {
  $out = [];
  foreach ($blocks as $bl) {
    if ($bl[0] === 'ul') { $out[] = implode("\n", array_map(fn($i) => '- ' . lead_plain($i), $bl[1])); continue; }
    if ($bl[0] === 'sign') { $out[] = "Team Skreed\nGo Beyond Basic"; continue; }
    $out[] = lead_plain($bl[1]);
  }
  return implode("\n\n", $out) . "\n";
}
/** visitor text placed in a block: the block syntax's own characters taken out, so a name cannot bold or link */
function lead_md(string $t): string { return str_replace(['*', '[', ']', '(', ')'], '', $t); }
function lead_plain(string $t): string {
  return str_replace('**', '', preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '$1 ($2)', $t));
}
function lead_inline(string $t): string {
  $t = htmlspecialchars($t, ENT_QUOTES | ENT_HTML5, 'UTF-8');
  $t = preg_replace('/\[([^\]]+)\]\(([^)\s]+)\)/', '<a href="$2" style="color:#383F43">$1</a>', $t);
  return preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $t);
}
function lead_mail_html(array $blocks): string {
  $p = 'margin:0 0 16px';
  $h = '<!doctype html><html><body style="margin:0;padding:24px 16px;background:#F7F6F3">'
    . '<div style="max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#383F43">';
  foreach ($blocks as $bl) {
    if ($bl[0] === 'ul') { $h .= '<ul style="' . $p . ';padding-left:20px">' . implode('', array_map(fn($i) => '<li>' . lead_inline($i) . '</li>', $bl[1])) . '</ul>'; continue; }
    if ($bl[0] === 'sign') { $h .= '<p style="' . $p . '"><strong>Team Skreed</strong><br>Go Beyond Basic</p>'; continue; }
    $h .= '<p style="' . $p . '">' . ($bl[0] === 'h' ? '<strong>' . lead_inline($bl[1]) . '</strong>' : lead_inline($bl[1])) . '</p>';
  }
  return $h . '</div></body></html>';
}

// The quiz email's wallpapers (Sam, 2026-11-03: "signature shade and 2 other will be plain, the rest 3 will be
// patterned"): the drawn shade and the next two of its group (in the group's order) as plain, the three after them as
// patterned; a shade without a file is passed over. From ~/skreed-api/wallpapers (scripts/quiz/prepare-wallpapers.mjs,
// never in git). Returns [[file name shown, path], ...], at most six.
function lead_wallpapers(array $f): array {
  $dir = __DIR__ . '/../wallpapers';
  $index = @json_decode((string) @file_get_contents($dir . '/index.json'), true);
  if (!is_array($index)) return [];
  $ids = array_merge([(string) ($f['shadeId'] ?? '')], explode(',', (string) ($f['alsoIds'] ?? '')));
  $ids = array_values(array_unique(array_filter($ids, fn($id) => preg_match('/^[a-z]+(-[a-z]+)*-\d{2}$/', $id) && isset($index[$id]))));
  $out = [];
  foreach (array_slice($ids, 0, 6) as $i => $id) {
    $kind = $i < 3 ? 'plain' : 'pattern';
    $path = "{$dir}/{$id}-{$kind}.png";
    if (is_file($path)) $out[] = ['Skreed ' . $index[$id] . ' wallpaper ' . ($kind === 'plain' ? 'plain' : 'pattern') . '.png', $path];
  }
  return $out;
}

// The visitor's mail once the address is verified: Sam's confirmed emails of 2026-11-03 ("these are the actual confirmed
// emails that we will be sending", his PDF "PRE-LAUNCH EMAILS", kept out of git for its discount codes), word for word, with the gaps filled: "[First Name]"
// is the form's first name (required); the quiz mail's copy of the results is the visitor's own result; the
// quiz's discount code comes from the server's config and the wallpapers from the server's folder (neither in git: the
// repository is public), and a paragraph whose code or files are not there is left out rather than sent empty. Returns
// [subject, text, html, attachments].
function lead_confirmation(string $source, array $f, string $name): array {
  $c = lead_config();
  $site = $c['site_url'];
  $follows = ['**5% off** for following us on Facebook', '**5% off** for following us on YouTube', '**10% off** for following us on Instagram'];
  if ($source === 'quiz') {
    $code = trim((string) ($c['quiz_code'] ?? ''));
    $walls = lead_wallpapers($f);
    $results = [];
    if (($f['shadeName'] ?? '') !== '') $results[] = 'Your Signature Shade: **' . $f['shadeName'] . '**' . (($f['familyName'] ?? '') !== '' ? ' (' . $f['familyName'] . ')' : '');
    if (($f['personaName'] ?? '') !== '') $results[] = 'Your colour personality: **' . $f['personaName'] . '**';
    if (($f['also'] ?? '') !== '') $results[] = 'We also recommend: ' . $f['also'];
    $href = (string) ($f['shadeHref'] ?? '');
    if (preg_match('#^/shades/[a-z-]+/(\?shade=\d{3})?$#', $href)) $results[] = '[See it on the case](' . $site . $href . ')';
    $blocks = [
      ['p', 'Hey ' . lead_md($name) . ','],
      ['h', 'Thanks for taking the Skreed Signature Shade Quiz!'],
      ['p', 'We’re sending you a copy of your results for future reference, so you can revisit your recommended shades and shop your favourites when we officially launch.'],
    ];
    if ($results) $blocks[] = ['ul', $results];
    if ($walls || $code !== '') $blocks[] = ['h', 'And a little something extra for you!'];
    if ($walls) $blocks[] = ['p', 'As a thank you for taking the quiz, we’re sending you a curated set of free phone wallpapers inspired by your Signature Shade results. They’re yours to download and keep, so you can carry a little more of your colour personality with you, wherever you go.'];
    if ($code !== '') {
      $blocks[] = ['p', ($walls ? 'And that’s not all! You also get an ' : 'You also get an ') . '**additional 5% OFF** your first purchase at launch with the code: **' . $code . '**'];
      $blocks[] = ['p', 'You can stack this with the discounts you unlock by following us on social media:'];
    } else {
      $blocks[] = ['p', 'You can unlock discounts by following us on social media:'];
    }
    $blocks[] = ['ul', ['**5% OFF** for following us on Facebook', '**5% OFF** for following us on YouTube', '**10% OFF** for following us on Instagram']];
    $blocks[] = ['p', 'Follow us on all three platforms to unlock 20% OFF your first order.' . ($code !== '' ? ' Plus, the extra 5% quiz reward takes your total potential savings to 25% OFF.' : '')];
    $blocks[] = ['p', 'We’ll verify your social media follows before sharing your discount codes on launch day, so make sure you’re following us on all three platforms. This is a launch-only offer, so make sure you’re following us on all three platforms before the big day!'];
    $blocks[] = ['h', 'A final thing before you go...'];
    $blocks[] = ['p', 'Your quiz results aren’t set in stone. Feel free to explore all 240 shades on our [pre-launch website](' . $site . ')...you might just find a new favourite!'];
    $blocks[] = ['p', 'Skreed officially launches in India on November 19. We can’t wait for you to shop your dream shade!'];
    $blocks[] = ['sign'];
    return ['Your Signature Shade + Surprise Reward!', lead_mail_text($blocks), lead_mail_html($blocks), $walls];
  }
  $blocks = [
    ['p', 'Hi ' . lead_md($name) . ','],
    ['p', 'You’re officially in!'],
    ['p', 'Thanks for joining us on our journey to go beyond basic and bring a little more colour to the world. We’re so glad to have you with us!'],
    ['p', 'SKREED is officially launching in India on **November 19**, and your **exclusive first-order discount** is waiting for you!'],
    ['p', 'Here’s how your discount adds up:'],
    ['ul', $follows],
    ['p', 'Follow us on all three platforms to unlock **20% OFF your first order**, and we’ll send you your discount code(s) on Launch Day after verifying your follows. This is a launch-only offer, so make sure you’re following us on all three platforms before the big day!'],
    ['p', 'In the meantime, feel free to explore our [pre-launch website](' . $site . ') and discover the colours, products and possibilities waiting for you.'],
    ['p', 'Have any questions about our collection? Just reply to this email.'],
    ['p', 'See you on November 19!'],
    ['sign'],
  ];
  return ['Skreed Is Coming to India! Save the Date.', lead_mail_text($blocks), lead_mail_html($blocks), []];
}

// the code mail: the code in the subject too, so a phone's notification shows it (our words; Sam's emails have none)
function lead_code_mail(string $code, string $name): array {
  $host = preg_replace('#^https?://#', '', lead_config()['site_url']);
  $blocks = [
    ['p', 'Hi ' . lead_md($name) . ','],
    ['p', 'Your Skreed confirmation code is **' . $code . '**.'],
    ['p', 'Enter it on ' . $host . ' to confirm this is your email. It works for 10 minutes.'],
    ['p', 'Did not ask for this? Ignore this email. Without the code, we never write to this address.'],
    ['sign'],
  ];
  return ["Your Skreed code: {$code}", lead_mail_text($blocks), lead_mail_html($blocks)];
}

/** a code's keyed hash: the code itself is never stored */
function lead_code_hash(string $email, string $source, string $code): string {
  return hash_hmac('sha256', "{$source}|{$email}|{$code}", lead_config()['ip_salt']);
}

/** the unsubscribe token for an address: keyed, so a link works for its own address only, and never expires */
function lead_unsub_token(string $email): string {
  return substr(hash_hmac('sha256', 'unsubscribe|' . strtolower($email), lead_config()['ip_salt']), 0, 32);
}
/** the page a person opens from the mail's line: it asks before anything is deleted, since mail scanners open links */
function lead_unsub_url(string $email): string {
  return lead_config()['site_url'] . '/unsubscribe/?e=' . rawurlencode(strtolower($email)) . '&t=' . lead_unsub_token($email);
}
/** the endpoint the one-click header posts to (RFC 8058) */
function lead_unsub_api(string $email): string {
  return lead_config()['site_url'] . '/api/unsubscribe?e=' . rawurlencode(strtolower($email)) . '&t=' . lead_unsub_token($email);
}

/** addresses never confirmed, a day after their last code: deleted (docs/specs/legal-pages.md D7); returns how many */
function lead_purge_unconfirmed(PDO $db): int {
  $q = $db->prepare('DELETE FROM leads WHERE verified_at IS NULL AND COALESCE(code_sent_at, created_at) < ?');
  $q->execute([lead_now(-UNCONFIRMED_TTL)]);
  return $q->rowCount();
}

// an unsubscribe: the address's rows (both forms) and its mailing records deleted, so nothing more goes to it and nothing
// of it is kept. POST only, so a link opened by a mail scanner changes nothing: the one-click header's form post
// (List-Unsubscribe=One-Click, the address and token in the query) or the page's JSON ({email, token}). 200 whether or not
// the address was on the list, 403 a token that is not the address's, 400 nothing to go on.
function lead_unsubscribe(): never {
  $c = lead_config();
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); lead_reply(405); }
  $raw = (string) file_get_contents('php://input', false, null, 0, 4096);
  $in = json_decode($raw, true);
  if (!is_array($in)) $in = [];
  $email = strtolower(trim((string) ($in['email'] ?? $_GET['e'] ?? '')));
  $token = (string) ($in['token'] ?? $_GET['t'] ?? '');
  if ($email === '' || $token === '' || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) lead_reply(400);
  if (!hash_equals(lead_unsub_token($email), $token)) lead_reply(403);
  try {
    $db = lead_db();
    $q = $db->prepare('DELETE FROM leads WHERE email = ?');
    $q->execute([$email]);
    $gone = $q->rowCount();
    $db->prepare('DELETE FROM lead_mailings WHERE email = ?')->execute([$email]);
  } catch (PDOException $e) {
    error_log('skreed unsubscribe: ' . $e->getMessage());
    lead_reply(500);
  }
  lead_reply_then(200);
  // the team hears of it, so a copy kept anywhere else (a spreadsheet, the store) can be removed too
  if ($gone > 0) foreach ((array) $c['notify_to'] as $to) lead_smtp($to, 'Skreed: unsubscribed', "{$email} unsubscribed. Their rows and mailing records were deleted from the leads database.\nRemove the address from any other list it was copied to.\n");
  exit;
}

function lead_now(int $offset = 0): string { return gmdate('Y-m-d H:i:s', time() + $offset); }
function lead_age(?string $utc): int { return $utc ? time() - (int) strtotime($utc . ' UTC') : PHP_INT_MAX; }

/** the request's JSON body, after the method and the origin; the email lower-cased and checked */
function lead_input(): array {
  $c = lead_config();
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); lead_reply(405); }
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if (!in_array($origin, $c['origins'], true)) lead_reply(403);
  $raw = file_get_contents('php://input', false, null, 0, 4096);
  $in = json_decode((string) $raw, true);
  if (!is_array($in)) lead_reply(400);
  $email = strtolower(trim((string) ($in['email'] ?? '')));
  if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) lead_reply(422);
  $in['email'] = $email;
  return $in;
}

/** the visitor's first name (required since 2026-11-03, Sam: "add a mandatory first name field"): control characters
 * dropped, spaces folded, 1 to 60 characters, else 422 with error "name". Nothing link-like: the name opens a mail to any
 * address typed beside it, so it must not carry a link or an address */
function lead_name(array $in): string {
  $n = trim(preg_replace('/\s+/u', ' ', preg_replace('/[\x00-\x1F\x7F]/u', '', (string) ($in['name'] ?? ''))) ?? '');
  $len = function_exists('mb_strlen') ? mb_strlen($n) : strlen($n);
  if ($len < 1 || $len > 60 || preg_match('/[<>@\/\\\\]|https?:|www\.|\.(com|in|net|org|io|co|xyz|ru|link|shop|info|me)\b/i', $n)) lead_reply(422, ['error' => 'name']);
  return $n;
}

/** answer the page now and keep running (the visitor never waits on the mail that follows) */
function lead_reply_then(int $code, array $body = []): void {
  ignore_user_abort(true);
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($body + ['ok' => true]);
  if (function_exists('fastcgi_finish_request')) fastcgi_finish_request(); else flush();
}

// a save: the row written (or its answers refreshed), a new code made and mailed; the page then asks for the code
function lead_handle(string $source): never {
  $c = lead_config();
  $in = lead_input();
  $email = $in['email'];
  if (($in['consent'] ?? '') !== 'yes') lead_reply(400, ['error' => 'consent']);   // DPDP: no row without the tick
  $name = lead_name($in);

  $keep = $source === 'quiz' ? ['shadeId', 'familyId', 'finish', 'persona', 'answers', 'shadeName', 'familyName', 'personaName', 'also', 'alsoIds', 'shadeHref', 'consent'] : ['follows', 'consent'];
  $fields = [];
  foreach ($keep as $k) if (isset($in[$k]) && is_scalar($in[$k])) { $v = preg_replace('/[\x00-\x1F\x7F]/', '', (string) $in[$k]); $fields[$k] = function_exists('mb_substr') ? mb_substr($v, 0, 160) : substr($v, 0, 160); }
  $ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . $c['ip_salt']);
  $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

  try {
    $db = lead_db();
    lead_purge_unconfirmed($db);
    // one address from one network: at most 8 different addresses sent a code in 10 minutes
    $q = $db->prepare('SELECT COUNT(*) FROM leads WHERE ip_hash = ? AND code_sent_at > ? AND NOT (email = ? AND source = ?)');
    $q->execute([$ipHash, lead_now(-600), $email, $source]);
    if ((int) $q->fetchColumn() >= 8) lead_reply(429, ['wait' => 600]);

    $q = $db->prepare('SELECT id, verified_at, code_sent_at, code_sends FROM leads WHERE email = ? AND source = ?');
    $q->execute([$email, $source]);
    $row = $q->fetch(PDO::FETCH_ASSOC) ?: null;
    if ($row && $row['verified_at']) {
      // verified before: keep the latest answers (the follows grow), say so, no new code
      $db->prepare('UPDATE leads SET first_name = ?, fields = ?, updated_at = ? WHERE id = ?')->execute([$name, json_encode($fields), lead_now(), $row['id']]);
      lead_reply(409);
    }
    $age = lead_age($row['code_sent_at'] ?? null);
    if ($age < OTP_GAP) lead_reply(429, ['wait' => OTP_GAP - $age]);
    $sends = $age < 3600 ? (int) $row['code_sends'] : 0;
    if ($sends >= OTP_SENDS) lead_reply(429, ['wait' => 3600 - $age]);

    $hash = lead_code_hash($email, $source, $code);
    if ($row) {
      $db->prepare('UPDATE leads SET first_name = ?, fields = ?, ip_hash = ?, user_agent = ?, code_hash = ?, code_expires = ?, code_tries = 0, code_sent_at = ?, code_sends = ?, updated_at = ? WHERE id = ?')
        ->execute([$name, json_encode($fields), $ipHash, substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255), $hash, lead_now(OTP_TTL), lead_now(), $sends + 1, lead_now(), $row['id']]);
      $id = (int) $row['id'];
    } else {
      $db->prepare('INSERT INTO leads (email, first_name, source, fields, ip_hash, user_agent, created_at, code_hash, code_expires, code_tries, code_sent_at, code_sends) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)')
        ->execute([$email, $name, $source, json_encode($fields), $ipHash, substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255), lead_now(), $hash, lead_now(OTP_TTL), lead_now()]);
      $id = (int) $db->lastInsertId();
    }
  } catch (PDOException $e) {
    error_log('skreed lead: ' . $e->getMessage());
    lead_reply(500);
  }

  // the code mail is the one the visitor waits on: sent before the answer, so a failure can be said
  [$subject, $text, $html] = lead_code_mail($code, $name);
  if (!lead_smtp($email, $subject, $text, $c['reply_to'] ?? null, $html)) {
    try {   // nothing was sent: no code stands and the send does not count against the gap
      $db->prepare('UPDATE leads SET code_hash = NULL, code_expires = NULL, code_sent_at = ?, code_sends = ? WHERE id = ?')
        ->execute([$row['code_sent_at'] ?? null, $sends, $id]);
    } catch (PDOException) { /* the code expires on its own */ }
    lead_reply(502);
  }
  lead_reply(202, ['verify' => true, 'ttl' => OTP_TTL, 'gap' => OTP_GAP]);
}

// a check: the code against the address's live code; right, the row is verified and the welcome mail and the team's
// note follow
function lead_verify(): never {
  $c = lead_config();
  $in = lead_input();
  $email = $in['email'];
  $source = (string) ($in['source'] ?? '');
  if (!in_array($source, LEAD_SOURCES, true)) lead_reply(400);
  $code = preg_replace('/\s+/', '', (string) ($in['code'] ?? ''));
  if (!preg_match('/^\d{6}$/', $code)) lead_reply(422, ['error' => 'format']);

  try {
    $db = lead_db();
    $db->beginTransaction();
    $q = $db->prepare('SELECT id, first_name, fields, verified_at, code_hash, code_expires, code_tries FROM leads WHERE email = ? AND source = ? FOR UPDATE');
    $q->execute([$email, $source]);
    $row = $q->fetch(PDO::FETCH_ASSOC) ?: null;
    if (!$row) { $db->rollBack(); lead_reply(410); }
    if ($row['verified_at']) { $db->rollBack(); lead_reply(200, ['already' => true]); }
    if (!$row['code_hash'] || lead_age($row['code_expires']) >= 0 || (int) $row['code_tries'] >= OTP_TRIES) { $db->rollBack(); lead_reply(410); }
    if (!hash_equals($row['code_hash'], lead_code_hash($email, $source, $code))) {
      $tries = (int) $row['code_tries'] + 1;
      $db->prepare('UPDATE leads SET code_tries = ?' . ($tries >= OTP_TRIES ? ', code_hash = NULL, code_expires = NULL' : '') . ' WHERE id = ?')->execute([$tries, $row['id']]);
      $db->commit();
      if ($tries >= OTP_TRIES) lead_reply(410, ['error' => 'tries']);
      lead_reply(422, ['left' => OTP_TRIES - $tries]);
    }
    $db->prepare('UPDATE leads SET verified_at = ?, code_hash = NULL, code_expires = NULL, updated_at = ? WHERE id = ?')->execute([lead_now(), lead_now(), $row['id']]);
    $db->commit();
    $total = (int) $db->query('SELECT COUNT(*) FROM leads WHERE verified_at IS NOT NULL')->fetchColumn();
  } catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('skreed verify: ' . $e->getMessage());
    lead_reply(500);
  }

  lead_reply_then(200);
  $id = (int) $row['id'];
  $fields = json_decode((string) $row['fields'], true) ?: [];
  [$subject, $text, $html, $files] = lead_confirmation($source, $fields, (string) $row['first_name']);
  $sent = lead_smtp($email, $subject, $text, $c['reply_to'] ?? null, $html, $files, true);
  $note = "New verified {$source} lead #{$id}: {$row['first_name']} <{$email}>\n\n" . json_encode($fields, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
    . "\n\nWelcome mail: " . ($sent ? 'sent' : 'FAILED') . "\nVerified leads in total: {$total}\nAll leads: " . $c['site_url'] . "/api/leads\n";
  foreach ((array) $c['notify_to'] as $to) lead_smtp($to, "Skreed: new {$source} sign-up ({$total})", $note);
  try { lead_db()->prepare('UPDATE leads SET mail_sent = ? WHERE id = ?')->execute([$sent ? 1 : 0, $id]); } catch (PDOException) { /* the row stands */ }
  exit;
}
