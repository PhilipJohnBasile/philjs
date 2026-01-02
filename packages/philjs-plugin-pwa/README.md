# @philjs/plugin-pwa

**Progressive Web App (PWA) plugin for PhilJS** - Turn your web app into a fully-featured PWA with service workers, offline support, install prompts, update notifications, and background sync.

## Features

- **Service Worker Generation**: Automatically generate optimized service workers with precaching and runtime caching
- **Cache Strategies**: Multiple caching strategies (cache-first, network-first, stale-while-revalidate, cache-only, network-only)
- **Web App Manifest**: Generate and configure your PWA manifest with icons, shortcuts, and share targets
- **Offline Support**: Automatic offline detection and offline page fallbacks
- **Install Prompts**: Handle native PWA install prompts and track installation status
- **Update Notifications**: Check for service worker updates and notify users with update available
- **Background Sync**: Queue requests to sync when connection is restored
- **Asset Management**: Configure icon sizes, screenshots, and app metadata
- **Meta Tags**: Automatic generation of PWA meta tags for cross-browser support
- **Type-Safe Configuration**: Full TypeScript support with complete type definitions
- **Development Tools**: Built-in utilities for testing PWA features locally

## Installation

```bash
npm install @philjs/plugin-pwa
# or
pnpm add @philjs/plugin-pwa
# or
yarn add @philjs/plugin-pwa
```

## Quick Start

### 1. Generate Service Worker

```typescript
import { generateServiceWorker } from '@philjs/plugin-pwa';
import { getDefaultCacheRules } from '@philjs/plugin-pwa';

// Generate service worker code
const swCode = generateServiceWorker({
  cacheVersion: 'v1',
  precache: [
    '/index.html',
    '/app.js',
    '/app.css',
  ],
  runtimeCaching: getDefaultCacheRules(),
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  offlineFallback: '/offline.html',
  backgroundSync: {
    enabled: true,
    queueName: 'api-queue',
  },
});

// Write to public/sw.js
fs.writeFileSync('public/sw.js', swCode);
```

### 2. Generate Web App Manifest

```typescript
import { generateManifest, injectManifestLink } from '@philjs/plugin-pwa';

const manifest = generateManifest({
  name: 'My Awesome App',
  short_name: 'MyApp',
  description: 'The most awesome app ever',
  start_url: '/',
  display: 'standalone',
  theme_color: '#667eea',
  background_color: '#ffffff',
  icons: [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-maskable-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
});

// Save manifest
fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));

// Add to your HTML
const manifestLink = injectManifestLink('/manifest.json');
```

### 3. Register Service Worker

```typescript
import {
  registerServiceWorker,
  initOfflineDetection,
  initInstallPrompt,
  initUpdateNotifications,
} from '@philjs/plugin-pwa';

// Register service worker
await registerServiceWorker('/sw.js');

// Initialize offline detection
const cleanupOffline = initOfflineDetection();

// Initialize install prompt handling
const cleanupInstall = initInstallPrompt();

// Initialize update checking
const cleanupUpdates = initUpdateNotifications({
  checkInterval: 60 * 60 * 1000, // 1 hour
  autoCheck: true,
});

// Cleanup on unmount
onCleanup(() => {
  cleanupOffline();
  cleanupInstall();
  cleanupUpdates();
});
```

## Core Concepts

### Service Worker Configuration

Configure how your service worker caches and serves content:

```typescript
import { generateServiceWorker } from '@philjs/plugin-pwa';

const swCode = generateServiceWorker({
  // Cache versioning
  cachePrefix: 'my-app',
  cacheVersion: 'v1',

  // Files to cache on install
  precache: [
    '/index.html',
    '/app.js',
    '/app.css',
    '/favicon.ico',
  ],

  // Runtime caching rules
  runtimeCaching: [
    {
      pattern: /\.js$/,
      strategy: 'cache-first',
      cacheName: 'js-cache',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxEntries: 50,
    },
    {
      pattern: /^https:\/\/api\.example\.com/,
      strategy: 'network-first',
      cacheName: 'api-cache',
      networkTimeout: 3000,
      maxEntries: 20,
    },
    {
      pattern: /\.(png|jpg|jpeg|gif|svg)$/,
      strategy: 'stale-while-revalidate',
      cacheName: 'image-cache',
      maxEntries: 100,
    },
  ],

  // Service worker behavior
  skipWaiting: true,           // Activate immediately
  clientsClaim: true,          // Take control of all clients
  navigationPreload: true,     // Enable navigation preload for faster loads
  offlineFallback: '/offline.html',

  // Background sync
  backgroundSync: {
    enabled: true,
    queueName: 'sync-queue',
  },
});
```

