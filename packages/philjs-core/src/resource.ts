/**
 * Advanced resource primitive for async data management (SolidStart-style).
 * Provides Suspense integration, dependent resources, and preloading.
 */

import { signal, memo, effect, batch, onCleanup, untrack } from './signals.js';
import type { Signal, Memo } from './types.js';

// ============================================================================
// Types
// ============================================================================

export type ResourceFetcher<T, S = unknown> = (source: S, info: ResourceFetcherInfo<T, S>) => T | Promise<T>;

export interface ResourceFetcherInfo<T, S = unknown> {
  value: T | undefined;
  refetching: boolean | unknown;
}

export interface ResourceOptions<T, S = unknown> {
  /**
   * Initial value for the resource
   */
  initialValue?: T;

  /**
   * Name for debugging
   */
  name?: string;

  /**
   * Whether to defer the initial fetch
   */
  deferStream?: boolean;

  /**
   * Server-side-only: whether to wait for this resource during SSR
   */
  ssrLoadFrom?: 'initial' | 'server';

  /**
   * Callback when resource starts loading
   */
  onHydrated?: (key: string, info: any) => void;
}

export interface Resource<T> {
  (): T | undefined;
  loading: boolean;
  error: Error | undefined;
  latest: T | undefined;
  state: 'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored';
}

export interface ResourceActions<T, S = unknown> {
  mutate: (value: T | undefined) => T | undefined;
  refetch: (info?: unknown) => T | Promise<T | undefined> | null | undefined;
}

/** Tuple returned from createResource: [resource, { mutate, refetch }] */
export type ResourceReturn<T> = [Resource<T>, ResourceActions<T>];

// ============================================================================
// Suspense Integration
// ============================================================================

const SuspenseContext: {
  active: boolean;
  promises: Set<Promise<any>>;
  increment?: () => void;
  decrement?: () => void;
} = {
  active: false,
  promises: new Set(),
};

/**
 * Enable Suspense mode for resources
 */
export function enableSuspense() {
  SuspenseContext.active = true;
}

/**
 * Disable Suspense mode for resources
 */
export function disableSuspense() {
  SuspenseContext.active = false;
  SuspenseContext.promises.clear();
}

/**
 * Check if currently in Suspense mode
 */
export function isSuspenseActive(): boolean {
  return SuspenseContext.active;
}

/**
 * Track a promise for Suspense
 */
function trackSuspensePromise(promise: Promise<any>) {
  if (SuspenseContext.active) {
    SuspenseContext.promises.add(promise);
    SuspenseContext.increment?.();

    promise.finally(() => {
      SuspenseContext.promises.delete(promise);
      SuspenseContext.decrement?.();
    });
  }
}

// ============================================================================
// Resource Primitive
// ============================================================================

/**
 * Create a resource for async data fetching with Suspense integration.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [data] = createResource(fetchUser);
 *
 * // With source signal
 * const [userId, setUserId] = signal(1);
 * const [user] = createResource(userId, fetchUser);
 *
 * // Access state
 * if (user.loading) return <div>Loading...</div>;
 * if (user.error) return <div>Error: {user.error.message}</div>;
 * return <div>{user()?.name}</div>;
 * ```
 */
export function createResource<T, S = true>(
  fetcher: ResourceFetcher<T, S>,
  options?: ResourceOptions<T, S>
): ResourceReturn<T>;

export function createResource<T, S>(
  source: S | (() => S),
  fetcher: ResourceFetcher<T, S>,
  options?: ResourceOptions<T, S>
): ResourceReturn<T>;

