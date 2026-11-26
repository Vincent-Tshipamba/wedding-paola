// Service worker shared by the two installable admin apps.
// - /_next/static/* (hashed files): cache first
// - /admin/scan page: network first, cached copy as fallback (the door scanner works offline)
// - other /admin pages: network, and a friendly "offline" page when there is no connection
// Everything else (server actions, API, public site) goes straight to the network.
const CACHE = "pa-v2";

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/offline.html"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

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

    if (req.mode !== "navigate") return;

    if (url.pathname === "/admin/scan") {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
                    return res;
                })
                .catch(() => caches.match(req).then((hit) => hit || caches.match("/offline.html"))),
        );
        return;
    }

    if (url.pathname.startsWith("/admin")) {
        event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    }
});