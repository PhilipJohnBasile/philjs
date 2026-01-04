/**
 * Electron Compatibility Layer for PhilJS Desktop
 *
 * This module provides Electron-like APIs on top of Tauri,
 * making it easier to migrate Electron apps to Tauri.
 *
 * Note: Not all Electron APIs are supported. This is a best-effort
 * compatibility layer for common use cases.
 */
export { BrowserWindow, WebContentsLike } from './browser-window.js';
export type { BrowserWindowOptions } from './browser-window.js';
export { ipcMain, ipcRenderer, contextBridge } from './ipc.js';
export type { IpcEvent } from './ipc.js';
export { app } from './app.js';
export { Dialog as dialog } from '../system/dialog.js';
export { Shell as shell } from '../system/shell.js';
export { Clipboard as clipboard } from '../system/clipboard.js';
export { Notification as Notification } from '../system/notification.js';
export { GlobalShortcut as globalShortcut } from '../system/shortcut.js';
export { SystemTray as Tray } from '../system/tray.js';
export { createMigrationHelper, ElectronToTauriMapper } from './migration.js';
//# sourceMappingURL=index.d.ts.map