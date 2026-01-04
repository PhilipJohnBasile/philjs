import { signal, effect, type Signal } from '@philjs/core';

export interface TransactionOptions {
    isolationLevel?: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable';
}

/**
 * Transaction wrapper for Drizzle with signal-based state tracking
 * 
 * @example
 * ```ts
 * const tx = useTransaction(db);
 * 
 * await tx.run(async (transaction) => {
 *   await transaction.insert(usersTable).values({ name: 'Alice' });
 *   await transaction.insert(ordersTable).values({ userId: 1, amount: 100 });
 * });
 * 
 * if (tx.error()) {
 *   console.error('Transaction failed:', tx.error());
 * }
 * ```
 */
export function useTransaction<TDatabase extends { transaction: Function }>(
    db: TDatabase,
    options?: TransactionOptions
) {
    const loading = signal(false);
    const error = signal<Error | null>(null);
    const success = signal(false);

    async function run<T>(
        callback: (tx: TDatabase) => T | Promise<T>
    ): Promise<T | undefined> {
        loading.set(true);
        error.set(null);
        success.set(false);

        try {
            const result = await db.transaction(callback);
            success.set(true);
            loading.set(false);
            return result;
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            error.set(err);
            success.set(false);
            loading.set(false);
            return undefined;
        }
    }

    return {
        run,
        loading: () => loading(),
        error: () => error(),
        success: () => success(),
        reset: () => {
            loading.set(false);
            error.set(null);
            success.set(false);
        },
    };
}

export type TransactionHook<TDatabase extends { transaction: Function }> = ReturnType<
    typeof useTransaction<TDatabase>
>;
