/**
 * Tests for Window Management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  WindowHandle,
  createWindow,
  getCurrentWindow,
  useWindow,
  getAllWindows,
  getWindow,
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  setTitle,
  setSize,
  setFullscreen,
  setAlwaysOnTop,
  center,
  setPosition,
  getPrimaryMonitor,
  getAllMonitors,
} from './window';
import { initTauriContext, resetTauriContext } from './tauri/context';

describe('Window Management', () => {
  beforeEach(async () => {
    resetTauriContext();
    await initTauriContext();
    vi.clearAllMocks();
  });

  describe('WindowHandle', () => {
    it('should create window handle with label', () => {
      const handle = new WindowHandle('test-window');
      expect(handle.getLabel()).toBe('test-window');
    });

    it('should set title in browser mode', async () => {
      const handle = new WindowHandle('test');
      await handle.setTitle('New Title');
      expect(document.title).toBe('New Title');
    });

    it('should get size in browser mode', async () => {
      const handle = new WindowHandle('test');
      const size = await handle.getSize();

      expect(typeof size.width).toBe('number');
      expect(typeof size.height).toBe('number');
    });

    it('should get position in browser mode', async () => {
      const handle = new WindowHandle('test');
      const pos = await handle.getPosition();

      expect(typeof pos.x).toBe('number');
      expect(typeof pos.y).toBe('number');
    });

    it('should check visibility', async () => {
      const handle = new WindowHandle('test');
      const visible = await handle.isVisible();
      expect(typeof visible).toBe('boolean');
    });

    it('should check fullscreen state', async () => {
      const handle = new WindowHandle('test');
      const fullscreen = await handle.isFullscreen();
      expect(typeof fullscreen).toBe('boolean');
    });

    it('should check focus state', async () => {
      const handle = new WindowHandle('test');
      const focused = await handle.isFocused();
      expect(typeof focused).toBe('boolean');
    });

    it('should get complete window state', async () => {
      const handle = new WindowHandle('test');
      const state = await handle.getState();

      expect(state.label).toBe('test');
      expect(state.size).toBeDefined();
      expect(state.position).toBeDefined();
      expect(typeof state.isVisible).toBe('boolean');
      expect(typeof state.isMaximized).toBe('boolean');
      expect(typeof state.isMinimized).toBe('boolean');
      expect(typeof state.isFullscreen).toBe('boolean');
      expect(typeof state.isFocused).toBe('boolean');
    });
  });

  describe('createWindow', () => {
    it('should create a new window with options', async () => {
      const win = await createWindow({
        label: 'new-window',
        title: 'Test Window',
        width: 800,
        height: 600,
      });

      expect(win).toBeInstanceOf(WindowHandle);
      expect(win.getLabel()).toBe('new-window');
    });

    it('should generate label if not provided', async () => {
      const win = await createWindow({ title: 'Auto Label' });
      expect(win.getLabel()).toMatch(/^window-\d+$/);
    });

    it('should throw if window with same label exists', async () => {
      await createWindow({ label: 'duplicate' });

      await expect(createWindow({ label: 'duplicate' })).rejects.toThrow(
        'Window with label "duplicate" already exists'
      );
    });
  });

  describe('getCurrentWindow', () => {
    it('should return current window handle', async () => {
      const win = await getCurrentWindow();
      expect(win).toBeInstanceOf(WindowHandle);
    });

    it('should return same instance on multiple calls', async () => {
      const win1 = await getCurrentWindow();
      const win2 = await getCurrentWindow();
      expect(win1).toBe(win2);
    });
  });

  describe('useWindow', () => {
    it('should return window handle', () => {
      const win = useWindow();
      expect(win).toBeInstanceOf(WindowHandle);
    });
  });

  describe('getAllWindows', () => {
    it('should return array of windows', async () => {
      await createWindow({ label: 'win1' });
      await createWindow({ label: 'win2' });

      const windows = await getAllWindows();
      expect(Array.isArray(windows)).toBe(true);
      expect(windows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getWindow', () => {
    it('should return window by label', async () => {
      await createWindow({ label: 'findable' });

      const win = await getWindow('findable');
      expect(win).not.toBeNull();
      expect(win?.getLabel()).toBe('findable');
    });

    it('should return null for non-existent window', async () => {
      const win = await getWindow('non-existent');
      expect(win).toBeNull();
    });
  });

  describe('Window control functions', () => {
    it('setTitle should update title', async () => {
      await setTitle('Updated Title');
      expect(document.title).toBe('Updated Title');
    });

    it('setSize should not throw', async () => {
      await expect(setSize(1280, 720)).resolves.not.toThrow();
    });

    it('setFullscreen should not throw', async () => {
      await expect(setFullscreen(true)).resolves.not.toThrow();
    });

    it('setAlwaysOnTop should not throw', async () => {
      await expect(setAlwaysOnTop(true)).resolves.not.toThrow();
    });

    it('center should not throw', async () => {
      await expect(center()).resolves.not.toThrow();
    });

    it('setPosition should not throw', async () => {
      await expect(setPosition(100, 100)).resolves.not.toThrow();
    });

    it('minimizeWindow should not throw', async () => {
      await expect(minimizeWindow()).resolves.not.toThrow();
    });

    it('maximizeWindow should not throw', async () => {
      await expect(maximizeWindow()).resolves.not.toThrow();
    });

    it('closeWindow should not throw', async () => {
      await expect(closeWindow()).resolves.not.toThrow();
    });
  });

  describe('Monitor functions', () => {
    it('getPrimaryMonitor should return null in browser', async () => {
      const monitor = await getPrimaryMonitor();
      // Returns null in non-Tauri environment
      expect(monitor).toBeNull();
    });

    it('getAllMonitors should return empty array in browser', async () => {
      const monitors = await getAllMonitors();
      expect(monitors).toEqual([]);
    });
  });
});
