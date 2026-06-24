// ═══════════════════════════════════════════════
//  Service Worker — Inch & Soot Converter
//  Caches app for offline use
// ═══════════════════════════════════════════════

const CACHE_NAME = 'inch-converter-v2';

// Files to cache for offline use
const PRECACHE_URLS = [
  './',
  './index.html',
  './privacy.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;600&display=swap'
];

// Install — cache all core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // don't block if font fails
  );
});

// Activate — clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for local files, network-first for others
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // For same-origin requests: cache first, fallback to network
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request)
          .then(response => {
            // Cache successful responses
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
        )
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For external requests (fonts, ads): network first, no caching
  event.respondWith(
    fetch(event.request).catch(() => new Response('', { status: 408 }))
  );
});
