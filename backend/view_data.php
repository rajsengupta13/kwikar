<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/db.php';
$pdo = db();  
try {
    $bookings = $pdo->query("SELECT * FROM kwikar_bookings ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
    $requests = $pdo->query("SELECT * FROM kwikar_area_requests ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    log_error('view_data query failed', ['error' => $e->getMessage()]);
    die("<h2 style='color:red;font-family:sans-serif;padding:20px'>Query Error: ".$e->getMessage()."</h2>");
}
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Kwikar — Database Viewer</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:sans-serif;background:#f4f6fb;color:#0d1b3e;padding:24px}
h1{font-size:1.5rem;margin-bottom:4px}
.sub{color:#64748b;font-size:.85rem;margin-bottom:28px}
h2{font-size:1.1rem;margin:28px 0 12px;padding:8px 14px;background:#0d1b3e;color:#fff;border-radius:8px}
.count{font-size:.8rem;background:#dce8ff;color:#0d1b3e;padding:2px 8px;border-radius:20px;margin-left:8px;font-weight:700}
.empty{background:#fff;border-radius:10px;padding:20px;color:#94a3b8;font-size:.9rem;border:1.5px dashed #e2e8f0}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);font-size:.8rem}
th{background:#0d1b3e;color:#fff;padding:10px 12px;text-align:left;white-space:nowrap}
td{padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f8faff}
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:.72rem;font-weight:700}
.pending{background:#fef9c3;color:#854d0e}
.confirmed{background:#dcfce7;color:#166534}
.yes{background:#dcfce7;color:#166534}
.no{background:#fee2e2;color:#991b1b}
.avail{background:#dcfce7;color:#166534}
.unavail{background:#fee2e2;color:#991b1b}
</style>
</head>
<body>
<h1>🗄️ Kwikar Database Viewer</h1>
<div class="sub">Live data from <strong>kwikar</strong> — Refreshes on page reload</div>

<h2>📋 Bookings <span class="count"><?=count($bookings)?></span></h2>
<?php if(empty($bookings)): ?>
<div class="empty">Abhi tak koi booking nahi aayi. Booking karo pehle!</div>
<?php else: ?>
<div style="overflow-x:auto">
<table>
<tr>
  <th>#</th><th>Service</th><th>Issue</th><th>Other Issue</th>
  <th>Slot</th><th>Date</th><th>Name</th><th>Phone</th>
  <th>Profession</th><th>Address</th><th>Pincode</th>
  <th>Available</th><th>Status</th><th>Created At</th>
</tr>
<?php foreach($bookings as $b): ?>
<tr>
  <td><?=$b['id']?></td>
  <td><strong><?=htmlspecialchars($b['service'])?></strong></td>
  <td><?=htmlspecialchars($b['issue'])?></td>
  <td><?=htmlspecialchars($b['other_issue'])?:'-'?></td>
  <td><?=htmlspecialchars($b['slot_time'])?></td>
  <td><?=htmlspecialchars($b['slot_date'])?></td>
  <td><?=htmlspecialchars($b['user_name'])?></td>
  <td><?=htmlspecialchars($b['user_phone'])?></td>
  <td><?=htmlspecialchars($b['profession'])?></td>
  <td><?=htmlspecialchars(substr($b['full_address'],0,40))?><?=strlen($b['full_address'])>40?'...':''?></td>
  <td><?=htmlspecialchars($b['pincode'])?></td>
  <td><span class="badge <?=$b['pincode_available']?'avail':'unavail'?>"><?=$b['pincode_available']?'Yes':'No'?></span></td>
  <td><span class="badge <?=$b['status']?>"><?=$b['status']?></span></td>
  <td style="white-space:nowrap"><?=$b['created_at']?></td>
</tr>
<?php endforeach; ?>
</table>
</div>
<?php endif; ?>

<h2>📍 Area Requests <span class="count"><?=count($requests)?></span></h2>
<?php if(empty($requests)): ?>
<div class="empty">Koi area request nahi aayi abhi tak.</div>
<?php else: ?>
<div style="overflow-x:auto">
<table>
<tr>
  <th>#</th><th>Pincode</th><th>Name</th><th>Phone</th><th>Profession</th><th>Wants Service</th><th>Created At</th>
</tr>
<?php foreach($requests as $r): ?>
<tr>
  <td><?=$r['id']?></td>
  <td><?=htmlspecialchars($r['pincode'])?></td>
  <td><?=htmlspecialchars($r['user_name'])?></td>
  <td><?=htmlspecialchars($r['user_phone'])?></td>
  <td><?=htmlspecialchars($r['profession'])?></td>
  <td><span class="badge <?=$r['wants_service']?'yes':'no'?>"><?=$r['wants_service']?'Haan':'Nahi'?></span></td>
  <td style="white-space:nowrap"><?=$r['created_at']?></td>
</tr>
<?php endforeach; ?>
</table>
</div>
<?php endif; ?>
</body>
</html>
