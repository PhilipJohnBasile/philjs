// @ts-nocheck
/**
 * Enhanced Fetch API
 *
 * Fetch wrapper with interceptors, retries, and caching.
 */

import { signal, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
import { NetInfo } from './NetInfo.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Request interceptor
 */
export type RequestInterceptor = (
  config: FetchConfig
) => FetchConfig | Promise<FetchConfig>;

/**
 * Response interceptor
 */
export type ResponseInterceptor = (
  response: Response,
  config: FetchConfig
) => Response | Promise<Response>;

/**
 * Error interceptor
 */
export type ErrorInterceptor = (
  error: FetchError,
  config: FetchConfig
) => Response | Promise<Response> | never;

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
export class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public response?: Response,
    public config?: FetchConfig
  ) {
    super(message);
    this.name = 'FetchError';
  }

  /**
   * Whether this is a network error
   */
  get isNetworkError(): boolean {
    return this.status === undefined;
  }

  /**
   * Whether this is a timeout error
   */
  get isTimeoutError(): boolean {
    return this.message === 'Request timeout';
  }

  /**
   * Whether this is a client error (4xx)
   */
  get isClientError(): boolean {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }

  /**
   * Whether this is a server error (5xx)
   */
  get isServerError(): boolean {
    return this.status !== undefined && this.status >= 500;
  }
}

/**
 * Response with typed data
 */
export interface TypedResponse<T = any> extends Response {
  data: T;
}

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: Partial<FetchConfig> = {
  timeout: 30000,
  retries: 0,
  retryDelay: 1000,
  retryOnStatus: [408, 429, 500, 502, 503, 504],
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json',
  },
};

// ============================================================================
// Interceptor Registry
// ============================================================================

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];
const errorInterceptors: ErrorInterceptor[] = [];

/**
 * Interceptors manager
 */
export const interceptors = {
  request: {
    use(interceptor: RequestInterceptor): number {
      return requestInterceptors.push(interceptor) - 1;
    },
    eject(id: number): void {
      requestInterceptors.splice(id, 1);
    },
    clear(): void {
      requestInterceptors.length = 0;
    },
  },
  response: {
    use(interceptor: ResponseInterceptor): number {
      return responseInterceptors.push(interceptor) - 1;
    },
    eject(id: number): void {
      responseInterceptors.splice(id, 1);
    },
    clear(): void {
      responseInterceptors.length = 0;
    },
  },
  error: {
    use(interceptor: ErrorInterceptor): number {
      return errorInterceptors.push(interceptor) - 1;
    },
    eject(id: number): void {
      errorInterceptors.splice(id, 1);
    },
    clear(): void {
      errorInterceptors.length = 0;
    },
  },
};

// ============================================================================
// Response Cache
// ============================================================================

interface CacheEntry {
  response: Response;
  data: any;
  timestamp: number;
  duration: number;
}

const responseCache = new Map<string, CacheEntry>();

/**
 * Get cache key for a request
 */
function getCacheKey(config: FetchConfig): string {
  const url = buildURL(config);
  return `${config.method || 'GET'}:${url}`;
}

/**
 * Get cached response if valid
 */
function getCachedResponse(key: string): CacheEntry | null {
  const entry = responseCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.duration) {
    responseCache.delete(key);
    return null;
  }

  return entry;
}

/**
 * Cache a response
 */
function cacheResponse(key: string, response: Response, data: any, duration: number): void {
  responseCache.set(key, {
    response: response.clone(),
    data,
    timestamp: Date.now(),
    duration,
  });
}

/**
 * Clear cache
 */
export function clearCache(): void {
  responseCache.clear();
}

// ============================================================================
// URL Building
// ============================================================================

/**
 * Build full URL with params
 */
