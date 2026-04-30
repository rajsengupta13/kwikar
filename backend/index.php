<?php
/**
 * Kwikar Backend — entry point.
 *
 * The actual landing page lives in /frontend/index.html and is served by
 * the root .htaccess. This file exists as a safety fallback so that
 * direct access to /backend/ never reveals the API folder listing.
 */

header('Location: ../frontend/index.html');
exit;
