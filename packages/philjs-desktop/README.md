# philjs-desktop

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Desktop application development for PhilJS using Tauri. Build native, cross-platform desktop applications with the power of PhilJS and Rust.

## Features

- **Tauri Integration** - First-class Tauri 2.0 support
- **Window Management** - Create and manage native windows
- **System APIs** - Dialogs, file system, clipboard, notifications
- **IPC Bridge** - Type-safe JavaScript <-> Rust communication
- **App Lifecycle** - Handle app events and updates
- **Electron Compatibility** - Easy migration from Electron

## Installation

```bash
pnpm add philjs-desktop @tauri-apps/api @tauri-apps/cli
```

## Quick Start

### Initialize a New Project

```bash
npx philjs-desktop init my-app
cd my-app
pnpm install
pnpm run tauri:dev
```

### Create a Desktop App

```typescript
import { createDesktopApp, useTauri, invoke } from 'philjs-desktop';

createDesktopApp({
  component: App,
  config: {
    appName: 'My Desktop App',
    version: '1.0.0',
    window: {
      width: 1024,
      height: 768,
      title: 'My App',
      center: true,
    },
  },
  onReady: () => {
    console.log('App is ready!');
  },
});

function App() {
  const { isTauri } = useTauri();

  return `<h1>Running in ${isTauri ? 'Tauri' : 'Browser'}</h1>`;
}
```

## Window Management

```typescript
import {
  createWindow,
  getCurrentWindow,
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  setTitle,
  setSize,
  setFullscreen,
} from 'philjs-desktop';

// Create a new window
const win = await createWindow({
  title: 'Settings',
  width: 600,
  height: 400,
  center: true,
});

// Control the current window
await setTitle('New Title');
await setSize(1280, 720);
await setFullscreen(true);
await minimizeWindow();
await maximizeWindow();

// Get window info
const window = await getCurrentWindow();
const size = await window.getSize();
const position = await window.getPosition();
```

## System APIs

### Dialogs

```typescript
import { Dialog, openDialog, saveDialog, showConfirm } from 'philjs-desktop';

// Open file dialog
const files = await openDialog({
  title: 'Select Files',
  multiple: true,
  filters: [
    { name: 'Images', extensions: ['png', 'jpg', 'gif'] },
    { name: 'All Files', extensions: ['*'] },
  ],
});

// Save file dialog
const path = await saveDialog({
  title: 'Save As',
  defaultPath: 'document.txt',
});

// Confirmation dialog
const confirmed = await showConfirm('Are you sure?', {
  title: 'Confirm Action',
  type: 'warning',
});
```

### File System

```typescript
import {
  FileSystem,
  readTextFile,
  writeTextFile,
  exists,
  readDir,
} from 'philjs-desktop';

// Read a file
const content = await readTextFile('/path/to/file.txt');

// Write a file
await writeTextFile('/path/to/file.txt', 'Hello, World!', {
  createDirs: true,
});

// Check if file exists
if (await exists('/path/to/file.txt')) {
  console.log('File exists');
}

// List directory contents
const entries = await readDir('/path/to/directory');
for (const entry of entries) {
  console.log(entry.name, entry.isDirectory ? '(dir)' : '(file)');
}

// Watch for changes
const unwatch = await FileSystem.watch('/path/to/watch', (event) => {
  console.log('File changed:', event);
});
```

### Shell

```typescript
import { Shell, openUrl, execute, spawn } from 'philjs-desktop';

// Open URL in browser
await openUrl('https://philjs.dev');

// Execute a command
const result = await execute('git', ['status']);
console.log(result.stdout);

// Spawn a long-running process
const process = await spawn('npm', ['run', 'build'], {
  onStdout: (line) => console.log(line),
  onStderr: (line) => console.error(line),
});

await process.kill();
```

### Clipboard

```typescript
import { Clipboard, readClipboard, writeClipboard } from 'philjs-desktop';

// Read from clipboard
const text = await readClipboard();

// Write to clipboard
await writeClipboard('Copied text!');

// Check clipboard content
if (await Clipboard.hasImage()) {
  const image = await Clipboard.readImage();
}
```

