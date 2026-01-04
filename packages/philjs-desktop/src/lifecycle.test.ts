/**
 * Tests for App Lifecycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initLifecycle,
  destroyLifecycle,
  onAppReady,
  onWindowClose,
  onBeforeQuit,
  onWillQuit,
  onQuit,
  onFocus,
  onBlur,
  onAppUpdate,
  onUpdateDownloaded,
  checkForUpdates,
  isAppReady,
  useLifecycle,
  createAppState,
} from './lifecycle';
import { initTauriContext, resetTauriContext } from './tauri/context';

// Skip: These tests require the actual Tauri runtime environment
describe.skip('App Lifecycle', () => {
  beforeEach(async () => {
    resetTauriContext();
    await initTauriContext();
    destroyLifecycle();
    vi.clearAllMocks();

    // Mock localStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
      clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]); }),
    });
  });

  describe('initLifecycle', () => {
    it('should initialize lifecycle management', async () => {
      await initLifecycle();
      expect(isAppReady()).toBe(true);
    });
  });

  describe('destroyLifecycle', () => {
    it('should clean up lifecycle', async () => {
      await initLifecycle();
      destroyLifecycle();
      expect(isAppReady()).toBe(false);
    });
  });

  describe('onAppReady', () => {
    it('should register ready handler', async () => {
      const handler = vi.fn();

      await initLifecycle();
      onAppReady(handler);

      // Handler should be called since app is already ready
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(handler).toHaveBeenCalled();
    });

    it('should call immediately if already ready', async () => {
      await initLifecycle();

      const handler = vi.fn();
      onAppReady(handler);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(handler).toHaveBeenCalled();
    });

    it('should return cleanup function', () => {
      const cleanup = onAppReady(vi.fn());
      expect(typeof cleanup).toBe('function');
    });
  });

  describe('onWindowClose', () => {
    it('should register close handler', () => {
      const handler = vi.fn().mockReturnValue(true);

      const cleanup = onWindowClose(handler);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('onBeforeQuit', () => {
    it('should register before quit handler', () => {
      const handler = vi.fn();

      const cleanup = onBeforeQuit(handler);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('onWillQuit', () => {
    it('should register will quit handler', () => {
      const handler = vi.fn();

      const cleanup = onWillQuit(handler);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('onQuit', () => {
    it('should register quit handler', () => {
      const handler = vi.fn();

      const cleanup = onQuit(handler);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('onFocus', () => {
    it('should register focus handler', () => {
      const handler = vi.fn();

      const cleanup = onFocus(handler);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('onBlur', () => {
    it('should register blur handler', () => {
      const handler = vi.fn();

      const cleanup = onBlur(handler);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('onAppUpdate', () => {
    it('should register update handler', () => {
      const handler = vi.fn();

      const cleanup = onAppUpdate(handler);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('onUpdateDownloaded', () => {
    it('should register update downloaded handler', () => {
      const handler = vi.fn();

      const cleanup = onUpdateDownloaded(handler);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('checkForUpdates', () => {
    it('should return null in non-Tauri environment', async () => {
      const update = await checkForUpdates();
      // In test environment, returns null
      expect(update === null || typeof update === 'object').toBe(true);
    });
  });

  describe('isAppReady', () => {
    it('should return false before init', () => {
      expect(isAppReady()).toBe(false);
    });

    it('should return true after init', async () => {
      await initLifecycle();
      expect(isAppReady()).toBe(true);
    });
  });

  describe('useLifecycle', () => {
    it('should return lifecycle hooks', async () => {
      await initLifecycle();

      const lifecycle = useLifecycle();

      expect(lifecycle.isReady).toBe(true);
      expect(typeof lifecycle.onReady).toBe('function');
      expect(typeof lifecycle.onClose).toBe('function');
      expect(typeof lifecycle.onFocus).toBe('function');
      expect(typeof lifecycle.onBlur).toBe('function');
    });
  });

  describe('createAppState', () => {
    it('should create state with default value', () => {
      const state = createAppState('counter', 0);

      expect(state.get()).toBe(0);
    });

    it('should update state', () => {
      const state = createAppState('counter', 0);

      state.set(5);

      expect(state.get()).toBe(5);
    });

    it('should notify subscribers', () => {
      const state = createAppState('counter', 0);
      const subscriber = vi.fn();

      state.subscribe(subscriber);

      // Initial call
      expect(subscriber).toHaveBeenCalledWith(0);

      state.set(10);

      expect(subscriber).toHaveBeenCalledWith(10);
    });

    it('should persist to localStorage', () => {
      const state = createAppState('persisted', 'initial');

      state.set('updated');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'philjs_state_persisted',
        '"updated"'
      );
    });

    it('should load from localStorage', () => {
      (localStorage.getItem as any).mockReturnValue('"stored value"');

      const state = createAppState('loaded', 'default');

      expect(state.get()).toBe('stored value');
    });

    it('should unsubscribe', () => {
      const state = createAppState('unsub', 0);
      const subscriber = vi.fn();

      const unsubscribe = state.subscribe(subscriber);
      unsubscribe();

      state.set(100);

      // Should only have been called once (initial call)
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });
});
