// «Мій семестр»: робота без інтернету.
// Файли сайту беремо з мережі (так оновлення з GitHub приходять одразу), а без інтернету — з кешу.
// Шрифти Google кешуються при першому завантаженні.
const CACHE = "miy-semestr-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function keep(req, res) {
  const copy = res.clone();
  caches.open(CACHE).then(c => c.put(req, copy));
  return res;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req)
      .then(res => res.ok ? keep(req, res) : res)
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(m => m || (req.mode === "navigate" ? caches.match("./") : Response.error()))));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(res => keep(req, res))));
  }
});
