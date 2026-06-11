<?php
session_start();

function checkAbdAuth() {
    if (!isset($_SESSION['abd_id'])) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized. Please login."]);
        exit();
    }
    return $_SESSION['abd_id'];
}

function getAbdId() {
    return $_SESSION['abd_id'] ?? null;
}
