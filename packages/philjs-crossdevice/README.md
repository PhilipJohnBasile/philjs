# @philjs/crossdevice

Cross-Device State Synchronization for PhilJS Applications

[![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Seamless state sync across all your devices - like Apple Continuity, but for your app state.

**Features:**
- Real-time sync between phone, tablet, desktop
- Offline-first with automatic conflict resolution
- End-to-end encryption (AES-256-GCM)
- Selective state sharing
- Device presence and handoff
- QR code pairing
- P2P sync via WebRTC (optional)
- Works without cloud infrastructure

## Installation

```bash
npm install @philjs/crossdevice
```

## Quick Start

```typescript
import { CrossDeviceSync, initCrossDevice } from '@philjs/crossdevice';

// Initialize cross-device sync
const sync = await initCrossDevice({
  serverUrl: 'wss://sync.myapp.com',
  encryption: true,
  enableP2P: true
});

// Register state to sync
sync.registerState('theme',
  () => currentTheme,
  (value) => setTheme(value)
);

// Sync manually or automatically
await sync.sync();
```

## Usage

### Basic Setup

```typescript
import { CrossDeviceSync } from '@philjs/crossdevice';

const sync = new CrossDeviceSync({
  serverUrl: 'wss://sync.example.com',
  enableP2P: true,
  encryption: true,
  deviceName: 'My Laptop',
  syncInterval: 5000,
  conflictResolution: 'last-write-wins'
});

await sync.init();
```

### Register State

```typescript
// Register multiple state values
const unsubscribeTheme = sync.registerState(
  'theme',
  () => appTheme.value,
  (value) => { appTheme.value = value; }
);

const unsubscribeCart = sync.registerState(
  'cart',
  () => shoppingCart.items,
  (items) => { shoppingCart.items = items; }
);

// Unsubscribe when done
unsubscribeTheme();
```

### Selective Sync

```typescript
const sync = new CrossDeviceSync({
  serverUrl: 'wss://sync.example.com',
  // Only sync specific keys
  syncKeys: ['preferences', 'bookmarks', 'readingProgress']
});
```

### Device Discovery

```typescript
// Get all known devices
const devices = sync.getDevices();

// Get online devices
const online = sync.getOnlineDevices();

// Get local device info
const thisDevice = sync.getLocalDevice();

// Subscribe to device changes
sync.onDevicesChange((devices) => {
  console.log('Devices updated:', devices);
});
```

### Device Pairing

```typescript
// On primary device: generate pairing code
const pairing = await sync.generatePairingCode();
console.log('Pairing code:', pairing.code);
console.log('Expires:', new Date(pairing.expiresAt));

// On secondary device: enter code to pair
const success = await sync.pairWithCode('ABC123');

// Alternative: QR code pairing
const qrDataUrl = sync.generateQRCode();
// Display qrDataUrl as image
```

### Handoff

```typescript
// Initiate handoff from current device
sync.initiateHandoff('document', {
  id: 'doc-123',
  position: 450,
  selectedText: 'some text'
});

// Receive handoff on other device
sync.onHandoff('document', (data) => {
  console.log('Continue editing:', data.data);
  openDocument(data.data.id, data.data.position);
});
```

### Conflict Resolution

```typescript
const sync = new CrossDeviceSync({
  // Built-in strategies
  conflictResolution: 'last-write-wins' // or 'first-write-wins' | 'merge'
});

// Custom conflict handling
sync.onConflict((conflict) => {
  console.log('Conflict on key:', conflict.key);
  console.log('Local value:', conflict.localValue);
  console.log('Remote value:', conflict.remoteValue);

  // Return resolved value
  return conflict.remoteValue; // or custom merge logic
});
```

### Hooks API

```typescript
import {
  useCrossDeviceState,
  useDevices,
  useHandoff,
  initiateHandoff
} from '@philjs/crossdevice';

// Synced state hook
const [theme, setTheme] = useCrossDeviceState('theme', 'light');

// Devices hook
const devices = useDevices();

// Handoff hook
useHandoff('document', (data) => {
  console.log('Received handoff:', data);
});

// Initiate handoff
initiateHandoff('document', { id: 'doc-123' });
```

## API Reference

### Classes

#### `CrossDeviceSync`
Main synchronization manager.

**Methods:**
- `init()` - Initialize sync
- `registerState(key, getter, setter)` - Register state for syncing
- `sync()` - Trigger manual sync
- `getDevices()` - Get all devices
- `getLocalDevice()` - Get local device info
- `getOnlineDevices()` - Get online devices
- `generatePairingCode()` - Generate pairing code
- `pairWithCode(code)` - Pair with code
- `generateQRCode()` - Generate QR code data URL
- `initiateHandoff(type, data)` - Start handoff
- `onHandoff(type, handler)` - Handle handoff
- `onDevicesChange(callback)` - Subscribe to device changes
- `onConflict(handler)` - Handle conflicts
- `destroy()` - Cleanup

### Functions

- `initCrossDevice(config?)` - Initialize global instance
- `getCrossDeviceSync()` - Get global instance
- `useCrossDeviceState(key, initial)` - Synced state hook
- `useDevices()` - Devices hook
- `useHandoff(type, handler)` - Handoff handler hook
- `initiateHandoff(type, data)` - Initiate handoff
- `detectDevice()` - Detect device type/platform
- `generateDeviceId()` - Generate persistent device ID

### Types

```typescript
interface CrossDeviceConfig {
  serverUrl?: string;
  enableP2P?: boolean;
  encryption?: boolean;
  encryptionKey?: string;
  deviceId?: string;
  deviceName?: string;
  syncInterval?: number;
  syncKeys?: string[];
  conflictResolution?: 'last-write-wins' | 'first-write-wins' | 'merge' | 'custom';
}

interface Device {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'desktop' | 'watch' | 'tv' | 'unknown';
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web' | 'unknown';
  lastSeen: number;
  isOnline: boolean;
  isPrimary: boolean;
}

interface SyncConflict {
  key: string;
  localValue: unknown;
  remoteValue: unknown;
  localTimestamp: number;
  remoteTimestamp: number;
  localDevice: string;
  remoteDevice: string;
}

interface HandoffData {
  type: string;
  data: unknown;
  sourceDevice: string;
  timestamp: number;
}
```

## Security

- **End-to-End Encryption**: AES-256-GCM encryption
- **Key Exchange**: Secure key sharing via pairing codes
- **No Plain Text**: Data never transmitted unencrypted
- **Local Key Storage**: Encryption keys stored locally

## Architecture

```
Device A          Sync Server          Device B
   |                   |                   |
   |-- Register ------>|                   |
   |                   |<----- Register ---|
   |                   |                   |
   |-- Sync State ---->|                   |
   |                   |--- Sync State --->|
   |                   |                   |
   |<-- P2P -------------------------------->|
   |       (WebRTC when available)         |
```

## License

MIT
