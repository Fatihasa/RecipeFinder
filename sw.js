const CACHE_NAME = 'recipe-app-v3'; // Yeni versiyon
const DYNAMIC_CACHE = 'dynamic-cache-v3';

const ASSETS = [
  '/',
  '/offline.html',
  '/index.html',
  '/styles/style.css',
  '/scripts/app.js',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

const API_HOSTS = ['api.spoonacular.com', 'api.opencagedata.com'];

// 📌 Install Event - Statik dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📌 Caching static assets...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Service Worker anında devreye girsin
});

// 📌 Activate Event - Eski önbelleği temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cache) => cache !== CACHE_NAME && cache !== DYNAMIC_CACHE)
          .map((cache) => caches.delete(cache))
      );
    })
  );
  console.log('✅ Service Worker activated.');
  clients.claim(); // Yeni Service Worker hemen kontrolü alsın
});

// 📌 Fetch Event - Online ve Offline Yönetimi
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 🔹 API istekleri için her zaman online mod kullan, başarısız olursa offline fallback
  if (API_HOSTS.includes(url.hostname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          console.warn(`❌ API isteği başarısız: ${request.url} - Offline mod aktif.`);
          return caches.match('/offline.html'); 
        })
    );
    return;
  }

  // 🔹 Sayfa (navigate) isteklerinde offline.html göster
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          console.warn('🌐 Ağ başarısız! offline.html yükleniyor...');
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // 🔹 Diğer tüm isteklerde önce network, sonra cache kontrolü
  event.respondWith(
    fetch(request)
      .then((response) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log(`✅ Cache’den yüklendi: ${request.url}`);
            return cachedResponse;
          }
          console.warn(`🌐 ${request.url} bulunamadı, offline.html yükleniyor...`);
          return caches.match('/offline.html');
        });
      })
  );
});


// 📌 Background Sync Event - Tarifleri eşitleme
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-recipes') {
    console.log('🔄 Background Sync: Syncing recipes...');
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_RECIPES' }));
      })
    );
  }
});
