/**
 * Service worker generator for offline support.
 * Generates optimized service workers with smart caching strategies.
 */
/**
 * Generate service worker code.
 */
export function generateServiceWorker(config) {
    return `
// PhilJS Service Worker - Generated
// Version: ${Date.now()}

const CACHE_VERSION = 'philjs-v1';
const PRECACHE_URLS = ${JSON.stringify(config.precache || [])};
const OFFLINE_FALLBACK = ${JSON.stringify(config.offlineFallback || "/offline")};

// Cache rules
const CACHE_RULES = ${JSON.stringify(config.cacheRules.map(rule => ({
        ...rule,
        pattern: rule.pattern instanceof RegExp ? rule.pattern.source : rule.pattern,
    })))};

// Install event - precache assets
self.addEventListener('install', (event) => {

  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })${config.skipWaiting ? ".then(() => self.skipWaiting())" : ""}
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => {
            return caches.delete(name);
          })
      );
    })${config.clientsClaim ? ".then(() => self.clients.claim())" : ""}
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Find matching cache rule
  const rule = CACHE_RULES.find((r) => {
    const pattern = typeof r.pattern === 'string'
      ? new RegExp(r.pattern)
      : new RegExp(r.pattern);
    return pattern.test(url.pathname);
  });

  if (!rule) {
    return; // No rule, let browser handle it
  }

  const strategy = rule.strategy;
  const cacheName = rule.cacheName || CACHE_VERSION;

  event.respondWith(
    handleRequest(request, strategy, cacheName, rule.maxAge)
      .catch(() => {
        // Fallback to offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_FALLBACK);
        }
        throw new Error('No cache match');
      })
  );
});

// Handle request with strategy
async function handleRequest(request, strategy, cacheName, maxAge) {
  switch (strategy) {
    case 'network-first':
      return networkFirst(request, cacheName, maxAge);
    case 'cache-first':
      return cacheFirst(request, cacheName, maxAge);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, cacheName, maxAge);
    case 'network-only':
      return fetch(request);
    case 'cache-only':
      return caches.match(request);
    default:
      return fetch(request);
  }
}

// Network first strategy
async function networkFirst(request, cacheName, maxAge) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName, maxAge) {
  const cached = await caches.match(request);

  if (cached) {
    // Check if expired
    if (maxAge) {
      const date = cached.headers.get('date');
      if (date) {
        const age = (Date.now() - new Date(date).getTime()) / 1000;
        if (age > maxAge) {
          // Expired, fetch new
          return networkFirst(request, cacheName, maxAge);
        }
      }
    }
    return cached;
  }

  return networkFirst(request, cacheName, maxAge);
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Always fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  // Return cached if available, otherwise wait for fetch
  return cached || fetchPromise;
}

${config.backgroundSync ? generateBackgroundSync() : ""}

${config.pushNotifications ? generatePushNotifications() : ""}

`.trim();
}
function generateBackgroundSync() {
    return `
// Background sync
self.addEventListener('sync', (event) => {

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Sync queued requests when back online
  const queue = await getQueue();
  for (const request of queue) {
    try {
      await fetch(request);
      await removeFromQueue(request);
    } catch (error) {
      console.error('[SW] Sync failed:', error);
    }
  }
}

async function getQueue() {
  // Implementation would use IndexedDB
  return [];
}

async function removeFromQueue(request) {
  // Implementation would use IndexedDB
}
`;
}
function generatePushNotifications() {
    return `
// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/badge.png',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PhilJS App', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
`;
}
/**
 * Default cache rules for common scenarios.
 */
export const defaultCacheRules = [
    // App shell - cache first
    {
        pattern: /\.(js|css|woff2?)$/,
        strategy: "cache-first",
        cacheName: "static-assets",
        maxAge: 86400 * 30, // 30 days
    },
    // Images - cache first
    {
        pattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
        strategy: "cache-first",
        cacheName: "images",
        maxAge: 86400 * 7, // 7 days
        maxEntries: 50,
    },
    // API calls - network first with cache fallback
    {
        pattern: /\/api\//,
        strategy: "network-first",
        cacheName: "api-data",
        maxAge: 60, // 1 minute
    },
    // Pages - stale while revalidate
    {
        pattern: /\.html$/,
        strategy: "stale-while-revalidate",
        cacheName: "pages",
        maxAge: 86400, // 1 day
    },
];
/**
 * Register service worker in client.
 */
export async function registerServiceWorker(swPath = "/sw.js", options = {}) {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        console.warn("Service workers not supported");
        return undefined;
    }
    try {
        const registration = await navigator.serviceWorker.register(swPath);
        // Check for updates
        registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker)
                return;
            newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // New service worker available
                    options.onUpdate?.(registration);
                }
            });
        });
        options.onSuccess?.(registration);
        return registration;
    }
    catch (error) {
        options.onError?.(error);
        return undefined;
    }
}
/**
 * Unregister all service workers.
 */
export async function unregisterServiceWorkers() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return;
    }
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
}
/**
 * Skip waiting and activate new service worker immediately.
 */
export function skipWaitingAndClaim() {
    if (typeof self !== "undefined" && "skipWaiting" in self) {
        self.skipWaiting();
        self.clients.claim();
    }
}
//# sourceMappingURL=service-worker.js.map