/**
 * Advanced Prisma Integration for PhilJS
 *
 * Enhanced Prisma features:
 * - Optimistic updates with signals
 * - Type-safe query builders
 * - Smart caching with SWR
 * - Edge runtime support
 * - Middleware and hooks
 * - Transaction utilities
 */

import { signal, memo, type Signal } from 'philjs-core/signals';
import type { PrismaClient } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

export interface PrismaQueryOptions<T = any> {
  /**
   * Cache key
   */
  key?: string;

  /**
   * Cache time-to-live (ms)
   */
  ttl?: number;

  /**
   * Revalidate on focus
   */
  revalidateOnFocus?: boolean;

  /**
   * Revalidate on reconnect
   */
  revalidateOnReconnect?: boolean;

  /**
   * Optimistic data
   */
  optimisticData?: T;

  /**
   * Error fallback
   */
  fallbackData?: T;

  /**
   * Dedupe identical requests
   */
  dedupe?: boolean;
}

export interface PrismaCache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

export interface PrismaMutationOptions<T = any> {
  /**
   * Optimistic update function
   */
  optimisticUpdate?: (current: T) => T;

  /**
   * Rollback on error
   */
  rollbackOnError?: boolean;

  /**
   * Invalidate cache keys after mutation
   */
  invalidate?: string[];

  /**
   * Refetch after mutation
   */
  refetch?: boolean;
}

export interface PrismaQueryResult<T> {
  /**
   * Query data signal
   */
  data: Signal<T | null>;

  /**
   * Loading state
   */
  isLoading: Signal<boolean>;

  /**
   * Error state
   */
  error: Signal<Error | null>;

  /**
   * Refetch function
   */
  refetch: () => Promise<void>;

  /**
   * Mutate local cache
   */
  mutate: (data: T | ((current: T | null) => T)) => void;
}

export interface PrismaMutationResult<T, TArgs> {
  /**
   * Mutation function
   */
  mutate: (args: TArgs) => Promise<T>;

  /**
   * Mutation data
   */
  data: Signal<T | null>;

  /**
   * Loading state
   */
  isLoading: Signal<boolean>;

  /**
   * Error state
   */
  error: Signal<Error | null>;

  /**
   * Reset mutation state
   */
  reset: () => void;
}

export interface PrismaMiddleware {
  name: string;
  before?: (params: any) => Promise<any> | any;
  after?: (params: any, result: any) => Promise<any> | any;
  error?: (params: any, error: Error) => Promise<any> | any;
}

// ============================================================================
// Cache Implementation
// ============================================================================

class MemoryPrismaCache implements PrismaCache {
  private cache = new Map<string, { value: any; expires: number }>();

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set<T>(key: string, value: T, ttl = 60000): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// ============================================================================
// Prisma Manager with Advanced Features
// ============================================================================

export class PrismaManager {
  private client: PrismaClient;
  private cache: PrismaCache;
  private middlewares: PrismaMiddleware[] = [];
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(client: PrismaClient, cache?: PrismaCache) {
    this.client = client;
    this.cache = cache || new MemoryPrismaCache();
  }