function buildURL(config: FetchConfig): string {
  let url = config.url;

  // Prepend base URL
  if (config.baseURL && !url.startsWith('http')) {
    url = `${config.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }

  // Add query params
  if (config.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(config.params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  return url;
}

// ============================================================================
// Core Fetch Function
// ============================================================================

/**
 * Enhanced fetch function
 */
export async function enhancedFetch<T = any>(
  urlOrConfig: string | FetchConfig,
  options?: Partial<FetchConfig>
): Promise<TypedResponse<T>> {
  // Normalize config
  let config: FetchConfig = typeof urlOrConfig === 'string'
    ? { ...defaultConfig, url: urlOrConfig, ...options }
    : { ...defaultConfig, ...urlOrConfig };

  // Run request interceptors
  for (const interceptor of requestInterceptors) {
    config = await interceptor(config);
  }

  // Check cache for GET requests
  if (config.cache !== false && (!config.method || config.method === 'GET')) {
    const cacheKey = getCacheKey(config);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      const response = cached.response.clone() as TypedResponse<T>;
      response.data = cached.data;
      return response;
    }
  }

  // Build URL
  const url = buildURL(config);

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    method: config.method || 'GET',
    headers: config.headers,
    body: config.body,
    credentials: config.withCredentials ? 'include' : config.credentials,
    signal: config.signal,
    cache: config.cache || undefined,
    mode: config.mode,
    redirect: config.redirect,
    referrer: config.referrer,
    referrerPolicy: config.referrerPolicy,
    integrity: config.integrity,
  };

  // Serialize body if needed
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(config.body);
  }

  // Create timeout controller
  const timeoutController = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  if (config.timeout) {
    timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, config.timeout);
  }

  // Combine abort signals
  if (config.signal) {
    config.signal.addEventListener('abort', () => {
      timeoutController.abort();
    });
  }
  fetchOptions.signal = timeoutController.signal;

  // Retry logic
  let lastError: FetchError | null = null;
  const maxAttempts = (config.retries || 0) + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Check for retry on status
      if (
        !response.ok &&
        attempt < maxAttempts &&
        config.retryOnStatus?.includes(response.status)
      ) {
        await delay(config.retryDelay || 1000);
        continue;
      }

      // Parse response
      let data: T;
      switch (config.responseType) {
        case 'text':
          data = await response.text() as unknown as T;
          break;
        case 'blob':
          data = await response.blob() as unknown as T;
          break;
        case 'arrayBuffer':
          data = await response.arrayBuffer() as unknown as T;
          break;
        case 'formData':
          data = await response.formData() as unknown as T;
          break;
        default:
          try {
            data = await response.json();
          } catch {
            data = null as unknown as T;
          }
      }

      // Run response interceptors
      let processedResponse = response;
      for (const interceptor of responseInterceptors) {
        processedResponse = await interceptor(processedResponse, config);
      }

      // Check for error status
      if (!processedResponse.ok) {
        throw new FetchError(
          `HTTP ${processedResponse.status}: ${processedResponse.statusText}`,
          processedResponse.status,
          processedResponse.statusText,
          processedResponse,
          config
        );
      }

      // Cache response
      if (config.cache !== false && config.cacheDuration && (!config.method || config.method === 'GET')) {
        const cacheKey = getCacheKey(config);
        cacheResponse(cacheKey, processedResponse, data, config.cacheDuration);
      }

      // Return typed response
      const typedResponse = processedResponse as TypedResponse<T>;
      typedResponse.data = data;
      return typedResponse;

    } catch (error) {
      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = new FetchError('Request timeout', undefined, undefined, undefined, config);
      } else if (error instanceof FetchError) {
        lastError = error;
      } else {
        lastError = new FetchError(
          error instanceof Error ? error.message : 'Network error',
          undefined,
          undefined,
          undefined,
          config
        );
      }

      // Retry on network error
      if (attempt < maxAttempts && lastError.isNetworkError) {
        await delay(config.retryDelay || 1000);
        continue;
      }
    }
  }

  // Run error interceptors
  for (const interceptor of errorInterceptors) {
    try {
      const result = await interceptor(lastError!, config);
      const typedResponse = result as TypedResponse<T>;
      typedResponse.data = await result.json();
      return typedResponse;
    } catch (e) {
      if (e instanceof FetchError) {
        lastError = e;
      }
    }
  }

  throw lastError;
}

// ============================================================================
// HTTP Method Shortcuts
// ============================================================================

/**
 * GET request
 */
export function get<T = any>(
  url: string,
  config?: Partial<FetchConfig>
): Promise<TypedResponse<T>> {
  return enhancedFetch<T>({ ...config, url, method: 'GET' });
}

/**
 * POST request
 */
export function post<T = any>(
  url: string,
  data?: any,
  config?: Partial<FetchConfig>
): Promise<TypedResponse<T>> {
  return enhancedFetch<T>({ ...config, url, method: 'POST', body: data });
}

/**
 * PUT request
 */
export function put<T = any>(
  url: string,
  data?: any,
  config?: Partial<FetchConfig>
): Promise<TypedResponse<T>> {
  return enhancedFetch<T>({ ...config, url, method: 'PUT', body: data });
}

/**
 * PATCH request
 */
export function patch<T = any>(
  url: string,
  data?: any,
  config?: Partial<FetchConfig>
): Promise<TypedResponse<T>> {
  return enhancedFetch<T>({ ...config, url, method: 'PATCH', body: data });
}

/**
 * DELETE request
 */
export function del<T = any>(
  url: string,
  config?: Partial<FetchConfig>
): Promise<TypedResponse<T>> {
  return enhancedFetch<T>({ ...config, url, method: 'DELETE' });
}

/**
 * HEAD request
 */
export function head(
  url: string,
  config?: Partial<FetchConfig>
): Promise<Response> {
  return enhancedFetch({ ...config, url, method: 'HEAD' });
}

// ============================================================================
// Create Instance
// ============================================================================

/**
 * Create a fetch instance with default config
 */
export function createFetchInstance(
  instanceConfig: Partial<FetchConfig>
): {
  fetch: typeof enhancedFetch;
  get: typeof get;
  post: typeof post;
  put: typeof put;
  patch: typeof patch;
  delete: typeof del;
  head: typeof head;
  interceptors: typeof interceptors;
} {
  const instanceInterceptors = {
    request: {
      handlers: [] as RequestInterceptor[],
      use(interceptor: RequestInterceptor): number {
        return this.handlers.push(interceptor) - 1;
      },
      eject(id: number): void {
        this.handlers.splice(id, 1);
      },
      clear(): void {
        this.handlers.length = 0;
      },
    },
    response: {
      handlers: [] as ResponseInterceptor[],
      use(interceptor: ResponseInterceptor): number {
        return this.handlers.push(interceptor) - 1;
      },
      eject(id: number): void {
        this.handlers.splice(id, 1);
      },
      clear(): void {
        this.handlers.length = 0;
      },
    },
    error: {
      handlers: [] as ErrorInterceptor[],
      use(interceptor: ErrorInterceptor): number {
        return this.handlers.push(interceptor) - 1;
      },
      eject(id: number): void {
        this.handlers.splice(id, 1);
      },
      clear(): void {
        this.handlers.length = 0;
      },
    },
  };

  const instanceFetch = async <T = any>(
    urlOrConfig: string | FetchConfig,
    options?: Partial<FetchConfig>
  ): Promise<TypedResponse<T>> => {
    const config = typeof urlOrConfig === 'string'
      ? { ...instanceConfig, url: urlOrConfig, ...options }
      : { ...instanceConfig, ...urlOrConfig };

    return enhancedFetch<T>(config);
  };

  return {
    fetch: instanceFetch,
    get: <T = any>(url: string, config?: Partial<FetchConfig>) =>
      instanceFetch<T>({ ...config, url, method: 'GET' }),
    post: <T = any>(url: string, data?: any, config?: Partial<FetchConfig>) =>
      instanceFetch<T>({ ...config, url, method: 'POST', body: data }),
    put: <T = any>(url: string, data?: any, config?: Partial<FetchConfig>) =>
      instanceFetch<T>({ ...config, url, method: 'PUT', body: data }),
    patch: <T = any>(url: string, data?: any, config?: Partial<FetchConfig>) =>
      instanceFetch<T>({ ...config, url, method: 'PATCH', body: data }),
    delete: <T = any>(url: string, config?: Partial<FetchConfig>) =>
      instanceFetch<T>({ ...config, url, method: 'DELETE' }),
    head: (url: string, config?: Partial<FetchConfig>) =>
      instanceFetch({ ...config, url, method: 'HEAD' }),
    interceptors: instanceInterceptors,
  };
}

// ============================================================================
// Hooks
// ============================================================================

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
export function useFetch<T = any>(
  url: string,
  config?: Partial<FetchConfig>
): {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<FetchError | null>;
  refetch: () => Promise<void>;
} {
  const dataSignal = signal<T | null>(null);
  const loadingSignal = signal(true);
  const errorSignal = signal<FetchError | null>(null);

  const refetch = async (): Promise<void> => {
    loadingSignal.set(true);
    errorSignal.set(null);
    try {
      const response = await enhancedFetch<T>(url, config);
      dataSignal.set(response.data);
    } catch (err) {
      errorSignal.set(err instanceof FetchError ? err : new FetchError(String(err)));
    } finally {
      loadingSignal.set(false);
    }
  };

  // Initial fetch
  refetch();

  return {
    data: dataSignal,
    loading: loadingSignal,
    error: errorSignal,
    refetch,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create abort controller with timeout
 */
export function createAbortController(timeout?: number): {
  controller: AbortController;
  clear: () => void;
} {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  if (timeout) {
    timeoutId = setTimeout(() => controller.abort(), timeout);
  }

  return {
    controller,
    clear: () => {
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
}

// ============================================================================
// Export Fetch Object
// ============================================================================

export const Fetch = {
  fetch: enhancedFetch,
  get,
  post,
  put,
  patch,
  delete: del,
  head,
  interceptors,
  create: createFetchInstance,
  clearCache,
  FetchError,
};

export default Fetch;
