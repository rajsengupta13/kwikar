<?php
session_start();

function checkAuth() {
    if (!isset($_SESSION['technician_id'])) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized. Please login."]);
        exit();
    }
    return $_SESSION['technician_id'];
}

function getTechId() {
    return $_SESSION['technician_id'] ?? null;
}
?>
