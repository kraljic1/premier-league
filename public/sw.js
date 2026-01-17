const CACHE_NAME = "pl-tracker-v7";
const STATIC_CACHE = "pl-static-v7";
const API_CACHE = "pl-api-v7";

const urlsToCache = [
  "/",
  "/fixtures-results",
  "/standings",
  "/compare-fixtures",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// Check if a URL scheme is cacheable (only http/https)
const isCacheableScheme = (url) => {
  const scheme = url.protocol;
  return scheme === 'http:' || scheme === 'https:';
};

// Cache strategies
const cacheFirst = async (request) => {
  const url = new URL(request.url);
  
  // Skip caching for unsupported schemes (chrome-extension, moz-extension, etc.)
  if (!isCacheableScheme(url)) {
    return fetch(request);
  }
  
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Cache-first strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
};

const networkFirst = async (request) => {
  const url = new URL(request.url);
  
  // Skip caching for unsupported schemes
  if (!isCacheableScheme(url)) {
    return fetch(request);
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Network-first strategy failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
};

const staleWhileRevalidate = async (request) => {
  const url = new URL(request.url);
  
  // Skip caching for unsupported schemes
  if (!isCacheableScheme(url)) {
    return fetch(request);
  }
  
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
};

self.addEventListener("install", (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err);
            return Promise.resolve();
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip unsupported URL schemes (chrome-extension, moz-extension, etc.)
  if (!isCacheableScheme(url)) {
    return; // Let browser handle it natively
  }

  // API routes - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - Cache first
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages - Stale while revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default cache-first strategy
  event.respondWith(cacheFirst(request));
});

