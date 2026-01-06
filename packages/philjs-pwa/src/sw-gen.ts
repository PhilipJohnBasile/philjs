/**
 * @philjs/pwa - Service Worker Generator
 *
 * Generates optimized service workers for PhilJS PWAs with:
 * - Precaching for static assets
 * - Runtime caching strategies
 * - Background sync
 * - Push notifications
 * - Offline fallback
 *
 * @example
 * ```ts
 * import { generateServiceWorker, registerServiceWorker } from '@philjs/pwa';
 *
 * // In your build config
 * await generateServiceWorker({
 *   outDir: 'dist',
 *   precache: ['/', '/offline.html'],
 *   runtimeCaching: [
 *     { urlPattern: /\/api\//, strategy: 'NetworkFirst' },
 *     { urlPattern: /\.(png|jpg|gif)$/, strategy: 'CacheFirst' },
 *   ],
 * });
 *
 * // In your app
 * registerServiceWorker('/sw.js');
 * ```
 */

import { signal, type Signal } from '@philjs/core';

// Types

export interface ServiceWorkerConfig {
  /** Output directory */
  outDir: string;
  /** Service worker filename */
  swDest?: string;
  /** Files to precache */
  precache?: string[];
  /** Glob patterns for precaching */
  globPatterns?: string[];
  /** Runtime caching rules */
  runtimeCaching?: RuntimeCacheRule[];
  /** Offline fallback page */
  offlineFallback?: string;
  /** Enable navigation preload */
  navigationPreload?: boolean;
  /** Skip waiting on update */
  skipWaiting?: boolean;
  /** Clients claim immediately */
  clientsClaim?: boolean;
  /** Enable background sync */
  backgroundSync?: BackgroundSyncConfig;
  /** Enable push notifications */
  pushNotifications?: PushConfig;
  /** Custom service worker code */
  customCode?: string;
  /** Source map generation */
  sourcemap?: boolean;
}

export interface RuntimeCacheRule {
  /** URL pattern to match */
  urlPattern: RegExp | string;
  /** Caching strategy */
  strategy: CacheStrategy;
  /** Strategy options */
  options?: CacheStrategyOptions;
  /** HTTP method(s) to match */
  method?: string | string[];
  /** Cache name */
  cacheName?: string;
}

export type CacheStrategy =
  | 'CacheFirst'
  | 'NetworkFirst'
  | 'StaleWhileRevalidate'
  | 'NetworkOnly'
  | 'CacheOnly';

export interface CacheStrategyOptions {
  /** Cache name */
  cacheName?: string;
  /** Network timeout in ms */
  networkTimeout?: number;
  /** Max entries in cache */
  maxEntries?: number;
  /** Max age in seconds */
  maxAge?: number;
  /** Cache query options */
  cacheQueryOptions?: {
    ignoreSearch?: boolean;
    ignoreMethod?: boolean;
    ignoreVary?: boolean;
  };
}

export interface BackgroundSyncConfig {
  /** Queue name */
  name: string;
  /** Max retry time in minutes */
  maxRetentionTime?: number;
  /** Force sync even if online */
  forceSyncFallback?: boolean;
}

export interface PushConfig {
  /** VAPID public key */
  vapidPublicKey: string;
  /** Push subscription endpoint */
  subscriptionEndpoint?: string;
}

export interface ManifestConfig {
  /** App name */
  name: string;
  /** Short name */
  short_name: string;
  /** Description */
  description?: string;
  /** Start URL */
  start_url: string;
  /** Display mode */
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  /** Background color */
  background_color: string;
  /** Theme color */
  theme_color: string;
  /** Icons */
  icons: ManifestIcon[];
  /** Orientation */
  orientation?: 'portrait' | 'landscape' | 'any';
  /** Scope */
  scope?: string;
  /** Categories */
  categories?: string[];
  /** Screenshots */
  screenshots?: ManifestScreenshot[];
  /** Shortcuts */
  shortcuts?: ManifestShortcut[];
  /** Share target */
  share_target?: ManifestShareTarget;
}

export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface ManifestScreenshot {
  src: string;
  sizes: string;
  type: string;
  form_factor?: 'narrow' | 'wide';
  label?: string;
}

export interface ManifestShortcut {
  name: string;
  short_name?: string;
  description?: string;
  url: string;
  icons?: ManifestIcon[];
}

export interface ManifestShareTarget {
  action: string;
  method?: 'GET' | 'POST';
  enctype?: string;
  params: {
    title?: string;
    text?: string;
    url?: string;
    files?: Array<{ name: string; accept: string[] }>;
  };
}

// State

const swStatusSignal: Signal<'installing' | 'waiting' | 'active' | 'error' | null> = signal(null);
const updateAvailableSignal: Signal<boolean> = signal(false);

// Generator Functions

/**
 * Generates a service worker file
 */
