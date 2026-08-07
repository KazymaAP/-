/* ============================================================
   NODEFORGE — Service Worker for Offline Caching
   Version: injected at build time (see vite.config.js)
   ============================================================ */

const CACHE_VERSION = '__CACHE_VERSION__';
const CACHE_NAME = `nodeforge-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const OFFLINE_CACHE = `${CACHE_NAME}-offline`;

const CASE_DIRS = [
    'stomatology-clinic',
    'clothing-store',
    'conference-event',
    'fitness-studio',
    'job-board',
    'legal-consultant',
    'online-school',
    'real-estate-agency',
    'restaurant-cafe',
    'saas-product'
];

const MINIAPP_DIRS = [
    'бронирование-с-календарем',
    'каталог-с-корзиной',
    'квиз-тест',
    'конструктор-визиток-резюме',
    'личный-дашборд-статистики',
    'мини-crm',
    'образовательный-тренажёр',
    'приложение-мероприятия'
];

const CASES_WITH_404 = new Set([
    'stomatology-clinic',
    'clothing-store',
    'online-school',
    'job-board'
]);

const MINIAPP_PUBLIC_PATH = new Map([
    ['личный-дашборд-статистики', 'src/public'],
    ['бронирование-с-календарем', 'public'],
    ['каталог-с-корзиной', 'public'],
    ['квиз-тест', 'public'],
    ['конструктор-визиток-резюме', 'public'],
    ['мини-crm', 'public'],
    ['образовательный-тренажёр', 'public'],
    ['приложение-мероприятия', 'public']
]);

function buildCasePages() {
    const pages = ['/404.html'];
    for (const dir of CASE_DIRS) {
        pages.push(`/cases/${dir}/`);
        pages.push(`/cases/${dir}/index.html`);
        if (CASES_WITH_404.has(dir)) {
            pages.push(`/cases/${dir}/404.html`);
        }
    }
    return pages;
}

function buildMiniAppPages() {
    const pages = [];
    for (const dir of MINIAPP_DIRS) {
        const publicPath = MINIAPP_PUBLIC_PATH.get(dir) || 'public';
        const encodedDir = encodeURIComponent(dir);
        const base = `/miniapps/${encodedDir}/${publicPath}`;
        pages.push(`${base}/`);
        pages.push(`${base}/index.html`);
        pages.push(`${base}/manifest.json`);
    }
    return pages;
}

const FONT_FILES = [
    '/fonts/Geist-Regular.woff2',
    '/fonts/Geist-Medium.woff2',
    '/fonts/Geist-SemiBold.woff2',
    '/fonts/Geist-Bold.woff2',
    '/fonts/IBMPlexMono-Regular.woff2',
    '/fonts/IBMPlexMono-Medium.woff2'
];

const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/404.html',
    '/offline.html',
    '/css/style.css',
    '/css/404.css',
    '/js/main.js',
    '/js/scene.js',
    '/js/case-cards.js',
    '/js/analytics.js',
    '/js/config.js',
    '/js/ab-testing.js',
    '/js/inline-scripts.js',
    '/favicon.svg',
    '/og-image.svg',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    ...FONT_FILES,
    ...buildCasePages(),
    ...buildMiniAppPages()
];

const EXTERNAL_RESOURCES = [
    'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js',
    'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap'
];

const MAX_DYNAMIC_ENTRIES = 100;
const MAX_OFFLINE_ENTRIES = 200;
const MAX_AGE_DYNAMIC = 7 * 24 * 60 * 60 * 1000;
const MAX_AGE_OFFLINE = 30 * 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT = 10000;

const SENSITIVE_PATHS = [
    '/api/',
    '/auth/',
    '/webhook',
    '/private'
];

function isSensitiveRequest(url) {
    return SENSITIVE_PATHS.some(path => url.pathname.startsWith(path));
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Precaching static assets');
                const requests = PRECACHE_ASSETS.map(url => new Request(url, { credentials: 'same-origin' }));
                return cache.addAll(requests).catch(err => {
                    console.warn('[SW] Some precache assets failed:', err);
                });
            }),
            caches.open(OFFLINE_CACHE).then((cache) => {
                console.log('[SW] Caching case pages and miniapps for offline');
                const caseRequests = buildCasePages().map(url => new Request(url, { credentials: 'same-origin' }));
                const miniappRequests = buildMiniAppPages().map(url => new Request(url, { credentials: 'same-origin' }));
                return Promise.all([
                    cache.addAll(caseRequests).catch(err => console.warn('[SW] Some case pages failed:', err)),
                    cache.addAll(miniappRequests).catch(err => console.warn('[SW] Some miniapp pages failed:', err))
                ]);
            }),
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching external resources (no-cors)');
                const extRequests = EXTERNAL_RESOURCES.map(url => new Request(url, { mode: 'no-cors', credentials: 'omit' }));
                return Promise.allSettled(extRequests.map(req => cache.add(req)));
            })
        ]).then(() => {
            console.log('[SW] Install complete, skipping waiting');
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('nodeforge-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== OFFLINE_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[SW] Activated');
            return self.clients.claim();
        })
    );
});

function isCasePage(url) {
    return url.pathname.startsWith('/cases/');
}

function isMiniAppPage(url) {
    return url.pathname.startsWith('/miniapps/');
}

function isStaticAsset(url) {
    return url.pathname.match(/\.(css|js|svg|png|jpg|jpeg|webp|avif|woff|woff2|ttf|eot|ico|json|xml|txt|map)$/i);
}

function isHTMLPage(url) {
    return url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname === '';
}

function isExternalCDN(url) {
    return url.hostname === 'cdn.jsdelivr.net' ||
           url.hostname === 'fonts.googleapis.com' ||
           url.hostname === 'fonts.gstatic.com';
}

function isOpaqueResponse(response) {
    return response.type === 'opaque' || response.status === 0;
}

function fetchWithTimeout(request, timeout = FETCH_TIMEOUT) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout')), timeout)
        )
    ]);
}

function setCacheDateHeaders(response) {
    const headers = new Headers(response.headers);
    headers.set('sw-cache-date', new Date().toISOString());
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

async function staleWhileRevalidate(request, cacheName, url) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetchWithTimeout(request).then((networkResponse) => {
        if (networkResponse.ok && !isOpaqueResponse(networkResponse) && !isSensitiveRequest(url)) {
            const responseToCache = setCacheDateHeaders(networkResponse.clone());
            cache.put(request, responseToCache);
        }
        return networkResponse;
    }).catch(() => {
        if (cachedResponse) return cachedResponse;
        if (request.mode === 'navigate') {
            return caches.match('/offline.html', { cacheName: STATIC_CACHE }) ||
                   caches.match('/404.html', { cacheName: STATIC_CACHE });
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain' } });
    });

    if (cachedResponse) {
        fetchPromise.catch(() => {});
        return cachedResponse;
    }

    return fetchPromise;
}

async function cacheFirst(request, cacheName, url) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetchWithTimeout(request);
        if (networkResponse.ok && !isOpaqueResponse(networkResponse) && !isSensitiveRequest(url)) {
            const responseToCache = setCacheDateHeaders(networkResponse);
            cache.put(request, responseToCache);
        }
        return networkResponse;
    } catch (error) {
        if (request.mode === 'navigate') {
            const offlineResponse = await caches.match('/offline.html', { cacheName: STATIC_CACHE }) ||
                                       await caches.match('/404.html', { cacheName: STATIC_CACHE });
            if (offlineResponse) return offlineResponse;
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain' } });
    }
}

async function networkFirst(request, cacheName, url) {
    const cache = await caches.open(cacheName);

    try {
        const networkResponse = await fetchWithTimeout(request);
        if (networkResponse.ok && !isOpaqueResponse(networkResponse) && !isSensitiveRequest(url)) {
            const responseToCache = setCacheDateHeaders(networkResponse);
            cache.put(request, responseToCache);
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        if (request.mode === 'navigate') {
            const offlineResponse = await caches.match('/offline.html', { cacheName: STATIC_CACHE }) ||
                                       await caches.match('/404.html', { cacheName: STATIC_CACHE });
            if (offlineResponse) return offlineResponse;
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain' } });
    }
}

async function cleanCache(cacheName, maxEntries, maxAge) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        if (keys.length > maxEntries) {
            const entriesWithTime = await Promise.all(
                keys.map(async (key) => {
                    const response = await cache.match(key);
                    if (!response) return { key, cachedTime: Date.now() };
                    const dateHeader = response.headers.get('sw-cache-date') || response.headers.get('date');
                    const cachedTime = dateHeader ? new Date(dateHeader).getTime() : Date.now();
                    return { key, cachedTime };
                })
            );

            entriesWithTime.sort((a, b) => a.cachedTime - b.cachedTime);
            const toDelete = entriesWithTime.slice(0, keys.length - maxEntries);
            await Promise.all(toDelete.map(({ key }) => cache.delete(key)));
        }

        const now = Date.now();
        for (const key of keys) {
            const response = await cache.match(key);
            if (!response) continue;
            const dateHeader = response.headers.get('sw-cache-date') || response.headers.get('date');
            if (dateHeader) {
                const cachedTime = new Date(dateHeader).getTime();
                if (now - cachedTime > maxAge) {
                    await cache.delete(key);
                }
            }
        }
    } catch (error) {
        console.warn('[SW] Clean cache failed:', error);
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return;
    }

    if (!url.protocol.startsWith('http')) {
        return;
    }

    if (isSensitiveRequest(url)) {
        event.respondWith(fetchWithTimeout(request).catch(() => new Response('Offline', { status: 503 })));
        return;
    }

    if (isExternalCDN(url)) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE, url));
        return;
    }

    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE, url));
        return;
    }

    if (isCasePage(url) || isMiniAppPage(url)) {
        event.respondWith(
            staleWhileRevalidate(request, OFFLINE_CACHE, url).then((response) => {
                if (Math.random() < 0.1) {
                    cleanCache(OFFLINE_CACHE, MAX_OFFLINE_ENTRIES, MAX_AGE_OFFLINE);
                }
                return response;
            })
        );
        return;
    }

    if (request.mode === 'navigate' || isHTMLPage(url)) {
        event.respondWith(
            networkFirst(request, DYNAMIC_CACHE, url).then((response) => {
                if (Math.random() < 0.1) {
                    cleanCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES, MAX_AGE_DYNAMIC);
                }
                return response;
            })
        );
        return;
    }

    event.respondWith(networkFirst(request, DYNAMIC_CACHE, url));
});

self.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;

    const reply = (data) => {
        if (event.ports && event.ports.length > 0 && event.ports[0] instanceof MessagePort) {
            event.ports[0].postMessage(data);
        } else if (event.source && typeof event.source.postMessage === 'function') {
            event.source.postMessage(data);
        }
    };

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        reply({ success: true });
    }

    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('nodeforge-'))
                        .map((name) => caches.delete(name))
                );
            }).then(() => {
                reply({ success: true });
            }).catch((err) => {
                reply({ success: false, error: err.message });
            })
        );
    }

    if (event.data.type === 'GET_CACHE_STATUS') {
        event.waitUntil(
            Promise.all([
                caches.open(STATIC_CACHE).then(c => c.keys()),
                caches.open(DYNAMIC_CACHE).then(c => c.keys()),
                caches.open(OFFLINE_CACHE).then(c => c.keys())
            ]).then(([staticKeys, dynamicKeys, offlineKeys]) => {
                reply({
                    static: staticKeys.length,
                    dynamic: dynamicKeys.length,
                    offline: offlineKeys.length,
                    version: CACHE_VERSION
                });
            }).catch((err) => {
                reply({ success: false, error: err.message });
            })
        );
    }

    if (event.data.type === 'CACHE_CASE_PAGES') {
        event.waitUntil(updateCasePagesCache().then(() => reply({ success: true })).catch(err => reply({ success: false, error: err.message })));
    }
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { body: event.data.text() };
    }

    const options = {
        body: data.body || 'New notification',
        icon: data.icon || '/favicon.svg',
        badge: data.badge || '/favicon.svg',
        vibrate: data.vibrate || [100, 50, 100],
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        tag: data.tag || 'default'
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'NodeForge', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action) {
        console.log('[SW] Notification action clicked:', event.action);
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url || '/');
            }
        })
    );
});

self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event.notification.tag);
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'contact-form-sync') {
        event.waitUntil(syncContactForms());
    }
    if (event.tag === 'analytics-sync') {
        event.waitUntil(syncAnalytics());
    }
});

async function syncContactForms() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const keys = await cache.keys();
        const formSubmissions = keys.filter(key => key.url.includes('/api/contact') || key.url.includes('/contact'));
        for (const key of formSubmissions) {
            const response = await cache.match(key);
            if (response) {
                const clonedRequest = key.clone();
                try {
                    await fetchWithTimeout(clonedRequest);
                    await cache.delete(key);
                } catch (error) {
                    console.warn('[SW] Failed to sync contact form:', error);
                }
            }
        }
    } catch (error) {
        console.warn('[SW] Background sync for contact forms failed:', error);
    }
}

async function syncAnalytics() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const keys = await cache.keys();
        const analyticsEvents = keys.filter(key => key.url.includes('/api/analytics') || key.url.includes('/analytics'));
        for (const key of analyticsEvents) {
            const response = await cache.match(key);
            if (response) {
                const clonedRequest = key.clone();
                try {
                    await fetchWithTimeout(clonedRequest);
                    await cache.delete(key);
                } catch (error) {
                    console.warn('[SW] Failed to sync analytics:', error);
                }
            }
        }
    } catch (error) {
        console.warn('[SW] Background sync for analytics failed:', error);
    }
}

async function updateCasePagesCache() {
    const cache = await caches.open(OFFLINE_CACHE);
    const allPages = [...buildCasePages(), ...buildMiniAppPages()];

    for (const page of allPages) {
        try {
            const response = await fetchWithTimeout(new Request(page, { credentials: 'same-origin' }));
            if (response.ok) {
                const responseToCache = setCacheDateHeaders(response);
                await cache.put(page, responseToCache);
            }
        } catch (error) {
            console.warn('[SW] Failed to update case/miniapp page:', page, error);
        }
    }
}

console.log('[SW] Service Worker loaded:', CACHE_VERSION);