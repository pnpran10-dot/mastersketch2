// MasterSketch offline support: pages load fresh when online, saved copies are used only when offline.
const CACHE='mastersketch-site-3.5';
const FILES=['./','index.html','app.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','shot-desktop.jpg','shot-brushes.jpg','shot-phone.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin||/\.(apk|exe|zip)$/i.test(url.pathname))return;
  const isPage=req.mode==='navigate'||/\.(html|webmanifest)$/i.test(url.pathname)||url.pathname.endsWith('/');
  if(isPage){
    // network first: always the newest version, saved copy when offline
    e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res})
      .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match(url.pathname.endsWith('app.html')?'app.html':'index.html'))));
  }else{
    // pictures and icons: saved copy first, refreshed in the background
    e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>{const net=fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res}).catch(()=>r);return r||net}));
  }
});
