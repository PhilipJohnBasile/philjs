# Service Workers

Enable offline functionality and advanced caching in PhilJS applications.

## What You'll Learn

- Service worker basics
- Caching strategies
- Offline support
- Background sync
- Push notifications
- Best practices

## Service Worker Basics

### Register Service Worker

```typescript
// src/registerSW.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New content available, please refresh');
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  }
}

// Usage in main.ts
import { registerServiceWorker } from './registerSW';

registerServiceWorker();
```

### Basic Service Worker

```ts
// src/sw.ts (compiled to public/sw.js)
const CACHE_NAME = 'philjs-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/style.css',
  '/assets/main.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );

  // Take control immediately
  self.clients.claim();
});

// Fetch event - serve from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

## Caching Strategies

### Cache First

Serve from cache, fall back to network.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached response or fetch from network
      return cached || fetch(event.request).then((response) => {
        // Optionally cache the new response
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
```

### Network First

Try network, fall back to cache.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
        });
        return response;
      })
      .catch(() => {
        // Fall back to cache on network error
        return caches.match(event.request);
      })
  );
});
```

### Stale While Revalidate

Serve from cache, update in background.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Fetch in background to update cache
      const fetchPromise = fetch(event.request).then((response) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
        });
        return response;
      });

      // Return cached version immediately, or wait for fetch
      return cached || fetchPromise;
    })
  );
});
```

### Network Only

Always fetch from network.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
```

### Cache Only

Only serve from cache.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});
```

## Offline Support

### Offline Page

```javascript
const OFFLINE_URL = '/offline.html';

// Cache offline page during install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add(OFFLINE_URL);
    })
  );
});

// Serve offline page when network is unavailable
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
  }
});
```

### Offline Detection in App

```typescript
import { signal, effect } from '@philjs/core';

export function useOnlineStatus() {
  const isOnline = signal(navigator.onLine);

  effect(() => {
    const handleOnline = () => isOnline.set(true);
    const handleOffline = () => isOnline.set(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  return isOnline;
}

// Usage
function App() {
  const isOnline = useOnlineStatus();

  return (
    <div>
      {!isOnline() && (
        <div className="offline-banner">
          You are currently offline. Some features may be unavailable.
        </div>
      )}

      <MainContent />
    </div>
  );
}
```

## Background Sync

### Queue Requests for Sync

```ts
// src/sw.ts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});

async function syncPosts() {
  const cache = await caches.open('pending-requests');
  const requests = await cache.keys();

  return Promise.all(
    requests.map(async (request) => {
      try {
        // Replay the request
        const response = await fetch(request);

        if (response.ok) {
          // Remove from cache if successful
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    })
  );
}
```

### Register Background Sync

```typescript
export async function queueRequest(url: string, options: RequestInit) {
  // Try to send immediately
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
  } catch (error) {
    console.log('Request failed, queuing for sync');
  }

  // Queue for background sync
  const cache = await caches.open('pending-requests');
  await cache.put(
    new Request(url, options),
    new Response(null, { status: 202 })
  );

  // Register sync
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-posts');
  }
}

// Usage
function CreatePost() {
  const submit = async (title: string, content: string) => {
    await queueRequest('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });

    console.log('Post queued for sync');
  };

  return <form onSubmit={submit}>{/* form fields */}</form>;
}
```

## Push Notifications

### Request Permission

```typescript
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Usage
function NotificationSettings() {
  const enabled = signal(Notification.permission === 'granted');

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    enabled.set(granted);

    if (granted) {
      // Subscribe to push notifications
      await subscribeToPush();
    }
  };

  return (
    <div>
      <button onClick={enableNotifications} disabled={enabled()}>
        {enabled() ? '✓ Notifications Enabled' : 'Enable Notifications'}
      </button>
    </div>
  );
}
```

### Subscribe to Push

```typescript
export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.VITE_VAPID_PUBLIC_KEY!
    )
  });

  // Send subscription to server
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });

  return subscription;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
```

### Handle Push Events

```ts
// src/sw.ts
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

## Update Notification

### Notify User of Updates

```typescript
import { signal } from '@philjs/core';

export function useServiceWorkerUpdate() {
  const updateAvailable = signal(false);
  const registration = signal<ServiceWorkerRegistration | null>(null);

  effect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        registration.set(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          newWorker?.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              updateAvailable.set(true);
            }
          });
        });
      });
    }
  });

  const applyUpdate = () => {
    const reg = registration();
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload page when new worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };

  return {
    updateAvailable,
    applyUpdate
  };
}

// Usage
function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();

  if (!updateAvailable()) return null;

  return (
    <div className="update-banner">
      <p>A new version is available!</p>
      <button onClick={applyUpdate}>Update Now</button>
    </div>
  );
}
```

## Advanced Patterns

### Precaching with Workbox

```bash
npm install -D workbox-webpack-plugin
```

```javascript
// workbox-config.ts
module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,svg}'
  ],
  swDest: 'dist/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.example\.com\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 minutes
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
};
```

### Message Communication

```typescript
// Send message to service worker
export function sendMessageToSW(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    navigator.serviceWorker.controller?.postMessage(message, [
      messageChannel.port2
    ]);
  });
}

// Handle in service worker
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_CACHE_SIZE') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        event.ports[0].postMessage({ size: keys.length });
      });
    });
  }
});

// Usage
const cacheSize = await sendMessageToSW({ type: 'GET_CACHE_SIZE' });
console.log('Cache size:', cacheSize.size);
```

## Best Practices

### Version Your Cache

```javascript
const VERSION = '0.1.0';
const CACHE_NAME = `philjs-app-${VERSION}`;

// Update version when deploying new version
```

### Set Cache Limits

```javascript
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    // Delete oldest entries
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxItems);
  }
}

// Call after caching
limitCacheSize('image-cache', 50);
```

### Handle Different File Types

```javascript
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
  }
  // Images - Cache First
  else if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
  }
  // HTML - Network First
  else if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
  }
  // Everything else - Stale While Revalidate
  else {
    event.respondWith(staleWhileRevalidate(request));
  }
});
```

## Summary

You've learned:

✅ Service worker registration and lifecycle
✅ Caching strategies (Cache First, Network First, etc.)
✅ Offline support and detection
✅ Background sync for reliable requests
✅ Push notifications
✅ Update notifications for new versions
✅ Advanced patterns with Workbox
✅ Service worker communication
✅ Best practices for PWAs

Service workers enable offline-first, reliable web applications!

---

**Next:** [Testing →](./testing.md) Comprehensive testing strategies
