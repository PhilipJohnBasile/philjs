# @philjs/tauri

Tauri integration for building native desktop applications with PhilJS.

## Installation

```bash
npm install @philjs/tauri
```

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-tauri = "0.1"
tauri = "2"
```

## Overview

`@philjs/tauri` provides Tauri integration for PhilJS:

- **Native APIs**: System dialogs, notifications, clipboard
- **Window Management**: Multi-window support
- **IPC Bridge**: Type-safe communication
- **File System**: Native file operations
- **Tray Icons**: System tray integration
- **Auto Updates**: Built-in update mechanism

## Quick Start

```typescript
import { createTauriApp, useTauri } from '@philjs/tauri';

const app = createTauriApp({
  productName: 'My App',
  window: {
    width: 1200,
    height: 800,
    resizable: true,
  },
});

function App() {
  const { invoke, window } = useTauri();

  const openFile = async () => {
    const path = await invoke('open_file_dialog');
    const content = await invoke('read_file', { path });
    return content;
  };

  return (
    <button onClick={openFile}>Open File</button>
  );
}
```

## IPC Commands

### Rust Side

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
async fn fetch_data(url: String) -> Result<String, String> {
    reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())
}
```

### JavaScript Side

```typescript
import { invoke } from '@philjs/tauri';

const greeting = await invoke<string>('greet', { name: 'World' });
const data = await invoke<string>('fetch_data', { url: 'https://api.example.com' });
```

## Window Management

```typescript
import { useWindow, createWindow } from '@philjs/tauri';

function App() {
  const window = useWindow();

  const openSettings = async () => {
    await createWindow('settings', {
      url: '/settings',
      width: 600,
      height: 400,
      title: 'Settings',
    });
  };

  return (
    <div>
      <button onClick={() => window.minimize()}>Minimize</button>
      <button onClick={() => window.toggleMaximize()}>Maximize</button>
      <button onClick={openSettings}>Settings</button>
    </div>
  );
}
```

## System Features

```typescript
import {
  showNotification,
  showDialog,
  clipboard,
  shell
} from '@philjs/tauri';

// Notifications
await showNotification({
  title: 'Download Complete',
  body: 'Your file has been downloaded',
});

// Dialogs
const path = await showDialog.open({
  filters: [{ name: 'Images', extensions: ['png', 'jpg'] }],
});

// Clipboard
await clipboard.writeText('Hello');
const text = await clipboard.readText();

// Shell
await shell.open('https://example.com');
```

## See Also

- [@philjs/desktop](../desktop/overview.md) - Desktop utilities
- [@philjs/native](../native/overview.md) - Native integrations
- [@philjs/rust](../rust/overview.md) - Rust framework
