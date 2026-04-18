const CACHE_NAME = "studiolog-cache-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "https://cdn.tailwindcss.com",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
  "https://unpkg.com/@phosphor-icons/web"
];

// Install Event
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force the new service worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event - Clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all open pages immediately
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  // We don't want to cache API requests (like to Google Sheets)
  if (event.request.url.includes("script.google.com") || event.request.url.includes("script.googleusercontent.com")) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
