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
$data   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $data['action'] ?? $_GET['action'] ?? '';

// ═══════════════════════════════════════════════════════════════
// get_abd_pincodes
// Returns pincode list for a given ABD ID (used on technician referral form).
// ═══════════════════════════════════════════════════════════════
if ($action === 'get_abd_pincodes') {
    $abdId = (int) ($data['abd_id'] ?? $_GET['abd_id'] ?? 0);
    if (!$abdId) { echo json_encode(['success' => false, 'pincodes' => []]); exit; }

    $st = $pdo->prepare("
        SELECT p.pincode, p.city
        FROM   abd_pincodes ap
        JOIN   pincodes p ON p.id = ap.pincode_id
        WHERE  ap.abd_id = ?
        ORDER  BY ap.is_primary DESC, p.pincode ASC
    ");
    $st->execute([$abdId]);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'pincodes' => $rows]);
    exit;
}

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
    // Extract start time from slot label like "10:00 AM – 12:00 PM"
    preg_match('/^(\d+:\d+\s*[AP]M)/i', $slotTime, $_tm);
    $startPart  = $_tm[1] ?? '';
    $ts         = $startPart ? strtotime($startPart) : false;
    $parsedTime = ($ts !== false) ? date('H:i:s', $ts) : '10:00:00';

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
    $name     = trim($data['name']       ?? '');
    $phone    = trim($data['phone']      ?? '');
    $email    = trim($data['email']      ?? '');
    $pin      = trim($data['pin']        ?? '');
    $abdId    = (int) ($data['abd_id']   ?? 0);
    $exp      = (int) ($data['experience'] ?? 0);
    $skills   = trim($data['skills']     ?? '');
    $rawPins  = trim($data['pincodes']   ?? '');

    if (!$name || !$phone) {
        echo json_encode(['success' => false, 'error' => 'Name and phone required']);
        exit;
    }

    $pinHash  = $pin !== '' ? password_hash($pin, PASSWORD_DEFAULT) : '';
    $emailVal = $email !== '' ? $email : null;

    // 1. Upsert users by phone (check-then-insert avoids UNIQUE email conflicts)
    $st = $pdo->prepare("SELECT id FROM users WHERE phone = ? LIMIT 1");
    $st->execute([$phone]);
    $userId = (int) $st->fetchColumn();

    if ($userId) {
        // Already exists — update name/email/pin/role
        $pdo->prepare("
            UPDATE users SET name = ?, role = 'technician', status = 'active',
                email    = COALESCE(?, email),
                pass_pin = IF(? != '', ?, pass_pin),
                updated_at = NOW()
            WHERE id = ?
        ")->execute([$name, $emailVal, $pinHash, $pinHash, $userId]);
    } else {
        // If email is already taken by another account, skip it (phone+PIN is enough to login)
        if ($emailVal !== null) {
            $chk = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ? LIMIT 1");
            $chk->execute([$emailVal]);
            if ((int) $chk->fetchColumn() > 0) $emailVal = null;
        }
        $pdo->prepare("
            INSERT INTO users (name, phone, email, pass_pin, role, status)
            VALUES (?, ?, ?, ?, 'technician', 'active')
        ")->execute([$name, $phone, $emailVal, $pinHash]);
        $userId = (int) $pdo->lastInsertId();
    }

    if (!$userId) {
        echo json_encode(['success' => false, 'error' => 'User record create nahi ho paya']);
        exit;
    }

    // 2. Upsert into technicians
    $source = $abdId ? 'abd_direct' : 'website';
    $pdo->prepare("
        INSERT INTO technicians (user_id, joined_source, experience_years, status, abd_id)
        VALUES (?, ?, ?, 'active', ?)
        ON DUPLICATE KEY UPDATE
            joined_source   = VALUES(joined_source),
            experience_years = VALUES(experience_years),
            abd_id          = IF(VALUES(abd_id) > 0, VALUES(abd_id), abd_id),
            updated_at      = NOW()
    ")->execute([$userId, $source, $exp, $abdId ?: null]);

    $st = $pdo->prepare("SELECT id FROM technicians WHERE user_id = ?");
    $st->execute([$userId]);
    $techId = (int) $st->fetchColumn();

    // 3. Link services / skills
    $skillList = array_filter(array_map('trim', explode(',', $skills)));
    foreach ($skillList as $skill) {
        $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $skill), '-'));
        $pdo->prepare("INSERT IGNORE INTO services (name, slug) VALUES (?, ?)")->execute([$skill, $slug]);
        $st = $pdo->prepare("SELECT id FROM services WHERE name = ?");
        $st->execute([$skill]);
        $sid = (int) $st->fetchColumn();
        if ($sid) {
            $pdo->prepare("INSERT IGNORE INTO technician_services (technician_id, service_id) VALUES (?, ?)")
                ->execute([$techId, $sid]);
        }
    }

    // 4. Link pincodes
    $cfg   = require __DIR__ . '/config.php';
    $areas = $cfg['app']['service_areas'] ?? [];
    $pinList = array_filter(array_map('trim', explode(',', $rawPins)));
    foreach ($pinList as $pc) {
        $pcCity = $areas[$pc] ?? 'Bhagalpur';
        $pdo->prepare("INSERT IGNORE INTO pincodes (pincode, city, state, is_serviceable) VALUES (?, ?, 'Bihar', 1)")
            ->execute([$pc, $pcCity]);
        $st = $pdo->prepare("SELECT id FROM pincodes WHERE pincode = ?");
        $st->execute([$pc]);
        $pid = (int) $st->fetchColumn();
        if ($pid) {
            $pdo->prepare("INSERT IGNORE INTO technician_pincodes (technician_id, pincode_id, is_active) VALUES (?, ?, 1)")
                ->execute([$techId, $pid]);
        }
    }

    // 5. Record ABD referral relationship
    if ($abdId && $techId) {
        // Get abds.id from user_id = abdId (abd_id field stores abds.id)
        $pdo->prepare("
            INSERT IGNORE INTO referral_relationships
                (technician_id, parent_technician_id, abd_id, referral_level, relationship_type)
            VALUES (?, NULL, ?, 1, 'direct_abd')
        ")->execute([$techId, $abdId]);

        // Create earning wallet for technician
        $pdo->prepare("INSERT IGNORE INTO wallets (user_id, wallet_type, balance) VALUES (?, 'earning', 0.00)")
            ->execute([$userId]);
    }

    log_info('Technician registered', ['phone' => $phone, 'user_id' => $userId, 'tech_id' => $techId, 'abd_id' => $abdId]);
    echo json_encode(['success' => true, 'technician_id' => $techId, 'user_id' => $userId]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// slot_availability
// Returns per-slot technician availability for a pincode + date.
// A slot is unavailable when ALL technicians in that pincode are
// already booked (assigned/ongoing) during that time window.
// ═══════════════════════════════════════════════════════════════
if ($action === 'slot_availability') {
    $pincode    = trim($data['pincode'] ?? $_GET['pincode'] ?? '');
    $dateRaw    = trim($data['date']    ?? $_GET['date']    ?? '');

    if (!$pincode || !$dateRaw) {
        echo json_encode(['success' => false, 'error' => 'pincode and date required']);
        exit;
    }

    $parsedDate = date('Y-m-d', strtotime($dateRaw));
    if (!$parsedDate || $parsedDate === '1970-01-01') {
        echo json_encode(['success' => false, 'error' => 'Invalid date']);
        exit;
    }

    // Pincode → id
    $st = $pdo->prepare("SELECT id FROM pincodes WHERE pincode = ?");
    $st->execute([$pincode]);
    $pincodeId = (int) ($st->fetchColumn() ?: 0);

    if (!$pincodeId) {
        // Pincode not in DB yet — no registered technicians
        echo json_encode(['success' => true, 'total_techs' => 0, 'pincode' => $pincode, 'date' => $parsedDate, 'slots' => []]);
        exit;
    }

    // Count active technicians serving this pincode
    $st = $pdo->prepare("
        SELECT COUNT(DISTINCT t.id)
        FROM   technicians t
        JOIN   technician_pincodes tp ON t.id = tp.technician_id
        WHERE  tp.pincode_id = ? AND t.status = 'active' AND tp.is_active = 1
    ");
    $st->execute([$pincodeId]);
    $totalTechs = (int) $st->fetchColumn();

    // [label, start_time, end_time]
    $slotDefs = [
        ['10:00 AM – 12:00 PM', '10:00:00', '11:59:59'],
        ['12:00 PM – 02:00 PM', '12:00:00', '13:59:59'],
        ['02:00 PM – 04:00 PM', '14:00:00', '15:59:59'],
        ['04:00 PM – 06:00 PM', '16:00:00', '17:59:59'],
        ['06:00 PM – 08:00 PM', '18:00:00', '19:59:59'],
    ];

    $slots = [];
    $busyStmt = $pdo->prepare("
        SELECT COUNT(DISTINCT b.assigned_technician_id)
        FROM   bookings b
        JOIN   technician_pincodes tp ON b.assigned_technician_id = tp.technician_id
        WHERE  tp.pincode_id              = ?
          AND  b.preferred_date           = ?
          AND  b.preferred_time BETWEEN ? AND ?
          AND  b.assigned_technician_id  IS NOT NULL
          AND  b.status NOT IN ('cancelled','completed')
    ");

    foreach ($slotDefs as [$label, $tStart, $tEnd]) {
        $busyStmt->execute([$pincodeId, $parsedDate, $tStart, $tEnd]);
        $busyCount      = (int) $busyStmt->fetchColumn();
        $availableCount = max(0, $totalTechs - $busyCount);
        $slots[] = [
            'label'     => $label,
            'available' => $totalTechs > 0 && $availableCount > 0,
            'count'     => $availableCount,
            'total'     => $totalTechs,
        ];
    }

    echo json_encode([
        'success'     => true,
        'total_techs' => $totalTechs,
        'pincode'     => $pincode,
        'date'        => $parsedDate,
        'slots'       => $slots,
    ]);
    exit;
}

log_warning('Unknown action', ['action' => $action]);
echo json_encode(['success' => false, 'error' => 'Unknown action: ' . $action]);
