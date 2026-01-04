/**
 * PhilJS API Client
 *
 * Type-safe API client for calling PhilJS API routes.
 */
export interface APIClientOptions {
    /** Base URL for API calls */
    baseURL?: string;
    /** Default headers */
    headers?: Record<string, string>;
    /** Request timeout in ms */
    timeout?: number;
    /** Retry configuration */
    retry?: {
        count: number;
        delay: number;
    };
    /** Credentials mode */
    credentials?: RequestCredentials;
}
export interface FetchOptions extends RequestInit {
    /** Query parameters */
    query?: Record<string, string | number | boolean | undefined>;
    /** Request body (auto-serialized) */
    json?: unknown;
    /** Timeout in ms */
    timeout?: number;
}
/**
 * Create an API client
 */
export declare function createAPIClient(options?: APIClientOptions): {
    /** GET request */
    get<T>(endpoint: string, options?: FetchOptions): Promise<T>;
    /** POST request */
    post<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T>;
    /** PUT request */
    put<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T>;
    /** PATCH request */
    patch<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T>;
    /** DELETE request */
    delete<T>(endpoint: string, options?: FetchOptions): Promise<T>;
    /** Raw request */
    request: <T>(endpoint: string, fetchOptions?: FetchOptions) => Promise<T>;
};
/**
 * Default API client instance
 */
export declare const apiClient: {
    /** GET request */
    get<T>(endpoint: string, options?: FetchOptions): Promise<T>;
    /** POST request */
    post<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T>;
    /** PUT request */
    put<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T>;
    /** PATCH request */
    patch<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T>;
    /** DELETE request */
    delete<T>(endpoint: string, options?: FetchOptions): Promise<T>;
    /** Raw request */
    request: <T>(endpoint: string, fetchOptions?: FetchOptions) => Promise<T>;
};
/**
 * API Error class
 */
export declare class APIError extends Error {
    status: number;
    data: unknown;
    constructor(message: string, status: number, data?: unknown);
}
/**
 * Hook for fetching data (works with PhilJS signals)
 */
export declare function useFetch<T>(endpoint: string | (() => string | null), options?: FetchOptions & {
    immediate?: boolean;
}): {
    readonly data: T | null;
    readonly error: Error | null;
    readonly loading: boolean;
    execute: () => Promise<T | null>;
    refetch: () => Promise<T | null>;
};
/**
 * Hook for mutations
 */
export declare function useMutation<TData, TVariables>(mutationFn: (variables: TVariables) => Promise<TData>): {
    readonly data: TData | null;
    readonly error: Error | null;
    readonly loading: boolean;
    mutate: (variables: TVariables) => Promise<TData | null>;
    reset: () => void;
};
//# sourceMappingURL=client.d.ts.map