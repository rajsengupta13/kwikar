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

  $pdo->exec("CREATE TABLE IF NOT EXISTS kwikar_users (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    phone      VARCHAR(15)  NOT NULL UNIQUE,
    email      VARCHAR(150) NULL,
    address    TEXT         NULL,
    city       VARCHAR(80)  NULL,
    pincode    VARCHAR(6)   NULL,
    pin        VARCHAR(255) NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  // Migrate kwikar_users: add pin column if table predates it
  try { $pdo->exec("ALTER TABLE kwikar_users ADD COLUMN pin VARCHAR(255) NULL AFTER pincode"); } catch (PDOException $_) { /* exists */ }

  $pdo->exec("CREATE TABLE IF NOT EXISTS kwikar_bookings (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service           VARCHAR(80)  NOT NULL,
    issue             VARCHAR(200) NOT NULL,
    other_issue       TEXT         NULL,
    slot_time         VARCHAR(50)  NULL,
    slot_date         VARCHAR(50)  NULL,
    user_name         VARCHAR(100) NULL,
    user_phone        VARCHAR(15)  NOT NULL,
    profession        VARCHAR(100) NULL,
    full_address      TEXT         NULL,
    pincode           VARCHAR(6)   NULL,
    pincode_available TINYINT(1)   NOT NULL DEFAULT 0,
    status            ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
    technician_id     INT UNSIGNED NULL,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_phone (user_phone),
    INDEX idx_status     (status),
    INDEX idx_tech       (technician_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  // --- Migrate existing kwikar_bookings: add missing columns if table already existed ---
  $migrateBookings = [
    "ALTER TABLE kwikar_bookings ADD COLUMN user_name         VARCHAR(100) NULL         AFTER slot_date",
    "ALTER TABLE kwikar_bookings ADD COLUMN profession        VARCHAR(100) NULL         AFTER user_phone",
    "ALTER TABLE kwikar_bookings ADD COLUMN full_address      TEXT         NULL         AFTER profession",
    "ALTER TABLE kwikar_bookings ADD COLUMN pincode           VARCHAR(6)   NULL         AFTER full_address",
    "ALTER TABLE kwikar_bookings ADD COLUMN pincode_available TINYINT(1)   NOT NULL DEFAULT 0 AFTER pincode",
    "ALTER TABLE kwikar_bookings ADD COLUMN technician_id     INT UNSIGNED  NULL AFTER status",
    "ALTER TABLE kwikar_bookings ADD COLUMN technician_name   VARCHAR(100)  NULL AFTER technician_id",
    "ALTER TABLE kwikar_bookings ADD COLUMN technician_phone  VARCHAR(15)   NULL AFTER technician_name",
    "ALTER TABLE kwikar_bookings ADD COLUMN updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
  ];
  foreach ($migrateBookings as $sql) {
    try { $pdo->exec($sql); } catch (PDOException $_) { /* column already exists — skip */ }
  }

  $pdo->exec("CREATE TABLE IF NOT EXISTS customers (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id   INT UNSIGNED DEFAULT NULL,
    name         VARCHAR(100) NOT NULL DEFAULT '',
    phone        VARCHAR(15)  DEFAULT NULL,
    address      TEXT         DEFAULT NULL,
    rating       DECIMAL(3,2) DEFAULT 0.00,
    review_count INT UNSIGNED DEFAULT 0,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_booking (booking_id),
    INDEX idx_phone   (phone)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $pdo->exec("CREATE TABLE IF NOT EXISTS jobs (
    id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    technician_id INT UNSIGNED  NOT NULL DEFAULT 0,
    customer_id   INT UNSIGNED  NOT NULL,
    booking_id    INT UNSIGNED  DEFAULT NULL,
    title         VARCHAR(200)  NOT NULL DEFAULT '',
    service_type  VARCHAR(80)   DEFAULT NULL,
    description   TEXT          DEFAULT NULL,
    status        ENUM('new','ongoing','completed','cancelled') DEFAULT 'new',
    job_date      DATE          NOT NULL,
    start_time    TIME          DEFAULT NULL,
    amount        DECIMAL(10,2) DEFAULT 0.00,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tech     (technician_id),
    INDEX idx_customer (customer_id),
    INDEX idx_booking  (booking_id),
    INDEX idx_status   (status),
    INDEX idx_date     (job_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $pdo->exec("CREATE TABLE IF NOT EXISTS notifications (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    technician_id INT UNSIGNED NOT NULL DEFAULT 0,
    type          ENUM('job','earning','system') DEFAULT 'system',
    title         VARCHAR(150) NOT NULL DEFAULT '',
    message       TEXT         DEFAULT NULL,
    is_read       TINYINT(1)   DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tech    (technician_id),
    INDEX idx_read    (is_read),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $pdo->exec("CREATE TABLE IF NOT EXISTS kwikar_area_requests (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pincode       VARCHAR(6)   NOT NULL,
    user_name     VARCHAR(100) NULL,
    user_phone    VARCHAR(15)  NULL,
    profession    VARCHAR(100) NULL,
    wants_service TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pincode (pincode)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $pdo->exec("CREATE TABLE IF NOT EXISTS technicians (
    id                INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    full_name         VARCHAR(100)  NOT NULL,
    email             VARCHAR(150)  NOT NULL DEFAULT '',
    mobile            VARCHAR(15)   NOT NULL,
    password          VARCHAR(255)  DEFAULT NULL,
    profile_image     VARCHAR(255)  DEFAULT NULL,
    service_category  VARCHAR(100)  DEFAULT NULL,
    experience        VARCHAR(50)   DEFAULT NULL,
    city              VARCHAR(80)   DEFAULT NULL,
    pincodes          VARCHAR(200)  DEFAULT NULL,
    rating            DECIMAL(3,2)  DEFAULT 0.00,
    total_reviews     INT UNSIGNED  DEFAULT 0,
    is_verified       TINYINT(1)    DEFAULT 0,
    available_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_mobile (mobile),
    INDEX idx_mobile (mobile)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  return $pdo;
}
