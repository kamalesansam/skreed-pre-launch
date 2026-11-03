<?php
// The dated mailings: Sam's reminder of 18 November and his launch-day email (his confirmed "PRE-LAUNCH EMAILS", pages 3
// and 4, word for word), each to every verified address once, opening with the first name. Run by ~/skreed-api/mailing.php
// from an hPanel cron job: each run sends a small batch inside the mailing's window (IST, from the config), a few seconds
// apart and under a cap for any 24 hours (Zoho's sending limit), and records each address in lead_mailings before its mail
// goes, so a rerun or an overlapping run never mails an address twice. The codes and the shop link live in the server's
// config.php only: the repository is public.
declare(strict_types=1);

require_once __DIR__ . '/lead.php';

const MAILINGS = ['reminder', 'launch'];
const MAILING_TRIES = 3;           // sends to one address before it is left as failed
const MAILING_RETRY_AFTER = 900;   // seconds before a failed address is tried again
const MAILING_STOP_AFTER = 3;      // failures in a row that end a run (Zoho refusing: its limit, or the account held)

class MailingConfigError extends RuntimeException {}

/** the launch email's codes from the config, in Sam's order: [label, code] */
function mailing_codes(array $c): array {
  $codes = (array) ($c['launch_codes'] ?? []);
  $out = [];
  foreach (['facebook' => '5% OFF', 'youtube' => '5% OFF', 'instagram' => '10% OFF'] as $k => $label) {
    $code = trim((string) ($codes[$k] ?? ''));
    if (!preg_match('/^[A-Z0-9_-]{3,32}$/i', $code)) throw new MailingConfigError("launch_codes.{$k} is missing or malformed");
    $out[] = [$label, $code];
  }
  return $out;
}

function mailing_url(array $c, string $key): string {
  $u = trim((string) ($c[$key] ?? ''));
  if (!filter_var($u, FILTER_VALIDATE_URL) || !str_starts_with($u, 'https://') || preg_match('/[\s()\[\]*]/', $u)) throw new MailingConfigError("{$key} is missing or not an https link");
  return $u;
}

/** [subject, text, html] of a mailing for one first name; throws MailingConfigError when the config lacks what it needs */
function mailing_message(string $mailing, string $name): array {
  $c = lead_config();
  $site = mailing_url($c, 'site_url');
  $hey = 'Hey ' . ($name !== '' ? lead_md($name) : 'there') . ',';
  if ($mailing === 'reminder') {
    $blocks = [
      ['p', $hey],
      ['h', 'THE WAIT IS ALMOST OVER.'],
      ['p', 'Skreed officially launches in India tomorrow!'],
      ['p', '10 colour families. 240 shades. Endless ways to make your everyday tech feel more personal.'],
      ['p', 'Before we launch, here’s a reminder to secure your launch-day savings.'],
      ['p', 'You can unlock up to **20% OFF your first order** by following us on Instagram, Facebook and YouTube. We’ll verify your social media follows and share your eligible discount codes tomorrow, just in time for launch, so make sure you’re following us on all three platforms. This is a launch-only offer, so don’t miss out!'],
      ['p', 'And there’s still time to take our **Shade Diagnosis quiz** and earn an additional **5% OFF**. Head over to our [pre-launch website](' . $site . '), discover your signature shade and claim your extra discount. Today is your last chance!'],
      ['p', 'And while you’re there, take a final look at our collection! Explore all 240 shades, shortlist your favourites, and decide which ones you’re adding to your cart tomorrow.'],
      ['h', 'SEE YOU TOMORROW!'],
      ['sign'],
    ];
    return ['Last Chance to Unlock 25% OFF!', lead_mail_text($blocks), lead_mail_html($blocks)];
  }
  if ($mailing === 'launch') {
    $shop = mailing_url($c, 'shop_url');
    $codes = array_map(fn($lc) => '**' . $lc[0] . ' – ' . $lc[1] . '**', mailing_codes($c));
    $blocks = [
      ['p', $hey],
      ['h', 'IT’S OFFICIAL. SKREED IS LIVE IN INDIA!'],
      ['p', 'It’s finally time to bring colour back to your everyday tech essentials.'],
      ['p', '10 colour families. 240 shades. Zero reason to be basic.'],
      ['p', 'As promised, we’re sharing your exclusive discount codes for following us on social media. We hope you stick around to stay in the loop on new collections, more exclusive offers, and exciting updates across our social channels. There’s plenty more coming your way!'],
      ['ul', $codes],
      ['p', 'Stack all three codes to unlock **20% OFF your first order!** This launch offer is valid only till **November 30, 2026**, so make the most of it while you can.'],
      ['h', 'SO, WHAT ARE YOU WAITING FOR?'],
      ['p', 'Make the most of our exclusive launch offers while they last. Explore our collection, find your favourites, and give your everyday essentials a personality of their own.'],
      ['h', 'SHOP SKREED [HERE](' . $shop . ').'],
      ['p', 'And we have a little launch day surprise for iPhone users!'],
      ['p', 'The first **50 customers** to purchase an iPhone 17/18 Pro/Pro Max MagTough/Ultra phone case will receive a **FREE Lenskin worth ₹750!**'],
      ['p', 'Not familiar with Lenskin? It’s Skreed’s exclusive protective plate for your camera lens area, available in a range of colours and patterns. Pick one that complements your case, and it’s on us. Valid only for the first 50 eligible purchases, so shop early to claim yours!'],
      ['p', 'Thank you for being part of our journey so far and welcoming Skreed to India. We’re so glad to have you here with us.'],
      ['p', 'Here’s to a little more colour, a lot more personality, and never settling for basic.'],
      ['p', 'Happy shopping!'],
      ['sign'],
    ];
    return ['SKREED IS LIVE! Your Exclusive Discounts + A Surprise Freebie Awaits', lead_mail_text($blocks), lead_mail_html($blocks)];
  }
  throw new MailingConfigError("unknown mailing {$mailing}");
}

