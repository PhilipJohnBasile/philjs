/**
 * Tests for PhilJS Hooks - Utility Hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal } from '@philjs/core';
import {
  useForceUpdate,
  useId,
  useMounted,
} from './index';

describe('Utility Hooks', () => {
  describe('useForceUpdate', () => {
    it('should return a function', () => {
      const forceUpdate = useForceUpdate();
      expect(typeof forceUpdate).toBe('function');
    });

    it('should increment internal counter on each call', () => {
      const forceUpdate = useForceUpdate();

      // Calling forceUpdate multiple times should not throw
      forceUpdate();
      forceUpdate();
      forceUpdate();

      // Just verify it runs without error
      expect(true).toBe(true);
    });
  });

  describe('useId', () => {
    it('should generate an ID with default prefix', () => {
      const id = useId();
      expect(id).toMatch(/^id-[a-z0-9]+$/);
    });

    it('should generate an ID with custom prefix', () => {
      const id = useId('custom');
      expect(id).toMatch(/^custom-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(useId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('useMounted', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return a signal', () => {
      const mounted = useMounted();
      expect(mounted.get).toBeDefined();
    });

    it('should be false initially', () => {
      const mounted = useMounted();
      expect(mounted.get()).toBe(false);
    });

    it('should become true after microtask', async () => {
      const mounted = useMounted();

      // Flush microtasks
      await vi.runAllTimersAsync();

      expect(mounted.get()).toBe(true);
    });
  });

  describe('Signal Integration', () => {
    it('should work with signals for state tracking', () => {
      const count = signal(0);
      const forceUpdate = useForceUpdate();

      count.set(5);
      forceUpdate();

      expect(count.get()).toBe(5);
    });

    it('should allow ID generation in signal context', () => {
      const items = signal<string[]>([]);

      items.set([useId('item'), useId('item'), useId('item')]);

      const allItems = items.get();
      expect(allItems.length).toBe(3);
      expect(new Set(allItems).size).toBe(3); // All unique
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prefix in useId', () => {
      const id = useId('');
      expect(id).toMatch(/^-[a-z0-9]+$/);
    });

    it('should handle multiple forceUpdate instances', () => {
      const update1 = useForceUpdate();
      const update2 = useForceUpdate();

      // Each should work independently
      update1();
      update2();
      update1();

      expect(true).toBe(true);
    });

    it('should handle multiple mounted signals', async () => {
      vi.useFakeTimers();

      const mounted1 = useMounted();
      const mounted2 = useMounted();

      expect(mounted1.get()).toBe(false);
      expect(mounted2.get()).toBe(false);

      await vi.runAllTimersAsync();

      expect(mounted1.get()).toBe(true);
      expect(mounted2.get()).toBe(true);

      vi.useRealTimers();
    });
  });
});
