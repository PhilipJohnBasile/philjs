/**
 * Client-side RPC client for philjs-rpc.
 * Provides type-safe API calls with React Query-style hooks.
 */
import type { RPCRequest, RPCResponse, RPCError, BuildClientFromRouter, APIDefinition } from './types.js';
/**
 * Client configuration options.
 */
export interface ClientConfig {
    /** Base URL for API requests */
    url: string;
    /** Custom fetch implementation */
    fetch?: typeof fetch;
    /** Default headers */
    headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
    /** Request transformer */
    transformRequest?: (request: RPCRequest) => RPCRequest | Promise<RPCRequest>;
    /** Response transformer */
    transformResponse?: <T>(response: RPCResponse<T>) => RPCResponse<T>;
    /** Error handler */
    onError?: (error: RPCError) => void;
    /** Enable request batching */
    batching?: boolean;
    /** Batch window in milliseconds (for batching) */
    batchWindowMs?: number;
}
declare class QueryCache {
    private cache;
    private subscribers;
    get<T>(key: string): T | undefined;
    set<T>(key: string, data: T, staleTime: number): void;
    isStale(key: string): boolean;
    invalidate(key: string): void;
    invalidateAll(): void;
    subscribe(key: string, callback: () => void): () => void;
    private notify;
}
/**
 * Create a type-safe RPC client.
 *
 * @example
 * ```ts
 * import { createClient } from 'philjs-rpc/client';
 * import type { AppAPI } from './server/api';
 *
 * const client = createClient<AppAPI>({ url: '/api/rpc' });
 *
 * // Direct calls
 * const users = await client.users.list.fetch();
 * const user = await client.users.byId.fetch({ id: '123' });
 *
 * // Using hooks in components
 * function UsersList() {
 *   const users = client.users.list.useQuery();
 *
 *   if (users.isLoading) return <div>Loading...</div>;
 *   if (users.isError) return <div>Error: {users.error.message}</div>;
 *
 *   return (
 *     <ul>
 *       {users.data.map(user => (
 *         <li key={user.id}>{user.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export declare function createClient<TApi extends APIDefinition>(config: ClientConfig): BuildClientFromRouter<TApi['_router']>;
/**
 * Invalidate queries matching a path pattern.
 *
 * @example
 * ```ts
 * // After a mutation, invalidate related queries
 * const createUser = client.users.create.useMutation({
 *   onSuccess: () => {
 *     invalidateQueries('users');
 *   },
 * });
 * ```
 */
export declare function invalidateQueries(pathPattern: string): void;
/**
 * Prefetch a query to populate the cache.
 *
 * @example
 * ```ts
 * // Prefetch on hover
 * <button onMouseEnter={() => prefetchQuery(client.users.byId, { id: '123' })}>
 *   View User
 * </button>
 * ```
 */
export declare function prefetchQuery<TInput, TOutput>(procedure: {
    fetch: (input: TInput) => Promise<TOutput>;
}, input: TInput): Promise<void>;
/**
 * Get query cache instance for advanced usage.
 */
export declare function getQueryCache(): QueryCache;
export {};
//# sourceMappingURL=client.d.ts.map