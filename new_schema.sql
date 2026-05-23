CREATE DATABASE IF NOT EXISTS kwikar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kwikar;

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(120) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,

    pass_pin VARCHAR(255) NOT NULL,

    role ENUM(
        'customer',
        'technician',
        'abd',
        'admin'
    ) NOT NULL,

    status ENUM(
        'active',
        'inactive',
        'blocked'
    ) DEFAULT 'active',

    last_login_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- USER PROFILES
-- =========================================================

CREATE TABLE user_profiles (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    profile_image VARCHAR(255),

    gender ENUM('male', 'female', 'other') NULL,

    dob DATE NULL,

    bio TEXT NULL,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- PINCODES
-- =========================================================

CREATE TABLE pincodes (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    pincode VARCHAR(10) NOT NULL UNIQUE,

    city VARCHAR(120) NOT NULL,
    state VARCHAR(120) NOT NULL,

    is_serviceable TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- ADDRESSES
-- =========================================================

CREATE TABLE addresses (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,
    pincode_id BIGINT UNSIGNED NOT NULL,

    address_line TEXT NOT NULL,

    landmark VARCHAR(255),

    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),

    is_default TINYINT(1) DEFAULT 0,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY (pincode_id)
    REFERENCES pincodes(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- SERVICES
-- =========================================================

CREATE TABLE services (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(120) NOT NULL UNIQUE,

    slug VARCHAR(150) NOT NULL UNIQUE,

    icon VARCHAR(255),

    status ENUM(
        'active',
        'inactive'
    ) DEFAULT 'active',

    created_by BIGINT UNSIGNED NULL,

    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- CUSTOMERS
-- =========================================================

CREATE TABLE customers (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    total_bookings INT DEFAULT 0,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- ABDS
-- =========================================================

CREATE TABLE abds (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    direct_commission_percent DECIMAL(5,2) DEFAULT 25.00,

    indirect_commission_percent DECIMAL(5,2) DEFAULT 10.00,

    wallet_balance DECIMAL(12,2) DEFAULT 0.00,

    status ENUM(
        'active',
        'inactive',
        'blocked'
    ) DEFAULT 'active',

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- ABD PINCODES
-- =========================================================

CREATE TABLE abd_pincodes (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    abd_id BIGINT UNSIGNED NOT NULL,
    pincode_id BIGINT UNSIGNED NOT NULL,

    is_primary TINYINT(1) DEFAULT 0,

    FOREIGN KEY (abd_id)
    REFERENCES abds(id)
    ON DELETE CASCADE,

    FOREIGN KEY (pincode_id)
    REFERENCES pincodes(id)
    ON DELETE CASCADE,

    UNIQUE KEY unique_abd_pincode (
        abd_id,
        pincode_id
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- TECHNICIANS
-- =========================================================

CREATE TABLE technicians (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    joined_source ENUM(
        'website',
        'abd_direct',
        'technician_referral'
    ) DEFAULT 'website',

    experience_years INT DEFAULT 0,

    rating DECIMAL(3,2) DEFAULT 0.00,

    total_jobs INT DEFAULT 0,

    wallet_balance DECIMAL(12,2) DEFAULT 0.00,

    kyc_status ENUM(
        'pending',
        'verified',
        'rejected'
    ) DEFAULT 'pending',

    availability_status ENUM(
        'online',
        'offline',
        'busy'
    ) DEFAULT 'offline',

    is_featured TINYINT(1) DEFAULT 0,

    featured_expire_at DATETIME NULL,

    priority_lead_enabled TINYINT(1) DEFAULT 0,

    -- ABD referral tracking (added during development)
    abd_id      INT NULL COMMENT 'ABD who onboarded this technician via referral link',
    referred_by INT NULL COMMENT 'Technician ID who referred this technician (NULL = direct ABD referral)',

    status ENUM(
        'active',
        'inactive',
        'blocked'
    ) DEFAULT 'active',

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- TECHNICIAN SERVICES
-- =========================================================

CREATE TABLE technician_services (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    technician_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,

    experience_level ENUM(
        'beginner',
        'intermediate',
        'expert'
    ) DEFAULT 'beginner',

    FOREIGN KEY (technician_id)
    REFERENCES technicians(id)
    ON DELETE CASCADE,

    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE,

    UNIQUE KEY unique_technician_service (
        technician_id,
        service_id
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- TECHNICIAN PINCODES
-- =========================================================

CREATE TABLE technician_pincodes (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    technician_id BIGINT UNSIGNED NOT NULL,

    pincode_id BIGINT UNSIGNED NOT NULL,

    is_active TINYINT(1) DEFAULT 1,

    FOREIGN KEY (technician_id)
    REFERENCES technicians(id)
    ON DELETE CASCADE,

    FOREIGN KEY (pincode_id)
    REFERENCES pincodes(id)
    ON DELETE CASCADE,

    UNIQUE KEY unique_technician_pincode (
        technician_id,
        pincode_id
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- REFERRAL RELATIONSHIPS
-- =========================================================

CREATE TABLE referral_relationships (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    technician_id BIGINT UNSIGNED NOT NULL UNIQUE,

    parent_technician_id BIGINT UNSIGNED NULL,

    abd_id BIGINT UNSIGNED NOT NULL,

    referral_level INT NOT NULL,

    relationship_type ENUM(
        'direct_abd',
        'technician_referral'
    ) NOT NULL,

    FOREIGN KEY (technician_id)
    REFERENCES technicians(id)
    ON DELETE CASCADE,

    FOREIGN KEY (parent_technician_id)
    REFERENCES technicians(id)
    ON DELETE SET NULL,

    FOREIGN KEY (abd_id)
    REFERENCES abds(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- SUBSCRIPTION PLANS
-- =========================================================

CREATE TABLE subscription_plans (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(120) NOT NULL,

    description TEXT,

    duration_days INT NOT NULL,

    price DECIMAL(10,2) NOT NULL,

    featured_boost TINYINT(1) DEFAULT 0,

    priority_leads TINYINT(1) DEFAULT 0,

    max_pincodes INT DEFAULT 1,

    status ENUM(
        'active',
        'inactive'
    ) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- TECHNICIAN SUBSCRIPTIONS
-- =========================================================

CREATE TABLE technician_subscriptions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    technician_id BIGINT UNSIGNED NOT NULL,

    subscription_plan_id BIGINT UNSIGNED NOT NULL,

    pincode_id BIGINT UNSIGNED NOT NULL,

    amount_paid DECIMAL(10,2) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    payment_status ENUM(
        'pending',
        'paid',
        'failed'
    ) DEFAULT 'pending',

    status ENUM(
        'active',
        'expired',
        'cancelled'
    ) DEFAULT 'active',

    FOREIGN KEY (technician_id)
    REFERENCES technicians(id)
    ON DELETE CASCADE,

    FOREIGN KEY (subscription_plan_id)
    REFERENCES subscription_plans(id),

    FOREIGN KEY (pincode_id)
    REFERENCES pincodes(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- SUBSCRIPTION COMMISSION DISTRIBUTIONS
-- =========================================================

CREATE TABLE subscription_commissions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    technician_subscription_id BIGINT UNSIGNED NOT NULL,

    from_technician_id BIGINT UNSIGNED NOT NULL,

    to_user_id BIGINT UNSIGNED NOT NULL,

    to_user_role ENUM(
        'abd',
        'technician',
        'kwikar'
    ) NOT NULL,

    commission_type ENUM(
        'direct_abd',
        'indirect_abd',
        'technician_referral',
        'platform'
    ) NOT NULL,

    commission_percent DECIMAL(5,2) NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (technician_subscription_id)
    REFERENCES technician_subscriptions(id)
    ON DELETE CASCADE,

    FOREIGN KEY (from_technician_id)
    REFERENCES technicians(id)
    ON DELETE CASCADE,

    FOREIGN KEY (to_user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- BOOKINGS
-- =========================================================

CREATE TABLE bookings (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    booking_code CHAR(8) NOT NULL UNIQUE,

    customer_id BIGINT UNSIGNED NOT NULL,

    service_id BIGINT UNSIGNED NOT NULL,

    assigned_technician_id BIGINT UNSIGNED NULL,

    address_id BIGINT UNSIGNED NOT NULL,

    problem_description TEXT NOT NULL,

    preferred_date DATE NOT NULL,

    preferred_time TIME NOT NULL,

    status ENUM(
        'new',
        'broadcasted',
        'accepted',
        'assigned',
        'arrived',
        'ongoing',
        'completed',
        'cancelled'
    ) DEFAULT 'new',

    final_amount DECIMAL(10,2) NULL,

    customer_paid_directly TINYINT(1) DEFAULT 1,

    FOREIGN KEY (customer_id)
    REFERENCES customers(id),

    FOREIGN KEY (service_id)
    REFERENCES services(id),

    FOREIGN KEY (assigned_technician_id)
    REFERENCES technicians(id)
    ON DELETE SET NULL,

    FOREIGN KEY (address_id)
    REFERENCES addresses(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- BOOKING STATUS LOGS
-- =========================================================

CREATE TABLE booking_status_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    booking_id BIGINT UNSIGNED NOT NULL,

    status VARCHAR(100) NOT NULL,

    changed_by BIGINT UNSIGNED NULL,

    note TEXT NULL,

    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE CASCADE,

    FOREIGN KEY (changed_by)
    REFERENCES users(id)
    ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- BOOKING BROADCASTS
-- =========================================================

CREATE TABLE booking_broadcasts (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    booking_id BIGINT UNSIGNED NOT NULL,

    technician_id BIGINT UNSIGNED NOT NULL,

    notification_priority INT DEFAULT 0,

    is_featured_priority TINYINT(1) DEFAULT 0,

    viewed_at DATETIME NULL,

    accepted_at DATETIME NULL,

    rejected_at DATETIME NULL,

    response_status ENUM(
        'pending',
        'accepted',
        'rejected',
        'expired'
    ) DEFAULT 'pending',

    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE CASCADE,

    FOREIGN KEY (technician_id)
    REFERENCES technicians(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- PAYMENTS
-- =========================================================

CREATE TABLE payments (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    booking_id BIGINT UNSIGNED NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    payment_method ENUM(
        'cash',
        'upi',
        'card',
        'wallet'
    ) NOT NULL,

    payment_status ENUM(
        'pending',
        'paid',
        'failed',
        'refunded'
    ) DEFAULT 'pending',

    transaction_reference VARCHAR(255),

    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- WALLETS
-- =========================================================

CREATE TABLE wallets (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    wallet_type ENUM(
        'earning',
        'bonus',
        'withdrawal'
    ) DEFAULT 'earning',

    balance DECIMAL(12,2) DEFAULT 0.00,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- WALLET TRANSACTIONS
-- =========================================================

CREATE TABLE wallet_transactions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    wallet_id BIGINT UNSIGNED NOT NULL,

    reference_type ENUM(
        'subscription',
        'withdrawal',
        'bonus',
        'manual'
    ) NOT NULL,

    reference_id BIGINT UNSIGNED NULL,

    transaction_type ENUM(
        'credit',
        'debit'
    ) NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    note TEXT NULL,

    FOREIGN KEY (wallet_id)
    REFERENCES wallets(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- WITHDRAWAL REQUESTS
-- =========================================================

CREATE TABLE withdrawal_requests (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    wallet_id BIGINT UNSIGNED NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    status ENUM(
        'pending',
        'approved',
        'rejected',
        'paid'
    ) DEFAULT 'pending',

    processed_at DATETIME NULL,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY (wallet_id)
    REFERENCES wallets(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- BANK DETAILS
-- =========================================================

CREATE TABLE bank_details (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    account_holder VARCHAR(150) NOT NULL,

    account_number VARCHAR(80) NOT NULL,

    ifsc_code VARCHAR(20) NOT NULL,

    bank_name VARCHAR(120) NOT NULL,

    upi_id VARCHAR(120),

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- TECHNICIAN DOCUMENTS
-- =========================================================

CREATE TABLE technician_documents (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    technician_id BIGINT UNSIGNED NOT NULL,

    document_type ENUM(
        'aadhaar',
        'pan',
        'driving_license',
        'photo',
        'certificate'
    ) NOT NULL,

    document_url VARCHAR(255) NOT NULL,

    verification_status ENUM(
        'pending',
        'verified',
        'rejected'
    ) DEFAULT 'pending',

    FOREIGN KEY (technician_id)
    REFERENCES technicians(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- FEEDBACKS
-- =========================================================

CREATE TABLE feedbacks (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    booking_id BIGINT UNSIGNED NOT NULL,

    customer_id BIGINT UNSIGNED NOT NULL,

    technician_id BIGINT UNSIGNED NOT NULL,

    rating INT NOT NULL,

    review TEXT NULL,

    CHECK (rating >= 1 AND rating <= 5),

    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE CASCADE,

    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE,

    FOREIGN KEY (technician_id)
    REFERENCES technicians(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    type ENUM(
        'booking',
        'earning',
        'subscription',
        'support',
        'system'
    ) DEFAULT 'system',

    is_read TINYINT(1) DEFAULT 0,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- SUPPORT TICKETS
-- =========================================================

CREATE TABLE support_tickets (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    booking_id BIGINT UNSIGNED NULL,

    subject VARCHAR(255) NOT NULL,

    description TEXT NOT NULL,

    priority ENUM(
        'low',
        'medium',
        'high'
    ) DEFAULT 'medium',

    status ENUM(
        'open',
        'in_progress',
        'resolved',
        'closed'
    ) DEFAULT 'open',

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- FEATURE BOOST PURCHASES
-- =========================================================

CREATE TABLE feature_boost_purchases (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    technician_id BIGINT UNSIGNED NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,

    status ENUM(
        'active',
        'expired'
    ) DEFAULT 'active',

    FOREIGN KEY (technician_id)
    REFERENCES technicians(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- SYSTEM SETTINGS
-- =========================================================

CREATE TABLE system_settings (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    setting_key VARCHAR(150) NOT NULL UNIQUE,

    setting_value TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- ADMINS
-- =========================================================

CREATE TABLE admins (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    is_super TINYINT(1) DEFAULT 0,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- ADMIN AUDIT LOGS
-- =========================================================

CREATE TABLE admin_audit_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    admin_id BIGINT UNSIGNED NOT NULL,

    action VARCHAR(255) NOT NULL,

    target_type VARCHAR(100) NULL,

    target_id BIGINT UNSIGNED NULL,

    details JSON NULL,

    ip_address VARCHAR(45) NULL,

    FOREIGN KEY (admin_id)
    REFERENCES admins(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- USER SETTINGS
-- =========================================================

CREATE TABLE user_settings (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    notifications_enabled TINYINT(1) DEFAULT 1,

    language VARCHAR(10) DEFAULT 'en',

    theme ENUM('light', 'dark', 'system') DEFAULT 'system',

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- IMPORTANT INDEXES
-- =========================================================

CREATE INDEX idx_users_role
ON users(role);

CREATE INDEX idx_bookings_status
ON bookings(status);

CREATE INDEX idx_bookings_service
ON bookings(service_id);

CREATE INDEX idx_booking_broadcasts_status
ON booking_broadcasts(response_status);

CREATE INDEX idx_technician_pincode
ON technician_pincodes(pincode_id);

CREATE INDEX idx_referral_abd
ON referral_relationships(abd_id);

CREATE INDEX idx_subscription_status
ON technician_subscriptions(status);

CREATE INDEX idx_notifications_user
ON notifications(user_id);

CREATE INDEX idx_technician_abd
ON technicians(abd_id);

CREATE INDEX idx_technician_referred_by
ON technicians(referred_by);
