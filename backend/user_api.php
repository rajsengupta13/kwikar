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
    if (!$name || !$phone) {
        echo json_encode(['success'=>false,'error'=>'Name and phone required']);
        exit;
    }
    try {
        $stmt = $pdo->prepare("INSERT INTO kwikar_users (name, phone, address, city, pincode)
            VALUES (?,?,?,?,?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address), city=VALUES(city), pincode=VALUES(pincode), updated_at=NOW()");
        $stmt->execute([$name, $phone, $address, $city, $pincode]);
        log_info('User saved', ['phone' => $phone]);
        echo json_encode(['success'=>true]);
    } catch(PDOException $e) {
        log_error('save_user failed', ['error' => $e->getMessage()]);
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

log_warning('Unknown action', ['action' => $action]);
echo json_encode(['success'=>false,'error'=>'Unknown action']);
