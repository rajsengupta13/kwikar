<?php
// ── Razorpay Configuration ────────────────────────────────
// Get your keys from: https://dashboard.razorpay.com/app/keys
// Real values come from the project root `.env` file (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).
require_once __DIR__ . '/../../../backend/env.php';

define('RAZORPAY_KEY_ID',     env('RAZORPAY_KEY_ID', ''));
define('RAZORPAY_KEY_SECRET', env('RAZORPAY_KEY_SECRET', ''));
