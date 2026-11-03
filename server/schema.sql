-- Run once in hPanel, Databases, phpMyAdmin, on the skreed leads database.
CREATE TABLE IF NOT EXISTS leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  source VARCHAR(16) NOT NULL,
  fields TEXT NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  user_agent VARCHAR(255) NOT NULL DEFAULT '',
  mail_sent TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY email_source (email, source),
  KEY ip_time (ip_hash, created_at)
) DEFAULT CHARSET = utf8mb4;
