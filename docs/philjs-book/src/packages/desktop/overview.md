# @philjs/desktop

The `@philjs/desktop` package provides comprehensive desktop application development with Tauri, including native window management, system APIs, IPC communication, and app lifecycle management.

## Installation

```bash
npm install @philjs/desktop
```

## Features

- **Tauri Integration** - Native desktop apps with web technologies
- **Window Management** - Create, position, resize, fullscreen
- **System APIs** - Dialogs, file system, clipboard, notifications
- **IPC Bridge** - Type-safe communication between JS and Rust
- **App Lifecycle** - Ready, close, quit, update events
- **CLI Tools** - Project scaffolding and builds
- **Electron Migration** - Compatibility layer for migration

## Quick Start

```typescript
import {
  createDesktopApp,
  useTauri,
  invoke,
} from '@philjs/desktop';

// Create your desktop app
createDesktopApp({
  component: App,
  config: {
    appName: 'My PhilJS App',
    version: '1.0.0',
    window: {
      width: 1024,
      height: 768,
      title: 'My App',
    },
  },
  onReady: () => {
    console.log('App is ready!');
  },
});

function App() {
  const { isTauri } = useTauri();

  async function callRust() {
    const result = await invoke('greet', { name: 'World' });
    console.log(result); // "Hello, World!"
  }

  return (
    <div>
      <h1>Running in {isTauri ? 'Desktop' : 'Browser'}</h1>
      <button onClick={callRust}>Call Rust</button>
    </div>
  );
}
```

---

## CLI

### Initialize Project

```bash
# Create new desktop project
npx philjs-desktop init my-app

# With options
npx philjs-desktop init my-app --template minimal
```

Generated project structure:

```
my-app/
├── src/
│   └── main.ts
├── src-tauri/
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Development

```bash
# Start dev server with hot reload
npx philjs-desktop dev

# Verbose output
npx philjs-desktop dev --verbose
```

### Build

```bash
# Build for current platform
npx philjs-desktop build

# Build for specific target
npx philjs-desktop build --target windows
npx philjs-desktop build --target macos
npx philjs-desktop build --target linux

# Debug build
npx philjs-desktop build --debug
```

---

## Tauri Context

### useTauri Hook

```typescript
import { useTauri, isTauri } from '@philjs/desktop';

function MyComponent() {
  const { isTauri: isDesktop } = useTauri();

  // Or use standalone function
  if (isTauri()) {
    // Running in Tauri desktop
  } else {
    // Running in browser
  }

  return isDesktop ? <DesktopUI /> : <WebUI />;
}
```

### App Info

```typescript
import {
  getAppName,
  getAppVersion,
  getTauriVersion,
  isAppInitialized,
  getLoadedPlugins,
} from '@philjs/desktop';

console.log('App:', getAppName());
console.log('Version:', getAppVersion());
console.log('Tauri:', getTauriVersion());
console.log('Initialized:', isAppInitialized());
console.log('Plugins:', getLoadedPlugins());
```

---

## Command Invocation

### Basic Invoke

```typescript
import { invoke } from '@philjs/desktop';

// Call Rust command
const result = await invoke('my_command', {
  arg1: 'value',
  arg2: 123,
});

// With type safety
const user = await invoke<User>('get_user', { id: 1 });
```

### Invoke Options

```typescript
import {
  invokeWithTimeout,
  invokeWithRetry,
  batchInvoke,
} from '@philjs/desktop';

// With timeout
const result = await invokeWithTimeout(
  'slow_command',
  { data: 'value' },
  5000 // 5 second timeout
);

// With retry
const result = await invokeWithRetry(
  'flaky_command',
  { data: 'value' },
  {
    maxRetries: 3,
    delay: 1000,
  }
);

// Batch multiple commands
const results = await batchInvoke([
  { command: 'get_user', args: { id: 1 } },
  { command: 'get_posts', args: { userId: 1 } },
  { command: 'get_settings', args: {} },
]);
```

### Command Definition

```typescript
import { createCommand, defineCommand } from '@philjs/desktop';
import type { CommandDefinition, TypedCommand } from '@philjs/desktop';

// Create typed command
const getUser = createCommand<{ id: number }, User>('get_user');

