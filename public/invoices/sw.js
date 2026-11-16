// Offline support for the firm's installed invoice app (/invoices). The page is one
// self-contained HTML file, so caching it (plus manifest and icons) is all
// the app needs to open without a connection. Network first, so a new
// version reaches the user the next time they are online; the cache is the
// fallback, never the default.
const CACHE = "firm-invoices-v1";
const SHELL = ["/invoices/manifest.webmanifest", "/invoices/icon-192.png", "/invoices/icon-512.png"];

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
  if (e.request.method !== "GET" || url.origin !== location.origin || !url.pathname.startsWith("/invoices")) return;
  const key = e.request.mode === "navigate" ? "/invoices" : e.request;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // The password page is never cached over the app itself.
        if (res.ok && !res.headers.get("x-invoices-login")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(key, copy));
        }
        return res;
      })
      .catch(() => caches.match(key).then((hit) => hit || new Response("Offline and not cached yet. Open the app once while online.", { status: 503 }))),
  );
});
