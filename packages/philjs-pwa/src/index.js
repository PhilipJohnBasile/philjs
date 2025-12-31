/**
 * @philjs/pwa - Zero-Config PWA Generation
 *
 * Automatic Progressive Web App generation.
 * NO OTHER FRAMEWORK provides zero-config PWA with all features.
 *
 * Features:
 * - Automatic service worker generation
 * - Web app manifest generation
 * - Install prompt handling
 * - Push notifications
 * - Background sync
 * - Periodic sync
 * - Share target API
 * - File handling API
 * - App shortcuts
 * - Badging API
 */
// ============================================================================
// Manifest Generator
// ============================================================================
export class ManifestGenerator {
    config;
    constructor(config) {
        this.config = config;
    }
    generate() {
        const manifest = {
            name: this.config.name,
            short_name: this.config.shortName ?? this.config.name.slice(0, 12),
            description: this.config.description,
            start_url: this.config.startUrl ?? '/',
            display: this.config.display ?? 'standalone',
            orientation: this.config.orientation ?? 'any',
            theme_color: this.config.themeColor ?? '#ffffff',
            background_color: this.config.backgroundColor ?? '#ffffff',
            icons: this.config.icons ?? this.generateDefaultIcons(),
            categories: this.config.categories
        };
        if (this.config.screenshots) {
            manifest['screenshots'] = this.config.screenshots;
        }
        if (this.config.shortcuts) {
            manifest['shortcuts'] = this.config.shortcuts;
        }
        if (this.config.shareTarget) {
            manifest['share_target'] = {
                action: this.config.shareTarget.action,
                method: this.config.shareTarget.method ?? 'GET',
                enctype: this.config.shareTarget.enctype,
                params: this.config.shareTarget.params
            };
        }
        if (this.config.fileHandlers) {
            manifest['file_handlers'] = this.config.fileHandlers.map(handler => ({
                action: handler.action,
                accept: handler.accept,
                icons: handler.icons,
                launch_type: handler.launchType
            }));
        }
        return manifest;
    }
    generateDefaultIcons() {
        // Default icon sizes for PWA
        const sizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
        return sizes.map(size => ({
            src: `/icons/icon-${size}.png`,
            sizes: size,
            type: 'image/png'
        }));
    }
    toJSON() {
        return JSON.stringify(this.generate(), null, 2);
    }
    inject() {
        if (typeof document === 'undefined')
            return;
        // Create manifest blob
        const manifest = this.generate();
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        // Remove existing manifest link
        const existing = document.querySelector('link[rel="manifest"]');
        if (existing) {
            existing.remove();
        }
        // Add new manifest link
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = url;
        document.head.appendChild(link);
        // Add theme color meta tag
        let themeMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeMeta) {
            themeMeta = document.createElement('meta');
            themeMeta.setAttribute('name', 'theme-color');
            document.head.appendChild(themeMeta);
        }
        themeMeta.setAttribute('content', this.config.themeColor ?? '#ffffff');
        // Add iOS meta tags
        this.addIOSMeta();
    }
    addIOSMeta() {
        if (typeof document === 'undefined')
            return;
        const metas = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
            { name: 'apple-mobile-web-app-title', content: this.config.shortName ?? this.config.name }
        ];
        metas.forEach(({ name, content }) => {
            let meta = document.querySelector(`meta[name="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        });
        // Add iOS icons
        if (this.config.icons) {
            const appleTouchIcon = this.config.icons.find(i => i.sizes === '180x180' || i.sizes === '192x192');
            if (appleTouchIcon) {
                let link = document.querySelector('link[rel="apple-touch-icon"]');
                if (!link) {
                    link = document.createElement('link');
                    link.setAttribute('rel', 'apple-touch-icon');
                    document.head.appendChild(link);
                }
                link.setAttribute('href', appleTouchIcon.src);
            }
        }
    }
}
// ============================================================================
// Service Worker Generator
// ============================================================================
export class ServiceWorkerGenerator {
    config;
    constructor(config) {
        this.config = config;
    }
    generate() {
        const cacheName = `${this.config.shortName ?? this.config.name}-v1`;
        const strategies = this.config.cacheStrategies ?? [];
        const offlinePages = this.config.offlinePages ?? ['/offline.html'];
        return `
// Generated by @philjs/pwa
const CACHE_NAME = '${cacheName}';
const OFFLINE_PAGES = ${JSON.stringify(offlinePages)};

const CACHE_STRATEGIES = ${JSON.stringify(strategies.map(s => ({
            ...s,
            urlPattern: s.urlPattern instanceof RegExp ? s.urlPattern.source : s.urlPattern
        })))};

// Install event
self.addEventListener('install', (event) => {
  ${this.config.skipWaiting ? 'self.skipWaiting();' : ''}

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_PAGES);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  ${this.config.clientsClaim ? 'self.clients.claim();' : ''}

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

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Find matching strategy
  const strategy = CACHE_STRATEGIES.find((s) => {
    const pattern = new RegExp(s.urlPattern);
    return pattern.test(url.pathname) || pattern.test(url.href);
  });

  if (strategy) {
    event.respondWith(handleWithStrategy(event.request, strategy));
  } else {
    // Default: network-first for navigation, cache-first for assets
    if (event.request.mode === 'navigate') {
      event.respondWith(networkFirst(event.request));
    } else {
      event.respondWith(cacheFirst(event.request));
    }
  }
});

async function handleWithStrategy(request, strategy) {
  switch (strategy.strategy) {
    case 'cache-first':
      return cacheFirst(request, strategy.cacheName);
    case 'network-first':
      return networkFirst(request, strategy.cacheName);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, strategy.cacheName);
    case 'cache-only':
      return cacheOnly(request, strategy.cacheName);
    case 'network-only':
      return fetch(request);
    default:
      return networkFirst(request, strategy.cacheName);
  }
}

async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return caches.match('/offline.html');
  }
}