### Cache Strategies

Choose the right caching strategy for your content:

#### Cache-First
Best for static assets that rarely change:

```typescript
{
  pattern: /\.(js|css)$/,
  strategy: 'cache-first',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEntries: 50,
}
```

#### Network-First
Best for API responses and dynamic content:

```typescript
{
  pattern: /^\/api\//,
  strategy: 'network-first',
  networkTimeout: 3000,
  maxEntries: 20,
}
```

#### Stale-While-Revalidate
Best for images and content that can be slightly stale:

```typescript
{
  pattern: /\.(png|jpg|gif|svg)$/,
  strategy: 'stale-while-revalidate',
  maxEntries: 100,
}
```

#### Cache-Only
For content that's always available offline:

```typescript
{
  pattern: /^\/static\//,
  strategy: 'cache-only',
}
```

#### Network-Only
For content that must always be fresh:

```typescript
{
  pattern: /^\/live\//,
  strategy: 'network-only',
}
```

### Predefined Cache Rules

Use built-in cache rules for common scenarios:

```typescript
import { cacheRules, getDefaultCacheRules } from '@philjs/plugin-pwa';

// Get all default rules
const defaultRules = getDefaultCacheRules();

// Or use individual rules
const rules = [
  cacheRules.staticAssets(),     // .js, .css, images, fonts
  cacheRules.images(),           // Images with stale-while-revalidate
  cacheRules.fonts(),            // Font files (1-year cache)
  ...cacheRules.googleFonts(),   // Google Fonts stylesheets + webfonts
  cacheRules.apiResponses('/api'),
];
```

### Web App Manifest

Configure your PWA's appearance and behavior:

```typescript
import { generateManifest } from '@philjs/plugin-pwa';

const manifest = generateManifest({
  // Required
  name: 'My Application',
  short_name: 'MyApp',
  start_url: '/',

  // Display
  display: 'standalone',        // fullscreen, standalone, minimal-ui, browser
  orientation: 'portrait-primary',
  theme_color: '#667eea',
  background_color: '#ffffff',
  scope: '/',

  // Icons and branding
  icons: [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
  ],

  // Screenshots for app stores
  screenshots: [
    {
      src: '/screenshots/1.png',
      sizes: '540x720',
      type: 'image/png',
      form_factor: 'narrow',
    },
    {
      src: '/screenshots/2.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide',
    },
  ],

  // App store metadata
  categories: ['productivity', 'utilities'],

  // Share target
  share_target: {
    action: '/share',
    method: 'POST',
    enctype: 'multipart/form-data',
    params: {
      title: 'title',
      text: 'text',
      url: 'url',
      files: [
        {
          name: 'image',
          accept: ['image/png', 'image/jpeg'],
        },
      ],
    },
  },

  // App shortcuts
  shortcuts: [
    {
      name: 'New Note',
      url: '/new',
      icons: [
        {
          src: '/icons/new-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
      ],
    },
  ],
});
```

### Offline Support

Detect online/offline status and handle offline scenarios:

```typescript
import {
  isOnline,
  initOfflineDetection,
  queueOfflineRequest,
  prefetchOfflinePage,
} from '@philjs/plugin-pwa';

// Access current online status (signal)
console.log(isOnline()); // true or false

// React to online/offline changes
createEffect(() => {
  if (isOnline()) {
    console.log('Back online!');
  } else {
    console.log('App is offline');
  }
});

// Initialize offline detection
const cleanup = initOfflineDetection();

// Queue a request to be synced when online
await queueOfflineRequest('/api/data', {
  method: 'POST',
  body: JSON.stringify({ /* data */ }),
});

// Prefetch offline page
await prefetchOfflinePage('/offline.html');

// Don't forget to cleanup
cleanup();
```