// Use it
const user = await getUser({ id: 1 });

// Define command schema
const fetchData = defineCommand({
  name: 'fetch_data',
  args: z.object({
    url: z.string(),
    method: z.enum(['GET', 'POST']),
  }),
  returns: z.object({
    data: z.any(),
    status: z.number(),
  }),
});
```

---

## Events

### Listening to Events

```typescript
import {
  listen,
  once,
  emit,
  onTauriEvent,
  TauriEvents,
} from '@philjs/desktop';
import type { Event, EventCallback, UnlistenFn } from '@philjs/desktop';

// Listen to custom event
const unlisten = await listen<string>('my-event', (event) => {
  console.log('Received:', event.payload);
});

// Listen once
await once('startup-complete', (event) => {
  console.log('App started!');
});

// Emit event
await emit('user-action', { action: 'click', target: 'button' });

// System events
onTauriEvent(TauriEvents.WINDOW_CLOSE_REQUESTED, () => {
  // Handle close request
});

// Clean up
unlisten();
```

### Event Utilities

```typescript
import {
  createEventEmitter,
  createTypedListener,
  waitForEvent,
  removeAllListeners,
} from '@philjs/desktop';

// Create typed event emitter
const emitter = createEventEmitter<{
  userLogin: { userId: string };
  dataLoaded: { items: Item[] };
}>();

emitter.on('userLogin', (data) => {
  console.log('User logged in:', data.userId);
});

emitter.emit('userLogin', { userId: '123' });

// Wait for event
const payload = await waitForEvent<User>('user-ready', 10000);

// Remove all listeners for cleanup
removeAllListeners('my-event');
```

---

## Window Management

### Creating Windows

```typescript
import {
  createWindow,
  getCurrentWindow,
  getAllWindows,
  getWindow,
} from '@philjs/desktop';
import type { WindowOptions } from '@philjs/desktop';

// Create new window
const window = await createWindow('settings', {
  title: 'Settings',
  width: 600,
  height: 400,
  center: true,
  resizable: true,
  decorations: true,
  transparent: false,
  alwaysOnTop: false,
});

// Get current window
const current = getCurrentWindow();

// Get all windows
const windows = getAllWindows();

// Get window by label
const settingsWindow = getWindow('settings');
```

### Window Operations

```typescript
import {
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  setTitle,
  setSize,
  setPosition,
  setFullscreen,
  setAlwaysOnTop,
  center,
} from '@philjs/desktop';

// Control window
await minimizeWindow();
await maximizeWindow();
await setTitle('New Title');
await setSize(800, 600);
await setPosition(100, 100);
await setFullscreen(true);
await setAlwaysOnTop(true);
await center();

// Close window
await closeWindow(); // Current window
await closeWindow('settings'); // By label
```

### Window Hook

```typescript
import { useWindow } from '@philjs/desktop';
import type { WindowState } from '@philjs/desktop';

function WindowControls() {
  const {
    isMaximized,
    isMinimized,
    isFullscreen,
    isFocused,
    minimize,
    maximize,
    close,
    toggleFullscreen,
  } = useWindow();

  return (
    <div className="titlebar">
      <button onClick={minimize}>-</button>
      <button onClick={maximize}>{isMaximized ? '🗗' : '🗖'}</button>
      <button onClick={close}>×</button>
    </div>
  );
}
```

### Monitors

```typescript
import { getPrimaryMonitor, getAllMonitors } from '@philjs/desktop';
import type { Monitor } from '@philjs/desktop';

const primary = await getPrimaryMonitor();
console.log('Primary monitor:', primary.name, primary.size);

const monitors = await getAllMonitors();
monitors.forEach((m) => {
  console.log(`${m.name}: ${m.size.width}x${m.size.height}`);
});
```

---

## System APIs

### Dialogs

```typescript
import {
  openDialog,
  saveDialog,
  showMessage,
  showConfirm,
  showAsk,
} from '@philjs/desktop';
import type { OpenDialogOptions, SaveDialogOptions } from '@philjs/desktop';

// Open file dialog
const files = await openDialog({
  title: 'Select Files',
  multiple: true,
  directory: false,
  filters: [
    { name: 'Images', extensions: ['png', 'jpg', 'gif'] },
    { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] },
  ],
});

