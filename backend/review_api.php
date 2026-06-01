<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/db.php';

set_exception_handler(function (Throwable $e) {
    if (!headers_sent()) http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
    exit;
});

$pdo    = db();
$action = $_GET['action'] ?? 'save_review';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

// ═══════════════════════════════════════════════════════════════
// save_review  — store a user's site review
// ═══════════════════════════════════════════════════════════════
if ($action === 'save_review' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $name        = trim($body['name']        ?? '');
    $phone       = trim($body['phone']       ?? '');
    $rating      = (int) ($body['rating']    ?? 0);
    $review_text = trim($body['review_text'] ?? '');
    $page_source = trim($body['page_source'] ?? 'homepage');

    if ($rating < 1 || $rating > 5) {
        echo json_encode(['success' => false, 'error' => 'Rating must be between 1 and 5']);
        exit;
    }
    if (!$review_text) {
        echo json_encode(['success' => false, 'error' => 'Review text is required']);
        exit;
    }

    $pdo->prepare("
        INSERT INTO site_reviews (name, phone, rating, review_text, page_source)
        VALUES (?, ?, ?, ?, ?)
    ")->execute([$name ?: null, $phone ?: null, $rating, $review_text, $page_source]);

    $id = (int) $pdo->lastInsertId();
    log_info('Site review saved', ['id' => $id, 'rating' => $rating]);
    echo json_encode(['success' => true, 'id' => $id]);
    exit;
}

// ═══════════════════════════════════════════════════════════════
// get_reviews  — fetch approved reviews (for admin or display)
// ═══════════════════════════════════════════════════════════════
if ($action === 'get_reviews') {
    $limit  = min((int) ($_GET['limit']  ?? 20), 100);
    $offset = (int) ($_GET['offset'] ?? 0);
    $status = $_GET['status'] ?? 'approved';

    $allowed = ['pending', 'approved', 'rejected', 'all'];
    if (!in_array($status, $allowed)) $status = 'approved';

    $where = $status === 'all' ? '' : "WHERE status = ?";
    $params = $status === 'all' ? [] : [$status];
    $params[] = $limit;
    $params[] = $offset;

    $st = $pdo->prepare("
        SELECT id, name, rating, review_text, page_source, status, created_at
        FROM   site_reviews
        {$where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");
    $st->execute($params);

    echo json_encode(['success' => true, 'reviews' => $st->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Unknown action']);
