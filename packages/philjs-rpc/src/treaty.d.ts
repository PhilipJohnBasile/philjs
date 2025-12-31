/**
 * Eden Treaty-style type-safe client for philjs-rpc.
 * Provides a proxy-based API with full type inference from the server.
 *
 * @example
 * ```ts
 * import { treaty } from 'philjs-rpc/treaty';
 * import type { AppAPI } from './server/api';
 *
 * const api = treaty<AppAPI>('http://localhost:3000/api');
 *
 * // Full type safety and autocompletion
 * const users = await api.users.list.get();
 * const user = await api.users({ id: '123' }).get();
 * const created = await api.users.post({ name: 'John', email: 'john@example.com' });
 * ```
 */
import type { Router, ProcedureDefinition, ProcedureType, APIDefinition } from './types.js';
/**
 * Extract path parameters from a path string.
 * Examples:
 * - "/users/:id" => { id: string }
 * - "/posts/:postId/comments/:commentId" => { postId: string, commentId: string }
 */
export type ExtractPathParams<T extends string> = T extends `${infer _Start}:${infer Param}/${infer Rest}` ? {
    [K in Param | keyof ExtractPathParams<Rest>]: string;
} : T extends `${infer _Start}:${infer Param}` ? {
    [K in Param]: string;
} : {};
/**
 * Extract query parameter types from a procedure's input schema.
 */
export type ExtractQueryParams<TInput> = TInput extends {
    query?: infer Q;
} ? Q : TInput extends void ? never : TInput;
/**
 * Extract request body types from a procedure's input schema.
 */
export type ExtractBodyParams<TInput> = TInput extends {
    body?: infer B;
} ? B : TInput extends void ? never : TInput;
/**
 * Extract response type from a procedure.
 */
export type ExtractResponse<TProcedure> = TProcedure extends ProcedureDefinition<ProcedureType, unknown, infer TOutput, unknown> ? TOutput : never;
/**
 * Extract input type from a procedure.
 */
export type ExtractInput<TProcedure> = TProcedure extends ProcedureDefinition<ProcedureType, infer TInput, unknown, unknown> ? TInput : never;
/**
 * Determine if input is required (not void or undefined).
 */
export type IsInputRequired<TInput> = TInput extends void ? false : TInput extends undefined ? false : true;
/**
 * Request options for treaty calls.
 */
export interface TreatyRequestOptions {
    /** Request headers */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** AbortSignal for request cancellation */
    signal?: AbortSignal;
    /** Retry configuration */
    retry?: {
        /** Number of retry attempts */
        count?: number;
        /** Delay between retries in milliseconds */
        delay?: number;
        /** Exponential backoff multiplier */
        backoff?: number;
        /** Retry only on specific status codes */
        statusCodes?: number[];
    };
    /** Upload/download progress callback */
    onProgress?: (progress: ProgressEvent) => void;
    /** Custom fetch implementation */
    fetch?: typeof fetch;
}
/**
 * Treaty client configuration.
 */
export interface TreatyConfig {
    /** Base URL for API requests */
    baseUrl: string;
    /** Default request options */
    defaults?: TreatyRequestOptions;
    /** Request interceptor - called before each request */
    onRequest?: (config: TreatyRequestConfig) => TreatyRequestConfig | Promise<TreatyRequestConfig>;
    /** Response interceptor - called after each successful response */
    onResponse?: <T>(response: T, config: TreatyRequestConfig) => T | Promise<T>;
    /** Error interceptor - called on request errors */
    onError?: (error: TreatyError, config: TreatyRequestConfig) => void | Promise<void>;
    /** Custom fetch implementation */
    fetch?: typeof fetch;
}
/**
 * Request configuration passed to interceptors.
 */
export interface TreatyRequestConfig {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
    timeout?: number;
}
/**
 * Treaty error with additional context.
 */
export declare class TreatyError extends Error {
    readonly code: string;
    readonly status: number | undefined;
    readonly response: unknown | undefined;
    readonly config: TreatyRequestConfig;
    constructor(opts: {
        code: string;
        message: string;
        status?: number;
        response?: unknown;
        config: TreatyRequestConfig;
    });
}
/**
 * HTTP methods supported by treaty.
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';
/**
 * Treaty method definition for procedures.
 */
