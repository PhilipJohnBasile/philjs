# @philjs/tauri

Tauri desktop application integration for PhilJS. Build native desktop apps with web technologies using Rust for the backend and PhilJS for the frontend.

## Installation

```bash
npm install @philjs/tauri
# or
yarn add @philjs/tauri
# or
pnpm add @philjs/tauri
```

**Rust (Cargo.toml):**
```toml
[dependencies]
philjs-tauri = "0.1"
tauri = "1.5"
```

## Basic Usage

**TypeScript:**
```tsx
import { invoke, useTauriCommand, useWindow } from '@philjs/tauri';

function App() {
  const { data: config } = useTauriCommand('get_config');
  const { minimize, maximize, close } = useWindow();

  const handleSave = async () => {
    await invoke('save_file', { path: '/tmp/data.json', content: data });
  };

  return (
    <div>
      <TitleBar onMinimize={minimize} onMaximize={maximize} onClose={close} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

**Rust:**
```rust
use philjs_tauri::prelude::*;

#[tauri::command]
async fn save_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, &content).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_file])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

## Features

- **Native Performance** - Rust backend for speed and efficiency
- **Small Bundle** - Tiny app size compared to Electron
- **System Tray** - Native system tray integration
- **Window Management** - Multi-window and custom titlebars
- **File System** - Native file dialogs and operations
- **Notifications** - System notifications
- **Clipboard** - Read/write clipboard
- **Auto Updates** - Built-in update mechanism
- **Deep Links** - Custom protocol handlers
- **Native Menus** - OS-native application menus
- **Security** - Sandboxed by default
- **Cross-Platform** - Windows, macOS, Linux

## Hooks

| Hook | Description |
|------|-------------|
| `useTauriCommand` | Call Rust commands |
| `useWindow` | Window controls |
| `useFilesystem` | File operations |
| `useNotification` | System notifications |
| `useClipboard` | Clipboard access |
| `useAppUpdate` | Auto-update state |

## Components

| Component | Description |
|-----------|-------------|
| `TitleBar` | Custom window titlebar |
| `TrayMenu` | System tray menu |
| `NativeMenu` | Application menu |
| `Dialog` | Native file dialogs |

## CLI

```bash
# Create new Tauri + PhilJS project
npx create-philjs-tauri my-app

# Development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## License

MIT