// Save file dialog
const savePath = await saveDialog({
  title: 'Save As',
  defaultPath: 'document.txt',
  filters: [{ name: 'Text', extensions: ['txt'] }],
});

// Message box
await showMessage('Operation completed successfully!', {
  title: 'Success',
  type: 'info',
});

// Confirmation dialog
const confirmed = await showConfirm('Are you sure you want to delete?', {
  title: 'Confirm Delete',
  type: 'warning',
});

// Ask dialog with custom buttons
const answer = await showAsk('Save changes before closing?', {
  title: 'Unsaved Changes',
  type: 'warning',
});
```

### File System

```typescript
import {
  readTextFile,
  readBinaryFile,
  writeTextFile,
  writeBinaryFile,
  exists,
  createDir,
  removeFile,
  removeDir,
  readDir,
  copyFile,
  rename,
  stat,
  watchPath,
} from '@philjs/desktop';
import type { FileEntry, BaseDirectory } from '@philjs/desktop';

// Read files
const text = await readTextFile('config.json');
const binary = await readBinaryFile('image.png');

// Write files
await writeTextFile('output.txt', 'Hello, World!');
await writeBinaryFile('data.bin', new Uint8Array([1, 2, 3]));

// File operations
const fileExists = await exists('config.json');
await createDir('new-folder', { recursive: true });
await removeFile('temp.txt');
await removeDir('old-folder', { recursive: true });
await copyFile('source.txt', 'dest.txt');
await rename('old.txt', 'new.txt');

// File info
const info = await stat('file.txt');
console.log('Size:', info.size, 'Modified:', info.modifiedAt);

// Read directory
const entries: FileEntry[] = await readDir('src');
entries.forEach((entry) => {
  console.log(entry.name, entry.isDirectory ? '[DIR]' : '[FILE]');
});

// Watch for changes
const unwatch = await watchPath('src', (event) => {
  console.log('Changed:', event.paths, event.type);
});
```

### Clipboard

```typescript
import {
  readClipboard,
  writeClipboard,
  readClipboardImage,
  writeClipboardImage,
  clearClipboard,
} from '@philjs/desktop';

// Text clipboard
const text = await readClipboard();
await writeClipboard('Copied text');

// Image clipboard
const imageData = await readClipboardImage();
await writeClipboardImage(imageBytes);

// Clear clipboard
await clearClipboard();
```

### Notifications

```typescript
import {
  requestNotificationPermission,
  showNotification,
  notify,
  scheduleNotification,
  cancelNotification,
} from '@philjs/desktop';
import type { NotificationOptions } from '@philjs/desktop';

// Request permission
const granted = await requestNotificationPermission();

// Show notification
await showNotification({
  title: 'New Message',
  body: 'You have a new message from Alice',
  icon: 'icons/message.png',
  sound: 'default',
});

// Simple notification
await notify('Download complete!');

// Schedule notification
const notificationId = await scheduleNotification({
  title: 'Reminder',
  body: 'Meeting in 5 minutes',
  at: new Date(Date.now() + 5 * 60 * 1000),
});

// Cancel scheduled notification
await cancelNotification(notificationId);
```

### Global Shortcuts

```typescript
import {
  registerShortcut,
  unregisterShortcut,
  unregisterAllShortcuts,
  isShortcutRegistered,
} from '@philjs/desktop';
import type { ShortcutHandler } from '@philjs/desktop';

// Register shortcut
await registerShortcut('CommandOrControl+Shift+S', () => {
  console.log('Quick save triggered!');
});

await registerShortcut('CommandOrControl+N', () => {
  createNewDocument();
});

// Check if registered
const registered = await isShortcutRegistered('CommandOrControl+S');

// Unregister
await unregisterShortcut('CommandOrControl+Shift+S');

// Unregister all
await unregisterAllShortcuts();
```

### System Tray

```typescript
import {
  createTray,
  setTrayIcon,
  setTrayTooltip,
  setTrayMenu,
  showTray,
  hideTray,
  destroyTray,
  trayItem,
  traySeparator,
  traySubmenu,
} from '@philjs/desktop';
import type { TrayOptions, TrayMenuItem } from '@philjs/desktop';

