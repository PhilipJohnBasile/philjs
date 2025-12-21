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
export { BrowserWindow, WebContentsLike } from './browser-window';
export type { BrowserWindowOptions } from './browser-window';

// IPC
export { ipcMain, ipcRenderer, contextBridge } from './ipc';
export type { IpcEvent } from './ipc';

// App
export { app } from './app';

// Re-export system APIs with Electron-like naming
export { Dialog as dialog } from '../system/dialog';
export { Shell as shell } from '../system/shell';
export { Clipboard as clipboard } from '../system/clipboard';
export { Notification as Notification } from '../system/notification';
export { GlobalShortcut as globalShortcut } from '../system/shortcut';
export { SystemTray as Tray } from '../system/tray';

// Migration helpers
export { createMigrationHelper, ElectronToTauriMapper } from './migration';
