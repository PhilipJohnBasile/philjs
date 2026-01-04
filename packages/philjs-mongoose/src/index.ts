/**
 * PhilJS Mongoose Adapter
 * 
 * MongoDB/Mongoose integration with PhilJS signals.
 */

import { signal, effect, type Signal } from '@philjs/core';
import type {
    Model,
    Document,
    FilterQuery,
    UpdateQuery,
    QueryOptions,
    Connection
} from 'mongoose';

// ============ CONTEXT ============

let connection: Connection | null = null;

export function setConnection(conn: Connection): void {
    connection = conn;
}

export function getConnection(): Connection {
    if (!connection) {
        throw new Error('Mongoose connection not initialized. Call setConnection() first.');
    }
    return connection;
}

// ============ HOOKS ============

export interface UseMongooseOptions<T> {
    initialData?: T[];
    refetchInterval?: number;
    populate?: string | string[];
}

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
) {
    const data = signal<T[]>(options.initialData || []);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const fetch = async () => {
        loading.set(true);
        error.set(null);

        try {
            let query = model.find(filter);

            if (options.populate) {
                query = query.populate(options.populate);
            }

            const result = await query.exec();
            data.set(result);
        } catch (e) {
            error.set(e as Error);
        } finally {
            loading.set(false);
        }
    };

    fetch();

    if (options.refetchInterval) {
        const interval = setInterval(fetch, options.refetchInterval);
        effect(() => () => clearInterval(interval));
    }

    return { data, loading, error, refetch: fetch };
}

/**
 * Use a single document by ID
 */
export function useMongooseById<T extends Document>(
    model: Model<T>,
    id: string,
    options: UseMongooseOptions<T> = {}
) {
    const data = signal<T | null>(null);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const fetch = async () => {
        loading.set(true);
        error.set(null);

        try {
            let query = model.findById(id);

            if (options.populate) {
                query = query.populate(options.populate);
            }

            const result = await query.exec();
            data.set(result);
        } catch (e) {
            error.set(e as Error);
        } finally {
            loading.set(false);
        }
    };

    fetch();

    return { data, loading, error, refetch: fetch };
}

// ============ MUTATIONS ============

export function useMongooseMutation<T extends Document>(model: Model<T>) {
    const loading = signal(false);
    const error = signal<Error | null>(null);

    const create = async (data: Partial<T>): Promise<T> => {
        loading.set(true);
        error.set(null);

        try {
            const doc = new model(data);
            const result = await doc.save();
            return result;
        } catch (e) {
            error.set(e as Error);
            throw e;
        } finally {
            loading.set(false);
        }
    };

    const update = async (
        id: string,
        update: UpdateQuery<T>,
        options: QueryOptions = {}
    ): Promise<T | null> => {
        loading.set(true);
        error.set(null);

        try {
            const result = await model.findByIdAndUpdate(id, update, {
                new: true,
                ...options
            }).exec();
            return result;
        } catch (e) {
            error.set(e as Error);
            throw e;
        } finally {
            loading.set(false);
        }
    };

    const remove = async (id: string): Promise<void> => {
        loading.set(true);
        error.set(null);

        try {
            await model.findByIdAndDelete(id).exec();
        } catch (e) {
            error.set(e as Error);
            throw e;
        } finally {
            loading.set(false);
        }
    };

    const upsert = async (
        filter: FilterQuery<T>,
        update: UpdateQuery<T>
    ): Promise<T | null> => {
        loading.set(true);
        error.set(null);

        try {
            const result = await model.findOneAndUpdate(filter, update, {
                upsert: true,
                new: true,
            }).exec();
            return result;
        } catch (e) {
            error.set(e as Error);
            throw e;
        } finally {
            loading.set(false);
        }
    };

    return { create, update, remove, upsert, loading, error };
}

// ============ AGGREGATION ============

export function useMongooseAggregate<T extends Document, R = any>(
    model: Model<T>,
    pipeline: any[]
) {
    const data = signal<R[]>([]);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const execute = async () => {
        loading.set(true);
        error.set(null);

        try {
            const result = await model.aggregate<R>(pipeline).exec();
            data.set(result);
        } catch (e) {
            error.set(e as Error);
        } finally {
            loading.set(false);
        }
    };

    execute();

    return { data, loading, error, refetch: execute };
}

// ============ REAL-TIME (Change Streams) ============

export function useMongooseWatch<T extends Document>(
    model: Model<T>,
    filter: FilterQuery<T> = {},
    onData: (data: T[]) => void
) {
    const data = signal<T[]>([]);

    // Initial fetch
    model.find(filter).exec().then(result => {
        data.set(result);
        onData(result);
    });

    // Watch for changes
    const changeStream = model.watch();

    changeStream.on('change', async () => {
        const result = await model.find(filter).exec();
        data.set(result);
        onData(result);
    });

    effect(() => () => {
        changeStream.close();
    });

    return { data };
}

export {
    useMongoose,
    useMongooseById,
    useMongooseMutation,
    useMongooseAggregate,
    useMongooseWatch,
    setConnection,
    getConnection,
};
