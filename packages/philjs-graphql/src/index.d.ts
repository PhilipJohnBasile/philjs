/**
 * PhilJS GraphQL Integration
 *
 * Provides GraphQL query and mutation support with:
 * - Type-safe queries and mutations
 * - Signal-based reactive caching
 * - Integration with PhilJS loaders and actions
 * - Automatic caching and deduplication
 * - GraphQL subscriptions over WebSocket
 * - Optimistic updates for mutations
 * - Advanced error handling with retry logic
 */
import type { Signal } from 'philjs-core';
import type { DocumentNode } from 'graphql';
export interface GraphQLClientConfig {
    /** GraphQL endpoint URL */
    endpoint: string;
    /** Optional WebSocket endpoint for subscriptions */
    subscriptionEndpoint?: string;
    /** Optional headers to include with every request */
    headers?: Record<string, string>;
    /** Optional fetch implementation (defaults to globalThis.fetch) */
    fetch?: typeof fetch;
    /** Enable signal-based reactive caching (default: true) */
    reactiveCache?: boolean;
    /** Default cache time-to-live in milliseconds (default: 5 minutes) */
    defaultCacheTTL?: number;
    /** Retry configuration */
    retry?: {
        /** Maximum number of retries (default: 3) */
        maxRetries?: number;
        /** Retry delay in milliseconds (default: 1000) */
        retryDelay?: number;
        /** Exponential backoff multiplier (default: 2) */
        backoffMultiplier?: number;
    };
}
export interface GraphQLQueryOptions<TVariables = any> {
    /** GraphQL query document */
    query: string | DocumentNode;
    /** Query variables */
    variables?: TVariables;
    /** Cache key override (defaults to query + variables hash) */
    cacheKey?: string;
    /** Disable caching for this query */
    noCache?: boolean;
    /** Cache time-to-live in milliseconds */
    cacheTTL?: number;
    /** Enable polling with interval in milliseconds */
    pollInterval?: number;
}
export interface GraphQLMutationOptions<TVariables = any> {
    /** GraphQL mutation document */
    mutation: string | DocumentNode;
    /** Mutation variables */
    variables?: TVariables;
    /** Optimistic response to update cache immediately */
    optimisticResponse?: any;
    /** Queries to refetch after mutation */
    refetchQueries?: Array<string | {
        query: string | DocumentNode;
        variables?: any;
    }>;
    /** Update function to manually update cache */
    update?: (cache: CacheStore, result: any) => void;
}
export interface GraphQLResponse<TData = any> {
    data?: TData;
    errors?: Array<{
        message: string;
        locations?: Array<{
            line: number;
            column: number;
        }>;
        path?: string[];
        extensions?: Record<string, any>;
    }>;
}
export interface GraphQLSubscriptionOptions<TVariables = any> {
    /** GraphQL subscription document */
    subscription: string | DocumentNode;
    /** Subscription variables */
    variables?: TVariables;
    /** Callback for subscription data */
    onData?: (data: any) => void;
    /** Callback for subscription errors */
    onError?: (error: Error) => void;
    /** Callback for subscription completion */
    onComplete?: () => void;
}
/**
 * Cache store interface for mutation updates
 */
export interface CacheStore {
    get<T>(key: string): Signal<GraphQLResponse<T> | null> | undefined;
    set<T>(key: string, data: GraphQLResponse<T>, ttl?: number): void;
    delete(key: string): void;
    clear(pattern?: string | RegExp): void;
}
/**
 * GraphQL Client for PhilJS
 */
export declare class GraphQLClient implements CacheStore {
    private config;
    private cache;
    private subscriptions;
    constructor(config: GraphQLClientConfig);
    /**
     * Execute a GraphQL query
     */
    query<TData = any, TVariables = any>(options: GraphQLQueryOptions<TVariables>): Promise<GraphQLResponse<TData>>;
    /**
     * Execute a GraphQL mutation
     */
    mutate<TData = any, TVariables = any>(options: GraphQLMutationOptions<TVariables>): Promise<GraphQLResponse<TData>>;
    /**
     * Subscribe to GraphQL subscription
     */
    subscribe<TData = any, TVariables = any>(options: GraphQLSubscriptionOptions<TVariables>): () => void;
    /**
     * Unsubscribe from a subscription
     */
    private unsubscribe;
    /**
     * Clear the query cache
     */
    clearCache(pattern?: string | RegExp): void;
    /**
     * Get cache entry (implements CacheStore)
     */
    get<T>(key: string): Signal<GraphQLResponse<T> | null> | undefined;
    /**
     * Set cache entry (implements CacheStore)
     */
    set<T>(key: string, data: GraphQLResponse<T>, ttl?: number): void;
    /**
     * Delete cache entry (implements CacheStore)
     */
    delete(key: string): void;
    /**
     * Execute the GraphQL request with retry logic
     */
    private executeRequestWithRetry;
    /**
     * Execute the GraphQL request
     */
    private executeRequest;
    /**
     * Convert DocumentNode to string if needed
     */
    private documentToString;
    /**
     * Generate cache key from query and variables
     */
    private generateCacheKey;
}
/**
 * Create a GraphQL client instance
 */
export declare function createGraphQLClient(config: GraphQLClientConfig): GraphQLClient;
/**
 * Create a reactive GraphQL query hook
 */
export declare function createQuery<TData = any, TVariables = any>(client: GraphQLClient, options: GraphQLQueryOptions<TVariables>): {
    data: Signal<TData | undefined>;
    error: Signal<Error | null>;
    loading: Signal<boolean>;
    retryCount: Signal<number>;
    refetch: () => void;
    startPolling: (interval: number) => void;
    stopPolling: () => void;
};
/**
 * Create a GraphQL mutation hook
 */
export declare function createMutation<TData = any, TVariables = any>(client: GraphQLClient, mutation: string | DocumentNode): {
    mutate: (variables?: TVariables) => Promise<TData | undefined>;
    data: Signal<TData | undefined>;
    error: Signal<Error | null>;
    loading: Signal<boolean>;
};
/**
 * Create a GraphQL loader for server-side data fetching
 */
export declare function createGraphQLLoader<TData = any, TVariables = any>(client: GraphQLClient, query: string | DocumentNode): import("philjs-ssr").Loader<TData | undefined>;
/**
 * Create a GraphQL action for mutations
 */
export declare function createGraphQLAction<TData = any, TVariables = any>(client: GraphQLClient, mutation: string | DocumentNode): import("philjs-ssr").Action<TData | undefined>;
/**
 * GraphQL utilities
 */
export declare const gql: (strings: TemplateStringsArray, ...values: any[]) => string;
export type { DocumentNode };
//# sourceMappingURL=index.d.ts.map