### Notifications

```typescript
import {
  Notification,
  notify,
  requestNotificationPermission,
  scheduleNotification,
} from 'philjs-desktop';

// Request permission
await requestNotificationPermission();

// Show notification
await notify('Hello!', 'This is a notification');

// Schedule a notification
const id = await scheduleNotification({
  title: 'Reminder',
  body: 'Time for a break!',
  at: new Date(Date.now() + 60000), // 1 minute from now
});
```

### Global Shortcuts

```typescript
import { GlobalShortcut, registerShortcut } from 'philjs-desktop';

// Register a global shortcut
const unregister = await registerShortcut('CommandOrControl+Shift+S', () => {
  console.log('Shortcut pressed!');
});

// Later, unregister
unregister();
```

### System Tray

```typescript
import { SystemTray, trayItem, traySeparator } from 'philjs-desktop';

// Create system tray
await SystemTray.create({
  icon: 'icons/tray.png',
  tooltip: 'My App',
  menu: [
    trayItem('show', 'Show Window', () => window.show()),
    traySeparator(),
    trayItem('quit', 'Quit', () => app.quit()),
  ],
});
```

### Auto Launch

```typescript
import { AutoLaunch, toggleAutoLaunch } from 'philjs-desktop';

// Check if enabled
const enabled = await AutoLaunch.isEnabled();

// Toggle auto launch
await toggleAutoLaunch();
```

## IPC Bridge

### Type-Safe Commands

```typescript
import { createTypedIPC, invoke } from 'philjs-desktop';

// Define your schema
interface MySchema {
  commands: {
    'get_user': { args: { id: number }; result: User };
    'save_data': { args: { data: string }; result: boolean };
  };
  events: {
    'data_updated': { id: number; data: string };
  };
}

// Create typed IPC
const ipc = createTypedIPC<MySchema>();

// Invoke with type safety
const user = await ipc.invoke('get_user', { id: 123 });

// Listen with type safety
ipc.on('data_updated', (payload) => {
  console.log(payload.id, payload.data);
});
```

### Expose JS API to Rust

```typescript
import { exposeToRust, createIPCBridge } from 'philjs-desktop';

// Expose functions
const cleanup = exposeToRust({
  async getData() {
    return { value: 42 };
  },
  async processItem(item: string) {
    return item.toUpperCase();
  },
}, { prefix: 'myApi' });

// Create IPC bridge
const bridge = createIPCBridge({
  commandPrefix: 'app:',
  debug: true,
});

bridge.registerHandler('compute', async (args) => {
  return args.a + args.b;
});
```

## App Lifecycle

```typescript
import {
  onAppReady,
  onWindowClose,
  onAppUpdate,
  checkForUpdates,
  installUpdate,
  quitApp,
} from 'philjs-desktop';

// App ready
onAppReady(() => {
  console.log('App started!');
});

// Before window closes
onWindowClose(() => {
  const shouldClose = confirm('Are you sure?');
  return shouldClose;
});

// Check for updates
const update = await checkForUpdates();
if (update) {
  console.log('Update available:', update.version);
  await installUpdate((progress) => {
    console.log(`Downloading: ${progress}%`);
  });
}

// Quit app
quitApp();
```

## Electron Migration

philjs-desktop provides compatibility APIs for migrating from Electron:

```typescript
import {
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  app,
  createMigrationHelper,
} from 'philjs-desktop/electron';

// Create windows (Electron-style)
const win = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
    contextIsolation: true,
  },
});

// IPC (Electron-style)
ipcMain.handle('get-data', async (event, args) => {
  return { success: true };
});

const result = await ipcRenderer.invoke('get-data');

// App lifecycle (Electron-style)
app.on('ready', () => {
  // Create window
});

app.on('window-all-closed', () => {
  app.quit();
});

// Migration helper
const helper = createMigrationHelper();
const issues = helper.analyzeCode(myElectronCode);
console.log(helper.generateReport(['BrowserWindow', 'ipcMain', 'shell']));
```