function mailing_ist(string $s): ?DateTimeImmutable {
  $d = DateTimeImmutable::createFromFormat('!Y-m-d H:i', trim($s), new DateTimeZone('Asia/Kolkata'));
  return $d ?: null;
}

/** the mailing's window from the config: [start, stop] in IST; throws when unset or backwards */
function mailing_window(string $mailing): array {
  $w = (array) (lead_config()['mailings'][$mailing] ?? []);
  $start = mailing_ist((string) ($w['start'] ?? ''));
  $stop = mailing_ist((string) ($w['stop'] ?? ''));
  if (!$start || !$stop || $stop <= $start) throw new MailingConfigError("mailings.{$mailing} needs start and stop as 'YYYY-MM-DD HH:MM' (IST), stop after start");
  return [$start, $stop];
}

/** the throttle from the config: [cap in any 24 hours, mails per run, seconds between two mails] */
function mailing_throttle(): array {
  $c = lead_config();
  $daily = (int) ($c['bulk_daily'] ?? 0);
  $run = (int) ($c['bulk_per_run'] ?? 0);
  $gap = (float) ($c['bulk_gap'] ?? -1);
  if ($daily < 1 || $run < 1 || $gap < 0) throw new MailingConfigError('bulk_daily, bulk_per_run and bulk_gap must be set (Zoho\'s limits)');
  return [$daily, $run, $gap];
}

function mailing_log(string $line): void {
  $line = gmdate('Y-m-d H:i:s') . 'Z ' . $line;
  echo $line, "\n";
  $dir = __DIR__ . '/../logs';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  @file_put_contents($dir . '/mailing.log', $line . "\n", FILE_APPEND | LOCK_EX);
}

/** the next addresses still owed the mailing: one per address (its latest verified row), none sent, under way, or
 * failed too often or too recently */
