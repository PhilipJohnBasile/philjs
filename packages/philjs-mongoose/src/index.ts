/**
 * PhilJS Mongoose Adapter
 *
 * Comprehensive MongoDB/Mongoose integration with PhilJS signals.
 * Features:
 * - Reactive query hooks with caching
 * - Pagination and infinite scroll
 * - Real-time change streams
 * - Transaction support
 * - Bulk operations
 * - Population and virtuals
 * - Full-text search
 * - Aggregation pipelines
 * - SSR data loading
 * - Type-safe schema helpers
 */

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';
import type {
  Model,
  Document,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
  Connection,
  Schema,
  SchemaDefinition,
  SchemaOptions,
  HydratedDocument,
  PopulateOptions,
  PipelineStage,
  AggregateOptions,
  ClientSession,
  SaveOptions,
  IndexDefinition,
  IndexOptions,
  CreateIndexesOptions,
} from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  stale: boolean;
}

export interface PaginationState<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  loading: boolean;
  error: Error | null;
}

export interface InfiniteState<T> {
  data: T[];
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
}

export interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  success: boolean;
}

export interface UseMongooseOptions<T> {
  initialData?: T[];
  refetchInterval?: number;
  populate?: string | string[] | PopulateOptions | PopulateOptions[];
  select?: string | Record<string, 0 | 1>;
  sort?: string | Record<string, 1 | -1>;
  lean?: boolean;
  enabled?: boolean | Signal<boolean>;
  staleTime?: number;
  cacheKey?: string;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

export interface UseMongooseByIdOptions<T> {
  populate?: string | string[] | PopulateOptions | PopulateOptions[];
  select?: string | Record<string, 0 | 1>;
  lean?: boolean;
  enabled?: boolean | Signal<boolean>;
  staleTime?: number;
  onSuccess?: (data: T | null) => void;
  onError?: (error: Error) => void;
}

export interface UsePaginatedOptions<T> extends UseMongooseOptions<T> {
  initialPage?: number;
  pageSize?: number;
}

export interface UseInfiniteOptions<T> extends UseMongooseOptions<T> {
  pageSize?: number;
  getCursor?: (lastItem: T) => unknown;
  cursorField?: string;
}

export interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  onSettled?: (data: T | null, error: Error | null) => void | Promise<void>;
  invalidateKeys?: string[];
  optimisticUpdate?: (data: Partial<T>) => void;
  rollback?: (error: Error) => void;
}

export interface UseAggregateOptions<R> {
  enabled?: boolean | Signal<boolean>;
  refetchInterval?: number;
  allowDiskUse?: boolean;
  hint?: string | Record<string, 1 | -1>;
  staleTime?: number;
}

export interface UseWatchOptions {
  fullDocument?: 'updateLookup' | 'whenAvailable';
  fullDocumentBeforeChange?: 'off' | 'whenAvailable' | 'required';
  maxAwaitTimeMS?: number;
  batchSize?: number;
  resumeAfter?: unknown;
  startAfter?: unknown;
  startAtOperationTime?: unknown;
}

export interface TransactionOptions {
  readConcern?: { level: string };
  writeConcern?: { w: number | string };
  readPreference?: string;
  maxCommitTimeMS?: number;
}

export interface BulkWriteOperation<T> {
  insertOne?: { document: Partial<T> };
  updateOne?: { filter: FilterQuery<T>; update: UpdateQuery<T>; upsert?: boolean };
  updateMany?: { filter: FilterQuery<T>; update: UpdateQuery<T>; upsert?: boolean };
  deleteOne?: { filter: FilterQuery<T> };
  deleteMany?: { filter: FilterQuery<T> };
  replaceOne?: { filter: FilterQuery<T>; replacement: T; upsert?: boolean };
}

export interface BulkWriteResult {
  insertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  deletedCount: number;
  upsertedCount: number;
  insertedIds: Record<number, unknown>;
  upsertedIds: Record<number, unknown>;
}

export interface TextSearchOptions {
  language?: string;
  caseSensitive?: boolean;
  diacriticSensitive?: boolean;
}

export interface SSRDataLoader<T> {
  load: () => Promise<T>;
  getKey: () => string;
  serialize: (data: T) => string;
  deserialize: (data: string) => T;
}

// ============================================================================
// Global State
// ============================================================================

let connection: Connection | null = null;
const queryCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
const subscriptions = new Map<string, Set<() => void>>();

// ============================================================================
// Connection Management
// ============================================================================

export function setConnection(conn: Connection): void {
  connection = conn;
}

export function getConnection(): Connection {
  if (!connection) {
    throw new Error('Mongoose connection not initialized. Call setConnection() first.');
  }
  return connection;
}

export function isConnected(): boolean {
  return connection?.readyState === 1;
}

export async function disconnect(): Promise<void> {
  if (connection) {
    await connection.close();
    connection = null;
    queryCache.clear();
    subscriptions.clear();
  }
}