// Create system tray
await createTray({
  icon: 'icons/tray.png',
  tooltip: 'My App',
  menu: [
    trayItem('Open', () => showApp()),
    trayItem('Settings', () => openSettings()),
    traySeparator(),
    traySubmenu('Recent', [
      trayItem('File 1', () => openRecent(0)),
      trayItem('File 2', () => openRecent(1)),
    ]),
    traySeparator(),
    trayItem('Quit', () => quitApp()),
  ],
});

// Update tray
await setTrayIcon('icons/tray-active.png');
await setTrayTooltip('My App - Running');
await setTrayMenu([...newMenuItems]);

// Show/hide
await showTray();
await hideTray();

// Destroy
await destroyTray();
```

### Shell

```typescript
import {
  openUrl,
  openPath,
  execute,
  spawn,
  runScript,
  powershell,
  sidecar,
} from '@philjs/desktop';
import type { CommandOutput, SpawnedProcess } from '@philjs/desktop';

// Open URL in default browser
await openUrl('https://philjs.dev');

// Open file/folder in default app
await openPath('/Users/me/Documents');

// Execute command
const output: CommandOutput = await execute('ls', ['-la']);
console.log('stdout:', output.stdout);
console.log('stderr:', output.stderr);
console.log('code:', output.code);

// Spawn long-running process
const process: SpawnedProcess = await spawn('npm', ['run', 'dev']);
process.on('stdout', (line) => console.log(line));
process.on('stderr', (line) => console.error(line));
process.on('close', (code) => console.log('Exited with:', code));
process.kill();

// Run shell script
await runScript('echo "Hello" && echo "World"');

// PowerShell (Windows)
await powershell('Get-Process | Select-Object -First 5');

// Run sidecar binary
const sidecarProcess = await sidecar('my-binary', ['--arg', 'value']);
```

### Auto Launch

```typescript
import {
  enableAutoLaunch,
  disableAutoLaunch,
  isAutoLaunchEnabled,
  toggleAutoLaunch,
} from '@philjs/desktop';
import type { AutoLaunchOptions } from '@philjs/desktop';

// Enable auto-launch on system startup
await enableAutoLaunch({
  minimized: true,
  args: ['--background'],
});

// Check status
const enabled = await isAutoLaunchEnabled();

// Toggle
await toggleAutoLaunch();

// Disable
await disableAutoLaunch();
```

---

## App Lifecycle

```typescript
import {
  onAppReady,
  onWindowClose,
  onBeforeQuit,
  onWillQuit,
  onQuit,
  onFocus,
  onBlur,
  onAppUpdate,
  onUpdateDownloaded,
  checkForUpdates,
  installUpdate,
  restartApp,
  quitApp,
  hideApp,
  showApp,
  isAppReady,
  useLifecycle,
} from '@philjs/desktop';
import type { UpdateInfo, LifecycleEvent } from '@philjs/desktop';

// Lifecycle events
onAppReady(() => {
  console.log('App is ready');
});

onWindowClose(() => {
  // Save state before close
  saveAppState();
});

onBeforeQuit(async () => {
  // Cleanup before quit
  await saveAllData();
  return true; // Allow quit
});

onFocus(() => {
  console.log('App focused');
});

onBlur(() => {
  console.log('App lost focus');
});

// Updates
onAppUpdate((info: UpdateInfo) => {
  console.log('Update available:', info.version);
});

onUpdateDownloaded((info) => {
  const restart = confirm('Update downloaded. Restart now?');
  if (restart) {
    installUpdate();
  }
});

await checkForUpdates();

// App control
await hideApp();
await showApp();
await restartApp();
await quitApp();
```

### useLifecycle Hook

```typescript
import { useLifecycle } from '@philjs/desktop';

function App() {
  const {
    isReady,
    isFocused,
    updateInfo,
    quit,
    restart,
    checkUpdates,
  } = useLifecycle();

  if (!isReady) {
    return <Splash />;
  }

  return (
    <div>
      {updateInfo && (
        <UpdateBanner
          version={updateInfo.version}
          onInstall={restart}
        />
      )}
      {/* ... */}
    </div>
  );
}
```

---

## IPC Bridge

### Create Bridge

```typescript
import { createIPCBridge, registerCommand, exposeToRust } from '@philjs/desktop';
import type { IPCBridge, IPCBridgeOptions } from '@philjs/desktop';