function mailing_due(PDO $db, string $mailing, int $limit): array {
  $q = $db->prepare('SELECT l.id, l.email, l.first_name FROM leads l
    JOIN (SELECT MAX(id) AS id FROM leads WHERE verified_at IS NOT NULL GROUP BY email) last ON last.id = l.id
    WHERE NOT EXISTS (SELECT 1 FROM lead_mailings m WHERE m.mailing = ? AND m.email = l.email
      AND NOT (m.status = \'failed\' AND m.attempts < ? AND m.tried_at < ?))
    ORDER BY l.id LIMIT ' . max(0, $limit));
  $q->execute([$mailing, MAILING_TRIES, lead_now(-MAILING_RETRY_AFTER)]);
  return $q->fetchAll(PDO::FETCH_ASSOC);
}

/** the address taken for this run, before its mail goes: a new row, or a failed one due again; false when another run has it */
function mailing_claim(PDO $db, string $mailing, array $r): bool {
  $q = $db->prepare('INSERT IGNORE INTO lead_mailings (mailing, email, lead_id, status, attempts, tried_at) VALUES (?, ?, ?, \'sending\', 1, ?)');
  $q->execute([$mailing, $r['email'], $r['id'], lead_now()]);
  if ($q->rowCount() === 1) return true;
  $q = $db->prepare('UPDATE lead_mailings SET status = \'sending\', attempts = attempts + 1, lead_id = ?, tried_at = ?
    WHERE mailing = ? AND email = ? AND status = \'failed\' AND attempts < ? AND tried_at < ?');
  $q->execute([$r['id'], lead_now(), $mailing, $r['email'], MAILING_TRIES, lead_now(-MAILING_RETRY_AFTER)]);
  return $q->rowCount() === 1;
}

/** sends in the last 24 hours, the failed ones too (Zoho may count them) */
function mailing_sent_today(PDO $db): int {
  $q = $db->prepare('SELECT COUNT(*) FROM lead_mailings WHERE tried_at > ?');
  $q->execute([lead_now(-86400)]);
  return (int) $q->fetchColumn();
}

/** one run of one mailing: returns the number of failures */
function mailing_run(string $mailing, DateTimeImmutable $now, bool $dry = false): int {
  [$start, $stop] = mailing_window($mailing);
  [$daily, $perRun, $gap] = mailing_throttle();
  mailing_message($mailing, 'Test');   // the config holds what the mail needs, before anything is claimed
  if ($now < $start || $now >= $stop) {
    mailing_log("{$mailing}: outside its window (" . $start->format('Y-m-d H:i') . ' to ' . $stop->format('Y-m-d H:i') . ' IST), nothing sent');
    return 0;
  }
  $db = lead_db();
  $room = min($perRun, $daily - mailing_sent_today($db));
  if ($room <= 0) { mailing_log("{$mailing}: the 24-hour cap of {$daily} is reached, nothing sent"); return 0; }
  $due = mailing_due($db, $mailing, $room);
  if (!$due) { mailing_log("{$mailing}: every verified address is done"); return 0; }
  if ($dry) {
    foreach ($due as $r) mailing_log("{$mailing}: would send to #{$r['id']} {$r['email']} ({$r['first_name']})");
    return 0;
  }
  $c = lead_config();
  $sent = $failed = $inRow = 0;
  foreach ($due as $i => $r) {
    if ($i > 0 && $gap > 0) usleep((int) ($gap * 1e6));
    if (!mailing_claim($db, $mailing, $r)) continue;   // another run took it
    [$subject, $text, $html] = mailing_message($mailing, (string) $r['first_name']);
    $ok = lead_smtp($r['email'], $subject, $text, $c['reply_to'] ?? null, $html);
    $reply = substr(preg_replace('/\s+/', ' ', lead_smtp_reply()), 0, 255);
    $db->prepare('UPDATE lead_mailings SET status = ?, last_reply = ?, sent_at = ? WHERE mailing = ? AND email = ?')
      ->execute([$ok ? 'sent' : 'failed', $reply, $ok ? lead_now() : null, $mailing, $r['email']]);
    mailing_log("{$mailing}: " . ($ok ? 'sent' : 'FAILED') . " #{$r['id']} {$r['email']}" . ($ok ? '' : " ({$reply})"));
    if ($ok) { $sent++; $inRow = 0; continue; }
    $failed++;
    if (++$inRow >= MAILING_STOP_AFTER) { mailing_log("{$mailing}: {$inRow} failures in a row, run stopped"); break; }
  }
  mailing_log("{$mailing}: run done, {$sent} sent, {$failed} failed");
  return $failed;
}

/** the counts of each mailing, for `status` */
function mailing_status(): void {
  $db = lead_db();
  $verified = (int) $db->query('SELECT COUNT(DISTINCT email) FROM leads WHERE verified_at IS NOT NULL')->fetchColumn();
  echo "Verified addresses: {$verified}\nSends in the last 24 hours: " . mailing_sent_today($db) . "\n";
  foreach (MAILINGS as $m) {
    $q = $db->prepare('SELECT status, COUNT(*) FROM lead_mailings WHERE mailing = ? GROUP BY status');
    $q->execute([$m]);
    $by = $q->fetchAll(PDO::FETCH_KEY_PAIR) + ['sent' => 0, 'failed' => 0, 'sending' => 0];
    try { [$a, $b] = mailing_window($m); $w = $a->format('Y-m-d H:i') . ' to ' . $b->format('Y-m-d H:i') . ' IST'; }
    catch (MailingConfigError) { $w = 'not set'; }
    echo "{$m} ({$w}): {$by['sent']} sent, {$by['failed']} failed, {$by['sending']} under way or stuck, "
      . max(0, $verified - $by['sent']) . " still to send\n";
  }
}
