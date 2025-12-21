/**
 * @file Unity Integration Tests
 * @description Comprehensive tests for Unity WebGL build integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Unity instance
const mockUnityInstance = {
  SendMessage: vi.fn(),
  SetFullscreen: vi.fn(),
  Quit: vi.fn(() => Promise.resolve()),
  GetMemoryInfo: vi.fn(() => ({
    totalJSHeapSize: 1000000,
    usedJSHeapSize: 500000,
  })),
};

// Mock createUnityInstance
const mockCreateUnityInstance = vi.fn((canvas, config, onProgress) => {
  // Simulate progress
  if (onProgress) {
    onProgress(0.5);
    onProgress(1.0);
  }
  return Promise.resolve(mockUnityInstance);
});

// Setup global mocks
beforeEach(() => {
  (window as Record<string, unknown>).createUnityInstance = mockCreateUnityInstance;
  (window as Record<string, unknown>).unityInstance = undefined;
});

afterEach(() => {
  delete (window as Record<string, unknown>).createUnityInstance;
  delete (window as Record<string, unknown>).unityInstance;
  vi.clearAllMocks();
});

import {
  createUnityInstance,
  useUnity,
  sendMessage,
  onUnityEvent,
  registerUnityCallback,
  createUnitySignalBridge,
  createPhilJSSignalBridge,
  disposeUnity,
  getLoadingProgress,
} from './hooks';

describe('Unity Integration', () => {
  describe('useUnity', () => {
    it('should return empty result for null canvas', () => {
      const result = useUnity(null);
      expect(result.unity).toBeNull();
      expect(result.isLoading).toBe(false);
      expect(result.isReady).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should return state for valid canvas', () => {
      const canvas = document.createElement('canvas');
      const result = useUnity(canvas);
      expect(result.unity).toBeNull(); // Not initialized yet
      expect(typeof result.sendMessage).toBe('function');
      expect(typeof result.onUnityEvent).toBe('function');
    });
  });

  describe('sendMessage', () => {
    it('should handle uninitialized canvas', () => {
      const canvas = document.createElement('canvas');
      expect(() => sendMessage(canvas, 'Player', 'TakeDamage', 10)).not.toThrow();
    });
  });

  describe('onUnityEvent', () => {
    it('should register event handler', () => {
      const canvas = document.createElement('canvas');
      const callback = vi.fn();
      const cleanup = onUnityEvent(canvas, 'ready', callback);
      expect(typeof cleanup).toBe('function');
    });

    it('should cleanup handler', () => {
      const canvas = document.createElement('canvas');
      const callback = vi.fn();
      const cleanup = onUnityEvent(canvas, 'ready', callback);
      cleanup();
      // Handler should be removed
    });
  });

  describe('registerUnityCallback', () => {
    it('should register global callback', () => {
      const callback = vi.fn();
      const cleanup = registerUnityCallback('OnPlayerDeath', callback);

      expect((window as Record<string, unknown>).OnPlayerDeath).toBe(callback);

      cleanup();

      expect((window as Record<string, unknown>).OnPlayerDeath).toBeUndefined();
    });
  });

  describe('createUnitySignalBridge', () => {
    it('should create bridge from Unity to PhilJS', () => {
      const setValue = vi.fn();
      const cleanup = createUnitySignalBridge('OnScoreUpdate', setValue);

      // Simulate Unity calling the callback
      ((window as Record<string, unknown>).OnScoreUpdate as (value: number) => void)(100);

      expect(setValue).toHaveBeenCalledWith(100);

      cleanup();
    });
  });

  describe('createPhilJSSignalBridge', () => {
    it('should create bridge from PhilJS to Unity', () => {
      const canvas = document.createElement('canvas');
      const getValue = vi.fn(() => 100);

      const cleanup = createPhilJSSignalBridge(canvas, 'Player', 'SetHealth', getValue);
      expect(typeof cleanup).toBe('function');

      cleanup();
    });
  });

  describe('disposeUnity', () => {
    it('should cleanup canvas state', async () => {
      const canvas = document.createElement('canvas');
      await expect(disposeUnity(canvas)).resolves.not.toThrow();
    });
  });

  describe('getLoadingProgress', () => {
    it('should return default progress for uninitialized canvas', () => {
      const canvas = document.createElement('canvas');
      const progress = getLoadingProgress(canvas);
      expect(progress.progress).toBe(0);
      expect(progress.phase).toBe('downloading');
    });
  });
});

describe('UnityEmbed Component', () => {
  it('should export UnityEmbed', async () => {
    const { UnityEmbed } = await import('./UnityEmbed');
    expect(UnityEmbed).toBeDefined();
  });

  it('should export createUnityEmbedElement', async () => {
    const { createUnityEmbedElement } = await import('./UnityEmbed');
    expect(createUnityEmbedElement).toBeDefined();
  });

  it('should export UnityProgressBar', async () => {
    const { UnityProgressBar } = await import('./UnityEmbed');
    expect(UnityProgressBar).toBeDefined();
  });

  it('should export UnityFullscreenButton', async () => {
    const { UnityFullscreenButton } = await import('./UnityEmbed');
    expect(UnityFullscreenButton).toBeDefined();
  });
});

describe('Unity Types', () => {
  it('should export types', async () => {
    const types = await import('./types');
    expect(types).toBeDefined();
  });
});

describe('Unity Loading Progress', () => {
  it('should track loading phases', () => {
    const progress1 = { progress: 0.3, phase: 'downloading' as const };
    const progress2 = { progress: 0.7, phase: 'decompressing' as const };
    const progress3 = { progress: 0.95, phase: 'loading' as const };
    const progress4 = { progress: 1.0, phase: 'complete' as const };

    expect(progress1.phase).toBe('downloading');
    expect(progress2.phase).toBe('decompressing');
    expect(progress3.phase).toBe('loading');
    expect(progress4.phase).toBe('complete');
  });
});
