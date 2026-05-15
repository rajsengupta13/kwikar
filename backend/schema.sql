-- ============================================================
-- KWIKAR — Fresh Database Schema
-- Run this in phpMyAdmin → SQL tab
-- ============================================================

CREATE DATABASE IF NOT EXISTS `kwikar`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `kwikar`;

-- ── Step 1: Drop old tables (safe) ──────────────────────────
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS bank_details;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS area_feedback;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS user_professions;
DROP TABLE IF EXISTS professions;
DROP TABLE IF EXISTS user_pincodes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS technicians;
DROP TABLE IF EXISTS kwikar_area_requests;
DROP TABLE IF EXISTS kwikar_bookings;
DROP TABLE IF EXISTS kwikar_users;
DROP TABLE IF EXISTS visits;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- CUSTOMER TABLES
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
-- Har customer ka ek unique user_id milega.
-- phone se login hoga (unique).
-- pin hashed 4-digit — registration ya booking confirm pe set hoga.
CREATE TABLE users (
  user_id    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)  NOT NULL,
  phone      VARCHAR(15)   NOT NULL,
  email      VARCHAR(150)  NULL,
  address    TEXT          NULL,
  city       VARCHAR(80)   NULL,
  pin        VARCHAR(255)  NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY  uq_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── USER_PINCODES ─────────────────────────────────────────────
