<?php
/**
 * Kwikar — signed login tokens.
 *
 * Used to carry proof of a successful phone+PIN login (technician /
 * ABD partner) across to their separate panel's setup_session endpoint,
 * which has no PIN of its own to check. A bare phone number is NOT
 * proof of identity — this token is.
 */

require_once __DIR__ . '/config.php';

function magic_token_secret(): string {
    static $secret = null;
    if ($secret === null) {
        $cfg    = require __DIR__ . '/config.php';
        $secret = $cfg['admin_secret'];
    }
    return $secret;
}

/**
 * Issue a signed token proving `$phone` just logged in as `$role`.
 * Valid for $ttlDays (default 30) — acts like a remember-me token.
 */
function make_magic_token(string $role, string $phone, int $ttlDays = 30): array {
    $expires = time() + ($ttlDays * 86400);
    $payload = $role . '|' . $phone . '|' . $expires;
    $sig     = hash_hmac('sha256', $payload, magic_token_secret());
    $token   = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=') . '.' . $sig;
    return ['token' => $token, 'expires_at' => $expires];
}

/**
 * Verify a token matches the expected role + phone and hasn't expired.
 * Returns true/false — never trust phone alone, always call this.
 */
function verify_magic_token(string $role, string $phone, ?string $token): bool {
    if (!$token || !str_contains($token, '.')) return false;
    [$encPayload, $sig] = explode('.', $token, 2);

    $payload = base64_decode(strtr($encPayload, '-_', '+/'));
    if ($payload === false) return false;

    $expectedSig = hash_hmac('sha256', $payload, magic_token_secret());
    if (!hash_equals($expectedSig, $sig)) return false;

    $parts = explode('|', $payload);
    if (count($parts) !== 3) return false;
    [$tRole, $tPhone, $tExpires] = $parts;

    if ($tRole !== $role)   return false;
    if ($tPhone !== $phone) return false;
    if ((int) $tExpires < time()) return false;

    return true;
}
