/* 离线缓存：打开过一次之后，没有网络也能用。每次改了页面，把下面的版本号加一。 */
const CACHE = 'mirror-v8';
const FILES = ['./', 'index.html', 'icon.png'];

/* 安装新版本时，绕过手机里的旧存货，直接从网上取最新的文件 */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(FILES.map((u) => new Request(u, { cache: 'reload' }))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 立刻用手机里存着的那份打开，不等网络；同时在后台取最新的存起来 */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request, { cache: 'no-cache' }).then((res) => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    });
    if (saved) { e.waitUntil(fresh.catch(() => {})); return saved; }
    return fresh;
  })());
});
