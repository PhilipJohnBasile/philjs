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
/**
 * Treaty error with additional context.
 */
export class TreatyError extends Error {
    code;
    status;
    response;
    config;
    constructor(opts) {
        super(opts.message);
        this.name = 'TreatyError';
        this.code = opts.code;
        this.status = opts.status ?? undefined;
        this.response = opts.response ?? undefined;
        this.config = opts.config;
    }
}
// ============================================================================
// Request Implementation
// ============================================================================
/**
 * Execute a request with retry logic.
 */
async function executeWithRetry(fn, retryConfig) {
    const { count = 0, delay = 1000, backoff = 2, statusCodes = [408, 429, 500, 502, 503, 504], } = retryConfig ?? {};
    let lastError;
    let currentDelay = delay;
    for (let attempt = 0; attempt <= count; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            // Don't retry if it's the last attempt
            if (attempt === count) {
                throw error;
            }
            // Check if we should retry based on status code
            if (error instanceof TreatyError && error.status !== undefined) {
                if (!statusCodes.includes(error.status)) {
                    throw error;
                }
            }
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, currentDelay));
            currentDelay *= backoff;
        }
    }
    throw lastError;
}
/**
 * Create a request with timeout support.
 */
async function createTimeoutRequest(fn, timeout, signal) {
    if (!timeout && !signal) {
        return fn();
    }
    let timeoutSignal;
    let timeoutId;
    if (timeout !== undefined) {
        if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
            timeoutSignal = AbortSignal.timeout(timeout);
        }
        else {
            const timeoutController = new AbortController();
            timeoutId = setTimeout(() => timeoutController.abort(), timeout);
            timeoutSignal = timeoutController.signal;
        }
    }
    const signals = [signal, timeoutSignal].filter(Boolean);
    const combinedSignal = signals.length === 0
        ? undefined
        : signals.length === 1
            ? signals[0]
            : typeof AbortSignal !== 'undefined' && 'any' in AbortSignal
                ? AbortSignal.any(signals)
                : combineAbortSignals(signals[0], signals[1]);
    let removeAbortListener;
    try {
        if (!combinedSignal) {
            return await fn();
        }
        const abortPromise = new Promise((_, reject) => {
            if (combinedSignal.aborted) {
                reject(new Error('Request aborted'));
                return;
            }
            const onAbort = () => reject(new Error('Request aborted'));
            combinedSignal.addEventListener('abort', onAbort, { once: true });
            removeAbortListener = () => {
                combinedSignal.removeEventListener('abort', onAbort);
            };
        });
        return await Promise.race([fn(combinedSignal), abortPromise]);
    }
    finally {
        if (removeAbortListener) {
            removeAbortListener();
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}
/**
 * Combine multiple AbortSignals.
 */
function combineAbortSignals(signal1, signal2) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    const cleanup = () => {
        signal1.removeEventListener('abort', abort);
        signal2.removeEventListener('abort', abort);
    };
    if (signal1.aborted || signal2.aborted) {
        abort();
        cleanup();
        return controller.signal;
    }
    signal1.addEventListener('abort', () => {
        abort();
        cleanup();
    }, { once: true });
    signal2.addEventListener('abort', () => {
        abort();
        cleanup();
    }, { once: true });
    return controller.signal;
}
/**
 * Make an HTTP request.
 */
