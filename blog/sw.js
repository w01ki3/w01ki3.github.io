const APP_VERSION = '0.002';
const CACHE_NAME = 'vk-gunce-' + APP_VERSION;
const RUNTIME_CACHE = 'vk-gunce-runtime-' + APP_VERSION;
const __v = APP_VERSION;

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './style.css?v=' + __v,
    './config.js?v=' + __v,
    './app.js?v=' + __v,
    './docs/milli-takvim/takvim.css?v=' + __v,
    './docs/milli-takvim/script.js?v=' + __v,
    './docs/milli-takvim/olaylar.js?v=' + __v,
    'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                .filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE)
                .map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    if (url.origin === location.origin) {
        const path = url.pathname.split('/').pop();

        if (path === 'sw.js') {
            event.respondWith(
                fetch(req, { cache: 'no-store' }).catch(() => caches.match(req))
            );
            return;
        }

        if (req.mode === 'navigate') {
            event.respondWith(
                fetch(req, { cache: 'no-cache' })
                .then((res) => {
                    const copy = res.clone();
                    caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                    return res;
                })
                .catch(() => caches.match('./index.html'))
            );
            return;
        }

        if (url.searchParams.has('v')) {
            event.respondWith(
                fetch(req)
                .then((res) => {
                    if (res && res.status === 200 && res.type === 'basic') {
                        const copy = res.clone();
                        caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() => caches.match(req))
            );
            return;
        }

        event.respondWith(
            caches.match(req).then((cached) => {
                if (cached) return cached;
                return fetch(req)
                    .then((res) => {
                        if (res && res.status === 200 && res.type === 'basic') {
                            const copy = res.clone();
                            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                        }
                        return res;
                    })
                    .catch(() => cached);
            })
        );
        return;
    }

    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req)
                .then((res) => {
                    if (res && res.status === 200) {
                        const copy = res.clone();
                        caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() => cached);
        })
    );
});
