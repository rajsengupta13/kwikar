<?php
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
$data   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $data['action'] ?? $_GET['action'] ?? '';

// ═══════════════════════════════════════════════════════════════
// check_pincode
// Checks the pincodes table for serviceability.
// Seed from config on first encounter so the table is auto-populated.
// ═══════════════════════════════════════════════════════════════
if ($action === 'check_pincode') {
    $pincode = trim($data['pincode'] ?? '');

    $available = false;
    if ($pincode) {
        $st = $pdo->prepare("SELECT is_serviceable FROM pincodes WHERE pincode = ?");
        $st->execute([$pincode]);
        $row = $st->fetch();

        if ($row) {
            $available = (bool) $row['is_serviceable'];
        } else {
            // Auto-seed from config if this is a known service area
            $cfg   = require __DIR__ . '/config.php';
            $areas = $cfg['app']['service_areas'] ?? [];
            if (isset($areas[$pincode])) {
                $pdo->prepare("INSERT IGNORE INTO pincodes (pincode, city, state, is_serviceable) VALUES (?, ?, 'Bihar', 1)")
                    ->execute([$pincode, $areas[$pincode]]);
                $available = true;
            }
        }
    }

    log_info('Pincode checked', ['pincode' => $pincode, 'available' => $available]);
    echo json_encode(['success' => true, 'available' => $available]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// book
// Full booking creation flow:
//   1. Ensure customer user account exists
//   2. Resolve service, pincode, address
//   3. Create booking with unique booking_code
//   4. Broadcast to active technicians in that pincode
// ═══════════════════════════════════════════════════════════════
if ($action === 'book') {
    $pincode    = trim($data['pincode']      ?? '');
    $phone      = trim($data['user_phone']   ?? '');
    $name       = trim($data['user_name']    ?? '');
    $userId     = isset($data['user_id']) ? (int) $data['user_id'] : null;
    $service    = trim($data['service']      ?? '');
    $issue      = trim($data['issue']        ?? '');
    $otherIssue = trim($data['other_issue']  ?? '');
    $slotDate   = trim($data['slot_date']    ?? '');
    $slotTime   = trim($data['slot_time']    ?? '');
    $fullAddr   = trim($data['full_address'] ?? $data['address'] ?? '');
    $city       = trim($data['city']         ?? '');

    if (!$phone) {
        echo json_encode(['success' => false, 'error' => 'Phone number required']);
        exit;
    }
    if (!$service) {
        echo json_encode(['success' => false, 'error' => 'Service required']);
        exit;
    }
    if (!$slotDate || !$slotTime) {
        echo json_encode(['success' => false, 'error' => 'Slot date and time required']);
        exit;
    }

    // ── 1. Ensure user + customer ─────────────────────────────────────
    if (!$userId) {
        // Block if this phone is already registered as technician or ABD
        $st = $pdo->prepare("SELECT role FROM users WHERE phone = ? LIMIT 1");
        $st->execute([$phone]);
        $existing = $st->fetch();
        if ($existing && $existing['role'] !== 'customer') {
            echo json_encode([
                'success'       => false,
                'role_conflict' => true,
                'existing_role' => $existing['role'],
                'error'         => 'This number is registered as a ' . $existing['role'] . ' — it cannot be used to place a customer booking.',
            ]);
            exit;
        }

        $pdo->prepare("
            INSERT INTO users (name, phone, pass_pin, role, status)
            VALUES (?, ?, '', 'customer', 'active')
            ON DUPLICATE KEY UPDATE
                name       = IF(name = '' OR name IS NULL, VALUES(name), name),
                updated_at = NOW()
        ")->execute([$name, $phone]);

        $st = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
        $st->execute([$phone]);
        $userId = (int) $st->fetchColumn();
    }

    $pdo->prepare("INSERT IGNORE INTO customers (user_id) VALUES (?)")->execute([$userId]);
    $st = $pdo->prepare("SELECT id FROM customers WHERE user_id = ?");
    $st->execute([$userId]);
    $customerId = (int) $st->fetchColumn();

    // ── 2. Resolve service ────────────────────────────────────────────
    $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $service), '-'));
    $pdo->prepare("INSERT IGNORE INTO services (name, slug) VALUES (?, ?)")->execute([$service, $slug]);
    $st = $pdo->prepare("SELECT id FROM services WHERE name = ?");
    $st->execute([$service]);
    $serviceId = (int) $st->fetchColumn();

    // ── 3. Resolve pincode + address ──────────────────────────────────
    $cfg       = require __DIR__ . '/config.php';
    $areas     = $cfg['app']['service_areas'] ?? [];
    $cityName  = $city ?: ($areas[$pincode] ?? 'Bhagalpur');
    $pdo->prepare("INSERT IGNORE INTO pincodes (pincode, city, state, is_serviceable) VALUES (?, ?, 'Bihar', 1)")
        ->execute([$pincode, $cityName]);
    $st = $pdo->prepare("SELECT id, is_serviceable FROM pincodes WHERE pincode = ?");
    $st->execute([$pincode]);
    $pcRow     = $st->fetch();
    $pincodeId = (int) $pcRow['id'];
    $available = (bool) $pcRow['is_serviceable'];

    // New address row per booking (preserves exact address at time of booking)
    $pdo->prepare("INSERT INTO addresses (user_id, pincode_id, address_line, is_default) VALUES (?, ?, ?, 0)")
        ->execute([$userId, $pincodeId, $fullAddr ?: 'Address not provided']);
    $addressId = (int) $pdo->lastInsertId();

    // ── 4. Generate unique booking_code ───────────────────────────────
    do {
        $code  = strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 8));
        $check = $pdo->prepare("SELECT id FROM bookings WHERE booking_code = ?");
        $check->execute([$code]);
    } while ($check->fetchColumn());

    // ── 5. Create booking ─────────────────────────────────────────────
    $problem = $issue . ($otherIssue ? ' — ' . $otherIssue : '');
    $parsedDate = date('Y-m-d', strtotime($slotDate));
    // Normalize slot_time to HH:MM:SS for TIME column
    $parsedTime = date('H:i:s', strtotime($slotTime)) ?: '00:00:00';

    $pdo->prepare("
        INSERT INTO bookings
            (booking_code, customer_id, service_id, address_id,
             problem_description, preferred_date, preferred_time, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
    ")->execute([$code, $customerId, $serviceId, $addressId, $problem, $parsedDate, $parsedTime]);
    $bookingId = (int) $pdo->lastInsertId();

    // Initial status log
    $pdo->prepare("INSERT INTO booking_status_logs (booking_id, status, changed_by, note) VALUES (?, 'new', ?, 'Booking created')")
        ->execute([$bookingId, $userId]);

    // Update customer booking count
    $pdo->prepare("UPDATE customers SET total_bookings = total_bookings + 1 WHERE id = ?")->execute([$customerId]);

    // ── 6. Broadcast to nearby active technicians ─────────────────────
    $broadcastCount = 0;
    try {
        $st = $pdo->prepare("
            SELECT t.id, t.is_featured, t.priority_lead_enabled
            FROM   technicians t
            JOIN   technician_pincodes tp ON t.id = tp.technician_id
            WHERE  tp.pincode_id = ? AND t.status = 'active' AND tp.is_active = 1
            ORDER  BY t.is_featured DESC, t.priority_lead_enabled DESC, t.rating DESC
        ");
        $st->execute([$pincodeId]);
        $techs = $st->fetchAll();

        if ($techs) {
            $broadcastStmt = $pdo->prepare("
                INSERT IGNORE INTO booking_broadcasts
                    (booking_id, technician_id, notification_priority, is_featured_priority)
                VALUES (?, ?, ?, ?)
            ");
            $notifStmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type)
                SELECT u.id, ?, ?, 'booking'
                FROM   technicians t
                JOIN   users u ON t.user_id = u.id
                WHERE  t.id = ?
            ");
            $nTitle = 'New Job: ' . $service . ' — ' . $issue;
            $nMsg   = 'Address: ' . ($fullAddr ?: 'N/A') . ' | Slot: ' . $slotDate . ' ' . $slotTime;

            foreach ($techs as $tech) {
                $priority = $tech['is_featured'] ? 2 : ($tech['priority_lead_enabled'] ? 1 : 0);
                $broadcastStmt->execute([$bookingId, $tech['id'], $priority, (int) $tech['is_featured']]);
                $notifStmt->execute([$nTitle, $nMsg, $tech['id']]);
            }
            $broadcastCount = count($techs);

            $pdo->prepare("UPDATE bookings SET status = 'broadcasted' WHERE id = ?")->execute([$bookingId]);
            $pdo->prepare("INSERT INTO booking_status_logs (booking_id, status, changed_by, note) VALUES (?, 'broadcasted', ?, ?)")
                ->execute([$bookingId, $userId, "Broadcasted to {$broadcastCount} technicians"]);
        }
    } catch (PDOException $ex) {
        log_error('Broadcast failed', ['error' => $ex->getMessage()]);
        // Booking still created — broadcast failure is non-critical
    }

    log_info('Booking created', [
        'booking_id'    => $bookingId,
        'booking_code'  => $code,
        'user_id'       => $userId,
        'phone'         => $phone,
        'service'       => $service,
        'pincode'       => $pincode,
        'broadcasts'    => $broadcastCount,
    ]);

    echo json_encode([
        'success'      => true,
        'booking_id'   => $bookingId,
        'booking_code' => $code,
        'user_id'      => $userId,
        'available'    => $available,
        'needs_pin'    => empty($data['user_id']),
    ]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// save_feedback — kept for backward compat (no-op, table removed)
// ═══════════════════════════════════════════════════════════════
if ($action === 'save_feedback') {
    log_info('Area feedback received', ['pincode' => $data['pincode'] ?? '']);
    echo json_encode(['success' => true]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// save_technician — registers a new technician
// Creates users + technicians rows, seeds pincodes/services.
// ═══════════════════════════════════════════════════════════════
if ($action === 'save_technician') {
    $name  = trim($data['name']  ?? '');
    $phone = trim($data['phone'] ?? '');
    $email = trim($data['email'] ?? '');
    $pin   = trim($data['pin']   ?? '');
    $abdId = (int) ($data['abd_id'] ?? 0);
    $exp   = trim($data['experience'] ?? '');
    $skills = trim($data['skills'] ?? '');
    $pincodes = trim($data['pincodes'] ?? '');

    if (!$name || !$phone) {
        echo json_encode(['success' => false, 'error' => 'Name and phone required']);
        exit;
    }

    $pinHash = $pin !== '' ? password_hash($pin, PASSWORD_DEFAULT) : '';

    // Use old technicians table directly (no users table FK needed)
    $pdo->prepare("
        INSERT INTO technicians (full_name, mobile, email, password, service_category, pincodes, experience)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            full_name        = VALUES(full_name),
            email            = IF(VALUES(email) != '', VALUES(email), email),
            password         = IF(VALUES(password) != '', VALUES(password), password),
            service_category = IF(VALUES(service_category) != '', VALUES(service_category), service_category),
            pincodes         = IF(VALUES(pincodes) != '', VALUES(pincodes), pincodes),
            experience       = IF(VALUES(experience) != '', VALUES(experience), experience),
            updated_at       = NOW()
    ")->execute([$name, $phone, $email, $pinHash, $skills, $pincodes, $exp]);

    $st = $pdo->prepare("SELECT id FROM technicians WHERE mobile = ?");
    $st->execute([$phone]);
    $techId = (int) $st->fetchColumn();

    // Save ABD referral link directly on the technician row (old schema)
    if ($abdId && $techId) {
        $pdo->prepare("UPDATE technicians SET abd_id = ? WHERE id = ? AND (abd_id IS NULL OR abd_id = 0)")
            ->execute([$abdId, $techId]);

        // Increment technician_count on the ABD's matching pincode
        $pinsArr = array_filter(array_map('trim', explode(',', $pincodes)));
        foreach ($pinsArr as $pc) {
            $pdo->prepare("
                UPDATE abd_pincodes SET technician_count = technician_count + 1
                WHERE abd_id = ? AND pincode = ?
            ")->execute([$abdId, $pc]);
        }
    }

    // (new-schema service/pincode tables are optional; silently skipped if not present)
    if ($techId) {
    }

    log_info('Technician registered', ['phone' => $phone, 'tech_id' => $techId, 'abd_id' => $abdId]);
    echo json_encode(['success' => true, 'technician_id' => $techId]);
    exit;
}

log_warning('Unknown action', ['action' => $action]);
echo json_encode(['success' => false, 'error' => 'Unknown action: ' . $action]);
