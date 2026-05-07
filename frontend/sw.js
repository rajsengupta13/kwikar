/* ═══════════════════════════════════════════════
   Kwikar Service Worker  v1.0
   Strategy:
     • Static assets  → Cache First
     • Images         → Stale While Revalidate
     • Pages          → Network First + offline fallback
     • Form data      → Background Sync queue
═══════════════════════════════════════════════ */

const CACHE_STATIC  = 'kwikar-static-v1.2.5';
const CACHE_IMAGES  = 'kwikar-images-v1.2.5';
const CACHE_PAGES   = 'kwikar-pages-v1.2.5';
const ALL_CACHES    = [CACHE_STATIC, CACHE_IMAGES, CACHE_PAGES];
const OFFLINE_URL   = 'offline.html';

const BASE = self.registration.scope;
const STATIC_ASSETS = [
  BASE + 'index.html',
  BASE + 'offline.html',
  BASE + 'manifest.json',
];

/* ── INSTALL ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // ── Images (Unsplash + icons) → Stale While Revalidate
  if (
    url.hostname.includes('unsplash.com') ||
    url.pathname.startsWith('/images/icons/')
  ) {
    event.respondWith(staleWhileRevalidate(request, CACHE_IMAGES));
    return;
  }

  // ── Google Fonts → Cache First
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // ── HTML pages → Network First + Offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // ── Everything else → Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
});

/* ─── Strategies ─── */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || await fetchPromise || new Response('Offline', { status: 503 });
}

async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response('<h1>You are offline</h1>', { headers: { 'Content-Type': 'text/html' } });
  }
}

/* ── BACKGROUND SYNC (form submissions) ── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-notify-form') {
    event.waitUntil(syncForms('kwikar-notify-queue'));
  }
  if (event.tag === 'sync-tech-form') {
    event.waitUntil(syncForms('kwikar-tech-queue'));
  }
});

async function syncForms(storeName) {
  // In production: open IndexedDB, get queued requests, send to server
  console.log(`[SW] Syncing ${storeName}...`);
  // Notify the client
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE', store: storeName }));
}

/* ── PUSH NOTIFICATIONS ── */
self.addEventListener('push', event => {
  const data = event.data?.json() || {
    title: 'Kwikar',
    body: 'We are launching in Bhagalpur soon! 🚀',
    icon: '/images/icons/icon-192.png',
    badge: '/images/icons/icon-72.png',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/images/icons/icon-192.png',
      badge: data.badge || '/images/icons/icon-72.png',
      tag: 'kwikar-notification',
      renotify: true,
      data: { url: data.url || '/' },
      actions: [
        { action: 'check-pin',  title: '📍 Check Pincode' },
        { action: 'dismiss',    title: '✕ Dismiss' },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'check-pin') {
    event.waitUntil(clients.openWindow('/#pincode'));
  } else {
    event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
  }
});

/* ── MESSAGE from page ── */
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CACHE_URLS') {
    caches.open(CACHE_STATIC).then(cache => cache.addAll(event.data.urls || []));
  }
});
