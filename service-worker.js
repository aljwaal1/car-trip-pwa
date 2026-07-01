const CACHE_NAME = 'car-trip-pwa-v7-visible-save-button';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

function upgradeIndexHtml(html) {
  const patch = `
<style id="visible-save-button-patch">
  #finishBtn{display:none!important}
  #startBtn.saveMode{background:#0f172a!important;color:#fff!important}
  .actions{grid-template-columns:1fr 1fr!important;gap:8px!important}
  #pauseBtn,#startBtn{min-height:54px!important;font-size:13px!important}
</style>
<script id="visible-save-button-script">
(function(){
  function hook(){
    var start=document.getElementById('startBtn');
    var pause=document.getElementById('pauseBtn');
    var finish=document.getElementById('finishBtn');
    var reset=document.getElementById('resetBtn');
    if(!start||!finish||start.dataset.saveHooked)return;
    start.dataset.saveHooked='1';
    var oldStart=window.start;
    var oldFinish=window.finish;
    var oldReset=window.reset;
    function makeStart(){start.textContent='ابدأ';start.classList.remove('saveMode');start.disabled=false;start.onclick=function(){oldStart();setTimeout(makeSave,80)}}
    function makeSave(){start.textContent='إنهاء وحفظ الرحلة';start.classList.add('saveMode');start.disabled=false;start.onclick=function(){oldFinish();setTimeout(makeStart,250)}}
    if(reset){reset.textContent='تصفير بدون حفظ';reset.onclick=function(){oldReset(true);setTimeout(makeStart,80)}}
    if(pause){pause.textContent='إيقاف مؤقت'}
    finish.style.display='none';
    makeStart();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})();
</script>`;
  html = html
    .replace('<button id="pauseBtn" class="gold" disabled>إيقاف</button><button id="finishBtn" class="dark" disabled>حفظ</button><button id="resetBtn" class="light">تصفير</button>', '<button id="pauseBtn" class="gold" disabled>إيقاف مؤقت</button><button id="finishBtn" class="dark" disabled>إنهاء وحفظ الرحلة</button><button id="resetBtn" class="light">تصفير بدون حفظ</button>')
    .replaceAll("$('pauseBtn').textContent='إيقاف'", "$('pauseBtn').textContent='إيقاف مؤقت'")
    .replaceAll("$('gpsStatus').textContent='متوقف مؤقتاً';update()", "$('gpsStatus').textContent='متوقف مؤقتاً — لم يتم حفظ الرحلة بعد. اضغط إنهاء وحفظ الرحلة للحفظ';toast('الرحلة لم تُحفظ بعد. اضغط إنهاء وحفظ الرحلة للحفظ');update()")
    .replace("toast('تم حفظ الرحلة ✅');reset(false);renderAll();show('history')", "toast('تم إنهاء وحفظ الرحلة ✅');reset(false);renderAll();show('history')");
  return html.replace('</body>', patch + '</body>');
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