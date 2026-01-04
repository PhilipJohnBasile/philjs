# @philjs/crossdevice - Complete Reference

The `@philjs/crossdevice` package provides seamless cross-device state synchronization for PhilJS applications. Think Apple Continuity, but for your app state - enabling real-time sync across phones, tablets, desktops, and more.

## Installation

```bash
npm install @philjs/crossdevice
# or
pnpm add @philjs/crossdevice
# or
bun add @philjs/crossdevice
```

## Features

| Feature | Description |
|---------|-------------|
| Real-time Sync | Instant state synchronization across all connected devices |
| Offline-first | Works offline with automatic sync when reconnected |
| End-to-End Encryption | AES-256-GCM encryption for all synced data |
| P2P Support | Optional WebRTC peer-to-peer connections |
| Device Discovery | Automatic detection and tracking of connected devices |
| Handoff | Transfer activities between devices seamlessly |
| QR Code Pairing | Easy device pairing via QR codes |
| Conflict Resolution | Built-in strategies for handling sync conflicts |
| Selective Sync | Choose which state keys to synchronize |

## Quick Start

```typescript
import { initCrossDevice, useCrossDeviceState } from '@philjs/crossdevice';

// Initialize cross-device sync
const sync = await initCrossDevice({
  serverUrl: 'wss://sync.myapp.com',
  encryption: true,
  enableP2P: true
});

// Register state to sync across devices
sync.registerState(
  'theme',
  () => currentTheme,
  (value) => setTheme(value)
);

// Trigger manual sync
await sync.sync();
```

## Basic Setup

### Creating a Sync Instance

```typescript
import { CrossDeviceSync } from '@philjs/crossdevice';

const sync = new CrossDeviceSync({
  // WebSocket server for sync coordination
  serverUrl: 'wss://sync.example.com',

  // Enable peer-to-peer connections (WebRTC)
  enableP2P: true,

  // Enable end-to-end encryption
  encryption: true,

  // Custom device name
  deviceName: 'My MacBook Pro',

  // Sync interval for polling fallback (ms)
  syncInterval: 5000,

  // Conflict resolution strategy
  conflictResolution: 'last-write-wins'
});

// Initialize the sync manager
await sync.init();
```

### Registering State

```typescript
import { signal } from '@philjs/core';

// Create reactive state
const theme = signal<'light' | 'dark'>('light');
const cart = signal<CartItem[]>([]);
const preferences = signal<UserPreferences>({});

// Register state for cross-device sync
const unsubscribeTheme = sync.registerState(
  'theme',
  () => theme(),                    // Getter
  (value) => theme.set(value)       // Setter
);

const unsubscribeCart = sync.registerState(
  'cart',
  () => cart(),
  (items) => cart.set(items)
);

const unsubscribePrefs = sync.registerState(
  'preferences',
  () => preferences(),
  (prefs) => preferences.set(prefs)
);

// Unsubscribe when no longer needed
unsubscribeTheme();
```

### Selective State Sync

```typescript
// Only sync specific keys
const sync = new CrossDeviceSync({
  serverUrl: 'wss://sync.example.com',
  syncKeys: ['preferences', 'bookmarks', 'readingProgress']
});

// Other registered state will not be synced
sync.registerState('localCache', getter, setter);  // Not synced
sync.registerState('bookmarks', getter, setter);   // Synced
```

## Device Management

### Device Discovery

```typescript
// Get all known devices
const devices = sync.getDevices();

// Get only online devices
const onlineDevices = sync.getOnlineDevices();

// Get information about the local device
const thisDevice = sync.getLocalDevice();

console.log(thisDevice);
// {
//   id: 'device-1234567890-abc123',
//   name: 'macos desktop',
//   type: 'desktop',
//   platform: 'macos',
//   lastSeen: 1704067200000,
//   isOnline: true,
//   isPrimary: false
// }
```

### Device Change Subscription

```typescript
// Subscribe to device list changes
const unsubscribe = sync.onDevicesChange((devices) => {
  console.log('Connected devices:', devices.length);

  devices.forEach(device => {
    console.log(`${device.name} (${device.type}) - ${device.isOnline ? 'online' : 'offline'}`);
  });
});

// Unsubscribe when done
unsubscribe();
```

