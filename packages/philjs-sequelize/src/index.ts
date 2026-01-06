/**
 * PhilJS Sequelize Integration
 *
 * Comprehensive Sequelize ORM integration with PhilJS signals,
 * providing reactive database queries, mutations, transactions,
 * pagination, and real-time subscriptions.
 */

import { signal, computed, effect, batch, type Signal } from '@philjs/core';
import type {
    Model,
    ModelStatic,
    FindOptions,
    CreateOptions,
    UpdateOptions,
    DestroyOptions,
    CountOptions,
    FindAndCountOptions,
    Sequelize,
    Transaction,
    WhereOptions,
    Order,
    Includeable,
    Attributes,
    CreationAttributes,
    InferAttributes,
    InferCreationAttributes,
    Op,
    literal,
    fn,
    col,
} from 'sequelize';

// ============================================================================
// TYPES
// ============================================================================

export interface SequelizeConfig {
    sequelize: Sequelize;
    defaultPageSize?: number;
    enableLogging?: boolean;
    cacheEnabled?: boolean;
    cacheTTL?: number;
}

export interface QueryState<T> {
    data: Signal<T[]>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
    count: Signal<number>;
}

export interface SingleQueryState<T> {
    data: Signal<T | null>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
}

export interface PaginationState {
    page: Signal<number>;
    pageSize: Signal<number>;
    totalPages: Signal<number>;
    totalCount: Signal<number>;
    hasNextPage: Signal<boolean>;
    hasPreviousPage: Signal<boolean>;
}

export interface UseSequelizeOptions<T extends Model> extends FindOptions<Attributes<T>> {
    initialData?: T[];
    enabled?: boolean;
    refetchInterval?: number;
    cacheKey?: string;
    staleTime?: number;
    onSuccess?: (data: T[]) => void;
    onError?: (error: Error) => void;
}

export interface UseSequelizeByIdOptions<T extends Model> {
    include?: Includeable[];
    attributes?: string[];
    rejectOnEmpty?: boolean;
    paranoid?: boolean;
}

export interface UsePaginatedOptions<T extends Model> extends Omit<FindOptions<Attributes<T>>, 'limit' | 'offset'> {
    pageSize?: number;
    initialPage?: number;
}

export interface MutationOptions<T extends Model> {
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    optimisticUpdate?: boolean;
    invalidateQueries?: string[];
}

export interface BulkMutationOptions<T extends Model> {
    onSuccess?: (results: T[]) => void;
    onError?: (error: Error) => void;
    transaction?: Transaction;
}

export interface TransactionOptions {
    isolationLevel?: Transaction.ISOLATION_LEVELS;
    autocommit?: boolean;
    type?: Transaction.TYPES;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    staleTime: number;
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

let globalConfig: SequelizeConfig | null = null;
const queryCache = new Map<string, CacheEntry<any>>();
const querySubscribers = new Map<string, Set<() => void>>();
const activeQueries = new Map<string, Promise<any>>();

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Initialize PhilJS Sequelize with configuration
 */
export function initSequelize(config: SequelizeConfig): void {
    globalConfig = {
        defaultPageSize: 20,
        enableLogging: false,
        cacheEnabled: true,
        cacheTTL: 60000,
        ...config,
    };
}

/**
 * Get the Sequelize instance
 */
export function getSequelize(): Sequelize {
    if (!globalConfig) {
        throw new Error('Sequelize not initialized. Call initSequelize() first.');
    }
    return globalConfig.sequelize;
}

/**
 * Get configuration
 */
export function getConfig(): SequelizeConfig {
    if (!globalConfig) {
        throw new Error('Sequelize not initialized. Call initSequelize() first.');
    }
    return globalConfig;
}

// ============================================================================
// CACHE UTILITIES
// ============================================================================

function getCacheKey(model: ModelStatic<any>, options: any): string {
    return `${model.name}:${JSON.stringify(options)}`;
}

function getFromCache<T>(key: string): T | null {
    const entry = queryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.staleTime) {
        queryCache.delete(key);
        return null;
    }

    return entry.data;
}

function setCache<T>(key: string, data: T, staleTime: number): void {
    queryCache.set(key, {
        data,
        timestamp: Date.now(),
        staleTime,
    });
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidateCache(pattern?: string | RegExp): void {
    if (!pattern) {
        queryCache.clear();
        return;
    }

    for (const key of queryCache.keys()) {
        if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
            queryCache.delete(key);
        }
    }

    // Notify subscribers
    for (const [key, subscribers] of querySubscribers.entries()) {
        if (!pattern || (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key))) {
            subscribers.forEach(cb => cb());
        }
    }
}

