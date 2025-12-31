/**
 * @philjs/trpc - Client utilities
 * Type-safe RPC client - framework agnostic
 */
/**
 * Create a type-safe RPC client
 */
export function createClient(config) {
    const { url, headers, transformer } = config;
    const getHeaders = async () => {
        if (typeof headers === 'function') {
            return await headers();
        }
        return headers || {};
    };
    const serialize = transformer?.serialize || ((d) => d);
    const deserialize = transformer?.deserialize || ((d) => d);
    return {
        /**
         * Call a query procedure
         */
        async query(path, input) {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await getHeaders()),
                },
                body: JSON.stringify({
                    method: 'query',
                    path,
                    input: serialize(input),
                }),
            });
            if (!response.ok) {
                throw new Error(`Request failed: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error.message || 'Unknown error');
            }
            return deserialize(result.data);
        },
        /**
         * Call a mutation procedure
         */
        async mutate(path, input) {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await getHeaders()),
                },
                body: JSON.stringify({
                    method: 'mutation',
                    path,
                    input: serialize(input),
                }),
            });
            if (!response.ok) {
                throw new Error(`Request failed: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error.message || 'Unknown error');
            }
            return deserialize(result.data);
        },
        /**
         * Subscribe to a procedure (WebSocket)
         */
        subscribe(path, input, callbacks) {
            const wsUrl = url.replace(/^http/, 'ws');
            const ws = new WebSocket(wsUrl);
            ws.onopen = () => {
                ws.send(JSON.stringify({
                    method: 'subscription',
                    path,
                    input: serialize(input),
                }));
                callbacks.onStarted?.();
            };
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.error) {
                        callbacks.onError?.(new Error(data.error.message));
                    }
                    else {
                        callbacks.onData(deserialize(data.data));
                    }
                }
                catch (e) {
                    callbacks.onError?.(e);
                }
            };
            ws.onerror = () => {
                callbacks.onError?.(new Error('WebSocket error'));
            };
            ws.onclose = () => {
                callbacks.onComplete?.();
                callbacks.onStopped?.();
            };
            return {
                unsubscribe: () => {
                    ws.close();
                },
            };
        },
    };
}
/**
 * Create a batched client
 */
export function createBatchedClient(config) {
    const { url, headers, batch, transformer } = config;
    const batchQueue = [];
    let batchTimeout = null;
    const getHeaders = async () => {
        if (typeof headers === 'function') {
            return await headers();
        }
        return headers || {};
    };
    const serialize = transformer?.serialize || ((d) => d);
    const deserialize = transformer?.deserialize || ((d) => d);
    const flushBatch = async () => {
        if (batchQueue.length === 0)
            return;
        const batch = [...batchQueue];
        batchQueue.length = 0;
        batchTimeout = null;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await getHeaders()),
                },
                body: JSON.stringify({
                    batch: batch.map((req) => ({
                        method: req.method,
                        path: req.path,
                        input: serialize(req.input),
                    })),
                }),
            });
            const results = await response.json();
            batch.forEach((req, index) => {
                const result = results[index];
                if (result.error) {
                    req.reject(new Error(result.error.message));
                }
                else {
                    req.resolve(deserialize(result.data));
                }
            });
        }
        catch (error) {
            batch.forEach((req) => {
                req.reject(error);
            });
        }
    };
    const addToBatch = (method, path, input) => {
        return new Promise((resolve, reject) => {
            batchQueue.push({ path, method, input, resolve: resolve, reject });
            if (batch?.maxItems && batchQueue.length >= batch.maxItems) {
                flushBatch();
            }
            else if (!batchTimeout) {
                batchTimeout = setTimeout(flushBatch, batch?.waitMs || 10);
            }
        });
    };
    return {
        query: (path, input) => addToBatch('query', path, input),
        mutate: (path, input) => addToBatch('mutation', path, input),
        flush: flushBatch,
    };
}
/**
 * Simple cache for queries
 */
export function createQueryCache(options) {
    const cache = new Map();
    const ttl = options?.ttl || 1000 * 60 * 5; // 5 minutes default
    return {
        get(key) {
            const entry = cache.get(key);
            if (!entry)
                return undefined;
            if (Date.now() > entry.expiresAt) {
                cache.delete(key);
                return undefined;
            }
            return entry.data;
        },
        set(key, data) {
            cache.set(key, { data, expiresAt: Date.now() + ttl });
        },
        invalidate(key) {
            cache.delete(key);
        },
        invalidateAll() {
            cache.clear();
        },
        has(key) {
            const entry = cache.get(key);
            if (!entry)
                return false;
            if (Date.now() > entry.expiresAt) {
                cache.delete(key);
                return false;
            }
            return true;
        },
    };
}
/**
 * Create a cached query function
 */
export function createCachedQuery(queryFn, options) {
    const cache = createQueryCache({ ...(options?.ttl !== undefined ? { ttl: options.ttl } : {}) });
    const keyFn = options?.keyFn || ((input) => JSON.stringify(input));
    return async (input) => {
        const key = keyFn(input);
        const cached = cache.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const result = await queryFn(input);
        cache.set(key, result);
        return result;
    };
}
//# sourceMappingURL=index.js.map