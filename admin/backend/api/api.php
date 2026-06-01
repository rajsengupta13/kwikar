<?php
// Suppress PHP warnings — prevent them from corrupting JSON output
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

set_exception_handler(function (Throwable $e) {
    if (!headers_sent()) http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
});

try {
    require_once __DIR__ . '/../config/database.php';
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => 'Config load failed: ' . $e->getMessage()]);
    exit;
}

try {
    if (session_status() === PHP_SESSION_NONE) session_start();
} catch (Throwable $e) { /* ignore session errors */ }

$module = $_GET['module'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$raw    = file_get_contents('php://input');
$d      = ($method === 'POST' && $raw) ? (json_decode($raw, true) ?? []) : [];

function dbConn(): PDO {
    static $db = null;
    if (!$db) $db = (new Database())->getConnection();
    return $db;
}

function adminLog(PDO $db, int $adminId, string $action, string $entity = '', string $detail = ''): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $db->prepare("INSERT INTO admin_audit_logs (admin_id, action, entity, detail, ip) VALUES (?,?,?,?,?)")
       ->execute([$adminId, $action, $entity, $detail, $ip]);
}

function jsonOut(array $data): void {
    echo json_encode($data);
    exit;
}

// ── Public: Check if any admin exists ─────────────────────────────────────────
if ($module === 'check_admin') {
    try {
        $db    = dbConn();
        $count = (int) $db->query("SELECT COUNT(*) FROM admins")->fetchColumn();
        jsonOut(['success' => true, 'has_admin' => $count > 0]);
    } catch (Throwable $e) {
        jsonOut(['success' => true, 'has_admin' => false]);
    }
}

// ── Public: Register ──────────────────────────────────────────────────────────
if ($module === 'register') {
    $name  = trim($d['name']  ?? '');
    $email = trim($d['email'] ?? '');
    $pin   = trim($d['pin']   ?? '');

    if (!$name || !$email || !$pin)             jsonOut(['success'=>false,'error'=>'Name, email and PIN are required']);
    if (!filter_var($email,FILTER_VALIDATE_EMAIL)) jsonOut(['success'=>false,'error'=>'Invalid email address']);
    if (!preg_match('/^\d{4,6}$/',$pin))        jsonOut(['success'=>false,'error'=>'PIN must be 4-6 digits']);

    $forceReset = !empty($d['force_reset']);

    try {
        $db = dbConn();

        $count = (int) $db->query("SELECT COUNT(*) FROM admins")->fetchColumn();
        if ($count > 0 && !$forceReset) {
            jsonOut(['success'=>false,'error'=>'Admin already exists. Please login.','can_reset'=>true]);
        }

        // force_reset: delete existing admin account(s) first
        if ($forceReset && $count > 0) {
            $oldUsers = $db->query("SELECT user_id FROM admins")->fetchAll(PDO::FETCH_COLUMN);
            $db->exec("DELETE FROM admins");
            if ($oldUsers) {
                $ph = implode(',', array_fill(0, count($oldUsers), '?'));
                $db->prepare("DELETE FROM users WHERE id IN ($ph) AND role='admin'")->execute($oldUsers);
            }
        }

        $chk = $db->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
        $chk->execute([$email]);
        if ($chk->fetchColumn()) jsonOut(['success'=>false,'error'=>'Email already registered']);

        $hash  = password_hash($pin, PASSWORD_BCRYPT);
        $phone = 'adm' . time();

        $db->prepare("INSERT INTO users (name,phone,email,pass_pin,role,status) VALUES (?,?,?,?,'admin','active')")
           ->execute([$name,$phone,$email,$hash]);
        $userId = (int) $db->lastInsertId();

        $db->prepare("INSERT INTO admins (user_id,is_super) VALUES (?,1)")->execute([$userId]);
        $adminId = (int) $db->lastInsertId();

        $_SESSION['admin_id']      = $adminId;
        $_SESSION['admin_user_id'] = $userId;

        try {
            $db->prepare("UPDATE admins SET last_ip=? WHERE id=?")->execute([$_SERVER['REMOTE_ADDR']??'',$adminId]);
            adminLog($db,$adminId,'Admin Registered',"user:$userId",'');
        } catch (Throwable $e) {}

        jsonOut(['success'=>true,'admin'=>['id'=>$adminId,'user_id'=>$userId,'name'=>$name,'email'=>$email,'is_super'=>true]]);
    } catch (Throwable $e) {
        jsonOut(['success'=>false,'error'=>'Registration failed: '.$e->getMessage()]);
    }
}