export function getConnectionState(): {
  state: 'disconnected' | 'connected' | 'connecting' | 'disconnecting';
  host: string | null;
  port: number | null;
  name: string | null;
} {
  if (!connection) {
    return { state: 'disconnected', host: null, port: null, name: null };
  }

  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'] as const;
  return {
    state: states[connection.readyState] || 'disconnected',
    host: connection.host || null,
    port: connection.port || null,
    name: connection.name || null,
  };
}

// ============================================================================
// Cache Management
// ============================================================================

function getCacheKey(model: string, filter: unknown, options?: unknown): string {
  return `${model}:${JSON.stringify(filter)}:${JSON.stringify(options || {})}`;
}

function checkCache<T>(key: string, staleTime: number): { data: T; fresh: boolean } | null {
  const cached = queryCache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  const fresh = age < staleTime;

  return { data: cached.data as T, fresh };
}

function setCache<T>(key: string, data: T, ttl: number): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

export function clearCache(pattern?: string | RegExp): void {
  if (!pattern) {
    queryCache.clear();
    return;
  }

  for (const key of queryCache.keys()) {
    if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
      queryCache.delete(key);
    }
  }
}

export function getCacheStats(): {
  size: number;
  keys: string[];
  totalMemory: number;
} {
  const keys = Array.from(queryCache.keys());
  let totalMemory = 0;

  for (const [, value] of queryCache) {
    totalMemory += JSON.stringify(value.data).length;
  }

  return { size: queryCache.size, keys, totalMemory };
}

// ============================================================================
// Core Query Hooks
// ============================================================================

/**
 * Use Mongoose model with signals
 *
 * @example
 * ```tsx
 * import { useMongoose } from '@philjs/mongoose';
 * import { User } from './models/User';
 *
 * function UserList() {
 *   const { data, loading, refetch } = useMongoose(User, { isActive: true });
 *
 *   return (
 *     <ul>
 *       {data().map(user => <li>{user.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useMongoose<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: UseMongooseOptions<T> = {}
): {
  data: Signal<T[]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  state: Computed<QueryState<T[]>>;
  refetch: () => Promise<void>;
  mutate: (data: T[]) => void;
  invalidate: () => void;
} {
  const {
    initialData = [],
    refetchInterval,
    populate,
    select,
    sort,
    lean = false,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheKey,
    onSuccess,
    onError,
  } = options;

  const data = signal<T[]>(initialData);
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const stale = signal(false);

  const state = computed<QueryState<T[]>>(() => ({
    data: data(),
    loading: loading(),
    error: error(),
    stale: stale(),
  }));

  const key = cacheKey || getCacheKey(model.modelName, filter, { populate, select, sort, lean });

  const fetch = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    // Check cache
    const cached = checkCache<T[]>(key, staleTime);
    if (cached) {
      data.set(cached.data);
      stale.set(!cached.fresh);
      if (cached.fresh) return;
    }

    loading.set(true);
    error.set(null);

    try {
      let query = model.find(filter);

      if (populate) {
        query = query.populate(populate as string);
      }
      if (select) {
        query = query.select(select);
      }
      if (sort) {
        query = query.sort(sort);
      }
      if (lean) {
        query = query.lean();
      }

      const result = await query.exec();

      batch(() => {
        data.set(result as T[]);
        loading.set(false);
        stale.set(false);
      });

      setCache(key, result, staleTime);
      onSuccess?.(result as T[]);

      // Notify subscribers
      const subs = subscriptions.get(key);
      if (subs) {
        subs.forEach((cb) => cb());
      }
    } catch (e) {
      const err = e as Error;
      batch(() => {
        error.set(err);
        loading.set(false);
      });
      onError?.(err);
    }
  };

  const invalidate = (): void => {
    queryCache.delete(key);
    stale.set(true);
    fetch();
  };

  const mutate = (newData: T[]): void => {
    data.set(newData);
  };

  // Initial fetch
  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (isEnabled) {
      fetch();
    }
  });

  // Refetch interval
  if (refetchInterval && refetchInterval > 0) {
    const interval = setInterval(() => {
      const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
      if (isEnabled) {
        fetch();
      }
    }, refetchInterval);

    effect(() => () => clearInterval(interval));
  }

  return {
    data,
    loading,
    error,
    state,
    refetch: fetch,
    mutate,
    invalidate,
  };
}

/**
 * Use a single document by ID
 */
export function useMongooseById<T extends Document>(
  model: Model<T>,
  id: string | Signal<string>,
  options: UseMongooseByIdOptions<T> = {}
): {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  state: Computed<QueryState<T>>;
  refetch: () => Promise<void>;
  mutate: (data: T | null) => void;
} {
  const {
    populate,
    select,
    lean = false,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    onSuccess,
    onError,
  } = options;

  const data = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const state = computed<QueryState<T>>(() => ({
    data: data(),
    loading: loading(),
    error: error(),
    stale: false,
  }));

  const fetch = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    const docId = typeof id === 'function' ? id() : id;
    if (!docId) return;

    const key = getCacheKey(model.modelName, { _id: docId }, { populate, select, lean });

    // Check cache
    const cached = checkCache<T>(key, staleTime);
    if (cached?.fresh) {
      data.set(cached.data);
      return;
    }

    loading.set(true);
    error.set(null);

    try {
      let query = model.findById(docId);

      if (populate) {
        query = query.populate(populate as string);
      }
      if (select) {
        query = query.select(select);
      }
      if (lean) {
        query = query.lean();
      }

      const result = await query.exec();

      batch(() => {
        data.set(result as T | null);
        loading.set(false);
      });

      if (result) {
        setCache(key, result, staleTime);
      }
      onSuccess?.(result as T | null);
    } catch (e) {
      const err = e as Error;
      batch(() => {
        error.set(err);
        loading.set(false);
      });
      onError?.(err);
    }
  };

  const mutate = (newData: T | null): void => {
    data.set(newData);
  };

  // Watch for ID changes
  effect(() => {
    const docId = typeof id === 'function' ? id() : id;
    if (docId) {
      fetch();
    }
  });

  return {
    data,
    loading,
    error,
    state,
    refetch: fetch,
    mutate,
  };
}

