/* Service Worker - مُقسِّم الراتب الذكي */
const CACHE_NAME = 'salary-splitter-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

/* التثبيت: تخزين الملفات الأساسية مؤقتاً عند أول زيارة */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

/* التفعيل: حذف أي نسخ تخزين مؤقت قديمة */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* استراتيجية الجلب: Cache First مع تحديث في الخلفية (Stale-While-Revalidate) */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); /* بدون إنترنت: استخدم النسخة المخزنة */

      /* أعرض النسخة المخزنة فوراً إن وجدت، وحدّثها بالخلفية */
      return cachedResponse || fetchPromise;
    })
  );
});
