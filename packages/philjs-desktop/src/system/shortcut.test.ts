/**
 * Tests for Global Shortcut APIs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GlobalShortcut,
  registerShortcut,
  unregisterShortcut,
  unregisterAllShortcuts,
  isShortcutRegistered,
} from './shortcut';
import { resetTauriContext, initTauriContext } from '../tauri/context';

describe('Global Shortcut APIs', () => {
  beforeEach(async () => {
    resetTauriContext();
    await initTauriContext();
    vi.clearAllMocks();

    // Clear registered shortcuts
    await GlobalShortcut.unregisterAll();
  });

  describe('GlobalShortcut.register', () => {
    it('should register a shortcut', async () => {
      const handler = vi.fn();

      const unregister = await GlobalShortcut.register('Control+A', handler);

      expect(typeof unregister).toBe('function');
    });

    it('should return unregister function', async () => {
      const handler = vi.fn();

      const unregister = await GlobalShortcut.register('Control+B', handler);
      unregister();

      expect(await GlobalShortcut.isRegistered('Control+B')).toBe(false);
    });

    it('should trigger handler on key event', async () => {
      const handler = vi.fn();

      await GlobalShortcut.register('Control+S', handler);

      // Simulate keyboard event
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalled();
    });

    it('should handle CommandOrControl modifier', async () => {
      const handler = vi.fn();

      await GlobalShortcut.register('CommandOrControl+Z', handler);

      // Should work with Ctrl
      const ctrlEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(ctrlEvent);

      expect(handler).toHaveBeenCalled();
    });

    it('should handle Shift modifier', async () => {
      const handler = vi.fn();

      await GlobalShortcut.register('Control+Shift+N', handler);

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalled();
    });

    it('should handle Alt modifier', async () => {
      const handler = vi.fn();

      await GlobalShortcut.register('Alt+F4', handler);

      const event = new KeyboardEvent('keydown', {
        key: 'F4',
        altKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('GlobalShortcut.registerAll', () => {
    it('should register multiple shortcuts', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const unregister = await GlobalShortcut.registerAll([
        { shortcut: 'Control+1', handler: handler1 },
        { shortcut: 'Control+2', handler: handler2 },
      ]);

      expect(typeof unregister).toBe('function');
      expect(await GlobalShortcut.isRegistered('Control+1')).toBe(true);
      expect(await GlobalShortcut.isRegistered('Control+2')).toBe(true);
    });

    it('should unregister all on cleanup', async () => {
      const unregister = await GlobalShortcut.registerAll([
        { shortcut: 'Control+3', handler: vi.fn() },
        { shortcut: 'Control+4', handler: vi.fn() },
      ]);

      unregister();

      expect(await GlobalShortcut.isRegistered('Control+3')).toBe(false);
      expect(await GlobalShortcut.isRegistered('Control+4')).toBe(false);
    });
  });

  describe('GlobalShortcut.unregister', () => {
    it('should unregister a shortcut', async () => {
      await GlobalShortcut.register('Control+X', vi.fn());

      await GlobalShortcut.unregister('Control+X');

      expect(await GlobalShortcut.isRegistered('Control+X')).toBe(false);
    });
  });

  describe('GlobalShortcut.unregisterAll', () => {
    it('should unregister all shortcuts', async () => {
      await GlobalShortcut.register('Control+A', vi.fn());
      await GlobalShortcut.register('Control+B', vi.fn());

      await GlobalShortcut.unregisterAll();

      expect(GlobalShortcut.getRegistered()).toEqual([]);
    });
  });

  describe('GlobalShortcut.isRegistered', () => {
    it('should return true for registered shortcut', async () => {
      await GlobalShortcut.register('Control+Y', vi.fn());

      expect(await GlobalShortcut.isRegistered('Control+Y')).toBe(true);
    });

    it('should return false for unregistered shortcut', async () => {
      expect(await GlobalShortcut.isRegistered('Control+NotRegistered')).toBe(false);
    });
  });

  describe('GlobalShortcut.getRegistered', () => {
    it('should return list of registered shortcuts', async () => {
      await GlobalShortcut.register('Control+Q', vi.fn());
      await GlobalShortcut.register('Control+W', vi.fn());

      const registered = GlobalShortcut.getRegistered();

      expect(registered).toContain('Control+Q');
      expect(registered).toContain('Control+W');
    });
  });

  describe('Convenience functions', () => {
    it('registerShortcut should register', async () => {
      const unregister = await registerShortcut('Alt+T', vi.fn());
      expect(typeof unregister).toBe('function');
    });

    it('unregisterShortcut should unregister', async () => {
      await registerShortcut('Alt+U', vi.fn());
      await unregisterShortcut('Alt+U');
      expect(await isShortcutRegistered('Alt+U')).toBe(false);
    });

    it('unregisterAllShortcuts should clear all', async () => {
      await registerShortcut('Alt+V', vi.fn());
      await unregisterAllShortcuts();
      expect(GlobalShortcut.getRegistered()).toEqual([]);
    });
  });
});
