// Dummy service worker to satisfy PWA installation requirements.
// A more advanced service worker would include caching strategies using Workbox or similar.

const CACHE_NAME = 'moonview-cache-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Pre-cache the logo for offline display
            return cache.addAll([
                '/logo.png'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Basic fetch event to fulfill PWA requirement
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
