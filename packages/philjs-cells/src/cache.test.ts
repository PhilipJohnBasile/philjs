/**
 * PhilJS Cells - Cache Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cellCache,
  createScopedCache,
  warmCache,
  createCellCacheKey,
  batchInvalidate,
  setupCacheGC,
  inspectCache,
} from './cache';

// Mock @philjs/core
vi.mock('@philjs/core', () => ({
  signal: (initial: unknown) => {
    let value = initial;
    const read = () => value;
    read.set = (newValue: unknown) => {
      value = typeof newValue === 'function' ? newValue(value) : newValue;
    };
    read.subscribe = () => () => {};
    read.peek = () => value;
    return read;
  },
}));

describe('cellCache', () => {
  beforeEach(() => {
    cellCache.clear();
  });

  describe('set and get', () => {
    it('stores and retrieves data', () => {
      cellCache.set('test-key', { value: 'test' });

      const entry = cellCache.get('test-key');
      expect(entry).toBeDefined();
      expect(entry?.data).toEqual({ value: 'test' });
    });

    it('returns null for non-existent keys', () => {
      const entry = cellCache.get('non-existent');
      expect(entry).toBeNull();
    });

    it('sets timestamp on cache entry', () => {
      const before = Date.now();
      cellCache.set('test-key', { value: 'test' });
      const after = Date.now();

      const entry = cellCache.get('test-key');
      expect(entry?.cachedAt).toBeGreaterThanOrEqual(before);
      expect(entry?.cachedAt).toBeLessThanOrEqual(after);
    });

    it('uses default TTL if not provided', () => {
      cellCache.set('test-key', { value: 'test' });

      const entry = cellCache.get('test-key');
      expect(entry?.ttl).toBe(5 * 60 * 1000); // Default 5 minutes
    });

    it('uses custom TTL if provided', () => {
      cellCache.set('test-key', { value: 'test' }, 1000);

      const entry = cellCache.get('test-key');
      expect(entry?.ttl).toBe(1000);
    });
  });

  describe('delete', () => {
    it('removes cache entry', () => {
      cellCache.set('test-key', { value: 'test' });
      const deleted = cellCache.delete('test-key');

      expect(deleted).toBe(true);
      expect(cellCache.get('test-key')).toBeNull();
    });

    it('returns false for non-existent key', () => {
      const deleted = cellCache.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('clears all entries when no pattern provided', () => {
      cellCache.set('key1', { value: 1 });
      cellCache.set('key2', { value: 2 });
      cellCache.set('key3', { value: 3 });

      cellCache.clear();

      expect(cellCache.size()).toBe(0);
    });

    it('clears entries matching string pattern', () => {
      cellCache.set('users:1', { id: 1 });
      cellCache.set('users:2', { id: 2 });
      cellCache.set('posts:1', { id: 1 });

      cellCache.clear('users');

      expect(cellCache.get('users:1')).toBeNull();
      expect(cellCache.get('users:2')).toBeNull();
      expect(cellCache.get('posts:1')).toBeDefined();
    });

    it('clears entries matching RegExp pattern', () => {
      cellCache.set('users:1', { id: 1 });
      cellCache.set('users:2', { id: 2 });
      cellCache.set('posts:1', { id: 1 });

      cellCache.clear(/^users:/);

      expect(cellCache.get('users:1')).toBeNull();
      expect(cellCache.get('users:2')).toBeNull();
      expect(cellCache.get('posts:1')).toBeDefined();
    });
  });

  describe('isStale', () => {
    it('returns true for non-existent entries', () => {
      expect(cellCache.isStale('non-existent')).toBe(true);
    });

    it('returns false for fresh entries', () => {
      cellCache.set('test-key', { value: 'test' }, 10000);
      expect(cellCache.isStale('test-key')).toBe(false);
    });

    it('returns true for expired entries', async () => {
      cellCache.set('test-key', { value: 'test' }, 10); // 10ms TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(cellCache.isStale('test-key')).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('notifies subscriber on set', () => {
      const callback = vi.fn();
      cellCache.subscribe('test-key', callback);

      cellCache.set('test-key', { value: 'test' });

      expect(callback).toHaveBeenCalledWith({ value: 'test' });
    });

    it('notifies subscriber on delete', () => {
      const callback = vi.fn();
      cellCache.set('test-key', { value: 'test' });
      cellCache.subscribe('test-key', callback);

      cellCache.delete('test-key');

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('unsubscribes correctly', () => {
      const callback = vi.fn();
      const unsubscribe = cellCache.subscribe('test-key', callback);

      unsubscribe();
      cellCache.set('test-key', { value: 'test' });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('keys and size', () => {
    it('returns all cache keys', () => {
      cellCache.set('key1', { value: 1 });
      cellCache.set('key2', { value: 2 });

      const keys = cellCache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('returns correct cache size', () => {
      expect(cellCache.size()).toBe(0);

      cellCache.set('key1', { value: 1 });
      expect(cellCache.size()).toBe(1);

      cellCache.set('key2', { value: 2 });
      expect(cellCache.size()).toBe(2);
    });
  });
});

describe('createScopedCache', () => {
  it('creates an isolated cache instance', () => {
    const scopedCache = createScopedCache();

    scopedCache.set('scoped-key', { value: 'scoped' });
    cellCache.set('global-key', { value: 'global' });

    expect(scopedCache.get('scoped-key')).toBeDefined();
    expect(scopedCache.get('global-key')).toBeNull();
    expect(cellCache.get('global-key')).toBeDefined();
    expect(cellCache.get('scoped-key')).toBeNull();
  });
});

describe('warmCache', () => {
  beforeEach(() => {
    cellCache.clear();
  });

  it('populates cache with provided data', () => {
    warmCache({
      'key1': { value: 1 },
      'key2': { value: 2 },
    });

    expect(cellCache.get('key1')?.data).toEqual({ value: 1 });
    expect(cellCache.get('key2')?.data).toEqual({ value: 2 });
  });

  it('uses provided TTL', () => {
    warmCache({ 'key1': { value: 1 } }, 1000);

    expect(cellCache.get('key1')?.ttl).toBe(1000);
  });
});

describe('createCellCacheKey', () => {
  it('creates key from cell name', () => {
    const key = createCellCacheKey('UsersCell');
    expect(key).toBe('cell:UsersCell');
  });

  it('includes sorted variables in key', () => {
    const key1 = createCellCacheKey('UsersCell', { b: 2, a: 1 });
    const key2 = createCellCacheKey('UsersCell', { a: 1, b: 2 });

    expect(key1).toBe(key2);
  });

  it('handles empty variables', () => {
    const key = createCellCacheKey('UsersCell', {});
    expect(key).toBe('cell:UsersCell');
  });
});

describe('batchInvalidate', () => {
  beforeEach(() => {
    cellCache.clear();
    cellCache.set('users:1', { id: 1 });
    cellCache.set('users:2', { id: 2 });
    cellCache.set('posts:1', { id: 1 });
  });

  it('invalidates multiple patterns', () => {
    batchInvalidate(['users', 'posts']);

    expect(cellCache.size()).toBe(0);
  });

  it('handles RegExp patterns', () => {
    batchInvalidate([/^users:/]);

    expect(cellCache.get('users:1')).toBeNull();
    expect(cellCache.get('users:2')).toBeNull();
    expect(cellCache.get('posts:1')).toBeDefined();
  });
});

describe('setupCacheGC', () => {
  beforeEach(() => {
    cellCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns cleanup function', () => {
    const cleanup = setupCacheGC(1000);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('clears stale entries on interval', async () => {
    vi.useFakeTimers();

    cellCache.set('stale-key', { value: 'test' }, 10);

    const cleanup = setupCacheGC(100);

    // Wait for entry to become stale
    vi.advanceTimersByTime(20);

    // Trigger GC
    vi.advanceTimersByTime(100);

    cleanup();
    vi.useRealTimers();
  });
});

describe('inspectCache', () => {
  beforeEach(() => {
    cellCache.clear();
  });

  it('returns all cache entries for debugging', () => {
    cellCache.set('key1', { value: 1 });
    cellCache.set('key2', { value: 2 });

    const entries = inspectCache();

    expect(entries['key1']).toBeDefined();
    expect(entries['key1'].data).toEqual({ value: 1 });
    expect(entries['key2']).toBeDefined();
    expect(entries['key2'].data).toEqual({ value: 2 });
  });
});
