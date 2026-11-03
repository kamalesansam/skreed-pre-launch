<?php
// The dated mailings from the command line, in ~/skreed-api beside config.php (never in public_html). The hPanel cron job
// runs `php ~/skreed-api/mailing.php due` every 5 minutes; by hand:
//   php mailing.php due                    each mailing whose window is open, one batch
//   php mailing.php reminder|launch        that mailing, one batch, if its window is open
//   php mailing.php status                 the counts
//   ... --dry-run                          who the batch would go to; nothing sent or recorded
//   ... --test=<email> [--name=<first>]    the mailing to that one address now, window and cap ignored, nothing recorded
//   ... --at='YYYY-MM-DD HH:MM'            the clock for the window check (IST), for a rehearsal
// Exit 0 done, 1 a send failed, 2 the config or the arguments are wrong.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/lib/mailing.php';

$args = array_slice($argv, 1);
$opt = [];
$cmd = null;
foreach ($args as $a) {
  if (preg_match('/^--([a-z-]+)(?:=(.*))?$/s', $a, $m)) $opt[$m[1]] = $m[2] ?? true;
  elseif ($cmd === null) $cmd = $a;
  else { fwrite(STDERR, "one command only\n"); exit(2); }
}
$known = ['dry-run', 'test', 'name', 'at'];
if ($cmd === null || array_diff(array_keys($opt), $known) || !in_array($cmd, [...MAILINGS, 'due', 'status'], true)) {
  fwrite(STDERR, "usage: php mailing.php due|reminder|launch|status [--dry-run] [--test=<email> [--name=<first>]] [--at='YYYY-MM-DD HH:MM']\n");
  exit(2);
}

try {
  if ($cmd === 'status') { mailing_status(); exit(0); }

  if (isset($opt['test'])) {
    $to = strtolower(trim((string) $opt['test']));
    if ($cmd === 'due' || !filter_var($to, FILTER_VALIDATE_EMAIL)) { fwrite(STDERR, "--test needs reminder or launch and an email\n"); exit(2); }
    [$subject, $text, $html] = mailing_message($cmd, is_string($opt['name'] ?? null) ? $opt['name'] : 'Sam');
    $ok = lead_smtp($to, $subject, $text, lead_config()['reply_to'] ?? null, $html);
    mailing_log("{$cmd}: test to {$to} " . ($ok ? 'sent' : 'FAILED (' . lead_smtp_reply() . ')'));
    exit($ok ? 0 : 1);
  }

  $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata'));
  if (isset($opt['at'])) {
    $now = mailing_ist((string) $opt['at']);
    if (!$now) { fwrite(STDERR, "--at needs 'YYYY-MM-DD HH:MM'\n"); exit(2); }
  }

  // one run at a time: a cron run that finds the last one still sending leaves at once
  $lock = fopen(__DIR__ . '/mailing.lock', 'c');
  if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) { mailing_log('another run is still going, this one left'); exit(0); }

  $failed = 0;
  if ($cmd === 'due') {
    $open = array_filter(MAILINGS, function ($m) use ($now) { [$a, $b] = mailing_window($m); return $now >= $a && $now < $b; });
    foreach ($open as $m) $failed += mailing_run($m, $now, isset($opt['dry-run']));
    // nothing open: quiet, so the cron's every-5-minutes run writes no log outside the windows
  } else {
    $failed = mailing_run($cmd, $now, isset($opt['dry-run']));
  }
  exit($failed ? 1 : 0);
} catch (MailingConfigError $e) {
  mailing_log('config: ' . $e->getMessage() . ' (~/skreed-api/config.php), nothing sent');
  exit(2);
} catch (PDOException $e) {
  mailing_log('database: ' . $e->getMessage());
  exit(1);
}