### Device Detection

```typescript
import { detectDevice, generateDeviceId } from '@philjs/crossdevice';

// Detect current device type and platform
const deviceInfo = detectDevice();
console.log(deviceInfo);
// { type: 'desktop', platform: 'macos' }

// Generate a persistent device ID
const deviceId = generateDeviceId();
// 'device-1704067200000-abc123def'
```

## Device Pairing

### Code-Based Pairing

```typescript
// On the primary device: Generate a pairing code
const pairing = await sync.generatePairingCode();

console.log('Pairing code:', pairing.code);        // 'ABC123'
console.log('Expires:', new Date(pairing.expiresAt)); // 5 minutes from now
console.log('Device ID:', pairing.deviceId);

// On the secondary device: Enter the code to pair
const success = await sync.pairWithCode('ABC123');

if (success) {
  console.log('Successfully paired!');
  // Encryption key is automatically shared
} else {
  console.log('Pairing failed - code may be expired or invalid');
}
```

### QR Code Pairing

```typescript
// Generate QR code data URL
const qrDataUrl = sync.generateQRCode();

// Display in your UI
// <img src={qrDataUrl} alt="Scan to pair" />

// The QR code contains:
// - Server URL
// - Encryption key
// - Device ID
```

## Handoff

Transfer activities seamlessly between devices - similar to Apple's Handoff feature.

### Initiating Handoff

```typescript
// Start a handoff from the current device
sync.initiateHandoff('document', {
  id: 'doc-123',
  position: 450,        // Scroll position
  selectedText: 'some highlighted text',
  cursorPosition: { line: 42, column: 15 }
});

// Handoff for a video
sync.initiateHandoff('video', {
  videoId: 'vid-456',
  currentTime: 1234.5,
  playbackRate: 1.5
});

// Handoff for a form
sync.initiateHandoff('checkout', {
  step: 3,
  formData: {
    shippingAddress: '...',
    paymentMethod: 'card'
  }
});
```

### Receiving Handoff

```typescript
// Listen for document handoffs
sync.onHandoff('document', (data) => {
  console.log('Continue editing from:', data.sourceDevice);
  console.log('Document ID:', data.data.id);
  console.log('Scroll to position:', data.data.position);

  openDocument(data.data.id, {
    scrollPosition: data.data.position,
    selection: data.data.selectedText
  });
});

// Listen for video handoffs
sync.onHandoff('video', (data) => {
  const video = document.querySelector('video');
  video.currentTime = data.data.currentTime;
  video.playbackRate = data.data.playbackRate;
  video.play();
});
```

## Conflict Resolution

### Built-in Strategies

```typescript
// Last write wins (default)
const sync = new CrossDeviceSync({
  conflictResolution: 'last-write-wins'
});

// First write wins
const sync = new CrossDeviceSync({
  conflictResolution: 'first-write-wins'
});

// Automatic merge (arrays and objects)
const sync = new CrossDeviceSync({
  conflictResolution: 'merge'
});
// Arrays: Combines unique values using Set.union()
// Objects: Shallow merge with {...local, ...remote}
```

### Custom Conflict Handler

```typescript
sync.onConflict((conflict) => {
  console.log('Conflict detected on key:', conflict.key);
  console.log('Local value:', conflict.localValue);
  console.log('Remote value:', conflict.remoteValue);
  console.log('Local timestamp:', new Date(conflict.localTimestamp));
  console.log('Remote timestamp:', new Date(conflict.remoteTimestamp));
  console.log('Local device:', conflict.localDevice);
  console.log('Remote device:', conflict.remoteDevice);

  // Return the resolved value
  // Return undefined to fall back to the configured strategy

  if (conflict.key === 'cart') {
    // Custom merge for shopping cart
    const localItems = conflict.localValue as CartItem[];
    const remoteItems = conflict.remoteValue as CartItem[];

    return mergeCartItems(localItems, remoteItems);
  }

  // Use default resolution for other keys
  return undefined;
});
```

