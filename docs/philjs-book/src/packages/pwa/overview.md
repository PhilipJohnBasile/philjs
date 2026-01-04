# @philjs/pwa - Complete Reference

Zero-config Progressive Web App generation for PhilJS applications. **NO OTHER FRAMEWORK provides zero-config PWA with all features** - automatic service worker generation, manifest handling, install prompts, push notifications, background sync, and more.

## Installation

```bash
npm install @philjs/pwa
# or
pnpm add @philjs/pwa
# or
bun add @philjs/pwa
```

## Features

| Feature | Description |
|---------|-------------|
| **Automatic Service Worker** | Zero-config SW generation with caching strategies |
| **Web App Manifest** | Auto-generate and inject PWA manifests |
| **Install Prompts** | Handle A2HS (Add to Home Screen) with reactive state |
| **Push Notifications** | Full push notification support with actions |
| **Background Sync** | Queue operations for when connectivity returns |
| **Periodic Sync** | Schedule periodic background tasks |
| **Share Target API** | Receive shared content from other apps |
| **File Handling API** | Handle file associations |
| **App Shortcuts** | Quick actions from app icon |
| **Badging API** | Display notification badges on app icon |

## Quick Start

```typescript
import { PWAManager, pwaPlugin, usePWA } from '@philjs/pwa';

// Create PWA manager
const pwa = new PWAManager({
  name: 'My Awesome App',
  shortName: 'MyApp',
  description: 'A progressive web application built with PhilJS',
  themeColor: '#667eea',
  backgroundColor: '#ffffff',
  display: 'standalone',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
});

// Initialize PWA
await pwa.init();

// Use in components
function App() {
  const { state, install, showNotification } = usePWA({
    name: 'My App',
    themeColor: '#667eea',
  });

  return (
    <div>
      {state.installable && (
        <button onClick={install}>Install App</button>
      )}
      {!state.online && <p>You are offline</p>}
    </div>
  );
}
```

## Architecture

```
@philjs/pwa
├── ManifestGenerator
│   ├── generate()         - Create manifest object
│   ├── toJSON()           - Generate JSON string
│   ├── inject()           - Inject into document
│   └── addIOSMeta()       - iOS-specific meta tags
│
├── ServiceWorkerGenerator
│   ├── generate()         - Generate SW code
│   ├── register()         - Register service worker
│   └── Cache Strategies
│       ├── cache-first
│       ├── network-first
│       ├── stale-while-revalidate
│       ├── cache-only
│       └── network-only
│
├── PWAManager
│   ├── init()             - Initialize PWA
│   ├── install()          - Trigger install prompt
│   ├── update()           - Apply SW update
│   ├── Push Notifications
│   ├── Background Sync
│   ├── Periodic Sync
│   └── Badging API
│
├── Hooks
│   ├── usePWA()           - Full PWA functionality
│   ├── useInstallPrompt() - Install prompt handling
│   └── useOnlineStatus()  - Online/offline detection
│
└── Vite Plugin
    └── pwaPlugin()        - Build-time integration
```

---

## PWAConfig - Configuration Options

The `PWAConfig` interface provides comprehensive configuration for your PWA:

```typescript
interface PWAConfig {
  // App identity
  name: string;                    // Full app name
  shortName?: string;              // Short name (max 12 chars)
  description?: string;            // App description
  startUrl?: string;               // Start URL (default: '/')

  // Display options
  display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  orientation?: 'any' | 'portrait' | 'landscape';
  themeColor?: string;             // Theme color for browser UI
  backgroundColor?: string;        // Background color for splash screen

  // Visual assets
  icons?: PWAIcon[];               // App icons
  screenshots?: PWAScreenshot[];   // Screenshots for app stores
  shortcuts?: PWAShortcut[];       // App shortcuts
  categories?: string[];           // App categories

  // Advanced features
  shareTarget?: PWAShareTarget;    // Web Share Target configuration
  fileHandlers?: PWAFileHandler[]; // File handling configuration

  // Service worker options
  cacheStrategies?: CacheStrategy[]; // Caching rules
  offlinePages?: string[];         // Pages to cache for offline
  skipWaiting?: boolean;           // Skip waiting on install
  clientsClaim?: boolean;          // Claim clients on activate
}
```

