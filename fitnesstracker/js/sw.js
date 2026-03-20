// ── PWA Service Worker (inline, registered via blob URL) ──
if ('serviceWorker' in navigator) {
  const swCode = `
const CACHE = 'fitnesstracker-v1';
const FONTS = [
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FONTS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Cache-first for fonts, network-first for everything else
  if (e.request.url.includes('fonts.g')) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  }
});
`;
  const blob = new Blob([swCode], { type: 'application/javascript' });
  const url  = URL.createObjectURL(blob);
  navigator.serviceWorker.register(url).catch(() => {});
}
