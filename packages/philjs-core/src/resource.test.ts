/**
 * Tests for createResource primitive
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal } from './signals.js';
import {
  createResource,
  createDependentResource,
  createResourceWithRetry,
  preload,
  getPreloaded,
  clearPreloadCache,
  enableSuspense,
  disableSuspense,
  isSuspenseActive,
} from './resource.js';

describe('createResource', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    disableSuspense();
    clearPreloadCache();
  });

  describe('basic functionality', () => {
    it('should create a resource with sync fetcher', () => {
      const [data] = createResource(() => 'hello');

      expect(data()).toBe('hello');
      expect(data.loading).toBe(false);
      expect(data.error).toBe(undefined);
      expect(data.state).toBe('ready');
    });

    it('should create a resource with async fetcher', async () => {
      const fetcher = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'async data';
      });

      const [data] = createResource(fetcher);

      // Initially loading
      expect(data.loading).toBe(true);
      expect(data.state).toBe('pending');
      expect(data()).toBe(undefined);

      // Wait for resolution
      await vi.advanceTimersByTimeAsync(100);
      await Promise.resolve(); // Wait for microtasks

      expect(data()).toBe('async data');
      expect(data.loading).toBe(false);
      expect(data.state).toBe('ready');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should handle initial value', () => {
      const [data] = createResource(
        async () => 'new data',
        { initialValue: 'initial' }
      );

      expect(data()).toBe('initial');
      expect(data.latest).toBe('initial');
    });

    it('should handle errors', async () => {
      const error = new Error('fetch failed');
      const [data] = createResource(async () => {
        throw error;
      });

      await vi.runAllTimersAsync();

      expect(() => data()).toThrow('fetch failed');
      expect(data.error).toBe(error);
      expect(data.state).toBe('errored');
      expect(data.loading).toBe(false);
    });

    it('should handle sync errors', () => {
      const error = new Error('sync error');
      const [data] = createResource(() => {
        throw error;
      });

      expect(data.error).toBe(error);
      expect(data.state).toBe('errored');
    });
  });

  describe('source tracking', () => {
    it('should refetch when source changes', async () => {
      const userId = signal(1);
      const fetcher = vi.fn(async (id: number) => `user-${id}`);

      const [user] = createResource(userId, fetcher);

      await vi.runAllTimersAsync();
      expect(user()).toBe('user-1');
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Change source
      userId.set(2);
      await vi.runAllTimersAsync();

      expect(user()).toBe('user-2');
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should not fetch when source is null/undefined', () => {
      const userId = signal<number | null>(null);
      const fetcher = vi.fn(async (id: number) => `user-${id}`);

      const [user] = createResource(userId, fetcher);

      expect(fetcher).not.toHaveBeenCalled();
      expect(user()).toBe(undefined);
    });

    it('should refetch when source changes from null to value', async () => {
      const userId = signal<number | null>(null);
      const fetcher = vi.fn(async (id: number) => `user-${id}`);

      const [user] = createResource(userId, fetcher);

      expect(fetcher).not.toHaveBeenCalled();

      userId.set(1);
      await vi.runAllTimersAsync();

      expect(user()).toBe('user-1');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('refetch', () => {
    it('should refetch data', async () => {
      let counter = 0;
      const fetcher = vi.fn(async () => {
        counter++;
        return `data-${counter}`;
      });

      const [data] = createResource(fetcher);

      await vi.runAllTimersAsync();
      expect(data()).toBe('data-1');

      data.refetch();
      await vi.runAllTimersAsync();
      expect(data()).toBe('data-2');
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should set state to refreshing during refetch', async () => {
      const [data] = createResource(async () => 'data');

      await vi.runAllTimersAsync();
      expect(data.state).toBe('ready');

      const refetchPromise = data.refetch();
      expect(data.state).toBe('refreshing');

      await vi.runAllTimersAsync();
      expect(data.state).toBe('ready');
    });

    it('should pass refetch info to fetcher', async () => {
      const fetcher = vi.fn(async (source: any, info: any) => {
        return info.refetching ? 'refreshed' : 'initial';
      });

      const [data] = createResource(fetcher);

      await vi.runAllTimersAsync();
      expect(data()).toBe('initial');

      data.refetch(true);
      await vi.runAllTimersAsync();
      expect(data()).toBe('refreshed');
    });
  });

  describe('mutate', () => {
    it('should mutate resource value directly', async () => {
      const [data] = createResource(async () => 'original');

      await vi.runAllTimersAsync();
      expect(data()).toBe('original');

      data.mutate('mutated');
      expect(data()).toBe('mutated');
      expect(data.state).toBe('ready');
    });

    it('should clear error when mutating', async () => {
      const [data] = createResource(async () => {
        throw new Error('error');
      });

      await vi.runAllTimersAsync();
      expect(data.error).toBeTruthy();

      data.mutate('new value');
      expect(data()).toBe('new value');
      expect(data.error).toBe(undefined);
      expect(data.state).toBe('ready');
    });
  });

  describe('latest property', () => {
    it('should track latest value even during loading', async () => {
      let resolveFirst: (value: string) => void;
      const firstPromise = new Promise<string>(resolve => {
        resolveFirst = resolve;
      });

      let counter = 0;
      const fetcher = async () => {
        if (counter++ === 0) {
          return firstPromise;
        }
        return 'second';
      };

      const [data] = createResource(fetcher);

      expect(data.latest).toBe(undefined);

      // Start refetch before first completes
      data.refetch();
      await vi.runAllTimersAsync();

      expect(data.latest).toBe('second');

      // Complete first
      resolveFirst!('first');
      await Promise.resolve();

      // Latest should still be 'second' (newest)
      expect(data.latest).toBe('second');
    });
  });

  describe('Suspense integration', () => {
    it('should throw promise when Suspense is enabled', () => {
      enableSuspense();

      const [data] = createResource(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'data';
      });

      expect(() => data()).toThrow();
      expect(isSuspenseActive()).toBe(true);
    });

    it('should not throw when Suspense is disabled', async () => {
      disableSuspense();

      const [data] = createResource(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'data';
      });

      expect(data()).toBe(undefined);
      expect(data.loading).toBe(true);
    });

    it('should resolve Suspense promise when data loads', async () => {
      enableSuspense();

      const [data] = createResource(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'data';
      });

      let thrownPromise: Promise<any> | null = null;
      try {
        data();
      } catch (promise) {
        thrownPromise = promise as Promise<any>;
      }

      expect(thrownPromise).toBeInstanceOf(Promise);

      await vi.advanceTimersByTimeAsync(100);
      await thrownPromise;

      expect(data()).toBe('data');
    });
  });

  describe('dependent resources', () => {
    it('should create dependent resource', async () => {
      const [user] = createResource(async () => ({ id: 1, name: 'John' }));

      const [posts] = createDependentResource(
        () => user()?.id,
        async (userId) => [`post-${userId}-1`, `post-${userId}-2`]
      );

      await vi.runAllTimersAsync();

      expect(posts()).toEqual(['post-1-1', 'post-1-2']);
    });

    it('should not fetch when parent is not ready', () => {
      const [user] = createResource(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id: 1 };
      });

      const postsFetcher = vi.fn(async (userId: number) => ['posts']);

      const [posts] = createDependentResource(() => user()?.id, postsFetcher);

      expect(postsFetcher).not.toHaveBeenCalled();
    });

    it('should refetch when parent changes', async () => {
      const userId = signal(1);
      const [user] = createResource(userId, async (id) => ({ id, name: `User ${id}` }));

      const postsFetcher = vi.fn(async (id: number) => [`post-${id}`]);
      const [posts] = createDependentResource(() => user()?.id, postsFetcher);

      await vi.runAllTimersAsync();
      expect(posts()).toEqual(['post-1']);
      expect(postsFetcher).toHaveBeenCalledTimes(1);

      userId.set(2);
      await vi.runAllTimersAsync();

      expect(posts()).toEqual(['post-2']);
      expect(postsFetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe('preloading', () => {
    it('should preload and cache data', async () => {
      const fetcher = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'preloaded data';
      });

      const promise = preload('test-key', fetcher);

      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result).toBe('preloaded data');
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const promise2 = preload('test-key', fetcher);
      const result2 = await promise2;

      expect(result2).toBe('preloaded data');
      expect(fetcher).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should get preloaded data', async () => {
      const fetcher = async () => 'data';
      const promise = preload('key', fetcher);

      await promise;

      expect(getPreloaded('key')).toBe('data');
    });

    it('should return undefined for non-preloaded data', () => {
      expect(getPreloaded('nonexistent')).toBe(undefined);
    });

    it('should cache errors', async () => {
      const error = new Error('preload failed');
      const fetcher = vi.fn(async () => {
        throw error;
      });

      await expect(preload('error-key', fetcher)).rejects.toThrow('preload failed');

      // Second call should use cached error
      await expect(preload('error-key', fetcher)).rejects.toThrow('preload failed');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should clear preload cache', async () => {
      const fetcher = vi.fn(async () => 'data');

      await preload('key', fetcher);
      expect(getPreloaded('key')).toBe('data');

      clearPreloadCache('key');
      expect(getPreloaded('key')).toBe(undefined);
    });

    it('should clear all preloaded data', async () => {
      await preload('key1', async () => 'data1');
      await preload('key2', async () => 'data2');

      clearPreloadCache();

      expect(getPreloaded('key1')).toBe(undefined);
      expect(getPreloaded('key2')).toBe(undefined);
    });

    it('should expire cache after TTL', async () => {
      const fetcher = vi.fn(async () => 'data');

      await preload('key', fetcher);
      expect(getPreloaded('key')).toBe('data');

      // Advance time past TTL (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);

      expect(getPreloaded('key')).toBe(undefined);
    });
  });

  describe('retry functionality', () => {
    it('should retry on failure', async () => {
      let attempts = 0;
      const fetcher = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('temporary failure');
        }
        return 'success';
      });

      const [data] = createResourceWithRetry(fetcher, {
        maxRetries: 3,
        retryDelay: 100,
      });

      await vi.runAllTimersAsync();

      expect(data()).toBe('success');
      expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const fetcher = vi.fn(async () => {
        throw new Error('permanent failure');
      });

      const [data] = createResourceWithRetry(fetcher, {
        maxRetries: 2,
        retryDelay: 100,
      });

      await vi.runAllTimersAsync();

      expect(() => data()).toThrow('permanent failure');
      expect(fetcher).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should call onRetry callback', async () => {
      let attempts = 0;
      const onRetry = vi.fn();

      const [data] = createResourceWithRetry(
        async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error('failure');
          }
          return 'success';
        },
        {
          maxRetries: 2,
          retryDelay: 100,
          onRetry,
        }
      );

      await vi.runAllTimersAsync();

      expect(data()).toBe('success');
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should use exponential backoff', async () => {
      let attempts = 0;
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      vi.spyOn(global, 'setTimeout').mockImplementation(((fn: any, delay: number) => {
        if (attempts > 0) {
          delays.push(delay);
        }
        return originalSetTimeout(fn, 0);
      }) as any);

      const [data] = createResourceWithRetry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('failure');
          }
          return 'success';
        },
        {
          maxRetries: 3,
          retryDelay: 100,
        }
      );

      await vi.runAllTimersAsync();

      expect(delays).toEqual([100, 200]); // Exponential backoff: 100, 100*2
    });

    it('should work with source parameter', async () => {
      const userId = signal(1);
      let attempts = 0;

      const [user] = createResourceWithRetry(
        userId,
        async (id: number) => {
          attempts++;
          if (attempts < 2) {
            throw new Error('failure');
          }
          return `user-${id}`;
        },
        {
          maxRetries: 2,
          retryDelay: 100,
        }
      );

      await vi.runAllTimersAsync();

      expect(user()).toBe('user-1');
    });
  });

  describe('deferred loading', () => {
    it('should not load initially when deferred', () => {
      const fetcher = vi.fn(async () => 'data');

      const [data] = createResource(fetcher, { deferStream: true });

      expect(fetcher).not.toHaveBeenCalled();
      expect(data.state).toBe('unresolved');
    });

    it('should load on first refetch when deferred', async () => {
      const fetcher = vi.fn(async () => 'data');

      const [data] = createResource(fetcher, { deferStream: true });

      expect(fetcher).not.toHaveBeenCalled();

      data.refetch();
      await vi.runAllTimersAsync();

      expect(data()).toBe('data');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('race conditions', () => {
    it('should handle concurrent fetches correctly', async () => {
      const userId = signal(1);
      const fetcher = vi.fn(async (id: number) => {
        await new Promise(resolve => setTimeout(resolve, id === 1 ? 200 : 100));
        return `user-${id}`;
      });

      const [user] = createResource(userId, fetcher);

      // First fetch starts (will take 200ms)
      const firstFetch = vi.runAllTimersAsync();

      // Change source before first completes (will take 100ms)
      await vi.advanceTimersByTimeAsync(50);
      userId.set(2);

      await vi.runAllTimersAsync();

      // Second fetch should win
      expect(user()).toBe('user-2');
    });
  });

  describe('edge cases', () => {
    it('should handle fetcher returning undefined', async () => {
      const [data] = createResource(async () => undefined);

      await vi.runAllTimersAsync();

      expect(data()).toBe(undefined);
      expect(data.state).toBe('ready');
    });

    it('should handle fetcher returning null', async () => {
      const [data] = createResource(async () => null as any);

      await vi.runAllTimersAsync();

      expect(data()).toBe(null);
      expect(data.state).toBe('ready');
    });

    it('should handle non-Error throws', async () => {
      const [data] = createResource(async () => {
        throw 'string error';
      });

      await vi.runAllTimersAsync();

      expect(data.error).toBeInstanceOf(Error);
      expect(data.error?.message).toBe('string error');
    });
  });
});
