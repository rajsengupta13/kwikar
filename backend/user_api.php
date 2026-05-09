<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/logger.php';

include __DIR__ . '/db.php';
$pdo = db();

$action = $_GET['action'] ?? '';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

// ── Save / Update user profile ──
if ($action === 'save_user') {
    $name    = trim($body['name']    ?? '');
    $phone   = trim($body['phone']   ?? '');
    $address = trim($body['address'] ?? '');
    $city    = trim($body['city']    ?? '');
    $pincode = trim($body['pincode'] ?? '');
    $pin     = trim($body['pin']     ?? '');
    if (!$name || !$phone) {
        echo json_encode(['success'=>false,'error'=>'Name and phone required']);
        exit;
    }
    try {
        if ($pin !== '') {
            if (!preg_match('/^\d{4}$/', $pin)) {
                echo json_encode(['success'=>false,'error'=>'PIN must be 4 digits']);
                exit;
            }
            $hash = password_hash($pin, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO kwikar_users (name, phone, address, city, pincode, pin)
                VALUES (?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address), city=VALUES(city), pincode=VALUES(pincode), pin=VALUES(pin), updated_at=NOW()");
            $stmt->execute([$name, $phone, $address, $city, $pincode, $hash]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO kwikar_users (name, phone, address, city, pincode)
                VALUES (?,?,?,?,?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address), city=VALUES(city), pincode=VALUES(pincode), updated_at=NOW()");
            $stmt->execute([$name, $phone, $address, $city, $pincode]);
        }
        log_info('User saved', ['phone' => $phone, 'with_pin' => $pin !== '']);
        echo json_encode(['success'=>true]);
    } catch(PDOException $e) {
        log_error('save_user failed', ['error' => $e->getMessage()]);
        echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
    }
    exit;
}

// ── Verify user PIN (4-digit) ──
if ($action === 'verify_user_pin') {
    $phone = trim($body['phone'] ?? '');
    $pin   = trim($body['pin']   ?? '');
    if (!$phone || !$pin) { echo json_encode(['success'=>false,'error'=>'Phone and PIN required']); exit; }
    try {
        $stmt = $pdo->prepare("SELECT name, phone, address, city, pincode, pin FROM kwikar_users WHERE phone=?");
        $stmt->execute([$phone]);
        $u = $stmt->fetch();
        if (!$u) { echo json_encode(['success'=>false,'error'=>'Account nahi mila — pehle register karo']); exit; }
        if (empty($u['pin'])) { echo json_encode(['success'=>false,'error'=>'PIN set nahi hai — naya account banao']); exit; }
        if (!password_verify($pin, $u['pin'])) { echo json_encode(['success'=>false,'error'=>'Galat PIN']); exit; }
        unset($u['pin']);
        echo json_encode(['success'=>true,'user'=>$u]);
    } catch(PDOException $e) {
        log_error('verify_user_pin failed', ['error' => $e->getMessage()]);
        echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
    }
    exit;
}

// ── Verify technician PIN (6-digit) ──
if ($action === 'verify_tech_pin') {
    $phone = trim($body['phone'] ?? '');
    $pin   = trim($body['pin']   ?? '');
    if (!$phone || !$pin) { echo json_encode(['success'=>false,'error'=>'Phone and PIN required']); exit; }
    try {
        $stmt = $pdo->prepare("SELECT full_name AS name, mobile AS phone, email, service_category AS skills, experience, pincodes, password FROM technicians WHERE mobile=? LIMIT 1");
        $stmt->execute([$phone]);
        $t = $stmt->fetch();
        if (!$t) { echo json_encode(['success'=>false,'error'=>'Technician registered nahi hai']); exit; }
        if (empty($t['password'])) { echo json_encode(['success'=>false,'error'=>'PIN set nahi hai — admin se contact karo']); exit; }
        if (!password_verify($pin, $t['password'])) { echo json_encode(['success'=>false,'error'=>'Galat PIN']); exit; }
        unset($t['password']);
        echo json_encode(['success'=>true,'technician'=>$t]);
    } catch(PDOException $e) {
        log_error('verify_tech_pin failed', ['error' => $e->getMessage()]);
        echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
    }
    exit;
}

// ── Get user profile by phone ──
if ($action === 'get_user') {
    $phone = trim($_GET['phone'] ?? '');
    if (!$phone) { echo json_encode(['success'=>false,'error'=>'Phone required']); exit; }
    try {
        $stmt = $pdo->prepare("SELECT name, phone, address, city, pincode FROM kwikar_users WHERE phone=?");
        $stmt->execute([$phone]);
        $u = $stmt->fetch();
        echo json_encode(['success'=>true,'user'=>$u ?: null]);
    } catch(PDOException $e) {
        log_error('get_user failed', ['error' => $e->getMessage()]);
        echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
    }
    exit;
}

// ── Get bookings by phone (includes technician info when confirmed) ──
if ($action === 'get_bookings') {
    $phone = trim($_GET['phone'] ?? '');
    if (!$phone) { echo json_encode(['success'=>false,'error'=>'Phone required']); exit; }
    try {
        $stmt = $pdo->prepare("
            SELECT b.id, b.service, b.issue, b.other_issue, b.slot_time, b.slot_date,
                   b.status, b.created_at,
                   t.full_name AS technician_name,
                   t.mobile    AS technician_phone
            FROM kwikar_bookings b
            LEFT JOIN technicians t ON b.technician_id = t.id
            WHERE b.user_phone = ?
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([$phone]);
        $bookings = $stmt->fetchAll();
        log_info('Bookings fetched', ['phone' => $phone, 'count' => count($bookings)]);
        echo json_encode(['success'=>true,'bookings'=>$bookings]);
    } catch(PDOException $e) {
        log_error('get_bookings failed', ['error' => $e->getMessage()]);
        echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
    }
    exit;
}

// ── Get technician by phone ──
if ($action === 'get_technician') {
    $phone = trim($_GET['phone'] ?? '');
    if (!$phone) { echo json_encode(['success'=>false,'error'=>'Phone required']); exit; }
    try {
        $stmt = $pdo->prepare("SELECT full_name as name, mobile as phone, email, service_category as skills, experience, pincodes FROM technicians WHERE mobile=? LIMIT 1");
        $stmt->execute([$phone]);
        $t = $stmt->fetch();
        echo json_encode(['success'=>true,'technician'=>$t ?: null]);
    } catch(PDOException $e) {
        echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
    }
    exit;
}

// ── Cancel a booking (only allowed while still pending) ──
if ($action === 'cancel_booking') {
    $id    = (int)($body['id']    ?? 0);
    $phone = trim($body['phone'] ?? '');
    if (!$id || !$phone) {
        echo json_encode(['success'=>false,'error'=>'Booking id and phone required']);
        exit;
    }
    try {
        $stmt = $pdo->prepare("SELECT id, status, user_phone FROM kwikar_bookings WHERE id=?");
        $stmt->execute([$id]);
        $b = $stmt->fetch();
        if (!$b) { echo json_encode(['success'=>false,'error'=>'Booking not found']); exit; }
        if ($b['user_phone'] !== $phone) {
            echo json_encode(['success'=>false,'error'=>'Not authorized to cancel this booking']);
            exit;
        }
        if ($b['status'] !== 'pending') {
            echo json_encode(['success'=>false,'error'=>'Booking can no longer be cancelled — technician ne already accept kar liya hai']);
            exit;
        }
        $pdo->prepare("UPDATE kwikar_bookings SET status='cancelled' WHERE id=? AND status='pending'")->execute([$id]);
        $pdo->prepare("UPDATE jobs SET status='cancelled' WHERE booking_id=? AND status='new'")->execute([$id]);
        log_info('Booking cancelled by user', ['id' => $id, 'phone' => $phone]);
        echo json_encode(['success'=>true]);
    } catch(PDOException $e) {
        log_error('cancel_booking failed', ['error' => $e->getMessage()]);
        echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
    }
    exit;
}

log_warning('Unknown action', ['action' => $action]);
echo json_encode(['success'=>false,'error'=>'Unknown action']);