export interface TreatyMethod<TInput, TOutput> {
    /**
     * Execute the request.
     */
    (input: TInput, options?: TreatyRequestOptions): Promise<TOutput>;
    /**
     * Execute GET request.
     */
    get: IsInputRequired<TInput> extends true ? (input: TInput, options?: TreatyRequestOptions) => Promise<TOutput> : (options?: TreatyRequestOptions) => Promise<TOutput>;
    /**
     * Execute POST request.
     */
    post: IsInputRequired<TInput> extends true ? (input: TInput, options?: TreatyRequestOptions) => Promise<TOutput> : (options?: TreatyRequestOptions) => Promise<TOutput>;
    /**
     * Execute PUT request.
     */
    put: IsInputRequired<TInput> extends true ? (input: TInput, options?: TreatyRequestOptions) => Promise<TOutput> : (options?: TreatyRequestOptions) => Promise<TOutput>;
    /**
     * Execute PATCH request.
     */
    patch: IsInputRequired<TInput> extends true ? (input: TInput, options?: TreatyRequestOptions) => Promise<TOutput> : (options?: TreatyRequestOptions) => Promise<TOutput>;
    /**
     * Execute DELETE request.
     */
    delete: IsInputRequired<TInput> extends true ? (input: TInput, options?: TreatyRequestOptions) => Promise<TOutput> : (options?: TreatyRequestOptions) => Promise<TOutput>;
}
/**
 * WebSocket connection options.
 */
export interface WebSocketOptions {
    /** Protocols to use */
    protocols?: string | string[];
    /** Reconnect automatically on disconnect */
    autoReconnect?: boolean;
    /** Reconnect delay in milliseconds */
    reconnectDelay?: number;
    /** Maximum reconnect attempts */
    maxReconnectAttempts?: number;
}
/**
 * WebSocket message handler.
 */
export interface WebSocketHandler<TMessage = unknown> {
    /** Called when connection opens */
    onOpen?: (event: Event) => void;
    /** Called when message is received */
    onMessage?: (data: TMessage) => void;
    /** Called when error occurs */
    onError?: (error: Event) => void;
    /** Called when connection closes */
    onClose?: (event: CloseEvent) => void;
}
/**
 * WebSocket connection.
 */
export interface TreatyWebSocket<TMessage = unknown, TSend = unknown> {
    /** Send message */
    send: (data: TSend) => void;
    /** Close connection */
    close: (code?: number, reason?: string) => void;
    /** Current connection state */
    readyState: number;
    /** Add event listener */
    addEventListener: WebSocket['addEventListener'];
    /** Remove event listener */
    removeEventListener: WebSocket['removeEventListener'];
}
/**
 * Build treaty client type from router.
 */
export type BuildTreatyClient<TRouter extends Router, TPath extends string = ''> = {
    [K in keyof TRouter]: TRouter[K] extends ProcedureDefinition<infer _TType, infer TInput, infer TOutput, unknown> ? TreatyMethod<TInput, TOutput> : TRouter[K] extends Router ? BuildTreatyClient<TRouter[K], TPath extends '' ? K & string : `${TPath}.${K & string}`> & {
        /**
         * Call with path parameters.
         */
        (params: Record<string, string | number>): BuildTreatyClient<TRouter[K], TPath extends '' ? K & string : `${TPath}.${K & string}`>;
    } : never;
};
/**
 * Create a treaty client for type-safe API calls.
 *
 * @example
 * ```ts
 * import { treaty } from 'philjs-rpc/treaty';
 * import type { AppAPI } from './server/api';
 *
 * const api = treaty<AppAPI>('http://localhost:3000/api');
 *
 * // GET request
 * const users = await api.users.list.get();
 *
 * // POST request with body
 * const user = await api.users.post({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 * });
 *
 * // Path parameters
 * const user = await api.users({ id: '123' }).get();
 *
 * // With options
 * const users = await api.users.list.get({
 *   headers: { 'Authorization': 'Bearer token' },
 *   timeout: 5000,
 *   retry: { count: 3 },
 * });
 * ```
 */
export declare function treaty<TApi extends APIDefinition>(baseUrl: string, config?: Omit<TreatyConfig, 'baseUrl'>): BuildTreatyClient<TApi['_router']>;
/**
 * Create a treaty client with additional utilities.
 *
 * @example
 * ```ts
 * const { client, utils } = createTreatyClient<AppAPI>({
 *   baseUrl: 'http://localhost:3000/api',
 *   onRequest: async (config) => {
 *     // Add auth token
 *     config.headers['Authorization'] = `Bearer ${getToken()}`;
 *     return config;
 *   },
 * });
 * ```
 */
export declare function createTreatyClient<TApi extends APIDefinition>(config: TreatyConfig): {
    client: BuildTreatyClient<TApi["_router"], "">;
    utils: {
        /**
         * Create a batch request.
         */
        batch: <T extends readonly unknown[]>(requests: { [K in keyof T]: () => Promise<T[K]>; }) => Promise<T>;
        /**
         * Create a custom request.
         */
        request: <TResponse>(path: string, options?: {
            method?: string;
            body?: unknown;
            headers?: Record<string, string>;
        } & TreatyRequestOptions) => Promise<TResponse>;
    };
};
/**
 * Helper to infer the client type from an API.
 */
export type InferTreatyClient<TApi extends APIDefinition> = BuildTreatyClient<TApi['_router']>;
//# sourceMappingURL=treaty.d.ts.map