### Install Prompts

Handle native PWA installation:

```typescript
import {
  canInstall,
  isInstalled,
  initInstallPrompt,
  showInstallPrompt,
} from '@philjs/plugin-pwa';

// Initialize install prompt handling
const cleanup = initInstallPrompt();

// Check if app is installable
createEffect(() => {
  if (canInstall()) {
    console.log('App can be installed');
    // Show your custom install button
  }
});

// Check if already installed
createEffect(() => {
  if (isInstalled()) {
    console.log('App is installed');
  }
});

// Show install prompt
async function handleInstallClick() {
  const outcome = await showInstallPrompt();
  if (outcome === 'accepted') {
    console.log('User accepted installation');
  } else if (outcome === 'dismissed') {
    console.log('User dismissed installation');
  }
}

// Listen for app installed event
window.addEventListener('pwa-installed', () => {
  console.log('App was installed');
  // Hide install button, show message, etc.
});

cleanup();
```

### Update Notifications

Detect and apply service worker updates:

```typescript
import {
  hasUpdate,
  updateInfo,
  initUpdateNotifications,
  checkForUpdates,
  applyUpdate,
  dismissUpdate,
} from '@philjs/plugin-pwa';

// Initialize automatic update checking
const cleanup = initUpdateNotifications({
  checkInterval: 60 * 60 * 1000, // 1 hour
  autoCheck: true,
});

// React to update availability
createEffect(() => {
  if (hasUpdate()) {
    console.log('Update available!');
    const info = updateInfo();
    console.log('Version:', info?.version);
    console.log('Release notes:', info?.releaseNotes);
  }
});

// Show update prompt
function UpdatePrompt() {
  return createShow(
    () => hasUpdate(),
    () => (
      <div>
        <h2>Update Available</h2>
        <p>A new version is ready!</p>
        <button onClick={() => applyUpdate()}>
          Update Now
        </button>
        <button onClick={() => dismissUpdate()}>
          Later
        </button>
      </div>
    )
  );
}

// Manually check for updates
async function handleCheckUpdates() {
  const found = await checkForUpdates();
  if (found) {
    console.log('Updates available');
  }
}

cleanup();
```

### Background Sync

Queue and sync data when the connection is restored:

```typescript
import {
  isBackgroundSyncSupported,
  registerBackgroundSync,
  queueForSync,
  getSyncTags,
} from '@philjs/plugin-pwa';

// Check support
if (isBackgroundSyncSupported()) {
  console.log('Background Sync supported');
}

// Queue data for sync
async function saveOffline(data: any) {
  try {
    await queueForSync(data, 'notes-sync');
  } catch (error) {
    console.error('Failed to queue sync:', error);
  }
}

// Register background sync tag
async function registerSync() {
  try {
    await registerBackgroundSync('notes-sync');
    console.log('Background sync registered');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Get all registered sync tags
async function getActiveSyncs() {
  const tags = await getSyncTags();
  console.log('Active syncs:', tags);
}
```

## Complete Example

Here's a complete PWA setup example:

### Build Script

