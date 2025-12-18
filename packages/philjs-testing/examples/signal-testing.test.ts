/**
 * Example: Signal Testing Patterns
 *
 * This example shows various patterns for testing PhilJS signals,
 * including mocks, history tracking, and async signal updates.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createMockSignal,
  waitForSignal,
  waitForSignalValue,
  assertSignalHistory,
} from 'philjs-testing';
import { signal, memo, effect } from 'philjs-core';

describe('Signal Testing Patterns', () => {
  describe('Mock Signals', () => {
    it('tracks signal updates', () => {
      const count = createMockSignal(0);

      expect(count.get()).toBe(0);

      count.set(1);
      count.set(2);
      count.set(3);

      const history = count.getHistory();
      expect(history).toEqual([0, 1, 2, 3]);
    });

    it('tracks number of reads', () => {
      const value = createMockSignal(42);

      expect(value.getCallCount()).toBe(0);

      value.get();
      value.get();
      value.get();

      expect(value.getCallCount()).toBe(3);
    });

    it('resets to initial state', () => {
      const count = createMockSignal(0);

      count.set(10);
      count.set(20);
      count.get();
      count.get();

      count.reset();

      expect(count.get()).toBe(0);
      expect(count.getHistory()).toEqual([0]);
      expect(count.getCallCount()).toBe(1); // Just the get() above
    });
  });

  describe('Signal History Assertions', () => {
    it('asserts exact history sequence', () => {
      const count = createMockSignal(0);

      count.set(1);
      count.set(2);
      count.set(3);

      // Should pass
      assertSignalHistory(count, [0, 1, 2, 3]);
    });

    it('throws on history mismatch', () => {
      const count = createMockSignal(0);

      count.set(1);
      count.set(2);

      expect(() => {
        assertSignalHistory(count, [0, 1, 999]);
      }).toThrow(/mismatch/);
    });
  });

  describe('Async Signal Testing', () => {
    it('waits for signal value', async () => {
      const status = createMockSignal('loading');

      // Simulate async update
      setTimeout(() => {
        status.set('loaded');
      }, 50);

      await waitForSignalValue(status, 'loaded');

      expect(status.get()).toBe('loaded');
    });

    it('waits for signal condition', async () => {
      const count = createMockSignal(0);

      // Increment after delays
      setTimeout(() => count.set(1), 10);
      setTimeout(() => count.set(2), 20);
      setTimeout(() => count.set(3), 30);

      await waitForSignal(count, (value) => value >= 3);

      expect(count.get()).toBeGreaterThanOrEqual(3);
    });

    it('times out if condition never met', async () => {
      const value = createMockSignal(0);

      await expect(
        waitForSignalValue(value, 999, { timeout: 50 })
      ).rejects.toThrow(/Timed out/);
    });
  });

  describe('Signal Subscriptions', () => {
    it('tracks subscription calls', () => {
      const count = createMockSignal(0);
      const calls: number[] = [];

      const unsubscribe = count.subscribe((value) => {
        calls.push(value);
      });

      count.set(1);
      count.set(2);
      count.set(3);

      expect(calls).toEqual([1, 2, 3]);

      unsubscribe();

      count.set(4);
      expect(calls).toEqual([1, 2, 3]); // No new calls
    });
  });

  describe('Computed Signals', () => {
    it('tracks computed value changes', () => {
      let baseValue = 1;
      const doubled = createMockSignal(baseValue * 2);

      // Manual recompute for this example
      baseValue = 2;
      doubled.set(baseValue * 2);

      baseValue = 3;
      doubled.set(baseValue * 2);

      expect(doubled.getHistory()).toEqual([2, 4, 6]);
    });

    it('tracks computation call count', () => {
      let computations = 0;

      const data = signal([1, 2, 3]);
      const sum = memo(() => {
        computations++;
        return data().reduce((a, b) => a + b, 0);
      });

      // First access
      expect(sum()).toBe(6);
      expect(computations).toBe(1);

      // Repeated access (should use cache)
      sum();
      sum();
      expect(computations).toBe(1); // Still 1

      // Update dependency
      data.set([1, 2, 3, 4]);
      expect(sum()).toBe(10);
      expect(computations).toBe(2); // Recomputed
    });
  });

  describe('Effect Testing', () => {
    it('tracks effect executions', () => {
      const count = signal(0);
      const executions: number[] = [];

      const dispose = effect(() => {
        executions.push(count());
      });

      expect(executions).toEqual([0]); // Initial run

      count.set(1);
      count.set(2);

      expect(executions).toEqual([0, 1, 2]);

      dispose();
    });

    it('verifies cleanup function', () => {
      const count = signal(0);
      const cleanup = vi.fn();

      const dispose = effect(() => {
        count(); // Track dependency
        return cleanup;
      });

      expect(cleanup).not.toHaveBeenCalled();

      count.set(1); // Trigger re-run
      expect(cleanup).toHaveBeenCalledTimes(1); // Cleanup from previous

      dispose(); // Final cleanup
      expect(cleanup).toHaveBeenCalledTimes(2);
    });

    it('verifies effect dependencies', () => {
      const a = signal(1);
      const b = signal(2);
      const executions: number[] = [];

      effect(() => {
        executions.push(a() + b());
      });

      expect(executions).toEqual([3]); // 1 + 2

      a.set(10);
      expect(executions).toEqual([3, 12]); // 10 + 2

      b.set(20);
      expect(executions).toEqual([3, 12, 30]); // 10 + 20
    });
  });

  describe('Complex Signal Patterns', () => {
    it('tests derived signal chains', () => {
      const base = signal(2);
      const doubled = memo(() => base() * 2);
      const quadrupled = memo(() => doubled() * 2);

      expect(quadrupled()).toBe(8); // 2 * 2 * 2

      base.set(3);
      expect(quadrupled()).toBe(12); // 3 * 2 * 2

      base.set(5);
      expect(quadrupled()).toBe(20); // 5 * 2 * 2
    });

    it('tests diamond dependency graph', () => {
      const source = signal(1);
      const left = memo(() => source() * 2);
      const right = memo(() => source() + 10);
      const combined = memo(() => left() + right());

      expect(combined()).toBe(13); // (1*2) + (1+10) = 13

      source.set(2);
      expect(combined()).toBe(16); // (2*2) + (2+10) = 16
    });

    it('tests conditional signal dependencies', () => {
      const condition = signal(true);
      const valueA = signal(10);
      const valueB = signal(20);
      const executions: number[] = [];

      effect(() => {
        const result = condition() ? valueA() : valueB();
        executions.push(result);
      });

      expect(executions).toEqual([10]);

      valueA.set(15);
      expect(executions).toEqual([10, 15]);

      // Switch condition
      condition.set(false);
      expect(executions).toEqual([10, 15, 20]);

      // Now valueB changes should trigger
      valueB.set(25);
      expect(executions).toEqual([10, 15, 20, 25]);

      // valueA changes shouldn't trigger anymore
      valueA.set(999);
      expect(executions).toEqual([10, 15, 20, 25]); // No change
    });
  });
});
