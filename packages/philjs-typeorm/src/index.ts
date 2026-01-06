/**
 * PhilJS TypeORM Adapter
 *
 * Comprehensive TypeORM integration with PhilJS signals.
 * Features:
 * - Reactive query hooks with caching
 * - Pagination and infinite scroll
 * - Bulk operations
 * - Transaction support with isolation levels
 * - Query builder with signals
 * - Relation loading
 * - Soft delete support
 * - Migration utilities
 * - SSR data loading
 * - Real-time subscriptions
 */

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';
import type {
  DataSource,
  Repository,
  EntityTarget,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  ObjectLiteral,
  EntityManager,
  QueryRunner,
  SelectQueryBuilder,
  InsertResult,
  UpdateResult,
  DeleteResult,
  SaveOptions,
  RemoveOptions,
  FindOptionsRelations,
  FindOptionsOrder,
  FindOptionsSelect,
  ObjectId,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';

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

export interface UseTypeORMOptions<T> {
  initialData?: T[];
  refetchInterval?: number;
  enabled?: boolean | Signal<boolean>;
  staleTime?: number;
  cacheKey?: string;
  relations?: FindOptionsRelations<T>;
  select?: FindOptionsSelect<T>;
  order?: FindOptionsOrder<T>;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

export interface UseTypeORMOneOptions<T> {
  relations?: FindOptionsRelations<T>;
  select?: FindOptionsSelect<T>;
  enabled?: boolean | Signal<boolean>;
  staleTime?: number;
  onSuccess?: (data: T | null) => void;
  onError?: (error: Error) => void;
}

export interface UsePaginatedOptions<T> extends UseTypeORMOptions<T> {
  initialPage?: number;
  pageSize?: number;
}

export interface UseInfiniteOptions<T> extends UseTypeORMOptions<T> {
  pageSize?: number;
  getCursor?: (lastItem: T) => unknown;
  cursorField?: keyof T;
}

export interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  onSettled?: (data: T | null, error: Error | null) => void | Promise<void>;
  invalidateKeys?: string[];
  optimisticUpdate?: (data: DeepPartial<T>) => void;
  rollback?: (error: Error) => void;
}

export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}

export interface BulkOperationResult {
  affected: number;
  raw: unknown;
}

