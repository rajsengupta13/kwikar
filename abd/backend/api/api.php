<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
// Headers FIRST — ensures JSON is always returned even if a require fails
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

// Catch fatal errors (require failures, syntax errors in included files)
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (!headers_sent()) http_response_code(500);
        echo json_encode([
            'success' => false, 'status' => 'error',
            'error'   => 'Server error: ' . $err['message'],
            'message' => 'Server error: ' . $err['message'],
        ]);
    }
});

set_exception_handler(function (Throwable $e) {
    if (!headers_sent()) http_response_code(500);
    echo json_encode([
        'success' => false, 'status' => 'error',
        'error'   => $e->getMessage(),
        'message' => $e->getMessage(),
    ]);
    exit;
});

require_once '../config/database.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$module = $_GET['module'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$d      = $method === 'POST' ? (json_decode(file_get_contents('php://input'), true) ?? []) : [];

function dbConn(): PDO {
    static $db = null;
    if (!$db) {
        $db = (new Database())->getConnection();
        ensureAbdSupportTables($db);
    }
    return $db;
}

function ensureAbdSupportTables(PDO $db): void {
    $db->exec("
        CREATE TABLE IF NOT EXISTS abd_commissions (
            id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            abd_id BIGINT UNSIGNED NOT NULL,
            type ENUM('credit','debit') NOT NULL,
            description VARCHAR(255) DEFAULT NULL,
            amount DECIMAL(12,2) NOT NULL,
            balance_after DECIMAL(12,2) DEFAULT NULL,
            status ENUM('success','pending','paid_out','failed') DEFAULT 'success',
            commission_level TINYINT DEFAULT 1,
            reference_booking_id BIGINT UNSIGNED DEFAULT NULL,
            reference_tech_id BIGINT UNSIGNED DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_abdcomm_abd (abd_id),
            INDEX idx_abdcomm_date (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS abd_bank_details (
            id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            abd_id BIGINT UNSIGNED NOT NULL UNIQUE,
            account_holder VARCHAR(100) DEFAULT NULL,
            account_number VARCHAR(50) DEFAULT NULL,
            ifsc_code VARCHAR(20) DEFAULT NULL,
            bank_name VARCHAR(100) DEFAULT NULL,
            upi_id VARCHAR(100) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS abd_notifications (
            id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            abd_id BIGINT UNSIGNED NOT NULL,
            type ENUM('earning','referral','booking','complaint','payment','system') DEFAULT 'system',
            title VARCHAR(255) NOT NULL,
            message TEXT DEFAULT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_abdnotif_abd (abd_id),
            INDEX idx_abdnotif_read (abd_id, is_read)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

function ensureAbdPincode(PDO $db, string $pincode, string $city): int {
    $db->prepare("
        INSERT INTO pincodes (pincode, city, state, is_serviceable)
        VALUES (?, ?, 'Bihar', 1)
        ON DUPLICATE KEY UPDATE is_serviceable = 1
    ")->execute([$pincode, $city ?: 'Bhagalpur']);

    $st = $db->prepare("SELECT id FROM pincodes WHERE pincode = ? LIMIT 1");
    $st->execute([$pincode]);
    return (int) $st->fetchColumn();
}

function abdRow(PDO $db, int $id): ?array {
    $st = $db->prepare("
        SELECT
            a.id,
            a.user_id,
            u.name AS full_name,
            u.phone,
            u.email,
            COALESCE(MIN(p.city), '') AS area,
            'Bronze' AS level,
            a.wallet_balance AS available_balance,
            COALESCE((
                SELECT SUM(c.amount)
                FROM abd_commissions c
                WHERE c.abd_id = a.id AND c.type = 'credit'
            ), 0) AS total_earnings,
            0 AS rating,
            (u.status = 'active' AND a.status = 'active') AS is_active
        FROM abds a
        JOIN users u ON u.id = a.user_id
        LEFT JOIN abd_pincodes ap ON ap.abd_id = a.id
        LEFT JOIN pincodes p ON p.id = ap.pincode_id
        WHERE a.id = ?
        GROUP BY a.id, a.user_id, u.name, u.phone, u.email, a.wallet_balance, u.status, a.status
        LIMIT 1
    ");
    $st->execute([$id]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: null;
}

function abdByPhone(PDO $db, string $phone): ?array {
    $st = $db->prepare("
        SELECT
            a.id,
            a.user_id,
            u.name AS full_name,
            u.phone,
            u.email,
            u.pass_pin AS pin_hash,
            COALESCE(MIN(p.city), '') AS area,
            'Bronze' AS level,
            a.wallet_balance AS available_balance,
            0 AS rating,
            (u.status = 'active' AND a.status = 'active') AS is_active
        FROM users u
        JOIN abds a ON a.user_id = u.id
        LEFT JOIN abd_pincodes ap ON ap.abd_id = a.id
        LEFT JOIN pincodes p ON p.id = ap.pincode_id
        WHERE u.phone = ? AND u.role = 'abd'
        GROUP BY a.id, a.user_id, u.name, u.phone, u.email, u.pass_pin, a.wallet_balance, u.status, a.status
        LIMIT 1
    ");
    $st->execute([$phone]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: null;
}

function buildAbdResponse(array $row): array {
    return [
        'abd_id'           => (int) $row['id'],
        'user_id'          => (int) ($row['user_id'] ?? $row['id']),
        'full_name'        => $row['full_name'],
        'phone'            => $row['phone'],
        'email'            => $row['email'],
        'area'             => $row['area'] ?? '',
        'status'           => !empty($row['is_active']) ? 'active' : 'inactive',
        'wallet_balance'   => (float) ($row['available_balance'] ?? 0),
        'direct_commission_percent'   => 25.00,
        'indirect_commission_percent' => 10.00,
        'level'            => $row['level'] ?? 'Bronze',
    ];
}

if ($module === 'register') {
    $name     = trim($d['name'] ?? '');
    $phone    = trim($d['phone'] ?? '');
    $email    = trim($d['email'] ?? '');
    $area     = trim($d['area'] ?? '');
    $pin      = trim($d['pin'] ?? '');
    $pincodes = $d['pincodes'] ?? [];

    if (!$name || !$phone || !$email || !$area || !$pin || empty($pincodes)) {
        echo json_encode(['success' => false, 'error' => 'Sabhi required fields bharo']); exit;
    }
    if (!preg_match('/^\d{10}$/', $phone)) {
        echo json_encode(['success' => false, 'error' => 'Valid 10-digit phone daalo']); exit;
    }
    if (!preg_match('/^\d{6}$/', $pin)) {
        echo json_encode(['success' => false, 'error' => '6-digit PIN daalo']); exit;
    }
    if (count($pincodes) > 10) {
        echo json_encode(['success' => false, 'error' => 'Maximum 10 pincodes allowed']); exit;
    }

    $db = dbConn();
    $chk = $db->prepare("SELECT id, role FROM users WHERE phone = ? LIMIT 1");
    $chk->execute([$phone]);
    $existing = $chk->fetch(PDO::FETCH_ASSOC);
    if ($existing && $existing['role'] !== 'abd') {
        echo json_encode(['success' => false, 'error' => 'Is number se pehle se ' . $existing['role'] . ' account hai']); exit;
    }
    if ($existing) {
        echo json_encode(['success' => false, 'error' => 'Is number se pehle se ABD account hai - login karo']); exit;
    }

    $db->beginTransaction();
    try {
        $db->prepare("
            INSERT INTO users (name, phone, email, pass_pin, role, status)
            VALUES (?, ?, ?, ?, 'abd', 'active')
        ")->execute([$name, $phone, $email, password_hash($pin, PASSWORD_DEFAULT)]);
        $userId = (int) $db->lastInsertId();

        $db->prepare("INSERT INTO abds (user_id, status) VALUES (?, 'active')")->execute([$userId]);
        $abdId = (int) $db->lastInsertId();

        $pcStmt = $db->prepare("
            INSERT INTO abd_pincodes (abd_id, pincode_id, is_primary)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE is_primary = VALUES(is_primary)
        ");
        foreach (array_values($pincodes) as $i => $pc) {
            $pc = preg_replace('/\D/', '', trim($pc));
            if (strlen($pc) >= 6) {
                $pincodeId = ensureAbdPincode($db, substr($pc, 0, 10), $area);
                $pcStmt->execute([$abdId, $pincodeId, $i === 0 ? 1 : 0]);
            }
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        throw $e;
    }

    $_SESSION['abd_id'] = $abdId;
    echo json_encode(['success' => true, 'abd_id' => $abdId, 'message' => 'ABD registered successfully']);
    exit;
}

if ($module === 'login') {
    $phone = trim($d['phone'] ?? '');
    $pin   = trim($d['pin'] ?? '');
    if (!$phone || !$pin) {
        echo json_encode(['success' => false, 'error' => 'Phone aur PIN daalo']); exit;
    }

    $db = dbConn();
    $u = abdByPhone($db, $phone);
    if (!$u || !password_verify($pin, $u['pin_hash'])) {
        echo json_encode(['success' => false, 'error' => 'Phone ya PIN galat hai']); exit;
    }
    if (!$u['is_active']) {
        echo json_encode(['success' => false, 'error' => 'Account inactive hai - support se contact karo']); exit;
    }

    $db->prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?")->execute([$u['user_id']]);
    $db->prepare("UPDATE abds SET updated_at = NOW() WHERE id = ?")->execute([$u['id']]);
    $_SESSION['abd_id'] = (int) $u['id'];

    echo json_encode(['success' => true, 'status' => 'success', 'abd' => buildAbdResponse($u)]);
    exit;
}

if ($module === 'setup_session') {
    $phone = trim($d['phone'] ?? '');
    if (!$phone) { echo json_encode(['status' => 'error', 'message' => 'Phone required']); exit; }

    $db = dbConn();
    $u = abdByPhone($db, $phone);
    if ($u) {
        $_SESSION['abd_id'] = (int) $u['id'];
        echo json_encode(['status' => 'success', 'abd' => buildAbdResponse($u)]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'ABD not found']);
    }
    exit;
}

if ($module === 'logout') {
    session_destroy();
    echo json_encode(['status' => 'success']);
    exit;
}

if (!isset($_SESSION['abd_id'])) {
    $ph = trim($_GET['_ph'] ?? '');
    if ($ph) {
        $row = abdByPhone(dbConn(), $ph);
        if ($row && $row['is_active']) $_SESSION['abd_id'] = (int) $row['id'];
    }
}

if (!isset($_SESSION['abd_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$aid = (int) $_SESSION['abd_id'];
$db  = dbConn();
$abd = abdRow($db, $aid);
if (!$abd) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'ABD not found']);
    exit;
}

switch ($module) {
    case 'dashboard':
        $st = $db->prepare("
            SELECT
                COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END), 0) AS total,
                COALESCE(SUM(CASE WHEN type='credit' AND DATE(created_at)=CURDATE() THEN amount ELSE 0 END), 0) AS today,
                COALESCE(SUM(CASE WHEN type='credit' AND MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE()) THEN amount ELSE 0 END), 0) AS this_month,
                COALESCE(SUM(CASE WHEN type='credit' AND commission_level=1 THEN amount ELSE 0 END), 0) AS direct_referral,
                COALESCE(SUM(CASE WHEN type='credit' AND commission_level>1 THEN amount ELSE 0 END), 0) AS indirect_referral
            FROM abd_commissions WHERE abd_id = ?
        ");
        $st->execute([$aid]);
        $earningRow = $st->fetch(PDO::FETCH_ASSOC);

        $st = $db->prepare("SELECT COALESCE(SUM(amount),0) AS t FROM abd_commissions WHERE abd_id=? AND type='debit'");
        $st->execute([$aid]);
        $withdrawn = (float) $st->fetch(PDO::FETCH_ASSOC)['t'];

        $st = $db->prepare("
            SELECT DATE(created_at) AS day, SUM(amount) AS amt
            FROM abd_commissions
            WHERE abd_id = ? AND type = 'credit'
              AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at) ORDER BY day
        ");
        $st->execute([$aid]);
        $chartMap = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $row) $chartMap[$row['day']] = (float) $row['amt'];
        $chartData = []; $chartLabels = [];
        for ($i = 29; $i >= 0; $i--) {
            $day = date('Y-m-d', strtotime("-{$i} days"));
            $chartData[] = $chartMap[$day] ?? 0;
            $chartLabels[] = date('d M', strtotime($day));
        }

        $pcRows = fetchAbdPincodes($db, $aid);
        $totalTechs = 0;
        $totalBookings = 0;

        $st = $db->prepare("
            SELECT id, description AS title, amount, type, commission_level, created_at
            FROM abd_commissions WHERE abd_id = ?
            ORDER BY created_at DESC LIMIT 8
        ");
        $st->execute([$aid]);
        $activity = array_map(function ($r) {
            return [
                'id'         => $r['id'],
                'title'      => $r['description'] ?: ($r['type'] === 'credit' ? 'Commission credited' : 'Withdrawal'),
                'message'    => $r['description'] ?: '',
                'body'       => 'Rs. ' . number_format($r['amount'], 2),
                'type'       => $r['type'] === 'credit' ? 'earning' : 'system',
                'is_read'    => 1,
                'created_at' => $r['created_at'],
            ];
        }, $st->fetchAll(PDO::FETCH_ASSOC));

        echo json_encode([
            'status' => 'success',
            'profile' => buildAbdResponse($abd),
            'stats' => [
                'earnings' => [
                    'total' => (float) $earningRow['total'],
                    'today' => (float) $earningRow['today'],
                    'this_month' => (float) $earningRow['this_month'],
                    'wallet' => (float) $abd['available_balance'],
                    'direct_referral' => (float) $earningRow['direct_referral'],
                    'indirect_referral' => (float) $earningRow['indirect_referral'],
                    'pending' => 0,
                    'total_withdrawals' => $withdrawn,
                ],
                'technicians' => ['total' => $totalTechs, 'direct' => $totalTechs, 'referral' => 0, 'active' => $totalTechs, 'inactive' => 0],
                'bookings' => ['total' => $totalBookings, 'pending' => 0, 'active' => 0, 'completed' => $totalBookings, 'cancelled' => 0],
            ],
            'revenue_chart' => $chartData,
            'chart_labels' => $chartLabels,
            'activity_feed' => $activity,
        ]);
        break;

    case 'technicians':
        $type = $_GET['type'] ?? 'direct';

        // Fetch all technicians linked to this ABD — JOIN users for name/phone
        $stAll = $db->prepare("
            SELECT t.id, t.user_id, t.joined_source, t.experience_years AS experience,
                   t.rating, t.total_jobs AS total_reviews, t.kyc_status, t.availability_status,
                   t.wallet_balance AS available_balance, t.status, t.abd_id, t.referred_by,
                   t.is_featured, t.created_at,
                   u.name AS full_name, u.phone AS mobile, u.email,
                   GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS service_category,
                   GROUP_CONCAT(DISTINCT p.pincode ORDER BY p.pincode SEPARATOR ', ') AS pincodes
            FROM   technicians t
            JOIN   users u ON t.user_id = u.id
            LEFT JOIN technician_services ts ON t.id = ts.technician_id
            LEFT JOIN services s             ON ts.service_id = s.id
            LEFT JOIN technician_pincodes tp ON t.id = tp.technician_id
            LEFT JOIN pincodes p             ON tp.pincode_id = p.id
            WHERE  t.abd_id = ?
            GROUP  BY t.id, u.id
            ORDER  BY t.created_at ASC
        ");
        $stAll->execute([$aid]);
        $allTechs = $stAll->fetchAll(PDO::FETCH_ASSOC);

        if ($type === 'tree') {
            // Use closure to avoid "Cannot redeclare" on repeated requests
            $buildNode = null;
            $buildNode = function(array $t, array $all, int $level) use (&$buildNode): array {
                $ws   = explode(' ', trim($t['full_name'] ?: 'T'));
                $av   = strtoupper(($ws[0][0] ?? '') . ($ws[1][0] ?? ''));
                $kids = array_values(array_filter($all, fn($x) => (int)$x['referred_by'] === (int)$t['id']));
                return [
                    'id'            => 't' . $t['id'],
                    'name'          => $t['full_name'],
                    'role'          => $level === 1 ? 'Direct' : 'Referral',
                    'avatar'        => $av ?: 'T',
                    'skill'         => $t['service_category'] ?: 'N/A',
                    'earnings'      => 0,
                    'abdCommission' => 0,
                    'commPct'       => $level === 1 ? 25 : 10,
                    'level'         => $level,
                    'status'        => 'active',
                    'children'      => array_map(fn($c) => $buildNode($c, $all, $level + 1), $kids),
                ];
            };
            $direct = array_values(array_filter($allTechs, fn($t) => !(int)$t['referred_by']));
            $ws2 = explode(' ', trim($abd['full_name'] ?: 'ABD'));
            $av2 = strtoupper(($ws2[0][0] ?? '') . ($ws2[1][0] ?? ''));
            echo json_encode([
                'status' => 'success',
                'tree'   => [
                    'id'            => 'abd-' . $aid,
                    'name'          => $abd['full_name'],
                    'role'          => 'ABD',
                    'avatar'        => $av2 ?: 'AU',
                    'skill'         => 'Area Director',
                    'earnings'      => (float) $abd['total_earnings'],
                    'abdCommission' => (float) $abd['total_earnings'],
                    'level'         => 0,
                    'status'        => 'active',
                    'children'      => array_map(fn($t) => $buildNode($t, $allTechs, 1), $direct),
                ],
            ]);

        } elseif ($type === 'auto') {
            $pending = array_values(array_filter($allTechs, fn($t) => ($t['kyc_status'] ?? '') !== 'verified'));
            echo json_encode(['status' => 'success', 'technicians' => $pending]);

        } else {
            // direct = no referred_by, referral = has referred_by
            $rows = $type === 'referral'
                ? array_values(array_filter($allTechs, fn($t) => (int)$t['referred_by'] > 0))
                : array_values(array_filter($allTechs, fn($t) => !(int)$t['referred_by']));

            $techs = array_map(function ($t) use ($allTechs) {
                $refCount = count(array_filter($allTechs, fn($x) => (int)$x['referred_by'] === (int)$t['id']));
                return [
                    'id'                  => (int)  $t['id'],
                    'full_name'           =>         $t['full_name'],
                    'mobile'              =>         $t['mobile'],
                    'email'               =>         $t['email'],
                    'service_category'    =>         $t['service_category'],
                    'pincodes'            =>         $t['pincodes'],
                    'experience_years'    =>         $t['experience'],
                    'rating'              => (float) $t['rating'],
                    'total_jobs'          => (int)   $t['total_reviews'],
                    'kyc_status'          =>         ($t['kyc_status'] ?? '') === 'verified' ? 'verified' : 'pending',
                    'availability_status' =>         $t['availability_status'] ?? 'offline',
                    'status'              =>         $t['status'] ?? 'active',
                    'commission_earned'   =>         0,
                    'referral_count'      => (int)   $refCount,
                    'created_at'          =>         $t['created_at'],
                ];
            }, $rows);
            echo json_encode(['status' => 'success', 'technicians' => $techs]);
        }
        break;

    case 'bookings':
        echo json_encode(['status' => 'success', 'bookings' => []]);
        break;

    case 'earnings':
        $st = $db->prepare("
            SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END),0) AS total,
                   COALESCE(SUM(CASE WHEN type='credit' AND MONTH(created_at)=MONTH(CURDATE()) THEN amount ELSE 0 END),0) AS month,
                   COALESCE(SUM(CASE WHEN type='credit' AND commission_level=1 THEN amount ELSE 0 END),0) AS direct,
                   COALESCE(SUM(CASE WHEN type='credit' AND commission_level>1 THEN amount ELSE 0 END),0) AS indirect,
                   COALESCE(SUM(CASE WHEN type='debit' THEN amount ELSE 0 END),0) AS withdrawn
            FROM abd_commissions WHERE abd_id = ?
        ");
        $st->execute([$aid]);
        $s = $st->fetch(PDO::FETCH_ASSOC);

        $st = $db->prepare("SELECT * FROM abd_commissions WHERE abd_id=? ORDER BY created_at DESC LIMIT 20");
        $st->execute([$aid]);
        $txns = array_map(function ($t) {
            return [
                'id' => $t['id'],
                'amount' => (float) $t['amount'],
                'commission_type' => $t['commission_level'] > 1 ? 'indirect_abd' : 'direct_abd',
                'note' => $t['description'],
                'tech_name' => null,
                'created_at' => $t['created_at'],
                'type' => $t['type'] === 'credit' ? 'credit' : 'debit',
            ];
        }, $st->fetchAll(PDO::FETCH_ASSOC));

        echo json_encode([
            'status' => 'success',
            'stats' => [
                'total' => (float) $s['total'],
                'this_month' => (float) $s['month'],
                'wallet_balance' => (float) $abd['available_balance'],
                'direct_referral' => (float) $s['direct'],
                'indirect_referral' => (float) $s['indirect'],
                'total_withdrawals' => (float) $s['withdrawn'],
                'pending' => 0,
            ],
            'revenue_chart' => array_fill(0, 30, 0),
            'transactions' => $txns,
        ]);
        break;

    case 'notifications':
        $action = $d['action'] ?? '';

        if ($action === 'mark_read') {
            $nid = (int)($d['id'] ?? 0);
            if ($nid) $db->prepare("UPDATE abd_notifications SET is_read=1 WHERE id=? AND abd_id=?")->execute([$nid, $aid]);
            echo json_encode(['status' => 'success']); break;
        }
        if ($action === 'mark_all_read') {
            $db->prepare("UPDATE abd_notifications SET is_read=1 WHERE abd_id=?")->execute([$aid]);
            echo json_encode(['status' => 'success']); break;
        }

        // Auto-seed notifications from real events if table is empty for this ABD
        $countSt = $db->prepare("SELECT COUNT(*) FROM abd_notifications WHERE abd_id=?");
        $countSt->execute([$aid]);
        if ((int)$countSt->fetchColumn() === 0) {
            // From commissions
            $cSt = $db->prepare("SELECT id, description, amount, type, commission_level, reference_tech_id, created_at FROM abd_commissions WHERE abd_id=? ORDER BY created_at DESC LIMIT 20");
            $cSt->execute([$aid]);
            $ins = $db->prepare("INSERT INTO abd_notifications (abd_id, type, title, message, is_read, created_at) VALUES (?,?,?,?,0,?)");
            foreach ($cSt->fetchAll(PDO::FETCH_ASSOC) as $c) {
                if ($c['type'] === 'credit') {
                    $lvl   = (int)$c['commission_level'] > 1 ? 'indirect' : 'direct';
                    $title = 'Commission credited — ₹' . number_format((float)$c['amount'], 2);
                    $msg   = $c['description'] ?: ucfirst($lvl) . ' referral commission received';
                    $type  = (int)$c['commission_level'] > 1 ? 'referral' : 'earning';
                } else {
                    $title = 'Withdrawal processed — ₹' . number_format((float)$c['amount'], 2);
                    $msg   = $c['description'] ?: 'Wallet withdrawal completed';
                    $type  = 'payment';
                }
                $ins->execute([$aid, $type, $title, $msg, $c['created_at']]);
            }

            // From technician registrations under this ABD
            $tSt = $db->prepare("SELECT u.name, t.created_at FROM technicians t JOIN users u ON u.id=t.user_id WHERE t.abd_id=? ORDER BY t.created_at DESC LIMIT 10");
            $tSt->execute([$aid]);
            foreach ($tSt->fetchAll(PDO::FETCH_ASSOC) as $t) {
                $ins->execute([$aid, 'referral', 'New technician joined — ' . $t['name'], $t['name'] . ' registered under your referral network', $t['created_at']]);
            }
        }

        $nSt = $db->prepare("SELECT id, type, title, message, is_read, created_at FROM abd_notifications WHERE abd_id=? ORDER BY created_at DESC LIMIT 50");
        $nSt->execute([$aid]);
        $notifs = array_map(function($n) {
            return [
                'id'         => (int)$n['id'],
                'type'       => $n['type'],
                'title'      => $n['title'],
                'message'    => $n['message'],
                'body'       => $n['message'],
                'is_read'    => (bool)$n['is_read'],
                'created_at' => date('d M, g:i A', strtotime($n['created_at'])),
            ];
        }, $nSt->fetchAll(PDO::FETCH_ASSOC));

        $unread = count(array_filter($notifs, fn($n) => !$n['is_read']));
        echo json_encode(['status' => 'success', 'notifications' => $notifs, 'unread_count' => $unread]);
        break;

    case 'complaints':
        echo json_encode(['status' => 'success', 'complaints' => []]);
        break;

    case 'pincodes':
        echo json_encode(['status' => 'success', 'pincodes' => fetchAbdPincodes($db, $aid)]);
        break;

    case 'profile':
        if ($method === 'GET') {
            $row = buildAbdResponse($abd);
            $st = $db->prepare("SELECT * FROM abd_bank_details WHERE abd_id = ? LIMIT 1");
            $st->execute([$aid]);
            $bank = $st->fetch(PDO::FETCH_ASSOC) ?: [];
            $row['account_number'] = $bank['account_number'] ?? '';
            $row['ifsc_code'] = $bank['ifsc_code'] ?? '';
            $row['bank_name'] = $bank['bank_name'] ?? '';
            $row['upi_id'] = $bank['upi_id'] ?? '';
            echo json_encode(['status' => 'success', 'profile' => $row]);
        } else {
            $action = $d['action'] ?? 'update_profile';
            if ($action === 'update_profile') {
                $db->prepare("UPDATE users SET name=?, phone=?, email=? WHERE id=?")
                   ->execute([$d['full_name'] ?? $abd['full_name'], $d['phone'] ?? $abd['phone'], $d['email'] ?? $abd['email'], $abd['user_id']]);
                echo json_encode(['status' => 'success', 'message' => 'Profile updated']);
            } elseif ($action === 'add_pincode') {
                $pincode = preg_replace('/\D/', '', trim($d['pincode'] ?? ''));
                $city = trim($d['city'] ?? $abd['area'] ?? 'Bhagalpur');
                if (!preg_match('/^\d{6}$/', $pincode)) {
                    echo json_encode(['status' => 'error', 'message' => 'Valid 6-digit pincode daalo']);
                    break;
                }

                $st = $db->prepare("SELECT COUNT(*) FROM abd_pincodes WHERE abd_id = ?");
                $st->execute([$aid]);
                if ((int) $st->fetchColumn() >= 10) {
                    echo json_encode(['status' => 'error', 'message' => 'Maximum 10 pincodes allowed']);
                    break;
                }

                $pincodeId = ensureAbdPincode($db, $pincode, $city);
                $db->prepare("
                    INSERT INTO abd_pincodes (abd_id, pincode_id, is_primary)
                    VALUES (?, ?, 0)
                    ON DUPLICATE KEY UPDATE updated_at = NOW()
                ")->execute([$aid, $pincodeId]);

                echo json_encode(['status' => 'success', 'message' => 'Pincode added', 'pincodes' => fetchAbdPincodes($db, $aid)]);
            } elseif ($action === 'remove_pincode') {
                $pincode = preg_replace('/\D/', '', trim($d['pincode'] ?? ''));
                if (!preg_match('/^\d{6}$/', $pincode)) {
                    echo json_encode(['status' => 'error', 'message' => 'Valid 6-digit pincode required']);
                    break;
                }

                $db->prepare("
                    DELETE ap FROM abd_pincodes ap
                    JOIN pincodes p ON p.id = ap.pincode_id
                    WHERE ap.abd_id = ? AND p.pincode = ?
                ")->execute([$aid, $pincode]);

                echo json_encode(['status' => 'success', 'message' => 'Pincode removed', 'pincodes' => fetchAbdPincodes($db, $aid)]);
            } elseif ($action === 'update_bank') {
                $db->prepare("
                    INSERT INTO abd_bank_details (abd_id, account_number, ifsc_code, bank_name, upi_id)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        account_number=VALUES(account_number),
                        ifsc_code=VALUES(ifsc_code),
                        bank_name=VALUES(bank_name),
                        upi_id=VALUES(upi_id)
                ")->execute([$aid, $d['account_number'] ?? '', $d['ifsc_code'] ?? '', $d['bank_name'] ?? '', $d['upi_id'] ?? '']);
                echo json_encode(['status' => 'success', 'message' => 'Bank details updated']);
            }
        }
        break;

    case 'withdraw':
        $amount = round(floatval($d['amount'] ?? 0), 2);
        if ($amount <= 0) { echo json_encode(['status' => 'error', 'message' => 'Invalid amount']); break; }
        $bal = (float) $abd['available_balance'];
        if ($amount > $bal) { echo json_encode(['status' => 'error', 'message' => 'Insufficient balance']); break; }
        $newBal = round($bal - $amount, 2);
        $db->prepare("UPDATE abds SET wallet_balance=? WHERE id=?")->execute([$newBal, $aid]);
        $db->prepare("INSERT INTO abd_commissions (abd_id, type, description, amount, balance_after) VALUES (?, 'debit', 'Withdrawal to Bank', ?, ?)")
           ->execute([$aid, $amount, $newBal]);
        echo json_encode(['status' => 'success', 'message' => "Rs. {$amount} withdrawn successfully", 'new_balance' => $newBal]);
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid module']);
}

function fetchAbdPincodes(PDO $db, int $aid): array {
    $st = $db->prepare("
        SELECT p.pincode, p.city, ap.is_primary
        FROM abd_pincodes ap
        JOIN pincodes p ON p.id = ap.pincode_id
        WHERE ap.abd_id = ?
        ORDER BY ap.is_primary DESC, p.pincode
    ");
    $st->execute([$aid]);
    return array_map(function ($r) {
        return [
            'pincode' => $r['pincode'],
            'city' => $r['city'] ?: $r['pincode'],
            'is_primary' => (int) $r['is_primary'],
            'tech_count' => 0,
            'booking_count' => 0,
            'is_serviceable' => 1,
        ];
    }, $st->fetchAll(PDO::FETCH_ASSOC));
}
?>
