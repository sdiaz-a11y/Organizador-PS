// Service worker mínimo: permite instalar la app y abrir su cubierta sin red.
// Los datos (Supabase) nunca se guardan aquí: solo se atienden peticiones del mismo origen.
const VERSION = "byte-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(["/", "/icon-192.png", "/byte/logo.png", "/byte/saludando.webp"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (url.pathname === "/" && res.ok) {
            const copia = res.clone();
            caches.open(VERSION).then((c) => c.put("/", copia));
          }
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/byte/") || /\.(png|webp|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copia = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copia));
            }
            return res;
          })
      )
    );
  }
});
