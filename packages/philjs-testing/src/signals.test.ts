/**
 * Tests for PhilJS Testing Library - Signal Testing Utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockSignal,
  createMockComputed,
  signalValue,
  waitForSignal,
  waitForSignalValue,
  assertSignalHistory,
} from './signals';

describe('Signal Testing Utilities', () => {
  describe('createMockSignal', () => {
    it('should create a signal with initial value', () => {
      const signal = createMockSignal(42);
      expect(signal.get()).toBe(42);
    });

    it('should update value with set', () => {
      const signal = createMockSignal('initial');
      signal.set('updated');
      expect(signal.get()).toBe('updated');
    });

    it('should update value with update function', () => {
      const signal = createMockSignal(10);
      signal.update((prev) => prev + 5);
      expect(signal.get()).toBe(15);
    });

    it('should track history', () => {
      const signal = createMockSignal(0);
      signal.set(1);
      signal.set(2);
      signal.set(3);

      expect(signal.getHistory()).toEqual([0, 1, 2, 3]);
    });

    it('should track call count', () => {
      const signal = createMockSignal('test');
      signal.get();
      signal.get();
      signal.get();

      expect(signal.getCallCount()).toBe(3);
    });

    it('should notify subscribers on change', () => {
      const signal = createMockSignal(0);
      const callback = vi.fn();

      signal.subscribe(callback);
      signal.set(1);
      signal.set(2);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(1);
      expect(callback).toHaveBeenCalledWith(2);
    });

    it('should allow unsubscribing', () => {
      const signal = createMockSignal(0);
      const callback = vi.fn();

      const unsubscribe = signal.subscribe(callback);
      signal.set(1);
      unsubscribe();
      signal.set(2);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(1);
    });

    it('should reset to initial state', () => {
      const signal = createMockSignal(0);
      signal.set(1);
      signal.set(2);
      signal.get();
      signal.get();

      signal.reset();

      expect(signal.get()).toBe(0);
      expect(signal.getHistory()).toEqual([0]);
      // Note: reset clears call count, but the get() call after reset adds 1
      expect(signal.getCallCount()).toBe(1);
    });

    it('should work with complex objects', () => {
      const signal = createMockSignal({ name: 'test', count: 0 });
      signal.set({ name: 'updated', count: 1 });

      expect(signal.get()).toEqual({ name: 'updated', count: 1 });
      expect(signal.getHistory()).toEqual([
        { name: 'test', count: 0 },
        { name: 'updated', count: 1 },
      ]);
    });

    it('should work with arrays', () => {
      const signal = createMockSignal<number[]>([1, 2, 3]);
      signal.update((arr) => [...arr, 4]);

      expect(signal.get()).toEqual([1, 2, 3, 4]);
    });
  });

  describe('signalValue', () => {
    it('should get the current value of a signal', () => {
      const signal = createMockSignal('hello');
      expect(signalValue(signal)).toBe('hello');
    });

    it('should work with any object that has get method', () => {
      const customSignal = {
        get: () => 42,
      };
      expect(signalValue(customSignal)).toBe(42);
    });
  });

  describe('waitForSignal', () => {
    it('should resolve immediately if predicate is satisfied', async () => {
      const signal = createMockSignal(5);
      const result = await waitForSignal(signal, (v) => v > 3);
      expect(result).toBe(5);
    });

    it('should wait for signal to satisfy predicate via subscription', async () => {
      const signal = createMockSignal(0);

      const promise = waitForSignal(signal, (v) => v >= 3, { timeout: 1000 });

      // Update signal after a short delay
      setTimeout(() => signal.set(3), 50);

      const result = await promise;
      expect(result).toBe(3);
    });

    it('should timeout if predicate is never satisfied', async () => {
      const signal = createMockSignal(0);

      await expect(
        waitForSignal(signal, (v) => v > 100, { timeout: 100 })
      ).rejects.toThrow('Timed out');
    });

    it('should work with polling fallback', async () => {
      // Create a signal-like object without subscribe
      let value = 0;
      const signalLike = {
        get: () => value,
      };

      const promise = waitForSignal(signalLike, (v) => v >= 3, {
        timeout: 1000,
        interval: 20,
      });

      // Update value after a short delay
      setTimeout(() => {
        value = 3;
      }, 50);

      const result = await promise;
      expect(result).toBe(3);
    });
  });

  describe('waitForSignalValue', () => {
    it('should resolve when signal equals expected value', async () => {
      const signal = createMockSignal('pending');

      const promise = waitForSignalValue(signal, 'done', { timeout: 1000 });

      setTimeout(() => signal.set('done'), 50);

      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve immediately if value already matches', async () => {
      const signal = createMockSignal('ready');
      await expect(
        waitForSignalValue(signal, 'ready', { timeout: 100 })
      ).resolves.toBeUndefined();
    });
  });

  describe('assertSignalHistory', () => {
    it('should pass when history matches', () => {
      const signal = createMockSignal(0);
      signal.set(1);
      signal.set(2);

      expect(() => assertSignalHistory(signal, [0, 1, 2])).not.toThrow();
    });

    it('should throw when history length does not match', () => {
      const signal = createMockSignal(0);
      signal.set(1);

      expect(() => assertSignalHistory(signal, [0, 1, 2])).toThrow(
        'Signal history length mismatch'
      );
    });

    it('should throw when history values do not match', () => {
      const signal = createMockSignal(0);
      signal.set(1);
      signal.set(2);

      expect(() => assertSignalHistory(signal, [0, 1, 3])).toThrow(
        'Signal history mismatch at index 2'
      );
    });

    it('should work with initial value only', () => {
      const signal = createMockSignal('test');
      expect(() => assertSignalHistory(signal, ['test'])).not.toThrow();
    });
  });

  describe('createMockComputed', () => {
    it('should create a computed signal that recomputes', () => {
      let base = 10;
      const computed = createMockComputed(() => base * 2);

      expect(computed.get()).toBe(20);

      base = 20;
      expect(computed.get()).toBe(40);
    });

    it('should track history when value changes', () => {
      let base = 5;
      const computed = createMockComputed(() => base);

      computed.get(); // 5

      base = 10;
      computed.get(); // 10

      base = 15;
      computed.get(); // 15

      expect(computed.getHistory()).toEqual([5, 10, 15]);
    });

    it('should not add to history when value stays the same', () => {
      const base = 42;
      const computed = createMockComputed(() => base);

      computed.get();
      computed.get();
      computed.get();

      expect(computed.getHistory()).toEqual([42]);
    });

    it('should work with derived values', () => {
      const signal1 = createMockSignal(5);
      const signal2 = createMockSignal(3);

      const computed = createMockComputed(() => signal1.get() + signal2.get());

      expect(computed.get()).toBe(8);

      signal1.set(10);
      expect(computed.get()).toBe(13);

      signal2.set(7);
      expect(computed.get()).toBe(17);
    });
  });

  describe('Integration scenarios', () => {
    it('should support common testing patterns', () => {
      // Create a mock signal
      const count = createMockSignal(0);

      // Simulate user interactions
      count.update((n) => n + 1);
      count.update((n) => n + 1);
      count.update((n) => n + 1);

      // Assert the final value
      expect(count.get()).toBe(3);

      // Assert the history
      assertSignalHistory(count, [0, 1, 2, 3]);
    });

    it('should support form state testing', () => {
      const formState = createMockSignal({
        name: '',
        email: '',
        isValid: false,
      });

      // Simulate user filling out form
      formState.update((state) => ({
        ...state,
        name: 'John',
      }));

      formState.update((state) => ({
        ...state,
        email: 'john@example.com',
        isValid: state.name.length > 0 && state.email.length > 0,
      }));

      // Manually set isValid since the previous update didn't have email yet
      const currentState = formState.get();
      formState.set({
        ...currentState,
        isValid: currentState.name.length > 0 && currentState.email.length > 0,
      });

      expect(formState.get().isValid).toBe(true);
      expect(formState.getHistory().length).toBe(4);
    });

    it('should support async operations testing', async () => {
      const loadingState = createMockSignal<'idle' | 'loading' | 'success' | 'error'>('idle');

      // Simulate async operation
      loadingState.set('loading');

      // Simulate successful response
      setTimeout(() => loadingState.set('success'), 50);

      await waitForSignalValue(loadingState, 'success', { timeout: 1000 });

      assertSignalHistory(loadingState, ['idle', 'loading', 'success']);
    });
  });
});
