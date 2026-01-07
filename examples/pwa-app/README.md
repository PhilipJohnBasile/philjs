# PhilJS PWA App

A Progressive Web App demonstrating offline-first capabilities with PhilJS.

## Features

- Installable as a native app
- Offline functionality with service workers
- Push notifications
- Background sync

## Prerequisites

- Node.js 24+ (Node 25 supported)
- pnpm

## Running the App

```bash
# From repository root
pnpm install
pnpm build

# From examples/pwa-app
cd examples/pwa-app
pnpm dev
```

The development server starts at `http://localhost:5173`.

## Build for Production

```bash
pnpm build
pnpm preview
```

## Installing as PWA

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Follow the prompts to install

## PhilJS Features Used

- `generateServiceWorker()` - Service worker generation
- `registerServiceWorker()` - SW registration
- `persistentSignal()` - Local storage persistence
- Offline state management
