/**
 * Advanced Async Primitives for PhilJS
 *
 * Enhanced async handling with:
 * - Suspense-like data loading
 * - Parallel/waterfall fetching
 * - Retry logic with backoff
 * - Race conditions handling
 * - Request deduplication
 * - Optimistic updates
 */

import { signal, effect, batch, untrack } from './signals.js';
import type { Signal } from './types.js';

// =============================================================================
// Types
// =============================================================================

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  status: 'idle' | 'pending' | 'success' | 'error';
}

export interface AsyncOptions<T> {
  /** Initial data */
  initialData?: T;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Cache configuration */
  cache?: CacheConfig;
  /** Dedupe identical requests */
  dedupe?: boolean;
  /** Timeout in ms */
  timeout?: number;
  /** Refetch on window focus */
  refetchOnFocus?: boolean;
  /** Refetch interval in ms */
  refetchInterval?: number;
  /** Keep previous data while refetching */
  keepPreviousData?: boolean;
  /** Placeholder data while loading */
  placeholderData?: T | (() => T);
  /** Called on success */
  onSuccess?: (data: T) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Called on settled (success or error) */
  onSettled?: (data: T | undefined, error: Error | undefined) => void;
}

export interface RetryConfig {
  /** Max retry attempts */
  count: number;
  /** Delay between retries in ms */
  delay: number | ((attempt: number) => number);
  /** Retry condition */
  condition?: (error: Error, attempt: number) => boolean;
}

export interface CacheConfig {
  /** Cache key */
  key: string;
  /** Time to live in ms */
  ttl?: number;
  /** Stale-while-revalidate time in ms */
  staleTime?: number;
}

export interface MutationOptions<T, V> {
  /** Optimistic update function */
  optimisticUpdate?: (variables: V) => T;
  /** Rollback function on error */
  onError?: (error: Error, variables: V, rollback: () => void) => void;
  /** Called on success */
  onSuccess?: (data: T, variables: V) => void;
  /** Invalidate cache keys on success */
  invalidate?: string[];
  /** Retry configuration */
  retry?: RetryConfig;
}

// =============================================================================
// Cache
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAt?: number;
}

const cache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, Promise<any>>();
const subscribers = new Map<string, Set<() => void>>();

/**
 * Get cached data
 */
export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  return entry.data;
}

/**
 * Set cache data
 */
export function setCache<T>(key: string, data: T, ttl?: number): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ...(ttl !== undefined && { staleAt: Date.now() + ttl }),
  };
  cache.set(key, entry);
  notifySubscribers(key);
}

/**
 * Invalidate cache
 */
export function invalidateCache(keyOrPattern: string | RegExp): void {
  if (typeof keyOrPattern === 'string') {
    cache.delete(keyOrPattern);
    notifySubscribers(keyOrPattern);
  } else {
    for (const key of cache.keys()) {
      if (keyOrPattern.test(key)) {
        cache.delete(key);
        notifySubscribers(key);
      }
    }
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear();
  for (const key of subscribers.keys()) {
    notifySubscribers(key);
  }
}

/**
 * Subscribe to cache changes
 */
function subscribeToCache(key: string, callback: () => void): () => void {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key)!.add(callback);
  return () => {
    subscribers.get(key)?.delete(callback);
  };
}

/**
 * Notify cache subscribers
 */
function notifySubscribers(key: string): void {
  const subs = subscribers.get(key);
  if (subs) {
    for (const callback of subs) {
      callback();
    }
  }
}

// =============================================================================
// Core Async Functions
// =============================================================================

/**
 * Create an async resource with advanced features
 */
