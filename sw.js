// Keeps the app shell available offline. Messages always go straight to the network.
const V = "nickchat-v12";
const SHELL = ["app.html", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.endsWith(".exe")) return;
  // Network first so updates arrive; fall back to the saved copy when offline.
  e.respondWith(fetch(r).then((res) => {
    const copy = res.clone(); caches.open(V).then((c) => c.put(r, copy)); return res;
  }).catch(() => caches.match(r).then((m) => m || caches.match("app.html"))));
});
// Tapping a notification brings Nickchat to the front and opens that chat.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const chat = (e.notification.data && e.notification.data.chat) || "";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ("focus" in c) { c.postMessage({ chat }); return c.focus(); } }
    return self.clients.openWindow("app.html");
  }));
});