async function networkFirst(request, cacheName = CACHE_NAME) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match('/offline.html');
  }
}

async function staleWhileRevalidate(request, cacheName = CACHE_NAME) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    caches.open(cacheName).then((cache) => {
      cache.put(request, response.clone());
    });
    return response;
  });

  return cached || fetchPromise;
}

async function cacheOnly(request, cacheName = CACHE_NAME) {
  return caches.match(request) || caches.match('/offline.html');
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      tag: data.tag,
      renotify: data.renotify,
      requireInteraction: data.requireInteraction,
      silent: data.silent,
      data: data.data,
      actions: data.actions
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action click
    const data = event.notification.data;
    if (data && data.actions && data.actions[event.action]) {
      event.waitUntil(clients.openWindow(data.actions[event.action]));
    }
  } else {
    // Handle notification click
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag.startsWith('sync-')) {
    event.waitUntil(handleBackgroundSync(event.tag));
  }
});

async function handleBackgroundSync(tag) {
  // Emit event to clients
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'sync', tag });
  });
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag.startsWith('periodic-')) {
    event.waitUntil(handlePeriodicSync(event.tag));
  }
});

async function handlePeriodicSync(tag) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'periodicsync', tag });
  });
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;
    }
    async register() {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
            console.warn('Service Workers not supported');
            return null;
        }
        try {
            // Create SW blob
            const swCode = this.generate();
            const blob = new Blob([swCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const registration = await navigator.serviceWorker.register(url);
            console.log('Service Worker registered:', registration.scope);
            return registration;
        }
        catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }
}
// ============================================================================
// PWA Manager
// ============================================================================
export class PWAManager {
    config;
    manifestGenerator;
    swGenerator;
    installPrompt = null;
    registration = null;
    listeners = new Map();
    state = {
        installed: false,
        installable: false,
        updateAvailable: false,
        online: true,
        pushEnabled: false
    };
    constructor(config) {
        this.config = config;
        this.manifestGenerator = new ManifestGenerator(config);
        this.swGenerator = new ServiceWorkerGenerator(config);
        this.setupEventListeners();
    }
    setupEventListeners() {
        if (typeof window === 'undefined')
            return;
        // Install prompt
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.installPrompt = event;
            this.state.installable = true;
            this.emit('installable', true);
        });
        // App installed
        window.addEventListener('appinstalled', () => {
            this.installPrompt = null;
            this.state.installed = true;
            this.state.installable = false;
            this.emit('installed', true);
        });
        // Online/offline
        window.addEventListener('online', () => {
            this.state.online = true;
            this.emit('online', true);
        });
        window.addEventListener('offline', () => {
            this.state.online = false;
            this.emit('online', false);
        });
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true) {
            this.state.installed = true;
        }
    }
    async init() {
        // Inject manifest
        this.manifestGenerator.inject();
        // Register service worker
        this.registration = await this.swGenerator.register();
        if (this.registration) {
            // Check for updates
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.state.updateAvailable = true;
                            this.emit('updateAvailable', true);
                        }
                    });
                }
            });
            // Listen for messages from SW
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'sync') {
                    this.emit('backgroundSync', event.data.tag);
                }
                else if (event.data.type === 'periodicsync') {
                    this.emit('periodicSync', event.data.tag);
                }
            });
        }
    }
    async install() {
        if (!this.installPrompt) {
            console.warn('Install prompt not available');
            return false;
        }
        await this.installPrompt.prompt();
        const result = await this.installPrompt.userChoice;
        if (result.outcome === 'accepted') {
            this.installPrompt = null;
            this.state.installable = false;
            return true;
        }
        return false;
    }
    async update() {
        if (this.registration?.waiting) {
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    async subscribeToPush(vapidPublicKey) {
        if (!this.registration) {
            console.warn('Service Worker not registered');
            return null;
        }
        try {
            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
            });
            this.state.pushEnabled = true;
            return subscription;
        }
        catch (error) {
            console.error('Push subscription failed:', error);
            return null;
        }
    }
    async showNotification(options) {
        if (!this.registration) {
            // Fallback to regular notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(options.title, options);
            }
            return;
        }
        await this.registration.showNotification(options.title, options);
    }
    async setBadge(count) {
        if ('setAppBadge' in navigator) {
            if (count === undefined || count === 0) {
                await navigator.clearAppBadge();
            }
            else {
                await navigator.setAppBadge(count);
            }
        }
    }
    async registerBackgroundSync(tag) {
        if (!this.registration)
            return false;
        try {
            await this.registration.sync.register(tag);
            return true;
        }
        catch (error) {
            console.error('Background sync registration failed:', error);
            return false;
        }
    }
    async registerPeriodicSync(tag, minInterval) {
        if (!this.registration)
            return false;
        try {
            const status = await navigator.permissions.query({
                name: 'periodic-background-sync'
            });
            if (status.state !== 'granted') {
                console.warn('Periodic sync permission not granted');
                return false;
            }
            await this.registration.periodicSync.register(tag, {
                minInterval
            });
            return true;
        }
        catch (error) {
            console.error('Periodic sync registration failed:', error);
            return false;
        }
    }
    getState() {
        return { ...this.state };
    }
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.listeners.get(event)?.delete(callback);
    }
    emit(event, ...args) {
        this.listeners.get(event)?.forEach(cb => cb(...args));
    }
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}
// ============================================================================
// React-style Hooks
// ============================================================================
// State helper
function createState(initial) {
    let value = initial;
    return [() => value, (newValue) => { value = newValue; }];
}
let globalPWA = null;
/**
 * Hook for PWA functionality
 */
