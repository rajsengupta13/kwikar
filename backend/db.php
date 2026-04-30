<?php
/**
 * MySQL connection helper.
 *
 * Auto-creates the database and required tables on first connect, so on
 * a fresh XAMPP install you don't need to run any SQL manually — just
 * make sure MySQL is running in the XAMPP control panel.
 *
 * Credentials live in backend/config.php (default XAMPP: root / empty password).
 */

function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;

  $cfg = require __DIR__ . '/config.php';
  $d = $cfg['db'];

  $opts = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
  ];

  // Step 1 — connect to server (no DB) and ensure the DB exists.
  $serverDsn = "mysql:host={$d['host']};port={$d['port']};charset={$d['charset']}";
  $serverPdo = new PDO($serverDsn, $d['user'], $d['pass'], $opts);
  $serverPdo->exec("CREATE DATABASE IF NOT EXISTS `{$d['name']}` DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci");

  // Step 2 — connect with the DB selected.
  $dsn = "mysql:host={$d['host']};port={$d['port']};dbname={$d['name']};charset={$d['charset']}";
  $pdo = new PDO($dsn, $d['user'], $d['pass'], $opts);

  // Step 3 — ensure required tables.
  $pdo->exec("CREATE TABLE IF NOT EXISTS visits (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pincode     VARCHAR(6)   NOT NULL,
    area        VARCHAR(120) NULL,
    available   TINYINT(1)   NOT NULL DEFAULT 0,
    ip          VARCHAR(45)  NULL,
    user_agent  TEXT         NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pincode (pincode),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  return $pdo;
}
