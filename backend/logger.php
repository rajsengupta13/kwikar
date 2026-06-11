<?php
require_once __DIR__ . '/env.php';

// Severity order — messages below the configured LOG_LEVEL are dropped.
const KWIKAR_LOG_LEVELS = ['INFO' => 0, 'WARNING' => 1, 'ERROR' => 2, 'PHP_ERROR' => 2, 'EXCEPTION' => 2];

function kwikar_log($level, $message, $context = []) {
    $minLevel = strtoupper(env('LOG_LEVEL', 'info'));
    $minRank  = KWIKAR_LOG_LEVELS[$minLevel] ?? 0;
    $rank     = KWIKAR_LOG_LEVELS[strtoupper($level)] ?? 0;
    if ($rank < $minRank) return;

    $date     = date('Y-m-d');
    $time     = date('H:i:s');
    $base     = env('LOG_PATH', 'logs');
    $base     = ($base[0] ?? '') === '/' ? $base : __DIR__ . '/' . $base;
    $dir      = $base . '/' . $date;

    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $file     = $dir . '/error.log';
    $ctx      = !empty($context) ? ' | ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';
    $ip       = $_SERVER['REMOTE_ADDR'] ?? 'CLI';
    $method   = $_SERVER['REQUEST_METHOD'] ?? '-';
    $uri      = $_SERVER['REQUEST_URI'] ?? '-';
    $line     = "[{$date} {$time}] [{$level}] {$message}{$ctx} | IP:{$ip} {$method} {$uri}" . PHP_EOL;

    file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
}

function log_error($msg, $ctx = [])   { kwikar_log('ERROR',   $msg, $ctx); }
function log_warning($msg, $ctx = []) { kwikar_log('WARNING', $msg, $ctx); }
function log_info($msg, $ctx = [])    { kwikar_log('INFO',    $msg, $ctx); }

// Auto-catch PHP errors — return true to suppress PHP's default output handler
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    kwikar_log('PHP_ERROR', $errstr, [
        'code' => $errno,
        'file' => basename($errfile),
        'line' => $errline
    ]);
    return true;
});

set_exception_handler(function($e) {
    kwikar_log('EXCEPTION', $e->getMessage(), [
        'file'  => basename($e->getFile()),
        'line'  => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
    exit;
});
