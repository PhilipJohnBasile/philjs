/**
 * Electron Compatibility Layer for PhilJS Desktop
 *
 * This module provides Electron-like APIs on top of Tauri,
 * making it easier to migrate Electron apps to Tauri.
 *
 * Note: Not all Electron APIs are supported. This is a best-effort
 * compatibility layer for common use cases.
 */

// BrowserWindow
export { BrowserWindow, WebContentsLike } from './browser-window.js';
export type { BrowserWindowOptions } from './browser-window.js';

// IPC
export { ipcMain, ipcRenderer, contextBridge } from './ipc.js';
export type { IpcEvent } from './ipc.js';

// App
export { app } from './app.js';

// Re-export system APIs with Electron-like naming
export { Dialog as dialog } from '../system/dialog.js';
export { Shell as shell } from '../system/shell.js';
export { Clipboard as clipboard } from '../system/clipboard.js';
export { Notification as Notification } from '../system/notification.js';
export { GlobalShortcut as globalShortcut } from '../system/shortcut.js';
export { SystemTray as Tray } from '../system/tray.js';

// Migration helpers
export { createMigrationHelper, ElectronToTauriMapper } from './migration.js';
