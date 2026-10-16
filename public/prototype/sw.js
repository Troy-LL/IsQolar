const CACHE = 'isqolar-proto-v1';

const PRECACHE = [
  './',
  './index.html',
  './app.js',
  './staff/',
  './staff/index.html',
  './student/',
  './student/index.html',
  './board/',
  './board/index.html',
  './guardian/',
  './guardian/index.html',
  './css/components.css',
  './css/gradient.css',
  './css/landing.css',
  './css/screens.css',
  './css/tokens.css',
  './js/a11y.js',
  './js/colleges.js',
  './js/courseinfo.js',
  './js/i18n.js',
  './js/status-mark.js',
  './js/store.js',
  './js/strings.en.js',
  './js/strings.fil.js',
  './js/ui.js',
  './js/vendor/qrcode.js',
  './js/views/board.js',
  './js/views/guardian.js',
  './js/views/home.js',
  './js/views/stall.js',
  './js/views/student.js',
  './data/colleges.json',
  './data/stations.json',
  './fonts/AtkinsonHyperlegibleMono-Bold.woff2',
  './fonts/AtkinsonHyperlegibleMono-Regular.woff2',
  './fonts/AtkinsonHyperlegibleNext-Bold.woff2',
  './fonts/AtkinsonHyperlegibleNext-Regular.woff2',
  './fonts/Cinzel-Bold.woff2',
  '/brand/logo-light.png',
  '/brand/logo-dark.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('isqolar-proto-') && k !== CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/prototype/') && !url.pathname.startsWith('/brand/')) return;

  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    }).catch(() =>
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        if (request.mode === 'navigate') {
          // Try same-folder index.html, then root index.html
          const folder = url.pathname.replace(/\/[^/]*$/, '/');
          return caches.match(folder + 'index.html', { ignoreSearch: true })
            .then((r) => r || caches.match('/prototype/index.html', { ignoreSearch: true }));
        }
        return undefined;
      }).then((r) => {
        if (r) return r;
        return fetch(request);
      })
    )
  );
});