### Icon Configuration

```typescript
interface PWAIcon {
  src: string;          // Icon path
  sizes: string;        // Size (e.g., '192x192')
  type?: string;        // MIME type (e.g., 'image/png')
  purpose?: 'any' | 'maskable' | 'monochrome';
}

// Example
const icons: PWAIcon[] = [
  { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
  { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
  { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
  { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
  { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
  { src: '/icons/maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];
```

### Screenshot Configuration

```typescript
interface PWAScreenshot {
  src: string;                        // Screenshot path
  sizes: string;                      // Dimensions
  type?: string;                      // MIME type
  form_factor?: 'narrow' | 'wide';    // Device form factor
  label?: string;                     // Screenshot description
}

// Example
const screenshots: PWAScreenshot[] = [
  {
    src: '/screenshots/desktop.png',
    sizes: '1920x1080',
    type: 'image/png',
    form_factor: 'wide',
    label: 'Desktop dashboard view',
  },
  {
    src: '/screenshots/mobile.png',
    sizes: '750x1334',
    type: 'image/png',
    form_factor: 'narrow',
    label: 'Mobile view',
  },
];
```

### App Shortcuts

```typescript
interface PWAShortcut {
  name: string;           // Shortcut name
  shortName?: string;     // Short name
  description?: string;   // Shortcut description
  url: string;            // Target URL
  icons?: PWAIcon[];      // Shortcut icons
}

// Example
const shortcuts: PWAShortcut[] = [
  {
    name: 'New Document',
    shortName: 'New',
    description: 'Create a new document',
    url: '/new',
    icons: [{ src: '/icons/new-doc.png', sizes: '192x192' }],
  },
  {
    name: 'Search',
    url: '/search',
    icons: [{ src: '/icons/search.png', sizes: '192x192' }],
  },
  {
    name: 'Settings',
    url: '/settings',
  },
];
```

### Share Target Configuration

```typescript
interface PWAShareTarget {
  action: string;            // URL to handle shares
  method?: 'GET' | 'POST';   // HTTP method
  enctype?: string;          // Encoding type for POST
  params: {
    title?: string;          // Title parameter name
    text?: string;           // Text parameter name
    url?: string;            // URL parameter name
    files?: Array<{
      name: string;          // Form field name
      accept: string[];      // Accepted MIME types
    }>;
  };
}

// Example - Text sharing
const shareTarget: PWAShareTarget = {
  action: '/share',
  method: 'GET',
  params: {
    title: 'title',
    text: 'text',
    url: 'url',
  },
};

// Example - File sharing
const fileShareTarget: PWAShareTarget = {
  action: '/share-file',
  method: 'POST',
  enctype: 'multipart/form-data',
  params: {
    title: 'title',
    text: 'text',
    files: [
      { name: 'images', accept: ['image/*'] },
      { name: 'documents', accept: ['application/pdf', '.docx'] },
    ],
  },
};
```

### File Handlers Configuration

```typescript
interface PWAFileHandler {
  action: string;                      // URL to handle files
  accept: Record<string, string[]>;    // MIME types to extensions mapping
  icons?: PWAIcon[];                   // Handler icons
  launchType?: 'single-client' | 'multiple-clients';
}

// Example
const fileHandlers: PWAFileHandler[] = [
  {
    action: '/open-document',
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
    },
    icons: [{ src: '/icons/document.png', sizes: '192x192' }],
    launchType: 'single-client',
  },
  {
    action: '/open-image',
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
  },
];
```

---

## ManifestGenerator

The `ManifestGenerator` class creates and injects Web App Manifest files.

### Creating a Manifest

```typescript
import { ManifestGenerator } from '@philjs/pwa';

const generator = new ManifestGenerator({
  name: 'My Progressive Web App',
  shortName: 'My PWA',
  description: 'An amazing app built with PhilJS',
  startUrl: '/',
  display: 'standalone',
  orientation: 'any',
  themeColor: '#667eea',
  backgroundColor: '#ffffff',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/maskable.png', sizes: '512x512', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Settings', url: '/settings' },
  ],
});
```

### Generating the Manifest Object

