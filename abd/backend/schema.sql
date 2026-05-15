-- ============================================================
-- Kwikar ABD (Area Business Director) — Database Schema
-- Database: kwikar
-- Run this in phpMyAdmin or MySQL CLI:
--   USE kwikar;
--   SOURCE /path/to/schema.sql;
-- ============================================================

-- ── 1. ABD Accounts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `abds` (
  `id`                  INT           AUTO_INCREMENT PRIMARY KEY,
  `full_name`           VARCHAR(100)  NOT NULL,
  `phone`               VARCHAR(15)   NOT NULL UNIQUE,
  `email`               VARCHAR(100)  NOT NULL,
  `area`                VARCHAR(100)  NOT NULL,
  `service_categories`  TEXT          DEFAULT NULL COMMENT 'comma-separated list e.g. AC Repair, RO Purifier',
  `experience`          VARCHAR(50)   DEFAULT NULL,
  `level`               ENUM('Bronze','Silver','Gold','Platinum') DEFAULT 'Bronze',
  `pin_hash`            VARCHAR(255)  NOT NULL,
  `profile_image`       VARCHAR(255)  DEFAULT NULL,
  `available_balance`   DECIMAL(12,2) DEFAULT 0.00,
  `total_earnings`      DECIMAL(12,2) DEFAULT 0.00,
  `rating`              DECIMAL(3,2)  DEFAULT 0.00,
  `total_reviews`       INT           DEFAULT 0,
  `is_verified`         TINYINT(1)    DEFAULT 0,
  `is_active`           TINYINT(1)    DEFAULT 1,
  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. ABD Pincodes (up to 10 per ABD) ─────────────────────
CREATE TABLE IF NOT EXISTS `abd_pincodes` (
  `id`               INT         AUTO_INCREMENT PRIMARY KEY,
  `abd_id`           INT         NOT NULL,
  `pincode`          VARCHAR(6)  NOT NULL,
  `area_name`        VARCHAR(100) DEFAULT NULL,
  `is_primary`       TINYINT(1)  DEFAULT 0,
  `technician_count` INT         DEFAULT 0,
  `booking_count`    INT         DEFAULT 0,
  `total_revenue`    DECIMAL(12,2) DEFAULT 0.00,
  `created_at`       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_abd_pincode`    (`abd_id`, `pincode`),
  CONSTRAINT `fk_abdpin_abd`     FOREIGN KEY (`abd_id`) REFERENCES `abds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. ABD Bank & UPI Details ──────────────────────────────
CREATE TABLE IF NOT EXISTS `abd_bank_details` (
  `id`               INT          AUTO_INCREMENT PRIMARY KEY,
  `abd_id`           INT          NOT NULL UNIQUE,
  `account_holder`   VARCHAR(100) DEFAULT NULL,
  `account_number`   VARCHAR(50)  DEFAULT NULL,
  `ifsc_code`        VARCHAR(20)  DEFAULT NULL,
  `bank_name`        VARCHAR(100) DEFAULT NULL,
  `upi_id`           VARCHAR(100) DEFAULT NULL,
  `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_abdbank_abd`    FOREIGN KEY (`abd_id`) REFERENCES `abds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. ABD Commission / Transaction Ledger ─────────────────
CREATE TABLE IF NOT EXISTS `abd_commissions` (
  `id`                  INT           AUTO_INCREMENT PRIMARY KEY,
  `abd_id`              INT           NOT NULL,
  `type`                ENUM('credit','debit') NOT NULL,
  `description`         VARCHAR(255)  DEFAULT NULL,
  `amount`              DECIMAL(12,2) NOT NULL,
  `balance_after`       DECIMAL(12,2) DEFAULT NULL,
  `status`              ENUM('success','pending','paid_out','failed') DEFAULT 'success',
  `commission_level`    TINYINT       DEFAULT 1  COMMENT '1 = direct tech 25%, 2+ = indirect 10%',
  `reference_booking_id` INT          DEFAULT NULL,
  `reference_tech_id`   INT          DEFAULT NULL,
  `created_at`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_abdcomm_abd`   (`abd_id`),
  INDEX `idx_abdcomm_date`  (`created_at`),
  CONSTRAINT `fk_abdcomm_abd`    FOREIGN KEY (`abd_id`) REFERENCES `abds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. ABD Notifications ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `abd_notifications` (
  `id`         INT           AUTO_INCREMENT PRIMARY KEY,
  `abd_id`     INT           NOT NULL COMMENT '0 = broadcast to all ABDs',
  `type`       ENUM('earning','referral','booking','complaint','system','withdrawal') DEFAULT 'system',
  `title`      VARCHAR(200)  NOT NULL,
  `body`       TEXT          DEFAULT NULL,
  `is_read`    TINYINT(1)    DEFAULT 0,
  `created_at` TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_abdnotif_abd`  (`abd_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. ABD Support Tickets ─────────────────────────────────
CREATE TABLE IF NOT EXISTS `abd_support_tickets` (
  `id`          INT          AUTO_INCREMENT PRIMARY KEY,
  `ticket_id`   VARCHAR(20)  NOT NULL UNIQUE,
  `abd_id`      INT          NOT NULL,
  `subject`     VARCHAR(200) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `status`      ENUM('open','in-review','resolved','escalated') DEFAULT 'open',
  `priority`    ENUM('low','medium','high','critical')          DEFAULT 'medium',
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_abdticket_abd` (`abd_id`),
  CONSTRAINT `fk_abdticket_abd` FOREIGN KEY (`abd_id`) REFERENCES `abds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- HOW COMMISSIONS WORK (updated model)
--
--   Source: Technician SUBSCRIPTION FEE only.
--     Fix plan  = Rs.499 per pincode
--     Flex plan = Rs.149 per service
--
--   Distribution from each subscription payment:
--     L1 - direct referrer of the paying technician  -> 25%
--     L2 - referrer's referrer                       -> 15%
--     L3 - one level further up                      -> 10%
--     Kwikar platform keeps the remaining 50%.
--
--   SERVICE / JOB CHARGES go 100% to the technician.
--   No deduction is made from job earnings.
--
--   Referrer can be a technician (credited via transactions table)
--   or an ABD (credited via abd_commissions table).
--
--   technicians table columns used:
--     abd_id         INT  -> which ABD onboarded this technician
--     referred_by    INT  -> technician_id who referred them (NULL = direct ABD)
--     referral_level INT  -> 1 = direct ABD registration, 2+ = tech referral chain
-- ============================================================