export interface SubscriptionOptions<T> {
  onInsert?: (entity: T) => void;
  onUpdate?: (entity: T, updatedColumns: string[]) => void;
  onRemove?: (entity: T) => void;
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

let dataSource: DataSource | null = null;
const queryCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
const entitySubscribers = new Map<string, Set<() => void>>();

// ============================================================================
// Connection Management
// ============================================================================

export function setDataSource(ds: DataSource): void {
  dataSource = ds;
}

export function getDataSource(): DataSource {
  if (!dataSource) {
    throw new Error('DataSource not initialized. Call setDataSource() first.');
  }
  return dataSource;
}

export function isConnected(): boolean {
  return dataSource?.isInitialized ?? false;
}

export async function initializeDataSource(ds: DataSource): Promise<void> {
  if (!ds.isInitialized) {
    await ds.initialize();
  }
  dataSource = ds;
}

export async function destroyDataSource(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
  dataSource = null;
  queryCache.clear();
  entitySubscribers.clear();
}

export function getConnectionState(): {
  initialized: boolean;
  driver: string | null;
  database: string | null;
} {
  if (!dataSource) {
    return { initialized: false, driver: null, database: null };
  }

  return {
    initialized: dataSource.isInitialized,
    driver: dataSource.options.type,
    database: (dataSource.options as { database?: string }).database || null,
  };
}

// ============================================================================
// Cache Management
// ============================================================================

function getCacheKey(entity: string, options: unknown): string {
  return `${entity}:${JSON.stringify(options || {})}`;
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
 * Use TypeORM repository with signals
 *
 * @example
 * ```tsx
 * import { useTypeORM } from '@philjs/typeorm';
 * import { User } from './entities/User';
 *
 * function UserList() {
 *   const { data, loading, error, refetch } = useTypeORM(User, {
 *     where: { isActive: true },
 *     order: { createdAt: 'DESC' },
 *   });
 *
 *   return (
 *     <ul>
 *       {data().map(user => <li>{user.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useTypeORM<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  options: FindManyOptions<T> = {},
  hookOptions: UseTypeORMOptions<T> = {}
): {
  data: Signal<T[]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  state: Computed<QueryState<T[]>>;
  refetch: () => Promise<void>;
  mutate: (data: T[]) => void;
  invalidate: () => void;
  repository: Repository<T>;
} {
  const {
    initialData = [],
    refetchInterval,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheKey,
    relations,
    select,
    order,
    onSuccess,
    onError,
  } = hookOptions;

  const data = signal<T[]>(initialData);
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const stale = signal(false);

  const repository = getDataSource().getRepository(entity);
  const entityName =
    typeof entity === 'function' ? entity.name : typeof entity === 'string' ? entity : 'entity';

  const state = computed<QueryState<T[]>>(() => ({
    data: data(),
    loading: loading(),
    error: error(),
    stale: stale(),
  }));

  const key = cacheKey || getCacheKey(entityName, options);

  const findOptions: FindManyOptions<T> = {
    ...options,
    relations: relations || options.relations,
    select: select || options.select,
    order: order || options.order,
  };

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
      const result = await repository.find(findOptions);

      batch(() => {
        data.set(result);
        loading.set(false);
        stale.set(false);
      });

      setCache(key, result, staleTime);
      onSuccess?.(result);

      // Notify subscribers
      const subs = entitySubscribers.get(entityName);
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
    repository,
  };
}

/**
 * Use a single entity by ID
 */
export function useTypeORMOne<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  id: string | number | Signal<string | number>,
  options: UseTypeORMOneOptions<T> = {}
): {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  state: Computed<QueryState<T>>;
  refetch: () => Promise<void>;
  mutate: (data: T | null) => void;
  repository: Repository<T>;
} {
  const {
    relations,
    select,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    onSuccess,
    onError,
  } = options;

  const data = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const repository = getDataSource().getRepository(entity);

  const state = computed<QueryState<T>>(() => ({
    data: data(),
    loading: loading(),
    error: error(),
    stale: false,
  }));

  const fetch = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    const entityId = typeof id === 'function' ? id() : id;
    if (!entityId) return;

    loading.set(true);
    error.set(null);

    try {
      const findOptions: FindOneOptions<T> = {
        where: { id: entityId } as FindOptionsWhere<T>,
        relations,
        select,
      };

      const result = await repository.findOne(findOptions);

      batch(() => {
        data.set(result);
        loading.set(false);
      });

      onSuccess?.(result);
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
    const entityId = typeof id === 'function' ? id() : id;
    if (entityId) {
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
    repository,
  };
}

/**
 * Use findOne with custom where conditions
 */
export function useTypeORMFindOne<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  where: FindOptionsWhere<T>,
  options: UseTypeORMOneOptions<T> = {}
): {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
  repository: Repository<T>;
} {
  const { relations, select, enabled = true, staleTime = 5 * 60 * 1000 } = options;

  const data = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const repository = getDataSource().getRepository(entity);

  const fetch = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    loading.set(true);
    error.set(null);

    try {
      const result = await repository.findOne({ where, relations, select });

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

  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (isEnabled) {
      fetch();
    }
  });

  return { data, loading, error, refetch: fetch, repository };
}

/**
 * Use count query
 */
export function useTypeORMCount<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  options: FindManyOptions<T> = {},
  hookOptions: { enabled?: boolean | Signal<boolean>; refetchInterval?: number } = {}
): {
  count: Signal<number>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
} {
  const { enabled = true, refetchInterval } = hookOptions;

  const count = signal(0);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const repository = getDataSource().getRepository(entity);

  const fetch = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    loading.set(true);
    error.set(null);

    try {
      const result = await repository.count(options);
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
 * Use paginated TypeORM queries
 */
export function usePaginated<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  options: FindManyOptions<T> = {},
  hookOptions: UsePaginatedOptions<T> = {}
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
  repository: Repository<T>;
} {
  const {
    initialPage = 1,
    pageSize: initialPageSize = 20,
    relations,
    select,
    order,
    enabled = true,
  } = hookOptions;

  const data = signal<T[]>([]);
  const page = signal(initialPage);
  const pageSize = signal(initialPageSize);
  const total = signal(0);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const repository = getDataSource().getRepository(entity);

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
      const skip = (page() - 1) * pageSize();
      const [result, countResult] = await repository.findAndCount({
        ...options,
        relations,
        select,
        order,
        skip,
        take: pageSize(),
      });

      batch(() => {
        data.set(result);
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
    repository,
  };
}

/**
 * Use infinite scroll / cursor-based pagination
 */
export function useInfinite<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  options: FindManyOptions<T> = {},
  hookOptions: UseInfiniteOptions<T> = {}
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
  repository: Repository<T>;
} {
  const {
    pageSize = 20,
    getCursor = (item) => (item as { id: unknown }).id,
    cursorField = 'id' as keyof T,
    relations,
    select,
    order,
    enabled = true,
  } = hookOptions;

  const data = signal<T[]>([]);
  const loading = signal(false);
  const loadingMore = signal(false);
  const error = signal<Error | null>(null);
  const cursor = signal<unknown>(null);
  const hasMore = signal(true);

  const repository = getDataSource().getRepository(entity);

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
      const qb = repository.createQueryBuilder('entity');

      // Apply original where conditions
      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          qb.andWhere(`entity.${key} = :${key}`, { [key]: value });
        });
      }

      // Apply cursor
      const cursorValue = cursor();
      if (cursorValue) {
        qb.andWhere(`entity.${String(cursorField)} < :cursor`, { cursor: cursorValue });
      }

      // Apply ordering and limit
      qb.orderBy(`entity.${String(cursorField)}`, 'DESC');
      qb.take(pageSize);

      // Apply relations
      if (relations) {
        Object.entries(relations).forEach(([key, value]) => {
          if (value) {
            qb.leftJoinAndSelect(`entity.${key}`, key);
          }
        });
      }

      const result = await qb.getMany();

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
    repository,
  };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create, update, delete mutations
 */
export function useTypeORMMutation<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  options: UseMutationOptions<T> = {}
): {
  state: Computed<MutationState<T>>;
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  success: Signal<boolean>;
  create: (data: DeepPartial<T>, saveOptions?: SaveOptions) => Promise<T>;
  save: (entity: T, saveOptions?: SaveOptions) => Promise<T>;
  update: (id: string | number, data: DeepPartial<T>) => Promise<T | null>;
  updateMany: (criteria: FindOptionsWhere<T>, data: DeepPartial<T>) => Promise<UpdateResult>;
  remove: (id: string | number) => Promise<void>;
  removeMany: (criteria: FindOptionsWhere<T>) => Promise<DeleteResult>;
  softRemove: (id: string | number) => Promise<T | null>;
  recover: (id: string | number) => Promise<T | null>;
  upsert: (data: DeepPartial<T>, conflictPathsOrOptions: string[]) => Promise<InsertResult>;
  reset: () => void;
  repository: Repository<T>;
} {
  const { onSuccess, onError, onSettled, invalidateKeys, optimisticUpdate, rollback } = options;

  const data = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const success = signal(false);

  const repository = getDataSource().getRepository(entity);
  const entityName =
    typeof entity === 'function' ? entity.name : typeof entity === 'string' ? entity : 'entity';

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
    clearCache(entityName);
  };

  const create = async (entityData: DeepPartial<T>, saveOptions?: SaveOptions): Promise<T> => {
    loading.set(true);
    error.set(null);
    success.set(false);

    if (optimisticUpdate) {
      optimisticUpdate(entityData);
    }

    try {
      const instance = repository.create(entityData);
      const result = await repository.save(instance, saveOptions);

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

  const save = async (entityInstance: T, saveOptions?: SaveOptions): Promise<T> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await repository.save(entityInstance, saveOptions);

      batch(() => {
        data.set(result as T);
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      if (onSuccess) {
        await onSuccess(result as T);
      }

      return result as T;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const update = async (id: string | number, updateData: DeepPartial<T>): Promise<T | null> => {
    loading.set(true);
    error.set(null);

    try {
      await repository.update(id, updateData as never);
      const result = await repository.findOneBy({ id } as FindOptionsWhere<T>);

      batch(() => {
        data.set(result);
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      if (result && onSuccess) {
        await onSuccess(result);
      }

      return result;
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
    criteria: FindOptionsWhere<T>,
    updateData: DeepPartial<T>
  ): Promise<UpdateResult> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await repository.update(criteria, updateData as never);

      batch(() => {
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      return result;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const remove = async (id: string | number): Promise<void> => {
    loading.set(true);
    error.set(null);

    try {
      await repository.delete(id);

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

  const removeMany = async (criteria: FindOptionsWhere<T>): Promise<DeleteResult> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await repository.delete(criteria);

      batch(() => {
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      return result;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const softRemove = async (id: string | number): Promise<T | null> => {
    loading.set(true);
    error.set(null);

    try {
      const entity = await repository.findOneBy({ id } as FindOptionsWhere<T>);
      if (!entity) {
        loading.set(false);
        return null;
      }

      const result = await repository.softRemove(entity);

      batch(() => {
        data.set(result);
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      return result;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const recover = async (id: string | number): Promise<T | null> => {
    loading.set(true);
    error.set(null);

    try {
      const entity = await repository.findOne({
        where: { id } as FindOptionsWhere<T>,
        withDeleted: true,
      });
      if (!entity) {
        loading.set(false);
        return null;
      }

      const result = await repository.recover(entity);

      batch(() => {
        data.set(result);
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      return result;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const upsert = async (
    entityData: DeepPartial<T>,
    conflictPathsOrOptions: string[]
  ): Promise<InsertResult> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await repository.upsert(entityData, conflictPathsOrOptions);

      batch(() => {
        loading.set(false);
        success.set(true);
      });

      invalidateCaches();

      return result;
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
    save,
    update,
    updateMany,
    remove,
    removeMany,
    softRemove,
    recover,
    upsert,
    reset,
    repository,
  };
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Use bulk insert
 */
export function useBulkInsert<T extends ObjectLiteral>(
  entity: EntityTarget<T>
): {
  insert: (entities: DeepPartial<T>[]) => Promise<InsertResult>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  result: Signal<InsertResult | null>;
} {
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const result = signal<InsertResult | null>(null);

  const repository = getDataSource().getRepository(entity);

  const insert = async (entities: DeepPartial<T>[]): Promise<InsertResult> => {
    loading.set(true);
    error.set(null);

    try {
      const insertResult = await repository.insert(entities);

      batch(() => {
        result.set(insertResult);
        loading.set(false);
      });

      return insertResult;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  return { insert, loading, error, result };
}

/**
 * Use bulk save
 */
export function useBulkSave<T extends ObjectLiteral>(
  entity: EntityTarget<T>
): {
  save: (entities: DeepPartial<T>[], options?: SaveOptions) => Promise<T[]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  saved: Signal<T[]>;
} {
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const saved = signal<T[]>([]);

  const repository = getDataSource().getRepository(entity);

  const save = async (entities: DeepPartial<T>[], options?: SaveOptions): Promise<T[]> => {
    loading.set(true);
    error.set(null);

    try {
      const instances = entities.map((e) => repository.create(e));
      const result = await repository.save(instances, options);

      batch(() => {
        saved.set(result as T[]);
        loading.set(false);
      });

      return result as T[];
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  return { save, loading, error, saved };
}

// ============================================================================
// Query Builder Hook
// ============================================================================

/**
 * Signal-aware query builder
 */
export function useQueryBuilder<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  alias: string = 'entity'
): {
  builder: SelectQueryBuilder<T>;
  execute: () => Promise<T[]>;
  executeAndCount: () => Promise<[T[], number]>;
  getOne: () => Promise<T | null>;
  getCount: () => Promise<number>;
  data: Signal<T[]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  total: Signal<number>;
} {
  const data = signal<T[]>([]);
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const total = signal(0);

  const repository = getDataSource().getRepository(entity);
  const builder = repository.createQueryBuilder(alias);

  const execute = async (): Promise<T[]> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await builder.getMany();

      batch(() => {
        data.set(result);
        loading.set(false);
      });

      return result;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const executeAndCount = async (): Promise<[T[], number]> => {
    loading.set(true);
    error.set(null);

    try {
      const [result, count] = await builder.getManyAndCount();

      batch(() => {
        data.set(result);
        total.set(count);
        loading.set(false);
      });

      return [result, count];
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const getOne = async (): Promise<T | null> => {
    loading.set(true);
    error.set(null);

    try {
      const result = await builder.getOne();
      loading.set(false);
      return result;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  const getCount = async (): Promise<number> => {
    loading.set(true);
    error.set(null);

    try {
      const count = await builder.getCount();

      batch(() => {
        total.set(count);
        loading.set(false);
      });

      return count;
    } catch (e) {
      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });
      throw e;
    }
  };

  return {
    builder,
    execute,
    executeAndCount,
    getOne,
    getCount,
    data,
    loading,
    error,
    total,
  };
}

/**
 * Create a reactive query builder
 */
export function createQueryBuilder<T extends ObjectLiteral>(entity: EntityTarget<T>) {
  const repository = getDataSource().getRepository(entity);

  return {
    findMany: (options: FindManyOptions<T> = {}) => {
      const result = signal<T[]>([]);
      const loading = signal(true);
      const error = signal<Error | null>(null);

      repository
        .find(options)
        .then((data) => {
          result.set(data);
          loading.set(false);
        })
        .catch((e) => {
          error.set(e);
          loading.set(false);
        });

      return { data: result, loading, error };
    },

    findOne: (where: FindOptionsWhere<T>) => {
      const result = signal<T | null>(null);
      const loading = signal(true);
      const error = signal<Error | null>(null);

      repository
        .findOneBy(where)
        .then((data) => {
          result.set(data);
          loading.set(false);
        })
        .catch((e) => {
          error.set(e);
          loading.set(false);
        });

      return { data: result, loading, error };
    },

    count: (options: FindManyOptions<T> = {}) => {
      const result = signal(0);
      const loading = signal(true);

      repository
        .count(options)
        .then((count) => {
          result.set(count);
          loading.set(false);
        });

      return { count: result, loading };
    },

    findAndCount: (options: FindManyOptions<T> = {}) => {
      const data = signal<T[]>([]);
      const total = signal(0);
      const loading = signal(true);

      repository.findAndCount(options).then(([result, count]) => {
        data.set(result);
        total.set(count);
        loading.set(false);
      });

      return { data, total, loading };
    },
  };
}

// ============================================================================
// Transaction Support
// ============================================================================

/**
 * Use TypeORM transactions with isolation levels
 */
export function useTransaction(
  options: TransactionOptions = {}
): {
  execute: <T>(callback: (manager: EntityManager) => Promise<T>) => Promise<T>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
} {
  const { isolationLevel } = options;

  const loading = signal(false);
  const error = signal<Error | null>(null);

  const execute = async <T>(callback: (manager: EntityManager) => Promise<T>): Promise<T> => {
    loading.set(true);
    error.set(null);

    const ds = getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      await queryRunner.connect();

      if (isolationLevel) {
        await queryRunner.startTransaction(isolationLevel);
      } else {
        await queryRunner.startTransaction();
      }

      const result = await callback(queryRunner.manager);
      await queryRunner.commitTransaction();

      loading.set(false);
      return result;
    } catch (e) {
      await queryRunner.rollbackTransaction();

      batch(() => {
        error.set(e as Error);
        loading.set(false);
      });

      throw e;
    } finally {
      await queryRunner.release();
    }
  };

  return { execute, loading, error };
}

/**
 * Simple transaction helper
 */
export async function withTransaction<T>(
  callback: (manager: EntityManager) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  const ds = getDataSource();
  const queryRunner = ds.createQueryRunner();

  try {
    await queryRunner.connect();

    if (options?.isolationLevel) {
      await queryRunner.startTransaction(options.isolationLevel);
    } else {
      await queryRunner.startTransaction();
    }

    const result = await callback(queryRunner.manager);
    await queryRunner.commitTransaction();

    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// ============================================================================
// Soft Delete Support
// ============================================================================

/**
 * Query with deleted entities
 */
export function useWithDeleted<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  options: FindManyOptions<T> = {},
  hookOptions: UseTypeORMOptions<T> = {}
): ReturnType<typeof useTypeORM<T>> {
  const repository = getDataSource().getRepository(entity);

  return useTypeORM(entity, { ...options, withDeleted: true }, hookOptions);
}

/**
 * Query only deleted entities
 */
export function useOnlyDeleted<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  options: FindManyOptions<T> = {},
  hookOptions: UseTypeORMOptions<T> = {}
): {
  data: Signal<T[]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
} {
  const data = signal<T[]>([]);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const repository = getDataSource().getRepository(entity);

  const fetch = async (): Promise<void> => {
    loading.set(true);
    error.set(null);

    try {
      const qb = repository.createQueryBuilder('entity');
      qb.withDeleted();
      qb.andWhere('entity.deletedAt IS NOT NULL');

      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          qb.andWhere(`entity.${key} = :${key}`, { [key]: value });
        });
      }

      const result = await qb.getMany();

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

  effect(() => {
    fetch();
  });

  return { data, loading, error, refetch: fetch };
}

// ============================================================================
// Optimistic Updates
// ============================================================================

/**
 * Use optimistic updates
 */
export function useOptimistic<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  options: FindManyOptions<T> = {},
  hookOptions: UseTypeORMOptions<T> = {}
): ReturnType<typeof useTypeORM<T>> & {
  optimisticInsert: (item: DeepPartial<T>) => void;
  optimisticUpdate: (id: string | number, updates: DeepPartial<T>) => void;
  optimisticDelete: (id: string | number) => void;
  rollback: () => void;
} {
  const query = useTypeORM(entity, options, hookOptions);
  const originalData = signal<T[] | null>(null);

  // Save original on first load
  effect(() => {
    const data = query.data();
    if (data.length > 0 && originalData() === null) {
      originalData.set([...data]);
    }
  });

  const optimisticInsert = (item: DeepPartial<T>): void => {
    const current = query.data();
    if (originalData() === null) {
      originalData.set([...current]);
    }
    query.mutate([...current, item as T]);
  };

  const optimisticUpdate = (id: string | number, updates: DeepPartial<T>): void => {
    const current = query.data();
    if (originalData() === null) {
      originalData.set([...current]);
    }
    const updated = current.map((item) => {
      const itemId = (item as { id: string | number }).id;
      return itemId === id ? { ...item, ...updates } : item;
    });
    query.mutate(updated);
  };

  const optimisticDelete = (id: string | number): void => {
    const current = query.data();
    if (originalData() === null) {
      originalData.set([...current]);
    }
    const filtered = current.filter((item) => {
      const itemId = (item as { id: string | number }).id;
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
// Entity Subscriptions (Real-time)
// ============================================================================

/**
 * Subscribe to entity changes
 */
export function useEntitySubscription<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  options: SubscriptionOptions<T> = {}
): {
  unsubscribe: () => void;
  isActive: Signal<boolean>;
} {
  const { onInsert, onUpdate, onRemove } = options;
  const isActive = signal(true);

  const entityName =
    typeof entity === 'function' ? entity.name : typeof entity === 'string' ? entity : 'entity';

  const ds = getDataSource();

  // Create subscriber
  const subscriber: EntitySubscriberInterface<T> = {
    listenTo() {
      return entity as Function;
    },
    afterInsert(event: InsertEvent<T>) {
      if (isActive() && onInsert && event.entity) {
        onInsert(event.entity as T);
      }
    },
    afterUpdate(event: UpdateEvent<T>) {
      if (isActive() && onUpdate && event.entity) {
        const updatedColumns = event.updatedColumns?.map((col) => col.propertyName) || [];
        onUpdate(event.entity as T, updatedColumns);
      }
    },
    afterRemove(event: RemoveEvent<T>) {
      if (isActive() && onRemove && event.entity) {
        onRemove(event.entity as T);
      }
    },
  };

  // Register subscriber
  ds.subscribers.push(subscriber);

  const unsubscribe = (): void => {
    isActive.set(false);
    const index = ds.subscribers.indexOf(subscriber);
    if (index > -1) {
      ds.subscribers.splice(index, 1);
    }
  };

  return { unsubscribe, isActive };
}

// ============================================================================
// SSR Data Loading
// ============================================================================

/**
 * Create SSR data loader for TypeORM queries
 */
export function createSSRDataLoader<T extends ObjectLiteral>(
  key: string,
  entity: EntityTarget<T>,
  options: FindManyOptions<T> = {}
): SSRDataLoader<T[]> {
  return {
    load: async () => {
      const repository = getDataSource().getRepository(entity);
      return await repository.find(options);
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

export function hydrateFromSSR<T>(key: string, windowKey = '__TYPEORM_DATA__'): T | null {
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
// Raw Query Support
// ============================================================================

/**
 * Execute raw SQL query
 */
export function useRawQuery<T = unknown>(
  sql: string,
  parameters?: unknown[],
  options: { enabled?: boolean | Signal<boolean> } = {}
): {
  data: Signal<T[]>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
} {
  const { enabled = true } = options;

  const data = signal<T[]>([]);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const execute = async (): Promise<void> => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    loading.set(true);
    error.set(null);

    try {
      const result = await getDataSource().query(sql, parameters);

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

  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (isEnabled) {
      execute();
    }
  });

  return { data, loading, error, refetch: execute };
}

/**
 * Execute raw SQL mutation
 */
export async function executeRaw(sql: string, parameters?: unknown[]): Promise<unknown> {
  return getDataSource().query(sql, parameters);
}

// ============================================================================
// Migration Utilities
// ============================================================================

export async function runMigrations(): Promise<void> {
  const ds = getDataSource();
  await ds.runMigrations();
}

export async function revertLastMigration(): Promise<void> {
  const ds = getDataSource();
  await ds.undoLastMigration();
}

export async function showMigrations(): Promise<boolean> {
  const ds = getDataSource();
  return await ds.showMigrations();
}

export async function synchronizeSchema(dropBeforeSync = false): Promise<void> {
  const ds = getDataSource();
  await ds.synchronize(dropBeforeSync);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get repository for an entity
 */
export function getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
  return getDataSource().getRepository(entity);
}

/**
 * Get entity manager
 */
export function getManager(): EntityManager {
  return getDataSource().manager;
}

/**
 * Check if entity exists
 */
export async function exists<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  where: FindOptionsWhere<T>
): Promise<boolean> {
  const repository = getDataSource().getRepository(entity);
  return await repository.existsBy(where);
}

/**
 * Preload entity with relations
 */
export async function preload<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  entityLike: DeepPartial<T>
): Promise<T | undefined> {
  const repository = getDataSource().getRepository(entity);
  return await repository.preload(entityLike);
}

// ============================================================================
// Exports
// ============================================================================

export {
  // Core hooks
  useTypeORM,
  useTypeORMOne,
  useTypeORMFindOne,
  useTypeORMCount,
  // Pagination
  usePaginated,
  useInfinite,
  // Mutations
  useTypeORMMutation,
  useBulkInsert,
  useBulkSave,
  // Query builder
  useQueryBuilder,
  createQueryBuilder,
  // Transaction
  useTransaction,
  withTransaction,
  // Soft delete
  useWithDeleted,
  useOnlyDeleted,
  // Optimistic
  useOptimistic,
  // Subscriptions
  useEntitySubscription,
  // Raw queries
  useRawQuery,
  executeRaw,
  // Connection
  setDataSource,
  getDataSource,
  isConnected,
  initializeDataSource,
  destroyDataSource,
  getConnectionState,
  // Cache
  clearCache,
  getCacheStats,
  // SSR
  createSSRDataLoader,
  prefetchForSSR,
  hydrateFromSSR,
  // Migrations
  runMigrations,
  revertLastMigration,
  showMigrations,
  synchronizeSchema,
  // Utilities
  getRepository,
  getManager,
  exists,
  preload,
};

// Type exports
export type {
  QueryState,
  PaginationState,
  InfiniteState,
  MutationState,
  UseTypeORMOptions,
  UseTypeORMOneOptions,
  UsePaginatedOptions,
  UseInfiniteOptions,
  UseMutationOptions,
  TransactionOptions,
  BulkOperationResult,
  SubscriptionOptions,
  SSRDataLoader,
};