```typescript
// Get manifest as object
const manifest = generator.generate();

console.log(manifest);
// {
//   name: 'My Progressive Web App',
//   short_name: 'My PWA',
//   description: 'An amazing app built with PhilJS',
//   start_url: '/',
//   display: 'standalone',
//   orientation: 'any',
//   theme_color: '#667eea',
//   background_color: '#ffffff',
//   icons: [...],
//   shortcuts: [...]
// }
```

### Generating JSON

```typescript
// Get manifest as JSON string
const json = generator.toJSON();

// Write to file (at build time)
import { writeFileSync } from 'fs';
writeFileSync('dist/manifest.json', json);
```

### Injecting into Document

```typescript
// Inject manifest link and meta tags into document head
generator.inject();

// This automatically:
// 1. Creates a blob URL for the manifest
// 2. Adds <link rel="manifest" href="...">
// 3. Adds <meta name="theme-color" content="...">
// 4. Adds iOS-specific meta tags:
//    - apple-mobile-web-app-capable
//    - apple-mobile-web-app-status-bar-style
//    - apple-mobile-web-app-title
//    - apple-touch-icon
```

### Default Icons

If no icons are provided, the generator creates default icon references:

```typescript
const generator = new ManifestGenerator({
  name: 'My App',
});

const manifest = generator.generate();
console.log(manifest.icons);
// [
//   { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
//   { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
//   { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
//   { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
//   { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
//   { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
//   { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
//   { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
// ]
```

---

## ServiceWorkerGenerator

The `ServiceWorkerGenerator` class creates service workers with configurable caching strategies.

### Creating a Service Worker

```typescript
import { ServiceWorkerGenerator } from '@philjs/pwa';

const generator = new ServiceWorkerGenerator({
  name: 'My App',
  shortName: 'myapp',
  skipWaiting: true,
  clientsClaim: true,
  offlinePages: ['/offline.html', '/'],
  cacheStrategies: [
    {
      urlPattern: '/api/',
      strategy: 'network-first',
      cacheName: 'api-cache',
      maxAge: 5 * 60 * 1000, // 5 minutes
    },
    {
      urlPattern: /\.(js|css)$/,
      strategy: 'cache-first',
      cacheName: 'static-cache',
    },
    {
      urlPattern: /\.(png|jpg|jpeg|gif|svg|webp)$/,
      strategy: 'stale-while-revalidate',
      cacheName: 'image-cache',
      maxEntries: 100,
    },
  ],
});
```

### Cache Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `cache-first` | Try cache first, fall back to network | Static assets, images |
| `network-first` | Try network first, fall back to cache | API requests, dynamic content |
| `stale-while-revalidate` | Return cache immediately, update in background | Frequently updated content |
| `cache-only` | Only use cache, never network | Offline-only content |
| `network-only` | Only use network, never cache | Real-time data, auth requests |

### Cache Strategy Configuration

```typescript
interface CacheStrategy {
  urlPattern: string | RegExp;  // Pattern to match URLs
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only';
  cacheName?: string;           // Custom cache name
  maxAge?: number;              // Max age in milliseconds
  maxEntries?: number;          // Max cache entries
}
```

### Generating Service Worker Code

```typescript
// Generate service worker code as string
const swCode = generator.generate();

// Write to file at build time
import { writeFileSync } from 'fs';
writeFileSync('dist/sw.js', swCode);
```

### Generated Service Worker Features

The generated service worker includes:

1. **Install Event** - Precaches offline pages
2. **Activate Event** - Cleans up old caches
3. **Fetch Event** - Applies caching strategies
4. **Push Event** - Handles push notifications
5. **Notification Click** - Handles notification actions
6. **Background Sync** - Processes queued operations
7. **Periodic Sync** - Handles scheduled tasks
8. **Message Event** - Communicates with clients

### Registering the Service Worker

```typescript
// Register service worker at runtime
const registration = await generator.register();

if (registration) {
  console.log('Service Worker registered:', registration.scope);
}
```

### Example Generated Service Worker

```javascript
// Generated by @philjs/pwa
const CACHE_NAME = 'myapp-v1';
const OFFLINE_PAGES = ['/offline.html', '/'];

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_PAGES);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  self.clients.claim();

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

// Fetch event with strategy matching
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Match URL against configured strategies
  // Apply appropriate caching strategy
  // ...
});

// Push notifications
self.addEventListener('push', (event) => {
  // Display notification
});

// Background sync
self.addEventListener('sync', (event) => {
  // Handle sync event
});
```

