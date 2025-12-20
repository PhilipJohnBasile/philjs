/**
 * Advanced Drizzle ORM Integration for PhilJS
 *
 * Enhanced Drizzle features:
 * - Reactive queries with signals
 * - Type-safe query builders
 * - Smart caching with SWR
 * - Optimistic updates
 * - Migration helpers
 * - Query batching
 */

import { signal, computed, type Signal } from 'philjs-core/signals';
import type { SQL } from 'drizzle-orm';

// ============================================================================
// Types
// ============================================================================

export interface DrizzleQueryOptions<T = any> {
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
   * Revalidate on interval (ms)
   */
  revalidateInterval?: number;

  /**
   * Initial data
   */
  initialData?: T;

  /**
   * Fallback data on error
   */
  fallbackData?: T;

  /**
   * Dedupe requests
   */
  dedupe?: boolean;
}

export interface DrizzleMutationOptions<T = any> {
  /**
   * Optimistic update
   */
  optimisticData?: T | ((current: T | null) => T);

  /**
   * Rollback on error
   */
  rollbackOnError?: boolean;

  /**
   * Invalidate cache keys
   */
  invalidate?: string[];

  /**
   * On success callback
   */
  onSuccess?: (data: T) => void;

  /**
   * On error callback
   */
  onError?: (error: Error) => void;
}

export interface DrizzleQueryResult<T> {
  data: Signal<T | null>;
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
  mutate: (data: T | ((current: T | null) => T)) => void;
}

export interface DrizzleMutationResult<T, TArgs> {
  mutate: (args: TArgs) => Promise<T>;
  data: Signal<T | null>;
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  reset: () => void;
}

export interface DrizzleCache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
}

export interface DrizzleBatchOptions {
  /**
   * Batch size
   */
  size?: number;

  /**
   * Debounce delay (ms)
   */
  delay?: number;

  /**
   * Max wait time (ms)
   */
  maxWait?: number;
}

// ============================================================================
// Cache Implementation
// ============================================================================

class MemoryDrizzleCache implements DrizzleCache {
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
}

// ============================================================================
// Drizzle Manager
// ============================================================================

export class DrizzleManager {
  private db: any;
  private cache: DrizzleCache;
  private pendingRequests = new Map<string, Promise<any>>();
  private batchQueue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private batchTimer: any = null;

  constructor(db: any, cache?: DrizzleCache) {
    this.db = db;
    this.cache = cache || new MemoryDrizzleCache();
  }

