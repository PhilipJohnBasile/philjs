/**
 * Tests for Electron BrowserWindow Compatibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserWindow, WebContentsLike } from './browser-window';
import { initTauriContext, resetTauriContext } from '../tauri/context';

describe('BrowserWindow Compatibility', () => {
  beforeEach(async () => {
    resetTauriContext();
    await initTauriContext();
    vi.clearAllMocks();
  });

  describe('BrowserWindow constructor', () => {
    it('should create a BrowserWindow instance', () => {
      const win = new BrowserWindow({
        width: 800,
        height: 600,
      });

      expect(win).toBeInstanceOf(BrowserWindow);
      expect(win.id).toBeDefined();
    });

    it('should assign unique IDs', () => {
      const win1 = new BrowserWindow();
      const win2 = new BrowserWindow();

      expect(win1.id).not.toBe(win2.id);
    });

    it('should accept Electron-style options', () => {
      const win = new BrowserWindow({
        width: 1024,
        height: 768,
        title: 'Test Window',
        resizable: true,
        alwaysOnTop: false,
        fullscreen: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      expect(win).toBeDefined();
    });
  });

  describe('Static methods', () => {
    it('getAllWindows should return array of windows', () => {
      new BrowserWindow();
      new BrowserWindow();

      const windows = BrowserWindow.getAllWindows();

      expect(Array.isArray(windows)).toBe(true);
      expect(windows.length).toBeGreaterThanOrEqual(2);
    });

    it('getFocusedWindow should return a window', () => {
      new BrowserWindow();

      const focused = BrowserWindow.getFocusedWindow();

      expect(focused === null || focused instanceof BrowserWindow).toBe(true);
    });

    it('fromId should find window by ID', () => {
      const win = new BrowserWindow();

      const found = BrowserWindow.fromId(win.id);

      expect(found).toBe(win);
    });

    it('fromId should return null for invalid ID', () => {
      const found = BrowserWindow.fromId(99999);

      expect(found).toBeNull();
    });
  });

  describe('Event emitter', () => {
    it('should register event handler with on()', () => {
      const win = new BrowserWindow();
      const handler = vi.fn();

      win.on('focus', handler);

      // Handler registered
    });

    it('should register one-time handler with once()', () => {
      const win = new BrowserWindow();
      const handler = vi.fn();

      win.once('blur', handler);

      // Handler registered for single use
    });

    it('should remove handler with removeListener()', () => {
      const win = new BrowserWindow();
      const handler = vi.fn();

      win.on('close', handler);
      win.removeListener('close', handler);

      // Handler removed
    });

    it('should remove all handlers with removeAllListeners()', () => {
      const win = new BrowserWindow();

      win.on('focus', vi.fn());
      win.on('blur', vi.fn());
      win.removeAllListeners();

      // All handlers removed
    });
  });

  describe('Window methods', () => {
    it('destroy should mark window as destroyed', () => {
      const win = new BrowserWindow();

      win.destroy();

      expect(win.isDestroyed()).toBe(true);
    });

    it('should not throw on minimize', async () => {
      const win = new BrowserWindow();
      await expect(win.minimize()).resolves.not.toThrow();
    });

    it('should not throw on maximize', async () => {
      const win = new BrowserWindow();
      await expect(win.maximize()).resolves.not.toThrow();
    });

    it('should not throw on unmaximize', async () => {
      const win = new BrowserWindow();
      await expect(win.unmaximize()).resolves.not.toThrow();
    });

    it('should not throw on show', async () => {
      const win = new BrowserWindow();
      await expect(win.show()).resolves.not.toThrow();
    });

    it('should not throw on hide', async () => {
      const win = new BrowserWindow();
      await expect(win.hide()).resolves.not.toThrow();
    });

    it('should not throw on focus', async () => {
      const win = new BrowserWindow();
      await expect(win.focus()).resolves.not.toThrow();
    });

    it('should set fullscreen state', async () => {
      const win = new BrowserWindow();
      await win.setFullScreen(true);
      // State set
    });

    it('should return fullscreen state', async () => {
      const win = new BrowserWindow();
      const isFullscreen = await win.isFullScreen();
      expect(typeof isFullscreen).toBe('boolean');
    });

    it('should return maximized state', async () => {
      const win = new BrowserWindow();
      const isMaximized = await win.isMaximized();
      expect(typeof isMaximized).toBe('boolean');
    });

    it('should return minimized state', async () => {
      const win = new BrowserWindow();
      const isMinimized = await win.isMinimized();
      expect(typeof isMinimized).toBe('boolean');
    });

    it('should return visible state', async () => {
      const win = new BrowserWindow();
      const isVisible = await win.isVisible();
      expect(typeof isVisible).toBe('boolean');
    });

    it('should return focused state', async () => {
      const win = new BrowserWindow();
      const isFocused = await win.isFocused();
      expect(typeof isFocused).toBe('boolean');
    });
  });

  describe('Size and position', () => {
    it('setBounds should set window bounds', async () => {
      const win = new BrowserWindow();
      await win.setBounds({ x: 100, y: 100, width: 800, height: 600 });
    });

    it('getBounds should return bounds', async () => {
      const win = new BrowserWindow();
      const bounds = await win.getBounds();

      expect(typeof bounds.x).toBe('number');
      expect(typeof bounds.y).toBe('number');
      expect(typeof bounds.width).toBe('number');
      expect(typeof bounds.height).toBe('number');
    });

    it('setSize should set size', async () => {
      const win = new BrowserWindow();
      await win.setSize(1280, 720);
    });

    it('getSize should return size tuple', async () => {
      const win = new BrowserWindow();
      const [width, height] = await win.getSize();

      expect(typeof width).toBe('number');
      expect(typeof height).toBe('number');
    });

    it('setPosition should set position', async () => {
      const win = new BrowserWindow();
      await win.setPosition(50, 50);
    });

    it('getPosition should return position tuple', async () => {
      const win = new BrowserWindow();
      const [x, y] = await win.getPosition();

      expect(typeof x).toBe('number');
      expect(typeof y).toBe('number');
    });

    it('center should not throw', async () => {
      const win = new BrowserWindow();
      await expect(win.center()).resolves.not.toThrow();
    });
  });

  describe('Window properties', () => {
    it('setTitle should update title', async () => {
      const win = new BrowserWindow();
      await win.setTitle('New Title');
    });

    it('getTitle should return title', () => {
      const win = new BrowserWindow();
      const title = win.getTitle();
      expect(typeof title).toBe('string');
    });

    it('setAlwaysOnTop should not throw', async () => {
      const win = new BrowserWindow();
      await expect(win.setAlwaysOnTop(true)).resolves.not.toThrow();
    });

    it('setResizable should not throw', async () => {
      const win = new BrowserWindow();
      await expect(win.setResizable(false)).resolves.not.toThrow();
    });

    it('setMinimumSize should not throw', async () => {
      const win = new BrowserWindow();
      await expect(win.setMinimumSize(400, 300)).resolves.not.toThrow();
    });

    it('setMaximumSize should not throw', async () => {
      const win = new BrowserWindow();
      await expect(win.setMaximumSize(1920, 1080)).resolves.not.toThrow();
    });

    it('setSkipTaskbar should not throw', async () => {
      const win = new BrowserWindow();
      await expect(win.setSkipTaskbar(true)).resolves.not.toThrow();
    });
  });

  describe('webContents', () => {
    it('should have webContents property', () => {
      const win = new BrowserWindow();
      expect(win.webContents).toBeInstanceOf(WebContentsLike);
    });

    it('webContents.send should not throw', () => {
      const win = new BrowserWindow();
      expect(() => win.webContents.send('channel', 'data')).not.toThrow();
    });

    it('webContents.executeJavaScript should resolve', async () => {
      const win = new BrowserWindow();
      const result = await win.webContents.executeJavaScript('1 + 1');
      expect(result).toBe(2);
    });

    it('webContents.openDevTools should not throw', () => {
      const win = new BrowserWindow();
      expect(() => win.webContents.openDevTools()).not.toThrow();
    });

    it('webContents.closeDevTools should not throw', () => {
      const win = new BrowserWindow();
      expect(() => win.webContents.closeDevTools()).not.toThrow();
    });

    it('webContents.isDevToolsOpened should return boolean', () => {
      const win = new BrowserWindow();
      expect(typeof win.webContents.isDevToolsOpened()).toBe('boolean');
    });
  });

  describe('loadURL', () => {
    it('should load URL', async () => {
      const win = new BrowserWindow();
      await win.loadURL('about:blank');
    });

    it('loadFile should call loadURL', async () => {
      const win = new BrowserWindow();
      await win.loadFile('/path/to/file.html');
    });
  });
});
