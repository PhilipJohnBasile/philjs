/**
 * PhilJS TypeORM Adapter
 * 
 * TypeORM integration with PhilJS signals.
 */

import { signal, effect, memo, type Signal } from '@philjs/core';
import type {
    DataSource,
    Repository,
    EntityTarget,
    FindOptionsWhere,
    FindManyOptions,
    DeepPartial,
    ObjectLiteral
} from 'typeorm';

// ============ CONTEXT ============

let dataSource: DataSource | null = null;

export function setDataSource(ds: DataSource): void {
    dataSource = ds;
}

export function getDataSource(): DataSource {
    if (!dataSource) {
        throw new Error('DataSource not initialized. Call setDataSource() first.');
    }
    return dataSource;
}

// ============ HOOKS ============

export interface UseTypeORMOptions<T> {
    /** Initial data while loading */
    initialData?: T[];
    /** Auto-refetch interval in ms */
    refetchInterval?: number;
    /** Enable real-time updates */
    subscribe?: boolean;
}

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
) {
    const data = signal<T[]>(hookOptions.initialData || []);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const repository = getDataSource().getRepository(entity);

    const fetch = async () => {
        loading.set(true);
        error.set(null);

        try {
            const result = await repository.find(options);
            data.set(result);
        } catch (e) {
            error.set(e as Error);
        } finally {
            loading.set(false);
        }
    };

    // Initial fetch
    fetch();

    // Refetch interval
    if (hookOptions.refetchInterval) {
        const interval = setInterval(fetch, hookOptions.refetchInterval);
        effect(() => () => clearInterval(interval));
    }

    return {
        data,
        loading,
        error,
        refetch: fetch,
        repository,
    };
}

/**
 * Use a single entity by ID
 */
export function useTypeORMOne<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    id: string | number,
    options: FindManyOptions<T> = {}
) {
    const data = signal<T | null>(null);
    const loading = signal(true);
    const error = signal<Error | null>(null);

    const repository = getDataSource().getRepository(entity);

    const fetch = async () => {
        loading.set(true);
        error.set(null);

        try {
            const result = await repository.findOne({
                ...options,
                where: { id } as any,
            });
            data.set(result);
        } catch (e) {
            error.set(e as Error);
        } finally {
            loading.set(false);
        }
    };

    fetch();

    return { data, loading, error, refetch: fetch, repository };
}

// ============ MUTATIONS ============

/**
 * Create, update, delete mutations
 */
export function useTypeORMMutation<T extends ObjectLiteral>(entity: EntityTarget<T>) {
    const loading = signal(false);
    const error = signal<Error | null>(null);

    const repository = getDataSource().getRepository(entity);

    const create = async (data: DeepPartial<T>): Promise<T> => {
        loading.set(true);
        error.set(null);

        try {
            const instance = repository.create(data);
            const result = await repository.save(instance);
            return result;
        } catch (e) {
            error.set(e as Error);
            throw e;
        } finally {
            loading.set(false);
        }
    };

    const update = async (id: string | number, data: DeepPartial<T>): Promise<T | null> => {
        loading.set(true);
        error.set(null);

        try {
            await repository.update(id, data as any);
            return repository.findOneBy({ id } as any);
        } catch (e) {
            error.set(e as Error);
            throw e;
        } finally {
            loading.set(false);
        }
    };

    const remove = async (id: string | number): Promise<void> => {
        loading.set(true);
        error.set(null);

        try {
            await repository.delete(id);
        } catch (e) {
            error.set(e as Error);
            throw e;
        } finally {
            loading.set(false);
        }
    };

    return { create, update, remove, loading, error };
}

// ============ QUERY BUILDER ============

/**
 * Signal-aware query builder
 */
export function createQueryBuilder<T extends ObjectLiteral>(entity: EntityTarget<T>) {
    const repository = getDataSource().getRepository(entity);

    return {
        findMany: (options: FindManyOptions<T> = {}) => {
            const result = signal<T[]>([]);
            const loading = signal(true);

            repository.find(options).then(data => {
                result.set(data);
                loading.set(false);
            });

            return { data: result, loading };
        },

        findOne: (where: FindOptionsWhere<T>) => {
            const result = signal<T | null>(null);
            const loading = signal(true);

            repository.findOneBy(where).then(data => {
                result.set(data);
                loading.set(false);
            });

            return { data: result, loading };
        },

        count: (options: FindManyOptions<T> = {}) => {
            const result = signal(0);

            repository.count(options).then(count => result.set(count));

            return result;
        },
    };
}

// ============ TRANSACTIONS ============

export async function useTransaction<T>(
    callback: (manager: ReturnType<DataSource['createEntityManager']>) => Promise<T>
): Promise<T> {
    return getDataSource().transaction(callback);
}

export {
    useTypeORM,
    useTypeORMOne,
    useTypeORMMutation,
    createQueryBuilder,
    useTransaction,
    setDataSource,
    getDataSource,
};