export function usePWA(config) {
    if (!globalPWA) {
        globalPWA = new PWAManager(config);
        globalPWA.init();
    }
    const [getState, setState] = createState(globalPWA.getState());
    globalPWA.on('installable', () => setState(globalPWA.getState()));
    globalPWA.on('installed', () => setState(globalPWA.getState()));
    globalPWA.on('updateAvailable', () => setState(globalPWA.getState()));
    globalPWA.on('online', () => setState(globalPWA.getState()));
    return {
        state: getState(),
        install: () => globalPWA.install(),
        update: () => globalPWA.update(),
        showNotification: (opts) => globalPWA.showNotification(opts),
        setBadge: (count) => globalPWA.setBadge(count),
        requestNotificationPermission: () => globalPWA.requestNotificationPermission(),
        subscribeToPush: (key) => globalPWA.subscribeToPush(key)
    };
}
/**
 * Hook for install prompt
 */
export function useInstallPrompt() {
    const [getCanInstall, setCanInstall] = createState(false);
    const [getInstalled, setInstalled] = createState(false);
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeinstallprompt', () => setCanInstall(true));
        window.addEventListener('appinstalled', () => {
            setInstalled(true);
            setCanInstall(false);
        });
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true) {
            setInstalled(true);
        }
    }
    return {
        canInstall: getCanInstall(),
        isInstalled: getInstalled(),
        install: () => globalPWA?.install() ?? Promise.resolve(false)
    };
}
/**
 * Hook for online status
 */
export function useOnlineStatus() {
    const [getOnline, setOnline] = createState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => setOnline(true));
        window.addEventListener('offline', () => setOnline(false));
    }
    return getOnline();
}
// ============================================================================
// Vite Plugin
// ============================================================================
export function pwaPlugin(config) {
    const manifestGenerator = new ManifestGenerator(config);
    const swGenerator = new ServiceWorkerGenerator(config);
    return {
        name: 'philjs-pwa',
        configureServer(server) {
            // Serve manifest
            server.middlewares.use('/manifest.json', (_req, res) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(manifestGenerator.toJSON());
            });
            // Serve service worker
            server.middlewares.use('/sw.js', (_req, res) => {
                res.setHeader('Content-Type', 'application/javascript');
                res.end(swGenerator.generate());
            });
        },
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'manifest.json',
                source: manifestGenerator.toJSON()
            });
            this.emitFile({
                type: 'asset',
                fileName: 'sw.js',
                source: swGenerator.generate()
            });
        },
        transformIndexHtml(html) {
            return html.replace('</head>', `  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="${config.themeColor ?? '#ffffff'}">
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
      });
    }
  </script>
</head>`);
        }
    };
}
// ============================================================================
// Default Export
// ============================================================================
export default {
    ManifestGenerator,
    ServiceWorkerGenerator,
    PWAManager,
    pwaPlugin,
    usePWA,
    useInstallPrompt,
    useOnlineStatus
};
//# sourceMappingURL=index.js.map