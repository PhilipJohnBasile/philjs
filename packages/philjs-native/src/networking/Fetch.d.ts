/**
 * Enhanced Fetch API
 *
 * Fetch wrapper with interceptors, retries, and caching.
 */
import { type Signal } from 'philjs-core';
/**
 * Request interceptor
 */
export type RequestInterceptor = (config: FetchConfig) => FetchConfig | Promise<FetchConfig>;
/**
 * Response interceptor
 */
export type ResponseInterceptor = (response: Response, config: FetchConfig) => Response | Promise<Response>;
/**
 * Error interceptor
 */
export type ErrorInterceptor = (error: FetchError, config: FetchConfig) => Response | Promise<Response> | never;
/**
 * Fetch configuration
 */
export interface FetchConfig extends RequestInit {
    /**
     * Request URL
     */
    url: string;
    /**
     * Base URL to prepend
     */
    baseURL?: string;
    /**
     * Query parameters
     */
    params?: Record<string, string | number | boolean | undefined>;
    /**
     * Request timeout in ms
     */
    timeout?: number;
    /**
     * Number of retry attempts
     */
    retries?: number;
    /**
     * Delay between retries in ms
     */
    retryDelay?: number;
    /**
     * Retry only on specific status codes
     */
    retryOnStatus?: number[];
    /**
     * Whether to cache the response
     */
    cache?: RequestCache | false;
    /**
     * Cache duration in ms
     */
    cacheDuration?: number;
    /**
     * Response type
     */
    responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
    /**
     * Whether to include credentials
     */
    withCredentials?: boolean;
    /**
     * Progress callback for uploads
     */
    onUploadProgress?: (progress: ProgressEvent) => void;
    /**
     * Progress callback for downloads
     */
    onDownloadProgress?: (progress: ProgressEvent) => void;
    /**
     * Abort signal
     */
    signal?: AbortSignal;
    /**
     * Custom metadata
     */
    metadata?: Record<string, any>;
}
/**
 * Fetch error
 */
export declare class FetchError extends Error {
    status?: number | undefined;
    statusText?: string | undefined;
    response?: Response | undefined;
    config?: FetchConfig | undefined;
    constructor(message: string, status?: number | undefined, statusText?: string | undefined, response?: Response | undefined, config?: FetchConfig | undefined);
    /**
     * Whether this is a network error
     */
    get isNetworkError(): boolean;
    /**
     * Whether this is a timeout error
     */
    get isTimeoutError(): boolean;
    /**
     * Whether this is a client error (4xx)
     */
    get isClientError(): boolean;
    /**
     * Whether this is a server error (5xx)
     */
    get isServerError(): boolean;
}
/**
 * Response with typed data
 */
export interface TypedResponse<T = any> extends Response {
    data: T;
}
/**
 * Interceptors manager
 */
export declare const interceptors: {
    request: {
        use(interceptor: RequestInterceptor): number;
        eject(id: number): void;
        clear(): void;
    };
    response: {
        use(interceptor: ResponseInterceptor): number;
        eject(id: number): void;
        clear(): void;
    };
    error: {
        use(interceptor: ErrorInterceptor): number;
        eject(id: number): void;
        clear(): void;
    };
};
/**
 * Clear cache
 */
export declare function clearCache(): void;
/**
 * Enhanced fetch function
 */
export declare function enhancedFetch<T = any>(urlOrConfig: string | FetchConfig, options?: Partial<FetchConfig>): Promise<TypedResponse<T>>;
/**
 * GET request
 */
export declare function get<T = any>(url: string, config?: Partial<FetchConfig>): Promise<TypedResponse<T>>;
/**
 * POST request
 */
export declare function post<T = any>(url: string, data?: any, config?: Partial<FetchConfig>): Promise<TypedResponse<T>>;
/**
 * PUT request
 */
export declare function put<T = any>(url: string, data?: any, config?: Partial<FetchConfig>): Promise<TypedResponse<T>>;
/**
 * PATCH request
 */
export declare function patch<T = any>(url: string, data?: any, config?: Partial<FetchConfig>): Promise<TypedResponse<T>>;
/**
 * DELETE request
 */
export declare function del<T = any>(url: string, config?: Partial<FetchConfig>): Promise<TypedResponse<T>>;
/**
 * HEAD request
 */
export declare function head(url: string, config?: Partial<FetchConfig>): Promise<Response>;
/**
 * Create a fetch instance with default config
 */
export declare function createFetchInstance(instanceConfig: Partial<FetchConfig>): {
    fetch: typeof enhancedFetch;
    get: typeof get;
    post: typeof post;
    put: typeof put;
    patch: typeof patch;
    delete: typeof del;
    head: typeof head;
    interceptors: typeof interceptors;
};
/**
 * Fetch state
 */
export interface UseFetchState<T> {
    data: T | null;
    loading: boolean;
    error: FetchError | null;
}
/**
 * Hook for data fetching
 */
export declare function useFetch<T = any>(url: string, config?: Partial<FetchConfig>): {
    data: Signal<T | null>;
    loading: Signal<boolean>;
    error: Signal<FetchError | null>;
    refetch: () => Promise<void>;
};
/**
 * Create abort controller with timeout
 */
export declare function createAbortController(timeout?: number): {
    controller: AbortController;
    clear: () => void;
};
export declare const Fetch: {
    fetch: typeof enhancedFetch;
    get: typeof get;
    post: typeof post;
    put: typeof put;
    patch: typeof patch;
    delete: typeof del;
    head: typeof head;
    interceptors: {
        request: {
            use(interceptor: RequestInterceptor): number;
            eject(id: number): void;
            clear(): void;
        };
        response: {
            use(interceptor: ResponseInterceptor): number;
            eject(id: number): void;
            clear(): void;
        };
        error: {
            use(interceptor: ErrorInterceptor): number;
            eject(id: number): void;
            clear(): void;
        };
    };
    create: typeof createFetchInstance;
    clearCache: typeof clearCache;
    FetchError: typeof FetchError;
};
export default Fetch;
//# sourceMappingURL=Fetch.d.ts.map