// Offline support for the installed invoice app. The page is one
// self-contained HTML file, so caching it (plus manifest and icons) is all
// the app needs to open without a connection. Network first, so a new
// version reaches the user the next time they are online; the cache is the
// fallback, never the default.
const CACHE = "invoice-app-v1";
const SHELL = ["/invoice-app", "/invoice-app/manifest.webmanifest", "/invoice-app/icon-192.png", "/invoice-app/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !url.pathname.startsWith("/invoice-app")) return;
  const key = e.request.mode === "navigate" ? "/invoice-app" : e.request;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(key, copy));
        }
        return res;
      })
      .catch(() => caches.match(key).then((hit) => hit || new Response("Offline and not cached yet. Open the app once while online.", { status: 503 }))),
  );
});
