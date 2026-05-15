<?php
/**
 * Kwikar â€” Database bootstrap.
 * Creates all schema tables (IF NOT EXISTS) on first connection.
 */

// Silently ignore FK / table-already-exists errors so old-schema tables don't break new ones
function _dbExec(PDO $pdo, string $sql): void {
    try { $pdo->exec($sql); } catch (PDOException $e) { /* skip â€” FK conflict or table already exists */ }
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;

    $cfg = require __DIR__ . '/config.php';
    $d   = $cfg['db'];

    $opts = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO(
        "mysql:host={$d['host']};port={$d['port']};charset={$d['charset']}",
        $d['user'], $d['pass'], $opts
    );
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$d['name']}` DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$d['name']}`");
    // Wrap all CREATE TABLE in try/catch — old-schema tables may have conflicting PKs/FKs
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);

    // â”€â”€ USERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name          VARCHAR(120)  NOT NULL,
        phone         VARCHAR(15)   NOT NULL UNIQUE,
        email         VARCHAR(150)  UNIQUE,
        pass_pin      VARCHAR(255)  NOT NULL DEFAULT '',
        role          ENUM('customer','technician','abd','admin') NOT NULL,
        status        ENUM('active','inactive','blocked') DEFAULT 'active',
        last_login_at DATETIME NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ USER_PROFILES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_profiles (
        id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id       BIGINT UNSIGNED NOT NULL UNIQUE,
        profile_image VARCHAR(255),
        gender        ENUM('male','female','other') NULL,
        dob           DATE NULL,
        bio           TEXT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ PINCODES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS pincodes (
        id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        pincode        VARCHAR(10)  NOT NULL UNIQUE,
        city           VARCHAR(120) NOT NULL,
        state          VARCHAR(120) NOT NULL,
        is_serviceable TINYINT(1)   DEFAULT 1,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ ADDRESSES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS addresses (
        id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id      BIGINT UNSIGNED NOT NULL,
        pincode_id   BIGINT UNSIGNED NOT NULL,
        address_line TEXT NOT NULL,
        landmark     VARCHAR(255),
        latitude     DECIMAL(10,7),
        longitude    DECIMAL(10,7),
        is_default   TINYINT(1) DEFAULT 0,
        FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
        FOREIGN KEY (pincode_id) REFERENCES pincodes(id),
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ SERVICES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS services (
        id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name       VARCHAR(120) NOT NULL UNIQUE,
        slug       VARCHAR(150) NOT NULL UNIQUE,
        icon       VARCHAR(255),
        status     ENUM('active','inactive') DEFAULT 'active',
        created_by BIGINT UNSIGNED NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ CUSTOMERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS customers (
        id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id        BIGINT UNSIGNED NOT NULL UNIQUE,
        total_bookings INT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ ABDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS abds (
        id                         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id                    BIGINT UNSIGNED NOT NULL UNIQUE,
        direct_commission_percent  DECIMAL(5,2)  DEFAULT 25.00,
        indirect_commission_percent DECIMAL(5,2) DEFAULT 10.00,
        wallet_balance             DECIMAL(12,2) DEFAULT 0.00,
        status                     ENUM('active','inactive','blocked') DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ ABD_PINCODES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS abd_pincodes (
        id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        abd_id     BIGINT UNSIGNED NOT NULL,
        pincode_id BIGINT UNSIGNED NOT NULL,
        is_primary TINYINT(1) DEFAULT 0,
        FOREIGN KEY (abd_id)     REFERENCES abds(id)     ON DELETE CASCADE,
        FOREIGN KEY (pincode_id) REFERENCES pincodes(id) ON DELETE CASCADE,
        UNIQUE KEY unique_abd_pincode (abd_id, pincode_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ TECHNICIANS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS technicians (
        id                    BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id               BIGINT UNSIGNED NOT NULL UNIQUE,
        joined_source         ENUM('website','abd_direct','technician_referral') DEFAULT 'website',
        experience_years      INT          DEFAULT 0,
        rating                DECIMAL(3,2) DEFAULT 0.00,
        total_jobs            INT          DEFAULT 0,
        wallet_balance        DECIMAL(12,2) DEFAULT 0.00,
        kyc_status            ENUM('pending','verified','rejected') DEFAULT 'pending',
        availability_status   ENUM('online','offline','busy') DEFAULT 'offline',
        is_featured           TINYINT(1) DEFAULT 0,
        featured_expire_at    DATETIME NULL,
        priority_lead_enabled TINYINT(1) DEFAULT 0,
        status                ENUM('active','inactive','blocked') DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ TECHNICIAN_SERVICES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS technician_services (
        id               BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        technician_id    BIGINT UNSIGNED NOT NULL,
        service_id       BIGINT UNSIGNED NOT NULL,
        experience_level ENUM('beginner','intermediate','expert') DEFAULT 'beginner',
        FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id)    REFERENCES services(id)    ON DELETE CASCADE,
        UNIQUE KEY unique_technician_service (technician_id, service_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ TECHNICIAN_PINCODES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS technician_pincodes (
        id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        technician_id BIGINT UNSIGNED NOT NULL,
        pincode_id    BIGINT UNSIGNED NOT NULL,
        is_active     TINYINT(1) DEFAULT 1,
        FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
        FOREIGN KEY (pincode_id)    REFERENCES pincodes(id)    ON DELETE CASCADE,
        UNIQUE KEY unique_technician_pincode (technician_id, pincode_id),
        INDEX idx_technician_pincode (pincode_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ REFERRAL_RELATIONSHIPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS referral_relationships (
        id                   BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        technician_id        BIGINT UNSIGNED NOT NULL UNIQUE,
        parent_technician_id BIGINT UNSIGNED NULL,
        abd_id               BIGINT UNSIGNED NOT NULL,
        referral_level       INT NOT NULL,
        relationship_type    ENUM('direct_abd','technician_referral') NOT NULL,
        FOREIGN KEY (technician_id)        REFERENCES technicians(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_technician_id) REFERENCES technicians(id) ON DELETE SET NULL,
        FOREIGN KEY (abd_id)               REFERENCES abds(id)        ON DELETE CASCADE,
        INDEX idx_referral_abd (abd_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ SUBSCRIPTION_PLANS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS subscription_plans (
        id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name           VARCHAR(120) NOT NULL,
        description    TEXT,
        duration_days  INT          NOT NULL,
        price          DECIMAL(10,2) NOT NULL,
        featured_boost TINYINT(1) DEFAULT 0,
        priority_leads TINYINT(1) DEFAULT 0,
        max_pincodes   INT DEFAULT 1,
        status         ENUM('active','inactive') DEFAULT 'active',
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ TECHNICIAN_SUBSCRIPTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS technician_subscriptions (
        id                   BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        technician_id        BIGINT UNSIGNED NOT NULL,
        subscription_plan_id BIGINT UNSIGNED NOT NULL,
        pincode_id           BIGINT UNSIGNED NOT NULL,
        amount_paid          DECIMAL(10,2) NOT NULL,
        start_date           DATE NOT NULL,
        end_date             DATE NOT NULL,
        payment_status       ENUM('pending','paid','failed') DEFAULT 'pending',
        status               ENUM('active','expired','cancelled') DEFAULT 'active',
        FOREIGN KEY (technician_id)        REFERENCES technicians(id)        ON DELETE CASCADE,
        FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id),
        FOREIGN KEY (pincode_id)           REFERENCES pincodes(id),
        INDEX idx_subscription_status (status),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ SUBSCRIPTION_COMMISSIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS subscription_commissions (
        id                         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        technician_subscription_id BIGINT UNSIGNED NOT NULL,
        from_technician_id         BIGINT UNSIGNED NOT NULL,
        to_user_id                 BIGINT UNSIGNED NOT NULL,
        to_user_role               ENUM('abd','technician','kwikar') NOT NULL,
        commission_type            ENUM('direct_abd','indirect_abd','technician_referral','platform') NOT NULL,
        commission_percent         DECIMAL(5,2) NOT NULL,
        amount                     DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (technician_subscription_id) REFERENCES technician_subscriptions(id) ON DELETE CASCADE,
        FOREIGN KEY (from_technician_id)         REFERENCES technicians(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id)                 REFERENCES users(id)       ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ BOOKINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS bookings (
        id                    BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        booking_code          CHAR(8)       NOT NULL UNIQUE,
        customer_id           BIGINT UNSIGNED NOT NULL,
        service_id            BIGINT UNSIGNED NOT NULL,
        assigned_technician_id BIGINT UNSIGNED NULL,
        address_id            BIGINT UNSIGNED NOT NULL,
        problem_description   TEXT NOT NULL,
        preferred_date        DATE NOT NULL,
        preferred_time        TIME NOT NULL,
        status                ENUM('new','broadcasted','accepted','assigned','arrived','ongoing','completed','cancelled') DEFAULT 'new',
        final_amount          DECIMAL(10,2) NULL,
        customer_paid_directly TINYINT(1) DEFAULT 1,
        FOREIGN KEY (customer_id)            REFERENCES customers(id),
        FOREIGN KEY (service_id)             REFERENCES services(id),
        FOREIGN KEY (assigned_technician_id) REFERENCES technicians(id) ON DELETE SET NULL,
        FOREIGN KEY (address_id)             REFERENCES addresses(id),
        INDEX idx_bookings_status  (status),
        INDEX idx_bookings_service (service_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ BOOKING_STATUS_LOGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS booking_status_logs (
        id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        booking_id BIGINT UNSIGNED NOT NULL,
        status     VARCHAR(100) NOT NULL,
        changed_by BIGINT UNSIGNED NULL,
        note       TEXT NULL,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id)    ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ BOOKING_BROADCASTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS booking_broadcasts (
        id                    BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        booking_id            BIGINT UNSIGNED NOT NULL,
        technician_id         BIGINT UNSIGNED NOT NULL,
        notification_priority INT DEFAULT 0,
        is_featured_priority  TINYINT(1) DEFAULT 0,
        viewed_at             DATETIME NULL,
        accepted_at           DATETIME NULL,
        rejected_at           DATETIME NULL,
        response_status       ENUM('pending','accepted','rejected','expired') DEFAULT 'pending',
        FOREIGN KEY (booking_id)    REFERENCES bookings(id)    ON DELETE CASCADE,
        FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
        INDEX idx_booking_broadcasts_status (response_status),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ PAYMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS payments (
        id                    BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        booking_id            BIGINT UNSIGNED NOT NULL,
        amount                DECIMAL(10,2) NOT NULL,
        payment_method        ENUM('cash','upi','card','wallet') NOT NULL,
        payment_status        ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
        transaction_reference VARCHAR(255),
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ WALLETS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS wallets (
        id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id     BIGINT UNSIGNED NOT NULL,
        wallet_type ENUM('earning','bonus','withdrawal') DEFAULT 'earning',
        balance     DECIMAL(12,2) DEFAULT 0.00,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ WALLET_TRANSACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS wallet_transactions (
        id               BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        wallet_id        BIGINT UNSIGNED NOT NULL,
        reference_type   ENUM('subscription','withdrawal','bonus','manual') NOT NULL,
        reference_id     BIGINT UNSIGNED NULL,
        transaction_type ENUM('credit','debit') NOT NULL,
        amount           DECIMAL(10,2) NOT NULL,
        note             TEXT NULL,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ WITHDRAWAL_REQUESTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id      BIGINT UNSIGNED NOT NULL,
        wallet_id    BIGINT UNSIGNED NOT NULL,
        amount       DECIMAL(10,2) NOT NULL,
        status       ENUM('pending','approved','rejected','paid') DEFAULT 'pending',
        processed_at DATETIME NULL,
        FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ BANK_DETAILS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS bank_details (
        id               BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id          BIGINT UNSIGNED NOT NULL UNIQUE,
        account_holder   VARCHAR(150) NOT NULL DEFAULT '',
        account_number   VARCHAR(80)  NOT NULL DEFAULT '',
        ifsc_code        VARCHAR(20)  NOT NULL DEFAULT '',
        bank_name        VARCHAR(120) NOT NULL DEFAULT '',
        upi_id           VARCHAR(120),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ TECHNICIAN_DOCUMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS technician_documents (
        id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        technician_id       BIGINT UNSIGNED NOT NULL,
        document_type       ENUM('aadhaar','pan','driving_license','photo','certificate') NOT NULL,
        document_url        VARCHAR(255) NOT NULL,
        verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
        FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ FEEDBACKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS feedbacks (
        id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        booking_id    BIGINT UNSIGNED NOT NULL,
        customer_id   BIGINT UNSIGNED NOT NULL,
        technician_id BIGINT UNSIGNED NOT NULL,
        rating        INT NOT NULL,
        review        TEXT NULL,
        CHECK (rating >= 1 AND rating <= 5),
        FOREIGN KEY (booking_id)    REFERENCES bookings(id)    ON DELETE CASCADE,
        FOREIGN KEY (customer_id)   REFERENCES customers(id)   ON DELETE CASCADE,
        FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ NOTIFICATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS notifications (
        id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id    BIGINT UNSIGNED NOT NULL,
        title      VARCHAR(255) NOT NULL,
        message    TEXT NOT NULL,
        type       ENUM('booking','earning','subscription','support','system') DEFAULT 'system',
        is_read    TINYINT(1) DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notifications_user (user_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ SUPPORT_TICKETS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS support_tickets (
        id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id     BIGINT UNSIGNED NOT NULL,
        booking_id  BIGINT UNSIGNED NULL,
        subject     VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority    ENUM('low','medium','high') DEFAULT 'medium',
        status      ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
        FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ FEATURE_BOOST_PURCHASES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS feature_boost_purchases (
        id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        technician_id BIGINT UNSIGNED NOT NULL,
        amount        DECIMAL(10,2) NOT NULL,
        start_at      DATETIME NOT NULL,
        end_at        DATETIME NOT NULL,
        status        ENUM('active','expired') DEFAULT 'active',
        FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ SYSTEM_SETTINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings (
        id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        setting_key   VARCHAR(150) NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // â”€â”€ USER_SETTINGS (technician panel preferences â€” supplementary) â”€â”€â”€â”€â”€
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_settings (
        id                    BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id               BIGINT UNSIGNED NOT NULL UNIQUE,
        language              VARCHAR(20) DEFAULT 'English',
        app_theme             VARCHAR(20) DEFAULT 'Light',
        offline_mode          TINYINT(1)  DEFAULT 0,
        auto_logout           INT         DEFAULT 30,
        two_step_verification TINYINT(1)  DEFAULT 0,
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Restore exception mode after table-creation block
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    return $pdo;
}

