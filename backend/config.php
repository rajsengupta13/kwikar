<?php
/**
 * Kwikar — Database & app config.
 * Real values come from the project root `.env` file (see .env.example).
 * Update `.env` when wiring up MySQL — never hard-code secrets here.
 */

require_once __DIR__ . '/env.php';

return [
  'db' => [
    'host'    => env('DB_HOST', 'localhost'),
    'name'    => env('DB_DATABASE', 'kwikar_db'),
    'user'    => env('DB_USERNAME', 'root'),
    'pass'    => env('DB_PASSWORD', ''),
    'port'    => (int) env('DB_PORT', 3306),
    'charset' => env('DB_CHARSET', 'utf8mb4'),
  ],
  'admin_secret' => env('ADMIN_SECRET', 'change-me-to-a-long-random-string'),

  'mail' => [
    'host'         => env('MAIL_HOST', ''),
    'port'         => (int) env('MAIL_PORT', 587),
    'username'     => env('MAIL_USERNAME', ''),
    'password'     => env('MAIL_PASSWORD', ''),
    'encryption'   => env('MAIL_ENCRYPTION', 'tls'),
    'from_address' => env('MAIL_FROM_ADDRESS', ''),
    'from_name'    => env('MAIL_FROM_NAME', 'Kwikar'),
  ],

  'app' => [
    'env' => env('APP_ENV', 'development'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost/mono-kwikar'),
    'timezone' => env('APP_TIMEZONE', 'Asia/Kolkata'),
    'launch_date' => env('APP_LAUNCH_DATE', '2026-05-26'),
    'service_areas' => [
      '812001' => 'Bhagalpur City Centre',
      '812002' => 'Adampur',
      '812006' => 'Nathnagar',
      '812004' => 'Barari',
      '812005' => 'Mayaganj',
      '812006' => 'Champanagar',
      '812007' => 'Bhagalpur Sadar',
      '812008' => 'Sabour',
      '812009' => 'Colgong',
      '812010' => 'Kahalgaon Road Area',
      '812011' => 'Bihpur',
      '812012' => 'Pirpainti',
      '813101' => 'Banka',
      '813102' => 'Amarpur',
      '813104' => 'Katoria',
      '813202' => 'Sultanganj',
      '813214' => 'Kahalgaon',
      '813221' => 'Naugachhia',
    ],
  ],
];
