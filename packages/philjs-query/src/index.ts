/**
 * @philjs/query - TanStack Query-style Data Fetching
 *
 * A powerful data-fetching library with caching, automatic refetching,
 * mutations, and optimistic updates built on PhilJS signals.
 *
 * @example
 * ```tsx
 * import { createQueryClient, useQuery, useMutation, QueryClientProvider } from '@philjs/query';
 *
 * const queryClient = createQueryClient();
 *
 * function UserProfile({ userId }) {
 *   const { data, isLoading, error } = useQuery({
 *     queryKey: ['user', userId],
 *     queryFn: () => fetchUser(userId),
 *   });
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error error={error} />;
 *   return <Profile user={data} />;
 * }
 * ```
 */

import { signal, computed, effect, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export type QueryKey = readonly unknown[];

export type QueryStatus = 'pending' | 'success' | 'error';
export type FetchStatus = 'fetching' | 'paused' | 'idle';

export interface QueryState<TData = unknown, TError = Error> {
  data: TData | undefined;
  dataUpdatedAt: number;
  error: TError | null;
  errorUpdatedAt: number;
  failureCount: number;
  failureReason: TError | null;
  fetchStatus: FetchStatus;
  isInvalidated: boolean;
  status: QueryStatus;
}

export interface QueryResult<TData = unknown, TError = Error> {
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  isPending: boolean;
  isStale: boolean;
  refetch: () => Promise<TData>;
  remove: () => void;
}

export interface QueryOptions<TData = unknown, TError = Error> {
  queryKey: QueryKey;
  queryFn: (context: QueryFunctionContext) => Promise<TData>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchOnMount?: boolean | 'always';
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;
  retry?: number | boolean | ((failureCount: number, error: TError) => boolean);
  retryDelay?: number | ((attempt: number, error: TError) => number);
  select?: (data: TData) => TData;
  placeholderData?: TData | (() => TData);
  initialData?: TData | (() => TData);
  initialDataUpdatedAt?: number;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: (data: TData | undefined, error: TError | null) => void;
}

export interface MutationOptions<TData = unknown, TError = Error, TVariables = void, TContext = unknown> {
  mutationKey?: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => void;
  retry?: number | boolean | ((failureCount: number, error: TError) => boolean);
  retryDelay?: number | ((attempt: number, error: TError) => number);
}

export interface MutationResult<TData = unknown, TError = Error, TVariables = void> {
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  isPending: boolean;
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

export interface InfiniteQueryOptions<TData = unknown, TError = Error, TPageParam = unknown>
  extends Omit<QueryOptions<TData, TError>, 'queryFn'> {
  queryFn: (context: QueryFunctionContext<TPageParam>) => Promise<TData>;
  getNextPageParam: (lastPage: TData, allPages: TData[]) => TPageParam | undefined;
  getPreviousPageParam?: (firstPage: TData, allPages: TData[]) => TPageParam | undefined;
  initialPageParam: TPageParam;
}

export interface InfiniteQueryResult<TData = unknown, TError = Error> extends QueryResult<TData[], TError> {
  fetchNextPage: () => Promise<TData[]>;
  fetchPreviousPage: () => Promise<TData[]>;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
}

export interface QueryFunctionContext<TPageParam = unknown> {
  queryKey: QueryKey;
  pageParam?: TPageParam;
  signal: AbortSignal;
}

export interface QueryClientConfig {
  defaultOptions?: {
    queries?: Partial<QueryOptions>;
    mutations?: Partial<MutationOptions>;
  };
}

// ============================================================================
// Query Cache
// ============================================================================

interface CacheEntry<TData = unknown, TError = Error> {
  state: Signal<QueryState<TData, TError>>;
  queryKey: QueryKey;
  queryHash: string;
  lastAccessTime: number;
  gcTimeout?: ReturnType<typeof setTimeout>;
  refetchInterval?: ReturnType<typeof setInterval>;
  subscribers: Set<() => void>;
  abortController?: AbortController;
}

class QueryCache {
  private cache = new Map<string, CacheEntry>();
  private listeners = new Set<() => void>();

  get<TData = unknown, TError = Error>(queryHash: string): CacheEntry<TData, TError> | undefined {
    const entry = this.cache.get(queryHash) as CacheEntry<TData, TError> | undefined;
    if (entry) {
      entry.lastAccessTime = Date.now();
    }
    return entry;
  }

  set<TData = unknown, TError = Error>(
    queryHash: string,
    queryKey: QueryKey,
    initialState: QueryState<TData, TError>
  ): CacheEntry<TData, TError> {
    const existing = this.cache.get(queryHash);
    if (existing) {
      return existing as CacheEntry<TData, TError>;
    }

    const entry: CacheEntry<TData, TError> = {
      state: signal(initialState),
      queryKey,
      queryHash,
      lastAccessTime: Date.now(),
      subscribers: new Set(),
    };

    this.cache.set(queryHash, entry as CacheEntry);
    this.notify();

    return entry;
  }

  remove(queryHash: string): void {
    const entry = this.cache.get(queryHash);
    if (entry) {
      if (entry.gcTimeout) clearTimeout(entry.gcTimeout);
      if (entry.refetchInterval) clearInterval(entry.refetchInterval);
      if (entry.abortController) entry.abortController.abort();
      this.cache.delete(queryHash);
      this.notify();
    }
  }

  clear(): void {
    for (const [hash] of this.cache) {
      this.remove(hash);
    }
  }

  getAll(): CacheEntry[] {
    return Array.from(this.cache.values());
  }

  find(predicate: (entry: CacheEntry) => boolean): CacheEntry | undefined {
    for (const entry of this.cache.values()) {
      if (predicate(entry)) return entry;
    }
    return undefined;
  }

  findAll(predicate: (entry: CacheEntry) => boolean): CacheEntry[] {
    return Array.from(this.cache.values()).filter(predicate);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

// ============================================================================
// Query Client
// ============================================================================

export class QueryClient {
  private cache = new QueryCache();
  private config: QueryClientConfig;
  private defaultQueryOptions: Partial<QueryOptions>;
  private defaultMutationOptions: Partial<MutationOptions>;

  constructor(config: QueryClientConfig = {}) {
    this.config = config;
    this.defaultQueryOptions = {
      staleTime: 0,
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      ...config.defaultOptions?.queries,
    };
    this.defaultMutationOptions = {
      retry: 0,
      ...config.defaultOptions?.mutations,
    };

    this.setupGlobalListeners();
  }

  private setupGlobalListeners(): void {
    if (typeof window === 'undefined') return;

    // Refetch on window focus
    window.addEventListener('focus', () => {
      this.refetchOnFocus();
    });

    // Refetch on reconnect
    window.addEventListener('online', () => {
      this.refetchOnReconnect();
    });
  }

  private refetchOnFocus(): void {
    for (const entry of this.cache.getAll()) {
      if (entry.subscribers.size > 0) {
        // Has active subscribers
        this.refetchQuery(entry.queryKey);
      }
    }
  }

  private refetchOnReconnect(): void {
    for (const entry of this.cache.getAll()) {
      if (entry.subscribers.size > 0) {
        this.refetchQuery(entry.queryKey);
      }
    }
  }

  getQueryCache(): QueryCache {
    return this.cache;
  }

  getDefaultOptions(): { queries: Partial<QueryOptions>; mutations: Partial<MutationOptions> } {
    return {
      queries: this.defaultQueryOptions,
      mutations: this.defaultMutationOptions,
    };
  }

  // Query data access
  getQueryData<TData = unknown>(queryKey: QueryKey): TData | undefined {
    const hash = hashQueryKey(queryKey);
    const entry = this.cache.get<TData>(hash);
    return entry?.state()?.data;
  }

  setQueryData<TData = unknown>(
    queryKey: QueryKey,
    updater: TData | ((old: TData | undefined) => TData)
  ): TData {
    const hash = hashQueryKey(queryKey);
    let entry = this.cache.get<TData>(hash);

    if (!entry) {
      entry = this.cache.set<TData>(hash, queryKey, createInitialQueryState());
    }

    const oldData = entry.state().data;
    const newData = typeof updater === 'function' ? (updater as (old: TData | undefined) => TData)(oldData) : updater;

    entry.state.set({
      ...entry.state(),
      data: newData,
      dataUpdatedAt: Date.now(),
      status: 'success',
    });

    return newData;
  }

  // Query state access
  getQueryState<TData = unknown, TError = Error>(
    queryKey: QueryKey
  ): QueryState<TData, TError> | undefined {
    const hash = hashQueryKey(queryKey);
    const entry = this.cache.get<TData, TError>(hash);
    return entry?.state();
  }

  // Invalidation
  invalidateQueries(filters?: { queryKey?: QueryKey; predicate?: (query: CacheEntry) => boolean }): Promise<void> {
    const queries = filters?.queryKey
      ? this.cache.findAll((e) => matchQueryKey(e.queryKey, filters.queryKey!))
      : filters?.predicate
        ? this.cache.findAll(filters.predicate)
        : this.cache.getAll();

    for (const query of queries) {
      query.state.set({
        ...query.state(),
        isInvalidated: true,
      });
    }

    return Promise.all(queries.map((q) => this.refetchQuery(q.queryKey))).then(() => {});
  }

  // Refetch
  async refetchQuery<TData = unknown>(queryKey: QueryKey): Promise<TData | undefined> {
    const hash = hashQueryKey(queryKey);
    const entry = this.cache.get<TData>(hash);

    if (!entry) return undefined;

    // Would need the queryFn to refetch - this is simplified
    return entry.state().data;
  }

  // Reset
  resetQueries(filters?: { queryKey?: QueryKey }): void {
    const queries = filters?.queryKey
      ? this.cache.findAll((e) => matchQueryKey(e.queryKey, filters.queryKey!))
      : this.cache.getAll();

    for (const query of queries) {
      query.state.set(createInitialQueryState());
    }
  }

  // Remove
  removeQueries(filters?: { queryKey?: QueryKey }): void {
    const queries = filters?.queryKey
      ? this.cache.findAll((e) => matchQueryKey(e.queryKey, filters.queryKey!))
      : this.cache.getAll();

    for (const query of queries) {
      this.cache.remove(query.queryHash);
    }
  }

  // Prefetch
  async prefetchQuery<TData = unknown>(options: QueryOptions<TData>): Promise<void> {
    const hash = hashQueryKey(options.queryKey);
    let entry = this.cache.get<TData>(hash);

    if (!entry) {
      entry = this.cache.set<TData>(hash, options.queryKey, createInitialQueryState());
    }

    // Check if stale
    const state = entry.state();
    if (state.data && !isStale(state.dataUpdatedAt, options.staleTime ?? this.defaultQueryOptions.staleTime ?? 0)) {
      return;
    }

    // Fetch
    const abortController = new AbortController();
    entry.abortController = abortController;

    entry.state.set({
      ...entry.state(),
      fetchStatus: 'fetching',
    });

    try {
      const data = await options.queryFn({
        queryKey: options.queryKey,
        signal: abortController.signal,
      });

      entry.state.set({
        ...entry.state(),
        data,
        dataUpdatedAt: Date.now(),
        status: 'success',
        fetchStatus: 'idle',
        error: null,
        isInvalidated: false,
      });
    } catch (error) {
      entry.state.set({
        ...entry.state(),
        error: error as Error,
        errorUpdatedAt: Date.now(),
        status: 'error',
        fetchStatus: 'idle',
        failureCount: entry.state().failureCount + 1,
        failureReason: error as Error,
      });
    }
  }

  // Cancel
  cancelQueries(filters?: { queryKey?: QueryKey }): void {
    const queries = filters?.queryKey
      ? this.cache.findAll((e) => matchQueryKey(e.queryKey, filters.queryKey!))
      : this.cache.getAll();

    for (const query of queries) {
      if (query.abortController) {
        query.abortController.abort();
      }
    }
  }

  // Clear
  clear(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Helpers
// ============================================================================

function hashQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey, (_, val) =>
    typeof val === 'object' && val !== null && !Array.isArray(val)
      ? Object.keys(val)
          .sort()
          .reduce((result: Record<string, unknown>, key) => {
            result[key] = val[key];
            return result;
          }, {})
      : val
  );
}

function matchQueryKey(queryKey: QueryKey, matchKey: QueryKey): boolean {
  if (queryKey.length < matchKey.length) return false;

  for (let i = 0; i < matchKey.length; i++) {
    if (!deepEqual(queryKey[i], matchKey[i])) return false;
  }

  return true;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
  }

  return true;
}

function isStale(dataUpdatedAt: number, staleTime: number): boolean {
  return Date.now() - dataUpdatedAt > staleTime;
}

function createInitialQueryState<TData = unknown, TError = Error>(): QueryState<TData, TError> {
  return {
    data: undefined,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: 'idle',
    isInvalidated: false,
    status: 'pending',
  };
}

// ============================================================================
// Global Client
// ============================================================================

let defaultQueryClient: QueryClient | null = null;

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config);
}

export function setDefaultQueryClient(client: QueryClient): void {
  defaultQueryClient = client;
}

export function getDefaultQueryClient(): QueryClient {
  if (!defaultQueryClient) {
    defaultQueryClient = createQueryClient();
  }
  return defaultQueryClient;
}

// ============================================================================
// Hooks
// ============================================================================

export function useQuery<TData = unknown, TError = Error>(
  options: QueryOptions<TData, TError>
): QueryResult<TData, TError> {
  const client = getDefaultQueryClient();
  const cache = client.getQueryCache();
  const defaults = client.getDefaultOptions().queries;

  const mergedOptions = { ...defaults, ...options };
  const hash = hashQueryKey(options.queryKey);

  // Get or create cache entry
  let entry = cache.get<TData, TError>(hash);
  if (!entry) {
    entry = cache.set<TData, TError>(hash, options.queryKey, createInitialQueryState());
  }

  // Create reactive result
  const state = entry.state;

  // Fetch function
  const fetchData = async (): Promise<TData> => {
    const abortController = new AbortController();
    entry!.abortController = abortController;

    state.set({
      ...state(),
      fetchStatus: 'fetching',
    });

    try {
      const data = await mergedOptions.queryFn({
        queryKey: options.queryKey,
        signal: abortController.signal,
      });

      const selectedData = mergedOptions.select ? mergedOptions.select(data) : data;

      state.set({
        ...state(),
        data: selectedData,
        dataUpdatedAt: Date.now(),
        status: 'success',
        fetchStatus: 'idle',
        error: null,
        isInvalidated: false,
        failureCount: 0,
        failureReason: null,
      });

      mergedOptions.onSuccess?.(selectedData);
      mergedOptions.onSettled?.(selectedData, null);

      return selectedData;
    } catch (error) {
      const typedError = error as TError;
      const currentState = state();

      // Retry logic
      const shouldRetry =
        typeof mergedOptions.retry === 'function'
          ? mergedOptions.retry(currentState.failureCount + 1, typedError)
          : typeof mergedOptions.retry === 'number'
            ? currentState.failureCount < mergedOptions.retry
            : mergedOptions.retry;

      if (shouldRetry) {
        const delay =
          typeof mergedOptions.retryDelay === 'function'
            ? mergedOptions.retryDelay(currentState.failureCount + 1, typedError)
            : mergedOptions.retryDelay ?? 1000;

        state.set({
          ...currentState,
          failureCount: currentState.failureCount + 1,
          failureReason: typedError,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchData();
      }

      state.set({
        ...currentState,
        error: typedError,
        errorUpdatedAt: Date.now(),
        status: 'error',
        fetchStatus: 'idle',
        failureCount: currentState.failureCount + 1,
        failureReason: typedError,
      });

      mergedOptions.onError?.(typedError);
      mergedOptions.onSettled?.(undefined, typedError);

      throw typedError;
    }
  };

  // Initial fetch
  const enabled = mergedOptions.enabled ?? true;
  if (enabled) {
    const currentState = state();
    const shouldFetch =
      currentState.status === 'pending' ||
      currentState.isInvalidated ||
      (mergedOptions.refetchOnMount === 'always') ||
      (mergedOptions.refetchOnMount && isStale(currentState.dataUpdatedAt, mergedOptions.staleTime ?? 0));

    if (shouldFetch) {
      fetchData().catch(() => {}); // Errors handled in fetchData
    }
  }

  // Setup refetch interval
  if (mergedOptions.refetchInterval && typeof mergedOptions.refetchInterval === 'number') {
    if (entry.refetchInterval) {
      clearInterval(entry.refetchInterval);
    }
    entry.refetchInterval = setInterval(() => {
      if (mergedOptions.refetchIntervalInBackground || document.hasFocus()) {
        fetchData().catch(() => {});
      }
    }, mergedOptions.refetchInterval);
  }

  // Track subscriber
  const subscriber = () => {};
  entry.subscribers.add(subscriber);

  // Build result
  const currentState = state();

  return {
    data: currentState.data,
    error: currentState.error,
    isLoading: currentState.status === 'pending' && currentState.fetchStatus === 'fetching',
    isFetching: currentState.fetchStatus === 'fetching',
    isSuccess: currentState.status === 'success',
    isError: currentState.status === 'error',
    isPending: currentState.status === 'pending',
    isStale: isStale(currentState.dataUpdatedAt, mergedOptions.staleTime ?? 0),
    refetch: fetchData,
    remove: () => cache.remove(hash),
  };
}

export function useMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: MutationOptions<TData, TError, TVariables, TContext>
): MutationResult<TData, TError, TVariables> {
  const state = signal<{
    data: TData | undefined;
    error: TError | null;
    status: 'idle' | 'pending' | 'success' | 'error';
  }>({
    data: undefined,
    error: null,
    status: 'idle',
  });

  const mutateAsync = async (variables: TVariables): Promise<TData> => {
    state.set({ ...state(), status: 'pending', error: null });

    let context: TContext | undefined;

    try {
      // onMutate
      if (options.onMutate) {
        context = await options.onMutate(variables);
      }

      // Execute mutation
      const data = await options.mutationFn(variables);

      state.set({
        data,
        error: null,
        status: 'success',
      });

      options.onSuccess?.(data, variables, context!);
      options.onSettled?.(data, null, variables, context);

      return data;
    } catch (error) {
      const typedError = error as TError;

      state.set({
        ...state(),
        error: typedError,
        status: 'error',
      });

      options.onError?.(typedError, variables, context);
      options.onSettled?.(undefined, typedError, variables, context);

      throw typedError;
    }
  };

  const mutate = (variables: TVariables): void => {
    mutateAsync(variables).catch(() => {});
  };

  const reset = (): void => {
    state.set({
      data: undefined,
      error: null,
      status: 'idle',
    });
  };

  const currentState = state();

  return {
    data: currentState.data,
    error: currentState.error,
    isLoading: currentState.status === 'pending',
    isSuccess: currentState.status === 'success',
    isError: currentState.status === 'error',
    isIdle: currentState.status === 'idle',
    isPending: currentState.status === 'pending',
    mutate,
    mutateAsync,
    reset,
  };
}

export function useInfiniteQuery<TData = unknown, TError = Error, TPageParam = unknown>(
  options: InfiniteQueryOptions<TData, TError, TPageParam>
): InfiniteQueryResult<TData, TError> {
  const client = getDefaultQueryClient();
  const cache = client.getQueryCache();
  const hash = hashQueryKey(options.queryKey);

  // Store pages and params
  const pages = signal<TData[]>([]);
  const pageParams = signal<TPageParam[]>([options.initialPageParam]);
  const status = signal<QueryStatus>('pending');
  const error = signal<TError | null>(null);
  const isFetchingNextPage = signal(false);
  const isFetchingPreviousPage = signal(false);
  const isFetching = signal(false);

  const fetchPage = async (pageParam: TPageParam, direction: 'next' | 'previous' | 'initial'): Promise<TData> => {
    const abortController = new AbortController();

    if (direction === 'next') isFetchingNextPage.set(true);
    else if (direction === 'previous') isFetchingPreviousPage.set(true);
    isFetching.set(true);

    try {
      const data = await options.queryFn({
        queryKey: options.queryKey,
        pageParam,
        signal: abortController.signal,
      });

      if (direction === 'next' || direction === 'initial') {
        pages.set([...pages(), data]);
        const nextParam = options.getNextPageParam(data, pages());
        if (nextParam !== undefined) {
          pageParams.set([...pageParams(), nextParam]);
        }
      } else {
        pages.set([data, ...pages()]);
        const prevParam = options.getPreviousPageParam?.(data, pages());
        if (prevParam !== undefined) {
          pageParams.set([prevParam, ...pageParams()]);
        }
      }

      status.set('success');
      return data;
    } catch (err) {
      error.set(err as TError);
      status.set('error');
      throw err;
    } finally {
      isFetchingNextPage.set(false);
      isFetchingPreviousPage.set(false);
      isFetching.set(false);
    }
  };

  // Initial fetch
  if (options.enabled !== false && pages().length === 0) {
    fetchPage(options.initialPageParam, 'initial').catch(() => {});
  }

  const fetchNextPage = async (): Promise<TData[]> => {
    const params = pageParams();
    const lastParam = params[params.length - 1];
    const allPages = pages();
    const lastPage = allPages[allPages.length - 1];

    const nextParam = lastPage ? options.getNextPageParam(lastPage, allPages) : lastParam;
    if (nextParam === undefined) {
      return pages();
    }

    await fetchPage(nextParam, 'next');
    return pages();
  };

  const fetchPreviousPage = async (): Promise<TData[]> => {
    const allPages = pages();
    const firstPage = allPages[0];

    const prevParam = firstPage && options.getPreviousPageParam
      ? options.getPreviousPageParam(firstPage, allPages)
      : undefined;

    if (prevParam === undefined) {
      return pages();
    }

    await fetchPage(prevParam, 'previous');
    return pages();
  };

  const currentPages = pages();
  const lastPage = currentPages[currentPages.length - 1];
  const firstPage = currentPages[0];

  return {
    data: currentPages,
    error: error(),
    isLoading: status() === 'pending' && isFetching(),
    isFetching: isFetching(),
    isSuccess: status() === 'success',
    isError: status() === 'error',
    isPending: status() === 'pending',
    isStale: false,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage: lastPage ? options.getNextPageParam(lastPage, currentPages) !== undefined : false,
    hasPreviousPage: firstPage && options.getPreviousPageParam
      ? options.getPreviousPageParam(firstPage, currentPages) !== undefined
      : false,
    isFetchingNextPage: isFetchingNextPage(),
    isFetchingPreviousPage: isFetchingPreviousPage(),
    refetch: async () => {
      pages.set([]);
      pageParams.set([options.initialPageParam]);
      await fetchPage(options.initialPageParam, 'initial');
      return pages();
    },
    remove: () => cache.remove(hash),
  };
}

// ============================================================================
// Query Utilities
// ============================================================================

export function useQueryClient(): QueryClient {
  return getDefaultQueryClient();
}

export function useIsFetching(filters?: { queryKey?: QueryKey }): Computed<number> {
  const client = getDefaultQueryClient();
  const cache = client.getQueryCache();

  return computed(() => {
    const queries = filters?.queryKey
      ? cache.findAll((e) => matchQueryKey(e.queryKey, filters.queryKey!))
      : cache.getAll();

    return queries.filter((q) => q.state().fetchStatus === 'fetching').length;
  });
}

export function useIsMutating(): Computed<number> {
  // Would need mutation tracking - simplified for now
  return computed(() => 0);
}

// ============================================================================
// Query Component
// ============================================================================

export interface QueryProviderProps {
  client: QueryClient;
  children: unknown;
}

export function QueryClientProvider(props: QueryProviderProps): unknown {
  setDefaultQueryClient(props.client);
  return props.children;
}

// ============================================================================
// Optimistic Updates Helper
// ============================================================================

export function useOptimisticUpdate<TData = unknown>(queryKey: QueryKey) {
  const client = getDefaultQueryClient();

  return {
    update: (updater: (old: TData | undefined) => TData) => {
      const previousData = client.getQueryData<TData>(queryKey);
      client.setQueryData<TData>(queryKey, updater);
      return previousData;
    },
    rollback: (previousData: TData | undefined) => {
      if (previousData !== undefined) {
        client.setQueryData<TData>(queryKey, previousData);
      }
    },
    invalidate: () => {
      client.invalidateQueries({ queryKey });
    },
  };
}

// ============================================================================
// Suspense Support (Experimental)
// ============================================================================

const pendingQueries = new Map<string, Promise<unknown>>();

export function useSuspenseQuery<TData = unknown, TError = Error>(
  options: QueryOptions<TData, TError>
): { data: TData } {
  const client = getDefaultQueryClient();
  const hash = hashQueryKey(options.queryKey);
  const cache = client.getQueryCache();

  const entry = cache.get<TData, TError>(hash);
  const currentState = entry?.state();

  // If we have data, return it
  if (currentState?.status === 'success' && currentState.data !== undefined) {
    return { data: currentState.data };
  }

  // If there's an error, throw it
  if (currentState?.status === 'error' && currentState.error) {
    throw currentState.error;
  }

  // If we're already fetching, throw the pending promise
  let pending = pendingQueries.get(hash);
  if (pending) {
    throw pending;
  }

  // Start fetching and throw the promise
  pending = client.prefetchQuery(options).then(() => {
    pendingQueries.delete(hash);
  });
  pendingQueries.set(hash, pending);
  throw pending;
}

// ============================================================================
// Exports
// ============================================================================

export {
  QueryCache,
  hashQueryKey,
  matchQueryKey,
  isStale,
};
