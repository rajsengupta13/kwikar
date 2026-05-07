-- ============================================
-- Kwikar Database Schema
-- Import this in phpMyAdmin under your DB
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Table 1: Bookings
CREATE TABLE IF NOT EXISTS `kwikar_bookings` (
  `id`                INT          NOT NULL AUTO_INCREMENT,
  `service`           VARCHAR(50)  NOT NULL,
  `issue`             VARCHAR(200) NOT NULL,
  `other_issue`       TEXT         DEFAULT NULL,
  `slot_time`         VARCHAR(50)  DEFAULT NULL,
  `slot_date`         VARCHAR(80)  DEFAULT NULL,
  `user_name`         VARCHAR(100) DEFAULT NULL,
  `user_phone`        VARCHAR(15)  DEFAULT NULL,
  `profession`        VARCHAR(100) DEFAULT NULL,
  `full_address`      TEXT         DEFAULT NULL,
  `pincode`           VARCHAR(10)  DEFAULT NULL,
  `pincode_available` TINYINT(1)   DEFAULT 0,
  `status`            VARCHAR(20)  DEFAULT 'pending',
  `created_at`        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: Area Requests (when pincode not serviceable)
CREATE TABLE IF NOT EXISTS `kwikar_area_requests` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `pincode`       VARCHAR(10)  DEFAULT NULL,
  `user_name`     VARCHAR(100) DEFAULT NULL,
  `user_phone`    VARCHAR(15)  DEFAULT NULL,
  `profession`    VARCHAR(100) DEFAULT NULL,
  `wants_service` TINYINT(1)   DEFAULT 0,
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: Technician Applications (from Join as Technician form)
CREATE TABLE IF NOT EXISTS `kwikar_technicians` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) DEFAULT NULL,
  `phone`      VARCHAR(15)  DEFAULT NULL,
  `email`      VARCHAR(150) DEFAULT NULL,
  `city`       VARCHAR(100) DEFAULT NULL,
  `pincode`    VARCHAR(10)  DEFAULT NULL,
  `experience` VARCHAR(50)  DEFAULT NULL,
  `skills`     TEXT         DEFAULT NULL,
  `id_type`    VARCHAR(50)  DEFAULT NULL,
  `id_number`  VARCHAR(50)  DEFAULT NULL,
  `about`      TEXT         DEFAULT NULL,
  `status`     VARCHAR(20)  DEFAULT 'pending',
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: Waitlist / Notify Me
CREATE TABLE IF NOT EXISTS `kwikar_waitlist` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) DEFAULT NULL,
  `phone`      VARCHAR(15)  DEFAULT NULL,
  `email`      VARCHAR(150) DEFAULT NULL,
  `pincode`    VARCHAR(10)  DEFAULT NULL,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: Site Visits
CREATE TABLE IF NOT EXISTS `kwikar_visits` (
  `id`         INT       NOT NULL AUTO_INCREMENT,
  `ip`         VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT        DEFAULT NULL,
  `page`       VARCHAR(200) DEFAULT NULL,
  `visited_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