/**
 * Use a single document matching filter
 */
export function useMongooseOne<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: UseMongooseByIdOptions<T> = {}
): {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
} {
  const { populate, select, lean = false, enabled = true, staleTime = 5 * 60 * 1000 } = options;

  const data = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const fetch = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    loading.set(true);
    error.set(null);

    try {
      let query = model.findOne(filter);

      if (populate) {
        query = query.populate(populate as string);
      }
      if (select) {
        query = query.select(select);
      }
      if (lean) {
        query = query.lean();
      }

      const result = await query.exec();

      batch(() => {
        data.set(result as T | null);
        loading.set(false);
      });
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
    }
  };

  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (isEnabled) {
      fetch();
    }
  });

  return { data, loading, error, refetch: fetch };
}

/**
 * Use document count
 */
export function useMongooseCount<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: { enabled?: boolean | Signal<boolean>; refetchInterval?: number } = {}
): {
  count: Signal<number>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
} {
  const { enabled = true, refetchInterval } = options;

  const count = signal(0);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const fetch = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    loading.set(true);
    error.set(null);

    try {
      const result = await model.countDocuments(filter).exec();
      batch(() => {
        count.set(result);
        loading.set(false);
      });
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
    }
  };

  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (isEnabled) {
      fetch();
    }
  });

  if (refetchInterval && refetchInterval > 0) {
    const interval = setInterval(fetch, refetchInterval);
    effect(() => () => clearInterval(interval));
  }

  return { count, loading, error, refetch: fetch };
}

// ============================================================================
// Pagination Hooks
// ============================================================================

/**
 * Use paginated Mongoose queries
 */
export function usePaginated<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: UsePaginatedOptions<T> = {}
): {
  state: Computed<PaginationState<T>>;
  data: Signal<T[]>;
  page: Signal<number>;
  pageSize: Signal<number>;
  total: Signal<number>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  refetch: () => Promise<void>;
} {
  const {
    initialPage = 1,
    pageSize: initialPageSize = 20,
    populate,
    select,
    sort,
    lean = false,
    enabled = true,
    staleTime = 5 * 60 * 1000,
  } = options;

  const data = signal<T[]>([]);
  const page = signal(initialPage);
  const pageSize = signal(initialPageSize);
  const total = signal(0);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const totalPages = computed(() => Math.ceil(total() / pageSize()));
  const hasNext = computed(() => page() < totalPages());
  const hasPrev = computed(() => page() > 1);

  const state = computed<PaginationState<T>>(() => ({
    data: data(),
    page: page(),
    pageSize: pageSize(),
    total: total(),
    totalPages: totalPages(),
    hasNext: hasNext(),
    hasPrev: hasPrev(),
    loading: loading(),
    error: error(),
  }));

  const fetchData = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    loading.set(true);
    error.set(null);

    try {
      // Get count
      const countResult = await model.countDocuments(filter).exec();

      // Get data
      const skip = (page() - 1) * pageSize();
      let query = model.find(filter).skip(skip).limit(pageSize());

      if (populate) {
        query = query.populate(populate as string);
      }
      if (select) {
        query = query.select(select);
      }
      if (sort) {
        query = query.sort(sort);
      }
      if (lean) {
        query = query.lean();
      }

      const result = await query.exec();

      batch(() => {
        data.set(result as T[]);
        total.set(countResult);
        loading.set(false);
      });
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
    }
  };

  const goToPage = (newPage: number): void => {
    const maxPage = totalPages();
    const validPage = Math.max(1, Math.min(newPage, maxPage || 1));
    page.set(validPage);
  };

  const nextPage = (): void => {
    if (hasNext()) {
      page.set(page() + 1);
    }
  };

  const prevPage = (): void => {
    if (hasPrev()) {
      page.set(page() - 1);
    }
  };

  const setPageSize = (size: number): void => {
    pageSize.set(size);
    page.set(1);
  };

  // Refetch when page or pageSize changes
  effect(() => {
    const _page = page();
    const _pageSize = pageSize();
    fetchData();
  });

  return {
    state,
    data,
    page,
    pageSize,
    total,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refetch: fetchData,
  };
}

/**
 * Use infinite scroll / cursor-based pagination
 */
