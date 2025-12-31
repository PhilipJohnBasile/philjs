/**
 * tRPC-style links for philjs-rpc.
 * Provides composable request/response transformations and routing.
 */
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
export function createHttpLink(options) {
    const { url, fetch: customFetch = typeof fetch !== 'undefined' ? fetch : undefined, headers: customHeaders, transformRequest, transformResponse, } = options;
    if (!customFetch) {
        throw new Error('fetch is not available');
    }
    return async ({ op }) => {
        let operation = op;
        // Transform request if configured
        if (transformRequest) {
            operation = await transformRequest(operation);
        }
        // Get headers
        let headers = {};
        if (customHeaders) {
            headers = typeof customHeaders === 'function' ? await customHeaders() : customHeaders;
        }
        // Make HTTP request
        const request = {
            path: operation.path,
            type: operation.type,
            input: operation.input,
        };
        const response = await customFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify(request),
        });
        const data = await response.json();
        let result;
        if (data.error) {
            result = {
                error: data.error,
            };
        }
        else {
            result = {
                data: data.result?.data,
            };
        }
        // Transform response if configured
        if (transformResponse) {
            result = transformResponse(result);
        }
        return result;
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
export function createWebSocketLink(options) {
    const { WebSocketConnection } = require('./subscriptions.js');
    const connection = new WebSocketConnection({
        url: options.url,
        WebSocketImpl: options.WebSocket,
        reconnect: options.reconnect,
    });
    connection.connect();
    return async ({ op }) => {
        if (op.type !== 'subscription') {
            throw new Error('WebSocket link only supports subscriptions');
        }
        // For subscriptions, we need to return a special result that includes
        // an observable-like interface
        return {
            data: {
                subscribe: (observer) => {
                    return connection.subscribe(op.id, op.path, op.input, observer);
                },
            },
        };
    };
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
export function createSplitLink(options) {
    const { condition, true: trueLink, false: falseLink } = options;
    return async (ctx) => {
        const useTrue = condition(ctx.op);
        const selectedLink = useTrue ? trueLink : falseLink;
        return selectedLink(ctx);
    };
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
export function createBatchLink(options) {
    const { maxBatchSize = 100, batchWindowMs = 10, httpLink, } = options;
    let pendingOperations = [];
    let batchTimeout = null;
    const flush = async () => {
        batchTimeout = null;
        const operations = pendingOperations;
        pendingOperations = [];
        if (operations.length === 0)
            return;
        // If only one operation, send it directly
        if (operations.length === 1) {
            const { op, resolve, reject } = operations[0];
            try {
                const result = await httpLink({ op, next: async () => ({ data: undefined }) });
                resolve(result);
            }
            catch (error) {
                reject(error);
            }
            return;
        }
        // Batch multiple operations
        // Note: This requires server support for batching
        try {
            const batchOp = {
                id: `batch-${Date.now()}`,
                type: 'mutation',
                path: '__batch',
                input: {
                    requests: operations.map((o) => ({
                        path: o.op.path,
                        type: o.op.type,
                        input: o.op.input,
                    })),
                },
            };
            const result = await httpLink({ op: batchOp, next: async () => ({ data: undefined }) });
            if (result.data && Array.isArray(result.data.responses)) {
                const responses = result.data.responses;
                for (let i = 0; i < operations.length; i++) {
                    operations[i].resolve(responses[i]);
                }
            }
            else {
                throw new Error('Invalid batch response');
            }
        }
        catch (error) {
            for (const op of operations) {
                op.reject(error);
            }
        }
    };
    return async ({ op }) => {
        return new Promise((resolve, reject) => {
            pendingOperations.push({ op, resolve, reject });
            if (pendingOperations.length >= maxBatchSize) {
                // Flush immediately if batch is full
                if (batchTimeout) {
                    clearTimeout(batchTimeout);
                }
                flush();
            }
            else if (!batchTimeout) {
                // Schedule flush
                batchTimeout = setTimeout(flush, batchWindowMs);
            }
        });
    };
}
/**
 * Create a deduplication link to prevent duplicate in-flight requests.
 *
 * @example
 * ```ts
 * const dedupeLink = createDeduplicationLink();
 * ```
 */
export function createDeduplicationLink(options) {
    const { getKey = (op) => `${op.path}:${JSON.stringify(op.input)}` } = options ?? {};
    const inflightRequests = new Map();
    return async ({ op, next }) => {
        // Only deduplicate queries
        if (op.type !== 'query') {
            return next(op);
        }
        const key = getKey(op);
        const existing = inflightRequests.get(key);
        if (existing) {
            return existing;
        }
        const promise = next(op).finally(() => {
            inflightRequests.delete(key);
        });
        inflightRequests.set(key, promise);
        return promise;
    };
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
export function createRetryLink(options) {
    const { maxAttempts = 3, retryDelay = 1000, backoffMultiplier = 1.5, maxDelay = 30000, shouldRetry = (error) => {
        // Retry on network errors and specific error codes
        return error?.code === 'TIMEOUT' || error?.code === 'INTERNAL_SERVER_ERROR';
    }, } = options ?? {};
    return async ({ op, next }) => {
        let lastError;
        let attempt = 0;
        while (attempt < maxAttempts) {
            try {
                const result = await next(op);
                if (!result.error) {
                    return result;
                }
                lastError = result.error;
                if (!shouldRetry(lastError, attempt)) {
                    return result;
                }
                attempt++;
                if (attempt < maxAttempts) {
                    const delay = Math.min(retryDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
            catch (error) {
                lastError = {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                };
                if (!shouldRetry(lastError, attempt)) {
                    return { error: lastError };
                }
                attempt++;
                if (attempt < maxAttempts) {
                    const delay = Math.min(retryDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        return { error: lastError };
    };
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
export function createLoggingLink(options) {
    const { enabled = true, logger = console, logRequest = true, logResponse = true, logTiming = true, } = options ?? {};
    return async ({ op, next }) => {
        if (!enabled) {
            return next(op);
        }
        const startTime = Date.now();
        if (logRequest) {
            logger.log(`[RPC Request] ${op.type} ${op.path}`, {
                input: op.input,
                context: op.context,
            });
        }
        const result = await next(op);
        const duration = Date.now() - startTime;
        if (logResponse) {
            if (result.error) {
                logger.error(`[RPC Error] ${op.type} ${op.path}`, {
                    error: result.error,
                    duration: logTiming ? `${duration}ms` : undefined,
                });
            }
            else {
                logger.log(`[RPC Response] ${op.type} ${op.path}`, {
                    data: result.data,
                    duration: logTiming ? `${duration}ms` : undefined,
                });
            }
        }
        return result;
    };
}
// ============================================================================
// Link Chain
// ============================================================================
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
export function createLinkChain(links) {
    if (links.length === 0) {
        throw new Error('Link chain must have at least one link');
    }
    return async ({ op }) => {
        const executeChain = (index) => {
            if (index >= links.length) {
                throw new Error('Link chain ended without returning a result');
            }
            const link = links[index];
            return link({
                op,
                next: (nextOp) => executeChain(index + 1),
            });
        };
        return executeChain(0);
    };
}
// ============================================================================
// Terminating Link
// ============================================================================
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
export function createTerminatingLink(handler) {
    return async ({ op }) => {
        return handler(op);
    };
}
//# sourceMappingURL=links.js.map