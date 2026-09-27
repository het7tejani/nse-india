// Cache only the static app shell. Quotes, search, configuration and all auth/data
// requests always use the network; an offline shell never shows stale portfolio data.
const CACHE_NAME = 'portfolio-shell-v1';
const SHELL_URL = new URL('/', self.registration.scope).href;
const SHELL_ASSETS = [SHELL_URL, new URL('/manifest.json', self.registration.scope).href,
  new URL('/icon.svg', self.registration.scope).href];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('portfolio-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.mode !== 'navigate' || request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname !== '/' || url.search) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(SHELL_URL, copy)));
    }
    return response;
  }).catch(async () => (await caches.match(SHELL_URL)) || Response.error()));
});
