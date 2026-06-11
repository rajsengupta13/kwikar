<?php
function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;

    $cfg = require __DIR__ . '/config.php';
    $d   = $cfg['db'];

    // Ensure the database exists (safe on fresh installs)
    $boot = new PDO(
        "mysql:host={$d['host']};port={$d['port']};charset={$d['charset']}",
        $d['user'], $d['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $boot->exec("CREATE DATABASE IF NOT EXISTS `{$d['name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"); // creates kwikar_db if missing
    $boot = null;

    $pdo = new PDO(
        "mysql:host={$d['host']};port={$d['port']};dbname={$d['name']};charset={$d['charset']}",
        $d['user'],
        $d['pass'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    return $pdo;
}
