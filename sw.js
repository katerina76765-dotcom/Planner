// Офлайн-режим: код приложения кэшируется на телефоне.
// Ваши записи хранятся отдельно (в памяти браузера) и сюда не попадают.
const VERSION = 'planner-release-v2';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Шрифты Google: берём из кэша, в фоне обновляем
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(req);
        const net = fetch(req).then((res) => { cache.put(req, res.clone()); return res; }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Свои файлы: сначала сеть (чтобы обновления приходили), без сети — кэш.
  // cache: 'no-cache' — не брать устаревшую копию из кэша браузера (GitHub Pages держит её до 10 минут)
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