  /**
   * Register middleware
   */
  use(middleware: PrismaMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Execute query with middleware and caching
   */
  async query<T>(
    queryFn: () => Promise<T>,
    options: PrismaQueryOptions<T> = {}
  ): Promise<T> {
    const {
      key,
      ttl = 60000,
      dedupe = true,
      fallbackData,
    } = options;

    // Check cache
    if (key && this.cache.has(key)) {
      return this.cache.get<T>(key)!;
    }

    // Dedupe identical requests
    if (dedupe && key && this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Execute query with middleware
    const queryPromise = this.executeWithMiddleware(queryFn);

    if (dedupe && key) {
      this.pendingRequests.set(key, queryPromise);
    }

    try {
      const result = await queryPromise;

      // Cache result
      if (key) {
        this.cache.set(key, result, ttl);
      }

      return result;
    } catch (error) {
      if (fallbackData !== undefined) {
        return fallbackData;
      }
      throw error;
    } finally {
      if (dedupe && key) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Execute mutation with optimistic updates
   */
  async mutate<T, TArgs>(
    mutationFn: (args: TArgs) => Promise<T>,
    args: TArgs,
    options: PrismaMutationOptions<T> = {}
  ): Promise<T> {
    const {
      rollbackOnError = true,
      invalidate = [],
    } = options;

    let rollbackData: Map<string, any> | null = null;

    // Store current cache state for rollback
    if (rollbackOnError) {
      rollbackData = new Map();
      for (const key of invalidate) {
        if (this.cache.has(key)) {
          rollbackData.set(key, this.cache.get(key));
        }
      }
    }

    // Execute mutation
    try {
      const result = await this.executeWithMiddleware(() => mutationFn(args));

      // Invalidate cache
      for (const key of invalidate) {
        this.cache.delete(key);
      }

      return result;
    } catch (error) {
      // Rollback cache on error
      if (rollbackOnError && rollbackData) {
        for (const [key, value] of rollbackData) {
          this.cache.set(key, value);
        }
      }

      throw error;
    }
  }

  /**
   * Execute function with middleware pipeline
   */
  private async executeWithMiddleware<T>(fn: () => Promise<T>): Promise<T> {
    let params: any = {};

    // Before middleware
    for (const middleware of this.middlewares) {
      if (middleware.before) {
        params = await middleware.before(params);
      }
    }

    try {
      let result = await fn();

      // After middleware
      for (const middleware of this.middlewares) {
        if (middleware.after) {
          result = await middleware.after(params, result);
        }
      }

      return result;
    } catch (error) {
      // Error middleware
      for (const middleware of this.middlewares) {
        if (middleware.error) {
          await middleware.error(params, error as Error);
        }
      }

      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache(keys?: string[]): void {
    if (keys) {
      for (const key of keys) {
        this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get Prisma client
   */
  getClient(): PrismaClient {
    return this.client;
  }
}

// ============================================================================
// React-Query Style Hooks
// ============================================================================

/**
 * Use Prisma query with caching and optimistic updates
 */
export function usePrismaQuery<T>(
  queryFn: () => Promise<T>,
  options: PrismaQueryOptions<T> = {}
): PrismaQueryResult<T> {
  const data = signal<T | null>(options.fallbackData || null);
  const isLoading = signal(false);
  const error = signal<Error | null>(null);

  const fetch = async () => {
    isLoading.set(true);
    error.set(null);

    try {
      const result = await queryFn();
      data.set(result);
    } catch (err) {
      error.set(err as Error);
      if (options.fallbackData !== undefined) {
        data.set(options.fallbackData);
      }
    } finally {
      isLoading.set(false);
    }
  };

  // Initial fetch
  fetch();

  // Revalidate on focus
  if (options.revalidateOnFocus) {
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', fetch);
    }
  }

  // Revalidate on reconnect
  if (options.revalidateOnReconnect) {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', fetch);
    }
  }

  return {
    data,
    isLoading,
    error,
    refetch: fetch,
    mutate: (newData) => {
      if (typeof newData === 'function') {
        data.set((newData as Function)(data()));
      } else {
        data.set(newData);
      }
    },
  };
}

/**
 * Use Prisma mutation with optimistic updates
 */
export function usePrismaMutation<T, TArgs>(
  mutationFn: (args: TArgs) => Promise<T>,
  options: PrismaMutationOptions<T> = {}
): PrismaMutationResult<T, TArgs> {
  const data = signal<T | null>(null);
  const isLoading = signal(false);
  const error = signal<Error | null>(null);

  let previousData: T | null = null;

  const mutate = async (args: TArgs): Promise<T> => {
    isLoading.set(true);
    error.set(null);

    // Save current data for rollback
    if (options.rollbackOnError) {
      previousData = data();
    }

    // Apply optimistic update
    if (options.optimisticUpdate && data()) {
      data.set(options.optimisticUpdate(data()!));
    }

    try {
      const result = await mutationFn(args);
      data.set(result);
      return result;
    } catch (err) {
      error.set(err as Error);

      // Rollback on error
      if (options.rollbackOnError && previousData !== null) {
        data.set(previousData);
      }

      throw err;
    } finally {
      isLoading.set(false);
    }
  };

  const reset = () => {
    data.set(null);
    isLoading.set(false);
    error.set(null);
  };

  return {
    mutate,
    data,
    isLoading,
    error,
    reset,
  };
}

// ============================================================================
// Built-in Middleware
// ============================================================================

/**
 * Logging middleware
 */
export const loggingMiddleware: PrismaMiddleware = {
  name: 'logging',
  before: (params) => {
    console.log('[Prisma] Query:', params);
    return params;
  },
  after: (params, result) => {
    console.log('[Prisma] Result:', result);
    return result;
  },
  error: (params, error) => {
    console.error('[Prisma] Error:', error);
  },
};

/**
 * Performance tracking middleware
 */
export const performanceMiddleware: PrismaMiddleware = {
  name: 'performance',
  before: (params) => {
    return { ...params, _startTime: Date.now() };
  },
  after: (params, result) => {
    const duration = Date.now() - params._startTime;
    console.log(`[Prisma] Query took ${duration}ms`);
    return result;
  },
};

/**
 * Error tracking middleware
 */
export function errorTrackingMiddleware(
  onError: (error: Error, params: any) => void
): PrismaMiddleware {
  return {
    name: 'error-tracking',
    error: (params, error) => {
      onError(error, params);
    },
  };
}

/**
 * Soft delete middleware
 */
export function softDeleteMiddleware(
  deletedAtField = 'deletedAt'
): PrismaMiddleware {
  return {
    name: 'soft-delete',
    before: (params) => {
      // Convert delete to update with deletedAt
      if (params.action === 'delete') {
        return {
          ...params,
          action: 'update',
          args: {
            ...params.args,
            data: { [deletedAtField]: new Date() },
          },
        };
      }

      // Filter out soft-deleted records
      if (params.action === 'findMany' || params.action === 'findFirst') {
        params.args.where = {
          ...params.args.where,
          [deletedAtField]: null,
        };
      }

      return params;
    },
  };
}

// ============================================================================
// Type-Safe Query Builders
// ============================================================================

/**
 * Create type-safe query builder
 */
export function createQueryBuilder<T>() {
  return {
    where(condition: Partial<T>) {
      return {
        ...this,
        _where: condition,
      };
    },
    select<K extends keyof T>(fields: K[]) {
      return {
        ...this,
        _select: fields,
      };
    },
    include<K extends keyof T>(relations: Partial<Record<K, boolean>>) {
      return {
        ...this,
        _include: relations,
      };
    },
    orderBy<K extends keyof T>(field: K, direction: 'asc' | 'desc' = 'asc') {
      return {
        ...this,
        _orderBy: { [field]: direction },
      };
    },
    limit(count: number) {
      return {
        ...this,
        _limit: count,
      };
    },
    offset(count: number) {
      return {
        ...this,
        _offset: count,
      };
    },
    build() {
      return {
        where: (this as any)._where,
        select: (this as any)._select,
        include: (this as any)._include,
        orderBy: (this as any)._orderBy,
        take: (this as any)._limit,
        skip: (this as any)._offset,
      };
    },
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create paginated query
 */
export async function paginatedPrismaQuery<T>(
  model: any,
  page: number,
  perPage: number,
  where?: any,
  orderBy?: any
): Promise<{
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const skip = (page - 1) * perPage;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return {
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Batch operations
 */
export async function batchCreate<T>(
  model: any,
  data: T[],
  batchSize = 100
): Promise<number> {
  let count = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const result = await model.createMany({
      data: batch,
      skipDuplicates: true,
    });
    count += result.count;
  }

  return count;
}

/**
 * Upsert many (Prisma doesn't support this natively)
 */
export async function upsertMany<T extends { id: string }>(
  model: any,
  data: T[]
): Promise<T[]> {
  const results: T[] = [];

  for (const item of data) {
    const result = await model.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
    results.push(result);
  }

  return results;
}

/**
 * Safe transaction wrapper
 */
export async function safeTransaction<T>(
  client: PrismaClient,
  fn: (tx: PrismaClient) => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await (client as any).$transaction(fn);
    } catch (error) {
      lastError = error as Error;

      // Retry on deadlock or serialization failure
      if (
        error instanceof Error &&
        (error.message.includes('deadlock') ||
          error.message.includes('serialization failure'))
      ) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Transaction failed');
}
