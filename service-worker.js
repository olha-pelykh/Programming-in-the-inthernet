const CACHE_NAME = "v3";
const ASSETS = [
  "/",
  "/index.html",
  "/dashboard.html",
  "/messages.html",
  "/tasks.html",
  "/css/style.css",
  "/js/script.js",
  "/icons/apple-touch-icon.png",
  "/manifest.json",
  // Add other essential assets
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache
        .addAll(ASSETS)
        .then(() => console.log("Assets cached"))
        .catch((err) => {
          console.error("Failed to cache some assets:", err);
          // Continue even if some assets fail
          return Promise.resolve();
        });
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Skip non-HTTP requests and browser extensions
  if (!event.request.url.startsWith("http") || event.request.url.includes("chrome-extension")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Only cache GET requests from our origin
          if (
            event.request.method === "GET" &&
            response.status === 200 &&
            response.url.startsWith(self.location.origin)
          ) {
            // Create a new clone for caching
            const responseClone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseClone))
              .catch((err) => console.error("Cache put error:", err));
          }
          return response;
        })
        .catch(() => {
          // Fallback for failed requests
          if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match("/index.html");
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
    })
  );
});
