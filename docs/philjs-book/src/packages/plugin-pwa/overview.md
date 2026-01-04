# @philjs/plugin-pwa

Complete Progressive Web App (PWA) solution for PhilJS applications with service worker generation, manifest handling, offline support, install prompts, update notifications, and background sync.

## Installation

```bash
npm install @philjs/plugin-pwa
```

## Features

- **Service Worker Generation** - Auto-generate service workers with caching strategies
- **Web App Manifest** - Generate and manage PWA manifests
- **Offline Support** - Reactive online/offline detection with request queuing
- **Install Prompts** - Handle A2HS (Add to Home Screen) prompts
- **Update Notifications** - Detect and apply service worker updates
- **Background Sync** - Queue operations for when connectivity returns
- **Cache Strategies** - Flexible caching with cache-first, network-first, stale-while-revalidate

## Quick Start

### Basic Setup

```typescript
import {
  generateServiceWorker,
  registerServiceWorker,
  generateManifest,
  initInstallPrompt,
  initOfflineDetection,
  initUpdateNotifications,
} from '@philjs/plugin-pwa';

// 1. Generate service worker
const swCode = generateServiceWorker({
  precache: ['/index.html', '/app.js', '/styles.css'],
  offlineFallback: '/offline.html',
});

// Write to sw.js file (at build time)
writeFileSync('dist/sw.js', swCode);

// 2. Generate manifest
const manifest = generateManifest({
  name: 'My PWA',
  short_name: 'PWA',
  start_url: '/',
  theme_color: '#667eea',
});

// Write to manifest.json (at build time)
writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));

// 3. Initialize at runtime
registerServiceWorker('/sw.js');
initInstallPrompt();
initOfflineDetection();
initUpdateNotifications();
```

### HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#667eea">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="My PWA">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
  <title>My PWA</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>
```

## Service Worker

### Generating a Service Worker

```typescript
import { generateServiceWorker } from '@philjs/plugin-pwa';

const swCode = generateServiceWorker({
  // Cache name prefix and version
  cachePrefix: 'my-app',
  cacheVersion: 'v1.0.0',

  // Files to precache on install
  precache: [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
    '/offline.html',
  ],

  // Runtime caching rules
  runtimeCaching: [
    {
      pattern: /\/api\//,
      strategy: 'network-first',
      networkTimeout: 3000,
      maxEntries: 50,
    },
    {
      pattern: /\.(png|jpg|jpeg|svg|gif)$/,
      strategy: 'cache-first',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      maxEntries: 100,
    },
  ],

  // Skip waiting on install (immediate activation)
  skipWaiting: true,

  // Claim clients on activate
  clientsClaim: true,

  // Enable navigation preload
  navigationPreload: true,

  // Offline fallback page
  offlineFallback: '/offline.html',

  // Background sync configuration
  backgroundSync: {
    enabled: true,
    queueName: 'my-sync-queue',
  },
});
```

### Registering the Service Worker

```typescript
import { registerServiceWorker, unregisterServiceWorker } from '@philjs/plugin-pwa';

// Register service worker
const registration = await registerServiceWorker('/sw.js', {
  scope: '/',
});

if (registration) {
  console.log('SW registered with scope:', registration.scope);
}

// Unregister all service workers
await unregisterServiceWorker();
```

### Service Worker Utilities

```typescript
import {
  isServiceWorkerRegistered,
  skipWaitingAndReload,
  getServiceWorkerVersion,
} from '@philjs/plugin-pwa';

// Check if registered
const registered = await isServiceWorkerRegistered();

// Force update and reload
await skipWaitingAndReload();

// Get current version
const version = await getServiceWorkerVersion();
console.log('SW version:', version);
```

## Cache Strategies

### Available Strategies

| Strategy | Description |
|----------|-------------|
| `cache-first` | Try cache, fall back to network |
| `network-first` | Try network, fall back to cache |
| `cache-only` | Only use cache |
| `network-only` | Only use network |
| `stale-while-revalidate` | Return cache immediately, update in background |

### Creating Cache Rules

```typescript
import { createCacheRule, cacheRules, getDefaultCacheRules } from '@philjs/plugin-pwa';

// Create custom cache rule
const apiRule = createCacheRule(
  /\/api\//,                    // Pattern (RegExp or string)
  'network-first',              // Strategy
  {
    cacheName: 'api-cache',     // Optional cache name
    maxAge: 5 * 60 * 1000,      // 5 minutes
    maxEntries: 50,
    networkTimeout: 3000,
  }
);