## CLI Commands

```bash
# Initialize new project
philjs-desktop init my-app

# Development mode
philjs-desktop dev

# Build for production
philjs-desktop build

# Build for specific platform
philjs-desktop build --target windows
philjs-desktop build --target macos
philjs-desktop build --target linux
```

## ES2024 Features

### File Operations with `using`

```typescript
import { FileSystem, readTextFile } from 'philjs-desktop';

// Automatic resource cleanup with TypeScript 6 explicit resource management
async function processFile(path: string) {
  await using handle = await FileSystem.open(path, {
    read: true,
    [Symbol.asyncDispose]: async () => {
      await handle.close();
      console.log('File handle closed');
    }
  });

  return handle.readAll();
}
```

### Promise.withResolvers() for IPC

```typescript
import { invoke } from 'philjs-desktop';

// Create cancellable IPC calls using Promise.withResolvers()
function createCancellableInvoke<T>(command: string, args?: unknown) {
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  let cancelled = false;

  invoke<T>(command, args)
    .then(result => !cancelled && resolve(result))
    .catch(error => !cancelled && reject(error));

  return {
    promise,
    cancel: () => { cancelled = true; }
  };
}

const { promise, cancel } = createCancellableInvoke('long_operation', { data: 'test' });
// Later: cancel() to abort
```

### Object.groupBy() for Window Management

```typescript
import { getAllWindows, type WindowInfo } from 'philjs-desktop';

async function organizeWindows() {
  const windows = await getAllWindows();

  // Group windows by their state using ES2024 Object.groupBy()
  const grouped = Object.groupBy(windows, (win: WindowInfo) =>
    win.isMinimized ? 'minimized' :
    win.isMaximized ? 'maximized' : 'normal'
  );

  return {
    minimized: grouped.minimized ?? [],
    maximized: grouped.maximized ?? [],
    normal: grouped.normal ?? [],
  };
}
```

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported
- **Rust** (for Tauri)
- Platform-specific dependencies (see [Tauri prerequisites](https://tauri.app/v2/guides/prerequisites/))

## API Reference

### Tauri Integration

| Function | Description |
|----------|-------------|
| `createDesktopApp(options)` | Create a Tauri desktop app |
| `useTauri()` | Hook for Tauri APIs access |
| `invoke(command, args)` | Call Rust backend commands |
| `listen(event, callback)` | Listen to Tauri events |
| `emit(event, payload)` | Emit events to Rust |
| `isTauri()` | Check if running in Tauri |

### Window Management

| Function | Description |
|----------|-------------|
| `createWindow(options)` | Create new window |
| `getCurrentWindow()` | Get current window handle |
| `closeWindow()` | Close current window |
| `minimizeWindow()` | Minimize current window |
| `maximizeWindow()` | Maximize current window |
| `setTitle(title)` | Set window title |
| `setSize(width, height)` | Set window size |
| `setFullscreen(enabled)` | Toggle fullscreen |
| `setAlwaysOnTop(enabled)` | Keep window on top |
| `center()` | Center window |
| `setPosition(x, y)` | Set window position |

### System APIs

| Module | Description |
|--------|-------------|
| `Dialog` | Open/save dialogs, message boxes |
| `FileSystem` | Read/write files, directories |
| `Shell` | Open URLs, execute commands |
| `Clipboard` | System clipboard access |
| `Notification` | System notifications |
| `GlobalShortcut` | Register global hotkeys |
| `SystemTray` | System tray icon and menu |
| `AutoLaunch` | Start on system boot |

### Lifecycle

| Function | Description |
|----------|-------------|
| `onAppReady(callback)` | App ready event |
| `onWindowClose(callback)` | Before close event |
| `onAppUpdate(callback)` | Update available event |
| `checkForUpdates()` | Check for app updates |
| `installUpdate()` | Install pending update |
| `quitApp()` | Quit the application |

## License

MIT
