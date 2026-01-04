import { signal, effect, type Signal } from '@philjs/core';

export interface QueryBuilderOptions {
    /** Enable query logging */
    debug?: boolean;
    /** Query timeout in milliseconds */
    timeout?: number;
}

/**
 * Reactive query builder wrapper
 * Tracks query state with signals
 */
export function createQueryBuilder<TDatabase>(
    db: TDatabase,
    options?: QueryBuilderOptions
) {
    const queryCount = signal(0);
    const lastQuery = signal<string | null>(null);
    const lastQueryTime = signal<number | null>(null);

    /**
     * Wrap a query with tracking
     */
    function tracked<T>(queryFn: () => T | Promise<T>, queryName?: string): Promise<T> {
        const startTime = performance.now();

        if (options?.debug) {
            console.log(`[Drizzle] Executing query: ${queryName || 'anonymous'}`);
        }

        return Promise.resolve(queryFn()).then((result) => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            queryCount.set(queryCount() + 1);
            lastQuery.set(queryName || null);
            lastQueryTime.set(duration);

            if (options?.debug) {
                console.log(`[Drizzle] Query completed in ${duration.toFixed(2)}ms`);
            }

            return result;
        });
    }

    /**
     * Get query statistics
     */
    function getStats() {
        return {
            totalQueries: queryCount(),
            lastQuery: lastQuery(),
            lastQueryTime: lastQueryTime(),
        };
    }

    /**
     * Reset query statistics
     */
    function resetStats() {
        queryCount.set(0);
        lastQuery.set(null);
        lastQueryTime.set(null);
    }

    return {
        db,
        tracked,
        getStats,
        resetStats,
        queryCount: () => queryCount(),
        lastQueryTime: () => lastQueryTime(),
    };
}

export type QueryBuilder<TDatabase> = ReturnType<typeof createQueryBuilder<TDatabase>>;
