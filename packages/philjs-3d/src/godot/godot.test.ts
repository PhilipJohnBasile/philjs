/**
 * @file Godot Integration Tests
 * @description Comprehensive tests for Godot HTML5 export integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Godot engine
const mockGodotJS = {
  call: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  hasNode: vi.fn(),
  getTree: vi.fn(),
};

const mockEngine = {
  startGame: vi.fn(() => Promise.resolve()),
  init: vi.fn(() => Promise.resolve()),
  isRunning: vi.fn(() => true),
  canvas: document.createElement('canvas'),
};

// Setup window mocks
beforeEach(() => {
  (window as Record<string, unknown>).Engine = vi.fn(() => mockEngine);
  (window as Record<string, unknown>).godot = mockGodotJS;
});

afterEach(() => {
  delete (window as Record<string, unknown>).Engine;
  delete (window as Record<string, unknown>).godot;
  vi.clearAllMocks();
});

import {
  createGodotInstance,
  useGodot,
  callGodot,
  onGodotSignal,
  disposeGodot,
  syncToGodot,
  syncFromGodot,
  createGodotBridge,
} from './hooks';

describe('Godot Integration', () => {
  describe('useGodot', () => {
    it('should return empty result for null canvas', () => {
      const result = useGodot(null);
      expect(result.godot).toBeNull();
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should return state for valid canvas', () => {
      const canvas = document.createElement('canvas');
      const result = useGodot(canvas);
      expect(result.godot).toBeNull(); // Not initialized yet
      expect(typeof result.callGodot).toBe('function');
      expect(typeof result.onGodotSignal).toBe('function');
    });
  });

  describe('callGodot', () => {
    it('should handle uninitialized canvas', () => {
      const canvas = document.createElement('canvas');
      const result = callGodot(canvas, '/root/Player', 'take_damage', 10);
      expect(result).toBeUndefined();
    });
  });

  describe('onGodotSignal', () => {
    it('should return cleanup function', () => {
      const canvas = document.createElement('canvas');
      const callback = vi.fn();
      const cleanup = onGodotSignal(canvas, '/root/Player', 'health_changed', callback);
      expect(typeof cleanup).toBe('function');
    });
  });

  describe('disposeGodot', () => {
    it('should cleanup canvas state', () => {
      const canvas = document.createElement('canvas');
      expect(() => disposeGodot(canvas)).not.toThrow();
    });
  });

  describe('syncToGodot', () => {
    it('should create sync function', () => {
      const canvas = document.createElement('canvas');
      const getValue = vi.fn(() => 100);
      const cleanup = syncToGodot(canvas, '/root/Player', 'health', getValue);
      expect(typeof cleanup).toBe('function');
    });
  });

  describe('syncFromGodot', () => {
    it('should create sync subscription', () => {
      const canvas = document.createElement('canvas');
      const setValue = vi.fn();
      const cleanup = syncFromGodot(canvas, '/root/Player', 'health_changed', setValue);
      expect(typeof cleanup).toBe('function');
    });
  });

  describe('createGodotBridge', () => {
    it('should create bidirectional bridge', () => {
      const canvas = document.createElement('canvas');
      const getValue = vi.fn(() => 100);
      const setValue = vi.fn();

      const cleanup = createGodotBridge(canvas, '/root/Player', {
        property: 'health',
        signal: 'health_changed',
        getValue,
        setValue,
      });

      expect(typeof cleanup).toBe('function');
    });
  });
});

describe('GodotEmbed Component', () => {
  it('should export GodotEmbed', async () => {
    const { GodotEmbed } = await import('./GodotEmbed');
    expect(GodotEmbed).toBeDefined();
  });

  it('should export createGodotEmbedElement', async () => {
    const { createGodotEmbedElement } = await import('./GodotEmbed');
    expect(createGodotEmbedElement).toBeDefined();
  });

  it('should export GodotLoadingIndicator', async () => {
    const { GodotLoadingIndicator } = await import('./GodotEmbed');
    expect(GodotLoadingIndicator).toBeDefined();
  });
});

describe('Godot Types', () => {
  it('should export types', async () => {
    const types = await import('./types');
    expect(types).toBeDefined();
  });
});
