<?php
/**
 * POST /api/notify
 * Add a user to the launch-notification waitlist.
 *
 * Expected body: { name, phone, email, pincode }
 */

require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = getJsonInput();
requireFields($data, ['name', 'phone']);

$phone = preg_replace('/\D/', '', $data['phone']);
if (strlen($phone) < 10) {
  jsonResponse(['error' => 'Invalid phone number'], 400);
}

// TODO: persist to MySQL (waitlist table)

jsonResponse([
  'ok' => true,
  'message' => "You're on the waitlist — we'll notify you when Kwikar launches in your area.",
]);