// Use predefined rules
const rules = [
  cacheRules.staticAssets(),    // JS, CSS, images - cache-first
  cacheRules.apiResponses('/api'), // API calls - network-first
  cacheRules.images(),          // Images - stale-while-revalidate
  cacheRules.fonts(),           // Fonts - cache-first
  ...cacheRules.googleFonts(),  // Google Fonts
];

// Or get all default rules
const defaultRules = getDefaultCacheRules();
```

### Runtime Caching Configuration

```typescript
const swCode = generateServiceWorker({
  runtimeCaching: [
    // API requests - network-first with timeout
    {
      pattern: /\/api\//,
      strategy: 'network-first',
      networkTimeout: 3000,
      maxEntries: 50,
    },

    // Static assets - cache-first
    {
      pattern: /\.(js|css)$/,
      strategy: 'cache-first',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },

    // Images - stale-while-revalidate
    {
      pattern: /\.(png|jpg|jpeg|gif|svg|webp)$/,
      strategy: 'stale-while-revalidate',
      cacheName: 'images',
      maxEntries: 100,
    },

    // Third-party CDN assets
    {
      pattern: /^https:\/\/cdn\.example\.com/,
      strategy: 'cache-first',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  ],
});
```

## Web App Manifest

### Generating Manifest

```typescript
import { generateManifest, createManifestJSON } from '@philjs/plugin-pwa';

const manifest = generateManifest({
  // Required
  name: 'My Progressive Web App',
  start_url: '/',

  // Recommended
  short_name: 'My PWA',
  description: 'A description of my app',
  display: 'standalone', // 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  orientation: 'any',    // 'any' | 'natural' | 'landscape' | 'portrait'
  theme_color: '#667eea',
  background_color: '#ffffff',
  scope: '/',

  // Icons
  icons: [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
    },
    {
      src: '/icons/icon-maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],

  // Screenshots for store listings
  screenshots: [
    {
      src: '/screenshots/desktop.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide',
      label: 'Desktop view',
    },
    {
      src: '/screenshots/mobile.png',
      sizes: '750x1334',
      type: 'image/png',
      form_factor: 'narrow',
      label: 'Mobile view',
    },
  ],

  // Categories
  categories: ['productivity', 'utilities'],

  // App shortcuts
  shortcuts: [
    {
      name: 'New Task',
      short_name: 'New',
      description: 'Create a new task',
      url: '/new-task',
      icons: [{ src: '/icons/new-task.png', sizes: '192x192' }],
    },
    {
      name: 'Settings',
      url: '/settings',
    },
  ],

  // Web Share Target
  share_target: {
    action: '/share',
    method: 'POST',
    enctype: 'multipart/form-data',
    params: {
      title: 'title',
      text: 'text',
      url: 'url',
      files: [
        { name: 'images', accept: ['image/*'] },
      ],
    },
  },

  // Related applications
  related_applications: [
    {
      platform: 'play',
      url: 'https://play.google.com/store/apps/details?id=com.example.app',
      id: 'com.example.app',
    },
  ],
  prefer_related_applications: false,
});

// Get JSON string
const json = createManifestJSON(manifest);
```

### Generating PWA Meta Tags

```typescript
import { generatePWAMetaTags, injectManifestLink } from '@philjs/plugin-pwa';

// Get all PWA meta tags
const metaTags = generatePWAMetaTags({
  name: 'My PWA',
  short_name: 'PWA',
  description: 'My awesome app',
  theme_color: '#667eea',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192' },
    { src: '/icons/icon-512.png', sizes: '512x512' },
  ],
});

// Outputs:
// <meta name="application-name" content="My PWA">
// <meta name="apple-mobile-web-app-capable" content="yes">
// <meta name="apple-mobile-web-app-status-bar-style" content="default">
// <meta name="apple-mobile-web-app-title" content="PWA">
// <meta name="description" content="My awesome app">
// <meta name="theme-color" content="#667eea">
// <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png">
// <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png">

// Get manifest link
const link = injectManifestLink('/manifest.json');
// <link rel="manifest" href="/manifest.json">
```

## Install Prompts

### Setting Up Install Prompts

```typescript
import {
  initInstallPrompt,
  showInstallPrompt,
  canInstall,
  isInstalled,
} from '@philjs/plugin-pwa';
import { effect } from '@philjs/core';

// Initialize install prompt handling
const cleanup = initInstallPrompt();

// React to install availability
effect(() => {
  if (canInstall()) {
    console.log('App can be installed!');
    showInstallButton();
  }
});

// React to installation
effect(() => {
  if (isInstalled()) {
    console.log('App is installed!');
    hideInstallButton();
  }
});

// Cleanup on unmount
onUnmount(cleanup);
```

### Showing Install Prompt

```typescript
import { showInstallPrompt, canInstall } from '@philjs/plugin-pwa';

async function handleInstallClick() {
  if (!canInstall()) {
    console.log('Installation not available');
    return;
  }

  const result = await showInstallPrompt();

  if (result === 'accepted') {
    console.log('User accepted installation');
  } else if (result === 'dismissed') {
    console.log('User dismissed installation');
  }
}
```

### Install Button Component

```typescript
import { canInstall, showInstallPrompt } from '@philjs/plugin-pwa';

function InstallButton() {
  return () => canInstall() ? (
    <button onClick={showInstallPrompt} class="install-btn">
      Install App
    </button>
  ) : null;
}
```

### Install Events

```typescript
// Listen for app installed event
window.addEventListener('pwa-installed', () => {
  console.log('App was installed!');
  trackEvent('pwa_installed');
});
```

## Offline Support

### Detecting Online/Offline Status

```typescript
import { initOfflineDetection, isOnline } from '@philjs/plugin-pwa';
import { effect } from '@philjs/core';

// Initialize offline detection
const cleanup = initOfflineDetection();

// React to connectivity changes
effect(() => {
  if (isOnline()) {
    console.log('Back online!');
    syncPendingData();
  } else {
    console.log('Gone offline');
    showOfflineNotification();
  }
});

// Cleanup
onUnmount(cleanup);
```

### Offline Indicator Component

```typescript
import { isOnline } from '@philjs/plugin-pwa';

function OfflineIndicator() {
  return () => !isOnline() ? (
    <div class="offline-indicator">
      You're offline. Some features may be unavailable.
    </div>
  ) : null;
}
```

### Queuing Offline Requests

```typescript
import { queueOfflineRequest, isOnline } from '@philjs/plugin-pwa';

async function saveData(data: any) {
  const url = '/api/save';
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };

  if (isOnline()) {
    // Online: make request directly
    await fetch(url, options);
  } else {
    // Offline: queue for later
    await queueOfflineRequest(url, options);
    console.log('Request queued for when back online');
  }
}
```

### Prefetching Offline Pages

```typescript
import { prefetchOfflinePage, isOfflinePageCached } from '@philjs/plugin-pwa';

