# Progressive Web Apps (PWA)

Turn a PhilJS app into an installable, offline-capable experience with service workers, a web app manifest, and update handling.

## What You'll Learn

- PWA essentials (manifest, service worker, installability)
- Using `@philjs/plugin-pwa` to generate assets
- Offline fallbacks and cache strategies
- Update notifications and install prompts

## Overview

A PWA combines a web app with native-like capabilities: offline support, home screen installation, and background updates. PhilJS provides a PWA plugin that generates the manifest and service worker code, plus helpers for runtime behavior.

## Setup with @philjs/plugin-pwa

### 1) Generate a Service Worker

```ts
import { generateServiceWorker, getDefaultCacheRules } from '@philjs/plugin-pwa';
import fs from 'node:fs';

const swCode = generateServiceWorker({
  cacheVersion: 'v1',
  precache: ['/index.html', '/assets/app.js', '/assets/app.css'],
  runtimeCaching: getDefaultCacheRules(),
  skipWaiting: true,
  clientsClaim: true,
  offlineFallback: '/offline.html',
});

// scripts/build-sw.ts generates the output file
fs.writeFileSync('public/sw.js', swCode);
```

### 2) Generate a Manifest

```ts
import { generateManifest } from '@philjs/plugin-pwa';
import fs from 'node:fs';

const manifest = generateManifest({
  name: 'PhilJS Storefront',
  short_name: 'Storefront',
  description: 'Fast commerce powered by PhilJS',
  start_url: '/',
  display: 'standalone',
  theme_color: '#111827',
  background_color: '#ffffff',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
});

fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
```

### 3) Register the Service Worker

```ts
import {
  registerServiceWorker,
  initOfflineDetection,
  initInstallPrompt,
  initUpdateNotifications,
} from '@philjs/plugin-pwa';

await registerServiceWorker('/sw.js');

const cleanupOffline = initOfflineDetection();
const cleanupInstall = initInstallPrompt();
const cleanupUpdates = initUpdateNotifications({
  checkInterval: 60 * 60 * 1000,
  autoCheck: true,
});

// Call cleanup functions on unmount if needed.
```

## Offline Fallbacks

Provide an offline route or static page so navigation failures remain helpful.

```html
<!-- public/offline.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Offline</title>
  </head>
  <body>
    <h1>You are offline</h1>
    <p>Check your connection and try again.</p>
  </body>
</html>
```

## Caching Strategies

Start with the defaults and tighten them for production.

```ts
import { generateServiceWorker } from '@philjs/plugin-pwa';

const swCode = generateServiceWorker({
  cacheVersion: 'v2',
  precache: ['/index.html', '/assets/app.js'],
  runtimeCaching: [
    { pattern: /\.js$/, strategy: 'cache-first', cacheName: 'js-cache' },
    { pattern: /\.(png|jpg|jpeg|svg)$/, strategy: 'stale-while-revalidate', cacheName: 'img-cache' },
    { pattern: /^https:\/\/api\.example\.com/, strategy: 'network-first', cacheName: 'api-cache' },
  ],
});
```

## Best Practices

- Precache only critical assets to keep install fast.
- Version caches and use update prompts instead of silent swaps.
- Keep offline fallbacks simple and local to avoid infinite retries.
- Test with DevTools and real devices; service workers are stateful.

## Related Topics

- [Service Workers](./service-workers.md)
- [Performance Budgets](../performance/performance-budgets.md)
- [Deployment Overview](../deployment/overview.md)
- [Security Checklist](../security/checklist.md)