```typescript
// build.ts
import { writeFileSync } from 'fs';
import {
  generateServiceWorker,
  generateManifest,
  generatePWAMetaTags,
  getDefaultCacheRules,
  cacheRules,
} from '@philjs/plugin-pwa';

// Generate service worker
const swCode = generateServiceWorker({
  cachePrefix: 'my-app',
  cacheVersion: 'v1.0.0',
  precache: [
    '/index.html',
    '/app.js',
    '/app.css',
  ],
  runtimeCaching: [
    cacheRules.staticAssets(),
    cacheRules.images(),
    cacheRules.fonts(),
    ...cacheRules.googleFonts(),
    cacheRules.apiResponses('/api'),
  ],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  offlineFallback: '/offline.html',
  backgroundSync: {
    enabled: true,
    queueName: 'api-queue',
  },
});

writeFileSync('public/sw.js', swCode);

// Generate manifest
const manifest = generateManifest({
  name: 'My Awesome App',
  short_name: 'MyApp',
  description: 'The most awesome app ever',
  start_url: '/',
  display: 'standalone',
  theme_color: '#667eea',
  background_color: '#ffffff',
  icons: [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-maskable-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  screenshots: [
    {
      src: '/screenshots/narrow-1.png',
      sizes: '540x720',
      type: 'image/png',
      form_factor: 'narrow',
    },
  ],
  shortcuts: [
    {
      name: 'New Task',
      short_name: 'New',
      url: '/new',
      icons: [
        {
          src: '/icons/new-192.png',
          sizes: '192x192',
        },
      ],
    },
  ],
});

writeFileSync(
  'public/manifest.json',
  JSON.stringify(manifest, null, 2)
);

// Generate meta tags
const metaTags = generatePWAMetaTags({
  name: 'My Awesome App',
  short_name: 'MyApp',
  icons: manifest.icons,
});

console.log('PWA files generated successfully');
```

### HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- PWA Meta Tags -->
    <meta name="application-name" content="My Awesome App">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="MyApp">
    <meta name="description" content="The most awesome app ever">
    <meta name="format-detection" content="telephone=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#667eea">

    <!-- App Icons -->
    <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png">
    <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png">

    <!-- Web App Manifest -->
    <link rel="manifest" href="/manifest.json">

    <title>My Awesome App</title>
    <link rel="stylesheet" href="/app.css">
  </head>
  <body>
    <div id="root"></div>
    <script src="/app.js"></script>
  </body>
</html>
```

### App Component

```typescript
// App.tsx
import { createEffect, onCleanup } from '@philjs/core';
import {
  registerServiceWorker,
  initOfflineDetection,
  initInstallPrompt,
  initUpdateNotifications,
  canInstall,
  isOnline,
  hasUpdate,
  showInstallPrompt,
  applyUpdate,
  dismissUpdate,
} from '@philjs/plugin-pwa';

export default function App() {
  createEffect(async () => {
    // Register service worker
    await registerServiceWorker('/sw.js');

    // Initialize features
    const cleanups = [
      initOfflineDetection(),
      initInstallPrompt(),
      initUpdateNotifications({
        checkInterval: 60 * 60 * 1000,
      }),
    ];

    onCleanup(() => cleanups.forEach(c => c()));
  });

  return (
    <>
      <MainApp />

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Update Notification */}
      <UpdateNotification />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </>
  );
}

function InstallPrompt() {
  return createShow(
    () => canInstall(),
    () => (
      <div style="position: fixed; bottom: 20px; right: 20px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
        <h3>Install App</h3>
        <p>Install this app on your device for quick access</p>
        <button onClick={() => showInstallPrompt()}>Install</button>
      </div>
    )
  );
}

function UpdateNotification() {
  return createShow(
    () => hasUpdate(),
    () => (
      <div style="position: fixed; top: 20px; right: 20px; padding: 20px; background: #667eea; color: white; border-radius: 8px;">
        <h3>Update Available</h3>
        <p>A new version is ready to use</p>
        <button onClick={() => applyUpdate()}>Update Now</button>
        <button onClick={() => dismissUpdate()}>Later</button>
      </div>
    )
  );
}

