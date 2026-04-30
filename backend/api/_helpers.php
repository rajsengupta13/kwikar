<?php
/**
 * Shared helpers for all /api endpoints.
 */

function jsonResponse($data, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function getJsonInput(): array {
  $raw = file_get_contents('php://input');
  $decoded = json_decode($raw, true);
  return is_array($decoded) ? $decoded : [];
}

function requireFields(array $data, array $fields): void {
  $missing = [];
  foreach ($fields as $f) {
    if (!isset($data[$f]) || $data[$f] === '') $missing[] = $f;
  }
  if ($missing) {
    jsonResponse(['error' => 'Missing required fields', 'fields' => $missing], 400);
  }
}

function loadConfig(): array {
  return require __DIR__ . '/../config.php';
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  jsonResponse(['ok' => true]);
}
