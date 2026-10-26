// MasterDrive offline support: pages and the catalog load fresh when online; everything else is served from cache and refreshed in the background.
const CACHE = 'masterdrive-2';
const FILES = ['./', 'index.html', 'app.js', 'i18n.js', 'viewer.js', 'catalog.json', 'brands.js', 'vendor/three.module.min.js', 'vendor/RoomEnvironment.js', 'vendor/jsm/loaders/GLTFLoader.js',
  'vendor/jsm/utils/BufferGeometryUtils.js', 'vendor/jsm/libs/meshopt_decoder.module.js',
  'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('masterdrive-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const fresh = req.mode === 'navigate' || /\.(html|json|webmanifest)$/i.test(url.pathname) || url.pathname.endsWith('/');
  const save = res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (fresh) {
    e.respondWith(fetch(req).then(save).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => { const net = fetch(req).then(save).catch(() => r); return r || net; }));
  }
});
