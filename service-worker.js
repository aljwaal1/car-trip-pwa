const CACHE_NAME = 'car-trip-pwa-v5-accurate-gps-clear-save-buttons';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

function upgradeIndexHtml(html) {
  return html
    .replace('<button id="pauseBtn" class="gold" disabled>إيقاف</button><button id="finishBtn" class="dark" disabled>حفظ</button><button id="resetBtn" class="light">تصفير</button>', '<button id="pauseBtn" class="gold" disabled>إيقاف مؤقت</button><button id="finishBtn" class="dark" disabled>إنهاء وحفظ الرحلة</button><button id="resetBtn" class="light">تصفير بدون حفظ</button>')
    .replaceAll("$('pauseBtn').textContent='إيقاف'", "$('pauseBtn').textContent='إيقاف مؤقت'")
    .replaceAll("$('gpsStatus').textContent='متوقف مؤقتاً';update()", "$('gpsStatus').textContent='متوقف مؤقتاً — لم يتم حفظ الرحلة بعد. اضغط إنهاء وحفظ الرحلة للحفظ';toast('الرحلة لم تُحفظ بعد. اضغط إنهاء وحفظ الرحلة للحفظ');update()")
    .replace("toast('تم حفظ الرحلة ✅');reset(false);renderAll();show('history')", "toast('تم إنهاء وحفظ الرحلة ✅');reset(false);renderAll();show('history')");
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isIndex = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  event.respondWith(
    fetch(event.request).then(async response => {
      if (isIndex) {
        const html = await response.clone().text();
        const upgraded = new Response(upgradeIndexHtml(html), {headers: {'Content-Type': 'text/html; charset=utf-8'}});
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, upgraded.clone())).catch(() => {});
        return upgraded;
      }
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
      return response;
    }).catch(() => caches.match(event.request).then(async cached => {
      if (cached && isIndex) {
        const html = await cached.clone().text();
        return new Response(upgradeIndexHtml(html), {headers: {'Content-Type': 'text/html; charset=utf-8'}});
      }
      return cached || caches.match('./index.html');
    }))
  );
});