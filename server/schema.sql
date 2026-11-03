-- Run once in hPanel, Databases, phpMyAdmin, on the skreed leads database. A table made before the email codes
-- (2026-11-03) takes server/migrate-otp.sql instead.
CREATE TABLE IF NOT EXISTS leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  first_name VARCHAR(60) NOT NULL DEFAULT '',
  source VARCHAR(16) NOT NULL,
  fields TEXT NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  user_agent VARCHAR(255) NOT NULL DEFAULT '',
  mail_sent TINYINT(1) NOT NULL DEFAULT 0,
  verified_at DATETIME NULL,
  code_hash CHAR(64) NULL,
  code_expires DATETIME NULL,
  code_tries TINYINT UNSIGNED NOT NULL DEFAULT 0,
  code_sent_at DATETIME NULL,
  code_sends TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY email_source (email, source),
  KEY ip_time (ip_hash, created_at),
  KEY ip_code (ip_hash, code_sent_at)
) DEFAULT CHARSET = utf8mb4;