---

## PWAManager

The `PWAManager` class provides complete PWA lifecycle management.

### Creating a PWA Manager

```typescript
import { PWAManager } from '@philjs/pwa';

const pwa = new PWAManager({
  name: 'My Application',
  shortName: 'MyApp',
  description: 'A fantastic progressive web app',
  themeColor: '#667eea',
  backgroundColor: '#ffffff',
  display: 'standalone',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192' },
    { src: '/icons/icon-512.png', sizes: '512x512' },
  ],
  cacheStrategies: [
    { urlPattern: '/api/', strategy: 'network-first' },
    { urlPattern: /\.(js|css)$/, strategy: 'cache-first' },
  ],
  offlinePages: ['/offline.html'],
  skipWaiting: true,
  clientsClaim: true,
});
```

### Initialization

```typescript
// Initialize PWA (injects manifest, registers service worker)
await pwa.init();
```

### PWA State

```typescript
interface PWAState {
  installed: boolean;      // App is installed
  installable: boolean;    // Install prompt available
  updateAvailable: boolean; // SW update available
  online: boolean;         // Network connectivity
  pushEnabled: boolean;    // Push notifications enabled
}

// Get current state
const state = pwa.getState();

console.log(state.installed);     // false
console.log(state.installable);   // true
console.log(state.online);        // true
```

### Installation

```typescript
// Trigger install prompt
const installed = await pwa.install();

if (installed) {
  console.log('App installed successfully!');
} else {
  console.log('User dismissed install prompt');
}
```

### Updates

```typescript
// Apply pending service worker update
await pwa.update();
// Page will reload with new SW
```

### Event Listening

```typescript
// Listen for PWA events
const unsubscribe = pwa.on('installable', (isInstallable) => {
  console.log('Install available:', isInstallable);
});

pwa.on('installed', () => {
  console.log('App was installed!');
});

pwa.on('updateAvailable', () => {
  console.log('Update available!');
});

pwa.on('online', (isOnline) => {
  console.log('Online status:', isOnline);
});

pwa.on('backgroundSync', (tag) => {
  console.log('Background sync completed:', tag);
});

pwa.on('periodicSync', (tag) => {
  console.log('Periodic sync triggered:', tag);
});

// Cleanup
unsubscribe();
```

### Push Notifications

```typescript
// Request notification permission
const granted = await pwa.requestNotificationPermission();

if (granted) {
  // Subscribe to push notifications
  const subscription = await pwa.subscribeToPush('YOUR_VAPID_PUBLIC_KEY');

  if (subscription) {
    // Send subscription to your server
    await fetch('/api/push-subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  }
}

// Show a notification
await pwa.showNotification({
  title: 'New Message',
  body: 'You have a new message from John',
  icon: '/icons/notification.png',
  badge: '/icons/badge.png',
  tag: 'message',
  renotify: true,
  requireInteraction: false,
  data: {
    url: '/messages/123',
  },
  actions: [
    { action: 'view', title: 'View' },
    { action: 'dismiss', title: 'Dismiss' },
  ],
});
```

### Notification Options

```typescript
interface NotificationOptions {
  title: string;              // Notification title
  body?: string;              // Notification body text
  icon?: string;              // Icon URL
  badge?: string;             // Badge icon URL
  tag?: string;               // Notification tag (for grouping)
  renotify?: boolean;         // Alert again if tag exists
  requireInteraction?: boolean; // Stay visible until interacted
  silent?: boolean;           // Suppress sound/vibration
  data?: any;                 // Custom data for actions
  actions?: Array<{
    action: string;           // Action identifier
    title: string;            // Action button text
    icon?: string;            // Action button icon
  }>;
}
```

### Badging API

```typescript
// Set app badge count
await pwa.setBadge(5);  // Shows "5" badge on app icon

// Clear badge
await pwa.setBadge(0);  // or
await pwa.setBadge();   // Clears the badge
```

### Background Sync

