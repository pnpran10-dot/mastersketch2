// MasterSketch offline support: pages load fresh when online, saved copies are used only when offline.
const CACHE='mastersketch-site-4.0';
const FILES=['./','index.html','app.html','workshop.html','ms3d.js','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','shot-desktop.jpg','shot-3d.jpg','shot-workshop.jpg','shot-brushes.jpg','shot-phone.jpg','shot-build.jpg','shot-color.jpg','shot-motion.jpg','mods.html','msmods.js','shot-mods.jpg','shot-modmaker.jpg','shot-play.jpg','shot-feedback.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin||/\.(apk|exe|zip)$/i.test(url.pathname))return;
  const isPage=req.mode==='navigate'||/\.(html|webmanifest)$/i.test(url.pathname)||url.pathname.endsWith('/');
  if(isPage){
    e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res})
      .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match(url.pathname.endsWith('app.html')?'app.html':url.pathname.endsWith('workshop.html')?'workshop.html':url.pathname.endsWith('mods.html')?'mods.html':'index.html'))));
  }else{
    e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>{const net=fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res}).catch(()=>r);return r||net}));
  }
});