export async function generateServiceWorker(config: ServiceWorkerConfig): Promise<string> {
  const {
    swDest = 'sw.js',
    precache = [],
    globPatterns = ['**/*.{js,css,html,png,jpg,svg,woff2}'],
    runtimeCaching = [],
    offlineFallback,
    navigationPreload = true,
    skipWaiting = true,
    clientsClaim = true,
    backgroundSync,
    pushNotifications,
    customCode = '',
    sourcemap = false,
  } = config;

  const swCode = `
// PhilJS Service Worker - Generated at ${new Date().toISOString()}
'use strict';

const CACHE_NAME = 'philjs-cache-v1';
const PRECACHE_URLS = ${JSON.stringify(precache)};

// Install event - precache resources
self.addEventListener('install', (event) => {
  ${skipWaiting ? 'self.skipWaiting();' : ''}

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  ${clientsClaim ? 'self.clients.claim();' : ''}
  ${navigationPreload ? `
  // Enable navigation preload
  if (self.registration.navigationPreload) {
    self.registration.navigationPreload.enable();
  }
  ` : ''}

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event - runtime caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  ${generateRuntimeCachingCode(runtimeCaching, offlineFallback)}
});

${generateCacheStrategies()}

${backgroundSync ? generateBackgroundSyncCode(backgroundSync) : ''}

${pushNotifications ? generatePushCode(pushNotifications) : ''}

// Message handler for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

${customCode}

`;

  return swCode;
}

/**
 * Generates manifest.json
 */
export function generateManifest(config: ManifestConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Registers service worker in the browser
 */
export async function registerServiceWorker(
  swPath: string = '/sw.js',
  options?: {
    scope?: string;
    updateViaCache?: 'all' | 'imports' | 'none';
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
  }
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: options?.scope || '/',
      updateViaCache: options?.updateViaCache || 'none',
    });

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      swStatusSignal.set('installing');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            updateAvailableSignal.set(true);
            swStatusSignal.set('waiting');
            options?.onUpdate?.(registration);
          } else {
            // First install
            swStatusSignal.set('active');
            options?.onSuccess?.(registration);
          }
        }
      });
    });

    // Handle controller change (after skipWaiting)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    swStatusSignal.set('error');
    return null;
  }
}

/**
 * Prompts user to update to new service worker
 */
export async function promptUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Unregisters service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  const registrations = await navigator.serviceWorker.getRegistrations();

  for (const registration of registrations) {
    await registration.unregister();
  }

  return true;
}

// Reactive state hooks

export function useSWStatus(): Signal<'installing' | 'waiting' | 'active' | 'error' | null> {
  return swStatusSignal;
}

export function useUpdateAvailable(): Signal<boolean> {
  return updateAvailableSignal;
}

// Helper functions for code generation

function generateRuntimeCachingCode(rules: RuntimeCacheRule[], offlineFallback?: string): string {
  if (rules.length === 0 && !offlineFallback) {
    return `
  // Default: Network first, fallback to cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );`;
  }

  let code = '';

  for (const rule of rules) {
    const pattern = typeof rule.urlPattern === 'string'
      ? `url.pathname.startsWith('${rule.urlPattern}')`
      : `${rule.urlPattern}.test(url.pathname)`;

    code += `
  if (${pattern}) {
    event.respondWith(${rule.strategy.toLowerCase()}(request, ${JSON.stringify(rule.options || {})}));
    return;
  }
`;
  }

  if (offlineFallback) {
    code += `
  // Navigation requests - offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('${offlineFallback}'))
    );
    return;
  }
`;
  }

  code += `
  // Default: Network first
  event.respondWith(networkFirst(request));
`;

  return code;
}

function generateCacheStrategies(): string {
  return `
// Cache First Strategy
async function cacheFirst(request, options = {}) {
  const cacheName = options.cacheName || CACHE_NAME;
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    throw error;
  }
}

// Network First Strategy
async function networkFirst(request, options = {}) {
  const cacheName = options.cacheName || CACHE_NAME;
  const timeout = options.networkTimeout || 3000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, options = {}) {
  const cacheName = options.cacheName || CACHE_NAME;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  });

  return cached || fetchPromise;
}

// Network Only Strategy
async function networkOnly(request) {
  return fetch(request);
}

// Cache Only Strategy
async function cacheOnly(request, options = {}) {
  const cacheName = options.cacheName || CACHE_NAME;
  return caches.match(request);
}
`;
}

function generateBackgroundSyncCode(config: BackgroundSyncConfig): string {
  return `
// Background Sync
const bgSyncQueue = [];

self.addEventListener('sync', (event) => {
  if (event.tag === '${config.name}') {
    event.waitUntil(
      (async () => {
        while (bgSyncQueue.length > 0) {
          const request = bgSyncQueue.shift();
          try {
            await fetch(request);
          } catch (error) {
            bgSyncQueue.unshift(request);
            throw error;
          }
        }
      })()
    );
  }
});

// Add request to sync queue
function addToSyncQueue(request) {
  bgSyncQueue.push(request);
  if ('sync' in self.registration) {
    self.registration.sync.register('${config.name}');
  }
}
`;
}

function generatePushCode(config: PushConfig): string {
  return `
// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge.png',
    vibrate: data.vibrate || [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag,
    renotify: data.renotify,
    requireInteraction: data.requireInteraction,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window or open new
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
  );
});
`;
}

// Push notification helpers

/**
 * Subscribes to push notifications
 */
export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) {
    console.warn('Push notifications are not supported');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
  });

  return subscription;
}

/**
 * Unsubscribes from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    return subscription.unsubscribe();
  }

  return false;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Types are already exported at their definition sites