export function useInfinite<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: UseInfiniteOptions<T> = {}
): {
  data: Signal<T[]>;
  loading: Signal<boolean>;
  loadingMore: Signal<boolean>;
  error: Signal<Error | null>;
  hasMore: Signal<boolean>;
  state: Computed<InfiniteState<T>>;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  reset: () => void;
} {
  const {
    pageSize = 20,
    getCursor = (item) => (item as unknown as { _id: unknown })._id,
    cursorField = '_id',
    populate,
    select,
    sort = { [cursorField]: -1 },
    lean = false,
    enabled = true,
  } = options;

  const data = signal<T[]>([]);
  const loading = signal(false);
  const loadingMore = signal(false);
  const error = signal<Error | null>(null);
  const cursor = signal<unknown>(null);
  const hasMore = signal(true);

  const state = computed<InfiniteState<T>>(() => ({
    data: data(),
    hasMore: hasMore(),
    loading: loading(),
    loadingMore: loadingMore(),
    error: error(),
  }));

  const fetchData = async (isLoadMore = false): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    if (isLoadMore) {
      loadingMore.set(true);
    } else {
      loading.set(true);
    }
    error.set(null);

    try {
      const cursorValue = cursor();
      const queryFilter: FilterQuery<T> = cursorValue
        ? { ...filter, [cursorField]: { $lt: cursorValue } }
        : filter;

      let query = model.find(queryFilter).limit(pageSize);

      if (populate) {
        query = query.populate(populate as string);
      }
      if (select) {
        query = query.select(select);
      }
      if (sort) {
        query = query.sort(sort);
      }
      if (lean) {
        query = query.lean();
      }

      const result = (await query.exec()) as T[];

      batch(() => {
        if (isLoadMore) {
          data.set([...data(), ...result]);
        } else {
          data.set(result);
        }

        if (result.length < pageSize) {
          hasMore.set(false);
        } else {
          const lastItem = result[result.length - 1];
          cursor.set(getCursor(lastItem));
        }

        loading.set(false);
        loadingMore.set(false);
      });
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
        loadingMore.set(false);
      });
    }
  };

  const loadMore = async (): Promise<void> => {
    if (!hasMore() || loadingMore()) return;
    await fetchData(true);
  };

  const reset = (): void => {
    batch(() => {
      data.set([]);
      cursor.set(null);
      hasMore.set(true);
    });
    fetchData();
  };

  // Initial fetch
  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (isEnabled) {
      fetchData();
    }
  });

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    state,
    loadMore,
    refetch: () => fetchData(),
    reset,
  };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Use Mongoose mutations
 */
