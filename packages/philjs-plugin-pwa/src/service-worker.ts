/**
 * Service Worker generation and registration
 */

import type { ServiceWorkerConfig, CacheRule } from './types.js';

// ============================================================================
// Service Worker Generation
// ============================================================================

/**
 * Generate service worker code
 */
export function generateServiceWorker(config: ServiceWorkerConfig = {}): string {
  const {
    cachePrefix = 'philjs',
    cacheVersion = 'v1',
    precache = [],
    runtimeCaching = [],
    skipWaiting = true,
    clientsClaim = true,
    navigationPreload = true,
    offlineFallback,
    backgroundSync,
  } = config;

  const cacheName = `${cachePrefix}-${cacheVersion}`;
  const precacheName = `${cacheName}-precache`;
  const runtimeCacheName = `${cacheName}-runtime`;

  return `
// PhilJS PWA Service Worker
// Generated on ${new Date().toISOString()}

const CACHE_VERSION = '${cacheVersion}';
const CACHE_PREFIX = '${cachePrefix}';
const PRECACHE_NAME = '${precacheName}';
const RUNTIME_CACHE_NAME = '${runtimeCacheName}';

// Files to precache
const PRECACHE_URLS = ${JSON.stringify(precache, null, 2)};

// Runtime caching rules
const RUNTIME_CACHING_RULES = ${JSON.stringify(runtimeCaching.map(rule => ({
  ...rule,
  pattern: rule.pattern instanceof RegExp ? rule.pattern.source : rule.pattern,
})), null, 2)};

// ============================================================================
// Install Event
// ============================================================================

self.addEventListener('install', (event) => {

  event.waitUntil(
    (async () => {
      // Open precache
      const cache = await caches.open(PRECACHE_NAME);

      // Add all precache URLs
      if (PRECACHE_URLS.length > 0) {
        console.log('[SW] Precaching', PRECACHE_URLS.length, 'files');
        await cache.addAll(PRECACHE_URLS);
      }

      ${skipWaiting ? '// Skip waiting to activate immediately\n      await self.skipWaiting();' : ''}
    })()
  );
});

// ============================================================================
// Activate Event
// ============================================================================

self.addEventListener('activate', (event) => {

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name.startsWith(CACHE_PREFIX) && name !== PRECACHE_NAME && name !== RUNTIME_CACHE_NAME)
          .map(name => {
            return caches.delete(name);
          })
      );

      ${clientsClaim ? '// Take control of all clients\n      await self.clients.claim();' : ''}
    })()
  );
});

${navigationPreload ? `
// ============================================================================
// Navigation Preload
// ============================================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
});
` : ''}

// ============================================================================
// Fetch Event
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;

  // Only handle GET requests
  if (method !== 'GET') {
    return;
  }

  // Find matching cache rule
  let matchedRule = null;
  for (const rule of RUNTIME_CACHING_RULES) {
    const pattern = typeof rule.pattern === 'string'
      ? new RegExp(rule.pattern)
      : rule.pattern;

    if (pattern.test(url)) {
      matchedRule = rule;
      break;
    }
  }

  if (matchedRule) {
    event.respondWith(handleCacheStrategy(request, matchedRule));
  } else {
    // Default: network-first for navigation, cache-first for assets
    if (request.mode === 'navigate') {
      event.respondWith(handleNavigate(request));
    } else {
      event.respondWith(handleAsset(request));
    }
  }
});

// ============================================================================
// Cache Strategies
// ============================================================================

async function handleCacheStrategy(request, rule) {
  const cacheName = rule.cacheName || RUNTIME_CACHE_NAME;

  switch (rule.strategy) {
    case 'cache-first':
      return cacheFirst(request, cacheName, rule);
    case 'network-first':
      return networkFirst(request, cacheName, rule);
    case 'cache-only':
      return cacheOnly(request, cacheName);
    case 'network-only':
      return networkOnly(request);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, cacheName, rule);
    default:
      return fetch(request);
  }
}

async function cacheFirst(request, cacheName, rule) {
  const cached = await caches.match(request);
  if (cached) {
    // Check if expired
    if (rule.maxAge) {
      const cacheTime = new Date(cached.headers.get('sw-cache-time') || 0);
      if (Date.now() - cacheTime.getTime() > rule.maxAge) {
        // Expired, fetch new
        return fetchAndCache(request, cacheName, rule);
      }
    }
    return cached;
  }
  return fetchAndCache(request, cacheName, rule);
}

async function networkFirst(request, cacheName, rule) {
  try {
    const timeout = rule.networkTimeout || 3000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      await cacheResponse(request, response.clone(), cacheName, rule);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function cacheOnly(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  return new Response('Not found in cache', { status: 404 });
}

async function networkOnly(request) {
  return fetch(request);
}

async function staleWhileRevalidate(request, cacheName, rule) {
  const cached = await caches.match(request);

  // Fetch and update cache in background
  const fetchPromise = fetchAndCache(request, cacheName, rule);

  // Return cached if available, otherwise wait for fetch
  return cached || fetchPromise;
}

async function fetchAndCache(request, cacheName, rule) {
  const response = await fetch(request);

  if (response.ok) {
    await cacheResponse(request, response.clone(), cacheName, rule);
  }

  return response;
}

async function cacheResponse(request, response, cacheName, rule) {
  const cache = await caches.open(cacheName);

  // Add cache time header
  const headers = new Headers(response.headers);
  headers.set('sw-cache-time', new Date().toISOString());

  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });

  await cache.put(request, modifiedResponse);

  // Enforce max entries
  if (rule.maxEntries) {
    await enforceMaxEntries(cache, rule.maxEntries);
  }
}

async function enforceMaxEntries(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    // Delete oldest entries
    const entriesToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(entriesToDelete.map(key => cache.delete(key)));
  }
}

// ============================================================================
// Navigation Handling
// ============================================================================

async function handleNavigate(request) {
  try {
    ${navigationPreload ? `
    // Try navigation preload
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) {
      return preloadResponse;
    }
    ` : ''}

    // Try network
    return await fetch(request);
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    ${offlineFallback ? `
    // Show offline fallback
    const fallback = await caches.match('${offlineFallback}');
    if (fallback) {
      return fallback;
    }
    ` : ''}

    // Return generic offline page
    return new Response(
      '<html><body><h1>Offline</h1><p>Please check your internet connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

async function handleAsset(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Asset not available offline', { status: 503 });
  }
}

${backgroundSync?.enabled ? `
// ============================================================================
// Background Sync
// ============================================================================