// ── Public: Login ─────────────────────────────────────────────────────────────
if ($module === 'login') {
    $email = trim($d['email'] ?? '');
    $pin   = trim($d['pin']   ?? '');

    if (!$email || !$pin) jsonOut(['success'=>false,'error'=>'Email and PIN required']);

    try {
        $db = dbConn();
        $st = $db->prepare("
            SELECT u.id, u.name, u.email, u.pass_pin, u.status, a.id AS admin_id, a.is_super
            FROM   users u
            JOIN   admins a ON a.user_id = u.id
            WHERE  u.email = ? AND u.role = 'admin'
            LIMIT  1
        ");
        $st->execute([$email]);
        $user = $st->fetch();

        if (!$user)                                   jsonOut(['success'=>false,'error'=>'Admin account not found']);
        if ($user['status']==='blocked')              jsonOut(['success'=>false,'error'=>'Account blocked']);
        if (!password_verify($pin,$user['pass_pin'])) jsonOut(['success'=>false,'error'=>'Incorrect PIN']);

        $_SESSION['admin_id']      = (int)$user['admin_id'];
        $_SESSION['admin_user_id'] = (int)$user['id'];

        try {
            $db->prepare("UPDATE users SET last_login_at=NOW() WHERE id=?")->execute([$user['id']]);
            $db->prepare("UPDATE admins SET last_ip=? WHERE id=?")->execute([$_SERVER['REMOTE_ADDR']??'',$user['admin_id']]);
            adminLog($db,$user['admin_id'],'Admin Login','user:'.$user['id'],'');
        } catch (Throwable $e) {}

        jsonOut(['success'=>true,'admin'=>['id'=>(int)$user['admin_id'],'user_id'=>(int)$user['id'],'name'=>$user['name'],'email'=>$user['email'],'is_super'=>(bool)$user['is_super']]]);
    } catch (Throwable $e) {
        jsonOut(['success'=>false,'error'=>'Login failed: '.$e->getMessage()]);
    }
}

if ($module === 'logout') {
    try {
        if (isset($_SESSION['admin_id'])) adminLog(dbConn(),$_SESSION['admin_id'],'Admin Logout','','');
        session_destroy();
    } catch (Throwable $e) {}
    jsonOut(['success'=>true]);
}

// ── Auth guard ────────────────────────────────────────────────────────────────
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$adminId     = (int) $_SESSION['admin_id'];
$adminUserId = (int) $_SESSION['admin_user_id'];
$db          = dbConn();

// ── Dashboard ─────────────────────────────────────────────────────────────────
switch ($module) {

    case 'dashboard':
        $today = date('Y-m-d');
        $stats = [];

        // Each query wrapped in try/catch — tables may not exist on fresh install
        $safeCount = function(string $sql, array $params = []) use ($db): int {
            try {
                $st = $db->prepare($sql); $st->execute($params);
                return (int) $st->fetchColumn();
            } catch (Throwable $e) { return 0; }
        };
        $safeSum = function(string $sql, array $params = []) use ($db): float {
            try {
                $st = $db->prepare($sql); $st->execute($params);
                return (float) ($st->fetchColumn() ?: 0);
            } catch (Throwable $e) { return 0.0; }
        };

        $stats['total_customers']    = $safeCount("SELECT COUNT(*) FROM users WHERE role='customer'");
        $stats['total_technicians']  = $safeCount("SELECT COUNT(*) FROM users WHERE role='technician'");
        $stats['total_abds']         = $safeCount("SELECT COUNT(*) FROM users WHERE role='abd'");
        $stats['online_technicians'] = $safeCount("SELECT COUNT(*) FROM technicians WHERE availability_status='online'");
        $stats['total_bookings']     = $safeCount("SELECT COUNT(*) FROM bookings");
        $stats['bookings_today']     = $safeCount("SELECT COUNT(*) FROM bookings WHERE DATE(created_at)=?", [$today]);
        $stats['live_services']      = $safeCount("SELECT COUNT(*) FROM bookings WHERE status IN ('ongoing','assigned','arrived')");
        $stats['completed_bookings'] = $safeCount("SELECT COUNT(*) FROM bookings WHERE status='completed'");
        $stats['cancelled_bookings'] = $safeCount("SELECT COUNT(*) FROM bookings WHERE status='cancelled'");
        $stats['pending_payouts']    = $safeCount("SELECT COUNT(*) FROM withdrawal_requests WHERE status='pending'");
        $stats['total_paid_out']     = $safeSum("SELECT COALESCE(SUM(amount),0) FROM withdrawal_requests WHERE status='paid'");
        $stats['pending_kyc']        = $safeCount("SELECT COUNT(*) FROM technicians WHERE kyc_status='pending'");

        $recentBookings = [];
        try {
            $st = $db->query("
                SELECT b.booking_code, b.status, b.created_at,
                       u.name AS customer_name, s.name AS service_name
                FROM   bookings b
                JOIN   customers c ON b.customer_id = c.id
                JOIN   users u     ON c.user_id = u.id
                JOIN   services s  ON b.service_id = s.id
                ORDER  BY b.created_at DESC LIMIT 10
            ");
            $recentBookings = $st->fetchAll();
        } catch (Throwable $e) {}

        echo json_encode([
            'status'          => 'success',
            'stats'           => $stats,
            'recent_bookings' => $recentBookings,
        ]);
        break;

    case 'technicians':
        $status = $_GET['status'] ?? 'all';
        $limit  = min((int)($_GET['limit'] ?? 50), 200);
        $offset = (int)($_GET['offset'] ?? 0);

        $where = "WHERE u.role = 'technician'";
        $params = [];
        if ($status !== 'all') {
            $where .= " AND t.status = ?";
            $params[] = $status;
        }

        $st = $db->prepare("
            SELECT u.id AS user_id, u.name, u.phone, u.email, u.status AS user_status,
                   t.id AS technician_id, t.rating, t.total_jobs, t.kyc_status,
                   t.availability_status, t.wallet_balance, t.status, t.created_at,
                   GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS services,
                   GROUP_CONCAT(DISTINCT p.pincode ORDER BY p.pincode SEPARATOR ', ') AS pincodes,
                   a.id AS abd_id, au.name AS abd_name
            FROM   users u
            JOIN   technicians t ON t.user_id = u.id
            LEFT JOIN technician_services ts ON ts.technician_id = t.id
            LEFT JOIN services s             ON ts.service_id = s.id
            LEFT JOIN technician_pincodes tp ON tp.technician_id = t.id
            LEFT JOIN pincodes p             ON tp.pincode_id = p.id
            LEFT JOIN referral_relationships rr ON rr.technician_id = t.id
            LEFT JOIN abds a    ON a.id = rr.abd_id
            LEFT JOIN users au  ON au.id = a.user_id
            $where
            GROUP BY t.id, u.id, a.id, au.id
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $params[] = $limit;
        $params[] = $offset;
        $st->execute($params);
        $techs = $st->fetchAll();

        $cSt = $db->query("SELECT COUNT(*) AS cnt FROM technicians");
        $total = (int) $cSt->fetch()['cnt'];

        echo json_encode(['status' => 'success', 'technicians' => $techs, 'total' => $total]);
        break;

    case 'customers':
        $limit  = min((int)($_GET['limit'] ?? 50), 200);
        $offset = (int)($_GET['offset'] ?? 0);

        $st = $db->prepare("
            SELECT u.id, u.name, u.phone, u.email, u.status, u.created_at,
                   c.id AS customer_id, c.total_bookings,
                   COUNT(b.id) AS actual_bookings,
                   COALESCE(SUM(b.final_amount), 0) AS total_spent
            FROM   users u
            JOIN   customers c  ON c.user_id = u.id
            LEFT JOIN bookings b ON b.customer_id = c.id
            WHERE  u.role = 'customer'
            GROUP  BY u.id, c.id
            ORDER  BY u.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $st->execute([$limit, $offset]);
        $customers = $st->fetchAll();

        $cSt = $db->query("SELECT COUNT(*) AS cnt FROM customers");
        $total = (int) $cSt->fetch()['cnt'];

        echo json_encode(['status' => 'success', 'customers' => $customers, 'total' => $total]);
        break;

    case 'abds':
        $st = $db->query("
            SELECT u.id AS user_id, u.name, u.phone, u.email, u.status AS user_status,
                   a.id AS abd_id, a.wallet_balance, a.status, a.direct_commission_percent,
                   a.indirect_commission_percent, a.created_at,
                   COUNT(DISTINCT t.id) AS tech_count,
                   COUNT(DISTINCT ap.pincode_id) AS pincode_count,
                   COALESCE(SUM(ac.amount), 0) AS total_earned
            FROM   users u
            JOIN   abds a ON a.user_id = u.id
            LEFT JOIN referral_relationships rr ON rr.abd_id = a.id
            LEFT JOIN technicians t ON t.id = rr.technician_id
            LEFT JOIN abd_pincodes ap ON ap.abd_id = a.id
            LEFT JOIN abd_commissions ac ON ac.abd_id = a.id AND ac.type = 'credit'
            WHERE  u.role = 'abd'
            GROUP  BY a.id, u.id
            ORDER  BY total_earned DESC
        ");
        $abds = $st->fetchAll();

        echo json_encode(['status' => 'success', 'abds' => $abds]);
        break;

    case 'bookings':
        $status = $_GET['status'] ?? 'all';
        $limit  = min((int)($_GET['limit'] ?? 50), 200);
        $offset = (int)($_GET['offset'] ?? 0);

        $where  = '';
        $params = [];
        if ($status !== 'all') {
            $where = "AND b.status = ?";
            $params[] = $status;
        }

        $st = $db->prepare("
            SELECT b.id, b.booking_code, b.status, b.preferred_date, b.preferred_time,
                   b.final_amount, b.created_at,
                   cu.name AS customer_name, cu.phone AS customer_phone,
                   s.name AS service_name,
                   tu.name AS tech_name, tu.phone AS tech_phone,
                   a.address_line AS address, p.pincode, p.city
            FROM   bookings b
            JOIN   customers c ON b.customer_id = c.id
            JOIN   users cu    ON c.user_id = cu.id
            JOIN   services s  ON b.service_id = s.id
            JOIN   addresses a ON b.address_id = a.id
            JOIN   pincodes p  ON a.pincode_id = p.id
            LEFT JOIN technicians t  ON b.assigned_technician_id = t.id
            LEFT JOIN users tu       ON t.user_id = tu.id
            WHERE  1=1 $where
            ORDER  BY b.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $params[] = $limit;
        $params[] = $offset;
        $st->execute($params);
        $bookings = $st->fetchAll();

        $cSt = $db->query("SELECT COUNT(*) AS cnt FROM bookings");
        $total = (int) $cSt->fetch()['cnt'];

        echo json_encode(['status' => 'success', 'bookings' => $bookings, 'total' => $total]);
        break;

    case 'notifications':
        // Send notification to users
        $target  = $d['target']  ?? 'all';   // all | technicians | abds | customers
        $title   = trim($d['title']   ?? '');
        $message = trim($d['message'] ?? '');
        $ntype   = $d['type']    ?? 'system';

        if (!$title || !$message) {
            echo json_encode(['status' => 'error', 'message' => 'Title and message required']);
            break;
        }

        $roleMap = ['technicians' => 'technician', 'abds' => 'abd', 'customers' => 'customer'];
        $role    = $roleMap[$target] ?? null;

        $where  = $role ? "WHERE role = ?" : "WHERE role IN ('customer','technician','abd')";
        $params = $role ? [$role] : [];

        $st = $db->prepare("SELECT id FROM users $where");
        $st->execute($params);
        $userIds = $st->fetchAll(PDO::FETCH_COLUMN);

        $ins = $db->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)");
        foreach ($userIds as $uid) {
            $ins->execute([$uid, $title, $message, $ntype]);
        }

        adminLog($db, $adminId, 'Send Notification', $target, "Title: $title | Sent to " . count($userIds) . " users");

        echo json_encode(['status' => 'success', 'sent_to' => count($userIds)]);
        break;

    case 'audit_logs':
        $limit  = min((int)($_GET['limit'] ?? 50), 200);
        $offset = (int)($_GET['offset'] ?? 0);

        $st = $db->prepare("
            SELECT al.*, u.name AS admin_name, u.email AS admin_email
            FROM   admin_audit_logs al
            JOIN   admins a  ON a.id = al.admin_id
            JOIN   users u   ON u.id = a.user_id
            ORDER  BY al.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $st->execute([$limit, $offset]);
        $logs = $st->fetchAll();

        echo json_encode(['status' => 'success', 'logs' => $logs]);
        break;

    case 'customer_action':
        $action = $d['action']    ?? '';
        $userId = (int)($d['user_id'] ?? 0);
        if (!$userId) { echo json_encode(['status'=>'error','message'=>'user_id required']); break; }

        if ($action === 'block') {
            $db->prepare("UPDATE users SET status='blocked' WHERE id=? AND role='customer'")->execute([$userId]);
            adminLog($db, $adminId, 'Block Customer', "user:$userId", '');
            echo json_encode(['status'=>'success']);
        } elseif ($action === 'unblock') {
            $db->prepare("UPDATE users SET status='active' WHERE id=? AND role='customer'")->execute([$userId]);
            adminLog($db, $adminId, 'Unblock Customer', "user:$userId", '');
            echo json_encode(['status'=>'success']);
        } else {
            echo json_encode(['status'=>'error','message'=>'Unknown action']);
        }
        break;

    case 'technician_action':
        $action   = $d['action']       ?? '';
        $techId   = (int)($d['tech_id'] ?? 0);
        if (!$techId) { echo json_encode(['status' => 'error', 'message' => 'tech_id required']); break; }

        if ($action === 'suspend') {
            $db->prepare("UPDATE technicians SET status='blocked' WHERE id=?")->execute([$techId]);
            $db->prepare("UPDATE users SET status='blocked' WHERE id=(SELECT user_id FROM technicians WHERE id=?)")->execute([$techId]);
            adminLog($db, $adminId, 'Suspend Technician', "tech:$techId", '');
            echo json_encode(['status' => 'success']);
        } elseif ($action === 'activate') {
            $db->prepare("UPDATE technicians SET status='active' WHERE id=?")->execute([$techId]);
            $db->prepare("UPDATE users SET status='active' WHERE id=(SELECT user_id FROM technicians WHERE id=?)")->execute([$techId]);
            adminLog($db, $adminId, 'Activate Technician', "tech:$techId", '');
            echo json_encode(['status' => 'success']);
        } elseif ($action === 'approve_kyc') {
            $db->prepare("UPDATE technicians SET kyc_status='verified' WHERE id=?")->execute([$techId]);
            adminLog($db, $adminId, 'Approve KYC', "tech:$techId", '');
            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Unknown action']);
        }
        break;

    case 'abd_action':
        $action = $d['action']     ?? '';
        $abdId  = (int)($d['abd_id'] ?? 0);
        if (!$abdId) { echo json_encode(['status' => 'error', 'message' => 'abd_id required']); break; }

        if ($action === 'suspend') {
            $db->prepare("UPDATE abds SET status='blocked' WHERE id=?")->execute([$abdId]);
            $db->prepare("UPDATE users SET status='blocked' WHERE id=(SELECT user_id FROM abds WHERE id=?)")->execute([$abdId]);
            adminLog($db, $adminId, 'Suspend ABD', "abd:$abdId", '');
            echo json_encode(['status' => 'success']);
        } elseif ($action === 'activate') {
            $db->prepare("UPDATE abds SET status='active' WHERE id=?")->execute([$abdId]);
            $db->prepare("UPDATE users SET status='active' WHERE id=(SELECT user_id FROM abds WHERE id=?)")->execute([$abdId]);
            adminLog($db, $adminId, 'Activate ABD', "abd:$abdId", '');
            echo json_encode(['status' => 'success']);
        } elseif ($action === 'update_commission') {
            $pct = (float)($d['percent'] ?? 12.5);
            $db->prepare("UPDATE abds SET direct_commission_percent=? WHERE id=?")->execute([$pct, $abdId]);
            adminLog($db, $adminId, 'Update Commission', "abd:$abdId", "New rate: $pct%");
            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Unknown action']);
        }
        break;

    case 'payout_action':
        $action    = $d['action']        ?? '';
        $requestId = (int)($d['request_id'] ?? 0);
        if (!$requestId) { echo json_encode(['status' => 'error', 'message' => 'request_id required']); break; }

        if ($action === 'approve') {
            $db->prepare("UPDATE withdrawal_requests SET status='paid', processed_at=NOW() WHERE id=?")->execute([$requestId]);
            adminLog($db, $adminId, 'Approve Payout', "wr:$requestId", '');
            echo json_encode(['status' => 'success']);
        } elseif ($action === 'reject') {
            // Refund to wallet
            $st = $db->prepare("SELECT user_id, wallet_id, amount FROM withdrawal_requests WHERE id=?");
            $st->execute([$requestId]);
            $wr = $st->fetch();
            if ($wr) {
                $db->prepare("UPDATE wallets SET balance = balance + ? WHERE id=?")->execute([$wr['amount'], $wr['wallet_id']]);
                $db->prepare("INSERT INTO wallet_transactions (wallet_id, reference_type, transaction_type, amount, note) VALUES (?, 'withdrawal', 'credit', ?, 'Withdrawal rejected — refunded')")->execute([$wr['wallet_id'], $wr['amount']]);
            }
            $db->prepare("UPDATE withdrawal_requests SET status='rejected', processed_at=NOW() WHERE id=?")->execute([$requestId]);
            adminLog($db, $adminId, 'Reject Payout', "wr:$requestId", '');
            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Unknown action']);
        }
        break;

    case 'stats_live':
        // Wrap in try/catch — tables may not exist yet on fresh install
        $online = 0; $live = 0; $today = 0;
        try { $online = (int)$db->query("SELECT COUNT(*) FROM technicians WHERE availability_status='online'")->fetchColumn(); } catch(Throwable $e) {}
        try { $live   = (int)$db->query("SELECT COUNT(*) FROM bookings WHERE status IN ('ongoing','assigned','arrived')")->fetchColumn(); } catch(Throwable $e) {}
        try { $today  = (int)$db->query("SELECT COUNT(*) FROM bookings WHERE DATE(created_at)=CURDATE()")->fetchColumn(); } catch(Throwable $e) {}
        echo json_encode(['status' => 'success', 'success' => true, 'online_techs' => $online, 'live_services' => $live, 'bookings_today' => $today]);
        break;

    case 'services_list':
        $rows = $db->query("SELECT id, name FROM services ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
        $abdsAll = $db->query("SELECT a.id AS abd_id, u.name FROM abds a JOIN users u ON u.id=a.user_id WHERE a.status='active' ORDER BY u.name")->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status'=>'success','services'=>$rows,'abds'=>$abdsAll]);
        break;

    case 'create_abd':
        $name  = trim($d['name']  ?? '');
        $phone = trim($d['phone'] ?? '');
        $email = trim($d['email'] ?? '');
        $pin   = trim($d['pin']   ?? '');
        if (!$name || !$phone || !$pin) { echo json_encode(['status'=>'error','message'=>'Name, phone and PIN are required']); break; }
        if ($pin && !preg_match('/^\d{4,6}$/', $pin)) { echo json_encode(['status'=>'error','message'=>'PIN must be 4-6 digits']); break; }

        $exists = $db->prepare("SELECT id FROM users WHERE phone=?"); $exists->execute([$phone]);
        if ($exists->fetch()) { echo json_encode(['status'=>'error','message'=>'Phone number already registered']); break; }

        $db->beginTransaction();
        try {
            $db->prepare("INSERT INTO users (name,phone,email,pass_pin,role,status) VALUES (?,?,?,?,?,?)")
               ->execute([$name, $phone, $email ?: null, password_hash($pin, PASSWORD_DEFAULT), 'abd', 'active']);
            $userId = (int)$db->lastInsertId();
            $db->prepare("INSERT INTO abds (user_id,status) VALUES (?,?)")->execute([$userId, 'active']);
            $abdId = (int)$db->lastInsertId();
            adminLog($db, $adminId, 'Create ABD', "abd:$abdId", "Name: $name");
            $db->commit();
            echo json_encode(['status'=>'success','abd_id'=>$abdId]);
        } catch (Throwable $e) {
            $db->rollBack();
            echo json_encode(['status'=>'error','message'=>'Failed to create ABD: '.$e->getMessage()]);
        }
        break;

    case 'create_technician':
        $name      = trim($d['name']    ?? '');
        $phone     = trim($d['phone']   ?? '');
        $email     = trim($d['email']   ?? '');
        $pin       = trim($d['pin']     ?? '');
        $abdId     = !empty($d['abd_id'])  ? (int)$d['abd_id']  : null;
        $serviceIds = $d['service_ids'] ?? [];
        if (!$name || !$phone || !$pin) { echo json_encode(['status'=>'error','message'=>'Name, phone and PIN are required']); break; }
        if (!preg_match('/^\d{4,6}$/', $pin)) { echo json_encode(['status'=>'error','message'=>'PIN must be 4-6 digits']); break; }

        $exists = $db->prepare("SELECT id FROM users WHERE phone=?"); $exists->execute([$phone]);
        if ($exists->fetch()) { echo json_encode(['status'=>'error','message'=>'Phone number already registered']); break; }

        $db->beginTransaction();
        try {
            $db->prepare("INSERT INTO users (name,phone,email,pass_pin,role,status) VALUES (?,?,?,?,?,?)")
               ->execute([$name, $phone, $email ?: null, password_hash($pin, PASSWORD_DEFAULT), 'technician', 'active']);
            $userId = (int)$db->lastInsertId();
            $db->prepare("INSERT INTO technicians (user_id,joined_source,status,abd_id) VALUES (?,?,?,?)")
               ->execute([$userId, $abdId ? 'abd_direct' : 'website', 'active', $abdId]);
            $techId = (int)$db->lastInsertId();

            foreach ((array)$serviceIds as $sid) {
                $sid = (int)$sid;
                if ($sid > 0) {
                    $db->prepare("INSERT IGNORE INTO technician_services (technician_id,service_id) VALUES (?,?)")->execute([$techId,$sid]);
                }
            }

            if ($abdId) {
                $db->prepare("INSERT IGNORE INTO referral_relationships (technician_id,parent_technician_id,abd_id,referral_level,relationship_type) VALUES (?,NULL,?,1,'direct_abd')")
                   ->execute([$techId, $abdId]);
            }

            adminLog($db, $adminId, 'Create Technician', "tech:$techId", "Name: $name");
            $db->commit();
            echo json_encode(['status'=>'success','tech_id'=>$techId]);
        } catch (Throwable $e) {
            $db->rollBack();
            echo json_encode(['status'=>'error','message'=>'Failed to create technician: '.$e->getMessage()]);
        }
        break;

    case 'referral_tree':
        // Build full referral network tree using technicians.abd_id + referred_by
        // This covers both admin-added and referral-added members
        $db = dbConn();

        // All ABDs — every ABD appears under Super Admin regardless of how they were added
        $abdRows = $db->query("
            SELECT a.id AS abd_id, u.name, u.status AS user_status, a.status,
                   a.wallet_balance AS earnings,
                   (SELECT p.city FROM abd_pincodes ap2
                    JOIN pincodes p ON p.id = ap2.pincode_id
                    WHERE ap2.abd_id = a.id LIMIT 1) AS city
            FROM abds a
            JOIN users u ON u.id = a.user_id
            WHERE u.role = 'abd'
            ORDER BY a.id
        ")->fetchAll(PDO::FETCH_ASSOC);

        // All technicians — use t.abd_id and t.referred_by directly (set by admin on creation)
        $techRows = $db->query("
            SELECT t.id AS tech_id, u.name, t.status,
                   t.wallet_balance AS earnings,
                   t.abd_id,
                   t.referred_by,
                   GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS cat
            FROM technicians t
            JOIN users u ON u.id = t.user_id
            LEFT JOIN technician_services ts ON ts.technician_id = t.id
            LEFT JOIN services s ON ts.service_id = s.id
            GROUP BY t.id, u.id
            ORDER BY t.id
        ")->fetchAll(PDO::FETCH_ASSOC);

        // Build tech map indexed by tech_id
        $techMap = [];
        foreach ($techRows as $t) {
            $techMap[(int)$t['tech_id']] = [
                'id'          => 'tech_' . $t['tech_id'],
                'name'        => $t['name'],
                'role'        => 'tech',
                'status'      => $t['status'],
                'earnings'    => (int)$t['earnings'],
                'refs'        => 0,
                'cat'         => $t['cat'] ?: '',
                'abd_id'      => $t['abd_id'] !== null ? (int)$t['abd_id'] : null,
                'referred_by' => $t['referred_by'] !== null ? (int)$t['referred_by'] : null,
                'children'    => [],
            ];
        }

        // Count direct referrals each tech made
        foreach ($techMap as $id => $tech) {
            if ($tech['referred_by'] !== null && isset($techMap[$tech['referred_by']])) {
                $techMap[$tech['referred_by']]['refs']++;
            }
        }

        // Recursively build children for a given parent tech id
        function buildTechChildren(int $parentId, array &$techMap): array {
            $children = [];
            foreach ($techMap as $id => $tech) {
                if ($tech['referred_by'] === $parentId) {
                    $node = $tech;
                    $node['children'] = buildTechChildren($id, $techMap);
                    $children[] = $node;
                }
            }
            return $children;
        }

        // Build ABD nodes
        $abdNodes = [];
        foreach ($abdRows as $a) {
            $abdId = (int)$a['abd_id'];

            // Direct techs under this ABD (referred_by is NULL — added directly by admin or via ABD link)
            $directTechs = [];
            foreach ($techMap as $id => $tech) {
                if ($tech['abd_id'] === $abdId && $tech['referred_by'] === null) {
                    $node = $tech;
                    $node['children'] = buildTechChildren($id, $techMap);
                    $directTechs[] = $node;
                }
            }

            // Count all techs under this ABD (direct + indirect)
            $allUnder = array_filter($techMap, fn($t) => $t['abd_id'] === $abdId);

            $abdNodes[] = [
                'id'       => 'abd_' . $abdId,
                'name'     => $a['name'],
                'role'     => 'abd',
                'status'   => $a['status'] ?: $a['user_status'],
                'earnings' => (int)$a['earnings'],
                'refs'     => count($allUnder),
                'city'     => $a['city'] ?: '',
                'children' => $directTechs,
            ];
        }

        // Only ABDs are children of Super Admin — unassigned techs are excluded from the tree
        // (they are still visible in the Technicians management page)
        $assignedTechs   = array_filter($techMap, fn($t) => $t['abd_id'] !== null);
        $directTechCount = count(array_filter($assignedTechs, fn($t) => $t['referred_by'] === null));
        $indirectCount   = count(array_filter($assignedTechs, fn($t) => $t['referred_by'] !== null));
        $totalAssigned   = count($assignedTechs);

        $tree = [
            'id'            => 'root',
            'name'          => 'Super Admin',
            'role'          => 'admin',
            'status'        => 'active',
            'earnings'      => 0,
            'refs'          => $totalAssigned,
            'abd_count'     => count($abdNodes),
            'direct_count'  => $directTechCount,
            'indirect_count'=> $indirectCount,
            'children'      => $abdNodes,
        ];

        echo json_encode(['status' => 'success', 'tree' => $tree]);
        break;

    // ── Site Reviews ─────────────────────────────────────────────────────────
    case 'reviews':
        $status = $d['status'] ?? 'all';
        $limit  = min((int)($d['limit']  ?? 50), 200);
        $offset = (int)($d['offset'] ?? 0);
        $where  = in_array($status, ['pending','approved','rejected']) ? "WHERE status = ?" : "";
        $params = $where ? [$status, $limit, $offset] : [$limit, $offset];
        $st = $db->prepare("SELECT id, name, phone, rating, review_text, page_source, status, created_at FROM site_reviews {$where} ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $st->execute($params);
        $st2 = $db->query("SELECT COUNT(*) FROM site_reviews");
        echo json_encode(['status'=>'success','reviews'=>$st->fetchAll(),'total'=>(int)$st2->fetchColumn()]);
        break;

    case 'review_action':
        $reviewId = (int)($d['review_id'] ?? 0);
        $action   = $d['action'] ?? '';
        if (!$reviewId) { echo json_encode(['status'=>'error','message'=>'review_id required']); break; }
        if ($action === 'approve') {
            $db->prepare("UPDATE site_reviews SET status='approved' WHERE id=?")->execute([$reviewId]);
            adminLog($db, $adminId, 'Approve Review', "review:$reviewId", '');
            echo json_encode(['status'=>'success']);
        } elseif ($action === 'reject') {
            $db->prepare("UPDATE site_reviews SET status='rejected' WHERE id=?")->execute([$reviewId]);
            adminLog($db, $adminId, 'Reject Review', "review:$reviewId", '');
            echo json_encode(['status'=>'success']);
        } elseif ($action === 'delete') {
            $db->prepare("DELETE FROM site_reviews WHERE id=?")->execute([$reviewId]);
            adminLog($db, $adminId, 'Delete Review', "review:$reviewId", '');
            echo json_encode(['status'=>'success']);
        } else {
            echo json_encode(['status'=>'error','message'=>'Unknown action']);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => "Unknown module: $module"]);
}