```typescript
// Register a background sync task
const registered = await pwa.registerBackgroundSync('sync-messages');

if (registered) {
  console.log('Background sync registered');
}

// Listen for sync completion
pwa.on('backgroundSync', (tag) => {
  if (tag === 'sync-messages') {
    console.log('Messages synced!');
  }
});
```

### Periodic Sync

```typescript
// Register periodic sync (requires permission)
const registered = await pwa.registerPeriodicSync(
  'periodic-update',
  24 * 60 * 60 * 1000 // Minimum 24 hours
);

if (registered) {
  console.log('Periodic sync registered');
}

// Listen for periodic sync events
pwa.on('periodicSync', (tag) => {
  if (tag === 'periodic-update') {
    console.log('Periodic update triggered');
    // Fetch new content, update caches, etc.
  }
});
```

---

## Hooks

### usePWA() - Full PWA Functionality

The `usePWA` hook provides reactive access to all PWA features:

```typescript
import { usePWA } from '@philjs/pwa';

function App() {
  const {
    state,                        // Current PWA state
    install,                      // Trigger installation
    update,                       // Apply SW update
    showNotification,             // Show notification
    setBadge,                     // Set app badge
    requestNotificationPermission, // Request permission
    subscribeToPush,              // Subscribe to push
  } = usePWA({
    name: 'My App',
    shortName: 'MyApp',
    themeColor: '#667eea',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192' },
      { src: '/icons/icon-512.png', sizes: '512x512' },
    ],
  });

  return (
    <div>
      {/* Install button */}
      {state.installable && !state.installed && (
        <button onClick={install}>
          Install App
        </button>
      )}

      {/* Update banner */}
      {state.updateAvailable && (
        <div class="update-banner">
          <p>Update available!</p>
          <button onClick={update}>Update Now</button>
        </div>
      )}

      {/* Offline indicator */}
      {!state.online && (
        <div class="offline-banner">
          You're offline. Some features may be unavailable.
        </div>
      )}

      {/* Notification button */}
      <button onClick={async () => {
        await requestNotificationPermission();
        await showNotification({
          title: 'Hello!',
          body: 'Notifications are working!',
        });
      }}>
        Test Notification
      </button>
    </div>
  );
}
```

### useInstallPrompt() - Install Prompt Handling

```typescript
import { useInstallPrompt } from '@philjs/pwa';

function InstallButton() {
  const { canInstall, isInstalled, install } = useInstallPrompt();

  if (isInstalled) {
    return <p>App is installed!</p>;
  }

  if (!canInstall) {
    return null; // Not installable (already installed or not supported)
  }

  return (
    <button onClick={install} class="install-button">
      <span>Install App</span>
      <small>Add to home screen</small>
    </button>
  );
}
```

### useOnlineStatus() - Online/Offline Detection

```typescript
import { useOnlineStatus } from '@philjs/pwa';

function OnlineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <div class={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}

// Conditional rendering based on connectivity
function SaveButton({ data }) {
  const isOnline = useOnlineStatus();

  return (
    <button
      onClick={() => saveData(data)}
      disabled={!isOnline}
    >
      {isOnline ? 'Save' : 'Save (when online)'}
    </button>
  );
}
```

---

## Vite Plugin

The `pwaPlugin()` function provides seamless Vite integration for build-time PWA generation.

### Basic Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { pwaPlugin } from '@philjs/pwa';

export default defineConfig({
  plugins: [
    pwaPlugin({
      name: 'My PWA',
      shortName: 'MyPWA',
      description: 'An awesome progressive web app',
      themeColor: '#667eea',
      backgroundColor: '#ffffff',
      display: 'standalone',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      cacheStrategies: [
        { urlPattern: '/api/', strategy: 'network-first' },
        { urlPattern: /\.(js|css)$/, strategy: 'cache-first' },
        { urlPattern: /\.(png|jpg|svg)$/, strategy: 'stale-while-revalidate' },
      ],
      offlinePages: ['/offline.html'],
      skipWaiting: true,
      clientsClaim: true,
    }),
  ],
});
```

### Plugin Features

The Vite plugin automatically:

1. **Development Server**
   - Serves `/manifest.json` dynamically
   - Serves `/sw.js` dynamically

2. **Build Output**
   - Emits `manifest.json` to dist
   - Emits `sw.js` to dist

3. **HTML Transformation**
   - Injects manifest link
   - Injects theme-color meta tag
   - Injects service worker registration script

### HTML Output

The plugin transforms your HTML to include:

```html
<head>
  <!-- Your existing head content -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#667eea">
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
      });
    }
  </script>
