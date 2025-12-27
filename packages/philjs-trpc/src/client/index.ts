/**
 * @philjs/trpc - Client utilities
 * Type-safe RPC client - framework agnostic
 */

import type { ClientConfig, BatchConfig, SubscriptionConfig, SubscriptionCallbacks } from '../types';

/**
 * Create a type-safe RPC client
 */
export function createClient<TRouter>(config: ClientConfig) {
  const { url, headers, transformer } = config;

  const getHeaders = async (): Promise<Record<string, string>> => {
    if (typeof headers === 'function') {
      return await headers();
    }
    return headers || {};
  };

  const serialize = transformer?.serialize || ((d: unknown) => d);
  const deserialize = transformer?.deserialize || ((d: unknown) => d);

  return {
    /**
     * Call a query procedure
     */
    async query<TInput, TOutput>(
      path: string,
      input?: TInput
    ): Promise<TOutput> {
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

      return deserialize(result.data) as TOutput;
    },

    /**
     * Call a mutation procedure
     */
    async mutate<TInput, TOutput>(
      path: string,
      input?: TInput
    ): Promise<TOutput> {
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

      return deserialize(result.data) as TOutput;
    },

    /**
     * Subscribe to a procedure (WebSocket)
     */
    subscribe<TInput, TOutput>(
      path: string,
      input: TInput,
      callbacks: SubscriptionCallbacks<TOutput>
    ): { unsubscribe: () => void } {
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
          } else {
            callbacks.onData(deserialize(data.data) as TOutput);
          }
        } catch (e) {
          callbacks.onError?.(e as Error);
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
export function createBatchedClient<TRouter>(
  config: ClientConfig & { batch?: BatchConfig }
) {
  const { url, headers, batch, transformer } = config;
  const batchQueue: Array<{
    path: string;
    method: string;
    input: unknown;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = [];
  let batchTimeout: ReturnType<typeof setTimeout> | null = null;

  const getHeaders = async (): Promise<Record<string, string>> => {
    if (typeof headers === 'function') {
      return await headers();
    }
    return headers || {};
  };

  const serialize = transformer?.serialize || ((d: unknown) => d);
  const deserialize = transformer?.deserialize || ((d: unknown) => d);

  const flushBatch = async () => {
    if (batchQueue.length === 0) return;

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
        } else {
          req.resolve(deserialize(result.data));
        }
      });
    } catch (error) {
      batch.forEach((req) => {
        req.reject(error as Error);
      });
    }
  };

  const addToBatch = <T>(method: string, path: string, input: unknown): Promise<T> => {
    return new Promise((resolve, reject) => {
      batchQueue.push({ path, method, input, resolve: resolve as (v: unknown) => void, reject });

      if (batch?.maxItems && batchQueue.length >= batch.maxItems) {
        flushBatch();
      } else if (!batchTimeout) {
        batchTimeout = setTimeout(flushBatch, batch?.waitMs || 10);
      }
    });
  };

  return {
    query: <TInput, TOutput>(path: string, input?: TInput) =>
      addToBatch<TOutput>('query', path, input),

    mutate: <TInput, TOutput>(path: string, input?: TInput) =>
      addToBatch<TOutput>('mutation', path, input),

    flush: flushBatch,
  };
}

/**
 * Simple cache for queries
 */
export function createQueryCache(options?: { ttl?: number }) {
  const cache = new Map<string, { data: unknown; expiresAt: number }>();
  const ttl = options?.ttl || 1000 * 60 * 5; // 5 minutes default

  return {
    get<T>(key: string): T | undefined {
      const entry = cache.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return undefined;
      }
      return entry.data as T;
    },

    set<T>(key: string, data: T): void {
      cache.set(key, { data, expiresAt: Date.now() + ttl });
    },

    invalidate(key: string): void {
      cache.delete(key);
    },

    invalidateAll(): void {
      cache.clear();
    },

    has(key: string): boolean {
      const entry = cache.get(key);
      if (!entry) return false;
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
export function createCachedQuery<TInput, TOutput>(
  queryFn: (input: TInput) => Promise<TOutput>,
  options?: { ttl?: number; keyFn?: (input: TInput) => string }
) {
  const cache = createQueryCache({ ttl: options?.ttl });
  const keyFn = options?.keyFn || ((input: TInput) => JSON.stringify(input));

  return async (input: TInput): Promise<TOutput> => {
    const key = keyFn(input);
    const cached = cache.get<TOutput>(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = await queryFn(input);
    cache.set(key, result);
    return result;
  };
}