## Hooks API

For a more declarative approach, use the built-in hooks:

### useCrossDeviceState

```typescript
import { useCrossDeviceState } from '@philjs/crossdevice';

function ThemeSwitcher() {
  // State that syncs across devices
  const [getTheme, setTheme] = useCrossDeviceState('theme', 'light');

  return (
    <button onClick={() => setTheme(getTheme() === 'light' ? 'dark' : 'light')}>
      Current theme: {getTheme()}
    </button>
  );
}
```

### useDevices

```typescript
import { useDevices } from '@philjs/crossdevice';

function DeviceList() {
  const devices = useDevices();

  return (
    <ul>
      {devices.map(device => (
        <li key={device.id}>
          {device.name} ({device.type})
          {device.isOnline ? ' - Online' : ' - Offline'}
        </li>
      ))}
    </ul>
  );
}
```

### useHandoff

```typescript
import { useHandoff, initiateHandoff } from '@philjs/crossdevice';

function DocumentEditor() {
  // Receive handoffs
  useHandoff('document', (data) => {
    scrollToPosition(data.data.position);
    selectText(data.data.selectedText);
  });

  // Send handoff
  const handleHandoff = () => {
    initiateHandoff('document', {
      id: currentDocId,
      position: window.scrollY,
      selectedText: window.getSelection()?.toString()
    });
  };

  return (
    <div>
      <button onClick={handleHandoff}>Continue on Another Device</button>
      {/* Document content */}
    </div>
  );
}
```

## Encryption

### Automatic Encryption

```typescript
const sync = new CrossDeviceSync({
  encryption: true  // Enabled by default
  // Encryption key is auto-generated if not provided
});

await sync.init();

// Get the encryption key to share with other devices
const key = sync.config.encryptionKey;
```

### Custom Encryption Key

```typescript
const sync = new CrossDeviceSync({
  encryption: true,
  encryptionKey: 'your-base64-encoded-aes-256-key'
});
```

### Security Features

- **AES-256-GCM**: Industry-standard authenticated encryption
- **Unique IVs**: Each encrypted message uses a random 12-byte IV
- **Local Key Storage**: Keys never leave the device (unless shared via pairing)
- **No Plain Text**: Data is always encrypted before transmission

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
   |<-- P2P (WebRTC) ---------------------->|
   |       (Direct connection when available)
   |                   |                   |
   |<-- Handoff -------|--- Handoff ------>|
   |                   |                   |
```

### Connection Modes

1. **WebSocket Server**: Primary coordination through a sync server
2. **WebRTC P2P**: Direct device-to-device communication for lower latency
3. **Offline Cache**: Local state cached in localStorage for offline access
4. **Polling Fallback**: Periodic sync when real-time connections fail

## Configuration Reference

```typescript
interface CrossDeviceConfig {
  /** WebSocket sync server URL (optional - can work P2P only) */
  serverUrl?: string;

  /** Enable peer-to-peer sync via WebRTC (default: true) */
  enableP2P?: boolean;

  /** Enable end-to-end encryption (default: true) */
  encryption?: boolean;

  /** Custom encryption key (auto-generated if not provided) */
  encryptionKey?: string;

  /** Unique device identifier (auto-generated if not provided) */
  deviceId?: string;

  /** Human-readable device name */
  deviceName?: string;

  /** Sync interval in milliseconds for polling fallback (default: 5000) */
  syncInterval?: number;

  /** State keys to sync - empty array syncs all (default: []) */
  syncKeys?: string[];

  /** Conflict resolution strategy (default: 'last-write-wins') */
  conflictResolution?: 'last-write-wins' | 'first-write-wins' | 'merge' | 'custom';
}
```

## Types Reference

### Device

```typescript
interface Device {
  /** Unique device identifier */
  id: string;

  /** Human-readable device name */
  name: string;

  /** Device form factor */
  type: 'phone' | 'tablet' | 'desktop' | 'watch' | 'tv' | 'unknown';

  /** Operating system/platform */
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web' | 'unknown';

  /** Unix timestamp of last activity */
  lastSeen: number;

