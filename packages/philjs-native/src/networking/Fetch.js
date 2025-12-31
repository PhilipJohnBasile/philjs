// @ts-nocheck
/**
 * Enhanced Fetch API
 *
 * Fetch wrapper with interceptors, retries, and caching.
 */
import { signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
import { NetInfo } from './NetInfo.js';
/**
 * Fetch error
 */
export class FetchError extends Error {
    status;
    statusText;
    response;
    config;
    constructor(message, status, statusText, response, config) {
        super(message);
        this.status = status;
        this.statusText = statusText;
        this.response = response;
        this.config = config;
        this.name = 'FetchError';
    }
    /**
     * Whether this is a network error
     */
    get isNetworkError() {
        return this.status === undefined;
    }
    /**
     * Whether this is a timeout error
     */
    get isTimeoutError() {
        return this.message === 'Request timeout';
    }
    /**
     * Whether this is a client error (4xx)
     */
    get isClientError() {
        return this.status !== undefined && this.status >= 400 && this.status < 500;
    }
    /**
     * Whether this is a server error (5xx)
     */
    get isServerError() {
        return this.status !== undefined && this.status >= 500;
    }
}
// ============================================================================
// Default Configuration
// ============================================================================
const defaultConfig = {
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
const requestInterceptors = [];
const responseInterceptors = [];
const errorInterceptors = [];
/**
 * Interceptors manager
 */
export const interceptors = {
    request: {
        use(interceptor) {
            return requestInterceptors.push(interceptor) - 1;
        },
        eject(id) {
            requestInterceptors.splice(id, 1);
        },
        clear() {
            requestInterceptors.length = 0;
        },
    },
    response: {
        use(interceptor) {
            return responseInterceptors.push(interceptor) - 1;
        },
        eject(id) {
            responseInterceptors.splice(id, 1);
        },
        clear() {
            responseInterceptors.length = 0;
        },
    },
    error: {
        use(interceptor) {
            return errorInterceptors.push(interceptor) - 1;
        },
        eject(id) {
            errorInterceptors.splice(id, 1);
        },
        clear() {
            errorInterceptors.length = 0;
        },
    },
};
const responseCache = new Map();
/**
 * Get cache key for a request
 */
function getCacheKey(config) {
    const url = buildURL(config);
    return `${config.method || 'GET'}:${url}`;
}
/**
 * Get cached response if valid
 */
function getCachedResponse(key) {
    const entry = responseCache.get(key);
    if (!entry)
        return null;
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
function cacheResponse(key, response, data, duration) {
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
export function clearCache() {
    responseCache.clear();
}
// ============================================================================
// URL Building
// ============================================================================
/**
 * Build full URL with params
 */
function buildURL(config) {
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
export async function enhancedFetch(urlOrConfig, options) {
    // Normalize config
    let config = typeof urlOrConfig === 'string'
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
            const response = cached.response.clone();
            response.data = cached.data;
            return response;
        }
    }
    // Build URL
    const url = buildURL(config);
    // Prepare fetch options
    const fetchOptions = {
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
    let timeoutId = null;
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
    let lastError = null;
    const maxAttempts = (config.retries || 0) + 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(url, fetchOptions);
            // Clear timeout
            if (timeoutId)
                clearTimeout(timeoutId);
            // Check for retry on status
            if (!response.ok &&
                attempt < maxAttempts &&
                config.retryOnStatus?.includes(response.status)) {
                await delay(config.retryDelay || 1000);
                continue;
            }
            // Parse response
            let data;
            switch (config.responseType) {
                case 'text':
                    data = await response.text();
                    break;
                case 'blob':
                    data = await response.blob();
                    break;
                case 'arrayBuffer':
                    data = await response.arrayBuffer();
                    break;
                case 'formData':
                    data = await response.formData();
                    break;
                default:
                    try {
                        data = await response.json();
                    }
                    catch {
                        data = null;
                    }
            }
            // Run response interceptors
            let processedResponse = response;
            for (const interceptor of responseInterceptors) {
                processedResponse = await interceptor(processedResponse, config);
            }
            // Check for error status
            if (!processedResponse.ok) {
                throw new FetchError(`HTTP ${processedResponse.status}: ${processedResponse.statusText}`, processedResponse.status, processedResponse.statusText, processedResponse, config);
            }
            // Cache response
            if (config.cache !== false && config.cacheDuration && (!config.method || config.method === 'GET')) {
                const cacheKey = getCacheKey(config);
                cacheResponse(cacheKey, processedResponse, data, config.cacheDuration);
            }
            // Return typed response
            const typedResponse = processedResponse;
            typedResponse.data = data;
            return typedResponse;
        }
        catch (error) {
            // Clear timeout
            if (timeoutId)
                clearTimeout(timeoutId);
            // Handle abort/timeout
            if (error instanceof DOMException && error.name === 'AbortError') {
                lastError = new FetchError('Request timeout', undefined, undefined, undefined, config);
            }
            else if (error instanceof FetchError) {
                lastError = error;
            }
            else {
                lastError = new FetchError(error instanceof Error ? error.message : 'Network error', undefined, undefined, undefined, config);
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
            const result = await interceptor(lastError, config);
            const typedResponse = result;
            typedResponse.data = await result.json();
            return typedResponse;
        }
        catch (e) {
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
export function get(url, config) {
    return enhancedFetch({ ...config, url, method: 'GET' });
}
/**
 * POST request
 */
export function post(url, data, config) {
    return enhancedFetch({ ...config, url, method: 'POST', body: data });
}
/**
 * PUT request
 */
export function put(url, data, config) {
    return enhancedFetch({ ...config, url, method: 'PUT', body: data });
}
/**
 * PATCH request
 */
export function patch(url, data, config) {
    return enhancedFetch({ ...config, url, method: 'PATCH', body: data });
}
/**
 * DELETE request
 */
export function del(url, config) {
    return enhancedFetch({ ...config, url, method: 'DELETE' });
}
/**
 * HEAD request
 */
export function head(url, config) {
    return enhancedFetch({ ...config, url, method: 'HEAD' });
}
// ============================================================================
// Create Instance
// ============================================================================
/**
 * Create a fetch instance with default config
 */
export function createFetchInstance(instanceConfig) {
    const instanceInterceptors = {
        request: {
            handlers: [],
            use(interceptor) {
                return this.handlers.push(interceptor) - 1;
            },
            eject(id) {
                this.handlers.splice(id, 1);
            },
            clear() {
                this.handlers.length = 0;
            },
        },
        response: {
            handlers: [],
            use(interceptor) {
                return this.handlers.push(interceptor) - 1;
            },
            eject(id) {
                this.handlers.splice(id, 1);
            },
            clear() {
                this.handlers.length = 0;
            },
        },
        error: {
            handlers: [],
            use(interceptor) {
                return this.handlers.push(interceptor) - 1;
            },
            eject(id) {
                this.handlers.splice(id, 1);
            },
            clear() {
                this.handlers.length = 0;
            },
        },
    };
    const instanceFetch = async (urlOrConfig, options) => {
        const config = typeof urlOrConfig === 'string'
            ? { ...instanceConfig, url: urlOrConfig, ...options }
            : { ...instanceConfig, ...urlOrConfig };
        return enhancedFetch(config);
    };
    return {
        fetch: instanceFetch,
        get: (url, config) => instanceFetch({ ...config, url, method: 'GET' }),
        post: (url, data, config) => instanceFetch({ ...config, url, method: 'POST', body: data }),
        put: (url, data, config) => instanceFetch({ ...config, url, method: 'PUT', body: data }),
        patch: (url, data, config) => instanceFetch({ ...config, url, method: 'PATCH', body: data }),
        delete: (url, config) => instanceFetch({ ...config, url, method: 'DELETE' }),
        head: (url, config) => instanceFetch({ ...config, url, method: 'HEAD' }),
        interceptors: instanceInterceptors,
    };
}
/**
 * Hook for data fetching
 */
export function useFetch(url, config) {
    const dataSignal = signal(null);
    const loadingSignal = signal(true);
    const errorSignal = signal(null);
    const refetch = async () => {
        loadingSignal.set(true);
        errorSignal.set(null);
        try {
            const response = await enhancedFetch(url, config);
            dataSignal.set(response.data);
        }
        catch (err) {
            errorSignal.set(err instanceof FetchError ? err : new FetchError(String(err)));
        }
        finally {
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
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Create abort controller with timeout
 */
export function createAbortController(timeout) {
    const controller = new AbortController();
    let timeoutId = null;
    if (timeout) {
        timeoutId = setTimeout(() => controller.abort(), timeout);
    }
    return {
        controller,
        clear: () => {
            if (timeoutId)
                clearTimeout(timeoutId);
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
//# sourceMappingURL=Fetch.js.map