// Create IPC bridge
const bridge = createIPCBridge({
  // Handlers callable from Rust
  handlers: {
    jsFunction: (args) => {
      return 'Result from JS';
    },
    getData: async (args) => {
      const data = await fetchData(args.id);
      return data;
    },
  },
});

// Register additional command
registerCommand('custom-command', async (args) => {
  return processData(args);
});

// Expose function to Rust
exposeToRust('getWindowSize', () => ({
  width: window.innerWidth,
  height: window.innerHeight,
}));
```

### Typed IPC

```typescript
import { createTypedIPC } from '@philjs/desktop';
import type { TypedIPCSchema } from '@philjs/desktop';

// Define schema
interface MyIPC extends TypedIPCSchema {
  commands: {
    getUser: { args: { id: number }; returns: User };
    saveUser: { args: User; returns: boolean };
  };
  events: {
    userUpdated: User;
    notification: { title: string; body: string };
  };
}

const ipc = createTypedIPC<MyIPC>();

// Type-safe invoke
const user = await ipc.invoke('getUser', { id: 1 });

// Type-safe listen
ipc.listen('userUpdated', (user) => {
  console.log('User updated:', user.name);
});
```

### Channels

```typescript
import { createChannel, createRequestChannel } from '@philjs/desktop';

// Create bidirectional channel
const channel = createChannel<string, string>('my-channel');

channel.onMessage((msg) => {
  console.log('Received:', msg);
});

channel.send('Hello from JS');

// Request/response channel
const requestChannel = createRequestChannel<
  { query: string },
  { results: Item[] }
>('search-channel');

const response = await requestChannel.request({ query: 'test' });
console.log('Results:', response.results);
```

---

## Types Reference

```typescript
// Window types
interface WindowOptions {
  title?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  x?: number;
  y?: number;
  center?: boolean;
  resizable?: boolean;
  decorations?: boolean;
  transparent?: boolean;
  alwaysOnTop?: boolean;
  fullscreen?: boolean;
  focus?: boolean;
  visible?: boolean;
}

// Dialog types
interface DialogFilter {
  name: string;
  extensions: string[];
}

interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: DialogFilter[];
  multiple?: boolean;
  directory?: boolean;
}

// Notification types
interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  sound?: string;
  actions?: NotificationAction[];
}

// Lifecycle types
interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
}

type LifecycleEvent =
  | 'ready'
  | 'window-close'
  | 'before-quit'
  | 'will-quit'
  | 'quit'
  | 'focus'
  | 'blur';
```

---

## API Reference

### Tauri

| Export | Description |
|--------|-------------|
| `createDesktopApp` | Create app instance |
| `useTauri` | Tauri context hook |
| `isTauri` | Check if running in Tauri |
| `invoke` | Call Rust command |
| `listen` | Listen to events |
| `emit` | Emit event |

### Window

| Export | Description |
|--------|-------------|
| `createWindow` | Create new window |
| `getCurrentWindow` | Get current window |
| `useWindow` | Window hook |
| `setTitle/Size/Position` | Window controls |
| `minimize/maximize/close` | Window actions |

### System

| Export | Description |
|--------|-------------|
| `openDialog/saveDialog` | File dialogs |
| `showMessage/Confirm/Ask` | Message dialogs |
| `readTextFile/writeTextFile` | File operations |
| `readClipboard/writeClipboard` | Clipboard |
| `showNotification` | Notifications |
| `registerShortcut` | Global shortcuts |
| `createTray` | System tray |
| `openUrl/execute/spawn` | Shell operations |

### Lifecycle

| Export | Description |
|--------|-------------|
| `onAppReady` | App ready event |
| `onBeforeQuit` | Before quit event |
| `checkForUpdates` | Check updates |
| `quitApp` | Quit application |
| `useLifecycle` | Lifecycle hook |

---

## Next Steps

- [Desktop Platform](../../platforms/desktop.md)
- [Native Bridges](../../platforms/native-bridge.md)
- [@philjs/native](../native/overview.md)
