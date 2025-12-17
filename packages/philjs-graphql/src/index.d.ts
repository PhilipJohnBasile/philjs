/**
 * PhilJS GraphQL Integration
 *
 * Provides GraphQL query and mutation support with:
 * - Type-safe queries and mutations
 * - Integration with PhilJS loaders and actions
 * - Automatic caching and deduplication
 * - Subscriptions support (coming soon)
 */
import type { Signal } from 'philjs-core';
import type { DocumentNode } from 'graphql';
export interface GraphQLClientConfig {
    /** GraphQL endpoint URL */
    endpoint: string;
    /** Optional headers to include with every request */
    headers?: Record<string, string>;
    /** Optional fetch implementation (defaults to globalThis.fetch) */
    fetch?: typeof fetch;
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
}
export interface GraphQLMutationOptions<TVariables = any> {
    /** GraphQL mutation document */
    mutation: string | DocumentNode;
    /** Mutation variables */
    variables?: TVariables;
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
/**
 * GraphQL Client for PhilJS
 */
export declare class GraphQLClient {
    private config;
    private cache;
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
     * Clear the query cache
     */
    clearCache(pattern?: string | RegExp): void;
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
    refetch: () => void;
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