<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/razorpay.php';
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

set_exception_handler(function (Throwable $e) {
    if (!headers_sent()) http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
    exit;
});

$module = $_GET['module'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$d      = $method === 'POST' ? (json_decode(file_get_contents('php://input'), true) ?? []) : [];

// ── Public: setup session by phone ───────────────────────────────────────────
if ($module === 'setup_session') {
    $phone = trim($d['phone'] ?? '');
    if (!$phone) { echo json_encode(['status' => 'error', 'message' => 'Phone required']); exit; }

    $db = (new Database())->getConnection();
    $st = $db->prepare("
        SELECT u.id AS user_id, u.name AS full_name, u.email, u.phone AS mobile,
               t.id AS technician_id, t.availability_status, t.kyc_status,
               up.profile_image,
               GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ', ') AS service_category
        FROM   users u
        JOIN   technicians t    ON u.id = t.user_id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN technician_services ts ON t.id = ts.technician_id
        LEFT JOIN services s            ON ts.service_id = s.id
        WHERE  u.phone = ? AND u.role = 'technician'
        GROUP  BY u.id, t.id, up.profile_image
        LIMIT  1
    ");
    $st->execute([$phone]);
    $tech = $st->fetch(PDO::FETCH_ASSOC);

    if ($tech) {
        $_SESSION['technician_id'] = (int) $tech['technician_id'];
        $_SESSION['tech_user_id']  = (int) $tech['user_id'];
        echo json_encode(['status' => 'success', 'tech' => $tech]);
    } else {
        // Check if number exists under a different role
        $check = $db->prepare("SELECT role FROM users WHERE phone = ? LIMIT 1");
        $check->execute([$phone]);
        $roleRow = $check->fetch(PDO::FETCH_ASSOC);
        if ($roleRow && $roleRow['role'] !== 'technician') {
            echo json_encode([
                'status'        => 'error',
                'role_conflict' => true,
                'existing_role' => $roleRow['role'],
                'message'       => 'This number is registered as a ' . $roleRow['role'] . ', not a technician.',
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Technician not found']);
        }
    }
    exit;
}

if ($module === 'logout') {
    session_destroy();
    echo json_encode(['status' => 'success']);
    exit;
}

// ── Auth guard ───────────────────────────────────────────────────────────────
if (!isset($_SESSION['technician_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$tid        = (int) $_SESSION['technician_id'];
$techUserId = (int) $_SESSION['tech_user_id'];
$db         = (new Database())->getConnection();

// Ensure earning wallet exists for this technician
$db->prepare("INSERT IGNORE INTO wallets (user_id, wallet_type, balance) VALUES (?, 'earning', 0.00)")
   ->execute([$techUserId]);

// Ensure user_settings row exists
$db->prepare("INSERT IGNORE INTO user_settings (user_id) VALUES (?)")->execute([$techUserId]);

// ── Helper: fetch wallet balance ─────────────────────────────────────────────
function getWallet(PDO $db, int $userId): array {
    $st = $db->prepare("SELECT id, balance FROM wallets WHERE user_id = ? AND wallet_type = 'earning' LIMIT 1");
    $st->execute([$userId]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: ['id' => null, 'balance' => 0.00];
}

switch ($module) {

    // ════════════════════════════════════════════════════════════════════════
    case 'dashboard':
        $today = date('Y-m-d');
        $wallet = getWallet($db, $techUserId);

        // Profile
        $st = $db->prepare("
            SELECT u.name AS full_name, u.email, u.phone AS mobile,
                   t.rating, t.total_jobs, t.kyc_status, t.availability_status,
                   up.profile_image,
                   GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ', ') AS service_category
            FROM   technicians t
            JOIN   users u ON t.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN technician_services ts ON t.id = ts.technician_id
            LEFT JOIN services s             ON ts.service_id = s.id
            WHERE  t.id = ?
            GROUP  BY t.id, u.id, up.profile_image
        ");
        $st->execute([$tid]);
        $profile = $st->fetch(PDO::FETCH_ASSOC);
        $profile['available_balance'] = (float) $wallet['balance'];

        // Today's job counts from bookings
        $st = $db->prepare("
            SELECT COUNT(*) AS total,
                   SUM(status = 'ongoing') AS ongoing,
                   SUM(status = 'completed') AS completed
            FROM   bookings
            WHERE  assigned_technician_id = ? AND preferred_date = ?
        ");
        $st->execute([$tid, $today]);
        $jc = $st->fetch(PDO::FETCH_ASSOC);

        // Today's earnings
        $st = $db->prepare("
            SELECT COALESCE(SUM(amount), 0) AS t
            FROM   wallet_transactions wt
            JOIN   wallets w ON wt.wallet_id = w.id
            WHERE  w.user_id = ? AND wt.transaction_type = 'credit'
              AND  DATE(wt.created_at) = ?
        ");
        $st->execute([$techUserId, $today]);
        $todayEarnings = (float) $st->fetch(PDO::FETCH_ASSOC)['t'];

        // Month earnings
        $st = $db->prepare("
            SELECT COALESCE(SUM(amount), 0) AS t
            FROM   wallet_transactions wt
            JOIN   wallets w ON wt.wallet_id = w.id
            WHERE  w.user_id = ? AND wt.transaction_type = 'credit'
              AND  MONTH(wt.created_at) = MONTH(CURDATE())
              AND  YEAR(wt.created_at)  = YEAR(CURDATE())
        ");
        $st->execute([$techUserId]);
        $monthEarnings = (float) $st->fetch(PDO::FETCH_ASSOC)['t'];

        // Total withdrawn
        $st = $db->prepare("
            SELECT COALESCE(SUM(amount), 0) AS t
            FROM   withdrawal_requests
            WHERE  user_id = ? AND status = 'paid'
        ");
        $st->execute([$techUserId]);
        $withdrawn = (float) $st->fetch(PDO::FETCH_ASSOC)['t'];

        // Today's schedule (assigned bookings)
        $st = $db->prepare("
            SELECT b.id, b.booking_code, s.name AS service_type,
                   b.problem_description AS description,
                   b.preferred_time AS start_time,
                   b.status, b.final_amount AS amount,
                   u.name AS customer_name, a.address_line AS address
            FROM   bookings b
            JOIN   customers c  ON b.customer_id = c.id
            JOIN   users u      ON c.user_id = u.id
            JOIN   services s   ON b.service_id = s.id
            JOIN   addresses a  ON b.address_id = a.id
            WHERE  b.assigned_technician_id = ? AND b.preferred_date = ?
            ORDER  BY b.preferred_time
        ");
        $st->execute([$tid, $today]);
        $schedule = $st->fetchAll(PDO::FETCH_ASSOC);

        // Ongoing bookings
        $st = $db->prepare("
            SELECT b.id, b.booking_code, s.name AS service_type,
                   b.problem_description AS description, b.status,
                   u.name AS customer_name
            FROM   bookings b
            JOIN   customers c ON b.customer_id = c.id
            JOIN   users u     ON c.user_id = u.id
            JOIN   services s  ON b.service_id = s.id
            WHERE  b.assigned_technician_id = ? AND b.status = 'ongoing'
            LIMIT  5
        ");
        $st->execute([$tid]);
        $ongoing = $st->fetchAll(PDO::FETCH_ASSOC);

        // All-time job status counts
        $st = $db->prepare("
            SELECT SUM(status IN ('new','broadcasted'))            AS new_count,
                   SUM(status IN ('ongoing','accepted','arrived')) AS ongoing_count,
                   SUM(status = 'completed')                       AS completed_count,
                   SUM(status = 'cancelled')                       AS cancelled_count
            FROM   bookings
            WHERE  assigned_technician_id = ?
        ");
        $st->execute([$tid]);
        $jobStatus = $st->fetch(PDO::FETCH_ASSOC);

        // Happy-code completed jobs (for plan unlock)
        $st = $db->prepare("SELECT COUNT(*) AS cnt FROM bookings WHERE assigned_technician_id = ? AND satisfaction = 'happy'");
        $st->execute([$tid]);
        $happyJobsCount = (int) $st->fetch(PDO::FETCH_ASSOC)['cnt'];

        // 7-day earnings chart
        $st = $db->prepare("
            SELECT DATE(wt.created_at) AS day, COALESCE(SUM(wt.amount),0) AS amt
            FROM   wallet_transactions wt
            JOIN   wallets w ON wt.wallet_id = w.id
            WHERE  w.user_id = ? AND wt.transaction_type = 'credit'
              AND  wt.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP  BY DATE(wt.created_at)
        ");
        $st->execute([$techUserId]);
        $chartMap = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $row) $chartMap[$row['day']] = (float)$row['amt'];
        $weekData   = [];
        $weekLabels = [];
        for ($i = 6; $i >= 0; $i--) {
            $day          = date('Y-m-d', strtotime("-{$i} days"));
            $weekData[]   = $chartMap[$day] ?? 0;
            $weekLabels[] = date('D', strtotime($day));
        }

        // Previous week total (for % chip)
        $st = $db->prepare("
            SELECT COALESCE(SUM(wt.amount),0) AS t
            FROM   wallet_transactions wt
            JOIN   wallets w ON wt.wallet_id = w.id
            WHERE  w.user_id = ? AND wt.transaction_type = 'credit'
              AND  wt.created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
              AND  wt.created_at <  DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        ");
        $st->execute([$techUserId]);
        $prevWeekTotal = (float)$st->fetch(PDO::FETCH_ASSOC)['t'];

        // Total withdrawn all-time
        $st = $db->prepare("SELECT COALESCE(SUM(amount),0) AS t FROM withdrawal_requests WHERE user_id=? AND status='paid'");
        $st->execute([$techUserId]);
        $totalWithdrawn = (float)$st->fetch(PDO::FETCH_ASSOC)['t'];

        // Active Fix plan subscription
        $st = $db->prepare("
            SELECT ts.end_date
            FROM   technician_subscriptions ts
            JOIN   subscription_plans sp ON ts.subscription_plan_id = sp.id
            WHERE  ts.technician_id = ? AND sp.name = 'fix'
              AND  ts.status = 'active' AND ts.end_date >= CURDATE()
              AND  ts.payment_status = 'paid'
            ORDER  BY ts.end_date DESC
            LIMIT  1
        ");
        $st->execute([$tid]);
        $fixRow = $st->fetch(PDO::FETCH_ASSOC);
        $activePlan = $fixRow
            ? ['type' => 'fix', 'valid_until' => $fixRow['end_date']]
            : ['type' => 'none'];

        // Recent notifications
        $st = $db->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 4");
        $st->execute([$techUserId]);
        $notifs = $st->fetchAll(PDO::FETCH_ASSOC);

        $st = $db->prepare("SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0");
        $st->execute([$techUserId]);
        $unread = (int) $st->fetch(PDO::FETCH_ASSOC)['cnt'];

        echo json_encode([
            'status'        => 'success',
            'profile'       => $profile,
            'stats'         => [
                'today_jobs'      => (int) $jc['total'],
                'today_ongoing'   => (int) $jc['ongoing'],
                'today_completed' => (int) $jc['completed'],
                'today_earnings'  => $todayEarnings,
                'month_earnings'  => $monthEarnings,
                'total_withdrawn' => $totalWithdrawn,
                'wallet_balance'  => (float) $wallet['balance'],
                'rating'          => (float) ($profile['rating'] ?? 0),
                'total_jobs'      => (int) ($profile['total_jobs'] ?? 0),
            ],
            'schedule'      => $schedule,
            'ongoing_jobs'  => $ongoing,
            'job_status'    => [
                'new_count'       => (int) $jobStatus['new_count'],
                'ongoing_count'   => (int) $jobStatus['ongoing_count'],
                'completed_count' => (int) $jobStatus['completed_count'],
                'cancelled_count' => (int) $jobStatus['cancelled_count'],
            ],
            'week_chart'    => ['data' => $weekData, 'labels' => $weekLabels, 'prev_week_total' => $prevWeekTotal],
            'notifications' => $notifs,
            'unread_count'  => $unread,
            'happy_jobs'    => $happyJobsCount,
            'active_plan'   => $activePlan,
        ]);
        break;

    // ════════════════════════════════════════════════════════════════════════
    case 'jobs':
        if ($method === 'GET') {
            $status = $_GET['status'] ?? 'new';

            if ($status === 'new') {
                // Pending broadcasts for this technician
                $st = $db->prepare("
                    SELECT b.id, b.booking_code, bb.id AS broadcast_id,
                           s.name AS service_type,
                           b.problem_description AS description,
                           b.preferred_date AS job_date,
                           b.preferred_time AS start_time,
                           b.status, b.final_amount AS amount,
                           u.name  AS customer_name,
                           u.phone AS customer_phone,
                           a.address_line AS address,
                           p.pincode,
                           bb.is_featured_priority,
                           bb.notification_priority
                    FROM   booking_broadcasts bb
                    JOIN   bookings b   ON bb.booking_id = b.id
                    JOIN   customers c  ON b.customer_id = c.id
                    JOIN   users u      ON c.user_id     = u.id
                    JOIN   services s   ON b.service_id  = s.id
                    JOIN   addresses a  ON b.address_id  = a.id
                    JOIN   pincodes p   ON a.pincode_id  = p.id
                    WHERE  bb.technician_id   = ?
                      AND  bb.response_status = 'pending'
                      AND  b.status IN ('new', 'broadcasted')
                    ORDER  BY bb.notification_priority DESC, b.created_at ASC
                ");
                $st->execute([$tid]);
            } else {
                // Accepted / ongoing / completed / cancelled bookings
                $statusMap = [
                    'ongoing'   => ['accepted', 'assigned', 'arrived', 'ongoing'],
                    'completed' => ['completed'],
                    'cancelled' => ['cancelled'],
                ];
                $statusList = $statusMap[$status] ?? [$status];
                $placeholders = implode(',', array_fill(0, count($statusList), '?'));

                $st = $db->prepare("
                    SELECT b.id, b.booking_code,
                           s.name  AS service_type,
                           b.problem_description AS description,
                           b.preferred_date AS job_date,
                           b.preferred_time AS start_time,
                           b.status, b.final_amount AS amount,
                           u.name  AS customer_name,
                           u.phone AS customer_phone,
                           a.address_line AS address,
                           p.pincode
                    FROM   bookings b
                    JOIN   customers c ON b.customer_id = c.id
                    JOIN   users u     ON c.user_id     = u.id
                    JOIN   services s  ON b.service_id  = s.id
                    JOIN   addresses a ON b.address_id  = a.id
                    JOIN   pincodes p  ON a.pincode_id  = p.id
                    WHERE  b.assigned_technician_id = ?
                      AND  b.status IN ($placeholders)
                    ORDER  BY b.preferred_date DESC, b.preferred_time DESC
                ");
                $st->execute(array_merge([$tid], $statusList));
            }
            $jobs = $st->fetchAll(PDO::FETCH_ASSOC);

            // Tab counts
            $st = $db->prepare("
                SELECT
                    (SELECT COUNT(*) FROM booking_broadcasts WHERE technician_id = ? AND response_status = 'pending') AS new_count,
                    SUM(b.status IN ('accepted','assigned','arrived','ongoing') AND b.assigned_technician_id = ?)     AS ongoing_count,
                    SUM(b.status = 'completed'  AND b.assigned_technician_id = ?)                                     AS completed_count
                FROM bookings b
            ");
            $st->execute([$tid, $tid, $tid]);
            $counts = $st->fetch(PDO::FETCH_ASSOC);

            echo json_encode(['status' => 'success', 'jobs' => $jobs, 'counts' => $counts]);

        } else {
            // POST actions: accept or complete
            $action = $d['action'] ?? '';
            $jobId  = (int) ($d['job_id'] ?? 0);   // booking_id

            if ($action === 'accept') {
                // ── Free-tier / subscription gate ────────────────────────
                try { $db->exec("ALTER TABLE bookings ADD COLUMN satisfaction ENUM('happy','sad') NULL"); } catch(Exception $e){}
                $st = $db->prepare("SELECT COUNT(*) FROM bookings WHERE assigned_technician_id = ? AND satisfaction = 'happy'");
                $st->execute([$tid]);
                $happyJobs = (int) $st->fetchColumn();

                if ($happyJobs >= 3) {
                    // Check active Fix plan
                    $st = $db->prepare("
                        SELECT ts.id FROM technician_subscriptions ts
                        JOIN   subscription_plans sp ON ts.subscription_plan_id = sp.id
                        WHERE  ts.technician_id = ? AND sp.name = 'fix'
                          AND  ts.status = 'active' AND ts.end_date >= CURDATE()
                          AND  ts.payment_status = 'paid'
                        LIMIT  1
                    ");
                    $st->execute([$tid]);
                    if (!$st->fetchColumn()) {
                        echo json_encode([
                            'status'     => 'error',
                            'code'       => 'subscription_required',
                            'happy_jobs' => $happyJobs,
                            'message'    => 'Purchase a plan to accept more jobs',
                        ]);
                        break;
                    }
                }
                // ─────────────────────────────────────────────────────────

                // Check broadcast exists and is pending
                $st = $db->prepare("
                    SELECT bb.id FROM booking_broadcasts bb
                    WHERE  bb.booking_id = ? AND bb.technician_id = ? AND bb.response_status = 'pending'
                    LIMIT  1
                ");
                $st->execute([$jobId, $tid]);
                if (!$st->fetchColumn()) {
                    echo json_encode(['status' => 'error', 'message' => 'Broadcast not found or already responded']);
                    break;
                }

                $db->beginTransaction();
                try {
                    $db->prepare("
                        UPDATE booking_broadcasts
                        SET    response_status = 'accepted', accepted_at = NOW()
                        WHERE  booking_id = ? AND technician_id = ?
                    ")->execute([$jobId, $tid]);

                    $db->prepare("
                        UPDATE booking_broadcasts
                        SET    response_status = 'expired'
                        WHERE  booking_id = ? AND technician_id != ? AND response_status = 'pending'
                    ")->execute([$jobId, $tid]);

                    $db->prepare("
                        UPDATE bookings
                        SET    assigned_technician_id = ?, status = 'accepted'
                        WHERE  id = ? AND status IN ('new', 'broadcasted')
                    ")->execute([$tid, $jobId]);

                    $db->prepare("
                        INSERT INTO booking_status_logs (booking_id, status, changed_by, note)
                        VALUES (?, 'accepted', ?, 'Technician accepted job')
                    ")->execute([$jobId, $techUserId]);

                    $db->commit();
                    echo json_encode(['status' => 'success', 'message' => 'Job accepted']);
                } catch (Exception $ex) {
                    $db->rollBack();
                    echo json_encode(['status' => 'error', 'message' => 'Accept failed: ' . $ex->getMessage()]);
                }

            } elseif ($action === 'generate_codes') {
                // Ensure completion code columns exist — each separately so one existing column
                // doesn't fail the others (MySQL fails the whole ALTER TABLE on any duplicate)
                try { $db->exec("ALTER TABLE bookings ADD COLUMN happy_code CHAR(4) NULL"); } catch (Exception $e) {}
                try { $db->exec("ALTER TABLE bookings ADD COLUMN sad_code CHAR(4) NULL"); } catch (Exception $e) {}
                try { $db->exec("ALTER TABLE bookings ADD COLUMN satisfaction ENUM('happy','sad') NULL"); } catch (Exception $e) {}

                // Verify booking belongs to this technician and is ongoing
                $st = $db->prepare("
                    SELECT b.id, c.user_id AS customer_user_id, u.name AS customer_name
                    FROM   bookings b
                    JOIN   customers c ON b.customer_id = c.id
                    JOIN   users u     ON c.user_id = u.id
                    WHERE  b.id = ? AND b.assigned_technician_id = ?
                      AND  b.status IN ('accepted','assigned','arrived','ongoing')
                    LIMIT 1
                ");
                $st->execute([$jobId, $tid]);
                $booking = $st->fetch(PDO::FETCH_ASSOC);

                if (!$booking) {
                    echo json_encode(['status' => 'error', 'message' => 'Booking not found or not active']);
                    break;
                }

                // Generate two distinct 4-digit codes
                do {
                    $happyCode = str_pad((string) rand(1000, 9999), 4, '0', STR_PAD_LEFT);
                    $sadCode   = str_pad((string) rand(1000, 9999), 4, '0', STR_PAD_LEFT);
                } while ($happyCode === $sadCode);

                $db->prepare("UPDATE bookings SET happy_code = ?, sad_code = ? WHERE id = ?")
                   ->execute([$happyCode, $sadCode, $jobId]);

                // Notify customer with both codes
                $customerUserId = (int) $booking['customer_user_id'];
                $db->prepare("
                    INSERT INTO notifications (user_id, title, message, type)
                    VALUES (?, 'Job Completion Codes', ?, 'booking')
                ")->execute([
                    $customerUserId,
                    "Your technician has completed the job. Happy Code: {$happyCode} | Sad Code: {$sadCode}. Share one with the technician to close the booking."
                ]);

                echo json_encode(['status' => 'success', 'message' => 'Codes generated and sent to customer']);

            } elseif ($action === 'verify_code') {
                $code = trim($d['code'] ?? '');

                $st = $db->prepare("
                    SELECT happy_code, sad_code
                    FROM   bookings
                    WHERE  id = ? AND assigned_technician_id = ?
                      AND  status IN ('accepted','assigned','arrived','ongoing')
                    LIMIT 1
                ");
                $st->execute([$jobId, $tid]);
                $booking = $st->fetch(PDO::FETCH_ASSOC);

                if (!$booking) {
                    echo json_encode(['status' => 'error', 'message' => 'Booking not found']);
                    break;
                }
                if (!$booking['happy_code']) {
                    echo json_encode(['status' => 'error', 'message' => 'Codes not generated yet — tap Mark Complete first']);
                    break;
                }
                if ($code !== $booking['happy_code'] && $code !== $booking['sad_code']) {
                    echo json_encode(['status' => 'error', 'message' => 'Wrong code — ask the customer to check their notification']);
                    break;
                }

                $satisfaction = ($code === $booking['happy_code']) ? 'happy' : 'sad';

                $db->beginTransaction();
                try {
                    $db->prepare("
                        UPDATE bookings SET status = 'completed', satisfaction = ?
                        WHERE  id = ? AND assigned_technician_id = ?
                    ")->execute([$satisfaction, $jobId, $tid]);

                    $db->prepare("
                        INSERT INTO booking_status_logs (booking_id, status, changed_by, note)
                        VALUES (?, 'completed', ?, ?)
                    ")->execute([$jobId, $techUserId, "Job completed — customer satisfaction: {$satisfaction}"]);

                    $db->prepare("UPDATE technicians SET total_jobs = total_jobs + 1 WHERE id = ?")->execute([$tid]);

                    $db->commit();
                    echo json_encode(['status' => 'success', 'satisfaction' => $satisfaction, 'message' => 'Job completed']);
                } catch (Exception $ex) {
                    $db->rollBack();
                    echo json_encode(['status' => 'error', 'message' => 'Complete failed: ' . $ex->getMessage()]);
                }

            } elseif ($action === 'complete') {
                // Legacy direct-complete (kept for backwards compatibility)
                $db->beginTransaction();
                try {
                    $db->prepare("
                        UPDATE bookings SET status = 'completed'
                        WHERE  id = ? AND assigned_technician_id = ?
                    ")->execute([$jobId, $tid]);

                    $db->prepare("
                        INSERT INTO booking_status_logs (booking_id, status, changed_by, note)
                        VALUES (?, 'completed', ?, 'Job completed by technician')
                    ")->execute([$jobId, $techUserId]);

                    $db->prepare("UPDATE technicians SET total_jobs = total_jobs + 1 WHERE id = ?")->execute([$tid]);

                    $db->commit();
                    echo json_encode(['status' => 'success', 'message' => 'Job completed']);
                } catch (Exception $ex) {
                    $db->rollBack();
                    echo json_encode(['status' => 'error', 'message' => 'Complete failed: ' . $ex->getMessage()]);
                }

            } elseif ($action === 'record_charge') {
                $amount = round(floatval($d['amount'] ?? 0), 2);
                $method = in_array($d['payment_method'] ?? '', ['cash','upi']) ? $d['payment_method'] : 'cash';

                if ($amount <= 0) { echo json_encode(['status' => 'error', 'message' => 'Invalid amount']); break; }

                $st = $db->prepare("SELECT id FROM bookings WHERE id = ? AND assigned_technician_id = ? AND status = 'completed' LIMIT 1");
                $st->execute([$jobId, $tid]);
                if (!$st->fetchColumn()) { echo json_encode(['status' => 'error', 'message' => 'Job not found']); break; }

                $wallet = getWallet($db, $techUserId);
                $db->beginTransaction();
                try {
                    $db->prepare("UPDATE bookings SET final_amount = ? WHERE id = ?")->execute([$amount, $jobId]);
                    $db->prepare("UPDATE wallets SET balance = balance + ? WHERE id = ?")->execute([$amount, $wallet['id']]);
                    $db->prepare("
                        INSERT INTO wallet_transactions (wallet_id, reference_type, reference_id, transaction_type, amount, note)
                        VALUES (?, 'booking', ?, 'credit', ?, ?)
                    ")->execute([$wallet['id'], $jobId, $amount, "Service charge via {$method} — Job #{$jobId}"]);
                    $db->commit();
                    echo json_encode(['status' => 'success', 'message' => 'Charge recorded', 'amount' => $amount]);
                } catch (Exception $ex) {
                    $db->rollBack();
                    echo json_encode(['status' => 'error', 'message' => 'Failed: ' . $ex->getMessage()]);
                }

            } else {
                echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
            }
        }
        break;

    // ════════════════════════════════════════════════════════════════════════
    case 'earnings':
        $wallet = getWallet($db, $techUserId);

        $st = $db->prepare("
            SELECT COALESCE(SUM(amount), 0) AS t
            FROM   wallet_transactions wt
            JOIN   wallets w ON wt.wallet_id = w.id
            WHERE  w.user_id = ? AND wt.transaction_type = 'credit'
              AND  MONTH(wt.created_at) = MONTH(CURDATE())
              AND  YEAR(wt.created_at)  = YEAR(CURDATE())
        ");
        $st->execute([$techUserId]);
        $totalEarnings = (float) $st->fetch(PDO::FETCH_ASSOC)['t'];

        $st = $db->prepare("SELECT COUNT(*) AS cnt FROM bookings WHERE assigned_technician_id = ? AND status = 'completed'");
        $st->execute([$tid]);
        $completedJobs = (int) $st->fetch(PDO::FETCH_ASSOC)['cnt'];

        $st = $db->prepare("
            SELECT COALESCE(SUM(amount), 0) AS t
            FROM   withdrawal_requests
            WHERE  user_id = ? AND status IN ('pending', 'approved')
        ");
        $st->execute([$techUserId]);
        $pendingPayout = (float) $st->fetch(PDO::FETCH_ASSOC)['t'];

        $st = $db->prepare("
            SELECT COALESCE(SUM(amount), 0) AS t
            FROM   withdrawal_requests
            WHERE  user_id = ? AND status = 'paid'
        ");
        $st->execute([$techUserId]);
        $totalPayouts = (float) $st->fetch(PDO::FETCH_ASSOC)['t'];

        // Daily chart (current month)
        $st = $db->prepare("
            SELECT DATE(wt.created_at) AS day, SUM(wt.amount) AS amt
            FROM   wallet_transactions wt
            JOIN   wallets w ON wt.wallet_id = w.id
            WHERE  w.user_id = ? AND wt.transaction_type = 'credit'
              AND  MONTH(wt.created_at) = MONTH(CURDATE())
              AND  YEAR(wt.created_at)  = YEAR(CURDATE())
            GROUP  BY DATE(wt.created_at)
            ORDER  BY day
        ");
        $st->execute([$techUserId]);
        $chart = $st->fetchAll(PDO::FETCH_ASSOC);

        // Recent transactions
        $st = $db->prepare("
            SELECT wt.*, w.wallet_type
            FROM   wallet_transactions wt
            JOIN   wallets w ON wt.wallet_id = w.id
            WHERE  w.user_id = ?
            ORDER  BY wt.created_at DESC
            LIMIT  5
        ");
        $st->execute([$techUserId]);
        $recent = $st->fetchAll(PDO::FETCH_ASSOC);

        // Job amount summary
        $st = $db->prepare("
            SELECT
                SUM(CASE WHEN status = 'completed'                          THEN COALESCE(final_amount, 0) ELSE 0 END) AS completed,
                SUM(CASE WHEN status IN ('ongoing','accepted','arrived')     THEN COALESCE(final_amount, 0) ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'cancelled'                          THEN COALESCE(final_amount, 0) ELSE 0 END) AS cancelled
            FROM bookings
            WHERE assigned_technician_id = ?
        ");
        $st->execute([$tid]);
        $summary = $st->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'stats'  => [
                'total_earnings'  => $totalEarnings,
                'completed_jobs'  => $completedJobs,
                'pending_payout'  => $pendingPayout,
                'total_payouts'   => $totalPayouts,
                'wallet_balance'  => (float) $wallet['balance'],
            ],
            'chart'               => $chart,
            'recent_transactions' => $recent,
            'summary'             => $summary,
        ]);
        break;

    // ════════════════════════════════════════════════════════════════════════
    case 'wallet':
        $wallet = getWallet($db, $techUserId);

        if ($method === 'GET') {
            $st = $db->prepare("
                SELECT COALESCE(SUM(amount), 0) AS t
                FROM   wallet_transactions wt
                JOIN   wallets w ON wt.wallet_id = w.id
                WHERE  w.user_id = ? AND wt.transaction_type = 'credit'
                  AND  MONTH(wt.created_at) = MONTH(CURDATE())
            ");
            $st->execute([$techUserId]);
            $monthEarnings = (float) $st->fetch(PDO::FETCH_ASSOC)['t'];

            $st = $db->prepare("
                SELECT COALESCE(SUM(amount), 0) AS t
                FROM   withdrawal_requests
                WHERE  user_id = ? AND status IN ('pending', 'approved')
            ");
            $st->execute([$techUserId]);
            $pendingPayout = (float) $st->fetch(PDO::FETCH_ASSOC)['t'];

            $st = $db->prepare("
                SELECT wt.*, w.wallet_type
                FROM   wallet_transactions wt
                JOIN   wallets w ON wt.wallet_id = w.id
                WHERE  w.user_id = ?
                ORDER  BY wt.created_at DESC
            ");
            $st->execute([$techUserId]);
            $history = $st->fetchAll(PDO::FETCH_ASSOC);

            // 7-day chart
            $st = $db->prepare("
                SELECT DATE(wt.created_at) AS day, COALESCE(SUM(wt.amount), 0) AS amt
                FROM   wallet_transactions wt
                JOIN   wallets w ON wt.wallet_id = w.id
                WHERE  w.user_id = ? AND wt.transaction_type = 'credit'
                  AND  wt.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP  BY DATE(wt.created_at)
            ");
            $st->execute([$techUserId]);
            $wMap = [];
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) $wMap[$r['day']] = (float)$r['amt'];
            $wData = []; $wLabels = [];
            for ($i = 6; $i >= 0; $i--) {
                $day      = date('Y-m-d', strtotime("-{$i} days"));
                $wData[]  = $wMap[$day] ?? 0;
                $wLabels[] = date('D', strtotime($day));
            }

            // Previous week total (for % chip)
            $st = $db->prepare("
                SELECT COALESCE(SUM(wt.amount),0) AS t
                FROM   wallet_transactions wt
                JOIN   wallets w ON wt.wallet_id = w.id
                WHERE  w.user_id = ? AND wt.transaction_type = 'credit'
                  AND  wt.created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
                  AND  wt.created_at <  DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            ");
            $st->execute([$techUserId]);
            $wPrevTotal = (float)$st->fetch(PDO::FETCH_ASSOC)['t'];

            // Total withdrawn
            $st = $db->prepare("SELECT COALESCE(SUM(amount),0) AS t FROM withdrawal_requests WHERE user_id=? AND status='paid'");
            $st->execute([$techUserId]);
            $totalWithdrawn = (float)$st->fetch(PDO::FETCH_ASSOC)['t'];

            echo json_encode([
                'status'            => 'success',
                'available_balance' => (float) $wallet['balance'],
                'month_earnings'    => $monthEarnings,
                'pending_payout'    => $pendingPayout,
                'total_withdrawn'   => $totalWithdrawn,
                'week_chart'        => ['data' => $wData, 'labels' => $wLabels, 'prev_week_total' => $wPrevTotal],
                'transactions'      => $history,
            ]);

        } else {
            $amount = round(floatval($d['amount'] ?? 0), 2);
            if ($amount <= 0) { echo json_encode(['status' => 'error', 'message' => 'Invalid amount']); break; }

            $balance = (float) $wallet['balance'];
            if ($amount > $balance) { echo json_encode(['status' => 'error', 'message' => 'Insufficient balance']); break; }

            $walletId = $wallet['id'];
            $newBalance = round($balance - $amount, 2);

            $db->beginTransaction();
            try {
                $db->prepare("UPDATE wallets SET balance = ? WHERE id = ?")->execute([$newBalance, $walletId]);
                $db->prepare("
                    INSERT INTO wallet_transactions (wallet_id, reference_type, transaction_type, amount, note)
                    VALUES (?, 'withdrawal', 'debit', ?, 'Withdrawal to bank')
                ")->execute([$walletId, $amount]);
                $wtId = (int) $db->lastInsertId();
                $db->prepare("
                    INSERT INTO withdrawal_requests (user_id, wallet_id, amount, status)
                    VALUES (?, ?, ?, 'pending')
                ")->execute([$techUserId, $walletId, $amount]);
                $db->commit();
                echo json_encode([
                    'status'      => 'success',
                    'message'     => "₹{$amount} withdrawal requested successfully",
                    'new_balance' => $newBalance,
                ]);
            } catch (Exception $ex) {
                $db->rollBack();
                echo json_encode(['status' => 'error', 'message' => 'Withdrawal failed: ' . $ex->getMessage()]);
            }
        }
        break;

    // ════════════════════════════════════════════════════════════════════════
    case 'notifications':
        if ($method === 'GET') {
            $filter = $_GET['filter'] ?? 'all';
            $params = [$techUserId];
            $where  = 'user_id = ?';
            if ($filter !== 'all') { $where .= ' AND type = ?'; $params[] = $filter; }

            $st = $db->prepare("SELECT * FROM notifications WHERE $where ORDER BY created_at DESC");
            $st->execute($params);
            $notes = $st->fetchAll(PDO::FETCH_ASSOC);

            $st = $db->prepare("
                SELECT COUNT(*) AS all_count,
                       SUM(type = 'booking')      AS booking_count,
                       SUM(type = 'earning')      AS earning_count,
                       SUM(type = 'subscription') AS subscription_count,
                       SUM(type = 'system')       AS system_count
                FROM   notifications
                WHERE  user_id = ?
            ");
            $st->execute([$techUserId]);
            $counts = $st->fetch(PDO::FETCH_ASSOC);

            $st = $db->prepare("SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0");
            $st->execute([$techUserId]);
            $unread = (int) $st->fetch(PDO::FETCH_ASSOC)['cnt'];

            echo json_encode([
                'status'       => 'success',
                'notifications' => $notes,
                'counts'       => $counts,
                'unread_count' => $unread,
            ]);

        } else {
            $action = $d['action'] ?? '';
            if ($action === 'mark_all_read') {
                $db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?")->execute([$techUserId]);
                echo json_encode(['status' => 'success']);
            } elseif ($action === 'mark_read') {
                $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?")
                   ->execute([(int) ($d['id'] ?? 0), $techUserId]);
                echo json_encode(['status' => 'success']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
            }
        }
        break;

    // ════════════════════════════════════════════════════════════════════════
    case 'support':
        if ($method === 'GET') {
            $st = $db->prepare("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC");
            $st->execute([$techUserId]);
            echo json_encode(['status' => 'success', 'tickets' => $st->fetchAll(PDO::FETCH_ASSOC)]);
        } else {
            $subject = trim($d['subject'] ?? '');
            if (!$subject) { echo json_encode(['status' => 'error', 'message' => 'Subject required']); break; }
            $db->prepare("
                INSERT INTO support_tickets (user_id, subject, description, priority)
                VALUES (?, ?, ?, 'medium')
            ")->execute([$techUserId, $subject, $d['description'] ?? '']);
            $ticketId = (int) $db->lastInsertId();
            echo json_encode(['status' => 'success', 'message' => 'Ticket raised', 'ticket_id' => $ticketId]);
        }
        break;

    // ════════════════════════════════════════════════════════════════════════
    case 'profile':
        if ($method === 'GET') {
            $st = $db->prepare("
                SELECT u.name AS full_name, u.email, u.phone AS mobile,
                       t.id, t.experience_years, t.rating, t.total_jobs,
                       t.kyc_status, t.availability_status,
                       t.is_featured, t.priority_lead_enabled, t.status,
                       up.profile_image, up.gender, up.dob, up.bio,
                       bd.account_holder, bd.account_number, bd.ifsc_code, bd.bank_name, bd.upi_id,
                       us.language, us.app_theme, us.offline_mode, us.auto_logout, us.two_step_verification,
                       GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS service_category,
                       GROUP_CONCAT(DISTINCT p.pincode ORDER BY p.pincode SEPARATOR ', ') AS pincodes
                FROM   technicians t
                JOIN   users u   ON t.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN bank_details  bd ON u.id = bd.user_id
                LEFT JOIN user_settings us ON u.id = us.user_id
                LEFT JOIN technician_services ts ON t.id = ts.technician_id
                LEFT JOIN services s             ON ts.service_id = s.id
                LEFT JOIN technician_pincodes tp ON t.id = tp.technician_id
                LEFT JOIN pincodes p             ON tp.pincode_id = p.id
                WHERE  t.id = ?
                GROUP  BY t.id, u.id, up.profile_image, up.gender, up.dob, up.bio,
                          bd.account_holder, bd.account_number, bd.ifsc_code, bd.bank_name, bd.upi_id,
                          us.language, us.app_theme, us.offline_mode, us.auto_logout, us.two_step_verification
            ");
            $st->execute([$tid]);
            $profile = $st->fetch(PDO::FETCH_ASSOC);
            $wallet  = getWallet($db, $techUserId);
            if ($profile) $profile['available_balance'] = (float) $wallet['balance'];
            echo json_encode(['status' => 'success', 'profile' => $profile]);

        } else {
            $action = $d['action'] ?? 'update_profile';

            if ($action === 'update_profile') {
                $db->prepare("UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ?")
                   ->execute([$d['full_name'] ?? '', $d['mobile'] ?? '', $d['email'] ?? '', $techUserId]);
                $db->prepare("UPDATE technicians SET experience_years = ?, availability_status = ? WHERE id = ?")
                   ->execute([(int) ($d['experience_years'] ?? 0), $d['availability_status'] ?? 'offline', $tid]);
                echo json_encode(['status' => 'success', 'message' => 'Profile updated']);

            } elseif ($action === 'change_password') {
                $st = $db->prepare("SELECT pass_pin FROM users WHERE id = ?");
                $st->execute([$techUserId]);
                $cur = $st->fetch(PDO::FETCH_ASSOC)['pass_pin'] ?? '';
                if (!password_verify($d['old_password'] ?? '', $cur)) {
                    echo json_encode(['status' => 'error', 'message' => 'Old password incorrect']);
                    break;
                }
                $db->prepare("UPDATE users SET pass_pin = ? WHERE id = ?")
                   ->execute([password_hash($d['new_password'], PASSWORD_DEFAULT), $techUserId]);
                echo json_encode(['status' => 'success', 'message' => 'Password changed']);

            } elseif ($action === 'update_bank') {
                $db->prepare("
                    INSERT INTO bank_details (user_id, account_holder, account_number, ifsc_code, bank_name, upi_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        account_holder = VALUES(account_holder),
                        account_number = VALUES(account_number),
                        ifsc_code      = VALUES(ifsc_code),
                        bank_name      = VALUES(bank_name),
                        upi_id         = VALUES(upi_id)
                ")->execute([
                    $techUserId,
                    $d['account_holder'] ?? '', $d['account_number'] ?? '',
                    $d['ifsc_code'] ?? '',      $d['bank_name'] ?? '',
                    $d['upi_id'] ?? '',
                ]);
                echo json_encode(['status' => 'success', 'message' => 'Bank details updated']);

            } elseif ($action === 'update_settings') {
                $db->prepare("
                    UPDATE user_settings
                    SET language = ?, app_theme = ?, offline_mode = ?,
                        auto_logout = ?, two_step_verification = ?
                    WHERE user_id = ?
                ")->execute([
                    $d['language']              ?? 'English',
                    $d['app_theme']             ?? 'Light',
                    ($d['offline_mode'] ?? 0)   ? 1 : 0,
                    (int) ($d['auto_logout']    ?? 30),
                    ($d['two_step_verification'] ?? 0) ? 1 : 0,
                    $techUserId,
                ]);
                echo json_encode(['status' => 'success', 'message' => 'Settings updated']);

            } else {
                echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
            }
        }
        break;

    // ════════════════════════════════════════════════════════════════════════
    // Subscription payment with referral commission distribution.
    //
    // Revenue split (from subscription fee — NOT from job charges):
    //   relationship = direct_abd   → ABD gets 25%, Kwikar 75%
    //   relationship = tech_referral → parent tech 15%, ABD 10%, Kwikar 75%
    //
    // Customer job payments go 100% to technician — no deduction.
    // ════════════════════════════════════════════════════════════════════════
    case 'pay_subscription':
        $planId  = (int) ($d['plan_id']  ?? 0);
        $pcCode  = trim($d['pincode']    ?? '');

        // Resolve plan (fall back to legacy plan_type if plan_id not sent)
        if ($planId) {
            $st = $db->prepare("SELECT * FROM subscription_plans WHERE id = ? AND status = 'active' LIMIT 1");
            $st->execute([$planId]);
            $plan = $st->fetch(PDO::FETCH_ASSOC);
        } else {
            // Legacy: plan_type 'fix' / 'flex'
            $planType = trim($d['plan_type'] ?? '');
            $st = $db->prepare("SELECT * FROM subscription_plans WHERE name = ? AND status = 'active' LIMIT 1");
            $st->execute([$planType]);
            $plan = $st->fetch(PDO::FETCH_ASSOC);

            // Auto-seed default plans if table is empty
            if (!$plan) {
                $db->exec("INSERT IGNORE INTO subscription_plans (name, description, duration_days, price, status) VALUES
                    ('fix',  'Fixed area plan — unlimited jobs in pincode',  30, 499.00, 'active'),
                    ('flex', 'Flexible plan — per service category',         30, 149.00, 'active')");
                $st->execute([$planType]);
                $plan = $st->fetch(PDO::FETCH_ASSOC);
            }
        }

        if (!$plan) {
            echo json_encode(['status' => 'error', 'message' => 'Plan not found or inactive']);
            break;
        }

        // Resolve pincode for the subscription
        $pincodeId = null;
        if ($pcCode) {
            $st = $db->prepare("SELECT id FROM pincodes WHERE pincode = ?");
            $st->execute([$pcCode]);
            $pincodeId = $st->fetchColumn() ?: null;
        }
        if (!$pincodeId) {
            // Use technician's first active pincode
            $st = $db->prepare("SELECT pincode_id FROM technician_pincodes WHERE technician_id = ? AND is_active = 1 LIMIT 1");
            $st->execute([$tid]);
            $pincodeId = $st->fetchColumn() ?: null;
        }
        if (!$pincodeId) {
            echo json_encode(['status' => 'error', 'message' => 'No pincode linked to technician']);
            break;
        }

        $subAmount = (float) $plan['price'];
        $planName  = strtoupper($plan['name']);
        $duration  = (int) $plan['duration_days'];
        $startDate = date('Y-m-d');
        $endDate   = date('Y-m-d', strtotime("+{$duration} days"));

        // Referral relationship for this technician
        $st = $db->prepare("SELECT * FROM referral_relationships WHERE technician_id = ? LIMIT 1");
        $st->execute([$tid]);
        $referral = $st->fetch(PDO::FETCH_ASSOC);

        $commParentTech = 0.00;
        $commAbd        = 0.00;
        $abdUserId      = null;
        $parentTechId   = null;

        if ($referral) {
            $abdId        = (int) $referral['abd_id'];
            $parentTechId = !empty($referral['parent_technician_id']) ? (int) $referral['parent_technician_id'] : null;
            $relType      = $referral['relationship_type'];

            // Get ABD's user_id for wallet credit
            $st = $db->prepare("SELECT user_id, direct_commission_percent, indirect_commission_percent FROM abds WHERE id = ?");
            $st->execute([$abdId]);
            $abdRow = $st->fetch(PDO::FETCH_ASSOC);
            $abdUserId = $abdRow ? (int) $abdRow['user_id'] : null;

            if ($relType === 'direct_abd') {
                $commAbd = round($subAmount * ($abdRow['direct_commission_percent'] / 100), 2);
            } else {
                // technician_referral
                $commParentTech = round($subAmount * 0.15, 2);
                $commAbd        = round($subAmount * ($abdRow['indirect_commission_percent'] / 100), 2);
            }
        }

        $kwikarShare = round($subAmount - $commParentTech - $commAbd, 2);

        $db->beginTransaction();
        try {
            // Create subscription record
            $db->prepare("
                INSERT INTO technician_subscriptions
                    (technician_id, subscription_plan_id, pincode_id, amount_paid,
                     start_date, end_date, payment_status, status)
                VALUES (?, ?, ?, ?, ?, ?, 'paid', 'active')
            ")->execute([$tid, $plan['id'], $pincodeId, $subAmount, $startDate, $endDate]);
            $subId = (int) $db->lastInsertId();

            // Commission: platform share
            $db->prepare("
                INSERT INTO subscription_commissions
                    (technician_subscription_id, from_technician_id, to_user_id,
                     to_user_role, commission_type, commission_percent, amount)
                VALUES (?, ?, ?, 'kwikar', 'platform', ?, ?)
            ")->execute([$subId, $tid, $techUserId, round(($kwikarShare / $subAmount) * 100, 2), $kwikarShare]);

            // Commission: parent technician (if applicable)
            if ($commParentTech > 0 && $parentTechId) {
                $st = $db->prepare("SELECT user_id FROM technicians WHERE id = ?");
                $st->execute([$parentTechId]);
                $parentUserId = (int) $st->fetchColumn();

                $db->prepare("
                    INSERT INTO subscription_commissions
                        (technician_subscription_id, from_technician_id, to_user_id,
                         to_user_role, commission_type, commission_percent, amount)
                    VALUES (?, ?, ?, 'technician', 'technician_referral', 15.00, ?)
                ")->execute([$subId, $tid, $parentUserId, $commParentTech]);

                // Credit parent technician's wallet
                $db->prepare("INSERT IGNORE INTO wallets (user_id, wallet_type, balance) VALUES (?, 'earning', 0.00)")
                   ->execute([$parentUserId]);
                $db->prepare("UPDATE wallets SET balance = balance + ? WHERE user_id = ? AND wallet_type = 'earning'")
                   ->execute([$commParentTech, $parentUserId]);
                $st = $db->prepare("SELECT id FROM wallets WHERE user_id = ? AND wallet_type = 'earning'");
                $st->execute([$parentUserId]);
                $parentWalletId = (int) $st->fetchColumn();
                $db->prepare("
                    INSERT INTO wallet_transactions (wallet_id, reference_type, reference_id, transaction_type, amount, note)
                    VALUES (?, 'subscription', ?, 'credit', ?, ?)
                ")->execute([
                    $parentWalletId, $subId, $commParentTech,
                    "Referral commission — {$planName} plan subscription by Tech #{$tid}",
                ]);

                // Notification to parent tech
                $db->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'earning')")
                   ->execute([$parentUserId, 'Referral Commission Received', "₹{$commParentTech} credited — {$planName} plan subscription"]);
            }

            // Commission: ABD
            if ($commAbd > 0 && $abdUserId) {
                $commType = ($referral['relationship_type'] ?? '') === 'direct_abd' ? 'direct_abd' : 'indirect_abd';
                $commPct  = $commType === 'direct_abd'
                    ? ($abdRow['direct_commission_percent'] ?? 25)
                    : ($abdRow['indirect_commission_percent'] ?? 10);

                $db->prepare("
                    INSERT INTO subscription_commissions
                        (technician_subscription_id, from_technician_id, to_user_id,
                         to_user_role, commission_type, commission_percent, amount)
                    VALUES (?, ?, ?, 'abd', ?, ?, ?)
                ")->execute([$subId, $tid, $abdUserId, $commType, $commPct, $commAbd]);

                // Credit ABD wallet in abds table
                $db->prepare("UPDATE abds SET wallet_balance = wallet_balance + ? WHERE user_id = ?")
                   ->execute([$commAbd, $abdUserId]);

                // Notification to ABD
                $db->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'earning')")
                   ->execute([$abdUserId, 'Commission Received', "₹{$commAbd} credited — {$planName} plan subscription by Tech #{$tid}"]);
            }

            // Update technician featured/priority status if plan includes those perks
            if (!empty($plan['featured_boost'])) {
                $db->prepare("UPDATE technicians SET is_featured = 1, featured_expire_at = ? WHERE id = ?")
                   ->execute([$endDate . ' 23:59:59', $tid]);
            }
            if (!empty($plan['priority_leads'])) {
                $db->prepare("UPDATE technicians SET priority_lead_enabled = 1 WHERE id = ?")->execute([$tid]);
            }

            $db->commit();
            echo json_encode([
                'status'         => 'success',
                'message'        => "Subscription activated. ₹{$subAmount} paid.",
                'plan'           => $plan['name'],
                'amount'         => $subAmount,
                'start_date'     => $startDate,
                'end_date'       => $endDate,
                'referrer_gets'  => $commParentTech,
                'abd_gets'       => $commAbd,
                'kwikar_keeps'   => $kwikarShare,
            ]);
        } catch (Exception $ex) {
            $db->rollBack();
            echo json_encode(['status' => 'error', 'message' => 'Payment failed: ' . $ex->getMessage()]);
        }
        break;

    // ════════════════════════════════════════════════════════════════════════
    case 'razorpay':
        $action = $d['action'] ?? '';

        if ($action === 'create_order') {
            $plan   = $d['plan'] ?? '';   // 'fix' or 'flex'
            $jobId  = (int) ($d['job_id'] ?? 0);

            if (!in_array($plan, ['fix', 'flex'])) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid plan']);
                break;
            }

            $amountPaise = $plan === 'fix' ? 49900 : 14900;
            $receipt     = 'kwikar_' . $tid . '_' . time();

            $payload = json_encode([
                'amount'   => $amountPaise,
                'currency' => 'INR',
                'receipt'  => $receipt,
                'notes'    => ['technician_id' => $tid, 'plan' => $plan, 'job_id' => $jobId],
            ]);

            $ch = curl_init('https://api.razorpay.com/v1/orders');
            curl_setopt_array($ch, [
                CURLOPT_USERPWD        => RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            ]);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $order = json_decode($response, true);
            if ($httpCode === 200 && isset($order['id'])) {
                echo json_encode([
                    'status'   => 'success',
                    'order_id' => $order['id'],
                    'amount'   => $amountPaise,
                    'key'      => RAZORPAY_KEY_ID,
                    'plan'     => $plan,
                    'job_id'   => $jobId,
                ]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Could not create Razorpay order — check your API keys']);
            }

        } elseif ($action === 'verify_payment') {
            $orderId   = $d['razorpay_order_id']   ?? '';
            $paymentId = $d['razorpay_payment_id']  ?? '';
            $signature = $d['razorpay_signature']   ?? '';
            $plan      = $d['plan']                 ?? '';
            $jobId     = (int) ($d['job_id']        ?? 0);

            // Verify Razorpay signature
            $expected = hash_hmac('sha256', $orderId . '|' . $paymentId, RAZORPAY_KEY_SECRET);
            if (!hash_equals($expected, $signature)) {
                echo json_encode(['status' => 'error', 'message' => 'Payment verification failed — invalid signature']);
                break;
            }

            if ($plan === 'fix') {
                // Auto-seed fix plan if not present
                $db->exec("INSERT IGNORE INTO subscription_plans (name, description, duration_days, price, status)
                           VALUES ('fix', 'Fix Plan — unlimited jobs for 30 days', 30, 499.00, 'active')");
                $st = $db->prepare("SELECT id FROM subscription_plans WHERE name = 'fix' AND status = 'active' LIMIT 1");
                $st->execute();
                $planId = (int) $st->fetchColumn();

                // Technician pincode
                $st = $db->prepare("SELECT pincode_id FROM technician_pincodes WHERE technician_id = ? AND is_active = 1 LIMIT 1");
                $st->execute([$tid]);
                $pincodeId = $st->fetchColumn() ?: null;

                $start = date('Y-m-d');
                $end   = date('Y-m-d', strtotime('+30 days'));

                $db->prepare("
                    INSERT INTO technician_subscriptions
                        (technician_id, subscription_plan_id, pincode_id, amount_paid, start_date, end_date, payment_status, status)
                    VALUES (?, ?, ?, 499.00, ?, ?, 'paid', 'active')
                ")->execute([$tid, $planId, $pincodeId, $start, $end]);

                // Notify technician
                $db->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'subscription')")
                   ->execute([$techUserId, 'Fix Plan Activated!', "Your Fix Plan is active until {$end}. Accept unlimited jobs!"]);

                echo json_encode(['status' => 'success', 'plan' => 'fix', 'valid_until' => $end]);

            } elseif ($plan === 'flex') {
                // Auto-seed flex plan
                $db->exec("INSERT IGNORE INTO subscription_plans (name, description, duration_days, price, status)
                           VALUES ('flex', 'Flex Plan — pay per job acceptance', 0, 149.00, 'active')");
                $st = $db->prepare("SELECT id FROM subscription_plans WHERE name = 'flex' AND status = 'active' LIMIT 1");
                $st->execute();
                $planId = (int) $st->fetchColumn();

                $db->beginTransaction();
                try {
                    // Record flex subscription use
                    $db->prepare("
                        INSERT INTO technician_subscriptions
                            (technician_id, subscription_plan_id, pincode_id, amount_paid, start_date, end_date, payment_status, status)
                        VALUES (?, ?, NULL, 149.00, CURDATE(), CURDATE(), 'paid', 'active')
                    ")->execute([$tid, $planId]);

                    // Accept the job directly
                    $db->prepare("
                        UPDATE booking_broadcasts
                        SET    response_status = 'accepted', accepted_at = NOW()
                        WHERE  booking_id = ? AND technician_id = ?
                    ")->execute([$jobId, $tid]);

                    $db->prepare("
                        UPDATE booking_broadcasts
                        SET    response_status = 'expired'
                        WHERE  booking_id = ? AND technician_id != ? AND response_status = 'pending'
                    ")->execute([$jobId, $tid]);

                    $db->prepare("
                        UPDATE bookings
                        SET    assigned_technician_id = ?, status = 'accepted'
                        WHERE  id = ? AND status IN ('new','broadcasted')
                    ")->execute([$tid, $jobId]);

                    $db->prepare("
                        INSERT INTO booking_status_logs (booking_id, status, changed_by, note)
                        VALUES (?, 'accepted', ?, 'Accepted via Flex Plan payment')
                    ")->execute([$jobId, $techUserId]);

                    $db->commit();
                    echo json_encode(['status' => 'success', 'plan' => 'flex', 'job_accepted' => true]);
                } catch (Exception $ex) {
                    $db->rollBack();
                    echo json_encode(['status' => 'error', 'message' => 'Job accept failed: ' . $ex->getMessage()]);
                }
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Invalid plan']);
            }

        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
        }
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid module']);
}
?>