</head>
```

### Complete Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { pwaPlugin } from '@philjs/pwa';

export default defineConfig({
  plugins: [
    pwaPlugin({
      // App identity
      name: 'Task Manager Pro',
      shortName: 'Tasks',
      description: 'Manage your tasks efficiently',
      startUrl: '/',

      // Display
      display: 'standalone',
      orientation: 'any',
      themeColor: '#4f46e5',
      backgroundColor: '#ffffff',

      // Icons
      icons: [
        { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
        { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
        { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
        { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
        { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/maskable.png', sizes: '512x512', purpose: 'maskable' },
      ],

      // Screenshots
      screenshots: [
        {
          src: '/screenshots/desktop.png',
          sizes: '1920x1080',
          form_factor: 'wide',
          label: 'Desktop dashboard',
        },
        {
          src: '/screenshots/mobile.png',
          sizes: '750x1334',
          form_factor: 'narrow',
          label: 'Mobile view',
        },
      ],

      // Shortcuts
      shortcuts: [
        {
          name: 'New Task',
          url: '/new',
          icons: [{ src: '/icons/new-task.png', sizes: '192x192' }],
        },
        {
          name: 'Today',
          url: '/today',
        },
      ],

      // Caching
      cacheStrategies: [
        {
          urlPattern: '/api/',
          strategy: 'network-first',
          maxAge: 5 * 60 * 1000,
        },
        {
          urlPattern: /\.(js|css)$/,
          strategy: 'cache-first',
        },
        {
          urlPattern: /\.(png|jpg|svg|webp)$/,
          strategy: 'stale-while-revalidate',
          maxEntries: 100,
        },
      ],

      // Offline
      offlinePages: ['/offline.html', '/'],

      // Service worker behavior
      skipWaiting: true,
      clientsClaim: true,
    }),
  ],
});
```

---

## Complete Examples

### Example 1: Basic PWA Setup

```typescript
// main.ts
import { PWAManager } from '@philjs/pwa';

// Initialize PWA
const pwa = new PWAManager({
  name: 'My First PWA',
  shortName: 'MyPWA',
  themeColor: '#3b82f6',
  backgroundColor: '#ffffff',
  display: 'standalone',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192' },
    { src: '/icons/icon-512.png', sizes: '512x512' },
  ],
  offlinePages: ['/offline.html'],
});

// Start PWA
pwa.init();

// Listen for install availability
pwa.on('installable', () => {
  showInstallButton();
});

function showInstallButton() {
  const btn = document.getElementById('install-btn');
  btn.style.display = 'block';
  btn.onclick = () => pwa.install();
}
```

### Example 2: Push Notifications

```typescript
import { PWAManager } from '@philjs/pwa';

const pwa = new PWAManager({
  name: 'Notification App',
  themeColor: '#10b981',
});

await pwa.init();

// Setup push notifications
async function setupPushNotifications() {
  // Request permission
  const granted = await pwa.requestNotificationPermission();

  if (!granted) {
    console.log('Notification permission denied');
    return;
  }

  // Subscribe to push (requires VAPID key from your server)
  const subscription = await pwa.subscribeToPush(
    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
  );

  if (subscription) {
    // Send subscription to server
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    console.log('Push notifications enabled!');
  }
}

// Show local notification
async function notify(title: string, body: string) {
  await pwa.showNotification({
    title,
    body,
    icon: '/icons/notification.png',
    badge: '/icons/badge.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
}

// Example usage
document.getElementById('notify-btn').onclick = () => {
  notify('Hello!', 'This is a test notification');
};
```

### Example 3: Offline Caching Strategy

