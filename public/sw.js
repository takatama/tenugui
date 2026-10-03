const CACHE_NAME = "tenugui-japandi-v2";
const urlsToCache = [
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache opened successfully");
      // 個別にキャッシュしてエラーハンドリング
      return Promise.allSettled(urlsToCache.map((url) => cache.add(url))).then(
        (results) => {
          results.forEach((result, index) => {
            if (result.status === "rejected") {
              console.warn(
                `Failed to cache ${urlsToCache[index]}:`,
                result.reason,
              );
            }
          });
        },
      );
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Never cache mutable pages, authentication, API responses or uploaded photos.
  // Static assets remain available offline without replaying stale/private data.
  if (
    event.request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    !(
      requestUrl.pathname.startsWith("/assets/") ||
      requestUrl.pathname.startsWith("/icons/") ||
      requestUrl.pathname === "/manifest.json" ||
      requestUrl.pathname.startsWith("/images/hero-") ||
      requestUrl.pathname.endsWith(".svg")
    )
  )
    return;

  event.respondWith(
    caches
      .match(event.request)
      .then(async (cached) => {
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      })
      .catch(() => fetch(event.request)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