self.addEventListener('sync', (event) => {
  const { tag } = event;

  if (tag === '${backgroundSync.queueName || 'default-sync'}') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Process queued requests
  const cache = await caches.open('${backgroundSync.queueName || 'sync-queue'}');
  const requests = await cache.keys();

  for (const request of requests) {
    try {
      await fetch(request);
      await cache.delete(request);
    } catch (error) {
      console.error('[SW] Sync failed:', request.url, error);
    }
  }
}
` : ''}

// ============================================================================
// Message Handling
// ============================================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLAIM_CLIENTS':
      self.clients.claim();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

console.log('[SW] Service worker loaded:', CACHE_VERSION);
`.trim();
}

// ============================================================================
// Service Worker Registration
// ============================================================================

/**
 * Register service worker
 */
export async function registerServiceWorker(
  scriptURL: string = '/sw.js',
  options?: RegistrationOptions
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(scriptURL, options);

    console.log('[PWA] Service worker registered:', registration.scope);

    // Handle updates
    const handleUpdateFound = () => {
      const newWorker = registration.installing;
      if (newWorker && typeof newWorker.addEventListener === 'function') {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[PWA] New service worker available');
            dispatchUpdateEvent();
          }
        });
      }
    };

    if (typeof registration.addEventListener === 'function') {
      registration.addEventListener('updatefound', handleUpdateFound);
    } else if ('onupdatefound' in registration) {
      registration.onupdatefound = handleUpdateFound;
    }

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const results = await Promise.all(
    registrations.map(registration => registration.unregister())
  );

  return results.every(result => result);
}

/**
 * Check if service worker is registered
 */
export async function isServiceWorkerRegistered(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  return !!registration;
}

/**
 * Dispatch update event
 */
function dispatchUpdateEvent() {
  const event = new CustomEvent('pwa-update-available', {
    detail: { timestamp: Date.now() },
  });
  window.dispatchEvent(event);
}

/**
 * Skip waiting and reload
 */
export async function skipWaitingAndReload(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload when the new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}

/**
 * Get service worker version
 */
export async function getServiceWorkerVersion(): Promise<string | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  const activeWorker = registration?.active;
  if (!activeWorker) {
    return null;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data.version);
    };

    activeWorker.postMessage(
      { type: 'GET_VERSION' },
      [messageChannel.port2]
    );
  });
}