function OfflineIndicator() {
  return createShow(
    () => !isOnline(),
    () => (
      <div style="position: fixed; top: 0; left: 0; right: 0; padding: 10px; background: #ff6b6b; color: white; text-align: center;">
        You are currently offline. Some features may be limited.
      </div>
    )
  );
}
```

## API Reference

### Service Worker

- `generateServiceWorker(config)` - Generate service worker code
- `registerServiceWorker(scriptURL, options)` - Register service worker
- `unregisterServiceWorker()` - Unregister all service workers
- `isServiceWorkerRegistered()` - Check if service worker is registered
- `skipWaitingAndReload()` - Skip waiting and reload to new version
- `getServiceWorkerVersion()` - Get active service worker version

### Manifest

- `generateManifest(config)` - Generate manifest object
- `createManifestJSON(config)` - Create manifest JSON string
- `injectManifestLink(path)` - Generate manifest link HTML
- `generatePWAMetaTags(config)` - Generate PWA meta tags

### Offline Support

- `isOnline` - Signal for online/offline status
- `initOfflineDetection()` - Initialize offline detection
- `queueOfflineRequest(url, options)` - Queue request for offline sync
- `isOfflinePageCached(page)` - Check if offline page is cached
- `prefetchOfflinePage(page)` - Prefetch offline page

### Install Prompts

- `canInstall` - Signal for install availability
- `isInstalled` - Signal for installation status
- `initInstallPrompt()` - Initialize install prompt
- `showInstallPrompt()` - Show install prompt
- `getInstallPrompt()` - Get deferred install prompt
- `checkCanInstall()` - Check if app can be installed
- `checkIsInstalled()` - Check if app is installed

### Updates

- `hasUpdate` - Signal for update availability
- `updateInfo` - Signal with update information
- `initUpdateNotifications(options)` - Initialize update checking
- `checkForUpdates()` - Check for service worker updates
- `applyUpdate()` - Apply pending update
- `dismissUpdate()` - Dismiss update notification

### Background Sync

- `isBackgroundSyncSupported()` - Check Background Sync support
- `registerBackgroundSync(tag, options)` - Register sync tag
- `getSyncTags()` - Get registered sync tags
- `queueForSync(data, tag)` - Queue data for sync

### Cache Strategies

- `createCacheRule(pattern, strategy, options)` - Create cache rule
- `cacheRules` - Predefined cache rules
- `getDefaultCacheRules()` - Get all default rules

## Best Practices

### 1. Progressive Enhancement

Always provide fallbacks for features that might not be supported:

```typescript
import {
  registerServiceWorker,
  isBackgroundSyncSupported,
} from '@philjs/plugin-pwa';

// Service Worker
if ('serviceWorker' in navigator) {
  await registerServiceWorker('/sw.js');
}

// Background Sync (optional feature)
if (isBackgroundSyncSupported()) {
  await registerBackgroundSync('sync-tag');
}
```

### 2. Cache Versioning

Always update your cache version when assets change:

```typescript
const swCode = generateServiceWorker({
  cacheVersion: 'v1.2.3', // Update when assets change
  precache: ['/index.html', '/app.js'],
});
```

### 3. Update Notifications

Inform users about updates but respect their choice:

```typescript
// Don't force updates immediately
const cleanup = initUpdateNotifications({
  autoCheck: true,
  checkInterval: 60 * 60 * 1000, // Check every hour
});

// Show notification and let user decide
createEffect(() => {
  if (hasUpdate()) {
    // Show UI prompt, don't auto-apply
  }
});
```

### 4. Offline Experience

Always provide an offline page and queue important requests:

```typescript
// Precache offline page
const swCode = generateServiceWorker({
  precache: ['/offline.html'],
  offlineFallback: '/offline.html',
});