/**
 * Invalidate queries for a specific model
 */
export function invalidateModel(model: ModelStatic<any>): void {
    invalidateCache(new RegExp(`^${model.name}:`));
}

// ============================================================================
// CORE HOOKS
// ============================================================================

/**
 * Use Sequelize model with reactive signals
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useSequelize(User, {
 *   where: { isActive: true },
 *   include: [{ model: Profile }],
 *   order: [['createdAt', 'DESC']],
 * });
 * ```
 */
export function useSequelize<T extends Model>(
    model: ModelStatic<T>,
    options: UseSequelizeOptions<T> = {}
): QueryState<T> & { refetch: () => Promise<void> } {
    const {
        initialData = [],
        enabled = true,
        refetchInterval,
        cacheKey,
        staleTime = globalConfig?.cacheTTL ?? 60000,
        onSuccess,
        onError,
        ...findOptions
    } = options;

    const data = signal<T[]>(initialData);
    const loading = signal(enabled);
    const error = signal<Error | null>(null);
    const count = signal(0);

    const effectiveKey = cacheKey || getCacheKey(model, findOptions);

    const fetch = async () => {
        if (!enabled) return;

        // Check cache
        if (globalConfig?.cacheEnabled) {
            const cached = getFromCache<T[]>(effectiveKey);
            if (cached) {
                data.set(cached);
                loading.set(false);
                return;
            }
        }

        // Dedupe concurrent requests
        const existing = activeQueries.get(effectiveKey);
        if (existing) {
            try {
                const result = await existing;
                data.set(result);
                onSuccess?.(result);
            } catch (e) {
                error.set(e as Error);
                onError?.(e as Error);
            }
            return;
        }

        loading.set(true);
        error.set(null);

        const promise = model.findAll(findOptions);
        activeQueries.set(effectiveKey, promise);

        try {
            const result = await promise;
            batch(() => {
                data.set(result);
                count.set(result.length);
                loading.set(false);
            });

            if (globalConfig?.cacheEnabled) {
                setCache(effectiveKey, result, staleTime);
            }

            onSuccess?.(result);
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            onError?.(e as Error);
        } finally {
            activeQueries.delete(effectiveKey);
        }
    };

    // Initial fetch
    if (enabled) {
        fetch();
    }

    // Refetch interval
    if (refetchInterval && refetchInterval > 0) {
        const interval = setInterval(fetch, refetchInterval);
        effect(() => () => clearInterval(interval));
    }

    // Subscribe to cache invalidations
    if (!querySubscribers.has(effectiveKey)) {
        querySubscribers.set(effectiveKey, new Set());
    }
    querySubscribers.get(effectiveKey)!.add(fetch);

    effect(() => () => {
        querySubscribers.get(effectiveKey)?.delete(fetch);
    });

    return { data, loading, error, count, refetch: fetch };
}

/**
 * Use a single record by primary key
 */