export function createResource<T, S = true>(
  sourceOrFetcher: S | (() => S) | ResourceFetcher<T, S>,
  fetcherOrOptions?: ResourceFetcher<T, S> | ResourceOptions<T, S>,
  maybeOptions?: ResourceOptions<T, S>
): ResourceReturn<T> {
  // Determine arguments
  let source: (() => S) | undefined;
  let fetcher: ResourceFetcher<T, S>;
  let options: ResourceOptions<T, S> = {};

  if (typeof fetcherOrOptions === 'function') {
    // createResource(source, fetcher, options?)
    source = typeof sourceOrFetcher === 'function'
      ? sourceOrFetcher as () => S
      : () => sourceOrFetcher as S;
    fetcher = fetcherOrOptions;
    options = maybeOptions || {};
  } else {
    // createResource(fetcher, options?)
    fetcher = sourceOrFetcher as ResourceFetcher<T, S>;
    options = fetcherOrOptions || {};
  }

  // State signals
  const value = signal<T | undefined>(options.initialValue);
  const error = signal<Error | undefined>(undefined);
  const loading = signal(false);
  const state = signal<'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored'>('unresolved');

  let latest: T | undefined = options.initialValue;
  let scheduled = false;
  let resolved = false;

  // Track ongoing fetch
  let currentFetch: Promise<T> | null = null;
  let fetchCounter = 0;

  /**
   * Load the resource
   */
  const load = (refetchInfo?: unknown): T | Promise<T | undefined> | null | undefined => {
    // Get source value
    const sourceValue = source ? source() as S : true as S;

    if (sourceValue == null) {
      return undefined;
    }

    const fetchId = ++fetchCounter;

    // Call fetcher
    const fetcherInfo: ResourceFetcherInfo<T, S> = {
      value: value(),
      refetching: refetchInfo !== undefined ? refetchInfo : (state() === 'refreshing'),
    };

    let result: T | Promise<T>;
    try {
      result = fetcher(sourceValue, fetcherInfo);
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)));
      state.set('errored');
      loading.set(false);
      return undefined;
    }

    // Handle synchronous result
    if (!(result instanceof Promise)) {
      batch(() => {
        value.set(result as T);
        latest = result as T;
        error.set(undefined);
        state.set('ready');
        loading.set(false);
      });
      resolved = true;
      return result;
    }

    // Handle async result
    currentFetch = result;
    scheduled = false;

    if (!resolved) {
      state.set('pending');
    } else {
      state.set('refreshing');
    }
    loading.set(true);

    // Track for Suspense
    trackSuspensePromise(result);

    result
      .then((data) => {
        // Ignore if this isn't the latest fetch
        if (fetchId !== fetchCounter) return;

        batch(() => {
          value.set(data);
          latest = data;
          error.set(undefined);
          state.set('ready');
          loading.set(false);
        });
        resolved = true;
        currentFetch = null;
      })
      .catch((err) => {
        // Ignore if this isn't the latest fetch
        if (fetchId !== fetchCounter) return;

        batch(() => {
          error.set(err instanceof Error ? err : new Error(String(err)));
          state.set('errored');
          loading.set(false);
        });
        currentFetch = null;
      });

    return result;
  };

  /**
   * Refetch the resource
   */
  const refetch = (info?: unknown): T | Promise<T | undefined> | null | undefined => {
    return load(info);
  };

  /**
   * Mutate the resource value directly
   */
  const mutate = (nextValue: T | undefined): T | undefined => {
    batch(() => {
      value.set(nextValue);
      latest = nextValue;
      if (nextValue !== undefined) {
        state.set('ready');
        error.set(undefined);
      }
    });
    return nextValue;
  };

  // Set up auto-refetch when source changes
  let lastSourceValue: S | null = null;
  let firstRun = true;
  if (source) {
    // Use effect to track source dependencies and re-run when they change
    effect(() => {
      const val = source!();

      // Skip the first run - initial load handles that
      if (firstRun) {
        firstRun = false;
        lastSourceValue = val;
        return;
      }

      // Trigger refetch when source changes (from null to value, or value to different value)
      const sourceChanged = val !== lastSourceValue && (val != null || lastSourceValue != null);
      if (sourceChanged && !scheduled) {
        scheduled = true;
        Promise.resolve().then(() => {
          if (scheduled) {
            load();
          }
        });
      }
      lastSourceValue = val;
    });
  }

  // Initial load (unless deferred)
  if (!options.deferStream) {
    load();
  }

  // Create the resource accessor
  const read = (() => {
    const currentValue = value();
    const currentError = error();
    const currentState = state();

    // Throw to Suspense if pending
    if (SuspenseContext.active && currentFetch && currentState === 'pending') {
      throw currentFetch;
    }

    // Throw error
    if (currentError) {
      throw currentError;
    }

    return currentValue;
  }) as Resource<T>;

  // Attach properties
  Object.defineProperty(read, 'loading', {
    get: () => loading(),
    enumerable: true,
  });

  Object.defineProperty(read, 'error', {
    get: () => error(),
    enumerable: true,
  });

  Object.defineProperty(read, 'latest', {
    get: () => latest,
    enumerable: true,
  });

  Object.defineProperty(read, 'state', {
    get: () => state(),
    enumerable: true,
  });

  // Return tuple: [resource, actions]
  return [read, { mutate, refetch }];
}

// ============================================================================
// Dependent Resources
// ============================================================================

/**
 * Create a resource that depends on another resource.
 * Only fetches when the parent resource has successfully loaded.
 *
 * @example
 * ```tsx
 * const [user] = createResource(fetchUser);
 * const [posts] = createDependentResource(
 *   () => user()?.id,
 *   (userId) => fetchUserPosts(userId)
 * );
 * ```
 */
export function createDependentResource<T, S>(
  source: () => S | undefined | null,
  fetcher: ResourceFetcher<T, S>,
  options?: ResourceOptions<T, S>
): ResourceReturn<T> {
  // Wrap source to handle null/undefined
  const safeSource = () => {
    const val = source();
    return val ?? null;
  };

  return createResource(safeSource as () => S, fetcher, options);
}

// ============================================================================
// Preloading
// ============================================================================

const preloadCache = new Map<string, {
  promise: Promise<any>;
  result?: any;
  error?: Error;
  timestamp: number;
}>();

