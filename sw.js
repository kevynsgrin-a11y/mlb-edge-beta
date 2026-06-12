/* MLB Edge Engine beta - service worker.
   Strategy: NETWORK-FIRST with cache fallback for everything same-origin.
   A beta site ships daily (new boards, new shell) - never serve a stale
   shell when online, always have last-known-good offline. Cross-origin
   (StatsAPI) is never intercepted. */
const CACHE = "mlbedge-v1";
const PRECACHE = ["./m.html", "./index.html", "./manifest.webmanifest",
                  "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(PRECACHE))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE)
                                    .map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
