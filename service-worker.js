const CACHE_NAME = 'car-trip-pwa-v10-home-without-last-card';
const ASSETS = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

function compactHtml(html){
  const patch = `
<style id="home-without-last-card">
  .lastPanel{display:none!important}
  .side{grid-template-rows:1fr!important}
  .side>.panel:first-child{height:100%!important}
@media(max-width:760px){
  .app{padding:6px!important;height:calc(100dvh - var(--navH))!important}
  .grid{grid-template-rows:.64fr 1.36fr!important;gap:6px!important}
  .hero{border-radius:22px!important;padding:9px!important;min-height:0!important}
  .logo{width:36px!important;height:36px!important;font-size:21px!important;border-radius:13px!important}
  h1{font-size:17px!important}.caption{font-size:10px!important}.pill{padding:5px 8px!important;font-size:10px!important}
  .speedRing{width:min(22dvh,158px)!important;height:min(22dvh,158px)!important}
  .speed{font-size:38px!important}.speedUnit,.speedNote{font-size:10px!important}
  .quickStats{gap:6px!important}.mini{padding:6px!important;border-radius:14px!important}.mini b{font-size:14px!important}.mini span{font-size:9px!important}
  .side{grid-template-rows:1fr!important;gap:0!important}
  .panel{padding:8px!important;border-radius:20px!important}
  .sectionTitle{margin-bottom:4px!important}.sectionTitle h2{font-size:14px!important}.small{font-size:10px!important}
  .timer{font-size:25px!important;margin:0 0 5px!important}
  .cards{gap:6px!important}.stat{padding:6px!important;border-radius:14px!important}.stat .label{font-size:9px!important}.stat .value{font-size:16px!important}.stat .unit{font-size:9px!important}
  .compactNotices{margin-top:5px!important;gap:5px!important}.notice{padding:5px 7px!important;font-size:10px!important}
  .actions{grid-template-columns:repeat(2,1fr)!important;gap:8px!important;margin-top:10px!important}
  button{padding:10px 6px!important;font-size:11px!important;min-height:44px!important}
  #finishBtn{display:block!important}
}
@media(max-height:720px){
  .speedRing{width:min(19dvh,140px)!important;height:min(19dvh,140px)!important}
  .hero{padding:7px!important}.panel{padding:7px!important}.timer{font-size:23px!important}
}
</style>`;
  return html.includes('home-without-last-card') ? html : html.replace('</head>', patch + '</head>');
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isIndex = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  event.respondWith(fetch(event.request).then(async response => {
    if(isIndex){
      const html = await response.clone().text();
      return new Response(compactHtml(html), {headers:{'Content-Type':'text/html; charset=utf-8'}});
    }
    return response;
  }).catch(() => caches.match(event.request).then(async cached => {
    if(cached && isIndex){
      const html = await cached.clone().text();
      return new Response(compactHtml(html), {headers:{'Content-Type':'text/html; charset=utf-8'}});
    }
    return cached || caches.match('./index.html');
  })));
});