<?php
/**
 * Kwikar — minimal .env loader (no Composer dependency).
 *
 * Reads KEY=VALUE pairs from the project root .env file into
 * getenv()/$_ENV/$_SERVER. Safe to call multiple times; only
 * loads once per request. Missing .env is not an error — the
 * app falls back to whatever is already in the environment
 * (e.g. variables injected by Docker or the hosting panel).
 */

if (!function_exists('env')) {
    function load_env(string $path): void {
        static $loaded = false;
        if ($loaded || !is_file($path)) { $loaded = true; return; }

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;

            $pos = strpos($line, '=');
            if ($pos === false) continue;

            $key = trim(substr($line, 0, $pos));
            $val = trim(substr($line, $pos + 1));

            // Strip matching surrounding quotes
            if (strlen($val) >= 2 && (
                ($val[0] === '"' && $val[-1] === '"') ||
                ($val[0] === "'" && $val[-1] === "'")
            )) {
                $val = substr($val, 1, -1);
            }

            if (getenv($key) === false) {
                putenv("$key=$val");
                $_ENV[$key]    = $val;
                $_SERVER[$key] = $val;
            }
        }

        $loaded = true;
    }

    /**
     * Fetch an environment value with an optional default and
     * basic type coercion for the common "true"/"false"/"null" strings.
     */
    function env(string $key, $default = null) {
        $value = getenv($key);
        if ($value === false) return $default;

        switch (strtolower($value)) {
            case 'true':  case '(true)':  return true;
            case 'false': case '(false)': return false;
            case 'null':  case '(null)':  return null;
            case 'empty': case '(empty)': return '';
        }

        return $value;
    }

    /**
     * Sends the Access-Control-Allow-Origin header from CORS_ALLOWED_ORIGIN.
     * Defaults to "*" (matches the app's previous behaviour) so existing
     * dev setups keep working; set a real origin in .env for production.
     */
    function send_cors_origin_header(): void {
        header('Access-Control-Allow-Origin: ' . env('CORS_ALLOWED_ORIGIN', '*'));
    }
}

load_env(__DIR__ . '/../.env');
