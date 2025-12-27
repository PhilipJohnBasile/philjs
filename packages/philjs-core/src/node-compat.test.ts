/**
 * Node.js Compatibility Tests
 *
 * These tests verify that the codebase works correctly on Node 24 and Node 25.
 * They test Node.js APIs that are used throughout the PhilJS codebase.
 */
import { describe, it, expect } from 'vitest';

describe('Node.js Compatibility', () => {
  describe('Version Requirements', () => {
    it('should be running Node 24 or higher', () => {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
      expect(majorVersion).toBeGreaterThanOrEqual(24);
    });

    it('should report correct Node version format', () => {
      expect(process.version).toMatch(/^v\d+\.\d+\.\d+/);
    });
  });

  describe('ES Module Support', () => {
    it('should support dynamic imports', async () => {
      const module = await import('./signals.js');
      expect(module).toBeDefined();
      expect(typeof module.signal).toBe('function');
    });
  });

  describe('Web APIs Available in Node', () => {
    it('should have global fetch', () => {
      expect(typeof globalThis.fetch).toBe('function');
    });

    it('should have global URL', () => {
      expect(typeof globalThis.URL).toBe('function');
      const url = new URL('https://example.com/path?query=1');
      expect(url.hostname).toBe('example.com');
      expect(url.pathname).toBe('/path');
    });

    it('should have global URLSearchParams', () => {
      expect(typeof globalThis.URLSearchParams).toBe('function');
      const params = new URLSearchParams('a=1&b=2');
      expect(params.get('a')).toBe('1');
    });

    it('should have TextEncoder and TextDecoder', () => {
      expect(typeof globalThis.TextEncoder).toBe('function');
      expect(typeof globalThis.TextDecoder).toBe('function');

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const encoded = encoder.encode('Hello');
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe('Hello');
    });

    it('should have global crypto', () => {
      expect(typeof globalThis.crypto).toBe('object');
      expect(typeof globalThis.crypto.randomUUID).toBe('function');
      expect(typeof globalThis.crypto.getRandomValues).toBe('function');
    });

    it('should generate valid UUIDs', () => {
      const uuid = globalThis.crypto.randomUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should have Web Streams API', () => {
      expect(typeof globalThis.ReadableStream).toBe('function');
      expect(typeof globalThis.WritableStream).toBe('function');
      expect(typeof globalThis.TransformStream).toBe('function');
    });
  });

  describe('Promise APIs', () => {
    it('should support Promise.withResolvers', () => {
      // Promise.withResolvers is available in Node 22+
      expect(typeof Promise.withResolvers).toBe('function');

      const { promise, resolve, reject } = Promise.withResolvers<string>();
      expect(promise).toBeInstanceOf(Promise);
      expect(typeof resolve).toBe('function');
      expect(typeof reject).toBe('function');
    });

    it('should support Promise.allSettled', async () => {
      const results = await Promise.allSettled([
        Promise.resolve(1),
        Promise.reject(new Error('test')),
        Promise.resolve(3)
      ]);

      expect(results[0]).toEqual({ status: 'fulfilled', value: 1 });
      expect(results[1].status).toBe('rejected');
      expect(results[2]).toEqual({ status: 'fulfilled', value: 3 });
    });
  });

  describe('Array/Object Modern Methods', () => {
    it('should support Array.prototype.at', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.at(0)).toBe(1);
      expect(arr.at(-1)).toBe(5);
      expect(arr.at(-2)).toBe(4);
    });

    it('should support Object.hasOwn', () => {
      const obj = { a: 1 };
      expect(Object.hasOwn(obj, 'a')).toBe(true);
      expect(Object.hasOwn(obj, 'b')).toBe(false);
    });

    it('should support structuredClone', () => {
      const original = { a: 1, b: { c: 2 }, d: [1, 2, 3] };
      const cloned = structuredClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.d).not.toBe(original.d);
    });

    it('should support Array.prototype.findLast', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.findLast(x => x % 2 === 0)).toBe(4);
    });

    it('should support Array.prototype.toReversed', () => {
      const arr = [1, 2, 3];
      const reversed = arr.toReversed();
      expect(reversed).toEqual([3, 2, 1]);
      expect(arr).toEqual([1, 2, 3]); // Original unchanged
    });

    it('should support Array.prototype.toSorted', () => {
      const arr = [3, 1, 2];
      const sorted = arr.toSorted();
      expect(sorted).toEqual([1, 2, 3]);
      expect(arr).toEqual([3, 1, 2]); // Original unchanged
    });

    it('should support Array.prototype.toSpliced', () => {
      const arr = [1, 2, 3, 4];
      const spliced = arr.toSpliced(1, 2, 'a', 'b');
      expect(spliced).toEqual([1, 'a', 'b', 4]);
      expect(arr).toEqual([1, 2, 3, 4]); // Original unchanged
    });

    it('should support Array.prototype.with', () => {
      const arr = [1, 2, 3];
      const updated = arr.with(1, 'two');
      expect(updated).toEqual([1, 'two', 3]);
      expect(arr).toEqual([1, 2, 3]); // Original unchanged
    });
  });

  describe('Process and Environment', () => {
    it('should have process.version', () => {
      expect(typeof process.version).toBe('string');
      expect(process.version.startsWith('v')).toBe(true);
    });

    it('should have process.platform', () => {
      expect(typeof process.platform).toBe('string');
      expect(['darwin', 'linux', 'win32', 'freebsd', 'openbsd', 'sunos', 'aix']).toContain(process.platform);
    });

    it('should have process.cwd', () => {
      expect(typeof process.cwd).toBe('function');
      expect(typeof process.cwd()).toBe('string');
    });
  });
});
