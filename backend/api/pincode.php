<?php
/**
 * GET /api/pincode?pin=812006
 * Check whether Kwikar service is available at a pincode.
 *
 * Returns:
 *   { ok: true, available: true,  area: 'Champanagar' }   -- direct serviceable area
 *   { ok: true, available: false, adjacent: true }         -- 812/813 prefix, coming soon
 *   { ok: true, available: false }                         -- out of area
 *   { error: '...' }                                       -- invalid input
 */

require_once __DIR__ . '/_helpers.php';

$pin = $_GET['pin'] ?? '';
if (!preg_match('/^\d{6}$/', $pin)) {
  jsonResponse(['error' => 'Invalid pincode — must be 6 digits'], 400);
}

$cfg = loadConfig();
$areas = $cfg['app']['service_areas'] ?? [];

if (isset($areas[$pin])) {
  jsonResponse(['ok' => true, 'available' => true, 'area' => $areas[$pin]]);
}

if (str_starts_with($pin, '812') || str_starts_with($pin, '813')) {
  jsonResponse(['ok' => true, 'available' => false, 'adjacent' => true]);
}

jsonResponse(['ok' => true, 'available' => false]);