export function useSequelizeById<T extends Model>(
    model: ModelStatic<T>,
    id: number | string | null,
    options: UseSequelizeByIdOptions<T> = {}
): SingleQueryState<T> & { refetch: () => Promise<void> } {
    const data = signal<T | null>(null);
    const loading = signal(id !== null);
    const error = signal<Error | null>(null);

    const fetch = async () => {
        if (id === null) {
            data.set(null);
            loading.set(false);
            return;
        }

        loading.set(true);
        error.set(null);

        try {
            const result = await model.findByPk(id, options as any);
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

    if (id !== null) {
        fetch();
    }

    return { data, loading, error, refetch: fetch };
}

/**
 * Use a single record by query
 */
export function useSequelizeOne<T extends Model>(
    model: ModelStatic<T>,
    options: FindOptions<Attributes<T>> = {}
): SingleQueryState<T> & { refetch: () => Promise<void> } {
    const data = signal<T | null>(null);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const fetch = async () => {
        loading.set(true);
        error.set(null);

        try {
            const result = await model.findOne(options);
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

    fetch();

    return { data, loading, error, refetch: fetch };
}

/**
 * Use count query
 */
export function useSequelizeCount<T extends Model>(
    model: ModelStatic<T>,
    options: CountOptions<Attributes<T>> = {}
): { count: Signal<number>; loading: Signal<boolean>; error: Signal<Error | null>; refetch: () => Promise<void> } {
    const count = signal(0);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const fetch = async () => {
        loading.set(true);
        error.set(null);

        try {
            const result = await model.count(options);
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

    fetch();

    return { count, loading, error, refetch: fetch };
}

// ============================================================================
// PAGINATION
// ============================================================================

/**
 * Use paginated query with navigation controls
 *
 * @example
 * ```tsx
 * const { data, loading, pagination, goToPage, nextPage, prevPage } = usePaginated(User, {
 *   where: { isActive: true },
 *   pageSize: 10,
 * });
 *
 * // In UI
 * <button onClick={() => prevPage()} disabled={!pagination.hasPreviousPage()}>Previous</button>
 * <span>Page {pagination.page()} of {pagination.totalPages()}</span>
 * <button onClick={() => nextPage()} disabled={!pagination.hasNextPage()}>Next</button>
 * ```
 */
export function usePaginated<T extends Model>(
    model: ModelStatic<T>,
    options: UsePaginatedOptions<T> = {}
): QueryState<T> & PaginationState & {
    refetch: () => Promise<void>;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    setPageSize: (size: number) => void;
} {
    const {
        pageSize: initialPageSize = globalConfig?.defaultPageSize ?? 20,
        initialPage = 1,
        ...findOptions
    } = options;

    const data = signal<T[]>([]);
    const loading = signal(true);
    const error = signal<Error | null>(null);
    const count = signal(0);
    const page = signal(initialPage);
    const pageSize = signal(initialPageSize);
    const totalCount = signal(0);

    const totalPages = computed(() => Math.ceil(totalCount() / pageSize()));
    const hasNextPage = computed(() => page() < totalPages());
    const hasPreviousPage = computed(() => page() > 1);

    const fetch = async () => {
        loading.set(true);
        error.set(null);

        try {
            const result = await model.findAndCountAll({
                ...findOptions,
                limit: pageSize(),
                offset: (page() - 1) * pageSize(),
            } as FindAndCountOptions<Attributes<T>>);

            batch(() => {
                data.set(result.rows);
                count.set(result.rows.length);
                totalCount.set(result.count as number);
                loading.set(false);
            });
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
        }
    };

    // Refetch when page or pageSize changes
    effect(() => {
        const _ = page();
        const __ = pageSize();
        fetch();
    });

    const goToPage = (newPage: number) => {
        const max = totalPages();
        page.set(Math.max(1, Math.min(newPage, max || 1)));
    };

    const nextPage = () => {
        if (hasNextPage()) {
            page.set(page() + 1);
        }
    };

    const prevPage = () => {
        if (hasPreviousPage()) {
            page.set(page() - 1);
        }
    };

    const setPageSize = (size: number) => {
        pageSize.set(size);
        page.set(1); // Reset to first page
    };

    return {
        data,
        loading,
        error,
        count,
        page,
        pageSize,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        refetch: fetch,
        goToPage,
        nextPage,
        prevPage,
        setPageSize,
    };
}

/**
 * Infinite scroll / load more pattern
 */
export function useInfiniteSequelize<T extends Model>(
    model: ModelStatic<T>,
    options: UsePaginatedOptions<T> = {}
): {
    data: Signal<T[]>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
    hasMore: Signal<boolean>;
    loadMore: () => Promise<void>;
    reset: () => void;
} {
    const {
        pageSize: batchSize = 20,
        ...findOptions
    } = options;

    const data = signal<T[]>([]);
    const loading = signal(false);
    const error = signal<Error | null>(null);
    const hasMore = signal(true);
    const offset = signal(0);

    const loadMore = async () => {
        if (loading() || !hasMore()) return;

        loading.set(true);
        error.set(null);

        try {
            const result = await model.findAll({
                ...findOptions,
                limit: batchSize,
                offset: offset(),
            } as FindOptions<Attributes<T>>);

            batch(() => {
                data.set([...data(), ...result]);
                offset.set(offset() + result.length);
                hasMore.set(result.length === batchSize);
                loading.set(false);
            });
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
        }
    };

    const reset = () => {
        batch(() => {
            data.set([]);
            offset.set(0);
            hasMore.set(true);
            error.set(null);
        });
    };

    // Initial load
    loadMore();

    return { data, loading, error, hasMore, loadMore, reset };
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Use mutations for a Sequelize model
 *
 * @example
 * ```tsx
 * const { create, update, destroy, loading, error } = useSequelizeMutation(User);
 *
 * // Create
 * const newUser = await create({ name: 'John', email: 'john@example.com' });
 *
 * // Update
 * await update(1, { name: 'Jane' });
 *
 * // Delete
 * await destroy(1);
 * ```
 */
export function useSequelizeMutation<T extends Model>(
    model: ModelStatic<T>,
    options: MutationOptions<T> = {}
): {
    create: (values: CreationAttributes<T>, createOptions?: CreateOptions) => Promise<T>;
    update: (id: number | string, values: Partial<Attributes<T>>, updateOptions?: UpdateOptions) => Promise<T | null>;
    destroy: (id: number | string, destroyOptions?: DestroyOptions) => Promise<boolean>;
    upsert: (values: CreationAttributes<T>) => Promise<[T, boolean]>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
} {
    const { onSuccess, onError, optimisticUpdate = false, invalidateQueries } = options;

    const loading = signal(false);
    const error = signal<Error | null>(null);

    const invalidate = () => {
        if (invalidateQueries) {
            invalidateQueries.forEach(pattern => invalidateCache(pattern));
        } else {
            invalidateModel(model);
        }
    };

    const create = async (values: CreationAttributes<T>, createOptions?: CreateOptions): Promise<T> => {
        loading.set(true);
        error.set(null);

        try {
            const result = await model.create(values, createOptions);
            loading.set(false);
            invalidate();
            onSuccess?.(result);
            return result;
        } catch (e) {
            error.set(e as Error);
            loading.set(false);
            onError?.(e as Error);
            throw e;
        }
    };

    const update = async (
        id: number | string,
        values: Partial<Attributes<T>>,
        updateOptions?: UpdateOptions
    ): Promise<T | null> => {
        loading.set(true);
        error.set(null);

        try {
            await model.update(values as any, {
                where: { id } as any,
                ...updateOptions,
            });
            const result = await model.findByPk(id);
            loading.set(false);
            invalidate();
            if (result) {
                onSuccess?.(result);
            }
            return result;
        } catch (e) {
            error.set(e as Error);
            loading.set(false);
            onError?.(e as Error);
            throw e;
        }
    };

    const destroy = async (id: number | string, destroyOptions?: DestroyOptions): Promise<boolean> => {
        loading.set(true);
        error.set(null);

        try {
            const deleted = await model.destroy({
                where: { id } as any,
                ...destroyOptions,
            });
            loading.set(false);
            invalidate();
            return deleted > 0;
        } catch (e) {
            error.set(e as Error);
            loading.set(false);
            onError?.(e as Error);
            throw e;
        }
    };

    const upsert = async (values: CreationAttributes<T>): Promise<[T, boolean]> => {
        loading.set(true);
        error.set(null);

        try {
            const result = await model.upsert(values);
            loading.set(false);
            invalidate();
            onSuccess?.(result[0]);
            return result;
        } catch (e) {
            error.set(e as Error);
            loading.set(false);
            onError?.(e as Error);
            throw e;
        }
    };

    return { create, update, destroy, upsert, loading, error };
}

/**
 * Bulk mutations
 */
export function useBulkMutation<T extends Model>(
    model: ModelStatic<T>,
    options: BulkMutationOptions<T> = {}
): {
    bulkCreate: (records: CreationAttributes<T>[]) => Promise<T[]>;
    bulkUpdate: (values: Partial<Attributes<T>>, where: WhereOptions<Attributes<T>>) => Promise<number>;
    bulkDestroy: (where: WhereOptions<Attributes<T>>) => Promise<number>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
} {
    const { onSuccess, onError, transaction } = options;

    const loading = signal(false);
    const error = signal<Error | null>(null);

    const bulkCreate = async (records: CreationAttributes<T>[]): Promise<T[]> => {
        loading.set(true);
        error.set(null);

        try {
            const result = await model.bulkCreate(records, { transaction });
            loading.set(false);
            invalidateModel(model);
            onSuccess?.(result);
            return result;
        } catch (e) {
            error.set(e as Error);
            loading.set(false);
            onError?.(e as Error);
            throw e;
        }
    };

    const bulkUpdate = async (
        values: Partial<Attributes<T>>,
        where: WhereOptions<Attributes<T>>
    ): Promise<number> => {
        loading.set(true);
        error.set(null);

        try {
            const [affected] = await model.update(values as any, { where, transaction });
            loading.set(false);
            invalidateModel(model);
            return affected;
        } catch (e) {
            error.set(e as Error);
            loading.set(false);
            onError?.(e as Error);
            throw e;
        }
    };

    const bulkDestroy = async (where: WhereOptions<Attributes<T>>): Promise<number> => {
        loading.set(true);
        error.set(null);

        try {
            const deleted = await model.destroy({ where, transaction });
            loading.set(false);
            invalidateModel(model);
            return deleted;
        } catch (e) {
            error.set(e as Error);
            loading.set(false);
            onError?.(e as Error);
            throw e;
        }
    };

    return { bulkCreate, bulkUpdate, bulkDestroy, loading, error };
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

/**
 * Use transaction with automatic rollback on error
 *
 * @example
 * ```tsx
 * const { transaction, commit, rollback, isActive } = useTransaction();
 *
 * try {
 *   const t = await transaction();
 *   await User.create({ name: 'John' }, { transaction: t });
 *   await Profile.create({ userId: 1 }, { transaction: t });
 *   await commit();
 * } catch (e) {
 *   await rollback();
 * }
 * ```
 */
export function useTransaction(options: TransactionOptions = {}): {
    transaction: () => Promise<Transaction>;
    commit: () => Promise<void>;
    rollback: () => Promise<void>;
    isActive: Signal<boolean>;
    run: <T>(fn: (t: Transaction) => Promise<T>) => Promise<T>;
} {
    const sequelize = getSequelize();
    const isActive = signal(false);
    let currentTransaction: Transaction | null = null;

    const transaction = async (): Promise<Transaction> => {
        if (currentTransaction) {
            throw new Error('Transaction already active');
        }
        currentTransaction = await sequelize.transaction(options);
        isActive.set(true);
        return currentTransaction;
    };

    const commit = async (): Promise<void> => {
        if (!currentTransaction) {
            throw new Error('No active transaction');
        }
        await currentTransaction.commit();
        currentTransaction = null;
        isActive.set(false);
    };

    const rollback = async (): Promise<void> => {
        if (!currentTransaction) {
            throw new Error('No active transaction');
        }
        await currentTransaction.rollback();
        currentTransaction = null;
        isActive.set(false);
    };

    const run = async <T>(fn: (t: Transaction) => Promise<T>): Promise<T> => {
        const t = await transaction();
        try {
            const result = await fn(t);
            await commit();
            return result;
        } catch (e) {
            await rollback();
            throw e;
        }
    };

    return { transaction, commit, rollback, isActive, run };
}

/**
 * Execute operations in a managed transaction
 */
export async function withTransaction<T>(
    fn: (transaction: Transaction) => Promise<T>,
    options: TransactionOptions = {}
): Promise<T> {
    const sequelize = getSequelize();
    return sequelize.transaction(options, fn);
}

// ============================================================================
// QUERY BUILDER
// ============================================================================

export interface QueryBuilderState<T extends Model> {
    where: (conditions: WhereOptions<Attributes<T>>) => QueryBuilderState<T>;
    orderBy: (field: keyof Attributes<T>, direction?: 'ASC' | 'DESC') => QueryBuilderState<T>;
    include: (associations: Includeable | Includeable[]) => QueryBuilderState<T>;
    select: (fields: (keyof Attributes<T>)[]) => QueryBuilderState<T>;
    limit: (count: number) => QueryBuilderState<T>;
    offset: (count: number) => QueryBuilderState<T>;
    execute: () => Promise<T[]>;
    executeOne: () => Promise<T | null>;
    count: () => Promise<number>;
    toFindOptions: () => FindOptions<Attributes<T>>;
}

/**
 * Fluent query builder for Sequelize
 *
 * @example
 * ```tsx
 * const users = await queryBuilder(User)
 *   .where({ isActive: true })
 *   .orderBy('createdAt', 'DESC')
 *   .include([{ model: Profile }])
 *   .limit(10)
 *   .execute();
 * ```
 */
export function queryBuilder<T extends Model>(model: ModelStatic<T>): QueryBuilderState<T> {
    const options: FindOptions<Attributes<T>> = {};

    const builder: QueryBuilderState<T> = {
        where(conditions) {
            options.where = { ...options.where, ...conditions } as any;
            return builder;
        },

        orderBy(field, direction = 'ASC') {
            options.order = options.order || [];
            (options.order as Order).push([field as string, direction]);
            return builder;
        },

        include(associations) {
            options.include = Array.isArray(associations) ? associations : [associations];
            return builder;
        },

        select(fields) {
            options.attributes = fields as string[];
            return builder;
        },

        limit(count) {
            options.limit = count;
            return builder;
        },

        offset(count) {
            options.offset = count;
            return builder;
        },

        async execute() {
            return model.findAll(options);
        },

        async executeOne() {
            return model.findOne(options);
        },

        async count() {
            return model.count(options as CountOptions<Attributes<T>>);
        },

        toFindOptions() {
            return { ...options };
        },
    };

    return builder;
}

// ============================================================================
// RAW QUERIES
// ============================================================================

/**
 * Use raw SQL query with signals
 */
export function useRawQuery<T = any>(
    sql: string,
    replacements?: Record<string, any>
): QueryState<T> & { refetch: () => Promise<void> } {
    const data = signal<T[]>([]);
    const loading = signal(true);
    const error = signal<Error | null>(null);
    const count = signal(0);

    const sequelize = getSequelize();

    const fetch = async () => {
        loading.set(true);
        error.set(null);

        try {
            const [results] = await sequelize.query(sql, {
                replacements,
                type: 'SELECT' as any,
            });
            batch(() => {
                data.set(results as T[]);
                count.set((results as T[]).length);
                loading.set(false);
            });
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
        }
    };

    fetch();

    return { data, loading, error, count, refetch: fetch };
}

/**
 * Execute raw SQL command
 */
export async function executeRaw(
    sql: string,
    replacements?: Record<string, any>
): Promise<[unknown[], unknown]> {
    const sequelize = getSequelize();
    return sequelize.query(sql, { replacements });
}

// ============================================================================
// ASSOCIATIONS
// ============================================================================

/**
 * Use associated records
 *
 * @example
 * ```tsx
 * const { data, loading } = useAssociation(user, 'posts', {
 *   where: { published: true },
 * });
 * ```
 */
export function useAssociation<T extends Model, A extends Model>(
    instance: T | null,
    associationName: string,
    options: FindOptions<Attributes<A>> = {}
): QueryState<A> & { refetch: () => Promise<void> } {
    const data = signal<A[]>([]);
    const loading = signal(true);
    const error = signal<Error | null>(null);
    const count = signal(0);

    const fetch = async () => {
        if (!instance) {
            loading.set(false);
            return;
        }

        loading.set(true);
        error.set(null);

        try {
            const getter = `get${associationName.charAt(0).toUpperCase()}${associationName.slice(1)}`;
            const result = await (instance as any)[getter](options);
            const resultArray = Array.isArray(result) ? result : [result].filter(Boolean);

            batch(() => {
                data.set(resultArray);
                count.set(resultArray.length);
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

    return { data, loading, error, count, refetch: fetch };
}

// ============================================================================
// OPTIMISTIC UPDATES
// ============================================================================

export interface OptimisticState<T> {
    data: Signal<T[]>;
    optimisticData: Signal<T[]>;
    isPending: Signal<boolean>;
    add: (item: T) => string;
    update: (id: string | number, updates: Partial<T>) => void;
    remove: (id: string | number) => void;
    commit: (tempId: string, realItem: T) => void;
    rollback: (tempId: string) => void;
}

/**
 * Optimistic updates with rollback support
 */
export function useOptimistic<T extends Model>(
    model: ModelStatic<T>,
    options: FindOptions<Attributes<T>> = {}
): OptimisticState<T> & { refetch: () => Promise<void> } {
    const { data, loading, refetch } = useSequelize(model, options);

    const pendingOperations = signal<Map<string, { type: 'add' | 'update' | 'remove'; item?: T; original?: T }>>(
        new Map()
    );

    const optimisticData = computed(() => {
        let result = [...data()];

        for (const [tempId, op] of pendingOperations().entries()) {
            if (op.type === 'add' && op.item) {
                result.push(op.item);
            } else if (op.type === 'update' && op.item) {
                const index = result.findIndex((r: any) => r.id === (op.item as any).id);
                if (index >= 0) {
                    result[index] = op.item;
                }
            } else if (op.type === 'remove') {
                result = result.filter((r: any) => r.id !== tempId);
            }
        }

        return result;
    });

    const isPending = computed(() => pendingOperations().size > 0);

    let tempIdCounter = 0;
    const generateTempId = () => `temp_${Date.now()}_${tempIdCounter++}`;

    const add = (item: T): string => {
        const tempId = generateTempId();
        const newOps = new Map(pendingOperations());
        newOps.set(tempId, { type: 'add', item });
        pendingOperations.set(newOps);
        return tempId;
    };

    const update = (id: string | number, updates: Partial<T>) => {
        const current = data().find((r: any) => r.id === id);
        if (current) {
            const updatedItem = { ...current, ...updates } as T;
            const newOps = new Map(pendingOperations());
            newOps.set(String(id), { type: 'update', item: updatedItem, original: current });
            pendingOperations.set(newOps);
        }
    };

    const remove = (id: string | number) => {
        const current = data().find((r: any) => r.id === id);
        if (current) {
            const newOps = new Map(pendingOperations());
            newOps.set(String(id), { type: 'remove', original: current });
            pendingOperations.set(newOps);
        }
    };

    const commit = (tempId: string, realItem: T) => {
        const newOps = new Map(pendingOperations());
        newOps.delete(tempId);
        pendingOperations.set(newOps);
        refetch(); // Refresh from server
    };

    const rollback = (tempId: string) => {
        const newOps = new Map(pendingOperations());
        newOps.delete(tempId);
        pendingOperations.set(newOps);
    };

    return {
        data,
        optimisticData,
        isPending,
        add,
        update,
        remove,
        commit,
        rollback,
        refetch,
    };
}

// ============================================================================
// SUBSCRIPTIONS (Polling-based)
// ============================================================================

/**
 * Subscribe to changes with polling
 */
export function useSubscription<T extends Model>(
    model: ModelStatic<T>,
    options: UseSequelizeOptions<T> & { pollInterval?: number } = {}
): QueryState<T> & { stop: () => void; start: () => void } {
    const { pollInterval = 5000, ...queryOptions } = options;

    const { data, loading, error, count, refetch } = useSequelize(model, {
        ...queryOptions,
        refetchInterval: pollInterval,
    });

    let intervalId: NodeJS.Timeout | null = null;
    const isRunning = signal(true);

    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        isRunning.set(false);
    };

    const start = () => {
        if (!intervalId) {
            intervalId = setInterval(refetch, pollInterval);
            isRunning.set(true);
        }
    };

    effect(() => () => stop());

    return { data, loading, error, count, stop, start };
}

// ============================================================================
// SCOPES
// ============================================================================

/**
 * Apply named scopes to queries
 */
export function useScoped<T extends Model>(
    model: ModelStatic<T>,
    scopeName: string | string[],
    options: UseSequelizeOptions<T> = {}
): QueryState<T> & { refetch: () => Promise<void> } {
    const scopes = Array.isArray(scopeName) ? scopeName : [scopeName];
    const scopedModel = model.scope(scopes);
    return useSequelize(scopedModel as ModelStatic<T>, options);
}

// ============================================================================
// SEARCH
// ============================================================================

export interface SearchOptions<T extends Model> {
    fields: (keyof Attributes<T>)[];
    minLength?: number;
    debounceMs?: number;
}

/**
 * Full-text search with signals
 */
export function useSearch<T extends Model>(
    model: ModelStatic<T>,
    searchOptions: SearchOptions<T>,
    queryOptions: Omit<UseSequelizeOptions<T>, 'where'> = {}
): {
    query: Signal<string>;
    setQuery: (q: string) => void;
    results: Signal<T[]>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
} {
    const { fields, minLength = 1, debounceMs = 300 } = searchOptions;

    const query = signal('');
    const results = signal<T[]>([]);
    const loading = signal(false);
    const error = signal<Error | null>(null);

    let debounceTimeout: NodeJS.Timeout | null = null;

    const search = async (searchQuery: string) => {
        if (searchQuery.length < minLength) {
            results.set([]);
            return;
        }

        loading.set(true);
        error.set(null);

        try {
            // Build OR conditions for each field
            const { Op } = await import('sequelize');
            const whereConditions = fields.map(field => ({
                [field]: { [Op.iLike]: `%${searchQuery}%` },
            }));

            const searchResults = await model.findAll({
                ...queryOptions,
                where: { [Op.or]: whereConditions } as any,
            } as FindOptions<Attributes<T>>);

            batch(() => {
                results.set(searchResults);
                loading.set(false);
            });
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
        }
    };

    const setQuery = (q: string) => {
        query.set(q);

        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(() => {
            search(q);
        }, debounceMs);
    };

    return { query, setQuery, results, loading, error };
}

// ============================================================================
// SOFT DELETE SUPPORT
// ============================================================================

/**
 * Use with paranoid (soft delete) models
 */
export function useWithDeleted<T extends Model>(
    model: ModelStatic<T>,
    options: UseSequelizeOptions<T> = {}
): QueryState<T> & { refetch: () => Promise<void> } {
    return useSequelize(model, {
        ...options,
        // @ts-ignore - paranoid is a valid option
        paranoid: false,
    });
}

/**
 * Restore soft-deleted records
 */
export async function restore<T extends Model>(
    model: ModelStatic<T>,
    where: WhereOptions<Attributes<T>>
): Promise<void> {
    await model.restore({ where });
    invalidateModel(model);
}

// ============================================================================
// HOOKS / LIFECYCLE
// ============================================================================

export interface ModelHooks<T extends Model> {
    beforeCreate?: (instance: T) => void | Promise<void>;
    afterCreate?: (instance: T) => void | Promise<void>;
    beforeUpdate?: (instance: T) => void | Promise<void>;
    afterUpdate?: (instance: T) => void | Promise<void>;
    beforeDestroy?: (instance: T) => void | Promise<void>;
    afterDestroy?: (instance: T) => void | Promise<void>;
}

/**
 * Register reactive hooks on model changes
 */
export function useModelHooks<T extends Model>(
    model: ModelStatic<T>,
    hooks: ModelHooks<T>
): { unregister: () => void } {
    const hookNames = [
        'beforeCreate', 'afterCreate',
        'beforeUpdate', 'afterUpdate',
        'beforeDestroy', 'afterDestroy',
    ] as const;

    const registeredHooks: Array<() => void> = [];

    for (const hookName of hookNames) {
        const handler = hooks[hookName];
        if (handler) {
            model.addHook(hookName as any, handler as any);
            registeredHooks.push(() => model.removeHook(hookName as any, handler as any));
        }
    }

    return {
        unregister: () => {
            registeredHooks.forEach(unregister => unregister());
        },
    };
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    errors: Record<string, string[]>;
}

/**
 * Validate model instance without saving
 */
export async function validateInstance<T extends Model>(
    instance: T
): Promise<ValidationResult> {
    try {
        await instance.validate();
        return { valid: true, errors: {} };
    } catch (e: any) {
        if (e.name === 'SequelizeValidationError') {
            const errors: Record<string, string[]> = {};
            for (const error of e.errors) {
                if (!errors[error.path]) {
                    errors[error.path] = [];
                }
                errors[error.path].push(error.message);
            }
            return { valid: false, errors };
        }
        throw e;
    }
}

/**
 * Build a new instance without saving (for validation)
 */
export function buildInstance<T extends Model>(
    model: ModelStatic<T>,
    values: CreationAttributes<T>
): T {
    return model.build(values);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if database is connected
 */
export async function isConnected(): Promise<boolean> {
    try {
        const sequelize = getSequelize();
        await sequelize.authenticate();
        return true;
    } catch {
        return false;
    }
}

/**
 * Close database connection
 */
export async function closeConnection(): Promise<void> {
    const sequelize = getSequelize();
    await sequelize.close();
    globalConfig = null;
}

/**
 * Sync all models
 */
export async function syncModels(options?: { force?: boolean; alter?: boolean }): Promise<void> {
    const sequelize = getSequelize();
    await sequelize.sync(options);
}

/**
 * Get model by name
 */
export function getModel<T extends Model>(name: string): ModelStatic<T> | undefined {
    const sequelize = getSequelize();
    return sequelize.models[name] as ModelStatic<T> | undefined;
}

/**
 * List all registered models
 */
export function listModels(): string[] {
    const sequelize = getSequelize();
    return Object.keys(sequelize.models);
}

// ============================================================================
// SERVER INTEGRATION
// ============================================================================

export interface SSRDataLoader {
    preload: <T extends Model>(model: ModelStatic<T>, options?: FindOptions<Attributes<T>>) => Promise<void>;
    getData: () => Record<string, any>;
    hydrate: (data: Record<string, any>) => void;
}

/**
 * Create SSR data loader for server-side rendering
 */
export function createSSRDataLoader(): SSRDataLoader {
    const preloadedData: Record<string, any> = {};

    return {
        async preload<T extends Model>(model: ModelStatic<T>, options: FindOptions<Attributes<T>> = {}) {
            const key = getCacheKey(model, options);
            const data = await model.findAll(options);
            preloadedData[key] = data;
        },

        getData() {
            return { ...preloadedData };
        },

        hydrate(data: Record<string, any>) {
            for (const [key, value] of Object.entries(data)) {
                setCache(key, value, globalConfig?.cacheTTL ?? 60000);
            }
        },
    };
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type {
    Model,
    ModelStatic,
    FindOptions,
    CreateOptions,
    UpdateOptions,
    DestroyOptions,
    Transaction,
    WhereOptions,
    Order,
    Includeable,
    Attributes,
    CreationAttributes,
    Sequelize,
};
