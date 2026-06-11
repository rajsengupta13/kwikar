const CACHE_NAME = 'kwikar-technician-v1.0.6';
const SHELL = [
  './index.html',
  './tech.css',
  './tech.js',
  './manifest.json'
];

// Install: cache shell files individually so ONE failure can't block the whole install.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(SHELL.map(url => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith('kwikar-technician-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isApi   = url.pathname.includes('/api/');
  const isShell = !isApi && SHELL.some(p =>
    url.pathname.endsWith(p.replace('./', '/'))
  );

  // API — network only, return structured JSON on failure so the app handles it.
  if (isApi) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ status: 'error', message: 'Offline — no network' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // App shell — cache-first so PWA opens instantly even offline.
  if (isShell) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          // Revalidate in background regardless of cache hit.
          fetch(request).then(response => {
            if (response && response.ok) cache.put(request, response.clone());
          }).catch(() => {});
          // Serve cached immediately; fall to network on first visit.
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // CDN assets (fonts, chart.js, icons) — network-first, cached fallback.
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
