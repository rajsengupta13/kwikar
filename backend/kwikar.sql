-- ═══════════════════════════════════════════════════════════════
--  Kwikar — Complete Clean Database
--  Database  : kwikar
--  Covers    : User side · Booking side · Technician panel
--
--  HOW TO USE:
--  1. Open phpMyAdmin → SQL tab
--  2. Paste this entire file and click Go
--  3. Done — all tables are created fresh
--
--  NOTE: This DROPS and RECREATES the kwikar database.
--        Your old data will be deleted.
-- ═══════════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS `kwikar`;
CREATE DATABASE `kwikar`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `kwikar`;

-- ───────────────────────────────────────────────────────────────
--  1. VISITS
--     Tracks first-visit pincode checks from welcome modal
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `visits` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `pincode`    VARCHAR(6)   NOT NULL,
  `area`       VARCHAR(120) DEFAULT NULL,
  `available`  TINYINT(1)   NOT NULL DEFAULT 0,
  `ip`         VARCHAR(45)  DEFAULT NULL,
  `user_agent` TEXT         DEFAULT NULL,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pincode` (`pincode`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  2. KWIKAR_USERS
--     Registered customers (login / register on main site)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `kwikar_users` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100) NOT NULL,
  `phone`      VARCHAR(15)  NOT NULL,
  `email`      VARCHAR(150) DEFAULT NULL,
  `address`    TEXT         DEFAULT NULL,
  `city`       VARCHAR(80)  DEFAULT NULL,
  `pincode`    VARCHAR(6)   DEFAULT NULL,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_phone` (`phone`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  3. KWIKAR_BOOKINGS
--     Service bookings placed by users via booking.html
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `kwikar_bookings` (
  `id`                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `service`           VARCHAR(80)  NOT NULL,
  `issue`             VARCHAR(200) NOT NULL,
  `other_issue`       TEXT         DEFAULT NULL,
  `slot_time`         VARCHAR(50)  DEFAULT NULL,
  `slot_date`         VARCHAR(50)  DEFAULT NULL,
  `user_name`         VARCHAR(100) DEFAULT NULL,
  `user_phone`        VARCHAR(15)  NOT NULL,
  `profession`        VARCHAR(100) DEFAULT NULL,
  `full_address`      TEXT         DEFAULT NULL,
  `pincode`           VARCHAR(6)   DEFAULT NULL,
  `pincode_available` TINYINT(1)   NOT NULL DEFAULT 0,
  `status`            ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `technician_id`     INT UNSIGNED  DEFAULT NULL,
  `technician_name`   VARCHAR(100)  DEFAULT NULL,
  `technician_phone`  VARCHAR(15)   DEFAULT NULL,
  `created_at`        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_phone` (`user_phone`),
  INDEX `idx_status`     (`status`),
  INDEX `idx_pincode`    (`pincode`),
  INDEX `idx_tech`       (`technician_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  4. KWIKAR_AREA_REQUESTS
--     Users who requested service in an unserviceable area
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `kwikar_area_requests` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `pincode`       VARCHAR(6)   NOT NULL,
  `user_name`     VARCHAR(100) DEFAULT NULL,
  `user_phone`    VARCHAR(15)  DEFAULT NULL,
  `profession`    VARCHAR(100) DEFAULT NULL,
  `wants_service` TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pincode` (`pincode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  5. KWIKAR_TECHNICIAN_APPLICATIONS
--     Applications submitted via "Join as Technician" on main site
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `kwikar_technician_applications` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100) NOT NULL,
  `phone`      VARCHAR(15)  NOT NULL,
  `email`      VARCHAR(150) DEFAULT NULL,
  `skills`     TEXT         DEFAULT NULL,
  `pincodes`   VARCHAR(200) DEFAULT NULL,
  `experience` VARCHAR(50)  DEFAULT NULL,
  `status`     ENUM('pending','approved','rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_phone`  (`phone`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  6. TECHNICIANS
--     Approved technician accounts — used for panel login
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `technicians` (
  `id`                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name`         VARCHAR(100)  NOT NULL,
  `email`             VARCHAR(150)  NOT NULL,
  `mobile`            VARCHAR(15)   NOT NULL,
  `password`          VARCHAR(255)  DEFAULT NULL,
  `profile_image`     VARCHAR(255)  DEFAULT NULL,
  `service_category`  VARCHAR(100)  DEFAULT NULL,
  `experience`        VARCHAR(50)   DEFAULT NULL,
  `city`              VARCHAR(80)   DEFAULT NULL,
  `pincodes`          VARCHAR(200)  DEFAULT NULL,
  `rating`            DECIMAL(3,2)  DEFAULT 0.00,
  `total_reviews`     INT UNSIGNED  DEFAULT 0,
  `is_verified`       TINYINT(1)    DEFAULT 0,
  `available_balance` DECIMAL(10,2) DEFAULT 0.00,
  `application_id`    INT UNSIGNED  DEFAULT NULL,
  `created_at`        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_email`  (`email`),
  UNIQUE KEY `uq_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  7. CUSTOMERS
--     Customer records linked to jobs (created when booking
--     is assigned to a technician)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `customers` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `booking_id`   INT UNSIGNED DEFAULT NULL,
  `name`         VARCHAR(100) NOT NULL,
  `phone`        VARCHAR(15)  DEFAULT NULL,
  `address`      TEXT         DEFAULT NULL,
  `rating`       DECIMAL(3,2) DEFAULT 0.00,
  `review_count` INT UNSIGNED DEFAULT 0,
  `created_at`   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_booking` (`booking_id`),
  INDEX `idx_phone`   (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  8. JOBS
--     Jobs assigned to technicians from bookings
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `jobs` (
  `id`            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  `technician_id` INT UNSIGNED  NOT NULL,
  `customer_id`   INT UNSIGNED  NOT NULL,
  `booking_id`    INT UNSIGNED  DEFAULT NULL,
  `title`         VARCHAR(200)  NOT NULL,
  `service_type`  VARCHAR(80)   DEFAULT NULL,
  `description`   TEXT          DEFAULT NULL,
  `status`        ENUM('new','ongoing','completed','cancelled') DEFAULT 'new',
  `job_date`      DATE          NOT NULL,
  `start_time`    TIME          DEFAULT NULL,
  `amount`        DECIMAL(10,2) DEFAULT 0.00,
  `created_at`    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tech`     (`technician_id`),
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_booking`  (`booking_id`),
  INDEX `idx_status`   (`status`),
  INDEX `idx_date`     (`job_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  9. TRANSACTIONS
--     Earnings credits and payout debits per technician
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `transactions` (
  `id`               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  `transaction_id`   VARCHAR(30)   NOT NULL,
  `technician_id`    INT UNSIGNED  NOT NULL,
  `job_id`           INT UNSIGNED  DEFAULT NULL,
  `type`             ENUM('credit','debit') NOT NULL,
  `description`      VARCHAR(200)  DEFAULT NULL,
  `amount`           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `balance_after`    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status`           ENUM('pending','success','paid_out','failed') DEFAULT 'success',
  `transaction_date` TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_txn_id`   (`transaction_id`),
  INDEX `idx_tech`          (`technician_id`),
  INDEX `idx_type`          (`type`),
  INDEX `idx_txn_date`      (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  10. NOTIFICATIONS
--      In-app notifications for technicians
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `notifications` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `technician_id` INT UNSIGNED NOT NULL,
  `type`          ENUM('job','earning','system') DEFAULT 'system',
  `title`         VARCHAR(150) NOT NULL,
  `message`       TEXT         DEFAULT NULL,
  `is_read`       TINYINT(1)   DEFAULT 0,
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tech`    (`technician_id`),
  INDEX `idx_read`    (`is_read`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  11. SUPPORT_TICKETS
--      Help / support tickets raised by technicians
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `support_tickets` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ticket_id`     VARCHAR(20)  NOT NULL,
  `technician_id` INT UNSIGNED NOT NULL,
  `subject`       VARCHAR(200) NOT NULL,
  `description`   TEXT         DEFAULT NULL,
  `status`        ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_ticket_id` (`ticket_id`),
  INDEX `idx_tech`   (`technician_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  12. BANK_DETAILS
--      Technician bank account / UPI for payouts
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `bank_details` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `technician_id`  INT UNSIGNED NOT NULL,
  `account_holder` VARCHAR(100) DEFAULT NULL,
  `account_number` VARCHAR(30)  DEFAULT NULL,
  `ifsc_code`      VARCHAR(15)  DEFAULT NULL,
  `bank_name`      VARCHAR(100) DEFAULT NULL,
  `upi_id`         VARCHAR(100) DEFAULT NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_tech` (`technician_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ───────────────────────────────────────────────────────────────
--  13. USER_SETTINGS
--      Technician app preferences (theme, language, etc.)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE `user_settings` (
  `id`                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `technician_id`         INT UNSIGNED NOT NULL,
  `language`              VARCHAR(30)  DEFAULT 'Hindi',
  `app_theme`             VARCHAR(20)  DEFAULT 'Light',
  `offline_mode`          TINYINT(1)   DEFAULT 0,
  `auto_logout`           INT          DEFAULT 30,
  `two_step_verification` TINYINT(1)   DEFAULT 0,
  `updated_at`            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_tech` (`technician_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET FOREIGN_KEY_CHECKS = 1;


-- ═══════════════════════════════════════════════════════════════
--  All tables are empty on fresh install.
--  Technicians register via the main Kwikar site and are
--  redirected to this panel automatically — no separate login.
-- ═══════════════════════════════════════════════════════════════
