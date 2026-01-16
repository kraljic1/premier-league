const CACHE_NAME = "pl-tracker-v1";
const urlsToCache = [
  "/",
  "/fixtures",
  "/standings",
  "/compare",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache each URL individually to prevent one failure from breaking all caching
      return Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err);
            // Return a resolved promise so Promise.allSettled doesn't fail
            return Promise.resolve();
          })
        )
      );
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