```typescript
import { PWAManager } from '@philjs/pwa';

const pwa = new PWAManager({
  name: 'Offline-First App',
  themeColor: '#8b5cf6',

  // Comprehensive caching strategies
  cacheStrategies: [
    // API calls - network first with cache fallback
    {
      urlPattern: '/api/',
      strategy: 'network-first',
      cacheName: 'api-cache',
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxEntries: 50,
    },

    // Static JS/CSS - cache first
    {
      urlPattern: /\.(js|css)$/,
      strategy: 'cache-first',
      cacheName: 'static-cache',
    },

    // Images - stale-while-revalidate
    {
      urlPattern: /\.(png|jpg|jpeg|gif|svg|webp)$/,
      strategy: 'stale-while-revalidate',
      cacheName: 'image-cache',
      maxEntries: 100,
    },

    // Fonts - cache first with long expiry
    {
      urlPattern: /\.(woff|woff2|ttf|otf)$/,
      strategy: 'cache-first',
      cacheName: 'font-cache',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    },

    // External CDN assets
    {
      urlPattern: /^https:\/\/cdn\.example\.com/,
      strategy: 'cache-first',
      cacheName: 'cdn-cache',
    },
  ],

  // Pages available offline
  offlinePages: [
    '/',
    '/offline.html',
    '/dashboard',
    '/settings',
  ],

  skipWaiting: true,
  clientsClaim: true,
});

await pwa.init();

// React to online/offline changes
pwa.on('online', (isOnline) => {
  if (isOnline) {
    // Sync any pending data
    syncPendingData();
    showToast('Back online!');
  } else {
    showToast('You are offline. Changes will sync when connected.');
  }
});
```

### Example 4: Share Target

```typescript
import { PWAManager } from '@philjs/pwa';

const pwa = new PWAManager({
  name: 'Share Receiver',
  themeColor: '#f59e0b',

  // Configure as share target
  shareTarget: {
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
});

await pwa.init();

// Handle shared content (on /share route)
// share-handler.ts
function handleShare() {
  const url = new URL(window.location.href);
  const title = url.searchParams.get('title');
  const text = url.searchParams.get('text');
  const sharedUrl = url.searchParams.get('url');

  if (title || text || sharedUrl) {
    console.log('Received shared content:');
    console.log('Title:', title);
    console.log('Text:', text);
    console.log('URL:', sharedUrl);

    // Process the shared content
    createNote({
      title: title || 'Shared Note',
      content: [text, sharedUrl].filter(Boolean).join('\n'),
    });
  }
}

// For file sharing (POST)
async function handleFileShare(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll('images');

  for (const file of files) {
    console.log('Received file:', file.name);
    await uploadFile(file);
  }
}
```

### Example 5: File Handler

```typescript
import { PWAManager } from '@philjs/pwa';

const pwa = new PWAManager({
  name: 'Document Editor',
  themeColor: '#06b6d4',

  // Handle file types
  fileHandlers: [
    {
      action: '/open',
      accept: {
        'text/plain': ['.txt'],
        'text/markdown': ['.md', '.markdown'],
        'application/json': ['.json'],
      },
      icons: [{ src: '/icons/document.png', sizes: '192x192' }],
      launchType: 'single-client',
    },
    {
      action: '/open-image',
      accept: {
        'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      },
    },
  ],
});

await pwa.init();

// Handle file open (launchQueue API)
if ('launchQueue' in window) {
  window.launchQueue.setConsumer((launchParams) => {
    if (launchParams.files.length > 0) {
      handleFiles(launchParams.files);
    }
  });
}

async function handleFiles(fileHandles: FileSystemFileHandle[]) {
  for (const handle of fileHandles) {
    const file = await handle.getFile();
    const content = await file.text();

    openDocument({
      name: file.name,
      content,
      handle, // Keep handle for saving
    });
  }
}
```

### Example 6: Complete App with All Features

