const CACHE_NAME = 'cromo-shell-v22';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './assets/icon.svg',
  './js/icons.js',
  './js/data.js',
  './js/jersey.js',
  './js/state.js',
  './js/pack.js',
  './js/legends.js',
  './js/notifications.js',
  './js/audio.js',
  './js/anim.js',
  './js/onboarding.js',
  './js/app.js',
  './js/views/sticker.js',
  './js/views/reveal.js',
  './js/views/sobres.js',
  './js/views/album.js',
  './js/views/cambios.js',
  './js/views/tienda.js',
  './js/views/notifs.js',
  './js/views/placeholder.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