const PRELOAD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Preload a resource before it's needed.
 * Caches the result for a short time.
 *
 * @example
 * ```tsx
 * // Preload on hover
 * <Link
 *   href="/user/1"
 *   onMouseEnter={() => preload('user-1', () => fetchUser(1))}
 * >
 *   User Profile
 * </Link>
 *
 * // Use the preloaded data
 * const [user] = createResource(() => fetchUser(1));
 * ```
 */
export function preload<T>(
  key: string,
  fetcher: () => T | Promise<T>
): Promise<T> {
  // Check cache
  const cached = preloadCache.get(key);
  if (cached && Date.now() - cached.timestamp < PRELOAD_CACHE_TTL) {
    if (cached.error) {
      return Promise.reject(cached.error);
    }
    if (cached.result !== undefined) {
      return Promise.resolve(cached.result);
    }
    return cached.promise;
  }

  // Fetch
  let promise: Promise<T>;
  try {
    const result = fetcher();
    promise = result instanceof Promise ? result : Promise.resolve(result);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    preloadCache.set(key, {
      promise: Promise.reject(error),
      error,
      timestamp: Date.now(),
    });
    return Promise.reject(error);
  }

  // Cache promise
  const entry: {
    promise: Promise<T>;
    timestamp: number;
    result?: T;
    error?: Error;
  } = {
    promise,
    timestamp: Date.now(),
  };
  preloadCache.set(key, entry);

  // Cache result/error
  promise
    .then((result) => {
      entry.result = result;
    })
    .catch((err) => {
      entry.error = err instanceof Error ? err : new Error(String(err));
    });

  return promise;
}

/**
 * Get preloaded data if available
 */
export function getPreloaded<T>(key: string): T | undefined {
  const cached = preloadCache.get(key);
  if (cached && Date.now() - cached.timestamp < PRELOAD_CACHE_TTL) {
    return cached.result;
  }
  return undefined;
}

/**
 * Clear preload cache
 */
export function clearPreloadCache(key?: string) {
  if (key) {
    preloadCache.delete(key);
  } else {
    preloadCache.clear();
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Refetch all active resources matching a predicate.
 * Useful for cache invalidation.
 *
 * @example
 * ```tsx
 * // Refetch all user-related resources
 * refetchResources((name) => name?.startsWith('user-'));
 * ```
 */
export function refetchResources(predicate?: (name?: string) => boolean) {
  // This would require tracking all resources
  // For now, this is a placeholder for the pattern
  console.warn('refetchResources is not yet implemented. Track resources manually.');
}

/**
 * Create a resource with automatic retry on failure.
 *
 * @example
 * ```tsx
 * const [data] = createResourceWithRetry(
 *   () => fetchData(),
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 * ```
 */
export function createResourceWithRetry<T, S = true>(
  fetcher: ResourceFetcher<T, S>,
  options?: ResourceOptions<T, S> & {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): ResourceReturn<T>;

export function createResourceWithRetry<T, S>(
  source: S | (() => S),
  fetcher: ResourceFetcher<T, S>,
  options?: ResourceOptions<T, S> & {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): ResourceReturn<T>;

export function createResourceWithRetry<T, S = true>(
  sourceOrFetcher: S | (() => S) | ResourceFetcher<T, S>,
  fetcherOrOptions?: ResourceFetcher<T, S> | (ResourceOptions<T, S> & {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }),
  maybeOptions?: ResourceOptions<T, S> & {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): ResourceReturn<T> {
  const maxRetries = (maybeOptions?.maxRetries ?? (fetcherOrOptions as any)?.maxRetries ?? 3);
  const retryDelay = (maybeOptions?.retryDelay ?? (fetcherOrOptions as any)?.retryDelay ?? 1000);
  const onRetry = (maybeOptions?.onRetry ?? (fetcherOrOptions as any)?.onRetry);

  // Wrap fetcher with retry logic
  const retryFetcher = async (source: S, info: ResourceFetcherInfo<T, S>): Promise<T> => {
    let lastError: Error | null = null;
    let attempt = 0;

    const actualFetcher = (typeof fetcherOrOptions === 'function'
      ? fetcherOrOptions
      : sourceOrFetcher) as ResourceFetcher<T, S>;

    while (attempt <= maxRetries) {
      try {
        const result = actualFetcher(source, info);
        return result instanceof Promise ? await result : result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < maxRetries) {
          onRetry?.(attempt + 1, lastError);
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          attempt++;
        } else {
          break;
        }
      }
    }

    throw lastError || new Error('Resource fetch failed');
  };

  // Create resource with retry fetcher
  if (typeof fetcherOrOptions === 'function') {
    return createResource(sourceOrFetcher as S | (() => S), retryFetcher, maybeOptions);
  } else {
    return createResource(retryFetcher as ResourceFetcher<T, S>, fetcherOrOptions);
  }
}