// Prefetch offline fallback page
await prefetchOfflinePage('/offline.html');

// Check if cached
const isCached = await isOfflinePageCached('/offline.html');
```

## Update Notifications

### Setting Up Update Notifications

```typescript
import {
  initUpdateNotifications,
  hasUpdate,
  updateInfo,
  checkForUpdates,
  applyUpdate,
  dismissUpdate,
} from '@philjs/plugin-pwa';
import { effect } from '@philjs/core';

// Initialize update notifications
const cleanup = initUpdateNotifications({
  checkInterval: 60 * 60 * 1000, // Check every hour
  autoCheck: true,
});

// React to updates
effect(() => {
  if (hasUpdate()) {
    const info = updateInfo();
    console.log('Update available:', info?.version);
    showUpdateNotification();
  }
});

// Cleanup
onUnmount(cleanup);
```

### Update Banner Component

```typescript
import { hasUpdate, applyUpdate, dismissUpdate } from '@philjs/plugin-pwa';

function UpdateBanner() {
  return () => hasUpdate() ? (
    <div class="update-banner">
      <p>A new version is available!</p>
      <button onClick={applyUpdate}>Update Now</button>
      <button onClick={dismissUpdate}>Later</button>
    </div>
  ) : null;
}
```

### Manual Update Check

```typescript
import { checkForUpdates, applyUpdate } from '@philjs/plugin-pwa';

async function handleCheckUpdate() {
  const hasUpdate = await checkForUpdates();

  if (hasUpdate) {
    const confirmed = confirm('Update available. Reload now?');
    if (confirmed) {
      await applyUpdate();
    }
  } else {
    console.log('App is up to date');
  }
}
```

### Update Events

```typescript
// Listen for update ready event
window.addEventListener('pwa-update-ready', (event) => {
  const { version, releaseNotes } = event.detail;
  console.log('Update ready:', version);
  console.log('Release notes:', releaseNotes);
});
```

## Background Sync

### Checking Support

```typescript
import { isBackgroundSyncSupported } from '@philjs/plugin-pwa';