async function makeRequest(config, globalConfig) {
    // Apply request interceptor
    let finalConfig = { ...config };
    if (globalConfig.onRequest) {
        finalConfig = await globalConfig.onRequest(finalConfig);
    }
    const fetchFn = config.fetch ?? globalConfig.fetch ?? fetch;
    try {
        const response = await fetchFn(finalConfig.url, {
            method: finalConfig.method,
            headers: {
                'Content-Type': 'application/json',
                ...finalConfig.headers,
            },
            body: finalConfig.body ? JSON.stringify(finalConfig.body) : null,
            ...(finalConfig.signal && { signal: finalConfig.signal }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorPayload = errorData && typeof errorData === 'object' && 'error' in errorData
                ? errorData.error
                : errorData;
            const error = new TreatyError({
                code: errorPayload?.code ?? 'HTTP_ERROR',
                message: errorPayload?.message ?? `HTTP ${response.status}: ${response.statusText}`,
                status: response.status,
                response: errorData,
                config: finalConfig,
            });
            if (globalConfig.onError) {
                await globalConfig.onError(error, finalConfig);
            }
            throw error;
        }
        const data = await response.json();
        // Handle RPC response format
        let result;
        if (data && typeof data === 'object' && 'result' in data) {
            result = data.result.data;
        }
        else if (data && typeof data === 'object' && 'error' in data) {
            const error = new TreatyError({
                code: data.error.code,
                message: data.error.message,
                status: response.status,
                response: data.error,
                config: finalConfig,
            });
            if (globalConfig.onError) {
                await globalConfig.onError(error, finalConfig);
            }
            throw error;
        }
        else {
            result = data;
        }
        // Apply response interceptor
        if (globalConfig.onResponse) {
            result = await globalConfig.onResponse(result, finalConfig);
        }
        return result;
    }
    catch (error) {
        if (error instanceof TreatyError) {
            throw error;
        }
        const treatyError = new TreatyError({
            code: 'NETWORK_ERROR',
            message: error instanceof Error ? error.message : 'Network request failed',
            config: finalConfig,
        });
        if (globalConfig.onError) {
            await globalConfig.onError(treatyError, finalConfig);
        }
        throw treatyError;
    }
}
// ============================================================================
// Treaty Client Factory
// ============================================================================
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
export function treaty(baseUrl, config) {
    const globalConfig = {
        baseUrl,
        ...config,
    };
    /**
     * Create a method handler for a specific HTTP method.
     */
    function createMethodHandler(path, method) {
        const normalizedMethod = method.toLowerCase();
        const requestType = normalizedMethod === 'get' || normalizedMethod === 'head' || normalizedMethod === 'options'
            ? 'query'
            : 'mutation';
        const isOptionsObject = (value) => {
            if (!value || typeof value !== 'object' || Array.isArray(value))
                return false;
            return ('headers' in value ||
                'timeout' in value ||
                'signal' in value ||
                'retry' in value ||
                'onProgress' in value ||
                'fetch' in value);
        };
        return async (input, options) => {
            let resolvedInput = input;
            let resolvedOptions = options;
            if (options === undefined && isOptionsObject(input)) {
                resolvedInput = undefined;
                resolvedOptions = input;
            }
            const mergedOptions = {
                ...globalConfig.defaults,
                ...resolvedOptions,
            };
            const requestConfig = {
                url: globalConfig.baseUrl,
                method: method.toUpperCase(),
                headers: mergedOptions.headers ?? {},
                body: {
                    path,
                    type: requestType,
                    ...(resolvedInput !== undefined ? { input: resolvedInput } : {}),
                },
            };
            if (mergedOptions.signal !== undefined) {
                requestConfig.signal = mergedOptions.signal;
            }
            if (mergedOptions.timeout !== undefined) {
                requestConfig.timeout = mergedOptions.timeout;
            }
            if (mergedOptions.fetch !== undefined) {
                requestConfig.fetch = mergedOptions.fetch;
            }
            const executeRequest = async () => {
                return createTimeoutRequest((signal) => makeRequest({ ...requestConfig, signal }, globalConfig), mergedOptions.timeout, mergedOptions.signal);
            };
            if (mergedOptions.retry) {
                return executeWithRetry(executeRequest, mergedOptions.retry);
            }
            return executeRequest();
        };
    }
    /**
     * Create a WebSocket connection.
     */
    function createWebSocket(path, handler, options) {
        const wsUrl = globalConfig.baseUrl.replace(/^http/, 'ws') + '/' + path;
        const ws = new WebSocket(wsUrl, options?.protocols);
        let reconnectAttempts = 0;
        const maxAttempts = options?.maxReconnectAttempts ?? 5;
        const reconnectDelay = options?.reconnectDelay ?? 1000;
        const setupHandlers = (socket) => {
            if (handler.onOpen) {
                socket.addEventListener('open', handler.onOpen);
            }
            if (handler.onMessage) {
                socket.addEventListener('message', (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        handler.onMessage(data);
                    }
                    catch {
                        handler.onMessage(event.data);
                    }
                });
            }
            if (handler.onError) {
                socket.addEventListener('error', handler.onError);
            }
            if (handler.onClose) {
                socket.addEventListener('close', (event) => {
                    handler.onClose(event);
                    // Auto-reconnect logic
                    if (options?.autoReconnect && reconnectAttempts < maxAttempts) {
                        reconnectAttempts++;
                        setTimeout(() => {
                            const newSocket = new WebSocket(wsUrl, options?.protocols);
                            setupHandlers(newSocket);
                        }, reconnectDelay * reconnectAttempts);
                    }
                });
            }
        };
        setupHandlers(ws);
        return {
            send: (data) => {
                ws.send(JSON.stringify(data));
            },
            close: (code, reason) => {
                ws.close(code, reason);
            },
            get readyState() {
                return ws.readyState;
            },
            addEventListener: ws.addEventListener.bind(ws),
            removeEventListener: ws.removeEventListener.bind(ws),
        };
    }
    /**
     * Build the proxy-based client.
     */
    function buildProxy(path = [], params = {}) {
        const proxyFn = (newParams) => {
            return buildProxy(path, { ...params, ...newParams });
        };
        return new Proxy(proxyFn, {
            get(_, key) {
                if (typeof key !== 'string') {
                    return proxyFn[key];
                }
                // HTTP method handlers
                const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
                if (httpMethods.includes(key.toLowerCase())) {
                    const fullPath = path.join('.');
                    let finalPath = fullPath;
                    // Replace path parameters
                    for (const [paramKey, paramValue] of Object.entries(params)) {
                        finalPath = finalPath.replace(`:${paramKey}`, String(paramValue));
                    }
                    const methodHandler = createMethodHandler(finalPath, key);
                    const methodProxy = new Proxy(methodHandler, {
                        get(__, nestedKey) {
                            if (typeof nestedKey !== 'string') {
                                return methodHandler[nestedKey];
                            }
                            return buildProxy([...path, key], params)[nestedKey];
                        },
                        apply(__, ___, args) {
                            return methodHandler(args[0], args[1]);
                        },
                    });
                    return methodProxy;
                }
                // Special methods
                if (key === 'ws' || key === 'websocket') {
                    return (handler, options) => {
                        const fullPath = path.join('.');
                        let finalPath = fullPath;
                        // Replace path parameters
                        for (const [paramKey, paramValue] of Object.entries(params)) {
                            finalPath = finalPath.replace(`:${paramKey}`, String(paramValue));
                        }
                        return createWebSocket(finalPath, handler, options);
                    };
                }
                // Continue building the path
                return buildProxy([...path, key], params);
            },
            apply(_, __, args) {
                // Handle function call for path parameters
                return buildProxy(path, { ...params, ...args[0] });
            },
        });
    }
    return buildProxy();
}
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
export function createTreatyClient(config) {
    const client = treaty(config.baseUrl, config);
    return {
        client,
        utils: {
            /**
             * Create a batch request.
             */
            batch: async (requests) => {
                return Promise.all(requests.map((fn) => fn()));
            },
            /**
             * Create a custom request.
             */
            request: async (path, options) => {
                const requestConfig = {
                    url: `${config.baseUrl}/${path}`,
                    method: options?.method ?? 'GET',
                    headers: options?.headers ?? {},
                };
                if (options?.body !== undefined) {
                    requestConfig.body = options.body;
                }
                if (options?.signal !== undefined) {
                    requestConfig.signal = options.signal;
                }
                if (options?.timeout !== undefined) {
                    requestConfig.timeout = options.timeout;
                }
                if (options?.fetch !== undefined) {
                    requestConfig.fetch = options.fetch;
                }
                return makeRequest(requestConfig, config);
            },
        },
    };
}
//# sourceMappingURL=treaty.js.map