export function useMongooseMutation<T extends Document>(
  model: Model<T>,
  options: UseMutationOptions<T> = {}
): {
  state: Computed<MutationState<T>>;
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  success: Signal<boolean>;
  create: (data: Partial<T>, saveOptions?: SaveOptions) => Promise<T>;
  update: (id: string, update: UpdateQuery<T>, queryOptions?: QueryOptions) => Promise<T | null>;
  updateMany: (filter: FilterQuery<T>, update: UpdateQuery<T>) => Promise<{ modifiedCount: number }>;
  remove: (id: string) => Promise<void>;
  removeMany: (filter: FilterQuery<T>) => Promise<{ deletedCount: number }>;
  upsert: (filter: FilterQuery<T>, update: UpdateQuery<T>) => Promise<T | null>;
  findOneAndUpdate: (filter: FilterQuery<T>, update: UpdateQuery<T>, opts?: QueryOptions) => Promise<T | null>;
  reset: () => void;
} {
  const { onSuccess, onError, onSettled, invalidateKeys, optimisticUpdate, rollback } = options;

  const data = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const success = signal(false);

  const state = computed<MutationState<T>>(() => ({
    data: data(),
    loading: loading(),
    error: error(),
    success: success(),
  }));

  const invalidateCaches = (): void => {
    if (invalidateKeys) {
      invalidateKeys.forEach((key) => clearCache(key));
    }
    // Also invalidate model-specific caches
    clearCache(model.modelName);
  };

  const create = async (docData: Partial<T>, saveOptions?: SaveOptions): Promise<T> => {
    loading.set(true);
    error.set(null);
    success.set(false);

    if (optimisticUpdate) {
      optimisticUpdate(docData);
    }

    try {
      const doc = new model(docData);
      const result = await doc.save(saveOptions);

      batch(() => {
        data.set(result as T);
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      if (onSuccess) {
        await onSuccess(result as T);
      }
      if (onSettled) {
        await onSettled(result as T, null);
      }

      return result as T;
    } catch (e) {
      const err = e as Error;

      if (rollback) {
        rollback(err);
      }

      batch(() => {
        error.set(err);
        loading.set(false);
        success.set(false);
      });

      if (onError) {
        await onError(err);
      }
      if (onSettled) {
        await onSettled(null, err);
      }

      throw err;
    }
  };

  const update = async (
    id: string,
    updateData: UpdateQuery<T>,
    queryOptions: QueryOptions = {}
  ): Promise<T | null> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await model
        .findByIdAndUpdate(id, updateData, { new: true, ...queryOptions })
        .exec();

      batch(() => {
        data.set(result as T | null);
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      if (result && onSuccess) {
        await onSuccess(result as T);
      }

      return result as T | null;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      if (onError) {
        await onError(e as Error);
      }
      throw e;
    }
  };

  const updateMany = async (
    filter: FilterQuery<T>,
    updateData: UpdateQuery<T>
  ): Promise<{ modifiedCount: number }> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await model.updateMany(filter, updateData).exec();

      batch(() => {
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      return { modifiedCount: result.modifiedCount };
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const remove = async (id: string): Promise<void> => {
    loading.set(true);
    error.set(null);

    try {
      await model.findByIdAndDelete(id).exec();

      batch(() => {
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const removeMany = async (filter: FilterQuery<T>): Promise<{ deletedCount: number }> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await model.deleteMany(filter).exec();

      batch(() => {
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      return { deletedCount: result.deletedCount };
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const upsert = async (filter: FilterQuery<T>, updateData: UpdateQuery<T>): Promise<T | null> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await model
        .findOneAndUpdate(filter, updateData, { upsert: true, new: true })
        .exec();

      batch(() => {
        data.set(result as T | null);
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      if (result && onSuccess) {
        await onSuccess(result as T);
      }

      return result as T | null;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const findOneAndUpdate = async (
    filter: FilterQuery<T>,
    updateData: UpdateQuery<T>,
    opts: QueryOptions = {}
  ): Promise<T | null> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await model.findOneAndUpdate(filter, updateData, { new: true, ...opts }).exec();

      batch(() => {
        data.set(result as T | null);
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      return result as T | null;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const reset = (): void => {
    batch(() => {
      data.set(null);
      loading.set(false);
      error.set(null);
      success.set(false);
    });
  };

  return {
    state,
    data,
    loading,
    error,
    success,
    create,
    update,
    updateMany,
    remove,
    removeMany,
    upsert,
    findOneAndUpdate,
    reset,
  };
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Use bulk write operations
 */
export function useBulkWrite<T extends Document>(
  model: Model<T>
): {
  execute: (operations: BulkWriteOperation<T>[]) => Promise<BulkWriteResult>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  result: Signal<BulkWriteResult | null>;
} {
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const result = signal<BulkWriteResult | null>(null);

  const execute = async (operations: BulkWriteOperation<T>[]): Promise<BulkWriteResult> => {
    loading.set(true);
    error.set(null);

    try {
      const bulkResult = await model.bulkWrite(operations as any);

      const mappedResult: BulkWriteResult = {
        insertedCount: bulkResult.insertedCount,
        matchedCount: bulkResult.matchedCount,
        modifiedCount: bulkResult.modifiedCount,
        deletedCount: bulkResult.deletedCount,
        upsertedCount: bulkResult.upsertedCount,
        insertedIds: bulkResult.insertedIds as unknown as Record<number, unknown>,
        upsertedIds: bulkResult.upsertedIds as unknown as Record<number, unknown>,
      };

      batch(() => {
        result.set(mappedResult);
        loading.set(false);
      });

      clearCache(model.modelName);

      return mappedResult;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  return { execute, loading, error, result };
}

/**
 * Use insert many
 */
export function useInsertMany<T extends Document>(
  model: Model<T>
): {
  insert: (docs: Partial<T>[], options?: { ordered?: boolean }) => Promise<T[]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  inserted: Signal<T[]>;
} {
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const inserted = signal<T[]>([]);

  const insert = async (docs: Partial<T>[], options?: { ordered?: boolean }): Promise<T[]> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await model.insertMany(docs, options);

      batch(() => {
        inserted.set(result as T[]);
        loading.set(false);
      });

      clearCache(model.modelName);

      return result as T[];
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  return { insert, loading, error, inserted };
}

// ============================================================================
// Aggregation Hook
// ============================================================================

/**
 * Use Mongoose aggregation pipeline
 */
export function useMongooseAggregate<T extends Document, R = unknown>(
  model: Model<T>,
  pipeline: PipelineStage[] | Signal<PipelineStage[]>,
  options: UseAggregateOptions<R> = {}
): {
  data: Signal<R[]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
} {
  const {
    enabled = true,
    refetchInterval,
    allowDiskUse = false,
    hint,
    staleTime = 5 * 60 * 1000,
  } = options;

  const data = signal<R[]>([]);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const execute = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    loading.set(true);
    error.set(null);

    try {
      const pipelineValue = typeof pipeline === 'function' ? pipeline() : pipeline;
      const aggOptions: AggregateOptions = {};

      if (allowDiskUse) {
        aggOptions.allowDiskUse = true;
      }
      if (hint) {
        aggOptions.hint = hint;
      }

      const result = await model.aggregate<R>(pipelineValue, aggOptions).exec();

      batch(() => {
        data.set(result);
        loading.set(false);
      });
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
    }
  };

  // Watch for pipeline changes if it's a signal
  effect(() => {
    if (typeof pipeline === 'function') {
      pipeline(); // Subscribe to changes
    }
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (isEnabled) {
      execute();
    }
  });

  if (refetchInterval && refetchInterval > 0) {
    const interval = setInterval(execute, refetchInterval);
    effect(() => () => clearInterval(interval));
  }

  return { data, loading, error, refetch: execute };
}

// ============================================================================
// Real-Time (Change Streams)
// ============================================================================

/**
 * Use Mongoose change streams for real-time updates
 */
export function useMongooseWatch<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: UseWatchOptions & {
    onData?: (data: T[]) => void;
    onInsert?: (doc: T) => void;
    onUpdate?: (doc: T) => void;
    onDelete?: (id: unknown) => void;
  } = {}
): {
  data: Signal<T[]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  pause: () => void;
  resume: () => void;
  isPaused: Signal<boolean>;
} {
  const { onData, onInsert, onUpdate, onDelete, ...streamOptions } = options;

  const data = signal<T[]>([]);
  const loading = signal(true);
  const error = signal<Error | null>(null);
  const isPaused = signal(false);

  let changeStream: ReturnType<typeof model.watch> | null = null;

  const fetchInitial = async (): Promise<void> => {
    try {
      const result = await model.find(filter).exec();
      data.set(result as T[]);
      onData?.(result as T[]);
      loading.set(false);
    } catch (e) {
      error.set(e as Error);
      loading.set(false);
    }
  };

  const startWatch = (): void => {
    changeStream = model.watch([], {
      fullDocument: streamOptions.fullDocument || 'updateLookup',
      ...streamOptions,
    });

    changeStream.on('change', async (change: any) => {
      if (isPaused()) return;

      try {
        switch (change.operationType) {
          case 'insert':
            if (onInsert && change.fullDocument) {
              onInsert(change.fullDocument as T);
            }
            break;
          case 'update':
          case 'replace':
            if (onUpdate && change.fullDocument) {
              onUpdate(change.fullDocument as T);
            }
            break;
          case 'delete':
            if (onDelete && change.documentKey?._id) {
              onDelete(change.documentKey._id);
            }
            break;
        }

        // Refetch to get updated list
        const result = await model.find(filter).exec();
        data.set(result as T[]);
        onData?.(result as T[]);
      } catch (e) {
        error.set(e as Error);
      }
    });

    changeStream.on('error', (e: Error) => {
      error.set(e);
    });
  };

  const pause = (): void => {
    isPaused.set(true);
  };

  const resume = (): void => {
    isPaused.set(false);
  };

  // Initialize
  fetchInitial();
  startWatch();

  effect(() => () => {
    changeStream?.close();
  });

  return { data, loading, error, pause, resume, isPaused };
}

// ============================================================================
// Transaction Support
// ============================================================================

/**
 * Use Mongoose transactions
 */
export function useTransaction(
  options: TransactionOptions = {}
): {
  execute: <T>(fn: (session: ClientSession) => Promise<T>) => Promise<T>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
} {
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const execute = async <T>(fn: (session: ClientSession) => Promise<T>): Promise<T> => {
    const conn = getConnection();
    const session = await conn.startSession();

    loading.set(true);
    error.set(null);

    try {
      session.startTransaction({
        readConcern: options.readConcern as any,
        writeConcern: options.writeConcern as any,
        readPreference: options.readPreference as any,
        maxCommitTimeMS: options.maxCommitTimeMS,
      });

      const result = await fn(session);
      await session.commitTransaction();

      loading.set(false);
      return result;
    } catch (e) {
      await session.abortTransaction();
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    } finally {
      session.endSession();
    }
  };

  return { execute, loading, error };
}

// ============================================================================
// Text Search
// ============================================================================

/**
 * Use full-text search
 */
export function useTextSearch<T extends Document>(
  model: Model<T>,
  searchQuery: string | Signal<string>,
  options: TextSearchOptions & UseMongooseOptions<T> = {}
): {
  data: Signal<T[]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
} {
  const { language, caseSensitive, diacriticSensitive, ...queryOptions } = options;

  const data = signal<T[]>([]);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const search = async (): Promise<void> => {
    const query = typeof searchQuery === 'function' ? searchQuery() : searchQuery;
    if (!query || query.trim().length === 0) {
      data.set([]);
      return;
    }

    loading.set(true);
    error.set(null);

    try {
      const textSearch: any = {
        $search: query,
      };
      if (language) textSearch.$language = language;
      if (caseSensitive !== undefined) textSearch.$caseSensitive = caseSensitive;
      if (diacriticSensitive !== undefined) textSearch.$diacriticSensitive = diacriticSensitive;

      let mongoQuery = model.find({ $text: textSearch } as FilterQuery<T>);

      if (queryOptions.select) {
        mongoQuery = mongoQuery.select({ ...queryOptions.select, score: { $meta: 'textScore' } });
      } else {
        mongoQuery = mongoQuery.select({ score: { $meta: 'textScore' } });
      }

      mongoQuery = mongoQuery.sort({ score: { $meta: 'textScore' } });

      if (queryOptions.populate) {
        mongoQuery = mongoQuery.populate(queryOptions.populate as string);
      }

      const result = await mongoQuery.exec();

      batch(() => {
        data.set(result as T[]);
        loading.set(false);
      });
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
    }
  };

  // Watch for query changes
  effect(() => {
    if (typeof searchQuery === 'function') {
      searchQuery(); // Subscribe to changes
    }
    search();
  });

  return { data, loading, error, refetch: search };
}

// ============================================================================
// Distinct Values
// ============================================================================

/**
 * Use distinct field values
 */
export function useDistinct<T extends Document, K extends keyof T>(
  model: Model<T>,
  field: K,
  filter: FilterQuery<T> = {},
  options: { enabled?: boolean | Signal<boolean> } = {}
): {
  values: Signal<T[K][]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
} {
  const { enabled = true } = options;

  const values = signal<T[K][]>([]);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const fetch = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    loading.set(true);
    error.set(null);

    try {
      const result = await model.distinct(field as string, filter).exec();

      batch(() => {
        values.set(result as T[K][]);
        loading.set(false);
      });
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
    }
  };

  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (isEnabled) {
      fetch();
    }
  });

  return { values, loading, error, refetch: fetch };
}

// ============================================================================
// Optimistic Updates
// ============================================================================

/**
 * Use optimistic updates
 */
export function useOptimistic<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: UseMongooseOptions<T> = {}
): ReturnType<typeof useMongoose<T>> & {
  optimisticInsert: (item: Partial<T>) => void;
  optimisticUpdate: (id: string, updates: Partial<T>) => void;
  optimisticDelete: (id: string) => void;
  rollback: () => void;
} {
  const query = useMongoose(model, filter, options);
  const originalData = signal<T[] | null>(null);

  // Save original on first load
  effect(() => {
    const data = query.data();
    if (data.length > 0 && originalData() === null) {
      originalData.set([...data]);
    }
  });

  const optimisticInsert = (item: Partial<T>): void => {
    const current = query.data();
    if (originalData() === null) {
      originalData.set([...current]);
    }
    query.mutate([...current, item as T]);
  };

  const optimisticUpdate = (id: string, updates: Partial<T>): void => {
    const current = query.data();
    if (originalData() === null) {
      originalData.set([...current]);
    }
    const updated = current.map((item) => {
      const itemId = (item as unknown as { _id: { toString: () => string } })._id?.toString();
      return itemId === id ? { ...item, ...updates } : item;
    });
    query.mutate(updated);
  };

  const optimisticDelete = (id: string): void => {
    const current = query.data();
    if (originalData() === null) {
      originalData.set([...current]);
    }
    const filtered = current.filter((item) => {
      const itemId = (item as unknown as { _id: { toString: () => string } })._id?.toString();
      return itemId !== id;
    });
    query.mutate(filtered);
  };

  const rollback = (): void => {
    const original = originalData();
    if (original) {
      query.mutate(original);
      originalData.set(null);
    }
  };

  return {
    ...query,
    optimisticInsert,
    optimisticUpdate,
    optimisticDelete,
    rollback,
  };
}

// ============================================================================
// Index Management
// ============================================================================

/**
 * Manage model indexes
 */
export async function createIndexes<T extends Document>(
  model: Model<T>,
  indexes: Array<{ fields: IndexDefinition; options?: IndexOptions }>
): Promise<void> {
  for (const index of indexes) {
    await model.collection.createIndex(index.fields, index.options || {});
  }
}

export async function listIndexes<T extends Document>(
  model: Model<T>
): Promise<Array<{ name: string; key: Record<string, number> }>> {
  const indexes = await model.collection.indexes();
  return indexes.map((idx) => ({
    name: idx.name || '',
    key: idx.key as Record<string, number>,
  }));
}

export async function dropIndex<T extends Document>(model: Model<T>, indexName: string): Promise<void> {
  await model.collection.dropIndex(indexName);
}

export async function ensureIndexes<T extends Document>(model: Model<T>): Promise<void> {
  await model.ensureIndexes();
}

// ============================================================================
// Population Helpers
// ============================================================================

/**
 * Deep populate with signals
 */
export function usePopulated<T extends Document, P = unknown>(
  model: Model<T>,
  id: string | Signal<string>,
  populatePath: string | PopulateOptions | PopulateOptions[],
  options: UseMongooseByIdOptions<T> = {}
): {
  data: Signal<(T & P) | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
} {
  return useMongooseById(model, id, {
    ...options,
    populate: populatePath,
  }) as unknown as {
    data: Signal<(T & P) | null>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
    refetch: () => Promise<void>;
  };
}

// ============================================================================
// SSR Data Loading
// ============================================================================

/**
 * Create SSR data loader for Mongoose queries
 */
export function createSSRDataLoader<T extends Document>(
  key: string,
  model: Model<T>,
  filter: FilterQuery<T>,
  options: UseMongooseOptions<T> = {}
): SSRDataLoader<T[]> {
  return {
    load: async () => {
      const { populate, select, sort, lean = false } = options;

      let query = model.find(filter);

      if (populate) {
        query = query.populate(populate as string);
      }
      if (select) {
        query = query.select(select);
      }
      if (sort) {
        query = query.sort(sort);
      }
      if (lean) {
        query = query.lean();
      }

      return (await query.exec()) as T[];
    },
    getKey: () => key,
    serialize: (data: T[]) => JSON.stringify(data),
    deserialize: (data: string) => JSON.parse(data) as T[],
  };
}

export async function prefetchForSSR<T>(loaders: SSRDataLoader<T>[]): Promise<Map<string, T>> {
  const results = new Map<string, T>();

  await Promise.all(
    loaders.map(async (loader) => {
      const data = await loader.load();
      results.set(loader.getKey(), data);
    })
  );

  return results;
}

export function hydrateFromSSR<T>(key: string, windowKey = '__MONGOOSE_DATA__'): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hydrationData = (window as Record<string, Record<string, string>>)[windowKey];
  if (!hydrationData || !hydrationData[key]) {
    return null;
  }

  try {
    return JSON.parse(hydrationData[key]) as T;
  } catch {
    return null;
  }
}

// ============================================================================
// Schema Helpers
// ============================================================================

/**
 * Create schema with signal-friendly virtuals
 */
export function createSchema<T>(
  definition: SchemaDefinition<T>,
  options: SchemaOptions = {}
): Schema<T> {
  const schema = new (getConnection().base.Schema)(definition, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    ...options,
  });

  return schema as Schema<T>;
}

/**
 * Add virtual field to schema
 */
export function addVirtual<T>(
  schema: Schema<T>,
  name: string,
  getter: (this: HydratedDocument<T>) => unknown,
  setter?: (this: HydratedDocument<T>, value: unknown) => void
): void {
  const virtual = schema.virtual(name);
  virtual.get(getter);
  if (setter) {
    virtual.set(setter);
  }
}

/**
 * Add pre middleware
 */
export function addPreMiddleware<T>(
  schema: Schema<T>,
  method: 'save' | 'validate' | 'remove' | 'updateOne' | 'deleteOne' | 'init',
  fn: (this: HydratedDocument<T>, next: () => void) => void
): void {
  schema.pre(method, fn);
}

/**
 * Add post middleware
 */
export function addPostMiddleware<T>(
  schema: Schema<T>,
  method: 'save' | 'validate' | 'remove' | 'updateOne' | 'deleteOne' | 'init',
  fn: (this: HydratedDocument<T>, doc: HydratedDocument<T>, next: () => void) => void
): void {
  schema.post(method, fn);
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate document before save
 */
export async function validateDocument<T extends Document>(doc: T): Promise<{
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
}> {
  try {
    await doc.validate();
    return { valid: true, errors: [] };
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      const errors = Object.entries(err.errors).map(([path, error]: [string, any]) => ({
        path,
        message: error.message,
      }));
      return { valid: false, errors };
    }
    throw err;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert document to plain object
 */
export function toPlainObject<T extends Document>(doc: T): Record<string, unknown> {
  return doc.toObject({ virtuals: true, getters: true });
}

/**
 * Convert documents to plain objects
 */
export function toPlainObjects<T extends Document>(docs: T[]): Record<string, unknown>[] {
  return docs.map((doc) => toPlainObject(doc));
}

/**
 * Check if value is valid ObjectId
 */
export function isValidObjectId(value: unknown): boolean {
  if (!value) return false;
  const mongoose = getConnection().base;
  return mongoose.isValidObjectId(value);
}

/**
 * Create ObjectId from string
 */
export function createObjectId(id?: string): unknown {
  const mongoose = getConnection().base;
  return new mongoose.Types.ObjectId(id);
}

// ============================================================================
// Exports
// ============================================================================

export {
  // Core hooks
  useMongoose,
  useMongooseById,
  useMongooseOne,
  useMongooseCount,
  // Pagination
  usePaginated,
  useInfinite,
  // Mutations
  useMongooseMutation,
  useBulkWrite,
  useInsertMany,
  // Aggregation
  useMongooseAggregate,
  // Real-time
  useMongooseWatch,
  // Transaction
  useTransaction,
  // Search
  useTextSearch,
  useDistinct,
  // Optimistic
  useOptimistic,
  // Population
  usePopulated,
  // Connection
  setConnection,
  getConnection,
  isConnected,
  disconnect,
  getConnectionState,
  // Cache
  clearCache,
  getCacheStats,
  // SSR
  createSSRDataLoader,
  prefetchForSSR,
  hydrateFromSSR,
  // Schema helpers
  createSchema,
  addVirtual,
  addPreMiddleware,
  addPostMiddleware,
  // Index management
  createIndexes,
  listIndexes,
  dropIndex,
  ensureIndexes,
  // Validation
  validateDocument,
  // Utilities
  toPlainObject,
  toPlainObjects,
  isValidObjectId,
  createObjectId,
};

// Type exports
export type {
  QueryState,
  PaginationState,
  InfiniteState,
  MutationState,
  UseMongooseOptions,
  UseMongooseByIdOptions,
  UsePaginatedOptions,
  UseInfiniteOptions,
  UseMutationOptions,
  UseAggregateOptions,
  UseWatchOptions,
  TransactionOptions,
  BulkWriteOperation,
  BulkWriteResult,
  TextSearchOptions,
  SSRDataLoader,
};
