/**
 * Client-side RPC client for philjs-rpc.
 * Provides type-safe API calls with React Query-style hooks.
 */
import { signal, effect, memo } from '@philjs/core';
class QueryCache {
    cache = new Map();
    subscribers = new Map();
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        return entry.data;
    }
    set(key, data, staleTime) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            staleTime,
        });
        this.notify(key);
    }
    isStale(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return true;
        return Date.now() - entry.timestamp > entry.staleTime;
    }
    invalidate(key) {
        this.cache.delete(key);
        this.notify(key);
    }
    invalidateAll() {
        const keys = Array.from(this.cache.keys());
        this.cache.clear();
        for (const key of keys) {
            this.notify(key);
        }
    }
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
        return () => {
            this.subscribers.get(key)?.delete(callback);
        };
    }
    notify(key) {
        const subs = this.subscribers.get(key);
        if (subs) {
            for (const callback of subs) {
                callback();
            }
        }
    }
}
// Global query cache
const queryCache = new QueryCache();
class RequestBatcher {
    pendingRequests = [];
    batchTimeout = null;
    config;
    constructor(config) {
        this.config = config;
    }
    add(request) {
        return new Promise((resolve, reject) => {
            this.pendingRequests.push({ request, resolve, reject });
            if (!this.batchTimeout) {
                this.batchTimeout = setTimeout(() => this.flush(), this.config.batchWindowMs ?? 10);
            }
        });
    }
    async flush() {
        this.batchTimeout = null;
        const requests = this.pendingRequests;
        this.pendingRequests = [];
        if (requests.length === 0)
            return;
        // If only one request, send it directly
        if (requests.length === 1) {
            try {
                const response = await this.sendSingle(requests[0].request);
                requests[0].resolve(response);
            }
            catch (error) {
                requests[0].reject(error);
            }
            return;
        }
        // Send batched request
        try {
            const responses = await this.sendBatch(requests.map((r) => r.request));
            for (let i = 0; i < requests.length; i++) {
                requests[i].resolve(responses[i]);
            }
        }
        catch (error) {
            for (const req of requests) {
                req.reject(error);
            }
        }
    }
    async sendSingle(request) {
        const fetchFn = this.config.fetch ?? fetch;
        const headers = await this.getHeaders();
        const response = await fetchFn(this.config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify(request),
        });
        return response.json();
    }
    async sendBatch(requests) {
        const fetchFn = this.config.fetch ?? fetch;
        const headers = await this.getHeaders();
        const response = await fetchFn(this.config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify({ requests }),
        });
        const result = await response.json();
        return result.responses;
    }
    async getHeaders() {
        if (typeof this.config.headers === 'function') {
            return this.config.headers();
        }
        return this.config.headers ?? {};
    }
}
// ============================================================================
// Client Creation
// ============================================================================
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
export function createClient(config) {
    const batcher = config.batching ? new RequestBatcher(config) : null;
    async function makeRequest(request) {
        // Transform request if configured
        if (config.transformRequest) {
            request = await config.transformRequest(request);
        }
        let response;
        if (batcher) {
            response = (await batcher.add(request));
        }
        else {
            const fetchFn = config.fetch ?? fetch;
            const headers = await getHeaders();
            const res = await fetchFn(config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: JSON.stringify(request),
            });
            response = await res.json();
        }
        // Transform response if configured
        if (config.transformResponse) {
            response = config.transformResponse(response);
        }
        if (response.error) {
            const { RPCError: RPCErrorClass } = await import('./types.js');
            const error = new RPCErrorClass({
                code: response.error.code,
                message: response.error.message,
            });
            if (config.onError) {
                config.onError(error);
            }
            throw error;
        }
        return response.result.data;
    }
    async function getHeaders() {
        if (typeof config.headers === 'function') {
            return config.headers();
        }
        return config.headers ?? {};
    }
    function createCacheKey(path, input) {
        return `${path}:${JSON.stringify(input ?? null)}`;
    }
    /**
     * Create useQuery hook for a query procedure.
     */
    function createUseQuery(path) {
        return ((inputOrOptions, maybeOptions) => {
            // Handle both signatures: useQuery(options?) and useQuery(input, options?)
            let input;
            let options;
            if (maybeOptions !== undefined) {
                input = inputOrOptions;
                options = maybeOptions;
            }
            else if (inputOrOptions !== undefined &&
                inputOrOptions !== null &&
                typeof inputOrOptions === 'object' &&
                ('enabled' in inputOrOptions || 'staleTime' in inputOrOptions || 'onSuccess' in inputOrOptions)) {
                options = inputOrOptions;
            }
            else {
                input = inputOrOptions;
                options = {};
            }
            const { enabled = true, staleTime = 0, retry = 3, retryDelay = 1000, onSuccess, onError, refetchOnWindowFocus = true, refetchInterval, initialData, placeholderData, } = options;
            const cacheKey = createCacheKey(path, input);
            // Create reactive state using PhilJS signals
            const data = signal(initialData ?? queryCache.get(cacheKey) ?? placeholderData);
            const error = signal(null);
            const isLoading = signal(!initialData && !queryCache.get(cacheKey));
            const isFetching = signal(false);
            const isStale = signal(queryCache.isStale(cacheKey));
            const fetchData = async () => {
                if (!enabled)
                    return;
                isFetching.set(true);
                try {
                    const result = await makeRequest({
                        path,
                        type: 'query',
                        input,
                    });
                    data.set(result);
                    error.set(null);
                    queryCache.set(cacheKey, result, staleTime);
                    isStale.set(false);
                    if (onSuccess) {
                        onSuccess(result);
                    }
                }
                catch (err) {
                    error.set(err);
                    if (onError) {
                        onError(err);
                    }
                }
                finally {
                    isLoading.set(false);
                    isFetching.set(false);
                }
            };
            // Initial fetch
            if (enabled && (isStale() || !queryCache.get(cacheKey))) {
                fetchData();
            }
            // Subscribe to cache updates
            const unsubscribe = queryCache.subscribe(cacheKey, () => {
                const cached = queryCache.get(cacheKey);
                if (cached !== undefined) {
                    data.set(cached);
                }
                isStale.set(queryCache.isStale(cacheKey));
            });
            // Refetch on window focus
            let focusHandler;
            if (refetchOnWindowFocus && typeof window !== 'undefined') {
                focusHandler = () => {
                    if (isStale()) {
                        fetchData();
                    }
                };
                window.addEventListener('focus', focusHandler);
            }
            // Refetch interval
            let intervalId;
            if (refetchInterval) {
                intervalId = setInterval(fetchData, refetchInterval);
            }
            // Create cleanup effect
            effect(() => {
                return () => {
                    unsubscribe();
                    if (focusHandler) {
                        window.removeEventListener('focus', focusHandler);
                    }
                    if (intervalId) {
                        clearInterval(intervalId);
                    }
                };
            });
            return {
                get data() { return data(); },
                get error() { return error(); },
                get isLoading() { return isLoading(); },
                get isFetching() { return isFetching(); },
                get isSuccess() { return !error() && !isLoading() && data() !== undefined; },
                get isError() { return error() !== null; },
                get isStale() { return isStale(); },
                refetch: fetchData,
                remove: () => queryCache.invalidate(cacheKey),
            };
        });
    }
    /**
     * Create useMutation hook for a mutation procedure.
     */
    function createUseMutation(path) {
        return (options) => {
            const { onSuccess, onError, onSettled, onMutate, retry = 0, } = options ?? {};
            const data = signal(undefined);
            const error = signal(null);
            const isLoading = signal(false);
            const isIdle = signal(true);
            const mutateAsync = async (input) => {
                isLoading.set(true);
                isIdle.set(false);
                error.set(null);
                if (onMutate) {
                    await onMutate(input);
                }
                try {
                    const result = await makeRequest({
                        path,
                        type: 'mutation',
                        input,
                    });
                    data.set(result);
                    if (onSuccess) {
                        onSuccess(result, input);
                    }
                    if (onSettled) {
                        onSettled(result, null, input);
                    }
                    return result;
                }
                catch (err) {
                    const rpcError = err;
                    error.set(rpcError);
                    if (onError) {
                        onError(rpcError, input);
                    }
                    if (onSettled) {
                        onSettled(undefined, rpcError, input);
                    }
                    throw rpcError;
                }
                finally {
                    isLoading.set(false);
                }
            };
            const mutate = (input) => {
                mutateAsync(input).catch(() => {
                    // Error is already handled via onError callback
                });
            };
            const reset = () => {
                data.set(undefined);
                error.set(null);
                isLoading.set(false);
                isIdle.set(true);
            };
            return {
                get data() { return data(); },
                get error() { return error(); },
                get isLoading() { return isLoading(); },
                get isSuccess() { return !error() && !isIdle() && !isLoading() && data() !== undefined; },
                get isError() { return error() !== null; },
                get isIdle() { return isIdle(); },
                mutate,
                mutateAsync,
                reset,
            };
        };
    }
    /**
     * Create fetch function for direct calls.
     */
    function createFetch(path, type) {
        return ((input) => {
            return makeRequest({
                path,
                type,
                input,
            });
        });
    }
    /**
     * Build client proxy for the router.
     */
    function buildClientProxy(path = []) {
        return new Proxy({}, {
            get(_, key) {
                const newPath = [...path, key];
                const pathString = newPath.join('.');
                // Check if this is a terminal method
                if (key === 'fetch') {
                    // We don't know the type at this point, so we'll use 'query' as default
                    // The server will determine the correct type
                    return createFetch(pathString.replace('.fetch', ''), 'query');
                }
                if (key === 'useQuery') {
                    return createUseQuery(pathString.replace('.useQuery', ''));
                }
                if (key === 'useMutation') {
                    return createUseMutation(pathString.replace('.useMutation', ''));
                }
                // Continue building the path
                return buildClientProxy(newPath);
            },
        });
    }
    return buildClientProxy();
}
// ============================================================================
// Utility Hooks
// ============================================================================
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
export function invalidateQueries(pathPattern) {
    // For now, invalidate all (simple implementation)
    // In a production version, you'd match against the pattern
    queryCache.invalidateAll();
}
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
export async function prefetchQuery(procedure, input) {
    try {
        await procedure.fetch(input);
    }
    catch {
        // Silently fail prefetch
    }
}
/**
 * Get query cache instance for advanced usage.
 */
export function getQueryCache() {
    return queryCache;
}
//# sourceMappingURL=client.js.map