if (isBackgroundSyncSupported()) {
  console.log('Background Sync is supported!');
} else {
  console.log('Background Sync not available');
}
```

### Registering Background Sync

```typescript
import { registerBackgroundSync, getSyncTags } from '@philjs/plugin-pwa';

// Register a sync task
await registerBackgroundSync('my-sync-task');

// Get all registered sync tags
const tags = await getSyncTags();
console.log('Registered sync tasks:', tags);
```

### Queuing Data for Sync

```typescript
import { queueForSync, isOnline } from '@philjs/plugin-pwa';

async function saveComment(comment: string) {
  const data = {
    comment,
    timestamp: Date.now(),
    userId: currentUser.id,
  };

  if (isOnline()) {
    await fetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } else {
    // Queue for background sync
    await queueForSync(data, 'comment-sync');
    console.log('Comment queued for sync');
  }
}
```

### Service Worker Sync Handler

The generated service worker includes background sync handling:

```typescript
const swCode = generateServiceWorker({
  backgroundSync: {
    enabled: true,
    queueName: 'comment-sync',
  },
});

// In the generated SW:
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'comment-sync') {
//     event.waitUntil(handleBackgroundSync());
//   }
// });
```

## Types Reference

```typescript
// Cache strategies
type CacheStrategy =
  | 'cache-first'
  | 'network-first'
  | 'cache-only'
  | 'network-only'
  | 'stale-while-revalidate';

// Cache rule configuration
interface CacheRule {
  pattern: RegExp | string;
  strategy: CacheStrategy;
  cacheName?: string;
  maxAge?: number;
  maxEntries?: number;
  networkTimeout?: number;
}

// Service worker configuration
interface ServiceWorkerConfig {
  fileName?: string;
  cachePrefix?: string;
  cacheVersion?: string;
  precache?: string[];
  runtimeCaching?: CacheRule[];
  skipWaiting?: boolean;
  clientsClaim?: boolean;
  navigationPreload?: boolean;
  offlineFallback?: string;
  backgroundSync?: {
    enabled: boolean;
    queueName?: string;
  };
}

// Manifest icon
interface ManifestIcon {
  src: string;
  sizes: string;
  type?: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

// Manifest screenshot
interface ManifestScreenshot {
  src: string;
  sizes: string;
  type?: string;
  form_factor?: 'narrow' | 'wide';
  label?: string;
}

// Web app manifest
interface WebAppManifest {
  name: string;
  short_name?: string;
  description?: string;
  start_url: string;
  display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  orientation?: 'any' | 'natural' | 'landscape' | 'portrait';
  theme_color?: string;
  background_color?: string;
  scope?: string;
  icons?: ManifestIcon[];
  screenshots?: ManifestScreenshot[];
  categories?: string[];
  share_target?: ShareTarget;
  shortcuts?: AppShortcut[];
  prefer_related_applications?: boolean;
  related_applications?: RelatedApplication[];
}

// Install prompt event
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Update check result
interface UpdateCheckResult {
  hasUpdate: boolean;
  version?: string;
  releaseNotes?: string;
}

// Full PWA configuration
interface PWAConfig {
  serviceWorker?: ServiceWorkerConfig;
  manifest?: WebAppManifest;
  installPrompt?: {
    enabled: boolean;
    deferredPrompt?: boolean;
    customUI?: boolean;
  };
  updateNotifications?: {
    enabled: boolean;
    checkInterval?: number;
    autoReload?: boolean;
  };
  offlineSupport?: {
    enabled: boolean;
    offlinePage?: string;
    offlineMessage?: string;
  };
}
```

## API Reference

### Service Worker

| Export | Description |
|--------|-------------|
| `generateServiceWorker(config)` | Generate service worker code |
| `registerServiceWorker(url, options)` | Register service worker |
| `unregisterServiceWorker()` | Unregister all service workers |
| `isServiceWorkerRegistered()` | Check if SW is registered |
| `skipWaitingAndReload()` | Force update and reload |
| `getServiceWorkerVersion()` | Get current SW version |

### Manifest

| Export | Description |
|--------|-------------|
| `generateManifest(config)` | Generate manifest object |
| `createManifestJSON(config)` | Generate manifest JSON string |
| `injectManifestLink(path)` | Get manifest link tag |
| `generatePWAMetaTags(config)` | Generate all PWA meta tags |

### Install

| Export | Description |
|--------|-------------|
| `canInstall` | Signal: whether install is available |
| `isInstalled` | Signal: whether app is installed |
| `initInstallPrompt()` | Setup install prompt handling |
| `showInstallPrompt()` | Show install prompt |
| `getInstallPrompt()` | Get deferred prompt event |
| `checkCanInstall()` | Check if can install |
| `checkIsInstalled()` | Check if installed |

### Offline

| Export | Description |
|--------|-------------|
| `isOnline` | Signal: online/offline status |
| `initOfflineDetection()` | Setup offline detection |
| `queueOfflineRequest(url, options)` | Queue request for sync |
| `isOfflinePageCached(page)` | Check if offline page cached |
| `prefetchOfflinePage(page)` | Prefetch offline page |

### Updates

| Export | Description |
|--------|-------------|
| `hasUpdate` | Signal: whether update available |
| `updateInfo` | Signal: update details |
| `initUpdateNotifications(options)` | Setup update notifications |
| `checkForUpdates()` | Manual update check |
| `applyUpdate()` | Apply update and reload |
| `dismissUpdate()` | Dismiss update notification |

### Cache Strategies

| Export | Description |
|--------|-------------|
| `createCacheRule(pattern, strategy, options)` | Create cache rule |
| `cacheRules.staticAssets()` | Rule for static assets |
| `cacheRules.apiResponses(path)` | Rule for API responses |
| `cacheRules.images()` | Rule for images |
| `cacheRules.fonts()` | Rule for fonts |
| `cacheRules.googleFonts()` | Rules for Google Fonts |
| `getDefaultCacheRules()` | Get all default rules |

### Background Sync

| Export | Description |
|--------|-------------|
| `isBackgroundSyncSupported()` | Check browser support |
| `registerBackgroundSync(tag)` | Register sync task |
| `getSyncTags()` | Get registered sync tags |
| `queueForSync(data, tag)` | Queue data for sync |

## Examples

### Complete PWA Setup

```typescript
// pwa.ts - PWA configuration module
import {
  generateServiceWorker,
  generateManifest,
  registerServiceWorker,
  initInstallPrompt,
  initOfflineDetection,
  initUpdateNotifications,
  cacheRules,
} from '@philjs/plugin-pwa';

// Export manifest for build process
export const manifest = generateManifest({
  name: 'My Awesome PWA',
  short_name: 'My PWA',
  description: 'An amazing progressive web app',
  start_url: '/',
  display: 'standalone',
  theme_color: '#667eea',
  background_color: '#ffffff',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'Dashboard', url: '/dashboard', icons: [{ src: '/icons/dashboard.png', sizes: '192x192' }] },
    { name: 'Settings', url: '/settings' },
  ],
});

