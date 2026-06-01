<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/db.php';

set_exception_handler(function (Throwable $e) {
    if (!headers_sent()) http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
    exit;
});

$pdo    = db();
$action = $_GET['action'] ?? '';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

// ═══════════════════════════════════════════════════════════════
// check_phone
// Does this number already have a customer account? Has PIN been set?
// ═══════════════════════════════════════════════════════════════
if ($action === 'check_phone') {
    $phone = trim($body['phone'] ?? '');
    if (!$phone) { echo json_encode(['success' => false, 'error' => 'Phone required']); exit; }

    // Check any role first — detect conflicts before assuming customer
    $st = $pdo->prepare("SELECT id, name, pass_pin, role FROM users WHERE phone = ? LIMIT 1");
    $st->execute([$phone]);
    $u = $st->fetch();

    if ($u && $u['role'] !== 'customer') {
        echo json_encode([
            'success'      => false,
            'role_conflict' => true,
            'existing_role' => $u['role'],
            'error'        => 'This number is already registered as a ' . $u['role'] . '. Please use the ' . $u['role'] . ' login.',
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'exists'  => (bool) $u,
        'has_pin' => !empty($u['pass_pin']),
        'name'    => $u['name'] ?? null,
        'user_id' => $u['id']   ?? null,
    ]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// register
// Creates (or updates) a customer account.
// Also creates customers row and saves address if provided.
// ═══════════════════════════════════════════════════════════════
if ($action === 'register') {
    $name    = trim($body['name']    ?? '');
    $phone   = trim($body['phone']   ?? '');
    $address = trim($body['address'] ?? '');
    $city    = trim($body['city']    ?? '');
    $pincode = trim($body['pincode'] ?? '');
    $pin     = trim($body['pin']     ?? '');

    if (!$name || !$phone) {
        echo json_encode(['success' => false, 'error' => 'Name and phone are required']);
        exit;
    }
    if (!preg_match('/^\d{10}$/', $phone)) {
        echo json_encode(['success' => false, 'error' => 'Enter a valid 10-digit phone number']);
        exit;
    }

    // Block if this phone is already registered under a different role
    $st = $pdo->prepare("SELECT role FROM users WHERE phone = ? LIMIT 1");
    $st->execute([$phone]);
    $existing = $st->fetch();
    if ($existing && $existing['role'] !== 'customer') {
        echo json_encode([
            'success'       => false,
            'role_conflict' => true,
            'existing_role' => $existing['role'],
            'error'         => 'This number is already registered as a ' . $existing['role'] . '. One number can only have one role.',
        ]);
        exit;
    }

    $pinHash = '';
    if ($pin !== '') {
        if (!preg_match('/^\d{4}$/', $pin)) {
            echo json_encode(['success' => false, 'error' => 'PIN must be exactly 4 digits']);
            exit;
        }
        $pinHash = password_hash($pin, PASSWORD_DEFAULT);
    }

    $pdo->prepare("
        INSERT INTO users (name, phone, pass_pin, role, status)
        VALUES (?, ?, ?, 'customer', 'active')
        ON DUPLICATE KEY UPDATE
            name     = VALUES(name),
            pass_pin = IF(VALUES(pass_pin) != '', VALUES(pass_pin), pass_pin),
            updated_at = NOW()
    ")->execute([$name, $phone, $pinHash]);

    $st = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
    $st->execute([$phone]);
    $userId = (int) $st->fetchColumn();

    // Ensure customer record exists
    $pdo->prepare("INSERT IGNORE INTO customers (user_id) VALUES (?)")->execute([$userId]);

    // Save address if provided
    if ($pincode && $address) {
        $pincodeId = ensurePincode($pdo, $pincode, $city);
        // Reset any existing default, then insert new default address
        $pdo->prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
        $pdo->prepare("INSERT INTO addresses (user_id, pincode_id, address_line, is_default) VALUES (?, ?, ?, 1)")
            ->execute([$userId, $pincodeId, $address]);
    }

    $user = fetchUserRow($pdo, $phone);
    log_info('User registered', ['phone' => $phone, 'user_id' => $userId]);
    echo json_encode(['success' => true, 'user' => $user]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// login
// Verifies a 4-digit PIN, returns the full user record.
// ═══════════════════════════════════════════════════════════════
if ($action === 'login') {
    $phone = trim($body['phone'] ?? '');
    $pin   = trim($body['pin']   ?? '');

    if (!$phone || !$pin) {
        echo json_encode(['success' => false, 'error' => 'Phone and PIN are required']);
        exit;
    }

    $st = $pdo->prepare("SELECT id, name, phone, pass_pin FROM users WHERE phone = ? AND role = 'customer' LIMIT 1");
    $st->execute([$phone]);
    $u = $st->fetch();

    if (!$u) {
        echo json_encode(['success' => false, 'error' => 'Account nahi mila — pehle register karo']);
        exit;
    }
    if (empty($u['pass_pin'])) {
        echo json_encode(['success' => false, 'error' => 'PIN abhi set nahi hai — booking confirm par set karo']);
        exit;
    }
    if (!password_verify($pin, $u['pass_pin'])) {
        echo json_encode(['success' => false, 'error' => 'Galat PIN — dobara try karo']);
        exit;
    }

    $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?")->execute([$u['id']]);

    $user = fetchUserRow($pdo, $phone);
    log_info('User logged in', ['phone' => $phone, 'user_id' => $u['id']]);
    echo json_encode(['success' => true, 'user' => $user]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// set_pin
// Called at booking confirmation for first-time users.
// ═══════════════════════════════════════════════════════════════
if ($action === 'set_pin') {
    $phone = trim($body['phone'] ?? '');
    $pin   = trim($body['pin']   ?? '');

    if (!$phone || !$pin) {
        echo json_encode(['success' => false, 'error' => 'Phone and PIN required']);
        exit;
    }
    if (!preg_match('/^\d{4}$/', $pin)) {
        echo json_encode(['success' => false, 'error' => 'PIN must be exactly 4 digits']);
        exit;
    }

    $hash = password_hash($pin, PASSWORD_DEFAULT);
    $st   = $pdo->prepare("UPDATE users SET pass_pin = ? WHERE phone = ? AND role = 'customer'");
    $st->execute([$hash, $phone]);

    if ($st->rowCount() === 0) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    log_info('PIN set', ['phone' => $phone]);
    echo json_encode(['success' => true]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// save_profession
// Saves/upserts a service entry (maps old profession concept to services table).
// ═══════════════════════════════════════════════════════════════
if ($action === 'save_profession') {
    $userId   = (int) ($body['user_id']   ?? 0);
    $profName = trim($body['profession']  ?? '');

    if (!$userId || !$profName) {
        echo json_encode(['success' => false, 'error' => 'user_id and profession required']);
        exit;
    }

    $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $profName), '-'));
    $pdo->prepare("INSERT IGNORE INTO services (name, slug) VALUES (?, ?)")->execute([$profName, $slug]);
    $st = $pdo->prepare("SELECT id FROM services WHERE name = ?");
    $st->execute([$profName]);
    $serviceId = (int) $st->fetchColumn();

    log_info('Profession/service saved', ['user_id' => $userId, 'service' => $profName]);
    echo json_encode(['success' => true, 'profession_id' => $serviceId]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// get_user
// Returns user profile including their latest address.
// ═══════════════════════════════════════════════════════════════
if ($action === 'get_user') {
    $phone = trim($_GET['phone'] ?? '');
    if (!$phone) { echo json_encode(['success' => false, 'error' => 'Phone required']); exit; }

    echo json_encode(['success' => true, 'user' => fetchUserRow($pdo, $phone)]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// get_bookings
// Returns all bookings for a phone number with technician details.
// ═══════════════════════════════════════════════════════════════
if ($action === 'get_bookings') {
    $phone = trim($_GET['phone'] ?? '');
    if (!$phone) { echo json_encode(['success' => false, 'error' => 'Phone required']); exit; }

    $st = $pdo->prepare("SELECT id FROM users WHERE phone = ? AND role = 'customer' LIMIT 1");
    $st->execute([$phone]);
    $userId = (int) $st->fetchColumn();

    if (!$userId) {
        echo json_encode(['success' => true, 'bookings' => []]);
        exit;
    }

    $st = $pdo->prepare("
        SELECT
            b.id,
            b.booking_code,
            s.name               AS service,
            b.problem_description AS issue,
            b.preferred_time     AS slot_time,
            b.preferred_date     AS slot_date,
            b.status,
            p.pincode,
            b.created_at,
            tu.name              AS technician_name,
            tu.phone             AS technician_phone,
            CASE WHEN b.status IN ('accepted','assigned','arrived','ongoing')
                 THEN b.happy_code ELSE NULL END AS happy_code,
            CASE WHEN b.status IN ('accepted','assigned','arrived','ongoing')
                 THEN b.sad_code   ELSE NULL END AS sad_code
        FROM   bookings b
        JOIN   customers c  ON b.customer_id = c.id
        JOIN   services  s  ON b.service_id  = s.id
        JOIN   addresses a  ON b.address_id  = a.id
        JOIN   pincodes  p  ON a.pincode_id  = p.id
        LEFT JOIN technicians t ON b.assigned_technician_id = t.id
        LEFT JOIN users      tu ON t.user_id = tu.id
        WHERE  c.user_id = ?
        ORDER  BY b.created_at DESC
    ");
    $st->execute([$userId]);
    echo json_encode(['success' => true, 'bookings' => $st->fetchAll()]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// cancel_booking
// Only allowed while status is 'new' or 'broadcasted'.
// ═══════════════════════════════════════════════════════════════
if ($action === 'cancel_booking') {
    $id    = (int) ($body['id']    ?? 0);
    $phone = trim($body['phone']   ?? '');

    if (!$id || !$phone) {
        echo json_encode(['success' => false, 'error' => 'Booking ID and phone required']);
        exit;
    }

    $st = $pdo->prepare("
        SELECT b.id, b.status, u.phone
        FROM   bookings b
        JOIN   customers c ON b.customer_id = c.id
        JOIN   users     u ON c.user_id     = u.id
        WHERE  b.id = ?
        LIMIT  1
    ");
    $st->execute([$id]);
    $b = $st->fetch();

    if (!$b)                                         { echo json_encode(['success' => false, 'error' => 'Booking not found']); exit; }
    if ($b['phone'] !== $phone)                      { echo json_encode(['success' => false, 'error' => 'Not authorized']); exit; }
    if (!in_array($b['status'], ['new', 'broadcasted'])) {
        echo json_encode(['success' => false, 'error' => 'Booking cancel nahi ho sakta — technician ne accept kar liya']);
        exit;
    }

    $pdo->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?")->execute([$id]);
    $pdo->prepare("UPDATE booking_broadcasts SET response_status = 'expired' WHERE booking_id = ? AND response_status = 'pending'")->execute([$id]);

    // Log the status change
    $st = $pdo->prepare("SELECT id FROM users WHERE phone = ? LIMIT 1");
    $st->execute([$phone]);
    $uid = $st->fetchColumn() ?: null;
    $pdo->prepare("INSERT INTO booking_status_logs (booking_id, status, changed_by, note) VALUES (?, 'cancelled', ?, 'Cancelled by customer')")
        ->execute([$id, $uid]);

    log_info('Booking cancelled', ['id' => $id, 'phone' => $phone]);
    echo json_encode(['success' => true]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// verify_tech_pin  — technician login through customer-side API
// ═══════════════════════════════════════════════════════════════
if ($action === 'verify_tech_pin') {
    $phone = trim($body['phone'] ?? '');
    $pin   = trim($body['pin']   ?? '');
    if (!$phone || !$pin) { echo json_encode(['success' => false, 'error' => 'Phone and PIN required']); exit; }

    $st = $pdo->prepare("
        SELECT u.name, u.phone, u.email, u.pass_pin,
               t.id AS technician_id, t.experience_years, t.rating,
               t.availability_status
        FROM   users u
        JOIN   technicians t ON u.id = t.user_id
        WHERE  u.phone = ? AND u.role = 'technician'
        LIMIT  1
    ");
    $st->execute([$phone]);
    $t = $st->fetch();

    if (!$t || !password_verify($pin, $t['pass_pin'])) {
        echo json_encode(['success' => false, 'error' => 'Galat credentials']);
        exit;
    }
    unset($t['pass_pin']);
    echo json_encode(['success' => true, 'technician' => $t]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// save_user  (backward-compat alias → register)
// ═══════════════════════════════════════════════════════════════
if ($action === 'save_user') {
    if (!isset($body['name']) && isset($body['user_name'])) $body['name'] = $body['user_name'];
    $name    = trim($body['name']    ?? '');
    $phone   = trim($body['phone']   ?? '');
    $address = trim($body['address'] ?? '');
    $city    = trim($body['city']    ?? '');
    $pincode = trim($body['pincode'] ?? '');
    $pin     = trim($body['pin']     ?? '');
    $pinHash = '';
    if ($pin !== '') {
        if (!preg_match('/^\d{4}$/', $pin)) { echo json_encode(['success' => false, 'error' => 'PIN must be 4 digits']); exit; }
        $pinHash = password_hash($pin, PASSWORD_DEFAULT);
    }
    $pdo->prepare("INSERT INTO users (name, phone, pass_pin, role, status) VALUES (?, ?, ?, 'customer', 'active')
        ON DUPLICATE KEY UPDATE name=VALUES(name), pass_pin=IF(VALUES(pass_pin)!='',VALUES(pass_pin),pass_pin), updated_at=NOW()")
        ->execute([$name, $phone, $pinHash]);
    $st = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
    $st->execute([$phone]); $userId = (int) $st->fetchColumn();
    $pdo->prepare("INSERT IGNORE INTO customers (user_id) VALUES (?)")->execute([$userId]);
    if ($pincode && $address) {
        $pincodeId = ensurePincode($pdo, $pincode, $city);
        $pdo->prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
        $pdo->prepare("INSERT INTO addresses (user_id, pincode_id, address_line, is_default) VALUES (?, ?, ?, 1)")
            ->execute([$userId, $pincodeId, $address]);
    }
    echo json_encode(['success' => true, 'user' => fetchUserRow($pdo, $phone)]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// verify_user_pin  (backward-compat alias → login)
// ═══════════════════════════════════════════════════════════════
if ($action === 'verify_user_pin') {
    $phone = trim($body['phone'] ?? '');
    $pin   = trim($body['pin']   ?? '');
    $st    = $pdo->prepare("SELECT id, pass_pin FROM users WHERE phone = ? AND role = 'customer' LIMIT 1");
    $st->execute([$phone]); $u = $st->fetch();
    if (!$u)                                       { echo json_encode(['success' => false, 'error' => 'Account nahi mila']); exit; }
    if (empty($u['pass_pin']))                     { echo json_encode(['success' => false, 'error' => 'PIN set nahi hai']); exit; }
    if (!password_verify($pin, $u['pass_pin']))    { echo json_encode(['success' => false, 'error' => 'Galat PIN']); exit; }
    echo json_encode(['success' => true, 'user' => fetchUserRow($pdo, $phone)]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// update_address
// Updates (or creates) the default address for a customer.
// ═══════════════════════════════════════════════════════════════
if ($action === 'update_address') {
    $phone   = trim($body['phone']   ?? '');
    $address = trim($body['address'] ?? '');
    $city    = trim($body['city']    ?? '');
    $pincode = trim($body['pincode'] ?? '');

    if (!$phone || !$address || !$city || !$pincode) {
        echo json_encode(['success' => false, 'error' => 'All fields required']);
        exit;
    }

    $st = $pdo->prepare("SELECT id FROM users WHERE phone = ? AND role = 'customer' LIMIT 1");
    $st->execute([$phone]);
    $userId = (int) $st->fetchColumn();

    if (!$userId) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    $pincodeId = ensurePincode($pdo, $pincode, $city);
    $pdo->prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
    $pdo->prepare("
        INSERT INTO addresses (user_id, pincode_id, address_line, is_default)
        VALUES (?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE address_line = VALUES(address_line), is_default = 1
    ")->execute([$userId, $pincodeId, $address]);

    log_info('Address updated', ['phone' => $phone]);
    echo json_encode(['success' => true]);
    exit;
}

log_warning('Unknown action', ['action' => $action]);
echo json_encode(['success' => false, 'error' => 'Unknown action: ' . $action]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function fetchUserRow(PDO $pdo, string $phone): ?array {
    $st = $pdo->prepare("
        SELECT
            u.id      AS user_id,
            u.name,
            u.phone,
            a.address_line AS address,
            p.city,
            p.pincode
        FROM   users u
        LEFT JOIN addresses a ON a.user_id = u.id AND a.is_default = 1
        LEFT JOIN pincodes  p ON a.pincode_id = p.id
        WHERE  u.phone = ? AND u.role = 'customer'
        LIMIT  1
    ");
    $st->execute([$phone]);
    return $st->fetch() ?: null;
}

function ensurePincode(PDO $pdo, string $pincode, string $city = ''): int {
    $cfg   = require __DIR__ . '/config.php';
    $areas = $cfg['app']['service_areas'] ?? [];
    $resolvedCity = $city ?: ($areas[$pincode] ?? 'Bhagalpur');
    $pdo->prepare("INSERT IGNORE INTO pincodes (pincode, city, state, is_serviceable) VALUES (?, ?, 'Bihar', 1)")
        ->execute([$pincode, $resolvedCity]);
    $st = $pdo->prepare("SELECT id FROM pincodes WHERE pincode = ?");
    $st->execute([$pincode]);
    return (int) $st->fetchColumn();
}
