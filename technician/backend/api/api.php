<?php
require_once '../config/database.php';
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$module = $_GET['module'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$d = $method === 'POST' ? (json_decode(file_get_contents("php://input"), true) ?? []) : [];

// --- Public: setup session by phone (called by panel on auto-login) ---
if ($module === 'setup_session') {
    $phone = trim($d['phone'] ?? '');
    if (!$phone) { echo json_encode(["status"=>"error","message"=>"Phone required"]); exit; }
    $db = (new Database())->getConnection();
    $st = $db->prepare("SELECT id, full_name, email, service_category FROM technicians WHERE mobile=? LIMIT 1");
    $st->execute([$phone]);
    $u = $st->fetch(PDO::FETCH_ASSOC);
    if ($u) {
        $_SESSION['technician_id'] = $u['id'];
        echo json_encode(["status"=>"success","tech"=>$u]);
    } else {
        echo json_encode(["status"=>"error","message"=>"Technician not found"]);
    }
    exit;
}

if ($module === 'logout') { session_destroy(); echo json_encode(["status"=>"success"]); exit; }

// --- Auth guard ---
if (!isset($_SESSION['technician_id'])) {
    http_response_code(401);
    echo json_encode(["status"=>"error","message"=>"Unauthorized"]); exit;
}
$tid = $_SESSION['technician_id'];
$db  = (new Database())->getConnection();

switch ($module) {

    case 'dashboard':
        $today = date('Y-m-d');
        $st = $db->prepare("SELECT id,full_name,email,mobile,profile_image,service_category,rating,total_reviews,is_verified,available_balance FROM technicians WHERE id=?");
        $st->execute([$tid]); $profile = $st->fetch(PDO::FETCH_ASSOC);

        $st = $db->prepare("SELECT COUNT(*) as total,SUM(status='ongoing') as ongoing,SUM(status='completed') as completed FROM jobs WHERE technician_id=? AND job_date=?");
        $st->execute([$tid,$today]); $jc = $st->fetch(PDO::FETCH_ASSOC);

        $st = $db->prepare("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE technician_id=? AND DATE(transaction_date)=? AND type='credit'");
        $st->execute([$tid,$today]); $todayE = $st->fetch(PDO::FETCH_ASSOC)['t'];

        $st = $db->prepare("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE technician_id=? AND MONTH(transaction_date)=MONTH(CURDATE()) AND YEAR(transaction_date)=YEAR(CURDATE()) AND type='credit'");
        $st->execute([$tid]); $monthE = $st->fetch(PDO::FETCH_ASSOC)['t'];

        $st = $db->prepare("SELECT j.*,c.name as customer_name,c.address FROM jobs j JOIN customers c ON j.customer_id=c.id WHERE j.technician_id=? AND j.job_date=? ORDER BY j.start_time");
        $st->execute([$tid,$today]); $schedule = $st->fetchAll(PDO::FETCH_ASSOC);

        $st = $db->prepare("SELECT j.*,c.name as customer_name FROM jobs j JOIN customers c ON j.customer_id=c.id WHERE j.technician_id=? AND j.status='ongoing' LIMIT 5");
        $st->execute([$tid]); $ongoing = $st->fetchAll(PDO::FETCH_ASSOC);

        $st = $db->prepare("SELECT SUM(status='new') as new_count,SUM(status='ongoing') as ongoing_count,SUM(status='completed') as completed_count FROM jobs WHERE technician_id=?");
        $st->execute([$tid]); $jobStatus = $st->fetch(PDO::FETCH_ASSOC);

        $st = $db->prepare("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE technician_id=? AND type='debit'");
        $st->execute([$tid]); $withdrawn = $st->fetch(PDO::FETCH_ASSOC)['t'];

        $st = $db->prepare("SELECT * FROM notifications WHERE technician_id=? ORDER BY created_at DESC LIMIT 4");
        $st->execute([$tid]); $notifs = $st->fetchAll(PDO::FETCH_ASSOC);

        $st = $db->prepare("SELECT COUNT(*) as cnt FROM notifications WHERE technician_id=? AND is_read=FALSE");
        $st->execute([$tid]); $unread = $st->fetch(PDO::FETCH_ASSOC)['cnt'];

        echo json_encode(["status"=>"success","profile"=>$profile,
            "stats"=>["today_jobs"=>(int)$jc['total'],"today_ongoing"=>(int)$jc['ongoing'],"today_completed"=>(int)$jc['completed'],
                "today_earnings"=>(float)$todayE,"month_earnings"=>(float)$monthE,"total_withdrawn"=>(float)$withdrawn,
                "rating"=>(float)$profile['rating'],"total_reviews"=>(int)$profile['total_reviews']],
            "schedule"=>$schedule,"ongoing_jobs"=>$ongoing,"job_status"=>$jobStatus,
            "notifications"=>$notifs,"unread_count"=>(int)$unread]);
        break;

    case 'jobs':
        if ($method === 'GET') {
            $status = $_GET['status'] ?? 'new';
            if ($status === 'new') {
                // Unassigned jobs any technician can claim
                $st = $db->prepare("SELECT j.*,c.name as customer_name,c.phone as customer_phone,c.address FROM jobs j JOIN customers c ON j.customer_id=c.id WHERE j.status='new' AND (j.technician_id=0 OR j.technician_id IS NULL) ORDER BY j.job_date,j.start_time");
                $st->execute();
            } else {
                $st = $db->prepare("SELECT j.*,c.name as customer_name,c.phone as customer_phone,c.address FROM jobs j JOIN customers c ON j.customer_id=c.id WHERE j.technician_id=? AND j.status=? ORDER BY j.job_date DESC,j.start_time");
                $st->execute([$tid, $status]);
            }
            $jobs = $st->fetchAll(PDO::FETCH_ASSOC);

            $st = $db->prepare("SELECT (SELECT COUNT(*) FROM jobs WHERE status='new' AND (technician_id=0 OR technician_id IS NULL)) as new_count, SUM(status='ongoing' AND technician_id=?) as ongoing_count, SUM(status='completed' AND technician_id=?) as completed_count FROM jobs");
            $st->execute([$tid,$tid]); $counts = $st->fetch(PDO::FETCH_ASSOC);
            echo json_encode(["status"=>"success","jobs"=>$jobs,"counts"=>$counts]);
        } else {
            $action = $d['action'] ?? ''; $jid = (int)($d['job_id'] ?? 0);
            if ($action === 'accept') {
                // Get technician name + phone
                $tInfo = $db->prepare("SELECT full_name, mobile FROM technicians WHERE id=?");
                $tInfo->execute([$tid]); $tech = $tInfo->fetch(PDO::FETCH_ASSOC);
                $techName  = $tech['full_name'] ?? '';
                $techPhone = $tech['mobile']    ?? '';

                // Claim unassigned job
                $db->prepare("UPDATE jobs SET status='ongoing', technician_id=? WHERE id=? AND (technician_id=0 OR technician_id IS NULL)")->execute([$tid,$jid]);

                // Update kwikar_bookings with status + technician info
                $row = $db->prepare("SELECT booking_id FROM jobs WHERE id=?");
                $row->execute([$jid]); $r = $row->fetch(PDO::FETCH_ASSOC);
                if ($r && $r['booking_id']) {
                    $db->prepare("UPDATE kwikar_bookings SET status='confirmed', technician_id=?, technician_name=?, technician_phone=? WHERE id=?")->execute([$tid, $techName, $techPhone, $r['booking_id']]);
                }
                echo json_encode(["status"=>"success","message"=>"Job accepted"]);
            } elseif ($action === 'complete') {
                $db->prepare("UPDATE jobs SET status='completed' WHERE id=? AND technician_id=?")->execute([$jid,$tid]);
                $row = $db->prepare("SELECT booking_id FROM jobs WHERE id=?");
                $row->execute([$jid]); $r = $row->fetch(PDO::FETCH_ASSOC);
                if ($r && $r['booking_id']) {
                    $db->prepare("UPDATE kwikar_bookings SET status='completed' WHERE id=?")->execute([$r['booking_id']]);
                }
                echo json_encode(["status"=>"success","message"=>"Job completed"]);
            } else { echo json_encode(["status"=>"error","message"=>"Invalid action"]); }
        }
        break;

    case 'earnings':
        $st = $db->prepare("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE technician_id=? AND type='credit' AND MONTH(transaction_date)=MONTH(CURDATE()) AND YEAR(transaction_date)=YEAR(CURDATE())");
        $st->execute([$tid]); $totalE = $st->fetch(PDO::FETCH_ASSOC)['t'];
        $st = $db->prepare("SELECT COUNT(*) as cnt FROM jobs WHERE technician_id=? AND status='completed'");
        $st->execute([$tid]); $cJobs = $st->fetch(PDO::FETCH_ASSOC)['cnt'];
        $st = $db->prepare("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE technician_id=? AND status='pending'");
        $st->execute([$tid]); $pending = $st->fetch(PDO::FETCH_ASSOC)['t'];
        $st = $db->prepare("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE technician_id=? AND type='debit' AND status='paid_out'");
        $st->execute([$tid]); $payouts = $st->fetch(PDO::FETCH_ASSOC)['t'];
        $st = $db->prepare("SELECT DATE(transaction_date) as day,SUM(amount) as amt FROM transactions WHERE technician_id=? AND type='credit' AND MONTH(transaction_date)=MONTH(CURDATE()) GROUP BY DATE(transaction_date) ORDER BY day");
        $st->execute([$tid]); $chart = $st->fetchAll(PDO::FETCH_ASSOC);
        $st = $db->prepare("SELECT * FROM transactions WHERE technician_id=? ORDER BY transaction_date DESC LIMIT 5");
        $st->execute([$tid]); $recent = $st->fetchAll(PDO::FETCH_ASSOC);
        $st = $db->prepare("SELECT available_balance FROM technicians WHERE id=?");
        $st->execute([$tid]); $bal = $st->fetch(PDO::FETCH_ASSOC)['available_balance'];
        $st = $db->prepare("SELECT SUM(CASE WHEN j.status='completed' THEN j.amount ELSE 0 END) as completed,SUM(CASE WHEN j.status IN('ongoing','upcoming') THEN j.amount ELSE 0 END) as pending,SUM(CASE WHEN j.status='cancelled' THEN j.amount ELSE 0 END) as cancelled FROM jobs j WHERE j.technician_id=?");
        $st->execute([$tid]); $summary = $st->fetch(PDO::FETCH_ASSOC);
        echo json_encode(["status"=>"success","stats"=>["total_earnings"=>(float)$totalE,"completed_jobs"=>(int)$cJobs,"pending_payout"=>(float)$pending,"total_payouts"=>(float)$payouts,"wallet_balance"=>(float)$bal],"chart"=>$chart,"recent_transactions"=>$recent,"summary"=>$summary]);
        break;

    case 'wallet':
        if ($method === 'GET') {
            $st = $db->prepare("SELECT available_balance FROM technicians WHERE id=?");
            $st->execute([$tid]); $bal = $st->fetch(PDO::FETCH_ASSOC)['available_balance'];
            $st = $db->prepare("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE technician_id=? AND type='credit' AND MONTH(transaction_date)=MONTH(CURDATE())");
            $st->execute([$tid]); $monthE = $st->fetch(PDO::FETCH_ASSOC)['t'];
            $st = $db->prepare("SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE technician_id=? AND status='pending'");
            $st->execute([$tid]); $pend = $st->fetch(PDO::FETCH_ASSOC)['t'];
            $st = $db->prepare("SELECT * FROM transactions WHERE technician_id=? ORDER BY transaction_date DESC");
            $st->execute([$tid]); $history = $st->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status"=>"success","available_balance"=>(float)$bal,"month_earnings"=>(float)$monthE,"pending_payout"=>(float)$pend,"transactions"=>$history]);
        } else {
            $d = json_decode(file_get_contents("php://input"), true);
            $amount = floatval($d['amount'] ?? 0);
            if ($amount <= 0) { echo json_encode(["status"=>"error","message"=>"Invalid amount"]); exit; }
            $st = $db->prepare("SELECT available_balance FROM technicians WHERE id=?");
            $st->execute([$tid]); $bal = $st->fetch(PDO::FETCH_ASSOC)['available_balance'];
            if ($amount > $bal) { echo json_encode(["status"=>"error","message"=>"Insufficient balance"]); exit; }
            $newBal = $bal - $amount; $txnId = 'TXN'.time();
            $db->prepare("UPDATE technicians SET available_balance=? WHERE id=?")->execute([$newBal,$tid]);
            $db->prepare("INSERT INTO transactions (transaction_id,technician_id,type,description,amount,balance_after,status) VALUES (?,?,'debit','Withdrawal to Bank',?,?,'paid_out')")->execute([$txnId,$tid,$amount,$newBal]);
            echo json_encode(["status"=>"success","message"=>"₹$amount withdrawn successfully","new_balance"=>$newBal]);
        }
        break;

    case 'notifications':
        if ($method === 'GET') {
            $filter = $_GET['filter'] ?? 'all';
            // technician_id=0 means broadcast to all technicians
            $params = [$tid, 0];
            $where = "(technician_id=? OR technician_id=?)";
            if ($filter !== 'all') { $where .= " AND type=?"; $params[] = $filter; }
            $st = $db->prepare("SELECT * FROM notifications WHERE $where ORDER BY created_at DESC");
            $st->execute($params); $notes = $st->fetchAll(PDO::FETCH_ASSOC);
            $st = $db->prepare("SELECT COUNT(*) as all_count, SUM(type='job') as job_count, SUM(type='earning') as earning_count, SUM(type='system') as system_count FROM notifications WHERE technician_id=? OR technician_id=0");
            $st->execute([$tid]); $counts = $st->fetch(PDO::FETCH_ASSOC);
            $unreadSt = $db->prepare("SELECT COUNT(*) as cnt FROM notifications WHERE (technician_id=? OR technician_id=0) AND is_read=0");
            $unreadSt->execute([$tid]); $unread = $unreadSt->fetch(PDO::FETCH_ASSOC)['cnt'];
            echo json_encode(["status"=>"success","notifications"=>$notes,"counts"=>$counts,"unread_count"=>(int)$unread]);
        } else {
            $d = json_decode(file_get_contents("php://input"), true);
            $action = $d['action'] ?? '';
            if ($action === 'mark_all_read') {
                $db->prepare("UPDATE notifications SET is_read=TRUE WHERE technician_id=?")->execute([$tid]);
                echo json_encode(["status"=>"success"]);
            } elseif ($action === 'mark_read') {
                $db->prepare("UPDATE notifications SET is_read=TRUE WHERE id=? AND technician_id=?")->execute([$d['id']??0,$tid]);
                echo json_encode(["status"=>"success"]);
            }
        }
        break;

    case 'support':
        if ($method === 'GET') {
            $st = $db->prepare("SELECT * FROM support_tickets WHERE technician_id=? ORDER BY created_at DESC");
            $st->execute([$tid]); $tickets = $st->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status"=>"success","tickets"=>$tickets]);
        } else {
            $d = json_decode(file_get_contents("php://input"), true);
            $subject = trim($d['subject'] ?? '');
            if (!$subject) { echo json_encode(["status"=>"error","message"=>"Subject required"]); exit; }
            $ticketId = 'KWK'.rand(100000,999999);
            $db->prepare("INSERT INTO support_tickets (ticket_id,technician_id,subject,description) VALUES (?,?,?,?)")->execute([$ticketId,$tid,$subject,$d['description']??'']);
            echo json_encode(["status"=>"success","message"=>"Ticket raised","ticket_id"=>$ticketId]);
        }
        break;

    case 'profile':
        if ($method === 'GET') {
            $st = $db->prepare("SELECT t.*,b.account_holder,b.account_number,b.ifsc_code,b.bank_name,b.upi_id,s.language,s.app_theme,s.offline_mode,s.auto_logout,s.two_step_verification FROM technicians t LEFT JOIN bank_details b ON t.id=b.technician_id LEFT JOIN user_settings s ON t.id=s.technician_id WHERE t.id=?");
            $st->execute([$tid]); $profile = $st->fetch(PDO::FETCH_ASSOC);
            unset($profile['password']);
            echo json_encode(["status"=>"success","profile"=>$profile]);
        } else {
            $d = json_decode(file_get_contents("php://input"), true);
            $action = $d['action'] ?? 'update_profile';
            if ($action === 'update_profile') {
                $db->prepare("UPDATE technicians SET full_name=?,mobile=?,email=?,service_category=?,experience=?,city=? WHERE id=?")->execute([$d['full_name'],$d['mobile'],$d['email'],$d['service_category'],$d['experience'],$d['city'],$tid]);
                echo json_encode(["status"=>"success","message"=>"Profile updated"]);
            } elseif ($action === 'change_password') {
                $st = $db->prepare("SELECT password FROM technicians WHERE id=?");
                $st->execute([$tid]); $cur = $st->fetch(PDO::FETCH_ASSOC)['password'];
                if (!password_verify($d['old_password']??'',$cur)) { echo json_encode(["status"=>"error","message"=>"Old password incorrect"]); exit; }
                $db->prepare("UPDATE technicians SET password=? WHERE id=?")->execute([password_hash($d['new_password'],PASSWORD_DEFAULT),$tid]);
                echo json_encode(["status"=>"success","message"=>"Password changed"]);
            } elseif ($action === 'update_bank') {
                $db->prepare("INSERT INTO bank_details (technician_id,account_holder,account_number,ifsc_code,bank_name,upi_id) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE account_holder=VALUES(account_holder),account_number=VALUES(account_number),ifsc_code=VALUES(ifsc_code),bank_name=VALUES(bank_name),upi_id=VALUES(upi_id)")->execute([$tid,$d['account_holder'],$d['account_number'],$d['ifsc_code'],$d['bank_name'],$d['upi_id']]);
                echo json_encode(["status"=>"success","message"=>"Bank details updated"]);
            } elseif ($action === 'update_settings') {
                $db->prepare("UPDATE user_settings SET language=?,app_theme=?,offline_mode=?,auto_logout=?,two_step_verification=? WHERE technician_id=?")->execute([$d['language']??'English',$d['app_theme']??'Light',$d['offline_mode']?1:0,$d['auto_logout']??30,$d['two_step_verification']?1:0,$tid]);
                echo json_encode(["status"=>"success","message"=>"Settings updated"]);
            }
        }
        break;

    default:
        echo json_encode(["status"=>"error","message"=>"Invalid module"]);
}
?>