  /** Whether device is currently connected */
  isOnline: boolean;

  /** Whether this is the primary/owner device */
  isPrimary: boolean;
}
```

### SyncState

```typescript
interface SyncState {
  /** Monotonically increasing version number */
  version: number;

  /** Unix timestamp of last update */
  timestamp: number;

  /** Device that created this state version */
  deviceId: string;

  /** Key-value state data */
  data: Record<string, unknown>;

  /** Hash for change detection */
  checksum: string;
}
```

### SyncConflict

```typescript
interface SyncConflict {
  /** The state key with conflicting values */
  key: string;

  /** Value from the local device */
  localValue: unknown;

  /** Value from the remote device */
  remoteValue: unknown;

  /** When the local value was last updated */
  localTimestamp: number;

  /** When the remote value was last updated */
  remoteTimestamp: number;

  /** ID of the local device */
  localDevice: string;

  /** ID of the remote device */
  remoteDevice: string;
}
```

### HandoffData

```typescript
interface HandoffData {
  /** Type of activity being handed off */
  type: string;

  /** Activity-specific data payload */
  data: unknown;

  /** Device initiating the handoff */
  sourceDevice: string;

  /** When the handoff was initiated */
  timestamp: number;
}
```

### PairingInfo

```typescript
interface PairingInfo {
  /** 6-character pairing code */
  code: string;

  /** Unix timestamp when the code expires */
  expiresAt: number;

  /** Device ID that generated the code */
  deviceId: string;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `CrossDeviceSync` | Main synchronization manager for cross-device state |

### CrossDeviceSync Methods

| Method | Description |
|--------|-------------|
| `init()` | Initialize the sync manager (async) |
| `registerState(key, getter, setter)` | Register a state value for synchronization |
| `sync()` | Manually trigger state synchronization |
| `getDevices()` | Get all known devices |
| `getLocalDevice()` | Get information about the current device |
| `getOnlineDevices()` | Get only currently connected devices |
| `generatePairingCode()` | Generate a time-limited pairing code |
| `pairWithCode(code)` | Pair with another device using a code |
| `generateQRCode()` | Generate a QR code data URL for pairing |
| `initiateHandoff(type, data)` | Start a handoff to other devices |
| `onHandoff(type, handler)` | Register a handoff receiver |
| `onDevicesChange(callback)` | Subscribe to device list changes |
| `onConflict(handler)` | Register a custom conflict resolver |
| `destroy()` | Clean up connections and intervals |

### Functions

| Function | Description |
|----------|-------------|
| `initCrossDevice(config?)` | Initialize and return a global sync instance |
| `getCrossDeviceSync()` | Get the global sync instance |
| `useCrossDeviceState(key, initial)` | Hook for synced state |
| `useDevices()` | Hook to get connected devices |
| `useHandoff(type, handler)` | Hook to receive handoffs |
| `initiateHandoff(type, data)` | Function to start a handoff |
| `detectDevice()` | Detect current device type and platform |
| `generateDeviceId()` | Generate a persistent device identifier |

## Best Practices

### State Selection

```typescript
// DO: Sync user preferences and cross-device state
sync.registerState('theme', getter, setter);
sync.registerState('bookmarks', getter, setter);
sync.registerState('readingProgress', getter, setter);

// DON'T: Sync large or device-specific state
// sync.registerState('fullDocumentCache', getter, setter);  // Too large
// sync.registerState('windowSize', getter, setter);         // Device-specific
```

### Cleanup

```typescript
// Always clean up when your app unmounts
window.addEventListener('beforeunload', () => {
  sync.destroy();
});

// Or in a PhilJS component
import { onCleanup } from '@philjs/core';

function App() {
  const sync = new CrossDeviceSync(config);

  onCleanup(() => {
    sync.destroy();
  });

  return <div>...</div>;
}
```

### Error Handling

```typescript
try {
  await sync.init();
} catch (error) {
  console.error('Failed to initialize cross-device sync:', error);
  // Fall back to local-only mode
}

// Handle pairing failures
const success = await sync.pairWithCode(code);
if (!success) {
  showError('Invalid or expired pairing code');
}
```
