/**
 * @philjs/desktop - Smoke Tests
 * Basic export verification and functionality tests
 */

import { describe, it, expect } from 'vitest';
import * as exports from '../index.js';

describe('@philjs/desktop', () => {
  describe('Export Verification', () => {
    it('should export Tauri integration', () => {
      expect(exports.initTauriContext).toBeDefined();
      expect(exports.useTauri).toBeDefined();
      expect(exports.isTauri).toBeDefined();
      expect(exports.createDesktopApp).toBeDefined();
      expect(exports.invoke).toBeDefined();
    });

    it('should export event functions', () => {
      expect(exports.listen).toBeDefined();
      expect(exports.once).toBeDefined();
      expect(exports.emit).toBeDefined();
      expect(exports.onTauriEvent).toBeDefined();
      expect(exports.TauriEvents).toBeDefined();
    });

    it('should export window management', () => {
      expect(exports.WindowHandle).toBeDefined();
      expect(exports.createWindow).toBeDefined();
      expect(exports.getCurrentWindow).toBeDefined();
      expect(exports.useWindow).toBeDefined();
      expect(exports.closeWindow).toBeDefined();
      expect(exports.minimizeWindow).toBeDefined();
      expect(exports.maximizeWindow).toBeDefined();
    });

    it('should export system APIs - Dialog', () => {
      expect(exports.Dialog).toBeDefined();
      expect(exports.openDialog).toBeDefined();
      expect(exports.saveDialog).toBeDefined();
      expect(exports.showMessage).toBeDefined();
      expect(exports.showConfirm).toBeDefined();
    });

    it('should export system APIs - FileSystem', () => {
      expect(exports.FileSystem).toBeDefined();
      expect(exports.readTextFile).toBeDefined();
      expect(exports.writeTextFile).toBeDefined();
      expect(exports.exists).toBeDefined();
      expect(exports.createDir).toBeDefined();
    });

    it('should export system APIs - Shell', () => {
      expect(exports.Shell).toBeDefined();
      expect(exports.openUrl).toBeDefined();
      expect(exports.openPath).toBeDefined();
      expect(exports.execute).toBeDefined();
    });

    it('should export system APIs - Clipboard', () => {
      expect(exports.Clipboard).toBeDefined();
      expect(exports.readClipboard).toBeDefined();
      expect(exports.writeClipboard).toBeDefined();
    });

    it('should export system APIs - Notification', () => {
      expect(exports.Notification).toBeDefined();
      expect(exports.showNotification).toBeDefined();
      expect(exports.notify).toBeDefined();
    });

    it('should export system APIs - GlobalShortcut', () => {
      expect(exports.GlobalShortcut).toBeDefined();
      expect(exports.registerShortcut).toBeDefined();
      expect(exports.unregisterShortcut).toBeDefined();
    });

    it('should export system APIs - SystemTray', () => {
      expect(exports.SystemTray).toBeDefined();
      expect(exports.createTray).toBeDefined();
      expect(exports.setTrayIcon).toBeDefined();
    });

    it('should export system APIs - AutoLaunch', () => {
      expect(exports.AutoLaunch).toBeDefined();
      expect(exports.enableAutoLaunch).toBeDefined();
      expect(exports.disableAutoLaunch).toBeDefined();
    });

    it('should export IPC bridge', () => {
      expect(exports.createIPCBridge).toBeDefined();
      expect(exports.registerCommand).toBeDefined();
      expect(exports.createChannel).toBeDefined();
    });

    it('should export lifecycle management', () => {
      expect(exports.initLifecycle).toBeDefined();
      expect(exports.onAppReady).toBeDefined();
      expect(exports.onWindowClose).toBeDefined();
      expect(exports.onBeforeQuit).toBeDefined();
      expect(exports.quitApp).toBeDefined();
      expect(exports.restartApp).toBeDefined();
    });
  });

  describe('isTauri', () => {
    it('should return boolean', () => {
      const result = exports.isTauri();
      expect(typeof result).toBe('boolean');
    });

    it('should return false in non-Tauri environment', () => {
      // In test environment, we're not running in Tauri
      expect(exports.isTauri()).toBe(false);
    });
  });

  describe('TauriEvents', () => {
    it('should define event names', () => {
      expect(exports.TauriEvents).toBeDefined();
      expect(typeof exports.TauriEvents).toBe('object');
    });
  });

  describe('Export Count', () => {
    it('should have substantial exports', () => {
      const exportCount = Object.keys(exports).length;
      expect(exportCount).toBeGreaterThan(50);
    });
  });
});
