<?php
/**
 * Kwikar — Database & app config.
 * Update credentials when wiring up MySQL on XAMPP.
 */

return [
  'db' => [
    'host' => 'localhost',
    'name' => 'kwikar',
    'user' => 'root',
    'pass' => '',
    'port' => 3306,
    'charset' => 'utf8mb4',
  ],
  'app' => [
    'env' => 'development',
    'timezone' => 'Asia/Kolkata',
    'launch_date' => '2026-05-26',
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
