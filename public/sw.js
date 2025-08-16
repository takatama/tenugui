const CACHE_NAME = "tenugui-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  // アイコンファイルが実際に存在する場合のみ追加
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
                result.reason
              );
            }
          });
        }
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Share Target検出のログ
  if (
    requestUrl.pathname === "/items/new" &&
    requestUrl.searchParams.has("url")
  ) {
    console.log("Share Target activated:", {
      url: requestUrl.searchParams.get("url"),
      title: requestUrl.searchParams.get("title"),
      text: requestUrl.searchParams.get("text"),
    });
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => fetch(event.request))
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
        })
      );
    })
  );
});
