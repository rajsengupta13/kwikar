<?php
/**
 * Run ONCE in browser to create the Super Admin account.
 * URL: http://localhost/mono-kwikar/admin/backend/seed_admin.php
 * DELETE this file after use!
 *
 * Tables must already exist — run new_schema.sql first.
 */
ini_set('display_errors', '0');
require_once __DIR__ . '/config/database.php';

$db = (new Database())->getConnection();

$name  = 'Super Admin';
$email = 'admin@kwikar.com';
$phone = '0000000000';
$password = 'Admin@123';   // Change immediately after first login

// Abort if admin already exists
$st = $db->prepare("SELECT id FROM users WHERE email = ? AND role = 'admin' LIMIT 1");
$st->execute([$email]);
if ($st->fetchColumn()) {
    die("<pre style='font-family:monospace;padding:20px'>⚠ Admin already exists: $email\nDelete this file now.</pre>");
}

$hash = password_hash($password, PASSWORD_BCRYPT);

$db->prepare("INSERT INTO users (name, phone, email, pass_pin, role, status) VALUES (?,?,?,?,'admin','active')")
   ->execute([$name, $phone, $email, $hash]);
$userId = (int) $db->lastInsertId();

$db->prepare("INSERT INTO admins (user_id, is_super) VALUES (?, 1)")->execute([$userId]);

echo "<pre style='font-family:monospace;padding:20px;background:#0d1117;color:#22D3EE'>
✅ Super Admin created!

  Email   : $email
  Password: $password

⚠ IMPORTANT:
  1. Delete this file: admin/backend/seed_admin.php
  2. Change password after first login
  3. Visit: http://localhost/mono-kwikar/admin/frontend/
</pre>";
