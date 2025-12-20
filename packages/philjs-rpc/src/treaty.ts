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

import type {
  Router,
  ProcedureDefinition,
  ProcedureType,
  APIDefinition,
  RPCError,
  RPCRequest,
  RPCResponse,
} from './types.js';

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Extract path parameters from a path string.
 * Examples:
 * - "/users/:id" => { id: string }
 * - "/posts/:postId/comments/:commentId" => { postId: string, commentId: string }
 */
export type ExtractPathParams<T extends string> = T extends `${infer _Start}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractPathParams<Rest>]: string }
  : T extends `${infer _Start}:${infer Param}`
  ? { [K in Param]: string }
  : {};

/**
 * Extract query parameter types from a procedure's input schema.
 */
export type ExtractQueryParams<TInput> = TInput extends { query?: infer Q }
  ? Q
  : TInput extends void
  ? never
  : TInput;

/**
 * Extract request body types from a procedure's input schema.
 */
export type ExtractBodyParams<TInput> = TInput extends { body?: infer B }
  ? B
  : TInput extends void
  ? never
  : TInput;

/**
 * Extract response type from a procedure.
 */
export type ExtractResponse<TProcedure> = TProcedure extends ProcedureDefinition<
  ProcedureType,
  unknown,
  infer TOutput,
  unknown
>
  ? TOutput
  : never;

/**
 * Extract input type from a procedure.
 */
export type ExtractInput<TProcedure> = TProcedure extends ProcedureDefinition<
  ProcedureType,
  infer TInput,
  unknown,
  unknown
>
  ? TInput
  : never;

/**
 * Determine if input is required (not void or undefined).
 */
export type IsInputRequired<TInput> = TInput extends void
  ? false
  : TInput extends undefined
  ? false
  : true;

// ============================================================================
// Request Configuration
// ============================================================================

/**
 * Request options for treaty calls.
 */
export interface TreatyRequestOptions {
  /** Request headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
  /** Retry configuration */
  retry?: {
    /** Number of retry attempts */
    count?: number;
    /** Delay between retries in milliseconds */
    delay?: number;
    /** Exponential backoff multiplier */
    backoff?: number;
    /** Retry only on specific status codes */
    statusCodes?: number[];
  };
  /** Upload/download progress callback */
  onProgress?: (progress: ProgressEvent) => void;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

/**
 * Treaty client configuration.
 */
export interface TreatyConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Default request options */
  defaults?: TreatyRequestOptions;
  /** Request interceptor - called before each request */
  onRequest?: (config: TreatyRequestConfig) => TreatyRequestConfig | Promise<TreatyRequestConfig>;
  /** Response interceptor - called after each successful response */
  onResponse?: <T>(response: T, config: TreatyRequestConfig) => T | Promise<T>;
  /** Error interceptor - called on request errors */
  onError?: (error: TreatyError, config: TreatyRequestConfig) => void | Promise<void>;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

/**
 * Request configuration passed to interceptors.
 */
export interface TreatyRequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeout?: number;
}

/**
 * Treaty error with additional context.
 */
export class TreatyError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly response?: unknown;
  public readonly config: TreatyRequestConfig;

  constructor(opts: {
    code: string;
    message: string;
    status?: number;
    response?: unknown;
    config: TreatyRequestConfig;
  }) {
    super(opts.message);
    this.name = 'TreatyError';
    this.code = opts.code;
    this.status = opts.status;
    this.response = opts.response;
    this.config = opts.config;
  }
}

// ============================================================================
// Treaty Method Types
// ============================================================================

/**
 * HTTP methods supported by treaty.
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

/**
 * Treaty method definition for procedures.
 */
export interface TreatyMethod<TInput, TOutput> {
  /**
   * Execute the request.
   */
  (input: TInput, options?: TreatyRequestOptions): Promise<TOutput>;

  /**
   * Execute GET request.
   */
  get: IsInputRequired<TInput> extends true
    ? (input: TInput, options?: TreatyRequestOptions) => Promise<TOutput>
    : (options?: TreatyRequestOptions) => Promise<TOutput>;

  /**
   * Execute POST request.
   */
  post: IsInputRequired<TInput> extends true
    ? (input: TInput, options?: TreatyRequestOptions) => Promise<TOutput>
    : (options?: TreatyRequestOptions) => Promise<TOutput>;

  /**
   * Execute PUT request.
   */
  put: IsInputRequired<TInput> extends true
    ? (input: TInput, options?: TreatyRequestOptions) => Promise<TOutput>
    : (options?: TreatyRequestOptions) => Promise<TOutput>;

  /**
   * Execute PATCH request.
   */
  patch: IsInputRequired<TInput> extends true
    ? (input: TInput, options?: TreatyRequestOptions) => Promise<TOutput>
    : (options?: TreatyRequestOptions) => Promise<TOutput>;

  /**
   * Execute DELETE request.
   */
  delete: IsInputRequired<TInput> extends true
    ? (input: TInput, options?: TreatyRequestOptions) => Promise<TOutput>
    : (options?: TreatyRequestOptions) => Promise<TOutput>;
}

// ============================================================================
// WebSocket Support
// ============================================================================

/**
 * WebSocket connection options.
 */
export interface WebSocketOptions {
  /** Protocols to use */
  protocols?: string | string[];
  /** Reconnect automatically on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in milliseconds */
  reconnectDelay?: number;
  /** Maximum reconnect attempts */
  maxReconnectAttempts?: number;
}

/**
 * WebSocket message handler.
 */
export interface WebSocketHandler<TMessage = unknown> {
  /** Called when connection opens */
  onOpen?: (event: Event) => void;
  /** Called when message is received */
  onMessage?: (data: TMessage) => void;
  /** Called when error occurs */
  onError?: (error: Event) => void;
  /** Called when connection closes */
  onClose?: (event: CloseEvent) => void;
}

/**
 * WebSocket connection.
 */
export interface TreatyWebSocket<TMessage = unknown, TSend = unknown> {
  /** Send message */
  send: (data: TSend) => void;
  /** Close connection */
  close: (code?: number, reason?: string) => void;
  /** Current connection state */
  readyState: number;
  /** Add event listener */
  addEventListener: WebSocket['addEventListener'];
  /** Remove event listener */
  removeEventListener: WebSocket['removeEventListener'];
}

// ============================================================================
// Treaty Client Type Builder
// ============================================================================

/**
 * Build treaty client type from router.
 */
export type BuildTreatyClient<TRouter extends Router, TPath extends string = ''> = {
  [K in keyof TRouter]: TRouter[K] extends ProcedureDefinition<
    infer _TType,
    infer TInput,
    infer TOutput,
    unknown
  >
    ? TreatyMethod<TInput, TOutput>
    : TRouter[K] extends Router
    ? BuildTreatyClient<TRouter[K], TPath extends '' ? K & string : `${TPath}.${K & string}`> & {
        /**
         * Call with path parameters.
         */
        (params: Record<string, string | number>): BuildTreatyClient<TRouter[K], TPath extends '' ? K & string : `${TPath}.${K & string}`>;
      }
    : never;
};

// ============================================================================
// Request Implementation
// ============================================================================

/**
 * Execute a request with retry logic.
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retryConfig?: TreatyRequestOptions['retry']
): Promise<T> {
  const {
    count = 0,
    delay = 1000,
    backoff = 2,
    statusCodes = [408, 429, 500, 502, 503, 504],
  } = retryConfig ?? {};

  let lastError: unknown;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= count; attempt++) {
    try {
      return await fn();
    } catch (error) {
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
async function createTimeoutRequest<T>(
  fn: () => Promise<T>,
  timeout?: number,
  signal?: AbortSignal
): Promise<T> {
  if (!timeout && !signal) {
    return fn();
  }

  const controller = new AbortController();
  const combinedSignal = signal ? combineAbortSignals(signal, controller.signal) : controller.signal;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (timeout) {
    timeoutId = setTimeout(() => controller.abort(), timeout);
  }

  try {
    const result = await fn();
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Combine multiple AbortSignals.
 */
function combineAbortSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
  const controller = new AbortController();

  const abort = () => controller.abort();

  signal1.addEventListener('abort', abort);
  signal2.addEventListener('abort', abort);

  return controller.signal;
}

/**
 * Make an HTTP request.
 */
async function makeRequest<T>(
  config: TreatyRequestConfig & { fetch?: typeof fetch },
  globalConfig: TreatyConfig
): Promise<T> {
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
      body: finalConfig.body ? JSON.stringify(finalConfig.body) : undefined,
      signal: finalConfig.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new TreatyError({
        code: errorData.code ?? 'HTTP_ERROR',
        message: errorData.message ?? `HTTP ${response.status}: ${response.statusText}`,
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
    let result: T;
    if (data && typeof data === 'object' && 'result' in data) {
      result = data.result.data as T;
    } else if (data && typeof data === 'object' && 'error' in data) {
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
    } else {
      result = data as T;
    }

    // Apply response interceptor
    if (globalConfig.onResponse) {
      result = await globalConfig.onResponse(result, finalConfig);
    }

    return result;
  } catch (error) {
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
export function treaty<TApi extends APIDefinition>(
  baseUrl: string,
  config?: Omit<TreatyConfig, 'baseUrl'>
): BuildTreatyClient<TApi['_router']> {
  const globalConfig: TreatyConfig = {
    baseUrl,
    ...config,
  };

  /**
   * Create a method handler for a specific HTTP method.
   */
  function createMethodHandler<TInput, TOutput>(
    path: string,
    method: string
  ): (input?: TInput, options?: TreatyRequestOptions) => Promise<TOutput> {
    return async (input?: TInput, options?: TreatyRequestOptions) => {
      const mergedOptions = {
        ...globalConfig.defaults,
        ...options,
      };

      const requestConfig: TreatyRequestConfig & { fetch?: typeof fetch } = {
        url: `${globalConfig.baseUrl}/${path}`,
        method: method.toUpperCase(),
        headers: mergedOptions.headers ?? {},
        body: input,
        signal: mergedOptions.signal,
        timeout: mergedOptions.timeout,
        fetch: mergedOptions.fetch,
      };

      const executeRequest = async () => {
        return createTimeoutRequest(
          () => makeRequest<TOutput>(requestConfig, globalConfig),
          mergedOptions.timeout,
          mergedOptions.signal
        );
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
  function createWebSocket<TMessage = unknown, TSend = unknown>(
    path: string,
    handler: WebSocketHandler<TMessage>,
    options?: WebSocketOptions
  ): TreatyWebSocket<TMessage, TSend> {
    const wsUrl = globalConfig.baseUrl.replace(/^http/, 'ws') + '/' + path;
    const ws = new WebSocket(wsUrl, options?.protocols);

    let reconnectAttempts = 0;
    const maxAttempts = options?.maxReconnectAttempts ?? 5;
    const reconnectDelay = options?.reconnectDelay ?? 1000;

    const setupHandlers = (socket: WebSocket) => {
      if (handler.onOpen) {
        socket.addEventListener('open', handler.onOpen);
      }

      if (handler.onMessage) {
        socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            handler.onMessage!(data);
          } catch {
            handler.onMessage!(event.data as TMessage);
          }
        });
      }

      if (handler.onError) {
        socket.addEventListener('error', handler.onError);
      }

      if (handler.onClose) {
        socket.addEventListener('close', (event) => {
          handler.onClose!(event);

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
      send: (data: TSend) => {
        ws.send(JSON.stringify(data));
      },
      close: (code?: number, reason?: string) => {
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
  function buildProxy(path: string[] = [], params: Record<string, string | number> = {}): unknown {
    const proxyFn = (newParams: Record<string, string | number>) => {
      return buildProxy(path, { ...params, ...newParams });
    };

    return new Proxy(proxyFn as unknown as object, {
      get(_, key: string) {
        // HTTP method handlers
        const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
        if (httpMethods.includes(key.toLowerCase())) {
          const fullPath = path.join('.');
          let finalPath = fullPath;

          // Replace path parameters
          for (const [paramKey, paramValue] of Object.entries(params)) {
            finalPath = finalPath.replace(`:${paramKey}`, String(paramValue));
          }

          return createMethodHandler(finalPath, key);
        }

        // Special methods
        if (key === 'ws' || key === 'websocket') {
          return (handler: WebSocketHandler, options?: WebSocketOptions) => {
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

      apply(_, __, args: [Record<string, string | number>]) {
        // Handle function call for path parameters
        return buildProxy(path, { ...params, ...args[0] });
      },
    });
  }

  return buildProxy() as BuildTreatyClient<TApi['_router']>;
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
export function createTreatyClient<TApi extends APIDefinition>(config: TreatyConfig) {
  const client = treaty<TApi>(config.baseUrl, config);

  return {
    client,
    utils: {
      /**
       * Create a batch request.
       */
      batch: async <T extends readonly unknown[]>(
        requests: {
          [K in keyof T]: () => Promise<T[K]>;
        }
      ): Promise<T> => {
        return Promise.all(requests.map((fn) => fn())) as unknown as Promise<T>;
      },

      /**
       * Create a custom request.
       */
      request: async <TResponse>(
        path: string,
        options?: {
          method?: string;
          body?: unknown;
          headers?: Record<string, string>;
        } & TreatyRequestOptions
      ): Promise<TResponse> => {
        const requestConfig: TreatyRequestConfig & { fetch?: typeof fetch } = {
          url: `${config.baseUrl}/${path}`,
          method: options?.method ?? 'GET',
          headers: options?.headers ?? {},
          body: options?.body,
          signal: options?.signal,
          timeout: options?.timeout,
          fetch: options?.fetch,
        };

        return makeRequest<TResponse>(requestConfig, config);
      },
    },
  };
}

/**
 * Helper to infer the client type from an API.
 */
export type InferTreatyClient<TApi extends APIDefinition> = BuildTreatyClient<TApi['_router']>;
