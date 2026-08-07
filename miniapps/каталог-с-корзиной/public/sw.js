// Service Worker for Catalog Mini App
// Provides offline support and caching

const CACHE_NAME = 'catalog-miniapp-v1';
const STATIC_CACHE = 'catalog-static-v1';
const DYNAMIC_CACHE = 'catalog-dynamic-v1';
const IMAGE_CACHE = 'catalog-images-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/app.js',
    '/src/styles/main.css',
    '/src/styles/performance.css',
    '/assets/images/logo.svg',
    '/assets/images/placeholders/product.svg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
    'https://telegram.org/js/telegram-web-app.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                return cache.addAll(STATIC_ASSETS.map(url => {
                    return new Request(url, { credentials: 'same-origin' });
                })).catch(() => {});
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            return name !== STATIC_CACHE && 
                                   name !== DYNAMIC_CACHE && 
                                   name !== IMAGE_CACHE;
                        })
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // API requests - network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Static assets - cache first
    if (STATIC_ASSETS.some(asset => request.url.includes(asset.replace('/', '')))) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }
    
    // Images - cache first with long TTL
    if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
        event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
        return;
    }
    
    // Fonts - cache first
    if (request.destination === 'font' || url.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }
    
    // CSS/JS - stale while revalidate
    if (request.destination === 'style' || request.destination === 'script') {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }
    
    // HTML - network first for fresh content
    if (request.destination === 'document') {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Default - network first
    event.respondWith(networkFirstStrategy(request));
});

// Cache first strategy
async function cacheFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return offline fallback for images
        if (request.destination === 'image') {
            return caches.match('/assets/images/placeholders/product.svg');
        }
        throw error;
    }
}

// Network first strategy
async function networkFirstStrategy(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        
        throw error;
    }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cached);
    
    return cached || fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cart') {
        event.waitUntil(syncCart());
    }
    
    if (event.tag === 'sync-favorites') {
        event.waitUntil(syncFavorites());
    }
    
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

async function syncCart() {
    // Implementation would sync cart to server when online
}

async function syncFavorites() {
}

async function syncOrders() {
}

// Push notifications (if needed)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    
    const options = {
        body: data.body || 'Новое уведомление',
        icon: '/assets/images/logo.svg',
        badge: '/assets/images/logo.svg',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Открыть' },
            { action: 'close', title: 'Закрыть' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Каталог', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                for (const client of clientList) {
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(event.notification.data.url);
            })
        );
    }
});

// Periodic cache cleanup
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cleanup-cache') {
        event.waitUntil(cleanupOldCaches());
    }
});

async function cleanupOldCaches() {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    for (const request of keys) {
        const response = await cache.match(request);
        const dateHeader = response.headers.get('date');
        
        if (dateHeader) {
            const responseDate = new Date(dateHeader).getTime();
            if (responseDate < oneWeekAgo) {
                await cache.delete(request);
            }
        }
    }
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
        });
    }
});