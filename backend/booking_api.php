<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/db.php';

$pdo = db();

$SERVICEABLE_PINCODES = [
    '812001','812002','812003','812004','812005','812006','812007',
    '813102','813201','813202','813203','813204','813205','813206',
    '813207','813210','813211','813212','813213'
];

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) $data = $_POST;

$action = $data['action'] ?? $_GET['action'] ?? '';

if ($action === 'check_pincode') {
    $pincode = trim($data['pincode'] ?? '');
    $available = in_array($pincode, $SERVICEABLE_PINCODES);
    log_info('Pincode checked', ['pincode' => $pincode, 'available' => $available]);
    echo json_encode(['available' => $available]);
    exit;
}

if ($action === 'book') {
    try {
        $pincode   = trim($data['pincode'] ?? '');
        $available = in_array($pincode, $SERVICEABLE_PINCODES) ? 1 : 0;
        $stmt = $pdo->prepare("INSERT INTO kwikar_bookings
            (service, issue, other_issue, slot_time, slot_date, user_name, user_phone, profession, full_address, pincode, pincode_available)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $data['service']      ?? '',
            $data['issue']        ?? '',
            $data['other_issue']  ?? '',
            $data['slot_time']    ?? '',
            $data['slot_date']    ?? '',
            $data['user_name']    ?? '',
            $data['user_phone']   ?? '',
            $data['profession']   ?? '',
            $data['full_address'] ?? '',
            $pincode, $available
        ]);
        $id = $pdo->lastInsertId();
        log_info('Booking created', ['id' => $id, 'service' => $data['service'] ?? '', 'pincode' => $pincode, 'available' => $available]);
        echo json_encode(['success' => true, 'booking_id' => $id, 'available' => (bool)$available]);
    } catch (PDOException $e) {
        log_error('Booking insert failed', ['error' => $e->getMessage(), 'data' => $data]);
        echo json_encode(['success' => false, 'error' => 'Booking failed: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'save_feedback') {
    try {
        $stmt = $pdo->prepare("INSERT INTO kwikar_area_requests (pincode, user_name, user_phone, profession, wants_service) VALUES (?,?,?,?,?)");
        $wants = ($data['wants_service'] ?? 0) ? 1 : 0;
        $stmt->execute([
            $data['pincode']    ?? '',
            $data['user_name']  ?? '',
            $data['user_phone'] ?? '',
            $data['profession'] ?? '',
            $wants
        ]);
        log_info('Feedback saved', ['pincode' => $data['pincode'] ?? '', 'wants' => $wants]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        log_error('Feedback insert failed', ['error' => $e->getMessage()]);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'save_technician') {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `kwikar_technician_applications` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `phone` VARCHAR(15) NOT NULL,
            `email` VARCHAR(150),
            `skills` TEXT,
            `pincodes` VARCHAR(200),
            `experience` VARCHAR(50),
            `status` VARCHAR(20) DEFAULT 'pending',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        $stmt = $pdo->prepare("INSERT INTO kwikar_technician_applications
            (name, phone, email, skills, pincodes, experience)
            VALUES (?,?,?,?,?,?)");
        $stmt->execute([
            $data['name']       ?? '',
            $data['phone']      ?? '',
            $data['email']      ?? '',
            $data['skills']     ?? '',
            $data['pincodes']   ?? '',
            $data['experience'] ?? ''
        ]);
        $id = $pdo->lastInsertId();
        log_info('Technician application saved', ['id' => $id, 'phone' => $data['phone'] ?? '']);
        echo json_encode(['success' => true, 'id' => $id]);
    } catch (PDOException $e) {
        log_error('Technician application failed', ['error' => $e->getMessage()]);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

log_warning('Unknown action', ['action' => $action]);
echo json_encode(['success' => false, 'error' => 'Unknown action']);
