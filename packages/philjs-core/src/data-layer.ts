/**
 * Unified data fetching layer with caching.
 * Combines server-side loading with client-side SWR-style caching.
 */

import { signal, memo } from "./signals.js";

export type QueryKey = string | readonly unknown[];

export type QueryOptions<T> = {
  /** Unique key for this query */
  key: QueryKey;
  /** Async function that fetches the data */
  fetcher: () => Promise<T>;
  /** Stale time in ms (default: 0) */
  staleTime?: number;
  /** Cache time in ms (default: 5 minutes) */
  cacheTime?: number;
  /** Refetch on window focus (default: false) */
  refetchOnFocus?: boolean;
  /** Refetch on reconnect (default: true) */
  refetchOnReconnect?: boolean;
  /** Refetch interval in ms */
  refetchInterval?: number;
  /** Initial data */
  initialData?: T;
  /** Suspense mode (throw promise) */
  suspense?: boolean;
  /** On success callback */
  onSuccess?: (data: T) => void;
  /** On error callback */
  onError?: (error: Error) => void;
};

export type QueryResult<T> = {
  /** The data returned by the query */
  data: T | undefined;
  /** Error if the query failed */
  error: Error | undefined;
  /** True while the query is fetching */
  isLoading: boolean;
  /** True while refetching (has data but fetching new) */
  isFetching: boolean;
  /** True if the query has been fetched at least once */
  isSuccess: boolean;
  /** True if the query failed */
  isError: boolean;
  /** Manually trigger a refetch */
  refetch: () => Promise<T>;
  /** Manually set the data (for optimistic updates) */
  mutate: (data: T | ((prev: T | undefined) => T)) => void;
};

export type MutationOptions<TData, TVariables> = {
  /** Mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** On success callback */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** On error callback */
  onError?: (error: Error, variables: TVariables) => void;
  /** On settled (success or error) */
  onSettled?: (data: TData | undefined, error: Error | undefined, variables: TVariables) => void;
  /** Optimistic update */
  optimisticUpdate?: (variables: TVariables) => void;
};

export type MutationResult<TData, TVariables> = {
  /** Trigger the mutation */
  mutate: (variables: TVariables) => Promise<TData>;
  /** Trigger the mutation (async version) */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** The data returned by the mutation */
  data: TData | undefined;
  /** Error if the mutation failed */
  error: Error | undefined;
  /** True while the mutation is running */
  isPending: boolean;
  /** True if the mutation succeeded */
  isSuccess: boolean;
  /** True if the mutation failed */
  isError: boolean;
  /** Reset the mutation state */
  reset: () => void;
};

/**
 * Global cache for queries.
 */
class QueryCache {
  private cache = new Map<string, {
    data: any;
    error: Error | undefined;
    timestamp: number;
    promise?: Promise<any>;
  }>();

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: any, error?: Error) {
    this.cache.set(key, {
      data: value,
      error,
      timestamp: Date.now(),
      promise: undefined,
    });
  }

  setPromise(key: string, promise: Promise<any>) {
    const entry = this.cache.get(key);
    if (entry) {
      entry.promise = promise;
    } else {
      this.cache.set(key, {
        data: undefined,
        error: undefined,
        timestamp: Date.now(),
        promise,
      });
    }
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  isStale(key: string, staleTime: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > staleTime;
  }
}

export const queryCache = new QueryCache();

/**
 * Create a query hook for data fetching.
 */
