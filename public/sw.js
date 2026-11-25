// Service worker for the door scanner: lets /admin/scan reopen with no internet.
// - /_next/static/* (hashed files): cache first
// - /admin/scan page: network first, cached copy as fallback
// Everything else (server actions, API, other pages) goes straight to the network.
const CACHE = "door-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    if (url.pathname.startsWith("/_next/static/")) {
        event.respondWith(
            caches.open(CACHE).then(async (cache) => {
                const hit = await cache.match(req);
                if (hit) return hit;
                const res = await fetch(req);
                if (res.ok) cache.put(req, res.clone());
                return res;
            }),
        );
        return;
    }

    if (req.mode === "navigate" && url.pathname === "/admin/scan") {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
                    return res;
                })
                .catch(() => caches.match(req).then((hit) => hit || Response.error())),
        );
    }
});