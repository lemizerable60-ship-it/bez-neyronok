const CACHE_NAME = 'psychosuite-v23';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './index.js',
  './sw-register.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Принудительная активация новой версии SW
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching URLs');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Захватываем контроль над открытыми страницами
  );
});

self.addEventListener('fetch', event => {
  // Используем стратегию "сначала сеть, потом кэш" для HTML, чтобы всегда получать обновления
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Для остальных запросов используем "сначала кэш, потом сеть"
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            // Кэшируем только успешные GET-запросы
            if (fetchResponse.status === 200 && event.request.method === 'GET') {
               cache.put(event.request.url, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
  );
});