// Queue API requests when offline
if (!isOnline()) {
  await queueOfflineRequest('/api/save', { method: 'POST' });
}
```

### 5. Icon Management

Provide icons in multiple sizes and formats:

```typescript
const manifest = generateManifest({
  icons: [
    // 192x192 for Android
    { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
    // 512x512 for splash screen
    { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
    // Maskable icons for adaptive icons
    {
      src: '/icons/maskable-192.png',
      sizes: '192x192',
      purpose: 'maskable'
    },
  ],
});
```

## Testing in Development

### 1. Chrome DevTools

Open DevTools and check:
- **Application > Manifest** - See manifest configuration
- **Application > Service Workers** - Check service worker status
- **Application > Cache Storage** - Inspect cached files

### 2. Lighthouse

Run Lighthouse audit in Chrome:
1. Open DevTools
2. Click "Lighthouse"
3. Check "PWA" category
4. Run audit

### 3. Offline Testing

Simulate offline mode:
1. Open DevTools
2. Go to "Network" tab
3. Check "Offline" checkbox
4. Reload page

### 4. Local HTTPS

PWA features require HTTPS (except localhost):

```bash
# Using mkcert for local HTTPS
mkcert -install
mkcert localhost 127.0.0.1 ::1

# Then use with your dev server
vite --https --cert localhost.pem --key localhost-key.pem
```

## Production Deployment

### 1. Generate Assets

```typescript
// build.ts
import { generateServiceWorker, generateManifest } from '@philjs/plugin-pwa';
import { writeFileSync } from 'fs';

// Generate with production cache version
const version = process.env.VERSION || '1.0.0';

const swCode = generateServiceWorker({
  cacheVersion: `v${version}`,
  precache: [/* bundled files */],
  runtimeCaching: [/* rules */],
});

writeFileSync('dist/sw.js', swCode);

const manifest = generateManifest({
  name: 'My App',
  start_url: '/',
  icons: [/* icons */],
});

writeFileSync('dist/manifest.json', JSON.stringify(manifest));
```

### 2. Add Headers (Nginx)

```nginx
# Serve service worker with no cache
location = /sw.js {
  add_header Cache-Control "public, max-age=0, must-revalidate";
  add_header Service-Worker-Allowed "/";
}

# Serve manifest with short cache
location = /manifest.json {
  add_header Cache-Control "public, max-age=3600";
}

# Long cache for assets
location ~* \.(js|css|png|jpg|gif|svg|woff|woff2)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

### 3. Monitor Updates

Track update adoption:

```typescript
// Track when users apply updates
window.addEventListener('pwa-update-ready', () => {
  // Send telemetry event
  fetch('/api/telemetry/pwa-update', {
    method: 'POST',
    body: JSON.stringify({ event: 'update-available' }),
  });
});

// Track installations
window.addEventListener('pwa-installed', () => {
  fetch('/api/telemetry/pwa-install', {
    method: 'POST',
    body: JSON.stringify({ event: 'app-installed' }),
  });
});
```

## Troubleshooting

### Service Worker Not Registering

1. Check HTTPS/localhost requirement
2. Verify service worker script URL is correct
3. Check browser console for errors
4. Verify service worker file exists and is accessible

```typescript
const registration = await registerServiceWorker('/sw.js');
if (!registration) {
  console.error('Service worker registration failed');
}
```

### Cache Not Working

1. Check cache names don't conflict
2. Verify cache version is updated
3. Inspect cache in DevTools > Application > Cache Storage
4. Clear old caches manually

```typescript
// Clear all caches
navigator.serviceWorker.getRegistration().then(reg => {
  reg.active.postMessage({ type: 'CLEAR_CACHE' });
});
```

### Updates Not Detected

1. Ensure service worker file has changed
2. Check update check interval isn't too long
3. Verify service worker activation
4. Check DevTools for `pwa-update-available` event

```typescript
// Force update check
await checkForUpdates();
console.log('Has update:', hasUpdate());
```

### Offline Page Not Showing

1. Ensure offline page is in precache
2. Verify offlineFallback path is correct
3. Check network conditions in DevTools
4. Ensure offline page is valid HTML

```typescript
const swCode = generateServiceWorker({
  precache: ['/offline.html'],
  offlineFallback: '/offline.html',
});
```

### Install Prompt Not Appearing

1. Ensure manifest.json is valid
2. Check PWA requirements (HTTPS, icons, manifest)
3. Verify beforeinstallprompt event fires
4. App must meet PWA installability criteria

```typescript
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt available');
  // Event fires when app is installable
});
```

## Related Documentation

- [Web App Manifest Spec](https://w3c.github.io/manifest/)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Web App Install Banners](https://developer.chrome.com/docs/web-platform/app-installation-prompt/)
- [PWA on iOS](https://webkit.org/status/#specification-web-app-manifest)
- [Background Sync](https://developer.chrome.com/docs/web-platform/background-sync/)

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-plugin-pwa/src/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: (none detected)
- Re-exported modules: ./background-sync.js, ./cache-strategies.js, ./install.js, ./manifest.js, ./offline.js, ./service-worker.js, ./types.js, ./updates.js
<!-- API_SNAPSHOT_END -->

## License

MIT
