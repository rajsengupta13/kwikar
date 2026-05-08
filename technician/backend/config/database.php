<?php
require_once __DIR__ . '/../../../backend/db.php';

class Database {
    public function getConnection(): PDO {
        return db();
    }
}