export function createQuery<T>(options: QueryOptions<T>): QueryResult<T> {
  const keyStr = JSON.stringify(options.key);

  // Signals for reactive state
  const data = signal<T | undefined>(options.initialData);
  const error = signal<Error | undefined>(undefined);
  const isLoading = signal(false);
  const isFetching = signal(false);

  // Check cache
  const cached = queryCache.get(keyStr);
  if (cached && !queryCache.isStale(keyStr, options.staleTime || 0)) {
    data.set(cached.data);
    error.set(cached.error);
  }

  let listenersAttached = false;

  // Fetch function
  const fetchData = async (): Promise<T> => {
    isFetching.set(true);

    try {
      // Check if there's already a promise in flight
      const existing = queryCache.get(keyStr);
      if (existing?.promise) {
        const result = await existing.promise;
        data.set(result);
        return result;
      }

      // Create new promise
      const promise = options.fetcher();
      queryCache.setPromise(keyStr, promise);

      const result = await promise;

      // Update cache and state
      queryCache.set(keyStr, result);
      data.set(result);
      error.set(undefined);

      // Call success callback
      options.onSuccess?.(result);

      return result;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));

      // Update cache and state
      queryCache.set(keyStr, undefined, e);
      error.set(e);

      // Call error callback
      options.onError?.(e);
    } finally {
      isFetching.set(false);
      isLoading.set(false);

      if (!listenersAttached) {
        listenersAttached = true;
        // Set up refetch on focus
        if (options.refetchOnFocus && typeof window !== "undefined") {
          window.addEventListener("focus", () => {
            if (queryCache.isStale(keyStr, options.staleTime || 0)) {
              fetchData();
            }
          });
        }

        // Set up refetch on reconnect
        if (options.refetchOnReconnect && typeof window !== "undefined") {
          window.addEventListener("online", () => {
            fetchData();
          });
        }

        // Set up refetch interval
        if (options.refetchInterval && typeof window !== "undefined") {
          setInterval(() => {
            fetchData();
          }, options.refetchInterval);
        }
      }
    }
  };

  // Initial fetch
  if (!cached || queryCache.isStale(keyStr, options.staleTime || 0)) {
    isLoading.set(true);

    if (options.suspense && typeof window === "undefined") {
      // Server-side: fetch synchronously
      throw fetchData();
    } else {
      // Client-side: fetch asynchronously
      fetchData();
    }
  }

  // Set up refetch on focus
  if (options.refetchOnFocus && typeof window !== "undefined") {
    window.addEventListener("focus", () => {
      if (queryCache.isStale(keyStr, options.staleTime || 0)) {
        fetchData();
      }
    });
  }

  // Set up refetch on reconnect
  if (options.refetchOnReconnect && typeof window !== "undefined") {
    window.addEventListener("online", () => {
      fetchData();
    });
  }

  // Set up refetch interval
  if (options.refetchInterval && typeof window !== "undefined") {
    setInterval(() => {
      fetchData();
    }, options.refetchInterval);
  }

  // Computed values
  const isSuccess = memo(() => data() !== undefined && !error());
  const isError = memo(() => error() !== undefined);

  return {
    data,
    error,
    isLoading,
    isFetching,
    isSuccess,
    isError,
    refetch: fetchData,
    mutate: (newData: T | ((prev: T | undefined) => T)) => {
      const updated = typeof newData === "function" ? (newData as (prev: T | undefined) => T)(data()) : newData;
      data.set(updated);
      queryCache.set(keyStr, { ...queryCache.get(keyStr), data: updated });
    },
  };
}

/**
 * Create a mutation hook for data modifications.
 */
export function createMutation<TData, TVariables>(
  options: MutationOptions<TData, TVariables>
): MutationResult<TData, TVariables> {
  // Signals for reactive state
  const data = signal<TData | undefined>(undefined);
  const error = signal<Error | undefined>(undefined);
  const isPending = signal(false);

  const execute = async (variables: TVariables): Promise<TData> => {
    isPending.set(true);
    error.set(undefined);

    try {
      // Optimistic update
      options.optimisticUpdate?.(variables);

      // Execute mutation
      const result = await options.mutationFn(variables);

      // Update state
      data.set(result);

      // Callbacks
      options.onSuccess?.(result, variables);
      options.onSettled?.(result, undefined, variables);

      return result;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));

      // Update state
      error.set(e);

      // Callbacks
      options.onError?.(e, variables);
      options.onSettled?.(undefined, e, variables);

      throw e;
    } finally {
      isPending.set(false);
    }
  };

  // Computed values
  const isSuccess = memo(() => data() !== undefined && !error());
  const isError = memo(() => error() !== undefined);

  return {
    mutate: (variables) => {
      execute(variables).catch(() => {
        // Error already handled in state
      });
      return Promise.resolve(data()!);
    },
    mutateAsync: execute,
    data,
    error,
    isPending,
    isSuccess,
    isError,
    reset: () => {
      data.set(undefined);
      error.set(undefined);
      isPending.set(false);
    },
  };
}

/**
 * Invalidate queries by key pattern.
 */
export function invalidateQueries(keyPattern?: QueryKey | ((key: QueryKey) => boolean)): void {
  // This would trigger refetch of matching queries
  // Implementation depends on query tracking system
  console.log("Invalidating queries:", keyPattern);
}

/**
 * Prefetch a query (for SSR or preloading).
 */
export async function prefetchQuery<T>(options: QueryOptions<T>): Promise<T> {
  const keyStr = JSON.stringify(options.key);

  // Check if already cached and fresh
  if (!queryCache.isStale(keyStr, options.staleTime || 0)) {
    const cached = queryCache.get(keyStr);
    if (cached?.data) return cached.data;
  }

  // Fetch and cache
  try {
    const result = await options.fetcher();
    queryCache.set(keyStr, result);
    return result;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    queryCache.set(keyStr, undefined, e);
    throw e;
  }
}