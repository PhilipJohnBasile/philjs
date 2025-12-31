import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signal,
  memo,
  linkedSignal,
  effect,
  batch,
  untrack,
  onCleanup,
  createRoot,
  resource,
} from '../signals.js';

describe('signals', () => {
  describe('signal', () => {
    it('should create a signal with initial value', () => {
      const count = signal(0);
      expect(count()).toBe(0);
    });

    it('should update signal value with set', () => {
      const count = signal(0);
      count.set(5);
      expect(count()).toBe(5);
    });

    it('should support updater function', () => {
      const count = signal(10);
      count.set(c => c + 5);
      expect(count()).toBe(15);
    });

    it('should not trigger updates for same value', () => {
      const count = signal(0);
      const fn = vi.fn();
      count.subscribe(fn);
      count.set(0);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should support subscribe method', () => {
      const count = signal(0);
      const fn = vi.fn();
      const unsubscribe = count.subscribe(fn);
      count.set(1);
      expect(fn).toHaveBeenCalledWith(1);
      unsubscribe();
      count.set(2);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should support peek method', () => {
      const count = signal(5);
      expect(count.peek()).toBe(5);
    });
  });

  describe('memo', () => {
    it('should create a computed value', () => {
      const count = signal(2);
      const doubled = memo(() => count() * 2);
      expect(doubled()).toBe(4);
    });

    it('should update when dependencies change', () => {
      const count = signal(2);
      const doubled = memo(() => count() * 2);
      count.set(5);
      expect(doubled()).toBe(10);
    });

    it('should cache computed value', () => {
      const count = signal(2);
      const fn = vi.fn(() => count() * 2);
      const doubled = memo(fn);
      doubled();
      doubled();
      doubled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should recompute when stale', () => {
      const count = signal(2);
      const fn = vi.fn(() => count() * 2);
      const doubled = memo(fn);
      doubled();
      count.set(3);
      doubled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should support subscribe method', () => {
      const count = signal(2);
      const doubled = memo(() => count() * 2);
      const fn = vi.fn();
      doubled.subscribe(fn);
      count.set(5);
      expect(fn).toHaveBeenCalled();
    });
  });

  describe('linkedSignal', () => {
    it('should compute initial value', () => {
      const firstName = signal('John');
      const lastName = signal('Doe');
      const fullName = linkedSignal(() => `${firstName()} ${lastName()}`);
      expect(fullName()).toBe('John Doe');
    });

    it('should allow manual override', () => {
      const firstName = signal('John');
      const fullName = linkedSignal(() => firstName());
      fullName.set('Jane');
      expect(fullName()).toBe('Jane');
      expect(fullName.isOverridden()).toBe(true);
    });

    it('should reset to computed value when dependencies change', () => {
      const firstName = signal('John');
      const lastName = signal('Doe');
      const fullName = linkedSignal(() => `${firstName()} ${lastName()}`);
      fullName.set('Custom Name');
      firstName.set('Bob');
      expect(fullName()).toBe('Bob Doe');
      expect(fullName.isOverridden()).toBe(false);
    });

    it('should support reset method', () => {
      const count = signal(5);
      const doubled = linkedSignal(() => count() * 2);
      doubled.set(100);
      expect(doubled()).toBe(100);
      doubled.reset();
      expect(doubled()).toBe(10);
    });
  });

  describe('effect', () => {
    it('should run effect immediately', () => {
      const fn = vi.fn();
      const dispose = effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);
      dispose();
    });

    it('should re-run when dependencies change', () => {
      const count = signal(0);
      const fn = vi.fn();
      const dispose = effect(() => {
        count();
        fn();
      });
      count.set(1);
      expect(fn).toHaveBeenCalledTimes(2);
      dispose();
    });

    it('should run cleanup function on re-run', () => {
      const count = signal(0);
      const cleanup = vi.fn();
      const dispose = effect(() => {
        count();
        return cleanup;
      });
      count.set(1);
      expect(cleanup).toHaveBeenCalledTimes(1);
      dispose();
    });

    it('should run cleanup on dispose', () => {
      const cleanup = vi.fn();
      const dispose = effect(() => cleanup);
      dispose();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should not run after dispose', () => {
      const count = signal(0);
      const fn = vi.fn();
      const dispose = effect(() => {
        count();
        fn();
      });
      dispose();
      count.set(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('batch', () => {
    it('should batch multiple updates', () => {
      const firstName = signal('John');
      const lastName = signal('Doe');
      const fn = vi.fn();

      effect(() => {
        firstName();
        lastName();
        fn();
      });

      fn.mockClear();

      batch(() => {
        firstName.set('Jane');
        lastName.set('Smith');
      });

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return value from batch function', () => {
      const result = batch(() => 42);
      expect(result).toBe(42);
    });

    it('should support nested batches', () => {
      const count = signal(0);
      const fn = vi.fn();

      effect(() => {
        count();
        fn();
      });

      fn.mockClear();

      batch(() => {
        count.set(1);
        batch(() => {
          count.set(2);
        });
        count.set(3);
      });

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('untrack', () => {
    it('should not track dependencies', () => {
      const a = signal(1);
      const b = signal(2);
      const fn = vi.fn();

      const dispose = effect(() => {
        a();
        untrack(() => b());
        fn();
      });

      fn.mockClear();

      b.set(100);
      expect(fn).not.toHaveBeenCalled();

      a.set(2);
      expect(fn).toHaveBeenCalledTimes(1);

      dispose();
    });

    it('should return computed value', () => {
      const count = signal(5);
      const result = untrack(() => count() * 2);
      expect(result).toBe(10);
    });
  });

  describe('onCleanup', () => {
    it('should register cleanup function', () => {
      const cleanup = vi.fn();
      const count = signal(0);

      const dispose = effect(() => {
        count();
        onCleanup(cleanup);
      });

      count.set(1);
      expect(cleanup).toHaveBeenCalledTimes(1);

      dispose();
      expect(cleanup).toHaveBeenCalledTimes(2);
    });
  });

  describe('createRoot', () => {
    it('should create a scope that can be disposed', () => {
      const cleanup = vi.fn();
      let dispose: () => void;

      createRoot(d => {
        dispose = d;
        effect(() => cleanup);
      });

      dispose!();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should return value from function', () => {
      const result = createRoot(() => 42);
      expect(result).toBe(42);
    });
  });

  describe('resource', () => {
    it('should handle synchronous fetcher', () => {
      const data = resource(() => 'hello');
      expect(data()).toBe('hello');
      expect(data.loading()).toBe(false);
      expect(data.error()).toBeNull();
    });

    it('should handle async fetcher', async () => {
      const data = resource(async () => {
        return Promise.resolve('async value');
      });

      expect(data.loading()).toBe(true);

      await new Promise(r => setTimeout(r, 10));

      expect(data()).toBe('async value');
      expect(data.loading()).toBe(false);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      const data = resource(async () => {
        throw error;
      });

      await new Promise(r => setTimeout(r, 10));

      expect(data.error()).toBe(error);
      expect(data.loading()).toBe(false);
    });

    it('should support refresh', async () => {
      let counter = 0;
      const data = resource(() => ++counter);

      expect(data()).toBe(1);
      data.refresh();
      expect(data()).toBe(2);
    });
  });
});