```typescript
// app.ts
import { usePWA, useOnlineStatus } from '@philjs/pwa';

function App() {
  const {
    state,
    install,
    update,
    showNotification,
    setBadge,
    requestNotificationPermission,
  } = usePWA({
    name: 'Complete PWA Example',
    shortName: 'CompletePWA',
    description: 'Demonstrates all PWA features',
    themeColor: '#7c3aed',
    backgroundColor: '#ffffff',
    display: 'standalone',

    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192' },
      { src: '/icons/icon-512.png', sizes: '512x512' },
      { src: '/icons/maskable.png', sizes: '512x512', purpose: 'maskable' },
    ],

    shortcuts: [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'New Item', url: '/new' },
      { name: 'Search', url: '/search' },
    ],

    shareTarget: {
      action: '/share',
      method: 'GET',
      params: { title: 'title', text: 'text', url: 'url' },
    },

    cacheStrategies: [
      { urlPattern: '/api/', strategy: 'network-first' },
      { urlPattern: /\.(js|css)$/, strategy: 'cache-first' },
      { urlPattern: /\.(png|jpg|svg)$/, strategy: 'stale-while-revalidate' },
    ],

    offlinePages: ['/offline.html', '/', '/dashboard'],
    skipWaiting: true,
    clientsClaim: true,
  });

  const isOnline = useOnlineStatus();

  // Handle notification count
  let unreadCount = 0;

  async function addNotification() {
    unreadCount++;
    await setBadge(unreadCount);
    await showNotification({
      title: 'New Notification',
      body: `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`,
      icon: '/icons/notification.png',
      badge: '/icons/badge.png',
      tag: 'count',
    });
  }

  async function clearNotifications() {
    unreadCount = 0;
    await setBadge(0);
  }

  return (
    <div class="app">
      {/* Header with status indicators */}
      <header>
        <h1>Complete PWA</h1>
        <div class="status">
          {!isOnline && <span class="offline-badge">Offline</span>}
          {state.installed && <span class="installed-badge">Installed</span>}
        </div>
      </header>

      {/* Install prompt */}
      {state.installable && !state.installed && (
        <div class="install-banner">
          <p>Install this app for the best experience!</p>
          <button onClick={install}>Install</button>
        </div>
      )}

      {/* Update available */}
      {state.updateAvailable && (
        <div class="update-banner">
          <p>A new version is available!</p>
          <button onClick={update}>Update Now</button>
        </div>
      )}

      {/* Main content */}
      <main>
        {/* Notification controls */}
        <section>
          <h2>Notifications</h2>
          <button onClick={async () => {
            await requestNotificationPermission();
          }}>
            Enable Notifications
          </button>
          <button onClick={addNotification}>
            Add Notification
          </button>
          <button onClick={clearNotifications}>
            Clear Badge
          </button>
        </section>

        {/* Network status */}
        <section>
          <h2>Network Status</h2>
          <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
          <p>Push enabled: {state.pushEnabled ? 'Yes' : 'No'}</p>
        </section>
      </main>
    </div>
  );
}

export default App;
```

---

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `ManifestGenerator` | Generates and injects web app manifests |
| `ServiceWorkerGenerator` | Generates service workers with caching strategies |
| `PWAManager` | Complete PWA lifecycle management |

### Hooks

| Hook | Description |
|------|-------------|
| `usePWA(config)` | Full PWA functionality with reactive state |
| `useInstallPrompt()` | Install prompt handling |
| `useOnlineStatus()` | Online/offline status detection |

### Vite Plugin

| Export | Description |
|--------|-------------|
| `pwaPlugin(config)` | Vite plugin for PWA integration |

### Types

| Type | Description |
|------|-------------|
| `PWAConfig` | Main configuration interface |
| `PWAIcon` | Icon configuration |
| `PWAScreenshot` | Screenshot configuration |
| `PWAShortcut` | App shortcut configuration |
| `PWAShareTarget` | Share target configuration |
| `PWAFileHandler` | File handler configuration |
| `CacheStrategy` | Cache strategy configuration |
| `PWAState` | PWA state interface |
| `NotificationOptions` | Notification configuration |
| `InstallPromptEvent` | Install prompt event interface |

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Workers | 40+ | 44+ | 11.1+ | 17+ |
| Web App Manifest | 39+ | - | 11.1+ | 17+ |
| Push Notifications | 42+ | 44+ | 16+ | 17+ |
| Background Sync | 49+ | - | - | 17+ |
| Periodic Sync | 80+ | - | - | 80+ |
| File Handling | 102+ | - | - | 102+ |
| Share Target | 71+ | - | 15+ | 79+ |
| Badging API | 81+ | - | 17+ | 81+ |

---

## Next Steps

- [Service Worker Deep Dive](./service-worker.md) - Advanced caching strategies
- [Push Notifications Guide](./push-notifications.md) - Complete push setup
- [Offline Patterns](./offline-patterns.md) - Offline-first architecture
- [Testing PWAs](./testing.md) - Testing PWA functionality
