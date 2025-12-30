/**
 * tRPC-style links for philjs-rpc.
 * Provides composable request/response transformations and routing.
 */

import type { RPCRequest, RPCResponse, ProcedureType } from './types.js';

// ============================================================================
// Link Types
// ============================================================================

export interface Operation {
  /** Unique operation ID */
  id: string;
  /** Procedure type */
  type: ProcedureType | 'subscription';
  /** Procedure path */
  path: string;
  /** Input data */
  input?: unknown;
  /** Request context */
  context?: Record<string, unknown>;
}

export interface OperationResult<TData = unknown> {
  /** Result data */
  data?: TData;
  /** Error */
  error?: {
    code: string;
    message: string;
    data?: unknown;
  };
}

export type LinkFn = (options: {
  op: Operation;
  next: (op: Operation) => Promise<OperationResult>;
}) => Promise<OperationResult>;

export interface Link {
  (options: {
    op: Operation;
    next: (op: Operation) => Promise<OperationResult>;
  }): Promise<OperationResult>;
}

// ============================================================================
// HTTP Link
// ============================================================================

export interface HttpLinkOptions {
  /** API endpoint URL */
  url: string;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
  /** Custom headers */
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  /** Request transformer */
  transformRequest?: (op: Operation) => Operation | Promise<Operation>;
  /** Response transformer */
  transformResponse?: <T>(result: OperationResult<T>) => OperationResult<T>;
}

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
export function createHttpLink(options: HttpLinkOptions): Link {
  const {
    url,
    fetch: customFetch = typeof fetch !== 'undefined' ? fetch : undefined,
    headers: customHeaders,
    transformRequest,
    transformResponse,
  } = options;

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
    let headers: Record<string, string> = {};
    if (customHeaders) {
      headers = typeof customHeaders === 'function' ? await customHeaders() : customHeaders;
    }

    // Make HTTP request
    const request: RPCRequest = {
      path: operation.path,
      type: operation.type as ProcedureType,
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

    const data: RPCResponse = await response.json();

    let result: OperationResult;
    if (data.error) {
      result = {
        error: data.error,
      };
    } else {
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

// ============================================================================
// WebSocket Link
// ============================================================================

export interface WebSocketLinkOptions {
  /** WebSocket URL */
  url: string;
  /** Custom WebSocket implementation */
  WebSocket?: typeof WebSocket;
  /** Reconnection options */
  reconnect?: {
    enabled?: boolean;
    maxAttempts?: number;
    delay?: number;
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
export function createWebSocketLink(options: WebSocketLinkOptions): Link {
  const { WebSocketConnection } = require('./subscriptions.js');
  const connection = new WebSocketConnection({
    url: options.url,
    WebSocketImpl: options.WebSocket,
    reconnect: options.reconnect,
  });

  connection.connect();

  return async ({ op }: { op: Operation }) => {
    if (op.type !== 'subscription') {
      throw new Error('WebSocket link only supports subscriptions');
    }

    // For subscriptions, we need to return a special result that includes
    // an observable-like interface
    return {
      data: {
        subscribe: (observer: any) => {
          return connection.subscribe(
            op.id,
            op.path,
            op.input,
            observer
          );
        },
      },
    };
  };
}

// ============================================================================
// Split Link
// ============================================================================

export interface SplitLinkOptions {
  /** Condition to determine which link to use */
  condition: (op: Operation) => boolean;
  /** Link to use if condition is true */
  true: Link;
  /** Link to use if condition is false */
  false: Link;
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
export function createSplitLink(options: SplitLinkOptions): Link {
  const { condition, true: trueLink, false: falseLink } = options;

  return async (ctx) => {
    const useTrue = condition(ctx.op);
    const selectedLink = useTrue ? trueLink : falseLink;
    return selectedLink(ctx);
  };
}

// ============================================================================
// Batch Link
// ============================================================================

export interface BatchLinkOptions {
  /** Maximum batch size */
  maxBatchSize?: number;
  /** Batch window in milliseconds */
  batchWindowMs?: number;
  /** HTTP link for batched requests */
  httpLink: Link;
}

interface BatchedOperation {
  op: Operation;
  resolve: (result: OperationResult) => void;
  reject: (error: Error) => void;
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
export function createBatchLink(options: BatchLinkOptions): Link {
  const {
    maxBatchSize = 100,
    batchWindowMs = 10,
    httpLink,
  } = options;

  let pendingOperations: BatchedOperation[] = [];
  let batchTimeout: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    batchTimeout = null;
    const operations = pendingOperations;
    pendingOperations = [];

    if (operations.length === 0) return;

    // If only one operation, send it directly
    if (operations.length === 1) {
      const { op, resolve, reject } = operations[0]!;
      try {
        const result = await httpLink({ op, next: async () => ({ data: undefined }) });
        resolve(result);
      } catch (error) {
        reject(error as Error);
      }
      return;
    }

    // Batch multiple operations
    // Note: This requires server support for batching
    try {
      const batchOp: Operation = {
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

      if (result.data && Array.isArray((result.data as any).responses)) {
        const responses = (result.data as any).responses as OperationResult[];
        for (let i = 0; i < operations.length; i++) {
          operations[i]!.resolve(responses[i]!);
        }
      } else {
        throw new Error('Invalid batch response');
      }
    } catch (error) {
      for (const op of operations) {
        op.reject(error as Error);
      }
    }
  };

  return async ({ op }) => {
    return new Promise<OperationResult>((resolve, reject) => {
      pendingOperations.push({ op, resolve, reject });

      if (pendingOperations.length >= maxBatchSize) {
        // Flush immediately if batch is full
        if (batchTimeout) {
          clearTimeout(batchTimeout);
        }
        flush();
      } else if (!batchTimeout) {
        // Schedule flush
        batchTimeout = setTimeout(flush, batchWindowMs);
      }
    });
  };
}

// ============================================================================
// Deduplication Link
// ============================================================================

export interface DeduplicationLinkOptions {
  /** Get deduplication key from operation */
  getKey?: (op: Operation) => string;
}

/**
 * Create a deduplication link to prevent duplicate in-flight requests.
 *
 * @example
 * ```ts
 * const dedupeLink = createDeduplicationLink();
 * ```
 */
export function createDeduplicationLink(options?: DeduplicationLinkOptions): Link {
  const { getKey = (op: Operation) => `${op.path}:${JSON.stringify(op.input)}` } = options ?? {};

  const inflightRequests = new Map<string, Promise<OperationResult>>();

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

// ============================================================================
// Retry Link
// ============================================================================

export interface RetryLinkOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
  /** Maximum delay between retries */
  maxDelay?: number;
  /** Condition to determine if operation should be retried */
  shouldRetry?: (error: OperationResult['error'], attempt: number) => boolean;
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
export function createRetryLink(options?: RetryLinkOptions): Link {
  const {
    maxAttempts = 3,
    retryDelay = 1000,
    backoffMultiplier = 1.5,
    maxDelay = 30000,
    shouldRetry = (error: OperationResult['error']) => {
      // Retry on network errors and specific error codes
      return error?.code === 'TIMEOUT' || error?.code === 'INTERNAL_SERVER_ERROR';
    },
  } = options ?? {};

  return async ({ op, next }) => {
    let lastError: OperationResult['error'] | undefined;
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
          const delay = Math.min(
            retryDelay * Math.pow(backoffMultiplier, attempt - 1),
            maxDelay
          );
          await new Promise<void>((resolve) => setTimeout(resolve, delay));
        }
      } catch (error: unknown) {
        lastError = {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        };

        if (!shouldRetry(lastError, attempt)) {
          return { error: lastError };
        }

        attempt++;

        if (attempt < maxAttempts) {
          const delay = Math.min(
            retryDelay * Math.pow(backoffMultiplier, attempt - 1),
            maxDelay
          );
          await new Promise<void>((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return { error: lastError! };
  };
}

// ============================================================================
// Logging Link
// ============================================================================

export interface LoggingLinkOptions {
  /** Enable logging */
  enabled?: boolean;
  /** Custom logger */
  logger?: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
  /** Log request */
  logRequest?: boolean;
  /** Log response */
  logResponse?: boolean;
  /** Log timing */
  logTiming?: boolean;
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
export function createLoggingLink(options?: LoggingLinkOptions): Link {
  const {
    enabled = true,
    logger = console,
    logRequest = true,
    logResponse = true,
    logTiming = true,
  } = options ?? {};

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
      } else {
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
export function createLinkChain(links: Link[]): Link {
  if (links.length === 0) {
    throw new Error('Link chain must have at least one link');
  }

  return async ({ op }) => {
    const executeChain = (index: number): Promise<OperationResult> => {
      if (index >= links.length) {
        throw new Error('Link chain ended without returning a result');
      }

      const link = links[index]!;
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
export function createTerminatingLink(
  handler: (op: Operation) => Promise<OperationResult>
): Link {
  return async ({ op }) => {
    return handler(op);
  };
}
