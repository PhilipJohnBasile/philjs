/**
 * PhilJS MongoDB Native Driver
 *
 * Comprehensive MongoDB integration with PhilJS signals,
 * providing reactive queries, mutations, aggregation pipelines,
 * change streams, transactions, and more.
 */

import { signal, computed, effect, batch, type Signal } from '@philjs/core';

// ============================================================================
// TYPES
// ============================================================================

export interface MongoDBConfig {
    uri: string;
    dbName: string;
    options?: {
        maxPoolSize?: number;
        minPoolSize?: number;
        maxIdleTimeMS?: number;
        retryWrites?: boolean;
        w?: 'majority' | number;
        journal?: boolean;
        readPreference?: 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest';
        readConcern?: 'local' | 'majority' | 'linearizable' | 'snapshot';
    };
}

export interface ConnectionState {
    connected: Signal<boolean>;
    connecting: Signal<boolean>;
    error: Signal<Error | null>;
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

export interface UseCollectionOptions<T> {
    initialData?: T[];
    autoFetch?: boolean;
    cacheKey?: string;
    cacheTime?: number;
    refetchInterval?: number;
    onSuccess?: (data: T[]) => void;
    onError?: (error: Error) => void;
}

export interface FindOptions<T> {
    filter?: Record<string, any>;
    sort?: Record<string, 1 | -1>;
    limit?: number;
    skip?: number;
    projection?: Record<string, 0 | 1>;
}

export interface PaginationOptions<T> extends FindOptions<T> {
    page?: number;
    pageSize?: number;
}

export interface PaginationState {
    page: Signal<number>;
    pageSize: Signal<number>;
    totalPages: Signal<number>;
    totalCount: Signal<number>;
    hasNextPage: Signal<boolean>;
    hasPreviousPage: Signal<boolean>;
}

export interface AggregationStage {
    [key: string]: any;
}

export interface ChangeStreamOptions {
    fullDocument?: 'default' | 'updateLookup' | 'whenAvailable' | 'required';
    pipeline?: AggregationStage[];
}

export interface TransactionOptions {
    readConcern?: { level: string };
    writeConcern?: { w: string | number; j?: boolean };
    readPreference?: string;
    maxCommitTimeMS?: number;
}

export interface BulkWriteOperation<T> {
    insertOne?: { document: T };
    updateOne?: { filter: Record<string, any>; update: Record<string, any>; upsert?: boolean };
    updateMany?: { filter: Record<string, any>; update: Record<string, any>; upsert?: boolean };
    deleteOne?: { filter: Record<string, any> };
    deleteMany?: { filter: Record<string, any> };
    replaceOne?: { filter: Record<string, any>; replacement: T; upsert?: boolean };
}

export interface IndexDefinition {
    key: Record<string, 1 | -1 | 'text' | '2dsphere' | 'hashed'>;
    options?: {
        unique?: boolean;
        sparse?: boolean;
        background?: boolean;
        name?: string;
        expireAfterSeconds?: number;
        partialFilterExpression?: Record<string, any>;
    };
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

let client: any = null;
let db: any = null;
let config: MongoDBConfig | null = null;

const connectionState: ConnectionState = {
    connected: signal(false),
    connecting: signal(false),
    error: signal<Error | null>(null),
};

const queryCache = new Map<string, { data: any; timestamp: number }>();
const changeStreams = new Map<string, any>();

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Connect to MongoDB
 *
 * @example
 * ```ts
 * await connect({
 *   uri: 'mongodb://localhost:27017',
 *   dbName: 'myapp',
 *   options: { maxPoolSize: 10 }
 * });
 * ```
 */
export async function connect(connectionConfig: MongoDBConfig): Promise<{ client: any; db: any }> {
    if (client && connectionState.connected()) {
        return { client, db };
    }

    connectionState.connecting.set(true);
    connectionState.error.set(null);
    config = connectionConfig;

    try {
        const { MongoClient } = await import('mongodb');

        client = new MongoClient(connectionConfig.uri, {
            maxPoolSize: connectionConfig.options?.maxPoolSize ?? 10,
            minPoolSize: connectionConfig.options?.minPoolSize ?? 1,
            maxIdleTimeMS: connectionConfig.options?.maxIdleTimeMS ?? 30000,
            retryWrites: connectionConfig.options?.retryWrites ?? true,
            w: connectionConfig.options?.w ?? 'majority',
            journal: connectionConfig.options?.journal ?? true,
        } as any);

        await client.connect();
        db = client.db(connectionConfig.dbName);

        batch(() => {
            connectionState.connected.set(true);
            connectionState.connecting.set(false);
        });

        // Setup connection monitoring
        client.on('close', () => {
            connectionState.connected.set(false);
        });

        client.on('error', (err: Error) => {
            connectionState.error.set(err);
        });

        return { client, db };
    } catch (error) {
        batch(() => {
            connectionState.error.set(error as Error);
            connectionState.connecting.set(false);
        });
        throw error;
    }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnect(): Promise<void> {
    if (client) {
        // Close all change streams
        for (const [, stream] of changeStreams) {
            await stream.close();
        }
        changeStreams.clear();

        await client.close();
        client = null;
        db = null;

        batch(() => {
            connectionState.connected.set(false);
            connectionState.connecting.set(false);
        });
    }
}

/**
 * Get the MongoDB client
 */
export function getClient(): any {
    if (!client) {
        throw new Error('MongoDB not connected. Call connect() first.');
    }
    return client;
}

/**
 * Get the database instance
 */
export function getDb(): any {
    if (!db) {
        throw new Error('MongoDB not connected. Call connect() first.');
    }
    return db;
}

/**
 * Get connection state
 */
export function getConnectionState(): ConnectionState {
    return connectionState;
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
    return connectionState.connected();
}

// ============================================================================
// COLLECTION HOOKS
// ============================================================================

/**
 * Use a MongoDB collection with reactive signals
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const { data, loading, error, find, insertOne } = useCollection<User>('users');
 *
 *   onMount(() => {
 *     find({ isActive: true });
 *   });
 *
 *   return (
 *     <Show when={!loading()} fallback={<Loading />}>
 *       <For each={data()}>
 *         {user => <UserCard user={user} />}
 *       </For>
 *     </Show>
 *   );
 * }
 * ```
 */
export function useCollection<T extends { _id?: any }>(
    name: string,
    options: UseCollectionOptions<T> = {}
): QueryState<T> & {
    find: (filter?: Record<string, any>, findOptions?: FindOptions<T>) => Promise<T[]>;
    findOne: (filter: Record<string, any>) => Promise<T | null>;
    insertOne: (doc: Omit<T, '_id'>) => Promise<any>;
    insertMany: (docs: Omit<T, '_id'>[]) => Promise<any>;
    updateOne: (filter: Record<string, any>, update: Record<string, any>) => Promise<any>;
    updateMany: (filter: Record<string, any>, update: Record<string, any>) => Promise<any>;
    deleteOne: (filter: Record<string, any>) => Promise<boolean>;
    deleteMany: (filter: Record<string, any>) => Promise<number>;
    replaceOne: (filter: Record<string, any>, replacement: T) => Promise<any>;
    countDocuments: (filter?: Record<string, any>) => Promise<number>;
    distinct: (field: string, filter?: Record<string, any>) => Promise<any[]>;
    refetch: () => Promise<void>;
    invalidate: () => void;
} {
    const {
        initialData = [],
        autoFetch = false,
        cacheKey,
        cacheTime = 60000,
        refetchInterval,
        onSuccess,
        onError,
    } = options;

    const data = signal<T[]>(initialData);
    const loading = signal(autoFetch);
    const error = signal<Error | null>(null);
    const count = signal(0);

    let currentFilter: Record<string, any> = {};
    let currentOptions: FindOptions<T> = {};

    const getCollection = () => {
        if (!db) {
            throw new Error('MongoDB not connected');
        }
        return db.collection(name);
    };

    const getCacheKeyForQuery = (filter: Record<string, any>, opts: FindOptions<T>) => {
        return cacheKey || `${name}:${JSON.stringify(filter)}:${JSON.stringify(opts)}`;
    };

    const find = async (filter: Record<string, any> = {}, findOptions: FindOptions<T> = {}): Promise<T[]> => {
        currentFilter = filter;
        currentOptions = findOptions;

        const key = getCacheKeyForQuery(filter, findOptions);

        // Check cache
        const cached = queryCache.get(key);
        if (cached && Date.now() - cached.timestamp < cacheTime) {
            data.set(cached.data);
            count.set(cached.data.length);
            return cached.data;
        }

        loading.set(true);
        error.set(null);

        try {
            const collection = getCollection();
            let query = collection.find(filter);

            if (findOptions.projection) {
                query = query.project(findOptions.projection);
            }
            if (findOptions.sort) {
                query = query.sort(findOptions.sort);
            }
            if (findOptions.skip) {
                query = query.skip(findOptions.skip);
            }
            if (findOptions.limit) {
                query = query.limit(findOptions.limit);
            }

            const result = await query.toArray();

            batch(() => {
                data.set(result);
                count.set(result.length);
                loading.set(false);
            });

            // Update cache
            queryCache.set(key, { data: result, timestamp: Date.now() });

            onSuccess?.(result);
            return result;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            onError?.(e as Error);
            throw e;
        }
    };

    const findOne = async (filter: Record<string, any>): Promise<T | null> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = getCollection();
            const result = await collection.findOne(filter);
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

    const insertOne = async (doc: Omit<T, '_id'>): Promise<any> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = getCollection();
            const result = await collection.insertOne(doc);
            loading.set(false);
            invalidate();
            return result.insertedId;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    const insertMany = async (docs: Omit<T, '_id'>[]): Promise<any> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = getCollection();
            const result = await collection.insertMany(docs);
            loading.set(false);
            invalidate();
            return result.insertedIds;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    const updateOne = async (filter: Record<string, any>, update: Record<string, any>): Promise<any> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = getCollection();
            const updateDoc = update.$set || update.$unset || update.$inc
                ? update
                : { $set: update };
            const result = await collection.updateOne(filter, updateDoc);
            loading.set(false);
            invalidate();
            return result;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    const updateMany = async (filter: Record<string, any>, update: Record<string, any>): Promise<any> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = getCollection();
            const updateDoc = update.$set || update.$unset || update.$inc
                ? update
                : { $set: update };
            const result = await collection.updateMany(filter, updateDoc);
            loading.set(false);
            invalidate();
            return result;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    const deleteOne = async (filter: Record<string, any>): Promise<boolean> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = getCollection();
            const result = await collection.deleteOne(filter);
            loading.set(false);
            invalidate();
            return result.deletedCount > 0;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    const deleteMany = async (filter: Record<string, any>): Promise<number> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = getCollection();
            const result = await collection.deleteMany(filter);
            loading.set(false);
            invalidate();
            return result.deletedCount;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    const replaceOne = async (filter: Record<string, any>, replacement: T): Promise<any> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = getCollection();
            const result = await collection.replaceOne(filter, replacement);
            loading.set(false);
            invalidate();
            return result;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    const countDocuments = async (filter: Record<string, any> = {}): Promise<number> => {
        try {
            const collection = getCollection();
            return await collection.countDocuments(filter);
        } catch (e) {
            error.set(e as Error);
            throw e;
        }
    };

    const distinct = async (field: string, filter: Record<string, any> = {}): Promise<any[]> => {
        try {
            const collection = getCollection();
            return await collection.distinct(field, filter);
        } catch (e) {
            error.set(e as Error);
            throw e;
        }
    };

    const refetch = async (): Promise<void> => {
        await find(currentFilter, currentOptions);
    };

    const invalidate = (): void => {
        // Clear cache for this collection
        for (const key of queryCache.keys()) {
            if (key.startsWith(`${name}:`)) {
                queryCache.delete(key);
            }
        }
    };

    // Auto-fetch on mount
    if (autoFetch) {
        find({});
    }

    // Refetch interval
    if (refetchInterval && refetchInterval > 0) {
        const interval = setInterval(refetch, refetchInterval);
        effect(() => () => clearInterval(interval));
    }

    return {
        data,
        loading,
        error,
        count,
        find,
        findOne,
        insertOne,
        insertMany,
        updateOne,
        updateMany,
        deleteOne,
        deleteMany,
        replaceOne,
        countDocuments,
        distinct,
        refetch,
        invalidate,
    };
}

/**
 * Use a single document by ID
 */
export function useDocument<T extends { _id?: any }>(
    collectionName: string,
    id: string | null
): SingleQueryState<T> & {
    refetch: () => Promise<void>;
    update: (update: Partial<T>) => Promise<void>;
    delete: () => Promise<boolean>;
} {
    const data = signal<T | null>(null);
    const loading = signal(id !== null);
    const error = signal<Error | null>(null);

    const fetch = async (): Promise<void> => {
        if (id === null) {
            data.set(null);
            loading.set(false);
            return;
        }

        loading.set(true);
        error.set(null);

        try {
            const { ObjectId } = await import('mongodb');
            const collection = db.collection(collectionName);
            const result = await collection.findOne({ _id: new ObjectId(id) });

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

    const update = async (updateData: Partial<T>): Promise<void> => {
        if (!id) return;

        loading.set(true);
        error.set(null);

        try {
            const { ObjectId } = await import('mongodb');
            const collection = db.collection(collectionName);
            await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            await fetch();
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    const deleteDoc = async (): Promise<boolean> => {
        if (!id) return false;

        loading.set(true);
        error.set(null);

        try {
            const { ObjectId } = await import('mongodb');
            const collection = db.collection(collectionName);
            const result = await collection.deleteOne({ _id: new ObjectId(id) });
            loading.set(false);
            data.set(null);
            return result.deletedCount > 0;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    if (id !== null) {
        fetch();
    }

    return {
        data,
        loading,
        error,
        refetch: fetch,
        update,
        delete: deleteDoc,
    };
}

// ============================================================================
// PAGINATION
// ============================================================================

/**
 * Use paginated collection query
 *
 * @example
 * ```tsx
 * const {
 *   data, loading, pagination,
 *   goToPage, nextPage, prevPage
 * } = usePaginated<User>('users', {
 *   filter: { isActive: true },
 *   pageSize: 20,
 *   sort: { createdAt: -1 },
 * });
 * ```
 */
export function usePaginated<T extends { _id?: any }>(
    collectionName: string,
    options: PaginationOptions<T> = {}
): QueryState<T> & PaginationState & {
    refetch: () => Promise<void>;
    goToPage: (page: number) => Promise<void>;
    nextPage: () => Promise<void>;
    prevPage: () => Promise<void>;
    setPageSize: (size: number) => Promise<void>;
} {
    const {
        filter = {},
        sort,
        projection,
        page: initialPage = 1,
        pageSize: initialPageSize = 20,
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

    const fetch = async (): Promise<void> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = db.collection(collectionName);

            // Get total count
            const total = await collection.countDocuments(filter);
            totalCount.set(total);

            // Get paginated data
            let query = collection.find(filter);

            if (projection) {
                query = query.project(projection);
            }
            if (sort) {
                query = query.sort(sort);
            }

            query = query.skip((page() - 1) * pageSize()).limit(pageSize());

            const result = await query.toArray();

            batch(() => {
                data.set(result);
                count.set(result.length);
                loading.set(false);
            });
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
        }
    };

    const goToPage = async (newPage: number): Promise<void> => {
        const max = totalPages();
        page.set(Math.max(1, Math.min(newPage, max || 1)));
        await fetch();
    };

    const nextPage = async (): Promise<void> => {
        if (hasNextPage()) {
            page.set(page() + 1);
            await fetch();
        }
    };

    const prevPage = async (): Promise<void> => {
        if (hasPreviousPage()) {
            page.set(page() - 1);
            await fetch();
        }
    };

    const setPageSize = async (size: number): Promise<void> => {
        pageSize.set(size);
        page.set(1);
        await fetch();
    };

    // Initial fetch
    fetch();

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

// ============================================================================
// AGGREGATION
// ============================================================================

/**
 * Use aggregation pipeline
 *
 * @example
 * ```tsx
 * const { data, loading, execute } = useAggregate<Stats>('orders', [
 *   { $match: { status: 'completed' } },
 *   { $group: { _id: '$product', total: { $sum: '$amount' } } },
 *   { $sort: { total: -1 } },
 * ]);
 * ```
 */
export function useAggregate<T = any>(
    collectionName: string,
    pipeline: AggregationStage[],
    options?: { autoExecute?: boolean }
): QueryState<T> & { execute: (newPipeline?: AggregationStage[]) => Promise<T[]> } {
    const { autoExecute = true } = options || {};

    const data = signal<T[]>([]);
    const loading = signal(autoExecute);
    const error = signal<Error | null>(null);
    const count = signal(0);

    let currentPipeline = pipeline;

    const execute = async (newPipeline?: AggregationStage[]): Promise<T[]> => {
        if (newPipeline) {
            currentPipeline = newPipeline;
        }

        loading.set(true);
        error.set(null);

        try {
            const collection = db.collection(collectionName);
            const result = await collection.aggregate(currentPipeline).toArray();

            batch(() => {
                data.set(result);
                count.set(result.length);
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

    if (autoExecute) {
        execute();
    }

    return { data, loading, error, count, execute };
}

// ============================================================================
// CHANGE STREAMS (Real-time)
// ============================================================================

/**
 * Watch a collection for real-time changes
 *
 * @example
 * ```tsx
 * const { data, latestChange, close } = useWatch<User>('users', {
 *   fullDocument: 'updateLookup',
 *   pipeline: [{ $match: { 'fullDocument.isActive': true } }],
 * });
 *
 * createEffect(() => {
 *   const change = latestChange();
 *   if (change) {
 *     console.log('Change:', change.operationType, change.fullDocument);
 *   }
 * });
 * ```
 */
export function useWatch<T = any>(
    collectionName: string,
    options: ChangeStreamOptions = {}
): {
    data: Signal<T[]>;
    latestChange: Signal<any>;
    isActive: Signal<boolean>;
    close: () => void;
    restart: () => void;
} {
    const { fullDocument = 'updateLookup', pipeline = [] } = options;

    const data = signal<T[]>([]);
    const latestChange = signal<any>(null);
    const isActive = signal(false);

    let stream: any = null;
    const streamKey = `${collectionName}:${JSON.stringify(pipeline)}`;

    const start = async (): Promise<void> => {
        if (stream) return;

        const collection = db.collection(collectionName);

        // Initial data load
        const initialData = await collection.find().toArray();
        data.set(initialData);

        // Start watching
        stream = collection.watch(pipeline, { fullDocument });
        changeStreams.set(streamKey, stream);
        isActive.set(true);

        stream.on('change', async (change: any) => {
            latestChange.set(change);

            // Update local data based on change
            const currentData = data();

            switch (change.operationType) {
                case 'insert':
                    data.set([...currentData, change.fullDocument]);
                    break;

                case 'update':
                case 'replace':
                    if (change.fullDocument) {
                        data.set(currentData.map((doc: any) =>
                            doc._id.toString() === change.documentKey._id.toString()
                                ? change.fullDocument
                                : doc
                        ));
                    }
                    break;

                case 'delete':
                    data.set(currentData.filter((doc: any) =>
                        doc._id.toString() !== change.documentKey._id.toString()
                    ));
                    break;

                default:
                    // For other operations, refetch all data
                    const freshData = await collection.find().toArray();
                    data.set(freshData);
            }
        });

        stream.on('error', (err: Error) => {
            console.error('Change stream error:', err);
            isActive.set(false);
        });

        stream.on('close', () => {
            isActive.set(false);
            changeStreams.delete(streamKey);
        });
    };

    const close = (): void => {
        if (stream) {
            stream.close();
            stream = null;
            changeStreams.delete(streamKey);
            isActive.set(false);
        }
    };

    const restart = (): void => {
        close();
        start();
    };

    // Start watching
    start();

    // Cleanup on disposal
    effect(() => () => close());

    return {
        data,
        latestChange,
        isActive,
        close,
        restart,
    };
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

/**
 * Use MongoDB transactions
 *
 * @example
 * ```tsx
 * const { withTransaction } = useTransaction();
 *
 * await withTransaction(async (session) => {
 *   await db.collection('accounts').updateOne(
 *     { _id: fromAccount },
 *     { $inc: { balance: -amount } },
 *     { session }
 *   );
 *   await db.collection('accounts').updateOne(
 *     { _id: toAccount },
 *     { $inc: { balance: amount } },
 *     { session }
 *   );
 * });
 * ```
 */
export function useTransaction(options: TransactionOptions = {}): {
    withTransaction: <T>(fn: (session: any) => Promise<T>) => Promise<T>;
    startSession: () => Promise<any>;
} {
    const withTransaction = async <T>(fn: (session: any) => Promise<T>): Promise<T> => {
        const session = client.startSession();

        try {
            session.startTransaction(options);
            const result = await fn(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    };

    const startSession = async () => {
        return client.startSession();
    };

    return { withTransaction, startSession };
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk write operations
 */
export async function bulkWrite<T>(
    collectionName: string,
    operations: BulkWriteOperation<T>[],
    options?: { ordered?: boolean }
): Promise<any> {
    const collection = db.collection(collectionName);
    return collection.bulkWrite(operations, options);
}

// ============================================================================
// INDEX MANAGEMENT
// ============================================================================

/**
 * Create indexes on a collection
 */
export async function createIndexes(
    collectionName: string,
    indexes: IndexDefinition[]
): Promise<string[]> {
    const collection = db.collection(collectionName);
    return collection.createIndexes(
        indexes.map((idx) => ({
            key: idx.key,
            ...idx.options,
        }))
    );
}

/**
 * List indexes on a collection
 */
export async function listIndexes(collectionName: string): Promise<any[]> {
    const collection = db.collection(collectionName);
    return collection.listIndexes().toArray();
}

/**
 * Drop an index
 */
export async function dropIndex(collectionName: string, indexName: string): Promise<void> {
    const collection = db.collection(collectionName);
    await collection.dropIndex(indexName);
}

// ============================================================================
// TEXT SEARCH
// ============================================================================

/**
 * Full-text search on a collection
 */
export function useTextSearch<T extends { _id?: any }>(
    collectionName: string,
    options?: { language?: string; caseSensitive?: boolean }
): {
    results: Signal<T[]>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
    search: (query: string) => Promise<T[]>;
} {
    const results = signal<T[]>([]);
    const loading = signal(false);
    const error = signal<Error | null>(null);

    const search = async (query: string): Promise<T[]> => {
        if (!query.trim()) {
            results.set([]);
            return [];
        }

        loading.set(true);
        error.set(null);

        try {
            const collection = db.collection(collectionName);
            const searchResults = await collection
                .find({
                    $text: {
                        $search: query,
                        $language: options?.language,
                        $caseSensitive: options?.caseSensitive,
                    },
                }, {
                    projection: { score: { $meta: 'textScore' } },
                })
                .sort({ score: { $meta: 'textScore' } })
                .toArray();

            batch(() => {
                results.set(searchResults);
                loading.set(false);
            });

            return searchResults;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    return { results, loading, error, search };
}

// ============================================================================
// GEOSPATIAL QUERIES
// ============================================================================

export interface GeoPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Use geospatial queries
 */
export function useGeoQuery<T extends { _id?: any }>(
    collectionName: string,
    locationField: string
): {
    data: Signal<T[]>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
    findNear: (point: GeoPoint, maxDistance: number) => Promise<T[]>;
    findWithin: (polygon: GeoPoint[]) => Promise<T[]>;
} {
    const data = signal<T[]>([]);
    const loading = signal(false);
    const error = signal<Error | null>(null);

    const findNear = async (point: GeoPoint, maxDistance: number): Promise<T[]> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = db.collection(collectionName);
            const results = await collection
                .find({
                    [locationField]: {
                        $near: {
                            $geometry: point,
                            $maxDistance: maxDistance,
                        },
                    },
                })
                .toArray();

            batch(() => {
                data.set(results);
                loading.set(false);
            });

            return results;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    const findWithin = async (polygon: GeoPoint[]): Promise<T[]> => {
        loading.set(true);
        error.set(null);

        try {
            const collection = db.collection(collectionName);
            const results = await collection
                .find({
                    [locationField]: {
                        $geoWithin: {
                            $geometry: {
                                type: 'Polygon',
                                coordinates: [polygon.map((p) => p.coordinates)],
                            },
                        },
                    },
                })
                .toArray();

            batch(() => {
                data.set(results);
                loading.set(false);
            });

            return results;
        } catch (e) {
            batch(() => {
                error.set(e as Error);
                loading.set(false);
            });
            throw e;
        }
    };

    return { data, loading, error, findNear, findWithin };
}

// ============================================================================
// GRIDFS (File Storage)
// ============================================================================

export interface GridFSFile {
    _id: any;
    filename: string;
    length: number;
    chunkSize: number;
    uploadDate: Date;
    metadata?: Record<string, any>;
}

/**
 * Use GridFS for file storage
 */
export function useGridFS(bucketName = 'fs'): {
    upload: (filename: string, data: Buffer | Uint8Array, metadata?: Record<string, any>) => Promise<any>;
    download: (id: string) => Promise<Buffer>;
    delete: (id: string) => Promise<void>;
    find: (filter?: Record<string, any>) => Promise<GridFSFile[]>;
    getReadStream: (id: string) => Promise<any>;
    getWriteStream: (filename: string, metadata?: Record<string, any>) => Promise<any>;
} {
    const getBucket = async () => {
        const { GridFSBucket } = await import('mongodb');
        return new GridFSBucket(db, { bucketName });
    };

    const upload = async (
        filename: string,
        data: Buffer | Uint8Array,
        metadata?: Record<string, any>
    ): Promise<any> => {
        const bucket = await getBucket();

        return new Promise((resolve, reject) => {
            const uploadStream = bucket.openUploadStream(filename, { metadata });

            uploadStream.on('finish', () => {
                resolve(uploadStream.id);
            });

            uploadStream.on('error', reject);

            uploadStream.end(data);
        });
    };

    const download = async (id: string): Promise<Buffer> => {
        const bucket = await getBucket();
        const { ObjectId } = await import('mongodb');

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const downloadStream = bucket.openDownloadStream(new ObjectId(id));

            downloadStream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            downloadStream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            downloadStream.on('error', reject);
        });
    };

    const deleteFile = async (id: string): Promise<void> => {
        const bucket = await getBucket();
        const { ObjectId } = await import('mongodb');
        await bucket.delete(new ObjectId(id));
    };

    const find = async (filter: Record<string, any> = {}): Promise<GridFSFile[]> => {
        const bucket = await getBucket();
        return bucket.find(filter).toArray();
    };

    const getReadStream = async (id: string): Promise<any> => {
        const bucket = await getBucket();
        const { ObjectId } = await import('mongodb');
        return bucket.openDownloadStream(new ObjectId(id));
    };

    const getWriteStream = async (filename: string, metadata?: Record<string, any>): Promise<any> => {
        const bucket = await getBucket();
        return bucket.openUploadStream(filename, { metadata });
    };

    return {
        upload,
        download,
        delete: deleteFile,
        find,
        getReadStream,
        getWriteStream,
    };
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clear query cache
 */
export function clearCache(pattern?: string | RegExp): void {
    if (!pattern) {
        queryCache.clear();
        return;
    }

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of queryCache.keys()) {
        if (regex.test(key)) {
            queryCache.delete(key);
        }
    }
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
    return {
        size: queryCache.size,
        keys: Array.from(queryCache.keys()),
    };
}

// ============================================================================
// SSR SUPPORT
// ============================================================================

export interface SSRDataLoader {
    preload: <T>(collectionName: string, filter?: Record<string, any>) => Promise<T[]>;
    getData: () => Record<string, any>;
    hydrate: (data: Record<string, any>) => void;
}

/**
 * Create SSR data loader
 */
export function createSSRDataLoader(): SSRDataLoader {
    const preloadedData: Record<string, any> = {};

    return {
        async preload<T>(collectionName: string, filter: Record<string, any> = {}): Promise<T[]> {
            const collection = db.collection(collectionName);
            const data = await collection.find(filter).toArray();
            const key = `${collectionName}:${JSON.stringify(filter)}`;
            preloadedData[key] = data;
            return data;
        },

        getData() {
            return { ...preloadedData };
        },

        hydrate(data: Record<string, any>) {
            for (const [key, value] of Object.entries(data)) {
                queryCache.set(key, { data: value, timestamp: Date.now() });
            }
        },
    };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create an ObjectId from a string
 */
export async function createObjectId(id?: string): Promise<any> {
    const { ObjectId } = await import('mongodb');
    return id ? new ObjectId(id) : new ObjectId();
}

/**
 * Check if a string is a valid ObjectId
 */
export async function isValidObjectId(id: string): Promise<boolean> {
    const { ObjectId } = await import('mongodb');
    return ObjectId.isValid(id);
}

/**
 * Convert document with ObjectId to JSON-safe format
 */
export function toJSON<T extends { _id?: any }>(doc: T): T & { _id: string } {
    if (!doc) return doc as any;
    return {
        ...doc,
        _id: doc._id?.toString?.() ?? doc._id,
    };
}

/**
 * Convert array of documents to JSON-safe format
 */
export function toJSONArray<T extends { _id?: any }>(docs: T[]): Array<T & { _id: string }> {
    return docs.map(toJSON);
}

// All functions are exported with their definitions above
