// Replaced by the Vite build: every release gets a new worker at /sw.js.
const BUILD_VERSION = "__TENUGUI_BUILD_VERSION__";
const CACHE_PREFIX = "tenugui-";
const CACHE_NAME = `${CACHE_PREFIX}static-${BUILD_VERSION}`;
const ASSET_CACHE_NAME = `${CACHE_PREFIX}assets-v1`;
const isImmutable = (pathname) => /^\/assets\/.+-[\w-]{8,}\.(?:js|css|woff2?|png|jpe?g|webp|avif|gif|svg)$/.test(pathname);
const STATIC_IMAGES = new Set([
  "/images/hero-tenugui.jpg", "/images/kingyo.svg", "/images/mameshibori.svg",
  "/images/mimosa.svg", "/images/seigaiha.svg", "/images/tsubaki.svg", "/images/yamayama.svg",
]);

// Installed updates wait for explicit consent. First installs never reload.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
});

async function cacheResponse(cache, request, response) {
  if (cache && response.ok && response.type === "basic" &&
      !/\b(?:no-store|private)\b/i.test(response.headers.get("Cache-Control") || "")) {
    // A full cache must not turn a successful fetch into an error.
    await cache.put(request, response.clone()).catch(() => {});
  }
}

async function serveStatic(request, immutable) {
  const cache = await caches.open(immutable ? ASSET_CACHE_NAME : CACHE_NAME).catch(() => null);
  if (immutable) {
    let cached = await cache?.match(request).catch(() => undefined);
    if (!cached) {
      // Preserve cached chunks used by tabs that still display the previous UI.
      const names = await caches.keys().catch(() => []);
      for (const name of names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== ASSET_CACHE_NAME)) {
        const prior = await caches.open(name).catch(() => null);
        cached = await prior?.match(request).catch(() => undefined);
        if (cached) break;
      }
    }
    if (cached) return cached;
  }
  try {
    // Stable manifest/icon names bypass the HTTP cache.
    const response = await fetch(request, immutable ? undefined : { cache: "no-cache" });
    await cacheResponse(cache, request, response);
    return response;
  } catch (error) {
    const cached = await cache?.match(request).catch(() => undefined);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin ||
      request.mode === "navigate") return;
  const immutable = isImmutable(url.pathname);
  const mutableStatic = url.pathname === "/manifest.json" ||
    /^\/icons\/[^/]+\.(?:png|ico|svg)$/.test(url.pathname) || STATIC_IMAGES.has(url.pathname);
  // Pages, auth, API data and uploaded photos always use the network.
  if (!immutable && !mutableStatic) return;
  event.respondWith(serveStatic(request, immutable));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await caches.open(CACHE_NAME).catch(() => null);
    const names = await caches.keys().catch(() => []);
    const previous = names.filter((name) => name.startsWith(`${CACHE_PREFIX}static-`) && name !== CACHE_NAME)
      .sort().at(-1);
    // Retain one previous release for open tabs. The old japandi cache is the
    // previous release on the first upgrade; the legacy HTML cache is removed.
    const keepPrevious = previous || (names.includes("tenugui-japandi-v2") ? "tenugui-japandi-v2" : null);
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) &&
      name !== CACHE_NAME && name !== ASSET_CACHE_NAME && name !== keepPrevious)
      .map((name) => caches.delete(name).catch(() => false)));
    await self.clients.claim();
  })());
});