// Export SW code for build process
export const serviceWorker = generateServiceWorker({
  cachePrefix: 'my-pwa',
  cacheVersion: 'v1.0.0',
  precache: [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
    '/offline.html',
  ],
  runtimeCaching: [
    cacheRules.staticAssets(),
    cacheRules.images(),
    cacheRules.fonts(),
    ...cacheRules.googleFonts(),
    {
      pattern: /\/api\//,
      strategy: 'network-first',
      networkTimeout: 5000,
      maxEntries: 100,
    },
  ],
  offlineFallback: '/offline.html',
  backgroundSync: {
    enabled: true,
    queueName: 'data-sync',
  },
});

// Runtime initialization
export function initPWA() {
  const cleanups: (() => void)[] = [];

  // Register service worker
  registerServiceWorker('/sw.js');

  // Setup features
  cleanups.push(initInstallPrompt());
  cleanups.push(initOfflineDetection());
  cleanups.push(initUpdateNotifications({
    checkInterval: 60 * 60 * 1000, // 1 hour
    autoCheck: true,
  }));

  // Return cleanup function
  return () => cleanups.forEach(fn => fn());
}
```

### Vite Plugin Integration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { writeFileSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    {
      name: 'pwa-generator',
      async buildEnd() {
        const { manifest, serviceWorker } = await import('./src/pwa');

        mkdirSync('dist', { recursive: true });
        writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));
        writeFileSync('dist/sw.js', serviceWorker);
      },
    },
  ],
});
```
