-- The email codes and the first name (2026-11-03): run once in phpMyAdmin on a leads table made from the first schema.sql. Rows saved
-- before it stay unverified (verified_at NULL); mail_sent now means the welcome mail, sent once an address is verified.
ALTER TABLE leads
  ADD COLUMN first_name VARCHAR(60) NOT NULL DEFAULT '' AFTER email,
  ADD COLUMN verified_at DATETIME NULL AFTER mail_sent,
  ADD COLUMN code_hash CHAR(64) NULL AFTER verified_at,
  ADD COLUMN code_expires DATETIME NULL AFTER code_hash,
  ADD COLUMN code_tries TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER code_expires,
  ADD COLUMN code_sent_at DATETIME NULL AFTER code_tries,
  ADD COLUMN code_sends TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER code_sent_at,
  ADD KEY ip_code (ip_hash, code_sent_at);
