import { signal, effect, resource, type Signal, type Resource } from '@philjs/core';

/**
 * Hook to use Drizzle ORM with PhilJS signals
 * 
 * @example
 * ```ts
 * import { drizzle } from 'drizzle-orm/better-sqlite3';
 * import Database from 'better-sqlite3';
 * 
 * const sqlite = new Database('db.sqlite');
 * const db = drizzle(sqlite);
 * 
 * function UserList() {
 *   const { data, loading, error, refetch } = useDrizzle(db);
 *   
 *   const users = data(() => db.select().from(usersTable).all());
 *   
 *   if (loading()) return <div>Loading...</div>;
 *   if (error()) return <div>Error: {error().message}</div>;
 *   
 *   return (
 *     <ul>
 *       {users()?.map(user => <li>{user.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useDrizzle<TDatabase>(db: TDatabase) {
    const queryCache = new Map<string, Resource<any>>();

    /**
     * Execute a query and get reactive results
     */
    function query<T>(
        queryFn: () => T | Promise<T>,
        options?: { cacheKey?: string; refetchOnMount?: boolean }
    ): Resource<T> {
        const cacheKey = options?.cacheKey;

        if (cacheKey && queryCache.has(cacheKey)) {
            return queryCache.get(cacheKey)! as Resource<T>;
        }

        const queryResource = resource(async () => {
            const result = queryFn();
            return result instanceof Promise ? await result : result;
        });

        if (cacheKey) {
            queryCache.set(cacheKey, queryResource);
        }

        return queryResource;
    }

    /**
     * Execute a mutation (insert, update, delete)
     */
    function mutation<TInput, TOutput>(
        mutationFn: (input: TInput) => TOutput | Promise<TOutput>
    ) {
        const loading = signal(false);
        const error = signal<Error | null>(null);
        const data = signal<TOutput | null>(null);

        const mutate = async (input: TInput): Promise<TOutput> => {
            loading.set(true);
            error.set(null);

            try {
                const result = mutationFn(input);
                const resolved = result instanceof Promise ? await result : result;
                data.set(resolved);
                loading.set(false);
                return resolved;
            } catch (e) {
                const err = e instanceof Error ? e : new Error(String(e));
                error.set(err);
                loading.set(false);
                throw err;
            }
        };

        return {
            mutate,
            loading: () => loading(),
            error: () => error(),
            data: () => data(),
        };
    }

    /**
     * Clear the query cache
     */
    function invalidate(cacheKey?: string) {
        if (cacheKey) {
            const cached = queryCache.get(cacheKey);
            if (cached) {
                cached.refresh();
            }
        } else {
            // Invalidate all cached queries
            queryCache.forEach((resource) => resource.refresh());
        }
    }

    /**
     * Clear the entire cache
     */
    function clearCache() {
        queryCache.clear();
    }

    return {
        db,
        query,
        mutation,
        invalidate,
        clearCache,
    };
}

export type DrizzleHook<TDatabase> = ReturnType<typeof useDrizzle<TDatabase>>;
