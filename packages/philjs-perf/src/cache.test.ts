/**
 * Unit tests for LRU Cache
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { LRUCache, createLRU, withLRU } from './cache.js';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3);
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check key existence with has()', () => {
      cache.set('a', 1);

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('should update existing values', () => {
      cache.set('a', 1);
      cache.set('a', 100);

      expect(cache.get('a')).toBe(100);
      expect(cache.size).toBe(1);
    });

    it('should delete values', () => {
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.delete('a')).toBe(true);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.size).toBe(1);
    });

    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // Should evict 'a'

      expect(cache.size).toBe(3);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should move accessed items to head (most recent)', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Access 'a' to make it most recent
      cache.get('a');

      // Add 'd' - should evict 'b' (now oldest)
      cache.set('d', 4);

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should move updated items to head', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Update 'a' to make it most recent
      cache.set('a', 100);

      // Add 'd' - should evict 'b'
      cache.set('d', 4);

      expect(cache.get('a')).toBe(100);
      expect(cache.get('b')).toBeUndefined();
    });
  });

  describe('keys() and entries()', () => {
    it('should return keys in MRU order', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Most recent first: c, b, a
      expect(cache.keys()).toEqual(['c', 'b', 'a']);
    });

    it('should return entries in MRU order', () => {
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.entries()).toEqual([['b', 2], ['a', 1]]);
    });

    it('should reflect access order in keys()', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.get('a'); // Move 'a' to front

      expect(cache.keys()).toEqual(['a', 'c', 'b']);
    });
  });

  describe('edge cases', () => {
    it('should handle single-item cache', () => {
      const singleCache = new LRUCache<string, number>(1);

      singleCache.set('a', 1);
      expect(singleCache.get('a')).toBe(1);

      singleCache.set('b', 2);
      expect(singleCache.get('a')).toBeUndefined();
      expect(singleCache.get('b')).toBe(2);
    });

    it('should handle deleting head', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.delete('c'); // Delete head (most recent)

      expect(cache.keys()).toEqual(['b', 'a']);
    });

    it('should handle deleting tail', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.delete('a'); // Delete tail (oldest)

      expect(cache.keys()).toEqual(['c', 'b']);
    });

    it('should handle deleting middle node', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.delete('b');

      expect(cache.keys()).toEqual(['c', 'a']);
    });
  });
});

describe('createLRU', () => {
  it('should create an LRU cache', () => {
    const cache = createLRU<string, number>(5);

    cache.set('key', 42);
    expect(cache.get('key')).toBe(42);
  });
});

describe('withLRU', () => {
  it('should cache function results', () => {
    let callCount = 0;
    const expensive = (n: number): number => {
      callCount++;
      return n * 2;
    };

    const cached = withLRU(expensive, 3);

    expect(cached(5)).toBe(10);
    expect(cached(5)).toBe(10); // Cached
    expect(callCount).toBe(1);
  });

  it('should evict old entries', () => {
    let callCount = 0;
    const fn = (n: number): number => {
      callCount++;
      return n;
    };

    const cached = withLRU(fn, 2);

    cached(1);
    cached(2);
    cached(3); // Evicts 1

    cached(1); // Cache miss
    expect(callCount).toBe(4);
  });
});
