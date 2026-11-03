-- The dated mailings (2026-11-03): run once in phpMyAdmin on the leads database, before the first run of
-- ~/skreed-api/mailing.php. One row per mailing and address, written before the mail goes, so a rerun never mails an
-- address twice (an address in both forms is one address). A new database gets the table from server/schema.sql.
CREATE TABLE IF NOT EXISTS lead_mailings (
  mailing VARCHAR(16) NOT NULL,
  email VARCHAR(254) NOT NULL,
  lead_id INT UNSIGNED NOT NULL,
  status VARCHAR(8) NOT NULL,          -- sending (claimed, mail under way), sent, failed (tried again on a later run)
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_reply VARCHAR(255) NOT NULL DEFAULT '',
  tried_at DATETIME NOT NULL,          -- UTC, as the leads table
  sent_at DATETIME NULL,
  PRIMARY KEY (mailing, email),
  KEY sent (sent_at)
) DEFAULT CHARSET = utf8mb4;