  /**
   * Execute query with caching
   */
  async query<T>(
    queryFn: () => Promise<T>,
    options: DrizzleQueryOptions<T> = {}
  ): Promise<T> {
    const {
      key,
      ttl = 60000,
      dedupe = true,
      fallbackData,
    } = options;

    // Check cache
    if (key && this.cache.get<T>(key) !== undefined) {
      return this.cache.get<T>(key)!;
    }

    // Dedupe requests
    if (dedupe && key && this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const queryPromise = (async () => {
      try {
        const result = await queryFn();

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
    })();

    if (dedupe && key) {
      this.pendingRequests.set(key, queryPromise);
    }

    return queryPromise;
  }

  /**
   * Execute mutation with optimistic updates
   */
  async mutate<T, TArgs>(
    mutationFn: (args: TArgs) => Promise<T>,
    args: TArgs,
    options: DrizzleMutationOptions<T> = {}
  ): Promise<T> {
    const {
      rollbackOnError = true,
      invalidate = [],
      onSuccess,
      onError,
    } = options;

    // Store rollback data
    const rollbackData = new Map<string, any>();
    if (rollbackOnError) {
      for (const key of invalidate) {
        const cached = this.cache.get(key);
        if (cached !== undefined) {
          rollbackData.set(key, cached);
        }
      }
    }

    try {
      const result = await mutationFn(args);

      // Invalidate cache
      for (const key of invalidate) {
        this.cache.delete(key);
      }

      onSuccess?.(result);
      return result;
    } catch (error) {
      // Rollback cache
      if (rollbackOnError) {
        for (const [key, value] of rollbackData) {
          this.cache.set(key, value);
        }
      }

      onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Add query to batch
   */
  batch<T>(queryFn: () => Promise<T>, options?: DrizzleBatchOptions): Promise<T> {
    const { delay = 10, maxWait = 50 } = options || {};

    return new Promise((resolve, reject) => {
      this.batchQueue.push({ fn: queryFn, resolve, reject });

      // Clear existing timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      // Set new timer
      this.batchTimer = setTimeout(() => {
        this.executeBatch();
      }, delay);

      // Max wait safety timeout
      setTimeout(() => {
        if (this.batchQueue.length > 0) {
          this.executeBatch();
        }
      }, maxWait);
    });
  }

  /**
   * Execute batched queries
   */
  private async executeBatch(): Promise<void> {
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimer = null;

    if (batch.length === 0) return;

    // Execute all queries in parallel
    const results = await Promise.allSettled(batch.map(item => item.fn()));

    // Resolve/reject promises
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        batch[index].resolve(result.value);
      } else {
        batch[index].reject(result.reason);
      }
    });
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
   * Get Drizzle instance
   */
  getDB(): any {
    return this.db;
  }
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Use Drizzle query with reactive updates
 */
export function useDrizzleQuery<T>(
  queryFn: () => Promise<T>,
  options: DrizzleQueryOptions<T> = {}
): DrizzleQueryResult<T> {
  const data = signal<T | null>(options.initialData || null);
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
  if (options.revalidateOnFocus && typeof window !== 'undefined') {
    window.addEventListener('focus', fetch);
  }

  // Revalidate on interval
  if (options.revalidateInterval && typeof window !== 'undefined') {
    const interval = setInterval(fetch, options.revalidateInterval);
    // Cleanup would need to be handled by caller
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
 * Use Drizzle mutation with optimistic updates
 */
export function useDrizzleMutation<T, TArgs>(
  mutationFn: (args: TArgs) => Promise<T>,
  options: DrizzleMutationOptions<T> = {}
): DrizzleMutationResult<T, TArgs> {
  const data = signal<T | null>(null);
  const isLoading = signal(false);
  const error = signal<Error | null>(null);

  let previousData: T | null = null;

  const mutate = async (args: TArgs): Promise<T> => {
    isLoading.set(true);
    error.set(null);

    // Store for rollback
    if (options.rollbackOnError) {
      previousData = data();
    }

    // Apply optimistic update
    if (options.optimisticData) {
      const optimisticValue = typeof options.optimisticData === 'function'
        ? (options.optimisticData as Function)(data())
        : options.optimisticData;
      data.set(optimisticValue);
    }

    try {
      const result = await mutationFn(args);
      data.set(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      error.set(err as Error);

      // Rollback
      if (options.rollbackOnError && previousData !== null) {
        data.set(previousData);
      }

      options.onError?.(err as Error);
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
// Query Helpers
// ============================================================================

/**
 * Paginated Drizzle query
 */
export async function paginatedDrizzleQuery<T>(
  db: any,
  query: any,
  page: number,
  perPage: number
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
  const offset = (page - 1) * perPage;

  // Get paginated data
  const data = await query.limit(perPage).offset(offset);

  // Get total count (simplified - would need actual count query)
  const total = data.length; // Placeholder

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
 * Batch insert helper
 */
export async function batchInsert<T>(
  db: any,
  table: any,
  data: T[],
  batchSize = 100
): Promise<number> {
  let count = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await db.insert(table).values(batch);
    count += batch.length;
  }

  return count;
}

/**
 * Upsert helper (using ON CONFLICT)
 */
export async function upsert<T extends Record<string, any>>(
  db: any,
  table: any,
  data: T,
  conflictTarget: string
): Promise<T> {
  const [result] = await db
    .insert(table)
    .values(data)
    .onConflictDoUpdate({
      target: conflictTarget,
      set: data,
    })
    .returning();

  return result;
}

/**
 * Soft delete helper
 */
export async function softDelete(
  db: any,
  table: any,
  where: SQL,
  deletedAtColumn = 'deletedAt'
): Promise<void> {
  await db
    .update(table)
    .set({ [deletedAtColumn]: new Date() })
    .where(where);
}

/**
 * Safe transaction with retry
 */
export async function safeTransaction<T>(
  db: any,
  fn: (tx: any) => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await db.transaction(fn);
    } catch (error) {
      lastError = error as Error;

      // Retry on deadlock
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('deadlock')
      ) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Transaction failed');
}

// ============================================================================
// Migration Helpers
// ============================================================================

/**
 * Run migrations
 */
export async function runMigrations(
  db: any,
  migrationsFolder: string
): Promise<void> {
  try {
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    await migrate(db, { migrationsFolder });
    console.log('[Drizzle] Migrations completed successfully');
  } catch (error) {
    console.error('[Drizzle] Migration failed:', error);
    throw error;
  }
}

/**
 * Generate migration
 */
export async function generateMigration(
  schemaPath: string,
  outputPath: string
): Promise<void> {
  console.log('[Drizzle] Generating migration...');
  console.log(`  Schema: ${schemaPath}`);
  console.log(`  Output: ${outputPath}`);
  // Actual generation would use drizzle-kit
}

/**
 * Push schema to database
 */
export async function pushSchema(
  db: any,
  schema: any
): Promise<void> {
  console.log('[Drizzle] Pushing schema to database...');
  // Would use drizzle-kit push
}

// ============================================================================
// Type-Safe Utilities
// ============================================================================

/**
 * Create type-safe select helper
 */
export function selectHelper<T extends Record<string, any>>(
  ...fields: (keyof T)[]
): Record<keyof T, true> {
  return fields.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {} as Record<keyof T, true>);
}

/**
 * Create type-safe where helper
 */
export function whereHelper<T extends Record<string, any>>(
  conditions: Partial<T>
): Partial<T> {
  return conditions;
}

/**
 * Create type-safe orderBy helper
 */
export function orderByHelper<T extends Record<string, any>>(
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): any {
  return { [field]: direction };
}
