<?php
/**
 * POST /api/technician
 * Save a technician application submitted from the Join Now modal.
 *
 * Expected body:
 *   { name, phone, email, city, pin, exp, skills, idType, idNum, about }
 */

require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = getJsonInput();
requireFields($data, ['name', 'phone', 'city', 'pin', 'exp', 'skills']);

$phone = preg_replace('/\D/', '', $data['phone']);
if (strlen($phone) < 10) {
  jsonResponse(['error' => 'Invalid phone number'], 400);
}
if (!preg_match('/^\d{6}$/', $data['pin'])) {
  jsonResponse(['error' => 'Invalid pincode'], 400);
}
if (empty($data['skills']) || !is_array($data['skills'])) {
  jsonResponse(['error' => 'At least one skill is required'], 400);
}

// TODO: persist to MySQL (technicians table)

jsonResponse([
  'ok' => true,
  'message' => 'Application received — our team will review your profile and reach out within 48 hours.',
  'application_id' => uniqid('TECH', true),
]);
