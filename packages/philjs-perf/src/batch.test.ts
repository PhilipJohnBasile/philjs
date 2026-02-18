/**
 * Unit tests for batching utilities
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Scheduler, batch, batchAsync, createBatcher } from './batch.js';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();
  });

  it('should batch callbacks in the same microtask', async () => {
    const calls: number[] = [];

    scheduler.schedule(() => calls.push(1));
    scheduler.schedule(() => calls.push(2));
    scheduler.schedule(() => calls.push(3));

    expect(calls).toEqual([]); // Not executed yet

    await Promise.resolve(); // Wait for microtask

    expect(calls).toEqual([1, 2, 3]);
  });

  it('should clear pending callbacks', async () => {
    const calls: number[] = [];

    scheduler.schedule(() => calls.push(1));
    scheduler.clear();

    await Promise.resolve();

    expect(calls).toEqual([]);
  });
});

describe('batch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should batch multiple calls into one', async () => {
    let lastValue: number | undefined;
    const fn = batch((value: number) => {
      lastValue = value;
    });

    fn(1);
    fn(2);
    fn(3);

    await vi.advanceTimersByTimeAsync(0);

    expect(lastValue).toBe(3); // Only last value matters
  });

  it('should respect wait option', async () => {
    let callCount = 0;
    const fn = batch(() => {
      callCount++;
    }, { wait: 100 });

    fn();
    expect(callCount).toBe(0);

    await vi.advanceTimersByTimeAsync(50);
    fn();
    expect(callCount).toBe(0);

    await vi.advanceTimersByTimeAsync(100);
    expect(callCount).toBe(1);
  });

  it('should respect maxSize option', async () => {
    let callCount = 0;
    const fn = batch(() => {
      callCount++;
    }, { maxSize: 3, wait: 1000 });

    fn();
    fn();
    fn(); // Hit maxSize, should flush immediately

    expect(callCount).toBe(1);
  });

  it('should support leading option', async () => {
    let callCount = 0;
    const fn = batch(() => {
      callCount++;
    }, { leading: true, wait: 100 });

    fn(); // Leading call
    expect(callCount).toBe(1);

    fn();
    fn();
    expect(callCount).toBe(1);

    await vi.advanceTimersByTimeAsync(100);
    expect(callCount).toBe(2);
  });

  it('should expose flush method', async () => {
    let lastValue: number | undefined;
    const fn = batch((value: number) => {
      lastValue = value;
    }, { wait: 1000 });

    fn(42);
    (fn as any).flush();

    expect(lastValue).toBe(42);
  });
});

describe('batchAsync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should batch multiple async calls', async () => {
    let batchedItems: number[] = [];

    const batchedFn = batchAsync(async (items: number[]) => {
      batchedItems = items;
      return items.map(x => x * 2);
    });

    const p1 = batchedFn(1);
    const p2 = batchedFn(2);
    const p3 = batchedFn(3);

    await vi.advanceTimersByTimeAsync(0);

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(batchedItems).toEqual([1, 2, 3]);
    expect(r1).toBe(2);
    expect(r2).toBe(4);
    expect(r3).toBe(6);
  });

  it('should respect maxSize option', async () => {
    let batchCount = 0;

    const batchedFn = batchAsync(async (items: number[]) => {
      batchCount++;
      return items;
    }, { maxSize: 2 });

    batchedFn(1);
    batchedFn(2); // Should trigger flush
    batchedFn(3);
    batchedFn(4); // Should trigger second flush

    await vi.advanceTimersByTimeAsync(0);

    expect(batchCount).toBe(2);
  });

  it('should propagate errors to all pending promises', async () => {
    vi.useRealTimers(); // Use real timers for this test to avoid scheduler issues

    const batchedFn = batchAsync(async () => {
      throw new Error('Batch failed');
    }, { wait: 10 }); // Use small wait to trigger via setTimeout

    const p1 = batchedFn(1);
    const p2 = batchedFn(2);

    // Await both promises simultaneously to avoid unhandled rejections
    const results = await Promise.allSettled([p1, p2]);

    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('rejected');
    expect((results[0] as PromiseRejectedResult).reason.message).toBe('Batch failed');
    expect((results[1] as PromiseRejectedResult).reason.message).toBe('Batch failed');

    vi.useFakeTimers(); // Restore fake timers for other tests
  });

  it('should respect wait option', async () => {
    let batchCount = 0;

    const batchedFn = batchAsync(async (items: number[]) => {
      batchCount++;
      return items;
    }, { wait: 100 });

    batchedFn(1);

    await vi.advanceTimersByTimeAsync(50);
    expect(batchCount).toBe(0);

    batchedFn(2);

    await vi.advanceTimersByTimeAsync(100);
    expect(batchCount).toBe(1);
  });
});

describe('createBatcher', () => {
  it('should batch items manually', () => {
    const batcher = createBatcher<number, number>(
      (items) => items.map(x => x * 2)
    );

    batcher.add(1);
    batcher.add(2);
    batcher.add(3);

    expect(batcher.size()).toBe(3);

    const results = batcher.flush();

    expect(results).toEqual([2, 4, 6]);
    expect(batcher.size()).toBe(0);
  });

  it('should auto-flush at maxSize', () => {
    let flushCount = 0;
    const batcher = createBatcher<number, number>(
      (items) => {
        flushCount++;
        return items;
      },
      { maxSize: 2 }
    );

    batcher.add(1);
    expect(flushCount).toBe(0);

    batcher.add(2); // Triggers auto-flush
    expect(flushCount).toBe(1);
  });

  it('should handle empty flush', () => {
    const batcher = createBatcher<number, number>(
      (items) => items
    );

    const results = batcher.flush();
    expect(results).toEqual([]);
  });
});