export function createAsync<T>(
  fetcher: () => Promise<T>,
  options: AsyncOptions<T> = {}
): {
  data: () => T | undefined;
  error: () => Error | undefined;
  loading: () => boolean;
  status: () => AsyncState<T>['status'];
  refetch: () => Promise<T>;
  mutate: (data: T | ((prev: T | undefined) => T)) => void;
} {
  const state = signal<AsyncState<T>>({
    data: options.initialData,
    error: undefined,
    loading: false,
    status: options.initialData ? 'success' : 'idle',
  });

  let abortController: AbortController | null = null;
  let retryCount = 0;
  let refetchTimer: ReturnType<typeof setInterval> | null = null;

  const execute = async (): Promise<T> => {
    // Check cache first
    if (options.cache) {
      const cached = cache.get(options.cache.key);
      if (cached) {
        const isStale = cached.staleAt && Date.now() > cached.staleAt;
        if (!isStale || options.keepPreviousData) {
          state.set((s) => ({ ...s, data: cached.data, status: 'success' }));
          if (!isStale) return cached.data;
        }
      }
    }

    // Check for pending dedupe
    if (options.dedupe && options.cache) {
      const pending = pendingRequests.get(options.cache.key);
      if (pending) return pending;
    }

    // Cancel previous request
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    state.set((s) => ({
      ...s,
      loading: true,
      status: 'pending',
      data: options.keepPreviousData ? s.data : (getPlaceholderData() ?? s.data),
    }));

    const fetchPromise = (async () => {
      try {
        // Apply timeout
        const timeoutPromise = options.timeout
          ? new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), options.timeout)
            )
          : null;

        const result = await (timeoutPromise
          ? Promise.race([fetcher(), timeoutPromise])
          : fetcher());

        // Cache result
        if (options.cache) {
          setCache(options.cache.key, result, options.cache.ttl);
        }

        state.set({
          data: result,
          error: undefined,
          loading: false,
          status: 'success',
        });

        options.onSuccess?.(result);
        options.onSettled?.(result, undefined);
        retryCount = 0;

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // Retry logic
        if (options.retry && retryCount < options.retry.count) {
          const shouldRetry = options.retry.condition?.(err, retryCount) ?? true;
          if (shouldRetry) {
            retryCount++;
            const delay =
              typeof options.retry.delay === 'function'
                ? options.retry.delay(retryCount)
                : options.retry.delay;
            await new Promise((r) => setTimeout(r, delay));
            return execute();
          }
        }

        state.set((s) => ({
          ...s,
          error: err,
          loading: false,
          status: 'error',
        }));

        options.onError?.(err);
        options.onSettled?.(undefined, err);

        throw err;
      } finally {
        if (options.cache) {
          pendingRequests.delete(options.cache.key);
        }
      }
    })();

    // Store pending request for deduplication
    if (options.dedupe && options.cache) {
      pendingRequests.set(options.cache.key, fetchPromise);
    }

    return fetchPromise;
  };

  const getPlaceholderData = (): T | undefined => {
    if (options.placeholderData) {
      return typeof options.placeholderData === 'function'
        ? (options.placeholderData as () => T)()
        : options.placeholderData;
    }
    return undefined;
  };

  // Setup refetch on focus
  if (options.refetchOnFocus && typeof window !== 'undefined') {
    const handleFocus = () => {
      execute().catch(() => {});
    };
    window.addEventListener('focus', handleFocus);
  }

  // Setup refetch interval
  if (options.refetchInterval) {
    refetchTimer = setInterval(() => {
      execute().catch(() => {});
    }, options.refetchInterval);
  }

  // Subscribe to cache changes
  if (options.cache) {
    subscribeToCache(options.cache.key, () => {
      const cached = cache.get(options.cache!.key);
      if (cached) {
        state.set((s) => ({ ...s, data: cached.data }));
      }
    });
  }

  return {
    data: () => state().data,
    error: () => state().error,
    loading: () => state().loading,
    status: () => state().status,
    refetch: execute,
    mutate: (data) => {
      const newData = typeof data === 'function'
        ? (data as (prev: T | undefined) => T)(state().data)
        : data;
      state.set((s) => ({ ...s, data: newData }));
      if (options.cache) {
        setCache(options.cache.key, newData, options.cache.ttl);
      }
    },
  };
}

/**
 * Create a mutation with optimistic updates
 */
export function createMutation<T, V = void>(
  mutator: (variables: V) => Promise<T>,
  options: MutationOptions<T, V> = {}
): {
  mutate: (variables: V) => Promise<T>;
  data: () => T | undefined;
  error: () => Error | undefined;
  loading: () => boolean;
  reset: () => void;
} {
  const state = signal<{
    data: T | undefined;
    error: Error | undefined;
    loading: boolean;
  }>({
    data: undefined,
    error: undefined,
    loading: false,
  });

  let previousData: T | undefined;

  const mutate = async (variables: V): Promise<T> => {
    state.set((s) => ({ ...s, loading: true, error: undefined }));

    // Apply optimistic update
    if (options.optimisticUpdate) {
      previousData = state().data;
      const optimisticData = options.optimisticUpdate(variables);
      state.set((s) => ({ ...s, data: optimisticData }));
    }

    try {
      const result = await mutator(variables);

      state.set({
        data: result,
        error: undefined,
        loading: false,
      });

      options.onSuccess?.(result, variables);

      // Invalidate cache
      if (options.invalidate) {
        for (const key of options.invalidate) {
          invalidateCache(key);
        }
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Rollback optimistic update
      const rollback = () => {
        if (previousData !== undefined) {
          state.set((s) => ({ ...s, data: previousData }));
        }
      };

      state.set((s) => ({ ...s, error: err, loading: false }));
      options.onError?.(err, variables, rollback);

      throw err;
    }
  };

  return {
    mutate,
    data: () => state().data,
    error: () => state().error,
    loading: () => state().loading,
    reset: () => {
      state.set({ data: undefined, error: undefined, loading: false });
    },
  };
}

// =============================================================================
// Parallel & Waterfall
// =============================================================================

/**
 * Fetch multiple resources in parallel
 */
export async function parallel<T extends readonly (() => Promise<any>)[]>(
  fetchers: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const results = await Promise.all(fetchers.map((f) => f()));
  return results as any;
}

/**
 * Fetch resources in sequence (waterfall)
 */
export async function waterfall<T extends readonly ((prev: any) => Promise<any>)[]>(
  fetchers: T,
  initial?: any
): Promise<Awaited<ReturnType<T[number]>>> {
  let result = initial;
  for (const fetcher of fetchers) {
    result = await fetcher(result);
  }
  return result;
}

/**
 * Race multiple fetchers, return first successful result
 */
export async function race<T>(
  fetchers: (() => Promise<T>)[],
  options?: { timeout?: number }
): Promise<T> {
  const promises = fetchers.map((f) => f());

  if (options?.timeout) {
    promises.push(
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Race timeout')), options.timeout)
      )
    );
  }

  return Promise.race(promises);
}

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  options: RetryConfig = { count: 3, delay: 1000 }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.count; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < options.count) {
        const shouldRetry = options.condition?.(lastError, attempt) ?? true;
        if (!shouldRetry) throw lastError;

        const delay = typeof options.delay === 'function'
          ? options.delay(attempt)
          : options.delay * Math.pow(2, attempt); // Exponential backoff

        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError!;
}

