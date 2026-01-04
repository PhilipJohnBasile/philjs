/**
 * tRPC-style links for philjs-rpc.
 * Provides composable request/response transformations and routing.
 */
import type { ProcedureType } from './types.js';
export interface Operation {
    /** Unique operation ID */
    id: string;
    /** Procedure type */
    type: ProcedureType | 'subscription';
    /** Procedure path */
    path: string;
    /** Input data */
    input?: unknown;
    /** Request context */
    context?: Record<string, unknown>;
}
export interface OperationResult<TData = unknown> {
    /** Result data */
    data?: TData;
    /** Error */
    error?: {
        code: string;
        message: string;
        data?: unknown;
    };
}
export type LinkFn = (options: {
    op: Operation;
    next: (op: Operation) => Promise<OperationResult>;
}) => Promise<OperationResult>;
export interface Link {
    (options: {
        op: Operation;
        next: (op: Operation) => Promise<OperationResult>;
    }): Promise<OperationResult>;
}
export interface HttpLinkOptions {
    /** API endpoint URL */
    url: string;
    /** Custom fetch implementation */
    fetch?: typeof fetch;
    /** Custom headers */
    headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
    /** Request transformer */
    transformRequest?: (op: Operation) => Operation | Promise<Operation>;
    /** Response transformer */
    transformResponse?: <T>(result: OperationResult<T>) => OperationResult<T>;
}
/**
 * Create an HTTP link for queries and mutations.
 *
 * @example
 * ```ts
 * const httpLink = createHttpLink({
 *   url: '/api/rpc',
 *   headers: () => ({
 *     'Authorization': `Bearer ${getToken()}`,
 *   }),
 * });
 * ```
 */
export declare function createHttpLink(options: HttpLinkOptions): Link;
export interface WebSocketLinkOptions {
    /** WebSocket URL */
    url: string;
    /** Custom WebSocket implementation */
    WebSocket?: typeof WebSocket;
    /** Reconnection options */
    reconnect?: {
        enabled?: boolean;
        maxAttempts?: number;
        delay?: number;
    };
}
/**
 * Create a WebSocket link for subscriptions.
 *
 * @example
 * ```ts
 * const wsLink = createWebSocketLink({
 *   url: 'ws://localhost:3000/api/rpc',
 * });
 * ```
 */
export declare function createWebSocketLink(options: WebSocketLinkOptions): Link;
export interface SplitLinkOptions {
    /** Condition to determine which link to use */
    condition: (op: Operation) => boolean;
    /** Link to use if condition is true */
    true: Link;
    /** Link to use if condition is false */
    false: Link;
}
/**
 * Create a split link to route operations based on a condition.
 *
 * @example
 * ```ts
 * const link = createSplitLink({
 *   condition: (op) => op.type === 'subscription',
 *   true: wsLink,
 *   false: httpLink,
 * });
 * ```
 */
export declare function createSplitLink(options: SplitLinkOptions): Link;
export interface BatchLinkOptions {
    /** Maximum batch size */
    maxBatchSize?: number;
    /** Batch window in milliseconds */
    batchWindowMs?: number;
    /** HTTP link for batched requests */
    httpLink: Link;
}
/**
 * Create a batch link to batch multiple operations into one request.
 *
 * @example
 * ```ts
 * const batchLink = createBatchLink({
 *   maxBatchSize: 10,
 *   batchWindowMs: 10,
 *   httpLink: createHttpLink({ url: '/api/rpc' }),
 * });
 * ```
 */
export declare function createBatchLink(options: BatchLinkOptions): Link;
export interface DeduplicationLinkOptions {
    /** Get deduplication key from operation */
    getKey?: (op: Operation) => string;
}
/**
 * Create a deduplication link to prevent duplicate in-flight requests.
 *
 * @example
 * ```ts
 * const dedupeLink = createDeduplicationLink();
 * ```
 */
export declare function createDeduplicationLink(options?: DeduplicationLinkOptions): Link;
export interface RetryLinkOptions {
    /** Maximum number of retry attempts */
    maxAttempts?: number;
    /** Delay between retries in milliseconds */
    retryDelay?: number;
    /** Backoff multiplier */
    backoffMultiplier?: number;
    /** Maximum delay between retries */
    maxDelay?: number;
    /** Condition to determine if operation should be retried */
    shouldRetry?: (error: OperationResult['error'], attempt: number) => boolean;
}
/**
 * Create a retry link to automatically retry failed operations.
 *
 * @example
 * ```ts
 * const retryLink = createRetryLink({
 *   maxAttempts: 3,
 *   retryDelay: 1000,
 *   shouldRetry: (error) => error?.code === 'TIMEOUT',
 * });
 * ```
 */
export declare function createRetryLink(options?: RetryLinkOptions): Link;
export interface LoggingLinkOptions {
    /** Enable logging */
    enabled?: boolean;
    /** Custom logger */
    logger?: {
        log: (...args: any[]) => void;
        error: (...args: any[]) => void;
    };
    /** Log request */
    logRequest?: boolean;
    /** Log response */
    logResponse?: boolean;
    /** Log timing */
    logTiming?: boolean;
}
/**
 * Create a logging link to log operations and results.
 *
 * @example
 * ```ts
 * const loggingLink = createLoggingLink({
 *   enabled: process.env.NODE_ENV === 'development',
 * });
 * ```
 */
export declare function createLoggingLink(options?: LoggingLinkOptions): Link;
/**
 * Compose multiple links into a chain.
 *
 * @example
 * ```ts
 * const link = createLinkChain([
 *   loggingLink,
 *   retryLink,
 *   dedupeLink,
 *   splitLink,
 * ]);
 * ```
 */
export declare function createLinkChain(links: Link[]): Link;
/**
 * Create a terminating link that ends the link chain.
 * This is useful for testing or custom implementations.
 *
 * @example
 * ```ts
 * const terminatingLink = createTerminatingLink(async (op) => {
 *   // Custom operation handling
 *   return { data: 'result' };
 * });
 * ```
 */
export declare function createTerminatingLink(handler: (op: Operation) => Promise<OperationResult>): Link;
//# sourceMappingURL=links.d.ts.map