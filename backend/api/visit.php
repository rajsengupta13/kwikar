<?php
/**
 * POST /api/visit
 * Records a visit with the user's pincode in MySQL `visits` table.
 *
 * Body: { pincode: "812006" }
 * Returns: { ok, available, area?, title, message }
 */

require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(['error' => 'Method not allowed'], 405);
}

$data    = getJsonInput();
$pincode = trim($data['pincode'] ?? '');

if (!preg_match('/^\d{6}$/', $pincode)) {
  jsonResponse(['error' => 'Please enter a valid 6-digit pincode'], 400);
}

$cfg   = loadConfig();
$areas = $cfg['app']['service_areas'] ?? [];

$area      = $areas[$pincode] ?? null;
$adjacent  = !$area && (str_starts_with($pincode, '812') || str_starts_with($pincode, '813'));
$available = (bool) $area;

// ── Persist to MySQL ─────────────────────────────────────────────
try {
  $pdo  = db();
  $stmt = $pdo->prepare(
    'INSERT INTO visits (pincode, area, available, ip, user_agent) VALUES (?, ?, ?, ?, ?)'
  );
  $stmt->execute([
    $pincode,
    $area,
    $available ? 1 : 0,
    $_SERVER['REMOTE_ADDR']     ?? null,
    $_SERVER['HTTP_USER_AGENT'] ?? null,
  ]);
} catch (Throwable $e) {
  jsonResponse([
    'error'  => 'Could not save visit — make sure MySQL is running in XAMPP',
    'detail' => $e->getMessage(),
  ], 500);
}

// ── Build welcome response ───────────────────────────────────────
if ($available) {
  jsonResponse([
    'ok'        => true,
    'available' => true,
    'area'      => $area,
    'title'     => '🎉 Welcome to Kwikar!',
    'message'   => "Great news — our service is available in {$area}! Get a verified technician at your doorstep in 60 minutes.",
  ]);
}

if ($adjacent) {
  jsonResponse([
    'ok'        => true,
    'available' => false,
    'adjacent'  => true,
    'title'     => '📍 Coming Soon to Your Area!',
    'message'   => "Pincode {$pincode} is in a Bhagalpur-adjacent area. We're expanding fast and you'll be among the first to know.",
  ]);
}

jsonResponse([
  'ok'        => true,
  'available' => false,
  'title'     => '👋 Welcome!',
  'message'   => "Pincode {$pincode} isn't in our service area yet, but we're growing rapidly. We'll notify you when Kwikar arrives in your locality!",
]);