// =============================================================================
// Suspense-like Primitives
// =============================================================================

const suspenseCache = new Map<string, { promise: Promise<any>; result?: any; error?: Error }>();

/**
 * Create a suspense-like resource that throws promises
 */
export function createSuspenseResource<T>(
  key: string,
  fetcher: () => Promise<T>
): () => T {
  return () => {
    let entry = suspenseCache.get(key);

    if (!entry) {
      const promise = fetcher().then(
        (result) => {
          entry!.result = result;
        },
        (error) => {
          entry!.error = error;
        }
      );
      entry = { promise };
      suspenseCache.set(key, entry);
    }

    if (entry.error) {
      throw entry.error;
    }

    if (entry.result !== undefined) {
      return entry.result;
    }

    throw entry.promise;
  };
}

/**
 * Preload a suspense resource
 */
export function preload<T>(key: string, fetcher: () => Promise<T>): void {
  if (!suspenseCache.has(key)) {
    const promise = fetcher().then(
      (result) => {
        const entry = suspenseCache.get(key)!;
        entry.result = result;
      },
      (error) => {
        const entry = suspenseCache.get(key)!;
        entry.error = error;
      }
    );
    suspenseCache.set(key, { promise });
  }
}

// =============================================================================
// Debounce & Throttle
// =============================================================================

/**
 * Create a debounced async function
 */
export function debounceAsync<T, A extends any[]>(
  fn: (...args: A) => Promise<T>,
  delay: number
): (...args: A) => Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  let deferred: PromiseWithResolvers<T> | null = null;

  return (...args: A): Promise<T> => {
    clearTimeout(timeout);

    if (!deferred) {
      deferred = Promise.withResolvers<T>();
    }

    const currentDeferred = deferred;
    timeout = setTimeout(async () => {
      try {
        const result = await fn(...args);
        currentDeferred.resolve(result);
      } catch (error) {
        currentDeferred.reject(error instanceof Error ? error : new Error(String(error)));
      } finally {
        deferred = null;
      }
    }, delay);

    return currentDeferred.promise;
  };
}

/**
 * Create a throttled async function
 */
export function throttleAsync<T, A extends any[]>(
  fn: (...args: A) => Promise<T>,
  limit: number
): (...args: A) => Promise<T> {
  let lastRun = 0;
  let pendingPromise: Promise<T> | null = null;

  return async (...args: A): Promise<T> => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun;

    if (timeSinceLastRun >= limit) {
      lastRun = now;
      return fn(...args);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise<T>((resolve) => {
        setTimeout(async () => {
          lastRun = Date.now();
          const result = await fn(...args);
          pendingPromise = null;
          resolve(result);
        }, limit - timeSinceLastRun);
      });
    }

    return pendingPromise;
  };
}

// =============================================================================
// Queue & Concurrency
// =============================================================================

/**
 * Create a queue for sequential async operations
 */
export function createQueue<T>(): {
  add: (task: () => Promise<T>) => Promise<T>;
  clear: () => void;
  size: () => number;
} {
  const queue: Array<{
    task: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  }> = [];
  let processing = false;

  const processQueue = async () => {
    if (processing || queue.length === 0) return;
    processing = true;

    while (queue.length > 0) {
      const { task, resolve, reject } = queue.shift()!;
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    processing = false;
  };

  return {
    add: (task: () => Promise<T>): Promise<T> => {
      return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject });
        processQueue();
      });
    },
    clear: () => {
      queue.length = 0;
    },
    size: () => queue.length,
  };
}

/**
 * Limit concurrent async operations
 */
export function createConcurrencyLimiter(limit: number): {
  run: <T>(task: () => Promise<T>) => Promise<T>;
  active: () => number;
} {
  let active = 0;
  const waiting: Array<() => void> = [];

  const run = async <T>(task: () => Promise<T>): Promise<T> => {
    while (active >= limit) {
      await new Promise<void>((resolve) => waiting.push(resolve));
    }

    active++;
    try {
      return await task();
    } finally {
      active--;
      if (waiting.length > 0) {
        const next = waiting.shift()!;
        next();
      }
    }
  };

  return {
    run,
    active: () => active,
  };
}
