/**
 * @philjs/trpc - Client utilities
 * Type-safe RPC client - framework agnostic
 */
import type { ClientConfig, BatchConfig, SubscriptionCallbacks } from '../types.js';
/**
 * Create a type-safe RPC client
 */
export declare function createClient<TRouter>(config: ClientConfig): {
    /**
     * Call a query procedure
     */
    query<TInput, TOutput>(path: string, input?: TInput): Promise<TOutput>;
    /**
     * Call a mutation procedure
     */
    mutate<TInput, TOutput>(path: string, input?: TInput): Promise<TOutput>;
    /**
     * Subscribe to a procedure (WebSocket)
     */
    subscribe<TInput, TOutput>(path: string, input: TInput, callbacks: SubscriptionCallbacks<TOutput>): {
        unsubscribe: () => void;
    };
};
/**
 * Create a batched client
 */
export declare function createBatchedClient<TRouter>(config: ClientConfig & {
    batch?: BatchConfig;
}): {
    query: <TInput, TOutput>(path: string, input?: TInput) => Promise<TOutput>;
    mutate: <TInput, TOutput>(path: string, input?: TInput) => Promise<TOutput>;
    flush: () => Promise<void>;
};
/**
 * Simple cache for queries
 */
export declare function createQueryCache(options?: {
    ttl?: number;
}): {
    get<T>(key: string): T | undefined;
    set<T>(key: string, data: T): void;
    invalidate(key: string): void;
    invalidateAll(): void;
    has(key: string): boolean;
};
/**
 * Create a cached query function
 */
export declare function createCachedQuery<TInput, TOutput>(queryFn: (input: TInput) => Promise<TOutput>, options?: {
    ttl?: number;
    keyFn?: (input: TInput) => string;
}): (input: TInput) => Promise<TOutput>;
//# sourceMappingURL=index.d.ts.map