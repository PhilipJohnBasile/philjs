/**
 * Unit tests for memoization utilities
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { memo, memoWeak, memoAsync, clearMemoCache } from './memo.js';

describe('memo', () => {
  it('should cache function results', () => {
    let callCount = 0;
    const expensive = (x: number, y: number): number => {
      callCount++;
      return x + y;
    };

    const memoized = memo(expensive);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3); // Cached
    expect(callCount).toBe(1);

    expect(memoized(3, 4)).toBe(7);
    expect(callCount).toBe(2);
  });

  it('should handle different argument types', () => {
    const fn = memo((a: string, b: number, c: boolean) => `${a}-${b}-${c}`);

    expect(fn('test', 42, true)).toBe('test-42-true');
    expect(fn('test', 42, true)).toBe('test-42-true'); // Cached
    expect(fn('test', 42, false)).toBe('test-42-false'); // Different args
  });

  it('should handle null and undefined arguments', () => {
    const fn = memo((a: string | null | undefined) => String(a));

    expect(fn(null)).toBe('null');
    expect(fn(undefined)).toBe('undefined');
    expect(fn('value')).toBe('value');
  });

  it('should respect maxSize option', () => {
    let callCount = 0;
    const fn = memo((x: number) => {
      callCount++;
      return x * 2;
    }, { maxSize: 2 });

    fn(1);
    fn(2);
    fn(3); // Should evict fn(1)

    fn(1); // Cache miss
    expect(callCount).toBe(4);
  });

  it('should respect TTL option', async () => {
    vi.useFakeTimers();
    let callCount = 0;

    const fn = memo((x: number) => {
      callCount++;
      return x;
    }, { ttl: 100 });

    fn(1);
    expect(callCount).toBe(1);

    fn(1); // Cached
    expect(callCount).toBe(1);

    vi.advanceTimersByTime(150);

    fn(1); // Expired, cache miss
    expect(callCount).toBe(2);

    vi.useRealTimers();
  });

  it('should support custom key function', () => {
    let callCount = 0;
    const fn = memo(
      (obj: { id: number }) => {
        callCount++;
        return obj.id * 2;
      },
      { keyFn: (obj) => String(obj.id) }
    );

    fn({ id: 1 });
    fn({ id: 1 }); // Cached (same id)
    expect(callCount).toBe(1);

    fn({ id: 2 });
    expect(callCount).toBe(2);
  });

  it('should expose clear method', () => {
    let callCount = 0;
    const fn = memo((x: number) => {
      callCount++;
      return x;
    });

    fn(1);
    expect(callCount).toBe(1);

    (fn as any).clear();

    fn(1); // Cache cleared
    expect(callCount).toBe(2);
  });

  it('should expose size method', () => {
    const fn = memo((x: number) => x);

    fn(1);
    fn(2);
    fn(3);

    expect((fn as any).size()).toBe(3);
  });

  it('should preserve this context', () => {
    const obj = {
      multiplier: 10,
      compute: memo(function(this: { multiplier: number }, x: number) {
        return x * this.multiplier;
      }),
    };

    expect(obj.compute(5)).toBe(50);
  });
});

describe('memoWeak', () => {
  it('should cache results for object keys', () => {
    let callCount = 0;
    const fn = memoWeak((obj: { value: number }) => {
      callCount++;
      return obj.value * 2;
    });

    const obj1 = { value: 5 };
    const obj2 = { value: 10 };

    expect(fn(obj1)).toBe(10);
    expect(fn(obj1)).toBe(10); // Cached
    expect(callCount).toBe(1);

    expect(fn(obj2)).toBe(20);
    expect(callCount).toBe(2);
  });

  it('should not cache for different object references', () => {
    let callCount = 0;
    const fn = memoWeak((obj: { value: number }) => {
      callCount++;
      return obj.value;
    });

    fn({ value: 1 });
    fn({ value: 1 }); // Different object reference

    expect(callCount).toBe(2);
  });
});

describe('memoAsync', () => {
  it('should cache async function results', async () => {
    let callCount = 0;
    const asyncFn = memoAsync(async (x: number) => {
      callCount++;
      return x * 2;
    });

    expect(await asyncFn(5)).toBe(10);
    expect(await asyncFn(5)).toBe(10); // Cached
    expect(callCount).toBe(1);
  });

  it('should deduplicate concurrent requests', async () => {
    let callCount = 0;
    const asyncFn = memoAsync(async (x: number) => {
      callCount++;
      await new Promise(r => setTimeout(r, 10));
      return x;
    });

    // Fire off concurrent requests
    const [r1, r2, r3] = await Promise.all([
      asyncFn(1),
      asyncFn(1),
      asyncFn(1),
    ]);

    expect(r1).toBe(1);
    expect(r2).toBe(1);
    expect(r3).toBe(1);
    expect(callCount).toBe(1); // Only one actual call
  });

  it('should respect TTL option', async () => {
    vi.useFakeTimers();
    let callCount = 0;

    const asyncFn = memoAsync(async (x: number) => {
      callCount++;
      return x;
    }, { ttl: 100 });

    await asyncFn(1);
    expect(callCount).toBe(1);

    await asyncFn(1); // Cached
    expect(callCount).toBe(1);

    vi.advanceTimersByTime(150);

    await asyncFn(1); // Expired
    expect(callCount).toBe(2);

    vi.useRealTimers();
  });

  it('should respect maxSize option', async () => {
    let callCount = 0;
    const asyncFn = memoAsync(async (x: number) => {
      callCount++;
      return x;
    }, { maxSize: 2 });

    await asyncFn(1);
    await asyncFn(2);
    await asyncFn(3); // Evicts 1

    await asyncFn(1); // Cache miss
    expect(callCount).toBe(4);
  });
});

describe('clearMemoCache', () => {
  it('should clear cache of memoized function', () => {
    let callCount = 0;
    const fn = memo((x: number) => {
      callCount++;
      return x;
    });

    fn(1);
    clearMemoCache(fn);
    fn(1);

    expect(callCount).toBe(2);
  });

  it('should handle non-memoized functions gracefully', () => {
    const regularFn = (x: number) => x;

    // Should not throw
    expect(() => clearMemoCache(regularFn)).not.toThrow();
  });
});
