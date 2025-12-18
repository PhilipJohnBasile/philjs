/**
 * Tests for signal testing utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockSignal,
  createMockComputed,
  signalValue,
  waitForSignal,
  waitForSignalValue,
  assertSignalHistory,
} from '../src/signals';

describe('createMockSignal', () => {
  it('creates a signal with initial value', () => {
    const sig = createMockSignal(0);
    expect(sig.get()).toBe(0);
  });

  it('updates signal value', () => {
    const sig = createMockSignal(0);
    sig.set(5);
    expect(sig.get()).toBe(5);
  });

  it('supports update function', () => {
    const sig = createMockSignal(0);
    sig.update(n => n + 1);
    expect(sig.get()).toBe(1);
  });

  it('tracks history of values', () => {
    const sig = createMockSignal(0);
    sig.set(1);
    sig.set(2);
    sig.set(3);

    const history = sig.getHistory();
    expect(history).toEqual([0, 1, 2, 3]);
  });

  it('tracks call count', () => {
    const sig = createMockSignal(0);

    expect(sig.getCallCount()).toBe(0);

    sig.get();
    sig.get();
    sig.get();

    expect(sig.getCallCount()).toBe(3);
  });

  it('supports subscription', () => {
    const sig = createMockSignal(0);
    const values: number[] = [];

    const unsubscribe = sig.subscribe(value => {
      values.push(value);
    });

    sig.set(1);
    sig.set(2);

    expect(values).toEqual([1, 2]);

    unsubscribe();
    sig.set(3);

    expect(values).toEqual([1, 2]); // 3 not included
  });

  it('resets to initial state', () => {
    const sig = createMockSignal(0);

    sig.set(1);
    sig.set(2);
    sig.get();
    sig.get();

    sig.reset();

    expect(sig.get()).toBe(0);
    expect(sig.getHistory()).toEqual([0]);
    expect(sig.getCallCount()).toBe(1); // Reset + 1 call
  });
});

describe('createMockComputed', () => {
  it('creates computed signal', () => {
    let value = 5;
    const computed = createMockComputed(() => value * 2);

    expect(computed.get()).toBe(10);
  });

  it('recomputes on access', () => {
    let value = 5;
    const computed = createMockComputed(() => value * 2);

    expect(computed.get()).toBe(10);

    value = 10;
    expect(computed.get()).toBe(20);
  });

  it('tracks history of computed values', () => {
    let value = 1;
    const computed = createMockComputed(() => value * 2);

    computed.get(); // 2
    value = 2;
    computed.get(); // 4
    value = 3;
    computed.get(); // 6

    const history = computed.getHistory();
    expect(history).toContain(2);
    expect(history).toContain(4);
    expect(history).toContain(6);
  });
});

describe('signalValue', () => {
  it('gets current signal value', () => {
    const sig = createMockSignal(42);
    expect(signalValue(sig)).toBe(42);
  });

  it('works with any object with get()', () => {
    const obj = {
      get() {
        return 'test';
      },
    };

    expect(signalValue(obj)).toBe('test');
  });
});

describe('waitForSignal', () => {
  it('resolves when predicate is true', async () => {
    const sig = createMockSignal(0);

    setTimeout(() => sig.set(5), 10);

    const result = await waitForSignal(sig, value => value === 5);
    expect(result).toBe(5);
  });

  it('resolves immediately if predicate already true', async () => {
    const sig = createMockSignal(10);

    const result = await waitForSignal(sig, value => value === 10);
    expect(result).toBe(10);
  });

  it('uses subscription if available', async () => {
    const sig = createMockSignal(0);

    setTimeout(() => sig.set(3), 10);

    const result = await waitForSignal(sig, value => value === 3);
    expect(result).toBe(3);
  });

  it('rejects on timeout', async () => {
    const sig = createMockSignal(0);

    await expect(
      waitForSignal(sig, value => value === 999, { timeout: 50 })
    ).rejects.toThrow(/Timed out/);
  });

  it('supports custom timeout', async () => {
    const sig = createMockSignal(0);

    const start = Date.now();

    await expect(
      waitForSignal(sig, () => false, { timeout: 100 })
    ).rejects.toThrow();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
    expect(elapsed).toBeLessThan(200);
  });
});

describe('waitForSignalValue', () => {
  it('waits for specific value', async () => {
    const sig = createMockSignal(0);

    setTimeout(() => sig.set(42), 10);

    await waitForSignalValue(sig, 42);
    expect(sig.get()).toBe(42);
  });

  it('resolves immediately if value matches', async () => {
    const sig = createMockSignal(100);

    await waitForSignalValue(sig, 100);
    expect(sig.get()).toBe(100);
  });

  it('rejects on timeout', async () => {
    const sig = createMockSignal(0);

    await expect(
      waitForSignalValue(sig, 999, { timeout: 50 })
    ).rejects.toThrow(/Timed out/);
  });
});

describe('assertSignalHistory', () => {
  it('passes when history matches', () => {
    const sig = createMockSignal(0);
    sig.set(1);
    sig.set(2);

    expect(() => {
      assertSignalHistory(sig, [0, 1, 2]);
    }).not.toThrow();
  });

  it('throws when history length differs', () => {
    const sig = createMockSignal(0);
    sig.set(1);

    expect(() => {
      assertSignalHistory(sig, [0, 1, 2]);
    }).toThrow(/length mismatch/);
  });

  it('throws when values differ', () => {
    const sig = createMockSignal(0);
    sig.set(1);
    sig.set(2);

    expect(() => {
      assertSignalHistory(sig, [0, 1, 999]);
    }).toThrow(/mismatch at index 2/);
  });

  it('provides detailed error message', () => {
    const sig = createMockSignal(0);
    sig.set(1);

    try {
      assertSignalHistory(sig, [0, 2]);
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toContain('Expected 2');
      expect((error as Error).message).toContain('got 1');
    }
  });
});
