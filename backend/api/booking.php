<?php
/**
 * POST /api/booking
 * Save a service booking submitted from the booking modal.
 *
 * Expected body:
 *   { phone, appliance, applianceName, issue, issueLabel, issueText, pincode }
 */

require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = getJsonInput();
requireFields($data, ['phone', 'appliance', 'issue']);

$phone = preg_replace('/\D/', '', $data['phone']);
if (strlen($phone) < 10) {
  jsonResponse(['error' => 'Invalid phone number'], 400);
}

// TODO: persist to MySQL
// $cfg = loadConfig();
// $pdo = new PDO("mysql:host={$cfg['db']['host']};dbname={$cfg['db']['name']};charset={$cfg['db']['charset']}", $cfg['db']['user'], $cfg['db']['pass']);
// $stmt = $pdo->prepare('INSERT INTO bookings (phone, appliance, issue, issue_text, pincode, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
// $stmt->execute([$phone, $data['appliance'], $data['issue'], $data['issueText'] ?? '', $data['pincode'] ?? '']);
// $bookingId = $pdo->lastInsertId();

jsonResponse([
  'ok' => true,
  'message' => 'Booking received — our technician will contact you within 30 minutes.',
  'booking_id' => uniqid('BK', true),
]);