-- Tracks which user is from which pincode.
-- user_id = NULL  →  anonymous visit (before registration).
--
-- Same pincode, multiple users:
--   pincode | user_id        (multiple rows, same pincode)
--   812001  | 3
--   812001  | 7
--   812001  | 12
--
-- UNIQUE(user_id, pincode) → ek user ek pincode sirf ek baar.
CREATE TABLE user_pincodes (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  pincode    VARCHAR(6)    NOT NULL,
  user_id    INT UNSIGNED  NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY  uq_user_pin (user_id, pincode),
  INDEX       idx_pincode (pincode),
  INDEX       idx_user    (user_id),
  CONSTRAINT  fk_up_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── PROFESSIONS ───────────────────────────────────────────────
-- Lookup table — har profession sirf ONCE store hogi.
-- "Electrician" 1000 users ke liye bhi sirf 1 row.
CREATE TABLE professions (
  profession_id INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL,
  PRIMARY KEY   (profession_id),
  UNIQUE KEY    uq_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── USER_PROFESSIONS ──────────────────────────────────────────
-- Junction table — user aur profession ke beech link.
-- UNIQUE(user_id) → ek user ka ek profession (change ho sakta hai).
-- Same profession ke multiple users:
--   user_id | profession_id
--   1       | 1              ← User 1 = Electrician
--   3       | 1              ← User 3 = Electrician (same profession_id reuse)
--   5       | 2              ← User 5 = Plumber
CREATE TABLE user_professions (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED  NOT NULL,
  profession_id INT UNSIGNED  NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY   (id),
  UNIQUE KEY    uq_user (user_id),
  INDEX         idx_prof (profession_id),
  CONSTRAINT    fk_uprof_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT    fk_uprof_prof
    FOREIGN KEY (profession_id)
    REFERENCES professions (profession_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TECHNICIAN TABLE (before bookings — FK needed)
-- ============================================================

CREATE TABLE technicians (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name         VARCHAR(100)  NOT NULL,
  email             VARCHAR(150)  NOT NULL DEFAULT '',
  mobile            VARCHAR(15)   NOT NULL,
  password          VARCHAR(255)  NULL,
  profile_image     VARCHAR(255)  NULL,
  service_category  VARCHAR(100)  NULL,
  experience        VARCHAR(50)   NULL,
  city              VARCHAR(80)   NULL,
  pincodes          VARCHAR(200)  NULL,
  rating            DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
  total_reviews     INT UNSIGNED  NOT NULL DEFAULT 0,
  is_verified       TINYINT(1)    NOT NULL DEFAULT 0,
  available_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY  uq_mobile (mobile),
  INDEX       idx_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- BOOKING TABLES
-- ============================================================

-- ── BOOKINGS ──────────────────────────────────────────────────
-- Central booking record.
-- user_id     = NULL  → guest (fill hoga jab PIN set ho).
-- profession_id FK    → professions table.
-- technician_id FK    → technicians table (jab accept kare).
CREATE TABLE bookings (
  booking_id    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED  NULL,
  service       VARCHAR(80)   NOT NULL,
  issue         VARCHAR(200)  NOT NULL,
  other_issue   TEXT          NULL,
  slot_date     DATE          NULL,
  slot_time     VARCHAR(50)   NULL,
  name          VARCHAR(100)  NULL,
  phone         VARCHAR(15)   NOT NULL,
  address       TEXT          NULL,
  pincode       VARCHAR(6)    NULL,
  profession_id INT UNSIGNED  NULL,
  status        ENUM('pending','confirmed','completed','cancelled')
                NOT NULL DEFAULT 'pending',
  technician_id INT UNSIGNED  NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY   (booking_id),
  INDEX         idx_user    (user_id),
  INDEX         idx_phone   (phone),
  INDEX         idx_pincode (pincode),
  INDEX         idx_status  (status),
  INDEX         idx_date    (slot_date),
  CONSTRAINT    fk_bk_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT    fk_bk_prof
    FOREIGN KEY (profession_id)
    REFERENCES professions (profession_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT    fk_bk_tech
    FOREIGN KEY (technician_id)
    REFERENCES technicians (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── AREA_FEEDBACK ─────────────────────────────────────────────
-- Non-serviceable pincodes ka interest track karta hai.
CREATE TABLE area_feedback (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  pincode       VARCHAR(6)    NOT NULL,
  user_id       INT UNSIGNED  NULL,
  name          VARCHAR(100)  NULL,
  phone         VARCHAR(15)   NULL,
  wants_service TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY   (id),
  INDEX         idx_pincode (pincode),
  CONSTRAINT    fk_af_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TECHNICIAN PANEL TABLES
-- ============================================================

-- ── CUSTOMERS ─────────────────────────────────────────────────
-- Technician panel ke liye customer copy.
-- booking_id aur user_id dono FK hain.
CREATE TABLE customers (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  booking_id INT UNSIGNED  NULL,
  user_id    INT UNSIGNED  NULL,
  name       VARCHAR(100)  NOT NULL DEFAULT '',
  phone      VARCHAR(15)   NULL,
  address    TEXT          NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX       idx_booking (booking_id),
  INDEX       idx_user    (user_id),
  INDEX       idx_phone   (phone),
  CONSTRAINT  fk_cust_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings (booking_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT  fk_cust_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── JOBS ──────────────────────────────────────────────────────
-- technician_id = 0  → unassigned (koi bhi le sakta hai).
-- booking_id FK      → bookings table.
CREATE TABLE jobs (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  technician_id INT UNSIGNED  NOT NULL DEFAULT 0,
  customer_id   INT UNSIGNED  NOT NULL,
  booking_id    INT UNSIGNED  NULL,
  title         VARCHAR(200)  NOT NULL DEFAULT '',
  service_type  VARCHAR(80)   NULL,
  description   TEXT          NULL,
  amount        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status        ENUM('new','ongoing','completed','cancelled') NOT NULL DEFAULT 'new',
  job_date      DATE          NOT NULL,
  start_time    TIME          NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY   (id),
  INDEX         idx_tech     (technician_id),
  INDEX         idx_customer (customer_id),
  INDEX         idx_booking  (booking_id),
  INDEX         idx_status   (status),
  INDEX         idx_date     (job_date),
  CONSTRAINT    fk_job_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings (booking_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── NOTIFICATIONS ─────────────────────────────────────────────
-- technician_id = 0  → broadcast to all technicians.
CREATE TABLE notifications (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  technician_id INT UNSIGNED  NOT NULL DEFAULT 0,
  type          ENUM('job','earning','system') NOT NULL DEFAULT 'system',
  title         VARCHAR(150)  NOT NULL DEFAULT '',
  message       TEXT          NULL,
  is_read       TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY   (id),
  INDEX         idx_tech    (technician_id),
  INDEX         idx_read    (is_read),
  INDEX         idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── TRANSACTIONS ──────────────────────────────────────────────
CREATE TABLE transactions (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  transaction_id   VARCHAR(30)   NOT NULL DEFAULT '',
  technician_id    INT UNSIGNED  NOT NULL,
  type             ENUM('credit','debit') NOT NULL DEFAULT 'credit',
  description      VARCHAR(255)  NULL,
  amount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance_after    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status           ENUM('pending','paid_out','failed') NOT NULL DEFAULT 'pending',
  transaction_date TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY      (id),
  INDEX            idx_tech (technician_id),
  INDEX            idx_date (transaction_date),
  CONSTRAINT       fk_txn_tech
    FOREIGN KEY (technician_id)
    REFERENCES technicians (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── BANK_DETAILS ──────────────────────────────────────────────
CREATE TABLE bank_details (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  technician_id    INT UNSIGNED  NOT NULL,
  account_holder   VARCHAR(100)  NULL,
  account_number   VARCHAR(30)   NULL,
  ifsc_code        VARCHAR(15)   NULL,
  bank_name        VARCHAR(100)  NULL,
  upi_id           VARCHAR(100)  NULL,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY      (id),
  UNIQUE KEY       uq_tech (technician_id),
  CONSTRAINT       fk_bank_tech
    FOREIGN KEY (technician_id)
    REFERENCES technicians (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── USER_SETTINGS (technician app settings) ───────────────────
CREATE TABLE user_settings (
  id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  technician_id         INT UNSIGNED  NOT NULL,
  language              VARCHAR(20)   NOT NULL DEFAULT 'English',
  app_theme             VARCHAR(20)   NOT NULL DEFAULT 'Light',
  offline_mode          TINYINT(1)    NOT NULL DEFAULT 0,
  auto_logout           INT           NOT NULL DEFAULT 30,
  two_step_verification TINYINT(1)    NOT NULL DEFAULT 0,
  updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY           (id),
  UNIQUE KEY            uq_tech (technician_id),
  CONSTRAINT            fk_sets_tech
    FOREIGN KEY (technician_id)
    REFERENCES technicians (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── SUPPORT_TICKETS ───────────────────────────────────────────
CREATE TABLE support_tickets (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  ticket_id     VARCHAR(15)   NOT NULL DEFAULT '',
  technician_id INT UNSIGNED  NOT NULL,
  subject       VARCHAR(200)  NOT NULL DEFAULT '',
  description   TEXT          NULL,
  status        ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY   (id),
  INDEX         idx_tech   (technician_id),
  INDEX         idx_status (status),
  CONSTRAINT    fk_tkt_tech
    FOREIGN KEY (technician_id)
    REFERENCES technicians (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DONE — 13 tables created with proper FK constraints
-- ============================================================
