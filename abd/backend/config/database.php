<?php
/**
 * ABD Panel — direct PDO connection.
 * Does NOT go through backend/db.php to avoid CREATE TABLE conflicts
 * with the existing old schema (users.user_id vs users.id etc.)
 */
class Database {
    private static ?PDO $pdo = null;

    public function getConnection(): PDO {
        if (self::$pdo) return self::$pdo;

        $cfg = require __DIR__ . '/../../../backend/config.php';
        $d   = $cfg['db'];

        self::$pdo = new PDO(
            "mysql:host={$d['host']};port={$d['port']};dbname={$d['name']};charset={$d['charset']}",
            $d['user'],
            $d['pass'],
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );

        return self::$pdo;
    }
}
