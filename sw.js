const CACHE_NAME = 'operacion-arena-v6';   // ← sube el número cada vez que subas cambios
const urlsToCache = [
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();  // ← aplica el nuevo SW inmediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())  // ← toma control de las pestañas ya abiertas
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // No cachear Firebase
  if(url.indexOf('firebaseio.com') >= 0 ||
     url.indexOf('firebasedatabase.app') >= 0 ||
     url.indexOf('gstatic.com/firebasejs') >= 0){
    return;
  }

  // 🌐 HTML, CSS y JS: NETWORK FIRST (siempre intenta la red primero)
  if(event.request.mode === 'navigate' ||
     url.endsWith('.html') ||
     url.endsWith('/') ||
     url.indexOf('index.html') >= 0){
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Guardar copia fresca en el caché
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
          return response;
        })
        .catch(() => caches.match(event.request))  // si falla la red, usar caché
    );
    return;
  }

  // 📦 Resto (Three.js, Firebase SDK, iconos): CACHE FIRST
  event.respondWith(
    caches.match(event.request).then(response => {
      if(response) return response;
      return fetch(event.request).then(res => {
        const copia = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
        return res;
      });
    })
  );
});

// 📢 Notificar a la app cuando se activa una nueva versión
self.addEventListener('message', event => {
  if(event.data === 'skipWaiting') self.skipWaiting();
});
